/* Respuestas sin internet — el teléfono contesta las preguntas que puede calcular solo con lo que
 * tiene guardado: hectáreas por cultivo y estación, qué hay en un potrero, gastos y visitas.
 * Si la pregunta no encaja en ninguno de esos casos devuelve null y el asistente avisa que hace
 * falta conexión. */
(function () {
  'use strict';
  var SJ = window.SJ;

  function L(es, pt) { return SJ.idioma() === 'pt' ? pt : es; }
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[.,;:¿?¡!()"'«»/]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function fmt(n, d) {
    return Number(n || 0).toLocaleString(SJ.idioma() === 'pt' ? 'pt-BR' : 'es-UY', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  }
  function num(x) { var n = parseFloat(String(x === undefined || x === null ? '' : x).replace(',', '.')); return isNaN(n) ? 0 : n; }
  function etiqueta(per) { return per ? SJ.etiquetaPer(per) : L('ahora', 'agora'); }
  function nomCat(c) { return SJ.T(c); }

  // ------------------------------------------------------------ qué menciona la pregunta
  function potrerosMencionados(q) {
    var d = SJ.datos(), alias = [];
    d.potreiros.forEach(function (p) {
      var n = norm(p.nome).replace(/^past /, '');
      alias.push([n, p]);
      if (/casas/.test(n)) alias.push([n.replace(/ /g, ''), p], [n.replace(/(\d) (\d)/, '$1$2'), p]);
    });
    alias.sort(function (a, b) { return b[0].length - a[0].length; });
    var hallados = [], txt = ' ' + q + ' ';
    alias.forEach(function (a) {
      var pat = ' ' + a[0] + ' ';
      if (txt.indexOf(pat) >= 0 && hallados.indexOf(a[1]) < 0) { hallados.push(a[1]); txt = txt.split(pat).join(' '); }
    });
    var m = txt.match(/\b(?:potrero|potreiro|numero|nro|n)\s*(\d{1,2})\b/);
    if (m) d.potreiros.forEach(function (p) { if (p.poligono === Number(m[1]) && hallados.indexOf(p) < 0) hallados.push(p); });
    return hallados;
  }
  function periodoMencionado(q) {
    var d = SJ.datos(), m, hoy = new Date(), mes = hoy.getMonth() + 1;
    if ((m = q.match(/\binv(?:ierno|erno)?\s*(?:20)?(\d{2})\b/))) return 'inv ' + m[1];
    if ((m = q.match(/\bver(?:ano|ao)?\s*(?:20)?(\d{2})\s*(?:-|a|y|e)?\s*(?:20)?(\d{2})\b/))) {
      var c = d.periodos.filter(function (p) { return /^\d/.test(p) && p.slice(-5) === m[1] + '-' + m[2]; });
      if (c.length) return c[0];
    }
    if ((m = q.match(/\bzafra\s*(?:20)?(\d{2})\s*-?\s*(?:20)?(\d{2})\b/))) {
      var z = d.periodos.filter(function (p) { return /^\d/.test(p) && p.slice(-5) === m[1] + '-' + m[2]; });
      if (z.length) return z[0];
    }
    if (/proximo invierno|proximo inverno/.test(q)) return SJ.invernoSiguiente(hoy);
    if (/este invierno|este inverno|neste inverno/.test(q)) return mes >= 5 && mes <= 10 ? 'inv ' + (hoy.getFullYear() % 100) : SJ.invernoSiguiente(hoy);
    return null;
  }
  function categoriaMencionada(q) {
    if (/semill|sement|semente/.test(q)) return 'semente';
    if (/pastur|pastagem|verdeo|verdeio|pastoreo|pastejo/.test(q)) return 'pastagem';
    if (/\bsoja\b/.test(q)) return 'soja';
    if (/\barroz\b/.test(q)) return 'arroz';
    if (/nativo|\bcn\b/.test(q)) return 'nativo';
    if (/rastrojo|resteva/.test(q)) return 'resteva';
    return null;
  }
  function tipoEn(p, per) {
    if (!per) return SJ.usoAhora(p);
    var uso = p.rotacao[per] || '', t = SJ.clasificar(uso);
    return { uso: uso, tipo: t, cat: SJ.categoria(t), per: per };
  }

  // ------------------------------------------------------------ respuestas
  function hectareas(q, per, cat) {
    var d = SJ.datos(), grupos = {};
    d.potreiros.forEach(function (p) {
      var u = tipoEn(p, per);
      (grupos[u.cat] = grupos[u.cat] || []).push({ p: p, uso: u.uso });
    });
    var total = d.potreiros.reduce(function (a, p) { return a + p.ha; }, 0);
    if (cat) {
      var l = grupos[cat] || [], ha = l.reduce(function (a, x) { return a + x.p.ha; }, 0);
      if (!l.length) return L('En ', 'Em ') + etiqueta(per) + L(' no hay potreros de ', ' não há potreiros de ') + nomCat(cat).toLowerCase() + '.';
      return '**' + fmt(ha, 1) + ' ha** ' + L('de ', 'de ') + nomCat(cat).toLowerCase() + ' (' + etiqueta(per) + '), ' + l.length + ' ' + L('potreros', 'potreiros') + ':\n' +
        l.sort(function (a, b) { return b.p.ha - a.p.ha; }).map(function (x) {
          return '- ' + x.p.poligono + '. ' + x.p.nome + ': ' + fmt(x.p.ha, 1) + ' ha (' + x.uso + ')';
        }).join('\n');
    }
    return L('Uso del campo', 'Uso do campo') + ' (' + etiqueta(per) + '), ' + fmt(total) + ' ha:\n' +
      Object.keys(grupos).sort(function (a, b) {
        return grupos[b].reduce(function (s, x) { return s + x.p.ha; }, 0) - grupos[a].reduce(function (s, x) { return s + x.p.ha; }, 0);
      }).map(function (c) {
        return '- ' + (c === 'outro' ? L('Sin definir', 'Sem definir') : nomCat(c)) + ': **' + fmt(grupos[c].reduce(function (s, x) { return s + x.p.ha; }, 0), 1) + ' ha** (' + grupos[c].length + ')';
      }).join('\n');
  }

  function gastos(q, pots, per) {
    var lista = (SJ.gastos ? SJ.gastos() : []);
    if (per) lista = lista.filter(function (g) { return g.zafra === per; });
    var usd = 0, brl = 0, n = 0, porAct = {}, haPots = pots.reduce(function (a, p) { return a + p.ha; }, 0);
    lista.forEach(function (g) {
      var parte = 1;
      if (pots.length) {
        var ids = g.potreiro_ids || [];
        var comunes = pots.filter(function (p) { return ids.indexOf(p.id) >= 0; });
        if (!comunes.length) return;
        var haG = ids.reduce(function (a, id) { var p = SJ.potrero(id); return a + (p ? p.ha : 0); }, 0);
        parte = haG ? comunes.reduce(function (a, p) { return a + p.ha; }, 0) / haG : 1;   // parte por hectáreas
      }
      usd += num(g.total_usd) * parte; brl += num(g.total_brl) * parte; n++;
      var act = (SJ.T('actividades') || {})[g.actividad] || g.actividad || '—';
      porAct[act] = (porAct[act] || 0) + num(g.total_usd) * parte;
    });
    var donde = pots.length ? pots.map(function (p) { return p.nome; }).join(', ') : L('todo el campo', 'todo o campo');
    if (!n) return L('No hay gastos cargados para ', 'Não há gastos registrados para ') + donde + (per ? ' (' + etiqueta(per) + ')' : '') + L(' en este teléfono.', ' neste telefone.');
    var r = L('Gastos en ', 'Gastos em ') + donde + (per ? ' (' + etiqueta(per) + ')' : '') + ': **US$ ' + fmt(usd) + '** (R$ ' + fmt(brl) + '), ' + n + ' ' + L('registros', 'registros') + '.';
    if (haPots) r += '\n' + L('Por hectárea: ', 'Por hectare: ') + '**US$ ' + fmt(usd / haPots, 1) + '/ha** (' + fmt(haPots, 1) + ' ha).';
    var acts = Object.keys(porAct).sort(function (a, b) { return porAct[b] - porAct[a]; }).slice(0, 4);
    if (acts.length > 1) r += '\n' + acts.map(function (a) { return '- ' + a + ': US$ ' + fmt(porAct[a]); }).join('\n');
    return r;
  }

  function visitas(q, pots) {
    var l = SJ.visitas().slice().sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); });
    var sinVisita = /no se visit|sin visit|nao foram visit|sem visit|no visit|nao visit/.test(q);
    if (sinVisita) {
      var m = q.match(/(\d+)\s*(?:dias|dia)/), dias = m ? Number(m[1]) : 15;
      var lim = new Date(Date.now() - dias * 864e5).toISOString().slice(0, 10);
      var faltan = SJ.datos().potreiros.filter(function (p) {
        return !l.some(function (v) { return v.potreiro_id === p.id && String(v.fecha).slice(0, 10) >= lim; });
      });
      if (!faltan.length) return L('Todos los potreros tienen visita en los últimos ', 'Todos os potreiros têm visita nos últimos ') + dias + L(' días.', ' dias.');
      return '**' + faltan.length + L(' potreros sin visita', ' potreiros sem visita') + '** ' + L('en los últimos ', 'nos últimos ') + dias + L(' días', ' dias') + ':\n' +
        faltan.map(function (p) { return '- ' + p.poligono + '. ' + p.nome; }).join('\n');
    }
    if (pots.length) l = l.filter(function (v) { return pots.some(function (p) { return p.id === v.potreiro_id; }); });
    if (!l.length) return L('No hay visitas cargadas', 'Não há visitas registradas') + (pots.length ? L(' en ', ' em ') + pots.map(function (p) { return p.nome; }).join(', ') : '') + '.';
    var est = SJ.T('estados');
    return '**' + l.length + ' ' + L('visitas', 'visitas') + '**' + (pots.length ? L(' en ', ' em ') + pots.map(function (p) { return p.nome; }).join(', ') : '') + '. ' + L('Últimas:', 'Últimas:') + '\n' +
      l.slice(0, 5).map(function (v) {
        return '- ' + String(v.fecha).replace('T', ' ').slice(0, 10) + ' · ' + v.potreiro + ' · ' + (v.usuario || '') +
          (v.estado ? ' · ' + est[Number(v.estado) - 1] : '') + (v.observaciones ? ' — ' + String(v.observaciones).slice(0, 80) : '');
      }).join('\n');
  }

  function fichaPotrero(p) {
    var u = SJ.usoAhora(p), d = SJ.datos();
    var i = d.periodos.indexOf(u.per), sig = i >= 0 && i < d.periodos.length - 1 ? d.periodos[i + 1] : null;
    var vis = SJ.visitas().filter(function (v) { return v.potreiro_id === p.id; }).sort(function (a, b) { return String(b.fecha).localeCompare(String(a.fecha)); })[0];
    var r = '**' + p.poligono + '. ' + p.nome + '** (' + fmt(p.ha, 1) + ' ha)\n' +
      '- ' + L('Ahora: ', 'Agora: ') + (u.uso || '—') + (u.colheita ? ' (' + SJ.T('colheita') + ')' : '') + '\n' +
      '- ' + L('Plan del mes: ', 'Plano do mês: ') + (u.mes || '—') + '\n' +
      (sig ? '- ' + L('Después ', 'Depois ') + '(' + etiqueta(sig) + '): ' + (p.rotacao[sig] || '—') + '\n' : '') +
      '- ' + L('Última visita: ', 'Última visita: ') + (vis ? String(vis.fecha).slice(0, 10) + ' (' + (vis.usuario || '') + ')' : L('ninguna', 'nenhuma'));
    var g = gastos('', [p], null);
    if (!/^No hay|^Não há/.test(g)) r += '\n- ' + g.split('\n')[0];
    return r;
  }

  // ------------------------------------------------------------ entrada
  SJ.respuestaLocal = function (texto) {
    if (!SJ.datos()) return null;
    var q = norm(texto), pots = potrerosMencionados(q), per = periodoMencionado(q), cat = categoriaMencionada(q);
    // Pedidos que necesitan razonar o redactar: los responde la IA cuando haya conexión.
    if (/recomend|suger|conviene|convem|deberi|deveri|armame|arma |armar|escrib|redact|plan de|plano de|analiz|explic|por que|porque|compar|aconsej|que hago|que hacemos|o que faco|resum|mandar|manda|prepar|proyect|estim|calcul.*(dosis|rinde)|cuando (siemb|cosech|aplic|cierr)/.test(q)) return null;
    if (/visit|vistori|recorri/.test(q)) return visitas(q, pots);
    if (/gast|costo|custo|cuanto (se )?(llevamos|gastamos|invert)|quanto (ja )?gastamos|plata|dinero|dinheiro/.test(q)) return gastos(q, pots, per);
    if (cat || /hectar|\bha\b|cuantos potreros|cuantas hectareas|quantos potreiros|que potreros|quais potreiros|uso del campo|uso do campo/.test(q)) {
      if (pots.length === 1 && !cat) return fichaPotrero(pots[0]);
      return hectareas(q, per, cat);
    }
    if (pots.length === 1) return fichaPotrero(pots[0]);
    if (pots.length > 1) return pots.map(fichaPotrero).join('\n\n');
    return null;
  };
})();
