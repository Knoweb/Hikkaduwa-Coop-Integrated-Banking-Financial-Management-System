import re
import os

path = r'hmcs-frontend\src\utils\print.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# For each exported function, insert user extraction logic
def add_user_logic(match):
    header = match.group(0)
    logic = """
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : {};
  const orgName = user.organizationName || 'HMCS Bank';
  const branchName = user.branchName || 'Main Branch';
"""
    return header + logic

content = re.sub(r'export const \w+\s*=\s*\([^)]*\)\s*=>\s*\{', add_user_logic, content)

# Replace occurrences
content = content.replace('Hikkaduwa Co-operative Society Bank', '')
content = content.replace('Hikkaduwa Branch (???????? ?????)', '')
content = content.replace('HIKKADUWA CO-OP BANK', '')
content = content.replace('???????? ????? &bull; HIKKADUWA BRANCH', '')
content = content.replace('Hikkaduwa Co-op Integrated Banking Financial Management System', ' Integrated Banking System')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print('print.ts modified successfully.')
