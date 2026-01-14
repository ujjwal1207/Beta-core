import React, { useEffect, useState } from 'react';
import { Check, X, Loader, UserPlus } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import connectionsService from '../../../services/connectionsService';
import { getAvatarUrlWithSize } from '../../../lib/avatarUtils';

const IncomingRequests = () => {
  const { setScreen, setSelectedPerson, setPreviousScreen, setPendingRequestsCount } = useAppContext();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await connectionsService.getReceivedRequests();
      setRequests(data);
      setPendingRequestsCount(data.length); // Update context count
    } catch (err) {
      console.error("Failed to load requests", err);
      // Fail silently or show toast in a real app
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleResponse = async (connectionId, status) => {
    try {
      // Optimistic update
      const newRequests = requests.filter(r => r.id !== connectionId);
      setRequests(newRequests);
      setPendingRequestsCount(newRequests.length); // Update context count immediately
      await connectionsService.respondToRequest(connectionId, status);
    } catch (err) {
      console.error("Failed to respond", err);
      fetchRequests();
    }
  };

  if (loading) return <div className="p-4 text-center text-slate-400"><Loader className="w-5 h-5 animate-spin mx-auto" /></div>;
  if (requests.length === 0) return null;

  const handleViewProfile = (sender) => {
    setPreviousScreen('CONNECTIONS_DASHBOARD');
    setSelectedPerson(sender);
    setScreen('PROFILE_DETAIL');
  };

  return (
    <div className="mx-3 sm:mx-4 mb-4 sm:mb-6">
      <div className="flex items-center mb-2 sm:mb-3">
        <UserPlus className="w-4 h-4 text-indigo-500 mr-2" />
        <h3 className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
          Connection Requests ({requests.length})
        </h3>
      </div>
      <div className="space-y-2 sm:space-y-3">
        {requests.map(req => {
          const sender = req.sender;
          if (!sender) return null;
          
          return (
            <div key={req.id} className="bg-white p-2.5 sm:p-3 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-between transition-all active:shadow-md touch-manipulation">
              <button 
                onClick={() => handleViewProfile(sender)}
                className="flex items-center flex-1 text-left min-w-0 touch-manipulation"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden mr-2 sm:mr-3 flex-shrink-0">
                  <img 
                    src={getAvatarUrlWithSize(sender, 100)} 
                    alt={sender.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-800 text-sm truncate active:underline">{sender.full_name}</p>
                  <p className="text-xs text-slate-500 truncate">{sender.role || 'Wants to connect'}</p>
                </div>
              </button>
              <div className="flex gap-1.5 sm:gap-2 ml-2 flex-shrink-0">
                <button 
                  onClick={() => handleResponse(req.id, 'rejected')}
                  className="p-2 sm:p-2.5 bg-slate-50 text-slate-400 rounded-full active:bg-slate-100 active:text-slate-600 transition-colors touch-manipulation"
                >
                  <X className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleResponse(req.id, 'accepted')}
                  className="p-2 sm:p-2.5 bg-indigo-600 text-white rounded-full active:bg-indigo-700 shadow-sm transition-colors touch-manipulation"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IncomingRequests;
