import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { appDb } from "@/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await appDb.execute(sql`select 1`);
    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json({ status: "degraded" }, { status: 503 });
  }
}
