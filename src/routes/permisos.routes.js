/**
 * @module permisosRoutes
 * @description
 * Define las rutas HTTP del módulo de permisos.
 * Estas rutas conectan las peticiones del cliente con el controller
 * encargado de manejar las operaciones relacionadas con los permisos.
 *
 * Flujo de la arquitectura:
 * Route → Controller → Service → Repository → Base de Datos
 */

const express = require('express');
const router = express.Router();
const permisoController = require('../controllers/permisos.controller');

/**
 * Crear un nuevo permiso
 *
 * @route POST /permisos/create
 * @group Permisos
 *
 * @param {string} nombre_permiso.body.required - Nombre del permiso
 *
 * @returns {Object} 201 - Permiso creado correctamente
 */
router.post('/create', permisoController.createPermiso);

/**
 * Editar un permiso existente
 *
 * @route PUT /permisos/edit/{id}
 * @group Permisos
 *
 * @param {number} id.path.required - ID del permiso
 * @param {string} nombre_permiso.body.required - Nuevo nombre del permiso
 *
 * @returns {Object} 200 - Permiso actualizado
 */
router.put('/edit/:id', permisoController.editPermiso);

/**
 * Eliminar un permiso
 *
 * @route DELETE /permisos/delete/{id}
 * @group Permisos
 *
 * @param {number} id.path.required - ID del permiso
 *
 * @returns {Object} 200 - Permiso eliminado
 */
router.delete('/delete/:id', permisoController.deletePermiso);

/**
 * Obtener todos los permisos
 *
 * @route GET /permisos
 * @group Permisos
 *
 * @returns {Array<Object>} 200 - Lista de permisos
 */
router.get('/', permisoController.getPermisos);

/**
 * Obtener un permiso en especifico con el id
 *
 * @route GET /permisos/id
 * @group Permisos
 *
 * @returns {Array<Object>} 200 - permiso especifico
 */
router.get('/search/:id', permisoController.getPermisosById);

module.exports = router;