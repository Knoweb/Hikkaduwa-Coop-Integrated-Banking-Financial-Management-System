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
        // Ensure roles exist
        ensureRolesExist();
        
        // Ensure branch exists
        ensureBranchExists();
        
        // Create an admin user if it doesn't exist
        if (userRepository.findByUsername("admin").isEmpty()) {
            Optional<Role> adminRoleOpt = roleRepository.findByRoleName("SYSTEM_ADMIN");
            Optional<Branch> mainBranchOpt = branchRepository.findByBranchName("Main Branch - Hikkaduwa");

            if (adminRoleOpt.isPresent() && mainBranchOpt.isPresent()) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPasswordHash(passwordEncoder.encode("admin123"));
                admin.setFullName("System Administrator");
                admin.setRole(adminRoleOpt.get());
                admin.setBranch(mainBranchOpt.get());
                admin.setStatus("ACTIVE");

                userRepository.save(admin);
                System.out.println("=========================================================");
                System.out.println("Test User Created: username=admin, password=admin123");
                System.out.println("=========================================================");
            }
        }

        // Create a General Manager user if it doesn't exist
        if (userRepository.findByUsername("general_manager").isEmpty()) {
            Optional<Role> gmRoleOpt = roleRepository.findByRoleName("GENERAL_MANAGER");
            Optional<Branch> mainBranchOpt = branchRepository.findByBranchName("Main Branch - Hikkaduwa");

            if (gmRoleOpt.isPresent() && mainBranchOpt.isPresent()) {
                User generalManager = new User();
                generalManager.setUsername("general_manager");
                generalManager.setPasswordHash(passwordEncoder.encode("manager123"));
                generalManager.setFullName("General Manager");
                generalManager.setRole(gmRoleOpt.get());
                generalManager.setBranch(mainBranchOpt.get());
                generalManager.setStatus("ACTIVE");

                userRepository.save(generalManager);
                System.out.println("=========================================================");
                System.out.println("Test User Created: username=general_manager, password=manager123");
                System.out.println("=========================================================");
            }
        }
    }

    private void ensureRolesExist() {
        String[] roleNames = {"SYSTEM_ADMIN", "GENERAL_MANAGER", "BRANCH_MANAGER", "TELLER"};
        for (String roleName : roleNames) {
            if (roleRepository.findByRoleName(roleName).isEmpty()) {
                Role role = new Role();
                role.setRoleName(roleName);
                role.setDescription(roleName + " role");
                roleRepository.save(role);
                System.out.println("Role Created: " + roleName);
            }
        }
    }

    private void ensureBranchExists() {
        if (branchRepository.findByBranchName("Main Branch - Hikkaduwa").isEmpty()) {
            Branch branch = new Branch();
            branch.setBranchName("Main Branch - Hikkaduwa");
            branch.setLocation("Hikkaduwa");
            branch.setStatus("ACTIVE");
            branchRepository.save(branch);
            System.out.println("Branch Created: Main Branch - Hikkaduwa");
        }
    }
}
