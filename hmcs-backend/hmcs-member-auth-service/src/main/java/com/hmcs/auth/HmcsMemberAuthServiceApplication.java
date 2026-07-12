package com.hmcs.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import com.hmcs.auth.entity.Organization;
import com.hmcs.auth.repository.OrganizationRepository;
import java.util.List;

@SpringBootApplication
public class HmcsMemberAuthServiceApplication {

	public static void main(String[] args) {
		SpringApplication.run(HmcsMemberAuthServiceApplication.class, args);
	}

	@Bean
	public org.springframework.boot.CommandLineRunner syncDefaultsOnStartup(OrganizationRepository organizationRepository, JdbcTemplate jdbcTemplate) {
		return args -> {
			List<Organization> orgs = organizationRepository.findByOrganizationIdGreaterThan(1);
			for (Organization o : orgs) {
				Integer tenantId = o.getOrganizationId();
				
				// Sync loan types
				jdbcTemplate.update(
					"INSERT INTO loan_service.loan_types (loan_type_id, name, description, interest_rate, max_amount, max_term_months, is_active, eligibility_criteria, created_at, updated_at, tenant_id) " +
					"SELECT gen_random_uuid(), name, description, interest_rate, max_amount, max_term_months, is_active, eligibility_criteria, now(), now(), ? " +
					"FROM loan_service.loan_types lt WHERE tenant_id = 1 AND NOT EXISTS (SELECT 1 FROM loan_service.loan_types lt2 WHERE lt2.tenant_id = ? AND lt2.name = lt.name)",
					tenantId, tenantId);

				// Sync pawning settings
				jdbcTemplate.update(
					"INSERT INTO pawning_service.pawning_settings (setting_key, setting_value, description, tenant_id) " +
					"SELECT setting_key, setting_value, description, ? " +
					"FROM pawning_service.pawning_settings ps WHERE tenant_id = 1 AND NOT EXISTS (SELECT 1 FROM pawning_service.pawning_settings ps2 WHERE ps2.tenant_id = ? AND ps2.setting_key = ps.setting_key)",
					tenantId, tenantId);
			}
			System.out.println("✅ Synced default loan types and pawning settings for all tenants.");
		};
	}
}

