-- Revert all first
UPDATE account_service.savings_accounts
SET account_type = 'NORMAL'
WHERE branch_id = 4 AND account_type IN ('JANASETHA', 'DHANA_YOJANA', 'VANDANA');

-- Now update exactly 5
WITH to_update AS (
    SELECT account_id FROM account_service.savings_accounts WHERE branch_id = 4 AND account_type = 'NORMAL' LIMIT 5
)
UPDATE account_service.savings_accounts a
SET account_type = CASE
    WHEN r.rn <= 2 THEN 'JANASETHA'
    WHEN r.rn = 3 THEN 'DHANA_YOJANA'
    ELSE 'VANDANA'
END
FROM (
    SELECT account_id, row_number() over() as rn FROM to_update
) r
WHERE a.account_id = r.account_id;
