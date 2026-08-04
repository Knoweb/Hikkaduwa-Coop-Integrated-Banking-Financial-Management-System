DO $$ 
DECLARE
    fd RECORD;
    v_diff_days INT;
    v_daily_interest NUMERIC;
    v_total_missed NUMERIC;
    v_next_payout DATE;
    v_net_amount NUMERIC;
    v_savings_balance NUMERIC;
    v_savings_status VARCHAR;
BEGIN
    FOR fd IN SELECT * FROM account_service.fixed_deposits WHERE status = 'ACTIVE' 
    LOOP
        IF fd.principal_amount IS NULL OR fd.interest_rate IS NULL THEN
            CONTINUE;
        END IF;

        -- Calculate diff days
        IF fd.last_interest_payout_date IS NOT NULL THEN
            v_diff_days := CURRENT_DATE - fd.last_interest_payout_date;
        ELSE
            v_diff_days := CURRENT_DATE - fd.opened_date;
        END IF;

        IF v_diff_days <= 0 THEN
            CONTINUE;
        END IF;

        -- Calculate missed interest
        v_daily_interest := (fd.principal_amount * (fd.interest_rate / 100.0)) / 365.0;
        v_total_missed := v_daily_interest * v_diff_days;

        IF fd.interest_payout_method = 'MONTHLY' THEN
            -- Check if 1 month has passed
            IF fd.last_interest_payout_date IS NOT NULL THEN
                v_next_payout := fd.last_interest_payout_date + INTERVAL '1 month';
            ELSE
                v_next_payout := fd.opened_date + INTERVAL '1 month';
            END IF;

            IF CURRENT_DATE >= v_next_payout THEN
                -- Payout time!
                IF fd.linked_savings_account_id IS NOT NULL THEN
                    SELECT balance, status INTO v_savings_balance, v_savings_status 
                    FROM account_service.savings_accounts 
                    WHERE account_id = fd.linked_savings_account_id;

                    IF FOUND AND v_savings_status = 'ACTIVE' THEN
                        v_net_amount := v_total_missed;
                        IF fd.has_submitted_tax_form = false THEN
                            v_net_amount := v_total_missed * 0.90;
                        END IF;

                        v_net_amount := ROUND(v_net_amount, 2);

                        -- Insert transaction
                        INSERT INTO account_service.transactions 
                        (transaction_id, account_id, amount, balance_after, transaction_type, reference, transaction_timestamp, tenant_id, branch_id, processed_by)
                        VALUES (
                            gen_random_uuid(), 
                            fd.linked_savings_account_id, 
                            v_net_amount, 
                            v_savings_balance + v_net_amount, 
                            'FD_MONTHLY_INTEREST', 
                            fd.fd_number || ' MONTHLY CATCHUP', 
                            CURRENT_TIMESTAMP, 
                            fd.tenant_id, 
                            fd.branch_id, 
                            '00000000-0000-0000-0000-000000000000'
                        );

                        -- Update savings account balance
                        UPDATE account_service.savings_accounts 
                        SET balance = balance + v_net_amount 
                        WHERE account_id = fd.linked_savings_account_id;

                        -- Reset FD accumulated and last payout date
                        UPDATE account_service.fixed_deposits 
                        SET accumulated_interest = 0, last_interest_payout_date = CURRENT_DATE 
                        WHERE fd_id = fd.fd_id;
                        
                        RAISE NOTICE 'Paid % to %', v_net_amount, fd.linked_savings_account_id;
                    END IF;
                END IF;
            ELSE
                -- Just accrue
                UPDATE account_service.fixed_deposits 
                SET accumulated_interest = v_total_missed 
                WHERE fd_id = fd.fd_id;
            END IF;
        ELSE
            -- Maturity just accrue
            UPDATE account_service.fixed_deposits 
            SET accumulated_interest = v_total_missed 
            WHERE fd_id = fd.fd_id;
        END IF;

    END LOOP;
END $$;
