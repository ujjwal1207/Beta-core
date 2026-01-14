import React, { useState, useEffect, useRef } from 'react';
import { Loader, Plus, MoreVertical, Trash2, Pin } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import TopTabBar from '../components/layout/TopTabBar';
import chatService from '../services/chatService';
import callsService from '../services/callsService';
import { getAvatarUrlWithSize } from '../lib/avatarUtils';

const ChatHistoryScreen = () => {
  const { 
    setScreen, 
    setSelectedPerson, 
    setSelectedConversation, 
    setPreviousScreen, 
    setInVideoCall, 
    setCallRecipient,
    setActiveCallChannel,
    setOutgoingInvitation,
    setIsVoiceCall,
    setUnreadMessagesCount
  } = useAppContext();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    loadConversations();
    
    // Close menu when clicking outside
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await chatService.getConversations();
      setConversations(data);
      // Update unread messages count in context
      const totalUnread = data.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      setUnreadMessagesCount(totalUnread);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatClick = (conversation) => {
    setSelectedPerson(conversation.other_user);
    setSelectedConversation(conversation);
    setPreviousScreen('CHAT_HISTORY');
    setScreen('CHAT_ROOM');
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

  const handleNewChat = () => {
    setPreviousScreen('CHAT_HISTORY');
    setScreen('MY_CONNECTIONS');
  };

  const handleDeleteConversation = async (e, conversationId) => {
    e.stopPropagation();
    // Logic for deleting conversation
    // Since backend might not support it yet, we just filter it from local state
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    setActiveMenuId(null);
  };

  const handlePinConversation = async (e, conversationId) => {
    e.stopPropagation();
    try {
      await chatService.togglePinConversation(conversationId);
      // Reload conversations to get updated pin status and sorting
      await loadConversations();
    } catch (error) {
      console.error('Failed to pin conversation:', error);
    }
    setActiveMenuId(null);
  };

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-50">
      <TopTabBar setScreen={setScreen} currentScreen="CHAT_HISTORY" />
      <div className="grow overflow-y-auto pt-[120px] sm:pt-[126px] p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">Messages</h1>
          <button
            onClick={handleNewChat}
            className="p-2.5 sm:p-3 bg-indigo-600 text-white rounded-full shadow-lg active:bg-indigo-700 transition-all touch-manipulation"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>No conversations yet</p>
            <p className="text-sm mt-2">Start chatting with your connections!</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {conversations.map(conversation => (
              <div 
                key={conversation.id} 
                onClick={() => handleChatClick(conversation)}
                className="bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-100 flex items-center cursor-pointer active:shadow-md active:border-indigo-200 transition-all relative touch-manipulation"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-full mr-2 sm:mr-3 overflow-hidden">
                  <img 
                    src={getAvatarUrlWithSize(conversation.other_user, 100)} 
                    alt={conversation.other_user.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-grow overflow-hidden">
                  <p className="font-semibold text-sm sm:text-base text-slate-800">{conversation.other_user.full_name}</p>
                  <p className="text-xs sm:text-sm text-slate-500 truncate">
                    {conversation.last_message || 'No messages yet'}
                  </p>
                </div>
                <div className="text-right ml-2 flex-shrink-0 flex items-center gap-1 sm:gap-2">
                  {conversation.is_pinned && (
                    <Pin className="w-4 h-4 text-indigo-500" />
                  )}
                  <div className="flex flex-col items-end mr-1 sm:mr-2">
                    <p className="text-[10px] sm:text-xs text-slate-400 mb-1">
                      {formatTimestamp(conversation.last_message_at)}
                    </p>
                    {conversation.unread_count > 0 && (
                      <span className="w-4 h-4 sm:w-5 sm:h-5 bg-rose-500 text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => toggleMenu(e, conversation.id)}
                      className="p-1.5 sm:p-2 active:bg-slate-100 rounded-full transition-colors text-slate-400 active:text-slate-600 touch-manipulation"
                    >
                      <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    
                    {activeMenuId === conversation.id && (
                      <div 
                        ref={menuRef}
                        className="absolute right-0 top-10 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-10 overflow-hidden"
                      >
                        <button
                          onClick={(e) => handlePinConversation(e, conversation.id)}
                          className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Pin className="w-4 h-4" />
                          {conversation.is_pinned ? 'Unpin' : 'Pin to top'}
                        </button>
                        <div className="h-px bg-slate-100 my-0"></div>
                        <button
                          onClick={(e) => handleDeleteConversation(e, conversation.id)}
                          className="w-full text-left px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete conversation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHistoryScreen;
