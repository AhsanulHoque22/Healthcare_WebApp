import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  EyeIcon,
  EyeSlashIcon,
  HeartIcon,
  SparklesIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const token = searchParams.get('token');

  // Page load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle scroll effect for navigation transparency
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<ResetPasswordFormData>();

  const password = watch('password');

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }

    // Verify token validity
    const verifyToken = async () => {
      try {
        await axios.get(`/auth/verify-reset-token?token=${token}`);
        setTokenValid(true);
      } catch (error) {
        setTokenValid(false);
        toast.error('Invalid or expired reset link');
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    try {
      await axios.post('/auth/reset-password', {
        token,
        password: data.password
      });
      toast.success('Password reset successfully! Please sign in with your new password.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-400/10 to-blue-600/10 rounded-full blur-3xl"></div>
        </div>

        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Verifying reset token...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-400/10 to-blue-600/10 rounded-full blur-3xl"></div>
        </div>

        {/* Header */}
        <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 hover:bg-white/60 ${
          scrolled
            ? 'bg-white/60 backdrop-blur-xl shadow-xl border-b border-white/30'
            : 'bg-white/40 backdrop-blur-lg shadow-lg border-b border-white/20'
        } ${pageLoaded ? 'animate-fade-in-down' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center group">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                  <div className="relative w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                    <HeartIcon className="h-6 w-6 text-white" />
                    <SparklesIcon className="h-3 w-3 text-white/70 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                </div>
                <span className="ml-3 text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-all duration-300 group-hover:scale-105">HealthCare Pro</span>
              </Link>
              <Link
                to="/"
                className="text-gray-600 hover:text-indigo-600 transition-all duration-300 font-medium flex items-center gap-2 group hover:scale-105 animate-bounce"
              >
                <span>Back to Home</span>
                <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </div>

        <div className="flex min-h-screen pt-16 items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className={`max-w-md w-full ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
            {/* Invalid Token Card */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-red-200/30 to-pink-200/30 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
              <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 overflow-hidden hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2">
                {/* Card Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 via-pink-50/30 to-rose-50/50 rounded-3xl"></div>

                <div className="relative z-10">
                  <div className="text-center">
                    <div className="relative group mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-200/40 to-pink-200/40 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                      <div className="relative w-16 h-16 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300 animate-bounce-in">
                        <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <SparklesIcon className="h-4 w-4 text-white/70 absolute -top-1 -right-1 animate-pulse" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Invalid Reset Link
                    </h2>
                    <p className="text-gray-600 mb-8">
                      This password reset link is invalid or has expired.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Link
                      to="/forgot-password"
                      className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-white font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1"
                    >
                      <span>Request new reset link</span>
                      <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                    <Link
                      to="/login"
                      className="group relative w-full flex justify-center items-center py-4 px-6 border-2 border-indigo-200 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1"
                    >
                      <ArrowLeftIcon className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                      Back to sign in
                    </Link>
                  </div>
                </div>
              </div>
            </div>
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
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-400/10 to-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 hover:bg-white/60 ${
        scrolled
          ? 'bg-white/60 backdrop-blur-xl shadow-xl border-b border-white/30'
          : 'bg-white/40 backdrop-blur-lg shadow-lg border-b border-white/20'
      } ${pageLoaded ? 'animate-fade-in-down' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center group">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <HeartIcon className="h-6 w-6 text-white" />
                  <SparklesIcon className="h-3 w-3 text-white/70 absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-all duration-300 group-hover:scale-105">HealthCare Pro</span>
            </Link>
            <Link
              to="/"
              className="text-gray-600 hover:text-indigo-600 transition-all duration-300 font-medium flex items-center gap-2 group hover:scale-105 animate-bounce"
            >
              <span>Back to Home</span>
              <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen pt-16 items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className={`max-w-md w-full ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
          {/* Reset Password Card */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 overflow-hidden hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2">
              {/* Card Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 rounded-3xl"></div>

              <div className="relative z-10">
                <div className="text-center mb-8">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-200/40 to-indigo-200/40 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                    <div className="relative w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300 animate-pulse">
                      <ShieldCheckIcon className="h-8 w-8 text-white" />
                      <SparklesIcon className="h-4 w-4 text-white/70 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Reset your password
                  </h2>
                  <p className="text-gray-600">
                    Enter your new password below
                  </p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          {...register('password', {
                            required: 'Password is required',
                            minLength: {
                              value: 8,
                              message: 'Password must be at least 8 characters'
                            },
                            pattern: {
                              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                              message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
                            }
                          })}
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          className={`w-full px-4 py-4 pr-12 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 backdrop-blur-sm hover:shadow-lg focus:shadow-xl hover:scale-[1.01] focus:scale-[1.02] hover:-translate-y-1 ${
                            errors.password ? 'border-red-400 bg-red-50/70' : 'border-gray-200 hover:border-gray-300'
                          }`}
                          placeholder="Enter your new password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100/50 rounded-r-xl transition-all duration-300 hover:scale-110 animate-bounce"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="mt-3 text-sm text-red-600 flex items-center bg-red-50/70 rounded-lg px-3 py-2">
                          <span className="mr-2">⚠️</span>
                          {errors.password.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-3">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          {...register('confirmPassword', {
                            required: 'Please confirm your password',
                            validate: value => value === password || 'Passwords do not match'
                          })}
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          className={`w-full px-4 py-4 pr-12 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 backdrop-blur-sm hover:shadow-lg focus:shadow-xl hover:scale-[1.01] focus:scale-[1.02] hover:-translate-y-1 ${
                            errors.confirmPassword ? 'border-red-400 bg-red-50/70' : 'border-gray-200 hover:border-gray-300'
                          }`}
                          placeholder="Confirm your new password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100/50 rounded-r-xl transition-all duration-300 hover:scale-110 animate-bounce"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                          )}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-3 text-sm text-red-600 flex items-center bg-red-50/70 rounded-lg px-3 py-2">
                          <span className="mr-2">⚠️</span>
                          {errors.confirmPassword.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-white font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 disabled:hover:scale-100 disabled:hover:translate-y-0"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          <span>Resetting...</span>
                        </div>
                      ) : (
                        <>
                          <span>Reset Password</span>
                          <ArrowRightIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                        </>
                      )}
                    </button>

                    <div className="text-center">
                      <Link
                        to="/login"
                        className="font-medium text-indigo-600 hover:text-indigo-500 flex items-center justify-center transition-all duration-300 hover:scale-105 group"
                      >
                        <ArrowLeftIcon className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                        Back to sign in
                      </Link>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
