
import React, { useState, useRef, useEffect } from 'react';
import { X, Printer, Download, FileText, CheckCircle2, ShieldCheck, Download as DownloadIcon } from 'lucide-react';
import PrintableFdReceipt from './PrintableFdReceipt';
import { useTenantInfo } from '../hooks/useTenantInfo';

interface FdViewModalProps {
  fd: any;
  members: any[];
  savingsAccounts?: any[];
  onClose: () => void;
}

export function FdViewModal({ fd, members, savingsAccounts, onClose }: FdViewModalProps) {
  const { societyNameSi, branchNameSi, societyNameEn, branchNameEn } = useTenantInfo();
  const [activeTab, setActiveTab] = useState<'APP' | 'RECEIPT'>('APP');
  const printRef = useRef<HTMLDivElement>(null);
  const [fdTypes, setFdTypes] = useState<any[]>([]);

  useEffect(() => {
    import('../services/account.service').then(s => {
      s.getFixedDepositTypes().then(setFdTypes).catch(() => {});
    });
  }, []);

  const getMemberName = (id: string) => {


    if (!id) return '-';
    const member = members.find(m => m.memberId === id);
    return member ? member.fullName || member.fullNameSinhala : 'Unknown Member';
  };

  const getMemberNic = (id: string) => {
    if (!id) return '-';
    const member = members.find(m => m.memberId === id);
    return member ? member.nic : '-';
  };

  const getMemberAddress = (id: string) => {
    if (!id) return '-';
    const member = members.find(m => m.memberId === id);
    return member ? member.addressSinhala || member.address : '-';
  };

  const renderMemberDetails = (id: string) => {
    if (!id) return null;
    const member = members.find(m => m.memberId === id);
    if (!member) return null;

    return (
      <div className="p-5 bg-emerald-50/50 rounded-xl border border-emerald-100 relative mt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">සම්පූර්ණ නම</label>
            <input type="text" readOnly value={member.fullName || member.fullNameSinhala || ''} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">මුලකුරු සමඟ නම</label>
            <input type="text" readOnly value={member.nameWithInitials || ''} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">ජාතික හැඳුනුම්පත් අංකය</label>
            <input type="text" readOnly value={member.nic || member.birthCertificateNumber || ''} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">උපන් දිනය (DATE OF BIRTH)</label>
            <input type="text" readOnly value={member.dateOfBirth ? String(member.dateOfBirth).split('T')[0] : '-'} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">දුරකථන අංකය (PHONE NUMBER)</label>
            <input type="text" readOnly value={member.contactNumber || member.mobileNumber || member.phoneNumber || '-'} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">ලිපිනය</label>
            <input type="text" readOnly value={member.address || member.residentialAddress || ''} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700" />
          </div>
        </div>
      </div>
    );
  };

  const maturityInstructionText =  
    fd.maturityInstruction === 'REINVEST_PRINCIPAL_AND_INTEREST' ? 'මූලික මුදල සහ පොළිය නැවත ආයෝජනය කරන්න' :
    fd.maturityInstruction === 'REINVEST_PRINCIPAL_PAY_INTEREST' ? 'මූලික මුදල නැවත ආයෝජනය කර පොළිය ගෙවන්න' :
    'කල් පිරුණු පසු ගිණුම වසා දමන්න';

  const payoutMethodText = 
    fd.interestPayoutMethod === 'MONTHLY' ? 'මාසිකව' : 'කල් පිරීමේදී';

  const typeObj = fdTypes.find(t => t.id === fd.typeId || t.id === fd.fdTypeId);
  const category = typeObj ? 
    (typeObj.code?.startsWith('FD_SNR') ? 'ජ්‍යෙෂ්ඨ පුරවැසි' : 
     typeObj.code?.startsWith('FD_CHD') ? 'ළමා ස්ථාවර' : 'සාමාන්‍ය ස්ථාවර') 
    : (Number(fd.interestRate) >= 15 ? 'ජ්‍යෙෂ්ඨ පුරවැසි' : Number(fd.interestRate) <= 10 ? 'ළමා ස්ථාවර' : 'සාමාන්‍ය ස්ථාවර');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm print:bg-white print:p-0 print:block">
      <div className={`bg-slate-50 w-full ${activeTab === 'RECEIPT' ? 'max-w-[1050px]' : 'max-w-4xl'} rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 print:shadow-none print:border-none print:max-h-none`}>
        
        {/* Header - Hidden in print */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 print:hidden shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-emerald-50 text-[#025a4e] rounded-xl">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 leading-tight">ස්ථාවර තැන්පතු විස්තර</h2>
              <p className="text-xs font-semibold text-slate-500">ගිණුම් අංකය: {fd.fdNumber}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1 rounded-lg flex items-center mr-4 border border-slate-200">
              <button 
                onClick={() => setActiveTab('APP')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'APP' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                අයදුම්පත
              </button>
              <button 
                onClick={() => setActiveTab('RECEIPT')}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'RECEIPT' ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
              >
                කුවිතාන්සිය
              </button>
            </div>

            <button onClick={handlePrint} className="p-2 text-slate-400 hover:text-[#025a4e] hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200" title="මුද්‍රණය කරන්න">
              <Printer size={18} />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className={`flex-1 overflow-y-auto print:overflow-visible ${activeTab === 'APP' ? 'p-6 sm:p-8' : 'p-0'}`} ref={printRef}>
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * { visibility: hidden; }
              .print-container, .print-container * { visibility: visible; }
              .print-container { position: absolute; left: 0; top: 0; width: 100%; }
              @page { margin: 10mm; }
            }
          `}} />
          
          <div className="print-container bg-white border border-slate-200 rounded-xl shadow-sm p-8 sm:p-12 mx-auto max-w-3xl min-h-[800px] relative">
            
            {activeTab === 'APP' ? (
              /* APPLICATION FORM TAB */
              <div className="space-y-8 animate-in fade-in duration-300">
                
                {/* Common Bank Header for Print */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-black text-[#025a4e] tracking-tight">{societyNameEn.toUpperCase()}</h1>
                  <p className="text-emerald-700 text-sm font-medium mt-1">FIXED DEPOSIT CERTIFICATE</p>
                  <p className="text-emerald-600/70 text-xs mt-0.5">{branchNameEn} Branch</p>
                </div>

                {/* Step 1: Member Details */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-2">
                    1. සාමාජික විස්තර (Member Details)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">තැන්පතු කාණ්ඩය (CATEGORY)</label>
                      <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">{category}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">කාලය (TERM)</label>
                      <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">මාස {fd.termMonths}</div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">ගිණුම් වර්ගය (ACCOUNT TYPE)</label>
                      <div className="flex gap-6 mt-3">
                        <label className="flex items-center gap-2 cursor-not-allowed opacity-80">
                          <input type="radio" checked={!fd.memberId2} readOnly className="w-5 h-5 text-[#025a4e] border-slate-300" />
                          <span className="font-bold text-slate-700">තනි ගිණුමක් (Individual)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-not-allowed opacity-80">
                          <input type="radio" checked={!!fd.memberId2} readOnly className="w-5 h-5 text-[#025a4e] border-slate-300" />
                          <span className="font-bold text-slate-700">හවුල් ගිණුමක් (Joint)</span>
                        </label>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">සාමාජිකයා (MEMBER)</label>
                      {renderMemberDetails(fd.memberId)}
                      {fd.memberId2 && renderMemberDetails(fd.memberId2)}
                      {fd.memberId3 && renderMemberDetails(fd.memberId3)}
                    </div>
                  </div>
                </div>

                {/* Step 2: Deposit Details */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-2">
                    2. තැන්පතු විස්තර (Deposit Details)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">ගිණුම් අංකය (ACCOUNT NUMBER)</label>
                      <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                        {fd.fdNumber}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">තැන්පතු මුදල (PRINCIPAL AMOUNT)</label>
                      <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                        Rs. {Number(fd.principalAmount).toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">පොලිය ගෙවන ආකාරය (INTEREST PAYOUT)</label>
                      <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                        {payoutMethodText}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">කල් පිරුණු පසු උපදෙස් (MATURITY INSTRUCTION)</label>
                      <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800">
                        {maturityInstructionText}
                      </div>
                    </div>
                    {fd.linkedSavingsAccountId && (
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-2">සම්බන්ධිත ඉතිරිකිරීමේ ගිණුම (LINKED SAVINGS ACCOUNT)</label>
                        <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800">
                          {savingsAccounts?.find(sa => sa.accountId === fd.linkedSavingsAccountId)?.accountNumber || fd.linkedSavingsAccountId}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 3: Office Use Only */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b pb-2">
                    3. කාර්යාලීය ප්‍රයෝජනය සඳහා පමණි (Office Use Only)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">කුවිතාන්සි අංකය (RECEIPT NO)</label>
                      <div className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800">
                        {fd.receiptNumber || '-'}
                      </div>
                    </div>
                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4 mt-2 border-t border-slate-200 pt-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">තැන්පත් කළ දිනය (DEPOSIT DATE)</label>
                        <div className="font-semibold text-slate-800">
                          {fd.openedDate ? new Date(fd.openedDate).toISOString().split('T')[0] : 
                           fd.createdAt ? new Date(fd.createdAt).toISOString().split('T')[0] : 
                           '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">කල්පිරෙන දිනය (MATURITY DATE)</label>
                        <div className="font-semibold text-slate-800">
                          {fd.maturityDate ? new Date(fd.maturityDate).toISOString().split('T')[0] : '-'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">පොලී අනුපාතිකය (INTEREST RATE)</label>
                        <div className="font-semibold text-slate-800">{fd.interestRate || '0'}%</div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">බදු ආකෘති පත්‍රය (TAX FORM)</label>
                        <div className="font-semibold text-slate-800 flex items-center gap-2">
                          <input type="checkbox" checked={fd.hasSubmittedTaxForm || false} readOnly className="w-4 h-4 text-[#025a4e] bg-slate-100 border-slate-300 rounded cursor-not-allowed pointer-events-none" />
                          <span className="text-sm">{fd.hasSubmittedTaxForm ? 'ලබා දී ඇත' : 'ලබා දී නැත'}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
                
                {/* Signatures */}
                <div className="mt-16 pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center px-4 max-w-2xl mx-auto items-end">
                  <div>
                    <div className="border-b-2 border-slate-300 w-full mb-2 h-20 flex items-end justify-center pb-1">
                      {fd.depositorSignature && (
                        <img src={fd.depositorSignature} alt="Depositor Signature" className="max-h-16 w-auto object-contain" />
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">තැන්පත්කරුගේ අත්සන</p>
                  </div>
                  <div className="text-center">
                    <div className="w-40 border-b-2 border-emerald-800/20 mx-auto mb-2 border-dashed"></div>
                    <p className="text-xs font-semibold text-emerald-900">Authorized Signature</p>
                    <p className="text-[10px] text-emerald-600/70 mt-0.5">{societyNameEn}</p>
                  </div>
                  <div>
                    <div className="border-b-2 border-slate-300 w-full mb-2 h-20 flex items-end justify-center pb-1 text-slate-800 font-bold text-lg">
                      {fd.openedDate ? new Date(fd.openedDate).toISOString().split('T')[0] : 
                       fd.createdAt ? new Date(fd.createdAt).toISOString().split('T')[0] : 
                       '-'}
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">දිනය</p>
                  </div>
                </div>
              </div>

            ) : (
              /* RECEIPT TAB */
              <div className="animate-in fade-in duration-300 w-full flex justify-center pb-8">
                  {/* Screen View */}
                  <div className="print:hidden">
                    <div style={{ zoom: 0.8 }} className="w-[1200px] bg-white rounded-xl shadow-sm overflow-hidden">
                      <PrintableFdReceipt fdData={fd} memberName={getMemberName(fd.memberId)} />
                    </div>
                  </div>
                
                {/* Print View */}
                <div className="hidden print:block w-full bg-white">
                  <PrintableFdReceipt fdData={fd} memberName={getMemberName(fd.memberId)} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
