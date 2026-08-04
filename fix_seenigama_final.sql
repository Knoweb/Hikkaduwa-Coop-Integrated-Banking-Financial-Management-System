DO $$
DECLARE
    rec RECORD;
    v_base_date TIMESTAMP;
    v_txn_date TIMESTAMP;
    v_amt NUMERIC;
    v_balance NUMERIC;
    v_admin_user UUID := '00000000-0000-0000-0000-000000000000';
    
    l_rec RECORD;
    v_emi_amount NUMERIC;
    v_principal_portion NUMERIC;
    v_interest_portion NUMERIC;
    v_due_date DATE;
    v_status VARCHAR;
    v_outstanding NUMERIC;
BEGIN
    -- 1. Make ~20 members non-members
    UPDATE member_service.members 
    SET is_member = false 
    WHERE member_id IN (
        SELECT member_id FROM member_service.members 
        WHERE registered_branch_id = 4 AND is_member = true
        LIMIT 20
    );

    -- 2. Clean old transactions
    DELETE FROM account_service.transactions WHERE branch_id = 4;
    DELETE FROM loan_service.loan_schedules WHERE loan_id IN (SELECT loan_id FROM loan_service.loans WHERE branch_id = 4);
    DELETE FROM loan_service.loan_repayments WHERE loan_id IN (SELECT loan_id FROM loan_service.loans WHERE branch_id = 4);
    
    -- 3. Backdate all Members for branch 4
    UPDATE member_service.members 
    SET created_at = timestamp '2022-01-01 00:00:00' + random() * (timestamp '2024-12-31 00:00:00' - timestamp '2022-01-01 00:00:00')
    WHERE registered_branch_id = 4;
    
    -- 4. Backdate Savings Accounts
    UPDATE account_service.savings_accounts a
    SET opened_date = m.created_at::date
    FROM member_service.members m
    WHERE a.member_id = m.member_id AND a.branch_id = 4;
    
    -- 5. Backdate Fixed Deposits
    UPDATE account_service.fixed_deposits a
    SET opened_date = m.created_at::date,
        maturity_date = m.created_at::date + (a.term_months || ' month')::interval
    FROM member_service.members m
    WHERE a.member_id = m.member_id AND a.branch_id = 4;
    
    -- 6. Backdate Loans
    UPDATE loan_service.loans l
    SET created_at = m.created_at,
        applied_date = m.created_at::date,
        disbursement_date = m.created_at
    FROM member_service.members m
    WHERE l.member_id = m.member_id AND l.branch_id = 4;
    
    -- 7. Backdate Pawning Tickets
    UPDATE pawning_service.pawn_tickets p
    SET issue_date = m.created_at::date,
        expiry_date = m.created_at::date + INTERVAL '1 year'
    FROM member_service.members m
    WHERE p.member_id = m.member_id AND p.branch_id = 4;
    
    -- 8. Re-generate Savings Transactions
    FOR rec IN (SELECT account_id, opened_date, branch_id, tenant_id FROM account_service.savings_accounts WHERE branch_id = 4) LOOP
        v_balance := 0;
        v_base_date := date_trunc('month', rec.opened_date::timestamp) + INTERVAL '1 month'; 
        
        -- Initial Deposit
        v_amt := 25000 + floor(random()*25000);
        v_balance := v_balance + v_amt;
        INSERT INTO account_service.transactions (
            transaction_id, account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, reference, branch_id, tenant_id
        ) VALUES (
            gen_random_uuid(), rec.account_id, 'DEPOSIT', v_amt, v_balance, v_admin_user, rec.opened_date::timestamp, 'Initial Deposit', rec.branch_id, rec.tenant_id
        );
        
        -- Loop to add monthly transactions until CURRENT_DATE
        WHILE v_base_date < CURRENT_DATE LOOP
            -- 1. Random Deposit 
            IF random() > 0.5 THEN
                v_txn_date := v_base_date - INTERVAL '15 days'; 
                v_amt := floor(random()*10000 + 2000);
                v_balance := v_balance + v_amt;
                INSERT INTO account_service.transactions (
                    transaction_id, account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, reference, branch_id, tenant_id
                ) VALUES (
                    gen_random_uuid(), rec.account_id, 'DEPOSIT', v_amt, v_balance, v_admin_user, v_txn_date, 'Cash Deposit', rec.branch_id, rec.tenant_id
                );
            END IF;
            
            -- 2. Random Withdrawal
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

            -- 3. Add Monthly Interest
            v_amt := v_balance * 0.004;
            v_balance := v_balance + v_amt;
            INSERT INTO account_service.transactions (
                transaction_id, account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, reference, branch_id, tenant_id
            ) VALUES (
                gen_random_uuid(), rec.account_id, 'INTEREST', v_amt, v_balance, v_admin_user, v_base_date, 'Monthly Interest', rec.branch_id, rec.tenant_id
            );
            
            v_base_date := v_base_date + INTERVAL '1 month';
        END LOOP;
        
        UPDATE account_service.savings_accounts SET balance = v_balance WHERE account_id = rec.account_id;
    END LOOP;
    
    -- 9. Regenerate Loan Schedules & Repayments for branch 4
    FOR l_rec IN (SELECT loan_id, COALESCE(approved_amount, 0) as approved_amount, COALESCE(term_months, 1) as term_months, COALESCE(created_at, CURRENT_DATE) as created_at, branch_id, tenant_id FROM loan_service.loans WHERE branch_id = 4 AND (status='ACTIVE' OR status='COMPLETED')) LOOP
        v_outstanding := l_rec.approved_amount;
        v_principal_portion := ROUND(l_rec.approved_amount / GREATEST(l_rec.term_months, 1), 2);
        v_interest_portion := ROUND(l_rec.approved_amount * 0.01, 2);
        v_emi_amount := v_principal_portion + v_interest_portion;
        
        FOR i IN 1..l_rec.term_months LOOP
            v_due_date := (l_rec.created_at + (i || ' month')::interval)::date;
            
            IF v_due_date < CURRENT_DATE THEN
                IF i >= l_rec.term_months - floor(random() * 3) THEN 
                     v_status := 'OVERDUE';
                ELSE
                     v_status := 'PAID';
                     v_outstanding := v_outstanding - v_principal_portion;
                     
                     INSERT INTO loan_service.loan_repayments (
                         id, loan_id, payment_date, principal_portion, interest_portion, penalty_paid, total_paid, payment_method, processed_by, payment_branch_id, tenant_id, reference
                     ) VALUES (
                         gen_random_uuid(), l_rec.loan_id, v_due_date, v_principal_portion, v_interest_portion, 0, v_emi_amount, 'CASH', v_admin_user, l_rec.branch_id, l_rec.tenant_id, 'PMT-' || lpad(i::text, 4, '0')
                     );
                END IF;
            ELSE
                v_status := 'PENDING';
            END IF;
            
            INSERT INTO loan_service.loan_schedules (
                id, loan_id, installment_number, due_date, total_expected_amount, expected_principal, expected_interest, status, outstanding_balance, tenant_id
            ) VALUES (
                gen_random_uuid(), l_rec.loan_id, i, v_due_date, v_emi_amount, v_principal_portion, v_interest_portion, v_status, GREATEST(0, v_outstanding), l_rec.tenant_id
            );
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Seenigama branch data fully randomized and fixed!';
END $$;
