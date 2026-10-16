/* Lector de libros de Excel (.xlsx / .xlsm) en el navegador.
   Un .xlsx es un paquete ZIP de archivos XML: se descomprime con JSZip y se leen
   las partes que necesitan los laboratorios (celdas, fórmulas, estilos, tablas,
   gráficos, tablas dinámicas, segmentaciones, impresión, comentarios, macros…). */
(function () {
  'use strict';
  const LT = window.LT;
  const R = LT.refs;

  const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const FORMATOS_INTEGRADOS = {
    0: 'General', 1: '0', 2: '0.00', 3: '#,##0', 4: '#,##0.00', 5: '$#,##0_);($#,##0)', 6: '$#,##0_);[Red]($#,##0)',
    7: '$#,##0.00_);($#,##0.00)', 8: '$#,##0.00_);[Red]($#,##0.00)', 9: '0%', 10: '0.00%', 11: '0.00E+00', 12: '# ?/?', 13: '# ??/??',
    14: 'dd/mm/yyyy', 15: 'd-mmm-yy', 16: 'd-mmm', 17: 'mmm-yy', 18: 'h:mm AM/PM', 19: 'h:mm:ss AM/PM', 20: 'h:mm', 21: 'h:mm:ss',
    22: 'dd/mm/yyyy h:mm', 37: '#,##0 ;(#,##0)', 38: '#,##0 ;[Red](#,##0)', 39: '#,##0.00;(#,##0.00)', 40: '#,##0.00;[Red](#,##0.00)',
    44: '_("$"* #,##0.00_);_("$"* \\(#,##0.00\\);_("$"* "-"??_);_(@_)', 45: 'mm:ss', 46: '[h]:mm:ss', 47: 'mmss.0', 48: '##0.0E+0', 49: '@',
  };

  /* ---------------------------------------------------- utilidades XML */
  const parsear = (txt) => new DOMParser().parseFromString(txt, 'application/xml');
  const todos = (el, nombre) => (el ? Array.from(el.getElementsByTagNameNS('*', nombre)) : []);
  const uno = (el, nombre) => (el ? el.getElementsByTagNameNS('*', nombre)[0] || null : null);
  const hijos = (el, nombre) => (el ? Array.from(el.children).filter((x) => x.localName === nombre) : []);
  const hijo = (el, nombre) => hijos(el, nombre)[0] || null;
  const atr = (el, n) => (el ? el.getAttribute(n) : null);
  const rid = (el) => (el ? el.getAttributeNS(NS_R, 'id') || el.getAttribute('r:id') : null);
  const textoDe = (el) => (el ? todos(el, 't').map((t) => t.textContent).join('') || el.textContent : '');
  function resolver(base, destino) {
    if (destino[0] === '/') return destino.slice(1);
    const partes = base.split('/');
    partes.pop();
    for (const p of destino.split('/')) {
      if (p === '..') partes.pop();
      else if (p !== '.') partes.push(p);
    }
    return partes.join('/');
  }
  function rutaRels(parte) { const i = parte.lastIndexOf('/'); return parte.slice(0, i) + '/_rels/' + parte.slice(i + 1) + '.rels'; }

  class Libro {
    constructor(zip, nombreArchivo) {
      this.zip = zip;
      this.nombreArchivo = nombreArchivo || '';
      this.hojas = [];
      this.nombres = [];
      this.archivos = Object.keys(zip.files);
      this._cacheXml = {};
    }
    async xml(ruta) {
      if (ruta in this._cacheXml) return this._cacheXml[ruta];
      const f = this.zip.file(ruta);
      const doc = f ? parsear(await f.async('string')) : null;
      this._cacheXml[ruta] = doc;
      return doc;
    }
    async texto(ruta) { const f = this.zip.file(ruta); return f ? f.async('string') : null; }
    async rels(parte) {
      const doc = await this.xml(rutaRels(parte));
      const out = {};
      for (const r of todos(doc, 'Relationship')) {
        const externo = atr(r, 'TargetMode') === 'External';
        out[atr(r, 'Id')] = { tipo: (atr(r, 'Type') || '').split('/').pop(), destino: externo ? atr(r, 'Target') : resolver(parte, atr(r, 'Target')), externo };
      }
      return out;
    }

    /* --------------------------------------------------- consultas */
    hoja(nombre) {
      if (typeof nombre === 'number') return this.hojas[nombre] || null;
      const n = String(nombre).toLowerCase().trim();
      return this.hojas.find((h) => h.nombre.toLowerCase().trim() === n) || null;
    }
    hojaQueContenga(textoBuscado) {
      return this.hojas.find((h) => Array.from(h.celdas.values()).some((c) => typeof c.v === 'string' && c.v.toLowerCase().includes(textoBuscado.toLowerCase()))) || null;
    }
    _h(h) { return typeof h === 'object' && h && h.celdas ? h : this.hoja(h); }
    celda(h, dir) { const hj = this._h(h); return hj ? hj.celdas.get(String(dir).replace(/\$/g, '').toUpperCase()) || null : null; }
    valor(h, dir) {
      const c = this.celda(h, dir);
      if (!c) return this._valorCalculado(h, dir);
      if (c.v === undefined && c.f) return this._valorCalculado(h, dir);
      return c.v === undefined ? null : c.v;
    }
    formula(h, dir) { const c = this.celda(h, dir); return c && c.f != null ? '=' + c.f : null; }
    tieneFormula(h, dir) { const c = this.celda(h, dir); return !!(c && c.f != null); }
    usaFuncion(h, dir, fn) {
      const f = this.formula(h, dir);
      if (!f) return false;
      const lista = [].concat(fn).map((x) => String(x).toUpperCase());
      const usadas = LT.verificador.funcionesEn(f.replace(/_xlfn\.(_xlws\.)?/gi, ''));
      return lista.some((x) => usadas.has(x));
    }
    celdasRango(rango) { return R.celdasDe(String(rango).replace(/\$/g, '')); }
    estilo(h, dir) {
      const c = this.celda(h, dir);
      return this.xfInfo(c ? c.s : 0);
    }
    xfInfo(s) {
      const E = this.estilos;
      const xf = E.xfs[s || 0] || E.xfs[0] || {};
      const font = E.fonts[xf.fontId || 0] || {};
      const fill = E.fills[xf.fillId || 0] || {};
      const border = E.borders[xf.borderId || 0] || {};
      const numFmtId = xf.numFmtId || 0;
      return {
        numFmtId, numFmt: E.numFmts[numFmtId] || FORMATOS_INTEGRADOS[numFmtId] || 'General',
        negrita: !!font.b, cursiva: !!font.i, subrayado: !!font.u, tamano: font.sz, colorFuente: font.color, fuente: font.name,
        relleno: fill.tipo === 'solid' ? fill.color || 'tema' : null,
        bordes: border, tieneBordes: !!(border.l || border.r || border.t || border.b),
        alineacion: xf.alineacion || {}, bloqueada: xf.bloqueada !== false,
        estiloNombre: E.nombrePorXfId[xf.xfId || 0] || 'Normal',
        estiloIntegrado: E.integradoPorXfId[xf.xfId || 0] != null ? E.integradoPorXfId[xf.xfId || 0] : null,
      };
    }
    /* Valor calculado con el motor si el archivo no guardó el resultado */
    _valorCalculado(h, dir) {
      const hj = this._h(h);
      if (!hj) return null;
      const c = hj.celdas.get(dir);
      if (!c || c.f == null) return c ? c.v : null;
      try {
        const hf = this._motor();
        const p = R.parseCelda(dir);
        const v = hf.getCellValue({ sheet: hf.getSheetId(hj.nombre), row: p.r, col: p.c });
        if (LT.motor.esError(v)) return '#' + v.type;
        return v;
      } catch (e) { return null; }
    }
    _motor() {
      if (this._hf) return this._hf;
      const sheets = {};
      for (const hj of this.hojas) {
        const mat = [];
        for (const [dir, c] of hj.celdas) {
          const p = R.parseCelda(dir);
          while (mat.length <= p.r) mat.push([]);
          while (mat[p.r].length <= p.c) mat[p.r].push(null);
          if (c.ft === 'dataTable') mat[p.r][p.c] = typeof c.v === 'number' ? c.v : null;
          else if (c.f != null) mat[p.r][p.c] = '=' + c.f.replace(/_xlfn\.(_xlws\.)?/gi, '').replace(/\bCONCAT\(/gi, 'CONCATENATE(').replace(/\b(TRUE|FALSE)\b(?!\s*\()/gi, '$1()');
          else mat[p.r][p.c] = c.v == null ? null : typeof c.v === 'string' ? (/^[=+\-\d]/.test(c.v) ? "'" + c.v : c.v) : c.v;
        }
        sheets[hj.nombre] = mat.map((f) => f.map((x) => (x === undefined ? null : x)));
      }
      this._hf = HyperFormula.buildFromSheets(sheets, { licenseKey: 'gpl-v3', useArrayArithmetic: true });
      for (const n of this.nombres) {
        if (n.nombre.startsWith('_xlnm') || n.hoja != null) continue;
        try { this._hf.addNamedExpression(n.nombre, '=' + n.ref); } catch (e) { /* */ }
      }
      return this._hf;
    }
    nombre(n) { return this.nombres.find((x) => x.nombre.toLowerCase() === String(n).toLowerCase()) || null; }
    areaImpresion(h) { const hj = this._h(h); const i = this.hojas.indexOf(hj); const n = this.nombres.find((x) => x.nombre === '_xlnm.Print_Area' && x.hoja === i); return n ? n.ref : null; }
    titulosImpresion(h) { const hj = this._h(h); const i = this.hojas.indexOf(hj); const n = this.nombres.find((x) => x.nombre === '_xlnm.Print_Titles' && x.hoja === i); return n ? n.ref : null; }
    get graficos() { return this.hojas.flatMap((h) => h.dibujo.graficos.map((g) => Object.assign({ hoja: h.nombre }, g))); }
    get tablas() { return this.hojas.flatMap((h) => h.tablas.map((t) => Object.assign({ hoja: h.nombre }, t))); }
    get dinamicas() { return this.hojas.flatMap((h) => h.dinamicas.map((t) => Object.assign({ hoja: h.nombre }, t))); }
  }

  /* --------------------------------------------------------- lectura */
  async function leer(fuente, nombreArchivo) {
    if (!window.JSZip) throw new Error('Falta la biblioteca JSZip.');
    const buf = fuente instanceof ArrayBuffer ? fuente : await fuente.arrayBuffer();
    let zip;
    try { zip = await JSZip.loadAsync(buf); } catch (e) { throw new Error('El archivo no es un libro de Excel válido (.xlsx o .xlsm). Si lo guardaste como .xls (Excel 97-2003) o .csv, ábrelo en Excel y usa Guardar como › Libro de Excel.'); }
    const L = new Libro(zip, nombreArchivo || (fuente && fuente.name));
    if (!zip.file('xl/workbook.xml')) throw new Error('El archivo no contiene un libro de Excel.');
    const tipos = await L.texto('[Content_Types].xml');
    L.habilitadoMacros = /macroEnabled/i.test(tipos || '');
    L.tieneVBA = !!zip.file('xl/vbaProject.bin');
    L.tipo = L.habilitadoMacros ? 'xlsm' : 'xlsx';

    // cadenas compartidas
    const sst = await L.xml('xl/sharedStrings.xml');
    L.cadenas = sst ? hijos(sst.documentElement, 'si').map((si) => hijos(si, 't').length ? hijos(si, 't').map((t) => t.textContent).join('') : hijos(si, 'r').map((r) => textoDe(hijo(r, 't'))).join('')) : [];

    await leerEstilos(L);

    // libro
    const wb = await L.xml('xl/workbook.xml');
    const relsWb = await L.rels('xl/workbook.xml');
    const prot = uno(wb, 'workbookProtection');
    L.proteccionLibro = !!(prot && (atr(prot, 'lockStructure') === '1' || atr(prot, 'lockStructure') === 'true'));
    for (const dn of todos(wb, 'definedName')) {
      const ls = atr(dn, 'localSheetId');
      L.nombres.push({ nombre: atr(dn, 'name'), hoja: ls != null ? +ls : null, ref: dn.textContent, oculto: atr(dn, 'hidden') === '1' });
    }
    const hojasXml = todos(wb, 'sheet');
    for (const sh of hojasXml) {
      const rel = relsWb[rid(sh)];
      const hoja = {
        nombre: atr(sh, 'name'), estado: atr(sh, 'state') || 'visible', ruta: rel ? rel.destino : null, tipoParte: rel ? rel.tipo : null,
        celdas: new Map(), condicionales: [], validaciones: [], tablas: [], dinamicas: [], hipervinculos: [], comentarios: [], notas: [],
        dibujo: { imagenes: [], iconos: [], formas: [], cuadrosTexto: [], graficos: [], conMacro: [], segmentaciones: 0, escalasTiempo: 0, objetos: [] },
        minigraficos: [], escenarios: [], controles: [], tablasDatos: [], anchos: {}, combinadas: [],
      };
      L.hojas.push(hoja);
      if (hoja.ruta && hoja.tipoParte === 'worksheet') await leerHoja(L, hoja);
    }
    // tema
    const tema = await L.xml('xl/theme/theme1.xml');
    L.tema = tema ? { nombre: atr(tema.documentElement, 'name'), colores: atr(uno(tema, 'clrScheme'), 'name'), fuentes: atr(uno(tema, 'fontScheme'), 'name') } : null;
    // segmentaciones y escalas de tiempo
    L.segmentaciones = [];
    for (const ruta of L.archivos.filter((x) => /^xl\/slicerCaches\/.*\.xml$/.test(x))) {
      const d = await L.xml(ruta);
      const def = d.documentElement;
      L.segmentaciones.push({ nombre: atr(def, 'name'), campo: atr(def, 'sourceName'), dinamicas: todos(def, 'pivotTable').map((p) => atr(p, 'name')), deTabla: !!uno(def, 'tableSlicerCache') });
    }
    L.escalasTiempo = [];
    for (const ruta of L.archivos.filter((x) => /^xl\/timelineCaches\/.*\.xml$/.test(x))) {
      const d = await L.xml(ruta);
      const def = d.documentElement;
      L.escalasTiempo.push({ nombre: atr(def, 'name'), campo: atr(def, 'sourceName'), dinamicas: todos(def, 'pivotTable').map((p) => atr(p, 'name')) });
    }
    L.personas = {};
    for (const ruta of L.archivos.filter((x) => /^xl\/persons\/.*\.xml$/.test(x))) {
      const d = await L.xml(ruta);
      for (const p of todos(d, 'person')) L.personas[atr(p, 'id')] = atr(p, 'displayName');
    }
    return L;
  }

  function colorDe(el) {
    if (!el) return null;
    if (atr(el, 'rgb')) return '#' + atr(el, 'rgb').slice(-6).toLowerCase();
    if (atr(el, 'theme') != null) return 'tema' + atr(el, 'theme') + (atr(el, 'tint') ? '(' + (+atr(el, 'tint')).toFixed(2) + ')' : '');
    if (atr(el, 'indexed') != null) return 'indice' + atr(el, 'indexed');
    return null;
  }
  async function leerEstilos(L) {
    const doc = await L.xml('xl/styles.xml');
    const E = { numFmts: {}, fonts: [], fills: [], borders: [], xfs: [], dxfs: [], nombrePorXfId: {}, integradoPorXfId: {} };
    L.estilos = E;
    if (!doc) { E.xfs = [{}]; E.fonts = [{}]; E.fills = [{}]; E.borders = [{}]; return; }
    for (const nf of todos(doc, 'numFmt')) E.numFmts[+atr(nf, 'numFmtId')] = atr(nf, 'formatCode');
    const fuente = (f) => ({
      b: !!hijo(f, 'b') && atr(hijo(f, 'b'), 'val') !== '0', i: !!hijo(f, 'i') && atr(hijo(f, 'i'), 'val') !== '0', u: !!hijo(f, 'u') && atr(hijo(f, 'u'), 'val') !== 'none',
      sz: hijo(f, 'sz') ? +atr(hijo(f, 'sz'), 'val') : null, color: colorDe(hijo(f, 'color')), name: hijo(f, 'name') ? atr(hijo(f, 'name'), 'val') : null,
    });
    const relleno = (f) => {
      const p = hijo(f, 'patternFill');
      if (p) return { tipo: atr(p, 'patternType') || 'none', color: colorDe(hijo(p, 'fgColor')) };
      if (hijo(f, 'gradientFill')) return { tipo: 'solid', color: 'degradado' };
      return { tipo: 'none' };
    };
    const borde = (b) => {
      const o = {};
      for (const [k, n] of [['l', 'left'], ['r', 'right'], ['t', 'top'], ['b', 'bottom']]) { const e = hijo(b, n); if (e && atr(e, 'style')) o[k] = atr(e, 'style'); }
      return o;
    };
    E.fonts = hijos(uno(doc, 'fonts'), 'font').map(fuente);
    E.fills = hijos(uno(doc, 'fills'), 'fill').map(relleno);
    E.borders = hijos(uno(doc, 'borders'), 'border').map(borde);
    E.xfs = hijos(uno(doc, 'cellXfs'), 'xf').map((xf) => {
      const al = hijo(xf, 'alignment'), pr = hijo(xf, 'protection');
      return {
        numFmtId: +atr(xf, 'numFmtId') || 0, fontId: +atr(xf, 'fontId') || 0, fillId: +atr(xf, 'fillId') || 0, borderId: +atr(xf, 'borderId') || 0, xfId: +atr(xf, 'xfId') || 0,
        alineacion: al ? { h: atr(al, 'horizontal'), v: atr(al, 'vertical'), wrap: atr(al, 'wrapText') === '1' || atr(al, 'wrapText') === 'true' } : {},
        bloqueada: pr ? !(atr(pr, 'locked') === '0' || atr(pr, 'locked') === 'false') : true,
      };
    });
    if (!E.xfs.length) E.xfs = [{}];
    for (const cs of todos(uno(doc, 'cellStyles'), 'cellStyle')) {
      E.nombrePorXfId[+atr(cs, 'xfId')] = atr(cs, 'name');
      if (atr(cs, 'builtinId') != null) E.integradoPorXfId[+atr(cs, 'xfId')] = +atr(cs, 'builtinId');
    }
    E.dxfs = hijos(uno(doc, 'dxfs'), 'dxf').map((d) => ({ fuente: hijo(d, 'font') ? fuente(hijo(d, 'font')) : null, relleno: hijo(d, 'fill') ? relleno(hijo(d, 'fill')) : null, numFmt: hijo(d, 'numFmt') ? atr(hijo(d, 'numFmt'), 'formatCode') : null }));
  }

  async function leerHoja(L, hoja) {
    const doc = await L.xml(hoja.ruta);
    const raiz = doc.documentElement;
    const rels = await L.rels(hoja.ruta);
    // celdas
    const maestras = {};
    const compartidas = [];
    for (const c of todos(uno(raiz, 'sheetData'), 'c')) {
      const dir = atr(c, 'r');
      const t = atr(c, 't');
      let vEl = hijo(c, 'v');
      if (vEl && vEl.textContent === '' && t !== 's' && t !== 'inlineStr') vEl = null; // <v/> vacío: sin valor guardado
      const fEl = hijo(c, 'f');
      let v;
      if (t === 's') v = vEl ? L.cadenas[+vEl.textContent] : undefined;
      else if (t === 'inlineStr') v = textoDe(hijo(c, 'is'));
      else if (t === 'str') v = vEl ? vEl.textContent : undefined;
      else if (t === 'b') v = vEl ? vEl.textContent === '1' : undefined;
      else if (t === 'e') v = vEl ? vEl.textContent : undefined;
      else if (vEl) v = parseFloat(vEl.textContent);
      const celda = { v, t: t || 'n', s: +atr(c, 's') || 0 };
      if (fEl) {
        const ft = atr(fEl, 't');
        celda.ft = ft || 'normal';
        if (ft === 'shared') {
          const si = atr(fEl, 'si');
          if (fEl.textContent) { celda.f = fEl.textContent; maestras[si] = { f: fEl.textContent, dir }; }
          else compartidas.push({ celda, si, dir });
        } else if (ft === 'dataTable') {
          celda.f = '';
          hoja.tablasDatos.push({ ref: atr(fEl, 'ref'), r1: atr(fEl, 'r1'), r2: atr(fEl, 'r2'), dosVariables: atr(fEl, 'dt2D') === '1' });
        } else celda.f = fEl.textContent;
        if (ft === 'array') celda.matricial = atr(fEl, 'ref');
      }
      hoja.celdas.set(dir, celda);
    }
    for (const x of compartidas) {
      const m = maestras[x.si];
      if (!m) continue;
      const a = R.parseCelda(m.dir), b = R.parseCelda(x.dir);
      x.celda.f = R.desplazarFormula(m.f, b.r - a.r, b.c - a.c);
    }
    // columnas, combinadas, vista
    for (const col of todos(uno(raiz, 'cols'), 'col')) {
      for (let i = +atr(col, 'min'); i <= +atr(col, 'max'); i++) hoja.anchos[R.colLetra(i - 1)] = +atr(col, 'width');
    }
    hoja.combinadas = todos(uno(raiz, 'mergeCells'), 'mergeCell').map((m) => atr(m, 'ref'));
    const pane = uno(uno(raiz, 'sheetViews'), 'pane');
    hoja.panel = pane ? { estado: atr(pane, 'state'), x: +atr(pane, 'xSplit') || 0, y: +atr(pane, 'ySplit') || 0, celda: atr(pane, 'topLeftCell') } : null;
    hoja.inmovilizada = !!(pane && (atr(pane, 'state') === 'frozen' || atr(pane, 'state') === 'frozenSplit'));
    const sv = uno(raiz, 'sheetView');
    hoja.sinCuadricula = sv && atr(sv, 'showGridLines') === '0';
    const sheetPr = hijo(raiz, 'sheetPr');
    hoja.colorPestana = colorDe(hijo(sheetPr, 'tabColor'));
    const psp = hijo(sheetPr, 'pageSetUpPr');
    hoja.ajustarAPagina = !!(psp && (atr(psp, 'fitToPage') === '1' || atr(psp, 'fitToPage') === 'true'));
    const ps = hijo(raiz, 'pageSetup');
    hoja.pagina = ps ? { orientacion: atr(ps, 'orientation') || 'default', ancho: atr(ps, 'fitToWidth') != null ? +atr(ps, 'fitToWidth') : 1, alto: atr(ps, 'fitToHeight') != null ? +atr(ps, 'fitToHeight') : 1, escala: atr(ps, 'scale') ? +atr(ps, 'scale') : 100, papel: atr(ps, 'paperSize') } : { orientacion: 'default', ancho: 1, alto: 1, escala: 100 };
    const hf = hijo(raiz, 'headerFooter');
    hoja.encabezado = hf ? [hijo(hf, 'oddHeader'), hijo(hf, 'firstHeader'), hijo(hf, 'evenHeader')].filter(Boolean).map((e) => e.textContent).join(' ') : '';
    hoja.pie = hf ? [hijo(hf, 'oddFooter'), hijo(hf, 'firstFooter'), hijo(hf, 'evenFooter')].filter(Boolean).map((e) => e.textContent).join(' ') : '';
    const po = hijo(raiz, 'printOptions');
    hoja.opcionesImpresion = po ? { cuadricula: atr(po, 'gridLines') === '1', centradoH: atr(po, 'horizontalCentered') === '1' } : {};
    const pm = hijo(raiz, 'pageMargins');
    hoja.margenes = pm ? { izq: +atr(pm, 'left'), der: +atr(pm, 'right'), sup: +atr(pm, 'top'), inf: +atr(pm, 'bottom') } : null;
    const sp = hijo(raiz, 'sheetProtection');
    hoja.protegida = !!(sp && (atr(sp, 'sheet') === '1' || atr(sp, 'sheet') === 'true'));
    const af = hijo(raiz, 'autoFilter');
    hoja.autoFiltro = af ? { ref: atr(af, 'ref'), columnasFiltradas: hijos(af, 'filterColumn').length } : null;
    // escenarios
    const esc = hijo(raiz, 'scenarios');
    hoja.escenarios = hijos(esc, 'scenario').map((s) => ({ nombre: atr(s, 'name'), celdas: hijos(s, 'inputCells').map((ic) => ({ ref: atr(ic, 'r'), valor: atr(ic, 'val') })) }));
    // formato condicional
    const reglaDe = (r) => ({
      tipo: atr(r, 'type'), operador: atr(r, 'operator'), texto: atr(r, 'text'), formulas: hijos(r, 'formula').map((f) => f.textContent).concat(todos(r, 'f').map((f) => f.textContent)),
      dxf: atr(r, 'dxfId') != null ? L.estilos.dxfs[+atr(r, 'dxfId')] : null, rango: atr(r, 'rank'), porcentaje: atr(r, 'percent') === '1', inferior: atr(r, 'bottom') === '1',
      juegoIconos: hijo(r, 'iconSet') ? atr(hijo(r, 'iconSet'), 'iconSet') || '3TrafficLights1' : null,
    });
    for (const cf of hijos(raiz, 'conditionalFormatting')) {
      for (const r of hijos(cf, 'cfRule')) hoja.condicionales.push(Object.assign({ sqref: atr(cf, 'sqref') }, reglaDe(r)));
    }
    // validación de datos
    for (const dv of todos(hijo(raiz, 'dataValidations'), 'dataValidation')) {
      hoja.validaciones.push({ sqref: atr(dv, 'sqref'), tipo: atr(dv, 'type') || 'any', formula1: hijo(dv, 'formula1') ? hijo(dv, 'formula1').textContent : '', formula2: hijo(dv, 'formula2') ? hijo(dv, 'formula2').textContent : '', mensajeError: atr(dv, 'error'), mostrarError: atr(dv, 'showErrorMessage') === '1' });
    }
    // extensiones (formato condicional x14, validaciones x14, minigráficos)
    const ext = hijo(raiz, 'extLst');
    if (ext) {
      for (const cf of todos(ext, 'conditionalFormatting')) {
        const sq = todos(cf, 'sqref')[0];
        for (const r of hijos(cf, 'cfRule')) {
          const existe = hoja.condicionales.find((x) => x.tipo === atr(r, 'type') && x.sqref === (sq && sq.textContent));
          if (!existe) hoja.condicionales.push(Object.assign({ sqref: sq ? sq.textContent : '', ext: true }, reglaDe(r)));
        }
      }
      for (const dv of todos(ext, 'dataValidation')) {
        const sq = todos(dv, 'sqref')[0];
        const f1 = uno(uno(dv, 'formula1'), 'f');
        hoja.validaciones.push({ sqref: sq ? sq.textContent : '', tipo: atr(dv, 'type') || 'any', formula1: f1 ? f1.textContent : '', ext: true });
      }
      for (const g of todos(ext, 'sparklineGroup')) {
        hoja.minigraficos.push({ tipo: atr(g, 'type') || 'line', cantidad: todos(g, 'sparkline').length, datos: todos(g, 'sparkline').map((s) => { const f = uno(s, 'f'), q = uno(s, 'sqref'); return { origen: f ? f.textContent : '', celda: q ? q.textContent : '' }; }) });
      }
    }
    // hipervínculos
    for (const hl of todos(hijo(raiz, 'hyperlinks'), 'hyperlink')) {
      const r = rels[rid(hl)];
      hoja.hipervinculos.push({ ref: atr(hl, 'ref'), destino: r ? r.destino : atr(hl, 'location'), externo: !!(r && r.externo), mostrar: atr(hl, 'display') });
    }
    // controles de formulario (botones)
    for (const ctl of todos(raiz, 'control')) {
      const r = rels[rid(ctl)];
      const info = { nombre: atr(ctl, 'name'), tipo: null, macro: null };
      if (r && r.tipo === 'ctrlProp') {
        const d = await L.xml(r.destino);
        if (d) { info.tipo = atr(d.documentElement, 'objectType'); info.macro = atr(d.documentElement, 'fmlaMacro'); }
      }
      hoja.controles.push(info);
    }
    // partes relacionadas
    for (const r of Object.values(rels)) {
      if (r.externo) continue;
      if (r.tipo === 'drawing') await leerDibujo(L, hoja, r.destino);
      else if (r.tipo === 'table') await leerTabla(L, hoja, r.destino);
      else if (r.tipo === 'pivotTable') await leerDinamica(L, hoja, r.destino);
      else if (r.tipo === 'comments') {
        const d = await L.xml(r.destino);
        for (const cm of todos(d, 'comment')) hoja.notas.push({ ref: atr(cm, 'ref'), texto: textoDe(uno(cm, 'text')) });
      } else if (r.tipo === 'threadedComment') {
        const d = await L.xml(r.destino);
        for (const tc of todos(d, 'threadedComment')) {
          hoja.comentarios.push({ ref: atr(tc, 'ref'), id: atr(tc, 'id'), padre: atr(tc, 'parentId'), autor: atr(tc, 'personId'), texto: textoDe(uno(tc, 'text')), resuelto: atr(tc, 'done') === '1' });
        }
      } else if (r.tipo === 'vmlDrawing') {
        const txt = await L.texto(r.destino);
        if (txt) {
          const re = /ObjectType="(\w+)"[\s\S]*?<\/x:ClientData>/g;
          let m;
          while ((m = re.exec(txt))) {
            const macro = /<x:FmlaMacro>([^<]*)<\/x:FmlaMacro>/.exec(m[0]);
            if (m[1] === 'Button' || macro) hoja.controles.push({ nombre: 'vml', tipo: m[1], macro: macro ? macro[1] : null });
          }
        }
      }
    }
    // las notas «heredadas» que acompañan a un comentario encadenado no cuentan como notas
    const refsHilo = new Set(hoja.comentarios.map((c) => c.ref));
    hoja.notas = hoja.notas.filter((n) => !refsHilo.has(n.ref) && !/^\[(Threaded comment|Comentario encadenado|Comentario en hilo)/i.test(n.texto));
  }

  async function leerDibujo(L, hoja, ruta) {
    const doc = await L.xml(ruta);
    if (!doc) return;
    const rels = await L.rels(ruta);
    const D = hoja.dibujo;
    const procesar = async (el) => {
      for (const n of Array.from(el.children)) {
        const tipo = n.localName;
        if (tipo === 'AlternateContent') { const ch = hijo(n, 'Choice') || hijo(n, 'Fallback'); if (ch) await procesar(ch); continue; }
        if (tipo === 'grpSp') { await procesar(n); continue; }
        const cNvPr = uno(n, 'cNvPr');
        const base = { nombre: atr(cNvPr, 'name'), alt: atr(cNvPr, 'descr') || atr(cNvPr, 'title') || '', macro: atr(n, 'macro') || null };
        if (base.macro) D.conMacro.push(base);
        if (tipo === 'pic') {
          const esSVG = !!uno(n, 'svgBlip');
          (esSVG ? D.iconos : D.imagenes).push(base);
          D.objetos.push(Object.assign({ tipo: esSVG ? 'icono' : 'imagen' }, base));
        } else if (tipo === 'sp') {
          const caja = uno(n, 'cNvSpPr');
          const esCaja = caja && (atr(caja, 'txBox') === '1' || atr(caja, 'txBox') === 'true');
          const texto = todos(uno(n, 'txBody'), 't').map((t) => t.textContent).join('');
          const geom = atr(uno(n, 'prstGeom'), 'prst');
          const o = Object.assign({ texto, geometria: geom }, base);
          (esCaja ? D.cuadrosTexto : D.formas).push(o);
          D.objetos.push(Object.assign({ tipo: esCaja ? 'cuadroTexto' : 'forma' }, o));
        } else if (tipo === 'graphicFrame') {
          const ch = uno(n, 'chart');
          if (ch) {
            const r = rels[rid(ch)];
            if (r) D.graficos.push(Object.assign(await leerGrafico(L, r.destino), base));
          } else if (uno(n, 'slicer')) D.segmentaciones++;
          else if (uno(n, 'timeslicer')) D.escalasTiempo++;
          else {
            const gd = uno(n, 'graphicData');
            const uri = atr(gd, 'uri') || '';
            if (/chartex/i.test(uri)) {
              const cx = Array.from(gd.getElementsByTagName('*')).find((e) => rid(e));
              const r = cx && rels[rid(cx)];
              D.graficos.push(Object.assign({ tipos: ['chartex'], titulo: '', series: 1 }, base, r ? { ruta: r.destino } : {}));
            } else if (/slicer/i.test(uri)) D.segmentaciones++;
            else if (/timeslicer|timeline/i.test(uri)) D.escalasTiempo++;
          }
        } else if (tipo === 'cxnSp') D.formas.push(Object.assign({ texto: '', geometria: 'conector' }, base));
        else if (['twoCellAnchor', 'oneCellAnchor', 'absoluteAnchor'].includes(tipo)) await procesar(n);
      }
    };
    await procesar(doc.documentElement);
  }

  async function leerGrafico(L, ruta) {
    const doc = await L.xml(ruta);
    const g = { ruta, tipos: [], titulo: '', tieneTitulo: false, series: 0, dinamico: false, ejes: [], refs: [], barDir: null };
    if (!doc) return g;
    const plot = uno(doc, 'plotArea');
    for (const n of Array.from(plot ? plot.children : [])) {
      if (/Chart$/.test(n.localName)) {
        let tipo = n.localName.replace(/3DChart$/, 'Chart');
        if (tipo === 'barChart') { const bd = hijo(n, 'barDir'); g.barDir = bd ? atr(bd, 'val') : 'col'; tipo = g.barDir === 'bar' ? 'barras' : 'columnas'; }
        const nombres = { lineChart: 'lineas', pieChart: 'circular', doughnutChart: 'anillo', areaChart: 'area', scatterChart: 'dispersion', radarChart: 'radial', bubbleChart: 'burbujas', stockChart: 'cotizaciones', ofPieChart: 'circular' };
        g.tipos.push(nombres[tipo] || tipo);
        g.series += hijos(n, 'ser').length;
        for (const s of hijos(n, 'ser')) for (const f of todos(s, 'f')) g.refs.push(f.textContent);
      }
      if (/Ax$/.test(n.localName)) g.ejes.push({ tipo: n.localName, titulo: textoDe(uno(hijo(n, 'title'), 'tx')), conTitulo: !!hijo(n, 'title') });
    }
    const chart = uno(doc, 'chart');
    const titulo = hijo(chart, 'title');
    const borrado = hijo(chart, 'autoTitleDeleted');
    g.tieneTitulo = !!titulo || (!!borrado && atr(borrado, 'val') === '0' && g.series === 1);
    g.titulo = titulo ? textoDe(titulo) : '';
    g.dinamico = !!uno(doc, 'pivotSource');
    g.origenDinamica = g.dinamico ? textoDe(uno(uno(doc, 'pivotSource'), 'name')) : null;
    return g;
  }

  async function leerTabla(L, hoja, ruta) {
    const doc = await L.xml(ruta);
    if (!doc) return;
    const t = doc.documentElement;
    const est = uno(t, 'tableStyleInfo');
    hoja.tablas.push({
      nombre: atr(t, 'displayName') || atr(t, 'name'), ref: atr(t, 'ref'),
      filaTotales: (+atr(t, 'totalsRowCount') || 0) > 0,
      estilo: atr(est, 'name'), bandas: atr(est, 'showRowStripes') === '1',
      columnas: todos(t, 'tableColumn').map((c) => ({ nombre: atr(c, 'name'), funcionTotal: atr(c, 'totalsRowFunction'), formulaCalculada: uno(c, 'calculatedColumnFormula') ? uno(c, 'calculatedColumnFormula').textContent : null, formulaTotal: uno(c, 'totalsRowFormula') ? uno(c, 'totalsRowFormula').textContent : null })),
    });
  }

  async function leerDinamica(L, hoja, ruta) {
    const doc = await L.xml(ruta);
    if (!doc) return;
    const def = doc.documentElement;
    const rels = await L.rels(ruta);
    let campos = [];
    const cacheRel = Object.values(rels).find((r) => r.tipo === 'pivotCacheDefinition');
    let origen = null;
    if (cacheRel) {
      const c = await L.xml(cacheRel.destino);
      if (c) {
        const ws = uno(c, 'worksheetSource');
        origen = ws ? { ref: atr(ws, 'ref'), hoja: atr(ws, 'sheet'), nombre: atr(ws, 'name') } : null;
        campos = hijos(uno(c, 'cacheFields'), 'cacheField').map((cf) => {
          const fg = hijo(cf, 'fieldGroup');
          const rp = fg ? hijo(fg, 'rangePr') : null;
          return { nombre: atr(cf, 'name'), agruparPor: rp ? atr(rp, 'groupBy') : null, base: fg ? atr(fg, 'base') : null, formula: atr(cf, 'formula') };
        });
      }
    }
    const nombreCampo = (x) => (x === -2 ? 'Valores' : campos[x] ? campos[x].nombre : 'campo' + x);
    const agrup = (x) => (campos[x] ? campos[x].agruparPor : null);
    const pf = hijos(uno(def, 'pivotFields'), 'pivotField');
    const fechasAgrupadas = [];
    campos.forEach((c, i) => { if (c.agruparPor) fechasAgrupadas.push({ campo: c.nombre, por: c.agruparPor }); else if (pf[i] && uno(pf[i], 'fieldGroup')) fechasAgrupadas.push({ campo: c.nombre, por: 'grupo' }); });
    hoja.dinamicas.push({
      nombre: atr(def, 'name'), ubicacion: atr(uno(def, 'location'), 'ref'), origen,
      filas: todos(uno(def, 'rowFields'), 'field').map((f) => +atr(f, 'x')).filter((x) => x !== -2).map((x) => ({ nombre: nombreCampo(x), agruparPor: agrup(x) })),
      columnas: todos(uno(def, 'colFields'), 'field').map((f) => +atr(f, 'x')).filter((x) => x !== -2).map((x) => ({ nombre: nombreCampo(x), agruparPor: agrup(x) })),
      filtros: todos(uno(def, 'pageFields'), 'pageField').map((f) => ({ nombre: nombreCampo(+atr(f, 'fld')) })),
      valores: todos(uno(def, 'dataFields'), 'dataField').map((f) => ({ nombre: atr(f, 'name'), campo: nombreCampo(+atr(f, 'fld')), funcion: atr(f, 'subtotal') || 'sum', mostrarComo: atr(f, 'showDataAs') || null })),
      agrupaciones: fechasAgrupadas,
      campos: campos.map((c) => c.nombre),
    });
  }

  /* Número de páginas de un PDF (estimación sin bibliotecas) */
  async function paginasPDF(fuente) {
    const buf = fuente instanceof ArrayBuffer ? fuente : await fuente.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let txt = '';
    for (let i = 0; i < bytes.length; i += 8192) txt += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    if (!txt.startsWith('%PDF')) return { valido: false, paginas: null };
    let max = null;
    const re = /\/Type\s*\/Pages[^>]*?\/Count\s+(\d+)|\/Count\s+(\d+)[^>]*?\/Type\s*\/Pages/g;
    let m;
    while ((m = re.exec(txt))) { const n = +(m[1] || m[2]); if (max == null || n > max) max = n; }
    if (max == null) { const p = txt.match(/\/Type\s*\/Page(?!s)/g); max = p ? p.length : null; }
    return { valido: true, paginas: max };
  }

  /* Ejecuta una lista de pruebas sobre un libro: [{titulo, fn(L, A) => true|string|{ok,mensaje}}] */
  function revisar(L, pruebas, nivel) {
    const A = ayudas(L);
    return pruebas.map((p) => {
      try {
        const r = p.fn(L, A, nivel || 'analista');
        if (r === true || r == null) return { ok: true, titulo: p.titulo, mensaje: p.exito || p.titulo };
        if (r === false) return { ok: false, titulo: p.titulo, mensaje: p.mensaje || p.titulo };
        if (typeof r === 'string') return { ok: false, titulo: p.titulo, mensaje: r };
        return { ok: !!r.ok, titulo: p.titulo, mensaje: r.mensaje || (r.ok ? p.exito || p.titulo : p.mensaje || p.titulo), nota: r.nota };
      } catch (e) {
        console.error(e);
        return { ok: false, titulo: p.titulo, mensaje: /No encontré/.test(e.message) ? e.message : 'No se pudo revisar esta parte: falta algo que la prueba necesita (¿cambiaste el nombre de una hoja o moviste los datos?).' };
      }
    });
  }

  /* Utilidades para escribir pruebas de laboratorio de forma breve */
  function ayudas(L) {
    const A = {
      hoja: (n) => {
        const h = L.hoja(n);
        if (!h) throw new Error('No encontré la hoja «' + n + '». No cambies su nombre (hojas del libro: ' + L.hojas.map((x) => x.nombre).join(', ') + ').');
        return h;
      },
      num: (v) => (typeof v === 'number' ? v : v != null && v !== '' && !isNaN(+String(v).replace(/[$,]/g, '')) ? +String(v).replace(/[$,]/g, '') : null),
      cerca: (a, b, tol) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= (tol != null ? tol : 0.01) + 1e-9 * Math.abs(b),
      /* Todas las celdas del rango tienen fórmula; devuelve la primera que no */
      sinFormula: (h, rango) => L.celdasRango(rango).find((x) => !L.tieneFormula(h, x.dir)) || null,
      /* Compara valores del rango con una función esperado(dir, r, c) */
      valoresMal: (h, rango, esperado, tol) => {
        for (const x of L.celdasRango(rango)) {
          const e = esperado(x.dir, x.r, x.c);
          const v = L.valor(h, x.dir);
          if (typeof e === 'number') { if (!A.cerca(A.num(v), e, tol)) return { dir: x.dir, v, e }; }
          else if (String(v == null ? '' : v).trim().toLowerCase() !== String(e == null ? '' : e).trim().toLowerCase()) return { dir: x.dir, v, e };
        }
        return null;
      },
      fmtEs: (v) => LT.verificador.mostrar(v),
      formatoMoneda: (cod) => /\$|\[\$|"\$"|€|MXN/.test(cod || ''),
      formatoPorcentaje: (cod) => /%/.test(cod || ''),
      formatoFecha: (cod) => LT.formato.esFecha(cod || ''),
      /* Recalcula el libro con otros datos de entrada: devuelve valor(hoja, dir) */
      conCambios: (cambios) => {
        const hf = L._motor();
        const previos = [];
        for (const [ref, v] of Object.entries(cambios)) {
          const i = ref.lastIndexOf('!');
          const hoja = ref.slice(0, i).replace(/^'(.*)'$/, '$1'), p = R.parseCelda(ref.slice(i + 1));
          const sid = hf.getSheetId(L.hoja(hoja).nombre);
          previos.push([sid, p, hf.getCellSerialized({ sheet: sid, row: p.r, col: p.c })]);
          hf.setCellContents({ sheet: sid, row: p.r, col: p.c }, [[v]]);
        }
        const leidos = {};
        const valor = (h, dir) => {
          const clave = h + '!' + dir;
          if (clave in leidos) return leidos[clave];
          const p = R.parseCelda(dir);
          const v = hf.getCellValue({ sheet: hf.getSheetId(L.hoja(h).nombre), row: p.r, col: p.c });
          return (leidos[clave] = LT.motor.esError(v) ? '#' + v.type : v);
        };
        // se leen los valores antes de restaurar
        valor.restaurar = () => { for (const [sid, p, prev] of previos) hf.setCellContents({ sheet: sid, row: p.r, col: p.c }, [[prev]]); };
        return valor;
      },
      rangoCubre: (sqref, ref) => {
        const objetivo = R.parseRango(String(ref).replace(/\$/g, ''));
        return String(sqref || '').split(/\s+/).some((p) => { const g = R.parseRango(p.replace(/\$/g, '')); return g && g.r1 <= objetivo.r1 && g.c1 <= objetivo.c1 && g.r2 >= objetivo.r2 && g.c2 >= objetivo.c2; });
      },
    };
    return A;
  }

  LT.xlsx = { leer, revisar, ayudas, paginasPDF, FORMATOS_INTEGRADOS };
})();
