-- AlterTable
ALTER TABLE "productos" ADD COLUMN     "tipo_autoparte_id" UUID;

-- CreateTable
CREATE TABLE "tipos_autoparte" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(100) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipos_autoparte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tipos_autoparte_nombre_key" ON "tipos_autoparte"("nombre");

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_tipo_autoparte_id_fkey" FOREIGN KEY ("tipo_autoparte_id") REFERENCES "tipos_autoparte"("id") ON DELETE SET NULL ON UPDATE CASCADE;
