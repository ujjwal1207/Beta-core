import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, PhoneOutgoing, PhoneIncoming, PhoneMissed, Phone, Loader, Video, Trash2, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import TopTabBar from '../components/layout/TopTabBar';
import callsService from '../services/callsService';

const CallHistoryScreen = () => {
  const { 
    setScreen, 
    user,
    setInVideoCall,
    setIsVoiceCall,
    setCallRecipient,
    setOutgoingInvitation,
    setActiveCallChannel
  } = useAppContext();
  const [calls, setCalls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    // Close modal when clicking outside
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setSelectedCall(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchCallHistory = async () => {
      try {
        const history = await callsService.getCallHistory();
        setCalls(history);
      } catch (error) {
        console.error('Failed to fetch call history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchCallHistory();
    }
  }, [user]);

  const getCallType = (call) => {
    if (!user) return 'unknown';
    
    // If I am the receiver and status is missed/rejected -> missed
    if (call.receiver_id === user.id && (call.status === 'missed' || call.status === 'rejected')) {
      return 'missed';
    }
    
    // If I am the caller -> outgoing
    if (call.caller_id === user.id) {
      return 'outgoing';
    }
    
    // If I am the receiver and accepted -> incoming
    if (call.receiver_id === user.id) {
      return 'incoming';
    }
    
    return 'unknown';
  };

  const getCallIcon = (type) => {
    switch (type) {
      case 'outgoing': return <PhoneOutgoing className="w-5 h-5 text-blue-500" />;
      case 'incoming': return <PhoneIncoming className="w-5 h-5 text-green-500" />;
      case 'missed': return <PhoneMissed className="w-5 h-5 text-red-500" />;
      default: return <Phone className="w-5 h-5 text-slate-400" />;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Less than 24 hours
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Less than 7 days
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Older
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getOtherParty = (call) => {
    if (!user) return null;
    return call.caller_id === user.id ? call.receiver : call.caller;
  };

  const getOtherPartyName = (call) => {
    const party = getOtherParty(call);
    return party ? (party.full_name || party.name) : 'Unknown User';
  };

  const handleStartCall = async (type) => { // 'voice' or 'video'
    if (!selectedCall) return;
    
    const recipient = getOtherParty(selectedCall);
    if (!recipient) return;
    
    try {
      setSelectedCall(null); // Close modal
      setIsVoiceCall(type === 'voice');
      
      const invitation = await callsService.sendCallInvitation(recipient.id, type);
      
      // Setup call state
      setOutgoingInvitation(invitation);
      setCallRecipient(recipient);
      setActiveCallChannel(invitation.channel_name);
      setInVideoCall(true);
    } catch (error) {
      console.error('Failed to start call:', error);
    }
  };

  const handleDeleteLog = async () => {
    if (!selectedCall) return;
    
    // Optimistic update
    const previousCalls = [...calls];
    setCalls(prev => prev.filter(c => c.id !== selectedCall.id));
    setSelectedCall(null);
    
    try {
        await callsService.deleteCallLog(selectedCall.id);
    } catch (error) {
        console.error('Failed to delete log:', error);
        // Revert on failure
        setCalls(previousCalls);
    }
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-50">
      <TopTabBar setScreen={setScreen} currentScreen="CALL_HISTORY" />
      <div className="flex-grow overflow-y-auto pt-[121px] p-4">
        <h1 className="text-3xl font-extrabold text-slate-800 mb-4">Call History</h1>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : calls.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>No recent calls</p>
          </div>
        ) : (
          <div className="space-y-3">
            {calls.map(call => {
              const type = getCallType(call);
              return (
                <div 
                  key={call.id} 
                  onClick={() => setSelectedCall(call)}
                  className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
                >
                  <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-100 rounded-full mr-4">
                    {getCallIcon(type)}
                  </div>
                  <div className="flex-grow">
                    <p className="font-semibold text-base text-slate-800">{getOtherPartyName(call)}</p>
                    <p className="text-sm text-slate-500">{formatTimestamp(call.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${type === 'missed' ? 'text-red-500' : 'text-slate-500'}`}>
                      {call.call_type === 'voice' ? 'Voice Call' : 'Video Call'}
                    </p>
                    {call.status === 'missed' && <p className="text-xs text-red-400">Missed</p>}
                    {call.status === 'rejected' && <p className="text-xs text-red-400">Declined</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Modal */}
      {selectedCall && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div 
            ref={modalRef}
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{getOtherPartyName(selectedCall)}</h3>
                <p className="text-xs text-slate-500">{formatTimestamp(selectedCall.created_at)} • {selectedCall.call_type === 'voice' ? 'Voice' : 'Video'} Call</p>
              </div>
              <button 
                onClick={() => setSelectedCall(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            <div className="p-2 space-y-1">
              <button
                onClick={() => handleStartCall('voice')}
                className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 rounded-xl transition-colors group text-left"
              >
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-slate-700 block">Voice Call</span>
                  <span className="text-xs text-slate-500">Start audio only call</span>
                </div>
              </button>

              <button
                onClick={() => handleStartCall('video')}
                className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 rounded-xl transition-colors group text-left"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Video className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-slate-700 block">Video Call</span>
                  <span className="text-xs text-slate-500">Start video conversation</span>
                </div>
              </button>

              <div className="h-px bg-slate-100 my-1 mx-4"></div>

              <button
                onClick={handleDeleteLog}
                className="w-full p-4 flex items-center gap-4 hover:bg-rose-50 rounded-xl transition-colors group text-left"
              >
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div className="flex-1">
                  <span className="font-semibold text-rose-600 block">Delete Call Log</span>
                  <span className="text-xs text-rose-400">Remove from history</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallHistoryScreen;
