import csv
import psycopg2
from psycopg2 import sql

DB_CONFIG = {
    'dbname': 'hmcs_db',
    'user': 'hmcs_app',
    'password': 'hmcs_secure_pass_2026',
    'host': 'localhost',
    'port': '5432'
}

def upload_members():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    with open('members_upload.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            cur.execute("""
                INSERT INTO member_service.members (
                    tenant_id, member_id, membership_number, nic, name_with_initials, 
                    full_name, date_of_birth, gender, marital_status, address, 
                    contact_number, is_member, registered_branch_id, status, created_at, age_category
                ) VALUES (
                    %(tenant_id)s, %(member_id)s, %(membership_number)s, %(nic)s, %(name_with_initials)s, 
                    %(full_name)s, %(date_of_birth)s, %(gender)s, %(marital_status)s, %(address)s, 
                    %(contact_number)s, %(is_member)s, %(registered_branch_id)s, %(status)s, %(created_at)s, %(age_category)s
                ) ON CONFLICT (nic) DO NOTHING;
            """, row)
    
    conn.commit()
    cur.close()
    conn.close()
    print("Uploaded members to database successfully.")

if __name__ == '__main__':
    upload_members()
