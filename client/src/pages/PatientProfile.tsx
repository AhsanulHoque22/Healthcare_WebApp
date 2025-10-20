import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import axios from 'axios';
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
  IdentificationIcon
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
    insuranceNumber: ''
  });

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
      const response = await axios.get('/patients/profile');
      const data = response.data.data.patient;
      setPatientData({
        bloodType: data.bloodType || '',
        allergies: data.allergies || '',
        emergencyContact: data.emergencyContact || '',
        emergencyPhone: data.emergencyPhone || '',
        insuranceProvider: data.insuranceProvider || '',
        insuranceNumber: data.insuranceNumber || ''
      });
      
      // Parse allergies string into array for selected allergies display
      if (data.allergies) {
        setSelectedAllergies(data.allergies.split(', ').filter((a: string) => a.trim()));
      }
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
      await axios.put('/auth/profile', data);
      toast.success('Profile updated successfully!');
      setIsEditingProfile(false);
      // The user context should refresh automatically
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitMedical = async (data: any) => {
    setIsLoading(true);
    try {
      // Prepare data for backend - convert allergies array to string
      const medicalData = {
        ...data,
        allergies: selectedAllergies.length > 0 ? selectedAllergies.join(', ') : ''
      };
      
      await axios.put('/patients/profile', medicalData);
      toast.success('Medical information updated successfully!');
      setIsEditingMedical(false);
      
      // Refresh patient data to show updated information
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
        {/* Modern Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center">
                  <UserIcon className="h-10 w-10 mr-3" />
                  Patient Profile
                </h1>
                <p className="text-indigo-100 text-lg">
                  Manage your personal information and medical details.
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center">
                    <HeartIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <IdentificationIcon className="h-6 w-6 mr-2 text-indigo-600" />
                  Personal Information
                </h3>
                {!isEditingProfile && (
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">👤</span>
                  </div>
                )}
              </div>
            {isEditingProfile ? (
              <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">First Name</label>
                    <input
                      {...profileForm.register('firstName')}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      placeholder="Enter your first name"
                    />
                    {profileForm.formState.errors.firstName && (
                      <p className="text-sm text-red-500">{profileForm.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Last Name</label>
                    <input
                      {...profileForm.register('lastName')}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      placeholder="Enter your last name"
                    />
                    {profileForm.formState.errors.lastName && (
                      <p className="text-sm text-red-500">{profileForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Email</label>
                    <div className="px-4 py-3 bg-gray-100 rounded-xl text-gray-600">
                      {user?.email} (Cannot be changed)
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-1 text-indigo-600" />
                      Phone
                    </label>
                    <input
                      {...profileForm.register('phone')}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1 text-indigo-600" />
                      Date of Birth
                    </label>
                    <input
                      {...profileForm.register('dateOfBirth')}
                      type="date"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Gender</label>
                    <select
                      {...profileForm.register('gender')}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center">
                    <HomeIcon className="h-4 w-4 mr-1 text-indigo-600" />
                    Address
                  </label>
                  <textarea
                    {...profileForm.register('address')}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm resize-none"
                    placeholder="Enter your address"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 hover:scale-105"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200/50">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name</label>
                    <p className="text-lg font-medium text-gray-900">{user?.firstName}</p>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200/50">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name</label>
                    <p className="text-lg font-medium text-gray-900">{user?.lastName}</p>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-200/50">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <p className="text-lg font-medium text-gray-900">{user?.email}</p>
                  </div>
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200/50">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-1 text-amber-600" />
                      Phone
                    </label>
                    <p className="text-lg font-medium text-gray-900">{user?.phone || 'Not provided'}</p>
                  </div>
                  <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-200/50">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1 text-rose-600" />
                      Date of Birth
                    </label>
                    <p className="text-lg font-medium text-gray-900">{user?.dateOfBirth || 'Not provided'}</p>
                  </div>
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-200/50">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                    <p className="text-lg font-medium text-gray-900 capitalize">{user?.gender || 'Not provided'}</p>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200/50">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <HomeIcon className="h-4 w-4 mr-1 text-gray-600" />
                    Address
                  </label>
                  <p className="text-lg font-medium text-gray-900">{user?.address || 'Not provided'}</p>
                </div>
                <div className="pt-4">
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Medical Information */}
        <div>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <HeartIcon className="h-6 w-6 mr-2 text-rose-600" />
                Medical Information
              </h3>
              {!isEditingMedical && (
                <div className="w-8 h-8 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">❤️</span>
                </div>
              )}
            </div>
            {isEditingMedical ? (
              <form onSubmit={medicalForm.handleSubmit(onSubmitMedical)} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center">
                    <HeartIcon className="h-4 w-4 mr-1 text-rose-600" />
                    Blood Type
                  </label>
                  <select
                    {...medicalForm.register('bloodType')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                  >
                    <option value="">Select Blood Type</option>
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
                <div className="space-y-4">
                  <label className="block text-sm font-semibold text-gray-700">Allergies</label>
                  
                  {/* Selected Allergies Display */}
                  {selectedAllergies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedAllergies.map((allergy) => (
                        <span
                          key={allergy}
                          className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 text-sm rounded-full border border-amber-200 shadow-sm"
                        >
                          {allergy}
                          <button
                            type="button"
                            onClick={() => removeAllergy(allergy)}
                            className="text-amber-600 hover:text-amber-800 transition-colors duration-200"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Allergy Search Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <div className="flex">
                      <input
                        type="text"
                        value={allergySearch}
                        onChange={(e) => setAllergySearch(e.target.value)}
                        onFocus={() => setShowAllergyDropdown(true)}
                        placeholder="Search or select allergies..."
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-l-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAllergyDropdown(!showAllergyDropdown)}
                        className="px-4 py-3 border border-l-0 border-gray-200 rounded-r-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <ChevronDownIcon className="h-5 w-5" />
                      </button>
                    </div>

                    {showAllergyDropdown && (
                      <div className="absolute z-10 mt-2 w-full bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {filteredAllergies.length > 0 ? (
                          filteredAllergies.map((allergy) => (
                            <button
                              key={allergy}
                              type="button"
                              onClick={() => {
                                addAllergy(allergy);
                                setShowAllergyDropdown(false);
                              }}
                              className="w-full text-left px-4 py-3 text-sm hover:bg-amber-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                            >
                              {allergy}
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500">
                            No matching allergies found
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Custom Allergy Input */}
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-700">Add Custom Allergy</div>
                    <div className="flex">
                      <input
                        type="text"
                        value={customAllergy}
                        onChange={(e) => {
                          setCustomAllergy(e.target.value);
                          medicalForm.setValue('customAllergies', e.target.value);
                        }}
                        placeholder="Enter custom allergy name..."
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-l-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                      />
                      <button
                        type="button"
                        onClick={addCustomAllergy}
                        disabled={!customAllergy.trim()}
                        className="px-4 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-r-xl hover:from-amber-600 hover:to-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-1 text-emerald-600" />
                    Emergency Contact Name
                  </label>
                  <input
                    {...medicalForm.register('emergencyContact')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="Emergency contact full name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-1 text-emerald-600" />
                    Emergency Contact Phone
                  </label>
                  <input
                    {...medicalForm.register('emergencyPhone')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="Emergency contact phone number"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center">
                    <ShieldCheckIcon className="h-4 w-4 mr-1 text-purple-600" />
                    Insurance Provider
                  </label>
                  <input
                    {...medicalForm.register('insuranceProvider')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="Insurance company name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center">
                    <ShieldCheckIcon className="h-4 w-4 mr-1 text-purple-600" />
                    Insurance Number
                  </label>
                  <input
                    {...medicalForm.register('insuranceNumber')}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm"
                    placeholder="Insurance policy number"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-rose-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-rose-700 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {isLoading ? 'Saving...' : 'Save Medical Info'}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setIsEditingMedical(false)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 hover:scale-105"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl p-4 border border-rose-200/50">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                    <HeartIcon className="h-4 w-4 mr-1 text-rose-600" />
                    Blood Type
                  </label>
                  <p className="text-lg font-medium text-gray-900">{patientData.bloodType || 'Not provided'}</p>
                </div>
                
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200/50">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Allergies</label>
                  {selectedAllergies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedAllergies.map((allergy) => (
                        <span
                          key={allergy}
                          className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 text-sm rounded-full border border-amber-200 shadow-sm"
                        >
                          {allergy}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-lg font-medium text-gray-900">None reported</p>
                  )}
                </div>
                
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200/50">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <PhoneIcon className="h-4 w-4 mr-1 text-emerald-600" />
                    Emergency Contact
                  </label>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Name:</span>
                      <p className="text-lg font-medium text-gray-900">{patientData.emergencyContact || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Phone:</span>
                      <p className="text-lg font-medium text-gray-900">{patientData.emergencyPhone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-200/50">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <ShieldCheckIcon className="h-4 w-4 mr-1 text-purple-600" />
                    Insurance Information
                  </label>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Provider:</span>
                      <p className="text-lg font-medium text-gray-900">{patientData.insuranceProvider || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Policy Number:</span>
                      <p className="text-lg font-medium text-gray-900">{patientData.insuranceNumber || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button 
                    onClick={() => setIsEditingMedical(true)}
                    className="w-full bg-gradient-to-r from-rose-600 to-pink-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-rose-700 hover:to-pink-700 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Update Medical Info
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
