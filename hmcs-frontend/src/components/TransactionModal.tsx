import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, ArrowDownLeft, ArrowUpRight, Lock, FileText, CheckCircle, Printer, Fingerprint, KeyRound, Search } from 'lucide-react';
import * as AccountService from '../services/account.service';

export type TransactionAction = 'DEPOSIT' | 'WITHDRAW' | 'CLOSE_FD' | 'PAY_INSTALLMENT';

interface Props {
  accountId?: string;
  accountNumber: string;
  accountType: string;
  balance?: number;
  accountHolder?: string;
  action: TransactionAction;
  onClose: () => void;
  onSuccess: () => void;
  allAccounts?: any[];
  members?: any[];
}

export default function TransactionModal({ accountId, accountNumber, accountType, balance = 0, accountHolder = 'N/A', action, onClose, onSuccess, allAccounts = [], members = [] }: Props) {
  if (window.__isAdminView) return <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center"><h3 className="text-xl font-bold text-red-600 mb-2">Access Denied</h3><p className="text-slate-600 mb-6">System Administrators are in Read-Only mode and cannot perform transactions or open accounts.</p><button onClick={typeof onClose !== 'undefined' ? onClose : () => {}} className="bg-slate-800 text-white px-6 py-2 rounded-xl font-semibold hover:bg-slate-700">Close</button></div></div>;
  const [internalAccNo, setInternalAccNo] = useState(accountNumber || '');
  const [internalAccId, setInternalAccId] = useState(accountId || '');
  const [amount, setAmount] = useState<number | ''>('');
  const [reference, setReference] = useState('');
  
  // Manager Override State
  const [managerUsername, setManagerUsername] = useState('');
  const [managerPassword, setManagerPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Success state for Receipt
  const [isSuccess, setIsSuccess] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const [globalAccounts, setGlobalAccounts] = useState<any[]>(allAccounts);
  const [fetchedMemberName, setFetchedMemberName] = useState<string>('');
  const [fetchedMemberSig, setFetchedMemberSig] = useState<string>('');
  
  useEffect(() => {
    import('../services/account.service').then(m => {
      m.getAccounts().then(setGlobalAccounts).catch(() => {});
    });
  }, []);

  // Derive account details if searching
  let currentBalance = balance;
  let currentType = accountType;
  let currentHolder = accountHolder;
  let currentSignature = '';

  const activeAccNo = accountNumber || internalAccNo;
  const matched = activeAccNo && globalAccounts.length > 0 ? globalAccounts.find(a => a.accountNumber === activeAccNo) : null;

  useEffect(() => {
    if (matched && matched.memberId) {
      import('../services/account.service').then(m => {
        m.getMemberById(matched.memberId)
          .then(member => {
             setFetchedMemberName(member.fullName || member.fullNameSinhala || 'N/A');
             setFetchedMemberSig(member.digitalSignatureUrl || '');
          })
          .catch(() => {
             setFetchedMemberName('N/A');
             setFetchedMemberSig('');
          });
      });
    } else {
      setFetchedMemberName('');
      setFetchedMemberSig('');
    }
  }, [matched?.memberId]);

  if (matched) {
    if (!accountNumber) {
      currentBalance = Number(matched.balance) || 0;
      currentType = matched.accountType || 'SAVINGS';
      currentHolder = matched.childName || fetchedMemberName || 'Loading...';
    }
    currentSignature = matched.specimenSignature || fetchedMemberSig || '';
  } else if (activeAccNo && !accountNumber) {
    currentHolder = 'Account Not Found';
    currentType = '';
    currentBalance = 0;
  }

  // Business Logic Variables
  const isMinorAccount = (currentType || '').toUpperCase().includes('LAMA') || 
                         (currentType || '').toUpperCase().includes('ARUNALU') || 
                         (currentType || '').toUpperCase().includes('RANTHILINA') || 
                         (currentType || '').toUpperCase().includes('KEKULU') || 
                         (currentType || '').toUpperCase().includes('CHILD');
                         
  const MINIMUM_BALANCE = 500;
  const availableBalance = currentBalance - MINIMUM_BALANCE;
  
  // Validation Flags
  const isInvalidAccount = !accountNumber && currentHolder === 'Account Not Found';
  const isAccountSelected = !!accountNumber || (!!internalAccNo && currentHolder !== 'Account Not Found' && currentHolder !== 'N/A');
  const isInsufficientBalance = !isInvalidAccount && action === 'WITHDRAW' && typeof amount === 'number' && amount > availableBalance;
  const needsManagerOverride = action === 'WITHDRAW' && isMinorAccount;

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount && action !== 'CLOSE_FD') return;
    if (isInsufficientBalance || isInvalidAccount) return;
    
    setLoading(true);
    setError('');
    
    try {
      let result;
      if (action === 'DEPOSIT') {
        result = await AccountService.deposit({ accountNumber: internalAccNo, amount: Number(amount), reference });
      } else if (action === 'WITHDRAW') {
        result = await AccountService.withdraw({ 
          accountNumber: internalAccNo, 
          amount: Number(amount),
          reference,
          requestApproval: needsManagerOverride
        });
        
        if (result.message === 'APPROVAL_REQUESTED') {
          setReceiptData({
            transactionId: `REQ-${result.approvalId.substring(0, 8)}`,
            date: new Date().toLocaleString(),
            accountNumber: internalAccNo,
            accountHolder: currentHolder,
            amount: amount,
            type: 'PENDING_APPROVAL',
            balanceAfter: currentBalance // Unchanged until approved
          });
          setIsSuccess(true);
          onSuccess();
          setLoading(false);
          return;
        }
      } else if (action === 'PAY_INSTALLMENT') {
        result = await AccountService.deposit({ accountNumber: internalAccNo, amount: Number(amount), reference });
      } else if (action === 'CLOSE_FD') {
        result = await AccountService.releaseFixedDeposit(internalAccId);
        setReceiptData({
          transactionId: `TXN${Math.floor(Math.random() * 1000000)}`,
          date: new Date().toLocaleString(),
          accountNumber: internalAccNo,
          accountHolder: currentHolder,
          amount: result.netAmountCredited,
          type: action,
          deductedInterest: result.deductedInterest,
          balanceAfter: 0
        });
        setIsSuccess(true);
        onSuccess();
        setLoading(false);
        return;
      }
      
      // Store mock receipt data for demonstration
      setReceiptData({
        transactionId: `TXN${Math.floor(Math.random() * 1000000)}`,
        date: new Date().toLocaleString(),
        accountNumber: internalAccNo,
        accountHolder: currentHolder,
        amount: amount,
        type: action,
        balanceAfter: action === 'DEPOSIT' ? currentBalance + Number(amount) : currentBalance - Number(amount)
      });
      
      setIsSuccess(true);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data || `Failed to process ${action.toLowerCase()}. Invalid Manager Credentials or Server Error.`);
    } finally {
      setLoading(false);
    }
  };

  const getActionDetails = () => {
    switch (action) {
      case 'DEPOSIT':
        return {
          title: 'Deposit Cash',
          icon: <ArrowDownLeft size={20} className="text-emerald-500" />,
          color: 'emerald',
          submitText: 'Process Deposit'
        };
      case 'WITHDRAW':
        return {
          title: 'Withdraw Cash',
          icon: <ArrowUpRight size={20} className="text-red-500" />,
          color: 'red',
          submitText: 'Process Withdrawal'
        };
      case 'CLOSE_FD':
        return {
          title: 'Close Fixed Deposit',
          icon: <Lock size={20} className="text-slate-500" />,
          color: 'slate',
          submitText: 'Release Funds'
        };
      case 'PAY_INSTALLMENT':
        return {
          title: 'Pay Loan Installment',
          icon: <FileText size={20} className="text-indigo-500" />,
          color: 'indigo',
          submitText: 'Process Repayment'
        };
      default:
        return {
          title: 'Transaction',
          icon: null,
          color: 'blue',
          submitText: 'Submit'
        };
    }
  };

  const details = getActionDetails();

  // If transaction is successful, show the Receipt Screen
  if (isSuccess && receiptData) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center animate-in zoom-in-95">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">{receiptData.type === 'PENDING_APPROVAL' ? 'Approval Requested' : 'Transaction Successful'}</h2>
          <p className="text-slate-500 font-medium mb-8">
            {receiptData.type === 'PENDING_APPROVAL' 
              ? `Request sent to Branch Manager to withdraw Rs. ${Number(receiptData.amount).toLocaleString()} from the account.` 
              : receiptData.type === 'CLOSE_FD'
              ? `FD closed. Rs. ${Number(receiptData.amount).toLocaleString()} credited to savings account.`
              : `Rs. ${Number(receiptData.amount).toLocaleString()} has been ${action === 'DEPOSIT' ? 'deposited to' : 'withdrawn from'} the account.`}
          </p>
          
          <div className="bg-slate-50 rounded-xl p-4 text-left mb-6 border border-slate-100 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-500">{receiptData.type === 'PENDING_APPROVAL' ? 'Request ID:' : 'Txn ID:'}</span> <span className="font-mono font-bold text-slate-700">{receiptData.transactionId}</span></div>
            {receiptData.type === 'CLOSE_FD' ? (
              <>
                <div className="flex justify-between text-sm"><span className="text-slate-500">Credited Amount:</span> <span className="font-bold text-slate-800">Rs. {receiptData.amount.toLocaleString()}</span></div>
                {receiptData.deductedInterest > 0 && (
                  <div className="flex justify-between text-sm"><span className="text-red-500">Deducted Interest:</span> <span className="font-bold text-red-600">Rs. {receiptData.deductedInterest.toLocaleString()}</span></div>
                )}
              </>
            ) : (
              <div className="flex justify-between text-sm"><span className="text-slate-500">{receiptData.type === 'PENDING_APPROVAL' ? 'Current Balance:' : 'New Balance:'}</span> <span className="font-bold text-slate-800">Rs. {receiptData.balanceAfter.toLocaleString()}</span></div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">
              Close
            </button>
            <button onClick={() => window.print()} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2">
              <Printer size={18} /> Print Receipt
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
      <div className={`bg-white rounded-2xl w-full ${action === 'WITHDRAW' && !isMinorAccount ? 'max-w-4xl' : 'max-w-md'} shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col md:flex-row overflow-hidden my-8`}>
        
        {/* Left Side: Form */}
        <div className="flex-1 flex flex-col">
          <div className={`px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-${details.color}-50/50`}>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              {details.icon}
              {details.title}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white transition-colors">
              <X size={18} />
            </button>
          </div>
          
          <div className="p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-start gap-2">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" /> 
                <span>{error}</span>
              </div>
            )}
            
            <form onSubmit={handleTransaction} className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="w-full">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">ගිණුම් අංකය (Account No)</span>
                    {accountNumber ? (
                      <p className="text-lg font-bold text-slate-800 font-mono">{accountNumber}</p>
                    ) : (
                      <div className="relative">
                        <input 
                          type="text"
                          autoFocus
                          value={internalAccNo}
                          onChange={e => setInternalAccNo(e.target.value)}
                          placeholder="Enter exact Account No..."
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-lg font-bold font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-wider"
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-right whitespace-nowrap ml-4 mt-6">
                    {currentType && <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded uppercase">{currentType}</span>}
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-200/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">ගිණුම් හිමියා (Account Holder)</span>
                    <p className={`text-sm font-bold ${currentHolder === 'Account Not Found' ? 'text-red-500' : 'text-slate-800'}`}>{currentHolder}</p>
                  </div>
                  
                  {isAccountSelected && (
                    <div className={`border-2 px-5 py-3 rounded-xl shadow-sm text-right ${action === 'WITHDRAW' ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200'}`}>
                      <span className={`text-xs font-black uppercase tracking-wider block mb-1 ${action === 'WITHDRAW' ? 'text-blue-600' : 'text-emerald-600'}`}>
                        ලබාගත හැකි ශේෂය (Available)
                      </span>
                      <div className={`text-3xl font-black tracking-tight font-mono ${action === 'WITHDRAW' ? 'text-blue-700' : 'text-emerald-700'}`}>
                        <span className="text-xl mr-1">Rs.</span>
                        {availableBalance.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Warning for Minor Accounts on Withdrawals */}
              {isAccountSelected ? (
                <>
                  {needsManagerOverride && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex gap-3 items-start">
                      <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                      <div className="w-full">
                        <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wide">⚠️ ළමා ගිණුම්වලින් මුදල් ගැනීම (Manager Approval Required)</h4>
                        <p className="text-xs text-amber-700 mt-1 font-medium mb-3">
                          ළමා ගිණුමකින් මුදල් ආපසු ගැනීම සඳහා ශාඛා කළමනාකරුගේ අනුමැතිය අවශ්‍ය වේ. අනුමැතිය සඳහා ඉල්ලීමක් යැවීමට පහත බොත්තම භාවිතා කරන්න.
                        </p>
                      </div>
                    </div>
                  )}

                  {action === 'CLOSE_FD' && (
                    <div className="p-4 bg-red-50 rounded-xl border border-red-200 mb-6 flex gap-3 text-red-800 text-sm">
                      <AlertTriangle size={24} className="shrink-0 text-red-500" />
                      <div>
                        <p className="font-bold mb-1">කරුණාකර මෙය අවධානයෙන් කියවන්න!</p>
                        <p>මෙම ස්ථාවර තැන්පතුව කල් පිරෙන්නට පෙර අවලංගු කරන්නේ නම්, මාසිකව දැනටමත් ගිණුමට බැර කර ඇති පොලී මුදල මුල් මුදලින් හර කර ඉතිරිය ගිණුමට බැර කරනු ඇත. ඔබ මෙය ස්ථිර කරන්නේද?</p>
                      </div>
                    </div>
                  )}

                  {action !== 'CLOSE_FD' && (
                    <div className="space-y-4">
                      {/* Amount Field */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">මුදල (Amount Rs.)</label>
                        </div>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Rs.</span>
                          <input 
                            type="number" 
                            min="1"
                            required
                            autoFocus={!!accountNumber}
                            value={amount} 
                            onChange={e => setAmount(e.target.value ? Number(e.target.value) : '')}
                            placeholder="0.00"
                            className={`w-full border ${isInsufficientBalance ? 'border-red-400 ring-2 ring-red-100 bg-red-50 text-red-700' : 'border-slate-200'} rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-${details.color}-500 font-bold text-xl text-slate-800`}
                          />
                        </div>
                        {isInsufficientBalance && (
                          <p className="text-xs text-red-600 font-bold mt-2 flex items-center gap-1">
                            <AlertTriangle size={14} /> ලබාගත හැකි උපරිම ශේෂය ඉක්මවා ඇත. (රු. 500ක අවම ශේෂයක් තබා ගත යුතුය)
                          </p>
                        )}
                      </div>

                      {/* Reference Field */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">ලදුපත් අංකය (Reference / Slip No)</label>
                        <input 
                          type="text"
                          value={reference} 
                          onChange={e => setReference(e.target.value)}
                          placeholder={action === 'DEPOSIT' ? "තැන්පතු ලදුපත් අංකය" : "ආපසු ගැනීමේ ලදුපත් අංකය"}
                          className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-slate-700"
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center bg-slate-50 border border-slate-100 rounded-xl border-dashed">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                    <Search size={20} className="text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-600 font-bold mb-1">Enter Account Number</p>
                  <p className="text-xs text-slate-400 max-w-[250px] mx-auto">Please enter a valid, existing account number above to continue with the transaction.</p>
                </div>
              )}

              <div className="pt-4 flex gap-3 border-t border-slate-100 mt-6">
                <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-4 py-3.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading || isInsufficientBalance || isInvalidAccount || !isAccountSelected || (action !== 'CLOSE_FD' && !amount)} 
                  className={`flex-1 px-4 py-3.5 text-white rounded-xl font-bold shadow-sm transition-all flex justify-center items-center gap-2 ${
                    isInsufficientBalance || isInvalidAccount || !isAccountSelected || (action !== 'CLOSE_FD' && !amount) ? 'bg-slate-300 cursor-not-allowed' :
                    needsManagerOverride ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20' :
                    details.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' :
                    details.color === 'red' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' :
                    details.color === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' :
                    'bg-slate-800 hover:bg-slate-900 shadow-slate-800/20'
                  }`}
                >
                  {loading ? <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-5 h-5"></span> : (needsManagerOverride ? 'Request Manager Approval' : details.submitText)}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Specimen Signature (Only for Withdrawals of Non-Minor Accounts) */}
        {action === 'WITHDRAW' && !isMinorAccount && (
          <div className="w-full md:w-2/5 bg-slate-50 border-l border-slate-200 p-6 flex flex-col justify-center">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Fingerprint size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">නිදර්ශක අත්සන <br/><span className="text-[10px] text-slate-500">(Specimen Signature)</span></h4>
              <p className="text-xs text-slate-500 mt-1">මුදල් ලබා දීමට පෙර අත්සන තහවුරු කරන්න.</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative h-48 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #cbd5e1 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
              {!isAccountSelected ? (
                <div className="text-center z-10 opacity-50">
                  <Lock size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-400">පළමුව ගිණුම තෝරන්න</p>
                </div>
              ) : currentSignature ? (
                <img 
                  src={currentSignature} 
                  alt="Customer Signature" 
                  className="max-h-40 max-w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML += '<p class="text-sm font-bold text-red-400 z-10">Invalid Signature Format</p>';
                  }}
                />
              ) : (
                <div className="text-center z-10 opacity-60">
                  <Fingerprint size={32} className="mx-auto text-slate-400 mb-2" />
                  <p className="text-xs font-bold text-slate-500">අත්සනක් ඇතුළත් කර නැත</p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
