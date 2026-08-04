-- Mock Completed Loans for Seenigama Branch (Branch 4)

-- Loan 1
INSERT INTO loan_service.loans (
    loan_id, member_id, loan_type_id, loan_type, account_number, 
    requested_amount, approved_amount, disbursed_amount, interest_rate, term_months, 
    branch_id, tenant_id, current_stage, status, applied_date, disbursement_date, 
    created_at, updated_at
) VALUES (
    'c0000000-0000-0000-0000-000000000001', '889da549-63bf-4e12-8bd1-33332d3b3545', '7913fb11-31e8-4386-893d-53460eebe451', 'කෘෂිකර්ම ණය', 'LN-COMP-001',
    100000.00, 100000.00, 100000.00, 12.0, 3,
    4, 1, 'COMPLETED', 'COMPLETED', '2023-01-01', '2023-01-10 10:00:00',
    '2023-01-01 10:00:00', '2023-04-10 10:00:00'
);

INSERT INTO loan_service.loan_schedules (id, loan_id, due_date, expected_principal, expected_interest, total_expected_amount, installment_number, status, tenant_id) VALUES
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000001', '2023-02-10', 33333.33, 1000.00, 34333.33, 1, 'PAID', 1),
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000001', '2023-03-10', 33333.33, 666.67, 34000.00, 2, 'PAID', 1),
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000001', '2023-04-10', 33333.34, 333.33, 33666.67, 3, 'PAID', 1);

INSERT INTO loan_service.loan_repayments (id, loan_id, principal_portion, interest_portion, penalty_paid, total_paid, payment_date, payment_branch_id, payment_method, processed_by, tenant_id) VALUES
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000001', 33333.33, 1000.00, 0, 34333.33, '2023-02-09 10:00:00', 4, 'CASH', '59c75e11-b5f5-4ded-b587-d50f47aaee4a', 1),
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000001', 33333.33, 666.67, 0, 34000.00, '2023-03-11 10:00:00', 4, 'CASH', '59c75e11-b5f5-4ded-b587-d50f47aaee4a', 1),
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000001', 33333.34, 333.33, 0, 33666.67, '2023-04-10 10:00:00', 4, 'CASH', '59c75e11-b5f5-4ded-b587-d50f47aaee4a', 1);

-- Loan 2
INSERT INTO loan_service.loans (
    loan_id, member_id, loan_type_id, loan_type, account_number, 
    requested_amount, approved_amount, disbursed_amount, interest_rate, term_months, 
    branch_id, tenant_id, current_stage, status, applied_date, disbursement_date, 
    created_at, updated_at
) VALUES (
    'c0000000-0000-0000-0000-000000000002', '282b8bfd-6ce6-4dcc-ba51-8ec22c2921be', '7913fb11-31e8-4386-893d-53460eebe451', 'නිවාස ණය', 'LN-COMP-002',
    500000.00, 500000.00, 500000.00, 10.0, 4,
    4, 1, 'COMPLETED', 'COMPLETED', '2022-05-01', '2022-05-15 11:30:00',
    '2022-05-01 10:00:00', '2022-09-15 10:00:00'
);

INSERT INTO loan_service.loan_schedules (id, loan_id, due_date, expected_principal, expected_interest, total_expected_amount, installment_number, status, tenant_id) VALUES
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000002', '2022-06-15', 125000.00, 4166.67, 129166.67, 1, 'PAID', 1),
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000002', '2022-07-15', 125000.00, 3125.00, 128125.00, 2, 'PAID', 1),
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000002', '2022-08-15', 125000.00, 2083.33, 127083.33, 3, 'PAID', 1),
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000002', '2022-09-15', 125000.00, 1041.67, 126041.67, 4, 'PAID', 1);

INSERT INTO loan_service.loan_repayments (id, loan_id, principal_portion, interest_portion, penalty_paid, total_paid, payment_date, payment_branch_id, payment_method, processed_by, tenant_id) VALUES
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000002', 125000.00, 4166.67, 0, 129166.67, '2022-06-14 10:00:00', 4, 'TRANSFER', '59c75e11-b5f5-4ded-b587-d50f47aaee4a', 1),
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000002', 125000.00, 3125.00, 0, 128125.00, '2022-07-15 10:00:00', 4, 'TRANSFER', '59c75e11-b5f5-4ded-b587-d50f47aaee4a', 1),
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000002', 125000.00, 2083.33, 0, 127083.33, '2022-08-10 10:00:00', 4, 'TRANSFER', '59c75e11-b5f5-4ded-b587-d50f47aaee4a', 1),
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000002', 125000.00, 1041.67, 0, 126041.67, '2022-09-16 10:00:00', 4, 'TRANSFER', '59c75e11-b5f5-4ded-b587-d50f47aaee4a', 1);

-- Loan 3
INSERT INTO loan_service.loans (
    loan_id, member_id, loan_type_id, loan_type, account_number, 
    requested_amount, approved_amount, disbursed_amount, interest_rate, term_months, 
    branch_id, tenant_id, current_stage, status, applied_date, disbursement_date, 
    created_at, updated_at
) VALUES (
    'c0000000-0000-0000-0000-000000000003', '1f381b75-13bd-4bc3-b656-ee54b703aec7', '7913fb11-31e8-4386-893d-53460eebe451', 'ව්‍යාපාරික ණය', 'LN-COMP-003',
    200000.00, 200000.00, 200000.00, 14.0, 2,
    4, 1, 'COMPLETED', 'COMPLETED', '2023-08-01', '2023-08-05 14:00:00',
    '2023-08-01 10:00:00', '2023-10-05 10:00:00'
);

INSERT INTO loan_service.loan_schedules (id, loan_id, due_date, expected_principal, expected_interest, total_expected_amount, installment_number, status, tenant_id) VALUES
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', '2023-09-05', 100000.00, 2333.33, 102333.33, 1, 'PAID', 1),
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', '2023-10-05', 100000.00, 1166.67, 101166.67, 2, 'PAID', 1);

INSERT INTO loan_service.loan_repayments (id, loan_id, principal_portion, interest_portion, penalty_paid, total_paid, payment_date, payment_branch_id, payment_method, processed_by, tenant_id) VALUES
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', 100000.00, 2333.33, 0, 102333.33, '2023-09-02 10:00:00', 4, 'CASH', '59c75e11-b5f5-4ded-b587-d50f47aaee4a', 1),
(gen_random_uuid(), 'c0000000-0000-0000-0000-000000000003', 100000.00, 1166.67, 0, 101166.67, '2023-10-05 10:00:00', 4, 'CASH', '59c75e11-b5f5-4ded-b587-d50f47aaee4a', 1);
