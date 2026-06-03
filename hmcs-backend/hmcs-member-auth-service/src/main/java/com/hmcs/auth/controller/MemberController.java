package com.hmcs.auth.controller;

import com.hmcs.auth.entity.Member;
import com.hmcs.auth.repository.MemberRepository;
import com.hmcs.auth.security.BranchContext;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
    public ResponseEntity<List<Member>> getMembers(HttpServletRequest request) {
        Integer branchId = branchContext.extractBranchId(request);
        List<Member> members = memberRepository.findAll().stream()
                .filter(m -> branchId == null || branchId.equals(m.getRegisteredBranchId()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(members);
    }

    @GetMapping("/search")
    public ResponseEntity<List<Member>> searchMembers(@RequestParam("q") String query, HttpServletRequest request) {
        Integer branchId = branchContext.extractBranchId(request);
        List<Member> members = memberRepository.findAll().stream()
                .filter(m -> branchId == null || branchId.equals(m.getRegisteredBranchId()))
                .filter(m -> m.getFullName().toLowerCase().contains(query.toLowerCase()) || m.getNic().toLowerCase().contains(query.toLowerCase()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(members);
    }

    @PostMapping
    public ResponseEntity<?> registerMember(@RequestBody Member member, HttpServletRequest request) {
        if (memberRepository.findByNic(member.getNic()).isPresent()) {
            return ResponseEntity.badRequest().body("NIC already registered");
        }
        Integer branchId = branchContext.extractBranchId(request);
        member.setRegisteredBranchId(branchId != null ? branchId : 1);
        member.setStatus("ACTIVE");
        
        Member saved = memberRepository.save(member);
        return ResponseEntity.ok(saved);
    }
}
