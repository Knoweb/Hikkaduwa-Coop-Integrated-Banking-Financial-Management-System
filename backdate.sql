
DO $$
DECLARE
    rec RECORD;
    v_past_months INT;
    v_created_at TIMESTAMP;
BEGIN
    -- Backdate Savings Accounts in Rathgama branch
    FOR rec IN SELECT account_id FROM account_service.savings_accounts WHERE branch_id = 3 LOOP
        v_past_months := floor(random() * 36)::int;
        v_created_at := NOW() - (v_past_months || ' months')::interval;
        
        UPDATE account_service.savings_accounts 
        SET opened_date = v_created_at::date, created_at = v_created_at 
        WHERE account_id = rec.account_id AND opened_date = CURRENT_DATE;
    END LOOP;
END $$;
    