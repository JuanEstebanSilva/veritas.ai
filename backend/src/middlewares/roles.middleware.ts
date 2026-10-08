import { Request, Response, NextFunction } from 'express';

/**
 * Laboratorio No. 10 — Autorización Segura en APIs REST: RBAC, IDOR/BOLA y Control de Acceso
 * BLOQUE 6A — PARTE 3: Crear middleware de autorización
 *
 * Middleware reutilizable que verifica si el usuario autenticado posee uno de los roles permitidos.
 * - Si no está autenticado -> 401 Unauthorized ("Usuario no autenticado")
 * - Si está autenticado pero no tiene el rol permitido -> 403 Forbidden ("No tiene permisos para realizar esta operación")
 * - Si tiene el rol permitido -> next()
 */
export const autorizarRoles = (...rolesPermitidos: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // ------------------------------------
    // Debe existir usuario autenticado
    // ------------------------------------
    const usuario = req.usuario || (req as any).user;

    if (!usuario) {
      res.status(401).json({
        success: false,
        mensaje: 'Usuario no autenticado',
        message: 'Usuario no autenticado',
      });
      return;
    }

    // ------------------------------------
    // Verificar rol con normalización y compatibilidad
    // ------------------------------------
    const rawRol = String(usuario.rol || usuario.role || '').toLowerCase().trim();
    const permitidosNormalizados = rolesPermitidos.map((r) => r.toLowerCase().trim());

    const tienePermiso = permitidosNormalizados.some((rolPermitido) => {
      // Coincidencia exacta
      if (rolPermitido === rawRol) return true;

      // Equivalencias de administrador en Veritas AI
      if (
        (rolPermitido === 'administrador' || rolPermitido === 'admin') &&
        (rawRol === 'administrador' || rawRol === 'admin')
      ) {
        return true;
      }

      // Equivalencias de paciente / estudiante / usuario en Veritas AI
      if (
        (rolPermitido === 'paciente' || rolPermitido === 'user' || rolPermitido === 'usuario' || rolPermitido === 'estudiante') &&
        (rawRol === 'paciente' || rawRol === 'user' || rawRol === 'usuario' || rawRol === 'estudiante')
      ) {
        return true;
      }

      // Equivalencias de médico / docente / profesor / especialista en Veritas AI
      if (
        (rolPermitido === 'medico' || rolPermitido === 'doctor' || rolPermitido === 'auditor' || rolPermitido === 'docente' || rolPermitido === 'profesor') &&
        (rawRol === 'medico' || rawRol === 'doctor' || rawRol === 'auditor' || rawRol === 'docente' || rawRol === 'profesor')
      ) {
        return true;
      }

      return false;
    });

    if (!tienePermiso) {
      res.status(403).json({
        success: false,
        mensaje: 'No tiene permisos para realizar esta operación',
        message: 'No tiene permisos para realizar esta operación',
      });
      return;
    }

    next();
  };
};

export default autorizarRoles;
