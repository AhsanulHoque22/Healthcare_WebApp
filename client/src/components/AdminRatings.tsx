import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  StarIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface Rating {
  id: number;
  rating: number;
  review: string | null;
  feedback: string | null;
  isAnonymous: boolean;
  status: string;
  createdAt: string;
  appointment: {
    id: number;
    appointmentDate: string;
    appointmentTime: string;
    type: string;
    doctor: {
      user: {
        firstName: string;
        lastName: string;
      };
      department: string;
    };
  };
  patient: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

interface RatingStats {
  averageRating: string;
  totalRatings: number;
  pendingRatings: number;
  approvedRatings: number;
  rejectedRatings: number;
}

interface AdminRatingsProps {
  pageLoaded?: boolean;
}

const AdminRatings: React.FC<AdminRatingsProps> = ({ pageLoaded = true }) => {
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const queryClient = useQueryClient();

  const { data: ratingsData, isLoading } = useQuery({
    queryKey: ['admin-ratings', statusFilter, ratingFilter, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (ratingFilter !== 'all') params.append('rating', ratingFilter);
      params.append('page', currentPage.toString());

      const response = await axios.get(`/ratings/admin/all?${params}`);
      return response.data.data;
    },
  });

  const { data: statsData } = useQuery({
    queryKey: ['rating-stats'],
    queryFn: async () => {
      const response = await axios.get('/ratings/admin/stats');
      return response.data.data;
    },
  });

  const ratings = ratingsData?.ratings || [];
  const pagination = ratingsData?.pagination;
  const stats = statsData?.overall || {};

  const handleStatusUpdate = async (ratingId: number, status: string) => {
    try {
      await axios.put(`/ratings/admin/${ratingId}/status`, { status });
      toast.success(`Rating ${status} successfully`);
      queryClient.invalidateQueries({ queryKey: ['admin-ratings'] });
      queryClient.invalidateQueries({ queryKey: ['rating-stats'] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update rating status');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= rating ? (
            <StarIconSolid key={star} className="h-4 w-4 text-yellow-400" />
          ) : (
            <StarIcon key={star} className="h-4 w-4 text-gray-300" />
          )
        ))}
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon className="h-4 w-4" />;
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'rejected': return <XCircleIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Enhanced Loading Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-2xl blur-xl opacity-20 animate-pulse"></div>
              <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-gray-300 to-gray-400 mr-4 animate-pulse">
                    <div className="h-6 w-6 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enhanced Loading Content */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-3xl blur-xl opacity-20"></div>
          <div className="relative bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/30 p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 animate-pulse">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Stats Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-cyan-200 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
          <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
            <div className="flex items-center">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 mr-4 shadow-lg">
                <StarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600">Average Rating</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">{stats.averageRating || '0.0'}</p>
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
                <p className="text-sm font-bold text-gray-600">Approved</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{stats.approvedRatings || 0}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-200 to-orange-200 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
          <div className="relative bg-white/60 backdrop-blur-md rounded-2xl shadow-lg border border-white/20 p-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
            <div className="flex items-center">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 mr-4 shadow-lg">
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-600">Pending</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{stats.pendingRatings || 0}</p>
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
                <p className="text-sm font-bold text-gray-600">Rejected</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent">{stats.rejectedRatings || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
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
            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-gray-700">Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-sm font-medium"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-bold text-gray-700">Rating:</label>
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="px-4 py-3 bg-white/60 backdrop-blur-sm rounded-xl border border-white/40 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 text-sm font-medium"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              <div className="text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 rounded-xl font-medium shadow-lg">
                Showing <span className="font-bold">{ratings.length}</span> of <span className="font-bold">{pagination?.totalRatings || 0}</span> ratings
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Ratings List */}
      <div className={`relative group ${pageLoaded ? 'animate-fade-in' : ''}`}>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-3xl blur-xl opacity-20"></div>
        <div className="relative bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/30 overflow-hidden">
          <div className="p-6">
            <div className="space-y-6">
              {ratings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-full blur-xl opacity-30"></div>
                    <StarIcon className="relative h-16 w-16 text-indigo-500 mx-auto animate-bounce" />
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">No Ratings Found</h3>
                  <p className="text-gray-600 font-medium">No ratings match your current filters</p>
                </div>
              ) : (
                ratings.map((rating: Rating) => (
                  <div key={rating.id} className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <div className="relative bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                              <UserIcon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-bold text-gray-900 text-lg">
                                  {rating.isAnonymous ? 'Anonymous Patient' :
                                   `${rating.patient.user.firstName} ${rating.patient.user.lastName}`}
                                </p>
                                <span className={`px-3 py-1 text-xs font-bold rounded-full backdrop-blur-sm border ${getStatusColor(rating.status)} ${
                                  rating.status === 'approved' ? 'border-green-200' :
                                  rating.status === 'pending' ? 'border-yellow-200' : 'border-red-200'
                                }`}>
                                  {getStatusIcon(rating.status)}
                                  <span className="ml-1 capitalize">{rating.status}</span>
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                {renderStars(rating.rating)}
                                <span className="text-gray-400">•</span>
                                <span className="font-bold">Dr. {rating.appointment.doctor.user.firstName} {rating.appointment.doctor.user.lastName}</span>
                                <span className="text-gray-400">•</span>
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="h-4 w-4" />
                                  {new Date(rating.appointment.appointmentDate).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>

                          {rating.review && (
                            <div className="mb-4 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-white/50">
                              <p className="text-gray-700 leading-relaxed font-medium">{rating.review}</p>
                            </div>
                          )}

                          {rating.feedback && (
                            <div className="bg-gradient-to-r from-indigo-100/90 to-purple-100/90 backdrop-blur-sm rounded-xl p-4 mb-4 border border-indigo-200/50">
                              <p className="text-sm text-indigo-800 font-medium">
                                <span className="font-bold">Admin Feedback:</span> {rating.feedback}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col space-y-3 ml-6">
                          <button
                            onClick={() => {
                              setSelectedRating(rating);
                              setShowDetailModal(true);
                            }}
                            className="flex items-center gap-2 text-white text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                          >
                            <EyeIcon className="h-4 w-4" />
                            View Details
                          </button>

                          {rating.status === 'pending' && (
                            <div className="flex flex-col space-y-2">
                              <button
                                onClick={() => handleStatusUpdate(rating.id, 'approved')}
                                className="flex items-center gap-2 text-white text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(rating.id, 'rejected')}
                                className="flex items-center gap-2 text-white text-sm px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                              >
                                <XCircleIcon className="h-4 w-4" />
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className={`relative group ${pageLoaded ? 'animate-fade-in' : ''}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-3xl blur-xl opacity-20"></div>
          <div className="relative bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-white/30 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-sm px-6 py-4">
              <div className="flex justify-center items-center gap-4">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-6 py-3 text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  <span className="px-6 py-3 text-sm text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-medium shadow-lg">
                    Page <span className="font-bold">{pagination.currentPage}</span> of <span className="font-bold">{pagination.totalPages}</span>
                  </span>
                </div>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="px-6 py-3 text-sm text-white bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Detail Modal */}
      {showDetailModal && selectedRating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="relative group max-w-4xl w-full max-h-[95vh]">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-3xl blur-xl opacity-50"></div>
            <div className="relative bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 rounded-t-3xl">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg">
                      <StarIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Rating Details</h2>
                      <p className="text-indigo-100 text-sm">Complete rating information and management</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
                    <label className="text-sm font-medium text-indigo-700 block mb-2">Patient</label>
                    <p className="text-gray-900 font-medium">
                      {selectedRating.isAnonymous ? 'Anonymous Patient' :
                       `${selectedRating.patient.user.firstName} ${selectedRating.patient.user.lastName}`}
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
                    <label className="text-sm font-medium text-indigo-700 block mb-2">Doctor</label>
                    <p className="text-gray-900 font-medium">
                      Dr. {selectedRating.appointment.doctor.user.firstName} {selectedRating.appointment.doctor.user.lastName}
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
                    <label className="text-sm font-medium text-indigo-700 block mb-2">Appointment Date</label>
                    <p className="text-gray-900 font-medium">
                      {new Date(selectedRating.appointment.appointmentDate).toLocaleDateString()} at {selectedRating.appointment.appointmentTime}
                    </p>
                  </div>
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4">
                    <label className="text-sm font-medium text-indigo-700 block mb-2">Rating</label>
                    <div className="flex items-center gap-2">
                      {renderStars(selectedRating.rating)}
                      <span className="text-gray-900 font-medium">({selectedRating.rating}/5)</span>
                    </div>
                  </div>
                </div>

                {selectedRating.review && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6">
                    <label className="text-sm font-medium text-indigo-700 block mb-3">Patient Review</label>
                    <p className="text-gray-900 leading-relaxed">{selectedRating.review}</p>
                  </div>
                )}

                {selectedRating.feedback && (
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-6">
                    <label className="text-sm font-medium text-emerald-700 block mb-3">Admin Feedback</label>
                    <p className="text-gray-900 leading-relaxed">{selectedRating.feedback}</p>
                  </div>
                )}

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  {selectedRating.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedRating.id, 'approved');
                          setShowDetailModal(false);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-lg hover:from-emerald-700 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        <CheckCircleIcon className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          handleStatusUpdate(selectedRating.id, 'rejected');
                          setShowDetailModal(false);
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded-lg hover:from-rose-700 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        <XCircleIcon className="h-4 w-4" />
                        Reject
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  ); 
};

export default AdminRatings;
