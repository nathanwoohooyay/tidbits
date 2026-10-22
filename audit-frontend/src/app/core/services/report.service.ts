import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  exportToCsv(filename: string, rows: Record<string, any>[]) {
    if (!rows || !rows.length) {
      alert('No data available to export.');
      return;
    }

    const keys = Object.keys(rows[0]);
    const headerRow = keys.map(key => `"${key.replace(/"/g, '""')}"`).join(',');
    const dataRows = rows.map(row => keys.map(key => {
      let value = row[key];
      if (value === null || value === undefined) {
        value = '';
      } else if (typeof value === 'object') {
        value = JSON.stringify(value);
      } else {
        value = String(value);
      }
      return `"${value.replace(/"/g, '""')}"`;
    }).join(','));

    const blob = new Blob([[headerRow, ...dataRows].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
