DO $$
DECLARE
    rec RECORD;
    v_counter INTEGER;
    v_issue DATE;
    v_expiry DATE;
    v_status VARCHAR;
BEGIN
    FOR b_id IN 1..4 LOOP
        v_counter := 0;
        FOR rec IN (SELECT ticket_id FROM pawning_service.pawn_tickets WHERE branch_id = b_id ORDER BY ticket_id) LOOP
            
            -- Distribute the statuses
            IF v_counter % 4 = 0 THEN
                -- ACTIVE (issued 5 months ago)
                v_issue := CURRENT_DATE - INTERVAL '5 months';
                v_expiry := v_issue + INTERVAL '1 year';
                v_status := 'ACTIVE';
            ELSIF v_counter % 4 = 1 THEN
                -- NEARING EXPIRY (issued 11 months and 15 days ago, expires in 15 days)
                v_issue := CURRENT_DATE - INTERVAL '11 months 15 days';
                v_expiry := v_issue + INTERVAL '1 year';
                v_status := 'ACTIVE';
            ELSIF v_counter % 4 = 2 THEN
                -- OVERDUE (issued 14 months ago)
                v_issue := CURRENT_DATE - INTERVAL '14 months';
                v_expiry := v_issue + INTERVAL '1 year';
                v_status := 'OVERDUE';
            ELSE
                -- REDEEMED (issued 18 months ago)
                v_issue := CURRENT_DATE - INTERVAL '18 months';
                v_expiry := v_issue + INTERVAL '1 year';
                v_status := 'REDEEMED';
            END IF;
            
            UPDATE pawning_service.pawn_tickets 
            SET issue_date = v_issue, 
                expiry_date = v_expiry, 
                status = v_status 
            WHERE ticket_id = rec.ticket_id;
            
            v_counter := v_counter + 1;
        END LOOP;
    END LOOP;
END $$;
