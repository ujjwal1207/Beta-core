import React from 'react';
import { Heart, MessageSquare, Send, Bookmark, Repeat } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import MoodDisplay from '../../../components/ui/MoodDisplay';

const PostCard = ({ post }) => {
  const { setScreen, setSelectedPerson, setPreviousScreen } = useAppContext();

  const handleNameClick = () => {
    setPreviousScreen('FEED');
    setSelectedPerson(post);
    setScreen('PROFILE_DETAIL');
  };

  return (
    <div className="bg-white p-4 mb-4 rounded-xl shadow-sm border border-slate-100 w-full">
      <div className="flex items-center mb-3">
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-base mr-3">
          {post.name[0]}
        </div>
        <div className='flex-grow'>
          <button onClick={handleNameClick} className="flex items-center text-left">
            <p className="font-semibold text-base text-slate-800 hover:underline">{post.name}</p>
            <MoodDisplay moodIndex={post.mood} />
          </button>
          <p className="text-xs text-slate-500">{post.role}</p>
        </div>
        <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full">...</button>
      </div>
      <p className="text-sm text-slate-700 mb-3">{post.text}</p>
      <div className="bg-slate-100 h-24 rounded-lg mb-3"></div>
      <div className="flex justify-between items-center text-slate-500 font-medium">
        <div className="flex space-x-4">
          <button className="flex items-center hover:text-rose-500 p-1 rounded-md transition-colors active:scale-[0.98]">
            <Heart className="w-6 h-6" />
          </button>
          <button className="flex items-center hover:text-indigo-600 p-1 rounded-md transition-colors active:scale-[0.98]">
            <MessageSquare className="w-6 h-6" />
          </button>
          <button className="flex items-center hover:text-indigo-600 p-1 rounded-md transition-colors active:scale-[0.98]">
            <Send className="w-6 h-6" />
          </button>
          <button className="flex items-center hover:text-green-500 p-1 rounded-md transition-colors active:scale-[0.98]">
            <Repeat className="w-6 h-6" />
          </button>
        </div>
        <button className="flex items-center hover:text-indigo-600 p-1 rounded-md transition-colors active:scale-[0.98]">
          <Bookmark className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default PostCard;
