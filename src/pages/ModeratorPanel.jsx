import React, { useEffect, useState } from 'react';
import { Loader, Users, Activity, CreditCard, LogOut, RefreshCw, CheckCircle, XCircle, Search, UserMinus, Key, DollarSign, Calendar, EyeOff, Building2, MoreHorizontal, AlertTriangle, Trash2, Eye, MessageSquareText, FileText, ArrowLeft, Phone } from 'lucide-react';
import adminService from '../services/adminService';
import authService from '../services/authService';

const BRAND = '#4f46e5';

const getModeratorUserIdFromPath = () => {
  const match = window.location.pathname.match(/^\/moderator\/user\/(\d+)$/);
  return match ? Number(match[1]) : null;
};

const formatINR = (value) => {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
};

const formatTS = (ts) => {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatDate = (ts) => {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* ─── Stat Card (matches AdminPanel style) ─── */
const StatCard = ({ label, value, icon: Icon, color = BRAND }) => (
  <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/0 to-slate-50/50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
    <div className="flex items-center justify-between mb-3">
      <p className="text-sm font-bold text-slate-600 tracking-wide">{label}</p>
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </div>
    <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{value}</p>
  </div>
);

/* ═══════════════════════════════════════════════════════ */
/*  LOGIN (matches AdminLogin style)                      */
/* ═══════════════════════════════════════════════════════ */
const ModeratorLogin = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) { setError('Please enter email and password'); return; }
    try {
      setLoading(true);
      await authService.login({ email: username.trim(), password });
      await onLoginSuccess();
    } catch (err) { setError(err.message || 'Invalid moderator credentials'); }
    finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const response = await authService.getGoogleLoginUrl('/moderator');
      if (response?.url) {
        window.location.href = response.url;
      }
    } catch (err) {
      setError('Google sign in failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative blobs – same as AdminLogin */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-violet-500/10 rounded-full blur-3xl mix-blend-multiply" />

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/50 p-8 relative z-10">
        <div className="flex items-center justify-center flex-col text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-900/10 bg-white border border-slate-200">
            <img src="listenlinklogo.png" alt="ListenLink" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-1">Moderator Console</h1>
          <p className="text-sm font-medium text-slate-500">Sign in to moderate the platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Moderator Email"
            className="w-full p-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password"
            className="w-full p-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all" />

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm font-medium text-red-600 text-center">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-4 mt-2 rounded-2xl font-bold text-white shadow-lg shadow-indigo-900/20 disabled:opacity-70 hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ background: BRAND }}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 rounded-2xl border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-70"
          >
            Continue with Google
          </button>

          <a href="/" className="block text-center mt-6 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors">
            ← Back to Application
          </a>
        </form>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════ */
/*  MAIN PANEL                                            */
/* ═══════════════════════════════════════════════════════ */
const ModeratorPanel = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [activityFilter, setActivityFilter] = useState('all');
  const [selectedUserId, setSelectedUserId] = useState(() => getModeratorUserIdFromPath());
  const [userSearch, setUserSearch] = useState('');

  const [users, setUsers] = useState([]);
  const [pendingMonetization, setPendingMonetization] = useState([]);
  const [activities, setActivities] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  const [selectedUserStats, setSelectedUserStats] = useState(null);
  const [selectedUserPosts, setSelectedUserPosts] = useState([]);
  const [selectedUserComments, setSelectedUserComments] = useState([]);
  const [selectedUserLoading, setSelectedUserLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const filteredUsers = users.filter((user) => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return true;
    return [user.full_name, user.email, user.role].filter(Boolean).some((val) => String(val).toLowerCase().includes(q));
  });

  const moderatorsCount = users.filter((u) => u.role === 'moderator').length;
  const superListenersCount = users.filter((u) => u.is_super_linker).length;
  const pendingMonetizationCount = pendingMonetization.length;
  const pendingMonetizationUserIds = new Set(pendingMonetization.map((item) => Number(item.user_id)));
  const filteredActivitiesCount = activities.filter(a => activityFilter === 'all' || a.type === activityFilter).length;
  const totalTransactionsVolume = transactions.reduce((sum, txn) => sum + Number(txn.price || 0), 0);

  /* ── DATA LOADING ── */
  const loadData = async () => {
    setLoading(true); setError('');
    try {
      if (activeTab === 'users') {
        if (selectedUserId) {
          const [profileData, postsData, commentsData] = await Promise.all([
            adminService.getUserProfile(selectedUserId),
            adminService.getUserPosts(selectedUserId),
            adminService.getUserComments(selectedUserId),
          ]);
          setSelectedUserProfile(profileData.user || null);
          setSelectedUserStats(profileData.stats || null);
          setSelectedUserPosts(postsData.posts || []);
          setSelectedUserComments(commentsData.comments || []);
        } else {
          const [usersData, monetizationData] = await Promise.all([
            adminService.getUsers(),
            adminService.getPendingMonetizationSubmissions(),
          ]);
          setUsers(usersData.users || []);
          setPendingMonetization(monetizationData.submissions || []);
        }
      } else if (activeTab === 'activities') {
        const data = await adminService.getActivities();
        setActivities(data.activities || []);
      } else if (activeTab === 'transactions') {
        const data = await adminService.getTransactions();
        setTransactions(data.transactions || []);
      }
      setIsAuthorized(true);
    } catch (err) {
      if (err.status === 403 || err.status === 401) setIsAuthorized(false);
      else setError(err.message || `Failed to load ${activeTab}`);
    } finally { setLoading(false); setIsCheckingAuth(false); }
  };

  useEffect(() => { if (!isCheckingAuth || isAuthorized) loadData(); }, [activeTab, selectedUserId]);
  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    const handlePopState = () => {
      const uid = getModeratorUserIdFromPath();
      if (uid) { setActiveTab('users'); setSelectedUserId(uid); }
      else { setSelectedUserId(null); setSelectedUserProfile(null); setSelectedUserStats(null); setSelectedUserPosts([]); setSelectedUserComments([]); }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  /* ── HANDLERS ── */
  const handleApproveMonetization = async (userId) => {
    setActionLoading(`approve-monetization-${userId}`); setMessage(''); setError('');
    try {
      await adminService.approveMonetizationSubmission(userId);
      setPendingMonetization(prev => prev.filter(item => Number(item.user_id) !== Number(userId)));
      setUsers(prev => prev.map(u => Number(u.id) === Number(userId) ? { ...u, is_super_linker: true } : u));
      setMessage('Monetization approved. User is now a Super Listener.');
    } catch (err) {
      setError(err.message || 'Failed to approve monetization');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectMonetization = async (userId) => {
    setActionLoading(`reject-monetization-${userId}`); setMessage(''); setError('');
    try {
      await adminService.rejectMonetizationSubmission(userId);
      setPendingMonetization(prev => prev.filter(item => Number(item.user_id) !== Number(userId)));
      setUsers(prev => prev.map(u => Number(u.id) === Number(userId) ? { ...u, is_super_linker: false } : u));
      setMessage('Monetization submission rejected.');
    } catch (err) {
      setError(err.message || 'Failed to reject monetization');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(`role-${userId}`); setMessage(''); setError('');
    try { await adminService.updateUserRole(userId, newRole); setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u)); setMessage(`Role updated to ${newRole}.`); }
    catch (err) { setError(err.message || 'Failed to update role'); } finally { setActionLoading(null); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Deactivate this user account?")) return;
    setActionLoading(`delete-${userId}`); setMessage(''); setError('');
    try { await adminService.deleteUser(userId); setUsers(users.filter(u => u.id !== userId)); if (selectedUserId === userId) handleCloseUserDetailsPage(); setMessage('User deactivated.'); }
    catch (err) { setError(err.message || 'Failed to deactivate user'); } finally { setActionLoading(null); }
  };

  const handleViewUserDetails = async (userId, shouldPushHistory = true) => {
    setActionLoading(`view-${userId}`); setSelectedUserLoading(true); setMessage(''); setError('');
    try {
      if (shouldPushHistory) window.history.pushState({}, '', `/moderator/user/${userId}`);
      setSelectedUserId(userId);
      const [profileData, postsData, commentsData] = await Promise.all([adminService.getUserProfile(userId), adminService.getUserPosts(userId), adminService.getUserComments(userId)]);
      setSelectedUserProfile(profileData.user || null); setSelectedUserStats(profileData.stats || null); setSelectedUserPosts(postsData.posts || []); setSelectedUserComments(commentsData.comments || []);
    } catch (err) { setError(err.message || 'Failed to load user details'); }
    finally { setSelectedUserLoading(false); setActionLoading(null); }
  };

  const handleCloseUserDetailsPage = () => {
    setSelectedUserId(null); setSelectedUserProfile(null); setSelectedUserStats(null); setSelectedUserPosts([]); setSelectedUserComments([]);
    if (window.location.pathname !== '/moderator') window.history.pushState({}, '', '/moderator');
  };

  const handleDeleteUserPost = async (postId) => {
    if (!window.confirm('Delete this post permanently?')) return;
    setActionLoading(`delete-user-post-${postId}`); setMessage(''); setError('');
    try {
      await adminService.deleteActivity('post', postId);
      setSelectedUserPosts(prev => prev.filter(post => post.id !== postId));
      if (selectedUserStats) setSelectedUserStats({ ...selectedUserStats, posts_count: Math.max((selectedUserStats.posts_count || 0) - 1, 0) });
      setMessage('Post deleted.');
    } catch (err) { setError(err.message || 'Failed to delete post'); } finally { setActionLoading(null); }
  };

  const handleDeleteUserComment = async (commentId) => {
    if (!window.confirm('Delete this comment permanently?')) return;
    setActionLoading(`delete-user-comment-${commentId}`); setMessage(''); setError('');
    try {
      await adminService.deleteActivity('comment', commentId);
      setSelectedUserComments(prev => prev.filter(c => c.id !== commentId));
      if (selectedUserStats) setSelectedUserStats({ ...selectedUserStats, comments_count: Math.max((selectedUserStats.comments_count || 0) - 1, 0) });
      setMessage('Comment deleted.');
    } catch (err) { setError(err.message || 'Failed to delete comment'); } finally { setActionLoading(null); }
  };

  const handleDeleteActivity = async (type, id) => {
    if (!window.confirm(`Delete this ${type} permanently?`)) return;
    setActionLoading(`delete-act-${id}`); setMessage(''); setError('');
    try { await adminService.deleteActivity(type, id); setActivities(activities.filter(a => !(a.type === type && a.id === id))); setMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted.`); }
    catch (err) { setError(err.message || `Failed to delete ${type}`); } finally { setActionLoading(null); }
  };

  const handleLogout = async () => { try { await authService.logout(); } catch (e) {} setIsAuthorized(false); };

  /* ── AUTH GATE ── */
  if (isCheckingAuth) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <Loader className="w-10 h-10 animate-spin" style={{ color: BRAND }} />
    </div>
  );

  if (!isAuthorized) return <ModeratorLogin onLoginSuccess={loadData} />;

  const tabs = [
    { key: 'users', label: 'Users', icon: Users },
    { key: 'activities', label: 'Activity Feed', icon: Activity },
    { key: 'transactions', label: 'Transactions', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── HEADER (matches AdminPanel header) ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/10" style={{ background: BRAND }}>
              <UserCog className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Moderator Console</h1>
              <p className="text-sm font-medium text-slate-500">Users • Activity • Transactions</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={loadData} disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-100/80 hover:bg-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-60 transition-colors">
              <RefreshCw className={`inline w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-sm font-semibold text-rose-600 transition-colors">
              <LogOut className="inline w-4 h-4 mr-1.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Flash messages */}
        {message && <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{message}</p>}
        {error && <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        {/* ── PILL TAB BAR (matches AdminPanel tabs) ── */}
        <div className="flex bg-slate-200/50 backdrop-blur-sm rounded-2xl p-1.5 mb-8 w-fit overflow-x-auto shadow-inner border border-slate-200/50">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); if (selectedUserId) handleCloseUserDetailsPage(); }}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.key
                  ? 'bg-white text-slate-800 shadow-sm scale-100'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/40 scale-[0.98]'
              }`}>
              <tab.icon className={`inline w-4 h-4 mr-2 ${activeTab === tab.key ? 'text-indigo-600' : ''}`} /> {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader className="w-8 h-8 animate-spin mb-3" style={{ color: BRAND }} />
            <span className="text-sm font-medium text-slate-500">Loading data…</span>
          </div>
        )}

        {/* ═══════════ USERS TAB ═══════════ */}
        {activeTab === 'users' && !loading && !selectedUserId && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Total Users" value={users.length} icon={Users} color={BRAND} />
              <StatCard label="Moderators" value={moderatorsCount} icon={UserCog} color="#6366f1" />
              <StatCard label="Super Listeners" value={superListenersCount} icon={Key} color="#f59e0b" />
            </div>

            {/* Monetization approval queue */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-800">Pending Monetization Approvals</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Approve to make user a Super Listener</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  {pendingMonetizationCount} pending
                </span>
              </div>

              {pendingMonetizationCount === 0 ? (
                <div className="px-6 py-8 text-sm text-slate-500">No pending monetization requests.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingMonetization.map((item) => (
                    <div key={item.user_id} className="px-6 py-4 flex flex-col lg:flex-row lg:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{item.full_name}</p>
                        <p className="text-xs text-slate-500 truncate">{item.email}</p>
                        <p className="text-xs text-slate-400 mt-1">Submitted: {formatTS(item.submitted_at)}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleApproveMonetization(item.user_id)}
                          disabled={actionLoading === `approve-monetization-${item.user_id}`}
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-40"
                        >
                          {actionLoading === `approve-monetization-${item.user_id}` ? 'Approving...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleRejectMonetization(item.user_id)}
                          disabled={actionLoading === `reject-monetization-${item.user_id}`}
                          className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold disabled:opacity-40"
                        >
                          {actionLoading === `reject-monetization-${item.user_id}` ? 'Rejecting...' : 'Reject'}
                        </button>
                        <button
                          onClick={() => handleViewUserDetails(item.user_id)}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                        >
                          Review Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Directory Card */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
              {/* Search bar header */}
              <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-600">{filteredUsers.length} of {users.length} users</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search name, email, role…"
                    className="w-full pl-11 pr-4 p-3 rounded-xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none text-sm transition-all" />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-3 font-semibold">User</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Super Listener</th>
                      <th className="px-4 py-3 font-semibold">Joined</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm uppercase shrink-0">
                              {user.full_name?.charAt(0) || 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">{user.full_name}</p>
                              <p className="text-xs text-slate-500 truncate">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <select value={user.role || 'user'} onChange={(e) => handleRoleChange(user.id, e.target.value)} disabled={actionLoading === `role-${user.id}`}
                            className="bg-slate-50/80 border border-slate-200 text-slate-700 text-xs rounded-xl py-2 pl-3 pr-7 font-medium focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none cursor-pointer disabled:opacity-40 transition-all">
                            <option value="user">User</option>
                            <option value="university_admin">Univ. Admin</option>
                            <option value="moderator">Moderator</option>
                          </select>
                        </td>
                        <td className="px-4 py-4">
                          {pendingMonetizationUserIds.has(Number(user.id)) ? (
                            <span className="px-3 py-1.5 text-xs font-bold rounded-xl border bg-amber-50 text-amber-700 border-amber-200">Pending Approval</span>
                          ) : user.is_super_linker ? (
                            <span className="px-3 py-1.5 text-xs font-bold rounded-xl border bg-amber-50 text-amber-700 border-amber-200 shadow-sm">★ Active</span>
                          ) : (
                            <span className="px-3 py-1.5 text-xs font-bold rounded-xl border bg-white text-slate-500 border-slate-200">Inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500">{formatDate(user.created_at)}</td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleViewUserDetails(user.id)} disabled={actionLoading === `view-${user.id}`}
                              className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all disabled:opacity-40" title="View Details">
                              {actionLoading === `view-${user.id}` ? <Loader className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button onClick={() => handleDeleteUser(user.id)} disabled={actionLoading === `delete-${user.id}`}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-40" title="Deactivate">
                              <UserMinus className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr><td colSpan="5" className="px-6 py-16 text-center text-slate-400 text-sm">No users found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ USER DETAIL PAGE ═══════════ */}
        {activeTab === 'users' && selectedUserId && (
          <div className="space-y-6">
            <button onClick={handleCloseUserDetailsPage}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm transition-all">
              <ArrowLeft className="w-4 h-4" /> Back to Users
            </button>

            {selectedUserLoading ? (
              <div className="py-20 text-center text-slate-400">
                <Loader className="w-8 h-8 animate-spin mx-auto mb-3" style={{ color: BRAND }} />
                <p className="text-sm font-medium text-slate-500">Loading profile…</p>
              </div>
            ) : selectedUserProfile && (
              <>
                {/* Profile Header */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-lg p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[80px] -z-10" />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-extrabold shadow-lg shadow-indigo-900/10 shrink-0" style={{ background: BRAND }}>
                      {selectedUserProfile.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight">{selectedUserProfile.full_name || 'Unnamed'}</h2>
                      <p className="text-sm font-medium text-slate-500 mt-1">{selectedUserProfile.email}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-xl border bg-indigo-50 text-indigo-700 border-indigo-200">
                          {selectedUserProfile.role || 'user'}
                        </span>
                        {selectedUserProfile.is_super_linker && (
                          <span className="text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">★ Super Listener</span>
                        )}
                        {selectedUserProfile.is_deactivated && (
                          <span className="text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-xl bg-red-50 text-red-700 border border-red-200">Deactivated</span>
                        )}
                        {selectedUserProfile.location && (
                          <span className="text-sm text-slate-500">📍 {selectedUserProfile.location}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard label="Posts" value={selectedUserStats?.posts_count || 0} icon={FileText} color="#6366f1" />
                  <StatCard label="Comments" value={selectedUserStats?.comments_count || 0} icon={MessageSquareText} color="#0ea5e9" />
                  <StatCard label="Connections" value={selectedUserProfile.connections_count || 0} icon={Users} color="#10b981" />
                  <StatCard label="Joined" value={formatDate(selectedUserProfile.created_at)} icon={Calendar} color="#8b5cf6" />
                </div>

                {/* Posts & Comments */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Posts */}
                  <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-500" />
                      <h3 className="text-sm font-bold text-slate-700">Posts ({selectedUserPosts.length})</h3>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100">
                      {selectedUserPosts.map(post => (
                        <article key={post.id} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <span className="text-xs text-slate-400">{formatTS(post.created_at)}</span>
                            <button onClick={() => handleDeleteUserPost(post.id)} disabled={actionLoading === `delete-user-post-${post.id}`}
                              className="p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-40 shrink-0">
                              {actionLoading === `delete-user-post-${post.id}` ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content || '(No text)'}</p>
                          {post.image_url && <img src={post.image_url} alt="" className="mt-3 w-full rounded-2xl border border-slate-200 max-h-48 object-cover" loading="lazy" />}
                          {post.video_url && <video src={post.video_url} controls className="mt-3 w-full rounded-2xl border border-slate-200 max-h-48 bg-black" />}
                          {Array.isArray(post.tags) && post.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {post.tags.map((tag, i) => (
                                <span key={`${post.id}-tag-${i}`} className="px-2 py-0.5 text-[10px] rounded-lg bg-slate-100 text-slate-500 border border-slate-200 font-medium">#{tag}</span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-slate-400 mt-2">❤️ {post.likes_count || 0}  •  💬 {post.comments_count || 0}</p>
                        </article>
                      ))}
                      {selectedUserPosts.length === 0 && <div className="px-5 py-12 text-center text-sm text-slate-400">No posts found.</div>}
                    </div>
                  </div>

                  {/* Comments */}
                  <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
                      <MessageSquareText className="w-4 h-4 text-sky-500" />
                      <h3 className="text-sm font-bold text-slate-700">Comments ({selectedUserComments.length})</h3>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-100">
                      {selectedUserComments.map(comment => (
                        <div key={comment.id} className="px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-slate-700 leading-relaxed">{comment.content}</p>
                              <p className="text-xs text-slate-400 mt-1">On post #{comment.post_id}: <span className="italic">{comment.post_content || '—'}</span></p>
                              <p className="text-xs text-slate-400 mt-0.5">{formatTS(comment.created_at)}</p>
                            </div>
                            <button onClick={() => handleDeleteUserComment(comment.id)} disabled={actionLoading === `delete-user-comment-${comment.id}`}
                              className="p-1.5 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-40 shrink-0">
                              {actionLoading === `delete-user-comment-${comment.id}` ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      ))}
                      {selectedUserComments.length === 0 && <div className="px-5 py-12 text-center text-sm text-slate-400">No comments found.</div>}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════ ACTIVITIES TAB ═══════════ */}
        {activeTab === 'activities' && !loading && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard label="Total Activities" value={activities.length} icon={Activity} color={BRAND} />
              <StatCard label="Filtered" value={filteredActivitiesCount} icon={Eye} color="#6366f1" />
            </div>

            {/* Filter pills (matches AdminPanel pill style) */}
            <div className="flex bg-slate-200/50 backdrop-blur-sm rounded-2xl p-1.5 w-fit overflow-x-auto shadow-inner border border-slate-200/50">
              {['all', 'post', 'call_booking', 'connection'].map(filter => (
                <button key={filter} onClick={() => setActivityFilter(filter)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                    activityFilter === filter
                      ? 'bg-white text-slate-800 shadow-sm scale-100'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/40 scale-[0.98]'
                  }`}>
                  {filter === 'all' ? 'All' : filter === 'call_booking' ? 'Calls' : filter.charAt(0).toUpperCase() + filter.slice(1) + 's'}
                </button>
              ))}
            </div>

            {/* Feed */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {activities.filter(a => activityFilter === 'all' || a.type === activityFilter).map((activity, idx) => (
                  <div key={`${activity.type}-${activity.id}-${idx}`} className="px-5 sm:px-6 py-4 hover:bg-slate-50/50 transition-colors flex items-start gap-3 group">

                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                      activity.type === 'post' ? 'bg-indigo-50 text-indigo-500' :
                      activity.type === 'connection' ? 'bg-emerald-50 text-emerald-500' :
                      'bg-sky-50 text-sky-600'
                    }`}>
                      {activity.type === 'post' ? <FileText className="w-5 h-5" /> :
                       activity.type === 'connection' ? <Users className="w-5 h-5" /> :
                       <Phone className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          {activity.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-400">{formatTS(activity.created_at)}</span>
                      </div>

                      <div className="text-sm text-slate-700">
                        {activity.type === 'post' && (
                          <p><span className="font-bold text-slate-800">{activity.user_name}</span> — "{activity.content}"</p>
                        )}
                        {activity.type === 'connection' && (
                          <p><span className="font-bold text-slate-800">{activity.requester_name}</span> → <span className="font-bold text-slate-800">{activity.receiver_name}</span></p>
                        )}
                        {activity.type === 'call_booking' && (
                          <div>
                            <p className="mb-2">
                              <span className="font-bold text-slate-800">{activity.booker_name}</span>
                              <span className="text-slate-400 mx-1.5">booked →</span>
                              <span className="font-bold text-slate-800">{activity.host_name}</span>
                              {activity.price > 0 && <span className="ml-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-xl">{formatINR(activity.price)}</span>}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-slate-50/80 backdrop-blur-sm rounded-xl p-3 border border-slate-100">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Scheduled</p>
                                <p className="font-semibold text-slate-700 text-xs">{formatTS(activity.scheduled_at)}</p>
                              </div>
                              <div className="bg-slate-50/80 backdrop-blur-sm rounded-xl p-3 border border-slate-100">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Joined</p>
                                <p className="font-semibold text-slate-700 text-xs">{activity.started_at ? formatTS(activity.started_at) : 'Not yet'}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <button onClick={() => handleDeleteActivity(activity.type, activity.id)} disabled={actionLoading === `delete-act-${activity.id}`}
                      className="p-2 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-40 shrink-0 opacity-0 group-hover:opacity-100 max-sm:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {activities.filter(a => activityFilter === 'all' || a.type === activityFilter).length === 0 && (
                  <div className="py-16 text-center text-slate-400 text-sm">No activities match this filter.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════ TRANSACTIONS TAB ═══════════ */}
        {activeTab === 'transactions' && !loading && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard label="Total Transactions" value={transactions.length} icon={CreditCard} color={BRAND} />
              <StatCard label="Gross Volume" value={formatINR(totalTransactionsVolume)} icon={DollarSign} color="#10b981" />
            </div>

            {/* Transaction Cards */}
            <div className="space-y-4">
              {transactions.map(txn => (
                <div key={txn.id} className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-[60px] -z-10" />

                  {/* Header */}
                  <div className="px-5 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-600">#{txn.id}</span>
                      <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-lg border ${
                        txn.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>{txn.payment_status || 'pending'}</span>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-lg bg-sky-50 text-sky-700 border border-sky-200">{txn.status || '—'}</span>
                    </div>
                    <p className="text-xl font-extrabold text-slate-800 tracking-tight font-mono">{formatINR(txn.price)}</p>
                  </div>

                  {/* Info Grid */}
                  <div className="px-5 sm:px-6 py-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50/80 backdrop-blur-sm rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Booker</p>
                      <p className="font-semibold text-slate-800">{txn.booker_name}</p>
                      <p className="text-slate-500 truncate">{txn.booker_email || '—'}</p>
                    </div>
                    <div className="bg-slate-50/80 backdrop-blur-sm rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Host</p>
                      <p className="font-semibold text-slate-800">{txn.host_name}</p>
                      <p className="text-slate-500 truncate">{txn.host_email || '—'}</p>
                    </div>
                    <div className="bg-slate-50/80 backdrop-blur-sm rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Call Info</p>
                      <p className="text-slate-700">Type: {txn.call_type || '—'} · {txn.duration_minutes || 0} min</p>
                    </div>
                    <div className="bg-slate-50/80 backdrop-blur-sm rounded-xl p-3 border border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Timeline</p>
                      <p className="text-slate-600">Sch: {formatTS(txn.scheduled_at)}</p>
                      <p className="text-slate-600">Start: {formatTS(txn.started_at)}</p>
                      <p className="text-slate-600">End: {formatTS(txn.ended_at)}</p>
                    </div>
                  </div>

                  {/* Payment refs footer */}
                  <div className="px-5 sm:px-6 py-3 border-t border-slate-100 flex flex-wrap gap-4 text-[11px] text-slate-400">
                    <span>Order: <span className="font-mono text-slate-600">{txn.razorpay_order_id || '—'}</span></span>
                    <span>Payment: <span className="font-mono text-slate-600">{txn.razorpay_payment_id || '—'}</span></span>
                    {txn.meeting_link && <span>Meeting: <span className="font-mono text-slate-600 break-all">{txn.meeting_link}</span></span>}
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-sm py-16 text-center text-slate-400 text-sm">No transactions recorded.</div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default ModeratorPanel;
