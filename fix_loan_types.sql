DO $$
DECLARE
    rec RECORD;
    v_types VARCHAR[] := ARRAY['කෙටි ණය', 'සේවක ණය', 'ක්ෂණික ණය'];
    v_selected_name VARCHAR;
    v_type_id UUID;
    v_new_amount NUMERIC;
    
    -- EMI recalculation vars
    v_outstanding NUMERIC;
    v_principal_portion NUMERIC;
    v_interest_portion NUMERIC;
    v_emi_amount NUMERIC;
    
    s_rec RECORD;
BEGIN
    FOR rec IN (SELECT loan_id, term_months FROM loan_service.loans WHERE branch_id = 3 AND tenant_id = 1) LOOP
        -- Select a random loan type name
        v_selected_name := v_types[floor(random() * 3 + 1)::int];
        
        -- Get a valid ID for THIS tenant (tenant 1)
        SELECT loan_type_id INTO v_type_id FROM loan_service.loan_types WHERE name = v_selected_name AND tenant_id = 1 LIMIT 1;
        
        -- Set appropriate amount based on type
        IF v_selected_name = 'ක්ෂණික ණය' THEN
            -- Max 50k
            v_new_amount := (ARRAY[25000, 50000])[floor(random() * 2 + 1)::int];
        ELSIF v_selected_name = 'කෙටි ණය' THEN
            -- Max 100k
            v_new_amount := (ARRAY[50000, 75000, 100000])[floor(random() * 3 + 1)::int];
        ELSE
            -- සේවක ණය Max 300k
            v_new_amount := (ARRAY[100000, 200000, 300000])[floor(random() * 3 + 1)::int];
        END IF;

        -- Update the main loan record
        UPDATE loan_service.loans 
        SET requested_amount = v_new_amount,
            approved_amount = v_new_amount,
            disbursed_amount = v_new_amount,
            loan_type_id = v_type_id,
            loan_type = v_selected_name
        WHERE loan_id = rec.loan_id;
        
        -- Recalculate components
        v_outstanding := v_new_amount;
        v_principal_portion := v_new_amount / rec.term_months;
        v_interest_portion := v_new_amount * 0.01; -- 1% flat monthly approx
        v_emi_amount := v_principal_portion + v_interest_portion;
        
        -- Update the EMI schedules
        FOR s_rec IN (SELECT schedule_id, status FROM loan_service.emi_schedules WHERE loan_id = rec.loan_id ORDER BY installment_number) LOOP
            
            IF s_rec.status = 'PAID' THEN
                v_outstanding := v_outstanding - v_principal_portion;
            END IF;
            
            UPDATE loan_service.emi_schedules 
            SET emi_amount = v_emi_amount,
                principal_component = v_principal_portion,
                interest_component = v_interest_portion
            WHERE schedule_id = s_rec.schedule_id;
            
        END LOOP;
        
        -- Update all loan repayments for this loan to match the new amounts
        UPDATE loan_service.loan_repayments
        SET principal_portion = v_principal_portion,
            interest_portion = v_interest_portion,
            total_paid = v_emi_amount
        WHERE loan_id = rec.loan_id;
        
    END LOOP;
END $$;
