const { body, validationResult } = require('express-validator');

// =============================================
// VALIDACIÓN DE REGISTRO
// =============================================

const registerValidation = [
  body('correo')
    .isEmail()
    .withMessage('Debe ser un correo electrónico válido')
    .normalizeEmail(),

  body('contrasena')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/)
    .withMessage('La contraseña debe tener al menos una mayúscula')
    .matches(/[a-z]/)
    .withMessage('La contraseña debe tener al menos una minúscula')
    .matches(/[0-9]/)
    .withMessage('La contraseña debe tener al menos un número'),

  // El registro público IGNORA el rol (siempre nace como Comunidad SENA, ver
  // auth.controller.register), así que aquí solo se comprueba la forma. El rango fijo
  // 1..3 que había antes rechazaba con 400 una petición que incluyera un rol nuevo y
  // válido -- creado desde POST /api/roles -- aunque el registro ni siquiera lo mire.
  body('rol')
    .optional()
    .isInt({ min: 1 })
    .withMessage('El rol debe ser un identificador numérico'),
];

// =============================================
// VALIDACIÓN DE LOGIN
// =============================================

const loginValidation = [
  body('correo')
    .isEmail()
    .withMessage('Debe ser un correo electrónico válido')
    .normalizeEmail(),

  body('contrasena')
    .notEmpty()
    .withMessage('La contraseña es requerida'),
];

// =============================================
// VALIDACIÓN DE REFRESH TOKEN
// =============================================

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token requerido'),
];

// =============================================
// MIDDLEWARE PARA PROCESAR ERRORES
// =============================================

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validación',
      errors: errors.array().map((error) => ({
        campo: error.path,
        mensaje: error.msg,
      })),
    });
  }

  next();
};

// =============================================
// EXPORTACIONES
// =============================================

module.exports = {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  validate,
};