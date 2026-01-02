import React from 'react';
import { useAppContext } from '../../../context/AppContext';
import { quizFlow, TRACK_Q1_KEYS, TRACK_Q2_KEYS } from '../../../data/quizFlow';

const ProfileCompletionNudge = ({ onboardingAnswers, setScreen }) => {
  const { user } = useAppContext();
  
  // Calculate profile fields completion (50% of total)
  const calculateProfileFieldsCompletion = () => {
    if (!user) return 0;
    
    let filledFields = 0;
    const totalFields = 6; // full_name, bio, location, industry, role, expertise
    
    if (user.full_name?.trim()) filledFields++;
    if (user.bio?.trim()) filledFields++;
    if (user.location?.trim()) filledFields++;
    if (user.industry?.trim()) filledFields++;
    if (user.role?.trim()) filledFields++;
    if (user.expertise?.trim()) filledFields++;
    
    // Return percentage contribution (max 50%)
    return Math.round((filledFields / totalFields) * 50);
  };

  const hasAnswer = (key) => {
    const answer = onboardingAnswers[key];
    if (Array.isArray(answer)) return answer.length > 0;
    if (typeof answer === 'string') return answer.trim().length > 0;
    if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) return Object.keys(answer).length > 0;
    return false;
  };

  // Calculate onboarding journey completion (50% of total)
  const calculateJourneyCompletion = () => {
    const completedVibeStep = hasAnswer('VIBE_QUIZ') ? 1 : 0;
    const vibeAnswers = onboardingAnswers['VIBE_QUIZ'] || [];
    
    const totalStepsForTrack = 1 + 1 + 1 + 1; // VIBE_QUIZ + Track 1 + NEW_GENERATION + optional GIVE_ADVICE
    let completedSteps = completedVibeStep ? 1 : 0;

    const nextTrackStep1Key = quizFlow['VIBE_QUIZ'].nextStepLogic(vibeAnswers, onboardingAnswers);
    if (nextTrackStep1Key && TRACK_Q1_KEYS.includes(nextTrackStep1Key) && hasAnswer(nextTrackStep1Key)) {
      completedSteps++;
    }
    if (hasAnswer('NEW_GENERATION')) completedSteps++;
    if (quizFlow['NEW_GENERATION']?.nextStepLogic(onboardingAnswers['NEW_GENERATION'], onboardingAnswers) === 'GIVE_ADVICE_QUIZ' && hasAnswer('GIVE_ADVICE_QUIZ')) {
      completedSteps++;
    }
    
    // Return percentage contribution (max 50%)
    return Math.round((completedSteps / totalStepsForTrack) * 50);
  };

  const completedVibeStep = hasAnswer('VIBE_QUIZ') ? 1 : 0;
  const vibeAnswers = onboardingAnswers['VIBE_QUIZ'] || [];
  
  // Calculate total percentage: 50% from profile fields + 50% from journey
  const profileFieldsPercentage = calculateProfileFieldsCompletion();
  const journeyPercentage = calculateJourneyCompletion();
  const percentage = profileFieldsPercentage + journeyPercentage;

  const findNextStep = () => {
    if (!completedVibeStep) return () => setScreen('VIBE_QUIZ');
    
    const nextTrackStep1Key = quizFlow['VIBE_QUIZ'].nextStepLogic(vibeAnswers, onboardingAnswers);
    if (nextTrackStep1Key && TRACK_Q1_KEYS.includes(nextTrackStep1Key) && !hasAnswer(nextTrackStep1Key)) {
      return () => setScreen(nextTrackStep1Key);
    }
    
    if (nextTrackStep1Key && hasAnswer(nextTrackStep1Key)) {
      const nextTrackStep2Key = quizFlow[nextTrackStep1Key]?.nextStepLogic(onboardingAnswers[nextTrackStep1Key], onboardingAnswers);
      if (nextTrackStep2Key && TRACK_Q2_KEYS.includes(nextTrackStep2Key) && !hasAnswer(nextTrackStep2Key)) {
        return () => setScreen(nextTrackStep2Key);
      }
    }
    
    if (!hasAnswer('NEW_GENERATION')) {
      return () => setScreen('NEW_GENERATION');
    }
    
    const nextStepAfterGen = quizFlow['NEW_GENERATION']?.nextStepLogic(onboardingAnswers['NEW_GENERATION'], onboardingAnswers);
    if (nextStepAfterGen === 'GIVE_ADVICE_QUIZ' && !hasAnswer('GIVE_ADVICE_QUIZ')) {
      return () => setScreen('GIVE_ADVICE_QUIZ');
    }
    
    return () => setScreen('VIBE_QUIZ');
  };

  const nextScreenKeyOrAction = findNextStep();

  let nudgeStyles = {
    textColor: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    borderColor: 'border-indigo-300',
    hoverBgColor: 'hover:bg-indigo-200'
  };

  if (percentage < 33) {
    nudgeStyles = {
      textColor: 'text-rose-700',
      bgColor: 'bg-rose-100',
      borderColor: 'border-rose-300',
      hoverBgColor: 'hover:bg-rose-200'
    };
  } else if (percentage >= 67) {
    nudgeStyles = {
      textColor: 'text-green-700',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-300',
      hoverBgColor: 'hover:bg-green-200'
    };
  }

  return (
    <button 
      onClick={nextScreenKeyOrAction}
      className={`text-xs font-bold ${nudgeStyles.textColor} ${nudgeStyles.bgColor} border ${nudgeStyles.borderColor} rounded-full px-3 py-1.5 ${nudgeStyles.hoverBgColor} transition-colors whitespace-nowrap ${
        percentage < 100 ? 'animate-pulse-nudge' : ''
      }`}
    >
      PROFILE JOURNEY {percentage}%
    </button>
  );
};

export default ProfileCompletionNudge;
