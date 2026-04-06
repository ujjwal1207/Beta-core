import React, { useEffect, useMemo, useState } from 'react';
import { Loader, CheckCircle, Trash2, Users, GraduationCap, UserCheck, RefreshCw, LogOut, Building2, PencilLine, AlertTriangle, Settings } from 'lucide-react';
import adminService from '../services/adminService';
import authService from '../services/authService';

const BRAND = '#4f46e5';

const getErrorStatus = (err) => err?.status ?? err?.response?.status;
const getErrorMessage = (err, fallback) => err?.response?.data?.detail || err?.message || fallback;

const StatCard = ({ label, total, day, week, month, icon: Icon, color }) => (
  <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/0 to-slate-50/50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500" />
    <div className="flex items-center justify-between mb-4">
      <p className="text-sm font-bold text-slate-600 tracking-wide">{label}</p>
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: `${color}15` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
    </div>
    <p className="text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">{total?.toLocaleString?.() || 0}</p>
    <div className="grid grid-cols-3 gap-3 text-xs">
      <div className="bg-slate-50/80 backdrop-blur-sm rounded-xl px-2 py-2 text-center border border-slate-100">
        <p className="text-slate-400 font-medium mb-0.5">Day</p>
        <p className="font-bold text-slate-700 text-sm">+{day || 0}</p>
      </div>
      <div className="bg-slate-50/80 backdrop-blur-sm rounded-xl px-2 py-2 text-center border border-slate-100">
        <p className="text-slate-400 font-medium mb-0.5">Week</p>
        <p className="font-bold text-slate-700 text-sm">+{week || 0}</p>
      </div>
      <div className="bg-slate-50/80 backdrop-blur-sm rounded-xl px-2 py-2 text-center border border-slate-100">
        <p className="text-slate-400 font-medium mb-0.5">Month</p>
        <p className="font-bold text-slate-700 text-sm">+{month || 0}</p>
      </div>
    </div>
  </div>
);

const formatDate = (ts) => {
  if (!ts) return '-';
  return new Date(ts * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const AdminLogin = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter username and password');
      return;
    }

    try {
      setLoading(true);
      await authService.login({ email: username.trim(), password });
      await onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const response = await authService.getGoogleLoginUrl('/admin');
      if (response?.url) {
        window.location.href = response.url;
      }
    } catch (err) {
      setError('Google sign in failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl mix-blend-multiply" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-violet-500/10 rounded-full blur-3xl mix-blend-multiply" />

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl border border-white/50 p-8 relative z-10">
        <div className="flex items-center justify-center flex-col text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-900/10 overflow-hidden bg-white">
            <img src="/listenlinklogo.png" alt="ListenLink" className="w-12 h-12 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight mb-1">Admin Portal</h1>
            <p className="text-sm font-medium text-slate-500">Sign in to manage your university</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Admin Email"
              className="w-full p-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-4 rounded-2xl border border-slate-200 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-sm font-medium text-red-600 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 rounded-2xl font-bold text-white shadow-lg shadow-indigo-900/20 disabled:opacity-70 hover:opacity-90 active:scale-[0.98] transition-all"
            style={{ background: BRAND }}
          >
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

const AdminPanel = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
    const [pendingEducations, setPendingEducations] = useState([]);

  const [institutionNameInput, setInstitutionNameInput] = useState('');
  const [isEditingInstitution, setIsEditingInstitution] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashboardResult, pendingResult] = await Promise.allSettled([
        adminService.getUniversityDashboard(),
        adminService.getPendingEducation(),
      ]);

      const hasAuthError = [dashboardResult, pendingResult].some(
        (result) => result.status === 'rejected' && [401, 403].includes(getErrorStatus(result.reason))
      );

      if (hasAuthError) {
        setIsAuthorized(false);
        setDashboard(null);
        setPendingEducations([]);
        return;
      }

      if (dashboardResult.status === 'fulfilled') {
        const dashboardData = dashboardResult.value;
        setDashboard(dashboardData);
        setInstitutionNameInput(dashboardData?.institution?.name || '');
      } else {
        setDashboard(null);
      }
      setIsEditingInstitution(false);



      if (pendingResult.status === 'fulfilled') {
        setPendingEducations(Array.isArray(pendingResult.value?.pending) ? pendingResult.value.pending : []);
      } else {
        setPendingEducations([]);
      }

      const firstFailure = [dashboardResult, pendingResult].find((result) => result.status === 'rejected');
      if (firstFailure?.status === 'rejected') {
        setError(firstFailure.reason?.message || 'Some admin data failed to refresh.');
      }

      setIsAuthorized(true);
    } catch (err) {
      if (err.status === 403 || err.status === 401) {
        setIsAuthorized(false);
      } else {
        setError(err.message || 'Failed to load university admin data');
      }
    } finally {
      setLoading(false);
      setIsCheckingAuth(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const verifiedAlumni = useMemo(() => dashboard?.verified_alumni || [], [dashboard]);
  const students = useMemo(() => dashboard?.students_list || [], [dashboard]);

  const removeStudent = async (userId) => {
    setActionLoading(`remove-${userId}`);
    setMessage('');
    setError('');
    try {
      await adminService.removeStudent(userId);
      await loadDashboard();
      setMessage('Student removed and education marked as not verified.');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to remove student'));
    } finally {
      setActionLoading(null);
    }
  };

  const removeAlumni = async (userId) => {
    setActionLoading(`remove-alumni-${userId}`);
    setMessage('');
    setError('');
    try {
      await adminService.removeAlumni(userId);
      await loadDashboard();
      setMessage('Alumni removed and education marked as not verified.');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to remove alumni'));
    } finally {
      setActionLoading(null);
    }
  };



  const saveInstitution = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!institutionNameInput.trim()) {
      setError('Please enter university/institution name');
      return;
    }

    setActionLoading('save-institution');
    try {
      await adminService.createOrUpdateInstitution(institutionNameInput.trim());
      await loadDashboard();
      setMessage('University linked to this admin account successfully.');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save university'));
    } finally {
      setActionLoading(null);
    }
  };

  const startInstitutionEdit = () => {
    setMessage('');
    setError('');
    setInstitutionNameInput(dashboard?.institution?.name || institutionNameInput || '');
    setIsEditingInstitution(true);
  };

  const cancelInstitutionEdit = () => {
    setInstitutionNameInput(dashboard?.institution?.name || '');
    setIsEditingInstitution(false);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Ignore logout errors and continue.
    }
    setIsAuthorized(false);
  };

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: Users },
    { key: 'pending', label: 'Pending Approvals', icon: UserCheck },
    { key: 'alumni', label: 'Alumni List', icon: GraduationCap },
    { key: 'students', label: 'Students', icon: Users },

    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader className="w-10 h-10 animate-spin" style={{ color: BRAND }} />
      </div>
    );
  }

  if (!isAuthorized) {
    return <AdminLogin onLoginSuccess={loadDashboard} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/10 overflow-hidden bg-white">
              <img src="/listenlinklogo.png" alt="ListenLink" className="w-9 h-9 object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">University Admin Panel</h1>
              <p className="text-sm font-medium text-slate-500">Approvals • Students • Updates</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboard}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-100/80 hover:bg-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-60 transition-colors"
            >
              <RefreshCw className={`inline w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-sm font-semibold text-rose-600 transition-colors"
            >
              <LogOut className="inline w-4 h-4 mr-1.5" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {message && <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{message}</p>}
        {error && <p className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex bg-slate-200/50 backdrop-blur-sm rounded-2xl p-1.5 mb-8 w-fit overflow-x-auto shadow-inner border border-slate-200/50">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                activeTab === tab.key 
                  ? 'bg-white text-slate-800 shadow-sm scale-100' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-white/40 scale-[0.98]'
              }`}
            >
              <tab.icon className={`inline w-4 h-4 mr-2 ${activeTab === tab.key ? 'text-indigo-600' : ''}`} /> {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && dashboard && (
          <div className="space-y-6">
            {dashboard?.institution && (
              <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-lg p-6 relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[80px] -z-10" />
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100/50">
                    <Building2 className="w-7 h-7 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">{dashboard.institution.name}</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">Active Institution</p>
                  </div>
                </div>
                <button onClick={() => setActiveTab('settings')} className="px-5 py-2.5 rounded-xl bg-white text-slate-700 font-bold hover:bg-slate-50 transition-all text-sm border border-slate-200 shadow-sm hover:shadow active:scale-[0.98]">
                  <Settings className="inline w-4 h-4 mr-1.5" /> Manage
                </button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                label="Alumni Registered"
                total={dashboard.alumni?.total}
                day={dashboard.alumni?.growth?.last_day}
                week={dashboard.alumni?.growth?.last_week}
                month={dashboard.alumni?.growth?.last_month}
                icon={GraduationCap}
                color="#4f46e5"
              />
              <StatCard
                label="Students Registered"
                total={dashboard.students?.total}
                day={dashboard.students?.growth?.last_day}
                week={dashboard.students?.growth?.last_week}
                month={dashboard.students?.growth?.last_month}
                icon={Users}
                color="#1d4ed8"
              />
            </div>
          </div>
        )}

                {activeTab === 'pending' && (
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-bl-[100px] -z-10" />
            <div className="p-6 border-b border-slate-100 bg-white/50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center mb-1"><UserCheck className="w-6 h-6 mr-2 text-indigo-600" /> Pending Validations</h2>
                <p className="text-sm font-medium text-slate-500">Approve students and alumni who claimed to study here</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-4 px-6 font-bold text-slate-500 uppercase tracking-widest text-xs">User</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-500 uppercase tracking-widest text-xs">Program / Info</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-500 uppercase tracking-widest text-xs">Type</th>
                    <th className="text-right py-4 px-6 font-bold text-slate-500 uppercase tracking-widest text-xs">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingEducations.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center p-8 text-slate-500">No pending validations!</td>
                    </tr>
                  ) : pendingEducations.map((edu, idx) => (
                    <tr key={`${edu.user_id}-${edu.edu_id}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{edu.user_name}</div>
                        <div className="text-xs text-slate-500">{edu.user_email}</div>
                      </td>
                      <td className="p-3 text-slate-600">
                        Batch: {edu.entry_year} - {edu.passing_year || 'Present'}<br/>
                        <span className="text-xs text-slate-400">Edu ID: {String(edu.edu_id || '-').slice(0, 8)}...</span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${edu.enrollment_status === 'alumni' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                          {edu.enrollment_status === 'alumni' ? 'Alumni' : 'Student'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          disabled={actionLoading === edu.edu_id}
                          onClick={async () => {
                            try {
                              setActionLoading(edu.edu_id);
                              setMessage('');
                              setError('');
                              await adminService.processEducationApproval(edu.user_id, edu.edu_id, 'approve');
                              setPendingEducations((prev) => prev.filter((item) => String(item.edu_id) !== String(edu.edu_id)));
                              setMessage('Education approved successfully!');
                              await loadDashboard();
                            } catch (e) {
                              setError(getErrorMessage(e, 'Failed to approve'));
                            } finally {
                              setActionLoading(null);
                            }
                          }}
                          className="mr-3 inline-flex items-center px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold transition-colors disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" /> Approve
                        </button>
                        <button 
                          disabled={actionLoading === edu.edu_id}
                          onClick={async () => {
                            if (window.confirm('Reject this education claim?')) {
                              try {
                                setActionLoading(edu.edu_id);
                                setMessage('');
                                setError('');
                                await adminService.processEducationApproval(edu.user_id, edu.edu_id, 'reject');
                                setPendingEducations((prev) => prev.filter((item) => String(item.edu_id) !== String(edu.edu_id)));
                                setMessage('Education rejected.');
                                await loadDashboard();
                              } catch (e) {
                                setError(getErrorMessage(e, 'Failed to reject'));
                              } finally {
                                setActionLoading(null);
                              }
                            }
                          }}
                          className="inline-flex items-center px-4 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4 mr-1.5" /> Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'alumni' && (
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-bl-[100px] -z-10" />
            <div className="p-6 border-b border-slate-100 bg-white/50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center mb-1"><CheckCircle className="w-6 h-6 mr-2 text-emerald-600" /> Verified Alumni</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-4 px-6 font-bold text-slate-500 uppercase tracking-widest text-xs">Name</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-500 uppercase tracking-widest text-xs">Email</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-500 uppercase tracking-widest text-xs">Basic Info</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-500 uppercase tracking-widest text-xs">Verified</th>
                    <th className="text-right py-4 px-6 font-bold text-slate-500 uppercase tracking-widest text-xs">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {verifiedAlumni.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100">
                      <td className="p-3 font-semibold text-slate-800">{u.full_name}</td>
                      <td className="p-3 text-slate-600">{u.email}</td>
                      <td className="p-3 text-slate-600">{u.role || '-'} {u.company ? `| ${u.company}` : ''}</td>
                      <td className="p-3 text-green-700 font-semibold">
                        <CheckCircle className="inline w-4 h-4 mr-1" /> Verified Alumni
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => removeAlumni(u.id)}
                          disabled={actionLoading === `remove-alumni-${u.id}`}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-70"
                        >
                          <Trash2 className="inline w-4 h-4 mr-1" />
                          {actionLoading === `remove-alumni-${u.id}` ? 'Removing...' : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {verifiedAlumni.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">No verified alumni yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-bl-[100px] -z-10" />
            <div className="p-6 border-b border-slate-100 bg-white/50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center mb-1"><Users className="w-6 h-6 mr-2 text-blue-600" /> Student Management</h2>
              <p className="text-sm font-medium text-slate-500">Remove student verification for your institution</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left py-4 px-6 font-bold text-slate-500 uppercase tracking-widest text-xs">Name</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-500 uppercase tracking-widest text-xs">Email</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-500 uppercase tracking-widest text-xs">Role</th>
                    <th className="text-left py-4 px-6 font-bold text-slate-500 uppercase tracking-widest text-xs">Joined</th>
                    <th className="text-right py-4 px-6 font-bold text-slate-500 uppercase tracking-widest text-xs">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((u) => (
                    <tr key={u.id} className="border-b border-slate-100">
                      <td className="p-3 font-semibold text-slate-800">{u.full_name}</td>
                      <td className="p-3 text-slate-600">{u.email}</td>
                      <td className="p-3 text-slate-600">{u.role || '-'}</td>
                      <td className="p-3 text-slate-500">{formatDate(u.created_at)}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => removeStudent(u.id)}
                          disabled={actionLoading === `remove-${u.id}`}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:opacity-70"
                        >
                          <Trash2 className="inline w-4 h-4 mr-1" />
                          {actionLoading === `remove-${u.id}` ? 'Removing...' : 'Remove'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-slate-500">No active students found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}



        {activeTab === 'settings' && dashboard && (
          <div className="space-y-4">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200/60 shadow-lg p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-bl-[80px] -z-10" />
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-bold text-slate-800">Linked University</h2>
              </div>
              <p className="text-sm font-medium text-slate-500 mb-6">One admin account manages one institution</p>

              {!dashboard?.institution && (
                <form onSubmit={saveInstitution} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={institutionNameInput}
                    onChange={(e) => setInstitutionNameInput(e.target.value)}
                    placeholder="Enter university name"
                    className="flex-1 p-4 rounded-2xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all shadow-inner"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading === 'save-institution'}
                    className="px-6 py-4 rounded-2xl text-white font-bold shadow-lg shadow-indigo-900/20 disabled:opacity-70 hover:opacity-90 active:scale-[0.98] transition-all"
                    style={{ background: BRAND }}
                  >
                    {actionLoading === 'save-institution' ? 'Saving...' : 'Create University'}
                  </button>
                </form>
              )}

              {dashboard?.institution && !isEditingInstitution && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 backdrop-blur p-5">
                  <p className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-2">Active institution</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tight">{dashboard.institution.name}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-3 inline-flex items-center bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                    🔒 Locked by default
                  </p>
                  <button
                    type="button"
                    onClick={startInstitutionEdit}
                    className="mt-4 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-100 hover:shadow-sm transition-all block w-fit"
                  >
                    <PencilLine className="inline w-4 h-4 mr-1.5" /> Change Name
                  </button>
                </div>
              )}

              {dashboard?.institution && isEditingInstitution && (
                <form onSubmit={saveInstitution} className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 mt-2 shadow-sm">
                  <p className="text-sm font-bold text-amber-800 flex items-center"><AlertTriangle className="w-4 h-4 mr-1.5" /> Edit mode enabled</p>
                  <input
                    type="text"
                    value={institutionNameInput}
                    onChange={(e) => setInstitutionNameInput(e.target.value)}
                    placeholder="Enter updated university name"
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-white/80 focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all shadow-inner"
                  />
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={actionLoading === 'save-institution'}
                      className="flex-1 sm:flex-none px-6 py-3.5 rounded-xl text-white font-bold shadow-md shadow-indigo-900/10 disabled:opacity-70 hover:opacity-90 active:scale-[0.98] transition-all"
                      style={{ background: BRAND }}
                    >
                      {actionLoading === 'save-institution' ? 'Saving...' : 'Confirm Change'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelInstitutionEdit}
                      className="px-6 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all shadow-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
