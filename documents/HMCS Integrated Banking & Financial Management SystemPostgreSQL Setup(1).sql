-- =================================================================================
-- HMCS Integrated Banking & Financial Management System - PostgreSQL Setup
-- =================================================================================

-- 1. Create Logical Schemas for Microservices
CREATE SCHEMA IF NOT EXISTS auth_service;
CREATE SCHEMA IF NOT EXISTS member_service;
CREATE SCHEMA IF NOT EXISTS account_service;
CREATE SCHEMA IF NOT EXISTS loan_service;
CREATE SCHEMA IF NOT EXISTS pawning_service;

-- ==========================================
-- IDENTITY & ACCESS SERVICE (auth_service)
-- ==========================================
CREATE TABLE auth_service.branches (
    branch_id SERIAL PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

CREATE TABLE auth_service.roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE auth_service.users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL REFERENCES auth_service.roles(role_id),
    branch_id INT NOT NULL REFERENCES auth_service.branches(branch_id),
    full_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- MEMBER MANAGEMENT SERVICE (member_service)
-- ==========================================
CREATE TABLE member_service.members (
    member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nic VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    date_of_birth DATE NOT NULL,
    address TEXT NOT NULL,
    contact_number VARCHAR(15),
    registered_branch_id INT NOT NULL,
    digital_signature_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- ACCOUNT & TRANSACTION SERVICE (account_service)
-- ==========================================
CREATE TABLE account_service.accounts (
    account_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_number VARCHAR(20) NOT NULL UNIQUE,
    member_id UUID NOT NULL, 
    account_type VARCHAR(50) NOT NULL, -- SAVINGS, CHILDREN, FIXED_DEPOSIT
    balance DECIMAL(15, 2) DEFAULT 0.00,
    branch_id INT NOT NULL,
    opened_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

CREATE TABLE account_service.transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES account_service.accounts(account_id),
    transaction_type VARCHAR(20) NOT NULL, -- DEPOSIT, WITHDRAWAL, INTEREST_CREDIT
    amount DECIMAL(15, 2) NOT NULL,
    balance_after DECIMAL(15, 2) NOT NULL,
    processed_by UUID NOT NULL, 
    transaction_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE account_service.fixed_deposits (
    fd_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES account_service.accounts(account_id),
    principal_amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL, 
    term_months INT NOT NULL,
    maturity_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- ==========================================
-- LOAN ORIGINATION & MGMT SERVICE (loan_service)
-- ==========================================
CREATE TABLE loan_service.loans (
    loan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL,
    loan_type VARCHAR(50) NOT NULL,
    requested_amount DECIMAL(15, 2) NOT NULL,
    approved_amount DECIMAL(15, 2),
    interest_rate DECIMAL(5, 2) NOT NULL,
    term_months INT NOT NULL,
    branch_id INT NOT NULL,
    current_stage VARCHAR(50) DEFAULT 'STAGE_1_FIELD_VERIFICATION',
    status VARCHAR(20) DEFAULT 'PENDING',
    applied_date DATE DEFAULT CURRENT_DATE
);

CREATE TABLE loan_service.loan_guarantors (
    guarantor_record_id SERIAL PRIMARY KEY,
    loan_id UUID NOT NULL REFERENCES loan_service.loans(loan_id),
    guarantor_member_id UUID NOT NULL,
    digital_confirmation_url VARCHAR(255)
);

CREATE TABLE loan_service.loan_collateral (
    collateral_id SERIAL PRIMARY KEY,
    loan_id UUID NOT NULL REFERENCES loan_service.loans(loan_id),
    asset_type VARCHAR(50) NOT NULL,
    assessed_value DECIMAL(15, 2) NOT NULL,
    valuer_notes TEXT
);

CREATE TABLE loan_service.emi_schedules (
    schedule_id SERIAL PRIMARY KEY,
    loan_id UUID NOT NULL REFERENCES loan_service.loans(loan_id),
    installment_number INT NOT NULL,
    due_date DATE NOT NULL,
    emi_amount DECIMAL(15, 2) NOT NULL,
    principal_component DECIMAL(15, 2) NOT NULL,
    interest_component DECIMAL(15, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING'
);

-- ==========================================
-- PAWNING SERVICE (pawning_service)
-- ==========================================
CREATE TABLE pawning_service.pawn_tickets (
    ticket_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(20) NOT NULL UNIQUE,
    member_id UUID NOT NULL,
    gross_weight_grams DECIMAL(8, 2) NOT NULL,
    net_weight_grams DECIMAL(8, 2) NOT NULL,
    purity_karat INT NOT NULL,
    assessed_value DECIMAL(15, 2) NOT NULL,
    advance_amount DECIMAL(15, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) DEFAULT 13.00,
    branch_id INT NOT NULL,
    valuer_id UUID NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- ==========================================
-- SEED DATA
-- ==========================================
INSERT INTO auth_service.branches (branch_name, location) VALUES
('Main Branch - Hikkaduwa', 'Hikkaduwa Town'),
('Dodanduwa Branch', 'Dodanduwa'),
('Rathgama Branch', 'Rathgama'),
('Seenigama Branch', 'Seenigama'),
('Thiranagama Branch', 'Thiranagama'),
('Peraliya Branch', 'Peraliya'),
('Kalupe Branch', 'Kalupe'),
('Gonapinuwala Branch', 'Gonapinuwala');

INSERT INTO auth_service.roles (role_name, description) VALUES
('SYSTEM_ADMIN', 'Global IT Administrator'),
('GENERAL_MANAGER', 'General Manager / Secretary with cross-branch view'),
('BRANCH_MANAGER', 'Manager of a specific branch'),
('BANK_SERVICE_MANAGER', 'Compliance and loan directive manager'),
('LOAN_COMMITTEE', 'Loan approval committee member'),
('FIELD_OFFICER', 'Senior/Field Officer for KYC and valuations'),
('TELLER', 'Counter staff for daily cash transactions'),
('VALUER', 'Thaksarukaruge - Gold pawning valuer');