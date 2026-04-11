import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Star, Users, ThumbsUp, Briefcase, Calendar, MessageSquare, Loader, UserPlus, Image as ImageIcon, MoreVertical, UserMinus, Ban, CheckCircle, XCircle, AlertCircle, Zap, Smile } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

import ScheduleCallModal from '../connections/components/ScheduleCallModal';
import Button from '../../components/ui/Button';
import PostCard from '../feed/components/PostCard';
import userService from '../../services/userService';
import connectionsService from '../../services/connectionsService';
import feedService from '../../services/feedService';
import chatService from '../../services/chatService';
import { getAvatarUrlWithSize } from '../../lib/avatarUtils';
import { formatRatingCount, isUserVerified } from '../../lib/utils';
import VerifiedName from '../../components/ui/VerifiedName';

const ProfileDetailScreen = () => {
  const { setScreen, selectedPerson, previousScreen, setSelectedPerson, setSelectedConversation, setPreviousScreen, showToast } = useAppContext();
  const [person, setPerson] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [userPosts, setUserPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bio'); // 'bio' or 'posts'
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [showMenu, setShowMenu] = useState(false);
  const [connectionId, setConnectionId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(null);
  const menuRef = useRef(null);
  const notificationTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!selectedPerson) {
        setScreen('CONNECTIONS_DASHBOARD');
        return;
      }

      try {
        setIsLoading(true);
        // Fetch full user profile from backend
        const userProfile = await userService.getUserById(selectedPerson.id);
        setPerson(userProfile);

        // If user is deactivated, don't fetch connections/requests
        if (userProfile.is_deactivated) {
          setIsLoading(false);
          return;
        }

        // Check if this user is already a connection
        const myConnections = await connectionsService.getMyConnections();
        const connectedUser = myConnections.find(conn => conn.id === selectedPerson.id);
        setIsConnected(!!connectedUser);

        // Store connection ID if connected (for removal)
        if (connectedUser && connectedUser.connection_id) {
          setConnectionId(connectedUser.connection_id);
        }

        // Check if there's already a pending request sent to this user
        const sentRequests = await connectionsService.getSentRequests();
        const pendingRequest = sentRequests.find(req => req.receiver.id === selectedPerson.id);
        setRequestSent(!!pendingRequest);

        // If connected, also fetch conversations for chat functionality
        if (connectedUser) {
          const convs = await chatService.getConversations();
          setConversations(convs);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // If user not found (404), show deleted account message instead of redirecting
        if (error?.response?.status === 404) {
          setPerson({ id: selectedPerson.id, is_deleted: true, full_name: 'Deleted User' });
        } else {
          setScreen('CONNECTIONS_DASHBOARD');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [selectedPerson, setScreen]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!selectedPerson?.id) return;

      try {
        setPostsLoading(true);
        const posts = await feedService.getUserPosts(selectedPerson.id);
        setUserPosts(posts);
      } catch (error) {
        console.error('Error fetching user posts:', error);
        setUserPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchUserPosts();
  }, [selectedPerson]);

  const showNotification = (message, type = 'success') => {
    // Clear any existing timeout to prevent premature clearing
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification({ message, type });
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null);
      notificationTimeoutRef.current = null;
    }, 3000);
  };

  const handleSendRequest = async () => {
    if (!person) return;

    try {
      setIsSendingRequest(true);
      await connectionsService.sendRequest(person.id);
      setRequestSent(true);
      // Show notification instead of navigating
      showNotification('Connection request sent! We\'ll let you know when they accept.', 'success');
    } catch (error) {
      console.error('Error sending connection request:', error);
      showNotification('Failed to send connection request. Please try again.', 'error');
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleStartChat = async () => {
    if (!person) return;

    try {
      setIsSendingRequest(true);
      // Find existing conversation or create new one
      const existingConv = conversations.find(c => c.other_user.id === person.id);

      if (existingConv) {
        setSelectedConversation(existingConv);
      } else {
        const conv = await chatService.getPrivateConversation(person.id);
        setSelectedConversation(conv);
      }

      setSelectedPerson(person);
      setPreviousScreen('PROFILE_DETAIL');
      setScreen('CHAT_ROOM');
    } catch (error) {
      console.error('Failed to open chat:', error);
      showNotification('Failed to open chat. Please try again.', 'error');
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleScheduleCallSuccess = (message) => {
    showToast(message, message.includes('successfully') ? 'success' : 'error');
  };

  const handleRemoveConnection = async () => {
    if (!person || !connectionId) {
      showNotification('Unable to remove connection. Please try again.', 'error');
      return;
    }

    setShowConfirmation({
      title: 'Remove Connection',
      message: `Are you sure you want to remove ${person.full_name} from your connections? You can reconnect later if you change your mind.`,
      confirmText: 'Remove',
      confirmAction: async () => {
        try {
          await connectionsService.removeConnection(connectionId);
          setShowMenu(false);
          setIsConnected(false);
          setConnectionId(null);
          showNotification(`${person.full_name} has been removed from your connections.`, 'success');
        } catch (error) {
          console.error('Failed to remove connection:', error);
          showNotification('Failed to remove connection. Please try again.', 'error');
        }
        setShowConfirmation(null);
      },
      cancelAction: () => setShowConfirmation(null)
    });
  };

  const handleBlockUser = async () => {
    if (!person) return;

    setShowConfirmation({
      title: 'Block User',
      message: `Are you sure you want to block ${person.full_name}? They will not be able to contact you or see your profile.`,
      confirmText: 'Block',
      confirmAction: async () => {
        try {
          await connectionsService.blockUser(person.id);
          setShowMenu(false);
          showNotification(`${person.full_name} has been blocked.`, 'success');
          setScreen(previousScreen || 'CONNECTIONS_DASHBOARD');
        } catch (error) {
          console.error('Failed to block user:', error);
          showNotification('Failed to block user. Please try again.', 'error');
        }
        setShowConfirmation(null);
      },
      cancelAction: () => setShowConfirmation(null)
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-100">
        <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!person) return null;

  const handleGoBack = () => {
    if (previousScreen === 'PROFILE_DETAIL') {
      setScreen('CONNECTIONS_DASHBOARD');
    } else {
      setScreen(previousScreen || 'FEED');
    }
  };

  // Show deactivated or deleted account message
  if (person.is_deactivated || person.is_deleted) {
    const isDeleted = person.is_deleted;
    return (
      <div className="flex flex-col h-full bg-slate-100">
        <div className="flex items-center p-4 bg-white border-b border-slate-200">
          <button onClick={handleGoBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors mr-3">
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">Profile</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm">
            <div className="w-24 h-24 mx-auto mb-6 bg-slate-200 rounded-full flex items-center justify-center">
              <Ban className="w-12 h-12 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-700 mb-3">
              {isDeleted ? 'Account Deleted' : 'Account Deactivated'}
            </h2>
            <p className="text-slate-500 leading-relaxed">
              {isDeleted
                ? 'This user has permanently deleted their account. Their profile and content are no longer available.'
                : 'This user has deactivated their account. Their profile and content are currently unavailable.'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isSuperLinker = person?.is_super_linker || false;
  const isVerifiedUser = isUserVerified(person);
  const sharedWisdom = person?.sharer_insights || {};
  const selectedCommunityGratitude = Array.isArray(sharedWisdom?.communityGratitude)
    ? sharedWisdom.communityGratitude.filter((item) => String(item?.text || '').trim()).slice(0, 3)
    : (Array.isArray(person?.gratitude)
      ? person.gratitude.filter((item) => String(item?.text || '').trim()).slice(0, 3)
      : []);
  const hasSharedWisdom = !!(
    sharedWisdom?.youngerSelf ||
    (Array.isArray(sharedWisdom?.lifeLessons) && sharedWisdom.lifeLessons.length > 0) ||
    sharedWisdom?.societyChange ||
    selectedCommunityGratitude.length > 0
  );

  const curiosityHookText = (sharedWisdom?.youngerSelf || '').trim();
  const experiencesSharedItems = Array.isArray(sharedWisdom?.lifeLessons)
    ? sharedWisdom.lifeLessons
        .map((item) => String(item?.lesson || '').trim())
        .filter(Boolean)
    : [];
  const conversationStyleText = (sharedWisdom?.societyChange || '').trim();
  const educationList = Array.isArray(person?.education) ? person.education : [];
  const primaryEducation = educationList.length > 0 ? educationList[0] : null;
  const educationDisplay = primaryEducation?.name
    ? `${primaryEducation.name}${primaryEducation.passing_year ? ` '${String(primaryEducation.passing_year).slice(-2)}` : ''}`
    : '';
  const roleBadgeText = primaryEducation?.enrollment_status === 'currently_enrolled'
    ? 'Student'
    : primaryEducation?.enrollment_status === 'alumni'
      ? 'Alumni'
      : (person?.role || '').toLowerCase().includes('student')
        ? 'Student'
        : '';
  const focusDisplay = person?.industry || person?.focus || '';
  const lookingForDisplay = person?.exploring || person?.connection_goal || person?.onboarding_answers?.LOOKING_FOR || '';
  const headlineStatusText = roleBadgeText || ((person?.role || '').toLowerCase().includes('alumni') ? 'Alumni' : '');

  return (
    <>
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 left-4 right-4 z-50">
          <div className={`p-4 rounded-xl shadow-lg border backdrop-blur-sm ${notification.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : notification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
            <div className="flex items-center gap-3">
              {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {notification.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
              {notification.type === 'warning' && <AlertCircle className="w-5 h-5 text-blue-600" />}
              <p className="font-medium">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-xl font-bold text-slate-800 mb-2">{showConfirmation.title}</h3>
            <p className="text-slate-600 mb-6">{showConfirmation.message}</p>
            <div className="flex gap-3">
              <button
                onClick={showConfirmation.cancelAction}
                className="flex-1 py-3 px-4 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={showConfirmation.confirmAction}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-colors touch-manipulation ${showConfirmation.title === 'Block User'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
              >
                {showConfirmation.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full bg-slate-100">
        <div className="grow overflow-y-auto pb-28">
          <div className="relative w-full h-64 bg-cover bg-center" style={{ backgroundImage: `url(${getAvatarUrlWithSize(person, 400)})` }}>
            <div className="absolute inset-0 bg-linear-to-t from-black/80 to-transparent"></div>
            <button onClick={handleGoBack} className="absolute top-4 left-4 p-2 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition-colors z-10">
              <ArrowLeft className="w-6 h-6" />
            </button>

            {/* Three-dot menu button */}
            <div className="absolute top-4 right-4 z-10" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 bg-black/30 backdrop-blur-sm rounded-full text-white hover:bg-black/50 transition-colors"
              >
                <MoreVertical className="w-6 h-6" />
              </button>

              {/* Dropdown menu */}
              {showMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
                  {isConnected && (
                    <button
                      onClick={handleRemoveConnection}
                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-slate-50 active:bg-slate-100 transition-colors touch-manipulation"
                    >
                      <UserMinus className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">Remove Connection</p>
                        <p className="text-xs text-slate-500">You can reconnect later</p>
                      </div>
                    </button>
                  )}
                  <button
                    onClick={handleBlockUser}
                    className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-red-50 active:bg-red-100 transition-colors border-t border-slate-100 touch-manipulation"
                  >
                    <Ban className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-700 text-sm">Block User</p>
                      <p className="text-xs text-red-500">They won't see your profile</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {isSuperLinker && (
              <div className="absolute top-16 right-4 flex items-center px-3 py-1.5 bg-linear-to-r from-amber-400 to-yellow-500 rounded-full shadow-lg text-white font-bold text-sm">
                <Star className="w-5 h-5 mr-1.5 fill-white" />
                Super ListenLinker
              </div>
            )}
          </div>

          <div className="relative z-0 bg-white p-6 rounded-t-3xl shadow-xl -mt-16">
            <div className="flex items-center mb-1">
              <VerifiedName
                name={`${person.full_name}${person.age ? `, ${person.age}` : ''}`}
                isVerified={isVerifiedUser}
                className="text-3xl font-extrabold text-slate-800"
                wrapperClassName="inline-flex items-center gap-2"
                badgeClassName="w-5 h-5 text-white fill-blue-500"
              />

            </div>
            {(focusDisplay || headlineStatusText) && (
              <p className="mb-4 text-sm font-semibold text-indigo-600">
                {focusDisplay || ''}
                {focusDisplay && headlineStatusText ? ' • ' : ''}
                {headlineStatusText || ''}
              </p>
            )}
            {isSuperLinker && (
              <div className="flex items-center space-x-4 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex-1 flex items-center">
                  <Star className="w-6 h-6 text-amber-500 fill-amber-500 mr-2.5" />
                  <div>
                    <p className="text-base font-bold text-slate-800">{person.trust_score?.toFixed(1) || '0.0'} / 5.0</p>
                    <p className="text-xs font-medium text-slate-500">{formatRatingCount(person.total_reviews || 0)} Ratings</p>
                  </div>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div className="flex-1 flex items-center">
                  <Users className="w-6 h-6 text-indigo-500 mr-2.5" />
                  <div>
                    <p className="text-base font-bold text-slate-800">{person.connections_count || 0}</p>
                    <p className="text-xs font-medium text-slate-500">Connections</p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-base text-slate-700 leading-relaxed mb-6">{person.bio || 'No bio available'}</p>

            {person.tags && person.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {person.tags.map(tag => (
                  <span key={tag} className="px-3 py-1 text-sm font-semibold bg-slate-200 text-slate-700 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {(educationDisplay || focusDisplay || lookingForDisplay) && (
              <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                {educationDisplay && (
                  <div className="flex items-start gap-3">
                    <Briefcase className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Education</p>
                      <p className="font-semibold text-slate-800 flex items-center gap-2 flex-wrap">
                        <span>{educationDisplay}</span>
                        {roleBadgeText && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider bg-indigo-100 text-indigo-700">{roleBadgeText}</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {focusDisplay && (
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Focus / Industry</p>
                      <p className="font-semibold text-slate-800">{focusDisplay}</p>
                    </div>
                  </div>
                )}

                {lookingForDisplay && (
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Looking For</p>
                      <p className="font-semibold text-slate-800">{lookingForDisplay}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="bg-white mt-4 shadow-lg mx-0 sticky top-0 z-20">
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveTab('bio')}
                className={`flex-1 py-4 text-base font-bold transition-all ${activeTab === 'bio'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                Bio
              </button>
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 py-4 text-base font-bold transition-all ${activeTab === 'posts'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                Posts
              </button>
            </div>
          </div>

          {/* Bio Tab Content */}
          {activeTab === 'bio' && (
            <>
              {isSuperLinker && selectedCommunityGratitude.length > 0 && (
                <div className="bg-white p-6 mt-4 shadow-lg mx-0">
                  <div className="flex items-center mb-6">
                    <div className="shrink-0 w-12 h-12 flex items-center justify-center bg-linear-to-br from-green-500 to-emerald-600 text-white rounded-xl shadow-lg mr-4">
                      <ThumbsUp className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800">Community Gratitude</h3>
                  </div>
                  <div className="space-y-4">
                    {selectedCommunityGratitude.map((item, index) => (
                      <div key={index} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                        <blockquote className="text-base text-slate-700 italic mb-2">
                          "{item.text}"
                        </blockquote>
                        <p className="text-sm font-bold text-slate-600 text-right">
                          — {item.from}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasSharedWisdom && (
                  <div className="bg-white p-6 mt-4 shadow-lg mx-0">
                    <div className="flex items-center mb-6">
                      <div className="shrink-0 w-12 h-12 flex items-center justify-center bg-linear-to-br from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg mr-4">
                        <ThumbsUp className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-extrabold text-slate-800">1:1 Session Details</h3>
                    </div>

                    {curiosityHookText && (
                      <div className="mb-6">
                        <div className="flex items-center text-sm font-bold text-slate-600 mb-2">
                          <Zap className="w-4 h-4 mr-2 text-amber-500" />
                          CURIOSITY HOOK
                        </div>
                        <blockquote className="text-base text-slate-700 italic border-l-4 border-indigo-200 pl-4 py-2 bg-slate-50 rounded-r-lg">
                          "{curiosityHookText}"
                        </blockquote>
                      </div>
                    )}

                    {experiencesSharedItems.length > 0 && (
                      <div className="mb-6">
                        <div className="flex items-center text-sm font-bold text-slate-600 mb-3">
                          <Briefcase className="w-4 h-4 mr-2 text-slate-400" />
                          EXPERIENCES SHARED
                        </div>
                        <div className="space-y-3">
                          {experiencesSharedItems.map((lesson, index) => (
                            <div key={index} className="p-3 rounded-xl border border-slate-200 bg-white shadow-sm flex items-start">
                              <CheckCircle className="w-5 h-5 text-green-500 mr-2.5 shrink-0" />
                              <span className="text-sm font-semibold text-slate-800">{lesson}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {conversationStyleText && (
                      <div>
                        <div className="flex items-center text-sm font-bold text-slate-600 mb-2">
                          <Users className="w-4 h-4 mr-2 text-slate-400" />
                          CONVERSATION STYLE
                        </div>
                        <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-sm flex items-start">
                          <Smile className="w-5 h-5 text-indigo-500 mr-2.5 shrink-0" />
                          <span className="text-sm font-semibold text-slate-800">{conversationStyleText}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </>
          )}

          {/* Posts Tab Content */}
          {activeTab === 'posts' && (
            <div className="bg-white mt-4 mx-0">
              {postsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader className="w-6 h-6 text-indigo-500 animate-spin" />
                </div>
              ) : userPosts.length > 0 ? (
                <div className="space-y-4">
                  {userPosts.filter(post => post && post.id).map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      showNotInterested={false}
                      onUpdate={(updatedPost, deletedPostId) => {
                        // Handle post update or deletion
                        if (deletedPostId) {
                          // Remove deleted post from list
                          setUserPosts(prev => prev.filter(p => p && p.id !== deletedPostId));
                        } else if (updatedPost) {
                          // Update existing post in list
                          setUserPosts(prev =>
                            prev.filter(p => p && p.id).map(p => p.id === updatedPost.id ? updatedPost : p)
                          );
                        }
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-6">
                  <p className="text-center text-slate-500 py-8">No posts yet</p>
                </div>
              )}
            </div>
          )}

          <div className="h-12"></div>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-lg border-t border-slate-200 z-10">
          {person?.is_super_linker && (
            <div className="mb-3 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              {person?.pay_rate_per_min ? (
                <>
                  <span className="text-green-700 font-semibold text-lg">
                    ₹{person.pay_rate_per_min}/min
                  </span>
                  <p className="text-green-600 text-sm">Consultation Rate</p>
                </>
              ) : (
                <>
                  <span className="text-slate-500 font-medium text-base">
                    Rate not set
                  </span>
                  <p className="text-slate-400 text-sm">Contact for pricing</p>
                </>
              )}
            </div>
          )}
          <div className="flex space-x-3">
            {person?.is_super_linker ? (
              // Super Listeners: Only show Schedule Consultation button
              <Button onClick={() => setIsModalOpen(true)} className="flex-1 bg-rose-500!">
                <Calendar className="w-5 h-5 inline mr-2" /> Schedule Consultation
              </Button>
            ) : (
              // Regular Users: Show connection and chat buttons
              <>
                {isConnected ? (
                  <Button
                    onClick={handleStartChat}
                    disabled={isSendingRequest}
                    primary
                    className="flex-1 bg-indigo-600! text-white!"
                  >
                    {isSendingRequest ? (
                      <>
                        <Loader className="w-5 h-5 inline mr-2 animate-spin" /> Opening...
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-5 h-5 inline mr-2" /> Start Chat
                      </>
                    )}
                  </Button>
                ) : requestSent ? (
                  <Button disabled className="flex-1 bg-green-50! text-green-600!">
                    <UserPlus className="w-5 h-5 inline mr-2" /> Request Sent
                  </Button>
                ) : (
                  <Button
                    onClick={handleSendRequest}
                    disabled={isSendingRequest}
                    primary
                    className="flex-1 bg-indigo-100! text-indigo-700!"
                  >
                    {isSendingRequest ? (
                      <>
                        <Loader className="w-5 h-5 inline mr-2 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5 inline mr-2" /> Send Request
                      </>
                    )}
                  </Button>
                )}
                <Button onClick={() => setIsModalOpen(true)} className="flex-1 bg-rose-500!">
                  <Calendar className="w-5 h-5 inline mr-2" /> Schedule Call
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <ScheduleCallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        person={person}
        onSuccess={handleScheduleCallSuccess}
        setScreen={setScreen}
      />
    </>
  );
};

export default ProfileDetailScreen;
