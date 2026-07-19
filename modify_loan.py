import re

with open('loan new.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace CONSTRAINT "..." PRIMARY KEY with "tenant_id" integer DEFAULT 1 NOT NULL, CONSTRAINT...
content = re.sub(r'(\s+)CONSTRAINT\s+"([a-zA-Z0-9_]+)_pkey"\s+PRIMARY KEY', 
                 r'\1"tenant_id" integer DEFAULT 1 NOT NULL,\1CONSTRAINT "\2_pkey" PRIMARY KEY', 
                 content)

with open('loan_new_modified.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print('Done!')
