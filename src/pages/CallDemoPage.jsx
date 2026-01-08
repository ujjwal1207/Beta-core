import { useState } from 'react';
import { VideoCallScreen } from '../features/calls';
import { Phone } from 'lucide-react';

/**
 * Example page showing how to use the VideoCallScreen component
 */
const CallDemoPage = () => {
  const [inCall, setInCall] = useState(false);
  const [recipientId, setRecipientId] = useState('');

  const startCall = () => {
    if (recipientId) {
      setInCall(true);
    }
  };

  const endCall = () => {
    setInCall(false);
    setRecipientId('');
  };

  if (inCall) {
    return (
      <VideoCallScreen 
        recipientUserId={parseInt(recipientId)} 
        onCallEnd={endCall}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Start a Video Call
        </h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient User ID
            </label>
            <input
              type="number"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              placeholder="Enter user ID to call"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={startCall}
            disabled={!recipientId}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Phone className="w-5 h-5" />
            Start Call
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> Make sure you have the correct Agora App Certificate 
            configured in your backend .env file for the call to work.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CallDemoPage;
