import React, { useState } from 'react';
import { X, ChevronRight, Zap, Smile } from 'lucide-react';
import { quizFlow, TRACK_Q1_KEYS, TRACK_Q2_KEYS } from '../../../data/quizFlow';
import { MOOD_LABELS, MOOD_COLORS, getMoodGradient } from '../../../config/theme';

const FeedJourneyCard = ({ onboardingAnswers, setScreen, onClose, dismissible = true }) => {
  const [mood, setMood] = useState(1);

  // If onboardingAnswers is empty, treat as 0% complete
  const hasAnyAnswers = onboardingAnswers && Object.keys(onboardingAnswers).length > 0;
  const hasAnswer = (key) => {
    const answer = onboardingAnswers[key];
    if (Array.isArray(answer)) return answer.length > 0;
    if (typeof answer === 'string') return answer.trim().length > 0;
    if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) return Object.keys(answer).length > 0;
    return false;
  };
  // Updated progress calculation to match current quiz flow
  const vibeAnswers = onboardingAnswers['VIBE_QUIZ'] || [];
  let completedSteps = 0;
  let totalSteps = 4; // Base steps: VIBE_QUIZ + TRACK_Q1 + TRACK_Q2 + NEW_GENERATION
  
  // Check if user goes to GIVE_ADVICE_QUIZ
  const goesToAdviceQuiz = quizFlow['NEW_GENERATION'].nextStepLogic(onboardingAnswers['NEW_GENERATION'], onboardingAnswers) === 'GIVE_ADVICE_QUIZ';
  if (goesToAdviceQuiz) {
    totalSteps = 5; // Add GIVE_ADVICE_QUIZ step
  }
  
  // Step 1: VIBE_QUIZ
  if (hasAnswer('VIBE_QUIZ')) completedSteps++;
  
  // Step 2: TRACK_Q1 step (TRACK_CAREER_1, TRACK_BALANCE_1, etc.)
  const nextTrackStep1Key = quizFlow['VIBE_QUIZ'].nextStepLogic(vibeAnswers, onboardingAnswers);
  if (nextTrackStep1Key && TRACK_Q1_KEYS.includes(nextTrackStep1Key) && hasAnswer(nextTrackStep1Key)) {
    completedSteps++;
  }
  
  // Step 3: TRACK_Q2 step (TRACK_CAREER_2, TRACK_BALANCE_2, etc.)
  if (nextTrackStep1Key && hasAnswer(nextTrackStep1Key)) {
    const nextTrackStep2Key = quizFlow[nextTrackStep1Key]?.nextStepLogic(onboardingAnswers[nextTrackStep1Key], onboardingAnswers);
    if (nextTrackStep2Key && TRACK_Q2_KEYS.includes(nextTrackStep2Key) && hasAnswer(nextTrackStep2Key)) {
      completedSteps++;
    }
  }
  
  // Step 4: NEW_GENERATION
  if (hasAnswer('NEW_GENERATION')) completedSteps++;
  
  // Step 5: GIVE_ADVICE_QUIZ (only if user goes this path)
  if (goesToAdviceQuiz && hasAnswer('GIVE_ADVICE_QUIZ')) {
    completedSteps++;
  }
  
  // Note: SHARER_TRACK steps are separate from the main quiz flow
  
  const percentage = hasAnyAnswers ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const findNextStep = () => {
    // Step 1: VIBE_QUIZ
    if (!hasAnswer('VIBE_QUIZ')) {
      return () => setScreen('VIBE_QUIZ');
    }
    
    // Step 2: TRACK_Q1 step
    const nextTrackStep1Key = quizFlow['VIBE_QUIZ'].nextStepLogic(vibeAnswers, onboardingAnswers);
    if (nextTrackStep1Key && TRACK_Q1_KEYS.includes(nextTrackStep1Key) && !hasAnswer(nextTrackStep1Key)) {
      return () => setScreen(nextTrackStep1Key);
    }
    
    // Step 3: TRACK_Q2 step
    if (nextTrackStep1Key && hasAnswer(nextTrackStep1Key)) {
      const nextTrackStep2Key = quizFlow[nextTrackStep1Key]?.nextStepLogic(onboardingAnswers[nextTrackStep1Key], onboardingAnswers);
      if (nextTrackStep2Key && TRACK_Q2_KEYS.includes(nextTrackStep2Key) && !hasAnswer(nextTrackStep2Key)) {
        return () => setScreen(nextTrackStep2Key);
      }
    }
    
    // Step 4: NEW_GENERATION
    if (!hasAnswer('NEW_GENERATION')) {
      return () => setScreen('NEW_GENERATION');
    }
    
    // Step 5: GIVE_ADVICE_QUIZ
    const nextStepAfterGen = quizFlow['NEW_GENERATION'].nextStepLogic(onboardingAnswers['NEW_GENERATION'], onboardingAnswers);
    if (nextStepAfterGen === 'GIVE_ADVICE_QUIZ' && !hasAnswer('GIVE_ADVICE_QUIZ')) {
      return () => setScreen('GIVE_ADVICE_QUIZ');
    }
    
    // Quiz is complete - SHARER_TRACK steps are separate
    return null;
  };

  const nextAction = findNextStep();

  // If percentage is 100%, show edit option instead of hiding
  const isComplete = percentage >= 100;

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 mb-6 text-white shadow-lg relative overflow-hidden transform transition-all hover:scale-[1.01]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
      
      {dismissible && (
        <button onClick={onClose} className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition-colors z-10">
          <X className="w-4 h-4 text-white/70" />
        </button>
      )}

      <div className="relative z-10">
        <div className="flex items-center mb-3">
          <div className="bg-white/20 p-2 rounded-lg mr-3 backdrop-blur-sm shadow-inner">
            <Zap className="w-5 h-5 text-yellow-300" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-none tracking-tight">
              {isComplete ? 'Edit Your Profile Journey' : 'Complete Your Profile'}
            </h3>
            <p className="text-xs text-indigo-100 mt-1 opacity-90">
              {isComplete ? 'Update your answers anytime.' : 'Unlock better matches & credibility.'}
            </p>
          </div>
        </div>

        <div className="w-full bg-black/20 h-2.5 rounded-full mb-4 backdrop-blur-sm shadow-inner overflow-hidden">
          <div 
            className="bg-gradient-to-r from-yellow-300 to-amber-400 h-2.5 rounded-full transition-all duration-1000 ease-out shadow-sm relative" 
            style={{ width: `${percentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-bold text-indigo-100 tracking-wide">
            {isComplete ? 'COMPLETED' : `${percentage}% COMPLETE`}
          </span>
          <button 
            onClick={isComplete ? () => setScreen('VIBE_QUIZ') : nextAction}
            className="bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 active:scale-95 transition-all shadow-md flex items-center group"
          >
            {isComplete ? 'Edit Journey' : 'Continue'} <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeedJourneyCard;
