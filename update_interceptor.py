import os

content = '''package {package}.multitenancy;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import java.util.Base64;

@Component
public class TenantInterceptor implements HandlerInterceptor {{

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {{
        String authHeader = request.getHeader("Authorization");
        Integer tenantId = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {{
            String token = authHeader.substring(7);
            try {{
                String[] parts = token.split("\\\\.");
                if (parts.length == 3) {{
                    String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
                    String search = "\\"tenantId\\":";
                    int idx = payload.indexOf(search);
                    if (idx != -1) {{
                        int start = idx + search.length();
                        int end = payload.indexOf(",", start);
                        if (end == -1) end = payload.indexOf("}}", start);
                        if (end != -1) {{
                            String idStr = payload.substring(start, end).trim();
                            tenantId = Integer.parseInt(idStr);
                        }}
                    }}
                }}
            }} catch (Exception e) {{
            }}
        }}

        if (tenantId == null) {{
            String tenantHeader = request.getHeader("X-Tenant-ID");
            if (tenantHeader != null) {{
                try {{
                    tenantId = Integer.parseInt(tenantHeader);
                }} catch (NumberFormatException e) {{
                }}
            }}
        }}

        if (tenantId != null) {{
            TenantContext.setTenantId(tenantId);
        }} else {{
            TenantContext.setTenantId(1);
        }}

        return true;
    }}

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {{
        TenantContext.clear();
    }}
}}
'''

services = [
    ('hmcs-member-auth-service', 'com.hmcs.auth'),
    ('hmcs-account-service', 'com.hmcs.account'),
    ('hmcs-loan-service', 'com.hmcs.loan'),
    ('hmcs-savings-service', 'com.hmcs.savings'),
    ('hmcs-pawning-service', 'com.hmcs.pawning'),
    ('hmcs-member-service', 'com.hmcs.member')
]

for svc, pkg in services:
    path = f'hmcs-backend/{svc}/src/main/java/{pkg.replace(".", "/")}/multitenancy/TenantInterceptor.java'
    if os.path.exists(path):
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content.format(package=pkg))
        print(f'Updated {path}')
