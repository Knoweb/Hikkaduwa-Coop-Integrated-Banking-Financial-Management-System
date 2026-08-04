DO $$ 
DECLARE
    acc RECORD;
    tx RECORD;
    db_rec RECORD;
    v_min_balance NUMERIC;
    v_rate NUMERIC;
    v_new_interest NUMERIC;
    v_running_balance NUMERIC;
    v_db_balance NUMERIC;
    v_year INT;
    v_month INT;
BEGIN
    RAISE NOTICE 'Starting savings interest recalculation...';

    -- Loop through all savings accounts
    FOR acc IN SELECT account_id, balance, annual_interest_rate FROM account_service.savings_accounts LOOP
        v_running_balance := 0.0;
        
        RAISE NOTICE 'Processing account ID: %', acc.account_id;

        -- Loop through all transactions chronologically to recalculate interest amounts
        FOR tx IN 
            SELECT transaction_id, transaction_type, amount, transaction_timestamp 
            FROM account_service.transactions 
            WHERE account_id = acc.account_id 
            ORDER BY transaction_timestamp ASC, transaction_id ASC
        LOOP
            -- If it's an INTEREST transaction, recalculate using Minimum Balance of the Month
            IF tx.transaction_type = 'INTEREST' THEN
                v_year := EXTRACT(YEAR FROM tx.transaction_timestamp);
                v_month := EXTRACT(MONTH FROM tx.transaction_timestamp);

                -- Find the minimum closing balance of the month
                SELECT MIN(closing_balance) INTO v_min_balance
                FROM account_service.daily_balances
                WHERE account_id = acc.account_id
                  AND EXTRACT(YEAR FROM record_date) = v_year
                  AND EXTRACT(MONTH FROM record_date) = v_month;

                -- Find the interest rate for that month
                SELECT annual_interest_rate INTO v_rate
                FROM account_service.daily_balances
                WHERE account_id = acc.account_id
                  AND EXTRACT(YEAR FROM record_date) = v_year
                  AND EXTRACT(MONTH FROM record_date) = v_month
                ORDER BY record_date DESC
                LIMIT 1;

                IF v_rate IS NULL OR v_rate = 0 THEN
                    v_rate := COALESCE(acc.annual_interest_rate, 0.06);
                END IF;

                IF v_min_balance IS NULL THEN
                    v_min_balance := v_running_balance;
                END IF;

                -- Recalculate monthly interest
                v_new_interest := ROUND((v_min_balance * v_rate) / 12.0, 2);
                
                -- Update transaction amount
                UPDATE account_service.transactions 
                SET amount = v_new_interest 
                WHERE transaction_id = tx.transaction_id;
                
                tx.amount := v_new_interest;
            END IF;

            -- Update running balance
            IF tx.transaction_type IN ('INITIAL_DEPOSIT', 'DEPOSIT', 'INTEREST', 'FD_MONTHLY_INTEREST', 'BROUGHT_FORWARD', 'FD_CLOSURE', 'FIXED_DEPOSIT_CLOSURE', 'FD_RELEASE') THEN
                v_running_balance := v_running_balance + tx.amount;
            ELSE
                v_running_balance := v_running_balance - tx.amount;
            END IF;

            v_running_balance := ROUND(v_running_balance, 2);

            -- Update transaction balance_after
            UPDATE account_service.transactions 
            SET balance_after = v_running_balance 
            WHERE transaction_id = tx.transaction_id;
        END LOOP;

        -- Update the final savings account balance
        UPDATE account_service.savings_accounts 
        SET balance = v_running_balance 
        WHERE account_id = acc.account_id;

        -- Now align daily balances to match transaction history
        FOR db_rec IN 
            SELECT id, record_date 
            FROM account_service.daily_balances 
            WHERE account_id = acc.account_id 
            ORDER BY record_date ASC
        LOOP
            SELECT balance_after INTO v_db_balance
            FROM account_service.transactions
            WHERE account_id = acc.account_id
              AND transaction_timestamp <= (db_rec.record_date + TIME '23:59:59')
            ORDER BY transaction_timestamp DESC, transaction_id DESC
            LIMIT 1;

            IF FOUND THEN
                UPDATE account_service.daily_balances 
                SET closing_balance = v_db_balance 
                WHERE id = db_rec.id;
            END IF;
        END LOOP;
        
    END LOOP;

    RAISE NOTICE 'Recalculation completed successfully!';
END $$;
