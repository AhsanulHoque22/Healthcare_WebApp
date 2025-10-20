import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  HeartIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pageLoaded, setPageLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
    getValues
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setErrorMessage(''); // Clear previous errors

    try {
      await axios.post('/auth/forgot-password', { email: data.email });
      setEmailSent(true);
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send reset email';
      setErrorMessage(message);
      toast.error(message);
      console.error('Forgot password error:', error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
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
            {/* Success Card */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/30 to-green-200/30 rounded-3xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
              <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 overflow-hidden hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] hover:-translate-y-2">
                {/* Card Background Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-green-50/30 to-blue-50/50 rounded-3xl"></div>

                <div className="relative z-10">
                  <div className="text-center">
                    <div className="relative group mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/40 to-green-200/40 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                      <div className="relative w-16 h-16 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300 animate-bounce-in">
                        <CheckCircleIcon className="h-8 w-8 text-white" />
                        <SparklesIcon className="h-4 w-4 text-white/70 absolute -top-1 -right-1 animate-pulse" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Check your email
                    </h2>
                    <p className="text-gray-600 mb-2">
                      We've sent password reset instructions to
                    </p>
                    <p className="font-semibold text-indigo-600 mb-6">
                      {getValues('email')}
                    </p>
                    <p className="text-sm text-gray-600 mb-8">
                      Didn't receive the email? Check your spam folder or{' '}
                      <button
                        onClick={() => setEmailSent(false)}
                        className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors duration-300 hover:scale-105 inline-block"
                      >
                        try again
                      </button>
                    </p>
                  </div>

                  <div className="space-y-4">
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
          {/* Forgot Password Card */}
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
                      <HeartIcon className="h-8 w-8 text-white" />
                      <SparklesIcon className="h-4 w-4 text-white/70 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Forgot your password?
                  </h2>
                  <p className="text-gray-600">
                    Enter your email address and we'll send you instructions to reset your password.
                  </p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          {...register('email', {
                            required: 'Email is required',
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Invalid email address'
                            }
                          })}
                          type="email"
                          autoComplete="email"
                          className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 bg-white/70 backdrop-blur-sm hover:shadow-lg focus:shadow-xl hover:scale-[1.01] focus:scale-[1.02] hover:-translate-y-1 ${
                            errors.email ? 'border-red-400 bg-red-50/70' : 'border-gray-200 hover:border-gray-300'
                          }`}
                          placeholder="Enter your email address"
                        />
                      </div>
                      {errors.email && (
                        <p className="mt-3 text-sm text-red-600 flex items-center bg-red-50/70 rounded-lg px-3 py-2">
                          <span className="mr-2">⚠️</span>
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

          {/* Server Error Message */}
                  {errorMessage && (
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-200/30 to-pink-200/30 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                      <div className="relative bg-red-50/80 backdrop-blur-sm rounded-2xl border border-red-200/50 p-4 hover:shadow-lg transition-all duration-300">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                              <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-semibold text-red-800 mb-1">
                              Error
                            </h3>
                            <p className="text-sm text-red-700">
                              {errorMessage}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-white font-semibold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:-translate-y-1 disabled:hover:scale-100 disabled:hover:translate-y-0"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                          <span>Sending...</span>
                        </div>
                      ) : (
                        <>
                          <span>Send reset instructions</span>
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

export default ForgotPassword;
