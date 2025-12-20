import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader, UserPlus, UserCheck, X, Clock } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import connectionsService from '../../services/connectionsService';

const ConnectionRequestsScreen = () => {
  const { setScreen } = useAppContext();
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState('received'); // 'received' or 'sent'

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const [received, sent] = await Promise.all([
        connectionsService.getReceivedRequests(),
        connectionsService.getSentRequests()
      ]);
      setRequests(received);
      setSentRequests(sent);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    setProcessingIds(prev => new Set([...prev, requestId]));
    try {
      await connectionsService.respondToRequest(requestId, 'accepted');
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleReject = async (requestId) => {
    setProcessingIds(prev => new Set([...prev, requestId]));
    try {
      await connectionsService.respondToRequest(requestId, 'rejected');
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center">
        <button 
          onClick={() => setScreen('FEED')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors mr-3"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Connection Requests</h1>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-white sticky top-0 z-10">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'received'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Received {requests.length > 0 && `(${requests.length})`}
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
              activeTab === 'sent'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sent {sentRequests.length > 0 && `(${sentRequests.length})`}
          </button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : activeTab === 'received' ? (
            requests.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-lg font-semibold text-slate-700 mb-2">No pending requests</p>
                <p className="text-sm text-slate-500">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => {
                  const isProcessing = processingIds.has(request.id);
                  const sender = request.sender || {};
                  
                  return (
                    <div 
                      key={request.id} 
                      className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center"
                    >
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold mr-3 flex-shrink-0">
                        <img 
                          src={`https://i.pravatar.cc/100?u=${sender.id}`} 
                          alt={sender.full_name} 
                          className="w-14 h-14 rounded-full"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-base text-slate-800 truncate">
                          {sender.full_name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-slate-500 truncate">
                          {sender.role || 'No role specified'}
                        </p>
                        {sender.location && (
                          <p className="text-xs text-slate-400 truncate">{sender.location}</p>
                        )}
                      </div>
                      <div className="flex space-x-2 ml-3 flex-shrink-0">
                        <button
                          onClick={() => handleAccept(request.id)}
                          disabled={isProcessing}
                          className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Accept"
                        >
                          {isProcessing ? (
                            <Loader className="w-5 h-5 animate-spin" />
                          ) : (
                            <UserCheck className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={isProcessing}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Reject"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            // Sent Requests Tab
            sentRequests.length === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-lg font-semibold text-slate-700 mb-2">No pending requests</p>
                <p className="text-sm text-slate-500">Start connecting with people!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentRequests.map((request) => {
                  const receiver = request.receiver || {};
                  
                  return (
                    <div 
                      key={request.id} 
                      className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center"
                    >
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xl font-bold mr-3 flex-shrink-0">
                        <img 
                          src={`https://i.pravatar.cc/100?u=${receiver.id}`} 
                          alt={receiver.full_name} 
                          className="w-14 h-14 rounded-full"
                        />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-base text-slate-800 truncate">
                          {receiver.full_name || 'Unknown User'}
                        </p>
                        <p className="text-sm text-slate-500 truncate">
                          {receiver.role || 'No role specified'}
                        </p>
                        <p className="text-xs text-slate-400 truncate flex items-center mt-1">
                          <Clock className="w-3 h-3 mr-1" /> Pending
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionRequestsScreen;
