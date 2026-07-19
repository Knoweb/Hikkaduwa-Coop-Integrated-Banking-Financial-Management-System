DO $$
DECLARE
    rec RECORD;
    v_fd_id UUID;
    v_type_id UUID;
    v_created_at TIMESTAMP;
    v_amount NUMERIC;
    v_term INT;
BEGIN
    -- Get an active FD type
    SELECT id, term_months INTO v_type_id, v_term FROM account_service.fixed_deposit_types WHERE is_active = true LIMIT 1;
    
    -- Fallback term if none found
    IF v_term IS NULL THEN
        v_term := 12;
    END IF;

    -- Create 10 FDs for Random Members in Rathgama (Branch 3)
    FOR rec IN (SELECT member_id, created_at FROM member_service.members WHERE registered_branch_id = 3 ORDER BY random() LIMIT 10) LOOP
        v_fd_id := gen_random_uuid();
        v_amount := floor(random() * 900000 + 100000); -- 1 Lakh to 10 Lakhs
        v_created_at := CURRENT_DATE - (floor(random() * 300 + 30)::int || ' days')::interval; -- Opened 1-11 months ago
        
        INSERT INTO account_service.fixed_deposits (
            fd_id, member_id, type_id, principal_amount, interest_rate, term_months, 
            maturity_date, status, fd_number, maturity_instruction, branch_id, 
            opened_date, created_at, tenant_id, accumulated_interest
        ) VALUES (
            v_fd_id, rec.member_id, v_type_id, v_amount, 15.0, v_term,
            (v_created_at + (v_term || ' months')::interval)::date, 'ACTIVE', 
            'FD300' || floor(random()*9999)::text, 'RENEW_PRINCIPAL_AND_INTEREST', 
            3, v_created_at::date, v_created_at, 1, (v_amount * 0.15 * ((CURRENT_DATE - v_created_at::date)/365.0))
        );
    END LOOP;
END $$;
