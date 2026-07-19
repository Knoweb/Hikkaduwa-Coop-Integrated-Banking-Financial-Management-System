import json
import os

path = 'hmcs-frontend/src/pages/SystemAdminDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

edits = json.load(open('all_sysadmin_edits.json', encoding='utf-8'))

for edit in edits:
    args = edit.get('args', {})
    start_line = args.get('StartLine', 1) - 1
    end_line = args.get('EndLine', len(lines))
    target = args.get('TargetContent', '')
    replacement = args.get('ReplacementContent', '')
    
    # Try to find target in the lines
    content = "".join(lines)
    
    # Actually, the simplest way is to just use string replace on the whole file if it's unique,
    # but to be safe we should respect bounds.
    # The antigravity replace_file_content searches for the exact target string.
    # Let's just do a global replace for each edit, because usually TargetContent is unique enough.
    
    if target in content:
        content = content.replace(target, replacement, 1)
        lines = [line + '\n' for line in content.split('\n')]
        if lines[-1] == '\n':
            lines = lines[:-1]
    else:
        print(f"Target not found for edit: {edit.get('name')}")

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Applied edits!')
