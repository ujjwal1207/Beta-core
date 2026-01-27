import React from 'react';
import { Mic, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAppContext } from '../context/AppContext';

export const WelcomePage = () => {
  const { setScreen } = useAppContext();

  return (
    <div className="flex flex-col h-full justify-between items-center text-center p-8 bg-gradient-to-br from-indigo-50 via-white to-violet-50 text-slate-800">
      <div className="flex-grow flex flex-col justify-center items-center">
        <div className="mb-6">
          <img src="/Coloured.png" alt="ListenLink Logo" className="w-40 h-40" />
        </div>
        <p className="text-lg mb-10 text-slate-500">Listen, Share, Connect</p>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 px-4">
          Connect with people who understand your journey.
        </h2>
      </div>
      <div className="w-full max-w-sm">
        <Button primary onClick={() => setScreen('SIGNUP')}>
          Let's Get Started <ChevronRight className="inline-block w-5 h-5 ml-1" />
        </Button>
        <p className="mt-4 text-sm text-slate-600">
          Already here?{' '}
          <button 
            onClick={() => setScreen('LOGIN')} 
            className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  );
};
