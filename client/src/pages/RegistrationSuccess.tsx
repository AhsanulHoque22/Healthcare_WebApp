import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  EnvelopeOpenIcon, 
  CheckCircleIcon, 
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const RegistrationSuccess: React.FC = () => {
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
      </div>

      <div className={`max-w-2xl w-full relative z-10 transition-all duration-1000 transform ${pageLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/50 overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
          
          <div className="p-8 sm:p-12 text-center">
            {/* Animated Icon */}
            <div className="relative mb-8 flex justify-center">
              <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-3xl shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <EnvelopeOpenIcon className="h-16 w-16 text-white" />
              </div>
            </div>

            <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Registration Successful!
            </h1>
            <p className="text-xl text-gray-600 mb-8 font-medium">
              We've sent a verification link to your email address.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 text-left">
              <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 hover:shadow-md transition-shadow duration-300">
                <CheckCircleIcon className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-1">Check Inbox</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Look for an email from <strong>Livora Healthcare</strong> with the verification link.
                </p>
              </div>
              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 hover:shadow-md transition-shadow duration-300">
                <ShieldCheckIcon className="h-8 w-8 text-indigo-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-1">Verify Account</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Click the <strong>"Verify Email Address"</strong> button to activate your account.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Link
                to="/login"
                className="group flex items-center justify-center gap-2 w-full py-4 px-6 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl"
              >
                <span>Go to Login Page</span>
                <ArrowRightIcon className="h-5 w-5 transition-transform" />
              </Link>
              
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 pt-4">
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                <span>Didn't receive the email? Check your spam folder.</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50/50 border-t border-gray-100 p-6 text-center">
            <p className="text-sm font-medium text-gray-500">
              Need help? <Link to="/" className="text-blue-600 hover:underline">Contact Support</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccess;
