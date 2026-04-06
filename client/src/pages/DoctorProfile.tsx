import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import API from '../api/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../services/paymentService';
import { MEDICAL_DEPARTMENTS, getDepartmentLabel } from '../utils/departments';
import { 
  UserIcon, 
  AcademicCapIcon, 
  TrophyIcon, 
  MapPinIcon, 
  ClockIcon,
  CameraIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  PencilIcon,
  StarIcon,
  HeartIcon,
  ShieldCheckIcon,
  PhoneIcon,
  HomeIcon,
  CalendarIcon,
  IdentificationIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import DoctorRatings from '../components/DoctorRatings';

interface DoctorProfileData {
  profileImage?: string;
  signature?: string;
  bmdcRegistrationNumber?: string;
  department?: string | null | undefined;
  experience?: number | null | undefined;
  education?: string | null | undefined;
  certifications?: string | null | undefined;
  degrees: string[];
  awards: string[];
  hospital?: string | null | undefined;
  location?: string | null | undefined;
  chamberTimes: {
    [key: string]: string[];
  };
  chambers: Array<{
    id: string;
    name: string;
    address: string;
    chamberTimes: {
      [key: string]: string[];
    };
  }>;
  consultationFee?: string | null | undefined;
  languages: string[];
  services: string[];
  bio?: string | null | undefined;
}


const DoctorProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingSignature, setIsUploadingSignature] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);
  const [profileData, setProfileData] = useState<DoctorProfileData>({
    department: '',
    experience: 0,
    education: '',
    certifications: '',
    degrees: [],
    awards: [],
    hospital: '',
    location: '',
    chamberTimes: {},
    chambers: [],
    consultationFee: '',
    languages: ['English', 'Bengali'],
    services: [],
    bio: ''
  });

  const [newDegree, setNewDegree] = useState('');
  const [newAward, setNewAward] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newService, setNewService] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: profileData
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = [
    '09:00-12:00', '14:00-17:00', '19:00-22:00'
  ];

  // Common medical degrees
  const commonDegrees = [
    'MBBS', 'MD', 'MS', 'FCPS', 'MCPS', 'MRCP', 'FRCS', 'DDV', 'DCH', 'DGO', 'DLO', 'DMRD', 'DMRT', 'DCP', 'DPM', 'DPMR', 'DPM', 'DPMR', 'DPM', 'DPMR'
  ];

  // Common medical services
  const commonServices = [
    'General Consultation', 'Emergency Care', 'Surgery', 'Diagnostic Tests', 'Vaccination', 'Health Checkup', 'Follow-up Care', 'Telemedicine', 'Home Visit', 'Second Opinion'
  ];

  // Common languages
  const commonLanguages = [
    'English', 'Bengali', 'Hindi', 'Arabic', 'Urdu', 'French', 'Spanish', 'German', 'Chinese', 'Japanese'
  ];

  // Fetch doctor profile data
  const fetchProfileData = async () => {
    try {
      const response = await API.get('/doctors/profile');
      const data = response.data.data.doctor;
      setDoctorId(data.id);
      setProfileData({
        profileImage: data.profileImage || '',
        signature: data.signature || '',
        bmdcRegistrationNumber: data.bmdcRegistrationNumber || '',
        department: data.department || '',
        experience: data.experience || 0,
        education: data.education || '',
        certifications: data.certifications || '',
        degrees: data.degrees || [],
        awards: data.awards || [],
        hospital: data.hospital || '',
        location: data.location || '',
        chamberTimes: data.chamberTimes || {},
        chambers: data.chambers || [],
        consultationFee: data.consultationFee ? data.consultationFee.toString() : '',
        languages: data.languages || ['English', 'Bengali'],
        services: data.services || [],
        bio: data.bio || ''
      });
      
      // Set form values
      setValue('department', data.department || '');
      setValue('experience', data.experience || 0);
      setValue('education', data.education || '');
      setValue('certifications', data.certifications || '');
      setValue('hospital', data.hospital || '');
      setValue('location', data.location || '');
      setValue('consultationFee', data.consultationFee ? data.consultationFee.toString() : '');
      setValue('bio', data.bio || '');
    } catch (error) {
      console.error('Failed to fetch doctor profile:', error);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Page load animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle form submission
  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const updateData = {
        ...data,
        bmdcRegistrationNumber: profileData.bmdcRegistrationNumber,
        degrees: profileData.degrees,
        awards: profileData.awards,
        chamberTimes: {},
        chambers: profileData.chambers,
        languages: profileData.languages,
        services: profileData.services,
        profileImage: profileData.profileImage,
        signature: profileData.signature
      };

      await API.put('/doctors/profile', updateData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      await fetchProfileData();
    } catch (error: any) {
      console.error('Update error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Add degree
  const addDegree = () => {
    if (newDegree.trim() && !profileData.degrees.includes(newDegree.trim())) {
      setProfileData(prev => ({
        ...prev,
        degrees: [...prev.degrees, newDegree.trim()]
      }));
      setNewDegree('');
    }
  };

  // Remove degree
  const removeDegree = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      degrees: prev.degrees.filter((_, i) => i !== index)
    }));
  };

  // Add award
  const addAward = () => {
    if (newAward.trim() && !profileData.awards.includes(newAward.trim())) {
      setProfileData(prev => ({
        ...prev,
        awards: [...prev.awards, newAward.trim()]
      }));
      setNewAward('');
    }
  };

  // Remove award
  const removeAward = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      awards: prev.awards.filter((_, i) => i !== index)
    }));
  };

  // Add language
  const addLanguage = () => {
    if (newLanguage.trim() && !profileData.languages.includes(newLanguage.trim())) {
      setProfileData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  // Remove language
  const removeLanguage = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  // Add service
  const addService = () => {
    if (newService.trim() && !profileData.services.includes(newService.trim())) {
      setProfileData(prev => ({
        ...prev,
        services: [...prev.services, newService.trim()]
      }));
      setNewService('');
    }
  };

  // Remove service
  const removeService = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index)
    }));
  };

  const addChamber = () => {
    setProfileData(prev => ({
      ...prev,
      chambers: [
        ...(prev.chambers || []),
        {
          id: Date.now().toString(),
          name: '',
          address: '',
          chamberTimes: {}
        }
      ]
    }));
  };

  const removeChamber = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      chambers: (prev.chambers || []).filter((_, i) => i !== index)
    }));
  };

  const updateChamberField = (index: number, field: string, value: string) => {
    setProfileData(prev => {
      const newChambers = [...(prev.chambers || [])];
      newChambers[index] = { ...newChambers[index], [field]: value };
      return { ...prev, chambers: newChambers };
    });
  };

  const addSpecificChamberTime = (chamberIndex: number, day: string, timeString: string) => {
    if (!timeString.trim()) return;
    setProfileData(prev => {
      const newChambers = [...(prev.chambers || [])];
      const chamber = { ...newChambers[chamberIndex] };
      const currentTimes = chamber.chamberTimes[day] || [];
      
      if (!currentTimes.includes(timeString.trim())) {
        chamber.chamberTimes = {
          ...chamber.chamberTimes,
          [day]: [...currentTimes, timeString.trim()]
        };
      }

      newChambers[chamberIndex] = chamber;
      return { ...prev, chambers: newChambers };
    });
  };

  const removeSpecificChamberTime = (chamberIndex: number, day: string, timeSlot: string) => {
    setProfileData(prev => {
      const newChambers = [...(prev.chambers || [])];
      const chamber = { ...newChambers[chamberIndex] };
      const currentTimes = chamber.chamberTimes[day] || [];
      
      const newTimes = currentTimes.filter(t => t !== timeSlot);
      chamber.chamberTimes = {
        ...chamber.chamberTimes,
        [day]: newTimes
      };

      if (newTimes.length === 0) {
        delete chamber.chamberTimes[day];
      }

      newChambers[chamberIndex] = chamber;
      return { ...prev, chambers: newChambers };
    });
  };

  // Handle image upload
  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('profileImage', file);

      // Upload file to server
      const response = await API.post('/doctors/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Update profile data with the uploaded image URL
        setProfileData(prev => ({
          ...prev,
          profileImage: response.data.data.imageUrl
        }));
        
        // Update user context with the new profile image
        if (response.data.data.imageUrl) {
          // Refresh user data to get updated profile image
          const userResponse = await API.get('/auth/profile');
          if (userResponse.data.success) {
            // Update the user context
            window.location.reload(); // Simple refresh to update user context
          }
        }
        
        toast.success('Image uploaded successfully!');
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle signature upload
  const handleSignatureUpload = () => {
    signatureFileInputRef.current?.click();
  };

  const handleSignatureFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (max 2MB for signature)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Signature size must be less than 2MB');
      return;
    }

    setIsUploadingSignature(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file); // Use same image upload field name

      const response = await API.post('/doctors/upload-image?type=signature', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setProfileData(prev => ({
          ...prev,
          signature: response.data.data.imageUrl
        }));
        toast.success('Signature uploaded successfully!');
      } else {
        throw new Error(response.data.message || 'Upload failed');
      }
    } catch (error: any) {
      console.error('Signature Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload signature');
    } finally {
      setIsUploadingSignature(false);
      if (signatureFileInputRef.current) {
        signatureFileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="space-y-8 p-6">
        {/* Modern Header */}
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white shadow-2xl ${pageLoaded ? 'animate-fade-in-down' : ''}`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">
                  Doctor Profile 👨‍⚕️
                </h1>
                <p className="text-indigo-100 text-lg">
                  Manage your professional information and practice details.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
                    <UserIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md ${
                  isEditing 
                    ? 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30' 
                    : 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30'
                }`}
              >
                <PencilIcon className="h-5 w-5" />
                {isEditing ? 'Cancel Editing' : 'Edit Profile'}
              </button>
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${pageLoaded ? 'animate-fade-in' : ''}`}>
          {/* Profile Image Section */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg p-3 text-white mr-3">
                  <CameraIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Profile Image</h3>
                  <p className="text-sm text-gray-600">Your professional photo</p>
                </div>
              </div>
              <div className="text-center">
                {profileData.profileImage ? (
                  <div className="relative inline-block">
                    <img
                      src={profileData.profileImage}
                      alt="Profile"
                      className="h-40 w-40 rounded-2xl object-cover mx-auto mb-6 shadow-lg border-4 border-white"
                    />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircleIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="h-40 w-40 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-white">
                    <UserIcon className="h-20 w-20 text-gray-400" />
                  </div>
                )}
                {isEditing && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button 
                      type="button"
                      onClick={handleImageUpload}
                      disabled={isUploading}
                      className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CameraIcon className="h-5 w-5" />
                      {isUploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      JPG, PNG, GIF up to 5MB
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Signature Upload Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 mt-6">
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-3 text-white mr-3">
                  <PencilSquareIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Digital Signature</h3>
                  <p className="text-sm text-gray-600">For printing on prescriptions</p>
                </div>
              </div>
              <div className="text-center">
                {profileData.signature ? (
                  <div className="relative inline-block bg-gray-50 rounded-xl p-4 border-2 border-dashed border-gray-200 mb-6">
                    <img
                      src={profileData.signature}
                      alt="Signature"
                      className="h-20 w-auto max-w-[200px] object-contain mx-auto mix-blend-multiply"
                    />
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircleIcon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="h-24 w-full max-w-[240px] rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mx-auto mb-6 shadow-sm border-2 border-dashed border-gray-200">
                    <PencilSquareIcon className="h-10 w-10 text-gray-300" />
                  </div>
                )}
                {isEditing && (
                  <>
                    <input
                      ref={signatureFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleSignatureFileChange}
                      className="hidden"
                    />
                    <button 
                      type="button"
                      onClick={handleSignatureUpload}
                      disabled={isUploadingSignature}
                      className="flex items-center gap-2 mx-auto px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 hover:scale-105 shadow-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <CameraIcon className="h-4 w-4" />
                      {isUploadingSignature ? 'Uploading...' : 'Upload Signature'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      Transparent PNG works best
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Main Profile Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic Information */}
              <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-3 text-white mr-3">
                    <IdentificationIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Basic Information</h3>
                    <p className="text-sm text-gray-600">Your professional credentials</p>
                  </div>
                </div>
                
                {/* BMDC Registration Number - Display Only */}
                {profileData?.bmdcRegistrationNumber && (
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                    <div className="flex items-center mb-2">
                      <ShieldCheckIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <label className="block text-sm font-semibold text-blue-800">BMDC Registration Number</label>
                    </div>
                    <p className="text-blue-900 font-bold text-lg">{profileData.bmdcRegistrationNumber}</p>
                    <p className="text-xs text-blue-600 mt-1">This is your unique BMDC registration identifier and cannot be changed.</p>
                  </div>
                )}
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
                    <div className="flex items-center mb-3">
                      <HeartIcon className="h-5 w-5 text-blue-600 mr-2" />
                      <label className="block text-sm font-semibold text-blue-800">Medical Department</label>
                    </div>
                    {isEditing ? (
                      <select
                        {...register('department')}
                        className={`w-full px-4 py-3 border ${
                          errors.department ? 'border-red-300 bg-red-50' : 'border-blue-200 bg-white/70'
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                      >
                        <option value="">Select Department</option>
                        {MEDICAL_DEPARTMENTS.map((dept) => (
                          <option key={dept.value} value={dept.value}>
                            {dept.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-blue-900 font-semibold text-lg">{getDepartmentLabel(profileData.department || '') || 'Not provided'}</p>
                    )}
                    {errors.department && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.department.message as string}
                      </p>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200/50">
                    <div className="flex items-center mb-3">
                      <StarIcon className="h-5 w-5 text-emerald-600 mr-2" />
                      <label className="block text-sm font-semibold text-emerald-800">Experience (Years)</label>
                    </div>
                    {isEditing ? (
                      <input
                        {...register('experience')}
                        type="number"
                        min="0"
                        max="50"
                        className={`w-full px-4 py-3 border ${
                          errors.experience ? 'border-red-300 bg-red-50' : 'border-emerald-200 bg-white/70'
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200`}
                        placeholder="Enter years of experience"
                      />
                    ) : (
                      <p className="text-emerald-900 font-semibold text-lg">{profileData.experience || 'Not provided'} years</p>
                    )}
                    {errors.experience && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.experience.message as string}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-200/50">
                    <div className="flex items-center mb-3">
                      <AcademicCapIcon className="h-5 w-5 text-purple-600 mr-2" />
                      <label className="block text-sm font-semibold text-purple-800">Education</label>
                    </div>
                    {isEditing ? (
                      <input
                        {...register('education')}
                        className={`w-full px-4 py-3 border ${
                          errors.education ? 'border-red-300 bg-red-50' : 'border-purple-200 bg-white/70'
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200`}
                        placeholder="Enter education details"
                      />
                    ) : (
                      <p className="text-purple-900 font-semibold text-lg">{profileData.education || 'Not provided'}</p>
                    )}
                    {errors.education && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.education.message as string}
                      </p>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200/50">
                    <div className="flex items-center mb-3">
                      <TrophyIcon className="h-5 w-5 text-amber-600 mr-2" />
                      <label className="block text-sm font-semibold text-amber-800">Certifications</label>
                    </div>
                    {isEditing ? (
                      <input
                        {...register('certifications')}
                        className={`w-full px-4 py-3 border ${
                          errors.certifications ? 'border-red-300 bg-red-50' : 'border-amber-200 bg-white/70'
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200`}
                        placeholder="Enter certifications"
                      />
                    ) : (
                      <p className="text-amber-900 font-semibold text-lg">{profileData.certifications || 'Not provided'}</p>
                    )}
                    {errors.certifications && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.certifications.message as string}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-200/50">
                    <div className="flex items-center mb-3">
                      <HomeIcon className="h-5 w-5 text-rose-600 mr-2" />
                      <label className="block text-sm font-semibold text-rose-800">Hospital/Clinic Name</label>
                    </div>
                    {isEditing ? (
                      <input
                        {...register('hospital')}
                        className={`w-full px-4 py-3 border ${
                          errors.hospital ? 'border-red-300 bg-red-50' : 'border-rose-200 bg-white/70'
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200`}
                        placeholder="Enter hospital name"
                      />
                    ) : (
                      <p className="text-rose-900 font-semibold text-lg">{profileData.hospital || 'Not provided'}</p>
                    )}
                    {errors.hospital && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.hospital.message as string}
                      </p>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200/50">
                    <div className="flex items-center mb-3">
                      <PhoneIcon className="h-5 w-5 text-emerald-600 mr-2" />
                      <label className="block text-sm font-semibold text-emerald-800">Consultation Fee (BDT)</label>
                    </div>
                    {isEditing ? (
                      <input
                        {...register('consultationFee')}
                        type="number"
                        className={`w-full px-4 py-3 border ${
                          errors.consultationFee ? 'border-red-300 bg-red-50' : 'border-emerald-200 bg-white/70'
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200`}
                        placeholder="Enter consultation fee"
                      />
                    ) : (
                      <p className="text-emerald-900 font-semibold text-lg">{profileData.consultationFee ? formatCurrency(parseFloat(profileData.consultationFee)) : 'Not set'}</p>
                    )}
                    {errors.consultationFee && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.consultationFee.message as string}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-200/50">
                    <div className="flex items-center mb-3">
                      <MapPinIcon className="h-5 w-5 text-indigo-600 mr-2" />
                      <label className="block text-sm font-semibold text-indigo-800">Location</label>
                    </div>
                    {isEditing ? (
                      <input
                        {...register('location')}
                        className={`w-full px-4 py-3 border ${
                          errors.location ? 'border-red-300 bg-red-50' : 'border-indigo-200 bg-white/70'
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200`}
                        placeholder="Enter hospital address"
                      />
                    ) : (
                      <p className="text-indigo-900 font-semibold text-lg">{profileData.location || 'Not provided'}</p>
                    )}
                    {errors.location && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.location.message as string}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-200/50">
                    <div className="flex items-center mb-3">
                      <UserIcon className="h-5 w-5 text-slate-600 mr-2" />
                      <label className="block text-sm font-semibold text-slate-800">Bio</label>
                    </div>
                    {isEditing ? (
                      <textarea
                        {...register('bio')}
                        rows={4}
                        className={`w-full px-4 py-3 border ${
                          errors.bio ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white/70'
                        } rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all duration-200 resize-none`}
                        placeholder="Tell patients about yourself, your approach to medicine, and what makes you unique..."
                      />
                    ) : (
                      <p className="text-slate-900 font-medium leading-relaxed">{profileData.bio || 'No bio provided'}</p>
                    )}
                    {errors.bio && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.bio.message as string}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Chambers Management */}
              <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 ${pageLoaded ? 'animate-fade-in' : ''}`}>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg p-3 text-white mr-3">
                      <HomeIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Your Chambers & Schedules</h3>
                      <p className="text-sm text-gray-600">Add different locations where you see patients and define your custom times.</p>
                    </div>
                  </div>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={addChamber}
                      className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg hover:from-teal-600 hover:to-emerald-600 transition-all shadow-sm font-medium flex items-center gap-2"
                    >
                      <PlusIcon className="h-4 w-4" />
                      Add Chamber
                    </button>
                  )}
                </div>

                <div className="space-y-8">
                  {profileData.chambers && profileData.chambers.map((chamber, cIndex) => (
                    <div key={chamber.id || cIndex} className="bg-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm relative pt-12">
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => removeChamber(cIndex)}
                            className="absolute top-4 right-4 p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <XMarkIcon className="h-5 w-5" />
                          </button>
                        )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Clinic / Hospital Name</label>
                          <input
                            type="text"
                            value={chamber.name}
                            onChange={(e) => updateChamberField(cIndex, 'name', e.target.value)}
                            disabled={!isEditing}
                            placeholder="e.g. LabAid Hospital"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Chamber Address / Location</label>
                          <input
                            type="text"
                            value={chamber.address}
                            onChange={(e) => updateChamberField(cIndex, 'address', e.target.value)}
                            disabled={!isEditing}
                            placeholder="e.g. Dhanmondi, Dhaka"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-transparent"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {days.map(day => (
                          <div key={day} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                            <h5 className="font-semibold text-gray-800 mb-3 border-b pb-2">{day}</h5>
                            <div className="space-y-2 mb-3">
                              {(chamber.chamberTimes[day] || []).map(timeSlot => (
                                <div key={timeSlot} className="flex justify-between items-center bg-teal-50 text-teal-800 px-3 py-1.5 rounded-lg text-sm border border-teal-100 flex-wrap">
                                  <span>{timeSlot}</span>
                                  {isEditing && (
                                    <button 
                                      type="button" 
                                      onClick={() => removeSpecificChamberTime(cIndex, day, timeSlot)}
                                      className="text-teal-600 hover:text-red-500 transition-colors"
                                    >
                                      <XMarkIcon className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              {(!chamber.chamberTimes[day] || chamber.chamberTimes[day].length === 0) && (
                                <p className="text-xs text-gray-400 italic">No times added</p>
                              )}
                            </div>
                            
                            {isEditing && (
                              <div className="mt-auto">
                                <input
                                  type="text"
                                  placeholder="e.g. 09:00 AM - 01:00 PM"
                                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 transition-all mb-2"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addSpecificChamberTime(cIndex, day, e.currentTarget.value);
                                      e.currentTarget.value = '';
                                    }
                                  }}
                                />
                                <p className="text-[10px] text-gray-500">Press Enter to add time slot</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {(!profileData.chambers || profileData.chambers.length === 0) && (
                     <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <HomeIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No chambers added.</p>
                        <p className="text-gray-400 text-sm mt-1">Add a chamber to set your schedule for patients.</p>
                     </div>
                  )}
                </div>
              </div>

              {/* Degrees */}
              <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg p-3 text-white mr-3">
                    <AcademicCapIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Degrees & Qualifications</h3>
                    <p className="text-sm text-gray-600">Your academic achievements</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {profileData.degrees.map((degree, index) => (
                    <div key={index} className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-200/50 group hover:shadow-md transition-all duration-200">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mr-3">
                          <AcademicCapIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-purple-900 font-semibold">{degree}</span>
                      </div>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeDegree(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newDegree}
                          onChange={(e) => setNewDegree(e.target.value)}
                          placeholder="Add degree (e.g., MBBS, MD)"
                          className="flex-1 px-4 py-3 border border-purple-200 bg-white/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={addDegree}
                          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium flex items-center gap-2"
                        >
                          <PlusIcon className="h-4 w-4" />
                          Add
                        </button>
                      </div>
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200/50">
                        <p className="text-sm font-medium text-gray-700 mb-3">Common degrees:</p>
                        <div className="flex flex-wrap gap-2">
                          {commonDegrees.map((degree) => (
                            <button
                              key={degree}
                              type="button"
                              onClick={() => setNewDegree(degree)}
                              className="px-3 py-1 bg-white/70 hover:bg-purple-100 rounded-lg text-xs font-medium text-gray-700 hover:text-purple-700 transition-all duration-200 border border-gray-200/50 hover:border-purple-200"
                            >
                              {degree}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Awards */}
              <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 ${pageLoaded ? 'animate-fade-in' : ''}`}>
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg p-3 text-white mr-3">
                    <TrophyIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Awards & Recognitions</h3>
                    <p className="text-sm text-gray-600">Your professional achievements</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {profileData.awards.map((award, index) => (
                    <div key={index} className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200/50 group hover:shadow-md transition-all duration-200">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mr-3">
                          <TrophyIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-amber-900 font-semibold">{award}</span>
                      </div>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeAward(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newAward}
                        onChange={(e) => setNewAward(e.target.value)}
                        placeholder="Add award or recognition"
                        className="flex-1 px-4 py-3 border border-amber-200 bg-white/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200"
                      />
                      <button
                        type="button"
                        onClick={addAward}
                        className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium flex items-center gap-2"
                      >
                        <PlusIcon className="h-4 w-4" />
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Languages */}
              <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg p-3 text-white mr-3">
                    <UserIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Languages</h3>
                    <p className="text-sm text-gray-600">Languages you can communicate in</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {profileData.languages.map((language, index) => (
                    <div key={index} className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200/50 group hover:shadow-md transition-all duration-200">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mr-3">
                          <UserIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-emerald-900 font-semibold">{language}</span>
                      </div>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeLanguage(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newLanguage}
                          onChange={(e) => setNewLanguage(e.target.value)}
                          placeholder="Add language"
                          className="flex-1 px-4 py-3 border border-emerald-200 bg-white/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={addLanguage}
                          className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:from-emerald-600 hover:to-green-600 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium flex items-center gap-2"
                        >
                          <PlusIcon className="h-4 w-4" />
                          Add
                        </button>
                      </div>
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200/50">
                        <p className="text-sm font-medium text-gray-700 mb-3">Common languages:</p>
                        <div className="flex flex-wrap gap-2">
                          {commonLanguages.map((language) => (
                            <button
                              key={language}
                              type="button"
                              onClick={() => setNewLanguage(language)}
                              className="px-3 py-1 bg-white/70 hover:bg-emerald-100 rounded-lg text-xs font-medium text-gray-700 hover:text-emerald-700 transition-all duration-200 border border-gray-200/50 hover:border-emerald-200"
                            >
                              {language}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Services */}
              <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 ${pageLoaded ? 'animate-fade-in' : ''}`}>
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg p-3 text-white mr-3">
                    <HeartIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Medical Services</h3>
                    <p className="text-sm text-gray-600">Services you provide to patients</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {profileData.services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between bg-gradient-to-r from-rose-50 to-pink-50 p-4 rounded-xl border border-rose-200/50 group hover:shadow-md transition-all duration-200">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                          <HeartIcon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-rose-900 font-semibold">{service}</span>
                      </div>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeService(index)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  {isEditing && (
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newService}
                          onChange={(e) => setNewService(e.target.value)}
                          placeholder="Add medical service"
                          className="flex-1 px-4 py-3 border border-rose-200 bg-white/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={addService}
                          className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl hover:from-rose-600 hover:to-pink-600 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium flex items-center gap-2"
                        >
                          <PlusIcon className="h-4 w-4" />
                          Add
                        </button>
                      </div>
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200/50">
                        <p className="text-sm font-medium text-gray-700 mb-3">Common services:</p>
                        <div className="flex flex-wrap gap-2">
                          {commonServices.map((service) => (
                            <button
                              key={service}
                              type="button"
                              onClick={() => setNewService(service)}
                              className="px-3 py-1 bg-white/70 hover:bg-rose-100 rounded-lg text-xs font-medium text-gray-700 hover:text-rose-700 transition-all duration-200 border border-gray-200/50 hover:border-rose-200"
                            >
                              {service}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-8 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-5 w-5" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>

            <div className={`mt-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 ${pageLoaded ? 'animate-fade-in-up' : ''}`}>
              <div className="flex items-center mb-6">
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg p-3 text-white mr-3">
                  <StarIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Your Ratings & Reviews</h3>
                  <p className="text-sm text-gray-600">See what your patients are saying</p>
                </div>
              </div>
              
              {doctorId ? (
                <DoctorRatings doctorId={doctorId} showAll={true} />
              ) : (
                <div className="text-center text-gray-500">Loading reviews...</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
