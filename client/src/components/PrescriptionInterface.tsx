import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '../services/paymentService';
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
  const [activeTab, setActiveTab] = useState<'medicines' | 'symptoms' | 'diagnosis' | 'suggestions' | 'tests' | 'reports'>('medicines');
  const [testSearchTerm, setTestSearchTerm] = useState('');
  const [showTestSearch, setShowTestSearch] = useState(false);

  const form = useForm<PrescriptionFormData>({
    defaultValues: {
      medicines: '',
      symptoms: '',
      diagnosis: '',
      suggestions: '',
      tests: '',
      reports: '',
      exercises: '',
      dietaryChanges: ''
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
      const response = await axios.get(`/lab-tests/tests?${params}`);
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
      const response = await axios.get(`/appointments/${appointmentId}`);
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
        const response = await axios.get(`/lab-tests/patients/${currentPatientId}/lab-reports`, {
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
        const response = await axios.get(`/lab-tests/patients/${currentPatientId}/prescription-lab-tests`, {
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
        const response = await axios.get(`/prescriptions/appointment/${appointmentId}`);
        const prescription = response.data.data.prescription;
        
        if (prescription) {
          form.setValue('symptoms', prescription.symptoms || '');
          form.setValue('diagnosis', prescription.diagnosis || '');
          form.setValue('suggestions', prescription.suggestions || '');
          
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
          const response = await axios.get(`/medicines/doctors/patients/${patientId}/medicines?status=active`);
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
          const prescriptionResponse = await axios.get(`/lab-tests/patients/${patientId}/prescription-lab-tests`);
          const prescriptionTests = prescriptionResponse.data.data.prescriptions || [];
          
          // Fetch regular lab orders using doctor endpoint
          const labOrdersResponse = await axios.get(`/lab-tests/patients/${patientId}/lab-reports`);
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
      await axios.post(`/medicines/medicines/${medicineId}/discontinue`, {
        reason: 'Doctor discontinued during appointment',
        notes: 'Discontinued during prescription review'
      });
      
      toast.success('Medicine discontinued successfully');
      
      // Refresh existing medicines list
      if (patientId) {
        const response = await axios.get(`/medicines/doctors/patients/${patientId}/medicines?status=active`);
        setExistingMedicines(response.data.data || []);
      }
    } catch (error) {
      toast.error('Failed to discontinue medicine');
      console.error('Error discontinuing medicine:', error);
    }
  };

  const downloadReport = async (report: TestReport) => {
    try {
      const response = await axios.get(`/admin/test-reports/${report.id}/download`, {
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
          lifestyleModifications: data.suggestions
        }),
        tests: tests.length > 0 ? JSON.stringify(tests) : data.tests,
        testReports: data.reports
      };

      await axios.post(`/prescriptions/appointment/${appointmentId}`, prescriptionData);
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
          followUps,
          emergencyInstructions,
          exercises: formData.suggestions
        }),
        tests: tests.length > 0 ? JSON.stringify(tests) : formData.tests,
        testReports: formData.reports
      };

      await axios.post(`/prescriptions/appointment/${appointmentId}`, prescriptionData);
      
      // Complete the prescription
      await axios.put(`/prescriptions/appointment/${appointmentId}/complete`);
      
      toast.success('Appointment completed successfully!');
      onComplete();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete appointment');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'medicines', name: 'Medicines', icon: DocumentTextIcon },
    { id: 'symptoms', name: 'Symptoms', icon: ClipboardDocumentListIcon },
    { id: 'diagnosis', name: 'Diagnosis', icon: BeakerIcon },
    { id: 'suggestions', name: 'Recommendations', icon: CheckIcon },
    { id: 'tests', name: 'Lab Tests', icon: BeakerIcon },
    { id: 'reports', name: 'Reports', icon: DocumentTextIcon }
  ];

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
      {/* Modern Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <DocumentTextIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Prescription Management</h3>
              <p className="text-emerald-100 text-sm">Record patient symptoms, diagnosis, and treatment plan</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Active Session</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Tab Navigation */}
      <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-200/50">
        <div className="px-6">
          <nav className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`relative px-4 py-3 font-medium text-sm flex items-center gap-2 rounded-t-xl transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white text-emerald-600 shadow-sm border border-gray-200/50 border-b-0'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-emerald-600' : 'text-gray-500'}`} />
                  <span className="hidden sm:inline">{tab.name}</span>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-8">
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
                  <h5 className="text-lg font-semibold text-gray-900">New Medicines</h5>
                </div>

                <div className="grid gap-6">
                  {medicines.map((medicine, index) => (
                    <div key={index} className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200/50 rounded-2xl p-6 hover:shadow-md transition-all duration-200">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{index + 1}</span>
                          </div>
                          <h5 className="text-lg font-bold text-gray-900">Medicine {index + 1}</h5>
                        </div>
                        {!isReadOnly && userRole === 'doctor' && (
                          <button
                            type="button"
                            onClick={() => removeMedicine(index)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all duration-200"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Medicine Name</label>
                          <input
                            type="text"
                            value={medicine.name}
                            onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                            disabled={isReadOnly}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
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
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
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
                              disabled={isReadOnly}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
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
                              disabled={isReadOnly}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
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
                              disabled={isReadOnly}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Meal Timing</label>
                        <select
                          value={medicine.mealTiming}
                          onChange={(e) => updateMedicine(index, 'mealTiming', e.target.value as 'before' | 'after')}
                          disabled={isReadOnly}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          <option value="after">After Meal</option>
                          <option value="before">Before Meal</option>
                        </select>
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Duration (Days)</label>
                        <div className="flex gap-3 mb-4">
                          <input
                            type="number"
                            min="1"
                            max="365"
                            value={medicine.duration}
                            onChange={(e) => updateMedicine(index, 'duration', parseInt(e.target.value) || 1)}
                            disabled={isReadOnly}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
                            placeholder="Enter number of days"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => updateMedicine(index, 'duration', 7)}
                              disabled={isReadOnly}
                              className="px-3 py-3 text-sm bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 disabled:opacity-50 transition-all duration-200 hover:scale-105 font-medium"
                            >
                              7d
                            </button>
                            <button
                              type="button"
                              onClick={() => updateMedicine(index, 'duration', 14)}
                              disabled={isReadOnly}
                              className="px-3 py-3 text-sm bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 disabled:opacity-50 transition-all duration-200 hover:scale-105 font-medium"
                            >
                              14d
                            </button>
                            <button
                              type="button"
                              onClick={() => updateMedicine(index, 'duration', 30)}
                              disabled={isReadOnly}
                              className="px-3 py-3 text-sm bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 disabled:opacity-50 transition-all duration-200 hover:scale-105 font-medium"
                            >
                              30d
                            </button>
                          </div>
                        </div>
                        {medicine.duration > 0 && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div>
                                <p className="font-semibold text-blue-800">Course Duration</p>
                                <p className="text-blue-700">{medicine.duration} day{medicine.duration !== 1 ? 's' : ''}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-blue-800">Start Date</p>
                                <p className="text-blue-700">{new Date().toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-blue-800">End Date</p>
                                <p className="text-blue-700">{new Date(Date.now() + medicine.duration * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label>
                        <textarea
                          value={medicine.notes}
                          onChange={(e) => updateMedicine(index, 'notes', e.target.value)}
                          rows={3}
                          disabled={isReadOnly}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
                          placeholder="Special instructions, side effects, etc..."
                        />
                      </div>

                      {medicine.name && medicine.dosage && (
                        <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border-l-4 border-emerald-400">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <CheckIcon className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-bold text-emerald-800 mb-2">
                                {medicine.name} {medicine.dosage}{medicine.unit}
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-emerald-700">
                                <p><strong>Schedule:</strong> {medicine.morning}+{medicine.lunch}+{medicine.dinner} ({medicine.mealTiming} meal)</p>
                                {medicine.duration > 0 && (
                                  <p><strong>Duration:</strong> {medicine.duration} day{medicine.duration !== 1 ? 's' : ''}</p>
                                )}
                                <p><strong>Start:</strong> {new Date().toLocaleDateString()}</p>
                                {medicine.duration > 0 && (
                                  <p><strong>End:</strong> {new Date(Date.now() + medicine.duration * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                                )}
                              </div>
                              {medicine.notes && (
                                <p className="text-xs text-emerald-600 mt-2 italic">
                                  Notes: {medicine.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium flex items-center gap-2 mx-auto"
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
                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <ClipboardDocumentListIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Patient Symptoms</h4>
                  <p className="text-sm text-gray-600">Record and manage patient symptoms</p>
                </div>
              </div>
              {!isReadOnly && userRole === 'doctor' && (
                <button
                  type="button"
                  onClick={addSymptom}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Symptom
                </button>
              )}
            </div>

            {symptoms.length > 0 ? (
              <div className="grid gap-4">
                {symptoms.map((symptom, index) => (
                  <div key={symptom.id} className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-2xl p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                        <h5 className="text-lg font-bold text-gray-900">Symptom {index + 1}</h5>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSymptom(symptom.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all duration-200"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <textarea
                      value={symptom.description}
                      onChange={(e) => updateSymptom(symptom.id, e.target.value)}
                      rows={3}
                      disabled={isReadOnly}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 resize-none"
                      placeholder="Describe the symptom in detail..."
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ClipboardDocumentListIcon className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No symptoms recorded</h3>
                <p className="text-gray-500 mb-6">Add symptoms to track the patient's condition</p>
                {!isReadOnly && userRole === 'doctor' && (
                  <button
                    type="button"
                    onClick={addSymptom}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium flex items-center gap-2 mx-auto"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Add First Symptom
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Diagnosis Tab */}
        {activeTab === 'diagnosis' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-violet-500 rounded-xl flex items-center justify-center">
                  <BeakerIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Diagnosis</h4>
                  <p className="text-sm text-gray-600">Record medical diagnoses and assessments</p>
                </div>
              </div>
              {!isReadOnly && userRole === 'doctor' && (
                <button
                  type="button"
                  onClick={addDiagnosis}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-xl hover:from-purple-600 hover:to-violet-600 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium flex items-center gap-2"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Diagnosis
                </button>
              )}
            </div>

            {diagnoses.length > 0 ? (
              <div className="grid gap-4">
                {diagnoses.map((diagnosis, index) => (
                  <div key={diagnosis.id} className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200/50 rounded-2xl p-6 hover:shadow-md transition-all duration-200">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-bold text-sm">{index + 1}</span>
                        </div>
                        <h5 className="text-lg font-bold text-gray-900">Diagnosis {index + 1}</h5>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDiagnosis(diagnosis.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all duration-200"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="h-5 w-5 text-purple-600" />
                        <input
                          type="date"
                          value={diagnosis.date}
                          onChange={(e) => updateDiagnosis(diagnosis.id, 'date', e.target.value)}
                          disabled={isReadOnly}
                          className="px-4 py-2 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
                        />
                      </div>
                      <textarea
                        value={diagnosis.description}
                        onChange={(e) => updateDiagnosis(diagnosis.id, 'description', e.target.value)}
                        rows={4}
                        disabled={isReadOnly}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 resize-none"
                        placeholder="Enter detailed diagnosis information..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-violet-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BeakerIcon className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No diagnosis recorded</h3>
                <p className="text-gray-500 mb-6">Add medical diagnoses based on symptoms and examination</p>
                {!isReadOnly && userRole === 'doctor' && (
                  <button
                    type="button"
                    onClick={addDiagnosis}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-xl hover:from-purple-600 hover:to-violet-600 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium flex items-center gap-2 mx-auto"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Add First Diagnosis
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Suggestions Tab */}
        {activeTab === 'suggestions' && (
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center">
                <CheckIcon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-gray-900">Treatment Recommendations</h4>
                <p className="text-sm text-gray-600">Provide comprehensive care instructions</p>
              </div>
            </div>

            {/* Exercises Section */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <StarIcon className="h-4 w-4 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Exercise Recommendations</h4>
              </div>
              <textarea
                {...form.register('exercises')}
                rows={4}
                disabled={isReadOnly}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 resize-none"
                placeholder="Enter specific exercise recommendations and routines..."
              />
            </div>

            {/* Dietary Changes Section */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                  <HeartIcon className="h-4 w-4 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Dietary Modifications</h4>
              </div>
              <textarea
                {...form.register('dietaryChanges')}
                rows={4}
                disabled={isReadOnly}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 resize-none"
                placeholder="Enter dietary changes and nutritional recommendations..."
              />
            </div>

            {/* Lifestyle Modifications Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <ArrowPathIcon className="h-4 w-4 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Lifestyle Modifications</h4>
              </div>
              <textarea
                {...form.register('suggestions')}
                rows={4}
                disabled={isReadOnly}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 resize-none"
                placeholder="Enter lifestyle changes and behavioral modifications..."
              />
            </div>

            {/* Follow-up Section */}
            <div className="bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-violet-500 rounded-lg flex items-center justify-center">
                  <CalendarIcon className="h-4 w-4 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Follow-up Instructions</h4>
              </div>
              <textarea
                rows={4}
                disabled={isReadOnly}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 resize-none"
                placeholder="Enter follow-up appointment schedule and instructions..."
              />
            </div>

            {/* Emergency Instructions Section */}
            <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-rose-500 rounded-lg flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-4 w-4 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900">Emergency Instructions</h4>
              </div>
              <textarea
                rows={4}
                disabled={isReadOnly}
                className="w-full px-4 py-3 border border-red-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200 resize-none"
                placeholder="Enter emergency contact information and immediate action steps..."
              />
            </div>
          </div>
        )}

        {/* Tests Ordered Tab */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <BeakerIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Tests Ordered</h4>
                  <p className="text-sm text-gray-600">Manage laboratory tests and diagnostics</p>
                </div>
              </div>
            </div>

            {/* Search and Add Tests */}
            {!isReadOnly && userRole === 'doctor' && (
              <div className="space-y-6">
                {/* Search Input */}
                <div className="bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200/50 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center">
                      <MagnifyingGlassIcon className="h-4 w-4 text-white" />
                    </div>
                    <h5 className="text-lg font-semibold text-gray-900">Search Lab Tests</h5>
                  </div>
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={testSearchTerm}
                      onChange={(e) => {
                        const value = e.target.value;
                        console.log('Search term changed:', value);
                        setTestSearchTerm(value);
                        setShowTestSearch(value.length > 0);
                      }}
                      placeholder="Search for lab tests..."
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Search Results */}
                {showTestSearch && (
                  <div className="bg-white border border-cyan-200/50 rounded-2xl max-h-80 overflow-y-auto shadow-lg">
                    {labTestsLoading ? (
                      <div className="p-6 text-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
                          <BeakerIcon className="h-4 w-4 text-white" />
                        </div>
                        <p className="text-gray-600 font-medium">Loading tests...</p>
                      </div>
                    ) : availableLabTests && availableLabTests.length > 0 ? (
                      <div className="p-4">
                        <h6 className="text-sm font-semibold text-gray-700 mb-3">Available Tests ({availableLabTests.length})</h6>
                        <div className="space-y-3">
                          {availableLabTests.map((labTest: any) => (
                            <div
                              key={labTest.id}
                              className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-200/50 rounded-xl hover:shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                              onClick={() => addTestFromSearch(labTest)}
                            >
                              <div className="flex-1">
                                <h5 className="font-bold text-gray-900 mb-1">{labTest.name}</h5>
                                <p className="text-sm text-gray-600 mb-2">{labTest.description}</p>
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800">
                                    {labTest.category}
                                  </span>
                                  {labTest.price && (
                                    <span className="text-xs font-semibold text-gray-700">
                                      {formatCurrency(labTest.price)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="ml-4 p-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors duration-200">
                                <PlusIcon className="h-4 w-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <BeakerIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-medium">No tests found</p>
                        <p className="text-sm text-gray-500">Try a different search term</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Current Tests List */}
            {tests.length > 0 ? (
              <div className="space-y-3">
                {tests.map((test) => (
                  <div key={test.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900">{test.name || 'Test'}</h5>
                        {test.category && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                            {test.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {test.price && (
                          <span className="text-sm font-medium text-gray-700">{formatCurrency(test.price)}</span>
                        )}
                        {!isReadOnly && userRole === 'doctor' && (
                          <button
                            type="button"
                            onClick={() => removeTest(test.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Test Name</label>
                        <input
                          type="text"
                          value={test.name}
                          onChange={(e) => updateTest(test.id, 'name', e.target.value)}
                          disabled={isReadOnly || !!test.testId}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="e.g., Blood Test, X-Ray"
                        />
                        {test.testId && (
                          <p className="text-xs text-gray-500 mt-1">This test is from our lab test database</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          value={test.description}
                          onChange={(e) => updateTest(test.id, 'description', e.target.value)}
                          rows={3}
                          disabled={isReadOnly}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                          placeholder="Describe the test requirements..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BeakerIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>No tests added yet. Search above to add from available tests or add manually.</p>
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

        {/* Action Buttons */}
        {!isReadOnly && userRole === 'doctor' && (
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-t border-gray-200/50 p-6 -mx-6 -mb-6 rounded-b-2xl">
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-5 w-5" />
                    Save Prescription
                  </>
                )}
              </button>
            </div>
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
    </div>
  );
};

export default PrescriptionInterface;
