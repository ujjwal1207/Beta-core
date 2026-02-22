import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import feedService from '../services/feedService';
import PostCard from '../features/feed/components/PostCard';
import { getAvatarUrlWithSize } from '../lib/avatarUtils';

/**
 * PostDetailScreen — Shows a single post fetched by ID.
 * Navigated to from NotificationsScreen when user taps a notification.
 */
const PostDetailScreen = () => {
    const { setScreen, selectedPostId } = useAppContext();
    const [post, setPost] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPost = async () => {
            if (!selectedPostId) {
                setError('No post selected');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                setError(null);
                const data = await feedService.getPostById(selectedPostId);
                setPost(data);
            } catch (err) {
                console.error('Error fetching post:', err);
                setError('This post may have been deleted or is no longer available.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPost();
    }, [selectedPostId]);

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200 shrink-0">
                <button
                    onClick={() => setScreen('NOTIFICATIONS')}
                    className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-slate-700" />
                </button>
                <h1 className="text-lg font-bold text-slate-900">Post</h1>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <p className="text-slate-500 text-sm mb-3">{error}</p>
                        <button
                            onClick={() => setScreen('NOTIFICATIONS')}
                            className="text-indigo-600 font-semibold text-sm hover:text-indigo-800"
                        >
                            Back to Activity
                        </button>
                    </div>
                ) : post ? (
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
                            mood: post.mood_at_time,
                            timestamp: new Date(post.created_at * 1000).toLocaleDateString(),
                            imageUrl: post.image_url,
                            videoUrl: post.video_url,
                            type: post.type,
                            isLiked: post.is_liked,
                            is_repost: post.is_repost,
                            original_post_id: post.original_post_id,
                            original_post_user_name: post.original_post_user_name,
                            original_post_user_id: post.original_post_user_id,
                            original_post_content: post.original_post_content,
                        }}
                        onUpdate={async () => {
                            // Refresh the post
                            const data = await feedService.getPostById(selectedPostId);
                            setPost(data);
                        }}
                    />
                ) : null}
            </div>
        </div>
    );
};

export default PostDetailScreen;
