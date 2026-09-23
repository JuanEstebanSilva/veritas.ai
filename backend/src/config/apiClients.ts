import { CryptoVault } from '../utils/cryptoVault';

/**
 * Consumidores registrados de la API (Lab 6).
 *
 * Cada aplicación tiene su propia API Key en una variable de entorno distinta,
 * de modo que el servidor puede saber qué cliente hizo cada petición y revocar
 * a uno sin afectar a los demás.
 *
 * `activoAlCrear` solo se aplica la primera vez que el cliente se registra en
 * la base de datos; después, su estado se gestiona en la tabla api_clients y
 * una revocación sobrevive a los reinicios.
 */
export interface DefinicionClienteApi {
  variable: string;
  nombre: string;
  activoAlCrear: boolean;
}

export const CLIENTES_API: DefinicionClienteApi[] = [
  { variable: 'API_KEY_POSTMAN', nombre: 'Postman Laboratorio', activoAlCrear: true },
  { variable: 'API_KEY_WEB', nombre: 'Frontend Web Plagelio', activoAlCrear: true },
  { variable: 'API_KEY_MOVIL', nombre: 'Aplicación Móvil', activoAlCrear: false },
];

/** Longitud mínima aceptada: 32 bytes en hexadecimal generan 64 caracteres. */
export const LONGITUD_MINIMA_API_KEY = 32;

export class ConfiguracionApiKeysError extends Error {}

/**
 * Lee las claves del entorno y detiene el arranque si la configuración está
 * incompleta o es débil, en lugar de dejar la API funcionando a medias.
 */
export const leerClavesDeEntorno = (): Array<DefinicionClienteApi & { clave: string }> => {
  const faltan: string[] = [];
  const debiles: string[] = [];

  const claves = CLIENTES_API.map((def) => {
    const clave = CryptoVault.decrypt(process.env[def.variable] || '').trim();
    if (!clave) faltan.push(def.variable);
    else if (clave.length < LONGITUD_MINIMA_API_KEY) debiles.push(def.variable);
    return { ...def, clave };
  });

  if (faltan.length) {
    throw new ConfiguracionApiKeysError(
      `Faltan variables de entorno para las API Keys: ${faltan.join(', ')}`
    );
  }
  if (debiles.length) {
    throw new ConfiguracionApiKeysError(
      `API Keys demasiado cortas (mínimo ${LONGITUD_MINIMA_API_KEY} caracteres): ${debiles.join(', ')}`
    );
  }
  if (new Set(claves.map((c) => c.clave)).size !== claves.length) {
    throw new ConfiguracionApiKeysError('Dos clientes no pueden compartir la misma API Key.');
  }
  return claves;
};
