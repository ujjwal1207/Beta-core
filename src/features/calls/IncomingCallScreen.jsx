import React from 'react';
import { Phone, PhoneOff, Video, X } from 'lucide-react';
import { getAvatarColor } from '../../lib/avatarUtils';

/**
 * IncomingCallScreen - Modal for incoming video/voice calls
 */
const IncomingCallScreen = ({ caller, callType, onAccept, onReject }) => {
  const avatarColor = caller?.id ? getAvatarColor(caller.id) : '#666';
  const isVideo = callType !== 'voice';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 transition-opacity duration-300">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-400 ease-out">
        {/* Caller Info */}
        <div className="text-center mb-8">
          <div 
            className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl font-bold border-4 border-indigo-50"
            style={{ backgroundColor: avatarColor }}
          >
            {caller?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            {caller?.name || 'Unknown User'}
          </h2>
          <div className="flex items-center justify-center gap-2 text-gray-500 font-medium">
            {isVideo ? (
              <Video className="w-5 h-5 text-indigo-500" />
            ) : (
              <Phone className="w-5 h-5 text-green-500" />
            )}
            <span>Incoming {isVideo ? 'video' : 'voice'} call...</span>
          </div>
        </div>

        {/* Call Actions */}
        <div className="flex justify-center gap-8">
          {/* Reject Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onReject}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-all hover:scale-110 active:scale-95"
              aria-label="Reject call"
            >
              <PhoneOff size={28} strokeWidth={2.5} />
            </button>
            <span className="text-xs font-medium text-gray-400">Decline</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onAccept}
              className={`w-16 h-16 rounded-full ${isVideo ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-green-500 hover:bg-green-600'} flex items-center justify-center text-white shadow-lg transition-all hover:scale-110 active:scale-95 animate-pulse`}
              aria-label="Accept call"
            >
              {isVideo ? <Video size={28} strokeWidth={2.5} /> : <Phone size={28} strokeWidth={2.5} />}
            </button>
            <span className="text-xs font-medium text-gray-400">Accept</span>
          </div>
        </div>

        {/* Ringing Animation */}
        <div className="mt-6 flex justify-center">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallScreen;
