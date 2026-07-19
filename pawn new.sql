SET search_path TO pawning_service;  
-- Adminer 5.4.2 PostgreSQL 15.18 dump

DROP TABLE IF EXISTS "pawn_payments" CASCADE;
CREATE TABLE "pawning_service"."pawn_payments" (
    "payment_id" uuid NOT NULL,
    "interest_portion" numeric(15,2),
    "payment_amount" numeric(15,2) NOT NULL,
    "payment_date" timestamp(6) NOT NULL,
    "principal_portion" numeric(15,2),
    "receipt_number" character varying(50),
    "tenant_id" integer NOT NULL,
    "ticket_id" uuid NOT NULL,
    CONSTRAINT "pawn_payments_pkey" PRIMARY KEY ("payment_id")
)
WITH (oids = false);

INSERT INTO "pawn_payments" ("payment_id", "interest_portion", "payment_amount", "payment_date", "principal_portion", "receipt_number", "tenant_id", "ticket_id") VALUES
('e895f0f3-a354-4efd-aa40-9b740e4730ac',	1869.86,	35000.00,	'2026-07-06 00:00:00',	33130.14,	NULL,	1,	'5910cf17-be75-42fe-9c17-9c56377e6377');

DROP TABLE IF EXISTS "pawn_tickets" CASCADE;
CREATE TABLE "pawning_service"."pawn_tickets" (
    "ticket_id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "ticket_number" character varying(20) NOT NULL,
    "member_id" uuid NOT NULL,
    "gross_weight_grams" numeric(8,2) NOT NULL,
    "net_weight_grams" numeric(8,2) NOT NULL,
    "purity_karat" integer NOT NULL,
    "assessed_value" numeric(15,2) NOT NULL,
    "advance_amount" numeric(15,2) NOT NULL,
    "interest_rate" numeric(5,2) DEFAULT '13.00',
    "branch_id" integer NOT NULL,
    "valuer_id" uuid NOT NULL,
    "issue_date" date DEFAULT CURRENT_DATE,
    "expiry_date" date NOT NULL,
    "status" character varying(20) DEFAULT 'ACTIVE',
    "article_description" character varying(255),
    "tenant_id" integer DEFAULT '1',
    "carried_over_interest" numeric(15,2),
    "last_payment_date" date,
    "remaining_advance" numeric(15,2),
    CONSTRAINT "pawn_tickets_pkey" PRIMARY KEY ("ticket_id")
)
WITH (oids = false);

CREATE UNIQUE INDEX pawn_tickets_ticket_number_key ON pawning_service.pawn_tickets USING btree (ticket_number);

INSERT INTO "pawn_tickets" ("ticket_id", "ticket_number", "member_id", "gross_weight_grams", "net_weight_grams", "purity_karat", "assessed_value", "advance_amount", "interest_rate", "branch_id", "valuer_id", "issue_date", "expiry_date", "status", "article_description", "tenant_id", "carried_over_interest", "last_payment_date", "remaining_advance") VALUES
('c0b68bc5-c689-4c12-b8a4-412f6f058725',	'698597',	'9a387d8f-5900-420e-b0cf-19899e694037',	5.00,	3.00,	22,	200000.00,	150000.00,	13.00,	1,	'00000000-0000-0000-0000-000000000000',	'2025-07-26',	'2026-07-26',	'ACTIVE',	'Pendant',	1,	NULL,	NULL,	NULL),
('5910cf17-be75-42fe-9c17-9c56377e6377',	'698598',	'05a1cacd-d86b-4edf-b2fc-e84b8d7d24ee',	5.00,	3.00,	22,	500000.00,	350000.00,	13.00,	1,	'00000000-0000-0000-0000-000000000000',	'2026-06-26',	'2027-06-26',	'ACTIVE',	'Gold Chain',	1,	0.00,	'2026-07-06',	316869.86);

DROP TABLE IF EXISTS "pawning_settings" CASCADE;
CREATE TABLE "pawning_service"."pawning_settings" (
    "setting_key" character varying(255) NOT NULL,
    "description" character varying(255),
    "setting_value" character varying(255),
    "tenant_id" integer DEFAULT '1' NOT NULL,
    CONSTRAINT "pawning_settings_pkey" PRIMARY KEY ("setting_key", "tenant_id")
)
WITH (oids = false);

INSERT INTO "pawning_settings" ("setting_key", "description", "setting_value", "tenant_id") VALUES
('INTEREST_RATE',	'Pawning annual interest rate (%)',	'24.00',	1),
('ADVANCE_PER_SOVEREIGN',	'Advance per gold sovereign (Rs.)',	'80000.00',	1),
('INTEREST_RATE',	'Pawning annual interest rate (%)',	'24.00',	9),
('ADVANCE_PER_SOVEREIGN',	'Advance per gold sovereign (Rs.)',	'80000.00',	9),
('INTEREST_RATE',	'Pawning annual interest rate (%)',	'24.00',	10),
('ADVANCE_PER_SOVEREIGN',	'Advance per gold sovereign (Rs.)',	'80000.00',	10);

-- 2026-07-07 06:22:24 UTC
