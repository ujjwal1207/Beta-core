import React from 'react';
import { Home, Users, Phone, MessageSquare as ChatIcon, User, UserPlus } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const NavItem = ({ icon: Icon, text, current, setScreen, showBadge = false }) => (
  <button
    className={`flex flex-col items-center justify-center p-2 sm:p-1 rounded-none transition-colors flex-grow h-full text-xs font-semibold min-w-0 relative ${
      current 
        ? 'text-indigo-600 font-bold border-b-2 border-indigo-600 bg-indigo-50' 
        : 'text-slate-500 active:bg-slate-100'
    }`}
    onClick={setScreen}
  >
    <div className="relative">
      <Icon className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
      {showBadge && (
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
      )}
    </div>
    <span className="text-[10px] sm:text-[11px] mt-0.5 sm:mt-1 truncate w-full">{text}</span>
  </button>
);

export const TopTabBar = ({ setScreen, currentScreen }) => {
  const { pendingRequestsCount, unreadMessagesCount } = useAppContext();
  
  const navItems = [
    { name: 'Feed', icon: Home, screen: 'FEED' },
    { name: 'People', icon: Users, screen: 'CONNECTIONS_DASHBOARD' },
    { name: 'Calls', icon: Phone, screen: 'CALL_HISTORY' },
    { name: 'Messages', icon: ChatIcon, screen: 'CHAT_HISTORY', showBadge: unreadMessagesCount > 0 },
  ];

  return (
    <header className="absolute top-0 w-full bg-white/95 backdrop-blur-lg shadow-sm z-30 border-b border-slate-200">
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 h-12 sm:h-14">
        <h1 className="text-lg sm:text-xl font-extrabold text-violet-600 tracking-tighter">ListenLink</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => setScreen('CONNECTION_REQUESTS')}
            className='w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300 active:bg-slate-300 transition-colors relative touch-manipulation'
            aria-label="Connection requests"
          >
            <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
            {pendingRequestsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white"></span>
            )}
          </button>
          <button 
            onClick={() => setScreen('USER_PROFILE')}
            className='w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300 active:bg-slate-300 transition-colors touch-manipulation'
            aria-label="View profile and settings"
          >
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600" />
          </button>
        </div>
      </div>
      <nav className="flex justify-around h-14 sm:h-16 border-t border-slate-200">
        {navItems.map((item) => (
          <NavItem
            key={item.name}
            icon={item.icon}
            text={item.name}
            current={currentScreen === item.screen}
            setScreen={() => setScreen(item.screen)}
            showBadge={item.showBadge || false}
          />
        ))}
      </nav>
    </header>
  );
};

export default TopTabBar;
