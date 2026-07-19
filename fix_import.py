import os

path = r'hmcs-frontend\src\pages\SystemAdminDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import * as LoanService from '../services/loan.service';",
"import * as LoanService from '../services/loan.service';\nimport * as BranchService from '../services/branch.service';")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
