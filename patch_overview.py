import os

path = r'hmcs-frontend\src\pages\SystemAdminDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace OverviewTab signature
content = content.replace('function OverviewTab({ allUsers, onSelectBranch }: {', 'function OverviewTab({ allUsers, onSelectBranch, branches }: {')
content = content.replace('onSelectBranch: (b: typeof BRANCHES[0]) => void;', 'onSelectBranch: (b: BranchService.BranchDTO) => void;\n  branches: BranchService.BranchDTO[];')

# Replace BRANCHES.map with branches.map
content = content.replace('BRANCHES.map((branch, idx) => {', 'branches.map((branch, idx) => {')

# Replace OverviewTab invocation
content = content.replace('<OverviewTab allUsers={allUsers} onSelectBranch={handleSelectBranch} />', '<OverviewTab allUsers={allUsers} onSelectBranch={handleSelectBranch} branches={branches} />')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('SystemAdminDashboard.tsx patched successfully')
