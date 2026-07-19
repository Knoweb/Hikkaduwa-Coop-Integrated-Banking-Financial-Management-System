with open('src/pages/BranchDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update renderContent to route pawning_approvals under BRANCH_MANAGER
old_route = "if (['overview', 'approvals', 'loans', 'manager-approved', 'committee-approved'].includes(tab)) {"
new_route = "if (['overview', 'approvals', 'loans', 'manager-approved', 'committee-approved', 'pawning_approvals'].includes(tab)) {"

# 2. Add pawning_approvals conditional inside BranchManagerView
old_bm_cond = "  if (activeTab === 'pawning') {"
new_bm_cond = '''  if (activeTab === 'pawning_approvals') {
    return <PawningApprovalsView />;
  }

  if (activeTab === 'pawning') {'''

content = content.replace(old_route, new_route)
content = content.replace(old_route.replace('\n', '\r\n'), new_route.replace('\n', '\r\n'))
content = content.replace(old_bm_cond, new_bm_cond)
content = content.replace(old_bm_cond.replace('\n', '\r\n'), new_bm_cond.replace('\n', '\r\n'))

with open('src/pages/BranchDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)


# 3. Update PawningApprovalsView.tsx text labels
with open('src/components/PawningApprovalsView.tsx', 'r', encoding='utf-8') as f:
    pav = f.read()

pav = pav.replace('අනුමැතිය ලබාදිය යුතු', 'අනුමැතිය ලැබිය යුතු')
pav = pav.replace('අනුමත කළ උකස් අයදුම්පත්', 'පෙර උකස් වාර්තා')
pav = pav.replace('අනුමත කළ උකස්', 'පෙර වාර්තා')
pav = pav.replace('උකස් අයදුම්පත් — ඔබගේ අනුමැතිය ලබා දෙන්න', 'අනුමැතිය ලැබිය යුතු උකස් අයදුම්පත්')

with open('src/components/PawningApprovalsView.tsx', 'w', encoding='utf-8') as f:
    f.write(pav)

print('Done')
