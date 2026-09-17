export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import crypto from "crypto";



const reportSchema = z.object({
  district_id: z.string().min(1),
  device_id: z.string().optional(),
  name: z.string().optional(),
  age_group: z.string().optional(),
  ever_used_inhaler: z.boolean().optional(),
  // Old format
  symptoms: z.array(z.string()).optional(),
  severity: z.number().optional(),
  duration: z.string().optional(),
  // New format
  coughing_severity: z.number().optional(),
  shortness_of_breath_severity: z.number().optional(),
  sputum_color: z.string().optional(),
  spo2: z.number().optional(),
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

    const { 
      district_id, device_id, name: payloadName, age_group, ever_used_inhaler, symptoms, severity, duration, 
      coughing_severity, shortness_of_breath_severity, sputum_color, spo2 
    } = result.data;
    
    const supabaseServer = createSupabaseServerClient();
    const { data: { session } } = await supabaseServer.auth.getSession();

    let uid: string | undefined;
    let name: string | undefined;
    let email: string | undefined;
    let isAnonymous = false;
    let finalDeviceId = device_id;

    if (session?.user) {
      uid = session.user.id;
      name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || "Anonymous";
      email = session.user.email || "";
      if (!finalDeviceId) {
        finalDeviceId = crypto.randomUUID();
      }
    } else {
      if (!finalDeviceId) {
        return NextResponse.json(
          { success: false, error: { code: "BAD_REQUEST", message: "device_id is required for anonymous reports" } },
          { status: 400 }
        );
      }
      isAnonymous = true;
    }

    const supabase = getSupabaseAdmin();
    const today = new Date().toISOString().split('T')[0];

    // Explicitly check for an existing report today from this user/device in this district
    let query = supabase
      .from("symptom_reports")
      .select("id")
      .eq("district_id", district_id)
      .eq("reported_at", today)
      .limit(1);

    if (isAnonymous) {
      query = query.eq("device_id", finalDeviceId);
    } else {
      query = query.eq("user_id", uid!);
    }

    const { data: existingReport } = await query.single();

    if (existingReport) {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "You have already submitted a report today." } },
        { status: 400 }
      );
    }

    // Prepare rows to insert
    const rowsToInsert = [];
    const aggregatedSymptoms: string[] = [];

    // Handle new format
    const baseRow = isAnonymous 
      ? { 
          device_id: finalDeviceId, 
          district_id, 
          reported_at: today,
          name: payloadName || null,
          age_group: age_group || null,
          ever_used_inhaler: ever_used_inhaler ?? null
        }
      : { user_id: uid, name, email, device_id: finalDeviceId, district_id, reported_at: today };

    if (coughing_severity !== undefined || shortness_of_breath_severity !== undefined) {
      const durationStr = "Daily Log";
      if (coughing_severity && coughing_severity > 0) {
        rowsToInsert.push({
          ...baseRow, symptom: "coughing", severity: coughing_severity, duration: durationStr,
          sputum_color, spo2
        });
        aggregatedSymptoms.push("coughing");
      }
      if (shortness_of_breath_severity && shortness_of_breath_severity > 0) {
        rowsToInsert.push({
          ...baseRow, symptom: "shortness_of_breath", severity: shortness_of_breath_severity, duration: durationStr,
          sputum_color, spo2
        });
        aggregatedSymptoms.push("shortness_of_breath");
      }
      // If both 0 but they submitted, we just log an "inhaler_used" or "none" to save the spo2/sputum?
      // Let's use "routine_log" so we don't drop the data
      if (rowsToInsert.length === 0) {
        rowsToInsert.push({
          ...baseRow, symptom: "routine_log", severity: 0, duration: durationStr,
          sputum_color, spo2
        });
      }
    } 
    // Handle old format fallback
    else if (symptoms && symptoms.length > 0) {
      for (const s of symptoms) {
        rowsToInsert.push({
          ...baseRow, symptom: s, severity: severity || 1, duration: duration || "1 day"
        });
        aggregatedSymptoms.push(s);
      }
    } else {
      return NextResponse.json(
        { success: false, error: { code: "BAD_REQUEST", message: "No symptoms provided." } },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("symptom_reports")
      .insert(rowsToInsert)
      .select();

    if (error) {
      throw error;
    }

    // Update aggregate counts
    for (const symptom of aggregatedSymptoms) {
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
