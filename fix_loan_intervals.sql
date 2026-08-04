DO $$ 
DECLARE
    l RECORD;
    e RECORD;
    v_base_date DATE;
    v_due_date DATE;
    v_pay_date TIMESTAMP;
    v_days_delay INTEGER;
    v_payment_id UUID;
    v_admin_id UUID := '00000000-0000-0000-0000-000000000000';
    v_inst_count INTEGER;
    v_max_pay INTEGER;
BEGIN
    -- 1. Delete all existing payments for Rathgama loans to start fresh
    DELETE FROM loan_service.loan_repayments 
    WHERE loan_id IN (SELECT loan_id FROM loan_service.loans WHERE branch_id = 3);

    -- 2. Reset all schedules to PENDING
    UPDATE loan_service.emi_schedules 
    SET status = 'PENDING'
    WHERE loan_id IN (SELECT loan_id FROM loan_service.loans WHERE branch_id = 3);

    -- 3. Fix emi_schedules due dates
    FOR l IN SELECT loan_id, COALESCE(applied_date, '2024-01-01'::date) AS start_date FROM loan_service.loans WHERE branch_id = 3 LOOP
        FOR e IN SELECT schedule_id, installment_number FROM loan_service.emi_schedules WHERE loan_id = l.loan_id ORDER BY installment_number LOOP
            v_due_date := l.start_date + (e.installment_number * INTERVAL '1 month');
            UPDATE loan_service.emi_schedules 
            SET due_date = v_due_date 
            WHERE schedule_id = e.schedule_id;
        END LOOP;
    END LOOP;

    -- 4. Re-insert payments with proper intervals
    FOR l IN SELECT * FROM loan_service.loans WHERE branch_id = 3 LOOP
        v_inst_count := 0;
        
        IF l.status = 'COMPLETED' THEN
            v_max_pay := 9999; -- Pay all
        ELSE
            v_max_pay := 3; -- Pay only first 3 for ACTIVE
        END IF;

        FOR e IN SELECT * FROM loan_service.emi_schedules WHERE loan_id = l.loan_id ORDER BY installment_number LOOP
            IF v_inst_count >= v_max_pay THEN
                EXIT;
            END IF;

            -- Calculate delay to make intervals irregular
            -- e.g. 1st: 0 days late (1 month gap)
            -- 2nd: 20 days late (1 month + 20 days gap)
            -- 3rd: 50 days late (Wait, if due date is 3rd month, and paid 50 days late, it's paid in 5th month!)
            v_days_delay := CASE (e.installment_number % 5)
                WHEN 1 THEN 0
                WHEN 2 THEN 20
                WHEN 3 THEN 50
                WHEN 4 THEN 10
                WHEN 0 THEN 35
            END;

            v_pay_date := (e.due_date + (v_days_delay * INTERVAL '1 day'))::TIMESTAMP + INTERVAL '10 hours' + (e.installment_number * INTERVAL '15 minutes');
            v_payment_id := gen_random_uuid();

            INSERT INTO loan_service.loan_repayments 
            (id, loan_id, payment_date, principal_portion, interest_portion, penalty_paid, total_paid, payment_method, processed_by, payment_branch_id, tenant_id, reference)
            VALUES (
                v_payment_id,
                l.loan_id,
                v_pay_date,
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

            v_inst_count := v_inst_count + 1;
        END LOOP;
        
        -- Special fix for COMPLETED loans: ensure zero balance remaining visually
        IF l.status = 'COMPLETED' THEN
            UPDATE loan_service.loans SET approved_amount = (SELECT SUM(principal_component) FROM loan_service.emi_schedules WHERE loan_id = l.loan_id) WHERE loan_id = l.loan_id;
        END IF;
    END LOOP;
END $$;
