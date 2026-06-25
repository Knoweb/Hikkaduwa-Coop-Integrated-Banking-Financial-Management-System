DO $$ 
DECLARE 
    v_member_id UUID;
    v_savings_account_id UUID := gen_random_uuid();
    v_fd_account_id UUID := gen_random_uuid();
    v_branch_id INT := 1;
    v_fd_type_id UUID;
    v_current_date DATE;
    v_end_date DATE := '2026-06-25';
    v_balance NUMERIC := 25000.00;
    v_monthly_interest NUMERIC;
BEGIN
    -- Get Member ID for M002 (A real Member)
    SELECT member_id INTO v_member_id FROM member_service.members WHERE membership_number = 'M002' LIMIT 1;

    IF v_member_id IS NULL THEN
        RAISE EXCEPTION 'Member M002 not found in database.';
    END IF;

    -- Get FD Type ID for Normal 2 Year FD
    SELECT id INTO v_fd_type_id FROM account_service.fixed_deposit_types WHERE code = 'FD_NRM_24M' LIMIT 1;

    -- Clean up previous mock data for this account number if it exists
    DELETE FROM account_service.transactions WHERE account_id IN (SELECT account_id FROM account_service.savings_accounts WHERE account_number = '89902022');
    DELETE FROM account_service.daily_balances WHERE account_id IN (SELECT account_id FROM account_service.savings_accounts WHERE account_number = '89902022');
    DELETE FROM account_service.fixed_deposits WHERE linked_savings_account_id IN (SELECT account_id FROM account_service.savings_accounts WHERE account_number = '89902022');
    DELETE FROM account_service.savings_accounts WHERE account_number = '89902022';

    -- 1. Create Savings Account (Opened 2 years ago: 2024-07-10)
    INSERT INTO account_service.savings_accounts (
        account_id, account_number, member_id, account_mode, mode_of_operation,
        account_type, balance, initial_deposit, branch_id, created_at, opened_date, status, annual_interest_rate
    ) VALUES (
        v_savings_account_id, '89902022', v_member_id, 'SINGLE', 'SELF',
        'SAMANAYA', v_balance, 25000.00, v_branch_id, '2024-07-10 10:00:00', '2024-07-10', 'ACTIVE', 0.0600
    );

    -- 2. Create Fixed Deposit (Opened 2 years ago: 2024-07-10, Matures: 2026-07-10)
    INSERT INTO account_service.fixed_deposits (
        fd_id, fd_number, member_id, type_id, branch_id,
        principal_amount, interest_rate, term_months, interest_payout_method,
        maturity_instruction, opened_date, maturity_date, last_interest_payout_date,
        status, linked_savings_account_id, has_submitted_tax_form, created_at
    ) VALUES (
        v_fd_account_id, 'FD89902022', v_member_id, v_fd_type_id, v_branch_id,
        500000.00, 13.00, 24, 'MATURITY',
        'REINVEST_PRINCIPAL_AND_INTEREST', '2024-07-10', '2026-07-10', NULL,
        'ACTIVE', v_savings_account_id, true, '2024-07-10 10:00:00'
    );

    -- 3. Insert Initial Transaction for Savings Account
    INSERT INTO account_service.transactions (account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, branch_id, reference)
    VALUES (v_savings_account_id, 'INITIAL_DEPOSIT', 25000.00, 25000.00, v_member_id, '2024-07-10 10:00:00', v_branch_id, 'Initial Deposit');
    
    INSERT INTO account_service.daily_balances (id, account_id, record_date, closing_balance, annual_interest_rate) 
    VALUES (gen_random_uuid(), v_savings_account_id, '2024-07-10', 25000.00, 0.0600);

    -- 4. Loop to insert Monthly Interest up to last month
    v_current_date := '2024-07-31';
    WHILE v_current_date < v_end_date LOOP
        -- Calculate simple 6% annual interest (0.5% per month) on current balance
        v_monthly_interest := ROUND((v_balance * 0.06 / 12), 2);
        v_balance := v_balance + v_monthly_interest;

        -- Insert Interest Transaction
        INSERT INTO account_service.transactions (account_id, transaction_type, amount, balance_after, processed_by, transaction_timestamp, branch_id, reference)
        VALUES (v_savings_account_id, 'MONTHLY_INTEREST', v_monthly_interest, v_balance, v_member_id, v_current_date + interval '23 hours 59 mins', v_branch_id, 'Monthly Interest');

        -- Move to the last day of the next month
        v_current_date := (date_trunc('month', v_current_date) + interval '2 month - 1 day')::date;
    END LOOP;

    -- Update the savings account final balance
    UPDATE account_service.savings_accounts SET balance = v_balance WHERE account_id = v_savings_account_id;

END $$;
