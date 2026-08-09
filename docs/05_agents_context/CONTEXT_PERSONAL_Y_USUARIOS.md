# CONTEXT_PERSONAL_Y_USUARIOS.md — Módulo de Personal, Usuarios y Permisos RBAC (SIAFS ERP)

> **🤖 MANUAL DE CONTEXTO PARA AGENTES DE IA:**
> Este documento contiene TODA la información técnica, reglas de jerarquía de seguridad, esquemas de datos, APIs y componentes del módulo de **Personal, Usuarios y Matriz de Permisos RBAC**.
> Consulta este archivo al modificar la creación de cuentas de usuario, asignación de roles, permisos granulares, cambio de contraseña o inhabilitación de acceso.

---

## 1. Ficha Técnica del Módulo

| Campo | Detalle |
|---|---|
| **Nombre del Módulo** | Gestión de Personal, Cuentas de Usuario y Control de Acceso por Roles (RBAC) |
| **Identificador Interno** | `usuarios` / `accesos` |
| **Rol en SIAFS** | Administrar la plantilla de trabajadores del taller y la comercializadora (Mecánicos, Vendedores, Administradores, Dueño), asignar roles/permisos y controlar la inhabilitación del acceso al ERP. |
| **Ruta Backend/Servicios** | [usuario.service.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/modules/usuarios/usuario.service.ts), [acceso.service.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/modules/accesos/acceso.service.ts) |
| **Ruta API Handlers** | `app/api/usuarios/route.ts`, `app/api/usuarios/[id]/route.ts`, `app/api/usuarios/[id]/permisos/route.ts`, `app/api/accesos/route.ts` |
| **Ruta UI/Frontend** | `app/usuarios/page.tsx`, `components/views/usuarios/UsuariosView.tsx`, `CrearUsuarioModal.tsx`, `GestionarPermisosModal.tsx`, `CambiarPasswordModal.tsx` |
| **Estado del Módulo** | 100% Completo y Aprobado (incluye control de auto-modificación, hashing con salt y modal de cambio de clave para el DUEÑO). |

---

## 2. Propósito y Arquitectura de Negocio

El módulo de Usuarios administra la seguridad de identidad del sistema SIAFS ERP:
1. **Modelado RBAC Flexibles:** Permite definir un rol base (ej. `VENDEDOR`) pero sobrescribir o extender permisos individuales por trabajador mediante la tabla `UsuarioPermiso`.
2. **Cierre Inmediato de Acceso (`accesoSistema: false`):** Permite inhabilitar a un exempleado para que su token deje de ser válido de inmediato en `proxy.ts`.
3. **Jerarquía y Protección de Auto-modificación:** Regla estricta que impide que un usuario se auto-inhabilite o modifique sus propios permisos desde su propia sesión.
4. **Cambio Seguro de Contraseña:** Modal exclusivo para el rol `DUEÑO` que permite resetear la clave de cualquier colaborador generando un nuevo `salt` y `passwordHash`.

---

## 3. Modelo de Base de Datos (Prisma Schema)

Definido en [schema.prisma](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/prisma/schema.prisma):

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
  codigo      String   @unique @db.VarChar(100)
  
  roles       RolPermisoBase[]
  usuarios    UsuarioPermiso[]

  @@map("permisos")
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
  ordenes         Orden[]
  ingresos        Ingreso[]
  movimientosKardex Kardex[]
  gastosInternos  GastoInterno[]

  @@map("usuarios")
}
```

---

## 4. Endpoints de la API

### GET `/api/usuarios`
- **Permiso RBAC:** `GESTIONAR_USUARIOS`
- **Proceso:** Retorna la lista de usuarios activos e inactivos con su rol, email y estado de `accesoSistema`.

### POST `/api/usuarios`
- **Permiso RBAC:** `GESTIONAR_USUARIOS`
- **Payload Request:**
  ```json
  {
    "nombre": "Carlos Mecánico",
    "email": "carlos@duhvia.com",
    "password": "Password123!",
    "rolId": "uuid-rol-mecanico",
    "permisosIds": ["uuid-perm-1", "uuid-perm-2"]
  }
  ```
- **Proceso:** Genera un `salt` aleatorio encriptado, aplica hash a la contraseña y asigna el rol y permisos.

### PATCH `/api/usuarios/[id]`
- **Permiso RBAC:** `GESTIONAR_USUARIOS`
- **Acciones:**
  - Alternar `accesoSistema` (`true`/`false`).
  - Cambiar contraseña (`password`).
  - Actualizar rol o nombre.

### PUT `/api/usuarios/[id]/permisos`
- **Permiso RBAC:** `GESTIONAR_USUARIOS`
- **Descripción:** Reemplaza la lista granular de permisos individuales del usuario en `UsuarioPermiso`.

---

## 5. Componentes de UI / UX (Frontend)

Ubicados en [components/views/usuarios/](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/components/views/usuarios/):

1. **`UsuariosView.tsx`**: Tabla de usuarios registrados con indicadores de acceso al sistema, rol asignado y acciones (Editar Permisos, Cambiar Clave, Inhabilitar Access).
2. **`CrearUsuarioModal.tsx`**: Formulario modal con selección de Rol y chips interactivos para activar/desactivar permisos individuales.
3. **`GestionarPermisosModal.tsx`**: Modal de matriz de permisos granulares por usuario.
4. **`CambiarPasswordModal.tsx`**: Formulario modal para restablecer la contraseña de acceso de un trabajador.

---

## 6. Reglas de Negocio y Jerarquía de Seguridad

- **Control de Auto-modificación:**
  Si un usuario intenta inhabilitarse a sí mismo o cambiar sus propios permisos desde la tabla:
  - El frontend bloquea la acción.
  - Despliega un mensaje Toast de advertencia: *"No puedes modificar los permisos ni el acceso de tu propia cuenta activa"*.
- **Cierre por `accesoSistema`:**
  Si `accesoSistema === false`, la API de Login arrojará `401 Unauthorized` con el mensaje *"Tu acceso al sistema ha sido inhabilitado por la administración"*, y `proxy.ts` rechazará cualquier llamada autenticada posterior.

---

## 7. Matriz de Relación con otros Módulos

```
 ┌───────────────────────────────────────┐
 │ Módulo de PERSONAL Y USUARIOS         │
 └──────────────────┬────────────────────┘
                    │
                    ├───────────────────────► [ Autenticación / Proxy ] (Valida credenciales y permisos RBAC)
                    ├───────────────────────► [ Kardex y Auditoría ] (Firma responsable de cada movimiento)
                    ├───────────────────────► [ Ventas, Compras y Gastos ] (Asocia autor e historial de operaciones)
                    └───────────────────────► [ Dashboard ] (Muestra el perfil del usuario activo en Navbar)
```

---

## 8. Pruebas Unitarias y Cobertura

- Archivos de test: `__tests__/usuarios.test.ts` y `__tests__/auth.test.ts` (100% Aprobados)
- Escenarios probados:
  - Creación de usuario con salt aleatorio.
  - Verificación de jerarquía y revocación de permisos.
  - Bloqueo de login por `accesoSistema: false`.

---

## 9. Guía de Modificación para Agentes de IA

1. Al modificar contraseñas o crear usuarios en `usuario.service.ts`, **NUNCA** guardes contraseñas en texto plano. Utiliza siempre la función de hash con `salt` nativa en `crypto.ts`.
2. Conserva la validación de jerarquía impidiendo que un usuario con id igual a `x-usuario-id` altere su propio registro.
3. La generación de links de invitación (`app/api/usuarios/[id]/invitacion/route.ts` y scripts CLI) prioriza siempre la variable `process.env.NEXT_PUBLIC_APP_URL` para evitar generar links con dominios internos de Docker/localhost cuando el ERP se despliega en producción (ej. Railway o Vercel).

---

## 10. Cambios de la Sesión 2026-08-07 ✅ COMPLETADO

- [X] **Generación Dinámica de Links de Invitación** — `app/api/usuarios/[id]/invitacion/route.ts`, `scripts/create-users.ts` y `scripts/generate-invitation-link.ts` priorizan la variable de entorno `process.env.NEXT_PUBLIC_APP_URL` (recortando barras finales) para asegurar enlaces válidos en producción.

