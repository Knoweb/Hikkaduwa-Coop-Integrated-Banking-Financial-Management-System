const fs = require('fs');
const file = 'hmcs-frontend/src/pages/SystemAdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Normalize to \n
content = content.replace(/\r\n/g, '\n');

// Conflict 1: Imports
content = content.replace(
/<<<<<<< HEAD\n\s*Settings, ChevronRight, ChevronDown, ChevronUp, Save, ArrowLeft, X, Eye, EyeOff, Percent, PiggyBank,\n\s*Lock, Briefcase, Scale\n=======\n\s*Settings, ChevronRight, Save, ArrowLeft, X, Eye, EyeOff, Percent, PiggyBank,\n\s*Lock, Briefcase, Scale, AlertTriangle\n>>>>>>> [a-f0-9]+/g,
`  Settings, ChevronRight, ChevronDown, ChevronUp, Save, ArrowLeft, X, Eye, EyeOff, Percent, PiggyBank,
  Lock, Briefcase, Scale, AlertTriangle`
);

// Conflict 2: State
content = content.replace(
/<<<<<<< HEAD([\s\S]*?)=======\n([\s\S]*?)>>>>>>> [a-f0-9]+/g,
function(match, headContent, branchContent) {
  // If it contains showFdTypeForm, it's conflict 2
  if (headContent.includes('showFdTypeForm') && branchContent.includes('loanTypes')) {
    return headContent + '\n' + branchContent;
  }
  
  // Conflict 3: Render Rate Rows
  if (headContent.includes("rateCategory === 'fd' ? (") && branchContent.includes("rateCategory === 'loans' && (")) {
    let combined = headContent.replace(/\{rateCategory !== 'savings' && rateCategory !== 'fd' && ratesData\[rateCategory as keyof typeof ratesData\].map\(\(item: any\) => \{/, '');
    
    // remove the trailing branch logic and manually add the catch-all
    let branchFixed = branchContent.replace(/\{rateCategory !== 'savings' && rateCategory !== 'loans' && ratesData\[rateCategory as keyof typeof ratesData\].map\(\(item: any\) => \{/, '');
    
    return combined + '\n' + branchFixed + '\n                  {rateCategory !== \'savings\' && rateCategory !== \'fd\' && rateCategory !== \'loans\' && (ratesData[rateCategory as keyof typeof ratesData] || []).map((item: any) => {';
  }

  // Conflict 4: Account Types forms
  if (headContent.includes("AccountService.createFixedDepositType") && branchContent.includes("handleAddLoanType")) {
    return headContent + '\n' + branchContent;
  }

  return headContent + '\n' + branchContent; // fallback to keeping both
}
);

// Restore to \r\n
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(file, content);
console.log('Fixed conflicts successfully.');
