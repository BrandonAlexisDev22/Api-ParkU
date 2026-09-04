/**
 * @swagger
 * tags:
 *   name: Vehículos
 *   description: Endpoints para gestionar vehículos
 */

const svc = require('../services/vehiculo.service');
const { handleError } = require('../helpers/errorHandler');

/**
 * @swagger
 * components:
 *   schemas:
 *     Vehiculo:
 *       type: object
 *       required:
 *         - tipo
 *       properties:
 *         id:
 *           type: integer
 *         placa:
 *           type: string
 *           nullable: true
 *           description: >
 *             Única en el sistema y obligatoria. Puede venir en null en registros antiguos
 *             de tipo BICICLETA, un tipo que ya no se admite al crear ni editar.
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO]
 *         tarjeta_propiedad:
 *           type: string
 *           nullable: true
 *         marca:
 *           type: string
 *           nullable: true
 *         linea:
 *           type: string
 *           nullable: true
 *         modelo:
 *           type: integer
 *           nullable: true
 *           description: Año del vehículo.
 *         cilindraje:
 *           type: integer
 *           nullable: true
 *         color:
 *           type: string
 *           nullable: true
 *         servicio:
 *           type: string
 *           nullable: true
 *         carroceria:
 *           type: string
 *           nullable: true
 *         combustible:
 *           type: string
 *           nullable: true
 *         capacidad:
 *           type: integer
 *           nullable: true
 *         numero_motor:
 *           type: string
 *           nullable: true
 *         numero_chasis:
 *           type: string
 *           nullable: true
 *         observaciones:
 *           type: string
 *           nullable: true
 *         vehiculo_sena:
 *           type: boolean
 *           default: false
 *         estado:
 *           type: boolean
 *           default: true
 *         conductor_principal_id:
 *           type: integer
 *           nullable: true
 *           description: Solo lectura (JOIN con detalle_propiedad).
 *         conductor_principal_nombre:
 *           type: string
 *           description: Solo lectura (JOIN con detalle_propiedad).
 *     VehiculoCreate:
 *       type: object
 *       required:
 *         - tipo
 *       properties:
 *         conductor_id:
 *           type: integer
 *           nullable: true
 *           description: >
 *             Propietario principal, ya registrado. Alternativa a `conductor`: si el dueño
 *             todavía no existe en el sistema, no hace falta salir a crearlo aparte.
 *         conductor:
 *           type: object
 *           nullable: true
 *           description: >
 *             Datos del dueño cuando no se envía conductor_id. Se busca por documento: si
 *             esa persona ya estaba registrada se reutiliza, y si no, SE CREA en la misma
 *             transacción que el vehículo (sin cuenta de acceso: usuario_id null). Es lo
 *             que permite parquear a alguien que nunca ha pasado por el sistema sin
 *             abandonar el panel de estacionamiento. Los mismos campos se aceptan sueltos
 *             en la raíz del cuerpo.
 *           properties:
 *             tipo_documento:
 *               type: string
 *               enum: [CC, CE, TI, PASAPORTE, PEP, NIT]
 *               default: CC
 *             numero_documento:
 *               type: string
 *             nombre_apellidos:
 *               type: string
 *               description: Obligatorio solo si hay que crear al conductor.
 *             correo:
 *               type: string
 *               nullable: true
 *             numero_telefonico:
 *               type: string
 *               nullable: true
 *         placa:
 *           type: string
 *           nullable: true
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO]
 *         tarjeta_propiedad:
 *           type: string
 *           nullable: true
 *         marca:
 *           type: string
 *           nullable: true
 *         linea:
 *           type: string
 *           nullable: true
 *         modelo:
 *           type: integer
 *           nullable: true
 *         cilindraje:
 *           type: integer
 *           nullable: true
 *         color:
 *           type: string
 *           nullable: true
 *         servicio:
 *           type: string
 *           nullable: true
 *         carroceria:
 *           type: string
 *           nullable: true
 *         combustible:
 *           type: string
 *           nullable: true
 *         capacidad:
 *           type: integer
 *           nullable: true
 *         numero_motor:
 *           type: string
 *           nullable: true
 *         numero_chasis:
 *           type: string
 *           nullable: true
 *         observaciones:
 *           type: string
 *           nullable: true
 *         vehiculo_sena:
 *           type: boolean
 *           default: false
 *     VehiculoUpdate:
 *       type: object
 *       properties:
 *         placa:
 *           type: string
 *           nullable: true
 *         tipo:
 *           type: string
 *           enum: [CARRO, MOTO]
 *         tarjeta_propiedad:
 *           type: string
 *           nullable: true
 *         marca:
 *           type: string
 *           nullable: true
 *         linea:
 *           type: string
 *           nullable: true
 *         modelo:
 *           type: integer
 *           nullable: true
 *         cilindraje:
 *           type: integer
 *           nullable: true
 *         color:
 *           type: string
 *           nullable: true
 *         servicio:
 *           type: string
 *           nullable: true
 *         carroceria:
 *           type: string
 *           nullable: true
 *         combustible:
 *           type: string
 *           nullable: true
 *         capacidad:
 *           type: integer
 *           nullable: true
 *         numero_motor:
 *           type: string
 *           nullable: true
 *         numero_chasis:
 *           type: string
 *           nullable: true
 *         observaciones:
 *           type: string
 *           nullable: true
 *         vehiculo_sena:
 *           type: boolean
 *         estado:
 *           type: boolean
 */

/**
 * @swagger
 * /vehiculos:
 *   get:
 *     summary: Obtener todos los vehículos
 *     tags: [Vehículos]
 *     responses:
 *       200:
 *         description: Lista de todos los vehículos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehiculo'
 */
const getAll = async (req, res) => {
  try {
    const data = await svc.getAll();
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /vehiculos/{id}:
 *   get:
 *     summary: Obtener un vehículo por ID
 *     tags: [Vehículos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     responses:
 *       200:
 *         description: Vehículo encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehiculo'
 *       404:
 *         description: Vehículo no encontrado
 */
const getById = async (req, res) => {
  try {
    const data = await svc.getById(req.params.id);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /vehiculos/conductor/{conductorId}:
 *   get:
 *     summary: Obtener vehículos por conductor
 *     tags: [Vehículos]
 *     parameters:
 *       - in: path
 *         name: conductorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor
 *     responses:
 *       200:
 *         description: Lista de vehículos del conductor
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Vehiculo'
 */
const getByConductor = async (req, res) => {
  try {
    const data = await svc.getByConductor(req.params.conductorId);
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /api/vehiculos/buscar:
 *   get:
 *     summary: Busca vehículos por prefijo de placa (autocompletar mientras se escribe)
 *     tags: [Vehículos]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: placa
 *         schema:
 *           type: string
 *         description: Prefijo de la placa. Si se omite o viene vacío, no se consulta la BD y se devuelve [].
 *     responses:
 *       200:
 *         description: Coincidencias (máximo 20), ordenadas por placa
 *       401:
 *         description: No autorizado - Token requerido
 */
const buscarPorPlaca = async (req, res) => {
  try {
    // ?celda_id=7 restringe las sugerencias a los vehículos que caben en esa celda
    // (celda de moto -> solo motos). ?tipo=MOTO hace lo mismo sin conocer la celda.
    // Sin ninguno de los dos, el comportamiento es el de antes.
    const data = await svc.buscarPorPlaca(req.query.placa, {
      celda_id: req.query.celda_id,
      tipo: req.query.tipo,
    });
    res.json(data);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /vehiculos:
 *   post:
 *     summary: Crear un nuevo vehículo
 *     tags: [Vehículos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VehiculoCreate'
 *     responses:
 *       201:
 *         description: Vehículo creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehiculo'
 *       400:
 *         description: Datos inválidos o faltantes
 *       404:
 *         description: Conductor no encontrado
 *       409:
 *         description: La placa ya está registrada
 */
const create = async (req, res) => {
  try {
    const newVehiculo = await svc.create(req.body, req.usuario?.id);
    res.status(201).json(newVehiculo);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /vehiculos/{id}:
 *   put:
 *     summary: Actualizar un vehículo (parcial o total)
 *     tags: [Vehículos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VehiculoUpdate'
 *     responses:
 *       200:
 *         description: Vehículo actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehiculo'
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Vehículo no encontrado
 *       409:
 *         description: Conflicto de placa
 */
const update = async (req, res) => {
  try {
    const updated = await svc.update(req.params.id, req.body, req.usuario?.id);
    res.json(updated);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /vehiculos/{id}:
 *   delete:
 *     summary: Eliminar un vehículo por ID
 *     tags: [Vehículos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     responses:
 *       204:
 *         description: Vehículo eliminado correctamente
 *       404:
 *         description: Vehículo no encontrado
 *       409:
 *         description: No se puede eliminar porque tiene registros asociados
 */
const remove = async (req, res) => {
  try {
    await svc.remove(req.params.id, req.usuario?.id);
    res.status(204).send();
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /vehiculos/{id}/conductores:
 *   post:
 *     summary: Vincula un conductor adicional como copropietario del vehículo
 *     description: No reemplaza al propietario principal -- un vehículo puede tener más de un dueño (p. ej. una pareja o una familia compartiendo un carro).
 *     tags: [Vehículos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [conductor_id]
 *             properties:
 *               conductor_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Copropietario vinculado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehiculo'
 *       404:
 *         description: Vehículo o conductor no encontrado
 *       409:
 *         description: El conductor ya es propietario de este vehículo
 */
const agregarPropietario = async (req, res) => {
  try {
    const updated = await svc.agregarPropietario(req.params.id, req.body?.conductor_id, req.usuario?.id);
    res.status(201).json(updated);
  } catch (e) {
    handleError(res, e);
  }
};

/**
 * @swagger
 * /vehiculos/{id}/conductores/{conductorId}:
 *   delete:
 *     summary: Desvincula a un conductor como propietario del vehículo
 *     description: No permite quitar al propietario principal ni dejar el vehículo sin ningún propietario.
 *     tags: [Vehículos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del vehículo
 *       - in: path
 *         name: conductorId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del conductor a desvincular
 *     responses:
 *       200:
 *         description: Copropietario desvinculado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Vehiculo'
 *       404:
 *         description: El conductor no es propietario de este vehículo
 *       409:
 *         description: Es el propietario principal, o el único propietario del vehículo
 */
const quitarPropietario = async (req, res) => {
  try {
    const updated = await svc.quitarPropietario(req.params.id, req.params.conductorId, req.usuario?.id);
    res.json(updated);
  } catch (e) {
    handleError(res, e);
  }
};

module.exports = {
  getAll,
  getById,
  getByConductor,
  buscarPorPlaca,
  create,
  update,
  remove,
  agregarPropietario,
  quitarPropietario,
};
