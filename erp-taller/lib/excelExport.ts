import * as XLSX from 'xlsx';

/**
 * Utilidad reutilizable para exportación de datos a formato Excel (.xlsx)
 * compatible con Microsoft Excel, Google Sheets y LibreOffice.
 */
export function exportToExcel(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
  sheetName: string = 'Reporte'
) {
  if (typeof window === 'undefined') return;

  const data = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Configurar ancho de columnas automático para mejor lectura
  const colWidths = headers.map((h, colIdx) => {
    let maxLen = String(h).length;
    rows.forEach(row => {
      const cellLen = String(row[colIdx] ?? '').length;
      if (cellLen > maxLen) maxLen = cellLen;
    });
    return { wch: Math.min(Math.max(maxLen + 3, 12), 40) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
