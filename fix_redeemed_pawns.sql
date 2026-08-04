DO $$ 
DECLARE
    t RECORD;
    v_payment_id UUID;
BEGIN
    FOR t IN SELECT * FROM pawning_service.pawn_tickets WHERE status = 'REDEEMED' LOOP
        
        IF COALESCE(t.remaining_advance, t.advance_amount) > 0 THEN
            v_payment_id := gen_random_uuid();
            
            -- Insert a payment to cover the remaining advance
            INSERT INTO pawning_service.pawn_payments (
                payment_id,
                ticket_id,
                payment_date,
                payment_amount,
                principal_portion,
                interest_portion,
                receipt_number,
                tenant_id
            ) VALUES (
                v_payment_id,
                t.ticket_id,
                COALESCE(t.expiry_date, CURRENT_DATE) - INTERVAL '5 days',
                COALESCE(t.remaining_advance, t.advance_amount) + 5000, -- Add 5000 as fake interest
                COALESCE(t.remaining_advance, t.advance_amount),
                5000,
                'RCPT-PW-' || substring(t.ticket_number from 3),
                t.tenant_id
            );

            -- Update the ticket's remaining advance to 0
            UPDATE pawning_service.pawn_tickets 
            SET remaining_advance = 0,
                last_payment_date = COALESCE(t.expiry_date, CURRENT_DATE) - INTERVAL '5 days'
            WHERE ticket_id = t.ticket_id;
        END IF;

    END LOOP;
END $$;
