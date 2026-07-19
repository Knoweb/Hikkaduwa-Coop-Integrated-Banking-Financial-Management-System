const fs = require('fs');
const { execSync } = require('child_process');

const API_BASE = "http://localhost:8080/api/v1";
const USERNAME = "mgr_rathgama";
const PASSWORD = "password";
const BRANCH_ID = 3;

const MOCK_NAMES = [
    "අමරසිරි පීරිස්", "සමන් කුමාර", "කමල් පෙරේරා", "සුනිල් ශාන්ත", "නිහාල් රණසිංහ",
    "චන්දන ද සිල්වා", "රුවන් පතිරණ", "ජයන්ත කුමාර", "අසංක ප්‍රදීප්", "රවීන්ද්‍ර ප්‍රනාන්දු",
    "දිනූෂ මධුරංග", "ලහිරු මධුෂාන්", "ප්‍රසාද් චතුරංග", "චින්තක රොෂාන්", "මහේෂ් බණ්ඩාර",
    "නදීශා කුමාරි", "සුභානි මල්කාන්ති", "නිලන්ති පෙරේරා", "චම්පිකා ද සිල්වා", "දීපිකා රණසිංහ",
    "චතුරිකා ප්‍රනාන්දු", "ශානිකා මධුෂානි", "නිමාලි පතිරණ", "හංසිනි බණ්ඩාර", "රේණුකා ශාන්ති",
    "අයේෂා සඳමාලි", "දර්ශනී කුමාරි", "රසිකා දිල්රුක්ෂි", "ඉනෝකා දමයන්ති", "චමිලා නිවන්ති",
    "උපුල් ශාන්ත", "නයනජිත් කුමාර", "සම්පත් ප්‍රියංකර", "මධුරංග පෙරේරා", "තරංග ද සිල්වා",
    "නිශාන්ත පතිරණ", "චාමර රණසිංහ", "කවිඳු ප්‍රමෝද්", "සහන් මධුභාෂණ", "දනුෂ්ක ප්‍රසාද්",
    "නිලුපුල් කුමාර", "අසංක සම්පත්", "සුරේෂ් බණ්ඩාර", "අමිල රුවන්", "චන්ද්‍රසිරි ප්‍රනාන්දු",
    "නුවන් ප්‍රදීප්", "රොෂාන් චින්තක", "සුදත් කුමාර", "අජිත් පෙරේරා", "මංජුල ප්‍රනාන්දු"
];

function generateNic() {
    const year = 1975 + Math.floor(Math.random() * 25);
    let days = 1 + Math.floor(Math.random() * 365);
    if (Math.random() > 0.5) days += 500;
    const seq = 1000 + Math.floor(Math.random() * 8999);
    return `${year}${String(days).padStart(3, '0')}0${seq}`;
}

async function login() {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: USERNAME, password: PASSWORD })
    });
    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();
    return data.token;
}

async function createMember(token, name, nic) {
    const payload = {
        nic,
        fullName: name,
        fullNameSinhala: name,
        dateOfBirth: "1990-01-01",
        address: "රත්ගම, ගාල්ල",
        registeredBranchId: BRANCH_ID,
        contactNumber: `077${Math.floor(1000000 + Math.random() * 8999999)}`,
        status: "ACTIVE",
        isMember: true
    };
    const res = await fetch(`${API_BASE}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        console.error("Member creation failed:", await res.text());
        return null;
    }
    const data = await res.json();
    return data.memberId;
}

async function openSavingsAccount(token, memberId) {
    const payload = {
        memberId,
        accountType: "NORMAL",
        initialDeposit: 1000 + Math.floor(Math.random() * 49000),
        branchId: BRANCH_ID
    };
    const res = await fetch(`${API_BASE}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        console.error("Account creation failed:", await res.text());
        return null;
    }
    const data = await res.json();
    return data.accountId;
}

async function main() {
    console.log("=== Starting Mock Data Generation ===");
    const token = await login();
    console.log("Logged in successfully.");

    const generatedAccounts = [];
    const generatedMembers = [];

    for (let i = 0; i < 50; i++) {
        const name = MOCK_NAMES[i];
        const nic = generateNic();
        const memberId = await createMember(token, name, nic);
        if (memberId) {
            generatedMembers.push(memberId);
            const accId = await openSavingsAccount(token, memberId);
            if (accId) generatedAccounts.push(accId);
            console.log(`[${i+1}/50] Created: ${name} | Savings: ${accId}`);
        }
    }

    console.log("=== Generating Backdate SQL ===");
    // Create an SQL file to backdate these accounts randomly up to 3 years
    let sql = `
DO $$
DECLARE
    rec RECORD;
    v_past_months INT;
    v_created_at TIMESTAMP;
BEGIN
    -- Backdate Savings Accounts in Rathgama branch
    FOR rec IN SELECT account_id FROM account_service.savings_accounts WHERE branch_id = 3 LOOP
        v_past_months := floor(random() * 36)::int;
        v_created_at := NOW() - (v_past_months || ' months')::interval;
        
        UPDATE account_service.savings_accounts 
        SET opened_date = v_created_at::date, created_at = v_created_at 
        WHERE account_id = rec.account_id AND opened_date = CURRENT_DATE;
    END LOOP;
END $$;
    `;
    fs.writeFileSync('backdate.sql', sql);
    console.log("Running backdate.sql in docker...");
    try {
        execSync(`docker exec -i hmcs-postgres psql -U hmcs_app -d hmcs_db < backdate.sql`);
        console.log("Backdating complete.");
    } catch (e) {
        console.error("Backdating failed:", e.message);
    }
    console.log("Done.");
}

main().catch(console.error);
