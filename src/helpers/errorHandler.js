/**
 * Maneja errores en controllers.
 * Si el error tiene .status lo usa, si no responde 500.
 * Si además trae .data, se agrega al cuerpo de la respuesta (p. ej. para que el
 * frontend sepa a quién pertenece ya un recurso duplicado) -- opcional y
 * retrocompatible: los errores que no la traen responden exactamente igual que antes.
 *
 * .message siempre se garantiza no vacío: algunos errores llegan con .status pero
 * sin .message (p. ej. un `throw { status }` sin texto, o un mensaje de Postgres
 * vacío/no-string) -- sin este respaldo el body quedaría en {} (JSON.stringify
 * descarta claves undefined) y el frontend, al no encontrar message ni errors[],
 * cae a mostrar el código crudo ("Error 403") en vez de un texto entendible.
 */
const MENSAJE_GENERICO = 'Ocurrió un error al procesar la solicitud';

const handleError = (res, error) => {
  if (error.status) {
    const mensaje = typeof error.message === 'string' && error.message.trim()
      ? error.message
      : MENSAJE_GENERICO;
    const body = { message: mensaje };
    if (error.data !== undefined) body.data = error.data;
    return res.status(error.status).json(body);
  }
  console.error(error);
  return res.status(500).json({ message: 'Error interno del servidor' });
};

module.exports = { handleError };
