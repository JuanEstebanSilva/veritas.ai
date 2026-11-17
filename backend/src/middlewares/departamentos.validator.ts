import { body, param } from 'express-validator';

export const validarIdDepartamento = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID del departamento debe ser un número entero positivo.'),
];

export const validarCreacionDepartamento = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre del departamento es obligatorio.')
    .isLength({ min: 3, max: 150 })
    .withMessage('El nombre debe tener entre 3 y 150 caracteres.'),
  body('descripcion')
    .trim()
    .notEmpty()
    .withMessage('La descripción del departamento es obligatoria.')
    .isLength({ min: 5 })
    .withMessage('La descripción debe tener al menos 5 caracteres.'),
  body('activo')
    .optional()
    .isBoolean()
    .withMessage('El campo activo debe ser un valor booleano.'),
];

export const validarDepartamentoParcial = [
  body('nombre')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre del departamento no puede estar vacío.')
    .isLength({ min: 3, max: 150 })
    .withMessage('El nombre debe tener entre 3 y 150 caracteres.'),
  body('descripcion')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('La descripción no puede estar vacía.')
    .isLength({ min: 5 })
    .withMessage('La descripción debe tener al menos 5 caracteres.'),
  body('activo')
    .optional()
    .isBoolean()
    .withMessage('El campo activo debe ser un valor booleano.'),
];
