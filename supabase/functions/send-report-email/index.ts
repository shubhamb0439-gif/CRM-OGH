import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailData {
  reportType: "weekly" | "monthly";
  toEmail?: string;
}

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
    const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");
    const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN");
    const fromEmail = Deno.env.get("MAILGUN_FROM_EMAIL") || "noreply@goldai.com";
    const defaultToEmail = Deno.env.get("MAILGUN_TO_EMAIL") || "admin@goldai.com";

    if (!mailgunApiKey || !mailgunDomain) {
      return new Response(
        JSON.stringify({ 
          error: "Mailgun credentials not configured",
          message: "Please add MAILGUN_API_KEY and MAILGUN_DOMAIN to your Supabase project secrets"
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { reportType, toEmail }: EmailData = await req.json();
    const recipientEmail = toEmail || defaultToEmail;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let subject: string;

    if (reportType === "weekly") {
      endDate = now;
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      subject = `Weekly CRM Report - ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`;
    } else {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      startDate = new Date(currentYear, currentMonth, 1);
      endDate = new Date(currentYear, currentMonth + 1, 0);
      subject = `Monthly CRM Report - ${startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;
    }

    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: false });

    if (leadsError) throw leadsError;

    const confirmedClients = leads?.filter(
      (l: any) => l.status === "Confirmed Client" || (l.status === "Closed" && l.closed_reason === "Confirmed Client")
    ).length || 0;

    const qualifiedProspects = leads?.filter(
      (l: any) => l.status === "Qualified Prospect"
    ).length || 0;

    const totalValue = leads?.reduce((sum: number, lead: any) => {
      return sum + (lead.value_per_annum || 0);
    }, 0) || 0;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 800px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #531B93 0%, #2563EB 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; }
    .header p { margin: 10px 0 0 0; opacity: 0.9; }
    .content { padding: 30px; background: white; }
    .summary { background: #f1f5f9; padding: 25px; border-radius: 8px; margin: 20px 0; }
    .summary h2 { margin: 0 0 20px 0; color: #531B93; font-size: 20px; }
    .stats { display: flex; justify-content: space-around; flex-wrap: wrap; }
    .stat { text-align: center; margin: 10px; padding: 15px; background: white; border-radius: 8px; min-width: 150px; border-left: 4px solid #2563EB; }
    .stat-value { font-size: 32px; font-weight: bold; color: #531B93; margin: 0; }
    .stat-label { font-size: 14px; color: #64748b; margin: 5px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    thead { background: #531B93; color: white; }
    th { padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    tr:hover { background: #f8fafc; }
    .status-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .status-new { background: #dbeafe; color: #1e40af; }
    .status-contacted { background: #fef3c7; color: #92400e; }
    .status-qualified { background: #d1fae5; color: #065f46; }
    .status-confirmed { background: #d1fae5; color: #065f46; }
    .status-closed { background: #f1f5f9; color: #475569; }
    .footer { text-align: center; padding: 30px; color: #64748b; font-size: 12px; background: #f8fafc; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 ${reportType === "weekly" ? "Weekly" : "Monthly"} CRM Summary Report</h1>
      <p>${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
    </div>
    <div class="content">
      <div class="summary">
        <h2>📊 Summary Statistics</h2>
        <div class="stats">
          <div class="stat">
            <p class="stat-value">${leads?.length || 0}</p>
            <p class="stat-label">Total Leads</p>
          </div>
          <div class="stat" style="border-left-color: #10b981;">
            <p class="stat-value">${confirmedClients}</p>
            <p class="stat-label">Confirmed Clients</p>
          </div>
          <div class="stat" style="border-left-color: #f59e0b;">
            <p class="stat-value">${qualifiedProspects}</p>
            <p class="stat-label">Qualified Prospects</p>
          </div>
          <div class="stat" style="border-left-color: #8b5cf6;">
            <p class="stat-value">$${totalValue.toLocaleString()}</p>
            <p class="stat-label">Total Value/Year</p>
          </div>
        </div>
      </div>
      <h3 style="color: #531B93; margin-top: 30px;">📋 Recent Leads</h3>
      ${leads && leads.length > 0 ? `
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Name</th>
            <th>Facility</th>
            <th>Source</th>
            <th>Added By</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${leads.slice(0, 20).map((lead: any) => {
            const statusClass =
              lead.status === "New" ? "status-new" :
              lead.status === "Contacted" ? "status-contacted" :
              lead.status === "Qualified Prospect" ? "status-qualified" :
              lead.status === "Confirmed Client" ? "status-confirmed" :
              "status-closed";
            
            return `
            <tr>
              <td>${new Date(lead.created_at).toLocaleDateString()}</td>
              <td><strong>${lead.name}</strong></td>
              <td>${lead.facility}</td>
              <td>${lead.source}</td>
              <td>${lead.added_by || "System"}</td>
              <td><span class="status-badge ${statusClass}">${lead.status}</span></td>
            </tr>
            `;
          }).join("")}
        </tbody>
      </table>
      ${leads.length > 20 ? `<p style="text-align: center; color: #64748b; margin-top: 15px;">Showing 20 of ${leads.length} leads</p>` : ""}
      ` : `
      <p style="text-align: center; padding: 40px; color: #64748b;">No leads found for this period.</p>
      `}
    </div>
    <div class="footer">
      <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      <p><strong>Gold AI CRM</strong> - OG Healthcare</p>
    </div>
  </div>
</body>
</html>
    `;

    const formData = new FormData();
    formData.append("from", fromEmail);
    formData.append("to", recipientEmail);
    formData.append("subject", subject);
    formData.append("html", htmlBody);

    const mailgunResponse = await fetch(
      `https://api.mailgun.net/v3/${mailgunDomain}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}`,
        },
        body: formData,
      }
    );

    if (!mailgunResponse.ok) {
      const errorText = await mailgunResponse.text();
      throw new Error(`Mailgun API error: ${errorText}`);
    }

    const mailgunResult = await mailgunResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: `${reportType === "weekly" ? "Weekly" : "Monthly"} report sent successfully`,
        recipient: recipientEmail,
        leadsCount: leads?.length || 0,
        mailgunId: mailgunResult.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending report:", error);
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
