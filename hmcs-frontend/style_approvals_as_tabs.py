with open('src/pages/BranchDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Restrict internalTab fallback to navItems key match
old_tab_res = "const tab = overrideActiveTab || internalTab;"
new_tab_res = "const tab = overrideActiveTab || (navItems.some(n => n.key === internalTab) ? internalTab : 'overview');"

# 2. Remove pawning_approvals checks from CustomerServiceView
old_csv_block = '''  if (activeTab === 'pawning_approvals') {
    return <PawningApprovalsView />;
  }

  if (activeTab === 'pawning_approvals') {
    return <PawningApprovalsView />;
  }'''

content = content.replace(old_tab_res, new_tab_res)
content = content.replace(old_tab_res.replace('\n', '\r\n'), new_tab_res.replace('\n', '\r\n'))
content = content.replace(old_csv_block, "")
content = content.replace(old_csv_block.replace('\n', '\r\n'), "")

with open('src/pages/BranchDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)


# 3. Restructure PawningApprovalsView.tsx to use tab buttons instead of cards
with open('src/components/PawningApprovalsView.tsx', 'r', encoding='utf-8') as f:
    pav = f.read()

old_pav_tabs = '''      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
        <div onClick={() => setActiveListTab('pending')} className={`bg-white rounded-2xl p-5 cursor-pointer shadow-sm border-2 transition-all flex items-center gap-4 ${activeListTab === 'pending' ? 'border-amber-500 scale-[1.02] shadow-md' : 'border-slate-100 hover:border-amber-200'}`}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-100">
            <Clock size={22} className="text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">අනුමැතිය ලැබිය යුතු</p>
            <p className="text-2xl font-bold text-slate-800">{pendingTickets.length}</p>
          </div>
        </div>

        <div onClick={() => setActiveListTab('approved')} className={`bg-white rounded-2xl p-5 cursor-pointer shadow-sm border-2 transition-all flex items-center gap-4 ${activeListTab === 'approved' ? 'border-emerald-500 scale-[1.02] shadow-md' : 'border-slate-100 hover:border-emerald-200'}`}>
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-100">
            <CheckCircle size={22} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">පෙර වාර්තා</p>
            <p className="text-2xl font-bold text-slate-800">{approvedTickets.length}</p>
          </div>
        </div>
      </div>'''

new_pav_tabs = '''      <div className="flex border-b border-slate-200 gap-6 mb-6">
        <button 
          onClick={() => setActiveListTab('pending')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${activeListTab === 'pending' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Clock size={16} />
          <span>අනුමැතිය ලැබිය යුතු ({pendingTickets.length})</span>
          {activeListTab === 'pending' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>

        <button 
          onClick={() => setActiveListTab('approved')}
          className={`pb-3 text-sm font-bold transition-all relative flex items-center gap-2 ${activeListTab === 'approved' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <CheckCircle size={16} />
          <span>පෙර වාර්තා ({approvedTickets.length})</span>
          {activeListTab === 'approved' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
          )}
        </button>
      </div>'''

pav = pav.replace(old_pav_tabs, old_pav_tabs) # Just in case line endings are weird, python replace does it
pav = pav.replace(old_pav_tabs, new_pav_tabs)
pav = pav.replace(old_pav_tabs.replace('\n', '\r\n'), new_pav_tabs.replace('\n', '\r\n'))

with open('src/components/PawningApprovalsView.tsx', 'w', encoding='utf-8') as f:
    f.write(pav)

print('Done')
