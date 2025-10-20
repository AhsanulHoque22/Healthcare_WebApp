import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import DashboardMedicineTracker from '../components/DashboardMedicineTracker';
import MedicineMatrix from '../components/MedicineMatrix';
import {
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  totalPatients?: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pageLoaded, setPageLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  // Get patient profile for patients
  const { data: patientProfile } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: async () => {
      const response = await axios.get('/patients/profile');
      return response.data.data.patient;
    },
    enabled: user?.role === 'patient',
  });

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await axios.get('/admin/stats', {
        params: { _t: Date.now() } // Cache-busting parameter
      });
      return response.data.data.stats;
    },
    enabled: user?.role === 'admin',
    staleTime: 0, // Data is immediately stale
    gcTime: 0, // Don't cache the data
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
  });

  const { data: patientStats, isLoading: patientLoading } = useQuery<DashboardStats>({
    queryKey: ['patient-dashboard-stats', user?.id],
    queryFn: async () => {
      try {
        // First get the patient profile to get the patient ID
        const patientResponse = await axios.get('/patients/profile');
        const patientId = patientResponse.data.data.patient.id;
        
        // Then get the dashboard stats using the patient ID
        const response = await axios.get(`/patients/${patientId}/dashboard/stats`, {
          params: { _t: Date.now() } // Cache-busting parameter
        });
        return response.data.data.stats;
      } catch (error) {
        console.error('Error fetching patient dashboard stats:', error);
        // Return default stats if API fails
        return {
          totalAppointments: 0,
          todayAppointments: 0,
          completedAppointments: 0,
          pendingAppointments: 0,
          requestedAppointments: 0,
          scheduledAppointments: 0
        };
      }
    },
    enabled: user?.role === 'patient' && !!user?.id,
    staleTime: 0, // Data is immediately stale
    gcTime: 0, // Don't cache the data
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 2, // Retry failed requests
  });

  const { data: doctorStats, isLoading: doctorLoading } = useQuery<DashboardStats>({
    queryKey: ['doctor-dashboard-stats', user?.id],
    queryFn: async () => {
      // First get the doctor profile to get the doctor ID
      const doctorResponse = await axios.get('/doctors/profile');
      const doctorId = doctorResponse.data.data.doctor.id;
      
      // Then get the dashboard stats using the doctor ID
      const response = await axios.get(`/doctors/${doctorId}/dashboard/stats`, {
        params: { _t: Date.now() } // Cache-busting parameter
      });
      return response.data.data.stats;
    },
    enabled: user?.role === 'doctor' && !!user?.id,
    staleTime: 0, // Data is immediately stale
    gcTime: 0, // Don't cache the data
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  // Fetch recent appointments
  const { data: recentAppointments } = useQuery({
    queryKey: ['recent-appointments', user?.id],
    queryFn: async () => {
      if (user?.role === 'patient') {
        const patientResponse = await axios.get('/patients/profile');
        const patientId = patientResponse.data.data.patient.id;
        const response = await axios.get(`/patients/${patientId}/appointments`, {
          params: { limit: 5, sortBy: 'appointmentDate', sortOrder: 'DESC', _t: Date.now() }
        });
        return response.data.data.appointments;
      } else if (user?.role === 'doctor') {
        const doctorResponse = await axios.get('/doctors/profile');
        const doctorId = doctorResponse.data.data.doctor.id;
        const response = await axios.get(`/doctors/${doctorId}/appointments`, {
          params: { limit: 5, sortBy: 'appointmentDate', sortOrder: 'DESC', _t: Date.now() }
        });
        return response.data.data.appointments;
      } else if (user?.role === 'admin') {
        const response = await axios.get('/appointments', {
          params: { limit: 5, sortBy: 'appointmentDate', sortOrder: 'DESC', _t: Date.now() }
        });
        return response.data.data.appointments;
      }
      return [];
    },
    enabled: !!user?.id,
    staleTime: 0, // Data is immediately stale
    gcTime: 0, // Don't cache the data
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
  });

  const getStats = () => {
    if (user?.role === 'admin') return stats;
    if (user?.role === 'doctor') return doctorStats;
    if (user?.role === 'patient') return patientStats;
    return null;
  };

  const getLoading = () => {
    if (user?.role === 'admin') return isLoading;
    if (user?.role === 'doctor') return doctorLoading;
    if (user?.role === 'patient') return patientLoading;
    return false;
  };

  const currentStats = getStats();
  const loading = getLoading();

  const statsCards = [
    {
      name: 'Total Appointments',
      value: currentStats?.totalAppointments || 0,
      icon: CalendarIcon,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      name: 'Today\'s Appointments',
      value: currentStats?.todayAppointments || 0,
      icon: ClockIcon,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      name: 'Completed Appointments',
      value: currentStats?.completedAppointments || 0,
      icon: CheckCircleIcon,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      name: 'Pending Appointments',
      value: currentStats?.pendingAppointments || 0,
      icon: ExclamationTriangleIcon,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ];

  if (user?.role === 'admin' || user?.role === 'doctor') {
    statsCards.push({
      name: 'Total Patients',
      value: currentStats?.totalPatients || 0,
      icon: UserGroupIcon,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    });
  }

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
                    <span className="relative animate-pulse">👋</span>
                  </div>
                  Welcome back, {user?.firstName}!
                </h1>
                <p className="text-indigo-100 text-lg">
                  Here's what's happening with your healthcare account today.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-purple-200/20 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                  <div className="relative w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300 animate-bounce-in">
                    <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center relative">
                      <UserGroupIcon className="h-8 w-8 text-white" />
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

        {/* Stats Cards */}
        {loading ? (
          <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${user?.role === 'patient' ? 'lg:grid-cols-4' : 'lg:grid-cols-5'} ${pageLoaded ? 'animate-fade-in' : ''}`}>
            {[...Array(user?.role === 'patient' ? 4 : 5)].map((_, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded-lg w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded-lg w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-6 sm:grid-cols-2 ${statsCards.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-5'} ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
            {statsCards.map((stat, index) => (
              <div
                key={stat.name}
                className="relative group"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.color.replace('from-', 'from-').replace('to-', 'to-')}/30 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500`}></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.05] hover:-translate-y-2 border border-white/50 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg group-hover:scale-110 transition-transform duration-300 animate-pulse`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.name}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="h-1 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${stat.color} rounded-full transition-all duration-1000 ease-out`}
                      style={{ width: `${Math.min((stat.value / Math.max(stat.value, 1)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                </div>
              </div>
          ))}
        </div>
      )}

        {/* Content Grid */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${pageLoaded ? 'animate-fade-in' : ''}`}>
        {/* Recent Appointments */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 border border-white/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Recent Appointments</h3>
                <CalendarIcon className="h-6 w-6 text-indigo-600 animate-pulse" />
              </div>
            <div className="space-y-4">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded-xl"></div>
                  </div>
                ))
              ) : recentAppointments && recentAppointments.length > 0 ? (
                recentAppointments.map((appointment: any, index: number) => (
                  <div
                    key={appointment.id}
                    className="relative group"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/20 to-purple-200/20 rounded-xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                    <div className="relative bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 border border-gray-200/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user?.role === 'patient' 
                              ? `${appointment.doctor?.user?.firstName?.[0]}${appointment.doctor?.user?.lastName?.[0]}`
                              : `${appointment.patient?.user?.firstName?.[0]}${appointment.patient?.user?.lastName?.[0]}`
                            }
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {user?.role === 'patient' 
                              ? `Dr. ${appointment.doctor?.user?.firstName} ${appointment.doctor?.user?.lastName}`
                              : `${appointment.patient?.user?.firstName} ${appointment.patient?.user?.lastName}`
                            }
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full shadow-sm ${
                        appointment.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        appointment.status === 'scheduled' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                    </div>
                </div>
              ))
            ) : (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No recent appointments found.</p>
                </div>
            )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-200/30 to-pink-200/30 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 border border-white/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center animate-bounce">
                  <span className="text-white text-sm font-bold">⚡</span>
                </div>
              </div>
            <div className="space-y-4">
            {user?.role === 'patient' && (
              <>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                  <button
                    onClick={() => navigate('/app/appointments')}
                    className="relative group w-full text-left p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 border border-blue-200/50 hover:shadow-lg animate-pulse"
                  >
                  <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                        <CalendarIcon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-blue-800 font-semibold">Book Appointment</span>
                      <ArrowRightIcon className="h-5 w-5 text-blue-400 group-hover:text-blue-600 transition-all duration-300 group-hover:scale-110 ml-auto" />
                  </div>
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/20 to-green-200/20 rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                  <button
                    onClick={() => navigate('/app/medical-records')}
                    className="relative group w-full text-left p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl hover:from-emerald-100 hover:to-green-100 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 border border-emerald-200/50 hover:shadow-lg animate-bounce"
                  >
                  <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                        <DocumentTextIcon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-emerald-800 font-semibold">View Medical Records</span>
                      <ArrowRightIcon className="h-5 w-5 text-emerald-400 group-hover:text-emerald-600 transition-all duration-300 group-hover:scale-110 ml-auto" />
                  </div>
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-200/20 to-violet-200/20 rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                  <button
                    onClick={() => navigate('/app/doctors')}
                    className="relative group w-full text-left p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl hover:from-purple-100 hover:to-violet-100 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 border border-purple-200/50 hover:shadow-lg animate-pulse"
                  >
                  <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                        <UserGroupIcon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-purple-800 font-semibold">Find Doctors</span>
                      <ArrowRightIcon className="h-5 w-5 text-purple-400 group-hover:text-purple-600 transition-all duration-500 group-hover:scale-110 ml-auto" />
                  </div>
                  </button>
                </div>
              </>
            )}
            {user?.role === 'doctor' && (
              <>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                  <button
                    onClick={() => navigate('/app/appointments')}
                    className="relative group w-full text-left p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 border border-blue-200/50 hover:shadow-lg animate-pulse"
                  >
                  <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                        <CalendarIcon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-blue-800 font-semibold">Manage Appointments</span>
                      <ArrowRightIcon className="h-5 w-5 text-blue-400 group-hover:text-blue-600 transition-all duration-300 group-hover:scale-110 ml-auto" />
                  </div>
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/20 to-green-200/20 rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                  <button
                    onClick={() => navigate('/app/admin-patients')}
                    className="relative group w-full text-left p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl hover:from-emerald-100 hover:to-green-100 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 border border-emerald-200/50 hover:shadow-lg animate-bounce"
                  >
                  <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                        <UserGroupIcon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-emerald-800 font-semibold">Patient History</span>
                      <ArrowRightIcon className="h-5 w-5 text-emerald-400 group-hover:text-emerald-600 transition-all duration-300 group-hover:scale-110 ml-auto" />
                  </div>
                  </button>
                </div>
              </>
            )}
            {user?.role === 'admin' && (
              <>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                  <button
                    onClick={() => navigate('/app/admin-users')}
                    className="relative group w-full text-left p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 border border-blue-200/50 hover:shadow-lg animate-pulse"
                  >
                  <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                        <UserGroupIcon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-blue-800 font-semibold">Manage Users</span>
                      <ArrowRightIcon className="h-5 w-5 text-blue-400 group-hover:text-blue-600 transition-all duration-300 group-hover:scale-110 ml-auto" />
                  </div>
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/20 to-green-200/20 rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                  <button
                    onClick={() => navigate('/app/appointments')}
                    className="relative group w-full text-left p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl hover:from-emerald-100 hover:to-green-100 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 border border-emerald-200/50 hover:shadow-lg animate-bounce"
                  >
                  <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                        <CalendarIcon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-emerald-800 font-semibold">All Appointments</span>
                      <ArrowRightIcon className="h-5 w-5 text-emerald-400 group-hover:text-emerald-600 transition-all duration-300 group-hover:scale-110 ml-auto" />
                  </div>
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-200/20 to-violet-200/20 rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                  <button
                    onClick={() => navigate('/app/admin-lab-tests')}
                    className="relative group w-full text-left p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl hover:from-purple-100 hover:to-violet-100 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 border border-purple-200/50 hover:shadow-lg animate-pulse"
                  >
                  <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                        <ChartBarIcon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-purple-800 font-semibold">Lab Reports & Analytics</span>
                      <ArrowRightIcon className="h-5 w-5 text-purple-400 group-hover:text-purple-600 transition-all duration-500 group-hover:scale-110 ml-auto" />
                  </div>
                  </button>
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Medicine Tracker for Patients */}
      {user?.role === 'patient' && patientProfile?.id && (
          <div className="mt-8">
        <MedicineMatrix patientId={patientProfile.id} />
          </div>
      )}
      </div>
    </div>
  );
};

export default Dashboard;
