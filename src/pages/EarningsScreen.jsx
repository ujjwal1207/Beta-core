import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  CheckCircle, 
  XCircle,
  Building2,
  Plus,
  ChevronRight,
  Calendar,
  TrendingUp,
  Phone,
  CreditCard,
  AlertCircle,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import callsService from '../services/callsService';

const EarningsScreen = () => {
  const { user, setScreen, showToast } = useAppContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [earnings, setEarnings] = useState({
    availableBalance: 0,
    pendingClearance: 0,
    lifetimeEarnings: 0,
    lastPayout: null,
    weeklyEarnings: []
  });
  const [bankAccount, setBankAccount] = useState(null);
  const [showAddBank, setShowAddBank] = useState(false);
  const [bankForm, setBankForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payoutSchedule, setPayoutSchedule] = useState('manual');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      setIsLoading(true);
      const scheduledCalls = await callsService.getScheduledCalls();
      
      // Filter completed calls where user is the host
      const completedCalls = scheduledCalls.filter(call =>
        call.status === 'completed' && call.host_id === user.id
      );

      // Calculate earnings
      const lifetimeEarnings = completedCalls.reduce((sum, call) => sum + (call.price || 0), 0);
      
      // Calculate pending (calls completed in last 7 days)
      const sevenDaysAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
      const pendingCalls = completedCalls.filter(call => call.completed_at > sevenDaysAgo);
      const pendingClearance = pendingCalls.reduce((sum, call) => sum + (call.price || 0), 0);
      
      // Available = lifetime - pending (simplified model)
      const availableBalance = lifetimeEarnings - pendingClearance;

      // Generate weekly earnings for chart (last 7 days)
      const weeklyEarnings = [];
      for (let i = 6; i >= 0; i--) {
        const dayStart = Math.floor(Date.now() / 1000) - (i * 24 * 60 * 60);
        const dayEnd = dayStart + (24 * 60 * 60);
        const dayEarnings = completedCalls
          .filter(call => call.completed_at >= dayStart && call.completed_at < dayEnd)
          .reduce((sum, call) => sum + (call.price || 0), 0);
        weeklyEarnings.push({
          day: new Date(dayStart * 1000).toLocaleDateString('en-IN', { weekday: 'short' }),
          amount: dayEarnings
        });
      }

      // Build transactions list
      const txns = completedCalls.map(call => ({
        id: call.id,
        type: 'earning',
        amount: call.price || 0,
        description: `${call.duration || 30}-min call with ${call.booker?.full_name || 'User'}`,
        date: call.completed_at || call.scheduled_at,
        status: call.completed_at > sevenDaysAgo ? 'pending' : 'completed'
      })).sort((a, b) => b.date - a.date);

      setTransactions(txns);
      setEarnings({
        availableBalance: Math.max(0, availableBalance),
        pendingClearance,
        lifetimeEarnings,
        lastPayout: null, // Would come from backend
        weeklyEarnings
      });

      // Mock bank account (would come from backend)
      // setBankAccount({ bankName: 'HDFC Bank', lastFour: '1234' });

    } catch (error) {
      console.error('Failed to fetch earnings data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBankAccount = async (e) => {
    e.preventDefault();
    
    if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
      showToast('Account numbers do not match', 'error');
      return;
    }

    if (bankForm.ifscCode.length !== 11) {
      showToast('Invalid IFSC code', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setBankAccount({
        bankName: bankForm.bankName || 'Bank',
        lastFour: bankForm.accountNumber.slice(-4)
      });
      setShowAddBank(false);
      setBankForm({
        accountHolderName: '',
        accountNumber: '',
        confirmAccountNumber: '',
        ifscCode: '',
        bankName: ''
      });
      showToast('Bank account added successfully', 'success');
    } catch (error) {
      showToast('Failed to add bank account', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveBankAccount = () => {
    setBankAccount(null);
    showToast('Bank account removed', 'success');
  };

  const handleWithdraw = async () => {
    if (!bankAccount) {
      showToast('Please add a bank account first', 'error');
      setActiveTab('settings');
      return;
    }

    if (earnings.availableBalance <= 0) {
      showToast('No funds available for withdrawal', 'error');
      return;
    }

    // Would trigger withdrawal API
    showToast('Withdrawal request submitted', 'success');
  };

  const filteredTransactions = transactions.filter(txn => {
    if (filterType === 'all') return true;
    return txn.type === filterType;
  });

  const maxWeeklyEarning = Math.max(...earnings.weeklyEarnings.map(d => d.amount), 100);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full bg-slate-50">
        <div className="flex items-center gap-3 p-4 bg-white border-b border-slate-100">
          <button onClick={() => setScreen('SUPER_LISTENER_DASHBOARD')} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">Earnings & Payouts</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white border-b border-slate-100">
        <button 
          onClick={() => setScreen('SUPER_LISTENER_DASHBOARD')} 
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-lg font-bold text-slate-800">Earnings & Payouts</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-slate-100 px-4">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'transactions', label: 'Transactions' },
          { id: 'settings', label: 'Payout Settings' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'text-indigo-600 border-indigo-600'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="p-4 max-w-xl mx-auto">
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 mb-5 shadow-lg shadow-emerald-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-emerald-200" />
                  <span className="text-xs font-medium text-emerald-200 uppercase tracking-wide">Available Balance</span>
                </div>
                <button
                  onClick={handleWithdraw}
                  className="px-4 py-1.5 bg-white text-emerald-600 text-sm font-semibold rounded-full hover:bg-emerald-50 transition-colors"
                >
                  Withdraw
                </button>
              </div>
              <p className="text-3xl font-bold text-white">
                ₹{earnings.availableBalance.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  <span className="text-xs text-slate-400">Lifetime Earnings</span>
                </div>
                <p className="text-xl font-bold text-slate-800">₹{earnings.lifetimeEarnings.toLocaleString('en-IN')}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-slate-400">Pending Clearance</span>
                </div>
                <p className="text-xl font-bold text-slate-800">₹{earnings.pendingClearance.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Info Banner */}
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">7-Day Clearance Period</p>
                <p className="text-xs text-amber-600 mt-0.5">Earnings from calls are available for withdrawal after 7 days.</p>
              </div>
            </div>

            {/* Weekly Chart */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">This Week's Earnings</h3>
              <div className="flex items-end justify-between gap-2 h-32">
                {earnings.weeklyEarnings.map((day, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex justify-center mb-2">
                      <div
                        className="w-8 bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-md transition-all"
                        style={{ height: `${Math.max((day.amount / maxWeeklyEarning) * 100, 4)}px` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">{day.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions Preview */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between p-4 border-b border-slate-50">
                <h3 className="text-sm font-semibold text-slate-700">Recent Transactions</h3>
                <button 
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs text-indigo-500 font-medium flex items-center gap-0.5"
                >
                  View all <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {transactions.slice(0, 3).length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {transactions.slice(0, 3).map(txn => (
                    <div key={txn.id} className="flex items-center gap-3 p-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        txn.type === 'earning' ? 'bg-emerald-50' : 'bg-blue-50'
                      }`}>
                        {txn.type === 'earning' ? (
                          <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{txn.description}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(txn.date * 1000).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${txn.type === 'earning' ? 'text-emerald-600' : 'text-slate-700'}`}>
                          {txn.type === 'earning' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                        </p>
                        <p className={`text-xs ${txn.status === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {txn.status === 'completed' ? 'Cleared' : 'Pending'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Phone className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No transactions yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="p-4 max-w-xl mx-auto">
            {/* Filter */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'earning', label: 'Earnings' },
                { id: 'payout', label: 'Payouts' }
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setFilterType(filter.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    filterType === filter.id
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Transactions List */}
            {filteredTransactions.length > 0 ? (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                {filteredTransactions.map(txn => (
                  <div key={txn.id} className="flex items-center gap-3 p-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      txn.type === 'earning' ? 'bg-emerald-50' : 'bg-blue-50'
                    }`}>
                      {txn.type === 'earning' ? (
                        <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{txn.description}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(txn.date * 1000).toLocaleDateString('en-IN', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${txn.type === 'earning' ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {txn.type === 'earning' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN')}
                      </p>
                      <div className="flex items-center gap-1 justify-end">
                        {txn.status === 'completed' ? (
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                        ) : txn.status === 'pending' ? (
                          <Clock className="w-3 h-3 text-amber-500" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                        <span className={`text-xs capitalize ${
                          txn.status === 'completed' ? 'text-emerald-500' : 
                          txn.status === 'pending' ? 'text-amber-500' : 'text-red-500'
                        }`}>
                          {txn.status === 'completed' ? 'Cleared' : txn.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-12 text-center">
                <Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-medium">No transactions found</p>
                <p className="text-xs text-slate-400 mt-1">Your transaction history will appear here</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 max-w-xl mx-auto">
            {/* Linked Bank Account */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Bank Account</h3>
              
              {bankAccount ? (
                <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{bankAccount.bankName}</p>
                      <p className="text-xs text-slate-400">Account ending in {bankAccount.lastFour}</p>
                    </div>
                    <button
                      onClick={handleRemoveBankAccount}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : showAddBank ? (
                <form onSubmit={handleAddBankAccount} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Account Holder Name</label>
                    <input
                      type="text"
                      value={bankForm.accountHolderName}
                      onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="As per bank records"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Bank Name</label>
                    <input
                      type="text"
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g. HDFC Bank"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Account Number</label>
                    <input
                      type="text"
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter account number"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirm Account Number</label>
                    <input
                      type="text"
                      value={bankForm.confirmAccountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, confirmAccountNumber: e.target.value.replace(/\D/g, '') })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Re-enter account number"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">IFSC Code</label>
                    <input
                      type="text"
                      value={bankForm.ifscCode}
                      onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase().slice(0, 11) })}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="e.g. HDFC0001234"
                      required
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddBank(false)}
                      className="flex-1 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 py-2.5 text-sm font-medium text-white bg-indigo-500 rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        'Add Account'
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowAddBank(true)}
                  className="w-full flex items-center gap-3 p-4 bg-white rounded-xl border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-slate-700">Add Bank Account</p>
                    <p className="text-xs text-slate-400">Required for withdrawals</p>
                  </div>
                </button>
              )}
            </div>

            {/* Payout Schedule */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Payout Schedule</h3>
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm divide-y divide-slate-50">
                {[
                  { id: 'manual', label: 'Manual Withdrawal', desc: 'Withdraw anytime you want' },
                  { id: 'weekly', label: 'Weekly (Every Monday)', desc: 'Automatic payout every week' },
                  { id: 'monthly', label: 'Monthly (1st of month)', desc: 'Automatic payout every month' }
                ].map(option => (
                  <button
                    key={option.id}
                    onClick={() => setPayoutSchedule(option.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      payoutSchedule === option.id ? 'border-indigo-500' : 'border-slate-300'
                    }`}>
                      {payoutSchedule === option.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{option.label}</p>
                      <p className="text-xs text-slate-400">{option.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Minimum Payout Info */}
            <div className="bg-slate-100 rounded-xl p-4 flex gap-3">
              <CreditCard className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-700">Minimum Payout: ₹100</p>
                <p className="text-xs text-slate-500 mt-0.5">Payouts are processed within 2-3 business days.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EarningsScreen;
