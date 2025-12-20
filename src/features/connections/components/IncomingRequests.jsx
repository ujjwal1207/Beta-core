import React, { useEffect, useState } from 'react';
import { Check, X, Loader, UserPlus } from 'lucide-react';
import connectionsService from '../../../services/connectionsService';

const IncomingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await connectionsService.getReceivedRequests();
      setRequests(data);
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
      setRequests(prev => prev.filter(r => r.id !== connectionId));
      await connectionsService.respondToRequest(connectionId, status);
    } catch (err) {
      console.error("Failed to respond", err);
      fetchRequests();
    }
  };

  if (loading) return <div className="p-4 text-center text-slate-400"><Loader className="w-5 h-5 animate-spin mx-auto" /></div>;
  if (requests.length === 0) return null;

  return (
    <div className="mx-4 mb-6">
      <div className="flex items-center mb-3">
        <UserPlus className="w-4 h-4 text-indigo-500 mr-2" />
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
          Connection Requests ({requests.length})
        </h3>
      </div>
      <div className="space-y-3">
        {requests.map(req => (
          <div key={req.id} className="bg-white p-3 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-between transition-all hover:shadow-md">
            <div className="flex items-center">
               <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold mr-3">
                 {req.requester_id} 
               </div>
               <div>
                  <p className="font-bold text-slate-800 text-sm">User #{req.requester_id}</p>
                  <p className="text-xs text-slate-500">Wants to connect</p>
               </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleResponse(req.id, 'rejected')}
                className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleResponse(req.id, 'accepted')}
                className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-sm transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IncomingRequests;
