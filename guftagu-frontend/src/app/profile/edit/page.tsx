'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, X, Plus } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { userApi } from '@/lib/api';
import { debounce } from '@/lib/utils';

export default function EditProfilePage() {
  const { user, isAuthenticated, isLoading, updateUser } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setInterests(user.interests || []);
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleAddInterest = () => {
    if (!newInterest.trim()) return;
    if (interests.length >= 10) return;
    if (interests.includes(newInterest.trim().toLowerCase())) return;
    
    setInterests([...interests, newInterest.trim().toLowerCase()]);
    setNewInterest('');
  };

  const handleRemoveInterest = (index: number) => {
    setInterests(interests.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const response = await userApi.updateProfile({
        displayName,
        bio,
        interests,
      });

      updateUser({
        displayName: response.data.user.displayName,
        bio: response.data.user.bio,
        interests: response.data.user.interests,
      });

      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile" className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-all">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-semibold text-white">Edit Profile</h1>
        </div>

        {/* Form Card */}
        <div className="bg-neutral-900/70 backdrop-blur-xl border border-neutral-800/80 rounded-2xl p-6 space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar
                src={user.profilePicture}
                alt={user.displayName || user.username || ''}
                size="xl"
                className="w-16 h-16 rounded-xl"
              />
              <button className="absolute -bottom-1 -right-1 p-1.5 bg-white rounded-lg text-neutral-900 hover:bg-neutral-100 transition-colors">
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white">Profile Picture</h3>
              <p className="text-xs text-neutral-500">JPG, PNG or WebP. Max 5MB.</p>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Display Name</label>
            <input
              type="text"
              placeholder="Your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={3}
              maxLength={500}
              className="w-full bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 resize-none transition-colors"
            />
            <p className="text-[11px] text-neutral-500 mt-1">{bio.length}/500</p>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-2">Interests</label>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {interests.map((interest, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-800/60 border border-neutral-700/50 rounded-lg text-xs text-neutral-300"
                >
                  {interest}
                  <button
                    onClick={() => handleRemoveInterest(index)}
                    className="p-0.5 hover:bg-neutral-700 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            {interests.length < 10 && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add interest"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddInterest()}
                  maxLength={20}
                  className="flex-1 bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 transition-colors"
                />
                <button 
                  onClick={handleAddInterest}
                  className="p-2 bg-neutral-800/60 border border-neutral-700/50 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-[11px] text-neutral-500 mt-1">{interests.length}/10 interests</p>
          </div>

          {/* Error/Success messages */}
          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}
          {success && (
            <p className="text-emerald-400 text-xs">{success}</p>
          )}

          {/* Save button */}
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
