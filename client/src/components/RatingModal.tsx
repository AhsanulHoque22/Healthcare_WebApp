import React, { useState } from 'react';
import { StarIcon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getDepartmentLabel } from '../utils/departments';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: {
    id: number;
    appointmentDate: string;
    appointmentTime: string;
    doctor: {
      user: {
        firstName: string;
        lastName: string;
      };
      department: string;
    };
  };
  onRatingSubmitted?: () => void;
}

const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onRatingSubmitted
}) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/ratings', {
        appointmentId: appointment.id,
        rating,
        review: review.trim() || null,
        feedback: feedback.trim() || null,
        isAnonymous
      });

      toast.success('Rating submitted successfully! Thank you for your feedback.');
      onClose();
      onRatingSubmitted?.();
      
      // Reset form
      setRating(0);
      setReview('');
      setFeedback('');
      setIsAnonymous(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Rate Your Experience</h2>
              <p className="text-gray-600 mt-1">Help us improve our services</p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Appointment Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Dr. {appointment.doctor.user.firstName} {appointment.doctor.user.lastName}
                </h3>
                <p className="text-sm text-gray-600">
                  {getDepartmentLabel(appointment.doctor.department)}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Stars */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                How would you rate your experience? *
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    disabled={isSubmitting}
                    className="focus:outline-none disabled:opacity-50"
                  >
                    {star <= rating ? (
                      <StarIconSolid className="h-8 w-8 text-yellow-400" />
                    ) : (
                      <StarIcon className="h-8 w-8 text-gray-300 hover:text-yellow-400" />
                    )}
                  </button>
                ))}
                <span className="ml-3 text-sm text-gray-600">
                  {rating === 0 ? 'Select a rating' : 
                   rating === 1 ? 'Poor' :
                   rating === 2 ? 'Fair' :
                   rating === 3 ? 'Good' :
                   rating === 4 ? 'Very Good' : 'Excellent'}
                </span>
              </div>
            </div>

            {/* Review */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review (Optional)
              </label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience with this doctor..."
                rows={4}
                maxLength={1000}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                {review.length}/1000 characters
              </p>
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback for Improvement (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Any suggestions for improvement or additional feedback..."
                rows={3}
                maxLength={1000}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                {feedback.length}/1000 characters
              </p>
            </div>

            {/* Anonymous Option */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                disabled={isSubmitting}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
                Submit anonymously (your name won't be shown publicly)
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="btn-outline disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="btn-primary disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
