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
import { quizFlow, TRACK_Q1_KEYS, TRACK_Q2_KEYS } from '../../data/quizFlow';

const FeedScreen = () => {
  const { 
    setScreen, 
    setIsAddMomentModalOpen, 
    setIsAddReflectionModalOpen,
    setViewingStory,
    onboardingAnswers,
    user,
    isAuthenticated,
    setSearchQuery,
    setConnectionsMode,
  } = useAppContext();
  
  const [showNudge, setShowNudge] = useState(() => {
    // Check if user has dismissed the quiz nudge
    const dismissed = localStorage.getItem('quizNudgeDismissed');
    return dismissed !== 'true';
  });
  const [searchValue, setSearchValue] = useState("");
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

  // Helper: check if onboarding quiz is complete (100%)
  const isJourneyComplete = (() => {
    // Replicate FeedJourneyCard logic for completion
    // If onboardingAnswers is empty, treat as 0% complete
    if (!onboardingAnswers || Object.keys(onboardingAnswers).length === 0) {
      return false;
    }
    const hasAnswer = (key) => {
      const answer = onboardingAnswers[key];
      if (Array.isArray(answer)) return answer.length > 0;
      if (typeof answer === 'string') return answer.trim().length > 0;
      if (typeof answer === 'object' && answer !== null && !Array.isArray(answer)) return Object.keys(answer).length > 0;
      return false;
    };
    
    const vibeAnswers = onboardingAnswers['VIBE_QUIZ'] || [];
    let completedSteps = 0;
    let totalSteps = 4; // Base steps: VIBE_QUIZ + TRACK_Q1 + TRACK_Q2 + NEW_GENERATION
    
    // Check if user goes to GIVE_ADVICE_QUIZ
    const goesToAdviceQuiz = quizFlow['NEW_GENERATION'].nextStepLogic(onboardingAnswers['NEW_GENERATION'], onboardingAnswers) === 'GIVE_ADVICE_QUIZ';
    if (goesToAdviceQuiz) {
      totalSteps = 5; // Add GIVE_ADVICE_QUIZ step
    }
    
    // Step 1: VIBE_QUIZ
    if (hasAnswer('VIBE_QUIZ')) completedSteps++;
    
    // Step 2: TRACK_Q1 step
    const nextTrackStep1Key = quizFlow['VIBE_QUIZ'].nextStepLogic(vibeAnswers, onboardingAnswers);
    if (nextTrackStep1Key && TRACK_Q1_KEYS.includes(nextTrackStep1Key) && hasAnswer(nextTrackStep1Key)) {
      completedSteps++;
    }
    
    // Step 3: TRACK_Q2 step
    if (nextTrackStep1Key && hasAnswer(nextTrackStep1Key)) {
      const nextTrackStep2Key = quizFlow[nextTrackStep1Key]?.nextStepLogic(onboardingAnswers[nextTrackStep1Key], onboardingAnswers);
      if (nextTrackStep2Key && TRACK_Q2_KEYS.includes(nextTrackStep2Key) && hasAnswer(nextTrackStep2Key)) {
        completedSteps++;
      }
    }
    
    // Step 4: NEW_GENERATION
    if (hasAnswer('NEW_GENERATION')) completedSteps++;
    
    // Step 5: GIVE_ADVICE_QUIZ (only if user goes this path)
    if (goesToAdviceQuiz && hasAnswer('GIVE_ADVICE_QUIZ')) {
      completedSteps++;
    }
    
    // Note: SHARER_TRACK steps are separate from the main quiz
    
    const percentage = Math.round((completedSteps / totalSteps) * 100);
    return percentage >= 100;
  })();

  return (
    <div className="relative flex flex-col h-full bg-slate-50">
      <TopTabBar setScreen={setScreen} currentScreen="FEED" />
      <div className="grow overflow-y-auto pt-30.25">
        <div className="p-4">
          {/* Show journey card until quiz is complete, then show ProfileProgress */}
          {!isJourneyComplete && showNudge && (
            <FeedJourneyCard 
              onboardingAnswers={onboardingAnswers} 
              setScreen={setScreen} 
              onClose={() => {
                setShowNudge(false);
                localStorage.setItem('quizNudgeDismissed', 'true');
              }} 
            />
          )}
          {isJourneyComplete && <ProfileProgress />}

          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
            <form onSubmit={e => {
              e.preventDefault();
              if (searchValue.trim()) {
                setSearchQuery(searchValue.trim());
                setConnectionsMode('SEARCH');
                setScreen('CONNECTIONS_DASHBOARD');
              }
            }}>
              <input
                type="text"
                placeholder="Find people, stories, or support"
                className="w-full p-3 pl-12 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-base shadow-sm"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
              />
            </form>
          </div>
          
          <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-100 w-full flex items-center gap-3 my-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0 flex items-center justify-center">
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
                  image: getAvatarUrlWithSize({ profile_photo: post.user_profile_photo, full_name: post.user_name }, 150),
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
