DO $$
DECLARE
    v_child1_id UUID;
    v_child2_id UUID;
    v_guardian_no VARCHAR;
    v_guardian_nic VARCHAR;
BEGIN
    -- Get a guardian from Seenigama
    SELECT membership_number, nic INTO v_guardian_no, v_guardian_nic 
    FROM member_service.members 
    WHERE registered_branch_id = 4 AND age_category = 'ADULT' AND membership_number IS NOT NULL
    LIMIT 1;
    
    -- Pick 2 normal accounts
    SELECT a.member_id INTO v_child1_id 
    FROM account_service.savings_accounts a
    WHERE a.branch_id = 4 AND a.account_type = 'NORMAL' 
    LIMIT 1;
    
    SELECT a.member_id INTO v_child2_id 
    FROM account_service.savings_accounts a
    WHERE a.branch_id = 4 AND a.account_type = 'NORMAL' AND a.member_id != v_child1_id
    LIMIT 1;
    
    -- Update Child 1 (Arunalu)
    UPDATE member_service.members
    SET age_category = 'CHILD',
        date_of_birth = '2018-05-10',
        guardian_member_no = v_guardian_no,
        guardian_nic = v_guardian_nic
    WHERE member_id = v_child1_id;
    
    UPDATE account_service.savings_accounts
    SET account_type = 'ARUNALU'
    WHERE member_id = v_child1_id;
    
    -- Update Child 2 (Ranthilina)
    UPDATE member_service.members
    SET age_category = 'CHILD',
        date_of_birth = '2020-08-15',
        guardian_member_no = v_guardian_no,
        guardian_nic = v_guardian_nic
    WHERE member_id = v_child2_id;
    
    UPDATE account_service.savings_accounts
    SET account_type = 'RANTHILINA'
    WHERE member_id = v_child2_id;
    
    RAISE NOTICE 'Added ARUNALU and RANTHILINA child accounts with guardian %', v_guardian_no;
END $$;
