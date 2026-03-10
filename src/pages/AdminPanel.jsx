import React, { useState, useEffect, useCallback } from 'react';
import { Users, Activity, CreditCard, BarChart3, Star, Search, ChevronLeft, ChevronRight, Loader, Shield, RefreshCw } from 'lucide-react';
import adminService from '../services/adminService';

const BRAND = '#01383f';

// ===== STAT CARD =====
const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
            <Icon className="w-6 h-6" style={{ color }} />
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-slate-800">{typeof value === 'number' ? value.toLocaleString() : value}</p>
        </div>
    </div>
);

// ===== USERS TAB =====
const UsersTab = () => {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(null);
    const limit = 20;

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminService.getUsers(page * limit, limit, search);
            setUsers(data.users);
            setTotal(data.total);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoading(false);
        }
    }, [page, search]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleToggle = async (userId) => {
        try {
            setToggling(userId);
            const result = await adminService.toggleSuperLinker(userId);
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, is_super_linker: result.is_super_linker } : u
            ));
        } catch (err) {
            console.error('Failed to toggle:', err);
        } finally {
            setToggling(null);
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div>
            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by name, email, or role..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(0); }}
                    className="w-full p-3 pl-12 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader className="w-8 h-8 animate-spin" style={{ color: BRAND }} />
                </div>
            ) : (
                <>
                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100" style={{ background: `${BRAND}08` }}>
                                        <th className="text-left p-4 font-semibold text-slate-600">User</th>
                                        <th className="text-left p-4 font-semibold text-slate-600">Email</th>
                                        <th className="text-left p-4 font-semibold text-slate-600">Role</th>
                                        <th className="text-center p-4 font-semibold text-slate-600">Trust Score</th>
                                        <th className="text-center p-4 font-semibold text-slate-600">Connections</th>
                                        <th className="text-center p-4 font-semibold text-slate-600">Status</th>
                                        <th className="text-center p-4 font-semibold text-slate-600">Super Listener</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-sm text-slate-600 shrink-0">
                                                        {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                    <span className="font-medium text-slate-800">{user.full_name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-500">{user.email}</td>
                                            <td className="p-4 text-slate-600">{user.role || '—'}</td>
                                            <td className="p-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold">
                                                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                                    {user.trust_score?.toFixed(1) || '0.0'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center text-slate-600">{user.connections_count}</td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-block w-2.5 h-2.5 rounded-full ${user.is_online ? 'bg-green-500' : 'bg-slate-300'}`} />
                                            </td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => handleToggle(user.id)}
                                                    disabled={toggling === user.id}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${user.is_super_linker
                                                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    {toggling === user.id ? (
                                                        <Loader className="w-3.5 h-3.5 animate-spin inline" />
                                                    ) : user.is_super_linker ? (
                                                        '★ Super'
                                                    ) : (
                                                        'Normal'
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {users.length === 0 && (
                                        <tr><td colSpan={7} className="p-8 text-center text-slate-400">No users found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 text-sm">
                            <p className="text-slate-500">Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 disabled:opacity-40 hover:bg-slate-50"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// ===== ACTIVITIES TAB =====
const ActivitiesTab = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const data = await adminService.getActivities(0, 100);
                setActivities(data.activities);
            } catch (err) {
                console.error('Failed to fetch activities:', err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const formatTime = (ts) => {
        if (!ts) return '—';
        const d = new Date(ts * 1000);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getTypeBadge = (type) => {
        const config = {
            post: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Post' },
            connection: { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Connection' },
            call_booking: { bg: 'bg-green-50', text: 'text-green-700', label: 'Call Booking' },
        };
        const c = config[type] || { bg: 'bg-slate-50', text: 'text-slate-700', label: type };
        return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>{c.label}</span>;
    };

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Loader className="w-8 h-8 animate-spin" style={{ color: BRAND }} />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100" style={{ background: `${BRAND}08` }}>
                            <th className="text-left p-4 font-semibold text-slate-600">Type</th>
                            <th className="text-left p-4 font-semibold text-slate-600">Details</th>
                            <th className="text-left p-4 font-semibold text-slate-600">Status</th>
                            <th className="text-left p-4 font-semibold text-slate-600">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activities.map((act, i) => (
                            <tr key={`${act.type}-${act.id}-${i}`} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                <td className="p-4">{getTypeBadge(act.type)}</td>
                                <td className="p-4 text-slate-700">
                                    {act.type === 'post' && (
                                        <div>
                                            <span className="font-medium">{act.user_name}</span>
                                            <span className="text-slate-400"> created a {act.post_type}</span>
                                            {act.content && <p className="text-xs text-slate-400 mt-1 line-clamp-1">{act.content}</p>}
                                        </div>
                                    )}
                                    {act.type === 'connection' && (
                                        <div>
                                            <span className="font-medium">{act.requester_name}</span>
                                            <span className="text-slate-400"> → </span>
                                            <span className="font-medium">{act.receiver_name}</span>
                                        </div>
                                    )}
                                    {act.type === 'call_booking' && (
                                        <div>
                                            <span className="font-medium">{act.booker_name}</span>
                                            <span className="text-slate-400"> booked call with </span>
                                            <span className="font-medium">{act.host_name}</span>
                                            {act.price > 0 && <span className="text-green-600 ml-1 font-semibold">₹{act.price}</span>}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4">
                                    {act.status && (
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${act.status === 'accepted' || act.status === 'completed' || act.status === 'paid'
                                                ? 'bg-green-50 text-green-700'
                                                : act.status === 'pending'
                                                    ? 'bg-yellow-50 text-yellow-700'
                                                    : act.status === 'rejected' || act.status === 'cancelled'
                                                        ? 'bg-red-50 text-red-700'
                                                        : 'bg-slate-50 text-slate-600'
                                            }`}>
                                            {act.status}
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-slate-400 text-xs whitespace-nowrap">{formatTime(act.created_at)}</td>
                            </tr>
                        ))}
                        {activities.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400">No activities found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ===== TRANSACTIONS TAB =====
const TransactionsTab = () => {
    const [transactions, setTransactions] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            const data = await adminService.getTransactions(0, 100, filter);
            setTransactions(data.transactions);
            setTotal(data.total);
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

    const formatTime = (ts) => {
        if (!ts) return '—';
        const d = new Date(ts * 1000);
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Loader className="w-8 h-8 animate-spin" style={{ color: BRAND }} />
            </div>
        );
    }

    return (
        <div>
            {/* Filter */}
            <div className="flex gap-2 mb-6">
                {['', 'paid', 'pending', 'refunded'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${filter === f
                                ? 'text-white shadow-md'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        style={filter === f ? { background: BRAND } : {}}
                    >
                        {f || 'All'}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100" style={{ background: `${BRAND}08` }}>
                                <th className="text-left p-4 font-semibold text-slate-600">ID</th>
                                <th className="text-left p-4 font-semibold text-slate-600">Booker</th>
                                <th className="text-left p-4 font-semibold text-slate-600">Host</th>
                                <th className="text-right p-4 font-semibold text-slate-600">Amount</th>
                                <th className="text-center p-4 font-semibold text-slate-600">Duration</th>
                                <th className="text-center p-4 font-semibold text-slate-600">Payment</th>
                                <th className="text-center p-4 font-semibold text-slate-600">Status</th>
                                <th className="text-left p-4 font-semibold text-slate-600">Razorpay Order</th>
                                <th className="text-left p-4 font-semibold text-slate-600">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map(txn => (
                                <tr key={txn.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                    <td className="p-4 text-slate-400 font-mono text-xs">#{txn.id}</td>
                                    <td className="p-4">
                                        <div>
                                            <p className="font-medium text-slate-800">{txn.booker_name}</p>
                                            <p className="text-xs text-slate-400">{txn.booker_email}</p>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div>
                                            <p className="font-medium text-slate-800">{txn.host_name}</p>
                                            <p className="text-xs text-slate-400">{txn.host_email}</p>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-bold text-green-700">₹{txn.price}</td>
                                    <td className="p-4 text-center text-slate-600">{txn.duration_minutes} min</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${txn.payment_status === 'paid' ? 'bg-green-50 text-green-700'
                                                : txn.payment_status === 'refunded' ? 'bg-red-50 text-red-700'
                                                    : 'bg-yellow-50 text-yellow-700'
                                            }`}>
                                            {txn.payment_status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${txn.status === 'completed' ? 'bg-green-50 text-green-700'
                                                : txn.status === 'pending' ? 'bg-yellow-50 text-yellow-700'
                                                    : txn.status === 'cancelled' ? 'bg-red-50 text-red-700'
                                                        : 'bg-slate-50 text-slate-600'
                                            }`}>
                                            {txn.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-slate-400 font-mono">{txn.razorpay_order_id || '—'}</td>
                                    <td className="p-4 text-xs text-slate-400 whitespace-nowrap">{formatTime(txn.created_at)}</td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr><td colSpan={9} className="p-8 text-center text-slate-400">No transactions found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <p className="text-sm text-slate-400 mt-3">Total: {total} transaction{total !== 1 ? 's' : ''}</p>
        </div>
    );
};

// ===== MAIN ADMIN PANEL =====
const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('users');
    const [stats, setStats] = useState(null);
    const [authError, setAuthError] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await adminService.getStats();
                setStats(data);
            } catch (err) {
                if (err.status === 403) {
                    setAuthError(true);
                }
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    // Access denied screen
    if (authError) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 max-w-md text-center">
                    <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
                    <p className="text-slate-500 mb-6">You don't have admin privileges. Contact your administrator to get access.</p>
                    <a
                        href="/"
                        className="inline-block px-6 py-3 rounded-xl text-white font-semibold transition-transform hover:scale-105"
                        style={{ background: BRAND }}
                    >
                        Go to App
                    </a>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader className="w-10 h-10 animate-spin" style={{ color: BRAND }} />
            </div>
        );
    }

    const tabs = [
        { key: 'users', label: 'Users', icon: Users },
        { key: 'activities', label: 'Activities', icon: Activity },
        { key: 'transactions', label: 'Transactions', icon: CreditCard },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: BRAND }}>
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">ListenLink Admin</h1>
                            <p className="text-xs text-slate-400">Manage users, activities & transactions</p>
                        </div>
                    </div>
                    <a
                        href="/"
                        className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        ← Back to App
                    </a>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-6">
                {/* Stats Grid */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <StatCard icon={Users} label="Total Users" value={stats.total_users} color="#6366f1" />
                        <StatCard icon={Star} label="Super Listeners" value={stats.super_linkers} color="#f59e0b" />
                        <StatCard icon={Activity} label="Posts" value={stats.total_posts} color="#3b82f6" />
                        <StatCard icon={BarChart3} label="Connections" value={stats.total_connections} color="#8b5cf6" />
                        <StatCard icon={CreditCard} label="Total Bookings" value={stats.total_bookings} color="#10b981" />
                        <StatCard icon={CreditCard} label="Paid Bookings" value={stats.paid_bookings} color="#059669" />
                        <StatCard icon={CreditCard} label="Revenue" value={`₹${stats.total_revenue?.toLocaleString() || 0}`} color="#0d9488" />
                        <StatCard icon={Star} label="Reviews" value={stats.total_reviews} color="#ec4899" />
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key
                                    ? 'bg-white text-slate-800 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'users' && <UsersTab />}
                {activeTab === 'activities' && <ActivitiesTab />}
                {activeTab === 'transactions' && <TransactionsTab />}
            </div>
        </div>
    );
};

export default AdminPanel;
