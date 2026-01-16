import React, { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { quizFlow } from '../../data/quizFlow';
import Button from '../../components/ui/Button';
import ChoiceCard from '../../components/ui/ChoiceCard';
import userService from '../../services/userService';

const QuizScreen = ({ quizKey }) => {
  const { onboardingAnswers, setOnboardingAnswers, setScreen, setProfileData } = useAppContext();
  
  const step = quizFlow[quizKey];
  // Default to empty array for multiple, empty array (or null) for single to prevent errors
  const [selectedIds, setSelectedIds] = useState(onboardingAnswers[quizKey] || []);

  if (!step) return null;

  const handleSelect = (id) => {
    setSelectedIds(prev => {
      // Ensure prev is an array before treating it as one
      const current = Array.isArray(prev) ? prev : [];
      
      if (step.allowMultiple) {
        return current.includes(id) ? current.filter(item => item !== id) : [...current, id];
      } else {
        return [id];
      }
    });
  };

  const handleNext = async (isSkip = false) => {
    // If skipping, send empty array; otherwise send selectedIds (ensure it's an array for logic)
    const finalSelectedIds = isSkip ? [] : (Array.isArray(selectedIds) ? selectedIds : [selectedIds]);
    
    // Update global state
    const newAnswers = { ...onboardingAnswers, [quizKey]: finalSelectedIds };
    setOnboardingAnswers(newAnswers);
    setProfileData(prev => ({ ...prev, lastCompletedStepKey: quizKey }));
    
    // Save to backend
    try {
      await userService.updateProfile({ onboarding_answers: newAnswers });
    } catch (error) {
      console.error('Failed to save onboarding answers:', error);
    }
    
    // Execute logic function from quizFlow
    // NOTE: We pass finalSelectedIds. If the logic expects a single string for single-choice, 
    // handle that, but typically the original code handled arrays for everything.
    const nextStepKey = step.nextStepLogic(finalSelectedIds, newAnswers);
    
    if (nextStepKey) {
      setScreen(nextStepKey);
    } else {
      setScreen('FEED');
    }
  };

  const isNextDisabled = !step.allowMultiple && (Array.isArray(selectedIds) ? selectedIds.length === 0 : !selectedIds);
  // For multiple choice, usually we want at least one, unless strictly optional
  const isMultiNextDisabled = step.allowMultiple && selectedIds.length === 0;

  return (
    <div className="flex flex-col h-full p-6 bg-slate-50">
      <div className="flex items-center mb-6">
        <button onClick={() => setScreen('FEED')} className="p-2 rounded-full hover:bg-slate-200">
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
      </div>
      
      <div className="flex-grow overflow-y-auto -mr-2 pr-2">
        <p className="text-lg font-semibold text-indigo-600 mb-2">{step.prompt}</p>
        {/* Render text if it exists (some steps might have a question field) */}
        {step.question && <h1 className="text-3xl font-extrabold text-slate-800 mb-6">{step.question}</h1>}
        
        <div className="mt-6">
          {step.options.map(option => (
            <ChoiceCard 
              key={option.id} 
              isSelected={Array.isArray(selectedIds) ? selectedIds.includes(option.id) : selectedIds === option.id}
              onClick={() => handleSelect(option.id)}
            >
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-100 rounded-lg mr-4">
                {option.icon}
              </div>
              <span className="text-base font-semibold text-slate-700 flex-grow">{option.text}</span>
              {((Array.isArray(selectedIds) && selectedIds.includes(option.id)) || selectedIds === option.id) && (
                <CheckCircle className="w-6 h-6 text-indigo-500 ml-4 flex-shrink-0" />
              )}
            </ChoiceCard>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-200 space-y-3">
        <Button 
          primary 
          onClick={() => handleNext(false)} 
          disabled={step.allowMultiple ? isMultiNextDisabled : isNextDisabled}
        >
          {step.nextStepLogic(selectedIds, onboardingAnswers) ? 'Next' : 'Finish'}
        </Button>
        <Button skip onClick={() => handleNext(true)}>Skip for now</Button>
      </div>
    </div>
  );
};

export default QuizScreen;
