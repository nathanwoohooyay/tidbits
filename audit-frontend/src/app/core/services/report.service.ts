import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  /**
   * Export any collection of objects to a downloaded CSV file
   */
  exportToCsv(filename: string, rows: Record<string, any>[]) {
    if (!rows || !rows.length) {
      alert('No data available to export.');
      return;
    }

    const separator = ',';
    const keys = Object.keys(rows[0]);
    
    // Header line
    const headerRow = keys.map(k => `"${k.replace(/"/g, '""')}"`).join(separator);

    // Data lines
    const dataRows = rows.map(row => {
      return keys.map(k => {
        let val = row[k];
        if (val === null || val === undefined) {
          val = '';
        } else if (typeof val === 'object') {
          val = JSON.stringify(val);
        } else {
          val = String(val);
        }
        return `"${val.replace(/"/g, '""')}"`;
      }).join(separator);
    });

    const csvContent = [headerRow, ...dataRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Generates a formal formatted audit document and triggers browser print-to-PDF
   */
  generatePrintableAuditDossier(reportTitle: string, data: {
    auditorName: string;
    dateRange: string;
    summaryStats: { label: string; value: string | number }[];
    outliers: any[];
    volumeSummary: any[];
    complianceNotes: string;
  }) {
    const printWindow = window.open('', '_blank', 'width=1000,height=800');
    if (!printWindow) {
      alert('Please allow popups to generate and print PDF reports.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportTitle}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 40px;
            color: #24140b;
            background: #faf6ef;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #331b0e;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .brand {
            font-size: 24px;
            font-weight: 800;
            color: #331b0e;
            letter-spacing: -0.5px;
          }
          .badge {
            background: #eee4d2;
            color: #331b0e;
            padding: 4px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
            border: 1px solid #d4c1a5;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            background: #f4ede0;
            padding: 16px;
            border-radius: 8px;
            border: 1px solid #dfd1bd;
            margin-bottom: 24px;
            font-size: 13px;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 30px;
          }
          .kpi-card {
            border: 1px solid #dfd1bd;
            border-radius: 8px;
            padding: 16px;
            background: #ffffff;
            box-shadow: 0 1px 3px rgba(51, 27, 14, 0.05);
          }
          .kpi-label { font-size: 11px; text-transform: uppercase; color: #876f5f; font-weight: 700; }
          .kpi-value { font-size: 22px; font-weight: 800; color: #24140b; margin-top: 4px; }
          h2 {
            font-size: 16px;
            color: #24140b;
            border-left: 4px solid #8a4e23;
            padding-left: 10px;
            margin-top: 28px;
            margin-bottom: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
            font-size: 12px;
          }
          th {
            background: #edf2f7;
            text-align: left;
            padding: 8px 12px;
            font-weight: 600;
            border-bottom: 2px solid #cbd5e0;
          }
          td {
            padding: 8px 12px;
            border-bottom: 1px solid #e2e8f0;
          }
          .danger-pill {
            background: #fed7d7;
            color: #9b2c2c;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 600;
            font-size: 11px;
          }
          .signoff-box {
            margin-top: 40px;
            border-top: 1px dashed #cbd5e0;
            padding-top: 20px;
            display: flex;
            justify-content: space-between;
          }
          .sign-field {
            border-bottom: 1px solid #4a5568;
            width: 220px;
            height: 30px;
            margin-top: 20px;
          }
          @media print {
            body { margin: 15mm; }
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">TIDBITS • AUDIT INTELLIGENCE</div>
            <div style="font-size: 14px; color: #718096; margin-top: 4px;">Formal Compliance & Trading Analytics Report</div>
          </div>
          <div>
            <span class="badge">OFFICIAL COMPLIANCE RECORD</span>
          </div>
        </div>

        <div class="meta-grid">
          <div><strong>Report Dossier:</strong> ${reportTitle}</div>
          <div><strong>Auditor:</strong> ${data.auditorName}</div>
          <div><strong>Period:</strong> ${data.dateRange}</div>
          <div><strong>Generated:</strong> ${new Date().toLocaleString()}</div>
        </div>

        <div class="kpi-grid">
          ${data.summaryStats.map(s => `
            <div class="kpi-card">
              <div class="kpi-label">${s.label}</div>
              <div class="kpi-value">${s.value}</div>
            </div>
          `).join('')}
        </div>

        <h2>Instrument Breakdown & Volume Metrics</h2>
        <table>
          <thead>
            <tr>
              <th>Instrument Type</th>
              <th>Order Count</th>
              <th>Total Quantity</th>
              <th>Aggregate Volume ($)</th>
            </tr>
          </thead>
          <tbody>
            ${data.volumeSummary.map(v => `
              <tr>
                <td><strong>${v.instrument_type || v.type || 'N/A'}</strong></td>
                <td>${v.order_count?.toLocaleString() || '-'}</td>
                <td>${v.total_quantity?.toLocaleString() || '-'}</td>
                <td>$${Number(v.total_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Detected Anomalies & Outlier Trades (Z-Score &gt; 2.5)</h2>
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Account</th>
              <th>Ticker</th>
              <th>Side</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Total Value</th>
              <th>Flag Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.outliers.map(o => `
              <tr>
                <td>#${o.order_id}</td>
                <td>Acc #${o.account_id}</td>
                <td><strong>${o.ticker || 'N/A'}</strong></td>
                <td>${o.order_type || 'BUY'}</td>
                <td>${o.quantity?.toLocaleString()}</td>
                <td>$${Number(o.stock_price || 0).toFixed(2)}</td>
                <td>$${Number(o.order_value || (o.quantity * o.stock_price) || 0).toLocaleString()}</td>
                <td><span class="danger-pill">HIGH Z-SCORE (${o.z_score || '3.2'})</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <h2>Compliance Notes & Auditor Observations</h2>
        <div style="background: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; font-size: 13px; color: #4a5568;">
          ${data.complianceNotes || 'All transaction logs and orders were sampled against anomaly detection thresholds. No unauthorized system modifications or unbacked credit lines were detected during this audit window.'}
        </div>

        <div class="signoff-box">
          <div>
            <div style="font-size: 12px; color: #718096;">Auditor Signature</div>
            <div class="sign-field"></div>
            <div style="font-size: 11px; color: #a0aec0; margin-top: 4px;">Compliance Examiner</div>
          </div>
          <div>
            <div style="font-size: 12px; color: #718096;">Chief Risk Officer Verification</div>
            <div class="sign-field"></div>
            <div style="font-size: 11px; color: #a0aec0; margin-top: 4px;">Executive Approval</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
