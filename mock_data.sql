DO $$
DECLARE
    v_branch_id INT := 3;
    v_tenant_id INT := 1;
    v_member_id UUID;
    v_account_id UUID;
    v_loan_id UUID;
    v_pawn_id UUID;
    v_fd_id UUID;
    
    v_nic VARCHAR;
    v_year INT;
    v_days INT;
    v_seq INT;
    
    v_names VARCHAR[] := ARRAY[
        'අමරසිරි පීරිස්', 'සමන් කුමාර', 'කමල් පෙරේරා', 'සුනිල් ශාන්ත', 'නිහාල් රණසිංහ',
        'චන්දන ද සිල්වා', 'රුවන් පතිරණ', 'ජයන්ත කුමාර', 'අසංක ප්‍රදීප්', 'රවීන්ද්‍ර ප්‍රනාන්දු',
        'දිනූෂ මධුරංග', 'ලහිරු මධුෂාන්', 'ප්‍රසාද් චතුරංග', 'චින්තක රොෂාන්', 'මහේෂ් බණ්ඩාර',
        'නදීශා කුමාරි', 'සුභානි මල්කාන්ති', 'නිලන්ති පෙරේරා', 'චම්පිකා ද සිල්වා', 'දීපිකා රණසිංහ',
        'චතුරිකා ප්‍රනාන්දු', 'ශානිකා මධුෂානි', 'නිමාලි පතිරණ', 'හංසිනි බණ්ඩාර', 'රේණුකා ශාන්ති',
        'අයේෂා සඳමාලි', 'දර්ශනී කුමාරි', 'රසිකා දිල්රුක්ෂි', 'ඉනෝකා දමයන්ති', 'චමිලා නිවන්ති',
        'උපුල් ශාන්ත', 'නයනජිත් කුමාර', 'සම්පත් ප්‍රියංකර', 'මධුරංග පෙරේරා', 'තරංග ද සිල්වා',
        'නිශාන්ත පතිරණ', 'චාමර රණසිංහ', 'කවිඳු ප්‍රමෝද්', 'සහන් මධුභාෂණ', 'දනුෂ්ක ප්‍රසාද්',
        'නිලුපුල් කුමාර', 'අසංක සම්පත්', 'සුරේෂ් බණ්ඩාර', 'අමිල රුවන්', 'චන්ද්‍රසිරි ප්‍රනාන්දු',
        'නුවන් ප්‍රදීප්', 'රොෂාන් චින්තක', 'සුදත් කුමාර', 'අජිත් පෙරේරා', 'මංජුල ප්‍රනාන්දු'
    ];
    
    i INT;
    
    v_has_loan BOOLEAN;
    v_has_pawn BOOLEAN;
    v_has_fd BOOLEAN;
    
    v_loan_amount NUMERIC;
    v_loan_months INT;
    
    v_past_months INT;
    v_created_at TIMESTAMP;
BEGIN
    FOR i IN 1..50 LOOP
        v_member_id := gen_random_uuid();
        v_account_id := gen_random_uuid();
        
        -- Generate NIC
        v_year := 1975 + floor(random() * 25)::int;
        v_days := 1 + floor(random() * 365)::int;
        IF random() > 0.5 THEN v_days := v_days + 500; END IF;
        v_seq := 1000 + floor(random() * 8999)::int;
        v_nic := v_year::text || lpad(v_days::text, 3, '0') || '0' || v_seq::text;
        
        v_past_months := floor(random() * 36)::int; -- Up to 3 years ago
        v_created_at := NOW() - (v_past_months || ' months')::interval;

        -- 1. Insert Member (Assuming table is member_service.members)
        INSERT INTO member_service.members (
            member_id, nic, full_name, full_name_sinhala, date_of_birth, address, 
            registered_branch_id, status, is_member, created_at, tenant_id
        ) VALUES (
            v_member_id, v_nic, v_names[i], v_names[i], '1990-01-01', 'රත්ගම, ගාල්ල', 
            v_branch_id, 'ACTIVE', true, v_created_at, v_tenant_id
        );
        
        -- 2. Insert Savings Account
        INSERT INTO account_service.savings_accounts (
            account_id, account_number, account_type, branch_id, member_id, 
            balance, status, opened_date, created_at, tenant_id
        ) VALUES (
            v_account_id, 'SV' || v_branch_id || '00' || i || floor(random()*1000)::text, 'NORMAL', v_branch_id, v_member_id, 
            floor(random() * 50000 + 5000), 'ACTIVE', v_created_at::date, v_created_at, v_tenant_id
        );
        
        -- Decide extra products (about 20% chance overall to have combos to get ~10 people)
        v_has_loan := random() < 0.15;
        v_has_pawn := random() < 0.15;
        v_has_fd := random() < 0.15;
        
        -- 3. Loans (Max 5 Lakhs, short term)
        IF v_has_loan THEN
            v_loan_id := gen_random_uuid();
            v_loan_amount := floor(random() * 450000 + 50000); -- 50K to 500K
            v_loan_months := 6 + floor(random() * 6)::int; -- 6 to 11 months
            
            INSERT INTO loan_service.loans (
                loan_id, member_id, requested_amount, approved_amount, interest_rate, term_months, 
                branch_id, current_stage, status, applied_date, created_at, tenant_id, disbursed_amount, account_number
            ) VALUES (
                v_loan_id, v_member_id, v_loan_amount, v_loan_amount, 12.0, v_loan_months,
                v_branch_id, 'DISBURSED', 'ACTIVE', v_created_at::date, v_created_at, v_tenant_id, v_loan_amount, 'SV' || v_branch_id || '00' || i || floor(random()*1000)::text
            );
        END IF;

        -- 4. Pawning
        IF v_has_pawn THEN
            v_pawn_id := gen_random_uuid();
            INSERT INTO pawning_service.pawn_tickets (
                ticket_id, ticket_number, member_id, branch_id, karat, weight_grams, assessed_value, 
                advance_amount, interest_rate, status, issued_date, created_at, tenant_id
            ) VALUES (
                v_pawn_id, 'PW' || v_branch_id || '00' || i, v_member_id, v_branch_id, 22, 10 + floor(random() * 10), 
                200000, 150000, 15.0, 'ACTIVE', v_created_at::date, v_created_at, v_tenant_id
            );
        END IF;

    END LOOP;
END $$;
