import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from './Button.jsx';
import callsService from '../../services/callsService';

const IncomingCallNotification = ({ call, onClose, onJoin }) => {
  const { setInVideoCall, setIsVoiceCall, setCallRecipient, setActiveCallChannel, setScheduledCallToken, setScheduledCallUid, setScheduledCallAppId, user } = useAppContext();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinCall = async () => {
    setIsJoining(true);
    try {
      // Check if this is an invitation (has id, caller, receiver) or a scheduled call notification
      if (call.id && call.caller && call.receiver) {
        // This is an invitation - accept it and join the call
        await callsService.updateInvitation(call.id, 'accepted');
        
        // Set call state - use booking credentials if available, otherwise get token dynamically
        setInVideoCall(true);
        setIsVoiceCall(call.call_type === 'voice');
        setActiveCallChannel(call.channel_name);
        
        if (call.booking_id && call.agora_token && call.agora_app_id) {
          // Use pre-generated booking credentials
          setScheduledCallToken(call.agora_token);
          setScheduledCallUid(call.caller_uid);
          setScheduledCallAppId(call.agora_app_id);
        } else {
          // Get Agora token dynamically for regular calls
          const tokenData = await callsService.getAgoraToken(call.channel_name);
          setScheduledCallToken(tokenData.token);
          setScheduledCallUid(tokenData.uid);
          setScheduledCallAppId(tokenData.app_id);
        }
        
        // Set call recipient
        setCallRecipient(call.caller);
      } else {
        // This is a scheduled call notification with pre-stored credentials
        setInVideoCall(true);
        setIsVoiceCall(call.call_type === 'voice');
        setActiveCallChannel(call.agora_channel_name);
        setScheduledCallToken(call.agora_token);
        setScheduledCallUid(call.caller_uid);
        setScheduledCallAppId(call.agora_app_id);
        
        // Set call recipient
        setCallRecipient({
          id: call.booker_id === user?.id ? call.host_id : call.booker_id,
          name: `User ${call.booker_id === user?.id ? call.host_id : call.booker_id}`,
        });
      }
      
      onJoin(call);
      onClose();
    } catch (error) {
      console.error('Failed to join call:', error);
      // TODO: Show error message
    } finally {
      setIsJoining(false);
    }
  };

  const handleDecline = async () => {
    if (call.id && call.caller && call.receiver) {
      // This is an invitation - reject it
      try {
        await callsService.updateInvitation(call.id, 'rejected');
      } catch (error) {
        console.error('Failed to reject invitation:', error);
      }
    }
    onClose();
  };

  // Determine if this is an invitation or scheduled call notification
  const isInvitation = call.id && call.caller && call.receiver;
  const callerName = isInvitation ? call.caller.full_name : (call.host_name || call.booker_name);
  const callTitle = isInvitation ? 'Incoming Call' : 'Incoming Scheduled Call';
  const callMessage = isInvitation 
    ? `${callerName} is calling you`
    : `Your scheduled call with ${callerName} is starting now!`;
  const scheduledTimeText = !isInvitation && call.scheduled_time 
    ? `Scheduled for: ${new Date(call.scheduled_time).toLocaleString()}`
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {callTitle}
            </h3>
            <p className="text-gray-600 mb-4">
              {callMessage}
            </p>
            {scheduledTimeText && (
              <div className="text-sm text-gray-500 mb-6">
                {scheduledTimeText}
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleDecline}
              variant="secondary"
              className="flex-1"
              disabled={isJoining}
            >
              Decline
            </Button>
            <Button
              onClick={handleJoinCall}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isJoining}
            >
              {isJoining ? 'Joining...' : 'Join Call'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallNotification;