import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import API from '../api/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
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
  SparklesIcon,
  ArrowLongRightIcon,
  EnvelopeIcon,
  MapPinIcon,
  ScaleIcon,
  ArrowUpIcon,
  BeakerIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import WeeklyLifestyleAssessment from '../components/WeeklyLifestyleAssessment';
import { Reveal, MagneticButton } from '../components/landing/AnimatedSection';

const COMMON_ALLERGIES = [
  'Peanuts', 'Tree nuts', 'Shellfish', 'Fish', 'Eggs', 'Milk', 'Soy', 'Wheat', 'Sesame seeds',
  'Gluten', 'Lactose', 'Citrus fruits', 'Strawberries', 'Tomatoes', 'Chocolate', 'Sulfites',
  'Penicillin', 'Amoxicillin', 'Sulfonamides', 'NSAIDs (aspirin, ibuprofen)', 'Codeine', 
  'Morphine', 'Sulfasalazine', 'Tetracycline', 'Erythromycin', 'Vancomycin', 'Polymyxin',
  'Pollen', 'Dust mites', 'Pet dander', 'Mold spores', 'Grass pollen', 'Tree pollen',
  'Latex', 'Nickel', 'Parabens', 'Formaldehyde', 'Fragrances', 'Perfumes', 'Detergents',
  'Bee stings', 'Wasp stings', 'Ant bites', 'Mosquito bites', 'Tick bites', 'Flea bites'
];

const PatientProfile: React.FC = () => {
  const { user } = useAuth();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingMedical, setIsEditingMedical] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState('');
  const [showAllergyDropdown, setShowAllergyDropdown] = useState(false);
  const [allergySearch, setAllergySearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [patientId, setPatientId] = useState<number | null>(null);
  const [assessmentStatus, setAssessmentStatus] = useState<any>(null);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  
  const [patientData, setPatientData] = useState({
    bloodType: '', allergies: '', emergencyContact: '', emergencyPhone: '', insuranceProvider: '', insuranceNumber: '',
    profileImage: '', height: '', weight: '', bloodPressure: '', pulse: '', chronicConditions: '', pastSurgeries: '',
    familyMedicalHistory: '', smokingStatus: '', alcoholConsumption: '', physicalActivity: ''
  });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [medicalDocuments, setMedicalDocuments] = useState<any[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Lab Report');

  const fetchPatientData = async () => {
    try {
      const response = await API.get('/patients/profile');
      const data = response.data.data.patient;
      const pData = {
        bloodType: data.bloodType || '', allergies: data.allergies || '', emergencyContact: data.emergencyContact || '',
        emergencyPhone: data.emergencyPhone || '', insuranceProvider: data.insuranceProvider || '', insuranceNumber: data.insuranceNumber || '',
        profileImage: data.profileImage || '', height: data.height || '', weight: data.weight || '',
        bloodPressure: data.bloodPressure || '', pulse: data.pulse || '', chronicConditions: data.chronicConditions || '',
        pastSurgeries: data.pastSurgeries || '', familyMedicalHistory: data.familyMedicalHistory || '',
        smokingStatus: data.smokingStatus || '', alcoholConsumption: data.alcoholConsumption || '', physicalActivity: data.physicalActivity || ''
      };
      setPatientData(pData);
      setMedicalDocuments(data.medicalDocuments || []);
      const parsedAllergies = data.allergies ? data.allergies.split(', ').filter((a: string) => a.trim()) : [];
      setSelectedAllergies(parsedAllergies);
      setPatientId(data.id);
      try {
        const assessmentRes = await API.get(`/patients/${data.id}/lifestyle-assessment/status`);
        setAssessmentStatus(assessmentRes.data.data);
      } catch(e) {}
      medicalForm.reset({ ...pData, allergies: parsedAllergies, customAllergies: '' });
    } catch (error) {}
  };

  useEffect(() => { fetchPatientData(); }, []);

  const profileForm = useForm({
    defaultValues: {
      firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth || '', gender: user?.gender, address: user?.address || '',
    },
  });

  const medicalForm = useForm<{
    bloodType: string; allergies: string[]; customAllergies: string; emergencyContact: string; emergencyPhone: string;
    insuranceProvider: string; insuranceNumber: string; height: string; weight: string; bloodPressure: string;
    pulse: string; chronicConditions: string; pastSurgeries: string; familyMedicalHistory: string; 
    smokingStatus: string; alcoholConsumption: string; physicalActivity: string;
  }>({
    defaultValues: {
      bloodType: '', allergies: [], customAllergies: '', emergencyContact: '', emergencyPhone: '',
      insuranceProvider: '', insuranceNumber: '', height: '', weight: '', bloodPressure: '',
      pulse: '', chronicConditions: '', pastSurgeries: '', familyMedicalHistory: '',
      smokingStatus: '', alcoholConsumption: '', physicalActivity: ''
    },
  });

  useEffect(() => {
    if (isEditingMedical) {
      medicalForm.reset({ ...patientData, allergies: selectedAllergies, customAllergies: '' });
    }
  }, [isEditingMedical]);

  const handleImageUpload = () => fileInputRef.current?.click();
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Invalid image'); return; }
    setIsUploading(true);
    try {
      const formData = new FormData(); formData.append('profileImage', file);
      const response = await API.post('/patients/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.success) {
        setPatientData(prev => ({ ...prev, profileImage: response.data.data.imageUrl }));
        toast.success('Image uploaded!'); window.location.reload();
      }
    } catch (error) { toast.error('Upload failed'); } finally { setIsUploading(false); }
  };

  const handleDocUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !docName.trim()) { toast.error('Name required'); return; }
    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('document', file); formData.append('documentName', docName); formData.append('documentType', docType);
      const response = await API.post('/patients/upload-document', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.success) { setMedicalDocuments([...medicalDocuments, response.data.data.document]); toast.success('Success!'); setDocName(''); }
    } catch (error) { toast.error('Upload failed'); } finally { setIsUploadingDoc(false); if (docInputRef.current) docInputRef.current.value = ''; }
  };

  const addAllergy = (allergy: string) => {
    if (!selectedAllergies.includes(allergy)) {
      const updated = [...selectedAllergies, allergy]; setSelectedAllergies(updated); medicalForm.setValue('allergies', updated);
    }
    setAllergySearch('');
  };

  const removeAllergy = (allergy: string) => {
    const updated = selectedAllergies.filter(a => a !== allergy); setSelectedAllergies(updated); medicalForm.setValue('allergies', updated);
  };

  const addCustomAllergy = () => { if (customAllergy.trim()) { addAllergy(customAllergy.trim()); setCustomAllergy(''); } };

  const onSubmitProfile = async (data: any) => {
    setIsLoading(true);
    try { await API.put('/auth/profile', data); toast.success('Profile updated!'); setIsEditingProfile(false); }
    catch (e) { toast.error('Failed'); } finally { setIsLoading(false); }
  };

  const onSubmitMedical = async (data: any) => {
    setIsLoading(true);
    try {
      const medicalData = { ...data, allergies: selectedAllergies.join(', ') };
      await API.put('/patients/profile', medicalData);
      toast.success('Success!'); setIsEditingMedical(false); await fetchPatientData();
    } catch (e) { toast.error('Failed'); } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#fafbff] noise-overlay relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[5%] right-[-10%] w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-5%] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(#4f46e5 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        
        {/* ═══ PREMIUM HEADER ═══ */}
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-slate-900 px-8 py-12 md:px-14 text-white shadow-2xl">
            <div className="absolute top-0 right-0 w-1/3 h-full">
              <div className="absolute inset-0 bg-gradient-to-l from-indigo-500/10 via-transparent to-transparent" />
              <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-400/10 rounded-full blur-[80px]" />
            </div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">Secure Identity</span>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-400/20">Verified Account</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
                Your Health <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 animate-gradient-shift italic">Master Profile.</span>
              </h1>
              <p className="text-slate-400 font-medium max-w-xl text-lg">
                The central hub for your clinical identity, medical documents, and lifestyle insights. Encrypted and accessible.
              </p>
            </div>
          </div>
        </Reveal>

        {/* ═══ BENTO CONTENT GRID ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Identity Card (4 cols) */}
          <div className="lg:col-span-4 space-y-8">
            <Reveal delay={0.1}>
              <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 group">
                <div className="relative mx-auto w-48 h-48 mb-8">
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-violet-100 rounded-[40px] rotate-6 group-hover:rotate-12 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-white rounded-[40px] border border-slate-100 p-1">
                    {user?.profileImage || patientData.profileImage ? (
                      <img src={user?.profileImage || patientData.profileImage} className="w-full h-full object-cover rounded-[38px]" alt="Avatar" />
                    ) : (
                      <div className="w-full h-full bg-slate-50 flex items-center justify-center rounded-[38px]"><UserIcon className="h-16 w-16 text-slate-200" /></div>
                    )}
                  </div>
                  <button onClick={handleImageUpload} disabled={isUploading}
                    className="absolute -bottom-2 -right-2 w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all border border-slate-700">
                    <CameraIcon className="h-5 w-5" />
                  </button>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
                </div>

                <div className="text-center space-y-1">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user?.firstName} {user?.lastName}</h2>
                  <p className="text-sm font-bold text-slate-400 flex items-center justify-center gap-1.5"><EnvelopeIcon className="h-3 w-3" /> {user?.email}</p>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Blood Type</p>
                    <p className="text-xl font-black text-slate-900">{patientData.bloodType || '?'}</p>
                  </div>
                  <div className="text-center p-4 bg-slate-50 rounded-2xl">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Weight</p>
                    <p className="text-xl font-black text-slate-900">{patientData.weight ? `${patientData.weight}kg` : '—'}</p>
                  </div>
                </div>
              </div>
            </Reveal>

            {/* QUICK VITALS CARD */}
            <Reveal delay={0.2}>
              <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-bl-full" />
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-2">
                  <HeartIcon className="h-4 w-4 text-rose-500" /> Vital Matrix
                </h3>
                <div className="space-y-5">
                  {[
                    { l: 'Blood Pressure', v: patientData.bloodPressure || '—', c: 'text-rose-400' },
                    { l: 'Pulse Rate', v: patientData.pulse ? `${patientData.pulse} bpm` : '—', c: 'text-indigo-400' },
                    { l: 'Body Height', v: patientData.height ? `${patientData.height} cm` : '—', c: 'text-emerald-400' }
                  ].map((vit, i) => (
                    <div key={i} className="flex justify-between items-center group">
                      <span className="text-xs font-bold text-slate-400 group-hover:text-slate-300 transition-colors">{vit.l}</span>
                      <span className={`text-sm font-black ${vit.c}`}>{vit.v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>

          {/* RIGHT COLUMN: Detiled Info (8 cols) */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* PERSONAL INFO CARD */}
            <Reveal delay={0.15}>
              <div className="bg-white rounded-[32px] border border-slate-100 p-8 md:p-10 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                      <IdentificationIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Identity Details</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Personal Information</p>
                    </div>
                  </div>
                  {!isEditingProfile && (
                    <button onClick={() => setIsEditingProfile(true)} 
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                      Edit Data
                    </button>
                  )}
                </div>

                {isEditingProfile ? (
                  <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                        <input {...profileForm.register('firstName')} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                        <input {...profileForm.register('lastName')} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone</label>
                        <input {...profileForm.register('phone')} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Birth Date</label>
                        <input {...profileForm.register('dateOfBirth')} type="date" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</label>
                        <select {...profileForm.register('gender')} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Permanent Address</label>
                        <input {...profileForm.register('address')} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" />
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="submit" disabled={isLoading} className="flex-1 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all">
                        {isLoading ? 'Encrypting...' : 'Save Changes'}
                      </button>
                      <button type="button" onClick={() => setIsEditingProfile(false)} className="px-8 py-4 border border-slate-200 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {[
                      { l: 'Full Name', v: `${user?.firstName} ${user?.lastName}`, i: UserIcon },
                      { l: 'Contact Phone', v: user?.phone || 'Not provided', i: PhoneIcon },
                      { l: 'Date of Birth', v: user?.dateOfBirth || 'Not provided', i: CalendarIcon },
                      { l: 'Gender Identity', v: user?.gender || 'Not specified', i: UserIcon, c: 'capitalize' },
                      { l: 'Registered Email', v: user?.email, i: EnvelopeIcon },
                      { l: 'Primary Address', v: user?.address || 'Not provided', i: HomeIcon },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-4 group">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <item.i className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{item.l}</p>
                          <p className={`text-sm font-bold text-slate-900 leading-tight ${item.c || ''}`}>{item.v}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>

            {/* MEDICAL INFO CARD */}
            <Reveal delay={0.2}>
              <div className="bg-white rounded-[32px] border border-slate-100 p-8 md:p-10 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center border border-rose-100">
                      <HeartIcon className="h-6 w-6 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Medical Context</h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clinical Background</p>
                    </div>
                  </div>
                  {!isEditingMedical && (
                    <button onClick={() => setIsEditingMedical(true)} 
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                      Modify Clinical Data
                    </button>
                  )}
                </div>

                {isEditingMedical ? (
                  <form onSubmit={medicalForm.handleSubmit(onSubmitMedical)} className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      {/* SUB: Vitals */}
                      <div className="space-y-6">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" /> Vitals & Metrics
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5 col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Blood Type</label>
                            <select {...medicalForm.register('bloodType')} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all">
                              <option value="">Select Type</option>
                              {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Height (cm)</label>
                            <input {...medicalForm.register('height')} type="number" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Weight (kg)</label>
                            <input {...medicalForm.register('weight')} type="number" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20" />
                          </div>
                        </div>
                      </div>

                      {/* SUB: Emergency */}
                      <div className="space-y-6">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500" /> Emergency & Insurance
                        </h4>
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Emergency Contact Name</label>
                            <input {...medicalForm.register('emergencyContact')} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Emergency Phone</label>
                            <input {...medicalForm.register('emergencyPhone')} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SUB: Allergies (Enhanced Dropdown) */}
                    <div className="p-8 bg-amber-50/50 rounded-[28px] border border-amber-100/50 relative z-[60]">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> Known Allergies
                      </h4>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {selectedAllergies.map(a => (
                          <span key={a} className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 border border-amber-200 shadow-sm">
                            {a} <XMarkIcon className="h-3.5 w-3.5 cursor-pointer hover:scale-125 transition-transform" onClick={() => removeAllergy(a)} />
                          </span>
                        ))}
                      </div>
                      <div className="relative" ref={dropdownRef}>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input type="text" value={allergySearch} placeholder="Search common allergies..." 
                              onChange={e => { setAllergySearch(e.target.value); setShowAllergyDropdown(true); }}
                              onFocus={() => setShowAllergyDropdown(true)}
                              className="w-full pl-5 pr-10 py-3.5 bg-white border border-amber-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none" />
                            <ChevronDownIcon className="absolute right-4 top-4 h-5 w-5 text-amber-300" />
                          </div>
                          <button type="button" onClick={addCustomAllergy} className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Add</button>
                        </div>
                        {showAllergyDropdown && allergySearch && (
                          <div className="absolute z-[100] mt-2 w-full max-h-60 overflow-auto bg-white border border-amber-100 rounded-2xl shadow-2xl py-2 scrollbar-none">
                            {COMMON_ALLERGIES.filter(a => a.toLowerCase().includes(allergySearch.toLowerCase()) && !selectedAllergies.includes(a)).map(a => (
                              <button key={a} type="button" onClick={() => addAllergy(a)} className="w-full text-left px-5 py-3 hover:bg-amber-50 text-sm font-bold text-slate-700 transition-colors">{a}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SUB: Clinical History */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" /> Medical History
                        </h4>
                        <textarea {...medicalForm.register('chronicConditions')} rows={3} placeholder="Chronic Conditions" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                        <textarea {...medicalForm.register('pastSurgeries')} rows={3} placeholder="Past Surgeries" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 outline-none" />
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-violet-500" /> Habits & Lifestyle
                        </h4>
                        <select {...medicalForm.register('smokingStatus')} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20">
                          <option value="never">Never Smoked</option><option value="former">Former Smoker</option><option value="current">Current Smoker</option>
                        </select>
                        <select {...medicalForm.register('alcoholConsumption')} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20">
                          <option value="never">Never Alcohol</option><option value="occasional">Social Drinker</option><option value="regular">Regular</option>
                        </select>
                        <select {...medicalForm.register('physicalActivity')} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20">
                          <option value="sedentary">Sedentary</option><option value="moderate">Moderate</option><option value="active">Very Active</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button type="submit" disabled={isLoading} className="flex-1 px-8 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 active:scale-95 transition-all">
                        {isLoading ? 'Syncing...' : 'Update Clinical Dossier'}
                      </button>
                      <button type="button" onClick={() => setIsEditingMedical(false)} className="px-8 py-4 border border-slate-200 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-12">
                    {/* View mode: Simplified Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { l: 'BP Profile', v: patientData.bloodPressure || 'N/A', c: 'blue' },
                        { l: 'Pulse Rate', v: patientData.pulse ? `${patientData.pulse} bpm` : 'N/A', c: 'emerald' },
                        { l: 'BMI Index', v: patientData.height && patientData.weight ? (parseFloat(patientData.weight) / Math.pow(parseFloat(patientData.height)/100, 2)).toFixed(1) : 'N/A', c: 'indigo' },
                        { l: 'Allergies', v: selectedAllergies.length || 'None', c: 'amber' }
                      ].map((st, i) => (
                        <div key={i} className={`p-5 rounded-2xl bg-${st.c}-50 border border-${st.c}-100`}>
                          <p className={`text-[10px] font-black uppercase text-${st.c}-600 tracking-widest mb-1`}>{st.l}</p>
                          <p className={`text-xl font-black text-${st.c}-900`}>{st.v}</p>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-8">
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Core Clinical Data</h4>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center py-3 border-b border-slate-50 text-sm">
                              <span className="font-bold text-slate-500">Emergency Contact</span>
                              <span className="font-black text-slate-900">{patientData.emergencyContact || '—'}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-50 text-sm">
                              <span className="font-bold text-slate-500">Provider Phone</span>
                              <span className="font-black text-slate-900">{patientData.emergencyPhone || '—'}</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b border-slate-50 text-sm">
                              <span className="font-bold text-slate-500">Insurance Provider</span>
                              <span className="font-black text-slate-900">{patientData.insuranceProvider || '—'}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Allergy Manifest</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedAllergies.length ? selectedAllergies.map((a, i) => (
                              <span key={i} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase border border-slate-100">{a}</span>
                            )) : <span className="text-sm font-bold text-slate-300 italic">No allergies registered.</span>}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div className="p-6 bg-slate-900 rounded-3xl text-white relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-bl-full" />
                          <div className="relative z-10 flex flex-col h-full justify-between">
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 text-teal-400">
                                <SparklesIcon className="h-4 w-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Self Assessment</span>
                              </div>
                              <h4 className="text-lg font-black leading-tight">Weekly Health &<br /> Lifestyle Monitoring</h4>
                              <p className="text-slate-400 text-xs font-medium leading-relaxed">System-generated insights based on your recent activity levels and daily habits.</p>
                            </div>
                            <button 
                              onClick={() => assessmentStatus?.canTakeAssessment ? setIsAssessmentOpen(true) : toast(`Next available in ${assessmentStatus?.daysUntilNext || 7} days.`, { icon: '⏳' })}
                              className={`mt-8 w-full py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${assessmentStatus?.canTakeAssessment ? 'bg-teal-500 text-white hover:bg-teal-400' : 'bg-white/5 text-slate-500 border border-white/5'}`}>
                              {assessmentStatus?.canTakeAssessment ? 'Launch Assessment' : `Locked for ${assessmentStatus?.daysUntilNext} days`}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>

        {/* ═══ DOCUMENT VAULT ═══ */}
        <Reveal delay={0.3}>
          <div className="bg-white rounded-[32px] border border-slate-100 p-8 md:p-12 shadow-sm">
            <div className="md:flex items-start justify-between gap-10 mb-12">
              <div className="space-y-2 mb-6 md:mb-0">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <ShieldCheckIcon className="h-7 w-7 text-emerald-500" /> Clinical Document Vault
                </h3>
                <p className="text-slate-400 font-medium text-sm">Securely store and manage your lab reports, prescriptions, and digital imaging.</p>
              </div>
              
              <div className="flex-shrink-0 w-full md:w-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex gap-2">
                    <input type="text" value={docName} onChange={e => setDocName(e.target.value)} placeholder="File Name..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20" />
                    <select value={docType} onChange={e => setDocType(e.target.value)}
                      className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 outline-none">
                      <option value="Lab Report">Lab Report</option>
                      <option value="Prescription">Prescription</option>
                      <option value="ID/Insurance">ID/Insurance</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <button onClick={() => docInputRef.current?.click()} disabled={isUploadingDoc}
                    className="flex-shrink-0 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95">
                    {isUploadingDoc ? 'Syncing...' : <><ArrowUpTrayIcon className="h-3.5 w-3.5" /> Upload File</>}
                  </button>
                  <input ref={docInputRef} type="file" className="hidden" onChange={handleDocUpload} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {medicalDocuments.length ? medicalDocuments.map((doc, i) => (
                <Reveal key={doc.id} delay={i * 0.05}>
                  <div className="group p-5 bg-white border border-slate-100 rounded-[24px] hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-slate-50 group-hover:bg-indigo-50 rounded-bl-full transition-colors" />
                    <div className="relative z-10 flex flex-col h-full">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-white transition-colors">
                        <DocumentTextIcon className="h-5 w-5 text-indigo-500" />
                      </div>
                      <div className="flex-1 space-y-1 mb-6">
                        <h4 className="font-bold text-slate-900 text-sm truncate pr-4">{doc.documentName}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{doc.documentType}</span>
                          <div className="w-1 h-1 rounded-full bg-slate-200" />
                          <span className="text-[9px] font-bold text-slate-300">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <a href={doc.documentUrl} target="_blank" rel="noopener noreferrer"
                        className="w-full py-2.5 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all">
                        <ArrowDownTrayIcon className="h-3.5 w-3.5" /> Download
                      </a>
                    </div>
                  </div>
                </Reveal>
              )) : (
                <div className="col-span-full py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto border border-slate-100">
                    <DocumentTextIcon className="h-8 w-8 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-medium text-sm">No clinical documents in your vault yet.</p>
                </div>
              )}
            </div>
          </div>
        </Reveal>

      </div>

      {/* LIFESTYLE ASSESSMENT MODAL */}
      <AnimatePresence>
        {isAssessmentOpen && patientId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[500] p-4"
            onClick={() => setIsAssessmentOpen(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] p-2 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className="relative h-full overflow-y-auto scrollbar-none p-6 md:p-10">
                <button onClick={() => setIsAssessmentOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors z-10">
                  <XMarkIcon className="h-6 w-6" />
                </button>
                <WeeklyLifestyleAssessment isOpen={isAssessmentOpen} onClose={() => setIsAssessmentOpen(false)} patientId={patientId} onComplete={() => { setIsAssessmentOpen(false); fetchPatientData(); }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PatientProfile;
