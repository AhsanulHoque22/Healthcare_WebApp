import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  XMarkIcon,
  TrashIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return (
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-100">
            <CheckCircleIcon className="h-5 w-5" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 border border-amber-100">
            <ExclamationTriangleIcon className="h-5 w-5" />
          </div>
        );
      case 'error':
        return (
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 border border-rose-100">
            <ExclamationCircleIcon className="h-5 w-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 border border-indigo-100">
            <InformationCircleIcon className="h-5 w-5" />
          </div>
        );
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-3 rounded-2xl transition-all duration-300 ${
          isOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
        }`}
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
        )}
      </motion.button>

      {/* Dropdown with AnimatePresence */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="absolute right-0 mt-4 w-96 bg-white/95 backdrop-blur-2xl rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 z-50 overflow-hidden flex flex-col origin-top-right"
          >
            {/* Premium Header */}
            <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 sticky top-0 z-10">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.25em]">Command Hub</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-100">
                      {unreadCount} NEW
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[10px] font-black text-slate-400 hover:text-indigo-600 uppercase tracking-widest transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-300 hover:text-slate-900 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Intelligence.</h3>
            </div>

            {/* Notifications List */}
            <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Querying Hub...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 grayscale opacity-30 shadow-inner">
                    <SparklesIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-base font-black text-slate-900 mb-1">All Clear</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Zero pending clinical alerts.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.slice(0, 15).map((notification, idx) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-6 hover:bg-slate-50/80 cursor-pointer transition-all relative group overflow-hidden ${
                        !notification.isRead ? 'bg-indigo-50/10' : ''
                      }`}
                    >
                      {!notification.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                      )}
                      
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 transition-transform group-hover:scale-110">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-1">
                            <h4 className={`text-sm font-black tracking-tight leading-snug ${
                              !notification.isRead ? 'text-slate-900' : 'text-slate-600'
                            }`}>
                              {notification.title}
                            </h4>
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-tighter shrink-0 mt-0.5">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                          <p className="text-[11px] font-bold text-slate-500 leading-relaxed line-clamp-2 pr-6">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-3 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!notification.isRead && (
                              <button className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Mark read</button>
                            )}
                            <button
                              onClick={(e) => handleDeleteNotification(e, notification.id)}
                              className="text-[9px] font-black text-rose-500 uppercase tracking-widest"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Archive Access */}
            <div className="bg-slate-50/30 p-5 border-t border-slate-100">
              <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200">
                <ArchiveBoxIcon className="h-4 w-4" />
                View Alert Archive
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;
