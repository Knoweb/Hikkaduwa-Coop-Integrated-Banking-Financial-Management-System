package com.hmcs.account.repository;

import com.hmcs.account.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    
    // IMPORTANT: Branch Isolation Query
    List<Member> findByBranchId(Long branchId);
    
    Optional<Member> findByNic(String nic);
    
    // Search member by name and branch
    List<Member> findByBranchIdAndFullNameContainingIgnoreCase(Long branchId, String fullName);
}
