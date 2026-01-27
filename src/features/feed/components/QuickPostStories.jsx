import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import feedService from '../../../services/feedService';

const QuickPostStories = ({ setIsAddReflectionModalOpen, setViewingStory }) => {
  const { user } = useAppContext();
  const [stories, setStories] = useState([]);
  const [userHasStory, setUserHasStory] = useState(false);
  const [viewedStoryIds, setViewedStoryIds] = useState(new Set());

  useEffect(() => {
    fetchStories();
    fetchViewedStories();
  }, []);

  const fetchViewedStories = async () => {
    try {
      const viewedIds = await feedService.getViewedStoryIds();
      setViewedStoryIds(new Set(viewedIds));
    } catch (error) {
      console.error('Error fetching viewed stories:', error);
    }
  };

  const fetchStories = async () => {
    try {
      const [allStories, connections] = await Promise.all([
        feedService.getStories(),
        import('../../../services/connectionsService').then(m => m.default.getMyConnections())
      ]);

      // Build a set of connected user IDs
      const connectedUserIds = new Set(connections.map(conn => conn.id));
      if (user) connectedUserIds.add(user.id); // Always include self

      // Group stories by user (keep all stories per user)
      const storiesByUser = {};
      allStories.forEach(story => {
        if (!connectedUserIds.has(story.user_id)) return; // Only allow connections' stories
        if (!storiesByUser[story.user_id]) {
          storiesByUser[story.user_id] = [];
        }
        storiesByUser[story.user_id].push(story);
      });

      // Sort each user's stories by creation time
      Object.keys(storiesByUser).forEach(userId => {
        storiesByUser[userId].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      });

      // Check if current user has stories and format as story group
      let currentUserStoryGroup = null;
      if (user && storiesByUser[user.id]) {
        const userStories = storiesByUser[user.id];
        currentUserStoryGroup = {
          userId: user.id,
          stories: userStories,
          user_id: userStories[0].user_id,
          user_name: userStories[0].user_name,
          user_profile_photo: userStories[0].user_profile_photo,
          created_at: userStories[userStories.length - 1].created_at
        };
      }
      setUserHasStory(currentUserStoryGroup);

      // Convert to array of user story groups
      const storyList = Object.entries(storiesByUser)
        .filter(([userId]) => !user || parseInt(userId) !== user.id) // Exclude current user from list
        .map(([userId, userStories]) => ({
          userId: parseInt(userId),
          stories: userStories,
          // Use first story for display info
          user_id: userStories[0].user_id,
          user_name: userStories[0].user_name,
          user_profile_photo: userStories[0].user_profile_photo,
          created_at: userStories[userStories.length - 1].created_at // Latest story time
        }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10); // Limit to 10 users

      setStories(storyList);
    } catch (error) {
      console.error('Error fetching stories:', error);
    }
  };

  // Listen for new story events
  useEffect(() => {
    const handleStoryCreated = () => {
      fetchStories();
      fetchViewedStories();
    };

    const handleStoryDeleted = () => {
      fetchStories();
      fetchViewedStories();
    };

    window.addEventListener('postCreated', handleStoryCreated);
    window.addEventListener('postDeleted', handleStoryDeleted);
    return () => {
      window.removeEventListener('postCreated', handleStoryCreated);
      window.removeEventListener('postDeleted', handleStoryDeleted);
    };
  }, [user]);

  // Check if all stories in a group have been viewed
  const areAllStoriesViewed = (storyGroup) => {
    return storyGroup.stories.every(story => viewedStoryIds.has(story.id));
  };

  return (
    <div className="w-full mb-4 pb-4 overflow-x-auto border-b border-slate-200 hide-scrollbar">
      <div className="flex flex-row items-end gap-4 pl-2">
        <div className="flex flex-col items-center relative w-20">
          <button
            onClick={() => userHasStory ? setViewingStory(userHasStory) : setIsAddReflectionModalOpen(true)}
            className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
              userHasStory 
                ? 'border-indigo-500 p-0.5' 
                : 'border-dashed border-slate-400'
            } bg-slate-100 hover:bg-slate-200 transition-all`}
            aria-label={userHasStory ? "View your reflection" : "Add your reflection"}
          >
            {userHasStory ? (
              <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                {user?.profile_photo ? (
                  <img 
                    src={user.profile_photo} 
                    alt="Your story" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-lg font-bold text-slate-700">{user?.full_name?.[0] || 'Y'}</span>
                )}
              </div>
            ) : (
              <Plus className="w-7 h-7 text-slate-500" />
            )}
          </button>
          {userHasStory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsAddReflectionModalOpen(true);
              }}
              className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center border-2 border-white hover:bg-indigo-600 transition-all"
              aria-label="Add another reflection"
            >
              <Plus className="w-3 h-3 text-white" />
            </button>
          )}
          <p className="text-xs text-slate-600 mt-2 font-medium w-full text-center truncate">
            {userHasStory ? user?.full_name?.split(' ')[0] || 'You' : 'Reflections'}
          </p>
        </div>
        {stories.map((storyGroup) => {
          const isViewed = areAllStoriesViewed(storyGroup);
          return (
            <div key={storyGroup.userId} className="flex flex-col items-center w-20">
              <button
                onClick={() => setViewingStory(storyGroup)}
                className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                  isViewed ? 'border-gray-400' : 'border-rose-500'
                } p-0.5`}
                aria-label={`View reflection from ${storyGroup.user_name}`}
              >
                <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-700 overflow-hidden">
                  {storyGroup.user_profile_photo ? (
                    <img 
                      src={storyGroup.user_profile_photo} 
                      alt={storyGroup.user_name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span>{storyGroup.user_name?.[0] || '?'}</span>
                  )}
                </div>
              </button>
              <p className="text-xs text-slate-600 mt-2 w-full text-center truncate">
                {storyGroup.user_name?.split(' ')[0] || 'User'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuickPostStories;