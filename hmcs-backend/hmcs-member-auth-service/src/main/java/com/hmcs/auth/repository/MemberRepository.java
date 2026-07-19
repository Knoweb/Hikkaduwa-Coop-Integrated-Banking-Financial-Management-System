package com.hmcs.auth.repository;

import com.hmcs.auth.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface MemberRepository extends JpaRepository<Member, UUID> {
    Optional<Member> findByNic(String nic);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM member_service.members", nativeQuery = true)
    java.util.List<Member> findAllIgnoreTenant();

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM member_service.members WHERE member_id = :memberId", nativeQuery = true)
    Optional<Member> findByIdIgnoreTenant(@org.springframework.data.repository.query.Param("memberId") UUID memberId);
}
