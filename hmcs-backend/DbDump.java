import java.sql.*;
public class DbDump {
    public static void main(String[] args) {
        try (Connection conn = DriverManager.getConnection("jdbc:postgresql://localhost:5432/hmcs_db", "hmcs_app", "hmcs_secure_pass_2026");
             Statement stmt = conn.createStatement()) {
            ResultSet rs = stmt.executeQuery("SELECT tenant_id, COUNT(*) FROM audit_service.audit_corrections GROUP BY tenant_id");
            while (rs.next()) {
                System.out.println("Tenant/Branch ID: " + rs.getInt(1) + " -> Count: " + rs.getInt(2));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
