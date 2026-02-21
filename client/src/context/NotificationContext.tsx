import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
  userId: number;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: number) => Promise<void>;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
  userId?: number | null;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children, userId }) => {
  const queryClient = useQueryClient();

  // Fetch notifications - query key MUST include user ID so each user has their own cache
  const { data: notificationsData, isLoading, error } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      try {
        const response = await axios.get('/notifications');
        console.log('📬 Notifications fetched:', response.data);
        return response.data.data;
      } catch (error: any) {
        console.error('❌ Failed to fetch notifications:', error);
        throw error;
      }
    },
    // 🔥 Poll slower
  refetchInterval: 60000, // 1 minute

  // 🔥 Don't refetch when switching tabs
  refetchOnWindowFocus: false,

  // 🔥 Don't refetch on reconnect
  refetchOnReconnect: false,

  // 🔥 Keep data fresh for 1 minute
  staleTime: 60000,

  // 🔥 Prevent unnecessary retries
  retry: false,

  // Only run when we have an authenticated user (token + user id)
  enabled: !!(localStorage.getItem('token') && userId),
  });

  // Log notification state for debugging
  useEffect(() => {
    console.log('📬 Notification State:', {
      notifications: notificationsData?.notifications,
      count: notificationsData?.notifications?.length,
      unreadCount: notificationsData?.notifications?.filter((n: Notification) => !n.isRead).length,
      isLoading,
      error
    });
  }, [notificationsData, isLoading, error]);

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  const markAsRead = async (notificationId: number) => {
    try {
      await axios.put(`/notifications/${notificationId}/read`);
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/notifications/read-all');
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      toast.success('All notifications marked as read');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to mark all notifications as read');
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await axios.delete(`/notifications/${notificationId}`);
      queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
      toast.success('Notification deleted');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete notification');
    }
  };

  const refreshNotifications = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications', userId] });
  };

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
