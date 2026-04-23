import React, { useState } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { UserPlus, Calendar, BadgeCheck, CheckCircle, Target, Handshake, Compass, GraduationCap, School, Tag, Briefcase, Heart, Users, Rocket, Code, Palette, Boxes, Megaphone, Landmark, Brain, Trophy, Mic, Lightbulb, Monitor } from 'lucide-react';

import StarBadge from '../../../components/ui/StarBadge';
import Button from '../../../components/ui/Button';
import ScheduleCallModal from './ScheduleCallModal';
import { isUserVerified } from '../../../lib/utils';

const REASON_ICON_MAP = {
  'Guidance Match': Compass,
  'Alumni Mentor Match': Handshake,
  'Field Match': GraduationCap,
  'Common Field': School,
  'Alumni in Your Field': School,
  'Shared Interests': Tag,
  'Same School': School,
  'Career Climb': Target,
  'Career Pivot': Target,
  'Startup/Hustle': Target,
  'Salary Negotiation': Target,
};

const HIGHLIGHTED_REASON_TAGS = new Set([
  'Guidance Match',
  'Shared Interests',
  'Same School',
  'Common Field',
  'Alumni Mentor Match',
  'Alumni in Your Field',
]);

const SMART_TAG_ICON_MAP = {
  'Career Growth': Briefcase,
  'Work-Life Balance': Heart,
  'Networking': Users,
  'Startups': Rocket,
  'Software Engineering': Code,
  'UX Design': Palette,
  'Product Management': Boxes,
  'Marketing': Megaphone,
  'Finance': Landmark,
  'Mental Health': Brain,
  'Leadership': Trophy,
  'Public Speaking': Mic,
  'Entrepreneurship': Lightbulb,
  'Remote Work': Monitor,
  'Interview Prep': GraduationCap,
};

const getSmartTagIcon = (tag) => SMART_TAG_ICON_MAP[String(tag || '').trim()] || Tag;

const SwipeablePersonCard = ({ person, onAction, style, isTop, onScheduled }) => {
  const { setScreen, setSelectedPerson, setPreviousScreen } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleNameClick = () => {
    setPreviousScreen('CONNECTIONS_DASHBOARD');
    setSelectedPerson(person);
    setScreen('PROFILE_DETAIL');
  };

  // Called by ScheduleCallModal after a successful booking
  const handleScheduleSuccess = (message) => {
    if (!message.toLowerCase().includes('success')) return;
    setIsScheduled(true);
    // Show the "Call Scheduled!" badge for ~900ms, then animate the card out
    setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        if (onScheduled) onScheduled(person.id);
      }, 420); // matches card-exit-scheduled animation duration
    }, 900);
  };

  const isSuperLinker = (person?.connections || 0) > 200 && (person?.trustScore || 0) >= 3.0;
  const isVerifiedUser = isUserVerified(person);

  return (
    <>
      <div
        className={`absolute w-full h-full p-0 flex flex-col items-center justify-end rounded-2xl shadow-2xl bg-cover bg-center ${
          isTop ? 'z-10' : 'z-0'
        } touch-manipulation overflow-hidden card-entrance${isExiting ? ' card-exit-scheduled' : ''}`}
        style={{ ...style, backgroundImage: `url(${person.image})`, cursor: isTop ? 'grab' : 'default' }}
      >
        <StarBadge isSuper={isSuperLinker} />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/60 to-transparent"></div>

        {/* "Call Scheduled!" success badge overlay */}
        {isScheduled && (
          <div
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
            style={{ animation: 'successFadeUp 0.3s ease both' }}
          >
            <div className="bg-green-500/90 backdrop-blur-sm text-white font-bold text-lg px-6 py-3 rounded-2xl flex items-center gap-2 shadow-2xl">
              <CheckCircle className="w-6 h-6" />
              Call Scheduled!
            </div>
          </div>
        )}

        <div className="relative w-full text-white p-4 sm:p-6">
          <div className="flex items-center mb-2">
            <button onClick={handleNameClick} className="text-left touch-manipulation">
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight inline active:underline">
                {person.name || person.full_name}
              </h2>
              {isVerifiedUser && (
                <BadgeCheck className="w-5 h-5 ml-2 inline text-white fill-blue-500 align-middle" />
              )}
              <p className="text-xs sm:text-sm font-medium opacity-80">{person.role}</p>
            </button>
          </div>

          <p className="text-xs sm:text-sm mt-1 mb-3 sm:mb-4 opacity-90 leading-snug line-clamp-3">{person.bio}</p>

          {person.matchReasons && person.matchReasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-2">
              {person.matchReasons.map(reason => {
                const ReasonIcon = REASON_ICON_MAP[reason];
                const isHighlightedReason = HIGHLIGHTED_REASON_TAGS.has(reason);
                return (
                  <span
                    key={reason}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                      isHighlightedReason
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {ReasonIcon && (
                      <ReasonIcon className={`w-3 h-3 ${isHighlightedReason ? 'text-indigo-600' : 'text-slate-500'}`} />
                    )}
                    {reason}
                  </span>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {person.tags.slice(0, 5).map(tag => (
              <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-semibold rounded-full border border-slate-200">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex gap-2 sm:gap-3 pt-2">
            {isRequested ? (
              <Button disabled className="flex-1 bg-green-500! text-white! text-xs! sm:text-sm! py-2! sm:py-2.5! whitespace-nowrap touch-manipulation">
                <CheckCircle className="w-3.5 h-3.5 inline mr-1 sm:mr-2 text-white" /> Sent
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  try {
                    setIsRequested(true);
                    await onAction(person, 'connect');
                  } catch (e) {
                    setIsRequested(false);
                  }
                }}
                primary
                className="flex-1 bg-white! text-slate-800! text-xs! sm:text-sm! py-2! sm:py-2.5! whitespace-nowrap touch-manipulation"
              >
                <UserPlus className="w-3.5 h-3.5 inline mr-1 sm:mr-2 text-indigo-500" /> Connect
              </Button>
            )}

            <Button
              onClick={() => setIsModalOpen(true)}
              className={`flex-1 text-xs! sm:text-sm! py-2! sm:py-2.5! whitespace-nowrap touch-manipulation transition-all ${
                isScheduled ? 'bg-green-500!' : 'schedule-btn-pulse'
              }`}
            >
              {isScheduled ? (
                <><CheckCircle className="w-3.5 h-3.5 inline mr-1 sm:mr-2" /> Scheduled</>
              ) : (
                <><Calendar className="w-3.5 h-3.5 inline mr-1 sm:mr-2" /> Schedule Call</>
              )}
            </Button>
          </div>
        </div>
      </div>

      <ScheduleCallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        person={person}
        setScreen={setScreen}
        onSuccess={handleScheduleSuccess}
      />
    </>
  );
};

export default SwipeablePersonCard;
