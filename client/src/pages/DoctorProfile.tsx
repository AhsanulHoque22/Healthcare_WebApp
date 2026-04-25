import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import API from '../api/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../services/paymentService';
import { MEDICAL_DEPARTMENTS, getDepartmentLabel } from '../utils/departments';
import {
  UserIcon, AcademicCapIcon, TrophyIcon, MapPinIcon, ClockIcon,
  CameraIcon, PlusIcon, XMarkIcon, CheckCircleIcon, PencilIcon,
  StarIcon, HeartIcon, ShieldCheckIcon, PhoneIcon, HomeIcon,
  IdentificationIcon, PencilSquareIcon,
} from '@heroicons/react/24/outline';
import DoctorRatings from '../components/DoctorRatings';
import { Reveal, MagneticButton } from '../components/landing/AnimatedSection';
import { motion } from 'framer-motion';

/* ── Shared style constants ─────────────────────────────────────── */
const inputCls = [
  'w-full px-4 py-3 rounded-xl border border-slate-200 bg-white',
  'text-sm font-medium text-slate-900 placeholder:text-slate-400',
  'focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10',
  'transition-all duration-200',
  'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-default',
].join(' ');

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-1.5">
    {children}
  </label>
);

const FieldError: React.FC<{ msg?: string }> = ({ msg }) =>
  msg ? (
    <p className="mt-1.5 text-xs font-semibold text-rose-500 flex items-center gap-1.5">
      <span className="w-1 h-1 rounded-full bg-rose-500 flex-shrink-0" />
      {msg}
    </p>
  ) : null;

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
  chamberTimes: { [key: string]: string[] };
  chambers: Array<{
    id: string;
    name: string;
    address: string;
    chamberTimes: { [key: string]: string[] };
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
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureFileInputRef = useRef<HTMLInputElement>(null);
  const [profileData, setProfileData] = useState<DoctorProfileData>({
    department: '', experience: 0, education: '', certifications: '',
    degrees: [], awards: [], hospital: '', location: '', chamberTimes: {},
    chambers: [], consultationFee: '', languages: ['English', 'Bengali'],
    services: [], bio: '',
  });

  const [newDegree, setNewDegree]   = useState('');
  const [newAward, setNewAward]     = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newService, setNewService] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    defaultValues: profileData,
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const commonDegrees   = ['MBBS', 'MD', 'MS', 'FCPS', 'MCPS', 'MRCP', 'FRCS', 'DDV', 'DCH', 'DGO', 'DLO', 'DMRD', 'DCP'];
  const commonServices  = ['General Consultation', 'Emergency Care', 'Surgery', 'Diagnostic Tests', 'Vaccination', 'Health Checkup', 'Follow-up Care', 'Telemedicine', 'Home Visit', 'Second Opinion'];
  const commonLanguages = ['English', 'Bengali', 'Hindi', 'Arabic', 'Urdu', 'French', 'Spanish', 'German', 'Chinese', 'Japanese'];

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
        bio: data.bio || '',
      });
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

  useEffect(() => { fetchProfileData(); }, []);

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
        signature: profileData.signature,
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

  const addDegree    = () => { if (newDegree.trim() && !profileData.degrees.includes(newDegree.trim())) { setProfileData(p => ({ ...p, degrees: [...p.degrees, newDegree.trim()] })); setNewDegree(''); } };
  const removeDegree = (i: number) => setProfileData(p => ({ ...p, degrees: p.degrees.filter((_, j) => j !== i) }));

  const addAward    = () => { if (newAward.trim() && !profileData.awards.includes(newAward.trim())) { setProfileData(p => ({ ...p, awards: [...p.awards, newAward.trim()] })); setNewAward(''); } };
  const removeAward = (i: number) => setProfileData(p => ({ ...p, awards: p.awards.filter((_, j) => j !== i) }));

  const addLanguage    = () => { if (newLanguage.trim() && !profileData.languages.includes(newLanguage.trim())) { setProfileData(p => ({ ...p, languages: [...p.languages, newLanguage.trim()] })); setNewLanguage(''); } };
  const removeLanguage = (i: number) => setProfileData(p => ({ ...p, languages: p.languages.filter((_, j) => j !== i) }));

  const addService    = () => { if (newService.trim() && !profileData.services.includes(newService.trim())) { setProfileData(p => ({ ...p, services: [...p.services, newService.trim()] })); setNewService(''); } };
  const removeService = (i: number) => setProfileData(p => ({ ...p, services: p.services.filter((_, j) => j !== i) }));

  const addChamber = () => {
    const chambers = profileData.chambers || [];
    if (chambers.length > 0) {
      const last = chambers[chambers.length - 1];
      if (!last.name || !last.address) { toast.error('Please complete the Clinic Name and Address for the current chamber before adding another one.'); return; }
      const hasTimes = Object.values(last.chamberTimes).some(t => t && t.length > 0);
      if (!hasTimes) { toast.error('Please add at least one time slot to the current chamber before adding another one.'); return; }
    }
    setProfileData(p => ({ ...p, chambers: [...(p.chambers || []), { id: Date.now().toString(), name: '', address: '', chamberTimes: {} }] }));
  };

  const removeChamber = (i: number) => setProfileData(p => ({ ...p, chambers: (p.chambers || []).filter((_, j) => j !== i) }));

  const updateChamberField = (ci: number, field: string, value: string) => {
    setProfileData(p => {
      const nc = [...(p.chambers || [])];
      nc[ci] = { ...nc[ci], [field]: value };
      return { ...p, chambers: nc };
    });
  };

  const formatToAMPM = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    let h = parseInt(hours);
    const m = minutes;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12; h = h ? h : 12;
    return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  const addSpecificChamberTime = (ci: number, day: string, timeString: string) => {
    if (!timeString.trim()) return;
    setProfileData(p => {
      const nc = [...(p.chambers || [])];
      const chamber = { ...nc[ci] };
      const currentTimes = chamber.chamberTimes[day] || [];
      if (!currentTimes.includes(timeString.trim())) {
        chamber.chamberTimes = { ...chamber.chamberTimes, [day]: [...currentTimes, timeString.trim()] };
      }
      nc[ci] = chamber;
      return { ...p, chambers: nc };
    });
  };

  const removeSpecificChamberTime = (ci: number, day: string, timeSlot: string) => {
    setProfileData(p => {
      const nc = [...(p.chambers || [])];
      const chamber = { ...nc[ci] };
      const newTimes = (chamber.chamberTimes[day] || []).filter(t => t !== timeSlot);
      chamber.chamberTimes = { ...chamber.chamberTimes, [day]: newTimes };
      if (newTimes.length === 0) delete chamber.chamberTimes[day];
      nc[ci] = chamber;
      return { ...p, chambers: nc };
    });
  };

  const handleImageUpload = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select a valid image file (JPG, PNG, GIF)'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image size must be less than 5MB'); return; }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);
      const response = await API.post('/doctors/upload-image', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.success) {
        setProfileData(p => ({ ...p, profileImage: response.data.data.imageUrl }));
        if (response.data.data.imageUrl) {
          const userResponse = await API.get('/auth/profile');
          if (userResponse.data.success) { window.location.reload(); }
        }
        toast.success('Image uploaded successfully!');
      } else { throw new Error(response.data.message || 'Upload failed'); }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSignatureUpload = () => signatureFileInputRef.current?.click();

  const handleSignatureFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select a valid image file (JPG, PNG, GIF)'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Signature size must be less than 2MB'); return; }
    setIsUploadingSignature(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);
      const response = await API.post('/doctors/upload-image?type=signature', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (response.data.success) {
        setProfileData(p => ({ ...p, signature: response.data.data.imageUrl }));
        toast.success('Signature uploaded successfully!');
      } else { throw new Error(response.data.message || 'Upload failed'); }
    } catch (error: any) {
      console.error('Signature Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload signature');
    } finally {
      setIsUploadingSignature(false);
      if (signatureFileInputRef.current) signatureFileInputRef.current.value = '';
    }
  };

  /* ── Tag chips helper ──────────────────────────────────────────── */
  const TagChips: React.FC<{
    items: string[];
    onRemove?: (i: number) => void;
    color?: string;
    editing?: boolean;
  }> = ({ items, onRemove, color = 'indigo', editing = false }) => (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <div
          key={i}
          className={`flex items-center gap-1.5 pl-3 ${editing ? 'pr-1.5' : 'pr-3'} py-1.5 bg-slate-50 border border-slate-100 rounded-xl group transition-all duration-200 ${editing ? 'hover:border-rose-100 hover:bg-rose-50' : ''}`}
        >
          <span className={`text-sm font-semibold text-slate-700 ${editing ? 'group-hover:text-rose-700' : ''} transition-colors`}>{item}</span>
          {editing && onRemove && (
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="w-5 h-5 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-100 transition-all flex-shrink-0"
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      {items.length === 0 && !editing && (
        <p className="text-sm font-medium text-slate-400">None added yet</p>
      )}
    </div>
  );

  /* ── Add input row helper ──────────────────────────────────────── */
  const AddRow: React.FC<{
    value: string;
    onChange: (v: string) => void;
    onAdd: () => void;
    placeholder: string;
    suggestions?: string[];
    suggestionLabel?: string;
  }> = ({ value, onChange, onAdd, placeholder, suggestions, suggestionLabel }) => (
    <div className="space-y-3 mt-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
          placeholder={placeholder}
          className="min-w-0 flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all"
        />
        <button
          type="button"
          onClick={onAdd}
          className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
        >
          <PlusIcon className="h-4 w-4" /> Add
        </button>
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{suggestionLabel || 'Quick add'}:</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => onChange(s)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-100 hover:text-indigo-600 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  /* ── Section header helper ────────────────────────────────────── */
  const SectionHeader: React.FC<{
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    title: string;
    subtitle: string;
    iconBg?: string;
    iconColor?: string;
    right?: React.ReactNode;
  }> = ({ icon: Icon, title, subtitle, iconBg = 'bg-indigo-50', iconColor = 'text-indigo-600', right }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">{title}</h3>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{subtitle}</p>
        </div>
      </div>
      {right}
    </div>
  );

  const profileChecklist = [
    profileData.profileImage,
    profileData.signature,
    profileData.bmdcRegistrationNumber,
    profileData.department,
    profileData.experience,
    profileData.education,
    profileData.hospital,
    profileData.location,
    profileData.consultationFee,
    profileData.bio,
    profileData.degrees.length > 0,
    profileData.languages.length > 0,
    profileData.services.length > 0,
    profileData.chambers.length > 0,
  ];
  const completedProfileItems = profileChecklist.filter(Boolean).length;
  const profileCompletion = Math.round((completedProfileItems / profileChecklist.length) * 100);
  const scheduleSlotCount = profileData.chambers.reduce(
    (total, chamber) => total + Object.values(chamber.chamberTimes || {}).reduce((count, slots) => count + slots.length, 0),
    0
  );
  const displayDepartment = getDepartmentLabel(profileData.department || '') || 'Not provided';
  const displayFee = profileData.consultationFee ? formatCurrency(parseFloat(profileData.consultationFee)) : 'Not set';
  const doctorInitials = `${user?.firstName?.charAt(0) ?? ''}${user?.lastName?.charAt(0) ?? ''}` || 'DR';
  const profileSignals = [
    {
      label: 'Profile Completion',
      value: `${profileCompletion}%`,
      note: `${completedProfileItems}/${profileChecklist.length} essentials`,
      icon: ShieldCheckIcon,
      iconWrap: 'bg-indigo-50 border-indigo-100',
      iconColor: 'text-indigo-600',
      tint: 'bg-indigo-500/5',
    },
    {
      label: 'Experience',
      value: profileData.experience ? `${profileData.experience} yrs` : 'Not set',
      note: displayDepartment,
      icon: AcademicCapIcon,
      iconWrap: 'bg-violet-50 border-violet-100',
      iconColor: 'text-violet-600',
      tint: 'bg-violet-500/5',
    },
    {
      label: 'Consultation Fee',
      value: displayFee,
      note: 'Patient-facing pricing',
      icon: HeartIcon,
      iconWrap: 'bg-rose-50 border-rose-100',
      iconColor: 'text-rose-600',
      tint: 'bg-rose-500/5',
    },
    {
      label: 'Schedule Slots',
      value: `${scheduleSlotCount}`,
      note: `${profileData.chambers.length} chamber${profileData.chambers.length === 1 ? '' : 's'} configured`,
      icon: ClockIcon,
      iconWrap: 'bg-teal-50 border-teal-100',
      iconColor: 'text-teal-600',
      tint: 'bg-teal-500/5',
    },
  ];

  return (
    <div className="min-h-screen bg-[#fafbff] relative overflow-hidden noise-overlay font-sans selection:bg-indigo-100 selection:text-indigo-900">

      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-violet-500/5 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(#4f46e5 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 space-y-10">

        {/* ══ HERO CARD ══ */}
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] bg-slate-900 p-8 md:p-12 text-white shadow-2xl shadow-slate-200/50">
            <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-l from-indigo-500/20 via-transparent to-transparent opacity-60" />
              <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-indigo-400/20 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 lg:gap-12">
              <div className="space-y-5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Doctor Profile
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-200 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-400/20">
                    {isEditing ? 'Editing Mode' : 'Public Profile'}
                  </div>
                </div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05]">
                  Dr. {user?.firstName}<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300 animate-gradient-shift italic pr-2">
                    {user?.lastName}
                  </span>.
                </h1>
                <p className="text-slate-400 font-medium max-w-xl text-base md:text-lg leading-relaxed">
                  Manage your professional information and practice details.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <MagneticButton
                    onClick={() => setIsEditing(!isEditing)}
                    className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all duration-200 ${
                      isEditing
                        ? 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        : 'bg-white text-slate-900 hover:bg-slate-100 shadow-lg shadow-white/5'
                    }`}
                  >
                    <PencilIcon className="h-4 w-4" />
                    {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                  </MagneticButton>
                </div>
              </div>

              <div className="w-full lg:w-[360px] flex-shrink-0">
                <div className="premium-card glass-dark rounded-[28px] p-5 border border-white/10 shadow-2xl shadow-slate-950/30">
                  <div className="flex items-center gap-4">
                    {profileData.profileImage ? (
                      <img src={profileData.profileImage} alt="Profile" className="w-20 h-20 rounded-2xl object-cover border-2 border-white/20 shadow-xl" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
                        <span className="text-xl font-black text-white/70">{doctorInitials}</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Status</p>
                      <p className="text-lg font-black text-emerald-400">Active</p>
                      <p className="text-sm font-semibold text-slate-400 truncate">{displayDepartment}</p>
                    </div>
                  </div>
                  <div className="mt-5 pt-5 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Profile Completion</span>
                      <span className="text-sm font-black text-white">{profileCompletion}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-300"
                        style={{ width: `${profileCompletion}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* ══ PROFESSIONAL SIGNALS ══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {profileSignals.map((signal, i) => {
            const SignalIcon = signal.icon;
            return (
              <Reveal key={signal.label} delay={i * 0.06}>
                <div className="premium-card group bg-white rounded-[28px] border border-slate-100 p-5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-20 h-20 ${signal.tint} rounded-bl-full opacity-70 group-hover:scale-110 transition-transform duration-500`} />
                  <div className={`w-11 h-11 rounded-2xl ${signal.iconWrap} border flex items-center justify-center mb-5 shadow-inner group-hover:rotate-6 transition-transform duration-500`}>
                    <SignalIcon className={`h-5 w-5 ${signal.iconColor}`} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{signal.label}</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">{signal.value}</p>
                  <p className="text-xs font-semibold text-slate-400 mt-1 truncate">{signal.note}</p>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* ══ CONTENT GRID ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ─── LEFT COLUMN ─── */}
          <div className="lg:col-span-1 space-y-6">

            {/* Profile Image */}
            <Reveal>
              <div className="premium-card bg-white rounded-[32px] border border-slate-100 p-6 md:p-7 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                <SectionHeader icon={CameraIcon} title="Profile Image" subtitle="Your professional photo" iconBg="bg-violet-50" iconColor="text-violet-600" />
                <div className="text-center">
                  {profileData.profileImage ? (
                    <div className="relative inline-block mb-6 group/avatar">
                      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 via-violet-100 to-cyan-100 rounded-[28px] rotate-6 group-hover/avatar:rotate-12 transition-transform duration-700" />
                      <img src={profileData.profileImage} alt="Profile" className="relative h-44 w-44 rounded-[28px] object-cover mx-auto shadow-xl border-4 border-white ring-1 ring-slate-100" />
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircleIcon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="relative h-44 w-44 mx-auto mb-6">
                      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 via-violet-100 to-cyan-100 rounded-[28px] rotate-6" />
                      <div className="relative h-44 w-44 rounded-[28px] bg-slate-50 border-4 border-white ring-1 ring-slate-100 flex items-center justify-center shadow-sm">
                        <span className="text-4xl font-black text-slate-300">{doctorInitials}</span>
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Dr. {user?.firstName} {user?.lastName}</h2>
                    <p className="text-sm font-bold text-slate-400">{user?.email}</p>
                  </div>
                  <div className="mt-6 grid grid-cols-1 gap-3 text-left">
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <MapPinIcon className="h-5 w-5 text-teal-500 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Location</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{profileData.location || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <PhoneIcon className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Contact</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{user?.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                  {isEditing && (
                    <>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                      <button
                        type="button"
                        onClick={handleImageUpload}
                        disabled={isUploading}
                        className="mt-6 w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CameraIcon className="h-4 w-4" />
                        {isUploading ? 'Uploading...' : 'Upload Image'}
                      </button>
                      <p className="text-xs text-slate-400 font-medium mt-2">JPG, PNG, GIF up to 5MB</p>
                    </>
                  )}
                </div>
              </div>
            </Reveal>

            {/* Digital Signature */}
            <Reveal delay={0.1}>
              <div className="premium-card bg-white rounded-[32px] border border-slate-100 p-6 md:p-7 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                <SectionHeader icon={PencilSquareIcon} title="Digital Signature" subtitle="For printing on prescriptions" iconBg="bg-blue-50" iconColor="text-blue-600" />
                <div className="text-center">
                  {profileData.signature ? (
                    <div className="relative inline-block bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-200 mb-6">
                      <img src={profileData.signature} alt="Signature" className="h-20 w-auto max-w-[200px] object-contain mx-auto mix-blend-multiply" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircleIcon className="h-3.5 w-3.5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-24 w-full max-w-[240px] rounded-2xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center mx-auto mb-6">
                      <PencilSquareIcon className="h-10 w-10 text-slate-200" />
                    </div>
                  )}
                  {isEditing && (
                    <>
                      <input ref={signatureFileInputRef} type="file" accept="image/*" onChange={handleSignatureFileChange} className="hidden" />
                      <button
                        type="button"
                        onClick={handleSignatureUpload}
                        disabled={isUploadingSignature}
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CameraIcon className="h-4 w-4" />
                        {isUploadingSignature ? 'Uploading...' : 'Upload Signature'}
                      </button>
                      <p className="text-xs text-slate-400 font-medium mt-2">Transparent PNG works best</p>
                    </>
                  )}
                </div>
              </div>
            </Reveal>
          </div>

          {/* ─── RIGHT COLUMN ─── */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

              {/* ── Basic Information ── */}
              <Reveal>
                <div className="premium-card bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                  <SectionHeader icon={IdentificationIcon} title="Basic Information" subtitle="Your professional credentials" iconBg="bg-indigo-50" iconColor="text-indigo-600" />

                  {/* BMDC Badge */}
                  {profileData?.bmdcRegistrationNumber && (
                    <div className="mb-6 p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl flex items-start gap-3">
                      <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ShieldCheckIcon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-600 mb-0.5">BMDC Registration Number</p>
                        <p className="text-base font-black text-indigo-900">{profileData.bmdcRegistrationNumber}</p>
                        <p className="text-xs text-indigo-500 font-medium mt-0.5">Unique identifier — cannot be changed.</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Department */}
                    <div>
                      <FieldLabel>Medical Department</FieldLabel>
                      {isEditing ? (
                        <select {...register('department')} className={inputCls}>
                          <option value="">Select Department</option>
                          {MEDICAL_DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                        </select>
                      ) : (
                        <p className="text-sm font-bold text-slate-900 py-1">{getDepartmentLabel(profileData.department || '') || <span className="text-slate-400 font-medium">Not provided</span>}</p>
                      )}
                      <FieldError msg={errors.department?.message as string} />
                    </div>

                    {/* Experience */}
                    <div>
                      <FieldLabel>Experience (Years)</FieldLabel>
                      {isEditing ? (
                        <input {...register('experience')} type="number" min="0" max="50" placeholder="Years of experience" className={inputCls} />
                      ) : (
                        <p className="text-sm font-bold text-slate-900 py-1">{profileData.experience ? `${profileData.experience} years` : <span className="text-slate-400 font-medium">Not provided</span>}</p>
                      )}
                      <FieldError msg={errors.experience?.message as string} />
                    </div>

                    {/* Education */}
                    <div>
                      <FieldLabel>Education</FieldLabel>
                      {isEditing ? (
                        <input {...register('education')} placeholder="Enter education details" className={inputCls} />
                      ) : (
                        <p className="text-sm font-bold text-slate-900 py-1">{profileData.education || <span className="text-slate-400 font-medium">Not provided</span>}</p>
                      )}
                      <FieldError msg={errors.education?.message as string} />
                    </div>

                    {/* Certifications */}
                    <div>
                      <FieldLabel>Certifications</FieldLabel>
                      {isEditing ? (
                        <input {...register('certifications')} placeholder="Enter certifications" className={inputCls} />
                      ) : (
                        <p className="text-sm font-bold text-slate-900 py-1">{profileData.certifications || <span className="text-slate-400 font-medium">Not provided</span>}</p>
                      )}
                      <FieldError msg={errors.certifications?.message as string} />
                    </div>

                    {/* Hospital */}
                    <div>
                      <FieldLabel>Hospital / Clinic Name</FieldLabel>
                      {isEditing ? (
                        <input {...register('hospital')} placeholder="Enter hospital name" className={inputCls} />
                      ) : (
                        <p className="text-sm font-bold text-slate-900 py-1">{profileData.hospital || <span className="text-slate-400 font-medium">Not provided</span>}</p>
                      )}
                      <FieldError msg={errors.hospital?.message as string} />
                    </div>

                    {/* Consultation Fee */}
                    <div>
                      <FieldLabel>Consultation Fee (BDT)</FieldLabel>
                      {isEditing ? (
                        <input {...register('consultationFee')} type="number" placeholder="Enter consultation fee" className={inputCls} />
                      ) : (
                        <p className="text-sm font-bold text-slate-900 py-1">{profileData.consultationFee ? formatCurrency(parseFloat(profileData.consultationFee)) : <span className="text-slate-400 font-medium">Not set</span>}</p>
                      )}
                      <FieldError msg={errors.consultationFee?.message as string} />
                    </div>
                  </div>

                  {/* Location — full width */}
                  <div className="mt-5">
                    <FieldLabel>Location</FieldLabel>
                    {isEditing ? (
                      <input {...register('location')} placeholder="Enter hospital address" className={inputCls} />
                    ) : (
                      <p className="text-sm font-bold text-slate-900 py-1">{profileData.location || <span className="text-slate-400 font-medium">Not provided</span>}</p>
                    )}
                    <FieldError msg={errors.location?.message as string} />
                  </div>

                  {/* Bio — full width */}
                  <div className="mt-5">
                    <FieldLabel>Bio</FieldLabel>
                    {isEditing ? (
                      <textarea
                        {...register('bio')}
                        rows={4}
                        placeholder="Tell patients about yourself, your approach to medicine, and what makes you unique..."
                        className={`${inputCls} resize-none`}
                      />
                    ) : (
                      <p className="text-sm font-medium text-slate-700 leading-relaxed py-1">{profileData.bio || <span className="text-slate-400">No bio provided</span>}</p>
                    )}
                    <FieldError msg={errors.bio?.message as string} />
                  </div>
                </div>
              </Reveal>

              {/* ── Chambers & Schedules ── */}
              <Reveal delay={0.05}>
                <div className="premium-card bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                  <SectionHeader
                    icon={HomeIcon}
                    title="Chambers & Schedules"
                    subtitle="Locations and availability"
                    iconBg="bg-teal-50"
                    iconColor="text-teal-600"
                    right={isEditing ? (
                      <button type="button" onClick={addChamber} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-teal-700 transition-colors shadow-sm">
                        <PlusIcon className="h-4 w-4" /> Add Chamber
                      </button>
                    ) : undefined}
                  />

                  <div className="space-y-6">
                    {profileData.chambers && profileData.chambers.map((chamber, cIndex) => (
                      <div key={chamber.id || cIndex} className="relative bg-slate-50/70 rounded-[28px] border border-slate-100 p-5 md:p-6 shadow-inner shadow-white/60">
                        {/* Chamber number badge */}
                        <div className="absolute -top-3 left-5 px-3 py-1 bg-white border border-slate-100 rounded-full text-[9px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                          Chamber {cIndex + 1}
                        </div>
                        {isEditing && (
                          <button type="button" onClick={() => removeChamber(cIndex)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 mb-6">
                          <div>
                            <FieldLabel>Clinic / Hospital Name</FieldLabel>
                            <input type="text" value={chamber.name} onChange={e => updateChamberField(cIndex, 'name', e.target.value)} disabled={!isEditing} placeholder="e.g. LabAid Hospital" className={inputCls} />
                          </div>
                          <div>
                            <FieldLabel>Chamber Address / Location</FieldLabel>
                            <input type="text" value={chamber.address} onChange={e => updateChamberField(cIndex, 'address', e.target.value)} disabled={!isEditing} placeholder="e.g. Dhanmondi, Dhaka" className={inputCls} />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {days.map(day => (
                            <div key={day} className="bg-white rounded-2xl border border-slate-100 p-4 transition-all duration-300 hover:border-teal-100 hover:shadow-sm">
                              <h5 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 pb-2 border-b border-slate-100">{day}</h5>

                              <div className="flex flex-wrap gap-1.5 mb-3 min-h-[1.5rem]">
                                {(chamber.chamberTimes[day] || []).map(slot => (
                                  <div key={slot} className="flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-teal-50 border border-teal-100 rounded-lg text-xs font-semibold text-teal-700">
                                    <span>{slot}</span>
                                    {isEditing && (
                                      <button type="button" onClick={() => removeSpecificChamberTime(cIndex, day, slot)} className="text-teal-400 hover:text-rose-500 transition-colors ml-0.5">
                                        <XMarkIcon className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                {(!chamber.chamberTimes[day] || chamber.chamberTimes[day].length === 0) && (
                                  <p className="text-xs text-slate-400 italic">No times added</p>
                                )}
                              </div>

                              {isEditing && (
                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                  <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                      <ClockIcon className="h-3.5 w-3.5 text-teal-500" />
                                    </div>
                                    <input type="time" id={`start-${cIndex}-${day}`} className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" />
                                    <span className="absolute top-0 right-2 -translate-y-1/2 bg-white px-1.5 text-[8px] uppercase tracking-wider font-black text-teal-600 border border-teal-100 rounded-full">Start</span>
                                  </div>
                                  <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                                      <ClockIcon className="h-3.5 w-3.5 text-emerald-500" />
                                    </div>
                                    <input type="time" id={`end-${cIndex}-${day}`} className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" />
                                    <span className="absolute top-0 right-2 -translate-y-1/2 bg-white px-1.5 text-[8px] uppercase tracking-wider font-black text-emerald-600 border border-emerald-100 rounded-full">End</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const startEl = document.getElementById(`start-${cIndex}-${day}`) as HTMLInputElement;
                                      const endEl = document.getElementById(`end-${cIndex}-${day}`) as HTMLInputElement;
                                      if (startEl && endEl && startEl.value && endEl.value) {
                                        addSpecificChamberTime(cIndex, day, `${formatToAMPM(startEl.value)} - ${formatToAMPM(endEl.value)}`);
                                        startEl.value = ''; endEl.value = '';
                                      } else { toast.error('Select both start and end times'); }
                                    }}
                                    className="w-full py-2 bg-teal-600 text-white rounded-lg text-xs font-black hover:bg-teal-700 transition-colors flex items-center justify-center gap-1.5"
                                  >
                                    <PlusIcon className="h-3.5 w-3.5" /> Add Schedule
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {isEditing && (
                          <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-indigo-100">
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                              <ShieldCheckIcon className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                              Chamber details are temporarily tracked. Click Confirm to validate.
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                if (!chamber.name || !chamber.address) { toast.error('Please provide both Hospital/Clinic name and Address location.'); return; }
                                toast.success(`Confirmed! ${chamber.name} info is ready. Now click "Save Changes" to finish.`);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-colors flex-shrink-0"
                            >
                              <CheckCircleIcon className="h-4 w-4" /> Confirm & Lock Chamber Info
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {(!profileData.chambers || profileData.chambers.length === 0) && (
                      <div className="py-12 text-center">
                        <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <HomeIcon className="h-7 w-7 text-slate-300" />
                        </div>
                        <p className="text-sm font-bold text-slate-400">No chambers added</p>
                        <p className="text-xs text-slate-400 mt-1 font-medium">Add a chamber to set your schedule for patients.</p>
                      </div>
                    )}
                  </div>
                </div>
              </Reveal>

              {/* ── Degrees & Qualifications ── */}
              <Reveal delay={0.05}>
                <div className="premium-card bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                  <SectionHeader icon={AcademicCapIcon} title="Degrees & Qualifications" subtitle="Your academic achievements" iconBg="bg-violet-50" iconColor="text-violet-600" />
                  <TagChips items={profileData.degrees} onRemove={isEditing ? removeDegree : undefined} editing={isEditing} />
                  {isEditing && (
                    <AddRow
                      value={newDegree}
                      onChange={setNewDegree}
                      onAdd={addDegree}
                      placeholder="Add degree (e.g., MBBS, MD)"
                      suggestions={commonDegrees}
                      suggestionLabel="Common degrees"
                    />
                  )}
                </div>
              </Reveal>

              {/* ── Awards & Recognitions ── */}
              <Reveal delay={0.05}>
                <div className="premium-card bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                  <SectionHeader icon={TrophyIcon} title="Awards & Recognitions" subtitle="Your professional achievements" iconBg="bg-amber-50" iconColor="text-amber-600" />
                  <TagChips items={profileData.awards} onRemove={isEditing ? removeAward : undefined} editing={isEditing} />
                  {isEditing && (
                    <AddRow
                      value={newAward}
                      onChange={setNewAward}
                      onAdd={addAward}
                      placeholder="Add award or recognition"
                    />
                  )}
                </div>
              </Reveal>

              {/* ── Languages ── */}
              <Reveal delay={0.05}>
                <div className="premium-card bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                  <SectionHeader icon={UserIcon} title="Languages" subtitle="Languages you communicate in" iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                  <TagChips items={profileData.languages} onRemove={isEditing ? removeLanguage : undefined} editing={isEditing} />
                  {isEditing && (
                    <AddRow
                      value={newLanguage}
                      onChange={setNewLanguage}
                      onAdd={addLanguage}
                      placeholder="Add language"
                      suggestions={commonLanguages}
                      suggestionLabel="Common languages"
                    />
                  )}
                </div>
              </Reveal>

              {/* ── Medical Services ── */}
              <Reveal delay={0.05}>
                <div className="premium-card bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                  <SectionHeader icon={HeartIcon} title="Medical Services" subtitle="Services you provide to patients" iconBg="bg-rose-50" iconColor="text-rose-600" />
                  <TagChips items={profileData.services} onRemove={isEditing ? removeService : undefined} editing={isEditing} />
                  {isEditing && (
                    <AddRow
                      value={newService}
                      onChange={setNewService}
                      onAdd={addService}
                      placeholder="Add medical service"
                      suggestions={commonServices}
                      suggestionLabel="Common services"
                    />
                  )}
                </div>
              </Reveal>

              {/* ── Save / Cancel ── */}
              {isEditing && (
                <Reveal>
                  <div className="sticky bottom-5 z-20 bg-white/80 backdrop-blur-xl rounded-[28px] border border-white/70 p-4 shadow-2xl shadow-slate-900/10">
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="w-full sm:w-auto px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl text-sm font-black hover:bg-slate-200 transition-colors"
                      >
                        Cancel
                      </button>
                      <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={!isLoading ? { scale: 1.02 } : {}}
                        whileTap={!isLoading ? { scale: 0.97 } : {}}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-2xl text-sm font-black shadow-lg transition-colors ${
                          isLoading ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white hover:bg-indigo-700 shadow-indigo-500/10'
                        }`}
                      >
                        {isLoading ? (
                          <>
                            <span className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </Reveal>
              )}
            </form>

            {/* ── Ratings & Reviews ── */}
            <div className="mt-8">
              <Reveal>
                <div className="premium-card bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500">
                  <SectionHeader icon={StarIcon} title="Your Ratings & Reviews" subtitle="See what your patients are saying" iconBg="bg-amber-50" iconColor="text-amber-500" />
                  {doctorId ? (
                    <DoctorRatings doctorId={doctorId} showAll={true} />
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-sm font-medium text-slate-400">Loading reviews...</p>
                    </div>
                  )}
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
