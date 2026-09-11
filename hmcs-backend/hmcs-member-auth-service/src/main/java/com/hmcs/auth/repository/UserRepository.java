package com.hmcs.auth.repository;

import com.hmcs.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByUsername(String username);
    
    @org.springframework.data.jpa.repository.Query(value = "SELECT active_token FROM auth_service.users WHERE username = :username", nativeQuery = true)
    String findActiveTokenByUsernameBypassingTenant(@org.springframework.data.repository.query.Param("username") String username);
}
