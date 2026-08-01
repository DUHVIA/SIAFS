/**
 * Utilidad centralizada de formateo e instanciación de fechas para el sistema SIAFS.
 * Elimina cualquier desfasaje de zona horaria UTC (-1 día) al trabajar con entradas <input type="date">.
 */

/**
 * Formatea una fecha (string ISO o Date) a "DD/MM/YYYY" de forma segura sin desfasaje por zona horaria.
 */
export function formatFechaDisplay(fechaInput: string | Date | null | undefined): string {
    if (!fechaInput) return '';
    const str = typeof fechaInput === 'string' ? fechaInput : fechaInput.toISOString();
    const datePart = str.includes('T') ? str.split('T')[0] : str.slice(0, 10);
    const parts = datePart.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
        const [yyyy, mm, dd] = parts;
        return `${dd}/${mm}/${yyyy}`;
    }
    return new Date(fechaInput).toLocaleDateString('es-PE');
}

/**
 * Extrae la fecha en formato "YYYY-MM-DD" para asignar directamente al campo <input type="date">.
 */
export function toInputDate(fechaInput: string | Date | null | undefined): string {
    if (!fechaInput) return '';
    if (fechaInput instanceof Date) {
        const yyyy = fechaInput.getFullYear();
        const mm = String(fechaInput.getMonth() + 1).padStart(2, '0');
        const dd = String(fechaInput.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    const str = String(fechaInput);
    return str.includes('T') ? str.split('T')[0] : str.slice(0, 10);
}

/**
 * Convierte un valor de <input type="date"> ("YYYY-MM-DD") a una cadena ISO fija a mediodía (12:00:00Z)
 * para evitar que sea interpretada como 00:00:00 UTC y retroceda un día al convertir a hora local.
 */
export function toFixedISOString(dateString: string): string {
    if (!dateString) return new Date().toISOString();
    const datePart = dateString.includes('T') ? dateString.split('T')[0] : dateString.slice(0, 10);
    return `${datePart}T12:00:00.000Z`;
}
