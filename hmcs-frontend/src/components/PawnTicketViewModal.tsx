import React from 'react';
import { X, Gem, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { printPawnTicket } from '../utils/print'; // We will create this

export default function PawnTicketViewModal({ ticket, onClose }: { ticket: any; onClose: () => void }) {
  if (!ticket) return null;

  const isExpiringSoon = ticket.status === 'ACTIVE' && 
                         new Date(ticket.expiryDate).getTime() - new Date().getTime() <= 30 * 24 * 60 * 60 * 1000;

  const handlePrint = () => {
    // Call print function (we'll implement this if needed, or leave it as a placeholder)
    alert("Printing Pawn Ticket...");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-800 to-yellow-600 text-white p-5 rounded-t-2xl flex justify-between items-start shrink-0">
          <div>
            <p className="text-xs text-yellow-200 font-medium uppercase tracking-wider mb-1">උකස් පත්‍රිකාව (Pawn Ticket)</p>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Gem size={20} /> ටිකට් අංකය: {ticket.ticketNumber}
            </h2>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
              ticket.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
              ticket.status === 'REDEEMED' ? 'bg-green-100 text-green-700' :
              'bg-red-100 text-red-700'
            }`}>{ticket.status}</span>
            <button onClick={onClose} className="p-1 hover:bg-yellow-700 rounded-lg transition"><X size={18}/></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isExpiringSoon && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
              <AlertTriangle className="shrink-0" />
              <div>
                <p className="font-bold text-sm">කල් ඉකුත් වීමට ආසන්නයි! (Expiring Soon!)</p>
                <p className="text-xs mt-1">මෙම උකස් පත්‍රිකාව දින 30ක් ඇතුළත කල් ඉකුත් වේ. කරුණාකර ගනුදෙනුකරු දැනුවත් කරන්න.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-medium mb-1">සාමාජික හැඳුනුම්පත (Member ID)</p>
              <p className="text-sm font-semibold text-slate-800">{ticket.memberId}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-medium mb-1">නිකුත් කළ දිනය / කල් ඉකුත් වන දිනය</p>
              <p className="text-sm font-semibold text-slate-800">{ticket.issueDate} / {ticket.expiryDate}</p>
            </div>

            <div className="col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-500 font-medium mb-1">භාණ්ඩ විස්තරය (Article Description)</p>
              <p className="text-sm font-semibold text-slate-800">{ticket.articleDescription}</p>
              <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-slate-200">
                <div>
                  <p className="text-xs text-slate-500">දළ බර</p>
                  <p className="font-mono text-sm font-semibold">{ticket.grossWeightGrams}g</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">ශුද්ධ බර</p>
                  <p className="font-mono text-sm font-semibold text-blue-700">{ticket.netWeightGrams}g</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">කැරට් අගය</p>
                  <p className="font-mono text-sm font-semibold">{ticket.purityKarat}K</p>
                </div>
              </div>
            </div>

            <div className="col-span-2 border-2 border-yellow-100 rounded-xl p-5 bg-yellow-50/30">
              <h3 className="text-sm font-bold text-yellow-800 border-b border-yellow-200 pb-2 mb-3">මුල්‍ය විස්තර සහ ගණනය කිරීම් (Financial Details)</h3>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-600">තක්සේරු වටිනාකම (Assessed Value)</span>
                <span className="text-sm font-semibold">Rs. {Number(ticket.assessedValue).toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-600">අත්තිකාරම් මුදල (Advance Amount)</span>
                <span className="text-sm font-semibold text-slate-800">Rs. {Number(ticket.advanceAmount).toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-600">වාර්ෂික පොලී අනුපාතය (Interest Rate)</span>
                <span className="text-sm font-semibold">{ticket.interestRate}% p.a.</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-600">ගත වූ දින ගණන (Days Elapsed)</span>
                <span className="text-sm font-semibold">{ticket.daysElapsed} Days</span>
              </div>

              <div className="flex justify-between items-center py-2 border-t border-slate-200 mt-2">
                <span className="text-sm font-medium text-slate-800">එකතු වූ පොලිය (Accrued Interest)</span>
                <span className="text-sm font-bold text-red-600">+ Rs. {Number(ticket.accruedInterest).toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-t-2 border-slate-800 mt-2">
                <span className="text-base font-bold text-slate-800">මුළු ගෙවිය යුතු මුදල (Total Due)</span>
                <span className="text-xl font-bold text-blue-700">Rs. {Number(ticket.totalDue).toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-slate-400 text-center mt-2 italic">
                * ගණනය කිරීම: (අත්තිකාරම් මුදල × දින ගණන × {ticket.interestRate}) ÷ 36,500
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition">
            Close
          </button>
          <button onClick={handlePrint} className="px-5 py-2 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition flex items-center gap-2">
            <FileText size={16} /> Print Ticket
          </button>
        </div>
      </div>
    </div>
  );
}
