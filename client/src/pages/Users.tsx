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
  UserIcon,
  ShieldCheckIcon,
  ClockIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowPathIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
  CheckBadgeIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { getDepartmentLabel } from '../utils/departments';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: 'patient' | 'doctor' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  lastLogin: string;
  createdAt: string;
  patientProfile?: any;
  doctorProfile?: any;
}

const Users: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
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

  // Fetch users with pagination and filters
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['admin-users', page, searchTerm, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(roleFilter && { role: roleFilter }),
      });
      const response = await axios.get(`/admin/users?${params}`);
      return response.data.data;
    },
  });

  // Update user status mutation
  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: number; isActive: boolean }) => {
      const response = await axios.put(`/admin/users/${userId}/status`, { isActive });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User status updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update user status');
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await axios.delete(`/admin/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success('User deactivated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate user');
    },
  });

  const handleStatusToggle = (user: User) => {
    updateUserStatusMutation.mutate({
      userId: user.id,
      isActive: !user.isActive,
    });
  };

  const handleDeleteUser = (userId: number) => {
    if (window.confirm('Are you sure you want to deactivate this user?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'doctor':
        return 'bg-green-100 text-green-800';
      case 'patient':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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



      {/* Content with fade-in animation */}
      <div className={`relative z-10 p-6 transition-all duration-1000 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Modern Header with Welcome Bar */}
          <div className={`relative group overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] ${pageLoaded ? 'animate-fade-in-down' : ''}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/5"></div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-500"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-blue-200/30 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                      <div className="relative p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform duration-300">
                        <UserGroupIcon className="h-8 w-8 text-white animate-pulse" />
                      </div>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">
                      User Management 👥
                    </h1>
                  </div>
                  <p className="text-indigo-100 text-lg">
                    Comprehensive user administration and permissions management
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-purple-200/20 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                    <div className="relative w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-bounce-in group-hover:scale-110 transition-transform duration-300">
                      <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
                        <SparklesIcon className="h-8 w-8 text-white animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          </div>

          {/* Stats Cards with Glassmorphism */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-fade-in-up">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-blue-200 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl shadow-lg">
                    <UserGroupIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{usersData?.pagination?.totalRecords || 0}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-200 to-green-200 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-lg">
                    <CheckCircleIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600 mb-1">Active Users</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {usersData?.users?.filter((user: User) => user.isActive).length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-violet-200 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl shadow-lg">
                    <UserIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600 mb-1">Doctors</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {usersData?.users?.filter((user: User) => user.role === 'doctor').length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-orange-200 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
              <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg">
                    <ShieldCheckIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600 mb-1">Verified</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {usersData?.users?.filter((user: User) => user.emailVerified).length || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card with Glassmorphism */}
          <div className="relative group animate-fade-in-up">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
            <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-xl">
              {/* Filters and Search */}
              <div className="p-6 border-b border-white/20 bg-gradient-to-r from-purple-50/50 to-pink-50/50">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                      <FunnelIcon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">User Directory</h3>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full lg:w-auto">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-200/30 to-pink-200/30 rounded-xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
                      <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 group-hover:scale-110 transition-transform duration-300" />
                      <input
                        type="text"
                        placeholder="Search users by name, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="relative w-full sm:w-80 pl-10 pr-4 py-2.5 border-2 border-white/40 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-purple-400/20 focus:border-purple-400 transition-all duration-300 hover:bg-white/70 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1"
                      />
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
                      <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="relative px-4 py-2.5 border-2 border-white/40 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-4 focus:ring-purple-400/20 focus:border-purple-400 transition-all duration-300 hover:bg-white/70 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 cursor-pointer"
                      >
                        <option value="">All Roles</option>
                        <option value="patient">Patients</option>
                        <option value="doctor">Doctors</option>
                        <option value="admin">Administrators</option>
                      </select>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/30 to-green-200/30 rounded-xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
                      <button
                        onClick={() => {
                          queryClient.invalidateQueries({ queryKey: ['admin-users'] });
                          toast.success('Data refreshed!');
                        }}
                        className="relative group bg-white/70 backdrop-blur-md hover:bg-white/90 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:scale-105 border border-white/20 animate-bounce"
                      >
                        <ArrowPathIcon className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-6">
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-20"></div>
                        <div className="relative bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/40 animate-pulse">
                          <div className="flex items-center space-x-4">
                            <div className="rounded-full bg-gradient-to-r from-purple-200 to-pink-200 h-12 w-12"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gradient-to-r from-purple-200 to-pink-200 rounded w-1/4"></div>
                              <div className="h-3 bg-gradient-to-r from-purple-200 to-pink-200 rounded w-1/2"></div>
                            </div>
                            <div className="space-y-2">
                              <div className="h-6 bg-gradient-to-r from-purple-200 to-pink-200 rounded w-16"></div>
                              <div className="h-4 bg-gradient-to-r from-purple-200 to-pink-200 rounded w-20"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : error ? (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-200 to-pink-200 rounded-2xl blur-xl opacity-20"></div>
                    <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-12 text-center">
                      <div className="text-red-400 mb-6 animate-bounce">
                        <ExclamationTriangleIcon className="h-16 w-16 mx-auto" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to Load Users</h3>
                      <p className="text-red-600 font-medium">Unable to fetch user data. Please try again later.</p>
                    </div>
                  </div>
                ) : !usersData?.users || usersData.users.length === 0 ? (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-20"></div>
                    <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-12 text-center">
                      <div className="text-purple-400 mb-6 animate-bounce">
                        <UserGroupIcon className="h-16 w-16 mx-auto" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No Users Found</h3>
                      <p className="text-gray-600 font-medium">
                        {roleFilter || searchTerm
                          ? 'Try adjusting your filters to see more results.'
                          : 'No users are currently registered in the system.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto">
                      <div className="bg-white/40 backdrop-blur-sm rounded-xl border border-white/40">
                        <table className="min-w-full">
                          <thead>
                            <tr className="bg-gradient-to-r from-purple-50/50 to-pink-50/50 border-b border-white/20">
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                User Profile
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Role & Status
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Activity
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/20">
                            {usersData.users.map((user: User, index: number) => (
                              <tr
                                key={user.id}
                                className="hover:bg-white/30 transition-all duration-300 group animate-fade-in"
                                style={{ animationDelay: `${index * 100}ms` }}
                              >
                                <td className="px-6 py-6">
                                  <div className="flex items-center space-x-4">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                      <span className="text-sm font-bold text-white">
                                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="text-sm font-bold text-gray-900">
                                        {user.firstName} {user.lastName}
                                      </div>
                                      <div className="text-sm text-gray-600 flex items-center">
                                        <span className="mr-2">{user.email}</span>
                                        {user.emailVerified ? (
                                          <CheckBadgeIcon className="h-4 w-4 text-green-500" />
                                        ) : (
                                          <XMarkIcon className="h-4 w-4 text-red-500" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-6">
                                  <div className="space-y-2">
                                    <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full backdrop-blur-sm border ${getRoleBadgeColor(user.role)}`}>
                                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                    </span>
                                    <div>
                                      <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full backdrop-blur-sm border ${
                                        user.isActive ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300/50' : 'bg-red-100/80 text-red-800 border-red-300/50'
                                      }`}>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-6">
                                  <div className="text-sm text-gray-900">
                                    <div className="flex items-center mb-2">
                                      <ClockIcon className="h-4 w-4 mr-2 text-purple-400" />
                                      <span className="font-medium">Last Login</span>
                                    </div>
                                    <div className="text-gray-700 ml-6 font-medium">
                                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                    </div>
                                    <div className="flex items-center mt-3">
                                      <CalendarIcon className="h-4 w-4 mr-2 text-purple-400" />
                                      <span className="text-gray-700 text-xs font-medium">
                                        Joined {new Date(user.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-6">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleViewUser(user)}
                                      className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                                    >
                                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                      <EyeIcon className="h-4 w-4 relative z-10" />
                                      <span className="relative z-10">View</span>
                                    </button>
                                    <button
                                      onClick={() => handleStatusToggle(user)}
                                      className={`group relative overflow-hidden px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                                        user.isActive
                                          ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white'
                                          : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white'
                                      }`}
                                      disabled={updateUserStatusMutation.isPending}
                                    >
                                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                      {user.isActive ? (
                                        <>
                                          <XCircleIcon className="h-4 w-4 relative z-10" />
                                          <span className="relative z-10">Deactivate</span>
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircleIcon className="h-4 w-4 relative z-10" />
                                          <span className="relative z-10">Activate</span>
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

                    {/* Mobile Card View */}
                    <div className="lg:hidden space-y-4">
                      {usersData.users.map((user: User, index: number) => (
                        <div
                          key={user.id}
                          className="relative group animate-fade-in-up"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-200 to-pink-200 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
                          <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                                  <span className="text-sm font-bold text-white">
                                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-gray-900">
                                    {user.firstName} {user.lastName}
                                  </div>
                                  <div className="text-sm text-gray-600 flex items-center">
                                    <span className="mr-2">{user.email}</span>
                                    {user.emailVerified ? (
                                      <CheckBadgeIcon className="h-4 w-4 text-green-500" />
                                    ) : (
                                      <XMarkIcon className="h-4 w-4 text-red-500" />
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-all duration-300">
                                <EllipsisVerticalIcon className="h-5 w-5" />
                              </button>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                              <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full backdrop-blur-sm border ${getRoleBadgeColor(user.role)}`}>
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </span>
                              <span className={`inline-flex px-3 py-1.5 text-xs font-bold rounded-full backdrop-blur-sm border ${
                                user.isActive ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300/50' : 'bg-red-100/80 text-red-800 border-red-300/50'
                              }`}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>

                            <div className="bg-white/40 backdrop-blur-sm rounded-xl p-4 border border-white/40 space-y-3 mb-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="text-gray-600 font-medium mb-1">Last Login</div>
                                  <div className="text-gray-900 font-bold">
                                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-600 font-medium mb-1">Joined</div>
                                  <div className="text-gray-900 font-bold">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewUser(user)}
                                className="group relative flex-1 overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                              >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                <EyeIcon className="h-4 w-4 relative z-10" />
                                <span className="relative z-10">View Details</span>
                              </button>
                              <button
                                onClick={() => handleStatusToggle(user)}
                                className={`group relative flex-1 overflow-hidden px-4 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                                  user.isActive
                                    ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white'
                                    : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white'
                                }`}
                                disabled={updateUserStatusMutation.isPending}
                              >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                {user.isActive ? (
                                  <>
                                    <XCircleIcon className="h-4 w-4 relative z-10" />
                                    <span className="relative z-10">Deactivate</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircleIcon className="h-4 w-4 relative z-10" />
                                    <span className="relative z-10">Activate</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Pagination with Glassmorphism */}
              {usersData?.pagination && usersData.pagination.totalPages > 1 && (
                <div className="px-6 py-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 border-t border-white/20">
                  <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
                    <div className="text-sm text-gray-700 font-medium">
                      Showing page <span className="font-bold text-purple-600">{usersData.pagination.currentPage}</span> of{' '}
                      <span className="font-bold text-purple-600">{usersData.pagination.totalPages}</span> ({usersData.pagination.totalRecords} total users)
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={!usersData.pagination.hasPrev}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white/70 backdrop-blur-sm border border-white/40 rounded-xl hover:bg-white/90 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-md"
                      >
                        Previous
                      </button>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, usersData.pagination.totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`px-3 py-2 text-sm font-bold rounded-xl transition-all duration-300 hover:shadow-md ${
                                pageNum === usersData.pagination.currentPage
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                  : 'text-gray-700 bg-white/70 backdrop-blur-sm border border-white/40 hover:bg-white/90 hover:text-gray-900'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={!usersData.pagination.hasNext}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white/70 backdrop-blur-sm border border-white/40 rounded-xl hover:bg-white/90 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-md"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Enhanced User Detail Modal with Glassmorphism */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl blur-2xl opacity-30"></div>
            <div className="relative bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                      <span className="text-2xl font-bold text-white">
                        {selectedUser?.firstName.charAt(0)}{selectedUser?.lastName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white">
                        {selectedUser?.firstName} {selectedUser?.lastName}
                      </h2>
                      <p className="text-purple-100 capitalize font-medium">{selectedUser?.role} Account</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-300 hover:scale-110"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

                {/* Modal Content */}
                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Personal Information */}
                    <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                          <UserIcon className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Personal Information</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                          <label className="text-sm font-bold text-gray-600 block mb-2">Full Name</label>
                          <p className="text-gray-900 font-bold">{selectedUser?.firstName} {selectedUser?.lastName}</p>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                          <label className="text-sm font-bold text-gray-600 block mb-2">Email Address</label>
                          <div className="flex items-center space-x-2">
                            <p className="text-gray-900 font-bold">{selectedUser?.email}</p>
                            {selectedUser?.emailVerified ? (
                              <CheckBadgeIcon className="h-5 w-5 text-green-500" />
                            ) : (
                              <XMarkIcon className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                          <label className="text-sm font-bold text-gray-600 block mb-2">Phone Number</label>
                          <p className="text-gray-900 font-bold">{selectedUser?.phone || 'Not provided'}</p>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                          <label className="text-sm font-bold text-gray-600 block mb-2">User Role</label>
                          <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full backdrop-blur-sm border ${getRoleBadgeColor(selectedUser?.role || '')}`}>
                            {selectedUser?.role?.charAt(0).toUpperCase() + selectedUser?.role?.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Account Status */}
                    <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-lg">
                          <ShieldCheckIcon className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">Account Status</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                          <label className="text-sm font-bold text-gray-600 block mb-2">Account Status</label>
                          <div className="flex items-center space-x-3">
                            <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full backdrop-blur-sm border ${
                              selectedUser?.isActive ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300/50' : 'bg-red-100/80 text-red-800 border-red-300/50'
                            }`}>
                              {selectedUser?.isActive ? 'Active' : 'Inactive'}
                            </span>
                            {selectedUser?.isActive ? (
                              <CheckCircleIcon className="h-6 w-6 text-green-500" />
                            ) : (
                              <XCircleIcon className="h-6 w-6 text-red-500" />
                            )}
                          </div>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                          <label className="text-sm font-bold text-gray-600 block mb-2">Email Verification</label>
                          <div className="flex items-center space-x-3">
                            {selectedUser?.emailVerified ? (
                              <>
                                <CheckCircleIcon className="h-6 w-6 text-green-500" />
                                <span className="text-green-600 font-bold">Verified</span>
                              </>
                            ) : (
                              <>
                                <XCircleIcon className="h-6 w-6 text-red-500" />
                                <span className="text-red-600 font-bold">Not Verified</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                          <label className="text-sm font-bold text-gray-600 block mb-2">Last Login</label>
                          <div className="flex items-center space-x-3">
                            <ClockIcon className="h-5 w-5 text-purple-400" />
                            <p className="text-gray-900 font-bold">
                              {selectedUser?.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'Never'}
                            </p>
                          </div>
                        </div>
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                          <label className="text-sm font-bold text-gray-600 block mb-2">Member Since</label>
                          <div className="flex items-center space-x-3">
                            <CalendarIcon className="h-5 w-5 text-purple-400" />
                            <p className="text-gray-900 font-bold">{selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Unknown'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Role-specific Information */}
                    {selectedUser?.role === 'doctor' && selectedUser?.doctorProfile && (
                      <div className="lg:col-span-2 bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="p-2 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl shadow-lg">
                            <UserIcon className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">Doctor Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                            <label className="text-sm font-bold text-gray-600 block mb-2">BMDC Registration</label>
                            <p className="text-gray-900 font-bold">{selectedUser?.doctorProfile?.bmdcRegistrationNumber || 'Not provided'}</p>
                          </div>
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                            <label className="text-sm font-bold text-gray-600 block mb-2">Department</label>
                            <p className="text-gray-900 font-bold">{getDepartmentLabel(selectedUser?.doctorProfile?.department || '') || 'Not provided'}</p>
                          </div>
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                            <label className="text-sm font-bold text-gray-600 block mb-2">Experience</label>
                            <p className="text-gray-900 font-bold">{selectedUser?.doctorProfile?.experience || 0} years</p>
                          </div>
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                            <label className="text-sm font-bold text-gray-600 block mb-2">Verification Status</label>
                            <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-full backdrop-blur-sm border ${
                              selectedUser?.doctorProfile?.isVerified ? 'bg-emerald-100/80 text-emerald-800 border-emerald-300/50' : 'bg-amber-100/80 text-amber-800 border-amber-300/50'
                            }`}>
                              {selectedUser?.doctorProfile?.isVerified ? 'Verified' : 'Pending Verification'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedUser?.role === 'patient' && selectedUser?.patientProfile && (
                      <div className="lg:col-span-2 bg-white/40 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                            <UserIcon className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Patient Information</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                            <label className="text-sm font-bold text-gray-600 block mb-2">Blood Type</label>
                            <p className="text-gray-900 font-bold">{selectedUser?.patientProfile?.bloodType || 'Not provided'}</p>
                          </div>
                          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                            <label className="text-sm font-bold text-gray-600 block mb-2">Emergency Contact</label>
                            <p className="text-gray-900 font-bold">{selectedUser?.patientProfile?.emergencyContact || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t border-white/20">
                    <button
                      onClick={() => setShowUserModal(false)}
                      className="px-6 py-3 text-gray-700 bg-white/70 backdrop-blur-sm border border-white/40 rounded-xl hover:bg-white/90 transition-all duration-300 font-medium hover:shadow-md"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => selectedUser && handleStatusToggle(selectedUser)}
                      className={`group relative overflow-hidden px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                        selectedUser?.isActive
                          ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white'
                          : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white'
                      }`}
                      disabled={updateUserStatusMutation.isPending}
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                      <span className="relative z-10">
                        {selectedUser?.isActive ? 'Deactivate User' : 'Activate User'}
                      </span>
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

export default Users;
