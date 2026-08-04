import os
import re

base_backend = "c:/Users/USER/OneDrive - itum.mrt.ac.lk/Desktop/Hikkaduwa bank/hmcs-backend/hmcs-member-auth-service/src/main/java/com/hmcs/auth/"
base_frontend = "c:/Users/USER/OneDrive - itum.mrt.ac.lk/Desktop/Hikkaduwa bank/hmcs-frontend/src/"

def read_file(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def write_file(path, content):
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

# 1. AuditComment.java
f_entity = os.path.join(base_backend, "entity/AuditComment.java")
content = read_file(f_entity)
if "private Integer branchId;" not in content:
    content = content.replace("private Integer tenantId;", "private Integer tenantId;\n\n    @Column(name=\"branch_id\")\n    private Integer branchId;")
    write_file(f_entity, content)

# 2. AuditCommentRequest.java
f_req = os.path.join(base_backend, "dto/AuditCommentRequest.java")
content = read_file(f_req)
if "private Integer branchId;" not in content:
    content = content.replace("private String comment;", "private String comment;\n    private Integer branchId;")
    write_file(f_req, content)

# 3. AuditCommentRepository.java
f_repo = os.path.join(base_backend, "repository/AuditCommentRepository.java")
content = read_file(f_repo)
if "findByBranchIdOrderByCreatedAtDesc" not in content:
    content = content.replace("List<AuditComment> findAllByOrderByCreatedAtDesc();", "List<AuditComment> findAllByOrderByCreatedAtDesc();\n    List<AuditComment> findByBranchIdOrderByCreatedAtDesc(Integer branchId);")
    write_file(f_repo, content)

# 4. AuditCommentController.java
f_ctrl = os.path.join(base_backend, "controller/AuditCommentController.java")
content = read_file(f_ctrl)
if "comment.setBranchId(request.getBranchId());" not in content:
    content = content.replace("comment.setTenantId(user.getTenantId());", "comment.setTenantId(user.getTenantId());\n        comment.setBranchId(request.getBranchId());")
if "auditCommentRepository.findByBranchIdOrderByCreatedAtDesc" not in content:
    new_get = """    @GetMapping
    public ResponseEntity<List<AuditComment>> getComments() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null && user.getRole().getRoleName().equals("BRANCH_MANAGER")) {
            return ResponseEntity.ok(auditCommentRepository.findByBranchIdOrderByCreatedAtDesc(user.getBranch() != null ? user.getBranch().getBranchId() : null));
        }
        return ResponseEntity.ok(auditCommentRepository.findAllByOrderByCreatedAtDesc());
    }"""
    old_get = """    @GetMapping
    public ResponseEntity<List<AuditComment>> getComments() {
        return ResponseEntity.ok(auditCommentRepository.findAllByOrderByCreatedAtDesc());
    }"""
    content = content.replace(old_get, new_get)
    write_file(f_ctrl, content)

# 5. AuditService.ts
f_service = os.path.join(base_frontend, "services/audit.service.ts")
content = read_file(f_service)
if "branchId: number" not in content:
    content = content.replace("tenantId: number;", "tenantId: number;\n  branchId?: number;")
if "addComment(comment: string, branchId?: number)" not in content:
    content = content.replace("addComment(comment: string): Promise<AuditComment> {", "addComment(comment: string, branchId?: number): Promise<AuditComment> {")
    content = content.replace("axios.post(API_URL, { comment }, { headers: authHeader() });", "axios.post(API_URL, { comment, branchId }, { headers: authHeader() });")
    write_file(f_service, content)

# 6. AuditCommentModal.tsx
f_modal = os.path.join(base_frontend, "components/AuditCommentModal.tsx")
content = read_file(f_modal)
if "branchId?: number" not in content:
    content = content.replace("onSuccess: () => void, branchName?: string", "onSuccess: () => void, branchName?: string, branchId?: number")
    content = content.replace("await AuditService.addComment(finalComment);", "await AuditService.addComment(finalComment, branchId);")
    write_file(f_modal, content)

# 7. SystemAdminDashboard.tsx
f_dashboard = os.path.join(base_frontend, "pages/SystemAdminDashboard.tsx")
content = read_file(f_dashboard)
if "branchId={activeBranch?.branchId}" not in content:
    content = content.replace("branchName={activeBranch?.branchName}", "branchName={activeBranch?.branchName}\n          branchId={activeBranch?.branchId}")
    write_file(f_dashboard, content)

# 8. AuditorCommentsView.tsx
f_view = os.path.join(base_frontend, "components/AuditorCommentsView.tsx")
content = read_file(f_view)
if "c.branchId ?" not in content:
    content = content.replace("{parsed.branch}", "{c.branchId ? getBranchNameStr(c.branchId) : parsed.branch}")
    write_file(f_view, content)

print("Backend and frontend code updated successfully for branchId feature.")
