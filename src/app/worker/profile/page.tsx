'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import useSWR, { mutate } from 'swr';
import { supabaseClient } from '@/lib/supabase-client';
import { compressKycImage } from '@/lib/image-compression';
import { 
  User, Mail, Phone, MapPin, Briefcase, Award, Languages, 
  FileText, Loader2, Save, Upload, CheckCircle2, AlertCircle, IdCard 
} from 'lucide-react';
import DigitalIdCardModal from '@/components/worker/DigitalIdCardModal';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface ProfileFormValues {
  full_name: string;
  email: string;
  address: string;
  city: string;
  state: string;
  skills: string;
  experience: number;
  languages: string;
  bio: string;
  dob: string;
}

export default function WorkerProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: profileData, error, isLoading } = useSWR('/api/worker/profile', fetcher);
  const { data: kycData } = useSWR('/api/worker/kyc', fetcher);
  const { data: userData } = useSWR('/api/auth/me', fetcher);
  const [showIdCardModal, setShowIdCardModal] = useState(false);
  const isKycApproved = kycData?.kycState?.overall_status === 'APPROVED';

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Avatar upload states
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setDetecting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const getPosition = (options: PositionOptions): Promise<GeolocationPosition> => {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    };

    const processCoords = async (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, {
          headers: { 'User-Agent': 'VoloHomeServices/1.0 (contact@volo.com)' }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.address) {
            const road = data.address.road || data.address.suburb || data.address.neighbourhood || '';
            const cityVal = data.address.city || data.address.town || data.address.village || data.address.county || '';
            const stateVal = data.address.state || '';

            setValue('address', data.display_name || road);
            setValue('city', cityVal);
            setValue('state', stateVal);
            setSuccessMsg('Location auto-detected successfully!');
          } else {
            setErrorMsg('Could not resolve address details.');
          }
        } else {
          setErrorMsg('Reverse geocoding service returned an error.');
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg('Failed to reverse geocode address.');
      } finally {
        setDetecting(false);
      }
    };

    const runDetection = async () => {
      try {
        const pos = await getPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 });
        await processCoords(pos);
      } catch (highAccErr: any) {
        console.warn('High accuracy location detection failed or timed out. Retrying with low accuracy fallback...', highAccErr);
        try {
          const pos = await getPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 });
          await processCoords(pos);
        } catch (fallbackErr: any) {
          setErrorMsg(`Location detection failed: ${fallbackErr.message || String(fallbackErr)}`);
          setDetecting(false);
        }
      }
    };

    runDetection();
  };

  const { register, handleSubmit, reset, setValue } = useForm<ProfileFormValues>({
    defaultValues: {
      full_name: '',
      email: '',
      address: '',
      city: 'Bangalore',
      state: 'Karnataka',
      skills: '',
      experience: 0,
      languages: '',
      bio: '',
      dob: ''
    }
  });

  // Load profile data into form once fetched
  useEffect(() => {
    if (profileData) {
      reset({
        full_name: profileData.full_name || '',
        email: profileData.email || '',
        address: profileData.address || '',
        city: profileData.city || 'Bangalore',
        state: profileData.state || 'Karnataka',
        skills: (profileData.skills || []).join(', '),
        experience: profileData.experience || 0,
        languages: (profileData.languages || []).join(', '),
        bio: profileData.bio || '',
        dob: profileData.dob || ''
      });
      setAvatarUrl(profileData.avatar_url || null);
    }
  }, [profileData, reset]);

  // Handle avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profileData) return;

    setErrorMsg('');
    setSuccessMsg('');
    setUploadingAvatar(true);
    setCompressing(true);

    try {
      // 1. Compress image to WebP profile photo spec
      const compressedFile = await compressKycImage(file, 'PROFILE_PHOTO');
      setCompressing(false);

      // 2. Fetch current user session to determine UUID
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) throw new Error('Unauthorized');
      const meData = await meRes.json();
      const userId = meData.user.id;

      // 3. Upload directly to Supabase storage 'profile-images' bucket
      const uploadPath = `worker_${userId}/profile.webp`;
      const { data: uploadData, error: uploadErr } = await supabaseClient.storage
        .from('profile-images')
        .upload(uploadPath, compressedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadErr) {
        throw new Error(`Avatar storage upload failed: ${uploadErr.message}`);
      }

      // 4. Update the avatar_url in the user's table via backend profile PATCH
      const patchRes = await fetch('/api/worker/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: profileData.full_name,
          email: profileData.email,
          address: profileData.address,
          city: profileData.city,
          state: profileData.state,
          skills: profileData.skills,
          experience: profileData.experience,
          languages: profileData.languages,
          bio: profileData.bio,
          avatar_url: uploadData.path
        })
      });

      if (!patchRes.ok) {
        const patchErr = await patchRes.json();
        throw new Error(patchErr.error || 'Failed to update avatar metadata.');
      }

      // 5. Query signed URL or use public url to refresh state locally
      // For public bucket or signed asset retrieval, get public url
      const { data: { publicUrl } } = supabaseClient.storage
        .from('profile-images')
        .getPublicUrl(uploadData.path);

      setAvatarUrl(publicUrl);
      setSuccessMsg('Avatar updated successfully.');
      
      // Mutate dashboard and profile caches
      mutate('/api/worker/profile');
      mutate('/api/worker/dashboard');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Avatar upload failed.');
    } finally {
      setUploadingAvatar(false);
      setCompressing(false);
    }
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    // Parse comma-separated list of skills & languages
    const skillsArray = values.skills
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const languagesArray = values.languages
      .split(',')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    try {
      const res = await fetch('/api/worker/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: values.full_name,
          email: values.email,
          address: values.address,
          city: values.city,
          state: values.state,
          skills: skillsArray,
          experience: Number(values.experience || 0),
          languages: languagesArray,
          bio: values.bio,
          dob: values.dob
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to save profile details.');
      }

      setSuccessMsg('Profile updated successfully.');
      mutate('/api/worker/profile');
      mutate('/api/worker/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-white">
        <Loader2 className="h-8 w-8 text-[#FF7A00] animate-spin" />
        <p className="text-xs text-slate-500 mt-3 font-bold uppercase tracking-wider animate-pulse">Loading profile details...</p>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl text-center space-y-4 max-w-md mx-auto mt-12">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h3 className="font-black text-white">Failed to load Profile</h3>
        <p className="text-xs text-slate-400 leading-relaxed">There was a problem loading your profile details. Please try refreshing.</p>
        <button
          type="button"
          onClick={() => mutate('/api/worker/profile')}
          className="px-5 py-2.5 bg-[#EF4444] hover:bg-red-500 rounded-2xl text-xs font-black text-white transition-colors cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto selection:bg-orange-500/30 selection:text-white">
      
      {/* Title Header */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 h-40 w-40 bg-[#FF7A00]/10 blur-[65px] rounded-full pointer-events-none" />
        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2"><User className="h-5 w-5 text-[#FF7A00]" />Partner Profile</h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">Provide bio, skills, and languages to attract better service allocations.</p>
      </div>

      {/* Profile Form Container */}
      <div className="bg-[#0F172A] border border-white/[0.08] rounded-3xl p-6 shadow-xl space-y-6">
        
        {/* Avatar Editor Widget */}
        <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-white/[0.06]">
          <div className="relative h-20 w-20 rounded-2xl bg-[#070B14] border border-white/[0.08] flex items-center justify-center overflow-hidden shrink-0 group">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={!avatarUrl.startsWith('http')
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/profile-images/${avatarUrl}` 
                  : avatarUrl
                } 
                alt="Avatar" 
                className="h-full w-full object-cover" 
              />
            ) : (
              <User className="h-8 w-8 text-slate-600" />
            )}
            
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-[#070B14]/80 flex items-center justify-center">
                <Loader2 className="h-5 w-5 text-[#FF7A00] animate-spin" />
              </div>
            )}
          </div>

          <div className="text-center sm:text-left space-y-2">
            <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block">Profile Photo</span>
            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="inline-flex items-center gap-1.5 bg-[#070B14]/60 hover:bg-[#070B14] border border-white/[0.08] hover:border-white/[0.15] px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all text-slate-300 select-none cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5 text-[#FF7A00]" />
                Upload Photo
              </button>
              {isKycApproved && (
                <button
                  type="button"
                  onClick={() => setShowIdCardModal(true)}
                  className="inline-flex items-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-[#FF7A00]/30 px-3.5 py-2 rounded-xl text-xs font-bold uppercase transition-all text-[#FF7A00] select-none cursor-pointer"
                >
                  <IdCard className="h-3.5 w-3.5" />
                  View ID Card
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            {compressing && (
              <p className="text-[10px] text-[#FF7A00] animate-pulse font-semibold">Compressing and converting image to WebP...</p>
            )}
            <p className="text-[9px] text-slate-500 font-semibold select-none leading-relaxed">
              Accepts PNG, JPG or WebP. Automatically scaled and converted.
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          
          {/* Row: Name and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                <User className="h-3 w-3 text-[#FF7A00]" />
                Full Name
              </label>
              <input
                type="text"
                {...register('full_name', { required: true })}
                className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none transition-all font-semibold"
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5 select-none">
                <Phone className="h-3 w-3 text-slate-600" />
                Contact Phone
              </label>
              <input
                type="text"
                disabled
                value={profileData.phone || ''}
                className="w-full bg-[#070B14]/40 border border-white/[0.04] rounded-2xl px-4 py-2.5 text-xs text-slate-500 font-semibold select-none outline-none cursor-not-allowed"
                placeholder="Phone number"
              />
            </div>
          </div>

          {/* Email & Date of Birth */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-[#FF7A00]" />
                Email Address
              </label>
              <input
                type="email"
                {...register('email')}
                className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none transition-all font-semibold"
                placeholder="Enter your email address"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                <User className="h-3 w-3 text-[#FF7A00]" />
                Date of Birth
              </label>
              <input
                type="date"
                {...register('dob')}
                className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl px-4 py-2.5 text-xs text-slate-100 outline-none transition-all font-semibold"
              />
            </div>
          </div>

          {/* Service Details Group */}
          <div className="border-t border-white/[0.06] pt-4 space-y-4">
            <h4 className="text-[9px] font-black uppercase text-slate-500 tracking-widest px-1">Service & Bio Details</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                  <Briefcase className="h-3 w-3 text-[#FF7A00]" />
                  Skills / Specialization
                </label>
                <input
                  type="text"
                  {...register('skills')}
                  className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none transition-all font-semibold"
                  placeholder="e.g. Electrician, Fan Repairing"
                />
                <span className="text-[8px] text-slate-600 block font-semibold">Separate with commas</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                  <Award className="h-3 w-3 text-[#FF7A00]" />
                  Experience (Years)
                </label>
                <input
                  type="number"
                  {...register('experience', { min: 0, valueAsNumber: true })}
                  className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none transition-all font-semibold"
                  placeholder="e.g. 5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                  <Languages className="h-3 w-3 text-[#FF7A00]" />
                  Languages Spoken
                </label>
                <input
                  type="text"
                  {...register('languages')}
                  className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none transition-all font-semibold"
                  placeholder="e.g. English, Hindi, Kannada"
                />
                <span className="text-[8px] text-slate-600 block font-semibold">Separate with commas</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 text-[#FF7A00]" />
                  Service City / Location
                </label>
                <input
                  type="text"
                  {...register('city', { required: true })}
                  className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none transition-all font-semibold"
                  placeholder="e.g. Bangalore"
                />
              </div>
            </div>

            <div className="space-y-1.5 select-none">
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={detecting}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 border border-[#FF7A00]/20 hover:border-[#FF7A00]/40 rounded-2xl text-xs font-black text-[#FF7A00] bg-orange-500/5 hover:bg-orange-500/10 transition-colors select-none cursor-pointer disabled:opacity-50"
              >
                {detecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#FF7A00]" />
                    Detecting Location...
                  </>
                ) : (
                  <>
                    <MapPin className="h-4 w-4 text-[#FF7A00]" />
                    Use Current Location
                  </>
                )}
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-[#FF7A00]" />
                Service Address & State
              </label>
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  {...register('address')}
                  className="col-span-2 w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none transition-all font-semibold"
                  placeholder="Street details"
                />
                <input
                  type="text"
                  {...register('state', { required: true })}
                  className="col-span-1 w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none transition-all font-semibold"
                  placeholder="State"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                <FileText className="h-3 w-3 text-[#FF7A00]" />
                Partner Bio / Description
              </label>
              <textarea
                rows={3}
                {...register('bio')}
                className="w-full bg-[#070B14] border border-white/[0.08] focus:border-[#FF7A00]/50 rounded-2xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-600 outline-none transition-all font-semibold resize-none leading-relaxed"
                placeholder="Brief summary of your professional journey..."
              />
            </div>
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-2xl flex items-center gap-2.5 text-red-400 text-xs font-bold">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-550" />
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl flex items-center gap-2.5 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              {successMsg}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-[#FF7A00] hover:bg-[#FF9E43] text-white py-3.5 px-6 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-orange-500/20 select-none cursor-pointer disabled:opacity-40 active:scale-95"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>

        </form>

      </div>

      {isKycApproved && (
        <DigitalIdCardModal
          isOpen={showIdCardModal}
          onClose={() => setShowIdCardModal(false)}
          worker={
            profileData && kycData
              ? {
                  id: userData?.user?.id || '',
                  full_name: profileData.full_name,
                  phone: profileData.phone,
                  dob: profileData.dob,
                  worker_id_code: profileData.worker_id_code,
                  skills: profileData.skills
                }
              : null
          }
          photoUrl={
            kycData?.documents?.find((d: any) => d.document_type === 'PROFILE_PHOTO')?.signedUrl 
              || kycData?.documents?.find((d: any) => d.document_type === 'SELFIE_VERIFICATION')?.signedUrl
          }
        />
      )}

    </div>
  );
}
