// src/pages/ProfilePage.tsx
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import NeonCard from '@/components/ui/NeonCard';
import HoloButton from '@/components/ui/HoloButton';
import NeuralAvatar from '@/components/ui/NeuralAvatar';
import CyberInput from '@/components/ui/CyberInput';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { getUserProfileApi, getUserStatsApi, updateUserProfileApi, uploadProfilePictureApi } from '@/api/userApi';
import { useAuthStore } from '@/store/authStore';
import { Shield, Edit3, Save, X, Camera, AlertTriangle, Check, BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';


interface ProfileData {
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  profilePicture?: string;
  createdAt: string;
}

interface StatsData {
  totalTests: number;
  bestScore: number;
  averageScore: number;
  totalTime: number;
  rank: number;
  recentAttempts: any[];
}

const ProfilePage = () => {
  
  // Profile State
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('Loading your profile…');

  // Edit Mode
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editError, setEditError] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Profile Picture Upload
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const updateAuthUser = useAuthStore((state) => state.updateUser);

  // Fetch profile and stats on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        // Fetch profile
        setLoadingMessage('Loading your profile…');
        const profileRes = await getUserProfileApi();
        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
          updateAuthUser({
            name: profileRes.data.name,
            email: profileRes.data.email,
            role: profileRes.data.role,
            profilePicture: profileRes.data.profilePicture,
          });
          setEditName(profileRes.data.name);
          setEditEmail(profileRes.data.email);
        }

        // Fetch stats
        setLoadingMessage('Loading your stats…');
        const statsRes = await getUserStatsApi();
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to load profile. Please try again.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [updateAuthUser]);

  // Handle profile picture selection
  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Only JPG, PNG, WebP, and GIF images are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must not exceed 5MB.');
      return;
    }

    setUploadError('');
    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Upload profile picture
  const handleUploadPicture = async () => {
    if (!selectedFile) return;

    setUploadingPicture(true);
    setUploadError('');

    try {
      console.log('[ProfilePage] Starting profile picture upload...', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
      });

      const res = await uploadProfilePictureApi(selectedFile);

      console.log('[ProfilePage] Upload response:', res);

      if (res.success && res.data?.profilePicture && profile) {
        console.log('[ProfilePage] Upload successful. New image URL:', res.data.profilePicture);

        // Update profile with new image URL
        const updatedProfile = { ...profile, profilePicture: res.data.profilePicture };
        setProfile(updatedProfile);
        updateAuthUser({ profilePicture: res.data.profilePicture });

        // Clear preview and temp file
        setPreviewImage(null);
        setSelectedFile(null);

        console.log('[ProfilePage] Profile state updated successfully');
      } else {
        throw new Error(res.data?.message || 'Upload successful but no image URL returned');
      }
    } catch (err: unknown) {
      console.error('[ProfilePage] Upload failed:', err);

      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to upload image. Please try again.';

      setUploadError(msg);
    } finally {
      setUploadingPicture(false);
    }
  };

  // Handle profile update
  const handleSaveProfile = async () => {
    setEditError('');
    setEditLoading(true);

    try {
      // Validate
      if (!editName.trim()) {
        setEditError('Name cannot be empty.');
        setEditLoading(false);
        return;
      }

      if (!editEmail.trim()) {
        setEditError('Email cannot be empty.');
        setEditLoading(false);
        return;
      }

      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(editEmail)) {
        setEditError('Please enter a valid email address.');
        setEditLoading(false);
        return;
      }

      const res = await updateUserProfileApi({
        name: editName,
        email: editEmail,
      });

      if (res.success && res.data) {
        setProfile({
          ...profile!,
          name: res.data.name,
          email: res.data.email,
        });
        updateAuthUser({
          name: res.data.name,
          email: res.data.email,
          profilePicture: res.data.profilePicture,
        });
        setEditing(false);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update profile. Please try again.';
      setEditError(msg);
    } finally {
      setEditLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner size="lg" label={loadingMessage} />
        </div>
      </AppLayout>
    );
  }

  // Error state
  if (error && !profile) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <NeonCard padding="p-6" className="max-w-md" hover={false}>
            <div className="flex gap-3 items-start">
              <AlertTriangle className="text-bad flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="text-ink font-semibold mb-1">Couldn't load your profile</h3>
                <p className="text-ink/60 text-sm">{error}</p>
              </div>
            </div>
          </NeonCard>
        </div>
      </AppLayout>
    );
  }

  if (!profile) return null;

  const statItems = [
    { label: 'Tests taken', value: stats?.totalTests ?? '—' },
    { label: 'Best score',  value: `${stats?.bestScore ?? '—'}%` },
    { label: 'Time spent',  value: `${stats?.totalTime ?? '—'}m` },
    { label: 'Rank',        value: `#${stats?.rank ?? '—'}` },
  ];

  return (
    <AppLayout>
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 animate-fade-up">
        <div>
          <h1 className="font-display text-[28px] md:text-[32px] font-semibold tracking-tight text-ink">Profile</h1>
          <p className="text-[15px] text-ink/60 mt-1">Your account details and test record.</p>
        </div>
        {!editing && (
          <HoloButton variant="ghost" size="md" icon={<Edit3 size={15} />} onClick={() => setEditing(true)}>
            Edit profile
          </HoloButton>
        )}
      </header>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Profile card ─────────────────────────────── */}
        <NeonCard padding="p-6" className="lg:col-span-1 animate-fade-up self-start" hover={false}>
          <div className="flex flex-col items-center text-center gap-4">

            {/* Profile Picture Section */}
            <div className="relative">
              <NeuralAvatar
                name={profile.name}
                role={profile.role}
                size="xl"
                imageUrl={previewImage || profile.profilePicture}
              />
              {!editing && (
                <label
                  title="Change photo"
                  className="absolute -bottom-0.5 -right-0.5 w-9 h-9 rounded-full bg-ink text-paper border-[3px] border-surface flex items-center justify-center cursor-pointer hover:bg-ink/85 transition-colors"
                >
                  <Camera size={15} />
                  <span className="sr-only">Change photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePictureChange}
                    disabled={uploadingPicture}
                  />
                </label>
              )}
            </div>

            {/* Profile Picture Preview & Upload */}
            {previewImage && (
              <div className="w-full p-3 rounded-[10px] bg-raised border border-line space-y-3 text-left">
                <p className="text-[13px] font-medium text-ink">New photo</p>
                <img src={previewImage} alt="Preview" className="w-full h-auto rounded-lg" />
                <div className="flex gap-2">
                  <HoloButton
                    variant="cyan"
                    size="sm"
                    fullWidth
                    loading={uploadingPicture}
                    onClick={handleUploadPicture}
                    icon={<Check size={14} />}
                  >
                    Use this photo
                  </HoloButton>
                  <HoloButton
                    variant="ghost"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      setPreviewImage(null);
                      setSelectedFile(null);
                    }}
                    icon={<X size={14} />}
                  >
                    Cancel
                  </HoloButton>
                </div>
              </div>
            )}

            {uploadError && (
              <div className="w-full flex items-start gap-2 p-3 rounded-[10px] bg-bad/10 border border-bad/25 text-left">
                <AlertTriangle size={14} className="text-bad flex-shrink-0 mt-0.5" />
                <p className="text-bad text-[13px]">{uploadError}</p>
              </div>
            )}

            {/* User Info */}
            <div className="w-full">
              {editing ? (
                <div className="space-y-3 text-left">
                  <CyberInput
                    label="Full name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your name"
                  />
                  <CyberInput
                    label="Email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                  />
                </div>
              ) : (
                <>
                  <h2 className="font-display font-semibold text-2xl tracking-tight text-ink">{profile.name}</h2>
                  <p className="text-ink/55 text-sm mt-1 break-all">{profile.email}</p>
                </>
              )}
            </div>

            {/* Badges */}
            <div className="flex gap-2 flex-wrap justify-center">
              <span className="text-xs px-2.5 py-1 rounded-full bg-brand/10 text-brand font-medium">
                Student
              </span>
              {profile.role === 'admin' && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-plum/10 text-plum font-medium">
                  <Shield size={12} />Admin
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-ok/10 text-ok font-medium">
                <BadgeCheck size={12} /> Verified
              </span>
            </div>

            {/* Member since */}
            <p className="text-ink/50 text-[13px]">Member since {formatDate(profile.createdAt)}</p>

            {/* Edit Error */}
            {editError && (
              <div className="w-full flex items-start gap-2 p-3 rounded-[10px] bg-bad/10 border border-bad/25 text-left">
                <AlertTriangle size={14} className="text-bad flex-shrink-0 mt-0.5" />
                <p className="text-bad text-[13px]">{editError}</p>
              </div>
            )}

            {/* Edit actions */}
            {editing && (
              <div className="flex gap-2 w-full">
                <HoloButton
                  variant="cyan"
                  size="md"
                  fullWidth
                  icon={<Save size={14} />}
                  onClick={handleSaveProfile}
                  loading={editLoading}
                >
                  Save
                </HoloButton>
                <HoloButton
                  variant="ghost"
                  size="md"
                  fullWidth
                  icon={<X size={14} />}
                  onClick={() => {
                    setEditing(false);
                    setEditName(profile.name);
                    setEditEmail(profile.email);
                    setEditError('');
                  }}
                >
                  Cancel
                </HoloButton>
              </div>
            )}
          </div>
        </NeonCard>

        {/* ── Right side ───────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up-delay">
            {statItems.map((s) => (
              <NeonCard key={s.label} padding="p-4">
                <p className="text-[13px] text-ink/60">{s.label}</p>
                <p className="font-display text-[28px] leading-none font-medium tracking-tight text-ink tabular mt-2.5">{s.value}</p>
              </NeonCard>
            ))}
          </div>

          {/* Account info */}
          <NeonCard padding="p-0" className="animate-fade-up overflow-hidden" hover={false}>
            <h3 className="text-base font-semibold text-ink px-5 py-4 border-b border-line">Account details</h3>
            <dl className="divide-y divide-line">
              {[
                { label: 'Full name', value: profile.name },
                { label: 'Email', value: profile.email },
                { label: 'Role', value: profile.role },
                { label: 'Member since', value: formatDate(profile.createdAt) },
              ].map((field) => (
                <div key={field.label} className="grid grid-cols-[110px_1fr] sm:grid-cols-[160px_1fr] gap-4 px-5 py-3">
                  <dt className="text-ink/55 text-sm">{field.label}</dt>
                  <dd className={cn('text-ink text-sm break-all', field.label === 'Role' && 'capitalize')}>{field.value}</dd>
                </div>
              ))}
            </dl>
          </NeonCard>

          {/* Recent Tests */}
          {stats && stats.recentAttempts && stats.recentAttempts.length > 0 && (
            <NeonCard padding="p-0" className="animate-fade-up overflow-hidden" hover={false}>
              <h3 className="text-base font-semibold text-ink px-5 py-4 border-b border-line">Recent tests</h3>
              <ul className="divide-y divide-line max-h-72 overflow-y-auto">
                {stats.recentAttempts.slice(0, 5).map((attempt, idx) => (
                  <li key={idx} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-ink text-sm font-medium truncate">{attempt.title || 'Practice test'}</p>
                      <p className="text-ink/50 text-xs mt-0.5">
                        {new Date(attempt.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-display text-lg font-medium text-ink tabular leading-tight">{attempt.score}%</p>
                      <p className="text-ink/50 text-xs font-mono">
                        {attempt.correctCount}/{attempt.totalQuestions} right
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </NeonCard>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
