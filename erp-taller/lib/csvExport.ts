/**
 * Utilidad reutilizable para exportación de datos a formato CSV (con BOM UTF-8)
 * compatible con Microsoft Excel y hojas de cálculo.
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  if (typeof window === 'undefined') return;

  const escapeCSV = (val: string | number) => {
    const stringVal = String(val ?? '');
    if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
      return `"${stringVal.replace(/"/g, '""')}"`;
    }
    return stringVal;
  };

  const headerRow = headers.map(escapeCSV).join(',');
  const dataRows = rows.map(row => row.map(escapeCSV).join(',')).join('\n');
  const csvContent = `${headerRow}\n${dataRows}`;

  // BOM UTF-8 for Excel support
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
