import os
import re

path = r'hmcs-frontend\src\pages\SystemAdminDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Exact regex to match the modal at 338
pattern = re.compile(r'      \{showAddBranch && \(\n        <div className="fixed inset-0.*?      \)\}', re.DOTALL)

matches = pattern.findall(content)

if len(matches) == 1:
    modal_jsx = matches[0]
    # Remove it from the current location
    content = content.replace(modal_jsx, '')
    
    # Add it to the end of the SystemAdminDashboard return statement
    end_pattern = r'      </main>\n    </div>\n  );\n}'
    
    # We will insert it before the closing </main>
    new_end = modal_jsx + '\n      </main>\n    </div>\n  );\n}'
    
    content = content.replace(end_pattern, new_end)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Successfully moved modal!")
else:
    print(f"Error: Found {len(matches)} matches, expected 1.")
