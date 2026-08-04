DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT account_id, SUM(amount) as total_deduct
        FROM account_service.transactions
        WHERE reference LIKE 'Monthly Interest from FD%' OR reference LIKE 'Linked to FD:%'
        GROUP BY account_id
    ) LOOP
        UPDATE account_service.savings_accounts 
        SET balance = balance - r.total_deduct
        WHERE account_id = r.account_id;
        
        RAISE NOTICE 'Deducted % from account %', r.total_deduct, r.account_id;
    END LOOP;
    
    DELETE FROM account_service.transactions 
    WHERE reference LIKE 'Monthly Interest from FD%' OR reference LIKE 'Linked to FD:%';
    
    RAISE NOTICE 'Deleted duplicate transactions.';
END $$;
