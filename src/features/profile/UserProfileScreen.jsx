import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Settings, User, Edit3, Plus, Loader, Users, Camera, GraduationCap, BookOpen, Briefcase, Zap, CheckCircle, Smile, ChevronRight, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import BasicProfileModal from './components/BasicProfileModal';
import Button from '../../components/ui/Button';

import PostCard from '../feed/components/PostCard';
import feedService from '../../services/feedService';
import userService from '../../services/userService';
import callsService from '../../services/callsService';
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
          <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  const { setScreen, onboardingAnswers, setOnboardingAnswers, user, updateUserProfile } = useAppContext();

  const SMART_TAG_SUGGESTIONS = [
    'Career Growth',
    'Networking',
    'Software Engineering',
    'Product Management',
    'UX Design',
    'Data Science',
    'Marketing',
    'Finance',
    'Startups',
    'Study Abroad',
    'Higher Education',
    'Interview Prep',
  ];

  const MONETIZATION_TOPIC_OPTIONS = [
    'Campus life and real lessons',
    'Career pivots and finding the right path',
    'Startup journey wins and failures',
    'Moving abroad and navigating life',
    'Tech careers and interview strategy',
    'Key decisions that shaped my journey',
  ];

  const MONETIZATION_STYLE_OPTIONS = [
    'Breaking down complex paths into simple steps',
    'Listening first, then sharing practical guidance',
    'Helping people find clarity on goals and direction',
    'Offering actionable next steps from experience',
  ];

  const isProtectedTag = (tag) => {
    if (!tag) return false;
    const normalized = String(tag).trim().toLowerCase();
    return normalized.startsWith('verified_') || normalized.startsWith('institution_');
  };

  const sanitizeTag = (tag) =>
    String(tag || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 30);

  const mergeUniqueTags = (tags = []) => {
    const seen = new Set();
    const result = [];

    for (const tag of tags) {
      const cleanTag = sanitizeTag(tag);
      if (!cleanTag) continue;
      const key = cleanTag.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(cleanTag);
    }

    return result;
  };

  // Use backend user data instead of local profileData
  const [localName, setLocalName] = useState('');
  const [localRole, setLocalRole] = useState('');
  const [localCompany, setLocalCompany] = useState('');
  const [localTagline, setLocalTagline] = useState('');
  const [localLocation, setLocalLocation] = useState('');
  const [localIndustry, setLocalIndustry] = useState('');
  const [localLookingFor, setLocalLookingFor] = useState('');
  const [localExpertise, setLocalExpertise] = useState('');
  const [localTags, setLocalTags] = useState([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);

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
  const [isBasicSetupOpen, setIsBasicSetupOpen] = useState(false);
  const [isBasicEditMode, setIsBasicEditMode] = useState(false);
  const [isAdditionalEditMode, setIsAdditionalEditMode] = useState(false);
  const [education, setEducation] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [universitiesLoading, setUniversitiesLoading] = useState(false);
  const [isAddingSchool, setIsAddingSchool] = useState(false);
  const [editingSchoolIndex, setEditingSchoolIndex] = useState(null);
  const [newSchool, setNewSchool] = useState({ university_id: '', name: '', entry_year: '', passing_year: '', enrollment_status: '' });
  const [isEditingSharerInsights, setIsEditingSharerInsights] = useState(false);
  const [isEditingCommunityGratitude, setIsEditingCommunityGratitude] = useState(false);
  const [editingSharerInsights, setEditingSharerInsights] = useState({
    youngerSelf: '',
    lifeLessons: [],
    societyChange: '',
    communityGratitude: [],
  });
  const [editingMonetization, setEditingMonetization] = useState({
    sessionTopic: '',
    sessionStyle: '',
    sessionHook: '',
  });
  const [isMonetizationSetupOpen, setIsMonetizationSetupOpen] = useState(false);
  const [monetizationStep, setMonetizationStep] = useState(1);
  const [monetizationTopicSelections, setMonetizationTopicSelections] = useState([]);
  const [monetizationCustomTopic, setMonetizationCustomTopic] = useState('');
  const [monetizationStyleSelections, setMonetizationStyleSelections] = useState([]);
  const [monetizationCustomStyle, setMonetizationCustomStyle] = useState('');
  const [monetizationHook, setMonetizationHook] = useState('');
  const [userReviews, setUserReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [gratitudeSelectionError, setGratitudeSelectionError] = useState('');

  useEffect(() => {
    const shouldOpenBasicSetup = sessionStorage.getItem('openBasicProfileSetup') === 'true';
    if (!shouldOpenBasicSetup) return;

    setIsBasicSetupOpen(true);
    sessionStorage.removeItem('openBasicProfileSetup');
  }, []);

  // Load user data from backend
  useEffect(() => {
    if (user) {
      setLocalName(user.full_name || '');
      setLocalRole(user.role || '');
      setLocalCompany(user.company || '');
      setLocalTagline(user.bio || '');
      setLocalLocation(user.location || '');
      setLocalIndustry(user.industry || '');
      setLocalLookingFor(user.exploring || onboardingAnswers?.LOOKING_FOR || '');
      setLocalExpertise(user.expertise || '');
      const persistedTags = Array.isArray(user.tags) ? user.tags : [];
      const fallbackTags = (user.expertise || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);

      const editableTags = mergeUniqueTags(
        (persistedTags.length ? persistedTags : fallbackTags).filter((tag) => !isProtectedTag(tag))
      );

      setLocalTags(editableTags);
      setCustomTagInput('');
      // Set photo preview from existing profile photo only if no new photo is selected
      if (user.profile_photo) {
        setPhotoPreview(user.profile_photo);
      }
    }
  }, [user?.id]); // Initialize from user only when user identity changes

  const calculateProfileCompletion = () => {
    const completionChecks = [
      String(localName || '').trim().length > 0,
      String(localRole || '').trim().length > 0,
      String(localIndustry || '').trim().length > 0,
      String(localLookingFor || '').trim().length > 0,
      String(localTagline || '').trim().length > 0,
      Array.isArray(education) && education.length > 0,
    ];

    const completed = completionChecks.filter(Boolean).length;
    return Math.max(15, Math.round((completed / completionChecks.length) * 100));
  };

  const completionPercentage = calculateProfileCompletion();

  const primaryEducation = education && education.length > 0 ? education[0] : null;
  const educationDisplay = primaryEducation
    ? `${primaryEducation.name}${primaryEducation.passing_year ? ` '${String(primaryEducation.passing_year).slice(-2)}` : ''}`
    : 'Not set';

  const lookingForDisplay =
    localLookingFor ||
    user?.exploring ||
    onboardingAnswers?.LOOKING_FOR ||
    'Not set';

  const handleAutoTagBio = () => {
    setIsGeneratingTags(true);
    setTimeout(() => {
      const text = `${localTagline} ${localRole} ${localIndustry}`.toLowerCase();
      const tags = [];
      if (text.includes('design') || text.includes('ux')) tags.push('UX Design');
      if (text.includes('react') || text.includes('frontend') || text.includes('engineer')) tags.push('Software Engineering');
      if (text.includes('startup') || text.includes('founder')) tags.push('Startups');
      if (text.includes('product')) tags.push('Product Management');
      if (text.includes('market')) tags.push('Marketing');
      if (text.includes('finance')) tags.push('Finance');
      setLocalTags((prev) => mergeUniqueTags([...(tags.length ? tags : ['Networking', 'Career Growth']), ...prev]));
      setIsDirty(true);
      setIsGeneratingTags(false);
    }, 700);
  };

  const handleAddCustomTag = () => {
    const cleanTag = sanitizeTag(customTagInput);
    if (!cleanTag) return;

    setLocalTags((prev) => mergeUniqueTags([cleanTag, ...prev]));
    setCustomTagInput('');
    setIsDirty(true);
  };

  const handleRemoveTag = (tagToRemove) => {
    setLocalTags((prev) => prev.filter((tag) => tag.toLowerCase() !== String(tagToRemove).toLowerCase()));
    setIsDirty(true);
  };

  const handleAddSuggestedTag = (tag) => {
    setLocalTags((prev) => mergeUniqueTags([tag, ...prev]));
    setIsDirty(true);
  };

  const handleAutoWriteBio = () => {
    setIsGeneratingTags(true);
    setTimeout(() => {
      const role = localRole || 'professional';
      const location = localLocation ? ` based in ${localLocation}` : '';
      setLocalTagline(`I am a ${role}${location} focused on growth, meaningful conversations, and sharing practical lessons from my journey.`);
      setIsGeneratingTags(false);
      setIsDirty(true);
    }, 700);
  };

  const handleBasicSetupSave = async (data) => {
    const nextName = data?.name || '';
    const nextLocation = data?.location || '';
    const nextIndustry = data?.industry || data?.focus || '';
    const nextExpertise = data?.expertise || '';
    const nextLookingFor = data?.exploring || data?.connectionGoal || '';

    setLocalName(nextName);
    setLocalLocation(nextLocation);
    setLocalIndustry(nextIndustry);
    setLocalExpertise(nextExpertise);
    setLocalLookingFor(nextLookingFor);

    if (data?.role) {
      setLocalRole(data.role);
    }

    let mergedEducation = null;
    if (Array.isArray(data?.education) && data.education.length > 0) {
      const incomingPrimary = data.education[0] || {};
      const existingPrimary = Array.isArray(education) && education.length > 0 ? education[0] : null;
      const isSameSchool =
        existingPrimary &&
        (
          (incomingPrimary.university_id && existingPrimary.university_id && String(incomingPrimary.university_id) === String(existingPrimary.university_id)) ||
          (String(incomingPrimary.name || '').trim().toLowerCase() === String(existingPrimary.name || '').trim().toLowerCase())
        );

      mergedEducation = data.education.map((item, idx) => {
        if (idx !== 0) return item;

        const fallbackStatus = isSameSchool
          ? existingPrimary?.approval_status
          : null;

        return {
          ...item,
          approval_status: item?.approval_status || fallbackStatus || 'not_verified',
        };
      });

      setEducation(mergedEducation);
    }

    if (Array.isArray(data?.topics)) {
      setLocalTags(data.topics);
    }

    const updatedOnboardingAnswers = { ...onboardingAnswers };
    if (nextLookingFor.trim()) updatedOnboardingAnswers.LOOKING_FOR = nextLookingFor.trim();
    else delete updatedOnboardingAnswers.LOOKING_FOR;
    setOnboardingAnswers(updatedOnboardingAnswers);

    try {
      setIsSaving(true);
      setSaveError('');

      await updateUserProfile({
        full_name: nextName,
        location: nextLocation,
        industry: nextIndustry,
        expertise: nextExpertise,
        exploring: nextLookingFor,
        role: data?.role || localRole,
        education: mergedEducation || education,
        onboarding_answers: updatedOnboardingAnswers,
      });

      setIsDirty(false);
    } catch (error) {
      console.error('Error saving basic profile setup:', error);
      setSaveError('Failed to save basic profile setup. Please try again.');
      setIsDirty(true);
    } finally {
      setIsSaving(false);
    }
  };

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
        societyChange: user.sharer_insights.societyChange || '',
        communityGratitude: Array.isArray(user.sharer_insights.communityGratitude)
          ? user.sharer_insights.communityGratitude.slice(0, 3)
          : [],
      });
    }
  }, [user?.id]); // Only when user changes

  useEffect(() => {
    setEditingMonetization({
      sessionTopic: String(onboardingAnswers?.MONETIZATION_TRACK_1 || '').trim(),
      sessionStyle: String(onboardingAnswers?.MONETIZATION_TRACK_2 || '').trim(),
      sessionHook: String(onboardingAnswers?.MONETIZATION_TRACK_3 || '').trim(),
    });
  }, [user?.id, onboardingAnswers?.MONETIZATION_TRACK_1, onboardingAnswers?.MONETIZATION_TRACK_2, onboardingAnswers?.MONETIZATION_TRACK_3]);

  useEffect(() => {
    const fetchUserReviews = async () => {
      if (!user?.id || !user?.is_super_linker) {
        setUserReviews([]);
        return;
      }

      try {
        setReviewsLoading(true);
        const reviews = await callsService.getUserReviews(user.id, 50);
        setUserReviews(Array.isArray(reviews) ? reviews : []);
      } catch (error) {
        console.error('Error fetching user reviews for gratitude selection:', error);
        setUserReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchUserReviews();
  }, [user?.id, user?.is_super_linker]);



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

  const selectedCommunityGratitude = Array.isArray(user?.sharer_insights?.communityGratitude)
    ? user.sharer_insights.communityGratitude.filter((item) => String(item?.text || '').trim()).slice(0, 3)
    : [];
  const monetizationTopicText = String(onboardingAnswers?.MONETIZATION_TRACK_1 || '').trim();
  const monetizationStyleText = String(onboardingAnswers?.MONETIZATION_TRACK_2 || '').trim();
  const monetizationHookText = String(onboardingAnswers?.MONETIZATION_TRACK_3 || '').trim();
  const monetizationApprovalStatus = String(onboardingAnswers?.MONETIZATION_APPROVAL_STATUS || '').trim().toLowerCase();

  const toggleCommunityGratitude = (review) => {
    const normalizedContent = String(review?.content || '').trim();
    if (!normalizedContent) return;

    const reviewId = review.id;

    setEditingSharerInsights((prev) => {
      const current = Array.isArray(prev.communityGratitude) ? prev.communityGratitude : [];
      const alreadySelected = current.some((item) => item?.reviewId === reviewId);

      if (alreadySelected) {
        setGratitudeSelectionError('');
        return {
          ...prev,
          communityGratitude: current.filter((item) => item?.reviewId !== reviewId),
        };
      }

      if (current.length >= 3) {
        setGratitudeSelectionError('You can select up to 3 community gratitude highlights.');
        return prev;
      }

      setGratitudeSelectionError('');
      return {
        ...prev,
        communityGratitude: [
          ...current,
          {
            reviewId,
            text: normalizedContent,
            from: review?.reviewer_name || 'Anonymous',
            rating: review?.rating || 0,
            createdAt: review?.created_at || null,
          },
        ],
      };
    });

    setIsDirty(true);
  };

  const openMonetizationSetup = () => {
    const currentTopic = String(onboardingAnswers?.MONETIZATION_TRACK_1 || '').trim();
    const currentStyle = String(onboardingAnswers?.MONETIZATION_TRACK_2 || '').trim();
    const currentHook = String(onboardingAnswers?.MONETIZATION_TRACK_3 || '').trim();

    const parsedTopics = currentTopic
      ? currentTopic.split(',').map((item) => item.trim()).filter(Boolean)
      : [];
    const parsedStyles = currentStyle
      ? currentStyle.split(',').map((item) => item.trim()).filter(Boolean)
      : [];

    const selectedTopics = parsedTopics.filter((item) => MONETIZATION_TOPIC_OPTIONS.includes(item));
    const customTopics = parsedTopics.filter((item) => !MONETIZATION_TOPIC_OPTIONS.includes(item));
    const selectedStyles = parsedStyles.filter((item) => MONETIZATION_STYLE_OPTIONS.includes(item));
    const customStyles = parsedStyles.filter((item) => !MONETIZATION_STYLE_OPTIONS.includes(item));

    setMonetizationTopicSelections(selectedTopics);
    setMonetizationCustomTopic(customTopics.join(', '));
    setMonetizationStyleSelections(selectedStyles);
    setMonetizationCustomStyle(customStyles.join(', '));
    setMonetizationHook(currentHook);
    setMonetizationStep(1);
    setIsMonetizationSetupOpen(true);
  };

  const toggleMonetizationTopic = (option) => {
    setMonetizationTopicSelections((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
    );
  };

  const toggleMonetizationStyle = (option) => {
    setMonetizationStyleSelections((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option]
    );
  };

  const completeMonetizationSetup = async () => {
    const topicParts = [
      ...monetizationTopicSelections,
      ...String(monetizationCustomTopic || '').split(',').map((item) => item.trim()).filter(Boolean),
    ];
    const styleParts = [
      ...monetizationStyleSelections,
      ...String(monetizationCustomStyle || '').split(',').map((item) => item.trim()).filter(Boolean),
    ];

    const uniqueTopics = Array.from(new Set(topicParts));
    const uniqueStyles = Array.from(new Set(styleParts));

    const nextMonetization = {
      sessionTopic: uniqueTopics.join(', '),
      sessionStyle: uniqueStyles.join(', '),
      sessionHook: monetizationHook.trim(),
    };

    const updatedOnboardingAnswers = { ...onboardingAnswers };
    if (nextMonetization.sessionTopic) updatedOnboardingAnswers['MONETIZATION_TRACK_1'] = nextMonetization.sessionTopic;
    else delete updatedOnboardingAnswers['MONETIZATION_TRACK_1'];

    if (nextMonetization.sessionStyle) updatedOnboardingAnswers['MONETIZATION_TRACK_2'] = nextMonetization.sessionStyle;
    else delete updatedOnboardingAnswers['MONETIZATION_TRACK_2'];

    if (nextMonetization.sessionHook) updatedOnboardingAnswers['MONETIZATION_TRACK_3'] = nextMonetization.sessionHook;
    else delete updatedOnboardingAnswers['MONETIZATION_TRACK_3'];

    const hasMonetizationSubmission = Boolean(
      nextMonetization.sessionTopic ||
      nextMonetization.sessionStyle ||
      nextMonetization.sessionHook
    );

    if (hasMonetizationSubmission) {
      updatedOnboardingAnswers['MONETIZATION_APPROVAL_STATUS'] = 'pending';
    } else {
      delete updatedOnboardingAnswers['MONETIZATION_APPROVAL_STATUS'];
    }

    const existingSharerInsights = user?.sharer_insights || {};
    const monetizationSharerInsights = {
      ...existingSharerInsights,
      youngerSelf: nextMonetization.sessionHook,
      lifeLessons: nextMonetization.sessionTopic
        ? [{ lesson: nextMonetization.sessionTopic, where: '' }]
        : [],
      societyChange: nextMonetization.sessionStyle,
    };

    try {
      setIsSaving(true);
      setSaveError(null);

      await updateUserProfile({
        onboarding_answers: updatedOnboardingAnswers,
        sharer_insights: monetizationSharerInsights,
      });

      setOnboardingAnswers(updatedOnboardingAnswers);
      setEditingMonetization(nextMonetization);
      setIsMonetizationSetupOpen(false);
    } catch (error) {
      console.error('Error saving paid session setup:', error);
      setSaveError('Failed to save paid session details. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    let didSave = false;
    setIsSaving(true);
    setSaveError(null);

    try {
      // Sync sharer insights data to onboarding answers
      const sharerInsightsData = {
        // Keep legacy shared wisdom fields in sync with monetization setup
        youngerSelf: editingMonetization.sessionHook.trim(),
        lifeLessons: editingMonetization.sessionTopic.trim()
          ? [{ lesson: editingMonetization.sessionTopic.trim(), where: '' }]
          : [],
        societyChange: editingMonetization.sessionStyle.trim(),
        communityGratitude: (Array.isArray(editingSharerInsights.communityGratitude)
          ? editingSharerInsights.communityGratitude
          : [])
          .filter((item) => String(item?.text || '').trim())
          .slice(0, 3),
      };

      // Update onboarding answers for compatibility
      const updatedOnboardingAnswers = { ...onboardingAnswers };
      if (sharerInsightsData.youngerSelf) updatedOnboardingAnswers['SHARER_TRACK_1'] = sharerInsightsData.youngerSelf;
      else delete updatedOnboardingAnswers['SHARER_TRACK_1'];

      if (sharerInsightsData.lifeLessons.length > 0) updatedOnboardingAnswers['SHARER_TRACK_2'] = sharerInsightsData.lifeLessons;
      else delete updatedOnboardingAnswers['SHARER_TRACK_2'];

      if (sharerInsightsData.societyChange) updatedOnboardingAnswers['SHARER_TRACK_3'] = sharerInsightsData.societyChange;
      else delete updatedOnboardingAnswers['SHARER_TRACK_3'];

      if (localLookingFor.trim()) updatedOnboardingAnswers['LOOKING_FOR'] = localLookingFor.trim();
      else delete updatedOnboardingAnswers['LOOKING_FOR'];

      if (editingMonetization.sessionTopic.trim()) updatedOnboardingAnswers['MONETIZATION_TRACK_1'] = editingMonetization.sessionTopic.trim();
      else delete updatedOnboardingAnswers['MONETIZATION_TRACK_1'];

      if (editingMonetization.sessionStyle.trim()) updatedOnboardingAnswers['MONETIZATION_TRACK_2'] = editingMonetization.sessionStyle.trim();
      else delete updatedOnboardingAnswers['MONETIZATION_TRACK_2'];

      if (editingMonetization.sessionHook.trim()) updatedOnboardingAnswers['MONETIZATION_TRACK_3'] = editingMonetization.sessionHook.trim();
      else delete updatedOnboardingAnswers['MONETIZATION_TRACK_3'];

      const hasMonetizationSubmission = Boolean(
        editingMonetization.sessionTopic.trim() ||
        editingMonetization.sessionStyle.trim() ||
        editingMonetization.sessionHook.trim()
      );

      if (hasMonetizationSubmission) {
        updatedOnboardingAnswers['MONETIZATION_APPROVAL_STATUS'] = 'pending';
      } else {
        delete updatedOnboardingAnswers['MONETIZATION_APPROVAL_STATUS'];
      }

      // Update the state
      setOnboardingAnswers(updatedOnboardingAnswers);

      const protectedTags = Array.isArray(user?.tags)
        ? user.tags.filter((tag) => isProtectedTag(tag))
        : [];

      const finalTags = mergeUniqueTags([...localTags, ...protectedTags]);

      const fullUpdateData = {
        full_name: localName,
        role: localRole,
        company: localCompany,
        bio: localTagline,
        location: localLocation,
        industry: localIndustry,
        exploring: localLookingFor.trim(),
        expertise: localExpertise,
        tags: finalTags,
        sharer_insights: sharerInsightsData,
        education: education,
        onboarding_answers: updatedOnboardingAnswers,
      };

      const updateData = fullUpdateData;

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
      setIsEditingCommunityGratitude(false);
      setProfilePhoto(null); // Clear the file object, keep preview from server
      didSave = true;
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }

    return didSave;
  };

  const handleAdditionalDetailsToggle = async () => {
    if (!isAdditionalEditMode) {
      setIsAdditionalEditMode(true);
      return;
    }

    if (!isDirty) {
      setIsAdditionalEditMode(false);
      return;
    }

    const saved = await handleSave();
    if (saved) {
      setIsAdditionalEditMode(false);
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
          <h1 className="text-xl font-bold text-slate-800">My Profile</h1>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setScreen('MY_CONNECTIONS')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="My Connections"
            title="My Connections"
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

      <div className="grow overflow-y-auto pt-14.25 p-4 space-y-4 pb-24">

        <BasicProfileModal
          isOpen={isBasicSetupOpen}
          onClose={() => setIsBasicSetupOpen(false)}
          onSave={handleBasicSetupSave}
          universities={universities}
          universitiesLoading={universitiesLoading}
          profileData={{
            name: localName,
            organization: localCompany,
            customTagline: localTagline,
            location: localLocation,
            role: localRole,
            education,
            focus: localIndustry,
            connectionGoal: localLookingFor,
            industry: localIndustry,
            expertise: localExpertise,
            exploring: localLookingFor,
            topics: localTags,
          }}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoChange}
          className="hidden"
        />

        <div className="relative bg-white p-6 rounded-xl shadow-sm border border-slate-100 w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Basic Info</h2>
            <button
              onClick={() => setIsBasicSetupOpen(true)}
              className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-sm font-bold"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          </div>

          {!isBasicEditMode && (
            <>
              <div className="flex flex-col gap-3 mb-5">
                <div className="flex items-center min-w-0 gap-3">
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={handlePhotoClick}
                      className="w-20 h-20 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden shadow-lg cursor-pointer"
                      aria-label="Change profile photo"
                      title="Change profile photo"
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="Profile" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <img
                          src={getAvatarUrlWithSize({ ...user, full_name: localName }, 96)}
                          alt="Profile"
                          className="w-full h-full object-cover rounded-full"
                        />
                      )}
                    </button>
                    <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-1 shadow-md pointer-events-none">
                      <Camera className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 leading-tight wrap-break-word whitespace-normal">
                      {localName || 'Anonymous'}
                    </h3>
                  </div>
                </div>

                <p className="self-end text-xs font-bold uppercase tracking-widest text-indigo-600">
                  {completionPercentage}% Complete
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Briefcase className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Education</p>
                    <p className="text-lg font-semibold text-slate-800 leading-snug">{educationDisplay}</p>
                    {primaryEducation && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {(() => {
                          const badge = getApprovalBadge(primaryEducation.approval_status || 'not_verified');
                          return (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border whitespace-nowrap ${badge.className}`}>
                              {badge.label}
                            </span>
                          );
                        })()}
                        {primaryEducation.enrollment_status === 'alumni' ? (
                          <span className="inline-flex items-center whitespace-nowrap gap-1 text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                            <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                            Alumni
                          </span>
                        ) : primaryEducation.enrollment_status === 'currently_enrolled' ? (
                          <span className="inline-flex items-center whitespace-nowrap gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <BookOpen className="w-3.5 h-3.5 shrink-0" />
                            Currently Enrolled
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Current Focus / Industry</p>
                    <p className="text-lg font-semibold text-slate-800 leading-snug">{localIndustry || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Looking for</p>
                    <p className="text-lg font-semibold text-slate-800 leading-snug">{lookingForDisplay}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {isBasicEditMode && (
            <>
          <div className="flex items-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-linear-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-bold mr-4 shrink-0 overflow-hidden">
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
            </div>
            <div className="grow min-w-0">
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
                            onClick={async () => {
                              setEditingSchoolIndex(null);
                              if (isDirty) {
                                await handleSave();
                              }
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
                          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="mb-1.5 w-full">
                              <p className="font-bold text-slate-800 text-sm truncate w-full pr-1 mb-1">{school.name}</p>
                              <div className="flex flex-wrap items-center gap-2">
                                {(() => {
                                  const badge = getApprovalBadge(school.approval_status);
                                  return (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border shrink-0 whitespace-nowrap ${badge.className}`}>
                                      {badge.label}
                                    </span>
                                  );
                                })()}
                                {school.enrollment_status === 'alumni' ? (
                                  <span className="inline-flex items-center whitespace-nowrap gap-1 text-[11px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">
                                    <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                                    Alumni
                                  </span>
                                ) : school.enrollment_status === 'currently_enrolled' ? (
                                  <span className="inline-flex items-center whitespace-nowrap gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
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
                        <div className="flex gap-1.5 ml-2 shrink-0">
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

          </div>
            </>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 w-full">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Additional Details</h2>
            <button
              onClick={handleAdditionalDetailsToggle}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 text-sm font-bold"
            >
              <Edit3 className="w-4 h-4" />
              {isAdditionalEditMode ? 'Done' : 'Edit'}
            </button>
          </div>

          {isAdditionalEditMode ? (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-slate-700">Short Bio</label>
                  <button
                    onClick={handleAutoWriteBio}
                    disabled={isGeneratingTags}
                    className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50"
                  >
                    Polish Bio
                  </button>
                </div>
                <textarea
                  placeholder="e.g., Exploring new career paths"
                  value={localTagline}
                  onChange={(e) => { setLocalTagline(e.target.value); setIsDirty(true); }}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  rows="3"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-slate-700">Smart Tags</label>
                  <button
                    onClick={handleAutoTagBio}
                    disabled={isGeneratingTags}
                    className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50"
                  >
                    {isGeneratingTags ? 'Generating...' : 'Auto-Tag Bio'}
                  </button>
                </div>

                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add custom tag"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                    className="flex-1 p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="px-3 py-2.5 text-xs font-bold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2 min-h-6">
                  {localTags.length > 0 ? localTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full border border-indigo-100 hover:bg-indigo-100"
                      title="Remove tag"
                    >
                      {tag} ×
                    </button>
                  )) : (
                    <span className="text-[10px] text-slate-400 italic">No tags yet</span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 mt-2 mb-1">Suggestions</p>
                <div className="flex flex-wrap gap-1.5">
                  {SMART_TAG_SUGGESTIONS.filter(
                    (tag) => !localTags.some((currentTag) => currentTag.toLowerCase() === tag.toLowerCase())
                  ).slice(0, 8).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddSuggestedTag(tag)}
                      className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-full border border-slate-200 hover:bg-slate-200"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Short Bio</p>
                <p className="text-sm text-slate-700">{localTagline || 'Not shared yet'}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Smart Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {localTags.length > 0 ? localTags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full border border-indigo-100">
                      {tag}
                    </span>
                  )) : (
                    <span className="text-[10px] text-slate-400 italic">No tags yet</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-full mb-6 rounded-2xl border border-indigo-100 bg-linear-to-br from-white via-indigo-50/40 to-sky-50/40 p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            {(monetizationTopicText || monetizationStyleText || monetizationHookText) && (
              <div>
                <h3 className="text-xl font-black text-slate-800">Monetization Questions</h3>
                <p className="text-xs font-semibold tracking-wide uppercase text-indigo-500 mt-0.5">Paid Session Profile</p>
                {monetizationApprovalStatus === 'pending' && (
                  <span className="inline-flex mt-2 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                    Pending Moderator Approval
                  </span>
                )}
                {monetizationApprovalStatus === 'approved' && (
                  <span className="inline-flex mt-2 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Approved Super Listener
                  </span>
                )}
                {monetizationApprovalStatus === 'rejected' && (
                  <span className="inline-flex mt-2 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                    Rejected - Update And Resubmit
                  </span>
                )}
              </div>
            )}
            {(monetizationTopicText || monetizationStyleText || monetizationHookText) && (
              <button
                onClick={openMonetizationSetup}
                className="p-2.5 rounded-full border border-indigo-200 bg-white/90 hover:bg-white transition-colors shadow-sm"
                aria-label="Edit Monetization Questions"
              >
                <Edit3 className="w-4.5 h-4.5 text-indigo-600" />
              </button>
            )}
          </div>

          {!(monetizationTopicText || monetizationStyleText || monetizationHookText) ? (
            <div className="rounded-2xl border border-indigo-100 bg-white/85 p-6 text-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 mx-auto mb-4 flex items-center justify-center">
                <Zap className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-extrabold text-slate-800 mb-2">Monetize Your Journey</h4>
              <p className="text-slate-600 mb-6">Share your stories, help others grow, and get paid for your time. Ready to take 1:1 sessions?</p>
              <button
                onClick={openMonetizationSetup}
                className="w-full rounded-2xl bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-4 transition-all shadow-md"
              >
                Setup Paid Sessions
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-white/90 p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Experiences Shared In Paid Sessions</p>
                </div>
                <p className="text-[15px] leading-snug font-semibold text-slate-800">{monetizationTopicText || 'Not shared yet'}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white/90 p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Conversation Style</p>
                </div>
                <p className="text-[15px] leading-snug font-semibold text-slate-800">{monetizationStyleText || 'Not shared yet'}</p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white/90 p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Curiosity Hook</p>
                </div>
                <p className="text-[15px] leading-snug font-semibold text-slate-800">{monetizationHookText || 'Not shared yet'}</p>
              </div>

              <button
                onClick={openMonetizationSetup}
                className="w-full p-3.5 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                Edit Paid Session Setup
              </button>
              <button
                onClick={() => setScreen('CONSULTATION_RATE_SETTINGS')}
                className="w-full p-3.5 rounded-xl border border-indigo-200 bg-indigo-100 text-indigo-700 font-extrabold hover:bg-indigo-200 transition-colors"
              >
                Manage Consultation Rate
              </button>
            </div>
          )}
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
          <>
          {user?.is_super_linker && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 w-full mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-extrabold text-slate-800">Community Gratitude</h3>
                {!isEditingCommunityGratitude && (
                  <button
                    onClick={() => setIsEditingCommunityGratitude(true)}
                    className="p-2 rounded-full hover:bg-slate-100"
                    aria-label="Edit Community Gratitude"
                  >
                    <Edit3 className="w-5 h-5 text-indigo-600" />
                  </button>
                )}
              </div>

              {isEditingCommunityGratitude ? (
                <div>
                  <p className="text-xs text-slate-500 mb-3">Select up to 3 reviews from your community feedback to showcase publicly.</p>

                  {reviewsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader className="w-4 h-4 animate-spin" /> Loading reviews...
                    </div>
                  ) : userReviews.filter((review) => String(review?.content || '').trim()).length === 0 ? (
                    <p className="text-sm text-slate-500">No review messages available yet to feature.</p>
                  ) : (
                    <div className="space-y-2">
                      {userReviews
                        .filter((review) => String(review?.content || '').trim())
                        .slice(0, 12)
                        .map((review) => {
                          const isSelected = (editingSharerInsights.communityGratitude || []).some((item) => item?.reviewId === review.id);
                          return (
                            <button
                              key={review.id}
                              type="button"
                              onClick={() => toggleCommunityGratitude(review)}
                              className={`w-full text-left p-3 rounded-lg border transition-all ${isSelected ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                            >
                              <p className="text-sm text-slate-700 line-clamp-2">"{review.content}"</p>
                              <p className="text-xs font-semibold text-slate-500 mt-1">— {review.reviewer_name || 'Anonymous'}</p>
                            </button>
                          );
                        })}
                    </div>
                  )}

                  {gratitudeSelectionError && (
                    <p className="text-xs font-semibold text-rose-600 mt-2">{gratitudeSelectionError}</p>
                  )}
                </div>
              ) : (
                selectedCommunityGratitude.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCommunityGratitude.map((item, index) => (
                      <div key={`${item.reviewId || index}`} className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                        <p className="text-sm text-slate-700 italic">"{item.text}"</p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">— {item.from || 'Anonymous'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No gratitude highlights selected yet.</p>
                )
              )}
            </div>
          )}
          </>
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

        {isMonetizationSetupOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center">
                  {monetizationStep > 1 && (
                    <button
                      onClick={() => setMonetizationStep((prev) => prev - 1)}
                      className="mr-3 p-1.5 -ml-1.5 rounded-full hover:bg-slate-200 transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </button>
                  )}
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-800">Paid Session Setup</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Step {monetizationStep} of 3</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMonetizationSetupOpen(false)}
                  className="p-2 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="w-full h-1.5 bg-slate-100">
                <div className="h-full bg-indigo-500 transition-all duration-300 ease-out" style={{ width: `${(monetizationStep / 3) * 100}%` }}></div>
              </div>

              <div className="p-6 overflow-y-auto flex-grow">
                {monetizationStep === 1 && (
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-1 block">1. What experiences do you bring to paid conversations?</label>
                    <p className="text-xs text-slate-500 mb-3 font-medium">Select all that apply.</p>
                    <div className="space-y-2.5">
                      {MONETIZATION_TOPIC_OPTIONS.map((option) => (
                        <button
                          key={option}
                          onClick={() => toggleMonetizationTopic(option)}
                          className={`w-full text-left p-4 rounded-xl border transition-all font-medium flex justify-between items-center ${monetizationTopicSelections.includes(option) ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-200' : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'}`}
                        >
                          <span>{option}</span>
                          {monetizationTopicSelections.includes(option) && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                        </button>
                      ))}
                      <div className="mt-4 pt-2 border-t border-slate-100">
                        <input
                          type="text"
                          placeholder="Or type your own (comma separated)..."
                          value={monetizationCustomTopic}
                          onChange={(e) => setMonetizationCustomTopic(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {monetizationStep === 2 && (
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-1 block">2. How do you usually help people in conversations?</label>
                    <p className="text-xs text-slate-500 mb-3 font-medium">Select all that apply.</p>
                    <div className="space-y-2.5">
                      {MONETIZATION_STYLE_OPTIONS.map((option) => (
                        <button
                          key={option}
                          onClick={() => toggleMonetizationStyle(option)}
                          className={`w-full text-left p-4 rounded-xl border transition-all font-medium flex justify-between items-center ${monetizationStyleSelections.includes(option) ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-200' : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-slate-50'}`}
                        >
                          <span>{option}</span>
                          {monetizationStyleSelections.includes(option) && <CheckCircle className="w-5 h-5 text-indigo-600" />}
                        </button>
                      ))}
                      <div className="mt-4 pt-2 border-t border-slate-100">
                        <input
                          type="text"
                          placeholder="Or type your own (comma separated)..."
                          value={monetizationCustomStyle}
                          onChange={(e) => setMonetizationCustomStyle(e.target.value)}
                          className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {monetizationStep === 3 && (
                  <div>
                    <label className="text-sm font-bold text-slate-700 mb-2 block">3. Drop one curiosity hook people can ask you about</label>
                    <p className="text-xs text-slate-500 mb-4">Give them a compelling reason to book a 1:1 session with you.</p>
                    <textarea
                      rows="4"
                      placeholder="e.g., Ask me how I switched careers in 90 days and negotiated a better offer"
                      value={monetizationHook}
                      onChange={(e) => setMonetizationHook(e.target.value)}
                      className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800 resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                {monetizationStep > 1 ? (
                  <button
                    onClick={() => setMonetizationStep((prev) => prev - 1)}
                    className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </button>
                ) : <div></div>}

                {monetizationStep < 3 ? (
                  <Button
                    primary
                    className="!w-auto !py-2.5 !px-6"
                    disabled={
                      (monetizationStep === 1 && monetizationTopicSelections.length === 0 && !monetizationCustomTopic.trim()) ||
                      (monetizationStep === 2 && monetizationStyleSelections.length === 0 && !monetizationCustomStyle.trim())
                    }
                    onClick={() => setMonetizationStep((prev) => prev + 1)}
                  >
                    Next <ChevronRight className="w-4 h-4 inline ml-1" />
                  </Button>
                ) : (
                  <Button
                    primary
                    className="!w-auto !py-2.5 !px-6"
                    disabled={!monetizationHook.trim() || isSaving}
                    onClick={completeMonetizationSetup}
                  >
                    {isSaving ? (
                      <>
                        <Loader className="w-4 h-4 inline mr-1 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        Save Setup <CheckCircle className="w-4 h-4 inline ml-1" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}


      </div>

      {isDirty && !isAdditionalEditMode && (
        <div className="fixed bottom-0 left-0 w-full p-4 pb-8 sm:pb-4 bg-white/90 backdrop-blur-lg border-t border-slate-200 z-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
          {saveError && (
            <p className="text-sm text-red-600 mb-2 text-center">{saveError}</p>
          )}
          <Button
            primary
            onClick={handleSave}
            disabled={isSaving || !isDirty}
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


