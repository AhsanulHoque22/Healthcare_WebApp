import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  BeakerIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseCircleIcon,
  FunnelIcon,
  EyeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface Medicine {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  duration: number; // in days
  doctor: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
  dosages: Array<{
    id: number;
    takenAt: string;
    quantity: number;
    notes?: string;
  }>;
  reminders: Array<{
    id: number;
    time: string;
    dayOfWeek: string;
    isActive: boolean;
  }>;
}

interface MedicineStats {
  totalMedicines: number;
  activeMedicines: number;
  completedMedicines: number;
  averageAdherence: number;
  medicines: Medicine[];
}

const MedicineHistory: React.FC<{ patientId: number }> = ({ patientId }) => {
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [medicineFilter, setMedicineFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [pageLoaded, setPageLoaded] = useState(false);

  // Fetch medicine history and stats
  const { data: medicineStats, isLoading } = useQuery<MedicineStats>({
    queryKey: ['medicine-stats', patientId],
    queryFn: async () => {
      const response = await axios.get(`/medicines/patients/${patientId}/stats`);
      return response.data.data;
    },
    enabled: !!patientId,
  });

  // Page load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const calculateAdherencePercentage = (medicine: Medicine): number => {
    if (!medicine.dosages || medicine.dosages.length === 0) {
      return 0;
    }

    let expectedDosages = 0;
    
    if (medicine.endDate) {
      // For completed medicines, calculate based on duration
      const startDate = new Date(medicine.startDate);
      const endDate = new Date(medicine.endDate);
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      
      // Parse frequency to get daily dosage count
      const frequency = medicine.frequency.toLowerCase();
      let dailyDosages = 1;
      
      if (frequency.includes('twice') || frequency.includes('2 times')) {
        dailyDosages = 2;
      } else if (frequency.includes('three times') || frequency.includes('3 times')) {
        dailyDosages = 3;
      } else if (frequency.includes('four times') || frequency.includes('4 times')) {
        dailyDosages = 4;
      }
      
      expectedDosages = totalDays * dailyDosages;
    } else if (medicine.isActive) {
      // For active medicines, calculate based on days since start
      const startDate = new Date(medicine.startDate);
      const now = new Date();
      const totalDays = Math.ceil((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      
      // Parse frequency to get daily dosage count
      const frequency = medicine.frequency.toLowerCase();
      let dailyDosages = 1;
      
      if (frequency.includes('twice') || frequency.includes('2 times')) {
        dailyDosages = 2;
      } else if (frequency.includes('three times') || frequency.includes('3 times')) {
        dailyDosages = 3;
      } else if (frequency.includes('four times') || frequency.includes('4 times')) {
        dailyDosages = 4;
      }
      
      expectedDosages = totalDays * dailyDosages;
    }
    
    const actualDosages = medicine.dosages.length;
    return Math.min(100, Math.round((actualDosages / Math.max(1, expectedDosages)) * 100));
  };

  const getAdherenceColor = (percentage: number): string => {
    if (percentage >= 80) return 'text-green-600 bg-green-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getMedicineStatus = (medicine: Medicine): { label: string; color: string; icon: React.ReactNode } => {
    if (!medicine.isActive && medicine.endDate) {
      return {
        label: 'Completed',
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircleIcon className="h-4 w-4" />
      };
    } else if (!medicine.isActive && !medicine.endDate) {
      return {
        label: 'Discontinued',
        color: 'bg-red-100 text-red-800',
        icon: <XCircleIcon className="h-4 w-4" />
      };
    } else {
      return {
        label: 'Active',
        color: 'bg-blue-100 text-blue-800',
        icon: <PauseCircleIcon className="h-4 w-4" />
      };
    }
  };

  const formatDuration = (days: number): string => {
    if (days >= 365) {
      const years = Math.floor(days / 365);
      const remainingDays = days % 365;
      return `${years} year${years > 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} days` : ''}`;
    } else if (days >= 30) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      return `${months} month${months > 1 ? 's' : ''}${remainingDays > 0 ? ` ${remainingDays} days` : ''}`;
    } else {
      return `${days} day${days > 1 ? 's' : ''}`;
    }
  };

  const handleViewDetails = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setShowDetailModal(true);
  };

  // Filter medicines based on selected filter
  const filteredMedicines = medicineStats?.medicines.filter((medicine) => {
    if (medicineFilter === 'all') return true;
    if (medicineFilter === 'active') return medicine.isActive;
    if (medicineFilter === 'completed') return !medicine.isActive && medicine.endDate;
    return true;
  }) || [];

  // Calculate filtered statistics
  const filteredStats = {
    totalMedicines: filteredMedicines.length,
    activeMedicines: filteredMedicines.filter(m => m.isActive).length,
    completedMedicines: filteredMedicines.filter(m => !m.isActive && m.endDate).length,
    averageAdherence: filteredMedicines.length > 0 
      ? Math.round(filteredMedicines.reduce((sum, m) => sum + calculateAdherencePercentage(m), 0) / filteredMedicines.length)
      : 0
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="text-gray-600 mt-4">Loading medicine history...</p>
      </div>
    );
  }

  if (!medicineStats || medicineStats.medicines.length === 0) {
    return (
      <div className="text-center py-12">
        <BeakerIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No medicine history found</p>
        <p className="text-gray-400 text-sm mt-2">
          Your medicine history will appear here after your doctor prescribes medications
        </p>
      </div>
    );
  }

  if (filteredMedicines.length === 0) {
    return (
      <div className="space-y-6">
        {/* Filter Section */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Medicine History</h3>
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-gray-500" />
            <select 
              value={medicineFilter}
              onChange={(e) => setMedicineFilter(e.target.value as 'all' | 'active' | 'completed')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
            >
              <option value="all">All Medicines</option>
              <option value="active">Active Medicines</option>
              <option value="completed">Completed Medicines</option>
            </select>
          </div>
        </div>

        <div className="text-center py-12">
          <BeakerIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            No {medicineFilter === 'all' ? '' : medicineFilter} medicines found
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {medicineFilter === 'active' && 'You have no active medications at the moment'}
            {medicineFilter === 'completed' && 'You have no completed medication courses'}
            {medicineFilter === 'all' && 'Your medicine history will appear here after your doctor prescribes medications'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Section */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Medicine History</h3>
          <p className="text-sm text-gray-600">
            Showing {filteredStats.totalMedicines} of {medicineStats.totalMedicines} medicines
            {medicineFilter !== 'all' && ` (${medicineFilter} only)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-4 w-4 text-gray-500" />
          <select 
            value={medicineFilter}
            onChange={(e) => setMedicineFilter(e.target.value as 'all' | 'active' | 'completed')}
            className="px-4 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:shadow-md hover:scale-105"
          >
            <option value="all">All Medicines</option>
            <option value="active">Active Medicines</option>
            <option value="completed">Completed Medicines</option>
          </select>
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setMedicineFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md ${
            medicineFilter === 'all'
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md animate-pulse'
              : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/80 border border-gray-200/50'
          }`}
        >
          All ({medicineStats.totalMedicines})
        </button>
        <button
          onClick={() => setMedicineFilter('active')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md ${
            medicineFilter === 'active'
              ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md animate-bounce'
              : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/80 border border-gray-200/50'
          }`}
        >
          Active ({medicineStats.activeMedicines})
        </button>
        <button
          onClick={() => setMedicineFilter('completed')}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-500 hover:scale-105 shadow-sm hover:shadow-md ${
            medicineFilter === 'completed'
              ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-md animate-pulse'
              : 'bg-white/50 backdrop-blur-sm text-gray-700 hover:bg-white/80 border border-gray-200/50'
          }`}
        >
          Completed ({medicineStats.completedMedicines})
        </button>
      </div>

      {/* Filter Status Indicator */}
      {medicineFilter !== 'all' && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/50 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-800">
              Filtered by: {medicineFilter === 'active' ? 'Active Medicines' : 'Completed Medicines'}
            </span>
            <button
              onClick={() => setMedicineFilter('all')}
              className="text-indigo-600 hover:text-indigo-800 text-sm underline ml-2 font-medium hover:no-underline transition-all duration-300 hover:scale-105"
            >
              Show All
            </button>
          </div>
        </div>
      )}

      {/* Medicine Statistics */}
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
          <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-3 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <BeakerIcon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-blue-600">Total Medicines</p>
                <p className="text-2xl font-bold text-blue-900">{medicineStats.totalMedicines}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/20 to-green-200/20 rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
          <div className="relative bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-xl border border-emerald-200/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg p-3 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <CheckCircleIcon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-emerald-600">Active</p>
                <p className="text-2xl font-bold text-emerald-900">{medicineStats.activeMedicines}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-200/20 to-violet-200/20 rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
          <div className="relative bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-xl border border-purple-200/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg p-3 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <XCircleIcon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-purple-600">Completed</p>
                <p className="text-2xl font-bold text-purple-900">{medicineStats.completedMedicines}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-200/20 to-orange-200/20 rounded-xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
          <div className="relative bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-xl border border-amber-200/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-lg p-3 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                <ClockIcon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-amber-600">Avg. Adherence</p>
                <p className="text-2xl font-bold text-amber-900">{medicineStats.averageAdherence}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Medicine History List */}
      <div className={`space-y-4 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
        {filteredMedicines.map((medicine, index) => {
          const adherence = calculateAdherencePercentage(medicine);
          const status = getMedicineStatus(medicine);
          const duration = medicine.endDate 
            ? Math.ceil((new Date(medicine.endDate).getTime() - new Date(medicine.startDate).getTime()) / (24 * 60 * 60 * 1000))
            : Math.ceil((Date.now() - new Date(medicine.startDate).getTime()) / (24 * 60 * 60 * 1000));

          return (
            <div
              key={medicine.id}
              className="relative group bg-gradient-to-r from-white to-blue-50 rounded-xl p-6 border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-200/20 to-indigo-200/20 rounded-xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
              <div className="relative">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg p-3 text-white">
                      <BeakerIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                          status.label === 'Active' ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200' :
                          status.label === 'Completed' ? 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200' :
                          'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                        }`}>
                          {status.icon}
                          {status.label}
                        </span>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          adherence >= 80 ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' :
                          adherence >= 60 ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200' :
                          'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
                        }`}>
                          {adherence}% Adherence
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {new Date(medicine.startDate).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-lg">{medicine.name}</h4>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <ClockIcon className="h-4 w-4 text-indigo-600" />
                        {medicine.dosage} • {medicine.frequency}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-900">Prescribed by:</span> Dr. {medicine.doctor.user.firstName} {medicine.doctor.user.lastName}
                      </p>
                    </div>
                    <div className="bg-white/50 rounded-lg p-3">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-900">Duration:</span> {formatDuration(duration)}
                      </p>
                    </div>
                  </div>

                  {medicine.instructions && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200/50 mb-4">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold text-gray-900">Instructions:</span> {medicine.instructions}
                      </p>
                    </div>
                  )}

                  {/* Completion Summary for completed medicines */}
                  {!medicine.isActive && medicine.endDate && (
                    <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-200/50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h5 className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4" />
                            Course Completion Summary
                          </h5>
                          <p className="text-xs text-purple-600 mt-1">
                            Completed on {new Date(medicine.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getAdherenceColor(adherence).split(' ')[0]}`}>
                            {adherence}%
                          </div>
                          <p className="text-xs text-purple-600">Final Adherence</p>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-purple-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              adherence >= 80 ? 'bg-green-500' : 
                              adherence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${adherence}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-purple-600 mt-1">
                          {adherence >= 80 ? 'Excellent adherence!' : 
                           adherence >= 60 ? 'Good adherence' : 'Room for improvement'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleViewDetails(medicine)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-lg animate-pulse"
                  >
                    <EyeIcon className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Medicine Detail Modal */}
      {showDetailModal && selectedMedicine && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <BeakerIcon className="h-6 w-6 mr-2 text-indigo-600" />
                  Medicine Details: {selectedMedicine.name}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-all duration-300 p-2 hover:bg-gray-100 rounded-full hover:scale-110 hover:shadow-md"
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200/50">
                    <label className="text-sm font-medium text-blue-600">Dosage</label>
                    <p className="text-gray-900 font-semibold mt-1">{selectedMedicine.dosage}</p>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-200/50">
                    <label className="text-sm font-medium text-emerald-600">Frequency</label>
                    <p className="text-gray-900 font-semibold mt-1">{selectedMedicine.frequency}</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg p-4 border border-purple-200/50">
                    <label className="text-sm font-medium text-purple-600">Start Date</label>
                    <p className="text-gray-900 font-semibold mt-1">{new Date(selectedMedicine.startDate).toLocaleDateString()}</p>
                  </div>
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-4 border border-amber-200/50">
                    <label className="text-sm font-medium text-amber-600">End Date</label>
                    <p className="text-gray-900 font-semibold mt-1">
                      {selectedMedicine.endDate 
                        ? new Date(selectedMedicine.endDate).toLocaleDateString() 
                        : 'Ongoing'
                      }
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200/50">
                    <label className="text-sm font-medium text-indigo-600">Prescribed by</label>
                    <p className="text-gray-900 font-semibold mt-1">
                      Dr. {selectedMedicine.doctor.user.firstName} {selectedMedicine.doctor.user.lastName}
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg p-4 border border-rose-200/50">
                    <label className="text-sm font-medium text-rose-600">Adherence</label>
                    <p className={`px-3 py-1 rounded-full text-sm font-bold inline-block mt-1 ${getAdherenceColor(calculateAdherencePercentage(selectedMedicine))}`}>
                      {calculateAdherencePercentage(selectedMedicine)}%
                    </p>
                  </div>
                </div>

                {/* Instructions */}
                {selectedMedicine.instructions && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-200/50">
                    <label className="text-sm font-medium text-indigo-600">Instructions</label>
                    <p className="text-gray-900 mt-2 font-medium">{selectedMedicine.instructions}</p>
                  </div>
                )}

                {/* Dosage History */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-4 border border-emerald-200/50">
                  <label className="text-sm font-medium text-emerald-600">Dosage History</label>
                  {selectedMedicine.dosages.length > 0 ? (
                    <div className="mt-3 space-y-3 max-h-40 overflow-y-auto">
                      {selectedMedicine.dosages.map((dosage) => (
                        <div key={dosage.id} className="bg-white/70 rounded-lg p-3 border border-white/50">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900">
                              {new Date(dosage.takenAt).toLocaleDateString()} at {new Date(dosage.takenAt).toLocaleTimeString()}
                            </span>
                            <span className="text-sm text-emerald-700 font-semibold">Quantity: {dosage.quantity}</span>
                          </div>
                          {dosage.notes && (
                            <p className="text-sm text-gray-600 mt-2">{dosage.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm mt-3">No dosage history recorded</p>
                  )}
                </div>

                {/* Reminders */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200/50">
                  <label className="text-sm font-medium text-blue-600">Reminders</label>
                  {selectedMedicine.reminders.length > 0 ? (
                    <div className="mt-3 space-y-3">
                      {selectedMedicine.reminders.map((reminder) => (
                        <div key={reminder.id} className="bg-white/70 rounded-lg p-3 border border-white/50">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-900">
                              {reminder.time} - {reminder.dayOfWeek}
                            </span>
                            <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
                              reminder.isActive ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200'
                            }`}>
                              {reminder.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm mt-3">No reminders set</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-lg font-medium animate-pulse"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineHistory;
