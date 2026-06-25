INSERT INTO member_service.members (
    membership_number, nic, full_name, full_name_sinhala, date_of_birth, gender, 
    marital_status, address, province, contact_number, is_member, registered_branch_id, 
    share_amount, number_of_shares, status, name_with_initials, age_category
) VALUES
-- Hikkaduwa Branch (Branch ID 1) - 5 Non-Members
('NM0010', '198512345601', 'Amal Perera', 'අමල් පෙරේරා', '1985-06-15', 'MALE', 'MARRIED', 'No 15, Temple Lane, Hikkaduwa', 'Southern', '0772223331', false, 1, 0.00, 0, 'ACTIVE', 'A. Perera', 'ADULT'),
('NM0011', '199112345602', 'Sujani Fernando', 'සුජානි ප්‍රනාන්දු', '1991-03-22', 'FEMALE', 'UNMARRIED', 'No 22, Beach Road, Hikkaduwa', 'Southern', '0713334442', false, 1, 0.00, 0, 'ACTIVE', 'S. Fernando', 'ADULT'),
('NM0012', '197612345603', 'Rohan Kumara', 'රොහාන් කුමාර', '1976-11-10', 'MALE', 'MARRIED', 'No 88, Galle Road, Hikkaduwa', 'Southern', '0774445553', false, 1, 0.00, 0, 'ACTIVE', 'R. Kumara', 'ADULT'),
('NM0013', '198812345604', 'Nishanthi Silva', 'නිශාන්ති සිල්වා', '1988-08-05', 'FEMALE', 'MARRIED', 'No 12, Market Street, Hikkaduwa', 'Southern', '0715556664', false, 1, 0.00, 0, 'ACTIVE', 'N. Silva', 'ADULT'),
('NM0014', '199512345605', 'Dasun Weerasinghe', 'දසුන් වීරසිංහ', '1995-01-30', 'MALE', 'UNMARRIED', 'No 7, School Road, Hikkaduwa', 'Southern', '0776667775', false, 1, 0.00, 0, 'ACTIVE', 'D. Weerasinghe', 'ADULT');
