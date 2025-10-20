import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
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
import MedicineReminderSettings from './MedicineReminderSettings';

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

  // Fetch today's medicine schedule
  const { data: scheduleData, isLoading, error } = useQuery<ScheduleData>({
    queryKey: ['dashboard-medicine-schedule', patientId],
    queryFn: async () => {
      console.log('🔍 DEBUG: Fetching medicine schedule for patient:', patientId);
      const response = await axios.get(`/medicines/patients/${patientId}/schedule/today`);
      console.log('🔍 DEBUG: Medicine schedule response:', response.data.data);
      return response.data.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Mutation for recording medicine dosage
  const recordDosageMutation = useMutation({
    mutationFn: async ({ medicineId, timeSlot }: { medicineId: number; timeSlot: string }) => {
      const response = await axios.post(`/medicines/${medicineId}/take-dose`, {
        quantity: 1,
        notes: `Taken at ${timeSlot}`,
        takenAt: new Date().toISOString()
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Medicine taken! 💊');
      // Invalidate all related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['dashboard-medicine-schedule', patientId] });
      queryClient.invalidateQueries({ queryKey: ['medicine-schedule', patientId] });
      queryClient.invalidateQueries({ queryKey: ['medicine-stats', patientId] });
      queryClient.invalidateQueries({ queryKey: ['medicine-matrix'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record dose');
    }
  });

  const handleTakeDose = (medicineId: number, timeSlot: string) => {
    // Prevent marking future medicines as taken
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    console.log('🔍 DEBUG: handleTakeDose called', {
      medicineId,
      timeSlot,
      currentTime: `${currentHour}:${currentMinute.toString().padStart(2, '0')}`,
      currentTimeMinutes: currentHour * 60 + currentMinute
    });
    
    // Parse time from timeSlot (format: "Morning 08:00")
    const timeMatch = timeSlot.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) {
      console.error('❌ Invalid time format:', timeSlot);
      toast.error('Invalid time format');
      return;
    }
    
    const expectedHour = parseInt(timeMatch[1]);
    const expectedMinute = parseInt(timeMatch[2]);
    
    // Calculate current time in minutes and expected time in minutes
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    const expectedTimeMinutes = expectedHour * 60 + expectedMinute;
    
    console.log('🔍 DEBUG: Time comparison', {
      expectedTime: `${expectedHour}:${expectedMinute.toString().padStart(2, '0')}`,
      expectedTimeMinutes,
      currentTimeMinutes,
      difference: expectedTimeMinutes - currentTimeMinutes,
      canTake: currentTimeMinutes >= expectedTimeMinutes - 30
    });
    
    // Only allow taking medicine if it's the current time or past the expected time (with 30 min grace period)
    if (currentTimeMinutes < expectedTimeMinutes - 30) {
      console.log('❌ BLOCKED: Future medicine cannot be taken');
      toast.error('Cannot mark future medicine as taken');
      return;
    }
    
    console.log('✅ ALLOWED: Medicine can be taken');
    recordDosageMutation.mutate({ medicineId, timeSlot });
  };

  const getTimeStatus = (timeSlot: { time: string; label: string; taken: boolean }) => {
    const now = new Date();
    const currentHour = now.getHours();
    const expectedHour = parseInt(timeSlot.time.split(':')[0]);
    
    if (timeSlot.taken) {
      return 'taken';
    } else if (currentHour >= expectedHour) {
      return 'missed';
    } else {
      return 'upcoming';
    }
  };

  const getTimeStatusColor = (status: string) => {
    switch (status) {
      case 'taken':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'missed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'upcoming':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading medicines...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-4">
          <ExclamationTriangleIcon className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">Error Loading Medicines</h3>
          <p className="text-xs text-gray-600">Failed to load your medicine schedule</p>
        </div>
      </div>
    );
  }

  if (!scheduleData || scheduleData.schedule.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-4">
          <BeakerIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">No Active Medicines</h3>
          <p className="text-xs text-gray-600">
            You don't have any active medicines today. Completed medicines are shown in your medicine history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 rounded-md bg-blue-50 mr-2">
            <BeakerIcon className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Today's Medicines</h3>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowReminderSettings(true)}
            className="group flex items-center text-sm text-blue-600 hover:text-blue-700 transition-all"
          >
            <BellIcon className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform" />
            Reminders
          </button>
          <div className="text-sm text-gray-500">
            {scheduleData.takenDoses}/{scheduleData.totalDoses} taken
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Progress</span>
          <span>{scheduleData.overallAdherence}% adherence</span>
        </div>
        <div className="w-full bg-gray-200/70 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${scheduleData.overallAdherence}%` }}
          ></div>
        </div>
      </div>

      {/* Medicine List */}
      <div className="space-y-3">
        {(() => {
          console.log('🔍 DEBUG: Rendering medicines:', scheduleData.schedule.length, 'medicines');
          return null;
        })()}
        {scheduleData.schedule.map((medicine) => {
          console.log('🔍 DEBUG: Rendering medicine:', medicine.name, 'with', medicine.expectedTimes?.length, 'time slots');
          return (
            <div key={medicine.id} className="border border-gray-200 rounded-lg p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{medicine.name}</h4>
                <p className="text-xs text-gray-600">{medicine.dosage}</p>
              </div>
              <div className="text-xs text-gray-500">
                {medicine.totalTaken}/{medicine.totalExpected}
              </div>
            </div>

            {/* Time Slots */}
            <div className="flex gap-2">
              {(() => {
                console.log('🔍 DEBUG: Rendering time slots for', medicine.name, ':', medicine.expectedTimes);
                return null;
              })()}
              {medicine.expectedTimes.map((timeSlot, index) => {
                console.log('🔍 DEBUG: Rendering time slot:', timeSlot.label, 'at', timeSlot.time, 'taken:', timeSlot.taken);
                const status = getTimeStatus(timeSlot);
                const isDisabled = timeSlot.taken || status === 'missed';
                
                // Additional check for future medicines
                const now = new Date();
                const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
                const timeMatch = timeSlot.label.match(/(\d{1,2}):(\d{2})/);
                let isFuture = false;
                
                if (timeMatch) {
                  const expectedHour = parseInt(timeMatch[1]);
                  const expectedMinute = parseInt(timeMatch[2]);
                  const expectedTimeMinutes = expectedHour * 60 + expectedMinute;
                  isFuture = currentTimeMinutes < expectedTimeMinutes - 30;
                }
                
                const finalDisabled = isDisabled || isFuture;
                
                console.log('🔍 DEBUG: Button rendering', {
                  medicineName: medicine.name,
                  timeSlot: timeSlot.label,
                  status,
                  isDisabled,
                  isFuture,
                  finalDisabled,
                  currentTime: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
                });
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      console.log('🔍 DEBUG: Button clicked!', {
                        medicineName: medicine.name,
                        timeSlot: timeSlot.label,
                        finalDisabled,
                        medicineId: medicine.id
                      });
                      if (!finalDisabled) {
                        handleTakeDose(medicine.id, timeSlot.label);
                      } else {
                        console.log('🔍 DEBUG: Button is disabled, not calling handleTakeDose');
                      }
                    }}
                    disabled={finalDisabled}
                    className={`flex-1 p-2 rounded-md border text-xs font-medium transition-all duration-300 ${
                      getTimeStatusColor(status)
                    } ${
                      !finalDisabled ? 'hover:shadow-sm hover:-translate-y-0.5 cursor-pointer' : 'cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      {timeSlot.taken ? (
                        <CheckCircleIconSolid className="h-4 w-4 mr-1" />
                      ) : (
                        <ClockIcon className="h-4 w-4 mr-1" />
                      )}
                      <span>{timeSlot.label}</span>
                    </div>
                    <div className="text-xs opacity-75 mt-1">{timeSlot.time}</div>
                    {finalDisabled && isFuture && (
                      <div className="text-xs text-red-600 mt-1">
                        Future
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
        })}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-600">
          <span>{scheduleData.totalMedicines} medicines</span>
          <span className="text-blue-600 font-medium">
            {scheduleData.totalDoses - scheduleData.takenDoses} remaining
          </span>
        </div>
      </div>

      {/* Reminder Settings Modal */}
      {showReminderSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <MedicineReminderSettings
            patientId={patientId}
            onClose={() => setShowReminderSettings(false)}
          />
        </div>
      )}
    </div>
  );
};

export default DashboardMedicineTracker;
