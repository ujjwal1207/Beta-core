import React, { useState, useEffect, useMemo } from 'react';
import { Search, User, Loader, X, ChevronRight, Tag } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import TopTabBar from '../../components/layout/TopTabBar';
import PostCard from './components/PostCard';
import QuickPostStories from './components/QuickPostStories';
import FeedJourneyCard from './components/FeedJourneyCard';

import feedService from '../../services/feedService';
import connectionsService from '../../services/connectionsService';
import { getAvatarUrlWithSize } from '../../lib/avatarUtils';

const getJourneyDismissedKey = (userId) => `quizNudgeDismissed:${userId || 'anonymous'}`;

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

  const [showNudge, setShowNudge] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [posts, setPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [error, setError] = useState(null);
  const [hiddenPostIds, setHiddenPostIds] = useState(new Set());
  const [activeTagFilter, setActiveTagFilter] = useState(null); // active post tag filter
  const [isSearchFocused, setIsSearchFocused] = useState(false);

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
      const feedData = await feedService.getFeed({ limit: 10, skip: 0 });
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
      const feedData = await feedService.getFeed({ limit: 10, skip });

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
    setHiddenPostIds(new Set());
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setShowNudge(true);
      return;
    }

    const dismissed = localStorage.getItem(getJourneyDismissedKey(user.id));
    setShowNudge(dismissed !== 'true');
  }, [isAuthenticated, user?.id]);

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
    setActiveTagFilter(null);
    setIsSearchFocused(false);
  };

  // All tags from currently loaded posts (for autocomplete)
  const allPostTags = useMemo(() => {
    const tagSet = new Set();
    posts.forEach(p => (p.tags || []).forEach(t => tagSet.add(t)));
    return [...tagSet].sort();
  }, [posts]);

  // Tag suggestions matching current search input
  const tagSuggestions = useMemo(() => {
    if (!searchValue.trim()) return [];
    const q = searchValue.trim().toLowerCase();
    return allPostTags.filter(t => t.toLowerCase().includes(q)).slice(0, 8);
  }, [searchValue, allPostTags]);

  const filteredVisiblePosts = useMemo(
    () => posts
      .filter(post => !hiddenPostIds.has(post.id))
      .filter(post => !activeTagFilter || (post.tags || []).some(t => t.toLowerCase() === activeTagFilter.toLowerCase())),
    [posts, hiddenPostIds, activeTagFilter]
  );

  const extractUserKeywords = useMemo(() => {
    const sources = [];
    const excludedKeywords = new Set(['and', 'the', 'age', 'years', 'year', 'old']);

    if (user?.role) sources.push(user.role);
    if (user?.industry) sources.push(user.industry);
    if (user?.expertise) sources.push(user.expertise);
    
    const lookingFor = user?.exploring || onboardingAnswers?.LOOKING_FOR;
    if (lookingFor) {
      sources.push(lookingFor);
    }

    return [...new Set(
      sources
        .join(' ')
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((kw) => kw.length > 2 && !excludedKeywords.has(kw))
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


  // Helper: check if profile journey is complete (Education + Focus + Looking For)
  const isJourneyComplete = (() => {
    const hasText = (value) => String(value || '').trim().length > 0;
    const educationList = Array.isArray(user?.education) ? user.education : [];
    const hasEducation = educationList.some((item) => hasText(item?.name));
    const hasFocus = hasText(user?.industry);
    const hasLookingFor = hasText(user?.exploring || onboardingAnswers?.LOOKING_FOR);

    return hasEducation && hasFocus && hasLookingFor;
  })();

  const smartMatchCardsPerBlock = 3;
  const smartMatchInsertInterval = 3;

  const getSmartMatchSlice = (blockIndex) => {
    if (!Array.isArray(suggestedPeople) || suggestedPeople.length === 0) return [];

    const take = Math.min(smartMatchCardsPerBlock, suggestedPeople.length);
    const start = (blockIndex * take) % suggestedPeople.length;
    const end = start + take;

    if (end <= suggestedPeople.length) {
      return suggestedPeople.slice(start, end);
    }

    return [
      ...suggestedPeople.slice(start),
      ...suggestedPeople.slice(0, end - suggestedPeople.length),
    ];
  };

  const getSmartMatchVisualTone = (person) => {
    const score = Number(person?.score || 0);
    const hasKeywordMatch = person?.bestMatchTag && person.bestMatchTag !== 'Community Pick';

    if (score >= 3) {
      return {
        levelLabel: 'High Match',
        cardClass: 'bg-emerald-50 border-emerald-200',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600',
      };
    }

    if (score >= 2) {
      return {
        levelLabel: hasKeywordMatch ? 'Keyword Match' : 'Strong Match',
        cardClass: 'bg-amber-50 border-amber-200',
        badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        buttonClass: 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600',
      };
    }

    if (score >= 1) {
      return {
        levelLabel: 'Potential Match',
        cardClass: 'bg-sky-50 border-sky-200',
        badgeClass: 'bg-sky-100 text-sky-800 border-sky-200',
        buttonClass: 'bg-sky-600 hover:bg-sky-700 text-white border-sky-600',
      };
    }

    return {
      levelLabel: 'Community Pick',
      cardClass: 'bg-rose-50 border-rose-200',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
      buttonClass: 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600',
    };
  };

  return (
    <div className="relative flex flex-col h-full bg-slate-50">
      <TopTabBar setScreen={setScreen} currentScreen="FEED" />
      <div className="grow overflow-y-auto pt-14 pb-20">
        <div className="p-4">


          {/* Show journey card until quiz is complete */}
          {!isJourneyComplete && showNudge && (
            <FeedJourneyCard
              onboardingAnswers={onboardingAnswers}
              setScreen={setScreen}
              onClose={() => {
                setShowNudge(false);
                if (user?.id) {
                  localStorage.setItem(getJourneyDismissedKey(user.id), 'true');
                }
              }}
            />
          )}

          <div className="relative mb-3 z-20">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter posts by tag (e.g. Career Growth, Startups)..."
              className="w-full p-3 pl-12 border border-slate-300 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 text-base shadow-sm bg-white"
              value={searchValue}
              onChange={(e) => { setSearchValue(e.target.value); setIsSearchFocused(true); }}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') clearSearch();
              }}
            />
            {(searchValue || activeTagFilter) && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}

            {/* Tag suggestion dropdown */}
            {isSearchFocused && searchValue.trim() && tagSuggestions.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
                <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filter posts by tag</p>
                {tagSuggestions.map(tag => (
                  <button
                    key={tag}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setActiveTagFilter(tag);
                      setSearchValue('');
                      setIsSearchFocused(false);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 flex items-center gap-2 transition-colors border-b border-slate-50 last:border-0"
                  >
                    <Tag className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="text-sm font-medium text-slate-700">{tag}</span>
                  </button>
                ))}
                {tagSuggestions.length === 0 && (
                  <p className="p-4 text-sm text-slate-400 text-center">No matching tags found</p>
                )}
              </div>
            )}
          </div>

          {/* Active tag filter chip */}
          {activeTagFilter && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-slate-500">Showing posts tagged:</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                <Tag className="w-3 h-3" />
                {activeTagFilter}
                <button onClick={() => setActiveTagFilter(null)} className="ml-0.5 hover:opacity-75">
                  <X className="w-3 h-3" />
                </button>
              </span>
            </div>
          )}

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
          ) : filteredVisiblePosts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500">
                {activeTagFilter ? `No posts tagged "${activeTagFilter}" yet.` : 'No posts yet. Be the first to share!'}
              </p>
            </div>
          ) : (
            filteredVisiblePosts.map((post, index) => {
              const shouldInsertSmartMatches =
                suggestedPeople.length > 0 &&
                (index + 1) % smartMatchInsertInterval === 0 &&
                index < filteredVisiblePosts.length - 1;

              const smartMatchBlockIndex = Math.floor((index + 1) / smartMatchInsertInterval) - 1;
              const smartMatchesForBlock = shouldInsertSmartMatches
                ? getSmartMatchSlice(smartMatchBlockIndex)
                : [];

              return (
                <React.Fragment key={post.id}>
                  <PostCard
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

                  {shouldInsertSmartMatches && smartMatchesForBlock.length > 0 && (
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Smart Matches For You</h2>
                      </div>
                      <div className="flex overflow-x-auto hide-scrollbar space-x-3 pb-2 -mx-4 px-4">
                        {smartMatchesForBlock.map((person) => (
                          (() => {
                            const tone = getSmartMatchVisualTone(person);

                            return (
                              <div
                                key={`${post.id}-${person.id}`}
                                onClick={() => openSmartMatchProfile(person)}
                                className={`min-w-35 max-w-35 border rounded-xl p-3 shadow-sm flex flex-col items-center text-center shrink-0 hover:shadow-md transition-shadow cursor-pointer ${tone.cardClass}`}
                              >
                                <img
                                  src={getAvatarUrlWithSize(person, 100)}
                                  alt={person.full_name || 'Profile'}
                                  className="w-12 h-12 rounded-full mb-2 object-cover"
                                />
                                <p className="font-bold text-sm text-slate-800 truncate w-full">{person.full_name?.split(' ')[0]}</p>
                                <p className="text-[10px] text-slate-500 truncate w-full mb-2">{person.role || 'ListenLink member'}</p>
                                <div className="mt-auto w-full">
                                  <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-full mb-1 truncate w-full border ${tone.badgeClass}`}>
                                    {tone.levelLabel}
                                  </span>
                                  {person.bestMatchTag !== 'Community Pick' && (
                                    <span className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-full mb-2 truncate w-full border ${tone.badgeClass}`}>
                                      {`Keyword: ${person.bestMatchTag}`}
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => handleSmartMatchConnect(e, person)}
                                    disabled={requestedSmartMatchIds.has(person.id) || connectingSmartMatchId === person.id}
                                    className={`w-full py-1.5 border text-xs font-bold rounded-lg transition-colors active:scale-95 disabled:bg-slate-100 disabled:text-slate-500 disabled:border-slate-200 ${tone.buttonClass}`}
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
                            );
                          })()
                        ))}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              );
            })
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
