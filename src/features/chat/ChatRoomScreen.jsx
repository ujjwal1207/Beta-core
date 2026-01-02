import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Phone, Video, Send, Paperclip, Loader } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import chatService from '../../services/chatService';
import authService from '../../services/authService';
import { getAvatarUrlWithSize } from '../../lib/avatarUtils';

const ChatRoomScreen = () => {
  const { setScreen, previousScreen, selectedPerson, selectedConversation, setSelectedConversation } = useAppContext();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

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
            time: msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        });
        
        setMessages(transformedMessages);
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
          time: msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      });
      
      // Only update if we have new messages
      if (transformedMessages.length > messages.length) {
        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error('Failed to load new messages:', error);
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
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Only auto-scroll if user is at bottom
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages]);

  // Track scroll position
  const handleScroll = () => {
    setIsAtBottom(checkIfAtBottom());
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isSending || !selectedPerson) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      // Send message to backend
      const sentMessage = await chatService.sendMessage(selectedPerson.id, messageText);

      // Add to local state
      const msgDate = new Date(sentMessage.created_at + 'Z'); // Add 'Z' to indicate UTC
      const newMessage = {
        id: sentMessage.id,
        text: sentMessage.content,
        sender: 'me',
        time: msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, newMessage]);
      
      // Immediately check for new messages after sending
      loadNewMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore input text on error
      setInputText(messageText);
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
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Online
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1 text-slate-600">
          <button className="p-2 hover:bg-slate-100 rounded-full"><Phone className="w-5 h-5" /></button>
          <button className="p-2 hover:bg-slate-100 rounded-full"><Video className="w-5 h-5" /></button>
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
          messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`
                max-w-[75%] px-4 py-3 rounded-2xl text-sm shadow-sm relative group
                ${msg.sender === 'me' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }
              `}
            >
              <p>{msg.text}</p>
              <span 
                className={`text-[10px] mt-1 block opacity-70 ${msg.sender === 'me' ? 'text-indigo-200' : 'text-slate-400'}`}
              >
                {msg.time}
              </span>
            </div>
          </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-3 border-t border-slate-200">
        {selectedFile && (
          <div className="mb-2 px-3 py-2 bg-indigo-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-indigo-700 font-medium truncate">{selectedFile.name}</span>
            <button 
              onClick={() => setSelectedFile(null)}
              className="ml-2 text-indigo-400 hover:text-indigo-600"
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
                if (file.size > 10 * 1024 * 1024) {
                  alert('File size must be less than 10MB');
                  return;
                }
                setSelectedFile(file);
              }
            }}
            accept="image/*,video/*,.pdf,.doc,.docx"
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
    </div>
  );
};

export default ChatRoomScreen;
