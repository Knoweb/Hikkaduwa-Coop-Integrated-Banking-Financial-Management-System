import os
import shutil

backend_dir = r"c:\Users\USER\OneDrive - itum.mrt.ac.lk\Desktop\Hikkaduwa bank\hmcs-backend"
audit_dir = os.path.join(backend_dir, "hmcs-audit-service")
savings_dir = os.path.join(backend_dir, "hmcs-savings-service")
auth_dir = os.path.join(backend_dir, "hmcs-member-auth-service")

# Create directories
os.makedirs(os.path.join(audit_dir, "src/main/java/com/hmcs/audit/controller"), exist_ok=True)
os.makedirs(os.path.join(audit_dir, "src/main/java/com/hmcs/audit/entity"), exist_ok=True)
os.makedirs(os.path.join(audit_dir, "src/main/java/com/hmcs/audit/repository"), exist_ok=True)
os.makedirs(os.path.join(audit_dir, "src/main/java/com/hmcs/audit/dto"), exist_ok=True)
os.makedirs(os.path.join(audit_dir, "src/main/java/com/hmcs/audit/config"), exist_ok=True)
os.makedirs(os.path.join(audit_dir, "src/main/java/com/hmcs/audit/security"), exist_ok=True)
os.makedirs(os.path.join(audit_dir, "src/main/resources"), exist_ok=True)

# 1. Copy pom.xml from savings-service and adjust
with open(os.path.join(savings_dir, "pom.xml"), "r", encoding="utf-8") as f:
    pom = f.read()
pom = pom.replace("<artifactId>hmcs-savings-service</artifactId>", "<artifactId>hmcs-audit-service</artifactId>")
pom = pom.replace("<name>hmcs-savings-service</name>", "<name>hmcs-audit-service</name>")
pom = pom.replace("<description>Savings Microservice</description>", "<description>Audit Microservice</description>")
with open(os.path.join(audit_dir, "pom.xml"), "w", encoding="utf-8") as f:
    f.write(pom)

# 2. application.properties and application.yml
with open(os.path.join(savings_dir, "src/main/resources/application.properties"), "r", encoding="utf-8") as f:
    props = f.read()
props = props.replace("server.port=8082", "server.port=8088")
props = props.replace("spring.application.name=hmcs-savings-service", "spring.application.name=hmcs-audit-service")
with open(os.path.join(audit_dir, "src/main/resources/application.properties"), "w", encoding="utf-8") as f:
    f.write(props)
if os.path.exists(os.path.join(savings_dir, "src/main/resources/application.yml")):
    shutil.copy2(os.path.join(savings_dir, "src/main/resources/application.yml"), os.path.join(audit_dir, "src/main/resources/application.yml"))

# 3. Application.java
app_java = """package com.hmcs.audit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class HmcsAuditServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(HmcsAuditServiceApplication.class, args);
    }
}
"""
with open(os.path.join(audit_dir, "src/main/java/com/hmcs/audit/HmcsAuditServiceApplication.java"), "w", encoding="utf-8") as f:
    f.write(app_java)

# 4. Copy Security config and filter from savings-service
security_src = os.path.join(savings_dir, "src/main/java/com/hmcs/savings/security")
security_dst = os.path.join(audit_dir, "src/main/java/com/hmcs/audit/security")
for filename in os.listdir(security_src):
    if filename.endswith(".java"):
        with open(os.path.join(security_src, filename), "r", encoding="utf-8") as f:
            content = f.read()
        content = content.replace("package com.hmcs.savings.security;", "package com.hmcs.audit.security;")
        with open(os.path.join(security_dst, filename), "w", encoding="utf-8") as f:
            f.write(content)

# 5. Move entities, dtos, repos, controllers
def move_and_rename(src_path, dst_path, old_package, new_package):
    if not os.path.exists(src_path): return
    with open(src_path, "r", encoding="utf-8") as f:
        content = f.read()
    content = content.replace(old_package, new_package)
    content = content.replace("auth_service", "audit_service") # schema change for audit_comments
    # For imports like com.hmcs.auth.entity.AuditComment -> com.hmcs.audit.entity.AuditComment
    content = content.replace("com.hmcs.auth.entity", "com.hmcs.audit.entity")
    content = content.replace("com.hmcs.auth.dto", "com.hmcs.audit.dto")
    content = content.replace("com.hmcs.auth.repository", "com.hmcs.audit.repository")
    # For AuditController moving from savings
    content = content.replace("package com.hmcs.savings.controller;", "package com.hmcs.audit.controller;")
    content = content.replace("com.hmcs.savings.security", "com.hmcs.audit.security")
    with open(dst_path, "w", encoding="utf-8") as f:
        f.write(content)
    os.remove(src_path)

move_and_rename(os.path.join(auth_dir, "src/main/java/com/hmcs/auth/entity/AuditComment.java"),
                os.path.join(audit_dir, "src/main/java/com/hmcs/audit/entity/AuditComment.java"),
                "package com.hmcs.auth.entity;", "package com.hmcs.audit.entity;")

move_and_rename(os.path.join(auth_dir, "src/main/java/com/hmcs/auth/dto/AuditCommentRequest.java"),
                os.path.join(audit_dir, "src/main/java/com/hmcs/audit/dto/AuditCommentRequest.java"),
                "package com.hmcs.auth.dto;", "package com.hmcs.audit.dto;")

move_and_rename(os.path.join(auth_dir, "src/main/java/com/hmcs/auth/repository/AuditCommentRepository.java"),
                os.path.join(audit_dir, "src/main/java/com/hmcs/audit/repository/AuditCommentRepository.java"),
                "package com.hmcs.auth.repository;", "package com.hmcs.audit.repository;")

move_and_rename(os.path.join(auth_dir, "src/main/java/com/hmcs/auth/controller/AuditCommentController.java"),
                os.path.join(audit_dir, "src/main/java/com/hmcs/audit/controller/AuditCommentController.java"),
                "package com.hmcs.auth.controller;", "package com.hmcs.audit.controller;")

move_and_rename(os.path.join(savings_dir, "src/main/java/com/hmcs/savings/controller/AuditController.java"),
                os.path.join(audit_dir, "src/main/java/com/hmcs/audit/controller/AuditController.java"),
                "package com.hmcs.savings.controller;", "package com.hmcs.audit.controller;")

# 6. Update SecurityConfig.java inside auth-service
auth_sec = os.path.join(auth_dir, "src/main/java/com/hmcs/auth/config/SecurityConfig.java")
with open(auth_sec, "r", encoding="utf-8") as f:
    sec_content = f.read()
import re
sec_content = re.sub(r'// Audit Comments API\s*\.requestMatchers\("/api/v1/auth/audit-comments", "/api/v1/auth/audit-comments/\*\*"\)\.hasAnyAuthority\([^)]+\)', '', sec_content)
with open(auth_sec, "w", encoding="utf-8") as f:
    f.write(sec_content)

print("Scaffolding of hmcs-audit-service is complete!")
