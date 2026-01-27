import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PhoneOutgoing, PhoneIncoming, PhoneMissed, Phone, Loader, Video, Trash2, X, Calendar, Clock, User, Check, X as XIcon, Play, RotateCcw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import TopTabBar from '../components/layout/TopTabBar';
import callsService from '../services/callsService';
import RescheduleCallModal from '../features/connections/components/RescheduleCallModal';

const CallHistoryScreen = () => {
  const { 
    setScreen, 
    user,
    setInVideoCall,
    setIsVoiceCall,
    setCallRecipient,
    setOutgoingInvitation,
    setActiveCallChannel,
    setScheduledCallToken,
    setScheduledCallUid,
    setScheduledCallAppId,
    showToast,
    setSelectedPerson,
    pendingCallRequestsCount,
    setPendingCallRequestsCount,
  } = useAppContext();

  // State
  const [calls, setCalls] = useState([]);
  const [scheduledCalls, setScheduledCalls] = useState([]);
  const [callBookingRequests, setCallBookingRequests] = useState([]);
  const [rescheduleRequests, setRescheduleRequests] = useState([]);
  
  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  
  // UI States
  const [selectedCall, setSelectedCall] = useState(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [callToReschedule, setCallToReschedule] = useState(null);
  const [mode, setMode] = useState('SCHEDULED'); // SCHEDULED, HISTORY
  
  const modalRef = useRef(null);

  // Close modal when clicking outside
  useEffect(() => {
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

  // --- FIXED DATA FETCHING ---
  const fetchAllData = useCallback(async () => {
    if (!user) return;
    
    // Only set loading on initial load if data is empty
    if (calls.length === 0 && scheduledCalls.length === 0) {
      setIsLoading(true);
    }

    try {
      // 1. Fetch History INDEPENDENTLY so failures in scheduling don't break history
      try {
        const historyData = await callsService.getCallHistory();
        setCalls(historyData || []);
      } catch (err) {
        console.error("Failed to load call history:", err);
      }

      // 2. Fetch Advanced features (Scheduled, Bookings) separately
      // We use Promise.allSettled or distinct try/catch blocks implicitly here 
      // by separating them from the main history call.
      const [scheduledData, bookingData, rescheduleData] = await Promise.all([
        callsService.getScheduledCalls().catch(() => []),       // Fallback to empty array on fail
        callsService.getCallBookingRequests().catch(() => []),  // Fallback to empty array on fail
        callsService.getPendingRescheduleRequests().catch(() => []) // Fallback to empty array on fail
      ]);

      // Filter out expired scheduled calls and booking requests
      const filteredScheduledData = scheduledData || [];
      const filteredBookingData = bookingData || [];
      
      setScheduledCalls(filteredScheduledData);
      setCallBookingRequests(filteredBookingData);
      setRescheduleRequests(rescheduleData || []);

    } catch (error) {
      console.error('Critical error in data fetching:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, calls.length, scheduledCalls.length]);

  // Initial Fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Listen for call ended events to refresh data
  useEffect(() => {
    const handleCallEnded = () => {
      console.log('Call ended, refreshing call history');
      fetchAllData();
    };

    window.addEventListener('callEnded', handleCallEnded);
    return () => window.removeEventListener('callEnded', handleCallEnded);
  }, [fetchAllData]);

  // --- Helpers ---

  const getCallType = (call) => {
    if (!user) return 'unknown';

    // If I am receiver and status is missed/rejected -> missed
    if (call.receiver_id === user.id && ['missed', 'rejected'].includes(call.status)) {
      return 'missed';
    }
    
    // If I am caller -> outgoing
    if (call.caller_id === user.id) {
      return 'outgoing';
    }
    
    // If I am receiver -> incoming
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
      case 'completed': return <Phone className="w-5 h-5 text-emerald-500" />;
      default: return <Phone className="w-5 h-5 text-slate-400" />;
    }
  };

  // --- FIXED TIMESTAMP FUNCTION ---
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp * 1000); // Unix timestamp to Date
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const now = new Date();
    const diff = now - date;
    
    if (diff < 24 * 60 * 60 * 1000) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 7 * 24 * 60 * 60 * 1000) return date.toLocaleDateString([], { weekday: 'short' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatScheduledDateTime = (scheduledAt) => {
    if (!scheduledAt) return '';
    const date = new Date(scheduledAt * 1000); // Unix timestamp to Date
    
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() === date.toDateString();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) return `Today at ${timeStr}`;
    if (isTomorrow) return `Tomorrow at ${timeStr}`;
    return `${date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at ${timeStr}`;
  };

  const getOtherParty = (call) => {
    if (!user) return null;
    return call.caller_id === user.id ? call.receiver : call.caller;
  };

  const getOtherPartyName = (call) => {
    const party = getOtherParty(call);
    const name = party ? (party.full_name || party.name) : 'Unknown User';

    // Format name to camel case
    if (name === 'Unknown User') return name;

    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getScheduledCallOtherPartyName = (call) => {
    if (!user) return 'Unknown User';
    // For scheduled calls, determine the other user
    let name = '';
    if (call.booker_id === user.id && call.host) {
      name = call.host.full_name || `User ${call.host_id}`;
    } else if (call.host_id === user.id && call.booker) {
      name = call.booker.full_name || `User ${call.booker_id}`;
    } else {
      // Fallback to ID-based naming
      const otherUserId = call.booker_id === user.id ? call.host_id : call.booker_id;
      name = `User ${otherUserId}`;
    }

    // Format name to camel case and make it more appealing
    if (name.startsWith('User ')) {
      return name; // Keep "User X" format as is
    }

    // Convert to camel case (capitalize first letter of each word)
    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getScheduledCallOtherPartyId = (call) => {
    if (!user) return null;
    // For scheduled calls, determine the other user ID
    if (call.booker_id === user.id && call.host) {
      return call.host_id;
    } else if (call.host_id === user.id && call.booker) {
      return call.booker_id;
    }
    // Fallback to ID-based logic
    return call.booker_id === user.id ? call.host_id : call.booker_id;
  };

  const getRescheduleRequesterName = (request) => {
    if (!user) return 'Unknown User';
    // For reschedule requests, get the requester's name
    let name = '';
    if (request.requester) {
      name = request.requester.full_name || `User ${request.requester_id}`;
    } else {
      name = `User ${request.requester_id}`;
    }

    // Format name to camel case and make it more appealing
    if (name.startsWith('User ')) {
      return name; // Keep "User X" format as is
    }

    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getBookingRequesterName = (request) => {
    if (!user) return 'Unknown User';
    // For booking requests, get the booker's name
    let name = '';
    if (request.booker) {
      name = request.booker.full_name || `User ${request.booker_id}`;
    } else {
      name = `User ${request.booker_id}`;
    }

    // Format name to camel case and make it more appealing
    if (name.startsWith('User ')) {
      return name; // Keep "User X" format as is
    }

    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // --- Logic Helpers for Time ---

  const isCallReadyToJoin = (call) => {
    if (!call || !call.scheduled_at) return false;
    // If call has already started, it's not "ready to join"
    if (call.started_at) return false;
    const scheduledTime = new Date(call.scheduled_at * 1000);
    if (isNaN(scheduledTime.getTime())) return false;
    const now = new Date();
    const timeDiff = scheduledTime - now;
    // Ready if within ±5 minutes of scheduled time
    return timeDiff <= 5 * 60 * 1000 && timeDiff >= -5 * 60 * 1000;
  };

  const isCallExpired = (scheduledAt) => {
    if (!scheduledAt) return false;
    const scheduledTime = new Date(scheduledAt * 1000);
    if (isNaN(scheduledTime.getTime())) return false;
    const now = new Date();
    const timeDiff = scheduledTime - now;
    // Expired if more than 5 minutes past scheduled time
    return timeDiff < -5 * 60 * 1000; 
  };

  // --- Navigation Helpers ---

  const handleUserProfileClick = (userId) => {
    setSelectedPerson({ id: userId });
    setScreen('PROFILE_DETAIL');
  };

  // --- Handlers ---

  const handleStartCall = async (type) => {
    if (!selectedCall) return;
    const recipient = getOtherParty(selectedCall);
    if (!recipient) return;
    
    try {
      setSelectedCall(null);
      setIsVoiceCall(type === 'voice');
      
      const invitation = await callsService.sendCallInvitation(recipient.id, type);
      
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
    const previousCalls = [...calls];
    setCalls(prev => prev.filter(c => c.id !== selectedCall.id));
    const idToDelete = selectedCall.id;
    setSelectedCall(null);
    
    try {
        await callsService.deleteCallLog(idToDelete);
    } catch (error) {
        console.error('Failed to delete log:', error);
        setCalls(previousCalls); // Revert
    }
  };

  const handleAcceptBookingRequest = async (bookingId) => {
    try {
      await callsService.acceptCallBooking(bookingId);
      setPendingCallRequestsCount(prev => prev - 1); // Update count immediately
      await fetchAllData(); // Refresh all lists
      showToast('Call booking request accepted! The call has been scheduled.', 'success');
    } catch (error) {
      console.error('Failed to accept call booking request:', error);
      showToast('Failed to accept booking request. Please try again.', 'error');
    }
  };

  const handleDeclineBookingRequest = async (bookingId) => {
    try {
      await callsService.declineCallBooking(bookingId);
      setCallBookingRequests(prev => prev.filter(req => req.id !== bookingId));
      setPendingCallRequestsCount(prev => prev - 1); // Update count immediately
      showToast('Call booking request declined.', 'success');
    } catch (error) {
      console.error('Failed to decline call booking request:', error);
      showToast('Failed to decline booking request. Please try again.', 'error');
    }
  };

  const handleAcceptRescheduleRequest = async (requestId) => {
    try {
      await callsService.acceptRescheduleRequest(requestId);
      setPendingCallRequestsCount(prev => prev - 1); // Update count immediately
      await fetchAllData(); // Refresh all lists
      showToast('Reschedule request accepted successfully!', 'success');
    } catch (error) {
      console.error('Failed to accept reschedule request:', error);
      showToast('Failed to accept reschedule request. Please try again.', 'error');
    }
  };

  const handleRejectRescheduleRequest = async (requestId) => {
    try {
      await callsService.rejectRescheduleRequest(requestId);
      setRescheduleRequests(prev => prev.filter(req => req.id !== requestId));
      setPendingCallRequestsCount(prev => prev - 1); // Update count immediately
      showToast('Reschedule request declined.', 'success');
    } catch (error) {
      console.error('Failed to reject reschedule request:', error);
      showToast('Failed to decline reschedule request. Please try again.', 'error');
    }
  };

  const handleJoinScheduledCall = async (call) => {
    try {
      // Determine receiver
      const receiverId = call.booker_id === user?.id ? call.host_id : call.booker_id;

      // Send invitation (signaling)
      const invitation = await callsService.sendCallInvitation(
        receiverId,
        call.call_type || 'video',
        call.id
      );

      setOutgoingInvitation(invitation);
      
      // Set Call State
      setInVideoCall(true);
      setIsVoiceCall(call.call_type === 'voice');
      setActiveCallChannel(call.agora_channel_name);
      setScheduledCallToken(call.agora_token);
      setScheduledCallUid(call.caller_uid);
      setScheduledCallAppId(call.agora_app_id);

      setCallRecipient({
        id: receiverId,
        name: `User ${receiverId}`, // Ideally fetch real name if not in object
      });

    } catch (error) {
      console.error('Failed to join scheduled call:', error);
      showToast("Failed to join call. Please try again.", "error");
    }
  };

  const handleRescheduleCall = (call) => {
    setCallToReschedule(call);
    setShowRescheduleModal(true);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <TopTabBar setScreen={setScreen} currentScreen="CALL_HISTORY" />
      
      <div className="flex-grow overflow-y-auto pt-[121px]">
        {/* Mode Selector */}
        <div className="w-full p-3 sm:p-4 flex justify-center bg-slate-50 border-b border-slate-200">
          <div className="flex bg-slate-200 p-1 rounded-full shadow-inner max-w-sm w-full">
            {['SCHEDULED', 'HISTORY'].map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 min-w-0 px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold
                            rounded-full transition-all duration-300 whitespace-nowrap touch-manipulation relative ${
                  mode === m ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-600 active:bg-slate-300'
                }`}
              >
                {m === 'SCHEDULED' ? 'Scheduled' : 'History'}
                {m === 'SCHEDULED' && pendingCallRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full p-4">
          {isLoading ? (
             <div className="flex items-center justify-center py-12">
                <Loader className="w-6 h-6 animate-spin text-indigo-600" />
             </div>
          ) : (
            <>
                {mode === 'SCHEDULED' && (
                    <>
                    {/* Booking Requests */}
                    {callBookingRequests.length > 0 && (
                        <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <User className="w-5 h-5 text-orange-600" />
                            <h2 className="text-xl font-bold text-slate-700">Call Requests</h2>
                            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {callBookingRequests.length}
                            </span>
                        </div>

                        <div className="space-y-4">
                            {callBookingRequests.map(request => (
                            <div key={request.id} className="bg-gradient-to-r from-orange-50 to-white p-3 sm:p-4 rounded-xl shadow-sm border border-orange-200/50 hover:shadow-lg hover:border-orange-300 transition-all duration-200">
                                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 sm:pr-4">
                                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl shadow-sm">
                                    {request.call_type === 'video' ? <Video className="w-5 h-5 text-orange-600" /> : <Phone className="w-5 h-5 text-orange-600" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                                        <p className="font-semibold text-slate-800 text-sm sm:text-base">Call Request</p>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-2"><button 
                                        onClick={() => handleUserProfileClick(request.booker_id)}
                                        className="font-medium text-slate-700 hover:text-blue-600 hover:underline transition-colors cursor-pointer"
                                    >{getBookingRequesterName(request)}</button></p>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Clock className="w-4 h-4 text-orange-500" />
                                        <span className="font-medium whitespace-nowrap">{formatScheduledDateTime(request.scheduled_at)}</span>
                                    </div>
                                    </div>
                                </div>
                                <div className="flex flex-row sm:flex-col gap-2 sm:gap-2 w-full sm:w-32 sm:flex-shrink-0">
                                    <button onClick={() => handleAcceptBookingRequest(request.id)} className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md">
                                    <Check className="w-4 h-4" />
                                    <span className="hidden xs:inline">Accept</span>
                                    </button>
                                    <button onClick={() => handleDeclineBookingRequest(request.id)} className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md">
                                    <XIcon className="w-4 h-4" />
                                    <span className="hidden xs:inline">Decline</span>
                                    </button>
                                </div>
                                </div>
                                {request.note && (
                                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-orange-100">
                                    <p className="text-sm text-slate-600 italic bg-orange-50/50 p-3 rounded-lg">"{request.note}"</p>
                                </div>
                                )}
                            </div>
                            ))}
                        </div>
                        </div>
                    )}

                    {/* Reschedule Requests */}
                    {rescheduleRequests.length > 0 && (
                        <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <RotateCcw className="w-5 h-5 text-blue-600" />
                            <h2 className="text-xl font-bold text-slate-700">Reschedule Requests</h2>
                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {rescheduleRequests.length}
                            </span>
                        </div>
                        <div className="space-y-4">
                            {rescheduleRequests.map(request => (
                            <div key={request.id} className="bg-gradient-to-r from-blue-50 to-white p-3 sm:p-4 rounded-xl shadow-sm border border-blue-200/50 hover:shadow-lg transition-all duration-200 hover:border-blue-300">
                                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                                <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 sm:pr-4">
                                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-sm">
                                    <RotateCcw className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                                        <p className="font-semibold text-slate-800 text-sm sm:text-base">Reschedule Request</p>
                                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 border border-blue-200">Pending</span>
                                    </div>
                                    <div className="text-sm text-slate-600 mb-2">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                                        <button 
                                            onClick={() => handleUserProfileClick(request.requester_id)}
                                            className="font-medium text-slate-800 hover:text-blue-600 hover:underline transition-colors cursor-pointer"
                                        >
                                            {getRescheduleRequesterName(request)}
                                        </button>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                                        <span className="text-slate-500">Current:</span>
                                        <span className="line-through text-slate-400">{formatScheduledDateTime(request.booking?.scheduled_at)}</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                        <span className="text-blue-600 font-medium">New Time:</span>
                                        <span className="text-blue-700 font-medium">{formatScheduledDateTime(request.new_scheduled_at)}</span>
                                        </div>
                                    </div>
                                    </div>
                                </div>
                                <div className="flex flex-row sm:flex-col gap-2 sm:gap-2 w-full sm:w-32 sm:flex-shrink-0">
                                    <button onClick={() => handleAcceptRescheduleRequest(request.id)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md">
                                    <Check className="w-4 h-4" />
                                    <span className="hidden xs:inline">Accept</span>
                                    </button>
                                    <button onClick={() => handleRejectRescheduleRequest(request.id)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md">
                                    <XIcon className="w-4 h-4" />
                                    <span className="hidden xs:inline">Decline</span>
                                    </button>
                                </div>
                                </div>
                            </div>
                            ))}
                        </div>
                        </div>
                    )}

                    {/* Scheduled Calls */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-xl font-bold text-slate-700">Scheduled Calls</h2>
                        </div>

                        {(() => {
                            const filteredCalls = scheduledCalls.filter(call => ['accepted', 'scheduled'].includes(call.status));
                            const sortedCalls = filteredCalls.sort((a, b) => {
                            const aTime = new Date(a.scheduled_at * 1000);
                            const bTime = new Date(b.scheduled_at * 1000);
                            
                            // If either date is invalid, sort by ID or something
                            if (isNaN(aTime.getTime()) && isNaN(bTime.getTime())) return 0;
                            if (isNaN(aTime.getTime())) return 1;
                            if (isNaN(bTime.getTime())) return -1;
                            
                            const aCanJoin = isCallReadyToJoin(a);
                            const bCanJoin = isCallReadyToJoin(b);
                            const aExpired = isCallExpired(a.scheduled_at);
                            const bExpired = isCallExpired(b.scheduled_at);
                            
                            // Priority 1: Calls that can be joined (ready to join) come first
                            if (aCanJoin && !bCanJoin) return -1;
                            if (!aCanJoin && bCanJoin) return 1;
                            
                            // Priority 2: Active (not expired) calls come before expired calls
                            if (!aExpired && bExpired) return -1;
                            if (aExpired && !bExpired) return 1;
                            
                            // Priority 3: Sort by scheduled time (chronological)
                            return aTime - bTime;
                            });
                            
                            return sortedCalls.length === 0 ? (
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center">
                                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 mb-2">No scheduled calls</p>
                            </div>
                            ) : (
                            <div className="space-y-4">
                                {sortedCalls.map(call => {
                            const canJoin = isCallReadyToJoin(call);
                            const isExpired = isCallExpired(call.scheduled_at);

                            return (
                                <div key={call.id} className={`bg-gradient-to-r ${isExpired ? 'from-amber-50 to-white' : 'from-white to-slate-50'} p-3 sm:p-4 rounded-xl shadow-sm border hover:shadow-lg transition-all duration-200 ${isExpired ? 'border-amber-200/50 hover:border-amber-300' : 'border-slate-200 hover:border-slate-300'}`}>
                                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 sm:pr-4">
                                    <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl shadow-sm ${isExpired ? 'bg-gradient-to-br from-amber-100 to-amber-200' : 'bg-gradient-to-br from-indigo-100 to-indigo-200'}`}>
                                        {call.call_type === 'video' ? <Video className={`w-5 h-5 ${isExpired ? 'text-amber-600' : 'text-indigo-600'}`} /> : <Phone className={`w-5 h-5 ${isExpired ? 'text-amber-600' : 'text-indigo-600'}`} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                                        <button 
                                            onClick={() => handleUserProfileClick(getScheduledCallOtherPartyId(call))}
                                            className="font-semibold text-slate-800 truncate text-sm sm:text-base hover:text-blue-600 hover:underline transition-colors cursor-pointer text-left"
                                        >
                                            {getScheduledCallOtherPartyName(call)}
                                        </button>
                                        <div className="flex gap-1 flex-wrap">
                                            {isExpired && <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700 border border-amber-200">Expired</span>}
                                        </div>
                                        </div>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm text-slate-500 mb-2">
                                        <div className="flex items-center gap-1">
                                            <Clock className={`w-4 h-4 ${isExpired ? 'text-amber-500' : 'text-indigo-500'}`} />
                                            <span className="font-medium whitespace-nowrap">{formatScheduledDateTime(call.scheduled_at)}</span>
                                        </div>
                                        {canJoin && (
                                        <span className="text-sm text-green-600 font-semibold animate-pulse">🔴 Live Now</span>
                                        )}
                                        </div>
                                    </div>
                                    </div>

                                    <div className="flex flex-row sm:flex-col gap-2 sm:gap-2 w-full sm:w-32 sm:flex-shrink-0">
                                    {canJoin && (
                                        <button onClick={() => handleJoinScheduledCall(call)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-sm hover:shadow-md">
                                        <Play className="w-4 h-4" /> <span className="hidden xs:inline">Join Call</span><span className="xs:hidden">Join</span>
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleRescheduleCall(call)} 
                                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md ${isExpired ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700' : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'}`}
                                    >
                                        <RotateCcw className="w-4 h-4" />
                                        Reschedule
                                    </button>
                                    </div>
                                </div>
                                {call.note && (
                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                    <p className="text-sm text-slate-600 italic bg-slate-50 p-3 rounded-lg">"{call.note}"</p>
                                    </div>
                                )}
                                </div>
                            );
                            })}
                        </div>
                        );
                        })()}
                    </div>
                    </>
                )}

                {mode === 'HISTORY' && (
                    <>
                    <div className="mb-4">
                        <div className="flex items-center gap-2 mb-4">
                        <Phone className="w-5 h-5 text-slate-600" />
                        <h2 className="text-xl font-bold text-slate-700">Call History</h2>
                        </div>
                    </div>
                    {calls.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                        <p>No recent calls</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                        {calls.map(call => {
                            const type = getCallType(call);
                            return (
                            <div key={call.id} onClick={() => setSelectedCall(call)} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex items-center cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]">
                                <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-slate-100 rounded-full mr-3">
                                {getCallIcon(type)}
                                </div>
                                <div className="flex-grow min-w-0">
                                <p className="font-medium text-sm text-slate-800 truncate">{getOtherPartyName(call)}</p>
                                <p className="text-xs text-slate-500">{formatTimestamp(call.created_at)}</p>
                                </div>
                                <div className="text-right ml-2">
                                <p className={`text-xs font-medium ${['missed', 'rejected'].includes(call.status) ? 'text-red-500' : 'text-slate-500'}`}>
                                    {call.call_type === 'voice' ? 'Voice' : 'Video'}
                                </p>
                                {call.status === 'missed' && <p className="text-xs text-red-400">Missed</p>}
                                {call.status === 'rejected' && <p className="text-xs text-red-400">Declined</p>}
                                {(call.status === 'completed' || call.status === 'ended' || call.status === 'accepted') && <p className="text-xs text-emerald-600">Completed</p>}
                                </div>
                            </div>
                            );
                        })}
                        </div>
                    )}
                    </>
                )}
            </>
          )}
        </div>

        {/* Action Modal */}
        {selectedCall && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div ref={modalRef} className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">{getOtherPartyName(selectedCall)}</h3>
                  <p className="text-xs text-slate-500">{formatTimestamp(selectedCall.created_at)}</p>
                </div>
                <button onClick={() => setSelectedCall(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              
              <div className="p-2 space-y-1">
                <button onClick={() => handleStartCall('voice')} className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 rounded-xl transition-colors group text-left">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-semibold text-slate-700">Voice Call</span>
                </button>
                <button onClick={() => handleStartCall('video')} className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 rounded-xl transition-colors group text-left">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Video className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-semibold text-slate-700">Video Call</span>
                </button>
                <div className="h-px bg-slate-100 my-1 mx-4"></div>
                <button onClick={handleDeleteLog} className="w-full p-4 flex items-center gap-4 hover:bg-rose-50 rounded-xl transition-colors group text-left">
                  <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center group-hover:bg-rose-200 transition-colors">
                    <Trash2 className="w-5 h-5 text-rose-600" />
                  </div>
                  <span className="font-semibold text-rose-600">Delete Call Log</span>
                </button>
              </div>
            </div>
          </div>
        )}
      
        {/* Reschedule Call Modal */}
        <RescheduleCallModal
          isOpen={showRescheduleModal}
          onClose={() => {
            setShowRescheduleModal(false);
            setCallToReschedule(null);
          }}
          call={callToReschedule}
          onSuccess={(message) => {
            fetchAllData(); // Refresh list after successful reschedule
            showToast(message, message.includes('Failed') ? 'error' : 'success');
          }}
        />
      </div>
    </div>
  );
};

export default CallHistoryScreen;