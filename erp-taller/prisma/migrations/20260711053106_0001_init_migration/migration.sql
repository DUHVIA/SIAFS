-- CreateEnum
CREATE TYPE "CategoriaProducto" AS ENUM ('AUTOPARTE', 'MOTOR');

-- CreateEnum
CREATE TYPE "TipoOrden" AS ENUM ('COTIZACION', 'VENTA');

-- CreateEnum
CREATE TYPE "EstadoOrden" AS ENUM ('PENDIENTE', 'COMPLETADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "TipoMovimientoKardex" AS ENUM ('INGRESO', 'SALIDA', 'AJUSTE');

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" VARCHAR(100) NOT NULL,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_permiso_base" (
    "rol_id" UUID NOT NULL,
    "permiso_id" UUID NOT NULL,

    CONSTRAINT "rol_permiso_base_pkey" PRIMARY KEY ("rol_id","permiso_id")
);

-- CreateTable
CREATE TABLE "usuario_permisos" (
    "usuario_id" UUID NOT NULL,
    "permiso_id" UUID NOT NULL,

    CONSTRAINT "usuario_permisos_pkey" PRIMARY KEY ("usuario_id","permiso_id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "rol_id" UUID NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "salt" VARCHAR(255) NOT NULL,
    "acceso_sistema" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre_cifrado" TEXT NOT NULL,
    "idx_nombre" VARCHAR(64),
    "documento_cifrado" TEXT NOT NULL,
    "idx_documento" VARCHAR(64) NOT NULL,
    "telefono_cifrado" TEXT,
    "correo_cifrado" TEXT,
    "direccion_cifrado" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre_cifrado" TEXT NOT NULL,
    "idx_nombre" VARCHAR(64),
    "categoria" "CategoriaProducto" NOT NULL,
    "precio_venta_cifrado" TEXT NOT NULL,
    "stock_cifrado" TEXT NOT NULL,
    "rango_stock" INTEGER NOT NULL DEFAULT 0,
    "detalles_cifrados" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kardex" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "producto_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "tipo_movimiento" "TipoMovimientoKardex" NOT NULL,
    "cantidad_cifrada" TEXT NOT NULL,
    "motivo_cifrado" TEXT NOT NULL,
    "fecha_movimiento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kardex_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_precios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "producto_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "precio_compra_cifrado" TEXT,
    "precio_venta_cifrado" TEXT NOT NULL,
    "fecha_cambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_precios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_nombres" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "producto_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "nombre_antiguo_cifrado" TEXT NOT NULL,
    "nombre_nuevo_cifrado" TEXT NOT NULL,
    "fecha_cambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_nombres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingresos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "descripcion_cifrada" TEXT,
    "total_cifrado" TEXT NOT NULL,
    "fecha_ingreso" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ingresos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_ingresos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ingreso_id" UUID NOT NULL,
    "producto_id" UUID NOT NULL,
    "cantidad_cifrada" TEXT NOT NULL,
    "costo_unitario_cifrado" TEXT NOT NULL,

    CONSTRAINT "detalle_ingresos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metodos_pago" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "metodos_pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero_orden" SERIAL NOT NULL,
    "tipo" "TipoOrden" NOT NULL,
    "estado" "EstadoOrden" NOT NULL DEFAULT 'PENDIENTE',
    "cliente_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "metodo_pago_id" UUID,
    "subtotal_cifrado" TEXT NOT NULL,
    "total_cifrado" TEXT NOT NULL,
    "fecha_validez" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ordenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalle_ordenes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "orden_id" UUID NOT NULL,
    "producto_id" UUID,
    "producto_nombre_cifrado" TEXT NOT NULL,
    "precio_unitario_congelado_cifrado" TEXT NOT NULL,
    "cantidad_cifrada" TEXT NOT NULL,
    "subtotal_cifrado" TEXT NOT NULL,

    CONSTRAINT "detalle_ordenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos_internos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "motivo_cifrado" TEXT NOT NULL,
    "monto_cifrado" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gastos_internos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_codigo_key" ON "permisos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_idx_documento_key" ON "clientes"("idx_documento");

-- CreateIndex
CREATE UNIQUE INDEX "metodos_pago_nombre_key" ON "metodos_pago"("nombre");

-- AddForeignKey
ALTER TABLE "rol_permiso_base" ADD CONSTRAINT "rol_permiso_base_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permiso_base" ADD CONSTRAINT "rol_permiso_base_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_permisos" ADD CONSTRAINT "usuario_permisos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_permisos" ADD CONSTRAINT "usuario_permisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kardex" ADD CONSTRAINT "kardex_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kardex" ADD CONSTRAINT "kardex_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_precios" ADD CONSTRAINT "historial_precios_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_precios" ADD CONSTRAINT "historial_precios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_nombres" ADD CONSTRAINT "historial_nombres_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_nombres" ADD CONSTRAINT "historial_nombres_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ingresos" ADD CONSTRAINT "ingresos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_ingresos" ADD CONSTRAINT "detalle_ingresos_ingreso_id_fkey" FOREIGN KEY ("ingreso_id") REFERENCES "ingresos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_ingresos" ADD CONSTRAINT "detalle_ingresos_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_metodo_pago_id_fkey" FOREIGN KEY ("metodo_pago_id") REFERENCES "metodos_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_ordenes" ADD CONSTRAINT "detalle_ordenes_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ordenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_ordenes" ADD CONSTRAINT "detalle_ordenes_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos_internos" ADD CONSTRAINT "gastos_internos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
