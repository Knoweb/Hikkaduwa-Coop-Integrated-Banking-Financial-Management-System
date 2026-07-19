import os

path = r'hmcs-frontend\src\pages\SystemAdminDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('<div>DEBUG: branches.length = {branches.length}, user.tenantId = {user?.tenantId}</div><OverviewTab allUsers={allUsers} onSelectBranch={handleSelectBranch} branches={branches} />',
'<><div>DEBUG: branches.length = {branches.length}, user.tenantId = {user?.tenantId}</div><OverviewTab allUsers={allUsers} onSelectBranch={handleSelectBranch} branches={branches} /></>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
