import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  StarIcon, 
  UserIcon, 
  CalendarIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

interface DoctorRatingsProps {
  doctorId: number;
  showAll?: boolean;
}

interface Rating {
  id: number;
  rating: number;
  review: string | null;
  feedback: string | null;
  isAnonymous: boolean;
  status: string;
  createdAt: string;
  appointment: {
    appointmentDate: string;
    appointmentTime: string;
    type: string;
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
}

const DoctorRatings: React.FC<DoctorRatingsProps> = ({ doctorId, showAll = false }) => {
  const [showAllReviews, setShowAllReviews] = useState(false);

  const { data: ratingsData, isLoading } = useQuery({
    queryKey: ['doctor-ratings', doctorId, showAllReviews ? 'all' : 'approved'],
    queryFn: async () => {
      const status = showAll ? 'all' : 'approved';
      const response = await axios.get(`/ratings/doctor/${doctorId}?status=${status}&limit=${showAllReviews ? 50 : 5}`);
      return response.data.data;
    },
    enabled: !!doctorId,
  });

  const ratings = ratingsData?.ratings || [];
  const stats = ratingsData?.summary || { averageRating: '0.0', totalRatings: 0 };

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

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!ratings || ratings.length === 0) {
    return (
      <div className="text-center py-8">
        <StarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No ratings available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Rating Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">{stats.averageRating}</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                {renderStars(Math.round(parseFloat(stats.averageRating)))}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Based on {stats.totalRatings} rating{stats.totalRatings !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {ratings.length > 5 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm"
            >
              {showAllReviews ? (
                <>
                  <EyeSlashIcon className="h-4 w-4" />
                  Show Less
                </>
              ) : (
                <>
                  <EyeIcon className="h-4 w-4" />
                  Show All ({ratings.length})
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Ratings List */}
      <div className="space-y-4">
        {(showAllReviews ? ratings : ratings.slice(0, 5)).map((rating: Rating) => (
          <div key={rating.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-primary-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {rating.isAnonymous ? 'Anonymous Patient' : 
                       `${rating.patient.user.firstName} ${rating.patient.user.lastName}`}
                    </p>
                    {rating.status !== 'approved' && (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(rating.status)}`}>
                        {rating.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {renderStars(rating.rating)}
                    <span className="text-gray-500">•</span>
                    <span>{getRatingLabel(rating.rating)}</span>
                    <span className="text-gray-500">•</span>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {new Date(rating.appointment.appointmentDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {rating.review && (
              <div className="mb-3">
                <p className="text-gray-700">{rating.review}</p>
              </div>
            )}

            {rating.feedback && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Feedback:</span> {rating.feedback}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {!showAllReviews && ratings.length > 5 && (
        <div className="text-center">
          <button
            onClick={() => setShowAllReviews(true)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View all {ratings.length} reviews
          </button>
        </div>
      )}
    </div>
  );
};

export default DoctorRatings;
