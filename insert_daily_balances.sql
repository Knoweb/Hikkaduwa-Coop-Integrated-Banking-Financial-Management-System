DO $$ 
DECLARE 
    v_account_id UUID;
BEGIN
    SELECT account_id INTO v_account_id FROM account_service.savings_accounts WHERE account_number = '89901011' LIMIT 1;

    IF v_account_id IS NULL THEN
        RAISE EXCEPTION 'Account 89901011 not found.';
    END IF;

    -- Feb 28
    INSERT INTO account_service.daily_balances (
        id, account_id, record_date, closing_balance, annual_interest_rate
    ) VALUES (
        gen_random_uuid(), v_account_id, '2026-02-28', 10005.00, 0.0600
    );

    -- Mar 15
    INSERT INTO account_service.daily_balances (
        id, account_id, record_date, closing_balance, annual_interest_rate
    ) VALUES (
        gen_random_uuid(), v_account_id, '2026-03-15', 30005.00, 0.0600
    );

    -- Mar 31
    INSERT INTO account_service.daily_balances (
        id, account_id, record_date, closing_balance, annual_interest_rate
    ) VALUES (
        gen_random_uuid(), v_account_id, '2026-03-31', 30155.00, 0.0600
    );

    -- Apr 10
    INSERT INTO account_service.daily_balances (
        id, account_id, record_date, closing_balance, annual_interest_rate
    ) VALUES (
        gen_random_uuid(), v_account_id, '2026-04-10', 25155.00, 0.0600
    );

    -- Apr 30
    INSERT INTO account_service.daily_balances (
        id, account_id, record_date, closing_balance, annual_interest_rate
    ) VALUES (
        gen_random_uuid(), v_account_id, '2026-04-30', 25280.00, 0.0600
    );

    -- May 20
    INSERT INTO account_service.daily_balances (
        id, account_id, record_date, closing_balance, annual_interest_rate
    ) VALUES (
        gen_random_uuid(), v_account_id, '2026-05-20', 44880.00, 0.0600
    );

    -- May 31
    INSERT INTO account_service.daily_balances (
        id, account_id, record_date, closing_balance, annual_interest_rate
    ) VALUES (
        gen_random_uuid(), v_account_id, '2026-05-31', 45000.00, 0.0600
    );

END $$;
