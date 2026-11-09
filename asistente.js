/* Asistente de consultas — módulo de la app de visitas (Estância São José).
 * Manda la pregunta al servidor (Apps Script), que arma el contexto con la rotación, las visitas
 * y los gastos y le pregunta a Claude. Sin conexión contesta lo que puede calcular el teléfono
 * (asistente-local.js) y deja el resto en espera hasta que haya señal. La clave de Claude vive solo
 * en el servidor, nunca en el teléfono. */
(function () {
  'use strict';
  var SJ = window.SJ, esc = SJ.esc, $ = SJ.$, T = SJ.T;

  SJ.textos.es = Object.assign(SJ.textos.es, {
    asistenteT: 'Asistente', preguntar: 'Preguntar', escribiPregunta: 'Escribí tu pregunta…',
    pensando: 'Pensando…', necesitaConexion: 'El asistente necesita conexión (Starlink o el casco).',
    sinClaveIa: 'Falta cargar la clave de Claude en el servidor (ANTHROPIC_API_KEY).',
    errorIa: 'No pude responder:', borrarCharla: 'Nueva conversación',
    hablar: 'Hablar', escuchando: 'Escuchando… hablá ahora', vozNoDisponible: 'Este navegador no permite dictar acá: usá el micrófono del teclado.',
    vozError: 'No te escuché bien, probá de nuevo.', leerEnVoz: 'Leer respuestas en voz alta', leer: 'Leer', parar: 'Parar',
    enEspera: 'Sin conexión no puedo responder esto: necesito internet (Starlink o el casco). Dejé la pregunta en espera y la respondo sola cuando haya señal.',
    respondiEspera: 'Respondí una pregunta que estaba en espera.', sinInternet: '📴 Sin internet: calculado en el teléfono',
    esperandoSenal: '⏳ En espera de señal', vozSinRed: 'Sin conexión el dictado de este botón no funciona: usá el micrófono del teclado.',
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
    hablar: 'Falar', escuchando: 'Ouvindo… fale agora', vozNoDisponible: 'Este navegador não permite ditar aqui: use o microfone do teclado.',
    vozError: 'Não entendi bem, tente de novo.', leerEnVoz: 'Ler respostas em voz alta', leer: 'Ler', parar: 'Parar',
    enEspera: 'Sem conexão não consigo responder isto: preciso de internet (Starlink ou a sede). Deixei a pergunta em espera e respondo sozinho quando houver sinal.',
    respondiEspera: 'Respondi uma pergunta que estava em espera.', sinInternet: '📴 Sem internet: calculado no telefone',
    esperandoSenal: '⏳ Esperando sinal', vozSinRed: 'Sem conexão o ditado deste botão não funciona: use o microfone do teclado.',
    asistenteIntro: 'Pergunte sobre os potreiros, a rotação, as visitas e os gastos. Respondo com o que está registrado no app.',
    ejemplos: ['Quais potreiros estão em semente neste inverno e quantos hectares somam?',
      'Quanto já gastamos no Past. Casas 1,2 nesta safra, por hectare?',
      'Quais potreiros não foram visitados nos últimos 15 dias?',
      'Resuma as últimas visitas para mandar ao João Antonio.']
  });

  var charla = [], esperando = false, leerSiempre = false, escuchando = false, reconocedor = null;
  var Reconocimiento = window.SpeechRecognition || window.webkitSpeechRecognition;
  function idiomaVoz() { return SJ.idioma() === 'pt' ? 'pt-BR' : 'es-UY'; }

  // ---------------------------------------------------------------- voz: dictar la pregunta
  function dictar() {
    if (escuchando) { if (reconocedor) reconocedor.stop(); return; }
    if (!Reconocimiento) { SJ.aviso(T('vozNoDisponible')); return; }
    callar();
    reconocedor = new Reconocimiento();
    reconocedor.lang = idiomaVoz();
    reconocedor.interimResults = true;
    reconocedor.maxAlternatives = 1;
    var final = '';
    reconocedor.onresult = function (ev) {
      var parcial = '';
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) final += ev.results[i][0].transcript;
        else parcial += ev.results[i][0].transcript;
      }
      var c = $('#a-pregunta'); if (c) c.value = (final + parcial).trim();
    };
    reconocedor.onerror = function (ev) {
      if (ev.error === 'network') SJ.aviso(T('vozSinRed'));
      else if (ev.error !== 'aborted' && ev.error !== 'no-speech') SJ.aviso(T('vozError'));
    };
    reconocedor.onend = function () {
      escuchando = false; marcarMicro();
      var texto = (final || ($('#a-pregunta') || {}).value || '').trim();
      if (texto) enviar(texto);   // al terminar de hablar, se manda sola
    };
    escuchando = true; marcarMicro();
    try { reconocedor.start(); } catch (e) { escuchando = false; marcarMicro(); }
  }
  function marcarMicro() {
    var b = $('[data-a-micro]');
    if (b) { b.classList.toggle('grabando', escuchando); b.textContent = escuchando ? '■' : '🎤'; }
    var c = $('#a-pregunta'); if (c) c.placeholder = escuchando ? T('escuchando') : T('escribiPregunta');
  }

  // ---------------------------------------------------------------- voz: leer la respuesta
  function textoParaLeer(t) {
    return String(t).replace(/\*\*/g, '').replace(/^#+\s*/gm, '').replace(/^[-•]\s*/gm, '').replace(/US\$/g, 'dólares ').replace(/R\$/g, SJ.idioma() === 'pt' ? 'reais ' : 'reales ');
  }
  function leer(t) {
    if (!window.speechSynthesis) return;
    callar();
    var u = new SpeechSynthesisUtterance(textoParaLeer(t));
    u.lang = idiomaVoz();
    var voces = speechSynthesis.getVoices(), pref = idiomaVoz().slice(0, 2);
    var v = voces.filter(function (x) { return x.lang === idiomaVoz(); })[0] || voces.filter(function (x) { return x.lang.indexOf(pref) === 0; })[0];
    if (v) u.voice = v;
    u.rate = 1.05;
    speechSynthesis.speak(u);
  }
  function callar() { if (window.speechSynthesis) speechSynthesis.cancel(); }

  function burbujas() {
    if (!charla.length) {
      return '<div class="tarjeta mut">' + esc(T('asistenteIntro')) + '</div><div class="sugs">' +
        T('ejemplos').map(function (q) { return '<button type="button" data-a-ej="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '</div>';
    }
    return charla.map(function (m, i) {
      var boton = m.role === 'assistant' && !m.error && !m.aviso && window.speechSynthesis ? '<button type="button" class="a-leer" data-a-leer="' + i + '" aria-label="' + esc(T('leer')) + '">🔊</button>' : '';
      var marca = m.local ? '<div class="a-marca">' + esc(T('sinInternet')) + '</div>' : (m.pendiente ? '<div class="a-marca">' + esc(T('esperandoSenal')) + '</div>' : '');
      return '<div class="burbuja ' + (m.role === 'user' ? 'yo' : 'ia') + (m.error ? ' error' : '') + (m.aviso ? ' espera' : '') + '">' + marca + formato(m.content) + boton + '</div>';
    }).join('') + (esperando ? '<div class="burbuja ia mut">' + esc(T('pensando')) + '</div>' : '');
  }
  // Formato mínimo y seguro: escapa todo, después negritas y listas simples.
  function formato(t) {
    return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/^[-•] (.*)$/gm, '• $1').replace(/\n/g, '<br>');
  }
  function vista() {
    var h = '<h2>' + esc(T('asistenteT')) + '</h2><div id="a-charla">' + burbujas() + '</div>' +
      '<div class="a-entrada"><button class="a-micro" type="button" data-a-micro="1" aria-label="' + esc(T('hablar')) + '">🎤</button>' +
      '<textarea id="a-pregunta" placeholder="' + esc(T('escribiPregunta')) + '"></textarea>' +
      '<button class="btn" type="button" data-a-enviar="1"' + (esperando ? ' disabled' : '') + '>' + esc(T('preguntar')) + '</button></div>' +
      (window.speechSynthesis ? '<label class="a-opcion"><input type="checkbox" data-a-leer-siempre="1"' + (leerSiempre ? ' checked' : '') + '> 🔊 ' + esc(T('leerEnVoz')) + '</label>' : '') +
      (charla.length ? '<button class="btn sec chico" type="button" data-a-borrar="1">' + esc(T('borrarCharla')) + '</button>' : '');
    $('#tela-asistente').innerHTML = h;
    var s = $('#tela-asistente'); s.scrollTop = s.scrollHeight;
  }
  // ---------------------------------------------------------------- conexión, preguntas en espera
  function sinRed(e) { return e && (e.name === 'AbortError' || e instanceof TypeError || e.sinRed); }
  // ¿Hay internet de verdad? (el teléfono puede decir que sí estando sin señal útil)
  function hayConexion() {
    var cfg = SJ.cfg();
    if (!navigator.onLine || !cfg.url) return Promise.resolve(false);
    return SJ.fetchT(cfg.url + '?accion=ping&clave=' + encodeURIComponent(cfg.clave), {}, 8000)
      .then(function (r) { return r.ok; }).catch(function () { return false; });
  }
  function historialHasta(i) {
    return charla.slice(0, i).filter(function (m) { return !m.error && !m.aviso; })
      .map(function (m) { return { role: m.role, content: m.content }; });
  }
  function preguntarAlServidor(texto, historial) {
    var cfg = SJ.cfg();
    return SJ.fetchT(cfg.url, {
      method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ clave: cfg.clave, accion: 'consulta', pregunta: texto, historial: historial, usuario: cfg.usuario, idioma: cfg.idioma })
    }, 120000).then(function (r) { return r.json(); }).then(function (j) {
      if (!j.ok) throw new Error(j.error === 'sin-clave-ia' ? T('sinClaveIa') : j.error);
      return j.respuesta;
    });
  }
  function responder(texto, extra) {
    var m = Object.assign({ role: 'assistant', content: texto }, extra || {});
    charla.push(m);
    if (leerSiempre && !m.error) leer(texto);
  }
  // Sin internet: contesta lo que puede calcular el teléfono; si no puede, deja la pregunta en espera.
  function sinConexion(msgUsuario) {
    var local = SJ.respuestaLocal ? SJ.respuestaLocal(msgUsuario.content) : null;
    if (local) { responder(local, { local: true }); return; }
    msgUsuario.pendiente = true;
    responder(T('enEspera'), { aviso: true });
  }
  function enviar(texto) {
    texto = String(texto || '').trim();
    if (!texto || esperando) return;
    var msg = { role: 'user', content: texto };
    charla.push(msg);
    esperando = true; vista();
    hayConexion().then(function (ok) {
      if (!ok) { sinConexion(msg); return; }
      return preguntarAlServidor(texto, historialHasta(charla.length - 1)).then(function (r) { responder(r); })
        .catch(function (e) {
          if (sinRed(e)) sinConexion(msg);
          else responder(T('errorIa') + ' ' + e.message, { error: true });
        });
    }).then(function () {
      esperando = false; SJ.kvSet('charla', charla); SJ.pill(); vista();
    });
  }
  // Cuando vuelve la señal, responde las preguntas que quedaron en espera.
  var procesando = false;
  function procesarEspera() {
    var cola = charla.filter(function (m) { return m.pendiente; });
    if (procesando || !cola.length) return Promise.resolve();
    procesando = true;
    return hayConexion().then(function (ok) {
      if (!ok) return;
      return cola.reduce(function (pr, m) {
        return pr.then(function () {
          return preguntarAlServidor(m.content, historialHasta(charla.indexOf(m))).then(function (r) {
            m.pendiente = false;
            responder('↪ «' + m.content + '»\n\n' + r);
            SJ.aviso(T('respondiEspera'));
          }, function (e) {
            if (sinRed(e)) throw e;
            m.pendiente = false;
            responder(T('errorIa') + ' ' + e.message, { error: true });
          });
        });
      }, Promise.resolve());
    }).catch(function () {}).then(function () {
      procesando = false; SJ.kvSet('charla', charla); SJ.pill();
      if (!$('#tela-asistente').classList.contains('oculto')) vista();
    });
  }
  SJ.pendientesExtra.push(function () { return charla.filter(function (m) { return m.pendiente; }).length; });
  SJ.alSincronizar.push(function () { return procesarEspera(); });
  window.addEventListener('online', function () { setTimeout(procesarEspera, 3000); });

  SJ.vistas.asistente = vista;
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-a-enviar],[data-a-ej],[data-a-borrar],[data-a-micro],[data-a-leer]');
    if (!t) return;
    if (t.dataset.aEnviar) enviar($('#a-pregunta').value);
    else if (t.dataset.aEj) enviar(t.dataset.aEj);
    else if (t.dataset.aBorrar) { callar(); charla = []; SJ.kvSet('charla', charla); vista(); }
    else if (t.dataset.aMicro) dictar();
    else if (t.dataset.aLeer !== undefined) {
      if (window.speechSynthesis && speechSynthesis.speaking) callar(); else leer(charla[Number(t.dataset.aLeer)].content);
    }
  });
  document.addEventListener('change', function (e) {
    if (e.target.dataset && e.target.dataset.aLeerSiempre) { leerSiempre = e.target.checked; SJ.kvSet('leerSiempre', leerSiempre); if (!leerSiempre) callar(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.target.id === 'a-pregunta' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(e.target.value); }
  });
  SJ.alArrancar = (SJ.alArrancar || []).concat([function () {
    if (window.speechSynthesis) speechSynthesis.getVoices();   // algunos navegadores cargan las voces tarde
    return Promise.all([SJ.kvGet('charla'), SJ.kvGet('leerSiempre')]).then(function (r) {
      charla = (r[0] || []).filter(function (m) { return !m.error; }); leerSiempre = !!r[1];
      setTimeout(procesarEspera, 4000);   // si quedó algo en espera y ahora hay señal
    });
  }]);
})();
