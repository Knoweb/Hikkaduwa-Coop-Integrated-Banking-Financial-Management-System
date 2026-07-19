import os

path = r'hmcs-frontend\src\pages\SystemAdminDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "text-lg font-bold text-slate-800" in line:
        lines[i] = '            <h1 className="text-lg font-bold text-slate-800">{activeBranch ? t(activeBranch.name) : (user?.tenantId === 0 ? t(\'SaaS Administration Panel\') : `${user?.organizationName || t(\'HMCS Bank\')} - ${t(\'System Administration Panel\')}`)}</h1>\n'

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print('Updated SystemAdminDashboard.tsx')
