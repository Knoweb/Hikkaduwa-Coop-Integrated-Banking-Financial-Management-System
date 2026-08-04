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
            
            // Replace pattern: xxx.toLowerCase().includes(yyy) 
            // We want to change to: xxx.toLowerCase().replace(/\s+/g, '').includes(yyy.replace(/\s+/g, ''))
            
            // Regex to find: something.toLowerCase().includes(search)
            // It's safer to just look for .toLowerCase().includes( and replace it.
            
            // Pattern 1: .toLowerCase().includes(var.toLowerCase())
            content = content.replace(/\.toLowerCase\(\)\.includes\(([^)]+)\.toLowerCase\(\)\)/g, ".toLowerCase().replace(/\\s+/g, '').includes($1.toLowerCase().replace(/\\s+/g, ''))");
            
            // Pattern 2: .toLowerCase().includes(var)  where var is usually searchLower or term
            content = content.replace(/\.toLowerCase\(\)\.includes\((searchLower|term|q)\)/g, ".toLowerCase().replace(/\\s+/g, '').includes($1.replace(/\\s+/g, ''))");
            
            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log('Updated ' + fullPath);
            }
        }
    }
}

processDir('hmcs-frontend/src');
