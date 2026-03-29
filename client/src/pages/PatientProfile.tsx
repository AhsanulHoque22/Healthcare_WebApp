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
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';


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
  
  // Patient medical data state
  const [patientData, setPatientData] = useState({
    bloodType: '',
    allergies: '',
    emergencyContact: '',
    emergencyPhone: '',
    insuranceProvider: '',
    insuranceNumber: '',
    profileImage: ''
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
      
      const pData = {
        bloodType: data.bloodType || '',
        allergies: data.allergies || '',
        emergencyContact: data.emergencyContact || '',
        emergencyPhone: data.emergencyPhone || '',
        insuranceProvider: data.insuranceProvider || '',
        insuranceNumber: data.insuranceNumber || '',
        profileImage: data.profileImage || ''
      };
      
      setPatientData(pData);
      setMedicalDocuments(data.medicalDocuments || []);
      
      // Parse allergies string into array for selected allergies display
      const parsedAllergies = data.allergies ? data.allergies.split(', ').filter((a: string) => a.trim()) : [];
      setSelectedAllergies(parsedAllergies);
      
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
  }>({
    defaultValues: {
      bloodType: '',
      allergies: [] as string[],
      customAllergies: '',
      emergencyContact: '',
      emergencyPhone: '',
      insuranceProvider: '',
      insuranceNumber: ''
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
        insuranceNumber: patientData.insuranceNumber
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
      toast.error(error.response?.data?.message || 'Failed to update medical information');
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
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 h-full">
              <h3 className="text-xl font-bold text-gray-900 flex items-center mb-6"><HeartIcon className="h-6 w-6 mr-2 text-rose-600" />Medical Info</h3>
              {isEditingMedical ? (
                <form onSubmit={medicalForm.handleSubmit(onSubmitMedical)} className="space-y-4">
                  <select {...medicalForm.register('bloodType')} className="w-full px-4 py-3 border rounded-xl"><option value="">Blood Type</option><option value="A+">A+</option><option value="O+">O+</option></select>
                  <label className="block text-sm font-semibold text-gray-700">Allergies</label>
                  <div className="flex flex-wrap gap-2">{selectedAllergies.map(a => (<span key={a} className="px-2 py-1 bg-yellow-100 rounded-full text-xs flex items-center gap-1">{a}<XMarkIcon className="h-3 w-3" onClick={() => removeAllergy(a)} /></span>))}</div>
                  <input value={allergySearch} onChange={e => setAllergySearch(e.target.value)} placeholder="Search Allergies" className="w-full px-3 py-2 border rounded-lg" />
                  <div className="flex gap-4"><button type="submit" className="flex-1 bg-rose-600 text-white py-3 rounded-xl">Save</button><button type="button" onClick={() => setIsEditingMedical(false)} className="px-6 py-3 border rounded-xl">Cancel</button></div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="bg-rose-50 p-4 rounded-xl"><label className="text-sm font-bold">Blood Type</label><p>{patientData.bloodType || 'N/A'}</p></div>
                  <div className="bg-amber-50 p-4 rounded-xl"><label className="text-sm font-bold">Allergies</label><p>{selectedAllergies.join(', ') || 'None'}</p></div>
                  <button onClick={() => setIsEditingMedical(true)} className="w-full bg-rose-600 text-white py-3 rounded-xl">Update Medical Info</button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 h-full">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center"><DocumentTextIcon className="h-6 w-6 mr-2 text-blue-600" />Documents</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 bg-blue-50 p-4 rounded-xl">
                  <input value={docName} onChange={e => setDocName(e.target.value)} className="w-full px-3 py-2 border rounded-lg mb-3" placeholder="Doc Name" />
                  <input ref={docInputRef} type="file" onChange={handleDocUpload} className="hidden" />
                  <button onClick={() => docInputRef.current?.click()} className="w-full bg-blue-600 text-white py-2 rounded-lg">Upload</button>
                </div>
                <div className="md:col-span-2 space-y-2">
                  {medicalDocuments.map(doc => (
                    <div key={doc.id} className="p-3 bg-gray-50 border rounded-lg flex justify-between items-center"><span className="text-sm font-medium">{doc.name}</span><a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-600 text-sm">View</a></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
