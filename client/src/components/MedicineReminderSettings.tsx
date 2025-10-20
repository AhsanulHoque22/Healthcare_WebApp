import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  BellIcon,
  ClockIcon,
  SunIcon,
  MoonIcon,
  DevicePhoneMobileIcon,
  XMarkIcon,
  CheckIcon
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

  // Fetch existing reminder settings
  const { data: existingSettings, isLoading, error } = useQuery<ReminderSettings>({
    queryKey: ['medicine-reminder-settings', patientId],
    queryFn: async () => {
      console.log('🔍 DEBUG: Fetching reminder settings for patient:', patientId);
      console.log('🔍 DEBUG: API base URL:', axios.defaults.baseURL);
      console.log('🔍 DEBUG: Auth token present:', !!localStorage.getItem('token'));
      console.log('🔍 DEBUG: User role:', user?.role);
      console.log('🔍 DEBUG: User ID:', user?.id);
      
      try {
        const response = await axios.get(`/medicines/patients/${patientId}/reminder-settings`, {
          params: { _t: Date.now() } // Cache-busting parameter
        });
        console.log('🔍 DEBUG: Reminder settings response:', response.data);
        console.log('🔍 DEBUG: Response data.data:', response.data.data);
        return response.data.data;
      } catch (error: any) {
        console.error('🔍 DEBUG: Error fetching reminder settings:', error);
        console.error('🔍 DEBUG: Error response:', error.response?.data);
        console.error('🔍 DEBUG: Error status:', error.response?.status);
        throw error;
      }
    },
    enabled: !!patientId && !!user,
    retry: 1,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache the data (replaces cacheTime)
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true // Always refetch on mount
  });

  // Update settings when data is fetched
  useEffect(() => {
    if (existingSettings && typeof existingSettings === 'object') {
      console.log('🔍 DEBUG: Updating settings from API response:', existingSettings);
      // Ensure all required properties exist
      const updatedSettings: ReminderSettings = {
        patientId: existingSettings.patientId || patientId,
        morningTime: existingSettings.morningTime || '08:00',
        lunchTime: existingSettings.lunchTime || '12:00',
        dinnerTime: existingSettings.dinnerTime || '19:00',
        enabled: existingSettings.enabled !== undefined ? existingSettings.enabled : true,
        notificationEnabled: existingSettings.notificationEnabled !== undefined ? existingSettings.notificationEnabled : true,
        reminderMinutesBefore: existingSettings.reminderMinutesBefore || 15
      };
      setSettings(updatedSettings);
    }
  }, [existingSettings, patientId]);

  // Debug: Log current settings state
  useEffect(() => {
    console.log('🔍 DEBUG: Current settings state:', settings);
  }, [settings]);

  // Debug: Log query error
  useEffect(() => {
    if (error) {
      console.error('🔍 DEBUG: Query error:', error);
    }
  }, [error]);

  // Force 24-hour format for time inputs
  useEffect(() => {
    const timeInputs = document.querySelectorAll('input[type="time"]');
    timeInputs.forEach((input: any) => {
      // Set additional attributes to force 24-hour format
      input.setAttribute('data-format', '24');
      input.setAttribute('lang', 'en-GB');
      
      // Ensure the value is in 24-hour format
      if (input.value) {
        const time = input.value;
        const [hours, minutes] = time.split(':');
        const hour24 = parseInt(hours);
        
        // If it's in 12-hour format, convert to 24-hour
        if (hour24 > 12) {
          input.value = `${hour24.toString().padStart(2, '0')}:${minutes}`;
        } else if (hour24 === 0) {
          input.value = `00:${minutes}`;
        }
      }
    });
  }, [settings.morningTime, settings.lunchTime, settings.dinnerTime]);

  // Save reminder settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (reminderSettings: ReminderSettings) => {
      console.log('🔍 DEBUG: ===== SAVING REMINDER SETTINGS =====');
      console.log('🔍 DEBUG: Patient ID:', patientId, typeof patientId);
      console.log('🔍 DEBUG: Reminder settings:', reminderSettings);
      console.log('🔍 DEBUG: Auth token present:', !!localStorage.getItem('token'));
      console.log('🔍 DEBUG: Auth token value:', localStorage.getItem('token')?.substring(0, 20) + '...');
      console.log('🔍 DEBUG: Axios default headers:', axios.defaults.headers.common);
      console.log('🔍 DEBUG: API URL:', `/medicines/patients/${patientId}/reminder-settings`);
      
      // Validate patient ID
      if (!patientId || patientId <= 0) {
        throw new Error(`Invalid patient ID: ${patientId}`);
      }
      
      try {
        console.log('🔍 DEBUG: Making API request...');
        const response = await axios.post(`/medicines/patients/${patientId}/reminder-settings`, reminderSettings);
        console.log('🔍 DEBUG: Save reminder settings response:', response.data);
        return response.data;
      } catch (error: any) {
        console.error('🔍 DEBUG: Save reminder settings error:', error);
        console.error('🔍 DEBUG: Error response:', error.response?.data);
        console.error('🔍 DEBUG: Error status:', error.response?.status);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('🔍 DEBUG: Save successful, response data:', data);
      toast.success('Reminder settings saved successfully! 🔔');
      
      // Close modal first
      if (onClose) onClose();
      
      // Invalidate and refetch with a small delay to ensure settings are saved
      setTimeout(() => {
        console.log('🔍 DEBUG: Refreshing all medicine-related queries after settings save');
        
        // Invalidate and refetch reminder settings
        queryClient.invalidateQueries({ queryKey: ['medicine-reminder-settings', patientId] });
        
        // Invalidate and refetch medicine matrix with all variations
        queryClient.invalidateQueries({ queryKey: ['medicine-matrix'] });
        queryClient.invalidateQueries({ queryKey: ['medicine-schedule-range'] });
        
        // Also refetch dashboard medicine tracker
        queryClient.invalidateQueries({ queryKey: ['today-medicine-schedule'] });
        
        // Force refetch of all queries
        queryClient.refetchQueries({ queryKey: ['medicine-reminder-settings', patientId] });
        queryClient.refetchQueries({ queryKey: ['medicine-matrix'] });
        
        // Also update the local state with the saved data
        if (data && data.data) {
          console.log('🔍 DEBUG: Updating local state with saved data:', data.data);
          setSettings(data.data);
        }
      }, 100);
    },
    onError: (error: any) => {
      console.error('🔍 DEBUG: Save reminder settings error:', error);
      console.error('🔍 DEBUG: Error response:', error.response?.data);
      console.error('🔍 DEBUG: Error status:', error.response?.status);
      console.error('🔍 DEBUG: Error code:', error.code);
      
      let errorMessage = 'Failed to save reminder settings';
      
      if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in to save reminder settings';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Please check your permissions';
      } else if (error.response?.status === 404) {
        errorMessage = 'Patient not found. Please refresh the page and try again.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  });

  // Test notification mutation
  const testNotificationMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(`/medicines/patients/${patientId}/test-reminder`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Test notification sent! 📱');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send test notification');
    }
  });

  const handleSave = () => {
    if (!user) {
      toast.error('Please log in to save reminder settings');
      return;
    }

    // Validate settings before saving
    if (!settings.morningTime || !settings.lunchTime || !settings.dinnerTime) {
      toast.error('Please set all reminder times');
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(settings.morningTime) || 
        !timeRegex.test(settings.lunchTime) || 
        !timeRegex.test(settings.dinnerTime)) {
      toast.error('Please enter valid time format (HH:MM)');
      return;
    }

    // Validate reminder minutes
    if (settings.reminderMinutesBefore < 1 || settings.reminderMinutesBefore > 120) {
      toast.error('Reminder minutes must be between 1 and 120');
      return;
    }
    
    console.log('🔍 DEBUG: User authenticated:', !!user);
    console.log('🔍 DEBUG: User details:', user);
    console.log('🔍 DEBUG: Auth token present:', !!localStorage.getItem('token'));
    console.log('🔍 DEBUG: Auth token value:', localStorage.getItem('token')?.substring(0, 20) + '...');
    console.log('🔍 DEBUG: Patient ID:', patientId);
    console.log('🔍 DEBUG: Settings to save:', settings);
    console.log('🔍 DEBUG: Axios default headers:', axios.defaults.headers.common);
    
    saveSettingsMutation.mutate(settings);
  };

  const handleTestNotification = async () => {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      toast.error('This browser does not support notifications');
      return;
    }

    // Request permission if not already granted
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Notification permission denied');
        return;
      }
    }

    if (Notification.permission === 'denied') {
      toast.error('Notification permission denied. Please enable notifications in your browser settings.');
      return;
    }

    // Send test notification via API
    testNotificationMutation.mutate();

    // Also show a browser notification
    if (Notification.permission === 'granted') {
      new Notification('Medicine Reminder Test', {
        body: 'This is a test notification for your medicine reminder settings.',
        icon: '/favicon.ico',
        tag: 'medicine-reminder-test'
      });
    }
  };

  // Helper function to ensure 24-hour format
  const formatTo24Hour = (timeString: string): string => {
    if (!timeString) return timeString;
    
    // If already in 24-hour format (HH:MM), return as is
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
      return timeString;
    }
    
    // If in 12-hour format with AM/PM, convert to 24-hour
    const match = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const period = match[3].toUpperCase();
      
      if (period === 'AM') {
        if (hours === 12) hours = 0;
      } else { // PM
        if (hours !== 12) hours += 12;
      }
      
      return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }
    
    return timeString;
  };

  const handleTimeChange = (timeType: 'morningTime' | 'lunchTime' | 'dinnerTime', value: string) => {
    console.log('🔍 DEBUG: Time changed:', timeType, value);
    const formattedTime = formatTo24Hour(value);
    console.log('🔍 DEBUG: Formatted time:', formattedTime);
    setSettings(prev => ({
      ...prev,
      [timeType]: formattedTime
    }));
  };

  const handleToggle = (field: 'enabled' | 'notificationEnabled') => {
    console.log('🔍 DEBUG: Toggle changed:', field, 'from', settings[field], 'to', !settings[field]);
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading reminder settings...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md mx-auto">
        <div className="text-center">
          <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600 mb-4">Please log in to access medicine reminder settings.</p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          /* Force 24-hour format for time inputs */
          input[type="time"] {
            -webkit-appearance: none;
            -moz-appearance: textfield;
            direction: ltr;
            text-align: left;
          }
          
          /* Chrome/Safari - Hide AM/PM indicator */
          input[type="time"]::-webkit-datetime-edit-ampm-field {
            display: none !important;
          }
          
          input[type="time"]::-webkit-datetime-edit-text {
            color: transparent;
          }
          
          input[type="time"]::-webkit-datetime-edit-hour-field {
            color: black !important;
          }
          
          input[type="time"]::-webkit-datetime-edit-minute-field {
            color: black !important;
          }
          
          /* Firefox specific */
          input[type="time"]::-moz-placeholder {
            color: transparent;
          }
          
          /* Force 24-hour format display */
          input[type="time"][lang="en-GB"] {
            -webkit-appearance: none;
            -moz-appearance: textfield;
          }
          
          /* Additional browser-specific overrides */
          input[type="time"]::-webkit-calendar-picker-indicator {
            display: none;
          }
        `}
      </style>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <BellIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Medicine Reminders</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Enable/Disable Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">Enable Reminders</h4>
            <p className="text-xs text-gray-500">Turn on/off all medicine reminders</p>
          </div>
          <button
            onClick={() => handleToggle('enabled')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {settings.enabled && (
        <>
          {/* Time Settings */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">Reminder Times</h4>
              <span className="text-xs text-gray-500">24-hour format</span>
            </div>
            
            {/* Morning */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <SunIcon className="h-5 w-5 text-yellow-500 mr-2" />
                <span className="text-sm text-gray-700">Morning</span>
              </div>
              <input
                type="time"
                value={settings.morningTime}
                onChange={(e) => handleTimeChange('morningTime', e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="00:00"
                max="23:59"
                step="300"
                data-format="24"
                lang="en-GB"
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            {/* Lunch */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-orange-500 mr-2" />
                <span className="text-sm text-gray-700">Lunch</span>
              </div>
              <input
                type="time"
                value={settings.lunchTime}
                onChange={(e) => handleTimeChange('lunchTime', e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="00:00"
                max="23:59"
                step="300"
                data-format="24"
                lang="en-GB"
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            {/* Dinner */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MoonIcon className="h-5 w-5 text-purple-500 mr-2" />
                <span className="text-sm text-gray-700">Dinner</span>
              </div>
              <input
                type="time"
                value={settings.dinnerTime}
                onChange={(e) => handleTimeChange('dinnerTime', e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="00:00"
                max="23:59"
                step="300"
                data-format="24"
                lang="en-GB"
                style={{ fontFamily: 'monospace' }}
              />
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-4 mb-6">
            <h4 className="text-sm font-medium text-gray-900">Notification Settings</h4>
            
            {/* Browser Notifications */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DevicePhoneMobileIcon className="h-5 w-5 text-blue-500 mr-2" />
                <div>
                  <span className="text-sm text-gray-700">Browser Notifications</span>
                  <p className="text-xs text-gray-500">Receive notifications in your browser</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('notificationEnabled')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notificationEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notificationEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Reminder Minutes Before */}
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Remind me (minutes before)
              </label>
              <select
                value={settings.reminderMinutesBefore}
                onChange={(e) => {
                  console.log('🔍 DEBUG: Reminder minutes changed to:', e.target.value);
                  setSettings(prev => ({
                    ...prev,
                    reminderMinutesBefore: parseInt(e.target.value)
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={5}>5 minutes before</option>
                <option value={10}>10 minutes before</option>
                <option value={15}>15 minutes before</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
              </select>
            </div>
          </div>

          {/* Test Notification */}
          {settings.notificationEnabled && (
            <div className="mb-6">
              <button
                onClick={handleTestNotification}
                disabled={testNotificationMutation.isPending}
                className="w-full flex items-center justify-center px-4 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <BellIcon className="h-4 w-4 mr-2" />
                {testNotificationMutation.isPending ? 'Sending...' : 'Send Test Notification'}
              </button>
            </div>
          )}
        </>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saveSettingsMutation.isPending}
          className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saveSettingsMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> Make sure to allow notifications in your browser settings for the best experience.
        </p>
      </div>
    </div>
    </>
  );
};

export default MedicineReminderSettings;
