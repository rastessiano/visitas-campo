/* Asistente de consultas — módulo de la app de visitas (Estância São José).
 * Manda la pregunta al servidor (Apps Script), que arma el contexto con la rotación, las visitas
 * y los gastos y le pregunta a Claude. Necesita conexión. La clave de Claude vive solo en el
 * servidor, nunca en el teléfono. */
(function () {
  'use strict';
  var SJ = window.SJ, esc = SJ.esc, $ = SJ.$, T = SJ.T;

  SJ.textos.es = Object.assign(SJ.textos.es, {
    asistenteT: 'Asistente', preguntar: 'Preguntar', escribiPregunta: 'Escribí tu pregunta…',
    pensando: 'Pensando…', necesitaConexion: 'El asistente necesita conexión (Starlink o el casco).',
    sinClaveIa: 'Falta cargar la clave de Claude en el servidor (ANTHROPIC_API_KEY).',
    errorIa: 'No pude responder:', borrarCharla: 'Nueva conversación',
    asistenteIntro: 'Preguntá sobre los potreros, la rotación, las visitas y los gastos. Respondo con lo que está cargado en la app.',
    ejemplos: ['¿Qué potreros están en semilla este invierno y cuántas hectáreas suman?',
      '¿Cuánto llevamos gastado en Past. Casas 1,2 esta zafra, por hectárea?',
      '¿Qué potreros no se visitaron en los últimos 15 días?',
      'Resumime las últimas visitas para mandarle a João Antonio.']
  });
  SJ.textos.pt = Object.assign(SJ.textos.pt, {
    asistenteT: 'Assistente', preguntar: 'Perguntar', escribiPregunta: 'Escreva sua pergunta…',
    pensando: 'Pensando…', necesitaConexion: 'O assistente precisa de conexão (Starlink ou a sede).',
    sinClaveIa: 'Falta carregar a chave do Claude no servidor (ANTHROPIC_API_KEY).',
    errorIa: 'Não consegui responder:', borrarCharla: 'Nova conversa',
    asistenteIntro: 'Pergunte sobre os potreiros, a rotação, as visitas e os gastos. Respondo com o que está registrado no app.',
    ejemplos: ['Quais potreiros estão em semente neste inverno e quantos hectares somam?',
      'Quanto já gastamos no Past. Casas 1,2 nesta safra, por hectare?',
      'Quais potreiros não foram visitados nos últimos 15 dias?',
      'Resuma as últimas visitas para mandar ao João Antonio.']
  });

  var charla = [], esperando = false;

  function burbujas() {
    if (!charla.length) {
      return '<div class="tarjeta mut">' + esc(T('asistenteIntro')) + '</div><div class="sugs">' +
        T('ejemplos').map(function (q) { return '<button type="button" data-a-ej="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div>';
    }
    return charla.map(function (m) {
      return '<div class="burbuja ' + (m.role === 'user' ? 'yo' : 'ia') + (m.error ? ' error' : '') + '">' + formato(m.content) + '</div>';
    }).join('') + (esperando ? '<div class="burbuja ia mut">' + esc(T('pensando')) + '</div>' : '');
  }
  // Formato mínimo y seguro: escapa todo, después negritas y listas simples.
  function formato(t) {
    return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^[-•] (.*)$/gm, '• $1').replace(/\n/g, '<br>');
  }
  function vista() {
    var h = '<h2>' + esc(T('asistenteT')) + '</h2><div id="a-charla">' + burbujas() + '</div>' +
      '<div class="a-entrada"><textarea id="a-pregunta" placeholder="' + esc(T('escribiPregunta')) + '"></textarea>' +
      '<button class="btn" type="button" data-a-enviar="1"' + (esperando ? ' disabled' : '') + '>' + esc(T('preguntar')) + '</button></div>' +
      (charla.length ? '<button class="btn sec chico" type="button" data-a-borrar="1">' + esc(T('borrarCharla')) + '</button>' : '');
    $('#tela-asistente').innerHTML = h;
    var s = $('#tela-asistente'); s.scrollTop = s.scrollHeight;
  }
  function enviar(texto) {
    texto = String(texto || '').trim();
    if (!texto || esperando) return;
    var cfg = SJ.cfg();
    if (!cfg.url || !cfg.clave) { SJ.aviso(T('faltaServidor')); return; }
    var historial = charla.filter(function (m) { return !m.error; }).map(function (m) { return { role: m.role, content: m.content }; });
    charla.push({ role: 'user', content: texto });
    esperando = true; vista();
    SJ.fetchT(cfg.url, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ clave: cfg.clave, accion: 'consulta', pregunta: texto, historial: historial, usuario: cfg.usuario, idioma: cfg.idioma })
    }, 120000).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.ok) throw new Error(j.error === 'sin-clave-ia' ? T('sinClaveIa') : j.error);
      charla.push({ role: 'assistant', content: j.respuesta });
    }).catch(function (e) {
      var msg = e.name === 'AbortError' || e instanceof TypeError ? T('necesitaConexion') : T('errorIa') + ' ' + e.message;
      charla.push({ role: 'assistant', content: msg, error: true });
    }).then(function () {
      esperando = false; SJ.kvSet('charla', charla); vista();
    });
  }

  SJ.vistas.asistente = vista;
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-a-enviar],[data-a-ej],[data-a-borrar]');
    if (!t) return;
    if (t.dataset.aEnviar) enviar($('#a-pregunta').value);
    else if (t.dataset.aEj) enviar(t.dataset.aEj);
    else if (t.dataset.aBorrar) { charla = []; SJ.kvSet('charla', charla); vista(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.target.id === 'a-pregunta' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(e.target.value); }
  });
  SJ.alArrancar = (SJ.alArrancar || []).concat([function () {
    return SJ.kvGet('charla').then(function (c) { charla = (c || []).filter(function (m) { return !m.error; }); });
  }]);
})();
