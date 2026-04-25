import React, { useState, useEffect } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/api';
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
  UserGroupIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { calculateAge, formatAge, formatGender } from '../utils/dateUtils';
import { Reveal, MagneticButton } from '../components/landing/AnimatedSection';
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
  chamber?: string;
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
    medicalDocuments?: Array<{
      id: string;
      name: string;
      url: string;
      type: string;
      uploadDate: string;
    }>;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [pageLoaded, setPageLoaded] = useState(false);

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
      const doctorProfileResponse = await API.get('/doctors/profile');
      const doctorId = doctorProfileResponse.data.data.doctor.id;
      
      // Then fetch appointments for this specific doctor (get all appointments, not just first page)
      const response = await API.get(`/doctors/${doctorId}/appointments`, {
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

  // Page load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
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
    
    // Apply search filter (patient name, email, phone)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(app => {
        const fullName = `${app.patient.user.firstName || ''} ${app.patient.user.lastName || ''}`.toLowerCase();
        const email = (app.patient.user.email || '').toLowerCase();
        const phone = (app.patient.user.phone || '').toLowerCase();
        
        return (
          fullName.includes(searchLower) ||
          email.includes(searchLower) ||
          phone.includes(searchLower)
        );
      });
    }
    
    // Apply date filter
    if (searchDate) {
      filtered = filtered.filter(app => app.appointmentDate === searchDate);
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
  }, [selectedFilter, appointments, searchTerm, searchDate]);

  // Approve appointment
  const handleApprove = async (appointmentId: number) => {
    setIsLoading(true);
    try {
      console.log('Attempting to approve appointment:', appointmentId);
      const response = await API.put(`/appointments/${appointmentId}/approve`);
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
      await API.put(`/appointments/${appointmentId}/decline`, { reason });
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
      await API.put(`/appointments/${appointmentId}/start`);
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
      await API.put(`/appointments/${appointmentId}/complete`);
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
      await API.put(`/appointments/${appointmentId}/complete`);
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
      await API.put(`/appointments/${selectedAppointment.id}/reschedule-requested`, rescheduleForm);
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
    <div className="min-h-screen bg-[#fafbff] relative overflow-hidden noise-overlay font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(#4f46e5 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 space-y-10">
        
        {/* ═══ PREMIUM HEADER ═══ */}
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-slate-900 p-8 md:p-12 text-white shadow-2xl shadow-slate-200/50">
            <div className="absolute top-0 right-0 w-1/2 h-full">
              <div className="absolute inset-0 bg-gradient-to-l from-indigo-500/20 via-transparent to-transparent opacity-60" />
              <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-400/20 rounded-full blur-[80px]" />
            </div>
            
            <div className="relative z-10 md:flex items-center justify-between gap-10">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  Clinical Care
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
                  Appointment<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 animate-gradient-shift italic pr-2">
                    Management
                  </span>.
                </h1>
                <p className="text-slate-400 font-medium max-w-lg text-lg">
                  Review and manage patient requests with high-fidelity clinical oversight and predictive insights.
                </p>
              </div>

              <div className="hidden lg:flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-lg font-black text-emerald-400">Clinical Mode Active</p>
                </div>
                <div className="w-px h-16 bg-white/10 mx-2" />
                <div className="w-20 h-20 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl border border-white/10">
                  <CalendarIcon className="h-10 w-10 text-indigo-400" />
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ═══ STATS GRID ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
          {[
            { label: 'Total Requests', value: stats.total, icon: UserGroupIcon, color: 'from-slate-600 to-slate-700', iconColor: 'text-slate-600', bg: 'bg-slate-500/5' },
            { label: 'Pending Approval', value: stats.requested, icon: ClockIcon, color: 'from-amber-600 to-orange-600', iconColor: 'text-amber-600', bg: 'bg-amber-500/5' },
            { label: 'Active Today', value: stats.inProgress, icon: PlayIcon, color: 'from-violet-600 to-purple-600', iconColor: 'text-violet-600', bg: 'bg-violet-500/5' },
            { label: 'Completed', value: stats.completed, icon: CheckCircleIcon, color: 'from-emerald-600 to-teal-600', iconColor: 'text-emerald-600', bg: 'bg-emerald-500/5' },
            { label: "Today's Load", value: stats.today, icon: CalendarIcon, color: 'from-indigo-600 to-blue-600', iconColor: 'text-indigo-600', bg: 'bg-indigo-500/5' },
          ].map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.1}>
              <div className="premium-card bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 group relative overflow-hidden h-full">
                <div className={`absolute top-0 right-0 w-20 h-20 ${stat.bg} rounded-bl-full opacity-50 group-hover:scale-110 transition-transform`} />
                <div className="flex flex-col h-full">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-6 border border-slate-50 shadow-inner group-hover:rotate-12 transition-transform`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900 tracking-tight">{isLoading ? '...' : stat.value}</span>
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md">Live</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* ═══ FILTERS & SEARCH ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Card */}
          <Reveal className="lg:col-span-2">
            <div className="premium-card bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm h-full flex flex-col justify-center space-y-6">
              <div className="flex items-center gap-4 px-2">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <MagnifyingGlassIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Quick Search</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Identify patients instantly</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Search name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-10 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 text-slate-900 placeholder:text-slate-400 font-medium transition-all group-hover:bg-white group-hover:shadow-md"
                  />
                  <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600" />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="relative group">
                  <input
                    type="date"
                    value={searchDate}
                    onChange={(e) => setSearchDate(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-medium transition-all group-hover:bg-white group-hover:shadow-md"
                  />
                  <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600" />
                </div>
              </div>
            </div>
          </Reveal>

          {/* Status Filter Card */}
          <Reveal delay={0.2}>
            <div className="premium-card bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm h-full flex flex-col justify-center space-y-6">
              <div className="flex items-center gap-4 px-2">
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                  <FunnelIcon className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Status Filter</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Streamline your workflow</p>
                </div>
              </div>

              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-violet-500/20 text-slate-900 font-bold appearance-none cursor-pointer hover:bg-white hover:shadow-md transition-all"
              >
                <option value="all">All Appointments</option>
                <option value="requested">Requested (Pending)</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </Reveal>
        </div>

        {/* ═══ APPOINTMENTS LIST ═══ */}
        <div className="space-y-6">
          <Reveal>
            <div className="flex items-center justify-between px-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                Live Schedule
                <span className="px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] uppercase font-black tracking-widest border border-indigo-100">
                  {filteredAppointments.length} Found
                </span>
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Real-time Sync
                </div>
              </div>
            </div>
          </Reveal>
        <div className="grid grid-cols-1 gap-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-white/50 animate-pulse rounded-[32px] border border-slate-100" />
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <Reveal>
              <div className="bg-white rounded-[32px] border border-slate-100 p-20 text-center shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <CalendarIcon className="h-10 w-10 text-slate-300" />
                </div>
                <h4 className="text-2xl font-black text-slate-900 mb-2">No Appointments</h4>
                <p className="text-slate-400 font-medium max-w-sm mx-auto">
                  Your clinical schedule is currently clear for this filter combination.
                </p>
                {selectedFilter !== 'all' && (
                  <button
                    onClick={() => setSelectedFilter('all')}
                    className="mt-8 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all active:scale-95"
                  >
                    View All Schedules
                  </button>
                )}
              </div>
            </Reveal>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredAppointments.map((apt, i) => (
                <Reveal key={apt.id} delay={i * 0.05}>
                  <div className="premium-card bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 group transition-all duration-500 overflow-hidden relative">
                    {/* Status accent bar */}
                    <div className={`absolute top-0 left-0 w-2 h-full ${
                      apt.status === 'completed' ? 'bg-emerald-500' :
                      apt.status === 'in_progress' ? 'bg-violet-500' :
                      apt.status === 'requested' ? 'bg-amber-500' :
                      apt.status === 'scheduled' ? 'bg-blue-500' :
                      'bg-slate-200'
                    } opacity-80`} />

                    <div className="md:flex items-center justify-between gap-8">
                      {/* Patient Profile Section */}
                      <div className="flex items-center gap-6 flex-1">
                        <div className="relative">
                          <div className="w-20 h-20 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-2xl text-indigo-600 group-hover:bg-indigo-50 transition-colors shadow-inner overflow-hidden">
                            {apt.patient?.user?.firstName?.[0]}{apt.patient?.user?.lastName?.[0]}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg border-2 border-white flex items-center justify-center ${
                            apt.type === 'telemedicine' ? 'bg-blue-500' : 'bg-emerald-500'
                          }`}>
                            {apt.type === 'telemedicine' ? (
                              <VideoCameraIcon className="h-3 w-3 text-white" />
                            ) : (
                              <UserIcon className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h4 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {apt.patient?.user?.firstName} {apt.patient?.user?.lastName}
                            </h4>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                              #{apt.serialNumber}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-y-2 gap-x-4">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                              <CalendarIcon className="h-3.5 w-3.5" />
                              {new Date(apt.appointmentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                              <ClockIcon className="h-3.5 w-3.5" />
                              {apt.appointmentTime}
                            </div>
                            {apt.chamber && (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100/50">
                                <MapPinIcon className="h-3.5 w-3.5" />
                                {apt.chamber}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status and Action Buttons */}
                      <div className="mt-6 md:mt-0 flex items-center gap-4">
                        <div className="hidden sm:block text-right pr-4 border-r border-slate-100 py-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                          <span className={`text-xs font-black uppercase tracking-widest ${
                            apt.status === 'completed' ? 'text-emerald-500' :
                            apt.status === 'in_progress' ? 'text-violet-500 animate-pulse' :
                            apt.status === 'requested' ? 'text-amber-500' :
                            apt.status === 'scheduled' ? 'text-blue-500' :
                            'text-slate-400'
                          }`}>
                            {apt.status?.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <MagneticButton 
                            onClick={() => handleViewDetails(apt)}
                            className="p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100 hover:border-indigo-200 shadow-sm"
                            title="Patient History & Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </MagneticButton>

                          {apt.status === 'requested' && (
                            <>
                              <MagneticButton 
                                onClick={() => handleApprove(apt.id)}
                                className="px-5 py-3 rounded-2xl bg-emerald-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all active:scale-95"
                              >
                                Approve
                              </MagneticButton>
                              <MagneticButton 
                                onClick={() => openRescheduleModal(apt)}
                                className="p-3 rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border border-blue-100"
                              >
                                <ClockIcon className="h-5 w-5" />
                              </MagneticButton>
                              <MagneticButton 
                                onClick={() => handleDecline(apt.id)}
                                className="p-3 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all border border-rose-100"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </MagneticButton>
                            </>
                          )}

                          {(apt.status === 'scheduled' || apt.status === 'confirmed') && (
                            <MagneticButton 
                              onClick={() => handleStartAppointment(apt.id)}
                              className="px-6 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2 h-11"
                            >
                              <PlayIcon className="h-4 w-4" /> Start Session
                            </MagneticButton>
                          )}

                          {apt.status === 'in_progress' && (
                            <MagneticButton 
                              onClick={() => {
                                setSelectedAppointmentForPrescription(apt);
                                setShowPrescriptionModal(true);
                              }}
                              className="px-6 py-3 rounded-2xl bg-violet-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-violet-200 hover:bg-violet-700 transition-all flex items-center gap-2 h-11"
                            >
                              <DocumentTextIcon className="h-4 w-4" /> Prescription
                            </MagneticButton>
                          )}

                          {apt.type === 'telemedicine' && (apt.status === 'confirmed' || apt.status === 'in_progress') && (
                            <MagneticButton 
                              onClick={() => {
                                setSelectedAppointmentForPrescription(apt);
                                setShowPrescriptionModal(true);
                                setShowVideoInPrescription(true);
                              }}
                              className="p-3 rounded-2xl bg-cyan-50 text-cyan-600 hover:bg-cyan-100 transition-all border border-cyan-100"
                              title="Launch Video Call"
                            >
                              <VideoCameraIcon className="h-5 w-5" />
                            </MagneticButton>
                          )}

                          {(apt.status === 'in_progress' || apt.status === 'confirmed') && (
                            <MagneticButton 
                              onClick={() => handleComplete(apt.id)}
                              className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all border border-emerald-100"
                              title="Finalize & Complete"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </MagneticButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
        </div>

        {/* ═══ PATIENT DETAILS MODAL ═══ */}
        <AnimatePresence>
          {showDetailsModal && selectedAppointment && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowDetailsModal(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
              >
                <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-start mb-10">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 rounded-3xl bg-indigo-50 flex items-center justify-center text-3xl font-black text-indigo-600 shadow-inner">
                        {selectedAppointment.patient?.user?.firstName?.[0]}{selectedAppointment.patient?.user?.lastName?.[0]}
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                          {selectedAppointment.patient?.user?.firstName} {selectedAppointment.patient?.user?.lastName}
                        </h2>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            Patient ID: {selectedAppointment.patient?.id}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                            selectedAppointment.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                            {selectedAppointment.status?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setShowDetailsModal(false)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors">
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Medical Background */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-2">Clinical Profile</h3>
                      <div className="grid grid-cols-1 gap-4">
                        {[
                          { label: 'Allergies', value: selectedAppointment.patient?.allergies, icon: HeartIcon, colors: 'bg-rose-50 text-rose-600' },
                          { label: 'History', value: selectedAppointment.patient?.medicalHistory, icon: DocumentTextIcon, colors: 'bg-amber-50 text-amber-600' },
                          { label: 'Medications', value: selectedAppointment.patient?.currentMedications, icon: ChartBarIcon, colors: 'bg-indigo-50 text-indigo-600' }
                        ].map((item) => (
                          <div key={item.label} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:shadow-md">
                            <div className="flex items-center gap-3 mb-2">
                              <item.icon className={`h-4 w-4 ${item.colors.split(' ')[1]}`} />
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                            </div>
                            <p className="text-slate-900 font-bold">{item.value || 'None reported'}</p>
                          </div>
                        ))}
                      </div>
                      
                      <MagneticButton 
                        onClick={() => window.open(`/app/patients?patientId=${selectedAppointment.patient.id}&view=records`, '_blank')}
                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
                      >
                        <DocumentTextIcon className="h-5 w-5" /> View Extended Records
                      </MagneticButton>
                    </div>

                    {/* Appointment Details */}
                    <div className="space-y-6">
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] px-2">Session Details</h3>
                      <div className="p-8 bg-indigo-600 rounded-[32px] text-white space-y-6 shadow-xl shadow-indigo-100">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Scheduled Date</p>
                            <p className="text-xl font-bold">{new Date(selectedAppointment.appointmentDate).toLocaleDateString(undefined, { dateStyle: 'long' })}</p>
                          </div>
                          <CalendarIcon className="h-8 w-8 opacity-20" />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Time Slot</p>
                            <p className="text-xl font-bold">{selectedAppointment.appointmentTime}</p>
                          </div>
                          <ClockIcon className="h-8 w-8 opacity-20" />
                        </div>
                        <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                          <p className="text-xs font-bold">Consultation Type</p>
                          <span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest">
                            {selectedAppointment.type?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reason & Symptoms */}
                  <div className="mt-8 p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Patient Complaint</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Reason for visit</p>
                        <p className="text-slate-700 font-medium leading-relaxed">{selectedAppointment.reason || "No reason provided"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Symptoms reported</p>
                        <p className="text-slate-700 font-medium leading-relaxed">{selectedAppointment.symptoms || "No symptoms specified"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ═══ RESCHEDULE MODAL ═══ */}
        <AnimatePresence>
          {showRescheduleModal && selectedAppointment && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowRescheduleModal(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl border border-slate-100 p-10 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mb-6">
                  <ClockIcon className="h-10 w-10 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Reschedule Request</h2>
                <p className="text-slate-500 font-medium mb-8">Suggest an alternative time slot for <span className="text-indigo-600 font-bold">{selectedAppointment.patient?.user?.firstName}</span>.</p>
                
                <div className="w-full space-y-4">
                  <div className="text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2 block">Available Date</label>
                    <input
                      type="date"
                      value={rescheduleForm.appointmentDate}
                      onChange={(e) => setRescheduleForm({...rescheduleForm, appointmentDate: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-bold transition-all"
                    />
                  </div>
                  <div className="text-left">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2 block">Time Block</label>
                    <select
                      value={rescheduleForm.timeBlock}
                      onChange={(e) => setRescheduleForm({...rescheduleForm, timeBlock: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 text-slate-900 font-bold transition-all appearance-none cursor-pointer"
                    >
                      {timeBlocks.map((block) => (
                        <option key={block.value} value={block.value}>{block.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-10 grid grid-cols-2 gap-4 w-full">
                  <button
                    onClick={() => setShowRescheduleModal(false)}
                    className="py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Cancel
                  </button>
                  <MagneticButton
                    onClick={handleReschedule}
                    disabled={isLoading || !rescheduleForm.appointmentDate}
                    className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    Reschedule
                  </MagneticButton>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ═══ PRESCRIPTION INTERFACE MODAL ═══ */}
        <AnimatePresence>
          {showPrescriptionModal && selectedAppointmentForPrescription && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
              />
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="relative w-full h-full bg-[#fdfdff] flex flex-col"
              >
                {/* Modal Header */}
                <div className="flex-shrink-0 px-8 py-6 bg-white border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                      <DocumentTextIcon className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">Clinical Consultation</h2>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                        Patient: {selectedAppointmentForPrescription.patient?.user?.firstName} {selectedAppointmentForPrescription.patient?.user?.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleCompleteFromPrescription(selectedAppointmentForPrescription.id)}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"
                    >
                      <CheckCircleIcon className="h-4 w-4" /> Finalize Session
                    </button>
                    <button
                      onClick={() => {
                        setShowPrescriptionModal(false);
                        setSelectedAppointmentForPrescription(null);
                        setShowVideoInPrescription(false);
                      }}
                      className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden">
                  {selectedAppointmentForPrescription.type === 'telemedicine' ? (
                    <div className="h-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                      {/* Video Sidebar (4/12) */}
                      <div className="lg:col-span-4 bg-slate-900 relative overflow-hidden flex flex-col h-full">
                        {!showVideoInPrescription ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-12 space-y-6">
                            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center">
                              <VideoCameraIcon className="h-10 w-10 text-white/40" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-xl font-black text-white">Video Consultation</h3>
                              <p className="text-white/40 font-medium">Begin secure encrypted video session</p>
                            </div>
                            <button
                              onClick={handleVideoCallInPrescription}
                              className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95"
                            >
                              Connect Patient
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col min-h-0">
                            <div className="p-4 flex items-center justify-between text-white/60 bg-black/20">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest shadow-emerald-500/50 shadow-sm">Live Stream</span>
                              </div>
                              <button onClick={() => setShowVideoInPrescription(false)} className="text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-300">Disconnect</button>
                            </div>
                            <div className="flex-1 min-h-0 bg-black">
                              <JitsiMeeting
                                domain="meet.jit.si"
                                roomName={`HealthcareApp${selectedAppointmentForPrescription.id}`}
                                configOverwrite={{
                                  startWithAudioMuted: false,
                                  disableModeratorIndicator: true,
                                  startScreenSharing: true,
                                  enableEmailInStats: false,
                                  prejoinPageEnabled: false,
                                  toolbarButtons: ['microphone', 'camera', 'desktop', 'fullscreen', 'fodeviceselection', 'hangup', 'invite', 'chat', 'settings', 'raisehand', 'videoquality', 'filmstrip', 'stats'],
                                }}
                                interfaceConfigOverwrite={{ ENFORCE_NOTIFICATION_AUTO_DISMISS_TIMEOUT: 5000 }}
                                userInfo={{ displayName: `Dr. ${user?.firstName || ''} ${user?.lastName || ''}`, email: user?.email || '' }}
                                getIFrameRef={(iframeRef) => { iframeRef.style.height = '100%'; iframeRef.style.width = '100%'; }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Clinical Workspace (8/12) */}
                      <div className="lg:col-span-8 overflow-y-auto bg-white p-8 md:p-12">
                        <PrescriptionInterface
                          appointmentId={selectedAppointmentForPrescription.id}
                          onComplete={handlePrescriptionComplete}
                          isReadOnly={false}
                          userRole="doctor"
                          patientId={selectedAppointmentForPrescription.patient.id}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="h-full overflow-y-auto p-8 md:p-20 bg-slate-50/30">
                      <div className="max-w-5xl mx-auto bg-white rounded-[48px] shadow-2xl border border-slate-100 overflow-hidden min-h-full">
                        <PrescriptionInterface
                          appointmentId={selectedAppointmentForPrescription.id}
                          onComplete={handlePrescriptionComplete}
                          isReadOnly={false}
                          userRole="doctor"
                          patientId={selectedAppointmentForPrescription.patient.id}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  );
};

export default DoctorAppointments;