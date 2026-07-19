import re

with open('src/pages/BranchDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Column header - Interest Base → Annual Rate
old1 = '<th className="px-3 py-2 font-medium border-b border-slate-200 text-right">Interest Base</th>'
new1 = '<th className="px-3 py-2 font-medium border-b border-slate-200 text-right">Annual Rate</th>'

# Fix 2: Cell data - interestBase → annualInterestRate %
old2 = '<td className="px-3 py-2 text-right font-mono text-xs text-slate-500">Rs. {(db.interestBase || 0).toLocaleString()}</td>'
new2 = '''<td className="px-3 py-2 text-right font-mono text-xs text-slate-500">
                                             {db.annualInterestRate != null
                                               ? `${(parseFloat(db.annualInterestRate) * 100).toFixed(2)}%`
                                               : '6.00%'}
                                           </td>'''

content = content.replace(old1, new1)
content = content.replace(old2, new2)

with open('src/pages/BranchDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
