import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import API from '../api/api';
import {
  CalendarIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
  UserIcon,
  StarIcon,
  ArrowRightIcon,
  ArrowLongRightIcon,
  ChevronRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { Reveal, MagneticButton } from '../components/landing/AnimatedSection';

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

  const { data: doctorProfile } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: async () => {
      const response = await API.get('/doctors/profile');
      return response.data.data.doctor;
    },
    enabled: user?.role === 'doctor',
  });

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['doctor-dashboard-stats', doctorProfile?.id],
    queryFn: async () => {
      const response = await API.get(`/doctors/${doctorProfile?.id}/dashboard/stats`);
      return response.data.data.stats;
    },
    enabled: !!doctorProfile?.id,
  });

  const { data: appointments } = useQuery<TodayAppointment[]>({
    queryKey: ['doctor-appointments-today', doctorProfile?.id],
    queryFn: async () => {
      if (!doctorProfile?.id) return [];
      const today = new Date().toISOString().split('T')[0];
      const response = await API.get(`/doctors/${doctorProfile.id}/appointments`, {
        params: { date: today },
      });
      const allAppointments = response.data.data.appointments || [];
      return allAppointments.sort((a: any, b: any) =>
        a.appointmentTime.localeCompare(b.appointmentTime)
      );
    },
    enabled: user?.role === 'doctor' && !!doctorProfile?.id,
  });

  const { data: ratingData } = useQuery({
    queryKey: ['doctor-ratings', doctorProfile?.id],
    queryFn: async () => {
      const response = await API.get(`/ratings/doctor/${doctorProfile?.id}`);
      return response.data.data;
    },
    enabled: !!doctorProfile?.id,
  });

  const statsCards = [
    { name: "Today's Appointments", value: stats?.todayAppointments || 0,      icon: CalendarIcon,          color: 'from-blue-600 to-indigo-600',   bgColor: 'bg-blue-50',    iconColor: 'text-blue-600',    bg: 'bg-blue-500/5'    },
    { name: 'Pending Requests',      value: stats?.requestedAppointments || 0,  icon: ExclamationCircleIcon, color: 'from-amber-600 to-orange-600',  bgColor: 'bg-amber-50',   iconColor: 'text-amber-600',   bg: 'bg-amber-500/5'   },
    { name: 'In Progress',           value: stats?.inProgressAppointments || 0, icon: ClockIcon,             color: 'from-violet-600 to-purple-600', bgColor: 'bg-violet-50',  iconColor: 'text-violet-600',  bg: 'bg-violet-500/5'  },
    { name: 'Completed Today',       value: stats?.completedAppointments || 0,  icon: CheckCircleIcon,       color: 'from-emerald-600 to-teal-600',  bgColor: 'bg-emerald-50', iconColor: 'text-emerald-600', bg: 'bg-emerald-500/5' },
    { name: 'Total Patients',        value: stats?.totalPatients || 0,          icon: UserGroupIcon,         color: 'from-rose-600 to-pink-600',     bgColor: 'bg-rose-50',    iconColor: 'text-rose-600',    bg: 'bg-rose-500/5'    },
    { name: 'Total Appointments',    value: stats?.totalAppointments || 0,      icon: ChartBarIcon,          color: 'from-indigo-600 to-blue-600',   bgColor: 'bg-indigo-50',  iconColor: 'text-indigo-600',  bg: 'bg-indigo-500/5'  },
  ];

  const quickActions = [
    { title: 'Manage Appointments', subtitle: `${stats?.requestedAppointments || 0} pending requests`, icon: CalendarIcon,  iconColor: 'text-blue-500',    iconBg: 'bg-blue-50',    href: '/app/doctor-appointments' },
    { title: 'Patient History',     subtitle: `${stats?.totalPatients || 0} total patients`,           icon: UserGroupIcon, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-50', href: '/app/patients'            },
    { title: 'Update Profile',      subtitle: 'Manage your professional info',                         icon: UserIcon,      iconColor: 'text-violet-500',  iconBg: 'bg-violet-50',  href: '/app/doctor-profile'      },
  ];

  const statusPill = (status: string) => {
    switch (status) {
      case 'requested':   return 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'scheduled':   return 'bg-blue-50 text-blue-700 border border-blue-100';
      case 'in_progress': return 'bg-violet-50 text-violet-700 border border-violet-100';
      case 'completed':   return 'bg-emerald-50 text-emerald-700 border border-emerald-100';
      default:            return 'bg-rose-50 text-rose-600 border border-rose-100';
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbff] relative overflow-hidden noise-overlay font-sans selection:bg-indigo-100 selection:text-indigo-900">

      {/* ── Background Decor ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[100px] animate-pulse" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'radial-gradient(#4f46e5 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 space-y-10">

        {/* ══ HERO CARD ══ */}
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-slate-900 p-8 md:p-12 text-white shadow-2xl shadow-slate-200/50">
            {/* Inner aurora */}
            <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-l from-indigo-500/20 via-transparent to-transparent opacity-60" />
              <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-400/20 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 md:flex items-center justify-between gap-10">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Doctor Dashboard
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1]">
                  Welcome back,<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 animate-gradient-shift italic pr-2">
                    Dr. {user?.firstName} {user?.lastName}
                  </span>.
                </h1>
                <p className="text-slate-400 font-medium max-w-lg">
                  Here's your practice overview and today's schedule.
                </p>
              </div>

              <div className="hidden lg:flex items-center gap-4 mt-6 md:mt-0 flex-shrink-0">
                {ratingData?.summary && ratingData.summary.totalRatings > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/10">
                    <StarIcon className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-black text-white">
                      {parseFloat(ratingData.summary.averageRating).toFixed(1)}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({ratingData.summary.totalRatings} reviews)
                    </span>
                  </div>
                )}
                <div className="w-px h-10 bg-white/10" />
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-lg font-black text-emerald-400">Active</p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ══ STATS GRID ══ */}
        {statsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-white/50 rounded-[28px] animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {statsCards.map((stat, i) => (
              <Reveal key={stat.name} delay={i * 0.1}>
                <div className="premium-card group relative p-6 bg-white rounded-[28px] border border-slate-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-600 overflow-hidden">
                  {/* Corner tint */}
                  <div className={`absolute top-0 right-0 w-20 h-20 ${stat.bg} rounded-bl-full opacity-50 group-hover:scale-110 transition-transform duration-500`} />
                  <div className="flex flex-col h-full">
                    <div className={`w-12 h-12 rounded-2xl ${stat.bgColor} flex items-center justify-center mb-6 shadow-inner group-hover:rotate-6 transition-transform duration-500`}>
                      <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.name}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</span>
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md">Live</span>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}

        {/* ══ CONTENT GRID: SCHEDULE + QUICK ACTIONS ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* TODAY'S SCHEDULE — spans 2/3 */}
          <div className="lg:col-span-2">
            <Reveal>
              <div className="bg-white rounded-[28px] border border-slate-100 p-6 md:p-8">

                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <CalendarIcon className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Today's Schedule</h3>
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Your appointments for today</p>
                    </div>
                  </div>
                  <MagneticButton
                    onClick={() => navigate('/app/doctor-appointments')}
                    className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors group"
                  >
                    See All
                    <ChevronRightIcon className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform duration-200" />
                  </MagneticButton>
                </div>

                <div className="space-y-3">
                  {!appointments || appointments.length === 0 ? (
                    <div className="py-14 text-center">
                      <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CalendarIcon className="h-7 w-7 text-slate-300" />
                      </div>
                      <p className="text-sm font-bold text-slate-400">No appointments scheduled for today</p>
                      <p className="text-xs text-slate-400 mt-1 font-medium">Enjoy your free time or check upcoming appointments</p>
                    </div>
                  ) : (
                    appointments.slice(0, 5).map((appointment, i) => (
                      <Reveal key={appointment.id} delay={i * 0.08}>
                        <div
                          className="premium-card group p-5 bg-white/60 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-lg hover:shadow-indigo-500/[0.05] transition-all duration-500 cursor-pointer"
                          onClick={() => navigate('/app/doctor-appointments')}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-indigo-600 group-hover:bg-indigo-50 transition-colors text-sm flex-shrink-0">
                                {appointment.patient.user.firstName[0]}{appointment.patient.user.lastName[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-black text-slate-900 leading-tight">
                                  {appointment.patient.user.firstName} {appointment.patient.user.lastName}
                                </p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[11px] font-bold text-slate-400">
                                    #{appointment.serialNumber}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                    <ClockIcon className="h-3 w-3" />
                                    {appointment.appointmentTime}
                                  </span>
                                </div>
                                {appointment.reason && (
                                  <p className="text-xs text-slate-400 font-medium mt-1 truncate max-w-xs">
                                    {appointment.reason.length > 60
                                      ? `${appointment.reason.substring(0, 60)}...`
                                      : appointment.reason}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusPill(appointment.status)}`}>
                                {appointment.status.replace('_', ' ')}
                              </span>
                              <ArrowRightIcon className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all duration-200" />
                            </div>
                          </div>
                        </div>
                      </Reveal>
                    ))
                  )}
                </div>
              </div>
            </Reveal>
          </div>

          {/* QUICK ACTIONS — 1/3 */}
          <div className="space-y-4">
            <Reveal delay={0.1}>
              <div className="flex items-center gap-3 mb-2 px-1">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Quick Actions</h3>
                <div className="h-px flex-1 bg-slate-100" />
              </div>
            </Reveal>

            {quickActions.map((action, i) => (
              <Reveal key={action.title} variant="scaleIn" delay={i * 0.08}>
                <button
                  onClick={() => navigate(action.href)}
                  className="w-full premium-card group p-5 bg-white/50 border border-slate-100 rounded-[24px] hover:bg-white hover:shadow-xl hover:shadow-indigo-500/[0.05] hover:border-indigo-100 transition-all duration-500 text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 ${action.iconBg} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                        <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{action.title}</p>
                        <p className="text-xs font-medium text-slate-400">{action.subtitle}</p>
                      </div>
                    </div>
                    <ArrowRightIcon className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0" />
                  </div>
                </button>
              </Reveal>
            ))}

            {/* Smart Schedule Insights dark card */}
            <Reveal delay={0.35}>
              <div className="bg-slate-900 rounded-[32px] p-6 text-white overflow-hidden relative">
                <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-violet-500/20 rounded-full blur-[40px] pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-2 bg-white/10 rounded-xl">
                      <SparklesIcon className="h-4 w-4 text-cyan-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Practice AI</span>
                  </div>
                  <h5 className="font-black text-base mb-2 tracking-tight">Smart Schedule Insights</h5>
                  <p className="text-slate-400 text-xs font-medium leading-relaxed mb-5">
                    AI-powered appointment pattern analysis. Optimise your availability and reduce no-shows.
                  </p>
                  <MagneticButton
                    onClick={() => navigate('/app/doctor-appointments')}
                    className="w-full py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200"
                  >
                    View Schedule
                  </MagneticButton>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* ══ PENDING REQUESTS BANNER (conditional) ══ */}
        {stats && stats.requestedAppointments > 0 && (
          <Reveal>
            <div className="relative overflow-hidden rounded-[28px] bg-amber-50 border border-amber-100 p-6 md:p-8">
              <div className="absolute top-[-30%] right-[-5%] w-48 h-48 bg-amber-300/20 rounded-full blur-[60px] pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <ExclamationCircleIcon className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-amber-900">
                      {stats.requestedAppointments} Appointment Request{stats.requestedAppointments !== 1 ? 's' : ''} Pending
                    </h3>
                    <p className="text-sm font-medium text-amber-700 mt-0.5">
                      Review and approve appointment requests from patients
                    </p>
                  </div>
                </div>
                <MagneticButton
                  onClick={() => navigate('/app/doctor-appointments')}
                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-800 transition-all shadow-sm flex-shrink-0"
                >
                  Review Requests
                  <ArrowLongRightIcon className="h-4 w-4" />
                </MagneticButton>
              </div>
            </div>
          </Reveal>
        )}

      </div>
    </div>
  );
};

export default DoctorDashboard;
