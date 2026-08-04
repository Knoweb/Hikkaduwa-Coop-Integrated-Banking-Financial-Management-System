const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'hmcs-frontend', 'src', 'pages', 'BranchDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const targetStart = `  useEffect(() => {
    const currentRole = user?.role?.replace('ROLE_', '');`;

const targetEndStr = `        });
      }
    }
  }, [user]);`;

// Since the end string might slightly differ, let's just find the indices.
const startIdx = content.indexOf(targetStart);

if (startIdx !== -1) {
    let nextUserEnd = content.indexOf('}, [user]);', startIdx);
    
    if (nextUserEnd !== -1) {
        let blockToWrap = content.substring(startIdx + `  useEffect(() => {\n`.length, nextUserEnd);
        
        let newHook = `  useEffect(() => {
    const fetchSidebarAlerts = () => {
` + blockToWrap + `    };
    fetchSidebarAlerts();
    const interval = setInterval(fetchSidebarAlerts, 10000); // 10s poll
    return () => clearInterval(interval);
  }, [user]);`;

        content = content.substring(0, startIdx) + newHook + content.substring(nextUserEnd + `}, [user]);`.length);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Hook wrapped successfully by index!");
    } else {
        console.log("End not found");
    }
} else {
    console.log("Start not found");
}
