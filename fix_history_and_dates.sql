DO $$ 
DECLARE
    l RECORD;
    v_disbursement_date DATE;
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
    -- 1. Ensure disbursement_date is set and insert approval history
    FOR l IN SELECT * FROM loan_service.loans LOOP
        -- Set disbursement date if not set (for stages that are past approval)
        IF l.status IN ('ACTIVE', 'COMPLETED') OR l.current_stage = 'DISBURSED' THEN
            v_disbursement_date := COALESCE(l.disbursement_date, l.applied_date + INTERVAL '5 days', '2024-01-06'::date);
            UPDATE loan_service.loans SET disbursement_date = v_disbursement_date WHERE loan_id = l.loan_id;
        ELSE
            v_disbursement_date := NULL;
        END IF;

        -- Clear existing history for this loan to avoid duplicates
        DELETE FROM loan_service.loan_approval_actions WHERE loan_id = l.loan_id;

        -- Insert SUBMITTED action
        INSERT INTO loan_service.loan_approval_actions (action_id, loan_id, action, stage, actor_role, actor_username, comments, created_at, tenant_id)
        VALUES (gen_random_uuid(), l.loan_id, 'SUBMIT', 'APPLICATION', 'SYSTEM', 'system', 'Loan application submitted successfully.', COALESCE(l.applied_date::timestamp, '2024-01-01 10:00:00'), l.tenant_id);

        IF l.status IN ('APPROVED', 'ACTIVE', 'COMPLETED') OR l.current_stage IN ('APPROVED', 'DISBURSED') THEN
            -- Insert APPROVED action
            INSERT INTO loan_service.loan_approval_actions (action_id, loan_id, action, stage, actor_role, actor_username, comments, created_at, tenant_id)
            VALUES (gen_random_uuid(), l.loan_id, 'APPROVE', 'MANAGER_APPROVAL', 'MANAGER', 'manager', 'Loan approved after review.', COALESCE(l.applied_date::timestamp + INTERVAL '3 days', '2024-01-04 10:00:00'), l.tenant_id);
        END IF;

        IF v_disbursement_date IS NOT NULL THEN
            -- Insert DISBURSED action
            INSERT INTO loan_service.loan_approval_actions (action_id, loan_id, action, stage, actor_role, actor_username, comments, created_at, tenant_id)
            VALUES (gen_random_uuid(), l.loan_id, 'DISBURSE', 'DISBURSEMENT', 'CASHIER', 'cashier', 'Loan amount disbursed to member.', COALESCE(v_disbursement_date::timestamp + INTERVAL '10 hours', '2024-01-06 10:00:00'), l.tenant_id);
        END IF;

        -- 2. Recalculate schedules using DISBURSEMENT DATE
        IF (l.status IN ('ACTIVE', 'COMPLETED') OR l.current_stage = 'DISBURSED') AND l.approved_amount > 0 THEN
            r_monthly := (l.interest_rate / 100.0) / 12.0;
            
            IF r_monthly > 0 THEN
                v_emi_amount := ROUND((l.approved_amount * r_monthly * POWER(1 + r_monthly, l.term_months)) / (POWER(1 + r_monthly, l.term_months) - 1), 2);
            ELSE
                v_emi_amount := ROUND(l.approved_amount / l.term_months, 2);
            END IF;

            v_outstanding := l.approved_amount;
            
            SELECT COUNT(*) INTO v_paid_count FROM loan_service.loan_repayments WHERE loan_id = l.loan_id;

            DELETE FROM loan_service.loan_schedules WHERE loan_id = l.loan_id;
            DELETE FROM loan_service.emi_schedules WHERE loan_id = l.loan_id;

            FOR i IN 1..l.term_months LOOP
                v_due_date := v_disbursement_date + (i * INTERVAL '1 month');
                v_interest_comp := ROUND(v_outstanding * r_monthly, 2);
                v_principal_comp := v_emi_amount - v_interest_comp;

                IF i = l.term_months THEN
                    v_principal_comp := v_outstanding;
                    v_emi_amount := v_principal_comp + v_interest_comp;
                END IF;

                v_outstanding := v_outstanding - v_principal_comp;
                IF v_outstanding < 0 THEN v_outstanding := 0; END IF;

                -- Insert to emi_schedules
                INSERT INTO loan_service.emi_schedules 
                (loan_id, installment_number, due_date, emi_amount, principal_component, interest_component, status, tenant_id)
                VALUES (l.loan_id, i, v_due_date, v_emi_amount, v_principal_comp, v_interest_comp, CASE WHEN i <= v_paid_count THEN 'PAID' ELSE 'PENDING' END, l.tenant_id);

                -- Insert to loan_schedules
                INSERT INTO loan_service.loan_schedules (
                    id, loan_id, installment_number, due_date, total_expected_amount, expected_principal, expected_interest, outstanding_balance, status, tenant_id
                ) VALUES (
                    gen_random_uuid(), l.loan_id, i, v_due_date, v_emi_amount, v_principal_comp, v_interest_comp, v_outstanding,
                    CASE WHEN i <= v_paid_count THEN 'PAID' ELSE 'PENDING' END, l.tenant_id
                );
            END LOOP;
        END IF;
    END LOOP;
END $$;
