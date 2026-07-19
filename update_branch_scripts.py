import os

def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements:
        content = content.replace(old, new)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

replace_in_file("mock_data_creator.py", [
    ("BRANCH_ID = 4", "BRANCH_ID = 1"),
    ("senior_seenigama", "gm_perera")
])

replace_in_file("add_products.sql", [
    ("branch_id = 4", "branch_id = 1"),
    ("4, 'DISBURSED'", "1, 'DISBURSED'"),
    ("15.0, 4, '6d90f1f6-4b3e-428b-a929-0061669a1b06'", "15.0, 1, '59c75e11-b5f5-4ded-b587-d50f47aaee4a'"),
    ("LN400", "LN100"),
    ("PW400", "PW100")
])

replace_in_file("update_names.sql", [
    ("branch_id = 4", "branch_id = 1"),
    ("'M-4-'", "'M-1-'")
])

replace_in_file("add_fds.sql", [
    ("branch_id = 4", "branch_id = 1"),
    ("4, v_created_at", "1, v_created_at"),
    ("'FD400'", "'FD100'")
])

replace_in_file("simulate_history.sql", [
    ("branch_id = 4", "branch_id = 1"),
    ("6d90f1f6-4b3e-428b-a929-0061669a1b06", "59c75e11-b5f5-4ded-b587-d50f47aaee4a"),
    (", 4, 1", ", 1, 1")
])

replace_in_file("fix_pawning_active.sql", [
    ("branch_id = 4", "branch_id = 1")
])

replace_in_file("fix_loan_types.sql", [
    ("branch_id = 4", "branch_id = 1")
])

print("Files updated for Hikkaduwa!")
