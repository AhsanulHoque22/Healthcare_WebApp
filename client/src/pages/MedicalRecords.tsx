import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  CalendarIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  FireIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { generatePrescriptionPdf } from '../services/prescriptionPdfService';
import PrescriptionView from '../components/PrescriptionView';
import MedicineHistory from '../components/MedicineHistory';
import { getDepartmentLabel } from '../utils/departments';
import { calculateAge, formatAge, formatGender } from '../utils/dateUtils';

interface AppointmentMedicalRecord {
  id: number;
  appointmentDate: string;
  appointmentTime: string;
  serialNumber: number;
  type: string;
  status: string;
  reason: string;
  symptoms: string;
  notes: string;
  diagnosis: string;
  prescription: string;
  startedAt: string;
  completedAt: string;
  doctor: {
    id: number;
    department: string;
    experience: number;
    bmdcRegistrationNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  patient: {
    id: number;
    bloodType: string;
    allergies: string;
    medicalHistory: string;
    currentMedications: string;
    height?: number;
    weight?: number;
    bloodPressure?: string;
    pulse?: number;
    chronicConditions?: string;
    pastSurgeries?: string;
    familyMedicalHistory?: string;
    smokingStatus?: string;
    alcoholConsumption?: string;
    physicalActivity?: string;
    emergencyContact: string;
    emergencyPhone: string;
    medicalDocuments?: Array<{
      id: string;
      name: string;
      url: string;
      type: string;
      uploadDate: string;
    }>;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      dateOfBirth?: string;
      gender?: string;
    };
  };
}

interface PrescriptionData {
  id: number;
  appointmentId: number;
  symptoms?: string | any[];
  diagnoses?: string | any[];
  medicines?: string | any[];
  tests?: string | any[];
  suggestions?: string | any;
  createdAt: string;
}

interface ClinicalFinding {
  title: string;
  status: 'Normal' | 'Caution' | 'Critical';
  reason: string;
  source: string;
  date?: string | null;
}

interface ClinicalMedication {
  name: string;
  dosage?: string;
  instructions?: string;
  frequency?: string;
  status?: string;
}

interface SpecialistReferral {
  specialist: string;
  reason: string;
  urgency: 'Routine' | 'Soon' | 'Urgent';
}

interface LifestyleRecommendation {
  category: string;
  action: string;
  reason: string;
}

interface AttentionArea {
  area: string;
  detail: string;
}

interface LlamaClinicalInsight {
  overallStatus: 'Normal' | 'Caution' | 'Critical';
  summary: string;
  improved: string[];
  worsened: string[];
  stable: string[];
  activeMedications: ClinicalMedication[];
  keyFindings: ClinicalFinding[];
  specialistReferrals?: SpecialistReferral[];
  lifestyleRecommendations?: LifestyleRecommendation[];
  attentionAreas?: AttentionArea[];
  followUpConsiderations: string[];
}

interface MedicalSummary {
  aiClinicalNarrative: string;
  aiClinicalNarrativeModel?: string;
  llamaClinicalInsight?: LlamaClinicalInsight;
  llamaReasoningModel?: string;
  cacheMeta?: {
    analyzedDocuments?: number;
    analyzedCount?: number;
    freshlyExtracted?: number;
    reusableCount?: number;
    legacyCount?: number;
    upgradedCount?: number;
    deferredCount?: number;
    failedCount?: number;
  };
  summarizedDiagnoses: any[];
  recentSymptoms: any[];
  recentMedications: ClinicalMedication[];
  recentLabResults: any[];
  allLabResultsSummary?: {
    totalReports: number;
    totalFindings: number;
    criticalCount: number;
    cautionCount: number;
    normalCount: number;
    highlightedFindings: Array<{
      test: string;
      value: string | number;
      unit?: string;
      status: 'Normal' | 'Caution' | 'Critical';
      rawStatus?: string;
      referenceRange?: string;
      date?: string | null;
      source?: string;
      reportName?: string;
    }>;
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

  const { data: patientProfile } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: async () => {
      const response = await API.get('/patients/profile');
      return response.data.data.patient;
    },
    enabled: user?.role === 'patient',
  });

  const { data: appointments, isLoading } = useQuery<AppointmentMedicalRecord[]>({
    queryKey: ['patient-appointments', patientProfile?.id],
    queryFn: async () => {
      const response = await API.get('/appointments');
      const completedAppointments = response.data.data.appointments.filter((apt: any) =>
        apt.status === 'completed'
      );
      return completedAppointments || [];
    },
    enabled: !!patientProfile?.id,
    refetchInterval: 10000,
  });

  const { data: medicalSummary, isLoading: isLoadingSummary, isFetching: isFetchingSummary, refetch: refetchSummary } = useQuery<MedicalSummary>({
    queryKey: ['patient-medical-summary', patientProfile?.id],
    queryFn: async () => {
      const response = await API.get(`/patients/${patientProfile.id}/medical-summary`);
      return response.data.data.summary;
    },
    enabled: !!patientProfile?.id,
    staleTime: 0,
    gcTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const { mutate: reanalyzeWithLlama, isPending: isReanalyzing } = useMutation({
    mutationFn: async () => {
      const response = await API.get(`/patients/${patientProfile.id}/medical-summary`, {
        params: { reanalyze: 'true' }
      });
      return response.data.data.summary as MedicalSummary;
    },
    onSuccess: (updatedSummary) => {
      queryClient.setQueryData(['patient-medical-summary', patientProfile?.id], updatedSummary);
      toast.success('Documents analyzed. Click again if more remain.');
    },
    onError: () => {
      toast.error('Could not re-analyze documents right now. Please try again.');
    }
  });

  const filteredAppointments = appointments?.filter((apt) => {
    if (recordTypeFilter === 'all') return true;
    if (recordTypeFilter === 'consultation') return apt.type === 'in_person' || apt.type === 'telemedicine';
    if (recordTypeFilter === 'follow_up') return apt.type === 'follow_up';
    return true;
  }) || [];

  const handleViewDetails = async (appointment: AppointmentMedicalRecord) => {
    setSelectedRecord(appointment);
    setShowDetailModal(true);
    try {
      const response = await API.get(`/prescriptions/appointment/${appointment.id}`);
      setPrescriptionData(response.data.data.prescription);
    } catch (error) {
      setPrescriptionData(null);
    }
  };

  const handleDownload = async (appointment: AppointmentMedicalRecord | null) => {
    if (!appointment) return;
    setIsDownloading(appointment.id);
    try {
      let prescriptionForPdf: any = null;
      try {
        const response = await API.get(`/prescriptions/appointment/${appointment.id}`);
        prescriptionForPdf = response.data?.data?.prescription || null;
      } catch (fetchError: any) {
        // No prescription found
      }
      await generatePrescriptionPdf({ prescriptionData: prescriptionForPdf, appointmentData: appointment });
    } catch (error: any) {
      if (error.message?.toLowerCase().includes('popup')) {
        toast.error('Please allow pop-ups for this site, then try downloading again.');
      } else {
        toast.error('Failed to generate prescription PDF. Please try again.');
      }
    } finally {
      setIsDownloading(null);
    }
  };

  const getAppointmentTypeLabel = (type: string) => {
    switch (type) {
      case 'in_person': return 'In Person';
      case 'telemedicine': return 'Telemedicine';
      case 'follow_up': return 'Follow-up';
      default: return type.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  };

  const getAppointmentTypeBadge = (type: string) => {
    switch (type) {
      case 'in_person': return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200/60';
      case 'telemedicine': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60';
      case 'follow_up': return 'bg-violet-50 text-violet-700 ring-1 ring-violet-200/60';
      default: return 'bg-slate-50 text-slate-700 ring-1 ring-slate-200/60';
    }
  };

  const getInsightStatusStyles = (status?: string) => {
    switch (status) {
      case 'Critical': return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60';
      case 'Caution': return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60';
      default: return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60';
    }
  };

  const getLabStatus = (status?: string) => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'critical') return 'Critical';
    if (['abnormal', 'high', 'low', 'caution'].includes(normalized)) return 'Caution';
    return 'Normal';
  };

  const calcDuration = (start: string, end: string) => {
    const diffMins = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const tabs = [
    { key: 'summary' as const, label: 'Medical Summary', icon: ClipboardDocumentCheckIcon },
    { key: 'appointments' as const, label: 'Appointment History', icon: CalendarIcon },
    { key: 'medicines' as const, label: 'Medicine History', icon: BeakerIcon },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fc] relative">
      {/* Subtle aurora background — two orbs only */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-64 -right-64 w-[600px] h-[600px] bg-indigo-400/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-64 -left-64 w-[600px] h-[600px] bg-violet-400/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-8 py-7 shadow-xl shadow-indigo-900/20 overflow-hidden relative">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/8 rounded-full blur-2xl" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <ClipboardDocumentListIcon className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Medical Records</h1>
              </div>
              <p className="text-indigo-200 text-sm pl-12">View and manage your complete medical history.</p>
            </div>
            <div className="hidden sm:flex items-center gap-2 shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center">
                <DocumentTextIcon className="h-8 w-8 text-white/80" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-1.5">
          <nav className="flex gap-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === key
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline truncate">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* ══════════════════════════════════════════
            TAB: MEDICAL SUMMARY
        ══════════════════════════════════════════ */}
        {activeTab === 'summary' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Section header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Comprehensive Medical Summary</h2>
                <p className="text-sm text-slate-500 mt-0.5">Aggregated view of your recent medical history</p>
              </div>
              <button
                onClick={() => refetchSummary()}
                disabled={isFetchingSummary}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowPathIcon className={`h-4 w-4 ${isFetchingSummary ? 'animate-spin' : ''}`} />
                {isFetchingSummary ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>

            <div className="p-6 space-y-5">
              {isLoadingSummary ? (
                <div className="flex flex-col items-center py-16 gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
                  <p className="text-slate-500 text-sm">Running clinical reconciliation…</p>
                </div>
              ) : medicalSummary ? (
                <>
                  {/* ── Cache alert banners ── */}
                  {(medicalSummary?.cacheMeta?.deferredCount ?? 0) > 0 && (
                    <AlertBanner
                      color="amber"
                      title={`${medicalSummary.cacheMeta!.deferredCount} document${medicalSummary.cacheMeta!.deferredCount! > 1 ? 's are' : ' is'} pending analysis`}
                      body="Documents are analyzed in batches to prevent server overload. Click to process the next batch."
                      action="Analyze next batch"
                      loading={isReanalyzing}
                      onAction={() => reanalyzeWithLlama()}
                    />
                  )}
                  {(medicalSummary?.cacheMeta?.deferredCount ?? 0) === 0 && (medicalSummary?.cacheMeta?.legacyCount ?? 0) > 0 && (
                    <AlertBanner
                      color="amber"
                      title="Legacy AI cache detected"
                      body={`${medicalSummary.cacheMeta!.legacyCount} document${medicalSummary.cacheMeta!.legacyCount! > 1 ? 's were' : ' was'} analyzed with an older model.`}
                      action="Re-analyze with Llama"
                      loading={isReanalyzing}
                      onAction={() => reanalyzeWithLlama()}
                    />
                  )}
                  {(medicalSummary?.cacheMeta?.deferredCount ?? 0) === 0 && (medicalSummary?.cacheMeta?.legacyCount ?? 0) === 0 && (medicalSummary?.cacheMeta?.failedCount ?? 0) > 0 && (
                    <AlertBanner
                      color="rose"
                      title={`${medicalSummary.cacheMeta!.failedCount} document${medicalSummary.cacheMeta!.failedCount! > 1 ? 's' : ''} failed to analyze`}
                      body="Some documents were unreadable or timed out. Click below to retry."
                      action="Retry extraction"
                      loading={isReanalyzing}
                      onAction={() => reanalyzeWithLlama()}
                    />
                  )}

                  {/* ── Document meta stats ── */}
                  {medicalSummary?.cacheMeta && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <StatTile label="Total Docs" value={medicalSummary.cacheMeta.analyzedDocuments ?? '—'} color="slate" />
                      <StatTile label="Analyzed" value={medicalSummary.cacheMeta.analyzedCount ?? (medicalSummary.cacheMeta.reusableCount ?? 0)} color="indigo" />
                      <StatTile label="Pending" value={medicalSummary.cacheMeta.deferredCount ?? 0} color="amber" />
                      <StatTile label="Failed" value={medicalSummary.cacheMeta.failedCount ?? 0} color="rose" />
                    </div>
                  )}

                  {/* ── Llama Clinical Insight ── */}
                  {medicalSummary?.llamaClinicalInsight && (
                    <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/60 to-fuchsia-50/40 overflow-hidden">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-violet-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
                            <FireIcon className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-violet-900 tracking-wide uppercase">Clinical Insight</p>
                            <p className="text-xs text-violet-600 mt-0.5">Deep reconciliation across prescriptions, lab reports, and uploaded records.</p>
                          </div>
                        </div>
                        <span className={`self-start sm:self-auto inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getInsightStatusStyles(medicalSummary.llamaClinicalInsight.overallStatus)}`}>
                          {medicalSummary.llamaClinicalInsight.overallStatus}
                        </span>
                      </div>

                      <div className="p-5 space-y-5">
                        <p className="text-sm leading-relaxed text-slate-700 bg-white/70 rounded-xl p-4 border border-violet-100/50">
                          {medicalSummary.llamaClinicalInsight.summary}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <InsightList
                            title="Improved"
                            items={medicalSummary.llamaClinicalInsight.improved}
                            emptyText="No clear improvement trend identified yet."
                            colorClass="bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
                            headingClass="text-emerald-700"
                          />
                          <InsightList
                            title="Needs Attention"
                            items={medicalSummary.llamaClinicalInsight.worsened}
                            emptyText="No worsening trend flagged from the recent records."
                            colorClass="bg-amber-50 text-amber-800 ring-1 ring-amber-100"
                            headingClass="text-amber-700"
                          />
                        </div>

                        {medicalSummary.llamaClinicalInsight.specialistReferrals?.length ? (
                          <SubSection title="Recommended Specialists" emoji="🩺">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {medicalSummary.llamaClinicalInsight.specialistReferrals.map((ref, idx) => (
                                <div key={idx} className={`rounded-xl border p-3 text-sm ${
                                  ref.urgency === 'Urgent' ? 'border-rose-200 bg-rose-50/60' :
                                  ref.urgency === 'Soon'   ? 'border-amber-200 bg-amber-50/60' :
                                                              'border-blue-100 bg-blue-50/60'
                                }`}>
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className="font-semibold text-slate-900">{ref.specialist}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      ref.urgency === 'Urgent' ? 'bg-rose-100 text-rose-700' :
                                      ref.urgency === 'Soon'   ? 'bg-amber-100 text-amber-700' :
                                                                  'bg-blue-100 text-blue-700'
                                    }`}>{ref.urgency}</span>
                                  </div>
                                  <p className="text-slate-500 text-xs">{ref.reason}</p>
                                </div>
                              ))}
                            </div>
                          </SubSection>
                        ) : null}

                        {medicalSummary.llamaClinicalInsight.lifestyleRecommendations?.length ? (
                          <SubSection title="Lifestyle Recommendations" emoji="🌿">
                            <div className="space-y-2">
                              {medicalSummary.llamaClinicalInsight.lifestyleRecommendations.map((rec, idx) => (
                                <div key={idx} className="flex items-start gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-sm">
                                  <span className="mt-0.5 text-[10px] font-bold uppercase text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-lg shrink-0">{rec.category}</span>
                                  <div>
                                    <p className="font-medium text-slate-900">{rec.action}</p>
                                    {rec.reason && <p className="text-xs text-slate-500 mt-0.5">{rec.reason}</p>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </SubSection>
                        ) : null}

                        {medicalSummary.llamaClinicalInsight.attentionAreas?.length ? (
                          <SubSection title="Areas Needing Attention" emoji="⚠️">
                            <div className="space-y-2">
                              {medicalSummary.llamaClinicalInsight.attentionAreas.map((item, idx) => (
                                <div key={idx} className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm">
                                  <p className="font-semibold text-amber-900">{item.area}</p>
                                  <p className="text-amber-700 text-xs mt-0.5">{item.detail}</p>
                                </div>
                              ))}
                            </div>
                          </SubSection>
                        ) : null}

                        {medicalSummary.llamaClinicalInsight.followUpConsiderations?.length ? (
                          <SubSection title="Follow-Up Checklist" emoji="📋">
                            <ul className="space-y-1.5">
                              {medicalSummary.llamaClinicalInsight.followUpConsiderations.map((item, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </SubSection>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* ── Recent Medical Findings ── */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                      <ClipboardDocumentListIcon className="h-5 w-5 text-emerald-600 shrink-0" />
                      <h4 className="font-bold text-slate-900">Recent Medical Findings</h4>
                    </div>
                    <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-3">Diagnoses</p>
                        {medicalSummary?.summarizedDiagnoses?.length ? (
                          <ul className="space-y-2">
                            {medicalSummary.summarizedDiagnoses.map((diag: any, idx: number) => (
                              <li key={idx} className="flex items-center justify-between gap-2 bg-white rounded-xl px-3 py-2.5 text-sm border border-slate-100">
                                <span className="text-slate-800">{typeof diag === 'object' ? (diag?.condition || diag?.diagnosis || diag?.description || JSON.stringify(diag)) : (diag || 'Unknown')}</span>
                                <span className="text-xs text-slate-400 shrink-0">
                                  {diag?.date && !isNaN(new Date(diag.date).getTime()) ? new Date(diag.date).toLocaleDateString() : ''}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-400 italic">No recent diagnoses found.</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3">Symptoms Reported</p>
                        {medicalSummary?.recentSymptoms?.length ? (
                          <ul className="space-y-2">
                            {medicalSummary.recentSymptoms.map((symp: any, idx: number) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-slate-700 border-l-2 border-indigo-300 pl-3 py-1">
                                <span>{typeof symp === 'object' ? (symp?.symptom || symp?.name || symp?.description || JSON.stringify(symp)) : (symp || 'Unknown')}</span>
                                {symp?.date && !isNaN(new Date(symp.date).getTime()) && (
                                  <span className="text-xs text-slate-400 shrink-0">({new Date(symp.date).toLocaleDateString()})</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-slate-400 italic">No recent symptoms reported.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Lab Results ── */}
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
                      <BeakerIcon className="h-5 w-5 text-violet-600 shrink-0" />
                      <h4 className="font-bold text-slate-900">All Laboratory Tests</h4>
                    </div>
                    <div className="p-5">
                      {medicalSummary?.recentLabResults?.length ? (
                        <div className="space-y-4">
                          {medicalSummary?.allLabResultsSummary && (
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                              <StatTile label="Reports" value={medicalSummary.allLabResultsSummary.totalReports} color="slate" />
                              <StatTile label="Findings" value={medicalSummary.allLabResultsSummary.totalFindings} color="indigo" />
                              <StatTile label="Critical" value={medicalSummary.allLabResultsSummary.criticalCount} color="rose" />
                              <StatTile label="Caution" value={medicalSummary.allLabResultsSummary.cautionCount} color="amber" />
                              <StatTile label="Normal" value={medicalSummary.allLabResultsSummary.normalCount} color="emerald" />
                            </div>
                          )}

                          {medicalSummary?.allLabResultsSummary?.highlightedFindings?.length ? (
                            <div className="rounded-xl border border-slate-100 bg-white p-4">
                              <p className="text-sm font-semibold text-slate-700 mb-3">Highlighted Results Across All Lab Tests</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {medicalSummary.allLabResultsSummary.highlightedFindings.map((finding, idx) => (
                                  <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                      <span className="text-sm font-semibold text-slate-900 truncate">{finding.test}</span>
                                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${getInsightStatusStyles(finding.status)}`}>
                                        {finding.status}
                                      </span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-800">{finding.value} {finding.unit}</p>
                                    {finding.referenceRange && <p className="text-xs text-slate-400">Ref: {finding.referenceRange}</p>}
                                    <p className="mt-1 text-[11px] text-slate-400">
                                      {finding.reportName || finding.source}
                                      {finding.date ? ` · ${new Date(finding.date).toLocaleDateString()}` : ''}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {medicalSummary.recentLabResults.map((lab: any, idx: number) => (
                            <div key={idx} className="rounded-xl border border-slate-100 bg-white p-4 space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-sm text-slate-900">{lab?.testNames || 'Laboratory Investigation'}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    {lab.source === 'MedVault' ? 'Self Uploaded' : `Order #${String(lab?.orderId || '—')}`}
                                    {lab?.date && !isNaN(new Date(lab.date).getTime()) ? ` · ${new Date(lab.date).toLocaleDateString()}` : ''}
                                  </p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg shrink-0 ${lab.source === 'MedVault' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'}`}>
                                  {lab.source === 'MedVault' ? 'MedVault' : 'Result Ready'}
                                </span>
                              </div>
                              {lab?.findings?.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {lab.findings.slice(0, 4).map((f: any, fIdx: number) => (
                                    <div key={fIdx} className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                                      <span className="text-xs text-slate-600 truncate">{f.test || 'Result'}</span>
                                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${getInsightStatusStyles(getLabStatus(f.status))}`}>
                                        {f.value} {f.unit}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 italic">No lab tests found for this patient.</p>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: APPOINTMENTS
        ══════════════════════════════════════════ */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Appointment History</h2>
                <p className="text-sm text-slate-500 mt-0.5">All completed appointments and visit records</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <FunnelIcon className="h-4 w-4 text-slate-400" />
                <select
                  value={recordTypeFilter}
                  onChange={(e) => setRecordTypeFilter(e.target.value)}
                  className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="all">All Appointments</option>
                  <option value="consultation">Consultations</option>
                  <option value="follow_up">Follow-up Visits</option>
                </select>
              </div>
            </div>

            <div className="p-6">
              {isLoading ? (
                <div className="flex flex-col items-center py-16 gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
                  <p className="text-slate-500 text-sm">Loading medical records…</p>
                </div>
              ) : filteredAppointments.length > 0 ? (
                <div className="space-y-3">
                  {filteredAppointments.map((appointment, index) => (
                    <div
                      key={appointment.id}
                      className="group rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 hover:shadow-md transition-all duration-200 p-5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Left icon */}
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                          <CalendarIcon className="h-5 w-5 text-indigo-600" />
                        </div>

                        {/* Main content */}
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${getAppointmentTypeBadge(appointment.type)}`}>
                              {getAppointmentTypeLabel(appointment.type)}
                            </span>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                              {new Date(appointment.appointmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                              Serial #{appointment.serialNumber}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-bold text-slate-900">
                              Dr. {appointment.doctor.user.firstName} {appointment.doctor.user.lastName}
                            </h4>
                            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <ClockIcon className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                              {appointment.appointmentTime} · {getDepartmentLabel(appointment.doctor.department)}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {appointment.reason && (
                              <div className="bg-white rounded-xl px-3 py-2.5 border border-slate-100 text-sm">
                                <span className="font-semibold text-slate-700">Reason: </span>
                                <span className="text-slate-600">{appointment.reason.length > 90 ? `${appointment.reason.substring(0, 90)}…` : appointment.reason}</span>
                              </div>
                            )}
                            {appointment.diagnosis && (
                              <div className="bg-white rounded-xl px-3 py-2.5 border border-slate-100 text-sm">
                                <span className="font-semibold text-slate-700">Diagnosis: </span>
                                <span className="text-slate-600">{appointment.diagnosis.length > 90 ? `${appointment.diagnosis.substring(0, 90)}…` : appointment.diagnosis}</span>
                              </div>
                            )}
                          </div>

                          {appointment.startedAt && appointment.completedAt && (
                            <div className="flex items-center gap-2 text-sm text-emerald-700">
                              <CheckCircleIcon className="h-4 w-4 shrink-0" />
                              <span>Duration: <strong>{calcDuration(appointment.startedAt, appointment.completedAt)}</strong></span>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex sm:flex-col gap-2 shrink-0">
                          <button
                            onClick={() => handleViewDetails(appointment)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors duration-150 shadow-sm"
                          >
                            <EyeIcon className="h-4 w-4" />
                            <span className="hidden sm:inline">View</span>
                          </button>
                          <button
                            onClick={() => handleDownload(appointment)}
                            disabled={isDownloading === appointment.id}
                            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors duration-150 disabled:opacity-50"
                          >
                            <ArrowDownTrayIcon className={`h-4 w-4 ${isDownloading === appointment.id ? 'animate-bounce' : ''}`} />
                            <span className="hidden sm:inline">{isDownloading === appointment.id ? 'Saving…' : 'PDF'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center py-16 gap-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center">
                    <DocumentTextIcon className="h-8 w-8 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">No completed appointments found</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {recordTypeFilter !== 'all'
                        ? `No ${getAppointmentTypeLabel(recordTypeFilter)} appointments available`
                        : 'Your medical records will appear here after completed doctor visits'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            TAB: MEDICINE HISTORY
        ══════════════════════════════════════════ */}
        {activeTab === 'medicines' && patientProfile?.id && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-100">
              <BeakerIcon className="h-5 w-5 text-violet-600 shrink-0" />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Medicine History</h2>
                <p className="text-sm text-slate-500">Track your medication history and adherence</p>
              </div>
            </div>
            <div className="p-6">
              <MedicineHistory patientId={patientProfile.id} />
            </div>
          </div>
        )}

      </div>

      {/* ══════════════════════════════════════════
          DETAIL MODAL
      ══════════════════════════════════════════ */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-100 my-4">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <DocumentTextIcon className="h-4 w-4 text-indigo-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Medical Record Details</h2>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors duration-150"
              >
                <XMarkIcon className="h-4 w-4 text-slate-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient info */}
                <DetailCard title="Patient Information">
                  <InfoRow label="Name" value={`${selectedRecord.patient?.user?.firstName} ${selectedRecord.patient?.user?.lastName}`} />
                  <InfoRow label="Email" value={selectedRecord.patient?.user?.email} />
                  <InfoRow label="Age / Sex" value={`${formatAge(calculateAge(selectedRecord.patient?.user?.dateOfBirth))} / ${formatGender(selectedRecord.patient?.user?.gender)}`} />
                  <InfoRow label="Phone" value={selectedRecord.patient?.user?.phone || 'Not provided'} />
                  <InfoRow label="Blood Type" value={selectedRecord.patient?.bloodType || 'Not provided'} />
                </DetailCard>

                {/* Appointment info */}
                <DetailCard title="Appointment Information">
                  <InfoRow label="Date" value={new Date(selectedRecord.appointmentDate).toLocaleDateString()} />
                  <InfoRow label="Time" value={selectedRecord.appointmentTime} />
                  <InfoRow label="Serial Number" value={`#${selectedRecord.serialNumber}`} />
                  <InfoRow label="Type" value={getAppointmentTypeLabel(selectedRecord.type)} />
                  {selectedRecord.startedAt && selectedRecord.completedAt && (
                    <>
                      <InfoRow label="Started At" value={new Date(selectedRecord.startedAt).toLocaleString()} />
                      <InfoRow label="Completed At" value={new Date(selectedRecord.completedAt).toLocaleString()} />
                      <InfoRow label="Duration" value={calcDuration(selectedRecord.startedAt, selectedRecord.completedAt)} highlight />
                    </>
                  )}
                </DetailCard>

                {/* Doctor info */}
                <DetailCard title="Doctor Information">
                  <InfoRow label="Name" value={`Dr. ${selectedRecord.doctor?.user?.firstName} ${selectedRecord.doctor?.user?.lastName}`} />
                  <InfoRow label="Department" value={getDepartmentLabel(selectedRecord.doctor?.department || '') || 'General Medicine'} />
                  <InfoRow label="BMDC Registration" value={selectedRecord.doctor?.bmdcRegistrationNumber || 'Not provided'} />
                  <InfoRow label="Experience" value={`${selectedRecord.doctor?.experience || 0} years`} />
                </DetailCard>

                {/* Vitals */}
                <DetailCard title="Vitals">
                  <div className="grid grid-cols-2 gap-2">
                    <VitalTile label="Height" value={selectedRecord.patient?.height ? `${selectedRecord.patient.height} cm` : '—'} color="blue" />
                    <VitalTile label="Weight" value={selectedRecord.patient?.weight ? `${selectedRecord.patient.weight} kg` : '—'} color="emerald" />
                    <VitalTile label="Blood Pressure" value={selectedRecord.patient?.bloodPressure || '—'} color="violet" />
                    <VitalTile label="Pulse" value={selectedRecord.patient?.pulse ? `${selectedRecord.patient.pulse} bpm` : '—'} color="rose" />
                  </div>
                </DetailCard>
              </div>

              {/* Medical background */}
              <DetailCard title="Medical Background">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <InfoField label="Allergies" value={selectedRecord.patient?.allergies || 'None reported'} />
                    <InfoField label="Current Medications" value={selectedRecord.patient?.currentMedications || 'None reported'} />
                    <InfoField label="Chronic Conditions" value={selectedRecord.patient?.chronicConditions || 'None reported'} />
                  </div>
                  <div className="space-y-3">
                    <InfoField label="Smoking Status" value={selectedRecord.patient?.smokingStatus || 'Not specified'} />
                    <InfoField label="Alcohol Consumption" value={selectedRecord.patient?.alcoholConsumption || 'Not specified'} />
                    <InfoField label="Physical Activity" value={selectedRecord.patient?.physicalActivity || 'Not specified'} />
                  </div>
                </div>
                <div className="mt-3 space-y-3">
                  <InfoField
                    label="Medical History & Past Surgeries"
                    value={[selectedRecord.patient?.medicalHistory, selectedRecord.patient?.pastSurgeries].filter(Boolean).join('\n') || 'None reported'}
                    multiline
                  />
                  <InfoField label="Family Medical History" value={selectedRecord.patient?.familyMedicalHistory || 'None reported'} />
                </div>
              </DetailCard>

              {/* Uploaded Documents */}
              {selectedRecord.patient?.medicalDocuments && selectedRecord.patient.medicalDocuments.length > 0 && (
                <DetailCard title="Uploaded Documents">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedRecord.patient.medicalDocuments.map((doc: any, idx: number) => (
                      <div key={doc.id || idx} className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100 hover:border-slate-200 transition-colors">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{doc.name}</p>
                            <p className="text-xs text-slate-400">{doc.type}</p>
                          </div>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors shrink-0"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                </DetailCard>
              )}

              {/* Appointment reason & symptoms */}
              {(selectedRecord.reason || selectedRecord.symptoms) && (
                <DetailCard title="Appointment Reason">
                  {selectedRecord.reason && <InfoField label="Reason" value={selectedRecord.reason} />}
                  {selectedRecord.symptoms && <InfoField label="Symptoms" value={selectedRecord.symptoms} />}
                </DetailCard>
              )}

              {/* Clinical notes */}
              {(selectedRecord.notes || selectedRecord.diagnosis || selectedRecord.prescription) && (
                <DetailCard title="Medical Details">
                  <div className="space-y-3">
                    {selectedRecord.notes && (
                      <div className="bg-emerald-50/60 rounded-xl p-4 border border-emerald-100">
                        <p className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1.5">Doctor's Notes</p>
                        <p className="text-sm text-slate-800">{selectedRecord.notes}</p>
                      </div>
                    )}
                    {selectedRecord.diagnosis && (
                      <div className="bg-violet-50/60 rounded-xl p-4 border border-violet-100">
                        <p className="text-xs font-bold uppercase tracking-wider text-violet-600 mb-1.5">Diagnosis</p>
                        <p className="text-sm text-slate-800">{selectedRecord.diagnosis}</p>
                      </div>
                    )}
                    {selectedRecord.prescription && (
                      <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-100">
                        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1.5">Prescription</p>
                        <p className="text-sm text-slate-800">{selectedRecord.prescription}</p>
                      </div>
                    )}
                  </div>
                </DetailCard>
              )}

              {/* Prescription view component */}
              {prescriptionData && (
                <PrescriptionView
                  prescriptionData={prescriptionData}
                  appointmentData={selectedRecord}
                  userRole={user?.role}
                />
              )}

              {/* Emergency contact */}
              <DetailCard title="Emergency Contact">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoRow label="Contact Name" value={selectedRecord.patient?.emergencyContact || 'Not provided'} />
                  <InfoRow label="Contact Phone" value={selectedRecord.patient?.emergencyPhone || 'Not provided'} />
                </div>
              </DetailCard>

              {/* Modal actions */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleDownload(selectedRecord)}
                  disabled={isDownloading === selectedRecord?.id}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl transition-colors duration-150 disabled:opacity-50"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  {isDownloading === selectedRecord?.id ? 'Saving…' : 'Download PDF'}
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-colors duration-150 shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Small reusable sub-components ── */

interface AlertBannerProps {
  color: 'amber' | 'rose';
  title: string;
  body: string;
  action: string;
  loading: boolean;
  onAction: () => void;
}
const AlertBanner: React.FC<AlertBannerProps> = ({ color, title, body, action, loading, onAction }) => {
  const s = color === 'amber'
    ? { wrap: 'border-amber-200 bg-amber-50', title: 'text-amber-900', body: 'text-amber-700', btn: 'bg-amber-600 hover:bg-amber-700' }
    : { wrap: 'border-rose-200 bg-rose-50', title: 'text-rose-900', body: 'text-rose-700', btn: 'bg-rose-600 hover:bg-rose-700' };
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${s.wrap}`}>
      <div>
        <p className={`text-sm font-semibold ${s.title}`}>{title}</p>
        <p className={`text-sm mt-0.5 ${s.body}`}>{body}</p>
      </div>
      <button
        onClick={onAction}
        disabled={loading}
        className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white transition-colors shrink-0 disabled:cursor-not-allowed disabled:opacity-60 ${s.btn}`}
      >
        {loading ? 'Processing…' : action}
      </button>
    </div>
  );
};

type StatColor = 'slate' | 'indigo' | 'amber' | 'rose' | 'emerald';
interface StatTileProps { label: string; value: number | string | undefined; color: StatColor; }
const StatTile: React.FC<StatTileProps> = ({ label, value, color }) => {
  const map: Record<StatColor, string> = {
    slate: 'bg-slate-50 border-slate-100',
    indigo: 'bg-indigo-50 border-indigo-100',
    amber: 'bg-amber-50 border-amber-100',
    rose: 'bg-rose-50 border-rose-100',
    emerald: 'bg-emerald-50 border-emerald-100',
  };
  const text: Record<StatColor, string> = {
    slate: 'text-slate-500',
    indigo: 'text-indigo-500',
    amber: 'text-amber-500',
    rose: 'text-rose-500',
    emerald: 'text-emerald-600',
  };
  const val: Record<StatColor, string> = {
    slate: 'text-slate-900',
    indigo: 'text-indigo-900',
    amber: 'text-amber-900',
    rose: 'text-rose-900',
    emerald: 'text-emerald-900',
  };
  return (
    <div className={`rounded-xl border p-3 text-center ${map[color]}`}>
      <p className={`text-[10px] font-bold uppercase tracking-wider ${text[color]}`}>{label}</p>
      <p className={`text-xl font-bold mt-1 ${val[color]}`}>{value ?? '—'}</p>
    </div>
  );
};

interface InsightListProps { title: string; items: string[]; emptyText: string; colorClass: string; headingClass: string; }
const InsightList: React.FC<InsightListProps> = ({ title, items, emptyText, colorClass, headingClass }) => (
  <div className="bg-white/70 rounded-xl p-4 border border-white/80">
    <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${headingClass}`}>{title}</p>
    {items?.length ? (
      <ul className="space-y-1.5">
        {items.map((item, idx) => (
          <li key={idx} className={`rounded-lg px-3 py-2 text-sm ${colorClass}`}>{item}</li>
        ))}
      </ul>
    ) : (
      <p className="text-sm italic text-slate-400">{emptyText}</p>
    )}
  </div>
);

interface SubSectionProps { title: string; emoji: string; children: React.ReactNode; }
const SubSection: React.FC<SubSectionProps> = ({ title, emoji, children }) => (
  <div className="pt-4 border-t border-violet-100">
    <p className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-1.5">
      <span>{emoji}</span> {title}
    </p>
    {children}
  </div>
);

interface DetailCardProps { title: string; children: React.ReactNode; }
const DetailCard: React.FC<DetailCardProps> = ({ title, children }) => (
  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 overflow-hidden">
    <p className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-white">{title}</p>
    <div className="p-5 space-y-3">{children}</div>
  </div>
);

interface InfoRowProps { label: string; value: string; highlight?: boolean; }
const InfoRow: React.FC<InfoRowProps> = ({ label, value, highlight }) => (
  <div>
    <p className="text-xs font-medium text-slate-400">{label}</p>
    <p className={`text-sm mt-0.5 ${highlight ? 'font-bold text-emerald-700' : 'text-slate-900'}`}>{value}</p>
  </div>
);

interface InfoFieldProps { label: string; value: string; multiline?: boolean; }
const InfoField: React.FC<InfoFieldProps> = ({ label, value, multiline }) => (
  <div>
    <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
    <div className={`bg-white rounded-xl px-3 py-2.5 border border-slate-100 text-sm text-slate-800 ${multiline ? 'whitespace-pre-line' : ''}`}>
      {value}
    </div>
  </div>
);

interface VitalTileProps { label: string; value: string; color: 'blue' | 'emerald' | 'violet' | 'rose'; }
const VitalTile: React.FC<VitalTileProps> = ({ label, value, color }) => {
  const map = {
    blue: 'bg-blue-50 border-blue-100 text-blue-600 text-blue-900',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600 text-emerald-900',
    violet: 'bg-violet-50 border-violet-100 text-violet-600 text-violet-900',
    rose: 'bg-rose-50 border-rose-100 text-rose-600 text-rose-900',
  };
  const [labelCls, valCls] = map[color].split(' ').reduce<[string[], string[]]>(
    ([l, v], cls, i) => i < 3 ? [[...l, cls], v] : [l, [...v, cls]],
    [[], []]
  );
  return (
    <div className={`rounded-xl border p-3 ${map[color].split(' ').slice(0, 2).join(' ')}`}>
      <p className={`text-[10px] font-bold uppercase tracking-wider ${map[color].split(' ')[2]}`}>{label}</p>
      <p className={`text-lg font-bold mt-1 ${map[color].split(' ')[3]}`}>{value}</p>
    </div>
  );
};

export default MedicalRecords;
