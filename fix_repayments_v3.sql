-- ================================================================
-- CLEAR ALL OLD REPAYMENTS FOR COMPLETED LOANS
-- ================================================================
DELETE FROM loan_service.loan_repayments
WHERE loan_id IN (
    SELECT loan_id FROM loan_service.loans 
    WHERE tenant_id = 1 AND status = 'COMPLETED'
);

-- ================================================================
-- 1. A. Perera | loan: 8904d0b6 | Rs. 50,000 | 12 months | 12%
--    Monthly principal: 4,166.67
--    Pattern: 1+1+2+1+1+2+1+1+1+1 = 12 months (10 records)
--    Sum: 4166.67*7 + 8333.34*2 + 4166.63 = 50,000.00 ✓
-- ================================================================
INSERT INTO loan_service.loan_repayments (id, interest_portion, loan_id, payment_branch_id, payment_date, payment_method, penalty_paid, principal_portion, processed_by, reference, total_paid, tenant_id) VALUES
(gen_random_uuid(), 493.15, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-02-15 10:00:00', 'CASH',              0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0001',         4659.82, 1),
(gen_random_uuid(), 460.27, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-03-20 10:00:00', 'CASH',              0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0002',         4626.94, 1),
(gen_random_uuid(), 855.34, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-05-18 09:30:00', 'CASH',              0, 8333.34, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0003 (මාස 2)', 9188.68, 1),
(gen_random_uuid(), 390.82, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-07-04 10:00:00', 'CASH',              0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0004',         4557.49, 1),
(gen_random_uuid(), 365.75, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-08-22 10:00:00', 'CASH',              0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0005',         4532.42, 1),
(gen_random_uuid(), 720.55, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-10-28 10:00:00', 'CASH',              0, 8333.34, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0006 (මාස 2)', 9053.89, 1),
(gen_random_uuid(), 295.33, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-12-08 10:00:00', 'CASH',              0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0007',         4462.00, 1),
(gen_random_uuid(), 206.85, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2023-01-25 10:00:00', 'CASH',              0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0008',         4373.52, 1),
(gen_random_uuid(), 135.62, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2023-02-22 10:00:00', 'SAVINGS_TRANSFER',  0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0009',         4302.29, 1),
(gen_random_uuid(),  41.10, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2023-03-28 10:00:00', 'CASH',              0, 4166.63, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0010 (අවසාන)', 4207.73, 1);
-- 4166.67*7 + 8333.34*2 + 4166.63 = 29166.69 + 16666.68 + 4166.63 = 50,000.00 ✓

-- ================================================================
-- 2. S. Bandara | loan: 61d69c28 | Rs. 50,000 | 12 months | 14%
--    Monthly principal: 4,166.67
--    Same structure, 12% → 14% interest so interest amounts slightly higher
-- ================================================================
INSERT INTO loan_service.loan_repayments (id, interest_portion, loan_id, payment_branch_id, payment_date, payment_method, penalty_paid, principal_portion, processed_by, reference, total_paid, tenant_id) VALUES
(gen_random_uuid(), 575.34, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-02-20 10:00:00', 'CASH',              0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0001',         4742.01, 1),
(gen_random_uuid(), 536.16, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-03-28 10:00:00', 'CASH',              0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0002',         4702.83, 1),
(gen_random_uuid(), 998.63, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-05-22 10:00:00', 'SAVINGS_TRANSFER',  0, 8333.34, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0003 (මාස 2)', 9331.97, 1),
(gen_random_uuid(), 438.36, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-07-10 10:00:00', 'CASH',              0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0004',         4605.03, 1),
(gen_random_uuid(), 398.08, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-08-28 10:00:00', 'CASH',              0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0005',         4564.75, 1),
(gen_random_uuid(), 758.90, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-11-04 10:00:00', 'CASH',              0, 8333.34, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0006 (මාස 2)', 9092.24, 1),
(gen_random_uuid(), 289.04, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-12-20 10:00:00', 'CASH',              0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0007',         4455.71, 1),
(gen_random_uuid(), 195.07, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2023-02-05 10:00:00', 'CASH',              0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0008',         4361.74, 1),
(gen_random_uuid(), 112.33, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2023-03-15 10:00:00', 'CASH',              0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0009',         4279.00, 1),
(gen_random_uuid(),  38.91, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2023-04-22 10:00:00', 'CASH',              0, 4166.63, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0010 (අවසාන)', 4205.54, 1);
-- 4166.67*7 + 8333.34*2 + 4166.63 = 50,000.00 ✓

-- ================================================================
-- 3. A. Sandamali | loan: 983ac9d6 | Rs. 300,000 | 8 months | 12%
--    Monthly principal: 37,500.00
--    Pattern: 1+1+2+1+2+1 = 8 months (6 records)
--    Sum: 37500*4 + 75000*2 = 300,000.00 ✓
-- ================================================================
INSERT INTO loan_service.loan_repayments (id, interest_portion, loan_id, payment_branch_id, payment_date, payment_method, penalty_paid, principal_portion, processed_by, reference, total_paid, tenant_id) VALUES
(gen_random_uuid(), 2958.90, '983ac9d6-386d-43be-9f2b-d10c7f656911', 1, '2022-02-20 10:00:00', 'CASH',              0,  37500.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0001',          40458.90, 1),
(gen_random_uuid(), 2712.33, '983ac9d6-386d-43be-9f2b-d10c7f656911', 1, '2022-03-18 10:00:00', 'CASH',              0,  37500.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0002',          40212.33, 1),
(gen_random_uuid(), 5103.29, '983ac9d6-386d-43be-9f2b-d10c7f656911', 1, '2022-06-02 10:00:00', 'SAVINGS_TRANSFER',  0,  75000.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0003 (මාස 2)',  80103.29, 1),
(gen_random_uuid(), 1890.41, '983ac9d6-386d-43be-9f2b-d10c7f656911', 1, '2022-07-10 10:00:00', 'CASH',              0,  37500.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0004',          39390.41, 1),
(gen_random_uuid(), 3540.62, '983ac9d6-386d-43be-9f2b-d10c7f656911', 1, '2022-09-14 10:00:00', 'CASH',              0,  75000.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0005 (මාස 2)',  78540.62, 1),
(gen_random_uuid(),  739.73, '983ac9d6-386d-43be-9f2b-d10c7f656911', 1, '2022-10-22 10:00:00', 'CASH',              0,  37500.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0006 (අවසාන)',  38239.73, 1);
-- 37500*4 + 75000*2 = 150000 + 150000 = 300,000.00 ✓

-- ================================================================
-- 4. N. Perera | loan: 4aaa89eb | Rs. 300,000 | 8 months | 12%
--    Monthly principal: 37,500.00
--    Pattern: 1+1+1+2+1+2 = 8 months (6 records)
--    Sum: 37500*4 + 75000*2 = 300,000.00 ✓
-- ================================================================
INSERT INTO loan_service.loan_repayments (id, interest_portion, loan_id, payment_branch_id, payment_date, payment_method, penalty_paid, principal_portion, processed_by, reference, total_paid, tenant_id) VALUES
(gen_random_uuid(), 2958.90, '4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654', 1, '2022-02-15 10:00:00', 'CASH',              0,  37500.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0001',          40458.90, 1),
(gen_random_uuid(), 2712.33, '4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654', 1, '2022-03-15 10:00:00', 'CASH',              0,  37500.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0002',          40212.33, 1),
(gen_random_uuid(), 2466.58, '4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654', 1, '2022-04-15 10:00:00', 'CASH',              0,  37500.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0003',          39966.58, 1),
(gen_random_uuid(), 4610.96, '4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654', 1, '2022-06-20 09:00:00', 'SAVINGS_TRANSFER',  0,  75000.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0004 (මාස 2)',  79610.96, 1),
(gen_random_uuid(), 1739.73, '4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654', 1, '2022-07-30 10:00:00', 'CASH',              0,  37500.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0005',          39239.73, 1),
(gen_random_uuid(), 1233.70, '4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654', 1, '2022-10-05 10:00:00', 'CASH',              0,  75000.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0006 (අවසාන)',  76233.70, 1);
-- 37500*4 + 75000*2 = 150000 + 150000 = 300,000.00 ✓

-- ================================================================
-- 5. D. Prasad | loan: 45218d02 | Rs. 100,000 | 9 months | 12%
--    Monthly principal: 11,111.11 (final: 11,111.12 for rounding)
--    Pattern: 1+2+1+1+2+1+1 = 9 months (7 records)
--    Sum: 11111.11*5 + 22222.22*2 = 55555.55 + 44444.44 = 99999.99 + 0.01(final) = 100,000 ✓
-- ================================================================
INSERT INTO loan_service.loan_repayments (id, interest_portion, loan_id, payment_branch_id, payment_date, payment_method, penalty_paid, principal_portion, processed_by, reference, total_paid, tenant_id) VALUES
(gen_random_uuid(),  986.30, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-02-05 10:00:00', 'CASH',              0, 11111.11, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0001',          12097.41, 1),
(gen_random_uuid(), 1836.16, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-04-10 10:00:00', 'CASH',              0, 22222.22, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0002 (මාස 2)',  24058.38, 1),
(gen_random_uuid(),  808.22, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-05-30 10:00:00', 'SAVINGS_TRANSFER',  0, 11111.11, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0003',          11919.33, 1),
(gen_random_uuid(),  741.10, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-07-08 10:00:00', 'CASH',              0, 11111.11, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0004',          11852.21, 1),
(gen_random_uuid(), 1231.51, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-09-22 10:00:00', 'CASH',              0, 22222.22, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0005 (දින 20 ඉක්ම)', 23453.73, 1),
(gen_random_uuid(),  489.04, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-11-05 10:00:00', 'CASH',              0, 11111.11, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0006',          11600.15, 1),
(gen_random_uuid(),  108.22, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-12-18 10:00:00', 'CASH',              0, 11111.12, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0007 (අවසාන)',  11219.34, 1);
-- 11111.11*5 + 22222.22*2 + 0.01(final adj) = 55555.55 + 44444.44 + 0.01 = 100,000.00 ✓

-- ================================================================
-- VERIFY: Check remaining balances (should all be 0)
-- ================================================================
SELECT m.full_name,
       l.requested_amount,
       SUM(r.principal_portion) AS total_paid,
       l.requested_amount - SUM(r.principal_portion) AS outstanding_balance
FROM loan_service.loans l
JOIN member_service.members m ON m.member_id = l.member_id
JOIN loan_service.loan_repayments r ON r.loan_id = l.loan_id
WHERE l.tenant_id = 1 AND l.status = 'COMPLETED'
GROUP BY m.full_name, l.requested_amount, l.loan_id
ORDER BY m.full_name;
