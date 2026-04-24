import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import API from '../api/api';
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

// Log the API base URL for debugging (now initialized in index.tsx)
console.log('[AuthContext] Initialized. process.env.REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

// API instance handles base configuration

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Token logic is now handled by API interceptor in api.ts

  // Load user on mount
  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        console.log('[AuthContext] Loading user profile...');
        const response = await API.get('/auth/profile');
        if (isMounted) {
          setUser(response.data.data.user);
        }
      } catch (error: any) {
        console.error('[AuthContext] Failed to load user:', error);
        if (isMounted) {
          // Only clear session on 401 Unauthorized
          if (error.response?.status === 401) {
            console.warn('[AuthContext] Token invalid or expired, clearing session');
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            toast.error('Session expired. Please log in again.');
          } else {
            // Other errors (500, network) - maybe keep the token but log the error
            console.error('[AuthContext] Non-auth error during profile fetch');
            toast.error('Unable to connect to server. Please check your connection.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadUser();
    return () => { isMounted = false; };
  }, [token]);

  // Add API interceptor for automatic token refresh
  useEffect(() => {
    const interceptor = API.interceptors.response.use(
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
      API.interceptors.response.eject(interceptor);
    };
  }, [token]);

  // Login function
  const login = async (emailOrPhone: string, password: string) => {
    try {
      console.log('AuthContext: Attempting login with:', { emailOrPhone, password: '***' });
      console.log('AuthContext: API base URL:', API.defaults.baseURL);
      
      // Determine if the input is email or phone
      const isEmail = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(emailOrPhone);
      const loginData = isEmail 
        ? { email: emailOrPhone, password }
        : { phone: emailOrPhone, password };
      
      const response = await API.post('/auth/login', loginData);
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
      console.log('AuthContext: Attempting registration with:', { ...userData, password: '***' });
      console.log('AuthContext: API base URL:', API.defaults.baseURL);
      console.log('AuthContext: Making POST request to:', '/auth/register');
      
      const response = await API.post('/auth/register', userData);
      console.log('AuthContext: Registration response:', response.data);
      
      // Do not automatically set user and token anymore.
      // The user needs to verify their email before logging in.
      
      toast.success('Registration successful! Please check your email.');
      return response.data;
    } catch (error: any) {
      console.error('AuthContext: Registration error:', error);
      console.error('AuthContext: Error response:', error.response?.data);
      console.error('AuthContext: Error status:', error.response?.status);
      console.error('AuthContext: Error config:', error.config);
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
      const response = await API.put('/auth/profile', userData);
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
