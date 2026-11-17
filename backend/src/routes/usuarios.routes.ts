import { Router } from 'express';
import { crearUsuario } from '../controllers/usuarios.controller';
import { validarCreacionUsuario } from '../middlewares/usuarios.validator';
import { validar } from '../middlewares/validar.middleware';
import { autenticarJWT } from '../middlewares/auth.middleware';
import { autorizarRoles } from '../middlewares/roles.middleware';

const router = Router();


router.post(
  '/',
  autenticarJWT,
  autorizarRoles('administrador', 'admin'),
  validarCreacionUsuario,
  validar,
  crearUsuario
);

export default router;
