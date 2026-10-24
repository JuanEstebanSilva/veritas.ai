import { Router } from 'express';
import {
  obtenerDepartamentos,
  obtenerDepartamentoPorId,
  crearDepartamento,
  actualizarDepartamento,
  actualizarDepartamentoParcial,
  eliminarDepartamento,
} from '../controllers/departamentos.controller';
import {
  validarIdDepartamento,
  validarCreacionDepartamento,
  validarDepartamentoParcial,
} from '../middlewares/departamentos.validator';
import { validar } from '../middlewares/validar.middleware';
import { autenticarJWT } from '../middlewares/auth.middleware';
import { autorizarRoles } from '../middlewares/roles.middleware';

const router = Router();

// GET /api/departamentos (o /api/especialidades) — Listar
router.get(
  '/',
  autenticarJWT,
  autorizarRoles(
    'administrador',
    'admin',
    'medico',
    'doctor',
    'paciente',
    'user',
    'docente',
    'profesor',
    'estudiante',
    'auditor'
  ),
  obtenerDepartamentos
);

// GET /api/departamentos/:id (o /api/especialidades/:id) — Consultar por ID
router.get(
  '/:id',
  autenticarJWT,
  autorizarRoles(
    'administrador',
    'admin',
    'medico',
    'doctor',
    'paciente',
    'user',
    'docente',
    'profesor',
    'estudiante',
    'auditor'
  ),
  validarIdDepartamento,
  validar,
  obtenerDepartamentoPorId
);

// POST /api/departamentos — Crear departamento (Solo Administrador)
router.post(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarCreacionDepartamento,
  validar,
  crearDepartamento
);

// PUT /api/departamentos/:id — Actualizar completamente (Solo Administrador)
router.put(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdDepartamento,
  validarCreacionDepartamento,
  validar,
  actualizarDepartamento
);

// PATCH /api/departamentos/:id — Actualizar parcialmente (Solo Administrador)
router.patch(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdDepartamento,
  validarDepartamentoParcial,
  validar,
  actualizarDepartamentoParcial
);

// DELETE /api/departamentos/:id — Eliminar departamento (Solo Administrador)
router.delete(
  '/:id',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarIdDepartamento,
  validar,
  eliminarDepartamento
);

export default router;
