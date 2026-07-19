DO $$
DECLARE
    t_id INT;
BEGIN
    FOR t_id IN SELECT DISTINCT tenant_id FROM loan_service.loan_types LOOP
        IF NOT EXISTS (SELECT 1 FROM loan_service.loan_types WHERE name = 'ක්ෂණික ණය' AND tenant_id = t_id) THEN
            INSERT INTO loan_service.loan_types 
            (loan_type_id, created_at, description, eligibility_criteria, interest_rate, is_active, max_amount, max_term_months, name, updated_at, tenant_id)
            VALUES 
            (gen_random_uuid(), NOW(), 'Instant Loan', '', 18.00, true, 50000.00, 6, 'ක්ෂණික ණය', NOW(), t_id);
        END IF;
    END LOOP;
END $$;
