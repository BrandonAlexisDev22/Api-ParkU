/**
 * Carga datos de demostración realistas en TODAS las tablas base de ParkU
 * (las de auditoría/historial se llenan solas via triggers -- ver abajo).
 *
 * Uso: node database/seed_demo_data.js
 */
require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { require: true, rejectUnauthorized: false },
});

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;
const hash = (pwd) => bcrypt.hash(pwd, SALT_ROUNDS);

const ADMIN_PASSWORD = 'Admin2026*';
const DEMO_PASSWORD = 'Parku2026*';

// ---- fechas relativas a "hoy" ----
const today = new Date();
function d(daysOffset, hh = 8, mm = 0) {
  const x = new Date(today);
  x.setDate(x.getDate() + daysOffset);
  x.setHours(hh, mm, 0, 0);
  return x;
}
function dateOnly(daysOffset) {
  const x = new Date(today);
  x.setDate(x.getDate() + daysOffset);
  return x.toISOString().slice(0, 10);
}

async function inTx(usuarioId, work) {
  await client.query('BEGIN');
  try {
    if (usuarioId != null) {
      await client.query("SELECT set_config('app.usuario_id', $1, true)", [String(usuarioId)]);
    }
    const r = await work();
    await client.query('COMMIT');
    return r;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
}

async function one(sql, params) {
  const r = await client.query(sql, params);
  return r.rows[0];
}

async function main() {
  await client.connect();
  console.log('Conectado a Neon. Iniciando carga de datos demo...\n');

  const ids = {}; // acumulador de ids generados

  // =====================================================================
  // 1. USUARIOS (admin ya existe con id 1; agregamos vigilantes + cuentas
  //    de conductores). usuario NO lleva trigger de auditoria.
  // =====================================================================
  console.log('1. usuario');
  const adminHash = await hash(ADMIN_PASSWORD);
  await client.query('UPDATE usuario SET contrasena = $1 WHERE id = 1', [adminHash]);
  ids.adminUsuarioId = 1;

  const demoHash = await hash(DEMO_PASSWORD);
  const nuevosUsuarios = [
    { nombre: 'Carlos Ramírez', correo: 'carlos.ramirez@parku.sena.edu.co', rol_id: 2, tel: '3001234501' }, // vigilante
    { nombre: 'Laura Gómez', correo: 'laura.gomez@parku.sena.edu.co', rol_id: 2, tel: '3001234502' }, // vigilante
    { nombre: 'Andrés Torres', correo: 'andres.torres@soy.sena.edu.co', rol_id: 3, tel: '3007654301' }, // conductor
    { nombre: 'Mariana López', correo: 'mariana.lopez@soy.sena.edu.co', rol_id: 3, tel: '3007654302' }, // conductor
    { nombre: 'Julián Pérez', correo: 'julian.perez@sena.edu.co', rol_id: 3, tel: '3007654303' }, // conductor
    { nombre: 'Diana Rojas', correo: 'diana.rojas@sena.edu.co', rol_id: 3, tel: '3007654304' }, // conductor
    { nombre: 'Santiago Herrera', correo: 'santiago.herrera@soy.sena.edu.co', rol_id: 3, tel: '3007654305' }, // conductor
    { nombre: 'Camila Vargas', correo: 'camila.vargas@sena.edu.co', rol_id: 3, tel: '3007654306' }, // conductor
  ];
  ids.usuarios = {};
  for (const u of nuevosUsuarios) {
    const row = await one(
      `INSERT INTO usuario (nombre, correo, contrasena, rol_id, numero_telefonico)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [u.nombre, u.correo, demoHash, u.rol_id, u.tel]
    );
    ids.usuarios[u.nombre] = row.id;
  }
  const uid = ids.usuarios;
  console.log('   ok:', Object.keys(uid).length, 'usuarios nuevos +', 'admin actualizado');

  // =====================================================================
  // 2. CONDUCTOR
  // =====================================================================
  console.log('2. conductor');
  const conductoresDef = [
    { key: 'Andrés Torres', usuario: uid['Andrés Torres'], tipo_documento: 'CC', numero_documento: '1001234567', nombre_apellidos: 'Andrés Torres', tipo_usuario_id: 1, regional: 'Antioquia', centro: 'Centro de Servicios y Gestión Empresarial', programa: 'Análisis y Desarrollo de Software', mov: false },
    { key: 'Mariana López', usuario: uid['Mariana López'], tipo_documento: 'CC', numero_documento: '1002345678', nombre_apellidos: 'Mariana López', tipo_usuario_id: 1, regional: 'Antioquia', centro: 'Centro de Servicios y Gestión Empresarial', programa: 'Análisis y Desarrollo de Software', mov: true, discapacidad: 'Movilidad reducida - usuaria de silla de ruedas' },
    { key: 'Julián Pérez', usuario: uid['Julián Pérez'], tipo_documento: 'CC', numero_documento: '43112233', nombre_apellidos: 'Julián Pérez', tipo_usuario_id: 2, regional: 'Antioquia', centro: 'Centro de Servicios y Gestión Empresarial', programa: null, mov: false },
    { key: 'Diana Rojas', usuario: uid['Diana Rojas'], tipo_documento: 'CC', numero_documento: '52998877', nombre_apellidos: 'Diana Rojas', tipo_usuario_id: 3, regional: 'Antioquia', centro: 'Centro de Servicios y Gestión Empresarial', programa: null, mov: false },
    { key: 'Santiago Herrera', usuario: uid['Santiago Herrera'], tipo_documento: 'TI', numero_documento: '1003456789', nombre_apellidos: 'Santiago Herrera', tipo_usuario_id: 1, regional: 'Antioquia', centro: 'Centro de Servicios y Gestión Empresarial', programa: 'Análisis y Desarrollo de Software', mov: false },
    { key: 'Camila Vargas', usuario: uid['Camila Vargas'], tipo_documento: 'CC', numero_documento: '43556677', nombre_apellidos: 'Camila Vargas', tipo_usuario_id: 2, regional: 'Antioquia', centro: 'Centro de Servicios y Gestión Empresarial', programa: null, mov: false },
    { key: 'Pedro Sánchez', usuario: null, tipo_documento: 'CE', numero_documento: '9988776', nombre_apellidos: 'Pedro Sánchez', tipo_usuario_id: 5, regional: null, centro: null, programa: null, mov: false, correo: 'pedro.sanchez@example.com' },
  ];
  ids.conductores = {};
  for (const c of conductoresDef) {
    const row = await one(
      `INSERT INTO conductor
        (usuario_id, tipo_documento, numero_documento, nombre_apellidos, correo, numero_telefonico,
         tipo_usuario_id, regional_formacion, centro_formacion, programa_formacion, vigencia,
         movilidad_reducida, tipo_discapacidad)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [c.usuario, c.tipo_documento, c.numero_documento, c.nombre_apellidos, c.correo || null,
       c.usuario ? null : '3009998877', c.tipo_usuario_id, c.regional, c.centro, c.programa,
       dateOnly(365), c.mov, c.discapacidad || null]
    );
    ids.conductores[c.key] = row.id;
  }
  const cid = ids.conductores;
  console.log('   ok:', Object.keys(cid).length, 'conductores');

  // =====================================================================
  // 3. VEHICULO (tabla auditada -> requiere app.usuario_id)
  // =====================================================================
  console.log('3. vehiculo');
  const vehiculosDef = [
    { key: 'ABC123', placa: 'ABC123', tipo: 'CARRO', marca: 'Chevrolet', linea: 'Spark GT', modelo: 2020, color: 'Rojo', servicio: 'Particular', combustible: 'Gasolina', capacidad: 5, sena: false },
    { key: 'DEF456', placa: 'DEF456', tipo: 'CARRO', marca: 'Renault', linea: 'Logan', modelo: 2019, color: 'Blanco', servicio: 'Particular', combustible: 'Gasolina', capacidad: 5, sena: false },
    { key: 'MJP12D', placa: 'MJP12D', tipo: 'MOTO', marca: 'Yamaha', linea: 'FZ', modelo: 2021, color: 'Negro', servicio: 'Particular', combustible: 'Gasolina', capacidad: 2, sena: false },
    { key: 'GHI789', placa: 'GHI789', tipo: 'CARRO', marca: 'Mazda', linea: '3', modelo: 2018, color: 'Gris', servicio: 'Particular', combustible: 'Gasolina', capacidad: 5, sena: false },
    { key: 'JKL34M', placa: 'JKL34M', tipo: 'MOTO', marca: 'Suzuki', linea: 'Gixxer', modelo: 2022, color: 'Azul', servicio: 'Particular', combustible: 'Gasolina', capacidad: 2, sena: false },
    { key: 'BICI-CV', placa: null, tipo: 'BICICLETA', marca: 'GW', linea: 'Urbana', modelo: 2023, color: 'Verde', servicio: 'Particular', combustible: null, capacidad: 1, sena: false },
    { key: 'VIS001', placa: 'VIS001', tipo: 'CARRO', marca: 'Kia', linea: 'Picanto', modelo: 2017, color: 'Plata', servicio: 'Particular', combustible: 'Gasolina', capacidad: 5, sena: false },
    { key: 'SENA01', placa: 'SENA01', tipo: 'CARRO', marca: 'Renault', linea: 'Duster', modelo: 2022, color: 'Blanco', servicio: 'Oficial', combustible: 'Diesel', capacidad: 5, sena: true },
  ];
  ids.vehiculos = {};
  await inTx(ids.adminUsuarioId, async () => {
    for (const v of vehiculosDef) {
      const row = await one(
        `INSERT INTO vehiculo (placa, tipo, marca, linea, modelo, color, servicio, combustible, capacidad, vehiculo_sena)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [v.placa, v.tipo, v.marca, v.linea, v.modelo, v.color, v.servicio, v.combustible, v.capacidad, v.sena]
      );
      ids.vehiculos[v.key] = row.id;
    }
  });
  const vid = ids.vehiculos;
  console.log('   ok:', Object.keys(vid).length, 'vehiculos');

  // =====================================================================
  // 4. DETALLE_PROPIEDAD
  // =====================================================================
  console.log('4. detalle_propiedad');
  const propiedad = [
    ['Andrés Torres', 'ABC123'],
    ['Mariana López', 'DEF456'],
    ['Julián Pérez', 'MJP12D'],
    ['Diana Rojas', 'GHI789'],
    ['Santiago Herrera', 'JKL34M'],
    ['Camila Vargas', 'BICI-CV'],
    ['Pedro Sánchez', 'VIS001'],
    ['Diana Rojas', 'SENA01'],
  ];
  for (const [condKey, vehKey] of propiedad) {
    await client.query(
      `INSERT INTO detalle_propiedad (conductor_id, vehiculo_id, es_principal) VALUES ($1,$2,true)`,
      [cid[condKey], vid[vehKey]]
    );
  }
  console.log('   ok:', propiedad.length, 'relaciones conductor-vehiculo');

  // =====================================================================
  // 5. LICENCIA_CONDUCCION
  // =====================================================================
  console.log('5. licencia_conduccion');
  const licencias = [
    ['Andrés Torres', 'B1'], ['Mariana López', 'B1'], ['Julián Pérez', 'A2'],
    ['Diana Rojas', 'B1'], ['Santiago Herrera', 'A2'], ['Pedro Sánchez', 'B1'],
  ];
  let licNum = 90001;
  for (const [condKey, categoria] of licencias) {
    await client.query(
      `INSERT INTO licencia_conduccion (conductor_id, numero_licencia, categoria, fecha_expedicion, fecha_vencimiento)
       VALUES ($1,$2,$3,$4,$5)`,
      [cid[condKey], String(licNum++), categoria, dateOnly(-900), dateOnly(900)]
    );
  }
  console.log('   ok:', licencias.length, 'licencias');

  // =====================================================================
  // 6. PARQUEADERO (update de tipo/zona/piso/descripcion -- tabla auditada)
  // =====================================================================
  console.log('6. parqueadero (actualización de metadatos)');
  const parqueaderoMeta = [
    { id: 1, tipo: 'APRENDICES', zona: 'Torre Sur', piso: 'Nivel 1', descripcion: 'Parqueadero para vehículos de aprendices, acceso por portería Regional.' },
    { id: 2, tipo: 'GENERAL', zona: 'Portería Regional', piso: 'Nivel 1', descripcion: 'Parqueadero general aledaño a la portería principal Regional.' },
    { id: 3, tipo: 'ADMINISTRATIVOS', zona: 'Torre Norte', piso: 'Sótano', descripcion: 'Parqueadero cubierto para personal administrativo y vehículos institucionales.' },
    { id: 4, tipo: 'MOTOS', zona: 'Torre Norte', piso: 'Nivel 1', descripcion: 'Zona exclusiva para motocicletas y bicicletas.' },
    { id: 5, tipo: 'DOCENTES', zona: 'Avenida Boyacá', piso: 'Nivel 1', descripcion: 'Parqueadero para instructores, acceso por Avenida Boyacá.' },
  ];
  await inTx(ids.adminUsuarioId, async () => {
    for (const p of parqueaderoMeta) {
      await client.query(
        `UPDATE parqueadero SET tipo=$1, zona=$2, piso=$3, descripcion=$4 WHERE id=$5`,
        [p.tipo, p.zona, p.piso, p.descripcion, p.id]
      );
    }
  });
  console.log('   ok:', parqueaderoMeta.length, 'parqueaderos actualizados');

  // =====================================================================
  // 7. CELDA (tabla auditada -> requiere app.usuario_id)
  // =====================================================================
  console.log('7. celda');
  function celdasParaTorreSur() {
    const arr = [];
    for (let i = 1; i <= 6; i++) arr.push({ numero: `A-0${i}`, tipo: 'CARRO', usabilidad: 'GENERAL' });
    arr.push({ numero: 'A-07', tipo: 'CARRO', usabilidad: 'MOVILIDAD_REDUCIDA' });
    return arr;
  }
  function celdasPorteria() {
    const arr = [];
    for (let i = 1; i <= 5; i++) arr.push({ numero: `B-0${i}`, tipo: 'CARRO', usabilidad: 'GENERAL' });
    arr.push({ numero: 'B-06', tipo: 'CARRO', usabilidad: 'EJECUTIVO' });
    arr.push({ numero: 'B-07', tipo: 'CARRO', usabilidad: 'MOVILIDAD_REDUCIDA' });
    return arr;
  }
  function celdasSotano() {
    const arr = [];
    for (let i = 1; i <= 4; i++) arr.push({ numero: `C-0${i}`, tipo: 'CARRO', usabilidad: 'GENERAL' });
    arr.push({ numero: 'C-05', tipo: 'CARRO', usabilidad: 'VEHICULO_SENA' });
    arr.push({ numero: 'C-06', tipo: 'CARRO', usabilidad: 'MOVILIDAD_REDUCIDA' });
    return arr;
  }
  function celdasMotos() {
    const arr = [];
    for (let i = 1; i <= 6; i++) arr.push({ numero: `M-0${i}`, tipo: 'MOTO', usabilidad: 'GENERAL' });
    arr.push({ numero: 'M-07', tipo: 'MOTO', usabilidad: 'MOVILIDAD_REDUCIDA' });
    arr.push({ numero: 'BI-01', tipo: 'BICICLETA', usabilidad: 'GENERAL' });
    arr.push({ numero: 'BI-02', tipo: 'BICICLETA', usabilidad: 'GENERAL' });
    return arr;
  }
  function celdasBoyaca() {
    const arr = [];
    for (let i = 1; i <= 5; i++) arr.push({ numero: `D-0${i}`, tipo: 'CARRO', usabilidad: 'GENERAL' });
    arr.push({ numero: 'D-06', tipo: 'CARRO', usabilidad: 'MOVILIDAD_REDUCIDA' });
    return arr;
  }

  const celdasPorParqueadero = {
    1: celdasParaTorreSur(),
    2: celdasPorteria(),
    3: celdasSotano(),
    4: celdasMotos(),
    5: celdasBoyaca(),
  };

  ids.celdas = {};
  await inTx(ids.adminUsuarioId, async () => {
    for (const [parqueaderoId, celdas] of Object.entries(celdasPorParqueadero)) {
      for (const c of celdas) {
        const row = await one(
          `INSERT INTO celda (parqueadero_id, numero, tipo, usabilidad) VALUES ($1,$2,$3,$4) RETURNING id`,
          [parseInt(parqueaderoId), c.numero, c.tipo, c.usabilidad]
        );
        ids.celdas[c.numero] = row.id;
      }
    }
  });
  console.log('   ok:', Object.keys(ids.celdas).length, 'celdas');

  // Actualizar capacidad_maxima de cada parqueadero según sus celdas
  await inTx(ids.adminUsuarioId, async () => {
    for (const [parqueaderoId, celdas] of Object.entries(celdasPorParqueadero)) {
      await client.query(`UPDATE parqueadero SET capacidad_maxima=$1 WHERE id=$2`, [celdas.length, parseInt(parqueaderoId)]);
    }
  });
  console.log('   ok: capacidad_maxima sincronizada');

  // =====================================================================
  // 8. EQUIPAMIENTO_PARQUEADERO
  // =====================================================================
  console.log('8. equipamiento_parqueadero');
  const equipamiento = [
    [1, 'CAMARA', 'Cámara entrada Torre Sur', 'CAM-01'],
    [1, 'BARRERA', 'Barrera vehicular Torre Sur', 'BAR-01'],
    [2, 'CAMARA', 'Cámara Portería Regional', 'CAM-02'],
    [2, 'BARRERA', 'Barrera Portería Regional', 'BAR-02'],
    [3, 'CAMARA', 'Cámara sótano Torre Norte', 'CAM-03'],
    [3, 'SENSOR', 'Sensor de presencia sótano', 'SEN-01'],
    [4, 'CAMARA', 'Cámara zona de motos', 'CAM-04'],
    [4, 'SENSOR', 'Sensor de ocupación motos', 'SEN-02'],
    [5, 'CAMARA', 'Cámara Avenida Boyacá', 'CAM-05'],
    [5, 'CARGADOR_ELECTRICO', 'Cargador eléctrico Avenida Boyacá', 'CE-01'],
  ];
  for (const [pid, tipo, nombre, codigo] of equipamiento) {
    await client.query(
      `INSERT INTO equipamiento_parqueadero (parqueadero_id, tipo, nombre, codigo, fecha_instalacion)
       VALUES ($1,$2,$3,$4,$5)`,
      [pid, tipo, nombre, codigo, d(-200)]
    );
  }
  console.log('   ok:', equipamiento.length, 'equipos');

  // =====================================================================
  // 9. PARQUEADERO_IP_AUTORIZADA
  // =====================================================================
  console.log('9. parqueadero_ip_autorizada');
  for (let i = 1; i <= 5; i++) {
    await client.query(
      `INSERT INTO parqueadero_ip_autorizada (parqueadero_id, direccion_ip, descripcion) VALUES ($1,$2,$3)`,
      [i, `192.168.${i}.10`, `Terminal de control de acceso parqueadero ${i}`]
    );
  }
  console.log('   ok: 5 IPs autorizadas');

  // =====================================================================
  // 10. ASIGNACION_VIGILANTE
  // =====================================================================
  console.log('10. asignacion_vigilante');
  const asignaciones = [
    { usuario: uid['Carlos Ramírez'], parqueadero: 1, turno: 'MANANA', hi: '06:00', hf: '14:00' },
    { usuario: uid['Carlos Ramírez'], parqueadero: 2, turno: 'TARDE', hi: '14:00', hf: '22:00' },
    { usuario: uid['Laura Gómez'], parqueadero: 4, turno: 'NOCHE', hi: null, hf: null },
    { usuario: uid['Laura Gómez'], parqueadero: 5, turno: 'MANANA', hi: '06:00', hf: '14:00' },
  ];
  for (const a of asignaciones) {
    await client.query(
      `INSERT INTO asignacion_vigilante (usuario_id, parqueadero_id, turno, fecha_inicio, hora_inicio, hora_fin)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [a.usuario, a.parqueadero, a.turno, dateOnly(-30), a.hi, a.hf]
    );
  }
  console.log('   ok:', asignaciones.length, 'asignaciones de vigilancia');

  // =====================================================================
  // 11. AUTORIZACION_ACCESO
  // =====================================================================
  console.log('11. autorizacion_acceso');
  await client.query(
    `INSERT INTO autorizacion_acceso (usuario_id, parqueadero_id, hora_inicio, hora_fin, motivo)
     VALUES ($1,$2,$3,$4,$5)`,
    [uid['Diana Rojas'], 3, '06:00', '20:00', 'Acceso administrativo extendido']
  );
  await client.query(
    `INSERT INTO autorizacion_acceso (conductor_id, parqueadero_id, fecha_inicio, fecha_fin, motivo)
     VALUES ($1,$2,$3,$4,$5)`,
    [cid['Pedro Sánchez'], 2, dateOnly(-2), dateOnly(10), 'Visita programada de auditoría externa']
  );
  console.log('   ok: 2 autorizaciones de acceso');

  // =====================================================================
  // 12. REGISTRO_ACCESO (tabla auditada; crea ocupacion_celda automático)
  //     3 vehiculos actualmente DENTRO + 2 visitas historicas ya cerradas
  // =====================================================================
  console.log('12. registro_acceso');
  ids.registros = {};

  await inTx(uid['Carlos Ramírez'], async () => {
    let r = await one(
      `INSERT INTO registro_acceso (vehiculo_id, conductor_id, parqueadero_id, celda_id, usuario_ingreso_id, fecha_hora_ingreso, descripcion_ingreso)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [vid['ABC123'], cid['Andrés Torres'], 1, ids.celdas['A-01'], uid['Carlos Ramírez'], d(0, 7, 15), 'Sin novedad en el ingreso']
    );
    ids.registros['ABC123-actual'] = r.id;

    r = await one(
      `INSERT INTO registro_acceso (vehiculo_id, conductor_id, parqueadero_id, celda_id, usuario_ingreso_id, fecha_hora_ingreso)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [vid['DEF456'], cid['Mariana López'], 1, ids.celdas['A-07'], uid['Carlos Ramírez'], d(0, 7, 40)]
    );
    ids.registros['DEF456-actual'] = r.id;
  });

  await inTx(uid['Laura Gómez'], async () => {
    let r = await one(
      `INSERT INTO registro_acceso (vehiculo_id, conductor_id, parqueadero_id, celda_id, usuario_ingreso_id, fecha_hora_ingreso)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [vid['MJP12D'], cid['Julián Pérez'], 4, ids.celdas['M-01'], uid['Laura Gómez'], d(0, 6, 50)]
    );
    ids.registros['MJP12D-actual'] = r.id;

    r = await one(
      `INSERT INTO registro_acceso (vehiculo_id, parqueadero_id, celda_id, usuario_ingreso_id, fecha_hora_ingreso, descripcion_ingreso)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [vid['SENA01'], 3, ids.celdas['C-05'], uid['Laura Gómez'], d(0, 6, 30), 'Vehículo institucional - gira administrativa']
    );
    ids.registros['SENA01-actual'] = r.id;
  });

  await inTx(uid['Carlos Ramírez'], async () => {
    const r = await one(
      `INSERT INTO registro_acceso (vehiculo_id, conductor_id, parqueadero_id, celda_id, usuario_ingreso_id, fecha_hora_ingreso)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [vid['VIS001'], cid['Pedro Sánchez'], 2, ids.celdas['B-01'], uid['Carlos Ramírez'], d(0, 9, 10)]
    );
    ids.registros['VIS001-actual'] = r.id;
  });

  // Visitas históricas ya finalizadas (INSERT con salida NULL -> luego UPDATE de salida)
  await inTx(uid['Laura Gómez'], async () => {
    const r = await one(
      `INSERT INTO registro_acceso (vehiculo_id, conductor_id, parqueadero_id, celda_id, usuario_ingreso_id, fecha_hora_ingreso)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [vid['GHI789'], cid['Diana Rojas'], 3, ids.celdas['C-01'], uid['Laura Gómez'], d(-1, 8, 0)]
    );
    ids.registros['GHI789-historico'] = r.id;
  });
  await inTx(uid['Laura Gómez'], async () => {
    await client.query(
      `UPDATE registro_acceso SET fecha_hora_salida=$1, usuario_salida_id=$2, estado='FINALIZADO' WHERE id=$3`,
      [d(-1, 17, 30), uid['Laura Gómez'], ids.registros['GHI789-historico']]
    );
  });

  await inTx(uid['Carlos Ramírez'], async () => {
    const r = await one(
      `INSERT INTO registro_acceso (vehiculo_id, conductor_id, parqueadero_id, celda_id, usuario_ingreso_id, fecha_hora_ingreso)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [vid['JKL34M'], cid['Santiago Herrera'], 4, ids.celdas['M-02'], uid['Carlos Ramírez'], d(-2, 7, 45)]
    );
    ids.registros['JKL34M-historico'] = r.id;
  });
  await inTx(uid['Carlos Ramírez'], async () => {
    await client.query(
      `UPDATE registro_acceso SET fecha_hora_salida=$1, usuario_salida_id=$2, estado='FINALIZADO' WHERE id=$3`,
      [d(-2, 13, 15), uid['Carlos Ramírez'], ids.registros['JKL34M-historico']]
    );
  });
  console.log('   ok:', Object.keys(ids.registros).length, 'registros de acceso (5 dentro, 2 cerrados)');

  // =====================================================================
  // 13. CAPTURA_PLACA + 14. INTENTO_OCR
  // =====================================================================
  console.log('13-14. captura_placa / intento_ocr');
  async function capturaConOcr({ placa, parqueadero, vehiculo, registro, verificada, verifica, direccion, origen, confianza, exitoso, error }) {
    const cap = await one(
      `INSERT INTO captura_placa (placa_detectada, parqueadero_id, vehiculo_id, registro_acceso_id, verificada, usuario_verifica_id, direccion_captura, origen, confianza)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [placa, parqueadero, vehiculo || null, registro || null, verificada, verifica || null, direccion, origen, confianza]
    );
    await client.query(
      `INSERT INTO intento_ocr (captura_placa_id, motor, placa_detectada, confianza, tiempo_procesamiento_ms, exitoso, error)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [cap.id, 'tesseract.js', placa, confianza, 800 + Math.round(confianza * 3), exitoso, error || null]
    );
    return cap.id;
  }
  await capturaConOcr({ placa: 'ABC123', parqueadero: 1, vehiculo: vid['ABC123'], registro: ids.registros['ABC123-actual'], verificada: true, verifica: uid['Carlos Ramírez'], direccion: 'ENTRADA', origen: 'NAVEGADOR', confianza: 92.5, exitoso: true });
  await capturaConOcr({ placa: 'DEF456', parqueadero: 1, vehiculo: vid['DEF456'], registro: ids.registros['DEF456-actual'], verificada: true, verifica: uid['Carlos Ramírez'], direccion: 'ENTRADA', origen: 'NAVEGADOR', confianza: 88.0, exitoso: true });
  await capturaConOcr({ placa: 'XYZ999', parqueadero: 2, verificada: false, direccion: 'ENTRADA', origen: 'MANUAL', confianza: 45.0, exitoso: false, error: 'Placa no coincide con ningún vehículo registrado' });
  console.log('   ok: 3 capturas de placa + 3 intentos OCR');

  // =====================================================================
  // 15. RESERVA (tabla auditada; puede bloquear celdas)
  // =====================================================================
  console.log('15. reserva');
  await inTx(uid['Carlos Ramírez'], async () => {
    await client.query(
      `INSERT INTO reserva (tipo_reserva, celda_id, usuario_registra_id, conductor_id, vehiculo_id, motivo,
                             fecha_hora_inicio, fecha_hora_fin, estado, usuario_gestiona_id)
       VALUES ('MOVILIDAD_REDUCIDA',$1,$2,$3,$4,$5,$6,$7,'ACEPTADA',$8)`,
      [ids.celdas['B-07'], uid['Carlos Ramírez'], cid['Mariana López'], vid['DEF456'],
       'Celda preferencial confirmada por movilidad reducida', d(1, 8, 0), d(1, 18, 0), ids.adminUsuarioId]
    );
  });
  await inTx(uid['Laura Gómez'], async () => {
    await client.query(
      `INSERT INTO reserva (tipo_reserva, celda_id, usuario_registra_id, conductor_id, vehiculo_id, motivo,
                             fecha_hora_inicio, fecha_hora_fin, estado, usuario_gestiona_id)
       VALUES ('VEHICULO_SENA',$1,$2,$3,$4,$5,$6,$7,'ACEPTADA',$8)`,
      [ids.celdas['D-01'], uid['Laura Gómez'], cid['Diana Rojas'], vid['SENA01'],
       'Reserva para gira institucional', d(2, 8, 0), d(3, 18, 0), ids.adminUsuarioId]
    );
  });
  await inTx(uid['Carlos Ramírez'], async () => {
    await client.query(
      `INSERT INTO reserva (tipo_reserva, celda_id, usuario_registra_id, conductor_id, vehiculo_id, motivo,
                             fecha_hora_inicio, fecha_hora_fin, estado)
       VALUES ('VISITANTE',$1,$2,$3,$4,$5,$6,$7,'PENDIENTE')`,
      [ids.celdas['B-02'], uid['Carlos Ramírez'], cid['Pedro Sánchez'], vid['VIS001'],
       'Visita programada la próxima semana', d(7, 9, 0), d(7, 17, 0)]
    );
  });
  await inTx(uid['Laura Gómez'], async () => {
    await client.query(
      `INSERT INTO reserva (tipo_reserva, celda_id, usuario_registra_id, conductor_id, vehiculo_id, motivo,
                             fecha_hora_inicio, fecha_hora_fin, estado, usuario_gestiona_id)
       VALUES ('VISITANTE',$1,$2,$3,$4,$5,$6,$7,'CANCELADA',$8)`,
      [ids.celdas['A-03'], uid['Laura Gómez'], cid['Pedro Sánchez'], vid['VIS001'],
       'El visitante canceló la cita', d(-4, 9, 0), d(-4, 17, 0), uid['Laura Gómez']]
    );
  });
  console.log('   ok: 4 reservas (2 ACEPTADA, 1 PENDIENTE, 1 CANCELADA)');

  // =====================================================================
  // 16. NOVEDAD + 17. EVIDENCIA_NOVEDAD
  // =====================================================================
  console.log('16-17. novedad / evidencia_novedad');
  ids.novedades = {};
  await inTx(uid['Carlos Ramírez'], async () => {
    let n = await one(
      `INSERT INTO novedad (tipo_novedad, prioridad, estado, descripcion, usuario_reporta_id, celda_id, parqueadero_id, vehiculo_id)
       VALUES ('MAL_ESTACIONAMIENTO','MEDIA','PENDIENTE',$1,$2,$3,$4,$5) RETURNING id`,
      ['Vehículo de placa ABC123 invade parcialmente la celda contigua en Torre Sur', uid['Carlos Ramírez'], ids.celdas['A-01'], 1, vid['ABC123']]
    );
    ids.novedades.malEstacionamiento = n.id;

    n = await one(
      `INSERT INTO novedad (tipo_novedad, prioridad, estado, descripcion, usuario_reporta_id, usuario_asignado_id, parqueadero_id)
       VALUES ('DANIO','ALTA','EN_PROCESO',$1,$2,$3,$4) RETURNING id`,
      ['Barrera de acceso de Avenida Boyacá presenta falla eléctrica intermitente', uid['Carlos Ramírez'], ids.adminUsuarioId, 5]
    );
    ids.novedades.danioBarrera = n.id;
  });

  await inTx(uid['Laura Gómez'], async () => {
    let n = await one(
      `INSERT INTO novedad (tipo_novedad, prioridad, estado, descripcion, usuario_reporta_id, usuario_asignado_id,
                             fecha_hora_cierre, justificacion_cierre)
       VALUES ('QUEJA','BAJA','RESUELTA',$1,$2,$3,$4,$5) RETURNING id`,
      ['Aprendiz reporta demora en el registro de ingreso durante hora pico', uid['Laura Gómez'], uid['Carlos Ramírez'],
       d(-3, 10, 0), 'Se reforzó el turno de la mañana con personal adicional']
    );
    ids.novedades.quejaDemora = n.id;

    n = await one(
      `INSERT INTO novedad (tipo_novedad, prioridad, estado, descripcion, usuario_reporta_id, celda_id, parqueadero_id,
                             fecha_hora_cierre, justificacion_cierre)
       VALUES ('ACCIDENTE','CRITICA','CERRADA',$1,$2,$3,$4,$5,$6) RETURNING id`,
      ['Colisión leve entre dos vehículos en el sótano de Torre Norte', uid['Laura Gómez'], ids.celdas['C-01'], 3,
       d(-6, 16, 0), 'Se documentó el incidente y las partes llegaron a un acuerdo']
    );
    ids.novedades.accidenteSotano = n.id;
  });

  const evidencias = [
    [ids.novedades.malEstacionamiento, 'https://storage.parku.sena.edu.co/evidencias/novedad-1-foto1.jpg', 'FOTO', 'Foto del vehículo invadiendo la celda contigua'],
    [ids.novedades.danioBarrera, 'https://storage.parku.sena.edu.co/evidencias/novedad-2-foto1.jpg', 'FOTO', 'Barrera con luz de falla encendida'],
    [ids.novedades.accidenteSotano, 'https://storage.parku.sena.edu.co/evidencias/novedad-4-foto1.jpg', 'FOTO', 'Daño en el paragolpes delantero'],
    [ids.novedades.accidenteSotano, 'https://storage.parku.sena.edu.co/evidencias/novedad-4-nota1.txt', 'NOTA', 'Declaración escrita de ambos conductores'],
  ];
  for (const [novedadId, url, tipo, desc] of evidencias) {
    await client.query(
      `INSERT INTO evidencia_novedad (novedad_id, url, tipo, descripcion) VALUES ($1,$2,$3,$4)`,
      [novedadId, url, tipo, desc]
    );
  }
  console.log('   ok:', Object.keys(ids.novedades).length, 'novedades +', evidencias.length, 'evidencias');

  // =====================================================================
  // 18. ENCUESTA + 19. VALORACION
  // =====================================================================
  console.log('18-19. encuesta / valoracion');
  const encuesta = await one(
    `INSERT INTO encuesta (titulo, descripcion, fecha_inicio, fecha_fin)
     VALUES ($1,$2,$3,$4) RETURNING id`,
    ['Satisfacción con el servicio de parqueaderos - 2do semestre 2026',
     'Encuesta semestral sobre la experiencia de uso de los parqueaderos del Centro.',
     dateOnly(-40), dateOnly(120)]
  );
  const valoraciones = [
    [uid['Andrés Torres'], ids.registros['ABC123-actual'], 5, 'Excelente servicio y rapidez en el ingreso'],
    [uid['Diana Rojas'], ids.registros['GHI789-historico'], 4, 'Buen servicio, la señalización podría mejorar'],
    [uid['Santiago Herrera'], ids.registros['JKL34M-historico'], 3, 'A veces toca esperar en hora pico'],
  ];
  for (const [usuario, registro, calif, comentario] of valoraciones) {
    await client.query(
      `INSERT INTO valoracion (encuesta_id, usuario_id, registro_acceso_id, calificacion, comentario)
       VALUES ($1,$2,$3,$4,$5)`,
      [encuesta.id, usuario, registro, calif, comentario]
    );
  }
  console.log('   ok: 1 encuesta +', valoraciones.length, 'valoraciones');

  // =====================================================================
  // 20. DISPONIBILIDAD_CELDA (requiere app.usuario_id + app.motivo_disponibilidad)
  // =====================================================================
  console.log('20. disponibilidad_celda');
  await client.query('BEGIN');
  try {
    await client.query("SELECT set_config('app.usuario_id', $1, true)", [String(ids.adminUsuarioId)]);
    await client.query("SELECT set_config('app.motivo_disponibilidad', 'MANTENIMIENTO', true)");
    await client.query("SELECT set_config('app.observacion', 'Pintura de demarcación en proceso', true)");
    await client.query(
      `INSERT INTO disponibilidad_celda (celda_id, estado, motivo, observacion, usuario_id)
       VALUES ($1,'MANTENIMIENTO','MANTENIMIENTO',$2,$3)`,
      [ids.celdas['C-04'], 'Pintura de demarcación en proceso', ids.adminUsuarioId]
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
  console.log('   ok: celda C-04 marcada en MANTENIMIENTO');

  console.log('\nCarga de datos demo completada sin errores.');
}

main()
  .catch((e) => {
    console.error('\nFALLO:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end().catch(() => {});
  });
