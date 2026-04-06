import React from 'react';
import { X, ChevronRight, Zap, CheckCircle } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';

const FeedJourneyCard = ({ onboardingAnswers, setScreen, onClose, dismissible = true, onContinue }) => {
  const { user } = useAppContext();

  const hasText = (value) => String(value || '').trim().length > 0;
  const educationList = Array.isArray(user?.education) ? user.education : [];
  const hasEducation = educationList.some((item) => hasText(item?.name));
  const hasFocus = hasText(user?.industry);
  const hasLookingFor = hasText(user?.exploring || onboardingAnswers?.LOOKING_FOR);

  const steps = [
    { key: 'education', label: 'Education', completed: hasEducation },
    { key: 'focus', label: 'Current Focus / Industry', completed: hasFocus },
    { key: 'looking_for', label: 'Looking For', completed: hasLookingFor },
  ];

  const completedSteps = steps.filter((step) => step.completed).length;
  const percentage = Math.round((completedSteps / steps.length) * 100);
  const isComplete = percentage >= 100;
  const handleContinue = () => {
    if (typeof onContinue === 'function') {
      onContinue({ isComplete, percentage, completedSteps, totalSteps: steps.length });
      return;
    }
    setScreen('USER_PROFILE');
  };

  return (
    <div className="bg-linear-to-br from-indigo-600 to-purple-700 rounded-xl p-5 mb-6 text-white shadow-lg relative overflow-hidden transform transition-all hover:scale-[1.01]">
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
              {isComplete ? 'Update your answers anytime.' : '3 quick steps: Education, Focus, Looking For.'}
            </p>
          </div>
        </div>

        <div className="w-full bg-black/20 h-2.5 rounded-full mb-4 backdrop-blur-sm shadow-inner overflow-hidden">
          <div 
            className="bg-linear-to-r from-yellow-300 to-amber-400 h-2.5 rounded-full transition-all duration-1000 ease-out shadow-sm relative"
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
            onClick={handleContinue}
            className="bg-white text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-50 active:scale-95 transition-all shadow-md flex items-center group"
          >
            {isComplete ? 'Edit Journey' : 'Continue'} <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-1.5">
          {steps.map((step) => (
            <div key={step.key} className="flex items-center gap-2 text-xs text-indigo-100/95">
              <CheckCircle className={`w-3.5 h-3.5 ${step.completed ? 'text-emerald-300' : 'text-indigo-200/80'}`} />
              <span className={step.completed ? 'font-semibold' : 'font-medium opacity-80'}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeedJourneyCard;
