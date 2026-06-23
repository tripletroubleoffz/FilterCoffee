'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabaseClient';
import { User as UserIcon, Upload, Trash2, CheckCircle, AlertCircle, Plus, X } from 'lucide-react';
import Image from 'next/image';

const availableTopics = [
  'Artificial Intelligence',
  'Startups',
  'Funding',
  'Machine Learning',
  'Robotics',
  'Business',
  'Technology',
];

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, refreshProfile, logout } = useApp();

  // Form Fields
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [preferredTopics, setPreferredTopics] = useState<string[]>([]);

  // Input helpers
  const [newTopic, setNewTopic] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (profile) {
      setNickname(profile.nickname || '');
      setEmail(profile.email || user?.email || '');
      setDob(profile.dob || '');
      setGender(profile.gender || '');
      setPhone(profile.phone || '');
      setCountry(profile.country || '');
      setAvatarUrl(profile.avatar_url || '');
      setPreferredTopics(profile.preferred_topics || []);
    }
  }, [profile, user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setError('');

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;

      // Upload to Supabase avatars bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
    } catch (err: any) {
      console.error('Avatar upload failed:', err);
      // Fallback base64 preview for testing
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSuccess(false);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          nickname,
          dob: dob || null,
          gender: gender || null,
          phone: phone || null,
          country: country || null,
          avatar_url: avatarUrl || null,
          preferred_topics: preferredTopics,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.message || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTopicToggle = (topic: string) => {
    const limit = profile?.subscription_status === 'PRO' ? 10 : 3;
    setPreferredTopics((prev) => {
      const isSelected = prev.includes(topic);
      if (isSelected) {
        setError('');
        return prev.filter((t) => t !== topic);
      } else {
        if (prev.length >= limit) {
          setError(`You have reached the limit of ${limit} topics for the ${profile?.subscription_status || 'FREE'} plan. Upgrade to PRO to choose up to 10.`);
          return prev;
        }
        setError('');
        return [...prev, topic];
      }
    });
  };

  const handleAddTopic = () => {
    if (newTopic.trim()) {
      const topic = newTopic.trim();
      const limit = profile?.subscription_status === 'PRO' ? 10 : 3;
      if (!preferredTopics.includes(topic)) {
        if (preferredTopics.length >= limit) {
          setError(`You have reached the limit of ${limit} topics for the ${profile?.subscription_status || 'FREE'} plan. Upgrade to PRO to choose up to 10.`);
          return;
        }
        setPreferredTopics((prev) => [...prev, topic]);
        setError('');
      }
      setNewTopic('');
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setDeleting(true);

    try {
      // 1. Delete user profile row in database (which fires the secure delete_user trigger in the DB)
      const { error: deleteError } = await supabase.from('profiles').delete().eq('id', user.id);
      if (deleteError) throw deleteError;
      
      // 2. Sign out
      await logout();

      setDeleteModalOpen(false);
      router.push('/login');
    } catch (err: any) {
      console.error('Error deleting account:', err);
      setError(err.message || 'Could not delete account. Please log out instead.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        
        {/* Heading */}
        <div className="flex flex-col gap-1 border-b border-border pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight">Profile Settings</h1>
          <p className="text-xs text-muted">
            Manage your personal details, preferred topics, and account status.
          </p>
        </div>

        {success && (
          <div className="p-3 rounded-md border border-green-500/20 bg-green-500/5 text-green-500 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>Profile changes saved successfully!</span>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-md border border-red-500/20 bg-red-500/5 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-8">
          
          {/* Section 1: Personal Details */}
          <div className="p-6 rounded-lg border border-border bg-card flex flex-col gap-6">
            <h2 className="font-bold text-sm uppercase tracking-wider border-b border-border pb-2">
              Personal Information
            </h2>

            {/* Avatar Row */}
            <div className="flex flex-col sm:flex-row items-center gap-4 border border-border p-4 rounded-lg bg-background w-fit">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border border-border bg-card flex items-center justify-center">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Avatar" fill sizes="64px" className="object-cover" />
                ) : (
                  <UserIcon className="w-6 h-6 text-muted" />
                )}
              </div>
              <div className="flex flex-col items-center sm:items-start gap-1">
                <label
                  htmlFor="profile-avatar-input"
                  className="flex items-center gap-1.5 text-xs font-semibold border border-border hover:bg-card-hover px-3 py-1.5 rounded-md cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? 'Uploading...' : 'Change Avatar'}
                </label>
                <input
                  id="profile-avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <span className="text-[9px] text-muted">Supports JPG or PNG. Max 2MB.</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="prof-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Nickname
                </label>
                <input
                  id="prof-name"
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="prof-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email (read-only)
                </label>
                <input
                  id="prof-email"
                  type="email"
                  disabled
                  value={email}
                  className="h-10 px-3 rounded-md border border-border bg-background text-sm opacity-50 cursor-not-allowed focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="prof-dob" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Date of Birth
                </label>
                <input
                  id="prof-dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="prof-gender" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Gender
                </label>
                <select
                  id="prof-gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="prof-phone" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Phone
                </label>
                <input
                  id="prof-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="prof-country" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Country
                </label>
                <input
                  id="prof-country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Preferences & Subscriptions */}
          <div className="p-6 rounded-lg border border-border bg-card flex flex-col gap-6">
            <h2 className="font-bold text-sm uppercase tracking-wider border-b border-border pb-2">
              Subscription & Preferences
            </h2>

            {/* Plan Badge */}
            <div className="flex items-center justify-between p-4 border border-border bg-background rounded-lg">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-widest text-muted">Current Plan</span>
                <span className="text-sm font-semibold mt-0.5">FilterCoffee {profile?.subscription_status === 'PRO' ? 'PRO' : 'FREE'}</span>
              </div>
              <span className="text-xs font-bold border border-foreground bg-foreground text-background px-3 py-1 rounded-md">
                {profile?.subscription_status || 'FREE'}
              </span>
            </div>

            {/* Topics chips */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Preferred Topics</span>
              <div className="flex flex-wrap gap-2">
                {[
                  ...availableTopics,
                  ...preferredTopics.filter((topic) => !availableTopics.includes(topic))
                ].map((topic) => {
                  const active = preferredTopics.includes(topic);
                  const isCustom = !availableTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleTopicToggle(topic)}
                      className={`text-xs font-medium px-3.5 py-1.5 rounded-full border transition-colors inline-flex items-center gap-1.5 ${
                        active
                          ? 'border-foreground bg-foreground text-background font-semibold'
                          : 'border-border bg-background hover:bg-card-hover text-muted-foreground'
                      }`}
                    >
                      <span>{topic}</span>
                      {isCustom && active && (
                        <X className="w-3.5 h-3.5 flex-shrink-0 opacity-70 hover:opacity-100" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Chips */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label htmlFor="custom-pref" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add Custom Preference Tag</label>
                <div className="flex gap-2 max-w-md">
                  <input
                    id="custom-pref"
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTopic())}
                    placeholder="e.g. LLM Finetuning"
                    className="flex-1 h-9 px-3 rounded-md border border-border bg-background text-sm focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTopic}
                    className="h-9 px-3 rounded-md border border-border hover:bg-card-hover text-xs font-semibold transition-colors flex items-center gap-1 focus:outline-none"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action triggers */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-md border border-foreground bg-foreground text-background font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity focus:outline-none"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>

        {/* Section 3: Danger Zone */}
        <div className="p-6 rounded-lg border border-red-500/20 bg-red-500/5 flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-1">
            <h2 className="font-bold text-sm uppercase tracking-wider text-red-500">Danger Zone</h2>
            <p className="text-xs text-muted leading-relaxed">
              Deleting your account is permanent. This removes your email profile and bookmarks from the database.
            </p>
          </div>

          <button
            onClick={() => setDeleteModalOpen(true)}
            className="w-fit px-4 py-2 rounded-md border border-red-500/30 bg-background text-red-500 text-xs font-bold hover:bg-red-500 hover:text-white transition-colors focus:outline-none flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" /> Delete Account
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="fixed inset-0" onClick={() => setDeleteModalOpen(false)} />
            
            <div className="relative w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl z-10 flex flex-col gap-5 animate-in zoom-in-95 duration-200">
              
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="font-bold text-sm uppercase tracking-wider text-red-500">Confirm Account Deletion</span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you absolutely sure you want to delete your FilterCoffee account? This operation is irreversible and will delete your preferences and bookmarks from the database immediately.
              </p>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 py-2 rounded-md border border-border hover:bg-card-hover text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="flex-1 py-2 rounded-md bg-red-500 text-white text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-1 focus:outline-none"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {deleting ? 'Deleting...' : 'Delete permanently'}
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
