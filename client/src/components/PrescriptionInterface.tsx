import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import API from '../api/api';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '../services/paymentService';
import { calculateAge, formatAge, formatGender } from '../utils/dateUtils';
import { 
  PlusIcon, 
  XMarkIcon, 
  CheckIcon, 
  DocumentTextIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  UserIcon,
  HeartIcon,
  ShieldCheckIcon,
  ClockIcon,
  StarIcon,
  PencilIcon,
  EyeIcon,
  ArrowPathIcon,
  ChartBarIcon,
  DevicePhoneMobileIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import VoicePrescriptionAssistant from './VoicePrescriptionAssistant';
import { SparklesIcon as SparklesSolidIcon } from '@heroicons/react/24/solid';

interface PrescriptionInterfaceProps {
  appointmentId: number;
  onComplete: () => void;
  isReadOnly?: boolean;
  userRole?: 'doctor' | 'patient' | 'admin';
  patientId?: number;
}

interface PrescriptionFormData {
  medicines?: string;
  symptoms?: string;
  diagnosis?: string;
  suggestions?: string;
  tests?: string;
  reports?: string;
  exercises?: string;
  dietaryChanges?: string;
  clinicalFindings?: string;
}

interface VitalSigns {
  bloodPressure: string;
  heartRate: string;
  temperature: string;
  respiratoryRate: string;
  oxygenSaturation: string;
}

interface Medicine {
  name: string;
  dosage: string;
  unit: 'mg' | 'ml';
  type: 'tablet' | 'syrup';
  morning: number;
  lunch: number;
  dinner: number;
  mealTiming: 'before' | 'after';
  duration: number; // Changed to number for days
  notes: string;
}

interface Symptom {
  id: string;
  description: string;
}

interface Diagnosis {
  id: string;
  description: string;
  date: string;
}

interface Test {
  id: string;
  name: string;
  description: string;
  status: 'ordered' | 'approved' | 'done' | 'reported';
  testId?: number; // Reference to lab test database
  category?: string;
  price?: number;
}

interface FollowUp {
  id: string;
  description: string;
}

interface EmergencyInstruction {
  id: string;
  description: string;
}

interface ExistingMedicine {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  instructions: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  doctor: {
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

interface TestReport {
  id: string;
  originalName: string;
  path: string;
  uploadedAt: string;
  testName?: string;
}


const PrescriptionInterface: React.FC<PrescriptionInterfaceProps> = ({ 
  appointmentId, 
  onComplete,
  isReadOnly = false,
  userRole = 'doctor',
  patientId
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [emergencyInstructions, setEmergencyInstructions] = useState<EmergencyInstruction[]>([]);
  const [existingMedicines, setExistingMedicines] = useState<ExistingMedicine[]>([]);
  const [testReports, setTestReports] = useState<TestReport[]>([]);
  const [showAllPrescriptions, setShowAllPrescriptions] = useState(false);
  const [testSearchTerm, setTestSearchTerm] = useState('');
  const [showTestSearch, setShowTestSearch] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    respiratoryRate: '',
    oxygenSaturation: ''
  });

  const [activeTab, setActiveTab] = useState<'medicines' | 'symptoms' | 'diagnosis' | 'suggestions' | 'tests' | 'reports' | 'clinical'>('medicines');
  const [isExtracting, setIsExtracting] = useState(false);

  const form = useForm<PrescriptionFormData>({
    defaultValues: {
      medicines: '',
      symptoms: '',
      diagnosis: '',
      suggestions: '',
      tests: '',
      reports: '',
      exercises: '',
      dietaryChanges: '',
      clinicalFindings: ''
    }
  });

  // Fetch available lab tests for search
  const { data: availableLabTests, isLoading: labTestsLoading } = useQuery({
    queryKey: ['lab-tests', testSearchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (testSearchTerm) {
        params.append('search', testSearchTerm);
      }
      console.log('Fetching lab tests with params:', params.toString());
      const response = await API.get(`/lab-tests/tests?${params}`);
      console.log('Lab tests API response:', response.data);
      // The API returns data in nested structure: data.tests and data.groupedTests
      const tests = response.data.data?.tests || [];
      console.log('Available lab tests:', tests.length, tests);
      return tests;
    },
    enabled: showTestSearch, // Only fetch when search is shown
  });

  // Fetch appointment data with patient information
  const { data: appointmentData } = useQuery({
    queryKey: ['appointment-patient-data', appointmentId],
    queryFn: async () => {
      const response = await API.get(`/appointments/${appointmentId}`);
      return response.data.data.appointment;
    },
    enabled: !!appointmentId,
  });

  // Fetch patient's lab test orders (all statuses, like patient lab reports page)
  const { data: patientLabOrders, isLoading: labOrdersLoading, error: labOrdersError } = useQuery({
    queryKey: ['patient-lab-orders-all', patientId || appointmentData?.patient?.id],
    queryFn: async () => {
      const currentPatientId = patientId || appointmentData?.patient?.id;
      console.log('Fetching lab reports for patient:', currentPatientId);
      try {
        // Use the same endpoint as patient lab reports page - get all orders, no status filter
        const response = await API.get(`/lab-tests/patients/${currentPatientId}/lab-reports`, {
          params: {
            limit: 100
            // Removed status: 'reported' filter to show all orders like patient lab reports page
          }
        });
        console.log('Lab reports API response:', response.data);
        const orders = response.data.data.orders || [];
        console.log('🔍 DEBUG: Lab orders with testReports:', orders.map((order: any) => ({
          id: order.id,
          status: order.status,
          testReports: order.testReports,
          hasTestReports: order.testReports && order.testReports.length > 0
        })));
        return orders;
      } catch (error) {
        console.error('Error fetching lab reports:', error);
        throw error;
      }
    },
    enabled: !!(patientId || appointmentData?.patient?.id) && userRole === 'doctor',
  });

  // Fetch patient's prescription lab tests (all statuses, like patient lab reports page)
  const { data: patientPrescriptionLabTests, isLoading: prescriptionLabTestsLoading, error: prescriptionLabTestsError } = useQuery({
    queryKey: ['patient-prescription-lab-tests-all', patientId || appointmentData?.patient?.id],
    queryFn: async () => {
      const currentPatientId = patientId || appointmentData?.patient?.id;
      console.log('Fetching prescription lab tests for patient:', currentPatientId);
      try {
        // Use the same endpoint as patient lab reports page - get all tests, no status filter
        const response = await API.get(`/lab-tests/patients/${currentPatientId}/prescription-lab-tests`, {
          params: {
            limit: 100
            // Removed status: 'reported' filter to show all tests like patient lab reports page
          }
        });
        console.log('Prescription lab tests API response:', response.data);
        const prescriptions = response.data.data.prescriptions || [];
        console.log('🔍 DEBUG: Prescription lab tests with resultFiles:', prescriptions.map((prescription: any) => ({
          id: prescription.id,
          parsedTests: prescription.parsedTests?.map((test: any) => ({
            name: test.name,
            status: test.status,
            resultFiles: test.resultFiles,
            hasResultFiles: test.resultFiles && test.resultFiles.length > 0
          }))
        })));
        return prescriptions;
      } catch (error) {
        console.error('Error fetching prescription lab tests:', error);
        throw error;
      }
    },
    enabled: !!(patientId || appointmentData?.patient?.id) && userRole === 'doctor',
  });


  // Load existing prescription data
  useEffect(() => {
    const loadPrescription = async () => {
      try {
        const response = await API.get(`/prescriptions/appointment/${appointmentId}`);
        const prescription = response.data.data.prescription;
        
        if (prescription) {
          form.setValue('symptoms', prescription.symptoms || '');
          form.setValue('diagnosis', prescription.diagnosis || '');
          form.setValue('clinicalFindings', prescription.clinicalFindings || '');
          
          if (prescription.vitalSigns) {
            try {
              const parsedVitals = typeof prescription.vitalSigns === 'string' 
                ? JSON.parse(prescription.vitalSigns) 
                : prescription.vitalSigns;
              setVitalSigns(parsedVitals);
            } catch (e) {
              console.error('Error parsing vital signs', e);
            }
          }

          if (prescription.suggestions) {
            try {
              const parsedSuggestions = JSON.parse(prescription.suggestions);
              form.setValue('exercises', parsedSuggestions.exercises || '');
              form.setValue('dietaryChanges', parsedSuggestions.dietaryChanges || '');
              form.setValue('suggestions', parsedSuggestions.lifestyleModifications || '');
              
              if (parsedSuggestions.followUps && Array.isArray(parsedSuggestions.followUps)) {
                setFollowUps(parsedSuggestions.followUps);
              }
              if (parsedSuggestions.emergencyInstructions && Array.isArray(parsedSuggestions.emergencyInstructions)) {
                setEmergencyInstructions(parsedSuggestions.emergencyInstructions);
              }
            } catch (e) {
              form.setValue('suggestions', prescription.suggestions);
            }
          }
          
          // Parse medicines and tests from JSON strings
          if (prescription.medicines) {
            try {
              const medicinesData = JSON.parse(prescription.medicines);
              setMedicines(medicinesData);
            } catch {
              // If not JSON, treat as plain text
              form.setValue('medicines', prescription.medicines);
            }
          }
          
          if (prescription.tests) {
            try {
              const testsData = JSON.parse(prescription.tests);
              setTests(testsData);
            } catch {
              // If not JSON, treat as plain text
              form.setValue('tests', prescription.tests);
            }
          }
        }
      } catch (error) {
        console.log('No existing prescription found');
      }
    };

    loadPrescription();
  }, [appointmentId, form]);

  // Load existing medicines for the patient
  useEffect(() => {
    const loadExistingMedicines = async () => {
      if (patientId && userRole === 'doctor') {
        try {
          const response = await API.get(`/medicines/doctors/patients/${patientId}/medicines?status=active`);
          setExistingMedicines(response.data.data || []);
        } catch (error) {
          console.log('No existing medicines found');
        }
      }
    };

    loadExistingMedicines();
  }, [patientId, userRole]);

  // Load test reports for the patient
  useEffect(() => {
    const loadTestReports = async () => {
      if (patientId && userRole === 'doctor') {
        try {
          // Fetch prescription lab tests using doctor endpoint
          const prescriptionResponse = await API.get(`/lab-tests/patients/${patientId}/prescription-lab-tests`);
          const prescriptionTests = prescriptionResponse.data.data.prescriptions || [];
          
          // Fetch regular lab orders using doctor endpoint
          const labOrdersResponse = await API.get(`/lab-tests/patients/${patientId}/lab-reports`);
          const labOrders = labOrdersResponse.data.data.orders || [];
          
          // Combine and extract reports
          const allReports: TestReport[] = [];
          
          prescriptionTests.forEach((test: any) => {
            if (test.testReports && test.testReports.length > 0) {
              test.testReports.forEach((report: any) => {
                allReports.push({
                  id: report.id,
                  originalName: report.originalName,
                  path: report.path,
                  uploadedAt: report.uploadedAt,
                  testName: test.name
                });
              });
            }
          });
          
          labOrders.forEach((order: any) => {
            if (order.testReports && order.testReports.length > 0) {
              order.testReports.forEach((report: any) => {
                allReports.push({
                  id: report.id,
                  originalName: report.originalName,
                  path: report.path,
                  uploadedAt: report.uploadedAt,
                  testName: order.testDetails?.[0]?.name || 'Lab Test'
                });
              });
            }
          });
          
          setTestReports(allReports);
        } catch (error) {
          console.log('No test reports found');
        }
      }
    };

    loadTestReports();
  }, [patientId, userRole]);

  const addMedicine = () => {
    const newIndex = medicines.length;
    setMedicines([...medicines, { 
      name: '', 
      dosage: '', 
      unit: 'mg',
      type: 'tablet',
      morning: 0, 
      lunch: 0, 
      dinner: 0, 
      mealTiming: 'after', 
      duration: 7, // Default to 7 days
      notes: '' 
    }]);
    setEditingIndex(newIndex); // Set new medicine to editing mode
  };

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const updateMedicine = (index: number, field: keyof Medicine, value: any) => {
    const updated = medicines.map((medicine, i) =>
      i === index ? { ...medicine, [field]: value } : medicine
    );
    setMedicines(updated);
  };

  const discontinueMedicine = async (medicineId: number) => {
    // Use toast to show confirmation
    const confirmed = window.confirm('Are you sure you want to discontinue this medicine?');
    if (!confirmed) {
      return;
    }

    try {
      await API.post(`/medicines/medicines/${medicineId}/discontinue`, {
        reason: 'Doctor discontinued during appointment',
        notes: 'Discontinued during prescription review'
      });
      
      toast.success('Medicine discontinued successfully');
      
      // Refresh existing medicines list
      if (patientId) {
        const response = await API.get(`/medicines/doctors/patients/${patientId}/medicines?status=active`);
        setExistingMedicines(response.data.data || []);
      }
    } catch (error) {
      toast.error('Failed to discontinue medicine');
      console.error('Error discontinuing medicine:', error);
    }
  };

  const downloadReport = async (report: TestReport) => {
    try {
      const response = await API.get(`/admin/test-reports/${report.id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', report.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download report');
      console.error('Error downloading report:', error);
    }
  };

  const addSymptom = () => {
    setSymptoms([...symptoms, { 
      id: Date.now().toString(), 
      description: '' 
    }]);
  };

  const removeSymptom = (id: string) => {
    setSymptoms(symptoms.filter(s => s.id !== id));
  };

  const updateSymptom = (id: string, description: string) => {
    setSymptoms(symptoms.map(s => s.id === id ? { ...s, description } : s));
  };

  const addDiagnosis = () => {
    setDiagnoses([...diagnoses, { 
      id: Date.now().toString(), 
      description: '', 
      date: new Date().toISOString().split('T')[0] 
    }]);
  };

  const removeDiagnosis = (id: string) => {
    setDiagnoses(diagnoses.filter(d => d.id !== id));
  };

  const updateDiagnosis = (id: string, field: keyof Diagnosis, value: string) => {
    setDiagnoses(diagnoses.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const addTest = () => {
    setTests([...tests, { 
      id: Date.now().toString(), 
      name: '', 
      description: '', 
      status: 'ordered',
      category: 'Others'
    }]);
  };

  const addTestFromSearch = (labTest: any) => {
    const newTest: Test = {
      id: Date.now().toString(),
      name: labTest.name,
      description: labTest.description,
      status: 'ordered',
      testId: labTest.id,
      category: labTest.category,
      price: labTest.price
    };
    setTests([...tests, newTest]);
    setShowTestSearch(false);
    setTestSearchTerm('');
    toast.success(`Added ${labTest.name} to tests`);
  };


  const removeTest = (id: string) => {
    setTests(tests.filter(t => t.id !== id));
  };

  const updateTest = (id: string, field: keyof Test, value: any) => {
    setTests(tests.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const addFollowUp = () => {
    setFollowUps([...followUps, { 
      id: Date.now().toString(), 
      description: '' 
    }]);
  };

  const removeFollowUp = (id: string) => {
    setFollowUps(followUps.filter(f => f.id !== id));
  };

  const updateFollowUp = (id: string, description: string) => {
    setFollowUps(followUps.map(f => f.id === id ? { ...f, description } : f));
  };

  const addEmergencyInstruction = () => {
    setEmergencyInstructions([...emergencyInstructions, { 
      id: Date.now().toString(), 
      description: '' 
    }]);
  };

  const removeEmergencyInstruction = (id: string) => {
    setEmergencyInstructions(emergencyInstructions.filter(e => e.id !== id));
  };

  const updateEmergencyInstruction = (id: string, description: string) => {
    setEmergencyInstructions(emergencyInstructions.map(e => e.id === id ? { ...e, description } : e));
  };

  const onSubmit = async (data: PrescriptionFormData) => {
    setIsLoading(true);
    try {
      const prescriptionData = {
        appointmentId,
        medicines: medicines.length > 0 ? JSON.stringify(medicines) : data.medicines,
        symptoms: symptoms.length > 0 ? JSON.stringify(symptoms) : data.symptoms,
        diagnosis: diagnoses.length > 0 ? JSON.stringify(diagnoses) : data.diagnosis,
        suggestions: JSON.stringify({
          exercises: data.exercises,
          dietaryChanges: data.dietaryChanges,
          lifestyleModifications: data.suggestions,
          followUps,
          emergencyInstructions
        }),
        tests: tests.length > 0 ? JSON.stringify(tests) : data.tests,
        testReports: data.reports,
        clinicalFindings: data.clinicalFindings,
        vitalSigns: vitalSigns
      };

      await API.post(`/prescriptions/appointment/${appointmentId}`, prescriptionData);
      toast.success('Prescription saved successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save prescription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Save current form data first
      const formData = form.getValues();
      const prescriptionData = {
        appointmentId,
        medicines: medicines.length > 0 ? JSON.stringify(medicines) : formData.medicines,
        symptoms: symptoms.length > 0 ? JSON.stringify(symptoms) : formData.symptoms,
        diagnosis: diagnoses.length > 0 ? JSON.stringify(diagnoses) : formData.diagnosis,
        suggestions: JSON.stringify({
          exercises: formData.exercises,
          dietaryChanges: formData.dietaryChanges,
          lifestyleModifications: formData.suggestions,
          followUps,
          emergencyInstructions
        }),
        tests: tests.length > 0 ? JSON.stringify(tests) : formData.tests,
        testReports: formData.reports,
        clinicalFindings: formData.clinicalFindings,
        vitalSigns: vitalSigns
      };

      await API.post(`/prescriptions/appointment/${appointmentId}`, prescriptionData);
      
      // Complete the prescription
      await API.put(`/prescriptions/appointment/${appointmentId}/complete`);
      
      toast.success('Appointment completed successfully!');
      onComplete();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceExtraction = async (transcript: string) => {
    setIsExtracting(true);
    try {
      const response = await API.post('/prescriptions/extract-voice-data', { transcript });
      const data = response.data.data;

      // Map medicines
      if (data.medicines && data.medicines.length > 0) {
        setMedicines(prev => [...prev, ...data.medicines.map((m: any) => ({
          ...m,
          unit: m.unit || 'mg',
          type: m.type || 'tablet',
          mealTiming: m.mealTiming || 'after',
          duration: m.duration || 7
        }))]);
      }

      // Map symptoms
      if (data.symptoms && data.symptoms.length > 0) {
        setSymptoms(prev => [...prev, ...data.symptoms.map((s: any) => ({ 
          id: Date.now().toString() + Math.random(), 
          description: s.description 
        }))]);
      }

      // Map diagnosis
      if (data.diagnosis && data.diagnosis.length > 0) {
        setDiagnoses(prev => [...prev, ...data.diagnosis.map((d: any) => ({ 
          id: Date.now().toString() + Math.random(), 
          description: d.description, 
          date: d.date || new Date().toISOString().split('T')[0] 
        }))]);
      }

      // Map vital signs
      if (data.vitalSigns) {
        setVitalSigns(prev => ({
          ...prev,
          bloodPressure: data.vitalSigns.bloodPressure || prev.bloodPressure,
          heartRate: data.vitalSigns.heartRate || prev.heartRate,
          temperature: data.vitalSigns.temperature || prev.temperature,
          respiratoryRate: data.vitalSigns.respiratoryRate || prev.respiratoryRate,
          oxygenSaturation: data.vitalSigns.oxygenSaturation || prev.oxygenSaturation
        }));
      }

      // Map recommendations
      if (data.recommendations) {
        if (data.recommendations.exercises) {
          const current = form.getValues('exercises');
          form.setValue('exercises', (current ? current + '\n' : '') + data.recommendations.exercises);
        }
        if (data.recommendations.dietaryChanges) {
          const current = form.getValues('dietaryChanges');
          form.setValue('dietaryChanges', (current ? current + '\n' : '') + data.recommendations.dietaryChanges);
        }
        if (data.recommendations.suggestions) {
          const current = form.getValues('suggestions');
          form.setValue('suggestions', (current ? current + '\n' : '') + data.recommendations.suggestions);
        }
      }

      // Map clinical findings
      if (data.clinicalFindings) {
        const current = form.getValues('clinicalFindings');
        form.setValue('clinicalFindings', (current ? current + '\n' : '') + data.clinicalFindings);
      }

      // Map tests
      if (data.tests && data.tests.length > 0) {
        setTests(prev => [...prev, ...data.tests.map((t: any) => ({ 
          id: Date.now().toString() + Math.random(), 
          name: t.name, 
          description: t.description, 
          status: 'ordered', 
          category: 'Others' 
        }))]);
      }

      toast.success('Prescription auto-filled!');
    } catch (error) {
      console.error('Extraction error:', error);
      toast.error('Failed to extract structured data');
    } finally {
      setIsExtracting(false);
    }
  };

  const tabs = [
    { id: 'medicines', name: 'Medicines', icon: DocumentTextIcon },
    { id: 'clinical', name: 'Clinical', icon: HeartIcon },
    { id: 'symptoms', name: 'Symptoms', icon: ClipboardDocumentListIcon },
    { id: 'diagnosis', name: 'Diagnosis', icon: BeakerIcon },
    { id: 'suggestions', name: 'Recommendations', icon: CheckIcon },
    { id: 'tests', name: 'Lab Tests', icon: BeakerIcon },
    { id: 'reports', name: 'Reports', icon: DocumentTextIcon }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden"
    >
      {/* ═══ PREMIUM HEADER ═══ */}
      <div className="relative overflow-hidden bg-slate-900 px-8 py-10 md:px-12 text-white group">
        <div className="absolute top-0 right-0 w-1/3 h-full">
          <div className="absolute inset-0 bg-gradient-to-l from-indigo-500/10 via-transparent to-transparent" />
          <div className="absolute top-[-20%] right-[-10%] w-[250px] h-[250px] bg-indigo-400/10 rounded-full blur-[80px]" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-6"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20"
            >
              <DocumentTextIcon className="h-7 w-7 text-white" />
            </motion.div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-2 py-0.5 bg-white/10 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-white/10">Clinical Registry</span>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-indigo-400/20">Prescription v2.0</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-black tracking-tight leading-none text-white">
                Consultation <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 italic">Interface.</span>
              </h3>
            </div>
          </motion.div>

          {/* Status Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="hidden md:flex items-center gap-4"
          >
            <div className="px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/50" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Live Session</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      {/* ═══ PATIENT QUICK INFO BAR ═══ */}
      {appointmentData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-slate-50 border-y border-slate-100 p-2 flex flex-col lg:flex-row items-center gap-2"
        >
          <div className="w-full lg:w-auto p-4 lg:px-6 lg:border-r border-slate-100 flex items-center gap-3 shrink-0">
            <UserIcon className="h-5 w-5 text-indigo-600" />
            <span className="font-black text-xs text-slate-900 uppercase tracking-widest">Clinical File</span>
          </div>

          <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 px-2 py-1">
            <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Patient Name</p>
              <p className="text-xs font-black text-slate-900 truncate">
                {appointmentData.patient?.user?.firstName} {appointmentData.patient?.user?.lastName}
              </p>
            </div>
            
            <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Age / Sex</p>
              <p className="text-xs font-black text-slate-900">
                {formatAge(calculateAge(appointmentData.patient?.user?.dateOfBirth))} / {formatGender(appointmentData.patient?.user?.gender)}
              </p>
            </div>

            <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Weight / Blood</p>
              <p className="text-xs font-black text-slate-900">
                {appointmentData.patient?.weight ? `${appointmentData.patient.weight} kg` : '—'} / {appointmentData.patient?.bloodType || '—'}
              </p>
            </div>

            <div className="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Session Date</p>
              <p className="text-xs font-bold text-indigo-600">
                {new Date(appointmentData.appointmentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            <div className="col-span-2 md:col-span-1 flex items-center justify-center px-2">
              <button
                type="button"
                onClick={() => window.open(`/app/patients?patientId=${appointmentData.patient?.id}&view=records`, '_blank')}
                className="w-full py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200 flex items-center justify-center gap-1.5"
              >
                <ClipboardDocumentListIcon className="h-3 w-3" /> Full History
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Voice Assistant Section */}
      {!isReadOnly && userRole === 'doctor' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="px-8 py-6 border-b border-emerald-100/50"
        >
          <VoicePrescriptionAssistant
            onTranscriptionUpdate={(transcript, isFinal) => {
              // Can be used for live preview if needed
            }}
            onExtractionRequest={handleVoiceExtraction}
            isProcessing={isExtracting}
          />
        </motion.div>
      )}

      {/* ═══ PREMIUM TAB NAVIGATION ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="px-8 pt-6 pb-2 border-b border-slate-100 bg-white"
      >
        <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-2">
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.6 + index * 0.05 }}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                {tab.name}
              </motion.button>
            );
          })}
        </nav>
      </motion.div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-8">
        {/* Clinical Tab */}
        {activeTab === 'clinical' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 mb-8"
            >
              <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl shadow-rose-500/20">
                <HeartIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-2xl font-bold text-gray-900">Vital Signs & Clinical Findings</h4>
                <p className="text-slate-600 font-medium">Record baseline vitals and clinical examination findings</p>
              </div>
            </motion.div>

            {/* ═══ VITAL SIGNS GRID ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-[24px] p-8 border border-slate-100 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                  <HeartIcon className="h-5 w-5 text-rose-500" />
                </div>
                <div>
                  <h5 className="text-lg font-black text-slate-900 tracking-tight">Vital Parameters</h5>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Real-time physiological metrics</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Blood Pressure</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="block w-full pl-4 pr-16 py-3 text-sm border border-slate-200/60 rounded-2xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all shadow-lg"
                      placeholder="120/80"
                      value={vitalSigns.bloodPressure}
                      onChange={(e) => setVitalSigns({...vitalSigns, bloodPressure: e.target.value})}
                      disabled={isReadOnly}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <span className="text-slate-500 text-sm font-medium">mmHg</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Heart Rate</label>
                  <div className="relative">
                    <input
                      type="number"
                      className="block w-full pl-4 pr-12 py-3 text-sm border border-slate-200/60 rounded-2xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all shadow-lg"
                      placeholder="72"
                      value={vitalSigns.heartRate}
                      onChange={(e) => setVitalSigns({...vitalSigns, heartRate: e.target.value})}
                      disabled={isReadOnly}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <span className="text-slate-500 text-sm font-medium">bpm</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Temperature</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      className="block w-full pl-4 pr-10 py-3 text-sm border border-slate-200/60 rounded-2xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all shadow-lg"
                      placeholder="98.6"
                      value={vitalSigns.temperature}
                      onChange={(e) => setVitalSigns({...vitalSigns, temperature: e.target.value})}
                      disabled={isReadOnly}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <span className="text-slate-500 text-sm font-medium">°F/°C</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.9 }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Respiratory Rate</label>
                  <div className="relative">
                    <input
                      type="number"
                      className="block w-full pl-4 pr-24 py-3 text-sm border border-slate-200/60 rounded-2xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all shadow-lg"
                      placeholder="16"
                      value={vitalSigns.respiratoryRate}
                      onChange={(e) => setVitalSigns({...vitalSigns, respiratoryRate: e.target.value})}
                      disabled={isReadOnly}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <span className="text-slate-500 text-sm font-medium">breaths/min</span>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.0 }}
                  className="space-y-2"
                >
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-wider">Oxygen Saturation</label>
                  <div className="relative">
                    <input
                      type="number"
                      className="block w-full pl-4 pr-12 py-3 text-sm border border-slate-200/60 rounded-2xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-400 transition-all shadow-lg"
                      placeholder="98"
                      value={vitalSigns.oxygenSaturation}
                      onChange={(e) => setVitalSigns({...vitalSigns, oxygenSaturation: e.target.value})}
                      disabled={isReadOnly}
                    />
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <span className="text-slate-500 text-sm font-medium">%</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* ═══ CLINICAL FINDINGS ═══ */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-3 px-2">
                <DocumentTextIcon className="h-5 w-5 text-indigo-500" />
                <label className="text-lg font-black text-slate-900 tracking-tight">Examination Findings</label>
              </div>
              <textarea
                {...form.register('clinicalFindings')}
                rows={6}
                className="w-full rounded-[24px] border border-slate-100 bg-slate-50 p-6 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white outline-none transition-all resize-none shadow-inner"
                placeholder="Enter detailed clinical findings from examination..."
                disabled={isReadOnly}
              />
            </motion.div>
          </motion.div>
        )}

        {/* Medicines Tab */}
        {activeTab === 'medicines' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <DocumentTextIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Medicines</h4>
                  <p className="text-sm text-gray-600">Manage patient medications and prescriptions</p>
                </div>
              </div>
              
              {!isReadOnly && userRole === 'doctor' && (
                <button
                  type="button"
                  onClick={addMedicine}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-200 shadow-sm hover:shadow-md font-medium flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add Medicine
                </button>
              )}
            </div>

            {/* Existing Medicines Section */}
            {userRole === 'doctor' && existingMedicines.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                    <HeartIcon className="h-4 w-4 text-white" />
                  </div>
                  <h5 className="text-lg font-semibold text-gray-900">Current Active Medicines</h5>
                </div>
                <div className="grid gap-4">
                  {existingMedicines.map((medicine) => (
                    <div key={medicine.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-6 hover:shadow-md transition-all duration-200">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h6 className="text-lg font-bold text-gray-900">{medicine.name}</h6>
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">
                              Active
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 font-medium">Dosage:</span>
                              <span className="text-gray-900">{medicine.dosage}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 font-medium">Frequency:</span>
                              <span className="text-gray-900">{medicine.frequency}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 font-medium">Doctor:</span>
                              <span className="text-gray-900">Dr. {medicine.doctor.user.firstName} {medicine.doctor.user.lastName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 font-medium">Started:</span>
                              <span className="text-gray-900">{new Date(medicine.startDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          {medicine.endDate && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-gray-600 font-medium">Ends:</span>
                              <span className="text-gray-900">{new Date(medicine.endDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {medicine.instructions && (
                            <div className="mt-3 p-3 bg-white/70 rounded-xl">
                              <p className="text-sm text-gray-700 font-medium">Instructions:</p>
                              <p className="text-sm text-gray-600 mt-1">{medicine.instructions}</p>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => discontinueMedicine(medicine.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all duration-200"
                          title="Discontinue Medicine"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Medicines Section */}
            {medicines.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                    <PlusIcon className="h-4 w-4 text-white" />
                  </div>
                  <h5 className="text-lg font-semibold text-gray-900">Added to Prescription</h5>
                </div>

                <div className="grid gap-4">
                  {medicines.map((medicine, index) => (
                    <div key={index} className={`rounded-[24px] border p-6 transition-all duration-300 ${
                      editingIndex === index 
                        ? 'bg-indigo-50/50 border-indigo-200 shadow-xl shadow-indigo-500/5' 
                        : 'bg-white border-slate-100 hover:shadow-lg hover:shadow-slate-200/50 group'
                    }`}>
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            editingIndex === index ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
                          }`}>
                            <span className="font-bold text-sm">{index + 1}</span>
                          </div>
                          <h5 className="text-lg font-bold text-gray-900">
                            {medicine.name || `New Medicine ${index + 1}`}
                          </h5>
                        </div>
                        <div className="flex items-center gap-2">
                          {!isReadOnly && userRole === 'doctor' && (
                            <>
                              {editingIndex !== index ? (
                                <button
                                  type="button"
                                  onClick={() => setEditingIndex(index)}
                                  className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-200"
                                  title="Edit Medicine"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setEditingIndex(null)}
                                  className="px-3 py-1 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-all duration-200 flex items-center gap-1 shadow-sm"
                                  title="Confirm and Save to List"
                                >
                                  <CheckIcon className="h-4 w-4" />
                                  Confirm
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => removeMedicine(index)}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all duration-200"
                                title="Remove Medicine"
                              >
                                <XMarkIcon className="h-5 w-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {editingIndex === index ? (
                        /* Edit Mode */
                        <div className="animate-fade-in">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Medicine Name</label>
                              <input
                                type="text"
                                value={medicine.name}
                                onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                                disabled={isReadOnly}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                                placeholder="e.g., Aspirin"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Medicine Type</label>
                              <select
                                value={medicine.type}
                                onChange={(e) => {
                                  const type = e.target.value as 'tablet' | 'syrup';
                                  updateMedicine(index, 'type', type);
                                  updateMedicine(index, 'unit', type === 'tablet' ? 'mg' : 'ml');
                                }}
                                disabled={isReadOnly}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                              >
                                <option value="tablet">Tablet</option>
                                <option value="syrup">Syrup</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Dosage ({medicine.unit})</label>
                              <input
                                type="text"
                                value={medicine.dosage}
                                onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                                disabled={isReadOnly}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                                placeholder={medicine.type === 'tablet' ? 'e.g., 75' : 'e.g., 5'}
                              />
                            </div>
                          </div>
                          
                          <div className="mt-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Daily Schedule</label>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="bg-white/70 rounded-xl p-4 border border-gray-200/50">
                                <label className="block text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                                  <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                  Morning
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={medicine.morning}
                                  onChange={(e) => updateMedicine(index, 'morning', parseInt(e.target.value) || 0)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500"
                                />
                              </div>
                              <div className="bg-white/70 rounded-xl p-4 border border-gray-200/50">
                                <label className="block text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                                  <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                  Lunch
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={medicine.lunch}
                                  onChange={(e) => updateMedicine(index, 'lunch', parseInt(e.target.value) || 0)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500"
                                />
                              </div>
                              <div className="bg-white/70 rounded-xl p-4 border border-gray-200/50">
                                <label className="block text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1">
                                  <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                                  Dinner
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={medicine.dinner}
                                  onChange={(e) => updateMedicine(index, 'dinner', parseInt(e.target.value) || 0)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Meal Timing</label>
                              <select
                                value={medicine.mealTiming}
                                onChange={(e) => updateMedicine(index, 'mealTiming', e.target.value as 'before' | 'after')}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-emerald-500"
                              >
                                <option value="after">After Meal</option>
                                <option value="before">Before Meal</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (Days)</label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={medicine.duration}
                                  onChange={(e) => updateMedicine(index, 'duration', parseInt(e.target.value) || 1)}
                                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-emerald-500"
                                />
                                <div className="flex gap-1">
                                  {[7, 14, 30].map(d => (
                                    <button
                                      key={d}
                                      type="button"
                                      onClick={() => updateMedicine(index, 'duration', d)}
                                      className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg hover:bg-emerald-200"
                                    >
                                      {d}d
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Instructions</label>
                            <textarea
                              value={medicine.notes}
                              onChange={(e) => updateMedicine(index, 'notes', e.target.value)}
                              rows={2}
                              className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-emerald-500"
                              placeholder="Special instructions..."
                            />
                          </div>

                          <div className="mt-6 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setEditingIndex(null)}
                              className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all duration-200 shadow-md flex items-center gap-2"
                            >
                              <CheckIcon className="h-5 w-5" />
                              Add this Medicine
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-500 font-medium">Type & Dosage</p>
                            <p className="text-sm font-bold text-gray-900 capitalize">{medicine.type} - {medicine.dosage}{medicine.unit}</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-500 font-medium">Schedule</p>
                            <p className="text-sm font-bold text-gray-900">{medicine.morning} + {medicine.lunch} + {medicine.dinner} ({medicine.mealTiming})</p>
                          </div>
                          <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs text-gray-500 font-medium">Duration</p>
                            <p className="text-sm font-bold text-gray-900">{medicine.duration} Days</p>
                          </div>
                          {medicine.notes && (
                            <div className="bg-gray-50 rounded-xl p-3 lg:col-span-1">
                              <p className="text-xs text-gray-500 font-medium">Notes</p>
                              <p className="text-sm text-gray-900 truncate">{medicine.notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {!isReadOnly && userRole === 'doctor' && (
                  <button
                    type="button"
                    onClick={addMedicine}
                    className="w-full py-6 border-2 border-dashed border-slate-100 rounded-[24px] text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center">
                      <PlusIcon className="h-4 w-4 text-indigo-500" />
                    </div>
                    Append Pharmaceutical Record
                  </button>
                )}
              </div>
            )}
            
            {medicines.length === 0 && !isReadOnly && userRole === 'doctor' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-100 to-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DocumentTextIcon className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No medicines added yet</h3>
                <p className="text-gray-500 mb-6">Start by adding medicines to create a prescription</p>
                <button
                  type="button"
                  onClick={addMedicine}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-200 shadow-sm hover:shadow-md font-medium flex items-center gap-2 mx-auto"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add First Medicine
                </button>
              </div>
            )}
          </div>
        )}

        {/* Symptoms Tab */}
        {activeTab === 'symptoms' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <ClipboardDocumentListIcon className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight">Active Symptomatology</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Patient-reported clinical observations</p>
                </div>
              </div>
              {!isReadOnly && userRole === 'doctor' && (
                <button
                  type="button"
                  onClick={addSymptom}
                  className="px-5 py-2.5 bg-white border border-slate-100 text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4 text-amber-500" />
                  Log Symptom
                </button>
              )}
            </div>

            {symptoms.length > 0 ? (
              <div className="grid gap-3">
                {symptoms.map((symptom, index) => (
                  <div key={symptom.id} className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-sm group hover:border-amber-200 transition-all duration-300">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-[10px] font-black text-amber-600">
                          {String(index + 1).padStart(2, '0')}
                        </div>
                        <h5 className="text-sm font-black text-slate-900 uppercase tracking-widest">Observable Symptom</h5>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSymptom(symptom.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-all"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <textarea
                      value={symptom.description}
                      onChange={(e) => updateSymptom(symptom.id, e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-amber-500/20 focus:bg-white outline-none transition-all resize-none"
                      placeholder="Specify symptom details, duration, and intensity..."
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-[24px] border border-dashed border-slate-200">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <ClipboardDocumentListIcon className="h-6 w-6 text-slate-300" />
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No Symptoms Recorded</p>
              </div>
            )}
          </div>
        )}

        {/* Diagnosis Tab */}
        {activeTab === 'diagnosis' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-[20px] flex items-center justify-center">
                <BeakerIcon className="h-7 w-7 text-indigo-600" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">Clinical Assessment & Diagnosis</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Definitive medical evaluation findings</p>
              </div>
            </div>

            <div className="bg-white rounded-[24px] border border-slate-100 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <MagnifyingGlassIcon className="h-5 w-5 text-indigo-500" />
                <label className="text-sm font-black text-slate-900 uppercase tracking-widest">Primary Diagnosis</label>
              </div>
              <textarea
                {...form.register('diagnosis')}
                rows={8}
                className="w-full bg-slate-50 border border-slate-100 rounded-[20px] p-6 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white outline-none transition-all resize-none shadow-inner"
                placeholder="Enter finalized clinical diagnosis and secondary conditions..."
                disabled={isReadOnly}
              />
            </div>
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-[20px] flex items-center justify-center">
                <CheckIcon className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight">Clinical Recommendations</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifestyle changes and follow-up guidance</p>
              </div>
            </div>

            <div className="bg-white rounded-[24px] border border-slate-100 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <DocumentTextIcon className="h-5 w-5 text-emerald-600" />
                <label className="text-sm font-black text-slate-900 uppercase tracking-widest">General Suggestions</label>
              </div>
              <textarea
                {...form.register('suggestions')}
                rows={6}
                className="w-full bg-slate-50 border border-slate-100 rounded-[20px] p-6 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none transition-all resize-none shadow-inner"
                placeholder="Enter life-style instructions, dietary plans, and follow-up schedules..."
                disabled={isReadOnly}
              />
            </div>

            {/* ═══ EMERGENCY PROTOCOL ═══ */}
            <div className="bg-rose-50 border border-rose-100 rounded-[24px] p-8 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-full bg-rose-500/5 rotate-12 translate-x-12 translate-y-8" />
              <div className="flex items-center gap-4 mb-6 relative">
                <div className="w-12 h-12 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
                  <ExclamationTriangleIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-rose-900 tracking-tight uppercase tracking-wider">Emergency Instructions</h4>
                  <p className="text-xs font-bold text-rose-600 opacity-80 uppercase tracking-widest">Immediate Critical Response Protocol</p>
                </div>
              </div>
              <textarea
                rows={4}
                disabled={isReadOnly}
                className="w-full bg-white border border-rose-200 rounded-[20px] p-6 text-sm font-bold text-rose-900 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-300 outline-none transition-all resize-none shadow-sm placeholder:text-rose-300"
                placeholder="Enter emergency contact information and immediate critical action steps..."
              />
            </div>
          </div>
        )}

        {/* Tests Ordered Tab */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cyan-50 rounded-[20px] flex items-center justify-center">
                  <BeakerIcon className="h-7 w-7 text-cyan-600" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 tracking-tight">Diagnostic Investigations</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Laboratory & radiographic requisitions</p>
                </div>
              </div>
            </div>

            {/* ═══ LAB TEST SEARCH ═══ */}
            {!isReadOnly && userRole === 'doctor' && (
              <div className="bg-slate-900 rounded-[24px] p-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-full bg-cyan-500/10 -skew-x-12 translate-x-12" />
                <div className="relative flex flex-col md:flex-row items-center gap-6">
                  <div className="w-full relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-5 top-1/2 -translate-y-1/2 text-cyan-500" />
                    <input
                      type="text"
                      value={testSearchTerm}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTestSearchTerm(value);
                        setShowTestSearch(value.length > 0);
                      }}
                      placeholder="Search for validated laboratory tests..."
                      className="w-full bg-white/10 border border-white/10 rounded-2xl pl-14 pr-6 py-4 text-white text-sm font-bold placeholder:text-slate-500 focus:ring-2 focus:ring-cyan-500/30 focus:bg-white/20 outline-none transition-all"
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={addTest}
                    className="shrink-0 px-8 py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-50 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <PlusIcon className="h-4 w-4" /> Manual Add
                  </button>
                </div>

                {/* Search Results Overlay */}
                {showTestSearch && (
                  <div className="absolute z-50 left-8 right-8 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-80 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-300">
                    {labTestsLoading ? (
                      <div className="p-10 text-center">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Querying Lab Database...</p>
                      </div>
                    ) : availableLabTests && availableLabTests.length > 0 ? (
                      <div className="p-2 space-y-1">
                        {availableLabTests.map((labTest: any) => (
                          <button
                            key={labTest.id}
                            onClick={() => addTestFromSearch(labTest)}
                            className="w-full text-left p-4 hover:bg-slate-50 rounded-xl transition-all group flex items-center justify-between"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-black text-slate-900">{labTest.name}</span>
                                <span className="px-2 py-0.5 bg-cyan-50 text-cyan-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-cyan-100">
                                  {labTest.category}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 font-medium line-clamp-1">{labTest.description}</p>
                            </div>
                            <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all">
                              <span className="text-xs font-black text-indigo-600">{formatCurrency(labTest.price)}</span>
                              <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center">
                                <PlusIcon className="h-4 w-4" />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-10 text-center">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Zero Results Found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ═══ CURRENT TESTS REGISTRY ═══ */}
            {tests.length > 0 ? (
              <div className="grid gap-4">
                {tests.map((test) => (
                  <div key={test.id} className="bg-white rounded-[24px] border border-slate-100 p-6 shadow-sm hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                          <BeakerIcon className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div className="space-y-0.5">
                          <h5 className="text-sm font-black text-slate-900 uppercase tracking-widest">{test.name || 'Custom Lab Test'}</h5>
                          {test.category && (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-indigo-100">
                              {test.category}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {test.price && (
                          <span className="text-sm font-black text-slate-900">{formatCurrency(test.price)}</span>
                        )}
                        {!isReadOnly && userRole === 'doctor' && (
                          <button
                            type="button"
                            onClick={() => removeTest(test.id)}
                            className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-all shadow-sm"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Instructional Clarity</label>
                        <textarea
                          value={test.description}
                          onChange={(e) => updateTest(test.id, 'description', e.target.value)}
                          rows={3}
                          disabled={isReadOnly}
                          className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all resize-none shadow-inner"
                          placeholder="Specify exact test requirements, preparation guidelines, and urgent reporting instructions..."
                        />
                      </div>
                      
                      {!test.testId && !isReadOnly && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Manual Definition</label>
                          <input
                            type="text"
                            value={test.name}
                            onChange={(e) => updateTest(test.id, 'name', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-4 text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner"
                            placeholder="Enter manual test nomenclature..."
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                  <BeakerIcon className="h-8 w-8 text-slate-300" />
                </div>
                <h4 className="text-lg font-black text-slate-900 mb-2">Registry Empty</h4>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest max-w-xs mx-auto">No investigations requested for this clinical session</p>
              </div>
            )}
            
            {/* Manual Add Button */}
            {!isReadOnly && userRole === 'doctor' && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={addTest}
                  className="btn-primary text-sm flex items-center gap-2 flex-1 justify-center"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Manual Test
                </button>
              </div>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h4 className="text-md font-medium text-gray-900">Patient Lab Reports</h4>
            <p className="text-sm text-gray-600">View all lab test orders and prescription lab tests for this patient</p>
            
             {/* Patient Lab Reports */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                    <BeakerIcon className="h-5 w-5" />
                    Lab Test Orders
                  </h5>
                  
                  {/* Lab Test Orders */}
                  {patientLabOrders && patientLabOrders.length > 0 && (
                    <div className="mb-4">
                      <div className="space-y-3">
                        {patientLabOrders.slice(0, 3).map((order: any) => (
                          <div key={order.id} className="bg-white p-4 rounded border">
                            <div className="mb-3">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-medium text-sm text-gray-900">
                                    Order #{order.orderNumber}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Date: {new Date(order.createdAt).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Status: <span className={`px-2 py-1 rounded text-xs ${
                                      order.status === 'reported' ? 'bg-green-100 text-green-800' :
                                      order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                      order.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                                    </span>
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900">
                                    {order.testDetails?.length || 0} test{order.testDetails?.length !== 1 ? 's' : ''}
                                  </p>
                                  {order.totalAmount && (
                                    <p className="text-xs text-gray-600">
                                      {formatCurrency(order.totalAmount)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Individual Test Details */}
                            {order.testDetails && order.testDetails.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-gray-700 uppercase tracking-wide">Test Details</div>
                                {order.testDetails.map((test: any, index: number) => (
                                  <div key={index} className="bg-gray-50 p-3 rounded border-l-4 border-green-200">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <p className="font-medium text-sm text-gray-900">{test.name}</p>
                                        {test.description && (
                                          <p className="text-xs text-gray-600 mt-1">{test.description}</p>
                                        )}
                                        {test.category && (
                                          <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                            {test.category}
                                          </span>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">
                                          Ordered: {new Date(order.createdAt).toLocaleDateString()}
                                        </p>
                                      </div>
                                      <div className="text-right ml-3">
                                        <div className="flex flex-col items-end space-y-1">
                                          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                            Lab Test
                                          </span>
                                          {test.price && (
                                            <span className="text-xs text-gray-600">
                                              {formatCurrency(test.price)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Test Results/Files */}
                                    {(order.status === 'reported' || order.status === 'completed') && order.testReports && order.testReports.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-gray-200">
                                        <p className="text-xs font-medium text-gray-700 mb-1">Result Files:</p>
                                        <div className="space-y-1">
                                          {order.testReports.map((file: any, fileIndex: number) => (
                                            <div key={fileIndex} className="flex items-center justify-between bg-white p-2 rounded border">
                                              <div className="flex items-center space-x-2">
                                                <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                                                <span className="text-xs text-gray-900">{file.originalName || file.filename}</span>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  // Handle file download
                                                  const link = document.createElement('a');
                                                  link.href = `/uploads/lab-results/${file.filename}`;
                                                  link.download = file.originalName || file.filename;
                                                  link.click();
                                                }}
                                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                              >
                                                <ArrowDownTrayIcon className="h-3 w-3" />
                                                <span>Download</span>
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        {patientLabOrders.length > 3 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{patientLabOrders.length - 3} more orders
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Prescription Lab Tests */}
                  {patientPrescriptionLabTests && patientPrescriptionLabTests.length > 0 && (
                    <div className="mb-4">
                      <h6 className="font-medium text-gray-800 mb-2">Prescription Lab Tests</h6>
                      <div className="space-y-3">
                        {(showAllPrescriptions ? patientPrescriptionLabTests : patientPrescriptionLabTests.slice(0, 3)).map((prescription: any) => (
                          <div key={prescription.id} className="bg-white p-4 rounded border">
                            <div className="mb-3">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-medium text-sm text-gray-900">
                                    Prescription #{prescription.id}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Date: {new Date(prescription.createdAt).toLocaleDateString()}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Doctor: Dr. {prescription.appointment?.doctor?.user?.firstName} {prescription.appointment?.doctor?.user?.lastName}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900">
                                    {prescription.parsedTests?.length || 0} test{prescription.parsedTests?.length !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Individual Test Details */}
                            {prescription.parsedTests && prescription.parsedTests.length > 0 && (
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-gray-700 uppercase tracking-wide">Test Details</div>
                                {prescription.parsedTests.map((test: any, index: number) => (
                                  <div key={index} className="bg-gray-50 p-3 rounded border-l-4 border-blue-200">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <p className="font-medium text-sm text-gray-900">{test.name}</p>
                                        {test.description && (
                                          <p className="text-xs text-gray-600 mt-1">{test.description}</p>
                                        )}
                                        {test.category && (
                                          <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                            {test.category}
                                          </span>
                                        )}
                                        {test.takenDate && (
                                          <p className="text-xs text-gray-500 mt-1">
                                            Taken: {new Date(test.takenDate).toLocaleDateString()}
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right ml-3">
                                        <div className="flex flex-col items-end space-y-1">
                                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            test.status === 'reported' ? 'bg-green-100 text-green-800' :
                                            test.status === 'completed' ? 'bg-green-100 text-green-800' :
                                            test.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            test.status === 'ordered' ? 'bg-yellow-100 text-yellow-800' :
                                            test.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {test.status?.charAt(0).toUpperCase() + test.status?.slice(1) || 'Unknown'}
                                          </span>
                                          {test.price && (
                                            <span className="text-xs text-gray-600">
                                              {formatCurrency(test.price)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Test Results/Files */}
                                    {(test.status === 'reported' || test.status === 'completed' || test.status === 'confirmed') && test.resultFiles && test.resultFiles.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-gray-200">
                                        <p className="text-xs font-medium text-gray-700 mb-1">Result Files:</p>
                                        <div className="space-y-1">
                                          {test.resultFiles.map((file: any, fileIndex: number) => (
                                            <div key={fileIndex} className="flex items-center justify-between bg-white p-2 rounded border">
                                              <div className="flex items-center space-x-2">
                                                <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                                                <span className="text-xs text-gray-900">{file.originalName || file.filename}</span>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  // Handle file download
                                                  const link = document.createElement('a');
                                                  link.href = `/uploads/lab-results/${file.filename}`;
                                                  link.download = file.originalName || file.filename;
                                                  link.click();
                                                }}
                                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                              >
                                                <ArrowDownTrayIcon className="h-3 w-3" />
                                                <span>Download</span>
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        {patientPrescriptionLabTests.length > 3 && (
                          <button
                            type="button"
                            onClick={() => setShowAllPrescriptions(!showAllPrescriptions)}
                            className="text-xs text-blue-600 hover:text-blue-800 text-center w-full py-2 hover:bg-blue-50 rounded transition-colors"
                          >
                            {showAllPrescriptions 
                              ? 'Show Less' 
                              : `+${patientPrescriptionLabTests.length - 3} more prescriptions`
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Debug Information */}
                  {(labOrdersLoading || prescriptionLabTestsLoading) && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Loading lab reports...</p>
                    </div>
                  )}

                  {/* Error Information */}
                  {(labOrdersError || prescriptionLabTestsError) && (
                    <div className="text-center py-4">
                      <p className="text-sm text-red-500">Error loading lab reports</p>
                      <p className="text-xs text-gray-400">
                        {labOrdersError?.message || prescriptionLabTestsError?.message}
                      </p>
                    </div>
                  )}

                  {/* Debug Info */}
                  <div className="text-xs text-gray-400 mb-2">
                    Patient ID: {appointmentData?.patient?.id} | 
                    Lab Orders: {patientLabOrders?.length || 0} | 
                    Prescription Tests: {patientPrescriptionLabTests?.length || 0}
                  </div>

                  {/* No Lab Reports */}
                  {!labOrdersLoading && !prescriptionLabTestsLoading && 
                   !labOrdersError && !prescriptionLabTestsError &&
                   (!patientLabOrders || patientLabOrders.length === 0) && 
                   (!patientPrescriptionLabTests || patientPrescriptionLabTests.length === 0) && (
                    <div className="text-center py-4">
                      <BeakerIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No lab reports found</p>
                      <p className="text-xs text-gray-400">Patient has no lab test orders or prescription lab tests</p>
                    </div>
                  )}
                 </div>
            
            {/* Test Status Overview */}
            {tests.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <BeakerIcon className="h-5 w-5" />
                  Current Test Status
                </h5>
                <div className="space-y-2">
                  {tests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="text-sm">{test.name}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        test.status === 'ordered' ? 'bg-yellow-100 text-yellow-800' :
                        test.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        test.status === 'done' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {test.status.charAt(0).toUpperCase() + test.status.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reports Upload Section - Admin Only */}
            {userRole === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Test Reports</label>
                <textarea
                  {...form.register('reports')}
                  rows={6}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Test reports can be uploaded here. Reports can include images, PDFs, and other formats..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Note: Only administrators can upload test reports.
                </p>
              </div>
            )}
            
          </div>
        )}

        {/* ═══ ACTION BUTTONS ═══ */}
        {!isReadOnly && userRole === 'doctor' && (
          <div className="bg-slate-50 border-t border-slate-100 p-8 rounded-b-[32px] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">
                <ShieldCheckIcon className="h-5 w-5 text-emerald-500" />
              </div>
              <p className="text-xs font-bold text-slate-500">Clinical session will be finalized upon submission.</p>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5" />
                  Finalize Prescription
                </>
              )}
            </button>
          </div>
        )}
        
        {isReadOnly && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200/50 p-6 -mx-6 -mb-6 rounded-b-2xl">
            <div className="bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <ExclamationTriangleIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-amber-800 font-semibold">
                    Prescription Completed
                  </p>
                  <p className="text-amber-700 text-sm">
                    This prescription has been finalized and cannot be edited.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </motion.div>
  );
};

export default PrescriptionInterface;
