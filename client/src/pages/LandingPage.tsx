import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from '../components/NotificationDropdown';
import toast from 'react-hot-toast';
import { 
  HeartIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  BeakerIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  StarIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ArrowRightIcon,
  PlayIcon,
  SparklesIcon,
  RocketLaunchIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  EyeIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const LandingPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [currentDoctorSlide, setCurrentDoctorSlide] = useState(0);

  // Fetch verified doctors for slideshow
  const { data: availableDoctors } = useQuery({
    queryKey: ['available-doctors-public'],
    queryFn: async () => {
      const response = await API.get('/doctors', { params: { limit: 10 } });
      return response.data.data.doctors;
    }
  });
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    satisfaction: 0
  });
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, review: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch website reviews
  const { data: websiteReviews, isLoading: reviewsLoading, refetch: refetchReviews } = useQuery({
    queryKey: ['website-reviews'],
    queryFn: async () => {
      const response = await API.get('/website-reviews/public');
      return response.data.data.reviews;
    }
  });

  const demoReviews = [
    {
      user: { firstName: "Sarah", lastName: "Johnson", role: "patient" },
      review: "Livora has revolutionized how I manage my health. The appointment booking is seamless and I love having all my records in one place.",
      rating: 5,
      createdAt: new Date().toISOString()
    },
    {
      user: { firstName: "Dr. Michael", lastName: "Chen", role: "doctor" },
      review: "As a doctor, this platform has made patient management so much easier. The digital records and appointment system are exceptional.",
      rating: 5,
      createdAt: new Date().toISOString()
    },
    {
      user: { firstName: "Emily", lastName: "Rodriguez", role: "patient" },
      review: "The lab test results feature is amazing. I get my results instantly and can track my health progress over time.",
      rating: 5,
      createdAt: new Date().toISOString()
    }
  ];

  // Use real reviews if available, otherwise combine with demo
  const testimonials = reviewsLoading ? demoReviews : (websiteReviews && websiteReviews.length > 0 
    ? [...websiteReviews, ...demoReviews].slice(0, 10).map((r: any) => ({
        name: `${r.user?.firstName} ${r.user?.lastName}`,
        role: r.user?.role === 'doctor' ? 'Healthcare Professional' : 'Verified Patient',
        content: r.review,
        rating: r.rating,
        avatar: (r.user?.firstName?.[0] + r.user?.lastName?.[0]),
        color: r.rating >= 4 ? "from-blue-500 to-indigo-600" : "from-gray-500 to-slate-600",
        image: r.user?.profileImage
      }))
    : demoReviews.map(r => ({
        name: `${r.user.firstName} ${r.user.lastName}`,
        role: r.user.role === 'doctor' ? 'Healthcare Professional' : 'Verified Patient',
        content: r.review,
        rating: r.rating,
        avatar: (r.user.firstName[0] + r.user.lastName[0]),
        color: "from-blue-500 to-indigo-600"
      })));

  const stats = [
    { label: "Active Patients", value: 10000, icon: UserGroupIcon, color: "text-blue-600" },
    { label: "Verified Doctors", value: 500, icon: AcademicCapIcon, color: "text-green-600" },
    { label: "Appointments Booked", value: 50000, icon: CalendarIcon, color: "text-purple-600" },
    { label: "Satisfaction Rate", value: 98, icon: StarIcon, color: "text-yellow-600" }
  ];

  useEffect(() => {
    setIsVisible(true);
    
    // Animate stats counter
    const animateStats = () => {
      const duration = 2000;
      const steps = 60;
      const stepDuration = duration / steps;
      
      stats.forEach((stat, index) => {
        let current = 0;
        const increment = stat.value / steps;
        const timer = setInterval(() => {
          current += increment;
          if (current >= stat.value) {
            current = stat.value;
            clearInterval(timer);
          }
          setAnimatedStats(prev => ({
            ...prev,
            [Object.keys(prev)[index]]: Math.floor(current)
          }));
        }, stepDuration);
      });
    };

    const timer = setTimeout(animateStats, 500);
    return () => clearTimeout(timer);
  }, []);

  const nextTestimonial = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      setIsAnimating(false);
    }, 300);
  };

  const prevTestimonial = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
      setIsAnimating(false);
    }, 300);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      nextTestimonial();
    }, 6000);
    return () => clearInterval(interval);
  }, [isAnimating]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to write a review');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await API.post('/website-reviews', newReview);
      toast.success('Thank you for your review!');
      setShowReviewModal(false);
      setNewReview({ rating: 5, review: '' });
      refetchReviews();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDashboardUrl = () => {
    switch (user?.role) {
      case 'patient': return '/app/dashboard';
      case 'doctor': return '/app/doctor-dashboard';
      case 'admin': return '/app/admin-dashboard';
      default: return '/app/dashboard';
    }
  };

  useEffect(() => {
    // Add smooth scroll behavior to the document
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Cleanup function to remove the style when component unmounts
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      {/* Dynamic Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-md shadow-lg border-b border-white/30 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center group">
              <div className="relative group">
                  <img src="/logo.png" className="h-20 w-20" alt="Livora Logo" />
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-all duration-300 group-hover:scale-105">Livora</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => {
                  const element = document.getElementById('features');
                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="text-gray-600 hover:text-indigo-600 transition-all duration-300 font-medium hover:scale-105 animate-pulse"
              >
                Features
              </button>
              <Link
                to="/find-doctors"
                className="text-gray-600 hover:text-indigo-600 transition-all duration-300 font-medium hover:scale-105 animate-bounce flex items-center"
              >
                Find Doctors
                <SparklesIcon className="h-4 w-4 ml-1.5 text-indigo-500" />
              </Link>
              <button
                onClick={() => {
                  const element = document.getElementById('stats');
                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="text-gray-600 hover:text-indigo-600 transition-all duration-300 font-medium hover:scale-105 animate-bounce"
              >
                Stats
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById('testimonials');
                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="text-gray-600 hover:text-indigo-600 transition-all duration-300 font-medium hover:scale-105 animate-pulse"
              >
                Reviews
              </button>
              <button
                onClick={() => {
                  const element = document.getElementById('contact');
                  element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="text-gray-600 hover:text-indigo-600 transition-all duration-300 font-medium hover:scale-105 animate-bounce"
              >
                Contact
              </button>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-6">
                  {/* Notifications */}
                  <div className="relative group">
                    <NotificationDropdown />
                  </div>
                  
                  {/* Dashboard/Account Link */}
                  <Link
                    to={getDashboardUrl()}
                    className="flex items-center space-x-3 group/account transition-all duration-300"
                  >
                    <div className="relative">
                      {user.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.firstName}
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-100 group-hover/account:ring-indigo-500 transition-all shadow-sm"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-sm group-hover/account:scale-105 transition-all">
                          {user?.firstName?.charAt(0) || ''}{user?.lastName?.charAt(0) || ''}
                        </div>
                      )}
                    </div>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-bold text-gray-900 group-hover/account:text-indigo-600 transition-colors">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold opacity-70">
                        {user.role} Dashboard
                      </p>
                    </div>
                  </Link>
                  
                  {/* Sign Out */}
                  <button
                    onClick={() => logout()}
                    className="flex items-center px-4 py-2 text-sm font-bold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 group"
                  >
                    <ArrowPathIcon className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-indigo-600 transition-all duration-300 font-medium hover:scale-105"
                  >
                    Sign In
                  </Link>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/40 to-blue-200/40 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                    <Link
                      to="/register"
                      className="relative bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-2 rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-500 shadow-lg hover:shadow-xl hover:scale-110 hover:-translate-y-1 transform font-semibold"
                    >
                      Get Started
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Dynamic Hero Section */}
      <section className="relative pt-36 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full text-sm font-medium text-indigo-700 mb-6 animate-pulse">
                <SparklesIcon className="h-4 w-4 mr-2" />
                Trusted by 10,000+ Professionals
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                Your Health,
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent animate-pulse"> Simplified</span>
              </h1>
              <p className="text-xl text-gray-600 mt-6 leading-relaxed">
                Connect with trusted doctors, manage your appointments, track your health records, 
                and access lab results - all in one comprehensive healthcare platform.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/register" 
                  className="group bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-indigo-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transform"
                >
                  Start Your Journey
                  <ArrowRightIcon className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                </Link>
                <button className="group border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-50 transition-all duration-300 flex items-center justify-center hover:scale-105 transform">
                  <PlayIcon className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                  Watch Demo
                </button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-6">
                <div className="flex items-center group">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </div>
                  <span className="text-gray-600 ml-2 font-medium">Trusted by 10,000+ patients</span>
                </div>
                <div className="flex items-center group">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                    <ShieldCheckIcon className="h-5 w-5 text-green-500" />
                  </div>
                  <span className="text-gray-600 ml-2 font-medium">HIPAA Compliant</span>
                </div>
              </div>
            </div>
            <div className={`relative transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              {/* Floating Cards */}
              <div className="absolute -top-8 -left-8 w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
                <RocketLaunchIcon className="h-10 w-10 text-white" />
              </div>
              
              <div className="absolute -bottom-8 -right-8 w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg animate-pulse">
                <ChartBarIcon className="h-8 w-8 text-white" />
              </div>

              {/* Main Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 transform rotate-2 hover:rotate-0 transition-all duration-500 hover:scale-105 border border-white/50">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <CalendarIcon className="h-6 w-6 mr-2" />
                    Quick Appointment Booking
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white/20 rounded-xl p-4 hover:bg-white/30 transition-all duration-200 cursor-pointer group">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Dr. Sarah Johnson</span>
                        <span className="text-xs bg-white/30 px-3 py-1 rounded-full group-hover:bg-white/40 transition-colors">Cardiologist</span>
                      </div>
                      <div className="text-sm mt-2 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Available: Tomorrow 2:00 PM
                      </div>
                    </div>
                    <div className="bg-white/20 rounded-xl p-4 hover:bg-white/30 transition-all duration-200 cursor-pointer group">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Dr. Michael Chen</span>
                        <span className="text-xs bg-white/30 px-3 py-1 rounded-full group-hover:bg-white/40 transition-colors">Dermatologist</span>
                      </div>
                      <div className="text-sm mt-2 flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        Available: Today 4:30 PM
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Heart */}
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full flex items-center justify-center shadow-lg animate-pulse hover:scale-110 transition-transform duration-200">
                <HeartIcon className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Stats Section */}
      <section id="stats" className="py-16 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trusted by Healthcare Professionals Worldwide
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Join thousands of healthcare providers who have transformed their practice with our platform
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat: any, index: number) => (
              <div key={index} className="text-center group">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-all duration-300 hover:scale-105 border border-white/20">
                  <div className="flex justify-center mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <stat.icon className={`h-6 w-6 text-white`} />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">
                    {stat.label === "Satisfaction Rate" ? `${animatedStats.satisfaction}%` : 
                     stat.label === "Active Patients" ? animatedStats.patients.toLocaleString() :
                     stat.label === "Verified Doctors" ? animatedStats.doctors.toLocaleString() :
                     animatedStats.appointments.toLocaleString()}
                  </div>
                  <div className="text-white/80 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full text-sm font-medium text-indigo-700 mb-6">
              <SparklesIcon className="h-4 w-4 mr-2" />
              Comprehensive Healthcare Solutions
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Better Healthcare
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform brings together all aspects of healthcare management 
              to provide you with a seamless experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/50">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 w-fit mb-6 group-hover:scale-110 transition-transform duration-200">
                <CalendarIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">Easy Appointment Booking</h3>
              <p className="text-gray-600 leading-relaxed">
                Book appointments with verified doctors in real-time. Choose your preferred time slot 
                and get instant confirmation.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/50">
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 w-fit mb-6 group-hover:scale-110 transition-transform duration-200">
                <DocumentTextIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-green-600 transition-colors">Digital Health Records</h3>
              <p className="text-gray-600 leading-relaxed">
                Access your complete medical history, prescriptions, and test results 
                securely stored in one place.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/50">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 w-fit mb-6 group-hover:scale-110 transition-transform duration-200">
                <BeakerIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-purple-600 transition-colors">Lab Test Management</h3>
              <p className="text-gray-600 leading-relaxed">
                Order lab tests, track results, and receive detailed reports 
                directly through the platform.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/50">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 w-fit mb-6 group-hover:scale-110 transition-transform duration-200">
                <UserGroupIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-orange-600 transition-colors">Expert Doctor Network</h3>
              <p className="text-gray-600 leading-relaxed">
                Connect with certified specialists across various medical fields 
                for comprehensive healthcare solutions.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/50">
              <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 w-fit mb-6 group-hover:scale-110 transition-transform duration-200">
                <ShieldCheckIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-red-600 transition-colors">Secure & Private</h3>
              <p className="text-gray-600 leading-relaxed">
                Your health data is protected with enterprise-grade security 
                and HIPAA compliance standards.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group bg-white/80 backdrop-blur-sm rounded-2xl p-8 hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/50">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-4 w-fit mb-6 group-hover:scale-110 transition-transform duration-200">
                <ClockIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors">24/7 Support</h3>
              <p className="text-gray-600 leading-relaxed">
                Get help whenever you need it with our round-the-clock 
                customer support team.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Available Doctors Slideshow - Moved here and restyled */}
      {availableDoctors && availableDoctors.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-white to-indigo-50 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-full text-sm font-medium text-indigo-700 mb-6 font-bold shadow-sm border border-indigo-200/50">
                <SparklesIcon className="h-4 w-4 mr-2 text-indigo-600" />
                OUR PREMIUM SPECIALISTS
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 tracking-tight">
                Connect with <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">Top Rated Doctors</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto font-medium">
                Verified healthcare professionals ready to provide exceptional care for you and your family.
              </p>
            </div>

            <div className="relative group p-1">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 blur-3xl rounded-[40px] opacity-50 group-hover:opacity-100 transition-opacity duration-1000"></div>
              
              <div className="relative overflow-hidden h-[340px] md:h-[280px]">
                <div 
                  className="flex transition-transform duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] h-full"
                  style={{ transform: `translateX(-${currentDoctorSlide * 100}%)` }}
                >
                  {availableDoctors.map((doctor: any) => (
                    <div key={doctor.id} className="w-full flex-shrink-0 px-4 h-full">
                      <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] p-8 border border-white/80 h-full flex flex-col md:flex-row gap-8 shadow-2xl shadow-indigo-100/50 hover:shadow-indigo-200/50 transition-all duration-500 group/card relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100/20 to-purple-100/20 rounded-full blur-2xl"></div>
                        
                        <div className="relative flex-shrink-0 mx-auto md:mx-0">
                          <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-10 group-hover/card:opacity-30 transition-opacity"></div>
                          {doctor.user?.profileImage ? (
                            <img src={doctor.user.profileImage} className="w-24 h-24 md:w-36 md:h-36 rounded-3xl object-cover relative z-10 border-4 border-white shadow-2xl transition-transform duration-500 group-hover/card:scale-105" alt="avatar" />
                          ) : (
                            <div className="w-24 h-24 md:w-36 md:h-36 rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center relative z-10 border-4 border-white shadow-2xl transition-transform duration-500 group-hover/card:scale-105">
                              <span className="text-white text-4xl font-black uppercase tracking-tighter opacity-80">{doctor.user?.firstName?.[0]}{doctor.user?.lastName?.[0]}</span>
                            </div>
                          )}
                          <div className="absolute -bottom-3 -right-3 bg-indigo-600 text-white rounded-2xl p-2.5 shadow-xl z-20 border-4 border-white scale-90 group-hover/card:scale-110 transition-transform duration-500">
                            <ShieldCheckIcon className="h-5 w-5" />
                          </div>
                        </div>
                        
                        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left relative z-10">
                          <h3 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Dr. {doctor.user?.firstName} {doctor.user?.lastName}</h3>
                          <p className="text-indigo-600 font-black text-sm uppercase tracking-[4px] mb-4 flex items-center gap-2">
                             {doctor.specialization || doctor.department}
                          </p>
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6 text-gray-500 font-bold text-sm">
                            <span className="flex items-center gap-1.5 bg-gray-50/80 px-3 py-1.5 rounded-xl border border-gray-100">
                              <MapPinIcon className="h-4 w-4 text-indigo-500" />
                              {doctor.hospital || 'Elite General'}
                            </span>
                            <span className="flex items-center gap-1.5 bg-yellow-50/80 px-3 py-1.5 rounded-xl border border-yellow-100/50">
                              <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                              {doctor.averageRating || 'Top Tier'}
                            </span>
                          </div>
                          <div className="mt-auto w-full md:w-auto">
                            <button 
                              onClick={() => navigate(user ? `/app/appointments?doctor=${doctor.id}` : '/login')}
                              className="w-full md:w-64 py-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-indigo-200"
                            >
                              Book Consultation
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-2 md:px-0 pointer-events-none">
                  <button 
                    onClick={() => setCurrentDoctorSlide((prev) => (prev - 1 + availableDoctors.length) % availableDoctors.length)}
                    className="p-4 bg-white/90 text-indigo-600 rounded-full shadow-2xl hover:bg-white transition-all active:scale-90 pointer-events-auto border border-gray-100 -ml-2 md:-ml-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                  <button 
                    onClick={() => setCurrentDoctorSlide((prev) => (prev + 1) % availableDoctors.length)}
                    className="p-4 bg-white/90 text-indigo-600 rounded-full shadow-2xl hover:bg-white transition-all active:scale-90 pointer-events-auto border border-gray-100 -mr-2 md:-mr-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="flex justify-center mt-10 gap-3">
                {availableDoctors.slice(0, 5).map((_: any, idx: number) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentDoctorSlide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-700 ease-out shadow-sm ${idx === currentDoctorSlide ? 'w-12 bg-indigo-600' : 'w-3 bg-gray-200 hover:bg-gray-300'}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Dynamic Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-purple-600/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full text-sm font-medium text-indigo-700 mb-6">
              <StarIcon className="h-4 w-4 mr-2" />
              What Our Users Say
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Trusted by Healthcare Professionals
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover why thousands of healthcare providers and patients choose our platform
            </p>
            {user && (
              <button 
                onClick={() => setShowReviewModal(true)}
                className="mt-8 inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 group"
              >
                <SparklesIcon className="h-5 w-5 mr-2 animate-pulse" />
                Write a Website Review
              </button>
            )}
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="relative">
              {/* Testimonial Cards Container */}
              <div className="overflow-hidden rounded-3xl mx-8 md:mx-16">
                <div 
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
                >
                  {testimonials.map((testimonial: any, index: number) => (
                    <div key={index} className="w-full flex-shrink-0">
                      <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-8 md:p-16 border border-white/40 relative overflow-hidden mx-4">
                        {/* Glassmorphism Background Effects */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-400/20 to-indigo-600/20 rounded-full blur-3xl"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-purple-400/10 to-pink-600/10 rounded-full blur-2xl"></div>
                        
                        <div className="relative z-10">
                          {/* Quote Icon */}
                          <div className="flex justify-center mb-10">
                            <div className="w-20 h-20 bg-gradient-to-r from-indigo-500/90 to-purple-600/90 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-white/30">
                              <span className="text-white text-3xl font-bold">"</span>
                            </div>
                          </div>
                          
                          {/* Stars */}
                          <div className="flex justify-center mb-8">
                            {[...Array(5)].map((_: any, i: number) => (
                              <StarIcon key={i} className="h-7 w-7 text-yellow-400 fill-current mx-1" />
                            ))}
                          </div>
                          
                          {/* Testimonial Content */}
                          <blockquote className="text-xl md:text-3xl text-gray-800 leading-relaxed font-medium text-center mb-12 max-w-4xl mx-auto">
                            {testimonial.content}
                          </blockquote>
                          
                          {/* Author Info */}
                          <div className="flex flex-col items-center space-y-4">
                            {testimonial.image ? (
                              <img 
                                src={testimonial.image} 
                                alt={testimonial.name}
                                className="w-20 h-20 rounded-3xl object-cover border-2 border-white/50 shadow-lg group-hover:scale-110 transition-transform duration-500"
                              />
                            ) : (
                              <div className={`w-20 h-20 bg-gradient-to-r ${testimonial.color} rounded-3xl flex items-center justify-center border border-white/30 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500`}>
                                <span className="text-white font-bold text-xl uppercase">
                                  {testimonial.avatar}
                                </span>
                              </div>
                            )}
                            <div className="text-center">
                              <h4 className="text-2xl font-bold text-gray-900 mb-2">
                                {testimonial.name}
                              </h4>
                              <p className="text-indigo-600 font-semibold text-lg flex items-center justify-center">
                                <ShieldCheckIcon className="h-5 w-5 mr-1.5" />
                                {testimonial.role}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Enhanced Navigation Dots */}
              <div className="flex justify-center mt-12 space-x-4">
                {testimonials.map((_: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (isAnimating) return;
                      setIsAnimating(true);
                      setTimeout(() => {
                        setCurrentTestimonial(index);
                        setIsAnimating(false);
                      }, 300);
                    }}
                    className={`transition-all duration-500 ${
                      index === currentTestimonial
                        ? 'w-12 h-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full'
                        : 'w-4 h-4 bg-white/60 hover:bg-white/80 rounded-full hover:scale-125 backdrop-blur-sm border border-white/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic About Section */}
      <section id="about" className="py-20 bg-gradient-to-br from-white to-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full text-sm font-medium text-indigo-700 mb-6">
                <BriefcaseIcon className="h-4 w-4 mr-2" />
                About Our Platform
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                About Livora
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Founded in 2024, Livora is a comprehensive digital healthcare platform 
                designed to bridge the gap between patients and healthcare providers. We believe 
                that quality healthcare should be accessible, efficient, and personalized for everyone.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Our mission is to revolutionize healthcare delivery by providing a seamless, 
                secure, and user-friendly platform that connects patients with verified doctors, 
                streamlines appointment booking, and ensures comprehensive health record management.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center group">
                  <div className="bg-gradient-to-r from-blue-100 to-blue-200 rounded-2xl p-4 w-fit mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                    <HeartIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">Our Mission</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Making quality healthcare accessible to everyone through technology
                  </p>
                </div>
                <div className="text-center group">
                  <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-2xl p-4 w-fit mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                    <ShieldCheckIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Our Vision</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    A world where healthcare is seamless, secure, and patient-centered
                  </p>
                </div>
              </div>
            </div>
            
            <div className={`relative transition-all duration-1000 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-indigo-600/10 rounded-full blur-2xl"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <EyeIcon className="h-6 w-6 mr-2 text-indigo-600" />
                    Why Choose Us?
                  </h3>
                <div className="space-y-4">
                    <div className="flex items-start group">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Verified Healthcare Providers</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">All doctors are thoroughly vetted and certified</p>
                      </div>
                    </div>
                    <div className="flex items-start group">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">HIPAA Compliant</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">Your health data is protected with enterprise-grade security</p>
                      </div>
                    </div>
                    <div className="flex items-start group">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">24/7 Support</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">Round-the-clock assistance whenever you need it</p>
                      </div>
                    </div>
                    <div className="flex items-start group">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-1 flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">Comprehensive Platform</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">Everything you need for complete healthcare management</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg animate-pulse hover:scale-110 transition-transform duration-200">
                <StarIcon className="h-6 w-6" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg animate-pulse hover:scale-110 transition-transform duration-200">
                <HeartIcon className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium text-white mb-6">
              <PhoneIcon className="h-4 w-4 mr-2" />
              Get In Touch
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Healthcare Experience?
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Join thousands of healthcare providers and patients who have already made the switch
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-center group">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                  <PhoneIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Phone Support</h3>
                  <p className="text-white/80">01834123393</p>
                </div>
              </div>
              
              <div className="flex items-center group">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                  <EnvelopeIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Email Support</h3>
                  <p className="text-white/80">livora@outlook.com</p>
                </div>
              </div>
              
              <div className="flex items-center group">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                  <MapPinIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Office Location</h3>
                  <p className="text-white/80">123 Livora Ave, Medical City</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-6">Start Your Journey Today</h3>
              <div className="space-y-4">
                <Link 
                  to="/register" 
                  className="block w-full bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all duration-300 text-center shadow-lg hover:shadow-xl hover:scale-105 transform"
                >
                  Create Account
                </Link>
                <Link 
                  to="/login" 
                  className="block w-full border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-indigo-600 transition-all duration-300 text-center hover:scale-105 transform"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic CTA Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium text-white mb-6">
            <RocketLaunchIcon className="h-4 w-4 mr-2" />
            Start Your Journey Today
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Healthcare Experience?
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of patients who have already made the switch to better healthcare management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="group bg-white text-indigo-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
            >
              Get Started Today
              <ArrowRightIcon className="inline-block ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <Link 
              to="/login" 
              className="group border-2 border-white text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white hover:text-indigo-600 transition-all duration-300 hover:scale-105 transform"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Dynamic Footer */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/5 to-purple-600/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center group mb-6">
                <div className="flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <img src="/logo.png" className="h-16 w-16" alt="Livora Logo" />
                </div>
                <span className="ml-3 text-2xl font-bold group-hover:text-indigo-400 transition-colors">Livora</span>
              </div>
              <p className="text-gray-300 mb-6 leading-relaxed max-w-md">
                Your trusted partner in healthcare management. We're committed to making 
                healthcare accessible, efficient, and secure for everyone.
              </p>
              <div className="flex space-x-4">
                <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl p-3 hover:bg-indigo-600 transition-all duration-300 cursor-pointer hover:scale-110 transform">
                  <span className="text-sm font-medium">Facebook</span>
                </div>
                <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl p-3 hover:bg-indigo-600 transition-all duration-300 cursor-pointer hover:scale-110 transform">
                  <span className="text-sm font-medium">Twitter</span>
                </div>
                <div className="bg-gray-700/50 backdrop-blur-sm rounded-xl p-3 hover:bg-indigo-600 transition-all duration-300 cursor-pointer hover:scale-110 transform">
                  <span className="text-sm font-medium">LinkedIn</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6 text-indigo-300">For Patients</h3>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200 flex items-center group">
                  <ArrowPathIcon className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                  Find Doctors
                </a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200 flex items-center group">
                  <ArrowPathIcon className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                  Book Appointments
                </a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200 flex items-center group">
                  <ArrowPathIcon className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                  Lab Tests
                </a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200 flex items-center group">
                  <ArrowPathIcon className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                  Health Records
                </a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6 text-indigo-300">For Doctors</h3>
              <ul className="space-y-3 text-gray-300">
                <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200 flex items-center group">
                  <ArrowPathIcon className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                  Join Our Network
                </a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200 flex items-center group">
                  <ArrowPathIcon className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                  Patient Management
                </a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200 flex items-center group">
                  <ArrowPathIcon className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                  Schedule Management
                </a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors duration-200 flex items-center group">
                  <ArrowPathIcon className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                  Analytics
                </a></li>
              </ul>
            </div>
            </div>
            
          <div className="border-t border-gray-700/50 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 mb-4 md:mb-0">
                <p>&copy; 2024 Livora. All rights reserved.</p>
                </div>
              <div className="flex items-center space-x-6 text-gray-400">
                <a href="#" className="hover:text-indigo-400 transition-colors duration-200">Privacy Policy</a>
                <a href="#" className="hover:text-indigo-400 transition-colors duration-200">Terms of Service</a>
                <a href="#" className="hover:text-indigo-400 transition-colors duration-200">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowReviewModal(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-scale-in">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <h3 className="text-2xl font-bold">Share Your Experience</h3>
              <p className="text-indigo-100 text-sm opacity-90">How do you like using Livora?</p>
            </div>
            
            <form onSubmit={handleReviewSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Overall Rating</label>
                <div className="flex space-x-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                      className={`p-2 rounded-xl transition-all duration-300 ${
                        newReview.rating >= star 
                          ? 'bg-yellow-50 text-yellow-500 scale-110' 
                          : 'bg-gray-50 text-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <StarIcon className={`h-8 w-8 ${newReview.rating >= star ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider font-montserrat">Your Review</label>
                <textarea
                  required
                  rows={4}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all resize-none"
                  placeholder="Tell us what you think about our website and services..."
                  value={newReview.review}
                  onChange={(e) => setNewReview(prev => ({ ...prev, review: e.target.value }))}
                />
              </div>
              
              <div className="flex space-x-4 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 px-6 py-4 border-2 border-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center group"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Submit Review
                      <RocketLaunchIcon className="h-5 w-5 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;

