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
    fecha: string | Date;
    detalles: ItemCotizacion[];
    total: number | string;
}

export function generarCotizacionPDF(datos: DatosCotizacion) {
    // Inicializar documento A4 en orientación vertical
    const doc = new jsPDF('p', 'mm', 'a4');

    // Configuración de colores corporativos
    const colorPrimario: [number, number, number] = [15, 23, 42]; // slate-900
    const colorSecundario: [number, number, number] = [71, 85, 105]; // slate-600
    const colorAcento: [number, number, number] = [37, 99, 235]; // blue-600

    // Función auxiliar para formatear moneda
    const fmtCurrency = (val: number | string) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(num);
    };

    // --- CABECERA ---
    // Nombre de la empresa
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text('A&F SAMFOR', 15, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    doc.text('Tienda de autopartes y motores', 15, 32);

    // Recuadro de Cotización (esquina superior derecha)
    doc.setDrawColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(135, 15, 60, 20, 2, 2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    const titulo = datos.tipo === 'VENTA' ? 'NOTA DE PEDIDO' : 'COTIZACIÓN';
    doc.text(titulo, 165, 23, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(colorAcento[0], colorAcento[1], colorAcento[2]);
    doc.text(`N° ${String(datos.numeroOrden).padStart(4, '0')}`, 165, 30, { align: 'center' });

    // Línea separadora
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.line(15, 40, 195, 40);

    // --- DATOS DEL CLIENTE Y FECHA ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text('Emitido a:', 15, 50);

    doc.setFont('helvetica', 'normal');
    doc.text(`Cliente: ${datos.clienteNombre}`, 15, 56);
    if (datos.clienteDocumento) {
        doc.text(`Documento: ${datos.clienteDocumento}`, 15, 62);
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Fecha de emisión:', 135, 50);
    doc.setFont('helvetica', 'normal');
    
    let fechaTexto = '';
    if (datos.fecha instanceof Date) {
        fechaTexto = datos.fecha.toLocaleDateString('es-PE');
    } else {
        const d = new Date(datos.fecha);
        fechaTexto = isNaN(d.getTime()) ? String(datos.fecha) : d.toLocaleDateString('es-PE');
    }
    
    doc.text(fechaTexto, 135, 56);

    // --- TABLA DE PRODUCTOS ---
    const columnas = ['Item', 'Descripción', 'Cantidad', 'Precio Unit.', 'Subtotal'];
    
    const filas = datos.detalles.map((item, index) => [
        (index + 1).toString(),
        item.productoNombre,
        item.cantidad.toString(),
        fmtCurrency(item.precioUnitario),
        fmtCurrency(item.subtotal)
    ]);

    // Usando autoTable de forma correcta
    autoTable(doc, {
        startY: 75,
        head: [columnas],
        body: filas,
        theme: 'grid',
        headStyles: {
            fillColor: colorPrimario,
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { halign: 'center', cellWidth: 15 },
            1: { halign: 'left' },
            2: { halign: 'center', cellWidth: 25 },
            3: { halign: 'right', cellWidth: 35 },
            4: { halign: 'right', cellWidth: 35 },
        },
        styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 4,
            lineColor: [226, 232, 240],
            lineWidth: 0.1
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252] // slate-50
        }
    });

    // --- TOTALES ---
    // Posicionarse debajo de la tabla
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(125, finalY, 70, 25, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(colorPrimario[0], colorPrimario[1], colorPrimario[2]);
    doc.text('TOTAL:', 130, finalY + 15);

    doc.setFontSize(16);
    doc.setTextColor(colorAcento[0], colorAcento[1], colorAcento[2]);
    doc.text(fmtCurrency(datos.total), 190, finalY + 15, { align: 'right' });

    // --- PIE DE PÁGINA ---
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    
    if (datos.tipo === 'VENTA') {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38); // red-600
        doc.text('Este documento no es válido para efectos tributarios, exija su boleta o factura', 105, pageHeight - 20, { align: 'center' });
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(colorSecundario[0], colorSecundario[1], colorSecundario[2]);
    }
    
    doc.text('Documento generado automáticamente por A&F Samfor - SIAFS', 105, pageHeight - 15, { align: 'center' });
    doc.text('Los precios incluyen IGV y están sujetos a cambios sin previo aviso.', 105, pageHeight - 10, { align: 'center' });

    // Guardar el PDF
    const prefijo = datos.tipo === 'VENTA' ? 'NotaPedido' : 'Cotizacion';
    doc.save(`${prefijo}_N${String(datos.numeroOrden).padStart(4, '0')}.pdf`);
}
