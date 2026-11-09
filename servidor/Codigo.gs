/**
 * Servidor de la app de visitas de campo — Estância São José (Aceguá).
 *
 * Vive como Apps Script en el Google Drive de rastessiano@pastos.com.uy.
 * - Guarda cada visita como una fila de la planilla «Visitas Estância São José».
 * - Guarda las fotos en la carpeta «Fotos visitas Estância São José».
 * - Devuelve los datos del campo (archivo «campo-sao-jose.json» en el Drive).
 *
 * Primera vez: ejecutar la función `configurar` desde el editor (botón ▶) y copiar la
 * clave que aparece en el registro. Después: Implementar → Nueva implementación →
 * Aplicación web, ejecutar como «Yo», acceso «Cualquier usuario».
 * Los datos del campo se suben por POST (accion «datos») desde la compu de Roberto.
 */

const COLUMNAS = [
  'id', 'fecha', 'usuario', 'potreiro_id', 'potreiro', 'lat', 'lon', 'precision_m',
  'uso', 'fase', 'estado', 'malezas_nivel', 'malezas', 'plagas_nivel', 'plagas',
  'enfermedades_nivel', 'enfermedades', 'categoria_animal', 'cabezas', 'altura_entrada_cm',
  'forraje_kgms_ha', 'remanente_cm', 'semilla_kg_ha', 'cosecha_prevista',
  'rec_fertilizacion', 'rec_aplicaciones', 'observaciones', 'fotos', 'recibido'
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
  const datos = buscarDatos_();
  if (datos) datos.moveTo(carpeta);
  Logger.log('CLAVE de la app: ' + props.getProperty('CLAVE'));
  Logger.log('Planilla: ' + SpreadsheetApp.openById(props.getProperty('PLANILLA')).getUrl());
  Logger.log('Datos del campo: ' + (datos ? 'encontrados' : 'todavía no (se suben desde la compu)'));
}

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

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (!claveOk_(p.clave)) return responder_({ ok: false, error: 'clave' });
  if (p.accion === 'datos') {
    const f = buscarDatos_();
    if (!f) return responder_({ ok: false, error: 'sin-datos' });
    return responder_({ ok: true, datos: JSON.parse(f.getBlob().getDataAsString('UTF-8')) });
  }
  if (p.accion === 'visitas') return responder_({ ok: true, visitas: leerVisitas_() });
  return responder_({ ok: true, ping: new Date().toISOString() });
}

function doPost(e) {
  let cuerpo;
  try { cuerpo = JSON.parse(e.postData.contents); }
  catch (err) { return responder_({ ok: false, error: 'json' }); }
  if (!claveOk_(cuerpo.clave)) return responder_({ ok: false, error: 'clave' });
  if (cuerpo.accion === 'datos' && cuerpo.datos && cuerpo.datos.potreiros) {
    return responder_(guardarDatos_(cuerpo.datos));
  }
  if (cuerpo.accion !== 'visita' || !cuerpo.visita || !cuerpo.visita.id) {
    return responder_({ ok: false, error: 'pedido' });
  }
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    return responder_(guardarVisita_(cuerpo.visita));
  } finally {
    lock.releaseLock();
  }
}

function hoja_() {
  const id = PropertiesService.getScriptProperties().getProperty('PLANILLA');
  return SpreadsheetApp.openById(id).getSheetByName('Visitas');
}

function guardarVisita_(v) {
  const hoja = hoja_();
  // Si la visita ya llegó (reintento), no se duplica.
  const ya = hoja.getRange('A:A').createTextFinder(v.id).matchEntireCell(true).findNext();
  if (ya) return { ok: true, id: v.id, repetida: true };

  const carpeta = DriveApp.getFolderById(
    PropertiesService.getScriptProperties().getProperty('FOTOS'));
  const enlaces = [];
  (v.fotos || []).forEach(function (f, i) {
    const nombre = [v.fecha.slice(0, 10), v.potreiro, v.usuario, i + 1].join(' - ') + '.jpg';
    const blob = Utilities.newBlob(Utilities.base64Decode(f.base64), 'image/jpeg', nombre);
    enlaces.push(carpeta.createFile(blob).getUrl());
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

function leerVisitas_() {
  const hoja = hoja_();
  const n = hoja.getLastRow();
  if (n < 2) return [];
  const valores = hoja.getRange(2, 1, n - 1, COLUMNAS.length).getDisplayValues();
  return valores.map(function (fila) {
    const o = {};
    COLUMNAS.forEach(function (c, i) { o[c] = fila[i]; });
    o.fotos = o.fotos ? o.fotos.split(' ') : [];
    return o;
  });
}
