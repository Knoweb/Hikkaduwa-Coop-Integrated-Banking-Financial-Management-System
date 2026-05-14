package com.hmcs.auth.config;

import com.hmcs.auth.entity.Branch;
import com.hmcs.auth.entity.Role;
import com.hmcs.auth.entity.User;
import com.hmcs.auth.repository.BranchRepository;
import com.hmcs.auth.repository.RoleRepository;
import com.hmcs.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Create an admin user if it doesn't exist
        if (userRepository.findByUsername("admin").isEmpty()) {
            
            // Fetch Role (Assuming SYSTEM_ADMIN was inserted via the schema seed script)
            Optional<Role> adminRoleOpt = roleRepository.findByRoleName("SYSTEM_ADMIN");
            // Fetch Branch (Assuming Main Branch - Hikkaduwa was inserted)
            Optional<Branch> mainBranchOpt = branchRepository.findByBranchName("Main Branch - Hikkaduwa");

            if (adminRoleOpt.isPresent() && mainBranchOpt.isPresent()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPasswordHash(passwordEncoder.encode("admin123")); // Set password to admin123
                admin.setFullName("System Administrator");
                admin.setRole(adminRoleOpt.get());
                admin.setBranch(mainBranchOpt.get());
                admin.setStatus("ACTIVE");

                userRepository.save(admin);
                System.out.println("=========================================================");
                System.out.println("Test User Created: username=admin, password=admin123");
                System.out.println("=========================================================");
            } else {
                System.out.println("Could not create test user. Ensure roles and branches are seeded in the database.");
            }
        }
    }
}
