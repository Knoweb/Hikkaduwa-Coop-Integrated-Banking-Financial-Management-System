DO $$
DECLARE
    acc RECORD;
    txn RECORD;
    v_date DATE;
    v_balance NUMERIC;
BEGIN
    DELETE FROM account_service.daily_balances 
    WHERE account_id IN (SELECT account_id FROM account_service.savings_accounts WHERE branch_id IN (1, 2, 3, 4));

    FOR acc IN (SELECT account_id, opened_date, tenant_id FROM account_service.savings_accounts WHERE branch_id IN (1, 2, 3, 4)) LOOP
        v_balance := 0;
        v_date := acc.opened_date::date;
        
        -- Loop through transactions ordered by time
        FOR txn IN (
            SELECT transaction_timestamp::date AS txn_date, balance_after
            FROM account_service.transactions
            WHERE account_id = acc.account_id
            ORDER BY transaction_timestamp ASC, transaction_id ASC
        ) LOOP
            
            -- If this transaction is on a future day, fill the gap with the OLD balance
            WHILE v_date < txn.txn_date AND v_date <= CURRENT_DATE LOOP
                INSERT INTO account_service.daily_balances (id, account_id, annual_interest_rate, closing_balance, record_date, tenant_id)
                VALUES (gen_random_uuid(), acc.account_id, 0.048, v_balance, v_date, acc.tenant_id);
                v_date := v_date + INTERVAL '1 day';
            END LOOP;
            
            -- Update balance to the new transaction's balance
            v_balance := txn.balance_after;
            
        END LOOP;
        
        -- Fill the remaining days up to CURRENT_DATE with the final balance
        WHILE v_date <= CURRENT_DATE LOOP
            INSERT INTO account_service.daily_balances (id, account_id, annual_interest_rate, closing_balance, record_date, tenant_id)
            VALUES (gen_random_uuid(), acc.account_id, 0.048, v_balance, v_date, acc.tenant_id);
            v_date := v_date + INTERVAL '1 day';
        END LOOP;

    END LOOP;
END $$;
