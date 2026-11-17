/**
 * CLI para inicializar o promover el usuario SuperAdmin del SaaS:
 *   pnpm seed:superadmin
 * O con argumentos opcionales:
 *   node .tmp-seed-superadmin.mjs [email] [password] [name]
 */
import { ensureDefaultSuperAdmin } from "@/server/auth/superadmin-seed";

const emailArg = process.argv[2];
const passwordArg = process.argv[3];
const nameArg = process.argv[4];

async function main() {
  try {
    const result = await ensureDefaultSuperAdmin({
      email: emailArg,
      password: passwordArg,
      name: nameArg,
    });
    console.log(`[seed-superadmin] ${result.message}`);
    process.exit(0);
  } catch (err) {
    console.error("[seed-superadmin] Error creando SuperAdmin:", err);
    process.exit(1);
  }
}

void main();
