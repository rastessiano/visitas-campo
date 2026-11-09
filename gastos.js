/* Gastos y tareas con su costo — módulo de la app de visitas (Estância São José).
 * Cada gasto: qué se hizo o compró, en qué potreros, para qué zafra y cultivo, cuánto costó
 * (en USD o R$, con tipo de cambio para tener las dos monedas) y quién lo pagó.
 * Pensado para pasar a contabilidad: id fijo, centro de costo y cuenta contable.
 * Funciona sin señal; se manda al servidor al sincronizar. */
(function () {
  'use strict';
  var SJ = window.SJ, esc = SJ.esc, $ = SJ.$;

  SJ.textos.es = Object.assign(SJ.textos.es, {
    gastos: 'Gastos', costos: 'Costos', nuevoGastoT: 'Nuevo gasto o tarea', fechaG: 'Fecha',
    potrerosG: 'Potreros', general: 'General (todo el campo)', haG: 'Hectáreas', zafra: 'Zafra / estación',
    cultivoG: 'Cultivo', actividad: 'Actividad', producto: 'Producto o labor', nuevoProducto: '+ Nuevo producto o labor',
    nombre: 'Nombre', tipo: 'Tipo', insumo: 'Insumo', labor: 'Labor', servicio: 'Servicio',
    unidad: 'Unidad', dosis: 'Dosis por ha', cantidad: 'Cantidad total', precio: 'Precio unitario',
    moneda: 'Moneda', tc: 'Tipo de cambio (R$ por US$)', total: 'Total', pagador: 'Pagó',
    proveedor: 'Proveedor', cuenta: 'Cuenta contable (opcional)', comprobante: 'Foto del comprobante',
    obsG: 'Observaciones', guardarG: 'Guardar gasto', gastoGuardado: 'Gasto guardado en el teléfono.',
    faltaTotal: 'Falta el total (cantidad × precio o el total directo).', faltaItem: 'Elegí o creá el producto o labor.',
    sinGastos: 'Todavía no hay gastos.', exportarCsv: 'Exportar CSV para contabilidad', todasZafras: 'Todas',
    porPotrero: 'Por potrero', porActividad: 'Por actividad', porPagador: 'Por quién pagó', porHa: '/ha',
    costoPotrero: 'Costos', sinTc: 'sin tipo de cambio', porZafra: 'Por campaña', sinZafra: 'Sin campaña',
    parteDe: 'Compartido con otros potreros: le toca el', notaReparto: 'Los gastos de varios potreros se reparten por hectáreas.', equivalente: 'equivale a',
    pendienteG: 'Pendiente de enviar', enviadoG: 'Enviado', borrarG: '🗑 Borrar este gasto',
    confirmarBorrarG: '¿Borrar este gasto? Todavía no se envió.', verComprobante: 'Ver comprobante',
    confirmarBorrarGEnv: '¿Borrar este gasto? También se borra de la planilla (queda una copia en la hoja «Gastos borrados»).',
    editarG: '✏️ Editar este gasto', editarGastoT: 'Editar gasto', guardarCambiosG: 'Guardar cambios', editadoPendG: 'Editado, sin enviar',
    cambiosOkG: 'Cambios guardados.', borradoOkG: 'Gasto borrado.', informeGasto: 'Gasto', comprobanteEnviado: 'Comprobante ya enviado',
    precioRef: 'Precio de referencia (hoja Productos)', precioUltimo: 'Último precio usado', tcPtax: 'Dólar PTAX del Banco Central do Brasil (venta) del',
    tcBuscando: 'Buscando el dólar del Banco Central do Brasil…', tcSinRed: 'Sin conexión: tipo de cambio del último gasto. Se puede corregir.',
    actividades: { siembra: 'Siembra', fertilizacion: 'Fertilización', aplicacion: 'Aplicación (herbicida, insecticida, fungicida)',
      cosecha: 'Cosecha', laboreo: 'Preparación de suelo', flete: 'Flete', mano_obra: 'Mano de obra',
      mantenimiento: 'Mantenimiento', compra: 'Compra de insumos', otro: 'Otro' }
  });
  SJ.textos.pt = Object.assign(SJ.textos.pt, {
    gastos: 'Gastos', costos: 'Custos', nuevoGastoT: 'Novo gasto ou tarefa', fechaG: 'Data',
    potrerosG: 'Potreiros', general: 'Geral (todo o campo)', haG: 'Hectares', zafra: 'Safra / estação',
    cultivoG: 'Cultura', actividad: 'Atividade', producto: 'Produto ou operação', nuevoProducto: '+ Novo produto ou operação',
    nombre: 'Nome', tipo: 'Tipo', insumo: 'Insumo', labor: 'Operação', servicio: 'Serviço',
    unidad: 'Unidade', dosis: 'Dose por ha', cantidad: 'Quantidade total', precio: 'Preço unitário',
    moneda: 'Moeda', tc: 'Câmbio (R$ por US$)', total: 'Total', pagador: 'Pagou',
    proveedor: 'Fornecedor', cuenta: 'Conta contábil (opcional)', comprobante: 'Foto do comprovante',
    obsG: 'Observações', guardarG: 'Salvar gasto', gastoGuardado: 'Gasto salvo no telefone.',
    faltaTotal: 'Falta o total (quantidade × preço ou o total direto).', faltaItem: 'Escolha ou crie o produto ou operação.',
    sinGastos: 'Ainda não há gastos.', exportarCsv: 'Exportar CSV para a contabilidade', todasZafras: 'Todas',
    porPotrero: 'Por potreiro', porActividad: 'Por atividade', porPagador: 'Por quem pagou', porHa: '/ha',
    costoPotrero: 'Custos', sinTc: 'sem câmbio', porZafra: 'Por safra', sinZafra: 'Sem safra',
    parteDe: 'Compartilhado com outros potreiros: cabe a este', notaReparto: 'Os gastos de vários potreiros são divididos por hectares.', equivalente: 'equivale a',
    pendienteG: 'Pendente de envio', enviadoG: 'Enviado', borrarG: '🗑 Apagar este gasto',
    confirmarBorrarG: 'Apagar este gasto? Ainda não foi enviado.', verComprobante: 'Ver comprovante',
    confirmarBorrarGEnv: 'Apagar este gasto? Também será apagado da planilha (fica uma cópia na aba «Gastos borrados»).',
    editarG: '✏️ Editar este gasto', editarGastoT: 'Editar gasto', guardarCambiosG: 'Salvar alterações', editadoPendG: 'Editado, não enviado',
    cambiosOkG: 'Alterações salvas.', borradoOkG: 'Gasto apagado.', informeGasto: 'Gasto', comprobanteEnviado: 'Comprovante já enviado',
    precioRef: 'Preço de referência (aba Produtos)', precioUltimo: 'Último preço usado', tcPtax: 'Dólar PTAX do Banco Central do Brasil (venda) de',
    tcBuscando: 'Buscando o dólar do Banco Central do Brasil…', tcSinRed: 'Sem conexão: câmbio do último gasto. Pode corrigir.',
    actividades: { siembra: 'Semeadura', fertilizacion: 'Adubação', aplicacion: 'Aplicação (herbicida, inseticida, fungicida)',
      cosecha: 'Colheita', laboreo: 'Preparo do solo', flete: 'Frete', mano_obra: 'Mão de obra',
      mantenimiento: 'Manutenção', compra: 'Compra de insumos', otro: 'Outro' }
  });
  var T = SJ.T;
  var PAGADORES = ['João Antonio', 'Pastos', 'Compartido'];
  var ACTIVIDADES = ['siembra', 'fertilizacion', 'aplicacion', 'cosecha', 'laboreo', 'flete', 'mano_obra', 'mantenimiento', 'compra', 'otro'];
  var CAMPOS_G = ['id', 'fecha', 'usuario', 'potreiro_ids', 'potreiros', 'ha', 'zafra', 'cultivo', 'actividad',
    'tipo_item', 'item_id', 'item', 'cantidad', 'unidad', 'dosis_ha', 'precio_unit', 'moneda', 'total',
    'tipo_cambio', 'total_usd', 'total_brl', 'pagador', 'proveedor', 'cuenta_contable', 'observaciones'];

  var gastosLocales = [], gastosRemotos = [], productos = [], productosNuevos = [];
  var borrador = null, filtroZafra = '';

  function nombreAct(k) { return (T('actividades') || {})[k] || k; }
  function num(x) { var n = parseFloat(String(x === undefined || x === null ? '' : x).replace(',', '.')); return isNaN(n) ? null : n; }
  function r2(n) { return Math.round(n * 100) / 100; }
  function fmt(n, dec) {
    if (n === null || n === undefined || n === '' || isNaN(n)) return '—';
    return Number(n).toLocaleString(SJ.idioma() === 'pt' ? 'pt-BR' : 'es-UY', { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 });
  }
  function dinero(n, mon) { return (mon === 'BRL' ? 'R$ ' : 'US$ ') + fmt(n, 0); }

  // ------------------------------------------------------------ almacenamiento
  function gastosDB() { return SJ.tx('gastos', 'readonly', function (s) { return s.getAll(); }); }
  function gastoPut(g) { return SJ.tx('gastos', 'readwrite', function (s) { return s.put(g); }); }
  function gastoDel(id) { return SJ.tx('gastos', 'readwrite', function (s) { return s.delete(id); }); }
  function recargar() {
    return Promise.all([gastosDB(), SJ.kvGet('gastosRemotos'), SJ.kvGet('productos'), SJ.kvGet('productosNuevos'), SJ.kvGet('ultimoTc'), SJ.kvGet('borradorGasto')])
      .then(function (r) {
        gastosLocales = r[0] || []; gastosRemotos = r[1] || []; productos = r[2] || []; productosNuevos = r[3] || [];
        SJ._ultimoTc = r[4] || ''; if (r[5] && !borrador) borrador = r[5];
        SJ.pill();
      });
  }
  function pendientes() { return gastosLocales.filter(function (g) { return !g.enviado; }); }
  function todosLosGastos() {
    var porId = {};
    gastosRemotos.forEach(function (g) { porId[g.id] = { g: g, local: false }; });
    gastosLocales.forEach(function (g) {
      // Lo pendiente del teléfono (nuevo, editado o por borrar) manda sobre lo del servidor.
      if (g.op === 'borrar') { if (!g.enviado) delete porId[g.id]; return; }
      if (!porId[g.id] || !g.enviado) porId[g.id] = { g: g, local: true };
    });
    return Object.keys(porId).map(function (k) { return porId[k]; })
      .sort(function (a, b) { return String(b.g.fecha).localeCompare(String(a.g.fecha)); });
  }
  // La misma lista inicial que crea el servidor; sirve hasta la primera sincronización.
  var INICIALES = [['p-urea', 'Urea', 'insumo', 'kg'], ['p-dap', 'Fosfato diamónico (DAP)', 'insumo', 'kg'], ['p-npk', 'NPK', 'insumo', 'kg'],
    ['p-glifo', 'Glifosato', 'insumo', 'L'], ['p-24d', '2,4-D', 'insumo', 'L'], ['p-insect', 'Insecticida', 'insumo', 'L'],
    ['p-fungi', 'Fungicida', 'insumo', 'L'], ['p-sem-azev', 'Semilla raigrás (azevém)', 'insumo', 'kg'], ['p-sem-fest', 'Semilla festuca', 'insumo', 'kg'],
    ['p-sem-tb', 'Semilla trébol blanco', 'insumo', 'kg'], ['p-sem-soja', 'Semilla soja', 'insumo', 'kg'], ['p-gasoil', 'Gasoil', 'insumo', 'L'],
    ['l-siembra', 'Siembra', 'labor', 'ha'], ['l-pulv', 'Pulverización', 'labor', 'ha'], ['l-fert', 'Fertilización (aplicación)', 'labor', 'ha'],
    ['l-cosecha', 'Cosecha', 'labor', 'ha'], ['l-hilerado', 'Hilerado', 'labor', 'ha'], ['l-prep', 'Preparación de suelo', 'labor', 'ha'],
    ['s-flete', 'Flete', 'servicio', 'viaje'], ['s-jornal', 'Mano de obra (jornal)', 'servicio', 'jornal'], ['s-analisis', 'Análisis de suelo/semilla', 'servicio', 'unidad']
  ].map(function (x) { return { id: x[0], nombre: x[1], tipo: x[2], unidad: x[3], precio_ref: '', moneda: 'USD', cuenta_contable: '' }; });
  function catalogo() {
    var ids = {}, l = [];
    (productos.length ? productos : INICIALES).concat(productosNuevos).forEach(function (p) { if (!ids[p.id] && p.activo !== 'no') { ids[p.id] = 1; l.push(p); } });
    return l.sort(function (a, b) { return String(a.nombre).localeCompare(String(b.nombre)); });
  }
  function producto(id) { return catalogo().filter(function (p) { return p.id === id; })[0] || null; }

  // ------------------------------------------------------------ sincronización
  SJ.pendientesExtra.push(function () {
    return pendientes().length + productosNuevos.filter(function (p) { return !p.enviado; }).length;
  });
  SJ.alSincronizar.push(function () {
    var cfg = SJ.cfg();
    function post(obj, ms) {
      obj.clave = cfg.clave;
      return SJ.fetchT(cfg.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(obj) }, ms || 60000)
        .then(function (r) { return r.json(); }).then(function (j) { if (!j.ok) throw new Error(j.error === 'pedido' ? T('servidorViejo') : (j.error || 'error')); return j; });
    }
    var cola = productosNuevos.filter(function (p) { return !p.enviado; });
    var pr = cola.reduce(function (acc, p) {
      return acc.then(function () { return post({ accion: 'producto', producto: p }); }).then(function () { p.enviado = true; });
    }, Promise.resolve()).then(function () { return SJ.kvSet('productosNuevos', productosNuevos); });
    pendientes().forEach(function (g) {
      if (g.op === 'borrar') {
        pr = pr.then(function () { return post({ accion: 'gastoBorrar', id: g.id, usuario: cfg.usuario }); }).then(function () {
          gastosRemotos = gastosRemotos.filter(function (x) { return x.id !== g.id; });
          return Promise.all([gastoDel(g.id), SJ.kvSet('gastosRemotos', gastosRemotos)]);
        });
        return;
      }
      pr = pr.then(function () {
        return g.comprobante && g.comprobante.grande ? SJ.blobB64(g.comprobante.grande) : null;
      }).then(function (b64) {
        var o = {}; CAMPOS_G.forEach(function (c) { o[c] = g[c]; });
        if (b64) o.comprobante = { base64: b64 };
        if (g.op === 'editar' && !b64 && !g.comprobanteUrl) o.sinComprobante = true;
        return post({ accion: g.op === 'editar' ? 'gastoEditar' : 'gasto', gasto: o }, 120000);
      }).then(function (j) {
        g.enviado = true; if (j.comprobante !== undefined) g.comprobanteUrl = j.comprobante;
        if (g.comprobante) delete g.comprobante.grande;
        if (g.op === 'editar') {
          var copia = {}; CAMPOS_G.forEach(function (c) { copia[c] = g[c]; });
          copia.comprobante = g.comprobanteUrl || '';
          gastosRemotos = gastosRemotos.filter(function (x) { return x.id !== g.id; }).concat([copia]);
          SJ.kvSet('gastosRemotos', gastosRemotos);
        }
        return gastoPut(g);
      });
    });
    return pr.then(function () {
      return SJ.fetchT(cfg.url + '?accion=gastos&clave=' + encodeURIComponent(cfg.clave), {}, 45000);
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j.ok) { gastosRemotos = j.gastos || []; return SJ.kvSet('gastosRemotos', gastosRemotos); }
    }).then(function () {
      return SJ.fetchT(cfg.url + '?accion=productos&clave=' + encodeURIComponent(cfg.clave), {}, 45000);
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j.ok) { productos = j.productos || []; return SJ.kvSet('productos', productos); }
    }).then(recargar);
  });

  // ------------------------------------------------------------ formulario
  function zafraPorDefecto(fecha) {
    var d = new Date(fecha + 'T12:00:00'), m = d.getMonth() + 1;
    // En marzo y abril se siembra el invierno: el gasto va a la zafra de invierno que empieza.
    if (m === 3 || m === 4) { var yy = d.getFullYear() % 100; var p = 'inv ' + yy; if (SJ.datos().periodos.indexOf(p) >= 0) return p; }
    return SJ.periodoDe(d);
  }
  function nuevoBorrador(potId) {
    var hoy = SJ.ahoraLocal().slice(0, 10);
    var b = { id: SJ.uid(), fecha: hoy, usuario: SJ.cfg().usuario, potreiro_ids: potId ? [potId] : [], ha: '',
      zafra: zafraPorDefecto(hoy), cultivo: '', actividad: '', tipo_item: '', item_id: '', item: '', cantidad: '',
      unidad: '', dosis_ha: '', precio_unit: '', moneda: 'USD', total: '', tipo_cambio: SJ._ultimoTc || '',
      pagador: 'João Antonio', proveedor: '', cuenta_contable: '', observaciones: '', comprobante: null };
    completar(b);
    return b;
  }
  function completar(b) {
    var pots = b.potreiro_ids.map(SJ.potrero).filter(Boolean);
    b.potreiros = pots.length ? pots.map(function (p) { return p.nome; }).join(', ') : T('general');
    var ha = pots.reduce(function (a, p) { return a + p.ha; }, 0);
    if (pots.length) b.ha = r2(ha);
    // Zafra según lo que hay en el potrero esa fecha: en nov–ene un semillero en cosecha es del invierno.
    if (pots.length && !b._zafraEditada) {
      var d = new Date(String(b.fecha).slice(0, 10) + 'T12:00:00');
      if (!isNaN(d)) { var u = SJ.usoAhora(pots[0], d); b.zafra = u.colheita ? u.per : zafraPorDefecto(b.fecha); }
    }
    if (pots.length && !b._cultivoEditado) b.cultivo = pots[0].rotacao[b.zafra] || '';
    calcular(b);
  }
  function calcular(b) {
    var ha = num(b.ha), dosis = num(b.dosis_ha), cant = num(b.cantidad), precio = num(b.precio_unit), tc = num(b.tipo_cambio);
    if (dosis !== null && ha && b._ultimo !== 'cantidad') { cant = r2(dosis * ha); b.cantidad = cant; }
    if (!b._totalEditado && cant !== null && precio !== null) b.total = r2(cant * precio);
    var tot = num(b.total);
    b.total_usd = tot === null ? '' : (b.moneda === 'USD' ? tot : (tc ? r2(tot / tc) : ''));
    b.total_brl = tot === null ? '' : (b.moneda === 'BRL' ? tot : (tc ? r2(tot * tc) : ''));
  }
  function guardarBorrador() { SJ.kvSet('borradorGasto', borrador); }

  // ------------------------------------------------------------ precio sugerido y tipo de cambio
  // Precio: el de referencia de la hoja «Productos»; si no tiene, el último usado para ese producto.
  function precioSugerido(p, idActual) {
    if (p.precio_ref !== '' && p.precio_ref !== undefined && p.precio_ref !== null && num(p.precio_ref) !== null) {
      return { precio: num(p.precio_ref), moneda: p.moneda || 'USD', fuente: T('precioRef') };
    }
    var u = todosLosGastos().filter(function (x) {
      return x.g.item_id === p.id && x.g.id !== idActual && num(x.g.precio_unit) !== null;
    })[0];
    return u ? { precio: num(u.g.precio_unit), moneda: u.g.moneda || 'USD', fuente: T('precioUltimo') + ' (' + SJ.fechaDMA(u.g.fecha) + ')' } : null;
  }

  // Dólar PTAX (venta) del Banco Central do Brasil del día del gasto, o del último día hábil anterior.
  var cachePtax = null;
  function isoDia(x) { return x.getFullYear() + '-' + ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2); }
  function mdy(x) { return ('0' + (x.getMonth() + 1)).slice(-2) + '-' + ('0' + x.getDate()).slice(-2) + '-' + x.getFullYear(); }
  function ptax(fecha) {
    var d = new Date(String(fecha).slice(0, 10) + 'T12:00:00'), hoy = new Date();
    if (isNaN(d)) return Promise.reject(new Error('fecha'));
    if (d > hoy) d = hoy;
    var dia = isoDia(d), desde = new Date(d.getTime() - 10 * 864e5);
    return (cachePtax ? Promise.resolve(cachePtax) : SJ.kvGet('ptax').then(function (c) { cachePtax = c || {}; return cachePtax; })).then(function (c) {
      if (c[dia]) return c[dia];
      var url = 'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)' +
        "?@dataInicial='" + mdy(desde) + "'&@dataFinalCotacao='" + mdy(d) + "'&$format=json&$select=cotacaoVenda,dataHoraCotacao";
      return SJ.fetchT(url, {}, 15000).then(function (r) { return r.json(); }).then(function (j) {
        var l = j.value || [];
        if (!l.length) throw new Error('PTAX');
        var u = l[l.length - 1], res = { tc: u.cotacaoVenda, dia: String(u.dataHoraCotacao).slice(0, 10) };
        // Hoy antes de las 13 h todavía no hay PTAX del día: no se guarda, para volver a buscarla después.
        if (res.dia === dia || dia < isoDia(hoy)) { c[dia] = res; SJ.kvSet('ptax', c); }
        return res;
      });
    });
  }
  function aplicarPtax(b) {
    if (b._tcEditado || !/^\d{4}-\d{2}-\d{2}$/.test(String(b.fecha))) return;
    b._tcFuente = T('tcBuscando'); pintarTc();
    ptax(b.fecha).then(function (r) {
      if (borrador !== b || b._tcEditado) return;
      b.tipo_cambio = r.tc; b._tcFuente = T('tcPtax') + ' ' + SJ.fechaDMA(r.dia);
      calcular(b); guardarBorrador(); pintarTc();
    }).catch(function () {
      if (borrador !== b) return;
      b._tcFuente = b.tipo_cambio ? T('tcSinRed') : ''; pintarTc();
    });
  }
  function pintarTc() {
    if (!borrador) return;
    var i = $('#tela-gasto [data-g="tipo_cambio"]'); if (i && document.activeElement !== i) i.value = borrador.tipo_cambio;
    var f = $('#tela-gasto .tc-fuente'); if (f) f.textContent = borrador._tcFuente || '';
    refrescarEquiv();
  }

  function vistaGasto(arg) {
    if (!borrador || (arg && arg.nuevo)) borrador = nuevoBorrador(arg && arg.potrero);
    dibujar();
    if (!borrador.editando) aplicarPtax(borrador);
  }
  function dibujar() {
    var b = borrador, d = SJ.datos(), cat = catalogo();
    function campo(k, et, tipo, extra) {
      return '<label class="campo">' + esc(et) + '</label><input type="' + (tipo || 'text') + '" data-g="' + k + '" value="' + esc(b[k]) + '"' + (extra || '') + '>';
    }
    var dec = ' inputmode="decimal"';
    var pots = d.potreiros.slice().sort(function (a, c) { return a.poligono - c.poligono; });
    var h = '<h2>' + esc(b.editando ? T('editarGastoT') : T('nuevoGastoT')) + '</h2><div class="grupo">' + campo('fecha', T('fechaG'), 'date') +
      '<label class="campo">' + esc(T('actividad')) + '</label><div class="chips">' + ACTIVIDADES.map(function (a) {
        return '<button type="button" data-g-act="' + a + '" class="' + (b.actividad === a ? 'sel' : '') + '">' + esc(nombreAct(a)) + '</button>';
      }).join('') + '</div></div>';
    h += '<div class="grupo"><h3>' + esc(T('potrerosG')) + '</h3><div class="mut">' + esc(b.potreiros) + (b.ha ? ' · ' + fmt(b.ha, 1) + ' ha' : '') + '</div>' +
      '<details class="selpot"' + (b.potreiro_ids.length ? '' : ' open') + '><summary>' + esc(T('elegir')) + '</summary><div class="lista-check">' +
      pots.map(function (p) {
        return '<label><input type="checkbox" data-g-pot="' + p.id + '"' + (b.potreiro_ids.indexOf(p.id) >= 0 ? ' checked' : '') + '> ' +
          p.poligono + '. ' + esc(p.nome) + ' <span class="mut">' + p.ha + ' ha</span></label>';
      }).join('') + '</div></details>' +
      '<div class="dos"><div><label class="campo">' + esc(T('zafra')) + '</label><select data-g="zafra">' + d.periodos.map(function (p) {
        return '<option value="' + esc(p) + '"' + (p === b.zafra ? ' selected' : '') + '>' + esc(SJ.etiquetaPer(p)) + '</option>';
      }).join('') + '</select></div><div>' + campo('cultivo', T('cultivoG')) + '</div></div>' + campo('ha', T('haG'), 'number', dec) + '</div>';
    h += '<div class="grupo"><h3>' + esc(T('producto')) + '</h3><select data-g="item_id"><option value="">' + esc(T('elegir')) + '</option>' +
      ['insumo', 'labor', 'servicio'].map(function (t) {
        var l = cat.filter(function (p) { return p.tipo === t; });
        return l.length ? '<optgroup label="' + esc(T(t)) + '">' + l.map(function (p) {
          return '<option value="' + esc(p.id) + '"' + (p.id === b.item_id ? ' selected' : '') + '>' + esc(p.nombre) + ' (' + esc(p.unidad) + ')</option>';
        }).join('') + '</optgroup>' : '';
      }).join('') + '<option value="__nuevo">' + esc(T('nuevoProducto')) + '</option></select>' +
      (b.item_id === '__nuevo' ? '<div class="nuevo-prod">' + campo('_np_nombre', T('nombre')) +
        '<div class="dos"><div><label class="campo">' + esc(T('tipo')) + '</label><select data-g="_np_tipo">' + ['insumo', 'labor', 'servicio'].map(function (t) {
          return '<option value="' + t + '"' + (b._np_tipo === t ? ' selected' : '') + '>' + esc(T(t)) + '</option>';
        }).join('') + '</select></div><div>' + campo('_np_unidad', T('unidad')) + '</div></div></div>' : '') +
      '<div class="dos"><div>' + campo('dosis_ha', T('dosis') + (b.unidad ? ' (' + b.unidad + ')' : ''), 'number', dec) + '</div><div>' +
      campo('cantidad', T('cantidad') + (b.unidad ? ' (' + b.unidad + ')' : ''), 'number', dec) + '</div></div>' +
      '<div class="dos"><div>' + campo('precio_unit', T('precio'), 'number', dec) + '</div><div><label class="campo">' + esc(T('moneda')) +
      '</label><div class="niveles dos-op">' + ['USD', 'BRL'].map(function (m) {
        return '<button type="button" data-g-mon="' + m + '" class="' + (b.moneda === m ? 'sel' : '') + '">' + (m === 'USD' ? 'US$' : 'R$') + '</button>';
      }).join('') + '</div></div></div>' +
      '<div class="mut pista precio-fuente">' + esc(b._precioFuente || '') + '</div>' +
      '<div class="dos"><div>' + campo('total', T('total') + ' (' + (b.moneda === 'BRL' ? 'R$' : 'US$') + ')', 'number', dec) + '</div><div>' +
      campo('tipo_cambio', T('tc'), 'number', dec) + '</div></div>' +
      '<div class="mut pista tc-fuente">' + esc(b._tcFuente || '') + '</div>' +
      '<div class="mut equiv">' + equivalencia(b) + '</div></div>';
    h += '<div class="grupo"><label class="campo">' + esc(T('pagador')) + '</label><div class="niveles tres-op">' + PAGADORES.map(function (p) {
        return '<button type="button" data-g-pag="' + esc(p) + '" class="' + (b.pagador === p ? 'sel' : '') + '">' + esc(p) + '</button>';
      }).join('') + '</div>' + campo('proveedor', T('proveedor')) + campo('cuenta_contable', T('cuenta')) +
      '<label class="campo">' + esc(T('comprobante')) + '</label>' +
      (b.op === 'editar' && b.comprobanteUrl && !(b.comprobante && b.comprobante.mini) ? '<div class="previas"><span><a href="' + esc(b.comprobanteUrl) +
        '" target="_blank" rel="noopener">' + esc(T('comprobanteEnviado')) + '</a><button type="button" data-g-quitar-previo="1">×</button></span></div>' : '') +
      '<label class="btn sec" style="text-align:center">📷 ' + esc(T('agregarFoto')) +
      '<input type="file" accept="image/*" data-g-foto="1" style="display:none"></label><div class="fotos" id="g-foto"></div>' +
      '<label class="campo">' + esc(T('obsG')) + '</label><textarea data-g="observaciones">' + esc(b.observaciones) + '</textarea></div>' +
      '<button class="btn" type="button" data-g-guardar="1">✓ ' + esc(b.editando ? T('guardarCambiosG') : T('guardarG')) + '</button>' +
      '<button class="btn sec" type="button" data-g-cancelar="1">' + esc(T('cancelar')) + '</button>';
    $('#tela-gasto').innerHTML = h;
    pintarFoto();
  }
  function equivalencia(b) {
    var tot = num(b.total);
    if (tot === null) return '';
    if (!num(b.tipo_cambio)) return esc(T('sinTc'));
    return esc(T('equivalente')) + ' ' + (b.moneda === 'USD' ? dinero(b.total_brl, 'BRL') : dinero(b.total_usd, 'USD'));
  }
  function pintarFoto() {
    var c = $('#g-foto'); if (!c) return; c.innerHTML = '';
    if (borrador.comprobante && borrador.comprobante.mini) {
      var d = document.createElement('div'), img = document.createElement('img'), x = document.createElement('button');
      img.src = URL.createObjectURL(borrador.comprobante.mini); x.textContent = '×'; x.type = 'button'; x.dataset.gQuitarFoto = '1';
      d.appendChild(img); d.appendChild(x); c.appendChild(d);
    }
  }
  function refrescarEquiv() { var e = $('#tela-gasto .equiv'); if (e) e.innerHTML = equivalencia(borrador); }

  function guardar() {
    var b = borrador;
    if (b.item_id === '__nuevo') {
      if (!String(b._np_nombre || '').trim()) { SJ.aviso(T('faltaItem')); return; }
      var np = { id: 'n-' + SJ.uid(), nombre: b._np_nombre.trim(), tipo: b._np_tipo || 'insumo', categoria: '',
        unidad: b._np_unidad || '', precio_ref: num(b.precio_unit) || '', moneda: b.moneda, cuenta_contable: b.cuenta_contable || '' };
      productosNuevos.push(np); SJ.kvSet('productosNuevos', productosNuevos);
      b.item_id = np.id; b.item = np.nombre; b.tipo_item = np.tipo; b.unidad = np.unidad;
    }
    if (!b.item_id && !b.actividad) { SJ.aviso(T('faltaItem')); return; }
    calcular(b);
    if (num(b.total) === null) { SJ.aviso(T('faltaTotal')); return; }
    ['ha', 'cantidad', 'dosis_ha', 'precio_unit', 'total', 'tipo_cambio'].forEach(function (k) { var n = num(b[k]); b[k] = n === null ? '' : n; });
    var editando = !!b.editando;
    if (!editando || !b.usuario) b.usuario = SJ.cfg().usuario || '?';
    b.enviado = false;
    ['_np_nombre', '_np_tipo', '_np_unidad', '_ultimo', '_totalEditado', '_cultivoEditado', '_precioFuente', '_tcFuente', '_tcEditado', '_zafraEditada', 'editando']
      .forEach(function (k) { delete b[k]; });
    if (b.tipo_cambio) SJ.kvSet('ultimoTc', b.tipo_cambio);
    var g = b;
    gastoPut(g).then(function () { borrador = null; SJ.kvSet('borradorGasto', null); return recargar(); }).then(function () {
      SJ.aviso(T(editando ? 'cambiosOkG' : 'gastoGuardado'));
      if (editando) SJ.ir('detalleGasto', g.id); else SJ.ir('gastos');
      SJ.sincronizar(false);
    });
  }

  // ------------------------------------------------------------ editar, borrar y compartir
  function nuncaEnviado(loc) { return loc && !loc.enviado && loc.op !== 'editar'; }
  function editarGasto(id) {
    var x = todosLosGastos().filter(function (y) { return y.g.id === id; })[0];
    if (!x) return;
    var loc = gastosLocales.filter(function (y) { return y.id === id; })[0];
    var b = {};
    CAMPOS_G.forEach(function (c) { b[c] = x.g[c] === undefined || x.g[c] === null ? '' : x.g[c]; });
    b.potreiro_ids = Array.isArray(x.g.potreiro_ids) ? x.g.potreiro_ids.slice() : (x.g.potreiro_ids ? String(x.g.potreiro_ids).split(' ') : []);
    b.fecha = String(b.fecha).slice(0, 10);
    if (nuncaEnviado(loc)) b.comprobante = loc.comprobante || null;
    else {
      b.op = 'editar';
      b.comprobante = loc && !loc.enviado && loc.comprobante && loc.comprobante.grande ? loc.comprobante : null;
      b.comprobanteUrl = typeof x.g.comprobante === 'string' ? x.g.comprobante : ((loc && loc.comprobanteUrl) || '');
    }
    // Al editar se respeta lo cargado: cultivo, total y tipo de cambio no se recalculan solos.
    b._cultivoEditado = true; b._totalEditado = true; b._tcEditado = true; b._zafraEditada = true;
    b.editando = true;
    calcular(b);
    borrador = b; guardarBorrador();
    SJ.ir('gasto');
  }
  function borrarGasto(id) {
    var loc = gastosLocales.filter(function (y) { return y.id === id; })[0], nunca = nuncaEnviado(loc);
    if (!confirm(T(nunca ? 'confirmarBorrarG' : 'confirmarBorrarGEnv'))) return;
    var pr = nunca ? gastoDel(id) : gastoPut({ id: id, op: 'borrar', enviado: false });
    if (borrador && borrador.id === id) { borrador = null; SJ.kvSet('borradorGasto', null); }
    pr.then(recargar).then(function () {
      SJ.aviso(T('borradoOkG'));
      SJ.ir('gastos');
      if (!nunca) SJ.sincronizar(false);
    });
  }
  function filasGasto(g) {
    return [
      [T('actividad'), nombreAct(g.actividad)], [T('potrerosG'), g.potreiros], [T('haG'), g.ha], [T('zafra'), g.zafra], [T('cultivoG'), g.cultivo],
      [T('dosis'), g.dosis_ha ? g.dosis_ha + ' ' + g.unidad + '/ha' : ''], [T('cantidad'), g.cantidad ? g.cantidad + ' ' + g.unidad : ''],
      [T('precio'), g.precio_unit ? (g.moneda === 'BRL' ? 'R$ ' : 'US$ ') + Number(g.precio_unit).toLocaleString(SJ.idioma() === 'pt' ? 'pt-BR' : 'es-UY', { maximumFractionDigits: 4 }) + ' / ' + g.unidad : ''],
      [T('total'), dinero(g.total, g.moneda)], [T('tc'), g.tipo_cambio],
      ['US$', g.total_usd !== '' && g.total_usd !== undefined ? fmt(g.total_usd, 2) : ''], ['R$', g.total_brl !== '' && g.total_brl !== undefined ? fmt(g.total_brl, 2) : ''],
      [T('pagador'), g.pagador], [T('proveedor'), g.proveedor], [T('cuenta'), g.cuenta_contable], [T('obsG'), g.observaciones]
    ].filter(function (f) { return f[1] !== '' && f[1] !== null && f[1] !== undefined; });
  }
  function compartirGasto(id) {
    var x = todosLosGastos().filter(function (y) { return y.g.id === id; })[0];
    if (!x) return;
    var g = x.g, loc = gastosLocales.filter(function (y) { return y.id === id; })[0];
    var que = g.item || nombreAct(g.actividad);
    var informe = T('informeGasto') + ' - Estância São José - ' + que + (g.potreiros ? ' - ' + g.potreiros : '') + (SJ.fechaDMA(g.fecha) ? ' - ' + SJ.fechaDMA(g.fecha) : '');
    if (informe.length > 120) informe = informe.slice(0, 117) + '…';
    var url = typeof g.comprobante === 'string' ? g.comprobante : (loc && loc.comprobanteUrl);
    var blob = loc && loc.comprobante && (loc.comprobante.grande || loc.comprobante.mini);
    SJ.compartirPdf(informe, informe + '\n' + dinero(g.total, g.moneda) + ' · ' + (g.usuario || ''), {
      encabezado: T('informeGasto'), titulo: que, sub: SJ.fechaDMA(g.fecha) + ' · ' + (g.usuario || '') + ' · ' + dinero(g.total, g.moneda),
      filas: filasGasto(g), blobs: blob ? [blob] : [], urls: url ? [url] : [], urlsTit: T('comprobante')
    });
  }

  // ------------------------------------------------------------ listas y costos
  function zafras() {
    var s = {}; todosLosGastos().forEach(function (x) { if (x.g.zafra) s[x.g.zafra] = 1; });
    return SJ.datos().periodos.filter(function (p) { return s[p]; });
  }
  function filtroZafras() {
    return '<div class="filtros">' + ['' ].concat(zafras()).map(function (z) {
      return '<button type="button" data-g-zafra="' + esc(z) + '" class="' + (filtroZafra === z ? 'activo' : '') + '">' +
        esc(z ? SJ.etiquetaPer(z) : T('todasZafras')) + '</button>';
    }).join('') + '</div>';
  }
  function filtrados() { return todosLosGastos().filter(function (x) { return !filtroZafra || x.g.zafra === filtroZafra; }); }
  function sumar(lista) {
    return lista.reduce(function (a, x) {
      a.usd += num(x.g.total_usd) || 0; a.brl += num(x.g.total_brl) || 0; if (!num(x.g.tipo_cambio) && x.g.moneda !== 'USD') a.sinTc++; return a;
    }, { usd: 0, brl: 0, sinTc: 0 });
  }
  function tarjetaGasto(x) {
    var g = x.g, pend = x.local && !g.enviado;
    return '<div class="tarjeta" data-g-detalle="' + esc(g.id) + '"><div class="fila"><div class="crece"><b>' + esc(g.item || nombreAct(g.actividad)) +
      '</b><div class="mut">' + esc(g.fecha) + ' · ' + esc(nombreAct(g.actividad)) + ' · ' + esc(g.potreiros) + '</div><div class="mut">' +
      esc(g.pagador) + (g.cantidad ? ' · ' + fmt(g.cantidad, 1) + ' ' + esc(g.unidad) : '') + '</div></div><div class="monto"><b>' +
      dinero(g.total, g.moneda) + '</b><span class="mut">' + (g.moneda === 'USD' ? (g.total_brl ? dinero(g.total_brl, 'BRL') : '') : (g.total_usd ? dinero(g.total_usd, 'USD') : '')) +
      '</span><span class="estado-sync ' + (pend ? 'pend' : 'ok') + '">' + (pend ? '⬆' : '✓') + '</span></div></div></div>';
  }
  function vistaGastos() {
    var l = filtrados(), s = sumar(l);
    var h = SJ.selectorRegistros('gastos') + filtroZafras() +
      '<div class="resumen"><div class="tarjeta"><b>' + dinero(s.usd, 'USD') + '</b><span class="mut">' + dinero(s.brl, 'BRL') + '</span></div></div>' +
      '<button class="btn" type="button" data-tela="gasto">＋ ' + esc(T('nuevoGastoT')) + '</button>';
    h += l.length ? l.map(tarjetaGasto).join('') : '<div class="vacio">' + esc(T('sinGastos')) + '</div>';
    $('#tela-gastos').innerHTML = h;
  }
  function vistaCostos() {
    var l = filtrados(), s = sumar(l), d = SJ.datos();
    var porPot = {}, porAct = {}, porPag = {};
    l.forEach(function (x) {
      var g = x.g, usd = num(g.total_usd) || 0, ids = g.potreiro_ids && g.potreiro_ids.length ? g.potreiro_ids : ['general'];
      var haTot = ids.reduce(function (a, id) { var p = SJ.potrero(id); return a + (p ? p.ha : 0); }, 0);
      ids.forEach(function (id) {
        var p = SJ.potrero(id), parte = p && haTot ? usd * p.ha / haTot : usd;   // se reparte por hectáreas
        porPot[id] = (porPot[id] || 0) + parte;
      });
      porAct[g.actividad] = (porAct[g.actividad] || 0) + usd;
      porPag[g.pagador] = (porPag[g.pagador] || 0) + usd;
    });
    var h = SJ.selectorRegistros('costos') + filtroZafras() +
      '<div class="resumen"><div class="tarjeta"><b>' + dinero(s.usd, 'USD') + '</b><span class="mut">' + dinero(s.brl, 'BRL') +
      (s.sinTc ? ' · ' + s.sinTc + ' ' + esc(T('sinTc')) : '') + '</span></div></div>';
    h += '<h3>' + esc(T('porPotrero')) + '</h3><div class="tarjeta"><table class="tabla-costos"><tbody>' +
      Object.keys(porPot).sort(function (a, b) { return porPot[b] - porPot[a]; }).map(function (id) {
        var p = SJ.potrero(id);
        return '<tr' + (p ? ' data-ficha="' + p.id + '"' : '') + '><td>' + esc(p ? p.poligono + '. ' + p.nome : T('general')) + '</td><td class="num">' +
          dinero(porPot[id], 'USD') + '</td><td class="num mut">' + (p ? dinero(porPot[id] / p.ha, 'USD') + esc(T('porHa')) : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>';
    function bloque(tit, obj, nom) {
      return '<h3>' + esc(tit) + '</h3><div class="tarjeta"><table class="tabla-costos"><tbody>' + Object.keys(obj).sort(function (a, b) { return obj[b] - obj[a]; })
        .map(function (k) { return '<tr><td>' + esc(nom(k)) + '</td><td class="num">' + dinero(obj[k], 'USD') + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }
    h += bloque(T('porActividad'), porAct, nombreAct) + bloque(T('porPagador'), porPag, function (k) { return k; });
    h += '<button class="btn sec" type="button" data-g-csv="1">⬇ ' + esc(T('exportarCsv')) + '</button>';
    $('#tela-costos').innerHTML = l.length ? h : SJ.selectorRegistros('costos') + filtroZafras() + '<div class="vacio">' + esc(T('sinGastos')) + '</div>';
  }
  function vistaDetalleGasto(id) {
    var x = todosLosGastos().filter(function (y) { return y.g.id === id; })[0];
    if (!x) return SJ.ir('gastos');
    var g = x.g, pend = x.local && !g.enviado;
    var loc = gastosLocales.filter(function (y) { return y.id === id; })[0];
    var url = g.comprobante && typeof g.comprobante === 'string' ? g.comprobante : (loc && loc.comprobanteUrl);
    var h = '<h2>' + esc(g.item || nombreAct(g.actividad)) + '</h2><div class="mut">' + esc(g.fecha) + ' · ' + esc(g.usuario) +
      ' · <span class="estado-sync ' + (pend ? 'pend' : 'ok') + '">' + esc(pend ? (g.op === 'editar' ? T('editadoPendG') : T('pendienteG')) : T('enviadoG')) + '</span></div>' +
      '<div class="tarjeta"><dl class="det">' + filasGasto(g).map(function (f) { return '<dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd>'; }).join('') +
      '</dl></div>' + (url ? '<div class="tarjeta"><a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(T('verComprobante')) + '</a></div>' : '') +
      '<button class="btn" type="button" data-g-compartir="' + esc(g.id) + '">' + esc(T('compartir')) + '</button>' +
      '<button class="btn sec" type="button" data-g-editar="' + esc(g.id) + '">' + esc(T('editarG')) + '</button>' +
      '<button class="btn peligro" type="button" data-g-borrar="' + esc(g.id) + '">' + esc(T('borrarG')) + '</button>';
    $('#tela-detalleGasto').innerHTML = h;
  }

  // ------------------------------------------------------------ CSV para contabilidad
  function csv() {
    var cols = ['id', 'fecha', 'zafra', 'cultivo', 'potreiros', 'potreiro_ids', 'ha', 'actividad', 'tipo_item', 'item', 'cantidad', 'unidad',
      'precio_unit', 'moneda', 'total', 'tipo_cambio', 'total_usd', 'total_brl', 'pagador', 'proveedor', 'cuenta_contable', 'usuario', 'observaciones'];
    var filas = filtrados().map(function (x) {
      return cols.map(function (c) {
        var v = x.g[c]; if (Array.isArray(v)) v = v.join(' ');
        v = v === undefined || v === null ? '' : String(v);
        return /[";\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(';');
    });
    var blob = new Blob(['﻿' + cols.join(';') + '\n' + filas.join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'gastos-sao-jose-' + (filtroZafra || 'todas').replace(/\s/g, '') + '.csv'; a.click();
  }

  // ------------------------------------------------------------ ficha del potrero
  // ------------------------------------------------------------ ficha del potrero
  // Un gasto de varios potreros se reparte por hectáreas: a cada potrero le toca su parte.
  function gastosDePotrero(p) {
    var l = [];
    todosLosGastos().forEach(function (x) {
      var g = x.g; if (!g.potreiro_ids || g.potreiro_ids.indexOf(p.id) < 0) return;
      var haTot = g.potreiro_ids.reduce(function (a, id) { var q = SJ.potrero(id); return a + (q ? q.ha : 0); }, 0);
      var k = haTot ? p.ha / haTot : 1;
      l.push({ x: x, k: k, usd: (num(g.total_usd) || 0) * k, brl: (num(g.total_brl) || 0) * k, compartido: g.potreiro_ids.length > 1 });
    });
    return l;
  }
  SJ.dinero = function (n) { return dinero(n, 'USD'); };
  SJ.costoPorPeriodo = function (p) {
    var r = {};
    gastosDePotrero(p).forEach(function (y) {
      var z = y.x.g.zafra || '—'; r[z] = r[z] || { usd: 0, n: 0 }; r[z].usd += y.usd; r[z].n++;
    });
    return r;
  };
  function botonNuevo(p) {
    return '<button class="btn" type="button" data-g-nuevo-pot="' + p.id + '">＋ ' + esc(T('nuevoGastoT')) + '</button>';
  }
  SJ.fichaGastos = function (p) {
    var l = gastosDePotrero(p), h = botonNuevo(p);
    if (!l.length) return h + '<div class="vacio">' + esc(T('sinGastos')) + '</div>';
    var orden = SJ.datos().periodos.concat(['—']), grupos = {};
    l.forEach(function (y) { var z = y.x.g.zafra || '—'; (grupos[z] = grupos[z] || []).push(y); });
    Object.keys(grupos).forEach(function (z) { if (orden.indexOf(z) < 0) orden.push(z); });
    orden.forEach(function (z) {
      var g = grupos[z]; if (!g) return;
      var tot = g.reduce(function (a, y) { return a + y.usd; }, 0);
      h += '<div class="cap-zafra"><b>' + esc(z === '—' ? T('sinZafra') : SJ.etiquetaPer(z)) + '</b><span>' + dinero(tot, 'USD') +
        ' · ' + dinero(tot / p.ha, 'USD') + esc(T('porHa')) + '</span></div>';
      h += g.map(function (y) {
        return tarjetaGasto(y.x) + (y.compartido ? '<div class="parte mut">' + esc(T('parteDe')) + ' ' + fmt(y.k * 100, 0) + ' % → ' +
          dinero(y.usd, 'USD') + '</div>' : '');
      }).join('');
    });
    return h;
  };
  SJ.fichaCostos = function (p) {
    var l = gastosDePotrero(p);
    if (!l.length) return botonNuevo(p) + '<div class="vacio">' + esc(T('sinGastos')) + '</div>';
    var usd = 0, brl = 0, porZ = {}, porAct = {}, porPag = {}, hayComp = false;
    l.forEach(function (y) {
      var g = y.x.g; usd += y.usd; brl += y.brl; if (y.compartido) hayComp = true;
      var z = g.zafra || '—'; porZ[z] = (porZ[z] || 0) + y.usd;
      porAct[g.actividad] = (porAct[g.actividad] || 0) + y.usd;
      porPag[g.pagador] = (porPag[g.pagador] || 0) + y.usd;
    });
    var h = '<div class="resumen"><div class="tarjeta"><b>' + dinero(usd, 'USD') + '</b><span class="mut">' + dinero(brl, 'BRL') +
      '</span></div><div class="tarjeta"><b>' + dinero(usd / p.ha, 'USD') + esc(T('porHa')) + '</b><span class="mut">' + fmt(p.ha, 0) + ' ha</span></div></div>';
    function bloque(tit, obj, nom, orden, conHa) {
      var ks = orden || Object.keys(obj).sort(function (a, b) { return obj[b] - obj[a]; });
      return '<h3>' + esc(tit) + '</h3><div class="tarjeta"><table class="tabla-costos"><tbody>' + ks.filter(function (k) { return obj[k] !== undefined; })
        .map(function (k) {
          return '<tr><td>' + esc(nom(k)) + '</td><td class="num">' + dinero(obj[k], 'USD') + '</td>' +
            (conHa ? '<td class="num mut">' + dinero(obj[k] / p.ha, 'USD') + esc(T('porHa')) + '</td>' : '') + '</tr>';
        }).join('') + '</tbody></table></div>';
    }
    var ordZ = SJ.datos().periodos.concat(Object.keys(porZ).filter(function (z) { return SJ.datos().periodos.indexOf(z) < 0; }));
    h += bloque(T('porZafra'), porZ, function (z) { return z === '—' ? T('sinZafra') : SJ.etiquetaPer(z); }, ordZ, true);
    h += bloque(T('porActividad'), porAct, nombreAct, null, true) + bloque(T('porPagador'), porPag, function (k) { return k; });
    if (hayComp) h += '<div class="mut nota">' + esc(T('notaReparto')) + '</div>';
    return h + botonNuevo(p);
  };

  // ------------------------------------------------------------ eventos
  SJ.gastos = function () { return todosLosGastos().map(function (x) { return x.g; }); };
  SJ.vistas.gasto = vistaGasto;
  SJ.vistas.gastos = function () { recargar().then(vistaGastos); };
  SJ.vistas.costos = function () { recargar().then(vistaCostos); };
  SJ.vistas.detalleGasto = vistaDetalleGasto;

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-g-act],[data-g-mon],[data-g-pag],[data-g-guardar],[data-g-cancelar],[data-g-quitar-foto],[data-g-zafra],[data-g-detalle],[data-g-borrar],[data-g-csv],[data-g-nuevo-pot],[data-g-editar],[data-g-compartir],[data-g-quitar-previo]');
    if (!t) return;
    var d = t.dataset;
    if (d.gAct) { borrador.actividad = d.gAct; guardarBorrador(); dibujar(); }
    else if (d.gMon) { borrador.moneda = d.gMon; calcular(borrador); guardarBorrador(); dibujar(); }
    else if (d.gPag) { borrador.pagador = d.gPag; guardarBorrador(); dibujar(); }
    else if (d.gGuardar) guardar();
    else if (d.gCancelar) {
      var eraEdicion = borrador && borrador.editando ? borrador.id : null;
      borrador = null; SJ.kvSet('borradorGasto', null);
      if (eraEdicion) SJ.ir('detalleGasto', eraEdicion); else SJ.ir('gastos');
    }
    else if (d.gQuitarPrevio) { borrador.comprobanteUrl = ''; guardarBorrador(); dibujar(); }
    else if (d.gEditar) editarGasto(d.gEditar);
    else if (d.gCompartir) compartirGasto(d.gCompartir);
    else if (d.gQuitarFoto) { borrador.comprobante = null; guardarBorrador(); pintarFoto(); }
    else if (d.gZafra !== undefined) { filtroZafra = d.gZafra; SJ.vistas[$('#tela-costos').classList.contains('oculto') ? 'gastos' : 'costos'](); }
    else if (d.gDetalle) SJ.ir('detalleGasto', d.gDetalle);
    else if (d.gBorrar) borrarGasto(d.gBorrar);
    else if (d.gCsv) csv();
    else if (d.gNuevoPot) SJ.ir('gasto', { nuevo: true, potrero: d.gNuevoPot });
  });
  document.addEventListener('input', function (e) {
    var k = e.target.dataset && e.target.dataset.g;
    if (!k || !borrador) return;
    borrador[k] = e.target.value;
    if (k === 'cantidad') borrador._ultimo = 'cantidad';
    if (k === 'dosis_ha') borrador._ultimo = 'dosis';
    if (k === 'total') borrador._totalEditado = true;
    if (k === 'precio_unit' || k === 'cantidad' || k === 'dosis_ha') borrador._totalEditado = false;
    if (k === 'cultivo') borrador._cultivoEditado = true;
    if (k === 'zafra') borrador._zafraEditada = true;
    if (k === 'precio_unit') { borrador._precioFuente = ''; var pf = $('#tela-gasto .precio-fuente'); if (pf) pf.textContent = ''; }
    if (k === 'tipo_cambio') { borrador._tcEditado = true; borrador._tcFuente = ''; var tf = $('#tela-gasto .tc-fuente'); if (tf) tf.textContent = ''; }
    if (k === 'item_id') {
      var p = producto(e.target.value);
      borrador._precioFuente = '';
      if (p) {
        borrador.item = p.nombre; borrador.tipo_item = p.tipo; borrador.unidad = p.unidad; borrador.cuenta_contable = p.cuenta_contable || borrador.cuenta_contable;
        var sug = precioSugerido(p, borrador.id);
        if (sug) { borrador.precio_unit = sug.precio; borrador.moneda = sug.moneda; borrador._precioFuente = sug.fuente; borrador._totalEditado = false; }
      }
      calcular(borrador); guardarBorrador(); dibujar(); return;
    }
    if (k === 'zafra' || k === 'fecha' || k === 'ha') {
      if (k === 'fecha') { borrador.zafra = zafraPorDefecto(borrador.fecha); borrador._tcEditado = false; borrador._zafraEditada = false; }
      completar(borrador); guardarBorrador(); dibujar();
      if (k === 'fecha') aplicarPtax(borrador);
      return;
    }
    calcular(borrador);
    if (k === 'dosis_ha') { var c = $('#tela-gasto [data-g="cantidad"]'); if (c) c.value = borrador.cantidad; }
    var tt = $('#tela-gasto [data-g="total"]'); if (tt && k !== 'total') tt.value = borrador.total;
    refrescarEquiv(); guardarBorrador();
  });
  document.addEventListener('change', function (e) {
    var d = e.target.dataset || {};
    if (d.gPot && borrador) {
      var i = borrador.potreiro_ids.indexOf(d.gPot);
      if (e.target.checked && i < 0) borrador.potreiro_ids.push(d.gPot);
      if (!e.target.checked && i >= 0) borrador.potreiro_ids.splice(i, 1);
      completar(borrador); guardarBorrador();
      var det = $('#tela-gasto .selpot'), abierto = det && det.open; dibujar(); if (abierto) $('#tela-gasto .selpot').open = true;
    }
    if (d.gFoto && e.target.files.length) {
      var f = e.target.files[0];
      Promise.all([SJ.achicar(f, 1800, 0.75), SJ.achicar(f, 320, 0.6)]).then(function (r) {
        borrador.comprobante = { grande: r[0], mini: r[1] }; guardarBorrador(); pintarFoto();
      });
    }
  });

  SJ.alArrancar = (SJ.alArrancar || []).concat([recargar]);
})();
