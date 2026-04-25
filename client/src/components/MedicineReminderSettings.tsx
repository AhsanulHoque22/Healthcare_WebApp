import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';
import { 
  BellIcon,
  ClockIcon,
  SunIcon,
  MoonIcon,
  DevicePhoneMobileIcon,
  XMarkIcon,
  CheckIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

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

interface MedicineReminderSettingsProps {
  patientId: number;
  onClose?: () => void;
}

const MedicineReminderSettings: React.FC<MedicineReminderSettingsProps> = ({ 
  patientId, 
  onClose 
}) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ReminderSettings>({
    patientId,
    morningTime: '08:00',
    lunchTime: '12:00',
    dinnerTime: '19:00',
    enabled: true,
    notificationEnabled: true,
    reminderMinutesBefore: 15
  });

  const queryClient = useQueryClient();

  const { data: existingSettings, isLoading } = useQuery<ReminderSettings>({
    queryKey: ['medicine-reminder-settings', patientId],
    queryFn: async () => {
      const response = await API.get(`/medicines/patients/${patientId}/reminder-settings`, {
        params: { _t: Date.now() }
      });
      return response.data.data;
    },
    enabled: !!patientId && !!user,
    staleTime: 0,
  });

  useEffect(() => {
    if (existingSettings && typeof existingSettings === 'object') {
      setSettings({
        patientId: existingSettings.patientId || patientId,
        morningTime: existingSettings.morningTime || '08:00',
        lunchTime: existingSettings.lunchTime || '12:00',
        dinnerTime: existingSettings.dinnerTime || '19:00',
        enabled: existingSettings.enabled !== undefined ? existingSettings.enabled : true,
        notificationEnabled: existingSettings.notificationEnabled !== undefined ? existingSettings.notificationEnabled : true,
        reminderMinutesBefore: existingSettings.reminderMinutesBefore || 15
      });
    }
  }, [existingSettings, patientId]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (reminderSettings: ReminderSettings) => {
      const response = await API.post(`/medicines/patients/${patientId}/reminder-settings`, reminderSettings);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Clinical sync complete. Reminders updated.');
      if (onClose) onClose();
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['medicine-reminder-settings', patientId] });
        queryClient.invalidateQueries({ queryKey: ['today-medicine-schedule'] });
      }, 100);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Sync failed');
    }
  });

  const handleSave = () => {
    if (!settings.morningTime || !settings.lunchTime || !settings.dinnerTime) {
      toast.error('Protocol incomplete: Set all time windows');
      return;
    }
    saveSettingsMutation.mutate(settings);
  };

  const handleToggle = (field: 'enabled' | 'notificationEnabled') => {
    setSettings(prev => ({ ...prev, [field]: !prev[field] }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <motion.div 
           animate={{ rotate: 360 }}
           transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
           className="w-10 h-10 border-2 border-slate-100 border-t-indigo-500 rounded-full" 
        />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessing Registry...</span>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-white/80 backdrop-blur-2xl rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-white/60 p-10 w-full max-w-xl mx-auto overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
      
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-slate-900 rounded-[22px] flex items-center justify-center text-white shadow-2xl">
              <BellIcon className="h-7 w-7" />
           </div>
           <div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Pharma-Sync</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Clinical Adherence Protocols</p>
           </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all"><XMarkIcon className="h-5 w-5 text-slate-400" /></button>
        )}
      </div>

      <div className="space-y-8">
        {/* ═══ TOP-LEVEL TOGGLE ═══ */}
        <div className="bg-slate-50/50 rounded-[32px] p-6 border border-slate-100 flex items-center justify-between group">
           <div className="flex items-center gap-5">
              <div className={`p-3 rounded-xl transition-colors ${settings.enabled ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                 <AdjustmentsHorizontalIcon className="h-5 w-5" />
              </div>
              <div>
                 <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Global Reminders</span>
                 <p className="text-[10px] font-bold text-slate-400">Enable automated clinical alerts</p>
              </div>
           </div>
           <button
            onClick={() => handleToggle('enabled')}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all ${
              settings.enabled ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
          >
            <motion.span
              animate={{ x: settings.enabled ? 24 : 4 }}
              className="inline-block h-5 w-5 rounded-full bg-white shadow-sm"
            />
          </button>
        </div>

        <AnimatePresence>
          {settings.enabled && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-10"
            >
              {/* ═══ TIME SLOTS ═══ */}
              <div className="space-y-5">
                <div className="flex items-center justify-between px-2">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Temporal Windows (24H)</h4>
                   <SparklesIcon className="h-4 w-4 text-indigo-400 animate-pulse" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: 'Morning', field: 'morningTime' as const, icon: SunIcon, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Lunch', field: 'lunchTime' as const, icon: ClockIcon, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                    { label: 'Dinner', field: 'dinnerTime' as const, icon: MoonIcon, color: 'text-violet-500', bg: 'bg-violet-50' }
                  ].map((slot) => (
                    <div key={slot.field} className="relative group">
                       <div className={`absolute inset-0 ${slot.bg} rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity blur-xl`} />
                       <div className="relative bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm hover:border-slate-200 transition-all flex md:flex-col items-center justify-between gap-4">
                          <slot.icon className={`h-6 w-6 ${slot.color}`} />
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{slot.label}</span>
                          <input
                            type="time"
                            value={settings[slot.field]}
                            onChange={(e) => setSettings(prev => ({ ...prev, [slot.field]: e.target.value }))}
                            className="bg-slate-50/50 border-none rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-500/10 w-full text-center"
                          />
                       </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ═══ NOTIFICATION CONFIG ═══ */}
              <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <DevicePhoneMobileIcon className="h-20 w-20" />
                </div>
                <div className="relative z-10 space-y-6">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                            <BellIcon className="h-5 w-5" />
                         </div>
                         <div>
                            <span className="text-xs font-black uppercase tracking-widest opacity-80">Sync Delivery</span>
                            <h5 className="text-[10px] font-bold text-white/50">Push to primary device</h5>
                         </div>
                      </div>
                      <button
                        onClick={() => handleToggle('notificationEnabled')}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
                          settings.notificationEnabled ? 'bg-indigo-500' : 'bg-white/10'
                        }`}
                      >
                        <motion.span
                          animate={{ x: settings.notificationEnabled ? 22 : 4 }}
                          className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
                        />
                      </button>
                   </div>

                   <div className="flex flex-col gap-3">
                      <label className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Pre-Check Buffer</label>
                      <select
                        value={settings.reminderMinutesBefore}
                        onChange={(e) => setSettings(prev => ({ ...prev, reminderMinutesBefore: parseInt(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-black text-white focus:ring-2 focus:ring-indigo-500 uppercase tracking-widest"
                      >
                        <option className="bg-slate-900" value={5}>5m Pre-alert</option>
                        <option className="bg-slate-900" value={15}>15m Pre-alert</option>
                        <option className="bg-slate-900" value={30}>30m Pre-alert</option>
                        <option className="bg-slate-900" value={60}>1h Pre-alert</option>
                      </select>
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ ACTIONS ═══ */}
        <div className="flex flex-col gap-4 mt-10">
          <button
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 transition-all hover:bg-indigo-600 flex items-center justify-center gap-4 disabled:opacity-50"
          >
            {saveSettingsMutation.isPending ? "Updating Protocol..." : "Activate Clinical Sync"}
            {!saveSettingsMutation.isPending && <CheckIcon className="h-4 w-4" />}
          </button>
          
          <button onClick={onClose} className="text-[9px] font-black text-slate-300 hover:text-slate-900 uppercase tracking-[0.4em] transition-all py-2">
             Decline Changes
          </button>
        </div>
      </div>

      <div className="mt-8 p-6 bg-indigo-50/50 rounded-[28px] border border-indigo-50 flex items-start gap-4">
          <AcademicCapIcon className="h-5 w-5 text-indigo-500 mt-1 shrink-0" />
          <p className="text-[10px] font-bold text-indigo-900 leading-relaxed uppercase tracking-wider">
             Ensure notification permissions are active on the host OS for neural synchronization.
          </p>
      </div>
    </motion.div>
  );
};

export default MedicineReminderSettings;
