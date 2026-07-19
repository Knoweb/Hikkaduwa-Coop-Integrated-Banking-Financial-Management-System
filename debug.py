import os

path = r'hmcs-frontend\src\pages\SystemAdminDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('Live Branch Network  Click to Manage</p>', 'Live Branch Network  Click to Manage. Branches length: {branches.length}. User tenant: {user?.tenantId}.</p>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
