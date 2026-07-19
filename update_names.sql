DO $$
DECLARE
    rec RECORD;
    v_english_names VARCHAR[] := ARRAY[
        'A. Perera', 'S. Kumara', 'K. Perera', 'S. Shantha', 'N. Ranasinghe',
        'C. De Silva', 'R. Pathirana', 'J. Kumara', 'A. Pradeep', 'R. Fernando',
        'D. Maduranga', 'L. Madushan', 'P. Chathuranga', 'C. Roshan', 'M. Bandara',
        'N. Kumari', 'S. Malkanthi', 'N. Perera', 'C. De Silva', 'D. Ranasinghe',
        'C. Fernando', 'S. Madushani', 'N. Pathirana', 'H. Bandara', 'R. Shanthi',
        'A. Sandamali', 'D. Kumari', 'R. Dilrukshi', 'I. Damayanthi', 'C. Niwanthi',
        'U. Shantha', 'N. Kumara', 'S. Priyankara', 'M. Perera', 'T. De Silva',
        'N. Pathirana', 'C. Ranasinghe', 'K. Pramod', 'S. Madhubhashana', 'D. Prasad',
        'N. Kumara', 'A. Sampath', 'S. Bandara', 'A. Ruwan', 'C. Fernando',
        'N. Pradeep', 'R. Chinthaka', 'S. Kumara', 'A. Perera', 'M. Fernando'
    ];
    i INT := 1;
    v_seq INT := 1001;
BEGIN
    FOR rec IN (SELECT member_id FROM member_service.members WHERE registered_branch_id = 3 ORDER BY created_at) LOOP
        UPDATE member_service.members 
        SET 
            full_name = v_english_names[i],
            full_name_sinhala = v_english_names[i],
            name_with_initials = v_english_names[i],
            membership_number = 'M-3-' || v_seq::text
        WHERE member_id = rec.member_id;
        
        i := i + 1;
        v_seq := v_seq + 1;
        
        -- Safe check if we somehow have more than 50 members
        IF i > 50 THEN
            i := 1; 
        END IF;
    END LOOP;
END $$;
