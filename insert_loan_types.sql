INSERT INTO loan_service.loan_types (loan_type_id, name, description, max_amount, max_term_months, interest_rate, is_active, created_at, updated_at) VALUES 
(gen_random_uuid(), 'පාරිභෝගික ණය', 'Consumer Loan', 500000.00, 60, 12.00, true, NOW(), NOW()),
(gen_random_uuid(), 'කෙටි ණය', 'Short Term Loan', 100000.00, 12, 14.00, true, NOW(), NOW()),
(gen_random_uuid(), 'සේවක ණය', 'Employee Loan', 300000.00, 36, 10.00, true, NOW(), NOW()),
(gen_random_uuid(), 'ආපදා ණය', 'Emergency Loan', 50000.00, 10, 8.00, true, NOW(), NOW()),
(gen_random_uuid(), 'FD ණය (ස්ථාවර තැන්පතු ණය)', 'FD Backed Loan', 1000000.00, 60, 11.00, true, NOW(), NOW()),
(gen_random_uuid(), 'අර්ත සාදක ණය', 'Provident Fund Loan', 500000.00, 60, 9.00, true, NOW(), NOW()),
(gen_random_uuid(), 'දුරකථන ණය', 'Telephone Loan', 100000.00, 24, 15.00, true, NOW(), NOW()),
(gen_random_uuid(), 'මහා සභා ණය', 'General Assembly Loan', 200000.00, 36, 12.00, true, NOW(), NOW()),
(gen_random_uuid(), 'MPCS ණය (විවිධ සේවා සමූපාකාර සමිති ණය)', 'MPCS Loan', 2000000.00, 60, 10.00, true, NOW(), NOW()),
(gen_random_uuid(), 'කොටස් මත ණය', 'Share Backed Loan', 50000.00, 12, 12.00, true, NOW(), NOW()),
(gen_random_uuid(), 'අත්තිකාරම් ණය', 'Advance Loan', 25000.00, 6, 0.00, true, NOW(), NOW()),
(gen_random_uuid(), 'කල්පසු ණය', 'Overdue Loan', 0.00, 0, 24.00, true, NOW(), NOW()),
(gen_random_uuid(), 'සමිතියේ කල්පසු ණය', 'Society Overdue Loan', 0.00, 0, 24.00, true, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;
