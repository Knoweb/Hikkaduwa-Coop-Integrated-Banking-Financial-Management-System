DO $$ 
DECLARE
    e RECORD;
    v_outstanding NUMERIC(15,2);
BEGIN
    -- Delete all existing loan schedules
    DELETE FROM loan_service.loan_schedules;

    -- Loop through all emi_schedules and populate loan_schedules
    FOR e IN SELECT l.approved_amount, es.* FROM loan_service.emi_schedules es
             JOIN loan_service.loans l ON l.loan_id = es.loan_id
             ORDER BY es.loan_id, es.installment_number 
    LOOP
        -- Calculate outstanding for the row
        -- Outstanding balance at the END of the installment is what the frontend expects usually.
        -- But wait, let's just calculate it.
        IF e.installment_number = 1 THEN
            v_outstanding := e.approved_amount - e.principal_component;
        ELSE
            v_outstanding := v_outstanding - e.principal_component;
        END IF;

        IF v_outstanding < 0 THEN v_outstanding := 0; END IF;

        INSERT INTO loan_service.loan_schedules (
            id, 
            loan_id, 
            installment_number, 
            due_date, 
            total_expected_amount, 
            expected_principal, 
            expected_interest, 
            outstanding_balance, 
            status, 
            tenant_id
        ) VALUES (
            gen_random_uuid(),
            e.loan_id,
            e.installment_number,
            e.due_date,
            e.emi_amount,
            e.principal_component,
            e.interest_component,
            v_outstanding,
            e.status,
            e.tenant_id
        );
    END LOOP;
END $$;
