-- Update the 4 FDs
UPDATE account_service.fixed_deposits 
SET status = 'ACTIVE', maturity_date = '2027-02-20', interest_payout_method = 'MONTHLY', linked_savings_account_id = 'a91cbcbc-9ffe-4855-86fa-605f20e632f3'
WHERE fd_number = 'FD3008319';

UPDATE account_service.fixed_deposits 
SET status = 'ACTIVE', maturity_date = '2027-02-20', interest_payout_method = 'MONTHLY', linked_savings_account_id = '510febd3-fa8a-4841-b07e-4e83e5acd9d5'
WHERE fd_number = 'FD3009511';

UPDATE account_service.fixed_deposits 
SET status = 'ACTIVE', maturity_date = '2026-08-05', interest_payout_method = 'MONTHLY', linked_savings_account_id = '6aed2818-916b-4d1b-b3d8-9fb5073e7421'
WHERE fd_number = 'FD3003281';

UPDATE account_service.fixed_deposits 
SET status = 'ACTIVE', maturity_date = '2026-08-05', interest_payout_method = 'MONTHLY', linked_savings_account_id = 'c2f6fefc-b010-44d4-99f5-5098e62a3fb0'
WHERE fd_number = 'FD3003896';

-- Now insert historical interest payments for these 4 FDs
DO $$ 
DECLARE
    fd RECORD;
    v_start_date DATE;
    v_end_date DATE;
    v_payment_date DATE;
    v_monthly_interest NUMERIC;
    v_savings_balance NUMERIC;
BEGIN
    FOR fd IN SELECT * FROM account_service.fixed_deposits WHERE fd_number IN ('FD3008319', 'FD3009511', 'FD3003281', 'FD3003896') 
    LOOP
        v_start_date := fd.opened_date;
        v_end_date := CURRENT_DATE;
        v_monthly_interest := ROUND((fd.principal_amount * (fd.interest_rate / 100.0)) / 12.0, 2);
        
        -- Start paying from 1 month after opened date
        v_payment_date := v_start_date + INTERVAL '1 month';
        
        WHILE v_payment_date <= v_end_date LOOP
            
            -- Get current savings balance
            SELECT balance INTO v_savings_balance 
            FROM account_service.savings_accounts 
            WHERE account_id = fd.linked_savings_account_id;
            
            -- Insert transaction
            INSERT INTO account_service.transactions 
            (transaction_id, account_id, amount, balance_after, transaction_type, reference, transaction_timestamp, tenant_id, branch_id, processed_by)
            VALUES (
                gen_random_uuid(), 
                fd.linked_savings_account_id, 
                v_monthly_interest, 
                v_savings_balance + v_monthly_interest, 
                'FD_MONTHLY_INTEREST', 
                fd.fd_number || ' INTEREST', 
                v_payment_date + INTERVAL '10 hours', 
                fd.tenant_id, 
                fd.branch_id, 
                '00000000-0000-0000-0000-000000000000'
            );

            -- Update savings account balance
            UPDATE account_service.savings_accounts 
            SET balance = balance + v_monthly_interest 
            WHERE account_id = fd.linked_savings_account_id;
            
            v_payment_date := v_payment_date + INTERVAL '1 month';
        END LOOP;
        
        -- Set last payment date
        UPDATE account_service.fixed_deposits 
        SET last_interest_payout_date = v_payment_date - INTERVAL '1 month',
            accumulated_interest = 0
        WHERE fd_id = fd.fd_id;
        
        RAISE NOTICE 'Processed FD: %', fd.fd_number;
    END LOOP;
END $$;
