# CONTEXT.md — Documento de Contexto Centralizado: SIAFS ERP

> **⚠️ INSTRUCCIÓN PARA MODELOS DE IA:**
> Este archivo es la **fuente de verdad única** del proyecto. Léelo en su totalidad antes de tocar cualquier archivo del codebase. Contiene el estado actual del desarrollo, la arquitectura, las convenciones y el backlog. Todo lo que necesitas para continuar el desarrollo sin interrupciones está aquí.

**Última actualización:** 2026-07-30  
**Actualizado por:** Antigravity AI (Claude Sonnet 4.6)  
**Sesiones y Ramas referenciadas:** `diego-branch` (Usuarios, Permisos RBAC, Proxy Middleware, Modal Kardex, PDF Proformas), `maxs-branch` (Sales & Quotes Module), `e34c681c` (Inventory Module), `9691dd73` (Purchases & Batches Module), `717be0b5` (Expenses & Finanzas Module), `excel-and-financial-dashboard` (Exportación Excel, Dashboard Financiero con Filtro Temporal, Plantilla Migración Inventario), `ff586395` (Gestión Tipos Autoparte CRUD, Dashboard Compras/Adquisición, Navbar Simplificado)


---

## 1. Contexto General del Proyecto

### 1.1 Identidad del Producto

| Campo | Detalle |
|---|---|
| **Nombre del Sistema** | SIAFS — Sistema Integrado de Autopartes y Finanzas Samfor |
| **Nombre Comercial / ERP** | A&F Samfor ERP |
| **Negocio** | Taller automotriz y distribuidora de autopartes y motores |
| **Tipo de App** | ERP web full-stack (monolito moderno con Next.js) |
| **URL Local Dev** | `http://localhost:3000` |
| **Directorio Raíz del Código** | `erp-taller/` (dentro de `SIAFS/SIAFS/`) |

### 1.2 Stack Tecnológico

#### Frontend & Backend (Monolito Unificado)
| Tecnología | Versión | Rol |
|---|---|---|
| **Next.js** | 16.2.9 | Framework fullstack — App Router, Server Components, API Routes |
| **React** | 19.2.4 | Librería de UI |
| **TypeScript** | ^5 | Tipado estático en todo el proyecto |
| **Tailwind CSS** | v4 (`@tailwindcss/postcss`) | Estilos utilitarios — Motor de compilación nativo (NO v3) |

#### Librerías UI / UX
| Librería | Versión | Uso |
|---|---|---|
| **Lucide React** | ^1.23.0 | Sistema de iconos |
| **Recharts** | ^3.9.2 | Gráficos analíticos en el Dashboard |
| **Zod** | ^4.4.3 | Validación de datos (DTOs y formularios) |

#### Base de Datos y ORM
| Tecnología | Versión | Rol |
|---|---|---|
| **PostgreSQL** | 16 Alpine | Base de datos relacional principal |
| **Docker / Docker Compose** | — | Contenedor local de PostgreSQL |
| **Prisma ORM** | ^7.8.0 | Acceso a datos, migraciones, tipado |
| `@prisma/adapter-pg` | ^7.8.0 | Adaptador nativo para pool de conexiones con `pg` |
| `pg` | ^8.22.0 | Driver PostgreSQL para Node.js |

#### Seguridad
| Tecnología | Uso |
|---|---|
| **Node.js Crypto (nativo)** | Encriptación AES-256-GCM (Application-Level Encryption) |
| **Jose** | ^6.2.3 — JWT en Edge Runtime (firma y verificación) |

#### Testing
| Tecnología | Versión | Uso |
|---|---|---|
| **Vitest** | ^4.1.9 | Suite de pruebas unitarias (38 tests en 11 archivos) |
| `vitest-mock-extended` | ^4.0.0 | Mocking tipado del cliente Prisma |

### 1.3 Sistema de Diseño (Design System)

**Nombre del tema:** `Industrial Precision Management`  
**Fuente de verdad del diseño:** `docs/04_mockups/industrial_precision_management/DESIGN.md`

#### Paleta de Colores Corporativos
Los tokens CSS están definidos en `erp-taller/app/colors.css` con soporte **Light/Dark Mode** nativo:

| Token Tailwind | Valor Light | Valor Dark | Uso |
|---|---|---|---|
| `primary` | `#DB052B` | `#DB052B` | **Rojo Corporativo** — CTAs, alertas críticas, estados activos |
| `primary-hover` | `#b30423` | `#b30423` | Hover de botones primarios |
| `secondary` | `#1A1A1A` | `#F8F9FA` | Texto principal, fondos de Sidebar |
| `tertiary` | `#747474` | `#A0A0A0` | Texto secundario, metadatos |
| `tertiary-light` | `#A0A0A0` | `#747474` | Texto de baja prioridad |
| `neutral-light` | `#F8F9FA` | `#121212` | Fondos de secciones, zebra stripes |
| `white` (override) | `#FFFFFF` | `#1A1A1A` | Fondos de tarjetas, modales |

> **REGLA CRITICA DE COLOR:** El rojo `#DB052B` SOLO se usa para: botones primarios de acción, alertas de stock crítico, y estados de error. NO se usa decorativamente.

#### Tipografía (Google Fonts — cargadas en `layout.tsx`)
| Variable CSS | Fuente | Uso |
|---|---|---|
| `--font-headline` / `font-headline` | **Hanken Grotesk** | Títulos, nombres de sección, subtítulos de tarjetas |
| `--font-body` / `font-body` | **Inter** | Texto de cuerpo, formularios, párrafos, labels normales |
| `--font-label` / `font-label` | **JetBrains Mono** | IDs técnicos, SKUs, cantidades de stock, datos numéricos |

#### Convenciones de Forma y Elevación
- **Cards y Modales:** `rounded-3xl` con `bg-white/70 backdrop-blur-xl border border-white/20 shadow-soft`
- **Filas de tabla:** 32–40px de altura, zebra-stripe con `bg-neutral-light`
- **Status badges/chips:** "dot" indicator (rojo = sin stock, verde = en stock, amarillo = stock bajo)
- **IDs técnicos / Part IDs:** Estilo `font-label` en pill gris claro

---

## 2. Arquitectura e Integración de la API

### 2.1 Estructura de Directorios (Mapa de Archivos Clave)

```
SIAFS/SIAFS/
├── docs/
│   ├── 01_historias/         # HU001.md → HU026.md (Historias de Usuario)
│   ├── 03_arquitectura/      # modelo_db_v3.svg (Diagrama ERD actual)
│   ├── 04_mockups/           # Mockups HTML/PNG por módulo
│   └── 05_agents_context/    # <- ESTE DIRECTORIO (contexto para IAs)
│       ├── CONTEXT.md        # <- ESTE ARCHIVO
│       ├── Analisis Proyecto.md
│       ├── Implementation Plan.md
│       └── Walkthrough.md
└── erp-taller/               # <- DIRECTORIO RAIZ DEL CODIGO
    ├── app/                  # Next.js App Router (páginas + API Routes)
    │   ├── page.tsx          # Dashboard principal (Server Component)
    │   ├── inventario/page.tsx
    │   ├── ordenes/page.tsx
    │   ├── clientes/page.tsx
    │   ├── finanzas/page.tsx
    │   ├── usuarios/page.tsx
    │   ├── login/page.tsx
    │   ├── api/              # Rutas API (Route Handlers de Next.js)
    │   │   ├── auth/         # POST /api/auth/login
    │   │   ├── productos/    # GET, POST + [id]/ (GET, PATCH, DELETE, restock/)
    │   │   ├── tipos-autoparte/ # GET, POST
    │   │   ├── clientes/     # GET, POST + [id]/ (PATCH, DELETE)
    │   │   ├── ordenes/      # GET, POST + [id]/
    │   │   ├── kardex/       # GET (historial de movimientos)
    │   │   ├── ingresos/     # GET, POST
    │   │   ├── usuarios/     # GET, POST + [id]/
    │   │   ├── gastos/       # GET, POST + [id]/
    │   │   └── accesos/      # GET (permisos RBAC)
    │   ├── colors.css        # Tokens de color de la marca
    │   └── globals.css       # Reset + importación de colors.css
    ├── components/
    │   ├── dashboard/        # StatCard.tsx, SalesChart.tsx
    │   ├── layout/           # AppLayout.tsx, Sidebar.tsx, Navbar.tsx
    │   ├── providers/        # ToastProvider, LoadingProvider, AuthProvider
    │   ├── templates/        # Plantillas de página reutilizables
    │   ├── ui/               # Primitivos: Button, Input, Modal, Select, Table, Skeleton, Toast
    │   └── views/            # Componentes de vista por módulo
    │       ├── inventario/   # InventarioView.tsx + 4 modales (COMPLETO)
    │       ├── clientes/     # ClientesView.tsx, CrearClienteModal.tsx
    │       ├── ordenes/      # OrdenesView.tsx, CrearOrdenModal.tsx
    │       ├── finanzas/     # GastosView.tsx, CrearGastoModal.tsx
    │       └── usuarios/     # UsuariosView.tsx, CrearUsuarioModal.tsx
    ├── lib/
    │   ├── config.ts         # Configuración del sitio (siteConfig)
    │   ├── crypto.ts         # AES-256-GCM encrypt/decrypt + blind indexes (SHA-256)
    │   └── prisma.ts         # Cliente Prisma singleton con pg adapter
    ├── modules/              # Capa de servicios y DTOs (lógica de negocio)
    │   ├── auth/
    │   ├── accesos/
    │   ├── clientes/         # cliente.service.ts, cliente.dto.ts
    │   ├── dashboard/        # dashboard.service.ts
    │   ├── gastos/
    │   ├── ingresos/
    │   ├── kardex/
    │   ├── ordenes/
    │   ├── productos/        # producto.service.ts, producto.dto.ts (Actualizado)
    │   └── usuarios/
    ├── prisma/
    │   └── schema.prisma     # Migración v3 aplicada (incluye TipoAutoparte)
    ├── __tests__/            # 11 archivos de test, 38 tests unitarios (Todos pasan)
    ├── proxy.ts              # Middleware de autenticación JWT + RBAC (Edge Runtime)
    ├── .env                  # Variables de entorno (no commitear)
    ├── .env.example          # Plantilla de variables
    ├── Makefile              # Comandos unificados (db-up, migrate, seed, dev, test, studio)
    └── docker-compose.yml    # Definición del contenedor PostgreSQL
```

### 2.2 Flujo de Autenticación y RBAC

El middleware de autenticación está en `proxy.ts`:

```
Petición HTTP
    → proxy.ts (Edge Runtime, verifica JWT con `jose`)
    → Extrae payload: { usuarioId, rolId, permisos[] }
    → Si la ruta requiere permiso, valida contra ROUTE_PERMISSIONS map
    → Si OK: inyecta x-usuario-id y x-rol-id en headers → Route Handler / Page
    → Si NOK: 401 (API) o redirect /login (página) o redirect /unauthorized
```

**Rutas Públicas:** `/login`, `/api/auth/login`  
**Rutas Protegidas con RBAC:**

| Ruta | Permiso Requerido |
|---|---|
| `/inventario` + `/api/productos` | `VER_PRODUCTOS` |
| `/ordenes` + `/api/ordenes` | `VER_ORDENES` |
| `/clientes` + `/api/clientes` | `VER_CLIENTES` |
| `/usuarios` + `/api/usuarios` | `GESTIONAR_USUARIOS` |
| `/finanzas` + `/api/gastos` | `VER_GASTOS` |

**Credenciales del Seed (admin maestro):**
- Email: `admin@duhvia.com`
- Contraseña: `DuhviaMaster2026!`
- Rol: `DUEÑO` (acceso total)

### 2.3 Capa Criptográfica (Application-Level Encryption — ALE)

**CRITICO:** Muchos campos sensibles están **encriptados en la base de datos**. Las APIs deben descifrarlos antes de retornarlos al frontend.

- **Algoritmo:** AES-256-GCM con clave maestra `ENCRYPTION_KEY` (32 chars)
- **Formato almacenado:** `ivHex:tagHex:encryptedHex`
- **Búsqueda:** No se pueden hacer `WHERE campo_cifrado LIKE '%x%'` en SQL. Se usan **Blind Indexes**: columnas `idx_*` con hash SHA-256 determinista del dato original en minúsculas sin espacios.
- **Transacciones Prisma:** Todos los cambios de stock usan `prisma.$transaction()` para actualizar stock + registrar en Kardex atómicamente.

**Campos cifrados por entidad:**
- `Producto`: `nombreCifrado`, `precioVentaCifrado`, `stockCifrado`, `detallesCifrados`
- `Cliente`: `nombreCifrado`, `documentoCifrado`, `telefonoCifrado`, `correoCifrado`, `direccionCifrado`
- `Kardex`: `cantidadCifrada`, `motivoCifrado`
- `Orden`: `subtotalCifrado`, `totalCifrado`
- `GastoInterno`: `motivoCifrado`, `montoCifrado`

### 2.4 API Endpoints Implementados

#### Módulo: Productos/Inventario (COMPLETO)
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/productos` | Lista paginada con filtros: `page`, `limit`, `search`, `categoria`, `stockStatus`, `tipoAutoparteId`. Retorna métricas (Total SKUs, Agotados, Stock Bajo, Valor Total). Descifra en memoria. |
| `POST` | `/api/productos` | Crea producto con cifrado AES + registro Kardex |
| `GET` | `/api/productos/[id]` | Obtiene un producto por ID (descifrado) |
| `PATCH` | `/api/productos/[id]` | Edita producto. Si cambia precio, registra en `HistorialPrecio`. |
| `DELETE` | `/api/productos/[id]` | **Soft delete** — pone `isActive: false` |
| `POST` | `/api/productos/[id]/restock` | Suma stock al producto + crea movimiento `INGRESO` en Kardex |
| `GET` | `/api/tipos-autoparte` | Lista todos los tipos de autopartes activos |
| `POST` | `/api/tipos-autoparte` | Crea un nuevo tipo de autoparte relacional |
| `PATCH` | `/api/tipos-autoparte/[id]` | Edita el nombre de un tipo de autoparte (valida duplicados) |
| `DELETE` | `/api/tipos-autoparte/[id]` | **Soft delete** — pone `isActive: false` |

**Umbrales de Stock Bajo:**
- Autopartes: `stock < 10` → estado `LOW_STOCK`
- Motores: `stock < 2` → estado `LOW_STOCK`
- `stock == 0` → estado `OUT_OF_STOCK`

#### Módulo: Ventas y Cotizaciones (COMPLETO)
| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/ordenes` | Lista paginada con filtros: `tipo`, `estado`, `search`, `page`, `limit`. Retorna métricas (Ventas MTD, Cotizaciones activas, Tasa conversión, Ticket promedio). Descifra en memoria. |
| `POST` | `/api/ordenes` | Crea orden (COTIZACION o VENTA). Si VENTA: descuenta stock + Kardex SALIDA en transacción atómica. |
| `GET` | `/api/ordenes/[id]` | Detalle completo descifrado con cliente, items (nombres/precios congelados) y totales. |
| `PATCH` | `/api/ordenes/[id]` | Acción `anular` (restaura stock de VENTA) o `convertirAVenta` (COTIZACION→VENTA+COMPLETADA, descuenta stock+Kardex). |
| `GET` | `/api/metodos-pago` | Lista métodos de pago. Auto-seed de defaults si tabla vacía (Efectivo, Yape, Plin, etc.). |

#### Otros Módulos (Estado: Implementados pero UI pendiente de integración)
| Endpoint Base | Estado Backend | Estado Frontend |
|---|---|---|
| `/api/auth/login` | Completo | Login funcional |
| `/api/clientes` | Completo | Vista básica sin CRUD completo |
| `/api/ordenes` | **Completo con filtros** | **Vista completa con tabs, KPIs, modales** |
| `/api/kardex` | Completo | Sin vista propia |
| `/api/ingresos` | Completo | Sin vista de lotes |
| `/api/usuarios` | Completo | Vista básica |
| `/api/gastos` | Completo | Vista básica |
| `/api/accesos` | Completo | Sin vista de gestión de permisos |

### 2.5 Modelo de Base de Datos (Entidades Principales)

Schema actual en `prisma/schema.prisma` — **Migración v3 aplicada**.

```
Rol ──────────────── Usuario ─── UsuarioPermiso ─── Permiso
                         |
                    RolPermisoBase ─── Permiso
                         |
                    ┌────┴────────────────┐
                    |                     |
                   Orden               Ingreso
                    |                     |
              DetalleOrden          DetalleIngreso
                    |                     |
              Producto <─────────────────┘
                 |  └── TipoAutoparte (FK: tipoAutoparteId?)
                 |
              HistorialPrecio
              HistorialNombre
              Kardex
              DetalleIngreso
              DetalleOrden

Cliente ──── Orden ──── DetalleOrden
MetodoPago ──── Orden
GastoInterno ──── Usuario
```

**Enums relevantes:**
- `CategoriaProducto`: `AUTOPARTE | MOTOR`
- `TipoOrden`: `COTIZACION | VENTA`
- `EstadoOrden`: `PENDIENTE | COMPLETADA | ANULADA`
- `TipoMovimientoKardex`: `INGRESO | SALIDA | AJUSTE`

### 2.6 Variables de Entorno Requeridas (`.env` en `erp-taller/`)

```env
DATABASE_URL="postgresql://admin:adminpassword@localhost:5432/erp_taller?schema=public"
JWT_SECRET="DuhviaERP_Super_Secret_JWT_Key_2026!"
ENCRYPTION_KEY="DuhviaERP_Secreta_32_Caracteres!"
```

---

## 3. Estado de los Componentes (UI/UX) — Mapeo de Pantallas

### 3.1 Dashboard Principal (`/` → `app/page.tsx`)

**Estado: COMPLETO Y AMPLIADO CON ANÁLISIS FINANCIERO Y DATOS DE COMPRAS**  
**Mockup:** `docs/04_mockups/dashboard_de_control/screen.png`

| Sub-componente | Archivo | Estado | Descripción |
|---|---|---|---|
| Página (Server Component) | `app/page.tsx` | Listo | Vista principal con 6 KPIs operativos y financieros (incluyendo Compras del Mes y Lotes Recibidos) |
| Tarjetas de métricas | `components/dashboard/StatCard.tsx` | Listo | 6 tarjetas: Ventas, Órdenes, Stock, Clientes, Compras del Mes, Lotes Recibidos |
| Módulo Financiero Interactivo | `components/dashboard/FinancialDashboardView.tsx` | Listo | 5 KPIs financieros (Ingresos, Gastos, Ganancias, Margen %, Inversión en Compras), gráfico con 4 series (Ingresos, Gastos, Compras Inventario, Ganancia Neta) y exportaciones |
| Gráfico de Ingresos (Legacy) | `components/dashboard/SalesChart.tsx` | Listo | Gráfico básico previo de ingresos a 7 días |
| API Financiera del Dashboard | `app/api/dashboard/financiero/route.ts` | Listo | Endpoint `GET /api/dashboard/financiero?periodo=...` |
| Servicio de métricas | `modules/dashboard/dashboard.service.ts` | Listo | Lógica de negocio para métricas e histórico financiero, incluyendo datos de Ingreso (compras de adquisición) |

**Datos y Funcionalidades Financieras:**
- **Métricas:** Ingresos Totales, Gastos Totales (Caja Chica), Ganancia Neta, Margen de Ganancia (%), **Inversión Total en Compras (Adquisición de Mercadería)**, **Compras del Mes**, **Lotes Recibidos del Mes**.
- **Gráfico Comparativo Recharts:** 4 series simultáneas — Ingresos (verde), Gastos (rojo), Compras Inventario (violeta, barras) y Ganancia Neta (azul, línea).
- **`PuntoFinanciero`**: ahora incluye campo `compras: number` en todas las series históricas.
- **Filtros de Temporalidad:** Selección dinámica entre **Anual** (12 meses), **Trimestral** (Q1, Q2, Q3, Q4), **Mensual** (bloques de 30 días) y **Últimos 7 días**.
- **Exportación de Histórico Financiero:** CSV y Excel ahora incluyen columna **Compras Inventario (S/)**.
- **Últimas Órdenes Creadas:** Lista con estado y montos en tiempo real.

---

### 3.2 Gestión de Inventario (`/inventario` → `app/inventario/page.tsx`)

**Estado: COMPLETO Y FUNCIONAL CON GESTIÓN COMPLETA DE TIPOS**  
**Mockup:** `docs/04_mockups/gesti_n_de_inventario/screen.png`

| Componente | Archivo | Tamaño | Estado | Descripción |
|---|---|---|---|---|
| Vista Principal | `components/views/inventario/InventarioView.tsx` | ~36 KB | Listo | Componente maestro con todos los estados |
| Modal Crear | `components/views/inventario/CrearProductoModal.tsx` | 20.4 KB | Listo | Formulario adaptativo Autoparte/Motor con botón "+" inline |
| Modal Editar | `components/views/inventario/EditarProductoModal.tsx` | 17.6 KB | Listo | Edición completa con pre-llenado de datos |
| Modal Restock | `components/views/inventario/RestockModal.tsx` | 5.2 KB | Listo | Ingreso rápido de mercadería |
| Modal Confirmar Borrado | `components/views/inventario/ConfirmDeleteModal.tsx` | 3.2 KB | Listo | Soft-delete con confirmación |
| **Modal Gestionar Tipos** | `components/views/inventario/GestionarTiposModal.tsx` | ~7 KB | **Nuevo** | CRUD completo de tipos de autoparte: crear, editar inline, eliminar con confirmación |

**Funcionalidades activas en `InventarioView.tsx`:**
- **Bento Grid de métricas** (Total SKUs, Agotados, Stock Bajo, Valor Total) — datos reales de la API
- **Búsqueda con debounce (300ms)** — busca en nombre de producto
- **Tabs de filtro:** Todo | Autopartes | Motores | Reabastecimiento
- **Dropdown de Tipo de Autoparte** — cargado dinámicamente desde `/api/tipos-autoparte`
- **Tabla de alta densidad** con paginación real, skeletons de carga, badges de stock coloreados
- **Banner "Low Stock Advisory"** — aparece dinámicamente si hay items críticos/agotados; al hacer clic redirige al tab "Reabastecimiento"
- **CRUD Completo:** Crear, Editar, Restock, Soft-Delete
- **Botón "Tipos de Autoparte"** — abre `GestionarTiposModal` con gestión CRUD completa de tipos
- **`GestionarTiposModal`:** Crear nuevos tipos, editar nombre inline con validación de duplicados, eliminar con confirmación. Sincroniza automáticamente con los dropdowns del modal de creación y edición de productos.

---

### 3.3 Layout Global (Sidebar + Navbar)

**Estado: COMPLETO CON RESPONSIVIDAD MOBILE**

| Componente | Archivo | Estado | Descripción |
|---|---|---|---|
| AppLayout | `components/layout/AppLayout.tsx` | Listo | Contenedor principal. Margen dinámico `lg:ml-[18rem] ml-0` |
| Sidebar | `components/layout/Sidebar.tsx` | Listo | Navegación lateral. En móvil: flotante/hamburguesa |
| Navbar | `components/layout/Navbar.tsx` | Listo | Barra superior **simplificada**: botón hamburguesa (móvil), toggle Dark Mode y avatar de usuario. La barra de búsqueda y campana de notificaciones fueron ocultadas por solicitud del cliente. |

**Navegación disponible en el Sidebar:**
- Dashboard (`/`)
- Inventario (`/inventario`) — Requiere permiso `VER_PRODUCTOS`
- Órdenes (`/ordenes`) — Requiere permiso `VER_ORDENES`
- Clientes (`/clientes`) — Requiere permiso `VER_CLIENTES`
- Finanzas (`/finanzas`) — Requiere permiso `VER_GASTOS`
- Usuarios (`/usuarios`) — Requiere permiso `GESTIONAR_USUARIOS`

---

### 3.4 Primitivos UI (`components/ui/`)

**Estado: TODOS DISPONIBLES**

| Componente | Archivo | Uso |
|---|---|---|
| `Button` | `ui/Button.tsx` | Variantes: primary, secondary, ghost, danger |
| `Input` | `ui/Input.tsx` | Campos de texto estilizados con focus rojo |
| `Modal` | `ui/Modal.tsx` | Wrapper de modal con backdrop y animación |
| `Select` | `ui/Select.tsx` | Dropdown estilizado |
| `Skeleton` | `ui/Skeleton.tsx` | Shimmer de carga (loading state) |
| `Table` | `ui/Table.tsx` | Tabla con scroll horizontal en móvil |
| `Toast` | `ui/Toast.tsx` | Notificaciones tipo toast |

---

### 3.5 Módulos con Vista Básica (Pendientes de Integración Completa)

#### Clientes (`/clientes`)
| Componente | Archivo | Estado |
|---|---|---|
| Vista | `components/views/clientes/ClientesView.tsx` | Vista básica (esqueleto) |
| Modal Crear | `components/views/clientes/CrearClienteModal.tsx` | Formulario básico, integración incompleta |

#### Ordenes/Ventas/Cotizaciones (`/ordenes`)
| Componente | Archivo | Estado |
|---|---|---|
| Vista | `components/views/ordenes/OrdenesView.tsx` | Vista esqueleto |
| Modal Crear Orden | `components/views/ordenes/CrearOrdenModal.tsx` | Formulario presente, integración pendiente |

**Mockup de referencia:** `docs/04_mockups/ventas_y_cotizaciones/screen.png`

#### Finanzas / Gastos (`/finanzas`)
| Componente | Archivo | Estado |
|---|---|---|
| Vista | `components/views/finanzas/GastosView.tsx` | Vista esqueleto |
| Modal Crear Gasto | `components/views/finanzas/CrearGastoModal.tsx` | Formulario básico |

#### Usuarios (`/usuarios`)
| Componente | Archivo | Estado |
|---|---|---|
| Vista | `components/views/usuarios/UsuariosView.tsx` | Vista esqueleto |
| Modal Crear Usuario | `components/views/usuarios/CrearUsuarioModal.tsx` | Formulario básico |

**Mockup de referencia:** `docs/04_mockups/administraci_n_usuarios_y_gastos/screen.png`

---

## 4. Roadmap y Tablero de Tareas (Backlog)

### 4.1 [X] Tareas Completadas (Validadas y en Producción)

#### Infraestructura y Base de Datos
- [X] **Schema Prisma v3** — Modelo `TipoAutoparte` creado y relacionado con `Producto` (`tipoAutoparteId String? @db.Uuid`)
- [X] **Migración aplicada** — `pnpm prisma migrate dev --name add_tipo_autoparte`
- [X] **ERD actualizado** — `docs/03_arquitectura/modelo_db_v3.svg`

#### Backend — Módulo de Inventario
- [X] `GET /api/productos` — Paginación, filtros por categoría, stockStatus, tipoAutoparteId, búsqueda con blind index y descifrado en memoria, cálculo de métricas globales
- [X] `POST /api/productos` — Crear producto con cifrado AES + registro Kardex
- [X] `PATCH /api/productos/[id]` — Editar producto, detectar cambio de precio → `HistorialPrecio`
- [X] `DELETE /api/productos/[id]` — Soft delete (`isActive: false`)
- [X] `POST /api/productos/[id]/restock` — Suma stock al producto + crea `INGRESO` en Kardex (transacción atómica)
- [X] `GET /api/tipos-autoparte` — Listar tipos de autopartes
- [X] `POST /api/tipos-autoparte` — Crear tipo de autoparte relacional
- [X] `producto.dto.ts` — Actualizado para incluir `tipoAutoparteId`
- [X] `producto.service.ts` — Métodos `crear`, `actualizar`, `obtenerTodos`, `registrarReposicion` actualizados con relación `tipoAutoparte`

#### Frontend — Layout y Navegación
- [X] `AppLayout.tsx` — Responsividad mobile (margen dinámico)
- [X] `Sidebar.tsx` — Menú hamburguesa flotante en móvil
- [X] `Navbar.tsx` — Botón hamburguesa + barra de búsqueda funcional

#### Frontend — Módulo de Inventario (COMPLETO)
- [X] `InventarioView.tsx` — Bento Grid de métricas, debounce de búsqueda, tabs, paginación real, skeletons, banner de Low Stock Advisory
- [X] `CrearProductoModal.tsx` — Formulario adaptativo (Autoparte/Motor) + botón "+" para crear tipo en caliente
- [X] `EditarProductoModal.tsx` — Edición con pre-llenado y campos adaptativos
- [X] `RestockModal.tsx` — Ingreso rápido de mercadería con motivo
- [X] `ConfirmDeleteModal.tsx` — Confirmación de soft-delete

#### Pruebas y Validación
- [X] **38 tests unitarios** en 11 archivos (`__tests__/`) — Todos pasan
- [X] Test específico: `registrarReposicion` incrementa stock + crea Kardex `INGRESO`
- [X] **Build de producción** verificado (`pnpm build` exitoso)

---

### 4.2 [ ] Tareas en Progreso (Estado al 2026-07-11)

> No hay tareas activamente en desarrollo. El módulo de inventario fue el último en completarse. El sistema queda listo para avanzar al siguiente módulo.

---

### 4.3 [ ] Tareas Pendientes — Próximos Pasos (Ordenados por Prioridad)

#### ~~PRIORIDAD ALTA — Módulo de Ventas y Cotizaciones~~ ✅ COMPLETADO

**HUs referenciadas:** HU-010, HU-011, HU-012, HU-013, HU-014  
**Mockup:** `docs/04_mockups/ventas_y_cotizaciones/screen.png`

- [X] **`OrdenesView.tsx`** reescrito — KPI grid (Ventas MTD, Cotizaciones activas, Tasa conversión, Ticket promedio), tabs Ventas/Cotizaciones/Anuladas, tabla con paginación, debounce búsqueda
- [X] **`CrearOrdenModal.tsx`** reescrito — combobox de cliente/producto con búsqueda en memoria, líneas de detalle editables, selector métodoPago para VENTAs, validación de stock
- [X] **`VerOrdenModal.tsx`** creado — detalle completo con tabla de ítems, botón "Convertir a Venta" (descuenta stock + Kardex), botón "Anular" con confirmación (restaura stock si era VENTA)
- [X] **`GET /api/ordenes`** con filtros (tipo, estado, search, page, limit) + métricas calculadas
- [X] **`GET /api/ordenes/[id]`** — detalle completo descifrado con detalles del cliente
- [X] **`PATCH /api/ordenes/[id]`** — acciones `anular` y `convertirAVenta` (transaccionales, ajustan Kardex)
- [X] **`GET /api/metodos-pago`** — auto-seed de métodos por defecto (Efectivo, Yape, Plin, etc.)
- [X] Descuento/reposición de stock integrado directamente en `orden.service.ts` (transacciones Prisma)
 
#### PRIORIDAD MEDIA — Módulo de Ingresos/Compras (Lotes) ✅ COMPLETADO

**HUs referenciadas:** HU-006 (Registrar reposición), HU-019, HU-020

- [X] **`IngresosView.tsx`** creado — Bento Grid de KPIs (Compras del Mes, Lotes Recibidos, Lote Promedio, Productos Ingresados), buscador dinámico y tabla paginada.
- [X] **`CrearIngresoModal.tsx`** creado — Formulario interactivo con combobox de productos, tabla dinámica de items (cantidad, costo, nuevo precio venta opcional) y cálculo del total en tiempo real.
- [X] **`VerIngresoModal.tsx`** creado — Ficha del lote que detalla notas, fecha, usuario responsable y desglose de items.
- [X] **`GET /api/ingresos`** e **`api/ingresos/[id]`** integrados en el backend, incluyendo descifrado en memoria y cálculo de métricas.
- [X] Permisos `VER_INGRESOS` registrados en `proxy.ts` para seguridad RBAC.
- [X] **Pruebas unitarias** completadas y validadas con 100% de éxito.

#### PRIORIDAD MEDIA — Módulo de Finanzas / Gastos ✅ COMPLETADO

**HUs referenciadas:** HU-021 a HU-023 (Gastos internos, caja chica)  
**Mockup:** `docs/04_mockups/administraci_n_usuarios_y_gastos/screen.png`

- [X] **`GastosView.tsx`** rediseñado por completo — Bento Grid de KPIs (Gastado en el Mes, Promedio Diario, Transacciones del Mes), buscador dinámico con debounce y tabla con columna de acciones.
- [X] **`CrearGastoModal.tsx`** completado — Formulario con campo Fecha, obtención del `usuarioId` activo del contexto de sesión y llamada a `POST /api/gastos`.
- [X] **`EditarGastoModal.tsx`** creado — Modal para editar cualquier gasto registrado en caliente (`PATCH /api/gastos/[id]`).
- [X] **`ConfirmAnularGastoModal.tsx`** creado — Modal para confirmación y soft-delete de gastos (`DELETE /api/gastos/[id]`).
- [X] **`GET /api/gastos`** actualizado — Carga de gastos con soporte para paginación y búsqueda real.
- [X] **Pruebas unitarias** extendidas en `finanzas.test.ts` con cobertura completa (100% aprobado).

#### ~~PRIORIDAD ALTA — Módulo de Clientes~~ ✅ COMPLETADO

**HUs referenciadas:** HU-007, HU-008, HU-009

- [X] **`ClientesView.tsx`** reescrito — KPI grid (Total, Activos, Nuevos este mes), tabla con búsqueda debounce, paginación, acciones por fila (Ver, Editar, Desactivar con confirmación inline)
- [X] **`CrearClienteModal.tsx`** completado — validación manual + llamada real a POST /api/clientes, manejo de errores del servidor
- [X] **`EditarClienteModal.tsx`** creado — pre-relleno desde datos del cliente, PATCH /api/clientes/[id]
- [X] **`VerClienteModal.tsx`** creado — ficha completa (perfil, contacto, dirección, fecha), estadísticas (total órdenes, ventas, monto total comprado), historial de órdenes con estados
- [X] **`GET /api/clientes`** actualizado — soporte para `search`, `page`, `limit` + métricas (totalClientes, nuevosEsteMes)
- [X] **`GET /api/ordenes`** actualizado — nuevo parámetro `clienteId` para filtrar órdenes por cliente





#### ~~PRIORIDAD MEDIA — Módulo de Kardex~~ ✅ COMPLETADO

**HUs referenciadas:** HU-025, HU-026 (Trazabilidad de movimientos de inventario)

- [X] **`VerKardexModal.tsx`** creado e integrado en `components/views/inventario/VerKardexModal.tsx` — Modal de auditoría con historial de movimientos, trazabilidad por usuario y motivo.
- [X] **Filtros e indicadores visuales** — Selección por tipo de movimiento (INGRESO/SALIDA/AJUSTE), rango de fechas y producto específico.
- [X] **Fila de Stock Total y Paginación** — Resumen visual del stock total acumulado con scroll adaptativo y diseño responsive.

#### ~~PRIORIDAD BAJA — Módulo de Usuarios y Permisos~~ ✅ COMPLETADO

**HUs referenciadas:** HU-015 a HU-018 (RBAC, gestión de usuarios)

- [X] **`UsuariosView.tsx`** reescrito — Tabla con lista de usuarios activos e inactivos, roles, correo y acciones.
- [X] **`CrearUsuarioModal.tsx`** completado — Selección dinámica de roles y permisos individuales mediante chips interactivos, validación y llamado a API.
- [X] **`GestionarPermisosModal.tsx`** creado — Asignación y revocación granular de permisos por usuario (`GET/POST/PUT /api/usuarios/[id]/permisos`).
- [X] **Seguridad RBAC (`proxy.ts`)** — Migrado middleware a Edge Runtime `proxy.ts` para validación centralizada de rutas API y vistas por token/permisos.
- [X] **`unauthorized/page.tsx`** — Pantalla de acceso denegado personalizada en caso de no contar con los permisos del rol.
- [X] **Nombre de Rol Dinámico & Logout** — Integrado nombre de rol dinámico en Sidebar y botón de cerrar sesión en `AuthProvider`.

#### ~~PRIORIDAD BAJA — Mejoras de UX Transversales y Exportaciones~~ ✅ COMPLETADO

- [X] **Página `unauthorized/`** — Pantalla de acceso denegado implementada y en funcionamiento.
- [X] **Cerrar Sesión** — Botón de logout disponible en el Sidebar con limpieza de token de sesión.
- [X] **Exportación a PDF** — Generación de proformas y notas de pedido directamente desde las tablas con `jspdf`.
- [X] **Dark Mode Toggle & Persistencia** — Switch en Navbar integrado con `localStorage` y `.dark` en `<html>`.
- [X] **Exportación CSV y Excel (`.xlsx`)** — Utilidades `lib/csvExport.ts` (UTF-8 BOM) y `lib/excelExport.ts` (`xlsx`) integradas en Inventario, Kardex, Ventas, Gastos y Dashboard.
- [X] **Plantilla Excel de Ejemplo para Inventario** — Función `downloadInventoryTemplate()` en `lib/inventoryTemplate.ts` y botón "Plantilla Excel" en InventarioView para estandarizar la migración de datos.
- [X] **Dashboard Financiero por Periodos** — Módulo `FinancialDashboardView` con métricas de Ingresos, Gastos, Ganancias y Margen %, gráficos filtrables (Anual, Trimestral, Mensual, 7 días) e historial exportable en CSV y Excel.

#### ~~PRIORIDAD MEDIA — Generación de Documentos~~ ✅ COMPLETADO

- [X] **`lib/pdfGenerator.ts`** implementado con `jspdf` y `jspdf-autotable`.
- [X] **PDF Proforma (Cotizaciones)** — Formato oficial A8F Samfor con detalles del cliente, desglose de ítems, subtotal, IGV/Total y observaciones.
- [X] **PDF Nota de Pedido (Ventas)** — Formato de comprobante interno de venta listo para descarga e impresión.
- [X] **Integración de Botones de Descarga** — Descarga directa desde la tabla `OrdenesView.tsx` y dentro de `VerOrdenModal.tsx`.

#### ~~PRIORIDAD ALTA — Migración de Datos Inicial~~ ✅ COMPLETADO

- [X] **Archivo Fuente** — Carga de plantilla `docs/data/Control_Inventario_Automotores.xlsx`.
- [X] **Herramienta/Script de Importación** — Script CLI `scripts/importar_inventario.ts`, API Route `/api/inventario/importar` y modal interactivo `ImportarInventarioModal.tsx` para la migración masiva e importación directa desde Excel.

---

### 4.4 Feedback y Correcciones del Cliente — Sesión 2026-07-30 ✅ COMPLETADO

#### 📌 Módulo de Inventario — Gestión de Tipos de Autoparte ✅ COMPLETADO
- [X] **API `PATCH /api/tipos-autoparte/[id]`** — Editar nombre de tipo con validación de duplicados insensible a mayúsculas.
- [X] **API `DELETE /api/tipos-autoparte/[id]`** — Soft delete de tipo de autoparte (`isActive: false`).
- [X] **`GestionarTiposModal.tsx`** — Nuevo modal CRUD accesible desde `InventarioView` con botón "Tipos de Autoparte". Permite crear, editar inline y eliminar con confirmación. Sincroniza automáticamente los dropdowns en `CrearProductoModal` y `EditarProductoModal`.

#### 📌 Dashboard — Ingresos de Inventario / Compras de Adquisición ✅ COMPLETADO
- [X] **`dashboard.service.ts`** ampliado — `PuntoFinanciero` ahora incluye `compras: number`. `obtenerMetricasGenerales()` retorna `totalInvertidoCompras`, `totalComprasMes` y `cantidadLotesMes` a partir de la tabla `Ingreso`.
- [X] **`FinancialDashboardView.tsx`** actualizado — Nueva 5ª card financiera **"Inversión en Compras"** (violeta). Nueva barra `compras` (violeta `#8B5CF6`) en el gráfico Recharts. Tooltip y leyenda actualizados. CSV y Excel exportan la columna de compras.
- [X] **`app/page.tsx`** actualizado — 6 StatCards operativas (grid `xl:grid-cols-3`): Ventas, Órdenes, Stock, Clientes, **Compras del Mes** (ShoppingBag) y **Lotes Recibidos del Mes** (Truck).

#### 📌 Layout — Navbar Simplificado ✅ COMPLETADO
- [X] **`Navbar.tsx`** actualizado — Se ocultaron la barra de búsqueda y la campana de notificaciones por solicitud del cliente. El navbar conserva: botón hamburguesa (solo móvil), toggle Dark Mode y avatar de usuario.

---

### 4.4 Feedback y Correcciones del Cliente ✅ COMPLETADO (100%)

#### 📌 Módulo de Gastos / Finanzas ✅ COMPLETADO
- [X] **Fix de Fecha en Gastos**: Resolver el desfasaje de fecha seleccionada en `CrearGastoModal` y `EditarGastoModal` "Al seleccionar la fecha del calendario el sistema lo guarda con la fecha del dia anterior".
- [X] **Cierre Automático de Modal**: `CrearGastoModal.tsx` y `EditarGastoModal.tsx` invocan `onClose()` inmediatamente al registrar o editar un gasto exitosamente.

#### 📌 Módulo de Ventas / Cotizaciones ✅ COMPLETADO
- [X] **Cálculo y Visualización de Ganancia Estimada**: Integrada la columna de P. Costo y la tarjeta interactiva de **Ganancia Estimada Proyectada (S/)** y **Margen de Ganancia (%)** en tiempo real dentro de `CrearOrdenModal.tsx`.
- [X] **Obtencion Automatica de precio de compra**: Enriquecimiento automático en `ProductoService.obtenerTodos` y `GET /api/productos` para extraer el último costo de compra de `DetalleIngreso`/`HistorialPrecio` y autocompletar `precioCosto` al agregar productos en `CrearOrdenModal.tsx`.

---

### 4.5 [ ] Nuevos Requerimientos y Ajustes del Cliente (Sesión 2026-08-01)

- [X] **1. Rediseño y Mejora de Formato PDF de Órdenes (Ventas y Cotizaciones)** — Aplicar paleta corporativa (`#DB052B`, `#1A1A1A`), agregar dirección "Calle Espinar 311" e incluir logotipo (`public/LOGO.png`), tomando como base la plantilla `docs/06_plantillas/FORMATO COTIZACIÓN - PROFORMA.xlsx`.
- [X] **2. Precio de Compra en Plantilla Excel de Inventario** — Agregar la columna `Precio Compra (S/)` y datos de ejemplo en `lib/inventoryTemplate.ts`.
- [X] **3. Exportación a Excel y CSV en Compras y Reabastecimiento** — Agregar botones de exportación CSV y Excel en `IngresosView.tsx` (Compras) y en la sección/tab de Reabastecimiento en `InventarioView.tsx`.
- [X] **4. Cambio de Contraseña e Inhabilitación de Usuarios** — Crear modal de cambio de contraseña para el rol DUEÑO y permitir inhabilitar/deshabilitar el acceso al sistema (`accesoSistema: false`).
- [X] **5. Control de Permisos y Jerarquía de Usuarios** — Restringir que un usuario pueda auto-modificarse (inhabilitarse o editar sus propios permisos) o alterar usuarios de roles superiores, mostrando alerta Toast informativa.
- [X] **6. Fix de Desfasaje de Fecha en Gastos** — Corregir la discrepancia de zona horaria UTC en `CrearGastoModal`, `EditarGastoModal` y `GastosView` para registrar exactamente la fecha seleccionada.
- [X] **7. Atajo Rápido para Crear Cliente en CrearOrdenModal** — Agregar botón `+ Nuevo Cliente` en el modal de órdenes que abra `CrearClienteModal` y autoseleccione el cliente recién creado.
- [X] **8. Cotizaciones Flexibles (Stock Cero, Edición y Conversión a Venta Validada)** — Permitir agregar productos con stock 0 en cotizaciones, habilitar la edición de cotizaciones `PENDIENTE` y validar el stock real al momento de convertir a Venta.
- [X] **9. Logo 2 en Theme Dark** — Configurar el Sidebar/Layout para conmutar dinámicamente el logo a `/LOGO 2.png` (`siteConfig.logo_2`) cuando se activa el Dark Mode.

---

### 4.6 [ ] Ajustes del Cliente — Módulo de Inventario (Sesión 2026-08-07) ✅ COMPLETADO

- [X] **Precio de Compra Directo en Productos** — Añadido el campo `precioCompraCifrado` al modelo `Producto` en Prisma, actualizado DTO y `ProductoService` para guardar y actualizar `HistorialPrecio`.
- [X] **Formulario de Creación y Edición de Productos** — Añadido el campo "Precio de Compra (S/)" en `CrearProductoModal` y `EditarProductoModal`.
- [X] **Estados Físicos de Producto** — Reemplazada la opción "Reconstruido" por "Importado" (opciones activas: `Nuevo`, `Usado`, `Importado`).
- [X] **Pruebas Unitarias** — Añadida prueba en `producto.service.test.ts` verificando el guardado de `precioCompra` y la respuesta de `precioCosto` descifrada.


---

## 5. Guía de Inicio Rápido para Agentes de IA

### Para continuar el desarrollo inmediatamente:

```bash
# 1. Navegar al directorio del código
cd erp-taller/

# 2. Levantar la base de datos (Docker debe estar corriendo)
make db-up

# 3. Iniciar la aplicación en modo desarrollo
make dev

# 4. Ejecutar pruebas unitarias
make test

# 5. (Opcional) Ver datos cifrados en Prisma Studio
make studio
```

### Convenciones de Código a Respetar

1. **Nunca** cifrar/descifrar datos directamente en los componentes — siempre a través de las APIs.
2. **Siempre** usar `prisma.$transaction()` cuando una operación modifique stock + Kardex simultáneamente.
3. Los **Blind Indexes** (`idx_*`) se generan en el service antes de guardar — no en el frontend.
4. Los formularios deben validarse con **Zod** en el DTO del módulo correspondiente (en `modules/`).
5. Las clases CSS deben seguir el **Design System** definido en `colors.css` — usar `text-primary`, `bg-neutral-light`, etc. No usar colores hardcodeados fuera de esos tokens.
6. Todos los textos visibles para el usuario deben estar en **español latinoamericano** (la app está orientada a Perú).
7. Los nuevos módulos deben seguir la estructura: `modules/[modulo]/[modulo].service.ts` + `[modulo].dto.ts`.

### Historial de Sesiones de IA

| Sesión ID / Rama | Descripción | Estado |
|---|---|---|
| `f0fe5a16` | Análisis inicial de la arquitectura del proyecto SIAFS | Completado |
| `e34c681c` | Implementación completa del módulo de Inventario (CRUD, APIs, UI, Tests) | Completado |
| `0c767fd8` | Generación de CONTEXT.md centralizado | Completado |
| `maxs-branch` | Módulo de Ventas y Cotizaciones (OrdenesView, CrearOrdenModal, VerOrdenModal, API ordenes+metodos-pago) | Completado |
| `diego-branch` | Módulo de Usuarios y Permisos RBAC, Middleware Proxy, Modal de Kardex, Generación PDF Proformas | Completado |
| `ff586395` | Gestión CRUD de Tipos de Autoparte (modal + endpoints), Dashboard con métricas de Compras/Adquisición, Navbar simplificado | Completado |

---

*Generado automáticamente el 2026-07-30 por Antigravity AI. Para actualizar este archivo, solicitar al agente que analice los cambios más recientes y actualice las secciones correspondientes.*
