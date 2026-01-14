import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserX, Loader, Users, AlertCircle, CheckCircle, XCircle, AlertTriangle, UserCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import connectionsService from '../services/connectionsService';
import { getAvatarUrlWithSize } from '../lib/avatarUtils';

const BlockedUsersScreen = () => {
  const { setScreen } = useAppContext();
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(null);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      setIsLoading(true);
      const data = await connectionsService.getBlockedUsers();
      setBlockedUsers(data);
    } catch (err) {
      setError('Failed to load blocked users');
      console.error('Error fetching blocked users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUnblockUser = (user) => {
    setShowConfirmation({
      title: 'Unblock User',
      message: `Are you sure you want to unblock ${user.full_name}? They will be able to contact you and see your profile again.`,
      confirmText: 'Unblock',
      confirmAction: async () => {
        try {
          await connectionsService.unblockUser(user.id);
          setBlockedUsers(prev => prev.filter(u => u.id !== user.id));
          showNotification(`${user.full_name} has been unblocked.`, 'success');
        } catch (error) {
          console.error('Failed to unblock user:', error);
          showNotification('Failed to unblock user. Please try again.', 'error');
        }
        setShowConfirmation(null);
      },
      cancelAction: () => setShowConfirmation(null)
    });
  };

  const BlockedUserCard = ({ user }) => {
    return (
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center">
        <div className="w-12 h-12 rounded-full bg-cover bg-center mr-4 flex-shrink-0 overflow-hidden">
          <img
            src={getAvatarUrlWithSize(user, 100)}
            alt={user.full_name}
            className="w-full h-full rounded-full object-cover"
          />
        </div>
        <div className="flex-grow min-w-0">
          <h3 className="font-semibold text-slate-800 truncate">{user.full_name}</h3>
          <p className="text-sm text-slate-500 truncate">{user.role || 'No role specified'}</p>
        </div>
        <button
          onClick={() => handleUnblockUser(user)}
          className="ml-3 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors touch-manipulation flex items-center gap-2"
        >
          <UserCheck className="w-4 h-4" />
          Unblock
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 left-4 right-4 z-50">
          <div className={`p-4 rounded-xl shadow-lg border backdrop-blur-sm ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : notification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center gap-3">
              {notification.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
              {notification.type === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
              {notification.type === 'warning' && <AlertTriangle className="w-5 h-5 text-blue-600" />}
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
                className="flex-1 py-3 px-4 rounded-xl font-semibold transition-colors touch-manipulation bg-green-600 text-white hover:bg-green-700"
              >
                {showConfirmation.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col h-full bg-slate-50">
      <div className="p-4 pt-6">
        <button
          onClick={() => setScreen('SETTINGS')}
          className="p-2 rounded-full hover:bg-slate-200 mb-2"
        >
          <ArrowLeft className="w-6 h-6 text-slate-600" />
        </button>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Blocked Users</h1>
        <p className="text-slate-600 text-sm">Users you have blocked will not be able to contact you or see your profile.</p>
      </div>

      <div className="flex-grow overflow-y-auto px-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8 px-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
            <p className="text-slate-500 text-sm mt-1">Please try again later.</p>
          </div>
        ) : blockedUsers.length > 0 ? (
          <div>
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                {blockedUsers.length} {blockedUsers.length === 1 ? 'User' : 'Users'} Blocked
              </h3>
            </div>
            <div className="space-y-3">
              {blockedUsers.map(user => (
                <BlockedUserCard key={user.id} user={user} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">No Blocked Users</h3>
            <p className="text-slate-500 text-sm">You haven't blocked any users yet.</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default BlockedUsersScreen;