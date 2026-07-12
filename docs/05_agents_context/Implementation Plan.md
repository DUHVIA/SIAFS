# Plan de Trabajo (Actualizado): Implementación e Integración de Inventario (CRUD, Filtros y Acciones)

Este documento detalla el plan de diseño y desarrollo frontend para completar el módulo de gestión de inventario en el ERP **A&F Samfor (SIAFS)**, incorporando las respuestas y decisiones de diseño tomadas.

---

## 1. Decisiones de Diseño Incorporadas

1. **Tabla Relacional para Tipos de Autopartes (HU-024):** 
   - Se creará un nuevo modelo `TipoAutoparte` en `schema.prisma`.
   - Se añadirá una clave foránea `tipoAutoparteId` en la tabla `Producto` con una relación opcional (solo aplica si `categoria == AUTOPARTE`).
   - Se creará un endpoint de API `GET /api/tipos-autoparte` y `POST /api/tipos-autoparte` para gestionar estos tipos dinámicamente.
2. **Umbral de Alerta de Stock Bajo (Low Stock Advisory):**
   - **Autopartes:** Menos de 10 unidades.
   - **Motores:** Menos de 2 unidades.

---

## 2. Plan de Componentes Frontend (Reutilizables y Vistas)

### A. Componentes Existentes (Revisión y Ajuste)
1. **`AppLayout` & `Sidebar` / `Navbar` (Modificar):**
   - Implementar un estado `isOpenMobileSidebar` para el menú de hamburguesa en móvil.
   - Ajustar el margen izquierdo (`ml-[18rem]`) de `AppLayout` para que sea dinámico (`lg:ml-[18rem] ml-0`) y no rompa la responsividad en móviles.
2. **`Table` (Modificar):**
   - Asegurar compatibilidad con scrolls horizontales en móviles.
   - Añadir soporte visual de bordes redondeados y tipografía consistente.
3. **`StatCard` (Revisar):**
   - Confirmar que usa los colores correctos de la marca y soporta layouts compactos.

### B. Nuevos Componentes de la Vista de Inventario
1. **`InventarioView` (Modificar/Reescribir):**
   - Componente principal del módulo de inventario que manejará los estados de paginación, filtros activos, término de búsqueda y control de modales.
2. **`CrearProductoModal` y `EditarProductoModal` (Nuevos):**
   - Formulario adaptativo según la categoría seleccionada (`AUTOPARTE` o `MOTOR`):
     - Si es **Autoparte**: Muestra campos de *Tipo de Autoparte* (cargado de la nueva tabla `TipoAutoparte`), *Estado Físico* (Nuevo, Usado, Reconstruido), *Marca* y *Origen*.
     - Si es **Motor**: Muestra campos de *Marcas Compatibles* (permite múltiples marcas en chips de texto), *Combustible* (Gasolina, Diésel, GLP, GNV) y *Estado*.
     - Habilitará la creación dinámica de nuevos tipos de autopartes (HU-024) mediante un botón "+" junto al dropdown de selección de tipos, que guardará el nuevo tipo en la tabla relacional.
3. **`RestockModal` (Nuevo):**
   - Modal rápido para registrar reabastecimiento (reposición) indicando *Cantidad*, *Motivo* y un campo opcional para el *Usuario* que realiza la acción (tomado de la sesión de autenticación).
4. **`ConfirmDeleteModal` (Nuevo):**
   - Modal para confirmación visual de archivado de productos (Soft Delete - HU-005).

---

## 3. Mapeo de la API y Flujo de Datos

### Endpoints Requeridos e Integración:

1. **`GET /api/productos` (Modificar):**
   - **Propósito:** Retorna la lista de productos paginada, filtrada y con las métricas generales de inventario recalculadas (incluyendo la relación con `TipoAutoparte`).
   - **Parámetros Query:** `page`, `limit`, `search`, `categoria`, `stockStatus`, `tipoAutoparteId`.
   - **Lógica de Servidor (para el descifrado seguro):**
     1. Obtener todos los productos activos de la BD incluyendo `tipoAutoparte`.
     2. Descifrarlos en memoria de forma segura.
     3. Filtrar los productos resultantes usando los parámetros de `search` y `categoria`.
     4. Calcular métricas agregadas globales (Total SKUs, Agotados, Stock Bajo [Autopartes < 10, Motores < 2], Valor Total en Inventario) para toda la lista de productos.
     5. Paginar los datos resultantes y retornarlos.

2. **`GET /api/tipos-autoparte` y `POST /api/tipos-autoparte` (Nuevos):**
   - **Propósito:** Listar y crear tipos de autopartes relacionales.

3. **`POST /api/productos` (Existente) & `PATCH /api/productos/[id]` (Existente):**
   - Adaptados para soportar `tipoAutoparteId`.

4. **`DELETE /api/productos/[id]` (Existente) & `POST /api/productos/[id]/restock` (Nuevo).**

---

## 4. Plan de Trabajo Propuesto (Proposed Changes)

### Componente: Base de Datos y API (Backend)

#### [MODIFY] [schema.prisma](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/prisma/schema.prisma)
- Crear el modelo `TipoAutoparte`.
- Relacionar `Producto` con `TipoAutoparte` agregando `tipoAutoparteId String?` y la relación correspondiente.

#### [NEW] [route.ts (api/tipos-autoparte)](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/app/api/tipos-autoparte/route.ts)
- Crear el endpoint de tipo `GET` y `POST` para la tabla `TipoAutoparte`.

#### [MODIFY] [producto.service.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/modules/productos/producto.service.ts)
- Actualizar `crear` y `actualizar` para guardar y retornar `tipoAutoparteId` e incluir la relación al obtener.
- Actualizar `obtenerTodos` para incluir `tipoAutoparte` en el query de Prisma.

#### [MODIFY] [route.ts (api/productos)](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/app/api/productos/route.ts)
- Modificar el controlador `GET` para incluir los filtros relacionales de `tipoAutoparteId` y aplicar los nuevos umbrales de stock bajo en las métricas.

---

### Componente: Componentes UI/UX y Vista (Frontend)

#### [MODIFY] [AppLayout.tsx](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/components/layout/AppLayout.tsx)
- Hacer que el Sidebar sea responsivo (desplazable / hamburguesa en pantallas pequeñas).
- Quitar el margen izquierdo rígido en pantallas menores a `lg`.

#### [MODIFY] [Navbar.tsx](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/components/layout/Navbar.tsx)
- Añadir el botón de hamburguesa para activar la barra lateral en móvil.

#### [MODIFY] [InventarioView.tsx](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/components/views/inventario/InventarioView.tsx)
- Integración completa con el backend usando `fetch`.
- Skeletons/Shimmers de carga para las tarjetas de métricas y la tabla de datos.
- Paginación dinámica y reactiva usando el estado global devuelto por la API.
- Lógica de filtros por categoría de marca (chips/tabs) y tipo relacional (dropdown cargado de la API).
- Banner dinámico "Low Stock Advisory" usando los nuevos umbrales.

#### [NEW] [CrearProductoModal.tsx](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/components/views/inventario/CrearProductoModal.tsx)
- Modal con validación Zod y campos adaptativos (Autoparte / Motor). Incluye el botón "+" para registrar un nuevo tipo relacional en caliente.

#### [NEW] [EditarProductoModal.tsx](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/components/views/inventario/EditarProductoModal.tsx)
- Formulario de edición con los mismos campos relacionales y adaptativos.

#### [NEW] [RestockModal.tsx](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/components/views/inventario/RestockModal.tsx)
- Formulario modal simple para el ingreso de mercadería.

#### [NEW] [ConfirmDeleteModal.tsx](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/components/views/inventario/ConfirmDeleteModal.tsx)
- Confirmación de archivado (Soft Delete).

---

## 5. Plan de Verificación

### Pruebas Automatizadas
- Añadir pruebas unitarias en `__tests__/producto.service.test.ts` para verificar la función `registrarReposicion` y la creación de tipos relacionales.
- Ejecutar el set de pruebas global con `pnpm test`.

### Verificación Manual
- Validar migración de base de datos de Prisma exitosa.
- Probar responsividad y ciclo CRUD completo incluyendo la creación y asignación dinámica de un nuevo Tipo de Autoparte.
