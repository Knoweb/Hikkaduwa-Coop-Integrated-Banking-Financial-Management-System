import java.sql.*;

public class DbTest {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/hmcs_db";
        String user = "hmcs_app";
        String password = System.getenv("DB_PASSWORD");
        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            ResultSet rs = stmt.executeQuery("SELECT count(*) FROM audit_service.audit_corrections");
            if (rs.next()) {
                System.out.println("TOTAL CORRECTIONS: " + rs.getInt(1));
            }
            rs = stmt.executeQuery("SELECT count(*) FROM audit_service.audit_corrections WHERE tenant_id = 1");
            if (rs.next()) {
                System.out.println("CORRECTIONS FOR TENANT 1: " + rs.getInt(1));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
