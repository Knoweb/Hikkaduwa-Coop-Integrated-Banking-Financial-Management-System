# Error Handling and Logging Policy

*Date: August 2026*
*Ref: CERT Guidelines Section 1.3.8*

## 1. Overview
This policy governs how errors and logs are managed, stored, and monitored within the Hikkaduwa Cooperative Management System (HMCS). It aligns with industry best practices and CERT requirements to ensure sensitive data is not leaked and security events are reliably recorded.

## 2. Generic Error Handling (1.3.8 a, b)
All backend microservices must hide internal stack traces and error details from the end user.
- **Rule:** `server.error.include-message`, `server.error.include-stacktrace`, and `server.error.include-binding-errors` are strictly set to `never`.
- **Outcome:** Unexpected application exceptions return a generic HTTP 500 error response with no sensitive stack details.

## 3. Log Generation (1.3.8 c)
System and Security events are continuously logged by the system.
- **System Audit Logs:** Stored in the `system_audit_logs` database table. This captures:
  - Successful logins.
  - Failed login attempts (invalid credentials, account lockouts).
  - Explicit logouts.
  - Administrative activities (creation of users, configuration changes).
- **Application Logs:** Routine operational logs generated via SLF4J (Logback) by microservices.

## 4. Log Storage and Security (1.3.8 d, e, h, i)
- **Centralized Log Server:** In the production environment, a separate Log Server (e.g., ELK Stack - Elasticsearch, Logstash, Kibana) MUST be maintained.
- **Secure Transmission:** Logs from the application servers must be shipped to the log server using TLS (Transport Layer Security) via secure agents like Filebeat.
- **Read-Only Storage:** Once logs are ingested by the log server, they must be stored on a read-only or append-only file system. Modifying or deleting logs prior to the retention period expiration is strictly prohibited.
- **Retention Period:** All security, authentication, and transaction logs must be retained for a minimum of **2 Years** (or as mandated by local cooperative regulations) before safe disposal.

## 5. Monitoring and Access Control (1.3.8 f, g)
- **Restricted Access:** Only designated System Administrators and the Internal Auditor role are allowed access to the raw log files or the centralized log dashboard.
- **Regular Review:** The Internal Auditor is responsible for reviewing the System Security Logs at least once per week to identify anomalies, brute-force attempts, or unauthorized access patterns.
- **UI Visibility:** High-level authentication and security logs are accessible securely via the HMCS Admin Dashboard under the "Audit Logs" section for authorized Branch Managers and Organization Admins.
