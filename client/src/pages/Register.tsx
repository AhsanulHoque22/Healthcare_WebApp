import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  EyeIcon, 
  EyeSlashIcon, 
  HeartIcon, 
  ArrowRightIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserGroupIcon,
  UserIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  StarIcon
} from '@heroicons/react/24/outline';
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
  // Doctor-specific fields
  bmdcRegistrationNumber?: string;
  department?: string;
  experience?: number;
}


const Register: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | 'admin'>('patient');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: {
      role: 'patient',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: '',
      gender: undefined,
      address: '',
      bmdcRegistrationNumber: '',
      department: '',
      experience: 0,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...userData } = data;
      // Ensure the role is properly set from the selectedRole state
      userData.role = selectedRole;
      
      // Clean up empty optional fields
      if (!userData.phone || userData.phone.trim() === '') {
        delete userData.phone;
      }
      if (!userData.dateOfBirth || userData.dateOfBirth.trim() === '') {
        delete userData.dateOfBirth;
      }
      if (!userData.gender) {
        delete userData.gender;
      }
      if (!userData.address || userData.address.trim() === '') {
        delete userData.address;
      }
      if (!userData.bmdcRegistrationNumber || userData.bmdcRegistrationNumber.trim() === '') {
        delete userData.bmdcRegistrationNumber;
      }
      if (!userData.department || userData.department.trim() === '') {
        delete userData.department;
      }
      if (!userData.experience || userData.experience === 0) {
        delete userData.experience;
      }
      
      console.log('Registering user with data:', userData);
      await registerUser(userData);
      
      // Show success message and redirect to login
      toast.success('Account created successfully! Please login to continue.');
      navigate('/login');
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-400/10 to-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center group">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <HeartIcon className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">HealthCare Pro</span>
            </Link>
            <Link 
              to="/" 
              className="text-gray-600 hover:text-indigo-600 transition-colors font-medium flex items-center gap-2 group"
            >
              <span>Back to Home</span>
              <ArrowRightIcon className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-4rem)] relative z-10">
        {/* Left Side - Registration Form */}
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-y-auto">
          <div className="max-w-md w-full">
            {/* Registration Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 relative overflow-hidden">
              {/* Card Background Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-blue-50/50"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full blur-2xl"></div>
              
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <HeartIcon className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Join HealthCare Pro
                  </h2>
                  <p className="text-gray-600">
                    Create your account and start your healthcare journey
                  </p>
                </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Choose Your Account Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole('patient');
                        setValue('role', 'patient');
                      }}
                      className={`group p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                        selectedRole === 'patient'
                          ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-700 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white/70 backdrop-blur-sm hover:shadow-md'
                      }`}
                    >
                      <UserIcon className={`h-7 w-7 mx-auto mb-2 transition-colors duration-300 ${
                        selectedRole === 'patient' ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-700'
                      }`} />
                      <span className="text-sm font-semibold block">Patient</span>
                      <span className="text-xs text-gray-500 mt-1 block">Seek medical care</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole('doctor');
                        setValue('role', 'doctor');
                      }}
                      className={`group p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                        selectedRole === 'doctor'
                          ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-700 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white/70 backdrop-blur-sm hover:shadow-md'
                      }`}
                    >
                      <BriefcaseIcon className={`h-7 w-7 mx-auto mb-2 transition-colors duration-300 ${
                        selectedRole === 'doctor' ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-700'
                      }`} />
                      <span className="text-sm font-semibold block">Doctor</span>
                      <span className="text-xs text-gray-500 mt-1 block">Provide medical care</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole('admin');
                        setValue('role', 'admin');
                      }}
                      className={`group p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                        selectedRole === 'admin'
                          ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-700 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white/70 backdrop-blur-sm hover:shadow-md'
                      }`}
                    >
                      <AcademicCapIcon className={`h-7 w-7 mx-auto mb-2 transition-colors duration-300 ${
                        selectedRole === 'admin' ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-700'
                      }`} />
                      <span className="text-sm font-semibold block">Admin</span>
                      <span className="text-xs text-gray-500 mt-1 block">Manage the system</span>
                    </button>
                  </div>
                  
                  {/* Hidden input for role to ensure it's included in form data */}
                  <input type="hidden" {...register('role')} />
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-3">
                      First Name
                    </label>
                    <input
                      {...register('firstName', { required: 'First name is required' })}
                      type="text"
                      className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-white/70 backdrop-blur-sm ${
                        errors.firstName ? 'border-red-400 bg-red-50/70' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="John"
                    />
                    {errors.firstName && (
                      <p className="mt-3 text-sm text-red-600 flex items-center bg-red-50/70 rounded-lg px-3 py-2">
                        <span className="mr-2">⚠️</span>
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-3">
                      Last Name
                    </label>
                    <input
                      {...register('lastName', { required: 'Last name is required' })}
                      type="text"
                      className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-white/70 backdrop-blur-sm ${
                        errors.lastName ? 'border-red-400 bg-red-50/70' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      placeholder="Doe"
                    />
                    {errors.lastName && (
                      <p className="mt-3 text-sm text-red-600 flex items-center bg-red-50/70 rounded-lg px-3 py-2">
                        <span className="mr-2">⚠️</span>
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
                    Email Address
                  </label>
                  <input
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-white/70 backdrop-blur-sm ${
                      errors.email ? 'border-red-400 bg-red-50/70' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    placeholder="john.doe@example.com"
                  />
                  {errors.email && (
                    <p className="mt-3 text-sm text-red-600 flex items-center bg-red-50/70 rounded-lg px-3 py-2">
                      <span className="mr-2">⚠️</span>
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        {...register('password', { 
                          required: 'Password is required',
                          minLength: {
                            value: 6,
                            message: 'Password must be at least 6 characters'
                          }
                        })}
                        type={showPassword ? 'text' : 'password'}
                        className={`w-full px-4 py-4 pr-12 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-white/70 backdrop-blur-sm ${
                          errors.password ? 'border-red-400 bg-red-50/70' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100/50 rounded-r-xl transition-colors duration-200"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
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
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        {...register('confirmPassword', { 
                          required: 'Please confirm your password',
                          validate: (value, formValues) => value === formValues.password || 'Passwords do not match'
                        })}
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={`w-full px-4 py-4 pr-12 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-white/70 backdrop-blur-sm ${
                          errors.confirmPassword ? 'border-red-400 bg-red-50/70' : 'border-gray-200 hover:border-gray-300'
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-100/50 rounded-r-xl transition-colors duration-200"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-500 hover:text-gray-700" />
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

                {/* Optional Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      {...register('phone')}
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                      placeholder="+880 1234 567890"
                    />
                  </div>
                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      {...register('dateOfBirth')}
                      type="date"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    {...register('gender')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    {...register('address')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                    placeholder="Enter your address"
                  />
                </div>

                {/* Doctor-specific fields */}
                {selectedRole === 'doctor' && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 flex items-center">
                      <BriefcaseIcon className="h-5 w-5 mr-2" />
                      Professional Information
                    </h3>
                    
                    <div>
                      <label htmlFor="bmdcRegistrationNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        BMDC Registration Number
                      </label>
                      <input
                        {...register('bmdcRegistrationNumber', { required: 'BMDC Registration Number is required' })}
                        type="text"
                        placeholder="Enter your BMDC Registration Number"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.bmdcRegistrationNumber ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {errors.bmdcRegistrationNumber && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <span className="mr-1">⚠️</span>
                          {errors.bmdcRegistrationNumber.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                        Medical Department
                      </label>
                      <select
                        {...register('department', { required: 'Please select a medical department' })}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.department ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <option value="">Select Medical Department</option>
                        {MEDICAL_DEPARTMENTS.map((dept) => (
                          <option key={dept.value} value={dept.value}>
                            {dept.label}
                          </option>
                        ))}
                      </select>
                      {errors.department && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <span className="mr-1">⚠️</span>
                          {errors.department.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                        Years of Experience
                      </label>
                      <input
                        {...register('experience', { 
                          required: 'Years of experience is required',
                          min: { value: 0, message: 'Experience cannot be negative' }
                        })}
                        type="number"
                        min="0"
                        placeholder="Enter years of experience"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.experience ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'
                        }`}
                      />
                      {errors.experience && (
                        <p className="mt-2 text-sm text-red-600 flex items-center">
                          <span className="mr-1">⚠️</span>
                          {errors.experience.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 hover:from-indigo-700 hover:via-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] transform"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      <span className="text-lg">Creating Account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="text-lg">Create Account</span>
                      <ArrowRightIcon className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-200" />
                    </div>
                  )}
                </button>
              </div>

              <div className="text-center pt-4 border-t border-gray-200/50">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors duration-200 hover:underline"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Benefits */}
        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-blue-600 to-indigo-700"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-800/20 via-transparent to-indigo-800/20"></div>
          
          {/* Decorative Elements */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-20 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          
          <div className="relative z-10 max-w-md text-white p-8">
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <HeartIcon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-3xl font-bold">
                  Join Our Healthcare Community
                </h3>
              </div>
              <p className="text-blue-100 text-lg leading-relaxed">
                Become part of a trusted network of patients and healthcare professionals. Experience seamless, secure, and comprehensive healthcare management.
              </p>
            </div>

            <div className="space-y-6">
              <div className="group flex items-start bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="bg-white/20 rounded-xl p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
                  <UserIcon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-lg">For Patients</h4>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    Access quality healthcare, manage appointments, and track your health records seamlessly
                  </p>
                </div>
              </div>

              <div className="group flex items-start bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="bg-white/20 rounded-xl p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
                  <BriefcaseIcon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-lg">For Doctors</h4>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    Grow your practice, manage patients efficiently, and provide exceptional quality care
                  </p>
                </div>
              </div>

              <div className="group flex items-start bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="bg-white/20 rounded-xl p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
                  <ShieldCheckIcon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-lg">Secure Platform</h4>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    Your data is protected with enterprise-grade security and HIPAA compliance
                  </p>
                </div>
              </div>

              <div className="group flex items-start bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all duration-300">
                <div className="bg-white/20 rounded-xl p-3 mr-4 group-hover:scale-110 transition-transform duration-300">
                  <CheckCircleIcon className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-lg">Easy to Use</h4>
                  <p className="text-blue-100 text-sm leading-relaxed">
                    Intuitive interface designed for seamless healthcare management experience
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-10 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <StarIcon className="h-5 w-5 text-yellow-300" />
                </div>
                <p className="font-bold text-lg">
                  Trusted by Thousands
                </p>
              </div>
              <p className="text-blue-100 text-sm">
                Join over <strong>10,000+ users</strong> and <strong>500+ healthcare providers</strong> who trust our platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
