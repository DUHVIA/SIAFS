import { UsuarioService } from '@/modules/usuarios/usuario.service';
import { AccesoService } from '@/modules/accesos/acceso.service';
import { UsuariosView } from '@/components/views/usuarios/UsuariosView';

export const dynamic = 'force-dynamic';

export default async function UsuariosPage() {
  const [usuarios, roles] = await Promise.all([
    UsuarioService.obtenerTodos(),
    AccesoService.listarRoles()
  ]);

  return (
    <UsuariosView usuarios={usuarios} roles={roles} />
  );
}
