import React, { useCallback, useEffect } from 'react';
import './App.css';
import { AppProvider, useAppContext } from './context/AppContext';
import { quizFlow } from './data/quizFlow';
import { WelcomePage } from './pages/WelcomePage';
import { AuthForm } from './features/auth/AuthForm';
import { SettingsScreen } from './pages/SettingsScreen';
import CallHistoryScreen from './pages/CallHistoryScreen';
import ChatHistoryScreen from './pages/ChatHistoryScreen';
import MessageDeliveredScreen from './pages/MessageDeliveredScreen';
import FeedScreen from './features/feed/FeedScreen';
import ConnectionsScreen from './features/connections/ConnectionsScreen';
import UserProfileScreen from './features/profile/UserProfileScreen';
import ProfileDetailScreen from './features/profile/ProfileDetailScreen';
import QuizScreen from './features/onboarding/QuizScreen';
import ProfileBuilderScreen from './features/onboarding/ProfileBuilderScreen';
import ExperienceBuilderScreen from './features/onboarding/ExperienceBuilderScreen';
import AddMomentModal from './features/feed/components/AddMomentModal';
import AddReflectionModal from './features/feed/components/AddReflectionModal';
import StoryViewerModal from './features/feed/components/StoryViewerModal';

/**
 * ListenLink App - Modular Architecture
 * 
 * This is the main app component after refactoring from monolithic structure.
 * See REFACTORING_GUIDE.md and FILE_STRUCTURE.md for complete documentation.
 */

const AppContent = () => {
  const { 
    screen, 
    isAddMomentModalOpen, 
    setIsAddMomentModalOpen,
    isAddReflectionModalOpen,
    setIsAddReflectionModalOpen,
    viewingStory,
    setViewingStory
  } = useAppContext();

  const renderScreen = useCallback(() => {
    // Check if current screen is a quiz step
    const quizStep = quizFlow[screen];
    if (quizStep) {
      // Handle different step types
      if (quizStep.type === 'PROFILE_BUILDER') {
        return <ProfileBuilderScreen quizKey={screen} />;
      } else if (quizStep.type === 'EXPERIENCE_BUILDER') {
        return <ExperienceBuilderScreen quizKey={screen} />;
      } else {
        return <QuizScreen quizKey={screen} />;
      }
    }

    // Regular screens
    const screens = {
      WELCOME: <WelcomePage />,
      SIGNUP: <AuthForm isLogin={false} />,
      LOGIN: <AuthForm isLogin={true} />,
      SETTINGS: <SettingsScreen />,
      CALL_HISTORY: <CallHistoryScreen />,
      CHAT_HISTORY: <ChatHistoryScreen />,
      MESSAGE_DELIVERED: <MessageDeliveredScreen />,
      FEED: <FeedScreen />,
      CONNECTIONS_DASHBOARD: <ConnectionsScreen />,
      USER_PROFILE: <UserProfileScreen />,
      PROFILE_DETAIL: <ProfileDetailScreen />,
    };
    
    return screens[screen] || <WelcomePage />;
  }, [screen]);

  return (
    <div className="min-h-screen bg-slate-200 flex justify-center items-center p-0 sm:p-4 font-sans">
      <div className="relative w-full h-screen sm:w-[390px] sm:h-[844px] bg-slate-50 shadow-2xl rounded-none sm:rounded-3xl overflow-hidden flex flex-col">
        <div key={screen} className="w-full h-full flex flex-col screen-fade-in">
          {renderScreen()}
        </div>
      </div>
      
      {/* Modal components */}
      <AddMomentModal 
        isOpen={isAddMomentModalOpen} 
        onClose={() => setIsAddMomentModalOpen(false)} 
      />
      <AddReflectionModal 
        isOpen={isAddReflectionModalOpen} 
        onClose={() => setIsAddReflectionModalOpen(false)} 
      />
      <StoryViewerModal 
        person={viewingStory} 
        onClose={() => setViewingStory(null)} 
      />
    </div>
  );
};

// Style injection component
const StyleInjector = () => {
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @import url('https://rsms.me/inter/inter.css');
      html { font-family: 'Inter', sans-serif; }
      @supports (font-variation-settings: normal) {
        html { font-family: 'Inter var', sans-serif; }
      }
      body { color-scheme: light; }
      .range-slider-fix { width: 100%; }
      .hide-scrollbar::-webkit-scrollbar { display: none; }
      .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      .scroll-snap-x-mandatory { scroll-snap-type: x mandatory; }
      .scroll-snap-align-start { scroll-snap-align: start; }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px) scale(0.99); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .screen-fade-in {
        animation: fadeIn 0.3s ease-out;
      }

      @keyframes pulse-nudge {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.9; }
      }
      .animate-pulse-nudge {
        animation: pulse-nudge 2.5s infinite ease-in-out;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
  
  return null;
};

// Main App with Provider and Styles
const App = () => (
  <>
    <StyleInjector />
    <AppProvider>
      <AppContent />
    </AppProvider>
  </>
);

export default App;
