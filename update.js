const fs = require('fs');

let content = fs.readFileSync('hmcs-frontend/src/pages/SystemAdminDashboard.tsx', 'utf8');

const startStr = "      {innerTab === 'config' && (";
const endStr = "        </div>\n      )}";

const startIdx = content.indexOf(startStr);
if (startIdx === -1) {
  console.log("Could not find start");
  process.exit(1);
}
const endIdx = content.indexOf(endStr, startIdx);
if (endIdx === -1) {
  console.log("Could not find end");
  process.exit(1);
}

const replacement =       {innerTab === 'config' && (
        <div className="space-y-5 max-w-2xl">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2"><Building size={16} /> {t('Branch Information')}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('Branch Name')}</label>
                <input value={config.name} onChange={e => setConfig({...config, name: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{t('Location')}</label>
                <input value={config.location} onChange={e => setConfig({...config, location: e.target.value})} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2"><Shield size={16} /> {t('Branch Status')}</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">{t('Mark branch as Active / Inactive')}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t('Inactive branches cannot process transactions.')}</p>
              </div>
              <select value={config.status} onChange={e => setConfig({...config, status: e.target.value})} className="border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400">
                <option value="ACTIVE">{t('Active')}</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSaveConfig} disabled={savingConfig} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition">
              <Save size={16} /> {savingConfig ? t('Saving...') : t('Save Config')}
            </button>
          </div>
        </div>
      )};

content = content.substring(0, startIdx) + replacement + content.substring(endIdx + endStr.length);

fs.writeFileSync('hmcs-frontend/src/pages/SystemAdminDashboard.tsx', content, 'utf8');
console.log("Updated!");
