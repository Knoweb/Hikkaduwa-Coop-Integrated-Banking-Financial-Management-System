DO $$ 
DECLARE
    fd RECORD;
    v_start_date DATE;
    v_next_payout DATE;
    v_current_date DATE := CURRENT_DATE;
    v_daily_interest NUMERIC;
    v_days_in_month INT;
    v_month_interest NUMERIC;
    v_net_amount NUMERIC;
    v_savings_balance NUMERIC;
    v_savings_status VARCHAR;
    v_tx_count INT := 0;
BEGIN
    FOR fd IN SELECT * FROM account_service.fixed_deposits WHERE status = 'ACTIVE' AND interest_payout_method = 'MONTHLY'
    LOOP
        IF fd.principal_amount IS NULL OR fd.interest_rate IS NULL THEN
            CONTINUE;
        END IF;

        v_start_date := fd.opened_date;
        v_next_payout := v_start_date + INTERVAL '1 month';
        v_daily_interest := (fd.principal_amount * (fd.interest_rate / 100.0)) / 365.0;

        WHILE v_next_payout <= v_current_date LOOP
            v_days_in_month := v_next_payout - v_start_date;
            v_month_interest := v_daily_interest * v_days_in_month;
            
            IF fd.linked_savings_account_id IS NOT NULL THEN
                -- Ensure we don't double-pay if a transaction already exists for this exact date
                IF NOT EXISTS (
                    SELECT 1 FROM account_service.transactions 
                    WHERE account_id = fd.linked_savings_account_id 
                      AND transaction_type = 'FD_MONTHLY_INTEREST' 
                      AND DATE(transaction_timestamp) = v_next_payout
                ) THEN
                    SELECT balance, status INTO v_savings_balance, v_savings_status 
                    FROM account_service.savings_accounts 
                    WHERE account_id = fd.linked_savings_account_id;

                    IF FOUND AND v_savings_status = 'ACTIVE' THEN
                        v_net_amount := v_month_interest;
                        IF fd.has_submitted_tax_form = false THEN
                            v_net_amount := v_month_interest * 0.90; -- 10% Withholding Tax
                        END IF;
                        v_net_amount := ROUND(v_net_amount, 2);

                        INSERT INTO account_service.transactions 
                        (transaction_id, account_id, amount, balance_after, transaction_type, reference, transaction_timestamp, tenant_id, branch_id, processed_by)
                        VALUES (
                            gen_random_uuid(), 
                            fd.linked_savings_account_id, 
                            v_net_amount, 
                            v_savings_balance + v_net_amount, 
                            'FD_MONTHLY_INTEREST', 
                            fd.fd_number || ' INTEREST',
                            v_next_payout + TIME '00:00:00',
                            fd.tenant_id, 
                            fd.branch_id, 
                            '00000000-0000-0000-0000-000000000000'
                        );

                        UPDATE account_service.savings_accounts 
                        SET balance = balance + v_net_amount 
                        WHERE account_id = fd.linked_savings_account_id;
                        
                        v_tx_count := v_tx_count + 1;
                    END IF;
                END IF;
            END IF;

            v_start_date := v_next_payout;
            v_next_payout := v_next_payout + INTERVAL '1 month';
        END LOOP;
        
        -- Update FD to point to the last completed month payout
        UPDATE account_service.fixed_deposits 
        SET last_interest_payout_date = v_start_date, accumulated_interest = 0
        WHERE fd_id = fd.fd_id;
        
    END LOOP;
    RAISE NOTICE 'Inserted % historical transactions', v_tx_count;
END $$;
