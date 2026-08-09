-- AlterTable
ALTER TABLE "detalle_ordenes" ADD COLUMN     "costo_unitario_congelado_cifrado" TEXT;

-- AlterTable
ALTER TABLE "ordenes" ADD COLUMN     "fecha_orden" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "precio_compra_cifrado" TEXT;
