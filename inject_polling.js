const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'hmcs-frontend', 'src', 'pages', 'BranchDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Sidebar notification counts hook
const target1 = `  useEffect(() => {
    const currentRole = user?.role?.replace('ROLE_', '');
    if (currentRole === 'BRANCH_MANAGER') {`;
    
const replacement1 = `  useEffect(() => {
    const fetchSidebarAlerts = () => {
      const currentRole = user?.role?.replace('ROLE_', '');
      if (currentRole === 'BRANCH_MANAGER') {`;

const target1_end = `          }).catch(() => {});
        });
      }
    }
  }, [user]);`;

const replacement1_end = `          }).catch(() => {});
        });
      }
    };
    
    fetchSidebarAlerts();
    const interval = setInterval(fetchSidebarAlerts, 10000);
    return () => clearInterval(interval);
  }, [user]);`;

if (content.includes(target1) && content.includes(target1_end)) {
    content = content.replace(target1, replacement1);
    content = content.replace(target1_end, replacement1_end);
    console.log("Replaced Sidebar Hook");
} else {
    console.log("Sidebar Hook not found");
}

// 2. Pawning tickets and general branch notifications
const target2 = `  useEffect(() => {
    AccountService.getBranchNotifications().then(async (notifs) => {`;
    
const replacement2 = `  useEffect(() => {
    const fetchBranchAlerts = () => {
      AccountService.getBranchNotifications().then(async (notifs) => {`;

const target2_end = `      }).catch(() => {});
    }
  }, [user.branchId]);`;

const replacement2_end = `      }).catch(() => {});
    };
    fetchBranchAlerts();
    const intervalId = setInterval(fetchBranchAlerts, 10000);
    return () => clearInterval(intervalId);
  }, [user.branchId]);`;

// Since it might not have the if wrapper
const target2_end_alt = `      }).catch(() => {});
  }, [user.branchId]);`;

const replacement2_end_alt = `      }).catch(() => {});
    };
    fetchBranchAlerts();
    const intervalId = setInterval(fetchBranchAlerts, 10000);
    return () => clearInterval(intervalId);
  }, [user.branchId]);`;

if (content.includes(target2)) {
    content = content.replace(target2, replacement2);
    if (content.includes(target2_end)) {
        content = content.replace(target2_end, replacement2_end);
        console.log("Replaced Branch Alerts Hook");
    } else if (content.includes(target2_end_alt)) {
        content = content.replace(target2_end_alt, replacement2_end_alt);
        console.log("Replaced Branch Alerts Hook (Alt)");
    } else {
        console.log("Branch Alerts Hook end not found");
    }
} else {
    console.log("Branch Alerts Hook start not found");
}

// 3. The LoanCommitteeView / loadData
const target3 = `  const loadData = () => {
    LoanService.getLoans().then(setLoans).catch(() => {});
  };

  useEffect(() => { loadData(); }, []);`;

const replacement3 = `  const loadData = () => {
    LoanService.getLoans().then(setLoans).catch(() => {});
  };

  useEffect(() => { 
    loadData(); 
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);`;

if (content.includes(target3)) {
    content = content.replace(target3, replacement3);
    console.log("Replaced LoanCommittee loadData Hook");
} else {
    console.log("LoanCommittee loadData Hook not found");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Script executed.");
