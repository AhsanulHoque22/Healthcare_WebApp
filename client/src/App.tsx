import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import RoleBasedRedirect from './components/RoleBasedRedirect';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import PatientProfile from './pages/PatientProfile';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorProfile from './pages/DoctorProfile';
import AdminDashboard from './pages/AdminDashboard';
import Appointments from './pages/Appointments';
import DoctorAppointments from './pages/DoctorAppointments';
import MedicalRecords from './pages/MedicalRecords';
import Users from './pages/Users';
import Doctors from './pages/Doctors';
import Patients from './pages/Patients';
import AdminDoctors from './pages/AdminDoctors';
import AdminPatients from './pages/AdminPatients';
import AdminRatings from './pages/AdminRatings';
import LabReports from './pages/LabReports';
import AdminLabReports from './pages/AdminLabReports';
import AdminLabTests from './pages/AdminLabTests';
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Legacy dashboard route - redirect to app */}
              <Route path="/dashboard" element={<Navigate to="/app" replace />} />
              
        {/* Protected routes */}
        <Route path="/app" element={
          <ProtectedRoute>
            <NotificationProvider>
              <Layout />
            </NotificationProvider>
          </ProtectedRoute>
        }>
                <Route index element={<RoleBasedRedirect />} />
                
                {/* Patient-only routes */}
                <Route path="dashboard" element={
                  <ProtectedRoute requiredRole="patient">
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="profile" element={
                  <ProtectedRoute requiredRole="patient">
                    <PatientProfile />
                  </ProtectedRoute>
                } />
                <Route path="appointments" element={
                  <ProtectedRoute requiredRole="patient">
                    <Appointments />
                  </ProtectedRoute>
                } />
                <Route path="medical-records" element={
                  <ProtectedRoute requiredRole="patient">
                    <MedicalRecords />
                  </ProtectedRoute>
                } />
                <Route path="lab-reports" element={
                  <ProtectedRoute requiredRole="patient">
                    <LabReports />
                  </ProtectedRoute>
                } />
                
                {/* Doctor-only routes */}
                <Route path="doctor-profile" element={
                  <ProtectedRoute requiredRole="doctor">
                    <DoctorProfile />
                  </ProtectedRoute>
                } />
                <Route path="doctor-dashboard" element={
                  <ProtectedRoute requiredRole="doctor">
                    <DoctorDashboard />
                  </ProtectedRoute>
                } />
                <Route path="doctor-appointments" element={
                  <ProtectedRoute requiredRole="doctor">
                    <DoctorAppointments />
                  </ProtectedRoute>
                } />
                
                {/* Admin-only routes */}
                <Route path="admin-dashboard" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="users" element={
                  <ProtectedRoute requiredRole="admin">
                    <Users />
                  </ProtectedRoute>
                } />
                <Route path="admin-doctors" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDoctors />
                  </ProtectedRoute>
                } />
                <Route path="admin-patients" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminPatients />
                  </ProtectedRoute>
                } />
                <Route path="admin-lab-reports" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLabReports />
                  </ProtectedRoute>
                } />
                <Route path="admin-lab-tests" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminLabTests />
                  </ProtectedRoute>
                } />
                <Route path="admin-ratings" element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminRatings />
                  </ProtectedRoute>
                } />
                
                {/* Patient-facing routes */}
                <Route path="doctors" element={
                  <ProtectedRoute requiredRole="patient">
                    <Doctors />
                  </ProtectedRoute>
                } />
                <Route path="patients" element={
                  <ProtectedRoute requiredRole="doctor">
                    <Patients />
                  </ProtectedRoute>
                } />
              </Route>
              
              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10B981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#EF4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;