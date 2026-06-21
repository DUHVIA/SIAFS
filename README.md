# SIAFS

Este proyecto es un sistema web de gestión diseñado para administrar el catálogo, inventario, clientes, cotizaciones y ventas enfocado en autopartes y motores.

## Módulos Principales

- **Catálogo e Inventario**: Gestión de productos (motores y autopartes), control de stock (reposición) y soft-delete.
- **Gestión de Clientes**: Directorio de clientes con su información de contacto e historial de operaciones.
- **Cotizaciones**: Creación de proformas, exportación a PDF y seguimiento de estados (Pendiente, Ganada, Perdida).
- **Ventas**: Conversión de cotizaciones a ventas descontando stock automáticamente (con transacciones SQL) y ventas directas.
- **Caja y Gastos**: Monitoreo y registro de flujos de dinero interno.
- **Administración y Dashboard**: Control de roles de usuario (Dueño, Admin, Vendedor) y métricas clave en tiempo real.

## Documentación
Toda la documentación inicial, como las **Historias de Usuario (HU)**, se encuentra organizada en la carpeta `docs/`.

## 🛠️ Guía de Instalación y Despliegue Local

Sigue estos pasos para levantar el entorno de desarrollo en tu máquina local.

### 1. Requisitos Previos
- [Docker Desktop](https://www.docker.com/) (o Docker Engine en Linux)
- [Node.js](https://nodejs.org/) (v18 o superior)
- [pnpm](https://pnpm.io/) habilitado.

### 2. Variables de Entorno
Crea un archivo `.env` dentro de la carpeta `erp-taller/` con las credenciales de la base de datos:
\`\`\`env
DATABASE_URL="postgresql://admin:adminpassword@localhost:5432/erp_taller?schema=public"
\`\`\`

### 3. Levantar los Servicios
Abre tu terminal en la carpeta `erp-taller/` y ejecuta los siguientes comandos en orden:

\`\`\`bash
# 1. Levantar la base de datos PostgreSQL en segundo plano
sudo docker compose up -d

# 2. Instalar las dependencias del proyecto
pnpm install

# 3. Sincronizar el esquema de Prisma con la Base de Datos
pnpm dlx prisma db push

# 4. Generar el cliente de Prisma y el Diagrama ERD
pnpm dlx prisma generate

# 5. Iniciar el servidor de desarrollo de Next.js
pnpm run dev
\`\`\`

El sistema estará corriendo en [http://localhost:3000](http://localhost:3000).