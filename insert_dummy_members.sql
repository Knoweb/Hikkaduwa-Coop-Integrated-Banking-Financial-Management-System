INSERT INTO member_service.members (
    membership_number, nic, full_name, full_name_sinhala, date_of_birth, gender, 
    marital_status, address, province, contact_number, is_member, registered_branch_id, 
    share_amount, number_of_shares, status, name_with_initials, age_category
) VALUES
-- Hikkaduwa Branch (Branch ID 1)
('M0010', '198212345678', 'Kasun Jayawardena', 'කසුන් ජයවර්ධන', '1982-05-14', 'MALE', 'MARRIED', 'No 12, Galle Road, Hikkaduwa', 'Southern', '0771112233', true, 1, 1000.00, 10, 'ACTIVE', 'K. Jayawardena', 'ADULT'),
('M0011', '199012345679', 'Nimali Silva', 'නිමාලි සිල්වා', '1990-08-22', 'FEMALE', 'UNMARRIED', 'No 45, Beach Road, Hikkaduwa', 'Southern', '0712223344', true, 1, 1000.00, 10, 'ACTIVE', 'N. Silva', 'ADULT'),
('M0012', '197512345680', 'Sunil Perera', 'සුනිල් පෙරේරා', '1975-11-03', 'MALE', 'MARRIED', 'No 88, Main Street, Hikkaduwa', 'Southern', '0773334455', true, 1, 5000.00, 50, 'ACTIVE', 'S. Perera', 'ADULT'),
('M0013', '198812345681', 'Kamal Addararachchi', 'කමල් අද්දරආරච්චි', '1988-02-19', 'MALE', 'MARRIED', 'No 2, Temple Road, Hikkaduwa', 'Southern', '0714445566', true, 1, 2000.00, 20, 'ACTIVE', 'K. Addararachchi', 'ADULT'),
('M0014', '199512345682', 'Samanthi Fernando', 'සමන්ති ප්‍රනාන්දු', '1995-07-30', 'FEMALE', 'UNMARRIED', 'No 10, Market Road, Hikkaduwa', 'Southern', '0775556677', true, 1, 1000.00, 10, 'ACTIVE', 'S. Fernando', 'ADULT'),

-- Seenigama Branch (Branch ID 4)
('M0015', '198012345683', 'Ruwan Kumara', 'රුවන් කුමාර', '1980-04-12', 'MALE', 'MARRIED', 'No 5, Seenigama Devalaya Road, Seenigama', 'Southern', '0716667788', true, 4, 3000.00, 30, 'ACTIVE', 'R. Kumara', 'ADULT'),
('M0016', '199212345684', 'Anoma Rathnayake', 'අනෝමා රත්නායක', '1992-09-05', 'FEMALE', 'MARRIED', 'No 15, Temple Junction, Seenigama', 'Southern', '0777778899', true, 4, 1500.00, 15, 'ACTIVE', 'A. Rathnayake', 'ADULT'),
('M0017', '197812345685', 'Jagath Chaminda', 'ජගත් චමින්ද', '1978-12-25', 'MALE', 'MARRIED', 'No 22, Beach Side, Seenigama', 'Southern', '0718889900', true, 4, 2000.00, 20, 'ACTIVE', 'J. Chaminda', 'ADULT'),
('M0018', '198612345686', 'Nilanthi Peiris', 'නිලන්ති පීරිස්', '1986-03-08', 'FEMALE', 'UNMARRIED', 'No 30, Main Road, Seenigama', 'Southern', '0779990011', true, 4, 1000.00, 10, 'ACTIVE', 'N. Peiris', 'ADULT'),
('M0019', '199112345687', 'Dinesh Priyankara', 'දිනේෂ් ප්‍රියංකර', '1991-06-17', 'MALE', 'UNMARRIED', 'No 8, School Lane, Seenigama', 'Southern', '0710001122', true, 4, 1000.00, 10, 'ACTIVE', 'D. Priyankara', 'ADULT');
