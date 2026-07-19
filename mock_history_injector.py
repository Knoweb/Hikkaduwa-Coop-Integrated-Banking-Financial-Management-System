import subprocess
import json

def run_sql(query):
    # Runs a SQL query inside the postgres container using docker exec
    cmd = [
        "docker", "exec", "hmcs-postgres", 
        "psql", "-U", "hmcs_app", "-d", "hmcs_db", 
        "-c", query
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"SQL Error: {result.stderr}")
    return result.stdout

def backdate_savings_accounts():
    print("Backdating Savings Accounts to 2-3 years ago...")
    # Update created_at for all savings accounts in Rathgama branch
    # Assuming savings accounts are linked to branch 3
    query = """
    UPDATE account_service.savings_accounts 
    SET opened_date = NOW() - INTERVAL '2 years'
    WHERE branch_id = 3;
    """
    run_sql(query)
    print("Savings Accounts backdated successfully.")

def inject_savings_interest():
    print("Simulating Monthly Interest calculation for Savings Accounts...")
    # This would normally insert into account_service.transactions
    # Since we need account numbers, we first fetch them
    query = "SELECT account_number, balance FROM account_service.savings_accounts WHERE branch_id = 3;"
    output = run_sql(query)
    print("Found accounts, inserting historical interest transactions...")
    # Note: Full transaction insertion logic will go here
    # For now, it's just a placeholder to show the structure

def main():
    print("=== Starting Historical Mock Data Injection ===")
    backdate_savings_accounts()
    inject_savings_interest()
    
    # We will also add functions for:
    # 1. Backdating Loans (start_date)
    # 2. Simulating Loan EMI payments (updating emi_schedules, inserting loan_repayments)
    # 3. Backdating Pawning tickets
    
    print("=== Completed Historical Injection ===")

if __name__ == "__main__":
    main()
