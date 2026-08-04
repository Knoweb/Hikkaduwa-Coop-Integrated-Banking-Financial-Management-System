const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'hmcs-frontend', 'src', 'pages', 'BranchDashboard.tsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Wrap the hook body in a function and add polling
lines[5848] = "  useEffect(() => { const fetchSidebarAlerts = () => {";
lines[5931] = "  }; fetchSidebarAlerts(); const interval = setInterval(fetchSidebarAlerts, 5000); return () => clearInterval(interval); }, [user]);";

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log("Hook wrapped successfully");
