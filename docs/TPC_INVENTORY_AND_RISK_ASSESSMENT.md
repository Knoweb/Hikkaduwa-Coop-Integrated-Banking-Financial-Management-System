# Third-Party Components (TPC) Inventory & Risk Assessment

*Date: August 2026*
*Ref: CERT Guidelines Section 1.3.7*

## Overview
This document serves as the official inventory of all major Third-Party Components (TPCs) used in the Hikkaduwa Bank Cooperative Management System. Prior to the utilization of these TPCs, a security risk assessment was performed to ensure they are established, proven, and actively maintained.

## Frontend Components (UI/UX)

| Component / Library | Version | Purpose | Risk Assessment & Mitigation |
| :--- | :--- | :--- | :--- |
| **React** | 18.2.0 | Core UI Framework | Extremely widely used and proven. Maintained by Meta. High stability and fast patch cycles for security vulnerabilities. |
| **Vite** | 5.2.0 | Build Tool | Standard modern build tool. Safe for development use; vulnerabilities are rarely exposed to production. |
| **Axios** | 1.6.0 (patched) | HTTP Client | Proven and widely used. Regularly patched against DoS and prototype pollution vectors. |
| **TailwindCSS** | 3.4.3 | Styling Framework | CSS framework with no runtime security risks. |
| **React Router** | 6.22.3 | Client-side Routing | Industry standard routing. Low risk; updated frequently. |

## Backend Components (API & Microservices)

| Component / Library | Version | Purpose | Risk Assessment & Mitigation |
| :--- | :--- | :--- | :--- |
| **Spring Boot** | 3.2.5 | Core Framework | Enterprise-grade Java framework. Strongly proven, vast ecosystem, and swift responses to zero-day vulnerabilities. |
| **Spring Security** | 6.2.x | Authentication & AuthZ | Industry standard for Java security. Protects against CSRF, Session Fixation, and injection. |
| **Spring Cloud Gateway** | 2023.0.1 | API Gateway | Highly robust reactive API gateway. Validates global sessions efficiently. |
| **io.jsonwebtoken (JJWT)** | 0.11.5 | JWT Generation | Established library for JWT parsing and generation. |
| **Hibernate / JPA** | 6.4.x | ORM & Database Layer | Proven object-relational mapper. Automatically escapes queries, mitigating SQL injection risks. |
| **PostgreSQL JDBC Driver** | 42.7.2 | Database Driver | Standard driver for PG. Secure and mature. |

## Vulnerability Management Policy

1. **Automated Scanning (Frontend):** `npm audit` is run continuously during the build pipeline. All packages with 'High' or 'Critical' vulnerabilities must be patched immediately via `npm audit fix`.
2. **Automated Scanning (Backend):** The OWASP `dependency-check-maven` plugin (v9.1.0) is integrated into the Maven lifecycle. It compares project dependencies against the National Vulnerability Database (NVD) and breaks the build if critical flaws are found.
3. **Patching Lifecycle:** TPCs are actively tracked. Updates to minor versions are applied automatically after automated testing. Major version upgrades require manual impact assessment.
