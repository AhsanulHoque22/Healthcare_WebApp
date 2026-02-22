import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatCurrency } from '../services/paymentService';
import {
  BeakerIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  ClockIcon,
  DocumentTextIcon,
  HeartIcon,
  ArrowPathIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  ChartBarIcon,
  TagIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface LabTest {
  id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  sampleType: string;
  preparationInstructions: string;
  reportDeliveryTime: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const AdminLabTests: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [editingTest, setEditingTest] = useState<Partial<LabTest>>({});
  const [pageLoaded, setPageLoaded] = useState(false);

  const queryClient = useQueryClient();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Page load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Fetch lab tests
  const { data: testsData, isLoading: testsLoading } = useQuery({
    queryKey: ['admin-lab-tests', debouncedSearchTerm, categoryFilter, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(statusFilter && { isActive: statusFilter }),
      });
      const response = await axios.get(`/admin/lab-tests?${params}`);
      return response.data.data;
    },
    placeholderData: keepPreviousData,
  });

  // Create lab test mutation
  const createTestMutation = useMutation({
    mutationFn: async (testData: Partial<LabTest>) => {
      const response = await axios.post('/admin/lab-tests', testData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lab-tests'] });
      toast.success('Lab test created successfully');
      setShowCreateModal(false);
      setEditingTest({});
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create lab test');
    },
  });

  // Update lab test mutation
  const updateTestMutation = useMutation({
    mutationFn: async ({ testId, testData }: { testId: number; testData: Partial<LabTest> }) => {
      const response = await axios.put(`/admin/lab-tests/${testId}`, testData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lab-tests'] });
      toast.success('Lab test updated successfully');
      setShowEditModal(false);
      setEditingTest({});
      setSelectedTest(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update lab test');
    },
  });

  // Delete lab test mutation
  const deleteTestMutation = useMutation({
    mutationFn: async (testId: number) => {
      const response = await axios.delete(`/admin/lab-tests/${testId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-lab-tests'] });
      toast.success('Lab test deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete lab test');
    },
  });

  const handleCreateTest = () => {
    if (!editingTest.name || !editingTest.category || !editingTest.price) {
      toast.error('Please fill in all required fields');
      return;
    }
    createTestMutation.mutate(editingTest);
  };

  const handleUpdateTest = () => {
    if (!selectedTest || !editingTest.name || !editingTest.category || !editingTest.price) {
      toast.error('Please fill in all required fields');
      return;
    }
    updateTestMutation.mutate({ testId: selectedTest.id, testData: editingTest });
  };

  const handleEditTest = (test: LabTest) => {
    setSelectedTest(test);
    setEditingTest({
      name: test.name,
      description: test.description,
      category: test.category,
      price: test.price,
      sampleType: test.sampleType,
      preparationInstructions: test.preparationInstructions,
      reportDeliveryTime: test.reportDeliveryTime,
      isActive: test.isActive
    });
    setShowEditModal(true);
  };

  const handleDeleteTest = (test: LabTest) => {
    if (window.confirm(`Are you sure you want to ${test.isActive ? 'deactivate' : 'delete'} "${test.name}"?`)) {
      deleteTestMutation.mutate(test.id);
    }
  };

  // Non-blocking skeleton loader: show page shell with animated placeholders while loading
  if (testsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/15 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 p-6 space-y-8">
          {/* Header skeleton */}
          <div className="rounded-3xl p-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white shadow-2xl">
            <div className="h-8 bg-white/30 rounded-md w-1/3 mb-3 animate-pulse" />
            <div className="h-4 bg-white/20 rounded-md w-1/4 animate-pulse" />
          </div>

          {/* Stats skeletons */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white/60 backdrop-blur-md rounded-2xl p-6 animate-pulse h-28" />
            ))}
          </div>

          {/* Filters skeleton */}
          <div className="bg-white/70 backdrop-blur-md rounded-3xl p-6 animate-pulse h-28" />

          {/* List skeleton */}
          <div className="bg-white/90 rounded-xl shadow-xl overflow-hidden">
            <div className="p-6">
              <div className="space-y-6">
                {[...Array(3)].map((_, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 shadow-lg">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-3" />
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="h-16 bg-gray-200 rounded" />
                      <div className="h-16 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-500/15 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Page Load overlay (fade-out) - simplified to avoid large spinning visuals */}
      <div className={`fixed inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 z-50 flex items-center justify-center transition-all duration-700 ${pageLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="text-center">
          <div className="h-3 w-48 bg-white/30 rounded-full mb-2 animate-pulse" />
          <div className="h-2 w-32 bg-white/20 rounded-full animate-pulse" />
        </div>
      </div>

      <div className="relative z-10 p-6 space-y-8">
        {/* Modern Welcome Header */}
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white shadow-2xl ${pageLoaded ? 'animate-fade-in-down' : ''}`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <BeakerIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight mb-2">
                    Lab Test Management 🧪
                  </h1>
                  <p className="text-indigo-100 text-lg">
                    Comprehensive laboratory test administration and management system
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ['admin-lab-tests'] });
                    toast.success('Data refreshed successfully');
                  }}
                  className="flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl group"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2 text-white group-hover:rotate-180 transition-transform duration-500" />
                  <span className="text-sm font-medium text-white">Refresh</span>
                </button>
                <button
                  onClick={() => {
                    setEditingTest({});
                    setShowCreateModal(true);
                  }}
                  className="flex items-center px-6 py-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white rounded-xl hover:bg-white/30 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Add New Test</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="flex items-center">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 mr-4 shadow-lg">
                  <BeakerIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-600">Total Tests</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {testsData?.pagination?.total || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-200 to-green-200 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="flex items-center">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 mr-4 shadow-lg">
                  <CheckCircleIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-600">Active Tests</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    {testsData?.tests?.filter((test: LabTest) => test.isActive).length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-200 to-red-200 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="flex items-center">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 mr-4 shadow-lg">
                  <XCircleIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-600">Inactive Tests</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent">
                    {testsData?.tests?.filter((test: LabTest) => !test.isActive).length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-200 to-purple-200 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
            <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="flex items-center">
                <div className="p-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 mr-4 shadow-lg">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-600">Categories</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    {testsData?.categories?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters and Search */}
        <div className={`relative group ${pageLoaded ? 'animate-fade-in' : ''}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-3xl blur-xl opacity-20"></div>
          <div className="relative bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/30 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-sm px-6 py-4 border-b border-white/20">
              <div className="flex items-center">
                <FunnelIcon className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Filters & Search</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Search Tests
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setPage(1);
                      }}
                      placeholder="Search by name or description"
                      className="w-full pl-10 pr-4 py-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Category Filter
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 font-medium"
                  >
                    <option value="">All Categories</option>
                    {testsData?.categories?.map((category: string) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Status Filter
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full px-3 py-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 font-medium"
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setCategoryFilter('');
                      setStatusFilter('');
                      setPage(1);
                    }}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tests List */}
        {!testsData?.tests || testsData.tests.length === 0 ? (
          <div className={`relative group ${pageLoaded ? 'animate-fade-in' : ''}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-3xl blur-xl opacity-20"></div>
            <div className="relative bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/30">
              <div className="p-12 text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full blur-xl opacity-30"></div>
                  <BeakerIcon className="relative h-16 w-16 text-indigo-500 mx-auto animate-bounce" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">No Lab Tests Found</h3>
                <p className="text-gray-600 mb-6 font-medium">
                  {searchTerm || categoryFilter ? 'No tests found with the selected filters.' : 'No lab tests have been added yet.'}
                </p>
                {!searchTerm && !categoryFilter && (
                  <button
                    onClick={() => {
                      setEditingTest({});
                      setShowCreateModal(true);
                    }}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Your First Test
                  </button>
                )}
              </div>
            </div>
          </div>
      ) : (
        <div className="bg-white/90 rounded-xl shadow-xl overflow-hidden">
          <div className="p-6">
            <div className="space-y-6">
              {Object.entries(testsData.groupedTests || {}).map(([category, tests], categoryIndex) => {
                return (
                  <div key={category} className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl overflow-hidden shadow-lg">
                    <div className="px-6 py-4 bg-white/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-indigo-900 flex items-center">
                            <TagIcon className="h-5 w-5 mr-2 text-indigo-700" />
                            {category}
                          </h3>
                          <p className="text-sm text-gray-600">{(tests as LabTest[]).length} test(s) available</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {(tests as LabTest[]).map((test: LabTest, testIndex) => {
                          return (
                            <div key={test.id} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] shadow-lg">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold text-gray-900 text-lg">{test.name}</h4>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                                      test.isActive 
                                        ? 'bg-emerald-100/80 text-emerald-800 border border-emerald-200/50' 
                                        : 'bg-rose-100/80 text-rose-800 border border-rose-200/50'
                                    }`}>
                                      {test.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-4">{test.description}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleEditTest(test)}
                                    className="p-2 text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-all duration-300 backdrop-blur-sm"
                                    title="Edit Test"
                                  >
                                    <PencilIcon className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTest(test)}
                                    className="p-2 text-rose-600 hover:bg-rose-50/80 rounded-lg transition-all duration-300 backdrop-blur-sm"
                                    title={test.isActive ? 'Deactivate Test' : 'Delete Test'}
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-3 shadow-sm">
                                  <div className="flex items-center mb-1">
                                    <CurrencyDollarIcon className="h-4 w-4 text-indigo-600 mr-2" />
                                    <span className="text-xs font-medium text-indigo-700">Price</span>
                                  </div>
                                  <p className="text-lg font-bold text-indigo-700">{formatCurrency(test.price)}</p>
                                </div>
                                
                                <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-3 shadow-sm">
                                  <div className="flex items-center mb-1">
                                    <ClockIcon className="h-4 w-4 text-indigo-600 mr-2" />
                                    <span className="text-xs font-medium text-indigo-700">Delivery Time</span>
                                  </div>
                                  <p className="text-lg font-bold text-indigo-700">{test.reportDeliveryTime}h</p>
                                </div>
                              </div>
                              
                              <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-3 shadow-sm">
                                <div className="flex items-center mb-1">
                                  <DocumentTextIcon className="h-4 w-4 text-indigo-600 mr-2" />
                                  <span className="text-xs font-medium text-indigo-700">Sample Type</span>
                                </div>
                                <p className="text-sm font-medium text-indigo-700">{test.sampleType || 'N/A'}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination */}
          {testsData.pagination && testsData.pagination.totalPages > 1 && (
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-indigo-700">
                  <span>Showing page <span className="font-semibold text-indigo-900">{testsData.pagination.currentPage}</span> of{' '}
                  <span className="font-semibold text-indigo-900">{testsData.pagination.totalPages}</span></span>
                  <span className="mx-2 text-indigo-400">•</span>
                  <span className="text-indigo-600">{testsData.pagination.total} total tests</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={!testsData.pagination.hasPrev}
                    className="px-3 py-2 text-sm font-medium text-indigo-600 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg hover:from-indigo-100 hover:to-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, testsData.pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(testsData.pagination.totalPages - 4, page - 2)) + i;
                      if (pageNum > testsData.pagination.totalPages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                            pageNum === page
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                              : 'text-indigo-700 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={!testsData.pagination.hasNext}
                    className="px-3 py-2 text-sm font-medium text-indigo-600 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg hover:from-indigo-100 hover:to-purple-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                    <BeakerIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Create New Lab Test</h2>
                    <p className="text-indigo-100 text-sm">Add a new laboratory test to the system</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Basic Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Test Name *
                        </label>
                        <input
                          type="text"
                          value={editingTest.name || ''}
                          onChange={(e) => setEditingTest({ ...editingTest, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Enter test name"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={editingTest.description || ''}
                          onChange={(e) => setEditingTest({ ...editingTest, description: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          rows={3}
                          placeholder="Enter test description"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-600" />
                      Pricing & Category
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                        <select
                          value={editingTest.category || ''}
                          onChange={(e) => setEditingTest({ ...editingTest, category: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                        >
                          <option value="">Select Category</option>
                          <option value="Blood Tests">Blood Tests</option>
                          <option value="Imaging Tests">Imaging Tests</option>
                          <option value="Urine Tests">Urine Tests</option>
                          <option value="Cardiac Tests">Cardiac Tests</option>
                          <option value="Hormone Tests">Hormone Tests</option>
                          <option value="Cancer Screening">Cancer Screening</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price (৳) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingTest.price || ''}
                          onChange={(e) => setEditingTest({ ...editingTest, price: parseFloat(e.target.value) })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-purple-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <ClockIcon className="h-5 w-5 mr-2 text-purple-600" />
                      Test Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sample Type
                        </label>
                        <input
                          type="text"
                          value={editingTest.sampleType || ''}
                          onChange={(e) => setEditingTest({ ...editingTest, sampleType: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="e.g., Blood, Urine, N/A"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Report Delivery Time (hours)
                        </label>
                        <input
                          type="number"
                          value={editingTest.reportDeliveryTime || ''}
                          onChange={(e) => setEditingTest({ ...editingTest, reportDeliveryTime: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="24"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <DocumentTextIcon className="h-5 w-5 mr-2 text-yellow-600" />
                      Preparation Instructions
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instructions
                      </label>
                      <textarea
                        value={editingTest.preparationInstructions || ''}
                        onChange={(e) => setEditingTest({ ...editingTest, preparationInstructions: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        rows={4}
                        placeholder="Enter preparation instructions for patients"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTest}
                  disabled={createTestMutation.isPending}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                >
                  {createTestMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Test'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Test Modal */}
      {showEditModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-hidden">
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg border border-white/30">
                    <PencilIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Edit Lab Test</h2>
                    <p className="text-emerald-100 text-sm">Update laboratory test information</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-blue-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <DocumentTextIcon className="h-5 w-5 mr-2 text-blue-600" />
                      Basic Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Test Name *
                        </label>
                        <input
                          type="text"
                          value={editingTest.name || ''}
                          onChange={(e) => setEditingTest({ ...editingTest, name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={editingTest.description || ''}
                          onChange={(e) => setEditingTest({ ...editingTest, description: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          rows={3}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CurrencyDollarIcon className="h-5 w-5 mr-2 text-green-600" />
                      Pricing & Category
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                        <select
                          value={editingTest.category || ''}
                          onChange={(e) => setEditingTest({ ...editingTest, category: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                        >
                          <option value="">Select Category</option>
                          <option value="Blood Tests">Blood Tests</option>
                          <option value="Imaging Tests">Imaging Tests</option>
                          <option value="Urine Tests">Urine Tests</option>
                          <option value="Cardiac Tests">Cardiac Tests</option>
                          <option value="Hormone Tests">Hormone Tests</option>
                          <option value="Cancer Screening">Cancer Screening</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price (৳) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editingTest.price || ''}
                          onChange={(e) => setEditingTest({ ...editingTest, price: parseFloat(e.target.value) })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-purple-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <ClockIcon className="h-5 w-5 mr-2 text-purple-600" />
                      Test Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Sample Type
                        </label>
                        <input
                          type="text"
                          value={editingTest.sampleType || ''}
                          onChange={(e) => setEditingTest({ ...editingTest, sampleType: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Report Delivery Time (hours)
                        </label>
                        <input
                          type="number"
                          value={editingTest.reportDeliveryTime || ''}
                          onChange={(e) => setEditingTest({ ...editingTest, reportDeliveryTime: parseInt(e.target.value) })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <DocumentTextIcon className="h-5 w-5 mr-2 text-yellow-600" />
                      Preparation Instructions
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instructions
                      </label>
                      <textarea
                        value={editingTest.preparationInstructions || ''}
                        onChange={(e) => setEditingTest({ ...editingTest, preparationInstructions: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        rows={4}
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <CheckCircleIcon className="h-5 w-5 mr-2 text-gray-600" />
                      Status
                    </h3>
                    <div>
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={editingTest.isActive || false}
                          onChange={(e) => setEditingTest({ ...editingTest, isActive: e.target.checked })}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">Test is active and available for ordering</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex gap-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTest}
                  disabled={updateTestMutation.isPending}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                >
                  {updateTestMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Test'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminLabTests;
