/* App de visitas de campo — Estância São José (Aceguá).
 * Funciona sin señal: todo se guarda en el teléfono (IndexedDB) y se manda al servidor
 * (Apps Script en el Drive de Roberto) cuando hay conexión.
 * Sin módulos ni dependencias aparte de Leaflet (vendor/). */
(function () {
  'use strict';

  var VERSION = '2026-11-09 v7';
  // Punto de enganche para los módulos (gastos.js, asistente.js).
  var SJ = window.SJ = { vistas: {}, alSincronizar: [], pendientesExtra: [], textos: { es: {}, pt: {} } };
  SJ.T = function (k) {
    var l = (cfg && cfg.idioma) || 'es';
    return (SJ.textos[l] || {})[k] || SJ.textos.es[k] || T(k) || k;
  };
  var USUARIOS = ['Roberto', 'Gonzalo', 'João Antonio', 'Técnico'];

  // ---------------------------------------------------------------- textos
  var TXT = {
    es: {
      mapa: 'Mapa', potreiros: 'Potreros', nueva: 'Visita', visitas: 'Visitas', config: 'Ajustes',
      sub: 'Visitas de campo', pendientes: 'pendientes', alDia: 'Al día', sinServidor: 'Sin servidor',
      estasEn: 'Estás en', fueraCampo: 'Fuera de los potreros', buscandoGps: 'Buscando GPS…',
      nuevaAqui: 'Visita aquí', ha: 'ha', usoAhora: 'Uso ahora', planMes: 'Plan del mes',
      rotacion: 'Rotación', planMensual: 'Plan mensual (planilla)', historial: 'Visitas',
      reproducir: 'Recorrer las estaciones', volverHoy: 'Volver a hoy', lineaTiempo: 'Línea de tiempo',
      verPlan: 'Plan mensual (planilla)', volverFicha: 'Volver a la ficha', visitasF: 'Visitas (fechas)',
      planNota: 'Lo que la planilla del campo prevé para cada potrero, mes a mes. Tocá un potrero para abrir su ficha.',
      campana: 'Campaña', cultivoF: 'Cultivo', costoF: 'Costo', costoHaF: 'Costo/ha', gastoN: 'gasto', gastosN: 'gastos', visitaN: 'visita', visitasN: 'visitas',
      sinVisitas: 'Todavía no hay visitas.', nuevaVisita: 'Nueva visita', verMapa: 'Ver en el mapa',
      todos: 'Todos', semente: 'Semilla', pastagem: 'Pastura', soja: 'Soja', arroz: 'Arroz',
      nativo: 'Campo nativo', resteva: 'Rastrojo', outro: 'Otro', colheita: 'en cosecha',
      haSemilla: 'ha en semilla ahora', haInv: 'ha de semilla en el próximo invierno',
      potrero: 'Potrero', elegir: 'Elegir…', fecha: 'Fecha y hora', gps: 'Ubicación',
      gpsNo: 'Sin GPS', gpsActualizar: 'Tomar GPS', uso: 'Cultivo / uso que se ve',
      fase: 'Fase', estado: 'Estado general', estados: ['Muy malo', 'Malo', 'Regular', 'Bueno', 'Muy bueno'],
      niveles: ['No', 'Bajo', 'Medio', 'Alto'], malezas: 'Malezas', plagas: 'Plagas',
      enfermedades: 'Enfermedades', cuales: '¿Cuáles? ¿Dónde?', pastoreo: 'Pastoreo',
      categoria: 'Categoría animal', cabezas: 'Cabezas', alturaEntrada: 'Altura de entrada (cm)',
      forraje: 'Forraje disponible (kg MS/ha)', remanente: 'Remanente a la salida (cm)',
      semilla: 'Cultivo para semilla', rindeSemilla: 'Rinde estimado (kg/ha)',
      cosechaPrev: 'Cosecha prevista', recomendaciones: 'Recomendaciones',
      fertilizacion: 'Fertilización', aplicaciones: 'Aplicaciones', sugerencias: 'Sugerencias para esta época (tocar para agregar, validar):',
      obs: 'Observaciones', fotos: 'Fotos', agregarFoto: 'Sacar o elegir fotos', guardar: 'Guardar visita',
      cancelar: 'Cancelar', guardada: 'Visita guardada en el teléfono.', faltaPotrero: 'Elegí el potrero.',
      fases: ['Implantación', 'Vegetativo / macollaje', 'Encañazón', 'Espigazón / floración',
        'Llenado de grano', 'Madurez / cosecha', 'Rebrote / pospastoreo', 'Barbecho'],
      enviada: 'Enviada', pendiente: 'Pendiente de enviar', de: 'de',
      usuario: 'Quién usa este teléfono', otro: 'Otro nombre', idioma: 'Idioma',
      servidor: 'Dirección del servidor', clave: 'Clave', guardarAjustes: 'Guardar ajustes',
      bajarDatos: 'Bajar datos del campo', sincronizar: 'Sincronizar ahora',
      ultimaSync: 'Última sincronización', nunca: 'nunca', version: 'Versión',
      datosCampo: 'Datos del campo', ajustesOk: 'Ajustes guardados.', datosOk: 'Datos del campo actualizados.',
      syncOk: 'Sincronizado.', syncError: 'No se pudo sincronizar:', sinConexion: 'sin conexión',
      faltaServidor: 'Falta la dirección del servidor y la clave (Ajustes).',
      sinDatos: 'Faltan los datos del campo. Cargá servidor y clave y tocá «Bajar datos del campo».',
      borrar: '🗑 Borrar esta visita', confirmarBorrar: '¿Borrar esta visita? Todavía no se envió.',
      confirmarBorrarEnv: '¿Borrar esta visita? También se borra de la planilla (queda una copia en la hoja «Visitas borradas»).',
      editar: '✏️ Editar esta visita', editarVisita: 'Editar visita', guardarCambios: 'Guardar cambios',
      cambiosOk: 'Cambios guardados.', borradaOk: 'Visita borrada.', editadaPend: 'Editada, sin enviar',
      fotosEnviadas: 'Fotos ya enviadas (tocá × para sacarla)', servidorViejo: 'el servidor todavía no tiene la actualización para editar o borrar visitas.',
      compartir: '📤 Enviar por mail o WhatsApp', armandoPdf: 'Armando el PDF…', pdfBajado: 'Este equipo no deja compartir archivos: el PDF quedó en Descargas.',
      visitaCampo: 'Visita de campo', fotosDrive: 'Fotos en el Drive',
      verFoto: 'Ver foto', respaldo: 'Exportar respaldo (JSON)', nPend: 'visitas sin enviar',
      sinRemanente: '', satelite: 'Satélite (con internet)', imagen: 'Imagen de los potreros',
      semente_azevem: 'Semilla raigrás', semente_festuca: 'Semilla festuca', semente_leguminosa: 'Semilla leguminosa',
      lista: 'Lista', tablero: 'Rotación', ahora: 'Ahora', verano: 'Ver.', invierno: 'Inv.',
      haEstacion: 'Hectáreas por estación', haSemillaCorto: 'ha semilla', ver: 'Ver',
      registros: 'Registros', asistente: 'Asistente', nuevoQue: '¿Qué querés cargar?',
      nuevaVisitaDesc: 'Recorrida: estado del cultivo, malezas, plagas, pastoreo, fotos.',
      nuevoGasto: 'Gasto o tarea', nuevoGastoDesc: 'Insumo aplicado, labor, flete o mano de obra, con su costo.'
    },
    pt: {
      mapa: 'Mapa', potreiros: 'Potreiros', nueva: 'Visita', visitas: 'Visitas', config: 'Ajustes',
      sub: 'Visitas de campo', pendientes: 'pendentes', alDia: 'Em dia', sinServidor: 'Sem servidor',
      estasEn: 'Você está em', fueraCampo: 'Fora dos potreiros', buscandoGps: 'Buscando GPS…',
      nuevaAqui: 'Visita aqui', ha: 'ha', usoAhora: 'Uso agora', planMes: 'Plano do mês',
      rotacion: 'Rotação', planMensual: 'Plano mensal (planilha)', historial: 'Visitas',
      reproducir: 'Percorrer as estações', volverHoy: 'Voltar a hoje', lineaTiempo: 'Linha do tempo',
      verPlan: 'Plano mensal (planilha)', volverFicha: 'Voltar à ficha', visitasF: 'Visitas (datas)',
      planNota: 'O que a planilha do campo prevê para cada potreiro, mês a mês. Toque num potreiro para abrir a ficha.',
      campana: 'Safra', cultivoF: 'Cultura', costoF: 'Custo', costoHaF: 'Custo/ha', gastoN: 'gasto', gastosN: 'gastos', visitaN: 'visita', visitasN: 'visitas',
      sinVisitas: 'Ainda não há visitas.', nuevaVisita: 'Nova visita', verMapa: 'Ver no mapa',
      todos: 'Todos', semente: 'Semente', pastagem: 'Pastagem', soja: 'Soja', arroz: 'Arroz',
      nativo: 'Campo nativo', resteva: 'Resteva', outro: 'Outro', colheita: 'em colheita',
      haSemilla: 'ha em semente agora', haInv: 'ha de semente no próximo inverno',
      potrero: 'Potreiro', elegir: 'Escolher…', fecha: 'Data e hora', gps: 'Localização',
      gpsNo: 'Sem GPS', gpsActualizar: 'Pegar GPS', uso: 'Cultura / uso observado',
      fase: 'Fase', estado: 'Estado geral', estados: ['Muito ruim', 'Ruim', 'Regular', 'Bom', 'Muito bom'],
      niveles: ['Não', 'Baixo', 'Médio', 'Alto'], malezas: 'Invasoras', plagas: 'Pragas',
      enfermedades: 'Doenças', cuales: 'Quais? Onde?', pastoreo: 'Pastejo',
      categoria: 'Categoria animal', cabezas: 'Cabeças', alturaEntrada: 'Altura de entrada (cm)',
      forraje: 'Forragem disponível (kg MS/ha)', remanente: 'Resíduo na saída (cm)',
      semilla: 'Lavoura para semente', rindeSemilla: 'Rendimento estimado (kg/ha)',
      cosechaPrev: 'Colheita prevista', recomendaciones: 'Recomendações',
      fertilizacion: 'Adubação', aplicaciones: 'Aplicações', sugerencias: 'Sugestões para esta época (tocar para adicionar, validar):',
      obs: 'Observações', fotos: 'Fotos', agregarFoto: 'Tirar ou escolher fotos', guardar: 'Salvar visita',
      cancelar: 'Cancelar', guardada: 'Visita salva no telefone.', faltaPotrero: 'Escolha o potreiro.',
      fases: ['Implantação', 'Vegetativo / perfilhamento', 'Alongamento', 'Espigamento / floração',
        'Enchimento de grão', 'Maturação / colheita', 'Rebrote / pós-pastejo', 'Pousio'],
      enviada: 'Enviada', pendiente: 'Pendente de envio', de: 'de',
      usuario: 'Quem usa este telefone', otro: 'Outro nome', idioma: 'Idioma',
      servidor: 'Endereço do servidor', clave: 'Chave', guardarAjustes: 'Salvar ajustes',
      bajarDatos: 'Baixar dados do campo', sincronizar: 'Sincronizar agora',
      ultimaSync: 'Última sincronização', nunca: 'nunca', version: 'Versão',
      datosCampo: 'Dados do campo', ajustesOk: 'Ajustes salvos.', datosOk: 'Dados do campo atualizados.',
      syncOk: 'Sincronizado.', syncError: 'Não foi possível sincronizar:', sinConexion: 'sem conexão',
      faltaServidor: 'Falta o endereço do servidor e a chave (Ajustes).',
      sinDatos: 'Faltam os dados do campo. Coloque servidor e chave e toque «Baixar dados do campo».',
      borrar: '🗑 Apagar esta visita', confirmarBorrar: 'Apagar esta visita? Ainda não foi enviada.',
      confirmarBorrarEnv: 'Apagar esta visita? Também será apagada da planilha (fica uma cópia na aba «Visitas borradas»).',
      editar: '✏️ Editar esta visita', editarVisita: 'Editar visita', guardarCambios: 'Salvar alterações',
      cambiosOk: 'Alterações salvas.', borradaOk: 'Visita apagada.', editadaPend: 'Editada, não enviada',
      fotosEnviadas: 'Fotos já enviadas (toque × para tirar)', servidorViejo: 'o servidor ainda não tem a atualização para editar ou apagar visitas.',
      compartir: '📤 Enviar por e-mail ou WhatsApp', armandoPdf: 'Montando o PDF…', pdfBajado: 'Este aparelho não permite compartilhar arquivos: o PDF ficou em Downloads.',
      visitaCampo: 'Visita de campo', fotosDrive: 'Fotos no Drive',
      verFoto: 'Ver foto', respaldo: 'Exportar backup (JSON)', nPend: 'visitas não enviadas',
      sinRemanente: '', satelite: 'Satélite (com internet)', imagen: 'Imagem dos potreiros',
      semente_azevem: 'Semente azevém', semente_festuca: 'Semente festuca', semente_leguminosa: 'Semente leguminosa',
      lista: 'Lista', tablero: 'Rotação', ahora: 'Agora', verano: 'Ver.', invierno: 'Inv.',
      haEstacion: 'Hectares por estação', haSemillaCorto: 'ha semente', ver: 'Ver',
      registros: 'Registros', asistente: 'Assistente', nuevoQue: 'O que você quer registrar?',
      nuevaVisitaDesc: 'Vistoria: estado da lavoura, invasoras, pragas, pastejo, fotos.',
      nuevoGasto: 'Gasto ou tarefa', nuevoGastoDesc: 'Insumo aplicado, operação, frete ou mão de obra, com seu custo.'
    }
  };
  var COLORES = { semente: '#f5b800', pastagem: '#2e9e4f', soja: '#7b5ea7', arroz: '#3a8fd1',
    nativo: '#a6c96a', resteva: '#8b8f96', outro: '#c9ced6' };
  var COLORES_TIPO = { semente_azevem: '#f5b800', semente_festuca: '#e8740c', semente_leguminosa: '#d4569b' };
  var TIPOS = ['semente_azevem', 'semente_festuca', 'semente_leguminosa', 'pastagem', 'soja', 'arroz', 'nativo', 'resteva', 'outro'];
  function colorTipo(t) { return COLORES_TIPO[t] || COLORES[t] || COLORES.outro; }
  function nombreTipo(t) { return t === 'outro' ? '?' : T(t); }

  // ---------------------------------------------------------------- estado
  var cfg = { usuario: '', idioma: 'es', url: '', clave: '' };
  var datos = null;          // paquete del campo
  var remotas = [];          // visitas bajadas del servidor
  var locales = [];          // visitas guardadas en este teléfono
  var gpsPos = null;         // última posición
  var borrador = null;       // visita en edición
  var sincronizando = false;
  var mapa = null, capaPot = null, marcaGps = null;
  var filtroPot = 'todos';
  var modoPot = 'lista';      // lista | tablero
  var periodoMapa = 'ahora';  // estación que pinta el mapa

  function T(k) { return (TXT[cfg.idioma] || TXT.es)[k]; }
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) {
    return String(s === undefined || s === null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function aviso(msg) {
    var a = $('#aviso'); a.textContent = msg; a.classList.remove('oculto');
    clearTimeout(aviso.t); aviso.t = setTimeout(function () { a.classList.add('oculto'); }, 3500);
  }
  function uid() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }
  function ahoraLocal() {
    var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }

  // ---------------------------------------------------------------- IndexedDB
  var dbP = null;
  function db() {
    if (dbP) return dbP;
    dbP = new Promise(function (ok, mal) {
      var r = indexedDB.open('visitas-sao-jose', 2);
      r.onupgradeneeded = function () {
        var d = r.result;
        if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv', { keyPath: 'k' });
        if (!d.objectStoreNames.contains('visitas')) d.createObjectStore('visitas', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('gastos')) d.createObjectStore('gastos', { keyPath: 'id' });
      };
      r.onsuccess = function () { ok(r.result); };
      r.onerror = function () { mal(r.error); };
    });
    return dbP;
  }
  function tx(store, modo, fn) {
    return db().then(function (d) {
      return new Promise(function (ok, mal) {
        var t = d.transaction(store, modo), s = t.objectStore(store), res;
        var req = fn(s);
        if (req) req.onsuccess = function () { res = req.result; };
        t.oncomplete = function () { ok(res); };
        t.onerror = function () { mal(t.error); };
      });
    });
  }
  function kvGet(k) { return tx('kv', 'readonly', function (s) { return s.get(k); }).then(function (r) { return r ? r.v : undefined; }); }
  function kvSet(k, v) { return tx('kv', 'readwrite', function (s) { return s.put({ k: k, v: v }); }); }
  function visitasTodas() { return tx('visitas', 'readonly', function (s) { return s.getAll(); }); }
  function visitaPut(v) { return tx('visitas', 'readwrite', function (s) { return s.put(v); }); }
  function visitaDel(id) { return tx('visitas', 'readwrite', function (s) { return s.delete(id); }); }

  // ---------------------------------------------------------------- lógica del campo
  function clasificar(t) {
    t = String(t || '').toLowerCase().trim();
    if (/^sem\b|^sem\.|^sem /.test(t)) {
      if (/tb|lotus|rinc/.test(t)) return 'semente_leguminosa';
      if (/fest|f\.? ?princ|f\.? ?rust/.test(t)) return 'semente_festuca';
      return 'semente_azevem';
    }
    if (/soja/.test(t)) return 'soja';
    if (/arroz/.test(t)) return 'arroz';
    if (/^cn\b/.test(t)) return 'nativo';
    if (/resteva/.test(t)) return 'resteva';
    if (/verdeio|azev|fest|pastoreio|\btb\b|\baz\b|rinc|fardo/.test(t)) return 'pastagem';
    return 'outro';
  }
  function categoria(tipo) { return tipo.indexOf('semente') === 0 ? 'semente' : tipo; }

  function buscarPeriodo(cands) {
    for (var i = 0; i < cands.length; i++) if (datos.periodos.indexOf(cands[i]) >= 0) return cands[i];
    return cands[0];
  }
  function periodoDe(d) {
    var m = d.getMonth() + 1, yy = d.getFullYear() % 100;
    if (m >= 5 && m <= 10) return buscarPeriodo(['inv ' + yy]);
    var a = m >= 11 ? yy : yy - 1;
    return buscarPeriodo(['20' + a + '-' + (a + 1), a + '-' + (a + 1)]);
  }
  function invernoDe(d) {
    var m = d.getMonth() + 1, yy = d.getFullYear() % 100;
    if (m >= 11) return 'inv ' + yy;
    if (m <= 4) return 'inv ' + (yy - 1);
    return 'inv ' + yy;
  }
  function invernoSiguiente(d) {
    var m = d.getMonth() + 1, yy = d.getFullYear() % 100;
    return 'inv ' + (m >= 11 ? yy + 1 : yy + (m <= 4 ? 0 : 1));
  }
  function usoAhora(p, d) {
    d = d || new Date();
    var m = d.getMonth() + 1, per = periodoDe(d);
    var uso = p.rotacao[per] || '', mes = p.mensal[m] || '', colheita = false;
    if ((m >= 11 || m <= 1) && /colheita/i.test(mes)) {
      var inv = p.rotacao[invernoDe(d)] || '';
      if (clasificar(inv).indexOf('semente') === 0) { uso = inv; colheita = true; per = invernoDe(d); }
    }
    var tipo = clasificar(uso);
    return { per: per, uso: uso, mes: mes, tipo: tipo, cat: categoria(tipo), colheita: colheita };
  }
  function potrero(id) {
    for (var i = 0; i < datos.potreiros.length; i++) if (datos.potreiros[i].id === id) return datos.potreiros[i];
    return null;
  }
  function potrerosDePoligono(n) { return datos.potreiros.filter(function (p) { return p.poligono === n; }); }
  function dentro(lon, lat, anillo) {
    var c = false;
    for (var i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
      var xi = anillo[i][0], yi = anillo[i][1], xj = anillo[j][0], yj = anillo[j][1];
      if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  }
  function poligonoEn(lat, lon) {
    for (var n in datos.poligonos) if (dentro(lon, lat, datos.poligonos[n])) return Number(n);
    return null;
  }
  function sugerencias(tipo, mes) {
    var lista = REGLAS[tipo] || [];
    return lista.filter(function (r) { return r.meses.indexOf(mes) >= 0; })
      .map(function (r) { return r[cfg.idioma] || r.es; });
  }

  // ---------------------------------------------------------------- visitas
  function todasLasVisitas() {
    var porId = {};
    remotas.forEach(function (v) { porId[v.id] = { v: v, local: false }; });
    locales.forEach(function (v) {
      // Lo pendiente del teléfono (visita nueva, editada o por borrar) manda sobre lo del servidor.
      if (v.op === 'borrar') { if (!v.enviada) delete porId[v.id]; return; }
      if (!porId[v.id] || !v.enviada) porId[v.id] = { v: v, local: true };
    });
    return Object.keys(porId).map(function (k) { return porId[k]; })
      .sort(function (a, b) { return String(b.v.fecha).localeCompare(String(a.v.fecha)); });
  }
  function pendientes() { return locales.filter(function (v) { return !v.enviada; }); }
  function recargarLocales() { return visitasTodas().then(function (l) { locales = l || []; pill(); }); }

  // ---------------------------------------------------------------- barra de sincronización
  function pill() {
    var b = $('#btn-sync'), n = pendientes().length + SJ.pendientesExtra.reduce(function (a, f) { return a + f(); }, 0);
    b.classList.remove('pend', 'ok');
    if (sincronizando) { b.textContent = '⟳ …'; return; }
    if (!cfg.url) { b.textContent = T('sinServidor'); return; }
    if (n) { b.textContent = '⬆ ' + n + ' ' + T('pendientes'); b.classList.add('pend'); }
    else { b.textContent = '✓ ' + T('alDia'); b.classList.add('ok'); }
  }

  function fetchT(url, op, ms) {
    var ctl = new AbortController(), t = setTimeout(function () { ctl.abort(); }, ms || 30000);
    op = op || {}; op.signal = ctl.signal; op.redirect = 'follow';
    return fetch(url, op).finally(function () { clearTimeout(t); });
  }
  function blobB64(blob) {
    return new Promise(function (ok, mal) {
      var r = new FileReader();
      r.onload = function () { ok(String(r.result).split(',')[1]); };
      r.onerror = function () { mal(r.error); };
      r.readAsDataURL(blob);
    });
  }
  var CAMPOS = ['id', 'fecha', 'usuario', 'potreiro_id', 'potreiro', 'lat', 'lon', 'precision_m',
    'uso', 'fase', 'estado', 'malezas_nivel', 'malezas', 'plagas_nivel', 'plagas',
    'enfermedades_nivel', 'enfermedades', 'categoria_animal', 'cabezas', 'altura_entrada_cm',
    'forraje_kgms_ha', 'remanente_cm', 'semilla_kg_ha', 'cosecha_prevista',
    'rec_fertilizacion', 'rec_aplicaciones', 'observaciones'];

  function sincronizar(manual) {
    if (!cfg.url || !cfg.clave) { if (manual) aviso(T('faltaServidor')); return Promise.resolve(); }
    if (sincronizando) return Promise.resolve();
    sincronizando = true; pill();
    var cola = pendientes().slice();
    function enviarSiguiente() {
      var v = cola.shift();
      if (!v) return Promise.resolve();
      if (v.op === 'borrar') {
        return fetchT(cfg.url, {
          method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ clave: cfg.clave, accion: 'visitaBorrar', id: v.id, usuario: cfg.usuario })
        }, 60000).then(function (r) { return r.json(); }).then(function (j) {
          if (!j.ok) throw new Error(j.error === 'pedido' ? T('servidorViejo') : (j.error || 'error'));
          remotas = remotas.filter(function (x) { return x.id !== v.id; });
          return Promise.all([visitaDel(v.id), kvSet('remotas', remotas)]);
        }).then(enviarSiguiente);
      }
      var fotos = (v.fotos || []).filter(function (f) { return f.grande; });
      return Promise.all(fotos.map(function (f) { return blobB64(f.grande); })).then(function (b64s) {
        var vis = {};
        CAMPOS.forEach(function (c) { vis[c] = v[c]; });
        vis.fotos = b64s.map(function (b) { return { base64: b }; });
        if (v.op === 'editar') vis.fotosPrevias = v.fotosUrl || [];
        return fetchT(cfg.url, {
          method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ clave: cfg.clave, accion: v.op === 'editar' ? 'visitaEditar' : 'visita', visita: vis })
        }, 120000);
      }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j.ok) throw new Error(j.error === 'pedido' ? T('servidorViejo') : (j.error || 'error'));
        v.enviada = true;
        if (j.fotos) v.fotosUrl = j.fotos;
        // La foto grande ya está en el Drive: queda solo la miniatura para no llenar el teléfono.
        (v.fotos || []).forEach(function (f) { delete f.grande; });
        if (v.op === 'editar') {
          var copia = {};
          CAMPOS.forEach(function (c) { copia[c] = v[c] === undefined || v[c] === null ? '' : String(v[c]); });
          copia.fecha = String(v.fecha || '').replace('T', ' ').slice(0, 16);
          copia.fotos = v.fotosUrl || [];
          remotas = remotas.filter(function (x) { return x.id !== v.id; }).concat([copia]);
          kvSet('remotas', remotas);
        }
        return visitaPut(v);
      }).then(enviarSiguiente);
    }
    return enviarSiguiente().then(function () {
      return SJ.alSincronizar.reduce(function (pr, f) { return pr.then(f); }, Promise.resolve());
    }).then(function () {
      return fetchT(cfg.url + '?accion=visitas&clave=' + encodeURIComponent(cfg.clave), {}, 45000);
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.ok) throw new Error(j.error || 'error');
      remotas = j.visitas || [];
      return Promise.all([kvSet('remotas', remotas), kvSet('ultimaSync', new Date().toISOString())]);
    }).then(function () {
      if (manual) aviso(T('syncOk'));
    }).catch(function (e) {
      if (manual) aviso(T('syncError') + ' ' + (e.name === 'AbortError' || e instanceof TypeError ? T('sinConexion') : e.message));
    }).then(function () {
      sincronizando = false;
      return recargarLocales();
    }).then(function () { refrescar(); });
  }

  function bajarDatos() {
    if (!cfg.url || !cfg.clave) { aviso(T('faltaServidor')); return Promise.resolve(); }
    return fetchT(cfg.url + '?accion=datos&clave=' + encodeURIComponent(cfg.clave), {}, 60000)
      .then(function (r) { return r.json(); }).then(function (j) {
        if (!j.ok) throw new Error(j.error);
        datos = j.datos;
        return kvSet('datos', datos);
      }).then(function () {
        aviso(T('datosOk')); armarMapa(); ir('mapa');
      }).catch(function (e) { aviso(T('syncError') + ' ' + e.message); });
  }

  // ---------------------------------------------------------------- navegación
  var telaActual = 'mapa';
  function ir(tela, arg) {
    if (!datos && tela !== 'config') tela = 'config';
    document.querySelectorAll('.tela').forEach(function (s) { s.classList.add('oculto'); });
    $('#tela-' + tela).classList.remove('oculto');
    document.querySelectorAll('.pestanas button').forEach(function (b) {
      var grupo = { visita: 'nueva', nuevo: 'nueva', gasto: 'nueva', gastos: 'visitas', costos: 'visitas', detalle: 'visitas', detalleGasto: 'visitas', ficha: 'potreiros', plan: 'potreiros' }[tela];
      b.classList.toggle('activa', b.dataset.tela === tela || b.dataset.tela === grupo);
    });
    telaActual = tela;
    if (tela === 'mapa') encuadrar();
    if (tela === 'potreiros') vistaPotreros();
    if (tela === 'ficha') vistaFicha(arg);
    if (tela === 'plan') vistaPlan(arg);
    if (tela === 'visita') vistaVisita(arg);
    if (tela === 'visitas') vistaVisitas(arg);
    if (tela === 'detalle') vistaDetalle(arg);
    if (tela === 'config') vistaConfig();
    if (tela === 'nuevo') vistaNuevo();
    if (SJ.vistas[tela]) SJ.vistas[tela](arg);
    $('#tela-' + tela).scrollTop = 0;
  }
  var fichaActual = null;
  function refrescar() {
    if (mapa) pintarPoligonos();
    if (telaActual === 'potreiros') vistaPotreros();
    if (telaActual === 'ficha' && fichaActual) vistaFicha(fichaActual);
    if (telaActual === 'plan') vistaPlan(fichaActual);
    if (telaActual === 'visitas') vistaVisitas();
    if (telaActual === 'config') vistaConfig();
    if (SJ.vistas[telaActual] && telaActual !== 'gasto' && telaActual !== 'asistente') SJ.vistas[telaActual]();
  }
  function textos() {
    document.querySelectorAll('[data-t]').forEach(function (e) { e.textContent = T(e.dataset.t); });
    $('#sub').textContent = T('sub');
    document.documentElement.lang = cfg.idioma === 'pt' ? 'pt-BR' : 'es';
    pill();
  }

  // ---------------------------------------------------------------- mapa
  function armarMapa() {
    if (!datos) return;
    var im = datos.imagem;
    var limites = L.latLngBounds([im.sul, im.oeste], [im.norte, im.leste]);
    if (!mapa) {
      mapa = L.map('mapa', { zoomControl: false, attributionControl: true, maxZoom: 19, zoomSnap: 0.25 });
      L.control.zoom({ position: 'bottomright' }).addTo(mapa);
      mapa.setView(limites.getCenter(), 13);
      var sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19, maxNativeZoom: 18, attribution: 'Esri' });
      sat.addTo(mapa);
      mapa._capaImagen = L.imageOverlay(im.data, limites, { opacity: 0.9 }).addTo(mapa);
      var ctl = {}; ctl[T('imagen')] = mapa._capaImagen;
      L.control.layers(null, ctl, { position: 'bottomright' }).addTo(mapa);
      mapa._limites = limites;
      capaPot = L.layerGroup().addTo(mapa);
    }
    var todos = [];
    Object.keys(datos.poligonos).forEach(function (n) { datos.poligonos[n].forEach(function (c) { todos.push([c[1], c[0]]); }); });
    mapa._limites = L.latLngBounds(todos); mapa._encuadrado = false;
    if (telaActual === 'mapa') encuadrar();
    pintarPoligonos();
    leyenda(); lineaTiempo();
    iniciarGps();
  }
  function encuadrar() {
    if (!mapa) return;
    setTimeout(function () {
      mapa.invalidateSize();
      if (!mapa._encuadrado && $('#mapa').clientHeight > 0) { mapa.fitBounds(mapa._limites, { padding: [6, 6] }); mapa._encuadrado = true; }
    }, 60);
  }
  function pintarPoligonos() {
    capaPot.clearLayers();
    Object.keys(datos.poligonos).forEach(function (n) {
      var pots = potrerosDePoligono(Number(n));
      if (!pots.length) return;
      var tipo = periodoMapa === 'ahora' ? usoAhora(pots[0]).tipo : clasificar(pots[0].rotacao[periodoMapa]);
      var ll = datos.poligonos[n].map(function (c) { return [c[1], c[0]]; });
      var pol = L.polygon(ll, { color: '#fff', weight: 1.5, fillColor: colorTipo(tipo), fillOpacity: 0.6 });
      pol.bindTooltip(String(n), { permanent: true, direction: 'center', className: 'etiqueta' });
      pol.on('click', function () {
        if (pots.length === 1) { ir('ficha', pots[0].id); return; }
        var html = pots.map(function (p) {
          return '<button class="btn chico sec" data-pot="' + p.id + '" style="margin:3px 0;width:100%">' + esc(p.nome) + '</button>';
        }).join('');
        L.popup().setLatLng(pol.getBounds().getCenter()).setContent(html).openOn(mapa);
      });
      capaPot.addLayer(pol);
    });
  }
  function etiquetaPer(per) {
    return /^inv/.test(per) ? T('invierno') + ' ' + per.replace('inv ', '') : T('verano') + ' ' + per.replace(/^20/, '');
  }
  // Leyenda con hectáreas por cultivo de la estación que se ve, y línea de tiempo para recorrer las estaciones.
  function leyenda() {
    var tot = {};
    datos.potreiros.forEach(function (p) {
      var t = periodoMapa === 'ahora' ? usoAhora(p).tipo : clasificar(p.rotacao[periodoMapa]);
      tot[t] = (tot[t] || 0) + p.ha;
    });
    $('#leyenda').innerHTML = TIPOS.filter(function (t) { return t !== 'outro' || tot[t]; }).map(function (c) {
      return '<div class="' + (tot[c] ? '' : 'cero') + '"><i style="background:' + colorTipo(c) + '"></i>' + esc(nombreTipo(c)) +
        '<b>' + (tot[c] ? Math.round(tot[c]) : '') + '</b></div>';
    }).join('');
    L.DomEvent.disableClickPropagation($('#leyenda'));
  }
  var animando = null;
  function lineaTiempo() {
    var pers = datos.periodos, hoyPer = periodoDe(new Date()), iHoy = pers.indexOf(hoyPer);
    var i = periodoMapa === 'ahora' ? iHoy : pers.indexOf(periodoMapa);
    var el = $('#linea');
    el.innerHTML = '<div class="linea-fila"><button type="button" class="linea-play" id="linea-play" aria-label="' + esc(T('reproducir')) + '">' +
      (animando ? '❚❚' : '▶') + '</button><div class="linea-txt"><b id="linea-et">' + esc(etiquetaPer(pers[i])) + '</b>' +
      '<span id="linea-hoy" class="' + (i === iHoy ? '' : 'oculto') + '">' + esc(T('ahora')) + '</span></div>' +
      (i !== iHoy ? '<button type="button" class="linea-volver" id="linea-volver">' + esc(T('volverHoy')) + '</button>' : '') + '</div>' +
      '<input type="range" id="linea-rango" min="0" max="' + (pers.length - 1) + '" step="1" value="' + i + '" aria-label="' + esc(T('lineaTiempo')) + '">' +
      '<div class="linea-marcas">' + pers.map(function (p, k) {
        return '<span class="' + (k === iHoy ? 'hoy ' : '') + (k === i ? 'sel' : '') + '" data-linea="' + k + '">' +
          esc(/^inv/.test(p) ? '❄️ ' + p.replace('inv ', '') : '☀️ ' + p.replace(/^20/, '')) + '</span>';
      }).join('') + '</div>';
    function ir_(k) {
      periodoMapa = k === iHoy ? 'ahora' : pers[k];
      pintarPoligonos(); leyenda(); lineaTiempo();
    }
    $('#linea-rango').oninput = function () { pararAnim(); ir_(Number(this.value)); };
    el.querySelectorAll('[data-linea]').forEach(function (s) { s.onclick = function () { pararAnim(); ir_(Number(s.dataset.linea)); }; });
    if ($('#linea-volver')) $('#linea-volver').onclick = function () { pararAnim(); ir_(iHoy); };
    $('#linea-play').onclick = function () {
      if (animando) { pararAnim(); lineaTiempo(); return; }
      var k = i >= pers.length - 1 ? 0 : i + 1;
      ir_(k);
      animando = setInterval(function () {
        var actual = periodoMapa === 'ahora' ? iHoy : pers.indexOf(periodoMapa);
        if (actual >= pers.length - 1) { pararAnim(); lineaTiempo(); return; }
        ir_(actual + 1);
      }, 1400);
      lineaTiempo();
    };
    L.DomEvent.disableClickPropagation(el);
  }
  function pararAnim() { if (animando) { clearInterval(animando); animando = null; } }
  var gpsWatch = null;
  function iniciarGps() {
    if (!navigator.geolocation || gpsWatch !== null) return;
    $('#aqui').classList.remove('oculto');
    $('#aqui').innerHTML = '<div>' + esc(T('buscandoGps')) + '</div>';
    gpsWatch = navigator.geolocation.watchPosition(function (p) {
      gpsPos = { lat: p.coords.latitude, lon: p.coords.longitude, prec: Math.round(p.coords.accuracy) };
      if (mapa) {
        if (!marcaGps) marcaGps = L.circleMarker([gpsPos.lat, gpsPos.lon], { radius: 8, color: '#fff', weight: 3, fillColor: '#1e6fff', fillOpacity: 1 }).addTo(mapa);
        else marcaGps.setLatLng([gpsPos.lat, gpsPos.lon]);
      }
      cartelAqui();
    }, function () {
      $('#aqui').classList.add('oculto');
    }, { enableHighAccuracy: true, maximumAge: 15000, timeout: 30000 });
  }
  function cartelAqui() {
    var a = $('#aqui');
    if (!gpsPos || !datos) return;
    var n = poligonoEn(gpsPos.lat, gpsPos.lon);
    a.classList.remove('oculto');
    if (n === null) { a.innerHTML = '<div><b>' + esc(T('fueraCampo')) + '</b>± ' + gpsPos.prec + ' m</div>'; return; }
    var pots = potrerosDePoligono(n);
    a.innerHTML = '<div>' + esc(T('estasEn')) + '<b>' + esc(pots.map(function (p) { return p.nome; }).join(' / ')) +
      '</b></div><button class="btn chico" id="btn-aqui" type="button">' + esc(T('nuevaAqui')) + '</button>';
    $('#btn-aqui').onclick = function () { ir('visita', { potrero: pots.length === 1 ? pots[0].id : '' }); };
  }

  // ---------------------------------------------------------------- vistas
  function chip(cat) { return '<span class="chip" style="background:' + COLORES[cat] + '">' + esc(T(cat)) + '</span>'; }
  function ultimaVisita(id) {
    var l = todasLasVisitas().filter(function (x) { return x.v.potreiro_id === id; });
    return l.length ? l[0].v : null;
  }

  function vistaPotreros() {
    var conm = '<div class="filtros conm"><button type="button" data-modo="lista" class="' + (modoPot === 'lista' ? 'activo' : '') + '">' +
      esc(T('lista')) + '</button><button type="button" data-modo="tablero" class="' + (modoPot === 'tablero' ? 'activo' : '') + '">▦ ' +
      esc(T('tablero')) + '</button></div>';
    if (modoPot === 'tablero') { $('#tela-potreiros').innerHTML = conm + tableroRotacion(); return; }
    var hoy = new Date(), invSig = invernoSiguiente(hoy);
    var haSem = 0, haInv = 0;
    datos.potreiros.forEach(function (p) {
      if (usoAhora(p, hoy).cat === 'semente') haSem += p.ha;
      if (categoria(clasificar(p.rotacao[invSig])) === 'semente') haInv += p.ha;
    });
    var cats = ['todos', 'semente', 'pastagem', 'soja', 'arroz', 'nativo', 'resteva'];
    var lista = datos.potreiros.slice().sort(function (a, b) {
      var sa = usoAhora(a, hoy).cat === 'semente' ? 0 : 1, sb = usoAhora(b, hoy).cat === 'semente' ? 0 : 1;
      return sa - sb || a.poligono - b.poligono;
    }).filter(function (p) { return filtroPot === 'todos' || usoAhora(p, hoy).cat === filtroPot; });
    var h = conm + '<div class="resumen"><div class="tarjeta"><b>' + Math.round(haSem) + '</b><span class="mut">' + esc(T('haSemilla')) +
      '</span></div><div class="tarjeta"><b>' + Math.round(haInv) + '</b><span class="mut">' + esc(T('haInv')) + ' (' + esc(invSig) + ')</span></div></div>';
    h += '<div class="filtros">' + cats.map(function (c) {
      return '<button type="button" data-filtro="' + c + '" class="' + (filtroPot === c ? 'activo' : '') + '">' + esc(T(c)) + '</button>';
    }).join('') + '</div><div class="lista-pot">';
    lista.forEach(function (p) {
      var u = usoAhora(p, hoy), uv = ultimaVisita(p.id);
      h += '<div class="tarjeta" data-ficha="' + p.id + '"><div class="fila"><div class="crece"><div class="nombre">' +
        p.poligono + '. ' + esc(p.nome) + '</div><div class="mut">' + p.ha + ' ' + T('ha') + ' · ' + esc(u.uso || '—') +
        (u.colheita ? ' (' + esc(T('colheita')) + ')' : '') + (uv ? ' · 🕓 ' + esc(String(uv.fecha).slice(0, 10)) : '') +
        '</div></div>' + chip(u.cat) + '</div></div>';
    });
    $('#tela-potreiros').innerHTML = h + '</div>';
  }

  function tableroRotacion() {
    var hoy = new Date(), perAhora = periodoDe(hoy), pers = datos.periodos;
    var filas = datos.potreiros.slice().sort(function (a, b) { return a.poligono - b.poligono || a.nome.localeCompare(b.nome); });
    var tot = {};
    pers.forEach(function (p) { tot[p] = {}; });
    var h = '<div class="leyenda-rot">' + TIPOS.map(function (t) {
      return '<span><i style="background:' + colorTipo(t) + '"></i>' + esc(nombreTipo(t)) + '</span>';
    }).join('') + '</div><div class="tabla-rot"><table><thead><tr><th class="fija">' + esc(T('potrero')) + '</th>' +
      pers.map(function (p) { return '<th class="' + (p === perAhora ? 'act' : '') + '">' + esc(etiquetaPer(p)) + '</th>'; }).join('') +
      '</tr></thead><tbody>';
    filas.forEach(function (p) {
      h += '<tr data-ficha="' + p.id + '"><th class="fija"><span class="abrir">' + p.poligono + '. ' + esc(p.nome) + ' ›</span><small>' + p.ha + ' ha</small></th>';
      pers.forEach(function (per) {
        var txt = p.rotacao[per] || '', t = clasificar(txt);
        tot[per][t] = (tot[per][t] || 0) + p.ha;
        h += '<td class="' + (per === perAhora ? 'act' : '') + '" style="background:' + colorTipo(t) + '" title="' + esc(txt) + '">' +
          esc(txt || '—') + '</td>';
      });
      h += '</tr>';
    });
    var total = filas.reduce(function (a, p) { return a + p.ha; }, 0);
    h += '</tbody><tfoot><tr><th class="fija">' + esc(T('haEstacion')) + '</th>' + pers.map(function (per) {
      var barras = TIPOS.filter(function (t) { return tot[per][t]; }).map(function (t) {
        return '<i style="background:' + colorTipo(t) + ';width:' + (100 * tot[per][t] / total).toFixed(1) + '%" title="' +
          esc(nombreTipo(t)) + ': ' + Math.round(tot[per][t]) + ' ha"></i>';
      }).join('');
      var sem = ['semente_azevem', 'semente_festuca', 'semente_leguminosa'].reduce(function (a, t) { return a + (tot[per][t] || 0); }, 0);
      return '<td class="' + (per === perAhora ? 'act' : '') + '"><div class="barra-ha">' + barras + '</div><b>' + Math.round(sem) +
        '</b> ' + esc(T('haSemillaCorto')) + '</td>';
    }).join('') + '</tr></tfoot></table></div>';
    return h;
  }

  var fichaCap = 'rotacion';
  function vistaFicha(id) {
    if (id !== fichaActual) fichaCap = 'rotacion';
    fichaActual = id;
    var p = potrero(id); if (!p) return ir('potreiros');
    var hoy = new Date(), u = usoAhora(p, hoy), mesHoy = hoy.getMonth() + 1;
    var h = '<h2>' + p.poligono + '. ' + esc(p.nome) + '</h2><div class="tarjeta"><div class="fila"><div class="crece">' +
      '<div class="mut">' + p.ha + ' ' + T('ha') + '</div><div><b>' + esc(T('usoAhora')) + ':</b> ' + esc(u.uso || '—') +
      (u.colheita ? ' (' + esc(T('colheita')) + ')' : '') + '</div><div><b>' + esc(T('planMes')) + ':</b> ' + esc(u.mes || '—') +
      '</div></div>' + chip(u.cat) + '</div></div>';
    var caps = [['rotacion', T('rotacion')], ['gastos', SJ.T('gastos')], ['costos', SJ.T('costos')], ['visitas', T('historial')]];
    h += '<div class="filtros conm caps">' + caps.map(function (c) {
      return '<button type="button" data-cap="' + c[0] + '" class="' + (fichaCap === c[0] ? 'activo' : '') + '">' + esc(c[1]) + '</button>';
    }).join('') + '</div>';
    if (fichaCap === 'rotacion') h += capRotacion(p, u, mesHoy);
    else if (fichaCap === 'gastos') h += SJ.fichaGastos ? SJ.fichaGastos(p) : '';
    else if (fichaCap === 'costos') h += SJ.fichaCostos ? SJ.fichaCostos(p) : '';
    else h += '<button class="btn" type="button" data-nueva="' + p.id + '">＋ ' + esc(T('nuevaVisita')) + '</button>' +
      listaVisitas(function (v) { return v.potreiro_id === p.id; });
    $('#tela-ficha').innerHTML = h;
  }
  function capRotacion(p, u, mesHoy) {
    var costos = SJ.costoPorPeriodo ? SJ.costoPorPeriodo(p) : {}, vis = {}, pers = datos.periodos;
    todasLasVisitas().forEach(function (x) {
      if (x.v.potreiro_id !== p.id || !x.v.fecha) return;
      var d = new Date(String(x.v.fecha).slice(0, 10) + 'T12:00'); if (isNaN(d)) return;
      var per = periodoDe(d); (vis[per] = vis[per] || []).push(d);
    });
    function act(per) { return per === u.per ? 'act' : ''; }
    var h = '<button class="btn" type="button" data-nueva="' + p.id + '">＋ ' + esc(T('nuevaVisita')) + '</button>';
    h += '<div class="leyenda-rot">' + TIPOS.map(function (t) {
      return '<span><i style="background:' + colorTipo(t) + '"></i>' + esc(nombreTipo(t)) + '</span>';
    }).join('') + '</div>';
    h += '<div class="tabla-rot ficha-rot"><table><thead><tr><th class="fija"></th>' +
      pers.map(function (per) { return '<th class="' + act(per) + '">' + esc(etiquetaPer(per)) + '</th>'; }).join('') + '</tr></thead><tbody>';
    h += '<tr class="cult"><th class="fija">' + esc(T('cultivoF')) + '</th>' + pers.map(function (per) {
      var txt = p.rotacao[per] || '', t = clasificar(txt);
      return '<td class="' + act(per) + '" style="background:' + colorTipo(t) + '">' + esc(txt || '—') + '</td>';
    }).join('') + '</tr>';
    function filaDato(et, fn) {
      return '<tr class="dato"><th class="fija">' + esc(et) + '</th>' + pers.map(function (per) {
        return '<td class="' + act(per) + '">' + fn(per) + '</td>';
      }).join('') + '</tr>';
    }
    h += filaDato(T('costoF'), function (per) { var c = costos[per]; return c ? '<b>' + SJ.dinero(c.usd) + '</b>' : '—'; });
    h += filaDato(T('costoHaF'), function (per) { var c = costos[per]; return c ? SJ.dinero(c.usd / p.ha) : '—'; });
    h += filaDato(SJ.T('gastos'), function (per) { return costos[per] ? costos[per].n : '—'; });
    h += filaDato(T('visitasF'), function (per) {
      var l = (vis[per] || []).sort(function (x, y) { return y - x; });
      if (!l.length) return '—';
      var f = l.slice(0, 3).map(function (d) { return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2); }).join(' · ');
      return '<button type="button" class="link" data-cap="visitas">' + f + (l.length > 3 ? ' +' + (l.length - 3) : '') + '</button>';
    });
    h += '</tbody></table></div>';
    return h + '<button class="btn sec" type="button" data-plan="' + p.id + '">📋 ' + esc(T('verPlan')) + '</button>';
  }
  var planAbierto = 0;
  function vistaPlan(id) {
    planAbierto = Date.now();
    var mesHoy = new Date().getMonth() + 1;
    var nm = cfg.idioma === 'pt' ? ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
      : ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    var filas = datos.potreiros.slice().sort(function (a, b) {
      return (b.id === id) - (a.id === id) || a.poligono - b.poligono || a.nome.localeCompare(b.nome);   // el potrero elegido, primero
    });
    var h = (id ? '<button type="button" class="volver" data-ficha="' + id + '">‹ ' + esc(T('volverFicha')) + '</button>' : '') +
      '<h2>' + esc(T('planMensual')) + '</h2><div class="mut nota">' + esc(T('planNota')) + '</div>';
    h += '<div class="tabla-rot plan-rot"><table><thead><tr><th class="fija">' + esc(T('potrero')) + '</th>';
    for (var m = 1; m <= 12; m++) h += '<th class="' + (m === mesHoy ? 'act' : '') + '">' + nm[m - 1] + '</th>';
    h += '</tr></thead><tbody>';
    filas.forEach(function (p) {
      h += '<tr data-ficha="' + p.id + '" class="' + (p.id === id ? 'elegido' : '') + '" id="plan-' + p.id + '"><th class="fija"><span class="abrir">' +
        p.poligono + '. ' + esc(p.nome) + ' ›</span><small>' + p.ha + ' ha</small></th>';
      for (var m = 1; m <= 12; m++) {
        var txt = p.mensal[m] || '', t = txt ? clasificar(txt) : '';
        h += '<td class="' + (m === mesHoy ? 'act' : '') + (txt ? '' : ' vacia') + '"' + (t && t !== 'outro' ? ' style="background:' + colorTipo(t) + '"' : '') + '>' + esc(txt) + '</td>';
      }
      h += '</tr>';
    });
    h += '</tbody></table></div>';
    $('#tela-plan').innerHTML = h;
  }
  function listaVisitas(filtro) {
    var l = todasLasVisitas().filter(function (x) { return !filtro || filtro(x.v); });
    if (!l.length) return '<div class="vacio">' + esc(T('sinVisitas')) + '</div>';
    return l.map(function (x) {
      var v = x.v, pend = x.local && !v.enviada;
      var resumen = [v.uso, v.fase, v.estado ? T('estados')[Number(v.estado) - 1] : ''].filter(Boolean).join(' · ');
      return '<div class="tarjeta" data-detalle="' + esc(v.id) + '"><div class="fila"><div class="crece"><b>' + esc(v.potreiro) +
        '</b><div class="mut">' + esc(String(v.fecha).replace('T', ' ').slice(0, 16)) + ' · ' + esc(v.usuario) + '</div><div class="mut">' + esc(resumen) +
        '</div></div><span class="estado-sync ' + (pend ? 'pend' : 'ok') + '">' + (pend ? '⬆' : '✓') + '</span></div></div>';
    }).join('');
  }
  function selectorRegistros(actual) {
    return '<div class="filtros conm">' + [['visitas', T('visitas')], ['gastos', SJ.T('gastos')], ['costos', SJ.T('costos')]].map(function (x) {
      return '<button type="button" data-tela="' + x[0] + '" class="' + (actual === x[0] ? 'activo' : '') + '">' + esc(x[1]) + '</button>';
    }).join('') + '</div>';
  }
  function vistaNuevo() {
    $('#tela-nuevo').innerHTML = '<h2>' + esc(T('nuevoQue')) + '</h2>' +
      '<button class="tarjeta opcion" type="button" data-nueva-visita="1"><b>🌱 ' + esc(T('nuevaVisita')) + '</b><span class="mut">' + esc(T('nuevaVisitaDesc')) + '</span></button>' +
      '<button class="tarjeta opcion" type="button" data-tela="gasto"><b>💲 ' + esc(T('nuevoGasto')) + '</b><span class="mut">' + esc(T('nuevoGastoDesc')) + '</span></button>';
  }
  function vistaVisitas() {
    var n = pendientes().length;
    var h = selectorRegistros('visitas');
    if (n) h += '<button class="btn sec" type="button" data-sync="1">⬆ ' + esc(T('sincronizar')) + ' (' + n + ')</button>';
    $('#tela-visitas').innerHTML = h + listaVisitas();
  }

  function vistaDetalle(id) {
    var x = todasLasVisitas().filter(function (y) { return y.v.id === id; })[0];
    if (!x) return ir('visitas');
    var v = x.v, pend = x.local && !v.enviada, niv = T('niveles');
    function fila(et, val) { return (val === '' || val === undefined || val === null) ? '' : '<dt>' + esc(et) + '</dt><dd>' + esc(val) + '</dd>'; }
    function nivel(n, txt) { return [n !== '' && n !== undefined ? niv[Number(n)] : '', txt].filter(Boolean).join(' — '); }
    var h = '<h2>' + esc(v.potreiro) + '</h2><div class="mut">' + esc(String(v.fecha).replace('T', ' ').slice(0, 16)) + ' · ' + esc(v.usuario) +
      ' · <span class="estado-sync ' + (pend ? 'pend' : 'ok') + '">' + esc(pend ? (v.op === 'editar' ? T('editadaPend') : T('pendiente')) : T('enviada')) + '</span></div>';
    h += '<div class="tarjeta"><dl class="det">' +
      fila(T('uso'), v.uso) + fila(T('fase'), v.fase) + fila(T('estado'), v.estado ? T('estados')[Number(v.estado) - 1] : '') +
      fila(T('malezas'), nivel(v.malezas_nivel, v.malezas)) + fila(T('plagas'), nivel(v.plagas_nivel, v.plagas)) +
      fila(T('enfermedades'), nivel(v.enfermedades_nivel, v.enfermedades)) +
      fila(T('categoria'), v.categoria_animal) + fila(T('cabezas'), v.cabezas) + fila(T('alturaEntrada'), v.altura_entrada_cm) +
      fila(T('forraje'), v.forraje_kgms_ha) + fila(T('remanente'), v.remanente_cm) + fila(T('rindeSemilla'), v.semilla_kg_ha) +
      fila(T('cosechaPrev'), v.cosecha_prevista) + fila(T('fertilizacion'), v.rec_fertilizacion) + fila(T('aplicaciones'), v.rec_aplicaciones) +
      fila(T('obs'), v.observaciones) + fila(T('gps'), v.lat ? (Number(v.lat).toFixed(5) + ', ' + Number(v.lon).toFixed(5) + (v.precision_m ? ' ± ' + v.precision_m + ' m' : '')) : '') +
      '</dl></div>';
    var loc = locales.filter(function (y) { return y.id === v.id; })[0];
    var minis = loc && loc.fotos ? loc.fotos.filter(function (f) { return f && f.mini; }) : [];
    var urls = (Array.isArray(v.fotos) && typeof v.fotos[0] === 'string') ? v.fotos : ((loc && loc.fotosUrl) || []);
    if (minis.length) {
      h += '<div class="fotos" id="det-fotos"></div>';
    }
    if (urls.length) h += '<div class="tarjeta">' + urls.map(function (u, i) {
      return '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(T('verFoto')) + ' ' + (i + 1) + '</a>';
    }).join(' · ') + '</div>';
    h += '<button class="btn" type="button" data-compartir="' + esc(v.id) + '">' + esc(T('compartir')) + '</button>' +
      '<button class="btn sec" type="button" data-editar="' + esc(v.id) + '">' + esc(T('editar')) + '</button>' +
      '<button class="btn peligro" type="button" data-borrar="' + esc(v.id) + '">' + esc(T('borrar')) + '</button>';
    $('#tela-detalle').innerHTML = h;
    if (minis.length) {
      var cont = $('#det-fotos');
      minis.forEach(function (f) {
        var d = document.createElement('div'), img = document.createElement('img');
        img.src = URL.createObjectURL(f.mini); d.appendChild(img); cont.appendChild(d);
      });
    }
  }

  // ---------------------------------------------------------------- formulario de visita
  function nuevoBorrador(potId) {
    return { id: uid(), fecha: ahoraLocal(), usuario: cfg.usuario, potreiro_id: potId || '', potreiro: '',
      lat: '', lon: '', precision_m: '', uso: '', fase: '', estado: '', malezas_nivel: '', malezas: '',
      plagas_nivel: '', plagas: '', enfermedades_nivel: '', enfermedades: '', categoria_animal: '', cabezas: '',
      altura_entrada_cm: '', forraje_kgms_ha: '', remanente_cm: '', semilla_kg_ha: '', cosecha_prevista: '',
      rec_fertilizacion: '', rec_aplicaciones: '', observaciones: '', fotos: [] };
  }
  function vistaVisita(arg) {
    if (!borrador || (arg && arg.nueva)) {
      borrador = nuevoBorrador(arg && arg.potrero);
      if (!borrador.potreiro_id && gpsPos) {
        var n = poligonoEn(gpsPos.lat, gpsPos.lon), pots = n !== null ? potrerosDePoligono(n) : [];
        if (pots.length === 1) borrador.potreiro_id = pots[0].id;
      }
      if (gpsPos) { borrador.lat = gpsPos.lat; borrador.lon = gpsPos.lon; borrador.precision_m = gpsPos.prec; }
      prellenar();
    } else if (arg && arg.potrero && arg.potrero !== borrador.potreiro_id) {
      borrador.potreiro_id = arg.potrero; borrador.uso = ''; prellenar();
    }
    dibujarFormulario();
  }
  function prellenar() {
    var p = potrero(borrador.potreiro_id);
    if (!p) return;
    borrador.potreiro = p.nome;
    if (!borrador.uso) {
      var u = usoAhora(p);
      borrador.uso = u.uso + (u.colheita ? ' (' + T('colheita') + ')' : '');
    }
  }
  function guardarBorrador() { kvSet('borrador', borrador); }

  function dibujarFormulario() {
    var b = borrador, p = potrero(b.potreiro_id), u = p ? usoAhora(p) : null;
    var mes = new Date().getMonth() + 1;
    var esSemilla = u && u.cat === 'semente';
    var opts = '<option value="">' + esc(T('elegir')) + '</option>' + datos.potreiros.slice().sort(function (a, c) { return a.poligono - c.poligono; })
      .map(function (q) { return '<option value="' + q.id + '"' + (q.id === b.potreiro_id ? ' selected' : '') + '>' + q.poligono + '. ' + esc(q.nome) + '</option>'; }).join('');
    function txt(k, et, tipo, extra) {
      return '<label class="campo">' + esc(et) + '</label><input type="' + (tipo || 'text') + '" data-k="' + k + '" value="' + esc(b[k]) + '"' + (extra || '') + '>';
    }
    function area(k, et) { return '<label class="campo">' + esc(et) + '</label><textarea data-k="' + k + '">' + esc(b[k]) + '</textarea>'; }
    function niveles(k) {
      return '<div class="niveles">' + T('niveles').map(function (n, i) {
        return '<button type="button" data-nivel="' + k + '" data-v="' + i + '" class="' + (String(b[k]) === String(i) ? 'sel' : '') + '">' + esc(n) + '</button>';
      }).join('') + '</div>';
    }
    var num = ' inputmode="decimal"';
    var h = '<h2>' + esc(b.editando ? T('editarVisita') : T('nuevaVisita')) + '</h2><div class="grupo">' +
      '<label class="campo">' + esc(T('potrero')) + '</label><select data-k="potreiro_id">' + opts + '</select>' +
      (u ? '<div class="mut" style="margin-top:6px">' + p.ha + ' ' + T('ha') + ' · ' + esc(T('planMes')) + ': ' + esc(u.mes || '—') + ' ' + chip(u.cat) + '</div>' : '') +
      txt('fecha', T('fecha'), 'datetime-local') +
      '<label class="campo">' + esc(T('gps')) + '</label><div class="fila"><div class="gps crece">' +
      (b.lat ? Number(b.lat).toFixed(5) + ', ' + Number(b.lon).toFixed(5) + ' ± ' + b.precision_m + ' m' : esc(T('gpsNo'))) +
      '</div><button type="button" class="btn chico sec" data-gps="1">📍 ' + esc(T('gpsActualizar')) + '</button></div></div>';
    h += '<div class="grupo"><h3>' + esc(T('uso')) + '</h3><input type="text" data-k="uso" value="' + esc(b.uso) + '">' +
      '<label class="campo">' + esc(T('fase')) + '</label><select data-k="fase"><option value=""></option>' +
      T('fases').map(function (f) { return '<option' + (f === b.fase ? ' selected' : '') + '>' + esc(f) + '</option>'; }).join('') + '</select>' +
      '<label class="campo">' + esc(T('estado')) + '</label><div class="estados">' + T('estados').map(function (e, i) {
        return '<button type="button" data-estado="' + (i + 1) + '" class="' + (String(b.estado) === String(i + 1) ? 'sel' : '') + '">' + esc(e) + '</button>';
      }).join('') + '</div></div>';
    h += '<div class="grupo"><h3>' + esc(T('malezas')) + '</h3>' + niveles('malezas_nivel') + '<input type="text" data-k="malezas" placeholder="' + esc(T('cuales')) + '" value="' + esc(b.malezas) + '" style="margin-top:6px">' +
      '<h3>' + esc(T('plagas')) + '</h3>' + niveles('plagas_nivel') + '<input type="text" data-k="plagas" placeholder="' + esc(T('cuales')) + '" value="' + esc(b.plagas) + '" style="margin-top:6px">' +
      '<h3>' + esc(T('enfermedades')) + '</h3>' + niveles('enfermedades_nivel') + '<input type="text" data-k="enfermedades" placeholder="' + esc(T('cuales')) + '" value="' + esc(b.enfermedades) + '" style="margin-top:6px"></div>';
    h += '<div class="grupo"><h3>' + esc(T('pastoreo')) + '</h3><div class="dos"><div>' + txt('categoria_animal', T('categoria')) + '</div><div>' +
      txt('cabezas', T('cabezas'), 'number', num) + '</div></div><div class="dos"><div>' + txt('altura_entrada_cm', T('alturaEntrada'), 'number', num) + '</div><div>' +
      txt('remanente_cm', T('remanente'), 'number', num) + '</div></div>' + txt('forraje_kgms_ha', T('forraje'), 'number', num) + '</div>';
    if (esSemilla) {
      h += '<div class="grupo"><h3>🌾 ' + esc(T('semilla')) + '</h3><div class="dos"><div>' + txt('semilla_kg_ha', T('rindeSemilla'), 'number', num) +
        '</div><div>' + txt('cosecha_prevista', T('cosechaPrev'), 'date') + '</div></div></div>';
    }
    var sug = u ? sugerencias(u.tipo, mes) : [];
    h += '<div class="grupo"><h3>' + esc(T('recomendaciones')) + '</h3>' +
      (sug.length ? '<div class="mut">' + esc(T('sugerencias')) + '</div><div class="sugs">' + sug.map(function (s) {
        return '<button type="button" data-sug="' + esc(s) + '">＋ ' + esc(s) + '</button>';
      }).join('') + '</div>' : '') +
      area('rec_fertilizacion', T('fertilizacion')) + area('rec_aplicaciones', T('aplicaciones')) + '</div>';
    var previas = b.op === 'editar' ? (b.fotosUrl || []) : [];
    h += '<div class="grupo"><h3>' + esc(T('fotos')) + '</h3>' +
      (previas.length ? '<div class="mut">' + esc(T('fotosEnviadas')) + '</div><div class="previas">' + previas.map(function (u, i) {
        return '<span><a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(T('verFoto')) + ' ' + (i + 1) + '</a>' +
          '<button type="button" data-quitar-previa="' + i + '">×</button></span>';
      }).join('') + '</div>' : '') +
      '<label class="btn sec" style="text-align:center">📷 ' + esc(T('agregarFoto')) +
      '<input type="file" accept="image/*" multiple data-fotos="1" style="display:none"></label><div class="fotos" id="form-fotos"></div></div>';
    h += '<div class="grupo">' + area('observaciones', T('obs')) + '</div>' +
      '<button class="btn" type="button" data-guardar="1">✓ ' + esc(b.editando ? T('guardarCambios') : T('guardar')) + '</button>' +
      '<button class="btn sec" type="button" data-cancelar="1">' + esc(T('cancelar')) + '</button>';
    var s = $('#tela-visita'); s.innerHTML = h;
    pintarFotosForm();
  }
  function pintarFotosForm() {
    var c = $('#form-fotos'); if (!c) return;
    c.innerHTML = '';
    borrador.fotos.forEach(function (f, i) {
      var d = document.createElement('div'), img = document.createElement('img'), x = document.createElement('button');
      img.src = URL.createObjectURL(f.mini); x.textContent = '×'; x.type = 'button'; x.dataset.quitarFoto = i;
      d.appendChild(img); d.appendChild(x); c.appendChild(d);
    });
  }
  function achicar(file, lado, calidad) {
    var cargar = window.createImageBitmap ? createImageBitmap(file) : new Promise(function (ok, mal) {
      var im = new Image(); im.onload = function () { ok(im); }; im.onerror = mal; im.src = URL.createObjectURL(file);
    });
    return cargar.then(function (im) {
      var w = im.width, h = im.height, k = Math.min(1, lado / Math.max(w, h));
      var cv = document.createElement('canvas'); cv.width = Math.round(w * k); cv.height = Math.round(h * k);
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
      return new Promise(function (ok) { cv.toBlob(ok, 'image/jpeg', calidad); });
    });
  }
  function agregarFotos(files) {
    var arr = Array.prototype.slice.call(files);
    return arr.reduce(function (pr, f) {
      return pr.then(function () {
        return Promise.all([achicar(f, 1600, 0.72), achicar(f, 320, 0.6)]).then(function (r) {
          borrador.fotos.push({ grande: r[0], mini: r[1] });
        });
      });
    }, Promise.resolve()).then(function () { pintarFotosForm(); guardarBorrador(); });
  }
  function tomarGps() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(function (p) {
      gpsPos = { lat: p.coords.latitude, lon: p.coords.longitude, prec: Math.round(p.coords.accuracy) };
      borrador.lat = gpsPos.lat; borrador.lon = gpsPos.lon; borrador.precision_m = gpsPos.prec;
      if (!borrador.potreiro_id) {
        var n = poligonoEn(gpsPos.lat, gpsPos.lon), pots = n !== null ? potrerosDePoligono(n) : [];
        if (pots.length === 1) { borrador.potreiro_id = pots[0].id; prellenar(); }
      }
      guardarBorrador(); dibujarFormulario();
    }, function (e) { aviso(T('gpsNo') + ': ' + e.message); }, { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 });
  }
  function guardarVisita() {
    if (!borrador.potreiro_id) { aviso(T('faltaPotrero')); return; }
    if (!cfg.usuario) { aviso(T('usuario') + '?'); ir('config'); return; }
    var editando = !!borrador.editando;
    if (!editando || !borrador.usuario) borrador.usuario = cfg.usuario || '?';
    borrador.enviada = false;
    var v = borrador;
    delete v.editando;
    visitaPut(v).then(function () {
      borrador = null; kvSet('borrador', null);
      return recargarLocales();
    }).then(function () {
      aviso(T(editando ? 'cambiosOk' : 'guardada'));
      if (editando) ir('detalle', v.id); else ir('ficha', v.potreiro_id);
      sincronizar(false);
    });
  }

  // ---------------------------------------------------------------- editar, borrar y compartir
  function visitaParaEditar(id) {
    var loc = locales.filter(function (y) { return y.id === id; })[0];
    var x = todasLasVisitas().filter(function (y) { return y.v.id === id; })[0];
    if (!x) return null;
    var nuncaEnviada = loc && !loc.enviada && loc.op !== 'editar';
    var b = nuevoBorrador(x.v.potreiro_id);
    CAMPOS.forEach(function (c) { if (x.v[c] !== undefined && x.v[c] !== null) b[c] = x.v[c]; });
    b.fecha = String(b.fecha || '').replace(' ', 'T').slice(0, 16);
    if (nuncaEnviada) { b.fotos = (loc.fotos || []).slice(); }
    else {
      b.op = 'editar';
      b.fotos = (loc && !loc.enviada && loc.fotos) ? loc.fotos.filter(function (f) { return f.grande; }) : [];
      b.fotosUrl = (Array.isArray(x.v.fotos) && typeof x.v.fotos[0] === 'string') ? x.v.fotos.slice() : ((loc && loc.fotosUrl) || []).slice();
    }
    b.editando = true;
    return b;
  }
  function editarVisita(id) {
    var b = visitaParaEditar(id);
    if (!b) return;
    borrador = b; guardarBorrador();
    ir('visita');
  }
  function borrarVisita(id) {
    var loc = locales.filter(function (y) { return y.id === id; })[0];
    var nuncaEnviada = loc && !loc.enviada && loc.op !== 'editar';
    if (!confirm(T(nuncaEnviada ? 'confirmarBorrar' : 'confirmarBorrarEnv'))) return;
    var x = todasLasVisitas().filter(function (y) { return y.v.id === id; })[0] || { v: {} };
    var pr = nuncaEnviada ? visitaDel(id) :
      visitaPut({ id: id, op: 'borrar', enviada: false, fecha: x.v.fecha || '', potreiro: x.v.potreiro || '', potreiro_id: x.v.potreiro_id || '' });
    if (borrador && borrador.id === id) { borrador = null; kvSet('borrador', null); }
    pr.then(recargarLocales).then(function () {
      aviso(T('borradaOk'));
      ir('visitas');
      if (!nuncaEnviada) sincronizar(false);
    });
  }

  // PDF de una visita (una imagen JPEG en una página), armado en el teléfono, sin internet.
  function pdfDeJpeg(jpeg, anchoPx, altoPx) {
    var w = 595, h = Math.round(595 * altoPx / anchoPx);
    var enc = new TextEncoder(), partes = [], offs = [], largo = 0;
    function add(x) { var b = typeof x === 'string' ? enc.encode(x) : x; partes.push(b); largo += b.length; }
    function obj(n, cuerpo) { offs[n] = largo; add(n + ' 0 obj\n'); cuerpo(); add('\nendobj\n'); }
    var cont = 'q ' + w + ' 0 0 ' + h + ' 0 0 cm /Im0 Do Q';
    add('%PDF-1.4\n');
    obj(1, function () { add('<< /Type /Catalog /Pages 2 0 R >>'); });
    obj(2, function () { add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'); });
    obj(3, function () { add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + w + ' ' + h + '] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>'); });
    obj(4, function () {
      add('<< /Type /XObject /Subtype /Image /Width ' + anchoPx + ' /Height ' + altoPx +
        ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpeg.length + ' >>\nstream\n');
      add(jpeg); add('\nendstream');
    });
    obj(5, function () { add('<< /Length ' + cont.length + ' >>\nstream\n' + cont + '\nendstream'); });
    var xref = largo;
    var tabla = 'xref\n0 6\n0000000000 65535 f \n';
    for (var i = 1; i <= 5; i++) tabla += String(offs[i]).padStart(10, '0') + ' 00000 n \n';
    add(tabla + 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF');
    return new Blob(partes, { type: 'application/pdf' });
  }
  function cargarImagen(src) {
    return new Promise(function (ok) {
      var im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { ok(null); }; im.src = src;
    });
  }
  function filasVisita(v) {
    var niv = T('niveles');
    function nivel(n, txt) { return [n !== '' && n !== undefined && n !== null ? niv[Number(n)] : '', txt].filter(Boolean).join(' — '); }
    return [
      [T('uso'), v.uso], [T('fase'), v.fase], [T('estado'), v.estado ? T('estados')[Number(v.estado) - 1] : ''],
      [T('malezas'), nivel(v.malezas_nivel, v.malezas)], [T('plagas'), nivel(v.plagas_nivel, v.plagas)],
      [T('enfermedades'), nivel(v.enfermedades_nivel, v.enfermedades)],
      [T('categoria'), v.categoria_animal], [T('cabezas'), v.cabezas], [T('alturaEntrada'), v.altura_entrada_cm],
      [T('forraje'), v.forraje_kgms_ha], [T('remanente'), v.remanente_cm], [T('rindeSemilla'), v.semilla_kg_ha],
      [T('cosechaPrev'), v.cosecha_prevista], [T('fertilizacion'), v.rec_fertilizacion], [T('aplicaciones'), v.rec_aplicaciones],
      [T('obs'), v.observaciones],
      [T('gps'), v.lat ? Number(v.lat).toFixed(5) + ', ' + Number(v.lon).toFixed(5) + (v.precision_m ? ' ± ' + v.precision_m + ' m' : '') : '']
    ].filter(function (f) { return f[1] !== '' && f[1] !== undefined && f[1] !== null; });
  }
  function hacerPdfVisita(v) {
    var loc = locales.filter(function (y) { return y.id === v.id; })[0];
    var blobs = loc && loc.fotos ? loc.fotos.map(function (f) { return f && (f.grande || f.mini); }).filter(Boolean) : [];
    var urls = (Array.isArray(v.fotos) && typeof v.fotos[0] === 'string') ? v.fotos : ((loc && loc.fotosUrl) || []);
    return Promise.all([cargarImagen('logo-barra.png')].concat(blobs.map(function (b) {
      return window.createImageBitmap ? createImageBitmap(b).catch(function () { return null; }) : cargarImagen(URL.createObjectURL(b));
    }))).then(function (imgs) {
      var logo = imgs[0], fotos = imgs.slice(1).filter(Boolean);
      var W = 1240, M = 70, cv = document.createElement('canvas');
      cv.width = W; cv.height = 7000;
      var c = cv.getContext('2d'), AZUL = '#0b3d91', DORADO = '#e0a52a', TINTA = '#1f2a37', GRIS = '#5b6573';
      c.fillStyle = '#fff'; c.fillRect(0, 0, W, cv.height);
      c.fillStyle = AZUL; c.fillRect(0, 0, W, 150);
      c.fillStyle = DORADO; c.fillRect(0, 150, W, 8);
      if (logo) c.drawImage(logo, M, 43, 290, 64);
      c.fillStyle = '#fff'; c.textAlign = 'right'; c.font = '600 34px Poppins, sans-serif';
      c.fillText('Estância São José · ' + T('visitaCampo'), W - M, 88);
      c.textAlign = 'left';
      var y = 240;
      c.fillStyle = AZUL; c.font = '700 54px Poppins, sans-serif'; c.fillText(String(v.potreiro || ''), M, y);
      y += 52; c.fillStyle = GRIS; c.font = '30px Nunito, sans-serif';
      c.fillText(String(v.fecha || '').replace('T', ' ').slice(0, 16) + ' · ' + (v.usuario || ''), M, y);
      y += 40;
      function partir(txt, ancho) {
        var out = [];
        String(txt).split('\n').forEach(function (par) {
          var linea = '';
          par.split(' ').forEach(function (p) {
            var prueba = linea ? linea + ' ' + p : p;
            if (c.measureText(prueba).width > ancho && linea) { out.push(linea); linea = p; } else linea = prueba;
          });
          out.push(linea);
        });
        return out;
      }
      var colEt = 380;
      filasVisita(v).forEach(function (f) {
        c.font = '30px Nunito, sans-serif';
        var lineas = partir(f[1], W - 2 * M - colEt - 20);
        var alto = Math.max(1, lineas.length) * 40 + 24;
        c.strokeStyle = '#e3e7ee'; c.lineWidth = 2; c.beginPath(); c.moveTo(M, y); c.lineTo(W - M, y); c.stroke();
        c.fillStyle = GRIS; c.font = '600 26px Poppins, sans-serif';
        partir(f[0], colEt - 20).forEach(function (l, i) { c.fillText(l, M, y + 40 + i * 34); });
        c.fillStyle = TINTA; c.font = '30px Nunito, sans-serif';
        lineas.forEach(function (l, i) { c.fillText(l, M + colEt, y + 40 + i * 40); });
        y += alto;
      });
      y += 30;
      if (fotos.length) {
        var anchoF = (W - 2 * M - 30) / 2, x = M, altoFila = 0;
        fotos.forEach(function (im, i) {
          var hF = Math.round(anchoF * im.height / im.width);
          if (i % 2 === 0 && i) { y += altoFila + 30; altoFila = 0; x = M; }
          c.drawImage(im, x, y, anchoF, hF);
          altoFila = Math.max(altoFila, hF); x += anchoF + 30;
        });
        y += altoFila + 30;
      } else if (urls.length) {
        c.fillStyle = AZUL; c.font = '600 26px Poppins, sans-serif'; c.fillText(T('fotosDrive') + ':', M, y + 30); y += 50;
        c.font = '22px Nunito, sans-serif';
        urls.forEach(function (u) { c.fillText(u, M, y + 20); y += 34; });
        y += 20;
      }
      c.fillStyle = GRIS; c.font = '22px Nunito, sans-serif';
      c.fillText('Pastos del Sur', M, y + 30);
      y += 60;
      var alto = Math.min(Math.max(y, 1754), cv.height);
      var fin = document.createElement('canvas'); fin.width = W; fin.height = alto;
      fin.getContext('2d').drawImage(cv, 0, 0);
      return new Promise(function (ok) { fin.toBlob(ok, 'image/jpeg', 0.85); }).then(function (jb) {
        return jb.arrayBuffer().then(function (ab) { return pdfDeJpeg(new Uint8Array(ab), W, alto); });
      });
    });
  }
  function compartirVisita(id) {
    var x = todasLasVisitas().filter(function (y) { return y.v.id === id; })[0];
    if (!x) return;
    var v = x.v;
    aviso(T('armandoPdf'));
    var nombre = ('Visita ' + String(v.fecha || '').slice(0, 10) + ' ' + (v.potreiro || '')).replace(/[\\/:*?"<>|]/g, '-').trim() + '.pdf';
    var texto = T('visitaCampo') + ' — ' + (v.potreiro || '') + ' — ' + String(v.fecha || '').replace('T', ' ').slice(0, 16) + ' — ' + (v.usuario || '');
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(function () {
      return hacerPdfVisita(v);
    }).then(function (blob) {
      var file = new File([blob], nombre, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        return navigator.share({ files: [file], title: nombre, text: texto }).catch(function (e) {
          if (e && e.name !== 'AbortError') aviso(e.message);
        });
      }
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre;
      document.body.appendChild(a); a.click(); a.remove();
      aviso(T('pdfBajado'));
    }).catch(function (e) { aviso(String(e && e.message || e)); });
  }

  // ---------------------------------------------------------------- ajustes
  function vistaConfig() {
    var otro = cfg.usuario && USUARIOS.indexOf(cfg.usuario) < 0;
    var n = pendientes().length;
    kvGet('ultimaSync').then(function (us) {
      var h = '<h2>' + esc(T('config')) + '</h2>' + (datos ? '' : '<div class="tarjeta" style="border:2px solid var(--dorado)">' + esc(T('sinDatos')) + '</div>') +
        '<div class="grupo"><label class="campo">' + esc(T('usuario')) + '</label><select id="c-usuario">' +
        USUARIOS.map(function (u) { return '<option' + (u === cfg.usuario ? ' selected' : '') + '>' + esc(u) + '</option>'; }).join('') +
        '<option value="__otro"' + (otro ? ' selected' : '') + '>' + esc(T('otro')) + '…</option></select>' +
        '<input type="text" id="c-otro" placeholder="' + esc(T('otro')) + '" value="' + esc(otro ? cfg.usuario : '') + '" style="margin-top:6px' + (otro ? '' : ';display:none') + '">' +
        '<label class="campo">' + esc(T('idioma')) + '</label><select id="c-idioma"><option value="es"' + (cfg.idioma === 'es' ? ' selected' : '') + '>Español</option><option value="pt"' + (cfg.idioma === 'pt' ? ' selected' : '') + '>Português</option></select>' +
        '<label class="campo">' + esc(T('servidor')) + '</label><input type="url" id="c-url" value="' + esc(cfg.url) + '" placeholder="https://script.google.com/macros/s/…/exec">' +
        '<label class="campo">' + esc(T('clave')) + '</label><input type="password" id="c-clave" value="' + esc(cfg.clave) + '">' +
        '<button class="btn" type="button" id="c-guardar">' + esc(T('guardarAjustes')) + '</button></div>' +
        '<div class="grupo"><h3>' + esc(T('datosCampo')) + '</h3><div class="mut">' + esc(datos ? datos.versao + ' · ' + datos.potreiros.length + ' potreiros' : '—') + '</div>' +
        '<button class="btn sec" type="button" id="c-datos">⬇ ' + esc(T('bajarDatos')) + '</button>' +
        '<button class="btn sec" type="button" data-sync="1">⟳ ' + esc(T('sincronizar')) + (n ? ' (' + n + ' ' + esc(T('nPend')) + ')' : '') + '</button>' +
        '<div class="mut">' + esc(T('ultimaSync')) + ': ' + esc(us ? us.replace('T', ' ').slice(0, 16) + ' UTC' : T('nunca')) + '</div>' +
        '<button class="btn sec" type="button" id="c-respaldo">' + esc(T('respaldo')) + '</button>' +
        '<div class="mut">' + esc(T('version')) + ': ' + VERSION + '</div></div>';
      $('#tela-config').innerHTML = h;
      $('#c-usuario').onchange = function () { $('#c-otro').style.display = this.value === '__otro' ? '' : 'none'; };
      $('#c-guardar').onclick = function () {
        var u = $('#c-usuario').value;
        cfg.usuario = u === '__otro' ? $('#c-otro').value.trim() : u;
        cfg.idioma = $('#c-idioma').value;
        cfg.url = $('#c-url').value.trim();
        cfg.clave = $('#c-clave').value.trim();
        kvSet('cfg', cfg).then(function () {
          textos(); aviso(T('ajustesOk'));
          if (mapa) { leyenda(); lineaTiempo(); }
          if (!datos && cfg.url) bajarDatos(); else vistaConfig();
        });
      };
      $('#c-datos').onclick = function () { bajarDatos(); };
      $('#c-respaldo').onclick = exportar;
    });
  }
  function exportar() {
    var l = locales.filter(function (v) { return v.op !== 'borrar'; }).map(function (v) { var o = {}; CAMPOS.forEach(function (c) { o[c] = v[c]; }); o.enviada = !!v.enviada; return o; });
    var blob = new Blob([JSON.stringify({ exportado: new Date().toISOString(), visitas: l }, null, 1)], { type: 'application/json' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'visitas-sao-jose-' + new Date().toISOString().slice(0, 10) + '.json'; a.click();
  }

  // ---------------------------------------------------------------- eventos
  document.addEventListener('click', function (e) {
    var t = e.target.closest('button, [data-ficha], [data-detalle]');
    if (!t) return;
    var d = t.dataset;
    if (d.tela) {
      if (d.tela === 'nueva') ir(borrador ? 'visita' : 'nuevo');
      else ir(d.tela);
    } else if (d.nuevaVisita) ir('visita', { nueva: true });
    else if (d.ficha) { if (telaActual === 'plan' && Date.now() - planAbierto < 600) return; ir('ficha', d.ficha); }
    else if (d.pot) { mapa.closePopup(); ir('ficha', d.pot); }
    else if (d.nueva) ir('visita', borrador && borrador.potreiro_id === d.nueva ? null : { nueva: true, potrero: d.nueva });
    else if (d.detalle) ir('detalle', d.detalle);
    else if (d.plan) ir('plan', d.plan);
    else if (d.cap) { fichaCap = d.cap; vistaFicha(fichaActual); }
    else if (d.filtro) { filtroPot = d.filtro; vistaPotreros(); }
    else if (d.modo) { modoPot = d.modo; vistaPotreros(); }
    else if (d.sync) sincronizar(true);
    else if (d.nivel) { borrador[d.nivel] = Number(d.v); guardarBorrador(); dibujarFormulario(); }
    else if (d.estado) { borrador.estado = Number(d.estado); guardarBorrador(); dibujarFormulario(); }
    else if (d.gps) tomarGps();
    else if (d.sug) {
      var campo = /N |N\)|P y K|P e K|adub|fertil|nitr/i.test(d.sug) ? 'rec_fertilizacion' : 'rec_aplicaciones';
      borrador[campo] = (borrador[campo] ? borrador[campo] + '\n' : '') + d.sug;
      guardarBorrador(); dibujarFormulario();
    } else if (d.quitarFoto !== undefined) { borrador.fotos.splice(Number(d.quitarFoto), 1); guardarBorrador(); pintarFotosForm(); }
    else if (d.quitarPrevia !== undefined) { borrador.fotosUrl.splice(Number(d.quitarPrevia), 1); guardarBorrador(); dibujarFormulario(); }
    else if (d.guardar) guardarVisita();
    else if (d.cancelar) {
      var eraEdicion = borrador && borrador.editando ? borrador.id : null;
      borrador = null; kvSet('borrador', null);
      if (eraEdicion) ir('detalle', eraEdicion); else ir('mapa');
    }
    else if (d.borrar) borrarVisita(d.borrar);
    else if (d.editar) editarVisita(d.editar);
    else if (d.compartir) compartirVisita(d.compartir);
  });
  $('#btn-sync').addEventListener('click', function () { sincronizar(true); });
  document.addEventListener('input', function (e) {
    var k = e.target.dataset && e.target.dataset.k;
    if (!k || !borrador) return;
    borrador[k] = e.target.value;
    if (k === 'potreiro_id') { borrador.uso = ''; prellenar(); dibujarFormulario(); }
    guardarBorrador();
  });
  document.addEventListener('change', function (e) {
    if (e.target.dataset && e.target.dataset.fotos && e.target.files.length) agregarFotos(e.target.files);
  });
  window.addEventListener('online', function () { sincronizar(false); });

  // ---------------------------------------------------------------- API para módulos
  SJ.esc = esc; SJ.$ = $; SJ.aviso = aviso; SJ.uid = uid; SJ.ahoraLocal = ahoraLocal;
  SJ.kvGet = kvGet; SJ.kvSet = kvSet; SJ.tx = tx; SJ.fetchT = fetchT; SJ.blobB64 = blobB64; SJ.achicar = achicar;
  SJ.cfg = function () { return cfg; }; SJ.datos = function () { return datos; };
  SJ.potrero = potrero; SJ.periodoDe = periodoDe; SJ.invernoSiguiente = invernoSiguiente; SJ.usoAhora = usoAhora; SJ.clasificar = clasificar;
  SJ.categoria = categoria; SJ.colorTipo = colorTipo; SJ.nombreTipo = nombreTipo; SJ.etiquetaPer = etiquetaPer;
  SJ.ir = ir; SJ.pill = pill; SJ.sincronizar = sincronizar; SJ.selectorRegistros = selectorRegistros;
  SJ.idioma = function () { return cfg.idioma; };
  SJ.visitas = function () { return todasLasVisitas().map(function (x) { return x.v; }); };

  // ---------------------------------------------------------------- arranque
  function arrancar() {
    Promise.all([kvGet('cfg'), kvGet('datos'), kvGet('remotas'), kvGet('borrador')]).then(function (r) {
      if (r[0]) cfg = Object.assign(cfg, r[0]);
      datos = r[1] || null; remotas = r[2] || []; borrador = r[3] || null;
      if (!cfg.idioma) cfg.idioma = /^pt/.test(navigator.language) ? 'pt' : 'es';
      if (datos) return null;
      // Copia local de los datos (solo en la compu de desarrollo; no se publica).
      return fetch('datos/campo-sao-jose.json').then(function (x) { return x.ok ? x.json() : null; })
        .then(function (j) { if (j) { datos = j; return kvSet('datos', j); } }).catch(function () {});
    }).then(recargarLocales).then(function () {
      return Promise.all((SJ.alArrancar || []).map(function (f) { return f(); }));
    }).then(function () {
      textos();
      if (datos) armarMapa();
      ir(datos && cfg.usuario ? 'mapa' : 'config');
      if (cfg.url) sincronizar(false);
    });
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      // Cuando se instala una versión nueva de la app, se recarga una vez sola.
      var habia = !!navigator.serviceWorker.controller, recargada = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (habia && !recargada) { recargada = true; location.reload(); }
      });
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (r) { r.update(); }).catch(function () {});
    }
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  }
  SJ.listo = arrancar;
})();
