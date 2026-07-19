SET search_path TO loan_service, public;
-- Adminer 5.4.2 PostgreSQL 15.18 dump

DROP TABLE IF EXISTS "emi_schedules";
DROP SEQUENCE IF EXISTS "loan_service".emi_schedules_schedule_id_seq;
CREATE SEQUENCE "loan_service".emi_schedules_schedule_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "loan_service"."emi_schedules" (
    "schedule_id" integer DEFAULT nextval('emi_schedules_schedule_id_seq') NOT NULL,
    "loan_id" uuid NOT NULL,
    "installment_number" integer NOT NULL,
    "due_date" date NOT NULL,
    "emi_amount" numeric(15,2) NOT NULL,
    "principal_component" numeric(15,2) NOT NULL,
    "interest_component" numeric(15,2) NOT NULL,
    "status" character varying(20) DEFAULT 'PENDING',
    CONSTRAINT "emi_schedules_pkey" PRIMARY KEY ("schedule_id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "ledger_entries";
CREATE TABLE "loan_service"."ledger_entries" (
    "entry_id" uuid NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "branch_id" integer,
    "created_at" timestamp(6),
    "created_by" character varying(100),
    "credit_account" character varying(100) NOT NULL,
    "debit_account" character varying(100) NOT NULL,
    "description" text,
    "entry_date" date NOT NULL,
    "entry_type" character varying(50),
    "loan_id" uuid,
    "payment_method" character varying(30),
    "reference_number" character varying(50),
    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("entry_id")
)
WITH (oids = false);

INSERT INTO "ledger_entries" ("entry_id", "amount", "branch_id", "created_at", "created_by", "credit_account", "debit_account", "description", "entry_date", "entry_type", "loan_id", "payment_method", "reference_number") VALUES
('e1d45419-6bbc-4eed-8373-9066edc15eca',	500000.00,	1,	'2026-06-23 15:43:51.438659',	'mgr_hkw',	'CASH_IN_VAULT',	'LOAN_RECEIVABLE',	'Loan Disbursement — LN-HKW-2026-9466 | Member: 2276410d-4d1d-484d-aca3-e5af0bd2623d | Method: CASH',	'2026-06-23',	'DISBURSEMENT',	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'CASH',	'LN-HKW-2026-9466'),
('7e2cba01-d03e-4f7b-898d-c5f0ea0f4ce0',	29931.51,	1,	'2026-06-23 16:29:31.76598',	'senior_hkw',	'LOAN_REPAYMENT_CLEARING',	'CASH_IN_VAULT',	'Loan Repayment (Cash In) — LN-HKW-2026-9466',	'2026-06-23',	'REPAYMENT_CASH_IN',	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'CASH',	'af897c53-d093-4510-b3b8-2b243894d9ce'),
('d17caacb-e054-4e2d-9562-bb1422fdf5bb',	25000.00,	1,	'2026-06-23 16:29:31.792273',	'senior_hkw',	'LOAN_RECEIVABLE',	'LOAN_REPAYMENT_CLEARING',	'Loan Principal Deduction — LN-HKW-2026-9466',	'2026-06-23',	'REPAYMENT_PRINCIPAL',	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'CASH',	'af897c53-d093-4510-b3b8-2b243894d9ce'),
('41ab362c-a2fd-4c29-b6d6-afd530c45742',	4931.51,	1,	'2026-06-23 16:29:31.797346',	'senior_hkw',	'INTEREST_INCOME',	'LOAN_REPAYMENT_CLEARING',	'Loan Interest Income — LN-HKW-2026-9466',	'2026-06-23',	'REPAYMENT_INTEREST',	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'CASH',	'af897c53-d093-4510-b3b8-2b243894d9ce'),
('0330c3b1-90ab-4b0d-ba25-970f3da6c6da',	300000.00,	1,	'2026-06-25 04:52:43.99615',	'mgr_hkw',	'CASH_IN_VAULT',	'LOAN_RECEIVABLE',	'Loan Disbursement — LN-HKW-2026-4959 | Member: 9a387d8f-5900-420e-b0cf-19899e694037 | Method: CASH',	'2026-06-25',	'DISBURSEMENT',	'9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	'CASH',	'LN-HKW-2026-4959'),
('2b8993fa-2145-4e2c-9674-03bd1751014f',	250000.00,	1,	'2026-06-25 05:46:45.797534',	'mgr_hkw',	'CASH_IN_VAULT',	'LOAN_RECEIVABLE',	'Loan Disbursement — LN-HKW-2026-6637 | Member: b1ae2603-1549-4132-bfb8-bf71139a0531 | Method: CASH',	'2026-06-25',	'DISBURSEMENT',	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'CASH',	'LN-HKW-2026-6637'),
('2547d96d-b4eb-49e5-97b9-e5029a08795b',	30000.00,	1,	'2026-06-25 06:05:38.143243',	'senior_hkw',	'LOAN_REPAYMENT_CLEARING',	'CASH_IN_VAULT',	'Loan Repayment (Cash In) — LN-HKW-2026-6637',	'2026-06-25',	'REPAYMENT_CASH_IN',	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'CASH',	'04470067-fb90-4daa-8f8c-303dcd600680'),
('9014554c-7b38-43df-b46f-c8ccd5dae3a6',	27534.25,	1,	'2026-06-25 06:05:38.319655',	'senior_hkw',	'LOAN_RECEIVABLE',	'LOAN_REPAYMENT_CLEARING',	'Loan Principal Deduction — LN-HKW-2026-6637',	'2026-06-25',	'REPAYMENT_PRINCIPAL',	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'CASH',	'04470067-fb90-4daa-8f8c-303dcd600680'),
('6c26aaaa-5bb4-4323-ac4b-4a22f1834e7d',	2465.75,	1,	'2026-06-25 06:05:38.442097',	'senior_hkw',	'INTEREST_INCOME',	'LOAN_REPAYMENT_CLEARING',	'Loan Interest Income — LN-HKW-2026-6637',	'2026-06-25',	'REPAYMENT_INTEREST',	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'CASH',	'04470067-fb90-4daa-8f8c-303dcd600680'),
('0b5e78e5-d649-4797-b9cf-0f3f4c48c352',	28000.00,	1,	'2026-06-25 07:14:32.287222',	'senior_hkw',	'LOAN_REPAYMENT_CLEARING',	'CASH_IN_VAULT',	'Loan Repayment (Cash In) — LN-HKW-2026-6637',	'2026-06-25',	'REPAYMENT_CASH_IN',	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'CASH',	'eae4d7b4-4c3e-45a1-9577-8de98a14d99f'),
('f7af192a-5b13-4a7f-93b5-1fea33d56a18',	25780.82,	1,	'2026-06-25 07:14:56.231045',	'senior_hkw',	'LOAN_RECEIVABLE',	'LOAN_REPAYMENT_CLEARING',	'Loan Principal Deduction — LN-HKW-2026-6637',	'2026-06-25',	'REPAYMENT_PRINCIPAL',	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'CASH',	'eae4d7b4-4c3e-45a1-9577-8de98a14d99f'),
('7ce37a87-0389-4620-a714-a8539b47d384',	2219.18,	1,	'2026-06-25 07:14:56.295295',	'senior_hkw',	'INTEREST_INCOME',	'LOAN_REPAYMENT_CLEARING',	'Loan Interest Income — LN-HKW-2026-6637',	'2026-06-25',	'REPAYMENT_INTEREST',	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'CASH',	'eae4d7b4-4c3e-45a1-9577-8de98a14d99f'),
('ad73ce21-dd01-4936-8294-a13ea71880fe',	25000.00,	1,	'2026-06-25 08:31:32.455748',	'senior_hkw',	'LOAN_REPAYMENT_CLEARING',	'CASH_IN_VAULT',	'Loan Repayment (Cash In) — LN-HKW-2026-6637',	'2026-06-25',	'REPAYMENT_CASH_IN',	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'CASH',	'd364658a-9a4d-4328-a4c3-51e9e74763b2'),
('b7e75a26-ef82-4959-9562-d32e90aaae22',	23027.40,	1,	'2026-06-25 08:31:34.794516',	'senior_hkw',	'LOAN_RECEIVABLE',	'LOAN_REPAYMENT_CLEARING',	'Loan Principal Deduction — LN-HKW-2026-6637',	'2026-06-25',	'REPAYMENT_PRINCIPAL',	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'CASH',	'd364658a-9a4d-4328-a4c3-51e9e74763b2'),
('93f9305f-b8f2-4823-876a-56442ffadecb',	1972.60,	1,	'2026-06-25 08:31:34.863061',	'senior_hkw',	'INTEREST_INCOME',	'LOAN_REPAYMENT_CLEARING',	'Loan Interest Income — LN-HKW-2026-6637',	'2026-06-25',	'REPAYMENT_INTEREST',	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'CASH',	'd364658a-9a4d-4328-a4c3-51e9e74763b2'),
('3b5d09b6-afe8-4373-baa1-460d4fde4ba2',	30000.00,	1,	'2026-06-25 08:50:13.521664',	'senior_hkw',	'LOAN_REPAYMENT_CLEARING',	'CASH_IN_VAULT',	'Loan Repayment (Cash In) — LN-HKW-2026-6637',	'2026-06-25',	'REPAYMENT_CASH_IN',	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'CASH',	'ac00e68c-4fa6-4846-8c0b-1cc1598715c8'),
('5765b8ff-4875-4fdf-b878-2c1067607913',	30000.00,	1,	'2026-06-25 08:50:13.341879',	'senior_hkw',	'LOAN_RECEIVABLE',	'LOAN_REPAYMENT_CLEARING',	'Loan Principal Deduction — LN-HKW-2026-6637',	'2026-06-25',	'REPAYMENT_PRINCIPAL',	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'CASH',	'ac00e68c-4fa6-4846-8c0b-1cc1598715c8'),
('c15bcb12-c778-4f37-9650-caef90a8dfae',	0.00,	1,	'2026-06-25 08:50:13.386113',	'senior_hkw',	'INTEREST_INCOME',	'LOAN_REPAYMENT_CLEARING',	'Loan Interest Income — LN-HKW-2026-6637',	'2026-06-25',	'REPAYMENT_INTEREST',	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'CASH',	'ac00e68c-4fa6-4846-8c0b-1cc1598715c8'),
('feb1ed13-1636-489d-9e04-89e2758e613b',	35000.00,	1,	'2026-06-25 08:52:17.083504',	'senior_hkw',	'LOAN_REPAYMENT_CLEARING',	'CASH_IN_VAULT',	'Loan Repayment (Cash In) — LN-HKW-2026-6637',	'2026-07-13',	'REPAYMENT_CASH_IN',	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'CASH',	'9fa688d6-d612-4cd3-b05a-3b7911e51316'),
('01729066-f89d-4c32-9a48-a10226e20c5c',	33698.08,	1,	'2026-06-25 08:52:17.278228',	'senior_hkw',	'LOAN_RECEIVABLE',	'LOAN_REPAYMENT_CLEARING',	'Loan Principal Deduction — LN-HKW-2026-6637',	'2026-07-13',	'REPAYMENT_PRINCIPAL',	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'CASH',	'9fa688d6-d612-4cd3-b05a-3b7911e51316'),
('8cbe9a4b-dff9-4d31-a1c3-8bb8172bdba6',	1301.92,	1,	'2026-06-25 08:52:17.518464',	'senior_hkw',	'INTEREST_INCOME',	'LOAN_REPAYMENT_CLEARING',	'Loan Interest Income — LN-HKW-2026-6637',	'2026-07-13',	'REPAYMENT_INTEREST',	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'CASH',	'9fa688d6-d612-4cd3-b05a-3b7911e51316');

DROP TABLE IF EXISTS "loan_applicant_details";
CREATE TABLE "loan_service"."loan_applicant_details" (
    "detail_id" uuid NOT NULL,
    "address_line1" character varying(300),
    "address_line2" character varying(300),
    "agreed_amount" numeric(15,2),
    "annual_expense" numeric(15,2),
    "annual_income_other" numeric(15,2),
    "annual_income_primary" numeric(15,2),
    "applicant_digital_signature_url" text,
    "applicant_name" character varying(200),
    "branch" character varying(100),
    "civil_status" character varying(20),
    "created_at" timestamp(6),
    "date_of_birth" character varying(255),
    "dependents_count" integer,
    "designation" character varying(200),
    "employer_details" character varying(300),
    "existing_loans_coop" numeric(15,2),
    "existing_loans_other" numeric(15,2),
    "gender" character varying(10),
    "guarantor_of_other_loan1" character varying(200),
    "guarantor_of_other_loan2" character varying(200),
    "head_of_household_name" character varying(200),
    "is_member_of_other_coop" boolean,
    "loan_id" uuid NOT NULL,
    "loan_purpose" text,
    "member_no" character varying(50),
    "nic" character varying(20),
    "other_coop_details" character varying(300),
    "phone" character varying(20),
    "primary_job" character varying(200),
    "province" character varying(100),
    "repayment_period_months" integer,
    "required_loan_cash" numeric(15,2),
    "required_loan_goods" numeric(15,2),
    "residence_period" character varying(50),
    "share_amount" numeric(15,2),
    "shares_obtained" numeric(15,2),
    "spouse_employer_details" character varying(300),
    "spouse_job_title" character varying(200),
    CONSTRAINT "loan_applicant_details_pkey" PRIMARY KEY ("detail_id")
)
WITH (oids = false);

CREATE UNIQUE INDEX uk96r0ly4j52svkryk82si9i6m5 ON loan_service.loan_applicant_details USING btree (loan_id);

INSERT INTO "loan_applicant_details" ("detail_id", "address_line1", "address_line2", "agreed_amount", "annual_expense", "annual_income_other", "annual_income_primary", "applicant_digital_signature_url", "applicant_name", "branch", "civil_status", "created_at", "date_of_birth", "dependents_count", "designation", "employer_details", "existing_loans_coop", "existing_loans_other", "gender", "guarantor_of_other_loan1", "guarantor_of_other_loan2", "head_of_household_name", "is_member_of_other_coop", "loan_id", "loan_purpose", "member_no", "nic", "other_coop_details", "phone", "primary_job", "province", "repayment_period_months", "required_loan_cash", "required_loan_goods", "residence_period", "share_amount", "shares_obtained", "spouse_employer_details", "spouse_job_title") VALUES
('b154233a-7e69-4716-b86c-4574e4523fd4',	'Baddegama',	'',	NULL,	150000.00,	NULL,	150000.00,	NULL,	'Poorni Karishma Rohan Abeysekara',	'',	'අවිවාහක',	'2026-06-17 10:28:20.594041',	'2001-10-16',	5,	NULL,	'Sanota Pvt Ltd',	NULL,	NULL,	'ස්ත්රී',	'',	'',	'N R Abeysekara',	'0',	'13a38797-6059-4a40-a475-2422753c3032',	'For buying a laptop',	'2',	'200179002577',	'',	'0777442729',	'Intern',	NULL,	36,	200000.00,	NULL,	'13',	NULL,	9998.00,	'-',	'-'),
('6a278d68-bafd-4f94-b572-bed5e625a37b',	'301/A Sinhale Gedara Dorape, Angulugaha',	'',	NULL,	200000.00,	NULL,	200000.00,	NULL,	'Isuru Sajan Perera',	'',	'අවිවාහක',	'2026-06-23 09:34:59.206999',	'2003-07-11',	NULL,	NULL,	'Knoweb Pvt Ltd',	NULL,	NULL,	'පුරුෂ',	'',	'',	'',	'0',	'7b460fc9-8a75-4834-913c-108959f31377',	'For making a house',	'M0001',	'200226803467',	'',	'0754796701',	'Software Engineer',	NULL,	10,	500000.00,	NULL,	'5',	NULL,	NULL,	'',	''),
('eee0aa22-e873-43ab-9b60-73f57590781f',	'231/B/1, Kandaduwa Road, Ganegama South, Baddegama',	'',	NULL,	500000.00,	NULL,	500000.00,	NULL,	'Shashika Sandamini Rohan Abeysekara',	'',	'අවිවාහක',	'2026-06-23 15:31:27.883725',	'1998-04-11',	NULL,	NULL,	'Galle',	NULL,	NULL,	'ස්ත්රී',	'',	'',	'',	'0',	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'Build a house',	'M010',	'199820004005',	'',	'0776263411',	'Nurse',	NULL,	20,	500000.00,	NULL,	'',	NULL,	NULL,	'',	''),
('5fde9e84-ed38-4ee4-ab1b-130d8924113a',	'Baddegama',	'',	NULL,	360000.00,	NULL,	360000.00,	NULL,	'Poorni Karishma Rohan Abeysekara',	'',	'අවිවාහක',	'2026-06-25 04:23:12.42368',	'2001-10-16',	NULL,	NULL,	'',	NULL,	NULL,	'',	'',	'',	'',	'0',	'9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	'for wedding',	'2',	'200179002577',	'',	'0777442729',	'',	NULL,	12,	300000.00,	NULL,	'',	NULL,	NULL,	'',	''),
('0ff1c07a-93d1-4fbf-990a-e8c5ad7e1e8c',	'301/A Sinhale Gedara Dorape, Angulugaha',	'',	NULL,	250000.00,	NULL,	250000.00,	NULL,	'Achintha Buffe Perera',	'',	'අවිවාහක',	'2026-06-25 05:43:11.519141',	'2002-07-09',	NULL,	NULL,	'',	NULL,	NULL,	'පුරුෂ',	'',	'',	'',	'0',	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'jnhklukhk',	'NM0001',	'200226803042',	'',	'0754796701',	'',	NULL,	10,	250000.00,	NULL,	'',	NULL,	NULL,	'',	'');

DROP TABLE IF EXISTS "loan_approval_actions";
CREATE TABLE "loan_service"."loan_approval_actions" (
    "action_id" uuid NOT NULL,
    "action" character varying(20) NOT NULL,
    "actor_role" character varying(50),
    "actor_username" character varying(100),
    "comments" text,
    "created_at" timestamp(6),
    "loan_id" uuid NOT NULL,
    "stage" character varying(100) NOT NULL,
    CONSTRAINT "loan_approval_actions_pkey" PRIMARY KEY ("action_id")
)
WITH (oids = false);

INSERT INTO "loan_approval_actions" ("action_id", "action", "actor_role", "actor_username", "comments", "created_at", "loan_id", "stage") VALUES
('e30a4852-f99c-422a-b547-ec47e3e785c0',	'APPROVED',	'SENIOR_OFFICER',	'senior_hkw',	'',	'2026-06-17 11:20:01.961258',	'13a38797-6059-4a40-a475-2422753c3032',	'STAGE_1_APPLICATION_SUBMITTED'),
('3aa9bff0-1959-4f62-9805-ff565c73327c',	'APPROVED',	'BRANCH_MANAGER',	'mgr_hkw',	'test',	'2026-06-19 07:45:26.22945',	'13a38797-6059-4a40-a475-2422753c3032',	'STAGE_1_MANAGER_APPROVAL'),
('f46da63d-d2b5-4b73-8284-a6d9d1bb3595',	'APPROVED',	'LOAN_COMMITTEE',	'committee_hkw',	'Approved/Recommended by LOAN_COMMITTEE',	'2026-06-19 08:45:18.075147',	'13a38797-6059-4a40-a475-2422753c3032',	'STAGE_2_LOAN_COMMITTEE_APPROVAL'),
('4adffe43-6572-49b5-806f-af6c84b5440c',	'DISBURSED',	NULL,	'mgr_hkw',	'Loan disbursed. Account No: LN-HKW-2026-4728',	'2026-06-22 07:50:36.791193',	'13a38797-6059-4a40-a475-2422753c3032',	'DISBURSED'),
('6a592ba1-cd1c-46b8-9e60-48a9e277d484',	'REJECTED',	'BRANCH_MANAGER',	'mgr_hkw',	'Rejected by BRANCH_MANAGER',	'2026-06-23 10:02:10.366077',	'bac6d9c7-cc79-4014-aa82-f37c8e5d0f38',	'STAGE_1_MANAGER_APPROVAL'),
('a0d79cae-033a-44c5-a27f-0b4cc1fee3d2',	'APPROVED',	'BRANCH_MANAGER',	'mgr_hkw',	'Approved/Recommended by BRANCH_MANAGER',	'2026-06-23 15:37:37.586365',	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'STAGE_1_MANAGER_APPROVAL'),
('8a84ab23-4309-4989-9fbd-9e3003ba1a74',	'APPROVED',	'LOAN_COMMITTEE',	'committee_hkw',	'Approved/Recommended by LOAN_COMMITTEE',	'2026-06-23 15:40:32.039889',	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'STAGE_2_LOAN_COMMITTEE_APPROVAL'),
('5ae6a273-5417-47f6-a9ea-f489505b3258',	'DISBURSED',	NULL,	'mgr_hkw',	'Loan disbursed (CASH). Account No: LN-HKW-2026-9466',	'2026-06-23 15:43:51.054006',	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'DISBURSED'),
('c68e4e84-da54-4f5d-8ed1-44e2235b9a5d',	'APPROVED',	'BRANCH_MANAGER',	'mgr_hkw',	'Approved/Recommended by BRANCH_MANAGER',	'2026-06-25 04:27:15.541153',	'9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	'STAGE_1_MANAGER_APPROVAL'),
('76025c7a-582e-4cae-8922-d94e27ef2b6a',	'APPROVED',	'LOAN_COMMITTEE',	'committee_hkw',	'Approved/Recommended by LOAN_COMMITTEE',	'2026-06-25 04:29:30.378859',	'9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	'STAGE_2_LOAN_COMMITTEE_APPROVAL'),
('c9bc9c10-7d70-4d8a-a546-4671a1cb2c2f',	'DISBURSED',	NULL,	'mgr_hkw',	'Loan disbursed (CASH). Account No: LN-HKW-2026-4959',	'2026-06-25 04:52:42.808802',	'9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	'DISBURSED'),
('8972d37a-cbbc-4cb0-b409-c1df09dad69e',	'APPROVED',	'BRANCH_MANAGER',	'mgr_hkw',	'Approved/Recommended by BRANCH_MANAGER',	'2026-06-25 05:44:00.317027',	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'STAGE_1_MANAGER_APPROVAL'),
('28574b98-7c52-4b4e-9a85-179d8ba0451e',	'APPROVED',	'LOAN_COMMITTEE',	'committee_hkw',	'Approved/Recommended by LOAN_COMMITTEE',	'2026-06-25 05:44:49.535034',	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'STAGE_2_LOAN_COMMITTEE_APPROVAL'),
('1797c4c6-4f3e-4252-bdfa-28ac303e922d',	'DISBURSED',	NULL,	'mgr_hkw',	'Loan disbursed (CASH). Account No: LN-HKW-2026-6637',	'2026-06-25 05:46:45.50837',	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'DISBURSED');

DROP TABLE IF EXISTS "loan_asset_details";
CREATE TABLE "loan_service"."loan_asset_details" (
    "asset_id" uuid NOT NULL,
    "animals_value" numeric(15,2),
    "bank_current_acc_no" character varying(50),
    "bank_current_balance" numeric(15,2),
    "bank_current_branch" character varying(100),
    "bank_dhana_yojana_acc_no" character varying(50),
    "bank_dhana_yojana_balance" numeric(15,2),
    "bank_dhana_yojana_branch" character varying(100),
    "bank_fixed_acc_no" character varying(50),
    "bank_fixed_balance" numeric(15,2),
    "bank_fixed_branch" character varying(100),
    "bank_savings_acc_no" character varying(50),
    "bank_savings_balance" numeric(15,2),
    "bank_savings_branch" character varying(100),
    "buildings_value" numeric(15,2),
    "land_goda_value" numeric(15,2),
    "land_mada_value" numeric(15,2),
    "loan_id" uuid NOT NULL,
    "other_assets_description" character varying(300),
    "other_assets_value" numeric(15,2),
    "vehicles_value" numeric(15,2),
    CONSTRAINT "loan_asset_details_pkey" PRIMARY KEY ("asset_id")
)
WITH (oids = false);

CREATE UNIQUE INDEX ukkjqwjw6sab0om28ff25hk3986 ON loan_service.loan_asset_details USING btree (loan_id);

INSERT INTO "loan_asset_details" ("asset_id", "animals_value", "bank_current_acc_no", "bank_current_balance", "bank_current_branch", "bank_dhana_yojana_acc_no", "bank_dhana_yojana_balance", "bank_dhana_yojana_branch", "bank_fixed_acc_no", "bank_fixed_balance", "bank_fixed_branch", "bank_savings_acc_no", "bank_savings_balance", "bank_savings_branch", "buildings_value", "land_goda_value", "land_mada_value", "loan_id", "other_assets_description", "other_assets_value", "vehicles_value") VALUES
('b69042aa-d880-4375-a22d-dd756fe04f3e',	NULL,	'',	NULL,	'',	'',	NULL,	'',	'',	NULL,	'',	'721357923',	500.00,	'BOC',	NULL,	NULL,	NULL,	'13a38797-6059-4a40-a475-2422753c3032',	NULL,	NULL,	NULL),
('9c7c026c-3464-4390-b33b-2343a5ac6fe5',	NULL,	'80142567',	5000.00,	'sanasa ',	'',	NULL,	'',	'',	NULL,	'',	'',	NULL,	'',	NULL,	NULL,	NULL,	'7b460fc9-8a75-4834-913c-108959f31377',	NULL,	NULL,	NULL),
('1c681ba3-b2b8-4232-844b-10905e55e1be',	NULL,	'',	NULL,	'',	'',	NULL,	'',	'',	NULL,	'',	'',	NULL,	'',	NULL,	NULL,	NULL,	'bac6d9c7-cc79-4014-aa82-f37c8e5d0f38',	NULL,	NULL,	NULL),
('04bdab3a-a95e-441c-8c03-514994e6342e',	NULL,	'',	NULL,	'',	'',	NULL,	'',	'',	NULL,	'',	'',	NULL,	'',	NULL,	NULL,	NULL,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	NULL,	NULL,	NULL),
('a83c4ecc-e9f1-4c7e-aa3c-daec45624fc6',	NULL,	'',	NULL,	'',	'',	NULL,	'',	'',	NULL,	'',	'',	NULL,	'',	NULL,	NULL,	NULL,	'9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	NULL,	NULL,	NULL),
('5a0e41bc-d229-4d22-9e53-a03d58cc047a',	NULL,	'',	NULL,	'',	'',	NULL,	'',	'',	NULL,	'',	'45678909',	25000.00,	'ශාඛාව',	NULL,	NULL,	NULL,	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	NULL,	NULL,	NULL);

DROP TABLE IF EXISTS "loan_collateral";
DROP SEQUENCE IF EXISTS "loan_service".loan_collateral_collateral_id_seq;
CREATE SEQUENCE "loan_service".loan_collateral_collateral_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "loan_service"."loan_collateral" (
    "collateral_id" integer DEFAULT nextval('loan_collateral_collateral_id_seq') NOT NULL,
    "loan_id" uuid NOT NULL,
    "asset_type" character varying(50) NOT NULL,
    "assessed_value" numeric(15,2) NOT NULL,
    "valuer_notes" text,
    CONSTRAINT "loan_collateral_pkey" PRIMARY KEY ("collateral_id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "loan_family_members";
CREATE TABLE "loan_service"."loan_family_members" (
    "family_member_id" uuid NOT NULL,
    "age" character varying(10),
    "job" character varying(200),
    "loan_id" uuid NOT NULL,
    "member_name" character varying(200),
    "owner_type" character varying(20),
    "relation" character varying(100),
    CONSTRAINT "loan_family_members_pkey" PRIMARY KEY ("family_member_id")
)
WITH (oids = false);


DROP TABLE IF EXISTS "loan_guarantors";
DROP SEQUENCE IF EXISTS "loan_service".loan_guarantors_guarantor_record_id_seq;
CREATE SEQUENCE "loan_service".loan_guarantors_guarantor_record_id_seq INCREMENT 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1;

CREATE TABLE "loan_service"."loan_guarantors" (
    "guarantor_record_id" integer DEFAULT nextval('loan_guarantors_guarantor_record_id_seq') NOT NULL,
    "loan_id" uuid NOT NULL,
    "guarantor_member_id" uuid,
    "digital_confirmation_url" character varying(255),
    "guarantor_id" uuid NOT NULL,
    "address" character varying(400),
    "annual_income_other" numeric(15,2),
    "annual_income_primary" numeric(15,2),
    "asset_animals_value" numeric(15,2),
    "asset_land_value" numeric(15,2),
    "asset_other_value" numeric(15,2),
    "asset_vehicles_value" numeric(15,2),
    "bank_dhana_yojana" numeric(15,2),
    "bank_fixed" numeric(15,2),
    "bank_savings" numeric(15,2),
    "date_of_birth" character varying(20),
    "digital_signature_url" text,
    "full_name" character varying(200),
    "guarantor_number" integer NOT NULL,
    "job" character varying(200),
    "member_no" character varying(50),
    "nic" character varying(20),
    "phone" character varying(20),
    CONSTRAINT "loan_guarantors_pkey" PRIMARY KEY ("guarantor_record_id")
)
WITH (oids = false);

INSERT INTO "loan_guarantors" ("guarantor_record_id", "loan_id", "guarantor_member_id", "digital_confirmation_url", "guarantor_id", "address", "annual_income_other", "annual_income_primary", "asset_animals_value", "asset_land_value", "asset_other_value", "asset_vehicles_value", "bank_dhana_yojana", "bank_fixed", "bank_savings", "date_of_birth", "digital_signature_url", "full_name", "guarantor_number", "job", "member_no", "nic", "phone") VALUES
(2,	'13a38797-6059-4a40-a475-2422753c3032',	NULL,	NULL,	'5caafaf5-7ec1-4741-8eda-1df3e4de52c5',	'Baddeagama',	NULL,	500000.00,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	'1986-02-02',	'',	'Amila Kumarasri',	1,	'Manager',	'',	'861453597V',	'0777442800'),
(3,	'13a38797-6059-4a40-a475-2422753c3032',	NULL,	NULL,	'12169a6d-934a-4023-8650-d3c229d7c4a0',	'Kandy',	NULL,	600000.00,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	'1965-02-08',	'',	'Nihal Perera',	2,	'Hotel',	'',	'6561320255V',	'0777267542'),
(4,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	NULL,	NULL,	'28210ff6-5def-4ddf-afa7-e139d06084d5',	'Kurunegala',	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	'1953-05-01',	'',	'Udaya Kumara',	1,	'Retired',	'',	'538942632V',	'07777444272'),
(5,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	NULL,	NULL,	'd48460e5-48bc-43df-8662-dd402a4d763d',	'Kolonnawa',	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	'2001-02-07',	'',	'Hirusha Dinal',	2,	'Seaman',	'',	'200175002577',	'07753572611'),
(6,	'9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	NULL,	NULL,	'c4c696c5-7283-444b-ae98-f3c5f261bb13',	'egerge',	NULL,	500000.00,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	'2026-06-02',	'',	'trhstrh',	1,	'',	'',	'regege',	'egerge'),
(7,	'9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	NULL,	NULL,	'96adb870-2666-49f5-acb8-0042a7f4cfd7',	'gebge',	NULL,	599998.00,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	'2026-06-10',	'',	'rthsrthrsh',	2,	'',	'',	'50486851g53165151',	'egegege'),
(8,	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	NULL,	NULL,	'e095a54c-880e-4e17-8132-79b66dfc87a2',	'sdgsdgsd',	NULL,	5242424.00,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	'',	'',	'gwesegsdg',	1,	'',	'',	'sfsgsdg',	'sgrsdgsdg'),
(9,	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	NULL,	NULL,	'8c6b3663-18f6-4754-bd02-605a15deb8a0',	'rgegege',	NULL,	52052782.00,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	NULL,	'',	'',	'fgdgdseg',	2,	'',	'',	'rgwegwegwe',	'rwgegeg');

DROP TABLE IF EXISTS "loan_repayments";
CREATE TABLE "loan_service"."loan_repayments" (
    "id" uuid NOT NULL,
    "interest_portion" numeric(15,2) NOT NULL,
    "loan_id" uuid NOT NULL,
    "payment_branch_id" bigint NOT NULL,
    "payment_date" timestamp(6) NOT NULL,
    "payment_method" character varying(255) NOT NULL,
    "penalty_paid" numeric(15,2) NOT NULL,
    "principal_portion" numeric(15,2) NOT NULL,
    "processed_by" uuid NOT NULL,
    "reference" character varying(255),
    "total_paid" numeric(15,2) NOT NULL,
    CONSTRAINT "loan_repayments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "loan_repayments_payment_method_check" CHECK ((((payment_method)::text = ANY ((ARRAY['CASH'::character varying, 'SAVINGS_TRANSFER'::character varying])::text[]))))
)
WITH (oids = false);

INSERT INTO "loan_repayments" ("id", "interest_portion", "loan_id", "payment_branch_id", "payment_date", "payment_method", "penalty_paid", "principal_portion", "processed_by", "reference", "total_paid") VALUES
('af897c53-d093-4510-b3b8-2b243894d9ce',	4931.51,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	1,	'2026-06-23 16:29:31.422764',	'CASH',	0.00,	25000.00,	'5023f0c4-5b61-4269-82c5-25160df109fb',	'Installment 1 - 5454',	29931.51),
('ac00e68c-4fa6-4846-8c0b-1cc1598715c8',	0.00,	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	1,	'2026-06-25 00:00:00',	'CASH',	0.00,	30000.00,	'6998c005-4d92-4d6f-b359-75c0b607b5eb',	'Manual Payment - ',	30000.00),
('9fa688d6-d612-4cd3-b05a-3b7911e51316',	1301.92,	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	1,	'2026-07-13 00:00:00',	'CASH',	0.00,	33698.08,	'477ed32c-da55-438b-959b-bc49726fc4fd',	'Manual Payment - ',	35000.00);

DROP TABLE IF EXISTS "loan_schedules";
CREATE TABLE "loan_service"."loan_schedules" (
    "id" uuid NOT NULL,
    "due_date" date NOT NULL,
    "expected_interest" numeric(15,2) NOT NULL,
    "expected_principal" numeric(15,2) NOT NULL,
    "installment_number" integer NOT NULL,
    "loan_id" uuid NOT NULL,
    "status" character varying(255) NOT NULL,
    "total_expected_amount" numeric(15,2) NOT NULL,
    "outstanding_balance" numeric(15,2),
    CONSTRAINT "loan_schedules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "loan_schedules_status_check" CHECK ((((status)::text = ANY ((ARRAY['PENDING'::character varying, 'PAID'::character varying, 'OVERDUE'::character varying])::text[]))))
)
WITH (oids = false);

INSERT INTO "loan_schedules" ("id", "due_date", "expected_interest", "expected_principal", "installment_number", "loan_id", "status", "total_expected_amount", "outstanding_balance") VALUES
('d3a35a18-402f-440a-b835-d668f2b3bde7',	'2026-08-23',	4684.93,	25000.00,	2,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'PENDING',	29684.93,	NULL),
('491c7b08-5fb0-4274-ad35-f8f93eeaa00e',	'2026-09-23',	4438.36,	25000.00,	3,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'PENDING',	29438.36,	NULL),
('c322f955-7918-489a-a346-1cda2b76d935',	'2026-10-23',	4191.78,	25000.00,	4,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'PENDING',	29191.78,	NULL),
('c2e2df11-251c-4f54-80f6-dff62163f12b',	'2026-11-23',	3945.21,	25000.00,	5,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'PENDING',	28945.21,	NULL),
('907a33c7-6661-40e4-80e2-868a816c6955',	'2026-12-23',	3698.63,	25000.00,	6,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'PENDING',	28698.63,	NULL),
('6e35fca4-f5b4-4d41-9b19-1c42c20ebc81',	'2027-01-23',	3452.05,	25000.00,	7,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'PENDING',	28452.05,	NULL),
('92522ccc-a676-487b-8dca-4a7ce33a6624',	'2027-02-23',	3205.48,	25000.00,	8,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'PENDING',	28205.48,	NULL),
('cca34fd3-4d7a-4ec0-835f-6a5a04da6ad9',	'2027-03-23',	2958.90,	25000.00,	9,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'PENDING',	27958.90,	NULL),
('1fee6337-0e92-4be1-898c-c37dfba9e406',	'2027-04-23',	2712.33,	25000.00,	10,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'PENDING',	27712.33,	NULL),
('f797c15c-6dcb-47ea-8c3a-c218c500b42b',	'2027-05-23',	2465.75,	25000.00,	11,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'PENDING',	27465.75,	NULL),
('be37dcaa-ffd0-4eef-b9b6-ad0debcb85e7',	'2027-06-23',	2219.18,	25000.00,	12,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'PENDING',	27219.18,	NULL),
('e357d419-6bec-4749-bc5b-5e025d4f6e9f',	'2027-07-23',	1972.60,	25000.00,	13,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'PENDING',	26972.60,	NULL),
('797169a0-3d0d-4764-a667-ccdd7f612196',	'2027-08-23',	1726.03,	25000.00,	14,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'PENDING',	26726.03,	NULL),
('1df01dfd-3834-407e-bed9-67e3bdebd542',	'2027-09-23',	1479.45,	25000.00,	15,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'PENDING',	26479.45,	NULL),
('f63d78c8-3303-44e8-a7d4-8ecfed3beb0b',	'2027-10-23',	1232.88,	25000.00,	16,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'PENDING',	26232.88,	NULL),
('d6cd3e5b-e4b6-4149-a094-c87b4257f892',	'2027-11-23',	986.30,	25000.00,	17,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'PENDING',	25986.30,	NULL),
('32e356aa-f65f-4d5e-9239-28bebab57b91',	'2027-12-23',	739.73,	25000.00,	18,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'PENDING',	25739.73,	NULL),
('0b1aa623-b10e-4ebe-9639-19a13e9b5f97',	'2028-01-23',	493.15,	25000.00,	19,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'PENDING',	25493.15,	NULL),
('02b19582-98e0-480b-9395-ead514a98fbb',	'2028-02-23',	246.58,	25000.00,	20,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'PENDING',	25246.58,	NULL),
('cab5a93a-325f-4780-897b-92808928c94c',	'2026-07-23',	4931.51,	25000.00,	1,	'd05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'PAID',	29931.51,	NULL),
('809bb515-11cc-4844-b49b-7fe699c04644',	'2025-08-25',	2958.90,	25000.00,	1,	'9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	'PENDING',	27958.90,	275000.00),
('8c83f12a-7089-4f74-8219-8c3795ec990a',	'2025-09-25',	2712.33,	25000.00,	2,	'9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	'PENDING',	27712.33,	250000.00),
('d6fc4585-b18c-4a80-ae59-3b100f1a2156',	'2025-10-25',	2465.75,	25000.00,	3,	'9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	'PENDING',	27465.75,	225000.00),
('8fd09c02-b9e1-4a93-a5f7-70aa55dbca5f',	'2025-11-25',	2219.18,	25000.00,	4,	'9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	'PENDING',	27219.18,	200000.00),
('290ed36d-fe31-4510-bc71-befadd7ed238',	'2025-12-25',	1972.60,	25000.00,	5,	'9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	'PENDING',	26972.60,	175000.00),
('ce222af8-7c1d-4d6e-ad2d-4dbf5e2e1b09',	'2026-01-25',	1726.03,	25000.00,	6,	'9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	'PENDING',	26726.03,	150000.00),
('09646bd6-a8dd-44bc-b44a-3f945f760786',	'2026-02-25',	1479.45,	25000.00,	7,	'9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	'PENDING',	26479.45,	125000.00),
('6290d69d-fcd6-4421-970d-c32faadddde4',	'2026-03-25',	1232.88,	25000.00,	8,	'9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	'PENDING',	26232.88,	100000.00),
('5daf72bb-e2be-474b-9449-770c4d20e1d6',	'2026-04-25',	986.30,	25000.00,	9,	'9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	'PENDING',	25986.30,	75000.00),
('7b7afeff-8480-402f-ad7c-dc14719ca561',	'2026-05-25',	739.73,	25000.00,	10,	'9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	'PENDING',	25739.73,	50000.00),
('42a8363c-4c6e-4077-ae78-cdc5cc5470bb',	'2026-06-25',	493.15,	25000.00,	11,	'9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	'PENDING',	25493.15,	25000.00),
('6d6b0ead-5dec-4ae8-bec4-edad8162a505',	'2026-07-25',	246.58,	25000.00,	12,	'9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	'PENDING',	25246.58,	0.00),
('7a9996e1-2bac-4358-b037-f8687dbcfc9f',	'2026-10-10',	1726.03,	25000.00,	4,	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'PENDING',	26726.03,	150000.00),
('31239186-4f76-42b8-81de-40d6af5c5d50',	'2026-11-10',	1479.45,	25000.00,	5,	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'PENDING',	26479.45,	125000.00),
('f22ca74c-331c-4469-83b0-c8dc148644e3',	'2026-12-10',	1232.88,	25000.00,	6,	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'PENDING',	26232.88,	100000.00),
('a7098168-8364-46e0-b64b-86774ce4a8dc',	'2027-01-10',	986.30,	25000.00,	7,	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'PENDING',	25986.30,	75000.00),
('b57af567-78a2-47f9-aa5a-0dd4f2591fa2',	'2027-02-10',	739.73,	25000.00,	8,	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'PENDING',	25739.73,	50000.00),
('e78b14ed-b1f5-4d6a-95f0-81ad889f221b',	'2027-03-10',	493.15,	25000.00,	9,	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'PENDING',	25493.15,	25000.00),
('db439f05-76e6-4eb0-a047-c715fb06359a',	'2027-04-10',	246.58,	25000.00,	10,	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'PENDING',	25246.58,	0.00),
('1deb52e6-2d92-458d-80d4-98b20addf124',	'2026-07-10',	2465.75,	25000.00,	1,	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'PAID',	27465.75,	225000.00),
('7b754c73-7535-493a-adaf-1fb48a06df2a',	'2026-08-10',	2219.18,	25000.00,	2,	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'PAID',	27219.18,	200000.00),
('90e702f8-7865-4998-8baf-256f55e979d6',	'2026-09-10',	0.00,	1972.60,	3,	'ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'PENDING',	1972.60,	175000.00);

DROP TABLE IF EXISTS "loan_types";
CREATE TABLE "loan_service"."loan_types" (
    "loan_type_id" uuid NOT NULL,
    "created_at" timestamp(6),
    "description" text,
    "eligibility_criteria" text,
    "interest_rate" numeric(5,2),
    "is_active" boolean,
    "max_amount" numeric(15,2),
    "max_term_months" integer,
    "name" character varying(100) NOT NULL,
    "updated_at" timestamp(6),
    CONSTRAINT "loan_types_pkey" PRIMARY KEY ("loan_type_id")
)
WITH (oids = false);

CREATE UNIQUE INDEX ukapoh9bmlluascvarkfjieh10v ON loan_service.loan_types USING btree (name);

INSERT INTO "loan_types" ("loan_type_id", "created_at", "description", "eligibility_criteria", "interest_rate", "is_active", "max_amount", "max_term_months", "name", "updated_at") VALUES
('7e81ca3b-1e54-4ef4-9015-df09e330adde',	'2026-06-16 07:06:47.14284',	'Consumer Loan',	NULL,	12.00,	'1',	500000.00,	60,	'පාරිභෝගික ණය',	'2026-06-16 07:06:47.14284'),
('7913fb11-31e8-4386-893d-53460eebe451',	'2026-06-16 07:06:47.14284',	'Short Term Loan',	NULL,	14.00,	'1',	100000.00,	12,	'කෙටි ණය',	'2026-06-16 07:06:47.14284'),
('f5bf1a12-619c-4afa-99b1-2368b3fd5a75',	'2026-06-16 07:06:47.14284',	'Employee Loan',	NULL,	10.00,	'1',	300000.00,	36,	'සේවක ණය',	'2026-06-16 07:06:47.14284'),
('2ea36a45-6fe2-4516-bd40-06e3448e08bf',	'2026-06-16 07:06:47.14284',	'Emergency Loan',	NULL,	8.00,	'1',	50000.00,	10,	'ආපදා ණය',	'2026-06-16 07:06:47.14284'),
('47a8afaa-7b76-413c-bf5d-fb8b2f41a65b',	'2026-06-16 07:06:47.14284',	'FD Backed Loan',	NULL,	11.00,	'1',	1000000.00,	60,	'FD ණය (ස්ථාවර තැන්පතු ණය)',	'2026-06-16 07:06:47.14284'),
('25a2cc34-acd6-441e-a376-7d065a6fa30a',	'2026-06-16 07:06:47.14284',	'Provident Fund Loan',	NULL,	9.00,	'1',	500000.00,	60,	'අර්ත සාදක ණය',	'2026-06-16 07:06:47.14284'),
('3082b114-800b-4e9d-b675-8574dbfff675',	'2026-06-16 07:06:47.14284',	'Telephone Loan',	NULL,	15.00,	'1',	100000.00,	24,	'දුරකථන ණය',	'2026-06-16 07:06:47.14284'),
('4d930424-5385-4e6b-b8fd-90b6380fe6a3',	'2026-06-16 07:06:47.14284',	'General Assembly Loan',	NULL,	12.00,	'1',	200000.00,	36,	'මහා සභා ණය',	'2026-06-16 07:06:47.14284'),
('03f8426f-281e-4aff-9218-1e2bdbee00ce',	'2026-06-16 07:06:47.14284',	'MPCS Loan',	NULL,	10.00,	'1',	2000000.00,	60,	'MPCS ණය (විවිධ සේවා සමූපාකාර සමිති ණය)',	'2026-06-16 07:06:47.14284'),
('b2a866d9-f40c-4c38-a0a9-0c53ad3c6580',	'2026-06-16 07:06:47.14284',	'Share Backed Loan',	NULL,	12.00,	'1',	50000.00,	12,	'කොටස් මත ණය',	'2026-06-16 07:06:47.14284'),
('61b2a798-43b3-4eaa-bbb3-63a2a9eeefeb',	'2026-06-16 07:06:47.14284',	'Advance Loan',	NULL,	0.00,	'1',	25000.00,	6,	'අත්තිකාරම් ණය',	'2026-06-16 07:06:47.14284'),
('09b1ab24-8717-451a-aa66-f42c0a1855ce',	'2026-06-16 07:06:47.14284',	'Overdue Loan',	NULL,	24.00,	'1',	0.00,	0,	'කල්පසු ණය',	'2026-06-16 07:06:47.14284'),
('31205fee-4988-4bf0-bd1c-05588cda646c',	'2026-06-16 07:06:47.14284',	'Society Overdue Loan',	NULL,	24.00,	'1',	0.00,	0,	'සමිතියේ කල්පසු ණය',	'2026-06-16 07:06:47.14284');

DROP TABLE IF EXISTS "loans";
CREATE TABLE "loan_service"."loans" (
    "loan_id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "member_id" uuid NOT NULL,
    "loan_type" character varying(255),
    "requested_amount" numeric(15,2) NOT NULL,
    "approved_amount" numeric(15,2),
    "interest_rate" numeric(5,2) NOT NULL,
    "term_months" integer NOT NULL,
    "branch_id" integer NOT NULL,
    "current_stage" character varying(50) DEFAULT 'STAGE_1_FIELD_VERIFICATION',
    "status" character varying(20) DEFAULT 'PENDING',
    "applied_date" date DEFAULT CURRENT_DATE,
    "application_data" jsonb,
    "created_at" timestamp(6),
    "updated_at" timestamp(6),
    "loan_type_id" uuid,
    "account_number" character varying(50),
    "disbursement_date" timestamp,
    "disbursed_amount" numeric(15,2),
    "disbursed_by" character varying(100),
    CONSTRAINT "loans_pkey" PRIMARY KEY ("loan_id")
)
WITH (oids = false);

INSERT INTO "loans" ("loan_id", "member_id", "loan_type", "requested_amount", "approved_amount", "interest_rate", "term_months", "branch_id", "current_stage", "status", "applied_date", "application_data", "created_at", "updated_at", "loan_type_id", "account_number", "disbursement_date", "disbursed_amount", "disbursed_by") VALUES
('13a38797-6059-4a40-a475-2422753c3032',	'9a387d8f-5900-420e-b0cf-19899e694037',	NULL,	200000.00,	NULL,	12.00,	36,	1,	'DISBURSED',	'ACTIVE',	'2026-06-17',	'{"dob": "2001-10-16", "nic": "200179002577", "phone": "0777442729", "assets": {"other": "", "animals": "", "landGoda": "", "landMada": "", "vehicles": ""}, "branch": "", "gender": "ස්ත්රී", "memberNo": "2", "guarantor1": {"dob": "1986-02-02", "job": "Manager", "nic": "861453597V", "bank": {"fixed": "", "savings": "", "dhanaYojana": ""}, "name": "Amila Kumarasri", "phone": "0777442800", "assets": {"land": "", "other": "", "animals": "", "vehicles": ""}, "family": [{"age": "", "job": "", "name": "", "relation": ""}], "address": "Baddeagama", "memberNo": "", "incomeOther": "", "incomePrimary": "500000", "digitalSignatureUrl": ""}, "guarantor2": {"dob": "1965-02-08", "job": "Hotel", "nic": "6561320255V", "bank": {"fixed": "", "savings": "", "dhanaYojana": ""}, "name": "Nihal Perera", "phone": "0777267542", "assets": {"land": "", "other": "", "animals": "", "vehicles": ""}, "family": [{"age": "", "job": "", "name": "", "relation": ""}], "address": "Kandy", "memberNo": "", "incomeOther": "", "incomePrimary": "600000", "digitalSignatureUrl": ""}, "primaryJob": "Intern", "civilStatus": "අවිවාහක", "loanPurpose": "For buying a laptop", "addressLine1": "Baddegama", "addressLine2": "", "bankAccounts": {"fixed": {"accNo": "", "branch": "", "balance": ""}, "current": {"accNo": "", "branch": "", "balance": ""}, "savings": {"accNo": "721357923", "branch": "BOC", "balance": "500"}, "dhanaYojana": {"accNo": "", "branch": "", "balance": ""}}, "annualExpense": "150000", "applicantName": "Poorni Karishma Rohan Abeysekara", "familyMembers": [{"age": "", "job": "", "name": "", "relation": ""}], "sharesObtained": "9998", "spouseJobTitle": "-", "dependentsCount": "5", "employerDetails": "Sanota Pvt Ltd", "residencePeriod": "13", "otherCoopDetails": "", "requiredLoanCash": "200000", "annualIncomeOther": "", "existingLoansCoop": "", "requiredLoanGoods": "", "existingLoansOther": "", "annualIncomePrimary": "150000", "headOfHouseholdName": "N R Abeysekara", "isMemberOfOtherCoop": "නැත", "guarantorOfOtherLoan1": "", "guarantorOfOtherLoan2": "", "repaymentPeriodMonths": "36", "spouseEmployerDetails": "-"}',	'2026-06-17 10:28:20.136369',	'2026-06-22 07:50:39.306958',	'7e81ca3b-1e54-4ef4-9015-df09e330adde',	'LN-HKW-2026-4728',	'2026-06-22 07:50:36.389633',	200000.00,	'mgr_hkw'),
('7b460fc9-8a75-4834-913c-108959f31377',	'05a1cacd-d86b-4edf-b2fc-e84b8d7d24ee',	'පාරිභෝගික ණය',	500000.00,	NULL,	12.00,	10,	1,	'STAGE_1_MANAGER_APPROVAL',	'PENDING',	'2026-06-23',	'{"dob": "2003-07-11", "nic": "200226803467", "phone": "0754796701", "assets": {"other": "", "animals": "", "landGoda": "", "landMada": "", "vehicles": ""}, "branch": "", "gender": "පුරුෂ", "memberNo": "M0001", "guarantor1": {"dob": "", "job": "", "nic": "", "bank": {"fixed": "", "savings": "", "dhanaYojana": ""}, "name": "", "phone": "", "assets": {"land": "", "other": "", "animals": "", "vehicles": ""}, "family": [{"age": "", "job": "", "name": "", "relation": ""}], "address": "", "memberNo": "", "incomeOther": "", "incomePrimary": "", "digitalSignatureUrl": ""}, "guarantor2": {"dob": "", "job": "", "nic": "", "bank": {"fixed": "", "savings": "", "dhanaYojana": ""}, "name": "", "phone": "", "assets": {"land": "", "other": "", "animals": "", "vehicles": ""}, "family": [{"age": "", "job": "", "name": "", "relation": ""}], "address": "", "memberNo": "", "incomeOther": "", "incomePrimary": "", "digitalSignatureUrl": ""}, "primaryJob": "Software Engineer", "civilStatus": "අවිවාහක", "loanPurpose": "For making a house", "addressLine1": "301/A Sinhale Gedara Dorape, Angulugaha", "addressLine2": "", "bankAccounts": {"fixed": {"accNo": "", "branch": "", "balance": ""}, "current": {"accNo": "80142567", "branch": "sanasa ", "balance": "5000"}, "savings": {"accNo": "", "branch": "", "balance": ""}, "dhanaYojana": {"accNo": "", "branch": "", "balance": ""}}, "annualExpense": "200000", "applicantName": "Isuru Sajan Perera", "familyMembers": [{"age": "", "job": "", "name": "", "relation": ""}], "sharesObtained": "", "spouseJobTitle": "", "dependentsCount": "", "employerDetails": "Knoweb Pvt Ltd", "residencePeriod": "5", "otherCoopDetails": "", "requiredLoanCash": "500000", "annualIncomeOther": "", "existingLoansCoop": "", "requiredLoanGoods": "", "existingLoansOther": "", "annualIncomePrimary": "200000", "headOfHouseholdName": "", "isMemberOfOtherCoop": "නැත", "guarantorOfOtherLoan1": "", "guarantorOfOtherLoan2": "", "repaymentPeriodMonths": "10", "spouseEmployerDetails": ""}',	'2026-06-23 09:34:57.288628',	'2026-06-23 09:34:57.288799',	'7e81ca3b-1e54-4ef4-9015-df09e330adde',	NULL,	NULL,	NULL,	NULL),
('bac6d9c7-cc79-4014-aa82-f37c8e5d0f38',	'00000000-0000-0000-0000-000000000000',	'පාරිභෝගික ණය',	0.00,	NULL,	12.00,	12,	1,	'STAGE_1_MANAGER_APPROVAL',	'REJECTED',	'2026-06-23',	'{"dob": "", "nic": "", "phone": "", "assets": {"other": "", "animals": "", "landGoda": "", "landMada": "", "vehicles": ""}, "branch": "", "gender": "", "memberNo": "", "guarantor1": {"dob": "", "job": "", "nic": "", "bank": {"fixed": "", "savings": "", "dhanaYojana": ""}, "name": "", "phone": "", "assets": {"land": "", "other": "", "animals": "", "vehicles": ""}, "family": [{"age": "", "job": "", "name": "", "relation": ""}], "address": "", "memberNo": "", "incomeOther": "", "incomePrimary": "", "digitalSignatureUrl": ""}, "guarantor2": {"dob": "", "job": "", "nic": "", "bank": {"fixed": "", "savings": "", "dhanaYojana": ""}, "name": "", "phone": "", "assets": {"land": "", "other": "", "animals": "", "vehicles": ""}, "family": [{"age": "", "job": "", "name": "", "relation": ""}], "address": "", "memberNo": "", "incomeOther": "", "incomePrimary": "", "digitalSignatureUrl": ""}, "primaryJob": "", "civilStatus": "", "loanPurpose": "", "addressLine1": "", "addressLine2": "", "bankAccounts": {"fixed": {"accNo": "", "branch": "", "balance": ""}, "current": {"accNo": "", "branch": "", "balance": ""}, "savings": {"accNo": "", "branch": "", "balance": ""}, "dhanaYojana": {"accNo": "", "branch": "", "balance": ""}}, "annualExpense": "", "applicantName": "", "familyMembers": [{"age": "", "job": "", "name": "", "relation": ""}], "sharesObtained": "", "spouseJobTitle": "", "dependentsCount": "", "employerDetails": "", "residencePeriod": "", "otherCoopDetails": "", "requiredLoanCash": "", "annualIncomeOther": "", "existingLoansCoop": "", "requiredLoanGoods": "", "existingLoansOther": "", "annualIncomePrimary": "", "headOfHouseholdName": "", "isMemberOfOtherCoop": "", "guarantorOfOtherLoan1": "", "guarantorOfOtherLoan2": "", "repaymentPeriodMonths": "", "spouseEmployerDetails": ""}',	'2026-06-23 09:38:33.612568',	'2026-06-23 10:02:09.540259',	'7e81ca3b-1e54-4ef4-9015-df09e330adde',	NULL,	NULL,	NULL,	NULL),
('d05cfc20-9ab6-42ee-bb14-84e92c4cc635',	'2276410d-4d1d-484d-aca3-e5af0bd2623d',	'පාරිභෝගික ණය',	500000.00,	NULL,	12.00,	20,	1,	'DISBURSED',	'ACTIVE',	'2026-06-23',	'{"dob": "1998-04-11", "nic": "199820004005", "phone": "0776263411", "assets": {"other": "", "animals": "", "landGoda": "", "landMada": "", "vehicles": ""}, "branch": "", "gender": "ස්ත්රී", "memberNo": "M010", "guarantor1": {"dob": "1953-05-01", "job": "Retired", "nic": "538942632V", "bank": {"fixed": "", "savings": "", "dhanaYojana": ""}, "name": "Udaya Kumara", "phone": "07777444272", "assets": {"land": "", "other": "", "animals": "", "vehicles": ""}, "family": [{"age": "", "job": "", "name": "", "relation": ""}], "address": "Kurunegala", "memberNo": "", "incomeOther": "", "incomePrimary": "", "digitalSignatureUrl": ""}, "guarantor2": {"dob": "2001-02-07", "job": "Seaman", "nic": "200175002577", "bank": {"fixed": "", "savings": "", "dhanaYojana": ""}, "name": "Hirusha Dinal", "phone": "07753572611", "assets": {"land": "", "other": "", "animals": "", "vehicles": ""}, "family": [{"age": "", "job": "", "name": "", "relation": ""}], "address": "Kolonnawa", "memberNo": "", "incomeOther": "", "incomePrimary": "", "digitalSignatureUrl": ""}, "primaryJob": "Nurse", "civilStatus": "අවිවාහක", "loanPurpose": "Build a house", "addressLine1": "231/B/1, Kandaduwa Road, Ganegama South, Baddegama", "addressLine2": "", "bankAccounts": {"fixed": {"accNo": "", "branch": "", "balance": ""}, "current": {"accNo": "", "branch": "", "balance": ""}, "savings": {"accNo": "", "branch": "", "balance": ""}, "dhanaYojana": {"accNo": "", "branch": "", "balance": ""}}, "annualExpense": "500000", "applicantName": "Shashika Sandamini Rohan Abeysekara", "familyMembers": [{"age": "", "job": "", "name": "", "relation": ""}], "sharesObtained": "", "spouseJobTitle": "", "dependentsCount": "", "employerDetails": "Galle", "residencePeriod": "", "otherCoopDetails": "", "requiredLoanCash": "500000", "annualIncomeOther": "", "existingLoansCoop": "", "requiredLoanGoods": "", "existingLoansOther": "", "annualIncomePrimary": "500000", "headOfHouseholdName": "", "isMemberOfOtherCoop": "නැත", "guarantorOfOtherLoan1": "", "guarantorOfOtherLoan2": "", "repaymentPeriodMonths": "20", "spouseEmployerDetails": ""}',	'2026-06-23 15:31:26.766731',	'2026-06-23 15:44:19.707831',	'7e81ca3b-1e54-4ef4-9015-df09e330adde',	'LN-HKW-2026-9466',	'2026-06-23 15:43:49.478034',	500000.00,	'mgr_hkw'),
('9a21d397-449a-4cc8-91da-f2f68c7b1bfd',	'9a387d8f-5900-420e-b0cf-19899e694037',	'පාරිභෝගික ණය',	300000.00,	NULL,	12.00,	12,	1,	'DISBURSED',	'ACTIVE',	'2025-07-25',	'{"dob": "2001-10-16", "nic": "200179002577", "phone": "0777442729", "assets": {"other": "", "animals": "", "landGoda": "", "landMada": "", "vehicles": ""}, "branch": "", "gender": "", "memberNo": "2", "guarantor1": {"dob": "2026-06-02", "job": "", "nic": "regege", "bank": {"fixed": "", "savings": "", "dhanaYojana": ""}, "name": "trhstrh", "phone": "egerge", "assets": {"land": "", "other": "", "animals": "", "vehicles": ""}, "family": [{"age": "", "job": "", "name": "", "relation": ""}], "address": "egerge", "memberNo": "", "incomeOther": "", "incomePrimary": "500000", "digitalSignatureUrl": ""}, "guarantor2": {"dob": "2026-06-10", "job": "", "nic": "50486851g53165151", "bank": {"fixed": "", "savings": "", "dhanaYojana": ""}, "name": "rthsrthrsh", "phone": "egegege", "assets": {"land": "", "other": "", "animals": "", "vehicles": ""}, "family": [{"age": "", "job": "", "name": "", "relation": ""}], "address": "gebge", "memberNo": "", "incomeOther": "", "incomePrimary": "599998", "digitalSignatureUrl": ""}, "primaryJob": "", "appliedDate": "2025-07-25", "civilStatus": "අවිවාහක", "loanPurpose": "for wedding", "addressLine1": "Baddegama", "addressLine2": "", "bankAccounts": {"fixed": {"accNo": "", "branch": "", "balance": ""}, "current": {"accNo": "", "branch": "", "balance": ""}, "savings": {"accNo": "", "branch": "", "balance": ""}, "dhanaYojana": {"accNo": "", "branch": "", "balance": ""}}, "annualExpense": "360000", "applicantName": "Poorni Karishma Rohan Abeysekara", "familyMembers": [{"age": "", "job": "", "name": "", "relation": ""}], "sharesObtained": "", "spouseJobTitle": "", "dependentsCount": "", "employerDetails": "", "residencePeriod": "", "otherCoopDetails": "", "requiredLoanCash": "300000", "annualIncomeOther": "", "existingLoansCoop": "", "requiredLoanGoods": "", "existingLoansOther": "", "annualIncomePrimary": "360000", "headOfHouseholdName": "", "isMemberOfOtherCoop": "නැත", "guarantorOfOtherLoan1": "", "guarantorOfOtherLoan2": "", "repaymentPeriodMonths": "12", "spouseEmployerDetails": ""}',	'2026-06-25 04:23:01.977983',	'2026-06-25 04:52:44.754398',	'7e81ca3b-1e54-4ef4-9015-df09e330adde',	'LN-HKW-2026-4959',	'2026-06-25 04:52:41.487833',	300000.00,	'mgr_hkw'),
('ead68f0c-d0b0-43d2-a7f1-031016f5904b',	'b1ae2603-1549-4132-bfb8-bf71139a0531',	'පාරිභෝගික ණය',	250000.00,	NULL,	12.00,	10,	1,	'DISBURSED',	'ACTIVE',	'2026-06-10',	'{"dob": "2002-07-09", "nic": "200226803042", "phone": "0754796701", "assets": {"other": "", "animals": "", "landGoda": "", "landMada": "", "vehicles": ""}, "branch": "", "gender": "පුරුෂ", "memberNo": "NM0001", "guarantor1": {"dob": "", "job": "", "nic": "sfsgsdg", "bank": {"fixed": "", "savings": "", "dhanaYojana": ""}, "name": "gwesegsdg", "phone": "sgrsdgsdg", "assets": {"land": "", "other": "", "animals": "", "vehicles": ""}, "family": [{"age": "", "job": "", "name": "", "relation": ""}], "address": "sdgsdgsd", "memberNo": "", "incomeOther": "", "incomePrimary": "5242424", "digitalSignatureUrl": ""}, "guarantor2": {"dob": "", "job": "", "nic": "rgwegwegwe", "bank": {"fixed": "", "savings": "", "dhanaYojana": ""}, "name": "fgdgdseg", "phone": "rwgegeg", "assets": {"land": "", "other": "", "animals": "", "vehicles": ""}, "family": [{"age": "", "job": "", "name": "", "relation": ""}], "address": "rgegege", "memberNo": "", "incomeOther": "", "incomePrimary": "52052782", "digitalSignatureUrl": ""}, "primaryJob": "", "appliedDate": "2026-06-10", "civilStatus": "අවිවාහක", "loanPurpose": "jnhklukhk", "addressLine1": "301/A Sinhale Gedara Dorape, Angulugaha", "addressLine2": "", "bankAccounts": {"fixed": {"accNo": "", "branch": "", "balance": ""}, "current": {"accNo": "", "branch": "", "balance": ""}, "savings": {"accNo": "45678909", "branch": "ශාඛාව", "balance": "25000"}, "dhanaYojana": {"accNo": "", "branch": "", "balance": ""}}, "annualExpense": "250000", "applicantName": "Achintha Buffe Perera", "familyMembers": [{"age": "", "job": "", "name": "", "relation": ""}], "sharesObtained": "", "spouseJobTitle": "", "dependentsCount": "", "employerDetails": "", "residencePeriod": "", "otherCoopDetails": "", "requiredLoanCash": "250000", "annualIncomeOther": "", "existingLoansCoop": "", "requiredLoanGoods": "", "existingLoansOther": "", "annualIncomePrimary": "250000", "headOfHouseholdName": "", "isMemberOfOtherCoop": "නැත", "guarantorOfOtherLoan1": "", "guarantorOfOtherLoan2": "", "repaymentPeriodMonths": "10", "spouseEmployerDetails": ""}',	'2026-06-25 05:43:10.086956',	'2026-06-25 05:46:46.522086',	'7e81ca3b-1e54-4ef4-9015-df09e330adde',	'LN-HKW-2026-6637',	'2026-06-25 05:46:44.384158',	250000.00,	'mgr_hkw');

ALTER TABLE ONLY "loan_service"."emi_schedules" ADD CONSTRAINT "emi_schedules_loan_id_fkey" FOREIGN KEY (loan_id) REFERENCES loans(loan_id);

ALTER TABLE ONLY "loan_service"."loan_collateral" ADD CONSTRAINT "loan_collateral_loan_id_fkey" FOREIGN KEY (loan_id) REFERENCES loans(loan_id);

ALTER TABLE ONLY "loan_service"."loan_guarantors" ADD CONSTRAINT "loan_guarantors_loan_id_fkey" FOREIGN KEY (loan_id) REFERENCES loans(loan_id);

ALTER TABLE ONLY "loan_service"."loans" ADD CONSTRAINT "fkg5kc6jabj9q90obnbbhusa9ef" FOREIGN KEY (loan_type_id) REFERENCES loan_types(loan_type_id);

-- 2026-06-25 09:53:13 UTC
