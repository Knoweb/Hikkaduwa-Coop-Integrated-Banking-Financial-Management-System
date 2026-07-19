import requests
import random
import time
from datetime import datetime, timedelta

# Configuration
API_BASE = "http://localhost:8080/api/v1"
USERNAME = "mgr_rathgama"
PASSWORD = "password"
BRANCH_ID = 3

MOCK_NAMES = [
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
]

def generate_nic():
    year = random.randint(1975, 2000)
    is_male = random.choice([True, False])
    days = random.randint(1, 365)
    if not is_male:
        days += 500
    sequence = random.randint(1000, 9999)
    return f"{year}{days:03d}0{sequence}"

def login():
    res = requests.post(f"{API_BASE}/auth/login", json={"username": USERNAME, "password": PASSWORD})
    res.raise_for_status()
    return res.json()['token']

def create_member(token, full_name, nic):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "nic": nic,
        "fullName": full_name,
        "fullNameSinhala": full_name,
        "dateOfBirth": "1990-01-01", 
        "address": "රත්ගම, ගාල්ල",
        "registeredBranchId": BRANCH_ID,
        "contactNumber": f"077{random.randint(1000000, 9999999)}",
        "status": "ACTIVE",
        "isMember": True
    }
    res = requests.post(f"{API_BASE}/members", json=payload, headers=headers)
    if res.status_code != 200:
        print(f"Failed to create member: {res.text}")
        return None
    return res.json()['memberId']

def open_savings_account(token, member_id):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "memberId": member_id,
        "accountType": "NORMAL", # Might need to match an actual account type code
        "initialDeposit": random.randint(1000, 50000),
        "branchId": BRANCH_ID
    }
    res = requests.post(f"{API_BASE}/accounts", json=payload, headers=headers)
    if res.status_code != 200:
        print(f"Failed to open savings account: {res.text}")
        return None
    return res.json()['accountId']

def main():
    print("Logging in...")
    try:
        token = login()
        print("Login successful.")
    except Exception as e:
        print(f"Login failed: {e}")
        return

    print("Generating 50 Members for Rathgama Branch...")
    for i, name in enumerate(MOCK_NAMES):
        nic = generate_nic()
        member_id = create_member(token, name, nic)
        if member_id:
            account_id = open_savings_account(token, member_id)
            print(f"[{i+1}/50] Created Member {name} (NIC: {nic}) with Savings Account {account_id}")
        time.sleep(0.1)

if __name__ == "__main__":
    main()
