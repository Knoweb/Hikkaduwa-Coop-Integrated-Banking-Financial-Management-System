DO $$ 
DECLARE
    t RECORD;
    v_payment_id UUID;
    v_payment_amount NUMERIC(15,2);
    v_principal_portion NUMERIC(15,2);
    v_interest_portion NUMERIC(15,2);
    v_pay_date DATE;
    i INTEGER;
BEGIN
    FOR t IN SELECT * FROM pawning_service.pawn_tickets WHERE status = 'ACTIVE' LOOP
        
        -- Add 2 payments for each ACTIVE ticket, if it has a balance
        FOR i IN 1..2 LOOP
            IF COALESCE(t.remaining_advance, t.advance_amount) > 20000 THEN
                v_payment_id := gen_random_uuid();
                
                -- Fake payment around 10,000 to 20,000
                v_payment_amount := 15000 + (random() * 5000);
                v_interest_portion := 2000 + (random() * 1000);
                v_principal_portion := v_payment_amount - v_interest_portion;
                
                -- Payment date based on issue date
                v_pay_date := COALESCE(t.issue_date, CURRENT_DATE - INTERVAL '1 year') + (i * INTERVAL '1 month');

                -- Ensure we don't pay more than the remaining principal
                IF v_principal_portion > COALESCE(t.remaining_advance, t.advance_amount) THEN
                    v_principal_portion := COALESCE(t.remaining_advance, t.advance_amount);
                    v_payment_amount := v_principal_portion + v_interest_portion;
                END IF;

                -- Insert the payment
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
                    v_pay_date,
                    v_payment_amount,
                    v_principal_portion,
                    v_interest_portion,
                    'RCPT-PW-A-' || i || '-' || substring(t.ticket_number from 3),
                    t.tenant_id
                );

                -- Update the ticket's remaining advance
                UPDATE pawning_service.pawn_tickets 
                SET remaining_advance = COALESCE(remaining_advance, advance_amount) - v_principal_portion,
                    last_payment_date = v_pay_date
                WHERE ticket_id = t.ticket_id;
                
                -- Refresh t record for the next iteration to have updated remaining_advance
                SELECT * INTO t FROM pawning_service.pawn_tickets WHERE ticket_id = t.ticket_id;
            END IF;
        END LOOP;

    END LOOP;
END $$;
