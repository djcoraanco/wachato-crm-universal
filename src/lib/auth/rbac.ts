import { getDb, schema } from "@/lib/db";
import { newId } from "@/lib/db/ids";

export type WachatoRole =
  | "superadmin"
  | "owner"
  | "admin"
  | "operador"
  | "recepcionista"
  | "viewer";

export type Permission =
  | "manage:system"
  | "manage:settings"
  | "manage:team"
  | "manage:modules"
  | "manage:ai"
  | "manage:channels"
  | "manage:billing"
  | "manage:agency"
  | "agency:switch_client"
  | "manage:platform_plans"
  | "inbox:read"
  | "inbox:write"
  | "contacts:read"
  | "contacts:write"
  | "pipeline:read"
  | "pipeline:write"
  | "bookings:read"
  | "bookings:write"
  | "analytics:read"
  | "backups:create"
  | "backups:download";

const ROLE_PERMISSIONS: Record<WachatoRole, Permission[]> = {
  superadmin: [
    "manage:system",
    "manage:settings",
    "manage:team",
    "manage:modules",
    "manage:ai",
    "manage:channels",
    "manage:billing",
    "manage:agency",
    "agency:switch_client",
    "manage:platform_plans",
    "inbox:read",
    "inbox:write",
    "contacts:read",
    "contacts:write",
    "pipeline:read",
    "pipeline:write",
    "bookings:read",
    "bookings:write",
    "analytics:read",
    "backups:create",
    "backups:download",
  ],
  owner: [
    "manage:settings",
    "manage:team",
    "manage:modules",
    "manage:ai",
    "manage:channels",
    "manage:billing",
    "manage:agency",
    "agency:switch_client",
    "inbox:read",
    "inbox:write",
    "contacts:read",
    "contacts:write",
    "pipeline:read",
    "pipeline:write",
    "bookings:read",
    "bookings:write",
    "analytics:read",
    "backups:create",
    "backups:download",
  ],
  admin: [
    "manage:settings",
    "manage:team",
    "manage:modules",
    "manage:ai",
    "manage:channels",
    "manage:billing",
    "inbox:read",
    "inbox:write",
    "contacts:read",
    "contacts:write",
    "pipeline:read",
    "pipeline:write",
    "bookings:read",
    "bookings:write",
    "analytics:read",
    "backups:create",
    "backups:download",
  ],
  operador: [
    "inbox:read",
    "inbox:write",
    "contacts:read",
    "contacts:write",
    "pipeline:read",
    "pipeline:write",
    "bookings:read",
    "bookings:write",
    "analytics:read",
  ],
  recepcionista: [
    "inbox:read",
    "contacts:read",
    "bookings:read",
    "bookings:write",
  ],
  viewer: [
    "inbox:read",
    "contacts:read",
    "pipeline:read",
    "bookings:read",
    "analytics:read",
  ],
};

export function hasPermission(
  role: string | null | undefined,
  permission: Permission
): boolean {
  if (!role) return false;
  const normalized = (role.toLowerCase() in ROLE_PERMISSIONS
    ? role.toLowerCase()
    : "operador") as WachatoRole;

  const perms = ROLE_PERMISSIONS[normalized] ?? [];
  return perms.includes(permission);
}

export function assertPermission(
  role: string | null | undefined,
  permission: Permission
): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Permiso denegado: se requiere '${permission}'`);
  }
}

export async function logAuditEvent({
  organizationId,
  userId,
  action,
  entityType,
  entityId,
  details,
  ipAddress,
  userAgent,
}: {
  organizationId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  try {
    const db = getDb();
    await db.insert(schema.auditLog).values({
      id: newId("auditLog"),
      organizationId,
      userId: userId ?? null,
      action,
      entityType,
      entityId: entityId ?? null,
      details: details ?? null,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });
  } catch (err) {
    // Audit logs nunca deben tumbar el flujo principal si hay error de inserción
    console.error("[audit_log] Error registrando auditoría:", err);
  }
}

/**
 * Comprueba si un rol o usuario es superadministrador de la plataforma.
 */
export function isSuperAdmin(roleOrUser: string | { platformRole?: string } | null | undefined): boolean {
  if (!roleOrUser) return false;
  if (typeof roleOrUser === "object") {
    return roleOrUser.platformRole === "superadmin";
  }
  return roleOrUser === "superadmin";
}

/**
 * Comprueba si el rol puede gestionar la facturación y suscripciones del negocio.
 */
export function canManageBilling(role: string | null | undefined): boolean {
  return hasPermission(role, "manage:billing");
}

/**
 * Comprueba si el rol puede gestionar configuraciones de marca blanca y subcuentas de agencia.
 */
export function canManageAgency(role: string | null | undefined): boolean {
  return hasPermission(role, "manage:agency");
}
