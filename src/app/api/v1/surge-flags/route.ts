export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { computeSurgeHeuristic } from "@/lib/services";

export async function GET() {
  const flags = await computeSurgeHeuristic();

  return NextResponse.json({
    success: true,
    data: flags,
    meta: {
      last_updated: new Date().toISOString(),
    }
  });
}
