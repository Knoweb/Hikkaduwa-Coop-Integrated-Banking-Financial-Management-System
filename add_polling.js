const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'hmcs-frontend', 'src', 'pages', 'BranchDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update the first useEffect for notifications (user role based counts)
const hook1Match = content.match(/useEffect\(\(\) => \{\n\s*const currentRole = user\?\.role\?\.replace\('ROLE_', ''\);[\s\S]*?\}, \[user\]\);/);
if (hook1Match) {
    const hook1Body = hook1Match[0].replace('useEffect(() => {', '').replace('}, [user]);', '');
    const replacement1 = `useEffect(() => {
    const fetchAlerts = () => {${hook1Body}};
    fetchAlerts();
    const intervalId = setInterval(fetchAlerts, 10000);
    return () => clearInterval(intervalId);
  }, [user]);`;
    content = content.replace(hook1Match[0], replacement1);
} else {
    console.log("Hook 1 not found");
}

// 2. Update the second useEffect (getBranchNotifications)
const hook2Match = content.match(/useEffect\(\(\) => \{\n\s*AccountService\.getBranchNotifications\(\)[\s\S]*?\}, \[user\.branchId\]\);/);
if (hook2Match) {
    const hook2Body = hook2Match[0].replace('useEffect(() => {', '').replace('}, [user.branchId]);', '');
    const replacement2 = `useEffect(() => {
    const fetchNotifications = () => {${hook2Body}};
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 10000);
    return () => clearInterval(intervalId);
  }, [user.branchId]);`;
    content = content.replace(hook2Match[0], replacement2);
} else {
    console.log("Hook 2 not found");
}

// 3. Update the fetchLoans useEffect
const hook3Match = content.match(/useEffect\(\(\) => \{\n\s*fetchLoans\(\);\n\s*\}, \[\]\);/);
if (hook3Match) {
    const replacement3 = `useEffect(() => {
    fetchLoans();
    const intervalId = setInterval(() => {
      // Background poll without showing loading spinner
      LoanService.getLoans().then(setLoans).catch(() => {});
    }, 10000);
    return () => clearInterval(intervalId);
  }, []);`;
    content = content.replace(hook3Match[0], replacement3);
} else {
    console.log("Hook 3 not found");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Script ran successfully');
