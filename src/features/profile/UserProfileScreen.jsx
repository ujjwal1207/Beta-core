import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Settings, User, Edit3, Plus, Loader, Users, Camera } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import ProfileCompletionNudge from './components/ProfileCompletionNudge';
import FeedJourneyCard from '../feed/components/FeedJourneyCard';
import Button from '../../components/ui/Button';
import { MOOD_LABELS, MOOD_COLORS, getMoodGradient } from '../../config/theme';
import PostCard from '../feed/components/PostCard';
import feedService from '../../services/feedService';
import userService from '../../services/userService';
import { getAvatarUrlWithSize } from '../../lib/avatarUtils';

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
  const [isAddingSchool, setIsAddingSchool] = useState(false);
  const [editingSchoolIndex, setEditingSchoolIndex] = useState(null);
  const [newSchool, setNewSchool] = useState({ name: '', entry_year: '', passing_year: '' });
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
      
      const updateData = {
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
              How are you feeling today? <span className="font-bold" style={{color: MOOD_COLORS[currentMood]}}>{MOOD_LABELS[currentMood]}</span>
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
            onClose={() => {}} // No close action for profile screen - always available for editing
            dismissible={false}
          />

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
                    <input type="text" placeholder="e.g., Product Manager" value={localRole} onChange={(e) => { setLocalRole(e.target.value); setIsDirty(true); }} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Company</label>
                    <input type="text" placeholder="e.g., Acme Inc." value={localCompany} onChange={(e) => { setLocalCompany(e.target.value); setIsDirty(true); }} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Bio</label>
                  <input type="text" placeholder="e.g., 'Exploring new career paths'" value={localTagline} onChange={(e) => { setLocalTagline(e.target.value); setIsDirty(true); }} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Location</label>
                    <input type="text" placeholder="e.g., Mumbai, India" value={localLocation} onChange={(e) => { setLocalLocation(e.target.value); setIsDirty(true); }} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Industry</label>
                    <input type="text" placeholder="e.g., Technology" value={localIndustry} onChange={(e) => { setLocalIndustry(e.target.value); setIsDirty(true); }} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base" />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">My Expertise</label>
                  <textarea
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base"
                    rows="3"
                    placeholder="e.g., 'Product Management, front-end development (React), building design systems...'"
                    value={localExpertise}
                    onChange={(e) => { setLocalExpertise(e.target.value); setIsDirty(true); }}
                  />
                </div>

                {/* Education Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-semibold text-slate-700">Education</label>
                    <button
                      onClick={() => setIsAddingSchool(true)}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 text-sm font-semibold transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add School
                    </button>
                  </div>

                  {/* School List */}
                  {education.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {education.map((school, index) => (
                        editingSchoolIndex === index ? (
                          <div key={index} className="bg-white border-2 border-indigo-300 rounded-lg p-4 space-y-3">
                            <div>
                              <label className="text-xs font-semibold text-slate-600 mb-1 block">School Name</label>
                              <input
                                type="text"
                                value={school.name}
                                onChange={(e) => {
                                  const updated = [...education];
                                  updated[index] = { ...updated[index], name: e.target.value };
                                  setEducation(updated);
                                  setIsDirty(true);
                                }}
                                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Entry Year</label>
                                <input
                                  type="number"
                                  value={school.entry_year}
                                  onChange={(e) => {
                                    const updated = [...education];
                                    updated[index] = { ...updated[index], entry_year: e.target.value };
                                    setEducation(updated);
                                    setIsDirty(true);
                                  }}
                                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-slate-600 mb-1 block">Passing Year</label>
                                <input
                                  type="number"
                                  value={school.passing_year}
                                  onChange={(e) => {
                                    const updated = [...education];
                                    updated[index] = { ...updated[index], passing_year: e.target.value };
                                    setEducation(updated);
                                    setIsDirty(true);
                                  }}
                                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingSchoolIndex(null);
                                  setIsDirty(true);
                                }}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                              >
                                Done
                              </button>
                              <button
                                onClick={() => setEditingSchoolIndex(null)}
                                className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div key={index} className="bg-white border border-slate-200 rounded-lg p-3 flex items-start justify-between hover:border-indigo-300 transition-colors">
                            <div className="flex-1">
                              <p className="font-semibold text-slate-800">{school.name}</p>
                              <p className="text-sm text-slate-500">
                                {school.entry_year} - {school.passing_year || 'Present'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingSchoolIndex(index)}
                                className="text-slate-400 hover:text-indigo-600 transition-all"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEducation(education.filter((_, i) => i !== index));
                                  setIsDirty(true);
                                }}
                                className="text-slate-400 hover:text-red-500 transition-all"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  )}

                  {/* Add School Form */}
                  {isAddingSchool && (
                    <div className="bg-white border-2 border-indigo-300 rounded-lg p-4 space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 mb-1 block">School Name</label>
                        <input
                          type="text"
                          placeholder="e.g., Harvard University"
                          value={newSchool.name}
                          onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                          className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">Entry Year</label>
                          <input
                            type="number"
                            placeholder="2020"
                            value={newSchool.entry_year}
                            onChange={(e) => setNewSchool({ ...newSchool, entry_year: e.target.value })}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-600 mb-1 block">Passing Year</label>
                          <input
                            type="number"
                            placeholder="2024"
                            value={newSchool.passing_year}
                            onChange={(e) => setNewSchool({ ...newSchool, passing_year: e.target.value })}
                            className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (newSchool.name && newSchool.entry_year) {
                              setEducation([...education, newSchool]);
                              setNewSchool({ name: '', entry_year: '', passing_year: '' });
                              setIsAddingSchool(false);
                              setIsDirty(true);
                            }
                          }}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingSchool(false);
                            setNewSchool({ name: '', entry_year: '', passing_year: '' });
                          }}
                          className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="sticky top-0 bg-white z-30 border-b border-slate-200 mb-4">
          <div className="flex gap-4 px-4 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('bio')}
              className={`py-3 px-1 font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === 'bio'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Bio
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`py-3 px-1 font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === 'posts'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`py-3 px-1 font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === 'saved'
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
        <div className="absolute bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-lg border-t border-slate-200 z-40">
          {saveError && (
            <p className="text-sm text-red-600 mb-2 text-center">{saveError}</p>
          )}
          <Button 
            primary 
            onClick={handleSave}
            disabled={isSaving}
            className="relative"
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
