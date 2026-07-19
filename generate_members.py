import csv
import uuid
import random

fields = [
    'tenant_id', 'member_id', 'membership_number', 'nic', 
    'name_with_initials', 'full_name', 'date_of_birth', 'gender', 
    'marital_status', 'address', 'contact_number', 'is_member', 
    'registered_branch_id', 'status', 'created_at', 'age_category'
]

with open('members_upload.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow(fields)
    for b in [1, 2, 3]:
        for i in range(1, 51):
            nic = f'199{random.randint(100000, 999999)}X'
            w.writerow([
                1, 
                str(uuid.uuid4()), 
                f'M-{b}-{1000+i}', 
                nic, 
                f'A. B. Member {b}-{i}', 
                f'Full Name Member {b}-{i}', 
                '1990-01-01', 
                'MALE', 
                'UNMARRIED', 
                'Test Address', 
                '0770000000', 
                'true', 
                b, 
                'ACTIVE', 
                '2026-07-13 00:00:00',
                'ADULT'
            ])
print("members_upload.csv generated successfully.")
