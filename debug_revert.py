import os
import re

path = r'hmcs-frontend\src\pages\SystemAdminDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'(Live Branch Network.*?)(</p>)', r'Live Branch Network - Click to Manage\2', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
