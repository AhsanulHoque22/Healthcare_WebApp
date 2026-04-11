import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../api/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
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
  SparklesIcon,
  ClipboardDocumentCheckIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { generatePrescriptionPdf } from '../services/prescriptionPdfService';
import PrescriptionView from '../components/PrescriptionView';
import MedicineHistory from '../components/MedicineHistory';
import { getDepartmentLabel } from '../utils/departments';
import { calculateAge, formatAge, formatGender } from '../utils/dateUtils';

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
    height?: number;
    weight?: number;
    bloodPressure?: string;
    pulse?: number;
    chronicConditions?: string;
    pastSurgeries?: string;
    familyMedicalHistory?: string;
    smokingStatus?: string;
    alcoholConsumption?: string;
    physicalActivity?: string;
    emergencyContact: string;
    emergencyPhone: string;
    medicalDocuments?: Array<{
      id: string;
      name: string;
      url: string;
      type: string;
      uploadDate: string;
    }>;
    user: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      dateOfBirth?: string;
      gender?: string;
    };
  };
}

interface PrescriptionData {
  id: number;
  appointmentId: number;
  symptoms?: string | any[];
  diagnoses?: string | any[];
  medicines?: string | any[];
  tests?: string | any[];
  suggestions?: string | any;
  createdAt: string;
}

const MedicalRecords: React.FC = () => {
  const { user } = useAuth();
  const [recordTypeFilter, setRecordTypeFilter] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<AppointmentMedicalRecord | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'appointments' | 'medicines'>('summary');
  const [pageLoaded, setPageLoaded] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDownloading, setIsDownloading] = useState<number | null>(null);

  // Get patient ID first
  const { data: patientProfile } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: async () => {
      const response = await API.get('/patients/profile');
      return response.data.data.patient;
    },
    enabled: user?.role === 'patient',
  });

  // Fetch completed appointments as medical records
  const { data: appointments, isLoading } = useQuery<AppointmentMedicalRecord[]>({
    queryKey: ['patient-appointments', patientProfile?.id],
    queryFn: async () => {
      const response = await API.get('/appointments');
      // Filter only completed appointments
      const completedAppointments = response.data.data.appointments.filter((apt: any) => 
        apt.status === 'completed'
      );
      return completedAppointments || [];
    },
    enabled: !!patientProfile?.id,
    refetchInterval: 10000, // Refetch every 10 seconds for dynamic updates
  });

  // Fetch Medical Summary
  const { data: medicalSummary, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['patient-medical-summary', patientProfile?.id],
    queryFn: async () => {
      const response = await API.get(`/patients/${patientProfile.id}/medical-summary`);
      return response.data.data.summary;
    },
    enabled: !!patientProfile?.id,
    refetchInterval: 10000, 
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
      const response = await API.get(`/prescriptions/appointment/${appointment.id}`);
      setPrescriptionData(response.data.data.prescription);
    } catch (error) {
      console.log('No prescription found for this appointment');
      setPrescriptionData(null);
    }
  };

  const handleDownload = async (appointment: AppointmentMedicalRecord | null) => {
    if (!appointment) return;
    setIsDownloading(appointment.id);
    try {
      let prescriptionForPdf: any = null;
      try {
        const response = await API.get(`/prescriptions/appointment/${appointment.id}`);
        prescriptionForPdf = response.data?.data?.prescription || null;
      } catch (fetchError: any) {
        console.warn('[MedicalRecords] No prescription found for appointment:', appointment.id);
      }
      await generatePrescriptionPdf({ prescriptionData: prescriptionForPdf, appointmentData: appointment });
    } catch (error: any) {
      console.error('[MedicalRecords] PDF generation error:', error);
      if (error.message?.toLowerCase().includes('popup')) {
        toast.error('Please allow pop-ups for this site, then try downloading again.');
      } else {
        toast.error('Failed to generate prescription PDF. Please try again.');
      }
    } finally {
      setIsDownloading(null);
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
            <nav className="flex space-x-4">
              <div className="relative group">
                <div className={`absolute inset-0 rounded-xl blur-lg transition-opacity duration-500 ${
                  activeTab === 'summary'
                    ? 'bg-gradient-to-r from-blue-300/40 to-indigo-300/40 opacity-60'
                    : 'bg-gradient-to-r from-gray-200/20 to-blue-200/20 opacity-0 group-hover:opacity-40'
                }`}></div>
                <button
                  onClick={() => setActiveTab('summary')}
                  className={`relative py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center gap-2 hover:scale-105 hover:shadow-md ${
                    activeTab === 'summary'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg animate-pulse'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <ClipboardDocumentCheckIcon className="h-5 w-5" />
                  Medical Summary
                </button>
              </div>
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
        {/* Medical Summary Tab */}
        {activeTab === 'summary' && (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-200/30 to-indigo-200/30 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>
            <div className={`relative bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
              <div className="flex items-center mb-6">
                <div className="relative group mr-2">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-200/40 to-indigo-200/40 rounded-lg blur-sm opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                  <ClipboardDocumentCheckIcon className="relative h-6 w-6 text-blue-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Comprehensive Medical Summary</h3>
                  <p className="text-sm text-gray-600">Aggregated view of your recent medical history</p>
                </div>
              </div>
              
              {isLoadingSummary ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                  <p className="text-gray-600 text-lg">Generating standard medical profile...</p>
                </div>
              ) : medicalSummary ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column - Vitals & General Profile */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-100 shadow-sm">
                      <h4 className="text-md font-bold text-indigo-900 mb-4 flex items-center gap-2 border-b border-indigo-200 pb-2">
                        <HeartIcon className="h-5 w-5 text-indigo-600" /> Vitals & Metrics
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-indigo-500 font-semibold uppercase">Blood Group</p>
                          <p className="font-bold text-indigo-900 text-lg">{medicalSummary.patientInfo.bloodType || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-indigo-500 font-semibold uppercase">Blood Pressure</p>
                          <p className="font-bold text-indigo-900 text-lg">{medicalSummary.patientInfo.bloodPressure || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-indigo-500 font-semibold uppercase">Weight / Height</p>
                          <p className="font-bold text-indigo-900">
                            {medicalSummary.patientInfo.weight ? `${medicalSummary.patientInfo.weight} kg` : '--'} / {medicalSummary.patientInfo.height ? `${medicalSummary.patientInfo.height} cm` : '--'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-indigo-500 font-semibold uppercase">Pulse</p>
                          <p className="font-bold text-indigo-900">{medicalSummary.patientInfo.pulse ? `${medicalSummary.patientInfo.pulse} bpm` : '—'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                      <h4 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                        <ExclamationTriangleIcon className="h-5 w-5 text-amber-500" /> Allergies & Conditions
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <span className="text-xs font-semibold text-gray-500 uppercase">Allergies</span>
                          <p className="text-sm text-gray-800">{medicalSummary.patientInfo.allergies || 'None reported'}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-500 uppercase">Chronic Conditions</span>
                          <p className="text-sm text-gray-800">{medicalSummary.patientInfo.chronicConditions || 'None reported'}</p>
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-gray-500 uppercase">Past Surgeries</span>
                          <p className="text-sm text-gray-800">{medicalSummary.patientInfo.pastSurgeries || 'None reported'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Diagnoses, Lab Reports & Medicines */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Diagnoses and Symptoms */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                      <h4 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                        <ClipboardDocumentListIcon className="h-5 w-5 text-emerald-600" /> Recent Medical Findings
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-sm font-semibold text-emerald-700 mb-2">Diagnoses</h5>
                          {medicalSummary.summarizedDiagnoses && medicalSummary.summarizedDiagnoses.length > 0 ? (
                            <ul className="space-y-2">
                              {medicalSummary.summarizedDiagnoses.map((diag: any, idx: number) => (
                                <li key={idx} className="bg-emerald-50 text-emerald-800 px-3 py-2 rounded-lg text-sm flex justify-between items-center">
                                  <span>{diag.condition}</span>
                                  <span className="text-xs text-emerald-600/70">{new Date(diag.date).toLocaleDateString()}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No recent diagnoses found.</p>
                          )}
                        </div>
                        <div>
                          <h5 className="text-sm font-semibold text-emerald-700 mb-2">Symptoms Reported</h5>
                          {medicalSummary.recentSymptoms && medicalSummary.recentSymptoms.length > 0 ? (
                            <ul className="space-y-2">
                              {medicalSummary.recentSymptoms.map((symp: any, idx: number) => (
                                <li key={idx} className="text-sm text-gray-700 border-l-2 border-emerald-300 pl-2 py-1">
                                  {symp.symptom} <span className="text-xs text-gray-400 ml-1">({new Date(symp.date).toLocaleDateString()})</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No recent symptoms reported.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Medications */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                      <h4 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                        <FireIcon className="h-5 w-5 text-orange-500" /> Active Prescribed Medications
                      </h4>
                      {medicalSummary.recentMedications && medicalSummary.recentMedications.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {medicalSummary.recentMedications.map((med: any, idx: number) => (
                            <div key={idx} className="bg-orange-50 border border-orange-100 p-3 rounded-lg">
                              <p className="font-semibold text-orange-900 text-sm">{med.name || med}</p>
                              {med.dosage && <p className="text-xs text-orange-700 mt-1">{med.dosage} ({med.duration})</p>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">
                           {medicalSummary.patientInfo.profileCurrentMedications || 'No active medications found in recent prescriptions.'}
                        </p>
                      )}
                    </div>

                    {/* Recent Lab Reports */}
                    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                      <h4 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-200 pb-2">
                        <BeakerIcon className="h-5 w-5 text-purple-600" /> Recent Laboratory Tests
                      </h4>
                      {medicalSummary.recentLabResults && medicalSummary.recentLabResults.length > 0 ? (
                        <div className="space-y-3">
                          {medicalSummary.recentLabResults.map((lab: any, idx: number) => (
                            <div key={idx} className="flex justify-between items-center bg-gray-50 border border-gray-200 p-3 rounded-lg">
                              <div>
                                <span className="font-semibold text-sm text-gray-800">Order #{lab.orderId}</span>
                                <span className="text-xs text-gray-500 block">{new Date(lab.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex gap-2">
                                {lab.reports && lab.reports.length > 0 ? (
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">
                                    {lab.reports.length} Reports Ready
                                  </span>
                                ) : (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">Processing</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No recent lab tests found.</p>
                      )}
                    </div>
                  </div>

                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Tab Content - Appointments */}
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
                      <label className="text-sm font-medium text-gray-500">Age / Sex</label>
                      <p className="text-gray-900">
                        {formatAge(calculateAge(selectedRecord.patient?.user?.dateOfBirth))} / {formatGender(selectedRecord.patient?.user?.gender)}
                      </p>
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
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900 border-b pb-2">Medical Information</h3>
                  
                  {/* Vitals Section */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                      <label className="text-xs font-bold text-blue-600 uppercase tracking-wider">Height</label>
                      <p className="text-lg font-bold text-blue-900">{selectedRecord.patient?.height ? `${selectedRecord.patient.height} cm` : '—'}</p>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                      <label className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Weight</label>
                      <p className="text-lg font-bold text-emerald-900">{selectedRecord.patient?.weight ? `${selectedRecord.patient.weight} kg` : '—'}</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                      <label className="text-xs font-bold text-purple-600 uppercase tracking-wider">Blood Pressure</label>
                      <p className="text-lg font-bold text-purple-900">{selectedRecord.patient?.bloodPressure || '—'}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                      <label className="text-xs font-bold text-red-600 uppercase tracking-wider">Pulse</label>
                      <p className="text-lg font-bold text-red-900">{selectedRecord.patient?.pulse ? `${selectedRecord.patient.pulse} bpm` : '—'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-bold text-gray-500 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                          Allergies
                        </label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1">
                          {selectedRecord.patient?.allergies || 'None reported'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-500 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          Current Medications
                        </label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1">
                          {selectedRecord.patient?.currentMedications || 'None reported'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-500 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                          Chronic Conditions
                        </label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1">
                          {selectedRecord.patient?.chronicConditions || 'None reported'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-bold text-gray-500 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                          Smoking Status
                        </label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1">
                          {selectedRecord.patient?.smokingStatus || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-500 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                          Alcohol Consumption
                        </label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1">
                          {selectedRecord.patient?.alcoholConsumption || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-bold text-gray-500 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                          Physical Activity
                        </label>
                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1">
                          {selectedRecord.patient?.physicalActivity || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-bold text-gray-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        Medical History / Past Surgeries
                      </label>
                      <div className="text-gray-900 bg-gray-50 p-4 rounded-lg border border-gray-100 mt-1 space-y-2">
                        {selectedRecord.patient?.medicalHistory && (
                          <div>
                            <span className="text-xs font-bold text-gray-400 uppercase">History:</span>
                            <p>{selectedRecord.patient.medicalHistory}</p>
                          </div>
                        )}
                        {selectedRecord.patient?.pastSurgeries && (
                          <div>
                            <span className="text-xs font-bold text-gray-400 uppercase">Surgeries:</span>
                            <p>{selectedRecord.patient.pastSurgeries}</p>
                          </div>
                        )}
                        {!selectedRecord.patient?.medicalHistory && !selectedRecord.patient?.pastSurgeries && (
                          <p>None reported</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                        Family Medical History
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-1">
                        {selectedRecord.patient?.familyMedicalHistory || 'None reported'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Patient Uploaded Medical Documents */}
                {selectedRecord.patient?.medicalDocuments && selectedRecord.patient.medicalDocuments.length > 0 && (
                  <div className="col-span-full space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Uploaded Documents</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedRecord.patient.medicalDocuments.map((doc: any, idx: number) => (
                        <div key={doc.id || idx} className="bg-white/50 rounded-lg p-4 flex items-center justify-between border border-blue-100 hover:shadow-md transition-all">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg shrink-0">
                              <DocumentTextIcon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">{doc.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  {doc.type}
                                </span>
                              </div>
                            </div>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0 ml-4"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
