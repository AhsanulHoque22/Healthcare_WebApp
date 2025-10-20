import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  CalendarIcon, 
  UserGroupIcon, 
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
  UserIcon,
  StarIcon,
  EyeIcon,
  ArrowRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

interface DashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  requestedAppointments: number;
  inProgressAppointments: number;
  totalPatients: number;
}

interface TodayAppointment {
  id: number;
  appointmentTime: string;
  status: string;
  serialNumber: number;
  patient: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  reason?: string;
}

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pageLoaded, setPageLoaded] = useState(false);

  // Page load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch doctor profile to get doctor ID
  const { data: doctorProfile } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: async () => {
      const response = await axios.get('/doctors/profile');
      return response.data.data.doctor;
    },
    enabled: user?.role === 'doctor',
  });

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['doctor-dashboard-stats', doctorProfile?.id],
    queryFn: async () => {
      const response = await axios.get(`/doctors/${doctorProfile?.id}/dashboard/stats`);
      return response.data.data.stats;
    },
    enabled: !!doctorProfile?.id,
  });

  // Fetch today's appointments for this doctor
  const { data: appointments } = useQuery<TodayAppointment[]>({
    queryKey: ['doctor-appointments-today', doctorProfile?.id],
    queryFn: async () => {
      if (!doctorProfile?.id) return [];
      
      // Fetch appointments for today for this specific doctor
      const today = new Date().toISOString().split('T')[0];
      const response = await axios.get(`/doctors/${doctorProfile.id}/appointments`, {
        params: { date: today }
      });
      
      const allAppointments = response.data.data.appointments || [];
      
      // Sort by appointment time
      return allAppointments.sort((a: any, b: any) => a.appointmentTime.localeCompare(b.appointmentTime));
    },
    enabled: user?.role === 'doctor' && !!doctorProfile?.id,
  });

  // Fetch doctor's ratings
  const { data: ratingData } = useQuery({
    queryKey: ['doctor-ratings', doctorProfile?.id],
    queryFn: async () => {
      const response = await axios.get(`/ratings/doctor/${doctorProfile?.id}`);
      return response.data.data;
    },
    enabled: !!doctorProfile?.id,
  });

  const getStatusColor = (status: string) => {
    const colors = {
      requested: 'border-yellow-500 bg-yellow-50',
      scheduled: 'border-blue-500 bg-blue-50',
      in_progress: 'border-purple-500 bg-purple-50',
      completed: 'border-green-500 bg-green-50',
      cancelled: 'border-red-500 bg-red-50',
    };
    return colors[status as keyof typeof colors] || 'border-gray-500 bg-gray-50';
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      requested: 'bg-yellow-100 text-yellow-800',
      scheduled: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const statsCards = [
    {
      name: 'Today\'s Appointments',
      value: stats?.todayAppointments || 0,
      icon: CalendarIcon,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      name: 'Pending Requests',
      value: stats?.requestedAppointments || 0,
      icon: ExclamationCircleIcon,
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      name: 'In Progress',
      value: stats?.inProgressAppointments || 0,
      icon: ClockIcon,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
    },
    {
      name: 'Completed Today',
      value: stats?.completedAppointments || 0,
      icon: CheckCircleIcon,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      name: 'Total Patients',
      value: stats?.totalPatients || 0,
      icon: UserGroupIcon,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
    },
    {
      name: 'Total Appointments',
      value: stats?.totalAppointments || 0,
      icon: ChartBarIcon,
      color: 'from-rose-500 to-rose-600',
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="space-y-8 p-6">
        {/* Modern Header */}
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white shadow-2xl ${pageLoaded ? 'animate-fade-in-down' : ''}`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">
                  Welcome back, Dr. {user?.firstName}!
                </h1>
                <p className="text-indigo-100 text-lg">
                  Here's your practice overview and today's schedule.
                </p>
                {ratingData?.summary && ratingData.summary.totalRatings > 0 && (
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
                      <StarIcon className="h-5 w-5 text-yellow-300" />
                      <span className="font-semibold">
                        {parseFloat(ratingData.summary.averageRating).toFixed(1)}
                      </span>
                      <span className="text-indigo-200 text-sm">
                        ({ratingData.summary.totalRatings} reviews)
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                  <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center relative">
                    <UserIcon className="h-8 w-8 text-white" />
                    <SparklesIcon className="h-4 w-4 text-white/70 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* Stats Cards */}
        {statsLoading ? (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${pageLoaded ? 'animate-fade-in' : ''}`}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded-lg w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded-lg w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
            {statsCards.map((stat, index) => (
              <div
                key={stat.name}
                className="relative group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${stat.color.replace('from-', 'from-').replace('to-', 'to-')}/20 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500`}></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 border border-white/50 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
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
          {/* Today's Schedule */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg p-3 text-white">
                  <CalendarIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Today's Schedule</h3>
                  <p className="text-sm text-gray-600">Your appointments for today</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/app/doctor-appointments')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-lg text-sm font-medium animate-pulse"
              >
                <EyeIcon className="h-4 w-4" />
                View All
              </button>
            </div>
            <div className="space-y-4">
              {!appointments || appointments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CalendarIcon className="h-12 w-12 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No appointments scheduled for today</h3>
                  <p className="text-gray-600">Enjoy your free time or check upcoming appointments</p>
                </div>
              ) : (
                appointments.slice(0, 5).map((appointment, index) => (
                  <div
                    key={appointment.id}
                    className="relative group bg-gradient-to-r from-white to-blue-50 rounded-xl p-4 border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-pointer"
                    onClick={() => navigate('/app/doctor-appointments')}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                    <div className="relative">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            Serial #{appointment.serialNumber}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {appointment.appointmentTime}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-lg mb-1">
                          {appointment.patient.user.firstName} {appointment.patient.user.lastName}
                        </h4>
                        {appointment.reason && (
                          <p className="text-sm text-gray-600 bg-white/50 rounded-lg p-2 mt-2">
                            <span className="font-semibold text-gray-900">Reason:</span> {appointment.reason.length > 60 ? `${appointment.reason.substring(0, 60)}...` : appointment.reason}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          appointment.status === 'requested' ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200' :
                          appointment.status === 'scheduled' ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200' :
                          appointment.status === 'in_progress' ? 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200' :
                          appointment.status === 'completed' ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200' :
                          'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                        }`}>
                          {appointment.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-all duration-300 group-hover:scale-110" />
                      </div>
                    </div>
                    </div>
                  </div>
                ))
              )}
            </div>
        </div>

          {/* Quick Actions */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg p-3 text-white mr-3">
                <ArrowRightIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
                <p className="text-sm text-gray-600">Manage your practice efficiently</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <button
                  onClick={() => navigate('/app/doctor-appointments')}
                  className="relative group w-full text-left p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 border border-blue-200/50 hover:shadow-lg animate-pulse"
                >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                    <CalendarIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <span className="text-blue-800 font-semibold block">Manage Appointments</span>
                    <span className="text-blue-600 text-sm">
                      {stats?.requestedAppointments || 0} pending requests
                    </span>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-blue-400 group-hover:text-blue-600 transition-all duration-300 group-hover:scale-110" />
                </div>
                </button>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/20 to-green-200/20 rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <button
                  onClick={() => navigate('/app/patients')}
                  className="relative group w-full text-left p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl hover:from-emerald-100 hover:to-green-100 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 border border-emerald-200/50 hover:shadow-lg animate-bounce"
                >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                    <UserGroupIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <span className="text-emerald-800 font-semibold block">Patient History</span>
                    <span className="text-emerald-600 text-sm">
                      {stats?.totalPatients || 0} total patients
                    </span>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-emerald-400 group-hover:text-emerald-600 transition-all duration-300 group-hover:scale-110" />
                </div>
                </button>
              </div>

              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-200/20 to-violet-200/20 rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <button
                  onClick={() => navigate('/app/doctor-profile')}
                  className="relative group w-full text-left p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl hover:from-purple-100 hover:to-violet-100 transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 border border-purple-200/50 hover:shadow-lg animate-pulse"
                >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                    <UserIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <span className="text-purple-800 font-semibold block">Update Profile</span>
                    <span className="text-purple-600 text-sm">Manage your professional information</span>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-purple-400 group-hover:text-purple-600 transition-all duration-500 group-hover:scale-110" />
                </div>
                </button>
              </div>
            </div>
          </div>
      </div>

        {/* Appointment Requests Summary */}
        {stats && stats.requestedAppointments > 0 && (
          <div className={`bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 shadow-lg border border-amber-200/50 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg p-3 text-white shadow-lg">
                  <ExclamationCircleIcon className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-amber-900">
                    {stats.requestedAppointments} Appointment Request{stats.requestedAppointments !== 1 ? 's' : ''} Pending
                  </h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Review and approve appointment requests from patients
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/app/doctor-appointments')}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-lg font-medium animate-bounce"
              >
                <EyeIcon className="h-5 w-5" />
                Review Requests
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;