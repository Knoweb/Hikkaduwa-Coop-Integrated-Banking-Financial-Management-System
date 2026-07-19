import re

def process_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Add CASCADE to DROP TABLE
    content = re.sub(r'DROP TABLE IF EXISTS "([^"]+)";', r'DROP TABLE IF EXISTS "\1" CASCADE;', content)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

process_file('loan_new_modified.sql')
process_file('pawn new.sql')
print('CASCADE added!')
