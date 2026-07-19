with open('src/pages/BranchDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = 'if (sortedMonths.length === 0) {\n                    return <p className="text-center text-slate-500 py-8">No interest records found.</p>;\n                  }'

replacement = '''if (sortedMonths.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Calculator size={48} className="text-slate-300 mb-4" />
                        <h4 className="text-lg font-medium text-slate-700 mb-2">පොලී වාර්තා නොමැත (No interest records yet)</h4>
                        <p className="text-slate-500 max-w-sm">
                          මෙම ගිණුම සඳහා දෛනික පොලී වාර්තා තවමත් සකසා නොමැත. දෛනික පොලිය ගණනය වන්නේ සෑම දිනකම මධ්‍යම රාත්‍රියේදී (End of Day) ය. අද දින ආරම්භ කළ ගිණුම් වල පොලී විස්තර හෙට දින සිට මෙතැනින් බලාගත හැක.
                        </p>
                      </div>
                    );
                  }'''

content = content.replace(target, replacement)
content = content.replace(target.replace('\n', '\r\n'), replacement)

with open('src/pages/BranchDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')
