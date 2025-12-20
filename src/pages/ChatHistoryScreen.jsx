import React, { useState, useEffect } from 'react';
import { Loader, Plus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import TopTabBar from '../components/layout/TopTabBar';
import chatService from '../services/chatService';

const ChatHistoryScreen = () => {
  const { setScreen, setSelectedPerson, setSelectedConversation, setPreviousScreen } = useAppContext();
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await chatService.getConversations();
      setConversations(data);
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

  return (
    <div className="relative flex flex-col h-full bg-slate-50">
      <TopTabBar setScreen={setScreen} currentScreen="CHAT_HISTORY" />
      <div className="flex-grow overflow-y-auto pt-[121px] p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-extrabold text-slate-800">Messages</h1>
          <button
            onClick={handleNewChat}
            className="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all"
          >
            <Plus className="  w-3 h-3" />
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
          <div className="space-y-3">
            {conversations.map(conversation => (
              <div 
                key={conversation.id} 
                onClick={() => handleChatClick(conversation)}
                className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all"
              >
                <div className="w-12 h-12 flex-shrink-0 rounded-full mr-3 overflow-hidden">
                  <img 
                    src={`https://i.pravatar.cc/100?u=${conversation.other_user.id}`} 
                    alt={conversation.other_user.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-grow overflow-hidden">
                  <p className="font-semibold text-base text-slate-800">{conversation.other_user.full_name}</p>
                  <p className="text-sm text-slate-500 truncate">
                    {conversation.last_message || 'No messages yet'}
                  </p>
                </div>
                <div className="text-right ml-2 flex-shrink-0 flex flex-col items-end">
                  <p className="text-xs text-slate-400 mb-1">
                    {formatTimestamp(conversation.last_message_at)}
                  </p>
                  {conversation.unread_count > 0 && (
                    <span className="w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {conversation.unread_count}
                    </span>
                  )}
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
