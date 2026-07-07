package com.hmcs.loan.multitenancy;

public class TenantContext {
    private static final ThreadLocal<Integer> currentTenant = new ThreadLocal<>();

    public static void setTenantId(Integer tenantId) {
        currentTenant.set(tenantId);
    }

    public static Integer getTenantId() {
        return currentTenant.get();
    }

    public static void clear() {
        currentTenant.remove();
    }
}
