DO $$
DECLARE
    rec RECORD;
    v_base_date TIMESTAMP;
    v_txn_date TIMESTAMP;
    v_amt NUMERIC;
    v_balance NUMERIC;
    v_admin_user UUID := '59c75e11-b5f5-4ded-b587-d50f47aaee4a';
    
BEGIN
    -- Delete all transactions for the 3 branches to re-generate properly
    DELETE FROM account_service.transactions WHERE branch_id IN (1, 2, 3);
    
    -- Re-generate Savings Transactions (Deposits, Withdrawals, Interest) with FIXED dates
    FOR rec IN (SELECT account_id, opened_date, branch_id, tenant_id FROM account_service.savings_accounts WHERE branch_id IN (1, 2, 3)) LOOP
        v_balance := 0;
        
        -- Start from the opened date
        v_base_date := date_trunc('month', rec.opened_date::timestamp) + INTERVAL '1 month'; 
        -- e.g. if opened on 2022-03-15, first interest is on 2022-04-01
        
        -- Initial Deposit on opened date
        v_amt := 25000 + floor(random()*25000);
        v_balance := v_balance + v_amt;
        INSERT INTO account_service.transactions (
            transaction_id, account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, reference, branch_id, tenant_id
        ) VALUES (
            gen_random_uuid(), rec.account_id, 'DEPOSIT', v_amt, v_balance, v_admin_user, rec.opened_date::timestamp, 'Initial Deposit', rec.branch_id, rec.tenant_id
        );
        
        -- Loop to add monthly transactions until CURRENT_DATE
        WHILE v_base_date < CURRENT_DATE LOOP
            
            -- 1. Random Deposit (happens before interest calculation in the month)
            IF random() > 0.5 THEN
                v_txn_date := v_base_date - INTERVAL '15 days'; -- Middle of the month
                v_amt := floor(random()*10000 + 2000);
                v_balance := v_balance + v_amt;
                INSERT INTO account_service.transactions (
                    transaction_id, account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, reference, branch_id, tenant_id
                ) VALUES (
                    gen_random_uuid(), rec.account_id, 'DEPOSIT', v_amt, v_balance, v_admin_user, v_txn_date, 'Cash Deposit', rec.branch_id, rec.tenant_id
                );
            END IF;
            
            -- 2. Random Withdrawal (happens before interest calculation in the month)
            IF random() > 0.7 AND v_balance > 5000 THEN
                v_txn_date := v_base_date - INTERVAL '10 days';
                v_amt := floor(random()*5000 + 1000);
                v_balance := v_balance - v_amt;
                INSERT INTO account_service.transactions (
                    transaction_id, account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, reference, branch_id, tenant_id
                ) VALUES (
                    gen_random_uuid(), rec.account_id, 'WITHDRAWAL', v_amt, v_balance, v_admin_user, v_txn_date, 'ATM / Cash Withdrawal', rec.branch_id, rec.tenant_id
                );
            END IF;

            -- 3. Add Monthly Interest on the 1st of the month
            v_amt := v_balance * 0.004;
            v_balance := v_balance + v_amt;
            INSERT INTO account_service.transactions (
                transaction_id, account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, reference, branch_id, tenant_id
            ) VALUES (
                gen_random_uuid(), rec.account_id, 'INTEREST', v_amt, v_balance, v_admin_user, v_base_date, 'Monthly Interest', rec.branch_id, rec.tenant_id
            );
            
            -- Move 1 month forward for the next iteration
            v_base_date := v_base_date + INTERVAL '1 month';
            
        END LOOP;
        
        -- Update the actual account balance
        UPDATE account_service.savings_accounts SET balance = v_balance WHERE account_id = rec.account_id;
    END LOOP;
    
END $$;
