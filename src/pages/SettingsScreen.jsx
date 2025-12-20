import React from 'react';
import { 
  ArrowLeft, 
  User, 
  Bell, 
  Lock, 
  HelpCircle, 
  Mail, 
  LogOut, 
  ChevronRight 
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const SettingItem = ({ icon: Icon, text, hasArrow = true, color = 'text-slate-600', onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center w-full p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-colors ${color}`}
  >
    <Icon className={`w-5 h-5 mr-4 ${color}`} />
    <span className={`font-semibold text-base ${color} flex-grow text-left`}>{text}</span>
    {hasArrow && <ChevronRight className="w-5 h-5 text-slate-400" />}
  </button>
);

export const SettingsScreen = () => {
  const { setScreen, logout } = useAppContext();
  
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  return (
    <div className="relative flex flex-col h-full bg-slate-50">
      <div className="p-4 pt-6">
        <button 
          onClick={() => setScreen('USER_PROFILE')} 
          className="p-2 rounded-full hover:bg-slate-200 mb-2"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-6">Settings</h1>
      </div>
      
      <div className="flex-grow overflow-y-auto px-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-2">Account</h3>
        <SettingItem 
          icon={User} 
          text="Edit Profile" 
          onClick={() => setScreen('USER_PROFILE')}
        />
        <SettingItem 
          icon={Bell} 
          text="Notifications" 
          onClick={() => console.log('Notifications clicked')}
        />
        <SettingItem 
          icon={Lock} 
          text="Privacy & Security" 
          onClick={() => console.log('Privacy clicked')}
        />
        
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-2 pt-4">Support</h3>
        <SettingItem 
          icon={HelpCircle} 
          text="Help Center" 
          onClick={() => console.log('Help clicked')}
        />
        <SettingItem 
          icon={Mail} 
          text="Contact Us" 
          onClick={() => console.log('Contact clicked')}
        />
        
        <div className="pt-4">
          <SettingItem 
            icon={LogOut} 
            text="Log Out" 
            hasArrow={false} 
            color="text-rose-500"
            onClick={handleLogout}
          />
        </div>
      </div>
      
      <div className="p-4 text-center text-xs text-slate-400">
        Version 1.0.0
      </div>
    </div>
  );
};
