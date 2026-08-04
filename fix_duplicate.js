const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'hmcs-frontend', 'src', 'pages', 'BranchDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Find all occurrences of "Supporting Docs"
let lines = content.split('\n');
let newLines = [];
let skip = false;
let foundCount = 0;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{/* Supporting Docs */}')) {
    foundCount++;
    // Keep the first one, skip the second one
    if (foundCount === 2) {
      skip = true;
    }
  }
  
  if (skip && lines[i].trim() === ')}' && lines[i-1].includes('</div>')) {
    skip = false;
    continue; // skip the ')}' line too
  }
  
  if (!skip) {
    newLines.push(lines[i]);
  }
}

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('Removed duplicate block');
