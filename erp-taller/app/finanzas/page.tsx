import { GastoService } from '@/modules/gastos/gasto.service';
import { GastosView } from '@/components/views/finanzas/GastosView';

export const dynamic = 'force-dynamic';

export default async function FinanzasPage() {
  const gastos = await GastoService.obtenerTodos();

  return (
    <GastosView gastos={gastos} />
  );
}
