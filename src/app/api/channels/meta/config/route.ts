import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { isMetaAppConfigured } from "@/server/meta/oauth";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = getEnv();
  const configured = isMetaAppConfigured();

  return NextResponse.json({
    configured,
    appId: configured ? env.META_APP_ID : null,
    configId: configured ? env.META_CONFIG_ID ?? null : null,
  });
}
