import { Request, Response, NextFunction } from 'express';
import { matchedData } from 'express-validator';
import docentesService from '../services/docentes.service';
import usuariosService from '../services/usuarios.service';
import revisionesService from '../services/revisiones.service';

/**
 * Veritas AI — Controlador de Docentes / Auditores de Integridad Académica
 */

export const obtenerDocentes = (req: Request, res: Response): void => {
  const lista = docentesService.obtenerDocentes();
  res.status(200).json({
    success: true,
    total: lista.length,
    mensaje: 'Lista de docentes / auditores obtenida correctamente',
    docentes: lista,
    medicos: lista,
  });
};

export const obtenerDocentePorId = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const docente = docentesService.obtenerDocentePorId(id);

  if (!docente) {
    res.status(404).json({
      success: false,
      mensaje: 'Docente no encontrado',
    });
    return;
  }

  res.status(200).json({
    success: true,
    docente,
    medico: docente,
  });
};

export const crearDocente = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const datos = matchedData(req, { locations: ['body'] }) as any;

    if (datos.usuarioId !== undefined && datos.usuarioId !== null) {
      const usuario = await usuariosService.obtenerUsuarioPorId(datos.usuarioId);

      if (!usuario) {
        res.status(400).json({
          success: false,
          mensaje: 'El usuario asociado no existe',
          message: 'El usuario asociado no existe',
        });
        return;
      }

      const rolUsuario = String(usuario.rol || usuario.role || '').toLowerCase().trim();
      if (
        rolUsuario !== 'medico' &&
        rolUsuario !== 'doctor' &&
        rolUsuario !== 'auditor' &&
        rolUsuario !== 'docente' &&
        rolUsuario !== 'profesor'
      ) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario asociado no tiene rol docente',
          message: 'El usuario asociado no tiene rol docente',
        });
        return;
      }

      const docenteExistente = docentesService.obtenerDocentePorUsuarioId(
        datos.usuarioId,
        datos.email
      );
      if (docenteExistente) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario ya está asociado a un docente',
          message: 'El usuario ya está asociado a un docente',
          docente: docenteExistente,
          medico: docenteExistente,
        });
        return;
      }
    }

    const docente = docentesService.crearDocente(datos);

    res.status(201).json({
      success: true,
      mensaje: 'Docente creado correctamente',
      docente,
      medico: docente,
    });
  } catch (error) {
    next(error);
  }
};

export const actualizarDocente = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const datos = matchedData(req, { locations: ['body'] }) as any;

    if (datos.usuarioId !== undefined && datos.usuarioId !== null) {
      const usuario = await usuariosService.obtenerUsuarioPorId(datos.usuarioId);
      if (!usuario) {
        res.status(400).json({
          success: false,
          mensaje: 'El usuario asociado no existe',
        });
        return;
      }

      const rolUsuario = String(usuario.rol || usuario.role || '').toLowerCase().trim();
      if (
        rolUsuario !== 'medico' &&
        rolUsuario !== 'doctor' &&
        rolUsuario !== 'auditor' &&
        rolUsuario !== 'docente' &&
        rolUsuario !== 'profesor'
      ) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario asociado no tiene rol docente',
        });
        return;
      }

      const existente = docentesService.obtenerDocentePorUsuarioId(datos.usuarioId);
      if (existente && existente.id !== Number(id)) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario ya está asociado a un docente',
        });
        return;
      }
    }

    const docente = docentesService.actualizarDocente(id, datos);
    if (!docente) {
      res.status(404).json({ success: false, mensaje: 'Docente no encontrado' });
      return;
    }

    res.status(200).json({
      success: true,
      mensaje: 'Docente actualizado correctamente',
      docente,
      medico: docente,
    });
  } catch (error) {
    next(error);
  }
};

export const actualizarDocenteParcial = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const datos = matchedData(req, { locations: ['body'] }) as any;

    if (datos.usuarioId !== undefined && datos.usuarioId !== null) {
      const usuario = await usuariosService.obtenerUsuarioPorId(datos.usuarioId);
      if (!usuario) {
        res.status(400).json({
          success: false,
          mensaje: 'El usuario asociado no existe',
        });
        return;
      }

      const rolUsuario = String(usuario.rol || usuario.role || '').toLowerCase().trim();
      if (
        rolUsuario !== 'medico' &&
        rolUsuario !== 'doctor' &&
        rolUsuario !== 'auditor' &&
        rolUsuario !== 'docente' &&
        rolUsuario !== 'profesor'
      ) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario asociado no tiene rol docente',
        });
        return;
      }

      const existente = docentesService.obtenerDocentePorUsuarioId(datos.usuarioId);
      if (existente && existente.id !== Number(id)) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario ya está asociado a un docente',
        });
        return;
      }
    }

    const docente = docentesService.actualizarDocenteParcial(id, datos);
    if (!docente) {
      res.status(404).json({ success: false, mensaje: 'Docente no encontrado' });
      return;
    }

    res.status(200).json({
      success: true,
      mensaje: 'Perfil de docente actualizado correctamente',
      docente,
      medico: docente,
    });
  } catch (error) {
    next(error);
  }
};

export const eliminarDocente = (req: Request, res: Response): void => {
  const id = req.params.id as string;
  const docente = docentesService.obtenerDocentePorId(id);

  if (!docente) {
    res.status(404).json({ success: false, mensaje: 'Docente no encontrado' });
    return;
  }

  const revisionesAsociadas = revisionesService.obtenerRevisionesPorDocente(id);
  if (revisionesAsociadas.length > 0) {
    res.status(409).json({
      success: false,
      mensaje: 'No se puede eliminar el docente porque tiene revisiones asignadas',
      message: 'No se puede eliminar el docente porque tiene revisiones asignadas',
    });
    return;
  }

  docentesService.eliminarDocente(id);

  res.status(200).json({
    success: true,
    mensaje: 'Docente eliminado correctamente',
  });
};

export default {
  obtenerDocentes,
  obtenerDocentePorId,
  crearDocente,
  actualizarDocente,
  actualizarDocenteParcial,
  eliminarDocente,
  // Alias
  obtenerMedicos: obtenerDocentes,
  obtenerMedicoPorId: obtenerDocentePorId,
  crearMedico: crearDocente,
  actualizarMedico: actualizarDocente,
  actualizarMedicoParcial: actualizarDocenteParcial,
  eliminarMedico: eliminarDocente,
};
