# CONTEXT_AUTENTICACION_Y_ACCESO.md — Módulo de Autenticación, Seguridad Criptográfica y Middleware Proxy (SIAFS ERP)

> **🤖 MANUAL DE CONTEXTO PARA AGENTES DE IA:**
> Este documento contiene TODA la información técnica, arquitectónica y operacional del módulo de **Autenticación, Seguridad Criptográfica (ALE/Blind Index) y Middleware RBAC (Proxy)**.
> Utiliza este archivo cuando necesites realizar cambios en login, firmas JWT, verificación de sesiones, cifrado de datos o control de acceso por roles sin cargar el contexto global.

---

## 1. Ficha Técnica del Módulo

| Campo | Detalle |
|---|---|
| **Nombre del Módulo** | Autenticación, Seguridad Criptográfica y Control de Acceso (RBAC) |
| **Identificador Interno** | `auth` / `accesos` / `proxy` / `crypto` |
| **Rol en SIAFS** | Proteger el sistema mediante autenticación JWT en Edge Runtime, aplicar encriptación nivel aplicación (ALE) a datos sensibles y restringir rutas API/Frontend según roles/permisos. |
| **Ruta Backend/Servicios** | [auth.service.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/modules/auth/auth.service.ts), [acceso.service.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/modules/accesos/acceso.service.ts), [crypto.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/lib/crypto.ts), [proxy.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/proxy.ts) |
| **Ruta API Handlers** | `app/api/auth/login/route.ts`, `app/api/accesos/route.ts` |
| **Ruta UI/Frontend** | `app/login/page.tsx`, `components/providers/AuthProvider.tsx`, `app/unauthorized/page.tsx` |
| **Estado del Módulo** | 100% Funcional y en Producción (Edge Runtime con `jose` y `crypto` nativo). |

---

## 2. Propósito y Arquitectura de Negocio

El módulo de Autenticación y Acceso garantiza que:
1. Solo personal autorizado del taller/comercializadora (DUEÑO, ADMINISTRADOR, VENDEDOR, MECANICO) pueda acceder al ERP.
2. Cada petición HTTP sea interceptada en Edge Runtime por `proxy.ts` para verificar la autenticidad del JWT y validar permisos finos (RBAC).
3. Toda la información financiera y personal (nombres de clientes, precios, documentos, montos de gastos, stock) se almacene **encriptada** en la BD mediante AES-256-GCM, impidiendo fuga de datos ante volcados de SQL.
4. Las búsquedas en la BD sobre campos cifrados funcionen de manera segura mediante **Blind Indexes** (hashes deterministas SHA-256).

---

## 3. Modelo de Base de Datos (Prisma Schema)

El módulo interactúa directamente con el esquema RBAC en [schema.prisma](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/prisma/schema.prisma):

```prisma
model Rol {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  nombre      String   @unique @db.VarChar(50)
  isActive    Boolean  @default(true) @map("is_active")
  
  usuarios    Usuario[]
  permisos    RolPermisoBase[]

  @@map("roles")
}

model Permiso {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  codigo      String   @unique @db.VarChar(100) // Ej. "VER_PRODUCTOS", "GESTIONAR_USUARIOS"
  
  roles       RolPermisoBase[]
  usuarios    UsuarioPermiso[]

  @@map("permisos")
}

model RolPermisoBase {
  rolId       String   @map("rol_id") @db.Uuid
  permisoId   String   @map("permiso_id") @db.Uuid
  
  rol         Rol      @relation(fields: [rolId], references: [id], onDelete: Cascade)
  permiso     Permiso  @relation(fields: [permisoId], references: [id], onDelete: Cascade)
  
  @@id([rolId, permisoId])
  @@map("rol_permiso_base")
}

model UsuarioPermiso {
  usuarioId   String   @map("usuario_id") @db.Uuid
  permisoId   String   @map("permiso_id") @db.Uuid
  
  usuario     Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
  permiso     Permiso  @relation(fields: [permisoId], references: [id], onDelete: Cascade)
  
  @@id([usuarioId, permisoId])
  @@map("usuario_permisos")
}

model Usuario {
  id              String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  rolId           String   @map("rol_id") @db.Uuid
  nombre          String   @db.VarChar(255)
  email           String   @unique @db.VarChar(255)
  passwordHash    String   @map("password_hash") @db.VarChar(255)
  salt            String   @db.VarChar(255)
  accesoSistema   Boolean  @default(true) @map("acceso_sistema")
  isActive        Boolean  @default(true) @map("is_active")
  createdAt       DateTime @default(now()) @map("created_at")

  rol             Rol      @relation(fields: [rolId], references: [id])
  permisos        UsuarioPermiso[]
  @@map("usuarios")
}
```

---

## 4. Capa Criptográfica y Seguridad (ALE & Blind Index)

Definida en [crypto.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/lib/crypto.ts):

### A. Application-Level Encryption (ALE)
- **Algoritmo:** AES-256-GCM.
- **Clave Maestra:** Variable de entorno `ENCRYPTION_KEY` (32 caracteres exactos).
- **Formato almacenado en BD:** `ivHex:tagHex:encryptedHex`
- **Funciones principales:**
  - `encrypt(text: string): string`: Genera un IV aleatorio de 12 bytes, encripta y retorna el string serializado.
  - `decrypt(cipherText: string): string`: Parsea el string en IV, Tag y Cyphertext, y descifra los datos. Si el texto no está encriptado (por migración legacy), devuelve el texto original sin romper la aplicación.

### B. Blind Indexing (Búsquedas en Cifrado)
- **Problema:** En SQL no se puede ejecutar `WHERE nombre_cifrado LIKE '%filtro%'` sobre AES.
- **Solución:** `generateBlindIndex(text: string): string`
  - Normaliza la cadena (minúsculas, trim).
  - Calcula HMAC SHA-256 con una clave derivada.
  - Genera una cadena hexadecimal determinista de 64 caracteres.
  - Almacenada en columnas `idx_*` (ej. `idx_documento`, `idx_nombre`).

---

## 5. Middleware de Autenticación y RBAC (`proxy.ts`)

En Next.js App Router, [proxy.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/proxy.ts) actúa como el Middleware de Edge Runtime:

```
[ Petición HTTP ] 
       │
       ▼
[ proxy.ts (Edge Runtime) ]
  ├── 1. ¿Ruta Pública? (/login, /api/auth/login, /_next, etc.) ──► [ CONTINUA ]
  ├── 2. ¿Token JWT presente en Cookie 'auth_token' o Header 'Authorization'?
  │        ├── NO ──► Redirect /login (si página) o 401 Unauthorized (si API)
  │        └── SI ──► Verificación de firma con `jose.jwtVerify()`
  ├── 3. Extrae Payload: { usuarioId, rolId, rolNombre, permisos[] }
  ├── 4. Verificación RBAC de Permiso de Ruta contra ROUTE_PERMISSIONS map:
  │        ├── `/inventario` y `/api/productos` ──► requiere `VER_PRODUCTOS`
  │        ├── `/ordenes` y `/api/ordenes` ───────► requiere `VER_ORDENES`
  │        ├── `/clientes` y `/api/clientes` ─────► requiere `VER_CLIENTES`
  │        ├── `/usuarios` y `/api/usuarios` ─────► requiere `GESTIONAR_USUARIOS`
  │        ├── `/finanzas` y `/api/gastos` ───────► requiere `VER_GASTOS`
  │        └── `/api/ingresos` ──────────────────► requiere `VER_INGRESOS`
  └── 5. Inyección de Headers para Handlers Downstream:
           x-usuario-id: usuarioId
           x-rol-id: rolId
           x-rol-nombre: rolNombre
```

---

## 6. Endpoints de la API

### POST `/api/auth/login`
- **Body:** `{ email: string, password: string }`
- **Proceso:**
  1. Busca el usuario por email.
  2. Verifica `isActive === true` y `accesoSistema === true`.
  3. Compara el password con `passwordHash` usando el `salt` almacenado.
  4. Resuelve la lista combinada de permisos (`RolPermisoBase` + `UsuarioPermiso`).
  5. Genera un token JWT firmado con `JWT_SECRET` (expiración: 8 horas).
  6. Configura una Cookie HTTP-Only `auth_token`.
- **Respuesta `200 OK`:**
  ```json
  {
    "success": true,
    "user": {
      "id": "uuid",
      "nombre": "Diego Dueño",
      "email": "admin@duhvia.com",
      "rol": "DUEÑO",
      "permisos": ["VER_PRODUCTOS", "CREAR_VENTA", "GESTIONAR_USUARIOS", "..."]
    }
  }
  ```

### GET `/api/accesos`
- **Headers requeridos:** JWT activo.
- **Respuesta `200 OK`:** Retorna la matriz de roles y la lista de todos los permisos disponibles en el sistema para la interfaz de gestión.

---

## 7. Componentes de UI / UX

1. **`app/login/page.tsx`**: Pantalla de inicio de sesión estilizada con el tema `Industrial Precision Management`. Incluye logo, campos de texto con focus rojo corporativo, mensajes de error flotantes y botón de carga.
2. **`components/providers/AuthProvider.tsx`**: Contexto React global que expone:
   - `user`: Datos del usuario autenticado y su rol.
   - `permissions`: Lista de permisos.
   - `logout()`: Destruye el token/cookie y redirige a `/login`.
3. **`app/unauthorized/page.tsx`**: Vista de error 403 con mensaje "Acceso Denegado: No posees los permisos necesarios para acceder a este módulo", con botón para regresar al Dashboard.

---

## 8. Tareas Ocultas & Reglas de Negocio Especiales

- **Credenciales del Seed por Defecto:**
  - **Email:** `admin@duhvia.com`
  - **Password:** `DuhviaMaster2026!`
  - **Rol:** `DUEÑO` (acceso a todos los permisos del sistema).
- **Control de Auto-modificación e Inhabilitación:**
  - Un usuario NO puede desactivar su propia cuenta (`accesoSistema: false`) ni despojarse de sus propios permisos en sesión activa.
  - Solamente usuarios con rol `DUEÑO` pueden inhabilitar el acceso de otros usuarios.
- **Persistencia en Edge Runtime:**
  - Se utiliza la librería `jose` en lugar de `jsonwebtoken` nativo de Node.js, ya que `proxy.ts` se ejecuta en Vercel/Next.js Edge Middleware donde no hay soporte para módulos C++ nativos de Node.

---

## 9. Matriz de Relación con otros Módulos

```
 ┌────────────────────────┐
 │ Autenticación y Acceso │
 └───────────┬────────────┘
             │ (Provee Identidad, headers x-usuario-id y verificación de Permisos)
             ├───────────────────────► [ Módulo de Inventario ]
             ├───────────────────────► [ Módulo de Ventas u Órdenes ]
             ├───────────────────────► [ Módulo de Compras ]
             ├───────────────────────► [ Módulo de Gastos ]
             ├───────────────────────► [ Módulo de Clientes ]
             └───────────────────────► [ Módulo de Personal / Usuarios ]
```

---

## 10. Pruebas Unitarias y Cobertura

- Arquivos de test vinculados:
  - `__tests__/auth.test.ts`: Valida hash de passwords, verificación de credenciales, login correcto/incorrecto y bloqueo por `accesoSistema: false`.
  - `__tests__/crypto.test.ts`: Valida encriptación AES-256-GCM, desencriptación y consistencia de Blind Index determinista.

---

## 11. Guía de Modificación para Agentes de IA

1. Si agregas una nueva ruta API o vista de módulo en Next.js, **DEBES** registrar su código de permiso en la constante `ROUTE_PERMISSIONS` de [proxy.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/proxy.ts).
2. Si creas una nueva tabla Prisma con datos personales o de dinero, **SIEMPRE** define los campos como `*_cifrado` y añade el blind index `idx_*` correspondiente en el servicio.
3. No uses `jsonwebtoken` de Node en `proxy.ts`; mantén la importación de `jose` para compatibilidad con Edge Runtime.
