DO $$
DECLARE
    rec RECORD;
        v_english_names VARCHAR[] := ARRAY[
        'S. Priyankara', 'M. Bandara', 'R. Chinthaka', 'C. De Silva', 'D. Ranasinghe',
        'A. Perera', 'I. Damayanthi', 'N. Pathirana', 'M. Fernando', 'N. Kumari',
        'U. Shantha', 'S. Shantha', 'C. Roshan', 'N. Pathirana', 'N. Kumara',
        'C. Fernando', 'P. Chathuranga', 'M. Perera', 'K. Perera', 'N. Ranasinghe',
        'S. Kumara', 'K. Pramod', 'C. De Silva', 'S. Bandara', 'S. Kumara',
        'A. Perera', 'D. Kumari', 'A. Sandamali', 'N. Perera', 'D. Prasad',
        'S. Malkanthi', 'L. Madushan', 'C. Fernando', 'S. Madushani', 'R. Fernando',
        'A. Sampath', 'T. De Silva', 'N. Pradeep', 'N. Kumara', 'A. Ruwan',
        'A. Pradeep', 'C. Ranasinghe', 'R. Pathirana', 'C. Niwanthi', 'D. Maduranga',
        'J. Kumara', 'S. Madhubhashana', 'R. Dilrukshi', 'H. Bandara', 'R. Shanthi'
    ];
    i INT := 1;
    v_seq INT := 1001;
BEGIN
    FOR rec IN (SELECT member_id FROM member_service.members WHERE registered_branch_id = 1 ORDER BY created_at) LOOP
        UPDATE member_service.members 
        SET 
            full_name = v_english_names[i],
            full_name_sinhala = v_english_names[i],
            name_with_initials = v_english_names[i],
            membership_number = 'M-1-' || v_seq::text
        WHERE member_id = rec.member_id;
        
        i := i + 1;
        v_seq := v_seq + 1;
        
        -- Safe check if we somehow have more than 50 members
        IF i > 50 THEN
            i := 1; 
        END IF;
    END LOOP;
END $$;
