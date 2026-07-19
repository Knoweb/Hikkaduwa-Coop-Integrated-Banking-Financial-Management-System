package com.hmcs.auth.repository;

import com.hmcs.auth.entity.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Integer> {
    Optional<Branch> findByBranchName(String branchName);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM auth_service.branches", nativeQuery = true)
    java.util.List<Branch> findAllIgnoreTenant();
}
