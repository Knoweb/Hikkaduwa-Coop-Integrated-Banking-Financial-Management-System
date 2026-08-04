-- Fix dates of loans for branch 1
-- The first 5 loans will be marked as COMPLETED in 2022
WITH top5 AS (
    SELECT loan_id FROM loan_service.loans 
    WHERE tenant_id = 1 
    ORDER BY created_at ASC
    LIMIT 5
)
UPDATE loan_service.loans
SET applied_date = '2022-01-15',
    disbursement_date = '2022-01-20 10:00:00',
    status = 'COMPLETED',
    evaluation_status = 'APPROVED'
WHERE loan_id IN (SELECT loan_id FROM top5);

-- Update their EMI schedules to be PAID and in 2022
WITH top5 AS (
    SELECT loan_id FROM loan_service.loans 
    WHERE tenant_id = 1 
    ORDER BY created_at ASC
    LIMIT 5
)
UPDATE loan_service.emi_schedules
SET status = 'PAID',
    due_date = '2022-02-15'
WHERE loan_id IN (SELECT loan_id FROM top5);

-- For the rest of the ACTIVE/PENDING loans, set applied date to 2025/2026
WITH top5 AS (
    SELECT loan_id FROM loan_service.loans 
    WHERE tenant_id = 1 
    ORDER BY created_at ASC
    LIMIT 5
)
UPDATE loan_service.loans
SET applied_date = '2025-11-15',
    disbursement_date = '2025-11-20 10:00:00',
    status = 'ACTIVE',
    evaluation_status = 'APPROVED'
WHERE tenant_id = 1 
  AND loan_id NOT IN (SELECT loan_id FROM top5);

-- For the active ones, mark the first 3 EMIs as PAID
WITH top5 AS (
    SELECT loan_id FROM loan_service.loans 
    WHERE tenant_id = 1 
    ORDER BY created_at ASC
    LIMIT 5
)
UPDATE loan_service.emi_schedules
SET status = 'PAID'
WHERE tenant_id = 1 
  AND loan_id NOT IN (SELECT loan_id FROM top5)
  AND installment_number <= 3;

-- For the active ones, make sure the due_date of EMIs makes sense
WITH top5 AS (
    SELECT loan_id FROM loan_service.loans 
    WHERE tenant_id = 1 
    ORDER BY created_at ASC
    LIMIT 5
)
UPDATE loan_service.emi_schedules
SET due_date = '2025-12-15'::date + ((installment_number - 1) || ' months')::interval
WHERE tenant_id = 1 
  AND loan_id NOT IN (SELECT loan_id FROM top5);

-- Any other rogue applied_date fixing
UPDATE loan_service.loans
SET applied_date = '2026-01-10'
WHERE EXTRACT(YEAR FROM applied_date) < 2022;
