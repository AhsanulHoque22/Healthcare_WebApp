import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  UsersIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  SparklesIcon,
  ArrowRightIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

interface DoctorVerificationRequest {
  id: number;
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface AnalyticsData {
  statusCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  dailyCounts: Record<string, number>;
  period: number;
}

const AdminDashboard: React.FC = () => {
  const [pageLoaded, setPageLoaded] = useState(false);

  // Page load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Fetch system statistics
  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await axios.get('/admin/stats');
      return response.data.data.stats;
    },
  });

  // Fetch recent activity (appointments analytics)
  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const response = await axios.get('/admin/analytics/appointments?period=7');
      return response.data.data.analytics;
    },
  });

  // Fetch doctor verification requests
  const { data: verificationRequests } = useQuery<DoctorVerificationRequest[]>({
    queryKey: ['doctor-verifications'],
    queryFn: async () => {
      const response = await axios.get('/admin/doctor-verifications');
      return response.data.data.doctors;
    },
  });

  // Prepare chart data
  const statusChartData = analytics ? Object.entries(analytics.statusCounts || {}).map(([status, count]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
    count,
    fill: status === 'completed' ? '#10B981' : 
          status === 'confirmed' ? '#3B82F6' : 
          status === 'cancelled' ? '#EF4444' : '#F59E0B'
  })) : [];


  const pieChartData = analytics ? Object.entries(analytics.statusCounts || {}).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
    value: count,
    color: status === 'completed' ? '#10B981' : 
           status === 'confirmed' ? '#3B82F6' : 
           status === 'cancelled' ? '#EF4444' : '#F59E0B'
  })) : [];

  // Generate daily trend data (mock data for demonstration)
  const dailyTrendData = [
    { day: 'Mon', appointments: 12, completed: 8 },
    { day: 'Tue', appointments: 18, completed: 15 },
    { day: 'Wed', appointments: 15, completed: 12 },
    { day: 'Thu', appointments: 22, completed: 18 },
    { day: 'Fri', appointments: 25, completed: 20 },
    { day: 'Sat', appointments: 8, completed: 6 },
    { day: 'Sun', appointments: 5, completed: 4 }
  ];

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 space-y-8 p-6">
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 animate-pulse border border-white/50">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 animate-pulse border border-white/50">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-40 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 space-y-8 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage the healthcare system and monitor system performance.</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 text-center border border-white/50">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-400 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h3>
            <p className="text-red-600">Unable to load dashboard data. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 space-y-8 p-6">
        {/* Modern Header */}
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white shadow-2xl ${pageLoaded ? 'animate-fade-in-down' : ''}`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center">
                  <UsersIcon className="h-10 w-10 mr-3" />
                  Admin Dashboard
                </h1>
                <p className="text-indigo-100 text-lg">
                  Comprehensive overview of your healthcare system performance and analytics.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <SparklesIcon className="h-10 w-10 text-white animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 ${pageLoaded ? 'animate-fade-in' : ''}`}>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 border border-white/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                  <div className="flex items-center mt-2">
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1 animate-pulse" />
                    <span className="text-sm text-green-600 font-medium">+12%</span>
                    <span className="text-sm text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <UsersIcon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-green-200/30 to-emerald-200/30 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 border border-white/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Active Doctors</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalDoctors || 0}</p>
                  <div className="flex items-center mt-2">
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1 animate-pulse" />
                    <span className="text-sm text-green-600 font-medium">+8%</span>
                    <span className="text-sm text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <UserGroupIcon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-200/30 to-violet-200/30 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 border border-white/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Appointments</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalAppointments || 0}</p>
                  <div className="flex items-center mt-2">
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1 animate-pulse" />
                    <span className="text-sm text-green-600 font-medium">+24%</span>
                    <span className="text-sm text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CalendarIcon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/30 to-blue-200/30 rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-1 border border-white/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Medical Records</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalMedicalRecords || 0}</p>
                  <div className="flex items-center mt-2">
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1 animate-pulse" />
                    <span className="text-sm text-green-600 font-medium">+16%</span>
                    <span className="text-sm text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <DocumentTextIcon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
          {/* Appointment Status Chart */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1 border border-white/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CalendarIcon className="h-6 w-6 mr-2 text-indigo-600" />
                Appointment Status Distribution
              </h3>
            {analyticsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="status" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
            </div>
          </div>

          {/* Appointment Type Pie Chart */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-200/20 to-pink-200/20 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1 border border-white/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="h-6 w-6 mr-2 text-purple-600" />
                Appointment Types
              </h3>
            {analyticsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={(entry: any) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            </div>
          </div>
        </div>

        {/* Daily Trends and Quick Actions */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 ${pageLoaded ? 'animate-fade-in' : ''}`}>
          {/* Daily Appointment Trends */}
          <div className="relative group lg:col-span-2">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/20 to-green-200/20 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1 border border-white/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ChartBarIcon className="h-6 w-6 mr-2 text-emerald-600" />
                Weekly Appointment Trends
              </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="appointments" 
                  stackId="1" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stackId="2" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-200/20 to-yellow-200/20 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1 border border-white/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <SparklesIcon className="h-6 w-6 mr-2 text-orange-600" />
                Quick Actions
              </h3>
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/app/users'}
                className="w-full text-left p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 border border-blue-200 hover:scale-105 hover:-translate-y-1 hover:shadow-lg group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UsersIcon className="h-5 w-5 text-blue-600 mr-3 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-blue-800 font-medium">Manage Users</span>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-blue-400 group-hover:text-blue-600 transition-all duration-300 group-hover:translate-x-1" />
                </div>
              </button>
              <button
                onClick={() => window.location.href = '/app/admin-doctors'}
                className="w-full text-left p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-300 border border-green-200 hover:scale-105 hover:-translate-y-1 hover:shadow-lg group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-5 w-5 text-green-600 mr-3 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-green-800 font-medium">Manage Doctors</span>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-green-400 group-hover:text-green-600 transition-all duration-300 group-hover:translate-x-1" />
                </div>
              </button>
              <button
                onClick={() => window.location.href = '/app/admin-patients'}
                className="w-full text-left p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 border border-purple-200 hover:scale-105 hover:-translate-y-1 hover:shadow-lg group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CalendarIcon className="h-5 w-5 text-purple-600 mr-3 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-purple-800 font-medium">Manage Patients</span>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-purple-400 group-hover:text-purple-600 transition-all duration-300 group-hover:translate-x-1" />
                </div>
              </button>
              <button
                onClick={() => window.location.href = '/app/admin-lab-reports'}
                className="w-full text-left p-4 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl hover:from-indigo-100 hover:to-indigo-200 transition-all duration-300 border border-indigo-200 hover:scale-105 hover:-translate-y-1 hover:shadow-lg group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <DocumentTextIcon className="h-5 w-5 text-indigo-600 mr-3 group-hover:scale-110 transition-transform duration-300" />
                    <span className="text-indigo-800 font-medium">Lab Reports</span>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-indigo-400 group-hover:text-indigo-600 transition-all duration-300 group-hover:translate-x-1" />
                </div>
              </button>
            </div>
            </div>
          </div>
        </div>

        {/* System Overview and Alerts */}
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
          {/* System Overview */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-200/20 to-blue-200/20 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1 border border-white/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircleIcon className="h-6 w-6 mr-2 text-cyan-600" />
                System Overview
              </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600 flex items-center">
                  <UsersIcon className="h-4 w-4 mr-2 text-blue-500" />
                  Total Patients
                </span>
                <span className="text-lg font-semibold text-gray-900">{stats?.totalPatients || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600 flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500" />
                  Active Users
                </span>
                <span className="text-lg font-semibold text-green-600">{stats?.activeUsers || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600 flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2 text-blue-500" />
                  Today's Appointments
                </span>
                <span className="text-lg font-semibold text-blue-600">{stats?.todayAppointments || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600 flex items-center">
                  <CheckCircleIcon className="h-4 w-4 mr-2 text-green-500" />
                  Completed Appointments
                </span>
                <span className="text-lg font-semibold text-green-600">{stats?.completedAppointments || 0}</span>
              </div>
            </div>
            </div>
          </div>

          {/* Alerts and Notifications */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-200/20 to-orange-200/20 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1 border border-white/50">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ExclamationTriangleIcon className="h-6 w-6 mr-2 text-yellow-600" />
                Alerts & Notifications
              </h3>
            {verificationRequests && verificationRequests.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-yellow-50/80 backdrop-blur-sm border border-yellow-200 rounded-xl hover:bg-yellow-100/80 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-3 animate-pulse" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800">Pending Doctor Verifications</p>
                    <p className="text-xs text-yellow-600">{verificationRequests.length} doctors waiting for approval</p>
                  </div>
                  <button
                    onClick={() => window.location.href = '/app/admin-doctors'}
                    className="text-xs text-yellow-700 hover:text-yellow-900 font-medium hover:scale-110 transition-transform duration-300 flex items-center gap-1"
                  >
                    Review <ArrowRightIcon className="h-3 w-3" />
                  </button>
                </div>
                
                {verificationRequests.slice(0, 3).map((doctor: DoctorVerificationRequest) => (
                  <div key={doctor.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">
                      Dr. {doctor.user?.firstName} {doctor.user?.lastName}
                    </span>
                    <span className="text-xs text-gray-500">Pending</span>
                  </div>
                ))}
                
                {verificationRequests.length > 3 && (
                  <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200">
                    +{verificationRequests.length - 3} more pending verifications
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto mb-3 animate-pulse" />
                <p className="text-gray-500 font-medium">All systems running smoothly!</p>
                <p className="text-sm text-gray-400">No pending alerts or notifications</p>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;