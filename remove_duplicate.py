import os

path = r'hmcs-frontend\src\pages\SystemAdminDashboard.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

modal_jsx = '''      {showAddBranch && (
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
      )}'''

parts = content.split(modal_jsx)
if len(parts) > 1:
    # Keep the last one by joining all except the last one without the modal, and adding the modal before the last part
    content = "".join(parts[:-1]) + modal_jsx + parts[-1]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
