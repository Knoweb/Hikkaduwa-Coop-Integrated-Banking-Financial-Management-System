with open('src/pages/BranchDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

old_block = '''export default function BranchDashboard({ overrideActiveTab, hideSidebar, overrideRole, readOnly, onBack }: { overrideActiveTab?: string, hideSidebar?: boolean, overrideRole?: string, readOnly?: boolean, onBack?: () => void } = {}) {
  const navigate   = useNavigate();
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; variant?: \'danger\' | \'warning\' | \'info\' }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const user       = AuthService.getCurrentUser();
  const [internalTab, setTabState] = useState(() => localStorage.getItem('hmcs_active_tab') || 'overview');
  const tab = overrideActiveTab || (navItems.some(n => n.key === internalTab) ? internalTab : 'overview');'''

new_block = '''export default function BranchDashboard({ overrideActiveTab, hideSidebar, overrideRole, readOnly, onBack }: { overrideActiveTab?: string, hideSidebar?: boolean, overrideRole?: string, readOnly?: boolean, onBack?: () => void } = {}) {
  const navigate   = useNavigate();
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; variant?: \'danger\' | \'warning\' | \'info\' }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const user       = AuthService.getCurrentUser();
  const role       = overrideRole || user?.role?.replace('ROLE_', '') || 'TELLER';
  const navItems   = ROLE_NAV[role] || ROLE_NAV['TELLER'];
  const [internalTab, setTabState] = useState(() => localStorage.getItem('hmcs_active_tab') || 'overview');
  const tab = overrideActiveTab || (navItems.some(n => n.key === internalTab) ? internalTab : 'overview');'''

# Remove duplicate definitions below
content = content.replace(old_block, new_block)
content = content.replace(old_block.replace('\n', '\r\n'), new_block.replace('\n', '\r\n'))

content = content.replace("  const role    = overrideRole || user.role?.replace('ROLE_', '') || 'TELLER';", "")
content = content.replace("  const navItems = ROLE_NAV[role]    || ROLE_NAV['TELLER';", "")

with open('src/pages/BranchDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
