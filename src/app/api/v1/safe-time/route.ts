export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { MockDataStore } from "@/lib/store";
import { calculateSafeExposure } from "@/lib/services";
import { RespiratoryCondition } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const districtId = searchParams.get("district_id");
  const conditionsParam = searchParams.get("conditions");

  if (!districtId) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "district_id is required" } },
      { status: 400 }
    );
  }

  const districts = await MockDataStore.getDistrictList();
  const district = districts.find((d) => d.district_id === districtId);

  if (!district) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "District not found" } },
      { status: 404 }
    );
  }

  const aqi = district.aqi || 50;
  
  // Parse conditions (comma separated)
  let conditions: RespiratoryCondition[] = [];
  if (conditionsParam) {
    conditions = conditionsParam.split(",") as RespiratoryCondition[];
  }

  const result = calculateSafeExposure(aqi, conditions);
  result.district_id = districtId;

  return NextResponse.json({
    success: true,
    data: result,
  });
}
