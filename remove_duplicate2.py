import os
import re

path = r'hmcs-frontend\src\pages\SystemAdminDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# The modal starts with "{showAddBranch && (" and ends with "      )}"
# We will use regex to find all matches of this block.
pattern = re.compile(r'      \{showAddBranch && \(\n        <div className="fixed inset-0.*?      \)\}', re.DOTALL)

matches = pattern.findall(content)
print(f"Found {len(matches)} occurrences")

if len(matches) > 1:
    # Replace all matches with empty string
    content_no_modal = pattern.sub('', content)
    # Then insert the modal just before the last </div>
    
    # Actually, it's easier to just do a replacement count
    # Replace all except the last one.
    
    for _ in range(len(matches) - 1):
        content = content.replace(matches[0], '', 1)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
