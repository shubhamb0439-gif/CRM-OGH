import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    const { leads, month, year, recipients } = await req.json();

    if (!leads || !recipients || !Array.isArray(recipients)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: leads, recipients" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const filteredLeads = leads.filter((lead: any) => {
      const leadDate = new Date(lead.created_at);
      const leadMonth = leadDate.getMonth() + 1;
      const leadYear = leadDate.getFullYear();
      return leadMonth === parseInt(month) && leadYear === parseInt(year);
    });

    const confirmedClients = filteredLeads.filter(
      (l: any) => l.status === 'Confirmed Client' || (l.status === 'Closed' && l.closed_reason === 'Confirmed Client')
    ).length;

    const qualifiedProspects = filteredLeads.filter(
      (l: any) => l.status === 'Qualified Prospect'
    ).length;

    const emailBody = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: linear-gradient(135deg, #531B93 0%, #2563EB 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .summary { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .stat { display: inline-block; margin: 10px 20px; }
            .stat-value { font-size: 32px; font-weight: bold; color: #531B93; }
            .stat-label { font-size: 14px; color: #64748b; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #531B93; color: white; padding: 12px; text-align: left; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
            .footer { text-align: center; padding: 20px; color: #64748b; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎯 Monthly CRM Summary Report</h1>
            <p>${new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          <div class="content">
            <div class="summary">
              <h2>📊 Summary Statistics</h2>
              <div class="stat">
                <div class="stat-value">${filteredLeads.length}</div>
                <div class="stat-label">Total Leads Added</div>
              </div>
              <div class="stat">
                <div class="stat-value">${confirmedClients}</div>
                <div class="stat-label">Confirmed Clients</div>
              </div>
              <div class="stat">
                <div class="stat-value">${qualifiedProspects}</div>
                <div class="stat-label">Qualified Prospects</div>
              </div>
            </div>
            <h3>Lead Details</h3>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Facility</th>
                  <th>Source</th>
                  <th>Added By</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${filteredLeads.map((lead: any) => `
                  <tr>
                    <td>${lead.name}</td>
                    <td>${lead.facility}</td>
                    <td>${lead.source}</td>
                    <td>${lead.added_by || 'System'}</td>
                    <td>${lead.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()}</p>
            <p>Gold AI CRM - OG Healthcare</p>
          </div>
        </body>
      </html>
    `;

    console.log(`Sending monthly report to: ${recipients.join(', ')}`);
    console.log(`Total leads for period: ${filteredLeads.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Report prepared for ${filteredLeads.length} leads`,
        recipients: recipients.length,
        note: "Email sending requires SMTP configuration. HTML report generated successfully."
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});