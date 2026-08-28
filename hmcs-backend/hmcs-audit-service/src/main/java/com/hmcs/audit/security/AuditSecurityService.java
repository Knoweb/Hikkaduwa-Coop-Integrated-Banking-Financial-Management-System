package com.hmcs.audit.security;

import com.hmcs.audit.entity.AuditComment;
import com.hmcs.audit.entity.User;
import com.hmcs.audit.repository.AuditCommentRepository;
import com.hmcs.audit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service("auditSecurityService")
public class AuditSecurityService {

    @Autowired
    private AuditCommentRepository auditCommentRepository;

    @Autowired
    private UserRepository userRepository;

    public boolean canAccessComment(Long commentId, Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }

        String username = auth.getName();
        Optional<User> userOpt = userRepository.findByUsername(username);
        
        if (userOpt.isEmpty()) {
            return false;
        }

        User user = userOpt.get();
        String roleName = user.getRole() != null ? user.getRole().getRoleName() : "";

        // Admins can access all comments
        if ("ORGANIZATION_ADMIN".equalsIgnoreCase(roleName) || "PLATFORM_ADMIN".equalsIgnoreCase(roleName)) {
            return true;
        }

        Optional<AuditComment> commentOpt = auditCommentRepository.findById(commentId);
        if (commentOpt.isEmpty()) {
            return true; // Let the controller handle 404
        }

        AuditComment comment = commentOpt.get();
        Integer userBranchId = user.getBranch() != null ? user.getBranch().getBranchId() : null;

        // If the user belongs to a branch, verify the comment belongs to the same branch
        if (userBranchId != null && comment.getBranchId() != null) {
            return userBranchId.equals(comment.getBranchId());
        }

        return false;
    }
}
