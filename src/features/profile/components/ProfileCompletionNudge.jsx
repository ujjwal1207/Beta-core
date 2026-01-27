import React, { useState } from 'react';
import { CheckCircle, ChevronRight } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import { quizFlow, TRACK_Q1_KEYS, TRACK_Q2_KEYS } from '../../../data/quizFlow';
import Button from '../../../components/ui/Button';

const ProfileCompletionNudge = ({ onboardingAnswers, setScreen }) => {
  const { user, setOnboardingAnswers, setProfileData } = useAppContext();
  const [selectedIds, setSelectedIds] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  
  // Normalize onboarding answers to ensure consistent format
  const normalizedAnswers = React.useMemo(() => {
    const normalized = { ...onboardingAnswers };
    
    // Ensure all answers are arrays for consistency
    Object.keys(normalized).forEach(key => {
      const answer = normalized[key];
      if (typeof answer === 'string' && answer.trim()) {
        // Convert single string answers to arrays
        normalized[key] = [answer];
      } else if (Array.isArray(answer)) {
        // Keep arrays as-is
        normalized[key] = answer;
      } else if (answer !== null && typeof answer === 'object') {
        // Convert objects to arrays of keys if they have meaningful data
        normalized[key] = Object.keys(answer);
      } else {
        // Remove invalid answers
        delete normalized[key];
      }
    });
    
    return normalized;
  }, [onboardingAnswers]);
  
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
    const answer = normalizedAnswers[key];
    if (Array.isArray(answer)) return answer.length > 0;
    if (typeof answer === 'string') return answer.trim().length > 0;
    if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) return Object.keys(answer).length > 0;
    return false;
  };

  // Calculate onboarding journey completion (50% of total)
  const calculateJourneyCompletion = () => {
    const completedVibeStep = hasAnswer('VIBE_QUIZ') ? 1 : 0;
    const vibeAnswers = normalizedAnswers['VIBE_QUIZ'] || [];
    
    let totalSteps = 4; // Base steps: VIBE_QUIZ + TRACK_Q1 + TRACK_Q2 + NEW_GENERATION
    
    // Check if user goes to GIVE_ADVICE_QUIZ
    const goesToAdviceQuiz = quizFlow['NEW_GENERATION'].nextStepLogic(normalizedAnswers['NEW_GENERATION'], normalizedAnswers) === 'GIVE_ADVICE_QUIZ';
    if (goesToAdviceQuiz) {
      totalSteps = 5; // Add GIVE_ADVICE_QUIZ step
    }
    
    let completedSteps = completedVibeStep ? 1 : 0;

    const nextTrackStep1Key = quizFlow['VIBE_QUIZ'].nextStepLogic(vibeAnswers, onboardingAnswers);
    if (nextTrackStep1Key && TRACK_Q1_KEYS.includes(nextTrackStep1Key) && hasAnswer(nextTrackStep1Key)) {
      completedSteps++;
    }
    
    // Add TRACK_Q2 step
    if (nextTrackStep1Key && hasAnswer(nextTrackStep1Key)) {
      const nextTrackStep2Key = quizFlow[nextTrackStep1Key]?.nextStepLogic(normalizedAnswers[nextTrackStep1Key], normalizedAnswers);
      if (nextTrackStep2Key && TRACK_Q2_KEYS.includes(nextTrackStep2Key) && hasAnswer(nextTrackStep2Key)) {
        completedSteps++;
      }
    }
    
    if (hasAnswer('NEW_GENERATION')) completedSteps++;
    if (goesToAdviceQuiz && hasAnswer('GIVE_ADVICE_QUIZ')) completedSteps++;
    
    // Note: SHARER_TRACK steps are not counted toward profile completion
    
    // Return percentage contribution (max 50%)
    return Math.round((completedSteps / totalSteps) * 50);
  };

  // Calculate total percentage: 50% from profile fields + 50% from journey
  const profileFieldsPercentage = calculateProfileFieldsCompletion();
  const journeyPercentage = calculateJourneyCompletion();
  const percentage = profileFieldsPercentage + journeyPercentage;

  const findNextStep = () => {
    if (!hasAnswer('VIBE_QUIZ')) return 'VIBE_QUIZ';

    const vibeAnswers = normalizedAnswers['VIBE_QUIZ'] || [];
    const nextTrackStep1Key = quizFlow['VIBE_QUIZ'].nextStepLogic(vibeAnswers, normalizedAnswers);
    if (nextTrackStep1Key && TRACK_Q1_KEYS.includes(nextTrackStep1Key) && !hasAnswer(nextTrackStep1Key)) {
      return nextTrackStep1Key;
    }

    if (nextTrackStep1Key && hasAnswer(nextTrackStep1Key)) {
      const nextTrackStep2Key = quizFlow[nextTrackStep1Key]?.nextStepLogic(normalizedAnswers[nextTrackStep1Key], normalizedAnswers);
      if (nextTrackStep2Key && TRACK_Q2_KEYS.includes(nextTrackStep2Key) && !hasAnswer(nextTrackStep2Key)) {
        return nextTrackStep2Key;
      }
    }

    if (!hasAnswer('NEW_GENERATION')) {
      return 'NEW_GENERATION';
    }

    if (!hasAnswer('GIVE_ADVICE_QUIZ')) {
      return 'GIVE_ADVICE_QUIZ';
    }

    // Main quiz is complete - shared wisdom is separate
    return null;
  };

  const nextStepKey = findNextStep();
  const currentStep = nextStepKey ? quizFlow[nextStepKey] : null;
  
  // Fallback for invalid nextStepKey (could happen with old/corrupted data)
  const validCurrentStep = currentStep || (nextStepKey ? {
    prompt: "It looks like we need to restart your journey. What's bringing you here today?",
    allowMultiple: false,
    options: quizFlow['VIBE_QUIZ'].options,
    nextStepLogic: quizFlow['VIBE_QUIZ'].nextStepLogic
  } : null);

  // Reset selectedIds when opening quiz or when currentStep changes
  React.useEffect(() => {
    if (showQuiz && validCurrentStep) {
      setSelectedIds([]);
    }
  }, [showQuiz, nextStepKey]);

  const handleSelect = (id) => {
    if (!validCurrentStep) return;
    
    setSelectedIds(prev => {
      if (validCurrentStep.allowMultiple) {
        return prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      } else {
        return [id];
      }
    });
  };

  const handleSubmit = () => {
    if (!validCurrentStep || selectedIds.length === 0) return;

    // Update onboarding answers using normalized base
    const newAnswers = { ...normalizedAnswers, [nextStepKey]: selectedIds };
    setOnboardingAnswers(newAnswers);
    setProfileData(prev => ({ ...prev, lastCompletedStepKey: nextStepKey }));

    // Reset state
    setSelectedIds([]);
    setShowQuiz(false);
  };

  if (showQuiz && validCurrentStep) {
    return (
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 w-full">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-indigo-700">Complete Your Journey</h4>
          <button
            onClick={() => setShowQuiz(false)}
            className="text-indigo-500 hover:text-indigo-700 text-sm"
          >
            ✕
          </button>
        </div>

        <p className="text-sm font-medium text-indigo-800 mb-3">{validCurrentStep?.prompt || 'Loading question...'}</p>

        <div className="space-y-2 mb-4">
          {validCurrentStep?.options?.map(option => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedIds.includes(option.id)
                  ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center">
                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-slate-100 rounded-lg mr-3">
                  {option.icon}
                </div>
                <span className="text-sm font-medium flex-grow">{option.text}</span>
                {selectedIds.includes(option.id) && (
                  <CheckCircle className="w-5 h-5 text-indigo-500 ml-2 flex-shrink-0" />
                )}
              </div>
            </button>
          )) || <p className="text-sm text-slate-500">Loading options...</p>}
        </div>

        {selectedIds.length === 0 && (
          <p className="text-xs text-slate-500 mb-3 text-center">
            {validCurrentStep?.allowMultiple 
              ? "Select one or more options to continue" 
              : "Select an option to continue"}
          </p>
        )}

        <Button
          primary
          onClick={handleSubmit}
          disabled={!validCurrentStep || selectedIds.length === 0}
          className="!py-2 !px-4 !text-sm"
        >
          Continue <ChevronRight className="w-4 h-4 inline ml-1" />
        </Button>
      </div>
    );
  }

  return (
    <button
      onClick={() => nextStepKey ? setShowQuiz(true) : setScreen('FEED')}
      className={`text-xs font-bold px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
        percentage < 33
          ? 'text-rose-700 bg-rose-100 border border-rose-300 hover:bg-rose-200'
          : percentage >= 67
          ? 'text-green-700 bg-green-100 border border-green-300 hover:bg-green-200'
          : 'text-indigo-700 bg-indigo-100 border border-indigo-300 hover:bg-indigo-200'
      } ${percentage < 100 ? 'animate-pulse-nudge' : ''}`}
    >
      {nextStepKey ? 'Continue Journey' : 'Journey Complete!'} {percentage}%
    </button>
  );
};

export default ProfileCompletionNudge;
