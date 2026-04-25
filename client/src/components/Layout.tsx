import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import ChatbotWidget from './ChatbotWidget';
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
  ChartBarIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children?: React.ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  roles: string[];
  iconColor: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard',      href: '/app/dashboard',          icon: HomeIcon,                  roles: ['patient'], iconColor: 'text-blue-500',   activeBg: 'bg-blue-50',   activeBorder: 'border-blue-100',   activeText: 'text-blue-700'   },
  { name: 'Dashboard',      href: '/app/doctor-dashboard',   icon: HomeIcon,                  roles: ['doctor'],  iconColor: 'text-blue-500',   activeBg: 'bg-blue-50',   activeBorder: 'border-blue-100',   activeText: 'text-blue-700'   },
  { name: 'Dashboard',      href: '/app/admin-dashboard',    icon: ChartBarIcon,              roles: ['admin'],   iconColor: 'text-blue-500',   activeBg: 'bg-blue-50',   activeBorder: 'border-blue-100',   activeText: 'text-blue-700'   },
  { name: 'Profile',        href: '/app/profile',            icon: UserIcon,                  roles: ['patient'], iconColor: 'text-emerald-500', activeBg: 'bg-emerald-50', activeBorder: 'border-emerald-100', activeText: 'text-emerald-700' },
  { name: 'Doctor Profile', href: '/app/doctor-profile',     icon: UserIcon,                  roles: ['doctor'],  iconColor: 'text-emerald-500', activeBg: 'bg-emerald-50', activeBorder: 'border-emerald-100', activeText: 'text-emerald-700' },
  { name: 'Appointments',   href: '/app/appointments',       icon: CalendarIcon,              roles: ['patient'], iconColor: 'text-violet-500',  activeBg: 'bg-violet-50',  activeBorder: 'border-violet-100',  activeText: 'text-violet-700'  },
  { name: 'Appointments',   href: '/app/doctor-appointments',icon: CalendarIcon,              roles: ['doctor'],  iconColor: 'text-violet-500',  activeBg: 'bg-violet-50',  activeBorder: 'border-violet-100',  activeText: 'text-violet-700'  },
  { name: 'Medical Records',href: '/app/medical-records',    icon: ClipboardDocumentListIcon, roles: ['patient'], iconColor: 'text-indigo-500',  activeBg: 'bg-indigo-50',  activeBorder: 'border-indigo-100',  activeText: 'text-indigo-700'  },
  { name: 'Assistant',      href: '/app/assistant',          icon: SparklesIcon,              roles: ['patient'], iconColor: 'text-indigo-500',  activeBg: 'bg-indigo-50',  activeBorder: 'border-indigo-100',  activeText: 'text-indigo-700'  },
  { name: 'Lab Reports',    href: '/app/lab-reports',        icon: BeakerIcon,                roles: ['patient'], iconColor: 'text-amber-500',   activeBg: 'bg-amber-50',   activeBorder: 'border-amber-100',   activeText: 'text-amber-700'   },
  { name: 'Find Doctors',   href: '/find-doctors',           icon: UserGroupIcon,             roles: ['patient'], iconColor: 'text-teal-500',    activeBg: 'bg-teal-50',    activeBorder: 'border-teal-100',    activeText: 'text-teal-700'    },
  { name: 'My Patients',    href: '/app/patients',           icon: UsersIcon,                 roles: ['doctor'],  iconColor: 'text-teal-500',    activeBg: 'bg-teal-50',    activeBorder: 'border-teal-100',    activeText: 'text-teal-700'    },
  { name: 'Users',          href: '/app/users',              icon: UsersIcon,                 roles: ['admin'],   iconColor: 'text-slate-500',   activeBg: 'bg-slate-100',  activeBorder: 'border-slate-200',   activeText: 'text-slate-700'   },
  { name: 'Doctors',        href: '/app/admin-doctors',      icon: UserGroupIcon,             roles: ['admin'],   iconColor: 'text-emerald-500', activeBg: 'bg-emerald-50', activeBorder: 'border-emerald-100', activeText: 'text-emerald-700' },
  { name: 'Patients',       href: '/app/admin-patients',     icon: UsersIcon,                 roles: ['admin'],   iconColor: 'text-blue-500',    activeBg: 'bg-blue-50',    activeBorder: 'border-blue-100',    activeText: 'text-blue-700'    },
  { name: 'Lab Reports',    href: '/app/admin-lab-reports',  icon: BeakerIcon,                roles: ['admin'],   iconColor: 'text-amber-500',   activeBg: 'bg-amber-50',   activeBorder: 'border-amber-100',   activeText: 'text-amber-700'   },
  { name: 'Lab Tests',      href: '/app/admin-lab-tests',    icon: BeakerIcon,                roles: ['admin'],   iconColor: 'text-amber-500',   activeBg: 'bg-amber-50',   activeBorder: 'border-amber-100',   activeText: 'text-amber-700'   },
  { name: 'Doctor Ratings', href: '/app/admin-ratings',      icon: StarIcon,                  roles: ['admin'],   iconColor: 'text-amber-500',   activeBg: 'bg-amber-50',   activeBorder: 'border-amber-100',   activeText: 'text-amber-700'   },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const filteredNavigation = NAV_ITEMS.filter(item =>
    item.roles.includes(user?.role || 'patient')
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getProfileUrl = () => {
    switch (user?.role) {
      case 'patient': return '/app/profile';
      case 'doctor': return '/app/doctor-profile';
      default: return '/app/admin-dashboard';
    }
  };

  const userInitials = `${user?.firstName?.charAt(0) ?? ''}${user?.lastName?.charAt(0) ?? ''}`;

  return (
    <div className="min-h-screen bg-[#fafbff] font-sans">

      {/* ══════════════════════════════════════════
          MOBILE SIDEBAR OVERLAY
      ══════════════════════════════════════════ */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white border-r border-slate-100 shadow-2xl shadow-slate-900/10 overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-[-15%] right-[-30%] w-[200px] h-[200px] bg-indigo-500/[0.05] rounded-full blur-[60px]" />
              <div className="absolute bottom-[-10%] left-[-20%] w-[160px] h-[160px] bg-violet-500/[0.04] rounded-full blur-[50px]" />
            </div>

            {/* Mobile brand + close */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 relative z-10">
              <Link to="/" onClick={() => setSidebarOpen(false)} className="flex items-center gap-3 group">
                <div className="relative flex-shrink-0">
                  <div className="absolute inset-0 bg-indigo-400/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                  <img src="/logo.png" className="h-9 w-9 relative z-10 object-contain" alt="Livora" />
                </div>
                <div>
                  <h1 className="text-base font-black text-slate-900 tracking-tight leading-none group-hover:text-indigo-700 transition-colors">Livora</h1>
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mt-0.5">Healthcare</p>
                </div>
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile nav */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 relative z-10 landing-scroll">
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 px-2 pb-2 mb-1">Navigation</p>
              <ul className="space-y-1">
                {filteredNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <li key={item.href}>
                      <button
                        onClick={() => { navigate(item.href); setSidebarOpen(false); }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                          isActive
                            ? `${item.activeBg} ${item.activeBorder} ${item.activeText} shadow-sm`
                            : 'border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-100 hover:text-slate-800'
                        }`}
                      >
                        <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? item.iconColor : 'text-slate-400'}`} />
                        <span className="flex-1 text-left">{item.name}</span>
                        {isActive && (
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.iconColor} animate-pulse`} />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Mobile user section */}
            <div className="p-4 border-t border-slate-100 relative z-10">
              <Link
                to={getProfileUrl()}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/80 border border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-all duration-200 mb-3 group"
              >
                <div className="flex-shrink-0">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt={`${user.firstName} ${user.lastName}`} className="h-9 w-9 rounded-xl object-cover border-2 border-white shadow-sm" />
                  ) : (
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
                      <span className="text-xs font-black text-white">{userInitials}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-700 transition-colors leading-tight">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{user?.role}</p>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all border border-transparent hover:border-rose-100"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          DESKTOP SIDEBAR
      ══════════════════════════════════════════ */}
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col z-50 transition-all duration-500 ease-in-out ${
        desktopSidebarCollapsed ? 'lg:w-[68px]' : 'lg:w-72'
      }`}>
        <div className="flex flex-col flex-grow bg-white/85 backdrop-blur-xl border-r border-slate-100/80 shadow-[4px_0_20px_-8px_rgba(0,0,0,0.06)] relative overflow-hidden transition-all duration-500">

          {/* Decorative aurora blobs */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-15%] right-[-40%] w-[220px] h-[220px] bg-indigo-500/[0.05] rounded-full blur-[60px]" />
            <div className="absolute bottom-[-10%] left-[-30%] w-[180px] h-[180px] bg-violet-500/[0.04] rounded-full blur-[50px]" />
          </div>

          {/* ─── Brand Header ─── */}
          <div className={`border-b border-slate-100/80 relative z-10 transition-all duration-500 ${
            desktopSidebarCollapsed ? 'px-3 py-4' : 'px-5 py-5'
          }`}>
            <Link
              to="/"
              className={`flex items-center group relative transition-all duration-300 rounded-xl hover:bg-slate-50 p-2 -mx-2 ${
                desktopSidebarCollapsed ? 'justify-center' : 'gap-3'
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-indigo-400/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
                <img
                  src="/logo.png"
                  className={`relative z-10 object-contain transition-all duration-500 group-hover:scale-105 ${
                    desktopSidebarCollapsed ? 'h-8 w-8' : 'h-10 w-10'
                  }`}
                  alt="Livora"
                />
              </div>
              {!desktopSidebarCollapsed && (
                <div className="min-w-0 overflow-hidden">
                  <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none group-hover:text-indigo-700 transition-colors">
                    Livora
                  </h1>
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mt-0.5">Healthcare</p>
                  <div className="h-0.5 w-0 bg-indigo-400/40 group-hover:w-full transition-all duration-500 rounded-full mt-1" />
                </div>
              )}
            </Link>
          </div>

          {/* ─── Navigation ─── */}
          <nav className={`flex-1 overflow-y-auto relative z-10 py-4 landing-scroll transition-all duration-500 ${
            desktopSidebarCollapsed ? 'px-2' : 'px-3'
          }`}>
            {!desktopSidebarCollapsed && (
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 px-2 pb-2 mb-1">
                Navigation
              </p>
            )}
            <ul className="space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.href}>
                    <button
                      onClick={() => navigate(item.href)}
                      title={desktopSidebarCollapsed ? item.name : undefined}
                      className={`w-full flex items-center rounded-xl text-sm font-semibold transition-all duration-200 border group ${
                        isActive
                          ? `${item.activeBg} ${item.activeBorder} ${item.activeText} shadow-sm`
                          : 'border-transparent text-slate-500 hover:bg-slate-50 hover:border-slate-100 hover:text-slate-800'
                      } ${desktopSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'}`}
                    >
                      <item.icon className={`h-5 w-5 flex-shrink-0 transition-colors ${
                        isActive ? item.iconColor : 'text-slate-400 group-hover:text-slate-600'
                      }`} />
                      {!desktopSidebarCollapsed && (
                        <span className="flex-1 text-left truncate">{item.name}</span>
                      )}
                      {!desktopSidebarCollapsed && isActive && (
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${item.iconColor} animate-pulse`} />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* ─── User Section ─── */}
          <div className={`border-t border-slate-100/80 relative z-10 transition-all duration-500 ${
            desktopSidebarCollapsed ? 'p-3' : 'p-4'
          }`}>
            {!desktopSidebarCollapsed ? (
              <>
                <Link
                  to={getProfileUrl()}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50/60 border border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-sm transition-all duration-200 mb-3 group"
                >
                  <div className="flex-shrink-0">
                    {user?.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="h-9 w-9 rounded-xl object-cover border-2 border-white shadow-sm group-hover:border-indigo-200 transition-colors"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm flex-shrink-0">
                        <span className="text-xs font-black text-white">{userInitials}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-700 transition-colors leading-tight">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{user?.role}</p>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all duration-200 border border-transparent hover:border-rose-100"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Link to={getProfileUrl()} title="Profile" className="group">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="h-9 w-9 rounded-xl object-cover border-2 border-slate-100 shadow-sm group-hover:border-indigo-200 transition-colors"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm group-hover:shadow-indigo-500/25 transition-shadow">
                      <span className="text-xs font-black text-white">{userInitials}</span>
                    </div>
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all border border-transparent hover:border-rose-100"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════════════════ */}
      <div className={`transition-all duration-500 ease-in-out ${
        desktopSidebarCollapsed ? 'lg:pl-[68px]' : 'lg:pl-72'
      }`}>

        {/* ─── Top Bar ─── */}
        <div className={`fixed top-0 z-40 flex h-14 shrink-0 items-center gap-x-3 border-b px-4 sm:gap-x-4 sm:px-6 lg:px-8 transition-all duration-500 ${
          scrolled
            ? 'border-slate-100 bg-[#fafbff]/95 backdrop-blur-xl shadow-sm'
            : 'border-slate-100/60 bg-[#fafbff]/80 backdrop-blur-lg'
        } ${desktopSidebarCollapsed ? 'left-[68px] right-0' : 'left-0 lg:left-72 right-0'}`}>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="p-2 text-slate-500 lg:hidden hover:bg-slate-100 hover:text-slate-800 rounded-xl transition-all"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            className="hidden lg:flex items-center justify-center w-8 h-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all duration-200"
            onClick={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)}
            title={desktopSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {desktopSidebarCollapsed
              ? <ChevronRightIcon className="h-4 w-4" />
              : <ChevronLeftIcon className="h-4 w-4" />
            }
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            <div className="hidden lg:block h-5 w-px bg-slate-200" />

            <NotificationDropdown />

            <div className="hidden lg:block h-5 w-px bg-slate-200" />

            {/* User pill */}
            <Link
              to={getProfileUrl()}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-all duration-200 group"
            >
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="h-7 w-7 rounded-lg object-cover ring-2 ring-white shadow-sm"
                />
              ) : (
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm flex-shrink-0">
                  <span className="text-[10px] font-black text-white">{userInitials}</span>
                </div>
              )}
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors leading-tight">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{user?.role}</p>
              </div>
            </Link>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 border border-transparent hover:border-rose-100"
              title="Sign out"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        {/* ─── Page Content ─── */}
        <main className={children ? 'pt-0' : 'pt-14 py-6'}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full h-full">
            <div className="flex justify-center w-full h-full">
              <div className="w-full">
                {children || <Outlet />}
              </div>
            </div>
          </div>
        </main>

        {/* Hide floating chatbot widget on the full-screen assistant page */}
        {location.pathname !== '/app/assistant' && <ChatbotWidget />}
      </div>
    </div>
  );
};

export default Layout;
