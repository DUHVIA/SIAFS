# CONTEXT_GASTOS.md — Módulo de Gastos Internos, Caja Chica y Finanzas (SIAFS ERP)

> **🤖 MANUAL DE CONTEXTO PARA AGENTES DE IA:**
> Este documento contiene TODA la información técnica, reglas de negocio, esquemas de datos, APIs y componentes del módulo de **Gastos Internos y Finanzas de Caja Chica**.
> Consulta este archivo al modificar el registro de egresos operacionales, corrección de fechas UTC, edición de gastos o reportes de caja chica.

---

## 1. Ficha Técnica del Módulo

| Campo | Detalle |
|---|---|
| **Nombre del Módulo** | Gastos Internos, Caja Chica y Egresos Operacionales |
| **Identificador Interno** | `gastos` |
| **Rol en SIAFS** | Registrar los egresos diarios del taller y comercializadora (pago de servicios, útiles de oficina, mantenimiento, viáticos, repuestos menores), cifrar sus importes y descontarlos del balance en el Dashboard. |
| **Ruta Backend/Servicios** | [gasto.service.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/modules/gastos/gasto.service.ts) |
| **Ruta API Handlers** | `app/api/gastos/route.ts`, `app/api/gastos/[id]/route.ts` |
| **Ruta UI/Frontend** | `app/finanzas/page.tsx`, `components/views/finanzas/GastosView.tsx`, `CrearGastoModal.tsx`, `EditarGastoModal.tsx`, `ConfirmAnularGastoModal.tsx` |
| **Estado del Módulo** | 100% Completo y Aprobado (incluye corrección de fechas UTC, modal CRUD completo y exportación Excel/CSV). |

---

## 2. Propósito y Arquitectura de Negocio

El módulo de Gastos Internos controla la salida de caja chica de la empresa:
1. **Control de Egresos No Asociados a Compras:** Registra gastos administrativos y operativos diarios.
2. **Cifrado de Privacidad (ALE):** Los motivos de los gastos y los montos en Soles se almacenan encriptados en la BD con AES-256-GCM.
3. **Manejo Riguroso de Fechas:** Garantiza que la fecha seleccionada en el calendario se registre exactamente en el día local sin desfasajes de zona horaria UTC.
4. **Vínculo con el Dashboard Financiero:** Alimenta automáticamente la métrica de **Gastos Totales** y la serie de barras rojas del gráfico multiserie.

---

## 3. Modelo de Base de Datos (Prisma Schema)

Definido en [schema.prisma](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/prisma/schema.prisma):

```prisma
model GastoInterno {
  id            String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  usuarioId     String   @map("usuario_id") @db.Uuid
  motivoCifrado String   @map("motivo_cifrado") @db.Text
  montoCifrado  String   @map("monto_cifrado") @db.Text
  fecha         DateTime @db.Date
  isActive      Boolean  @default(true) @map("is_active")
  createdAt     DateTime @default(now()) @map("created_at")

  usuario       Usuario  @relation(fields: [usuarioId], references: [id])

  @@map("gastos_internos")
}
```

---

## 4. Endpoints de la API

### GET `/api/gastos`
- **Permiso RBAC:** `VER_GASTOS`
- **Query Params:** `page`, `limit`, `search`
- **Proceso:** Obtiene los gastos con `isActive: true`, descifra el motivo y monto en memoria y retorna las métricas (Total Gastado en el Mes, Promedio Diario, Nro de Transacciones).

### POST `/api/gastos`
- **Permiso RBAC:** `VER_GASTOS` (o `CREAR_GASTO`)
- **Payload Request:**
  ```json
  {
    "motivo": "Compra de detergente industrial y paños para taller",
    "monto": 120.50,
    "fecha": "2026-08-05"
  }
  ```
- **Proceso:** Parsea la fecha corrigiendo el desfasaje UTC, cifra `motivo` y `monto`, y vincula con el `usuarioId` activo.

### PATCH `/api/gastos/[id]`
- **Permiso RBAC:** `VER_GASTOS`
- **Descripción:** Edita motivo, monto o fecha del gasto registrado.

### DELETE `/api/gastos/[id]`
- **Permiso RBAC:** `VER_GASTOS`
- **Descripción:** Soft-delete del gasto (`isActive: false`).

---

## 5. Componentes de UI / UX (Frontend)

Ubicados en [components/views/finanzas/](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/components/views/finanzas/):

1. **`GastosView.tsx`**: Bento grid con KPIs (Gastado en el Mes, Promedio Diario, Transacciones del Mes), buscador con debounce, tabla paginada con acciones (Editar, Anular) y botones de exportación CSV/Excel.
2. **`CrearGastoModal.tsx`**: Formulario modal para registrar gastos con selector de fecha corregido y cierre automático (`onClose()`) tras el guardado.
3. **`EditarGastoModal.tsx`**: Formulario para modificar datos de un gasto existente.
4. **`ConfirmAnularGastoModal.tsx`**: Modal de confirmación para dar de baja un gasto.

---

## 6. Reglas de Negocio y Tareas Ocultas

- **Corrección de Desfasaje de Fecha UTC (Bug Fix Aplicado):**
  - *Problema previo:* Al seleccionar `2026-08-05`, `new Date("2026-08-05")` en Javascript interpretaba la fecha a las `00:00:00 UTC`, restando horas en zona horaria Lima (UTC-5) y guardando el día anterior (`2026-08-04`).
  - *Solución:* Se parsea la fecha descomponiendo la cadena `YYYY-MM-DD` explicitando los componentes locales (`new Date(year, month - 1, day, 12, 0, 0)`) para asegurar que se guarde exactamente la fecha seleccionada.
- **Cierre Automático de Modal:**
  Tanto `CrearGastoModal` como `EditarGastoModal` invocan `onClose()` de forma limpia inmediatamente al recibir `200 OK` de la API.

---

## 7. Matriz de Relación con otros Módulos

```
 ┌─────────────────────┐
 │ Módulo de GASTOS    │
 └──────────┬──────────┘
            │
            ├───────────────────────► [ Dashboard Financiero ] (Resta de Ingresos para calcular Ganancia Neta)
            └───────────────────────► [ Usuarios ] (Registra qué usuario autorizó el egreso)
```

---

## 8. Pruebas Unitarias y Cobertura

- Archivo de test: `__tests__/finanzas.test.ts` (100% Aprobados)
- Escenarios probados:
  - Registro de gastos cifrados AES.
  - Cálculo correcto de agregados mensuales.
  - Edición y anulación mediante soft-delete.

---

## 9. Guía de Modificación para Agentes de IA

1. Al manipular el campo `fecha` en `gasto.service.ts` o componentes del frontend, **mantén la lógica de parseo local** para evitar regresiones de zona horaria.
2. Asegúrate de pasar el header `x-usuario-id` inyectado por `proxy.ts` para asociar el gasto al usuario en sesión.
