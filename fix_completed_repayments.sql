-- Clear old mock repayments for the 5 completed loans
DELETE FROM loan_service.loan_repayments
WHERE loan_id IN (
    SELECT loan_id FROM loan_service.loans 
    WHERE tenant_id = 1 AND status = 'COMPLETED'
)
AND reference IN ('PAID_FULL', 'PAID_PARTIAL');

-- Now insert REALISTIC irregular payments for each completed loan
-- Loan 1: 45218d02-a445-46da-a4de-11b9216510f4  (Rs. 50,000 / 12 months)
INSERT INTO loan_service.loan_repayments (id, interest_portion, loan_id, payment_branch_id, payment_date, payment_method, penalty_paid, principal_portion, processed_by, reference, total_paid, tenant_id) VALUES
(gen_random_uuid(), 493.15, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-02-15 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0001', 4659.82, 1),
(gen_random_uuid(), 460.27, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-03-20 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0002', 4626.94, 1),
(gen_random_uuid(), 915.33, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-05-25 09:30:00', 'CASH', 0, 8333.34, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0003 (මාස 2)', 9248.67, 1),
(gen_random_uuid(), 360.27, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-07-15 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0004', 4526.94, 1),
(gen_random_uuid(), 701.37, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-09-04 11:00:00', 'CASH', 0, 8333.34, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0005 (මාස 2)', 9034.71, 1),
(gen_random_uuid(), 310.96, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-10-28 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0006', 4477.63, 1),
(gen_random_uuid(), 280.55, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-12-05 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0007', 4447.22, 1),
(gen_random_uuid(), 166.85, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2023-01-18 09:00:00', 'CASH', 0, 4166.65, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0008 (අවසාන)', 4333.50, 1);

-- Loan 2: 4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654 (Rs. 50,000 / 12 months)
INSERT INTO loan_service.loan_repayments (id, interest_portion, loan_id, payment_branch_id, payment_date, payment_method, penalty_paid, principal_portion, processed_by, reference, total_paid, tenant_id) VALUES
(gen_random_uuid(), 493.15, '4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654', 1, '2022-02-15 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0001', 4659.82, 1),
(gen_random_uuid(), 493.15, '4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654', 1, '2022-03-15 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0002', 4659.82, 1),
(gen_random_uuid(), 493.15, '4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654', 1, '2022-04-15 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0003', 4659.82, 1),
(gen_random_uuid(), 986.30, '4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654', 1, '2022-06-15 10:00:00', 'SAVINGS_TRANSFER', 0, 8333.34, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0004 (මාස 2 එකට)', 9319.64, 1),
(gen_random_uuid(), 360.27, '4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654', 1, '2022-07-25 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0005', 4526.94, 1),
(gen_random_uuid(), 438.36, '4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654', 1, '2022-09-10 10:00:00', 'CASH', 0, 8333.34, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0006 (දින 20 ඉක්ම)', 8771.70, 1),
(gen_random_uuid(), 275.34, '4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654', 1, '2022-11-05 10:00:00', 'CASH', 0, 8333.34, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0007 (මාස 2)', 8608.68, 1),
(gen_random_uuid(), 128.77, '4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654', 1, '2022-12-30 10:00:00', 'CASH', 0, 4166.65, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0008 (අවසාන)', 4295.42, 1);

-- Loan 3: 61d69c28-b7a7-4f2c-86f4-1931698a3afe
INSERT INTO loan_service.loan_repayments (id, interest_portion, loan_id, payment_branch_id, payment_date, payment_method, penalty_paid, principal_portion, processed_by, reference, total_paid, tenant_id) VALUES
(gen_random_uuid(), 493.15, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-02-20 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0001', 4659.82, 1),
(gen_random_uuid(), 769.58, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-04-12 10:00:00', 'CASH', 0, 8333.34, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0002 (මාස 2)', 9102.92, 1),
(gen_random_uuid(), 395.89, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-05-22 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0003', 4562.56, 1),
(gen_random_uuid(), 625.48, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-07-28 09:00:00', 'SAVINGS_TRANSFER', 0, 8333.34, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0004 (දින 20 ඉක්ම)', 8958.82, 1),
(gen_random_uuid(), 325.68, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-09-09 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0005', 4492.35, 1),
(gen_random_uuid(), 295.47, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-10-30 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0006', 4462.14, 1),
(gen_random_uuid(), 548.27, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-12-24 10:00:00', 'CASH', 0, 8333.34, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0007 (මාස 2 එකට)', 8881.61, 1),
(gen_random_uuid(), 88.49, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2023-01-20 10:00:00', 'CASH', 0, 4166.65, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0008 (අවසාන)', 4255.14, 1);

-- Loan 4: 8904d0b6-e96f-4bd3-ac76-7554e11bbca0
INSERT INTO loan_service.loan_repayments (id, interest_portion, loan_id, payment_branch_id, payment_date, payment_method, penalty_paid, principal_portion, processed_by, reference, total_paid, tenant_id) VALUES
(gen_random_uuid(), 493.15, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-02-10 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0001', 4659.82, 1),
(gen_random_uuid(), 460.27, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-03-15 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0002', 4626.94, 1),
(gen_random_uuid(), 855.34, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-05-18 10:00:00', 'SAVINGS_TRANSFER', 0, 8333.34, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0003 (මාස 2)', 9188.68, 1),
(gen_random_uuid(), 390.82, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-07-04 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0004', 4557.49, 1),
(gen_random_uuid(), 365.75, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-08-22 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0005', 4532.42, 1),
(gen_random_uuid(), 720.55, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-10-28 10:00:00', 'CASH', 0, 8333.34, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0006 (දින 20 ඉක්ම)', 9053.89, 1),
(gen_random_uuid(), 295.33, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-12-08 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0007', 4462.00, 1),
(gen_random_uuid(), 118.49, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2023-01-25 10:00:00', 'CASH', 0, 4166.65, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0008 (අවසාන)', 4285.14, 1);

-- Loan 5: 983ac9d6-386d-43be-9f2b-d10c7f656911
INSERT INTO loan_service.loan_repayments (id, interest_portion, loan_id, payment_branch_id, payment_date, payment_method, penalty_paid, principal_portion, processed_by, reference, total_paid, tenant_id) VALUES
(gen_random_uuid(), 493.15, '983ac9d6-386d-43be-9f2b-d10c7f656911', 1, '2022-02-05 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0001', 4659.82, 1),
(gen_random_uuid(), 986.30, '983ac9d6-386d-43be-9f2b-d10c7f656911', 1, '2022-04-10 10:00:00', 'CASH', 0, 8333.34, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0002 (මාස 2 එකට)', 9319.64, 1),
(gen_random_uuid(), 437.53, '983ac9d6-386d-43be-9f2b-d10c7f656911', 1, '2022-05-30 10:00:00', 'SAVINGS_TRANSFER', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0003', 4604.20, 1),
(gen_random_uuid(), 396.16, '983ac9d6-386d-43be-9f2b-d10c7f656911', 1, '2022-07-08 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0004', 4562.83, 1),
(gen_random_uuid(), 365.75, '983ac9d6-386d-43be-9f2b-d10c7f656911', 1, '2022-08-18 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0005', 4532.42, 1),
(gen_random_uuid(), 755.89, '983ac9d6-386d-43be-9f2b-d10c7f656911', 1, '2022-10-22 10:00:00', 'CASH', 0, 8333.34, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0006 (දින 20 ඉක්ම)', 9089.23, 1),
(gen_random_uuid(), 265.48, '983ac9d6-386d-43be-9f2b-d10c7f656911', 1, '2022-11-29 10:00:00', 'CASH', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0007', 4432.15, 1),
(gen_random_uuid(), 135.96, '983ac9d6-386d-43be-9f2b-d10c7f656911', 1, '2023-01-06 10:00:00', 'CASH', 0, 4166.65, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0008 (අවසාන)', 4302.61, 1);
