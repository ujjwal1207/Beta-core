import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, Loader, X, ChevronRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import TopTabBar from '../../components/layout/TopTabBar';
import PostCard from './components/PostCard';
import QuickPostStories from './components/QuickPostStories';
import FeedJourneyCard from './components/FeedJourneyCard';
import ProfileProgress from './components/ProfileProgress';
import feedService from '../../services/feedService';
import connectionsService from '../../services/connectionsService';
import { getAvatarUrlWithSize } from '../../lib/avatarUtils';

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
    setSelectedPerson,
    setPreviousScreen,
    showToast,
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

  // Smart people search in feed
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [peopleResults, setPeopleResults] = useState([]);
  const [isPeopleSearching, setIsPeopleSearching] = useState(false);
  const [suggestedPeople, setSuggestedPeople] = useState([]);
  const [requestedSmartMatchIds, setRequestedSmartMatchIds] = useState(new Set());
  const [connectingSmartMatchId, setConnectingSmartMatchId] = useState(null);

  // Pagination state
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = React.useRef(null);

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
      const feedData = await feedService.getFeed({ limit: 10, skip: 0, useVibe: true });
      setPosts(feedData);
      setSkip(10);
      setHasMore(feedData.length === 10);
    } catch (err) {
      console.error('Error fetching feed:', err);
      setError('Failed to load feed. Please try again.');
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Fetch more posts for infinite scroll
  const fetchMorePosts = async () => {
    if (!isAuthenticated || isLoadingMore || !hasMore || isLoadingPosts) return;

    try {
      setIsLoadingMore(true);
      const feedData = await feedService.getFeed({ limit: 10, skip, useVibe: true });

      if (feedData.length > 0) {
        setPosts(prev => {
          // Filter out duplicates just in case
          const newPosts = feedData.filter(newPost => !prev.some(p => p.id === newPost.id));
          return [...prev, ...newPosts];
        });
        setSkip(prev => prev + 10);
      }

      if (feedData.length < 10) {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error fetching more posts:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingPosts && !isLoadingMore) {
          fetchMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [observerTarget.current, hasMore, isLoadingPosts, isLoadingMore, skip]);

  useEffect(() => {
    const loadSentRequests = async () => {
      if (!isAuthenticated) return;
      try {
        const sentRequests = await connectionsService.getSentRequests();
        const sentIds = new Set(
          (Array.isArray(sentRequests) ? sentRequests : [])
            .map((req) => req?.receiver?.id)
            .filter(Boolean)
        );
        setRequestedSmartMatchIds(sentIds);
      } catch (err) {
        console.error('Failed to load sent requests for smart matches:', err);
      }
    };

    loadSentRequests();
  }, [isAuthenticated]);

  const openSmartMatchProfile = (person) => {
    setPreviousScreen('FEED');
    setSelectedPerson(person);
    setScreen('PROFILE_DETAIL');
  };

  const handleSmartMatchConnect = async (event, person) => {
    event.stopPropagation();

    if (!person?.id || requestedSmartMatchIds.has(person.id) || connectingSmartMatchId === person.id) {
      return;
    }

    try {
      setConnectingSmartMatchId(person.id);
      await connectionsService.sendRequest(person.id);
      setRequestedSmartMatchIds((prev) => new Set([...prev, person.id]));
      showToast('Connection request sent successfully.', 'success');
    } catch (error) {
      console.error('Failed to send smart match connection request:', error);
      showToast('Failed to send connection request. Please try again.', 'error');
    } finally {
      setConnectingSmartMatchId(null);
    }
  };

  useEffect(() => {
    fetchPosts();
    // Clear local hidden-post filters when mood changes so fresh vibe results are visible.
    setHiddenPostIds(new Set());
  }, [isAuthenticated, user?.id, user?.mood]);

  // Listen for post creation events
  useEffect(() => {
    const handlePostCreated = () => {
      fetchPosts();
    };

    const handlePostDeleted = () => {
      fetchPosts();
    };

    window.addEventListener('postCreated', handlePostCreated);
    window.addEventListener('postDeleted', handlePostDeleted);
    return () => {
      window.removeEventListener('postCreated', handlePostCreated);
      window.removeEventListener('postDeleted', handlePostDeleted);
    };
  }, [isAuthenticated]);

  // Hide a post when user clicks "not interested"
  const hidePost = (postId) => {
    setHiddenPostIds(prev => new Set([...prev, postId]));
  };

  // Clear search
  const clearSearch = () => {
    setSearchValue('');
    setPeopleResults([]);
    setIsPeopleSearching(false);
  };

  const extractUserKeywords = useMemo(() => {
    const sources = [];

    if (user?.role) sources.push(user.role);
    if (user?.industry) sources.push(user.industry);
    if (user?.expertise) sources.push(user.expertise);

    const onboardingValues = Object.values(onboardingAnswers || {});
    onboardingValues.forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === 'string') sources.push(item);
          if (item && typeof item === 'object') {
            Object.values(item).forEach((inner) => {
              if (typeof inner === 'string') sources.push(inner);
            });
          }
        });
      } else if (typeof value === 'string') {
        sources.push(value);
      }
    });

    return [...new Set(
      sources
        .join(' ')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((kw) => kw.length > 2)
    )];
  }, [onboardingAnswers, user]);

  useEffect(() => {
    const fetchSuggestedPeople = async () => {
      try {
        const data = await connectionsService.discover(12);
        const scored = (data || []).map((person) => {
          const tags = Array.isArray(person.tags) ? person.tags : [];
          const fields = [
            ...tags,
            person.role || '',
            person.industry || '',
            person.expertise || ''
          ].join(' ').toLowerCase();

          let score = 0;
          let bestMatchTag = 'Community Pick';
          extractUserKeywords.forEach((keyword) => {
            if (fields.includes(keyword)) {
              score += 1;
              if (bestMatchTag === 'Community Pick') {
                bestMatchTag = keyword;
              }
            }
          });

          return { ...person, score, bestMatchTag };
        });

        scored.sort((a, b) => b.score - a.score);
        setSuggestedPeople(scored.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch suggested connections:', err);
        setSuggestedPeople([]);
      }
    };

    if (isAuthenticated) {
      fetchSuggestedPeople();
    }
  }, [extractUserKeywords, isAuthenticated]);

  useEffect(() => {
    if (!searchValue.trim()) {
      setPeopleResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsPeopleSearching(true);
        const results = await connectionsService.search(searchValue.trim(), 5);

        const mapped = (results || []).map((person) => {
          const tags = Array.isArray(person.tags) ? person.tags : [];
          const search = searchValue.trim().toLowerCase();
          const matchedTags = tags.filter((tag) => String(tag).toLowerCase().includes(search));
          return { ...person, matchedTags };
        });

        setPeopleResults(mapped);
      } catch (err) {
        console.error('Error searching people:', err);
        setPeopleResults([]);
      } finally {
        setIsPeopleSearching(false);
      }
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const goToConnectionsSearch = () => {
    if (!searchValue.trim()) return;
    setSearchQuery(searchValue.trim());
    setConnectionsMode('SEARCH');
    setScreen('CONNECTIONS_DASHBOARD');
  };

  // Helper: check if profile journey is complete (Education + Focus + Looking For)
  const isJourneyComplete = (() => {
    const hasText = (value) => String(value || '').trim().length > 0;
    const educationList = Array.isArray(user?.education) ? user.education : [];
    const hasEducation = educationList.some((item) => hasText(item?.name));
    const hasFocus = hasText(user?.industry);
    const hasLookingFor = hasText(user?.exploring || onboardingAnswers?.LOOKING_FOR);

    return hasEducation && hasFocus && hasLookingFor;
  })();

  return (
    <div className="relative flex flex-col h-full bg-slate-50">
      <TopTabBar setScreen={setScreen} currentScreen="FEED" />
      <div className="grow overflow-y-auto pt-30.25">
        <div className="p-4">
          {/* Always show mood meter */}
          <ProfileProgress />

          {/* Show journey card until quiz is complete */}
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

          <div className="relative mb-4 z-20">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search network (Press Enter for full search)..."
              className="w-full p-3 pl-12 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-base shadow-sm"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  goToConnectionsSearch();
                }
              }}
            />
            {searchValue && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}

            {isSearchFocused && searchValue.trim() && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                {isPeopleSearching ? (
                  <div className="p-4 flex items-center justify-center">
                    <Loader className="w-5 h-5 text-indigo-500 animate-spin" />
                  </div>
                ) : peopleResults.length > 0 ? (
                  <>
                    {peopleResults.map((person) => (
                      <button
                        key={person.id}
                        onClick={() => {
                          setPreviousScreen('FEED');
                          setSelectedPerson(person);
                          setScreen('PROFILE_DETAIL');
                        }}
                        className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-start transition-colors"
                      >
                        <img
                          src={getAvatarUrlWithSize(person, 100)}
                          alt={person.full_name || 'Profile'}
                          className="w-10 h-10 rounded-full mr-3 shrink-0 object-cover"
                        />
                        <div className="grow min-w-0">
                          <p className="font-bold text-sm text-slate-800 truncate">{person.full_name}</p>
                          <p className="text-xs text-slate-500 truncate">{person.role || 'ListenLink member'}</p>
                          {person.matchedTags?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {person.matchedTags.slice(0, 2).map((tag) => (
                                <span key={tag} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full border border-indigo-100 whitespace-nowrap">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                    <button
                      onClick={goToConnectionsSearch}
                      className="w-full p-3 text-center text-xs font-bold text-indigo-600 hover:bg-indigo-50 bg-slate-50 border-t border-indigo-100"
                    >
                      See all results for "{searchValue}"
                    </button>
                  </>
                ) : (
                  <div className="p-4 text-center text-sm text-slate-500">No people found. Try another search.</div>
                )}
              </div>
            )}
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

          {suggestedPeople.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Smart Matches For You</h2>
              </div>
              <div className="flex overflow-x-auto hide-scrollbar space-x-3 pb-2 -mx-4 px-4">
                {suggestedPeople.map((person) => (
                  <div
                    key={person.id}
                    onClick={() => openSmartMatchProfile(person)}
                    className="min-w-35 max-w-35 bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex flex-col items-center text-center shrink-0 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <img
                      src={getAvatarUrlWithSize(person, 100)}
                      alt={person.full_name || 'Profile'}
                      className="w-12 h-12 rounded-full mb-2 object-cover"
                    />
                    <p className="font-bold text-sm text-slate-800 truncate w-full">{person.full_name?.split(' ')[0]}</p>
                    <p className="text-[10px] text-slate-500 truncate w-full mb-2">{person.role || 'ListenLink member'}</p>
                    <div className="mt-auto w-full">
                      <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[9px] font-bold rounded-full mb-2 truncate w-full border border-indigo-100">
                        {person.bestMatchTag === 'Community Pick' ? 'Community Pick' : `Match: ${person.bestMatchTag}`}
                      </span>
                      <button
                        onClick={(e) => handleSmartMatchConnect(e, person)}
                        disabled={requestedSmartMatchIds.has(person.id) || connectingSmartMatchId === person.id}
                        className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-indigo-600 border border-slate-200 text-xs font-bold rounded-lg transition-colors active:scale-95"
                      >
                        {connectingSmartMatchId === person.id
                          ? 'Connecting...'
                          : requestedSmartMatchIds.has(person.id)
                            ? 'Requested'
                            : (
                              <>
                                Connect <ChevronRight className="w-3 h-3 inline" />
                              </>
                            )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-bold text-slate-800">
              Recent Posts
            </h2>
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
                    timestamp: new Date(post.created_at * 1000).toLocaleDateString(),
                    imageUrl: post.image_url,
                    videoUrl: post.video_url,
                    type: post.type,
                    isLiked: post.is_liked,
                    tags: post.tags,
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

          {/* Infinite Scroll Target */}
          {posts.length > 0 && !error && (
            <div ref={observerTarget} className="py-8 flex justify-center">
              {isLoadingMore ? (
                <Loader className="w-6 h-6 text-indigo-500 animate-spin" />
              ) : !hasMore ? (
                <p className="text-slate-400 text-sm">You've caught up on all posts!</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedScreen;
