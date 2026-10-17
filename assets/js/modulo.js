/* Página de módulo: explicación, etapa 1 (ejemplo resuelto), etapa 2 (micro-retos),
   etapa 3 (reto principal en tres niveles), etapa 4 (laboratorio en Excel real),
   «¿Dónde está?» y glosario. Los contenidos vienen de assets/js/modulos/mXX.js. */
(function () {
  'use strict';
  const LT = window.LT;
  const { h, esc, uid } = LT.u;
  const F = LT.formato;
  const R = LT.refs;
  LT.modulos = LT.modulos || {};
  LT.definirModulo = (def) => { LT.modulos[def.id] = def; };

  const NIVELES_RETO = [
    ['explorador', 'Explorador', 'Con pasos y huecos guiados'],
    ['analista', 'Analista', 'Solo enunciado y datos'],
    ['experto', 'Experto', 'Con un requisito extra'],
  ];
  const COLORES_TOK = ['#1f6fd1', '#c0392b', '#7d3c98', '#16a085', '#d35400', '#b7950b'];

  function contenedorHoja() { return h('div', { id: uid('hoja') }); }
  function mezclar(base, extra) {
    const o = Object.assign({}, base || {});
    for (const [k, v] of Object.entries(extra || {})) o[k] = v;
    return o;
  }
  function textoHTML(x) { return typeof x === 'string' ? h('span', { html: x }) : x; }
  function lista(items, ordenada) {
    const l = h(ordenada ? 'ol' : 'ul');
    for (const it of items || []) l.appendChild(h('li', { html: it }));
    return l;
  }
  function rutaChips(ruta) { return h('span', { class: 'donde-ruta', html: LT.cinta.rutaHTML(ruta) }); }

  function resultadosLista(resultados, mostrarOk) {
    const ul = h('ul', { class: 'resultados', 'aria-live': 'polite' });
    for (const r of resultados) {
      if (r.ok && !mostrarOk) continue;
      ul.appendChild(h('li', { class: r.ok ? 'ok' : 'mal' }, h('span', { class: 'ic' }, r.ok ? '✓' : '✗'), h('span', null, r.ok ? (r.titulo || r.mensaje || 'Correcto') : r.mensaje), r.nota ? h('span', { class: 'ir' }, r.nota) : null));
    }
    return ul;
  }

  /* ================================================================ */
  LT.paginaModulo = function (id) {
    const def = LT.modulos[id];
    const meta = LT.CURSO.modulo(id);
    const nivel = LT.CURSO.nivel(meta.nivel);
    document.title = 'Módulo ' + id + ' · ' + meta.titulo + ' · Excel con La Taza';
    const prog = LT.progreso.modulo(id);
    const main = h('main');

    /* ---------------------------------------------------- cabecera */
    const est = LT.progreso.estadoModulo(id);
    const insignia = h('div', { class: 'insignia' + (est.superado ? '' : ' bloqueada'), html: LT.CURSO.insignia(id, { tam: 84, estrella: est.estrella }) });
    const cab = h('section', { class: 'mod-cab' }, h('div', { class: 'contenedor' },
      h('div', { class: 'ruta' }, h('a', { href: LT.pagina.url('index.html') }, 'Inicio'), ' › ', h('a', { href: LT.pagina.url('index.html#nivel-' + nivel.id) }, 'Nivel ' + nivel.nombre), ' › Módulo ' + id),
      h('div', { class: 'mod-cab-grid' },
        h('div', null,
          h('div', { class: 'meta' }, h('span', { class: 'chip ' + nivel.id }, 'Nivel ' + nivel.nombre), h('span', { class: 'chip' }, 'Sesión ' + meta.sesion), h('span', { class: 'chip' }, meta.min + ' min'), h('span', { class: 'chip excel' }, meta.entorno)),
          h('h1', null, 'Módulo ' + id + '. ' + meta.titulo),
          h('p', { class: 'objetivo' }, h('b', null, 'Objetivo: '), def.objetivo)),
        insignia),
      def.situacion ? h('div', { class: 'situacion' }, h('div', { class: 'avatar', 'aria-hidden': 'true' }, 'M'), h('div', null, h('div', { class: 'de' }, (def.situacionDe || 'Marta Ríos, gerente general de La Taza') + ' escribe:'), h('div', { class: 'msj', html: def.situacion }))) : null,
      LT.progreso.cargar().ubicacion[meta.nivel] && LT.progreso.cargar().ubicacion[meta.nivel].salto
        ? h('div', { class: 'aviso-caja ok' }, 'Superaste la prueba de ubicación de este nivel: puedes ir directo a la ', h('a', { href: '#etapa4' }, 'Etapa 4 (laboratorio en Excel)'), '.') : null));
    const etapas = [['explicacion', 'Explicación', '·'], ['etapa1', 'Etapa 1: Ver', '1'], ['etapa2', 'Etapa 2: Completar', '2'], ['etapa3', 'Etapa 3: Resolver', '3'], ['etapa4', 'Etapa 4: Transferir', '4'], ['donde', '¿Dónde está?', '?']];
    const nav = h('nav', { class: 'etapas contenedor', 'aria-label': 'Etapas del módulo' });
    const enlaces = {};
    for (const [ancla, t, n] of etapas) { enlaces[ancla] = h('a', { href: '#' + ancla }, h('span', { class: 'n' }, n), t); nav.appendChild(enlaces[ancla]); }
    cab.appendChild(nav);
    main.appendChild(cab);
    const marcarEtapas = () => {
      const m = LT.progreso.modulo(id);
      enlaces.etapa1.classList.toggle('hecha', !!m.ejemplo);
      enlaces.etapa2.classList.toggle('hecha', Object.values(m.micro || {}).filter(Boolean).length >= (def.micro || []).length && (def.micro || []).length > 0);
      enlaces.etapa3.classList.toggle('hecha', !!(m.reto && m.reto.ok));
      enlaces.etapa4.classList.toggle('hecha', !!(m.lab && m.lab.ok));
      enlaces.donde.classList.toggle('hecha', !!m.donde);
      const e = LT.progreso.estadoModulo(id);
      insignia.className = 'insignia' + (e.superado ? '' : ' bloqueada');
      insignia.innerHTML = LT.CURSO.insignia(id, { tam: 84, estrella: e.estrella });
    };
    document.addEventListener('lt-progreso', marcarEtapas);
    const cuerpo = h('div', { class: 'contenedor' });
    main.appendChild(cuerpo);

    /* -------------------------------------------------- explicación */
    const secExp = seccion('explicacion', 'Información de apoyo', def.explicacionTitulo || '¿Cómo funciona?', def.explicacionIntro);
    const exp = h('div', { class: 'explicacion' });
    for (const b of def.explicacion || []) exp.appendChild(bloque(b));
    secExp.appendChild(exp);
    cuerpo.appendChild(secExp);

    /* -------------------------------------------- etapa 1: ejemplo */
    const sec1 = seccion('etapa1', 'Etapa 1 · Ver', 'Ejemplo resuelto', def.ejemplo && def.ejemplo.intro || 'Antes de ver el resultado, predice qué hará Excel. Pasa el cursor sobre la fórmula para ver qué celdas usa.');
    if (def.ejemplo) sec1.appendChild(ejemplo(def.ejemplo, () => LT.progreso.actualizarModulo(id, (m) => { m.ejemplo = true; })));
    cuerpo.appendChild(sec1);

    /* -------------------------------------------- etapa 2: micro-retos */
    const sec2 = seccion('etapa2', 'Etapa 2 · Completar', 'Micro-retos', 'Practica una sola función, comando o atajo a la vez antes del reto principal.');
    const microGrid = h('div', { class: 'micro-grid' });
    (def.micro || []).forEach((mr, i) => microGrid.appendChild(microReto(mr, i, () => LT.progreso.actualizarModulo(id, (m) => { m.micro[i] = true; }), !!(prog.micro || {})[i])));
    sec2.appendChild(microGrid);
    cuerpo.appendChild(sec2);

    /* ---------------------------------------- etapa 3: reto principal */
    const sec3 = seccion('etapa3', 'Etapa 3 · Resolver', 'Reto principal: ' + (def.reto && def.reto.titulo || meta.reto), def.reto && def.reto.intro);
    let nivelActual = (prog.reto && prog.reto.nivel) || 'analista';
    const cambiarNivelLab = [];
    if (def.reto) sec3.appendChild(retoPrincipal(def, id, () => nivelActual, (n) => { nivelActual = n; cambiarNivelLab.forEach((fn) => fn(n)); }));
    cuerpo.appendChild(sec3);

    /* ---------------------------------------------- etapa 4: laboratorio */
    const sec4 = seccion('etapa4', 'Etapa 4 · Transferir', 'Laboratorio en Excel real', def.lab && def.lab.intro || 'Resuelve el mismo tipo de tarea en Excel, sin guía, y sube tu archivo para revisarlo al instante.');
    if (def.lab) sec4.appendChild(laboratorio(def, id, () => nivelActual, cambiarNivelLab));
    cuerpo.appendChild(sec4);

    /* ---------------------------------------------- ¿dónde está? */
    const secD = seccion('donde', 'Cierre', '¿Dónde está?', 'Ubica en la cinta de opciones los comandos que usaste. Las rutas son de Excel para Windows; las notas indican diferencias en Mac y en Excel para la web.');
    if (def.donde && def.donde.length) {
      const c = h('div', { class: 'widget' });
      secD.appendChild(c);
      LT.DondeEsta(c, def.donde, () => { LT.progreso.actualizarModulo(id, (m) => { m.donde = true; }); LT.ui.toast('¡Ubicaste todos los comandos!', 'ok'); });
    }
    // glosario del módulo
    if (def.glosario && def.glosario.length) {
      const t = h('table', { class: 'tabla-sitio' }, h('thead', null, h('tr', null, h('th', null, 'Función'), h('th', null, 'Sintaxis'), h('th', null, 'En inglés (como se guarda en el archivo)'), h('th', null, 'Ejemplo'))));
      const tb = h('tbody');
      for (const n of def.glosario) {
        const f = LT.FUNCIONES[n];
        if (!f) continue;
        tb.appendChild(h('tr', null, h('td', null, h('a', { href: LT.pagina.url('funciones.html#f-' + f.es.replace(/\./g, '-')), title: 'Ver en la guía gráfica de funciones' }, h('b', null, f.es))), h('td', null, h('code', null, f.sintaxis)), h('td', null, h('code', null, f.archivo)), h('td', null, f.ejemplo)));
      }
      t.appendChild(tb);
      secD.append(h('h3', { style: { marginTop: '24px' } }, 'Glosario de funciones del módulo'), h('div', { class: 'tabla-scroll' }, t));
    }
    if (def.atajos && def.atajos.length) {
      secD.append(h('h3', { style: { marginTop: '20px' } }, 'Atajos útiles'), h('ul', null, def.atajos.map((a) => h('li', { html: a }))));
    }
    cuerpo.appendChild(secD);

    // navegación entre módulos
    const ant = LT.CURSO.modulo(id - 1), sig = LT.CURSO.modulo(id + 1);
    cuerpo.appendChild(h('div', { class: 'grupo-btn', style: { justifyContent: 'space-between', marginTop: '36px' } },
      ant ? h('a', { class: 'btn', href: LT.pagina.urlModulo(ant.id) }, '← Módulo ' + ant.id + ': ' + ant.titulo) : h('span'),
      sig ? h('a', { class: 'btn primario', href: LT.pagina.urlModulo(sig.id) }, 'Módulo ' + sig.id + ': ' + sig.titulo + ' →') : h('a', { class: 'btn primario', href: LT.pagina.url('integrador.html?nivel=avanzado') }, 'Reto integrador avanzado →')));
    LT.pagina.montar(main);
    marcarEtapas();
    // etapa activa al desplazarse
    const obs = new IntersectionObserver((ents) => {
      ents.forEach((e) => { if (e.isIntersecting) { Object.values(enlaces).forEach((a) => a.classList.remove('activa')); if (enlaces[e.target.id]) enlaces[e.target.id].classList.add('activa'); } });
    }, { rootMargin: '-40% 0px -55% 0px' });
    etapas.forEach(([a]) => { const s = document.getElementById(a); if (s) obs.observe(s); });
    if (location.hash) setTimeout(() => { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }, 60);
  };

  function seccion(ancla, etiqueta, titulo, intro) {
    return h('section', { class: 'seccion', id: ancla },
      h('div', { class: 'etiqueta-etapa' }, etiqueta),
      h('div', { class: 'seccion-cab' }, h('h2', null, titulo)),
      intro ? h('p', { class: 'intro', html: intro }) : null);
  }

  /* Bloques de explicación: {html} | {widget, opts, titulo, instr} | {hoja, titulo, instr} */
  function bloque(b) {
    if (b.html) return h('div', { class: 'bloque-texto', html: b.html });
    const w = h('div', { class: 'widget' });
    if (b.titulo) w.appendChild(h('h3', null, b.titulo));
    if (b.instr) w.appendChild(h('p', { class: 'instr', html: b.instr }));
    const c = h('div');
    w.appendChild(c);
    if (b.widget) setTimeout(() => (typeof b.widget === 'function' ? b.widget(c) : LT.widgets[b.widget](c, b.opts || {})), 0);
    if (b.hoja) setTimeout(() => { const hc = contenedorHoja(); c.appendChild(hc); const hj = new LT.Hoja(hc, b.hoja); if (b.alCrear) b.alCrear(hj, c); }, 0);
    return w;
  }

  /* ------------------------------------------------- ejemplo resuelto */
  function ejemplo(ej, alTerminar) {
    const caja = h('div', { class: 'widget' });
    if (ej.tipo === 'pasos') {
      if (ej.titulo) caja.appendChild(h('h3', null, ej.titulo));
      const ol = h('ol', { class: 'pasos-ejemplo' });
      ej.pasos.forEach((p) => ol.appendChild(h('li', null, textoHTML(typeof p === 'string' ? p : p.texto), p.ruta ? h('div', null, rutaChips(p.ruta)) : null)));
      if (ej.widget) { const c = h('div', { style: { margin: '12px 0' } }); caja.appendChild(c); setTimeout(() => (typeof ej.widget === 'function' ? ej.widget(c) : LT.widgets[ej.widget](c, ej.opts || {})), 0); }
      if (ej.pregunta) {
        caja.appendChild(h('p', { style: { fontWeight: 600, marginTop: '10px' } }, 'Predice: ', h('span', { html: ej.pregunta.texto })));
        caja.appendChild(opciones(ej.pregunta, () => { ol.style.display = ''; caja.appendChild(h('div', { class: 'aviso-caja info' }, 'Así se hace, paso a paso (arriba). ')); alTerminar(); }));
        ol.style.display = 'none';
        caja.appendChild(ol);
      } else { caja.appendChild(ol); alTerminar(); }
      return caja;
    }
    // ejemplo con fórmula en una cuadrícula
    const hc = contenedorHoja();
    const formula = ej.formula;
    const celda = ej.celda;
    const fGrande = h('div', { class: 'formula-grande', 'aria-label': 'Fórmula del ejemplo' });
    const refs = R.referenciasEn(formula);
    let ult = 0;
    fGrande.appendChild(document.createTextNode(celda + ':  '));
    let hoja;
    refs.forEach((ref, i) => {
      fGrande.appendChild(document.createTextNode(formula.slice(ult, ref.inicio)));
      const color = COLORES_TOK[i % COLORES_TOK.length];
      const tok = h('span', { class: 'tok-ref', style: { color, borderColor: color }, tabindex: '0' }, ref.texto);
      const on = () => hoja && hoja.resaltar([{ rango: ref.texto, color }]);
      const off = () => hoja && hoja.resaltar([]);
      tok.addEventListener('mouseenter', on); tok.addEventListener('mouseleave', off);
      tok.addEventListener('focus', on); tok.addEventListener('blur', off);
      fGrande.appendChild(tok);
      ult = ref.fin;
    });
    fGrande.appendChild(document.createTextNode(formula.slice(ult)));
    if (ej.titulo) caja.appendChild(h('h3', null, ej.titulo));
    caja.appendChild(fGrande);
    caja.appendChild(hc);
    const pasos = h('ol', { class: 'pasos-ejemplo', style: { display: 'none' } }, (ej.explicacion || []).map((p) => h('li', { html: p })));
    const pred = h('input', { type: 'text', placeholder: 'Tu predicción', 'aria-label': 'Tu predicción' });
    const retro = h('div', { class: 'retro' });
    let revelado = false;
    const revelar = () => {
      if (revelado) return;
      revelado = true;
      hoja.establecer(celda, formula, { sinDeshacer: true });
      hoja.seleccionar(celda, { silencioso: true });
      hoja.resaltar(refs.map((ref, i) => ({ rango: ref.texto, color: COLORES_TOK[i % COLORES_TOK.length] })));
      pasos.style.display = '';
      alTerminar();
    };
    const comprobar = () => {
      const v = hoja.hf ? null : null;
      const esperado = ej.respuesta;
      const dado = pred.value.trim();
      let ok;
      if (typeof esperado === 'number') { const n = parseFloat(dado.replace(/[$,\s%]/g, '')); ok = isFinite(n) && Math.abs(n - esperado) < 0.01 + Math.abs(esperado) * 1e-6; }
      else { const norm = (x) => String(x).toLowerCase().replace(/[¡¿\s"«»]/g, ''); ok = norm(dado) === norm(esperado); }
      retro.innerHTML = '';
      retro.appendChild(h('div', { class: 'aviso-caja ' + (ok ? 'ok' : 'alerta') }, ok ? '✓ ¡Exacto! ' : 'Casi. El resultado es ', ok ? '' : h('b', null, typeof esperado === 'number' ? F.formatear(esperado, ej.formato || 'General').texto : String(esperado)), ok ? 'Mira abajo por qué.' : '. Revisa la explicación paso a paso.'));
      revelar();
      void v;
    };
    caja.appendChild(h('div', { class: 'prediccion' }, h('b', null, ej.pregunta || '¿Qué mostrará ' + celda + '?'), pred, h('button', { class: 'btn primario chico', onclick: comprobar }, 'Comprobar'), h('button', { class: 'btn chico fantasma', onclick: () => { retro.innerHTML = ''; revelar(); } }, 'Mostrar sin predecir')));
    pred.addEventListener('keydown', (e) => { if (e.key === 'Enter') comprobar(); });
    caja.append(retro, pasos);
    setTimeout(() => {
      const opts = Object.assign({ altura: 220, soloLectura: true, estado: true }, ej.hoja);
      hoja = new LT.Hoja(hc, opts);
      hoja.establecer(celda, '', { sinDeshacer: true });
      hoja.resaltar([{ rango: celda, color: '#b7950b' }]);
      if (ej.alCrear) ej.alCrear(hoja);
    }, 0);
    return caja;
  }

  /* Preguntas de opción múltiple: {texto?, opciones:[], correcta, explicacion} */
  function opciones(q, alAcertar) {
    const cont = h('div');
    const ops = h('div', { class: 'opciones', role: 'radiogroup' });
    const retro = h('div', { class: 'retro' });
    let resuelto = false;
    q.opciones.forEach((o, i) => {
      const b = h('button', { class: 'opcion', type: 'button', role: 'radio', 'aria-checked': 'false' }, h('span', { class: 'letra' }, String.fromCharCode(65 + i)), h('span', { html: o }));
      b.addEventListener('click', () => {
        if (resuelto) return;
        const ok = i === q.correcta;
        b.classList.add(ok ? 'correcta' : 'incorrecta');
        b.setAttribute('aria-checked', 'true');
        retro.innerHTML = '';
        if (ok) {
          resuelto = true;
          retro.appendChild(h('div', { class: 'aviso-caja ok', html: '✓ ' + (q.explicacion || '¡Correcto!') }));
          alAcertar && alAcertar();
        } else retro.appendChild(h('div', { class: 'aviso-caja alerta', html: (q.retro && q.retro[i]) || 'No es esa. Vuelve a intentarlo.' }));
      });
      ops.appendChild(b);
    });
    cont.append(ops, retro);
    return cont;
  }

  /* ---------------------------------------------------------- micro-reto */
  function microReto(mr, i, alResolver, yaResuelto) {
    const chip = h('span', { class: 'chip ' + (yaResuelto ? 'ok' : 'pendiente') }, yaResuelto ? '✓ Resuelto' : 'Pendiente');
    const marcar = () => { chip.className = 'chip ok'; chip.textContent = '✓ Resuelto'; alResolver(); };
    const caja = h('div', { class: 'micro' }, h('div', { class: 'micro-cab' }, h('h3', null, 'Micro-reto ' + (i + 1) + ': ' + mr.titulo), chip));
    if (mr.enunciado) caja.appendChild(h('p', { class: 'enunciado', html: mr.enunciado }));
    if (mr.tipo === 'opcion') { caja.appendChild(opciones(mr, marcar)); return caja; }
    if (mr.tipo === 'widget') { const c = h('div'); caja.appendChild(c); setTimeout(() => mr.crear(c, marcar), 0); return caja; }
    // micro-reto en la cuadrícula
    const hc = contenedorHoja();
    const res = h('div');
    const pistas = h('div', { class: 'pistas' });
    let nPista = 0;
    let hoja;
    const verificar = () => {
      const r = LT.verificar(hoja, mr);
      res.innerHTML = '';
      res.appendChild(resultadosLista(r.resultados));
      hoja.resaltar(r.ok ? [] : r.marcas.slice(0, 20).map((m) => ({ rango: m, color: '#c0392b', relleno: false })));
      if (r.ok) { res.appendChild(h('div', { class: 'aviso-caja ok' }, '✓ ' + (mr.exito || '¡Bien hecho!'))); marcar(); }
    };
    const listaPistas = [].concat(mr.pista || mr.pistas || []);
    caja.append(hc, h('div', { class: 'grupo-btn', style: { marginTop: '10px' } },
      h('button', { class: 'btn primario chico', onclick: verificar }, LT.icono('check', 15), 'Verificar'),
      listaPistas.length ? h('button', { class: 'btn chico', onclick: () => { if (nPista < listaPistas.length) { pistas.appendChild(h('div', { class: 'pista' }, h('b', null, 'Pista ' + (nPista + 1)), h('span', { html: listaPistas[nPista] }))); nPista++; } } }, LT.icono('pista', 15), 'Pista') : null,
      h('button', { class: 'btn chico fantasma', onclick: () => { hoja.restablecer(); res.innerHTML = ''; hoja.resaltar([]); } }, LT.icono('reiniciar', 15), 'Reiniciar')), pistas, res);
    setTimeout(() => { hoja = new LT.Hoja(hc, Object.assign({ altura: 230 }, mr.hoja)); if (mr.alCrear) mr.alCrear(hoja); }, 0);
    return caja;
  }

  /* ------------------------------------------------------ reto principal */
  function retoPrincipal(def, id, getNivel, setNivel) {
    const reto = def.reto;
    const cont = h('div', { class: 'panel-reto' });
    const instr = h('div', { class: 'panel-instr' });
    const trabajo = h('div', { class: 'panel-trabajo' });
    cont.append(instr, trabajo);
    let hoja = null, widget = null, intentos = 0;
    const claveBorrador = (n) => 'laTaza2.borrador.m' + id + '.' + n;
    const especDe = (n) => {
      const base = reto.base || {};
      const niv = (reto.niveles || {})[n] || {};
      const e = mezclar(base, niv);
      e.pruebas = (niv.pruebas || base.pruebas || []).concat(niv.pruebasExtra || []);
      e.solucion = Object.assign({}, base.solucion || {}, niv.solucion || {});
      e.pistas = niv.pistas || base.pistas || [];
      e.instrucciones = niv.instrucciones || base.instrucciones || [];
      return e;
    };
    const construir = () => {
      const n = getNivel();
      const e = especDe(n);
      instr.innerHTML = '';
      trabajo.innerHTML = '';
      intentos = 0;
      const selector = h('div', { class: 'selector-nivel', role: 'radiogroup', 'aria-label': 'Nivel de dificultad' });
      for (const [k, nom, d] of NIVELES_RETO) {
        selector.appendChild(h('button', { class: k === n ? 'activo' : '', role: 'radio', 'aria-checked': k === n ? 'true' : 'false', onclick: () => { if (k !== n) { setNivel(k); construir(); } } }, nom, h('small', null, d)));
      }
      instr.appendChild(h('h3', null, 'Nivel'));
      instr.appendChild(selector);
      if (e.contexto) instr.appendChild(h('p', { html: e.contexto, style: { fontSize: '.93rem' } }));
      instr.appendChild(h('h3', null, 'Lo que debes hacer'));
      instr.appendChild(lista(e.instrucciones, true));
      const plantillaCont = h('div');
      instr.appendChild(plantillaCont);
      const pistas = h('div', { class: 'pistas' });
      const res = h('div');
      let nPista = 0;
      const btnPista = h('button', { class: 'btn chico' }, LT.icono('pista', 15), 'Pista (' + e.pistas.length + ')');
      btnPista.addEventListener('click', () => {
        if (nPista >= e.pistas.length) return;
        const titulos = ['Concepto', 'Sintaxis', 'Paso exacto'];
        pistas.appendChild(h('div', { class: 'pista' }, h('b', null, (titulos[nPista] || 'Pista') + ' · ' + (nPista + 1) + ' de ' + e.pistas.length), h('span', { html: e.pistas[nPista] })));
        nPista++;
        btnPista.textContent = '';
        btnPista.append(LT.icono('pista', 15), nPista < e.pistas.length ? 'Otra pista' : 'Sin más pistas');
        if (nPista >= e.pistas.length) btnPista.disabled = true;
      });
      const verificar = () => {
        intentos++;
        let r;
        if (reto.tipo === 'widget') r = widget.verificar(n);
        else { if (hoja.edicion) hoja.confirmarEdicion(); r = LT.verificar(hoja, e); hoja.resaltar(r.ok ? [] : r.marcas.slice(0, 30).map((m) => ({ rango: m, color: '#c0392b', relleno: false }))); }
        res.innerHTML = '';
        res.appendChild(resultadosLista(r.resultados, true));
        if (r.ok) {
          const previo = LT.progreso.modulo(id).reto;
          const orden = { explorador: 1, analista: 2, experto: 3 };
          LT.progreso.actualizarModulo(id, (m) => {
            m.intentos = (m.intentos || 0) + intentos;
            if (!m.reto || !m.reto.ok || orden[n] >= orden[m.reto.nivel]) m.reto = { ok: true, nivel: n, fecha: new Date().toISOString() };
          });
          res.appendChild(h('div', { class: 'exito' }, h('div', { html: LT.CURSO.insignia(id, { tam: 56 }) }), h('div', null, h('h4', null, previo && previo.ok ? '¡Reto superado otra vez!' : '¡Insignia desbloqueada!'), h('p', null, 'Superaste el reto en nivel ' + NIVELES_RETO.find((x) => x[0] === n)[1] + '. ' + (n !== 'experto' ? 'Prueba el nivel siguiente o pasa al laboratorio en Excel real.' : 'Ahora transfiere lo aprendido al laboratorio en Excel real.')))));
          if (!previo || !previo.ok) LT.ui.toast('¡Insignia del módulo ' + id + ' desbloqueada!', 'ok');
        }
      };
      instr.append(h('div', { class: 'grupo-btn', style: { marginTop: '8px' } },
        h('button', { class: 'btn primario', onclick: verificar }, LT.icono('check', 16), 'Verificar'), btnPista,
        h('button', { class: 'btn chico fantasma', onclick: async () => { const ok = await LT.ui.modal({ titulo: 'Empezar de nuevo', cuerpo: h('p', null, 'Se borrará lo que hiciste en este nivel.'), botones: [{ texto: 'Cancelar', valor: false }, { texto: 'Restablecer', primario: true, valor: true }] }); if (ok) { try { localStorage.removeItem(claveBorrador(n)); } catch (er) { /* */ } construir(); } } }, LT.icono('reiniciar', 15), 'Restablecer')),
        pistas, res);
      if (reto.tipo === 'widget') {
        const c = h('div');
        trabajo.appendChild(c);
        setTimeout(() => { widget = reto.crear(c, n, { id }); c.__reto = widget; }, 0); // __reto: acceso para pruebas automáticas
        return;
      }
      const hc = contenedorHoja();
      trabajo.appendChild(hc);
      if (e.debajo) trabajo.appendChild(h('div', { class: 'aviso-caja info', html: e.debajo }));
      setTimeout(() => {
        hoja = new LT.Hoja(hc, Object.assign({ altura: 430 }, e.hoja));
        // borrador guardado
        try {
          const b = localStorage.getItem(claveBorrador(n));
          if (b) { hoja.importar(JSON.parse(b)); res.appendChild(h('div', { class: 'aviso-caja info' }, 'Recuperamos tu avance de la última vez. Usa «Restablecer» para empezar de nuevo.')); }
        } catch (er) { /* sin almacenamiento */ }
        let t = null;
        hoja.on('cambio', () => { clearTimeout(t); t = setTimeout(() => { try { localStorage.setItem(claveBorrador(n), JSON.stringify(hoja.exportar())); } catch (er) { /* */ } }, 600); });
        if (e.alCrear) e.alCrear(hoja, trabajo);
        // plantilla con huecos (nivel Explorador)
        if (e.plantilla) {
          const partes = e.plantilla.texto.split('___');
          const p = h('div', { class: 'plantilla', 'aria-label': 'Fórmula con huecos' });
          const entradas = [];
          partes.forEach((txt, i) => { p.appendChild(document.createTextNode(txt)); if (i < partes.length - 1) { const inp = h('input', { type: 'text', 'aria-label': 'Hueco ' + (i + 1), spellcheck: 'false' }); entradas.push(inp); p.appendChild(inp); } });
          plantillaCont.append(h('h3', null, 'Completa la fórmula'), p, h('button', { class: 'btn chico cafe', onclick: () => {
            let f = '';
            partes.forEach((txt, i) => { f += txt + (entradas[i] ? entradas[i].value.trim() : ''); });
            hoja.establecer(e.plantilla.celda, f);
            hoja.seleccionar(e.plantilla.celda);
            LT.ui.toast('Fórmula escrita en ' + e.plantilla.celda + (e.plantilla.copiar ? '. Ahora cópiala hasta ' + e.plantilla.copiar + ' con el controlador de relleno.' : '.'));
          } }, 'Escribir en ' + e.plantilla.celda));
        }
      }, 0);
    };
    construir();
    return cont;
  }

  /* --------------------------------------------------------- laboratorio */
  function laboratorio(def, id, getNivel, cambiosNivel) {
    const lab = def.lab;
    const cont = h('div', { class: 'lab-grid' });
    const izq = h('div', { class: 'widget' });
    const der = h('div', { class: 'widget' });
    cont.append(izq, der);
    const ruta = LT.pagina.url('laboratorios/' + lab.archivo);
    const pasosCont = h('div');
    const dibujarPasos = (n) => {
      pasosCont.innerHTML = '';
      const pasos = (lab.pasos && (lab.pasos[n] || lab.pasos.analista)) || [];
      pasosCont.appendChild(h('div', { class: 'chip', style: { marginBottom: '6px' } }, 'Nivel ' + NIVELES_RETO.find((x) => x[0] === n)[1]));
      const ol = h('ol', { class: 'pasos-lab' });
      for (const p of pasos) ol.appendChild(h('li', null, h('span', { html: typeof p === 'string' ? p : p.texto }), p.ruta ? h('div', null, rutaChips(p.ruta)) : null));
      pasosCont.appendChild(ol);
    };
    cambiosNivel.push(dibujarPasos);
    izq.append(
      h('h3', null, lab.titulo || 'Laboratorio'),
      lab.contexto ? h('p', { html: lab.contexto }) : null,
      h('div', { class: 'grupo-btn', style: { margin: '10px 0' } }, h('a', { class: 'btn cafe', href: ruta, download: lab.archivo }, LT.icono('descargar', 16), 'Descargar ' + lab.archivo), (lab.descargas || []).map((d) => h('a', { class: 'btn chico', href: LT.pagina.url(d.ruta), download: d.ruta.split('/').pop() }, LT.icono('descargar', 15), d.texto))),
      h('p', { style: { fontSize: '.88rem', color: 'var(--tinta-2)' } }, 'El libro trae una hoja «Instrucciones». No cambies los nombres de las hojas ni muevas los datos: el verificador los busca en su lugar.'),
      pasosCont,
      h('details', { style: { marginTop: '10px', fontSize: '.9rem' } }, h('summary', { style: { cursor: 'pointer' } }, '¿Usas Excel para la web o Mac?'),
        h('p', null, 'Excel para la web: sube el libro a OneDrive, ábrelo, resuélvelo y descárgalo con Archivo › Guardar como › Descargar una copia. Luego súbelo aquí.' + (lab.notaWeb ? ' ' + lab.notaWeb : '')),
        h('p', null, 'Mac: las rutas de la cinta son casi iguales; Formato de celdas se abre con ⌘1.' + (lab.notaMac ? ' ' + lab.notaMac : ''))));
    dibujarPasos(getNivel());
    // zona de subida
    const res = h('div');
    const info = h('div', { class: 'archivo-info' });
    const inp = h('input', { type: 'file', accept: lab.acepta || '.xlsx,.xlsm', class: 'sr', multiple: lab.pdf || lab.docx ? true : null });
    const zona = h('label', { class: 'zona-subir', tabindex: '0' }, inp, LT.icono('subir', 30), h('div', null, h('b', null, 'Sube tu libro resuelto')), h('p', null, 'Arrastra aquí tu archivo ' + (lab.acepta || '.xlsx') + ' o haz clic para elegirlo.' + (lab.pdf ? ' Puedes subir también el PDF (selecciona ambos archivos).' : '') + (lab.docx ? ' Sube también el documento de Word (.docx): selecciona los archivos a la vez.' : '')));
    zona.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inp.click(); } });
    const procesar = async (archivos) => {
      res.innerHTML = '';
      info.textContent = '';
      const libroArchivo = Array.from(archivos).find((f) => /\.xls[xm]$/i.test(f.name));
      const pdf = Array.from(archivos).find((f) => /\.pdf$/i.test(f.name));
      const docx = Array.from(archivos).find((f) => /\.docx$/i.test(f.name));
      if (!libroArchivo) { res.appendChild(h('div', { class: 'aviso-caja error' }, 'Sube un archivo de Excel (.xlsx' + (lab.acepta && lab.acepta.includes('xlsm') ? ' o .xlsm' : '') + ').' + (/\.xls$/i.test((archivos[0] || {}).name || '') ? ' El formato .xls (Excel 97-2003) no se puede revisar: guárdalo como Libro de Excel.' : ''))); return; }
      info.textContent = 'Revisando «' + libroArchivo.name + '» (' + Math.round(libroArchivo.size / 1024) + ' KB)…';
      try {
        const L = await LT.xlsx.leer(libroArchivo, libroArchivo.name);
        L.pdf = pdf ? await LT.xlsx.paginasPDF(pdf) : null;
        L.docx = docx ? await LT.xlsx.leerDocx(docx) : null;
        L.nombreArchivo = libroArchivo.name;
        const n = getNivel();
        const orden = { explorador: 1, analista: 2, experto: 3 };
        const pruebas = lab.pruebas.filter((p) => !p.nivel || orden[n] >= orden[p.nivel]);
        const r = LT.xlsx.revisar(L, pruebas, n);
        const ok = r.every((x) => x.ok);
        info.textContent = 'Archivo revisado: ' + libroArchivo.name + (pdf ? ' + ' + pdf.name : '') + (docx ? ' + ' + docx.name : '') + ' · ' + r.filter((x) => x.ok).length + ' de ' + r.length + ' pruebas superadas.';
        res.appendChild(resultadosLista(r, true));
        if (ok) {
          LT.progreso.actualizarModulo(id, (m) => { m.lab = { ok: true, nivel: n, fecha: new Date().toISOString(), archivo: libroArchivo.name }; });
          res.appendChild(h('div', { class: 'exito' }, h('div', { html: LT.CURSO.insignia(id, { tam: 56, estrella: true }) }), h('div', null, h('h4', null, '¡Laboratorio aprobado!'), h('p', null, 'Transferiste lo aprendido a Excel real. Tu insignia ahora tiene estrella.'))));
          LT.ui.toast('Laboratorio del módulo ' + id + ' aprobado.', 'ok');
        } else {
          LT.progreso.actualizarModulo(id, (m) => { if (!m.lab || !m.lab.ok) m.lab = { ok: false, fecha: new Date().toISOString(), puntaje: r.filter((x) => x.ok).length + '/' + r.length }; });
        }
      } catch (err) {
        console.error(err);
        info.textContent = '';
        res.appendChild(h('div', { class: 'aviso-caja error' }, err.message || 'No se pudo leer el archivo.'));
      }
      inp.value = '';
    };
    inp.addEventListener('change', () => procesar(inp.files));
    zona.addEventListener('dragover', (e) => { e.preventDefault(); zona.classList.add('encima'); });
    zona.addEventListener('dragleave', () => zona.classList.remove('encima'));
    zona.addEventListener('drop', (e) => { e.preventDefault(); zona.classList.remove('encima'); procesar(e.dataTransfer.files); });
    der.append(h('h3', null, 'Verificador de archivos'), h('p', { style: { fontSize: '.9rem', color: 'var(--tinta-2)' } }, 'Tu archivo se revisa aquí mismo, en tu navegador: no se envía a ningún servidor.'), zona, info, res);
    const previo = LT.progreso.modulo(id).lab;
    if (previo && previo.ok) res.appendChild(h('div', { class: 'aviso-caja ok' }, '✓ Ya aprobaste este laboratorio (' + new Date(previo.fecha).toLocaleDateString('es-MX') + ', nivel ' + previo.nivel + '). Puedes volver a subirlo en otro nivel.'));
    return cont;
  }

  LT.modulo = { opciones, resultadosLista, contenedorHoja, NIVELES_RETO };
})();
