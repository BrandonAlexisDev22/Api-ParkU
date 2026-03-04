// EXPERIMENTAL

class Role {
  constructor(id, nombre_rol, permisos, estado = true) {
    this.id_rol = id;
    this.nombre_rol = nombre_rol;
    this.permisos = permisos;
    this.estado = estado;
  }
}

module.exports = Role;