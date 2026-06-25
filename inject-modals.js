const fs = require('fs');
let c = fs.readFileSync('hmcs-frontend/src/pages/BranchDashboard.tsx', 'utf8');

const target = `      </div>
    );
}

function BankServiceManagerView`;

const replacement = `
        {viewingFd && (<FdViewModal fd={viewingFd} members={members} onClose={() => setViewingFd(null)} />)}

        {rowTxAction && (<TransactionModal accountNumber={rowTxAccount?.accountNumber || ''} accountType={rowTxAccount?.accountType || ''} balance={Number(rowTxAccount?.balance || 0)} accountHolder={rowTxAccount?.childName || members.find(m => m.memberId === rowTxAccount?.memberId)?.fullNameSinhala || members.find(m => m.memberId === rowTxAccount?.memberId)?.fullName || 'N/A'} action={rowTxAction} allAccounts={accounts} members={members} onClose={() => { setRowTxAction(null); setRowTxAccount(null); }} onSuccess={() => { setRowTxAction(null); setRowTxAccount(null); AccountService.getAccounts().then(setAccounts).catch(() => {}); }} />)}
      </div>
    );
}

function BankServiceManagerView`;

c = c.replace(target, replacement);
fs.writeFileSync('hmcs-frontend/src/pages/BranchDashboard.tsx', c);
console.log('Script ran!');
