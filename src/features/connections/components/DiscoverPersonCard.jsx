import React, { useState } from 'react';
import { Star, Users, Briefcase, ThumbsUp, UserPlus, Calendar, Building, GraduationCap, CheckCircle } from 'lucide-react';
import { getAvatarUrlWithSize } from '../../../lib/avatarUtils';
import { formatRatingCount, isUserVerified } from '../../../lib/utils';
import VerifiedName from '../../../components/ui/VerifiedName';
import ScheduleCallModal from './ScheduleCallModal';
import { useAppContext } from '../../../context/AppContext';

const DiscoverPersonCard = ({ person, onConnect, showNotification }) => {
  const { setScreen, setSelectedPerson, setPreviousScreen } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);

  const handleNameClick = () => {
    setPreviousScreen('CONNECTIONS_DASHBOARD');
    setSelectedPerson(person);
    setScreen('PROFILE_DETAIL');
  };

  const handleScheduleSuccess = (message) => {
    if (message.toLowerCase().includes('success')) {
      setIsScheduled(true);
      showNotification('Call scheduled successfully!', 'success');
    }
  };

  const handleConnect = async () => {
    try {
      setIsRequested(true);
      await onConnect(person.id);
    } catch (error) {
      setIsRequested(false);
    }
  };

  const isSuperLinker = person.is_super_linker || false;
  const isVerifiedUser = isUserVerified(person);
  
  // Extract or fallback to predefined tags
  const getDisplayTags = () => {
    if (Array.isArray(person.tags) && person.tags.length > 0) {
      return person.tags;
    }
    const possibleTags = [
       ...String(person.exploring || '').split(','),
       ...String(person.focus || '').split(','),
       ...String(person.industry || '').split(',')
    ].map(t => t.trim()).filter(Boolean).filter(t => t.toLowerCase() !== 'null' && t.toLowerCase() !== 'undefined');
    
    if (possibleTags.length > 0) {
      // Remove duplicates
      return Array.from(new Set(possibleTags));
    }
    // Pre-defined fallbacks
    return ['Career Growth', 'Networking', 'Mentorship'];
  };

  const calculateTotalExperience = (text) => {
    if (!text) return null;
    const regex = /(\d+)\s*(?:year|years|yr|yrs)/gi;
    let total = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      total += parseInt(match[1], 10);
    }
    return total > 0 ? total : null;
  };

  const profileTags = getDisplayTags();
  const displayTags = profileTags.slice(0, 3);
  const hiddenTagsCount = Math.max(profileTags.length - displayTags.length, 0);

  const totalExp = calculateTotalExperience(person.expertise);
  const displayExp = totalExp ? `${totalExp}+` : `Learning`;

  const calculateRecommendScore = () => {
    if (!person.total_reviews || person.total_reviews === 0) return "New";
    if (person.trust_score) {
      const percent = Math.round((person.trust_score / 5) * 100);
      return `${Math.min(Math.max(percent, 0), 100)}%`;
    }
    return "100%";
  };
  const recommendScore = calculateRecommendScore();

  const educationList = Array.isArray(person.education) ? person.education : [];
  const primaryEducation = educationList.length > 0 ? educationList[0] : null;
  const educationDisplay = primaryEducation?.name ? primaryEducation.name : 'University Alumni';
  
  const isAlumni = (person.role?.toLowerCase() || '').includes('alumni') || 
                   educationList.some(edu => String(edu?.enrollment_status || '').toLowerCase() === 'alumni') ||
                   profileTags.includes('verified_alumni');

  const subtitle = isAlumni ? `Alumni · ${educationDisplay}` : `Student · ${educationDisplay}`;

  return (
    <div className="w-full bg-white rounded-[24px] shadow-sm border border-slate-100 p-5 mb-4 relative text-left">
      <div className="flex gap-4 mb-4">
        {/* Avatar Section */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-slate-200">
            <img src={getAvatarUrlWithSize(person, 150)} alt={person.full_name} className="w-full h-full object-cover bg-slate-50" />
          </div>
          {/* Online Indicator */}
          <div className="absolute bottom-0 left-0 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 border-2 border-white rounded-full z-10"></div>
          
          {/* Small icon decorators to mimic screenshot */}
          <div className="absolute -top-1 -right-2 w-7 h-7 bg-[#f3f0ff] rounded-full flex items-center justify-center shadow-[0_2px_4px_rgba(79,70,229,0.15)] border-2 border-white text-indigo-600 z-10 hidden sm:flex">
            <Building className="w-3.5 h-3.5" />
          </div>
          <div className="absolute top-1/2 mt-1 sm:mt-0 -right-2 sm:-right-3 w-7 h-7 bg-[#f3f0ff] rounded-full flex items-center justify-center shadow-[0_2px_4px_rgba(79,70,229,0.15)] border-2 border-white text-indigo-600 z-10 hidden sm:flex">
            <GraduationCap className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Info Section */}
        <div className="flex-1 min-w-0 flex flex-col justify-start">
          <div className="flex justify-between items-start gap-1">
            <div className="cursor-pointer active:underline min-w-0" onClick={handleNameClick}>
              <VerifiedName 
                name={person.full_name} 
                isVerified={isVerifiedUser} 
                className="font-bold text-slate-800 text-lg sm:text-xl truncate" 
                wrapperClassName="flex items-center gap-1.5"
                badgeClassName="w-4 h-4 text-white fill-blue-600"
              />
              <p className="text-xs sm:text-sm text-slate-500 truncate mt-0.5">{subtitle}</p>
              <p className="text-xs sm:text-sm font-medium text-slate-700 truncate mt-0.5 max-w-[200px] sm:max-w-xs">{person.role || 'Career coach & mentor'}</p>
            </div>
            
            {/* Rating */}
            <div className="flex flex-col items-end shrink-0">
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-bold text-slate-800 text-sm sm:text-base">
                  {person.total_reviews > 0 ? (person.trust_score ? person.trust_score.toFixed(1) : '5.0') : 'New'}
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                ({formatRatingCount(person.total_reviews != null ? person.total_reviews : 0)} reviews)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Helped people with section */}
      <div className="bg-[#f8f9fc] rounded-2xl p-4 mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-indigo-500" />
          <span className="text-[11px] sm:text-xs font-medium text-slate-600">
            {person.connections_count > 0 ? (
              <>Helped <span className="font-bold text-slate-800">{person.connections_count}</span> people with</>
            ) : (
              <>Can help you with</>
            )}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {displayTags.map(tag => (
            <span key={tag} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[10px] sm:text-xs font-medium rounded-full shadow-sm">
              {tag}
            </span>
          ))}
          {hiddenTagsCount > 0 && (
            <span className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 text-[10px] sm:text-xs font-medium rounded-full shadow-sm">
              +{hiddenTagsCount}
            </span>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex justify-between px-2 sm:px-8 mb-5 py-2">
        <div className="flex flex-col items-center">
          <Briefcase className="w-5 h-5 text-indigo-400 mb-2" strokeWidth={1.5} />
          <div className="flex items-baseline gap-0.5">
            <span className="text-[13px] sm:text-sm font-bold text-slate-800">{displayExp}</span>
          </div>
          <span className="text-[10px] text-slate-400 text-center leading-tight mt-1">{totalExp ? 'Years\nExperience' : 'Experience'}</span>
        </div>
        <div className="w-px bg-slate-100"></div>
        <div className="flex flex-col items-center">
          <Users className="w-5 h-5 text-indigo-400 mb-2" strokeWidth={1.5} />
          <div className="flex items-baseline gap-0.5">
            <span className="text-[13px] sm:text-sm font-bold text-slate-800">{person.connections_count != null ? person.connections_count : 0}</span>
          </div>
          <span className="text-[10px] text-slate-400 text-center leading-tight mt-1">Connections</span>
        </div>
        <div className="w-px bg-slate-100"></div>
        <div className="flex flex-col items-center">
          <ThumbsUp className="w-5 h-5 text-indigo-400 mb-2" strokeWidth={1.5} />
          <div className="flex items-baseline gap-0.5">
            <span className="text-[13px] sm:text-sm font-bold text-slate-800">{recommendScore}</span>
          </div>
          <span className="text-[10px] text-slate-400 text-center leading-tight mt-1">Recommend</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button 
          onClick={handleConnect}
          disabled={isRequested}
          className={`flex-1 py-3.5 border font-semibold rounded-2xl flex justify-center items-center gap-2 touch-manipulation transition-all text-[13px] sm:text-sm ${
            isRequested 
              ? 'bg-slate-50 border-slate-100 text-slate-400' 
              : 'bg-white border-[#e0e7ff] text-indigo-600 hover:bg-slate-50 shadow-sm'
          }`}
        >
          {isRequested ? (
            <><CheckCircle className="w-4 h-4" /> Requested</>
          ) : (
            <><UserPlus className="w-4 h-4" /> Connect</>
          )}
        </button>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className={`flex-[1.2] py-3.5 text-white font-bold rounded-2xl flex justify-center items-center gap-2 touch-manipulation transition-all text-[13px] sm:text-sm ${
            isScheduled 
              ? 'bg-green-500 shadow-[0_4px_12px_rgba(34,197,94,0.3)]' 
              : 'bg-[#ff3b68] hover:bg-[#e8345c] shadow-[0_4px_12px_rgba(255,59,104,0.3)]'
          }`}
        >
          {isScheduled ? (
             <><CheckCircle className="w-4 h-4" /> Scheduled</>
          ) : (
             <><Calendar className="w-4 h-4" /> Schedule Call</>
          )}
        </button>
      </div>

      <ScheduleCallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        person={person}
        setScreen={setScreen}
        onSuccess={handleScheduleSuccess}
      />
    </div>
  );
};

export default DiscoverPersonCard;