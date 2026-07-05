import { ClienteService } from '@/modules/clientes/cliente.service';
import { ClientesView } from '@/components/views/clientes/ClientesView';

export const dynamic = 'force-dynamic';

export default async function ClientesPage() {
  const clientes = await ClienteService.obtenerTodos();

  return (
    <ClientesView clientes={clientes} />
  );
}
