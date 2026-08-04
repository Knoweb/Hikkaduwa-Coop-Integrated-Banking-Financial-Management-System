DO $$
DECLARE
    acc_id UUID := '5f5af27c-c1be-424b-a475-32ff41662b44';
    start_date DATE := '2025-01-01';
    amt NUMERIC := 6014.96;
    curr_balance NUMERIC := 77619.37;
    i INT;
    payout_date TIMESTAMP;
BEGIN
    FOR i IN 1..18 LOOP
        payout_date := start_date + (i || ' months')::interval;
        curr_balance := curr_balance + amt;
        
        INSERT INTO account_service.transactions (
            account_id, transaction_type, amount, balance_after,
            processed_by, transaction_timestamp, reference, tenant_id
        ) VALUES (
            acc_id, 'INTEREST_CREDIT', amt, curr_balance,
            '00000000-0000-0000-0000-000000000000', payout_date,
            'FD89902022', 1
        );
    END LOOP;
    
    UPDATE account_service.savings_accounts
    SET balance = curr_balance
    WHERE account_id = acc_id;
END $$;
