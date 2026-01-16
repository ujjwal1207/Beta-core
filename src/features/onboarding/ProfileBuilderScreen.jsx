import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { quizFlow } from '../../data/quizFlow';
import Button from '../../components/ui/Button';
import userService from '../../services/userService';

const ProfileBuilderScreen = ({ quizKey }) => {
  const { onboardingAnswers, setOnboardingAnswers, setScreen, setProfileData } = useAppContext();
  
  const step = quizFlow[quizKey];
  const [textInput, setTextInput] = useState(onboardingAnswers[quizKey] || '');

  if (!step) return null;

  const handleNext = async (isSkip = false) => {
    const finalText = isSkip ? '' : textInput;
    const newAnswers = { ...onboardingAnswers, [quizKey]: finalText };
    
    setOnboardingAnswers(newAnswers);
    setProfileData(prev => ({ ...prev, lastCompletedStepKey: quizKey }));
    
    // Prepare update data
    const updateData = { onboarding_answers: newAnswers };
    
    // For SHARER_TRACK steps, also update sharer_insights for backwards compatibility
    if (quizKey === 'SHARER_TRACK_1' || quizKey === 'SHARER_TRACK_3') {
      const sharerInsightsKey = quizKey === 'SHARER_TRACK_1' ? 'youngerSelf' : 'societyChange';
      updateData.sharer_insights = {
        [sharerInsightsKey]: finalText
      };
    }
    
    // Save to backend
    try {
      await userService.updateProfile(updateData);
    } catch (error) {
      console.error('Failed to save onboarding answers:', error);
    }
    
    const nextStepKey = step.nextStepLogic(finalText, newAnswers);
    if (nextStepKey) {
      setScreen(nextStepKey);
    } else {
      setScreen('FEED');
    }
  };

  const isCompleteButtonDisabled = textInput.trim().length === 0;

  return (
    <div className="flex flex-col h-full p-6 bg-slate-50">
      <div className="flex items-center mb-6">
        <button onClick={() => setScreen('FEED')} className="p-2 rounded-full hover:bg-slate-200">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
      </div>
      
      <div className="flex-grow overflow-y-auto -mr-2 pr-2">
        <p className="text-lg font-semibold text-indigo-600 mb-2">{step.prompt}</p>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-6">{step.question}</h1>
        <label className="text-sm font-semibold text-slate-700 mb-1.5 block">{step.inputLabel}</label>
        <textarea
          className="w-full p-4 bg-white border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
          rows="5"
          placeholder={step.placeholder}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
        />
      </div>
      
      <div className="mt-8 pt-4 border-t border-slate-200 space-y-3">
        <Button primary onClick={() => handleNext(false)} disabled={isCompleteButtonDisabled}>
          {step.nextStepLogic(textInput, onboardingAnswers) ? 'Next' : 'Finish'}
        </Button>
        <Button skip onClick={() => handleNext(true)}>Skip for now</Button>
      </div>
    </div>
  );
};

export default ProfileBuilderScreen;
