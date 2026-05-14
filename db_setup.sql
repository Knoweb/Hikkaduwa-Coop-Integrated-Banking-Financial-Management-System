CREATE SCHEMA IF NOT EXISTS member_service AUTHORIZATION hmcs_app;

GRANT ALL PRIVILEGES ON SCHEMA member_service TO hmcs_app;

CREATE TABLE member_service.members (
    member_id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT,
    full_name VARCHAR(255),
    nic VARCHAR(255) UNIQUE,
    address TEXT,
    contact_number VARCHAR(50),
    date_of_birth DATE,
    status VARCHAR(50),
    created_at TIMESTAMP
);

CREATE TABLE member_service.savings_accounts (
    account_id BIGSERIAL PRIMARY KEY,
    account_number VARCHAR(255) UNIQUE NOT NULL,
    member_id BIGINT NOT NULL REFERENCES member_service.members(member_id),
    branch_id BIGINT,
    balance NUMERIC(19, 2),
    account_type VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMP
);

ALTER TABLE member_service.members OWNER TO hmcs_app;
ALTER TABLE member_service.savings_accounts OWNER TO hmcs_app;
