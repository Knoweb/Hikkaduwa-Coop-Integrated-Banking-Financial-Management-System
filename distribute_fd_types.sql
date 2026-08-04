DO $$ 
DECLARE
    fd RECORD;
    v_type_id UUID;
    v_category_names TEXT[] := ARRAY[
        'සාමාන්‍ය ස්ථාවර තැන්පතු', 
        'ජ්‍යෙෂ්ඨ පුරවැසි තැන්පතු', 
        'ළමා ස්ථාවර තැන්පතු', 
        'ජය ස්ථාවර තැන්පතු', 
        'සියවස් ස්ථාවර තැන්පතු', 
        'යළි ගොඩණැගෙමු ස්ථාවර තැන්පතු', 
        'ජංගම සේවක ස්ථාවර තැන්පතු', 
        'කොටස් මුදල් ස්ථාවර තැන්පතු', 
        'රූ බෑන්ක් ප්ලස් ස්ථාවර තැන්පතු'
    ];
    v_cat TEXT;
    i INTEGER := 1;
BEGIN
    FOR fd IN SELECT fd_id FROM account_service.fixed_deposits LOOP
        -- Select a category based on the loop index to distribute evenly
        v_cat := v_category_names[((i - 1) % 9) + 1];
        
        -- Find a type_id matching this category
        SELECT id INTO v_type_id 
        FROM account_service.fixed_deposit_types 
        WHERE name LIKE v_cat || '%' 
        ORDER BY random() 
        LIMIT 1;
        
        IF v_type_id IS NOT NULL THEN
            UPDATE account_service.fixed_deposits 
            SET type_id = v_type_id 
            WHERE fd_id = fd.fd_id;
        END IF;

        i := i + 1;
    END LOOP;
END $$;
