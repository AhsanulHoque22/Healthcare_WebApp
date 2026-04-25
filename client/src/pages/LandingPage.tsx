import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useScroll, AnimatePresence, useMotionValueEvent } from 'framer-motion';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from '../components/NotificationDropdown';
import { Reveal, fadeUp, staggerContainer, MagneticButton } from '../components/landing/AnimatedSection';
import { CaduceusStaff } from '../components/landing/CaduceusDecor';
import toast from 'react-hot-toast';
import {
  UserGroupIcon, CalendarIcon, DocumentTextIcon, BeakerIcon,
  ShieldCheckIcon, ClockIcon, CheckCircleIcon, StarIcon, PhoneIcon,
  EnvelopeIcon, MapPinIcon, ArrowRightIcon, SparklesIcon,
  ChartBarIcon, MicrophoneIcon, ChevronLeftIcon, ChevronRightIcon,
  VideoCameraIcon, ClipboardDocumentListIcon, BellAlertIcon,
  CpuChipIcon, DocumentMagnifyingGlassIcon,
  BuildingOffice2Icon, CurrencyDollarIcon, ArrowLongRightIcon
} from '@heroicons/react/24/outline';

/* ═══ DATA ═══ */
const stakeholders = [
  {
    label: "Patients",
    tagline: "Your health, one tap away.",
    features: [
      { icon: CalendarIcon, title: "Smart Appointment Booking", desc: "Find doctors by specialty, check real-time availability, and book with serial number confirmation." },
      { icon: DocumentTextIcon, title: "Digital Health Vault", desc: "Access your entire medical history — prescriptions, diagnoses, and lab results — in one secure timeline." },
      { icon: SparklesIcon, title: "AI Health Assistant", desc: "Describe symptoms to our AI chatbot and get instant triage, specialist recommendations, and appointment booking." },
      { icon: BeakerIcon, title: "Lab Test Management", desc: "Order lab tests, pay via bKash, track sample status, and download detailed result reports." },
      { icon: ClipboardDocumentListIcon, title: "Medicine Tracker", desc: "Stay on top of prescriptions with dose schedules, refill alerts, and a full medication history." },
      { icon: VideoCameraIcon, title: "Video Consultations", desc: "Connect face-to-face through integrated Jitsi video calls from any device." },
    ]
  },
  {
    label: "Doctors",
    tagline: "Run your practice, digitally.",
    features: [
      { icon: ClipboardDocumentListIcon, title: "Digital Prescriptions", desc: "Create structured prescriptions with medicines, dosages, lab orders, and lifestyle suggestions." },
      { icon: UserGroupIcon, title: "Patient Management", desc: "View complete histories, AI-generated clinical summaries, criticality flags, and past prescriptions." },
      { icon: MicrophoneIcon, title: "Voice Prescriptions", desc: "Dictate prescriptions hands-free. Our AI transcribes and structures into formatted data." },
      { icon: ChartBarIcon, title: "Analytics Dashboard", desc: "Track appointment stats, patient volume, completion rates, and earnings with visual charts." },
      { icon: CalendarIcon, title: "Appointment Workflow", desc: "Approve, reschedule, start, and complete appointments with a seamless multi-step pipeline." },
      { icon: StarIcon, title: "Ratings & Profile", desc: "Build reputation with patient ratings. Manage chambers, schedules, degrees, and fees." },
    ]
  },
  {
    label: "Hospitals",
    tagline: "Complete administrative control.",
    features: [
      { icon: BuildingOffice2Icon, title: "Admin Dashboard", desc: "Bird's-eye view of appointments, users, revenue, and real-time operational analytics." },
      { icon: ShieldCheckIcon, title: "Doctor Verification", desc: "Verify BMDC registration, review credentials, and manage onboarding of professionals." },
      { icon: CurrencyDollarIcon, title: "Lab Billing", desc: "Manage lab test pricing, process bKash/cash payments, track dues, and generate invoices." },
      { icon: BellAlertIcon, title: "Notifications", desc: "Automated alerts for appointments, lab results, and system events across all roles." },
      { icon: UserGroupIcon, title: "User Management", desc: "Full CRUD for patients, doctors, and admins with role-based access control." },
      { icon: DocumentMagnifyingGlassIcon, title: "AI Lab OCR", desc: "Automatic data extraction from uploaded lab reports, parsed into structured clinical records." },
    ]
  }
];

const aiCapabilities = [
  { icon: CpuChipIcon, title: "Clinical Intelligence", desc: "Analyzes patient histories and lab data to generate clinical narratives and flag critical conditions.", gradient: "from-violet-600 to-indigo-700", tag: "Groq LLaMA" },
  { icon: SparklesIcon, title: "Smart Triage", desc: "Understands symptoms, performs real-time triage, recommends specialists, and books appointments.", gradient: "from-blue-600 to-cyan-600", tag: "Chatbot AI" },
  { icon: DocumentMagnifyingGlassIcon, title: "Lab Report OCR", desc: "Extracts test values, reference ranges, and generates health insights from uploaded reports.", gradient: "from-emerald-600 to-teal-600", tag: "Tesseract + LLM" },
  { icon: MicrophoneIcon, title: "Voice-to-Rx", desc: "Doctors dictate prescriptions using voice. AI structures medicines, dosages, and instructions.", gradient: "from-pink-600 to-rose-600", tag: "Speech AI" },
];

const flowSteps = [
  { step: "01", title: "Create Your Account", desc: "Register as a patient, doctor, or admin. Doctors submit their BMDC registration and department for verification.", icon: UserGroupIcon, color: "from-slate-600 to-slate-800", who: "Everyone" },
  { step: "02", title: "Book an Appointment", desc: "Search verified doctors by specialty, pick their chamber and time slot, choose in-person, telemedicine, or follow-up — and receive a serial number confirmation.", icon: CalendarIcon, color: "from-blue-500 to-indigo-600", who: "Patient" },
  { step: "03", title: "Doctor Approves & Consults", desc: "Doctor reviews the request, approves or reschedules, then starts the consultation — in person or via Jitsi video call — and creates a structured digital prescription.", icon: ClipboardDocumentListIcon, color: "from-violet-500 to-purple-600", who: "Doctor" },
  { step: "04", title: "AI Analyzes Your Health", desc: "Our AI reads your full medical history, lab reports, and prescriptions to generate a clinical narrative, flag critical findings, and track health trends over time.", icon: CpuChipIcon, color: "from-emerald-500 to-teal-600", who: "AI Engine" },
  { step: "05", title: "Lab Tests & Results", desc: "Lab tests ordered via prescription or self-service. Pay with bKash, track sample collection status, and get AI-extracted insights from uploaded results.", icon: BeakerIcon, color: "from-amber-500 to-orange-600", who: "Patient + Admin" },
  { step: "06", title: "AI + Doctor Emergency Alert", desc: "As soon as a report is uploaded, AI analyzes it instantly, triggering real-time alerts for doctors and patients. Doctors can intervene for emergency actions, while patients receive immediate triggers via direct notifications and emails.", icon: BellAlertIcon, color: "from-red-500 to-rose-600", who: "AI + Doctor" },
  { step: "07", title: "Rate, Review & Continue", desc: "After each appointment, rate your doctor, view your prescription, set medicine reminders, and keep your entire health vault up to date.", icon: StarIcon, color: "from-pink-500 to-rose-600", who: "Patient" },
];
/* ═══ COMPONENT ═══ */
const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentDoctorSlide, setCurrentDoctorSlide] = useState(0);
  const [activeStakeholder, setActiveStakeholder] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, review: '' });
  const [navSolid, setNavSolid] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll();
  useMotionValueEvent(scrollYProgress, "change", (v) => setNavSolid(v > 0.02));

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
    let m = document.querySelector('meta[name="description"]');
    if (!m) { m = document.createElement('meta'); (m as HTMLMetaElement).name = 'description'; document.head.appendChild(m); }
    m.setAttribute("content", "Livora is a complete healthcare ecosystem. AI diagnostics, digital prescriptions, lab management, video consultations — all in one platform.");
  }, []);

  useEffect(() => {
    if (!availableDoctors?.length) return;
    const t = setInterval(() => setCurrentDoctorSlide(p => (p + 1) % availableDoctors.length), 5000);
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
    if (!user) { toast.error('Please sign in first'); return; }
    try {
      await API.post('/website-reviews', newReview);
      toast.success('Thank you for your review!');
      setShowReviewModal(false); setNewReview({ rating: 5, review: '' }); refetchReviews();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const reviews = websiteReviews && websiteReviews.length > 0 ? websiteReviews : [
    { user: { firstName: "Sarah", lastName: "J" }, review: "Livora changed how I manage my health. The AI assistant is incredibly helpful.", rating: 5 },
    { user: { firstName: "Dr. Ahmed", lastName: "K" }, review: "The digital prescription system saves me hours every day. Brilliant platform.", rating: 5 },
    { user: { firstName: "Emily", lastName: "R" }, review: "Getting my lab results instantly on the app is a game changer. Love it!", rating: 5 },
  ];
  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#fafbff] overflow-x-hidden landing-scroll selection:bg-indigo-100">

      {/* ═══ SCROLL PROGRESS BAR ═══ */}
      <motion.div className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-600 via-violet-500 to-blue-500 z-[200] origin-left" style={{ scaleX: scrollYProgress }} />

      {/* ═══ NAVBAR — Floating glassmorphism pill ═══ */}
      <motion.nav initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-700 ${navSolid ? 'py-2' : 'py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`rounded-[28px] h-[72px] flex items-center justify-between px-6 lg:px-8 transition-all duration-700 ${
            navSolid
              ? 'bg-white/70 backdrop-blur-2xl shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)] border border-white/60'
              : 'bg-white/30 backdrop-blur-xl border border-white/20'
          }`}>
            <Link to="/" className="flex items-center gap-2.5 group">
              <img src="/logo.png" className="h-11 w-11 group-hover:scale-110 transition-transform duration-500" alt="Livora" />
              <span className="text-xl font-black text-slate-900 tracking-[-0.04em] hidden sm:block">LIVORA</span>
            </Link>

            <div className="hidden lg:flex items-center gap-1">
              {[{l:'Doctors',id:'doctors'},{l:'Features',id:'features'},{l:'How it Works',id:'flow'},{l:'AI',id:'ai'},{l:'Reviews',id:'reviews'}].map(n => (
                <button key={n.id} onClick={() => document.getElementById(n.id)?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-[13px] font-semibold text-slate-500 hover:text-indigo-600 transition-all duration-300 px-4 py-2 rounded-xl hover:bg-indigo-50/50">{n.l}</button>
              ))}
              <Link to="/find-doctors" className="text-[13px] font-bold text-indigo-600 hover:text-indigo-800 transition-all duration-300 px-4 py-2 rounded-xl hover:bg-indigo-50/50 flex items-center gap-1.5">
                Find Doctors <SparklesIcon className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <NotificationDropdown />
                  <Link to={getDashboardUrl()} className="btn-premium bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-slate-900/20">
                    Dashboard <ArrowRightIcon className="h-3.5 w-3.5" />
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-semibold text-slate-600 px-4 py-2.5 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all duration-300">Sign In</Link>
                  <Link to="/register" className="btn-premium bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-300/40 hover:shadow-indigo-400/50 hover:brightness-110 transition-all active:scale-95">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.nav>
      {/* ═══ HERO — Immersive fullscreen with aurora bg ═══ */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Aurora mesh background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 -right-32 w-[700px] h-[700px] bg-gradient-to-bl from-indigo-200/50 via-violet-100/30 to-transparent rounded-full blur-[100px] animate-float-slow" />
          <div className="absolute bottom-1/4 -left-32 w-[600px] h-[600px] bg-gradient-to-tr from-blue-200/40 via-cyan-100/20 to-transparent rounded-full blur-[100px] animate-float-slow" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-violet-200/20 via-pink-100/10 to-transparent rounded-full blur-[120px] animate-aurora" />
          {/* Orbiting dots */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="animate-orbit"><div className="w-2 h-2 bg-indigo-400/30 rounded-full blur-[2px]" /></div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="animate-orbit-reverse"><div className="w-1.5 h-1.5 bg-violet-400/20 rounded-full blur-[1px]" /></div>
          </div>
          {/* Dot grid */}
          <div className="absolute inset-0 dot-grid opacity-40" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative pt-24">
          <Reveal variant="fadeUp" delay={0}>
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/60 backdrop-blur-xl text-indigo-700 rounded-full text-[11px] font-black uppercase tracking-[0.25em] mb-8 border border-indigo-100/50 shadow-sm animate-pulse-glow">
              <SparklesIcon className="h-4 w-4" />
              AI-Powered Healthcare Ecosystem
            </span>
          </Reveal>

          <Reveal variant="fadeUp" delay={1}>
            <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] lg:text-[7rem] font-black text-slate-900 heading-display mb-8">
              Healthcare{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 text-gradient animate-gradient-shift inline-block">
                Reimagined.
              </span>
            </h1>
          </Reveal>

          <Reveal variant="fadeUp" delay={2}>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-500 font-medium leading-relaxed mb-14">
              Connecting <strong className="text-slate-800">patients</strong>, <strong className="text-slate-800">doctors</strong>, and <strong className="text-slate-800">hospitals</strong> through 
              AI diagnostics, digital prescriptions, lab management, and video consultations — unified in one platform.
            </p>
          </Reveal>

          <Reveal variant="fadeUp" delay={3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link to="/register" className="group w-full sm:w-auto btn-premium bg-slate-900 text-white px-10 py-5 rounded-[20px] text-lg font-bold shadow-2xl shadow-slate-900/20 hover:bg-slate-800 hover:shadow-slate-900/30 transition-all active:scale-[0.97] flex items-center justify-center gap-3">
                Start Your Journey
                <ArrowLongRightIcon className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-500" />
              </Link>
              <Link to="/find-doctors" className="group w-full sm:w-auto bg-white/80 backdrop-blur-sm text-slate-900 px-10 py-5 rounded-[20px] text-lg font-bold border border-slate-200/80 shadow-lg shadow-slate-100/50 hover:shadow-xl hover:border-indigo-200 hover:bg-white transition-all active:scale-[0.97] flex items-center justify-center gap-3">
                <UserGroupIcon className="h-5 w-5 text-indigo-600 group-hover:scale-110 transition-transform" /> Find a Doctor
              </Link>
            </div>
          </Reveal>

          {/* Trust badges */}
          <Reveal variant="fadeUp" delay={4}>
            <div className="flex flex-wrap items-center justify-center gap-8 mt-20">
              {[
                { icon: ShieldCheckIcon, text: "HIPAA Compliant" },
                { icon: CheckCircleIcon, text: "BMDC Verified Doctors" },
                { icon: ClockIcon, text: "24/7 AI Support" },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm border border-slate-100/50">
                  <b.icon className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-slate-500 font-semibold">{b.text}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
      {/* ═══ SECTION DIVIDER ═══ */}
      <div className="section-divider" />

      {/* ═══ DOCTORS — Premium Carousel with glassmorphism cards ═══ */}
      <section id="doctors" className="py-32 bg-white relative overflow-hidden noise-overlay">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-50/50 to-transparent rounded-full blur-[100px]" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
            <Reveal className="max-w-2xl">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-5 border border-indigo-100">
                Our Specialists
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 heading-section mb-4">
                Elite Medical <span className="text-gradient bg-gradient-to-r from-indigo-600 to-violet-600">Specialists</span>
              </h2>
              <p className="text-lg text-slate-500 font-medium leading-relaxed">Verified professionals with BMDC registration, complete profiles, chamber schedules, and patient ratings.</p>
            </Reveal>
            <div className="flex gap-3">
              <MagneticButton onClick={() => setCurrentDoctorSlide(p => (availableDoctors && p > 0 ? p - 1 : 0))}
                className="w-14 h-14 rounded-2xl border-2 border-slate-200 flex items-center justify-center hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300">
                <ChevronLeftIcon className="h-5 w-5 text-slate-600" />
              </MagneticButton>
              <MagneticButton onClick={() => setCurrentDoctorSlide(p => (availableDoctors && p < availableDoctors.length - 1 ? p + 1 : p))}
                className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-indigo-600 transition-colors duration-300 shadow-lg shadow-slate-900/20">
                <ChevronRightIcon className="h-5 w-5" />
              </MagneticButton>
            </div>
          </div>

          <div className="relative overflow-hidden">
            <motion.div className="flex gap-6" animate={{ x: -(currentDoctorSlide * 372) }}
              transition={{ type: "spring", stiffness: 60, damping: 22 }}>
              {availableDoctors?.map((doc: any, idx: number) => (
                <motion.div key={doc.id} className="w-[348px] flex-shrink-0 bg-white rounded-[32px] p-5 group hover:shadow-[0_20px_60px_-15px_rgba(99,102,241,0.15)] transition-all duration-700 border border-slate-100 hover:border-indigo-100/60"
                  initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.05 }}>
                  <div className="relative mb-5 overflow-hidden rounded-[24px]">
                    <img src={doc.user?.profileImage || `https://ui-avatars.com/api/?name=${doc.user?.firstName}+${doc.user?.lastName}&background=4f46e5&color=fff&size=512`}
                      className="w-full aspect-[4/5] object-cover group-hover:scale-105 transition-transform duration-1000" alt={doc.user?.firstName} loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">
                      {doc.specialization || doc.department || "Specialist"}
                    </span>
                    {doc.averageRating && (
                      <span className="absolute bottom-4 right-4 bg-amber-400/90 backdrop-blur-md text-slate-900 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-sm">
                        <StarIcon className="h-3.5 w-3.5 fill-current" /> {doc.averageRating}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-1">Dr. {doc.user?.firstName} {doc.user?.lastName}</h3>
                  <p className="text-slate-500 font-medium text-sm mb-5 flex items-center gap-1.5">
                    <MapPinIcon className="h-3.5 w-3.5 text-indigo-500" /> {doc.hospital || "Livora Clinic"}
                  </p>
                  <button onClick={() => navigate(user ? `/app/appointments?doctor=${doc.id}` : '/login')}
                    className="w-full py-3.5 bg-slate-50 text-slate-800 rounded-2xl font-bold text-sm border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 group-hover:shadow-lg group-hover:shadow-indigo-200/50 transition-all duration-400">
                    Book Consultation
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </div>
          <div className="flex justify-center mt-12 gap-2">
            {availableDoctors?.slice(0, 10).map((_: any, i: number) => (
              <button key={i} onClick={() => setCurrentDoctorSlide(i)}
                className={`rounded-full transition-all duration-500 ${i === currentDoctorSlide ? 'w-10 h-2.5 bg-indigo-600 shadow-sm shadow-indigo-300' : 'w-2.5 h-2.5 bg-slate-200 hover:bg-slate-300'}`} />
            ))}
          </div>
        </div>
      </section>
      {/* ═══ HOW IT WORKS — Immersive Caduceus Journey ═══ */}
      <section id="flow" className="py-40 bg-slate-50 relative overflow-hidden">
        {/* Immersive backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-indigo-50/20 to-white pointer-events-none" />
        
        {/* Floating particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <motion.div key={i} className="absolute w-1 h-1 bg-indigo-500/10 rounded-full"
              initial={{ x: `${Math.random() * 100}%`, y: `${Math.random() * 100}%` }}
              animate={{ y: [null, `${Math.random() * 100}%`], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 10 + Math.random() * 20, repeat: Infinity, ease: "linear" }} />
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <Reveal className="text-center mb-32">
            <span className="inline-flex items-center gap-2 px-5 py-2 bg-red-500/10 text-red-500 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-6 border border-red-500/15">
              The Lifeline Process
            </span>
            <h2 className="text-5xl md:text-7xl font-black text-slate-900 heading-section mb-8">
              Guided <span className="text-red-500 italic">Medical</span> Journey.
            </h2>
          </Reveal>

          <div className="relative pt-20 min-h-[1200px]">
            {/* Central staff & serpents */}
            <div className="absolute inset-0 flex justify-center pointer-events-none overflow-visible">
              <CaduceusStaff />
            </div>

            <div className="space-y-40 md:space-y-0 relative z-10">
              {flowSteps.map((step, i) => {
                const isLeft = i % 2 === 0;
                return (
                  <div key={i} className={`md:flex items-center gap-12 md:min-h-[300px] ${isLeft ? '' : 'md:flex-row-reverse'}`}>
                    {/* Content card */}
                    <div className={`flex-1 ${isLeft ? 'md:text-right' : 'md:text-left'}`}>
                      <motion.div
                        initial={{ opacity: 0, x: isLeft ? -60 : 60, filter: 'blur(8px)' }}
                        whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as const }}
                        className={`inline-block group relative ${isLeft ? 'md:ml-auto' : ''}`}
                      >
                        {/* Glow behind card */}
                        <div className={`absolute -inset-4 bg-gradient-to-tr ${step.color} opacity-0 group-hover:opacity-[0.06] blur-2xl transition-opacity duration-700 rounded-[48px]`} />
                        
                        {/* Glassmorphism card */}
                        <div className="premium-card relative bg-white/80 backdrop-blur-md p-8 rounded-[36px] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-indigo-200/60 hover:shadow-[0_20px_60px_-15px_rgba(99,102,241,0.12)] hover:-translate-y-2 max-w-lg overflow-hidden">
                          <div className={`flex items-center gap-4 mb-6 ${isLeft ? 'md:justify-end' : ''}`}>
                            <div className={`p-4 rounded-2xl bg-gradient-to-tr ${step.color} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                              <step.icon className="h-6 w-6 text-white" />
                            </div>
                            <div className={isLeft ? 'md:text-right' : ''}>
                              <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-red-500 mb-1">Step {step.step}</span>
                              <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">{step.who}</span>
                            </div>
                          </div>
                          
                          <h3 className="text-2xl font-black text-slate-900 mb-4 group-hover:text-red-500 transition-colors duration-400">{step.title}</h3>
                          <p className="text-slate-500 font-medium text-base leading-relaxed">{step.desc}</p>
                          
                          {/* Connection line */}
                          <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent w-full ${isLeft ? 'left-full ml-6' : 'right-full mr-6'}`}>
                            <motion.div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_12px_#ef4444]"
                              animate={{ x: isLeft ? [0, 100] : [0, -100], opacity: [0, 1, 0] }}
                              transition={{ duration: 2.5, repeat: Infinity }} />
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Spacer */}
                    <div className="hidden md:block w-32 flex-shrink-0" />
                    <div className="flex-1 hidden md:block" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      {/* ═══ STAKEHOLDER FEATURES — Tabbed ═══ */}
      <section id="features" className="py-32 bg-white relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-50/40 to-transparent rounded-full blur-[100px]" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <Reveal className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-5 border border-blue-100">
              Platform Features
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 heading-section mb-6">
              Built for <span className="text-gradient bg-gradient-to-r from-indigo-600 to-violet-600">Everyone.</span>
            </h2>
            <p className="text-xl text-slate-500 max-w-3xl mx-auto font-medium">
              Patient, doctor, or administrator — Livora has you covered.
            </p>
          </Reveal>

          {/* Tabs */}
          <div className="flex justify-center mb-16">
            <div className="inline-flex bg-slate-50/80 backdrop-blur-sm rounded-[24px] p-1.5 border border-slate-100/80 shadow-sm">
              {stakeholders.map((s, i) => (
                <button key={i} onClick={() => setActiveStakeholder(i)}
                  className={`px-7 py-3.5 rounded-[20px] text-sm font-bold transition-all duration-400 flex items-center gap-2 ${
                    activeStakeholder === i ? 'bg-white text-slate-900 shadow-lg shadow-slate-200/50' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={activeStakeholder}
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -24, filter: 'blur(8px)' }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}>
              <p className="text-center text-xl font-semibold text-slate-500 mb-12 italic">{stakeholders[activeStakeholder].tagline}</p>
              <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={staggerContainer} initial="hidden" animate="visible">
                {stakeholders[activeStakeholder].features.map((f, i) => (
                  <motion.div key={f.title} variants={fadeUp} custom={i}
                    className="premium-card group p-8 rounded-[28px] bg-white border border-slate-100 hover:shadow-[0_20px_60px_-15px_rgba(99,102,241,0.12)] hover:border-indigo-100/60 transition-all duration-600 hover:-translate-y-2 cursor-default">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-400">
                      <f.icon className="h-6 w-6 text-indigo-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-3 group-hover:text-indigo-700 transition-colors duration-300">{f.title}</h3>
                    <p className="text-slate-500 font-medium leading-relaxed text-[14px]">{f.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
      {/* ═══ AI SHOWCASE — Dark section with glow effects ═══ */}
      <section id="ai" className="py-36 bg-[#0a0a1a] relative overflow-hidden">
        {/* Aurora backgrounds */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-indigo-600/[0.06] rounded-full blur-[180px] animate-float-slow" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-600/[0.06] rounded-full blur-[180px] animate-float-slow" style={{ animationDelay: '4s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-500/[0.04] rounded-full blur-[120px] animate-aurora" />
          <div className="absolute inset-0 animate-shimmer" />
          {/* Star field */}
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <Reveal className="text-center mb-24">
            <span className="inline-flex items-center gap-2 px-5 py-2 bg-white/[0.05] text-indigo-300 rounded-full text-[11px] font-black uppercase tracking-[0.25em] mb-8 border border-white/[0.08]">
              <CpuChipIcon className="h-4 w-4" /> Powered by LLaMA & Groq
            </span>
            <h2 className="text-5xl md:text-7xl font-black text-white heading-section mb-8">
              AI That <span className="text-gradient bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 italic animate-gradient-shift">Understands</span> Medicine.
            </h2>
            <p className="max-w-3xl mx-auto text-lg text-slate-400 font-medium leading-relaxed">
              Clinical-grade intelligence at every touchpoint — from symptom triage to lab analysis.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aiCapabilities.map((ai, i) => (
              <Reveal key={i} delay={i}>
                <div className="group relative p-8 md:p-10 rounded-[32px] glass-dark hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-700 glow-ring">
                  <div className="flex items-start gap-6">
                    <div className={`w-14 h-14 flex-shrink-0 bg-gradient-to-tr ${ai.gradient} rounded-[20px] flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
                      <ai.icon className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className="text-xl font-black text-white">{ai.title}</h3>
                        <span className="px-3 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[10px] font-black uppercase tracking-widest text-indigo-300">{ai.tag}</span>
                      </div>
                      <p className="text-slate-400 font-medium leading-relaxed text-[15px]">{ai.desc}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STATS — Gradient band ═══ */}
      <section className="py-28 bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-700 relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        {/* Floating light beam */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="w-[200px] h-[600px] bg-gradient-to-b from-transparent via-white/10 to-transparent animate-beam" />
        </div>
        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
            {[
              { label: "Patients Served", value: "10K+" },
              { label: "Verified Doctors", value: "500+" },
              { label: "Digital Prescriptions", value: "50K+" },
              { label: "Uptime SLA", value: "99.9%" }
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
                whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }} className="py-4">
                <div className="text-5xl md:text-6xl font-black tracking-tighter mb-3 animate-number-glow">{stat.value}</div>
                <div className="text-indigo-100/70 font-bold uppercase tracking-[0.2em] text-[11px]">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      {/* ═══ TESTIMONIALS ═══ */}
      <section id="reviews" className="py-32 bg-[#fafbff] relative">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-violet-50/40 to-transparent rounded-full blur-[100px]" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <Reveal className="text-center mb-16">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-5 border border-amber-100">
              Testimonials
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 heading-section mb-6">What People Say.</h2>
            <p className="text-lg text-slate-500 font-medium mb-8">Real stories from the Livora community.</p>
            {user && (
              <MagneticButton onClick={() => setShowReviewModal(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/60 hover:brightness-110 transition-all">
                <SparklesIcon className="h-5 w-5 mr-2" /> Write a Review
              </MagneticButton>
            )}
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.slice(0, 6).map((r: any, i: number) => (
              <Reveal key={i} delay={i}>
                <div className="premium-card bg-white p-8 rounded-[28px] border border-slate-100 shadow-sm hover:shadow-[0_20px_60px_-15px_rgba(99,102,241,0.1)] hover:border-indigo-100/50 transition-all duration-600 hover:-translate-y-2">
                  <div className="flex gap-0.5 mb-5">
                    {[...Array(r.rating || 5)].map((_: any, j: number) => <StarIcon key={j} className="h-4 w-4 text-amber-400 fill-current" />)}
                  </div>
                  <p className="text-[15px] text-slate-600 font-medium mb-6 leading-relaxed">"{r.review}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-xl flex items-center justify-center font-black text-indigo-600 text-xs">
                      {r.user?.firstName?.[0]}{r.user?.lastName?.[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{r.user?.firstName} {r.user?.lastName}</h4>
                      <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-widest flex items-center gap-1">
                        <CheckCircleIcon className="h-3 w-3 text-emerald-500" /> Verified
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA — Premium dark section ═══ */}
      <section className="py-36 bg-[#0a0a1a] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-600/[0.08] rounded-full blur-[180px]" />
          <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-violet-500/[0.05] rounded-full blur-[100px] animate-float-slow" />
        </div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <Reveal>
            <h2 className="text-4xl md:text-6xl font-black text-white heading-section mb-8">
              Ready to Experience the <span className="text-gradient bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400 animate-gradient-shift">Future?</span>
            </h2>
            <p className="text-lg text-slate-400 font-medium mb-14 max-w-2xl mx-auto leading-relaxed">Join thousands of patients, doctors, and healthcare institutions already using Livora.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link to="/register" className="group btn-premium bg-white text-slate-900 px-10 py-5 rounded-[20px] text-lg font-bold shadow-2xl shadow-white/5 hover:shadow-white/10 transition-all active:scale-[0.97] flex items-center gap-3">
                Create Free Account <ArrowLongRightIcon className="h-5 w-5 group-hover:translate-x-2 transition-transform duration-500" />
              </Link>
              <Link to="/find-doctors" className="border-2 border-white/10 text-white px-10 py-5 rounded-[20px] text-lg font-bold hover:bg-white/[0.04] hover:border-white/20 transition-all duration-400 active:scale-[0.97]">
                Browse Doctors
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#0a0a1a] pt-8 pb-16 text-white border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 border-b border-white/[0.04] pb-12">
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" className="h-10 w-10" alt="Livora" />
                <span className="text-lg font-black tracking-[-0.04em]">LIVORA</span>
              </div>
              <p className="text-slate-400 font-medium text-sm leading-relaxed">Complete AI-powered healthcare ecosystem for patients, doctors, and hospitals.</p>
            </div>
            {[
              { title: 'Platform', links: [{t:'Find Doctors',h:'/find-doctors'},{t:'Patient Portal',h:'/register'},{t:'Doctor Portal',h:'/register'},{t:'Admin Panel',h:'/login'}] },
              { title: 'Features', links: [{t:'AI Assistant'},{t:'Prescriptions'},{t:'Lab Management'},{t:'Video Calls'}] },
              { title: 'Contact', links: [{t:'info@livora-health.app', icon: EnvelopeIcon},{t:'+880 1234-567890', icon: PhoneIcon},{t:'Dhaka, Bangladesh', icon: MapPinIcon}] },
            ].map((col, ci) => (
              <div key={ci} className="space-y-5">
                <h4 className="font-black text-[11px] uppercase tracking-[0.25em] text-slate-300">{col.title}</h4>
                <ul className="space-y-3.5 text-slate-400 font-medium text-sm">
                  {col.links.map((l: any, li) => (
                    <li key={li} className="flex items-center gap-2 hover:text-indigo-400 transition-colors duration-300 cursor-pointer">
                      {l.icon && <l.icon className="h-3.5 w-3.5 flex-shrink-0" />}
                      {l.h ? <Link to={l.h}>{l.t}</Link> : l.t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em]">
            <p>© 2026 Livora Health. All Rights Reserved.</p>
            <div className="flex items-center gap-2"><ShieldCheckIcon className="h-4 w-4 text-emerald-500" /> HIPAA Compliant · Encrypted</div>
          </div>
        </div>
      </footer>

      {/* ═══ REVIEW MODAL ═══ */}
      <AnimatePresence>
        {showReviewModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setShowReviewModal(false)}>
            <motion.div initial={{ scale: 0.9, y: 20, filter: 'blur(4px)' }} animate={{ scale: 1, y: 0, filter: 'blur(0px)' }} exit={{ scale: 0.9, y: 20, filter: 'blur(4px)' }}
              className="bg-white rounded-[28px] p-8 md:p-10 max-w-lg w-full shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-2xl font-black text-slate-900 mb-6">Write a Review</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-5">
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">Rating</label>
                  <div className="flex gap-1.5">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} type="button" onClick={() => setNewReview(p => ({...p, rating: s}))}
                        className={`p-1.5 rounded-lg transition-all hover:scale-110 ${newReview.rating >= s ? 'text-amber-400' : 'text-slate-300'}`}>
                        <StarIcon className="h-7 w-7 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-slate-700 block mb-2">Your Review</label>
                  <textarea value={newReview.review} onChange={e => setNewReview(p => ({...p, review: e.target.value}))}
                    className="w-full rounded-2xl border border-slate-200 p-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-none transition-all"
                    rows={4} placeholder="Share your experience..." required />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 btn-premium bg-slate-900 text-white py-3.5 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-[0.97]">Submit</button>
                  <button type="button" onClick={() => setShowReviewModal(false)} className="px-6 py-3.5 rounded-2xl font-bold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-all">Cancel</button>
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
