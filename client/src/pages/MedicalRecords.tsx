import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  DocumentTextIcon, 
  EyeIcon, 
  ArrowDownTrayIcon,
  XMarkIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  FunnelIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';
import PrescriptionView from '../components/PrescriptionView';
import MedicineHistory from '../components/MedicineHistory';
import { getDepartmentLabel } from '../utils/departments';

interface AppointmentMedicalRecord {
  id: number;
  appointmentDate: string;
  appointmentTime: string;
  serialNumber: number;
  type: string;
  status: string;
  reason: string;
  symptoms: string;
  notes: string;
  diagnosis: string;
  prescription: string;
  startedAt: string;
  completedAt: string;
  doctor: {
    id: number;
    department: string;
    experience: number;
    bmdcRegistrationNumber: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  patient: {
    id: number;
    bloodType: string;
    allergies: string;
    medicalHistory: string;
    currentMedications: string;
    emergencyContact: string;
    emergencyPhone: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    };
  };
}

interface PrescriptionData {
  id: number;
  appointmentId: number;
  medicines: Array<{
    name: string;
    dosage: string;
    schedule: string;
    instructions?: string;
  }>;
  tests: Array<{
    name: string;
    status: string;
    result?: string;
  }>;
  recommendations: string;
  exercises: string;
  followUpInstructions: string;
  emergencyInstructions: string;
  createdAt: string;
}

const MedicalRecords: React.FC = () => {
  const { user } = useAuth();
  const [recordTypeFilter, setRecordTypeFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<AppointmentMedicalRecord | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'appointments' | 'medicines'>('appointments');
  const [pageLoaded, setPageLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Get patient ID first
  const { data: patientProfile } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: async () => {
      const response = await axios.get('/patients/profile');
      return response.data.data.patient;
    },
    enabled: user?.role === 'patient',
  });

  // Fetch completed appointments as medical records
  const { data: appointments, isLoading } = useQuery<AppointmentMedicalRecord[]>({
    queryKey: ['patient-appointments', patientProfile?.id],
    queryFn: async () => {
      const response = await axios.get('/appointments');
      // Filter only completed appointments
      const completedAppointments = response.data.data.appointments.filter((apt: any) => 
        apt.status === 'completed'
      );
      return completedAppointments || [];
    },
    enabled: !!patientProfile?.id,
    refetchInterval: 10000, // Refetch every 10 seconds for dynamic updates
  });

  // Filter appointments based on selected filter
  const filteredAppointments = appointments?.filter((apt) => {
    if (recordTypeFilter === 'all') return true;
    if (recordTypeFilter === 'consultation') return apt.type === 'in_person' || apt.type === 'telemedicine';
    if (recordTypeFilter === 'follow_up') return apt.type === 'follow_up';
    return true;
  }) || [];

  // Page load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleViewDetails = async (appointment: AppointmentMedicalRecord) => {
    setSelectedRecord(appointment);
    setShowDetailModal(true);
    
    // Fetch prescription data if available
    try {
      const response = await axios.get(`/prescriptions/appointment/${appointment.id}`);
      setPrescriptionData(response.data.data.prescription);
    } catch (error) {
      console.log('No prescription found for this appointment');
      setPrescriptionData(null);
    }
  };

  const handleDownload = (appointment: AppointmentMedicalRecord) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('MEDICAL RECORD', 105, 20, { align: 'center' });
    
    // Line under header
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    
    let yPos = 35;
    
    // Appointment Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Appointment Information:', 20, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date(appointment.appointmentDate).toLocaleDateString()}`, 20, yPos);
    yPos += 5;
    doc.text(`Time: ${appointment.appointmentTime}`, 20, yPos);
    yPos += 5;
    doc.text(`Serial #: ${appointment.serialNumber}`, 20, yPos);
    yPos += 5;
    doc.text(`Type: ${appointment.type.replace('_', ' ').toUpperCase()}`, 20, yPos);
    yPos += 5;
    doc.text(`Doctor: Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`, 20, yPos);
    yPos += 5;
    doc.text(`Department: ${getDepartmentLabel(appointment.doctor.department)}`, 20, yPos);
    yPos += 10;
    
    // Patient Information
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Information:', 20, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`, 20, yPos);
    yPos += 5;
    doc.text(`Blood Type: ${appointment.patient.bloodType || 'Not provided'}`, 20, yPos);
    yPos += 5;
    doc.text(`Allergies: ${appointment.patient.allergies || 'None reported'}`, 20, yPos);
    yPos += 5;
    doc.text(`Current Medications: ${appointment.patient.currentMedications || 'None reported'}`, 20, yPos);
    yPos += 10;
    
    // Reason and Symptoms
    if (appointment.reason || appointment.symptoms) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text('Appointment Details:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      
      if (appointment.reason) {
        doc.text(`Reason: ${appointment.reason}`, 20, yPos);
        yPos += 5;
      }
      if (appointment.symptoms) {
        const symptomLines = doc.splitTextToSize(`Symptoms: ${appointment.symptoms}`, 170);
        doc.text(symptomLines, 20, yPos);
        yPos += symptomLines.length * 5 + 5;
      }
    }
    
    // Doctor's Notes
    if (appointment.notes) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text('Doctor\'s Notes:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(appointment.notes, 170);
      doc.text(notesLines, 20, yPos);
      yPos += notesLines.length * 5 + 5;
    }
    
    // Diagnosis
    if (appointment.diagnosis) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text('Diagnosis:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      const diagnosisLines = doc.splitTextToSize(appointment.diagnosis, 170);
      doc.text(diagnosisLines, 20, yPos);
      yPos += diagnosisLines.length * 5 + 5;
    }
    
    // Prescription
    if (appointment.prescription) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text('Prescription:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      const prescriptionLines = doc.splitTextToSize(appointment.prescription, 170);
      doc.text(prescriptionLines, 20, yPos);
      yPos += prescriptionLines.length * 5 + 5;
    }
    
    // Appointment Duration
    if (appointment.startedAt && appointment.completedAt) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text('Appointment Duration:', 20, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      const start = new Date(appointment.startedAt);
      const end = new Date(appointment.completedAt);
      const diffMs = end.getTime() - start.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      const duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      doc.text(`Started: ${start.toLocaleString()}`, 20, yPos);
      yPos += 5;
      doc.text(`Completed: ${end.toLocaleString()}`, 20, yPos);
      yPos += 5;
      doc.text(`Duration: ${duration}`, 20, yPos);
      yPos += 5;
    }
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      doc.text('This is a computer-generated medical record', 105, 285, { align: 'center' });
    }
    
    // Save the PDF
    const fileName = `medical-record-${appointment.id}-${new Date(appointment.appointmentDate).toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case 'in_person':
        return 'bg-blue-100 text-blue-800';
      case 'telemedicine':
        return 'bg-green-100 text-green-800';
      case 'follow_up':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAppointmentTypeLabel = (type: string) => {
    switch (type) {
      case 'in_person':
        return 'In Person Consultation';
      case 'telemedicine':
        return 'Telemedicine Consultation';
      case 'follow_up':
        return 'Follow-up Visit';
      default:
        return type.replace('_', ' ').split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-emerald-400/15 to-blue-400/15 rounded-full blur-2xl animate-pulse delay-700"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-gradient-to-tl from-violet-400/15 to-indigo-400/15 rounded-full blur-2xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 space-y-8 p-6">
        {/* Modern Header */}
        <div className={`relative group overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white shadow-2xl transition-all duration-500 hover:shadow-3xl hover:scale-[1.02] ${pageLoaded ? 'animate-fade-in-down' : ''}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-black/5"></div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-500"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center">
                  <div className="relative group mr-3">
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-blue-200/30 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                    <ClipboardDocumentListIcon className="relative h-10 w-10 animate-pulse" />
                  </div>
                  Medical Records
                </h1>
                <p className="text-indigo-100 text-lg">
                  View and manage your medical history and records.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-purple-200/20 rounded-full blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                  <div className="relative w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300 animate-bounce-in">
                    <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center relative">
                      <DocumentTextIcon className="h-8 w-8 text-white" />
                      <SparklesIcon className="h-4 w-4 text-white/70 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
          <div className={`relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1 ${pageLoaded ? 'animate-fade-in' : ''}`}>
            <nav className="flex space-x-8">
              <div className="relative group">
                <div className={`absolute inset-0 rounded-xl blur-lg transition-opacity duration-500 ${
                  activeTab === 'appointments'
                    ? 'bg-gradient-to-r from-indigo-200/40 to-purple-200/40 opacity-60'
                    : 'bg-gradient-to-r from-gray-200/20 to-blue-200/20 opacity-0 group-hover:opacity-40'
                }`}></div>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className={`relative py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 hover:scale-105 hover:shadow-md ${
                    activeTab === 'appointments'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg animate-pulse'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <CalendarIcon className="h-5 w-5" />
                  Appointment History
                </button>
              </div>
              <div className="relative group">
                <div className={`absolute inset-0 rounded-xl blur-lg transition-opacity duration-500 ${
                  activeTab === 'medicines'
                    ? 'bg-gradient-to-r from-emerald-200/40 to-green-200/40 opacity-60'
                    : 'bg-gradient-to-r from-gray-200/20 to-green-200/20 opacity-0 group-hover:opacity-40'
                }`}></div>
                <button
                  onClick={() => setActiveTab('medicines')}
                  className={`relative py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 hover:scale-105 hover:shadow-md ${
                    activeTab === 'medicines'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg animate-bounce'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <BeakerIcon className="h-5 w-5" />
                  Medicine History
                </button>
              </div>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'appointments' && (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className={`relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <div className="relative group mr-2">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/40 to-blue-200/40 rounded-lg blur-sm opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                    <CalendarIcon className="relative h-6 w-6 text-indigo-600 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Appointment History</h3>
                </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <FunnelIcon className="h-5 w-5 text-indigo-600 mr-2" />
                  <select 
                    value={recordTypeFilter}
                    onChange={(e) => setRecordTypeFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm hover:shadow-md hover:scale-105"
                  >
                    <option value="all">All Appointments</option>
                    <option value="consultation">Consultations</option>
                    <option value="follow_up">Follow-up Visits</option>
                  </select>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
                <p className="text-gray-600 text-lg">Loading medical records...</p>
              </div>
            ) : filteredAppointments && filteredAppointments.length > 0 ? (
              <div className="space-y-4">
                {filteredAppointments.map((appointment, index) => (
                  <div
                    key={appointment.id}
                    className="relative group bg-gradient-to-r from-white to-blue-50 rounded-xl p-6 border border-gray-200/50 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] hover:-translate-y-1"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/20 to-purple-200/20 rounded-xl blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                    <div className="relative">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg p-3 text-white">
                            <CalendarIcon className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                appointment.type === 'in_person' ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200' :
                                appointment.type === 'telemedicine' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' :
                                appointment.type === 'follow_up' ? 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-800 border border-purple-200' :
                                'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200'
                              }`}>
                                {getAppointmentTypeLabel(appointment.type)}
                              </span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {new Date(appointment.appointmentDate).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                Serial #{appointment.serialNumber}
                              </span>
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg">
                              Dr. {appointment.doctor.user.firstName} {appointment.doctor.user.lastName}
                            </h4>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <ClockIcon className="h-4 w-4 text-indigo-600" />
                              {appointment.appointmentTime} • {getDepartmentLabel(appointment.doctor.department)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {appointment.reason && (
                            <div className="bg-white/50 rounded-lg p-3">
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold text-gray-900">Reason:</span> {appointment.reason.length > 100 ? `${appointment.reason.substring(0, 100)}...` : appointment.reason}
                              </p>
                            </div>
                          )}
                          {appointment.diagnosis && (
                            <div className="bg-white/50 rounded-lg p-3">
                              <p className="text-sm text-gray-700">
                                <span className="font-semibold text-gray-900">Diagnosis:</span> {appointment.diagnosis.length > 100 ? `${appointment.diagnosis.substring(0, 100)}...` : appointment.diagnosis}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {appointment.startedAt && appointment.completedAt && (
                          <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-3 border border-emerald-200/50">
                            <p className="text-sm text-gray-700 flex items-center gap-2">
                              <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                              <span className="font-semibold text-gray-900">Duration:</span> {(() => {
                                const start = new Date(appointment.startedAt);
                                const end = new Date(appointment.completedAt);
                                const diffMs = end.getTime() - start.getTime();
                                const diffMins = Math.floor(diffMs / 60000);
                                const hours = Math.floor(diffMins / 60);
                                const mins = diffMins % 60;
                                return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                              })()}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <button
                          onClick={() => handleViewDetails(appointment)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-lg animate-pulse"
                        >
                          <EyeIcon className="h-4 w-4" />
                          View Details
                        </button>
                        <button
                          onClick={() => handleDownload(appointment)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-500 to-slate-500 text-white rounded-lg hover:from-gray-600 hover:to-slate-600 transition-all duration-300 hover:scale-110 shadow-sm hover:shadow-lg animate-bounce"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                          Download
                        </button>
                      </div>
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DocumentTextIcon className="h-12 w-12 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed appointments found</h3>
                <p className="text-gray-600">
                  {recordTypeFilter !== 'all' 
                    ? `No ${getAppointmentTypeLabel(recordTypeFilter)} appointments available` 
                    : 'Your medical records will appear here after completed doctor visits'}
                </p>
              </div>
            )}
        </div>
      </div>
      )}

        {/* Medicine History Tab */}
        {activeTab === 'medicines' && patientProfile?.id && (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/30 to-green-200/30 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className={`relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
              <div className="flex items-center mb-6">
                <div className="relative group mr-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-200/40 to-green-200/40 rounded-lg blur-sm opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                  <BeakerIcon className="relative h-6 w-6 text-indigo-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Medicine History</h3>
                <p className="text-sm text-gray-600">Track your medication history and adherence</p>
              </div>
            </div>
            <MedicineHistory patientId={patientProfile.id} />
          </div>
        </div>
        )}


        {/* Modern View Details Modal */}
        {showDetailModal && selectedRecord && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/50">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                    <DocumentTextIcon className="h-6 w-6 mr-2 text-indigo-600" />
                    Medical Record Details
                  </h2>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-all duration-300 p-2 hover:bg-gray-100 rounded-full hover:scale-110 hover:shadow-md"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Patient Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Patient Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-gray-900">
                        {selectedRecord.patient?.user?.firstName} {selectedRecord.patient?.user?.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{selectedRecord.patient?.user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900">{selectedRecord.patient?.user?.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Blood Type</label>
                      <p className="text-gray-900">{selectedRecord.patient?.bloodType || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Appointment Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Appointment Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Date</label>
                      <p className="text-gray-900">
                        {new Date(selectedRecord.appointmentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Time</label>
                      <p className="text-gray-900">{selectedRecord.appointmentTime}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Serial Number</label>
                      <p className="text-gray-900">#{selectedRecord.serialNumber}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Type</label>
                      <p className="text-gray-900 capitalize">{selectedRecord.type.replace('_', ' ')}</p>
                    </div>
                    {selectedRecord.startedAt && selectedRecord.completedAt && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Started At</label>
                          <p className="text-gray-900">
                            {new Date(selectedRecord.startedAt).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Completed At</label>
                          <p className="text-gray-900">
                            {new Date(selectedRecord.completedAt).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Total Duration</label>
                          <p className="text-green-700 font-semibold">
                            {(() => {
                              const start = new Date(selectedRecord.startedAt);
                              const end = new Date(selectedRecord.completedAt);
                              const diffMs = end.getTime() - start.getTime();
                              const diffMins = Math.floor(diffMs / 60000);
                              const hours = Math.floor(diffMins / 60);
                              const mins = diffMins % 60;
                              return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
                            })()}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Doctor Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Doctor Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-gray-900">
                        Dr. {selectedRecord.doctor?.user?.firstName} {selectedRecord.doctor?.user?.lastName}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Department</label>
                      <p className="text-gray-900">
                        {getDepartmentLabel(selectedRecord.doctor?.department || '') || 'General Medicine'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">BMDC Registration</label>
                      <p className="text-gray-900">{selectedRecord.doctor?.bmdcRegistrationNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Experience</label>
                      <p className="text-gray-900">{selectedRecord.doctor?.experience || 0} years</p>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Medical Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Allergies</label>
                      <p className="text-gray-900">{selectedRecord.patient?.allergies || 'None reported'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Current Medications</label>
                      <p className="text-gray-900">{selectedRecord.patient?.currentMedications || 'None reported'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Medical History</label>
                      <p className="text-gray-900">{selectedRecord.patient?.medicalHistory || 'None reported'}</p>
                    </div>
                  </div>
                </div>

                {/* Reason & Symptoms */}
                <div className="col-span-full space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Appointment Reason</h3>
                  <div className="space-y-3">
                    {selectedRecord.reason && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Reason</label>
                        <p className="text-gray-900">{selectedRecord.reason}</p>
                      </div>
                    )}
                    {selectedRecord.symptoms && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Symptoms</label>
                        <p className="text-gray-900">{selectedRecord.symptoms}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Doctor's Notes, Diagnosis & Prescription */}
                <div className="col-span-full space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Medical Details</h3>
                  <div className="space-y-4">
                    {selectedRecord.notes && (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <label className="text-sm font-medium text-green-900">Doctor's Notes</label>
                        <p className="text-green-800 mt-1">{selectedRecord.notes}</p>
                      </div>
                    )}
                    {selectedRecord.diagnosis && (
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <label className="text-sm font-medium text-purple-900">Diagnosis</label>
                        <p className="text-purple-800 mt-1">{selectedRecord.diagnosis}</p>
                      </div>
                    )}
                    {selectedRecord.prescription && (
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <label className="text-sm font-medium text-indigo-900">Prescription</label>
                        <p className="text-indigo-800 mt-1">{selectedRecord.prescription}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prescription Details */}
                {prescriptionData && (
                  <div className="col-span-full">
                    <PrescriptionView 
                      prescriptionData={prescriptionData}
                      appointmentData={selectedRecord}
                      userRole={user?.role}
                    />
                  </div>
                )}

                {/* Emergency Contact */}
                <div className="col-span-full space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact Name</label>
                      <p className="text-gray-900">{selectedRecord.patient?.emergencyContact || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                      <p className="text-gray-900">{selectedRecord.patient?.emergencyPhone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              </div>

                <div className="mt-6 flex justify-end gap-4">
                  <button
                    onClick={() => handleDownload(selectedRecord)}
                    className="px-6 py-3 bg-gradient-to-r from-gray-500 to-slate-500 text-white rounded-xl font-semibold hover:from-gray-600 hover:to-slate-600 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl flex items-center gap-2 animate-bounce"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    Download Record
                  </button>
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-110 shadow-lg hover:shadow-xl animate-pulse"
                  >
                    Close
                  </button>
                </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default MedicalRecords;
