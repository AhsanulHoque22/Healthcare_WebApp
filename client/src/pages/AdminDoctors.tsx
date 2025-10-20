import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  StarIcon,
  MapPinIcon,
  AcademicCapIcon,
  FunnelIcon,
  ArrowPathIcon,
  UserIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ClockIcon,
  CheckBadgeIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  HeartIcon,
  ChartBarIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { MEDICAL_DEPARTMENTS, getDepartmentLabel } from '../utils/departments';

interface Doctor {
  id: number;
  bmdcRegistrationNumber: string;
  department: string;
  experience: number;
  isVerified: boolean;
  bio: string;
  profileImage?: string;
  degrees: string[];
  hospital: string;
  location: string;
  consultationFee: number;
  calculatedRating?: number;
  totalRatings?: number;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    isActive: boolean;
    emailVerified: boolean;
    lastLogin: string;
  };
}

const AdminDoctors: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch doctors with pagination and filters
  const { data: doctorsData, isLoading, error } = useQuery({
    queryKey: ['admin-doctors', page, searchTerm, verificationFilter, departmentFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(verificationFilter && { isVerified: verificationFilter }),
        ...(departmentFilter && { department: departmentFilter }),
      });
      const response = await axios.get(`/admin/doctors?${params}`);
      return response.data.data;
    },
  });

  // Verify doctor mutation
  const verifyDoctorMutation = useMutation({
    mutationFn: async ({ doctorId, isVerified }: { doctorId: number; isVerified: boolean }) => {
      const response = await axios.put(`/admin/doctors/${doctorId}/verify`, { isVerified });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctors'] });
      toast.success('Doctor verification status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update verification status');
    },
  });

  const handleVerificationToggle = (doctor: Doctor) => {
    verifyDoctorMutation.mutate({
      doctorId: doctor.id,
      isVerified: !doctor.isVerified,
    });
  };

  const handleViewDoctor = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorModal(true);
  };

  const getVerificationBadgeColor = (isVerified: boolean) => {
    return isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/15 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl animate-pulse delay-300"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-violet-500/15 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>



      <div className="relative z-10 p-6 space-y-8">
        {/* Modern Welcome Header */}
        <div className={`relative group overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] ${pageLoaded ? 'animate-fade-in-down' : ''}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/5"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-500"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-blue-200/30 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                  <div className="relative p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <div className="relative">
                      <HeartIcon className="h-8 w-8 text-white animate-pulse" />
                      <SparklesIcon className="h-4 w-4 text-white/70 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                  </div>
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight mb-2">
                    Doctor Management 👨‍⚕️
                  </h1>
                  <p className="text-indigo-100 text-lg">
                    Comprehensive doctor administration and verification management
                  </p>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-purple-200/20 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                  <div className="relative w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300 animate-bounce-in">
                    <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center relative">
                      <UserGroupIcon className="h-8 w-8 text-white" />
                      <SparklesIcon className="h-4 w-4 text-white/70 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards with Glassmorphism */}
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
          {/* Total Doctors Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-blue-200 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-600 mb-2">Total Doctors</p>
                  <p className="text-3xl font-bold text-gray-900">{doctorsData?.pagination?.totalRecords || 0}</p>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-500 shadow-lg">
                  <UserGroupIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Verified Doctors Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-200 to-green-200 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-600 mb-2">Verified</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {doctorsData?.doctors?.filter((d: Doctor) => d.isVerified).length || 0}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 shadow-lg">
                  <CheckCircleIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Pending Verification Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-yellow-200 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-600 mb-2">Pending</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {doctorsData?.doctors?.filter((d: Doctor) => !d.isVerified).length || 0}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 shadow-lg">
                  <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Departments Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-600 mb-2">Departments</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {new Set(doctorsData?.doctors?.map((d: Doctor) => d.department)).size || 0}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters and Search with Glassmorphism */}
        <div className={`relative group ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
          <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-300 hover:shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl shadow-lg">
                <FunnelIcon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Doctor Directory</h3>
            </div>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <MagnifyingGlassIcon className="h-4 w-4 text-white" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search doctors by name, email, or BMDC number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-white/40 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  className="px-4 py-3 border border-white/40 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:bg-white/70 cursor-pointer"
                >
                  <option value="">All Status</option>
                  <option value="true">Verified</option>
                  <option value="false">Pending Verification</option>
                </select>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-4 py-3 border border-white/40 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 hover:bg-white/70 cursor-pointer"
                >
                  <option value="">All Departments</option>
                  {MEDICAL_DEPARTMENTS.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
                <button className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <div className="relative z-10 flex items-center gap-2">
                    <ArrowPathIcon className="h-4 w-4" />
                    Refresh
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className={`relative group ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-200/40 to-indigo-200/40 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center animate-pulse">
                    <UserGroupIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">Loading Doctors</h3>
                  <p className="text-gray-600 text-sm">Fetching doctor information...</p>
                </div>
              </div>

              {/* Skeleton loading cards */}
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-200/50 rounded-xl p-4 flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-300/50 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300/50 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300/50 rounded w-1/2"></div>
                      </div>
                      <div className="w-20 h-6 bg-gray-300/50 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : error ? (
          <div className={`relative group ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-red-200 to-pink-200 rounded-2xl blur-xl opacity-20"></div>
            <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-12 text-center">
              <div className="text-red-400 mb-6 animate-bounce">
                <ExclamationTriangleIcon className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Doctors</h3>
              <p className="text-red-600 font-medium">Unable to fetch doctor data. Please try again later.</p>
            </div>
          </div>
        ) : !doctorsData?.doctors || doctorsData.doctors.length === 0 ? (
          <div className={`relative group ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-20"></div>
            <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-12 text-center">
              <div className="text-purple-400 mb-6 animate-bounce">
                <UserGroupIcon className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Doctors Found</h3>
              <p className="text-purple-600 font-medium">
                {searchTerm || departmentFilter || verificationFilter
                  ? 'Try adjusting your search criteria or filters.'
                  : 'No doctors have been registered yet.'}
              </p>
            </div>
          </div>
        ) : (
          <div className={`relative group ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-20"></div>
            <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Doctor Profile
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Department & Experience
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Verification Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Rating & Reviews
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/20">
                    {doctorsData.doctors.map((doctor: Doctor, index: number) => (
                      <tr key={doctor.id} className="hover:bg-white/30 transition-all duration-300 group">
                        <td className="px-6 py-6">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              {doctor.profileImage ? (
                                <img
                                  src={`http://localhost:5000${doctor.profileImage}`}
                                  alt={`Dr. ${doctor.user.firstName} ${doctor.user.lastName}`}
                                  className="h-14 w-14 rounded-full object-cover ring-2 ring-purple-200 shadow-lg"
                                />
                              ) : (
                                <div className="h-14 w-14 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center ring-2 ring-purple-200 shadow-lg">
                                  <span className="text-sm font-bold text-purple-700">
                                    {doctor.user.firstName.charAt(0)}{doctor.user.lastName.charAt(0)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-gray-900">
                                Dr. {doctor.user.firstName} {doctor.user.lastName}
                              </div>
                              <div className="text-sm text-gray-600 font-medium">{doctor.user.email}</div>
                              <div className="text-xs text-gray-500 flex items-center mt-1 bg-purple-50 px-2 py-1 rounded-lg">
                                <ShieldCheckIcon className="h-3 w-3 mr-1 text-purple-500" />
                                BMDC: {doctor.bmdcRegistrationNumber}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="space-y-2">
                            <div className="text-sm font-bold text-gray-900 bg-purple-50 px-3 py-1 rounded-lg">
                              {getDepartmentLabel(doctor.department) || 'General Medicine'}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center bg-gray-50 px-2 py-1 rounded-lg">
                              <CalendarIcon className="h-3 w-3 mr-1 text-purple-500" />
                              {doctor.experience} years experience
                            </div>
                            {doctor.hospital && (
                              <div className="text-xs text-gray-500 flex items-center bg-blue-50 px-2 py-1 rounded-lg">
                                <BuildingOfficeIcon className="h-3 w-3 mr-1 text-blue-500" />
                                {doctor.hospital}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center space-x-2">
                            <span className={`px-4 py-2 inline-flex text-xs font-bold rounded-xl backdrop-blur-sm border ${
                              doctor.isVerified
                                ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300/50'
                                : 'bg-amber-100/80 text-amber-800 border-amber-300/50'
                            }`}>
                              {doctor.isVerified ? 'Verified' : 'Pending'}
                            </span>
                            {doctor.isVerified ? (
                              <CheckBadgeIcon className="h-5 w-5 text-emerald-500" title="Verified" />
                            ) : (
                              <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" title="Pending Verification" />
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-6">
                          {(doctor.calculatedRating || 0) > 0 ? (
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-lg">
                                <StarIcon className="h-4 w-4 text-yellow-500 mr-1" />
                                <span className="text-sm font-bold text-gray-900">
                                  {doctor.calculatedRating?.toFixed(1)}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg">
                                ({doctor.totalRatings} reviews)
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-lg">No ratings yet</span>
                          )}
                        </td>
                        <td className="px-6 py-6">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewDoctor(doctor)}
                              className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                            >
                              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                              <EyeIcon className="h-4 w-4 relative z-10" />
                              <span className="relative z-10">View</span>
                            </button>
                            <button
                              onClick={() => handleVerificationToggle(doctor)}
                              className={`group relative overflow-hidden px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                                doctor.isVerified
                                  ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white'
                                  : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white'
                              }`}
                              disabled={verifyDoctorMutation.isPending}
                            >
                              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                              {doctor.isVerified ? (
                                <>
                                  <XCircleIcon className="h-4 w-4 relative z-10" />
                                  <span className="relative z-10">Unverify</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircleIcon className="h-4 w-4 relative z-10" />
                                  <span className="relative z-10">Verify</span>
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4 p-6">
                {doctorsData.doctors.map((doctor: Doctor) => (
                  <div key={doctor.id} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
                    <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      {doctor.profileImage ? (
                        <img
                          src={`http://localhost:5000${doctor.profileImage}`}
                          alt={`Dr. ${doctor.user.firstName} ${doctor.user.lastName}`}
                          className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-100"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center ring-2 ring-gray-100">
                          <span className="text-lg font-bold text-blue-700">
                            {doctor.user.firstName.charAt(0)}{doctor.user.lastName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Dr. {doctor.user.firstName} {doctor.user.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{doctor.user.email}</p>
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                          <ShieldCheckIcon className="h-3 w-3 mr-1" />
                          BMDC: {doctor.bmdcRegistrationNumber}
                        </p>
                      </div>
                    </div>
                    <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Department</p>
                      <p className="text-sm text-gray-900">{getDepartmentLabel(doctor.department) || 'General Medicine'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</p>
                      <p className="text-sm text-gray-900">{doctor.experience} years</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getVerificationBadgeColor(doctor.isVerified)}`}>
                        {doctor.isVerified ? 'Verified' : 'Pending'}
                      </span>
                      {doctor.isVerified ? (
                        <CheckBadgeIcon className="h-4 w-4 text-green-500" />
                      ) : (
                        <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>

                    {(doctor.calculatedRating || 0) > 0 && (
                      <div className="flex items-center">
                        <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                        <span className="text-sm font-semibold text-gray-900">
                          {doctor.calculatedRating?.toFixed(1)}
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({doctor.totalRatings})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleViewDoctor(doctor)}
                      className="flex-1 mr-2 inline-flex items-center justify-center px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 mr-2" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleVerificationToggle(doctor)}
                      className={`flex-1 inline-flex items-center justify-center px-4 py-2 rounded-lg transition-colors ${
                        doctor.isVerified
                          ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                          : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                      }`}
                      disabled={verifyDoctorMutation.isPending}
                    >
                      {doctor.isVerified ? (
                        <>
                          <XCircleIcon className="h-4 w-4 mr-2" />
                          Unverify
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-4 w-4 mr-2" />
                          Verify
                        </>
                      )}
                    </button>
                  </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Pagination */}
            {doctorsData.pagination && doctorsData.pagination.totalPages > 1 && (
              <div className={`relative group ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-20"></div>
                <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm font-bold text-gray-700">
                      Showing page <span className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{doctorsData.pagination.currentPage}</span> of{' '}
                      <span className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{doctorsData.pagination.totalPages}</span>
                      <span className="text-gray-500 ml-1">({doctorsData.pagination.totalRecords} total doctors)</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={!doctorsData.pagination.hasPrev}
                        className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <span className="relative z-10">Previous</span>
                      </button>

                      {/* Page Numbers */}
                      <div className="hidden sm:flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, doctorsData.pagination.totalPages) }, (_, i) => {
                          const pageNum = Math.max(1, Math.min(doctorsData.pagination.totalPages - 4, doctorsData.pagination.currentPage - 2)) + i;
                          if (pageNum > doctorsData.pagination.totalPages) return null;

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`px-3 py-2 text-sm font-bold rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                                pageNum === doctorsData.pagination.currentPage
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                  : 'bg-white/50 backdrop-blur-sm text-gray-700 border border-white/40 hover:bg-white/70'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={!doctorsData.pagination.hasNext}
                        className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                      >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                        <span className="relative z-10">Next</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Doctor Detail Modal with Glassmorphism */}
      {showDoctorModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="relative group max-w-5xl w-full max-h-[95vh]">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-3xl blur-xl opacity-50"></div>
            <div className="relative bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
              {/* Enhanced Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 rounded-t-3xl">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    {selectedDoctor.profileImage ? (
                      <img
                        src={`http://localhost:5000${selectedDoctor.profileImage}`}
                        alt={`Dr. ${selectedDoctor.user.firstName} ${selectedDoctor.user.lastName}`}
                        className="h-20 w-20 rounded-full object-cover ring-4 ring-white/30 shadow-lg"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30 shadow-lg">
                        <span className="text-2xl font-bold text-white">
                          {selectedDoctor.user.firstName.charAt(0)}{selectedDoctor.user.lastName.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Dr. {selectedDoctor.user.firstName} {selectedDoctor.user.lastName}
                      </h2>
                      <p className="text-blue-100">
                        {getDepartmentLabel(selectedDoctor.department) || 'General Medicine'}
                      </p>
                      <div className="flex items-center mt-2">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          selectedDoctor.isVerified
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedDoctor.isVerified ? 'Verified Doctor' : 'Pending Verification'}
                        </span>
                        {(selectedDoctor.calculatedRating || 0) > 0 && (
                          <div className="flex items-center ml-3 text-white">
                            <StarIcon className="h-4 w-4 text-yellow-300 mr-1" />
                            <span className="text-sm font-medium">
                              {selectedDoctor.calculatedRating?.toFixed(1)}
                              {selectedDoctor.totalRatings && selectedDoctor.totalRatings > 0 && (
                                <span className="text-blue-200 ml-1">({selectedDoctor.totalRatings} reviews)</span>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDoctorModal(false)}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Personal Information */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                        Personal Information
                      </h3>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4">
                          <label className="text-sm font-medium text-gray-500 block mb-1">Email Address</label>
                          <p className="text-gray-900">{selectedDoctor.user.email}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <label className="text-sm font-medium text-gray-500 block mb-1">Phone Number</label>
                          <p className="text-gray-900">{selectedDoctor.user.phone || 'Not provided'}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <label className="text-sm font-medium text-gray-500 block mb-1">BMDC Registration</label>
                          <p className="text-gray-900 font-mono">{selectedDoctor.bmdcRegistrationNumber}</p>
                        </div>
                        <div className="bg-white rounded-lg p-4">
                          <label className="text-sm font-medium text-gray-500 block mb-1">Experience</label>
                          <p className="text-gray-900">{selectedDoctor.experience} years</p>
                        </div>
                      </div>
                    </div>

                  {/* Professional Information */}
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <BuildingOfficeIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Professional Information
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-sm font-medium text-gray-500 block mb-1">Department</label>
                        <p className="text-gray-900">{getDepartmentLabel(selectedDoctor.department) || 'General Medicine'}</p>
                      </div>
                      {selectedDoctor.hospital && (
                        <div className="bg-white rounded-lg p-4">
                          <label className="text-sm font-medium text-gray-500 block mb-1">Hospital/Clinic</label>
                          <p className="text-gray-900">{selectedDoctor.hospital}</p>
                        </div>
                      )}
                      {selectedDoctor.location && (
                        <div className="bg-white rounded-lg p-4">
                          <label className="text-sm font-medium text-gray-500 block mb-1">Location</label>
                          <p className="text-gray-900 flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                            {selectedDoctor.location}
                          </p>
                        </div>
                      )}
                      {selectedDoctor.consultationFee && (
                        <div className="bg-white rounded-lg p-4">
                          <label className="text-sm font-medium text-gray-500 block mb-1">Consultation Fee</label>
                          <p className="text-gray-900">৳{selectedDoctor.consultationFee}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-6">
                  {/* Qualifications */}
                  {selectedDoctor.degrees && selectedDoctor.degrees.length > 0 && (
                    <div className="bg-green-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <AcademicCapIcon className="h-5 w-5 mr-2 text-green-600" />
                        Qualifications
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedDoctor.degrees.map((degree, index) => (
                          <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium">
                            {degree}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bio */}
                  {selectedDoctor.bio && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">About Doctor</h3>
                      <p className="text-gray-700 leading-relaxed">{selectedDoctor.bio}</p>
                    </div>
                  )}

                  {/* Account Status */}
                  <div className="bg-purple-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <ShieldCheckIcon className="h-5 w-5 mr-2 text-purple-600" />
                      Account Status
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-sm font-medium text-gray-500 block mb-1">Account Status</label>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${selectedDoctor.user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <p className={`text-sm font-semibold ${selectedDoctor.user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedDoctor.user.isActive ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-sm font-medium text-gray-500 block mb-1">Email Verified</label>
                        <div className="flex items-center">
                          {selectedDoctor.user.emailVerified ? (
                            <CheckBadgeIcon className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XMarkIcon className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <p className={`text-sm font-semibold ${selectedDoctor.user.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedDoctor.user.emailVerified ? 'Verified' : 'Not Verified'}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-sm font-medium text-gray-500 block mb-1">Last Login</label>
                        <p className="text-gray-900 flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedDoctor.user.lastLogin ? new Date(selectedDoctor.user.lastLogin).toLocaleString() : 'Never'}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-sm font-medium text-gray-500 block mb-1">Member Since</label>
                        <p className="text-gray-900 flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(selectedDoctor.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-8 flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowDoctorModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleVerificationToggle(selectedDoctor)}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    selectedDoctor.isVerified
                      ? 'text-red-700 bg-red-100 hover:bg-red-200'
                      : 'text-green-700 bg-green-100 hover:bg-green-200'
                  }`}
                  disabled={verifyDoctorMutation.isPending}
                >
                  {selectedDoctor.isVerified ? 'Unverify Doctor' : 'Verify Doctor'}
                </button>
              </div>
            </div>
          </div>
        </div>
    </div>)
    }
  </div>
  );
};

export default AdminDoctors;
