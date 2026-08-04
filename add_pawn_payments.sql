INSERT INTO pawning_service.pawn_payments (payment_id, ticket_id, payment_amount, principal_portion, interest_portion, payment_date, receipt_number, tenant_id)
VALUES 
(gen_random_uuid(), 'a049ec70-173b-46c9-871c-17f4d668d7ef', 50000, 40000, 10000, '2024-07-17 10:00:00', 'RCP-1001', 1),
(gen_random_uuid(), 'a049ec70-173b-46c9-871c-17f4d668d7ef', 50000, 40000, 10000, '2024-08-17 11:30:00', 'RCP-1002', 1),
(gen_random_uuid(), 'a049ec70-173b-46c9-871c-17f4d668d7ef', 50000, 40000, 10000, '2024-09-17 14:15:00', 'RCP-1003', 1),
(gen_random_uuid(), 'a049ec70-173b-46c9-871c-17f4d668d7ef', 130000, 120000, 10000, '2024-10-17 09:45:00', 'RCP-1004', 1),

(gen_random_uuid(), '295dd675-5cfb-4e7f-9462-598090dc8957', 60000, 50000, 10000, '2024-09-30 10:20:00', 'RCP-1005', 1),
(gen_random_uuid(), '295dd675-5cfb-4e7f-9462-598090dc8957', 60000, 50000, 10000, '2024-10-31 11:10:00', 'RCP-1006', 1),
(gen_random_uuid(), '295dd675-5cfb-4e7f-9462-598090dc8957', 130000, 110000, 20000, '2024-11-30 15:30:00', 'RCP-1007', 1);

UPDATE pawning_service.pawn_tickets SET remaining_advance = 0, last_payment_date = '2024-10-17' WHERE ticket_number = 'PW4002450';
UPDATE pawning_service.pawn_tickets SET remaining_advance = 0, last_payment_date = '2024-11-30' WHERE ticket_number = 'PW4001300';
