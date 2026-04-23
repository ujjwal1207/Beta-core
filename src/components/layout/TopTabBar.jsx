import React from 'react';
import { Home, Users, Phone, MessageSquare as ChatIcon, User, BarChart3, Bell } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

/* ── Bottom nav item ─────────────────────────────────── */
const BottomNavItem = ({ icon: Icon, text, current, onClick, showBadge = false, badgeColor = 'red' }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center justify-center flex-1 h-full relative touch-manipulation"
    aria-current={current ? 'page' : undefined}
  >
    {/* Active pill */}
    <div
      className={`flex items-center justify-center rounded-full transition-all duration-200 mb-0.5 ${
        current
          ? 'bg-indigo-100 px-4 py-1.5'
          : 'px-4 py-1.5'
      }`}
    >
      <div className="relative">
        <Icon
          className={`w-5 h-5 transition-colors duration-200 ${
            current ? 'text-indigo-600' : 'text-slate-500'
          }`}
          strokeWidth={current ? 2.2 : 1.8}
        />
        {showBadge && (
          <span
            className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
              badgeColor === 'green' ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
        )}
      </div>
    </div>
    <span
      className={`text-[10px] font-semibold leading-none transition-colors duration-200 ${
        current ? 'text-indigo-600' : 'text-slate-400'
      }`}
    >
      {text}
    </span>
  </button>
);

/* ── Main export ─────────────────────────────────────── */
export const TopTabBar = ({ setScreen, currentScreen }) => {
  const {
    pendingRequestsCount,
    unreadMessagesCount,
    pendingCallRequestsCount,
    notificationPreferences,
    user,
    unreadNotificationsCount,
    hasLiveCall,
  } = useAppContext();

  const navItems = [
    { name: 'Feed',     icon: Home,    screen: 'FEED' },
    { name: 'People',   icon: Users,   screen: 'CONNECTIONS_DASHBOARD' },
    {
      name: 'Calls',
      icon: Phone,
      screen: 'CALL_HISTORY',
      showBadge: hasLiveCall || (notificationPreferences.scheduledCallNotifications && pendingCallRequestsCount > 0),
      badgeColor: hasLiveCall ? 'green' : 'red',
    },
    {
      name: 'Messages',
      icon: ChatIcon,
      screen: 'CHAT_HISTORY',
      showBadge: notificationPreferences.messageNotifications && unreadMessagesCount > 0,
    },
  ];

  return (
    <>
      {/* ── Slim top bar (logo + utility icons) ─────── */}
      <header className="absolute top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-lg border-b border-slate-200 z-30 flex items-center justify-between px-3 sm:px-4">
        <img src="listenlinklogo.png" alt="ListenLink" className="h-8 sm:h-9 w-auto" />

        <div className="flex items-center gap-2">
          {user?.is_super_linker && (
            <button
              onClick={() => setScreen('SUPER_LISTENER_DASHBOARD')}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 active:bg-indigo-200 transition-colors touch-manipulation"
              aria-label="Super Listener Dashboard"
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" />
            </button>
          )}
          <button
            onClick={() => setScreen('NOTIFICATIONS')}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 active:bg-slate-200 transition-colors relative touch-manipulation"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-600" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
            )}
          </button>
          <button
            onClick={() => setScreen('USER_PROFILE')}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 active:bg-slate-200 transition-colors touch-manipulation"
            aria-label="View profile and settings"
          >
            <User className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </header>

      {/* ── Bottom nav bar ───────────────────────────── */}
      <nav
        className="absolute bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-lg border-t border-slate-200 z-30 flex items-center"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {navItems.map((item) => (
          <BottomNavItem
            key={item.name}
            icon={item.icon}
            text={item.name}
            current={currentScreen === item.screen}
            onClick={() => setScreen(item.screen)}
            showBadge={item.showBadge || false}
            badgeColor={item.badgeColor}
          />
        ))}
      </nav>
    </>
  );
};

export default TopTabBar;
