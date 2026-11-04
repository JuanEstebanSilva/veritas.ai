import crypto from 'node:crypto';
import { pool } from '../config/database';
import { prisma } from '../config/prisma';
import { generarPasswordHash, verificarPassword } from '../utils/password.util';
import usuariosService, { usuariosMemoria } from './usuarios.service';

/**
 * Servicio de Recuperación Administrativa de Contraseñas (Laboratorio / Bloque 11)
 * Veritas AI — Plataforma de Integridad Académica
 *
 * Permite que un docente o administrador autorice la emisión de un token temporal
 * de 15 minutos, almacenado de forma segura como hash SHA-256.
 */

export interface TokenResetMemoria {
  id: number;
  usuario_id: number | string;
  administrador_id: number | string;
  token_hash: string;
  token_plano?: string;
  fecha_creacion: Date;
  fecha_expiracion: Date;
  fecha_uso?: Date | null;
}

export const passwordResetTokensMemoria: TokenResetMemoria[] = [];

export const hashToken = (token: string): string =>
  crypto.createHash('sha256').update(token, 'utf8').digest('hex');

export const generarRecuperacion = async (
  usuarioId: string | number,
  administradorId: string | number
): Promise<{ estado: string; token?: string; expiraEn?: Date }> => {
  const usuario = await usuariosService.obtenerUsuarioPorId(usuarioId);
  const activo = usuario ? (usuario.activo ?? usuario.is_active ?? true) : false;

  if (!usuario || !activo) {
    return { estado: 'NO_ENCONTRADO' };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tHash = hashToken(token);
  const expiraEn = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

  let numUsuarioId = Number(usuarioId);
  if (isNaN(numUsuarioId) && usuario) {
    numUsuarioId = Number((usuario as any).numId || (usuario as any).dbId || usuario.id);
  }
  let numAdminId = Number(administradorId);
  if (isNaN(numAdminId)) {
    numAdminId = 1;
  }

  // 1. Intentar persistir en PostgreSQL
  try {
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      // Invalidar tokens previos sin usar
      if (!isNaN(numUsuarioId)) {
        await cliente.query(
          `UPDATE public.password_reset_tokens
           SET fecha_uso = NOW()
           WHERE usuario_id = $1 AND fecha_uso IS NULL`,
          [numUsuarioId]
        );

        const guardado = await cliente.query(
          `INSERT INTO public.password_reset_tokens
           (usuario_id, administrador_id, token_hash, fecha_expiracion)
           VALUES ($1, $2, $3, NOW() + INTERVAL '15 minutes')
           RETURNING fecha_expiracion AS "expiraEn"`,
          [numUsuarioId, !isNaN(numAdminId) ? numAdminId : 1, tHash]
        );
        await cliente.query('COMMIT');
        if (guardado.rows[0]?.expiraEn) {
          expiraEn.setTime(new Date(guardado.rows[0].expiraEn).getTime());
        }
      } else {
        await cliente.query('ROLLBACK');
      }
    } catch (dbErr) {
      await cliente.query('ROLLBACK');
      console.warn('[passwordReset.service] Fallback DB en generarRecuperacion:', (dbErr as any)?.message);
    } finally {
      cliente.release();
    }
  } catch (poolErr) {
    // Si pool no responde, continuar con memoria
  }

  // 2. Registrar en memoria
  // Invalidar previos en memoria
  passwordResetTokensMemoria.forEach((t) => {
    if (String(t.usuario_id) === String(usuarioId) && !t.fecha_uso) {
      t.fecha_uso = new Date();
    }
  });

  const nuevoTokenMem: TokenResetMemoria = {
    id: passwordResetTokensMemoria.length + 1,
    usuario_id: usuario.id,
    administrador_id: administradorId,
    token_hash: tHash,
    token_plano: token,
    fecha_creacion: new Date(),
    fecha_expiracion: expiraEn,
    fecha_uso: null,
  };
  passwordResetTokensMemoria.push(nuevoTokenMem);

  return {
    estado: 'OK',
    token,
    expiraEn,
  };
};

export const restablecerPassword = async (
  token: string,
  passwordNueva: string
): Promise<{ estado: string }> => {
  const tHash = hashToken(token);
  let registroDb: any = null;

  // 1. Buscar en PostgreSQL
  try {
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      const res = await cliente.query(
        `SELECT t.id, t.usuario_id, t.fecha_expiracion, t.fecha_uso,
                u.activo, u.password_hash, u.email
         FROM public.password_reset_tokens t
         JOIN public.usuarios u ON u.id = t.usuario_id
         WHERE t.token_hash = $1
         FOR UPDATE OF t, u`,
        [tHash]
      );
      if (res.rows.length > 0) {
        registroDb = res.rows[0];
      }

      if (registroDb) {
        if (
          registroDb.fecha_uso ||
          !registroDb.activo ||
          new Date(registroDb.fecha_expiracion).getTime() <= Date.now()
        ) {
          await cliente.query('ROLLBACK');
          return { estado: 'TOKEN_INVALIDO' };
        }

        if (await verificarPassword(passwordNueva, registroDb.password_hash)) {
          await cliente.query('ROLLBACK');
          return { estado: 'MISMA_CLAVE' };
        }

        const nuevoHash = await generarPasswordHash(passwordNueva);

        await cliente.query(
          `UPDATE public.usuarios
           SET password_hash = $1, version_sesion = COALESCE(version_sesion, 0) + 1
           WHERE id = $2`,
          [nuevoHash, registroDb.usuario_id]
        );

        await cliente.query(
          `UPDATE public.password_reset_tokens
           SET fecha_uso = NOW()
           WHERE usuario_id = $1 AND fecha_uso IS NULL`,
          [registroDb.usuario_id]
        );

        await cliente.query(
          `UPDATE public.codigos_recuperacion
           SET fecha_uso = NOW()
           WHERE usuario_id = $1 AND fecha_uso IS NULL`,
          [registroDb.usuario_id]
        );

        await cliente.query('COMMIT');

        // Sincronizar en memoria
        const usuarioMem = await usuariosService.obtenerUsuarioPorId(registroDb.usuario_id);
        if (usuarioMem) {
          usuarioMem.passwordHash = nuevoHash;
          usuarioMem.password_hash = nuevoHash;
          usuarioMem.versionSesion = (usuarioMem.versionSesion || 0) + 1;
          usuarioMem.version_sesion = usuarioMem.versionSesion;
        }

        // Marcar en memoria tokens y códigos
        passwordResetTokensMemoria.forEach((t) => {
          if (String(t.usuario_id) === String(registroDb.usuario_id) && !t.fecha_uso) {
            t.fecha_uso = new Date();
          }
        });

        // Actualizar Prisma si existe
        try {
          await prisma.user.updateMany({
            where: { email: registroDb.email },
            data: { password_hash: nuevoHash },
          });
        } catch {}

        return { estado: 'OK' };
      }
      await cliente.query('ROLLBACK');
    } catch (dbErr) {
      await cliente.query('ROLLBACK');
      console.warn('[passwordReset.service] Fallback DB en restablecerPassword:', (dbErr as any)?.message);
    } finally {
      cliente.release();
    }
  } catch (poolErr) {
    // Si pool falla, verificar en memoria
  }

  // 2. Fallback en memoria
  const registroMem = passwordResetTokensMemoria.find((t) => t.token_hash === tHash);
  if (!registroMem || registroMem.fecha_uso || registroMem.fecha_expiracion.getTime() <= Date.now()) {
    return { estado: 'TOKEN_INVALIDO' };
  }

  const usuario = await usuariosService.obtenerUsuarioPorId(registroMem.usuario_id);
  const passwordHash = usuario?.passwordHash || usuario?.password_hash;
  if (!usuario || !passwordHash) {
    return { estado: 'TOKEN_INVALIDO' };
  }

  if (await verificarPassword(passwordNueva, passwordHash)) {
    return { estado: 'MISMA_CLAVE' };
  }

  const nuevoHash = await generarPasswordHash(passwordNueva);
  registroMem.fecha_uso = new Date();

  // Actualizar usuario en memoria
  usuario.passwordHash = nuevoHash;
  usuario.password_hash = nuevoHash;
  usuario.versionSesion = (usuario.versionSesion || 0) + 1;
  usuario.version_sesion = usuario.versionSesion;

  return { estado: 'OK' };
};

export default {
  hashToken,
  generarRecuperacion,
  restablecerPassword,
  passwordResetTokensMemoria,
};
