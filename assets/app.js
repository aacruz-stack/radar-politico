/* Radar Político — front-end estático. Lê data/*.json e renderiza por hash (#/painel, #/p/casa/id ...). */
(function () {
  'use strict';

  var CASAS = {
    camara: { nome: 'Câmara dos Deputados', curto: 'Deputados federais', cargo: 'Deputado Federal', verba: 'Cota parlamentar (CEAP)' },
    senado: { nome: 'Senado Federal', curto: 'Senadores', cargo: 'Senador', verba: 'Verba indenizatória (CEAPS)' },
    alesp: { nome: 'Assembleia Legislativa de SP', curto: 'Deputados estaduais (SP)', cargo: 'Deputado Estadual de São Paulo', verba: 'Verba de gabinete' },
    cmsp: { nome: 'Câmara Municipal de SP', curto: 'Vereadores (SP)', cargo: 'Vereador de São Paulo', verba: 'Verba de gabinete' }
  };
  var ORDEM = ['camara', 'senado', 'alesp', 'cmsp'];
  var TABS = [['painel', 'Painel'], ['parlamentares', 'Parlamentares'], ['votacoes', 'Votações'],
              ['executivo', 'Executivo'], ['salarios', 'Salários'], ['fontes', 'Fontes e limites']];
  var MESES = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

  var D = { casas: {}, salarios: null, executivo: null, fichas: {}, meta: null };
  var view = document.getElementById('view');
  var estado = { casa: 'todos', pcasa: 'camara', dsel: 'presidente', dq: '', q: '', partido: '', uf: '', ordem: 'gasto', vcasa: '', vq: '', vdias: '120' };

  /* ---------- utilidades ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function seguro(u) { return /^https?:\/\//i.test(u || '') ? u : ''; }
  var brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  var brl2 = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  function R(v) { return brl.format(v || 0); }
  function R2(v) { return brl2.format(v || 0); }
  function dataBR(iso) {
    if (!iso) return '—';
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    return m ? m[3] + '/' + m[2] + '/' + m[1] : iso;
  }
  function dataHora(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  }
  function norm(s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function fetchJSON(u) {
    return fetch(u, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(u + ' ' + r.status); return r.json(); });
  }
  function anoDados(casa) {
    var anos = {};
    (D.casas[casa].parlamentares || []).forEach(function (p) { Object.keys(p.gastos || {}).forEach(function (a) { anos[a] = 1; }); });
    return Object.keys(anos).sort().reverse();
  }
  function gastoAno(p, ano) { return (p.gastos && p.gastos[ano] && p.gastos[ano].total) || 0; }
  function salarioDe(casa) {
    var alvo = CASAS[casa].cargo;
    return ((D.salarios && D.salarios.cargos) || []).filter(function (s) { return s.cargo === alvo; })[0];
  }
  function linkFonte(url, rotulo) {
    return seguro(url) ? '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(rotulo || 'fonte oficial') + '</a>' : '';
  }
  function pessoa(p, casa) {
    var foto = seguro(p.foto);
    return '<span class="person">' + (foto ? '<img class="avatar" loading="lazy" alt="" src="' + esc(foto) + '">' : '<span class="avatar"></span>') +
      '<span><b>' + esc(p.nome) + '</b><br><span class="muted small">' + esc(p.partido || 's/ partido') + ' · ' + esc(p.uf || '') + '</span></span></span>';
  }
  function votoPill(v) {
    if (v === 'Sim') return '<span class="pill sim">SIM</span>';
    if (v === 'Não') return '<span class="pill nao">NÃO</span>';
    return '<span class="pill abs">' + esc(String(v || '—').toUpperCase().slice(0, 10)) + '</span>';
  }
  function indice(casa) {
    var c = D.casas[casa];
    if (!c._idx) { c._idx = {}; c.parlamentares.forEach(function (p) { c._idx[p.id] = p; }); }
    return c._idx;
  }

  /* ---------- painel ---------- */
  function vPainel() {
    var casa = estado.pcasa, anos = anoDados(casa), ano = estado.ano && anos.indexOf(estado.ano) >= 0 ? estado.ano : anos[0];
    estado.ano = ano;
    var ps = D.casas[casa].parlamentares;
    var comGasto = ps.filter(function (p) { return gastoAno(p, ano) > 0; });
    var total = comGasto.reduce(function (s, p) { return s + gastoAno(p, ano); }, 0);
    var rank = comGasto.slice().sort(function (a, b) { return gastoAno(b, ano) - gastoAno(a, ano); });
    var max = rank.length ? gastoAno(rank[0], ano) : 1;
    var porPartido = {};
    comGasto.forEach(function (p) {
      var k = p.partido || 's/ partido';
      var x = porPartido[k] || (porPartido[k] = { n: 0, total: 0 });
      x.n++; x.total += gastoAno(p, ano);
    });
    var partidos = Object.keys(porPartido).map(function (k) { return { p: k, n: porPartido[k].n, t: porPartido[k].total, m: porPartido[k].total / porPartido[k].n }; })
      .sort(function (a, b) { return b.m - a.m; });
    var sal = salarioDe(casa);
    var h = '<h2>Quem mais gasta</h2><p class="muted">' + esc(CASAS[casa].verba) + ' · ' + esc(ano) + ' (ano em curso é parcial)</p>' + seletorCasa('pcasa', 'painel');
    if (!comGasto.length) {
      return h + '<div class="notice warn">Sem dados de gastos para esta casa. ' +'' + '</div>';
    }
    h += '<div class="kpis"><div class="card kpi"><div class="l">Total gasto</div><div class="v">' + R(total) + '</div></div>' +
      '<div class="card kpi"><div class="l">Média por parlamentar</div><div class="v">' + R(total / comGasto.length) + '</div></div>' +
      '<div class="card kpi"><div class="l">Maior gasto individual</div><div class="v">' + R(max) + '</div></div>' +
      (sal ? '<div class="card kpi"><div class="l">Salário bruto mensal</div><div class="v">' + R(sal.valor) + '</div></div>' : '') + '</div>';
    h += '<div class="controls"><label class="muted small">Ano <select id="ano">' + anos.map(function (a) { return '<option' + (a === ano ? ' selected' : '') + '>' + esc(a) + '</option>'; }).join('') + '</select></label></div>';
    h += '<h3>Ranking individual (top 25)</h3><div class="tablewrap"><table><thead><tr><th>#</th><th>Parlamentar</th><th class="num">Gasto</th><th>Proporção do maior</th></tr></thead><tbody>';
    rank.slice(0, 25).forEach(function (p, i) {
      h += '<tr class="link" data-go="#/p/' + casa + '/' + esc(p.id) + '"><td>' + (i + 1) + '</td><td>' + pessoa(p) + '</td><td class="num">' + R(gastoAno(p, ano)) + '</td><td style="min-width:120px"><div class="bar"><i style="width:' + (100 * gastoAno(p, ano) / max).toFixed(1) + '%"></i></div></td></tr>';
    });
    h += '</tbody></table></div><h3 style="margin-top:20px">Por partido (média por parlamentar)</h3><div class="tablewrap"><table><thead><tr><th>Partido</th><th class="num">Parlamentares</th><th class="num">Total</th><th class="num">Média</th></tr></thead><tbody>';
    partidos.forEach(function (x) { h += '<tr><td>' + esc(x.p) + '</td><td class="num">' + x.n + '</td><td class="num">' + R(x.t) + '</td><td class="num">' + R(x.m) + '</td></tr>'; });
    return h + '</tbody></table></div><p style="margin-top:12px"><a href="#/parlamentares" data-set-casa="' + casa + '">Ver todos os ' + ps.length + ' (' + esc(CASAS[casa].curto.toLowerCase()) + ') com o gasto de cada um &rarr;</a></p>' + fonteCasa(casa);
  }
  function fonteCasa(casa) {
    var c = D.casas[casa];
    return '<p class="sticky-note">Fonte: ' + (c.fontes || []).map(function (f) { return linkFonte(f, f.replace(/^https?:\/\//, '')); }).join(' · ') + ' · atualizado em ' + esc(dataHora(c.atualizadoEm)) + '</p>';
  }
  function seletorCasa(chave, rota, comTodos) {
    var itens = (comTodos ? [['todos', 'Todos']] : []).concat(ORDEM.map(function (k) { return [k, CASAS[k].curto]; }));
    return '<div class="controls" role="group" aria-label="Casa legislativa">' + itens.map(function (x) {
      return '<button class="chip" data-set="' + chave + '" data-val="' + x[0] + '" aria-pressed="' + (estado[chave] === x[0]) + '">' + esc(x[1]) + '</button>';
    }).join('') + '</div>';
  }
  function todosPoliticos() {
    if (!D._todos) {
      D._todos = [];
      ORDEM.forEach(function (k) { D.casas[k].parlamentares.forEach(function (p) { D._todos.push(Object.assign({}, p, { _casa: k })); }); });
    }
    return D._todos;
  }
  function anosTodos() {
    var a = {};
    ORDEM.forEach(function (k) { anoDados(k).forEach(function (x) { a[x] = 1; }); });
    return Object.keys(a).sort().reverse();
  }

  /* ---------- lista de parlamentares ---------- */
  function vParlamentares() {
    var casa = estado.casa, todos = casa === 'todos';
    var ps = todos ? todosPoliticos() : D.casas[casa].parlamentares, anos = todos ? anosTodos() : anoDados(casa), ano = anos[0];
    var partidos = {}, ufs = {};
    ps.forEach(function (p) { if (p.partido) partidos[p.partido] = 1; if (p.uf) ufs[p.uf] = 1; });
    var lista = ps.filter(function (p) {
      return (!estado.partido || p.partido === estado.partido) && (!estado.uf || p.uf === estado.uf) &&
        (!estado.q || norm(p.nome).indexOf(norm(estado.q)) >= 0);
    });
    lista.sort(estado.ordem === 'gasto' && ano ? function (a, b) { return gastoAno(b, ano) - gastoAno(a, ano); } : function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); });
    var h = '<h2>Todos os parlamentares e quanto gastam</h2>' + seletorCasa('casa', null, true) +
      '<div class="controls"><input type="search" id="q" placeholder="Buscar por nome" aria-label="Buscar por nome" value="' + esc(estado.q) + '">' +
      '<select id="fpartido" aria-label="Partido"><option value="">Todos os partidos</option>' + Object.keys(partidos).sort().map(function (k) { return '<option' + (k === estado.partido ? ' selected' : '') + '>' + esc(k) + '</option>'; }).join('') + '</select>' +
      (Object.keys(ufs).length > 1 ? '<select id="fuf" aria-label="UF"><option value="">Todas as UFs</option>' + Object.keys(ufs).sort().map(function (k) { return '<option' + (k === estado.uf ? ' selected' : '') + '>' + esc(k) + '</option>'; }).join('') + '</select>' : '') +
      '<select id="ordem" aria-label="Ordenar"><option value="gasto"' + (estado.ordem === 'gasto' ? ' selected' : '') + '>Maior gasto primeiro</option><option value="nome"' + (estado.ordem === 'nome' ? ' selected' : '') + '>Ordem alfabética</option></select></div>' +
      '<p class="muted small">' + lista.length + ' resultado(s)' + (ano ? ' · gasto de ' + esc(ano) : '') + '</p>' +
      '<div class="tablewrap"><table><thead><tr><th>Parlamentar</th>' + (todos ? '<th>Casa</th>' : '') + '<th class="num">Gasto ' + esc(ano || '') + '</th></tr></thead><tbody>';
    var limite = todos ? 3000 : 1000;
    lista.slice(0, limite).forEach(function (p) {
      var k = p._casa || casa;
      h += '<tr class="link" data-go="#/p/' + k + '/' + esc(p.id) + '"><td>' + pessoa(p) + '</td>' + (todos ? '<td class="small muted">' + esc(CASAS[k].curto) + '</td>' : '') + '<td class="num">' + (ano && gastoAno(p, ano) ? R(gastoAno(p, ano)) : '—') + '</td></tr>';
    });
    return h + '</tbody></table></div>';
  }

  /* ---------- perfil ---------- */
  function vPerfil(casa, id) {
    var p = D.casas[casa] && indice(casa)[id];
    if (!p) return '<div class="notice warn">Parlamentar não encontrado.</div>';
    var sal = salarioDe(casa), anos = anoDados(casa);
    var h = '<p><a href="#/parlamentares" data-back>&larr; voltar</a></p><div class="person" style="gap:16px">' +
      (seguro(p.foto) ? '<img class="avatar big" alt="Foto de ' + esc(p.nome) + '" src="' + esc(p.foto) + '">' : '<span class="avatar big"></span>') +
      '<div><h2>' + esc(p.nome) + '</h2><div class="muted">' + esc(CASAS[casa].cargo) + ' · ' + esc(p.partido || 's/ partido') + ' · ' + esc(p.uf || '') + '</div>' +
      (p.email ? '<div class="small muted">' + esc(p.email) + '</div>' : '') + '</div></div>';
    h += '<div class="kpis" style="margin-top:16px">';
    if (sal) h += '<div class="card kpi"><div class="l">Salário bruto mensal</div><div class="v">' + R(sal.valor) + '</div><div class="small muted">' + esc(sal.referencia) + '</div></div>';
    anos.forEach(function (a) {
      var g = p.gastos && p.gastos[a];
      if (!g) return;
      var meses = g.porMes.filter(function (x) { return x > 0; }).length || 1;
      h += '<div class="card kpi"><div class="l">' + esc(CASAS[casa].verba) + ' ' + esc(a) + '</div><div class="v">' + R(g.total) + '</div><div class="small muted">' + g.qtd + ' lançamentos · média ' + R(g.total / meses) + '/mês</div></div>';
    });
    h += '</div>';
    anos.forEach(function (a) {
      var g = p.gastos && p.gastos[a];
      if (!g) return;
      var mx = Math.max.apply(null, g.porMes) || 1;
      h += '<div class="card" style="margin-top:12px"><h3>Gasto por mês em ' + esc(a) + '</h3><div class="months" role="img" aria-label="Gasto mensal">' +
        g.porMes.map(function (v, i) { return '<div title="' + esc(MESES[i] + ': ' + R(v)) + '" style="height:' + Math.max(1, 100 * v / mx) + '%"></div>'; }).join('') +
        '</div><div class="mlabels">' + MESES.map(function (m) { return '<span>' + m + '</span>'; }).join('') + '</div>' +
        '<div class="two" style="margin-top:14px"><div><h3>Por categoria</h3>' + tabelaPares(Object.keys(g.porCategoria).slice(0, 8).map(function (k) { return [k, g.porCategoria[k]]; })) + '</div>' +
        '<div><h3>Maiores fornecedores</h3>' + tabelaPares(g.topFornecedores.map(function (f) { return [f.nome, f.valor]; })) + '</div></div></div>';
    });
    if (!anos.some(function (a) { return p.gastos && p.gastos[a]; })) h += '<div class="notice" style="margin-top:12px">Sem gastos registrados nesta fonte para este parlamentar.</div>';
    // votos
    var vs = (D.casas[casa].votacoes || []).map(function (v) {
      var m = v.votos.filter(function (x) { return x[0] === id; })[0];
      return m ? { v: v, voto: m[1] } : null;
    }).filter(Boolean);
    h += '<h3 style="margin-top:20px">Votos nominais recentes (' + vs.length + ')</h3>';
    if (!vs.length) h += '<p class="muted">' + (casa === 'alesp' ? 'A ALESP não publica votações nominais de plenário em dados abertos.' : casa === 'cmsp' ? 'Votos nominais dos vereadores ainda não integrados (veja “Fontes e limites”).' : 'Nenhum voto nominal no período coletado.') + '</p>';
    else {
      h += '<div class="tablewrap"><table><thead><tr><th>Data</th><th>Proposição</th><th>Voto</th></tr></thead><tbody>';
      vs.forEach(function (x) { h += '<tr><td class="mono small">' + dataBR(x.v.data) + '</td><td>' + esc(x.v.proposicao || '') + '<br><span class="muted small">' + esc((x.v.ementa || x.v.descricao || '').slice(0, 200)) + '</span></td><td>' + votoPill(x.voto) + '</td></tr>'; });
      h += '</tbody></table></div>';
    }
    return h + fonteCasa(casa);
  }
  function tabelaPares(pares) {
    if (!pares.length) return '<span class="muted">—</span>';
    return '<table><tbody>' + pares.map(function (x) { return '<tr><td>' + esc(x[0]) + '</td><td class="num">' + R(x[1]) + '</td></tr>'; }).join('') + '</tbody></table>';
  }

  /* ---------- votações ---------- */
  function vVotacoes() {
    var corte = new Date(Date.now() - Number(estado.vdias) * 864e5).toISOString().slice(0, 10);
    var todas = [];
    ['camara', 'senado'].forEach(function (k) {
      if (estado.vcasa && estado.vcasa !== k) return;
      (D.casas[k].votacoes || []).forEach(function (v) { todas.push(v); });
    });
    var q = norm(estado.vq);
    var lista = todas.filter(function (v) {
      return v.data.slice(0, 10) >= corte && (!q || norm([v.proposicao, v.ementa, v.descricao].join(' ')).indexOf(q) >= 0);
    }).sort(function (a, b) { return a.data < b.data ? 1 : -1; });
    var h = '<h2>Votações nominais</h2><p class="muted">Só entram votações com voto individual registrado. Votações simbólicas não têm placar nominal.</p>' +
      '<div class="controls"><input type="search" id="vq" placeholder="Buscar por lei, tema ou palavra" aria-label="Buscar votações" value="' + esc(estado.vq) + '">' +
      '<select id="vcasa" aria-label="Casa"><option value="">Câmara e Senado</option><option value="camara"' + (estado.vcasa === 'camara' ? ' selected' : '') + '>Câmara</option><option value="senado"' + (estado.vcasa === 'senado' ? ' selected' : '') + '>Senado</option></select>' +
      '<select id="vdias" aria-label="Período">' + [['30', 'Últimos 30 dias'], ['60', 'Últimos 60 dias'], ['120', 'Últimos 120 dias']].map(function (o) { return '<option value="' + o[0] + '"' + (estado.vdias === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
      '<p class="muted small">' + lista.length + ' votação(ões)</p>';
    if (!lista.length) return h + '<p class="empty">Nada encontrado.</p>';
    lista.forEach(function (v, i) {
      h += '<details class="vot" data-vid="' + esc(v.casa + ':' + v.id) + '"><summary><div class="small muted mono">' + esc(CASAS[v.casa].nome) + ' · ' + dataBR(v.data) + ' · ' + (v.aprovacao === 1 ? '<span style="color:var(--good)">APROVADA</span>' : v.aprovacao === 0 ? '<span style="color:var(--bad)">REJEITADA</span>' : '') + '</div>' +
        '<b>' + esc(v.proposicao || 'Votação') + '</b> <span class="muted">· sim ' + v.sim + ' · não ' + v.nao + ' · total ' + v.total + '</span>' +
        '<div class="small muted">' + esc((v.ementa || v.descricao || '').slice(0, 160)) + '</div></summary><div class="body" data-lazy="1"></div></details>';
    });
    return h;
  }
  function corpoVotacao(chave) {
    var casa = chave.split(':')[0], id = chave.slice(casa.length + 1);
    var v = D.casas[casa].votacoes.filter(function (x) { return x.id === id; })[0];
    if (!v) return '';
    var f = D.fichas[chave], idx = indice(casa), h = '';
    if (f && f.resumo) {
      h += '<div class="resumo"><div class="t">Resumo rápido</div>' + esc(f.resumo) + '</div>';
    } else {
      h += '<div class="resumo"><div class="t">Ementa oficial (resumo em linguagem simples ainda não gerado)</div>' + esc(v.ementa || v.descricao) + '</div>';
    }
    if (f && f.oQueFaz) {
      h += '<div class="ficha card"><dl><dt>O que faz</dt><dd>' + esc(f.oQueFaz) + '</dd><dt>Quem ganha</dt><dd>' + esc(f.quemGanha) + '</dd><dt>Quem paga</dt><dd>' + esc(f.quemPaga) + '</dd><dt>Impacto</dt><dd>' + esc(f.impacto) + '</dd></dl>' +
        '<div class="two"><div><h3>Argumento a favor</h3>' + esc(f.ladoA) + '</div><div><h3>Argumento contra</h3>' + esc(f.ladoB) + '</div></div>' +
        '<p class="small muted">' + esc(f.geradoPor || '') + '</p></div>';
    }
    // placar por partido
    var pp = {};
    v.votos.forEach(function (x) {
      var p = idx[x[0]], k = (p && p.partido) || 's/ partido', t = x[1] === 'Sim' ? 's' : x[1] === 'Não' ? 'n' : 'o';
      var o = pp[k] || (pp[k] = { s: 0, n: 0, o: 0 }); o[t]++;
    });
    h += '<h3 style="margin-top:14px">Por partido</h3><div class="tablewrap"><table><thead><tr><th>Partido</th><th class="num">Sim</th><th class="num">Não</th><th class="num">Outros</th></tr></thead><tbody>' +
      Object.keys(pp).sort(function (a, b) { return (pp[b].s + pp[b].n + pp[b].o) - (pp[a].s + pp[a].n + pp[a].o); }).map(function (k) { return '<tr><td>' + esc(k) + '</td><td class="num">' + pp[k].s + '</td><td class="num">' + pp[k].n + '</td><td class="num">' + pp[k].o + '</td></tr>'; }).join('') +
      '</tbody></table></div><h3 style="margin-top:14px">Placar nominal</h3><input type="search" class="vfiltro" placeholder="Filtrar por nome ou partido" aria-label="Filtrar placar"><div class="tablewrap"><table><tbody class="placar">';
    v.votos.slice().sort(function (a, b) { var pa = idx[a[0]], pb = idx[b[0]]; return ((pa && pa.nome) || '').localeCompare((pb && pb.nome) || '', 'pt-BR'); }).forEach(function (x) {
      var p = idx[x[0]];
      h += '<tr data-t="' + esc(norm((p ? p.nome + ' ' + p.partido : x[0]))) + '"><td>' + (p ? '<a href="#/p/' + casa + '/' + esc(p.id) + '">' + esc(p.nome) + '</a>' : esc(x[0])) + '</td><td>' + esc((p && p.partido) || '') + '</td><td>' + esc((p && p.uf) || '') + '</td><td>' + votoPill(x[1]) + '</td></tr>';
    });
    return h + '</tbody></table></div><p class="small muted">Fonte oficial: ' + linkFonte(v.url, v.url) + '</p>';
  }

  /* ---------- executivo ---------- */
  function vExecutivo() {
    var e = D.executivo || {}, aut = e.autoridades || [], sal = (D.salarios && D.salarios.cargos) || [];
    var sel = aut.filter(function (x) { return x.id === estado.dsel; })[0] || aut[0];
    var h = '<h2>Poder Executivo</h2><div class="notice">Os portais oficiais <b>não individualizam</b> gastos pessoais de Presidente, Governador ou Prefeito. Mostramos o salário, os gastos do órgão que serve cada um e <b>todos os decretos</b> recentes assinados por eles.</div>';
    if (!sel) return h + '<p class="empty">Sem dados do Executivo.</p>';
    h += '<div class="controls" role="group" aria-label="Autoridade">' + aut.map(function (x) {
      return '<button class="chip" data-set="dsel" data-val="' + esc(x.id) + '" aria-pressed="' + (sel.id === x.id) + '">' + esc(x.cargo) + '</button>';
    }).join('') + '</div>';
    var s = sal.filter(function (y) { return y.cargo === sel.salarioCargo; })[0];
    h += '<div class="card"><h2 style="margin:0">' + esc(sel.nome) + '</h2><div class="muted">' + esc(sel.cargo) + ' · ' + esc(sel.partido) + ' · no cargo desde ' + esc(sel.desde) + '</div></div>';
    h += '<div class="kpis" style="margin-top:12px">' + (s ? '<div class="card kpi"><div class="l">Salário bruto mensal</div><div class="v">' + R(s.valor) + '</div><div class="small muted">' + esc(s.referencia) + ' · ' + linkFonte(s.fonte) + '</div></div>' : '');
    var lista = e[sel.decretos] || [];
    h += '<div class="card kpi"><div class="l">Decretos carregados</div><div class="v">' + lista.length + '</div><div class="small muted">os mais recentes do ano</div></div></div>';

    // gastos do órgão
    h += '<h3 style="margin-top:20px">Gastos</h3>';
    if (sel.id === 'presidente') {
      var pr = e.presidencia;
      if (pr && pr.disponivel) {
        h += '<div class="kpis"><div class="card kpi"><div class="l">Cartão corporativo (CPGF) ' + esc(pr.ano) + '</div><div class="v">' + R(pr.totalCartao) + '</div></div></div>';
        if (pr.cartao.length) h += '<div class="tablewrap" style="margin-top:12px"><table><thead><tr><th>Data</th><th>Estabelecimento</th><th>Portador</th><th class="num">Valor</th></tr></thead><tbody>' + pr.cartao.slice(0, 30).map(function (x) { return '<tr><td class="mono small">' + esc(x.data) + '</td><td>' + esc(x.estabelecimento) + '</td><td>' + esc(x.portador) + '</td><td class="num">' + R2(x.valor) + '</td></tr>'; }).join('') + '</tbody></table></div>';
      } else h += '<div class="notice warn">Cartão corporativo e viagens da Presidência: ' + esc((pr && pr.motivo) || 'indisponível') + ' Fonte: ' + linkFonte('https://portaldatransparencia.gov.br/', 'Portal da Transparência') + '.</div>';
    } else if (sel.id === 'governador') {
      h += '<div class="notice warn">' + esc((e.governadorSP && e.governadorSP.motivo) || 'Indisponível.') + ' Consulta manual: ' + linkFonte('https://www.transparencia.sp.gov.br/', 'transparencia.sp.gov.br') + '.</div>';
    } else {
      var pf = e.prefeitura;
      if (pf) {
        var g = pf.orgaoDoPrefeito;
        h += '<p class="muted small">Execução orçamentária da Prefeitura, período ' + esc(pf.periodo) + '. Valores por órgão, não por pessoa.</p>';
        if (g) h += '<div class="kpis"><div class="card kpi"><div class="l">' + esc(g.nome) + ' · pago</div><div class="v">' + R(g.pago) + '</div><div class="small muted">orçado ' + R(g.orcado) + '</div></div></div>';
        h += '<div class="tablewrap" style="margin-top:12px"><table><thead><tr><th>Órgão</th><th class="num">Orçado</th><th class="num">Empenhado</th><th class="num">Pago</th></tr></thead><tbody>' +
          pf.orgaos.slice(0, 15).map(function (o) { return '<tr><td>' + esc(o.nome) + '</td><td class="num">' + R(o.orcado) + '</td><td class="num">' + R(o.empenhado) + '</td><td class="num">' + R(o.pago) + '</td></tr>'; }).join('') + '</tbody></table></div>' +
          '<p class="sticky-note">Fonte: ' + linkFonte(pf.arquivo, 'Base de dados de execução (Prefeitura de SP)') + '</p>';
      }
    }

    // decretos
    var q = norm(estado.dq);
    var vis = lista.filter(function (d) { return !q || norm(d.titulo + ' ' + d.ementa).indexOf(q) >= 0; });
    h += '<h3 style="margin-top:20px">Decretos assinados</h3><div class="controls"><input type="search" id="dq" placeholder="Buscar nos decretos (tema, número, palavra)" aria-label="Buscar decretos" value="' + esc(estado.dq) + '"></div><p class="muted small">' + vis.length + ' de ' + lista.length + '</p>';
    if (!vis.length) return h + '<p class="empty">Nenhum decreto encontrado.</p>';
    h += '<div class="tablewrap"><table><thead><tr><th>Data</th><th>Decreto</th></tr></thead><tbody>' + vis.map(function (d) {
      return '<tr><td class="mono small" style="white-space:nowrap">' + esc(d.data || '—') + '</td><td><b>' + (seguro(d.url) ? '<a href="' + esc(d.url) + '" target="_blank" rel="noopener noreferrer">' + esc(d.titulo) + '</a>' : esc(d.titulo)) + '</b><br><span class="muted small">' + esc(d.ementa || '') + '</span></td></tr>';
    }).join('') + '</tbody></table></div><p class="sticky-note">Fontes: Senado (legislação federal), ALESP (normas) e Prefeitura de SP (legislação municipal). Atualizado em ' + esc(dataHora(e.atualizadoEm)) + '.</p>';
    return h;
  }

  /* ---------- salários ---------- */
  function vSalarios() {
    var s = D.salarios;
    var h = '<h2>Salários e subsídios</h2><div class="notice warn">' + esc(s.aviso) + '</div><div class="tablewrap" style="margin-top:12px"><table><thead><tr><th>Cargo</th><th class="num">Bruto mensal</th><th class="num">Bruto anual (×12)</th><th>Referência</th></tr></thead><tbody>';
    s.cargos.forEach(function (c) { h += '<tr><td><b>' + esc(c.cargo) + '</b></td><td class="num">' + R2(c.valor) + '</td><td class="num">' + R(c.valor * 12) + '</td><td class="small">' + esc(c.referencia) + ' · ' + linkFonte(c.fonte) + '</td></tr>'; });
    return h + '</tbody></table></div><p class="sticky-note">Dado estático, atualizado manualmente em ' + dataBR(s.atualizadoManualmenteEm) + '. Não inclui auxílios, verbas de gabinete nem benefícios.</p>';
  }

  /* ---------- fontes ---------- */
  function vFontes() {
    var m = D.meta || { fontes: {} };
    var nomes = { camara: 'Câmara dos Deputados', senado: 'Senado Federal', alesp: 'ALESP', cmsp: 'Câmara Municipal de SP', executivo: 'Executivo (Prefeitura/Presidência)', fichas: 'Fichas de lei (IA)' };
    var h = '<h2>Fontes e limites</h2><h3>Estado da última coleta</h3><div class="tablewrap"><table><thead><tr><th>Fonte</th><th>Status</th><th>Último sucesso</th></tr></thead><tbody>';
    Object.keys(nomes).forEach(function (k) {
      var f = m.fontes[k];
      h += '<tr><td>' + esc(nomes[k]) + '</td><td>' + (f ? (f.ok ? '<span style="color:var(--good)">OK</span>' : '<span style="color:var(--bad)">falhou</span> <span class="small muted">' + esc(f.erro) + '</span>') : '—') + '</td><td class="small mono">' + esc(f ? dataHora(f.ultimoSucesso) : '—') + '</td></tr>';
    });
    h += '</tbody></table></div><h3 style="margin-top:20px">O que NÃO está coberto (e por quê)</h3><div class="card"><ul>' +
      '<li><b>Votos nominais da ALESP:</b> só existem votações de comissões em dados abertos; plenário não.</li>' +
      '<li><b>Votos nominais dos vereadores de SP:</b> só existem por download manual de XML na página de Votações do SPLEGIS (gastos de gabinete, via SisGV, estão integrados).</li>' +
      '<li><b>Gastos pessoais de Presidente/Governador/Prefeito:</b> não são individualizados; mostramos o órgão. Governo de SP sem API. Decretos: Presidente (Senado), Governador (ALESP), Prefeito (Prefeitura de SP).</li>' +
      '<li><b>Presidência (CPGF/viagens):</b> exige chave gratuita do Portal da Transparência (secret <code>PORTAL_TRANSPARENCIA_KEY</code>).</li>' +
      '<li><b>Patrimônio declarado (TSE):</b> não implementado nesta versão.</li>' +
      '<li><b>Fichas de lei:</b> geradas por IA a partir da ementa oficial e identificadas como tal; exigem o secret <code>ANTHROPIC_API_KEY</code>. Sem ele, mostra-se a ementa oficial.</li></ul></div>' +
      '<h3 style="margin-top:20px">Fontes oficiais</h3><div class="card"><ul>' +
      [['https://dadosabertos.camara.leg.br', 'Câmara dos Deputados (API e cota parlamentar)'], ['https://legis.senado.leg.br/dadosabertos', 'Senado (votações, senadores)'], ['https://adm.senado.gov.br/adm-dadosabertos', 'Senado (CEAPS)'], ['https://dadosabertos.al.sp.gov.br', 'ALESP'], ['https://splegisws.saopaulo.sp.leg.br/ws/ws2.asmx', 'Câmara Municipal de SP'], ['https://dados.prefeitura.sp.gov.br', 'Prefeitura de SP'], ['https://portaldatransparencia.gov.br/api-de-dados', 'Portal da Transparência']].map(function (x) { return '<li>' + linkFonte(x[0], x[1]) + '</li>'; }).join('') + '</ul></div>';
    return h;
  }

  /* ---------- roteamento ---------- */
  function rota() {
    var hash = location.hash.replace(/^#\/?/, '') || 'painel', partes = hash.split('/');
    var tab = partes[0] === 'p' ? 'parlamentares' : partes[0];
    Array.prototype.forEach.call(document.querySelectorAll('#tabs button'), function (b) { b.setAttribute('aria-current', String(b.dataset.tab === tab)); });
    var h;
    try {
      h = partes[0] === 'p' ? vPerfil(partes[1], partes[2]) :
        partes[0] === 'parlamentares' ? vParlamentares() :
        partes[0] === 'votacoes' ? vVotacoes() :
        partes[0] === 'executivo' ? vExecutivo() :
        partes[0] === 'salarios' ? vSalarios() :
        partes[0] === 'fontes' ? vFontes() : vPainel();
    } catch (e) { h = '<div class="notice warn">Erro ao montar a página: ' + esc(e.message) + '</div>'; }
    view.innerHTML = h;
    if (partes[0] === 'p') window.scrollTo(0, 0);
  }

  document.addEventListener('click', function (e) {
    var t = e.target;
    var go = t.closest && t.closest('[data-go]');
    if (go && !t.closest('a')) { location.hash = go.getAttribute('data-go'); return; }
    var set = t.closest && t.closest('[data-set]');
    if (set) { estado[set.dataset.set] = set.dataset.val; estado.ano = null; rota(); }
    var sc = t.closest && t.closest('[data-set-casa]');
    if (sc) { estado.casa = sc.getAttribute('data-set-casa'); }
    var back = t.closest && t.closest('[data-back]');
    if (back) { e.preventDefault(); history.length > 1 ? history.back() : (location.hash = '#/parlamentares'); }
  });
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (d.classList && d.classList.contains('vot') && d.open) {
      var b = d.querySelector('.body');
      if (b && b.dataset.lazy) { b.innerHTML = corpoVotacao(d.dataset.vid); delete b.dataset.lazy; }
    }
  }, true);
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'q') { estado.q = t.value; manterFoco(vParlamentares, 'q'); }
    else if (t.id === 'vq') { estado.vq = t.value; manterFoco(vVotacoes, 'vq'); }
    else if (t.id === 'dq') { estado.dq = t.value; manterFoco(vExecutivo, 'dq'); }
    else if (t.classList.contains('vfiltro')) {
      var q = norm(t.value);
      Array.prototype.forEach.call(t.parentNode.querySelectorAll('.placar tr'), function (tr) { tr.hidden = q && tr.dataset.t.indexOf(q) < 0; });
    }
  });
  document.addEventListener('change', function (e) {
    var t = e.target, mapa = { fpartido: 'partido', fuf: 'uf', ordem: 'ordem', vcasa: 'vcasa', vdias: 'vdias', ano: 'ano' };
    if (mapa[t.id]) { estado[mapa[t.id]] = t.value; rota(); }
  });
  function manterFoco(fn, id) {
    view.innerHTML = fn();
    var el = document.getElementById(id);
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }

  /* ---------- início ---------- */
  function init() {
    var tabs = document.getElementById('tabs');
    TABS.forEach(function (t) {
      var b = document.createElement('button');
      b.textContent = t[1]; b.dataset.tab = t[0]; b.type = 'button';
      b.addEventListener('click', function () { location.hash = '#/' + t[0]; });
      tabs.appendChild(b);
    });
    var pedidos = ORDEM.map(function (k) { return fetchJSON('data/' + k + '.json').then(function (d) { D.casas[k] = d; }).catch(function () { D.casas[k] = { parlamentares: [], votacoes: [], fontes: [] }; }); });
    pedidos.push(fetchJSON('data/salarios.json').then(function (d) { D.salarios = d; }).catch(function () { D.salarios = { cargos: [], aviso: 'indisponível' }; }));
    pedidos.push(fetchJSON('data/executivo.json').then(function (d) { D.executivo = d; }).catch(function () {}));
    pedidos.push(fetchJSON('data/fichas.json').then(function (d) { D.fichas = d; }).catch(function () {}));
    pedidos.push(fetchJSON('data/meta.json').then(function (d) { D.meta = d; }).catch(function () {}));
    Promise.all(pedidos).then(function () {
      var up = (D.meta && D.meta.atualizadoEm) || (D.casas.camara && D.casas.camara.atualizadoEm);
      document.getElementById('status').textContent = up ? 'Dados atualizados em ' + dataHora(up) + ' · coleta automática 3x ao dia (7h, 12h e 22h)' : '';
      document.getElementById('footer').innerHTML = 'Todos os números vêm de fontes oficiais abertas, linkadas em cada seção. Código e dados no GitHub.';
      window.addEventListener('hashchange', rota);
      rota();
    });
  }
  init();
})();
