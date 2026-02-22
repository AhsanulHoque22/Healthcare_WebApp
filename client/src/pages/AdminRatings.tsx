import React, { useState, useEffect } from 'react';
import AdminRatings from '../components/AdminRatings';
import { StarIcon, SparklesIcon, HeartIcon } from '@heroicons/react/24/outline';

const AdminRatingsPage: React.FC = () => {
  const [pageLoaded, setPageLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Page load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Scroll effect for header transparency
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-20 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-20 w-80 h-80 bg-gradient-to-tr from-sky-400/15 to-blue-600/15 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      {/* Lightweight Page Load overlay (fade-out) */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-700 ${pageLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="text-center">
          <div className="h-3 w-48 bg-white/30 rounded-full mb-2 animate-pulse" />
          <div className="h-2 w-32 bg-white/20 rounded-full animate-pulse" />
        </div>
      </div>


      <div className="relative z-10 p-6 pt-28">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Modern Welcome Header */}
          <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white shadow-2xl ${pageLoaded ? 'animate-fade-in-down' : ''}`}>
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                    <StarIcon className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">
                      Doctor Ratings Management ⭐
                    </h1>
                    <p className="text-indigo-100 text-lg">
                      Manage and moderate doctor ratings and reviews with transparency and care
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <AdminRatings pageLoaded={pageLoaded} />
        </div>
      </div>
    </div>
  );
};

export default AdminRatingsPage;
