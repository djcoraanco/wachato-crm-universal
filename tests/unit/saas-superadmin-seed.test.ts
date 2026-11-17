import { describe, expect, it, vi, beforeAll, beforeEach } from "vitest";

const dbUsers: Record<string, unknown>[] = [];
const dbAccounts: Record<string, unknown>[] = [];
const dbOrganizations: Record<string, unknown>[] = [];

vi.mock("better-auth/crypto", () => ({
  hashPassword: vi.fn().mockResolvedValue("hashed_pass_mock_123"),
}));

vi.mock("@/server/billing/service", () => ({
  getPlanBySlug: vi.fn().mockResolvedValue({ id: "plan_agency", slug: "agency-scale" }),
  upsertSubscription: vi.fn().mockResolvedValue({ id: "sub_mock" }),
}));

vi.mock("@/lib/db", () => ({
  getDb: () => ({
    select: (_fields?: unknown) => ({
      from: (_table?: unknown) => {
        const chain = {
          where: () => chain,
          limit: () => {
            // Si busca usuario superadmin existente
            const hasSuperAdmin = dbUsers.find((u) => u.platformRole === "superadmin");
            if (hasSuperAdmin) return Promise.resolve([hasSuperAdmin]);

            // Si busca por email
            const byEmail = dbUsers.find((u) => u.email === "admin@wachato.com");
            if (byEmail) return Promise.resolve([byEmail]);

            return Promise.resolve([]);
          },
        };
        return chain;
      },
    }),
    transaction: async (cb: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        insert: (tbl: unknown) => ({
          values: (val: Record<string, unknown> | Record<string, unknown>[]) => {
            if (Array.isArray(val)) {
              return Promise.resolve();
            }
            if (tbl === "user_mock" || val.email) dbUsers.push(val);
            if (tbl === "account_mock" || val.password) dbAccounts.push(val);
            if (tbl === "org_mock" || val.slug) dbOrganizations.push(val);
            return Promise.resolve();
          },
        }),
        update: () => ({
          set: (val: Record<string, unknown>) => ({
            where: () => {
              const u = dbUsers[0];
              if (u) Object.assign(u, val);
              return Promise.resolve();
            },
          }),
        }),
      };
      return cb(tx);
    },
    update: () => ({
      set: (val: Record<string, unknown>) => ({
        where: () => {
          const u = dbUsers[0];
          if (u) Object.assign(u, val);
          return Promise.resolve();
        },
      }),
    }),
  }),
  schema: {
    user: { id: "id", email: "email", platformRole: "platform_role" },
    account: { id: "id", userId: "user_id" },
    organization: { id: "id", name: "name", slug: "slug" },
    member: { id: "id", organizationId: "organization_id", userId: "user_id" },
    pipelineStage: { id: "id" },
    agentProfile: { id: "id" },
  },
}));

import { ensureDefaultSuperAdmin } from "@/server/auth/superadmin-seed";

describe("SaaS SuperAdmin Auto-Seed & Protección", () => {
  beforeAll(() => {
    process.env.APP_BASE_URL = "http://localhost:3000";
    process.env.DATABASE_URL = "postgresql://t:t@localhost:5432/t";
    process.env.BETTER_AUTH_SECRET = "secret-super-admin-key-16";
    process.env.ENCRYPTION_KEY = Buffer.alloc(32, 5).toString("base64");
  });

  beforeEach(() => {
    dbUsers.length = 0;
    dbAccounts.length = 0;
    dbOrganizations.length = 0;
    vi.clearAllMocks();
  });

  it("crea automáticamente el SuperAdmin por defecto cuando no existe ninguno", async () => {
    const res = await ensureDefaultSuperAdmin({
      email: "admin@wachato.com",
      password: "SuperPassword123!",
      name: "Master Admin",
    });

    expect(res.created).toBe(true);
    expect(res.email).toBe("admin@wachato.com");

    expect(dbUsers.length).toBe(1);
    expect(dbUsers[0]?.platformRole).toBe("superadmin");
    expect(dbUsers[0]?.email).toBe("admin@wachato.com");

    expect(dbAccounts.length).toBe(1);
    expect(dbAccounts[0]?.password).toBe("hashed_pass_mock_123");

    expect(dbOrganizations.length).toBe(1);
    expect(dbOrganizations[0]?.slug).toBe("master");
  });

  it("es idempotente y no crea duplicados si el superadmin ya existe", async () => {
    dbUsers.push({
      id: "usr_existing_super",
      email: "admin@wachato.com",
      platformRole: "superadmin",
    });

    const res = await ensureDefaultSuperAdmin();
    expect(res.created).toBe(false);
    expect(res.email).toBe("admin@wachato.com");
    expect(dbAccounts.length).toBe(0);
  });
});
