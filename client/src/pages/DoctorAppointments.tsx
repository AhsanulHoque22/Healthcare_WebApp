import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  ClockIcon, 
  CheckIcon, 
  XMarkIcon,
  CalendarIcon,
  UserIcon,
  EyeIcon,
  FunnelIcon,
  CheckCircleIcon,
  PlayIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  PhoneIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  MapPinIcon,
  IdentificationIcon,
  StarIcon,
  ArrowPathIcon,
  ChartBarIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import PrescriptionInterface from '../components/PrescriptionInterface';
import PrescriptionView from '../components/PrescriptionView';

interface Appointment {
  id: number;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  status: 'requested' | 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  serialNumber: number;
  type: string;
  reason: string;
  symptoms: string;
  notes: string;
  diagnosis: string;
  prescription: string;
  startedAt?: string;
  completedAt?: string;
  patient: {
    id: number;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      dateOfBirth: string;
      gender: string;
      address: string;
    };
    bloodType: string;
    allergies: string;
    medicalHistory: string;
    currentMedications: string;
    emergencyContact: string;
    emergencyPhone: string;
  };
}

const DoctorAppointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showVideoInPrescription, setShowVideoInPrescription] = useState(false);
  const [selectedAppointmentForPrescription, setSelectedAppointmentForPrescription] = useState<Appointment | null>(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    appointmentDate: '',
    timeBlock: '09:00-12:00'
  });
  const [isLoading, setIsLoading] = useState(false);

  const timeBlocks = [
    { value: '09:00-12:00', label: 'Morning Chamber (9:00 AM - 12:00 PM)' },
    { value: '14:00-17:00', label: 'Afternoon Chamber (2:00 PM - 5:00 PM)' },
    { value: '19:00-22:00', label: 'Evening Chamber (7:00 PM - 10:00 PM)' }
  ];

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      // First get the doctor profile to get the doctor ID
      const doctorProfileResponse = await axios.get('/doctors/profile');
      const doctorId = doctorProfileResponse.data.data.doctor.id;
      
      // Then fetch appointments for this specific doctor (get all appointments, not just first page)
      const response = await axios.get(`/doctors/${doctorId}/appointments`, {
        params: { limit: 1000 } // Get all appointments, not just first 10
      });
      const appointments = response.data.data.appointments || [];
      
      console.log('Fetched appointments:', appointments.length);
      console.log('Appointments with requested status:', appointments.filter((apt: any) => apt.status === 'requested'));
      
      setAppointments(appointments);
      
      // Show success message if we have appointments
      if (appointments.length > 0) {
        toast.success(`Loaded ${appointments.length} appointments`);
      } else {
        toast('No appointments found', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      toast.error('Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filter and sort appointments
  useEffect(() => {
    console.log('🔍 Raw appointments data:', appointments.length, 'appointments');
    console.log('🔍 First appointment sample:', appointments[0]);
    
    let filtered = appointments;
    
    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = appointments.filter(app => app.status === selectedFilter);
    }
    
    console.log('🔍 After filtering:', filtered.length, 'appointments');
    
    // Backend now provides data in DESC order, but let's ensure frontend sorting too
    filtered = [...filtered].sort((a, b) => {
      // Compare dates first (descending order)
      const dateCompare = b.appointmentDate.localeCompare(a.appointmentDate);
      if (dateCompare !== 0) {
        return dateCompare;
      }
      
      // If dates are same, compare times (descending order)
      const timeA = a.appointmentTime || '00:00';
      const timeB = b.appointmentTime || '00:00';
      return timeB.localeCompare(timeA);
    });
    
    console.log('✅ Final sorted appointments (first 5):', filtered.slice(0, 5).map(app => ({
      id: app.id,
      date: app.appointmentDate,
      time: app.appointmentTime,
      status: app.status,
      serial: app.serialNumber
    })));
    
    setFilteredAppointments(filtered);
  }, [selectedFilter, appointments]);

  // Approve appointment
  const handleApprove = async (appointmentId: number) => {
    setIsLoading(true);
    try {
      console.log('Attempting to approve appointment:', appointmentId);
      const response = await axios.put(`/appointments/${appointmentId}/approve`);
      console.log('Approve response:', response.data);
      toast.success('Appointment approved successfully!');
      await fetchAppointments();
    } catch (error: any) {
      console.error('Approve appointment error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      toast.error(error.response?.data?.message || 'Failed to approve appointment');
    } finally {
      setIsLoading(false);
    }
  };

  // Decline appointment
  const handleDecline = async (appointmentId: number, reason?: string) => {
    if (!window.confirm('Are you sure you want to decline this appointment?')) {
      return;
    }

    setIsLoading(true);
    try {
      await axios.put(`/appointments/${appointmentId}/decline`, { reason });
      toast.success('Appointment declined');
      await fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to decline appointment');
    } finally {
      setIsLoading(false);
    }
  };

  // Mark appointment as in progress
  const handleStartAppointment = async (appointmentId: number) => {
    if (!window.confirm('Start this appointment? This will mark it as in progress.')) {
      return;
    }

    setIsLoading(true);
    try {
      await axios.put(`/appointments/${appointmentId}/start`);
      toast.success('Appointment started - now in progress');
      await fetchAppointments();
      
      // Open prescription interface for the started appointment
      const appointment = appointments.find(apt => apt.id === appointmentId);
      if (appointment) {
        setSelectedAppointmentForPrescription(appointment);
        setShowPrescriptionModal(true);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to start appointment');
    } finally {
      setIsLoading(false);
    }
  };

  // Mark appointment as completed
  const handleComplete = async (appointmentId: number) => {
    const confirmMessage = `Are you sure you want to complete this appointment?

⚠️ IMPORTANT WARNING:
- Once completed, the prescription cannot be edited
- Make sure all prescription details are finalized
- This action cannot be undone

Do you want to proceed?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsLoading(true);
    try {
      await axios.put(`/appointments/${appointmentId}/complete`);
      toast.success('Appointment marked as completed');
      await fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete appointment');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle prescription completion
  const handlePrescriptionComplete = () => {
    setShowPrescriptionModal(false);
    setSelectedAppointmentForPrescription(null);
    setShowVideoInPrescription(false);
    fetchAppointments(); // Refresh appointments list
  };

  // Handle complete appointment from prescription interface
  const handleCompleteFromPrescription = async (appointmentId: number) => {
    const confirmMessage = `Are you sure you want to complete this appointment?

⚠️ IMPORTANT WARNING:
- Once completed, the prescription cannot be edited
- Make sure all prescription details are finalized
- This action cannot be undone

Do you want to proceed?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setIsLoading(true);
    try {
      await axios.put(`/appointments/${appointmentId}/complete`);
      toast.success('Appointment marked as completed');
      setShowPrescriptionModal(false);
      setSelectedAppointmentForPrescription(null);
      setShowVideoInPrescription(false);
      await fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoCallInPrescription = () => {
    setShowVideoInPrescription(true);
  };

  // Reschedule appointment
  const handleReschedule = async () => {
    if (!selectedAppointment) return;

    setIsLoading(true);
    try {
      await axios.put(`/appointments/${selectedAppointment.id}/reschedule-requested`, rescheduleForm);
      toast.success('Appointment rescheduled and approved!');
      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      setRescheduleForm({ appointmentDate: '', timeBlock: '09:00-12:00' });
      await fetchAppointments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reschedule appointment');
    } finally {
      setIsLoading(false);
    }
  };

  // View patient details
  const handleViewDetails = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetailsModal(true);
  };

  // Open reschedule modal
  const openRescheduleModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleForm({
      appointmentDate: new Date(appointment.appointmentDate).toISOString().split('T')[0],
      timeBlock: '09:00-12:00'
    });
    setShowRescheduleModal(true);
  };

  // Calculate appointment duration
  const calculateDuration = (startedAt?: string, completedAt?: string) => {
    if (!startedAt || !completedAt) return null;
    
    const start = new Date(startedAt);
    const end = new Date(completedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minutes`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      requested: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200',
      scheduled: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200',
      confirmed: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200',
      in_progress: 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200',
      completed: 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200',
      cancelled: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200',
      no_show: 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 border border-orange-200'
    };
    return badges[status as keyof typeof badges] || 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200';
  };

  const getAppointmentTypeIcon = (type: string) => {
    switch (type) {
      case 'telemedicine':
        return <VideoCameraIcon className="h-4 w-4" />;
      case 'in_person':
        return <UserIcon className="h-4 w-4" />;
      case 'follow_up':
        return <ArrowPathIcon className="h-4 w-4" />;
      default:
        return <CalendarIcon className="h-4 w-4" />;
    }
  };

  const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case 'telemedicine':
        return 'text-blue-600 bg-blue-50';
      case 'in_person':
        return 'text-green-600 bg-green-50';
      case 'follow_up':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Get statistics
  const getAppointmentStats = () => {
    const total = appointments.length;
    const requested = appointments.filter(app => app.status === 'requested').length;
    const inProgress = appointments.filter(app => app.status === 'in_progress').length;
    const completed = appointments.filter(app => app.status === 'completed').length;
    const today = appointments.filter(app => 
      new Date(app.appointmentDate).toDateString() === new Date().toDateString()
    ).length;

    return { total, requested, inProgress, completed, today };
  };

  const stats = getAppointmentStats();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="space-y-8 p-6">
          {/* Modern Header */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white shadow-2xl">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight mb-2">
                    Appointment Management 🏥
                  </h1>
                  <p className="text-indigo-100 text-lg">
                    Review and manage patient appointment requests with comprehensive medical care.
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
                      <CalendarIcon className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center">
                      <UserGroupIcon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.total}</p>
                      <p className="text-sm text-indigo-100">Total</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-500/30 rounded-lg flex items-center justify-center">
                      <ClockIcon className="h-5 w-5 text-amber-200" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.requested}</p>
                      <p className="text-sm text-indigo-100">Pending</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-500/30 rounded-lg flex items-center justify-center">
                      <PlayIcon className="h-5 w-5 text-purple-200" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
                      <p className="text-sm text-indigo-100">Active</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500/30 rounded-lg flex items-center justify-center">
                      <CheckCircleIcon className="h-5 w-5 text-emerald-200" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.completed}</p>
                      <p className="text-sm text-indigo-100">Completed</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500/30 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="h-5 w-5 text-blue-200" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{stats.today}</p>
                      <p className="text-sm text-indigo-100">Today</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          </div>

          {/* Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <FunnelIcon className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-gray-700">Filter by Status:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'all', label: 'All', color: 'from-gray-500 to-slate-500' },
                  { value: 'requested', label: 'Requested', color: 'from-amber-500 to-yellow-500' },
                  { value: 'scheduled', label: 'Scheduled', color: 'from-blue-500 to-indigo-500' },
                  { value: 'in_progress', label: 'In Progress', color: 'from-purple-500 to-violet-500' },
                  { value: 'completed', label: 'Completed', color: 'from-emerald-500 to-green-500' },
                  { value: 'cancelled', label: 'Cancelled', color: 'from-red-500 to-rose-500' }
                ].map(filter => (
                  <button
                    key={filter.value}
                    onClick={() => setSelectedFilter(filter.value)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-sm ${
                      selectedFilter === filter.value
                        ? `bg-gradient-to-r ${filter.color} text-white shadow-md`
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    {filter.label}
                    {filter.value !== 'all' && (
                      <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                        {appointments.filter(app => app.status === filter.value).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Appointments Grid */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <CalendarIcon className="h-8 w-8 text-white" />
                </div>
                <p className="text-gray-600 text-lg">Loading appointments...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="h-8 w-8 text-gray-400" />
                </div>
                {appointments.length === 0 ? (
                  <div>
                    <p className="text-xl font-semibold text-gray-700 mb-2">No appointments found</p>
                    <p className="text-gray-500">You don't have any appointments yet.</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xl font-semibold text-gray-700 mb-2">No appointments found for "{selectedFilter}" filter</p>
                    <p className="text-gray-500">Try selecting a different filter or check "All" to see all appointments.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200/50">
                {filteredAppointments.map((appointment) => (
                  <div key={appointment.id} className="p-6 hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-blue-50/30 transition-all duration-300 group">
                    <div className="flex items-center justify-between">
                      {/* Left Side - Patient Info */}
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex-shrink-0">
                          <div className="h-16 w-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <UserIcon className="h-8 w-8 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">
                              {appointment.patient.user.firstName} {appointment.patient.user.lastName}
                            </h3>
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(appointment.status)}`}>
                              {appointment.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4 text-indigo-500" />
                              <span className="font-medium">{new Date(appointment.appointmentDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ClockIcon className="h-4 w-4 text-emerald-500" />
                              <span className="font-medium">{appointment.appointmentTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-indigo-600">#{appointment.serialNumber}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${getAppointmentTypeColor(appointment.type)}`}>
                              {getAppointmentTypeIcon(appointment.type)}
                              {appointment.type.replace('_', ' ')}
                            </div>
                            {appointment.patient.user.phone && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <PhoneIcon className="h-3 w-3" />
                                {appointment.patient.user.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(appointment)}
                          className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-all duration-200"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        
                        {appointment.status === 'requested' && (
                          <>
                            <button
                              onClick={() => handleApprove(appointment.id)}
                              disabled={isLoading}
                              className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-all duration-200 disabled:opacity-50"
                              title="Approve"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => openRescheduleModal(appointment)}
                              disabled={isLoading}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-200 disabled:opacity-50"
                              title="Reschedule"
                            >
                              <ClockIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDecline(appointment.id)}
                              disabled={isLoading}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all duration-200 disabled:opacity-50"
                              title="Decline"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        
                        {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                          <button
                            onClick={() => handleStartAppointment(appointment.id)}
                            disabled={isLoading}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-200 disabled:opacity-50"
                            title="Start Appointment"
                          >
                            <PlayIcon className="h-5 w-5" />
                          </button>
                        )}
                        
                        {appointment.type === 'telemedicine' && (appointment.status === 'confirmed' || appointment.status === 'in_progress') && (
                          <button
                            onClick={() => {
                              setSelectedAppointmentForPrescription(appointment);
                              setShowPrescriptionModal(true);
                              setShowVideoInPrescription(true);
                            }}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-xl transition-all duration-200"
                            title="Start Video Consultation"
                          >
                            <VideoCameraIcon className="h-5 w-5" />
                          </button>
                        )}
                        
                        {appointment.status === 'in_progress' && (
                          <button
                            onClick={() => {
                              setSelectedAppointmentForPrescription(appointment);
                              setShowPrescriptionModal(true);
                            }}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-200"
                            title="Manage Prescription"
                          >
                            <DocumentTextIcon className="h-5 w-5" />
                          </button>
                        )}
                        
                        {(appointment.status === 'in_progress' || appointment.status === 'confirmed') && (
                          <button
                            onClick={() => handleComplete(appointment.id)}
                            disabled={isLoading}
                            className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-all duration-200 disabled:opacity-50"
                            title="Mark as Completed"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Patient Details Modal */}
        {showDetailsModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <UserIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        Appointment Details
                      </h2>
                      <p className="text-gray-600 text-lg">Complete patient and appointment information</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Patient Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-3 text-white mr-3">
                        <UserIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Patient Information</h3>
                        <p className="text-sm text-gray-600">Basic patient details</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-blue-800">Full Name</label>
                        <p className="text-gray-900 font-medium text-lg">{selectedAppointment.patient.user.firstName} {selectedAppointment.patient.user.lastName}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-blue-800">Email</label>
                        <p className="text-gray-900 font-medium">{selectedAppointment.patient.user.email}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-blue-800">Phone</label>
                        <p className="text-gray-900 font-medium">{selectedAppointment.patient.user.phone || 'Not provided'}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-blue-800">Blood Type</label>
                        <p className="text-gray-900 font-medium">{selectedAppointment.patient.bloodType || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Information */}
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200/50">
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg p-3 text-white mr-3">
                        <CalendarIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Appointment Information</h3>
                        <p className="text-sm text-gray-600">Appointment details and status</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-emerald-800">Date</label>
                        <p className="text-gray-900 font-medium">
                          {new Date(selectedAppointment.appointmentDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-emerald-800">Time</label>
                        <p className="text-gray-900 font-medium">{selectedAppointment.appointmentTime}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-emerald-800">Type</label>
                        <p className="text-gray-900 font-medium capitalize">{selectedAppointment.type.replace('_', ' ')}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-emerald-800">Status</label>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedAppointment.status)}`}>
                          {selectedAppointment.status.replace('_', ' ')}
                        </span>
                      </div>
                      {selectedAppointment.status === 'completed' && selectedAppointment.startedAt && selectedAppointment.completedAt && (
                        <>
                          <div className="bg-white/70 rounded-xl p-4">
                            <label className="text-sm font-semibold text-emerald-800">Started At</label>
                            <p className="text-gray-900 font-medium">
                              {new Date(selectedAppointment.startedAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-white/70 rounded-xl p-4">
                            <label className="text-sm font-semibold text-emerald-800">Completed At</label>
                            <p className="text-gray-900 font-medium">
                              {new Date(selectedAppointment.completedAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="bg-white/70 rounded-xl p-4">
                            <label className="text-sm font-semibold text-emerald-800">Total Duration</label>
                            <p className="text-emerald-700 font-semibold">
                              {calculateDuration(selectedAppointment.startedAt, selectedAppointment.completedAt)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50">
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg p-3 text-white mr-3">
                        <HeartIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Medical Information</h3>
                        <p className="text-sm text-gray-600">Health and medical details</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-amber-800">Allergies</label>
                        <p className="text-gray-900 font-medium">{selectedAppointment.patient.allergies || 'None reported'}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-amber-800">Current Medications</label>
                        <p className="text-gray-900 font-medium">{selectedAppointment.patient.currentMedications || 'None reported'}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-amber-800">Medical History</label>
                        <p className="text-gray-900 font-medium">{selectedAppointment.patient.medicalHistory || 'None reported'}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <button
                          onClick={() => window.open(`/admin-lab-reports?patientId=${selectedAppointment.patient.id}`, '_blank')}
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium flex items-center gap-2 text-sm"
                        >
                          <DocumentTextIcon className="h-4 w-4" />
                          View Patient Reports
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-2xl p-6 border border-red-200/50">
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-to-r from-red-500 to-rose-500 rounded-lg p-3 text-white mr-3">
                        <ShieldCheckIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Emergency Contact</h3>
                        <p className="text-sm text-gray-600">Emergency contact details</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-red-800">Contact Name</label>
                        <p className="text-gray-900 font-medium">{selectedAppointment.patient.emergencyContact || 'Not provided'}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-red-800">Contact Phone</label>
                        <p className="text-gray-900 font-medium">{selectedAppointment.patient.emergencyPhone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Reason & Symptoms */}
                  <div className="col-span-full space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Appointment Reason</h3>
                    <div className="space-y-3">
                      {selectedAppointment.reason && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
                          <label className="text-sm font-medium text-blue-800">Reason</label>
                          <p className="text-gray-900 mt-1">{selectedAppointment.reason}</p>
                        </div>
                      )}
                      {selectedAppointment.symptoms && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200/50">
                          <label className="text-sm font-medium text-amber-800">Symptoms</label>
                          <p className="text-gray-900 mt-1">{selectedAppointment.symptoms}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Doctor's Notes, Diagnosis & Prescription */}
                  <div className="col-span-full space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Medical Details</h3>
                    <div className="space-y-4">
                      {selectedAppointment.notes && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200/50">
                          <label className="text-sm font-medium text-green-800">Doctor's Notes</label>
                          <p className="text-gray-900 mt-1">{selectedAppointment.notes}</p>
                        </div>
                      )}
                      {selectedAppointment.diagnosis && (
                        <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-200/50">
                          <label className="text-sm font-medium text-purple-800">Diagnosis</label>
                          <p className="text-gray-900 mt-1">{selectedAppointment.diagnosis}</p>
                        </div>
                      )}
                      {selectedAppointment.prescription && (
                        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-200/50">
                          <label className="text-sm font-medium text-indigo-800">Prescription</label>
                          <p className="text-gray-900 mt-1">{selectedAppointment.prescription}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-4">
                  {selectedAppointment.status === 'requested' && (
                    <>
                      <button
                        onClick={() => handleApprove(selectedAppointment.id)}
                        disabled={isLoading}
                        className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium flex items-center gap-2"
                      >
                        <CheckIcon className="h-5 w-5" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setShowDetailsModal(false);
                          openRescheduleModal(selectedAppointment);
                        }}
                        disabled={isLoading}
                        className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium flex items-center gap-2"
                      >
                        <ClockIcon className="h-5 w-5" />
                        Reschedule
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Modal */}
        {showRescheduleModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl max-w-md w-full shadow-2xl border border-white/20">
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                      <ClockIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Reschedule Appointment
                      </h2>
                      <p className="text-gray-600 text-sm">Update appointment date and time</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRescheduleModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">New Date</label>
                    <input
                      type="date"
                      value={rescheduleForm.appointmentDate}
                      onChange={(e) => setRescheduleForm({...rescheduleForm, appointmentDate: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Time Block</label>
                    <select
                      value={rescheduleForm.timeBlock}
                      onChange={(e) => setRescheduleForm({...rescheduleForm, timeBlock: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      required
                    >
                      {timeBlocks.map((block) => (
                        <option key={block.value} value={block.value}>
                          {block.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button
                    onClick={handleReschedule}
                    disabled={isLoading || !rescheduleForm.appointmentDate}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium disabled:opacity-50"
                  >
                    Reschedule & Approve
                  </button>
                  <button
                    onClick={() => setShowRescheduleModal(false)}
                    className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prescription Interface Modal */}
        {showPrescriptionModal && selectedAppointmentForPrescription && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-1 sm:p-2">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl max-w-[98vw] w-full h-[98vh] flex flex-col overflow-hidden shadow-2xl border border-white/20">
              <div className="flex-shrink-0 p-4 sm:p-6 border-b border-gray-200/50">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <div className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <DocumentTextIcon className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                        {selectedAppointmentForPrescription.type === 'telemedicine' 
                          ? 'Telemedicine Consultation' 
                          : 'Prescription Management'
                        }
                      </h2>
                      <p className="text-sm sm:text-base text-gray-600 truncate">
                        {selectedAppointmentForPrescription.patient.user.firstName} {selectedAppointmentForPrescription.patient.user.lastName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowPrescriptionModal(false);
                      setSelectedAppointmentForPrescription(null);
                      setShowVideoInPrescription(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 flex-shrink-0 p-2"
                  >
                    <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                {/* Main Content Grid */}
                {selectedAppointmentForPrescription.type === 'telemedicine' ? (
                  /* Telemedicine: Responsive layout - stacked on mobile, side-by-side on large screens */
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4 h-full">
                    {/* Left Column - Video Consultation (2/5 width on large screens) */}
                    <div className="lg:col-span-2 flex flex-col">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 flex-1 flex flex-col border border-blue-200/50">
                        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <VideoCameraIcon className="h-5 w-5 text-blue-600" />
                          Video Consultation
                        </h3>
                        {!showVideoInPrescription ? (
                          <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                              Start video consultation with the patient for real-time communication.
                            </p>
                            <button
                              onClick={handleVideoCallInPrescription}
                              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium flex items-center justify-center gap-2"
                            >
                              <VideoCameraIcon className="h-5 w-5" />
                              Start Video Call
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-emerald-600 font-semibold">Live Video Call</span>
                              </div>
                              <button
                                onClick={() => setShowVideoInPrescription(false)}
                                className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 rounded-lg hover:bg-red-50 transition-all duration-200"
                              >
                                End Call
                              </button>
                            </div>
                            {/* Embedded Video Consultation */}
                            <div className="bg-gray-900 rounded-xl overflow-hidden flex-1 min-h-0" style={{ minHeight: '500px', maxHeight: '600px' }}>
                              <iframe
                                src={`https://meet.jit.si/HealthcareApp${selectedAppointmentForPrescription.id}?skipPrejoin=true&displayName=${encodeURIComponent(`Dr. ${user?.firstName} ${user?.lastName}`)}`}
                                className="w-full h-full border-0"
                                allow="camera; microphone; fullscreen; display-capture; autoplay"
                                title="Video Consultation"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column - Prescription Interface (3/5 width on large screens) */}
                    <div className="lg:col-span-3 flex flex-col">
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 flex-1 flex flex-col border border-emerald-200/50">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <DocumentTextIcon className="h-5 w-5 text-emerald-600" />
                          Prescription Management
                        </h3>
                        <div className="flex-1 min-h-0 overflow-y-auto">
                          <PrescriptionInterface
                            appointmentId={selectedAppointmentForPrescription.id}
                            onComplete={handlePrescriptionComplete}
                            isReadOnly={false}
                            userRole="doctor"
                            patientId={selectedAppointmentForPrescription.patient.id}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Regular appointments: Full-width prescription */
                  <div className="h-full">
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 h-full flex flex-col border border-emerald-200/50">
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <DocumentTextIcon className="h-6 w-6 text-emerald-600" />
                        Prescription Management
                      </h3>
                      <div className="flex-1 min-h-0 overflow-y-auto">
                        <PrescriptionInterface
                          appointmentId={selectedAppointmentForPrescription.id}
                          onComplete={handlePrescriptionComplete}
                          isReadOnly={false}
                          userRole="doctor"
                          patientId={selectedAppointmentForPrescription.patient.id}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Fixed Footer with Complete Button */}
              <div className="flex-shrink-0 border-t border-gray-200/50 p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-slate-50">
                <div className="flex justify-end">
                  <button
                    onClick={() => handleCompleteFromPrescription(selectedAppointmentForPrescription.id)}
                    disabled={isLoading}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    {isLoading ? 'Completing...' : 'Complete Appointment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default DoctorAppointments;