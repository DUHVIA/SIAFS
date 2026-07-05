import { ProductoService } from '@/modules/productos/producto.service';
import { InventarioView } from '@/components/views/inventario/InventarioView';

export const dynamic = 'force-dynamic';

export default async function InventarioPage() {
  // Llama directamente al servicio. Al ser un Server Component, esto ocurre de forma segura en el backend.
  // El servicio se encarga de desencriptar los datos utilizando @/lib/crypto.ts
  const productos = await ProductoService.obtenerTodos();

  return <InventarioView data={productos} />;
}
