INSERT INTO member_service.members (
    member_id, membership_number, nic, full_name, name_with_initials, 
    date_of_birth, gender, marital_status, address, province, 
    contact_number, registered_branch_id, is_member, status, age_category
) VALUES
('9a387d8f-5900-420e-b0cf-19899e694037', 'M009', '200179002577', 'Poorni Karishma Rohan Abeysekara', 'P K R Abeysekara', '2001-10-16', 'FEMALE', 'UNMARRIED', 'Baddegama', 'Southern', '0777442729', 1, true, 'ACTIVE', 'ADULT'),
('2276410d-4d1d-484d-aca3-e5af0bd2623d', 'M010', '199820004005', 'Shashika Sandamini Rohan Abeysekara', 'S S R Abeysekera', '1998-04-11', 'FEMALE', 'MARRIED', '231/B/1, Kandaduwa Road, Ganegama South, Baddegama', 'Southern', '0776263411', 1, true, 'ACTIVE', 'ADULT')
ON CONFLICT (member_id) DO NOTHING;
