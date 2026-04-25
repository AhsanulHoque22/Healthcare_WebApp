import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import {
  EyeIcon, EyeSlashIcon, ArrowRightIcon, CheckCircleIcon,
  ShieldCheckIcon, UserGroupIcon, UserIcon, AcademicCapIcon,
  BriefcaseIcon, StarIcon, SparklesIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { MEDICAL_DEPARTMENTS } from '../utils/departments';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  role: 'patient' | 'doctor' | 'admin';
  bmdcRegistrationNumber?: string;
  department?: string;
  experience?: number;
}

const RIGHT_PANEL_ITEMS = [
  { icon: UserIcon,        title: 'For Patients',     desc: 'Access quality healthcare, manage appointments, and track your health records seamlessly',             color: 'text-indigo-400',  bg: 'bg-indigo-400/10'  },
  { icon: BriefcaseIcon,   title: 'For Doctors',      desc: 'Grow your practice, manage patients efficiently, and provide exceptional quality care',                color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { icon: ShieldCheckIcon, title: 'Secure Platform',  desc: 'Your data is protected with enterprise-grade security and HIPAA compliance',                          color: 'text-violet-400',  bg: 'bg-violet-400/10'  },
  { icon: CheckCircleIcon, title: 'Easy to Use',      desc: 'Intuitive interface designed for seamless healthcare management experience',                           color: 'text-amber-400',   bg: 'bg-amber-400/10'   },
];

const ROLES = [
  { key: 'patient', label: 'Patient',  sub: 'Seek medical care',   icon: UserIcon        },
  { key: 'doctor',  label: 'Doctor',   sub: 'Provide medical care', icon: BriefcaseIcon  },
  { key: 'admin',   label: 'Admin',    sub: 'Manage the system',    icon: AcademicCapIcon },
] as const;

const fieldCls = (err: boolean) =>
  `w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-white outline-none transition-all duration-200 focus:ring-2 ${
    err ? 'border-rose-300 bg-rose-50/30 focus:border-rose-400 focus:ring-rose-500/10'
        : 'border-slate-200 hover:border-slate-300 focus:border-indigo-400 focus:ring-indigo-500/10'
  }`;

const selectCls = (err: boolean) =>
  `w-full px-4 py-3 rounded-xl border text-sm font-medium text-slate-700 bg-white outline-none transition-all duration-200 focus:ring-2 appearance-none ${
    err ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-500/10'
        : 'border-slate-200 hover:border-slate-300 focus:border-indigo-400 focus:ring-indigo-500/10'
  }`;

const Label: React.FC<{ children: React.ReactNode; optional?: boolean }> = ({ children, optional }) => (
  <div className="flex items-center justify-between mb-1.5">
    <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{children}</label>
    {optional && <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Optional</span>}
  </div>
);

const FieldError: React.FC<{ msg?: string }> = ({ msg }) =>
  msg ? (
    <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1.5">
      <span className="w-1 h-1 rounded-full bg-rose-500 flex-shrink-0" />
      {msg}
    </p>
  ) : null;

const Register: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | 'admin'>('patient');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterFormData>({
    defaultValues: {
      role: 'patient', email: '', password: '', confirmPassword: '',
      firstName: '', lastName: '', phone: '', dateOfBirth: '',
      gender: undefined, address: '', bmdcRegistrationNumber: '', department: '', experience: 0,
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...userData } = data;
      userData.role = selectedRole;
      if (!userData.phone?.trim())                    delete userData.phone;
      if (!userData.dateOfBirth?.trim())              delete userData.dateOfBirth;
      if (!userData.gender)                           delete userData.gender;
      if (!userData.address?.trim())                  delete userData.address;
      if (!userData.bmdcRegistrationNumber?.trim())   delete userData.bmdcRegistrationNumber;
      if (!userData.department?.trim())               delete userData.department;
      if (!userData.experience)                       delete userData.experience;
      await registerUser(userData);
      navigate('/registration-success');
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
        <div className="flex items-center gap-5">
          <Link to="/login" className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">
            Already have an account? <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <Link to="/" className="hidden sm:flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors">
            Back to Home <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* ─── Two-column layout ─── */}
      <div className="flex h-screen overflow-hidden pt-14">

        {/* LEFT — Scrollable Form */}
        <div className="flex-1 overflow-y-auto landing-scroll py-10 px-5 sm:px-8 lg:px-14 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 28, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[460px] mx-auto w-full"
          >
            {/* Card */}
            <div className="bg-white rounded-[28px] border border-slate-100 shadow-xl shadow-indigo-500/[0.04] p-7 md:p-9 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/[0.03] rounded-full blur-3xl pointer-events-none" />

              {/* Brand mark */}
              <div className="flex items-center gap-3 mb-7">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10 flex-shrink-0">
                  <SparklesIcon className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none mb-0.5">Livora Health</p>
                  <p className="text-sm font-bold text-slate-900">Create Your Account</p>
                </div>
              </div>

              <div className="mb-7">
                <h1 className="text-2xl md:text-[1.875rem] font-black text-slate-900 tracking-tight leading-tight mb-2 heading-display">
                  Join Livora
                </h1>
                <p className="text-sm font-medium text-slate-500">Create your account and start your healthcare journey</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                {/* ── Role Selector ── */}
                <div>
                  <Label>Choose Your Account Type</Label>
                  <div className="grid grid-cols-3 gap-2.5 mt-1">
                    {ROLES.map(({ key, label, sub, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => { setSelectedRole(key); setValue('role', key); }}
                        className={`group flex flex-col items-center py-4 px-3 rounded-2xl border-2 transition-all duration-200 ${
                          selectedRole === key
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-500/10'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`h-6 w-6 mb-2 transition-colors ${selectedRole === key ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        <span className="text-xs font-black tracking-tight">{label}</span>
                        <span className="text-[9px] font-medium text-slate-400 mt-0.5 text-center leading-tight">{sub}</span>
                      </button>
                    ))}
                  </div>
                  <input type="hidden" {...register('role')} />
                </div>

                {/* ── Name ── */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>First Name</Label>
                    <input {...register('firstName', { required: 'First name is required' })} type="text" placeholder="John" className={fieldCls(!!errors.firstName)} />
                    <FieldError msg={errors.firstName?.message} />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <input {...register('lastName', { required: 'Last name is required' })} type="text" placeholder="Doe" className={fieldCls(!!errors.lastName)} />
                    <FieldError msg={errors.lastName?.message} />
                  </div>
                </div>

                {/* ── Email ── */}
                <div>
                  <Label>Email Address</Label>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' },
                    })}
                    type="email"
                    placeholder="john.doe@example.com"
                    className={fieldCls(!!errors.email)}
                  />
                  <FieldError msg={errors.email?.message} />
                </div>

                {/* ── Passwords ── */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Password</Label>
                    <div className="relative">
                      <input
                        {...register('password', {
                          required: 'Password is required',
                          minLength: { value: 6, message: 'Min 6 characters' },
                        })}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className={`${fieldCls(!!errors.password)} pr-10`}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                        {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                    <FieldError msg={errors.password?.message} />
                  </div>
                  <div>
                    <Label>Confirm Password</Label>
                    <div className="relative">
                      <input
                        {...register('confirmPassword', {
                          required: 'Please confirm your password',
                          validate: (v) => v === passwordValue || 'Passwords do not match',
                        })}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className={`${fieldCls(!!errors.confirmPassword)} pr-10`}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                        {showConfirmPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                      </button>
                    </div>
                    <FieldError msg={errors.confirmPassword?.message} />
                  </div>
                </div>

                {/* ── Optional fields ── */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label optional>Phone Number</Label>
                    <input {...register('phone')} type="tel" placeholder="+880 1234 567890" className={fieldCls(false)} />
                  </div>
                  <div>
                    <Label optional>Date of Birth</Label>
                    <input {...register('dateOfBirth')} type="date" className={fieldCls(false)} />
                  </div>
                </div>

                <div>
                  <Label optional>Gender</Label>
                  <select {...register('gender')} className={selectCls(false)}>
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <Label optional>Address</Label>
                  <textarea
                    {...register('address')}
                    rows={2}
                    placeholder="Enter your address"
                    className={`${fieldCls(false)} resize-none`}
                  />
                </div>

                {/* ── Doctor-specific fields ── */}
                <AnimatePresence>
                  {selectedRole === 'doctor' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                        <div className="flex items-center gap-2.5 mb-1">
                          <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <BriefcaseIcon className="h-4 w-4 text-indigo-600" />
                          </div>
                          <h3 className="text-sm font-black text-indigo-900">Professional Information</h3>
                        </div>

                        <div>
                          <Label>BMDC Registration Number</Label>
                          <input
                            {...register('bmdcRegistrationNumber', { required: 'BMDC Registration Number is required' })}
                            type="text"
                            placeholder="Enter your BMDC Registration Number"
                            className={fieldCls(!!errors.bmdcRegistrationNumber)}
                          />
                          <FieldError msg={errors.bmdcRegistrationNumber?.message} />
                        </div>

                        <div>
                          <Label>Medical Department</Label>
                          <select
                            {...register('department', { required: 'Please select a medical department' })}
                            className={selectCls(!!errors.department)}
                          >
                            <option value="">Select Medical Department</option>
                            {MEDICAL_DEPARTMENTS.map((d) => (
                              <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                          </select>
                          <FieldError msg={errors.department?.message} />
                        </div>

                        <div>
                          <Label>Years of Experience</Label>
                          <input
                            {...register('experience', {
                              required: 'Years of experience is required',
                              min: { value: 0, message: 'Experience cannot be negative' },
                            })}
                            type="number"
                            min="0"
                            placeholder="Enter years of experience"
                            className={fieldCls(!!errors.experience)}
                          />
                          <FieldError msg={errors.experience?.message} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Submit ── */}
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
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRightIcon className="h-4 w-4" />
                    </>
                  )}
                </motion.button>

                {/* Footer link */}
                <div className="pt-4 border-t border-slate-100 text-center">
                  <p className="text-sm font-medium text-slate-500">
                    Already have an account?{' '}
                    <Link to="/login" className="font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </form>
            </div>

            {/* Bottom spacer for comfortable scrolling */}
            <div className="h-8" />
          </motion.div>
        </div>

        {/* RIGHT — Dark Branding Panel (sticky) */}
        <div className="hidden lg:flex lg:w-[46%] bg-slate-900 relative overflow-hidden items-center justify-center flex-shrink-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-transparent to-violet-500/8 pointer-events-none" />
          <div className="absolute top-[-15%] right-[-10%] w-[380px] h-[380px] bg-indigo-500/20 rounded-full blur-[90px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[320px] h-[320px] bg-violet-500/15 rounded-full blur-[80px]" />
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(#fff 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

          <motion.div
            initial={{ opacity: 0, x: 30, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 max-w-md px-9 py-12 text-white"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/15 text-[9px] font-black uppercase tracking-[0.2em] mb-7">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Join Our Community
            </div>

            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.05] mb-5 heading-display">
              Join Our<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 animate-gradient-shift italic">
                Healthcare Community.
              </span>
            </h2>

            <p className="text-slate-400 font-medium mb-8 leading-relaxed text-sm">
              Become part of a trusted network of patients and healthcare professionals. Experience seamless, secure, and comprehensive healthcare management.
            </p>

            <div className="space-y-3">
              {RIGHT_PANEL_ITEMS.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.09, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-3.5 p-4 bg-white/[0.05] border border-white/[0.08] rounded-2xl hover:bg-white/[0.08] transition-colors duration-300"
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

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="mt-5 p-4 bg-white/[0.05] border border-white/[0.08] rounded-2xl flex items-center gap-4"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                <StarIcon className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-black text-white mb-0.5">Trusted by Thousands</p>
                <p className="text-xs font-medium text-slate-400">
                  Join over <span className="text-white font-bold">10,000+ users</span> and <span className="text-white font-bold">500+ healthcare providers</span>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;
