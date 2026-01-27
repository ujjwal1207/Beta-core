import React from 'react';
import {
  ArrowLeft,
  Bell,
  BellOff,
  MessageSquare,
  Phone,
  Calendar
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const NotificationToggle = ({ icon: Icon, title, description, isEnabled, onToggle }) => (
  <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
    <div className="flex items-center flex-1">
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-4">
        <Icon className={`w-5 h-5 ${isEnabled ? 'text-indigo-600' : 'text-slate-400'}`} />
      </div>
      <div className="flex-1">
        <h3 className={`font-semibold text-base ${isEnabled ? 'text-slate-800' : 'text-slate-500'}`}>
          {title}
        </h3>
        <p className="text-sm text-slate-500 mt-1">{description}</p>
      </div>
    </div>
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        isEnabled ? 'bg-indigo-600' : 'bg-slate-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          isEnabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export const NotificationSettingsScreen = () => {
  const { setScreen, notificationPreferences, setNotificationPreferences } = useAppContext();

  const updateNotification = (key, value) => {
    setNotificationPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    // In a real app, you would save this to the backend
    console.log(`Updated ${key} to ${value}`);
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-50">
      <div className="p-4 pt-6">
        <button
          onClick={() => setScreen('SETTINGS')}
          className="p-2 rounded-full hover:bg-slate-200 mb-2"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Notifications</h1>
        <p className="text-slate-600 mb-6">Manage your notification preferences</p>
      </div>

      <div className="flex-grow overflow-y-auto px-4 space-y-4">
        <NotificationToggle
          icon={MessageSquare}
          title="Message Notifications"
          description="Show red dot for unread messages"
          isEnabled={notificationPreferences.messageNotifications}
          onToggle={() => updateNotification('messageNotifications', !notificationPreferences.messageNotifications)}
        />

        <NotificationToggle
          icon={Phone}
          title="Call Notifications"
          description="Receive notifications for incoming calls"
          isEnabled={notificationPreferences.callNotifications}
          onToggle={() => updateNotification('callNotifications', !notificationPreferences.callNotifications)}
        />

        <NotificationToggle
          icon={Calendar}
          title="Scheduled Call Requests"
          description="Show red dot for pending call booking requests"
          isEnabled={notificationPreferences.scheduledCallNotifications}
          onToggle={() => updateNotification('scheduledCallNotifications', !notificationPreferences.scheduledCallNotifications)}
        />

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
          <div className="flex items-start">
            <Bell className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">About Notifications</h3>
              <p className="text-sm text-blue-700">
                When disabled, you'll still receive the notifications but won't see visual indicators like red dots in the app.
                You can re-enable them anytime from this settings page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};