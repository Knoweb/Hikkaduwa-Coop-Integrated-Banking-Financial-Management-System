DO $$
BEGIN
    -- Fix: Make 7 of the pawning tickets ACTIVE and keep only 3 as REDEEMED.
    
    -- First, set 7 random tickets back to ACTIVE
    UPDATE pawning_service.pawn_tickets
    SET status = 'ACTIVE',
        issue_date = CURRENT_DATE - (floor(random() * 300)::int || ' days')::interval
    WHERE ticket_id IN (
        SELECT ticket_id FROM pawning_service.pawn_tickets WHERE branch_id = 1 LIMIT 7
    );

    -- Ensure expiry date is exactly 1 year from issue date for all active tickets
    UPDATE pawning_service.pawn_tickets
    SET expiry_date = issue_date + INTERVAL '1 year'
    WHERE branch_id = 1 AND status = 'ACTIVE';

END $$;
