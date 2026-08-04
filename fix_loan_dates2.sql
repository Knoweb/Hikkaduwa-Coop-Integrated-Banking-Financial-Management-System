DO $$ 
DECLARE
    l RECORD;
    e RECORD;
    r RECORD;
    v_base_date DATE;
    v_due_date DATE;
    v_pay_date TIMESTAMP;
    v_days_delay INTEGER;
BEGIN
    -- 1. Fix emi_schedules due dates
    FOR l IN SELECT loan_id, COALESCE(applied_date, '2024-01-01'::date) AS start_date FROM loan_service.loans LOOP
        FOR e IN SELECT schedule_id, installment_number FROM loan_service.emi_schedules WHERE loan_id = l.loan_id ORDER BY installment_number LOOP
            v_due_date := l.start_date + (e.installment_number * INTERVAL '1 month');
            
            UPDATE loan_service.emi_schedules 
            SET due_date = v_due_date 
            WHERE schedule_id = e.schedule_id;
        END LOOP;
    END LOOP;

    -- 2. Fix loan_repayments payment dates
    FOR r IN SELECT id, loan_id, reference FROM loan_service.loan_repayments LOOP
        -- Extract installment number from reference (e.g. 'Payment for Installment 2' or 'Final Payment for Installment 2')
        -- Use regex to get the number
        DECLARE
            v_inst_num_text TEXT;
            v_inst_num INTEGER;
        BEGIN
            v_inst_num_text := substring(r.reference from '[0-9]+$');
            IF v_inst_num_text IS NOT NULL THEN
                v_inst_num := v_inst_num_text::INTEGER;
                
                -- Find the corrected due date
                SELECT due_date INTO v_due_date FROM loan_service.emi_schedules WHERE loan_id = r.loan_id AND installment_number = v_inst_num LIMIT 1;
                
                IF v_due_date IS NOT NULL THEN
                    -- Add some pseudo-random delay based on installment number
                    -- 1st inst: 2 days late
                    -- 2nd inst: 15 days late (1.5 months gap)
                    -- 3rd inst: 4 days late
                    -- 4th inst: 1 day late
                    -- 5th inst: 20 days late
                    v_days_delay := CASE (v_inst_num % 5)
                        WHEN 1 THEN 2
                        WHEN 2 THEN 15
                        WHEN 3 THEN 4
                        WHEN 4 THEN 1
                        WHEN 0 THEN 20
                    END;
                    
                    v_pay_date := (v_due_date + (v_days_delay * INTERVAL '1 day'))::TIMESTAMP + INTERVAL '10 hours' + (v_inst_num * INTERVAL '15 minutes');
                    
                    UPDATE loan_service.loan_repayments 
                    SET payment_date = v_pay_date 
                    WHERE id = r.id;
                END IF;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore parse errors
        END;
    END LOOP;
END $$;
