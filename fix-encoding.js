const fs = require('fs');
let c = fs.readFileSync('hmcs-frontend/src/pages/BranchDashboard.tsx', 'utf8');

c = c.replace(
  /<button onClick=\{\(\) => setViewingFd\(fd\)\}[^>]+>[\s\S]*?<\/button>/,
  '<button onClick={() => setViewingFd(fd)} className="px-4 py-2 rounded-xl text-sm font-bold text-[#025a4e] bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200">බලන්න</button>'
);

c = c.replace(
  /<button onClick=\{\(\) => \{\s*setRowTxAccount\([\s\S]*?CLOSE_FD[\s\S]*?<\/button>/,
  '<button onClick={() => { setRowTxAccount({ accountId: fd.id, accountNumber: fd.fdNumber, accountType: \'FIXED_DEPOSIT\', balance: fd.principalAmount, memberId: fd.memberId, childName: \'\' } as any); setRowTxAction(\'CLOSE_FD\'); }} className="px-3 py-1 rounded-xl text-xs font-bold text-[#025a4e] bg-white hover:bg-slate-50 transition-colors flex items-center gap-2 border border-slate-200 text-left leading-tight shadow-sm"><ArrowUpRight size={14} className="text-slate-500" /><span>නිදහස<br/>කරන්න</span></button>'
);

fs.writeFileSync('hmcs-frontend/src/pages/BranchDashboard.tsx', c);
console.log('Done!');
