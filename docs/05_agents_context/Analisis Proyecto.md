# Análisis Técnico y Guía de Despliegue: SIAFS (Sistema de Gestión de Autopartes y Motores)

Este documento presenta el análisis técnico detallado de la versión más reciente del proyecto **SIAFS** (rama `maxs`), incluyendo sus módulos de negocio, diseño de seguridad y una guía detallada para desplegar y probar la aplicación en un entorno de desarrollo.

---

## 🛠️ Tecnologías Utilizadas

El proyecto utiliza un stack tecnológico robusto, moderno y optimizado:

### 1. Aplicación (Frontend & Backend Integrados)
* **Next.js 16.2.9** (con **React 19.2.4**): Utiliza el modelo de **App Router** (ubicado en `erp-taller/app`). Next.js actúa como frontend y backend unificados (monolito moderno), administrando interfaces de usuario y rutas API/Server Actions.
* **TypeScript 5**: Tipado estático riguroso para control de datos.
* **Tailwind CSS v4** (con `@tailwindcss/postcss`): Ultima versión que implementa un motor de compilación nativo rápido.
* **Lucide React**: Biblioteca de iconos.
* **Recharts 3.9.2**: Utilizado para generar los gráficos analíticos en tiempo real dentro del Dashboard de gestión.
* **Zod 4.4.3**: Utilizado para validación de datos en tiempo de ejecución (schemas/DTOs).

### 2. Base de Datos, Persistencia y ORM
* **PostgreSQL 16 (Alpine)**: Base de datos relacional robusta.
* **Docker / Docker Compose**: Infraestructura local aislada para PostgreSQL.
* **Prisma ORM 7.8.0**: Capa de acceso a datos con cliente tipado. Utiliza el adaptador nativo `@prisma/adapter-pg` y el pool de conexiones de la biblioteca `pg` para un rendimiento de consultas optimizado.
* **Prisma ERD Generator**: Auto-generador de diagramas Entidad-Relación en formato SVG.

### 3. Criptografía y Seguridad
* **Crypto (Módulo nativo de Node.js)**: Utilizado para la encriptación AES-256-GCM y generación de hashes deterministicos.
* **Jose v6.2.3**: Biblioteca ultra liviana compatible con Edge Runtime para firma y verificación de JSON Web Tokens (JWT).

### 4. Pruebas Unitarias
* **Vitest v4.1.9** y `vitest-mock-extended`: Entorno de ejecución de pruebas unitarias ultra rápido configurado para evaluar la lógica del negocio.

---

## 🏗️ Arquitectura y Funcionamiento Interno

El proyecto implementa una arquitectura monolítica limpia y desacoplada basada en capas dentro de `erp-taller/`:
* **Capa de Presentación (Frontend)**: Localizada en `app/`, estructurada bajo carpetas de dominio (`/clientes`, `/inventario`, `/ordenes`, `/login`, etc.) y protegida por un middleware de autenticación (`proxy.ts`).
* **Capa de Servicios y DTOs (Backend)**: Ubicada en `modules/`. Cada entidad tiene su propio Service (por ejemplo, [producto.service.ts](file:///c:/Users/ASUS%20TUF%20GAMMING%20F15/Desktop/SIAFS/SIAFS/erp-taller/modules/productos/producto.service.ts)) y un archivo DTO para tipado (`producto.dto.ts`). Esta capa se conecta con el cliente Prisma.
* **Capa Criptográfica e Infraestructura**: Configurada en `lib/` (criptografía y conexión de base de datos centralizada).

```mermaid
graph TD
    User([Navegador Cliente]) -->|React 19| FE[Frontend /app]
    FE -->|Rutas Protegidas / APIs| MW[Middleware de Rutas - proxy.ts]
    MW -->|Verifica JWT con jose| Auth[Autenticación RBAC]
    Auth -->|Permitido| BE[Servicios - modules/]
    BE -->|Cifrado en Reposo - lib/crypto.ts| Crypt[Capa Criptográfica Node.js]
    Crypt -->|Datos Cifrados + Blind Indexes| Prisma[Prisma ORM Adapter]
    Prisma -->|SQL queries| DB[(PostgreSQL 16 Docker)]
```

### 🔐 Cifrado a Nivel de Aplicación (Application-Level Encryption - ALE)
El sistema resguarda de forma absoluta la privacidad de los datos sensibles y financieros (nombres de clientes, documentos de identidad, detalles de compras y ventas, montos y stock):
1. **Encriptación Simétrica (AES-256-GCM)**: Cada campo confidencial se cifra usando una clave maestra `ENCRYPTION_KEY`. El resultado almacena el Vector de Inicialización (IV) + Tag de Autenticación + Texto Cifrado separado por dos puntos (ej. `ivHex:tagHex:encryptedHex`).
2. **Índices Ciegos (Blind Indexes)**: Dado que no se pueden usar filtros de búsqueda SQL en campos encriptados de forma aleatoria, el sistema genera hashes deterministas unidireccionales (SHA-256) de los datos originales normalizados en minúsculas y sin espacios (ej. `idxDocumento`). El backend realiza búsquedas exactas cruzando el término buscado (hasheado previamente) contra esta columna.
3. **Manejo de Transacciones**: Los servicios utilizan transacciones atómicas (`prisma.$transaction`) para asegurar que los cambios de stock actualicen el Kardex y que los cambios de catálogo registren adecuadamente los historiales de auditoría.

---

## 🚀 Guía de Despliegue Local (Paso a Paso)

El desarrollador ha unificado los comandos necesarios para desplegar y probar la aplicación localmente usando un `Makefile` y Docker.

### 1. Requisitos Previos
* **Docker Desktop** (para levantar PostgreSQL).
* **Node.js v18** o superior.
* **pnpm** habilitado.

### 2. Configurar Variables de Entorno
Crea un archivo `.env` en la ruta `/erp-taller/` tomando como base el archivo `.env.example`:
```env
# Conexión local a la base de datos levantada por Docker
DATABASE_URL="postgresql://admin:adminpassword@localhost:5432/erp_taller?schema=public"

# Secreto para firmar tokens JWT de sesión (Mínimo 32 caracteres)
JWT_SECRET="DuhviaERP_Super_Secret_JWT_Key_2026!"

# Llave de encriptación simétrica AES-256 (Debe tener exactamente 32 caracteres)
ENCRYPTION_KEY="DuhviaERP_Secreta_32_Caracteres!"
```

### 3. Levantar la Infraestructura y la Aplicación
Abre una terminal en `/erp-taller/` y ejecuta los siguientes comandos en orden:

```bash
# 1. Instalar las dependencias del monorepo
pnpm install

# 2. Levantar la base de datos PostgreSQL en segundo plano
make db-up

# 3. Aplicar las migraciones de base de datos a PostgreSQL
make migrate

# 4. Poblar la base de datos con datos de prueba cifrados y permisos base
make seed

# 5. Iniciar la aplicación en modo desarrollo
make dev
```

> [!TIP]
> Puedes utilizar el comando unificado `make up` para levantar la base de datos Docker y el servidor de Next.js en un solo paso, aunque las migraciones y el seed de base de datos deben haberse corrido al menos una vez antes.

La aplicación estará lista para interactuar en [http://localhost:3000](http://localhost:3000).

---

## 🧪 Cómo Probar el Sistema (Casos de Prueba)

### 1. Iniciar Sesión en la Plataforma
El comando `make seed` inyecta un usuario administrador maestro por defecto en la base de datos:
* **Usuario (Email)**: `admin@duhvia.com`
* **Contraseña**: `DuhviaMaster2026!`
* **Rol**: `DUEÑO` (Tiene acceso a todos los módulos y permisos del sistema)

### 2. Verificar los Datos de Prueba Cifrados
El script de seed registra datos encriptados ficticios para validar que la capa criptográfica descifre los elementos correctamente en el frontend:
* **Cliente en BD**: `Juan Pérez` (DNI: `70123456`).
* **Producto en BD**: `Bujía Iridium NGK` (Stock inicial: `100`, Precio de venta: `45.50`).
* **Kardex**: Registro de ingreso de `100` unidades por motivo `Inventario Inicial`.

### 3. Ejecutar la Suite de Pruebas Unitarias
El proyecto cuenta con Vitest para evaluar la lógica del backend y los algoritmos criptográficos:
```bash
make test
```
Esto correrá las pruebas en la consola mostrando la cobertura e integridad de los servicios.

### 4. Inspección Visual de Datos Cifrados (Prisma Studio)
Si deseas constatar que los datos están efectivamente protegidos en la base de datos PostgreSQL, ejecuta:
```bash
make studio
```
Esto abrirá un panel visual en [http://localhost:5555](http://localhost:5555) donde podrás constatar que en la tabla `clientes` y `productos` los valores de nombres, números de contacto y precios son cadenas de texto incomprensibles (cifradas) a excepción de las columnas de búsqueda `idx_*` e ID.
