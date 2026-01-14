import React, { useState, useRef, useEffect } from 'react';
import { Heart, MessageSquare, Send, Bookmark, Repeat, X, MoreVertical, User, EyeOff, UserX, Edit, Trash2 } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import MoodDisplay from '../../../components/ui/MoodDisplay';
import engagementService from '../../../services/engagementService';
import feedService from '../../../services/feedService';
import { getUserInitials } from '../../../lib/avatarUtils';

const PostCard = ({ post, onUpdate, onHide, showNotInterested = true }) => {
  const { setScreen, setSelectedPerson, setPreviousScreen, user } = useAppContext();
  const [isLiked, setIsLiked] = useState(post.isLiked || post.is_liked || false);
  const [isSaved, setIsSaved] = useState(post.isSaved || post.is_saved || false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isImageFullscreen, setIsImageFullscreen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content || post.text || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReposting, setIsReposting] = useState(false);
  const [viewingOriginalPost, setViewingOriginalPost] = useState(false);
  const [originalPostData, setOriginalPostData] = useState(null);
  const [isLoadingOriginal, setIsLoadingOriginal] = useState(false);
  const menuRef = useRef(null);
  
  const isOwnPost = user && (post.user_id === user.id || post.userId === user.id);
  const isRepost = post.is_repost || post.isRepost;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleNameClick = () => {
    setPreviousScreen('FEED');
    // Create a user object from post data for ProfileDetailScreen
    const userObject = {
      id: post.user_id || post.userId,
      name: post.user_name || post.userName || post.name,
      full_name: post.user_name || post.userName || post.name,
      role: post.user_role || post.userRole || post.role,
      trust_score: post.user_trust_score || post.userTrustScore || post.trustScore,
      profile_photo: post.user_profile_photo || post.userProfilePhoto || post.profilePhoto
    };
    setSelectedPerson(userObject);
    setScreen('PROFILE_DETAIL');
  };

  const handleViewProfile = () => {
    setShowMenu(false);
    handleNameClick();
  };

  const handleCommenterClick = (comment) => {
    setPreviousScreen('FEED');
    // Create a user object from comment data for ProfileDetailScreen
    const userObject = {
      id: comment.user_id,
      name: comment.user_name,
      full_name: comment.user_name,
      role: comment.user_role,
      profile_photo: comment.user_profile_photo
    };
    setSelectedPerson(userObject);
    setScreen('PROFILE_DETAIL');
  };

  const handleNotInterested = () => {
    setShowMenu(false);
    if (onHide) {
      onHide(post.id);
    }
    if (onUpdate) onUpdate();
  };

  const handleRemoveUser = () => {
    setShowMenu(false);
    console.log('Remove user:', post.user_id);
    // TODO: Implement block/mute user functionality
    if (onUpdate) onUpdate();
  };

  const handleEditPost = () => {
    setShowMenu(false);
    setIsEditMode(true);
    setEditedContent(post.content || post.text || '');
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedContent(post.content || post.text || '');
  };

  const handleSaveEdit = async () => {
    if (!editedContent.trim() || isUpdating) return;
    
    setIsUpdating(true);
    try {
      await feedService.updatePost(post.id, { content: editedContent });
      setIsEditMode(false);
      if (onUpdate) onUpdate({ ...post, content: editedContent });
    } catch (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeletePost = () => {
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await feedService.deletePost(post.id);
      if (onUpdate) onUpdate(null, post.id); // Pass null and postId to indicate deletion
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      const result = await engagementService.toggleLike(post.id);
      setIsLiked(result.is_liked);
      setLikesCount(result.new_likes_count);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const result = await feedService.toggleSavePost(post.id);
      setIsSaved(result.is_saved);
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRepost = async () => {
    if (isReposting) return;
    
    setIsReposting(true);
    try {
      await feedService.repostPost(post.id);
      alert('Post reposted successfully!');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error reposting:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to repost';
      alert(errorMsg);
    } finally {
      setIsReposting(false);
    }
  };

  const handleViewOriginalPost = async () => {
    const originalPostId = post.original_post_id || post.originalPostId;
    if (!originalPostId || isLoadingOriginal) return;

    setIsLoadingOriginal(true);
    try {
      const originalPost = await feedService.getPostById(originalPostId);
      setOriginalPostData(originalPost);
      setViewingOriginalPost(true);
    } catch (error) {
      console.error('Error fetching original post:', error);
      alert('Failed to load original post');
    } finally {
      setIsLoadingOriginal(false);
    }
  };

  const handleCloseOriginalPost = () => {
    setViewingOriginalPost(false);
    setOriginalPostData(null);
  };

  const handleCommentClick = async () => {
    if (!showComments) {
      // Load comments when opening
      setIsLoadingComments(true);
      try {
        const fetchedComments = await engagementService.getComments(post.id);
        setComments(fetchedComments);
      } catch (error) {
        console.error('Error loading comments:', error);
      } finally {
        setIsLoadingComments(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || isCommenting) return;

    setIsCommenting(true);
    try {
      const newComment = await engagementService.addComment(post.id, commentText);
      setComments([...comments, newComment]);
      setCommentsCount(commentsCount + 1);
      setCommentText('');
      
      // Notify parent to refresh if needed
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsCommenting(false);
    }
  };

  return (
    <div className="bg-white p-4 mb-4 rounded-xl shadow-sm border border-slate-100 w-full">
      {/* Repost Indicator */}
      {isRepost && (post.original_post_user_name || post.originalPostUserName) && (
        <div className="flex items-center text-xs text-slate-500 mb-2">
          <Repeat className="w-3 h-3 mr-1" />
          <span>{post.name || post.user_name} reposted from {post.original_post_user_name || post.originalPostUserName}</span>
        </div>
      )}
      
      <div className="flex items-center mb-3">
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-base mr-3 overflow-hidden">
          {(post.image || post.user_profile_photo) ? (
            <img src={post.image || post.user_profile_photo} alt={post.name || post.user_name} className="w-full h-full object-cover" />
          ) : (
            <span>{getUserInitials({ full_name: post.name || post.user_name })}</span>
          )}
        </div>
        <div className='flex-grow'>
          <button onClick={handleNameClick} className="flex items-center text-left">
            <p className="font-semibold text-base text-slate-800 hover:underline">{post.name || post.user_name}</p>
            <MoodDisplay moodIndex={post.mood ?? post.mood_at_time} />
          </button>
          <p className="text-xs text-slate-500">{post.role || post.user_role}</p>
        </div>
        <div className="relative" ref={menuRef}>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-10">
              {isOwnPost ? (
                <>
                  <button
                    onClick={handleEditPost}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit post</span>
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete post</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleViewProfile}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span>See user profile</span>
                  </button>
                  {showNotInterested && (
                    <button
                      onClick={handleNotInterested}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors"
                    >
                      <EyeOff className="w-4 h-4" />
                      <span>Not interested in this post</span>
                    </button>
                  )}
                  <button
                    onClick={handleRemoveUser}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                  >
                    <UserX className="w-4 h-4" />
                    <span>Remove user</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {isEditMode ? (
        <div className="mb-3">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full p-3 text-sm text-slate-700 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
            rows="3"
            placeholder="What's on your mind?"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSaveEdit}
              disabled={isUpdating || !editedContent.trim()}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={isUpdating}
              className="px-4 py-2 bg-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-300 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-700 mb-3">{post.content || post.text}</p>
          
          {/* Original Post Reference for Reposts */}
          {isRepost && (post.original_post_user_name || post.originalPostUserName) && (
            <div 
              onClick={handleViewOriginalPost}
              className="mt-3 mb-3 p-3 border-2 border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 hover:border-indigo-300 cursor-pointer transition-all duration-200"
            >
              <div className="flex items-center mb-2">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold text-xs mr-2">
                  {(post.original_post_user_name || post.originalPostUserName)?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  {post.original_post_user_name || post.originalPostUserName}
                </span>
                {isLoadingOriginal && (
                  <span className="ml-2 text-xs text-slate-500">Loading...</span>
                )}
              </div>
              <p className="text-sm text-slate-600 italic">
                "{post.original_post_content || post.originalPostContent}"
              </p>
              <p className="text-xs text-indigo-600 mt-2 font-medium">Click to view original post →</p>
            </div>
          )}
        </>
      )}
      
      {(post.imageUrl || post.image_url || post.videoUrl || post.video_url) && (
        <div className="bg-slate-100 h-48 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
          {(post.imageUrl || post.image_url) && (
            <img 
              src={post.imageUrl || post.image_url} 
              alt="Post" 
              className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" 
              onClick={() => setIsImageFullscreen(true)}
              onError={(e) => {
                console.error('Failed to load image:', (post.imageUrl || post.image_url)?.substring(0, 100));
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="text-slate-400 text-sm">Image failed to load</div>';
              }}
            />
          )}
          {(post.videoUrl || post.video_url) && <video src={post.videoUrl || post.video_url} controls className="w-full h-full object-cover" />}
        </div>
      )}
      
      <div className="flex justify-between items-center text-slate-500 font-medium mb-2">
        <div className="flex space-x-4">
          <button 
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center space-x-1 ${isLiked ? 'text-rose-500' : 'hover:text-rose-500'} p-1 rounded-md transition-colors active:scale-[0.98] disabled:opacity-50`}
          >
            <Heart className={`w-6 h-6 ${isLiked ? 'fill-rose-500' : ''}`} />
            {likesCount > 0 && <span className="text-sm">{likesCount}</span>}
          </button>
          
          <button 
            onClick={handleCommentClick}
            className="flex items-center space-x-1 hover:text-indigo-600 p-1 rounded-md transition-colors active:scale-[0.98]"
          >
            <MessageSquare className="w-6 h-6" />
            {commentsCount > 0 && <span className="text-sm">{commentsCount}</span>}
          </button>
          
          <button 
            onClick={() => console.log('Send message to post author - Coming soon!')}
            className="flex items-center hover:text-indigo-600 p-1 rounded-md transition-colors active:scale-[0.98]"
          >
            <Send className="w-6 h-6" />
          </button>
          <button 
            onClick={handleRepost}
            disabled={isReposting || isOwnPost}
            className={`flex items-center ${isOwnPost ? 'text-slate-300 cursor-not-allowed' : 'hover:text-green-500'} p-1 rounded-md transition-colors active:scale-[0.98] disabled:opacity-50`}
            title={isOwnPost ? "Cannot repost your own post" : "Repost"}
          >
            <Repeat className="w-6 h-6" />
          </button>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center ${isSaved ? 'text-indigo-600' : 'hover:text-indigo-600'} p-1 rounded-md transition-colors active:scale-[0.98] disabled:opacity-50`}
        >
          <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-indigo-600' : ''}`} />
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          {isLoadingComments ? (
            <p className="text-sm text-slate-500 text-center py-2">Loading comments...</p>
          ) : (
            <>
              <div className="space-y-3 mb-3 max-h-60 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-2">No comments yet. Be the first!</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex space-x-2">
                      <div className="w-8 h-8 flex-shrink-0 rounded-full overflow-hidden mt-2">
                        {comment.user_profile_photo ? (
                          <img 
                            src={comment.user_profile_photo} 
                            alt={comment.user_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-700 font-bold text-xs">
                            {comment.user_name[0]}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 bg-slate-50 rounded-lg p-2">
                        <button 
                          onClick={() => handleCommenterClick(comment)}
                          className="text-xs font-semibold text-slate-800 hover:text-indigo-600 hover:underline transition-colors"
                        >
                          {comment.user_name}
                        </button>
                        <p className="text-sm text-slate-700">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Add Comment Input */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isCommenting}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || isCommenting}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isCommenting ? '...' : 'Post'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      {isImageFullscreen && (post.imageUrl || post.image_url) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
          onClick={() => setIsImageFullscreen(false)}
        >
          <button
            onClick={() => setIsImageFullscreen(false)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center  bg-opacity-10 hover:bg-opacity-20 rounded-full text-white transition-colors z-50"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={post.imageUrl || post.image_url} 
            alt="Post fullscreen" 
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Original Post Modal */}
      {viewingOriginalPost && originalPostData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">Original Post</h3>
              <button
                onClick={handleCloseOriginalPost}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            
            {/* Render Original Post as a PostCard for full interactivity */}
            <PostCard 
              post={{
                id: originalPostData.id,
                user_id: originalPostData.user_id,
                user_name: originalPostData.user_name,
                name: originalPostData.user_name,
                role: originalPostData.user_role,
                user_role: originalPostData.user_role,
                profile_photo: originalPostData.user_profile_photo,
                image: originalPostData.user_profile_photo,
                content: originalPostData.content,
                text: originalPostData.content,
                imageUrl: originalPostData.image_url,
                image_url: originalPostData.image_url,
                videoUrl: originalPostData.video_url,
                video_url: originalPostData.video_url,
                likes: originalPostData.likes_count || 0,
                likes_count: originalPostData.likes_count || 0,
                comments: originalPostData.comments_count || 0,
                comments_count: originalPostData.comments_count || 0,
                mood: originalPostData.mood_at_time,
                mood_at_time: originalPostData.mood_at_time,
                type: originalPostData.type,
                timestamp: originalPostData.created_at,
                created_at: originalPostData.created_at,
                isLiked: originalPostData.is_liked,
                is_liked: originalPostData.is_liked,
                isSaved: originalPostData.is_saved,
                is_saved: originalPostData.is_saved,
                is_repost: originalPostData.is_repost,
                original_post_id: originalPostData.original_post_id,
                original_post_user_name: originalPostData.original_post_user_name,
                original_post_user_id: originalPostData.original_post_user_id,
                original_post_content: originalPostData.original_post_content,
              }}
              onUpdate={() => {
                // Refresh the original post data
                if (originalPostData.id) {
                  feedService.getPostById(originalPostData.id)
                    .then(updated => setOriginalPostData(updated))
                    .catch(err => console.error('Error refreshing original post:', err));
                }
                // Also refresh the main feed if callback exists
                if (onUpdate) onUpdate();
              }}
              showNotInterested={false}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Delete Post?</h3>
            <p className="text-sm text-slate-600 mb-6">This action cannot be undone. Your post will be permanently deleted.</p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
