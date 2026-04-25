import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/api';
import { 
  BeakerIcon, CalendarIcon, ClockIcon, CheckCircleIcon, XCircleIcon, 
  PauseCircleIcon, FunnelIcon, EyeIcon, ArrowPathIcon, ClipboardDocumentListIcon
} from '@heroicons/react/24/outline';
import { Reveal } from './landing/AnimatedSection';

interface Medicine {
  id: number; name: string; dosage: string; frequency: string; instructions: string;
  startDate: string; endDate: string | null; isActive: boolean; duration: number;
  doctor: { user: { firstName: string; lastName: string; }; };
  dosages: Array<{ id: number; takenAt: string; quantity: number; notes?: string; }>;
  reminders: Array<{ id: number; time: string; dayOfWeek: string; isActive: boolean; }>;
}

interface MedicineLog { id: number; medicineName: string; action: 'Prescribed' | 'Discontinued'; createdAt: string; doctor: { user: { firstName: string; lastName: string; } } }
interface MedicineStats { totalMedicines: number; activeMedicines: number; completedMedicines: number; averageAdherence: number; medicines: Medicine[]; }

const MedicineHistory: React.FC<{ patientId: number }> = ({ patientId }) => {
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [activeTab, setActiveTab] = useState<'history' | 'logs'>('history');

  const { data: logs, isLoading: logsLoading } = useQuery<MedicineLog[]>({
    queryKey: ['medicine-logs', patientId],
    queryFn: async () => { const res = await API.get(`/medicines/patients/${patientId}/logs`); return res.data.data; },
    enabled: !!patientId,
  });

  const { data: stats, isLoading } = useQuery<MedicineStats>({
    queryKey: ['medicine-stats', patientId],
    queryFn: async () => { const res = await API.get(`/medicines/patients/${patientId}/stats`); return res.data.data; },
    enabled: !!patientId,
  });

  const calcAdherence = (medicine: Medicine): number => {
    if (!medicine.dosages || medicine.dosages.length === 0) return 0;
    let expected = 0;
    const start = new Date(medicine.startDate);
    const end = medicine.endDate ? new Date(medicine.endDate) : new Date();
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
    const freq = medicine.frequency.toLowerCase();
    let daily = 1;
    if (freq.includes('twice') || freq.includes('2 times')) daily = 2;
    else if (freq.includes('three times') || freq.includes('3 times')) daily = 3;
    else if (freq.includes('four times') || freq.includes('4 times')) daily = 4;
    expected = days * daily;
    return Math.min(100, Math.round((medicine.dosages.length / expected) * 100));
  };

  const getStatus = (m: Medicine) => {
    if (!m.isActive && m.endDate) return { label: 'Course Completed', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircleIcon };
    if (!m.isActive && !m.endDate) return { label: 'Discontinued', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: XCircleIcon };
    return { label: 'Active Regimen', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: PauseCircleIcon };
  };

  const filtered = stats?.medicines.filter((m) => {
    if (filter === 'all') return true;
    if (filter === 'active') return m.isActive;
    return !m.isActive && m.endDate;
  }) || [];

  if (isLoading) return <div className="py-20 flex flex-col items-center"><div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin mb-4" /><p className="text-xs font-black uppercase tracking-widest text-slate-400">Syncing Pharma-Matrix...</p></div>;

  return (
    <div className="space-y-8">
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex bg-slate-50 border border-slate-100 p-1.5 rounded-[22px] w-fit">
          <button onClick={() => setActiveTab('history')} className={`px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Full Registry</button>
          <button onClick={() => setActiveTab('logs')} className={`px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'logs' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Audit Ledger</button>
        </div>

        {activeTab === 'history' && (
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filter By Status</span>
             <select value={filter} onChange={(e) => setFilter(e.target.value as any)} className="bg-white border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all cursor-pointer">
                <option value="all">Every Prescription</option>
                <option value="active">Active Now</option>
                <option value="completed">Cycle Completed</option>
             </select>
          </div>
        )}
      </div>

      {activeTab === 'history' && (
        <AnimatePresence mode="wait">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            
            {/* STATS STRIP */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <StatBox label="Total Prescribed" value={stats?.totalMedicines} dotColor="bg-slate-400" />
               <StatBox label="Active Regimen" value={stats?.activeMedicines} dotColor="bg-indigo-500" />
               <StatBox label="Course Ends" value={stats?.completedMedicines} dotColor="bg-emerald-500" />
               <StatBox label="Overall Adherence" value={`${stats?.averageAdherence}%`} dotColor="bg-violet-500" />
            </div>

            {/* MEDICINE LIST */}
            <div className="grid grid-cols-1 gap-4">
              {filtered.map((m, i) => {
                const adherence = calcAdherence(m);
                const s = getStatus(m);
                return (
                  <Reveal key={m.id} delay={i * 0.05}>
                    <div className="group relative bg-white border border-slate-100 rounded-[28px] p-6 md:p-8 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                       {/* Card Shine Effect */}
                       <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-700 bg-gradient-to-tr from-transparent via-indigo-500/[0.03] to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-[1.5s]" />
                       
                       <div className="relative z-10 flex flex-col md:flex-row gap-8 justify-between items-start md:items-center">
                          <div className="flex gap-6 items-start">
                             <div className="w-16 h-16 rounded-[22px] bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors shrink-0">
                                <BeakerIcon className="h-8 w-8 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                             </div>
                             <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                   <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${s.color} flex items-center gap-1`}>
                                      <s.icon className="h-3 w-3" /> {s.label}
                                   </span>
                                   <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${adherence >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                      {adherence}% Reliability
                                   </span>
                                </div>
                                <h4 className="text-xl font-black text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">{m.name}</h4>
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                   <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><ClockIcon className="h-4 w-4 text-indigo-400" /> {m.dosage} · {m.frequency}</div>
                                   <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><CalendarIcon className="h-4 w-4" /> Started {new Date(m.startDate).toLocaleDateString()}</div>
                                </div>
                                {m.instructions && <p className="text-xs font-medium text-slate-400 bg-slate-50 italic px-3 py-2 rounded-xl inline-block border border-slate-100 max-w-lg">{m.instructions}</p>}
                             </div>
                          </div>

                          <div className="flex items-center gap-3 w-full md:w-auto pl-[88px] md:pl-0">
                             <button onClick={() => { setSelectedMedicine(m); setShowDetailModal(true); }} className="flex-1 md:flex-none h-12 px-8 bg-slate-900 text-white rounded-[16px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:shadow-slate-500/20 active:scale-95">
                                <EyeIcon className="h-4 w-4" /> Inspect
                             </button>
                          </div>
                       </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {activeTab === 'logs' && (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
           <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Audit Ledger</h4>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Full transaction history of pharmaceutical adjustments.</p>
           </div>
           {logsLoading ? <div className="p-20 text-center text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Reading Logs...</div> : (
              <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50/30">
                       <tr>
                          <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</th>
                          <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction</th>
                          <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Entity</th>
                          <th className="px-8 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Officer</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {logs?.map((log) => (
                          <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                             <td className="px-8 py-5 text-xs font-bold text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                             <td className="px-8 py-5">
                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${log.action === 'Prescribed' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{log.action}</span>
                             </td>
                             <td className="px-8 py-5 text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{log.medicineName}</td>
                             <td className="px-8 py-5 text-xs font-bold text-slate-400">Dr. {log.doctor?.user?.firstName} {log.doctor?.user?.lastName}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           )}
        </motion.div>
      )}

      {/* DETAIL MODAL */}
      <AnimatePresence>
        {showDetailModal && selectedMedicine && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden ring-1 ring-white/20">
               <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm flex items-center justify-between z-20">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                        <ClipboardDocumentListIcon className="h-6 w-6 text-slate-900" />
                     </div>
                     <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">{selectedMedicine.name}</h2>
                        <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Archive ID #{selectedMedicine.id}</p>
                     </div>
                  </div>
                  <button onClick={() => setShowDetailModal(false)} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm active:scale-90"><XCircleIcon className="h-5 w-5" /></button>
               </div>

               <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white">
                  <div className="grid grid-cols-2 gap-4">
                     <ModalStat label="Standard Dosage" value={selectedMedicine.dosage} color="bg-indigo-50 text-indigo-900" />
                     <ModalStat label="Recurrence" value={selectedMedicine.frequency} color="bg-violet-50 text-violet-900" />
                     <ModalStat label="Cycle Start" value={new Date(selectedMedicine.startDate).toLocaleDateString()} color="bg-slate-50 text-slate-900" />
                     <ModalStat label="Verified By" value={`Dr. ${selectedMedicine.doctor.user.lastName}`} color="bg-emerald-50 text-emerald-900" />
                  </div>

                  {selectedMedicine.instructions && (
                     <div className="bg-slate-50 border border-slate-100 p-6 rounded-[24px]">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Physician Directive</p>
                        <p className="text-sm font-medium text-slate-700 leading-relaxed italic">{selectedMedicine.instructions}</p>
                     </div>
                  )}

                  {selectedMedicine.dosages?.length > 0 && (
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Ingestion Telemetry</h4>
                        <div className="grid gap-2">
                           {selectedMedicine.dosages.slice(0, 5).map((d) => (
                              <div key={d.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 transition-colors">
                                 <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-xs font-bold text-slate-900">{new Date(d.takenAt).toLocaleString()}</span>
                                 </div>
                                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-lg">Qty: {d.quantity}</span>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  {selectedMedicine.reminders?.length > 0 && (
                     <div className="pt-6 border-t border-slate-100">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-4">Notification Array</h4>
                        <div className="flex flex-wrap gap-2">
                           {selectedMedicine.reminders.map((r) => (
                              <div key={r.id} className={`px-4 py-3 rounded-xl border flex items-center gap-3 transition-colors ${r.isActive ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                 <ClockIcon className={`h-4 w-4 ${r.isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                                 <span className="text-xs font-black text-slate-900">{r.time} <span className="text-[10px] font-bold text-slate-400 ml-1">({r.dayOfWeek})</span></span>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
               </div>

               <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                  <button onClick={() => setShowDetailModal(false)} className="px-10 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 active:scale-95 transition-all">Close Vault</button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatBox = ({ label, value, dotColor }: any) => (
  <div className="bg-white border border-slate-100 rounded-[24px] p-5 shadow-sm group hover:border-indigo-200 transition-all duration-300">
     <p className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} /> {label}
     </p>
     <p className="text-2xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-none">{value ?? '—'}</p>
  </div>
);

const ModalStat = ({ label, value, color }: any) => (
  <div className={`p-4 rounded-2xl ${color.split(' ')[0]} border border-slate-100`}>
     <p className="text-[9px] font-black uppercase tracking-[0.1em] opacity-60 mb-1">{label}</p>
     <p className="text-sm font-black tracking-tight">{value}</p>
  </div>
);

export default MedicineHistory;
