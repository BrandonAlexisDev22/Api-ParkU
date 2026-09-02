/**
 * Maneja errores en controllers.
 * Si el error tiene .status lo usa, si no responde 500.
 * Si además trae .data, se agrega al cuerpo de la respuesta (p. ej. para que el
 * frontend sepa a quién pertenece ya un recurso duplicado) -- opcional y
 * retrocompatible: los errores que no la traen responden exactamente igual que antes.
 */
const handleError = (res, error) => {
  if (error.status) {
    const body = { message: error.message };
    if (error.data !== undefined) body.data = error.data;
    return res.status(error.status).json(body);
  }
  console.error(error);
  return res.status(500).json({ message: 'Error interno del servidor' });
};

module.exports = { handleError };
