/**
 * Maneja errores en controllers.
 * Si el error tiene .status lo usa, si no responde 500.
 */
const handleError = (res, error) => {
  if (error.status) {
    return res.status(error.status).json({ message: error.message });
  }
  console.error(error);
  return res.status(500).json({ message: 'Error interno del servidor' });
};

module.exports = { handleError };
