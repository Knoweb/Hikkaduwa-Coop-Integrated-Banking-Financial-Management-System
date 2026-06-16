import React, { useState } from 'react';
import { X, Search, ArrowDownLeft, ArrowUpRight, Lock, FileText } from 'lucide-react';
import type { AccountData, MemberData } from '../services/account.service';
import TransactionModal, { type TransactionAction } from './TransactionModal';

interface Props {
  account: AccountData;
  members: MemberData[];
  onClose: () => void;
}

export default function ViewAccountModal({ account, members, onClose }: Props) {
  const [txAction, setTxAction] = useState<TransactionAction | null>(null);

  const getMemberDetails = (memberId?: string) => {
    if (!memberId) return null;
    return members.find(m => m.memberId === memberId) || null;
  };

  const primaryMember = getMemberDetails(account.memberId);
  const member2 = getMemberDetails(account.memberId2);
  const member3 = getMemberDetails(account.memberId3);

  // Helper to display member card
  const renderApplicantCard = (title: string, member: MemberData | null, num: number) => {
    if (!member) return null;
    const fullName = member.fullNameSinhala || member.fullName || '';
    const nic = member.nic || member.birthCertificateNumber || '';
    
    let age = '';
    if (member.dateOfBirth) {
      const dob = new Date(member.dateOfBirth);
      const today = new Date();
      let a = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        a--;
      }
      age = a.toString();
    }

    return (
      <div className="border border-gray-200 p-4 rounded-xl space-y-4 bg-gray-50/50 relative">
        <div className="absolute -top-3 left-4 bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm border border-blue-200">
          {title}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">සම්පූර්ණ නම (Full Name)</label>
            <input type="text" value={fullName} disabled className="w-full border border-gray-200 rounded-lg p-2 bg-gray-100 text-sm font-medium text-gray-700 cursor-not-allowed" />
          </div>
          <div className="row-span-2">
            <label className="block text-xs font-medium text-gray-500 mb-1">ලිපිනය (Address)</label>
            <textarea value={member.address} disabled rows={4} className="w-full border border-gray-200 rounded-lg p-2 bg-gray-100 text-sm font-medium text-gray-700 cursor-not-allowed resize-none"></textarea>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">ජා.හැ.අ (NIC) / උප්පැන්න අංකය</label>
            <input type="text" value={nic} disabled className="w-full border border-gray-200 rounded-lg p-2 bg-gray-100 text-sm font-medium text-gray-700 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">උපන් දිනය (Date of Birth)</label>
            <input type="text" value={member.dateOfBirth || ''} disabled className="w-full border border-gray-200 rounded-lg p-2 bg-gray-100 text-sm font-medium text-gray-700 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">වයස (Age)</label>
            <input type="text" value={age} disabled className="w-full border border-gray-200 rounded-lg p-2 bg-gray-100 text-sm font-medium text-gray-700 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">රක්ෂාව (Occupation)</label>
            <input type="text" value={(account as any)[`occupation${num}`] || 'සපයා නැත'} disabled className="w-full border border-gray-200 rounded-lg p-2 bg-gray-100 text-sm font-medium text-gray-700 cursor-not-allowed" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl relative shadow-2xl rounded-2xl bg-white flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#025a4e] rounded-t-2xl text-white">
          <h2 className="text-lg font-bold">ගිණුම් තොරතුරු (Account Details) - {account.accountNumber}</h2>
          
          <div className="flex items-center gap-4">
            {/* Action Buttons Removed */}
            
            <div className="h-6 w-px bg-white/20"></div>
            
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition"><X size={20} /></button>
          </div>
        </div>

        {txAction && (
          <TransactionModal 
            accountNumber={account.accountNumber}
            accountType={account.accountType}
            action={txAction}
            onClose={() => setTxAction(null)}
            onSuccess={() => {
              setTxAction(null);
              // Ideally trigger a refresh of the account data here if needed
            }}
          />
        )}

        {/* Form Details */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50">
          
          {/* ================= STEP 1: Institutional & Classification ================= */}
          <div className="space-y-6">
            <div className="bg-emerald-50/40 p-4 rounded-xl border border-emerald-100/70">
              <h4 className="text-xs font-bold text-[#025a4e] uppercase tracking-wider mb-3">ආයතනික පද්ධති දත්ත (Institutional Read-Only)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">ග්රාමීය බැංකු ශාඛාව</label>
                  <input type="text" value="හික්කඩුව ග්රාමීය බැංකුව" disabled className="w-full border border-emerald-200 rounded-lg p-2 bg-emerald-50 text-sm font-medium text-emerald-900 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">සමුපකාර සමිතිය</label>
                  <input type="text" value="සීමාසහිත හික්කඩුව විවිධ සේවා සමුපකාර සමිතිය" disabled className="w-full border border-emerald-200 rounded-lg p-2 bg-emerald-50 text-sm font-medium text-emerald-900 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">සාමාජිකත්වය</label>
                  <input type="text" value={primaryMember?.isMember ? 'සමාජික ගිණුමක්' : 'සමාජික නොවන ගිණුමක්'} disabled className="w-full border border-emerald-200 rounded-lg p-2 bg-emerald-50 text-sm font-medium text-emerald-900 cursor-not-allowed" />
                </div>
              </div>
            </div>

            <h3 className="text-base font-semibold text-gray-700 border-b pb-1.5">ගිණුම් වර්ගීකරණය</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ගිණුම් ස්වභාවය (Account Mode)</label>
                <input type="text" value={account.accountMode === 'joint' ? 'හවුල් ගිණුමක් (Joint)' : 'තනි ගිණුමක් (Single)'} disabled className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-100 text-sm font-medium text-gray-700 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ගිණුම් වර්ගය (Account Type)</label>
                <input type="text" value={account.accountType.toUpperCase()} disabled className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-100 text-sm font-medium text-gray-700 cursor-not-allowed uppercase" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ගිණුම් අංකය (Account Number)</label>
                <input type="text" value={account.accountNumber} disabled className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-100 text-sm font-bold text-gray-900 cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* ================= STEP 2: Applicants ================= */}
          <div className="space-y-6 pt-4">
            <h3 className="text-base font-semibold text-gray-700 border-b pb-1.5 flex justify-between items-end">
              <span>අයදුම්කරුගේ තොරතුරු (Applicant Details)</span>
              {account.accountMode === 'joint' && (
                <span className="text-xs font-normal text-gray-500">
                  මෙහෙයුම් ස්වභාවය: <strong className="text-gray-800">{account.modeOfOperation === 'self' ? 'තනිවම' : account.modeOfOperation === 'either' ? 'ඕනෑම අයෙකුට' : account.modeOfOperation === 'all' ? 'සියලුදෙනාම එකතුව' : account.modeOfOperation}</strong>
                </span>
              )}
            </h3>

            {renderApplicantCard("පළමුවන අයදුම්කරු (Primary)", primaryMember, 1)}
            
            {account.accountMode === 'joint' && (
              <>
                {renderApplicantCard("දෙවන අයදුම්කරු (Second Applicant)", member2, 2)}
                {renderApplicantCard("තෙවන අයදුම්කරු (Third Applicant)", member3, 3)}
              </>
            )}
          </div>

          {/* ================= STEP 3: Witness & Signature ================= */}
          <div className="space-y-6 pt-4">
            <h3 className="text-base font-semibold text-gray-700 border-b pb-1.5">සාක්ෂි සහ අත්සන් (Witness & Signatures)</h3>
            
            <div className="border border-gray-200 p-4 rounded-xl space-y-4 bg-gray-50">
              <h4 className="text-sm font-bold text-gray-700">සාක්ෂිකරුගේ තොරතුරු</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">සාක්ෂිකරුගේ නම</label>
                  <input type="text" value={account.witnessName || 'සපයා නැත'} disabled className="w-full border border-gray-200 rounded-lg p-2 bg-gray-100 text-sm font-medium text-gray-700 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">සාක්ෂිකරුගේ ලිපිනය</label>
                  <input type="text" value={account.witnessAddress || 'සපයා නැත'} disabled className="w-full border border-gray-200 rounded-lg p-2 bg-gray-100 text-sm font-medium text-gray-700 cursor-not-allowed" />
                </div>
              </div>
            </div>

            <div className="border border-gray-200 p-4 rounded-xl space-y-4 bg-gray-50">
              <h4 className="text-sm font-bold text-gray-700">අනුරූප අත්සන (Specimen Signature)</h4>
              {account.specimenSignature ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-2 bg-white inline-block max-w-[300px]">
                  <img src={account.specimenSignature} alt="Specimen Signature" className="max-h-32 object-contain" />
                </div>
              ) : (
                <div className="bg-gray-100 text-gray-400 p-6 rounded-lg text-center text-sm border border-gray-200">
                  අත්සනක් සපයා නොමැත (No Signature Provided)
                </div>
              )}
            </div>
          </div>

          {/* ================= STEP 4: Initial Deposit Info ================= */}
          <div className="space-y-6 pt-4">
            <h3 className="text-base font-semibold text-gray-700 border-b pb-1.5">මූලික තැන්පතුව (Initial Deposit)</h3>
            
            <div className="bg-[#025a4e]/5 border border-[#025a4e]/20 p-5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">මූලික තැන්පතු මුදල (Initial Deposit Amount)</p>
                <p className="text-2xl font-bold text-[#025a4e]">Rs. {(account.initialDeposit || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">ගිණුම විවෘත කළ දිනය</p>
                <p className="text-sm font-semibold text-gray-800">{account.openedDate?.split('T')[0] || 'N/A'}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Buttons */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold rounded-lg text-white bg-slate-800 hover:bg-slate-700 transition shadow-sm">
            වසන්න (Close)
          </button>
        </div>

      </div>
    </div>
  );
}
