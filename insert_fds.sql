INSERT INTO account_service.fixed_deposit_types (id, code, interest_rate_maturity, interest_rate_monthly, is_active, is_senior_citizen, name, term_months)
SELECT * FROM (VALUES
  ('b191c94d-7db1-4e78-9e5d-111111111111'::uuid, 'FD_NRM_1M', 0.0, 0.0, true, false, 'සාමාන්‍ය ස්ථාවර තැන්පතු - මාස 1', 1),
  ('b191c94d-7db1-4e78-9e5d-111111111112'::uuid, 'FD_NRM_2M', 0.0, 0.0, true, false, 'සාමාන්‍ය ස්ථාවර තැන්පතු - මාස 2', 2),
  ('b191c94d-7db1-4e78-9e5d-111111111113'::uuid, 'FD_NRM_6M', 0.0, 0.0, true, false, 'සාමාන්‍ය ස්ථාවර තැන්පතු - මාස 6', 6),
  ('b191c94d-7db1-4e78-9e5d-111111111114'::uuid, 'FD_NRM_24M', 0.0, 0.0, true, false, 'සාමාන්‍ය ස්ථාවර තැන්පතු - අවුරුදු 2', 24),
  ('b191c94d-7db1-4e78-9e5d-111111111115'::uuid, 'FD_NRM_60M', 0.0, 0.0, true, false, 'සාමාන්‍ය ස්ථාවර තැන්පතු - අවුරුදු 5', 60),

  ('b191c94d-7db1-4e78-9e5d-111111111116'::uuid, 'FD_SNR_1M', 0.0, 0.0, true, true, 'ජ්‍යෙෂ්ඨ පුරවැසි තැන්පතු - මාස 1', 1),
  ('b191c94d-7db1-4e78-9e5d-111111111117'::uuid, 'FD_SNR_2M', 0.0, 0.0, true, true, 'ජ්‍යෙෂ්ඨ පුරවැසි තැන්පතු - මාස 2', 2),
  ('b191c94d-7db1-4e78-9e5d-111111111118'::uuid, 'FD_SNR_3M', 0.0, 0.0, true, true, 'ජ්‍යෙෂ්ඨ පුරවැසි තැන්පතු - මාස 3', 3),
  ('b191c94d-7db1-4e78-9e5d-111111111119'::uuid, 'FD_SNR_6M', 0.0, 0.0, true, true, 'ජ්‍යෙෂ්ඨ පුරවැසි තැන්පතු - මාස 6', 6),
  ('b191c94d-7db1-4e78-9e5d-11111111111a'::uuid, 'FD_SNR_24M', 0.0, 0.0, true, true, 'ජ්‍යෙෂ්ඨ පුරවැසි තැන්පතු - අවුරුදු 2', 24),
  ('b191c94d-7db1-4e78-9e5d-11111111111b'::uuid, 'FD_SNR_60M', 0.0, 0.0, true, true, 'ජ්‍යෙෂ්ඨ පුරවැසි තැන්පතු - අවුරුදු 5', 60),

  ('b191c94d-7db1-4e78-9e5d-11111111111c'::uuid, 'FD_CHD_1M', 0.0, 0.0, true, false, 'ළමා ස්ථාවර තැන්පතු - මාස 1', 1),
  ('b191c94d-7db1-4e78-9e5d-11111111111d'::uuid, 'FD_CHD_2M', 0.0, 0.0, true, false, 'ළමා ස්ථාවර තැන්පතු - මාස 2', 2),
  ('b191c94d-7db1-4e78-9e5d-11111111111e'::uuid, 'FD_CHD_3M', 0.0, 0.0, true, false, 'ළමා ස්ථාවර තැන්පතු - මාස 3', 3),
  ('b191c94d-7db1-4e78-9e5d-11111111111f'::uuid, 'FD_CHD_6M', 0.0, 0.0, true, false, 'ළමා ස්ථාවර තැන්පතු - මාස 6', 6),
  ('b191c94d-7db1-4e78-9e5d-111111111120'::uuid, 'FD_CHD_24M', 0.0, 0.0, true, false, 'ළමා ස්ථාවර තැන්පතු - අවුරුදු 2', 24)
) AS t(id, code, interest_rate_maturity, interest_rate_monthly, is_active, is_senior_citizen, name, term_months)
WHERE NOT EXISTS (
  SELECT 1 FROM account_service.fixed_deposit_types fdt WHERE fdt.code = t.code
);
