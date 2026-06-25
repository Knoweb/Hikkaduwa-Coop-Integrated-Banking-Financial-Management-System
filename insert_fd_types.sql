INSERT INTO account_service.fixed_deposit_types (id, code, interest_rate_maturity, interest_rate_monthly, is_active, is_senior_citizen, name, term_months)
SELECT gen_random_uuid(), REPLACE(code, 'FD_NRM', 'FD_JAY'), interest_rate_maturity, interest_rate_monthly, is_active, is_senior_citizen, 'ජය ස්ථාවර තැන්පතු - ' || SPLIT_PART(name, ' - ', 2), term_months FROM account_service.fixed_deposit_types WHERE code LIKE 'FD_NRM_%';

INSERT INTO account_service.fixed_deposit_types (id, code, interest_rate_maturity, interest_rate_monthly, is_active, is_senior_citizen, name, term_months)
SELECT gen_random_uuid(), REPLACE(code, 'FD_NRM', 'FD_SIY'), interest_rate_maturity, interest_rate_monthly, is_active, is_senior_citizen, 'සියවස් ස්ථාවර තැන්පතු - ' || SPLIT_PART(name, ' - ', 2), term_months FROM account_service.fixed_deposit_types WHERE code LIKE 'FD_NRM_%';

INSERT INTO account_service.fixed_deposit_types (id, code, interest_rate_maturity, interest_rate_monthly, is_active, is_senior_citizen, name, term_months)
SELECT gen_random_uuid(), REPLACE(code, 'FD_NRM', 'FD_YAL'), interest_rate_maturity, interest_rate_monthly, is_active, is_senior_citizen, 'යළි ගොඩණැගෙමු ස්ථාවර තැන්පතු - ' || SPLIT_PART(name, ' - ', 2), term_months FROM account_service.fixed_deposit_types WHERE code LIKE 'FD_NRM_%';

INSERT INTO account_service.fixed_deposit_types (id, code, interest_rate_maturity, interest_rate_monthly, is_active, is_senior_citizen, name, term_months)
SELECT gen_random_uuid(), REPLACE(code, 'FD_NRM', 'FD_JAN'), interest_rate_maturity, interest_rate_monthly, is_active, is_senior_citizen, 'ජංගම සේවක ස්ථාවර තැන්පතු - ' || SPLIT_PART(name, ' - ', 2), term_months FROM account_service.fixed_deposit_types WHERE code LIKE 'FD_NRM_%';

INSERT INTO account_service.fixed_deposit_types (id, code, interest_rate_maturity, interest_rate_monthly, is_active, is_senior_citizen, name, term_months)
SELECT gen_random_uuid(), REPLACE(code, 'FD_NRM', 'FD_KOT'), interest_rate_maturity, interest_rate_monthly, is_active, is_senior_citizen, 'කොටස් මුදල් ස්ථාවර තැන්පතු - ' || SPLIT_PART(name, ' - ', 2), term_months FROM account_service.fixed_deposit_types WHERE code LIKE 'FD_NRM_%';

INSERT INTO account_service.fixed_deposit_types (id, code, interest_rate_maturity, interest_rate_monthly, is_active, is_senior_citizen, name, term_months)
SELECT gen_random_uuid(), REPLACE(code, 'FD_NRM', 'FD_ROO'), interest_rate_maturity, interest_rate_monthly, is_active, is_senior_citizen, 'රූ බෑන්ක් ප්ලස් ස්ථාවර තැන්පතු - ' || SPLIT_PART(name, ' - ', 2), term_months FROM account_service.fixed_deposit_types WHERE code LIKE 'FD_NRM_%';
