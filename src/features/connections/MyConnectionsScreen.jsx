import React, { useState, useEffect } from 'react';
import { Search, MessageCircle, ArrowLeft, Loader, UserX } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import connectionsService from '../../services/connectionsService';
import chatService from '../../services/chatService';
import { getAvatarUrlWithSize } from '../../lib/avatarUtils';

const MyConnectionsScreen = () => {
  const { setScreen, setPreviousScreen, setSelectedPerson, setSelectedConversation } = useAppContext();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [connectionsData, conversationsData] = await Promise.all([
          connectionsService.getMyConnections(),
          chatService.getConversations()
        ]);
        setConnections(connectionsData);
        setConversations(conversationsData);
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStartChat = async (person) => {
    try {
      // Find existing conversation or create new one
      const existingConv = conversations.find(c => c.other_user.id === person.id);
      
      if (existingConv) {
        setSelectedConversation(existingConv);
      } else {
        const conv = await chatService.getPrivateConversation(person.id);
        setSelectedConversation(conv);
      }
      
      setSelectedPerson(person);
      setPreviousScreen('MY_CONNECTIONS');
      setScreen('CHAT_ROOM');
    } catch (error) {
      console.error('Failed to open chat:', error);
    }
  };

  const filteredConnections = connections.filter(c => 
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button 
          onClick={() => setScreen('CONNECTIONS_DASHBOARD')}
          className="p-2 rounded-full hover:bg-slate-100 text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-slate-800 flex-1">My Connections</h1>
        <div className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs font-bold">
          {connections.length}
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search connections..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center pt-10">
            <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : filteredConnections.length > 0 ? (
          filteredConnections.map((person) => (
            <div 
              key={person.id} 
              onClick={() => handleStartChat(person)}
              className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99] transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                <img 
                  src={getAvatarUrlWithSize(person, 100)} 
                  alt={person.full_name} 
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 truncate">{person.full_name}</h3>
                <p className="text-sm text-slate-500 truncate">{person.role || 'No role'}</p>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleStartChat(person); }}
                className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            </div>
          ))
        ) : searchQuery ? (
          <div className="text-center text-slate-400 mt-10">
            <p>No connections found matching "{searchQuery}"</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center pt-10 opacity-60">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4">
              <UserX className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-medium">No connections yet.</p>
            <button onClick={() => setScreen('CONNECTIONS_DASHBOARD')} className="text-indigo-600 font-bold text-sm mt-2 hover:underline">
              Go find someone!
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyConnectionsScreen;
