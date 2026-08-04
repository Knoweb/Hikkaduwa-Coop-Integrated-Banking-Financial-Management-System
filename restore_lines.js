const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'hmcs-frontend', 'src', 'pages', 'BranchDashboard.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

lines[5848] = "                type: 'LOAN_APPROVAL',";
lines[5931] = "        }));";

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log("Restored lines");
