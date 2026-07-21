const { Client } = require('pg');

const client = new Client({
  user: 'hmcs_app',
  host: 'localhost',
  database: 'hmcs_db',
  password: 'hmcs_secure_pass_2026',
  port: 5432,
});

async function main() {
  await client.connect();

  try {
    const result = await client.query('SELECT * FROM loan_service.loans WHERE tenant_id = 1 ORDER BY created_at ASC');
    const loans = result.rows;
    console.log(`Found ${loans.length} loans for branch 1`);

    let i = 0;
    for (const loan of loans) {
      if (i < 5) {
        const appliedDate = new Date('2022-01-15T10:00:00Z');
        const approvedDate = new Date('2022-01-20T10:00:00Z');
        
        await client.query(`
          UPDATE loan_service.loans 
          SET applied_date = $1, approved_date = $2, status = 'COMPLETED', outstanding_balance = 0, created_at = $1, updated_at = $1
          WHERE id = $3
        `, [appliedDate, approvedDate, loan.id]);
        console.log(`Set loan ${loan.id} as COMPLETED in 2022.`);
      } else {
        const appliedDate = new Date('2025-11-15T10:00:00Z');
        const approvedDate = new Date('2025-11-20T10:00:00Z');
        const outstanding = loan.loan_amount * 0.7; // 30% paid off

        await client.query(`
          UPDATE loan_service.loans 
          SET applied_date = $1, approved_date = $2, status = 'ACTIVE', outstanding_balance = $3, created_at = $1, updated_at = $1
          WHERE id = $4
        `, [appliedDate, approvedDate, outstanding, loan.id]);
        console.log(`Set loan ${loan.id} as ACTIVE in 2025 with outstanding ${outstanding}.`);
      }
      i++;
    }

  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

main();
