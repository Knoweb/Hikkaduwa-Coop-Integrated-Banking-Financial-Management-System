with open('src/pages/BranchDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Locate the second useEffect that fetches branch notifications and tickets
old_effect = '''  useEffect(() => {
    AccountService.getBranchNotifications().then(async (notifs) => {
      // Fetch Pawning Tickets to check for nearing maturity
      try {
        const tickets = await PawningService.getTicketsByBranch(user.branchId);
        const nearingPawning = tickets.filter((t: any) => {'''

new_effect = '''  useEffect(() => {
    AccountService.getBranchNotifications().then(async (notifs) => {
      // Fetch Pawning Tickets to check for nearing maturity
      try {
        const tickets = await PawningService.getTicketsByBranch(user.branchId);
        const pending = tickets.filter((t: any) => t.status === 'PENDING');
        setPendingPawnCount(pending.length);
        
        const nearingPawning = tickets.filter((t: any) => {'''

content = content.replace(old_effect, new_effect)
content = content.replace(old_effect.replace('\n', '\r\n'), new_effect.replace('\n', '\r\n'))

with open('src/pages/BranchDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done')
