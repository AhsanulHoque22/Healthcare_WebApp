import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { 
  CheckCircleIcon,
  ClockIcon,
  BeakerIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  PlusIcon,
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
  instructions: string;
  doctor: string;
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

interface MedicineTrackerProps {
  patientId: number;
}

const MedicineTracker: React.FC<MedicineTrackerProps> = ({ patientId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const queryClient = useQueryClient();

  // Fetch today's medicine schedule
  const { data: scheduleData, isLoading, error } = useQuery<ScheduleData>({
    queryKey: ['medicine-schedule', patientId, selectedDate],
    queryFn: async () => {
      console.log('🔍 DEBUG: MedicineTracker fetching schedule for patient:', patientId);
      const response = await axios.get(`/medicines/patients/${patientId}/schedule/today`);
      console.log('🔍 DEBUG: MedicineTracker schedule response:', response.data.data);
      return response.data.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
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
      toast.success('Medicine dose recorded! 💊');
      queryClient.invalidateQueries({ queryKey: ['medicine-schedule', patientId] });
      queryClient.invalidateQueries({ queryKey: ['medicine-stats', patientId] });
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

  const getTimeStatusIcon = (status: string) => {
    switch (status) {
      case 'taken':
        return <CheckCircleIconSolid className="h-5 w-5 text-green-600" />;
      case 'missed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />;
      case 'upcoming':
        return <ClockIcon className="h-5 w-5 text-blue-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading medicine schedule...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Schedule</h3>
        <p className="text-gray-600">Failed to load your medicine schedule. Please try again.</p>
      </div>
    );
  }

  if (!scheduleData || scheduleData.schedule.length === 0) {
    return (
      <div className="text-center py-12">
        <BeakerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Medicines</h3>
        <p className="text-gray-600">
          You don't have any active medicines to track today. Completed medicines are shown in your medicine history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with overall stats */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-50 mr-2">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Medicine Tracker</h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowReminderSettings(true)}
              className="group flex items-center text-sm text-blue-600 hover:text-blue-700 transition-all"
            >
              <BellIcon className="h-4 w-4 mr-1 group-hover:rotate-12 transition-transform" />
              Set Reminders
            </button>
            <div className="text-sm text-gray-500">
              {new Date(scheduleData.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow">
            <div className="flex items-center">
              <BeakerIcon className="h-6 w-6 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Medicines</p>
                <p className="text-2xl font-bold text-blue-900">{scheduleData.totalMedicines}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Taken Today</p>
                <p className="text-2xl font-bold text-green-900">{scheduleData.takenDoses}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow">
            <div className="flex items-center">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">Remaining</p>
                <p className="text-2xl font-bold text-yellow-900">{scheduleData.totalDoses - scheduleData.takenDoses}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Adherence</p>
                <p className="text-2xl font-bold text-purple-900">{scheduleData.overallAdherence}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Medicine Schedule */}
      <div className="space-y-4">
        {(() => {
          console.log('🔍 DEBUG: MedicineTracker rendering medicines:', scheduleData.schedule.length, 'medicines');
          return null;
        })()}
        {scheduleData.schedule.map((medicine) => {
          console.log('🔍 DEBUG: MedicineTracker rendering medicine:', medicine.name, 'with', medicine.expectedTimes?.length, 'time slots');
          return (
          <div key={medicine.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-500 hover:shadow-md hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {medicine.name}
                </h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Dosage:</span> {medicine.dosage}</p>
                  <p><span className="font-medium">Frequency:</span> {medicine.frequency}</p>
                  <p><span className="font-medium">Prescribed by:</span> {medicine.doctor}</p>
                  {medicine.instructions && (
                    <p><span className="font-medium">Instructions:</span> {medicine.instructions}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500 mb-1">Today's Progress</div>
                <div className="text-2xl font-bold text-blue-600">
                  {medicine.totalTaken}/{medicine.totalExpected}
                </div>
                <div className="text-sm text-gray-600">{medicine.adherence}% adherence</div>
              </div>
            </div>

            {/* Time slots */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {medicine.expectedTimes.map((timeSlot, index) => {
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
                
                console.log('🔍 DEBUG: Button rendering (MedicineTracker)', {
                  medicineName: medicine.name,
                  timeSlot: timeSlot.label,
                  status,
                  isDisabled,
                  isFuture,
                  finalDisabled,
                  currentTime: `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`
                });
                
                return (
                  <div
                    key={index}
                    className={`group p-4 rounded-lg border-2 ${getTimeStatusColor(status)} transition-all duration-300 ${
                      !finalDisabled ? 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer' : 'cursor-not-allowed'
                    }`}
                    style={{ animation: 'fadeIn 0.4s ease-out', animationDelay: `${index * 60}ms` }}
                    onClick={() => {
                      console.log('🔍 DEBUG: MedicineTracker button clicked!', {
                        medicineName: medicine.name,
                        timeSlot: timeSlot.label,
                        finalDisabled,
                        medicineId: medicine.id
                      });
                      if (!finalDisabled) {
                        handleTakeDose(medicine.id, timeSlot.label);
                      } else {
                        console.log('🔍 DEBUG: MedicineTracker button is disabled, not calling handleTakeDose');
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {timeSlot.label}
                        </div>
                        <div className="text-sm opacity-75">{timeSlot.time}</div>
                      </div>
                      <div className="flex items-center transform transition-transform group-hover:scale-110">
                        {getTimeStatusIcon(status)}
                      </div>
                    </div>
                    
                    {timeSlot.taken && timeSlot.takenAt && (
                      <div className="mt-2 text-xs opacity-75">
                        Taken at {new Date(timeSlot.takenAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                    
                    {!finalDisabled && (
                      <div className="mt-2 text-xs text-blue-700/80">
                        Click to mark as taken
                      </div>
                    )}
                    {finalDisabled && isFuture && (
                      <div className="mt-2 text-xs text-red-600">
                        Cannot take future medicine
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
        })}
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

export default MedicineTracker;
