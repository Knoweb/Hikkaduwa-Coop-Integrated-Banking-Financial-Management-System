-- ================================================================
-- CLEANUP AND ADD MOCK REPAYMENTS FOR ACTIVE LOANS
-- ================================================================

-- 1. Cleanup all existing junk payments for active loans
DELETE FROM loan_service.loan_repayments
WHERE loan_id IN (
    SELECT loan_id FROM loan_service.loans WHERE tenant_id = 1 AND branch_id = 1 AND status = 'ACTIVE'
);

-- 2. Reset schedule statuses based on due date
UPDATE loan_service.loan_schedules
SET status = CASE WHEN due_date < CURRENT_DATE THEN 'OVERDUE' ELSE 'PENDING' END
WHERE loan_id IN (
    SELECT loan_id FROM loan_service.loans WHERE tenant_id = 1 AND branch_id = 1 AND status = 'ACTIVE'
);

-- 3. Insert fresh mock payments
DO $$
DECLARE
  l RECORD;
  s RECORD;
  pay_date TIMESTAMP;
  pay_method VARCHAR;
  methods VARCHAR[] := ARRAY['CASH', 'SAVINGS_TRANSFER'];
  overdue_count INT;
  pay_count INT;
BEGIN
  FOR l IN
    SELECT loan_id FROM loan_service.loans WHERE tenant_id = 1 AND branch_id = 1 AND status = 'ACTIVE'
  LOOP
    SELECT COUNT(*) INTO overdue_count FROM loan_service.loan_schedules WHERE loan_id = l.loan_id AND status = 'OVERDUE';
    
    -- Pay about 80% of overdue installments, at least 1 (if any are overdue)
    IF overdue_count > 0 THEN
      pay_count := GREATEST(1, floor(overdue_count * 0.8)::int);
      
      FOR s IN
        SELECT id, due_date, expected_principal, expected_interest, installment_number 
        FROM loan_service.loan_schedules 
        WHERE loan_id = l.loan_id AND status = 'OVERDUE'
        ORDER BY installment_number
        LIMIT pay_count
      LOOP
        -- Random payment date: exactly on due date or up to 5 days late
        pay_date := s.due_date + (floor(random() * 5) || ' days')::interval + interval '10 hours';
        pay_method := methods[floor(random() * 2) + 1];

        -- Insert repayment record
        INSERT INTO loan_service.loan_repayments (
          id, interest_portion, loan_id, payment_branch_id, 
          payment_date, payment_method, penalty_paid, principal_portion, 
          processed_by, reference, total_paid, tenant_id
        ) VALUES (
          gen_random_uuid(), s.expected_interest, l.loan_id, 1,
          pay_date, pay_method, 0, s.expected_principal,
          '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-' || lpad(s.installment_number::text, 4, '0'), 
          s.expected_principal + s.expected_interest, 1
        );

        -- Update the schedule status to PAID
        UPDATE loan_service.loan_schedules 
        SET status = 'PAID' 
        WHERE id = s.id;
      END LOOP;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Cleaned up old junk and added correct mock repayments for ACTIVE loans.';
END $$;

-- ================================================================
-- VERIFY
-- ================================================================
SELECT
  m.full_name,
  l.term_months,
  COUNT(r.id) AS payments_made,
  SUM(CASE WHEN ls.status='PAID' THEN 1 ELSE 0 END) AS paid_schedules,
  SUM(CASE WHEN ls.status='OVERDUE' THEN 1 ELSE 0 END) AS overdue_schedules,
  SUM(CASE WHEN ls.status='PENDING' THEN 1 ELSE 0 END) AS pending_schedules
FROM loan_service.loans l
JOIN member_service.members m ON m.member_id = l.member_id
LEFT JOIN loan_service.loan_repayments r ON r.loan_id = l.loan_id
LEFT JOIN loan_service.loan_schedules ls ON ls.loan_id = l.loan_id
WHERE l.tenant_id = 1 AND l.branch_id = 1 AND l.status = 'ACTIVE'
GROUP BY m.full_name, l.term_months, l.loan_id
ORDER BY payments_made DESC;
