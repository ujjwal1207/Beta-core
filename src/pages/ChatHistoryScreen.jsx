import React from 'react';
import { useAppContext } from '../context/AppContext';
import TopTabBar from '../components/layout/TopTabBar';
import { CHAT_HISTORY_DATA } from '../data/mockData';

const ChatHistoryScreen = () => {
  const { setScreen } = useAppContext();

  return (
    <div className="relative flex flex-col h-full bg-slate-50">
      <TopTabBar setScreen={setScreen} currentScreen="CHAT_HISTORY" />
      <div className="flex-grow overflow-y-auto pt-[121px] p-4">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-4">Messages</h1>
        <div className="space-y-3">
          {CHAT_HISTORY_DATA.map(chat => (
            <div key={chat.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center">
              <div className="w-12 h-12 flex-shrink-0 bg-slate-200 rounded-full mr-3 text-slate-700 font-bold flex items-center justify-center text-lg">
                {chat.name[0]}
              </div>
              <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-base text-slate-800">{chat.name}</p>
                <p className="text-sm text-slate-500 truncate">{chat.message}</p>
              </div>
              <div className="text-right ml-2 flex-shrink-0 flex flex-col items-end">
                <p className="text-xs text-slate-400 mb-1">{chat.timestamp}</p>
                {chat.unread > 0 && (
                  <span className="w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatHistoryScreen;
