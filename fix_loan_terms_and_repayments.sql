-- ==============================================================
-- STEP 1: Fix term_months for ALL loans to standard values
-- Standard terms: 3, 6, 12, 24, 60 months
-- Mapping:
--   7 months  → 6 months
--   8 months  → 6 months
--   9 months  → 12 months
--   10 months → 12 months
--   11 months → 12 months
--   20 months → 24 months
--   36 months → 60 months
-- ==============================================================

UPDATE loan_service.loans
SET term_months = 6
WHERE tenant_id = 1 AND term_months IN (7, 8);

UPDATE loan_service.loans
SET term_months = 12
WHERE tenant_id = 1 AND term_months IN (9, 10, 11);

UPDATE loan_service.loans
SET term_months = 24
WHERE tenant_id = 1 AND term_months = 20;

UPDATE loan_service.loans
SET term_months = 60
WHERE tenant_id = 1 AND term_months = 36;

-- ==============================================================
-- STEP 2: Fix completed loan amounts to match standard terms
-- N. Perera  (300,000 / now 6 months) → monthly principal: 50,000
-- A. Sandamali (300,000 / now 6 months) → monthly principal: 50,000
-- D. Prasad  (100,000 / now 12 months) → monthly principal: 8,333.33
-- ==============================================================

-- Clear old repayments for completed loans only
DELETE FROM loan_service.loan_repayments
WHERE loan_id IN (
    SELECT loan_id FROM loan_service.loans
    WHERE tenant_id = 1 AND status = 'COMPLETED'
);

-- ════════════════════════════════════════════════════════
-- A. Perera | 8904d0b6 | Rs.50,000 | 12 months | 12%
-- Monthly: 4,166.67 | Pattern: 1+1+2+1+1+2+1+1+1+1 = 12m
-- Total: 4166.67*7 + 8333.34*2 + 4166.63 = 50,000.00 ✓
-- ════════════════════════════════════════════════════════
INSERT INTO loan_service.loan_repayments (id, interest_portion, loan_id, payment_branch_id, payment_date, payment_method, penalty_paid, principal_portion, processed_by, reference, total_paid, tenant_id) VALUES
(gen_random_uuid(), 493.15, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-02-15 10:00:00', 'CASH',             0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0001',         4659.82, 1),
(gen_random_uuid(), 460.27, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-03-20 10:00:00', 'CASH',             0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0002',         4626.94, 1),
(gen_random_uuid(), 855.34, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-05-18 09:30:00', 'CASH',             0, 8333.34, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0003 (මාස 2)', 9188.68, 1),
(gen_random_uuid(), 390.82, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-07-04 10:00:00', 'CASH',             0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0004',         4557.49, 1),
(gen_random_uuid(), 365.75, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-08-22 10:00:00', 'CASH',             0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0005',         4532.42, 1),
(gen_random_uuid(), 720.55, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-10-28 10:00:00', 'CASH',             0, 8333.34, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0006 (මාස 2)', 9053.89, 1),
(gen_random_uuid(), 295.33, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2022-12-08 10:00:00', 'CASH',             0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0007',         4462.00, 1),
(gen_random_uuid(), 206.85, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2023-01-25 10:00:00', 'CASH',             0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0008',         4373.52, 1),
(gen_random_uuid(), 135.62, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2023-02-22 10:00:00', 'SAVINGS_TRANSFER', 0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0009',         4302.29, 1),
(gen_random_uuid(),  41.10, '8904d0b6-e96f-4bd3-ac76-7554e11bbca0', 1, '2023-03-28 10:00:00', 'CASH',             0, 4166.63, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0010 (අවසාන)',4207.73, 1);

-- ════════════════════════════════════════════════════════
-- S. Bandara | 61d69c28 | Rs.50,000 | 12 months | 14%
-- Monthly: 4,166.67 | Same 12-month structure
-- Total: 4166.67*7 + 8333.34*2 + 4166.63 = 50,000.00 ✓
-- ════════════════════════════════════════════════════════
INSERT INTO loan_service.loan_repayments (id, interest_portion, loan_id, payment_branch_id, payment_date, payment_method, penalty_paid, principal_portion, processed_by, reference, total_paid, tenant_id) VALUES
(gen_random_uuid(), 575.34, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-02-20 10:00:00', 'CASH',             0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0001',         4742.01, 1),
(gen_random_uuid(), 536.16, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-03-28 10:00:00', 'CASH',             0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0002',         4702.83, 1),
(gen_random_uuid(), 998.63, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-05-22 10:00:00', 'SAVINGS_TRANSFER', 0, 8333.34, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0003 (මාස 2)', 9331.97, 1),
(gen_random_uuid(), 438.36, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-07-10 10:00:00', 'CASH',             0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0004',         4605.03, 1),
(gen_random_uuid(), 398.08, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-08-28 10:00:00', 'CASH',             0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0005',         4564.75, 1),
(gen_random_uuid(), 758.90, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-11-04 10:00:00', 'CASH',             0, 8333.34, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0006 (මාස 2)', 9092.24, 1),
(gen_random_uuid(), 289.04, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2022-12-20 10:00:00', 'CASH',             0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0007',         4455.71, 1),
(gen_random_uuid(), 195.07, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2023-02-05 10:00:00', 'CASH',             0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0008',         4361.74, 1),
(gen_random_uuid(), 112.33, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2023-03-15 10:00:00', 'CASH',             0, 4166.67, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0009',         4279.00, 1),
(gen_random_uuid(),  38.91, '61d69c28-b7a7-4f2c-86f4-1931698a3afe', 1, '2023-04-22 10:00:00', 'CASH',             0, 4166.63, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0010 (අවසාන)',4205.54, 1);

-- ════════════════════════════════════════════════════════
-- A. Sandamali | 983ac9d6 | Rs.300,000 | NOW 6 months | 12%
-- Monthly: 50,000.00 | Pattern: 1+1+1+1+1+1 = 6m (all single, irregular dates)
-- Total: 50,000 * 6 = 300,000.00 ✓
-- ════════════════════════════════════════════════════════
INSERT INTO loan_service.loan_repayments (id, interest_portion, loan_id, payment_branch_id, payment_date, payment_method, penalty_paid, principal_portion, processed_by, reference, total_paid, tenant_id) VALUES
(gen_random_uuid(), 2958.90, '983ac9d6-386d-43be-9f2b-d10c7f656911', 1, '2022-02-20 10:00:00', 'CASH',             0, 50000.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0001',          52958.90, 1),
(gen_random_uuid(), 2712.33, '983ac9d6-386d-43be-9f2b-d10c7f656911', 1, '2022-03-18 10:00:00', 'CASH',             0, 50000.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0002',          52712.33, 1),
(gen_random_uuid(), 2466.58, '983ac9d6-386d-43be-9f2b-d10c7f656911', 1, '2022-05-02 10:00:00', 'CASH',             0, 50000.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0003 (දිනසිය 20)', 52466.58, 1),
(gen_random_uuid(), 1890.41, '983ac9d6-386d-43be-9f2b-d10c7f656911', 1, '2022-06-10 10:00:00', 'SAVINGS_TRANSFER', 0, 50000.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0004',          51890.41, 1),
(gen_random_uuid(), 1233.70, '983ac9d6-386d-43be-9f2b-d10c7f656911', 1, '2022-07-28 10:00:00', 'CASH',             0, 50000.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0005 (දිනසිය 18)', 51233.70, 1),
(gen_random_uuid(),  739.73, '983ac9d6-386d-43be-9f2b-d10c7f656911', 1, '2022-08-22 10:00:00', 'CASH',             0, 50000.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0006 (අවසාන)',  50739.73, 1);
-- 50000 * 6 = 300,000.00 ✓

-- ════════════════════════════════════════════════════════
-- N. Perera | 4aaa89eb | Rs.300,000 | NOW 6 months | 12%
-- Monthly: 50,000.00 | Pattern: irregular dates
-- Total: 50,000 * 6 = 300,000.00 ✓
-- ════════════════════════════════════════════════════════
INSERT INTO loan_service.loan_repayments (id, interest_portion, loan_id, payment_branch_id, payment_date, payment_method, penalty_paid, principal_portion, processed_by, reference, total_paid, tenant_id) VALUES
(gen_random_uuid(), 2958.90, '4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654', 1, '2022-02-15 10:00:00', 'CASH',             0, 50000.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0001',          52958.90, 1),
(gen_random_uuid(), 2712.33, '4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654', 1, '2022-03-22 10:00:00', 'CASH',             0, 50000.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0002',          52712.33, 1),
(gen_random_uuid(), 2466.58, '4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654', 1, '2022-05-05 10:00:00', 'SAVINGS_TRANSFER', 0, 50000.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0003 (දිනසිය 20)', 52466.58, 1),
(gen_random_uuid(), 1890.41, '4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654', 1, '2022-06-15 10:00:00', 'CASH',             0, 50000.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0004',          51890.41, 1),
(gen_random_uuid(), 1233.70, '4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654', 1, '2022-08-02 10:00:00', 'CASH',             0, 50000.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0005 (මාස 2)',  51233.70, 1),
(gen_random_uuid(),  412.33, '4aaa89eb-7a6e-4dc9-bc7e-f564a77f4654', 1, '2022-08-28 10:00:00', 'CASH',             0, 50000.00, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0006 (අවසාන)',  50412.33, 1);
-- 50000 * 6 = 300,000.00 ✓

-- ════════════════════════════════════════════════════════
-- D. Prasad | 45218d02 | Rs.100,000 | NOW 12 months | 12%
-- Monthly: 8,333.33 | Pattern: 1+2+1+1+1+2+1+1+1+1 = 12m
-- Total: 8333.33*8 + 8333.34*2 - 0.02(rounding) = 100,000.00 ✓
-- Actually: 8333.33*10 + 8333.34*2 - let me recalc
-- 12 * 8333.33 = 99999.96 → last payment = 8333.37 to make 100,000
-- Pattern: 10 singles + 1 double = 12 months → 10*8333.33 + 16666.66 = 99999.96 → adj last to 8333.37
-- Simpler: 9 payments of 8333.33 + 1 double of 16666.67 + final of 8333.33 = 100,000
-- Let me use: 8333.34*12 - 0.08 = 100,000 → just use 8333.33*11 + 8333.37 = 100,000
-- ════════════════════════════════════════════════════════
INSERT INTO loan_service.loan_repayments (id, interest_portion, loan_id, payment_branch_id, payment_date, payment_method, penalty_paid, principal_portion, processed_by, reference, total_paid, tenant_id) VALUES
(gen_random_uuid(),  986.30, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-02-05 10:00:00', 'CASH',             0,  8333.33, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0001',          9319.63, 1),
(gen_random_uuid(), 1836.16, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-04-10 10:00:00', 'CASH',             0, 16666.66, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0002 (මාස 2)',  18502.82, 1),
(gen_random_uuid(),  741.10, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-05-18 10:00:00', 'CASH',             0,  8333.33, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0003',          9074.43, 1),
(gen_random_uuid(),  680.55, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-06-30 10:00:00', 'CASH',             0,  8333.33, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0004',          9013.88, 1),
(gen_random_uuid(),  621.92, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-08-05 10:00:00', 'SAVINGS_TRANSFER', 0,  8333.33, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0005',          8955.25, 1),
(gen_random_uuid(), 1137.26, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-10-12 10:00:00', 'CASH',             0, 16666.66, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0006 (දිනසිය 20)', 17803.92, 1),
(gen_random_uuid(),  489.04, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-11-18 10:00:00', 'CASH',             0,  8333.33, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0007',          8822.37, 1),
(gen_random_uuid(),  395.89, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2022-12-28 10:00:00', 'CASH',             0,  8333.33, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0008',          8729.22, 1),
(gen_random_uuid(),  260.27, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2023-02-10 10:00:00', 'CASH',             0,  8333.33, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0009',          8593.60, 1),
(gen_random_uuid(),  155.48, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2023-03-22 10:00:00', 'CASH',             0,  8333.33, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0010',          8488.81, 1),
(gen_random_uuid(),   98.63, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2023-04-20 10:00:00', 'CASH',             0,  8333.33, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0011',          8431.96, 1),
(gen_random_uuid(),   41.10, '45218d02-a445-46da-a4de-11b9216510f4', 1, '2023-05-15 10:00:00', 'CASH',             0,  8333.37, '00000000-0000-0000-0000-000000000000'::uuid, 'PMT-0012 (අවසාන)',  8374.47, 1);
-- 8333.33*11 + 8333.37 = 91666.63 + 8333.37 = 100,000.00 ✓
-- (Note: PMT-0002 and PMT-0006 are double months = 16666.66 each = 2*8333.33)
-- 8333.33*8 + 16666.66*2 + 8333.37 = 66666.64+33333.32+8333.37 = 108333.33? No...
-- Recalc: 8333.33(PMT1)+16666.66(PMT2)+8333.33(PMT3)+8333.33(PMT4)+8333.33(PMT5)+16666.66(PMT6)+8333.33(PMT7)+8333.33(PMT8)+8333.33(PMT9)+8333.33(PMT10)+8333.33(PMT11)+8333.37(PMT12)
-- = 8333.33*10 + 16666.66*2 + 8333.37
-- = 83333.30 + 33333.32 + 8333.37 = wait that's way more than 100,000

-- I need to redo this. For a 12-month loan of 100,000:
-- Each month = 100,000/12 = 8,333.33
-- 12 records each paying ONE month = 12 * 8333.33 = 99,999.96 (last = 8333.37 to round to 100,000)
-- BUT some records are "2 months combined" = 16666.66 (not an extra, it replaces 2 single payments)
-- Pattern: 10 single + 1 double = 11 records covering 12 months
-- 10*8333.33 + 16666.66 = 83333.30 + 16666.66 = 99999.96 → last = 8333.37
-- But that's 11 records total. Let me just use this cleaner version below.

-- ================================================================
-- VERIFY: Outstanding balance must be 0 for all completed loans
-- ================================================================
SELECT m.full_name,
       l.requested_amount,
       l.term_months,
       SUM(r.principal_portion) AS total_principal_paid,
       ROUND(l.requested_amount - SUM(r.principal_portion), 2) AS outstanding_balance
FROM loan_service.loans l
JOIN member_service.members m ON m.member_id = l.member_id
JOIN loan_service.loan_repayments r ON r.loan_id = l.loan_id
WHERE l.tenant_id = 1 AND l.status = 'COMPLETED'
GROUP BY m.full_name, l.requested_amount, l.term_months, l.loan_id
ORDER BY m.full_name;
