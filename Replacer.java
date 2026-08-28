import java.nio.file.*;
import java.nio.charset.StandardCharsets;

public class Replacer {
    public static void main(String[] args) throws Exception {
        Path p = Paths.get("hmcs-backend/hmcs-loan-service/src/main/java/com/hmcs/loan/controller/LoanController.java");
        String content = new String(Files.readAllBytes(p), StandardCharsets.UTF_8);
        content = content.replace(
            "hasAnyRole('MANAGER', 'BRANCH_MANAGER', 'ADMIN', 'SYSTEM_ADMIN', 'TELLER', 'FIELD_OFFICER')",
            "hasAnyRole('ORGANIZATION_ADMIN', 'PLATFORM_ADMIN', 'MANAGER', 'BRANCH_MANAGER', 'ADMIN', 'SYSTEM_ADMIN', 'TELLER', 'FIELD_OFFICER', 'SENIOR_OFFICER', 'CUSTOMER_SERVICE')"
        );
        content = content.replace(
            "hasAnyRole('MANAGER', 'BRANCH_MANAGER', 'ADMIN', 'SYSTEM_ADMIN')",
            "hasAnyRole('ORGANIZATION_ADMIN', 'PLATFORM_ADMIN', 'MANAGER', 'BRANCH_MANAGER', 'ADMIN', 'SYSTEM_ADMIN')"
        );
        content = content.replace(
            "hasAnyRole('MANAGER', 'BRANCH_MANAGER', 'ADMIN', 'SYSTEM_ADMIN', 'TELLER')",
            "hasAnyRole('ORGANIZATION_ADMIN', 'PLATFORM_ADMIN', 'MANAGER', 'BRANCH_MANAGER', 'ADMIN', 'SYSTEM_ADMIN', 'TELLER', 'SENIOR_OFFICER', 'CUSTOMER_SERVICE')"
        );
        content = content.replace(
            "hasAnyRole('MANAGER', 'ADMIN', 'SYSTEM_ADMIN')",
            "hasAnyRole('ORGANIZATION_ADMIN', 'PLATFORM_ADMIN', 'MANAGER', 'BRANCH_MANAGER', 'SENIOR_OFFICER', 'ADMIN', 'SYSTEM_ADMIN')"
        );
        Files.write(p, content.getBytes(StandardCharsets.UTF_8));

        Path p2 = Paths.get("hmcs-backend/hmcs-savings-service/src/main/java/com/hmcs/savings/controller/SavingsController.java");
        String content2 = new String(Files.readAllBytes(p2), StandardCharsets.UTF_8);
        content2 = content2.replace(
            "hasAnyRole('MANAGER', 'BRANCH_MANAGER', 'ADMIN', 'SYSTEM_ADMIN', 'TELLER', 'SENIOR_OFFICER', 'CUSTOMER_SERVICE')",
            "hasAnyRole('ORGANIZATION_ADMIN', 'PLATFORM_ADMIN', 'MANAGER', 'BRANCH_MANAGER', 'ADMIN', 'SYSTEM_ADMIN', 'TELLER', 'SENIOR_OFFICER', 'CUSTOMER_SERVICE')"
        );
        Files.write(p2, content2.getBytes(StandardCharsets.UTF_8));
    }
}
