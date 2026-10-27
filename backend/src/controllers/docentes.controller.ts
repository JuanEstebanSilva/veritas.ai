import { Request, Response, NextFunction } from 'express';
import { matchedData } from 'express-validator';
import docentesService from '../services/docentes.service';
import usuariosService from '../services/usuarios.service';
import revisionesService from '../services/revisiones.service';

/**
 * Veritas AI — Controlador de Docentes / Auditores de Integridad Académica
 */

export const obtenerDocentes = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lista = await docentesService.obtenerDocentes();
    res.status(200).json({
      success: true,
      total: lista.length,
      mensaje: 'Lista de docentes / auditores obtenida correctamente',
      docentes: lista,
      medicos: lista,
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerDocentePorId = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const docente = await docentesService.obtenerDocentePorId(id);

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
  } catch (error) {
    next(error);
  }
};

export const crearDocente = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const raw = req.body || {};
    const matched = matchedData(req, { locations: ['body'] }) as any;
    const datos = {
      ...raw,
      ...matched,
    };
    datos.registroAcademico = datos.registroAcademico || datos.registro_academico || datos.registroMedico || datos.registro_medico || datos.registroProfesional || datos.registro_profesional;
    datos.departamentoId = datos.departamentoId !== undefined ? datos.departamentoId : (datos.departamento_id !== undefined ? datos.departamento_id : (datos.especialidadId !== undefined ? datos.especialidadId : (datos.especialidad_id !== undefined ? datos.especialidad_id : 1)));
    datos.usuarioId = datos.usuarioId !== undefined ? datos.usuarioId : datos.usuario_id;

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

      const docenteExistente = await docentesService.obtenerDocentePorUsuarioId(
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

    const docente = await docentesService.crearDocente(datos);

    res.status(201).json({
      success: true,
      mensaje: 'Docente creado correctamente',
      docente,
      medico: docente,
    });
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        mensaje: 'El registro académico o email ya se encuentra registrado para otro docente',
        message: 'Conflicto: registro duplicado en la base de datos',
      });
      return;
    }
    if (error.code === '23503') {
      res.status(400).json({
        success: false,
        mensaje: 'El departamento académico especificado no existe',
        message: 'Referencia inválida: clave foránea no encontrada',
      });
      return;
    }
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
    const raw = req.body || {};
    const matched = matchedData(req, { locations: ['body'] }) as any;
    const datos = {
      ...raw,
      ...matched,
    };
    datos.registroAcademico = datos.registroAcademico || datos.registro_academico || datos.registroMedico || datos.registro_medico || datos.registroProfesional || datos.registro_profesional;
    datos.departamentoId = datos.departamentoId !== undefined ? datos.departamentoId : (datos.departamento_id !== undefined ? datos.departamento_id : (datos.especialidadId !== undefined ? datos.especialidadId : (datos.especialidad_id !== undefined ? datos.especialidad_id : undefined)));
    datos.usuarioId = datos.usuarioId !== undefined ? datos.usuarioId : datos.usuario_id;

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

      const existente = await docentesService.obtenerDocentePorUsuarioId(datos.usuarioId);
      if (existente && String(existente.id) !== String(id)) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario ya está asociado a un docente',
        });
        return;
      }
    }

    const docente = await docentesService.actualizarDocente(id, datos);
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
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        mensaje: 'El registro académico o email ya se encuentra registrado para otro docente',
      });
      return;
    }
    if (error.code === '23503') {
      res.status(400).json({
        success: false,
        mensaje: 'El departamento académico especificado no existe',
      });
      return;
    }
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
    const raw = req.body || {};
    const matched = matchedData(req, { locations: ['body'] }) as any;
    const datos = {
      ...raw,
      ...matched,
    };
    datos.registroAcademico = datos.registroAcademico || datos.registro_academico || datos.registroMedico || datos.registro_medico || datos.registroProfesional || datos.registro_profesional;
    datos.departamentoId = datos.departamentoId !== undefined ? datos.departamentoId : (datos.departamento_id !== undefined ? datos.departamento_id : (datos.especialidadId !== undefined ? datos.especialidadId : (datos.especialidad_id !== undefined ? datos.especialidad_id : undefined)));
    datos.usuarioId = datos.usuarioId !== undefined ? datos.usuarioId : datos.usuario_id;

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

      const existente = await docentesService.obtenerDocentePorUsuarioId(datos.usuarioId);
      if (existente && String(existente.id) !== String(id)) {
        res.status(409).json({
          success: false,
          mensaje: 'El usuario ya está asociado a un docente',
        });
        return;
      }
    }

    const docente = await docentesService.actualizarDocenteParcial(id, datos);
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
  } catch (error: any) {
    if (error.code === '23505') {
      res.status(409).json({
        success: false,
        mensaje: 'El registro académico o email ya se encuentra registrado para otro docente',
      });
      return;
    }
    if (error.code === '23503') {
      res.status(400).json({
        success: false,
        mensaje: 'El departamento académico especificado no existe',
      });
      return;
    }
    next(error);
  }
};

export const eliminarDocente = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const docente = await docentesService.obtenerDocentePorId(id);

    if (!docente) {
      res.status(404).json({ success: false, mensaje: 'Docente no encontrado' });
      return;
    }

    // Integridad Referencial: Un docente con revisiones activas no puede eliminarse
    const revisionesAsociadas = await revisionesService.obtenerRevisionesPorDocente(id);
    if (revisionesAsociadas.length > 0) {
      res.status(409).json({
        success: false,
        mensaje: 'No se puede eliminar el docente porque tiene revisiones asignadas',
        message: 'No se puede eliminar el docente porque tiene revisiones asignadas',
      });
      return;
    }

    await docentesService.eliminarDocente(id);

    res.status(200).json({
      success: true,
      mensaje: 'Docente eliminado correctamente',
    });
  } catch (error: any) {
    if (error.code === '23503') {
      res.status(409).json({
        success: false,
        mensaje: 'No se puede eliminar el docente porque tiene revisiones asociadas',
        message: 'Violación de clave foránea: existen registros dependientes',
      });
      return;
    }
    next(error);
  }
};

export default {
  obtenerDocentes,
  obtenerDocentePorId,
  crearDocente,
  actualizarDocente,
  actualizarDocenteParcial,
  eliminarDocente,
  // Alias de compatibilidad
  obtenerMedicos: obtenerDocentes,
  obtenerMedicoPorId: obtenerDocentePorId,
  crearMedico: crearDocente,
  actualizarMedico: actualizarDocente,
  actualizarMedicoParcial: actualizarDocenteParcial,
  eliminarMedico: eliminarDocente,
};
