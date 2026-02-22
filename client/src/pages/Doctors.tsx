import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { formatCurrency } from '../services/paymentService';
import { 
  UserGroupIcon, 
  StarIcon, 
  MapPinIcon, 
  ClockIcon, 
  AcademicCapIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  LanguageIcon,
  XMarkIcon,
  EyeIcon,
  CalendarIcon,
  FunnelIcon,
  HeartIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { MEDICAL_DEPARTMENTS, getDepartmentLabel } from '../utils/departments';

interface Doctor {
  id: number;
  bmdcRegistrationNumber: string;
  department: string;
  experience: number;
  rating: number;
  calculatedRating?: number;
  totalRatings?: number;
  bio: string;
  profileImage?: string;
  degrees: string[];
  awards: string[];
  hospital: string;
  location: string;
  chamberTimes: {
    [key: string]: string[];
  };
  consultationFee: number;
  languages: string[];
  services: string[];
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

const Doctors: React.FC = () => {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [pageLoaded, setPageLoaded] = useState(false);

  // Page load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: doctors, isLoading, error } = useQuery<Doctor[]>({
    queryKey: ['doctors', departmentFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (departmentFilter) {
        params.append('department', departmentFilter);
      }
      const response = await axios.get(`/doctors?${params}`);
      return response.data.data.doctors;
    },
  });

  const handleViewProfile = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="space-y-6 p-6">
        {/* Modern Header */}
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white shadow-2xl ${pageLoaded ? 'animate-fade-in-down' : ''}`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center">
                  <UserGroupIcon className="h-10 w-10 mr-3" />
                  Find Doctors
                </h1>
                <p className="text-indigo-100 text-lg">
                  Browse our network of qualified healthcare professionals.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                  <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center relative">
                    <HeartIcon className="h-8 w-8 text-white" />
                    <SparklesIcon className="h-4 w-4 text-white/70 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* Modern Department Filter */}
        <div className={`bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50 ${pageLoaded ? 'animate-fade-in' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <FunnelIcon className="h-5 w-5 text-indigo-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">Filter Doctors</h3>
            </div>
            <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">🔍</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="department-filter" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
              Department:
            </label>
            <select
              id="department-filter"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm text-sm hover:shadow-md focus:shadow-lg"
            >
              <option value="">All Departments</option>
              {MEDICAL_DEPARTMENTS.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 ${pageLoaded ? 'animate-fade-in' : ''}`}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 text-center ${pageLoaded ? 'animate-fade-in' : ''}`}>
            <div className="w-16 h-16 bg-gradient-to-r from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XMarkIcon className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-gray-600 text-lg">Unable to load doctors. Please try again later.</p>
          </div>
        ) : !doctors || doctors.length === 0 ? (
          <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-12 shadow-lg border border-white/50 text-center ${pageLoaded ? 'animate-fade-in' : ''}`}>
            <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserGroupIcon className="h-12 w-12 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No doctors available</h3>
            <p className="text-gray-600">No doctors are available at the moment.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
            {doctors.map((doctor, index) => (
              <div
                key={doctor.id}
                className="relative group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/20 to-purple-200/20 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-2">
                {/* Header with Doctor Info */}
                <div className="flex items-start mb-6">
                  <div className="flex-shrink-0">
                    {doctor.profileImage ? (
                      <img
                        src={doctor.profileImage}
                        alt={`Dr. ${doctor.user.firstName} ${doctor.user.lastName}`}
                        className="h-20 w-20 rounded-full object-cover border-4 border-white shadow-lg group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="h-20 w-20 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <UserGroupIcon className="h-10 w-10 text-indigo-600 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 truncate">
                      Dr. {doctor.user.firstName} {doctor.user.lastName}
                    </h3>
                    <p className="text-base text-indigo-600 font-medium">
                      {getDepartmentLabel(doctor.department) || 'General Medicine'}
                    </p>
                    {(doctor.calculatedRating || 0) > 0 && (
                      <div className="flex items-center mt-2">
                        <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm text-gray-600 font-medium">
                          {doctor.calculatedRating?.toFixed(1)} 
                          {doctor.totalRatings && doctor.totalRatings > 0 && (
                            <span className="text-gray-500 ml-1">({doctor.totalRatings} reviews)</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Doctor Details */}
                <div className="space-y-3 mb-6">
                  {doctor.hospital && (
                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      <MapPinIcon className="h-4 w-4 mr-3 text-indigo-600 flex-shrink-0" />
                      <span className="font-medium">{doctor.hospital}</span>
                    </div>
                  )}
                  {doctor.experience && (
                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      <ClockIcon className="h-4 w-4 mr-3 text-emerald-600 flex-shrink-0" />
                      <span className="font-medium">{doctor.experience} years experience</span>
                    </div>
                  )}
                  {doctor.consultationFee && (
                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                      <CurrencyDollarIcon className="h-4 w-4 mr-3 text-green-600 flex-shrink-0" />
                      <span className="font-semibold text-lg">{formatCurrency(doctor.consultationFee)}</span>
                    </div>
                  )}
                </div>

                {/* Bio */}
                {doctor.bio && (
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200/50 leading-relaxed">
                      {doctor.bio.length > 200 ? `${doctor.bio.substring(0, 200)}...` : doctor.bio}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      // Navigate to appointments page with doctor pre-selected
                      window.location.href = '/app/appointments?doctorId=' + doctor.id;
                    }}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-110 shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm animate-pulse"
                  >
                    <CalendarIcon className="h-4 w-4" />
                    Book Appointment
                  </button>
                  <button 
                    onClick={() => handleViewProfile(doctor)}
                    className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 hover:scale-110 hover:shadow-md flex items-center gap-2 text-sm animate-bounce"
                  >
                    <EyeIcon className="h-4 w-4" />
                    View Profile
                  </button>
                </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modern Doctor Profile Modal */}
        {showModal && selectedDoctor && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <UserGroupIcon className="h-6 w-6 mr-2 text-indigo-600" />
                  Doctor Profile
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-all duration-300 p-2 hover:bg-gray-100 rounded-full hover:scale-110 hover:shadow-md"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Image and Basic Info */}
              <div className="lg:col-span-1">
                <div className="text-center">
                  {selectedDoctor.profileImage ? (
                    <img
                      src={selectedDoctor.profileImage}
                      alt={`Dr. ${selectedDoctor.user.firstName} ${selectedDoctor.user.lastName}`}
                      className="h-32 w-32 rounded-full object-cover mx-auto mb-4"
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                      <UserGroupIcon className="h-16 w-16 text-primary-600" />
                    </div>
                  )}
                  <h3 className="text-xl font-semibold text-gray-900">
                    Dr. {selectedDoctor.user.firstName} {selectedDoctor.user.lastName}
                  </h3>
                    <p className="text-primary-600">
                      {getDepartmentLabel(selectedDoctor.department) || 'General Medicine'}
                    </p>
                  {(selectedDoctor.calculatedRating || 0) > 0 && (
                    <div className="flex items-center justify-center mt-2">
                      <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                      <span className="text-gray-600">
                        {selectedDoctor.calculatedRating?.toFixed(1)}
                        {selectedDoctor.totalRatings && selectedDoctor.totalRatings > 0 && (
                          <span className="text-gray-500 ml-1">({selectedDoctor.totalRatings} reviews)</span>
                        )}
                      </span>
                    </div>
                  )}
                  {/* BMDC Registration Number */}
                  {selectedDoctor.bmdcRegistrationNumber && (
                    <div className="mt-3 p-2 bg-blue-50 rounded">
                      <p className="text-xs text-blue-600 font-medium">BMDC Reg. No.</p>
                      <p className="text-blue-800 font-semibold">{selectedDoctor.bmdcRegistrationNumber}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Information */}
              <div className="lg:col-span-2 space-y-6">
                {/* Hospital & Location */}
                {(selectedDoctor.hospital || selectedDoctor.location) && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <MapPinIcon className="h-5 w-5 mr-2" />
                      Location
                    </h4>
                    {selectedDoctor.hospital && (
                      <p className="text-gray-700 font-medium">{selectedDoctor.hospital}</p>
                    )}
                    {selectedDoctor.location && (
                      <p className="text-gray-600">{selectedDoctor.location}</p>
                    )}
                  </div>
                )}

                {/* Chamber Times */}
                {Object.keys(selectedDoctor.chamberTimes || {}).length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <ClockIcon className="h-5 w-5 mr-2" />
                      Available Times
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedDoctor.chamberTimes).map(([day, times]) => (
                        times.length > 0 && (
                          <div key={day} className="text-sm">
                            <span className="font-medium text-gray-700">{day}:</span>
                            <div className="text-gray-600">
                              {times.join(', ')}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}

                {/* Degrees */}
                {selectedDoctor.degrees && selectedDoctor.degrees.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <AcademicCapIcon className="h-5 w-5 mr-2" />
                      Qualifications
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDoctor.degrees.map((degree, index) => (
                        <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                          {degree}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Awards */}
                {selectedDoctor.awards && selectedDoctor.awards.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <TrophyIcon className="h-5 w-5 mr-2" />
                      Awards & Recognitions
                    </h4>
                    <div className="space-y-1">
                      {selectedDoctor.awards.map((award, index) => (
                        <p key={index} className="text-gray-700 text-sm">• {award}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {selectedDoctor.languages && selectedDoctor.languages.length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <LanguageIcon className="h-5 w-5 mr-2" />
                      Languages
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDoctor.languages.map((language, index) => (
                        <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">
                          {language}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Services */}
                {selectedDoctor.services && selectedDoctor.services.length > 0 && (
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Medical Services</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDoctor.services.map((service, index) => (
                        <span key={index} className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bio */}
                {selectedDoctor.bio && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">About</h4>
                    <p className="text-gray-700">{selectedDoctor.bio}</p>
                  </div>
                )}

                {/* Consultation Fee */}
                {selectedDoctor.consultationFee && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                      Consultation Fee
                    </h4>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedDoctor.consultationFee)}</p>
                  </div>
                )}
              </div>
            </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 hover:scale-110 hover:shadow-md"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    setShowModal(false);
                    // Navigate to appointments page with doctor pre-selected
                    window.location.href = '/app/appointments?doctorId=' + selectedDoctor.id;
                  }}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl flex items-center gap-2 animate-pulse"
                >
                  <CalendarIcon className="h-5 w-5" />
                  Book Appointment
                </button>
              </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Doctors;
