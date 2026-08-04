UPDATE account_service.savings_accounts sa
SET annual_interest_rate = sat.interest_rate
FROM account_service.savings_account_type sat
WHERE UPPER(sa.account_type) = UPPER(sat.code) AND sat.tenant_id = sa.tenant_id;

UPDATE account_service.savings_accounts
SET annual_interest_rate = (SELECT interest_rate FROM account_service.savings_account_type WHERE code = 'NORMAL' AND tenant_id = savings_accounts.tenant_id LIMIT 1)
WHERE UPPER(account_type) = 'SAMANAYA';
