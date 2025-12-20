import React, { useState, useEffect } from 'react';
import { Send, Loader } from 'lucide-react';
import engagementService from '../../../services/engagementService';

const CommentSection = ({ postId, isOpen }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Fetch comments when the section is opened
  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await engagementService.getComments(postId);
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSending(true);
      // Backend: POST /feed/{id}/comment
      const addedComment = await engagementService.addComment(postId, newComment);
      
      // Add to list immediately
      setComments(prev => [...prev, addedComment]);
      setNewComment('');
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mt-3 pt-3 border-t border-slate-100 animate-fade-in-down">
      
      {/* Comment List */}
      <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
        {loading ? (
           <div className="text-center py-2"><Loader className="w-4 h-4 animate-spin inline text-slate-400"/></div>
        ) : comments.length === 0 ? (
           <p className="text-xs text-slate-400 text-center py-2">No comments yet. Be the first!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="bg-slate-50 p-2.5 rounded-lg text-sm">
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-bold text-slate-700 text-xs">{comment.user_name || 'User'}</span>
                <span className="text-[10px] text-slate-400">{new Date(comment.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-slate-600 leading-snug">{comment.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a thoughtful comment..."
          className="w-full bg-slate-100 border-0 rounded-full py-2.5 pl-4 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          disabled={sending}
        />
        <button 
          type="submit" 
          disabled={!newComment.trim() || sending}
          className="absolute right-1.5 p-1.5 bg-indigo-600 text-white rounded-full disabled:opacity-50 disabled:bg-slate-300 hover:bg-indigo-700 transition-colors"
        >
          {sending ? <Loader className="w-3 h-3 animate-spin"/> : <Send className="w-3 h-3" />}
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
