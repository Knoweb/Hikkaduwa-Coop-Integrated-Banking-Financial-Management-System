with open('src/pages/BranchDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Pawning Approvals to BRANCH_MANAGER
old_bm = '''  BRANCH_MANAGER:       [
    { icon: LayoutDashboard, label: 'Overview', key: 'overview' }, 
    { isSection: true, label: 'Manager Operations' },
    { icon: FileText, label: 'කළමනාකාර අනුමැතිය', key: 'loans' },
    { icon: CheckCircle, label: 'කමිටුව අනුමත කළ ණය', key: 'committee-approved' },'''

new_bm = '''  BRANCH_MANAGER:       [
    { icon: LayoutDashboard, label: 'Overview', key: 'overview' }, 
    { isSection: true, label: 'Manager Operations' },
    { icon: FileText, label: 'කළමනාකාර අනුමැතිය', key: 'loans' },
    { icon: CheckCircle, label: 'කමිටුව අනුමත කළ ණය', key: 'committee-approved' },
    { icon: Briefcase, label: 'Pawning Approvals', key: 'pawning_approvals' },'''

# 2. Remove Pawning Approvals from LOAN_COMMITTEE
old_lc = '''  LOAN_COMMITTEE:       [
    { icon: LayoutDashboard, label: 'Overview', key: 'overview' }, 
    { isSection: true, label: 'Approvals' },
    { icon: Scale, label: 'Vote on Loans', key: 'loans' },
    { icon: Briefcase, label: 'Pawning Approvals', key: 'pawning_approvals' }
  ],'''

new_lc = '''  LOAN_COMMITTEE:       [
    { icon: LayoutDashboard, label: 'Overview', key: 'overview' }, 
    { isSection: true, label: 'Approvals' },
    { icon: Scale, label: 'Vote on Loans', key: 'loans' }
  ],'''

content = content.replace(old_bm, new_bm)
content = content.replace(old_bm.replace('\n', '\r\n'), new_bm.replace('\n', '\r\n'))
content = content.replace(old_lc, new_lc)
content = content.replace(old_lc.replace('\n', '\r\n'), new_lc.replace('\n', '\r\n'))

with open('src/pages/BranchDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)


# 3. Modify PawningApprovalsView.tsx to fetch branch-specific tickets
with open('src/components/PawningApprovalsView.tsx', 'r', encoding='utf-8') as f:
    pav = f.read()

old_load = '''  const loadData = async () => {
    try {
      const user = getCurrentUser();
      const token = user?.token;
      const apiUrl = import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/pawning/tickets` 
        : 'http://localhost:8080/api/v1/pawning/tickets';
      const res = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    }
  };'''

new_load = '''  const loadData = async () => {
    try {
      const user = getCurrentUser();
      const token = user?.token;
      let apiUrl = import.meta.env.VITE_API_URL 
        ? `${import.meta.env.VITE_API_URL}/pawning/tickets` 
        : 'http://localhost:8080/api/v1/pawning/tickets';
      
      // Fetch only branch-specific tickets for manager/officer
      if (user?.role === 'BRANCH_MANAGER' || user?.role === 'SENIOR_OFFICER' || user?.branchId) {
        apiUrl = `${apiUrl}/branch/${user.branchId}`;
      }
      
      const res = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    }
  };'''

pav = pav.replace(old_load, new_load)
pav = pav.replace(old_load.replace('\n', '\r\n'), new_load.replace('\n', '\r\n'))

with open('src/components/PawningApprovalsView.tsx', 'w', encoding='utf-8') as f:
    f.write(pav)

print('Done')
