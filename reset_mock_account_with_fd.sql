DO $$ 
DECLARE 
    v_member_id UUID;
    v_savings_account_id UUID := gen_random_uuid();
    v_fd_account_id UUID := gen_random_uuid();
    v_branch_id INT := 1;
    v_fd_type_id UUID;
BEGIN
    -- Get Member ID for M0010 (A real Member)
    SELECT member_id INTO v_member_id FROM member_service.members WHERE membership_number = 'M0010' LIMIT 1;

    IF v_member_id IS NULL THEN
        RAISE EXCEPTION 'Member M0010 not found in database.';
    END IF;

    -- Get FD Type ID for Senior Citizen 1 Year
    SELECT id INTO v_fd_type_id FROM account_service.fixed_deposit_types WHERE code = 'FD_SNR_1Y' LIMIT 1;

    -- Clean up previous mock data
    DELETE FROM account_service.transactions WHERE account_id IN (SELECT account_id FROM account_service.savings_accounts WHERE account_number = '89901011');
    DELETE FROM account_service.daily_balances WHERE account_id IN (SELECT account_id FROM account_service.savings_accounts WHERE account_number = '89901011');
    DELETE FROM account_service.fixed_deposits WHERE linked_savings_account_id IN (SELECT account_id FROM account_service.savings_accounts WHERE account_number = '89901011');
    DELETE FROM account_service.savings_accounts WHERE account_number = '89901011';

    -- 1. Create Savings Account (Opened 4 months ago: 2026-02-24)
    INSERT INTO account_service.savings_accounts (
        account_id, account_number, member_id, account_mode, mode_of_operation,
        account_type, balance, initial_deposit, branch_id, created_at, opened_date, status, annual_interest_rate
    ) VALUES (
        v_savings_account_id, '89901011', v_member_id, 'SINGLE', 'SELF',
        'SAMANAYA', 46833.34, 10000.00, v_branch_id, '2026-02-24 10:00:00', '2026-02-24', 'ACTIVE', 0.0600
    );

    -- 2. Create Fixed Deposit (Opened in April: 2026-04-15)
    INSERT INTO account_service.fixed_deposits (
        fd_id, fd_number, member_id, type_id, branch_id,
        principal_amount, interest_rate, term_months, interest_payout_method,
        maturity_instruction, opened_date, maturity_date, last_interest_payout_date,
        status, linked_savings_account_id, has_submitted_tax_form, created_at
    ) VALUES (
        v_fd_account_id, 'FD89901011', v_member_id, v_fd_type_id, v_branch_id,
        100000.00, 11.00, 12, 'MONTHLY',
        'REINVEST_PRINCIPAL_ONLY', '2026-04-15', '2027-04-15', '2026-06-15',
        'ACTIVE', v_savings_account_id, true, '2026-04-15 10:00:00'
    );

    -- 3. Insert Transactions for Savings Account
    
    -- Initial Deposit (2026-02-24)
    INSERT INTO account_service.transactions (account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, branch_id, reference)
    VALUES (v_savings_account_id, 'INITIAL_DEPOSIT', 10000.00, 10000.00, v_member_id, '2026-02-24 10:00:00', v_branch_id, 'Initial Deposit');
    INSERT INTO account_service.daily_balances (id, account_id, record_date, closing_balance, annual_interest_rate) 
    VALUES (gen_random_uuid(), v_savings_account_id, '2026-02-24', 10000.00, 0.0600);

    -- Monthly Interest (Feb 28)
    INSERT INTO account_service.transactions (account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, branch_id, reference)
    VALUES (v_savings_account_id, 'INTEREST', 5.00, 10005.00, v_member_id, '2026-02-28 23:59:59', v_branch_id, 'Monthly Interest - Feb');
    INSERT INTO account_service.daily_balances (id, account_id, record_date, closing_balance, annual_interest_rate) 
    VALUES (gen_random_uuid(), v_savings_account_id, '2026-02-28', 10005.00, 0.0600);

    -- Deposit in March (March 10)
    INSERT INTO account_service.transactions (account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, branch_id, reference)
    VALUES (v_savings_account_id, 'DEPOSIT', 20000.00, 30005.00, v_member_id, '2026-03-10 14:30:00', v_branch_id, 'Cash Deposit');
    INSERT INTO account_service.daily_balances (id, account_id, record_date, closing_balance, annual_interest_rate) 
    VALUES (gen_random_uuid(), v_savings_account_id, '2026-03-10', 30005.00, 0.0600);

    -- Monthly Interest (March 31)
    INSERT INTO account_service.transactions (account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, branch_id, reference)
    VALUES (v_savings_account_id, 'INTEREST', 150.00, 30155.00, v_member_id, '2026-03-31 23:59:59', v_branch_id, 'Monthly Interest - Mar');
    INSERT INTO account_service.daily_balances (id, account_id, record_date, closing_balance, annual_interest_rate) 
    VALUES (gen_random_uuid(), v_savings_account_id, '2026-03-31', 30155.00, 0.0600);

    -- Withdrawal in April (April 10)
    INSERT INTO account_service.transactions (account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, branch_id, reference)
    VALUES (v_savings_account_id, 'WITHDRAWAL', 5000.00, 25155.00, v_member_id, '2026-04-10 11:15:00', v_branch_id, 'Cash Withdrawal');
    INSERT INTO account_service.daily_balances (id, account_id, record_date, closing_balance, annual_interest_rate) 
    VALUES (gen_random_uuid(), v_savings_account_id, '2026-04-10', 25155.00, 0.0600);

    -- Monthly Interest (April 30)
    INSERT INTO account_service.transactions (account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, branch_id, reference)
    VALUES (v_savings_account_id, 'INTEREST', 125.00, 25280.00, v_member_id, '2026-04-30 23:59:59', v_branch_id, 'Monthly Interest - Apr');
    INSERT INTO account_service.daily_balances (id, account_id, record_date, closing_balance, annual_interest_rate) 
    VALUES (gen_random_uuid(), v_savings_account_id, '2026-04-30', 25280.00, 0.0600);

    -- FD Monthly Interest (May 15)
    INSERT INTO account_service.transactions (account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, branch_id, reference)
    VALUES (v_savings_account_id, 'FD_MONTHLY_INTEREST', 916.67, 26196.67, v_member_id, '2026-05-15 00:01:00', v_branch_id, 'FD Interest - FD89901011');
    INSERT INTO account_service.daily_balances (id, account_id, record_date, closing_balance, annual_interest_rate) 
    VALUES (gen_random_uuid(), v_savings_account_id, '2026-05-15', 26196.67, 0.0600);

    -- Deposit in May (May 15 later in the day)
    INSERT INTO account_service.transactions (account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, branch_id, reference)
    VALUES (v_savings_account_id, 'DEPOSIT', 19600.00, 45796.67, v_member_id, '2026-05-15 09:45:00', v_branch_id, 'Salary Deposit');
    -- Update closing balance for May 15
    UPDATE account_service.daily_balances SET closing_balance = 45796.67 WHERE account_id = v_savings_account_id AND record_date = '2026-05-15';

    -- Monthly Interest (May 31)
    INSERT INTO account_service.transactions (account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, branch_id, reference)
    VALUES (v_savings_account_id, 'INTEREST', 120.00, 45916.67, v_member_id, '2026-05-31 23:59:59', v_branch_id, 'Monthly Interest - May');
    INSERT INTO account_service.daily_balances (id, account_id, record_date, closing_balance, annual_interest_rate) 
    VALUES (gen_random_uuid(), v_savings_account_id, '2026-05-31', 45916.67, 0.0600);

    -- FD Monthly Interest (June 15)
    INSERT INTO account_service.transactions (account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, branch_id, reference)
    VALUES (v_savings_account_id, 'FD_MONTHLY_INTEREST', 916.67, 46833.34, v_member_id, '2026-06-15 00:01:00', v_branch_id, 'FD Interest - FD89901011');
    INSERT INTO account_service.daily_balances (id, account_id, record_date, closing_balance, annual_interest_rate) 
    VALUES (gen_random_uuid(), v_savings_account_id, '2026-06-15', 46833.34, 0.0600);

END $$;
