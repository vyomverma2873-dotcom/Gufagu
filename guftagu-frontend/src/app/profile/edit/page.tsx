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
        <div className="w-8 h-8 border-4 border-zinc-700 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile" className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
        </div>

        {/* Form */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar
                src={user.profilePicture}
                alt={user.displayName || user.username || ''}
                size="xl"
              />
              <button className="absolute bottom-0 right-0 p-2 bg-violet-600 rounded-full text-white hover:bg-violet-700 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="font-medium text-white">Profile Picture</h3>
              <p className="text-sm text-zinc-400">JPG, PNG or WebP. Max 5MB.</p>
            </div>
          </div>

          {/* Display Name */}
          <Input
            label="Display Name"
            placeholder="Your display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
          />

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              maxLength={500}
              className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-zinc-500 mt-1">{bio.length}/500 characters</p>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Interests</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {interests.map((interest, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-800 rounded-full text-sm text-white"
                >
                  {interest}
                  <button
                    onClick={() => handleRemoveInterest(index)}
                    className="p-0.5 hover:bg-zinc-700 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            {interests.length < 10 && (
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add an interest"
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddInterest()}
                  maxLength={20}
                />
                <Button variant="outline" onClick={handleAddInterest}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            )}
            <p className="text-xs text-zinc-500 mt-1">{interests.length}/10 interests</p>
          </div>

          {/* Error/Success messages */}
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          {success && (
            <p className="text-emerald-400 text-sm">{success}</p>
          )}

          {/* Save button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
