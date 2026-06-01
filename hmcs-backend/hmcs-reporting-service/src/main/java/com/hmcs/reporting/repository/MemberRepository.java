package com.hmcs.reporting.repository;

import com.hmcs.account.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, java.util.UUID> {
    
    // IMPORTANT: Branch Isolation Query
    List<Member> findByBranchId(Long branchId);
    
    Optional<Member> findByNic(String nic);
    
    @org.springframework.data.jpa.repository.Query("SELECT m FROM Member m WHERE m.branchId = :branchId AND (LOWER(m.fullName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(m.nic) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Member> searchByBranchIdAndQuery(@org.springframework.data.repository.query.Param("branchId") Long branchId, @org.springframework.data.repository.query.Param("query") String query);
}


