import React from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { getAvatarUrlWithSize } from '../../lib/avatarUtils';

/**
 * IncomingCallScreen - Top notification banner for incoming video/voice calls
 */
const IncomingCallScreen = ({ caller, callType, onAccept, onReject }) => {
  const isVideo = callType !== 'voice';
  const callerName = caller?.full_name || caller?.name || 'Unknown User';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Top notification banner */}
      <div className="fixed top-0 left-0 right-0 mx-auto max-w-md px-4 pt-4 animate-in slide-in-from-top duration-500">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 shadow-2xl border border-white/10">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            {/* Caller Avatar */}
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center overflow-hidden ring-4 ring-white/20">
                <img 
                  src={getAvatarUrlWithSize(caller, 100)} 
                  alt={callerName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              </div>
              {/* Pulsing ring animation */}
              <div className="absolute inset-0 rounded-full border-4 border-white/40 animate-ping"></div>
            </div>

            {/* Caller Info */}
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-1">
                {callerName}
              </h3>
              <div className="flex items-center gap-2 text-white/90 text-sm">
                {isVideo ? (
                  <Video className="w-4 h-4" />
                ) : (
                  <Phone className="w-4 h-4" />
                )}
                <span>Incoming {isVideo ? 'video' : 'voice'} call...</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {/* Decline Button */}
            <button
              onClick={onReject}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3.5 px-6 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg"
              aria-label="Decline call"
            >
              <PhoneOff className="w-5 h-5" />
              <span>Decline</span>
            </button>

            {/* Accept Button */}
            <button
              onClick={onAccept}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3.5 px-6 rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg animate-pulse"
              aria-label="Accept call"
            >
              {isVideo ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
              <span>Accept</span>
            </button>
          </div>

          {/* Ringing dots animation */}
          <div className="mt-4 flex justify-center gap-1.5">
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallScreen;
