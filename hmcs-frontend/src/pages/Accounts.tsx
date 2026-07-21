import { useState, useEffect } from 'react';
import { Search, ArrowUpRight, ArrowDownLeft, Wallet, Plus, Eye, BookOpen, Power } from 'lucide-react';
import Layout from '../components/Layout';
import * as AccountService from '../services/account.service';
import ViewAccountModal from '../components/ViewAccountModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useLanguage } from '../context/LanguageContext';

export default function Accounts() {
  const { t } = useLanguage();
  const [accounts, setAccounts] = useState<AccountService.AccountData[]>([]);
  const [members, setMembers] = useState<AccountService.MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewAccount, setViewAccount] = useState<AccountService.AccountData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Passbook state
  const [showPassbook, setShowPassbook] = useState<string | null>(null);
  const [passbookData, setPassbookData] = useState<{ account: any; transactions: any[]; dailyBalances: any[] } | null>(null);
  const [passbookLoading, setPassbookLoading] = useState(false);
  
  // Transaction Modal state
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<'DEPOSIT' | 'WITHDRAW'>('DEPOSIT');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txError, setTxError] = useState('');

  const [formData, setFormData] = useState({
    memberId: '',
    accountType: 'REGULAR',
    initialDeposit: 1000,
    childName: '',
    childBirthCertificate: '',
    childDateOfBirth: ''
  });
  const [submitError, setSubmitError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; variant?: 'danger' | 'warning' | 'info' }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accs, mems] = await Promise.all([
        AccountService.getAccounts(),
        AccountService.getMembers()
      ]);
      setAccounts(accs);
      setMembers(mems);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    try {
      await AccountService.openAccount(formData);
      setShowModal(false);
      setFormData({ memberId: '', accountType: 'REGULAR', initialDeposit: 1000, childName: '', childBirthCertificate: '', childDateOfBirth: '' });
      fetchData();
    } catch (err: any) {
      setSubmitError(err.response?.data || 'Failed to open account.');
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxError('');
    try {
      if (txType === 'DEPOSIT') {
        await AccountService.deposit({ accountNumber: selectedAccount, amount: txAmount });
      } else {
        await AccountService.withdraw({ accountNumber: selectedAccount, amount: txAmount });
      }
      setShowTxModal(false);
      setTxAmount(0);
      fetchData();
    } catch (err: any) {
      setTxError(err.response?.data || `Failed to process ${txType.toLowerCase()}.`);
    }
  };

  const filteredAccounts = accounts.filter(acc => 
    acc.accountNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    acc.memberId.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewPassbook = async (accountId: string) => {
    setShowPassbook(accountId);
    setPassbookLoading(true);
    setPassbookData(null);
    try {
      const data = await AccountService.getPassbook(accountId);
      setPassbookData(data);
    } catch (err) {
      console.error('Failed to fetch passbook:', err);
    } finally {
      setPassbookLoading(false);
    }
  };

  return (
    <Layout>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Savings Accounts</h1>
            <p className="text-sm text-slate-500">Manage savings, children's accounts, and transactions.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
            >
              <Plus size={18} />
              Open New Account
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Balance</p>
              <p className="text-2xl font-bold text-slate-800">
                Rs. {accounts.reduce((sum, acc) => sum + acc.balance, 0).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ArrowDownLeft size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Active Accounts</p>
              <p className="text-2xl font-bold text-slate-800">{accounts.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <ArrowUpRight size={24} />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Avg. Balance</p>
              <p className="text-2xl font-bold text-slate-800">
                Rs. {accounts.length > 0 ? (accounts.reduce((sum, acc) => sum + acc.balance, 0) / accounts.length).toLocaleString(undefined, {maximumFractionDigits: 0}) : 0}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-t-xl border border-slate-200 border-b-0 flex justify-between items-center">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by account number..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-b-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-medium">Account Number</th>
                  <th className="px-6 py-3 font-medium">Account Holder</th>
                  <th className="px-6 py-3 font-medium">Type</th>
                  <th className="px-6 py-3 font-medium">Balance</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading accounts...</td>
                  </tr>
                ) : filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No accounts found.</td>
                  </tr>
                ) : (
                  filteredAccounts.map((acc) => (
                    <tr key={acc.accountId} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{acc.accountNumber}</td>
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {acc.childName || members.find(m => m.memberId === acc.memberId)?.fullName || members.find(m => m.memberId === acc.memberId)?.fullNameSinhala || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-xs uppercase font-bold">
                          {acc.accountType}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">Rs. {acc.balance.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          acc.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {acc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <button 
                          onClick={() => setViewAccount(acc)}
                          className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"
                          title="View Account"
                        >
                          View
                        </button>
                        <button 
                          onClick={() => handleViewPassbook(acc.accountId!)}
                          className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1"
                          title="View Passbook"
                        >
                          <BookOpen size={14} /> Passbook
                        </button>
                        <button 
                          onClick={() => {
                            setTxType('DEPOSIT');
                            setSelectedAccount(acc.accountNumber);
                            setShowTxModal(true);
                          }}
                          className="bg-emerald-50 text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-100 transition-colors"
                          title="Deposit"
                        >
                          <ArrowDownLeft size={18} />
                        </button>
                        <button 
                          onClick={() => {
                            setTxType('WITHDRAW');
                            setSelectedAccount(acc.accountNumber);
                            setShowTxModal(true);
                          }}
                          className="bg-red-50 text-red-700 p-1.5 rounded-lg hover:bg-red-100 transition-colors"
                          title="Withdraw"
                        >
                          <ArrowUpRight size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDialog({
                              isOpen: true,
                              title: acc.status === 'ACTIVE' ? 'ගිණුම අක්‍රිය කරන්නද?' : 'ගිණුම සක්‍රිය කරන්නද?',
                              message: `"${acc.accountNumber}" ගිණුම ${acc.status === 'ACTIVE' ? 'අක්‍රිය' : 'සක්‍රිය'} කිරීමට ඔබ ස්ථිරද?`,
                              variant: acc.status === 'ACTIVE' ? 'warning' : 'info',
                              onConfirm: async () => {
                                try {
                                  await AccountService.updateAccountStatus(acc.accountId!, acc.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
                                  fetchData();
                                } catch (e) {
                                  (window as any).showToast('Failed to update account status');
                                }
                                setConfirmDialog(d => ({ ...d, isOpen: false }));
                              }
                            });
                          }}
                          className={`${acc.status === 'ACTIVE' ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'} p-1.5 rounded-lg transition-colors`}
                          title={acc.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                        >
                          <Power size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Open Account Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Open New Savings Account</h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <div className="p-6">
                {submitError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{submitError}</div>}
                <form onSubmit={handleOpenAccount} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Member</label>
                    <select 
                      required
                      value={formData.memberId}
                      onChange={(e) => setFormData({...formData, memberId: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    >
                      <option value="">Select a member...</option>
                      {members.map(m => (
                        <option key={m.memberId} value={m.memberId}>{m.fullName} - {m.nic}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Account Type</label>
                    <select 
                      required
                      value={formData.accountType}
                      onChange={(e) => setFormData({...formData, accountType: e.target.value})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                    >
                      <option value="REGULAR">Regular Savings</option>
                      <option value="CHILD">Children's Account</option>
                      <option value="SENIOR">Senior Citizen Account</option>
                      <option value="FIXED">Fixed Deposit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Initial Deposit (Rs.)</label>
                    <input 
                      type="number" required min="100"
                      value={formData.initialDeposit}
                      onChange={(e) => setFormData({...formData, initialDeposit: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all" 
                    />
                  </div>

                  {formData.accountType === 'CHILD' && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4 mt-4">
                      <h4 className="text-xs font-bold text-slate-700 uppercase">Child Information</h4>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Child's Name *</label>
                        <input required value={formData.childName} onChange={e => setFormData(p => ({ ...p, childName: e.target.value }))}
                          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Birth Certificate No. *</label>
                          <input required value={formData.childBirthCertificate} onChange={e => setFormData(p => ({ ...p, childBirthCertificate: e.target.value }))}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Date of Birth *</label>
                          <input required type="date" value={formData.childDateOfBirth} onChange={e => setFormData(p => ({ ...p, childDateOfBirth: e.target.value }))}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                    <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors">Open Account</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Transaction Modal */}
        {showTxModal && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">{txType === 'DEPOSIT' ? 'Deposit Cash' : 'Withdraw Cash'}</h3>
                <button onClick={() => setShowTxModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              <div className="p-6">
                {txError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">{txError}</div>}
                <form onSubmit={handleTransaction} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Account Number</label>
                    <input 
                      type="text" disabled
                      value={selectedAccount}
                      className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-slate-600" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount (Rs.)</label>
                    <input 
                      type="number" required min="1"
                      value={txAmount}
                      onChange={(e) => setTxAmount(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all" 
                    />
                  </div>
                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => setShowTxModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                    <button 
                      type="submit" 
                      className={`${txType === 'DEPOSIT' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors`}
                    >
                      Process {txType === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* View Account Modal */}
        {viewAccount && (
          <ViewAccountModal 
            account={viewAccount} 
            members={members} 
            onClose={() => setViewAccount(null)} 
          />
        )}

        {/* Passbook Modal */}
        {showPassbook && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50 rounded-t-2xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <BookOpen size={20} className="text-indigo-600" /> Account Passbook / Statement
                  </h3>
                  {passbookData && (
                    <p className="text-xs text-slate-500 mt-1 font-mono">{passbookData.account?.accountNumber}</p>
                  )}
                </div>
                <button onClick={() => setShowPassbook(null)} className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-white transition-colors">✕</button>
              </div>
              <div className="p-0 overflow-y-auto flex-1">
                {passbookLoading ? (
                  <div className="p-12 text-center text-slate-500 font-medium animate-pulse">Loading passbook data...</div>
                ) : passbookData ? (
                  <div className="p-6 space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Balance</p>
                        <p className="text-2xl font-black text-slate-800 font-mono">Rs. {passbookData.account?.balance?.toLocaleString()}</p>
                      </div>
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Interest Rate</p>
                        <p className="text-2xl font-black text-indigo-600 font-mono">{(passbookData.account?.annualInterestRate * 100).toFixed(2)}%</p>
                      </div>
                      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                        <p className="text-lg font-bold text-emerald-600 mt-1">{passbookData.account?.status}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      {/* Transactions */}
                      <div>
                        <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">Transactions History</h4>
                        {passbookData.transactions.length === 0 ? (
                          <p className="text-sm text-slate-500">No transactions recorded.</p>
                        ) : (
                          <div className="space-y-3">
                            {passbookData.transactions.sort((a,b) => new Date(b.transactionTimestamp).getTime() - new Date(a.transactionTimestamp).getTime()).map((tx: any) => (
                              <div key={tx.transactionId} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                                <div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${(tx.transactionType.includes('DEPOSIT') || tx.transactionType === 'BROUGHT_FORWARD') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {tx.transactionType.replace('_', ' ')}
                                  </span>
                                  <p className="text-xs text-slate-400 mt-1">{new Date(tx.transactionTimestamp).toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                  <p className={`font-mono font-bold ${(tx.transactionType.includes('DEPOSIT') || tx.transactionType === 'BROUGHT_FORWARD') ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {(tx.transactionType.includes('DEPOSIT') || tx.transactionType === 'BROUGHT_FORWARD') ? '+' : '-'} {tx.amount.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-slate-500 font-mono mt-0.5">Bal: {tx.balanceAfter.toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Daily Balances / Interest */}
                      <div>
                        <h4 className="font-bold text-slate-800 mb-4 border-b pb-2">Daily Balances & Interest</h4>
                        {passbookData.dailyBalances.length === 0 ? (
                          <p className="text-sm text-slate-500">No daily balances recorded yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {passbookData.dailyBalances.sort((a,b) => new Date(b.recordDate).getTime() - new Date(a.recordDate).getTime()).map((db: any) => (
                              <div key={db.id} className="flex justify-between items-center p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                                <div>
                                  <p className="text-sm font-bold text-slate-700">{db.recordDate}</p>
                                  <p className="text-xs text-slate-500 mt-0.5 font-mono">Bal: {db.endOfDayBalance.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Interest Added</p>
                                  <p className="font-mono font-bold text-blue-600">+{db.dailyInterestEarned.toLocaleString()}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center text-red-500 font-medium">Failed to load passbook.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(d => ({ ...d, isOpen: false }))}
      />
    </Layout>
  );
}
