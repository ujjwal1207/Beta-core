import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeft, Send, Check, Loader, X } from 'lucide-react';
import { getAvatarUrlWithSize } from '../../lib/avatarUtils';
import chatService from '../../services/chatService';
import feedService from '../../services/feedService';

const PostShareScreen = () => {
  const { setScreen, previousScreen, sharePayload, setSharePayload, user } = useAppContext();
  const [recentUsers, setRecentUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0 });
  const [postData, setPostData] = useState(null);
  const [isLoadingPost, setIsLoadingPost] = useState(false);

  useEffect(() => {
    loadRecentUsers();
    if (sharePayload?.postId) {
      loadPostData();
    }
  }, []);

  const loadRecentUsers = async () => {
    try {
      setIsLoading(true);
      const response = await chatService.getConversations();
      // Extract unique users from conversations
      const users = response.map(conversation => conversation.other_user);
      setRecentUsers(users || []);
    } catch (error) {
      console.error('Failed to load recent users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPostData = async () => {
    try {
      setIsLoadingPost(true);
      const post = await feedService.getPostById(sharePayload.postId);
      setPostData(post);
    } catch (error) {
      console.error('Failed to load post data:', error);
    } finally {
      setIsLoadingPost(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendToSelected = async () => {
    if (selectedUsers.length === 0 || !sharePayload) return;

    try {
      setIsSending(true);
      setSendProgress({ sent: 0, total: selectedUsers.length });

      for (let i = 0; i < selectedUsers.length; i++) {
        const userId = selectedUsers[i];
        await chatService.sendPostShare(userId, sharePayload.postId);
        setSendProgress({ sent: i + 1, total: selectedUsers.length });
      }

      // Clear share payload and go back
      setSharePayload(null);
      setScreen(previousScreen || 'FEED');
    } catch (error) {
      console.error('Failed to send post to some users:', error);
      alert('Failed to send to some users. Please try again.');
    } finally {
      setIsSending(false);
      setSendProgress({ sent: 0, total: 0 });
    }
  };

  const handleCancel = () => {
    setSharePayload(null);
    setScreen(previousScreen || 'FEED');
  };

  if (!sharePayload || sharePayload.type !== 'post') {
    return (
      <div className="p-4">
        <p>No post to share</p>
        <button onClick={() => setScreen('FEED')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">
          Go to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm px-6 py-4 border-b border-slate-200/60 shadow-sm z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-slate-100 rounded-full transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Share Post</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              {/* <div className="text-sm font-medium text-slate-700">
                {selectedUsers.length} selected
              </div> */}
              <div className="text-xs text-slate-500">
                {selectedUsers.length > 0 ? `${selectedUsers.length} recipient${selectedUsers.length > 1 ? 's' : ''}` : 'Choose recipients'}
              </div>
            </div>
            <button
              onClick={handleSendToSelected}
              disabled={selectedUsers.length === 0 || isSending}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSending ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Sending {sendProgress.sent}/{sendProgress.total}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Post Preview */}
      <div className="bg-white/90 backdrop-blur-sm mx-6 mt-6 rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-slate-100/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-white/20"></div>
            </div>
            <h3 className="font-semibold text-slate-800">Post Preview</h3>
          </div>
        </div>
        <div className="p-6">
          {isLoadingPost ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-sm text-slate-500">Loading post...</p>
              </div>
            </div>
          ) : postData ? (
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl border border-slate-200/60">
                <img
                  src={getAvatarUrlWithSize({ profile_photo: postData.user_profile_photo }, 48)}
                  alt={postData.user_name || 'User'}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-md"
                />
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800 text-lg">
                    {postData.user_name || 'User'}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-sm text-slate-500">Posted recently</span>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="text-slate-700 leading-relaxed text-base bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                {postData.content || postData.text || 'No content'}
              </div>

              {/* Post Media */}
              {(postData.image_url || postData.video_url) && (
                <div className="rounded-2xl overflow-hidden border border-slate-200/60 shadow-lg">
                  {postData.image_url ? (
                    <img
                      src={postData.image_url}
                      alt="Post image"
                      className="w-full h-auto max-h-80 object-cover"
                    />
                  ) : (
                    <video
                      src={postData.video_url}
                      controls
                      className="w-full h-auto max-h-80 object-cover"
                      preload="metadata"
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-slate-600 font-medium">Failed to load post preview</p>
              <p className="text-sm text-slate-500 mt-1">Please try again</p>
            </div>
          )}
        </div>
      </div>

      {/* Recipients Section */}
      <div className="flex-1 px-6 py-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200/60 bg-gradient-to-r from-slate-50 to-slate-100/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Send className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Choose Recipients</h3>
                <p className="text-sm text-slate-500">Select people to share this post with</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <Loader className="w-8 h-8 animate-spin text-indigo-600" />
                  <p className="text-sm text-slate-500">Loading conversations...</p>
                </div>
              </div>
            ) : recentUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                  <Send className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="font-medium text-slate-700 mb-2">No recent conversations</h4>
                <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
                  Start chatting with people to share posts with them
                </p>
                <button
                  onClick={() => setScreen('MESSAGES')}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Go to Messages
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => toggleUserSelection(user.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer transform hover:scale-[1.01] active:scale-[0.99] ${
                      selectedUsers.includes(user.id)
                        ? 'bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-300 shadow-md'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={getAvatarUrlWithSize(user, 56)}
                          alt={user.full_name || user.name}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-white shadow-md"
                        />
                        {selectedUsers.includes(user.id) && (
                          <div className="absolute -top-1 -right-1 w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center ring-2 ring-white shadow-lg">
                            <Check className="w-4 h-4 text-white font-bold" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-800 text-lg truncate">
                          {user.full_name || user.name}
                        </h4>
                        <p className="text-sm text-slate-500 mt-1">
                          Recent conversation
                        </p>
                      </div>
                      {selectedUsers.includes(user.id) && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-sm font-medium text-emerald-600">Selected</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Select All Button */}
      {recentUsers.length > 0 && (
        <div className="px-6 pb-6">
          <button
            onClick={() => {
              if (selectedUsers.length === recentUsers.length) {
                setSelectedUsers([]);
              } else {
                setSelectedUsers(recentUsers.map(u => u.id));
              }
            }}
            className="w-full py-4 bg-gradient-to-r from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 rounded-xl transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-[1.01] active:scale-[0.99] border border-slate-300/60"
          >
            {selectedUsers.length === recentUsers.length ? (
              <div className="flex items-center justify-center gap-2">
                <X className="w-5 h-5" />
                Deselect All
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                Select All ({recentUsers.length})
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default PostShareScreen;