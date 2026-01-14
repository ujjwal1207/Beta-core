import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Phone, Video, Send, Paperclip, Loader, Download, FileText, X, Eye, PhoneMissed, VideoOff, MoreVertical, Trash2, Pin } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import chatService from '../../services/chatService';
import authService from '../../services/authService';
import callsService from '../../services/callsService';
import userService from '../../services/userService';
import { getAvatarUrlWithSize } from '../../lib/avatarUtils';

const ChatRoomScreen = () => {
  const { 
    setScreen, 
    previousScreen, 
    selectedPerson, 
    selectedConversation, 
    setSelectedConversation, 
    setInVideoCall, 
    setCallRecipient, 
    setActiveCallChannel,
    setOutgoingInvitation,
    setIsVoiceCall,
    setUnreadMessagesCount
  } = useAppContext();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [viewingImage, setViewingImage] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isPersonOnline, setIsPersonOnline] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Poll for user online status
  useEffect(() => {
    if (!selectedPerson) return;

    const checkOnlineStatus = async () => {
      try {
        const status = await userService.getUserOnlineStatus(selectedPerson.id);
        setIsPersonOnline(status.is_online);
      } catch (error) {
        console.error('Failed to check online status:', error);
      }
    };

    // Initial check
    checkOnlineStatus();

    // Poll every 10 seconds
    const statusInterval = setInterval(checkOnlineStatus, 10000);

    return () => clearInterval(statusInterval);
  }, [selectedPerson]);

  // Load current user and messages
  useEffect(() => {
    loadData();
    
    // Start polling for new messages every second for instant updates
    pollingIntervalRef.current = setInterval(() => {
      if (conversationId && currentUserId) {
        loadNewMessages();
      }
    }, 1000);
    
    // Cleanup on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [selectedPerson, selectedConversation, conversationId, currentUserId]);

  const loadData = async () => {
    if (!selectedPerson) return;

    try {
      setIsLoading(true);
      
      // Get current user
      const user = await authService.getCurrentUser();
      setCurrentUserId(user.id);

      // Get or create conversation
      let convId = selectedConversation?.id;
      
      if (!convId) {
        // No conversation yet, fetch or create it
        const conv = await chatService.getPrivateConversation(selectedPerson.id);
        convId = conv.id;
        setSelectedConversation(conv);
      }
      
      setConversationId(convId);

      // Load messages
      if (convId) {
        const messagesData = await chatService.getMessages(convId);
        
        // Transform backend messages to display format
        const transformedMessages = messagesData.map(msg => {
          const msgDate = new Date(msg.created_at + 'Z'); // Add 'Z' to indicate UTC
          return {
            id: msg.id,
            text: msg.content,
            sender: msg.sender_id === user.id ? 'me' : 'them',
            time: msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            attachment_url: msg.attachment_url,
            attachment_type: msg.attachment_type
          };
        });
        
        setMessages(transformedMessages);
        
        // Scroll to bottom after initial load, but wait for DOM to update
        // Use setTimeout to ensure the container is rendered
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            container.scrollTop = container.scrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNewMessages = async () => {
    if (!conversationId || !currentUserId) return;

    try {
      const messagesData = await chatService.getMessages(conversationId);
      
      // Transform backend messages to display format
      const transformedMessages = messagesData.map(msg => {
        const msgDate = new Date(msg.created_at + 'Z'); // Add 'Z' to indicate UTC
        return {
          id: msg.id,
          text: msg.content,
          sender: msg.sender_id === currentUserId ? 'me' : 'them',
          time: msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          attachment_url: msg.attachment_url,
          attachment_type: msg.attachment_type
        };
      });
      
      // Only update if we have new messages
      if (transformedMessages.length > messages.length) {
        // Check scroll position BEFORE updating
        const wasAtBottom = checkIfAtBottom();
        setMessages(transformedMessages);
        // Update isAtBottom state to match actual position
        setIsAtBottom(wasAtBottom);
        
        // Update unread count when new messages arrive (if we're viewing this conversation, it's read)
        // But we should still update the global count by fetching conversations
        updateUnreadCount();
      }
    } catch (error) {
      console.error('Failed to load new messages:', error);
    }
  };
  
  // Update unread messages count
  const updateUnreadCount = async () => {
    try {
      const conversations = await chatService.getConversations();
      const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      setUnreadMessagesCount(totalUnread);
    } catch (error) {
      console.error('Failed to update unread count:', error);
    }
  };

  // Check if user is at bottom of messages
  const checkIfAtBottom = () => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const threshold = 100; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight < threshold;
  };

  // Auto-scroll to bottom only if user is already at bottom
  const scrollToBottom = (smooth = true) => {
    if (!messagesContainerRef.current) return;
    
    // Use scrollTop instead of scrollIntoView to avoid scrolling the entire page
    const container = messagesContainerRef.current;
    const scrollHeight = container.scrollHeight;
    
    if (smooth) {
      container.scrollTo({
        top: scrollHeight,
        behavior: "smooth"
      });
    } else {
      container.scrollTop = scrollHeight;
    }
  };

  useEffect(() => {
    // Only auto-scroll if user is at bottom and messages container exists
    // Skip if loading to prevent scroll during initial load
    if (!isLoading && isAtBottom && messagesContainerRef.current && messages.length > 0) {
      // Use a small delay to ensure DOM has updated
      const timeoutId = setTimeout(() => {
        if (messagesContainerRef.current) {
          scrollToBottom(false); // Use instant scroll to avoid smooth scroll issues on mobile
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, isAtBottom, isLoading]);

  const handlePinConversation = () => {
    // Implement pinning logic here
    setShowMenu(false);
  };

  const handleDeleteConversation = () => {
    // Implement deleting logic here
    setScreen(previousScreen || 'CHAT_HISTORY');
    setShowMenu(false);
  };

  // Track scroll position
  const handleScroll = () => {
    setIsAtBottom(checkIfAtBottom());
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!inputText.trim() && !selectedFile) || isSending || !selectedPerson) return;

    const messageText = inputText.trim();
    const fileToSend = selectedFile;
    setInputText('');
    setSelectedFile(null);
    setIsSending(true);

    try {
      let sentMessage;
      
      // Send message with or without file
      if (fileToSend) {
        sentMessage = await chatService.sendMessageWithFile(
          selectedPerson.id, 
          messageText, 
          fileToSend
        );
      } else {
        sentMessage = await chatService.sendMessage(selectedPerson.id, messageText);
      }

      // Add to local state
      const msgDate = new Date(sentMessage.created_at + 'Z'); // Add 'Z' to indicate UTC
      const newMessage = {
        id: sentMessage.id,
        text: sentMessage.content,
        sender: 'me',
        time: msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        attachment_url: sentMessage.attachment_url,
        attachment_type: sentMessage.attachment_type
      };

      setMessages(prev => [...prev, newMessage]);
      
      // Always scroll to bottom when user sends a message
      setIsAtBottom(true);
      
      // Immediately check for new messages after sending
      loadNewMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore input text and file on error
      setInputText(messageText);
      setSelectedFile(fileToSend);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (!selectedPerson) return <div className="p-4">No chat selected</div>;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Chat Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-slate-200 shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setScreen(previousScreen || 'MY_CONNECTIONS')}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => {
              setScreen('PROFILE_DETAIL');
            }}
            className="flex items-center gap-3 hover:bg-slate-50 rounded-lg px-2 py-1 -ml-2 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
              <img 
                src={getAvatarUrlWithSize(selectedPerson, 100)} 
                alt={selectedPerson.full_name || selectedPerson.name} 
                className="w-10 h-10 rounded-full object-cover"
              />
            </div>
            <div className="text-left">
              <h2 className="font-bold text-slate-800 text-sm">{selectedPerson.full_name || selectedPerson.name}</h2>
              <p className={`text-xs flex items-center gap-1 ${isPersonOnline ? 'text-green-600' : 'text-slate-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isPersonOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></span>
                {isPersonOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1 text-slate-600">
          <button 
            disabled={!isPersonOnline}
            onClick={async () => {
              try {
                setIsVoiceCall(true);
                const invitation = await callsService.sendCallInvitation(selectedPerson.id, 'voice');
                setOutgoingInvitation(invitation);
                setCallRecipient(selectedPerson);
                setActiveCallChannel(invitation.channel_name);
                setInVideoCall(true);
              } catch (error) {
                console.error('Failed to send call invitation:', error);
                alert('Failed to send call invitation. Please try again.');
              }
            }}
            className={`p-2 rounded-full transition-colors ${
              isPersonOnline 
                ? 'hover:bg-green-100' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            title={isPersonOnline ? "Voice Call" : "User is offline"}
          >
            <Phone className={`w-5 h-5 ${isPersonOnline ? 'text-green-600' : 'text-slate-400'}`} />
          </button>
          <button 
            disabled={!isPersonOnline}
            onClick={async () => {
              try {
                setIsVoiceCall(false);
                const invitation = await callsService.sendCallInvitation(selectedPerson.id, 'video');
                setOutgoingInvitation(invitation);
                setCallRecipient(selectedPerson);
                setActiveCallChannel(invitation.channel_name);
                setInVideoCall(true);
              } catch (error) {
                console.error('Failed to send call invitation:', error);
                alert('Failed to send call invitation. Please try again.');
              }
            }}
            className={`p-2 rounded-full transition-colors ${
              isPersonOnline 
                ? 'hover:bg-blue-100' 
                : 'opacity-50 cursor-not-allowed'
            }`}
            title={isPersonOnline ? "Video Call" : "User is offline"}
          >
            <Video className={`w-5 h-5 ${isPersonOnline ? 'text-blue-600' : 'text-slate-400'}`} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCallLog = msg.text && msg.text.startsWith('[CALL_LOG]');
            let callDuration = '';
            let isVoiceCallLog = false;
            let isMissedCall = false;

            if (isCallLog) {
              const content = msg.text.replace('[CALL_LOG] ', '');
              if (content.startsWith('VOICE ')) {
                isVoiceCallLog = true;
                callDuration = content.replace('VOICE ', '');
              } else if (content.startsWith('VIDEO ')) {
                callDuration = content.replace('VIDEO ', '');
              } else if (content === 'MISSED_VOICE') {
                isVoiceCallLog = true;
                isMissedCall = true;
              } else if (content === 'MISSED_VIDEO') {
                isMissedCall = true;
              } else {
                callDuration = content;
              }
            }

            return (
            <div 
              key={msg.id} 
              className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`
                  max-w-[75%] px-4 py-3 rounded-2xl text-sm shadow-sm relative group
                  ${isCallLog 
                    ? (msg.sender === 'me' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-slate-100 text-slate-600 border border-slate-200')
                    : (msg.sender === 'me' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 rounded-tl-none border border-slate-100')
                  }
                `}
              >
                {isCallLog ? (
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${isMissedCall ? 'bg-red-100' : (isVoiceCallLog ? 'bg-green-100' : 'bg-slate-200')} rounded-full`}>
                      {isMissedCall ? (
                        isVoiceCallLog ? 
                          <PhoneMissed className="w-4 h-4 text-red-600" /> : 
                          <VideoOff className="w-4 h-4 text-red-600" />
                      ) : (
                        isVoiceCallLog ? (
                          <Phone className="w-4 h-4 text-green-600" />
                        ) : (
                          <Video className="w-4 h-4 text-slate-600" />
                        )
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${isMissedCall ? 'text-red-800' : ''}`}>
                        {isMissedCall 
                          ? (isVoiceCallLog ? 'Missed Voice Call' : 'Missed Video Call')
                          : (isVoiceCallLog ? 'Voice Call Ended' : 'Video Call Ended')
                        }
                      </p>
                      {!isMissedCall && <p className="text-xs opacity-80">{callDuration}</p>}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Image attachment */}
                    {msg.attachment_type === 'image' && msg.attachment_url && (
                      <div className="mb-2 relative group">
                        <img 
                          src={msg.attachment_url} 
                          alt="Shared image" 
                          className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setViewingImage(msg.attachment_url)}
                        />
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingImage(msg.attachment_url);
                            }}
                            className="p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                            title="View full size"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <a
                            href={msg.attachment_url}
                            download="image.jpg"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors"
                            title="Download image"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {/* PDF attachment */}
                    {msg.attachment_type === 'pdf' && msg.attachment_url && (
                      <div className="mb-2 p-3 bg-slate-100 rounded-lg flex items-center gap-3 cursor-pointer hover:bg-slate-200 transition-colors">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <FileText className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate">PDF Document</p>
                          <p className="text-xs text-slate-500">Click to view</p>
                        </div>
                        <a 
                          href={msg.attachment_url} 
                          download 
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 hover:bg-slate-300 rounded-full transition-colors"
                        >
                          <Download className="w-4 h-4 text-slate-600" />
                        </a>
                      </div>
                    )}
                    
                    {/* Text content */}
                    {msg.text && <p>{msg.text}</p>}
                  </>
                )}
                <span 
                  className={`text-[10px] mt-1 block opacity-70 ${msg.sender === 'me' && !isCallLog ? 'text-indigo-200' : 'text-slate-400'}`}
                >
                  {msg.time}
                </span>
              </div>
            </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-3 border-t border-slate-200">
        {selectedFile && (
          <div className="mb-2 px-3 py-2 bg-indigo-50 rounded-lg flex items-center gap-3">
            {selectedFile.type.startsWith('image/') ? (
              <img 
                src={URL.createObjectURL(selectedFile)} 
                alt="Preview" 
                className="w-12 h-12 object-cover rounded"
              />
            ) : (
              <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="text-sm text-indigo-700 font-medium truncate block">
                {selectedFile.name}
              </span>
              <span className="text-xs text-indigo-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
            </div>
            <button 
              onClick={() => setSelectedFile(null)}
              className="ml-2 text-indigo-400 hover:text-indigo-600 text-xl leading-none"
            >
              ×
            </button>
          </div>
        )}
        <form onSubmit={handleSend} className="flex items-end gap-2 bg-slate-100 p-2 rounded-xl">
          <input 
            ref={fileInputRef}
            type="file" 
            className="hidden" 
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                // Validate file type
                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
                if (!allowedTypes.includes(file.type)) {
                  alert('Only images (JPEG, PNG, GIF, WebP) and PDF files are allowed');
                  return;
                }
                
                // Validate file size
                if (file.size > 10 * 1024 * 1024) {
                  alert('File size must be less than 10MB');
                  return;
                }
                setSelectedFile(file);
              }
            }}
            accept="image/*,.pdf"
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-800 resize-none max-h-32 py-2"
            rows="1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <button 
            type="submit"
            disabled={!inputText.trim() || isSending} 
            className="p-2 bg-indigo-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-all shadow-md"
          >
            {isSending ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {/* Image Viewer Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <button
            onClick={() => setViewingImage(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <a
            href={viewingImage}
            download="image.jpg"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-4 right-16 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            title="Download image"
          >
            <Download className="w-6 h-6" />
          </a>
          <img 
            src={viewingImage} 
            alt="Full size" 
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ChatRoomScreen;
