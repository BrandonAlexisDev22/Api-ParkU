const { body } = require('express-validator');

const registerValidation = [
  body('correo')
    .isEmail()
    .withMessage('Debe ser un correo electrónico válido')
    .normalizeEmail(),
  
  body('contraseña')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/)
    .withMessage('La contraseña debe tener al menos una mayúscula')
    .matches(/[a-z]/)
    .withMessage('La contraseña debe tener al menos una minúscula')
    .matches(/[0-9]/)
    .withMessage('La contraseña debe tener al menos un número'),
  
  body('rol')
    .optional()
    .isInt({ min: 1, max: 3 })
    .withMessage('Rol inválido (debe ser 1, 2 o 3)')
];

const loginValidation = [
  body('correo')
    .isEmail()
    .withMessage('Debe ser un correo electrónico válido')
    .normalizeEmail(),
  
  body('contraseña')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token requerido')
];

module.exports = {
  registerValidation,
  loginValidation,
  refreshTokenValidation
};