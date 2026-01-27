import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import { X } from 'lucide-react';
import { AppProvider, useAppContext } from './context/AppContext';
import { quizFlow } from './data/quizFlow';
import { WelcomePage } from './pages/WelcomePage';
import { AuthForm } from './features/auth/AuthForm';
import { SettingsScreen } from './pages/SettingsScreen';
import { NotificationSettingsScreen } from './pages/NotificationSettingsScreen';
import PrivacySecurityScreen from './pages/PrivacySecurityScreen';
import BlockedUsersScreen from './pages/BlockedUsersScreen';
import ContactUsScreen from './pages/ContactUsScreen';
import HelpCenterScreen from './pages/HelpCenterScreen';
import CallHistoryScreen from './pages/CallHistoryScreen';
import ChatHistoryScreen from './pages/ChatHistoryScreen';
import FeedScreen from './features/feed/FeedScreen';
import ConnectionsScreen from './features/connections/ConnectionsScreen';
import MyConnectionsScreen from './features/connections/MyConnectionsScreen';
import ConnectionRequestsScreen from './features/connections/ConnectionRequestsScreen';
import ChatRoomScreen from './features/chat/ChatRoomScreen';
import PostShareScreen from './features/chat/PostShareScreen';
import UserProfileScreen from './features/profile/UserProfileScreen';
import ProfileDetailScreen from './features/profile/ProfileDetailScreen';
import QuizScreen from './features/onboarding/QuizScreen';
import ProfileBuilderScreen from './features/onboarding/ProfileBuilderScreen';
import ExperienceBuilderScreen from './features/onboarding/ExperienceBuilderScreen';
import AddMomentModal from './features/feed/components/AddMomentModal';
import AddReflectionModal from './features/feed/components/AddReflectionModal';
import StoryViewerModal from './features/feed/components/StoryViewerModal';
import { VideoCallScreen } from './features/calls';
import MinimizedCallWidget from './features/calls/MinimizedCallWidget';
import IncomingCallScreen from './features/calls/IncomingCallScreen';
import callsService from './services/callsService';
import chatService from './services/chatService';

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
    setViewingStory,
    inVideoCall,
    setInVideoCall,
    callRecipient,
    setCallRecipient,
    incomingCall,
    setIncomingCall,
    activeCallChannel,
    setActiveCallChannel,
    callDeclined,
    outgoingInvitation,
    setOutgoingInvitation,
    isVoiceCall,
    setIsVoiceCall,
    isCallMinimized,
    setIsCallMinimized,
    callState,
    callControls,
    toast,
    setToast
  } = useAppContext();

  // Local state to track current call invitation ID
  const [currentCallInvitationId, setCurrentCallInvitationId] = useState(null);
  // Track if outgoing call has been answered
  const [outgoingCallAnswered, setOutgoingCallAnswered] = useState(false);

  // Listen for outgoing call answered events
  useEffect(() => {
    const handleOutgoingCallAnswered = () => {
      console.log('Outgoing call was answered');
      setOutgoingCallAnswered(true);
    };

    window.addEventListener('outgoingCallAnswered', handleOutgoingCallAnswered);
    return () => window.removeEventListener('outgoingCallAnswered', handleOutgoingCallAnswered);
  }, []);

  // Callback to refresh feed after post creation
  const handlePostCreated = () => {
    // Trigger a custom event that FeedScreen can listen to
    window.dispatchEvent(new CustomEvent('postCreated'));
  };

  const handleCallEnd = useCallback(async (duration = 0) => {
    // Update call invitation status
    try {
      // Check if this is an outgoing call that was manually ended before being answered
      const isUnansweredOutgoingCall = outgoingInvitation && !outgoingCallAnswered;
      const status = (duration > 0 && !isUnansweredOutgoingCall) ? 'completed' : 'missed';
      const callEndTime = Math.floor(Date.now() / 1000); // Current Unix timestamp
      
      // Update outgoing invitation
      if (outgoingInvitation && outgoingInvitation.id) {
        await callsService.updateInvitation(outgoingInvitation.id, status, callEndTime);
      }
      // Update current call invitation (for accepted incoming calls)
      else if (currentCallInvitationId) {
        await callsService.updateInvitation(currentCallInvitationId, status, callEndTime);
      }
      // Update incoming call if not answered
      else if (incomingCall && incomingCall.id) {
        await callsService.updateInvitation(incomingCall.id, 'missed', callEndTime);
      }
    } catch (error) {
      console.error('Failed to update call status:', error);
    }

    // Log call duration if it was a valid call (duration > 0) or missed call
    // Only the caller sends the log message to avoid duplicates
    if (callRecipient) {
      try {
        // Check if this is an outgoing call that was manually ended before being answered
        const isUnansweredOutgoingCall = outgoingInvitation && !outgoingCallAnswered;
        
        if (duration > 0 && !isUnansweredOutgoingCall) {
          const mins = Math.floor(duration / 60);
          const secs = duration % 60;
          const timeString = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
          const typeStr = isVoiceCall ? 'VOICE' : 'VIDEO';
          
          // Send a system message with call log
          await chatService.sendMessage(callRecipient.id, `[CALL_LOG] ${typeStr} ${timeString}`);
        } else {
          // Send missed call log for timed out calls or manually ended unanswered calls
          const typeStr = isVoiceCall ? 'MISSED_VOICE' : 'MISSED_VIDEO';
          await chatService.sendMessage(callRecipient.id, `[CALL_LOG] ${typeStr}`);
        }
      } catch (error) {
        console.error('Failed to log call:', error);
      }
    }
    
    setInVideoCall(false);
    setIsVoiceCall(false); // Reset voice call mode
    setCallRecipient(null);
    setOutgoingInvitation(null); // Clear outgoing invitation
    setIncomingCall(null); // Clear incoming call
    setCurrentCallInvitationId(null); // Clear current call invitation ID
    setOutgoingCallAnswered(false); // Reset answered state
    setIsCallMinimized(false); // Reset minimized state
    
    // Notify components to refresh call history
    window.dispatchEvent(new CustomEvent('callEnded'));
  }, [setInVideoCall, setCallRecipient, callRecipient, outgoingInvitation, currentCallInvitationId, incomingCall, setOutgoingInvitation, setIncomingCall, setCurrentCallInvitationId, setIsVoiceCall, isVoiceCall, setIsCallMinimized]);
  const handleAcceptCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      // Accept the invitation
      await callsService.updateInvitation(incomingCall.id, 'accepted');

      // Store the invitation ID for later status updates
      setCurrentCallInvitationId(incomingCall.id);

      // Set call recipient and start call
      setCallRecipient(incomingCall.caller);
      setActiveCallChannel(incomingCall.channel_name);

      // Determine if it's a voice call
      const isVoice = incomingCall.call_type === 'voice';
      setIsVoiceCall(isVoice);

      setIncomingCall(null);
      setInVideoCall(true);
    } catch (error) {
      console.error('Failed to accept call:', error);
      setIncomingCall(null);
    }
  }, [incomingCall, setIncomingCall, setInVideoCall, setCallRecipient, setActiveCallChannel, setIsVoiceCall, setCurrentCallInvitationId]);

  const handleRejectCall = useCallback(async () => {
    if (!incomingCall) return;

    try {
      // Reject the invitation
      await callsService.updateInvitation(incomingCall.id, 'rejected');

      // Log the missed call
      const typeStr = incomingCall.call_type === 'voice' ? 'MISSED_VOICE' : 'MISSED_VIDEO';
      if (incomingCall.caller) {
         await chatService.sendMessage(incomingCall.caller.id, `[CALL_LOG] ${typeStr}`);
      }

      setIncomingCall(null);
    } catch (error) {
      console.error('Failed to reject call:', error);
      setIncomingCall(null);
    }
  }, [incomingCall, setIncomingCall]);

  // Auto-disconnect outgoing calls after 30 seconds if not answered
  useEffect(() => {
    let timeoutId = null;

    // Only set timeout for outgoing calls that haven't been answered yet
    if (outgoingInvitation && inVideoCall && !outgoingCallAnswered) {
      timeoutId = setTimeout(() => {
        console.log('Outgoing call timed out after 30 seconds, marking as missed');
        handleCallEnd(0); // 0 duration = missed call
      }, 30000); // 30 seconds
    }

    // Clear timeout if call is answered or call ends
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [outgoingInvitation, inVideoCall, outgoingCallAnswered, handleCallEnd]);

  // IMPORTANT: Define all hooks BEFORE any conditional returns
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
      NOTIFICATION_SETTINGS: <NotificationSettingsScreen />,
      PRIVACY_SECURITY: <PrivacySecurityScreen />,
      BLOCKED_USERS: <BlockedUsersScreen />,
      CONTACT_US: <ContactUsScreen />,
      HELP_CENTER: <HelpCenterScreen />,
      CALL_HISTORY: <CallHistoryScreen />,
      CHAT_HISTORY: <ChatHistoryScreen />,
      FEED: <FeedScreen />,
      CONNECTIONS_DASHBOARD: <ConnectionsScreen />,
      MY_CONNECTIONS: <MyConnectionsScreen />,
      CONNECTION_REQUESTS: <ConnectionRequestsScreen />,
      CHAT_ROOM: <ChatRoomScreen />,
      POST_SHARE: <PostShareScreen />,
      USER_PROFILE: <UserProfileScreen />,
      PROFILE_DETAIL: <ProfileDetailScreen />,
    };

    return screens[screen] || <WelcomePage />;
  }, [screen]);

  // Show incoming call screen if there's an incoming call
  if (incomingCall && !inVideoCall) {
    return (
      <IncomingCallScreen
        caller={incomingCall.caller}
        callType={incomingCall.call_type}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
    );
  }

  // If in video call, show video call screen (full screen if not minimized)
  if (inVideoCall && callRecipient) {
    return (
      <>
        {/* Always render VideoCallScreen - keep it fully mounted and active, just position it off-screen when minimized */}
        <div
          className={isCallMinimized ? "fixed" : "relative w-full h-full"}
          style={isCallMinimized ? {
            top: '-9999px',
            left: '-9999px',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: -1
          } : {}}
        >
          <VideoCallScreen
            key={`call-${callRecipient.id}`}
            recipientUser={callRecipient}
            channelName={activeCallChannel}
            onCallEnd={handleCallEnd}
          />

          {/* Call Declined Notification Overlay */}
          {callDeclined && !isCallMinimized && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl transform scale-100 animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Call Declined</h3>
                <p className="text-slate-400 mb-6">
                  {callRecipient.full_name || callRecipient.name} is not available right now.
                </p>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
                  <div className="bg-slate-800 h-1.5 rounded-full animate-[width_3s_linear_forwards]" style={{ width: '0%' }}></div>
                </div>
                <p className="text-xs text-slate-500">Returning to chat...</p>
              </div>
            </div>
          )}
        </div>

        {/* Show normal app UI when minimized - overlay on top */}
        {isCallMinimized && (
          <div className="min-h-screen bg-slate-200 flex justify-center items-center p-0 sm:p-4 font-sans relative z-10">
            <div className="relative w-full h-screen sm:w-[390px] sm:h-[844px] bg-slate-50 shadow-2xl rounded-none sm:rounded-3xl overflow-hidden flex flex-col">
              <div key={screen} className="w-full h-full flex flex-col screen-fade-in">
                {renderScreen()}
              </div>
            </div>

            {/* Minimized Call Widget */}
            <MinimizedCallWidget
              callDuration={callState.duration}
              isMicOn={callState.isMicOn}
              isCameraOn={callState.isCameraOn}
              onToggleMic={async () => {
                if (callControls?.toggleMic) {
                  await callControls.toggleMic();
                }
              }}
              onToggleCamera={async () => {
                if (callControls?.toggleCamera) {
                  await callControls.toggleCamera();
                }
              }}
              onMaximize={() => {
                if (callControls?.maximizeCall) {
                  callControls.maximizeCall();
                }
              }}
              onEndCall={() => {
                if (callControls?.endCall) {
                  callControls.endCall();
                }
              }}
            />

            {/* Modal components */}
            <AddMomentModal
              isOpen={isAddMomentModalOpen}
              onClose={() => setIsAddMomentModalOpen(false)}
              onPostCreated={handlePostCreated}
            />
            <AddReflectionModal
              isOpen={isAddReflectionModalOpen}
              onClose={() => setIsAddReflectionModalOpen(false)}
              onPostCreated={handlePostCreated}
            />
            <StoryViewerModal
              person={viewingStory}
              onClose={() => setViewingStory(null)}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-200 flex justify-center items-center p-0 sm:p-4 font-sans">
      {/* Global Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full mx-4">
          <div className={`flex items-center p-4 rounded-lg shadow-lg ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : toast.type === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white'
          }`}>
            <div className="flex-1">{toast.message}</div>
            <button
              onClick={() => setToast(null)}
              className="ml-4 hover:opacity-75"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="relative w-full h-screen sm:w-[390px] sm:h-[844px] bg-slate-50 shadow-2xl rounded-none sm:rounded-3xl overflow-hidden flex flex-col">
        <div key={screen} className="w-full h-full flex flex-col screen-fade-in">
          {renderScreen()}
        </div>
      </div>

      {/* Modal components */}
      <AddMomentModal
        isOpen={isAddMomentModalOpen}
        onClose={() => setIsAddMomentModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
      <AddReflectionModal
        isOpen={isAddReflectionModalOpen}
        onClose={() => setIsAddReflectionModalOpen(false)}
        onPostCreated={handlePostCreated}
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
    // Inject Inter font and custom styles
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