import React, { useState, useEffect, useRef } from 'react';
import { X, Pause, Play, Eye } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import feedService from '../../../services/feedService';

const StoryViewerModal = ({ person, onClose }) => {
    const [replyText, setReplyText] = useState("");
    const [isReplying, setIsReplying] = useState(false);
    const [replySent, setReplySent] = useState(false);
  const { setScreen, setPreviousScreen, setSelectedPerson, user } = useAppContext();
  
  // Check if this is a story group (with stories array) or single story/person
  const isStoryGroup = person?.stories !== undefined;
  const stories = isStoryGroup ? person.stories : (person ? [person] : []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [showViewers, setShowViewers] = useState(false);
  const [isLoadingViewers, setIsLoadingViewers] = useState(false);
  
  // Use ref for onClose to avoid re-running effect when it changes
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Check if current story is owned by the user
  const currentStory = stories[currentIndex];
  const isOwnStory = user && currentStory && (currentStory.user_id === user.id);

  // Fetch viewers for own story
  const fetchViewers = async () => {
    if (!isOwnStory || !currentStory?.id) return;
    
    setIsLoadingViewers(true);
    try {
      const data = await feedService.getStoryViewers(currentStory.id);
      // Filter out the current user from viewers list
      const filteredViewers = (data.viewers || []).filter(viewer => viewer.user_id !== user.id);
      setViewers(filteredViewers);
    } catch (error) {
      console.error('Error fetching story viewers:', error);
    } finally {
      setIsLoadingViewers(false);
    }
  };

  // Fetch viewers when viewing own story or when story changes
  useEffect(() => {
    if (isOwnStory && showViewers) {
      fetchViewers();
    }
  }, [currentIndex, isOwnStory, showViewers]);

  // Mark story as viewed when displayed
  useEffect(() => {
    const markViewed = async () => {
      const currentStory = stories[currentIndex];
      if (currentStory?.id && currentStory?.type === 'story') {
        try {
          await feedService.markStoryViewed(currentStory.id);
        } catch (error) {
          console.error('Error marking story as viewed:', error);
        }
      }
    };
    
    markViewed();
  }, [currentIndex, stories]);

  // Auto-advance to next story
  useEffect(() => {
    if (!person || isPaused) {
      if (isPaused) console.log(`[Story Timer] Timer paused for story ${currentIndex + 1}`);
      return;
    }
    
    console.log(`[Story Timer] Starting timer for story ${currentIndex + 1}/${stories.length}`);
    const timer = setTimeout(() => {
      console.log(`[Story Timer] Timer fired for story ${currentIndex + 1}`);
      if (currentIndex < stories.length - 1) {
        console.log(`[Story Timer] Advancing to story ${currentIndex + 2}`);
        setCurrentIndex(prev => prev + 1);
      } else {
        console.log(`[Story Timer] Last story reached, closing viewer`);
        onCloseRef.current();
      }
    }, 5000);
    
    return () => {
      console.log(`[Story Timer] Clearing timer for story ${currentIndex + 1}`);
      clearTimeout(timer);
    };
  }, [currentIndex, stories.length, isPaused, person]);
  
  // Early return after all hooks are defined
  if (!person) return null;
  
  // Check if current item is a story object
  const isStory = currentStory.content !== undefined;
  
  // Get story data
  const storyText = isStory ? currentStory.content : (currentStory.sharerInsights?.youngerSelf || currentStory.bio || "Welcome to my story!");
  const userName = isStory ? currentStory.user_name : currentStory.name;
  const userPhoto = isStory ? currentStory.user_profile_photo : currentStory.image;
  const storyImage = isStory ? currentStory.image_url : null;
  const storyVideo = isStory ? currentStory.video_url : null;
  
  // Get custom styling if available
  const style = isStory && currentStory.style ? currentStory.style : {};
  const backgroundColor = style.backgroundColor || 'bg-gradient-to-br from-indigo-600 to-purple-700';
  const textColor = style.textColor || 'text-white';
  const textStyle = style.textStyle || 'font-normal';

  // Click handlers for navigation
  const handlePrevious = (e) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handleNameClick = (e) => {
    e.stopPropagation();
    setPreviousScreen('FEED');
    
    // Create a consistent user object from story data
    // Use the first story in the group for user info (all stories share same user_id)
    const userObject = {
      id: stories[0].user_id,  // ProfileDetailScreen expects 'id' field
      user_id: stories[0].user_id,
      user_name: stories[0].user_name,
      user_profile_photo: stories[0].user_profile_photo,
      user_role: stories[0].user_role,
      user_trust_score: stories[0].user_trust_score
    };
    
    console.log('[StoryViewerModal] Navigating to profile for user:', userObject);
    setSelectedPerson(userObject);
    onClose();
    setScreen('PROFILE_DETAIL');
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex justify-center items-center p-2" 
      onClick={onClose}
    >
      <div 
        className={`relative ${backgroundColor} rounded-2xl shadow-2xl w-full max-w-md h-full sm:h-[90vh] sm:max-h-175 overflow-hidden flex flex-col p-4`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bars */}
        <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
          {stories.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className={`h-1 bg-white rounded-full ${
                  index < currentIndex ? 'w-full' : 
                  index === currentIndex ? 'w-0' : 
                  'w-0'
                }`}
                style={index === currentIndex ? { 
                  animation: 'progress 5s linear forwards',
                  animationPlayState: isPaused ? 'paused' : 'running'
                } : index < currentIndex ? { width: '100%' } : { width: '0%' }}
                key={`progress-${index}-${currentIndex}`}
              ></div>
            </div>
          ))}
        </div>
        
        {/* Click areas for navigation */}
        {stories.length > 1 && (
          <>
            <div 
              className="absolute left-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
              onClick={handlePrevious}
            />
            <div 
              className="absolute right-0 top-0 bottom-0 w-1/3 z-10 cursor-pointer"
              onClick={handleNext}
            />
          </>
        )}
        
        {/* Header */}
        <div className="flex items-center pt-4 z-10">
          <button 
            onClick={handleNameClick}
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-slate-200 flex items-center justify-center">
              {userPhoto ? (
                <img 
                  src={userPhoto} 
                  alt={userName} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-sm font-bold text-slate-700">{userName?.[0] || '?'}</span>
              )}
            </div>
            <span className="ml-3 text-sm font-bold text-white">{userName}</span>
          </button>
          {stories.length > 1 && (
            <span className="ml-auto mr-2 text-xs text-white/80">
              {currentIndex + 1}/{stories.length}
            </span>
          )}
          <div className="flex items-center ml-auto gap-2">
            {isOwnStory && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowViewers(!showViewers);
                }} 
                className="p-2 rounded-full hover:bg-white/20 transition-all"
                aria-label="View story viewers"
              >
                <Eye className="w-5 h-5 text-white" />
              </button>
            )}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsPaused(!isPaused);
              }} 
              className="p-2 rounded-full hover:bg-white/20 transition-all"
              aria-label={isPaused ? "Play" : "Pause"}
            >
              {isPaused ? (
                <Play className="w-5 h-5 text-white" />
              ) : (
                <Pause className="w-5 h-5 text-white" />
              )}
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="grow flex flex-col justify-center items-center text-center p-6">
          {storyImage ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <img 
                src={storyImage} 
                alt="Story content" 
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              {storyText && (
                <p className={`mt-4 text-xl ${textColor} ${textStyle} leading-tight shadow-text`}>
                  "{storyText}"
                </p>
              )}
            </div>
          ) : storyVideo ? (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <video 
                src={storyVideo} 
                controls 
                className="max-w-full max-h-full object-contain rounded-lg"
              />
              {storyText && (
                <p className={`mt-4 text-xl ${textColor} ${textStyle} leading-tight shadow-text`}>
                  "{storyText}"
                </p>
              )}
            </div>
          ) : (
            <p className={`text-2xl ${textColor} ${textStyle} leading-tight shadow-text`}>
              "{storyText}"
            </p>
          )}
        </div>

        {/* Footer - Only show reply for other users' stories */}
        {!isOwnStory && (
          <div className="w-full p-2 z-10 flex gap-2 items-center">
            <input
              type="text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Reply to this story..."
              className="flex-1 p-3 bg-white/20 border border-white/30 rounded-full text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white"
              disabled={isReplying}
            />
            <button
              onClick={async () => {
                if (!replyText.trim() || isReplying) return;
                setIsReplying(true);
                try {
                  // Send reply to story author via chat
                  const receiverId = currentStory.user_id;
                  await import("../../../services/chatService").then(({ chatService }) =>
                    chatService.sendMessage(receiverId, `[Story Reply] ${replyText}`)
                  );
                  setReplySent(true);
                  setReplyText("");
                  setTimeout(() => setReplySent(false), 2000);
                } catch {
                  alert("Failed to send reply. Try again.");
                } finally {
                  setIsReplying(false);
                }
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-full disabled:opacity-50 hover:bg-indigo-700 transition-all"
              disabled={!replyText.trim() || isReplying}
            >
              Send
            </button>
            {replySent && (
              <span className="ml-2 text-green-400 font-semibold">Reply sent!</span>
            )}
          </div>
        )}

        {/* Viewers List Modal */}
        {showViewers && isOwnStory && (
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/20">
              <h3 className="text-lg font-bold text-white">
                Viewers ({viewers.length})
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowViewers(false);
                }}
                className="p-2 rounded-full hover:bg-white/10 transition-all"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingViewers ? (
                <p className="text-white text-center py-4">Loading viewers...</p>
              ) : viewers.length === 0 ? (
                <p className="text-white/70 text-center py-4">No views yet</p>
              ) : (
                <div className="space-y-3">
                  {viewers.map((viewer) => (
                    <div 
                      key={viewer.user_id} 
                      className="flex items-center gap-3 p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {viewer.user_profile_photo ? (
                          <img 
                            src={viewer.user_profile_photo} 
                            alt={viewer.user_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-slate-700">
                            {viewer.user_name?.[0] || '?'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {viewer.user_name}
                        </p>
                        {viewer.user_role && (
                          <p className="text-white/70 text-sm truncate">
                            {viewer.user_role}
                          </p>
                        )}
                      </div>
                      <div className="text-white/60 text-xs">
                        {new Date(viewer.viewed_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewerModal;
