import os

path = r'hmcs-frontend\src\pages\SystemAdminDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("value: ${branches.filter(b => b.status === 'ACTIVE').length} / ,", "value: `${branches.filter(b => b.status === 'ACTIVE').length} / ${branches.length}`,")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
