import { prisma } from '@/lib/prisma';
import { cifrarTexto, descifrarTexto, generarIndiceCiego } from '@/lib/crypto';
import { CrearClienteDTO, ActualizarClienteDTO } from './cliente.dto';



export const ClienteService = {
  async obtenerTodos() {
    const clientes = await prisma.cliente.findMany({
      where: { isActive: true },
    });

    return clientes.map((cliente) => ({
      ...cliente,
      nombre: descifrarTexto(cliente.nombreCifrado),
      documento: descifrarTexto(cliente.documentoCifrado),
      telefono: cliente.telefonoCifrado ? descifrarTexto(cliente.telefonoCifrado) : null,
      correo: cliente.correoCifrado ? descifrarTexto(cliente.correoCifrado) : null,
      direccion: cliente.direccionCifrado ? descifrarTexto(cliente.direccionCifrado) : null,
    }));
  },

  async crear(data: CrearClienteDTO) {
    const nombreCifrado = cifrarTexto(data.nombre);
    const idxNombre = generarIndiceCiego(data.nombre);
    const documentoCifrado = cifrarTexto(data.documento);
    const idxDocumento = generarIndiceCiego(data.documento);

    const telefonoCifrado = data.telefono ? cifrarTexto(data.telefono) : null;
    const correoCifrado = data.correo ? cifrarTexto(data.correo) : null;
    const direccionCifrado = data.direccion ? cifrarTexto(data.direccion) : null;

    const nuevoCliente = await prisma.cliente.create({
      data: {
        nombreCifrado,
        idxNombre,
        documentoCifrado,
        idxDocumento,
        telefonoCifrado,
        correoCifrado,
        direccionCifrado,
      },
    });

    return nuevoCliente;
  },

  async actualizar(id: string, data: ActualizarClienteDTO) {
    const updateData: any = {};

    if (data.nombre !== undefined) {
      updateData.nombreCifrado = cifrarTexto(data.nombre);
      updateData.idxNombre = generarIndiceCiego(data.nombre);
    }
    if (data.documento !== undefined) {
      updateData.documentoCifrado = cifrarTexto(data.documento);
      updateData.idxDocumento = generarIndiceCiego(data.documento);
    }
    if (data.telefono !== undefined) {
      updateData.telefonoCifrado = data.telefono ? cifrarTexto(data.telefono) : null;
    }
    if (data.correo !== undefined) {
      updateData.correoCifrado = data.correo ? cifrarTexto(data.correo) : null;
    }
    if (data.direccion !== undefined) {
      updateData.direccionCifrado = data.direccion ? cifrarTexto(data.direccion) : null;
    }

    const clienteActualizado = await prisma.cliente.update({
      where: { id },
      data: updateData,
    });

    return clienteActualizado;
  },

  async desactivar(id: string) {
    return await prisma.cliente.update({
      where: { id },
      data: { isActive: false },
    });
  }
};
