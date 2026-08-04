WITH numbered_fds AS (
    SELECT fd_id, row_number() over(ORDER BY fd_id) as rn
    FROM account_service.fixed_deposits
    WHERE branch_id = 4
)
UPDATE account_service.fixed_deposits
SET 
    status = CASE 
        WHEN rn <= 5 THEN 'MATURED'
        ELSE 'ACTIVE'
    END,
    opened_date = CASE 
        WHEN rn <= 5 THEN '2025-06-01'::date
        WHEN rn <= 10 THEN '2025-08-01'::date
        WHEN rn <= 15 THEN CURRENT_DATE - INTERVAL '15 days'
        ELSE CURRENT_DATE - INTERVAL '2 months'
    END,
    maturity_date = CASE 
        WHEN rn <= 5 THEN '2026-06-01'::date
        WHEN rn <= 10 THEN CURRENT_DATE + INTERVAL '10 days'
        WHEN rn <= 15 THEN CURRENT_DATE + INTERVAL '12 months' - INTERVAL '15 days'
        ELSE CURRENT_DATE + INTERVAL '6 months' - INTERVAL '2 months'
    END,
    interest_payout_method = CASE
        WHEN rn % 2 = 0 THEN 'MONTHLY'
        ELSE 'AT_MATURITY'
    END
FROM numbered_fds
WHERE account_service.fixed_deposits.fd_id = numbered_fds.fd_id;
