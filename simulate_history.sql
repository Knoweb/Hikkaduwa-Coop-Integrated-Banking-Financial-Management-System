DO $$
DECLARE
    rec RECORD;
    v_trans_id UUID;
    v_balance NUMERIC;
    v_date TIMESTAMP;
    v_amt NUMERIC;
    v_admin_user UUID := '58057539-e029-49de-b81d-e7e956dd37da'; -- mgr_rathgama user_id (for processed_by)
    
    l_rec RECORD;
    v_emi_amount NUMERIC;
    v_principal_portion NUMERIC;
    v_interest_portion NUMERIC;
    v_due_date DATE;
    v_status VARCHAR;
    v_outstanding NUMERIC;
BEGIN
    -- 1. Simulate Savings Transactions for Rathgama
    FOR rec IN (SELECT account_id, opened_date FROM account_service.savings_accounts WHERE branch_id = 3 AND status='ACTIVE') LOOP
        v_balance := 0;
        v_date := rec.opened_date::timestamp + INTERVAL '1 day';
        
        -- Initial Deposit
        v_amt := 25000 + floor(random()*25000);
        v_balance := v_balance + v_amt;
        INSERT INTO account_service.transactions (
            transaction_id, account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, reference, branch_id, tenant_id
        ) VALUES (
            gen_random_uuid(), rec.account_id, 'DEPOSIT', v_amt, v_balance, v_admin_user, v_date, 'මුල් තැන්පතුව (INITIAL DEPOSIT)', 3, 1
        );
        
        -- Withdrawal 1 month later
        v_date := v_date + INTERVAL '1 month';
        v_amt := floor(random()*5000 + 1000);
        v_balance := v_balance - v_amt;
        INSERT INTO account_service.transactions (
            transaction_id, account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, reference, branch_id, tenant_id
        ) VALUES (
            gen_random_uuid(), rec.account_id, 'WITHDRAWAL', v_amt, v_balance, v_admin_user, v_date, 'මුදල් ආපසු ගැනීම (WITHDRAWAL)', 3, 1
        );
        
        -- Deposit 2 months later
        v_date := v_date + INTERVAL '20 days';
        v_amt := floor(random()*10000 + 5000);
        v_balance := v_balance + v_amt;
        INSERT INTO account_service.transactions (
            transaction_id, account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, reference, branch_id, tenant_id
        ) VALUES (
            gen_random_uuid(), rec.account_id, 'DEPOSIT', v_amt, v_balance, v_admin_user, v_date, 'තැන්පතුව (DEPOSIT)', 3, 1
        );
        
        -- Update the actual account balance to match
        UPDATE account_service.savings_accounts SET balance = v_balance WHERE account_id = rec.account_id;
    END LOOP;

    -- 2. Simulate Loan Repayments & Schedules
    -- First, delete the dummy EMI schedules
    DELETE FROM loan_service.emi_schedules WHERE loan_id IN (SELECT loan_id FROM loan_service.loans WHERE branch_id = 3);
    
    FOR l_rec IN (SELECT loan_id, approved_amount, term_months, created_at FROM loan_service.loans WHERE branch_id = 3 AND status='ACTIVE') LOOP
        v_outstanding := l_rec.approved_amount;
        v_principal_portion := l_rec.approved_amount / l_rec.term_months;
        v_interest_portion := l_rec.approved_amount * 0.01; -- 1% flat monthly approx
        v_emi_amount := v_principal_portion + v_interest_portion;
        
        -- Generate schedule for all months
        FOR i IN 1..l_rec.term_months LOOP
            v_due_date := (l_rec.created_at + (i || ' month')::interval)::date;
            
            -- If due date is in the past, assume it was PAID
            IF v_due_date < CURRENT_DATE THEN
                v_status := 'PAID';
                v_outstanding := v_outstanding - v_principal_portion;
                
                -- Insert Repayment Record
                INSERT INTO loan_service.loan_repayments (
                    id, loan_id, payment_date, principal_portion, interest_portion, penalty_paid, total_paid, payment_method, processed_by, payment_branch_id, tenant_id
                ) VALUES (
                    gen_random_uuid(), l_rec.loan_id, v_due_date, v_principal_portion, v_interest_portion, 0, v_emi_amount, 'Manual Payment - Office', v_admin_user, 3, 1
                );
            ELSE
                v_status := 'PENDING';
            END IF;
            
            INSERT INTO loan_service.emi_schedules (
                loan_id, installment_number, due_date, emi_amount, principal_component, interest_component, status, tenant_id
            ) VALUES (
                l_rec.loan_id, i, v_due_date, v_emi_amount, v_principal_portion, v_interest_portion, v_status, 1
            );
        END LOOP;
    END LOOP;
END $$;
