import * as XLSX from 'xlsx';

/**
 * Utilidad para generar y descargar la plantilla Excel oficial de migración/importación de inventario.
 * Proporciona a los clientes una estructura clara y estandarizada con datos de ejemplo, incluyendo el precio de compra.
 */
export function downloadInventoryTemplate() {
  if (typeof window === 'undefined') return;

  const headers = [
    'Nombre del Producto',
    'SKU / Codigo',
    'Categoría',
    'Tipo de Autoparte',
    'Precio Compra (S/)',
    'Precio Venta (S/)',
    'Stock Inicial',
    'Descripción / Detalles'
  ];

  const sampleRows = [
    [
      'Motor Hyundai G4FC 1.6L Complete',
      'MTR-HND-001',
      'MOTOR',
      'Motor',
      3200.00,
      4500.00,
      3,
      'Motor a gasolina completo, importación Japón, 1.6L para Hyundai Elantra / Kia Cerato'
    ],
    [
      'Pastillas de Freno Cerámicas Delanteras',
      'PST-FRN-001',
      'AUTOPARTE',
      'Frenos',
      95.00,
      155.00,
      25,
      'Juego de pastillas de freno alto rendimiento compatibles con Toyota Yaris 2015-2022'
    ],
    [
      'Filtro de Aceite Sintético de Alto Flujo',
      'FLT-ACE-001',
      'AUTOPARTE',
      'Filtros',
      22.00,
      38.50,
      60,
      'Filtro de aceite premium de múltiples capas para motores 1.6 a 2.0L'
    ],
    [
      'Amortiguador Hidráulico Trasero',
      'AMR-HID-001',
      'AUTOPARTE',
      'Suspensión',
      130.00,
      210.00,
      12,
      'Amortiguador posterior reforzado para Nissan Versa / Sentra'
    ]
  ];

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Anchos sugeridos para las columnas
  worksheet['!cols'] = [
    { wch: 40 }, // Nombre del Producto
    { wch: 15 }, // Categoría
    { wch: 20 }, // SKU / Codigo
    { wch: 20 }, // Tipo de Autoparte
    { wch: 18 }, // Precio Compra
    { wch: 18 }, // Precio Venta
    { wch: 15 }, // Stock Inicial
    { wch: 60 }  // Descripción
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla Inventario');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Plantilla_Importacion_Inventario_SIAFS.xlsx');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
