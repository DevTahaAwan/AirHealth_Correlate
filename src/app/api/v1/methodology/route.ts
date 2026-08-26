export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { mockMethodologyData } from "@/data/methodology";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: mockMethodologyData,
  });
}
