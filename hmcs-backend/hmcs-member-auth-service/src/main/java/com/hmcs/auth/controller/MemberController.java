package com.hmcs.auth.controller;

import com.hmcs.auth.entity.Member;
import com.hmcs.auth.repository.MemberRepository;
import com.hmcs.auth.security.BranchContext;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/members")
public class MemberController {

    private final MemberRepository memberRepository;
    private final BranchContext branchContext;

    public MemberController(MemberRepository memberRepository, BranchContext branchContext) {
        this.memberRepository = memberRepository;
        this.branchContext = branchContext;
    }

    @GetMapping
    public ResponseEntity<List<Member>> getMembers(
            HttpServletRequest request,
            @RequestParam(value = "branchOnly", defaultValue = "false") boolean branchOnly) {
        Integer currentTenantId = com.hmcs.auth.multitenancy.TenantContext.getTenantId();
        
        List<Member> members = memberRepository.findAll().stream()
                .filter(m -> currentTenantId == null || currentTenantId.equals(m.getTenantId()))
                .collect(Collectors.toList());
                
        if (branchOnly) {
            Integer branchId = branchContext.extractBranchId(request);
            members = members.stream()
                    .filter(m -> branchId == null || branchId.equals(m.getRegisteredBranchId()))
                    .collect(Collectors.toList());
        }
        return ResponseEntity.ok(members);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Member> getMemberById(@PathVariable UUID id) {
        return memberRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Member>> searchMembers(@RequestParam("q") String query, HttpServletRequest request) {
        Integer currentTenantId = com.hmcs.auth.multitenancy.TenantContext.getTenantId();
        Integer branchId = branchContext.extractBranchId(request);
        
        List<Member> members = memberRepository.findAll().stream()
                .filter(m -> currentTenantId == null || currentTenantId.equals(m.getTenantId()))
                .filter(m -> branchId == null || branchId.equals(m.getRegisteredBranchId()))
                .filter(m -> {
                    String q = query.toLowerCase();
                    boolean matchName = m.getFullName() != null && m.getFullName().toLowerCase().contains(q);
                    boolean matchNic = m.getNic() != null && m.getNic().toLowerCase().contains(q);
                    boolean matchMembershipNum = m.getMembershipNumber() != null && m.getMembershipNumber().toLowerCase().contains(q);
                    boolean matchGuardianNic = m.getGuardianNic() != null && m.getGuardianNic().toLowerCase().contains(q);
                    return matchName || matchNic || matchMembershipNum || matchGuardianNic;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(members);
    }

    @PostMapping
    public ResponseEntity<?> registerMember(@RequestBody Member member, HttpServletRequest request) {
        if (member.getNic() == null || member.getNic().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("NIC must be provided");
        }

        Optional<Member> existing = memberRepository.findByNic(member.getNic());
        if (existing.isPresent()) {
            if (member.getMemberId() == null || !existing.get().getMemberId().equals(member.getMemberId())) {
                return ResponseEntity.badRequest().body("NIC already registered");
            }
        }

        Integer branchId = branchContext.extractBranchId(request);
        member.setRegisteredBranchId(branchId != null ? branchId : 1);
        member.setStatus("ACTIVE");
        
        Member saved = memberRepository.save(member);
        return ResponseEntity.ok(saved);
    }
}
