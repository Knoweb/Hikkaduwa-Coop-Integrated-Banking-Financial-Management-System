-- Link savings accounts to MONTHLY FDs
UPDATE account_service.fixed_deposits f
SET linked_savings_account_id = (
    SELECT s.account_id 
    FROM account_service.savings_accounts s 
    WHERE s.member_id = f.member_id AND s.branch_id = 4 
    LIMIT 1
)
WHERE f.branch_id = 4 AND f.interest_payout_method = 'MONTHLY';

-- Insert FD_MONTHLY_INTEREST mock transactions
INSERT INTO account_service.transactions (
    transaction_id, account_id, transaction_type, amount, balance_after, 
    transaction_timestamp, reference, branch_id, tenant_id
)
SELECT 
    gen_random_uuid(), 
    f.linked_savings_account_id, 
    'FD_MONTHLY_INTEREST', 
    ROUND((f.principal_amount * f.interest_rate / 100) / 12, 2), 
    COALESCE(s.balance, 0) + ROUND((f.principal_amount * f.interest_rate / 100) / 12, 2), 
    CURRENT_TIMESTAMP, 
    'Monthly Interest from FD ' || COALESCE(f.fd_number, 'Unknown'), 
    f.branch_id, 
    1
FROM account_service.fixed_deposits f
JOIN account_service.savings_accounts s ON f.linked_savings_account_id = s.account_id
WHERE f.branch_id = 4 AND f.interest_payout_method = 'MONTHLY' AND f.linked_savings_account_id IS NOT NULL;

-- Update the savings account balances
UPDATE account_service.savings_accounts s
SET balance = COALESCE(s.balance, 0) + ROUND((f.principal_amount * f.interest_rate / 100) / 12, 2)
FROM account_service.fixed_deposits f
WHERE f.linked_savings_account_id = s.account_id 
  AND f.branch_id = 4 
  AND f.interest_payout_method = 'MONTHLY';
