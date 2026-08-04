import os

savings_dir = r"c:\Users\USER\OneDrive - itum.mrt.ac.lk\Desktop\Hikkaduwa bank\hmcs-backend\hmcs-savings-service"
audit_dir = r"c:\Users\USER\OneDrive - itum.mrt.ac.lk\Desktop\Hikkaduwa bank\hmcs-backend\hmcs-audit-service"

def read_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def write_file(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

src_config = os.path.join(savings_dir, "src/main/java/com/hmcs/savings/config")
dst_config = os.path.join(audit_dir, "src/main/java/com/hmcs/audit/config")

for file in ["SecurityConfig.java", "WebMvcConfig.java"]:
    content = read_file(os.path.join(src_config, file))
    content = content.replace("package com.hmcs.savings.config;", "package com.hmcs.audit.config;")
    content = content.replace("com.hmcs.savings.security", "com.hmcs.audit.security")
    write_file(os.path.join(dst_config, file), content)
