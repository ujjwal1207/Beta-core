import React from 'react';
import { Phone, PhoneOff, Maximize2, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { getAvatarUrlWithSize } from '../../lib/avatarUtils';

/**
 * MinimizedCallWidget - Floating widget shown when call is minimized
 * Allows user to continue using app while in a call
 */
const MinimizedCallWidget = ({ callDuration, isMicOn, isCameraOn, onToggleMic, onToggleCamera, onMaximize, onEndCall }) => {
  const { callRecipient, isVoiceCall } = useAppContext();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!callRecipient) return null;

  const recipientName = callRecipient.full_name || callRecipient.name || 'User';

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[150] animate-in slide-in-from-bottom duration-300">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center gap-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden border-2 border-white/30">
              {!isVoiceCall && callRecipient ? (
                <img 
                  src={getAvatarUrlWithSize(callRecipient, 100)} 
                  alt={recipientName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Phone className="w-6 h-6 text-white" />
              )}
            </div>
            {/* Active call indicator */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{recipientName}</p>
            <p className="text-white/80 text-xs font-mono">{formatTime(callDuration)}</p>
          </div>
          <button
            onClick={onMaximize}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            aria-label="Maximize call"
          >
            <Maximize2 className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-3 bg-slate-50 flex items-center justify-between gap-2">
          <div className="flex gap-2">
            {!isVoiceCall && (
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onToggleCamera) {
                    try {
                      await onToggleCamera();
                    } catch (error) {
                      console.error('Failed to toggle camera:', error);
                    }
                  }
                }}
                className={`p-2.5 rounded-lg transition-colors ${
                  isCameraOn 
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
                aria-label={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
              >
                {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onToggleMic) {
                  try {
                    await onToggleMic();
                  } catch (error) {
                    console.error('Failed to toggle mic:', error);
                  }
                }
              }}
              className={`p-2.5 rounded-lg transition-colors ${
                isMicOn 
                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
              aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
            >
              {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={onEndCall}
            className="p-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            aria-label="End call"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MinimizedCallWidget;

