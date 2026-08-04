DO $$
DECLARE
    r RECORD;
    new_name VARCHAR(150);
BEGIN
    FOR r IN (
        SELECT member_id, 
               SUBSTRING(name_with_initials FROM POSITION('.' IN name_with_initials) + 1) AS last_name,
               ROW_NUMBER() OVER(PARTITION BY SUBSTRING(name_with_initials FROM POSITION('.' IN name_with_initials) + 1) ORDER BY random()) AS rn
        FROM member_service.members
        WHERE tenant_id = 1
    ) LOOP
        -- Generate A. LastName, B. LastName, etc. randomly assigned to avoid alphabetical clustering
        -- chr(64 + rn) gives A for 1, B for 2, etc. We can map rn to a different letter if we want,
        -- but just assigning them sequentially based on a random order is fine.
        -- To make it feel more random, we can use an array of letters and pick the rn-th element.
        
        new_name := (string_to_array('P,K,S,D,M,R,N,A,C,T,W,B,H,G,L,U,V,E,J,F,Y,I,O,Z,Q,X', ','))[((r.rn - 1) % 26) + 1] || '.' || r.last_name;
        
        UPDATE member_service.members
        SET name_with_initials = new_name,
            full_name = new_name
        WHERE member_id = r.member_id;
    END LOOP;
END $$;
