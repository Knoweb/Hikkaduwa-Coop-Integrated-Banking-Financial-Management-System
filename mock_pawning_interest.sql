-- ================================================================
-- INSERT MOCK PAWNING RECORDS FOR INTEREST CALCULATION PROOF
-- ================================================================

DO $$
DECLARE
  t1_id UUID := gen_random_uuid();
  t2_id UUID := gen_random_uuid();
  m1_id UUID := 'd13b3618-0e1a-49d7-b188-bd35e9332241'; -- L. Madushan
  m2_id UUID := '075d313f-c26b-43dd-955d-7bcefaca589d'; -- P. Chathuranga
  v_id UUID := '00000000-0000-0000-0000-000000000000';
  t1_issue DATE := CURRENT_DATE - 7;
  t2_issue DATE := CURRENT_DATE - 17;
  
  -- Calculate expected interest based on the 15-day block rule
  -- Rate: 12% annual. Advance: 100,000.
  -- Ticket 1 (7 days) -> charged for 15 days
  p1_interest NUMERIC(15,2) := ROUND(100000.00 * 15 * 0.12 / 365.0, 2); 
  
  -- Ticket 2 (17 days) -> charged for 30 days
  p2_interest NUMERIC(15,2) := ROUND(100000.00 * 30 * 0.12 / 365.0, 2);
BEGIN
  
  -- Remove them if they already exist (just in case this script is run twice)
  DELETE FROM pawning_service.pawn_payments WHERE ticket_id IN (SELECT ticket_id FROM pawning_service.pawn_tickets WHERE ticket_number IN ('PW1007771', 'PW1007772'));
  DELETE FROM pawning_service.pawn_tickets WHERE ticket_number IN ('PW1007771', 'PW1007772');

  -- Insert Pawn Ticket 1 (7 days old) -> REDEEMED
  INSERT INTO pawning_service.pawn_tickets (
    ticket_id, ticket_number, member_id, gross_weight_grams, net_weight_grams,
    purity_karat, assessed_value, advance_amount, interest_rate, branch_id,
    valuer_id, issue_date, expiry_date, status, article_description, tenant_id,
    carried_over_interest, remaining_advance, last_payment_date
  ) VALUES (
    t1_id, 'PW1007771', m1_id, 10.00, 9.50, 22, 120000.00, 100000.00, 12.00, 1,
    v_id, t1_issue, t1_issue + INTERVAL '1 year', 'REDEEMED', 'Gold Chain (7 Days Redeemed Mock)', 1,
    0.00, 0.00, CURRENT_DATE
  );

  -- Payment for Ticket 1
  INSERT INTO pawning_service.pawn_payments (
    payment_id, interest_portion, payment_amount, payment_date, principal_portion,
    receipt_number, tenant_id, ticket_id
  ) VALUES (
    gen_random_uuid(), p1_interest, 100000.00 + p1_interest, CURRENT_TIMESTAMP, 100000.00,
    'RCP-7DAYS', 1, t1_id
  );

  -- Insert Pawn Ticket 2 (17 days old) -> REDEEMED
  INSERT INTO pawning_service.pawn_tickets (
    ticket_id, ticket_number, member_id, gross_weight_grams, net_weight_grams,
    purity_karat, assessed_value, advance_amount, interest_rate, branch_id,
    valuer_id, issue_date, expiry_date, status, article_description, tenant_id,
    carried_over_interest, remaining_advance, last_payment_date
  ) VALUES (
    t2_id, 'PW1007772', m2_id, 10.00, 9.50, 22, 120000.00, 100000.00, 12.00, 1,
    v_id, t2_issue, t2_issue + INTERVAL '1 year', 'REDEEMED', 'Gold Chain (17 Days Redeemed Mock)', 1,
    0.00, 0.00, CURRENT_DATE
  );

  -- Payment for Ticket 2
  INSERT INTO pawning_service.pawn_payments (
    payment_id, interest_portion, payment_amount, payment_date, principal_portion,
    receipt_number, tenant_id, ticket_id
  ) VALUES (
    gen_random_uuid(), p2_interest, 100000.00 + p2_interest, CURRENT_TIMESTAMP, 100000.00,
    'RCP-17DAYS', 1, t2_id
  );
  
  RAISE NOTICE 'Mock pawns redeemed successfully for interest calculation testing.';
END $$;

-- VERIFY
SELECT 
  t.ticket_number, 
  m.full_name, 
  t.issue_date, 
  p.payment_date::date AS redemption_date,
  (p.payment_date::date - t.issue_date) AS actual_days,
  t.advance_amount AS principal,
  p.interest_portion AS interest_paid,
  p.payment_amount AS total_paid
FROM pawning_service.pawn_tickets t
JOIN member_service.members m ON m.member_id = t.member_id
JOIN pawning_service.pawn_payments p ON p.ticket_id = t.ticket_id
WHERE t.ticket_number IN ('PW1007771', 'PW1007772')
ORDER BY actual_days;
