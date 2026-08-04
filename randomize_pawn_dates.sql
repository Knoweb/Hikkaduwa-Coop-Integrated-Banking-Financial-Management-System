DO $$ 
DECLARE
    t RECORD;
    p RECORD;
    v_last_date DATE;
    v_random_days INTEGER;
BEGIN
    FOR t IN SELECT * FROM pawning_service.pawn_tickets WHERE status = 'ACTIVE' LOOP
        
        v_last_date := COALESCE(t.issue_date, CURRENT_DATE - INTERVAL '1 year');
        
        -- Loop through payments for this ticket, ordered by payment_date
        FOR p IN SELECT * FROM pawning_service.pawn_payments WHERE ticket_id = t.ticket_id ORDER BY payment_date ASC LOOP
            
            -- Generate a random number of days between 25 and 55 days
            v_random_days := floor(random() * 30) + 25; 
            
            v_last_date := v_last_date + (v_random_days || ' days')::INTERVAL;
            
            -- Update the payment date to the new random date
            UPDATE pawning_service.pawn_payments 
            SET payment_date = v_last_date
            WHERE payment_id = p.payment_id;
            
        END LOOP;

        -- Update the last_payment_date on the ticket itself
        UPDATE pawning_service.pawn_tickets 
        SET last_payment_date = v_last_date
        WHERE ticket_id = t.ticket_id AND EXISTS (SELECT 1 FROM pawning_service.pawn_payments WHERE ticket_id = t.ticket_id);

    END LOOP;
END $$;
