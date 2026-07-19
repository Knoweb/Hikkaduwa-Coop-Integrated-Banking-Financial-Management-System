import os

path = r'hmcs-frontend\src\pages\SystemAdminDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('branch: typeof BRANCHES[0];', 'branch: BranchService.BranchDTO;')
content = content.replace('useState<typeof BRANCHES[0] | null>', 'useState<BranchService.BranchDTO | null>')
content = content.replace('(branch: typeof BRANCHES[0]) =>', '(branch: BranchService.BranchDTO) =>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('TypeScript types updated successfully')
