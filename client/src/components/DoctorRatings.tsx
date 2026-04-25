import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  StarIcon, 
  UserIcon, 
  CalendarIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon
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

const DoctorRatings: React.FC<DoctorRatingsProps> = ({ doctorId, showAll = false }) => {
  const [showAllReviews, setShowAllReviews] = useState(false);

  const { data: ratingsData, isLoading } = useQuery({
    queryKey: ['doctor-ratings', doctorId, showAllReviews ? 'all' : 'approved'],
    queryFn: async () => {
      const status = showAll ? 'all' : 'approved';
      const response = await API.get(`/ratings/doctor/${doctorId}?status=${status}&limit=${showAllReviews ? 50 : 5}`);
      return response.data.data;
    },
    enabled: !!doctorId,
  });

  const ratings = ratingsData?.ratings || [];
  const stats = ratingsData?.summary || { averageRating: '0.0', totalRatings: 0 };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <motion.div
            key={star}
            initial={false}
            animate={{ scale: star <= rating ? 1 : 0.9 }}
          >
            {star <= rating ? (
              <StarIconSolid className="h-4 w-4 text-amber-400" />
            ) : (
              <StarIcon className="h-4 w-4 text-slate-200" />
            )}
          </motion.div>
        ))}
      </div>
    );
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return 'Provisional';
      case 2: return 'Standard';
      case 3: return 'Accomplished';
      case 4: return 'Exceptional';
      case 5: return 'Distinguished';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-slate-50 rounded-[32px] animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-white rounded-[32px] border border-slate-100 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!ratings || ratings.length === 0) {
    return (
      <div className="py-20 text-center bg-white rounded-[40px] border border-slate-100 border-dashed">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <SparklesIcon className="h-8 w-8 text-slate-300" />
        </div>
        <p className="text-xl font-black text-slate-900 mb-2">Registry Empty</p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No patient evaluations recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ═══ ANALYTIC SUMMARY ═══ */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 rounded-[40px] blur-2xl group-hover:opacity-100 transition-opacity opacity-0" />
        <div className="relative bg-white/70 backdrop-blur-xl rounded-[40px] p-10 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-10">
            <div className="text-center">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-2">Composite Score</span>
               <div className="text-6xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tighter">
                {stats.averageRating}
               </div>
            </div>
            <div className="h-16 w-px bg-slate-100 hidden md:block" />
            <div className="space-y-2">
               <div className="flex items-center gap-3">
                 {renderStars(Math.round(parseFloat(stats.averageRating)))}
                 <span className="text-xs font-black text-slate-900">QUALITY INDEX</span>
               </div>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Validated against {stats.totalRatings} clinical encounters
               </p>
            </div>
          </div>
          
          {ratings.length > 5 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 transition-all hover:bg-indigo-600 flex items-center gap-3"
            >
              {showAllReviews ? (
                <><EyeSlashIcon className="h-4 w-4" /> COMPRESS REGISTRY</>
              ) : (
                <><EyeIcon className="h-4 w-4" /> EXPAND REGISTRY ({ratings.length})</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ═══ EVALUATION REGISTRY ═══ */}
      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {(showAllReviews ? ratings : ratings.slice(0, 5)).map((rating: Rating, idx: number) => (
            <motion.div
              layout
              key={rating.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-[32px] p-8 border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl transition-transform group-hover:rotate-6">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                      {rating.isAnonymous ? 'Verified Anonymous' : 
                       `${rating.patient.user.firstName} ${rating.patient.user.lastName}`}
                    </h4>
                    <div className="flex items-center gap-2">
                       <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                         rating.rating >= 4 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                       }`}>
                         {getRatingLabel(rating.rating)}
                       </span>
                       <span className="w-1 h-1 bg-slate-100 rounded-full" />
                       <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                         <CalendarIcon className="h-3 w-3" />
                         {new Date(rating.appointment.appointmentDate).toLocaleDateString()}
                       </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                   {renderStars(rating.rating)}
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">{rating.status}</span>
                </div>
              </div>

              {rating.review && (
                <div className="relative pl-6 border-l-2 border-slate-50">
                  <ChatBubbleLeftRightIcon className="absolute -left-3 top-0 h-5 w-5 text-slate-100 -scale-x-100" />
                  <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                    "{rating.review}"
                  </p>
                </div>
              )}

              {rating.feedback && (
                <div className="mt-6 bg-indigo-50/50 rounded-2xl p-6 border border-indigo-50 flex items-start gap-4">
                  <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                    <SparklesIcon className="h-4 w-4" />
                  </div>
                  <p className="text-[11px] font-bold text-indigo-900 leading-relaxed">
                    <span className="font-black uppercase tracking-widest block mb-1 opacity-50">Clinical Feedback:</span>
                    {rating.feedback}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!showAllReviews && ratings.length > 5 && (
        <div className="text-center pt-10">
          <button
            onClick={() => setShowAllReviews(true)}
            className="text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-[0.3em] transition-all"
          >
            Archive Access: View All {ratings.length} Records
          </button>
        </div>
      )}
    </div>
  );
};

export default DoctorRatings;
