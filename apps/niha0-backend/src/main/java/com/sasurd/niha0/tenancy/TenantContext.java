package com.sasurd.niha0.tenancy;
import java.util.UUID;
public final class TenantContext {
    private static final ThreadLocal<UUID> ORG = new ThreadLocal<>();
    private static final ThreadLocal<UUID> USER = new ThreadLocal<>();
    private TenantContext() {}
    public static void set(UUID orgId, UUID userId) { ORG.set(orgId); USER.set(userId); }
    public static UUID orgId() { return ORG.get(); }
    public static UUID userId() { return USER.get(); }
    public static void clear() { ORG.remove(); USER.remove(); }
}
