import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Settings, User, Edit3, Plus, Loader, Users, Camera, GraduationCap, BookOpen } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import ProfileCompletionNudge from './components/ProfileCompletionNudge';
import FeedJourneyCard from '../feed/components/FeedJourneyCard';
import Button from '../../components/ui/Button';
import { MOOD_LABELS, MOOD_COLORS, getMoodGradient } from '../../config/theme';
import PostCard from '../feed/components/PostCard';
import feedService from '../../services/feedService';
import userService from '../../services/userService';
import { getAvatarUrlWithSize } from '../../lib/avatarUtils';

// ── Searchable university combobox ─────────────────────────────────────────
const UniversitySearchInput = ({ universities, selectedId, selectedName, onChange, disabled }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = query.trim()
    ? universities.filter(u => u.name.toLowerCase().includes(query.toLowerCase()))
    : universities;

  const handleSelect = (uni) => {
    onChange(uni);
    setQuery('');
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    setQuery('');
  };

  const displayValue = selectedId ? (universities.find(u => String(u.id) === String(selectedId))?.name || selectedName || '') : '';

  return (
    <div ref={wrapperRef} className="relative">
      {/* Trigger / search input */}
      <div
        className={`flex items-center w-full bg-white border rounded-lg shadow-sm transition-colors ${
          open ? 'border-indigo-500 ring-2 ring-indigo-500' : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => { if (!disabled) { setOpen(true); } }}
      >
        {open ? (
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search university…"
            className="flex-1 pl-3 pr-2 py-2.5 text-sm bg-transparent outline-none text-slate-800 placeholder-slate-400"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className={`flex-1 pl-3 py-2.5 text-sm font-medium ${displayValue ? 'text-slate-800' : 'text-slate-400'}`}>
            {displayValue || 'Search university…'}
          </span>
        )}
        <div className="flex items-center pr-2 gap-1">
          {displayValue && !open && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded text-slate-300 hover:text-slate-500 transition-colors"
              aria-label="Clear"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {open
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />}
          </svg>
        </div>
      </div>

      {/* Dropdown results */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-sm text-slate-400 text-center">No universities found</p>
          ) : (
            filtered.map(uni => (
              <button
                key={uni.id}
                type="button"
                onMouseDown={() => handleSelect(uni)}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                  String(uni.id) === String(selectedId)
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {uni.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
// ───────────────────────────────────────────────────────────────────────────

const UserProfileScreen = () => {
  const { setScreen, onboardingAnswers, setOnboardingAnswers, user, updateUserProfile, updateUserMood } = useAppContext();

  // Use backend user data instead of local profileData
  const [localName, setLocalName] = useState('');
  const [localRole, setLocalRole] = useState('');
  const [localCompany, setLocalCompany] = useState('');
  const [localTagline, setLocalTagline] = useState('');
  const [localLocation, setLocalLocation] = useState('');
  const [localIndustry, setLocalIndustry] = useState('');
  const [localExpertise, setLocalExpertise] = useState('');
  const [currentMood, setCurrentMood] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('bio');
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [savedPosts, setSavedPosts] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  // Calculate if user has incomplete profile (should show expanded About Me section)
  const hasIncompleteProfile = () => {
    if (!user) return true; // New users should see expanded section

    // Check basic profile fields
    const basicFieldsIncomplete = !user.full_name?.trim() || !user.bio?.trim() ||
      !user.location?.trim() || !user.industry?.trim() ||
      !user.role?.trim() || !user.expertise?.trim();

    // Check if onboarding journey is incomplete
    const onboardingIncomplete = !onboardingAnswers || Object.keys(onboardingAnswers).length === 0;

    return basicFieldsIncomplete || onboardingIncomplete;
  };

  const [isAboutMeExpanded, setIsAboutMeExpanded] = useState(hasIncompleteProfile());
  const [education, setEducation] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [universitiesLoading, setUniversitiesLoading] = useState(false);
  const [isAddingSchool, setIsAddingSchool] = useState(false);
  const [editingSchoolIndex, setEditingSchoolIndex] = useState(null);
  const [newSchool, setNewSchool] = useState({ university_id: '', name: '', entry_year: '', passing_year: '', enrollment_status: '' });
  const [isEditingSharerInsights, setIsEditingSharerInsights] = useState(false);
  const [editingSharerInsights, setEditingSharerInsights] = useState({
    youngerSelf: '',
    lifeLessons: [],
    societyChange: ''
  });

  // Load user data from backend
  useEffect(() => {
    if (user) {
      setLocalName(user.full_name || '');
      setLocalRole(user.role || '');
      setLocalCompany(user.company || '');
      setLocalTagline(user.bio || '');
      setLocalLocation(user.location || '');
      setLocalIndustry(user.industry || '');
      setLocalExpertise(user.expertise || '');
      // Set photo preview from existing profile photo only if no new photo is selected
      if (user.profile_photo) {
        setPhotoPreview(user.profile_photo);
      }
    }
  }, [user?.id]); // Only when user changes (not on every user object update)

  // Load education separately to avoid overwriting unsaved changes
  useEffect(() => {
    if (user && user.education && education.length === 0) {
      setEducation(user.education);
    }
  }, [user?.id]); // Only when user ID changes (first load for this user)

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        setUniversitiesLoading(true);
        const list = await userService.getUniversities();
        setUniversities(list);
      } catch (error) {
        console.error('Failed to fetch universities:', error);
        setUniversities([]);
      } finally {
        setUniversitiesLoading(false);
      }
    };

    fetchUniversities();
  }, []);

  // Load sharer insights separately
  useEffect(() => {
    if (user && user.sharer_insights) {
      setEditingSharerInsights({
        youngerSelf: user.sharer_insights.youngerSelf || '',
        lifeLessons: user.sharer_insights.lifeLessons || [],
        societyChange: user.sharer_insights.societyChange || ''
      });
    }
  }, [user?.id]); // Only when user changes

  // Sync mood separately to ensure it updates when changed from other screens
  useEffect(() => {
    if (user) {
      setCurrentMood(user.mood || 0);
    }
  }, [user?.mood]);

  // Fetch user's posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user?.id) return;
      const isVerified = (user?.education || []).some(
        (edu) => String(edu?.approval_status || '').toLowerCase() === 'approved'
      );
      if (!isVerified) {
        setUserPosts([]);
        return;
      }
      setPostsLoading(true);
      try {
        const posts = await feedService.getUserPosts(user.id);
        setUserPosts(posts);
      } catch (error) {
        console.error('Error fetching user posts:', error);
      } finally {
        setPostsLoading(false);
      }
    };
    fetchUserPosts();
  }, [user?.id]);

  // Fetch saved posts
  useEffect(() => {
    const fetchSavedPosts = async () => {
      if (!user?.id) return;
      const isVerified = (user?.education || []).some(
        (edu) => String(edu?.approval_status || '').toLowerCase() === 'approved'
      );
      if (!isVerified) {
        setSavedPosts([]);
        return;
      }
      setSavedLoading(true);
      try {
        const posts = await feedService.getSavedPosts();
        setSavedPosts(posts);
      } catch (error) {
        console.error('Error fetching saved posts:', error);
      } finally {
        setSavedLoading(false);
      }
    };
    if (activeTab === 'saved') {
      fetchSavedPosts();
    }
  }, [activeTab, user?.id]);

  // Only set About Me expansion state on mount
  // (Do not auto-collapse/expand on every user/onboardingAnswers change)

  const sharerInsights = user?.sharer_insights || {
    youngerSelf: onboardingAnswers['SHARER_TRACK_1'],
    lifeLessons: onboardingAnswers['SHARER_TRACK_2'],
    societyChange: onboardingAnswers['SHARER_TRACK_3'],
  };
  const isVerifiedUser = (user?.education || []).some(
    (edu) => String(edu?.approval_status || '').toLowerCase() === 'approved'
  );
  const hasSharerInsights = sharerInsights.youngerSelf || (sharerInsights.lifeLessons && sharerInsights.lifeLessons.length > 0) || sharerInsights.societyChange;

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // Sync sharer insights data to onboarding answers
      const sharerInsightsData = {
        youngerSelf: editingSharerInsights.youngerSelf.trim(),
        lifeLessons: editingSharerInsights.lifeLessons.filter(l => l.lesson.trim() || l.where.trim()),
        societyChange: editingSharerInsights.societyChange.trim()
      };

      // Update onboarding answers for compatibility
      const updatedOnboardingAnswers = { ...onboardingAnswers };
      if (sharerInsightsData.youngerSelf) updatedOnboardingAnswers['SHARER_TRACK_1'] = sharerInsightsData.youngerSelf;
      else delete updatedOnboardingAnswers['SHARER_TRACK_1'];

      if (sharerInsightsData.lifeLessons.length > 0) updatedOnboardingAnswers['SHARER_TRACK_2'] = sharerInsightsData.lifeLessons;
      else delete updatedOnboardingAnswers['SHARER_TRACK_2'];

      if (sharerInsightsData.societyChange) updatedOnboardingAnswers['SHARER_TRACK_3'] = sharerInsightsData.societyChange;
      else delete updatedOnboardingAnswers['SHARER_TRACK_3'];

      // Update the state
      setOnboardingAnswers(updatedOnboardingAnswers);

      const fullUpdateData = {
        full_name: localName,
        role: localRole,
        company: localCompany,
        bio: localTagline,
        location: localLocation,
        industry: localIndustry,
        expertise: localExpertise,
        education: education,
        onboarding_answers: updatedOnboardingAnswers,
      };

      // Unverified users can update education only.
      const updateData = isVerifiedUser ? fullUpdateData : { education };

      // If there's a new profile photo, upload to S3 first
      if (profilePhoto) {
        try {
          const updatedUser = await userService.uploadProfilePhoto(profilePhoto);
          // The uploadProfilePhoto method already updates the user's profile_photo field
          // So we don't need to include it in updateData
          setPhotoPreview(updatedUser.profile_photo); // Update preview with S3 URL
        } catch (error) {
          console.error('Error uploading profile photo:', error);
          setSaveError('Failed to upload profile photo. Please try again.');
          return;
        }
      }

      // Update profile via backend API (excluding profile_photo since it's already updated)
      await updateUserProfile(updateData);

      setIsDirty(false);
      setIsEditingSharerInsights(false);
      setProfilePhoto(null); // Clear the file object, keep preview from server
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoodChange = async (newMood) => {
    setCurrentMood(newMood);
    setIsDirty(true);

    try {
      await updateUserMood(newMood);
    } catch (error) {
      console.error('Error updating mood:', error);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setSaveError('Photo must be less than 10MB');
        return;
      }
      setProfilePhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setIsDirty(true);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const InfoBlock = ({ title, onEdit, children, editScreenKey }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-extrabold text-slate-800">{title}</h3>
        <button
          onClick={() => editScreenKey ? setScreen(editScreenKey) : onEdit()}
          className="p-2 rounded-full hover:bg-slate-100"
          aria-label={`Edit ${title}`}
        >
          <Edit3 className="w-5 h-5 text-indigo-600" />
        </button>
      </div>
      {children}
    </div>
  );

  const EmptyStateButton = ({ text, onClick }) => (
    <button
      onClick={onClick}
      className="flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-semibold text-sm hover:bg-slate-50 hover:border-slate-400 transition-all"
    >
      <Plus className="w-5 h-5 mr-2" /> {text}
    </button>
  );

  const getApprovalBadge = (status) => {
    const normalized = String(status || '').trim().toLowerCase();

    if (normalized === 'approved') {
      return {
        label: 'Approved',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }

    if (normalized === 'rejected') {
      return {
        label: 'Rejected',
        className: 'bg-red-50 text-red-700 border-red-200',
      };
    }

    if (normalized === 'not_verified') {
      return {
        label: 'Not Verified',
        className: 'bg-slate-100 text-slate-700 border-slate-300',
      };
    }

    if (normalized === 'pending') {
      return {
        label: 'Pending Approval',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }

    return {
      label: 'Needs Update',
      className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    };
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-50">
      {/* Top Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 px-4 py-3 flex justify-between items-center z-50">
        <div className="flex items-center">
          <button
            onClick={() => setScreen('FEED')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors mr-2"
            aria-label="Back to Feed"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-xl font-bold text-slate-800">Profile</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setScreen('MY_CONNECTIONS')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="My Connections"
          >
            <Users className="w-5 h-5 text-slate-600" />
          </button>
          <button
            onClick={() => setScreen('SETTINGS')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto pt-[57px] p-4 space-y-4 pb-24">

        <div className="relative bg-white p-6 rounded-xl shadow-sm border border-slate-100 w-full">
          <div className="flex items-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-bold mr-4 flex-shrink-0 overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <img
                    src={getAvatarUrlWithSize({ ...user, full_name: localName }, 80)}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                  />
                )}
              </div>
              <button
                onClick={handlePhotoClick}
                className="absolute bottom-0 right-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-1.5 shadow-lg transition-colors"
                aria-label="Upload photo"
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
            <div className="flex-grow min-w-0">
              <label className="text-xs font-semibold text-slate-500">Display Name</label>
              <input
                type="text"
                value={localName}
                onChange={(e) => { setLocalName(e.target.value); setIsDirty(true); }}
                placeholder="Name"
                className="w-full text-2xl font-extrabold text-slate-800 border-b-2 border-slate-200 focus:border-indigo-500 outline-none pb-1 bg-transparent"
              />
            </div>
          </div>

          {/* Mood Slider */}
          <div className="mb-6">
            <label className="text-sm font-semibold text-slate-700 mb-2 block">
              How are you feeling today? <span className="font-bold" style={{ color: MOOD_COLORS[currentMood] }}>{MOOD_LABELS[currentMood]}</span>
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={currentMood}
              onChange={(e) => handleMoodChange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer range-slider-fix"
              style={{ background: getMoodGradient() }}
            />
          </div>

          {/* Connections Stats */}
          <div className="flex items-center gap-6 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <button
              onClick={() => setScreen('MY_CONNECTIONS')}
              className="flex-1 text-center hover:bg-white rounded-lg p-2 transition-colors cursor-pointer"
            >
              <p className="text-2xl font-bold text-slate-800">{user?.connections_count || 0}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Connections</p>
            </button>
            <div className="w-px h-10 bg-slate-300"></div>
            <button
              onClick={() => setActiveTab('posts')}
              className="flex-1 text-center hover:bg-white rounded-lg p-2 transition-colors cursor-pointer"
            >
              <p className="text-2xl font-bold text-slate-800">{userPosts?.length || 0}</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Posts</p>
            </button>
          </div>

          {/* Show journey card for profile completion/editing - positioned above About Me section */}
          <FeedJourneyCard
            onboardingAnswers={onboardingAnswers}
            setScreen={setScreen}
            onClose={() => { }} // No close action for profile screen - always available for editing
            dismissible={false}
          />

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 w-full mb-6">
            {/* Education Section */}
            <div className="mb-4 pb-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-slate-700">Education</label>
                <button
                  onClick={() => setIsAddingSchool(true)}
                  disabled={universitiesLoading || universities.length === 0}
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-semibold transition-colors disabled:text-slate-400"
                >
                  <Plus className="w-4 h-4" />
                  Add School
                </button>
              </div>
              {!universitiesLoading && universities.length === 0 && (
                <p className="text-xs text-amber-700 mb-3">No universities available yet. Ask your university admin to create one in the admin panel.</p>
              )}

              {education.length > 0 && (
                <div className="space-y-2 mb-3">
                  {education.map((school, index) => (
                    editingSchoolIndex === index ? (
                      <div key={index} className="bg-white border-2 border-indigo-300 rounded-xl p-4 space-y-3 shadow-sm">
                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">University</label>
                          <UniversitySearchInput
                            universities={universities}
                            selectedId={school.university_id}
                            selectedName={school.name}
                            onChange={(selected) => {
                              const updated = [...education];
                              updated[index] = {
                                ...updated[index],
                                university_id: selected ? selected.id : null,
                                name: selected ? selected.name : '',
                              };
                              setEducation(updated);
                              setIsDirty(true);
                            }}
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Status</label>
                          <div className="relative">
                            <select
                              value={school.enrollment_status || ''}
                              onChange={(e) => {
                                const updated = [...education];
                                updated[index] = { ...updated[index], enrollment_status: e.target.value };
                                setEducation(updated);
                                setIsDirty(true);
                              }}
                              className="w-full appearance-none pl-3 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-800 font-medium shadow-sm cursor-pointer transition-colors hover:border-slate-300"
                            >
                              <option value="">Select status</option>
                              <option value="currently_enrolled">Currently Enrolled</option>
                              <option value="alumni">Alumni</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Entry Year</label>
                            <input
                              type="number"
                              value={school.entry_year}
                              onChange={(e) => {
                                const updated = [...education];
                                updated[index] = { ...updated[index], entry_year: e.target.value };
                                setEducation(updated);
                                setIsDirty(true);
                              }}
                              className="w-full pl-3 pr-2 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Passing Year</label>
                            <input
                              type="number"
                              value={school.passing_year}
                              onChange={(e) => {
                                const updated = [...education];
                                updated[index] = { ...updated[index], passing_year: e.target.value };
                                setEducation(updated);
                                setIsDirty(true);
                              }}
                              className="w-full pl-3 pr-2 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium shadow-sm"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => {
                              setEditingSchoolIndex(null);
                              setIsDirty(true);
                            }}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm shadow-sm"
                          >
                            Done
                          </button>
                          <button
                            onClick={() => setEditingSchoolIndex(null)}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div key={index} className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-start justify-between hover:border-indigo-300 hover:shadow-sm transition-all">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="mb-1.5 w-full">
                              <p className="font-bold text-slate-800 text-sm truncate w-full pr-1 mb-1">{school.name}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                {(() => {
                                  const badge = getApprovalBadge(school.approval_status);
                                  return (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border flex-shrink-0 whitespace-nowrap ${badge.className}`}>
                                      {badge.label}
                                    </span>
                                  );
                                })()}
                                {school.enrollment_status === 'alumni' ? (
                                  <span className="inline-flex items-center whitespace-nowrap gap-1 text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                                    <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
                                    Alumni
                                  </span>
                                ) : school.enrollment_status === 'currently_enrolled' ? (
                                  <span className="inline-flex items-center whitespace-nowrap gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                                    Currently Enrolled
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            
                            <p className="text-xs text-slate-500 font-medium">
                              {school.entry_year} – {school.passing_year || 'Present'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1.5 ml-2 flex-shrink-0">
                          <button
                            onClick={() => setEditingSchoolIndex(index)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEducation(education.filter((_, i) => i !== index));
                              setIsDirty(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}

              {isAddingSchool && (
                <div className="bg-white border-2 border-indigo-300 rounded-xl p-4 space-y-3 shadow-sm">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">University</label>
                    <UniversitySearchInput
                      universities={universities}
                      selectedId={newSchool.university_id}
                      selectedName={newSchool.name}
                      onChange={(selected) => {
                        setNewSchool({
                          ...newSchool,
                          university_id: selected ? String(selected.id) : '',
                          name: selected ? selected.name : '',
                        });
                      }}
                      disabled={universitiesLoading}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Status</label>
                    <div className="relative">
                      <select
                        value={newSchool.enrollment_status}
                        onChange={(e) => setNewSchool({ ...newSchool, enrollment_status: e.target.value })}
                        className="w-full appearance-none pl-3 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-800 font-medium shadow-sm cursor-pointer transition-colors hover:border-slate-300"
                      >
                        <option value="">Select status</option>
                        <option value="currently_enrolled">Currently Enrolled</option>
                        <option value="alumni">Alumni</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Entry Year</label>
                      <input
                        type="number"
                        placeholder="2020"
                        value={newSchool.entry_year}
                        onChange={(e) => setNewSchool({ ...newSchool, entry_year: e.target.value })}
                        className="w-full pl-3 pr-2 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5 block">Passing Year</label>
                      <input
                        type="number"
                        placeholder="2024"
                        value={newSchool.passing_year}
                        onChange={(e) => setNewSchool({ ...newSchool, passing_year: e.target.value })}
                        className="w-full pl-3 pr-2 py-2.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm font-medium shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => {
                        if (newSchool.university_id && newSchool.name && newSchool.entry_year && newSchool.enrollment_status) {
                          setEducation([
                            ...education,
                            {
                              university_id: Number(newSchool.university_id),
                              name: newSchool.name,
                              entry_year: newSchool.entry_year,
                              passing_year: newSchool.passing_year,
                              enrollment_status: newSchool.enrollment_status,
                            }
                          ]);
                          setNewSchool({ university_id: '', name: '', entry_year: '', passing_year: '', enrollment_status: '' });
                          setIsAddingSchool(false);
                          setIsDirty(true);
                        }
                      }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm shadow-sm"
                    >
                      Add School
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingSchool(false);
                        setNewSchool({ university_id: '', name: '', entry_year: '', passing_year: '', enrollment_status: '' });
                      }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 w-full mb-6">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsAboutMeExpanded(!isAboutMeExpanded)}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-slate-800">About me</h3>
                    {hasIncompleteProfile() && (
                      <ProfileCompletionNudge
                        onboardingAnswers={onboardingAnswers}
                        setScreen={setScreen}
                      />
                    )}
                  </div>
                  <p className="text-sm text-slate-500">Completing your journey helps us find you the best connections.</p>
                </div>
                <div className={`transform transition-transform ${isAboutMeExpanded ? 'rotate-180' : ''}`}>
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {isAboutMeExpanded && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Role</label>
                      <input
                        type="text"
                        placeholder="e.g., Product Manager"
                        value={localRole}
                        onChange={(e) => { setLocalRole(e.target.value); setIsDirty(true); }}
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Company</label>
                      <input
                        type="text"
                        placeholder="e.g., Acme Inc."
                        value={localCompany}
                        onChange={(e) => { setLocalCompany(e.target.value); setIsDirty(true); }}
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Bio</label>
                    <input
                      type="text"
                      placeholder="e.g., Exploring new career paths"
                      value={localTagline}
                      onChange={(e) => { setLocalTagline(e.target.value); setIsDirty(true); }}
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Location</label>
                      <input
                        type="text"
                        placeholder="e.g., Mumbai, India"
                        value={localLocation}
                        onChange={(e) => { setLocalLocation(e.target.value); setIsDirty(true); }}
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Industry</label>
                      <input
                        type="text"
                        placeholder="e.g., Technology"
                        value={localIndustry}
                        onChange={(e) => { setLocalIndustry(e.target.value); setIsDirty(true); }}
                        className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">My Expertise</label>
                    <textarea
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base"
                      rows="3"
                      placeholder="e.g., Product management, frontend development, mentoring"
                      value={localExpertise}
                      onChange={(e) => { setLocalExpertise(e.target.value); setIsDirty(true); }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="sticky top-0 bg-white z-30 border-b border-slate-200 mb-4">
          <div className="flex gap-4 px-4 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('bio')}
              className={`py-3 px-1 font-semibold text-sm transition-all whitespace-nowrap ${activeTab === 'bio'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Bio
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-3 px-1 font-semibold text-sm transition-all whitespace-nowrap ${activeTab === 'posts'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`py-3 px-1 font-semibold text-sm transition-all whitespace-nowrap ${activeTab === 'saved'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Saved
            </button>
          </div>
        </div>

        {/* Bio Tab Content */}
        {activeTab === 'bio' && (
          <div>
            {/* My Shared Wisdom Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 w-full mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-extrabold text-slate-800">My Shared Wisdom</h3>
                {!isEditingSharerInsights && (
                  <button
                    onClick={() => setIsEditingSharerInsights(true)}
                    className="p-2 rounded-full hover:bg-slate-100"
                    aria-label="Edit Shared Wisdom"
                  >
                    <Edit3 className="w-5 h-5 text-indigo-600" />
                  </button>
                )}
              </div>

              {isEditingSharerInsights ? (
                <div className="space-y-6">
                  {/* Advice to Younger Self */}
                  <div>
                    <label className="text-sm font-bold text-slate-600 mb-2 block">Advice to Younger Self</label>
                    <textarea
                      value={editingSharerInsights.youngerSelf}
                      onChange={(e) => {
                        setEditingSharerInsights(prev => ({ ...prev, youngerSelf: e.target.value }));
                        setIsDirty(true);
                      }}
                      placeholder="What advice would you give your younger self?"
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                      rows="3"
                    />
                  </div>

                  {/* Key Life Lessons */}
                  <div>
                    <label className="text-sm font-bold text-slate-600 mb-2 block">Key Life Lessons</label>
                    <div className="space-y-3">
                      {editingSharerInsights.lifeLessons.map((lesson, index) => (
                        <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <textarea
                            value={lesson.lesson}
                            onChange={(e) => {
                              const updated = [...editingSharerInsights.lifeLessons];
                              updated[index] = { ...updated[index], lesson: e.target.value };
                              setEditingSharerInsights(prev => ({ ...prev, lifeLessons: updated }));
                              setIsDirty(true);
                            }}
                            placeholder="What lesson did you learn?"
                            className="w-full p-2 bg-white border border-slate-300 rounded mb-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                            rows="2"
                          />
                          <input
                            type="text"
                            value={lesson.where}
                            onChange={(e) => {
                              const updated = [...editingSharerInsights.lifeLessons];
                              updated[index] = { ...updated[index], where: e.target.value };
                              setEditingSharerInsights(prev => ({ ...prev, lifeLessons: updated }));
                              setIsDirty(true);
                            }}
                            placeholder="Where did you learn this?"
                            className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          />
                          <button
                            onClick={() => {
                              const updated = editingSharerInsights.lifeLessons.filter((_, i) => i !== index);
                              setEditingSharerInsights(prev => ({ ...prev, lifeLessons: updated }));
                              setIsDirty(true);
                            }}
                            className="mt-2 text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setEditingSharerInsights(prev => ({
                            ...prev,
                            lifeLessons: [...prev.lifeLessons, { lesson: '', where: '' }]
                          }));
                          setIsDirty(true);
                        }}
                        className="w-full p-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 font-semibold text-sm hover:bg-slate-50 hover:border-slate-400 transition-all"
                      >
                        <Plus className="w-4 h-4 inline mr-2" /> Add Life Lesson
                      </button>
                    </div>
                  </div>

                  {/* Change I Want to See */}
                  <div>
                    <label className="text-sm font-bold text-slate-600 mb-2 block">Change I Want to See in Society</label>
                    <textarea
                      value={editingSharerInsights.societyChange}
                      onChange={(e) => {
                        setEditingSharerInsights(prev => ({ ...prev, societyChange: e.target.value }));
                        setIsDirty(true);
                      }}
                      placeholder="What change would you like to see in the world?"
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
                      rows="3"
                    />
                  </div>
                </div>
              ) : (
                !hasSharerInsights ? (
                  <button
                    onClick={() => setIsEditingSharerInsights(true)}
                    className="flex items-center justify-center w-full p-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-semibold text-sm hover:bg-slate-50 hover:border-slate-400 transition-all"
                  >
                    <Plus className="w-5 h-5 mr-2" /> Add Your Wisdom & Insights
                  </button>
                ) : (
                  <div className="space-y-4">
                    {sharerInsights.youngerSelf && (
                      <div>
                        <h4 className="text-sm font-bold text-slate-600 mb-1">Advice to Younger Self</h4>
                        <p className="text-sm text-slate-700 italic">"{sharerInsights.youngerSelf}"</p>
                      </div>
                    )}
                    {sharerInsights.lifeLessons && sharerInsights.lifeLessons.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-slate-600 mb-2">Key Life Lessons</h4>
                        <div className="space-y-2">
                          {sharerInsights.lifeLessons.map((lesson, i) => (
                            <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <p className="text-sm font-semibold text-slate-800 italic">"{lesson.lesson}"</p>
                              <p className="text-xs text-slate-500 mt-1">Learned at: <span className="font-medium">{lesson.where}</span></p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {sharerInsights.societyChange && (
                      <div>
                        <h4 className="text-sm font-bold text-slate-600 mb-1">Change I Want to See</h4>
                        <p className="text-sm text-slate-700 italic">"{sharerInsights.societyChange}"</p>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {/* Posts Tab Content */}
        {activeTab === 'posts' && (
          <div className="space-y-4 pb-24">
            {postsLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : userPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 text-sm">No posts yet</p>
              </div>
            ) : (
              (userPosts || []).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onUpdate={(updatedPost, deletedPostId) => {
                    if (deletedPostId) {
                      // Handle deletion
                      setUserPosts(prev => prev.filter(p => p.id !== deletedPostId));
                    } else if (updatedPost) {
                      // Handle update
                      setUserPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
                    }
                  }}
                />
              ))
            )}
          </div>
        )}

        {/* Saved Tab Content */}
        {activeTab === 'saved' && (
          <div className="space-y-4 pb-24">
            {savedLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
              </div>
            ) : savedPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 text-sm">No saved posts yet</p>
              </div>
            ) : (
              (savedPosts || []).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onUpdate={(updatedPost, deletedPostId) => {
                    if (deletedPostId) {
                      // Handle deletion from saved
                      setSavedPosts(prev => prev.filter(p => p.id !== deletedPostId));
                    } else if (updatedPost) {
                      // Handle update
                      setSavedPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
                    }
                  }}
                />
              ))
            )}
          </div>
        )}


      </div>

      {isDirty && (
        <div className="fixed bottom-0 left-0 w-full p-4 pb-8 sm:pb-4 bg-white/90 backdrop-blur-lg border-t border-slate-200 z-[100] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          {saveError && (
            <p className="text-sm text-red-600 mb-2 text-center">{saveError}</p>
          )}
          <Button
            primary
            onClick={handleSave}
            disabled={isSaving}
            className="w-full relative shadow-lg"
          >
            {isSaving ? (
              <>
                <Loader className="w-5 h-5 animate-spin inline mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserProfileScreen;
