const { Client } = require('pg');

const client = new Client({
  user: 'hmcs_app',
  host: 'hmcs-postgres',
  database: 'hmcs_db',
  password: 'hmcs_secure_pass_2026',
  port: 5432,
});

async function run() {
  await client.connect();
  console.log('Connected to DB');

  try {
    await client.query('BEGIN');

    // Get all ACTIVE FDs
    const res = await client.query(`SELECT * FROM account_service.fixed_deposits WHERE status = 'ACTIVE'`);
    const fds = res.rows;
    let totalCredited = 0;
    
    for (const fd of fds) {
      if (!fd.principal_amount || !fd.interest_rate) continue;
      
      const openedDate = new Date(fd.opened_date);
      const today = new Date(); 
      const lastPayout = fd.last_interest_payout_date ? new Date(fd.last_interest_payout_date) : openedDate;
      
      const diffTime = today.getTime() - lastPayout.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) continue;
      
      const principal = parseFloat(fd.principal_amount);
      const rate = parseFloat(fd.interest_rate) / 100;
      const dailyInterest = (principal * rate) / 365.0; 
      
      const totalMissedInterest = dailyInterest * diffDays;
      
      // True accumulated interest should exactly equal the days passed
      let accumulated = totalMissedInterest;
      
      if (fd.interest_payout_method === 'MONTHLY') {
         const nextPayout = new Date(lastPayout);
         nextPayout.setMonth(nextPayout.getMonth() + 1);
         
         if (today >= nextPayout) {
             if (fd.linked_savings_account_id) {
                 const savingsRes = await client.query(`SELECT balance, status FROM account_service.savings_accounts WHERE account_id = $1`, [fd.linked_savings_account_id]);
                 if (savingsRes.rows.length > 0 && savingsRes.rows[0].status === 'ACTIVE') {
                     let netAmount = accumulated;
                     if (fd.has_submitted_tax_form === false) {
                         netAmount = accumulated * 0.90; // 10% WHT
                     }
                     
                     // Insert transaction
                     await client.query(`
                       INSERT INTO account_service.transactions 
                       (transaction_id, account_id, amount, balance_after, transaction_type, reference, transaction_timestamp, tenant_id, branch_id, processed_by)
                       VALUES (gen_random_uuid(), $1, $2, $3, 'FD_MONTHLY_INTEREST', $4, CURRENT_TIMESTAMP, $5, $6, 'SYSTEM')
                     `, [
                         fd.linked_savings_account_id,
                         netAmount.toFixed(2),
                         (parseFloat(savingsRes.rows[0].balance) + netAmount).toFixed(2),
                         fd.fd_number + ' MONTHLY CATCHUP',
                         fd.tenant_id,
                         fd.branch_id
                     ]);
                     
                     // Update savings balance
                     await client.query(`
                       UPDATE account_service.savings_accounts 
                       SET balance = balance + $1 
                       WHERE account_id = $2
                     `, [netAmount.toFixed(2), fd.linked_savings_account_id]);
                     
                     totalCredited += netAmount;
                     console.log(`Paid out Rs. ${netAmount.toFixed(2)} to savings account for FD ${fd.fd_number}`);
                     
                     // Reset accumulated and update last payout date to today
                     accumulated = 0;
                     await client.query(`
                        UPDATE account_service.fixed_deposits 
                        SET accumulated_interest = 0, last_interest_payout_date = CURRENT_DATE 
                        WHERE fd_id = $1
                     `, [fd.fd_id]);
                 }
             }
         } else {
             // Update accumulated interest only
             await client.query(`
                UPDATE account_service.fixed_deposits 
                SET accumulated_interest = $1 
                WHERE fd_id = $2
             `, [accumulated.toFixed(2), fd.fd_id]);
         }
      } else {
         // Maturity - just accrue
         await client.query(`
            UPDATE account_service.fixed_deposits 
            SET accumulated_interest = $1 
            WHERE fd_id = $2
         `, [accumulated.toFixed(2), fd.fd_id]);
      }
    }
    
    await client.query('COMMIT');
    console.log(`Successfully completed! Total Credited to Savings: Rs. ${totalCredited.toFixed(2)}`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

run();
