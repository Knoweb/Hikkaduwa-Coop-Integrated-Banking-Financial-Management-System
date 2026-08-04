-- Insert FD_MONTHLY_INTEREST mock transactions with valid processed_by
INSERT INTO account_service.transactions (
    transaction_id, account_id, transaction_type, amount, balance_after, 
    processed_by, transaction_timestamp, reference, branch_id, tenant_id
)
SELECT 
    gen_random_uuid(), 
    f.linked_savings_account_id, 
    'FD_MONTHLY_INTEREST', 
    ROUND((f.principal_amount * f.interest_rate / 100) / 12, 2), 
    COALESCE(s.balance, 0), -- Balance was already updated in the previous run, so current balance is the balance after
    '59c75e11-b5f5-4ded-b587-d50f47aaee4a'::uuid,
    CURRENT_TIMESTAMP, 
    'Monthly Interest from FD ' || COALESCE(f.fd_number, 'Unknown'), 
    f.branch_id, 
    1
FROM account_service.fixed_deposits f
JOIN account_service.savings_accounts s ON f.linked_savings_account_id = s.account_id
WHERE f.branch_id = 4 AND f.interest_payout_method = 'MONTHLY' AND f.linked_savings_account_id IS NOT NULL;
