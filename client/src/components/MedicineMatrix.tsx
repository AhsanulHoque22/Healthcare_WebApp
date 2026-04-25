import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../api/api';
import { 
  CheckCircleIcon,
  ClockIcon,
  BeakerIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import MedicineReminderSettings from './MedicineReminderSettings';
import { Reveal } from './landing/AnimatedSection';

interface MedicineDosage {
  id: number;
  medicineId: number;
  takenAt: string;
  quantity: number;
  notes?: string;
}

interface TimeSlot {
  time: string;
  label: string;
}

interface Medicine {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string | null;
  expectedTimes: TimeSlot[];
}

interface ReminderSettings {
  id?: number;
  patientId: number;
  morningTime: string;
  lunchTime: string;
  dinnerTime: string;
  enabled: boolean;
  notificationEnabled: boolean;
  reminderMinutesBefore: number;
}

interface MedicineMatrixProps {
  patientId: number;
}

const MedicineMatrix: React.FC<MedicineMatrixProps> = ({ patientId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const queryClient = useQueryClient();

  const generateDateRange = (startDate: Date) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = generateDateRange(selectedDate);

  const generateCustomTimeSlots = (medicine: any) => {
    if (!reminderSettings || !reminderSettings?.enabled) return medicine.expectedTimes || [];
    const customTimes: TimeSlot[] = [];
    if (medicine.expectedTimes) {
      medicine.expectedTimes.forEach((originalTime: TimeSlot) => {
        let customTime = null;
        if (originalTime.label?.toLowerCase().includes('morning') || originalTime.label?.toLowerCase().includes('breakfast')) {
          customTime = { ...originalTime, time: reminderSettings?.morningTime || '08:00', label: 'Morning' };
        } else if (originalTime.label?.toLowerCase().includes('lunch')) {
          customTime = { ...originalTime, time: reminderSettings?.lunchTime || '12:00', label: 'Lunch' };
        } else if (originalTime.label?.toLowerCase().includes('dinner') || originalTime.label?.toLowerCase().includes('evening')) {
          customTime = { ...originalTime, time: reminderSettings?.dinnerTime || '19:00', label: 'Dinner' };
        } else { customTime = originalTime; }
        if (customTime) customTimes.push(customTime);
      });
    }
    return customTimes;
  };

  const { data: reminderSettings } = useQuery<ReminderSettings>({
    queryKey: ['medicine-reminder-settings', patientId],
    queryFn: async () => {
      const response = await API.get(`/medicines/patients/${patientId}/reminder-settings`, { params: { _t: Date.now() } });
      return response.data.data;
    },
    enabled: !!patientId,
    staleTime: 0, gcTime: 0, refetchOnWindowFocus: true, refetchOnMount: true
  });

  const { data: medicinesData, isLoading } = useQuery({
    queryKey: ['medicine-matrix', patientId, selectedDate.toISOString().split('T')[0], reminderSettings?.enabled || false, reminderSettings?.morningTime || '08:00', reminderSettings?.lunchTime || '12:00', reminderSettings?.dinnerTime || '19:00'],
    queryFn: async () => {
      const startDate = dates[0].toISOString().split('T')[0];
      const endDate = dates[6].toISOString().split('T')[0];
      const response = await API.get(`/medicines/patients/${patientId}/schedule/range`, { params: { startDate, endDate, _t: Date.now() } });
      return response.data.data;
    },
  });

  const recordDosageMutation = useMutation({
    mutationFn: async ({ medicineId, date, timeSlot }: { medicineId: number; date: string; timeSlot: string; }) => {
      const response = await API.post(`/medicines/dosage/${medicineId}`, {
        quantity: 1,
        notes: `Taken at ${timeSlot} on ${date}`,
        takenAt: new Date(`${date}T${timeSlot.split(':')[0]}:${timeSlot.split(':')[1]}:00`).toISOString()
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Medicine recorded! 💊');
      queryClient.invalidateQueries({ queryKey: ['medicine-matrix', patientId] });
      queryClient.invalidateQueries({ queryKey: ['medicine-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-medicine-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['medicine-stats', patientId] });
    },
    onMutate: async ({ medicineId, date, timeSlot }) => {
      const queryKey = ['medicine-matrix', patientId, selectedDate.toISOString().split('T')[0]];
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        const newData = { ...old };
        if (newData.dosages) {
          newData.dosages = [...newData.dosages, {
            id: Date.now(), medicineId,
            takenAt: new Date(`${date}T${timeSlot.split(':')[0]}:${timeSlot.split(':')[1]}:00`),
            quantity: 1, notes: `Taken at ${timeSlot} on ${date}`
          }];
        }
        return newData;
      });
      return { previousData, queryKey };
    },
    onError: (error: any, v, context) => {
      if (context?.previousData) queryClient.setQueryData(context.queryKey, context.previousData);
      toast.error(error.response?.data?.message || 'Failed to record dose');
    }
  });

  const handleTakeDose = (medicineId: number, date: string, timeSlot: string) => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    if (date > currentDate) { toast.error('Cannot mark future medicine as taken'); return; }
    if (date === currentDate) {
      const timeMatch = timeSlot.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const expectedHour = parseInt(timeMatch[1]);
        const expectedMinute = parseInt(timeMatch[2]);
        const currentTimeMinutes = currentHour * 60 + currentMinute;
        const expectedTimeMinutes = expectedHour * 60 + expectedMinute;
        if (currentTimeMinutes < expectedTimeMinutes - 30) { toast.error('Cannot mark future medicine as taken'); return; }
      }
    }
    recordDosageMutation.mutate({ medicineId, date, timeSlot });
  };

  const isDoseTaken = (medicineId: number, date: string, timeSlot: string) => {
    if (!medicinesData?.dosages) return false;
    const targetDate = new Date(date);
    const targetHour = parseInt(timeSlot.split(':')[0]);
    return medicinesData.dosages.some((dosage: MedicineDosage) => {
      const dosageDate = new Date(dosage.takenAt);
      return dosage.medicineId === medicineId && dosageDate.toDateString() === targetDate.toDateString() && Math.abs(dosageDate.getHours() - targetHour) <= 2;
    });
  };

  const getActualIntakeTime = (medicineId: number, date: string, timeSlot: string) => {
    if (!medicinesData?.dosages) return null;
    const targetDate = new Date(date);
    const targetHour = parseInt(timeSlot.split(':')[0]);
    const matchingDosage = medicinesData.dosages.find((dosage: MedicineDosage) => {
      const dosageDate = new Date(dosage.takenAt);
      return dosage.medicineId === medicineId && dosageDate.toDateString() === targetDate.toDateString() && Math.abs(dosageDate.getHours() - targetHour) <= 2;
    });
    if (matchingDosage) {
      const intakeDate = new Date(matchingDosage.takenAt);
      return `${intakeDate.getHours().toString().padStart(2, '0')}:${intakeDate.getMinutes().toString().padStart(2, '0')}`;
    }
    return null;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
  };

  const discontinueExpiredMedicine = async (medicineId: number) => {
    try {
      await API.put(`/medicines/${medicineId}`, { isActive: false, endDate: new Date().toISOString().split('T')[0], instructions: 'Discontinued due to duration limit' });
      toast.success('Discontinued successfully');
      queryClient.invalidateQueries({ queryKey: ['medicine-matrix', patientId] });
    } catch (error: any) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  if (isLoading) return <div className="p-12 text-center text-slate-400 font-medium animate-pulse">Scanning health matrix...</div>;

  if (!medicinesData?.medicines || medicinesData.medicines.length === 0) {
    return (
      <div className="p-20 text-center space-y-6">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-100 shadow-sm">
          <BeakerIcon className="h-8 w-8 text-slate-300" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">No Active Prescriptions</h3>
          <p className="text-slate-400 font-medium text-sm">Your medicine schedule is currently empty for this period.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* ═══ Header ═══ */}
      <div className="p-6 md:p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-px h-8 bg-indigo-500/30" />
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Weekly Logistics</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {dates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowReminderSettings(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
            <BellIcon className="h-3.5 w-3.5" /> Reminders
          </button>
          
          <div className="h-4 w-px bg-slate-100 mx-2" />

          <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
            <button onClick={() => navigateWeek('prev')} className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-slate-900">
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button onClick={() => navigateWeek('next')} className="p-2 hover:bg-white rounded-lg transition-all text-slate-400 hover:text-slate-900">
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══ The Matrix ═══ */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="text-left py-4 px-8 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 min-w-[240px]">Medicine Information</th>
              {dates.map((date, i) => (
                <th key={i} className={`py-4 px-4 text-center min-w-[120px] ${date.toDateString() === new Date().toDateString() ? 'relative' : ''}`}>
                  <div className={`text-[10px] font-black uppercase tracking-widest ${date.toDateString() === new Date().toDateString() ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-xs font-black mt-0.5 ${date.toDateString() === new Date().toDateString() ? 'text-indigo-900' : 'text-slate-900'}`}>
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  {date.toDateString() === new Date().toDateString() && (
                    <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-indigo-500 rounded-full" />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {medicinesData.medicines.map((medicine: Medicine, i: number) => (
              <tr key={medicine.id} className="group hover:bg-slate-50/30 transition-colors">
                <td className="py-6 px-8 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 tracking-tight">{medicine.name}</span>
                    {!medicine.endDate && Math.floor((new Date().getTime() - new Date(medicine.startDate).getTime()) / 86400000) > 83 && (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-black uppercase rounded-md border border-rose-100 animate-pulse">Expiring</span>
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-400 flex flex-col gap-0.5">
                    <span>{medicine.dosage}</span>
                    <span className="text-[10px] opacity-70 italic">{medicine.frequency}</span>
                  </div>
                </td>
                {dates.map((date, di) => {
                  const checkDate = new Date(date);
                  const sDate = new Date(medicine.startDate);
                  const eDate = medicine.endDate ? new Date(medicine.endDate) : null;
                  const wasActive = checkDate >= sDate && (!eDate || checkDate <= eDate) && (!eDate ? Math.floor((checkDate.getTime() - sDate.getTime()) / 86400000) <= 90 : true);

                  return (
                    <td key={di} className={`py-6 px-2 text-center ${date.toDateString() === new Date().toDateString() ? 'bg-indigo-50/10' : ''}`}>
                      {wasActive ? (
                        <div className="flex flex-col gap-2 px-2">
                          {generateCustomTimeSlots(medicine).map((slot: TimeSlot, si: number) => {
                            const taken = isDoseTaken(medicine.id, date.toISOString().split('T')[0], slot.time);
                            const actualTime = getActualIntakeTime(medicine.id, date.toISOString().split('T')[0], slot.time);
                            const isToday = date.toDateString() === new Date().toDateString();
                            const isPast = date < new Date() && !isToday;
                            const isFuture = date > new Date();
                            
                            let isFutureTime = false;
                            if (isToday) {
                              const n = new Date();
                              const tMatch = slot.time.match(/(\d{1,2}):(\d{2})/);
                              if (tMatch) isFutureTime = (n.getHours() * 60 + n.getMinutes()) < (parseInt(tMatch[1]) * 60 + parseInt(tMatch[2]) - 30);
                            }

                            return (
                              <button key={si} disabled={taken || isPast || isFuture || isFutureTime}
                                onClick={() => handleTakeDose(medicine.id, date.toISOString().split('T')[0], slot.time)}
                                className={`w-full py-1.5 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                  taken ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' :
                                  isPast ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-40' :
                                  (isFuture || isFutureTime) ? 'bg-amber-50/30 text-amber-500/50 border-amber-100/50 cursor-not-allowed' :
                                  'bg-white text-indigo-600 border-slate-200 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 active:scale-95'
                                }`}>
                                <div className="flex flex-col">
                                  <span>{slot.label}</span>
                                  <span className="opacity-60 text-[8px] tracking-normal mt-0.5">{taken && actualTime ? actualTime : slot.time}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-slate-100 font-bold">—</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ Modal ═══ */}
      <AnimatePresence>
        {showReminderSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[200] p-4"
            onClick={() => setShowReminderSettings(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] p-2 border border-white/20 shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <MedicineReminderSettings patientId={patientId} onClose={() => setShowReminderSettings(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MedicineMatrix;
