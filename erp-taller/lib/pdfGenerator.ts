import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ItemCotizacion {
    productoNombre: string;
    cantidad: number | string;
    precioUnitario: number | string;
    subtotal: number | string;
}

interface DatosCotizacion {
    tipo: 'COTIZACION' | 'VENTA';
    numeroOrden: string | number;
    clienteNombre: string;
    clienteDocumento?: string;
    clienteTelefono?: string;
    clienteDireccion?: string;
    fecha: string | Date;
    detalles: ItemCotizacion[];
    total: number | string;
}

/**
 * Función auxiliar para cargar el logotipo desde la carpeta public en formato base64 Data URL.
 */
async function getLogoBase64(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = '/LOGO.png';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(null);
                    return;
                }
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } catch {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
    });
}

/**
 * Genera y descarga el PDF oficial de Cotización / Nota de Pedido con la paleta de colores corporativa.
 */
export async function generarCotizacionPDF(datos: DatosCotizacion) {
    // Inicializar documento A4 en orientación vertical
    const doc = new jsPDF('p', 'mm', 'a4');

    // Paleta de colores corporativa (Design System SIAFS)
    const colorPrimario: [number, number, number] = [219, 5, 43];   // #DB052B (Rojo Corporativo)
    const colorSecundario: [number, number, number] = [26, 26, 26];  // #1A1A1A (Negro / Gris Oscuro)
    const colorGris: [number, number, number] = [116, 116, 116];    // #747474 (Gris Terciario)
    const colorFondoSuave: [number, number, number] = [248, 249, 250]; // #F8F9FA

    // Formateador de moneda
    const fmtCurrency = (val: number | string) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(num || 0);
    };

    // Intentar cargar logo corporativo
    const logoBase64 = await getLogoBase64();
    let textXOffset = 15;

    if (logoBase64) {
        try {
            doc.addImage(logoBase64, 'PNG', 15, 12, 22, 22);
            textXOffset = 42;
        } catch {
            textXOffset = 15;
        }
    }

    // --- ENCABEZADO DE LA EMPRESA ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text('A&F SAMFOR', textXOffset, 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    doc.text('Tienda de Autopartes y Motores', textXOffset, 26);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
    doc.text('Calle Espinar 311', textXOffset, 31);

    // --- RECUADRO SUPERIOR DERECHO (TITULO Y NUMERO DE DOCUMENTO) ---
    doc.setDrawColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.setLineWidth(0.8);
    doc.roundedRect(132, 12, 63, 24, 3, 3);

    const esVenta = datos.tipo === 'VENTA';
    const tituloDoc = esVenta ? 'NOTA DE PEDIDO' : 'COTIZACIÓN';

    doc.setFillColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.roundedRect(132, 12, 63, 8, 3, 3, 'F');
    // Corregir esquina inferior del header del recuadro
    doc.rect(132, 17, 63, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(tituloDoc, 163.5, 17.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text(`N° ${String(datos.numeroOrden).padStart(5, '0')}`, 163.5, 26, { align: 'center' });

    // Fecha de emisión
    let fechaTexto = '';
    if (datos.fecha instanceof Date) {
        fechaTexto = datos.fecha.toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
    } else {
        const d = new Date(datos.fecha);
        fechaTexto = isNaN(d.getTime()) ? String(datos.fecha) : d.toLocaleDateString('es-PE', { timeZone: 'America/Lima' });
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    doc.text(`Fecha: ${fechaTexto}`, 163.5, 32, { align: 'center' });

    // Línea divisoria corporativa
    doc.setDrawColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.setLineWidth(0.5);
    doc.line(15, 40, 195, 40);

    // --- RECUADRO INFORMACIÓN DEL CLIENTE ---
    doc.setFillColor(colorFondoSuave[0], colorFondoSuave[1], colorFondoSuave[2]);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(15, 44, 180, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text('DATOS DEL CLIENTE:', 20, 51);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    doc.text('Nombre / Razón Social:', 20, 57);
    doc.setFont('helvetica', 'normal');
    doc.text(datos.clienteNombre || 'Cliente Contado', 60, 57);

    if (datos.clienteDocumento) {
        doc.setFont('helvetica', 'bold');
        doc.text('DNI / RUC:', 20, 62);
        doc.setFont('helvetica', 'normal');
        doc.text(datos.clienteDocumento, 60, 62);
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Dirección del Negocio:', 120, 51);
    doc.setFont('helvetica', 'normal');
    doc.text('Calle Espinar 311', 120, 57);

    // --- TABLA DE DETALLES DE PRODUCTOS ---
    const columnas = ['N°', 'Descripción del Producto', 'Cant.', 'P. Unit (S/)', 'Subtotal (S/)'];

    const filas = datos.detalles.map((item, idx) => [
        (idx + 1).toString(),
        item.productoNombre,
        item.cantidad.toString(),
        fmtCurrency(item.precioUnitario),
        fmtCurrency(item.subtotal)
    ]);

    autoTable(doc, {
        startY: 71,
        head: [columnas],
        body: filas,
        theme: 'grid',
        headStyles: {
            fillColor: colorPrimario,
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { halign: 'left' },
            2: { halign: 'center', cellWidth: 20 },
            3: { halign: 'right', cellWidth: 32 },
            4: { halign: 'right', cellWidth: 35 },
        },
        styles: {
            font: 'helvetica',
            fontSize: 8.5,
            cellPadding: 3.5,
            lineColor: [226, 232, 240],
            lineWidth: 0.1,
            textColor: colorSecundario
        },
        alternateRowStyles: {
            fillColor: colorFondoSuave
        }
    });

    // --- TOTALES Y NOTAS ---
    const finalY = (doc as any).lastAutoTable.finalY + 8;
    const totalNum = typeof datos.total === 'string' ? parseFloat(datos.total) : datos.total;

    // Recuadro de Total
    doc.setFillColor(colorFondoSuave[0], colorFondoSuave[1], colorFondoSuave[2]);
    doc.setDrawColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.setLineWidth(0.4);
    doc.roundedRect(125, finalY, 70, 22, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    doc.text('TOTAL GENERAL:', 130, finalY + 13);

    doc.setFontSize(14);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text(fmtCurrency(totalNum), 190, finalY + 13, { align: 'right' });

    // Observaciones y condiciones (a la izquierda)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    doc.text('Condiciones y Observaciones:', 15, finalY + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
    doc.text('• Los precios incluyen IGV.', 15, finalY + 10);
    doc.text('• Dirección de atención: Calle Espinar 311.', 15, finalY + 14);
    if (!esVenta) {
        doc.text('• Cotización válida por 7 días calendario a partir de su emisión.', 15, finalY + 18);
    } else {
        doc.text('• Documento nota de pedido generado desde A&F Samfor - SIAFS.', 15, finalY + 18);
    }

    // --- PIE DE PÁGINA FIX ---
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(226, 232, 240);
    doc.line(15, pageHeight - 18, 195, pageHeight - 18);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(colorGris[0], colorGris[1], colorGris[2]);

    if (esVenta) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
        doc.text('Este documento es una nota de pedido interna para el cliente.', 105, pageHeight - 13, { align: 'center' });
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(colorGris[0], colorGris[1], colorGris[2]);
    }
    doc.text('Este documento no es válido para efectos tributarios, exija su boleta o factura', 105, pageHeight - 13, { align: 'center' });
    doc.text('A&F SAMFOR - SIAFS', 105, pageHeight - 8, { align: 'center' });

    // Descargar archivo PDF
    const prefijo = esVenta ? 'NotaPedido' : 'Cotizacion';
    doc.save(`${prefijo}_N${String(datos.numeroOrden).padStart(5, '0')}.pdf`);
}
