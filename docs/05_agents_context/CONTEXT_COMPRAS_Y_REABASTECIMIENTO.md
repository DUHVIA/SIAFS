# CONTEXT_COMPRAS_Y_REABASTECIMIENTO.md — Módulo de Compras, Ingresos por Lotes y Reabastecimiento (SIAFS ERP)

> **🤖 MANUAL DE CONTEXTO PARA AGENTES DE IA:**
> Este documento contiene TODA la información técnica, lógica de negocio, esquemas de datos, APIs y componentes del módulo de **Compras, Adquisición de Lotes y Reabastecimiento de Inventario**.
> Consulta este archivo al modificar el registro de facturas/notas de compra de proveedores, ingreso masivo de lotes o recepción de autopartes y motores.

---

## 1. Ficha Técnica del Módulo

| Campo | Detalle |
|---|---|
| **Nombre del Módulo** | Compras, Ingreso de Lotes y Reabastecimiento de Mercadería |
| **Identificador Interno** | `ingresos` |
| **Rol en SIAFS** | Registrar la adquisición masiva de autopartes y motores a proveedores por lotes, actualizar los costos unitarios de compra, incrementar stocks de forma transaccional y alimentar la inversión en compras del Dashboard. |
| **Ruta Backend/Servicios** | [ingreso.service.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/modules/ingresos/ingreso.service.ts) |
| **Ruta API Handlers** | `app/api/ingresos/route.ts`, `app/api/ingresos/[id]/route.ts` |
| **Ruta UI/Frontend** | `components/views/ingresos/IngresosView.tsx`, `components/views/ingresos/CrearIngresoModal.tsx`, `components/views/ingresos/VerIngresoModal.tsx` |
| **Estado del Módulo** | 100% Completo y Probad en Producción (incluye exportación Excel/CSV e integración con el Dashboard). |

---

## 2. Propósito y Arquitectura de Negocio

En SIAFS ERP, la compra de mercadería no se realiza ítem por ítem, sino a través de **Lotes de Ingreso** que representan facturas, guías o boletas de proveedores:
1. **Recepción por Lotes (`Ingreso`):** Contiene la fecha, usuario responsable, notas/proveedor y el monto total invertido cifrado.
2. **Desglose de Ítems (`DetalleIngreso`):** Cada línea especifica el producto adquirido, la cantidad ingresada y el costo unitario de compra.
3. **Efectos Automáticos al Procesar un Lote:**
   - Incrementa el stock de cada producto involucrado.
   - Crea un movimiento de Kardex tipo `INGRESO` por producto.
   - Registra el `precioCompraCifrado` en la tabla `HistorialPrecio`.
   - Permite actualizar opcionalmente el precio de venta sugerido.
   - Registra el egreso financiero en las métricas de **Inversión en Compras** del Dashboard.

---

## 3. Modelo de Base de Datos (Prisma Schema)

Definido en [schema.prisma](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/prisma/schema.prisma):

```prisma
model Ingreso {
  id                  String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  usuarioId           String   @map("usuario_id") @db.Uuid
  descripcionCifrada  String?  @map("descripcion_cifrada") @db.Text // Notas/Guía/Proveedor
  totalCifrado        String   @map("total_cifrado") @db.Text
  fechaIngreso        DateTime @default(now()) @map("fecha_ingreso")

  usuario             Usuario  @relation(fields: [usuarioId], references: [id])
  detalles            DetalleIngreso[]

  @@map("ingresos")
}

model DetalleIngreso {
  id                  String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  ingresoId           String   @map("ingreso_id") @db.Uuid
  productoId          String   @map("producto_id") @db.Uuid
  cantidadCifrada     String   @map("cantidad_cifrada") @db.Text
  costoUnitarioCifrado String  @map("costo_unitario_cifrado") @db.Text

  ingreso             Ingreso  @relation(fields: [ingresoId], references: [id], onDelete: Cascade)
  producto            Producto @relation(fields: [productoId], references: [id])

  @@map("detalle_ingresos")
}
```

---

## 4. Endpoints de la API

### GET `/api/ingresos`
- **Permiso RBAC:** `VER_INGRESOS`
- **Query Params:** `page`, `limit`, `search`
- **Proceso:** Descifra en memoria los lotes de compra, suma importes y retorna métricas del mes (Total Invertido, Lotes Recibidos, Lote Promedio, Cantidad de Productos Ingresados).

### POST `/api/ingresos`
- **Permiso RBAC:** `VER_INGRESOS` (o `CREAR_INGRESO`)
- **Payload Request:**
  ```json
  {
    "descripcion": "Factura F001-4589 - Distribuidora Automotriz",
    "detalles": [
      {
        "productoId": "uuid-prod-1",
        "cantidad": 20,
        "costoUnitario": 45.50,
        "nuevoPrecioVenta": 75.00
      }
    ]
  }
  ```
- **Proceso Transaccional:** Ejecuta `prisma.$transaction()` para registrar `Ingreso`, `DetalleIngreso`, actualizar `Producto.stock`, crear `Kardex` y guardar `HistorialPrecio`.

### GET `/api/ingresos/[id]`
- **Permiso RBAC:** `VER_INGRESOS`
- **Descripción:** Retorna el detalle completo descifrado del lote con la lista de productos, cantidades y costos unitarios.

---

## 5. Componentes de UI / UX (Frontend)

Ubicados en [components/views/ingresos/](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/components/views/ingresos/):

1. **`IngresosView.tsx`**: Vista principal. Bento grid de KPIs de Compras (Compras del Mes, Lotes Recibidos, Lote Promedio, Ítems Ingresados), buscador con debounce, tabla paginada con acciones "Ver Ficha" y botones de **Exportar CSV** y **Exportar Excel**.
2. **`CrearIngresoModal.tsx`**: Formulario interactivo de recepción de mercadería. Incluye combobox de búsqueda de productos, tabla dinámica de líneas con cálculo en tiempo real del costo total del lote y actualización opcional de precio de venta.
3. **`VerIngresoModal.tsx`**: Modal de auditoría visual que muestra el desglose exacto de un lote guardado, usuario que registró la compra y fecha de recepción.

---

## 6. Tareas Ocultas & Reglas de Negocio Especiales

- **Actualización Transaccional de Precio Costo:**
  Al procesar un lote, el `costoUnitario` ingresado se convierte automáticamente en la referencia de precio de compra actual del producto en `HistorialPrecio`, permitiendo calcular márgenes reales en el módulo de Ventas.
- **Exportación Excel en Compras:**
  Permite descargar el historial completo de compras por periodo para fines contables y de auditoría fiscal.

---

## 7. Matriz de Relación con otros Módulos

```
 ┌─────────────────────────────────┐
 │ Módulo de COMPRAS / INGRESOS    │
 └────────────────┬────────────────┘
                  │
                  ├───────────────────────► [ Inventario ] (Suma stock de productos y actualiza precio costo)
                  ├───────────────────────► [ Kardex ] (Genera movimientos inmutables de tipo INGRESO)
                  ├───────────────────────► [ Dashboard Financiero ] (Alimenta métricas de Inversión en Compras)
                  └───────────────────────► [ Ventas ] (Suministra el precio de costo para cálculo de Ganancia Estimada)
```

---

## 8. Pruebas Unitarias y Cobertura

- Archivo de test: `__tests__/ingresos.test.ts` (100% Aprobados)
- Escenarios probados:
  - Registro exitoso de lote multilínea.
  - Incremento atómico de stock por producto.
  - Creación de registros Kardex con tipo `INGRESO`.

---

## 9. Guía de Modificación para Agentes de IA

1. Al modificar `ingreso.service.ts`, mantén la transacción atómica `prisma.$transaction()`; si falla el registro de un ítem, todo el lote debe hacer rollback.
2. Asegúrate de descifrar `descripcion_cifrada`, `total_cifrado` y `costo_unitario_cifrado` antes de devolver las respuestas JSON a la interfaz.
