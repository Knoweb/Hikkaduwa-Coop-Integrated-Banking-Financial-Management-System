DO $$
BEGIN
    DELETE FROM account_service.daily_balances 
    WHERE account_id IN (SELECT account_id FROM account_service.savings_accounts WHERE branch_id IN (1, 2, 3, 4));
    
    INSERT INTO account_service.daily_balances (id, account_id, annual_interest_rate, closing_balance, record_date, tenant_id)
    WITH AllDays AS (
        SELECT a.account_id, a.tenant_id, gs.record_date::date
        FROM account_service.savings_accounts a
        CROSS JOIN generate_series(a.opened_date::date, CURRENT_DATE, '1 day'::interval) AS gs(record_date)
        WHERE a.branch_id IN (1, 2, 3, 4)
    ),
    TxnSummaries AS (
        SELECT account_id, transaction_timestamp::date as txn_date,
               (array_agg(balance_after ORDER BY transaction_timestamp DESC, transaction_id DESC))[1] as end_of_day_balance
        FROM account_service.transactions
        WHERE branch_id IN (1, 2, 3, 4)
        GROUP BY account_id, transaction_timestamp::date
    ),
    JoinedDays AS (
        SELECT 
            ad.account_id, 
            ad.tenant_id, 
            ad.record_date,
            ts.end_of_day_balance,
            max(ts.txn_date) OVER (PARTITION BY ad.account_id ORDER BY ad.record_date ROWS UNBOUNDED PRECEDING) as last_txn_date
        FROM AllDays ad
        LEFT JOIN TxnSummaries ts ON ad.account_id = ts.account_id AND ad.record_date = ts.txn_date
    ),
    FilledBalances AS (
        SELECT 
            jd.account_id, 
            jd.tenant_id, 
            jd.record_date,
            COALESCE(ts.end_of_day_balance, 0) as closing_balance
        FROM JoinedDays jd
        LEFT JOIN TxnSummaries ts ON jd.account_id = ts.account_id AND jd.last_txn_date = ts.txn_date
    )
    SELECT 
        gen_random_uuid(),
        account_id,
        0.048,
        closing_balance,
        record_date,
        tenant_id
    FROM FilledBalances;
END $$;
