DO $$
DECLARE
    rec RECORD;
    v_loan_amounts NUMERIC[] := ARRAY[25000, 50000, 75000, 100000, 200000, 300000, 500000];
    v_new_amount NUMERIC;
    
    -- EMI recalculation vars
    v_outstanding NUMERIC;
    v_principal_portion NUMERIC;
    v_interest_portion NUMERIC;
    v_emi_amount NUMERIC;
    
    s_rec RECORD;
BEGIN
    FOR rec IN (SELECT loan_id, term_months FROM loan_service.loans WHERE branch_id = 3) LOOP
        -- Select a random standard amount
        v_new_amount := v_loan_amounts[floor(random() * 7 + 1)::int];
        
        -- Update the main loan record
        UPDATE loan_service.loans 
        SET requested_amount = v_new_amount,
            approved_amount = v_new_amount,
            disbursed_amount = v_new_amount
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
                -- Update the corresponding repayment record (simplification: just update based on loan_id, this assumes 1 repayment per schedule)
                -- Actually, we can just delete the old repayments for this loan and insert a new one if it's PAID? 
                -- Or just update all repayments for this loan proportionally?
                -- Better to just UPDATE the repayments since there is 1 repayment per PAID schedule.
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
