import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, ArrowDownLeft, ArrowUpRight, Lock, FileText, CheckCircle, Printer, Fingerprint, KeyRound, Search } from 'lucide-react';
import * as AccountService from '../services/account.service';
import { useLanguage } from '../context/LanguageContext';

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
  isMatured?: boolean;
  linkedSavingsAccount?: string;
  memberId?: string;
  penaltyAmount?: number;
  principalAmount?: number;
}

export default function TransactionModal({ accountId, accountNumber, accountType, balance = 0, accountHolder = 'N/A', action, onClose, onSuccess, allAccounts = [], members = [], isMatured = false, linkedSavingsAccount, memberId, penaltyAmount, principalAmount }: Props) {
  const { t, language } = useLanguage();
  const [showConfirm, setShowConfirm] = useState(false);
  if ((window as any).__isAdminView) return <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center"><h3 className="text-xl font-bold text-red-600 mb-2">Access Denied</h3><p className="text-slate-600 mb-6">System Administrators are in Read-Only mode and cannot perform transactions or open accounts.</p><button onClick={typeof onClose !== 'undefined' ? onClose : () => {}} className="bg-slate-800 text-white px-6 py-2 rounded-xl font-semibold hover:bg-slate-700">Close</button></div></div>;
  const [internalAccNo, setInternalAccNo] = useState(accountNumber || '');
  const [internalAccId, setInternalAccId] = useState(accountId || '');
  const [amount, setAmount] = useState<number | ''>('');
  const [reference, setReference] = useState('');
  const [selectedTargetAccount, setSelectedTargetAccount] = useState('');
  
  const currentAccountInfo = allAccounts?.find(a => a.accountNumber === (internalAccNo || accountNumber));
  const activeMemberId = memberId || currentAccountInfo?.memberId;
  const memberSavingsAccounts = allAccounts?.filter(a => 
    a.memberId === activeMemberId && 
    a.accountType !== 'FIXED_DEPOSIT' && 
    a.status !== 'CLOSED'
  ) || [];

  // Initialize selectedTargetAccount if there's exactly one savings account available and it's not linked
  useEffect(() => {
    if (action === 'CLOSE_FD' && (!linkedSavingsAccount || linkedSavingsAccount === 'Not Linked') && memberSavingsAccounts.length === 1 && !selectedTargetAccount) {
      setSelectedTargetAccount(memberSavingsAccounts[0].accountNumber);
    }
  }, [action, linkedSavingsAccount, memberSavingsAccounts, selectedTargetAccount]);

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
             if (language === 'si' && member.fullNameSinhala) {
               setFetchedMemberName(member.fullNameSinhala);
             } else {
               setFetchedMemberName(member.fullName || member.fullNameSinhala || 'N/A');
             }
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
  }, [matched?.memberId, language]);

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
                         
  const isFdAccount = (currentType || '').toUpperCase().includes('FIXED') || (currentType || '').toUpperCase().includes('FD');
  const MINIMUM_BALANCE = isFdAccount ? 0 : 500;
  const availableBalance = currentBalance - MINIMUM_BALANCE;
  
  // Validation Flags
  const isInvalidAccount = !accountNumber && currentHolder === 'Account Not Found';
  const isAccountSelected = !!accountNumber || (!!internalAccNo && currentHolder !== 'Account Not Found' && currentHolder !== 'N/A');
  const isInsufficientBalance = !isInvalidAccount && action === 'WITHDRAW' && typeof amount === 'number' && amount > availableBalance;
  const needsManagerOverride = action === 'WITHDRAW' && isMinorAccount;

  const handleTransaction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!amount && action !== 'CLOSE_FD') return;
    if (action === 'CLOSE_FD' && (!linkedSavingsAccount || linkedSavingsAccount === 'Not Linked') && !selectedTargetAccount) {
      setError('Please select a target savings account to transfer the funds.');
      return;
    }
    if (isInsufficientBalance || isInvalidAccount) return;

    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      let result;
      if (action === 'DEPOSIT') {
        result = await AccountService.deposit({ accountNumber: internalAccNo, amount: Number(amount), reference } as any);
      } else if (action === 'WITHDRAW') {
        result = await AccountService.withdraw({ 
          accountNumber: internalAccNo, 
          amount: Number(amount),
          reference,
          requestApproval: needsManagerOverride
        } as any);
        
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
        result = await AccountService.deposit({ accountNumber: internalAccNo, amount: Number(amount), reference } as any);
      } else if (action === 'CLOSE_FD') {
        let targetId = '';
        if ((!linkedSavingsAccount || linkedSavingsAccount === 'Not Linked') && selectedTargetAccount) {
            const targetAcc = allAccounts.find(a => a.accountNumber === selectedTargetAccount);
            if (targetAcc) targetId = targetAcc.accountId;
        }
        result = await AccountService.releaseFixedDeposit(internalAccId, targetId);
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
      const errMsg = err.response?.data
        ? (typeof err.response.data === 'object'
            ? (err.response.data.message || err.response.data.error || JSON.stringify(err.response.data))
            : err.response.data)
        : `Failed to process ${action.toLowerCase()}. Invalid Manager Credentials or Server Error.`;
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const getActionDetails = () => {
  const { t } = useLanguage();
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
    const successMsg = language === 'si' 
      ? (receiptData.type === 'PENDING_APPROVAL' 
        ? `රු. ${Number(receiptData.amount).toLocaleString()} ක් ලබා ගැනීමට කළමනාකරු වෙත අනුමැතිය ඉල්ලා යවන ලදී.` 
        : receiptData.type === 'CLOSE_FD'
        ? `ස්ථාවර තැන්පතුව සාර්ථකව වසා දමන ලදී. රු. ${Number(receiptData.amount).toLocaleString()} ක් ඉතුරුම් ගිණුමට බැර කරන ලදී.`
        : `රු. ${Number(receiptData.amount).toLocaleString()} ක් සාර්ථකව ගිණුමට ${action === 'DEPOSIT' ? 'තැන්පත් කරන ලදී' : 'ලබා ගන්නා ලදී'}.`)
      : (receiptData.type === 'PENDING_APPROVAL' 
        ? `Request sent to Branch Manager to withdraw Rs. ${Number(receiptData.amount).toLocaleString()} from the account.` 
        : receiptData.type === 'CLOSE_FD'
        ? `FD closed. Rs. ${Number(receiptData.amount).toLocaleString()} credited to savings account.`
        : `Rs. ${Number(receiptData.amount).toLocaleString()} has been ${action === 'DEPOSIT' ? 'deposited to' : 'withdrawn from'} the account.`);

    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center animate-in zoom-in-95">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">{receiptData.type === 'PENDING_APPROVAL' ? t('Approval Requested') : t('Transaction Successful')}</h2>
          <p className="text-slate-500 font-medium mb-8">
            {successMsg}
          </p>
          
          <div className="bg-slate-50 rounded-xl p-4 text-left mb-6 border border-slate-100 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-slate-500">{receiptData.type === 'PENDING_APPROVAL' ? t('Request ID:') : t('Txn ID:')}</span> <span className="font-mono font-bold text-slate-700">{receiptData.transactionId}</span></div>
            {receiptData.type === 'CLOSE_FD' ? (
              <>
                <div className="flex justify-between text-sm"><span className="text-slate-500">{t('Credited Amount:')}</span> <span className="font-bold text-slate-800">Rs. {receiptData.amount.toLocaleString()}</span></div>
                {receiptData.deductedInterest > 0 && (
                  <div className="flex justify-between text-sm"><span className="text-red-500">{t('Deducted Interest:')}</span> <span className="font-bold text-red-600">Rs. {receiptData.deductedInterest.toLocaleString()}</span></div>
                )}
              </>
            ) : (
              <div className="flex justify-between text-sm"><span className="text-slate-500">{receiptData.type === 'PENDING_APPROVAL' ? t('Current Balance:') : t('New Balance:')}</span> <span className="font-bold text-slate-800">Rs. {receiptData.balanceAfter.toLocaleString()}</span></div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors">
              {t('Close')}
            </button>
            <button onClick={() => window.print()} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2">
              <Printer size={18} /> {t('Print Receipt')}
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
            
            {showConfirm ? (
              <div className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800 animate-in fade-in duration-200">
                  <AlertTriangle className="shrink-0 mt-1" size={20} />
                  <div>
                    <h4 className="font-bold text-sm">{language === 'si' ? 'ගනුදෙනුව තහවුරු කරන්න' : 'Confirm Transaction'}</h4>
                    <p className="text-xs text-amber-700 mt-1">
                      {language === 'si' 
                        ? 'කරුණාකර පහත විස්තර නිවැරදිදැයි පරීක්‍ෂා කර තහවුරු කරන්න. මෙම ගනුදෙනුව ආපසු හැරවිය නොහැක.' 
                        : 'Please verify the details below. Once processed, this transaction cannot be reversed.'}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4 shadow-inner">
                  <div className="flex justify-between border-b border-slate-200 pb-2.5">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('Type')}</span>
                    <span className="font-extrabold text-slate-800 text-sm">
                      {action === 'DEPOSIT' ? (language === 'si' ? 'මුදල් තැන්පතුව (DEPOSIT)' : 'DEPOSIT') : action === 'WITHDRAW' ? (language === 'si' ? 'මුදල් ලබාගැනීම (WITHDRAWAL)' : 'WITHDRAWAL') : action === 'PAY_INSTALLMENT' ? (language === 'si' ? 'ණය වාරික ගෙවීම' : 'PAY INSTALLMENT') : 'FD closure'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2.5">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                      {action === 'CLOSE_FD' ? t('Fixed Deposit Account No') : t('Account No')}
                    </span>
                    <span className="font-mono font-bold text-slate-800 text-base">{internalAccNo || accountNumber}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-2.5">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('Account Owner')}</span>
                    <span className="font-bold text-slate-800">{currentHolder}</span>
                  </div>
                  {action !== 'CLOSE_FD' && (
                    <div className="flex justify-between border-b border-slate-200 pb-2.5">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t('Amount')}</span>
                      <span className="font-black text-emerald-600 text-lg">Rs. {Number(amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    </div>
                  )}
                  {reference && (
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{language === 'si' ? 'ලදුපත් අංකය' : 'Reference No'}</span>
                      <span className="font-mono font-bold text-slate-700">{reference}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowConfirm(false)} 
                    disabled={loading}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl transition-all"
                  >
                    {language === 'si' ? 'නැත, සංස්කරණය කරන්න' : 'No, Edit'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleTransaction()} 
                    disabled={loading}
                    className={`flex-1 py-3.5 text-white rounded-xl font-bold shadow-sm transition-all flex justify-center items-center gap-2 ${
                      details.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' :
                      details.color === 'red' ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-800'
                    }`}
                  >
                    {loading ? (
                      <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-5 h-5"></span>
                    ) : (
                      t(`ඔව්, තහවුරු කරන්න`)
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTransaction} className="space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <div className="w-full">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      {action === 'CLOSE_FD' ? t('Fixed Deposit Account No') : (language === 'si' ? 'ගිණුම් අංකය (Account No)' : language === 'ta' ? 'கணக்கு எண் (Account No)' : 'Account No')}
                    </span>
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
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">{t(`ගිණුම් හිමියා (Account Holder)`)}</span>
                    <p className={`text-sm font-bold ${currentHolder === 'Account Not Found' ? 'text-red-500' : 'text-slate-800'}`}>{currentHolder}</p>
                  </div>
                  
                  {isAccountSelected && (
                    <div className={`border-2 px-5 py-3 rounded-xl shadow-sm text-right ${action === 'WITHDRAW' ? 'bg-blue-50 border-blue-200' : 'bg-emerald-50 border-emerald-200'}`}>
                      <span className={`text-xs font-black uppercase tracking-wider block mb-1 ${action === 'WITHDRAW' ? 'text-blue-600' : 'text-emerald-600'}`}>
                        {t(`ලබාගත හැකි ශේෂය (Available)`)}</span>
                      <div className={`text-3xl font-black tracking-tight font-mono ${action === 'WITHDRAW' ? 'text-blue-700' : 'text-emerald-700'}`}>
                        <span className="text-xl mr-1">Rs.</span>
                        {availableBalance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
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
                        <h4 className="text-sm font-bold text-amber-800 uppercase tracking-wide">{t(`⚠️ ළමා ගිණුම්වලින් මුදල් ගැනීම (Manager Approval Required)`)}</h4>
                        <p className="text-xs text-amber-700 mt-1 font-medium mb-3">
                          {t(`ළමා ගිණුමකින් මුදල් ආපසු ගැනීම සඳහා ශාඛා කළමනාකරුගේ අනුමැතිය අවශ්‍ය වේ. අනුමැතිය සඳහා ඉල්ලීමක් යැවීමට පහත බොත්තම භාවිතා කරන්න.`)}</p>
                      </div>
                    </div>
                  )}

                  {action === 'CLOSE_FD' && !isMatured && (
                    <div className="p-4 bg-red-50 rounded-xl border border-red-200 mb-6 flex gap-3 text-red-800 text-sm">
                      <AlertTriangle size={24} className="shrink-0 text-red-500" />
                      <div className="w-full">
                        <p className="font-bold mb-2">{t(`කරුණාකර මෙය අවධානයෙන් කියවන්න!`)}</p>
                        <p className="mb-3">{t(`මෙම ස්ථාවර තැන්පතුව කල් පිරෙන්නට පෙර අවලංගු කරන්නේ නම්, මාසිකව දැනටමත් ගිණුමට බැර කර ඇති පොලී මුදල මුල් මුදලින් හර කර ඉතිරිය ගිණුමට බැර කරනු ඇත. ඔබ මෙය ස්ථිර කරන්නේද?`)}</p>
                        
                        {principalAmount !== undefined && penaltyAmount !== undefined && (
                          <div className="bg-white rounded-lg p-3 border border-red-100 font-mono text-xs shadow-sm">
                            <div className="flex justify-between mb-1">
                              <span>{t(`මූලික තැන්පතුව (Principal):`)}</span>
                              <span>Rs. {principalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                            </div>
                            <div className="flex justify-between mb-1 text-red-600 font-bold">
                              <span>{t(`අඩු කරන පොළිය (Penalty):`)}</span>
                              <span>- Rs. {penaltyAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                            </div>
                            <div className="flex justify-between pt-2 mt-2 border-t border-red-100 font-bold text-sm text-slate-800">
                              <span>{t(`ගෙවන මුදල (Final Payout):`)}</span>
                              <span>Rs. {balance.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {action === 'CLOSE_FD' && isMatured && (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 mb-6 flex gap-3 text-blue-800 text-sm">
                      <CheckCircle size={24} className="shrink-0 text-blue-500" />
                      <div>
                        <p className="font-bold mb-1">{t(`ගිණුම කල්පිරී ඇත`)}</p>
                        <p>{t(`මෙම ස්ථාවර තැන්පතුව සම්පූර්ණයෙන්ම කල්පිරී ඇති බැවින්, සම්පූර්ණ මුදල සම්බන්ධිත ඉතුරුම් ගිණුමට බැර කරනු ඇත.`)}</p>
                      </div>
                    </div>
                  )}

                  {action === 'CLOSE_FD' && (
                    <div className="p-5 bg-gradient-to-r from-slate-50 to-indigo-50/30 rounded-xl border border-slate-200 mb-6 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-blue-400/5 translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite]"></div>
                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">From FD Account</span>
                          <span className="font-mono font-bold text-slate-800">{internalAccNo || accountNumber}</span>
                        </div>
                        
                        {/* Money Transfer Animation */}
                        <div className="flex flex-col items-center justify-center px-4">
                          <div className="relative w-16 h-8 flex items-center justify-center">
                            <div className="absolute w-full h-[2px] bg-slate-200 rounded-full"></div>
                            <div className="absolute left-0 w-4 h-4 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                            <div className="absolute left-0 w-3 h-3 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-[slideRight_1.5s_ease-in-out_infinite]"></div>
                            <ArrowUpRight size={16} className="text-emerald-600 absolute -top-4 animate-bounce" />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 mt-2 uppercase tracking-widest">Transferring</span>
                        </div>
                        
                        <div className="flex flex-col text-right w-48">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">To Savings Account</span>
                          {(!linkedSavingsAccount || linkedSavingsAccount === 'Not Linked') ? (
                            <select
                              value={selectedTargetAccount}
                              onChange={(e) => setSelectedTargetAccount(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-md px-2 py-1.5 text-sm font-bold font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">-- Select Account --</option>
                              {memberSavingsAccounts.map(acc => (
                                <option key={acc.accountNumber} value={acc.accountNumber}>
                                  {acc.accountNumber} ({acc.accountType.replace('SAVINGS_', '')})
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="font-mono font-bold text-indigo-700 text-lg">
                              {linkedSavingsAccount}
                            </span>
                          )}
                        </div>
                      </div>
                      {(!linkedSavingsAccount || linkedSavingsAccount === 'Not Linked') && memberSavingsAccounts.length === 0 && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-lg flex gap-2 items-center">
                          <AlertTriangle size={16} /> 
                          {t(`මෙම සාමාජිකයාට සක්‍රීය ඉතුරුම් ගිණුමක් නොමැත. මුදල් ලබා ගැනීමට පෙර ඉතුරුම් ගිණුමක් ආරම්භ කරන්න.`)}</div>
                      )}
                      <style>{`
                        @keyframes slideRight {
                          0% { transform: translateX(0); opacity: 0; }
                          20% { opacity: 1; }
                          80% { opacity: 1; }
                          100% { transform: translateX(48px); opacity: 0; }
                        }
                        @keyframes shimmer {
                          100% { transform: translateX(100%); }
                        }
                      `}</style>
                    </div>
                  )}

                  {action !== 'CLOSE_FD' && (
                    <div className="space-y-4">
                      {/* Amount Field */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">{t(`මුදල (Amount Rs.)`)}</label>
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
                            <AlertTriangle size={14} /> {t(`ලබාගත හැකි උපරිම ශේෂය ඉක්මවා ඇත. (රු. 500ක අවම ශේෂයක් තබා ගත යුතුය)`)}</p>
                        )}
                      </div>

                      {/* Reference Field */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t(`ලදුපත් අංකය (Reference / Slip No)`)}</label>
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
            )}
          </div>
        </div>

        {/* Right Side: Specimen Signature (Only for Withdrawals of Non-Minor Accounts) */}
        {action === 'WITHDRAW' && !isMinorAccount && (
          <div className="w-full md:w-2/5 bg-slate-50 border-l border-slate-200 p-6 flex flex-col justify-center">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Fingerprint size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest">{t(`නිදර්ශක අත්සන`)}<br/><span className="text-[10px] text-slate-500">(Specimen Signature)</span></h4>
              <p className="text-xs text-slate-500 mt-1">{t(`මුදල් ලබා දීමට පෙර අත්සන තහවුරු කරන්න.`)}</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative h-48 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #cbd5e1 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
              {!isAccountSelected ? (
                <div className="text-center z-10 opacity-50">
                  <Lock size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-400">{t(`පළමුව ගිණුම තෝරන්න`)}</p>
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
                  <p className="text-xs font-bold text-slate-500">{t(`අත්සනක් ඇතුළත් කර නැත`)}</p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
