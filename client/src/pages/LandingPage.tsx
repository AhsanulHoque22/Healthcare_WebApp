import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from '../components/NotificationDropdown';
import toast from 'react-hot-toast';
import { 
  HeartIcon, UserGroupIcon, CalendarIcon, DocumentTextIcon, BeakerIcon, 
  ShieldCheckIcon, ClockIcon, CheckCircleIcon, StarIcon, PhoneIcon, 
  EnvelopeIcon, MapPinIcon, ArrowRightIcon, PlayIcon, SparklesIcon, 
  ChatBubbleLeftRightIcon, ChartBarIcon, AcademicCapIcon, 
  MicrophoneIcon, ChevronLeftIcon, ChevronRightIcon,
  VideoCameraIcon, ClipboardDocumentListIcon, BellAlertIcon,
  CpuChipIcon, DocumentMagnifyingGlassIcon, UserCircleIcon,
  ArrowPathIcon, BuildingOffice2Icon, CurrencyDollarIcon
} from '@heroicons/react/24/outline';

/* ─── Shared animation variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] } })
};

const LandingPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentDoctorSlide, setCurrentDoctorSlide] = useState(0);
  const [activeStakeholder, setActiveStakeholder] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, review: '' });
  
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });

  const { data: availableDoctors } = useQuery({
    queryKey: ['available-doctors-public'],
    queryFn: async () => { const r = await API.get('/doctors', { params: { limit: 12 } }); return r.data.data.doctors; }
  });

  const { data: websiteReviews, refetch: refetchReviews } = useQuery({
    queryKey: ['website-reviews'],
    queryFn: async () => { const r = await API.get('/website-reviews/public'); return r.data.data.reviews; }
  });

  useEffect(() => {
    document.title = "Livora | AI-Powered Healthcare Platform for Patients, Doctors & Hospitals";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); (meta as HTMLMetaElement).name = 'description'; document.head.appendChild(meta); }
    meta.setAttribute("content", "Livora is a complete healthcare ecosystem. AI-powered diagnostics, digital prescriptions, lab management, video consultations, and hospital administration — all in one platform.");
  }, []);

  // Auto-rotate doctors
  useEffect(() => {
    if (!availableDoctors?.length) return;
    const t = setInterval(() => setCurrentDoctorSlide(p => (p + 1) % availableDoctors.length), 4000);
    return () => clearInterval(t);
  }, [availableDoctors]);

  const getDashboardUrl = () => {
    switch (user?.role) {
      case 'patient': return '/app/dashboard';
      case 'doctor': return '/app/doctor-dashboard';
      case 'admin': return '/app/admin-dashboard';
      default: return '/app/dashboard';
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Please sign in to write a review'); return; }
    try {
      await API.post('/website-reviews', newReview);
      toast.success('Thank you for your review!');
      setShowReviewModal(false);
      setNewReview({ rating: 5, review: '' });
      refetchReviews();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed to submit review'); }
  };

  /* ─── Stakeholder feature sets ─── */
  const stakeholders = [
    {
      label: "For Patients",
      tagline: "Your health, one tap away.",
      features: [
        { icon: CalendarIcon, title: "Smart Appointment Booking", desc: "Find doctors by specialty, check real-time availability, and book with serial number confirmation." },
        { icon: DocumentTextIcon, title: "Digital Health Vault", desc: "Access your entire medical history — prescriptions, diagnoses, and lab results — in one secure timeline." },
        { icon: SparklesIcon, title: "AI Health Assistant", desc: "Describe symptoms to our AI chatbot and get instant triage, specialist recommendations, and appointment booking." },
        { icon: BeakerIcon, title: "Lab Test Management", desc: "Order lab tests, pay via bKash, track sample status, and download detailed result reports." },
        { icon: ClipboardDocumentListIcon, title: "Medicine Tracker & Reminders", desc: "Stay on top of your prescriptions with dose schedules, refill alerts, and a full medication history." },
        { icon: VideoCameraIcon, title: "Video Consultations", desc: "Connect with your doctor face-to-face through integrated Jitsi video calls from any device." },
      ]
    },
    {
      label: "For Doctors",
      tagline: "Run your practice, digitally.",
      features: [
        { icon: ClipboardDocumentListIcon, title: "Digital Prescription System", desc: "Create structured prescriptions with medicines, dosages, lab orders, and lifestyle suggestions in a beautiful template." },
        { icon: UserGroupIcon, title: "Patient Management", desc: "View complete patient histories, AI-generated clinical summaries, criticality flags, and past prescriptions at a glance." },
        { icon: MicrophoneIcon, title: "Voice Prescription Assistant", desc: "Dictate prescriptions hands-free. Our AI transcribes and structures your voice into formatted prescription data." },
        { icon: ChartBarIcon, title: "Analytics Dashboard", desc: "Track appointment stats, patient volume, completion rates, and earnings with rich visual charts." },
        { icon: CalendarIcon, title: "Appointment Workflow", desc: "Approve, reschedule, start, and complete appointments with a seamless multi-step status pipeline." },
        { icon: StarIcon, title: "Ratings & Profile", desc: "Build your online reputation with patient ratings. Manage chambers, schedules, degrees, and consultation fees." },
      ]
    },
    {
      label: "For Hospitals",
      tagline: "Complete administrative control.",
      features: [
        { icon: BuildingOffice2Icon, title: "Admin Dashboard & Analytics", desc: "Bird's-eye view of appointments, users, revenue, and real-time operational analytics with interactive charts." },
        { icon: ShieldCheckIcon, title: "Doctor Verification", desc: "Verify BMDC registration, review credentials, and manage the onboarding of new medical professionals." },
        { icon: CurrencyDollarIcon, title: "Lab Billing & Payments", desc: "Manage lab test pricing, process bKash/cash payments, track dues, and generate professional invoices." },
        { icon: BellAlertIcon, title: "Notification System", desc: "Automated alerts for appointments, lab results, prescription updates, and system events across all user roles." },
        { icon: UserGroupIcon, title: "User & Role Management", desc: "Full CRUD for patients, doctors, and admins with role-based access control and permission boundaries." },
        { icon: DocumentMagnifyingGlassIcon, title: "AI Lab Report Extraction", desc: "Automatic OCR-based data extraction from uploaded lab reports, parsed into structured clinical records." },
      ]
    }
  ];

  const aiCapabilities = [
    { icon: CpuChipIcon, title: "Clinical Intelligence Engine", desc: "Powered by Groq LLaMA, our AI analyzes patient histories and lab data to generate clinical narratives, identify trends, and flag critical conditions.", gradient: "from-violet-600 to-indigo-700" },
    { icon: SparklesIcon, title: "Smart Symptom Triage", desc: "The AI chatbot understands natural language symptoms, performs real-time triage, recommends specialists, and can directly book appointments.", gradient: "from-blue-600 to-cyan-600" },
    { icon: DocumentMagnifyingGlassIcon, title: "Lab Report OCR & Analysis", desc: "Upload any lab report — our AI uses Tesseract OCR and LLM parsing to extract test values, reference ranges, and generate health insights.", gradient: "from-emerald-600 to-teal-600" },
    { icon: MicrophoneIcon, title: "Voice-to-Prescription", desc: "Doctors can dictate prescriptions using voice. Our speech-to-text AI automatically structures medicines, dosages, and instructions.", gradient: "from-pink-600 to-rose-600" },
  ];

  return (
    <div ref={containerRef} className="relative min-h-screen bg-slate-50 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* ═══════════ NAVBAR ═══════════ */}
      <nav className="fixed top-0 left-0 right-0 z-[100]">
        <motion.div initial={{ y: -100 }} animate={{ y: 0 }} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-white/70 backdrop-blur-2xl border border-white/40 shadow-2xl shadow-indigo-100/50 rounded-3xl h-20 flex items-center justify-between px-8">
            <Link to="/" className="flex items-center gap-2 group">
              <img src="/logo.png" className="h-14 w-14" alt="Livora Logo" />
              <span className="text-2xl font-black text-slate-900 tracking-tighter">LIVORA</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              {[{l:'Doctors',id:'doctors'},{l:'Features',id:'stakeholders'},{l:'AI',id:'ai-tech'},{l:'Reviews',id:'reviews'}].map(n => (
                <button key={n.id} onClick={() => document.getElementById(n.id)?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-widest">{n.l}</button>
              ))}
              <Link to="/find-doctors" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-widest flex items-center gap-1">
                Find Doctors <SparklesIcon className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <NotificationDropdown />
                  <Link to={getDashboardUrl()} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95">
                    Dashboard <ArrowRightIcon className="h-4 w-4" />
                  </Link>
                  <button onClick={() => logout()} className="text-sm font-bold text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1">
                    <ArrowPathIcon className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-bold text-slate-900 px-4 py-2">Sign In</Link>
                  <Link to="/register" className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-95">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative pt-44 pb-20 px-4 overflow-hidden">
        <motion.div style={{ y: useTransform(scrollYProgress, [0, 0.2], [0, -120]) }}
          className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-gradient-to-bl from-indigo-100/60 via-blue-50/30 to-transparent rounded-full blur-3xl" />
        <motion.div style={{ y: useTransform(scrollYProgress, [0, 0.2], [0, 120]) }}
          className="absolute bottom-0 -left-20 -z-10 w-[600px] h-[600px] bg-gradient-to-tr from-purple-100/50 via-indigo-50/20 to-transparent rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto text-center relative">
          <motion.div initial="hidden" animate="visible" variants={fadeUp}>
            <span className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8 border border-indigo-100">
              <SparklesIcon className="h-4 w-4 animate-pulse" />
              Complete Healthcare Ecosystem
            </span>
            <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tight leading-[0.9] mb-8">
              Healthcare <br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">Reimagined.</span>
            </h1>
            <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-500 font-medium leading-relaxed mb-12">
              Livora connects <strong className="text-slate-800">patients</strong>, <strong className="text-slate-800">doctors</strong>, and <strong className="text-slate-800">hospitals</strong> with 
              AI-powered diagnostics, digital prescriptions, lab management, video consultations, and a complete administrative suite — all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/register" className="w-full sm:w-auto bg-slate-900 text-white px-10 py-5 rounded-3xl text-lg font-black shadow-2xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3 group">
                Start Your Journey <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/find-doctors" className="w-full sm:w-auto bg-white text-slate-900 px-10 py-5 rounded-3xl text-lg font-black border border-slate-200 shadow-sm hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3">
                <UserGroupIcon className="h-6 w-6 text-indigo-600" /> Find a Doctor
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ TOP DOCTORS SLIDESHOW (Upper Section) ═══════════ */}
      <section id="doctors" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                Elite Medical <span className="text-indigo-600">Specialists</span>
              </h2>
              <p className="text-lg text-slate-500 font-medium">Verified professionals with BMDC registration, complete profiles, chamber schedules, and patient ratings.</p>
            </motion.div>
            <div className="flex gap-4">
              <button onClick={() => setCurrentDoctorSlide(p => (availableDoctors && p > 0 ? p - 1 : 0))}
                className="w-14 h-14 rounded-2xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90">
                <ChevronLeftIcon className="h-6 w-6 text-slate-900" />
              </button>
              <button onClick={() => setCurrentDoctorSlide(p => (availableDoctors && p < availableDoctors.length - 1 ? p + 1 : p))}
                className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-all active:scale-90">
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden">
            <motion.div className="flex gap-8" animate={{ x: -(currentDoctorSlide * 382) }}
              transition={{ type: "spring", stiffness: 80, damping: 20 }}>
              {availableDoctors?.map((doc: any) => (
                <div key={doc.id} className="w-[350px] flex-shrink-0 bg-slate-50 rounded-[40px] p-6 group hover:bg-white hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 border border-transparent hover:border-indigo-100">
                  <div className="relative mb-6 overflow-hidden rounded-[32px]">
                    <img src={doc.user?.profileImage || `https://ui-avatars.com/api/?name=${doc.user?.firstName}+${doc.user?.lastName}&background=4f46e5&color=fff&size=512`}
                      className="w-full aspect-[4/5] object-cover group-hover:scale-110 transition-transform duration-700" alt={doc.user?.firstName} />
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-md text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/50">
                        {doc.specialization || doc.department || "Specialist"}
                      </span>
                    </div>
                    {doc.averageRating && (
                      <div className="absolute bottom-4 right-4 bg-yellow-400/90 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1">
                        <StarIcon className="h-3.5 w-3.5 fill-current" /> {doc.averageRating}
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-1">Dr. {doc.user?.firstName} {doc.user?.lastName}</h3>
                  <p className="text-slate-500 font-bold text-sm mb-6 flex items-center gap-1.5">
                    <MapPinIcon className="h-4 w-4 text-indigo-500" /> {doc.hospital || "Livora Clinic"}
                  </p>
                  <button onClick={() => navigate(user ? `/app/appointments?doctor=${doc.id}` : '/login')}
                    className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shadow-sm">
                    Book Consultation
                  </button>
                </div>
              ))}
            </motion.div>
          </div>
          {/* Pagination dots */}
          <div className="flex justify-center mt-10 gap-2">
            {availableDoctors?.slice(0, 8).map((_: any, i: number) => (
              <button key={i} onClick={() => setCurrentDoctorSlide(i)}
                className={`h-2 rounded-full transition-all duration-500 ${i === currentDoctorSlide ? 'w-10 bg-indigo-600' : 'w-2 bg-slate-200 hover:bg-slate-300'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ STAKEHOLDER FEATURES (Tabbed Presentation) ═══════════ */}
      <section id="stakeholders" className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">
              Built for <span className="text-indigo-600">Everyone.</span>
            </h2>
            <p className="text-xl text-slate-500 max-w-3xl mx-auto font-medium">
              Whether you're a patient managing your health, a doctor running your practice, or an administrator overseeing operations — Livora has you covered.
            </p>
          </motion.div>

          {/* Stakeholder Tabs */}
          <div className="flex justify-center mb-16">
            <div className="inline-flex bg-white rounded-3xl p-2 shadow-lg shadow-slate-200/50 border border-slate-100">
              {stakeholders.map((s, i) => (
                <button key={i} onClick={() => setActiveStakeholder(i)}
                  className={`px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${
                    activeStakeholder === i 
                      ? 'bg-slate-900 text-white shadow-xl' 
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Features Grid with animation */}
          <AnimatePresence mode="wait">
            <motion.div key={activeStakeholder} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
              <p className="text-center text-2xl font-bold text-slate-700 mb-12 italic">{stakeholders[activeStakeholder].tagline}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {stakeholders[activeStakeholder].features.map((f, i) => (
                  <motion.div key={f.title} custom={i} initial="hidden" animate="visible" variants={fadeUp}
                    className="bg-white p-10 rounded-[36px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 hover:-translate-y-2 group">
                    <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-indigo-600 transition-colors duration-300">
                      <f.icon className="h-7 w-7 text-indigo-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-3">{f.title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed text-sm">{f.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ═══════════ AI TECHNOLOGY SHOWCASE ═══════════ */}
      <section id="ai-tech" className="py-32 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-24">
            <span className="inline-flex items-center gap-2 px-5 py-2 bg-white/5 text-indigo-300 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8 border border-white/10">
              <CpuChipIcon className="h-4 w-4" /> Powered by LLaMA & Groq
            </span>
            <h2 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[0.9] mb-8">
              AI That <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent italic">Understands</span> Medicine.
            </h2>
            <p className="max-w-3xl mx-auto text-xl text-slate-400 font-medium leading-relaxed">
              Our proprietary AI pipeline combines Large Language Models with Computer Vision to deliver clinical-grade intelligence at every touchpoint.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {aiCapabilities.map((ai, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} custom={i} variants={fadeUp}
                className="relative group p-10 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-500">
                <div className={`w-16 h-16 bg-gradient-to-tr ${ai.gradient} rounded-[24px] flex items-center justify-center mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
                  <ai.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-white mb-4">{ai.title}</h3>
                <p className="text-slate-400 font-medium leading-relaxed">{ai.desc}</p>
                <div className="flex flex-wrap gap-3 mt-8">
                  {["Clinical Grade", "HIPAA Ready", "Real-time"].map(tag => (
                    <span key={tag} className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest">{tag}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ STATS ═══════════ */}
      <section className="py-28 bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-700 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center text-white">
            {[
              { label: "Patients Served", value: "10K+" },
              { label: "Verified Doctors", value: "500+" },
              { label: "Digital Prescriptions", value: "50K+" },
              { label: "Uptime SLA", value: "99.9%" }
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.5 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="space-y-4">
                <div className="text-5xl md:text-6xl font-black tracking-tighter">{stat.value}</div>
                <div className="text-indigo-100 font-bold uppercase tracking-widest text-xs">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section id="reviews" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-6">What People Say.</h2>
            <p className="text-xl text-slate-500 font-medium mb-8">Real stories from the Livora community.</p>
            {user && (
              <button onClick={() => setShowReviewModal(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all">
                <SparklesIcon className="h-5 w-5 mr-2" /> Write a Review
              </button>
            )}
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(websiteReviews && websiteReviews.length > 0 ? websiteReviews : [
              { user: { firstName: "Sarah", lastName: "J" }, review: "Livora changed how I manage my health. The AI assistant is incredibly helpful.", rating: 5 },
              { user: { firstName: "Dr. Ahmed", lastName: "K" }, review: "The digital prescription system saves me hours every day. Brilliant platform.", rating: 5 },
              { user: { firstName: "Emily", lastName: "R" }, review: "Getting my lab results instantly on the app is a game changer. Love it!", rating: 5 },
            ]).slice(0, 6).map((r: any, i: number) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} variants={fadeUp}
                className="bg-slate-50 p-10 rounded-[36px] relative hover:shadow-xl transition-all duration-500">
                <div className="flex gap-1 mb-6">
                  {[...Array(r.rating || 5)].map((_: any, j: number) => <StarIcon key={j} className="h-5 w-5 text-yellow-500 fill-current" />)}
                </div>
                <p className="text-lg text-slate-700 font-medium mb-8 leading-relaxed italic">"{r.review}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center font-black text-indigo-600 text-sm">
                    {r.user?.firstName?.[0]}{r.user?.lastName?.[0]}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900">{r.user?.firstName} {r.user?.lastName}</h4>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Verified User</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className="py-32 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-8">
              Ready to Experience the <span className="text-indigo-400">Future?</span>
            </h2>
            <p className="text-xl text-slate-400 font-medium mb-12">Join thousands of patients, doctors, and healthcare institutions already using Livora.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/register" className="bg-white text-slate-900 px-10 py-5 rounded-3xl text-lg font-black shadow-2xl hover:shadow-indigo-200/20 transition-all active:scale-95 flex items-center gap-3 group">
                Create Free Account <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/find-doctors" className="border-2 border-white/20 text-white px-10 py-5 rounded-3xl text-lg font-black hover:bg-white/10 transition-all active:scale-95 flex items-center gap-3">
                Browse Doctors
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-slate-950 py-20 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 border-b border-white/10 pb-16">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <img src="/logo.png" className="h-12 w-12" alt="Livora Logo" />
                <span className="text-xl font-black tracking-tighter">LIVORA</span>
              </div>
              <p className="text-slate-400 font-medium text-sm leading-relaxed">Complete AI-powered healthcare ecosystem for patients, doctors, and hospital administrators.</p>
            </div>
            <div className="space-y-6">
              <h4 className="font-black text-xs uppercase tracking-[0.2em]">Platform</h4>
              <ul className="space-y-3 text-slate-400 font-medium text-sm">
                <li><Link to="/find-doctors" className="hover:text-indigo-400 transition-colors">Find Doctors</Link></li>
                <li><Link to="/register" className="hover:text-indigo-400 transition-colors">Patient Portal</Link></li>
                <li><Link to="/register" className="hover:text-indigo-400 transition-colors">Doctor Portal</Link></li>
                <li><Link to="/login" className="hover:text-indigo-400 transition-colors">Admin Dashboard</Link></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="font-black text-xs uppercase tracking-[0.2em]">Features</h4>
              <ul className="space-y-3 text-slate-400 font-medium text-sm">
                <li>AI Health Assistant</li>
                <li>Digital Prescriptions</li>
                <li>Lab Management</li>
                <li>Video Consultations</li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="font-black text-xs uppercase tracking-[0.2em]">Contact</h4>
              <ul className="space-y-3 text-slate-400 font-medium text-sm">
                <li className="flex items-center gap-2"><EnvelopeIcon className="h-4 w-4" /> info@livora-health.app</li>
                <li className="flex items-center gap-2"><PhoneIcon className="h-4 w-4" /> +880 1234-567890</li>
                <li className="flex items-center gap-2"><MapPinIcon className="h-4 w-4" /> Dhaka, Bangladesh</li>
              </ul>
            </div>
          </div>
          <div className="pt-10 flex flex-col md:flex-row items-center justify-between gap-8 text-slate-500 font-bold text-xs uppercase tracking-widest">
            <p>© 2026 Livora Health. All Rights Reserved.</p>
            <div className="flex items-center gap-2"><ShieldCheckIcon className="h-4 w-4 text-green-500" /> HIPAA Compliant · Encrypted Data</div>
          </div>
        </div>
      </footer>

      {/* ═══════════ REVIEW MODAL ═══════════ */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowReviewModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
              className="bg-white rounded-[32px] p-10 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-2xl font-black text-slate-900 mb-6">Write a Review</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-6">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-3">Rating</label>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} type="button" onClick={() => setNewReview(p => ({...p, rating: s}))}
                        className={`p-2 rounded-xl transition-all ${newReview.rating >= s ? 'text-yellow-500' : 'text-slate-300'}`}>
                        <StarIcon className="h-8 w-8 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-3">Your Review</label>
                  <textarea value={newReview.review} onChange={e => setNewReview(p => ({...p, review: e.target.value}))}
                    className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={4} placeholder="Share your experience..." required />
                </div>
                <div className="flex gap-4">
                  <button type="submit" className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-slate-800 transition-all active:scale-95">Submit</button>
                  <button type="button" onClick={() => setShowReviewModal(false)} className="px-8 py-4 rounded-2xl font-black text-slate-500 border border-slate-200 hover:bg-slate-50 transition-all">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LandingPage;
