import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon, 
  PlusIcon, 
  DocumentTextIcon, 
  StarIcon, 
  VideoCameraIcon,
  FunnelIcon,
  XMarkIcon,
  EyeIcon,
  XCircleIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import PrescriptionView from '../components/PrescriptionView';
import RatingModal from '../components/RatingModal';
import VideoConsultation from '../components/VideoConsultation';
import { getDepartmentLabel } from '../utils/departments';

const Appointments: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [prescriptionData, setPrescriptionData] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState({
    doctorId: '',
    appointmentDate:'',
    timeBlock: '',
    type: 'in_person',
    reason: '',
    symptoms: ''
  });
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availableTimeBlocks, setAvailableTimeBlocks] = useState<Array<{value: string, label: string}>>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [appointmentRatings, setAppointmentRatings] = useState<{[key: number]: number}>({});
  const [pageLoaded, setPageLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Fetch appointments using React Query for automatic refetching
  const { data: appointmentsData, refetch: refetchAppointments } = useQuery({
    queryKey: ['patient-appointments', user?.id],
    queryFn: async () => {
      const response = await axios.get('/appointments');
      return response.data.data.appointments || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds to get real-time updates
  });

  // Fetch patient's ratings to check which appointments are already rated
  const { data: patientRatingsData } = useQuery({
    queryKey: ['patient-ratings', user?.id],
    queryFn: async () => {
      const response = await axios.get('/ratings/my-ratings');
      return response.data.data.ratings || [];
    },
    enabled: !!user?.id,
  });

  // Create a map of appointment IDs to ratings
  React.useEffect(() => {
    if (patientRatingsData) {
      const ratingMap: {[key: number]: number} = {};
      patientRatingsData.forEach((rating: any) => {
        ratingMap[rating.appointmentId] = rating.rating;
      });
      setAppointmentRatings(ratingMap);
    }
  }, [patientRatingsData]);

  // Page load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Debug effect to track filter changes
  useEffect(() => {
    console.log('Filters changed:', { statusFilter, typeFilter, doctorFilter });
  }, [statusFilter, typeFilter, doctorFilter]);

  // Filter and sort appointments
  const appointments = (appointmentsData || [])
    .filter((apt: any) => {
      // Debug logging for filtering
      console.log('Filtering appointment:', {
        id: apt.id,
        status: apt.status,
        type: apt.type,
        doctorId: apt.doctorId,
        statusFilter,
        typeFilter,
        doctorFilter,
        statusMatch: statusFilter === 'all' || apt.status === statusFilter,
        typeMatch: typeFilter === 'all' || apt.type === typeFilter,
        doctorMatch: doctorFilter === 'all' || apt.doctorId.toString() === doctorFilter
      });
      
      if (statusFilter !== 'all' && apt.status !== statusFilter) return false;
      if (typeFilter !== 'all' && apt.type !== typeFilter) return false;
      if (doctorFilter !== 'all' && apt.doctorId.toString() !== doctorFilter) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      // Sort by date in descending order (newest first)
      const dateA = new Date(a.appointmentDate).getTime();
      const dateB = new Date(b.appointmentDate).getTime();
      return dateB - dateA;
    });

  // Debug logging for appointments data
  console.log('Appointments data:', appointmentsData);
  console.log('Appointments count:', appointmentsData?.length || 0);
  if (appointmentsData && appointmentsData.length > 0) {
    console.log('Sample appointment:', appointmentsData[0]);
    console.log('Available statuses:', Array.from(new Set(appointmentsData.map((apt: any) => apt.status))));
    console.log('Available types:', Array.from(new Set(appointmentsData.map((apt: any) => apt.type))));
    console.log('Available doctor IDs:', Array.from(new Set(appointmentsData.map((apt: any) => apt.doctorId))));
  }
  console.log('Filtered appointments:', appointments);
  console.log('Current filters:', { statusFilter, typeFilter, doctorFilter });

  // Get unique doctors from appointments for filter dropdown
  const uniqueDoctors = Array.from(
    new Map(
      (appointmentsData || [])
        .filter((apt: any) => apt.doctor)
        .map((apt: any) => [
          apt.doctorId,
          {
            id: apt.doctorId,
            name: `Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`,
            department: apt.doctor.department
          }
        ])
    ).values()
  );

  // Get available time blocks for selected doctor
  const getAvailableTimeBlocks = (doctorId: string) => {
    const doctor = doctors.find(d => d.id.toString() === doctorId);
    if (!doctor || !doctor.chamberTimes) {
      return [];
    }

    const times: Array<{value: string, label: string}> = [];
    const chamberTimes = doctor.chamberTimes;

    // Get the day of the week for the selected appointment date
    const selectedDate = bookingForm.appointmentDate ? new Date(bookingForm.appointmentDate) : new Date();
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Check if doctor has chamber times for this day
    if (chamberTimes[dayOfWeek] && Array.isArray(chamberTimes[dayOfWeek])) {
      chamberTimes[dayOfWeek].forEach((time: string) => {
        times.push({
          value: time,
          label: `${time} (${dayOfWeek})`
        });
      });
    }

    // If no times for specific day, show all available times
    if (times.length === 0) {
      Object.keys(chamberTimes).forEach(day => {
        if (Array.isArray(chamberTimes[day])) {
          chamberTimes[day].forEach((time: string) => {
            times.push({
              value: time,
              label: `${time} (${day})`
            });
          });
        }
      });
    }

    return times;
  };

  // Fetch doctors for booking
  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/doctors');
      // Filter doctors who have chamber times set
      const doctorsWithChamberTimes = response.data.data.doctors.filter((doctor: any) => 
        doctor.chamberTimes && Object.keys(doctor.chamberTimes).length > 0
      );
      setDoctors(doctorsWithChamberTimes);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  };

  // Get patient ID for the current user
  const getPatientId = async () => {
    try {
      const response = await axios.get('/patients/profile');
      return response.data.data.patient.id;
    } catch (error) {
      console.error('Failed to get patient ID:', error);
      return null;
    }
  };


  // Handle booking appointment
  const handleBookingSubmit = async () => {
    setIsLoading(true);
    try {
      const patientId = await getPatientId();
      if (!patientId) {
        toast.error('Unable to identify patient profile');
        return;
      }

      const appointmentData = {
        ...bookingForm,
        patientId: patientId,
        duration: 180 // 3 hours for chamber blocks
      };

      await axios.post('/appointments', appointmentData);
      toast.success('Appointment request sent successfully! Waiting for doctor approval.');
      setShowBookingModal(false);
      // Reset form
      setBookingForm({
        doctorId: '',
        appointmentDate: '',
        timeBlock: '',
        type: 'in_person',
        reason: '',
        symptoms: ''
      });
      // Refresh appointments list and dashboard stats
      await refetchAppointments();
      queryClient.invalidateQueries({ queryKey: ['patient-dashboard-stats'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle view appointment
  const handleViewAppointment = async (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowViewModal(true);
    
    // Fetch prescription data if appointment is completed or in progress
    if (appointment.status === 'completed' || appointment.status === 'in_progress') {
      try {
        const response = await axios.get(`/prescriptions/appointment/${appointment.id}`);
        setPrescriptionData(response.data.data.prescription);
      } catch (error) {
        console.log('No prescription found for this appointment');
        setPrescriptionData(null);
      }
    } else {
      setPrescriptionData(null);
    }
  };

  // Handle rate appointment
  const handleRateAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowRatingModal(true);
  };

  const handleVideoCall = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowVideoModal(true);
  };


  // Handle cancel appointment
  const handleCancelAppointment = async (appointmentId: number) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await axios.put(`/appointments/${appointmentId}/cancel`);
        toast.success('Appointment cancelled successfully!');
        // Refresh appointments list and dashboard stats
        await refetchAppointments();
        queryClient.invalidateQueries({ queryKey: ['patient-dashboard-stats'] });
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to cancel appointment');
      }
    }
  };

  // Load appointments when component mounts
  useEffect(() => {
    // Check if doctorId is in URL params and open booking modal
    const doctorId = searchParams.get('doctorId');
    if (doctorId) {
      setBookingForm(prev => ({ ...prev, doctorId }));
      setShowBookingModal(true);
      fetchDoctors();
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-emerald-400/15 to-blue-400/15 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-gradient-to-tl from-violet-400/15 to-indigo-400/15 rounded-full blur-2xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 space-y-8 p-6">
        {/* Modern Header */}
        <div className={`relative group overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] ${pageLoaded ? 'animate-fade-in-down' : ''}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/5"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-500"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center">
                  <div className="relative group mr-3">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-blue-200/30 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                    <CalendarIcon className="relative h-10 w-10 animate-pulse" />
                  </div>
                  Appointments
                </h1>
                <p className="text-indigo-100 text-lg">
                  Manage your appointments and schedule new ones.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-purple-200/20 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                  <div className="relative w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300 animate-bounce-in">
                    <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center relative">
                      <ClockIcon className="h-8 w-8 text-white" />
                      <SparklesIcon className="h-4 w-4 text-white/70 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* Main Appointments Section */}
        <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <DocumentTextIcon className="h-6 w-6 mr-2 text-indigo-600" />
                My Appointments
              </h3>
              <div className="ml-4 w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">📅</span>
              </div>
            </div>
            <button 
              onClick={() => {
                setShowBookingModal(true);
                fetchDoctors();
              }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl flex items-center gap-2 animate-pulse"
            >
              <PlusIcon className="h-5 w-5" />
              Book New Appointment
            </button>
          </div>

          {/* Modern Filters */}
          <div className="relative group mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className={`relative bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1 ${pageLoaded ? 'animate-fade-in' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="relative group mr-2">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/40 to-blue-200/40 rounded-lg blur-sm opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                    <FunnelIcon className="relative h-5 w-5 text-indigo-600 animate-pulse" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">Filters</h4>
                </div>
              {(statusFilter !== 'all' || typeFilter !== 'all' || doctorFilter !== 'all') && (
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setDoctorFilter('all');
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors duration-200"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Clear Filters
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                  <UserIcon className="h-4 w-4 mr-1 text-indigo-600" />
                  Doctor
                </label>
                <select
                  value={doctorFilter}
                  onChange={(e) => {
                    console.log('Doctor filter changed:', e.target.value);
                    setDoctorFilter(e.target.value);
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:shadow-md focus:shadow-lg hover:scale-[1.02]"
                >
                  <option value="all">All Doctors</option>
                  {uniqueDoctors.map((doctor: any) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} {doctor.department && `(${getDepartmentLabel(doctor.department)})`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-1 text-emerald-600" />
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    console.log('Status filter changed:', e.target.value);
                    setStatusFilter(e.target.value);
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:shadow-md focus:shadow-lg hover:scale-[1.02]"
                >
                  <option value="all">All Status</option>
                  <option value="requested">Requested</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-1 text-purple-600" />
                  Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    console.log('Type filter changed:', e.target.value);
                    setTypeFilter(e.target.value);
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:shadow-md focus:shadow-lg hover:scale-[1.02]"
                >
                  <option value="all">All Types</option>
                  <option value="in_person">In Person</option>
                  <option value="telemedicine">Telemedicine</option>
                  <option value="follow_up">Follow Up</option>
                </select>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 bg-white/50 rounded-lg px-4 py-2 border border-gray-200/50">
              Showing <span className="font-semibold text-indigo-600">{appointments.length}</span> appointment{appointments.length !== 1 ? 's' : ''}
              {(statusFilter !== 'all' || typeFilter !== 'all' || doctorFilter !== 'all') && (
                <span className="text-amber-600 ml-1">(filtered)</span>
              )}
            </div>
          </div>
        </div>

          {/* Modern Appointments List */}
          <div className={`space-y-4 ${pageLoaded ? 'animate-fade-in' : ''}`}>
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarIcon className="h-12 w-12 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments scheduled</h3>
                <p className="text-gray-600 mb-6">Book your first appointment today!</p>
                <button 
                  onClick={() => {
                    setShowBookingModal(true);
                    fetchDoctors();
                  }}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl flex items-center gap-2 mx-auto animate-bounce"
                >
                  <PlusIcon className="h-5 w-5" />
                  Book Appointment
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {appointments.map((appointment: any, index: number) => (
                  <div
                    key={appointment.id}
                    className="relative group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/20 to-purple-200/20 rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                    <div className="relative bg-gradient-to-r from-white to-blue-50 rounded-xl p-6 border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg p-3 text-white">
                            <CalendarIcon className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {new Date(appointment.appointmentDate).toLocaleDateString()}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Serial #{appointment.serialNumber} • {appointment.appointmentTime}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-indigo-600" />
                            <span className="text-sm font-medium text-gray-700">Doctor:</span>
                            <span className="text-sm text-gray-900">
                              Dr. {appointment.doctor?.user?.firstName} {appointment.doctor?.user?.lastName}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <DocumentTextIcon className="h-4 w-4 text-purple-600" />
                            <span className="text-sm font-medium text-gray-700">Type:</span>
                            <span className="text-sm text-gray-900 capitalize">
                              {appointment.type.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              appointment.status === 'requested' ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200' :
                              appointment.status === 'scheduled' ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200' :
                              appointment.status === 'confirmed' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' :
                              appointment.status === 'in_progress' ? 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200' :
                              appointment.status === 'completed' ? 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200' :
                              appointment.status === 'cancelled' ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200' :
                              'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200'
                            }`}>
                              {appointment.status === 'in_progress' ? 'In Progress' : 
                               appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleViewAppointment(appointment)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-lg animate-pulse"
                        >
                          <EyeIcon className="h-4 w-4" />
                          View
                        </button>
                        
                        {appointment.status === 'completed' && (
                          <button 
                            onClick={() => handleRateAppointment(appointment)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-lg animate-bounce ${
                              appointmentRatings[appointment.id]
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                                : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:from-amber-600 hover:to-yellow-600'
                            }`}
                          >
                            <StarIcon className="h-4 w-4" />
                            {appointmentRatings[appointment.id] ? (
                              <span>Rated ({appointmentRatings[appointment.id]}/5)</span>
                            ) : (
                              'Rate'
                            )}
                          </button>
                        )}
                        
                        {appointment.type === 'telemedicine' && (appointment.status === 'confirmed' || appointment.status === 'in_progress') && (
                          <button 
                            onClick={() => handleVideoCall(appointment)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-lg animate-pulse"
                          >
                            <VideoCameraIcon className="h-4 w-4" />
                            Enter Room
                          </button>
                        )}
                        
                        {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                          <button 
                            onClick={() => handleCancelAppointment(appointment.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg hover:from-red-600 hover:to-rose-600 transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-lg animate-bounce"
                          >
                            <XCircleIcon className="h-4 w-4" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modern Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <CalendarIcon className="h-6 w-6 mr-2 text-indigo-600" />
                Book New Appointment
              </h2>
              <button 
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-all duration-300 p-2 hover:bg-gray-100 rounded-full hover:scale-110 hover:shadow-md"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleBookingSubmit(); }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Doctor Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center">
                    <UserIcon className="h-4 w-4 mr-1 text-indigo-600" />
                    Select Doctor
                  </label>
                  <select
                    value={bookingForm.doctorId}
                    onChange={(e) => {
                      setBookingForm({...bookingForm, doctorId: e.target.value, timeBlock: ''});
                      setAvailableTimeBlocks(getAvailableTimeBlocks(e.target.value));
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:shadow-md focus:shadow-lg hover:scale-[1.02]"
                    required
                  >
                    <option value="">Choose a doctor</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        Dr. {doctor.user.firstName} {doctor.user.lastName} - {getDepartmentLabel(doctor.department)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Appointment Date */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1 text-indigo-600" />
                    Date
                  </label>
                  <input
                    type="date"
                    value={bookingForm.appointmentDate}
                    onChange={(e) => {
                      setBookingForm({...bookingForm, appointmentDate: e.target.value, timeBlock: ''});
                      setAvailableTimeBlocks(getAvailableTimeBlocks(bookingForm.doctorId));
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:shadow-md focus:shadow-lg hover:scale-[1.02]"
                    required
                  />
                </div>

                {/* Time Block Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1 text-indigo-600" />
                    Available Chamber Times
                  </label>
                  <select
                    value={bookingForm.timeBlock}
                    onChange={(e) => setBookingForm({...bookingForm, timeBlock: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    required
                    disabled={!bookingForm.doctorId || !bookingForm.appointmentDate}
                  >
                    <option value="">
                      {!bookingForm.doctorId ? 'Please select a doctor first' : 
                       !bookingForm.appointmentDate ? 'Please select a date first' : 
                       'Choose an available chamber time'}
                    </option>
                    {availableTimeBlocks.map((block) => (
                      <option key={block.value} value={block.value}>
                        {block.label}
                      </option>
                    ))}
                  </select>
                  {bookingForm.doctorId && bookingForm.appointmentDate && availableTimeBlocks.length === 0 && (
                    <p className="text-sm text-amber-600 mt-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      No chamber times available for the selected doctor on this day.
                    </p>
                  )}
                </div>

                {/* Appointment Type */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center">
                    <DocumentTextIcon className="h-4 w-4 mr-1 text-indigo-600" />
                    Appointment Type
                  </label>
                  <select
                    value={bookingForm.type}
                    onChange={(e) => setBookingForm({...bookingForm, type: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  >
                    <option value="in_person">In-Person</option>
                    <option value="telemedicine">Telemedicine</option>
                    <option value="follow_up">Follow-up</option>
                  </select>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Reason for Visit</label>
                <input
                  type="text"
                  value={bookingForm.reason}
                  onChange={(e) => setBookingForm({...bookingForm, reason: e.target.value})}
                  placeholder="Brief reason for the appointment"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                />
              </div>

              {/* Symptoms */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Symptoms</label>
                <textarea
                  value={bookingForm.symptoms}
                  onChange={(e) => setBookingForm({...bookingForm, symptoms: e.target.value})}
                  placeholder="Describe any symptoms or concerns"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 hover:scale-110 hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 animate-pulse"
                >
                  {isLoading ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern View Appointment Modal */}
      {showViewModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <EyeIcon className="h-6 w-6 mr-2 text-indigo-600" />
                  Appointment Details
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-all duration-300 p-2 hover:bg-gray-100 rounded-full hover:scale-110 hover:shadow-md"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                    Patient Information
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white/50 rounded-lg p-3">
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-gray-900 font-medium">
                        {selectedAppointment.patient?.user?.firstName} {selectedAppointment.patient?.user?.lastName}
                      </p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <label className="text-sm font-medium text-gray-600">Email</label>
                      <p className="text-gray-900 font-medium">{selectedAppointment.patient?.user?.email}</p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900 font-medium">{selectedAppointment.patient?.user?.phone || 'Not provided'}</p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <label className="text-sm font-medium text-gray-600">Blood Type</label>
                      <p className="text-gray-900 font-medium">{selectedAppointment.patient?.bloodType || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Appointment Information */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-200/50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CalendarIcon className="h-5 w-5 mr-2 text-emerald-600" />
                    Appointment Information
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white/50 rounded-lg p-3">
                      <label className="text-sm font-medium text-gray-600">Date</label>
                      <p className="text-gray-900 font-medium">
                        {new Date(selectedAppointment.appointmentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <label className="text-sm font-medium text-gray-600">Time</label>
                      <p className="text-gray-900 font-medium">{selectedAppointment.appointmentTime}</p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <label className="text-sm font-medium text-gray-600">Serial Number</label>
                      <p className="text-gray-900 font-medium">#{selectedAppointment.serialNumber}</p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <label className="text-sm font-medium text-gray-600">Type</label>
                      <p className="text-gray-900 font-medium capitalize">{selectedAppointment.type.replace('_', ' ')}</p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        selectedAppointment.status === 'confirmed' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' :
                        selectedAppointment.status === 'scheduled' ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200' :
                        selectedAppointment.status === 'cancelled' ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200' :
                        selectedAppointment.status === 'completed' ? 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200' :
                        selectedAppointment.status === 'in_progress' ? 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200' :
                        'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200'
                      }`}>
                        {selectedAppointment.status === 'in_progress' ? 'In Progress' : 
                         selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                      </span>
                    </div>
                    {selectedAppointment.status === 'completed' && selectedAppointment.startedAt && selectedAppointment.completedAt && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Started At</label>
                          <p className="text-gray-900">
                            {new Date(selectedAppointment.startedAt).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Completed At</label>
                          <p className="text-gray-900">
                            {new Date(selectedAppointment.completedAt).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Total Duration</label>
                          <p className="text-green-700 font-semibold">
                            {(() => {
                              const start = new Date(selectedAppointment.startedAt);
                              const end = new Date(selectedAppointment.completedAt);
                              const diffMs = end.getTime() - start.getTime();
                              const diffMins = Math.floor(diffMs / 60000);
                              const hours = Math.floor(diffMins / 60);
                              const mins = diffMins % 60;
                              return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                            })()}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Doctor Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Doctor Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-gray-900">
                        Dr. {selectedAppointment.doctor?.user?.firstName} {selectedAppointment.doctor?.user?.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Department</label>
                      <p className="text-gray-900">
                        {getDepartmentLabel(selectedAppointment.doctor?.department || '') || 'General Medicine'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">BMDC Registration</label>
                      <p className="text-gray-900">{selectedAppointment.doctor?.bmdcRegistrationNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Experience</label>
                      <p className="text-gray-900">{selectedAppointment.doctor?.experience || 0} years</p>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Medical Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Allergies</label>
                      <p className="text-gray-900">{selectedAppointment.patient?.allergies || 'None reported'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Current Medications</label>
                      <p className="text-gray-900">{selectedAppointment.patient?.currentMedications || 'None reported'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Medical History</label>
                      <p className="text-gray-900">{selectedAppointment.patient?.medicalHistory || 'None reported'}</p>
                    </div>
                  </div>
                </div>

                {/* Reason & Symptoms */}
                <div className="col-span-full space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Appointment Reason</h3>
                  <div className="space-y-3">
                    {selectedAppointment.reason && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Reason</label>
                        <p className="text-gray-900">{selectedAppointment.reason}</p>
                      </div>
                    )}
                    {selectedAppointment.symptoms && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Symptoms</label>
                        <p className="text-gray-900">{selectedAppointment.symptoms}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Doctor's Notes, Diagnosis & Prescription */}
                <div className="col-span-full space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Medical Details</h3>
                  <div className="space-y-4">
                    {selectedAppointment.notes && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <label className="text-sm font-medium text-green-900">Doctor's Notes</label>
                        <p className="text-green-800 mt-1">{selectedAppointment.notes}</p>
                      </div>
                    )}
                    {selectedAppointment.diagnosis && (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <label className="text-sm font-medium text-purple-900">Diagnosis</label>
                        <p className="text-purple-800 mt-1">{selectedAppointment.diagnosis}</p>
                      </div>
                    )}
                    {selectedAppointment.prescription && (
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <label className="text-sm font-medium text-indigo-900">Prescription</label>
                        <p className="text-indigo-800 mt-1">{selectedAppointment.prescription}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prescription Details */}
                {prescriptionData && (
                  <div className="col-span-full">
                    <PrescriptionView 
                      prescriptionData={prescriptionData}
                      appointmentData={selectedAppointment}
                      userRole={user?.role}
                    />
                  </div>
                )}

                {/* Emergency Contact */}
                <div className="col-span-full space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact Name</label>
                      <p className="text-gray-900">{selectedAppointment.patient?.emergencyContact || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                      <p className="text-gray-900">{selectedAppointment.patient?.emergencyPhone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 hover:scale-110 hover:shadow-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedAppointment && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          appointment={selectedAppointment}
          onRatingSubmitted={() => {
            // Refresh appointments and ratings to show updated data
            refetchAppointments();
            // Invalidate the patient ratings query to refetch
            queryClient.invalidateQueries({ queryKey: ['patient-ratings', user?.id] });
          }}
        />
      )}

      {/* Video Consultation Modal */}
      {showVideoModal && selectedAppointment && (
        <VideoConsultation
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
          appointmentId={selectedAppointment.id}
          doctorName={`Dr. ${selectedAppointment.doctor.user.firstName} ${selectedAppointment.doctor.user.lastName}`}
          patientName={`${selectedAppointment.patient.user.firstName} ${selectedAppointment.patient.user.lastName}`}
          userRole="patient"
        />
      )}
    </div>
  );
};

export default Appointments;
