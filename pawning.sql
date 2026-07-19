SET search_path TO pawning_service, public;
-- Adminer 5.4.2 PostgreSQL 15.18 dump

DROP TABLE IF EXISTS "pawn_tickets";
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
    CONSTRAINT "pawn_tickets_pkey" PRIMARY KEY ("ticket_id")
)
WITH (oids = false);

CREATE UNIQUE INDEX pawn_tickets_ticket_number_key ON pawning_service.pawn_tickets USING btree (ticket_number);

INSERT INTO "pawn_tickets" ("ticket_id", "ticket_number", "member_id", "gross_weight_grams", "net_weight_grams", "purity_karat", "assessed_value", "advance_amount", "interest_rate", "branch_id", "valuer_id", "issue_date", "expiry_date", "status", "article_description") VALUES
('117a8973-2872-4ac0-a53b-52da66657aff',	'698594',	'9a387d8f-5900-420e-b0cf-19899e694037',	15.00,	10.00,	22,	300000.00,	300000.00,	13.00,	1,	'00000000-0000-0000-0000-000000000000',	'2026-06-24',	'2027-06-24',	'REDEEMED',	'Gold Chain'),
('dca70386-1901-4719-8784-6dc153b67c71',	'698595',	'b1ae2603-1549-4132-bfb8-bf71139a0531',	0.03,	0.02,	22,	20000.00,	20000.00,	13.00,	1,	'00000000-0000-0000-0000-000000000000',	'2026-06-24',	'2027-06-24',	'REDEEMED',	'bjkbob'),
('bd49d165-f152-4f7d-8e9a-32b34c60fa8b',	'698596',	'b1ae2603-1549-4132-bfb8-bf71139a0531',	5.00,	3.00,	22,	200000.00,	100000.00,	13.00,	1,	'00000000-0000-0000-0000-000000000000',	'2026-06-24',	'2027-06-24',	'ACTIVE',	'Gold Ring');

DROP TABLE IF EXISTS "pawning_settings";
CREATE TABLE "pawning_service"."pawning_settings" (
    "setting_key" character varying(255) NOT NULL,
    "description" character varying(255),
    "setting_value" character varying(255),
    CONSTRAINT "pawning_settings_pkey" PRIMARY KEY ("setting_key")
)
WITH (oids = false);


-- 2026-06-25 09:53:59 UTC
