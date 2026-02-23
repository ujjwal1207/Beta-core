import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, MessageCircle, CheckCheck, Loader, Bell, UserPlus, UserCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import notificationService from '../services/notificationService';
import { getAvatarUrlWithSize } from '../lib/avatarUtils';

/**
 * Helper to format a Unix timestamp into a relative time string.
 */
const getRelativeTime = (timestamp) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = now - timestamp;

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    if (diff < 2592000) return `${Math.floor(diff / 604800)}w ago`;
    return new Date(timestamp * 1000).toLocaleDateString();
};

/**
 * Group notifications into Today, This Week, Earlier.
 */
const groupNotifications = (notifications) => {
    const now = Math.floor(Date.now() / 1000);
    const todayStart = now - (now % 86400); // Start of today (UTC)
    const weekStart = todayStart - 6 * 86400; // 7 days ago

    const groups = { today: [], thisWeek: [], earlier: [] };

    notifications.forEach((n) => {
        if (n.created_at >= todayStart) {
            groups.today.push(n);
        } else if (n.created_at >= weekStart) {
            groups.thisWeek.push(n);
        } else {
            groups.earlier.push(n);
        }
    });

    return groups;
};

/**
 * Single notification item component.
 */
const NotificationItem = ({ notification, onPress }) => {
    const isUnread = !notification.is_read;
    const isLike = notification.type === 'like';
    const isComment = notification.type === 'comment';
    const isConnectionReq = notification.type === 'connection_req';
    const isConnectionAccepted = notification.type === 'connection_accepted';

    // Build avatar URL
    const avatarUrl = notification.source_user_photo
        ? getAvatarUrlWithSize({ profile_photo: notification.source_user_photo, full_name: notification.source_user_name }, 80)
        : null;

    const initial = (notification.source_user_name || 'U').charAt(0).toUpperCase();

    // Badge color based on type
    const badgeColor = isLike ? 'bg-red-500' : (isConnectionReq || isConnectionAccepted) ? 'bg-emerald-500' : 'bg-indigo-500';

    return (
        <button
            onClick={() => onPress(notification)}
            className={`w-full flex items-start gap-3 px-4 py-3 transition-colors text-left ${isUnread
                ? 'bg-indigo-50/70 hover:bg-indigo-100/60'
                : 'bg-white hover:bg-slate-50'
                }`}
        >
            {/* Avatar */}
            <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={notification.source_user_name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-sm font-bold text-slate-600">{initial}</span>
                    )}
                </div>
                {/* Type icon badge */}
                <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${badgeColor}`}>
                    {isLike ? (
                        <Heart className="w-3 h-3 text-white fill-white" />
                    ) : (isConnectionReq || isConnectionAccepted) ? (
                        <UserPlus className="w-3 h-3 text-white" />
                    ) : (
                        <MessageCircle className="w-3 h-3 text-white fill-white" />
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 leading-snug">
                    <span className="font-semibold">{notification.source_user_name}</span>
                    {' '}
                    {isLike ? (
                        <span className="text-slate-600">liked your post</span>
                    ) : isConnectionReq ? (
                        <span className="text-slate-600">sent you a connection request</span>
                    ) : isConnectionAccepted ? (
                        <span className="text-slate-600">accepted your connection request</span>
                    ) : (
                        <span className="text-slate-600">
                            commented on your post
                            {notification.comment_text && (
                                <span className="text-slate-500">: "{notification.comment_text}"</span>
                            )}
                        </span>
                    )}
                </p>
                {/* Post preview (only for like/comment) */}
                {notification.post_content && !isConnectionReq && !isConnectionAccepted && (
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{notification.post_content}</p>
                )}
                <p className="text-[11px] text-slate-400 mt-1">{getRelativeTime(notification.created_at)}</p>
            </div>

            {/* Post thumbnail (only for like/comment) */}
            {notification.post_image_url && !isConnectionReq && !isConnectionAccepted && (
                <div className="w-11 h-11 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                    <img src={notification.post_image_url} alt="" className="w-full h-full object-cover" />
                </div>
            )}

            {/* Unread dot */}
            {isUnread && (
                <div className="shrink-0 mt-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
                </div>
            )}
        </button>
    );
};

/**
 * Section header for grouped notifications.
 */
const SectionHeader = ({ title }) => (
    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</h3>
    </div>
);

/**
 * NotificationsScreen — Instagram-style activity page.
 */
const NotificationsScreen = () => {
    const { setScreen, setPreviousScreen, setUnreadNotificationsCount, setSelectedPostId } = useAppContext();

    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch notifications
    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await notificationService.getNotifications(50, 0);
            setNotifications(data);
        } catch (err) {
            console.error('Error fetching notifications:', err);
            setError('Failed to load notifications.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    // Mark single as read & navigate to the post
    const handleNotificationPress = async (notification) => {
        try {
            if (!notification.is_read) {
                await notificationService.markAsRead(notification.id);
                setNotifications((prev) =>
                    prev.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
                );
                // Update global unread count
                if (setUnreadNotificationsCount) {
                    setUnreadNotificationsCount((prev) => Math.max(0, prev - 1));
                }
            }

            // Navigate based on notification type
            if (notification.type === 'connection_req') {
                setScreen('CONNECTION_REQUESTS');
            } else if (notification.type === 'connection_accepted') {
                setScreen('MY_CONNECTIONS');
            } else if (notification.reference_id) {
                setSelectedPostId(notification.reference_id);
                setScreen('POST_DETAIL');
            }
        } catch (err) {
            console.error('Error handling notification press:', err);
        }
    };

    // Mark all as read
    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            if (setUnreadNotificationsCount) {
                setUnreadNotificationsCount(0);
            }
        } catch (err) {
            console.error('Error marking all as read:', err);
        }
    };

    const hasUnread = notifications.some((n) => !n.is_read);
    const groups = groupNotifications(notifications);

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setScreen('FEED');
                        }}
                        className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-700" />
                    </button>
                    <h1 className="text-lg font-bold text-slate-900">Activity</h1>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <p className="text-red-500 text-sm mb-3">{error}</p>
                        <button
                            onClick={fetchNotifications}
                            className="text-indigo-600 font-semibold text-sm hover:text-indigo-800"
                        >
                            Try Again
                        </button>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                            <Bell className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-base font-semibold text-slate-700 mb-1">No activity yet</h3>
                        <p className="text-sm text-slate-400 text-center">
                            When someone likes, comments, or sends you a connection request, you'll see it here.
                        </p>
                    </div>
                ) : (
                    <div>
                        {groups.today.length > 0 && (
                            <>
                                <SectionHeader title="Today" />
                                {groups.today.map((n) => (
                                    <NotificationItem key={n.id} notification={n} onPress={handleNotificationPress} />
                                ))}
                            </>
                        )}
                        {groups.thisWeek.length > 0 && (
                            <>
                                <SectionHeader title="This Week" />
                                {groups.thisWeek.map((n) => (
                                    <NotificationItem key={n.id} notification={n} onPress={handleNotificationPress} />
                                ))}
                            </>
                        )}
                        {groups.earlier.length > 0 && (
                            <>
                                <SectionHeader title="Earlier" />
                                {groups.earlier.map((n) => (
                                    <NotificationItem key={n.id} notification={n} onPress={handleNotificationPress} />
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsScreen;
