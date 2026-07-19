DO $$
BEGIN
    -- Fix Pawning Tickets: If they are ACTIVE, issue_date must be within the last 1 year
    -- Or if they are older than 1 year, we can set them to 'OVERDUE' or 'REDEEMED' to show history
    
    -- Let's make half of the pawning tickets active (issued within last year)
    UPDATE pawning_service.pawn_tickets 
    SET issue_date = CURRENT_DATE - (floor(random() * 300)::int || ' days')::interval,
        expiry_date = CURRENT_DATE - (floor(random() * 300)::int || ' days')::interval + INTERVAL '1 year'
    WHERE branch_id = 3 AND ctid IN (
        SELECT ctid FROM pawning_service.pawn_tickets WHERE branch_id = 3 ORDER BY random() LIMIT 5
    );

    -- Let's make the other half 'REDEEMED' (History) - Issued 1-3 years ago
    UPDATE pawning_service.pawn_tickets 
    SET issue_date = CURRENT_DATE - (floor(random() * 700 + 365)::int || ' days')::interval,
        expiry_date = CURRENT_DATE - (floor(random() * 700 + 365)::int || ' days')::interval + INTERVAL '1 year',
        status = 'REDEEMED'
    WHERE branch_id = 3 AND status = 'ACTIVE';
    
    -- Ensure all active ones have expiry date correctly set to 1 year from issue
    UPDATE pawning_service.pawn_tickets 
    SET expiry_date = issue_date + INTERVAL '1 year'
    WHERE branch_id = 3;

END $$;
