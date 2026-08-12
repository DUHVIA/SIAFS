# CONTEXT_INVENTARIO.md — Módulo de Inventario, Autopartes, Motores y Kardex (SIAFS ERP)

> **🤖 MANUAL DE CONTEXTO PARA AGENTES DE IA:**
> Este documento contiene TODA la información técnica, lógica de negocio, esquema de base de datos, APIs y componentes del módulo de **Inventario, Tipos de Autoparte y Kardex de Movimientos**.
> Consulta este archivo cuando modifiques la gestión de stock, la creación/edición de productos, tipos de autoparte, importaciones masivas o el historial de trazabilidad Kardex.

---

## 1. Ficha Técnica del Módulo

| Campo | Detalle |
|---|---|
| **Nombre del Módulo** | Gestión de Inventario, Autopartes, Motores, Tipos y Auditoría Kardex |
| **Identificador Interno** | `productos` / `tipos-autoparte` / `kardex` |
| **Rol en SIAFS** | Controlar el catálogo de productos (autopartes y motores), categorización, precios de costo/venta, rangos de stock, reposición rápida y auditoría atómica de movimientos. |
| **Ruta Backend/Servicios** | [producto.service.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/modules/productos/producto.service.ts), [kardex.service.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/modules/kardex/kardex.service.ts) |
| **Ruta API Handlers** | `app/api/productos/route.ts`, `app/api/productos/[id]/route.ts`, `app/api/productos/[id]/restock/route.ts`, `app/api/tipos-autoparte/route.ts`, `app/api/tipos-autoparte/[id]/route.ts`, `app/api/kardex/route.ts`, `app/api/inventario/importar/route.ts` |
| **Ruta UI/Frontend** | `app/inventario/page.tsx`, `components/views/inventario/InventarioView.tsx` y modales adjuntos. |
| **Estado del Módulo** | 100% Completo y Funcional (incluye CRUD de tipos, Kardex visual, plantilla e importación Excel). |

---

## 2. Propósito y Arquitectura de Negocio

El módulo de Inventario es el núcleo operativo de SIAFS ERP (taller de mecánica y distribuidora de motores y autopartes):
1. **Categorización de Productos:** Separa la mercadería en dos grandes categorías: `AUTOPARTE` (repuestos, piezas) y `MOTOR` (motores completos con detalles técnicos específicos).
2. **Tipos de Autoparte Relacionales:** Clasificación dinámica (ej. *Frenos*, *Suspensión*, *Filtros*, *Transmisión*) administrable en caliente desde la interfaz con validación de duplicados.
3. **Capa Cifrada (ALE):** Todos los nombres, precios de venta, stocks y detalles técnicos se cifran con AES-256-GCM.
4. **Trazabilidad atómica (Kardex):** Toda adición, descuento o ajuste de stock crea **obligatoriamente** un registro inmutable en la tabla `Kardex` dentro de una transacción `prisma.$transaction()`.
5. **Alertas de Stock Bajo (Low Stock Advisory):** Notifica visualmente cuando el stock cae por debajo de los umbrales de seguridad.

---

## 3. Modelo de Base de Datos (Prisma Schema)

Definido en [schema.prisma](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/prisma/schema.prisma):

```prisma
enum CategoriaProducto {
  AUTOPARTE
  MOTOR
}

enum TipoMovimientoKardex {
  INGRESO
  SALIDA
  AJUSTE
}

model Producto {
  id                  String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  nombreCifrado       String            @map("nombre_cifrado") @db.Text
  idxNombre           String?           @map("idx_nombre") @db.VarChar(64)
  categoria           CategoriaProducto
  precioVentaCifrado  String            @map("precio_venta_cifrado") @db.Text
  precioCompraCifrado String?           @map("precio_compra_cifrado") @db.Text
  stockCifrado        String            @map("stock_cifrado") @db.Text
  rangoStock          Int               @default(0) @map("rango_stock")
  detallesCifrados    String            @map("detalles_cifrados") @db.Text
  isActive            Boolean           @default(true) @map("is_active")
  createdAt           DateTime          @default(now()) @map("created_at")

  tipoAutoparteId     String?           @map("tipo_autoparte_id") @db.Uuid
  tipoAutoparte       TipoAutoparte?    @relation(fields: [tipoAutoparteId], references: [id])

  historialPrecios    HistorialPrecio[]
  historialNombres    HistorialNombre[]
  movimientosKardex   Kardex[]
  detalleOrdenes      DetalleOrden[]
  detalleIngresos     DetalleIngreso[]

  @@map("productos")
}

model TipoAutoparte {
  id                  String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  nombre              String            @unique @db.VarChar(100)
  isActive            Boolean           @default(true) @map("is_active")
  createdAt           DateTime          @default(now()) @map("created_at")

  productos           Producto[]

  @@map("tipos_autoparte")
}

model Kardex {
  id                  String               @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  productoId          String               @map("producto_id") @db.Uuid
  usuarioId           String               @map("usuario_id") @db.Uuid
  tipoMovimiento      TipoMovimientoKardex @map("tipo_movimiento")
  cantidadCifrada     String               @map("cantidad_cifrada") @db.Text
  motivoCifrado       String               @map("motivo_cifrado") @db.Text
  fechaMovimiento     DateTime             @default(now()) @map("fecha_movimiento")

  producto            Producto @relation(fields: [productoId], references: [id], onDelete: Cascade)
  usuario             Usuario  @relation(fields: [usuarioId], references: [id])

  @@map("kardex")
}

model HistorialPrecio {
  id                      String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  productoId              String   @map("producto_id") @db.Uuid
  usuarioId               String   @map("usuario_id") @db.Uuid
  precioCompraCifrado     String?  @map("precio_compra_cifrado") @db.Text
  precioVentaCifrado      String   @map("precio_venta_cifrado") @db.Text
  fechaCambio             DateTime @default(now()) @map("fecha_cambio")

  producto Producto @relation(fields: [productoId], references: [id], onDelete: Cascade)
  usuario  Usuario  @relation(fields: [usuarioId], references: [id])

  @@map("historial_precios")
}
```

---

## 4. Endpoints de la API y Handlers

### A. Productos (`/api/productos`)
| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| `GET` | `/api/productos` | `VER_PRODUCTOS` | Lista paginada con filtros (`page`, `limit`, `search`, `categoria`, `stockStatus`, `tipoAutoparteId`). Descifra en memoria y retorna métricas de inventario. |
| `POST` | `/api/productos` | `CREAR_PRODUCTO` | Crea un producto encriptando datos + registro inicial Kardex `INGRESO`. |
| `GET` | `/api/productos/[id]` | `VER_PRODUCTOS` | Retorna el detalle descifrado de un producto por ID. |
| `PATCH` | `/api/productos/[id]` | `EDITAR_PRODUCTO` | Edita datos. Si cambia el precio de venta, inserta automáticamente un registro en `HistorialPrecio`. |
| `DELETE` | `/api/productos/[id]` | `ELIMINAR_PRODUCTO` | Soft-delete (`isActive: false`). |
| `POST` | `/api/productos/[id]/restock` | `CREAR_PRODUCTO` | Incrementa stock rápido (`+cantidad`) + Kardex `INGRESO`. |

### B. Tipos de Autoparte (`/api/tipos-autoparte`)
| Método | Ruta | Permiso | Descripción |
|---|---|---|---|
| `GET` | `/api/tipos-autoparte` | Public/Auth | Lista todos los tipos activos ordenados alfabéticamente. |
| `POST` | `/api/tipos-autoparte` | `CREAR_PRODUCTO` | Crea un tipo de autoparte (valida duplicados insensibles a mayúsculas). |
| `PATCH` | `/api/tipos-autoparte/[id]` | `EDITAR_PRODUCTO` | Actualiza el nombre del tipo de autoparte. |
| `DELETE` | `/api/tipos-autoparte/[id]` | `ELIMINAR_PRODUCTO` | Soft-delete del tipo (`isActive: false`). |

### C. Kardex & Importación
| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/kardex` | Retorna el historial de movimientos Kardex filtrable por `productoId`, `tipoMovimiento` y rango de fechas. |
| `POST` | `/api/inventario/importar` | Carga masiva de inventario desde archivo Excel (.xlsx). |

---

## 5. Componentes de UI / UX (Frontend)

Ubicados en [components/views/inventario/](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/components/views/inventario/):

1. **`InventarioView.tsx`**: Vista maestra. Bento grid de KPIs (Total SKUs, Agotados, Stock Bajo, Valor Total en S/), tabs de filtro (Todo, Autopartes, Motores, Reabastecimiento), buscador con debounce (300ms), dropdown dinámico de tipos y banner "Low Stock Advisory".
2. **`CrearProductoModal.tsx`**: Formulario dinámico. Incluye los campos "Precio de Venta (S/)" y "Precio de Compra (S/)", y adapta campos según categoría `AUTOPARTE` (requiere Tipo de Autoparte con botón `+` inline, estado físico `Nuevo` | `Usado` | `Importado`) o `MOTOR`.
3. **`EditarProductoModal.tsx`**: Modal de modificación con pre-llenado de campos descifrados (incluyendo precio de venta, precio de compra editable y estado físico `Nuevo` | `Usado` | `Importado`).
4. **`RestockModal.tsx`**: Modal para adición rápida de unidades con campo obligatorio de Motivo.
5. **`GestionarTiposModal.tsx`**: Modal CRUD para administrar el catálogo de tipos de autopartes (crear, editar inline y eliminar).
6. **`VerKardexModal.tsx`**: Modal de auditoría que despliega la tabla histórica de entradas, salidas y ajustes por usuario con exportación.
7. **`ImportarInventarioModal.tsx`**: Modal de carga masiva drag & drop para plantillas Excel.

---

## 6. Tareas Ocultas & Reglas de Negocio Especiales

- **Umbrales de Stock Bajo:**
  - `AUTOPARTE`: `stock < 10` $\rightarrow$ Estado `LOW_STOCK` (Badge Amarillo).
  - `MOTOR`: `stock < 2` $\rightarrow$ Estado `LOW_STOCK` (Badge Amarillo).
  - `stock === 0` $\rightarrow$ Estado `OUT_OF_STOCK` (Badge Rojo Corporativo `#DB052B`).
- **Plantilla de Migración de Inventario:**
  Ubicada en [lib/inventoryTemplate.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/lib/inventoryTemplate.ts). Incluye la columna **Precio Compra (S/)** obligatoria para inicializar el costo en `HistorialPrecio`.
- **Transaccionalidad en Reposición:**
  ```typescript
  await prisma.$transaction(async (tx) => {
    await tx.producto.update({ ... });
    await tx.kardex.create({ ... });
    await tx.historialPrecio.create({ ... });
  });
  ```

---

## 7. Matriz de Relación con otros Módulos

```
 ┌──────────────────────┐
 │ Módulo de INVENTARIO │
 └──────────┬───────────┘
            │
            ├───────────────────────► [ Ventas u Órdenes ] (Provee stock, valida disponibilidad y descuenta unidades)
            ├───────────────────────► [ Compras / Ingresos ] (Recibe aumentos de stock y registra precio costo)
            ├───────────────────────► [ Dashboard ] (Alimenta métricas de SKUs, stock bajo y valorización)
            └───────────────────────► [ Kardex / Auditoría ] (Genera registros de movimiento por cada transacción)
```

---

## 8. Pruebas Unitarias y Cobertura

- Archivo de test: `__tests__/inventario.test.ts` (100% Aprobados)
- Escenarios probados:
  - Creación de productos con encriptación AES.
  - Registro de reposición atómica incrementando stock y creando entrada Kardex.
  - Actualización de precio de venta registrando en `HistorialPrecio`.
  - Filtros por categoría y estado de stock.

---

## 9. Guía de Modificación para Agentes de IA

1. Al modificar el stock de un producto, **NUNCA** hagas un `prisma.producto.update` aislado. Siempre envuélvelo en `prisma.$transaction()` agregando la fila correspondiente en `Kardex`.
2. Si agregas un nuevo campo a `Producto`, recuerda actualizar tanto `ProductoDTO` en `producto.dto.ts` como la lógica de cifrado/descifrado en `producto.service.ts`.
3. Respeta los tokens de diseño: badges de stock crítico deben usar `bg-red-100 text-primary font-bold`.
4. Al crear un nuevo `TipoAutoparte` desde el formulario rápido de `CrearProductoModal`, el estado `tiposLocales` se actualiza de forma síncrona e inmediata (`setTiposLocales` + `setTipoAutoparteId`) para garantizar que la opción aparezca en el menú `<Select>` sin depender exclusivamente del ciclo de re-renderizado del componente padre.
