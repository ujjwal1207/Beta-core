import React, { useState, useEffect } from 'react';
import { Search, User, Loader } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import TopTabBar from '../../components/layout/TopTabBar';
import PostCard from './components/PostCard';
import QuickPostStories from './components/QuickPostStories';
import FeedJourneyCard from './components/FeedJourneyCard';
import ProfileProgress from './components/ProfileProgress';
import feedService from '../../services/feedService';
import { getAvatarUrlWithSize } from '../../lib/avatarUtils';

const FeedScreen = () => {
  const { 
    setScreen, 
    setIsAddMomentModalOpen, 
    setIsAddReflectionModalOpen,
    setViewingStory,
    onboardingAnswers,
    user,
    isAuthenticated
  } = useAppContext();
  
  const [showNudge, setShowNudge] = useState(true);
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [error, setError] = useState(null);
  const [hiddenPostIds, setHiddenPostIds] = useState(new Set());

  // Fetch posts from backend
  const fetchPosts = async () => {
    if (!isAuthenticated) {
      setIsLoadingPosts(false);
      return;
    }

    try {
      setIsLoadingPosts(true);
      setError(null);
      // Fetch with Vibe Engine enabled
      const feedData = await feedService.getFeed({ limit: 20, useVibe: true });
      setPosts(feedData);
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError('Failed to load feed. Please try again.');
    } finally {
      setIsLoadingPosts(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [isAuthenticated]);

  // Listen for post creation events
  useEffect(() => {
    const handlePostCreated = () => {
      fetchPosts();
    };

    window.addEventListener('postCreated', handlePostCreated);
    return () => window.removeEventListener('postCreated', handlePostCreated);
  }, [isAuthenticated]);

  // Hide a post when user clicks "not interested"
  const hidePost = (postId) => {
    setHiddenPostIds(prev => new Set([...prev, postId]));
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-50">
      <TopTabBar setScreen={setScreen} currentScreen="FEED" />
      <div className="flex-grow overflow-y-auto pt-[121px]">
        <div className="p-4">
          {/* Daily Check-in - Always visible */}
          <ProfileProgress />
          
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
              {user?.full_name ? (
                <span className="text-sm font-semibold text-slate-600">
                  {user.full_name.charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="w-6 h-6 text-slate-500" />
              )}
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

          {isLoadingPosts ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="text-indigo-600 hover:text-indigo-800 font-semibold"
              >
                Try Again
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">No posts yet. Be the first to share!</p>
            </div>
          ) : (
            posts
              .filter(post => !hiddenPostIds.has(post.id))
              .map((post) => (
              <PostCard 
                key={post.id} 
                post={{
                  id: post.id,
                  user_id: post.user_id,
                  name: post.user_name,
                  role: post.user_role,
                  trustScore: post.user_trust_score,
                  image: post.user_profile_photo || `https://i.pravatar.cc/150?u=${post.user_id}`,
                  content: post.content,
                  likes: post.likes_count,
                  comments: post.comments_count,
                  mood: post.mood_at_time,
                  timestamp: new Date(post.created_at).toLocaleDateString(),
                  imageUrl: post.image_url,
                  videoUrl: post.video_url,
                  type: post.type,
                  isLiked: post.is_liked,
                  // Repost fields
                  is_repost: post.is_repost,
                  original_post_id: post.original_post_id,
                  original_post_user_name: post.original_post_user_name,
                  original_post_user_id: post.original_post_user_id,
                  original_post_content: post.original_post_content,
                }}
                onUpdate={fetchPosts}
                onHide={hidePost}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedScreen;
