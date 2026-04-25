import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../api/api';
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
  SparklesIcon,
  BeakerIcon,
  BellAlertIcon,
  EnvelopeIcon,
  FireIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  FunnelIcon,
  ArrowRightIcon,
  ChevronRightIcon,
  ChartBarIcon,
  ExclamationCircleIcon,
  ArrowPathIcon,
  TagIcon,
  ShieldExclamationIcon,
  ChevronDownIcon,
  PaperAirplaneIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { Reveal } from '../components/landing/AnimatedSection';
import { useAuth } from '../context/AuthContext';
import PrescriptionView from '../components/PrescriptionView';
import { getDepartmentLabel } from '../utils/departments';
import { calculateAge, formatAge } from '../utils/dateUtils';
import jsPDF from 'jspdf';
import { generatePrescriptionPdf } from '../services/prescriptionPdfService';
import toast from 'react-hot-toast';

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
  medicalDocuments: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    uploadDate: string;
  }>;
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
  const queryClient = useQueryClient();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showMedicalRecords, setShowMedicalRecords] = useState(false);
  const [activeRecordsTab, setActiveRecordsTab] = useState<'appointments' | 'labtests' | 'summary'>('appointments');
  const [selectedRecord, setSelectedRecord] = useState<AppointmentMedicalRecord | null>(null);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null);
  const [showRecordDetail, setShowRecordDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageLoaded, setPageLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState<number | null>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertPatient, setAlertPatient] = useState<Patient | null>(null);
  const [alertForm, setAlertForm] = useState({ urgency: 'routine', message: '', action: 'follow_up' });
  const [patientSummaries, setPatientSummaries] = useState<Record<number, any>>({});

  const [searchParams] = useSearchParams();
  const patientIdFromURL = searchParams.get('patientId');
  const viewFromURL = searchParams.get('view');

  // Get doctor ID first, then fetch patients
  const { data: doctorProfile } = useQuery({
    queryKey: ['doctor-profile'],
    queryFn: async () => {
      const response = await API.get('/doctors/profile');
      return response.data.data.doctor;
    },
    enabled: user?.role === 'doctor',
  });

  const { data: patients, isLoading, error } = useQuery<Patient[]>({
    queryKey: ['doctor-patients', doctorProfile?.id],
    queryFn: async () => {
      const response = await API.get(`/doctors/${doctorProfile?.id}/patients`);
      return response.data.data.patients;
    },
    enabled: !!doctorProfile?.id,
  });

  // Fetch medical summaries for all patients to detect criticalities
  useEffect(() => {
    if (patients && patients.length > 0) {
      patients.forEach(async (patient) => {
        try {
          // Always fetch fresh to detect new criticalities
          const res = await API.get(`/patients/${patient.id}/medical-summary`);
          const summary = res.data?.data?.summary;
          if (summary) {
            setPatientSummaries((prev) => ({ ...prev, [patient.id]: summary }));
          }
        } catch (err) {
          // Silently handle — not every patient has summary
        }
      });
    }
  }, [patients]);

  // Medical summary for selected patient (Records modal)
  const { data: selectedPatientSummary, isLoading: summaryLoading } = useQuery<any>({
    queryKey: ['patient-medical-summary', selectedPatient?.id],
    queryFn: async () => {
      const res = await API.get(`/patients/${selectedPatient?.id}/medical-summary`);
      return res.data?.data?.summary;
    },
    enabled: !!selectedPatient?.id && showMedicalRecords && activeRecordsTab === 'summary',
    staleTime: 0, // Always fetch fresh
    refetchOnWindowFocus: true
  });

  // Alert mutation
  const alertMutation = useMutation({
    mutationFn: async (data: { patientId: number; urgency: string; message: string; action: string }) => {
      const res = await API.post(`/doctors/patients/${data.patientId}/alert`, data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Alert sent successfully!');
      setShowAlertModal(false);
      setAlertForm({ urgency: 'routine', message: '', action: 'follow_up' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send alert');
    }
  });

  // Helper to detect criticality from a patient summary
  const getPatientCriticality = (patientId: number): 'Normal' | 'Caution' | 'Critical' | null => {
    const summary = patientSummaries[patientId];
    if (!summary) return null;
    if (summary.llamaClinicalInsight?.overallStatus === 'Critical') return 'Critical';
    if (summary.llamaClinicalInsight?.overallStatus === 'Caution') return 'Caution';
    if (summary.allLabResultsSummary?.criticalCount > 0) return 'Critical';
    if (summary.allLabResultsSummary?.cautionCount > 0) return 'Caution';
    return 'Normal';
  };

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

  // Effect to handle patient selection from URL
  useEffect(() => {
    if (patientIdFromURL && patients && patients.length > 0) {
      const patient = patients.find(p => p.id.toString() === patientIdFromURL);
      if (patient) {
        setSelectedPatient(patient);
        if (viewFromURL === 'records') {
          setShowMedicalRecords(true);
        } else {
          setShowPatientModal(true);
        }
      }
    }
  }, [patientIdFromURL, patients, viewFromURL]);

  // Page load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: medicalRecords, isLoading: medicalRecordsLoading } = useQuery<AppointmentMedicalRecord[]>({
    queryKey: ['patient-appointments', selectedPatient?.id],
    queryFn: async () => {
      const response = await API.get(`/patients/${selectedPatient?.id}/appointments`);
      // Filter only completed appointments
      const completedAppointments = response.data.data.appointments.filter((apt: any) => 
        apt.status === 'completed'
      );
      return completedAppointments || [];
    },
    enabled: !!selectedPatient?.id && showMedicalRecords,
  });

  const { data: labRecords, isLoading: labRecordsLoading } = useQuery<any[]>({
    queryKey: ['patient-lab-reports', selectedPatient?.id],
    queryFn: async () => {
      try {
        const [ordersRes, prescriptionTestsRes] = await Promise.all([
          API.get(`/lab-tests/patients/${selectedPatient?.id}/lab-reports`),
          API.get(`/lab-tests/patients/${selectedPatient?.id}/prescription-lab-tests`)
        ]);
        
        const allTests: any[] = [];
        const completedStatuses = ['completed', 'reported', 'confirmed', 'results_ready'];
        
        if (prescriptionTestsRes.data?.data?.prescriptions) {
          prescriptionTestsRes.data.data.prescriptions.forEach((prescription: any) => {
            if (prescription.parsedTests) {
              prescription.parsedTests.forEach((test: any) => {
                if (completedStatuses.includes(test.status?.toLowerCase())) {
                  allTests.push({
                    ...test,
                    recordType: 'prescription',
                    date: test.takenDate || test.createdAt
                  });
                }
              });
            }
          });
        }
        
        if (ordersRes.data?.data?.orders) {
          ordersRes.data.data.orders.forEach((order: any) => {
            if (completedStatuses.includes(order.status?.toLowerCase())) {
              allTests.push({
                ...order,
                recordType: 'ordered',
                date: order.createdAt
              });
            }
          });
        }
        
        return allTests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } catch (error) {
        console.error("Error fetching lab reports:", error);
        return [];
      }
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
      const response = await API.get(`/prescriptions/appointment/${appointment.id}`);
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

  const handleDownloadRecord = async (appointment: AppointmentMedicalRecord) => {
    setIsDownloading(appointment.id);
    try {
      // 1. Fetch prescription data specifically for this appointment
      let prescriptionForPdf: any = null;
      try {
        const response = await API.get(`/prescriptions/appointment/${appointment.id}`);
        prescriptionForPdf = response.data?.data?.prescription || null;
      } catch (fetchError: any) {
        console.warn('[Patients] No prescription found for appointment:', appointment.id);
      }

      // 2. If it has prescription data, use the high-fidelity PDF 
      if (prescriptionForPdf) {
        await generatePrescriptionPdf({ prescriptionData: prescriptionForPdf, appointmentData: appointment });
        return;
      }

      // 3. FALLBACK: Minimal jsPDF for appointments without formal prescriptions (legacy support)
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
      
      // Prescription string conversion 
      if (appointment.prescription) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.text('Prescription Summary:', 20, yPos);
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
    } catch (error: any) {
      console.error('[Patients] Download error:', error);
      toast.error('Failed to generate record. Please try again.');
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#fafbff] selection:bg-indigo-100 selection:text-indigo-900">
        {/* Dot Grid Pattern Overlay */}
        <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

        <div className="relative z-10 max-w-[1600px] mx-auto px-6 py-12 md:px-14 lg:py-16 space-y-12">
          {/* ═══ PREMIUM HEADER ═══ */}
          <Reveal>
            <div className="relative overflow-hidden rounded-[40px] bg-slate-900 px-8 py-14 md:px-16 text-white shadow-2xl group">
              {/* Background Aurora Mesh Gradients */}
              <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-l from-indigo-500/10 via-transparent to-transparent" />
                <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/15 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px]" />
              </div>
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">Clinical Registry</span>
                    <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-400/20">Staff Portal</span>
                  </div>
                  
                  <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
                    Patient <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 animate-gradient-shift italic">Directory.</span>
                  </h1>
                </div>

                {/* Dashboard Stats in Header */}
                {patients && (
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="px-8 py-6 bg-white/5 backdrop-blur-2xl rounded-[32px] border border-white/10 shadow-2xl transition-transform hover:scale-105">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Registry</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-white">{patients.length}</span>
                        <span className="text-[10px] font-bold text-emerald-400">ACTIVE</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Reveal>

          {/* ═══ REGISTRY FILTER MATRIX ═══ */}
          <Reveal delay={0.2}>
            <div className="bg-white rounded-[24px] border border-slate-100 p-2 shadow-sm flex flex-col lg:flex-row items-center gap-2">
              <div className="w-full lg:w-auto p-4 lg:px-6 lg:border-r border-slate-100 flex items-center gap-3 shrink-0">
                <FunnelIcon className="h-5 w-5 text-indigo-600" />
                <span className="font-black text-xs text-slate-900 uppercase tracking-widest">Filter Matrix</span>
              </div>

              <div className="w-full relative px-2">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Envision patient search by nomenclature, digital handle, or secure tele-com ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-transparent rounded-[20px] text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 focus:border-slate-200 transition-all outline-none"
                />
              </div>

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
                >
                  Reset Registry
                </button>
              )}
            </div>
          </Reveal>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm animate-pulse">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="h-16 w-16 bg-slate-100 rounded-2xl" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-100 rounded-full w-2/3" />
                      <div className="h-3 bg-slate-100 rounded-full w-1/3" />
                    </div>
                  </div>
                  <div className="space-y-4 mb-8">
                    <div className="h-3 bg-slate-50 rounded-full w-full" />
                    <div className="h-3 bg-slate-50 rounded-full w-4/5" />
                  </div>
                  <div className="flex gap-3">
                    <div className="h-12 bg-slate-100 rounded-xl flex-1" />
                    <div className="h-12 bg-slate-100 rounded-xl w-12" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="bg-white rounded-[40px] border border-slate-100 p-20 shadow-sm text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
                <UserGroupIcon className="h-10 w-10 text-slate-200" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Registry Void</h3>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest max-w-xs mx-auto">Zero clinical files detected matching your search parameters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-20">
              <AnimatePresence>
                {filteredPatients.map((patient, index) => (
                  <Reveal key={patient.id} delay={index * 0.05} variant="fadeUp" className="h-full">
                    <div className="group relative bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 overflow-hidden h-full">
                      {/* Hover Backdrop Shine */}
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] via-transparent to-violet-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Criticality Indicator Pill */}
                      {(() => {
                        const criticality = getPatientCriticality(patient.id);
                        if (!criticality || criticality === 'Normal') return null;
                        return (
                          <div className={`absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                            criticality === 'Critical' 
                              ? 'bg-rose-50 border-rose-100 text-rose-600' 
                              : 'bg-amber-50 border-amber-100 text-amber-600'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${criticality === 'Critical' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                            <span className="text-[9px] font-black uppercase tracking-wider">{criticality}</span>
                          </div>
                        )
                      })()}

                      <div className="relative z-10 h-full flex flex-col">
                        {/* Profile Section */}
                        <div className="flex flex-col items-center text-center mb-8">
                          <div className="relative mb-6">
                            <div className="w-20 h-20 bg-slate-900 rounded-[28px] shadow-2xl flex items-center justify-center transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110">
                              <UserIcon className="h-10 w-10 text-white" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-xl shadow-lg flex items-center justify-center border border-slate-100">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            </div>
                          </div>
                          
                          <h3 className="text-xl font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                            {patient.user.firstName} {patient.user.lastName}
                          </h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate w-full px-2">
                             {patient.user.email}
                          </p>
                        </div>

                        {/* Stats Matrix */}
                        <div className="grid grid-cols-2 gap-2 mb-8">
                          <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-50 transition-colors group-hover:bg-white group-hover:border-slate-100">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Blood Registry</p>
                            <p className="text-xs font-black text-slate-900">{patient.bloodType || '—'}</p>
                          </div>
                          <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-50 transition-colors group-hover:bg-white group-hover:border-slate-100">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1">Age / Cycle</p>
                            <p className="text-xs font-black text-slate-900">{formatAge(calculateAge(patient.user.dateOfBirth))}</p>
                          </div>
                        </div>

                        {/* Interactive Actions */}
                        <div className="flex gap-2 mt-auto">
                           <button
                            onClick={() => handleViewPatient(patient)}
                            className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 transition-all hover:bg-indigo-600 active:scale-95 flex items-center justify-center gap-2"
                          >
                             Index
                          </button>
                          <button
                            onClick={() => handleViewMedicalRecords(patient)}
                            className="flex-1 py-4 bg-white border border-slate-100 text-slate-400 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center"
                            title="Clinical Records"
                          >
                            <DocumentTextIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => {
                              setAlertPatient(patient);
                              setShowAlertModal(true);
                            }}
                            className="flex-1 py-4 bg-white border border-slate-100 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 flex items-center justify-center"
                            title="Flash Alert"
                          >
                            <BellAlertIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ═══ PATIENT DETAILS MODAL ═══ */}
        <AnimatePresence>
          {showPatientModal && selectedPatient && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPatientModal(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[40px] shadow-2xl border border-white/20 overflow-hidden flex flex-col"
              >
                {/* Header Section */}
                <div className="p-8 md:p-12 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-slate-900 rounded-[28px] flex items-center justify-center shadow-2xl">
                      <UserIcon className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">Patient File</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Verified Registry</span>
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                        {selectedPatient.user.firstName} {selectedPatient.user.lastName}
                      </h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowPatientModal(false)}
                    className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Personal Registry */}
                    <div className="space-y-8">
                      <div className="flex items-center gap-3 border-l-4 border-indigo-500 pl-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Personal Identification</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: 'Tele-ID / Email', value: selectedPatient.user.email, icon: EnvelopeIcon },
                          { label: 'Secure COM', value: selectedPatient.user.phone || 'N/A', icon: PhoneIcon },
                          { label: 'Cycle / Age', value: `${selectedPatient.user.dateOfBirth} (${formatAge(calculateAge(selectedPatient.user.dateOfBirth))})`, icon: CalendarIcon },
                          { label: 'Gender Matrix', value: selectedPatient.user.gender, icon: UserIcon },
                          { label: 'Physical Address', value: selectedPatient.user.address || 'N/A', icon: MapPinIcon, full: true },
                        ].map((item, idx) => (
                          <div key={idx} className={`p-5 bg-slate-50 rounded-[24px] border border-slate-100/50 hover:bg-white hover:shadow-md transition-all ${item.full ? 'md:col-span-2' : ''}`}>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <item.icon className="h-3 w-3" />
                              {item.label}
                            </p>
                            <p className="text-sm font-black text-slate-900">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Clinical Profile */}
                    <div className="space-y-8">
                      <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Biological Registry</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: 'Blood Group', value: selectedPatient.bloodType || 'N/A', icon: BeakerIcon },
                          { label: 'Immunology (Allergies)', value: selectedPatient.allergies || 'N/A', icon: ShieldCheckIcon },
                          { label: 'Pharmaceutical Usage', value: selectedPatient.currentMedications || 'N/A', icon: DocumentTextIcon },
                          { label: 'Clinical History', value: selectedPatient.medicalHistory || 'N/A', icon: ClipboardDocumentListIcon },
                          { label: 'Insurance Proxy', value: `${selectedPatient.insuranceProvider || 'N/A'} - ${selectedPatient.insuranceNumber || ''}`, icon: IdentificationIcon, full: true },
                        ].map((item, idx) => (
                          <div key={idx} className={`p-5 bg-slate-50 rounded-[24px] border border-slate-100/50 hover:bg-white hover:shadow-md transition-all ${item.full ? 'md:col-span-2' : ''}`}>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <item.icon className="h-3 w-3" />
                              {item.label}
                            </p>
                            <p className="text-sm font-black text-slate-900">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Integrated Records Quick-View */}
                    <div className="lg:col-span-2 mt-8 p-10 bg-slate-900 rounded-[32px] text-white overflow-hidden relative group">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] -mr-32 -mt-32" />
                      
                      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                        <div className="max-w-md">
                          <h4 className="text-2xl font-black mb-4">Deep Clinical History</h4>
                          <p className="text-slate-400 text-sm font-bold leading-relaxed mb-8">
                            Access the full encrypted registry of appointments, lab reports, and longitudinal clinical insights for this file.
                          </p>
                          <button
                            onClick={() => {
                              setShowPatientModal(false);
                              handleViewMedicalRecords(selectedPatient);
                            }}
                            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-400 hover:text-white transition-all shadow-xl"
                          >
                            Access Full Records
                            <ArrowRightIcon className="h-4 w-4" />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
                          <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 text-center" title="Encounters">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Encounters</p>
                            <p className="text-3xl font-black">{selectedPatient.appointments?.length || 0}</p>
                          </div>
                          <div className="p-6 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 text-center" title="Documents">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Documents</p>
                            <p className="text-3xl font-black">{selectedPatient.medicalDocuments?.length || 0}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-8 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button
                    onClick={() => setShowPatientModal(false)}
                    className="px-8 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-all border border-slate-100"
                  >
                    Close Index
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ═══ MEDICAL RECORDS MODAL ═══ */}
        <AnimatePresence>
          {showMedicalRecords && selectedPatient && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMedicalRecords(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-[40px] shadow-2xl border border-white/20 overflow-hidden flex flex-col"
              >
                {/* Modal Header */}
                <div className="p-8 md:p-12 border-b border-slate-100 shrink-0">
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 bg-emerald-500 rounded-[28px] flex items-center justify-center shadow-2xl shadow-emerald-500/20">
                        <ClipboardDocumentListIcon className="h-10 w-10 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Live Registry</span>
                          <span className="px-2 py-0.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">Medical Records</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                          {selectedPatient.user.firstName} {selectedPatient.user.lastName}
                        </h2>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowMedicalRecords(false)}
                      className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex p-2 bg-slate-50 rounded-[24px] border border-slate-100 gap-2">
                    {[
                      { id: 'appointments', label: 'Encounters', icon: CalendarIcon },
                      { id: 'labtests', label: 'Lab Reports', icon: BeakerIcon },
                      { id: 'summary', label: 'AI Synthesis', icon: SparklesIcon },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveRecordsTab(tab.id as any)}
                        className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${
                          activeRecordsTab === tab.id
                            ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]'
                            : 'text-slate-400 hover:text-slate-900 hover:bg-white'
                        }`}
                      >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-slate-50/50">
                  {activeRecordsTab === 'appointments' && (
                    <div className="space-y-6">
                      {medicalRecordsLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 grayscale opacity-20">
                          <div className="animate-spin h-10 w-10 border-4 border-slate-900 border-t-transparent rounded-full mb-6" />
                          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Synching Registry...</p>
                        </div>
                      ) : medicalRecords && medicalRecords.length > 0 ? (
                        medicalRecords.map((record, idx) => (
                          <motion.div
                            key={record.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group"
                          >
                            <div className="flex flex-col md:flex-row gap-8">
                              <div className="shrink-0 text-center md:text-left">
                                <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">DATED</div>
                                <div className="text-2xl font-black text-slate-900">
                                  {new Date(record.appointmentDate).getDate()}
                                </div>
                                <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] -mt-1">
                                  {new Date(record.appointmentDate).toLocaleString('default', { month: 'short' }).toUpperCase()}
                                </div>
                              </div>
                              
                              <div className="flex-1 space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getAppointmentTypeColor(record.type)}`}>
                                    {getAppointmentTypeLabel(record.type)}
                                  </span>
                                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <ClockIcon className="h-3 w-3" />
                                    {record.appointmentTime}
                                  </span>
                                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                    SERIAL #{record.serialNumber}
                                  </span>
                                </div>
                                
                                <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  Dr. {record.doctor.user.firstName} {record.doctor.user.lastName}
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {record.reason && (
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50">
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Chief Complaint</p>
                                      <p className="text-xs font-bold text-slate-600 line-clamp-2">{record.reason}</p>
                                    </div>
                                  )}
                                  {record.diagnosis && (
                                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100/50">
                                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Final Diagnosis</p>
                                      <p className="text-xs font-bold text-indigo-900 line-clamp-2">{record.diagnosis}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="shrink-0 flex md:flex-col gap-3 justify-end items-center">
                                <button
                                  onClick={() => handleViewRecordDetails(record)}
                                  className="w-full md:w-auto px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg"
                                >
                                  Details
                                </button>
                                <button
                                  onClick={() => handleDownloadRecord(record)}
                                  disabled={isDownloading === record.id}
                                  className="w-full md:w-auto px-6 py-3 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-100"
                                >
                                  {isDownloading === record.id ? 'Wait...' : 'Registry PDF'}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-20 opacity-30 grayscale items-center flex flex-col">
                          <DocumentTextIcon className="h-16 w-16 mb-6" />
                          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Empty Physical Registry</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeRecordsTab === 'labtests' && (
                    <div className="space-y-6">
                      {labRecordsLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 grayscale opacity-20">
                          <div className="animate-spin h-10 w-10 border-4 border-slate-900 border-t-transparent rounded-full mb-6" />
                          <p className="text-[10px] font-black uppercase tracking-[0.3em]">Querying Laboratory...</p>
                        </div>
                      ) : (labRecords && labRecords.length > 0) ? (
                        labRecords.map((test, idx) => (
                          <motion.div
                            key={`lab-${idx}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
                          >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-3xl -mr-16 -mt-16" />
                            <div className="flex flex-col md:flex-row gap-8 relative z-10">
                              <div className="shrink-0">
                                <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 border border-purple-100">
                                  <BeakerIcon className="h-8 w-8" />
                                </div>
                              </div>
                              <div className="flex-1 space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-purple-100">
                                    {test.recordType === 'ordered' ? 'Patient Ordered' : 'Clinical Requisition'}
                                  </span>
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                                    {test.status.replace('_', ' ').toUpperCase()}
                                  </span>
                                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-auto">
                                    {new Date(test.date).toLocaleDateString()}
                                  </span>
                                </div>
                                <h3 className="text-xl font-black text-slate-900">
                                  {test.recordType === 'ordered' ? 
                                    (test.testDetails?.map((t: any) => t.name).join(', ') || 'Diagnostic Sequence') : 
                                    test.name}
                                </h3>
                                {test.doctorName && test.doctorName !== 'Unknown Doctor' && (
                                  <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                    <UserIcon className="h-3 w-3" />
                                    Reviewer: {test.doctorName}
                                  </div>
                                )}
                              </div>
                              <div className="shrink-0 flex items-center">
                                {(() => {
                                  let reportUrl = test.testReports?.[0]?.path;
                                  if (!reportUrl && test.resultUrl) {
                                    try { reportUrl = test.resultUrl.startsWith('[') ? JSON.parse(test.resultUrl)[0]?.path : test.resultUrl; } 
                                    catch (e) { reportUrl = test.resultUrl; }
                                  }
                                  return reportUrl ? (
                                    <a 
                                      href={reportUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 transition-all shadow-xl flex items-center gap-2"
                                    >
                                      Download Report
                                      <ArrowDownTrayIcon className="h-4 w-4" />
                                    </a>
                                  ) : (
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic px-6">Pending Asset</span>
                                  );
                                })()}
                              </div>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-20 opacity-30 grayscale items-center flex flex-col">
                          <BeakerIcon className="h-16 w-16 mb-6" />
                          <p className="text-[10px] font-black uppercase tracking-[0.4em]">No Laboratory Results</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeRecordsTab === 'summary' && (
                    <div className="space-y-10">
                      {summaryLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 grayscale opacity-20">
                          <div className="animate-spin h-10 w-10 border-4 border-slate-900 border-t-transparent rounded-full mb-6" />
                          <p className="text-[10px] font-black uppercase tracking-[0.3em]">AI Clinical Synthesis...</p>
                        </div>
                      ) : selectedPatientSummary ? (
                        <div className="space-y-10">
                          {/* Premium AI Clinical Insights */}
                          {selectedPatientSummary.llamaClinicalInsight && (
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-10 bg-slate-900 rounded-[40px] text-white relative overflow-hidden group shadow-2xl"
                            >
                              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 blur-[100px] -mr-48 -mt-48" />
                              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[80px] -ml-32 -mb-32" />
                              
                              <div className="relative z-10 space-y-8">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                                      <SparklesIcon className="h-6 w-6 text-indigo-400" />
                                    </div>
                                    <div>
                                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Intelligence Nexus</p>
                                      <h3 className="text-xl font-black">AI Synthesis Engine</h3>
                                    </div>
                                  </div>
                                  <div className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md border ${
                                    selectedPatientSummary.llamaClinicalInsight.overallStatus === 'Critical'
                                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                  }`}>
                                    Status: {selectedPatientSummary.llamaClinicalInsight.overallStatus}
                                  </div>
                                </div>
                                
                                <p className="text-xl font-bold leading-relaxed text-slate-300">
                                  "{selectedPatientSummary.llamaClinicalInsight.summary}"
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  {[
                                    { label: 'Advancements', data: selectedPatientSummary.llamaClinicalInsight.improved, color: 'text-emerald-400', icon: ChartBarIcon },
                                    { label: 'Alert Factors', data: selectedPatientSummary.llamaClinicalInsight.worsened, color: 'text-rose-400', icon: ExclamationCircleIcon },
                                    { label: 'Key Actions', data: selectedPatientSummary.llamaClinicalInsight.followUpConsiderations, color: 'text-indigo-400', icon: ArrowPathIcon },
                                  ].map((section, idx) => (
                                    <div key={idx} className="p-6 bg-white/5 backdrop-blur-md rounded-[28px] border border-white/10 group-hover:bg-white/10 transition-all">
                                      <div className="flex items-center gap-3 mb-4">
                                        <section.icon className={`h-4 w-4 ${section.color}`} />
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{section.label}</p>
                                      </div>
                                      <ul className="space-y-2">
                                        {section.data && section.data.length > 0 ? section.data.map((item: string, i: number) => (
                                          <li key={i} className="text-[11px] font-bold text-slate-200 leading-snug">• {item}</li>
                                        )) : <li className="text-[11px] font-bold text-slate-500 italic">No significant data detected.</li>}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {/* Laboratory Profile Matrix */}
                          {selectedPatientSummary.allLabResultsSummary && (
                            <div className="space-y-6">
                              <div className="flex items-center gap-3 border-l-4 border-purple-500 pl-4">
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Diagnostic Profile Matrix</h3>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {[
                                  { label: 'Reports', value: selectedPatientSummary.allLabResultsSummary.totalReports, color: 'slate' },
                                  { label: 'Findings', value: selectedPatientSummary.allLabResultsSummary.totalFindings, color: 'indigo' },
                                  { label: 'Critical', value: selectedPatientSummary.allLabResultsSummary.criticalCount, color: 'rose' },
                                  { label: 'Warning', value: selectedPatientSummary.allLabResultsSummary.cautionCount, color: 'amber' },
                                  { label: 'Stable', value: selectedPatientSummary.allLabResultsSummary.normalCount, color: 'emerald' },
                                ].map((stat, idx) => (
                                  <div key={idx} className={`p-6 bg-white rounded-[28px] border border-slate-100 shadow-sm text-center`}>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
                                    <p className={`text-3xl font-black text-${stat.color}-600 tracking-tight`}>{stat.value}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Manual Health Alert Trigger */}
                          <div className="p-10 bg-rose-50 rounded-[40px] border border-rose-100 flex flex-col md:flex-row items-center justify-between gap-10">
                            <div className="max-w-md text-center md:text-left">
                              <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">Protocol Override</p>
                              <h4 className="text-2xl font-black text-rose-900 mb-4">Urgent Health Communication</h4>
                              <p className="text-rose-700/70 text-sm font-bold leading-relaxed">
                                Directly dispatch a high-priority medical notice to the patient's secure hub regarding clinical developments.
                              </p>
                            </div>
                            <button
                              onClick={() => { setAlertPatient(selectedPatient); setShowAlertModal(true); }}
                              className="px-10 py-5 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200"
                            >
                              Dispatch Alert
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-20 opacity-30 grayscale items-center flex flex-col">
                          <SparklesIcon className="h-16 w-16 mb-6" />
                          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Engine Awaiting Data Batch</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Footer Controls */}
                <div className="p-8 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                  <button
                    onClick={() => setShowMedicalRecords(false)}
                    className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-all border border-slate-100"
                  >
                    Close Records
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ═══ DETAILED RECORD VIEW MODAL ═══ */}
        <AnimatePresence>
          {showRecordDetail && selectedRecord && selectedPatient && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowRecordDetail(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-6xl max-h-[90vh] bg-white rounded-[40px] shadow-2xl border border-white/20 overflow-hidden flex flex-col"
              >
                {/* Modal Header */}
                <div className="p-8 md:p-12 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-slate-900 rounded-[28px] flex items-center justify-center shadow-2xl">
                      <ClipboardDocumentCheckIcon className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="px-2 py-0.5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest">Encounter Archive</span>
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                          LOG #{selectedRecord.serialNumber}
                        </span>
                      </div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">Clinical Encounter Details</h2>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRecordDetail(false)}
                    className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Content Section */}
                <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Primary Data Column */}
                    <div className="lg:col-span-8 space-y-12">
                      {/* Clinical Summary Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-8 bg-slate-900 rounded-[32px] text-white overflow-hidden relative">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl -mr-16 -mt-16" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Patient Profile</p>
                          <h4 className="text-2xl font-black mb-2">{selectedPatient.user.firstName} {selectedPatient.user.lastName}</h4>
                          <p className="text-slate-400 text-xs font-bold">{selectedPatient.user.email}</p>
                          <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-6">
                            <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Blood</p>
                              <p className="text-sm font-black">{selectedPatient.bloodType || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Gender</p>
                              <p className="text-sm font-black capitalize">{selectedPatient.user.gender}</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-8 bg-indigo-50/50 rounded-[32px] border border-indigo-100/50 relative">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Practitioner Registry</p>
                          <h4 className="text-2xl font-black text-slate-900 mb-2">Dr. {selectedRecord.doctor?.user?.firstName} {selectedRecord.doctor?.user?.lastName}</h4>
                          <p className="text-indigo-600 text-xs font-black uppercase tracking-widest">{getDepartmentLabel(selectedRecord.doctor?.department)}</p>
                          <div className="mt-6 pt-6 border-t border-indigo-200/50 flex items-center gap-6">
                            <div>
                              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">BMDC</p>
                              <p className="text-sm font-black text-slate-900">{selectedRecord.doctor?.bmdcRegistrationNumber || 'VERIFIED'}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Clinical Findings Sections */}
                      <div className="space-y-8">
                        <div className="flex items-center gap-3 border-l-4 border-slate-900 pl-4">
                          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Encounter Synthesis</h3>
                        </div>

                        {[
                          { label: 'Clinical Notes', value: selectedRecord.notes, color: 'slate', icon: ClipboardDocumentListIcon },
                          { label: 'Formal Diagnosis', value: selectedRecord.diagnosis, color: 'indigo', icon: ShieldCheckIcon },
                          { label: 'Reason for Visit', value: selectedRecord.reason, color: 'emerald', icon: ExclamationCircleIcon },
                        ].map((section, idx) => section.value && (
                          <div key={idx} className="p-8 bg-slate-50 rounded-[28px] border border-slate-100/50 hover:bg-white transition-all">
                            <div className="flex items-center gap-3 mb-6">
                              <div className={`w-8 h-8 rounded-lg bg-${section.color}-100 flex items-center justify-center text-${section.color}-600`}>
                                <section.icon className="h-4 w-4" />
                              </div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{section.label}</p>
                            </div>
                            <p className="text-lg font-bold text-slate-900 leading-relaxed">{section.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Integrated Prescription Component */}
                      {prescriptionData && (
                        <div className="pt-8 mt-8 border-t border-slate-100">
                          <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4 mb-8">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Pharmaceutical Directives</h3>
                          </div>
                          <div className="bg-slate-50 rounded-[40px] border border-slate-100 overflow-hidden shadow-inner p-1">
                            <PrescriptionView 
                              prescriptionData={prescriptionData}
                              appointmentData={selectedRecord}
                              userRole={user?.role}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata Sidebar */}
                    <div className="lg:col-span-4 space-y-8">
                      <div className="p-8 bg-slate-50 rounded-[32px] border border-slate-100 space-y-8">
                        <div className="flex items-center gap-3 border-l-4 border-slate-400 pl-4">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Temporal Data</h3>
                        </div>
                        
                        <div className="space-y-6">
                          {[
                            { label: 'Date', value: new Date(selectedRecord.appointmentDate).toLocaleDateString(), icon: CalendarIcon },
                            { label: 'Start Cycle', value: selectedRecord.appointmentTime, icon: ClockIcon },
                            { label: 'Serial Key', value: `#${selectedRecord.serialNumber}`, icon: IdentificationIcon },
                            { label: 'Type', value: selectedRecord.type?.replace('_', ' ').toUpperCase(), icon: TagIcon },
                          ].map((meta, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                                <meta.icon className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{meta.label}</p>
                                <p className="text-sm font-black text-slate-900">{meta.value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-8 bg-indigo-900 rounded-[32px] text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-2xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                        <h4 className="text-xl font-black mb-6 relative z-10">Archive Action</h4>
                        <button
                          onClick={() => handleDownloadRecord(selectedRecord)}
                          disabled={isDownloading === selectedRecord.id}
                          className="w-full py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 hover:text-white transition-all shadow-xl flex items-center justify-center gap-3 relative z-10"
                        >
                          {isDownloading === selectedRecord.id ? (
                            <div className="animate-spin h-4 w-4 border-2 border-slate-900 border-t-transparent rounded-full" />
                          ) : (
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          )}
                          {isDownloading === selectedRecord.id ? 'SYNCHING PDF...' : 'GENERATE ASSET'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-8 border-t border-slate-100 flex items-center justify-end shrink-0">
                  <button
                    onClick={() => setShowRecordDetail(false)}
                    className="px-8 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-slate-900 transition-all border border-slate-100"
                  >
                    Close Archive
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ═══ SEND HEALTH ALERT MODAL ═══ */}
        <AnimatePresence>
          {showAlertModal && alertPatient && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setShowAlertModal(false);
                  setAlertForm({ urgency: 'routine', message: '', action: 'follow_up' });
                }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl"
              />
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl border border-white/20 overflow-hidden"
              >
                {/* Header Section */}
                <div className={`p-10 transition-all duration-700 relative overflow-hidden ${
                  alertForm.urgency === 'critical' ? 'bg-rose-600 text-white' :
                  alertForm.urgency === 'urgent' ? 'bg-amber-500 text-white' :
                  'bg-slate-900 text-white'
                }`}>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] -mr-32 -mt-32" />
                  
                  <div className="relative z-10 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-lg">
                        <BellAlertIcon className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest">Global Dispatch</span>
                          <span className="px-2 py-0.5 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest">Protocol V4</span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Clinical Dispatch</h2>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowAlertModal(false);
                        setAlertForm({ urgency: 'routine', message: '', action: 'follow_up' });
                      }}
                      className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="p-10 space-y-10">
                  {/* Urgency Matrix */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-l-4 border-slate-900 pl-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Priority Matrix</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'routine', label: 'Routine', icon: CheckCircleIcon, color: 'indigo' },
                        { id: 'urgent', label: 'Urgent', icon: ExclamationTriangleIcon, color: 'amber' },
                        { id: 'critical', label: 'Critical', icon: ShieldExclamationIcon, color: 'rose' },
                      ].map((tier) => (
                        <button
                          key={tier.id}
                          onClick={() => setAlertForm({ ...alertForm, urgency: tier.id as any })}
                          className={`p-6 rounded-[24px] border-2 transition-all group ${
                            alertForm.urgency === tier.id
                              ? `bg-${tier.color}-50 border-${tier.color}-500 shadow-xl shadow-${tier.color}-500/10`
                              : 'bg-white border-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <tier.icon className={`h-6 w-6 mx-auto mb-3 transition-colors ${
                            alertForm.urgency === tier.id ? `text-${tier.color}-600` : 'text-slate-300 group-hover:text-slate-500'
                          }`} />
                          <p className={`text-[10px] font-black uppercase tracking-widest text-center ${
                            alertForm.urgency === tier.id ? `text-${tier.color}-700` : 'text-slate-400'
                          }`}>{tier.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Operational Action */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-l-4 border-slate-900 pl-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Directive</h3>
                    </div>
                    <div className="relative">
                      <select
                        value={alertForm.action}
                        onChange={(e) => setAlertForm({ ...alertForm, action: e.target.value })}
                        className="w-full pl-6 pr-12 py-5 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all appearance-none"
                      >
                        <option value="follow_up">📅 FOLLOW-UP ENCOUNTER</option>
                        <option value="admission">🏥 IMMEDIATE CLINICAL ADMISSION</option>
                        <option value="medication_change">💊 PHARMACEUTICAL ADJUSTMENT</option>
                        <option value="monitoring">👁️ INTENSIVE BIO-MONITORING</option>
                      </select>
                      <ChevronDownIcon className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Dispatch Payload */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 border-l-4 border-slate-900 pl-4">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinical Directive Message</h3>
                    </div>
                    <textarea
                      value={alertForm.message}
                      onChange={(e) => setAlertForm({ ...alertForm, message: e.target.value })}
                      rows={4}
                      placeholder="Input clinical findings and required patient actions..."
                      className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[24px] text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all resize-none placeholder:text-slate-400"
                    />
                  </div>

                  <div className="p-4 bg-slate-900 rounded-[20px] flex items-center gap-4 border border-white/10">
                    <EnvelopeIcon className="h-5 w-5 text-indigo-400" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                      Multi-channel sync: In-App, Email, and SMS Hub enabled.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowAlertModal(false);
                        setAlertForm({ urgency: 'routine', message: '', action: 'follow_up' });
                      }}
                      className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-slate-900 hover:bg-slate-100 transition-all border border-slate-100"
                    >
                      Cancel Dispatch
                    </button>
                    <button
                      onClick={() => {
                        if (!alertForm.message.trim()) {
                          toast.error('Directive payload required');
                          return;
                        }
                        alertMutation.mutate({
                          patientId: alertPatient.id,
                          urgency: alertForm.urgency,
                          message: alertForm.message,
                          action: alertForm.action
                        });
                      }}
                      disabled={alertMutation.isPending}
                      className={`flex-1 py-5 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center justify-center gap-3 ${
                        alertForm.urgency === 'critical' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20' :
                        alertForm.urgency === 'urgent' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' :
                        'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20'
                      } ${alertMutation.isPending ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                    >
                      {alertMutation.isPending ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <PaperAirplaneIcon className="h-4 w-4" />
                      )}
                      {alertMutation.isPending ? 'Syncing...' : 'Dispatch Alert'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Patients;