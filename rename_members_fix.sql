DO $$
DECLARE
    r RECORD;
    counter INT;
    new_initial CHAR(1);
    new_name VARCHAR(150);
BEGIN
    FOR r IN (
        SELECT member_id, name_with_initials
        FROM member_service.members
        WHERE tenant_id = 1
        ORDER BY name_with_initials, member_id
    ) LOOP
        -- Generate a random number from 1 to 26 for A-Z
        counter := floor(random() * 26 + 1)::int;
        new_initial := CHR(64 + counter);
        
        new_name := new_initial || SUBSTRING(r.name_with_initials, POSITION('.' IN r.name_with_initials));
        
        UPDATE member_service.members
        SET name_with_initials = new_name,
            full_name = new_name
        WHERE member_id = r.member_id;
    END LOOP;
END $$;
