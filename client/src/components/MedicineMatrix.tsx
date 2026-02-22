import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
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
import { toast } from 'react-hot-toast';
import MedicineReminderSettings from './MedicineReminderSettings';

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

  // Generate array of dates (7 days)
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

  // Function to generate custom time slots based on reminder settings
  const generateCustomTimeSlots = (medicine: any) => {
    if (!reminderSettings || !reminderSettings?.enabled) {
      // Fall back to original times if no reminder settings
      return medicine.expectedTimes || [];
    }

    // Create custom time slots based on reminder settings
    const customTimes: TimeSlot[] = [];
    
    if (medicine.expectedTimes) {
      medicine.expectedTimes.forEach((originalTime: TimeSlot) => {
        // Map original time labels to reminder settings
        let customTime = null;
        
        if (originalTime.label?.toLowerCase().includes('morning') || 
            originalTime.label?.toLowerCase().includes('breakfast')) {
          customTime = {
            ...originalTime,
            time: reminderSettings?.morningTime || '08:00',
            label: 'Morning'
          };
        } else if (originalTime.label?.toLowerCase().includes('lunch')) {
          customTime = {
            ...originalTime,
            time: reminderSettings?.lunchTime || '12:00',
            label: 'Lunch'
          };
        } else if (originalTime.label?.toLowerCase().includes('dinner') || 
                   originalTime.label?.toLowerCase().includes('evening')) {
          customTime = {
            ...originalTime,
            time: reminderSettings?.dinnerTime || '19:00',
            label: 'Dinner'
          };
        } else {
          // Keep original time for other cases
          customTime = originalTime;
        }
        
        if (customTime) {
          customTimes.push(customTime);
        }
      });
    }
    
    console.log('🔍 DEBUG: Generated custom time slots for medicine:', medicine.name, customTimes);
    return customTimes;
  };

  // Fetch reminder settings
  const { data: reminderSettings } = useQuery<ReminderSettings>({
    queryKey: ['medicine-reminder-settings', patientId],
    queryFn: async () => {
      console.log('🔍 DEBUG: MedicineMatrix fetching reminder settings for patient:', patientId);
      const response = await axios.get(`/medicines/patients/${patientId}/reminder-settings`, {
        params: { _t: Date.now() } // Cache-busting parameter
      });
      console.log('🔍 DEBUG: MedicineMatrix reminder settings response:', response.data.data);
      return response.data.data;
    },
    enabled: !!patientId,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache the data (replaces cacheTime)
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true // Always refetch on mount
  });

  // Debug reminder settings changes
  useEffect(() => {
    console.log('🔍 DEBUG: MedicineMatrix reminder settings updated:', reminderSettings);
  }, [reminderSettings]);

  // Fetch medicines for the date range
  const { data: medicinesData, isLoading } = useQuery({
    queryKey: ['medicine-matrix', patientId, selectedDate.toISOString().split('T')[0], reminderSettings?.enabled || false, reminderSettings?.morningTime || '08:00', reminderSettings?.lunchTime || '12:00', reminderSettings?.dinnerTime || '19:00'],
    queryFn: async () => {
      const startDate = dates[0].toISOString().split('T')[0];
      const endDate = dates[6].toISOString().split('T')[0];
      
      console.log('🔍 DEBUG: MedicineMatrix fetching medicines for patient:', patientId, 'from', startDate, 'to', endDate);
      const response = await axios.get(`/medicines/patients/${patientId}/schedule/range`, {
        params: { startDate, endDate, _t: Date.now() } // Cache-busting parameter
      });
      console.log('🔍 DEBUG: MedicineMatrix medicines response:', response.data.data);
      return response.data.data;
    },
  });

  // Mutation for recording medicine dosage
  const recordDosageMutation = useMutation({
    mutationFn: async ({ 
      medicineId, 
      date, 
      timeSlot 
    }: { 
      medicineId: number; 
      date: string; 
      timeSlot: string; 
    }) => {
      const response = await axios.post(`/medicines/dosage/${medicineId}`, {
        quantity: 1,
        notes: `Taken at ${timeSlot} on ${date}`,
        takenAt: new Date(`${date}T${timeSlot.split(':')[0]}:${timeSlot.split(':')[1]}:00`).toISOString()
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Medicine recorded! 💊');
      // Invalidate all related queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['medicine-matrix', patientId] });
      queryClient.invalidateQueries({ queryKey: ['medicine-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-medicine-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['medicine-stats', patientId] });
    },
    onMutate: async ({ medicineId, date, timeSlot }) => {
      // Optimistically update the UI immediately
      const queryKey = ['medicine-matrix', patientId, selectedDate.toISOString().split('T')[0]];
      await queryClient.cancelQueries({ queryKey });
      
      const previousData = queryClient.getQueryData(queryKey);
      
      // Optimistically update the data
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        
        const newData = { ...old };
        if (newData.dosages) {
          newData.dosages = [...newData.dosages, {
            id: Date.now(), // temporary ID
            medicineId,
            takenAt: new Date(`${date}T${timeSlot.split(':')[0]}:${timeSlot.split(':')[1]}:00`),
            quantity: 1,
            notes: `Taken at ${timeSlot} on ${date}`
          }];
        }
        return newData;
      });
      
      return { previousData, queryKey };
    },
    onError: (error: any, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousData) {
        queryClient.setQueryData(context.queryKey, context.previousData);
      }
      toast.error(error.response?.data?.message || 'Failed to record dose');
    }
  });

  const handleTakeDose = (medicineId: number, date: string, timeSlot: string) => {
    console.log('🔍 DEBUG: MedicineMatrix handleTakeDose called', {
      medicineId,
      date,
      timeSlot
    });
    
    // Prevent marking future medicines as taken
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Check if date is in the future
    if (date > currentDate) {
      console.log('❌ BLOCKED: Future date medicine cannot be taken', { date, currentDate });
      toast.error('Cannot mark future medicine as taken');
      return;
    }
    
    // Check if time is in the future (only for today's medicines)
    if (date === currentDate) {
      const timeMatch = timeSlot.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const expectedHour = parseInt(timeMatch[1]);
        const expectedMinute = parseInt(timeMatch[2]);
        
        const currentTimeMinutes = currentHour * 60 + currentMinute;
        const expectedTimeMinutes = expectedHour * 60 + expectedMinute;
        
        console.log('🔍 DEBUG: Time validation', {
          currentTime: `${currentHour}:${currentMinute.toString().padStart(2, '0')}`,
          expectedTime: `${expectedHour}:${expectedMinute.toString().padStart(2, '0')}`,
          currentTimeMinutes,
          expectedTimeMinutes,
          canTake: currentTimeMinutes >= expectedTimeMinutes - 30
        });
        
        // Only allow taking medicine if it's the current time or past the expected time (with 30 min grace period)
        if (currentTimeMinutes < expectedTimeMinutes - 30) {
          console.log('❌ BLOCKED: Future time medicine cannot be taken');
          toast.error('Cannot mark future medicine as taken');
          return;
        }
      }
    }
    
    console.log('✅ ALLOWED: Medicine can be taken');
    recordDosageMutation.mutate({ medicineId, date, timeSlot });
  };

  // Check if a dose is being recorded for a specific medicine/date/time
  const isRecordingDose = (medicineId: number, date: string, timeSlot: string) => {
    return recordDosageMutation.isPending && 
           recordDosageMutation.variables?.medicineId === medicineId &&
           recordDosageMutation.variables?.date === date &&
           recordDosageMutation.variables?.timeSlot === timeSlot;
  };

  const isDoseTaken = (medicineId: number, date: string, timeSlot: string) => {
    if (!medicinesData?.dosages) return false;
    
    const targetDate = new Date(date);
    const targetTime = timeSlot.split(':');
    const targetHour = parseInt(targetTime[0]);
    
    return medicinesData.dosages.some((dosage: MedicineDosage) => {
      const dosageDate = new Date(dosage.takenAt);
      const dosageHour = dosageDate.getHours();
      
      return (
        dosage.medicineId === medicineId &&
        dosageDate.toDateString() === targetDate.toDateString() &&
        Math.abs(dosageHour - targetHour) <= 2 // Within 2 hours
      );
    });
  };

  const getActualIntakeTime = (medicineId: number, date: string, timeSlot: string) => {
    if (!medicinesData?.dosages) return null;
    
    const targetDate = new Date(date);
    const targetTime = timeSlot.split(':');
    const targetHour = parseInt(targetTime[0]);
    
    const matchingDosage = medicinesData.dosages.find((dosage: MedicineDosage) => {
      const dosageDate = new Date(dosage.takenAt);
      const dosageHour = dosageDate.getHours();
      
      return (
        dosage.medicineId === medicineId &&
        dosageDate.toDateString() === targetDate.toDateString() &&
        Math.abs(dosageHour - targetHour) <= 2 // Within 2 hours
      );
    });
    
    if (matchingDosage) {
      const intakeDate = new Date(matchingDosage.takenAt);
      const hours = intakeDate.getHours().toString().padStart(2, '0');
      const minutes = intakeDate.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    }
    
    return null;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
  };

  // Helper function to discontinue expired medicines
  const discontinueExpiredMedicine = async (medicineId: number) => {
    try {
      await axios.put(`/medicines/${medicineId}`, {
        isActive: false,
        endDate: new Date().toISOString().split('T')[0],
        instructions: 'Medicine discontinued due to exceeding maximum duration limit (90 days)'
      });
      
      toast.success('Medicine discontinued successfully');
      queryClient.invalidateQueries({ queryKey: ['medicine-matrix', patientId] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to discontinue medicine');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading medicine schedule...</span>
        </div>
      </div>
    );
  }

  if (!medicinesData?.medicines || medicinesData.medicines.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <BeakerIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Medicines for This Week</h3>
          <p className="text-gray-600">
            You don't have any active medicines during this week. 
            Try navigating to a different week or check your medicine history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200 p-6 transition-all duration-300 hover:shadow-md animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="p-2 rounded-lg bg-blue-50 mr-2">
            <BeakerIcon className="h-6 w-6 text-blue-600 transition-transform duration-300 group-hover:rotate-6" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 tracking-tight">Medicine Tracker</h3>
          {(reminderSettings?.enabled || false) && (
            <div className="ml-3 flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs rounded-full">
              <BellIcon className="h-3 w-3 mr-1" />
              Custom Times
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Reminder Settings Button */}
          <button
            onClick={() => {
              console.log('🔍 DEBUG: Set Reminders button clicked');
              setShowReminderSettings(true);
            }}
            className="flex items-center px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            <BellIcon className="h-4 w-4 mr-1" />
            Set Reminders
          </button>
          
          {/* Week Navigation */}
          <div className="flex items-center space-x-2">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
            {dates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {dates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <button
            onClick={() => navigateWeek('next')}
            className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
          </div>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2 font-medium text-gray-700">Medicine</th>
              {dates.map((date, index) => (
                <th key={index} className={`text-center py-3 px-2 font-medium min-w-[100px] transition-all duration-300 ${date.toDateString() === new Date().toDateString() ? 'text-blue-700' : 'text-gray-700'}`} style={{ animationDelay: `${index * 60}ms` }}>
                  <div className={`text-sm ${date.toDateString() === new Date().toDateString() ? 'animate-pulse-slow' : ''}`}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className={`text-xs ${date.toDateString() === new Date().toDateString() ? 'text-blue-600' : 'text-gray-500'}`}>
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {medicinesData.medicines.map((medicine: Medicine, rowIndex: number) => (
              <tr key={medicine.id} className="border-b border-gray-100 animate-slide-up" style={{ animationDelay: `${rowIndex * 80}ms` }}>
                <td className="py-4 px-2">
                  <div>
                    <div className="font-medium text-gray-900 flex items-center">
                      {medicine.name}
                      {(() => {
                        // Show warning for medicines without end date that are approaching limit
                        if (!medicine.endDate) {
                          const daysSinceStart = Math.floor((new Date().getTime() - new Date(medicine.startDate).getTime()) / (1000 * 60 * 60 * 24));
                          const maxDuration = 90;
                          if (daysSinceStart > maxDuration - 7) { // Warning 7 days before limit
                            return (
                              <div className="ml-2 flex items-center gap-2">
                                <span className="px-2 py-1 text-xs bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-full">
                                  {daysSinceStart >= maxDuration ? 'Expired' : `${maxDuration - daysSinceStart} days left`}
                                </span>
                                {daysSinceStart >= maxDuration && (
                                  <button
                                    onClick={() => discontinueExpiredMedicine(medicine.id)}
                                    className="px-2 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded-full hover:bg-red-100 transition-colors"
                                  >
                                    Discontinue
                                  </button>
                                )}
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                    </div>
                    <div className="text-sm text-gray-600">{medicine.dosage}</div>
                    <div className="text-xs text-gray-500">{medicine.frequency}</div>
                    {medicine.endDate && (
                      <div className="text-xs text-gray-400">
                        Until {new Date(medicine.endDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </td>
                {dates.map((date, dateIndex) => {
                  // Check if medicine was active on this date
                  const isMedicineActiveOnDate = () => {
                    const checkDate = new Date(date);
                    const medicineStartDate = new Date(medicine.startDate);
                    const medicineEndDate = medicine.endDate ? new Date(medicine.endDate) : null;
                    
                    // Medicine is active if:
                    // 1. It started on or before the check date
                    // 2. It either has no end date OR ends on or after the check date
                    // 3. For medicines with no end date, limit to reasonable duration (e.g., 90 days)
                    const isStarted = checkDate >= medicineStartDate;
                    const isNotExpired = !medicineEndDate || checkDate <= medicineEndDate;
                    
                    // For medicines with no end date, limit to 90 days from start date
                    const maxDuration = 90; // days
                    const daysSinceStart = Math.floor((checkDate.getTime() - medicineStartDate.getTime()) / (1000 * 60 * 60 * 24));
                    const withinMaxDuration = !medicineEndDate ? daysSinceStart <= maxDuration : true;
                    
                    return isStarted && isNotExpired && withinMaxDuration;
                  };
                  
                  const wasActive = isMedicineActiveOnDate();
                  
                  return (
                    <td key={dateIndex} className={`py-4 px-2 text-center ${date.toDateString() === new Date().toDateString() ? 'bg-blue-50/40' : ''}`}>
                      {wasActive ? (
                        <div className="space-y-1">
                          {generateCustomTimeSlots(medicine).map((timeSlot: TimeSlot, timeIndex: number) => {
                            const isTaken = isDoseTaken(medicine.id, date.toISOString().split('T')[0], timeSlot.time);
                            const actualIntakeTime = getActualIntakeTime(medicine.id, date.toISOString().split('T')[0], timeSlot.time);
                            const isToday = date.toDateString() === new Date().toDateString();
                            const isPast = date < new Date() && !isToday;
                            const isFuture = date > new Date();
                            const isRecording = isRecordingDose(medicine.id, date.toISOString().split('T')[0], timeSlot.time);
                            
                            // Check if time is in the future (for today's medicines)
                            let isFutureTime = false;
                            if (isToday) {
                              const now = new Date();
                              const currentHour = now.getHours();
                              const currentMinute = now.getMinutes();
                              const timeMatch = timeSlot.time.match(/(\d{1,2}):(\d{2})/);
                              
                              if (timeMatch) {
                                const expectedHour = parseInt(timeMatch[1]);
                                const expectedMinute = parseInt(timeMatch[2]);
                                const currentTimeMinutes = currentHour * 60 + currentMinute;
                                const expectedTimeMinutes = expectedHour * 60 + expectedMinute;
                                isFutureTime = currentTimeMinutes < expectedTimeMinutes - 30;
                              }
                            }
                            
                            return (
                              <button
                                key={timeIndex}
                                onClick={() => {
                                  console.log('🔍 DEBUG: MedicineMatrix button clicked!', {
                                    medicineName: medicine.name,
                                    medicineId: medicine.id,
                                    date: date.toISOString().split('T')[0],
                                    timeSlot: timeSlot.time,
                                    isTaken,
                                    isPast,
                                    isFuture,
                                    isFutureTime,
                                    isRecording,
                                    canTake: !isTaken && !isPast && !isFuture && !isFutureTime && !isRecording
                                  });
                                  if (!isTaken && !isPast && !isFuture && !isFutureTime && !isRecording) {
                                    handleTakeDose(medicine.id, date.toISOString().split('T')[0], timeSlot.time);
                                  } else {
                                    console.log('🔍 DEBUG: MedicineMatrix button blocked - isTaken:', isTaken, 'isPast:', isPast, 'isFuture:', isFuture, 'isFutureTime:', isFutureTime, 'isRecording:', isRecording);
                                  }
                                }}
                                disabled={isTaken || isPast || isFuture || isFutureTime}
                                className={`w-full p-1 rounded text-xs font-medium transition-all duration-300 ${
                                  isTaken
                                    ? 'bg-green-100 text-green-800 border border-green-200'
                                    : isPast
                                    ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                    : isFuture
                                    ? 'bg-orange-50 text-orange-600 border border-orange-200 cursor-not-allowed opacity-60'
                                    : isFutureTime
                                    ? 'bg-yellow-50 text-yellow-600 border border-yellow-200 cursor-not-allowed opacity-60'
                                    : isToday
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:-translate-y-0.5'
                                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 hover:-translate-y-0.5'
                                }`}
                                style={{ animation: 'fadeIn 0.35s ease-out', animationDelay: `${timeIndex * 70}ms` }}
                              >
                                <div className="flex items-center justify-center">
                                  {isTaken ? (
                                    <CheckCircleIconSolid className="h-3 w-3 mr-1" />
                                  ) : (
                                    <ClockIcon className="h-3 w-3 mr-1" />
                                  )}
                                  <span>{timeSlot.label}</span>
                                </div>
                                <div className="text-xs opacity-75">
                                  {isTaken && actualIntakeTime ? actualIntakeTime : timeSlot.time}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-gray-300 text-xs">
                          -
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {/* Reminder Settings Modal */}
      {showReminderSettings && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 transition-opacity duration-300"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              console.log('🔍 DEBUG: Reminder settings modal closed by clicking outside');
              setShowReminderSettings(false);
            }
          }}
        >
          <MedicineReminderSettings
            patientId={patientId}
            onClose={() => {
              console.log('🔍 DEBUG: Reminder settings modal closed');
              setShowReminderSettings(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default MedicineMatrix;
