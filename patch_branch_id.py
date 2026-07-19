import os

path = r'hmcs-frontend\src\pages\SystemAdminDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the map
content = content.replace('''      const mapped = data.map(b => ({
        ...b,
        id: b.branchId!,
        name: b.branchName
      }));''', '''      const mapped = data.map(b => ({
        ...b,
        id: b.branchId!,
        name: b.branchName
      }));''')  # Keep it just in case

# Fix the usages
content = content.replace('branch.id', 'branch.branchId')
content = content.replace('branch.name', 'branch.branchName')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('SystemAdminDashboard.tsx branchId patched')
