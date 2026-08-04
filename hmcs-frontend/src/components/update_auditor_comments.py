import re

file_path = "c:/Users/USER/OneDrive - itum.mrt.ac.lk/Desktop/Hikkaduwa bank/hmcs-frontend/src/components/AuditorCommentsView.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add getBranchNameStr helper if not exists
helper_code = """
  const getBranchNameStr = (branchId: number) => {
    const branchMap: Record<number, string> = {
      1: 'Main Branch',
      2: 'Dodanduwa Branch',
      3: 'Rathgama Branch',
      4: 'Seenigama Branch',
      5: 'Thiranagama Branch',
      6: 'Peraliya Branch',
      7: 'Kalupe Branch',
      8: 'Gonapinuwala Branch',
    };
    return branchMap[branchId] || 'Main Branch';
  };
"""

if "getBranchNameStr" not in content:
    content = content.replace("const currentUser = getCurrentUser();", f"{helper_code}\n  const currentUser = getCurrentUser();")

# Update isBranchManager
if "const isBranchManager" not in content:
    content = content.replace("const isAuditor = currentUser?.role === 'AUDITOR';", "const isAuditor = currentUser?.role === 'AUDITOR';\n  const isBranchManager = currentUser?.role === 'BRANCH_MANAGER';")

# Update filteredComments logic
old_filter = """  const filteredComments = comments.filter(c => {
    if (dateFilter === 'all') return true;"""

new_filter = """  const filteredComments = comments.filter(c => {
    if (isBranchManager) {
      const parsed = parseComment(c.comment);
      const userBranchName = currentUser?.branchName || getBranchNameStr(currentUser?.branchId);
      if (parsed.branch && parsed.branch !== userBranchName && parsed.branch !== 'Main Branch - Hikkaduwa' && !userBranchName.includes(parsed.branch) && !parsed.branch.includes(userBranchName.split(' ')[0])) {
         return false;
      }
    }
    
    if (dateFilter === 'all') return true;"""

if "if (isBranchManager)" not in content:
    content = content.replace(old_filter, new_filter)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated AuditorCommentsView.tsx for branch manager filtering")
