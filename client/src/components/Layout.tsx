import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import {
  HomeIcon,
  UserIcon,
  CalendarIcon,
  BeakerIcon,
  UsersIcon,
  Bars3Icon,
  XMarkIcon,
  StarIcon,
  ArrowRightOnRectangleIcon,
  HeartIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for navigation transparency
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/app/dashboard', icon: HomeIcon, roles: ['patient'], color: 'blue' },
    { name: 'Dashboard', href: '/app/doctor-dashboard', icon: HomeIcon, roles: ['doctor'], color: 'blue' },
    { name: 'Dashboard', href: '/app/admin-dashboard', icon: ChartBarIcon, roles: ['admin'], color: 'blue' },
    { name: 'Profile', href: '/app/profile', icon: UserIcon, roles: ['patient'], color: 'green' },
    { name: 'Doctor Profile', href: '/app/doctor-profile', icon: UserIcon, roles: ['doctor'], color: 'green' },
    { name: 'Appointments', href: '/app/appointments', icon: CalendarIcon, roles: ['patient'], color: 'purple' },
    { name: 'Appointments', href: '/app/doctor-appointments', icon: CalendarIcon, roles: ['doctor'], color: 'purple' },
    { name: 'Medical Records', href: '/app/medical-records', icon: ClipboardDocumentListIcon, roles: ['patient'], color: 'indigo' },
    { name: 'Lab Reports', href: '/app/lab-reports', icon: BeakerIcon, roles: ['patient'], color: 'orange' },
    { name: 'Find Doctors', href: '/app/doctors', icon: UserGroupIcon, roles: ['patient'], color: 'teal' },
    { name: 'My Patients', href: '/app/patients', icon: UsersIcon, roles: ['doctor'], color: 'teal' },
    { name: 'Users', href: '/app/users', icon: UsersIcon, roles: ['admin'], color: 'gray' },
    { name: 'Doctors', href: '/app/admin-doctors', icon: UserGroupIcon, roles: ['admin'], color: 'green' },
    { name: 'Patients', href: '/app/admin-patients', icon: UsersIcon, roles: ['admin'], color: 'blue' },
    { name: 'Lab Reports', href: '/app/admin-lab-reports', icon: BeakerIcon, roles: ['admin'], color: 'orange' },
    { name: 'Lab Tests', href: '/app/admin-lab-tests', icon: BeakerIcon, roles: ['admin'], color: 'orange' },
    { name: 'Doctor Ratings', href: '/app/admin-ratings', icon: StarIcon, roles: ['admin'], color: 'yellow' },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role || 'patient')
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors = {
      blue: isActive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700',
      green: isActive ? 'bg-green-50 text-green-700 border-green-200' : 'text-gray-700 hover:bg-green-50 hover:text-green-700',
      purple: isActive ? 'bg-purple-50 text-purple-700 border-purple-200' : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700',
      indigo: isActive ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-700',
      orange: isActive ? 'bg-orange-50 text-orange-700 border-orange-200' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-700',
      teal: isActive ? 'bg-teal-50 text-teal-700 border-teal-200' : 'text-gray-700 hover:bg-teal-50 hover:text-teal-700',
      yellow: isActive ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'text-gray-700 hover:bg-yellow-50 hover:text-yellow-700',
      gray: isActive ? 'bg-gray-50 text-gray-700 border-gray-200' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-700',
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  const getIconColor = (color: string, isActive: boolean) => {
    const colors = {
      blue: isActive ? 'text-blue-600' : 'text-gray-400',
      green: isActive ? 'text-green-600' : 'text-gray-400',
      purple: isActive ? 'text-purple-600' : 'text-gray-400',
      indigo: isActive ? 'text-indigo-600' : 'text-gray-400',
      orange: isActive ? 'text-orange-600' : 'text-gray-400',
      teal: isActive ? 'text-teal-600' : 'text-gray-400',
      yellow: isActive ? 'text-yellow-600' : 'text-gray-400',
      gray: isActive ? 'text-gray-600' : 'text-gray-400',
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
          {/* Mobile header */}
          <div className="flex h-20 items-center justify-between px-6 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <HeartIcon className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">HealthCare Pro</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          {/* Mobile navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-2">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => {
                        navigate(item.href);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${getColorClasses(item.color, isActive)} ${
                        isActive ? 'shadow-sm border' : 'hover:shadow-sm'
                      }`}
                    >
                      <div className={`p-2 rounded-lg mr-3 transition-colors ${getIconColor(item.color, isActive)}`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="flex-1 text-left">{item.name}</span>
                      {isActive && (
                        <div className="w-2 h-2 bg-current rounded-full opacity-60"></div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Mobile user section */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                    <span className="text-sm font-bold text-white">
                      {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col transition-all duration-500 ease-in-out ${
        desktopSidebarCollapsed ? 'lg:w-16' : 'lg:w-72'
      }`}>
        <div className="flex flex-col flex-grow bg-white shadow-xl border-r border-gray-200 transition-all duration-500 ease-in-out">
          {/* Desktop header */}
          <div className="flex h-20 items-center px-6 bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center w-full">
              {!desktopSidebarCollapsed ? (
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <HeartIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white">HealthCare Pro</h1>
                    <p className="text-xs text-blue-100">Professional Healthcare</p>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center w-full">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <HeartIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Desktop navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-2">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <button
                      onClick={() => navigate(item.href)}
                      className={`w-full flex items-center rounded-xl text-sm font-medium transition-all duration-300 group ${getColorClasses(item.color, isActive)} ${
                        isActive ? 'shadow-sm border transform scale-[1.02]' : 'hover:shadow-sm hover:scale-[1.01]'
                      } ${desktopSidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-4 py-3'}`}
                      title={desktopSidebarCollapsed ? item.name : ''}
                    >
                      <div className={`p-2 rounded-lg transition-all duration-300 ${getIconColor(item.color, isActive)} ${
                        isActive ? 'scale-110' : 'group-hover:scale-105'
                      } ${!desktopSidebarCollapsed ? 'mr-3' : ''}`}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className={`flex-1 text-left transition-all duration-300 overflow-hidden ${
                        desktopSidebarCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
                      }`}>
                        {item.name}
                      </span>
                      {!desktopSidebarCollapsed && isActive && (
                        <div className="w-2 h-2 bg-current rounded-full opacity-60 animate-pulse"></div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Desktop user section */}
          <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 transition-all duration-500 ease-in-out">
            {!desktopSidebarCollapsed ? (
              <div className="transition-all duration-500 ease-in-out">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="h-12 w-12 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                        <span className="text-sm font-bold text-white">
                          {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 transition-all duration-500 ease-in-out">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition-all duration-300 border border-gray-200 hover:shadow-sm hover:border-gray-300"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4 transition-all duration-500 ease-in-out">
                <div className="flex-shrink-0">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-white">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-700 bg-white hover:bg-gray-100 rounded-lg transition-all duration-300 border border-gray-200 hover:shadow-sm hover:border-gray-300"
                  title="Sign out"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`transition-all duration-500 ease-in-out ${
        desktopSidebarCollapsed ? 'lg:pl-16' : 'lg:pl-72'
      }`}>
        {/* Top bar */}
        <div className={`fixed top-0 z-50 flex h-16 shrink-0 items-center gap-x-4 border-b px-4 sm:gap-x-6 sm:px-6 lg:px-8 transition-all duration-500 ${
          scrolled
            ? 'border-white/30 bg-white/60 backdrop-blur-xl shadow-xl'
            : 'border-white/20 bg-white/40 backdrop-blur-lg shadow-lg'
        } hover:bg-white/70 ${
          desktopSidebarCollapsed ? 'left-16 right-0' : 'left-0 lg:left-72 right-0'
        }`}>
          {/* Mobile menu button */}
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden hover:bg-gray-100 rounded-lg transition-all duration-300 hover:scale-110 animate-pulse"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          {/* Desktop sidebar toggle button */}
          <button
            type="button"
            className="hidden lg:block -m-2.5 p-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-300 hover:scale-110 animate-bounce"
            onClick={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)}
            title={desktopSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {desktopSidebarCollapsed ? (
              <ChevronRightIcon className="h-6 w-6 transition-transform duration-300 hover:scale-110" />
            ) : (
              <ChevronLeftIcon className="h-6 w-6 transition-transform duration-300 hover:scale-110" />
            )}
          </button>
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" />
              <div className="flex items-center gap-x-4 lg:gap-x-6">
                {/* Notifications */}
                <NotificationDropdown />
                
                {/* User profile */}
                <div className="relative">
                  <div className="flex items-center space-x-3">
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-ring-gray-200"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-gray-700">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-300 hover:scale-105 animate-bounce"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="pt-20 py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center">
              <div className="w-full max-w-6xl">
                <Outlet />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
