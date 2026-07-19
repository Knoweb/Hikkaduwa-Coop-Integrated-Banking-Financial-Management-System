import os
import re

def update_entity(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if not an entity
    if '@Entity' not in content:
        return

    # 1. Clean up any rogue imports before public class
    content = re.sub(r'(import org\.hibernate\.annotations\.TenantId;\s*)+(?=public class)', '', content)
    content = re.sub(r'(@Table[^)]*\))\s*(import org\.hibernate\.annotations\.TenantId;\s*)+', r'\1\n', content)

    # 2. Add correct import if missing
    if 'import org.hibernate.annotations.TenantId;' not in content:
        # Add it right after the first import
        content = re.sub(r'^(import [^;]+;)', r'\1\nimport org.hibernate.annotations.TenantId;', content, count=1, flags=re.MULTILINE)

    # 3. Add TenantId property if missing
    if '@TenantId' not in content:
        content = re.sub(r'(public class\s+\w+\s*(?:extends\s+\w+\s*)?(?:implements\s+[\w\s,]+)?\s*\{)',
                         r'\1\n    @TenantId\n    private Integer tenantId;\n',
                         content, count=1)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def main():
    root_dir = 'hmcs-backend'
    for subdir, dirs, files in os.walk(root_dir):
        for file in files:
            if file.endswith('.java'):
                filepath = os.path.join(subdir, file)
                update_entity(filepath)

if __name__ == '__main__':
    main()
