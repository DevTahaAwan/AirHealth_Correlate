export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { z } from "zod";

const symptomEnum = z.enum([
  "wheezing",
  "coughing",
  "shortness_of_breath",
  "chest_tightness",
  "inhaler_used",
]);

const reportSchema = z.object({
  user_id: z.string().min(1),
  district_id: z.string().min(1),
  symptoms: z.array(symptomEnum).min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = reportSchema.safeParse(body);

    if (!result.success) {
      console.error("Invalid payload error:", result.error.format());
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "Invalid payload", details: result.error.format() } },
        { status: 400 }
      );
    }

    const { user_id: device_id, district_id, symptoms } = result.data;
    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];

    // Prepare rows to insert (one per symptom)
    const rowsToInsert = symptoms.map(symptom => ({
      device_id,
      district_id,
      symptom,
      reported_at: today
    }));

    const { data, error } = await supabase
      .from("symptom_reports")
      .insert(rowsToInsert)
      .select();

    if (error) {
      // 23505 is the PostgreSQL unique constraint violation code
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: { code: "CONFLICT", message: "You have already reported symptoms today." } },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error: unknown) {
    console.error("Failed to insert symptom report:", error);
    return NextResponse.json(
      { success: false, error: { code: "SERVER_ERROR", message: "Internal Server Error" } },
      { status: 500 }
    );
  }
}
