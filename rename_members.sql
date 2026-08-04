DO $$
DECLARE
    r RECORD;
    counter INT;
    new_name VARCHAR(150);
BEGIN
    FOR r IN (
        SELECT name_with_initials, member_id
        FROM member_service.members
        WHERE tenant_id = 1
          AND name_with_initials IN (
              SELECT name_with_initials 
              FROM member_service.members 
              WHERE tenant_id = 1 
              GROUP BY name_with_initials 
              HAVING COUNT(*) > 1
          )
        ORDER BY name_with_initials, member_id
    ) LOOP
        -- For each name, find its rank/occurrence number
        SELECT COUNT(*) INTO counter
        FROM member_service.members
        WHERE tenant_id = 1 
          AND name_with_initials = r.name_with_initials
          AND member_id <= r.member_id;
          
        IF counter > 1 THEN
            -- Generate a new initial (A, B, C...) based on the counter
            new_name := CHR(64 + counter) || SUBSTRING(r.name_with_initials, POSITION('.' IN r.name_with_initials));
            
            UPDATE member_service.members
            SET name_with_initials = new_name,
                full_name = new_name
            WHERE member_id = r.member_id;
        END IF;
    END LOOP;
END $$;
