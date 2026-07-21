const { Client } = require('pg');

async function fixLoan() {
  const client = new Client({
    user: 'hmcs_app',
    host: 'localhost',
    database: 'hmcs_db',
    password: 'hmcs_secure_pass_2026',
    port: 5432,
  });

  try {
    await client.connect();

    const loanId = '38149cbe-923a-403e-a533-279f0f68b926'; // P. Chathuranga

    // 1. Update term_months to 12
    await client.query(`UPDATE loan_service.loans SET term_months = 12 WHERE loan_id = $1`, [loanId]);
    console.log('Updated term_months to 12');

    // 2. Fetch loan details
    const loanRes = await client.query(`SELECT approved_amount, interest_rate, applied_date FROM loan_service.loans WHERE loan_id = $1`, [loanId]);
    const loan = loanRes.rows[0];
    
    // 3. Delete existing schedules
    await client.query(`DELETE FROM loan_service.loan_schedules WHERE loan_id = $1`, [loanId]);
    console.log('Deleted existing schedules');

    // 4. Generate 12 new schedules
    const principal = parseFloat(loan.approved_amount);
    const annualRate = parseFloat(loan.interest_rate);
    const termMonths = 12;
    const startDate = new Date(loan.applied_date);

    const monthlyPrincipal = Math.round((principal / termMonths) * 100) / 100;
    const dailyRate = annualRate / 36500;
    let outstandingBalance = principal;
    
    let previousDate = new Date(startDate);
    
    for (let i = 1; i <= termMonths; i++) {
        let dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        // actual days
        const timeDiff = dueDate.getTime() - previousDate.getTime();
        const actualDays = Math.round(timeDiff / (1000 * 3600 * 24));
        
        let interest = Math.round((outstandingBalance * dailyRate * actualDays) * 100) / 100;
        let expectedPrincipal = monthlyPrincipal;
        
        if (i === termMonths) {
            expectedPrincipal = outstandingBalance;
        }
        
        let emi = Math.round((expectedPrincipal + interest) * 100) / 100;
        outstandingBalance = Math.round((outstandingBalance - expectedPrincipal) * 100) / 100;
        if (outstandingBalance < 0) outstandingBalance = 0;

        const scheduleId = require('crypto').randomUUID();
        const dueDateStr = dueDate.toISOString().split('T')[0];

        await client.query(`
            INSERT INTO loan_service.loan_schedules 
            (id, loan_id, installment_number, due_date, expected_principal, expected_interest, total_expected_amount, outstanding_balance, status, tenant_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [scheduleId, loanId, i, dueDateStr, expectedPrincipal, interest, emi, outstandingBalance, 'PENDING', 1]);
        
        previousDate = new Date(dueDate);
    }
    
    console.log('Created 12 new schedules successfully!');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

fixLoan();
