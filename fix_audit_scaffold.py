import os
import shutil

backend_dir = r"c:\Users\USER\OneDrive - itum.mrt.ac.lk\Desktop\Hikkaduwa bank\hmcs-backend"
audit_dir = os.path.join(backend_dir, "hmcs-audit-service")
auth_dir = os.path.join(backend_dir, "hmcs-member-auth-service")

def read_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def write_file(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def move_and_rename(src_path, dst_path, old_package, new_package):
    if not os.path.exists(src_path): return
    content = read_file(src_path)
    content = content.replace(old_package, new_package)
    content = content.replace("com.hmcs.auth.entity", "com.hmcs.audit.entity")
    content = content.replace("com.hmcs.auth.dto", "com.hmcs.audit.dto")
    content = content.replace("com.hmcs.auth.repository", "com.hmcs.audit.repository")
    write_file(dst_path, content)

# Copy User, Role, Branch entities and repositories
move_and_rename(os.path.join(auth_dir, "src/main/java/com/hmcs/auth/entity/User.java"),
                os.path.join(audit_dir, "src/main/java/com/hmcs/audit/entity/User.java"),
                "package com.hmcs.auth.entity;", "package com.hmcs.audit.entity;")
move_and_rename(os.path.join(auth_dir, "src/main/java/com/hmcs/auth/entity/Role.java"),
                os.path.join(audit_dir, "src/main/java/com/hmcs/audit/entity/Role.java"),
                "package com.hmcs.auth.entity;", "package com.hmcs.audit.entity;")
move_and_rename(os.path.join(auth_dir, "src/main/java/com/hmcs/auth/entity/Branch.java"),
                os.path.join(audit_dir, "src/main/java/com/hmcs/audit/entity/Branch.java"),
                "package com.hmcs.auth.entity;", "package com.hmcs.audit.entity;")

move_and_rename(os.path.join(auth_dir, "src/main/java/com/hmcs/auth/repository/UserRepository.java"),
                os.path.join(audit_dir, "src/main/java/com/hmcs/audit/repository/UserRepository.java"),
                "package com.hmcs.auth.repository;", "package com.hmcs.audit.repository;")
move_and_rename(os.path.join(auth_dir, "src/main/java/com/hmcs/auth/repository/RoleRepository.java"),
                os.path.join(audit_dir, "src/main/java/com/hmcs/audit/repository/RoleRepository.java"),
                "package com.hmcs.auth.repository;", "package com.hmcs.audit.repository;")

# Fix RequestMapping in AuditCommentController
ctrl = os.path.join(audit_dir, "src/main/java/com/hmcs/audit/controller/AuditCommentController.java")
content = read_file(ctrl)
content = content.replace('@RequestMapping("/api/v1/auth/audit-comments")', '@RequestMapping("/api/v1/audit/comments")')
write_file(ctrl, content)

print("Entities copied and controller updated!")
