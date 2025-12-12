import React from 'react';
import { ArrowLeft, PhoneOutgoing, PhoneIncoming, PhoneMissed, Phone } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import TopTabBar from '../components/layout/TopTabBar';
import { CALL_HISTORY_DATA } from '../data/mockData';

const CallHistoryScreen = () => {
  const { setScreen } = useAppContext();

  const getCallIcon = (type) => {
    switch (type) {
      case 'outgoing': return <PhoneOutgoing className="w-5 h-5 text-blue-500" />;
      case 'incoming': return <PhoneIncoming className="w-5 h-5 text-green-500" />;
      case 'missed': return <PhoneMissed className="w-5 h-5 text-red-500" />;
      default: return <Phone className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-50">
      <TopTabBar setScreen={setScreen} currentScreen="CALL_HISTORY" />
      <div className="flex-grow overflow-y-auto pt-[121px] p-4">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-4">Call History</h1>
        <div className="space-y-3">
          {CALL_HISTORY_DATA.map(call => (
            <div key={call.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center">
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-100 rounded-full mr-4">
                {getCallIcon(call.type)}
              </div>
              <div className="flex-grow">
                <p className="font-semibold text-base text-slate-800">{call.name}</p>
                <p className="text-sm text-slate-500">{call.date}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${call.type === 'missed' ? 'text-red-500' : 'text-slate-500'}`}>
                  {call.duration || call.type.charAt(0).toUpperCase() + call.type.slice(1)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CallHistoryScreen;
