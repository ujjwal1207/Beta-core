import React from 'react';
import { Home, Users, Phone, MessageSquare as ChatIcon, User, UserPlus } from 'lucide-react';

const NavItem = ({ icon: Icon, text, current, setScreen }) => (
  <button
    className={`flex flex-col items-center justify-center p-1 rounded-none transition-colors flex-grow h-full text-xs font-semibold ${
      current 
        ? 'text-indigo-600 font-bold border-b-2 border-indigo-600 bg-indigo-50' 
        : 'text-slate-500 hover:bg-slate-100'
    }`}
    onClick={setScreen}
  >
    <Icon className="w-5 h-5" />
    <span className="text-[11px] mt-1">{text}</span>
  </button>
);

export const TopTabBar = ({ setScreen, currentScreen }) => {
  const navItems = [
    { name: 'Feed', icon: Home, screen: 'FEED' },
    { name: 'People', icon: Users, screen: 'CONNECTIONS_DASHBOARD' },
    { name: 'Calls', icon: Phone, screen: 'CALL_HISTORY' },
    { name: 'Messages', icon: ChatIcon, screen: 'CHAT_HISTORY' },
  ];

  return (
    <header className="absolute top-0 w-full bg-white/80 backdrop-blur-lg shadow-sm z-30 border-b border-slate-200">
      <div className="flex items-center justify-between p-3 h-14">
        <h1 className="text-xl font-extrabold text-violet-600 tracking-tighter">ListenLink</h1>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setScreen('CONNECTION_REQUESTS')}
            className='w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300 hover:bg-slate-300 transition-colors'
            aria-label="Connection requests"
          >
            <UserPlus className="w-4 h-4 text-slate-600" />
          </button>
          <button 
            onClick={() => setScreen('USER_PROFILE')}
            className='w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300 hover:bg-slate-300 transition-colors'
            aria-label="View profile and settings"
          >
            <User className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>
      <nav className="flex justify-around h-16 border-t border-slate-200">
        {navItems.map((item) => (
          <NavItem
            key={item.name}
            icon={item.icon}
            text={item.name}
            current={currentScreen === item.screen}
            setScreen={() => setScreen(item.screen)}
          />
        ))}
      </nav>
    </header>
  );
};

export default TopTabBar;
