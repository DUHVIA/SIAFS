import { OrdenService } from '@/modules/ordenes/orden.service';
import { ProductoService } from '@/modules/productos/producto.service';
import { ClienteService } from '@/modules/clientes/cliente.service';
import { OrdenesView } from '@/components/views/ordenes/OrdenesView';

export const dynamic = 'force-dynamic';

export default async function OrdenesPage() {
  // Optimizamos inyectando 3 catálogos al mismo tiempo para la vista y el modal de creación
  const [ordenes, productos, clientes] = await Promise.all([
    OrdenService.obtenerTodas(),
    ProductoService.obtenerTodos(),
    ClienteService.obtenerTodos()
  ]);

  return (
    <OrdenesView 
      ordenes={ordenes}
      productos={productos}
      clientes={clientes}
    />
  );
}
