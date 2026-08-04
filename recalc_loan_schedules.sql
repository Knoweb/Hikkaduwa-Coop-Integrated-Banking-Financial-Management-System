DO $$ 
DECLARE
    l RECORD;
    r_monthly NUMERIC;
    v_emi_amount NUMERIC(15,2);
    v_outstanding NUMERIC(15,2);
    v_interest_comp NUMERIC(15,2);
    v_principal_comp NUMERIC(15,2);
    v_due_date DATE;
    v_schedule_id INTEGER;
    i INTEGER;
    v_payment_id UUID;
    v_paid_count INTEGER;
BEGIN
    FOR l IN SELECT * FROM loan_service.loans LOOP
        -- Skip if approved amount is null (e.g. pending approval)
        IF l.approved_amount IS NULL OR l.approved_amount <= 0 THEN
            CONTINUE;
        END IF;

        -- Calculate monthly interest rate
        r_monthly := (l.interest_rate / 100.0) / 12.0;
        
        -- Calculate EMI
        IF r_monthly > 0 THEN
            v_emi_amount := ROUND((l.approved_amount * r_monthly * POWER(1 + r_monthly, l.term_months)) / (POWER(1 + r_monthly, l.term_months) - 1), 2);
        ELSE
            v_emi_amount := ROUND(l.approved_amount / l.term_months, 2);
        END IF;

        v_outstanding := l.approved_amount;
        v_paid_count := 0;

        -- Count how many payments exist for this loan to re-apply them
        SELECT COUNT(*) INTO v_paid_count FROM loan_service.loan_repayments WHERE loan_id = l.loan_id;

        -- Delete old repayments and schedules
        DELETE FROM loan_service.loan_repayments WHERE loan_id = l.loan_id;
        DELETE FROM loan_service.emi_schedules WHERE loan_id = l.loan_id;

        -- Generate new schedules
        FOR i IN 1..l.term_months LOOP
            v_due_date := COALESCE(l.applied_date, '2024-01-01'::date) + (i * INTERVAL '1 month');
            v_interest_comp := ROUND(v_outstanding * r_monthly, 2);
            v_principal_comp := v_emi_amount - v_interest_comp;

            -- Adjust last installment for rounding errors
            IF i = l.term_months THEN
                v_principal_comp := v_outstanding;
                v_emi_amount := v_principal_comp + v_interest_comp;
            END IF;

            v_outstanding := v_outstanding - v_principal_comp;

            INSERT INTO loan_service.emi_schedules 
            (loan_id, installment_number, due_date, emi_amount, principal_component, interest_component, status, tenant_id)
            VALUES (
                l.loan_id, i, v_due_date, v_emi_amount, v_principal_comp, v_interest_comp, 
                CASE WHEN i <= v_paid_count THEN 'PAID' ELSE 'PENDING' END,
                l.tenant_id
            ) RETURNING schedule_id INTO v_schedule_id;

            -- Re-insert payments if it was paid
            IF i <= v_paid_count THEN
                v_payment_id := gen_random_uuid();
                INSERT INTO loan_service.loan_repayments 
                (id, loan_id, payment_date, principal_portion, interest_portion, penalty_paid, total_paid, payment_method, processed_by, payment_branch_id, tenant_id, reference)
                VALUES (
                    v_payment_id, l.loan_id, 
                    (v_due_date + ((i % 5) * INTERVAL '3 days'))::TIMESTAMP + INTERVAL '10 hours', -- Pseudo-random payment date
                    v_principal_comp, v_interest_comp, 0, v_emi_amount, 'CASH', '00000000-0000-0000-0000-000000000000', l.branch_id, l.tenant_id,
                    'Payment for Installment ' || i
                );
            END IF;
        END LOOP;
    END LOOP;
END $$;
