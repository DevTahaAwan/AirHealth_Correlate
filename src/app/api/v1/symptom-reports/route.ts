export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";

const symptomEnum = z.enum([
  "wheezing",
  "coughing",
  "shortness_of_breath",
  "chest_tightness",
  "inhaler_used",
  "eye_irritation"
]);

const reportSchema = z.object({
  district_id: z.string().min(1),
  symptoms: z.array(symptomEnum).min(1),
  severity: z.number().min(1).max(10),
  duration: z.string().min(1),
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

    const { district_id, symptoms, severity, duration } = result.data;
    const supabaseServer = createSupabaseServerClient();
    const { data: { session } } = await supabaseServer.auth.getSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "You must be logged in to report symptoms." } },
        { status: 401 }
      );
    }

    const uid = session.user.id;
    const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Anonymous";
    const email = session.user.email || "";

    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];

    // Explicitly check for an existing report today from this user in this district
    const { data: existingReport } = await supabase
      .from("symptom_reports")
      .select("id")
      .eq("user_id", uid)
      .eq("district_id", district_id)
      .eq("reported_at", today)
      .limit(1)
      .single();

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "You have already submitted a report today." } },
        { status: 400 }
      );
    }

    // Prepare rows to insert (one per symptom)
    const rowsToInsert = symptoms.map(symptom => ({
      user_id: uid,
      reporter_name: name,
      reporter_email: email,
      district_id,
      symptom,
      severity,
      duration,
      reported_at: today
    }));

    const { data, error } = await supabase
      .from("symptom_reports")
      .insert(rowsToInsert)
      .select();

    if (error) {
      throw error;
    }

    // Update aggregate counts so the district detail API immediately reflects the new report
    for (const symptom of symptoms) {
      // Try to increment existing aggregate row, or insert a new one
      const { data: existingAgg } = await supabase
        .from("district_symptom_daily_aggregates")
        .select("id, report_count, distinct_reporter_count")
        .eq("district_id", district_id)
        .eq("report_date", today)
        .eq("symptom", symptom)
        .single();

      if (existingAgg) {
        await supabase
          .from("district_symptom_daily_aggregates")
          .update({
            report_count: existingAgg.report_count + 1,
            distinct_reporter_count: existingAgg.distinct_reporter_count + 1,
          })
          .eq("id", existingAgg.id);
      } else {
        await supabase
          .from("district_symptom_daily_aggregates")
          .insert({
            district_id,
            report_date: today,
            symptom,
            report_count: 1,
            distinct_reporter_count: 1,
            suppressed: false,
          });
      }
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
