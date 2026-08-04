-- ================================================================
-- 1. FIX DATES FOR ACTIVE LOANS
-- Give them realistic past dates so they are currently ongoing
-- ================================================================

-- Randomize disbursement date based on term_months so they are partially through their term
UPDATE loan_service.loans
SET disbursement_date = CURRENT_TIMESTAMP 
                        - (floor(random() * (term_months - 1) + 1) || ' months')::interval 
                        - (floor(random() * 28) || ' days')::interval
WHERE tenant_id = 1 AND branch_id = 1 AND status = 'ACTIVE';

-- Set applied date to 5 days before disbursement
UPDATE loan_service.loans
SET applied_date = (disbursement_date - INTERVAL '5 days')::date
WHERE tenant_id = 1 AND branch_id = 1 AND status = 'ACTIVE';

-- ================================================================
-- 2. CLEAR WRONG SCHEDULES
-- ================================================================
DELETE FROM loan_service.loan_schedules
WHERE loan_id IN (
    SELECT loan_id FROM loan_service.loans
    WHERE tenant_id = 1 AND branch_id = 1 AND status = 'ACTIVE'
);

-- ================================================================
-- 3. REGENERATE SCHEDULES
-- ================================================================
DO $$
DECLARE
  l RECORD;
  i INTEGER;
  monthly_p NUMERIC(15,2);
  last_p    NUMERIC(15,2);
  this_p    NUMERIC(15,2);
  outstanding_before NUMERIC(15,2);
  outstanding_after  NUMERIC(15,2);
  interest   NUMERIC(15,2);
  due_date   DATE;
  days_count INTEGER := 30;
  inst_status VARCHAR(10);
  today DATE := CURRENT_DATE;
BEGIN
  FOR l IN
    SELECT lo.loan_id,
           lo.requested_amount,
           lo.term_months,
           lo.interest_rate,
           lo.disbursement_date::date AS disb_date
    FROM loan_service.loans lo
    WHERE lo.tenant_id = 1
      AND lo.branch_id = 1
      AND lo.status = 'ACTIVE'
  LOOP
    -- monthly principal (with last-installment rounding adjustment)
    monthly_p := ROUND(l.requested_amount / l.term_months, 2);
    last_p    := l.requested_amount - (l.term_months - 1) * monthly_p;

    FOR i IN 1..l.term_months LOOP
      -- Due date is EXACTLY i months after disbursement
      due_date := (l.disb_date + (i || ' months')::interval)::date;

      -- Principal for this installment
      IF i = l.term_months THEN
        this_p := last_p;
      ELSE
        this_p := monthly_p;
      END IF;

      -- Outstanding balance BEFORE this payment
      outstanding_before := l.requested_amount - (i - 1) * monthly_p;

      -- Interest: declining balance, ~30 days
      interest := ROUND(outstanding_before * (l.interest_rate / 100.0 / 365.0) * days_count, 2);

      -- Outstanding AFTER this payment
      outstanding_after := l.requested_amount - i * monthly_p;
      IF i = l.term_months THEN outstanding_after := 0.00; END IF;

      -- Status based on TODAY
      IF due_date < today THEN
        inst_status := 'OVERDUE';
      ELSE
        inst_status := 'PENDING';
      END IF;

      INSERT INTO loan_service.loan_schedules
        (id, due_date, expected_interest, expected_principal,
         installment_number, loan_id, status,
         total_expected_amount, outstanding_balance, tenant_id)
      VALUES
        (gen_random_uuid(), due_date, interest, this_p,
         i, l.loan_id, inst_status,
         this_p + interest, outstanding_after, 1);
    END LOOP;
  END LOOP;
END $$;

-- ================================================================
-- VERIFY
-- ================================================================
SELECT
  m.full_name,
  l.term_months,
  l.disbursement_date::date AS disb_date,
  MIN(ls.due_date) AS first_due,
  MAX(ls.due_date) AS last_due,
  SUM(CASE WHEN ls.status='OVERDUE' THEN 1 ELSE 0 END) AS overdue_count,
  SUM(CASE WHEN ls.status='PENDING' THEN 1 ELSE 0 END) AS pending_count
FROM loan_service.loans l
JOIN member_service.members m ON m.member_id = l.member_id
JOIN loan_service.loan_schedules ls ON ls.loan_id = l.loan_id
WHERE l.tenant_id = 1 AND l.branch_id = 1 AND l.status = 'ACTIVE'
GROUP BY m.full_name, l.term_months, l.disbursement_date
ORDER BY disb_date DESC;
