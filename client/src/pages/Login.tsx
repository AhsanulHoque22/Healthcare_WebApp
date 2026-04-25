import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import {
  EyeIcon, EyeSlashIcon, ArrowRightIcon, CheckCircleIcon,
  ShieldCheckIcon, ClockIcon, UserGroupIcon, StarIcon, SparklesIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

interface LoginFormData {
  emailOrPhone: string;
  password: string;
}

const FEATURES = [
  { icon: ShieldCheckIcon, title: 'Secure & Private',  desc: 'HIPAA compliant with enterprise-grade security and end-to-end encryption',         color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { icon: ClockIcon,       title: '24/7 Access',       desc: 'Access your health records, appointments, and prescriptions anytime, anywhere',   color: 'text-indigo-400',  bg: 'bg-indigo-400/10'  },
  { icon: UserGroupIcon,   title: 'Expert Care',       desc: 'Connect with verified healthcare professionals and specialists',                   color: 'text-violet-400',  bg: 'bg-violet-400/10'  },
  { icon: CheckCircleIcon, title: 'Comprehensive',     desc: 'Everything you need for complete health management in one platform',              color: 'text-amber-400',   bg: 'bg-amber-400/10'   },
];

const fieldCls = (err: boolean) =>
  `w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-white outline-none transition-all duration-200 focus:ring-2 ${
    err ? 'border-rose-300 bg-rose-50/30 focus:border-rose-400 focus:ring-rose-500/10'
        : 'border-slate-200 hover:border-slate-300 focus:border-indigo-400 focus:ring-indigo-500/10'
  }`;

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const from = location.state?.from?.pathname || '/app';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    defaultValues: { emailOrPhone: '', password: '' },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.emailOrPhone, data.password);
      setTimeout(() => navigate(from, { replace: true }), 100);
    } catch {
      // Error handled in auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbff] font-sans noise-overlay">
      {/* Aurora blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] bg-indigo-500/[0.04] rounded-full blur-[130px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] bg-violet-500/[0.04] rounded-full blur-[110px]" />
      </div>

      {/* ─── Header ─── */}
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

      {/* ─── Two-column layout ─── */}
      <div className="flex h-screen overflow-hidden pt-14">

        {/* LEFT — Form */}
        <div className="flex-1 overflow-y-auto landing-scroll flex items-center justify-center py-10 px-5 sm:px-8 lg:px-14 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 28, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-[420px]"
          >
            {/* Card */}
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-xl shadow-indigo-500/[0.04] p-8 md:p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/[0.03] rounded-full blur-3xl pointer-events-none" />

              {/* Brand mark */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10 flex-shrink-0">
                  <SparklesIcon className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none mb-0.5">Livora Health</p>
                  <p className="text-sm font-bold text-slate-900">Healthcare Platform</p>
                </div>
              </div>

              <div className="mb-7">
                <h1 className="text-2xl md:text-[1.875rem] font-black text-slate-900 tracking-tight leading-tight mb-2 heading-display">
                  Welcome back
                </h1>
                <p className="text-sm font-medium text-slate-500">Sign in to access your healthcare dashboard</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                {/* Email / Phone */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-1.5">
                    Email Address or Phone Number
                  </label>
                  <input
                    {...register('emailOrPhone', {
                      required: 'Email or phone number is required',
                      validate: (v) => {
                        const emailRx = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
                        const phoneRx = /^[\+]?[0-9\s\-\(\)]{10,}$/;
                        return emailRx.test(v) || phoneRx.test(v) || 'Please enter a valid email address or phone number';
                      },
                    })}
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your email or phone number"
                    className={fieldCls(!!errors.emailOrPhone)}
                  />
                  {errors.emailOrPhone && (
                    <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-rose-500 flex-shrink-0" />
                      {errors.emailOrPhone.message}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Password</label>
                    <Link to="/forgot-password" className="text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-700 transition-colors">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      {...register('password', {
                        required: 'Password is required',
                        minLength: { value: 6, message: 'Password must be at least 6 characters' },
                      })}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className={`${fieldCls(!!errors.password)} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-rose-500 flex-shrink-0" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Remember me */}
                <div className="flex items-center gap-2.5">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="text-sm font-medium text-slate-600 cursor-pointer select-none">
                    Remember me
                  </label>
                </div>

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
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRightIcon className="h-4 w-4" />
                    </>
                  )}
                </motion.button>

                {/* Footer link */}
                <div className="pt-4 border-t border-slate-100 text-center">
                  <p className="text-sm font-medium text-slate-500">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                      Create one here
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </motion.div>
        </div>

        {/* RIGHT — Dark Branding Panel */}
        <div className="hidden lg:flex lg:w-[52%] bg-slate-900 relative overflow-hidden items-center justify-center flex-shrink-0">
          {/* Decorations */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-transparent to-violet-500/8 pointer-events-none" />
          <div className="absolute top-[-15%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[90px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-violet-500/15 rounded-full blur-[80px]" />
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(#fff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

          <motion.div
            initial={{ opacity: 0, x: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 max-w-md px-10 py-12 text-white"
          >
            {/* Status pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/15 text-[9px] font-black uppercase tracking-[0.2em] mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Livora Health Platform
            </div>

            {/* Headline */}
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05] mb-5 heading-display">
              Your Health,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 animate-gradient-shift italic">
                Simplified.
              </span>
            </h2>

            <p className="text-slate-400 font-medium mb-9 leading-relaxed text-base">
              Access your complete healthcare ecosystem with just one login. Experience seamless, secure, and comprehensive health management.
            </p>

            {/* Feature list */}
            <div className="space-y-3">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.09, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-4 p-4 bg-white/[0.05] border border-white/[0.08] rounded-2xl hover:bg-white/[0.08] transition-colors duration-300"
                >
                  <div className={`w-9 h-9 rounded-xl ${f.bg} flex items-center justify-center flex-shrink-0`}>
                    <f.icon className={`h-5 w-5 ${f.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-0.5">{f.title}</p>
                    <p className="text-xs font-medium text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Trust badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 p-5 bg-white/[0.05] border border-white/[0.08] rounded-2xl flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                <StarIcon className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-black text-white mb-0.5">Trusted by Thousands</p>
                <p className="text-xs font-medium text-slate-400">
                  Join over{' '}
                  <span className="text-white font-bold">10,000+ patients</span> and{' '}
                  <span className="text-white font-bold">500+ healthcare providers</span> who trust our platform
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Login;
