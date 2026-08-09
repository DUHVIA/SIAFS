# CONTEXT_VENTAS_Y_ORDENES.md — Módulo de Ventas, Cotizaciones, Proformas y Documentos (SIAFS ERP)

> **🤖 MANUAL DE CONTEXTO PARA AGENTES DE IA:**
> Este documento contiene TODA la información técnica, reglas de negocio, esquemas de datos, APIs y generadores PDF del módulo de **Ventas, Cotizaciones, Métodos de Pago y Proformas**.
> Consulta este archivo al modificar el flujo de ventas, emisión de cotizaciones, conversión de proformas a ventas, snapshots de precios o descarga de PDFs.

---

## 1. Ficha Técnica del Módulo

| Campo | Detalle |
|---|---|
| **Nombre del Módulo** | Ventas, Cotizaciones, Proformas y Emisión de Documentos |
| **Identificador Interno** | `ordenes` / `metodos-pago` |
| **Rol en SIAFS** | Gestionar el ciclo de vida comercial completo (creación de proformas/cotizaciones, conversión a venta cerrada, emisión de comprobantes internos PDF, cálculo de ganancias estimadas y descuento de stock). |
| **Ruta Backend/Servicios** | [orden.service.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/modules/ordenes/orden.service.ts), [pdfGenerator.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/lib/pdfGenerator.ts) |
| **Ruta API Handlers** | `app/api/ordenes/route.ts`, `app/api/ordenes/[id]/route.ts`, `app/api/metodos-pago/route.ts` |
| **Ruta UI/Frontend** | `app/ordenes/page.tsx`, `components/views/ordenes/OrdenesView.tsx`, `CrearOrdenModal.tsx`, `VerOrdenModal.tsx` |
| **Estado del Módulo** | 100% Completo y Aprobado (incluye cotizaciones flexibles con stock 0, ganancias proyectadas y formato oficial PDF A8F Samfor). |

---

## 2. Propósito y Arquitectura de Negocio

El módulo de Ventas u Órdenes unifica dos flujos comerciales clave:
1. **Flujo de Cotizaciones (Proformas):**
   - Permite cotizar repuestos o motores a clientes (incluso si tienen stock 0).
   - Genera proformas oficiales en formato PDF con vigencia configurable.
   - Permite editar la cotización en estado `PENDIENTE`.
   - Puede ser **Convertida a Venta** en cualquier momento, momento en el cual el sistema valida la disponibilidad real de stock.
2. **Flujo de Ventas Directas:**
   - Registra ventas cerradas con selección de Método de Pago (Efectivo, Yape, Plin, Transferencia, Cuotas).
   - Realiza el descuento de stock inmediato y registra el movimiento `SALIDA` en Kardex.
   - Si la venta se anula, restaura automáticamente el stock al inventario y registra un movimiento en Kardex.
3. **Snapshots de Precios e Información:**
   - Los nombres de productos y precios unitarios en cada línea se **congelan** (`precio_unitario_congelado_cifrado`), garantizando que futuros cambios de precio en el inventario no alteren las ventas pasadas.

---

## 3. Modelo de Base de Datos (Prisma Schema)

Definido en [schema.prisma](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/prisma/schema.prisma):

```prisma
enum TipoOrden {
  COTIZACION
  VENTA
}

enum EstadoOrden {
  PENDIENTE
  COMPLETADA
  ANULADA
}

model MetodoPago {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  nombre      String   @unique @db.VarChar(50)
  isActive    Boolean  @default(true) @map("is_active")
  ordenes     Orden[]
  @@map("metodos_pago")
}

model Orden {
  id              String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  numeroOrden     Int          @default(autoincrement()) @map("numero_orden") // ID legible #1, #2, #3
  tipo            TipoOrden
  estado          EstadoOrden  @default(PENDIENTE)
  clienteId       String       @map("cliente_id") @db.Uuid
  usuarioId       String       @map("usuario_id") @db.Uuid
  metodoPagoId    String?      @map("metodo_pago_id") @db.Uuid 
  
  subtotalCifrado String       @map("subtotal_cifrado") @db.Text
  totalCifrado    String       @map("total_cifrado") @db.Text
  fechaValidez    DateTime?    @map("fecha_validez") 
  fechaOrden      DateTime     @default(now()) @map("fecha_orden")  // Fecha real de la transacción (configurable)
  createdAt       DateTime     @default(now()) @map("created_at")

  cliente         Cliente      @relation(fields: [clienteId], references: [id])
  usuario         Usuario      @relation(fields: [usuarioId], references: [id])
  metodoPago      MetodoPago?  @relation(fields: [metodoPagoId], references: [id])
  detalles        DetalleOrden[]

  @@map("ordenes")
}

model DetalleOrden {
  id                            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  ordenId                       String   @map("orden_id") @db.Uuid
  productoId                    String?  @map("producto_id") @db.Uuid
  
  productoNombreCifrado                String   @map("producto_nombre_cifrado") @db.Text 
  precioUnitarioCongeladoCifrado       String   @map("precio_unitario_congelado_cifrado") @db.Text
  costoUnitarioCongeladoCifrado        String?  @map("costo_unitario_congelado_cifrado") @db.Text  // Costo congelado al momento de la venta
  cantidadCifrada               String   @map("cantidad_cifrada") @db.Text
  subtotalCifrado               String   @map("subtotal_cifrado") @db.Text

  orden      Orden      @relation(fields: [ordenId], references: [id], onDelete: Cascade)
  producto   Producto?  @relation(fields: [productoId], references: [id])

  @@map("detalle_ordenes")
}
```

---

## 4. Endpoints de la API

### GET `/api/ordenes`
- **Permiso RBAC:** `VER_ORDENES`
- **Query Params:** `tipo`, `estado`, `search`, `clienteId`, `page`, `limit`
- **Proceso:** Descifra en memoria y retorna las órdenes junto con el resumen de métricas (Ventas MTD, Cotizaciones Activas, Tasa de Conversión %, Ticket Promedio).

### POST `/api/ordenes`
- **Permiso RBAC:** `VER_ORDENES` (o `CREAR_VENTA`)
- **Payload:**
  ```json
  {
    "tipo": "VENTA",
    "clienteId": "uuid-cliente",
    "metodoPagoId": "uuid-metodo",
    "fecha": "2026-08-07",
    "detalles": [
      {
        "productoId": "uuid-prod",
        "cantidad": 2,
        "precioUnitario": 150.00
      }
    ]
  }
  ```
- **Lógica Transaccional:**
  - Parsea `fecha` usando hora local (`new Date(year, month - 1, day, 12, 0, 0)`) y la guarda en `fechaOrden`.
  - Congela `costoUnitarioCongeladoCifrado` de `Producto.precioCompraCifrado` en cada `DetalleOrden`.
  - Si es `VENTA`: Valida stock, descuenta stock de `Producto` y crea registro Kardex `SALIDA`.
  - Si es `COTIZACION`: Guarda la orden sin descontar stock.

### PATCH `/api/ordenes/[id]`
- **Acción `convertirAVenta`:** Convierte una Cotización a Venta, cambia estado a `COMPLETADA`, descuenta stock y registra Kardex `SALIDA`.
- **Acción `anular`:** Cambia el estado a `ANULADA`. Si la orden era de tipo `VENTA`, restituye las cantidades al stock de `Producto` y genera un Kardex de reposición por anulación.

### GET `/api/metodos-pago`
- Retorna la lista de métodos de pago activos (con auto-seed inicial de Efectivo, Yape, Plin, Transferencia).

---

## 5. Componentes de UI / UX (Frontend)

Ubicados en [components/views/ordenes/](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/components/views/ordenes/):

1. **`OrdenesView.tsx`**: Bento grid de KPIs de Ventas, tabs (Ventas, Cotizaciones, Anuladas), tabla paginada con acciones (Ver Detalle, Descargar PDF, Editar Cotización, Convertir a Venta, Anular) y botón **"Exportar"** que abre `ExportarOrdenesModal`.
2. **`CrearOrdenModal.tsx`**:
   - Selector dinámico entre Venta Directa y Cotización.
   - Combobox con autocompletado de Clientes + botón inline `+ Nuevo Cliente`.
   - **Selector de Fecha** (`<input type="date">`) pre-llenado con la fecha local actual. Permite registrar transacciones retroactivas.
   - Tabla de ítems con sanitización de ceros a la izquierda en inputs numéricos (cantidad, precio costo, precio venta).
   - **Ganancia Estimada Proyectada (S/) y Margen (%)** calculados en tiempo real contra el último costo de compra.
3. **`VerOrdenModal.tsx`**: Ficha detallada con estado, desglose congelado de ítems y botones de acción rápida (Convertir a Venta / Anular / PDF).
4. **`ExportarOrdenesModal.tsx`** *(Nuevo)*: Modal avanzado de exportación con:
   - Selector de tipo de orden (Todos | Ventas | Cotizaciones).
   - Rango de fechas (Fecha Inicio / Fecha Fin) filtrando por `fechaOrden`.
   - Tipo de reporte: **Resumen General** (1 fila por orden) | **Detalle de Ítems** (SKU, Producto, P. Unitario, Cantidad, Subtotal).
   - Formatos: CSV y Excel (`.xlsx`).

---

## 6. Generación de Documentos PDF (`pdfGenerator.ts`)

Definida en [pdfGenerator.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/lib/pdfGenerator.ts) utilizando `jspdf` y `jspdf-autotable`:

- **Formato Oficial:** Estilo A8F Samfor con paleta corporativa `#DB052B` (Rojo Corporativo) y `#1A1A1A`.
- **Encabezado Institucional:**
  - Logotipo oficial de la empresa (`public/LOGO.png`).
  - Dirección: **Calle Espinar 311**.
  - Datos de contacto y RUC.
- **Tipos de Documento:**
  - **Proforma (Cotización):** Incluye condiciones de pago, vigencia y nota legal.
  - **Nota de Pedido (Venta):** Comprobante interno de despacho para almacén y cliente.

---

## 7. Reglas de Negocio y Tareas Ocultas

- **Número de Orden Legible:** Se utiliza la columna autoincremental `numeroOrden` para mostrar IDs limpios (ej. `#000104`) al cliente, en lugar de UUIDs extensos.
- **Cotizaciones con Stock Cero:** El vendedor puede generar una cotización de un producto sin stock actual. Al momento de querer convertirla a venta, el sistema exige que exista el stock en almacén.
- **Atajo `+ Nuevo Cliente`:** El modal de orden permite abrir en popover el modal de creación de clientes y auto-selecciona el cliente recién creado sin perder el borrador de la venta.

---

## 8. Matriz de Relación con otros Módulos

```
 ┌───────────────────────────────┐
 │ Módulo de VENTAS / ORDENES    │
 └──────────────┬────────────────┘
                │
                ├───────────────────────► [ Inventario / Kardex ] (Valida stock y descuenta/restituye unidades)
                ├───────────────────────► [ Clientes ] (Asocia órdenes a fichas de cliente)
                ├───────────────────────► [ Dashboard ] (Registra ventas MTD e Ingresos en gráficos)
                └───────────────────────► [ Documentos PDF ] (Genera Proformas y Notas de Pedido A8F Samfor)
```

---

## 9. Pruebas Unitarias y Cobertura

- Archivo de test: `__tests__/ordenes.test.ts` (100% Aprobados)
- Verificaciones:
  - Creación de cotizaciones sin alterar stock.
  - Creación de venta descontando stock y creando Kardex `SALIDA`.
  - Transacción de conversión Cotización $\rightarrow$ Venta.
  - Anulación de Venta con restitución de stock.

---

## 10. Guía de Modificación para Agentes de IA

1. Al modificar `orden.service.ts`, mantén **SIEMPRE** el guardado de los snapshots descifrados en `DetalleOrden` (`productoNombreCifrado`, `precioUnitarioCongeladoCifrado` y ahora también `costoUnitarioCongeladoCifrado`).
2. Al editar la generación de PDF en `pdfGenerator.ts`, asegúrate de incluir el logo `/LOGO.png` mediante conversión Base64 o canvas y mantener la dirección institucional "Calle Espinar 311".
3. El campo `fechaOrden` debe parsearse siempre con hora local (`new Date(year, month - 1, day, 12, 0, 0)`) para evitar desfasajes UTC. Nunca usar `new Date('YYYY-MM-DD')` directamente.
4. En `ExportarOrdenesModal.tsx`, la exportación en modo **detalle** hace fetch individual por orden si los detalles no están incluidos en la respuesta paginada. Esto puede ser lento si hay muchas órdenes; considerar cachear o incluir detalles en el endpoint GET.

---

## 11. Cambios de la Sesión 2026-08-07 ✅ COMPLETADO

- [X] **Campo `fechaOrden` en `Orden`** — Permite registrar la fecha real de la transacción (retroactiva). Parseada con hora local para evitar desfasaje UTC.
- [X] **Campo `costoUnitarioCongeladoCifrado` en `DetalleOrden`** — Congela el costo unitario del producto al momento de la venta/cotización, habilitando cálculo futuro de ganancia bruta real en el Dashboard.
- [X] **Selector de Fecha en `CrearOrdenModal`** — Fecha local de hoy por defecto, editable con `max=hoy`.
- [X] **Sanitización de ceros a la izquierda** — Inputs numéricos (cantidad, precio costo, precio venta) filtran ceros iniciales con `.replace(/^0+(?=\d)/, '')`.
- [X] **`ExportarOrdenesModal.tsx`** — Nuevo modal de exportación avanzada con rango de fechas, tipo de orden, reporte resumen/detalle y formatos CSV/Excel.
- [X] **`OrdenesView.tsx`** — Botones "Exportar CSV" y "Exportar Excel" reemplazados por un único botón "Exportar" que abre el modal avanzado.
