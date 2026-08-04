-- 1. Move the 2 COMPLETED loans to Rathgama branch (branch_id = 3)
UPDATE loan_service.loans 
SET branch_id = 3 
WHERE account_number IN ('LN3006316', 'LN3001034');

-- 2. Add some payments for ACTIVE loans (make 2 installments PAID)
DO $$ 
DECLARE
    l RECORD;
    e RECORD;
    v_admin_id UUID := '00000000-0000-0000-0000-000000000000';
    v_payment_id UUID;
BEGIN
    FOR l IN SELECT * FROM loan_service.loans WHERE branch_id = 3 AND status = 'ACTIVE' LOOP
        -- Get first 2 pending schedules
        FOR e IN SELECT * FROM loan_service.emi_schedules WHERE loan_id = l.loan_id AND status = 'PENDING' ORDER BY due_date ASC LIMIT 2 LOOP
            v_payment_id := gen_random_uuid();
            
            INSERT INTO loan_service.loan_repayments 
            (id, loan_id, payment_date, principal_portion, interest_portion, penalty_paid, total_paid, payment_method, processed_by, payment_branch_id, tenant_id, reference)
            VALUES (
                v_payment_id,
                l.loan_id,
                e.due_date,
                e.principal_component,
                e.interest_component,
                0,
                e.emi_amount,
                'CASH',
                v_admin_id,
                3,
                1,
                'Payment for Installment ' || e.installment_number
            );

            UPDATE loan_service.emi_schedules 
            SET status = 'PAID' 
            WHERE schedule_id = e.schedule_id;
            
        END LOOP;
    END LOOP;
END $$;

-- 3. Make all schedules PAID and add payments for the COMPLETED loans
DO $$ 
DECLARE
    l RECORD;
    e RECORD;
    v_admin_id UUID := '00000000-0000-0000-0000-000000000000';
    v_payment_id UUID;
BEGIN
    FOR l IN SELECT * FROM loan_service.loans WHERE branch_id = 3 AND status = 'COMPLETED' LOOP
        FOR e IN SELECT * FROM loan_service.emi_schedules WHERE loan_id = l.loan_id AND status = 'PENDING' ORDER BY due_date ASC LOOP
            v_payment_id := gen_random_uuid();
            
            INSERT INTO loan_service.loan_repayments 
            (id, loan_id, payment_date, principal_portion, interest_portion, penalty_paid, total_paid, payment_method, processed_by, payment_branch_id, tenant_id, reference)
            VALUES (
                v_payment_id,
                l.loan_id,
                e.due_date,
                e.principal_component,
                e.interest_component,
                0,
                e.emi_amount,
                'CASH',
                v_admin_id,
                3,
                1,
                'Final Payment for Installment ' || e.installment_number
            );

            UPDATE loan_service.emi_schedules 
            SET status = 'PAID' 
            WHERE schedule_id = e.schedule_id;
            
        END LOOP;
    END LOOP;
END $$;
