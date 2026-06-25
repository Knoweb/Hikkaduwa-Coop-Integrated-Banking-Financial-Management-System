DO $$ 
DECLARE 
    v_member_id UUID;
    v_savings_account_id UUID := gen_random_uuid();
    v_branch_id INT := 1;
BEGIN
    -- Get Member ID for M0010 (A real Member)
    SELECT member_id INTO v_member_id FROM member_service.members WHERE membership_number = 'M0010' LIMIT 1;

    IF v_member_id IS NULL THEN
        RAISE EXCEPTION 'Member M0010 not found in database.';
    END IF;

    -- 1. Create Savings Account (Opened 4 months ago: 2026-02-25)
    INSERT INTO account_service.savings_accounts (
        account_id, account_number, member_id, account_mode, mode_of_operation,
        account_type, balance, initial_deposit, branch_id, created_at, opened_date, status, annual_interest_rate
    ) VALUES (
        v_savings_account_id, '89901011', v_member_id, 'SINGLE', 'SELF',
        'SAMANAYA', 45000.00, 10000.00, v_branch_id, '2026-02-25 10:00:00', '2026-02-25', 'ACTIVE', 0.0600
    );

    -- 2. Insert Transactions for Savings Account
    -- Initial Deposit (2026-02-25)
    INSERT INTO account_service.transactions (
        account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, branch_id, reference
    ) VALUES (
        v_savings_account_id, 'DEPOSIT', 10000.00, 10000.00, v_member_id, '2026-02-25 10:00:00', v_branch_id, 'Initial Deposit'
    );

    -- Monthly Interest (End of Feb)
    INSERT INTO account_service.transactions (
        account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, branch_id, reference
    ) VALUES (
        v_savings_account_id, 'INTEREST', 5.00, 10005.00, v_member_id, '2026-02-28 23:59:59', v_branch_id, 'Monthly Interest - Feb'
    );

    -- Deposit in March
    INSERT INTO account_service.transactions (
        account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, branch_id, reference
    ) VALUES (
        v_savings_account_id, 'DEPOSIT', 20000.00, 30005.00, v_member_id, '2026-03-15 14:30:00', v_branch_id, 'Cash Deposit'
    );

    -- Monthly Interest (End of March)
    INSERT INTO account_service.transactions (
        account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, branch_id, reference
    ) VALUES (
        v_savings_account_id, 'INTEREST', 150.00, 30155.00, v_member_id, '2026-03-31 23:59:59', v_branch_id, 'Monthly Interest - Mar'
    );

    -- Withdrawal in April
    INSERT INTO account_service.transactions (
        account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, branch_id, reference
    ) VALUES (
        v_savings_account_id, 'WITHDRAWAL', 5000.00, 25155.00, v_member_id, '2026-04-10 11:15:00', v_branch_id, 'Cash Withdrawal'
    );

    -- Monthly Interest (End of April)
    INSERT INTO account_service.transactions (
        account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, branch_id, reference
    ) VALUES (
        v_savings_account_id, 'INTEREST', 125.00, 25280.00, v_member_id, '2026-04-30 23:59:59', v_branch_id, 'Monthly Interest - Apr'
    );

    -- Deposit in May
    INSERT INTO account_service.transactions (
        account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, branch_id, reference
    ) VALUES (
        v_savings_account_id, 'DEPOSIT', 19600.00, 44880.00, v_member_id, '2026-05-20 09:45:00', v_branch_id, 'Salary Deposit'
    );

    -- Monthly Interest (End of May)
    INSERT INTO account_service.transactions (
        account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, branch_id, reference
    ) VALUES (
        v_savings_account_id, 'INTEREST', 120.00, 45000.00, v_member_id, '2026-05-31 23:59:59', v_branch_id, 'Monthly Interest - May'
    );

END $$;
