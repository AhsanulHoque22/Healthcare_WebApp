import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import API from '../api/api';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon, SparklesIcon, CheckCircleIcon, ArrowRightIcon,
  ShieldCheckIcon, EnvelopeIcon, KeyIcon, LockClosedIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface ForgotPasswordFormData {
  email: string;
}

const fieldCls = (err: boolean) =>
  `w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-white outline-none transition-all duration-200 focus:ring-2 ${
    err ? 'border-rose-300 bg-rose-50/30 focus:border-rose-400 focus:ring-rose-500/10'
        : 'border-slate-200 hover:border-slate-300 focus:border-indigo-400 focus:ring-indigo-500/10'
  }`;

const STEPS = [
  { icon: EnvelopeIcon, label: 'Enter your email address',       color: 'text-indigo-400', bg: 'bg-indigo-400/10'  },
  { icon: KeyIcon,      label: 'Receive a secure reset link',    color: 'text-violet-400', bg: 'bg-violet-400/10'  },
  { icon: LockClosedIcon, label: 'Create a new strong password', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
];

const ForgotPassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { register, handleSubmit, formState: { errors }, getValues } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      await API.post('/auth/forgot-password', { email: data.email });
      setEmailSent(true);
      toast.success('Password reset instructions sent to your email');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send reset email';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const SharedBackground = () => (
    <>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-500/[0.04] rounded-full blur-[130px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-violet-500/[0.04] rounded-full blur-[110px]" />
      </div>
      <header className={`fixed top-0 inset-x-0 z-50 h-14 flex items-center px-5 sm:px-8 border-b transition-all duration-300 ${
        scrolled ? 'bg-[#fafbff]/95 backdrop-blur-xl border-slate-100 shadow-sm' : 'bg-[#fafbff]/70 backdrop-blur-lg border-transparent'
      }`}>
        <Link to="/" className="flex items-center gap-2.5 group mr-auto">
          <img src="/logo.png" className="h-8 w-8 object-contain" alt="Livora" />
          <span className="text-base font-black text-slate-900 group-hover:text-indigo-700 transition-colors tracking-tight">Livora</span>
        </Link>
        <Link to="/" className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">
          Back to Home <ArrowRightIcon className="h-3.5 w-3.5" />
        </Link>
      </header>
    </>
  );

  const RightPanel = () => (
    <div className="hidden lg:flex lg:w-[52%] bg-slate-900 relative overflow-hidden items-center justify-center flex-shrink-0">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-transparent to-violet-500/8 pointer-events-none" />
      <div className="absolute top-[-15%] right-[-10%] w-[380px] h-[380px] bg-indigo-500/20 rounded-full blur-[90px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[320px] h-[320px] bg-violet-500/15 rounded-full blur-[80px]" />
      <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(#fff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

      <motion.div
        initial={{ opacity: 0, x: 30, filter: 'blur(10px)' }}
        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-md px-10 py-12 text-white"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/15 text-[9px] font-black uppercase tracking-[0.2em] mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Account Recovery
        </div>

        <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05] mb-5 heading-display">
          Regain<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 animate-gradient-shift italic">
            Secure Access.
          </span>
        </h2>

        <p className="text-slate-400 font-medium mb-10 leading-relaxed">
          Resetting your password is quick and easy. Follow the simple steps to get back into your account securely.
        </p>

        {/* Steps */}
        <div className="space-y-4 mb-10">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-3">How it works</p>
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-4 p-4 bg-white/[0.05] border border-white/[0.08] rounded-2xl"
            >
              <div className={`w-9 h-9 rounded-xl ${step.bg} flex items-center justify-center flex-shrink-0`}>
                <step.icon className={`h-5 w-5 ${step.color}`} />
              </div>
              <div className="flex items-center gap-3 flex-1">
                <span className="text-[9px] font-black text-slate-600 bg-white/10 rounded-lg px-2 py-1 flex-shrink-0">0{i + 1}</span>
                <p className="text-sm font-medium text-slate-300">{step.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Security note */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="p-5 bg-white/[0.05] border border-white/[0.08] rounded-2xl flex items-start gap-4"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-400/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldCheckIcon className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-black text-white mb-1">Secure Reset Process</p>
            <p className="text-xs font-medium text-slate-400 leading-relaxed">
              The reset link expires in 1 hour and can only be used once. Your account security is our top priority.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );

  /* ── Success State ── */
  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#fafbff] font-sans noise-overlay">
        <SharedBackground />
        <div className="flex h-screen overflow-hidden pt-14">
          <div className="flex-1 flex items-center justify-center py-10 px-5 sm:px-8 lg:px-14 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[420px]"
            >
              <div className="bg-white rounded-[28px] border border-slate-100 shadow-xl shadow-indigo-500/[0.04] p-8 md:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/[0.03] rounded-full blur-3xl pointer-events-none" />

                {/* Success icon */}
                <div className="flex flex-col items-center text-center">
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/25"
                  >
                    <CheckCircleIcon className="h-8 w-8 text-white" />
                  </motion.div>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-100 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700 mb-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Email Sent
                  </div>

                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-3 heading-display">
                    Check your email
                  </h2>
                  <p className="text-sm font-medium text-slate-500 mb-2 leading-relaxed">
                    We've sent password reset instructions to
                  </p>
                  <p className="text-sm font-bold text-indigo-600 mb-6 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                    {getValues('email')}
                  </p>
                  <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                    Didn't receive the email? Check your spam folder or{' '}
                    <button
                      onClick={() => setEmailSent(false)}
                      className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      try again
                    </button>
                  </p>
                </div>

                <Link
                  to="/login"
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl border-2 border-slate-200 text-sm font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all duration-200"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to sign in
                </Link>
              </div>
            </motion.div>
          </div>
          <RightPanel />
        </div>
      </div>
    );
  }

  /* ── Default: Forgot Password Form ── */
  return (
    <div className="min-h-screen bg-[#fafbff] font-sans noise-overlay">
      <SharedBackground />

      <div className="flex h-screen overflow-hidden pt-14">

        {/* LEFT — Form */}
        <div className="flex-1 overflow-y-auto landing-scroll flex items-center justify-center py-10 px-5 sm:px-8 lg:px-14 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 28, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[420px]"
          >
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-xl shadow-indigo-500/[0.04] p-8 md:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/[0.03] rounded-full blur-3xl pointer-events-none" />

              {/* Brand mark */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10 flex-shrink-0">
                  <SparklesIcon className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none mb-0.5">Livora Health</p>
                  <p className="text-sm font-bold text-slate-900">Account Recovery</p>
                </div>
              </div>

              <div className="mb-7">
                <h1 className="text-2xl md:text-[1.875rem] font-black text-slate-900 tracking-tight leading-tight mb-2 heading-display">
                  Forgot your password?
                </h1>
                <p className="text-sm font-medium text-slate-500 leading-relaxed">
                  Enter your email address and we'll send you instructions to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                {/* Email */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-1.5">
                    Email Address
                  </label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' },
                    })}
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    className={fieldCls(!!errors.email)}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-rose-500 flex-shrink-0" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Server error */}
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-3 p-4 bg-rose-50 rounded-2xl border border-rose-100"
                  >
                    <div className="w-6 h-6 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="h-4 w-4 text-rose-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-black text-rose-700 uppercase tracking-wider mb-0.5">Error</p>
                      <p className="text-sm text-rose-600">{errorMessage}</p>
                    </div>
                  </motion.div>
                )}

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={!isLoading ? { scale: 1.02 } : {}}
                  whileTap={!isLoading ? { scale: 0.97 } : {}}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className={`w-full py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-lg transition-colors duration-200 ${
                    isLoading
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-slate-900 text-white hover:bg-indigo-700 shadow-indigo-500/10 hover:shadow-indigo-500/20'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send reset instructions
                      <ArrowRightIcon className="h-4 w-4" />
                    </>
                  )}
                </motion.button>

                {/* Back link */}
                <div className="pt-1">
                  <Link
                    to="/login"
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors group"
                  >
                    <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
                    Back to sign in
                  </Link>
                </div>
              </form>
            </div>
          </motion.div>
        </div>

        {/* RIGHT — Dark Panel */}
        <RightPanel />
      </div>
    </div>
  );
};

export default ForgotPassword;
