import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting scheduled email sender...");

    // Get active email schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from("email_schedules")
      .select("*")
      .eq("is_active", true);

    if (schedulesError) {
      console.error("Error fetching schedules:", schedulesError);
      throw schedulesError;
    }

    if (!schedules || schedules.length === 0) {
      console.log("No active schedules found");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No active schedules to process" 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const now = new Date();
    const results = [];

    for (const schedule of schedules) {
      const shouldSend = (
        schedule.report_type === "weekly" && 
        (!schedule.last_sent_at || 
         (now.getTime() - new Date(schedule.last_sent_at).getTime()) >= 7 * 24 * 60 * 60 * 1000)
      ) || (
        schedule.report_type === "monthly" && 
        (!schedule.last_sent_at || 
         new Date(schedule.last_sent_at).getMonth() !== now.getMonth() ||
         new Date(schedule.last_sent_at).getFullYear() !== now.getFullYear())
      );

      if (!shouldSend) {
        console.log(`Skipping ${schedule.report_type} - not due yet`);
        results.push({
          scheduleId: schedule.id,
          reportType: schedule.report_type,
          status: "skipped",
          reason: "Not due yet"
        });
        continue;
      }

      if (!schedule.recipient_emails || schedule.recipient_emails.length === 0) {
        console.log(`Skipping ${schedule.report_type} - no recipients`);
        results.push({
          scheduleId: schedule.id,
          reportType: schedule.report_type,
          status: "skipped",
          reason: "No recipients configured"
        });
        continue;
      }

      console.log(`Sending ${schedule.report_type} report to ${schedule.recipient_emails.length} recipients`);

      // Send emails to each recipient
      const emailResults = [];
      for (const email of schedule.recipient_emails) {
        try {
          const emailResponse = await fetch(
            `${supabaseUrl}/functions/v1/send-report-email`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseKey}`,
              },
              body: JSON.stringify({
                reportType: schedule.report_type,
                toEmail: email,
              }),
            }
          );

          const emailResult = await emailResponse.json();
          emailResults.push({
            email,
            success: emailResponse.ok,
            result: emailResult,
          });
        } catch (error: any) {
          console.error(`Error sending to ${email}:`, error);
          emailResults.push({
            email,
            success: false,
            error: error.message,
          });
        }
      }

      // Update last_sent_at
      const { error: updateError } = await supabase
        .from("email_schedules")
        .update({ last_sent_at: now.toISOString() })
        .eq("id", schedule.id);

      if (updateError) {
        console.error("Error updating schedule:", updateError);
      }

      results.push({
        scheduleId: schedule.id,
        reportType: schedule.report_type,
        status: "sent",
        recipients: emailResults,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Scheduled emails processed",
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in scheduled email sender:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
