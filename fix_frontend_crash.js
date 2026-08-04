const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            
            // Fix the crash: .toLowerCase().replace(/\s+/g, '') should be .toLowerCase()?.replace(/\s+/g, '')
            // Actually, we can just replace all `.toLowerCase().replace` with `.toLowerCase()?.replace`
            content = content.replace(/\.toLowerCase\(\)\.replace/g, ".toLowerCase()?.replace");
            
            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed ' + fullPath);
            }
        }
    }
}

processDir('hmcs-frontend/src');
