const { Client } = require('pg');

const client = new Client({
  user: 'hmcs_app',
  host: 'localhost',
  database: 'hmcs_db',
  password: 'hmcs_secure_pass_2026',
  port: 5432,
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  try {
    // Get accounts
    const accRes = await client.query(`SELECT account_id, opened_date, tenant_id FROM account_service.savings_accounts WHERE branch_id IN (1, 2, 3, 4)`);
    const accounts = accRes.rows;

    // Get transactions
    const txnRes = await client.query(`
      SELECT account_id, transaction_timestamp::date as txn_date, balance_after
      FROM account_service.transactions
      WHERE branch_id IN (1, 2, 3, 4)
      ORDER BY transaction_timestamp ASC, transaction_id ASC
    `);
    
    // Group transactions by account
    const txnsByAccount = {};
    for (const txn of txnRes.rows) {
      if (!txnsByAccount[txn.account_id]) txnsByAccount[txn.account_id] = [];
      
      // format date nicely
      const d = new Date(txn.txn_date);
      const dateStr = d.toISOString().split('T')[0];
      
      txnsByAccount[txn.account_id].push({
        date: dateStr,
        balance: txn.balance_after
      });
    }

    console.log('Fetched data. Calculating daily balances...');

    const todayStr = new Date().toISOString().split('T')[0];
    const insertValues = [];
    
    for (const acc of accounts) {
      let currentDate = new Date(acc.opened_date);
      let currentBalance = 0;
      const txns = txnsByAccount[acc.account_id] || [];
      let txnIdx = 0;

      while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        if (dateStr > todayStr) break;

        // Apply any transactions for today
        while (txnIdx < txns.length && txns[txnIdx].date <= dateStr) {
          currentBalance = txns[txnIdx].balance;
          txnIdx++;
        }

        insertValues.push(`(gen_random_uuid(), '${acc.account_id}', 0.048, ${currentBalance}, '${dateStr}', ${acc.tenant_id})`);
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    console.log(`Generated ${insertValues.length} rows. Deleting old balances...`);
    await client.query(`DELETE FROM account_service.daily_balances WHERE account_id IN (SELECT account_id FROM account_service.savings_accounts WHERE branch_id IN (1, 2, 3, 4))`);

    console.log('Inserting new balances in batches of 10000...');
    const batchSize = 10000;
    for (let i = 0; i < insertValues.length; i += batchSize) {
      const batch = insertValues.slice(i, i + batchSize);
      await client.query(`INSERT INTO account_service.daily_balances (id, account_id, annual_interest_rate, closing_balance, record_date, tenant_id) VALUES ${batch.join(',')}`);
    }

    console.log('Done!');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
