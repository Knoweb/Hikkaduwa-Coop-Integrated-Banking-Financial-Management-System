UPDATE account_service.savings_accounts sa
SET balance = sa.balance - t.total_amount
FROM (
    SELECT account_id, SUM(amount) as total_amount
    FROM account_service.transactions
    WHERE transaction_type IN ('INTEREST', 'MONTHLY_INTEREST')
      AND transaction_timestamp > '2026-07-25 23:59:59'
    GROUP BY account_id
) t
WHERE sa.account_id = t.account_id;

DELETE FROM account_service.transactions
WHERE transaction_type IN ('INTEREST', 'MONTHLY_INTEREST')
  AND transaction_timestamp > '2026-07-25 23:59:59';
