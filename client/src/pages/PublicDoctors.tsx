import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import API from '../api/api';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  AcademicCapIcon,
  UserGroupIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  CalendarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const PublicDoctors: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [specialization, setSpecialization] = useState('All');
  const [pageLoaded, setPageLoaded] = useState(false);

  React.useEffect(() => {
    setPageLoaded(true);
  }, []);

  const { data: doctors, isLoading } = useQuery({
    queryKey: ['public-doctors', searchTerm, specialization],
    queryFn: async () => {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (specialization !== 'All') params.specialization = specialization;
      
      const response = await API.get('/doctors', { params });
      return response.data.data.doctors;
    }
  });

  const specializations = [
    'All',
    'Cardiology',
    'Dermatology',
    'Neurology',
    'Pediatrics',
    'Orthopedics',
    'Medicine',
    'Surgery',
    'Psychiatry'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 selection:bg-indigo-500 selection:text-white">
      {/* Header / Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/50 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center group transition-all duration-500 hover:scale-105">
              <div className="relative group">
                <div className="absolute inset-0 bg-blue-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <img src="/logo.png" className="h-14 w-14 relative z-10" alt="Livora Logo" />
              </div>
              <span className="ml-3 text-2xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-blue-900 bg-clip-text text-transparent">Livora</span>
            </Link>
            <div className="flex items-center space-x-6">
              <Link to="/login" className="text-gray-600 font-semibold hover:text-indigo-600 transition-colors">Sign In</Link>
              <Link to="/register" className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-2.5 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 hover:scale-110 active:scale-95 transition-all duration-300">Join Now</Link>
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
        </section>

        {/* Search and Filters */}
        <div className={`mb-12 sticky top-24 z-40 ${pageLoaded ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '200ms' }}>
          <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-indigo-100 border border-white p-6 md:p-8">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 relative group">
                <div className="absolute inset-y-0 left-0 pl-1 py-1 h-full flex items-center group-focus-within:text-indigo-600 transition-colors">
                  <div className="bg-gray-50 rounded-2xl p-3 ml-1 group-hover:bg-indigo-50 transition-colors">
                    <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 group-focus-within:text-indigo-600" />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Search by name, specialty, or clinic..."
                  className="w-full pl-16 pr-6 py-6 bg-gray-50/50 border-none rounded-3xl text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all text-lg font-medium"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex gap-2">
                   <div className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-100">BMDC Verified</div>
                   <div className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-100">Top Rated</div>
                </div>
              </div>
              
              <div className="lg:w-72 relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none group-focus-within:text-indigo-600">
                  <AdjustmentsHorizontalIcon className="h-6 w-6 text-gray-400" />
                </div>
                <select
                  className="w-full pl-12 pr-10 py-6 bg-gray-50/50 border-none rounded-3xl text-gray-700 font-semibold focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all appearance-none text-lg cursor-pointer"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                >
                  {specializations.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <ChevronRightIcon className="h-5 w-5 text-gray-400 rotate-90" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[400px] bg-white/50 rounded-3xl animate-pulse border border-white"></div>
            ))}
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 ${pageLoaded ? 'animate-fade-in' : 'opacity-0'}`} style={{ animationDelay: '400ms' }}>
            {doctors && doctors.length > 0 ? (
              doctors.map((doctor: any, index: number) => (
                <div 
                  key={doctor.id} 
                  className="group bg-white/80 backdrop-blur-sm rounded-3xl border border-white shadow-xl hover:shadow-2xl hover:shadow-indigo-200/50 transition-all duration-500 hover:-translate-y-3 overflow-hidden flex flex-col relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Doctor Image Header */}
                  <div className="relative h-48 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10Opacity-80"></div>
                    {doctor.user?.profileImage ? (
                      <img 
                        src={doctor.user.profileImage} 
                        alt={doctor.user.firstName}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                        <UserGroupIcon className="h-20 w-20 text-white/20" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 z-20">
                      <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1">
                        <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-bold text-gray-900 text-sm">{doctor.averageRating || 'New'}</span>
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
                      {doctor.specialization}
                    </p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-gray-600 group-hover:text-gray-900 transition-colors">
                        <MapPinIcon className="h-5 w-5 mr-3 text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">{doctor.hospital || 'Private Practice'}</span>
                      </div>
                      <div className="flex items-center text-gray-600 group-hover:text-gray-900 transition-colors">
                        <CalendarIcon className="h-5 w-5 mr-3 text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">{doctor.experience || 0} Years Experience</span>
                      </div>
                      <div className="flex items-center text-gray-600 group-hover:text-gray-900 transition-colors">
                        <ShieldCheckIcon className="h-5 w-5 mr-3 text-indigo-400 group-hover:scale-110 transition-transform" />
                        <span className="font-medium text-sm">Reg: {doctor.bmdcRegistrationNumber || 'N/A'}</span>
                      </div>
                    </div>

                    <p className="text-gray-500 text-sm line-clamp-3 mb-6 italic">
                      "{doctor.bio || 'Dedicated healthcare professional committed to providing exceptional care and personalized treatment plans for every patient.'}"
                    </p>

                    <div className="mt-auto space-y-4">
                      <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                        <div>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Consultation Fee</p>
                           <p className="text-2xl font-extrabold text-blue-600">৳{doctor.consultationFee || 0}</p>
                        </div>
                        <div className="flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                           <CheckCircleIcon className="h-4 w-4 text-green-600" />
                           <span className="text-green-700 text-xs font-bold uppercase">Online Now</span>
                        </div>
                      </div>

                      <Link
                        to={`/login?redirect=/app/appointments&doctor=${doctor.id}`}
                        className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:from-indigo-700 hover:to-blue-700 hover:scale-105 active:scale-[0.98] transition-all group/btn"
                      >
                        Book Appointment
                        <ChevronRightIcon className="h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                      </Link>
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
                  onClick={() => { setSearchTerm(''); setSpecialization('All'); }}
                  className="mt-6 text-indigo-600 font-bold hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>

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
