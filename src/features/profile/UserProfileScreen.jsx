import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, User, Edit3, Plus, Loader, Users } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import ProfileCompletionNudge from './components/ProfileCompletionNudge';
import Button from '../../components/ui/Button';
import userService from '../../services/userService';

const UserProfileScreen = () => {
  const { setScreen, onboardingAnswers, user, updateUserProfile, updateUserMood } = useAppContext();

  // Use backend user data instead of local profileData
  const [localName, setLocalName] = useState('');
  const [localOrg, setLocalOrg] = useState('');
  const [localTagline, setLocalTagline] = useState('');
  const [localLocation, setLocalLocation] = useState('');
  const [localIndustry, setLocalIndustry] = useState('');
  const [localExpertise, setLocalExpertise] = useState('');
  const [localExploring, setLocalExploring] = useState('');
  const [currentMood, setCurrentMood] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Load user data from backend
  useEffect(() => {
    if (user) {
      setLocalName(user.full_name || '');
      setLocalOrg(user.role || '');
      setLocalTagline(user.bio || '');
      setLocalLocation(user.location || '');
      setLocalIndustry(user.industry || '');
      setLocalExpertise(user.expertise || '');
      setLocalExploring(user.exploring || '');
      setCurrentMood(user.mood || 0);
    }
  }, [user]);

  const sharerInsights = {
    youngerSelf: onboardingAnswers['SHARER_TRACK_1'],
    lifeLessons: onboardingAnswers['SHARER_TRACK_2'],
    societyChange: onboardingAnswers['SHARER_TRACK_3'],
  };
  const hasSharerInsights = sharerInsights.youngerSelf || (sharerInsights.lifeLessons && sharerInsights.lifeLessons.length > 0) || sharerInsights.societyChange;
  
  const vibeAnswers = onboardingAnswers['VIBE_QUIZ'] || [];
  const isSharer = vibeAnswers.includes('KNOWLEDGE_SHARER');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Update profile via backend API
      await updateUserProfile({
        full_name: localName,
        role: localOrg,
        bio: localTagline,
        location: localLocation,
        industry: localIndustry,
        expertise: localExpertise,
        exploring: localExploring,
      });
      
      setIsDirty(false);
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

  const getMoodLabel = (mood) => {
    const labels = ['Calm 😌', 'Happy 😊', 'Anxious 😰', 'Overwhelmed 😵'];
    return labels[mood] || 'Calm 😌';
  };

  const getMoodColor = (mood) => {
    const colors = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500'];
    return colors[mood] || 'bg-green-500';
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
        <h1 className="text-xl font-bold text-slate-800">Profile</h1>
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
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-bold mr-4 flex-shrink-0">
              {localName ? localName[0] : <User className="w-10 h-10" />}
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
              How are you feeling today? <span className="text-indigo-600 font-bold">{getMoodLabel(currentMood)}</span>
            </label>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="3"
                value={currentMood}
                onChange={(e) => handleMoodChange(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #10b981 0%, #eab308 33%, #f97316 66%, #ef4444 100%)`,
                }}
              />
              <div 
                className={`absolute top-[-8px] w-4 h-4 rounded-full ${getMoodColor(currentMood)} border-2 border-white shadow-lg pointer-events-none transition-all`}
                style={{ left: `calc(${(currentMood / 3) * 100}% - 8px)` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-slate-500">
              <span>😌 Calm</span>
              <span>😊 Happy</span>
              <span>😰 Anxious</span>
              <span>😵 Overwhelmed</span>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 w-full mb-6">
            <h3 className="text-base font-bold text-slate-800 mb-2">About me</h3>
            <p className="text-sm text-slate-500 mb-3">Completing your journey helps us find you the best connections.</p>
            <ProfileCompletionNudge
              onboardingAnswers={onboardingAnswers}
              setScreen={setScreen}
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Role / Company</label>
              <input type="text" placeholder="e.g., Acme Inc. or Student" value={localOrg} onChange={(e) => { setLocalOrg(e.target.value); setIsDirty(true); }} className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base" />
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

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Areas I'm Exploring</label>
              <textarea
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-base"
                rows="2"
                placeholder="e.g., 'AI in creative tools, mindfulness techniques, angel investing...'"
                value={localExploring}
                onChange={(e) => { setLocalExploring(e.target.value); setIsDirty(true); }}
              />
            </div>
          </div>
        </div>

        {isSharer && (
          <InfoBlock title="My Shared Wisdom" onEdit={() => setScreen('SHARER_TRACK_1')} editScreenKey={'SHARER_TRACK_1'}>
            {!hasSharerInsights ? (
              <EmptyStateButton text="Add Your Wisdom & Insights" onClick={() => setScreen('SHARER_TRACK_1')} />
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
            )}
          </InfoBlock>
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
