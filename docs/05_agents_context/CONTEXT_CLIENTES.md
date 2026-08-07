# CONTEXT_CLIENTES.md — Módulo de Clientes y Directorio Comercial (SIAFS ERP)

> **🤖 MANUAL DE CONTEXTO PARA AGENTES DE IA:**
> Este documento contiene TODA la información técnica, lógica de encriptación, esquemas de datos, APIs y componentes del módulo de **Clientes y Fichas Comerciales 360°**.
> Consulta este archivo al modificar la gestión de clientes, validaciones de DNI/RUC, búsquedas cifradas por Blind Index o la ficha de historial de compras.

---

## 1. Ficha Técnica del Módulo

| Campo | Detalle |
|---|---|
| **Nombre del Módulo** | Directorio de Clientes y Ficha Comercial |
| **Identificador Interno** | `clientes` |
| **Rol en SIAFS** | Registrar la base de clientes (personas naturales y empresas), almacenar de forma cifrada sus datos de contacto/documento y consolidar su historial de consumo y compras en el taller. |
| **Ruta Backend/Servicios** | [cliente.service.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/modules/clientes/cliente.service.ts) |
| **Ruta API Handlers** | `app/api/clientes/route.ts`, `app/api/clientes/[id]/route.ts` |
| **Ruta UI/Frontend** | `app/clientes/page.tsx`, `components/views/clientes/ClientesView.tsx`, `CrearClienteModal.tsx`, `EditarClienteModal.tsx`, `VerClienteModal.tsx` |
| **Estado del Módulo** | 100% Completo y Probad en Producción (incluye búsqueda blind index, ficha 360° y exportación Excel/CSV). |

---

## 2. Propósito y Arquitectura de Negocio

El módulo de Clientes centraliza la relación comercial con los compradores de autopartes y clientes del taller automotriz:
1. **Soporte DNI / RUC:** Permite registrar tanto a clientes finales (DNI de 8 dígitos) como a empresas/talles aliados (RUC de 11 dígitos).
2. **Privacidad y Cifrado (ALE):** Toda información identificable (Nombres, DNI/RUC, Teléfono, Correo, Dirección) se guarda estrictamente cifrada con AES-256-GCM.
3. **Búsqueda Determinista (Blind Index):** Utiliza columnas `idx_documento` e `idx_nombre` (SHA-256) para encontrar clientes instantáneamente sin descifrar toda la base de datos en SQL.
4. **Ficha Comercial 360° (`VerClienteModal`):** Despliega el resumen de consumo del cliente: total acumulado comprado en S/, número de órdenes realizadas y la lista histórica de sus compras.

---

## 3. Modelo de Base de Datos (Prisma Schema)

Definido en [schema.prisma](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/prisma/schema.prisma):

```prisma
model Cliente {
  id               String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  nombreCifrado    String   @map("nombre_cifrado") @db.Text
  idxNombre        String?  @map("idx_nombre") @db.VarChar(64)
  documentoCifrado String   @map("documento_cifrado") @db.Text
  idxDocumento     String   @unique @map("idx_documento") @db.VarChar(64)
  telefonoCifrado  String?  @map("telefono_cifrado") @db.Text
  correoCifrado    String?  @map("correo_cifrado") @db.Text
  direccionCifrado String?  @map("direccion_cifrado") @db.Text
  isActive         Boolean  @default(true) @map("is_active")
  createdAt        DateTime @default(now()) @map("created_at")

  ordenes          Orden[]

  @@map("clientes")
}
```

---

## 4. Endpoints de la API

### GET `/api/clientes`
- **Permiso RBAC:** `VER_CLIENTES`
- **Query Params:** `page`, `limit`, `search`
- **Proceso:**
  - Si hay `search`: Calcula el blind index del término y busca en `idxDocumento` o `idxNombre`. Si no hay coincidencia directa, realiza descifrado en memoria para búsquedas parciales.
  - Retorna la lista paginada de clientes descifrados y las métricas globales (Total Clientes, Clientes Activos, Nuevos del Mes).

### POST `/api/clientes`
- **Permiso RBAC:** `VER_CLIENTES` (o `CREAR_CLIENTE`)
- **Payload Request:**
  ```json
  {
    "nombre": "Taller Mecánico Samfor S.A.C.",
    "documento": "20601234567",
    "telefono": "987654321",
    "correo": "contacto@samfor.pe",
    "direccion": "Av. Nicolas Arriola 1230"
  }
  ```
- **Proceso:** Encripta los campos con `encrypt()`, calcula `generateBlindIndex()` para `idxDocumento` e `idxNombre`, y crea el registro.

### PATCH `/api/clientes/[id]`
- **Permiso RBAC:** `VER_CLIENTES`
- **Descripción:** Actualiza los datos cifrados y recalcula los blind indexes.

### DELETE `/api/clientes/[id]`
- **Permiso RBAC:** `VER_CLIENTES`
- **Descripción:** Soft-delete de cliente (`isActive: false`).

---

## 5. Componentes de UI / UX (Frontend)

Ubicados en [components/views/clientes/](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/components/views/clientes/):

1. **`ClientesView.tsx`**: Bento grid con KPIs de clientes, buscador con debounce, tabla paginada con badges de estado y botones de exportación CSV/Excel.
2. **`CrearClienteModal.tsx`**: Formulario modal con validación de tipo de documento (DNI de 8 dígitos o RUC de 11 dígitos) y manejo de errores de duplicados.
3. **`EditarClienteModal.tsx`**: Modal de modificación con pre-llenado de datos descifrados.
4. **`VerClienteModal.tsx`**: Ficha 360° del cliente. Muestra perfil completo, tarjeta estadística (Total Comprado S/, Nro Órdenes, Ticket Promedio) y tabla histórica de ventas asociadas.

---

## 6. Reglas de Negocio y Tareas Ocultas

- **Unicidad de Documento (Blind Index):**
  La columna `idx_documento` tiene restricción `@unique` en la base de datos. Intentar registrar a dos clientes con el mismo DNI/RUC arrojará un error `P2002` de Prisma que es capturado por el servicio para informar "El documento ya se encuentra registrado".
- **Atajo en Modal de Órdenes:**
  `CrearClienteModal` puede ser invocado dinámicamente desde `CrearOrdenModal.tsx`, permitiendo crear un cliente al vuelo durante una venta.

---

## 7. Matriz de Relación con otros Módulos

```
 ┌─────────────────────┐
 │ Módulo de CLIENTES  │
 └──────────┬──────────┘
            │
            ├───────────────────────► [ Ventas u Órdenes ] (Provee datos para proformas y notas de pedido)
            └───────────────────────► [ Dashboard ] (Alimenta KPIs de total de clientes y clientes nuevos MTD)
```

---

## 8. Pruebas Unitarias y Cobertura

- Archivo de test: `__tests__/clientes.test.ts` (100% Aprobados)
- Escenarios probados:
  - Registro de cliente con datos cifrados AES.
  - Búsqueda exacta por blind index de documento.
  - Prevención de duplicados por `idxDocumento`.

---

## 9. Guía de Modificación para Agentes de IA

1. Al modificar `cliente.service.ts`, asegúrate de mantener la generación de `idxDocumento` mediante `generateBlindIndex()` para garantizar que la restricción de unicidad funcione correctamente.
2. NUNCA retornes campos `*_cifrado` crudos a la vista; pasa siempre por la función `decrypt()` en la capa del servicio.
