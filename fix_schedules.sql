-- ================================================================
-- Generate loan_schedules for ALL Hikkaduwa loans with 0 schedule rows
-- Uses Declining Balance (DB) interest method
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
           lo.disbursement_date::date AS disb_date,
           lo.status
    FROM loan_service.loans lo
    WHERE lo.tenant_id = 1
      AND lo.branch_id = 1
      AND (SELECT COUNT(*) FROM loan_service.loan_schedules ls WHERE ls.loan_id = lo.loan_id) = 0
  LOOP
    -- monthly principal (with last-installment rounding adjustment)
    monthly_p := ROUND(l.requested_amount / l.term_months, 2);
    last_p    := l.requested_amount - (l.term_months - 1) * monthly_p;

    FOR i IN 1..l.term_months LOOP
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

      -- Status
      IF l.status = 'COMPLETED' THEN
        inst_status := 'PAID';
      ELSIF due_date < today THEN
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

  RAISE NOTICE 'Schedule generation complete.';
END $$;

-- ================================================================
-- VERIFY
-- ================================================================
SELECT
  m.full_name,
  l.requested_amount,
  l.term_months,
  l.status,
  COUNT(ls.id)                            AS schedule_rows,
  MIN(ls.due_date)                        AS first_due,
  MAX(ls.due_date)                        AS last_due,
  SUM(CASE WHEN ls.status='PAID'    THEN 1 ELSE 0 END) AS paid,
  SUM(CASE WHEN ls.status='OVERDUE' THEN 1 ELSE 0 END) AS overdue,
  SUM(CASE WHEN ls.status='PENDING' THEN 1 ELSE 0 END) AS pending
FROM loan_service.loans l
JOIN member_service.members m ON m.member_id = l.member_id
JOIN loan_service.loan_schedules ls ON ls.loan_id = l.loan_id
WHERE l.tenant_id = 1 AND l.branch_id = 1
GROUP BY m.full_name, l.requested_amount, l.term_months, l.status, l.loan_id
ORDER BY l.status, m.full_name;
