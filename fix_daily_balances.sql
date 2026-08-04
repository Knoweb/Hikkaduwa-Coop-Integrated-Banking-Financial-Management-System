DO $$
DECLARE
    acc RECORD;
    txn RECORD;
    v_date DATE;
    v_balance NUMERIC;
BEGIN
    -- Delete existing daily balances for the target branches
    DELETE FROM account_service.daily_balances 
    WHERE account_id IN (SELECT account_id FROM account_service.savings_accounts WHERE branch_id IN (1, 2, 3, 4));
    
    -- Regenerate daily balances based on transactions
    FOR acc IN (SELECT account_id, opened_date, tenant_id FROM account_service.savings_accounts WHERE branch_id IN (1, 2, 3, 4)) LOOP
        v_balance := 0;
        v_date := acc.opened_date::date;
        
        WHILE v_date <= CURRENT_DATE LOOP
            -- Find the last balance_after on or before this day
            SELECT balance_after INTO txn 
            FROM account_service.transactions 
            WHERE account_id = acc.account_id 
              AND transaction_timestamp::date <= v_date
            ORDER BY transaction_timestamp DESC, transaction_id DESC LIMIT 1;
            
            IF FOUND THEN
                v_balance := txn.balance_after;
            END IF;
            
            -- Insert the daily balance
            INSERT INTO account_service.daily_balances (
                id, account_id, annual_interest_rate, closing_balance, record_date, tenant_id
            ) VALUES (
                gen_random_uuid(), acc.account_id, 0.048, v_balance, v_date, acc.tenant_id
            );
            
            v_date := v_date + INTERVAL '1 day';
        END LOOP;
    END LOOP;
END $$;
