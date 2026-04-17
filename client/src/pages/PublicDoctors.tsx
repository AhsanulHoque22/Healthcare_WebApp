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
  AdjustmentsVerticalIcon
} from '@heroicons/react/24/outline';
import DoctorRatings from '../components/DoctorRatings';
import { formatCurrency } from '../services/paymentService';
import { getDepartmentLabel, MEDICAL_DEPARTMENTS } from '../utils/departments';

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 selection:bg-indigo-500 selection:text-white">
      {/* Header / Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center group transition-all duration-500">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <img src="/logo.png" className="h-14 w-14 relative z-10" alt="Livora Logo" />
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-blue-900 bg-clip-text text-transparent">Livora</span>
            </Link>
            <div className="flex items-center space-x-6">
              {user ? (
                <div className="flex items-center space-x-6">
                  <NotificationDropdown />
                  <Link
                    to={getDashboardUrl()}
                    className="flex items-center space-x-3 group/account transition-all duration-300"
                  >
                    <div className="relative">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.firstName}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-100 group-hover/account:ring-indigo-500 transition-all shadow-sm"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-sm group-hover/account:scale-105 transition-all">
                          {user?.firstName?.charAt(0) || ''}{user?.lastName?.charAt(0) || ''}
                        </div>
                      )}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-bold text-gray-900 group-hover/account:text-indigo-600 transition-colors">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold opacity-70">
                        {user.role} Dashboard
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="hidden lg:flex items-center px-4 py-2 text-sm font-bold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 font-semibold hover:text-indigo-600 transition-colors">Sign In</Link>
                  <Link to="/register" className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-2.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 active:scale-95 transition-all duration-300">Join Now</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* SEO-friendly Section */}
        <section className={`mb-16 text-center ${pageLoaded ? 'animate-fade-in-down' : 'opacity-0'}`}>
          <div className="inline-flex items-center px-4 py-2 bg-indigo-50 rounded-full text-indigo-700 text-sm font-bold mb-6 animate-pulse border border-indigo-100 shadow-sm">
            <SparklesIcon className="h-4 w-4 mr-2" />
            Find Your Perfect Specialist
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Consult with Expert <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">Verified Doctors</span>
          </h1>
          <p className="max-w-3xl mx-auto text-xl text-gray-600 leading-relaxed font-medium">
            Browse through our network of top-tier healthcare professionals. 
            Real-time availability, verified qualifications, and genuine patient reviews.
          </p>
          {!isLoading && (
            <p className="mt-4 text-indigo-600 font-bold bg-indigo-50 inline-block px-4 py-1 rounded-full text-sm">
              Currently showing {doctors?.length || 0} verified experts
            </p>
          )}
        </section>

        {/* Search and Filters */}
        <div className={`mb-12 sticky top-24 z-40 ${pageLoaded ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-indigo-100 border border-white p-6 md:p-8">
              <div className="flex flex-col md:flex-row lg:flex-row gap-4 w-full">
                <div className="flex-1 relative group">
                  <div className="absolute inset-y-0 left-0 pl-1 py-1 h-full flex items-center group-focus-within:text-indigo-600 transition-colors">
                    <div className="bg-gray-50 rounded-2xl p-3 ml-1 group-hover:bg-indigo-50 transition-colors">
                      <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 group-focus-within:text-indigo-600" />
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, reg no, or hospital..."
                    className="w-full pl-16 pr-6 py-5 bg-gray-50/50 border border-gray-100 rounded-3xl text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all text-lg font-medium outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="md:w-64 relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none group-focus-within:text-indigo-600 z-10">
                    <AdjustmentsVerticalIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <Combobox value={specialization} onChange={(val: string | null) => val && setSpecialization(val)}>
                    <div className="relative h-full">
                      <Combobox.Input
                        className="w-full pl-12 pr-10 py-5 bg-gray-50/50 border border-gray-100 rounded-3xl text-gray-700 font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all appearance-none text-lg outline-none"
                        displayValue={(val: string) => val === 'All' ? 'All Categories' : val}
                        onChange={(event) => setDeptQuery(event.target.value)}
                        placeholder="Search Dept..."
                      />
                      <Combobox.Button className="absolute inset-y-0 right-4 flex items-center">
                        <ChevronDownIcon className="h-5 w-5 text-gray-400 transition-transform group-focus-within:rotate-180" aria-hidden="true" />
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

                <div className="md:w-64 relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none group-focus-within:text-indigo-600">
                    <ArrowsUpDownIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <select
                    className="w-full pl-12 pr-10 py-5 bg-gray-50/50 border border-gray-100 rounded-3xl text-gray-700 font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all appearance-none text-lg cursor-pointer outline-none"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="all">All Ratings</option>
                    <option value="rating_desc">Highest Rated</option>
                    <option value="rating_asc">Lowest Rated</option>
                    <option value="reviews_desc">Most Reviews</option>
                    <option value="reviews_asc">Fewest Reviews</option>
                  </select>
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                    <ChevronRightIcon className="h-5 w-5 text-gray-400 rotate-90" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_: any, i: number) => (
              <div key={i} className="h-[400px] bg-white/50 rounded-3xl animate-pulse border border-white"></div>
            ))}
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ${pageLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '400ms' }}>
            {doctors && doctors.length > 0 ? (
              doctors.map((doctor: any, index: number) => (
                <div 
                  key={doctor.id} 
                  className="group bg-white/80 backdrop-blur-sm rounded-3xl border border-white shadow-xl hover:shadow-2xl hover:shadow-indigo-200/50 transition-all duration-500 overflow-hidden flex flex-col relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Doctor Image Header */}
                  <div className="relative h-48 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10Opacity-80"></div>
                    {doctor.user?.profileImage ? (
                      <img 
                        src={doctor.user.profileImage} 
                        alt={doctor.user.firstName}
                        className="w-full h-full object-cover transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                        <UserGroupIcon className="h-20 w-20 text-white/20" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 z-20">
                      <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5">
                        <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-bold text-gray-900 text-sm">{doctor.calculatedRating?.toFixed(1) || 'New'}</span>
                        {doctor.totalRatings > 0 && (
                          <span className="text-gray-500 text-[10px] font-bold">({doctor.totalRatings})</span>
                        )}
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 z-20">
                       <h2 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Dr. {doctor.user?.firstName} {doctor.user?.lastName}</h2>
                    </div>
                  </div>

                  {/* Doctor Details */}
                  <div className="p-6 flex-1 flex flex-col">
                    <p className="inline-flex items-center text-indigo-600 font-bold text-sm uppercase tracking-widest mb-4">
                      <AcademicCapIcon className="h-4 w-4 mr-2" />
                      {getDepartmentLabel(doctor.department)}
                    </p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-gray-600 group-hover:text-gray-900 transition-colors">
                        <MapPinIcon className="h-5 w-5 mr-3 text-indigo-400 transition-transform" />
                        <span className="font-medium">{doctor.hospital || 'Private Practice'}</span>
                      </div>
                      <div className="flex items-center text-gray-600 group-hover:text-gray-900 transition-colors">
                        <CalendarIcon className="h-5 w-5 mr-3 text-indigo-400 transition-transform" />
                        <span className="font-medium">{doctor.experience || 0} Years Experience</span>
                      </div>
                      <div className="flex items-center text-gray-600 group-hover:text-gray-900 transition-colors">
                        <ShieldCheckIcon className="h-5 w-5 mr-3 text-indigo-400 transition-transform" />
                        <span className="font-medium text-sm">Reg: {doctor.bmdcRegistrationNumber || 'N/A'}</span>
                      </div>
                    </div>

                    <p className="text-gray-500 text-sm line-clamp-3 mb-6 italic">
                      "{doctor.bio || 'Dedicated healthcare professional committed to providing exceptional care and personalized treatment plans for every patient.'}"
                    </p>

                    <div className="mt-auto space-y-3">
                      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                        <div>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Consultation Fee</p>
                           <p className="text-xl font-extrabold text-blue-600">৳{doctor.consultationFee || 0}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                           <CheckCircleIcon className="h-4 w-4 text-green-600" />
                           <span className="text-green-700 text-xs font-bold uppercase">Online Now</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => { setSelectedDoctor(doctor); setShowProfileModal(true); }}
                          className="flex items-center justify-center gap-2 py-3 bg-white text-gray-900 border-2 border-gray-100 rounded-2xl font-bold hover:bg-gray-50 transition-all"
                        >
                          About
                        </button>
                        <Link
                          to={user ? `/app/appointments?doctor=${doctor.id}` : `/login?redirect=/app/appointments&doctor=${doctor.id}`}
                          className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 transition-all group/btn"
                        >
                          Book visit
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                   <MagnifyingGlassIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Doctors Found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or specialization filter.</p>
                <button 
                  onClick={() => { setSearchTerm(''); setSpecialization('All'); setMinRating(0); setMinReviews(0); }}
                  className="mt-6 text-indigo-600 font-bold hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Doctor Profile Modal */}
      {showProfileModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-white/95 rounded-[40px] w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-scale-up border border-white/50">
            <button 
              onClick={() => setShowProfileModal(false)}
              className="absolute top-8 right-8 p-3 bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all z-20 group"
            >
              <XMarkIcon className="h-6 w-6 text-gray-600 group-hover:rotate-90 transition-transform duration-300" />
            </button>

            <div className="p-8 md:p-12">
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
                      <div className="w-full aspect-square bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[40px] relative z-10 border-4 border-white shadow-2xl flex items-center justify-center">
                        <UserGroupIcon className="h-32 w-32 text-white/20" />
                      </div>
                    )}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-4 border-white shadow-lg">
                      BMDC Verified
                    </div>
                  </div>

                  <div className="bg-gray-50/50 rounded-[32px] p-8 border border-gray-100 text-center">
                    <h2 className="text-3xl font-black text-gray-900 mb-2 leading-tight">Dr. {selectedDoctor.user?.firstName} {selectedDoctor.user?.lastName}</h2>
                    <p className="text-indigo-600 font-black text-sm uppercase tracking-[4px] mb-6">{getDepartmentLabel(selectedDoctor.department)}</p>
                    
                    <div className="flex flex-col gap-4">
                       <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-gray-100">
                          <span className="text-gray-400 font-bold text-xs uppercase">Experience</span>
                          <span className="text-gray-900 font-black">{selectedDoctor.experience || 0} Years</span>
                       </div>
                       <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-gray-100">
                          <span className="text-gray-400 font-bold text-xs uppercase">Consultation</span>
                          <span className="text-indigo-600 font-black">{formatCurrency(selectedDoctor.consultationFee || 0)}</span>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Right Content */}
                <div className="lg:col-span-8 space-y-10">
                  <div>
                    <h3 className="text-sm font-black text-gray-400 uppercase tracking-[4px] mb-4">Professional Bio</h3>
                    <p className="text-lg text-gray-600 leading-relaxed font-medium italic">
                      "{selectedDoctor.bio || 'Dedicated healthcare professional committed to providing exceptional care and personalized treatment plans for every patient.'}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-indigo-50/50 p-6 rounded-[32px] border border-indigo-100 flex items-start gap-4">
                      <div className="p-3 bg-indigo-100 rounded-2xl">
                        <MapPinIcon className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-indigo-400 uppercase mb-1">Chamber / Hospital</h4>
                        <p className="text-indigo-900 font-bold">{selectedDoctor.hospital || 'Private Clinic'}</p>
                      </div>
                    </div>
                    <div className="bg-emerald-50/50 p-6 rounded-[32px] border border-emerald-100 flex items-start gap-4">
                      <div className="p-3 bg-emerald-100 rounded-2xl">
                        <LanguageIcon className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-emerald-400 uppercase mb-1">Languages Spoken</h4>
                        <p className="text-emerald-900 font-bold">{selectedDoctor.languages?.join(', ') || 'English, Bengali'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Qualifications */}
                  {selectedDoctor.degrees && selectedDoctor.degrees.length > 0 && (
                    <div>
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-[4px] mb-6">Expertise & Degrees</h3>
                      <div className="flex flex-wrap gap-4">
                        {selectedDoctor.degrees.map((degree: string, i: number) => (
                          <div key={i} className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm">
                             <AcademicCapIcon className="h-5 w-5 text-indigo-500" />
                             <span className="font-bold text-gray-700">{degree}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Awards */}
                  {selectedDoctor.awards && selectedDoctor.awards.length > 0 && (
                    <div>
                      <h3 className="text-sm font-black text-gray-400 uppercase tracking-[4px] mb-6">Achievements</h3>
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
                  <div className="pt-8 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-8">
                       <div>
                          <h3 className="text-3xl font-black text-gray-900 tracking-tight">Patient Feedback</h3>
                          <p className="text-gray-500 font-medium">Verified reviews from our community</p>
                       </div>
                       <div className="text-right">
                          <div className="flex items-center gap-2 mb-1 justify-end">
                             <StarIcon className="h-6 w-6 text-yellow-400 fill-current" />
                             <span className="text-4xl font-black text-gray-900">{selectedDoctor.calculatedRating?.toFixed(1) || '0.0'}</span>
                          </div>
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{selectedDoctor.totalRatings || 0} VERIFIED REVIEWS</span>
                       </div>
                    </div>
                    
                    {/* DoctorRatings Component */}
                    <div className="bg-gray-50/50 rounded-[40px] p-2 border border-gray-100">
                       <DoctorRatings doctorId={selectedDoctor.id} showAll={true} />
                    </div>
                  </div>

                  <div className="flex pt-10">
                     <Link
                       to={user ? `/app/appointments?doctor=${selectedDoctor.id}` : `/login?redirect=/app/appointments&doctor=${selectedDoctor.id}`}
                       className="flex-1 py-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-[24px] font-black text-xl text-center shadow-2xl shadow-indigo-200 transition-all"
                     >
                       Confirm Booking
                     </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer (Simplified for Branding) */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
           <div className="flex justify-center items-center mb-6">
              <img src="/logo.png" className="h-10 w-10 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer" alt="Livora Logo" />
              <span className="ml-3 text-xl font-bold text-gray-400">Livora</span>
           </div>
           <p className="text-gray-500 text-sm font-medium">© 2026 Livora Healthcare. All rights reserved.</p>
           <div className="mt-4 flex justify-center space-x-6 text-sm font-semibold text-gray-400">
              <a href="#" className="hover:text-indigo-600">Privacy Policy</a>
              <a href="#" className="hover:text-indigo-600">Terms of Service</a>
              <a href="#" className="hover:text-indigo-600">Contact Support</a>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicDoctors;
