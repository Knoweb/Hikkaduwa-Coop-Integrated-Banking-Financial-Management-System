import random
import re

with open('update_names.sql', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the current names array
names = [
    'A. Perera', 'S. Kumara', 'K. Perera', 'S. Shantha', 'N. Ranasinghe',
    'C. De Silva', 'R. Pathirana', 'J. Kumara', 'A. Pradeep', 'R. Fernando',
    'D. Maduranga', 'L. Madushan', 'P. Chathuranga', 'C. Roshan', 'M. Bandara',
    'N. Kumari', 'S. Malkanthi', 'N. Perera', 'C. De Silva', 'D. Ranasinghe',
    'C. Fernando', 'S. Madushani', 'N. Pathirana', 'H. Bandara', 'R. Shanthi',
    'A. Sandamali', 'D. Kumari', 'R. Dilrukshi', 'I. Damayanthi', 'C. Niwanthi',
    'U. Shantha', 'N. Kumara', 'S. Priyankara', 'M. Perera', 'T. De Silva',
    'N. Pathirana', 'C. Ranasinghe', 'K. Pramod', 'S. Madhubhashana', 'D. Prasad',
    'N. Kumara', 'A. Sampath', 'S. Bandara', 'A. Ruwan', 'C. Fernando',
    'N. Pradeep', 'R. Chinthaka', 'S. Kumara', 'A. Perera', 'M. Fernando'
]

# Shuffle names
random.shuffle(names)

# Reformat them for SQL
new_array_str = "    v_english_names VARCHAR[] := ARRAY[\n        "
for i in range(0, len(names), 5):
    line_names = names[i:i+5]
    new_array_str += ", ".join([f"'{name}'" for name in line_names])
    if i + 5 < len(names):
        new_array_str += ",\n        "

new_array_str += "\n    ];"

# Use regex to replace the array definition
content = re.sub(r"v_english_names VARCHAR\[\] := ARRAY\[.*?\];", new_array_str, content, flags=re.DOTALL)

with open('update_names.sql', 'w', encoding='utf-8') as f:
    f.write(content)

print("Names shuffled in update_names.sql")
