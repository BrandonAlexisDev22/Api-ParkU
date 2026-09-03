/**
 * @module ProbarCorreoScript
 * @description Diagnóstico de la configuración SMTP, sin levantar la API ni tocar la base
 * de datos. Comprueba qué proveedor quedó activo, abre una conexión real para validar las
 * credenciales y, opcionalmente, envía el correo de verificación de prueba.
 *
 * Uso:
 *   npm run mail:test                        -> solo verifica la conexión
 *   npm run mail:test -- tucorreo@gmail.com  -> además envía un correo de prueba
 *   npm run mail:test -- --servicios         -> lista los nombres válidos de MAIL_SERVICE
 */

require('dotenv').config();

const { verificarConexion, enviarCorreoVerificacion, listarServicios } = require('../utils/mailer.util');

const main = async () => {
  const args = process.argv.slice(2);

  if (args.includes('--servicios') || args.includes('--services')) {
    console.log('\nServicios válidos para MAIL_SERVICE:\n');
    console.log(listarServicios().join(', '));
    console.log('\nTambién puedes dejar MAIL_SERVICE vacío y configurar SMTP_HOST/SMTP_PORT a mano.\n');
    return;
  }

  const proveedor = process.env.MAIL_SERVICE || process.env.SMTP_SERVICE || process.env.SMTP_HOST || '(ninguno)';
  console.log('\n=== Configuración de correo ===');
  console.log(`  Proveedor : ${proveedor}`);
  console.log(`  Usuario   : ${process.env.SMTP_USER || '(vacío)'}`);
  console.log(`  Contraseña: ${process.env.SMTP_PASSWORD ? `(definida, ${process.env.SMTP_PASSWORD.length} caracteres)` : '(vacía)'}`);
  console.log(`  Remitente : ${process.env.MAIL_FROM || process.env.SMTP_USER || '(vacío)'}`);
  console.log(`  Frontend  : ${process.env.FRONTEND_URL || '(vacío)'}`);

  console.log('\n=== Verificando conexión SMTP ===');
  const resultado = await verificarConexion();
  if (!resultado.configurado) {
    console.log(`  ⚠️  ${resultado.detalle}`);
    console.log('     Define MAIL_SERVICE (p. ej. Gmail, Outlook365, Brevo, SendGrid, Mailtrap)');
    console.log('     o SMTP_HOST en el .env. Corre "npm run mail:test -- --servicios" para ver la lista.\n');
    process.exitCode = 1;
    return;
  }
  if (!resultado.ok) {
    console.log(`  ❌ ${resultado.detalle}\n`);
    process.exitCode = 1;
    return;
  }
  console.log(`  ✅ ${resultado.detalle}`);

  const destino = args.find((a) => a.includes('@'));
  if (!destino) {
    console.log('\n  Para enviar un correo de prueba: npm run mail:test -- tucorreo@dominio.com\n');
    return;
  }

  console.log(`\n=== Enviando correo de prueba a ${destino} ===`);
  const link = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verificar-correo?token=TOKEN_DE_PRUEBA`;
  // Código de muestra: el correo de prueba se ve igual que el real, para revisar cómo
  // queda el bloque del código en el cliente de correo antes de mandárselo a nadie.
  const envio = await enviarCorreoVerificacion(destino, 'Prueba ParkU', link, {
    codigo: '482917',
    minutos: parseInt(process.env.VERIFICACION_CODIGO_TTL_MINUTOS, 10) || 60,
  });
  if (envio.enviado) {
    console.log('  ✅ Correo enviado. Revisa la bandeja de entrada (y la carpeta de spam).\n');
  } else {
    console.log(`  ❌ No se pudo enviar: ${envio.motivo}\n`);
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error('Error inesperado:', error.message);
  process.exit(1);
});
