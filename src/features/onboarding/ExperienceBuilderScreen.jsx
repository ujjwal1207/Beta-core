import React, { useState } from 'react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { quizFlow } from '../../data/quizFlow';
import Button from '../../components/ui/Button';
import userService from '../../services/userService';

const ExperienceBuilderScreen = ({ quizKey }) => {
  const { onboardingAnswers, setOnboardingAnswers, setScreen, setProfileData } = useAppContext();
  
  const step = quizFlow[quizKey];
  const [experiences, setExperiences] = useState(onboardingAnswers[quizKey] || []);
  const [currentLesson, setCurrentLesson] = useState('');
  const [currentWhere, setCurrentWhere] = useState('');
  const [currentWhen, setCurrentWhen] = useState('');

  if (!step) return null;

  const handleAddExperience = () => {
    if (currentLesson.trim() === '' || currentWhere.trim() === '') return;
    setExperiences(prev => [
      ...prev,
      { lesson: currentLesson, where: currentWhere, when: currentWhen }
    ]);
    setCurrentLesson('');
    setCurrentWhere('');
    setCurrentWhen('');
  };

  const handleRemoveExperience = (index) => {
    setExperiences(prev => prev.filter((_, i) => i !== index));
  };

  const handleNext = async (isSkip = false) => {
    const finalExperiences = isSkip ? [] : experiences;
    const newAnswers = { ...onboardingAnswers, [quizKey]: finalExperiences };
    
    setOnboardingAnswers(newAnswers);
    setProfileData(prev => ({ ...prev, lastCompletedStepKey: quizKey }));
    
    // Prepare update data
    const updateData = { onboarding_answers: newAnswers };
    
    // For SHARER_TRACK_2, also update sharer_insights for backwards compatibility
    if (quizKey === 'SHARER_TRACK_2') {
      updateData.sharer_insights = {
        lifeLessons: finalExperiences
      };
    }
    
    // Save to backend
    try {
      await userService.updateProfile(updateData);
    } catch (error) {
      console.error('Failed to save onboarding answers:', error);
    }
    
    const nextStepKey = step.nextStepLogic(finalExperiences, newAnswers);
    if (nextStepKey) {
      setScreen(nextStepKey);
    } else {
      setScreen('FEED');
    }
  };
  
  const isAddButtonDisabled = currentLesson.trim().length === 0 || currentWhere.trim().length === 0;
  const isCompleteButtonDisabled = experiences.length === 0;

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
        
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4 mb-6">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">What you learnt</label>
            <textarea
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
              rows="3"
              placeholder="e.g., 'Failure is just data...'"
              value={currentLesson}
              onChange={(e) => setCurrentLesson(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Where you learnt it</label>
            <input
              type="text"
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
              placeholder="e.g., 'My first startup, Acme Inc.'"
              value={currentWhere}
              onChange={(e) => setCurrentWhere(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-1.5 block">When / how long (Optional)</label>
            <input
              type="text"
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-base"
              placeholder="e.g., '2015-2018' or 'For about 2 years'"
              value={currentWhen}
              onChange={(e) => setCurrentWhen(e.target.value)}
            />
          </div>
          <Button primary onClick={handleAddExperience} disabled={isAddButtonDisabled} className="!py-2.5 !text-sm">
            <Plus className="w-5 h-5 inline mr-1.5" /> Add This Experience
          </Button>
        </div>
        
        {experiences.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-base font-bold text-slate-800">Your Added Lessons</h3>
            {experiences.map((exp, index) => (
              <div key={index} className="bg-white p-4 rounded-xl border border-slate-200 relative">
                <button 
                  onClick={() => handleRemoveExperience(index)}
                  className="absolute top-2 right-2 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 hover:text-rose-500"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-base font-semibold text-slate-700 italic mb-2">"{exp.lesson}"</p>
                <p className="text-sm font-medium text-slate-600">
                  <span className="font-semibold text-indigo-600">Where:</span> {exp.where}
                </p>
                {exp.when && (
                  <p className="text-sm font-medium text-slate-600">
                    <span className="font-semibold text-indigo-600">When:</span> {exp.when}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-8 pt-4 border-t border-slate-200 space-y-3">
        <Button primary onClick={() => handleNext(false)} disabled={isCompleteButtonDisabled}>
          {step.nextStepLogic(experiences, onboardingAnswers) ? 'Next' : 'Finish'}
        </Button>
        <Button skip onClick={() => handleNext(true)}>Skip for now</Button>
      </div>
    </div>
  );
};

export default ExperienceBuilderScreen;
