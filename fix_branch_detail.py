import os

path = r'hmcs-frontend\src\pages\SystemAdminDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

injection = '''  const [roles, setRoles] = useState<string[]>([]);
  const [config, setConfig] = useState({ name: branch.branchName, location: branch.location || '', status: branch.status });
  const [savingConfig, setSavingConfig] = useState(false);

  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true);
      await BranchService.updateBranch(branch.branchId!, {
        branchName: config.name,
        location: config.location,
        status: config.status
      });
      onRefresh(); // Refresh branches to get updated info
    } catch (e) {
      console.error(e);
    } finally {
      setSavingConfig(false);
    }
  };'''

content = content.replace('  const [roles, setRoles] = useState<string[]>([]);', injection)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
