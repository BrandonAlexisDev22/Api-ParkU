const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const PasswordUtil = require('../utils/password.util');
const { Usuario, Conductor } = require('../models');
const { sequelize } = require('../config/database');
const usuarioRepo = require('../repositories/usuario.repository');
const { crearConductorVinculado } = require('../utils/conductorVinculado.util');
const verificacionCorreoSvc = require('../services/verificacionCorreo.service');
const Logger = require('../utils/logger.util');

// Debe coincidir con el ENUM real de conductor.tipo_documento (conductores.models.js).
// Comparar contra un valor fuera de este set haría que Postgres rechace la
// consulta con "invalid input value for enum" en vez de simplemente no encontrar nada.
const TIPOS_DOCUMENTO_VALIDOS = ['CC', 'CE', 'TI', 'PASAPORTE', 'PEP', 'NIT'];
const { generarToken, generarRefreshToken, permisosDelRol } = require('../middlewares/auth.middleware');
const usuarioSvc = require('../services/usuario.service');
const recuperacionPasswordSvc = require('../services/recuperacionPassword.service');
const { handleError } = require('../helpers/errorHandler');

class AuthController {
  /**
   * POST /api/auth/registro - Registro de usuario
   */
  static async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map(err => ({
            field: err.param,
            message: err.msg
          }))
        });
      }

      const { correo, contrasena, nombre, numero } = req.body;
      // La fortaleza ya la validó registerValidation; falta la confirmación, que se
      // comprueba aquí -- antes de cualquier escritura. La regla vive en PasswordUtil para
      // que el registro público y POST /api/usuarios rechacen exactamente lo mismo.
      PasswordUtil.validarConfirmacion(contrasena, req.body);
      // Documento opcional: acepta tipo_documento/numero_documento (nombres reales de
      // columna en conductor) o su alias tipoDocumento/numeroDocumento (mismo criterio que
      // ya usa GET /api/auth/existe-documento). Si se envía, se crea un Conductor vinculado
      // (usuario_id) en la MISMA transacción que el Usuario -- ver
      // src/utils/conductorVinculado.util.js. Si el documento ya está en uso, toda la
      // transacción se revierte y no queda un Usuario huérfano sin conductor.
      const tipoDocumento = req.body.tipo_documento ?? req.body.tipoDocumento;
      const numeroDocumento = req.body.numero_documento ?? req.body.numeroDocumento;
      if ((tipoDocumento && !numeroDocumento) || (!tipoDocumento && numeroDocumento)) {
        return res.status(400).json({
          success: false,
          message: 'tipo_documento y numero_documento deben enviarse juntos',
        });
      }

      // 🔒 El rol NUNCA se toma del body. Todo registro público usa el rol_id
      // por defecto del modelo (3 = Conductor). Si necesitas crear cuentas de
      // Admin (2) o Vigilante (1), hazlo desde un endpoint protegido
      // (verificarToken + verificarRol([2])), no desde el registro público.

      // Verificar si el correo ya existe
      const existe = await Usuario.findOne({ where: { correo } });
      if (existe) {
        return res.status(400).json({
          success: false,
          message: 'El correo ya está registrado'
        });
      }

      // Verificar que el teléfono de contacto no esté ya en uso por otra cuenta
      if (numero) {
        const telefonoEnUso = await Usuario.findOne({ where: { numero_telefonico: numero } });
        if (telefonoEnUso) {
          return res.status(400).json({
            success: false,
            message: 'Este número de teléfono ya está registrado en otra cuenta'
          });
        }
      }

      // Encriptar contraseña
      const hashedPassword = await PasswordUtil.hash(contrasena);

      const nuevo = await sequelize.transaction(async (transaction) => {
        const usuario = await Usuario.create({
          correo,
          contrasena: hashedPassword,
          nombre,
          numero_telefonico: numero || null,
          estado: 'ACTIVO',
          // El documento queda también en la cuenta (migración 002), no solo en el
          // Conductor: así una cuenta lo tiene desde el registro y puede precargarse
          // después, en vez de tener que teclearlo de nuevo.
          tipo_documento: tipoDocumento ? tipoDocumento.toString().trim().toUpperCase() : null,
          numero_documento: numeroDocumento || null,
        }, { transaction });

        // El registro YA NO crea un perfil de Conductor. El documento queda en la cuenta
        // (migración 002) y esa cuenta sigue libre para vincularse cuando alguien la dé de
        // alta como conductor, con el documento ya precargado. Antes se creaba el
        // Conductor aquí mismo, y por eso las cuentas con documento aparecían siempre como
        // "ya vinculada a otro conductor".
        if (tipoDocumento && numeroDocumento) {
          const tipoNormalizado = tipoDocumento.toString().trim().toUpperCase();
          const otraCuenta = await Usuario.findOne({
            where: { tipo_documento: tipoNormalizado, numero_documento: numeroDocumento },
            transaction,
          });
          if (otraCuenta && otraCuenta.id !== usuario.id) {
            throw { status: 409, message: 'Ese documento ya está registrado en otra cuenta' };
          }
        }

        return usuario;
      });

      // Fuera de la transacción y sin bloquear la respuesta: el registro ya quedó
      // confirmado en BD; si el envío de correo falla, el usuario puede pedir un
      // reenvío (POST /api/auth/reenviar-verificacion) en vez de perder la cuenta creada.
      verificacionCorreoSvc.solicitar(nuevo).catch((error) => {
        Logger.error('No se pudo generar/enviar la verificación de correo en el registro', {
          usuario_id: nuevo.id,
          error: error.message,
        });
      });

      return res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente. Revisa tu correo para verificar tu cuenta.',
        data: {
          id: nuevo.id,
          correo: nuevo.correo,
          nombre: nuevo.nombre,
          numero: nuevo.numero_telefonico,
          rol: nuevo.rol_id,
          estado: nuevo.estado,
          foto_perfil_url: nuevo.foto_perfil_url,
          correo_verificado: nuevo.correo_verificado,
        }
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * GET /api/auth/existe-correo - Chequeo de disponibilidad para el formulario
   * de registro (validación en tiempo real, antes del submit). Público:
   * revela si un correo está registrado.
   */
  static async existeCorreo(req, res) {
    try {
      const correo = (req.query.correo || '').toString().trim().toLowerCase();
      if (!correo) {
        return res.status(400).json({ success: false, message: 'correo es requerido' });
      }
      const usuario = await Usuario.findOne({ where: { correo } });
      return res.status(200).json({ success: true, existe: !!usuario });
    } catch (error) {
      console.error('Error en existeCorreo:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/auth/existe-numero - Mismo propósito que existeCorreo, para el
   * teléfono de contacto de la cuenta.
   */
  static async existeNumero(req, res) {
    try {
      const numero = (req.query.numero || '').toString().trim();
      if (!numero) {
        return res.status(400).json({ success: false, message: 'numero es requerido' });
      }
      const usuario = await Usuario.findOne({ where: { numero_telefonico: numero } });
      return res.status(200).json({ success: true, existe: !!usuario });
    } catch (error) {
      console.error('Error en existeNumero:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  /**
   * GET /api/auth/existe-documento - Mismo propósito que existeCorreo/existeNumero,
   * pero contra la entidad Conductor (tipo_documento + numero_documento es su
   * clave única compuesta). El registro público NO crea un Conductor (ver
   * comentario en `register`), así que este chequeo es solo informativo: evita
   * que alguien registre una cuenta con un documento que ya pertenece a otra
   * persona en el sistema, aunque el documento en sí no quede asociado a la
   * cuenta que se está creando.
   */
  static async existeDocumento(req, res) {
    try {
      const tipoDocumento = (req.query.tipoDocumento || '').toString().trim().toUpperCase();
      const numeroDocumento = (req.query.numeroDocumento || '').toString().trim();
      if (!tipoDocumento || !numeroDocumento) {
        return res.status(400).json({ success: false, message: 'tipoDocumento y numeroDocumento son requeridos' });
      }
      if (!TIPOS_DOCUMENTO_VALIDOS.includes(tipoDocumento)) {
        // Un tipo de documento que ni siquiera es válido no puede existir.
        return res.status(200).json({ success: true, existe: false });
      }
      const conductor = await Conductor.findOne({
        where: { tipo_documento: tipoDocumento, numero_documento: numeroDocumento },
      });
      return res.status(200).json({ success: true, existe: !!conductor });
    } catch (error) {
      console.error('Error en existeDocumento:', error);
      return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }

  /**
   * POST /api/auth/login - Inicio de sesión
   */
  static async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array().map(err => ({
            field: err.param,
            message: err.msg
          }))
        });
      }

      const { correo, contrasena } = req.body;

      // Buscar usuario
      const user = await Usuario.findOne({ where: { correo } });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      if (user.estado !== 'ACTIVO') {
        return res.status(403).json({
          success: false,
          message: user.estado === 'BLOQUEADO'
            ? 'Usuario bloqueado. Contacte al administrador'
            : 'Usuario inactivo. Contacte al administrador'
        });
      }

      // La verificación de correo YA NO BLOQUEA el inicio de sesión: se registra
      // (correo_verificado) y el flujo de verificación sigue disponible -- enlace, código
      // de 6 dígitos y reenvío --, pero es informativo, no un requisito para entrar. El
      // estado viaja en la respuesta para que el frontend pueda invitar a verificar sin
      // impedir el acceso.

      // Verificar contraseña
      const isPasswordValid = await PasswordUtil.compare(contrasena, user.contrasena);
      if (!isPasswordValid) {
        // Cuenta el intento fallido y bloquea la cuenta tras 5 intentos (ver
        // usuario.repository.js). Sin esto, el estado BLOQUEADO nunca se alcanza.
        await usuarioRepo.registrarLoginFallido(user.id);
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Login correcto: limpia el contador de intentos fallidos y marca el acceso.
      await usuarioRepo.registrarLoginExitoso(user.id);

      // Generar tokens
      const payload = {
        id: user.id,
        correo: user.correo,
        rol: user.rol_id,
        fecha_cambio_contrasena: user.fecha_cambio_contrasena,
      };

      const token = generarToken(payload);
      const refreshToken = generarRefreshToken(payload);

      // Los refresh tokens son JWT sin estado (usuario no tiene columna
      // refresh_token en la BD real) -- no hay nada que persistir aquí.

      // Permisos efectivos del rol: sin esto el frontend no tiene forma de saber qué
      // puede hacer quien acaba de entrar, y no puede decidir qué pestañas mostrar --
      // con un rol nuevo (creado desde POST /api/roles) se quedaba sin ninguna, porque
      // lo único que recibía era el id del rol y la interfaz solo conocía los tres del
      // sistema. También viaja rol_nombre para poder mostrar la etiqueta real.
      const permisos = [...(await permisosDelRol(user.rol_id))];
      const publico = await usuarioRepo.findById(user.id);

      // Respuesta sin datos sensibles
      return res.status(200).json({
        success: true,
        message: 'Login exitoso',
        data: {
          user: {
            id: user.id,
            correo: user.correo,
            nombre: user.nombre,
            numero: user.numero_telefonico,
            rol: user.rol_id,
            rol_nombre: publico?.rol_nombre ?? null,
            estado: user.estado,
            foto_perfil_url: user.foto_perfil_url,
            permisos,
          },
          token,
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
      });
    } catch (error) {
      console.error('Error en login:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /api/auth/verificar - Verificar token JWT
   */
  static async verificar(req, res) {
    try {
      // El middleware verificarToken ya validó el token y guardó el usuario en
      // req.usuario. Se le añaden los permisos vigentes del rol para que el frontend
      // pueda rehacer su menú al recargar la página sin volver a iniciar sesión -- y para
      // que un permiso otorgado hace un momento se refleje en la siguiente carga.
      const permisos = [...(await permisosDelRol(req.usuario.rol))];

      return res.status(200).json({
        success: true,
        message: 'Token válido',
        data: {
          usuario: { ...req.usuario, permisos }
        }
      });
    } catch (error) {
      console.error('Error en verificar:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * GET /api/auth/perfil - Perfil completo del usuario autenticado.
   *
   * Reúne en una sola respuesta lo que la aplicación necesita al arrancar: los datos de la
   * cuenta, su documento (del Conductor vinculado, si tiene), el nombre real del rol y la
   * lista de permisos con la que decidir qué pestañas mostrar. Antes había que adivinarlo
   * cruzando varios endpoints, y los permisos no los devolvía ninguno.
   */
  static async perfil(req, res) {
    try {
      const usuario = await usuarioSvc.getById(req.usuario.id);
      const permisos = [...(await permisosDelRol(usuario.rol_id))];

      return res.status(200).json({
        success: true,
        data: { ...usuario, permisos },
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * POST /api/auth/refresh-token - Renovar token de acceso
   */
  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token requerido'
        });
      }

      // Verificar refresh token
      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      } catch (error) {
        if (error.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Refresh token expirado. Inicia sesión nuevamente'
          });
        }
        return res.status(401).json({
          success: false,
          message: 'Refresh token inválido'
        });
      }

      // Los refresh tokens son JWT sin estado: ya se verificó la firma/expiración
      // arriba. Solo falta confirmar que el usuario siga existiendo y activo.
      const user = await Usuario.findOne({
        where: { id: decoded.id, estado: 'ACTIVO' }
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado o inactivo'
        });
      }

      // Mismo chequeo que verificarToken (auth.middleware.js): un refresh token emitido
      // antes del último cambio de contraseña no debe poder canjearse por uno nuevo.
      if (user.fecha_cambio_contrasena) {
        const pwdTsToken = decoded.pwdTs || 0;
        const pwdTsUsuario = new Date(user.fecha_cambio_contrasena).getTime();
        if (pwdTsToken < pwdTsUsuario) {
          return res.status(401).json({
            success: false,
            message: 'La contraseña fue cambiada recientemente. Inicia sesión nuevamente.'
          });
        }
      }

      // Generar nuevo token
      const newToken = generarToken({
        id: user.id,
        correo: user.correo,
        rol: user.rol_id,
        fecha_cambio_contrasena: user.fecha_cambio_contrasena,
      });

      return res.status(200).json({
        success: true,
        data: {
          token: newToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        }
      });
    } catch (error) {
      console.error('Error en refreshToken:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /**
   * POST /api/auth/logout - Cerrar sesión
   */
  static async logout(req, res) {
    try {
      // Los refresh tokens son JWT sin estado (no hay columna que limpiar en BD);
      // el cliente simplemente descarta el token.
      return res.status(200).json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error) {
      console.error('Error en logout:', error);
      return res.status(500).json({
        success: false,
        message: 'Error al cerrar sesión'
      });
    }
  }

  /**
   * POST /api/auth/recuperar-password - Solicita un token de recuperación de contraseña
   */
  static async recuperarPassword(req, res) {
    try {
      const { correo } = req.body;
      await recuperacionPasswordSvc.solicitar(correo);
      // Respuesta genérica siempre: no revela si el correo existe o no (evita
      // enumeración de cuentas). El token real solo viaja por el correo enviado.
      return res.status(200).json({
        success: true,
        message: 'Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña',
      });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * POST /api/auth/restablecer-password - Consume el token y fija la nueva contraseña
   */
  static async restablecerPassword(req, res) {
    try {
      const { token, nuevaContrasena } = req.body;
      await recuperacionPasswordSvc.restablecer(token, nuevaContrasena);
      return res.status(200).json({ success: true, message: 'Contraseña actualizada correctamente' });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * GET /api/auth/verificar-correo?token=... - Consume el token y marca el correo como verificado
   */
  static async verificarCorreo(req, res) {
    try {
      const { token } = req.query;
      await verificacionCorreoSvc.confirmar(token);
      return res.status(200).json({ success: true, message: 'Correo verificado correctamente' });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * POST /api/auth/verificar-codigo - Consume el código de 6 dígitos y marca el correo
   * como verificado. Alternativa al enlace; ambos salen de la misma solicitud.
   */
  static async verificarCodigo(req, res) {
    try {
      const { correo, codigo } = req.body;
      await verificacionCorreoSvc.confirmarCodigo(correo, codigo);
      return res.status(200).json({ success: true, message: 'Correo verificado correctamente' });
    } catch (error) {
      handleError(res, error);
    }
  }

  /**
   * POST /api/auth/reenviar-verificacion - Genera y envía un nuevo enlace y código de verificación
   */
  static async reenviarVerificacion(req, res) {
    try {
      const { correo } = req.body;
      if (!correo) throw { status: 400, message: 'El correo es requerido' };

      const usuario = await Usuario.findOne({ where: { correo } });
      // Misma respuesta exista o no la cuenta, o ya esté verificada -- evita enumeración
      // de cuentas y no revela el estado de verificación de un correo ajeno.
      if (usuario) {
        await verificacionCorreoSvc.solicitar(usuario);
      }
      return res.status(200).json({
        success: true,
        message: 'Si el correo está registrado y aún no ha sido verificado, recibirás un nuevo enlace',
      });
    } catch (error) {
      handleError(res, error);
    }
  }
}

module.exports = AuthController;