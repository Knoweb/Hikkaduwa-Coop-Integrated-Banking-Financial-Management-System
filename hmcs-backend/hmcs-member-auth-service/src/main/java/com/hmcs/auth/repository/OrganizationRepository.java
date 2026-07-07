package com.hmcs.auth.repository;

import com.hmcs.auth.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Integer> {
    Optional<Organization> findBySubdomain(String subdomain);
    java.util.List<Organization> findByOrganizationIdGreaterThan(Integer organizationId);
}
