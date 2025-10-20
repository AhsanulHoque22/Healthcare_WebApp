import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  CalendarIcon,
  DocumentTextIcon,
  HeartIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  UserIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckBadgeIcon,
  XMarkIcon,
  EllipsisVerticalIcon,
  MapPinIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface Patient {
  id: number;
  bloodType: string;
  allergies: string;
  emergencyContact: string;
  emergencyPhone: string;
  insuranceProvider: string;
  insuranceNumber: string;
  medicalHistory: string;
  currentMedications: string;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    isActive: boolean;
    emailVerified: boolean;
    lastLogin: string;
  };
  appointments?: Array<{
    id: number;
    appointmentDate: string;
    status: string;
    doctor: {
      user: {
        firstName: string;
        lastName: string;
      };
    };
  }>;
}

const AdminPatients: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const queryClient = useQueryClient();

  // Page load animation
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

  // Fetch patients with pagination and filters
  const { data: patientsData, isLoading, error } = useQuery({
    queryKey: ['admin-patients', page, searchTerm, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { isActive: statusFilter }),
      });
      const response = await axios.get(`/admin/patients?${params}`);
      return response.data.data;
    },
  });

  // Update patient status mutation
  const updatePatientStatusMutation = useMutation({
    mutationFn: async ({ patientId, isActive }: { patientId: number; isActive: boolean }) => {
      const response = await axios.put(`/admin/patients/${patientId}/status`, { isActive });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-patients'] });
      toast.success('Patient status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update patient status');
    },
  });

  const handleStatusToggle = (patient: Patient) => {
    updatePatientStatusMutation.mutate({
      patientId: patient.user.id,
      isActive: !patient.user.isActive,
    });
  };

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-emerald-400/15 to-blue-400/15 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-gradient-to-tl from-violet-400/15 to-indigo-400/15 rounded-full blur-2xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 p-6 space-y-8">
        {/* Modern Welcome Header */}
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white shadow-2xl ${pageLoaded ? 'animate-fade-in-down' : ''}`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <HeartIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight mb-2">
                    Patient Management 🏥
                  </h1>
                  <p className="text-indigo-100 text-lg">
                    Comprehensive patient care and medical information management
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['admin-patients'] });
                    toast.success('Data refreshed successfully');
                  }}
                  className="group relative bg-white/10 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-300 border border-white/20 hover:bg-white/20 hover:shadow-lg hover:-translate-y-0.5"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <ArrowPathIcon className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="flex items-center">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 mr-4 shadow-lg">
                  <UserGroupIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-600">Total Patients</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{patientsData?.pagination?.totalRecords || 0}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-200 to-emerald-200 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="flex items-center">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 mr-4 shadow-lg">
                  <CheckCircleIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-600">Active Patients</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {patientsData?.patients?.filter((p: Patient) => p.user.isActive).length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 to-orange-200 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="flex items-center">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 mr-4 shadow-lg">
                  <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-600">Inactive Patients</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                    {patientsData?.patients?.filter((p: Patient) => !p.user.isActive).length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="flex items-center">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 mr-4 shadow-lg">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-600">Verified Accounts</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {patientsData?.patients?.filter((p: Patient) => p.user.emailVerified).length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters and Search */}
        <div className={`relative group ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
          <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-white/40 to-white/20 backdrop-blur-sm px-6 py-4 border-b border-white/30">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400" />
                    <input
                      type="text"
                      placeholder="Search patients by name, email, or phone number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-white/40 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border border-white/40 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-300 cursor-pointer"
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-10"></div>
                    <div className="relative animate-pulse bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                      <div className="flex items-center space-x-4">
                        <div className="rounded-full bg-gradient-to-r from-purple-200 to-pink-200 h-16 w-16"></div>
                        <div className="flex-1 space-y-3">
                          <div className="h-4 bg-gradient-to-r from-purple-200 to-pink-200 rounded w-1/3"></div>
                          <div className="h-3 bg-gradient-to-r from-purple-200 to-pink-200 rounded w-1/2"></div>
                          <div className="h-3 bg-gradient-to-r from-purple-200 to-pink-200 rounded w-1/4"></div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-6 bg-gradient-to-r from-purple-200 to-pink-200 rounded w-20"></div>
                          <div className="h-4 bg-gradient-to-r from-purple-200 to-pink-200 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <div className="relative group max-w-md mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-200 to-pink-200 rounded-2xl blur-xl opacity-30"></div>
                  <div className="relative bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-lg">
                    <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4 animate-bounce" />
                    <h3 className="text-lg font-bold text-red-800 mb-2">Failed to Load Patients</h3>
                    <p className="text-red-600">Please try again later or contact support if the problem persists.</p>
                  </div>
                </div>
              </div>
            ) : !patientsData?.patients || patientsData.patients.length === 0 ? (
              <div className="p-8 text-center">
                <div className="relative group max-w-md mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-20"></div>
                  <div className="relative bg-white/60 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-lg">
                    <UserGroupIcon className="h-16 w-16 text-purple-400 mx-auto mb-4 animate-bounce" />
                    <h3 className="text-lg font-bold text-gray-800 mb-2">No Patients Found</h3>
                    <p className="text-gray-600">Try adjusting your search criteria or check back later.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {/* Enhanced Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-10"></div>
                    <div className="relative bg-white/40 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden">
                      <table className="min-w-full">
                        <thead className="bg-gradient-to-r from-white/60 to-white/40 backdrop-blur-sm">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Patient Profile
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Contact Information
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Medical Information
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Account Status
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white/20 backdrop-blur-sm divide-y divide-white/30">
                          {patientsData.patients.map((patient: Patient) => (
                            <tr key={patient.id} className="hover:bg-white/30 transition-all duration-300 hover:shadow-lg">
                              <td className="px-6 py-6 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center ring-2 ring-white/50 shadow-lg">
                                      <span className="text-sm font-bold text-white">
                                        {patient.user.firstName.charAt(0)}{patient.user.lastName.charAt(0)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-bold text-gray-900">
                                      {patient.user.firstName} {patient.user.lastName}
                                    </div>
                                    <div className="text-sm text-gray-700">{patient.user.email}</div>
                                    <div className="text-xs text-gray-600 flex items-center mt-1">
                                      <UserIcon className="h-3 w-3 mr-1" />
                                      {patient.user.gender && `${patient.user.gender.charAt(0).toUpperCase() + patient.user.gender.slice(1)}`}
                                      {patient.user.dateOfBirth && ` • ${calculateAge(patient.user.dateOfBirth)} years old`}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-6 whitespace-nowrap">
                                <div className="text-sm text-gray-900 flex items-center font-medium">
                                  <PhoneIcon className="h-4 w-4 mr-2 text-purple-400" />
                                  {patient.user.phone || 'No phone'}
                                </div>
                                <div className="text-sm text-gray-700 flex items-center mt-1">
                                  <MapPinIcon className="h-4 w-4 mr-2 text-purple-400" />
                                  {patient.user.address ? (
                                    patient.user.address.length > 30 ?
                                    `${patient.user.address.substring(0, 30)}...` :
                                    patient.user.address
                                  ) : 'No address'}
                                </div>
                              </td>
                              <td className="px-6 py-6 whitespace-nowrap">
                                <div className="text-sm text-gray-900 flex items-center font-medium">
                                  <HeartIcon className="h-4 w-4 mr-2 text-red-400" />
                                  Blood: {patient.bloodType || 'Unknown'}
                                </div>
                                <div className="text-sm text-gray-700 mt-1">
                                  {patient.allergies ? (
                                    patient.allergies.length > 25 ?
                                    `Allergies: ${patient.allergies.substring(0, 25)}...` :
                                    `Allergies: ${patient.allergies}`
                                  ) : 'No known allergies'}
                                </div>
                              </td>
                              <td className="px-6 py-6 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full backdrop-blur-sm border ${
                                    patient.user.isActive
                                      ? 'bg-green-100/80 text-green-800 border-green-200/50'
                                      : 'bg-red-100/80 text-red-800 border-red-200/50'
                                  }`}>
                                    {patient.user.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                  {patient.user.emailVerified ? (
                                    <CheckBadgeIcon className="h-5 w-5 text-green-500" title="Email Verified" />
                                  ) : (
                                    <XCircleIcon className="h-5 w-5 text-red-500" title="Email Not Verified" />
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-6 whitespace-nowrap text-sm font-medium">
                                <div className="flex items-center space-x-3">
                                  <button
                                    onClick={() => handleViewPatient(patient)}
                                    className="group relative inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden"
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <EyeIcon className="h-4 w-4 mr-1 relative z-10" />
                                    <span className="relative z-10 font-medium">View</span>
                                  </button>
                                  <button
                                    onClick={() => handleStatusToggle(patient)}
                                    className={`group relative inline-flex items-center px-4 py-2 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden ${
                                      patient.user.isActive
                                        ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                                        : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                    }`}
                                    disabled={updatePatientStatusMutation.isPending}
                                  >
                                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                                      patient.user.isActive
                                        ? 'bg-gradient-to-r from-red-600 to-pink-600'
                                        : 'bg-gradient-to-r from-green-600 to-emerald-600'
                                    }`}></div>
                                    {patient.user.isActive ? (
                                      <>
                                        <XCircleIcon className="h-4 w-4 mr-1 relative z-10" />
                                        <span className="relative z-10 font-medium">Deactivate</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircleIcon className="h-4 w-4 mr-1 relative z-10" />
                                        <span className="relative z-10 font-medium">Activate</span>
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
                  </div>
                </div>

                {/* Enhanced Mobile Card View */}
                <div className="lg:hidden space-y-4">
                  {patientsData.patients.map((patient: Patient) => (
                    <div key={patient.id} className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                      <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center ring-2 ring-white/50 shadow-lg">
                              <span className="text-lg font-bold text-white">
                                {patient.user.firstName.charAt(0)}{patient.user.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">
                                {patient.user.firstName} {patient.user.lastName}
                              </h3>
                              <p className="text-sm text-gray-700">{patient.user.email}</p>
                              <p className="text-xs text-gray-600 flex items-center mt-1">
                                <UserIcon className="h-3 w-3 mr-1" />
                                {patient.user.gender && `${patient.user.gender.charAt(0).toUpperCase() + patient.user.gender.slice(1)}`}
                                {patient.user.dateOfBirth && ` • ${calculateAge(patient.user.dateOfBirth)} years old`}
                              </p>
                            </div>
                          </div>
                          <EllipsisVerticalIcon className="h-5 w-5 text-purple-400" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="bg-white/40 backdrop-blur-sm rounded-xl p-3 border border-white/30">
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Phone</p>
                            <p className="text-sm text-gray-900 flex items-center font-medium">
                              <PhoneIcon className="h-3 w-3 mr-1 text-purple-400" />
                              {patient.user.phone || 'No phone'}
                            </p>
                          </div>
                          <div className="bg-white/40 backdrop-blur-sm rounded-xl p-3 border border-white/30">
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Blood Type</p>
                            <p className="text-sm text-gray-900 flex items-center font-medium">
                              <HeartIcon className="h-3 w-3 mr-1 text-red-400" />
                              {patient.bloodType || 'Unknown'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full backdrop-blur-sm border ${
                              patient.user.isActive
                                ? 'bg-green-100/80 text-green-800 border-green-200/50'
                                : 'bg-red-100/80 text-red-800 border-red-200/50'
                            }`}>
                              {patient.user.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {patient.user.emailVerified ? (
                              <CheckBadgeIcon className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircleIcon className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <button
                            onClick={() => handleViewPatient(patient)}
                            className="group relative flex-1 inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <EyeIcon className="h-4 w-4 mr-2 relative z-10" />
                            <span className="relative z-10 font-medium">View Details</span>
                          </button>
                          <button
                            onClick={() => handleStatusToggle(patient)}
                            className={`group relative flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden ${
                              patient.user.isActive
                                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                            }`}
                            disabled={updatePatientStatusMutation.isPending}
                          >
                            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                              patient.user.isActive
                                ? 'bg-gradient-to-r from-red-600 to-pink-600'
                                : 'bg-gradient-to-r from-green-600 to-emerald-600'
                            }`}></div>
                            {patient.user.isActive ? (
                              <>
                                <XCircleIcon className="h-4 w-4 mr-2 relative z-10" />
                                <span className="relative z-10 font-medium">Deactivate</span>
                              </>
                            ) : (
                              <>
                                <CheckCircleIcon className="h-4 w-4 mr-2 relative z-10" />
                                <span className="relative z-10 font-medium">Activate</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Enhanced Pagination */}
                {patientsData.pagination && patientsData.pagination.totalPages > 1 && (
                  <div className={`relative group ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-20"></div>
                    <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm font-bold text-gray-700">
                          Showing page <span className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{patientsData.pagination.currentPage}</span> of{' '}
                          <span className="font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{patientsData.pagination.totalPages}</span>
                          <span className="text-gray-500 ml-1">({patientsData.pagination.totalRecords} total patients)</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setPage(page - 1)}
                            disabled={!patientsData.pagination.hasPrev}
                            className="group relative inline-flex items-center px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="relative z-10">Previous</span>
                          </button>

                          {/* Page Numbers */}
                          <div className="hidden sm:flex items-center space-x-1">
                            {Array.from({ length: Math.min(5, patientsData.pagination.totalPages) }, (_, i) => {
                              const pageNum = Math.max(1, Math.min(patientsData.pagination.totalPages - 4, patientsData.pagination.currentPage - 2)) + i;
                              if (pageNum > patientsData.pagination.totalPages) return null;

                              return (
                                <button
                                  key={pageNum}
                                  onClick={() => setPage(pageNum)}
                                  className={`group relative px-3 py-2 text-sm font-medium rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 overflow-hidden ${
                                    pageNum === patientsData.pagination.currentPage
                                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                                      : 'bg-white/60 backdrop-blur-sm text-gray-700 border border-white/40 hover:bg-white/80'
                                  }`}
                                >
                                  {pageNum === patientsData.pagination.currentPage && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                  )}
                                  <span className="relative z-10">{pageNum}</span>
                                </button>
                              );
                            })}
                          </div>

                          <button
                            onClick={() => setPage(page + 1)}
                            disabled={!patientsData.pagination.hasNext}
                            className="group relative inline-flex items-center px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
        </div>

        {/* Enhanced Patient Detail Modal with Glassmorphism */}
        {showPatientModal && selectedPatient && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="relative group max-w-6xl w-full max-h-[95vh]">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-3xl blur-xl opacity-50"></div>
              <div className="relative bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
                {/* Enhanced Modal Header */}
                <div className="sticky top-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 rounded-t-3xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30 shadow-lg">
                        <span className="text-2xl font-bold text-white">
                          {selectedPatient.user.firstName.charAt(0)}{selectedPatient.user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          {selectedPatient.user.firstName} {selectedPatient.user.lastName}
                        </h2>
                        <p className="text-indigo-100">Patient Profile</p>
                        <div className="flex items-center mt-2">
                          <span className={`px-3 py-1.5 text-xs font-bold rounded-full backdrop-blur-sm border ${
                            selectedPatient.user.isActive
                              ? 'bg-green-100/80 text-green-800 border-green-200/50'
                              : 'bg-red-100/80 text-red-800 border-red-200/50'
                          }`}>
                            {selectedPatient.user.isActive ? 'Active Patient' : 'Inactive Patient'}
                          </span>
                          {selectedPatient.user.emailVerified && (
                            <CheckBadgeIcon className="h-5 w-5 text-white ml-3" title="Email Verified" />
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPatientModal(false)}
                      className="group p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Enhanced Modal Content */}
                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Enhanced Personal Information */}
                    <div className="space-y-6">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-2xl blur-xl opacity-20"></div>
                        <div className="relative bg-white/50 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg">
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                            Personal Information
                          </h3>
                          <div className="space-y-4">
                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                              <label className="text-sm font-bold text-gray-600 block mb-1">Full Name</label>
                              <p className="text-gray-900 font-bold">{selectedPatient.user.firstName} {selectedPatient.user.lastName}</p>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                              <label className="text-sm font-bold text-gray-600 block mb-1">Email Address</label>
                              <p className="text-gray-900 font-medium">{selectedPatient.user.email}</p>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                              <label className="text-sm font-bold text-gray-600 block mb-1">Phone Number</label>
                              <p className="text-gray-900 flex items-center font-medium">
                                <PhoneIcon className="h-4 w-4 mr-2 text-purple-400" />
                                {selectedPatient.user.phone || 'Not provided'}
                              </p>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                              <label className="text-sm font-bold text-gray-600 block mb-1">Date of Birth</label>
                              <p className="text-gray-900 flex items-center font-medium">
                                <CalendarIcon className="h-4 w-4 mr-2 text-purple-400" />
                                {selectedPatient.user.dateOfBirth ?
                                  `${new Date(selectedPatient.user.dateOfBirth).toLocaleDateString()} (${calculateAge(selectedPatient.user.dateOfBirth)} years old)` :
                                  'Not provided'
                                }
                              </p>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                              <label className="text-sm font-bold text-gray-600 block mb-1">Gender</label>
                              <p className="text-gray-900 capitalize font-medium">{selectedPatient.user.gender || 'Not provided'}</p>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                              <label className="text-sm font-bold text-gray-600 block mb-1">Address</label>
                              <p className="text-gray-900 flex items-center font-medium">
                                <MapPinIcon className="h-4 w-4 mr-2 text-purple-400" />
                                {selectedPatient.user.address || 'Not provided'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Medical Information */}
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-200 to-pink-200 rounded-2xl blur-xl opacity-20"></div>
                        <div className="relative bg-white/50 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg">
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <HeartIcon className="h-5 w-5 mr-2 text-red-600" />
                            Medical Information
                          </h3>
                          <div className="space-y-4">
                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                              <label className="text-sm font-bold text-gray-600 block mb-1">Blood Type</label>
                              <p className="text-gray-900 font-medium">{selectedPatient.bloodType || 'Not provided'}</p>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                              <label className="text-sm font-bold text-gray-600 block mb-1">Allergies</label>
                              <p className="text-gray-900 font-medium">{selectedPatient.allergies || 'None reported'}</p>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                              <label className="text-sm font-bold text-gray-600 block mb-1">Current Medications</label>
                              <p className="text-gray-900 font-medium">{selectedPatient.currentMedications || 'None reported'}</p>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                              <label className="text-sm font-bold text-gray-600 block mb-1">Medical History</label>
                              <p className="text-gray-900 font-medium">{selectedPatient.medicalHistory || 'None reported'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Additional Information */}
                    <div className="space-y-6">
                      {/* Enhanced Emergency Contact */}
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 to-orange-200 rounded-2xl blur-xl opacity-20"></div>
                        <div className="relative bg-white/50 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-lg">
                          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-yellow-600" />
                            Emergency Contact
                          </h3>
                          <div className="space-y-4">
                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                              <label className="text-sm font-bold text-gray-600 block mb-1">Contact Name</label>
                              <p className="text-gray-900 font-medium">{selectedPatient.emergencyContact || 'Not provided'}</p>
                            </div>
                            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                              <label className="text-sm font-bold text-gray-600 block mb-1">Contact Phone</label>
                              <p className="text-gray-900 flex items-center font-medium">
                                <PhoneIcon className="h-4 w-4 mr-2 text-purple-400" />
                                {selectedPatient.emergencyPhone || 'Not provided'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                  {/* Insurance Information */}
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Insurance Information
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-sm font-medium text-gray-500 block mb-1">Insurance Provider</label>
                        <p className="text-gray-900">{selectedPatient.insuranceProvider || 'Not provided'}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-sm font-medium text-gray-500 block mb-1">Insurance Number</label>
                        <p className="text-gray-900 font-mono">{selectedPatient.insuranceNumber || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="bg-purple-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <ShieldCheckIcon className="h-5 w-5 mr-2 text-purple-600" />
                      Account Status
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-sm font-medium text-gray-500 block mb-1">Account Status</label>
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${selectedPatient.user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <p className={`text-sm font-semibold ${selectedPatient.user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedPatient.user.isActive ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-sm font-medium text-gray-500 block mb-1">Email Verified</label>
                        <div className="flex items-center">
                          {selectedPatient.user.emailVerified ? (
                            <CheckBadgeIcon className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XMarkIcon className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <p className={`text-sm font-semibold ${selectedPatient.user.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedPatient.user.emailVerified ? 'Verified' : 'Not Verified'}
                          </p>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-sm font-medium text-gray-500 block mb-1">Last Login</label>
                        <p className="text-gray-900 flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {selectedPatient.user.lastLogin ? new Date(selectedPatient.user.lastLogin).toLocaleString() : 'Never'}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4">
                        <label className="text-sm font-medium text-gray-500 block mb-1">Member Since</label>
                        <p className="text-gray-900 flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(selectedPatient.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Appointments */}
                  {selectedPatient.appointments && selectedPatient.appointments.length > 0 && (
                    <div className="bg-green-50 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <CalendarIcon className="h-5 w-5 mr-2 text-green-600" />
                        Recent Appointments
                      </h3>
                      <div className="space-y-3">
                        {selectedPatient.appointments.slice(0, 5).map((appointment) => (
                          <div key={appointment.id} className="bg-white rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-gray-900">
                                  Dr. {appointment.doctor.user.firstName} {appointment.doctor.user.lastName}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center">
                                  <CalendarIcon className="h-3 w-3 mr-1" />
                                  {new Date(appointment.appointmentDate).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                appointment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                appointment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {appointment.status}
                              </span>
                            </div>
                          </div>
                        ))}
                        {selectedPatient.appointments.length > 5 && (
                          <p className="text-sm text-gray-500 text-center">
                            +{selectedPatient.appointments.length - 5} more appointments
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="mt-8 flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowPatientModal(false)}
                  className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleStatusToggle(selectedPatient)}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    selectedPatient.user.isActive 
                      ? 'text-red-700 bg-red-100 hover:bg-red-200' 
                      : 'text-green-700 bg-green-100 hover:bg-green-200'
                  }`}
                  disabled={updatePatientStatusMutation.isPending}
                >
                  {selectedPatient.user.isActive ? 'Deactivate Patient' : 'Activate Patient'}
                </button>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default AdminPatients;