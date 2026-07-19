import re
content = open('loan new.sql', 'r', encoding='utf-8').read()
matches = re.findall(r'INSERT INTO \"?([a-zA-Z0-9_]+)\"?', content)
print(set(matches))
