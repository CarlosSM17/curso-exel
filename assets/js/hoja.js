/* Simulador de hoja de cálculo con el motor HyperFormula configurado en español.
   LT.motor: utilidades del motor (traducción de fórmulas, construcción de instancias).
   LT.Hoja: componente de cuadrícula interactiva. */
(function () {
  'use strict';
  const LT = window.LT;
  const { h, clamp } = LT.u;
  const R = LT.refs;
  const F = LT.formato;
  const HFG = window.HyperFormula;

  /* ============================================================ MOTOR */
  let idiomaListo = false;
  function prepararIdioma() {
    if (idiomaListo) return;
    if (!HFG.getRegisteredLanguagesCodes().includes('esES')) HFG.registerLanguage('esES', HFG.languages.esES);
    idiomaListo = true;
  }
  const CONFIG = {
    licenseKey: 'gpl-v3',
    language: 'esES',
    useArrayArithmetic: true,
    dateFormats: ['DD/MM/YYYY', 'DD/MM/YY'],
    timeFormats: ['hh:mm', 'hh:mm:ss.sss'],
    smartRounding: true,
    useStats: false,
  };

  /* Traduce lo que escribe el participante al dialecto del motor */
  function aMotor(formula) {
    let out = '';
    let llaves = 0;
    const toks = [];
    R.recorrerFormula(formula, (t) => toks.push(t));
    toks.forEach((t, i) => {
      if (t.tipo === 'otro') {
        if (t.txt === '{') llaves++;
        if (t.txt === '}') llaves--;
        out += t.txt === ';' && llaves === 0 ? ',' : t.txt;
      } else if (t.tipo === 'id') {
        const up = t.txt.toUpperCase();
        const sig = toks[i + 1];
        const esFuncion = sig && sig.txt === '(';
        if (esFuncion && LT.ALIAS_MOTOR[up]) out += LT.ALIAS_MOTOR[up];
        else if ((up === 'VERDADERO' || up === 'FALSO') && !esFuncion) out += up + '()';
        else out += t.txt;
      } else out += t.txt;
    });
    return out;
  }
  /* Traducción inversa (al reconstruir fórmulas desde el motor) */
  function deMotor(formula) {
    let out = '';
    const toks = [];
    R.recorrerFormula(formula, (t) => toks.push(t));
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (t.tipo === 'id') {
        const up = t.txt.toUpperCase();
        if ((up === 'VERDADERO' || up === 'FALSO') && toks[i + 1] && toks[i + 1].txt === '(' && toks[i + 2] && toks[i + 2].txt === ')') { out += up; i += 2; continue; }
        if (toks[i + 1] && toks[i + 1].txt === '(' && LT.ALIAS_INVERSO[up]) { out += LT.ALIAS_INVERSO[up]; continue; }
      }
      out += t.txt;
    }
    return out;
  }
  /* Completa paréntesis faltantes al final, como hace Excel */
  function cerrarParentesis(f) {
    let n = 0;
    R.recorrerFormula(f, (t) => { if (t.txt === '(') n++; else if (t.txt === ')') n--; });
    return n > 0 ? f + ')'.repeat(n) : f;
  }
  function contenidoMotor(raw) {
    if (raw == null || raw === '') return null;
    const i = F.interpretar(raw);
    switch (i.tipo) {
      case 'formula': return aMotor(i.valor);
      case 'numero': case 'logico': return i.valor;
      case 'texto': {
        const s = i.valor;
        // evita que el motor convierta en número un texto que lo parece
        if (/^[\s=+\-\d.$%(]/.test(s) || /^(true|false|verdadero|falso)$/i.test(s) || /\d+[\/:]\d+/.test(s)) return "'" + s;
        return s;
      }
      default: return null;
    }
  }
  function esError(v) { return v && typeof v === 'object' && 'type' in v && 'value' in v; }
  function textoError(v) {
    if (v.type === 'NA') return '#N/A';
    if (v.type === 'ERROR') return '#¿NOMBRE?';
    if (v.type === 'LIC') return '#LIC!';
    return v.value;
  }
  /* Construye una instancia del motor a partir de {Hoja: {A1: raw}} */
  function crearMotor(hojas, nombres) {
    prepararIdioma();
    const sheets = {};
    for (const [nombre, celdas] of Object.entries(hojas)) {
      const mat = [];
      for (const [d, raw] of Object.entries(celdas)) {
        const p = R.parseCelda(d);
        if (!p) continue;
        while (mat.length <= p.r) mat.push([]);
        const fila = mat[p.r];
        while (fila.length <= p.c) fila.push(null);
        fila[p.c] = contenidoMotor(raw);
      }
      sheets[nombre] = mat.map((f) => f.map((x) => (x === undefined ? null : x)));
    }
    const hf = HFG.buildFromSheets(sheets, CONFIG);
    for (const [n, ref] of Object.entries(nombres || {})) {
      try { hf.addNamedExpression(n, aMotor(ref[0] === '=' ? ref : '=' + ref)); } catch (e) { /* nombre inválido */ }
    }
    return hf;
  }
  function valorEn(hf, hoja, d) {
    const id = hf.getSheetId(hoja);
    const p = R.parseCelda(d);
    if (id === undefined || !p) return null;
    const v = hf.getCellValue({ sheet: id, row: p.r, col: p.c });
    return esError(v) ? { error: textoError(v), tipo: v.type } : v;
  }

  LT.motor = { aMotor, deMotor, contenidoMotor, crearMotor, valorEn, esError, textoError, cerrarParentesis, prepararIdioma, CONFIG };

  /* ============================================================ HOJA */
  const ALTO = 24, ANCHO = 90, ANCHO_ENC = 44;
  const COLORES_REF = ['#1f6fd1', '#c0392b', '#7d3c98', '#16a085', '#d35400', '#b7950b'];
  const k = (r, c) => r + ',' + c;
  const dk = (s) => s.split(',').map(Number);
  let PORTAPAPELES = null;
  const LISTAS = [
    ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'],
    ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'],
    ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    ['t1', 't2', 't3', 't4'],
  ];

  function nuevaHoja(nombre, def) {
    def = def || {};
    return {
      nombre,
      celdas: new Map(), estilos: new Map(),
      filas: def.filas || 30, cols: def.cols || 10, anchos: [],
      oculta: !!def.oculta, color: def.color || null,
      inmov: { f: (def.inmovilizar && def.inmovilizar.filas) || 0, c: (def.inmovilizar && def.inmovilizar.cols) || 0 },
      validaciones: [], condicionales: [], filtro: null, filasOcultas: new Set(),
      protegida: !!def.protegida, comentarios: new Map(), notas: new Map(), objetos: [],
      objetivo: def.objetivo || null, tablasDatos: [],
    };
  }

  function clonarEstilo(e) { return e ? JSON.parse(JSON.stringify(e)) : null; }

  class Hoja {
    constructor(contenedor, opts) {
      prepararIdioma();
      this.opts = Object.assign({
        altura: 340, barraFormulas: true, pestanas: null, herramientas: [], editarHojas: false,
        estado: true, soloLectura: false, autor: 'Tú', capaObjetos: false,
      }, opts || {});
      this.cont = contenedor;
      this.oyentes = {};
      this.pilaDeshacer = [];
      this.pilaRehacer = [];
      this.sel = { ar: 0, ac: 0, fr: 0, fc: 0 };
      this.edicion = null;
      this.mostrarFormulas = false;
      this.flechas = null;
      this.resaltes = [];
      this.escenarios = [];
      this.libro = this._libroDesdeConfig(this.opts);
      this.inicial = this.exportar();
      (Hoja.instancias = Hoja.instancias || []).push(this);
      this._construir();
      this.reconstruirMotor();
      this.renderHoja();
    }

    /* ------------------------------------------------------ eventos */
    on(ev, fn) { (this.oyentes[ev] = this.oyentes[ev] || []).push(fn); return this; }
    emitir(ev, dato) { (this.oyentes[ev] || []).forEach((fn) => { try { fn(dato, this); } catch (e) { console.error(e); } }); }

    /* ------------------------------------------------ modelo / config */
    _libroDesdeConfig(opts) {
      const libro = { hojas: [], nombres: Object.assign({}, opts.nombres || {}), activa: 0 };
      const defs = opts.hojas && opts.hojas.length ? opts.hojas : [{ nombre: 'Hoja1' }];
      for (const def of defs) {
        const hj = nuevaHoja(def.nombre || 'Hoja' + (libro.hojas.length + 1), def);
        let maxR = 0, maxC = 0;
        const poner = (r, c, v) => {
          if (v == null || v === '') return;
          hj.celdas.set(k(r, c), String(v));
          maxR = Math.max(maxR, r); maxC = Math.max(maxC, c);
        };
        if (def.datos) {
          const ini = def.inicio ? R.parseCelda(def.inicio) : { r: 0, c: 0 };
          def.datos.forEach((fila, i) => fila.forEach((v, j) => poner(ini.r + i, ini.c + j, v)));
        }
        if (def.celdas) for (const [d, v] of Object.entries(def.celdas)) { const p = R.parseCelda(d); if (p) poner(p.r, p.c, v); }
        if (def.formatos) for (const [rg, fmt] of Object.entries(def.formatos)) for (const x of R.celdasDe(rg)) this._estiloModelo(hj, x.r, x.c, { fmt });
        if (def.estilos) for (const [rg, est] of Object.entries(def.estilos)) for (const x of R.celdasDe(rg)) this._estiloModelo(hj, x.r, x.c, est);
        if (def.anchos) for (const [col, px] of Object.entries(def.anchos)) hj.anchos[R.colIndice(col)] = px;
        if (def.validaciones) hj.validaciones = JSON.parse(JSON.stringify(def.validaciones));
        if (def.condicionales) hj.condicionales = JSON.parse(JSON.stringify(def.condicionales));
        if (def.comentarios) for (const [d, hilo] of Object.entries(def.comentarios)) { const p = R.parseCelda(d); hj.comentarios.set(k(p.r, p.c), JSON.parse(JSON.stringify(hilo))); }
        if (def.notas) for (const [d, t] of Object.entries(def.notas)) { const p = R.parseCelda(d); hj.notas.set(k(p.r, p.c), t); }
        if (def.bloqueo) for (const [rg, val] of Object.entries(def.bloqueo)) for (const x of R.celdasDe(rg)) this._estiloModelo(hj, x.r, x.c, { desbloqueada: !val });
        if (def.objetos) hj.objetos = JSON.parse(JSON.stringify(def.objetos));
        hj.filas = Math.max(def.filas || 0, maxR + 1 + (def.filasExtra != null ? def.filasExtra : 6), 12);
        hj.cols = Math.max(def.cols || 0, maxC + 1 + (def.colsExtra != null ? def.colsExtra : 2), 6);
        libro.hojas.push(hj);
      }
      if (opts.activa) {
        const i = libro.hojas.findIndex((x) => x.nombre === opts.activa);
        if (i >= 0) libro.activa = i;
      }
      return libro;
    }
    _estiloModelo(hj, r, c, props) {
      const kk = k(r, c);
      const e = Object.assign({}, hj.estilos.get(kk) || {}, props);
      for (const p of Object.keys(e)) if (e[p] == null || e[p] === false || e[p] === '') delete e[p];
      if (Object.keys(e).length) hj.estilos.set(kk, e); else hj.estilos.delete(kk);
    }
    get hj() { return this.libro.hojas[this.libro.activa]; }
    idHoja(i) { return this.hf.getSheetId(this.libro.hojas[i == null ? this.libro.activa : i].nombre); }
    indiceHoja(nombre) {
      if (nombre == null) return this.libro.activa;
      return this.libro.hojas.findIndex((x) => x.nombre.toLowerCase() === String(nombre).toLowerCase());
    }

    exportar() {
      const aObj = (m, fn) => { const o = {}; for (const [kk, v] of m) { const [r, c] = dk(kk); o[R.dir(r, c)] = fn ? fn(v) : v; } return o; };
      return {
        hojas: this.libro.hojas.map((hj) => ({
          nombre: hj.nombre, celdas: aObj(hj.celdas), estilos: aObj(hj.estilos, clonarEstilo),
          filas: hj.filas, cols: hj.cols, anchos: hj.anchos.slice(), oculta: hj.oculta, color: hj.color,
          inmov: Object.assign({}, hj.inmov), validaciones: JSON.parse(JSON.stringify(hj.validaciones)),
          condicionales: JSON.parse(JSON.stringify(hj.condicionales)), filtro: hj.filtro ? JSON.parse(JSON.stringify(hj.filtro)) : null,
          filasOcultas: Array.from(hj.filasOcultas), protegida: hj.protegida,
          comentarios: aObj(hj.comentarios, (x) => JSON.parse(JSON.stringify(x))), notas: aObj(hj.notas),
          objetos: JSON.parse(JSON.stringify(hj.objetos)), objetivo: hj.objetivo, tablasDatos: JSON.parse(JSON.stringify(hj.tablasDatos)),
        })),
        nombres: Object.assign({}, this.libro.nombres),
        activa: this.libro.activa,
        escenarios: JSON.parse(JSON.stringify(this.escenarios)),
      };
    }
    importar(est, opciones) {
      const deObj = (o, fn) => { const m = new Map(); for (const [d, v] of Object.entries(o || {})) { const p = R.parseCelda(d); if (p) m.set(k(p.r, p.c), fn ? fn(v) : v); } return m; };
      this.libro = {
        hojas: est.hojas.map((x) => Object.assign(nuevaHoja(x.nombre), {
          celdas: deObj(x.celdas), estilos: deObj(x.estilos, clonarEstilo), filas: x.filas, cols: x.cols, anchos: (x.anchos || []).slice(),
          oculta: !!x.oculta, color: x.color || null, inmov: Object.assign({ f: 0, c: 0 }, x.inmov),
          validaciones: JSON.parse(JSON.stringify(x.validaciones || [])), condicionales: JSON.parse(JSON.stringify(x.condicionales || [])),
          filtro: x.filtro ? JSON.parse(JSON.stringify(x.filtro)) : null, filasOcultas: new Set(x.filasOcultas || []),
          protegida: !!x.protegida, comentarios: deObj(x.comentarios, (v) => JSON.parse(JSON.stringify(v))), notas: deObj(x.notas),
          objetos: JSON.parse(JSON.stringify(x.objetos || [])), objetivo: x.objetivo || null, tablasDatos: JSON.parse(JSON.stringify(x.tablasDatos || [])),
        })),
        nombres: Object.assign({}, est.nombres || {}),
        activa: Math.min(est.activa || 0, est.hojas.length - 1),
      };
      this.escenarios = JSON.parse(JSON.stringify(est.escenarios || []));
      this.cancelarEdicion();
      this.reconstruirMotor();
      if (!opciones || !opciones.conservarSeleccion) this.sel = { ar: 0, ac: 0, fr: 0, fc: 0 };
      this.renderHoja();
      this.emitir('cambio', { tipo: 'importar' });
    }
    restablecer() { this.guardarDeshacer(); this.importar(this.inicial); }

    /* ------------------------------------------------------- motor */
    reconstruirMotor() {
      if (this.hf) { try { this.hf.destroy(); } catch (e) { /* */ } }
      const hojas = {};
      for (const hj of this.libro.hojas) {
        const o = {};
        for (const [kk, raw] of hj.celdas) { const [r, c] = dk(kk); o[R.dir(r, c)] = raw; }
        hojas[hj.nombre] = o;
      }
      this.hf = crearMotor(hojas, this.libro.nombres);
    }
    _sincronizarCelda(hIdx, r, c) {
      const raw = this.libro.hojas[hIdx].celdas.get(k(r, c));
      this.hf.setCellContents({ sheet: this.idHoja(hIdx), row: r, col: c }, [[contenidoMotor(raw)]]);
    }
    valor(ref) {
      let hIdx = this.libro.activa, d = ref;
      if (String(ref).includes('!')) { const rg = R.parseRango(ref); hIdx = this.indiceHoja(rg.hoja); d = R.dir(rg.r1, rg.c1); }
      const p = R.parseCelda(d);
      const v = this.hf.getCellValue({ sheet: this.idHoja(hIdx), row: p.r, col: p.c });
      return esError(v) ? { error: textoError(v), tipo: v.type } : v;
    }
    entrada(ref) {
      let hIdx = this.libro.activa, d = ref;
      if (String(ref).includes('!')) { const rg = R.parseRango(ref); hIdx = this.indiceHoja(rg.hoja); d = R.dir(rg.r1, rg.c1); }
      const p = R.parseCelda(d);
      return this.libro.hojas[hIdx].celdas.get(k(p.r, p.c)) || '';
    }
    estilo(ref) {
      let hIdx = this.libro.activa, d = ref;
      if (String(ref).includes('!')) { const rg = R.parseRango(ref); hIdx = this.indiceHoja(rg.hoja); d = R.dir(rg.r1, rg.c1); }
      const p = R.parseCelda(d);
      return Object.assign({}, this.libro.hojas[hIdx].estilos.get(k(p.r, p.c)) || {});
    }
    /* Escribe en una celda desde código (módulos, plantillas, macros) */
    establecer(ref, raw, opciones) {
      let hIdx = this.libro.activa, d = ref;
      if (String(ref).includes('!')) { const rg = R.parseRango(ref); hIdx = this.indiceHoja(rg.hoja); d = R.dir(rg.r1, rg.c1); }
      const p = R.parseCelda(d);
      if (!opciones || !opciones.sinDeshacer) this.guardarDeshacer();
      this._ponerRaw(hIdx, p.r, p.c, raw);
      this.pintar();
      this.emitir('cambio', { tipo: 'valor', hoja: hIdx, r: p.r, c: p.c });
    }
    _ponerRaw(hIdx, r, c, raw, sinMotor) {
      const hj = this.libro.hojas[hIdx];
      const kk = k(r, c);
      if (raw == null || raw === '') hj.celdas.delete(kk);
      else {
        let txt = String(raw);
        const info = F.interpretar(txt);
        if (info.tipo === 'formula') txt = R.normalizarFormula(txt);
        hj.celdas.set(kk, txt);
        const est = hj.estilos.get(kk);
        if (info.fmt && (!est || !est.fmt)) this._estiloModelo(hj, r, c, { fmt: info.fmt });
      }
      if (r >= hj.filas) hj.filas = r + 6;
      if (c >= hj.cols) hj.cols = c + 2;
      if (!sinMotor) this._sincronizarCelda(hIdx, r, c);
    }
    /* Escribe muchas celdas de una vez: lista [{h, r, c, raw}] */
    _ponerVarios(lista) {
      this.hf.batch(() => { for (const x of lista) this._ponerRaw(x.h == null ? this.libro.activa : x.h, x.r, x.c, x.raw); });
    }

    /* ------------------------------------------------------ deshacer */
    guardarDeshacer() {
      this.pilaDeshacer.push(this.exportar());
      if (this.pilaDeshacer.length > 60) this.pilaDeshacer.shift();
      this.pilaRehacer = [];
    }
    deshacer() {
      if (!this.pilaDeshacer.length) return;
      this.pilaRehacer.push(this.exportar());
      this.importar(this.pilaDeshacer.pop(), { conservarSeleccion: true });
    }
    rehacer() {
      if (!this.pilaRehacer.length) return;
      this.pilaDeshacer.push(this.exportar());
      this.importar(this.pilaRehacer.pop(), { conservarSeleccion: true });
    }

    /* ================================================== CONSTRUCCIÓN DOM */
    _construir() {
      const o = this.opts;
      this.raiz = h('div', { class: 'hoja' + (o.soloLectura ? ' solo-lectura' : '') + (o.clase ? ' ' + o.clase : '') });
      this.herr = h('div', { class: 'hoja-herr' });
      this.raiz.appendChild(this.herr);
      if (o.barraFormulas) {
        this.cuadroNombre = h('input', { class: 'hoja-nombre', 'aria-label': 'Cuadro de nombres', spellcheck: 'false' });
        this.fx = h('input', { class: 'hoja-fxin', 'aria-label': 'Barra de fórmulas', spellcheck: 'false', autocomplete: 'off' });
        this.raiz.appendChild(h('div', { class: 'hoja-fx' }, this.cuadroNombre, h('span', { class: 'hoja-fxlbl', title: 'Insertar función' }, 'fx'), this.fx));
        this.cuadroNombre.addEventListener('keydown', (e) => this._teclaNombre(e));
        this.cuadroNombre.addEventListener('focus', () => this.cuadroNombre.select());
        this.fx.addEventListener('focus', () => {
          if (this.edicion) this.edicion.superficie = 'barra';
          else if (!o.soloLectura) this.iniciarEdicion('editar', null, 'barra');
        });
        this.fx.addEventListener('blur', () => this._alSalirEditor());
        this.fx.addEventListener('input', () => { if (this.edicion) { this.edicion.texto = this.fx.value; this.edicion.punto = null; this._editorDesdeTexto('barra'); } });
        this.fx.addEventListener('keydown', (e) => this._teclaEditor(e, 'barra'));
        this.fx.addEventListener('keyup', () => this._actualizarAyuda('barra'));
        this.fx.addEventListener('click', () => this._actualizarAyuda('barra'));
      }
      this.area = h('div', { class: 'hoja-area', tabindex: '0', style: { height: o.altura + 'px' }, role: 'grid', 'aria-label': 'Hoja de cálculo' });
      this.lienzo = h('div', { class: 'hoja-lienzo' });
      this.area.appendChild(this.lienzo);
      this.cajaSel = h('div', { class: 'hoja-sel' });
      this.asa = h('div', { class: 'hoja-asa', title: 'Controlador de relleno: arrastra para copiar o crear una serie; doble clic para rellenar hasta el final' });
      this.cajaCopia = h('div', { class: 'hoja-copia' });
      this.capaRefs = h('div', { class: 'hoja-capa-refs' });
      this.editor = h('textarea', { class: 'hoja-editor', spellcheck: 'false', autocomplete: 'off', rows: '1', 'aria-label': 'Editor de celda' });
      this.ayuda = h('div', { class: 'hoja-ayuda' });
      this.btnLista = h('button', { class: 'hoja-btnlista', tabindex: '-1', title: 'Elegir de la lista', 'aria-label': 'Elegir de la lista' }, '▾');
      this.capaObj = h('div', { class: 'hoja-capa-obj' });
      this.svgFlechas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      this.svgFlechas.setAttribute('class', 'hoja-flechas');
      this.raiz.appendChild(this.area);
      this.pestanas = h('div', { class: 'hoja-pestanas' });
      this.estadoEl = h('div', { class: 'hoja-estado' });
      this.modoEl = h('span', { class: 'hoja-modo' }, 'Listo');
      this.raiz.appendChild(h('div', { class: 'hoja-pie' }, this.pestanas, h('div', { class: 'hoja-pie-der' }, this.estadoEl, this.modoEl)));
      this.cont.innerHTML = '';
      this.cont.appendChild(this.raiz);

      // eventos de la cuadrícula
      this.area.addEventListener('mousedown', (e) => this._ratonAbajo(e));
      this.area.addEventListener('dblclick', (e) => this._dobleClic(e));
      this.area.addEventListener('keydown', (e) => this._tecla(e));
      this.area.addEventListener('contextmenu', (e) => this._menuContextual(e));
      this.area.addEventListener('copy', (e) => this._copiar(e, false));
      this.area.addEventListener('cut', (e) => this._copiar(e, true));
      this.area.addEventListener('paste', (e) => this._pegarEvento(e));
      this.area.addEventListener('scroll', () => this._ocultarMenus());
      this.area.addEventListener('mousemove', (e) => this._ratonSobre(e));
      this.editor.addEventListener('keydown', (e) => this._teclaEditor(e, 'celda'));
      this.editor.addEventListener('focus', () => { if (this.edicion) this.edicion.superficie = 'celda'; });
      this.editor.addEventListener('blur', () => this._alSalirEditor());
      this.editor.addEventListener('input', () => { if (this.edicion) { this.edicion.texto = this.editor.value; this.edicion.punto = null; this._editorDesdeTexto('celda'); } });
      this.editor.addEventListener('keyup', (e) => { if (!/^Arrow|Enter|Tab|Escape/.test(e.key)) this._actualizarAyuda('celda'); });
      this.editor.addEventListener('click', () => this._actualizarAyuda('celda'));
      this.btnLista.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); this._abrirListaValidacion(); });
      this._docMove = (e) => this._ratonMueve(e);
      this._docUp = (e) => this._ratonArriba(e);
      document.addEventListener('mousemove', this._docMove);
      document.addEventListener('mouseup', this._docUp);
      if (LT.HojaHerramientas) LT.HojaHerramientas.montar(this);
    }
    destruir() {
      document.removeEventListener('mousemove', this._docMove);
      document.removeEventListener('mouseup', this._docUp);
      try { this.hf.destroy(); } catch (e) { /* */ }
      this.raiz.remove();
    }
    enfocar() { try { this.area.focus({ preventScroll: true }); } catch (e) { this.area.focus(); } }

    /* ------------------------------------------------- render de la hoja */
    renderHoja() {
      const hj = this.hj;
      this._ocultarMenus();
      const tabla = h('table', { class: 'hoja-tabla' });
      const cg = h('colgroup');
      cg.appendChild(h('col', { style: { width: ANCHO_ENC + 'px' } }));
      for (let c = 0; c < hj.cols; c++) cg.appendChild(h('col', { style: { width: (hj.anchos[c] || ANCHO) + 'px' } }));
      tabla.appendChild(cg);
      const thead = h('thead');
      const trh = h('tr');
      trh.appendChild(h('th', { class: 'esq', title: 'Seleccionar todo' }));
      for (let c = 0; c < hj.cols; c++) trh.appendChild(h('th', { class: 'enc-col' }, R.colLetra(c), h('span', { class: 'redim', title: 'Arrastra para cambiar el ancho; doble clic para autoajustar' })));
      thead.appendChild(trh);
      tabla.appendChild(thead);
      const tbody = h('tbody');
      this.tds = [];
      for (let r = 0; r < hj.filas; r++) {
        const tr = h('tr');
        tr.appendChild(h('th', { class: 'enc-fila' }, String(r + 1)));
        const fila = [];
        for (let c = 0; c < hj.cols; c++) { const td = document.createElement('td'); tr.appendChild(td); fila.push(td); }
        if (hj.filasOcultas.has(r)) tr.style.display = 'none';
        tbody.appendChild(tr);
        this.tds.push(fila);
      }
      tabla.appendChild(tbody);
      this.tabla = tabla;
      this.lienzo.innerHTML = '';
      this.lienzo.appendChild(tabla);
      this.lienzo.appendChild(this.capaRefs);
      this.lienzo.appendChild(this.cajaCopia);
      this.lienzo.appendChild(this.cajaSel);
      this.lienzo.appendChild(this.asa);
      this.lienzo.appendChild(this.svgFlechas);
      this.lienzo.appendChild(this.capaObj);
      this.lienzo.appendChild(this.btnLista);
      this.lienzo.appendChild(this.editor);
      this.lienzo.appendChild(this.ayuda);
      this._aplicarInmovilizar();
      this._renderPestanas();
      this.sel.ar = clamp(this.sel.ar, 0, hj.filas - 1); this.sel.fr = clamp(this.sel.fr, 0, hj.filas - 1);
      this.sel.ac = clamp(this.sel.ac, 0, hj.cols - 1); this.sel.fc = clamp(this.sel.fc, 0, hj.cols - 1);
      this.pintar();
      this.emitir('hoja', { indice: this.libro.activa });
    }

    /* Paneles inmovilizados: cada celda guarda sus clases (_fija) y su posición (_pos) */
    _aplicarInmovilizar() {
      const hj = this.hj;
      const { f, c } = hj.inmov;
      this.tabla.classList.toggle('con-inmov', !!(f || c));
      const lefts = [];
      let left = ANCHO_ENC;
      for (let cc = 0; cc < c; cc++) { lefts.push(left); left += hj.anchos[cc] || ANCHO; }
      for (let r = 0; r < hj.filas; r++) {
        const tr = this.tabla.tBodies[0].rows[r];
        const top = ALTO * (r + 1);
        const th = tr.cells[0];
        if (r < f) { th.style.top = top + 'px'; th.classList.add('fija-f'); if (r === f - 1) th.classList.add('borde-inmov-f'); }
        for (let cc = 0; cc < hj.cols; cc++) {
          const td = this.tds[r][cc];
          let cls = '', pos = '';
          if (r < f || cc < c) pos = 'position:sticky;';
          if (r < f) { cls += ' fija-f'; pos += 'top:' + top + 'px;'; if (r === f - 1) cls += ' borde-inmov-f'; }
          if (cc < c) { cls += ' fija-c'; pos += 'left:' + lefts[cc] + 'px;'; if (cc === c - 1) cls += ' borde-inmov-c'; }
          td._fija = cls; td._pos = pos; td._c = null; td._s = null;
        }
      }
      for (let cc = 0; cc < c; cc++) {
        const th = this.tabla.tHead.rows[0].cells[cc + 1];
        th.style.left = lefts[cc] + 'px'; th.classList.add('fija-c');
      }
    }

    _renderPestanas() {
      const p = this.pestanas;
      p.innerHTML = '';
      const mostrar = this.opts.pestanas != null ? this.opts.pestanas : this.libro.hojas.length > 1 || this.opts.editarHojas;
      p.style.display = mostrar ? '' : 'none';
      if (!mostrar) return;
      this.libro.hojas.forEach((hj, i) => {
        if (hj.oculta) return;
        const t = h('button', {
          class: 'hoja-pestana' + (i === this.libro.activa ? ' activa' : ''), title: hj.nombre,
          style: hj.color ? { boxShadow: 'inset 0 -4px 0 ' + hj.color } : null,
        }, hj.nombre);
        t.addEventListener('mousedown', (e) => { e.preventDefault(); if (e.button === 0) this.activarHoja(i); });
        t.addEventListener('dblclick', () => { if (this.opts.editarHojas) this.comando('renombrarHoja', i); });
        t.addEventListener('contextmenu', (e) => { e.preventDefault(); if (this.opts.editarHojas) this._menuPestana(e, i); });
        p.appendChild(t);
      });
      if (this.opts.editarHojas) {
        p.appendChild(h('button', { class: 'hoja-pestana mas', title: 'Nueva hoja', 'aria-label': 'Nueva hoja', onclick: () => this.comando('insertarHoja') }, '+'));
      }
    }
    activarHoja(i) {
      if (i === this.libro.activa) return;
      if (this.edicion && !this._esFormulaEditable()) this.confirmarEdicion();
      this.libro.activa = i;
      this.flechas = null;
      const ed = this.edicion;
      if (!ed) this.sel = { ar: 0, ac: 0, fr: 0, fc: 0 };
      else if (ed.hoja !== i) this.sel = { ar: 0, ac: 0, fr: 0, fc: 0 };
      else this.sel = { ar: ed.r, ac: ed.c, fr: ed.r, fc: ed.c };
      this.renderHoja();
      if (ed) {
        // al señalar en otra hoja, la barra de fórmulas pasa a ser la superficie de edición
        this._posicionarEditor();
        const el = ed.hoja !== i && this.fx ? this.fx : this.editor;
        ed.superficie = el === this.fx ? 'barra' : 'celda';
        el.value = ed.texto;
        el.focus({ preventScroll: true });
        const pos = ed.punto ? ed.punto.fin : ed.texto.length;
        el.setSelectionRange(pos, pos);
      }
    }

    /* ------------------------------------------------------- pintar */
    _formatoAuto(hid, r, c) {
      const t = this.hf.getCellValueDetailedType({ sheet: hid, row: r, col: c });
      switch (t) {
        case 'NUMBER_DATE': return 'dd/mm/yyyy';
        case 'NUMBER_TIME': return 'hh:mm';
        case 'NUMBER_DATETIME': return 'dd/mm/yyyy hh:mm';
        case 'NUMBER_PERCENT': return '0%';
        case 'NUMBER_CURRENCY': return '$#,##0.00';
        default: return null;
      }
    }
    textoCelda(hIdx, r, c) {
      const hj = this.libro.hojas[hIdx];
      const raw = hj.celdas.get(k(r, c));
      const est = hj.estilos.get(k(r, c)) || {};
      const hid = this.idHoja(hIdx);
      if (this.mostrarFormulas && raw && raw[0] === '=') return { texto: raw, alinear: 'left' };
      const v = this.hf.getCellValue({ sheet: hid, row: r, col: c });
      if (esError(v)) {
        if (v.type === 'CYCLE') return { texto: '0', alinear: 'right', circular: true };
        return { texto: textoError(v), alinear: 'center', error: true };
      }
      if (v == null || v === '') return { texto: '' };
      let fmt = est.fmt;
      if (!fmt && typeof v === 'number' && raw && raw[0] === '=') fmt = this._formatoAuto(hid, r, c);
      const f = F.formatear(v, fmt);
      f.alinear = typeof v === 'number' ? 'right' : typeof v === 'boolean' ? 'center' : 'left';
      f.valor = v;
      return f;
    }
    pintar() {
      const hj = this.hj;
      const hIdx = this.libro.activa;
      if (!this.tds || this.tds.length !== hj.filas || (this.tds[0] && this.tds[0].length !== hj.cols)) { this.renderHoja(); return; }
      const cf = this._evaluarCondicionales(hj);
      const circulares = [];
      for (let r = 0; r < hj.filas; r++) {
        const fila = this.tds[r];
        for (let c = 0; c < hj.cols; c++) {
          const td = fila[c];
          const kk = k(r, c);
          const t = this.textoCelda(hIdx, r, c);
          const est = hj.estilos.get(kk);
          const fx = cf[kk];
          if (t.circular) circulares.push(R.dir(r, c));
          let cls = '';
          const al = (est && est.ha) || t.alinear || 'left';
          cls += ' a-' + al;
          if (t.error) cls += ' err';
          if (t.circular) cls += ' circ';
          if (hj.comentarios.has(kk)) cls += hj.comentarios.get(kk).resuelto ? ' com-resuelto' : ' com';
          if (hj.notas.has(kk)) cls += ' nota';
          if (est && est.link) cls += ' link';
          if (est && est.wrap) cls += ' wrap';
          if (this._esObjetivo(hj, r, c) && !hj.celdas.has(kk)) cls += ' objetivo';
          let st = '';
          if (est) {
            if (est.b) st += 'font-weight:700;';
            if (est.i) st += 'font-style:italic;';
            if (est.u) st += 'text-decoration:underline;';
            if (est.fs) st += 'font-size:' + est.fs + 'px;';
            if (est.fg) st += 'color:' + est.fg + ';';
            if (est.bg) st += 'background:' + est.bg + ';';
            if (est.bd) {
              if (est.bd.t) st += 'border-top:' + (est.bd.t === 2 ? '2px' : '1px') + ' solid #222;';
              if (est.bd.r) st += 'border-right:' + (est.bd.r === 2 ? '2px' : '1px') + ' solid #222;';
              if (est.bd.b) st += 'border-bottom:' + (est.bd.b === 2 ? '2px' : '1px') + ' solid #222;';
              if (est.bd.l) st += 'border-left:' + (est.bd.l === 2 ? '2px' : '1px') + ' solid #222;';
            }
          }
          if (t.color) st += 'color:' + t.color + ';';
          let texto = t.texto;
          if (fx) {
            if (fx.bg) st += 'background:' + fx.bg + ';';
            if (fx.fg) st += 'color:' + fx.fg + ';';
            if (fx.b) st += 'font-weight:700;';
            if (fx.barra != null) st += 'background-image:linear-gradient(90deg,' + fx.barraColor + ' ' + fx.barra + '%, transparent ' + fx.barra + '%);background-size:100% 70%;background-repeat:no-repeat;background-position:0 50%;';
            if (fx.icono) texto = fx.icono + ' ' + texto;
          }
          // el texto se desborda hacia celdas vacías a la derecha
          if (t.alinear === 'left' && texto && !(est && est.wrap) && c + 1 < hj.cols && !this._tieneContenido(hIdx, r, c + 1)) cls += ' desborda';
          if (td._fija) cls += td._fija;
          if (td._c !== cls) { td.className = cls; td._c = cls; }
          if (td._s !== st) { td.style.cssText = st + (td._pos || ''); td._s = st; }
          if (td._t !== texto) {
            if (fx && fx.iconoColor) { td.innerHTML = ''; td.appendChild(h('span', { style: { color: fx.iconoColor } }, fx.icono + ' ')); td.appendChild(document.createTextNode(t.texto)); }
            else td.textContent = texto;
            td._t = texto;
          }
        }
      }
      this.circulares = circulares;
      this._pintarObjetos();
      this._pintarSeleccion();
      this._pintarEstado();
      this._pintarFlechas();
      if (LT.HojaHerramientas && LT.HojaHerramientas.trasPintar) LT.HojaHerramientas.trasPintar(this);
    }
    _tieneContenido(hIdx, r, c) {
      const hj = this.libro.hojas[hIdx];
      if (hj.celdas.has(k(r, c))) return true;
      const v = this.hf.getCellValue({ sheet: this.idHoja(hIdx), row: r, col: c });
      return v != null && v !== '';
    }
    _esObjetivo(hj, r, c) {
      if (!hj.objetivo) return false;
      if (!hj._objetivoSet) {
        hj._objetivoSet = new Set(R.celdasDe(hj.objetivo).map((x) => k(x.r, x.c)));
      }
      return hj._objetivoSet.has(k(r, c));
    }

    /* --------------------------------------------- formato condicional */
    _evaluarCondicionales(hj) {
      const res = {};
      if (!hj.condicionales.length) return res;
      const hIdx = this.libro.hojas.indexOf(hj);
      const hid = this.idHoja(hIdx);
      const num = (r, c) => { const v = this.hf.getCellValue({ sheet: hid, row: r, col: c }); return typeof v === 'number' ? v : null; };
      const valorRegla = (txt, r, c, rg) => {
        if (txt == null) return null;
        const s = String(txt);
        if (s[0] === '=') {
          const f = R.desplazarFormula(s, r - rg.r1, c - rg.c1);
          try { const v = this.hf.calculateFormula(aMotor(f), hid); return esError(v) ? null : v; } catch (e) { return null; }
        }
        const i = F.interpretar(s);
        return i.tipo === 'numero' ? i.valor : s;
      };
      for (const regla of hj.condicionales) {
        const celdas = [];
        for (const parte of String(regla.rango).split(',')) {
          const rg = R.parseRango(parte);
          if (!rg) continue;
          for (let r = rg.r1; r <= rg.r2; r++) for (let c = rg.c1; c <= rg.c2; c++) celdas.push({ r, c, rg });
        }
        const nums = celdas.map((x) => num(x.r, x.c)).filter((v) => v != null);
        const min = Math.min(...nums), max = Math.max(...nums);
        const prom = nums.reduce((a, b) => a + b, 0) / (nums.length || 1);
        const ordenados = nums.slice().sort((a, b) => b - a);
        for (const { r, c, rg } of celdas) {
          const kk = k(r, c);
          if (res[kk] && res[kk].detener) continue;
          const v = this.hf.getCellValue({ sheet: hid, row: r, col: c });
          let ok = false;
          const fx = {};
          switch (regla.tipo) {
            case 'mayor': ok = typeof v === 'number' && v > valorRegla(regla.valor, r, c, rg); break;
            case 'menor': ok = typeof v === 'number' && v < valorRegla(regla.valor, r, c, rg); break;
            case 'mayorIgual': ok = typeof v === 'number' && v >= valorRegla(regla.valor, r, c, rg); break;
            case 'menorIgual': ok = typeof v === 'number' && v <= valorRegla(regla.valor, r, c, rg); break;
            case 'entre': { const a = valorRegla(regla.valor, r, c, rg), b = valorRegla(regla.valor2, r, c, rg); ok = typeof v === 'number' && v >= Math.min(a, b) && v <= Math.max(a, b); break; }
            case 'igual': { const a = valorRegla(regla.valor, r, c, rg); ok = v != null && String(v).toLowerCase() === String(a).toLowerCase(); break; }
            case 'texto': ok = typeof v === 'string' && v.toLowerCase().includes(String(regla.valor).toLowerCase()); break;
            case 'duplicados': ok = v != null && v !== '' && celdas.filter((x) => { const w = this.hf.getCellValue({ sheet: hid, row: x.r, col: x.c }); return w === v; }).length > 1; break;
            case 'superiores': ok = typeof v === 'number' && v >= (ordenados[(regla.valor || 10) - 1] ?? -Infinity); break;
            case 'inferiores': ok = typeof v === 'number' && v <= (ordenados[ordenados.length - (regla.valor || 10)] ?? Infinity); break;
            case 'sobrePromedio': ok = typeof v === 'number' && v > prom; break;
            case 'bajoPromedio': ok = typeof v === 'number' && v < prom; break;
            case 'formula': { const w = valorRegla(regla.formula, r, c, rg); ok = w === true || (typeof w === 'number' && w !== 0); break; }
            case 'barras':
              if (typeof v === 'number') { fx.barra = max === min ? 100 : Math.round(((v - Math.min(0, min)) / (max - Math.min(0, min))) * 100); fx.barraColor = regla.color || 'rgba(99,142,198,.55)'; }
              break;
            case 'escala':
              if (typeof v === 'number') {
                const t = max === min ? 0.5 : (v - min) / (max - min);
                const cols = regla.colores || ['#f8696b', '#ffeb84', '#63be7b'];
                fx.bg = mezclarEscala(cols, t);
              }
              break;
            case 'iconos':
              if (typeof v === 'number') {
                const t = max === min ? 1 : (v - min) / (max - min);
                const umbrales = regla.umbrales;
                let nivel;
                if (umbrales) nivel = v >= umbrales[0] ? 0 : v >= umbrales[1] ? 1 : 2;
                else nivel = t >= 0.67 ? 0 : t >= 0.33 ? 1 : 2;
                const juegos = { semaforo: [['●', '#2e9e4f'], ['●', '#e0a800'], ['●', '#d93025']], flechas: [['▲', '#2e9e4f'], ['▶', '#e0a800'], ['▼', '#d93025']], banderas: [['⚑', '#2e9e4f'], ['⚑', '#e0a800'], ['⚑', '#d93025']] };
                const j = juegos[regla.juego || 'semaforo'];
                fx.icono = j[nivel][0]; fx.iconoColor = j[nivel][1];
              }
              break;
          }
          if (ok) Object.assign(fx, regla.formato || { bg: '#ffc7ce', fg: '#9c0006' });
          if (Object.keys(fx).length) res[kk] = Object.assign(res[kk] || {}, fx);
        }
      }
      return res;
    }

    /* ---------------------------------------------- selección y overlays */
    get rango() {
      const s = this.sel;
      return { r1: Math.min(s.ar, s.fr), c1: Math.min(s.ac, s.fc), r2: Math.max(s.ar, s.fr), c2: Math.max(s.ac, s.fc) };
    }
    _rect(r1, c1, r2, c2) {
      const a = this.tds[r1] && this.tds[r1][c1], b = this.tds[r2] && this.tds[r2][c2];
      if (!a || !b) return null;
      return { x: a.offsetLeft, y: a.offsetTop, w: b.offsetLeft + b.offsetWidth - a.offsetLeft, h: b.offsetTop + b.offsetHeight - a.offsetTop };
    }
    seleccionar(ref, opciones) {
      const rg = typeof ref === 'string' ? R.parseRango(ref) : ref;
      if (!rg) return;
      if (rg.hoja) { const i = this.indiceHoja(rg.hoja); if (i >= 0 && i !== this.libro.activa) this.activarHoja(i); }
      this.sel = { ar: rg.r1, ac: rg.c1, fr: rg.r2, fc: rg.c2 };
      this._pintarSeleccion();
      this._pintarEstado();
      this._asegurarVisible(rg.r2, rg.c2);
      if (!opciones || !opciones.silencioso) this.emitir('accion', { tipo: 'seleccion', rango: R.textoRango(this.rango), activa: R.dir(this.sel.ar, this.sel.ac) });
    }
    _pintarSeleccion() {
      const rg = this.rango;
      const rc = this._rect(rg.r1, rg.c1, rg.r2, rg.c2);
      if (rc) {
        Object.assign(this.cajaSel.style, { left: rc.x - 1 + 'px', top: rc.y - 1 + 'px', width: rc.w + 1 + 'px', height: rc.h + 1 + 'px', display: 'block' });
        this.cajaSel.classList.toggle('multiple', rg.r1 !== rg.r2 || rg.c1 !== rg.c2);
        Object.assign(this.asa.style, { left: rc.x + rc.w - 4 + 'px', top: rc.y + rc.h - 4 + 'px', display: this.opts.soloLectura || this.edicion ? 'none' : 'block' });
      }
      // celda activa (resaltada dentro del rango)
      const act = this._rect(this.sel.ar, this.sel.ac, this.sel.ar, this.sel.ac);
      if (act && rc) {
        const st = this.cajaSel.style;
        st.setProperty('--act-x', act.x - rc.x + 'px');
        st.setProperty('--act-y', act.y - rc.y + 'px');
        st.setProperty('--act-w', act.w + 'px');
        st.setProperty('--act-h', act.h + 'px');
      }
      // encabezados resaltados
      const thead = this.tabla.tHead.rows[0].cells;
      for (let c = 0; c < this.hj.cols; c++) thead[c + 1].classList.toggle('sel', c >= rg.c1 && c <= rg.c2);
      const filas = this.tabla.tBodies[0].rows;
      for (let r = 0; r < this.hj.filas; r++) filas[r].cells[0].classList.toggle('sel', r >= rg.r1 && r <= rg.r2);
      // cuadro de nombres y barra de fórmulas
      if (this.cuadroNombre && document.activeElement !== this.cuadroNombre) {
        const nombre = Object.entries(this.libro.nombres).find(([, ref]) => {
          const p = R.parseRango(ref.replace(/^=/, ''));
          return p && this.indiceHoja(p.hoja) === this.libro.activa && p.r1 === rg.r1 && p.c1 === rg.c1 && p.r2 === rg.r2 && p.c2 === rg.c2;
        });
        this.cuadroNombre.value = nombre ? nombre[0] : R.dir(this.sel.ar, this.sel.ac);
      }
      if (this.fx && !this.edicion) this.fx.value = this.hj.celdas.get(k(this.sel.ar, this.sel.ac)) || '';
      // lista de validación
      const val = this._validacionDe(this.sel.ar, this.sel.ac);
      if (val && val.tipo === 'lista' && !this.opts.soloLectura && act) {
        Object.assign(this.btnLista.style, { display: 'block', left: act.x + act.w + 1 + 'px', top: act.y + 'px', height: act.h + 'px' });
      } else this.btnLista.style.display = 'none';
      this._pintarResaltes();
    }
    _asegurarVisible(r, c) {
      const td = this.tds[r] && this.tds[r][c];
      if (!td) return;
      const a = this.area;
      const top = td.offsetTop, izq = td.offsetLeft;
      const fijoArriba = ALTO * (1 + this.hj.inmov.f);
      let fijoIzq = ANCHO_ENC;
      for (let i = 0; i < this.hj.inmov.c; i++) fijoIzq += this.hj.anchos[i] || ANCHO;
      if (r >= this.hj.inmov.f) {
        if (top - fijoArriba < a.scrollTop) a.scrollTop = top - fijoArriba;
        else if (top + td.offsetHeight > a.scrollTop + a.clientHeight) a.scrollTop = top + td.offsetHeight - a.clientHeight;
      }
      if (c >= this.hj.inmov.c) {
        if (izq - fijoIzq < a.scrollLeft) a.scrollLeft = izq - fijoIzq;
        else if (izq + td.offsetWidth > a.scrollLeft + a.clientWidth) a.scrollLeft = izq + td.offsetWidth - a.clientWidth;
      }
    }
    /* Resaltados externos (ejemplos resueltos): [{rango:'C2', color}] */
    resaltar(lista) { this.resaltes = lista || []; this._pintarResaltes(); }
    _pintarResaltes() {
      this.capaRefs.innerHTML = '';
      const lista = [];
      if (this.edicion && this.edicion.hoja != null && this._esFormulaEditable()) {
        R.referenciasEn(this.edicion.texto).forEach((ref, i) => {
          const hIdx = ref.hoja ? this.indiceHoja(ref.hoja) : this.edicion.hoja;
          if (hIdx === this.libro.activa) lista.push({ r1: ref.r1, c1: ref.c1, r2: ref.r2, c2: ref.c2, color: COLORES_REF[i % COLORES_REF.length] });
        });
      }
      for (const x of this.resaltes) {
        const rg = R.parseRango(x.rango);
        if (rg && (!rg.hoja || this.indiceHoja(rg.hoja) === this.libro.activa)) lista.push(Object.assign({}, rg, { color: x.color || COLORES_REF[0], relleno: x.relleno }));
      }
      for (const x of lista) {
        const rc = this._rect(Math.min(x.r1, this.hj.filas - 1), Math.min(x.c1, this.hj.cols - 1), Math.min(x.r2, this.hj.filas - 1), Math.min(x.c2, this.hj.cols - 1));
        if (!rc) continue;
        this.capaRefs.appendChild(h('div', { class: 'hoja-ref', style: { left: rc.x - 1 + 'px', top: rc.y - 1 + 'px', width: rc.w + 1 + 'px', height: rc.h + 1 + 'px', borderColor: x.color, background: x.relleno === false ? 'transparent' : x.color + '1f' } }));
      }
      if (PORTAPAPELES && PORTAPAPELES.origen === this && PORTAPAPELES.hoja === this.libro.activa) {
        const g = PORTAPAPELES.rango;
        const rc = this._rect(g.r1, g.c1, g.r2, g.c2);
        if (rc) Object.assign(this.cajaCopia.style, { display: 'block', left: rc.x - 1 + 'px', top: rc.y - 1 + 'px', width: rc.w + 1 + 'px', height: rc.h + 1 + 'px' });
      } else this.cajaCopia.style.display = 'none';
    }
    _pintarEstado() {
      if (!this.opts.estado) { this.estadoEl.textContent = ''; return; }
      const rg = this.rango;
      const hid = this.idHoja();
      let n = 0, cnt = 0, suma = 0;
      if ((rg.r2 - rg.r1 + 1) * (rg.c2 - rg.c1 + 1) > 1) {
        for (let r = rg.r1; r <= rg.r2; r++) for (let c = rg.c1; c <= rg.c2; c++) {
          if (this.hj.filasOcultas.has(r)) continue;
          const v = this.hf.getCellValue({ sheet: hid, row: r, col: c });
          if (v != null && v !== '') cnt++;
          if (typeof v === 'number') { n++; suma += v; }
        }
      }
      let txt = '';
      if (this.circulares && this.circulares.length) txt = '⚠ Referencias circulares: ' + this.circulares[0];
      else if (this.hj.filtro) {
        const total = this.hj.filtro.r2 - this.hj.filtro.r1;
        const vis = total - Array.from(this.hj.filasOcultas).filter((r) => r > this.hj.filtro.r1 && r <= this.hj.filtro.r2).length;
        txt = 'Se encontraron ' + vis + ' de ' + total + ' registros';
      }
      if (cnt > 1) {
        const fmt = (x) => F.formatear(x, Math.abs(x) >= 1000 ? '#,##0.##' : 'General').texto.replace(/\.$/, '');
        txt = (txt ? txt + '   ' : '') + (n ? 'Promedio: ' + fmt(suma / n) + '   ' : '') + 'Recuento: ' + cnt + (n ? '   Suma: ' + fmt(suma) : '');
      }
      this.estadoEl.textContent = txt;
      this.estadoEl.classList.toggle('alerta', !!(this.circulares && this.circulares.length));
    }
    _pintarModo() {
      let m = 'Listo';
      if (this.edicion) m = this.edicion.punto ? 'Señalar' : this.edicion.modo === 'entrar' ? 'Introducir' : 'Modificar';
      this.modoEl.textContent = m;
    }

    /* ------------------------------------------------ flechas (auditoría) */
    rastrearPrecedentes() {
      const raw = this.hj.celdas.get(k(this.sel.ar, this.sel.ac)) || '';
      if (raw[0] !== '=') { LT.ui.toast('La celda activa no contiene una fórmula.', 'aviso'); return; }
      this.flechas = { hoja: this.libro.activa, r: this.sel.ar, c: this.sel.ac, refs: R.referenciasEn(raw) };
      this._pintarFlechas();
    }
    quitarFlechas() { this.flechas = null; this._pintarFlechas(); }
    _pintarFlechas() {
      const svg = this.svgFlechas;
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      if (!this.flechas || this.flechas.hoja !== this.libro.activa) { svg.style.display = 'none'; return; }
      svg.style.display = '';
      svg.setAttribute('width', this.tabla.offsetWidth);
      svg.setAttribute('height', this.tabla.offsetHeight);
      const ns = 'http://www.w3.org/2000/svg';
      const dest = this._rect(this.flechas.r, this.flechas.c, this.flechas.r, this.flechas.c);
      const defs = document.createElementNS(ns, 'defs');
      defs.innerHTML = '<marker id="pf-' + this.cont.id + '" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="#1f5fbf"/></marker>';
      svg.appendChild(defs);
      for (const ref of this.flechas.refs) {
        if (ref.hoja && this.indiceHoja(ref.hoja) !== this.libro.activa) continue;
        const o = this._rect(ref.r1, ref.c1, Math.min(ref.r2, this.hj.filas - 1), Math.min(ref.c2, this.hj.cols - 1));
        if (!o || !dest) continue;
        const caja = document.createElementNS(ns, 'rect');
        caja.setAttribute('x', o.x); caja.setAttribute('y', o.y); caja.setAttribute('width', o.w); caja.setAttribute('height', o.h);
        caja.setAttribute('fill', 'none'); caja.setAttribute('stroke', '#1f5fbf'); caja.setAttribute('stroke-width', '1.5');
        svg.appendChild(caja);
        const x1 = o.x + Math.min(o.w, 90) / 2, y1 = o.y + Math.min(o.h, 24) / 2;
        const x2 = dest.x + dest.w / 2, y2 = dest.y + dest.h / 2;
        const punto = document.createElementNS(ns, 'circle');
        punto.setAttribute('cx', x1); punto.setAttribute('cy', y1); punto.setAttribute('r', '3'); punto.setAttribute('fill', '#1f5fbf');
        svg.appendChild(punto);
        const linea = document.createElementNS(ns, 'line');
        linea.setAttribute('x1', x1); linea.setAttribute('y1', y1); linea.setAttribute('x2', x2); linea.setAttribute('y2', y2);
        linea.setAttribute('stroke', '#1f5fbf'); linea.setAttribute('stroke-width', '1.6');
        linea.setAttribute('marker-end', 'url(#pf-' + this.cont.id + ')');
        svg.appendChild(linea);
      }
    }

    /* ======================================================== RATÓN */
    _celdaDeEvento(e) {
      const td = e.target.closest && e.target.closest('td');
      if (!td || !this.tabla.contains(td)) return null;
      return { r: td.parentNode.rowIndex - 1, c: td.cellIndex - 1 };
    }
    _celdaEnPunto(x, y) {
      const el = document.elementFromPoint(x, y);
      if (!el) return null;
      const td = el.closest && el.closest('td');
      if (td && this.tabla.contains(td)) return { r: td.parentNode.rowIndex - 1, c: td.cellIndex - 1 };
      // fuera de la tabla: se aproxima con el borde más cercano
      const rect = this.tabla.getBoundingClientRect();
      const rr = clamp(Math.floor((y - rect.top - ALTO) / ALTO), 0, this.hj.filas - 1);
      let cc = 0, acc = rect.left + ANCHO_ENC;
      for (let c = 0; c < this.hj.cols; c++) { acc += this.hj.anchos[c] || ANCHO; if (x < acc) { cc = c; break; } cc = c; }
      return { r: rr, c: cc };
    }
    _ratonAbajo(e) {
      this._ocultarMenus();
      if (e.button !== 0) return;
      if (e.target === this.editor || e.target === this.btnLista) return;
      if (e.target.closest('.hoja-obj')) return; // los objetos manejan sus eventos
      if (e.target.classList.contains('redim')) { this._iniciarRedimension(e); return; }
      if (e.target === this.asa) { e.preventDefault(); this._arrastre = { tipo: 'relleno', origen: this.rango, destino: null }; return; }
      this._deseleccionarObjetos();
      const th = e.target.closest('th');
      if (th && this.tabla.contains(th)) {
        e.preventDefault();
        if (this.edicion) { if (!this.confirmarEdicion()) return; }
        if (th.classList.contains('esq')) { this.seleccionar({ r1: 0, c1: 0, r2: this.hj.filas - 1, c2: this.hj.cols - 1 }); this.enfocar(); return; }
        if (th.classList.contains('enc-col')) {
          const c = th.cellIndex - 1;
          this.sel = { ar: 0, ac: c, fr: this.hj.filas - 1, fc: c };
          this._arrastre = { tipo: 'columnas', c };
        } else if (th.classList.contains('enc-fila')) {
          const r = th.parentNode.rowIndex - 1;
          this.sel = { ar: r, ac: 0, fr: r, fc: this.hj.cols - 1 };
          this._arrastre = { tipo: 'filas', r };
        }
        this._pintarSeleccion(); this._pintarEstado(); this.enfocar();
        return;
      }
      const cel = this._celdaDeEvento(e);
      if (!cel) return;
      // modo señalar: clic en una celda mientras se escribe una fórmula
      if (this.edicion && this._puedeInsertarRef()) {
        e.preventDefault();
        this._insertarRefPunto(cel, cel);
        this._arrastre = { tipo: 'punto', ancla: cel };
        return;
      }
      if (this.edicion) { if (!this.confirmarEdicion()) { e.preventDefault(); return; } }
      e.preventDefault();
      if (this._pincel) { this._aplicarPincel(cel); return; }
      if (e.shiftKey) { this.sel.fr = cel.r; this.sel.fc = cel.c; }
      else this.sel = { ar: cel.r, ac: cel.c, fr: cel.r, fc: cel.c };
      this._arrastre = { tipo: 'seleccion' };
      this._pintarSeleccion(); this._pintarEstado();
      this.enfocar();
      const est = this.hj.estilos.get(k(cel.r, cel.c));
      if (est && est.link && e.ctrlKey) window.open(est.link, '_blank', 'noopener');
    }
    _ratonMueve(e) {
      const a = this._arrastre;
      if (!a) return;
      if (a.tipo === 'redim') {
        const ancho = Math.max(24, a.ancho0 + (e.clientX - a.x0));
        this.hj.anchos[a.c] = ancho;
        this.tabla.querySelectorAll('col')[a.c + 1].style.width = ancho + 'px';
        this._pintarSeleccion();
        return;
      }
      const cel = this._celdaEnPunto(e.clientX, e.clientY);
      if (!cel) return;
      if (a.tipo === 'seleccion') { this.sel.fr = cel.r; this.sel.fc = cel.c; }
      else if (a.tipo === 'columnas') { this.sel.fc = cel.c; this.sel.ac = a.c; }
      else if (a.tipo === 'filas') { this.sel.fr = cel.r; this.sel.ar = a.r; }
      else if (a.tipo === 'punto') { this._insertarRefPunto(a.ancla, cel); return; }
      else if (a.tipo === 'relleno') {
        const o = a.origen;
        let d = null;
        const abajo = cel.r - o.r2, arriba = o.r1 - cel.r, der = cel.c - o.c2, izq = o.c1 - cel.c;
        const m = Math.max(abajo, arriba, der, izq);
        if (m > 0) {
          if (m === abajo) d = { r1: o.r1, c1: o.c1, r2: cel.r, c2: o.c2 };
          else if (m === arriba) d = { r1: cel.r, c1: o.c1, r2: o.r2, c2: o.c2 };
          else if (m === der) d = { r1: o.r1, c1: o.c1, r2: o.r2, c2: cel.c };
          else d = { r1: o.r1, c1: cel.c, r2: o.r2, c2: o.c2 };
        }
        a.destino = d;
        const rg = d || o;
        const rc = this._rect(rg.r1, rg.c1, rg.r2, rg.c2);
        Object.assign(this.cajaCopia.style, { display: 'block', left: rc.x - 1 + 'px', top: rc.y - 1 + 'px', width: rc.w + 1 + 'px', height: rc.h + 1 + 'px' });
        this.cajaCopia.classList.add('relleno');
        return;
      }
      this._pintarSeleccion(); this._pintarEstado();
      const rect = this.area.getBoundingClientRect();
      if (e.clientY > rect.bottom - 10) this.area.scrollTop += 20;
      if (e.clientY < rect.top + 30) this.area.scrollTop -= 20;
    }
    _ratonArriba() {
      const a = this._arrastre;
      this._arrastre = null;
      if (!a) return;
      if (a.tipo === 'relleno') {
        this.cajaCopia.classList.remove('relleno');
        this._pintarResaltes();
        if (a.destino) this.rellenar(a.origen, a.destino);
      } else if (a.tipo === 'seleccion' || a.tipo === 'filas' || a.tipo === 'columnas') {
        this.emitir('accion', { tipo: 'seleccion', rango: R.textoRango(this.rango), activa: R.dir(this.sel.ar, this.sel.ac) });
      } else if (a.tipo === 'redim') {
        this.emitir('accion', { tipo: 'ancho', col: R.colLetra(a.c), ancho: this.hj.anchos[a.c] });
        this.pintar();
      }
    }
    _ratonSobre(e) {
      // muestra comentarios y notas al pasar el ratón
      const cel = this._celdaDeEvento(e);
      if (!cel) return;
      const kk = k(cel.r, cel.c);
      if ((this.hj.comentarios.has(kk) || this.hj.notas.has(kk)) && (!this._globo || this._globo.kk !== kk)) this._mostrarGlobo(cel);
    }
    _dobleClic(e) {
      if (e.target === this.asa) { this.rellenarHastaFinal(); return; }
      if (e.target.classList.contains('redim')) { const c = e.target.parentNode.cellIndex - 1; this.autoajustarColumna(c); return; }
      const cel = this._celdaDeEvento(e);
      if (!cel || this.opts.soloLectura) return;
      this.sel = { ar: cel.r, ac: cel.c, fr: cel.r, fc: cel.c };
      this.iniciarEdicion('editar');
    }
    _iniciarRedimension(e) {
      e.preventDefault();
      e.stopPropagation();
      const c = e.target.parentNode.cellIndex - 1;
      this._arrastre = { tipo: 'redim', c, x0: e.clientX, ancho0: this.hj.anchos[c] || ANCHO };
    }
    autoajustarColumna(c) {
      const medir = h('span', { class: 'hoja-medir' });
      this.raiz.appendChild(medir);
      let max = 30;
      for (let r = 0; r < this.hj.filas; r++) {
        const t = this.tds[r][c]._t;
        if (!t) continue;
        const est = this.hj.estilos.get(k(r, c)) || {};
        medir.style.fontWeight = est.b ? '700' : '400';
        medir.style.fontSize = est.fs ? est.fs + 'px' : '';
        medir.textContent = t;
        max = Math.max(max, medir.offsetWidth + 14);
      }
      medir.remove();
      this.hj.anchos[c] = Math.min(max, 420);
      this.renderHoja();
      this.emitir('accion', { tipo: 'autoajustar', col: R.colLetra(c) });
    }

    /* ====================================================== TECLADO */
    _tecla(e) {
      if (this.edicion) return;
      if (e.target !== this.area) return;
      const ctrl = e.ctrlKey || e.metaKey;
      const s = this.sel;
      const hj = this.hj;
      const mover = (dr, dc, extender) => {
        e.preventDefault();
        if (extender) {
          if (ctrl) { const p = this._saltoDatos(s.fr, s.fc, dr, dc); s.fr = p.r; s.fc = p.c; }
          else { s.fr = clamp(s.fr + dr, 0, hj.filas - 1); s.fc = clamp(s.fc + dc, 0, hj.cols - 1); }
          this._asegurarVisible(s.fr, s.fc);
        } else {
          let p;
          if (ctrl) p = this._saltoDatos(s.ar, s.ac, dr, dc);
          else {
            p = { r: clamp(s.ar + dr, 0, hj.filas - 1), c: clamp(s.ac + dc, 0, hj.cols - 1) };
            while (dr && hj.filasOcultas.has(p.r) && p.r > 0 && p.r < hj.filas - 1) p.r += dr;
          }
          this.sel = { ar: p.r, ac: p.c, fr: p.r, fc: p.c };
          this._asegurarVisible(p.r, p.c);
        }
        this._pintarSeleccion(); this._pintarEstado();
        this.emitir('accion', { tipo: 'seleccion', rango: R.textoRango(this.rango), activa: R.dir(this.sel.ar, this.sel.ac) });
      };
      switch (e.key) {
        case 'ArrowDown': return mover(1, 0, e.shiftKey);
        case 'ArrowUp': return mover(-1, 0, e.shiftKey);
        case 'ArrowRight': return mover(0, 1, e.shiftKey);
        case 'ArrowLeft': return mover(0, -1, e.shiftKey);
        case 'Enter': return mover(e.shiftKey ? -1 : 1, 0, false);
        case 'Tab': return mover(0, e.shiftKey ? -1 : 1, false);
        case 'PageDown': return mover(10, 0, e.shiftKey);
        case 'PageUp': return mover(-10, 0, e.shiftKey);
        case 'Home':
          e.preventDefault();
          this.sel = ctrl ? { ar: 0, ac: 0, fr: 0, fc: 0 } : { ar: s.ar, ac: 0, fr: s.ar, fc: 0 };
          this._asegurarVisible(this.sel.ar, 0); this._pintarSeleccion(); return;
        case 'F2': e.preventDefault(); if (!this.opts.soloLectura) this.iniciarEdicion('editar'); return;
        case 'F4': e.preventDefault(); return;
        case 'Delete': e.preventDefault(); if (!this.opts.soloLectura) this.borrarContenido(); return;
        case 'Backspace': e.preventDefault(); if (!this.opts.soloLectura) this.iniciarEdicion('entrar', ''); return;
        case 'Escape': if (PORTAPAPELES && PORTAPAPELES.origen === this) { PORTAPAPELES.marcado = false; this.cajaCopia.style.display = 'none'; } if (this._pincel) { this._pincel = null; this.raiz.classList.remove('pincel'); } return;
      }
      if (ctrl && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'z') { e.preventDefault(); this.deshacer(); return; }
        if (key === 'y') { e.preventDefault(); this.rehacer(); return; }
        if (key === 'j') { e.preventDefault(); this.rellenarAbajo(); return; }
        if (key === 'd') { e.preventDefault(); this.rellenarDerecha(); return; }
        if (key === 'a') { e.preventDefault(); this.seleccionar({ r1: 0, c1: 0, r2: hj.filas - 1, c2: hj.cols - 1 }); return; }
        if (e.key === '`' || e.code === 'Backquote') { e.preventDefault(); this.comando('mostrarFormulas'); return; }
        const atajos = { b: 'buscar', l: 'reemplazar', k: 'cursiva', s: 'subrayado', 1: 'formatoCeldas', g: null };
        if (key in atajos) { e.preventDefault(); if (atajos[key]) this.comando(atajos[key]); return; }
      }
      if (ctrl && e.altKey && e.key.toLowerCase() === 'v') { e.preventDefault(); this.comando('pegadoEspecial'); return; }
      if (e.altKey && (e.key === '=' || e.key === '0' && e.shiftKey)) { e.preventDefault(); this.comando('autosuma'); return; }
      if (!ctrl && !e.altKey && e.key.length === 1 && !this.opts.soloLectura) {
        e.preventDefault();
        this.iniciarEdicion('entrar', e.key);
      } else if (e.key.length === 1 && e.altKey && e.ctrlKey && !this.opts.soloLectura) {
        // AltGr (teclados en español: @, #, etc.)
        e.preventDefault();
        this.iniciarEdicion('entrar', e.key);
      }
    }
    _saltoDatos(r, c, dr, dc) {
      const hj = this.hj;
      const lleno = (rr, cc) => this._tieneContenido(this.libro.activa, rr, cc);
      const dentro = (rr, cc) => rr >= 0 && cc >= 0 && rr < hj.filas && cc < hj.cols;
      let rr = r, cc = c;
      if (lleno(rr, cc) && dentro(rr + dr, cc + dc) && lleno(rr + dr, cc + dc)) {
        while (dentro(rr + dr, cc + dc) && lleno(rr + dr, cc + dc)) { rr += dr; cc += dc; }
      } else {
        rr += dr; cc += dc;
        while (dentro(rr, cc) && !lleno(rr, cc) && dentro(rr + dr, cc + dc)) { rr += dr; cc += dc; }
      }
      return { r: clamp(rr, 0, hj.filas - 1), c: clamp(cc, 0, hj.cols - 1) };
    }
    _teclaNombre(e) {
      if (e.key !== 'Enter') { if (e.key === 'Escape') { this._pintarSeleccion(); this.enfocar(); } return; }
      e.preventDefault();
      const txt = this.cuadroNombre.value.trim();
      const rg = R.parseRango(txt);
      if (rg) { this.seleccionar(rg); this.enfocar(); return; }
      const existente = Object.keys(this.libro.nombres).find((n) => n.toLowerCase() === txt.toLowerCase());
      if (existente) { this.seleccionar(this.libro.nombres[existente].replace(/^=/, '')); this.enfocar(); return; }
      if (!/^[A-Za-z_À-ɏ][A-Za-z0-9_.À-ɏ]*$/.test(txt) || /^[A-Za-z]{1,3}\d+$/.test(txt)) {
        LT.ui.aviso('Nombre no válido', 'El nombre debe empezar con una letra, no puede tener espacios y no puede parecer una referencia de celda (como B2).');
        return;
      }
      this.definirNombre(txt, this.rango);
      this.enfocar();
    }
    definirNombre(nombre, rango, hIdx) {
      const hoja = this.libro.hojas[hIdx == null ? this.libro.activa : hIdx].nombre;
      const cita = /^[A-Za-z_][A-Za-z0-9_]*$/.test(hoja) ? hoja : "'" + hoja.replace(/'/g, "''") + "'";
      const rg = typeof rango === 'string' ? R.parseRango(rango) : rango;
      const a = '$' + R.colLetra(rg.c1) + '$' + (rg.r1 + 1), b = '$' + R.colLetra(rg.c2) + '$' + (rg.r2 + 1);
      const ref = '=' + cita + '!' + a + (a === b ? '' : ':' + b);
      this.guardarDeshacer();
      this.libro.nombres[nombre] = ref;
      try {
        if (this.hf.isItPossibleToAddNamedExpression(nombre, aMotor(ref))) this.hf.addNamedExpression(nombre, aMotor(ref));
        else this.hf.changeNamedExpression(nombre, aMotor(ref));
      } catch (e) { this.reconstruirMotor(); }
      this.pintar();
      LT.ui.toast('Nombre definido: ' + nombre + ' → ' + ref.slice(1), 'ok');
      this.emitir('cambio', { tipo: 'nombre', nombre });
    }

    /* ====================================================== EDICIÓN */
    _celdaBloqueada(r, c, hIdx) {
      const hj = this.libro.hojas[hIdx == null ? this.libro.activa : hIdx];
      if (!hj.protegida) return false;
      const est = hj.estilos.get(k(r, c));
      return !(est && est.desbloqueada);
    }
    _avisoProtegida() {
      LT.ui.aviso('Hoja protegida', 'La celda o el gráfico que intenta cambiar está en una hoja protegida. Para realizar cambios, desproteja la hoja (Revisar › Desproteger hoja).');
    }
    iniciarEdicion(modo, inicial, superficie) {
      if (this.opts.soloLectura) return;
      if (this._celdaBloqueada(this.sel.ar, this.sel.ac)) { this._avisoProtegida(); return; }
      const r = this.sel.ar, c = this.sel.ac;
      const raw = this.hj.celdas.get(k(r, c)) || '';
      this.edicion = { r, c, hoja: this.libro.activa, modo, texto: inicial != null ? inicial : raw, original: raw, punto: null, superficie: superficie || 'celda' };
      this.sel = { ar: r, ac: c, fr: r, fc: c };
      this._posicionarEditor();
      this.editor.value = this.edicion.texto;
      if (this.fx) this.fx.value = this.edicion.texto;
      if (superficie === 'barra') { /* el foco ya está en la barra */ }
      else {
        this.editor.focus({ preventScroll: true });
        const n = this.editor.value.length;
        this.editor.setSelectionRange(n, n);
      }
      this._ajustarEditor();
      this._pintarSeleccion();
      this._pintarResaltes();
      this._pintarModo();
      this._actualizarAyuda(this.edicion.superficie);
    }
    _posicionarEditor() {
      const ed = this.edicion;
      if (!ed || ed.hoja !== this.libro.activa) { this.editor.style.display = 'none'; return; }
      const rc = this._rect(ed.r, ed.c, ed.r, ed.c);
      const est = this.hj.estilos.get(k(ed.r, ed.c)) || {};
      Object.assign(this.editor.style, {
        display: 'block', left: rc.x + 'px', top: rc.y + 'px', minWidth: rc.w + 'px', height: rc.h + 'px',
        fontWeight: est.b ? '700' : '', fontStyle: est.i ? 'italic' : '', fontSize: est.fs ? est.fs + 'px' : '',
        textAlign: est.ha && !String(ed.texto).startsWith('=') ? est.ha : 'left',
      });
    }
    _ajustarEditor() {
      if (!this.edicion) return;
      const medir = h('span', { class: 'hoja-medir' }, this.editor.value || ' ');
      this.raiz.appendChild(medir);
      const w = medir.offsetWidth + 18;
      medir.remove();
      this.editor.style.width = Math.max(w, parseFloat(this.editor.style.minWidth) || 0) + 'px';
    }
    _editorDesdeTexto(superficie) {
      const ed = this.edicion;
      if (superficie === 'barra') this.editor.value = ed.texto; else if (this.fx) this.fx.value = ed.texto;
      this._ajustarEditor();
      this._pintarResaltes();
      this._pintarModo();
      this._actualizarAyuda(superficie);
    }
    _esFormulaEditable() { return this.edicion && /^[=+]/.test(this.edicion.texto); }
    _superficie() { return this.edicion && this.edicion.superficie === 'barra' && this.fx ? this.fx : this.editor; }
    _puedeInsertarRef() {
      const ed = this.edicion;
      if (!ed || !this._esFormulaEditable()) return false;
      const el = this._superficie();
      const pos = el.selectionStart;
      if (ed.punto && pos === ed.punto.fin) return true;
      const antes = ed.texto.slice(0, pos).replace(/\s+$/, '');
      return /[=(,;+\-*/^&<>:]$/.test(antes);
    }
    _insertarRefPunto(a, b) {
      const ed = this.edicion;
      const el = this._superficie();
      const r1 = Math.min(a.r, b.r), c1 = Math.min(a.c, b.c), r2 = Math.max(a.r, b.r), c2 = Math.max(a.c, b.c);
      let ref = R.dir(r1, c1) + (r1 !== r2 || c1 !== c2 ? ':' + R.dir(r2, c2) : '');
      if (this.libro.activa !== ed.hoja) {
        const n = this.hj.nombre;
        ref = (/^[A-Za-z_À-ɏ][A-Za-z0-9_À-ɏ]*$/.test(n) ? n : "'" + n.replace(/'/g, "''") + "'") + '!' + ref;
      }
      let ini, fin;
      if (ed.punto) { ini = ed.punto.inicio; fin = ed.punto.fin; } else { ini = el.selectionStart; fin = el.selectionEnd; }
      ed.texto = ed.texto.slice(0, ini) + ref + ed.texto.slice(fin);
      ed.punto = { inicio: ini, fin: ini + ref.length, foco: { r: b.r, c: b.c }, ancla: { r: a.r, c: a.c } };
      this.editor.value = ed.texto;
      if (this.fx) this.fx.value = ed.texto;
      el.focus({ preventScroll: true });
      el.setSelectionRange(ed.punto.fin, ed.punto.fin);
      this._ajustarEditor();
      this._pintarResaltes();
      this._pintarModo();
    }
    _teclaEditor(e, superficie) {
      const ed = this.edicion;
      if (!ed) return;
      const el = superficie === 'barra' ? this.fx : this.editor;
      // autocompletar
      if (this._ayudaLista && this._ayudaLista.length && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Tab')) {
        e.preventDefault();
        if (e.key === 'Tab') { this._aceptarAutocompletar(el); return; }
        this._ayudaIdx = clamp((this._ayudaIdx || 0) + (e.key === 'ArrowDown' ? 1 : -1), 0, this._ayudaLista.length - 1);
        this._dibujarAyuda();
        return;
      }
      if (e.key === 'Enter' && !e.altKey) {
        e.preventDefault();
        if (this.confirmarEdicion()) this._moverTrasConfirmar(e.shiftKey ? -1 : 1, 0);
        return;
      }
      if (e.key === 'Enter' && e.altKey) {
        e.preventDefault();
        const p = el.selectionStart;
        ed.texto = ed.texto.slice(0, p) + '\n' + ed.texto.slice(el.selectionEnd);
        el.value = ed.texto; el.setSelectionRange(p + 1, p + 1);
        this._editorDesdeTexto(superficie);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        if (this.confirmarEdicion()) this._moverTrasConfirmar(0, e.shiftKey ? -1 : 1);
        return;
      }
      if (e.key === 'Escape') { e.preventDefault(); this.cancelarEdicion(); this.enfocar(); return; }
      if (e.key === 'F4') {
        e.preventDefault();
        const res = R.alternarAnclaje(ed.texto, el.selectionStart);
        if (res) { ed.texto = res.texto; ed.punto = null; el.value = res.texto; el.setSelectionRange(res.cursor, res.cursor); this._editorDesdeTexto(superficie); }
        return;
      }
      if (e.key === 'F2') { e.preventDefault(); ed.modo = ed.modo === 'entrar' ? 'editar' : 'entrar'; ed.punto = null; this._pintarModo(); return; }
      if (/^Arrow/.test(e.key)) {
        const dr = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
        const dc = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (ed.modo === 'entrar' && this._puedeInsertarRef()) {
          e.preventDefault();
          const base = ed.punto ? (e.shiftKey ? ed.punto.foco : ed.punto.ancla) : { r: ed.r, c: ed.c };
          const nuevo = { r: clamp(base.r + dr, 0, this.hj.filas - 1), c: clamp(base.c + dc, 0, this.hj.cols - 1) };
          if (e.shiftKey && ed.punto) this._insertarRefPunto(ed.punto.ancla, nuevo);
          else this._insertarRefPunto(nuevo, nuevo);
          this._asegurarVisible(nuevo.r, nuevo.c);
          return;
        }
        if (ed.modo === 'entrar' && superficie === 'celda') {
          e.preventDefault();
          if (this.confirmarEdicion()) this._moverTrasConfirmar(dr, dc);
          return;
        }
        return; // modo modificar: el cursor se mueve dentro del texto
      }
    }
    /* Si el foco sale del simulador (p. ej., al pulsar «Verificar»), se confirma lo escrito */
    _alSalirEditor() {
      setTimeout(() => {
        if (!this.edicion) return;
        const act = document.activeElement;
        if (act && (this.raiz.contains(act) || act.closest('.modal-fondo, .hoja-menu'))) return;
        if (document.querySelector('.modal-fondo')) return;
        if (!this.confirmarEdicion()) return;
        this._pintarSeleccion();
      }, 0);
    }
    _moverTrasConfirmar(dr, dc) {
      const hj = this.hj;
      let r = clamp(this.sel.ar + dr, 0, hj.filas - 1);
      while (dr && hj.filasOcultas.has(r) && r > 0 && r < hj.filas - 1) r += dr;
      const c = clamp(this.sel.ac + dc, 0, hj.cols - 1);
      this.sel = { ar: r, ac: c, fr: r, fc: c };
      this._asegurarVisible(r, c);
      this._pintarSeleccion(); this._pintarEstado();
      this.enfocar();
    }
    cancelarEdicion() {
      if (!this.edicion) return;
      const volver = this.edicion.hoja;
      const ed = this.edicion;
      this.edicion = null;
      this.editor.style.display = 'none';
      this._ocultarAyuda();
      if (volver !== this.libro.activa && this.libro.hojas[volver]) { this.sel = { ar: ed.r, ac: ed.c, fr: ed.r, fc: ed.c }; this.libro.activa = volver; this.renderHoja(); }
      this._pintarSeleccion();
      this._pintarModo();
    }
    /* Devuelve false si la entrada no es válida (la edición continúa) */
    confirmarEdicion() {
      const ed = this.edicion;
      if (!ed) return true;
      let texto = ed.texto;
      if (/^\+/.test(texto) && texto.length > 1 && !/^\+\d/.test(texto)) texto = '=' + texto;
      if (/^=/.test(texto) && texto.length > 1) {
        texto = cerrarParentesis(texto);
        let valida = true;
        try { valida = this.hf.validateFormula(aMotor(texto)); } catch (err) { valida = false; }
        if (!valida) {
          LT.ui.aviso('Hay un problema con esta fórmula', 'Revisa que los paréntesis, las comillas y las comas estén completos. ¿No querías escribir una fórmula? Cuando el primer carácter es un signo igual (=), Excel lo interpreta como fórmula; escribe un apóstrofo (\') antes para que sea texto.').then(() => this._superficie().focus());
          return false;
        }
      }
      // validación de datos
      const val = this._validacionDe(ed.r, ed.c, ed.hoja);
      if (val && texto !== '' && !this._cumpleValidacion(val, texto, ed.hoja)) {
        LT.ui.modal({
          titulo: val.tituloError || 'Microsoft Excel',
          cuerpo: LT.u.h('p', null, val.mensajeError || 'Este valor no coincide con las restricciones de validación de datos definidas para esta celda.'),
          botones: [{ texto: 'Reintentar', valor: 'r', primario: true }, { texto: 'Cancelar', valor: 'c' }],
        }).then((v) => { if (v === 'c') { this.cancelarEdicion(); this.enfocar(); } else this._superficie().focus(); });
        return false;
      }
      const hIdx = ed.hoja;
      this.edicion = null;
      this.editor.style.display = 'none';
      this._ocultarAyuda();
      this.sel = { ar: ed.r, ac: ed.c, fr: ed.r, fc: ed.c };
      if (hIdx !== this.libro.activa) { this.libro.activa = hIdx; this.renderHoja(); }
      if (texto !== ed.original) {
        this.guardarDeshacer();
        this._ponerRaw(hIdx, ed.r, ed.c, texto);
        this.pintar();
        this.emitir('accion', { tipo: 'valor', celda: R.dir(ed.r, ed.c), raw: this.libro.hojas[hIdx].celdas.get(k(ed.r, ed.c)) || '' });
        this.emitir('cambio', { tipo: 'valor', hoja: hIdx, r: ed.r, c: ed.c });
      } else this._pintarSeleccion();
      this._pintarModo();
      return true;
    }

    /* -------------------------------------- ayuda de funciones al escribir */
    _actualizarAyuda(superficie) {
      const ed = this.edicion;
      this._ayudaLista = null;
      if (!ed || !this._esFormulaEditable()) { this._ocultarAyuda(); return; }
      const el = superficie === 'barra' ? this.fx : this.editor;
      const pos = el.selectionStart;
      const antes = ed.texto.slice(0, pos);
      // ¿escribiendo un nombre de función?
      const m = /(^|[=(,;+\-*/^&<> ])([A-Za-zÁÉÍÓÚÑáéíóúñ][A-Za-z0-9.ÁÉÍÓÚÑáéíóúñ]*)$/.exec(antes);
      if (m && !/^[A-Za-z]{1,3}\d+$/.test(m[2])) {
        const pref = m[2].toUpperCase();
        const lista = Object.values(LT.FUNCIONES).filter((f) => f.es.startsWith(pref)).slice(0, 7);
        Object.keys(this.libro.nombres).filter((n) => n.toUpperCase().startsWith(pref)).forEach((n) => lista.push({ es: n, nombreDefinido: true, desc: 'Nombre definido: ' + this.libro.nombres[n] }));
        if (lista.length && !(lista.length === 1 && lista[0].es === pref)) {
          this._ayudaLista = lista; this._ayudaIdx = 0; this._ayudaPref = m[2];
          this._dibujarAyuda(superficie);
          return;
        }
      }
      // ¿dentro de los argumentos de una función?
      let prof = 0, i = antes.length - 1, arg = 0, enCadena = false;
      for (; i >= 0; i--) {
        const ch = antes[i];
        if (ch === '"') enCadena = !enCadena;
        if (enCadena) continue;
        if (ch === ')') prof++;
        else if (ch === '(') { if (prof === 0) break; prof--; }
        else if ((ch === ',' || ch === ';') && prof === 0) arg++;
      }
      if (i > 0) {
        const mf = /([A-Za-zÁÉÍÓÚÑáéíóúñ][A-Za-z0-9.ÁÉÍÓÚÑáéíóúñ]*)$/.exec(antes.slice(0, i));
        const fn = mf && LT.FUNCIONES[mf[1].toUpperCase()];
        if (fn) {
          this._dibujarSintaxis(fn, arg, superficie);
          return;
        }
      }
      this._ocultarAyuda();
    }
    _ubicarAyuda(superficie) {
      const ed = this.edicion;
      if (superficie === 'barra' || !ed || ed.hoja !== this.libro.activa) {
        // debajo de la barra de fórmulas: se coloca al inicio del área visible
        Object.assign(this.ayuda.style, { left: this.area.scrollLeft + 50 + 'px', top: this.area.scrollTop + 2 + 'px' });
      } else {
        const rc = this._rect(ed.r, ed.c, ed.r, ed.c);
        Object.assign(this.ayuda.style, { left: rc.x + 'px', top: rc.y + rc.h + 2 + 'px' });
      }
      this.ayuda.style.display = 'block';
    }
    _dibujarAyuda(superficie) {
      const a = this.ayuda;
      a.innerHTML = '';
      a.className = 'hoja-ayuda lista';
      this._ayudaLista.forEach((f, i) => {
        const it = h('div', { class: 'ayuda-item' + (i === this._ayudaIdx ? ' activo' : '') }, h('b', null, f.es), h('span', null, f.desc || ''));
        it.addEventListener('mousedown', (e) => { e.preventDefault(); this._ayudaIdx = i; this._aceptarAutocompletar(this._superficie()); });
        a.appendChild(it);
      });
      a.appendChild(h('div', { class: 'ayuda-pie' }, 'Tab para elegir'));
      this._ubicarAyuda(superficie || (this.edicion && this.edicion.superficie));
    }
    _dibujarSintaxis(fn, arg, superficie) {
      const a = this.ayuda;
      a.className = 'hoja-ayuda sintaxis';
      const m = /^([^(]+)\((.*)\)$/.exec(fn.sintaxis);
      a.innerHTML = '';
      if (!m) { a.textContent = fn.sintaxis; this._ubicarAyuda(superficie); return; }
      const args = m[2].split(/,\s*/);
      const repetible = args[args.length - 1] === '…';
      a.appendChild(document.createTextNode(m[1] + '('));
      args.forEach((x, i) => {
        if (i) a.appendChild(document.createTextNode(', '));
        const activo = i === arg || (repetible && i === args.length - 2 && arg >= i);
        a.appendChild(activo ? h('b', null, x) : document.createTextNode(x));
      });
      a.appendChild(document.createTextNode(')'));
      if (!fn.simulador) a.appendChild(h('div', { class: 'ayuda-nota' }, 'Esta función no está disponible en el simulador; úsala en Excel.'));
      this._ubicarAyuda(superficie);
    }
    _aceptarAutocompletar(el) {
      const f = this._ayudaLista[this._ayudaIdx || 0];
      const ed = this.edicion;
      const pos = el.selectionStart;
      const ini = pos - this._ayudaPref.length;
      const ins = f.nombreDefinido ? f.es : f.es + '(';
      ed.texto = ed.texto.slice(0, ini) + ins + ed.texto.slice(pos);
      el.value = ed.texto;
      el.setSelectionRange(ini + ins.length, ini + ins.length);
      this._ayudaLista = null;
      this._editorDesdeTexto(el === this.fx ? 'barra' : 'celda');
    }
    _ocultarAyuda() { this.ayuda.style.display = 'none'; this._ayudaLista = null; }

    /* ================================================ CONTENIDO Y RELLENO */
    borrarContenido(rg) {
      rg = rg || this.rango;
      const hIdx = this.libro.activa;
      const lista = [];
      for (let r = rg.r1; r <= rg.r2; r++) for (let c = rg.c1; c <= rg.c2; c++) {
        if (this._celdaBloqueada(r, c)) { this._avisoProtegida(); return; }
        if (this.hj.celdas.has(k(r, c))) lista.push({ h: hIdx, r, c, raw: null });
      }
      if (!lista.length) return;
      this.guardarDeshacer();
      this._ponerVarios(lista);
      this.pintar();
      this.emitir('accion', { tipo: 'borrar', rango: R.textoRango(rg) });
      this.emitir('cambio', { tipo: 'borrar' });
    }
    /* Calcula el valor de relleno para la posición n (0 = primera celda nueva) */
    _serie(fuente, n, dr, dc) {
      // fuente: [{raw, est}] en la dirección del relleno
      const L = fuente.length;
      const idx = n % L;
      const base = fuente[idx];
      const ciclo = Math.floor(n / L) + 1;
      const raw = base.raw;
      if (raw == null || raw === '') return null;
      if (raw[0] === '=') {
        const desp = (n + L - idx) ; // distancia desde la celda fuente
        return R.desplazarFormula(raw, dr * desp, dc * desp);
      }
      const info = F.interpretar(raw);
      const esFechaFmt = base.est && base.est.fmt && F.esFecha(base.est.fmt);
      if (info.tipo === 'numero') {
        const nums = fuente.map((x) => F.interpretar(x.raw || '')).filter((x) => x.tipo === 'numero').map((x) => x.valor);
        let valor;
        if (L > 1 && nums.length === L) {
          const paso = (nums[L - 1] - nums[0]) / (L - 1);
          valor = nums[L - 1] + paso * (n + 1);
        } else if (L === 1 && (esFechaFmt || info.fmt && F.esFecha(info.fmt))) valor = info.valor + (n + 1);
        else return raw; // un solo número: se copia
        valor = Math.round(valor * 1e9) / 1e9;
        if (esFechaFmt || (info.fmt && F.esFecha(info.fmt))) return LT.fechas.texto(valor);
        return String(valor);
      }
      if (info.tipo === 'texto') {
        const t = info.valor;
        const low = t.toLowerCase();
        for (const lista of LISTAS) {
          const i = lista.indexOf(low);
          if (i >= 0) {
            const pal = lista[(i + ciclo * L) % lista.length];
            if (t === t.toUpperCase() && t.length > 1) return pal.toUpperCase();
            return t[0] === t[0].toUpperCase() ? pal[0].toUpperCase() + pal.slice(1) : pal;
          }
        }
        const m = /^(.*?)(\d+)$/.exec(t);
        if (m) {
          const num = parseInt(m[2], 10) + ciclo * L;
          return m[1] + String(num).padStart(m[2].length, '0');
        }
        return t;
      }
      return raw;
    }
    rellenar(origen, destino) {
      const hIdx = this.libro.activa;
      const hj = this.hj;
      for (let r = destino.r1; r <= destino.r2; r++) for (let c = destino.c1; c <= destino.c2; c++) {
        if ((r < origen.r1 || r > origen.r2 || c < origen.c1 || c > origen.c2) && this._celdaBloqueada(r, c)) { this._avisoProtegida(); return; }
      }
      this.guardarDeshacer();
      const lista = [];
      const estilos = [];
      if (destino.r2 > origen.r2 || destino.r1 < origen.r1) {
        const haciaAbajo = destino.r2 > origen.r2;
        for (let c = origen.c1; c <= origen.c2; c++) {
          const fuente = [];
          for (let r = origen.r1; r <= origen.r2; r++) fuente.push({ raw: hj.celdas.get(k(r, c)), est: hj.estilos.get(k(r, c)) });
          if (!haciaAbajo) fuente.reverse();
          const total = haciaAbajo ? destino.r2 - origen.r2 : origen.r1 - destino.r1;
          for (let n = 0; n < total; n++) {
            const r = haciaAbajo ? origen.r2 + 1 + n : origen.r1 - 1 - n;
            lista.push({ h: hIdx, r, c, raw: this._serie(fuente, n, haciaAbajo ? 1 : -1, 0) });
            estilos.push({ r, c, est: fuente[n % fuente.length].est });
          }
        }
      } else {
        const haciaDer = destino.c2 > origen.c2;
        for (let r = origen.r1; r <= origen.r2; r++) {
          const fuente = [];
          for (let c = origen.c1; c <= origen.c2; c++) fuente.push({ raw: hj.celdas.get(k(r, c)), est: hj.estilos.get(k(r, c)) });
          if (!haciaDer) fuente.reverse();
          const total = haciaDer ? destino.c2 - origen.c2 : origen.c1 - destino.c1;
          for (let n = 0; n < total; n++) {
            const c = haciaDer ? origen.c2 + 1 + n : origen.c1 - 1 - n;
            lista.push({ h: hIdx, r, c, raw: this._serie(fuente, n, 0, haciaDer ? 1 : -1) });
            estilos.push({ r, c, est: fuente[n % fuente.length].est });
          }
        }
      }
      for (const x of estilos) { if (x.est) hj.estilos.set(k(x.r, x.c), clonarEstilo(x.est)); else hj.estilos.delete(k(x.r, x.c)); }
      this._ponerVarios(lista);
      this.sel = { ar: destino.r1, ac: destino.c1, fr: destino.r2, fc: destino.c2 };
      this.pintar();
      this.emitir('accion', { tipo: 'relleno', origen: R.textoRango(origen), destino: R.textoRango(destino) });
      this.emitir('cambio', { tipo: 'relleno' });
    }
    rellenarHastaFinal() {
      const o = this.rango;
      const hIdx = this.libro.activa;
      // busca la última fila con datos en la columna vecina
      const vecina = o.c1 > 0 && this._tieneContenido(hIdx, o.r2 + 1, o.c1 - 1) ? o.c1 - 1 : o.c2 + 1 < this.hj.cols && this._tieneContenido(hIdx, o.r2 + 1, o.c2 + 1) ? o.c2 + 1 : null;
      if (vecina == null) return;
      let r = o.r2;
      while (r + 1 < this.hj.filas && this._tieneContenido(hIdx, r + 1, vecina)) r++;
      if (r > o.r2) this.rellenar(o, { r1: o.r1, c1: o.c1, r2: r, c2: o.c2 });
    }
    rellenarAbajo() {
      const rg = this.rango;
      if (rg.r1 === rg.r2) { if (rg.r1 === 0) return; this.rellenar({ r1: rg.r1 - 1, c1: rg.c1, r2: rg.r1 - 1, c2: rg.c2 }, { r1: rg.r1 - 1, c1: rg.c1, r2: rg.r2, c2: rg.c2 }); this.sel = { ar: rg.r1, ac: rg.c1, fr: rg.r2, fc: rg.c2 }; this._pintarSeleccion(); return; }
      this._copiarFijo({ r1: rg.r1, c1: rg.c1, r2: rg.r1, c2: rg.c2 }, { r1: rg.r1 + 1, c1: rg.c1, r2: rg.r2, c2: rg.c2 });
    }
    rellenarDerecha() {
      const rg = this.rango;
      if (rg.c1 === rg.c2) { if (rg.c1 === 0) return; this.rellenar({ r1: rg.r1, c1: rg.c1 - 1, r2: rg.r2, c2: rg.c1 - 1 }, { r1: rg.r1, c1: rg.c1 - 1, r2: rg.r2, c2: rg.c2 }); this.sel = { ar: rg.r1, ac: rg.c1, fr: rg.r2, fc: rg.c2 }; this._pintarSeleccion(); return; }
      this._copiarFijo({ r1: rg.r1, c1: rg.c1, r2: rg.r2, c2: rg.c1 }, { r1: rg.r1, c1: rg.c1 + 1, r2: rg.r2, c2: rg.c2 });
    }
    /* Copia (sin serie) un bloque a un destino, con ajuste de referencias */
    _copiarFijo(origen, destino) {
      const hIdx = this.libro.activa;
      const hj = this.hj;
      this.guardarDeshacer();
      const alto = origen.r2 - origen.r1 + 1, ancho = origen.c2 - origen.c1 + 1;
      const lista = [];
      for (let r = destino.r1; r <= destino.r2; r++) for (let c = destino.c1; c <= destino.c2; c++) {
        const ro = origen.r1 + ((r - destino.r1) % alto), co = origen.c1 + ((c - destino.c1) % ancho);
        const raw = hj.celdas.get(k(ro, co));
        lista.push({ h: hIdx, r, c, raw: raw && raw[0] === '=' ? R.desplazarFormula(raw, r - ro, c - co) : raw });
        const est = hj.estilos.get(k(ro, co));
        if (est) hj.estilos.set(k(r, c), clonarEstilo(est)); else hj.estilos.delete(k(r, c));
      }
      this._ponerVarios(lista);
      this.pintar();
      this.emitir('accion', { tipo: 'relleno', origen: R.textoRango(origen), destino: R.textoRango(destino) });
      this.emitir('cambio', { tipo: 'relleno' });
    }

    /* =================================================== PORTAPAPELES */
    _bloque(rg) {
      const hj = this.hj;
      const celdas = [];
      for (let r = rg.r1; r <= rg.r2; r++) {
        const fila = [];
        for (let c = rg.c1; c <= rg.c2; c++) fila.push({ raw: hj.celdas.get(k(r, c)) || '', est: clonarEstilo(hj.estilos.get(k(r, c))), r, c });
        celdas.push(fila);
      }
      return celdas;
    }
    _copiar(e, cortar) {
      if (this.edicion) return;
      e.preventDefault();
      const texto = this.copiarInterno(cortar);
      e.clipboardData.setData('text/plain', texto);
    }
    copiarInterno(cortar, sinPortapapelesSistema) {
      const rg = this.rango;
      const celdas = this._bloque(rg);
      const texto = celdas.map((fila, i) => fila.map((x, j) => this.tds[rg.r1 + i][rg.c1 + j]._t || '').join('\t')).join('\n');
      PORTAPAPELES = { origen: this, hoja: this.libro.activa, rango: rg, celdas, cortar, texto, marcado: true };
      if (sinPortapapelesSistema) { try { navigator.clipboard.writeText(texto).catch(() => {}); } catch (err) { /* sin permiso */ } }
      this._pintarResaltes();
      LT.ui.toast(cortar ? 'Cortado: elige el destino y pega (Ctrl+V).' : 'Copiado: elige el destino y pega (Ctrl+V).');
      this.emitir('accion', { tipo: cortar ? 'cortar' : 'copiar', rango: R.textoRango(rg) });
      return texto;
    }
    _pegarEvento(e) {
      if (this.edicion || this.opts.soloLectura) return;
      e.preventDefault();
      const texto = e.clipboardData.getData('text/plain');
      if (PORTAPAPELES && (PORTAPAPELES.texto === texto || !texto)) { this.pegar({}); return; }
      if (!texto) return;
      // pegado de texto externo (desde Excel, Hojas de cálculo o un documento)
      const filas = texto.replace(/\r/g, '').replace(/\n$/, '').split('\n').map((f) => f.split('\t'));
      const { ar, ac } = this.sel;
      this.guardarDeshacer();
      const lista = [];
      filas.forEach((f, i) => f.forEach((v, j) => lista.push({ r: ar + i, c: ac + j, raw: v })));
      this._ponerVarios(lista);
      this.sel = { ar, ac, fr: ar + filas.length - 1, fc: ac + Math.max(...filas.map((f) => f.length)) - 1 };
      this.renderHoja();
      this.emitir('cambio', { tipo: 'pegar' });
    }
    /* opciones: {solo:'todo'|'formulas'|'valores'|'formatos', operacion, transponer} */
    pegar(op) {
      const P = PORTAPAPELES;
      if (!P) { LT.ui.toast('Primero copia (Ctrl+C) las celdas que quieres pegar.', 'aviso'); return; }
      op = Object.assign({ solo: 'todo', operacion: null, transponer: false }, op);
      const hIdx = this.libro.activa;
      const hj = this.hj;
      let bloque = P.celdas;
      if (op.transponer) bloque = bloque[0].map((_, j) => bloque.map((fila) => fila[j]));
      const alto = bloque.length, ancho = bloque[0].length;
      const rg = this.rango;
      // mosaico si la selección es múltiplo del bloque copiado
      const selAlto = rg.r2 - rg.r1 + 1, selAncho = rg.c2 - rg.c1 + 1;
      const repR = selAlto % alto === 0 ? selAlto / alto : 1, repC = selAncho % ancho === 0 ? selAncho / ancho : 1;
      for (let r = rg.r1; r < rg.r1 + alto * repR; r++) for (let c = rg.c1; c < rg.c1 + ancho * repC; c++) if (this._celdaBloqueada(r, c)) { this._avisoProtegida(); return; }
      this.guardarDeshacer();
      const fuenteHoja = P.origen === this ? this.libro.hojas[P.hoja] : null;
      const valorFuente = (x) => {
        if (P.origen && P.origen.hf) {
          const v = P.origen.hf.getCellValue({ sheet: P.origen.idHoja(P.hoja), row: x.r, col: x.c });
          if (esError(v)) return textoError(v);
          if (v == null) return '';
          if (typeof v === 'number') return String(v);
          if (typeof v === 'boolean') return v ? 'VERDADERO' : 'FALSO';
          return /^[=+\-\d]/.test(v) ? "'" + v : v;
        }
        return x.raw;
      };
      const lista = [];
      for (let ir = 0; ir < repR; ir++) for (let ic = 0; ic < repC; ic++) {
        for (let i = 0; i < alto; i++) for (let j = 0; j < ancho; j++) {
          const x = bloque[i][j];
          const r = rg.r1 + ir * alto + i, c = rg.c1 + ic * ancho + j;
          if (op.solo !== 'formatos') {
            let raw;
            if (op.solo === 'valores') raw = valorFuente(x);
            else if (x.raw && x.raw[0] === '=') raw = P.cortar ? x.raw : R.desplazarFormula(x.raw, r - x.r, c - x.c);
            else raw = x.raw;
            if (op.operacion && raw !== '') {
              const destino = this.hf.getCellValue({ sheet: this.idHoja(), row: r, col: c });
              const num = parseFloat(valorFuente(x));
              if (typeof destino === 'number' && isFinite(num)) {
                const res = op.operacion === 'sumar' ? destino + num : op.operacion === 'restar' ? destino - num : op.operacion === 'multiplicar' ? destino * num : destino / num;
                raw = String(Math.round(res * 1e10) / 1e10);
              } else raw = hj.celdas.get(k(r, c)) || '';
            }
            if (!(op.operacion && raw === '')) lista.push({ h: hIdx, r, c, raw });
          }
          if (op.solo === 'todo' || op.solo === 'formatos') {
            if (x.est) hj.estilos.set(k(r, c), clonarEstilo(x.est)); else if (op.solo === 'todo') hj.estilos.delete(k(r, c));
          }
        }
      }
      this._ponerVarios(lista);
      if (P.cortar && fuenteHoja) {
        const dentro = (r, c) => r >= rg.r1 && r < rg.r1 + alto && c >= rg.c1 && c < rg.c1 + ancho && hIdx === P.hoja;
        const borrar = [];
        for (const fila of P.celdas) for (const x of fila) if (!dentro(x.r, x.c)) { borrar.push({ h: P.hoja, r: x.r, c: x.c, raw: null }); fuenteHoja.estilos.delete(k(x.r, x.c)); }
        this._ponerVarios(borrar);
        PORTAPAPELES = null;
      }
      this.sel = { ar: rg.r1, ac: rg.c1, fr: rg.r1 + alto * repR - 1, fc: rg.c1 + ancho * repC - 1 };
      const crecer = this.sel.fr >= this.hj.filas || this.sel.fc >= this.hj.cols;
      if (crecer) this.renderHoja(); else this.pintar();
      this.emitir('accion', { tipo: 'pegar', destino: R.textoRango(this.rango), opciones: op });
      this.emitir('cambio', { tipo: 'pegar' });
    }
    hayPortapapeles() { return !!PORTAPAPELES; }

    /* ======================================================== ESTILOS */
    aplicarEstilo(props, rg) {
      rg = rg || this.rango;
      const hj = this.hj;
      this.guardarDeshacer();
      for (let r = rg.r1; r <= rg.r2; r++) for (let c = rg.c1; c <= rg.c2; c++) this._estiloModelo(hj, r, c, props);
      this.pintar();
      this.emitir('accion', { tipo: 'estilo', props, rango: R.textoRango(rg) });
      this.emitir('cambio', { tipo: 'estilo' });
    }
    alternarEstilo(prop) {
      const est = this.hj.estilos.get(k(this.sel.ar, this.sel.ac)) || {};
      this.aplicarEstilo({ [prop]: !est[prop] });
    }
    aplicarFormato(fmt, rg) { this.aplicarEstilo({ fmt: fmt === 'General' ? null : fmt }, rg); }
    aplicarBordes(tipo, rg) {
      rg = rg || this.rango;
      const hj = this.hj;
      this.guardarDeshacer();
      for (let r = rg.r1; r <= rg.r2; r++) for (let c = rg.c1; c <= rg.c2; c++) {
        let bd = null;
        if (tipo === 'todos') bd = { t: 1, r: 1, b: 1, l: 1 };
        else if (tipo === 'contorno' || tipo === 'contornoGrueso') {
          const g = tipo === 'contornoGrueso' ? 2 : 1;
          const prev = (hj.estilos.get(k(r, c)) || {}).bd || {};
          bd = Object.assign({}, prev);
          if (r === rg.r1) bd.t = g; if (r === rg.r2) bd.b = g; if (c === rg.c1) bd.l = g; if (c === rg.c2) bd.r = g;
        } else if (tipo === 'inferior') { const prev = (hj.estilos.get(k(r, c)) || {}).bd || {}; bd = Object.assign({}, prev); if (r === rg.r2) bd.b = 1; }
        else if (tipo === 'inferiorDoble') { const prev = (hj.estilos.get(k(r, c)) || {}).bd || {}; bd = Object.assign({}, prev); if (r === rg.r2) bd.b = 2; }
        this._estiloModelo(hj, r, c, { bd: bd && Object.keys(bd).length ? bd : null });
      }
      this.pintar();
      this.emitir('accion', { tipo: 'bordes', bordes: tipo, rango: R.textoRango(rg) });
      this.emitir('cambio', { tipo: 'estilo' });
    }
    activarPincel() {
      this._pincel = clonarEstilo(this.hj.estilos.get(k(this.sel.ar, this.sel.ac)) || {});
      this.raiz.classList.add('pincel');
      LT.ui.toast('Copiar formato: haz clic en la celda (o arrastra) donde quieres aplicarlo.');
    }
    _aplicarPincel(cel) {
      const est = this._pincel;
      this._pincel = null;
      this.raiz.classList.remove('pincel');
      this.sel = { ar: cel.r, ac: cel.c, fr: cel.r, fc: cel.c };
      this._arrastre = { tipo: 'seleccion' };
      const terminar = () => {
        document.removeEventListener('mouseup', terminar);
        const rg = this.rango;
        this.guardarDeshacer();
        for (let r = rg.r1; r <= rg.r2; r++) for (let c = rg.c1; c <= rg.c2; c++) {
          if (Object.keys(est).length) this.hj.estilos.set(k(r, c), clonarEstilo(est)); else this.hj.estilos.delete(k(r, c));
        }
        this.pintar();
        this.emitir('accion', { tipo: 'pincel', rango: R.textoRango(rg), estilo: est });
        this.emitir('cambio', { tipo: 'estilo' });
      };
      document.addEventListener('mouseup', terminar);
    }

    /* ================================================== VALIDACIÓN */
    _validacionDe(r, c, hIdx) {
      const hj = this.libro.hojas[hIdx == null ? this.libro.activa : hIdx];
      for (const v of hj.validaciones) {
        for (const parte of String(v.rango).split(',')) {
          const rg = R.parseRango(parte);
          if (rg && r >= rg.r1 && r <= rg.r2 && c >= rg.c1 && c <= rg.c2) return v;
        }
      }
      return null;
    }
    valoresLista(val, hIdx) {
      if (!val.origen) return [];
      const o = String(val.origen).trim();
      if (o[0] === '=') {
        const rg = R.parseRango(o.slice(1).replace(/\$/g, ''));
        if (!rg) {
          const nombre = this.libro.nombres[o.slice(1)];
          if (nombre) return this.valoresLista({ origen: nombre }, hIdx);
          return [];
        }
        const hi = rg.hoja ? this.indiceHoja(rg.hoja) : (hIdx == null ? this.libro.activa : hIdx);
        const out = [];
        for (let r = rg.r1; r <= rg.r2; r++) for (let c = rg.c1; c <= rg.c2; c++) {
          const v = this.hf.getCellValue({ sheet: this.idHoja(hi), row: r, col: c });
          if (v != null && v !== '' && !esError(v)) out.push(String(v));
        }
        return out;
      }
      return o.split(/[,;]/).map((x) => x.trim()).filter(Boolean);
    }
    _cumpleValidacion(val, texto, hIdx) {
      const info = F.interpretar(texto);
      if (info.tipo === 'formula') return true;
      switch (val.tipo) {
        case 'lista': return this.valoresLista(val, hIdx).some((x) => x.toLowerCase() === String(info.valor).toLowerCase());
        case 'entero': return info.tipo === 'numero' && Number.isInteger(info.valor) && entre(info.valor, val);
        case 'decimal': return info.tipo === 'numero' && entre(info.valor, val);
        case 'fecha': return info.tipo === 'numero' && entre(info.valor, val);
        case 'longitud': return entre(String(info.valor).length, val);
        default: return true;
      }
      function entre(x, v) { const a = v.min != null && v.min !== '' ? +v.min : -Infinity, b = v.max != null && v.max !== '' ? +v.max : Infinity; return x >= a && x <= b; }
    }
    _abrirListaValidacion() {
      const val = this._validacionDe(this.sel.ar, this.sel.ac);
      if (!val) return;
      if (this._celdaBloqueada(this.sel.ar, this.sel.ac)) { this._avisoProtegida(); return; }
      const opciones = this.valoresLista(val);
      const rc = this._rect(this.sel.ar, this.sel.ac, this.sel.ar, this.sel.ac);
      const menu = h('div', { class: 'hoja-menu lista-val', style: { left: rc.x + 'px', top: rc.y + rc.h + 'px', minWidth: rc.w + 18 + 'px' } });
      for (const op of opciones) {
        menu.appendChild(h('div', { class: 'menu-item', onmousedown: (e) => { e.preventDefault(); this._ocultarMenus(); this.establecer(R.dir(this.sel.ar, this.sel.ac), op); this.emitir('accion', { tipo: 'valor', celda: R.dir(this.sel.ar, this.sel.ac), raw: op }); this.enfocar(); } }, op));
      }
      this.lienzo.appendChild(menu);
      this._menu = menu;
    }

    /* ============================================= MENÚS Y GLOBOS */
    _ocultarMenus() {
      if (this._menu) { this._menu.remove(); this._menu = null; }
      if (this._globo) { this._globo.el.remove(); this._globo = null; }
    }
    _menuEn(e, items) {
      this._ocultarMenus();
      const menu = h('div', { class: 'hoja-menu flotante', role: 'menu' });
      for (const it of items) {
        if (it === '-') { menu.appendChild(h('div', { class: 'menu-sep' })); continue; }
        if (!it) continue;
        menu.appendChild(h('div', {
          class: 'menu-item' + (it.desactivado ? ' desactivado' : ''), role: 'menuitem',
          onmousedown: (ev) => { ev.preventDefault(); ev.stopPropagation(); if (it.desactivado) return; this._ocultarMenus(); it.accion(); },
        }, it.texto, it.atajo ? h('span', { class: 'menu-atajo' }, it.atajo) : null));
      }
      menu.style.left = e.clientX + 'px';
      menu.style.top = e.clientY + 'px';
      document.body.appendChild(menu);
      const rect = menu.getBoundingClientRect();
      if (rect.bottom > window.innerHeight) menu.style.top = Math.max(4, e.clientY - rect.height) + 'px';
      if (rect.right > window.innerWidth) menu.style.left = Math.max(4, e.clientX - rect.width) + 'px';
      this._menu = menu;
      const cerrar = (ev) => { if (!menu.contains(ev.target)) { this._ocultarMenus(); document.removeEventListener('mousedown', cerrar, true); } };
      setTimeout(() => document.addEventListener('mousedown', cerrar, true), 0);
    }
    _menuContextual(e) {
      if (this.opts.soloLectura) return;
      const obj = e.target.closest('.hoja-obj');
      if (obj) return;
      e.preventDefault();
      const cel = this._celdaDeEvento(e);
      const th = e.target.closest('th');
      if (cel) {
        const rg = this.rango;
        if (!(cel.r >= rg.r1 && cel.r <= rg.r2 && cel.c >= rg.c1 && cel.c <= rg.c2)) { this.sel = { ar: cel.r, ac: cel.c, fr: cel.r, fc: cel.c }; this._pintarSeleccion(); }
      }
      const esFila = th && th.classList.contains('enc-fila');
      const esCol = th && th.classList.contains('enc-col');
      const kk = k(this.sel.ar, this.sel.ac);
      const herr = this.opts.herramientas || [];
      const items = [
        { texto: 'Cortar', atajo: 'Ctrl+X', accion: () => this.copiarInterno(true, true) },
        { texto: 'Copiar', atajo: 'Ctrl+C', accion: () => this.copiarInterno(false, true) },
        { texto: 'Pegar', atajo: 'Ctrl+V', desactivado: !PORTAPAPELES, accion: () => this.pegar({}) },
        { texto: 'Pegado especial…', atajo: 'Ctrl+Alt+V', desactivado: !PORTAPAPELES, accion: () => this.comando('pegadoEspecial') },
        '-',
        esCol ? null : { texto: 'Insertar fila arriba', accion: () => this.insertarFilas(this.rango.r1, this.rango.r2 - this.rango.r1 + 1) },
        esFila ? null : { texto: 'Insertar columna a la izquierda', accion: () => this.insertarColumnas(this.rango.c1, this.rango.c2 - this.rango.c1 + 1) },
        esCol ? null : { texto: 'Eliminar fila', accion: () => this.eliminarFilas(this.rango.r1, this.rango.r2 - this.rango.r1 + 1) },
        esFila ? null : { texto: 'Eliminar columna', accion: () => this.eliminarColumnas(this.rango.c1, this.rango.c2 - this.rango.c1 + 1) },
        { texto: 'Borrar contenido', atajo: 'Supr', accion: () => this.borrarContenido() },
        '-',
        { texto: 'Formato de celdas…', atajo: 'Ctrl+1', accion: () => this.comando('formatoCeldas') },
        herr.includes('revisar') ? '-' : null,
        herr.includes('revisar') ? { texto: this.hj.comentarios.has(kk) ? 'Responder comentario' : 'Nuevo comentario', accion: () => this.comando('comentario') } : null,
        herr.includes('revisar') ? { texto: this.hj.notas.has(kk) ? 'Modificar nota' : 'Nueva nota', accion: () => this.comando('nota') } : null,
        herr.includes('insertar') ? { texto: 'Vínculo…', accion: () => this.comando('vinculo') } : null,
        herr.includes('formulas') ? { texto: 'Definir nombre…', accion: () => this.comando('definirNombre') } : null,
      ];
      this._menuEn(e, items);
    }
    _menuPestana(e, i) {
      const colores = ['#c0392b', '#e67e22', '#f1c40f', '#27ae60', '#2980b9', '#8e44ad', null];
      this._menuEn(e, [
        { texto: 'Insertar hoja', accion: () => this.comando('insertarHoja') },
        { texto: 'Eliminar', desactivado: this.libro.hojas.length < 2, accion: () => this.comando('eliminarHoja', i) },
        { texto: 'Cambiar nombre', accion: () => this.comando('renombrarHoja', i) },
        { texto: 'Mover a la izquierda', desactivado: i === 0, accion: () => this.moverHoja(i, i - 1) },
        { texto: 'Mover a la derecha', desactivado: i === this.libro.hojas.length - 1, accion: () => this.moverHoja(i, i + 1) },
        { texto: 'Color de pestaña…', accion: () => this.comando('colorPestana', i, colores) },
        { texto: 'Ocultar', desactivado: this.libro.hojas.filter((x) => !x.oculta).length < 2, accion: () => this.ocultarHoja(i, true) },
        { texto: 'Mostrar…', desactivado: !this.libro.hojas.some((x) => x.oculta), accion: () => this.comando('mostrarHoja') },
      ]);
    }
    _mostrarGlobo(cel) {
      if (this._menu) return;
      const kk = k(cel.r, cel.c);
      if (this._globo) this._globo.el.remove();
      const rc = this._rect(cel.r, cel.c, cel.r, cel.c);
      const el = h('div', { class: 'hoja-globo', style: { left: rc.x + rc.w + 6 + 'px', top: rc.y + 'px' } });
      const nota = this.hj.notas.get(kk);
      if (nota) el.appendChild(h('div', { class: 'globo-nota' }, h('b', null, 'Nota'), h('div', null, nota)));
      const com = this.hj.comentarios.get(kk);
      if (com) {
        el.appendChild(h('div', { class: 'globo-hilo' + (com.resuelto ? ' resuelto' : '') },
          com.resuelto ? h('div', { class: 'globo-resuelto' }, '✓ Resuelto') : null,
          com.hilo.map((m) => h('div', { class: 'globo-msj' }, h('b', null, m.autor), h('div', null, m.texto)))));
      }
      el.addEventListener('mouseleave', () => { if (this._globo && this._globo.el === el) { el.remove(); this._globo = null; } });
      this.lienzo.appendChild(el);
      this._globo = { el, kk };
      clearTimeout(this._tGlobo);
      this._tGlobo = setTimeout(() => { if (this._globo && this._globo.el === el && !el.matches(':hover')) { el.remove(); this._globo = null; } }, 3500);
    }

    /* ============================================ ESTRUCTURA (filas/cols) */
    _reconstruirDesdeMotor(transformarClave) {
      // tras insertar/eliminar filas o columnas el motor ajusta las fórmulas; se recupera el texto
      for (let i = 0; i < this.libro.hojas.length; i++) {
        const hj = this.libro.hojas[i];
        const sid = this.idHoja(i);
        const nuevas = new Map();
        for (const [kk, raw] of hj.celdas) {
          const [r, c] = dk(kk);
          const nk = transformarClave && transformarClave.hoja === i ? transformarClave.fn(r, c) : [r, c];
          if (!nk) continue;
          if (raw[0] === '=') {
            const f = this.hf.getCellFormula({ sheet: sid, row: nk[0], col: nk[1] });
            nuevas.set(k(nk[0], nk[1]), f ? deMotor(f) : raw);
          } else nuevas.set(k(nk[0], nk[1]), raw);
        }
        hj.celdas = nuevas;
        if (transformarClave && transformarClave.hoja === i) {
          const est = new Map();
          for (const [kk, e] of hj.estilos) { const [r, c] = dk(kk); const nk = transformarClave.fn(r, c); if (nk) est.set(k(nk[0], nk[1]), e); }
          hj.estilos = est;
          for (const mapa of ['comentarios', 'notas']) {
            const m = new Map();
            for (const [kk, v] of hj[mapa]) { const [r, c] = dk(kk); const nk = transformarClave.fn(r, c); if (nk) m.set(k(nk[0], nk[1]), v); }
            hj[mapa] = m;
          }
          const moverRango = (txt) => String(txt).split(',').map((p) => {
            const rg = R.parseRango(p);
            if (!rg) return p;
            const a = transformarClave.fn(rg.r1, rg.c1) || [rg.r1, rg.c1], b = transformarClave.fn(rg.r2, rg.c2) || [rg.r2, rg.c2];
            return R.textoRango({ r1: a[0], c1: a[1], r2: b[0], c2: b[1] });
          }).join(',');
          hj.validaciones.forEach((v) => { v.rango = moverRango(v.rango); });
          hj.condicionales.forEach((v) => { v.rango = moverRango(v.rango); });
          if (hj.objetivo) { hj.objetivo = moverRango(hj.objetivo); hj._objetivoSet = null; }
        }
      }
      // nombres definidos
      for (const n of Object.keys(this.libro.nombres)) {
        try { const ex = this.hf.getNamedExpressionFormula(n); if (ex) this.libro.nombres[n] = deMotor(ex); } catch (e) { /* */ }
      }
    }
    insertarFilas(r, n) {
      if (this.hj.protegida) { this._avisoProtegida(); return; }
      this.guardarDeshacer();
      const hIdx = this.libro.activa;
      this.hf.addRows(this.idHoja(), [r, n]);
      this._reconstruirDesdeMotor({ hoja: hIdx, fn: (rr, cc) => [rr >= r ? rr + n : rr, cc] });
      this.hj.filas += n;
      this.reconstruirMotor();
      this.renderHoja();
      this.emitir('accion', { tipo: 'insertarFilas', fila: r + 1, n });
      this.emitir('cambio', { tipo: 'estructura' });
    }
    eliminarFilas(r, n) {
      if (this.hj.protegida) { this._avisoProtegida(); return; }
      this.guardarDeshacer();
      const hIdx = this.libro.activa;
      this.hf.removeRows(this.idHoja(), [r, n]);
      this._reconstruirDesdeMotor({ hoja: hIdx, fn: (rr, cc) => (rr >= r && rr < r + n ? null : [rr >= r + n ? rr - n : rr, cc]) });
      this.reconstruirMotor();
      this.renderHoja();
      this.emitir('accion', { tipo: 'eliminarFilas', fila: r + 1, n });
      this.emitir('cambio', { tipo: 'estructura' });
    }
    insertarColumnas(c, n) {
      if (this.hj.protegida) { this._avisoProtegida(); return; }
      this.guardarDeshacer();
      const hIdx = this.libro.activa;
      this.hf.addColumns(this.idHoja(), [c, n]);
      this._reconstruirDesdeMotor({ hoja: hIdx, fn: (rr, cc) => [rr, cc >= c ? cc + n : cc] });
      const a = this.hj.anchos; a.splice(c, 0, ...new Array(n));
      this.hj.cols += n;
      this.reconstruirMotor();
      this.renderHoja();
      this.emitir('accion', { tipo: 'insertarColumnas', col: R.colLetra(c), n });
      this.emitir('cambio', { tipo: 'estructura' });
    }
    eliminarColumnas(c, n) {
      if (this.hj.protegida) { this._avisoProtegida(); return; }
      this.guardarDeshacer();
      const hIdx = this.libro.activa;
      this.hf.removeColumns(this.idHoja(), [c, n]);
      this._reconstruirDesdeMotor({ hoja: hIdx, fn: (rr, cc) => (cc >= c && cc < c + n ? null : [rr, cc >= c + n ? cc - n : cc]) });
      this.hj.anchos.splice(c, n);
      this.reconstruirMotor();
      this.renderHoja();
      this.emitir('accion', { tipo: 'eliminarColumnas', col: R.colLetra(c), n });
      this.emitir('cambio', { tipo: 'estructura' });
    }

    /* ============================================================ HOJAS */
    insertarHoja(nombre) {
      let n = this.libro.hojas.length + 1;
      while (!nombre && this.indiceHoja('Hoja' + n) >= 0) n++;
      nombre = nombre || 'Hoja' + n;
      this.guardarDeshacer();
      const hj = nuevaHoja(nombre, { filas: 20, cols: 8 });
      this.libro.hojas.splice(this.libro.activa + 1, 0, hj);
      this.hf.addSheet(nombre);
      this.libro.activa = this.libro.activa + 1;
      this.sel = { ar: 0, ac: 0, fr: 0, fc: 0 };
      this.renderHoja();
      this.emitir('accion', { tipo: 'insertarHoja', nombre });
      this.emitir('cambio', { tipo: 'hojas' });
      return nombre;
    }
    renombrarHoja(i, nombre) {
      nombre = String(nombre || '').trim();
      if (!nombre) return false;
      if (/[\\/?*[\]:]/.test(nombre) || nombre.length > 31) { LT.ui.aviso('Nombre no válido', 'El nombre de una hoja no puede tener más de 31 caracteres ni los símbolos \\ / ? * [ ] :'); return false; }
      const otro = this.indiceHoja(nombre);
      if (otro >= 0 && otro !== i) { LT.ui.aviso('Nombre en uso', 'Ya existe una hoja con ese nombre. Escribe otro.'); return false; }
      this.guardarDeshacer();
      const anterior = this.libro.hojas[i].nombre;
      this.hf.renameSheet(this.hf.getSheetId(anterior), nombre);
      this.libro.hojas[i].nombre = nombre;
      // las fórmulas de otras hojas que la mencionaban se actualizan
      this._reconstruirDesdeMotor(null);
      this.reconstruirMotor();
      this.renderHoja();
      this.emitir('accion', { tipo: 'renombrarHoja', anterior, nombre });
      this.emitir('cambio', { tipo: 'hojas' });
      return true;
    }
    eliminarHoja(i) {
      if (this.libro.hojas.length < 2) return;
      this.guardarDeshacer();
      const nombre = this.libro.hojas[i].nombre;
      this.hf.removeSheet(this.hf.getSheetId(nombre));
      this.libro.hojas.splice(i, 1);
      this._reconstruirDesdeMotor(null);
      this.libro.activa = Math.max(0, Math.min(this.libro.activa, this.libro.hojas.length - 1));
      if (this.libro.hojas[this.libro.activa].oculta) this.libro.activa = this.libro.hojas.findIndex((x) => !x.oculta);
      this.reconstruirMotor();
      this.renderHoja();
      this.emitir('accion', { tipo: 'eliminarHoja', nombre });
      this.emitir('cambio', { tipo: 'hojas' });
    }
    moverHoja(i, j) {
      this.guardarDeshacer();
      const [hj] = this.libro.hojas.splice(i, 1);
      this.libro.hojas.splice(j, 0, hj);
      this.libro.activa = j;
      this.renderHoja();
      this.emitir('accion', { tipo: 'moverHoja', nombre: hj.nombre, posicion: j + 1 });
      this.emitir('cambio', { tipo: 'hojas' });
    }
    colorHoja(i, color) {
      this.guardarDeshacer();
      this.libro.hojas[i].color = color;
      this._renderPestanas();
      this.emitir('cambio', { tipo: 'hojas' });
    }
    ocultarHoja(i, ocultar) {
      this.guardarDeshacer();
      this.libro.hojas[i].oculta = ocultar;
      if (ocultar && i === this.libro.activa) this.libro.activa = this.libro.hojas.findIndex((x) => !x.oculta);
      this.renderHoja();
      this.emitir('cambio', { tipo: 'hojas' });
    }
    inmovilizar(f, c) {
      this.guardarDeshacer();
      this.hj.inmov = { f, c };
      this.renderHoja();
      this.emitir('accion', { tipo: 'inmovilizar', filas: f, cols: c });
      this.emitir('cambio', { tipo: 'vista' });
    }

    /* ========================================================= OBJETOS */
    agregarObjeto(obj) {
      this.guardarDeshacer();
      const o = Object.assign({ id: 'obj' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), x: this.area.scrollLeft + 70, y: this.area.scrollTop + 40, w: 120, h: 70 }, obj);
      this.hj.objetos.push(o);
      this._objSel = o.id;
      this._pintarObjetos();
      this.emitir('accion', { tipo: 'objeto', objeto: o.tipo });
      this.emitir('cambio', { tipo: 'objetos' });
      return o;
    }
    _deseleccionarObjetos() { if (this._objSel) { this._objSel = null; this._pintarObjetos(); } }
    _pintarObjetos() {
      const capa = this.capaObj;
      capa.innerHTML = '';
      for (const o of this.hj.objetos) {
        const el = h('div', { class: 'hoja-obj obj-' + o.tipo + (this._objSel === o.id ? ' sel' : ''), style: { left: o.x + 'px', top: o.y + 'px', width: o.w + 'px', height: o.h + 'px' }, tabindex: '0', title: o.alt || '' });
        if (o.tipo === 'imagen' || o.tipo === 'icono') el.appendChild(h('img', { src: o.fuente, alt: o.alt || '', draggable: 'false' }));
        else if (o.tipo === 'forma') {
          el.style.background = o.relleno || '#8a5a3c';
          el.style.color = o.colorTexto || '#fff';
          if (o.forma === 'redondeado') el.style.borderRadius = '14px';
          if (o.forma === 'elipse') el.style.borderRadius = '50%';
          if (o.forma === 'cinta') el.style.clipPath = 'polygon(0 0,100% 0,92% 50%,100% 100%,0 100%,8% 50%)';
          if (o.texto) el.appendChild(h('span', null, o.texto));
        } else if (o.tipo === 'texto') {
          el.appendChild(h('span', null, o.texto || 'Escribe aquí'));
        }
        el.addEventListener('mousedown', (e) => this._objRaton(e, o));
        el.addEventListener('dblclick', (e) => { e.stopPropagation(); if (o.tipo === 'texto' || o.tipo === 'forma') this.comando('editarTextoObjeto', o); });
        el.addEventListener('contextmenu', (e) => {
          e.preventDefault(); e.stopPropagation();
          this._menuEn(e, [
            (o.tipo === 'texto' || o.tipo === 'forma') ? { texto: 'Modificar texto', accion: () => this.comando('editarTextoObjeto', o) } : null,
            { texto: 'Editar texto alternativo…', accion: () => this.comando('textoAlternativo', o) },
            o.tipo === 'forma' ? { texto: 'Relleno de forma…', accion: () => this.comando('rellenoForma', o) } : null,
            { texto: 'Asignar macro…', desactivado: !this.macros, accion: () => this.comando('asignarMacro', o) },
            '-',
            { texto: 'Eliminar', accion: () => this.eliminarObjeto(o.id) },
          ]);
        });
        el.addEventListener('keydown', (e) => { if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); this.eliminarObjeto(o.id); } });
        if (o.macro) el.classList.add('con-macro');
        if (this._objSel === o.id) {
          const asa = h('div', { class: 'obj-asa' });
          asa.addEventListener('mousedown', (e) => this._objRaton(e, o, true));
          el.appendChild(asa);
        }
        capa.appendChild(el);
      }
    }
    _objRaton(e, o, redim) {
      if (e.button !== 0) return;
      e.preventDefault(); e.stopPropagation();
      if (o.macro && !redim && this._objSel !== o.id && this.macros && !e.ctrlKey) { this.emitir('ejecutarMacro', o.macro); return; }
      this._objSel = o.id;
      const x0 = e.clientX, y0 = e.clientY, ox = o.x, oy = o.y, ow = o.w, oh = o.h;
      let movido = false;
      const mover = (ev) => {
        movido = true;
        if (redim) { o.w = Math.max(20, ow + ev.clientX - x0); o.h = Math.max(16, oh + ev.clientY - y0); }
        else { o.x = Math.max(0, ox + ev.clientX - x0); o.y = Math.max(0, oy + ev.clientY - y0); }
        this._pintarObjetos();
      };
      const soltar = () => {
        document.removeEventListener('mousemove', mover);
        document.removeEventListener('mouseup', soltar);
        if (movido) this.emitir('cambio', { tipo: 'objetos' });
      };
      document.addEventListener('mousemove', mover);
      document.addEventListener('mouseup', soltar);
      this._pintarObjetos();
    }
    eliminarObjeto(id) {
      this.guardarDeshacer();
      this.hj.objetos = this.hj.objetos.filter((x) => x.id !== id);
      this._objSel = null;
      this._pintarObjetos();
      this.emitir('cambio', { tipo: 'objetos' });
    }

    /* ======================================================== COMANDOS */
    comando(nombre, ...args) {
      const fn = (LT.HojaHerramientas && LT.HojaHerramientas.comandos[nombre]) || null;
      if (fn) return fn(this, ...args);
      switch (nombre) {
        case 'deshacer': return this.deshacer();
        case 'rehacer': return this.rehacer();
        case 'negrita': return this.alternarEstilo('b');
        case 'cursiva': return this.alternarEstilo('i');
        case 'subrayado': return this.alternarEstilo('u');
        case 'mostrarFormulas': this.mostrarFormulas = !this.mostrarFormulas; this.pintar(); this.emitir('accion', { tipo: 'mostrarFormulas', activo: this.mostrarFormulas }); return;
        case 'insertarHoja': return this.insertarHoja();
        case 'eliminarHoja': return this.eliminarHoja(args[0]);
        default: console.warn('Comando no disponible:', nombre);
      }
    }
  }

  function mezclarEscala(cols, t) {
    const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    let a, b, u;
    if (cols.length === 3) { if (t < 0.5) { a = hex(cols[0]); b = hex(cols[1]); u = t * 2; } else { a = hex(cols[1]); b = hex(cols[2]); u = (t - 0.5) * 2; } }
    else { a = hex(cols[0]); b = hex(cols[1]); u = t; }
    return 'rgb(' + a.map((x, i) => Math.round(x + (b[i] - x) * u)).join(',') + ')';
  }

  LT.Hoja = Hoja;
  LT.Hoja.ALTO = ALTO;
  LT.Hoja.ANCHO = ANCHO;
})();
