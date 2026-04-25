import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useScroll, AnimatePresence, useMotionValueEvent } from 'framer-motion';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from '../components/NotificationDropdown';
import { Reveal, MagneticButton } from '../components/landing/AnimatedSection';
import { CaduceusStaff } from '../components/landing/CaduceusDecor';
import toast from 'react-hot-toast';
import {
  UserGroupIcon, CalendarIcon, DocumentTextIcon, BeakerIcon,
  ShieldCheckIcon, ClockIcon, CheckCircleIcon, StarIcon, PhoneIcon,
  EnvelopeIcon, MapPinIcon, ArrowRightIcon, SparklesIcon,
  ChartBarIcon, MicrophoneIcon, ChevronLeftIcon, ChevronRightIcon,
  VideoCameraIcon, ClipboardDocumentListIcon, BellAlertIcon,
  CpuChipIcon, DocumentMagnifyingGlassIcon,
  BuildingOffice2Icon, CurrencyDollarIcon, ArrowLongRightIcon, CommandLineIcon
} from '@heroicons/react/24/outline';

const stakeholders = [
  {
    label: "Patients",
    tagline: "Your health, decentralized and effortless.",
    features: [
      { icon: CalendarIcon, title: "Smart Scheduling", desc: "Real-time availability with verified serial confirmation and clinical priority triage." },
      { icon: DocumentTextIcon, title: "Health Dossier", desc: "Access your lifelong medical records — prescriptions, lab forensics, and AI insights — in one vault." },
      { icon: SparklesIcon, title: "Neural Assistant", desc: "Instant clinical triage and specialist matching via our HIPAA-compliant AI engine." },
      { icon: BeakerIcon, title: "Pharma Matrix", desc: "Manage medications with visual dose schedules, refill alerts, and adherence analytics." },
      { icon: VideoCameraIcon, title: "Virtual Clinic", desc: "High-fidelity video consultations with integrated clinical toolsets for seamless remote care." },
      { icon: DocumentMagnifyingGlassIcon, title: "Diagnostic Vault", desc: "Order lab tests, pay securely via digital gateways, and receive AI-parsed result narratives." },
    ]
  },
  {
    label: "Doctors",
    tagline: "Clinical workflows, accelerated by AI.",
    features: [
      { icon: ClipboardDocumentListIcon, title: "Digital Rx Engine", desc: "Create structured prescriptions with intelligent dosage suggestions and lab correlations." },
      { icon: UserGroupIcon, title: "Patient Intelligence", desc: "View clinical narratives, AI criticality flags, and comprehensive longitudinal health data." },
      { icon: MicrophoneIcon, title: "Voice Diagnostics", desc: "Dictate prescriptions hands-free. AI transcribes and structures medical data in real-time." },
      { icon: ChartBarIcon, title: "Practice Analytics", desc: "Deep-dive into performance metrics, patient demographics, and automated revenue tracking." },
      { icon: CalendarIcon, title: "Dynamic Workflow", desc: "Manage appointments through a seamless pipeline from approval to clinical completion." },
      { icon: StarIcon, title: "Trust Reputation", desc: "Build authority through verified patient ratings and a high-fidelity professional profile." },
    ]
  },
  {
    label: "Hospitals",
    tagline: "Total institutional governance.",
    features: [
      { icon: BuildingOffice2Icon, title: "Admin Ecosystem", desc: "Bird's-eye control over verify operations, user matrices, and financial throughput." },
      { icon: ShieldCheckIcon, title: "Officer Verification", desc: "Onboard professionals with BMDC registry verification and credential automation." },
      { icon: CurrencyDollarIcon, title: "Lab Operations", desc: "Manage test pricing, process multi-modal payments, and generate automated invoices." },
      { icon: BellAlertIcon, title: "Global Sync", desc: "Automated event-driven notifications cascading across all institutional roles." },
      { icon: UserGroupIcon, title: "Permission Layers", desc: "Granular role-based access control ensuring data sovereignty and security." },
      { icon: CommandLineIcon, title: "Auto-OCR Pipeline", desc: "Institutional-scale data extraction from legacy reports into structured EHR formats." },
    ]
  }
];

const aiCapabilities = [
  { icon: CpuChipIcon, title: "Clinical Narratives", desc: "Generates human-readable summaries from complex lab forensics and patient histories.", gradient: "from-indigo-600 to-violet-700", tag: "Groq LLaMA 3" },
  { icon: SparklesIcon, title: "Active Triage", desc: "Analyzes symptoms to recommend specialists and book appointments with zero latency.", gradient: "from-blue-600 to-cyan-500", tag: "Neural Engine" },
  { icon: DocumentMagnifyingGlassIcon, title: "Vision OCR", desc: "High-accuracy extraction of clinical markers and reference ranges from static reports.", gradient: "from-emerald-600 to-teal-500", tag: "Diagnostic Vision" },
  { icon: MicrophoneIcon, title: "Audio Semantics", desc: "Converts medical dictation into structured JSON prescriptions with clinical precision.", gradient: "from-rose-600 to-pink-500", tag: "Speech-to-Rx" },
];

const flowSteps = [
  { step: "01", title: "Identity Creation", desc: "Initialize your clinical profile. Professionals undergo BMDC verification for institutional trust.", icon: UserGroupIcon, color: "from-slate-600 to-slate-900", who: "Omni-Role" },
  { step: "02", title: "Protocol Selection", desc: "Navigate the specialist matrix, select chamber slots, and receive a secure confirmation vector.", icon: CalendarIcon, color: "from-indigo-500 to-blue-600", who: "Patient" },
  { step: "03", title: "Clinical Interface", desc: "Consult via virtual link or in-person. Doctors generate high-fidelity digital prescriptions.", icon: ClipboardDocumentListIcon, color: "from-violet-500 to-indigo-600", who: "Medical Officer" },
  { step: "04", title: "Neural Synthesis", desc: "AI performs deep-history analysis to flag critical findings and generate longitudinal health narratives.", icon: CpuChipIcon, color: "from-emerald-500 to-teal-600", who: "AI Core" },
  { step: "05", title: "Diagnostic Chain", desc: "Execute lab tests via digital order. Pay securely, track samples, and receive real-time result alerts.", icon: BeakerIcon, color: "from-amber-500 to-orange-600", who: "Facility" },
  { step: "06", title: "Emergency Triage", desc: "Instant AI analysis of results triggers cascading alerts to doctors and patients for critical intervention.", icon: BellAlertIcon, color: "from-rose-500 to-red-600", who: "Critical Core" },
  { step: "07", title: "Cycle Continuum", desc: "Rate the session, set dosage reminders, and maintain your health vault for continuous care.", icon: StarIcon, color: "from-pink-500 to-rose-600", who: "Patient" },
];

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
    document.title = "Livora | Elite AI-Powered Healthcare Ecosystem";
  }, []);

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
    if (!user) { toast.error('Authentication Required'); return; }
    try {
      await API.post('/website-reviews', newReview);
      toast.success('Dossier updated with your review');
      setShowReviewModal(false); setNewReview({ rating: 5, review: '' }); refetchReviews();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Operation Failed'); }
  };

  const reviews = websiteReviews && websiteReviews.length > 0 ? websiteReviews : [
    { user: { firstName: "Sarah", lastName: "X" }, review: "Livora has fundamentally transformed my clinical experience. The AI diagnostics are precise.", rating: 5 },
    { user: { firstName: "Dr. Ahmed", lastName: "V" }, review: "The digital Rx workflow is the most optimized system I've used in a decade of practice.", rating: 5 },
  ];

  return (
    <div ref={containerRef} className="relative min-h-screen bg-[#fafbff] selection:bg-indigo-500 selection:text-white noise-overlay overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none dot-grid opacity-[0.15]" />
      
      {/* ═══ NAVBAR ═══ */}
      <motion.nav initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 left-0 right-0 z-[100] px-4 py-6 transition-all duration-700 ${navSolid ? 'translate-y-[-10px]' : ''}`}>
        <div className="max-w-7xl mx-auto">
          <div className={`rounded-[32px] h-[80px] flex items-center justify-between px-8 border transition-all duration-700 ${
            navSolid ? 'bg-white/80 backdrop-blur-2xl shadow-2xl border-white/20' : 'bg-transparent border-transparent'
          }`}>
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/10">
                <SparklesIcon className="h-6 w-6 text-indigo-400" />
              </div>
              <span className="text-xl font-bold tracking-tighter text-slate-900">LIVORA</span>
            </Link>

            <div className="hidden lg:flex items-center gap-2">
              {[{l:'Specialists',id:'doctors'},{l:'Features',id:'features'},{l:'Protocol',id:'flow'},{l:'Intelligence',id:'ai'}].map(n => (
                <button key={n.id} onClick={() => document.getElementById(n.id)?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-indigo-600 transition-all">{n.l}</button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <NotificationDropdown />
                  <Link to={getDashboardUrl()} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/10 hover:bg-indigo-600 transition-all">Portal</Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-semibold text-slate-600 px-4 py-2.5 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all duration-300">Sign In</Link>
                  <Link to="/register" className="px-7 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:scale-[1.02] transition-all">Initialize</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ═══ HERO ═══ */}
      <section className="relative h-screen flex items-center justify-center px-4 overflow-hidden pt-20">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[10%] right-[5%] w-[800px] h-[800px] bg-indigo-500/[0.04] rounded-full blur-[120px] animate-aurora" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-violet-600/[0.03] rounded-full blur-[100px] animate-float-slow" />
        </div>

        <div className="max-w-[1400px] mx-auto text-center relative">
          <Reveal>
            <div className="inline-flex items-center gap-2.5 px-6 py-2.5 bg-white/40 backdrop-blur-md border border-white/40 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-10 shadow-sm">
               <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
               Clinical Intelligence Protocol V4.2
            </div>
          </Reveal>

          <Reveal>
            <h1 className="text-[6vw] md:text-[8rem] font-black leading-[0.85] text-slate-900 tracking-tighter mb-10">
              Health, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-400 italic animate-gradient-shift">Synchronized.</span>
            </h1>
          </Reveal>

          <Reveal>
            <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 font-medium leading-relaxed mb-16">
              The elite clinical ecosystem built to synchronize patients, medical officers, and health institutions via longitudinal AI diagnostics and secure neural networks.
            </p>
          </Reveal>

          <Reveal>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <MagneticButton className="w-full sm:w-auto px-12 py-6 bg-slate-900 text-white rounded-[24px] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/30 hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                   Create Legacy Profile <ArrowLongRightIcon className="h-4 w-4" />
                </MagneticButton>
                <Link to="/find-doctors" className="w-full sm:w-auto px-12 py-6 bg-white border border-slate-100 rounded-[24px] text-xs font-black uppercase tracking-[0.2em] text-slate-800 shadow-xl hover:border-indigo-200 transition-all">Navigate Specialists</Link>
             </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ SPECIALISTS ═══ */}
      <section id="doctors" className="py-40 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-12">
            <Reveal className="max-w-2xl">
              <h2 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter leading-none mb-8">Verified <br /> <span className="text-indigo-600 italic">Officers.</span></h2>
              <p className="text-xl text-slate-400 font-medium leading-relaxed border-l-4 border-indigo-500/10 pl-8">Access a matrix of elite practitioners verified through universal medical registries.</p>
            </Reveal>
            <div className="flex gap-4">
              <button onClick={() => setCurrentDoctorSlide(p => Math.max(0, p - 1))} className="w-16 h-16 rounded-2xl border border-slate-100 flex items-center justify-center hover:bg-slate-50 transition-all"><ChevronLeftIcon className="h-6 w-6 text-slate-600" /></button>
              <button onClick={() => setCurrentDoctorSlide(p => Math.min((availableDoctors?.length || 1) - 1, p + 1))} className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/10"><ChevronRightIcon className="h-6 w-6 text-white" /></button>
            </div>
          </div>

          <div className="relative overflow-hidden">
             <motion.div className="flex gap-8" animate={{ x: -(currentDoctorSlide * 432) }} transition={{ type: "spring", bounce: 0, duration: 1.2 }}>
                {availableDoctors?.map((doc: any, i: number) => (
                   <motion.div key={doc.id} className="w-[400px] flex-shrink-0 group relative overflow-hidden rounded-[32px] bg-slate-50 border border-slate-100 p-6 hover:bg-white hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-700">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-[1s] bg-gradient-to-tr from-transparent via-indigo-500/[0.03] to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-[1.5s]" />
                      
                      <div className="relative aspect-[4/5] rounded-[24px] overflow-hidden mb-8">
                         <img src={doc.user?.profileImage || `https://ui-avatars.com/api/?name=${doc.user?.firstName}+${doc.user?.lastName}&background=0f172a&color=fff`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s]" alt="" />
                         <div className="absolute top-4 left-4 flex gap-2">
                            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-[9px] font-black uppercase tracking-[0.1em] text-indigo-600 shadow-sm">{doc.specialization || 'Clinical Specialist'}</span>
                         </div>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">Dr. {doc.user?.firstName} {doc.user?.lastName}</h3>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-8">{doc.hospital || 'Legacy Facility'}</p>
                      <button onClick={() => navigate('/login')} className="w-full py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 group-hover:bg-slate-900 group-hover:text-white group-hover:scale-[1.02] transition-all">Request Consultation</button>
                   </motion.div>
                ))}
             </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" className="py-40 bg-[#fafbff] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
           <Reveal className="text-center mb-24">
              <h2 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-8">Engineered for <br /> <span className="text-indigo-600 italic">Institutional Precision.</span></h2>
              <div className="flex justify-center gap-2 p-1.5 bg-slate-50 border border-slate-100 rounded-[28px] w-fit mx-auto">
                 {stakeholders.map((s, i) => (
                    <button key={i} onClick={() => setActiveStakeholder(i)} className={`px-8 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-[0.1em] transition-all ${activeStakeholder === i ? 'bg-white text-slate-900 shadow-xl shadow-slate-200/50' : 'text-slate-400 hover:text-slate-600'}`}>{s.label}</button>
                 ))}
              </div>
           </Reveal>

           <AnimatePresence mode="wait">
              <motion.div key={activeStakeholder} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.5 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {stakeholders[activeStakeholder].features.map((f, i) => (
                   <div key={i} className="group relative p-10 bg-white border border-slate-100 rounded-[32px] hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-2 transition-all duration-700 overflow-hidden">
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-[1s] bg-gradient-to-tr from-transparent via-indigo-500/[0.04] to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-[1.5s]" />
                      
                      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-8 border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-200 transition-all duration-500">
                         <f.icon className="h-7 w-7 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors tracking-tight">{f.title}</h3>
                      <p className="text-[15px] font-medium text-slate-400 leading-relaxed">{f.desc}</p>
                   </div>
                 ))}
              </motion.div>
           </AnimatePresence>
        </div>
      </section>

      {/* ═══ PROTOCOL ═══ */}
      <section id="flow" className="py-40 bg-[#0a0a1a] text-white relative overflow-hidden">
         <div className="absolute inset-0 pointer-events-none opacity-[0.05] dot-grid" />
         <div className="max-w-7xl mx-auto px-4 relative z-10">
            <Reveal>
               <h2 className="text-center text-5xl md:text-[6rem] font-black tracking-tighter mb-32 leading-none">The Lifeline <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 italic">Sync Protocol.</span></h2>
            </Reveal>

            <div className="space-y-40">
               {flowSteps.map((step, i) => (
                  <Reveal key={i}>
                     <div className={`flex flex-col md:flex-row gap-16 md:gap-32 items-center ${i % 2 === 0 ? '' : 'md:flex-row-reverse'}`}>
                        <div className="flex-1 w-full relative">
                           <div className={`absolute -inset-10 bg-gradient-to-tr ${step.color} opacity-20 blur-[80px] rounded-full pointer-events-none`} />
                           <div className="relative aspect-video rounded-[36px] bg-white/[0.05] border border-white/10 backdrop-blur-3xl overflow-hidden flex items-center justify-center group p-12">
                              <step.icon className="w-24 h-24 text-white opacity-40 group-hover:opacity-80 transition-all duration-700" />
                              <div className="absolute top-8 left-8 flex items-center gap-3">
                                 <div className={`px-4 py-1.5 rounded-xl bg-gradient-to-tr ${step.color} text-[10px] font-black tracking-[0.2em] shadow-xl`}>STEP {step.step}</div>
                              </div>
                           </div>
                        </div>
                        <div className="flex-1">
                           <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-6">{step.title}</h3>
                           <p className="text-lg text-slate-400 font-medium leading-relaxed mb-8">{step.desc}</p>
                           <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Operational Role: {step.who}</div>
                        </div>
                     </div>
                  </Reveal>
               ))}
            </div>
         </div>
      </section>

      {/* ═══ AI CORE ═══ */}
      <section id="ai" className="py-40 bg-[#fafbff] relative overflow-hidden">
         <div className="max-w-7xl mx-auto px-4 relative">
            <Reveal>
               <div className="text-center mb-32">
                  <span className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-10 inline-block border border-indigo-100">Neural Infrastructure Core</span>
                  <h2 className="text-6xl md:text-[8rem] font-black text-slate-900 tracking-tighter leading-none mb-10">AI That <br /> <span className="italic text-indigo-600">Contextualizes.</span></h2>
               </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
               {aiCapabilities.map((ai, i) => (
                  <Reveal key={i}>
                    <div className="group relative p-12 bg-white border border-slate-100 rounded-[40px] hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-1000 overflow-hidden">
                       <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl ${ai.gradient} opacity-[0.03] group-hover:opacity-[0.06] blur-3xl transition-opacity duration-1000`} />
                       <div className="flex gap-8 items-start relative z-10">
                          <div className={`w-20 h-20 shrink-0 bg-slate-900 rounded-[24px] flex items-center justify-center shadow-2xl transition-all duration-700 group-hover:scale-110 group-hover:rotate-6`}><ai.icon className="h-10 w-10 text-indigo-400" /></div>
                          <div>
                             <div className="flex items-center gap-3 mb-4">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{ai.title}</h3>
                                <div className="px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400">{ai.tag}</div>
                             </div>
                             <p className="text-base text-slate-400 font-medium leading-relaxed">{ai.desc}</p>
                          </div>
                       </div>
                    </div>
                  </Reveal>
               ))}
            </div>
         </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="reviews" className="py-40 bg-white relative">
         <div className="max-w-7xl mx-auto px-4">
            <Reveal>
               <div className="text-center mb-24">
                  <h2 className="text-[5rem] font-black text-slate-900 tracking-tighter leading-none">Voices of <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 italic">Innovation.</span></h2>
               </div>
            </Reveal>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {reviews.map((r: any, i: number) => (
                  <Reveal key={i}>
                    <div className="p-10 bg-slate-50 border border-slate-100 rounded-[32px] hover:bg-white hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-700">
                       <p className="text-xl font-medium text-slate-600 leading-relaxed italic mb-8">"{r.review}"</p>
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-400 font-bold mb-0.5">{r.user?.firstName?.[0]}</div>
                          <div><h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">{r.user?.firstName} {r.user?.lastName}</h4><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verified User</p></div>
                       </div>
                    </div>
                  </Reveal>
               ))}
            </div>
         </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-[#0a0a1a] py-32 border-t border-white/5 relative">
         <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center">
            <Reveal>
               <div className="flex items-center gap-3 mb-10">
                 <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                   <SparklesIcon className="h-7 w-7 text-indigo-600" />
                 </div>
                 <span className="text-2xl font-bold tracking-tighter text-white">LIVORA</span>
               </div>
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Establishing the future of medical intelligence.</p>
               <div className="flex gap-8 mt-20 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  <span className="flex items-center gap-2"><ShieldCheckIcon className="h-4 w-4 text-emerald-500" /> HIPAA SECURE</span>
                  <span className="flex items-center gap-2"><CheckCircleIcon className="h-4 w-4 text-indigo-500" /> BMDC REGISTERED</span>
               </div>
            </Reveal>
         </div>
      </footer>

      {/* AMBIENT NOISE */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay" />
    </div>
  );
};

export default LandingPage;
