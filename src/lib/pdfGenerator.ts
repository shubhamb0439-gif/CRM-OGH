import { Lead } from './supabase';
import { formatDateToDDMMYY } from './dateUtils';

export const generateMonthlyPDF = (leads: Lead[]) => {
  const sortedLeads = [...leads].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  console.log('PDF Generation Debug:', {
    totalLeads: sortedLeads.length,
    leadDates: sortedLeads.slice(0, 5).map(l => ({
      name: l.name,
      date: l.created_at,
      status: l.status,
      source: l.source,
      addedBy: l.added_by
    }))
  });

  const content = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Monthly CRM Summary - ${month}/${year}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 40px;
      color: #1e293b;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #531B93;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #531B93;
      margin: 0;
      font-size: 28px;
    }
    .header p {
      color: #64748b;
      margin: 10px 0 0 0;
      font-size: 16px;
    }
    .summary {
      background: #f1f5f9;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .summary h2 {
      margin-top: 0;
      color: #531B93;
      font-size: 20px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
    }
    .summary-item {
      background: white;
      padding: 15px;
      border-radius: 6px;
      border-left: 4px solid #2563EB;
    }
    .summary-item .label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .summary-item .value {
      font-size: 24px;
      font-weight: bold;
      color: #1e293b;
      margin-top: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
      background: white;
    }
    thead {
      background: #531B93;
      color: white;
    }
    th {
      padding: 12px;
      text-align: left;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
    }
    tr:hover {
      background: #f8fafc;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }
    .status-new { background: #dbeafe; color: #1e40af; }
    .status-contacted { background: #fef3c7; color: #92400e; }
    .status-qualified { background: #d1fae5; color: #065f46; }
    .status-contract { background: #e9d5ff; color: #6b21a8; }
    .status-confirmed { background: #d1fae5; color: #065f46; }
    .status-closed { background: #f1f5f9; color: #475569; }
    .status-closed-confirmed { background: #d1fae5; color: #065f46; }
    .status-closed-not-interested { background: #fee2e2; color: #991b1b; }
    .source-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
    }
    .source-assessment { background: #e9d5ff; color: #6b21a8; }
    .source-consultancy { background: #fce7f3; color: #9f1239; }
    .source-other { background: #dbeafe; color: #1e40af; }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #64748b;
      font-size: 12px;
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
    }
    @media print {
      body { margin: 20px; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎯 Complete CRM Lead Report</h1>
    <p>All Leads - Generated ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
  </div>

  <div class="summary">
    <h2>📊 Summary Statistics</h2>
    <div class="summary-grid">
      <div class="summary-item">
        <div class="label">Total Leads</div>
        <div class="value">${sortedLeads.length}</div>
      </div>
      <div class="summary-item" style="border-left-color: #10b981;">
        <div class="label">Confirmed Clients</div>
        <div class="value">${sortedLeads.filter(l => l.status === 'Confirmed Client' || (l.status === 'Closed' && l.closed_reason === 'Confirmed Client')).length}</div>
      </div>
      <div class="summary-item" style="border-left-color: #f59e0b;">
        <div class="label">Qualified Prospects</div>
        <div class="value">${sortedLeads.filter(l => l.status === 'Qualified Prospect').length}</div>
      </div>
    </div>
  </div>

  <h2 style="color: #531B93; margin-top: 30px;">📋 Detailed Lead Report</h2>
  <table>
    <thead>
      <tr>
        <th>Date Added</th>
        <th>Name</th>
        <th>Email</th>
        <th>Phone</th>
        <th>Facility</th>
        <th>State</th>
        <th>Source</th>
        <th>Added By</th>
        <th>Status</th>
        <th>Value/Year</th>
      </tr>
    </thead>
    <tbody>
      ${sortedLeads.length === 0 ? `
        <tr>
          <td colspan="10" style="text-align: center; padding: 40px; color: #64748b;">
            <strong>No leads found</strong>
          </td>
        </tr>
      ` : sortedLeads.map(lead => {
        const statusClass =
          lead.status === 'New' ? 'status-new' :
          lead.status === 'Contacted' ? 'status-contacted' :
          lead.status === 'Qualified Prospect' ? 'status-qualified' :
          lead.status === 'Contract Sent' ? 'status-contract' :
          lead.status === 'Confirmed Client' ? 'status-confirmed' :
          lead.status === 'Closed' && lead.closed_reason === 'Confirmed Client' ? 'status-closed-confirmed' :
          lead.status === 'Closed' && lead.closed_reason === 'Not Interested' ? 'status-closed-not-interested' :
          'status-closed';

        const sourceClass =
          lead.source === 'Assessment' ? 'source-assessment' :
          lead.source === 'Consultancy' ? 'source-consultancy' :
          'source-other';

        return `
        <tr>
          <td>${formatDateToDDMMYY(lead.created_at)}</td>
          <td><strong>${lead.name}</strong></td>
          <td>${lead.email}</td>
          <td>${lead.phone || 'N/A'}</td>
          <td>${lead.facility}</td>
          <td>${lead.state || lead.country || 'N/A'}</td>
          <td><span class="source-badge ${sourceClass}">${lead.source}</span></td>
          <td>${lead.added_by || 'System'}</td>
          <td><span class="status-badge ${statusClass}">${lead.status}${lead.status === 'Closed' && lead.closed_reason ? ` (${lead.closed_reason})` : ''}</span></td>
          <td>${lead.value_per_annum ? '$' + lead.value_per_annum.toLocaleString() : '-'}</td>
        </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p>Gold AI CRM - OG Healthcare</p>
  </div>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to generate PDF. Check your browser settings.');
    return;
  }

  try {
    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    };

    setTimeout(() => {
      if (printWindow.document.readyState === 'complete') {
        printWindow.focus();
        printWindow.print();
      }
    }, 1000);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
};
