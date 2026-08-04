-- 1. For the COMPLETED loans, insert a repayment of the full amount
INSERT INTO loan_service.loan_repayments (
    id, interest_portion, loan_id, payment_branch_id, payment_date, payment_method, penalty_paid, principal_portion, processed_by, reference, total_paid, tenant_id
)
SELECT 
    gen_random_uuid(),
    0,
    loan_id,
    1,
    '2022-02-15 10:00:00',
    'CASH',
    0,
    requested_amount,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'PAID_FULL',
    requested_amount,
    1
FROM loan_service.loans
WHERE tenant_id = 1 AND status = 'COMPLETED';

-- 2. For the ACTIVE loans, insert a repayment of 30% of the loan amount
INSERT INTO loan_service.loan_repayments (
    id, interest_portion, loan_id, payment_branch_id, payment_date, payment_method, penalty_paid, principal_portion, processed_by, reference, total_paid, tenant_id
)
SELECT 
    gen_random_uuid(),
    requested_amount * 0.1, -- Fake interest
    loan_id,
    1,
    '2025-12-15 10:00:00',
    'CASH',
    0,
    requested_amount * 0.3, -- 30% principal paid
    '00000000-0000-0000-0000-000000000000'::uuid,
    'PAID_PARTIAL',
    requested_amount * 0.4,
    1
FROM loan_service.loans
WHERE tenant_id = 1 AND status = 'ACTIVE';
