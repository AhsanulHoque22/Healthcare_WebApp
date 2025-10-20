import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

// Types
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  role: 'patient' | 'doctor' | 'admin';
  isActive: boolean;
  emailVerified: boolean;
  profileImage?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  loading: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  role?: 'patient' | 'doctor' | 'admin';
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

// Add cache-busting headers to prevent browser caching
axios.defaults.headers.common['Cache-Control'] = 'no-cache, no-store, must-revalidate';
axios.defaults.headers.common['Pragma'] = 'no-cache';
axios.defaults.headers.common['Expires'] = '0';

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set up axios interceptor for token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await axios.get('/auth/profile');
          setUser(response.data.data.user);
        } catch (error: any) {
          console.error('Failed to load user:', error);
          // Check if it's a token expiration error
          if (error.response?.status === 401) {
            console.log('Token expired, clearing authentication');
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            toast.error('Session expired. Please log in again.');
          }
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Add axios interceptor for automatic token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error: any) => {
        if (error.response?.status === 401 && token) {
          console.log('Unauthorized request, clearing token');
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          toast.error('Session expired. Please log in again.');
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [token]);

  // Login function
  const login = async (emailOrPhone: string, password: string) => {
    try {
      console.log('AuthContext: Attempting login with:', { emailOrPhone, password: '***' });
      console.log('AuthContext: API base URL:', axios.defaults.baseURL);
      
      // Determine if the input is email or phone
      const isEmail = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(emailOrPhone);
      const loginData = isEmail 
        ? { email: emailOrPhone, password }
        : { phone: emailOrPhone, password };
      
      const response = await axios.post('/auth/login', loginData);
      console.log('AuthContext: Login response:', response.data);
      
      const { user: userData, token: newToken } = response.data.data;
      
      setUser(userData);
      setToken(newToken);
      localStorage.setItem('token', newToken);
      
      toast.success('Login successful!');
    } catch (error: any) {
      console.error('AuthContext: Login error:', error);
      console.error('AuthContext: Error response:', error.response?.data);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  // Register function
  const register = async (userData: RegisterData) => {
    try {
      const response = await axios.post('/auth/register', userData);
      const { user: newUser, token: newToken } = response.data.data;
      
      setUser(newUser);
      setToken(newToken);
      localStorage.setItem('token', newToken);
      
      toast.success('Registration successful!');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    toast.success('Logged out successfully');
  };

  // Update profile function
  const updateProfile = async (userData: Partial<User>) => {
    try {
      const response = await axios.put('/auth/profile', userData);
      setUser(response.data.data.user);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      throw new Error(message);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    updateProfile,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
