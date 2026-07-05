# SIAFS ERP - Taller Automotriz

SIAFS es un sistema ERP de grado empresarial diseñado con **Domain-Driven Design (DDD)** para administrar inventarios, órdenes de ventas, clientes, caja chica y seguridad bajo un entorno encriptado (AES-256).

Este proyecto ha sido construido utilizando:
- **Next.js (App Router)** para vistas reactivas y Server Actions.
- **Tailwind CSS** para un diseño moderno (Soft UI / Glassmorphism).
- **Prisma ORM** y **PostgreSQL** para persistencia e integridad transaccional.
- **Jose** para firma y validación de tokens JWT en el Edge.
- **Zod** para validación estricta de Data Transfer Objects.

---

## 🛠️ Flujo de Trabajo (Uso del `Makefile`)

Para agilizar el desarrollo y evitar la repetición de comandos largos, hemos configurado un archivo `Makefile` en la raíz del proyecto. Este archivo actúa como tu panel de control maestro.

### 1. Iniciar el Sistema (Forma habitual)

Si es la primera vez en el día que vas a trabajar, simplemente abre la terminal en la carpeta raíz y ejecuta:

```bash
make up
```
**¿Qué hace este comando?**
1. Levanta tu base de datos PostgreSQL usando Docker en segundo plano.
2. Espera unos segundos a que la base de datos esté lista para aceptar conexiones.
3. Enciende el servidor de Next.js (que sirve tanto el Backend como el Frontend) en `http://localhost:3000`.

### 2. Cerrar el Sistema

Cuando termines tu jornada de trabajo, puedes detener el servidor de Next.js pulsando `Ctrl + C` en la terminal. Sin embargo, la base de datos seguirá consumiendo memoria en Docker. Para apagarla completamente, ejecuta:

```bash
make db-down
```

### 3. Otros Comandos Útiles

- `make db-up`: Si solo quieres encender la base de datos (sin iniciar Next.js).
- `make db-restart`: Reinicia la base de datos rápidamente.
- `make dev`: Si la base de datos ya estaba encendida y solo quieres reiniciar el servidor de Next.js.
- `make studio`: Abre **Prisma Studio**, una interfaz gráfica en el navegador para que puedas ver y manipular directamente los datos guardados en PostgreSQL.
- `make migrate`: Cada vez que modifiques el archivo `prisma/schema.prisma` (para agregar o quitar tablas), usa este comando para aplicar esos cambios a la base de datos.
- `make seed`: Vuelve a inyectar los datos semilla (usuarios administradores, catálogo de productos base, etc.) en la base de datos.
- `make test`: Ejecuta toda la suite de pruebas unitarias (Vitest) para asegurar que ninguna regla de negocio ha sido rota tras algún cambio.

Para ver este menú en tu terminal en cualquier momento, solo escribe:
```bash
make help
```
