DO $$
DECLARE
    rec RECORD;
    v_loan_id UUID;
    v_loan_type_id UUID;
    v_pawn_id UUID;
    v_past_months INT;
    v_created_at TIMESTAMP;
    v_loan_amount NUMERIC;
    v_loan_months INT;
    
    -- Variables for Pawning
    v_pawn_weight NUMERIC;
    v_assessed_value NUMERIC;
    v_advance_amount NUMERIC;
    v_ticket_num VARCHAR;
BEGIN
    -- Get an active loan type
    SELECT loan_type_id INTO v_loan_type_id FROM loan_service.loan_types LIMIT 1;
    
    -- 1. Create 10 Loans for Random Members in Rathgama (Branch 3)
    FOR rec IN (SELECT member_id, created_at FROM member_service.members WHERE registered_branch_id = 3 ORDER BY random() LIMIT 10) LOOP
        v_loan_id := gen_random_uuid();
        v_loan_amount := floor(random() * 450000 + 50000); -- 50K to 500K
        v_loan_months := 6 + floor(random() * 6)::int; -- 6 to 11 months
        v_created_at := rec.created_at; -- Align with member creation date
        
        INSERT INTO loan_service.loans (
            loan_id, member_id, loan_type_id, requested_amount, approved_amount, interest_rate, term_months, 
            branch_id, current_stage, status, applied_date, created_at, tenant_id, disbursed_amount, account_number, repayment_method
        ) VALUES (
            v_loan_id, rec.member_id, v_loan_type_id, v_loan_amount, v_loan_amount, 12.0, v_loan_months,
            3, 'DISBURSED', 'ACTIVE', v_created_at::date, v_created_at, 1, v_loan_amount, 'LN300' || floor(random()*9999)::text, 'CASH'
        );
        
        -- Insert a dummy EMI schedule to make it show up in the dashboard correctly
        -- The dashboard calculates total outstanding etc based on EMI schedules or ledger.
        INSERT INTO loan_service.emi_schedules (
            installment_number, loan_id, due_date, principal_component, interest_component, emi_amount, status
        ) VALUES (
            1, v_loan_id, (v_created_at + INTERVAL '1 month')::date, v_loan_amount/v_loan_months, (v_loan_amount*0.01), (v_loan_amount/v_loan_months) + (v_loan_amount*0.01), 'PENDING'
        );
    END LOOP;

    -- 2. Create 10 Pawning Tickets for Random Members in Rathgama (Branch 3)
    FOR rec IN (SELECT member_id, created_at FROM member_service.members WHERE registered_branch_id = 3 ORDER BY random() LIMIT 10) LOOP
        v_pawn_id := gen_random_uuid();
        v_pawn_weight := 10 + floor(random() * 10);
        v_assessed_value := v_pawn_weight * 20000;
        v_advance_amount := v_assessed_value * 0.75;
        v_ticket_num := 'PW300' || floor(random() * 9999)::text;
        v_created_at := rec.created_at;
        
        INSERT INTO pawning_service.pawn_tickets (
            ticket_id, ticket_number, member_id, gross_weight_grams, net_weight_grams, purity_karat, 
            assessed_value, advance_amount, interest_rate, branch_id, valuer_id, issue_date, expiry_date, 
            status, tenant_id, remaining_advance, article_description
        ) VALUES (
            v_pawn_id, v_ticket_num, rec.member_id, v_pawn_weight, v_pawn_weight, 22, 
            v_assessed_value, v_advance_amount, 15.0, 3, '53e124df-3012-42dc-b9fc-60d437d8b76b', -- Using senior_rathgama user_id
            v_created_at::date, (v_created_at + INTERVAL '1 year')::date, 
            'ACTIVE', 1, v_advance_amount, 'Gold Chain / Ring'
        );
    END LOOP;

END $$;
