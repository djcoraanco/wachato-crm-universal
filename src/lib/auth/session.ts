import { cookies, headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { resolveMembership } from "@/server/auth/on-signup";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export type SessionContext = {
  userId: string;
  organizationId: string;
  role: string;
  platformRole?: string;
};

export class UnauthorizedError extends Error {
  constructor(message = "No autenticado") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Sesión + organización activa para route handlers y server components.
 * Soporta cambio dinámico de organización activa para agencias mediante cookie o header.
 */
export async function requireSession(): Promise<SessionContext> {
  const auth = getAuth();
  const reqHeaders = await headers();
  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session) throw new UnauthorizedError();

  const db = getDb();
  const userRow = await db
    .select({ platformRole: schema.user.platformRole })
    .from(schema.user)
    .where(eq(schema.user.id, session.user.id))
    .limit(1);

  const isSuper = userRow[0]?.platformRole === "superadmin";

  const cookieStore = await cookies().catch(() => null);
  const preferredOrgId =
    cookieStore?.get("active_org_id")?.value || reqHeaders.get("x-organization-id");

  const membership = await resolveMembership(session.user.id, preferredOrgId);
  if (!membership) {
    throw new UnauthorizedError("Sesión sin organización activa");
  }
  return {
    userId: session.user.id,
    organizationId: membership.organizationId,
    role: isSuper ? "superadmin" : membership.role,
    platformRole: userRow[0]?.platformRole ?? "user",
  };
}

/** Igual que requireSession pero devuelve null en vez de lanzar. */
export async function getSessionOrNull(): Promise<SessionContext | null> {
  try {
    return await requireSession();
  } catch {
    return null;
  }
}
