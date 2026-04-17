import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import API from '../api/api';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowRightIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');
  const called = useRef(false);
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing. Please check your email link.');
        return;
      }

      if (called.current) return;
      called.current = true;

      try {
        // Use the configured API instance instead of raw axios to ensure correct baseURL
        const response = await API.post('/auth/verify-email', { token });
        if (response.data.success) {
          setStatus('success');
          setMessage('Your email has been successfully verified! You can now log in to access your healthcare portal.');
          toast.success('Email verified successfully');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
      }
    };

    const timer = setTimeout(() => {
        verifyToken();
    }, 1500); // Give users a moment to see the loading animation
    return () => clearTimeout(timer);
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className={`max-w-md w-full relative z-10 transition-all duration-1000 transform ${pageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden">
          <div className={`h-2 bg-gradient-to-r ${status === 'loading' ? 'from-blue-400 via-indigo-500 to-purple-400' : status === 'success' ? 'from-emerald-400 to-teal-500' : 'from-red-400 to-rose-500'}`}></div>
          
          <div className="p-8 sm:p-12 text-center">
            {status === 'loading' && (
              <div className="flex flex-col items-center">
                <div className="relative mb-8 flex justify-center">
                  <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                  <div className="relative h-20 w-20 border-t-4 border-b-4 border-indigo-600 rounded-full animate-spin"></div>
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-2 tracking-tight">Verifying Identity</h2>
                <p className="text-gray-600">{message}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center animate-fade-in">
                <div className="relative mb-8 flex justify-center">
                  <div className="absolute inset-0 bg-emerald-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <CheckCircleIcon className="h-16 w-16 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Email Verified</h2>
                <p className="text-gray-600 mb-10 leading-relaxed font-medium">{message}</p>
                <Link
                  to="/login"
                  className="group flex items-center justify-center gap-2 w-full py-4 px-6 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl"
                >
                  <span>Proceed to Login</span>
                  <ArrowRightIcon className="h-5 w-5 transition-transform" />
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center animate-fade-in">
                <div className="relative mb-8 flex justify-center">
                  <div className="absolute inset-0 bg-rose-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                  <div className="relative bg-gradient-to-br from-rose-500 to-red-600 p-6 rounded-3xl shadow-xl transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                    <XCircleIcon className="h-16 w-16 text-white" />
                  </div>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Verification Issue</h2>
                <p className="text-gray-600 mb-10 leading-relaxed font-medium">{message}</p>
                <div className="flex flex-col gap-3 w-full">
                  <Link
                    to="/login"
                    className="group flex items-center justify-center gap-2 w-full py-4 px-6 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl"
                  >
                    <span>Back to Login</span>
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center justify-center gap-2 w-full py-3 px-4 text-gray-500 hover:text-gray-700 font-semibold transition-colors"
                  >
                    Try Registering Again
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50/50 border-t border-gray-100 p-6 text-center">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-400 tracking-widest uppercase">
              <ShieldCheckIcon className="h-4 w-4" />
              <span>Livora Healthcare Security</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
