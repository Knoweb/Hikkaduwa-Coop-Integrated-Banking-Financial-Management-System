import os

path = r'hmcs-frontend\src\pages\SystemAdminDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix useEffect dependencies
content = content.replace('''  useEffect(() => {
    if (user && user.tenantId !== 0) {
      fetchBranches();
    }
  }, [user]);''', '''  useEffect(() => {
    if (user && user.tenantId !== 0) {
      fetchBranches();
    }
  }, [user?.token]);''')

content = content.replace('''  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      if (user.tenantId === 0) {
        // SaaS Platform Admin should not be trapped in a society's branch view
        sessionStorage.removeItem('sa_activeBranch');
        localStorage.removeItem('overrideBranchId');
        setActiveBranch(null);
        setMainTab('tenants');
      } else {
        fetchUsers();
      }
    }
  }, [user]);''', '''  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      if (user.tenantId === 0) {
        // SaaS Platform Admin should not be trapped in a society's branch view
        sessionStorage.removeItem('sa_activeBranch');
        localStorage.removeItem('overrideBranchId');
        setActiveBranch(null);
        setMainTab('tenants');
      } else {
        fetchUsers();
      }
    }
  }, [user?.token]);''')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('SystemAdminDashboard.tsx dependencies patched')
