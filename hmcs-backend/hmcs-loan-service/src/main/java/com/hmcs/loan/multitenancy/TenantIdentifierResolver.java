package com.hmcs.loan.multitenancy;

import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

@Component
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver<Integer> {

    @Override
    public Integer resolveCurrentTenantIdentifier() {
        Integer tenantId = TenantContext.getTenantId();
        // Return 1 as default tenant (Hikkaduwa) if none is set in context
        return tenantId != null ? tenantId : 1;
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}
