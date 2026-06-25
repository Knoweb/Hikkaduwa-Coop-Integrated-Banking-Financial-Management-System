INSERT INTO member_service.members (
    membership_number, nic, full_name, full_name_sinhala, date_of_birth, gender, 
    marital_status, address, province, contact_number, is_member, registered_branch_id, 
    share_amount, number_of_shares, status, name_with_initials, age_category
) VALUES
-- Hikkaduwa Branch (Branch ID 1) - 7 more members
('M0020', '198712345688', 'Priyanka Silva', 'ප්‍රියංකා සිල්වා', '1987-10-12', 'FEMALE', 'MARRIED', 'No 55, Temple Road, Hikkaduwa', 'Southern', '0771231234', true, 1, 1500.00, 15, 'ACTIVE', 'P. Silva', 'ADULT'),
('M0021', '199312345689', 'Lahiru Sandaruwan', 'ළහිරු සඳරුවන්', '1993-01-25', 'MALE', 'UNMARRIED', 'No 21, Beach Avenue, Hikkaduwa', 'Southern', '0712342345', true, 1, 1000.00, 10, 'ACTIVE', 'L. Sandaruwan', 'ADULT'),
('M0022', '197912345690', 'Chandana Kumara', 'චන්දන කුමාර', '1979-05-18', 'MALE', 'MARRIED', 'No 99, Galle Road, Hikkaduwa', 'Southern', '0773453456', true, 1, 2500.00, 25, 'ACTIVE', 'C. Kumara', 'ADULT'),
('M0023', '198412345691', 'Nadeesha Madushani', 'නදීශා මධුෂානි', '1984-11-09', 'FEMALE', 'MARRIED', 'No 14, Main Street, Hikkaduwa', 'Southern', '0714564567', true, 1, 1000.00, 10, 'ACTIVE', 'N. Madushani', 'ADULT'),
('M0024', '199612345692', 'Sanjaya Weerasinghe', 'සංජය වීරසිංහ', '1996-08-30', 'MALE', 'UNMARRIED', 'No 4, School Lane, Hikkaduwa', 'Southern', '0775675678', true, 1, 1000.00, 10, 'ACTIVE', 'S. Weerasinghe', 'ADULT'),
('M0025', '198112345693', 'Renuka Kanthi', 'රේණුකා කාන්ති', '1981-02-14', 'FEMALE', 'MARRIED', 'No 67, Market Road, Hikkaduwa', 'Southern', '0716786789', true, 1, 2000.00, 20, 'ACTIVE', 'R. Kanthi', 'ADULT'),
('M0026', '198912345694', 'Dimuthu Karunarathna', 'දිමුතු කරුණාරත්න', '1989-12-05', 'MALE', 'MARRIED', 'No 33, Sea View, Hikkaduwa', 'Southern', '0777897890', true, 1, 1000.00, 10, 'ACTIVE', 'D. Karunarathna', 'ADULT');
