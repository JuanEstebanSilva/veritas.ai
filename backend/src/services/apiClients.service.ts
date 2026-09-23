import { prisma } from '../config/prisma';
import { leerClavesDeEntorno } from '../config/apiClients';
import { generarHash, compararSeguro } from '../utils/hash.util';

export interface ClienteApiIdentificado {
  id: number;
  name: string;
}

export type ResultadoBusquedaCliente =
  | { estado: 'invalida' }
  | { estado: 'deshabilitada'; cliente: ClienteApiIdentificado }
  | { estado: 'activa'; cliente: ClienteApiIdentificado };

/**
 * Registra (o actualiza) en api_clients el hash SHA-256 de cada clave definida
 * en el entorno. La clave original no se escribe en ningún sitio.
 *
 * - Cliente nuevo: se crea con su estado inicial (activoAlCrear).
 * - Cliente existente: se actualiza solo el hash (rotación de clave); su estado
 *   se respeta, así una revocación hecha en la base de datos no se deshace al
 *   reiniciar el servidor.
 */
export const sincronizarClientesApi = async (): Promise<ClienteApiIdentificado[]> => {
  const claves = leerClavesDeEntorno();
  const registrados: ClienteApiIdentificado[] = [];

  for (const def of claves) {
    const keyHash = generarHash(def.clave);
    const cliente = await prisma.apiClient.upsert({
      where: { name: def.nombre },
      update: { key_hash: keyHash },
      create: { name: def.nombre, key_hash: keyHash, is_active: def.activoAlCrear },
      select: { id: true, name: true },
    });
    registrados.push(cliente);
  }
  return registrados;
};

/**
 * Identifica al cliente a partir de la API Key recibida.
 *
 * Nunca se intenta recuperar la clave desde el hash: se calcula el hash de lo
 * recibido y se compara hash contra hash. La búsqueda usa el índice único de
 * key_hash; como el atacante controla la entrada pero no su SHA-256, medir el
 * tiempo de esa búsqueda no le permite acercarse byte a byte al hash guardado.
 * La confirmación final se hace igualmente en tiempo constante.
 */
export const buscarClientePorApiKey = async (apiKey: string): Promise<ResultadoBusquedaCliente> => {
  const hashRecibido = generarHash(apiKey);
  const registro = await prisma.apiClient.findUnique({
    where: { key_hash: hashRecibido },
    select: { id: true, name: true, key_hash: true, is_active: true },
  });

  if (!registro || !compararSeguro(hashRecibido, registro.key_hash)) {
    return { estado: 'invalida' };
  }

  const cliente = { id: registro.id, name: registro.name };
  return registro.is_active ? { estado: 'activa', cliente } : { estado: 'deshabilitada', cliente };
};
