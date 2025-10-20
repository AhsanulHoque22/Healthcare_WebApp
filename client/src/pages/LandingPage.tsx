import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const LandingPage: React.FC = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatedStats, setAnimatedStats] = useState({
    patients: 0,
    doctors: 0,
    appointments: 0,
    satisfaction: 0
  });

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Patient",
      content: "HealthCare Pro has revolutionized how I manage my health. The appointment booking is seamless and I love having all my records in one place.",
      rating: 5,
      avatar: "SJ",
      color: "from-blue-500 to-indigo-600"
    },
    {
      name: "Dr. Michael Chen",
      role: "Cardiologist",
      content: "As a doctor, this platform has made patient management so much easier. The digital records and appointment system are exceptional.",
      rating: 5,
      avatar: "MC",
      color: "from-green-500 to-emerald-600"
    },
    {
      name: "Emily Rodriguez",
      role: "Patient",
      content: "The lab test results feature is amazing. I get my results instantly and can track my health progress over time.",
      rating: 5,
      avatar: "ER",
      color: "from-purple-500 to-pink-600"
    },
    {
      name: "Dr. Ahmed Hassan",
      role: "Neurologist",
      content: "The platform's efficiency has transformed my practice. Patient communication and record management have never been this smooth.",
      rating: 5,
      avatar: "AH",
      color: "from-orange-500 to-red-600"
    },
    {
      name: "Lisa Thompson",
      role: "Patient",
      content: "I can't imagine managing my health without this platform. The reminders and easy access to my medical history are game-changers.",
      rating: 5,
      avatar: "LT",
      color: "from-teal-500 to-cyan-600"
    }
  ];

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
                <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 animate-pulse">
                  <HeartIcon className="h-6 w-6 text-white" />
                  <SparklesIcon className="h-3 w-3 text-white/70 absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-all duration-300 group-hover:scale-105">HealthCare Pro</span>
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
              <Link
                to="/login"
                className="text-gray-600 hover:text-indigo-600 transition-all duration-300 font-medium hover:scale-105 animate-bounce"
              >
                Sign In
              </Link>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/40 to-blue-200/40 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                <Link
                  to="/register"
                  className="relative bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-2 rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-500 shadow-lg hover:shadow-xl hover:scale-110 hover:-translate-y-1 transform font-semibold animate-pulse"
                >
                  Get Started
                </Link>
              </div>
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
                Trusted by 10,000+ Healthcare Professionals
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
            {stats.map((stat, index) => (
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
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="relative">
              {/* Testimonial Cards Container */}
              <div className="overflow-hidden rounded-3xl mx-8 md:mx-16">
                <div 
                  className="flex transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
                >
                  {testimonials.map((testimonial, index) => (
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
                            {[...Array(5)].map((_, i) => (
                              <StarIcon key={i} className="h-7 w-7 text-yellow-400 fill-current mx-1" />
                            ))}
                          </div>
                          
                          {/* Testimonial Content */}
                          <blockquote className="text-xl md:text-3xl text-gray-800 leading-relaxed font-medium text-center mb-12 max-w-4xl mx-auto">
                            {testimonial.content}
                          </blockquote>
                          
                          {/* Author Info */}
                          <div className="flex flex-col items-center space-y-4">
                            <div className={`w-20 h-20 bg-gradient-to-r ${testimonial.color} rounded-3xl flex items-center justify-center border border-white/30 backdrop-blur-sm`}>
                              <span className="text-white font-bold text-xl">
                                {testimonial.avatar}
                              </span>
                            </div>
                            <div className="text-center">
                              <h4 className="text-2xl font-bold text-gray-900 mb-2">
                                {testimonial.name}
                              </h4>
                              <p className="text-indigo-600 font-semibold text-lg">
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
                {testimonials.map((_, index) => (
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
                About HealthCare Pro
              </h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Founded in 2024, HealthCare Pro is a comprehensive digital healthcare platform 
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

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-xl text-blue-100">
              Join the growing community of patients and healthcare providers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">10,000+</div>
              <div className="text-blue-100">Active Patients</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">500+</div>
              <div className="text-blue-100">Verified Doctors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">50,000+</div>
              <div className="text-blue-100">Appointments Booked</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">99.9%</div>
              <div className="text-blue-100">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Patients Say
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from real people who trust us with their healthcare
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "The appointment booking system is incredibly easy to use. I can find and book 
                appointments with specialists in minutes. The platform has revolutionized my healthcare experience."
              </p>
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-2 mr-4">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Sarah Ahmed</div>
                  <div className="text-gray-500 text-sm">Patient</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "As a doctor, I love how this platform streamlines my practice. The patient management 
                tools and appointment scheduling make my work so much more efficient."
              </p>
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-2 mr-4">
                  <HeartIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Dr. Yasir Junaid</div>
                  <div className="text-gray-500 text-sm">Cardiologist</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-6">
                "The lab test results feature is amazing. I can track my health metrics over time 
                and share them with my doctor easily. It's like having a personal health assistant."
              </p>
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-full p-2 mr-4">
                  <BeakerIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Mohammad Rahman</div>
                  <div className="text-gray-500 text-sm">Patient</div>
                </div>
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
                  <p className="text-white/80">+1 (555) 123-4567</p>
                </div>
              </div>
              
              <div className="flex items-center group">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                  <EnvelopeIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Email Support</h3>
                  <p className="text-white/80">support@healthcarepro.com</p>
                </div>
              </div>
              
              <div className="flex items-center group">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-200">
                  <MapPinIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Office Location</h3>
                  <p className="text-white/80">123 Healthcare Ave, Medical City</p>
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
              <div className="flex items-center mb-6 group">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                  <HeartIcon className="h-7 w-7 text-white" />
                </div>
                <span className="ml-3 text-2xl font-bold group-hover:text-indigo-400 transition-colors">HealthCare Pro</span>
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
                <p>&copy; 2024 HealthCare Pro. All rights reserved.</p>
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
    </div>
  );
};

export default LandingPage;

