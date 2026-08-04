const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'hmcs-frontend', 'src', 'pages', 'BranchDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const startIdx = content.indexOf('{/* Supporting Docs */}');
const endIdx = content.indexOf('{/* Guarantors */}');
const fieldOfficerIdx = content.indexOf('{/* Field Officer Evaluation */}');

if (startIdx !== -1 && endIdx !== -1 && fieldOfficerIdx !== -1) {
    // Extract the supporting docs block
    const blockToMove = content.substring(startIdx, endIdx);
    
    // Remove it from its original place
    content = content.substring(0, startIdx) + content.substring(endIdx);
    
    // Now fieldOfficerIdx needs to be recalculated
    const newFieldOfficerIdx = content.indexOf('{/* Field Officer Evaluation */}');
    
    // Insert it before Field Officer Evaluation
    content = content.substring(0, newFieldOfficerIdx) + blockToMove + '\n          ' + content.substring(newFieldOfficerIdx);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Moved by index successfully");
} else {
    console.log("Could not find markers!");
}
