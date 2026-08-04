-- 1. Fix Savings Accounts: Update all savings_accounts to use the correct interest_rate from savings_account_type for their respective tenant.
UPDATE account_service.savings_accounts sa
SET annual_interest_rate = sat.interest_rate
FROM account_service.savings_account_type sat
WHERE sa.account_type = sat.code AND sa.tenant_id = sat.tenant_id;

-- 2. Fix Daily Balances: Update all daily_balances to inherit the fixed annual_interest_rate from their parent savings_accounts.
UPDATE account_service.daily_balances db
SET annual_interest_rate = sa.annual_interest_rate
FROM account_service.savings_accounts sa
WHERE db.account_id = sa.account_id AND db.tenant_id = sa.tenant_id;

-- 3. Fix Fixed Deposits: Update all fixed_deposits to use the correct interest rate from fixed_deposit_types.
UPDATE account_service.fixed_deposits fd
SET interest_rate = CASE 
    WHEN fd.interest_payout_method = 'MONTHLY' THEN fdt.interest_rate_monthly
    ELSE fdt.interest_rate_maturity
END
FROM account_service.fixed_deposit_types fdt
WHERE fd.type_id = fdt.id AND fd.tenant_id = fdt.tenant_id;
