import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import API from '../api/api';
import toast from 'react-hot-toast';
import { 
  ChevronDownIcon, 
  PlusIcon, 
  XMarkIcon,
  UserIcon,
  HeartIcon,
  ShieldCheckIcon,
  PhoneIcon,
  HomeIcon,
  CalendarIcon,
  IdentificationIcon,
  CameraIcon,
  CheckCircleIcon,
  PencilIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import WeeklyLifestyleAssessment from '../components/WeeklyLifestyleAssessment';


// Comprehensive list of common allergies
const COMMON_ALLERGIES = [
  // Food Allergies
  'Peanuts', 'Tree nuts', 'Shellfish', 'Fish', 'Eggs', 'Milk', 'Soy', 'Wheat', 'Sesame seeds',
  'Gluten', 'Lactose', 'Citrus fruits', 'Strawberries', 'Tomatoes', 'Chocolate', 'Sulfites',
  
  // Medication Allergies
  'Penicillin', 'Amoxicillin', 'Sulfonamides', 'NSAIDs (aspirin, ibuprofen)', 'Codeine', 
  'Morphine', 'Sulfasalazine', 'Tetracycline', 'Erythromycin', 'Vancomycin', 'Polymyxin',
  
  // Environmental Allergies
  'Pollen', 'Dust mites', 'Pet dander', 'Mold spores', 'Grass pollen', 'Tree pollen',
  'Weed pollen', 'Hay fever', 'Ragweed', 'Bee venom', 'Wasp venom', 'Ant venom',
  
  // Contact Allergies
  'Latex', 'Nickel', 'Parabens', 'Formaldehyde', 'Fragrances', 'Perfumes', 'Detergents',
  'Rubber', 'Leather', 'Metal jewelry', 'Cosmetics', 'Hair dyes', 'Fabric softeners',
  
  // Insect Allergies
  'Bee stings', 'Wasp stings', 'Ant bites', 'Mosquito bites', 'Tick bites', 'Flea bites',
  
  // Other Common Allergies
  'Insect repellent', 'Sunlight (photosensitivity)', 'Cold temperature', 'Heat',
  'Exercise-induced', 'Food additives', 'Artificial colors', 'Preservatives'
];


const PatientProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingMedical, setIsEditingMedical] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Allergy management state
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [showAllergyDropdown, setShowAllergyDropdown] = useState(false);
  const [allergySearch, setAllergySearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [assessmentStatus, setAssessmentStatus] = useState<any>(null);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  
  // Patient medical data state
  const [patientData, setPatientData] = useState({
    bloodType: '',
    allergies: '',
    emergencyContact: '',
    emergencyPhone: '',
    insuranceProvider: '',
    insuranceNumber: '',
    profileImage: '',
    // New fields
    height: '',
    weight: '',
    bloodPressure: '',
    pulse: '',
    chronicConditions: '',
    pastSurgeries: '',
    familyMedicalHistory: '',
    smokingStatus: '',
    alcoholConsumption: '',
    physicalActivity: ''
  });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Medical Documents State
  const [medicalDocuments, setMedicalDocuments] = useState<any[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Lab Report');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAllergyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch patient data on component mount
  const fetchPatientData = async () => {
    try {
      const response = await API.get('/patients/profile');
      const data = response.data.data.patient;
      console.log('Fetched patient data:', data);
      
      const pData = {
        bloodType: data.bloodType || '',
        allergies: data.allergies || '',
        emergencyContact: data.emergencyContact || '',
        emergencyPhone: data.emergencyPhone || '',
        insuranceProvider: data.insuranceProvider || '',
        insuranceNumber: data.insuranceNumber || '',
        profileImage: data.profileImage || '',
        height: data.height || '',
        weight: data.weight || '',
        bloodPressure: data.bloodPressure || '',
        pulse: data.pulse || '',
        chronicConditions: data.chronicConditions || '',
        pastSurgeries: data.pastSurgeries || '',
        familyMedicalHistory: data.familyMedicalHistory || '',
        smokingStatus: data.smokingStatus || '',
        alcoholConsumption: data.alcoholConsumption || '',
        physicalActivity: data.physicalActivity || ''
      };
      
      setPatientData(pData);
      setMedicalDocuments(data.medicalDocuments || []);
      
      // Parse allergies string into array for selected allergies display
      const parsedAllergies = data.allergies ? data.allergies.split(', ').filter((a: string) => a.trim()) : [];
      setSelectedAllergies(parsedAllergies);
      setPatientId(data.id);
      
      try {
        const assessmentRes = await API.get(`/patients/${data.id}/lifestyle-assessment/status`);
        setAssessmentStatus(assessmentRes.data.data);
      } catch(e) {
        console.error('Assessment status fetch failed', e);
      }
      
      // Pre-fill forms!
      medicalForm.reset({
        ...pData,
        allergies: parsedAllergies,
        customAllergies: ''
      });
      
    } catch (error) {
      console.error('Failed to fetch patient data:', error);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, []);

  const profileForm = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth || '',
      gender: user?.gender,
      address: user?.address || '',
    },
  });

  const medicalForm = useForm<{
    bloodType: string;
    allergies: string[];
    customAllergies: string;
    emergencyContact: string;
    emergencyPhone: string;
    insuranceProvider: string;
    insuranceNumber: string;
    height: string;
    weight: string;
    bloodPressure: string;
    pulse: string;
    chronicConditions: string;
    pastSurgeries: string;
    familyMedicalHistory: string;
    smokingStatus: string;
    alcoholConsumption: string;
    physicalActivity: string;
  }>({
    defaultValues: {
      bloodType: '',
      allergies: [] as string[],
      customAllergies: '',
      emergencyContact: '',
      emergencyPhone: '',
      insuranceProvider: '',
      insuranceNumber: '',
      height: '',
      weight: '',
      bloodPressure: '',
      pulse: '',
      chronicConditions: '',
      pastSurgeries: '',
      familyMedicalHistory: '',
      smokingStatus: '',
      alcoholConsumption: '',
      physicalActivity: ''
    },
  });

  // Effect to reset medical form when entering edit mode to ensure it has latest data
  useEffect(() => {
    if (isEditingMedical) {
      medicalForm.reset({
        bloodType: patientData.bloodType,
        allergies: selectedAllergies,
        customAllergies: '',
        emergencyContact: patientData.emergencyContact,
        emergencyPhone: patientData.emergencyPhone,
        insuranceProvider: patientData.insuranceProvider,
        insuranceNumber: patientData.insuranceNumber,
        height: patientData.height,
        weight: patientData.weight,
        bloodPressure: patientData.bloodPressure,
        pulse: patientData.pulse,
        chronicConditions: patientData.chronicConditions,
        pastSurgeries: patientData.pastSurgeries,
        familyMedicalHistory: patientData.familyMedicalHistory,
        smokingStatus: patientData.smokingStatus,
        alcoholConsumption: patientData.alcoholConsumption,
        physicalActivity: patientData.physicalActivity
      });
    }
  }, [isEditingMedical, patientData, selectedAllergies, medicalForm]);


  // Handle image upload
  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await API.post('/patients/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setPatientData(prev => ({
          ...prev,
          profileImage: response.data.data.imageUrl
        }));
        
        toast.success('Image uploaded successfully!');
        window.location.reload();
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDocUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedMimeTypes = [
      'application/pdf', 
      'image/jpeg', 'image/jpg', 'image/png',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/dicom', 'application/x-dicom', 'application/octet-stream'
    ];

    if (!allowedMimeTypes.includes(file.type) && !file.name.endsWith('.dcm') && !file.name.endsWith('.dicom')) {
      toast.error('Supported formats: Images, PDF, Word, Excel, and Medical Imaging (DICOM)');
      return;
    }

    if (!docName.trim()) {
      toast.error('Please enter a document name first');
      return;
    }

    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentName', docName);
      formData.append('documentType', docType);

      const response = await API.post('/patients/upload-document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setMedicalDocuments([...medicalDocuments, response.data.data.document]);
        toast.success('Document uploaded successfully!');
        setDocName('');
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Document upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload document');
    } finally {
      setIsUploadingDoc(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  // Filter allergies based on search
  const filteredAllergies = COMMON_ALLERGIES.filter(allergy =>
    allergy.toLowerCase().includes(allergySearch.toLowerCase()) &&
    !selectedAllergies.includes(allergy)
  );

  // Add allergy to selected list
  const addAllergy = (allergy: string) => {
    if (!selectedAllergies.includes(allergy)) {
      setSelectedAllergies([...selectedAllergies, allergy]);
      medicalForm.setValue('allergies', [...selectedAllergies, allergy]);
    }
    setAllergySearch('');
  };

  // Remove allergy from selected list
  const removeAllergy = (allergy: string) => {
    const updatedAllergies = selectedAllergies.filter(a => a !== allergy);
    setSelectedAllergies(updatedAllergies);
    medicalForm.setValue('allergies', updatedAllergies);
  };

  // Add custom allergy
  const addCustomAllergy = () => {
    if (customAllergy.trim() && !selectedAllergies.includes(customAllergy.trim())) {
      addAllergy(customAllergy.trim());
      setCustomAllergy('');
      medicalForm.setValue('customAllergies', '');
    }
  };

  const onSubmitProfile = async (data: any) => {
    setIsLoading(true);
    try {
      await API.put('/auth/profile', data);
      toast.success('Profile updated successfully!');
      setIsEditingProfile(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitMedical = async (data: any) => {
    setIsLoading(true);
    try {
      const medicalData = {
        ...data,
        allergies: selectedAllergies.length > 0 ? selectedAllergies.join(', ') : ''
      };
      
      await API.put('/patients/profile', medicalData);
      toast.success('Medical information updated successfully!');
      setIsEditingMedical(false);
      await fetchPatientData();
    } catch (error: any) {
      console.error('Submit medical error:', error);
      const errMsg = error.response?.data?.message || 'Failed to update medical information';
      const detail = error.response?.data?.error ? `: ${error.response.data.error}` : '';
      toast.error(`${errMsg}${detail}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center">
                  <UserIcon className="h-10 w-10 mr-3" />
                  Patient Profile
                </h1>
                <p className="text-indigo-100 text-lg">Manage personal and medical details.</p>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <img src="/logo.png" className="h-12 w-12" alt="Livora Logo" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 1: Profile Image & Personal Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 h-full">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg p-3 text-white mr-3">
                  <CameraIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Profile Image</h3>
                </div>
              </div>
              <div className="text-center">
                {user?.profileImage || patientData.profileImage ? (
                  <img src={user?.profileImage || patientData.profileImage} className="h-40 w-40 rounded-2xl object-cover mx-auto mb-6 shadow-lg border-4 border-white" alt="Profile" />
                ) : (
                  <div className="h-40 w-40 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6"><UserIcon className="h-20 w-20 text-gray-400" /></div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <button onClick={handleImageUpload} disabled={isUploading} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium">{isUploading ? 'Uploading...' : 'Upload Image'}</button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center"><IdentificationIcon className="h-6 w-6 mr-2 text-indigo-600" />Personal Information</h3>
                {!isEditingProfile && <button onClick={() => setIsEditingProfile(true)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><PencilIcon className="h-5 w-5" /></button>}
              </div>

              {isEditingProfile ? (
                <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input {...profileForm.register('firstName')} className="w-full px-4 py-3 border rounded-xl" placeholder="First Name" />
                    <input {...profileForm.register('lastName')} className="w-full px-4 py-3 border rounded-xl" placeholder="Last Name" />
                    <div className="px-4 py-3 bg-gray-100 rounded-xl text-gray-600">{user?.email}</div>
                    <input {...profileForm.register('phone')} className="w-full px-4 py-3 border rounded-xl" placeholder="Phone" />
                    <input {...profileForm.register('dateOfBirth')} type="date" className="w-full px-4 py-3 border rounded-xl" />
                    <select {...profileForm.register('gender')} className="w-full px-4 py-3 border rounded-xl">
                      <option value="">Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <textarea {...profileForm.register('address')} rows={3} className="w-full px-4 py-3 border rounded-xl" placeholder="Address" />
                  <div className="flex gap-4"><button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-semibold">Save</button><button type="button" onClick={() => setIsEditingProfile(false)} className="px-6 py-3 border rounded-xl">Cancel</button></div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-4 rounded-xl"><label className="block text-sm font-semibold text-gray-700">First Name</label><p className="text-lg font-medium">{user?.firstName}</p></div>
                  <div className="bg-emerald-50 p-4 rounded-xl"><label className="block text-sm font-semibold text-gray-700">Last Name</label><p className="text-lg font-medium">{user?.lastName}</p></div>
                  <div className="bg-purple-50 p-4 rounded-xl"><label className="block text-sm font-semibold text-gray-700">Email</label><p className="text-lg font-medium">{user?.email}</p></div>
                  <div className="bg-amber-50 p-4 rounded-xl"><label className="block text-sm font-semibold text-gray-700">Phone</label><p className="text-lg font-medium">{user?.phone || 'N/A'}</p></div>
                  <div className="bg-rose-50 p-4 rounded-xl"><label className="block text-sm font-semibold text-gray-700">Birth Date</label><p className="text-lg font-medium">{user?.dateOfBirth || 'N/A'}</p></div>
                  <div className="bg-teal-50 p-4 rounded-xl"><label className="block text-sm font-semibold text-gray-700">Gender</label><p className="text-lg font-medium capitalize">{user?.gender || 'N/A'}</p></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Medical Info & Documents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50 h-full">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                    <HeartIcon className="h-8 w-8 mr-3 text-rose-600" />
                    Medical Information
                  </h3>
                  <p className="text-gray-500 mt-1">Detailed health and clinical records.</p>
                </div>
                {!isEditingMedical && (
                  <button 
                    onClick={() => setIsEditingMedical(true)} 
                    className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-semibold hover:bg-rose-100 transition-colors"
                  >
                    <PencilIcon className="h-5 w-5" />
                    Edit Info
                  </button>
                )}
              </div>

              {isEditingMedical ? (
                <form onSubmit={medicalForm.handleSubmit(onSubmitMedical)} className="space-y-8">
                  {/* Subsection: Vitals & Body Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-700 flex items-center gap-2">
                        <ShieldCheckIcon className="h-5 w-5 text-blue-500" />
                        Vitals & Metrics
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Blood Type</label>
                          <select {...medicalForm.register('bloodType')} className="w-full px-4 py-2 border rounded-xl bg-white">
                            <option value="">Select</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Blood Pressure</label>
                          <input {...medicalForm.register('bloodPressure')} placeholder="e.g. 120/80" className="w-full px-4 py-2 border rounded-xl bg-white" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Height (cm)</label>
                          <input {...medicalForm.register('height')} type="number" step="0.1" className="w-full px-4 py-2 border rounded-xl bg-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Weight (kg)</label>
                          <input {...medicalForm.register('weight')} type="number" step="0.1" className="w-full px-4 py-2 border rounded-xl bg-white" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Pulse (bpm)</label>
                        <input {...medicalForm.register('pulse')} type="number" className="w-full px-4 py-2 border rounded-xl bg-white" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-700 flex items-center gap-2">
                        <DocumentTextIcon className="h-5 w-5 text-indigo-500" />
                        Insurance Details
                      </h4>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Provider</label>
                        <input {...medicalForm.register('insuranceProvider')} className="w-full px-4 py-2 border rounded-xl bg-white" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Policy Number</label>
                        <input {...medicalForm.register('insuranceNumber')} className="w-full px-4 py-2 border rounded-xl bg-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Emergency Contact</label>
                          <input {...medicalForm.register('emergencyContact')} className="w-full px-4 py-2 border rounded-xl bg-white" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Emergency Phone</label>
                          <input {...medicalForm.register('emergencyPhone')} className="w-full px-4 py-2 border rounded-xl bg-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subsection: Allergies */}
                  <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-100">
                    <h4 className="font-bold text-gray-700 flex items-center gap-2 mb-4">
                      <ShieldCheckIcon className="h-5 w-5 text-amber-500" />
                      Known Allergies
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedAllergies.length > 0 ? selectedAllergies.map(a => (
                        <span key={a} className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium flex items-center gap-2 border border-amber-200">
                          {a}
                          <XMarkIcon className="h-4 w-4 cursor-pointer hover:text-amber-600" onClick={() => removeAllergy(a)} />
                        </span>
                      )) : (
                        <p className="text-gray-400 text-sm italic">No allergies added yet.</p>
                      )}
                    </div>
                    
                    <div className="relative" ref={dropdownRef}>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={allergySearch}
                            onChange={(e) => {
                              setAllergySearch(e.target.value);
                              setShowAllergyDropdown(true);
                            }}
                            onFocus={() => setShowAllergyDropdown(true)}
                            placeholder="Search common allergies (e.g. Peanuts, Penicillin)..."
                            className="w-full pl-4 pr-10 py-2 border rounded-xl focus:ring-2 focus:ring-amber-500"
                          />
                          <ChevronDownIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                        </div>
                        <button
                          type="button"
                          onClick={addCustomAllergy}
                          className="px-4 py-2 bg-gray-800 text-white rounded-xl text-sm font-medium"
                        >
                          Add Custom
                        </button>
                      </div>

                      {showAllergyDropdown && filteredAllergies.length > 0 && (
                        <div className="absolute z-50 mt-2 w-full max-h-60 overflow-auto bg-white border rounded-xl shadow-2xl py-2">
                          {filteredAllergies.map(allergy => (
                            <button
                              key={allergy}
                              type="button"
                              onClick={() => addAllergy(allergy)}
                              className="w-full text-left px-4 py-2 hover:bg-amber-50 transition-colors text-sm"
                            >
                              {allergy}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subsection: Medical History & Lifestyle */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-700 flex items-center gap-2">
                        <DocumentTextIcon className="h-5 w-5 text-teal-500" />
                        Medical History
                      </h4>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Chronic Conditions</label>
                        <textarea {...medicalForm.register('chronicConditions')} rows={2} className="w-full px-4 py-2 border rounded-xl" placeholder="e.g. Diabetes, Hypertension" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Past Surgeries</label>
                        <textarea {...medicalForm.register('pastSurgeries')} rows={2} className="w-full px-4 py-2 border rounded-xl" placeholder="e.g. Appendectomy (2015)" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Family History</label>
                        <textarea {...medicalForm.register('familyMedicalHistory')} rows={2} className="w-full px-4 py-2 border rounded-xl" placeholder="Any significant family health issues" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-700 flex items-center gap-2">
                        <ShieldCheckIcon className="h-5 w-5 text-purple-500" />
                        Lifestyle & Habits
                      </h4>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Smoking Status</label>
                        <select {...medicalForm.register('smokingStatus')} className="w-full px-4 py-2 border rounded-xl">
                          <option value="never">Never Smoked</option>
                          <option value="former">Former Smoker</option>
                          <option value="current">Current Smoker</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Alcohol Consumption</label>
                        <select {...medicalForm.register('alcoholConsumption')} className="w-full px-4 py-2 border rounded-xl">
                          <option value="never">Never</option>
                          <option value="occasional">Occasional / Social</option>
                          <option value="regular">Regular</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Physical Activity</label>
                        <select {...medicalForm.register('physicalActivity')} className="w-full px-4 py-2 border rounded-xl">
                          <option value="sedentary">Sedentary (Minimal exercise)</option>
                          <option value="moderate">Moderate (3-4 times/week)</option>
                          <option value="active">Active (Daily exercise)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t">
                    <button type="submit" disabled={isLoading} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-rose-200 transition-all">
                      {isLoading ? 'Saving Changes...' : 'Save Comprehensive Profile'}
                    </button>
                    <button type="button" onClick={() => setIsEditingMedical(false)} className="px-8 py-4 border-2 border-gray-100 hover:bg-gray-50 text-gray-600 rounded-2xl font-bold transition-all">
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-8">
                  {/* Dashboard-style Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                      <span className="text-xs font-bold text-blue-600 uppercase">Blood Type</span>
                      <p className="text-2xl font-black text-blue-900 mt-1">{patientData.bloodType || '??'}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                      <span className="text-xs font-bold text-emerald-600 uppercase">Weight</span>
                      <p className="text-2xl font-black text-emerald-900 mt-1">{patientData.weight ? `${patientData.weight}kg` : '—'}</p>
                    </div>
                    <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
                      <span className="text-xs font-bold text-purple-600 uppercase">BMI</span>
                      <p className="text-2xl font-black text-purple-900 mt-1">
                        {patientData.height && patientData.weight 
                          ? (parseFloat(patientData.weight) / Math.pow(parseFloat(patientData.height)/100, 2)).toFixed(1)
                          : '—'}
                      </p>
                    </div>
                    <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
                      <span className="text-xs font-bold text-rose-600 uppercase">Allergies</span>
                      <p className="text-lg font-bold text-rose-900 mt-1 truncate">{selectedAllergies.length || 'Zero'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Vitals Feed */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Latest Vitals</h4>
                      <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100 border border-gray-100">
                        <div className="p-4 flex justify-between items-center">
                          <span className="text-gray-600 font-medium">Blood Pressure</span>
                          <span className="text-gray-900 font-bold">{patientData.bloodPressure || 'No data'}</span>
                        </div>
                        <div className="p-4 flex justify-between items-center">
                          <span className="text-gray-600 font-medium">Pulse Rate</span>
                          <span className="text-gray-900 font-bold">{patientData.pulse ? `${patientData.pulse} bpm` : 'No data'}</span>
                        </div>
                        <div className="p-4 flex justify-between items-center">
                          <span className="text-gray-600 font-medium">Height</span>
                          <span className="text-gray-900 font-bold">{patientData.height ? `${patientData.height} cm` : 'No data'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Medical Summary */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Medical Summary</h4>
                      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Chronic Conditions</label>
                          <p className="text-sm text-gray-700 font-medium">{patientData.chronicConditions || 'None reported'}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase">Past Surgeries</label>
                          <p className="text-sm text-gray-700 font-medium">{patientData.pastSurgeries || 'None reported'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lifestyle Badges */}
                  <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 h-full w-48 bg-gradient-to-l from-white/10 to-transparent"></div>
                    <div className="relative z-10 flex justify-between items-center mb-4">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Lifestyle & Habits</h4>
                      <button 
                        onClick={() => {
                          if (assessmentStatus?.canTakeAssessment) {
                            setIsAssessmentOpen(true);
                          } else {
                            toast(\`Next assessment available in \${assessmentStatus?.daysUntilNext || 7} days.\`, { icon: '⏳' });
                          }
                        }}
                        className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-2 \${assessmentStatus?.canTakeAssessment ? 'bg-teal-500 text-white hover:bg-teal-400 ring-2 ring-teal-500/50 ring-offset-1 ring-offset-slate-900' : 'bg-slate-800 text-slate-400 border border-slate-700'}\`}
                      >
                        <SparklesIcon className="h-4 w-4" />
                        {assessmentStatus?.canTakeAssessment ? 'Take Weekly Assesssment' : \`Available in \${assessmentStatus?.daysUntilNext} day(s)\`}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Smoking</p>
                          <p className="text-sm font-semibold capitalize">{patientData.smokingStatus || 'Not set'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-purple-400"></div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Alcohol</p>
                          <p className="text-sm font-semibold capitalize">{patientData.alcoholConsumption || 'Not set'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Activity</p>
                          <p className="text-sm font-semibold capitalize">{patientData.physicalActivity || 'Not set'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="space-y-8">
              {/* Emergency & Insurance Card */}
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl">
                <h3 className="text-xl font-bold flex items-center mb-6">
                  <ShieldCheckIcon className="h-7 w-7 mr-3 text-indigo-200" />
                  Health Shield
                </h3>
                <div className="space-y-6">
                  <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
                    <label className="text-[10px] font-black text-indigo-200 uppercase tracking-wider mb-1 block">Emergency Contact</label>
                    <p className="text-lg font-bold">{patientData.emergencyContact || 'Not assigned'}</p>
                    <p className="text-sm text-indigo-100">{patientData.emergencyPhone}</p>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/10">
                    <label className="text-[10px] font-black text-indigo-200 uppercase tracking-wider mb-1 block">Insurance Plan</label>
                    <p className="text-lg font-bold">{patientData.insuranceProvider || 'No provider'}</p>
                    <p className="text-xs text-indigo-100 font-mono mt-1 opacity-80">{patientData.insuranceNumber}</p>
                  </div>
                </div>
              </div>

              {/* Document Repository */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/50">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center">
                    <DocumentTextIcon className="h-7 w-7 mr-3 text-blue-600" />
                    MedVault
                  </h3>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold">{medicalDocuments.length} files</span>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="space-y-3">
                    <input 
                      value={docName} 
                      onChange={e => setDocName(e.target.value)} 
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500" 
                      placeholder="Document Name (e.g. Blood Test...)" 
                    />
                    <select 
                      value={docType} 
                      onChange={e => setDocType(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Lab Report">Lab Report</option>
                      <option value="Prescription">Prescription</option>
                      <option value="X-Ray/Imaging">X-Ray/Imaging</option>
                      <option value="Surgery Summary">Surgery Summary</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <input ref={docInputRef} type="file" onChange={handleDocUpload} className="hidden" />
                  <button 
                    onClick={() => docInputRef.current?.click()} 
                    disabled={isUploadingDoc}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-200"
                  >
                    {isUploadingDoc ? 'Encrypting...' : (
                      <>
                        <PlusIcon className="h-5 w-5" />
                        Secure Upload
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {medicalDocuments.length > 0 ? medicalDocuments.map(doc => (
                    <div key={doc.id} className="group p-4 bg-gray-50 hover:bg-blue-50 rounded-2xl border border-gray-100 hover:border-blue-200 transition-all flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm transition-transform">
                          <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{doc.name}</p>
                          <p className="text-[10px] text-gray-500">{doc.type}</p>
                        </div>
                      </div>
                      <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white rounded-full transition-all">
                        <ArrowDownTrayIcon className="h-5 w-5" />
                      </a>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <DocumentTextIcon className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                      <p className="text-xs text-gray-400 font-medium">No medical documents uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {patientId && (
        <WeeklyLifestyleAssessment 
          isOpen={isAssessmentOpen} 
          onClose={() => setIsAssessmentOpen(false)} 
          patientId={patientId} 
          onComplete={() => {
            setIsAssessmentOpen(false);
            fetchPatientData(); // Refresh to update button status
          }} 
        />
      )}
    </div>
  );
};

export default PatientProfile;
