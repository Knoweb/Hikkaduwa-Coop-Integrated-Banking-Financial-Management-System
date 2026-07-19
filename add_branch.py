import os

path = r'hmcs-frontend\src\pages\SystemAdminDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update OverviewTab props
content = content.replace(
'''function OverviewTab({ allUsers, onSelectBranch, branches }: {
  allUsers: AuthService.UserDTO[];
  onSelectBranch: (b: BranchService.BranchDTO) => void;
  branches: BranchService.BranchDTO[];
}) {''',
'''function OverviewTab({ allUsers, onSelectBranch, branches, onAddBranch }: {
  allUsers: AuthService.UserDTO[];
  onSelectBranch: (b: BranchService.BranchDTO) => void;
  branches: BranchService.BranchDTO[];
  onAddBranch: () => void;
}) {'''
)

# 2. Update Live Branch Network header to include button
content = content.replace(
'''<p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Live Branch Network - Click to Manage</p>''',
'''<div className="flex justify-between items-center mb-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Live Branch Network - Click to Manage</p>
          <button onClick={onAddBranch} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-lg text-sm transition">
             <Plus size={16} /> {t('Add Branch')}
          </button>
        </div>'''
)

# 3. Inject Modal logic into SystemAdminDashboard
injection = '''  const [branches, setBranches] = useState<BranchService.BranchDTO[]>([]);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [addBranchForm, setAddBranchForm] = useState({ branchName: '', location: '', status: 'ACTIVE' });
  const [addingBranch, setAddingBranch] = useState(false);

  const handleCreateBranch = async () => {
    if(!addBranchForm.branchName) return;
    try {
      setAddingBranch(true);
      await BranchService.createBranch(addBranchForm);
      setShowAddBranch(false);
      setAddBranchForm({ branchName: '', location: '', status: 'ACTIVE' });
      fetchBranches();
    } catch(e) {
      console.error(e);
    } finally {
      setAddingBranch(false);
    }
  };'''

content = content.replace('  const [branches, setBranches] = useState<BranchService.BranchDTO[]>([]);', injection)

# 4. Update OverviewTab instantiation in SystemAdminDashboard
content = content.replace(
'''<OverviewTab allUsers={allUsers} onSelectBranch={handleSelectBranch} branches={branches} />''',
'''<OverviewTab allUsers={allUsers} onSelectBranch={handleSelectBranch} branches={branches} onAddBranch={() => setShowAddBranch(true)} />'''
)

# 5. Add Modal JSX to SystemAdminDashboard return statement
modal_jsx = '''      </div>

      {showAddBranch && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Building size={18} className="text-slate-500" />
                {t('Add New Branch')}
              </h3>
              <button onClick={() => setShowAddBranch(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('Branch Name')}</label>
                <input value={addBranchForm.branchName} onChange={e => setAddBranchForm({...addBranchForm, branchName: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="e.g. Colombo Main" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('Location')}</label>
                <input value={addBranchForm.location} onChange={e => setAddBranchForm({...addBranchForm, location: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="e.g. Colombo 01" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setShowAddBranch(false)} className="px-5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition">
                {t('Cancel')}
              </button>
              <button onClick={handleCreateBranch} disabled={addingBranch} className="px-5 py-2 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition flex items-center gap-2">
                <Save size={16} /> {addingBranch ? t('Saving...') : t('Create Branch')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>'''

content = content.replace('      </div>\n    </div>', modal_jsx)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
