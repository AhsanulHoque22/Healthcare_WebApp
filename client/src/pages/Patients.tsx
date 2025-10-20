import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  UserGroupIcon, 
  EyeIcon, 
  CalendarIcon,
  DocumentTextIcon,
  PhoneIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  UserIcon,
  ClockIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  PencilIcon,
  StarIcon,
  ShieldCheckIcon,
  HomeIcon,
  IdentificationIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import PrescriptionView from '../components/PrescriptionView';
import { getDepartmentLabel } from '../utils/departments';
import jsPDF from 'jspdf';

interface Patient {
  id: number;
  bloodType: string;
  allergies: string;
  emergencyContact: string;
  emergencyPhone: string;
  insuranceProvider: string;
  insuranceNumber: string;
  medicalHistory: string;
  currentMedications: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    address: string;
  };
  appointments: Array<{
    id: number;
    appointmentDate: string;
    status: string;
  }>;
}

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

const Patients: React.FC = () => {
  const { user } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showMedicalRecords, setShowMedicalRecords] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AppointmentMedicalRecord | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null);
  const [showRecordDetail, setShowRecordDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageLoaded, setPageLoaded] = useState(false);

  // Get doctor ID first, then fetch patients
  const { data: doctorProfile } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: async () => {
      const response = await axios.get('/doctors/profile');
      return response.data.data.doctor;
    },
    enabled: user?.role === 'doctor',
  });

  const { data: patients, isLoading, error } = useQuery<Patient[]>({
    queryKey: ['doctor-patients', doctorProfile?.id],
    queryFn: async () => {
      const response = await axios.get(`/doctors/${doctorProfile?.id}/patients`);
      return response.data.data.patients;
    },
    enabled: !!doctorProfile?.id,
  });

  // Filter patients based on search term
  const filteredPatients = patients?.filter((patient) => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${patient.user.firstName || ''} ${patient.user.lastName || ''}`.toLowerCase();
    const email = (patient.user.email || '').toLowerCase();
    const phone = (patient.user.phone || '').toLowerCase();
    
    return (
      fullName.includes(searchLower) ||
      email.includes(searchLower) ||
      phone.includes(searchLower)
    );
  }) || [];

  // Page load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: medicalRecords, isLoading: recordsLoading } = useQuery<AppointmentMedicalRecord[]>({
    queryKey: ['patient-appointments', selectedPatient?.id],
    queryFn: async () => {
      const response = await axios.get(`/patients/${selectedPatient?.id}/appointments`);
      // Filter only completed appointments
      const completedAppointments = response.data.data.appointments.filter((apt: any) => 
        apt.status === 'completed'
      );
      return completedAppointments || [];
    },
    enabled: !!selectedPatient?.id && showMedicalRecords,
  });

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientModal(true);
  };

  const handleViewMedicalRecords = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowMedicalRecords(true);
  };

  const handleViewRecordDetails = async (appointment: AppointmentMedicalRecord) => {
    setSelectedRecord(appointment);
    setShowRecordDetail(true);
    
    // Fetch prescription data if available
    try {
      const response = await axios.get(`/prescriptions/appointment/${appointment.id}`);
      setPrescriptionData(response.data.data.prescription);
    } catch (error) {
      console.log('No prescription found for this appointment');
      setPrescriptionData(null);
    }
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

  const handleDownloadRecord = (appointment: AppointmentMedicalRecord) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('MEDICAL RECORD', 105, 20, { align: 'center' });
    
    // Line under header
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);
    
    let yPos = 35;
    
    // Patient Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Information:', 20, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${selectedPatient?.user.firstName} ${selectedPatient?.user.lastName}`, 20, yPos);
    yPos += 5;
    doc.text(`Email: ${selectedPatient?.user.email}`, 20, yPos);
    yPos += 5;
    doc.text(`Phone: ${selectedPatient?.user.phone || 'Not provided'}`, 20, yPos);
    yPos += 5;
    doc.text(`Blood Type: ${selectedPatient?.bloodType || 'Not provided'}`, 20, yPos);
    yPos += 10;
    
    // Appointment Information
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.text('Appointment Information:', 20, yPos);
    yPos += 7;
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
    
    // Medical Details
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
    
    // Diagnosis and Notes
    if (appointment.diagnosis || appointment.notes) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      if (appointment.notes) {
        doc.setFont('helvetica', 'bold');
        doc.text('Doctor\'s Notes:', 20, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        const notesLines = doc.splitTextToSize(appointment.notes, 170);
        doc.text(notesLines, 20, yPos);
        yPos += notesLines.length * 5 + 5;
      }
      
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
    const fileName = `medical-record-${selectedPatient?.user.firstName}-${selectedPatient?.user.lastName}-${appointment.id}-${new Date(appointment.appointmentDate).toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="space-y-8 p-6">
          {/* Modern Header */}
          <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white shadow-2xl ${pageLoaded ? 'animate-fade-in-down' : ''}`}>
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight mb-2">
                    My Patients 👥
                  </h1>
                  <p className="text-indigo-100 text-lg">
                    View and manage your patient list with comprehensive medical records.
                  </p>
                </div>
                <div className="hidden md:block">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
                    <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center relative">
                      <UserGroupIcon className="h-8 w-8 text-white" />
                      <SparklesIcon className="h-4 w-4 text-white/70 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">
                      {patients ? `${searchTerm ? filteredPatients.length : patients.length} ${searchTerm ? 'filtered ' : ''}patients` : 'Loading...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          </div>

          {/* Search Bar */}
          <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 ${pageLoaded ? 'animate-fade-in' : ''}`}>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-600" />
              </div>
              <input
                type="text"
                placeholder="Search patients by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500 transition-all duration-300 hover:shadow-md focus:shadow-lg"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-all duration-300 hover:scale-110"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="mt-3 text-sm text-gray-600">
                {filteredPatients.length > 0 ? (
                  <span className="text-emerald-600 font-medium">
                    {filteredPatients.length} patient{filteredPatients.length !== 1 ? 's' : ''} found
                  </span>
                ) : (
                  <span className="text-amber-600">
                    No patients found matching "{searchTerm}"
                  </span>
                )}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${pageLoaded ? 'animate-fade-in' : ''}`}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 animate-pulse">
                  <div className="flex items-center mb-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full mr-4"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                    <div className="h-8 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 text-center ${pageLoaded ? 'animate-fade-in' : ''}`}>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-gray-600 text-lg">Unable to load patients. Please try again later.</p>
            </div>
          ) : !patients || patients.length === 0 ? (
            <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 text-center ${pageLoaded ? 'animate-fade-in' : ''}`}>
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 text-lg">No patients found.</p>
              <p className="text-gray-500 text-sm mt-2">Patients will appear here once they book appointments with you.</p>
            </div>
          ) : filteredPatients.length === 0 && searchTerm ? (
            <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 text-center ${pageLoaded ? 'animate-fade-in' : ''}`}>
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlassIcon className="h-8 w-8 text-amber-600" />
              </div>
              <p className="text-gray-600 text-lg">No patients found matching "{searchTerm}"</p>
              <p className="text-gray-500 text-sm mt-2">Try searching with a different term or clear the search.</p>
            </div>
          ) : (
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
              {filteredPatients.map((patient, index) => (
                <div
                  key={patient.id}
                  className="relative group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-200/20 to-purple-200/20 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                  <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-2">
                  <div className="flex items-center mb-6">
                    <div className="flex-shrink-0">
                      <div className="h-14 w-14 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <UserIcon className="h-7 w-7 text-white" />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors duration-200">
                        {patient.user.firstName} {patient.user.lastName}
                      </h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <span className="w-1 h-1 bg-emerald-400 rounded-full"></span>
                        {patient.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {patient.user.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <PhoneIcon className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{patient.user.phone}</span>
                      </div>
                    )}
                    {patient.bloodType && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <HeartIcon className="h-4 w-4 text-red-500" />
                        <span className="font-medium">Blood Type: {patient.bloodType}</span>
                      </div>
                    )}
                    {patient.allergies && (
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 mt-0.5" />
                        <span className="font-medium">Allergies: {patient.allergies.length > 30 ? `${patient.allergies.substring(0, 30)}...` : patient.allergies}</span>
                      </div>
                    )}
                    {patient.emergencyContact && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <ShieldCheckIcon className="h-4 w-4 text-emerald-500" />
                        <span className="font-medium">Emergency: {patient.emergencyContact}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleViewPatient(patient)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm py-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 hover:scale-105 hover:shadow-lg font-medium flex items-center justify-center gap-2 animate-pulse"
                    >
                      <EyeIcon className="h-4 w-4" />
                      View Details
                    </button>
                    <button
                      onClick={() => handleViewMedicalRecords(patient)}
                      className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-sm rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-300 hover:scale-105 hover:shadow-lg font-medium flex items-center gap-2 animate-bounce"
                    >
                      <DocumentTextIcon className="h-4 w-4" />
                      Records
                    </button>
                  </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Patient Details Modal */}
        {showPatientModal && selectedPatient && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <UserIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        {selectedPatient.user.firstName} {selectedPatient.user.lastName}
                      </h2>
                      <p className="text-gray-600 text-lg">Patient Details</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPatientModal(false)}
                    className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-md"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Personal Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-3 text-white mr-3">
                        <UserIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Personal Information</h3>
                        <p className="text-sm text-gray-600">Basic patient details</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-blue-800">Full Name</label>
                        <p className="text-gray-900 font-medium text-lg">{selectedPatient.user.firstName} {selectedPatient.user.lastName}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-blue-800">Email</label>
                        <p className="text-gray-900 font-medium">{selectedPatient.user.email}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-blue-800">Phone</label>
                        <p className="text-gray-900 font-medium">{selectedPatient.user.phone || 'Not provided'}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-blue-800">Date of Birth</label>
                        <p className="text-gray-900 font-medium">{selectedPatient.user.dateOfBirth || 'Not provided'}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-blue-800">Gender</label>
                        <p className="text-gray-900 font-medium capitalize">{selectedPatient.user.gender || 'Not provided'}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-blue-800">Address</label>
                        <p className="text-gray-900 font-medium">{selectedPatient.user.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Medical Information */}
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200/50">
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg p-3 text-white mr-3">
                        <HeartIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Medical Information</h3>
                        <p className="text-sm text-gray-600">Health and medical details</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-emerald-800">Blood Type</label>
                        <p className="text-gray-900 font-medium">{selectedPatient.bloodType || 'Not provided'}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-emerald-800">Allergies</label>
                        <p className="text-gray-900 font-medium">{selectedPatient.allergies || 'None reported'}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-emerald-800">Current Medications</label>
                        <p className="text-gray-900 font-medium">{selectedPatient.currentMedications || 'None reported'}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-emerald-800">Medical History</label>
                        <p className="text-gray-900 font-medium">{selectedPatient.medicalHistory || 'None reported'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200/50">
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg p-3 text-white mr-3">
                        <ExclamationTriangleIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Emergency Contact</h3>
                        <p className="text-sm text-gray-600">Emergency contact details</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-amber-800">Contact Name</label>
                        <p className="text-gray-900 font-medium">{selectedPatient.emergencyContact || 'Not provided'}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-amber-800">Contact Phone</label>
                        <p className="text-gray-900 font-medium">{selectedPatient.emergencyPhone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Insurance Information */}
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-200/50">
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg p-3 text-white mr-3">
                        <DocumentTextIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Insurance Information</h3>
                        <p className="text-sm text-gray-600">Insurance and coverage details</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-purple-800">Insurance Provider</label>
                        <p className="text-gray-900 font-medium">{selectedPatient.insuranceProvider || 'Not provided'}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-4">
                        <label className="text-sm font-semibold text-purple-800">Insurance Number</label>
                        <p className="text-gray-900 font-medium">{selectedPatient.insuranceNumber || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Appointments */}
                {selectedPatient.appointments && selectedPatient.appointments.length > 0 && (
                  <div className="mt-8">
                    <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-200/50">
                      <div className="flex items-center mb-6">
                        <div className="bg-gradient-to-r from-indigo-500 to-blue-500 rounded-lg p-3 text-white mr-3">
                          <CalendarIcon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">Recent Appointments</h3>
                          <p className="text-sm text-gray-600">Appointment history</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {selectedPatient.appointments.map((appointment) => (
                          <div key={appointment.id} className="flex justify-between items-center p-4 bg-white/70 rounded-xl border border-indigo-200/50 hover:shadow-md transition-all duration-200">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {new Date(appointment.appointmentDate).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              appointment.status === 'completed' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' :
                              appointment.status === 'scheduled' ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200' :
                              appointment.status === 'cancelled' ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200' :
                              'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200'
                            }`}>
                              {appointment.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setShowPatientModal(false);
                      handleViewMedicalRecords(selectedPatient);
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-lg font-medium flex items-center gap-2 animate-pulse"
                  >
                    <DocumentTextIcon className="h-5 w-5" />
                    View Medical Records
                  </button>
                  <button
                    onClick={() => setShowPatientModal(false)}
                    className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-lg font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Medical Records Modal */}
        {showMedicalRecords && selectedPatient && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <DocumentTextIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        {selectedPatient.user.firstName} {selectedPatient.user.lastName}
                      </h2>
                      <p className="text-gray-600 text-lg">Medical Records</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowMedicalRecords(false)}
                    className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-md"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {recordsLoading ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                      <DocumentTextIcon className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-gray-600 text-lg">Loading medical records...</p>
                  </div>
                ) : medicalRecords && medicalRecords.length > 0 ? (
                  <div className="space-y-6">
                    {medicalRecords.map((appointment) => (
                      <div key={appointment.id} className="bg-gradient-to-r from-white to-emerald-50 rounded-2xl p-6 border border-emerald-200/50 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getAppointmentTypeColor(appointment.type)}`}>
                                {getAppointmentTypeLabel(appointment.type)}
                              </span>
                              <span className="text-sm text-gray-600 font-medium">
                                {new Date(appointment.appointmentDate).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                              <span className="text-sm text-gray-600 font-medium">
                                Serial #{appointment.serialNumber}
                              </span>
                            </div>
                            <h4 className="font-bold text-gray-900 text-lg mb-2">
                              Dr. {appointment.doctor.user.firstName} {appointment.doctor.user.lastName}
                            </h4>
                            <p className="text-sm text-gray-600 flex items-center gap-2 mb-3">
                              <ClockIcon className="h-4 w-4 text-emerald-500" />
                              {appointment.appointmentTime} • {getDepartmentLabel(appointment.doctor.department)}
                            </p>
                            {appointment.reason && (
                              <div className="bg-white/70 rounded-xl p-3 mb-2">
                                <p className="text-sm text-gray-700">
                                  <span className="font-semibold text-emerald-800">Reason:</span> {appointment.reason.length > 100 ? `${appointment.reason.substring(0, 100)}...` : appointment.reason}
                                </p>
                              </div>
                            )}
                            {appointment.diagnosis && (
                              <div className="bg-white/70 rounded-xl p-3 mb-2">
                                <p className="text-sm text-gray-700">
                                  <span className="font-semibold text-emerald-800">Diagnosis:</span> {appointment.diagnosis.length > 100 ? `${appointment.diagnosis.substring(0, 100)}...` : appointment.diagnosis}
                                </p>
                              </div>
                            )}
                            {appointment.startedAt && appointment.completedAt && (
                              <div className="bg-gradient-to-r from-emerald-100 to-green-100 rounded-xl p-3">
                                <p className="text-sm text-emerald-800 font-semibold">
                                  <span className="font-semibold">Duration:</span> {(() => {
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
                          <div className="flex gap-2 ml-6">
                            <button
                              onClick={() => handleViewRecordDetails(appointment)}
                              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 text-sm px-4 py-2 rounded-xl hover:bg-emerald-50 transition-all duration-300 font-medium hover:scale-110 hover:shadow-md animate-pulse"
                            >
                              <EyeIcon className="h-4 w-4" />
                              View Details
                            </button>
                            <button
                              onClick={() => handleDownloadRecord(appointment)}
                              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-all duration-300 font-medium hover:scale-110 hover:shadow-md animate-bounce"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 text-lg">No completed appointments found for this patient.</p>
                    <p className="text-gray-500 text-sm mt-2">
                      Medical records will appear here after completed appointments.
                    </p>
                  </div>
                )}

                <div className="mt-8 flex justify-end">
                  <button
                    onClick={() => setShowMedicalRecords(false)}
                    className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-lg font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Record View Modal */}
        {showRecordDetail && selectedRecord && selectedPatient && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <DocumentTextIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        Medical Record Details
                      </h2>
                      <p className="text-gray-600 text-lg">Complete appointment information</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRecordDetail(false)}
                    className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-md"
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
                          {selectedPatient.user.firstName} {selectedPatient.user.lastName}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email</label>
                        <p className="text-gray-900">{selectedPatient.user.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Phone</label>
                        <p className="text-gray-900">{selectedPatient.user.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Blood Type</label>
                        <p className="text-gray-900">{selectedPatient.bloodType || 'Not provided'}</p>
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
                          {getDepartmentLabel(selectedRecord.doctor?.department) || 'General Medicine'}
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
                        <p className="text-gray-900">{selectedPatient.allergies || 'None reported'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Current Medications</label>
                        <p className="text-gray-900">{selectedPatient.currentMedications || 'None reported'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Medical History</label>
                        <p className="text-gray-900">{selectedPatient.medicalHistory || 'None reported'}</p>
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
                        <p className="text-gray-900">{selectedPatient.emergencyContact || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                        <p className="text-gray-900">{selectedPatient.emergencyPhone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-4">
                  <button
                    onClick={() => handleDownloadRecord(selectedRecord)}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-lg font-medium flex items-center gap-2 animate-bounce"
                  >
                    <ArrowDownTrayIcon className="h-5 w-5" />
                    Download Record
                  </button>
                  <button
                    onClick={() => setShowRecordDetail(false)}
                    className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-lg font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Patients;