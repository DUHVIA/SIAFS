"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Download, FileSpreadsheet, BarChart2, List, Loader2 } from "lucide-react";
import { exportToCSV } from "@/lib/csvExport";
import { exportToExcel } from "@/lib/excelExport";
import { useToast } from "@/components/providers/ToastProvider";

interface ExportarIngresosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TipoReporte = "resumen" | "detalle";

const getTodayLocal = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getFirstDayOfMonth = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
};

export function ExportarIngresosModal({ isOpen, onClose }: ExportarIngresosModalProps) {
  const toast = useToast();

  const [fechaInicio, setFechaInicio] = useState(getFirstDayOfMonth());
  const [fechaFin, setFechaFin] = useState(getTodayLocal());
  const [tipoReporte, setTipoReporte] = useState<TipoReporte>("resumen");
  const [loading, setLoading] = useState(false);

  const handleExport = async (formato: "csv" | "excel") => {
    if (!fechaInicio || !fechaFin) {
      toast.error("Selecciona un rango de fechas valido");
      return;
    }
    if (new Date(fechaInicio) > new Date(fechaFin)) {
      toast.error("La fecha de inicio no puede ser mayor a la fecha de fin");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", limit: "9999" });
      const res = await fetch(`/api/ingresos?${params.toString()}`);
      if (!res.ok) throw new Error("Error al obtener ingresos");

      const data = await res.json();
      const todos: any[] = data.items || [];

      const inicio = new Date(fechaInicio + "T00:00:00");
      const fin = new Date(fechaFin + "T23:59:59");

      const filtrados = todos.filter((ing) => {
        const fechaRef = new Date(ing.fechaIngreso || ing.createdAt);
        return fechaRef >= inicio && fechaRef <= fin;
      });

      if (filtrados.length === 0) {
        toast.error("No hay ingresos en el rango de fechas seleccionado");
        setLoading(false);
        return;
      }

      const nombreArchivo = `Compras_${fechaInicio}_${fechaFin}`;

      if (tipoReporte === "resumen") {
        const headers = ["ID Lote", "Fecha", "Registrado Por", "Notas / Proveedor", "Items", "Total (S/)"];
        const rows = filtrados.map((ing) => [
          ing.id.substring(0, 8) + "...",
          new Date(ing.fechaIngreso).toLocaleDateString("es-PE"),
          ing.usuarioNombre || "Sistema",
          ing.descripcion || "Sin notas",
          ing.cantidadItems || 0,
          parseFloat(ing.total || "0").toFixed(2),
        ]);
        if (formato === "csv") {
          exportToCSV(`${nombreArchivo}_resumen.csv`, headers, rows);
        } else {
          exportToExcel(`${nombreArchivo}_resumen.xlsx`, headers, rows, "Lotes Compra");
        }
      } else {
        const headersDetalle = [
          "ID Lote", "Fecha", "Registrado Por", "Notas / Proveedor",
          "Producto", "SKU", "Cantidad", "Costo Unitario (S/)", "Subtotal (S/)",
        ];
        const rowsDetalle: (string | number)[][] = [];

        for (const ingreso of filtrados) {
          let detalles = ingreso.detalles || [];
          if (!detalles.length) {
            try {
              const dr = await fetch(`/api/ingresos/${ingreso.id}`);
              if (dr.ok) {
                const dData = await dr.json();
                detalles = dData.detalles || [];
              }
            } catch { /* skip */ }
          }

          if (detalles.length === 0) {
            rowsDetalle.push([
              ingreso.id.substring(0, 8) + "...",
              new Date(ingreso.fechaIngreso).toLocaleDateString("es-PE"),
              ingreso.usuarioNombre || "Sistema",
              ingreso.descripcion || "Sin notas",
              "", "", "", "", "",
            ]);
          } else {
            for (const det of detalles) {
              const nombre = det.productoNombre || det.nombre || "";
              const sku = det.sku || det.producto?.detalles?.sku || "N/A";
              const cantidad = parseFloat(det.cantidad || "0");
              const costoUnit = parseFloat(det.costoUnitario || "0");
              rowsDetalle.push([
                ingreso.id.substring(0, 8) + "...",
                new Date(ingreso.fechaIngreso).toLocaleDateString("es-PE", { timeZone: "America/Lima" }),
                ingreso.usuarioNombre || "Sistema",
                ingreso.descripcion || "Sin notas",
                nombre,
                sku,
                cantidad,
                costoUnit.toFixed(2),
                (cantidad * costoUnit).toFixed(2),
              ]);
            }
          }
        }

        if (formato === "csv") {
          exportToCSV(`${nombreArchivo}_detalle.csv`, headersDetalle, rowsDetalle);
        } else {
          exportToExcel(`${nombreArchivo}_detalle.xlsx`, headersDetalle, rowsDetalle, "Detalle Items");
        }
      }

      toast.success("Exportacion generada exitosamente");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Error al generar la exportacion");
    } finally {
      setLoading(false);
    }
  };

  const inputDateClass =
    "w-full rounded-2xl border border-white/30 bg-white/60 backdrop-blur-sm px-4 py-2.5 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-primary/40 transition";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Exportar Compras" maxWidth="md">
      <div className="flex flex-col gap-5">
        {/* Rango de fechas */}
        <div>
          <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">
            Rango de Fechas
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-tertiary mb-1 font-medium">Fecha Inicio</p>
              <input
                id="export-ingresos-fecha-inicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                max={fechaFin}
                className={inputDateClass}
              />
            </div>
            <div>
              <p className="text-[10px] text-tertiary mb-1 font-medium">Fecha Fin</p>
              <input
                id="export-ingresos-fecha-fin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                min={fechaInicio}
                max={getTodayLocal()}
                className={inputDateClass}
              />
            </div>
          </div>
        </div>

        {/* Tipo de reporte */}
        <div>
          <label className="block text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">
            Tipo de Reporte
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTipoReporte("resumen")}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                tipoReporte === "resumen"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-white/30 bg-white/40 hover:border-primary/30"
              }`}
            >
              <BarChart2 className={`w-5 h-5 ${tipoReporte === "resumen" ? "text-primary" : "text-tertiary"}`} />
              <div className="text-center">
                <p className={`font-bold text-xs ${tipoReporte === "resumen" ? "text-primary" : "text-secondary"}`}>
                  Resumen de Lotes
                </p>
                <p className="text-[10px] text-tertiary mt-0.5">Una fila por lote</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setTipoReporte("detalle")}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                tipoReporte === "detalle"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-white/30 bg-white/40 hover:border-primary/30"
              }`}
            >
              <List className={`w-5 h-5 ${tipoReporte === "detalle" ? "text-primary" : "text-tertiary"}`} />
              <div className="text-center">
                <p className={`font-bold text-xs ${tipoReporte === "detalle" ? "text-primary" : "text-secondary"}`}>
                  Desglose de Items
                </p>
                <p className="text-[10px] text-tertiary mt-0.5">Producto, SKU, cantidad, costo</p>
              </div>
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 bg-blue-50/60 border border-blue-200/40 rounded-2xl text-xs text-blue-700">
          <p className="font-semibold mb-1">
            {tipoReporte === "resumen" ? "Resumen de Lotes" : "Desglose de Items Adquiridos"}
          </p>
          <p className="text-blue-600">
            {tipoReporte === "resumen"
              ? "Incluye: ID Lote, Fecha, Registrado Por, Notas, Items y Total."
              : "Incluye: ID Lote, Fecha, Notas, Producto, SKU, Cantidad, Costo Unitario y Subtotal."}
          </p>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            icon={loading ? Loader2 : Download}
            onClick={() => handleExport("csv")}
            disabled={loading}
            className="w-full justify-center"
          >
            {loading ? "Exportando..." : "Exportar CSV"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            icon={loading ? Loader2 : FileSpreadsheet}
            onClick={() => handleExport("excel")}
            disabled={loading}
            className="w-full justify-center text-emerald-700 hover:text-emerald-800"
          >
            {loading ? "Exportando..." : "Exportar Excel (.xlsx)"}
          </Button>
        </div>

        <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="w-full">
          Cancelar
        </Button>
      </div>
    </Modal>
  );
}
