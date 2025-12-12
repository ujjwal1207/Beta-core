import React from 'react';
import { quizFlow, TRACK_Q1_KEYS, TRACK_Q2_KEYS, SHARER_TRACK_KEYS } from '../../../data/quizFlow';

const ProfileCompletionNudge = ({ onboardingAnswers, setScreen }) => {
  const hasAnswer = (key) => {
    const answer = onboardingAnswers[key];
    if (Array.isArray(answer)) return answer.length > 0;
    if (typeof answer === 'string') return answer.trim().length > 0;
    if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) return Object.keys(answer).length > 0;
    return false;
  };

  const completedVibeStep = hasAnswer('VIBE_QUIZ') ? 1 : 0;
  const vibeAnswers = onboardingAnswers['VIBE_QUIZ'] || [];
  const isSharer = vibeAnswers.includes('KNOWLEDGE_SHARER');
  
  const totalStepsForTrack = isSharer ? 1 + 3 + 1 : 1 + 1 + 1 + 1;
  let completedSteps = completedVibeStep ? 1 : 0;

  if (isSharer) {
    if (hasAnswer('SHARER_TRACK_1')) completedSteps++;
    if (hasAnswer('SHARER_TRACK_2')) completedSteps++;
    if (hasAnswer('SHARER_TRACK_3')) completedSteps++;
    if (hasAnswer('NEW_GENERATION')) completedSteps++;
  } else {
    const nextTrackStep1Key = quizFlow['VIBE_QUIZ'].nextStepLogic(vibeAnswers, onboardingAnswers);
    if (nextTrackStep1Key && TRACK_Q1_KEYS.includes(nextTrackStep1Key) && hasAnswer(nextTrackStep1Key)) {
      completedSteps++;
    }
    if (hasAnswer('NEW_GENERATION')) completedSteps++;
    if (quizFlow['NEW_GENERATION']?.nextStepLogic(onboardingAnswers['NEW_GENERATION'], onboardingAnswers) === 'GIVE_ADVICE_QUIZ' && hasAnswer('GIVE_ADVICE_QUIZ')) {
      completedSteps++;
    }
  }
  
  const percentage = Math.round((completedSteps / totalStepsForTrack) * 100);

  const findNextStep = () => {
    if (!completedVibeStep) return () => setScreen('VIBE_QUIZ');
    
    const nextTrackStep1Key = quizFlow['VIBE_QUIZ'].nextStepLogic(vibeAnswers, onboardingAnswers);
    if (nextTrackStep1Key && (TRACK_Q1_KEYS.includes(nextTrackStep1Key) || SHARER_TRACK_KEYS.includes(nextTrackStep1Key)) && !hasAnswer(nextTrackStep1Key)) {
      return () => setScreen(nextTrackStep1Key);
    }
    
    if (nextTrackStep1Key && hasAnswer(nextTrackStep1Key)) {
      const nextTrackStep2Key = quizFlow[nextTrackStep1Key]?.nextStepLogic(onboardingAnswers[nextTrackStep1Key], onboardingAnswers);
      if (nextTrackStep2Key && (TRACK_Q2_KEYS.includes(nextTrackStep2Key) || SHARER_TRACK_KEYS.includes(nextTrackStep2Key)) && !hasAnswer(nextTrackStep2Key)) {
        return () => setScreen(nextTrackStep2Key);
      }
      if (nextTrackStep2Key && hasAnswer(nextTrackStep2Key) && SHARER_TRACK_KEYS.includes(nextTrackStep2Key)) {
        const nextTrackStep3Key = quizFlow[nextTrackStep2Key]?.nextStepLogic(onboardingAnswers[nextTrackStep2Key], onboardingAnswers);
        if (nextTrackStep3Key && (SHARER_TRACK_KEYS.includes(nextTrackStep3Key) || nextTrackStep3Key === 'NEW_GENERATION') && !hasAnswer(nextTrackStep3Key)) {
          return () => setScreen(nextTrackStep3Key);
        }
      }
    }
    
    if (!hasAnswer('NEW_GENERATION')) {
      if (isSharer && !hasAnswer('SHARER_TRACK_3')) return () => setScreen('SHARER_TRACK_3');
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
