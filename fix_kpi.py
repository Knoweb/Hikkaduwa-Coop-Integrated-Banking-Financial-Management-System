import os

path = r'hmcs-frontend\src\pages\SystemAdminDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("value: '8 / 8',", "value: ${branches.filter(b => b.status === 'ACTIVE').length} / ,")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
