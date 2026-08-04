UPDATE loan_service.emi_schedules e
SET due_date = e.due_date + (l.disbursement_date::date - '2025-11-20'::date)
FROM loan_service.loans l
WHERE e.loan_id = l.loan_id
  AND l.branch_id = 4
  AND l.loan_id IN ('0679b70f-7514-482c-90e0-36c363ccb5a8', '4baf647f-218b-40b9-ab07-5d695ed44fb8', '6ca17863-7014-435e-8b94-4076c87dccfc');
