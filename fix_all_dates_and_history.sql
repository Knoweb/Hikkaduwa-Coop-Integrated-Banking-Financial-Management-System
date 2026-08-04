DO $$
DECLARE
    rec RECORD;
    v_date TIMESTAMP;
    v_amt NUMERIC;
    v_balance NUMERIC;
    v_admin_user UUID := '59c75e11-b5f5-4ded-b587-d50f47aaee4a';
    
    l_rec RECORD;
    v_emi_amount NUMERIC;
    v_principal_portion NUMERIC;
    v_interest_portion NUMERIC;
    v_due_date DATE;
    v_status VARCHAR;
    v_outstanding NUMERIC;
BEGIN
    -- First, delete all existing dummy transactions, schedules, and repayments
    -- Since we ran this today, we can just clear them out for all accounts in the 3 branches
    DELETE FROM account_service.transactions WHERE branch_id IN (1, 2, 3);
    DELETE FROM loan_service.emi_schedules WHERE loan_id IN (SELECT loan_id FROM loan_service.loans WHERE branch_id IN (1, 2, 3));
    DELETE FROM loan_service.loan_repayments WHERE loan_id IN (SELECT loan_id FROM loan_service.loans WHERE branch_id IN (1, 2, 3));
    
    -- 1. Backdate all Members (Random date between 2022 and 2024)
    UPDATE member_service.members 
    SET created_at = timestamp '2022-01-01 00:00:00' + random() * (timestamp '2024-12-31 00:00:00' - timestamp '2022-01-01 00:00:00')
    WHERE registered_branch_id IN (1, 2, 3);
    
    -- 2. Backdate Savings Accounts
    UPDATE account_service.savings_accounts a
    SET opened_date = m.created_at::date
    FROM member_service.members m
    WHERE a.member_id = m.member_id AND a.branch_id IN (1, 2, 3);
    
    -- 3. Backdate Fixed Deposits
    UPDATE account_service.fixed_deposits a
    SET opened_date = m.created_at::date,
        maturity_date = m.created_at::date + (a.term_months || ' month')::interval
    FROM member_service.members m
    WHERE a.member_id = m.member_id AND a.branch_id IN (1, 2, 3);
    
    -- 4. Backdate Loans
    UPDATE loan_service.loans l
    SET created_at = m.created_at,
        applied_date = m.created_at::date
    FROM member_service.members m
    WHERE l.member_id = m.member_id AND l.branch_id IN (1, 2, 3);
    
    -- 5. Backdate Pawning Tickets
    UPDATE pawning_service.pawn_tickets p
    SET issue_date = m.created_at::date,
        expiry_date = m.created_at::date + INTERVAL '1 year'
    FROM member_service.members m
    WHERE p.member_id = m.member_id AND p.branch_id IN (1, 2, 3);
    
    
    -- Now Regenerate Savings Transactions (Deposits, Withdrawals, Interest) from past to today!
    FOR rec IN (SELECT account_id, opened_date, branch_id, tenant_id FROM account_service.savings_accounts WHERE branch_id IN (1, 2, 3)) LOOP
        v_balance := 0;
        v_date := rec.opened_date::timestamp + INTERVAL '1 day';
        
        -- Initial Deposit
        v_amt := 25000 + floor(random()*25000);
        v_balance := v_balance + v_amt;
        INSERT INTO account_service.transactions (
            transaction_id, account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, reference, branch_id, tenant_id
        ) VALUES (
            gen_random_uuid(), rec.account_id, 'DEPOSIT', v_amt, v_balance, v_admin_user, v_date, 'Initial Deposit', rec.branch_id, rec.tenant_id
        );
        
        -- Loop to add monthly transactions until CURRENT_DATE
        WHILE v_date < CURRENT_DATE - INTERVAL '1 month' LOOP
            -- Move 1 month forward
            v_date := v_date + INTERVAL '1 month';
            
            -- Add Interest (approx 5% per annum = 0.4% per month)
            v_amt := v_balance * 0.004;
            v_balance := v_balance + v_amt;
            INSERT INTO account_service.transactions (
                transaction_id, account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, reference, branch_id, tenant_id
            ) VALUES (
                gen_random_uuid(), rec.account_id, 'INTEREST', v_amt, v_balance, v_admin_user, v_date, 'Monthly Interest', rec.branch_id, rec.tenant_id
            );
            
            -- Random Deposit
            IF random() > 0.5 THEN
                v_date := v_date + INTERVAL '2 days';
                v_amt := floor(random()*10000 + 2000);
                v_balance := v_balance + v_amt;
                INSERT INTO account_service.transactions (
                    transaction_id, account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, reference, branch_id, tenant_id
                ) VALUES (
                    gen_random_uuid(), rec.account_id, 'DEPOSIT', v_amt, v_balance, v_admin_user, v_date, 'Cash Deposit', rec.branch_id, rec.tenant_id
                );
            END IF;
            
            -- Random Withdrawal
            IF random() > 0.7 AND v_balance > 5000 THEN
                v_date := v_date + INTERVAL '5 days';
                v_amt := floor(random()*5000 + 1000);
                v_balance := v_balance - v_amt;
                INSERT INTO account_service.transactions (
                    transaction_id, account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, reference, branch_id, tenant_id
                ) VALUES (
                    gen_random_uuid(), rec.account_id, 'WITHDRAWAL', v_amt, v_balance, v_admin_user, v_date, 'ATM / Cash Withdrawal', rec.branch_id, rec.tenant_id
                );
            END IF;
        END LOOP;
        
        -- Update the actual account balance
        UPDATE account_service.savings_accounts SET balance = v_balance WHERE account_id = rec.account_id;
    END LOOP;
    
    -- Regenerate Loan Schedules & Repayments
    FOR l_rec IN (SELECT loan_id, COALESCE(approved_amount, 0) as approved_amount, COALESCE(term_months, 1) as term_months, COALESCE(created_at, CURRENT_DATE) as created_at, branch_id, tenant_id FROM loan_service.loans WHERE branch_id IN (1, 2, 3) AND (status='ACTIVE' OR status='COMPLETED')) LOOP
        v_outstanding := l_rec.approved_amount;
        v_principal_portion := l_rec.approved_amount / GREATEST(l_rec.term_months, 1);
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
                    gen_random_uuid(), l_rec.loan_id, v_due_date, v_principal_portion, v_interest_portion, 0, v_emi_amount, 'Manual Payment - Office', v_admin_user, l_rec.branch_id, l_rec.tenant_id
                );
            ELSE
                v_status := 'PENDING';
            END IF;
            
            INSERT INTO loan_service.emi_schedules (
                loan_id, installment_number, due_date, emi_amount, principal_component, interest_component, status, tenant_id
            ) VALUES (
                l_rec.loan_id, i, v_due_date, v_emi_amount, v_principal_portion, v_interest_portion, v_status, l_rec.tenant_id
            );
        END LOOP;
    END LOOP;
END $$;
