import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, DollarSign, Star, Users, TrendingUp, Clock, CheckCircle, ChevronRight, Phone, CreditCard, MessageSquare, Award } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import TopTabBar from '../components/layout/TopTabBar';
import callsService from '../services/callsService';
import { getAvatarUrl } from '../lib/avatarUtils';

const SuperListenerDashboard = () => {
  const { user, setScreen } = useAppContext();
  const [stats, setStats] = useState({
    totalEarnings: 0,
    completedCalls: 0,
    pendingBookings: 0,
    averageRating: 0,
    totalReviews: 0,
    upcomingCalls: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      const scheduledCalls = await callsService.getScheduledCalls();
      const reviews = await callsService.getUserReviews(user.id, 50);

      const completedCalls = scheduledCalls.filter(call =>
        call.status === 'completed' && call.host_id === user.id
      );

      const pendingBookings = scheduledCalls.filter(call =>
        call.status === 'pending' && call.host_id === user.id
      );

      const upcomingCalls = scheduledCalls.filter(call =>
        call.status === 'scheduled' &&
        call.host_id === user.id &&
        call.scheduled_at > Date.now() / 1000
      ).slice(0, 5);

      const totalEarnings = completedCalls.reduce((sum, call) => sum + (call.price || 0), 0);

      const averageRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : 0;

      setStats({
        totalEarnings,
        completedCalls: completedCalls.length,
        pendingBookings: pendingBookings.length,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: reviews.length,
        upcomingCalls
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <TopTabBar setScreen={setScreen} currentScreen="SUPER_LISTENER_DASHBOARD" />
        <div className="flex-grow flex items-center justify-center pt-[121px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent mx-auto mb-3"></div>
            <p className="text-sm text-slate-500">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <TopTabBar setScreen={setScreen} currentScreen="SUPER_LISTENER_DASHBOARD" />

      <div className="flex-grow overflow-y-auto pt-[121px] pb-6">
        <div className="px-4 max-w-lg mx-auto">

          {/* Earnings Hero Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-5 mb-5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8"></div>
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-6 -translate-x-6"></div>
            <p className="text-indigo-200 text-sm font-medium mb-1">Total Earnings</p>
            <p className="text-3xl font-bold tracking-tight">₹{stats.totalEarnings.toLocaleString('en-IN')}</p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-indigo-300" />
                <span className="text-sm text-indigo-100">{stats.completedCalls} calls</span>
              </div>
              <div className="w-px h-4 bg-indigo-400"></div>
              <div className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-300" />
                <span className="text-sm text-indigo-100">{stats.averageRating} ({stats.totalReviews})</span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-lg font-bold text-slate-900">{stats.completedCalls}</p>
              <p className="text-[11px] text-slate-500">Completed</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-lg font-bold text-slate-900">{stats.pendingBookings > 0 ? stats.pendingBookings : ''}</p>
              <p className="text-[11px] text-slate-500">Pending</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-slate-200 text-center">
              <div className="w-8 h-8 rounded-lg bg-yellow-50 flex items-center justify-center mx-auto mb-2">
                <Star className="w-4 h-4 text-yellow-500" />
              </div>
              <p className="text-lg font-bold text-slate-900">{stats.averageRating}</p>
              <p className="text-[11px] text-slate-500">{stats.totalReviews} reviews</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-5">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-1 mb-3">Quick Actions</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              <ActionRow
                icon={Phone}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                label="Call History"
                sublabel="View all past consultations"
                onClick={() => setScreen('CALL_HISTORY')}
              />
              <ActionRow
                icon={TrendingUp}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                label="Set Rates"
                sublabel={user?.pay_rate_per_min ? `₹${user.pay_rate_per_min}/min` : 'Configure pricing'}
                onClick={() => setScreen('CONSULTATION_RATE_SETTINGS')}
              />
              <ActionRow
                icon={CreditCard}
                iconBg="bg-violet-50"
                iconColor="text-violet-600"
                label="Bank Details"
                sublabel="Payout account settings"
                onClick={() => setScreen('BANK_DETAILS')}
              />
              <ActionRow
                icon={Award}
                iconBg="bg-yellow-50"
                iconColor="text-yellow-600"
                label="Reviews"
                sublabel={`${stats.totalReviews} reviews received`}
                onClick={() => setScreen('REVIEWS')}
              />
            </div>
          </div>

          {/* Upcoming Calls */}
          <div className="mb-5">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-1 mb-3">Upcoming Calls</h2>
            {stats.upcomingCalls.length > 0 ? (
              <div className="space-y-2.5">
                {stats.upcomingCalls.map((call) => (
                  <div key={call.id} className="bg-white rounded-xl p-3.5 border border-slate-200 flex items-center gap-3">
                    <img 
                      src={call.booker?.profile_photo || getAvatarUrl(call.booker?.full_name || 'A')}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover bg-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{call.booker?.full_name || 'Anonymous'}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(call.scheduled_at * 1000).toLocaleDateString('en-IN', { 
                          weekday: 'short', month: 'short', day: 'numeric'
                        })} · {new Date(call.scheduled_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-600 whitespace-nowrap">₹{call.price}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-700">No upcoming calls</p>
                <p className="text-xs text-slate-400 mt-1">Confirmed consultations appear here</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

const ActionRow = ({ icon: Icon, iconBg, iconColor, label, sublabel, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center w-full px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors"
  >
    <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center mr-3 flex-shrink-0`}>
      <Icon className={`w-[18px] h-[18px] ${iconColor}`} />
    </div>
    <div className="flex-1 text-left min-w-0">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      {sublabel && <p className="text-xs text-slate-500 truncate">{sublabel}</p>}
    </div>
    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />
  </button>
);

export default SuperListenerDashboard;