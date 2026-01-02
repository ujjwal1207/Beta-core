import React from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import Button from '../components/ui/Button';

const MessageDeliveredScreen = () => {
  const { setScreen } = useAppContext();

  return (
    <div className="flex flex-col h-full justify-center items-center text-center p-8 bg-gradient-to-br from-indigo-50 via-white to-green-50 text-slate-800">
      <div className="bg-green-500 p-5 rounded-full mb-6 shadow-lg">
        <CheckCircle className="w-12 h-12 text-white" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Chat request Sent!</h1>
      <p className="text-lg text-slate-500 mb-10">
        Your chat request is on its way. We'll let you know when they accept.
      </p>
      <div className="w-full max-w-sm">
        <Button primary onClick={() => setScreen('CONNECTIONS_DASHBOARD')}>
          <ArrowLeft className="inline-block w-5 h-5 mr-1" /> Back to Connections
        </Button>
      </div>
    </div>
  );
};

export default MessageDeliveredScreen;
