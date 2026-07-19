update loan_service.loans set application_data = jsonb_set(COALESCE(application_data, '{}'::jsonb), '{disbursementMethod}', '"CASH"'::jsonb) where account_number = 'LN555512';
