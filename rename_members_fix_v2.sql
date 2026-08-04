DO $$
DECLARE
    r RECORD;
    new_name VARCHAR(150);
BEGIN
    FOR r IN (
        SELECT member_id, name_with_initials
        FROM member_service.members
        WHERE tenant_id = 1
    ) LOOP
        -- Generate a random string of 3 characters for the initial to make it unique
        new_name := CHR(floor(random() * 26 + 65)::int) || CHR(floor(random() * 26 + 65)::int) || CHR(floor(random() * 26 + 65)::int) || SUBSTRING(r.name_with_initials, POSITION('.' IN r.name_with_initials));
        
        UPDATE member_service.members
        SET name_with_initials = new_name,
            full_name = new_name
        WHERE member_id = r.member_id;
    END LOOP;
END $$;
