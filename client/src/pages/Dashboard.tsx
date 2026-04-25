import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../api/api';
import DashboardMedicineTracker from '../components/DashboardMedicineTracker';
import MedicineMatrix from '../components/MedicineMatrix';
import { Reveal, MagneticButton } from '../components/landing/AnimatedSection';
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
  StarIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AcademicCapIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  BellAlertIcon,
  CpuChipIcon,
  ArrowLongRightIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  totalPatients?: number;
  requestedAppointments?: number;
  scheduledAppointments?: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // API Queries (Preserving all original logic)
  const { data: patientProfile } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: async () => {
      const response = await API.get('/patients/profile');
      return response.data.data.patient;
    },
    enabled: user?.role === 'patient',
  });

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await API.get('/admin/stats', { params: { _t: Date.now() } });
      return response.data.data.stats;
    },
    enabled: user?.role === 'admin',
    staleTime: 0, gcTime: 0, refetchOnWindowFocus: true, refetchOnMount: true,
  });

  const { data: patientStats, isLoading: patientLoading } = useQuery<DashboardStats>({
    queryKey: ['patient-dashboard-stats', user?.id],
    queryFn: async () => {
      try {
        const patientResponse = await API.get('/patients/profile');
        const patientId = patientResponse.data.data.patient.id;
        const response = await API.get(`/patients/${patientId}/dashboard/stats`, { params: { _t: Date.now() } });
        return response.data.data.stats;
      } catch (error) {
        return { totalAppointments: 0, todayAppointments: 0, completedAppointments: 0, pendingAppointments: 0, requestedAppointments: 0, scheduledAppointments: 0 };
      }
    },
    enabled: user?.role === 'patient' && !!user?.id,
    staleTime: 0, gcTime: 0, refetchOnWindowFocus: true, refetchOnMount: true, refetchInterval: 30000, retry: 2,
  });

  const { data: doctorStats, isLoading: doctorLoading } = useQuery<DashboardStats>({
    queryKey: ['doctor-dashboard-stats', user?.id],
    queryFn: async () => {
      const doctorResponse = await API.get('/doctors/profile');
      const doctorId = doctorResponse.data.data.doctor.id;
      const response = await API.get(`/doctors/${doctorId}/dashboard/stats`, { params: { _t: Date.now() } });
      return response.data.data.stats;
    },
    enabled: user?.role === 'doctor' && !!user?.id,
    staleTime: 0, gcTime: 0, refetchOnWindowFocus: true, refetchOnMount: true, refetchInterval: 30000,
  });

  const { data: recentAppointments } = useQuery({
    queryKey: ['recent-appointments', user?.id],
    queryFn: async () => {
      if (user?.role === 'patient') {
        const patientResponse = await API.get('/patients/profile');
        const patientId = patientResponse.data.data.patient.id;
        const response = await API.get(`/patients/${patientId}/appointments`, { params: { limit: 6, sortBy: 'appointmentDate', sortOrder: 'DESC', _t: Date.now() } });
        return response.data.data.appointments;
      } else if (user?.role === 'doctor') {
        const doctorResponse = await API.get('/doctors/profile');
        const doctorId = doctorResponse.data.data.doctor.id;
        const response = await API.get(`/doctors/${doctorId}/appointments`, { params: { limit: 6, sortBy: 'appointmentDate', sortOrder: 'DESC', _t: Date.now() } });
        return response.data.data.appointments;
      } else if (user?.role === 'admin') {
        const response = await API.get('/appointments', { params: { limit: 6, sortBy: 'appointmentDate', sortOrder: 'DESC', _t: Date.now() } });
        return response.data.data.appointments;
      }
      return [];
    },
    enabled: !!user?.id,
    staleTime: 0, gcTime: 0, refetchOnWindowFocus: true, refetchOnMount: true,
  });

  const currentStats = user?.role === 'admin' ? stats : user?.role === 'doctor' ? doctorStats : patientStats;
  const loading = user?.role === 'admin' ? isLoading : user?.role === 'doctor' ? doctorLoading : patientLoading;

  const statsCards = [
    { name: 'Total Appointments', value: currentStats?.totalAppointments || 0, icon: CalendarIcon, color: 'from-blue-600 to-indigo-600', iconColor: 'text-blue-600', bg: 'bg-blue-500/5' },
    { name: "Today's Appointments", value: currentStats?.todayAppointments || 0, icon: ClockIcon, color: 'from-emerald-600 to-teal-600', iconColor: 'text-emerald-600', bg: 'bg-emerald-500/5' },
    { name: 'Completed Appointments', value: currentStats?.completedAppointments || 0, icon: CheckCircleIcon, color: 'from-violet-600 to-purple-600', iconColor: 'text-violet-600', bg: 'bg-violet-500/5' },
    { name: 'Pending Appointments', value: currentStats?.pendingAppointments || 0, icon: ExclamationTriangleIcon, color: 'from-amber-600 to-orange-600', iconColor: 'text-amber-600', bg: 'bg-amber-500/5' },
  ];

  if (user?.role === 'admin' || user?.role === 'doctor') {
    statsCards.push({ name: 'Total Patients', value: currentStats?.totalPatients || 0, icon: UserGroupIcon, color: 'from-rose-600 to-pink-600', iconColor: 'text-rose-600', bg: 'bg-rose-500/5' });
  }

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
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Dashboard
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1]">
                  Welcome back,<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 animate-gradient-shift">
                    {user?.firstName} {user?.lastName}
                  </span>.
                </h1>
                <p className="text-slate-400 font-medium max-w-lg">
                  Integrative AI-powered healthcare management. Here's your clinical overview for today.
                </p>
              </div>

              <div className="hidden lg:flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                  <p className="text-lg font-black text-emerald-400">System Online</p>
                </div>
                <div className="w-px h-10 bg-white/10 mx-2" />
                <div className="flex -space-x-3 group cursor-pointer">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:translate-x-1 transition-transform">
                      {['AI','MD','RX','LB'][i]}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ═══ STATS GRID ═══ */}
        <div className={`grid grid-cols-1 md:grid-cols-2 ${statsCards.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-5`}>
          {statsCards.map((stat, i) => (
            <Reveal key={stat.name} delay={i * 0.1}>
              <div className="premium-card bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-20 h-20 ${stat.bg} rounded-bl-full opacity-50 group-hover:scale-110 transition-transform`} />
                <div className="flex flex-col h-full">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-6 border border-slate-50 shadow-inner group-hover:rotate-6 transition-transform`}>
                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{stat.name}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900 tracking-tight">{loading ? '...' : stat.value}</span>
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md">Live</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* ═══ CONTENT BENTO ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recent Appointments (Spans 2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            <Reveal>
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Activity</h3>
                <Link to="/app/appointments" className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 flex items-center gap-2 group">
                  See All <ChevronRightIcon className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 gap-4">
              {loading ? (
                [...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white/50 animate-pulse rounded-[28px] border border-slate-100" />)
              ) : recentAppointments?.length ? (
                recentAppointments.map((appt: any, i: number) => (
                  <Reveal key={appt.id} delay={i * 0.1}>
                    <div className="premium-card bg-white p-5 rounded-[28px] border border-slate-100 flex items-center justify-between group hover:border-indigo-100 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                          {user?.role === 'patient' 
                            ? `${appt.doctor?.user?.firstName?.[0]}${appt.doctor?.user?.lastName?.[0]}`
                            : `${appt.patient?.user?.firstName?.[0]}${appt.patient?.user?.lastName?.[0]}`
                          }
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 leading-tight">
                            {user?.role === 'patient' 
                              ? `Dr. ${appt.doctor?.user?.firstName} ${appt.doctor?.user?.lastName}`
                              : `${appt.patient?.user?.firstName} ${appt.patient?.user?.lastName}`
                            }
                          </h4>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" /> {new Date(appt.appointmentDate).toLocaleDateString()}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                              <ClockIcon className="h-3 w-3" /> {appt.appointmentTime}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          appt.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                          appt.status === 'confirmed' ? 'bg-blue-50 text-blue-600' :
                          appt.status === 'scheduled' ? 'bg-amber-50 text-amber-600' :
                          'bg-slate-50 text-slate-400'
                        }`}>
                          {appt.status}
                        </span>
                        <MagneticButton className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                          <ArrowRightIcon className="h-4 w-4" />
                        </MagneticButton>
                      </div>
                    </div>
                  </Reveal>
                ))
              ) : (
                <div className="bg-white rounded-[28px] border border-slate-100 p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-medium">No recent appointments found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & AI (Right Col) */}
          <div className="space-y-6">
            <Reveal delay={0.2}>
              <h3 className="text-xl font-black text-slate-900 tracking-tight px-2">Quick Actions</h3>
            </Reveal>

            <div className="space-y-4">
              {/* PRIMARY ACTION CARD */}
              {user?.role === 'patient' && (
                <Reveal delay={0.3}>
                  <button onClick={() => navigate('/find-doctors')}
                    className="w-full relative group overflow-hidden bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[32px] text-left shadow-xl shadow-indigo-200 transition-all active:scale-95">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
                    <SparklesIcon className="absolute bottom-6 right-6 h-20 w-20 text-white/5 opacity-40 group-hover:scale-125 transition-transform duration-700" />
                    <div className="relative z-10">
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform">
                        <MagnifyingGlassIcon className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="text-xl font-black text-white mb-2">Find Doctors</h4>
                      <p className="text-white/60 text-sm font-medium leading-relaxed">Search specialists, check chambers, and start your healing journey.</p>
                      <div className="mt-8 flex items-center gap-2 text-white text-xs font-black uppercase tracking-widest">
                        Launch <ArrowLongRightIcon className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                </Reveal>
              )}

              {/* SECONDARY ACTION LIST */}
              <div className="grid grid-cols-1 gap-4">
                {(user?.role === 'patient' ? [
                  { t: 'Book Appointment', h: '/app/appointments', i: CalendarIcon, c: 'text-rose-500', bg: 'bg-rose-50' },
                  { t: 'Medical Records', h: '/app/medical-records', i: DocumentTextIcon, c: 'text-cyan-500', bg: 'bg-cyan-50' },
                ] : user?.role === 'doctor' ? [
                  { t: 'Appointments', h: '/app/appointments', i: CalendarIcon, c: 'text-blue-500', bg: 'bg-blue-50' },
                  { t: 'Patient History', h: '/app/admin-patients', i: UserGroupIcon, c: 'text-emerald-500', bg: 'bg-emerald-50' },
                ] : [
                  { t: 'Manage Users', h: '/app/admin-users', i: UserGroupIcon, c: 'text-blue-500', bg: 'bg-blue-50' },
                  { t: 'All Appointments', h: '/app/appointments', i: CalendarIcon, c: 'text-emerald-500', bg: 'bg-emerald-50' },
                  { t: 'Lab & Analytics', h: '/app/admin-lab-tests', i: ChartBarIcon, c: 'text-purple-500', bg: 'bg-purple-50' },
                ]).map((action: any, idx: number) => (
                  <Reveal key={idx} delay={0.4 + idx * 0.1}>
                    <button onClick={() => navigate(action.h)}
                      className="w-full flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[24px] hover:border-indigo-100 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 ${action.bg} rounded-xl flex items-center justify-center`}>
                          <action.i className={`h-5 w-5 ${action.c}`} />
                        </div>
                        <span className="font-bold text-slate-800 text-sm">{action.t}</span>
                      </div>
                      <ChevronRightIcon className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
                    </button>
                  </Reveal>
                ))}
              </div>

              {/* AI INSIGHT CARD (Premium Look) */}
              <Reveal delay={0.6}>
                <div className="bg-slate-900 rounded-[32px] p-6 text-white overflow-hidden relative group">
                  <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-violet-500/20 rounded-full blur-[40px]" />
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/10 rounded-xl">
                      <CpuChipIcon className="h-4 w-4 text-cyan-400" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">AI Assistant</span>
                  </div>
                  <h5 className="font-bold mb-3">Instant Lab Analysis</h5>
                  <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6">Our LLaMA-3 engine can analyze your latest blood work instantly. Upload a PDF to begin.</p>
                  <button className="w-full py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                    Start AI Scan
                  </button>
                </div>
              </Reveal>
            </div>
          </div>
        </div>

        {/* ═══ MEDICINE TRACKER (Bottom Section) ═══ */}
        {user?.role === 'patient' && patientProfile?.id && (
          <Reveal delay={0.8}>
            <div className="pt-10">
              <div className="flex items-center gap-3 mb-8 px-2">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <BeakerIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Medicine Schedule</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Live Matrix View</p>
                </div>
              </div>
              <div className="premium-card bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-2xl shadow-indigo-200/20">
                <MedicineMatrix patientId={patientProfile.id} />
              </div>
            </div>
          </Reveal>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
