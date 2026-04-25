import React, { useState, Fragment } from 'react';
import { Combobox, Transition } from '@headlessui/react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from '../components/NotificationDropdown';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  SparklesIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  CalendarIcon,
  CheckCircleIcon,
  XMarkIcon,
  FunnelIcon,
  ChevronDownIcon,
  ArrowsUpDownIcon,
  ClockIcon,
  LanguageIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  AdjustmentsVerticalIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import DoctorRatings from '../components/DoctorRatings';
import { formatCurrency } from '../services/paymentService';
import { getDepartmentLabel, MEDICAL_DEPARTMENTS } from '../utils/departments';
import { motion, AnimatePresence } from 'framer-motion';
import { Reveal } from '../components/landing/AnimatedSection';

const PublicDoctors: React.FC = () => {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [specialization, setSpecialization] = useState('All');
  const [pageLoaded, setPageLoaded] = useState(false);
  const [sortBy, setSortBy] = useState('all');
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [minReviews, setMinReviews] = useState(0);
  const [deptQuery, setDeptQuery] = useState('');

  const getDashboardUrl = () => {
    switch (user?.role) {
      case 'patient': return '/app/dashboard';
      case 'doctor': return '/app/doctor-dashboard';
      case 'admin': return '/app/admin-dashboard';
      default: return '/app/dashboard';
    }
  };

  React.useEffect(() => {
    setPageLoaded(true);
  }, []);

  const { data: doctorsRaw, isLoading } = useQuery({
    queryKey: ['public-doctors', searchTerm, specialization],
    queryFn: async () => {
      const params: any = { limit: 50 }; // Increased limit to allow frontend sorting on more records
      if (searchTerm) params.search = searchTerm;
      if (specialization !== 'All') params.specialization = specialization;
      
      const response = await API.get('/doctors', { params });
      return response.data.data.doctors;
    }
  });

  const filteredDepartments = deptQuery === ''
    ? MEDICAL_DEPARTMENTS
    : MEDICAL_DEPARTMENTS.filter((dept) =>
        dept.label.toLowerCase().includes(deptQuery.toLowerCase())
      );

  // Sophisticated filtering and sorting
  const doctors = React.useMemo(() => {
    if (!doctorsRaw) return [];
    
    let filtered = doctorsRaw.filter((d: any) => {
      const rating = d.calculatedRating || 0;
      const count = d.totalRatings || 0;
      return rating >= minRating && count >= minReviews;
    });
    
    // Final client-side sort
    return filtered.sort((a: any, b: any) => {
      const ratingA = a.calculatedRating || 0;
      const ratingB = b.calculatedRating || 0;
      const countA = a.totalRatings || 0;
      const countB = b.totalRatings || 0;
      
      switch (sortBy) {
        case 'rating_desc': return ratingB - ratingA;
        case 'rating_asc': return ratingA - ratingB;
        case 'reviews_desc': return countB - countA;
        case 'reviews_asc': return countA - countB;
        default: return 0;
      }
    });
  }, [doctorsRaw, sortBy, minRating, minReviews]);

  const specializations = [
    { value: 'All', label: 'All Categories' },
    ...MEDICAL_DEPARTMENTS
  ];

  return (
    <div className="min-h-screen relative bg-slate-50 overflow-hidden font-sans selection:bg-indigo-500/30 selection:text-indigo-900">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none animate-[pulse_10s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none animate-[pulse_12s_ease-in-out_infinite_reverse]" />
      <div className="noise-overlay opacity-20 pointer-events-none absolute inset-0 mix-blend-overlay"></div>
      <div className="dot-grid opacity-30 absolute inset-0 pointer-events-none"></div>

      <div className="relative z-10">
        {/* Header / Nav - only show for non-logged in users since Layout provides it for logged in */}
        {!user && (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center group transition-all duration-500">
              <div className="relative group">
                <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <img src="/logo.png" className="h-14 w-14 relative z-10 drop-shadow-md" alt="Livora Logo" />
              </div>
              <span className="ml-3 text-2xl font-black text-slate-900 tracking-tight">Livora</span>
            </Link>
            <div className="flex items-center space-x-6">
                <div className="flex items-center gap-4">
                  <Link to="/login" className="text-[11px] text-slate-500 font-black uppercase tracking-widest hover:text-indigo-600 transition-colors">Sign In</Link>
                  <Link to="/register" className="group relative overflow-hidden bg-slate-900 text-white px-6 py-2.5 rounded-full font-black text-[11px] uppercase tracking-widest shadow-xl transition-all hover:shadow-indigo-500/20">
                    <span className="relative z-10">Join Now</span>
                    <div className="absolute inset-0 translate-y-[100%] bg-indigo-600 group-hover:translate-y-[0%] transition-transform duration-500 ease-out z-0"></div>
                  </Link>
                </div>
            </div>
          </div>
        </div>
      </nav>
      )}

      <main className={`pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto ${user ? 'pt-8' : 'pt-32'}`}>
        {/* SEO-friendly Section */}
        {/* ═══ PREMIUM HEADER ═══ */}
        <Reveal variant="fadeUp" delay={0.1}>
          <div className="mb-12 relative overflow-hidden rounded-[32px] bg-slate-900 p-8 md:p-12 text-white shadow-2xl shadow-indigo-500/10">
            <div className="absolute top-0 right-0 w-1/2 h-full">
              <div className="absolute inset-0 bg-gradient-to-l from-indigo-500/20 via-transparent to-transparent opacity-60" />
              <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-400/20 rounded-full blur-[80px]" />
            </div>
            
            <div className="relative z-10 md:flex items-center justify-between gap-10">
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  Verified Clinical Network
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.1]">
                  Connect With <br className="hidden md:block"/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 animate-gradient-shift italic pr-2">
                    Elite Specialists
                  </span>.
                </h1>
                <p className="text-slate-400 font-medium text-lg leading-relaxed">
                  Access our premier network of verified healthcare professionals. Experience seamless bookings, real-time availability, and uncompromising clinical excellence.
                </p>
              </div>

              <div className="hidden lg:flex flex-col items-end gap-4">
                <div className="text-right">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Network Status</p>
                  <p className="text-lg font-black text-emerald-400">
                    {!isLoading && doctors?.length > 0 ? `${doctors.length} Experts Online` : 'Scanning Network'}
                  </p>
                </div>
                <div className="w-px h-10 bg-white/10 my-1" />
                <div className="flex -space-x-3 group cursor-pointer">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="w-12 h-12 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:translate-x-1 transition-transform">
                      <UserGroupIcon className="h-5 w-5 text-indigo-400 opacity-50" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Search and Filters */}
        <div className={`mb-12 sticky top-24 z-40 ${pageLoaded ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
          <div className="glass rounded-[40px] shadow-2xl shadow-indigo-500/5 border border-white/20 p-8 md:p-10 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-violet-500/5 opacity-0 group-hover/filter:opacity-100 transition-opacity duration-1000"></div>
            <div className="relative z-10 flex flex-col md:flex-row lg:flex-row gap-6 w-full">
              <div className="flex-1 relative group flex">
                <div className="absolute inset-y-0 left-0 pl-2 h-full flex items-center group-focus-within:text-indigo-600 transition-colors pointer-events-none">
                  <div className="bg-slate-900 rounded-xl p-3 group-hover:bg-indigo-600 transition-colors">
                    <MagnifyingGlassIcon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Enter name, registry, or hospital..."
                  className="w-full pl-16 pr-6 py-5 bg-white/50 border border-slate-100 rounded-2xl text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all text-sm font-bold outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
                
                <div className="md:w-72 relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10 text-slate-400 group-focus-within:text-indigo-600">
                    <AcademicCapIcon className="h-5 w-5" />
                  </div>
                  <Combobox value={specialization} onChange={(val: string | null) => val && setSpecialization(val)}>
                    <div className="relative h-full">
                      <Combobox.Input
                        className="w-full h-full pl-12 pr-10 py-5 bg-white/50 border border-slate-100 rounded-2xl text-slate-700 font-bold focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all appearance-none text-sm outline-none"
                        displayValue={(val: string) => val === 'All' ? 'All Departments' : val}
                        onChange={(event) => setDeptQuery(event.target.value)}
                        placeholder="Search Dept..."
                      />
                      <Combobox.Button className="absolute inset-y-0 right-4 flex items-center">
                        <ChevronDownIcon className="h-5 w-5 text-slate-400 transition-transform group-focus-within:rotate-180" aria-hidden="true" />
                      </Combobox.Button>
                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                        afterLeave={() => setDeptQuery('')}
                      >
                        <Combobox.Options className="absolute mt-2 max-h-60 w-full overflow-auto rounded-2xl bg-white py-1 text-base shadow-2xl ring-1 ring-black/5 focus:outline-none z-[60] backdrop-blur-xl">
                          <Combobox.Option
                            value="All"
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-3 px-6 font-bold ${
                                active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                              }`
                            }
                          >
                            All Categories
                          </Combobox.Option>
                          {filteredDepartments.map((dept) => (
                            <Combobox.Option
                              key={dept.value}
                              value={dept.value}
                              className={({ active }) =>
                                `relative cursor-pointer select-none py-3 px-6 font-bold ${
                                  active ? 'bg-indigo-600 text-white' : 'text-gray-900'
                                }`
                              }
                            >
                              {dept.label}
                            </Combobox.Option>
                          ))}
                        </Combobox.Options>
                      </Transition>
                    </div>
                  </Combobox>
                </div>

                <div className="md:w-64 relative group flex flex-col justify-center">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600">
                    <ArrowsUpDownIcon className="h-5 w-5" />
                  </div>
                  <select
                    className="w-full h-full pl-12 pr-10 py-5 bg-white/50 border border-slate-100 rounded-2xl text-slate-700 font-bold focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all appearance-none text-sm cursor-pointer outline-none"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="all">Default Sorting</option>
                    <option value="rating_desc">Highest Rated</option>
                    <option value="rating_asc">Lowest Rated</option>
                    <option value="reviews_desc">Most Reviews</option>
                    <option value="reviews_asc">Fewest Reviews</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                    <ChevronDownIcon className="h-4 w-4" />
                  </div>
                </div>
            </div>

            {/* Rating and Review Filters */}
            <div className="mt-6 flex flex-wrap items-center gap-6 pt-6 border-t border-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Min Rating</span>
                  <div className="flex items-center bg-gray-50 rounded-2xl p-1 gap-1">
                    {[0, 3, 4, 4.5].map((val) => (
                      <button
                        key={val}
                        onClick={() => setMinRating(val)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          minRating === val 
                            ? 'bg-white shadow-sm text-indigo-600' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {val === 0 ? 'All' : `${val}+`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Min Reviews</span>
                  <div className="flex items-center bg-gray-50 rounded-2xl p-1 gap-1">
                    {[0, 5, 10, 25].map((val) => (
                      <button
                        key={val}
                        onClick={() => setMinReviews(val)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                          minReviews === val 
                            ? 'bg-white shadow-sm text-indigo-600' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        {val === 0 ? 'Any' : `${val}+`}
                      </button>
                    ))}
                  </div>
                </div>

                {(minRating > 0 || minReviews > 0) && (
                  <button
                    onClick={() => { setMinRating(0); setMinReviews(0); }}
                    className="flex items-center gap-2 text-red-500 hover:text-red-600 font-bold text-sm transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    Reset Filters
                  </button>
                )}
            </div>
          </div>
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[...Array(6)].map((_: any, i: number) => (
              <div key={i} className="h-[500px] bg-slate-100/50 rounded-[40px] animate-pulse border border-slate-200"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {doctors && doctors.length > 0 ? (
              doctors.map((doctor: any, index: number) => (
                <Reveal key={doctor.id} variant="fadeUp" delay={index * 0.05} className="h-full">
                  <div className="premium-card h-full bg-white rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-700 overflow-hidden flex flex-col relative group">
                    {/* Doctor Image Header */}
                    <div className="relative h-64 overflow-hidden rounded-t-[40px]">
                      <div className="absolute inset-0 bg-slate-900/40 group-hover:bg-transparent transition-colors duration-700 z-10"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent z-10"></div>
                      {doctor.user?.profileImage ? (
                        <img 
                          src={doctor.user.profileImage} 
                          alt={doctor.user.firstName}
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                          <UserIcon className="h-20 w-20 text-slate-300" />
                        </div>
                      )}
                      
                      <div className="absolute top-6 right-6 z-20 flex flex-col gap-2">
                        <div className="glass px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-white/20">
                          <StarIcon className="h-4 w-4 text-amber-500 fill-current" />
                          <span className="font-black text-slate-900 text-sm">{doctor.calculatedRating?.toFixed(1) || 'New'}</span>
                        </div>
                        {doctor.totalRatings > 0 && (
                          <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-center border border-white/10">
                            <span className="text-white/90 text-[9px] font-black tracking-widest uppercase">{doctor.totalRatings} Reviews</span>
                          </div>
                        )}
                      </div>

                      <div className="absolute bottom-6 left-6 right-6 z-20">
                         <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md group-hover:text-indigo-300 transition-colors">
                           Dr. {doctor.user?.firstName} {doctor.user?.lastName}
                         </h2>
                         <p className="text-indigo-300 font-bold text-xs uppercase tracking-[0.2em] mt-2">
                           {getDepartmentLabel(doctor.department)}
                         </p>
                      </div>
                    </div>

                    {/* Doctor Details */}
                    <div className="p-8 flex-1 flex flex-col bg-white relative">
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 translate-x-[-150%] skew-x-[-20deg] group-hover:animate-[shine_1.5s_ease-in-out_forwards] pointer-events-none" />

                      <div className="space-y-4 mb-8">
                        <div className="flex items-start text-slate-600">
                          <MapPinIcon className="h-5 w-5 mr-3 mt-0.5 text-slate-400 shrink-0" />
                          <span className="font-bold text-sm leading-snug">{doctor.hospital || 'Private Practice'}</span>
                        </div>
                        <div className="flex items-center text-slate-600">
                          <CalendarIcon className="h-5 w-5 mr-3 text-slate-400 shrink-0" />
                          <span className="font-bold text-sm leading-snug">{doctor.experience || 0} Years Experience</span>
                        </div>
                        <div className="flex items-center text-slate-600">
                          <ShieldCheckIcon className="h-5 w-5 mr-3 text-slate-400 shrink-0" />
                          <span className="text-sm font-bold leading-snug font-mono bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">Reg: {doctor.bmdcRegistrationNumber || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="mt-auto space-y-6">
                        <div className="flex items-center justify-between border-t border-slate-50 pt-6">
                          <div>
                             <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Consultation Protocol</p>
                             <p className="text-3xl font-black text-slate-900 tracking-tight">৳{doctor.consultationFee || 0}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                             <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                               <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                               <span className="text-emerald-700 text-[10px] font-black uppercase tracking-widest">Available</span>
                             </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => { setSelectedDoctor(doctor); setShowProfileModal(true); }}
                            className="flex items-center justify-center py-4 bg-slate-50 text-slate-400 text-xs uppercase tracking-widest border border-slate-100 rounded-2xl font-black hover:bg-slate-100 hover:text-slate-900 transition-all"
                          >
                            Dossier
                          </button>
                          <Link
                            to={user ? `/app/appointments?doctor=${doctor.id}` : `/login?redirect=/app/appointments&doctor=${doctor.id}`}
                            className="group/btn relative overflow-hidden flex items-center justify-center bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 transition-all hover:shadow-indigo-500/20"
                          >
                             <span className="relative z-10">Initiate Sync</span>
                             <div className="absolute inset-0 translate-y-[100%] bg-indigo-600 group-hover/btn:translate-y-[0%] transition-transform duration-500 ease-out z-0"></div>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))
            ) : (
              <div className="col-span-full py-20 text-center glass rounded-[40px] border border-white/20">
                <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-slate-100">
                   <UserGroupIcon className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">No Specialists Active</h3>
                <p className="text-slate-400 font-medium max-w-sm mx-auto leading-relaxed">Adjust your matrix filters to locate matching healthcare professionals.</p>
                <button 
                  onClick={() => { setSearchTerm(''); setSpecialization('All'); setMinRating(0); setMinReviews(0); setDeptQuery(''); }}
                  className="mt-6 text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-500 transition-colors"
                >
                  Reset Parameters
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Doctor Profile Modal */}
      <AnimatePresence>
      {showProfileModal && selectedDoctor && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProfileModal(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white rounded-[40px] shadow-2xl border border-slate-100"
          >
            <button 
              onClick={() => setShowProfileModal(false)}
              className="absolute top-8 right-8 w-12 h-12 bg-slate-50 hover:bg-slate-100 flex items-center justify-center rounded-full transition-all z-20 group"
            >
              <XMarkIcon className="h-6 w-6 text-slate-400 group-hover:text-slate-900 group-hover:rotate-90 transition-all duration-300" />
            </button>

            <div className="p-8 md:p-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500" />
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Lateral Profile Info */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="relative group/modal-img text-center">
                    <div className="absolute inset-0 bg-indigo-500 rounded-[40px] blur-3xl opacity-20 group-hover/modal-img:opacity-40 transition-opacity"></div>
                    {selectedDoctor.user?.profileImage ? (
                      <img 
                        src={selectedDoctor.user.profileImage} 
                        className="w-full aspect-square object-cover rounded-[40px] relative z-10 border-4 border-white shadow-2xl" 
                        alt="Dr. Profile" 
                      />
                    ) : (
                      <div className="w-full aspect-square bg-slate-100 rounded-[40px] relative z-10 border-4 border-white shadow-2xl flex items-center justify-center">
                        <UserIcon className="h-32 w-32 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-[3px] border-white shadow-lg whitespace-nowrap">
                      BMDC Verified
                    </div>
                  </div>

                  <div className="glass rounded-[32px] p-8 border border-white/20 text-center shadow-lg shadow-indigo-500/5">
                    <h2 className="text-3xl font-black text-slate-900 mb-2 leading-tight">Dr. {selectedDoctor.user?.firstName} {selectedDoctor.user?.lastName}</h2>
                    <p className="text-indigo-600 font-bold text-xs uppercase tracking-[0.2em] mb-6">{getDepartmentLabel(selectedDoctor.department)}</p>
                    
                    <div className="flex flex-col gap-4">
                       <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-100">
                          <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Experience</span>
                          <span className="text-slate-900 font-black">{selectedDoctor.experience || 0} Years</span>
                       </div>
                       <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-100">
                          <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Consultation</span>
                          <span className="text-indigo-600 font-black">{formatCurrency(selectedDoctor.consultationFee || 0)}</span>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Right Content */}
                <div className="lg:col-span-8 space-y-10">
                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Professional Bio</h3>
                    <p className="text-lg text-slate-600 leading-relaxed font-medium italic">
                      "{selectedDoctor.bio || 'Dedicated healthcare professional committed to providing exceptional care and personalized treatment plans for every patient.'}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex items-start gap-4">
                      <div className="p-3 bg-white rounded-2xl shadow-sm">
                        <MapPinIcon className="h-6 w-6 text-slate-500" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Chamber / Hospital</h4>
                        <p className="text-slate-900 font-bold">{selectedDoctor.hospital || 'Private Clinic'}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 flex items-start gap-4">
                      <div className="p-3 bg-white rounded-2xl shadow-sm">
                        <LanguageIcon className="h-6 w-6 text-slate-500" />
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Languages Spoken</h4>
                        <p className="text-slate-900 font-bold">{selectedDoctor.languages?.join(', ') || 'English, Bengali'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Qualifications */}
                  {selectedDoctor.degrees && selectedDoctor.degrees.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Expertise & Degrees</h3>
                      <div className="flex flex-wrap gap-4">
                        {selectedDoctor.degrees.map((degree: string, i: number) => (
                          <div key={i} className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm">
                             <AcademicCapIcon className="h-5 w-5 text-indigo-500" />
                             <span className="font-bold text-slate-700">{degree}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Awards */}
                  {selectedDoctor.awards && selectedDoctor.awards.length > 0 && (
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Achievements</h3>
                      <div className="flex flex-wrap gap-4">
                        {selectedDoctor.awards.map((award: string, i: number) => (
                          <div key={i} className="flex items-center gap-3 bg-amber-50 px-5 py-3 rounded-2xl border border-amber-100 shadow-sm">
                             <TrophyIcon className="h-5 w-5 text-amber-500" />
                             <span className="font-bold text-amber-900">{award}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rating Analysis Header */}
                  <div className="pt-8 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                       <div>
                          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Patient Feedback</h3>
                          <p className="text-slate-400 font-medium">Verified reviews from our community</p>
                       </div>
                       <div className="text-right">
                          <div className="flex items-center gap-2 mb-1 justify-end">
                             <StarIcon className="h-6 w-6 text-amber-400 fill-current" />
                             <span className="text-4xl font-black text-slate-900 tracking-tighter">{selectedDoctor.calculatedRating?.toFixed(1) || '0.0'}</span>
                          </div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{selectedDoctor.totalRatings || 0} VERIFIED REVIEWS</span>
                       </div>
                    </div>
                    
                    {/* DoctorRatings Component */}
                    <div className="bg-slate-50 rounded-[40px] p-2 border border-slate-100 shadow-inner">
                       <DoctorRatings doctorId={selectedDoctor.id} showAll={true} />
                    </div>
                  </div>

                  <div className="flex pt-10">
                     <Link
                       to={user ? `/app/appointments?doctor=${selectedDoctor.id}` : `/login?redirect=/app/appointments&doctor=${selectedDoctor.id}`}
                       className="group/btn relative overflow-hidden flex-1 py-6 bg-slate-900 text-white rounded-3xl font-black text-[15px] uppercase tracking-widest text-center shadow-2xl transition-all hover:shadow-indigo-500/25"
                     >
                       <span className="relative z-10">Confirm Booking</span>
                       <div className="absolute inset-0 translate-y-[100%] bg-indigo-600 group-hover/btn:translate-y-[0%] transition-transform duration-500 ease-out z-0"></div>
                     </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      </div> {/* Close the relative z-10 block wrapping the entire main layout */}

      {/* Footer (Simplified for Branding) */}
      <footer className="bg-slate-50 border-t border-white relative z-20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
           <div className="flex justify-center items-center mb-6">
              <img src="/logo.png" className="h-10 w-10 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer" alt="Livora Logo" />
              <span className="ml-3 text-xl font-black text-slate-300">Livora</span>
           </div>
           <p className="text-slate-400 text-sm font-bold">© 2026 Livora Healthcare. All rights reserved.</p>
           <div className="mt-4 flex justify-center space-x-6 text-[10px] font-black uppercase tracking-widest text-slate-300">
              <a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-indigo-400 transition-colors">Platform Status</a>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicDoctors;
