import crypto from 'node:crypto';
import { pool } from '../config/database';
import { prisma } from '../config/prisma';
import { generarPasswordHash, verificarPassword } from '../utils/password.util';
import { generarLoteCodigos } from '../utils/crypto.util';
import usuariosService, { usuariosMemoria } from './usuarios.service';
import { passwordResetTokensMemoria } from './passwordReset.service';

/**
 * Servicio de Códigos de Recuperación de Respaldo (Laboratorio / Bloque 11)
 * Veritas AI — Plataforma de Integridad Académica
 *
 * Permite que los usuarios autenticados (estudiantes, docentes, administradores)
 * generen un lote de 8 códigos de respaldo de un solo uso en formato XXXX-XXXX.
 */

export interface CodigoRecuperacionMemoria {
  id: number;
  usuario_id: number | string;
  codigo_hash: string;
  codigo_plano?: string;
  fecha_creacion: Date;
  fecha_uso?: Date | null;
}

export const codigosRecuperacionMemoria: CodigoRecuperacionMemoria[] = [];

export const normalizar = (codigo: string): string =>
  codigo.replace(/-/g, '').toUpperCase().trim();

export const hashCodigo = (codigo: string): string =>
  crypto.createHash('sha256').update(normalizar(codigo), 'utf8').digest('hex');

export const codigoNuevo = (): string =>
  generarLoteCodigos(1)[0];

/**
 * Genera ocho códigos de respaldo para el usuario autenticado
 */
export async function generar(
  usuarioId: string | number,
  passwordActual: string
): Promise<{ estado: string; codigos?: string[] }> {
  const usuario = await usuariosService.obtenerUsuarioPorId(usuarioId);
  const passwordHash = usuario?.passwordHash || usuario?.password_hash;

  if (!usuario || !passwordHash) {
    return { estado: 'NO_AUTORIZADO' };
  }

  const esValida = await verificarPassword(passwordActual, passwordHash);
  if (!esValida) {
    return { estado: 'NO_AUTORIZADO' };
  }

  let numUsuarioId = Number(usuarioId);
  if (isNaN(numUsuarioId) && usuario) {
    numUsuarioId = Number((usuario as any).numId || (usuario as any).dbId || usuario.id);
  }
  const codigos = generarLoteCodigos(8);

  // 1. Intentar persistir en PostgreSQL
  try {
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      if (!isNaN(numUsuarioId)) {
        await cliente.query(
          'DELETE FROM public.codigos_recuperacion WHERE usuario_id = $1',
          [numUsuarioId]
        );
        for (const cod of codigos) {
          await cliente.query(
            'INSERT INTO public.codigos_recuperacion (usuario_id, codigo_hash) VALUES ($1, $2)',
            [numUsuarioId, hashCodigo(cod)]
          );
        }
        await cliente.query('COMMIT');
      } else {
        await cliente.query('ROLLBACK');
      }
    } catch (dbErr) {
      await cliente.query('ROLLBACK');
      console.warn('[codigosRecuperacion.service] Fallback DB en generar:', (dbErr as any)?.message);
    } finally {
      cliente.release();
    }
  } catch {}

  // 2. Registrar en memoria
  // Eliminar anteriores del usuario
  for (let i = codigosRecuperacionMemoria.length - 1; i >= 0; i--) {
    if (String(codigosRecuperacionMemoria[i].usuario_id) === String(usuarioId)) {
      codigosRecuperacionMemoria.splice(i, 1);
    }
  }

  for (const cod of codigos) {
    codigosRecuperacionMemoria.push({
      id: codigosRecuperacionMemoria.length + 1,
      usuario_id: usuario.id,
      codigo_hash: hashCodigo(cod),
      codigo_plano: cod,
      fecha_creacion: new Date(),
      fecha_uso: null,
    });
  }

  return { estado: 'OK', codigos };
}

/**
 * Consulta la cantidad de códigos de respaldo disponibles (no utilizados)
 */
export async function estado(usuarioId: string | number): Promise<number> {
  let numUsuarioId = Number(usuarioId);
  const usuario = await usuariosService.obtenerUsuarioPorId(usuarioId);
  if (isNaN(numUsuarioId) && usuario) {
    numUsuarioId = Number((usuario as any).numId || (usuario as any).dbId || usuario.id);
  }

  // 1. Consultar en PostgreSQL
  try {
    if (!isNaN(numUsuarioId)) {
      const r = await pool.query(
        `SELECT COUNT(*)::int AS disponibles
         FROM public.codigos_recuperacion
         WHERE usuario_id = $1 AND fecha_uso IS NULL`,
        [numUsuarioId]
      );
      if (r.rows.length > 0) {
        return r.rows[0].disponibles;
      }
    }
  } catch {}

  // 2. Fallback en memoria
  const uIdStr = usuario ? String(usuario.id) : String(usuarioId);
  return codigosRecuperacionMemoria.filter(
    (c) => (String(c.usuario_id) === String(usuarioId) || String(c.usuario_id) === uIdStr) && !c.fecha_uso
  ).length;
}

/**
 * Restablece la contraseña usando un código de respaldo válido
 */
export async function restablecer(
  email: string,
  codigo: string,
  passwordNueva: string
): Promise<{ estado: string }> {
  const cHash = hashCodigo(codigo);
  const normEmail = email.toLowerCase().trim();

  // 1. Intentar operación en PostgreSQL
  try {
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      const u = await cliente.query(
        `SELECT id, activo, password_hash, email
         FROM public.usuarios
         WHERE LOWER(email) = LOWER($1)
         FOR UPDATE`,
        [normEmail]
      );

      const dbUser = u.rows[0];
      if (dbUser && dbUser.activo) {
        const c = await cliente.query(
          `SELECT id
           FROM public.codigos_recuperacion
           WHERE usuario_id = $1 AND codigo_hash = $2 AND fecha_uso IS NULL
           FOR UPDATE`,
          [dbUser.id, cHash]
        );

        if (!c.rows.length) {
          await cliente.query('ROLLBACK');
          return { estado: 'INVALIDO' };
        }

        if (await verificarPassword(passwordNueva, dbUser.password_hash)) {
          await cliente.query('ROLLBACK');
          return { estado: 'MISMA_CLAVE' };
        }

        const passwordHash = await generarPasswordHash(passwordNueva);

        await cliente.query(
          `UPDATE public.usuarios
           SET password_hash = $1, version_sesion = COALESCE(version_sesion, 0) + 1
           WHERE id = $2`,
          [passwordHash, dbUser.id]
        );

        await cliente.query(
          `UPDATE public.codigos_recuperacion
           SET fecha_uso = NOW()
           WHERE id = $1`,
          [c.rows[0].id]
        );

        await cliente.query(
          `UPDATE public.password_reset_tokens
           SET fecha_uso = NOW()
           WHERE usuario_id = $1 AND fecha_uso IS NULL`,
          [dbUser.id]
        );

        await cliente.query('COMMIT');

        // Sincronizar usuario en memoria
        const usuarioMem = await usuariosService.obtenerUsuarioPorEmail(normEmail);
        if (usuarioMem) {
          usuarioMem.passwordHash = passwordHash;
          usuarioMem.password_hash = passwordHash;
          usuarioMem.versionSesion = (usuarioMem.versionSesion || 0) + 1;
          usuarioMem.version_sesion = usuarioMem.versionSesion;
        }

        // Marcar código en memoria
        const codMem = codigosRecuperacionMemoria.find(
          (cm) => cm.codigo_hash === cHash && !cm.fecha_uso
        );
        if (codMem) codMem.fecha_uso = new Date();

        // Actualizar en Prisma si existe
        try {
          await prisma.user.updateMany({
            where: { email: normEmail },
            data: { password_hash: passwordHash },
          });
        } catch {}

        return { estado: 'OK' };
      }
      await cliente.query('ROLLBACK');
    } catch (dbErr) {
      await cliente.query('ROLLBACK');
      console.warn('[codigosRecuperacion.service] Fallback DB en restablecer:', (dbErr as any)?.message);
    } finally {
      cliente.release();
    }
  } catch {}

  // 2. Fallback en memoria
  const usuario = await usuariosService.obtenerUsuarioPorEmail(normEmail);
  const passwordHash = usuario?.passwordHash || usuario?.password_hash;
  if (!usuario || !passwordHash) {
    return { estado: 'INVALIDO' };
  }

  const codMem = codigosRecuperacionMemoria.find(
    (c) =>
      String(c.usuario_id) === String(usuario.id) &&
      c.codigo_hash === cHash &&
      !c.fecha_uso
  );

  if (!codMem) {
    return { estado: 'INVALIDO' };
  }

  if (await verificarPassword(passwordNueva, passwordHash)) {
    return { estado: 'MISMA_CLAVE' };
  }

  const nuevoHash = await generarPasswordHash(passwordNueva);
  codMem.fecha_uso = new Date();

  // Invalidar tokens reset en memoria
  passwordResetTokensMemoria.forEach((t) => {
    if (String(t.usuario_id) === String(usuario.id) && !t.fecha_uso) {
      t.fecha_uso = new Date();
    }
  });

  usuario.passwordHash = nuevoHash;
  usuario.password_hash = nuevoHash;
  usuario.versionSesion = (usuario.versionSesion || 0) + 1;
  usuario.version_sesion = usuario.versionSesion;

  return { estado: 'OK' };
}

export default {
  normalizar,
  hashCodigo,
  codigoNuevo,
  generar,
  estado,
  restablecer,
  codigosRecuperacionMemoria,
};
