DO $$
BEGIN
    DELETE FROM account_service.daily_balances 
    WHERE account_id IN (SELECT account_id FROM account_service.savings_accounts WHERE branch_id IN (1, 2, 3, 4));
    
    INSERT INTO account_service.daily_balances (id, account_id, annual_interest_rate, closing_balance, record_date, tenant_id)
    SELECT 
        gen_random_uuid(),
        d.account_id,
        0.048,
        COALESCE(
            (SELECT balance_after 
             FROM account_service.transactions t 
             WHERE t.account_id = d.account_id 
               AND t.transaction_timestamp < (d.record_date + INTERVAL '1 day')
             ORDER BY t.transaction_timestamp DESC, t.transaction_id DESC 
             LIMIT 1), 
             0
        ),
        d.record_date,
        d.tenant_id
    FROM (
        SELECT a.account_id, a.tenant_id, gs.record_date::date
        FROM account_service.savings_accounts a
        CROSS JOIN generate_series(a.opened_date::date, CURRENT_DATE, '1 day'::interval) AS gs(record_date)
        WHERE a.branch_id IN (1, 2, 3, 4)
    ) d;
END $$;
