# CONTEXT_DASHBOARD.md — Módulo de Dashboard Operativo y Financiero (SIAFS ERP)

> **🤖 MANUAL DE CONTEXTO PARA AGENTES DE IA:**
> Este documento contiene TODA la información técnica, métricas analíticas, servicios y gráficos del módulo de **Dashboard Operativo y Financiero**.
> Consulta este archivo cuando modifiques visualizaciones, agregues KPIs, extiendas reportes financieros o actualices exportaciones CSV/Excel del Dashboard.

---

## 1. Ficha Técnica del Módulo

| Campo | Detalle |
|---|---|
| **Nombre del Módulo** | Dashboard de Control Operativo y Financiero |
| **Identificador Interno** | `dashboard` |
| **Rol en SIAFS** | Consolidar y visualizar las métricas clave de rendimiento (KPIs), ventas MTD, gastos operacionales, compras/adquisición de inventario y estado de stock en tiempo real. |
| **Ruta Backend/Servicios** | [dashboard.service.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/modules/dashboard/dashboard.service.ts) |
| **Ruta API Handlers** | `app/api/dashboard/financiero/route.ts` |
| **Ruta UI/Frontend** | [app/page.tsx](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/app/page.tsx), [FinancialDashboardView.tsx](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/components/dashboard/FinancialDashboardView.tsx), [StatCard.tsx](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/components/dashboard/StatCard.tsx), [SalesChart.tsx](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/components/dashboard/SalesChart.tsx) |
| **Estado del Módulo** | 100% Completo y Ampliado (incluye compras/ingresos en gráfico comparativo y exportaciones). |

---

## 2. Propósito y Arquitectura de Negocio

El Dashboard es la pantalla principal del ERP (`/`) y actúa como la torre de control para el dueño del negocio y gerentes:
1. **Vista Operativa (Superior):** Muestra 6 tarjetas bento grid con el estado diario y mensual de la empresa (Ventas del Mes, Cotizaciones Activas, Valor total y SKUs de Inventario, Clientes Activos, Compras del Mes y Lotes Recibidos).
2. **Vista Financiera Interactiva (Central):** Presenta el resumen consolidado de Salud Financiera: Ingresos Totales, Gastos de Caja Chica, Ganancia Neta, Margen % e Inversión Total en Compras de Mercadería.
3. **Gráfico Multiserie Recharts:** Permite comparar 4 dimensiones simultáneas (**Ingresos**, **Gastos**, **Compras Inventario**, **Ganancia Neta**) filtrables por temporalidad (**Anual**, **Trimestral**, **Mensual**, **Últimos 7 Días**).
4. **Exportación Financiera:** Exporta a CSV y Excel (`.xlsx`) el desglose por periodos del histórico financiero.

---

## 3. Consultas a la Base de Datos (Agregaciones y Descifrado)

Debido a la capa de cifrado ALE (AES-256-GCM), el `DashboardService` realiza agregaciones leyendo los registros activos descifrando importes en memoria:

```
[ Tabla ordenes ]      ──► Descifra total_cifrado (filtra COMPLETADA + VENTA + mes actual) ──► Ventas MTD
[ Tabla ingresos ]     ──► Descifra total_cifrado (filtra mes actual)                     ──► Compras MTD
[ Tabla gastos_internos]─► Descifra monto_cifrado (filtra isActive=true + fecha periodo)   ──► Gastos Totales
[ Tabla productos ]    ──► Descifra stock_cifrado y precio_venta_cifrado                 ──► Valor total stock
[ Tabla clientes ]     ──► Cuenta isActive=true                                           ──► Total Clientes
```

---

## 4. Estructura de Métricas y DTOs

Definida en [dashboard.service.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/modules/dashboard/dashboard.service.ts):

### `MetricasGeneralesResponse`
```typescript
interface MetricasGeneralesResponse {
  ventasMes: number;              // Total S/ en ventas completadas del mes
  variacionVentasMes: number;     // % vs mes anterior
  cotizacionesActivas: number;   // Cantidad de cotizaciones PENDIENTES
  variacionCotizaciones: number; 
  totalProductos: number;        // Cantidad de SKUs activos
  productosBajoStock: number;    // Cantidad con stock < umbral
  totalClientes: number;         // Total de clientes registrados activos
  nuevosClientesMes: number;     
  totalInvertidoCompras: number; // Total S/ gastado en compras de lotes este mes
  totalComprasMes: number;       // Cantidad de lotes/ingresos en el mes
  cantidadLotesMes: number;      
}
```

### `PuntoFinanciero` (Serie para Recharts)
```typescript
interface PuntoFinanciero {
  periodo: string;  // Ej. "Ene 2026", "Semana 1", "Q1"
  ingresos: number; // S/ Ventas completadas
  gastos: number;   // S/ Gastos caja chica
  compras: number;  // S/ Compras de inventario (ingresos)
  ganancia: number; // S/ (Ingresos - Gastos - Compras)
}
```

---

## 5. Endpoints de la API

### GET `/api/dashboard/financiero`
- **Query Params:** `periodo=anual | trimestral | mensual | 7dias`
- **Proceso:**
  1. Extrae las órdenes `COMPLETADA` del tipo `VENTA`.
  2. Extrae los gastos internos `isActive=true`.
  3. Extrae los lotes de reposición `Ingreso`.
  4. Agrupa por buckets temporales según el parámetro `periodo`.
  5. Retorna las métricas globales + la lista de `PuntosFinancieros`.
- **Respuesta `200 OK`:**
  ```json
  {
    "resumen": {
      "ingresosTotales": 45200.00,
      "gastosTotales": 3400.00,
      "comprasTotales": 18500.00,
      "gananciaNeta": 23300.00,
      "margenGanancia": 51.55
    },
    "historico": [
      { "periodo": "Ene", "ingresos": 15000, "gastos": 1200, "compras": 6000, "ganancia": 7800 },
      { "periodo": "Feb", "ingresos": 30200, "gastos": 2200, "compras": 12500, "ganancia": 15500 }
    ]
  }
  ```

---

## 6. Componentes de UI / UX (Frontend)

1. **[app/page.tsx](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/app/page.tsx)**:
   - Server Component principal. Carga datos operativos iniciales y renderiza las 6 StatCards en grid `xl:grid-cols-3`.
2. **[StatCard.tsx](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/components/dashboard/StatCard.tsx)**:
   - Tarjeta estilizada bento grid con ícono Lucide, cifra destacada en fuente `font-label` (JetBrains Mono) y pill de tendencia (+% en verde, -% en rojo).
3. **[FinancialDashboardView.tsx](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/components/dashboard/FinancialDashboardView.tsx)**:
   - Componente cliente interactivo.
   - 5 Cards resumen: Ingresos (verde), Gastos (rojo), Compras (violeta), Ganancia Neta (azul) y Margen % (amarillo).
   - Selector de periodo en tiempo real (`anual`, `trimestral`, `mensual`, `7dias`).
   - Gráfico dinámico Recharts con Tooltip personalizado descifrado.
   - Botones de exportación rápida: **Exportar CSV** y **Exportar Excel** (`.xlsx`).

---

## 7. Tareas Ocultas & Reglas de Negocio Especiales

- **Cálculo de Ganancia Real:**
  $$\text{Ganancia Neta} = \text{Ingresos por Ventas} - (\text{Gastos Internos} + \text{Inversión en Compras})$$
  *(La inversión en compras se contabiliza en el mes de adquisición del lote para reflejar la salida de caja real).*
- **Inclusión de la 5ª Métrica (Compras del Mes):**
  Agregada tras la sesión de revisión con el cliente (2026-07-30) para visibilizar el capital invertido en mercadería.
- **Exportación con UTF-8 BOM:**
  La exportación CSV utiliza el prefijo `\uFEFF` para asegurar que Microsoft Excel en español abra los símbolos de moneda `S/` y tildes sin corrupción de caracteres.

---

## 8. Matriz de Relación con otros Módulos

```
                               ┌───────────────────┐
                               │ Módulo DASHBOARD  │
                               └─────────▲─────────┘
                                         │
       ┌──────────────────┬──────────────┼──────────────┬──────────────────┐
       │                  │              │              │                  │
┌──────┴───────┐   ┌──────┴──────┐ ┌─────┴──────┐ ┌─────┴──────┐   ┌───────┴──────┐
│  Inventario  │   │   Ventas    │ │  Compras   │ │   Gastos   │   │   Clientes   │
│ (Total SKUs  │   │  (Ingresos, │ │ (Inversión │ │ (Egresos   │   │  (Contador   │
│ y bajo stock)│   │ Ventas MTD) │ │  en Lotes) │ │ Caja Chica)│   │  de Activos) │
└──────────────┘   └─────────────┘ └────────────┘ └────────────┘   └──────────────┘
```

---

## 9. Pruebas Unitarias y Cobertura

- Test asociado: `__tests__/finanzas.test.ts` / `__tests__/dashboard.test.ts`
- Verificaciones:
  - Agregación correcta de totales con descifrado en memoria.
  - Comprobación de retorno de 0 en caso de periodos sin datos sin arrojar excepciones de división entre cero en el margen.

---

## 10. Guía de Modificación para Agentes de IA

1. Si agregas una nueva categoría de flujo de caja (ejemplo: Pagos de Nómina o Impuestos), debes modificar `PuntoFinanciero` en `dashboard.service.ts` y añadir la nueva serie de barras/línea en `FinancialDashboardView.tsx`.
2. Mantén los colores corporativos en el gráfico:
   - Ingresos: `#10B981` (Esmeralda/Verde)
   - Gastos: `#EF4444` (Rojo corporativo)
   - Compras Inventario: `#8B5CF6` (Violeta)
   - Ganancia Neta: `#3B82F6` (Azul)
3. Al modificar `obtenerMetricasGenerales()`, asegúrate de mantener el filtro `isActive: true` en las consultas de Prisma.
