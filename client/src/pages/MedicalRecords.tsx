import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon, EyeIcon, ArrowDownTrayIcon, XMarkIcon, CalendarIcon,
  ClockIcon, ClipboardDocumentListIcon, BeakerIcon, FunnelIcon, CheckCircleIcon,
  ClipboardDocumentCheckIcon, FireIcon, ArrowPathIcon, PlayIcon, ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { generatePrescriptionPdf } from '../services/prescriptionPdfService';
import PrescriptionView from '../components/PrescriptionView';
import MedicineHistory from '../components/MedicineHistory';
import { getDepartmentLabel } from '../utils/departments';
import { calculateAge, formatAge, formatGender } from '../utils/dateUtils';
import { Reveal } from '../components/landing/AnimatedSection';

interface AppointmentMedicalRecord {
  id: number; appointmentDate: string; appointmentTime: string; serialNumber: number;
  type: string; status: string; reason: string; symptoms: string; notes: string;
  diagnosis: string; prescription: string; startedAt: string; completedAt: string;
  doctor: { id: number; department: string; experience: number; bmdcRegistrationNumber: string; user: { firstName: string; lastName: string; }; };
  patient: {
    id: number; bloodType: string; allergies: string; medicalHistory: string; currentMedications: string;
    height?: number; weight?: number; bloodPressure?: string; pulse?: number; chronicConditions?: string; pastSurgeries?: string;
    familyMedicalHistory?: string; smokingStatus?: string; alcoholConsumption?: string; physicalActivity?: string; emergencyContact: string; emergencyPhone: string;
    medicalDocuments?: Array<{ id: string; name: string; url: string; type: string; uploadDate: string; }>;
    user: { firstName: string; lastName: string; email: string; phone: string; dateOfBirth?: string; gender?: string; };
  };
}

interface PrescriptionData { id: number; appointmentId: number; symptoms?: string | any[]; diagnoses?: string | any[]; medicines?: string | any[]; tests?: string | any[]; suggestions?: string | any; createdAt: string; }
interface ClinicalFinding { title: string; status: 'Normal' | 'Caution' | 'Critical'; reason: string; source: string; date?: string | null; }
interface ClinicalMedication { name: string; dosage?: string; instructions?: string; frequency?: string; status?: string; }
interface SpecialistReferral { specialist: string; reason: string; urgency: 'Routine' | 'Soon' | 'Urgent'; }
interface LifestyleRecommendation { category: string; action: string; reason: string; }
interface AttentionArea { area: string; detail: string; }

interface LlamaClinicalInsight {
  overallStatus: 'Normal' | 'Caution' | 'Critical'; summary: string; improved: string[]; worsened: string[]; stable: string[];
  activeMedications: ClinicalMedication[]; keyFindings: ClinicalFinding[]; specialistReferrals?: SpecialistReferral[];
  lifestyleRecommendations?: LifestyleRecommendation[]; attentionAreas?: AttentionArea[]; followUpConsiderations: string[];
}

interface MedicalSummary {
  aiClinicalNarrative: string; aiClinicalNarrativeModel?: string; llamaClinicalInsight?: LlamaClinicalInsight; llamaReasoningModel?: string;
  cacheMeta?: { analyzedDocuments?: number; analyzedCount?: number; freshlyExtracted?: number; reusableCount?: number; legacyCount?: number; upgradedCount?: number; deferredCount?: number; failedCount?: number; };
  summarizedDiagnoses: any[]; recentSymptoms: any[]; recentMedications: ClinicalMedication[]; recentLabResults: any[];
  allLabResultsSummary?: {
    totalReports: number; totalFindings: number; criticalCount: number; cautionCount: number; normalCount: number;
    highlightedFindings: Array<{ test: string; value: string | number; unit?: string; status: 'Normal' | 'Caution' | 'Critical'; rawStatus?: string; referenceRange?: string; date?: string | null; source?: string; reportName?: string; }>;
  };
}

const MedicalRecords: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [recordTypeFilter, setRecordTypeFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<AppointmentMedicalRecord | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'appointments' | 'medicines'>('summary');
  const [isDownloading, setIsDownloading] = useState<number | null>(null);

  const { data: patientProfile } = useQuery({ queryKey: ['patient-profile'], queryFn: async () => { const res = await API.get('/patients/profile'); return res.data.data.patient; }, enabled: user?.role === 'patient', });
  const { data: appointments, isLoading } = useQuery<AppointmentMedicalRecord[]>({ queryKey: ['patient-appointments', patientProfile?.id], queryFn: async () => { const res = await API.get('/appointments'); return res.data.data.appointments.filter((apt: any) => apt.status === 'completed') || []; }, enabled: !!patientProfile?.id, refetchInterval: 10000, });
  const { data: medicalSummary, isLoading: isLoadingSummary, isFetching: isFetchingSummary, refetch: refetchSummary } = useQuery<MedicalSummary>({ queryKey: ['patient-medical-summary', patientProfile?.id], queryFn: async () => { const res = await API.get(`/patients/${patientProfile?.id}/medical-summary`); return res.data.data.summary; }, enabled: !!patientProfile?.id, staleTime: 0, gcTime: 60_000, refetchOnWindowFocus: true, });

  const { mutate: reanalyzeWithLlama, isPending: isReanalyzing } = useMutation({
    mutationFn: async () => { const res = await API.get(`/patients/${patientProfile?.id}/medical-summary`, { params: { reanalyze: 'true' } }); return res.data.data.summary as MedicalSummary; },
    onSuccess: (updatedSummary) => { queryClient.setQueryData(['patient-medical-summary', patientProfile?.id], updatedSummary); toast.success('Documents analyzed. Click again if more remain.'); },
    onError: () => { toast.error('Could not re-analyze documents right now. Please try again.'); }
  });

  const filteredAppointments = appointments?.filter((apt) => {
    if (recordTypeFilter === 'all') return true;
    if (recordTypeFilter === 'consultation') return apt.type === 'in_person' || apt.type === 'telemedicine';
    if (recordTypeFilter === 'follow_up') return apt.type === 'follow_up';
    return true;
  }) || [];

  const handleViewDetails = async (appointment: AppointmentMedicalRecord) => {
    setSelectedRecord(appointment); setShowDetailModal(true);
    try { const res = await API.get(`/prescriptions/appointment/${appointment.id}`); setPrescriptionData(res.data.data.prescription); }
    catch (e) { setPrescriptionData(null); }
  };

  const handleDownload = async (appointment: AppointmentMedicalRecord | null) => {
    if (!appointment) return; setIsDownloading(appointment.id);
    try {
      let pData = null;
      try { const res = await API.get(`/prescriptions/appointment/${appointment.id}`); pData = res.data?.data?.prescription || null; } catch (e) {}
      await generatePrescriptionPdf({ prescriptionData: pData, appointmentData: appointment });
    } catch (e: any) {
      if (e.message?.toLowerCase().includes('popup')) toast.error('Please allow pop-ups for this site, then try downloading again.');
      else toast.error('Failed to generate prescription PDF.');
    } finally { setIsDownloading(null); }
  };

  const getAppointmentTypeLabel = (type: string) => {
    switch (type) { case 'in_person': return 'In Person'; case 'telemedicine': return 'Telemedicine'; case 'follow_up': return 'Follow-up'; default: return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()); }
  };

  const getInsightStatusStyles = (status?: string) => {
    switch (status) { case 'Critical': return 'bg-rose-50 text-rose-700 border-rose-200'; case 'Caution': return 'bg-amber-50 text-amber-700 border-amber-200'; default: return 'bg-emerald-50 text-emerald-700 border-emerald-200'; }
  };

  const getLabStatus = (status?: string) => {
    const n = String(status || '').toLowerCase();
    if (n === 'critical') return 'Critical';
    if (['abnormal', 'high', 'low', 'caution'].includes(n)) return 'Caution';
    return 'Normal';
  };

  const calcDuration = (start: string, end: string) => {
    const diffMins = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    const h = Math.floor(diffMins / 60); const m = diffMins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const tabs = [
    { key: 'summary' as const, label: 'Medical Summary', icon: ClipboardDocumentCheckIcon },
    { key: 'appointments' as const, label: 'Visit History', icon: CalendarIcon },
    { key: 'medicines' as const, label: 'Medicine Tracker', icon: BeakerIcon },
  ];

  return (
    <div className="min-h-screen bg-[#fafbff] relative font-sans noise-overlay">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -left-[10%] w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* PREMIUM MASTER HEADER */}
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-slate-900 px-8 py-12 md:px-14 text-white shadow-2xl group">
            <div className="absolute top-0 right-0 w-1/3 h-full">
              <div className="absolute inset-0 bg-gradient-to-l from-violet-500/10 via-transparent to-transparent" />
              <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-violet-400/20 rounded-full blur-[80px]" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">Clinical Engine</span>
                  <span className="px-3 py-1 bg-violet-500/20 text-violet-300 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-violet-400/20">AI Synchronized</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
                  Medical <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-300 to-indigo-300 animate-gradient-shift italic">Chronicle.</span>
                </h1>
                <p className="text-slate-400 font-medium max-w-xl text-lg">
                  Access your unified clinical history securely. Advanced AI synthesizes your past visits, prescriptions, and lab semantics into clear insights.
                </p>
              </div>
              
              <div className="hidden md:flex items-center justify-center">
                <div className="w-32 h-32 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 group-hover:scale-110 transition-transform duration-700" />
                  <ShieldCheckIcon className="h-14 w-14 text-violet-300 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* PREMIUM TAB DISPATCHER */}
        <Reveal delay={0.1}>
          <div className="bg-white rounded-[24px] border border-slate-100 p-2 shadow-sm flex items-center md:inline-flex w-full md:w-auto mx-auto overflow-x-auto scrollbar-none">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-4 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all duration-300 shrink-0 ${activeTab === key ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
                <Icon className={`h-5 w-5 ${activeTab === key ? 'text-violet-400' : ''}`} />
                {label}
              </button>
            ))}
          </div>
        </Reveal>

        {/* ══════════════════════════════════════════
            TAB: MEDICAL SUMMARY (Llama Driven)
        ══════════════════════════════════════════ */}
        {activeTab === 'summary' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">AI Clinical Reconciliation</h2>
                <p className="text-slate-400 font-medium text-sm">Aggregated snapshot powered by LLaMA reasoning engine.</p>
              </div>
              <button onClick={() => refetchSummary()} disabled={isFetchingSummary}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-violet-50 text-violet-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-100 transition-all disabled:opacity-50">
                <ArrowPathIcon className={`h-4 w-4 ${isFetchingSummary ? 'animate-spin' : ''}`} /> {isFetchingSummary ? 'Syncing Vault...' : 'Run Diagnostics'}
              </button>
            </div>

            {isLoadingSummary ? (
              <div className="bg-white rounded-[32px] border border-slate-100 py-32 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-[20px] border-4 border-violet-100 border-t-violet-600 animate-spin flex items-center justify-center mb-6">
                  <div className="w-6 h-6 rounded-lg bg-violet-600/20" />
                </div>
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">Synthesizing clinical vectors...</p>
              </div>
            ) : medicalSummary ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* CACHE & META ALERTS */}
                <div className="col-span-full space-y-4">
                  {(medicalSummary?.cacheMeta?.deferredCount ?? 0) > 0 && <AlertBanner color="amber" title={`${medicalSummary.cacheMeta!.deferredCount} Docs Pending Analysis`} body="Dossier queue optimization paused. Extract remaining semantics." action="Batch Extract" loading={isReanalyzing} onAction={() => reanalyzeWithLlama()} />}
                  {(medicalSummary?.cacheMeta?.deferredCount ?? 0) === 0 && (medicalSummary?.cacheMeta?.legacyCount ?? 0) > 0 && <AlertBanner color="indigo" title="Architecture Upgrade Available" body={`${medicalSummary.cacheMeta!.legacyCount} semantics isolated via legacy model. Update cache array.`} action="Re-Compile" loading={isReanalyzing} onAction={() => reanalyzeWithLlama()} />}
                  {(medicalSummary?.cacheMeta?.failedCount ?? 0) > 0 && <AlertBanner color="rose" title={`${medicalSummary.cacheMeta!.failedCount} Extraction Misses`} body="OCR parsing latency timed out on subset. Attempt recovery." action="Force Recovery" loading={isReanalyzing} onAction={() => reanalyzeWithLlama()} />}
                </div>

                {/* LEFT COLUMN: INSIGHTS & STATS */}
                <div className="col-span-1 lg:col-span-8 space-y-6">
                  {medicalSummary?.llamaClinicalInsight ? (
                    <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm shadow-violet-500/5 relative group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-bl-full pointer-events-none group-hover:bg-violet-500/10 transition-colors duration-700" />
                      
                      <div className="p-8 md:p-10 relative z-10">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-[20px] bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                              <FireIcon className="h-7 w-7 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Chief Narrative</h3>
                              <p className="text-[10px] font-black uppercase tracking-widest text-violet-500">
                                {medicalSummary.llamaReasoningModel || 'Autonomous Evaluation Engine'}
                              </p>
                            </div>
                          </div>
                          <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getInsightStatusStyles(medicalSummary.llamaClinicalInsight.overallStatus)}`}>
                            Condition: {medicalSummary.llamaClinicalInsight.overallStatus}
                          </span>
                        </div>

                        <p className="text-lg text-slate-600 font-medium leading-relaxed bg-slate-50 p-6 rounded-[24px] mb-8 border border-slate-100">
                          {medicalSummary.llamaClinicalInsight.summary}
                        </p>

                        {medicalSummary.aiClinicalNarrative && medicalSummary.aiClinicalNarrative !== medicalSummary.llamaClinicalInsight.summary && (
                          <div className="mb-8 p-6 bg-indigo-50/20 border border-indigo-100 rounded-[24px]">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Extended Narrative Extract</p>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed">{medicalSummary.aiClinicalNarrative}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                          <InsightList title="Positive Vectors" icon="↗" items={medicalSummary.llamaClinicalInsight.improved} colorClass="bg-emerald-50 border-emerald-100 text-emerald-800" hColor="text-emerald-600" />
                          <InsightList title="Clinical Flags" icon="!" items={medicalSummary.llamaClinicalInsight.worsened} colorClass="bg-amber-50 border-amber-100 text-amber-800" hColor="text-amber-600" />
                          <InsightList title="Stable State" icon="↔" items={medicalSummary.llamaClinicalInsight.stable} colorClass="bg-slate-50 border-slate-100 text-slate-700" hColor="text-slate-500" />
                        </div>

                        <div className="space-y-6">
                          {medicalSummary.llamaClinicalInsight.lifestyleRecommendations?.length ? (
                            <div className="pt-6 border-t border-slate-100">
                              <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Lifestyle Remediation</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {medicalSummary.llamaClinicalInsight.lifestyleRecommendations.map((rec, i) => (
                                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white border border-slate-100 rounded-2xl p-4 hover:border-emerald-200 transition-colors">
                                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 w-fit">{rec.category}</div>
                                    <div className="flex-1">
                                      <p className="font-bold text-slate-900 text-sm mb-0.5">{rec.action}</p>
                                      {rec.reason && <p className="text-xs text-slate-500 font-medium">{rec.reason}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {medicalSummary.llamaClinicalInsight.attentionAreas?.length ? (
                            <div className="pt-6 border-t border-slate-100">
                              <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"/> Priority Review</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {medicalSummary.llamaClinicalInsight.attentionAreas.map((it, i) => (
                                  <div key={i} className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4">
                                    <p className="font-bold text-slate-900 text-sm mb-1">{it.area}</p>
                                    <p className="text-xs text-slate-600 font-medium">{it.detail}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {medicalSummary.llamaClinicalInsight.specialistReferrals?.length ? (
                            <div className="pt-6 border-t border-slate-100">
                              <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"/> Directed Referrals</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {medicalSummary.llamaClinicalInsight.specialistReferrals.map((ref, i) => (
                                  <div key={i} className="bg-white border border-indigo-100 rounded-2xl p-4 flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-2">
                                      <p className="font-bold text-indigo-950">{ref.specialist}</p>
                                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${ref.urgency === 'Urgent' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-50 text-indigo-600'}`}>{ref.urgency}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">{ref.reason}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {medicalSummary.llamaClinicalInsight.activeMedications?.length ? (
                            <div className="pt-6 border-t border-slate-100">
                              <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-violet-500"/> Clinical Medications (AI Summarized)</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {medicalSummary.llamaClinicalInsight.activeMedications.map((med, i) => (
                                  <div key={i} className="bg-violet-50/30 border border-violet-100 rounded-2xl p-4">
                                    <div className="flex justify-between items-start mb-1">
                                      <p className="font-bold text-slate-900 text-sm">{med.name}</p>
                                      <span className="text-[9px] font-black uppercase tracking-widest text-violet-500">{med.dosage}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium">{med.instructions} · {med.frequency}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {medicalSummary.llamaClinicalInsight.followUpConsiderations?.length ? (
                            <div className="pt-6 border-t border-slate-100">
                              <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"/> Follow-Up Considerations</h4>
                              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                                <ul className="space-y-3">
                                  {medicalSummary.llamaClinicalInsight.followUpConsiderations.map((it, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700 font-medium">
                                      <CheckCircleIcon className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                      {it}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* RIGHT COLUMN: RECENT VECTORS & LABS */}
                <div className="col-span-1 lg:col-span-4 space-y-6">
                  {medicalSummary?.cacheMeta && (
                    <div className="grid grid-cols-2 gap-3">
                      <StatTile label="Total Semantics" value={medicalSummary.cacheMeta.analyzedDocuments ?? '—'} color="indigo" />
                      <StatTile label="Ingested" value={medicalSummary.cacheMeta.analyzedCount ?? (medicalSummary.cacheMeta.reusableCount ?? 0)} color="emerald" />
                      {medicalSummary.cacheMeta.deferredCount! > 0 && <StatTile label="Pending" value={medicalSummary.cacheMeta.deferredCount} color="amber" />}
                    </div>
                  )}

                  <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6 flex items-center gap-2"><BeakerIcon className="h-5 w-5 text-indigo-500" /> Lab Forensics</h3>
                    {medicalSummary?.recentLabResults?.length ? (
                      <div className="space-y-4">
                        {medicalSummary.allLabResultsSummary?.highlightedFindings?.slice(0, 5).map((f, i) => (
                          <div key={i} className="bg-slate-50 border border-slate-100 rounded-[20px] p-4 relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-indigo-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex justify-between items-start mb-2">
                              <p className="font-bold text-slate-900 text-sm truncate pr-2">{f.test}</p>
                              <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getInsightStatusStyles(f.status)}`}>{f.status}</span>
                            </div>
                            <div className="flex items-baseline gap-1 mb-1">
                              <span className="font-black text-lg text-slate-900 leading-none">{f.value}</span>
                              <span className="text-[10px] font-bold text-slate-400">{f.unit}</span>
                            </div>
                            {f.referenceRange && <p className="text-[9px] text-slate-400 font-medium mb-1">REF: {f.referenceRange}</p>}
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{f.reportName || f.source}</p>
                          </div>
                        ))}

                        {medicalSummary.recentLabResults.map((lab: any, idx: number) => (
                          <div key={`full-${idx}`} className="pt-4 border-t border-slate-100">
                             <div className="flex justify-between items-start mb-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lab.testNames?.slice(0, 30) || 'Dossier Extract'}</p>
                                <span className="text-[9px] font-bold text-indigo-500">{new Date(lab.date).toLocaleDateString()}</span>
                             </div>
                             {lab.findings?.length > 0 && (
                               <div className="flex flex-wrap gap-1.5">
                                 {lab.findings.slice(0, 3).map((v:any, vi:number) => (
                                   <span key={vi} className="px-2 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-bold text-slate-600">
                                     {v.test}: {v.value}
                                   </span>
                                 ))}
                               </div>
                             )}
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sm font-medium text-slate-400 italic bg-slate-50 p-6 rounded-2xl text-center">No forensics data extracted.</p>}
                  </div>

                  {medicalSummary.llamaClinicalInsight?.keyFindings?.length ? (
                    <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                      <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6 flex items-center gap-2"><FireIcon className="h-5 w-5 text-orange-500" /> Key Observations</h3>
                      <div className="space-y-3">
                        {medicalSummary.llamaClinicalInsight.keyFindings.map((kf, i) => (
                          <div key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{kf.title}</p>
                              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${getInsightStatusStyles(kf.status)}`}>{kf.status}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-medium leading-tight">{kf.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight mb-6 flex items-center gap-2"><DocumentTextIcon className="h-5 w-5 text-indigo-500" /> Recent Entities</h3>
                    <div className="space-y-6">
                      <div>
                         <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">Identified Conditions</p>
                         {medicalSummary?.summarizedDiagnoses?.length ? (
                           <div className="flex flex-wrap gap-2">
                             {medicalSummary.summarizedDiagnoses.slice(0, 5).map((d: any, i: number) => (
                               <span key={i} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs font-bold rounded-xl truncate max-w-full">
                                 {typeof d === 'object' ? (d?.condition || d?.diagnosis || 'Unknown') : d}
                               </span>
                             ))}
                           </div>
                         ) : <span className="text-xs text-slate-400">None extracted.</span>}
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3">Reported Symptoms</p>
                         {medicalSummary?.recentSymptoms?.length ? (
                           <div className="flex flex-wrap gap-2">
                             {medicalSummary.recentSymptoms.slice(0, 5).map((s: any, i: number) => (
                               <span key={i} className="px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-900 text-xs font-bold rounded-xl truncate max-w-full">
                                 {typeof s === 'object' ? (s?.symptom || s?.name || 'Unknown') : s}
                               </span>
                             ))}
                           </div>
                         ) : <span className="text-xs text-slate-400">None extracted.</span>}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            ) : null}
          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            TAB: APPOINTMENT HISTORY
        ══════════════════════════════════════════ */}
        {activeTab === 'appointments' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-white rounded-[24px] border border-slate-100 p-2 shadow-sm flex flex-col md:flex-row items-center gap-2">
              <div className="w-full md:w-auto p-4 md:px-6 md:border-r border-slate-100 flex items-center gap-3 shrink-0">
                <FunnelIcon className="h-5 w-5 text-slate-400" />
                <span className="font-black text-xs text-slate-900 uppercase tracking-widest">Type Filter</span>
              </div>
              <div className="w-full md:w-auto px-2 pb-2 md:pb-0">
                <select value={recordTypeFilter} onChange={e => setRecordTypeFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 placeholder-slate-400 text-slate-900 text-xs font-bold px-5 py-4 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none appearance-none cursor-pointer">
                  <option value="all">Every Visit</option>
                  <option value="consultation">Initial Consultations</option>
                  <option value="follow_up">Follow Up Tracking</option>
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-[32px] border border-slate-100 py-32 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-[20px] border-4 border-slate-100 border-t-slate-600 animate-spin mb-6" />
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">Retrieving dossiers...</p>
              </div>
            ) : filteredAppointments.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {filteredAppointments.map((apt, i) => (
                  <Reveal key={apt.id} delay={i * 0.05}>
                    <div className="bg-white border border-slate-100 rounded-[28px] p-6 sm:p-8 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-bl-full pointer-events-none group-hover:bg-indigo-50 transition-colors" />
                      
                      <div className="flex gap-6 items-start md:items-center relative z-10 w-full md:w-auto">
                        <div className="w-20 h-20 rounded-[24px] bg-slate-50 border border-slate-100 flex flex-col items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{new Date(apt.appointmentDate).toLocaleDateString('en-US', { month: 'short' })}</span>
                          <span className="text-3xl font-black text-slate-900 leading-none">{new Date(apt.appointmentDate).getDate()}</span>
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                            Dr. {apt.doctor.user.firstName} {apt.doctor.user.lastName}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2">
                             <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500">{getDepartmentLabel(apt.doctor.department)}</span>
                             <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><ClockIcon className="h-3 w-3" /> {apt.appointmentTime}</span>
                             <span className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500">#{apt.serialNumber}</span>
                          </div>
                          {(apt.reason || apt.diagnosis) && (
                            <p className="text-sm font-medium text-slate-600 line-clamp-1 max-w-lg pr-4">
                              <span className="font-bold text-slate-900">Chief Rx: </span> {apt.diagnosis || apt.reason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto relative z-10 pl-[104px] md:pl-0">
                        <button onClick={() => handleViewDetails(apt)}
                          className="flex-1 md:flex-none h-12 px-6 bg-slate-900 text-white rounded-[16px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl">
                          <EyeIcon className="h-4 w-4" /> Open Dossier
                        </button>
                        <button onClick={() => handleDownload(apt)} disabled={isDownloading === apt.id}
                          className="w-12 h-12 rounded-[16px] bg-white border border-slate-200 text-slate-500 flex items-center justify-center hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all disabled:opacity-50">
                          <ArrowDownTrayIcon className={`h-5 w-5 ${isDownloading === apt.id ? 'animate-bounce text-indigo-600' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            ) : (
             <div className="bg-white rounded-[32px] border border-slate-100 p-16 text-center shadow-sm">
                <div className="w-24 h-24 bg-slate-50 rounded-[28px] mx-auto flex items-center justify-center mb-6">
                  <DocumentTextIcon className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Vault Empty</h3>
                <p className="text-slate-400 font-medium">Completed medical sessions will be permanently archived here.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            TAB: MEDICINES (Component passthrough)
        ══════════════════════════════════════════ */}
        {activeTab === 'medicines' && patientProfile?.id && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 p-8 sm:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full pointer-events-none" />
                <div className="relative z-10">
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Active Tracker</h2>
                   <p className="text-slate-500 font-medium mb-10">Systematic logging of pharmaceutical adherence.</p>
                   <MedicineHistory patientId={patientProfile.id} />
                </div>
             </div>
          </motion.div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          DOSSIER EXPANSION MODAL
      ══════════════════════════════════════════ */}
      <AnimatePresence>
      {showDetailModal && selectedRecord && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex justify-center items-center p-4 bg-slate-900/60 backdrop-blur-md">
          <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[32px] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden ring-1 ring-white/20">
            
            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm flex items-center justify-between z-20 shrink-0">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                     <ShieldCheckIcon className="h-6 w-6 text-slate-900" />
                  </div>
                  <div>
                     <h2 className="text-xl font-black text-slate-900 tracking-tight">Clinical Extract</h2>
                     <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Archived Segment #{selectedRecord.serialNumber}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                  <button onClick={() => handleDownload(selectedRecord)} disabled={isDownloading === selectedRecord.id}
                     className="hidden sm:flex items-center gap-2 h-10 px-4 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50">
                     <ArrowDownTrayIcon className="h-4 w-4" /> Save
                  </button>
                  <button onClick={() => setShowDetailModal(false)} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm">
                     <XMarkIcon className="h-5 w-5" />
                  </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 space-y-8 bg-white relative">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  
                  <div className="lg:col-span-1 space-y-6">
                     <DetailCard title="Patient Profile">
                        <InfoRow label="Identity" value={`${selectedRecord.patient?.user?.firstName} ${selectedRecord.patient?.user?.lastName}`} />
                        <InfoRow label="Age / Sex" value={`${formatAge(calculateAge(selectedRecord.patient?.user?.dateOfBirth))} · ${formatGender(selectedRecord.patient?.user?.gender)}`} />
                        <InfoRow label="Contact" value={selectedRecord.patient?.user?.phone || selectedRecord.patient?.user?.email} />
                     </DetailCard>
                     
                     <DetailCard title="Session Bio-Metrics">
                        <div className="grid grid-cols-2 gap-3">
                           <VitalTile label="B/P" value={selectedRecord.patient?.bloodPressure || '—'} color="violet" />
                           <VitalTile label="Pulse" value={selectedRecord.patient?.pulse ? `${selectedRecord.patient.pulse}` : '—'} color="rose" />
                           <VitalTile label="Mass" value={selectedRecord.patient?.weight ? `${selectedRecord.patient.weight}kg` : '—'} color="emerald" />
                           <VitalTile label="Type" value={selectedRecord.patient?.bloodType || '—'} color="blue" />
                        </div>
                     </DetailCard>
                  </div>

                  <div className="lg:col-span-2 space-y-6">
                     <div className="bg-slate-50 border border-slate-100 p-6 rounded-[24px]">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-200 pb-2">Encounter Overview</h4>
                        <div className="grid grid-cols-2 gap-y-4">
                           <InfoRow label="Medical Officer" value={`Dr. ${selectedRecord.doctor?.user?.firstName} ${selectedRecord.doctor?.user?.lastName}`} />
                           <InfoRow label="Department" value={getDepartmentLabel(selectedRecord.doctor?.department || '')} />
                           <InfoRow label="Encounter Time" value={`${new Date(selectedRecord.appointmentDate).toLocaleDateString()} — ${selectedRecord.appointmentTime}`} />
                           {selectedRecord.startedAt && <InfoRow label="Duration Log" value={calcDuration(selectedRecord.startedAt, selectedRecord.completedAt)} highlight />}
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <DetailCard title="Critical Flags">
                           <div className="space-y-4">
                              <InfoField label="Known Allergies" value={selectedRecord.patient?.allergies || 'N/A'} />
                              <InfoField label="Active Meds" value={selectedRecord.patient?.currentMedications || 'N/A'} />
                              <InfoField label="Chronic States" value={selectedRecord.patient?.chronicConditions || 'N/A'} />
                           </div>
                        </DetailCard>
                        {(selectedRecord.reason || selectedRecord.diagnosis || selectedRecord.notes) && (
                           <DetailCard title="Clinical Notes">
                              <div className="space-y-4">
                                 {selectedRecord.reason && <InfoField label="Presented Reason" value={selectedRecord.reason} />}
                                 {selectedRecord.diagnosis && <InfoField label="Formal Diagnosis" value={selectedRecord.diagnosis} highlight />}
                                 {selectedRecord.notes && <InfoField label="Observation" value={selectedRecord.notes} />}
                              </div>
                           </DetailCard>
                        )}
                     </div>
                  </div>
               </div>

               {prescriptionData && (
                  <div className="pt-8 border-t border-slate-100">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-200 pb-2">Issued Prescription</h4>
                     <PrescriptionView prescriptionData={prescriptionData} appointmentData={selectedRecord} userRole={user?.role} />
                  </div>
               )}
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};

/* ── UI HELPERS ── */

interface AlertBannerProps { color: 'amber' | 'rose' | 'indigo'; title: string; body: string; action: string; loading: boolean; onAction: () => void; }
const AlertBanner: React.FC<AlertBannerProps> = ({ color, title, body, action, loading, onAction }) => {
  const s = ({ amber: 'bg-amber-50 border-amber-100 text-amber-900 b-amber-600', rose: 'bg-rose-50 border-rose-100 text-rose-900 b-rose-600', indigo: 'bg-indigo-50 border-indigo-100 text-indigo-900 b-indigo-600' })[color];
  const [b, bd, t, btn] = s.split(' ');
  return (
    <div className={`p-5 rounded-[20px] border ${b} ${bd} flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm`}>
      <div><p className={`font-black text-sm ${t} mb-1`}>{title}</p><p className={`text-xs font-medium opacity-80 ${t}`}>{body}</p></div>
      <button onClick={onAction} disabled={loading} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all hover:opacity-80 shrink-0 ${btn.replace('b-', 'bg-')} disabled:opacity-50`}>{loading ? 'Engaging...' : action}</button>
    </div>
  );
};

type StatColor = 'slate' | 'indigo' | 'amber' | 'rose' | 'emerald'; interface StatTileProps { label: string; value: number | string | undefined; color: StatColor; }
const StatTile: React.FC<StatTileProps> = ({ label, value, color }) => {
  const map: Record<StatColor, string> = { slate: 'bg-slate-50/50', indigo: 'bg-indigo-50/50', amber: 'bg-amber-50/50', rose: 'bg-rose-50/50', emerald: 'bg-emerald-50/50' };
  const txt: Record<StatColor, string> = { slate: 'text-slate-900', indigo: 'text-indigo-900', amber: 'text-amber-900', rose: 'text-rose-900', emerald: 'text-emerald-900' };
  return (
    <div className={`p-4 rounded-[20px] border border-slate-100 ${map[color]}`}>
      <p className={`font-black text-2xl ${txt[color]} leading-none mb-1`}>{value ?? '—'}</p>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">{label}</p>
    </div>
  );
};

const InsightList: React.FC<{title: string; icon:string; items: string[]; colorClass: string; hColor:string}> = ({ title, icon, items, colorClass, hColor }) => (
  <div className={`p-5 rounded-[24px] border border-slate-100 bg-white shadow-sm`}>
    <h4 className={`text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${hColor}`}><span className="w-4 h-4 rounded-full bg-current text-white flex items-center justify-center text-[10px]">{icon}</span>{title}</h4>
    {items?.length ? <ul className="space-y-2">{items.map((it, i) => <li key={i} className={`p-3 rounded-xl border text-xs font-medium leading-relaxed ${colorClass}`}>{it}</li>)}</ul> : <p className="text-xs text-slate-400 italic font-medium">No vectors flagged.</p>}
  </div>
);

const DetailCard: React.FC<{title: string; children: React.ReactNode}> = ({ title, children }) => (
  <div className="bg-slate-50/50 border border-slate-100 rounded-[20px] overflow-hidden"><div className="px-5 py-3 border-b border-slate-100 bg-white"><span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{title}</span></div><div className="p-5 space-y-4">{children}</div></div>
);

const InfoRow: React.FC<{label: string; value: string; highlight?: boolean}> = ({ label, value, highlight }) => (
  <div><p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">{label}</p><p className={`text-sm font-bold mt-1 ${highlight ? 'text-indigo-600' : 'text-slate-900'}`}>{value}</p></div>
);

const InfoField: React.FC<{label: string; value: string; multiline?: boolean; highlight?:boolean}> = ({ label, value, multiline, highlight }) => (
  <div><p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1.5">{label}</p><div className={`bg-white rounded-xl p-3 border text-sm font-medium ${highlight ? 'text-indigo-900 border-indigo-100' : 'text-slate-700 border-slate-200'} ${multiline ? 'whitespace-pre-line' : ''}`}>{value}</div></div>
);

const VitalTile: React.FC<{label: string; value: string; color: 'blue'|'emerald'|'violet'|'rose'}> = ({ label, value, color }) => {
  const map = { blue: 'bg-blue-50/50 text-blue-900', emerald: 'bg-emerald-50/50 text-emerald-900', violet: 'bg-violet-50/50 text-violet-900', rose: 'bg-rose-50/50 text-rose-900' };
  return (<div className={`p-3 rounded-[16px] border border-slate-100 ${map[color]}`}><p className={`text-[10px] font-black uppercase tracking-widest opacity-50`}>{label}</p><p className="text-lg font-black leading-none mt-1">{value}</p></div>);
};

export default MedicalRecords;
