WITH non_member_accounts AS (
    SELECT s.account_id, row_number() over() as rn
    FROM account_service.savings_accounts s
    JOIN member_service.members m ON s.member_id = m.member_id
    WHERE s.branch_id = 4 AND m.is_member = false AND s.account_type = 'NORMAL'
)
UPDATE account_service.savings_accounts
SET account_type = CASE 
    WHEN rn <= 3 THEN 'ARUNALU'
    WHEN rn <= 6 THEN 'RANTHILINA'
    WHEN rn <= 9 THEN 'JANASETHA'
    WHEN rn <= 12 THEN 'VANDANA'
    WHEN rn <= 15 THEN 'DHANA_YOJANA'
    ELSE 'NORMAL'
END
FROM non_member_accounts
WHERE account_service.savings_accounts.account_id = non_member_accounts.account_id;
