import React, { useState, useMemo } from 'react';
import { Search, User } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import TopTabBar from '../../components/layout/TopTabBar';
import PostCard from './components/PostCard';
import QuickPostStories from './components/QuickPostStories';
import FeedJourneyCard from './components/FeedJourneyCard';
import { ALL_PEOPLE } from '../../data/mockData';

const FeedScreen = () => {
  const { 
    setScreen, 
    setIsAddMomentModalOpen, 
    setIsAddReflectionModalOpen,
    setViewingStory,
    onboardingAnswers 
  } = useAppContext();
  
  const [showNudge, setShowNudge] = useState(true);

  const posts = useMemo(() => [
    ALL_PEOPLE.find(p => p.id === 11),
    ALL_PEOPLE.find(p => p.id === 12),
    ALL_PEOPLE.find(p => p.id === 13),
  ].filter(Boolean), []);

  return (
    <div className="relative flex flex-col h-full bg-slate-50">
      <TopTabBar setScreen={setScreen} currentScreen="FEED" />
      <div className="flex-grow overflow-y-auto pt-[121px]">
        <div className="p-4">
          {showNudge && (
            <FeedJourneyCard 
              onboardingAnswers={onboardingAnswers} 
              setScreen={setScreen} 
              onClose={() => setShowNudge(false)} 
            />
          )}
          
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
            <input 
              type="text" 
              placeholder="Find people, stories, or support" 
              className="w-full p-3 pl-12 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-base shadow-sm"
            />
          </div>
          
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 w-full flex items-center gap-3 my-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center">
              <User className="w-6 h-6 text-slate-500" />
            </div>
            <button 
              onClick={() => setIsAddMomentModalOpen(true)}
              className="w-full text-left bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors rounded-full py-2.5 px-4 text-sm font-semibold text-slate-500"
            >
              Start a post...
            </button>
          </div>

          <QuickPostStories 
            setIsAddReflectionModalOpen={setIsAddReflectionModalOpen}
            setViewingStory={setViewingStory}
          />
          
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-slate-800">Recent Posts</h2>
          </div>

          {posts.map((post, index) => <PostCard key={index} post={post} />)}
        </div>
      </div>
    </div>
  );
};

export default FeedScreen;
