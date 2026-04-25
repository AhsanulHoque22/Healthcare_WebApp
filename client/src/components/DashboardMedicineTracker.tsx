import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../api/api';
import { 
  CheckCircleIcon,
  ClockIcon,
  BeakerIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import MedicineReminderSettings from './MedicineReminderSettings';
import { Reveal } from './landing/AnimatedSection';

interface MedicineSchedule {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  expectedTimes: Array<{
    time: string;
    label: string;
    taken: boolean;
    dosageId?: number;
    takenAt?: string;
  }>;
  totalExpected: number;
  totalTaken: number;
  adherence: number;
}

interface ScheduleData {
  date: string;
  schedule: MedicineSchedule[];
  totalMedicines: number;
  totalDoses: number;
  takenDoses: number;
  overallAdherence: number;
}

interface DashboardMedicineTrackerProps {
  patientId: number;
}

const DashboardMedicineTracker: React.FC<DashboardMedicineTrackerProps> = ({ patientId }) => {
  const queryClient = useQueryClient();
  const [showReminderSettings, setShowReminderSettings] = useState(false);

  const { data: scheduleData, isLoading, error } = useQuery<ScheduleData>({
    queryKey: ['dashboard-medicine-schedule', patientId],
    queryFn: async () => {
      const response = await API.get(`/medicines/patients/${patientId}/schedule/today`);
      return response.data.data;
    },
    refetchInterval: 60000,
  });

  const recordDosageMutation = useMutation({
    mutationFn: async ({ medicineId, timeSlot }: { medicineId: number; timeSlot: string }) => {
      const response = await API.post(`/medicines/${medicineId}/take-dose`, {
        quantity: 1, notes: `Taken at ${timeSlot}`, takenAt: new Date().toISOString()
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Medicine taken! 💊');
      queryClient.invalidateQueries({ queryKey: ['dashboard-medicine-schedule', patientId] });
      queryClient.invalidateQueries({ queryKey: ['medicine-schedule', patientId] });
      queryClient.invalidateQueries({ queryKey: ['medicine-stats', patientId] });
      queryClient.invalidateQueries({ queryKey: ['medicine-matrix'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed')
  });

  const handleTakeDose = (medicineId: number, timeSlot: string) => {
    const now = new Date();
    const tMatch = timeSlot.match(/(\d{1,2}):(\d{2})/);
    if (!tMatch) { toast.error('Invalid format'); return; }
    if ((now.getHours() * 60 + now.getMinutes()) < (parseInt(tMatch[1]) * 60 + parseInt(tMatch[2]) - 30)) {
      toast.error('Cannot mark future as taken'); return;
    }
    recordDosageMutation.mutate({ medicineId, timeSlot });
  };

  if (isLoading) return <div className="p-8 text-center text-slate-400 font-medium">Syncing doses...</div>;
  if (!scheduleData || scheduleData.schedule.length === 0) return null;

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-[32px] border border-slate-100 p-6 md:p-8 shadow-sm group hover:shadow-xl transition-all duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <BeakerIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Today's Regimen</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{scheduleData.overallAdherence}% adherence</p>
          </div>
        </div>
        <button onClick={() => setShowReminderSettings(true)}
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
          <BellIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="w-full bg-slate-50 rounded-full h-1.5 mb-8 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${scheduleData.overallAdherence}%` }}
          className="h-full bg-indigo-500 rounded-full" />
      </div>

      <div className="space-y-4">
        {scheduleData.schedule.map((med, i) => (
          <div key={med.id} className="p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
            <div className="flex items-center justify-between mb-4 px-1">
              <div>
                <h4 className="text-sm font-black text-slate-900">{med.name}</h4>
                <p className="text-[10px] font-bold text-slate-400">{med.dosage}</p>
              </div>
              <div className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                {med.totalTaken}/{med.totalExpected}
              </div>
            </div>
            <div className="flex gap-2">
              {med.expectedTimes.map((slot, si) => {
                const now = new Date();
                const tMatch = slot.label.match(/(\d{1,2}):(\d{2})/);
                const isFuture = tMatch ? (now.getHours() * 60 + now.getMinutes()) < (parseInt(tMatch[1]) * 60 + parseInt(tMatch[2]) - 30) : false;
                const disabled = slot.taken || isFuture;

                return (
                  <button key={si} disabled={disabled} onClick={() => !disabled && handleTakeDose(med.id, slot.label)}
                    className={`flex-1 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                      slot.taken ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      isFuture ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50' :
                      'bg-white text-indigo-600 border-slate-100 hover:border-indigo-500 active:scale-95'
                    }`}>
                    {slot.time}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showReminderSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200] p-4"
            onClick={() => setShowReminderSettings(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-[32px] overflow-hidden" onClick={e => e.stopPropagation()}>
              <MedicineReminderSettings patientId={patientId} onClose={() => setShowReminderSettings(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardMedicineTracker;
