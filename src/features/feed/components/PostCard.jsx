import React, { useState } from 'react';
import { Heart, MessageSquare, Send, Bookmark, Repeat } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import MoodDisplay from '../../../components/ui/MoodDisplay';
import engagementService from '../../../services/engagementService';

const PostCard = ({ post, onUpdate }) => {
  const { setScreen, setSelectedPerson, setPreviousScreen } = useAppContext();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [commentsCount, setCommentsCount] = useState(post.comments || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const handleNameClick = () => {
    setPreviousScreen('FEED');
    setSelectedPerson(post);
    setScreen('PROFILE_DETAIL');
  };

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      const result = await engagementService.toggleLike(post.id);
      setIsLiked(result.is_liked);
      setLikesCount(result.new_likes_count);
      
      // Notify parent to refresh if needed
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLiking(false);
    }
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
      
      <p className="text-sm text-slate-700 mb-3">{post.content || post.text}</p>
      
      {(post.imageUrl || post.videoUrl) && (
        <div className="bg-slate-100 h-48 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
          {post.imageUrl && <img src={post.imageUrl} alt="Post" className="w-full h-full object-cover" />}
          {post.videoUrl && <video src={post.videoUrl} controls className="w-full h-full object-cover" />}
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
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex-shrink-0">
                        {comment.user_name[0]}
                      </div>
                      <div className="flex-1 bg-slate-50 rounded-lg p-2">
                        <p className="text-xs font-semibold text-slate-800">{comment.user_name}</p>
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
    </div>
  );
};

export default PostCard;
