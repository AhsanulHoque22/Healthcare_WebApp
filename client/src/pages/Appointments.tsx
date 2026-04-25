import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import API from '../api/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CalendarIcon, ClockIcon, UserIcon, PlusIcon, DocumentTextIcon, StarIcon, VideoCameraIcon,
  FunnelIcon, XMarkIcon, EyeIcon, XCircleIcon, SparklesIcon, ArrowPathIcon, ChevronDownIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import PrescriptionView from '../components/PrescriptionView';
import RatingModal from '../components/RatingModal';
import VideoConsultation from '../components/VideoConsultation';
import { getDepartmentLabel } from '../utils/departments';
import { Reveal } from '../components/landing/AnimatedSection';

const Appointments: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [prescriptionData, setPrescriptionData] = useState<any>(null);
  const [bookingForm, setBookingForm] = useState({
    doctorId: '', appointmentDate:'', timeBlock: '', type: 'in_person', reason: '', symptoms: '', chamber: ''
  });
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [availableTimeBlocks, setAvailableTimeBlocks] = useState<Array<{value: string, label: string}>>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [appointmentRatings, setAppointmentRatings] = useState<{[key: number]: number}>({});

  const { data: appointmentsData, refetch: refetchAppointments } = useQuery({
    queryKey: ['patient-appointments', user?.id],
    queryFn: async () => {
      const response = await API.get('/appointments');
      return response.data.data.appointments || [];
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const { data: patientRatingsData } = useQuery({
    queryKey: ['patient-ratings', user?.id],
    queryFn: async () => {
      const response = await API.get('/ratings/my-ratings');
      return response.data.data.ratings || [];
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (patientRatingsData) {
      const ratingMap: {[key: number]: number} = {};
      patientRatingsData.forEach((rating: any) => ratingMap[rating.appointmentId] = rating.rating);
      setAppointmentRatings(ratingMap);
    }
  }, [patientRatingsData]);

  const appointments = (appointmentsData || [])
    .filter((apt: any) => {
      if (statusFilter !== 'all' && apt.status !== statusFilter) return false;
      if (typeFilter !== 'all' && apt.type !== typeFilter) return false;
      if (doctorFilter !== 'all' && apt.doctorId.toString() !== doctorFilter) return false;
      return true;
    }).sort((a: any, b: any) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());

  const uniqueDoctors = Array.from(new Map(
    (appointmentsData || []).filter((apt: any) => apt.doctor).map((apt: any) => [
      apt.doctorId, { id: apt.doctorId, name: `Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`, department: apt.doctor.department }
    ])
  ).values());

  const getAvailableTimeBlocks = (doctorId: string) => {
    const doctor = doctors.find((d: any) => d.id.toString() === doctorId);
    if (!doctor) return [];
    const times: Array<{value: string, label: string}> = [];
    const selectedDate = bookingForm.appointmentDate ? new Date(bookingForm.appointmentDate) : new Date();
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

    if (doctor.chambers && doctor.chambers.length > 0) {
      let dayHasTimes = false;
      doctor.chambers.forEach((chamber: any) => {
        const cTimes = chamber.chamberTimes || {};
        if (cTimes[dayOfWeek] && Array.isArray(cTimes[dayOfWeek])) {
          cTimes[dayOfWeek].forEach((time: string) => {
             const chamberName = chamber.name || 'Additional Chamber';
             times.push({ value: `${chamberName}|${time}`, label: `${chamberName} - ${time}` });
             dayHasTimes = true;
          });
        }
      });
      if (!dayHasTimes) {
        doctor.chambers.forEach((chamber: any) => {
          const cTimes = chamber.chamberTimes || {};
          Object.keys(cTimes).forEach((day: string) => {
            if (Array.isArray(cTimes[day])) {
              cTimes[day].forEach((time: string) => {
                 const chamberName = chamber.name || 'Additional Chamber';
                 times.push({ value: `${chamberName}|${time}`, label: `${chamberName} - ${time} (${day})` });
              });
            }
          });
        });
      }
    }

    if (doctor.chamberTimes && Object.keys(doctor.chamberTimes).length > 0) {
       const chamberTimes = doctor.chamberTimes;
       const baseChamberName = doctor.hospital || "Main Chamber";
       
       if (chamberTimes[dayOfWeek] && Array.isArray(chamberTimes[dayOfWeek])) {
         chamberTimes[dayOfWeek].forEach((time: string) => {
           times.push({ value: `${baseChamberName}|${time}`, label: `${baseChamberName} - ${time}` });
         });
       } else if (times.length === 0) {
         Object.keys(chamberTimes).forEach((day: string) => {
           if (Array.isArray(chamberTimes[day])) {
             chamberTimes[day].forEach((time: string) => {
               times.push({ value: `${baseChamberName}|${time}`, label: `${baseChamberName} - ${time} (${day})` });
             });
           }
         });
       }
    }
    return times;
  };

  const fetchDoctors = async () => {
    try {
      const response = await API.get('/doctors');
      const filtered = response.data.data.doctors.filter((doctor: any) => 
        (doctor.chamberTimes && Object.keys(doctor.chamberTimes).length > 0) || (doctor.chambers && doctor.chambers.length > 0)
      );
      setDoctors(filtered);
    } catch (error) {}
  };

  const getPatientId = async () => {
    try {
      const response = await API.get('/patients/profile');
      return response.data.data.patient.id;
    } catch { return null; }
  };

  const handleBookingSubmit = async () => {
    setIsLoading(true);
    try {
      const patientId = await getPatientId();
      if (!patientId) return toast.error('Unable to identify patient profile');
      await API.post('/appointments', { ...bookingForm, patientId, duration: 180 });
      toast.success('Appointment booked successfully!');
      setShowBookingModal(false);
      setBookingForm({ doctorId: '', appointmentDate: '', timeBlock: '', type: 'in_person', reason: '', symptoms: '', chamber: '' });
      await refetchAppointments();
      queryClient.invalidateQueries({ queryKey: ['patient-dashboard-stats'] });
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to book'); } 
    finally { setIsLoading(false); }
  };

  const handleViewAppointment = async (appointment: any) => {
    setSelectedAppointment(appointment); setShowViewModal(true);
    if (appointment.status === 'completed' || appointment.status === 'in_progress') {
      try {
        const response = await API.get(`/prescriptions/appointment/${appointment.id}`);
        setPrescriptionData(response.data.data.prescription);
      } catch { setPrescriptionData(null); }
    } else { setPrescriptionData(null); }
  };

  const handleCancelAppointment = async (appointmentId: number, appointmentDate: string) => {
    const apptDate = new Date(appointmentDate); apptDate.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    if (apptDate.getTime() <= today.getTime()) return toast.error('Can only cancel before scheduled date.');
    if (window.confirm('Are you sure you want to cancel?')) {
      try {
        await API.put(`/appointments/${appointmentId}/cancel`);
        toast.success('Cancelled successfully!'), refetchAppointments();
        queryClient.invalidateQueries({ queryKey: ['patient-dashboard-stats'] });
      } catch (e: any) { toast.error('Failed to cancel'); }
    }
  };

  const handleRescheduleClick = (appointment: any) => {
    const apptDate = new Date(appointment.appointmentDate); apptDate.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    if (apptDate.getTime() <= today.getTime()) return toast.error('Can only reschedule before scheduled date.');
    setSelectedAppointment(appointment);
    setBookingForm({ ...bookingForm, doctorId: appointment.doctorId.toString(), type: appointment.type, reason: appointment.reason || '', symptoms: appointment.symptoms || '', chamber: appointment.chamber || '', appointmentDate: '', timeBlock: '' });
    fetchDoctors(); setShowRescheduleModal(true);
  };

  const parseTimeBlock = (timeBlockStr: string) => {
    try {
      const timePart = timeBlockStr.split('|')[1] || timeBlockStr;
      const firstPart = timePart.split('-')[0].trim();
      const [time, meridiem] = firstPart.split(' ');
      let [hours, minutes] = time.split(':');
      let h = parseInt(hours);
      if (meridiem === 'PM' && h < 12) h += 12;
      if (meridiem === 'AM' && h === 12) h = 0;
      return `${h.toString().padStart(2, '0')}:${(minutes || '00').padStart(2, '0')}`;
    } catch { return '09:00'; }
  };

  const handleRescheduleSubmit = async () => {
    setIsLoading(true);
    try {
      await API.put(`/appointments/${selectedAppointment.id}/reschedule`, {
        appointmentDate: bookingForm.appointmentDate, appointmentTime: parseTimeBlock(bookingForm.timeBlock), duration: 180
      });
      toast.success('Reschedule request submitted!'); setShowRescheduleModal(false); await refetchAppointments();
    } catch (e: any) { toast.error('Failed to reschedule'); } 
    finally { setIsLoading(false); }
  };

  const handleRateAppointment = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowRatingModal(true);
  };

  const handleVideoCall = (appointment: any) => {
    setSelectedAppointment(appointment);
    setShowVideoModal(true);
  };

  useEffect(() => {
    const doctorId = searchParams.get('doctorId');
    if (doctorId) { setBookingForm(prev => ({ ...prev, doctorId })); setShowBookingModal(true); fetchDoctors(); }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#fafbff] noise-overlay relative font-sans">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* PREMIUM MASTER HEADER */}
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-slate-900 px-8 py-12 md:px-14 text-white shadow-2xl group">
            <div className="absolute top-0 right-0 w-1/3 h-full">
              <div className="absolute inset-0 bg-gradient-to-l from-indigo-500/10 via-transparent to-transparent" />
              <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-400/10 rounded-full blur-[80px]" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">Clinical Operations</span>
                  <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-400/20">Scheduling Matrix</span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
                  Appointment <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 animate-gradient-shift italic">Registry.</span>
                </h1>
                <p className="text-slate-400 font-medium max-w-xl text-lg">
                  Coordinate your care with precision. Manage existing clinical sessions or request new consultations seamlessly.
                </p>
              </div>
              
              <button onClick={() => { setShowBookingModal(true); fetchDoctors(); }}
                className="group relative overflow-hidden px-8 py-5 bg-indigo-600 rounded-[24px] text-white font-black uppercase tracking-widest shadow-xl hover:shadow-indigo-500/20 active:scale-95 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 flex items-center gap-3 text-sm">
                  <PlusIcon className="h-5 w-5" /> Book Consultation
                </span>
              </button>
            </div>
          </div>
        </Reveal>

        {/* STATUS BAR / FILTERS */}
        <Reveal delay={0.1}>
          <div className="bg-white rounded-[24px] border border-slate-100 p-2 shadow-sm flex flex-col md:flex-row items-center gap-2">
            <div className="w-full md:w-auto p-4 md:px-6 md:border-r border-slate-100 flex items-center gap-3 shrink-0">
              <FunnelIcon className="h-5 w-5 text-indigo-600" />
              <span className="font-black text-xs text-slate-900 uppercase tracking-widest">Filter Matrix</span>
              {appointments.length > 0 && <span className="ml-2 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black">{appointments.length} Total</span>}
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-2 px-2">
              <div className="relative">
                <select value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 placeholder-slate-400 text-slate-900 text-xs font-bold px-5 py-4 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all appearance-none outline-none">
                  <option value="all">Any Doctor</option>
                  {uniqueDoctors.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <ChevronDownIcon className="absolute right-4 top-4 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 placeholder-slate-400 text-slate-900 text-xs font-bold px-5 py-4 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all appearance-none outline-none">
                  <option value="all">Any Status</option>
                  <option value="requested">Requested</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <ChevronDownIcon className="absolute right-4 top-4 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 placeholder-slate-400 text-slate-900 text-xs font-bold px-5 py-4 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all appearance-none outline-none">
                  <option value="all">Any Type</option>
                  <option value="in_person">In Person</option>
                  <option value="telemedicine">Telemedicine</option>
                  <option value="follow_up">Follow Up</option>
                </select>
                <ChevronDownIcon className="absolute right-4 top-4 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
            
            {(statusFilter !== 'all' || typeFilter !== 'all' || doctorFilter !== 'all') && (
              <button onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setDoctorFilter('all'); }}
                className="md:mr-2 px-5 py-4 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all shrink-0">
                Clear
              </button>
            )}
          </div>
        </Reveal>

        {/* APPOINTMENT GRID */}
        <div className="space-y-4">
          {appointments.length === 0 ? (
            <Reveal delay={0.2}>
              <div className="bg-white rounded-[32px] border border-slate-100 p-16 text-center shadow-sm">
                <div className="w-24 h-24 bg-indigo-50 rounded-3xl mx-auto flex items-center justify-center mb-6">
                  <CalendarIcon className="h-10 w-10 text-indigo-500" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">No Active Appointments</h3>
                <p className="text-slate-400 font-medium mb-8">Schedule your first consultation to get started with a specialist.</p>
                <button onClick={() => { setShowBookingModal(true); fetchDoctors(); }}
                  className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">
                  Book Now
                </button>
              </div>
            </Reveal>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {appointments.map((apt: any, i: number) => {
                const isPast = ['completed', 'cancelled'].includes(apt.status);
                const sColor = 
                  apt.status === 'requested' ? 'amber' :
                  apt.status === 'scheduled' ? 'blue' :
                  apt.status === 'confirmed' ? 'emerald' :
                  apt.status === 'in_progress' ? 'violet' :
                  apt.status === 'completed' ? 'slate' : 'rose';
                  
                return (
                  <Reveal key={apt.id} delay={0.15 + (i * 0.05)}>
                    <div className="bg-white rounded-[24px] border border-slate-100 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group">
                      
                      <div className="flex gap-6 items-start md:items-center w-full md:w-auto">
                        <div className={`w-16 h-16 shrink-0 rounded-[20px] flex flex-col items-center justify-center bg-${isPast ? 'slate' : 'indigo'}-50 border border-${isPast ? 'slate' : 'indigo'}-100`}>
                          <span className={`text-[10px] font-black uppercase tracking-widest text-${isPast ? 'slate' : 'indigo'}-400 mb-0.5`}>
                            {new Date(apt.appointmentDate).toLocaleDateString('en-US', { month: 'short' })}
                          </span>
                          <span className={`text-2xl font-black text-${isPast ? 'slate' : 'indigo'}-600 leading-none`}>
                            {new Date(apt.appointmentDate).getDate()}
                          </span>
                        </div>
                        
                        <div className="space-y-2 flex-col">
                          <h4 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                            Dr. {apt.doctor?.user?.firstName} {apt.doctor?.user?.lastName}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
                            <span className="flex items-center text-[10px] font-bold text-slate-400 tracking-wider"><ClockIcon className="h-3.5 w-3.5 mr-1" />{apt.appointmentTime}</span>
                            <span className="flex items-center text-[10px] font-bold text-slate-400 tracking-wider capitalize"><DocumentTextIcon className="h-3.5 w-3.5 mr-1" />{apt.type.replace('_', ' ')}</span>
                            {apt.chamber && <span className="flex items-center text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">Chamber: {apt.chamber}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto pl-[88px] md:pl-0">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-${sColor}-50 text-${sColor}-600 border border-${sColor}-100`}>
                          {apt.status.replace('_', ' ')}
                        </span>
                        
                        <button onClick={() => handleViewAppointment(apt)}
                          className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-indigo-50 border border-slate-100 text-slate-400 hover:text-indigo-600 transition-all hover:scale-110">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        
                        {apt.status === 'completed' && (
                          <button onClick={() => handleRateAppointment(apt)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 ${appointmentRatings[apt.id] ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-500 hover:text-amber-600 border border-amber-100'}`}>
                            <StarIcon className="h-4 w-4" />
                          </button>
                        )}

                        {apt.type === 'telemedicine' && ['confirmed', 'in_progress'].includes(apt.status) && (
                          <button onClick={() => handleVideoCall(apt)}
                            className="h-10 px-4 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100">
                            <VideoCameraIcon className="h-4 w-4" /> Join Room
                          </button>
                        )}
                        
                        {['requested', 'scheduled', 'confirmed'].includes(apt.status) && (
                          <>
                            <button onClick={() => handleRescheduleClick(apt)}
                              className="h-10 px-4 bg-white text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all border border-slate-200">
                              Reschedule
                            </button>
                            <button onClick={() => handleCancelAppointment(apt.id, apt.appointmentDate)}
                              className="w-10 h-10 rounded-xl bg-white flex items-center justify-center hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 transition-all hover:scale-110">
                              <XCircleIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* BOoKING MODAL / RESCHEDULE MODAL */}
      <AnimatePresence>
        {(showBookingModal || showRescheduleModal) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-white/20">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    {showRescheduleModal ? <ArrowPathIcon className="h-6 w-6 text-indigo-600" /> : <CalendarIcon className="h-6 w-6 text-indigo-600" />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">{showRescheduleModal ? 'Reschedule Appointment' : 'Book Consultation'}</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scheduling interface</p>
                  </div>
                </div>
                <button onClick={() => { setShowBookingModal(false); setShowRescheduleModal(false); }} className="p-2 text-slate-400 hover:text-slate-900 bg-white rounded-xl shadow-sm border border-slate-100 transition-all hover:scale-110">
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto overflow-x-hidden scrollbar-none">
                <form onSubmit={(e) => { e.preventDefault(); showRescheduleModal ? handleRescheduleSubmit() : handleBookingSubmit(); }} className="space-y-6">
                  {!showRescheduleModal && (
                    <div className="space-y-1.5 focus-within:relative z-20">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Specialist</label>
                      <select value={bookingForm.doctorId} onChange={e => { setBookingForm({...bookingForm, doctorId: e.target.value, timeBlock: ''}); setAvailableTimeBlocks(getAvailableTimeBlocks(e.target.value)); }} required
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all">
                        <option value="">Choose a doctor</option>
                        {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.user.firstName} {d.user.lastName} — {getDepartmentLabel(d.department)}</option>)}
                      </select>
                    </div>
                  )}

                  {showRescheduleModal && selectedAppointment && (
                    <div className="mb-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                      <p className="text-xs text-indigo-800 font-medium">Rescheduling <strong className="font-black">Dr. {selectedAppointment.doctor.user.firstName} {selectedAppointment.doctor.user.lastName}</strong><br/>Original: {new Date(selectedAppointment.appointmentDate).toLocaleDateString()} at {selectedAppointment.appointmentTime}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Requested Date</label>
                      <input type="date" value={bookingForm.appointmentDate} onChange={e => { setBookingForm({...bookingForm, appointmentDate: e.target.value, timeBlock: ''}); setAvailableTimeBlocks(getAvailableTimeBlocks(bookingForm.doctorId)); }} required min={new Date(Date.now() + (showRescheduleModal ? 86400000 : 0)).toISOString().split('T')[0]}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Available Chamber Time</label>
                      <select value={`${bookingForm.chamber}|${bookingForm.timeBlock}`} onChange={e => { const val = e.target.value; if(val && val !== '|') { const [chamber, timeBlock] = val.split('|'); setBookingForm({...bookingForm, chamber: chamber, timeBlock: timeBlock}); } }} required disabled={!bookingForm.doctorId || !bookingForm.appointmentDate}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all disabled:opacity-50">
                        <option value="|">{(!bookingForm.doctorId) ? 'Select doctor first' : (!bookingForm.appointmentDate) ? 'Select date first' : 'Select a time block'}</option>
                        {availableTimeBlocks.map((block) => (<option key={block.value} value={block.value}>{block.label}</option>))}
                      </select>
                    </div>
                  </div>

                  {!showRescheduleModal && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Consultation Mode</label>
                        <select value={bookingForm.type} onChange={e => setBookingForm({...bookingForm, type: e.target.value})}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none flex-1">
                          <option value="in_person">In-Person Consultation</option><option value="telemedicine">Tele-Medicine Virtual Room</option><option value="follow_up">Follow-Up Session</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Reason</label>
                        <input type="text" value={bookingForm.reason} onChange={e => setBookingForm({...bookingForm, reason: e.target.value})} placeholder="E.g. Annual checkup..."
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Medical Symptoms</label>
                        <textarea value={bookingForm.symptoms} onChange={e => setBookingForm({...bookingForm, symptoms: e.target.value})} placeholder="Describe your symptoms in detail..." rows={3}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none" />
                      </div>
                    </>
                  )}

                  <div className="flex gap-4 pt-4 shrink-0">
                    <button type="submit" disabled={isLoading || !bookingForm.appointmentDate || !bookingForm.timeBlock}
                      className="flex-1 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50">
                      {isLoading ? 'Processing...' : (showRescheduleModal ? 'Confirm Reschedule' : 'Submit Booking')}
                    </button>
                    <button type="button" onClick={() => { setShowBookingModal(false); setShowRescheduleModal(false); }} className="px-8 py-4 border border-slate-200 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showViewModal && selectedAppointment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex justify-center items-center"><DocumentTextIcon className="h-6 w-6"/></div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Clinical Dossier</h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Appointment #{selectedAppointment.serialNumber}</p>
                  </div>
                </div>
                <button onClick={() => setShowViewModal(false)} className="p-2 text-slate-400 hover:text-slate-900 bg-white shadow-sm border border-slate-100 rounded-xl hover:scale-110 transition-all"><XMarkIcon className="h-5 w-5" /></button>
              </div>
              
              <div className="p-8 overflow-y-auto overflow-x-hidden space-y-10 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-indigo-500"/> Patient Record</h3>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                      <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-400">Name</span><span className="text-sm font-black text-slate-900">{selectedAppointment.patient?.user?.firstName} {selectedAppointment.patient?.user?.lastName}</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-400">Email</span><span className="text-sm font-black text-slate-900">{selectedAppointment.patient?.user?.email}</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-400">Phone</span><span className="text-sm font-black text-slate-900">{selectedAppointment.patient?.user?.phone || '—'}</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-400">Status</span>
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-lg">{selectedAppointment.status.replace('_',' ')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"/> Schedule Detail</h3>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                      <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-400">Specialist</span><span className="text-sm font-black text-slate-900">Dr. {selectedAppointment.doctor?.user?.firstName} {selectedAppointment.doctor?.user?.lastName}</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-400">Date</span><span className="text-sm font-black text-slate-900">{new Date(selectedAppointment.appointmentDate).toLocaleDateString()}</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-400">Time</span><span className="text-sm font-black text-slate-900">{selectedAppointment.appointmentTime}</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm font-bold text-slate-400">Mode</span><span className="text-sm font-black text-slate-900 capitalize">{selectedAppointment.type.replace('_',' ')}</span></div>
                    </div>
                  </div>
                </div>

                {prescriptionData && (
                  <div className="pt-8 border-t border-slate-100">
                    <PrescriptionView prescriptionData={prescriptionData} appointmentData={selectedAppointment} userRole={user?.role} />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRatingModal && selectedAppointment && <RatingModal isOpen={showRatingModal} onClose={() => setShowRatingModal(false)} appointment={selectedAppointment} onRatingSubmitted={() => { refetchAppointments(); queryClient.invalidateQueries({ queryKey: ['patient-ratings', user?.id] }); }} />}
        {showVideoModal && selectedAppointment && <VideoConsultation isOpen={showVideoModal} onClose={() => setShowVideoModal(false)} appointmentId={selectedAppointment.id} doctorName={`Dr. ${selectedAppointment.doctor.user.firstName} ${selectedAppointment.doctor.user.lastName}`} patientName={`${selectedAppointment.patient.user.firstName} ${selectedAppointment.patient.user.lastName}`} userEmail={user?.email || ''} userRole="patient" />}
      </AnimatePresence>

    </div>
  );
};
export default Appointments;
