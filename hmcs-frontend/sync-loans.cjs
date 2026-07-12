const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  password: 'postgres',
  host: 'localhost',
  port: 5432,
  database: 'hmcs_db'
});

async function run() {
  try {
    await client.connect();

    // Copy loan types
    const resLoans = await client.query(`
      INSERT INTO loan_service.loan_types (loan_type_id, name, description, interest_rate, max_amount, max_term_months, is_active, eligibility_criteria, created_at, updated_at, tenant_id)
      SELECT gen_random_uuid(), lt.name, lt.description, lt.interest_rate, lt.max_amount, lt.max_term_months, lt.is_active, lt.eligibility_criteria, now(), now(), o.organization_id
      FROM loan_service.loan_types lt
      CROSS JOIN auth_service.organizations o
      WHERE lt.tenant_id = 1
        AND o.organization_id != 1
        AND NOT EXISTS (
            SELECT 1 FROM loan_service.loan_types lt2 
            WHERE lt2.tenant_id = o.organization_id 
              AND lt2.name = lt.name
        );
    `);
    console.log(`Copied ${resLoans.rowCount} loan types to other tenants.`);

    // Copy pawning settings
    const resPawning = await client.query(`
      INSERT INTO pawning_service.pawning_settings (setting_key, setting_value, description, tenant_id)
      SELECT ps.setting_key, ps.setting_value, ps.description, o.organization_id
      FROM pawning_service.pawning_settings ps
      CROSS JOIN auth_service.organizations o
      WHERE ps.tenant_id = 1
        AND o.organization_id != 1
        AND NOT EXISTS (
            SELECT 1 FROM pawning_service.pawning_settings ps2 
            WHERE ps2.tenant_id = o.organization_id 
              AND ps2.setting_key = ps.setting_key
        );
    `);
    console.log(`Copied ${resPawning.rowCount} pawning settings to other tenants.`);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
