import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from 'framer-motion';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from '../components/NotificationDropdown';
import toast from 'react-hot-toast';
import { 
  HeartIcon, UserGroupIcon, CalendarIcon, DocumentTextIcon, BeakerIcon, 
  ShieldCheckIcon, ClockIcon, CheckCircleIcon, StarIcon, PhoneIcon, 
  EnvelopeIcon, MapPinIcon, ArrowRightIcon, PlayIcon, SparklesIcon, 
  RocketLaunchIcon, ChatBubbleLeftRightIcon, ChartBarIcon, AcademicCapIcon, 
  MicrophoneIcon, ChevronLeftIcon, ChevronRightIcon, BeakerIcon as LabIcon
} from '@heroicons/react/24/outline';

const LandingPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentDoctorSlide, setCurrentDoctorSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const { data: availableDoctors } = useQuery({
    queryKey: ['available-doctors-public'],
    queryFn: async () => {
      const response = await API.get('/doctors', { params: { limit: 12 } });
      return response.data.data.doctors;
    }
  });

  const { data: websiteReviews } = useQuery({
    queryKey: ['website-reviews'],
    queryFn: async () => {
      const response = await API.get('/website-reviews/public');
      return response.data.data.reviews;
    }
  });

  useEffect(() => {
    document.title = "Livora | AI-Powered Modern Healthcare Platform";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Experience the future of healthcare with Livora. AI-driven symptoms checker, smart lab reports, and expert medical care.");
  }, []);

  const getDashboardUrl = () => {
    switch (user?.role) {
      case 'patient': return '/app/dashboard';
      case 'doctor': return '/app/doctor-dashboard';
      case 'admin': return '/app/admin-dashboard';
      default: return '/app/dashboard';
    }
  };

  const aiFeatures = [
    {
      title: "Intelligent Triage",
      desc: "Our AI Assistant analyzes symptoms in real-time to match you with the right specialist immediately.",
      icon: SparklesIcon,
      color: "from-blue-600 to-indigo-600",
      image: "https://images.unsplash.com/photo-1576091160550-2173dad99978?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "Smart Lab Analysis",
      desc: "Instant data extraction and insights from your lab reports using advanced AI OCR technology.",
      icon: LabIcon,
      color: "from-emerald-600 to-teal-600",
      image: "https://images.unsplash.com/photo-1579152276503-884962f2756b?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "Voice-First Care",
      desc: "Navigate your health records and book appointments naturally using our voice-enabled AI interface.",
      icon: MicrophoneIcon,
      color: "from-purple-600 to-pink-600",
      image: "https://images.unsplash.com/photo-1589254065878-42c9da997008?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <div ref={containerRef} className="relative min-h-screen bg-slate-50 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
      {/* Dynamic Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-[100] transition-all duration-500">
        <motion.div 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4"
        >
          <div className="bg-white/70 backdrop-blur-2xl border border-white/40 shadow-2xl shadow-indigo-100/50 rounded-3xl h-20 flex items-center justify-between px-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-500">
                <HeartIcon className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-black text-slate-900 tracking-tighter">LIVORA</span>
            </Link>
            
            <div className="hidden md:flex items-center gap-8">
              {['Features', 'Doctors', 'AI Technology', 'Reviews'].map((item) => (
                <button 
                  key={item} 
                  onClick={() => {
                    document.getElementById(item.toLowerCase().replace(' ', '-'))?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <Link to={getDashboardUrl()} className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95">
                  Dashboard
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-bold text-slate-900 px-4 py-2">Sign In</Link>
                  <Link to="/register" className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-95">
                    Join Now
                  </Link>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-44 pb-20 px-4 overflow-hidden">
        {/* Parallax Background Orbs */}
      <motion.div 
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, -200]) }}
        className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-gradient-to-bl from-indigo-100/50 via-blue-50/20 to-transparent rounded-full blur-3xl opacity-70" 
      />
      <motion.div 
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, 200]) }}
        className="absolute bottom-0 -left-20 -z-10 w-[600px] h-[600px] bg-gradient-to-tr from-purple-100/40 via-indigo-50/20 to-transparent rounded-full blur-3xl opacity-70" 
      />
        
        <div className="max-w-7xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8 border border-indigo-100">
              <SparklesIcon className="h-4 w-4 animate-pulse" />
              The Future of Medicine is AI
            </span>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tight leading-[0.9] mb-8">
              Healthcare <br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-blue-600 bg-clip-text text-transparent">Reimagined.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl text-slate-600 font-medium leading-relaxed mb-12">
              Livora combines advanced AI diagnostics with expert clinical care to provide 
              the most seamless healthcare experience ever created.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link to="/register" className="w-full sm:w-auto bg-slate-900 text-white px-10 py-5 rounded-3xl text-lg font-black shadow-2xl hover:bg-slate-800 transition-all active:scale-95 flex items-center justify-center gap-3 group">
                Get Started Today
                <ArrowRightIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="w-full sm:w-auto bg-white text-slate-900 px-10 py-5 rounded-3xl text-lg font-black border border-slate-200 shadow-sm hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3">
                <PlayIcon className="h-6 w-6 text-indigo-600" />
                Watch Platform Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Top Doctors Slideshow (Upper Section as requested) */}
      <section id="doctors" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                Elite Medical <span className="text-indigo-600">Specialists</span>
              </h2>
              <p className="text-lg text-slate-500 font-medium">Ready to provide world-class care anytime, anywhere.</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setCurrentDoctorSlide(prev => (prev > 0 ? prev - 1 : 0))}
                className="w-14 h-14 rounded-2xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-all active:scale-90"
              >
                <ChevronLeftIcon className="h-6 w-6 text-slate-900" />
              </button>
              <button 
                onClick={() => setCurrentDoctorSlide(prev => (availableDoctors && prev < availableDoctors.length - 1 ? prev + 1 : prev))}
                className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-all active:scale-90"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          <div className="relative">
            <motion.div 
              className="flex gap-8 cursor-grab active:cursor-grabbing"
              animate={{ x: -(currentDoctorSlide * 400) }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              {availableDoctors?.map((doc: any) => (
                <motion.div 
                  key={doc.id}
                  className="w-[350px] flex-shrink-0 bg-slate-50 rounded-[40px] p-6 group hover:bg-white hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 border border-transparent hover:border-indigo-100"
                >
                  <div className="relative mb-6 overflow-hidden rounded-[32px]">
                    <img 
                      src={doc.user?.profileImage || `https://ui-avatars.com/api/?name=${doc.user?.firstName}+${doc.user?.lastName}&background=4f46e5&color=fff&size=512`} 
                      className="w-full aspect-[4/5] object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt={doc.user?.firstName}
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-md text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/50">
                        {doc.specialization || "Specialist"}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-1">Dr. {doc.user?.firstName} {doc.user?.lastName}</h3>
                  <p className="text-slate-500 font-bold text-sm mb-6 flex items-center gap-1.5">
                    <MapPinIcon className="h-4 w-4 text-indigo-500" />
                    {doc.hospital || "Elite General Hospital"}
                  </p>
                  <button 
                    onClick={() => navigate(user ? `/app/appointments?doctor=${doc.id}` : '/login')}
                    className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all shadow-sm"
                  >
                    View Schedule
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Features Presentation (Interactive Scroll Effect) */}
      <section id="ai-technology" className="py-24 bg-slate-900 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="mb-32 text-center">
            <motion.h2 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="text-5xl md:text-8xl font-black text-white tracking-tight leading-[0.9] mb-8"
            >
              Intelligence <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-blue-400 bg-clip-text text-transparent italic">Redefined.</span>
            </motion.h2>
            <p className="max-w-3xl mx-auto text-xl text-slate-400 font-medium leading-relaxed">
              Experience medical care powered by proprietary AI models designed for clinical precision and absolute privacy.
            </p>
          </div>

          <div className="relative">
            {aiFeatures.map((f, i) => (
              <div key={i} className="min-h-[80vh] flex flex-col lg:flex-row items-center gap-16 py-20">
                <motion.div 
                  initial={{ opacity: 0, x: i % 2 === 0 ? -100 : 100 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true, margin: "-100px" }}
                  className={`flex-1 space-y-10 ${i % 2 === 0 ? '' : 'lg:order-2'}`}
                >
                  <div className={`w-24 h-24 bg-gradient-to-tr ${f.color} rounded-[35px] flex items-center justify-center shadow-[0_20px_50px_rgba(79,70,229,0.3)]`}>
                    <f.icon className="h-12 w-12 text-white" />
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-5xl md:text-6xl font-black text-white tracking-tight">{f.title}</h3>
                    <p className="text-2xl text-slate-400 leading-relaxed font-normal">{f.desc}</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {["Clinical Grade", "Real-time", "Encrypted"].map((tag) => (
                      <span key={tag} className="px-6 py-2 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-black uppercase tracking-widest">
                        {tag}
                      </span>
                    ))}
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.8, rotate: i % 2 === 0 ? 5 : -5 }}
                  whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  viewport={{ once: true, margin: "-100px" }}
                  className={`flex-1 relative ${i % 2 === 0 ? '' : 'lg:order-1'}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-tr ${f.color} blur-[120px] opacity-30`} />
                  <div className="relative group p-4 bg-white/5 border border-white/10 rounded-[50px] backdrop-blur-xl">
                    <img 
                      src={f.image} 
                      className="w-full h-[500px] object-cover rounded-[40px] grayscale group-hover:grayscale-0 transition-all duration-1000" 
                      alt={f.title} 
                    />
                    <div className="absolute inset-0 rounded-[40px] ring-1 ring-inset ring-white/10 group-hover:ring-white/20 transition-all" />
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section id="features" className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-6">One Platform, <br /> Infinite Care.</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">Everything you need to manage your health in a single, beautiful interface.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: CalendarIcon, title: "Smart Booking", desc: "AI-optimized scheduling that respects your time and the doctor's availability." },
              { icon: DocumentTextIcon, title: "Health Vault", desc: "Secure, encrypted storage for all your medical history and prescriptions." },
              { icon: ChartBarIcon, title: "Lab Tracking", desc: "Visualize your health trends over time with automated lab data aggregation." },
              { icon: ShieldCheckIcon, title: "HIPAA Compliant", desc: "Enterprise-grade security ensuring your most sensitive data stays private." },
              { icon: BeakerIcon, title: "Pharmacy Ready", desc: "Directly send digital prescriptions to your preferred pharmacy partners." },
              { icon: MicrophoneIcon, title: "Voice Control", desc: "Hands-free navigation for an inclusive and effortless user experience." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500"
              >
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section with Scroll Animation */}
      <section className="py-32 bg-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-violet-700 to-blue-700" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center text-white">
            {[
              { label: "Patients Helped", value: "10K+" },
              { label: "Verified Specialists", value: "500+" },
              { label: "Smart Reports", value: "50K+" },
              { label: "Support Rate", value: "99.9%" }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="space-y-4"
              >
                <div className="text-6xl font-black tracking-tighter">{stat.value}</div>
                <div className="text-indigo-100 font-bold uppercase tracking-widest text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="reviews" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-6">Patient Stories.</h2>
            <p className="text-xl text-slate-500 font-medium">Join thousands of others who have simplified their health journey.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(websiteReviews || []).slice(0, 3).map((r: any, i: number) => (
              <div key={i} className="bg-slate-50 p-10 rounded-[40px] relative">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => <StarIcon key={i} className="h-5 w-5 text-yellow-500 fill-current" />)}
                </div>
                <p className="text-lg text-slate-700 font-medium mb-8 leading-relaxed italic">"{r.review}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center font-black text-indigo-600">
                    {r.user?.firstName?.[0]}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900">{r.user?.firstName} {r.user?.lastName}</h4>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Verified User</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-24 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 border-b border-white/10 pb-20">
            <div className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                  <HeartIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-black tracking-tighter">LIVORA</span>
              </div>
              <p className="text-slate-400 font-medium">Modernizing healthcare with clinical intelligence and patient-first design.</p>
              <div className="flex gap-4">
                {[1,2,3,4].map(i => <div key={i} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/10 cursor-pointer transition-colors" />)}
              </div>
            </div>
            {['Product', 'Resources', 'Support', 'Legal'].map((col) => (
              <div key={col} className="space-y-8">
                <h4 className="font-black text-sm uppercase tracking-[0.2em]">{col}</h4>
                <ul className="space-y-4 text-slate-400 font-medium">
                  {['Link One', 'Link Two', 'Link Three', 'Link Four'].map(l => <li key={l} className="hover:text-indigo-400 transition-colors cursor-pointer">{l}</li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="pt-12 flex flex-col md:flex-row items-center justify-between gap-8 text-slate-500 font-bold text-xs uppercase tracking-widest">
            <p>© 2026 Livora Health. All Rights Reserved.</p>
            <div className="flex gap-8">
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
