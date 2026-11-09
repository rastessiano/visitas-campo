/**
 * Servidor de la app de visitas de campo — Estância São José (Aceguá).
 *
 * Vive como Apps Script en el Google Drive de rastessiano@gmail.com.
 * - Visitas: hoja «Visitas» de la planilla «Visitas Estância São José»; fotos en su carpeta.
 * - Gastos y tareas: hoja «Gastos» (con su comprobante en la carpeta de fotos).
 * - Productos y labores con precio de referencia: hoja «Productos».
 * - Datos del campo: archivo «campo-sao-jose.json» (se sube desde la compu de Roberto).
 * - Asistente: responde consultas con Claude usando todo lo anterior. Necesita la propiedad
 *   del script ANTHROPIC_API_KEY (Configuración del proyecto → Propiedades del script).
 *
 * Después de cambiar este archivo: Implementar → Gestionar implementaciones → editar (lápiz)
 * → Versión: «Nueva versión» → Implementar. Así la URL de la app no cambia.
 *
 * CONTABILIDAD: GET ?accion=gastos&clave=…&desde=AAAA-MM-DD devuelve los gastos recibidos desde
 * esa fecha, cada uno con su id fijo, centro de costo (potreros, zafra, cultivo), cuenta contable
 * (columna que completa Gonzalo o que sale del producto) y montos en USD y R$.
 */

const COLUMNAS = [
  'id', 'fecha', 'usuario', 'potreiro_id', 'potreiro', 'lat', 'lon', 'precision_m',
  'uso', 'fase', 'estado', 'malezas_nivel', 'malezas', 'plagas_nivel', 'plagas',
  'enfermedades_nivel', 'enfermedades', 'categoria_animal', 'cabezas', 'altura_entrada_cm',
  'forraje_kgms_ha', 'remanente_cm', 'semilla_kg_ha', 'cosecha_prevista',
  'rec_fertilizacion', 'rec_aplicaciones', 'observaciones', 'fotos', 'recibido'
];

const COLUMNAS_GASTOS = [
  'id', 'fecha', 'usuario', 'potreiro_ids', 'potreiros', 'ha', 'zafra', 'cultivo', 'actividad',
  'tipo_item', 'item_id', 'item', 'cantidad', 'unidad', 'dosis_ha', 'precio_unit', 'moneda',
  'total', 'tipo_cambio', 'total_usd', 'total_brl', 'pagador', 'proveedor', 'cuenta_contable',
  'observaciones', 'comprobante', 'recibido', 'exportado'
];

const COLUMNAS_PRODUCTOS = [
  'id', 'nombre', 'tipo', 'categoria', 'unidad', 'precio_ref', 'moneda', 'cuenta_contable', 'activo'
];

// Lista inicial (sin precios): Roberto y Gonzalo la completan en la hoja «Productos».
const PRODUCTOS_INICIALES = [
  ['p-urea', 'Urea', 'insumo', 'fertilizante', 'kg'],
  ['p-dap', 'Fosfato diamónico (DAP)', 'insumo', 'fertilizante', 'kg'],
  ['p-npk', 'NPK', 'insumo', 'fertilizante', 'kg'],
  ['p-glifo', 'Glifosato', 'insumo', 'herbicida', 'L'],
  ['p-24d', '2,4-D', 'insumo', 'herbicida', 'L'],
  ['p-insect', 'Insecticida', 'insumo', 'insecticida', 'L'],
  ['p-fungi', 'Fungicida', 'insumo', 'fungicida', 'L'],
  ['p-sem-azev', 'Semilla raigrás (azevém)', 'insumo', 'semilla', 'kg'],
  ['p-sem-fest', 'Semilla festuca', 'insumo', 'semilla', 'kg'],
  ['p-sem-tb', 'Semilla trébol blanco', 'insumo', 'semilla', 'kg'],
  ['p-sem-soja', 'Semilla soja', 'insumo', 'semilla', 'kg'],
  ['p-gasoil', 'Gasoil', 'insumo', 'combustible', 'L'],
  ['l-siembra', 'Siembra', 'labor', 'labor', 'ha'],
  ['l-pulv', 'Pulverización', 'labor', 'labor', 'ha'],
  ['l-fert', 'Fertilización (aplicación)', 'labor', 'labor', 'ha'],
  ['l-cosecha', 'Cosecha', 'labor', 'labor', 'ha'],
  ['l-hilerado', 'Hilerado', 'labor', 'labor', 'ha'],
  ['l-prep', 'Preparación de suelo', 'labor', 'labor', 'ha'],
  ['s-flete', 'Flete', 'servicio', 'flete', 'viaje'],
  ['s-jornal', 'Mano de obra (jornal)', 'servicio', 'mano de obra', 'jornal'],
  ['s-analisis', 'Análisis de suelo/semilla', 'servicio', 'servicios', 'unidad']
];

function configurar() {
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('CLAVE')) {
    props.setProperty('CLAVE', Utilities.getUuid().replace(/-/g, '').slice(0, 10));
  }
  let carpeta;
  if (props.getProperty('CARPETA')) {
    carpeta = DriveApp.getFolderById(props.getProperty('CARPETA'));
  } else {
    carpeta = DriveApp.createFolder('App visitas Estância São José');
    props.setProperty('CARPETA', carpeta.getId());
  }
  if (!props.getProperty('FOTOS')) {
    props.setProperty('FOTOS', carpeta.createFolder('Fotos visitas Estância São José').getId());
  }
  if (!props.getProperty('PLANILLA')) {
    const ss = SpreadsheetApp.create('Visitas Estância São José');
    const hoja = ss.getSheets()[0];
    hoja.setName('Visitas');
    hoja.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]).setFontWeight('bold');
    hoja.setFrozenRows(1);
    DriveApp.getFileById(ss.getId()).moveTo(carpeta);
    props.setProperty('PLANILLA', ss.getId());
  }
  hojaGastos_();
  hojaProductos_();
  const datos = buscarDatos_();
  if (datos) datos.moveTo(carpeta);
  // Prueba de permiso para conectarse a internet (lo usa el asistente).
  UrlFetchApp.fetch('https://api.anthropic.com', { muteHttpExceptions: true });
  Logger.log('CLAVE de la app: ' + props.getProperty('CLAVE'));
  Logger.log('Planilla: ' + SpreadsheetApp.openById(props.getProperty('PLANILLA')).getUrl());
  Logger.log('Datos del campo: ' + (datos ? 'encontrados' : 'todavía no (se suben desde la compu)'));
  Logger.log('Asistente: ' + (props.getProperty('ANTHROPIC_API_KEY') ? 'clave de Claude cargada' : 'FALTA la propiedad ANTHROPIC_API_KEY'));
}

// ---------------------------------------------------------------- utilidades

function planilla_() {
  return SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('PLANILLA'));
}
function hoja_() { return planilla_().getSheetByName('Visitas'); }

function hojaConColumnas_(nombre, columnas) {
  const ss = planilla_();
  let h = ss.getSheetByName(nombre);
  if (!h) {
    h = ss.insertSheet(nombre);
    h.getRange(1, 1, 1, columnas.length).setValues([columnas]).setFontWeight('bold');
    h.setFrozenRows(1);
  }
  return h;
}
function hojaGastos_() { return hojaConColumnas_('Gastos', COLUMNAS_GASTOS); }
function hojaProductos_() {
  const h = hojaConColumnas_('Productos', COLUMNAS_PRODUCTOS);
  if (h.getLastRow() < 2) {
    const filas = PRODUCTOS_INICIALES.map(function (p) { return [p[0], p[1], p[2], p[3], p[4], '', 'USD', '', 'si']; });
    h.getRange(2, 1, filas.length, COLUMNAS_PRODUCTOS.length).setValues(filas);
  }
  return h;
}

function leerHoja_(hoja, columnas) {
  const n = hoja.getLastRow();
  if (n < 2) return [];
  return hoja.getRange(2, 1, n - 1, columnas.length).getDisplayValues().map(function (fila) {
    const o = {};
    columnas.forEach(function (c, i) { o[c] = fila[i]; });
    return o;
  });
}

function existeId_(hoja, id) {
  return !!hoja.getRange('A:A').createTextFinder(id).matchEntireCell(true).findNext();
}

function buscarDatos_() {
  const it = DriveApp.getFilesByName('campo-sao-jose.json');
  return it.hasNext() ? it.next() : null;
}

function responder_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function claveOk_(clave) {
  const c = PropertiesService.getScriptProperties().getProperty('CLAVE');
  return c && clave === c;
}

/** Guarda una foto en la carpeta de fotos. Las de visitas (publica = true) quedan visibles para
 *  cualquiera que tenga el link, así se ven en la app y se pueden bajar; los comprobantes no. */
function guardarFoto_(base64, nombre, publica) {
  const carpeta = DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('FOTOS'));
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), 'image/jpeg', nombre);
  const f = carpeta.createFile(blob);
  if (publica) compartirArchivo_(f);
  return f.getUrl();
}

function compartirArchivo_(f) {
  try { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) { Logger.log('No se pudo compartir ' + f.getName() + ': ' + err); }
}

function idDeUrl_(u) {
  const m = String(u || '').match(/\/d\/([\w-]{20,})/) || String(u || '').match(/[?&]id=([\w-]{20,})/);
  return m ? m[1] : '';
}

/** Una sola vez: comparte por link las fotos de visitas que se guardaron antes de este cambio. */
function compartirFotosViejas_() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('FOTOS_COMPARTIDAS')) return;
  leerHoja_(hoja_(), COLUMNAS).forEach(function (v) {
    String(v.fotos || '').split(' ').forEach(function (u) {
      const id = idDeUrl_(u);
      if (id) { try { compartirArchivo_(DriveApp.getFileById(id)); } catch (err) { Logger.log(err); } }
    });
  });
  props.setProperty('FOTOS_COMPARTIDAS', new Date().toISOString());
}

/** Devuelve una foto de la carpeta de fotos en base64 (para armar el PDF en el teléfono). */
function leerFoto_(id) {
  const carpeta = PropertiesService.getScriptProperties().getProperty('FOTOS');
  const f = DriveApp.getFileById(id);
  const padres = f.getParents();
  let enCarpeta = false;
  while (padres.hasNext()) if (padres.next().getId() === carpeta) enCarpeta = true;
  if (!enCarpeta) return { ok: false, error: 'foto' };
  return { ok: true, base64: Utilities.base64Encode(f.getBlob().getBytes()), tipo: f.getMimeType() };
}

// ---------------------------------------------------------------- entradas

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (!claveOk_(p.clave)) return responder_({ ok: false, error: 'clave' });
  if (p.accion === 'datos') {
    const f = buscarDatos_();
    if (!f) return responder_({ ok: false, error: 'sin-datos' });
    return responder_({ ok: true, datos: JSON.parse(f.getBlob().getDataAsString('UTF-8')) });
  }
  if (p.accion === 'visitas') {
    try { compartirFotosViejas_(); } catch (err) { Logger.log(err); }
    return responder_({ ok: true, visitas: leerVisitas_() });
  }
  if (p.accion === 'foto' && p.id) {
    try { return responder_(leerFoto_(p.id)); } catch (err) { return responder_({ ok: false, error: 'foto' }); }
  }
  if (p.accion === 'gastos') return responder_({ ok: true, gastos: leerGastos_(p.desde) });
  if (p.accion === 'productos') return responder_({ ok: true, productos: leerHoja_(hojaProductos_(), COLUMNAS_PRODUCTOS) });
  return responder_({ ok: true, ping: new Date().toISOString() });
}

function doPost(e) {
  let cuerpo;
  try { cuerpo = JSON.parse(e.postData.contents); }
  catch (err) { return responder_({ ok: false, error: 'json' }); }
  if (!claveOk_(cuerpo.clave)) return responder_({ ok: false, error: 'clave' });
  if (cuerpo.accion === 'consulta') return responder_(consultar_(cuerpo));
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    if (cuerpo.accion === 'datos' && cuerpo.datos && cuerpo.datos.potreiros) return responder_(guardarDatos_(cuerpo.datos));
    if (cuerpo.accion === 'visita' && cuerpo.visita && cuerpo.visita.id) return responder_(guardarVisita_(cuerpo.visita));
    if (cuerpo.accion === 'visitaEditar' && cuerpo.visita && cuerpo.visita.id) return responder_(editarVisita_(cuerpo.visita));
    if (cuerpo.accion === 'visitaBorrar' && cuerpo.id) return responder_(borrarVisita_(cuerpo.id, cuerpo.usuario));
    if (cuerpo.accion === 'gasto' && cuerpo.gasto && cuerpo.gasto.id) return responder_(guardarGasto_(cuerpo.gasto));
    if (cuerpo.accion === 'gastoEditar' && cuerpo.gasto && cuerpo.gasto.id) return responder_(editarGasto_(cuerpo.gasto));
    if (cuerpo.accion === 'gastoBorrar' && cuerpo.id) return responder_(borrarGasto_(cuerpo.id, cuerpo.usuario));
    if (cuerpo.accion === 'producto' && cuerpo.producto && cuerpo.producto.id) return responder_(guardarProducto_(cuerpo.producto));
    return responder_({ ok: false, error: 'pedido' });
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------- datos del campo

/** Guarda (o reemplaza) los datos del campo en la carpeta de la app. */
function guardarDatos_(datos) {
  const carpeta = DriveApp.getFolderById(
    PropertiesService.getScriptProperties().getProperty('CARPETA'));
  const texto = JSON.stringify(datos);
  const f = buscarDatos_();
  if (f) f.setContent(texto);
  else carpeta.createFile('campo-sao-jose.json', texto, 'application/json');
  return { ok: true, potreiros: datos.potreiros.length, versao: datos.versao };
}

// ---------------------------------------------------------------- visitas

function guardarVisita_(v) {
  const hoja = hoja_();
  // Si la visita ya llegó (reintento), no se duplica.
  if (existeId_(hoja, v.id)) return { ok: true, id: v.id, repetida: true };
  const enlaces = (v.fotos || []).map(function (f, i) {
    return guardarFoto_(f.base64, [String(v.fecha).slice(0, 10), v.potreiro, v.usuario, i + 1].join(' - ') + '.jpg', true);
  });
  const fila = COLUMNAS.map(function (c) {
    if (c === 'fotos') return enlaces.join(' ');
    if (c === 'recibido') return new Date();
    // La fecha va como texto (AAAA-MM-DD HH:MM) para que la planilla no la cambie de formato.
    if (c === 'fecha') return "'" + String(v.fecha || '').replace('T', ' ').slice(0, 16);
    const x = v[c];
    return x === undefined || x === null ? '' : x;
  });
  hoja.appendRow(fila);
  return { ok: true, id: v.id, fotos: enlaces };
}

function filaDeId_(hoja, id) {
  const c = hoja.getRange('A:A').createTextFinder(id).matchEntireCell(true).findNext();
  return c ? c.getRow() : 0;
}

/** Reescribe una visita ya enviada. Conserva las fotos que siguen (fotosPrevias) y suma las nuevas. */
function editarVisita_(v) {
  const hoja = hoja_();
  const n = filaDeId_(hoja, v.id);
  if (!n) return guardarVisita_(v);
  const antes = hoja.getRange(n, 1, 1, COLUMNAS.length).getValues()[0];
  const nuevas = (v.fotos || []).map(function (f, i) {
    return guardarFoto_(f.base64, [String(v.fecha).slice(0, 10), v.potreiro, v.usuario, 'edit', i + 1].join(' - ') + '.jpg', true);
  });
  const enlaces = (v.fotosPrevias || []).concat(nuevas);
  const fila = COLUMNAS.map(function (c, i) {
    if (c === 'fotos') return enlaces.join(' ');
    if (c === 'recibido') return antes[i];
    if (c === 'fecha') return "'" + String(v.fecha || '').replace('T', ' ').slice(0, 16);
    const x = v[c];
    return x === undefined || x === null ? '' : x;
  });
  hoja.getRange(n, 1, 1, COLUMNAS.length).setValues([fila]);
  return { ok: true, id: v.id, fotos: enlaces, editada: true };
}

/** Saca la visita de la hoja «Visitas» y la guarda en «Visitas borradas» (no se pierde nada). */
function borrarVisita_(id, usuario) {
  const hoja = hoja_();
  const n = filaDeId_(hoja, id);
  if (!n) return { ok: true, id: id, noEstaba: true };
  const papelera = hojaConColumnas_('Visitas borradas', COLUMNAS.concat(['borrado', 'borrado_por']));
  const fila = hoja.getRange(n, 1, 1, COLUMNAS.length).getValues()[0];
  fila[1] = "'" + fila[1];
  papelera.appendRow(fila.concat([new Date(), usuario || '']));
  hoja.deleteRow(n);
  return { ok: true, id: id, borrada: true };
}

function leerVisitas_() {
  return leerHoja_(hoja_(), COLUMNAS).map(function (o) {
    o.fotos = o.fotos ? o.fotos.split(' ') : [];
    return o;
  });
}

// ---------------------------------------------------------------- gastos y productos

function guardarGasto_(g) {
  const hoja = hojaGastos_();
  if (existeId_(hoja, g.id)) return { ok: true, id: g.id, repetido: true };
  let comprobante = '';
  if (g.comprobante && g.comprobante.base64) {
    comprobante = guardarFoto_(g.comprobante.base64,
      ['Comprobante', g.fecha, g.item || g.actividad, g.usuario].join(' - ') + '.jpg');
  }
  const fila = COLUMNAS_GASTOS.map(function (c) {
    if (c === 'comprobante') return comprobante;
    if (c === 'recibido') return new Date();
    if (c === 'exportado') return '';
    if (c === 'fecha') return "'" + String(g.fecha || '').slice(0, 10);
    if (c === 'potreiro_ids') return (g.potreiro_ids || []).join(' ');
    const x = g[c];
    return x === undefined || x === null ? '' : x;
  });
  hoja.appendRow(fila);
  return { ok: true, id: g.id, comprobante: comprobante };
}

/** Gastos con los números como números (getValues), sin depender del formato regional. */
/**
 * Reescribe un gasto ya enviado. «recibido» pasa a ahora y «exportado» se vacía: así la
 * contabilidad (GET gastos desde=…) lo vuelve a traer con el mismo id y lo actualiza.
 */
function editarGasto_(g) {
  const hoja = hojaGastos_();
  const n = filaDeId_(hoja, g.id);
  if (!n) return guardarGasto_(g);
  const antes = hoja.getRange(n, 1, 1, COLUMNAS_GASTOS.length).getValues()[0];
  let comprobante = antes[COLUMNAS_GASTOS.indexOf('comprobante')];
  if (g.comprobante && g.comprobante.base64) {
    comprobante = guardarFoto_(g.comprobante.base64,
      ['Comprobante', g.fecha, g.item || g.actividad, g.usuario, 'edit'].join(' - ') + '.jpg');
  } else if (g.sinComprobante) comprobante = '';
  const fila = COLUMNAS_GASTOS.map(function (c) {
    if (c === 'comprobante') return comprobante;
    if (c === 'recibido') return new Date();
    if (c === 'exportado') return '';
    if (c === 'fecha') return "'" + String(g.fecha || '').slice(0, 10);
    if (c === 'potreiro_ids') return (g.potreiro_ids || []).join(' ');
    const x = g[c];
    return x === undefined || x === null ? '' : x;
  });
  hoja.getRange(n, 1, 1, COLUMNAS_GASTOS.length).setValues([fila]);
  return { ok: true, id: g.id, comprobante: comprobante, editado: true };
}

/** Saca el gasto de la hoja «Gastos» y lo guarda en «Gastos borrados». */
function borrarGasto_(id, usuario) {
  const hoja = hojaGastos_();
  const n = filaDeId_(hoja, id);
  if (!n) return { ok: true, id: id, noEstaba: true };
  const papelera = hojaConColumnas_('Gastos borrados', COLUMNAS_GASTOS.concat(['borrado', 'borrado_por']));
  const fila = hoja.getRange(n, 1, 1, COLUMNAS_GASTOS.length).getValues()[0];
  fila[1] = "'" + (fila[1] instanceof Date ? Utilities.formatDate(fila[1], 'America/Sao_Paulo', 'yyyy-MM-dd') : fila[1]);
  papelera.appendRow(fila.concat([new Date(), usuario || '']));
  hoja.deleteRow(n);
  return { ok: true, id: id, borrado: true };
}

function leerGastos_(desde) {
  const hoja = hojaGastos_();
  const n = hoja.getLastRow();
  if (n < 2) return [];
  const lim = desde ? new Date(desde) : null;
  return hoja.getRange(2, 1, n - 1, COLUMNAS_GASTOS.length).getValues().map(function (fila) {
    const g = {};
    COLUMNAS_GASTOS.forEach(function (c, i) {
      const x = fila[i];
      g[c] = x instanceof Date ? x.toISOString() : x;
    });
    g.fecha = String(g.fecha).slice(0, 10);
    g.potreiro_ids = g.potreiro_ids ? String(g.potreiro_ids).split(' ') : [];
    return g;
  }).filter(function (g) {
    if (!lim) return true;
    const r = new Date(g.recibido);
    return isNaN(r) || r >= lim;
  });
}

function guardarProducto_(p) {
  const hoja = hojaProductos_();
  if (existeId_(hoja, p.id)) return { ok: true, id: p.id, repetido: true };
  hoja.appendRow(COLUMNAS_PRODUCTOS.map(function (c) {
    if (c === 'activo') return 'si';
    const x = p[c];
    return x === undefined || x === null ? '' : x;
  }));
  return { ok: true, id: p.id };
}

// ---------------------------------------------------------------- asistente (Claude)

const MODELO_ASISTENTE = 'claude-opus-5-5';

function contextoCampo_() {
  const f = buscarDatos_();
  if (!f) return '(sin datos del campo)';
  const d = JSON.parse(f.getBlob().getDataAsString('UTF-8'));
  const lineas = d.potreiros.map(function (p) {
    const rot = d.periodos.map(function (per) { return per + ': ' + (p.rotacao[per] || '—'); }).join(' | ');
    const mes = Object.keys(p.mensal).map(function (m) { return m + '=' + p.mensal[m]; }).join(', ');
    return '- ' + p.poligono + '. ' + p.nome + ' (' + p.ha + ' ha) — rotación: ' + rot + (mes ? ' — plan mensual: ' + mes : '');
  });
  return 'Campo: ' + d.campo + ', ' + d.local + '. Total ' +
    Math.round(d.potreiros.reduce(function (a, p) { return a + p.ha; }, 0)) + ' ha en ' + d.potreiros.length + ' potreros.\n' +
    'Períodos de la rotación: «20AA-AA» o «AA-AA» = verano (nov–abr); «inv AA» = invierno (may–oct).\n' +
    'Abreviaturas: sem = cultivo para semilla; CN = campo nativo; TB = trébol blanco; Rincón = Lotus subbiflorus El Rincón; ' +
    'Sta Adel = raigrás Santa Adelaida (lo producen para Pastos); verdeio = verdeo; resteva = rastrojo.\n' +
    lineas.join('\n');
}

const INSTRUCCIONES_ASISTENTE =
  'Sos el asistente de la app de campo de la Estância São José (Aceguá, RS, Brasil), que usan Roberto ' +
  '(Pastos, empresa de semillas forrajeras), Gonzalo (contador), João Antonio (propietario) y su técnico. ' +
  'El campo combina ganadería, soja, arroz y producción de semilla forrajera; a Pastos le interesa sobre todo la semilla.\n' +
  'Respondés consultas usando SOLO los datos que te paso: la rotación y el plan mensual de cada potrero, las visitas ' +
  'registradas y los gastos cargados. Si el dato no está, decilo y sugerí qué habría que registrar. No inventes cifras.\n' +
  'Al sumar gastos, usá total_usd y total_brl tal como vienen; si a un gasto le falta tipo de cambio, avisalo. ' +
  'Para costo por hectárea, dividí por las hectáreas del potrero o de los potreros del gasto.\n' +
  'Respondé en el idioma de la pregunta (español o portugués), corto y claro, pensado para leer en el celular: ' +
  'primero la respuesta, después el detalle en pocas líneas o una lista corta. Sin tablas anchas.';

function consultar_(cuerpo) {
  const clave = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!clave) return { ok: false, error: 'sin-clave-ia' };
  const pregunta = String(cuerpo.pregunta || '').slice(0, 4000);
  if (!pregunta) return { ok: false, error: 'pregunta' };

  const hoy = Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd');
  const visitas = leerVisitas_().map(function (v) { delete v.fotos; delete v.lat; delete v.lon; delete v.precision_m; return v; });
  const gastos = leerGastos_().map(function (g) { delete g.comprobante; delete g.exportado; return g; });
  const datosVivos = 'Hoy es ' + hoy + '. Quien pregunta: ' + (cuerpo.usuario || '?') + '.\n' +
    'VISITAS (' + visitas.length + '):\n' + JSON.stringify(visitas) + '\n' +
    'GASTOS (' + gastos.length + '):\n' + JSON.stringify(gastos);

  // Historial corto, solo texto, en orden; la pregunta nueva lleva los datos al día.
  const mensajes = [];
  (cuerpo.historial || []).slice(-8).forEach(function (m) {
    if ((m.role === 'user' || m.role === 'assistant') && m.content) mensajes.push({ role: m.role, content: String(m.content) });
  });
  while (mensajes.length && mensajes[0].role !== 'user') mensajes.shift();
  if (mensajes.length && mensajes[mensajes.length - 1].role === 'user') mensajes.pop();
  mensajes.push({ role: 'user', content: datosVivos + '\n\nPREGUNTA: ' + pregunta });

  const pedido = {
    model: MODELO_ASISTENTE,
    max_tokens: 4000,
    output_config: { effort: 'low' },
    fallbacks: 'default',
    // Instrucciones y datos fijos del campo primero, con caché: se reusan entre consultas.
    system: [
      { type: 'text', text: INSTRUCCIONES_ASISTENTE },
      { type: 'text', text: contextoCampo_(), cache_control: { type: 'ephemeral' } }
    ],
    messages: mensajes
  };
  const r = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': clave,
      'anthropic-version': '2026-10-21',
      'anthropic-beta': 'server-side-fallback-2026-07-01'
    },
    payload: JSON.stringify(pedido),
    muteHttpExceptions: true
  });
  const codigo = r.getResponseCode();
  let resp;
  try { resp = JSON.parse(r.getContentText()); } catch (err) { return { ok: false, error: 'ia-' + codigo }; }
  if (codigo !== 200) {
    return { ok: false, error: 'ia-' + codigo + ': ' + ((resp.error && resp.error.message) || '') };
  }
  if (resp.stop_reason === 'refusal') return { ok: false, error: 'ia-rechazo' };
  const texto = (resp.content || []).filter(function (b) { return b.type === 'text'; })
    .map(function (b) { return b.text; }).join('\n').trim();
  return { ok: true, respuesta: texto || '(sin respuesta)', modelo: resp.model };
}
