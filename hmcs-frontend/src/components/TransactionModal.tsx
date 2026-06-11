import React, { useState } from 'react';
import { X, AlertTriangle, ArrowDownLeft, ArrowUpRight, Lock, FileText } from 'lucide-react';
import * as AccountService from '../services/account.service';

export type TransactionAction = 'DEPOSIT' | 'WITHDRAW' | 'CLOSE_FD' | 'PAY_INSTALLMENT';

interface Props {
  accountNumber: string;
  accountType: string;
  action: TransactionAction;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TransactionModal({ accountNumber, accountType, action, onClose, onSuccess }: Props) {
  const [internalAccNo, setInternalAccNo] = useState(accountNumber || '');
  const [amount, setAmount] = useState<number | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount && action !== 'CLOSE_FD') return;
    
    setLoading(true);
    setError('');
    
    try {
      if (action === 'DEPOSIT' || action === 'PAY_INSTALLMENT') {
        await AccountService.deposit({ accountNumber: internalAccNo, amount: Number(amount) });
      } else if (action === 'WITHDRAW') {
        await AccountService.withdraw({ accountNumber: internalAccNo, amount: Number(amount) });
      } else if (action === 'CLOSE_FD') {
        // Mock FD Closure for now since endpoint doesn't exist
        await new Promise(r => setTimeout(r, 1000));
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data || `Failed to process ${action.toLowerCase()}.`);
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

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className={`px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-${details.color}-50/50 rounded-t-2xl`}>
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
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Number</span>
                {accountType && <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded uppercase">{accountType}</span>}
              </div>
              {accountNumber ? (
                <p className="text-lg font-bold text-slate-800 font-mono">{accountNumber}</p>
              ) : (
                <input 
                  type="text" 
                  required
                  autoFocus
                  value={internalAccNo} 
                  onChange={e => setInternalAccNo(e.target.value)}
                  placeholder="e.g. 89905789"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold font-mono text-slate-800"
                />
              )}
            </div>

            {action !== 'CLOSE_FD' && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Amount (Rs.)</label>
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
                    className={`w-full border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-${details.color}-500 font-bold text-xl text-slate-800`}
                  />
                </div>
              </div>
            )}

            {action === 'CLOSE_FD' && (
              <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                <p className="text-sm font-medium text-orange-800 text-center">
                  Are you sure you want to close this Fixed Deposit? The maturity amount will be transferred to the linked savings account.
                </p>
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button type="button" onClick={onClose} disabled={loading} className="flex-1 px-4 py-3.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors">
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading} 
                className={`flex-1 px-4 py-3.5 text-white rounded-xl font-bold shadow-sm transition-all flex justify-center items-center gap-2 ${
                  details.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' :
                  details.color === 'red' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' :
                  details.color === 'indigo' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' :
                  'bg-slate-800 hover:bg-slate-900 shadow-slate-800/20'
                }`}
              >
                {loading ? <span className="animate-spin border-2 border-white/20 border-t-white rounded-full w-5 h-5"></span> : details.submitText}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
