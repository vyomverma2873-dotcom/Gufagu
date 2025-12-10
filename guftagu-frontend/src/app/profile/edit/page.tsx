'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, X, Plus, AtSign, Check, AlertCircle } from 'lucide-react';
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

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Username validation state
  const [usernameError, setUsernameError] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user) {
      setUsername(user.username || '');
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setInterests(user.interests || []);
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Check username availability with debounce
  const checkUsernameAvailability = debounce(async (newUsername: string) => {
    if (!newUsername || newUsername === user?.username) {
      setUsernameAvailable(null);
      setUsernameError('');
      setIsCheckingUsername(false);
      return;
    }

    // Validate format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(newUsername)) {
      setUsernameError('3-20 characters, letters, numbers, and underscores only');
      setUsernameAvailable(false);
      setIsCheckingUsername(false);
      return;
    }

    try {
      const response = await userApi.checkUsername(newUsername);
      setUsernameAvailable(response.data.available);
      setUsernameError(response.data.available ? '' : 'Username already taken');
    } catch {
      setUsernameError('Could not check availability');
      setUsernameAvailable(null);
    } finally {
      setIsCheckingUsername(false);
    }
  }, 500);

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(sanitized);
    setUsernameError('');
    setUsernameAvailable(null);
    
    if (sanitized && sanitized !== user?.username) {
      setIsCheckingUsername(true);
      checkUsernameAvailability(sanitized);
    }
  };

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
    
    // Validate username if changed
    if (username !== user?.username) {
      if (usernameAvailable === false) {
        setError('Please choose an available username');
        return;
      }
      if (usernameError) {
        setError(usernameError);
        return;
      }
    }
    
    setIsSaving(true);

    try {
      const updateData: any = {
        displayName,
        bio,
        interests,
      };
      
      // Include username only if changed
      if (username && username !== user?.username) {
        updateData.username = username;
      }
      
      const response = await userApi.updateProfile(updateData);

      updateUser({
        username: response.data.user.username,
        displayName: response.data.user.displayName,
        bio: response.data.user.bio,
        interests: response.data.user.interests,
        canChangeUsername: response.data.user.canChangeUsername,
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

          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5">Username</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                <AtSign className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="username"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                maxLength={20}
                className={`w-full bg-neutral-800/50 border rounded-lg pl-9 pr-10 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors ${
                  usernameError 
                    ? 'border-red-500/50 focus:border-red-500' 
                    : usernameAvailable === true 
                      ? 'border-emerald-500/50 focus:border-emerald-500'
                      : 'border-neutral-700/50 focus:border-neutral-600'
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isCheckingUsername && (
                  <div className="w-4 h-4 border-2 border-neutral-600 border-t-white rounded-full animate-spin" />
                )}
                {!isCheckingUsername && usernameAvailable === true && (
                  <Check className="w-4 h-4 text-emerald-400" />
                )}
                {!isCheckingUsername && usernameAvailable === false && (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            </div>
            {usernameError && (
              <p className="text-[11px] text-red-400 mt-1">{usernameError}</p>
            )}
            {usernameAvailable === true && (
              <p className="text-[11px] text-emerald-400 mt-1">Username is available!</p>
            )}
            <p className="text-[11px] text-neutral-500 mt-1">3-20 characters, letters, numbers, and underscores only</p>
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
