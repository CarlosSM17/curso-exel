/* Barra de herramientas del simulador y sus cuadros de diálogo:
   portapapeles, fuente, alineación, número, estilos, celdas, edición, datos,
   fórmulas, auditoría, análisis de hipótesis, revisar, vista e insertar. */
(function () {
  'use strict';
  const LT = window.LT;
  const { h } = LT.u;
  const R = LT.refs;
  const F = LT.formato;
  const k = (r, c) => r + ',' + c;

  const RELLENOS = ['#ffffff', '#fff2cc', '#fce4d6', '#e2efda', '#ddebf7', '#ededed', '#ffc7ce', '#c6efce', '#ffeb9c', '#5b3a29', '#1e7145', '#2463a6', '#f4b183', '#a9d08e', '#9bc2e6', null];
  const FUENTES = ['#000000', '#ffffff', '#c00000', '#1e7145', '#2463a6', '#7030a0', '#5b3a29', '#ed7d31'];
  const FORMATOS_CF = [
    ['Relleno rojo claro con texto rojo oscuro', { bg: '#ffc7ce', fg: '#9c0006' }],
    ['Relleno amarillo con texto amarillo oscuro', { bg: '#ffeb9c', fg: '#9c5700' }],
    ['Relleno verde con texto verde oscuro', { bg: '#c6efce', fg: '#006100' }],
    ['Relleno rojo claro', { bg: '#ffc7ce' }],
    ['Texto rojo', { fg: '#c00000' }],
    ['Negrita', { b: true }],
  ];
  const ESTILOS_CELDA = {
    'Normal': {},
    'Bueno': { bg: '#c6efce', fg: '#006100' },
    'Incorrecto': { bg: '#ffc7ce', fg: '#9c0006' },
    'Neutral': { bg: '#ffeb9c', fg: '#9c5700' },
    'Título': { fs: 18, b: true, fg: '#44546a' },
    'Encabezado 1': { fs: 15, b: true, fg: '#44546a', bd: { b: 2 } },
    'Encabezado 2': { fs: 13, b: true, fg: '#44546a', bd: { b: 1 } },
    'Total': { b: true, bd: { t: 1, b: 2 } },
    'Entrada': { bg: '#ffcc99', fg: '#3f3f76', bd: { t: 1, r: 1, b: 1, l: 1 } },
    'Cálculo': { bg: '#f2f2f2', fg: '#fa7d00', b: true, bd: { t: 1, r: 1, b: 1, l: 1 } },
    'Moneda': { fmt: '$#,##0.00' },
    'Porcentaje': { fmt: '0%' },
  };

  /* ------------------------------------------------------- utilidades */
  function regionActual(hoja, r, c) {
    const hIdx = hoja.libro.activa;
    const lleno = (rr, cc) => rr >= 0 && cc >= 0 && rr < hoja.hj.filas && cc < hoja.hj.cols && hoja._tieneContenido(hIdx, rr, cc);
    let r1 = r, r2 = r, c1 = c, c2 = c;
    let cambio = true;
    while (cambio) {
      cambio = false;
      for (let cc = c1 - 1; cc <= c2 + 1; cc++) {
        if (lleno(r1 - 1, cc)) { r1--; cambio = true; break; }
      }
      for (let cc = c1 - 1; cc <= c2 + 1; cc++) {
        if (lleno(r2 + 1, cc)) { r2++; cambio = true; break; }
      }
      for (let rr = r1 - 1; rr <= r2 + 1; rr++) {
        if (lleno(rr, c1 - 1)) { c1--; cambio = true; break; }
      }
      for (let rr = r1 - 1; rr <= r2 + 1; rr++) {
        if (lleno(rr, c2 + 1)) { c2++; cambio = true; break; }
      }
    }
    return { r1, c1, r2, c2 };
  }
  function tieneEncabezados(hoja, rg) {
    if (rg.r2 === rg.r1) return false;
    const hid = hoja.idHoja();
    let todosTexto = true, algunNumAbajo = false;
    for (let c = rg.c1; c <= rg.c2; c++) {
      const v = hoja.hf.getCellValue({ sheet: hid, row: rg.r1, col: c });
      if (typeof v !== 'string' || v === '') todosTexto = false;
      const w = hoja.hf.getCellValue({ sheet: hid, row: rg.r1 + 1, col: c });
      if (typeof w !== 'string') algunNumAbajo = true;
    }
    const est = hoja.hj.estilos.get(k(rg.r1, rg.c1));
    return todosTexto && (algunNumAbajo || !!(est && est.b));
  }
  function valorOrden(v) {
    if (v == null || v === '') return [3, ''];
    if (typeof v === 'number') return [0, v];
    if (typeof v === 'boolean') return [2, v ? 1 : 0];
    if (typeof v === 'object') return [4, ''];
    return [1, String(v).toLocaleLowerCase('es')];
  }
  function compararValores(a, b) {
    const x = valorOrden(a), y = valorOrden(b);
    if (x[0] !== y[0]) return x[0] - y[0];
    if (x[0] === 1) return x[1].localeCompare(y[1], 'es');
    return x[1] < y[1] ? -1 : x[1] > y[1] ? 1 : 0;
  }
  function campo(etiqueta, control) { return [h('label', null, etiqueta), control]; }
  function seleccionDe(opciones, valor) {
    const s = h('select');
    for (const op of opciones) {
      const [v, t] = Array.isArray(op) ? op : [op, op];
      s.appendChild(h('option', { value: v, selected: String(v) === String(valor) ? true : null }, t));
    }
    return s;
  }
  function entrada(valor, ph) { return h('input', { type: 'text', value: valor == null ? '' : valor, placeholder: ph || '' }); }
  function textoRef(hoja, rg) { return R.textoRango(rg || hoja.rango); }

  /* Ordena filas de una región según claves [{c, desc}] */
  function ordenarRegion(hoja, region, claves, encab) {
    const hj = hoja.hj;
    const hid = hoja.idHoja();
    const r0 = encab ? region.r1 + 1 : region.r1;
    if (r0 > region.r2) return;
    const filas = [];
    for (let r = r0; r <= region.r2; r++) {
      const raws = [], ests = [], vals = {};
      for (let c = region.c1; c <= region.c2; c++) {
        raws.push(hj.celdas.get(k(r, c)));
        ests.push(hj.estilos.get(k(r, c)));
      }
      for (const cl of claves) vals[cl.c] = hoja.hf.getCellValue({ sheet: hid, row: r, col: cl.c });
      filas.push({ r, raws, ests, vals });
    }
    filas.sort((a, b) => {
      for (const cl of claves) {
        const d = compararValores(a.vals[cl.c], b.vals[cl.c]);
        if (d) {
          // vacíos siempre al final
          const vacioA = a.vals[cl.c] == null || a.vals[cl.c] === '', vacioB = b.vals[cl.c] == null || b.vals[cl.c] === '';
          if (vacioA !== vacioB) return vacioA ? 1 : -1;
          return cl.desc ? -d : d;
        }
      }
      return a.r - b.r;
    });
    hoja.guardarDeshacer();
    const lista = [];
    filas.forEach((f, i) => {
      const r = r0 + i;
      f.raws.forEach((raw, j) => {
        const c = region.c1 + j;
        lista.push({ r, c, raw: raw && raw[0] === '=' ? R.desplazarFormula(raw, r - f.r, 0) : raw || null });
        if (f.ests[j]) hj.estilos.set(k(r, c), JSON.parse(JSON.stringify(f.ests[j]))); else hj.estilos.delete(k(r, c));
      });
    });
    hoja._ponerVarios(lista);
    hoja.pintar();
    hoja.emitir('accion', { tipo: 'ordenar', rango: R.textoRango(region), claves: claves.map((x) => ({ col: R.colLetra(x.c), desc: !!x.desc })) });
    hoja.emitir('cambio', { tipo: 'ordenar' });
  }

  function aplicarFiltro(hoja) {
    const hj = hoja.hj;
    const f = hj.filtro;
    const hid = hoja.idHoja();
    hj.filasOcultas = new Set();
    if (f) {
      for (let r = f.r1 + 1; r <= f.r2; r++) {
        for (const [c, permitidos] of Object.entries(f.criterios || {})) {
          if (!permitidos) continue;
          const v = hoja.hf.getCellValue({ sheet: hid, row: r, col: +c });
          const txt = v == null ? '(Vacías)' : String(v);
          if (!permitidos.includes(txt)) { hj.filasOcultas.add(r); break; }
        }
      }
    }
    hoja.renderHoja();
  }

  /* ------------------------------------------------ búsqueda de objetivo */
  function buscarObjetivo(hoja, celdaDef, objetivo, celdaCambio) {
    const pd = R.parseRango(celdaDef), pc = R.parseRango(celdaCambio);
    const hDef = pd.hoja ? hoja.indiceHoja(pd.hoja) : hoja.libro.activa;
    const hCam = pc.hoja ? hoja.indiceHoja(pc.hoja) : hoja.libro.activa;
    const sidD = hoja.idHoja(hDef), sidC = hoja.idHoja(hCam);
    const rawCambio = hoja.libro.hojas[hCam].celdas.get(k(pc.r1, pc.c1)) || '';
    const f = (x) => {
      hoja.hf.setCellContents({ sheet: sidC, row: pc.r1, col: pc.c1 }, [[x]]);
      const v = hoja.hf.getCellValue({ sheet: sidD, row: pd.r1, col: pd.c1 });
      return typeof v === 'number' ? v - objetivo : NaN;
    };
    const inicial = F.interpretar(rawCambio);
    let x0 = inicial.tipo === 'numero' ? inicial.valor : 0;
    let x1 = x0 === 0 ? 1 : x0 * 1.01;
    let f0 = f(x0), f1 = f(x1);
    let mejor = Math.abs(f0) < Math.abs(f1) ? { x: x0, e: f0 } : { x: x1, e: f1 };
    const tol = 1e-7 * Math.max(1, Math.abs(objetivo));
    for (let i = 0; i < 100 && Math.abs(mejor.e) > tol; i++) {
      if (!isFinite(f0) || !isFinite(f1) || f1 === f0) break;
      const x2 = x1 - f1 * (x1 - x0) / (f1 - f0);
      if (!isFinite(x2)) break;
      x0 = x1; f0 = f1; x1 = x2; f1 = f(x2);
      if (isFinite(f1) && Math.abs(f1) < Math.abs(mejor.e)) mejor = { x: x2, e: f1 };
    }
    // restaura el motor; el resultado se aplica con deshacer
    hoja.hf.setCellContents({ sheet: sidC, row: pc.r1, col: pc.c1 }, [[LT.motor.contenidoMotor(rawCambio)]]);
    return { ok: Math.abs(mejor.e) <= Math.max(tol, 1e-4), x: mejor.x, hCam, pc };
  }

  /* --------------------------------------------- relleno rápido (patrones) */
  function candidatosRelleno() {
    const pal = (x) => String(x).trim().split(/\s+/);
    const nomProp = (s) => String(s).toLowerCase().replace(/(^|[\s-])(\S)/g, (m, a, b) => a + b.toUpperCase());
    const base = [
      ['primera palabra', (x) => pal(x)[0]],
      ['segunda palabra', (x) => pal(x)[1]],
      ['última palabra', (x) => pal(x).slice(-1)[0]],
      ['todo menos la primera palabra', (x) => pal(x).slice(1).join(' ')],
      ['todo menos la última palabra', (x) => pal(x).slice(0, -1).join(' ')],
      ['antes de @', (x) => String(x).split('@')[0]],
      ['después de @', (x) => String(x).split('@')[1]],
      ['antes del guion', (x) => String(x).split('-')[0]],
      ['después del guion', (x) => String(x).split('-').slice(1).join('-')],
      ['iniciales', (x) => pal(x).map((w) => w[0]).join('')],
      ['texto completo', (x) => String(x).trim().replace(/\s+/g, ' ')],
      ['solo dígitos', (x) => String(x).replace(/\D/g, '')],
    ];
    const casos = [['', (s) => s], [' en mayúsculas', (s) => s.toUpperCase()], [' en minúsculas', (s) => s.toLowerCase()], [' con mayúscula inicial', nomProp]];
    const out = [];
    for (const [n1, f1] of base) for (const [n2, f2] of casos) out.push([n1 + n2, (x) => { const v = f1(x); return v == null ? null : f2(v); }]);
    return out;
  }
  function rellenoRapido(hoja) {
    const hj = hoja.hj;
    const hid = hoja.idHoja();
    const col = hoja.sel.ac;
    // región: columnas vecinas con datos
    const vecina = regionActual(hoja, hoja.sel.ar, Math.max(0, col - 1));
    const reg = regionActual(hoja, hoja.sel.ar, col);
    const r1 = Math.min(vecina.r1, reg.r1), r2 = Math.max(vecina.r2, reg.r2);
    const c1 = Math.min(vecina.c1, reg.c1), c2 = Math.max(vecina.c2, reg.c2);
    const encab = tieneEncabezados(hoja, { r1, c1, r2, c2 });
    const ini = encab ? r1 + 1 : r1;
    const ejemplos = [];
    const vacias = [];
    for (let r = ini; r <= r2; r++) {
      const raw = hj.celdas.get(k(r, col));
      if (raw) ejemplos.push({ r, v: raw }); else vacias.push(r);
    }
    if (!ejemplos.length) { LT.ui.aviso('Relleno rápido', 'Escribe primero uno o dos ejemplos del resultado que quieres en la columna, y luego usa Relleno rápido.'); return; }
    if (!vacias.length) { LT.ui.toast('La columna ya está completa.'); return; }
    const fuentes = [];
    for (let c = c1; c <= c2; c++) if (c !== col) fuentes.push(c);
    const val = (r, c) => { const v = hoja.hf.getCellValue({ sheet: hid, row: r, col: c }); return v == null ? '' : String(v); };
    const cands = candidatosRelleno();
    let elegido = null;
    for (const c of fuentes) {
      for (const [nombre, fn] of cands) {
        if (ejemplos.every((e) => fn(val(e.r, c)) === e.v)) { elegido = { c, fn, nombre }; break; }
      }
      if (elegido) break;
    }
    // combinaciones de dos columnas: "A B", "B, A", "A - B"
    if (!elegido) {
      const seps = [' ', ', ', ' - ', ''];
      outer: for (const a of fuentes) for (const b of fuentes) {
        if (a === b) continue;
        for (const s of seps) {
          const fn = (r) => val(r, a) + s + val(r, b);
          if (ejemplos.every((e) => fn(e.r) === e.v)) { elegido = { fn2: fn, nombre: 'unir columnas' }; break outer; }
        }
      }
    }
    if (!elegido) { LT.ui.aviso('Relleno rápido', 'Relleno rápido no reconoció un patrón. Escribe otro ejemplo y vuelve a intentarlo.'); return; }
    hoja.guardarDeshacer();
    const lista = vacias.map((r) => ({ r, c: col, raw: elegido.fn2 ? elegido.fn2(r) : elegido.fn(val(r, elegido.c)) })).filter((x) => x.raw != null && x.raw !== '');
    hoja._ponerVarios(lista);
    hoja.pintar();
    LT.ui.toast('Relleno rápido completó ' + lista.length + ' celdas (' + elegido.nombre + ').', 'ok');
    hoja.emitir('accion', { tipo: 'rellenoRapido', col: R.colLetra(col) });
    hoja.emitir('cambio', { tipo: 'rellenoRapido' });
  }

  /* ========================================================= COMANDOS */
  const C = {};
  C.cortar = (hj) => hj.copiarInterno(true, true);
  C.copiar = (hj) => hj.copiarInterno(false, true);
  C.pegar = (hj) => hj.pegar({});
  C.pincel = (hj) => hj.activarPincel();
  C.pegadoEspecial = async (hj) => {
    if (!hj.hayPortapapeles()) { LT.ui.toast('Primero copia (Ctrl+C) las celdas.', 'aviso'); return; }
    const radio = (nombre, v, t, marcado) => h('label', { class: 'en-linea' }, h('input', { type: 'radio', name: nombre, value: v, checked: marcado ? true : null }), t);
    const cuerpo = h('div', null,
      h('div', { class: 'fila2' },
        h('div', null, h('label', null, 'Pegar'), radio('pe', 'todo', 'Todo', true), radio('pe', 'formulas', 'Fórmulas'), radio('pe', 'valores', 'Valores'), radio('pe', 'formatos', 'Formatos')),
        h('div', null, h('label', null, 'Operación'), radio('op', '', 'Ninguna', true), radio('op', 'sumar', 'Sumar'), radio('op', 'restar', 'Restar'), radio('op', 'multiplicar', 'Multiplicar'), radio('op', 'dividir', 'Dividir'))),
      h('label', { class: 'en-linea' }, h('input', { type: 'checkbox', id: 'pe-tr' }), 'Transponer'));
    const r = await LT.ui.modal({
      titulo: 'Pegado especial', cuerpo,
      botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: () => ({ solo: cuerpo.querySelector('[name=pe]:checked').value, operacion: cuerpo.querySelector('[name=op]:checked').value || null, transponer: cuerpo.querySelector('#pe-tr').checked }) }],
    });
    if (r) hj.pegar(r);
    hj.enfocar();
  };
  C.negrita = (hj) => hj.alternarEstilo('b');
  C.cursiva = (hj) => hj.alternarEstilo('i');
  C.subrayado = (hj) => hj.alternarEstilo('u');
  C.tamano = (hj, delta) => {
    const est = hj.hj.estilos.get(k(hj.sel.ar, hj.sel.ac)) || {};
    hj.aplicarEstilo({ fs: Math.max(8, Math.min(28, (est.fs || 13) + delta)) });
  };
  C.alinear = (hj, ha) => hj.aplicarEstilo({ ha });
  C.ajustarTexto = (hj) => hj.alternarEstilo('wrap');
  C.relleno = (hj, color) => hj.aplicarEstilo({ bg: color || null });
  C.colorFuente = (hj, color) => hj.aplicarEstilo({ fg: color });
  C.bordes = (hj, tipo) => (tipo === 'ninguno' ? hj.aplicarEstilo({ bd: null }) : hj.aplicarBordes(tipo));
  C.formato = (hj, fmt) => hj.aplicarFormato(fmt);
  C.decimales = (hj, delta) => {
    const est = hj.hj.estilos.get(k(hj.sel.ar, hj.sel.ac)) || {};
    const v = hj.hf.getCellValue({ sheet: hj.idHoja(), row: hj.sel.ar, col: hj.sel.ac });
    hj.aplicarFormato(F.ajustarDecimales(est.fmt, delta, typeof v === 'number' ? v : 0));
  };
  C.estiloCelda = (hj, nombre) => {
    const props = Object.assign({ b: null, i: null, bg: null, fg: null, fs: null, bd: null }, JSON.parse(JSON.stringify(ESTILOS_CELDA[nombre] || {})));
    if (nombre === 'Moneda' || nombre === 'Porcentaje') { hj.aplicarEstilo({ fmt: props.fmt, estilo: nombre }); return; }
    props.estilo = nombre === 'Normal' ? null : nombre;
    hj.aplicarEstilo(props);
  };
  C.bloquear = (hj) => {
    const est = hj.hj.estilos.get(k(hj.sel.ar, hj.sel.ac)) || {};
    hj.aplicarEstilo({ desbloqueada: !est.desbloqueada });
    LT.ui.toast(est.desbloqueada ? 'Celdas bloqueadas: no se podrán editar al proteger la hoja.' : 'Celdas desbloqueadas: se podrán editar aunque la hoja esté protegida.');
  };
  C.formatoCeldas = async (hj) => {
    const est = hj.hj.estilos.get(k(hj.sel.ar, hj.sel.ac)) || {};
    const v = hj.hf.getCellValue({ sheet: hj.idHoja(), row: hj.sel.ar, col: hj.sel.ac });
    const muestra = typeof v === 'number' ? v : 1234.5;
    const categorias = [['General', 'General'], ['Número', '0.00'], ['Moneda', '$#,##0.00'], ['Contabilidad', F.PRESETS.Contabilidad], ['Fecha', 'dd/mm/yyyy'], ['Hora', 'hh:mm'], ['Porcentaje', '0.00%'], ['Texto', '@'], ['Personalizada', est.fmt || 'General']];
    const comunes = ['0', '0.00', '#,##0', '#,##0.00', '$#,##0.00', '$#,##0.00;[Rojo]-$#,##0.00', '0%', '0.0%', 'dd/mm/yyyy', 'd-mmm-yy', 'mmmm yyyy', 'dddd', '"CAF-"000', '0.0 "kg"', '#,##0,"k"'];
    const lista = h('select', { size: 9, style: { width: '100%' } });
    categorias.forEach(([n]) => lista.appendChild(h('option', { value: n }, n)));
    const cod = entrada(est.fmt || 'General');
    const vista = h('div', { class: 'vista-previa' });
    const sugeridos = h('select', { size: 6, style: { width: '100%', fontFamily: 'var(--mono)' } });
    comunes.forEach((x) => sugeridos.appendChild(h('option', { value: x }, x)));
    const bloqueada = h('input', { type: 'checkbox', checked: est.desbloqueada ? null : true });
    const actualizar = () => {
      const c = F.normalizarCodigo(cod.value.trim() || 'General');
      const f = F.formatear(muestra, c);
      vista.innerHTML = '';
      vista.appendChild(h('span', { style: { color: f.color || 'inherit' } }, 'Muestra: ' + f.texto));
    };
    lista.addEventListener('change', () => { const cat = categorias.find((x) => x[0] === lista.value); if (cat && cat[0] !== 'Personalizada') cod.value = cat[1]; actualizar(); });
    sugeridos.addEventListener('change', () => { cod.value = sugeridos.value; lista.value = 'Personalizada'; actualizar(); });
    cod.addEventListener('input', () => { lista.value = 'Personalizada'; actualizar(); });
    lista.value = (categorias.find((x) => x[1] === est.fmt) || ['Personalizada'])[0];
    if (!est.fmt) lista.value = 'General';
    actualizar();
    const cuerpo = h('div', null,
      h('div', { class: 'fila2' }, h('div', null, h('label', null, 'Categoría'), lista), h('div', null, h('label', null, 'Tipo (código de formato)'), cod, vista, h('label', null, 'Códigos frecuentes'), sugeridos)),
      h('p', { style: { fontSize: '.84rem', color: 'var(--tinta-3)', marginTop: '10px' } }, 'En Excel en español el año se escribe «aaaa» y el color «[Rojo]»; aquí puedes usar «aaaa» o «yyyy».'),
      h('label', { class: 'en-linea' }, bloqueada, 'Bloqueada (pestaña Proteger: solo tiene efecto al proteger la hoja)'));
    const r = await LT.ui.modal({ titulo: 'Formato de celdas', clase: 'ancho', cuerpo, botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: () => ({ fmt: F.normalizarCodigo(cod.value.trim() || 'General'), desbloqueada: !bloqueada.checked }) }] });
    if (r) {
      hj.aplicarEstilo({ fmt: r.fmt === 'General' ? null : r.fmt, desbloqueada: r.desbloqueada || null });
    }
    hj.enfocar();
  };

  /* --------------------------------------------- edición y búsqueda */
  C.autosuma = (hj) => {
    const hIdx = hj.libro.activa;
    const rg = hj.rango;
    const esNum = (r, c) => typeof hj.hf.getCellValue({ sheet: hj.idHoja(), row: r, col: c }) === 'number';
    if (rg.r1 !== rg.r2 || rg.c1 !== rg.c2) {
      // rango seleccionado: suma debajo de cada columna
      hj.guardarDeshacer();
      const lista = [];
      for (let c = rg.c1; c <= rg.c2; c++) lista.push({ r: rg.r2 + 1, c, raw: '=SUMA(' + R.dir(rg.r1, c) + ':' + R.dir(rg.r2, c) + ')' });
      hj._ponerVarios(lista);
      hj.pintar();
      hj.emitir('cambio', { tipo: 'autosuma' });
      return;
    }
    const r = rg.r1, c = rg.c1;
    let texto = '=SUMA()';
    if (r > 0 && esNum(r - 1, c)) {
      let r0 = r - 1;
      while (r0 - 1 >= 0 && esNum(r0 - 1, c)) r0--;
      texto = '=SUMA(' + R.dir(r0, c) + ':' + R.dir(r - 1, c) + ')';
    } else if (c > 0 && esNum(r, c - 1)) {
      let c0 = c - 1;
      while (c0 - 1 >= 0 && esNum(r, c0 - 1)) c0--;
      texto = '=SUMA(' + R.dir(r, c0) + ':' + R.dir(r, c - 1) + ')';
    }
    hj.iniciarEdicion('editar', texto);
    if (texto === '=SUMA()') hj.editor.setSelectionRange(6, 6);
    hj.emitir('accion', { tipo: 'autosuma', celda: R.dir(r, c), hoja: hIdx });
  };
  C.rellenarAbajo = (hj) => hj.rellenarAbajo();
  C.rellenarDerecha = (hj) => hj.rellenarDerecha();
  C.buscar = (hj) => C.reemplazar(hj, true);
  C.reemplazar = async (hj, soloBuscar) => {
    const buscar = entrada(hj._ultimaBusqueda || '');
    const reempl = entrada('');
    const mayus = h('input', { type: 'checkbox' });
    const completa = h('input', { type: 'checkbox' });
    const msj = h('div', { class: 'retro' });
    const coincide = (txt) => {
      const a = mayus.checked ? txt : txt.toLowerCase();
      const b = mayus.checked ? buscar.value : buscar.value.toLowerCase();
      return completa.checked ? a === b : a.includes(b);
    };
    const celdas = () => {
      const out = [];
      for (const [kk, raw] of hj.hj.celdas) { const [r, c] = kk.split(',').map(Number); out.push({ r, c, raw }); }
      return out.sort((a, b) => a.r - b.r || a.c - b.c);
    };
    const siguiente = () => {
      if (!buscar.value) return;
      hj._ultimaBusqueda = buscar.value;
      const lista = celdas().filter((x) => coincide(hj.textoCelda(hj.libro.activa, x.r, x.c).texto) || coincide(x.raw));
      if (!lista.length) { msj.textContent = 'No encontramos lo que buscaba.'; return; }
      const act = hj.sel.ar * 10000 + hj.sel.ac;
      const sig = lista.find((x) => x.r * 10000 + x.c > act) || lista[0];
      hj.seleccionar({ r1: sig.r, c1: sig.c, r2: sig.r, c2: sig.c });
      msj.textContent = 'Encontrado en ' + R.dir(sig.r, sig.c) + ' (' + lista.length + ' coincidencias).';
    };
    const reemplazarTodos = () => {
      if (!buscar.value) return;
      const lista = celdas().filter((x) => x.raw[0] !== '=' || true).filter((x) => coincide(x.raw));
      if (!lista.length) { msj.textContent = 'No encontramos nada que reemplazar.'; return; }
      hj.guardarDeshacer();
      const flags = mayus.checked ? 'g' : 'gi';
      const re = new RegExp(buscar.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      hj._ponerVarios(lista.map((x) => ({ r: x.r, c: x.c, raw: completa.checked ? reempl.value : x.raw.replace(re, reempl.value) })));
      hj.pintar();
      msj.textContent = 'Listo. Se realizaron ' + lista.length + ' reemplazos.';
      hj.emitir('accion', { tipo: 'reemplazar', buscar: buscar.value, por: reempl.value, n: lista.length });
      hj.emitir('cambio', { tipo: 'reemplazar' });
    };
    const cuerpo = h('div', null,
      campo('Buscar:', buscar),
      soloBuscar ? null : campo('Reemplazar con:', reempl),
      h('label', { class: 'en-linea' }, mayus, 'Coincidir mayúsculas y minúsculas'),
      h('label', { class: 'en-linea' }, completa, 'Coincidir con el contenido de toda la celda'),
      h('div', { class: 'grupo-btn', style: { marginTop: '10px' } },
        soloBuscar ? null : h('button', { class: 'btn chico', onclick: reemplazarTodos }, 'Reemplazar todos'),
        h('button', { class: 'btn chico', onclick: siguiente }, 'Buscar siguiente')),
      msj);
    await LT.ui.modal({ titulo: soloBuscar ? 'Buscar' : 'Buscar y reemplazar', cuerpo, enterAcepta: false, botones: [{ texto: 'Cerrar', valor: null, primario: true }] });
    hj.enfocar();
  };

  /* ------------------------------------------------------------ datos */
  C.ordenarAZ = (hj) => C._ordenRapido(hj, false);
  C.ordenarZA = (hj) => C._ordenRapido(hj, true);
  C._ordenRapido = (hj, desc) => {
    const rg = hj.rango;
    const region = rg.r1 === rg.r2 && rg.c1 === rg.c2 ? regionActual(hj, rg.r1, rg.c1) : rg;
    if (region.r1 === region.r2 && region.c1 === region.c2 && !hj._tieneContenido(hj.libro.activa, region.r1, region.c1)) { LT.ui.toast('Selecciona una celda dentro de tus datos.', 'aviso'); return; }
    ordenarRegion(hj, region, [{ c: hj.sel.ac, desc }], tieneEncabezados(hj, region));
  };
  C.ordenar = async (hj) => {
    const region = regionActual(hj, hj.sel.ar, hj.sel.ac);
    const encab = h('input', { type: 'checkbox', checked: tieneEncabezados(hj, region) ? true : null });
    const nombreCol = (c) => {
      if (encab.checked) { const v = hj.hf.getCellValue({ sheet: hj.idHoja(), row: region.r1, col: c }); if (v) return String(v); }
      return 'Columna ' + R.colLetra(c);
    };
    const niveles = h('div');
    const agregar = () => {
      const cols = [];
      for (let c = region.c1; c <= region.c2; c++) cols.push([c, nombreCol(c)]);
      const fila = h('div', { class: 'fila2', style: { marginBottom: '6px' } }, seleccionDe(cols, hj.sel.ac), seleccionDe([['asc', 'De A a Z / de menor a mayor'], ['desc', 'De Z a A / de mayor a menor']], 'asc'));
      fila.appendChild(h('button', { class: 'btn chico fantasma', onclick: () => fila.remove() }, 'Quitar'));
      fila.style.gridTemplateColumns = '1fr 1fr auto';
      niveles.appendChild(fila);
    };
    agregar();
    const cuerpo = h('div', null,
      h('p', null, 'Rango: ', h('b', null, R.textoRango(region))),
      h('label', { class: 'en-linea' }, encab, 'Mis datos tienen encabezados'),
      h('label', null, 'Ordenar por (cada nivel desempata al anterior)'), niveles,
      h('button', { class: 'btn chico', onclick: agregar }, '+ Agregar nivel'));
    const r = await LT.ui.modal({
      titulo: 'Ordenar', clase: 'ancho', cuerpo, enterAcepta: false,
      botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: () => Array.from(niveles.children).map((f) => ({ c: +f.querySelectorAll('select')[0].value, desc: f.querySelectorAll('select')[1].value === 'desc' })) }],
    });
    if (r && r.length) ordenarRegion(hj, region, r, encab.checked);
    hj.enfocar();
  };
  C.filtro = (hj) => {
    const hjo = hj.hj;
    if (hjo.filtro) { hj.guardarDeshacer(); hjo.filtro = null; aplicarFiltro(hj); hj.emitir('accion', { tipo: 'filtro', activo: false }); hj.emitir('cambio', { tipo: 'filtro' }); return; }
    const region = regionActual(hj, hj.sel.ar, hj.sel.ac);
    if (region.r1 === region.r2) { LT.ui.toast('Selecciona una celda dentro de una tabla con encabezados.', 'aviso'); return; }
    hj.guardarDeshacer();
    hjo.filtro = Object.assign({}, region, { criterios: {} });
    aplicarFiltro(hj);
    hj.emitir('accion', { tipo: 'filtro', activo: true, rango: R.textoRango(region) });
    hj.emitir('cambio', { tipo: 'filtro' });
  };
  function abrirMenuFiltro(hj, c, ev) {
    const f = hj.hj.filtro;
    const hid = hj.idHoja();
    const valores = new Set();
    for (let r = f.r1 + 1; r <= f.r2; r++) { const v = hj.hf.getCellValue({ sheet: hid, row: r, col: c }); valores.add(v == null ? '(Vacías)' : String(v)); }
    const lista = Array.from(valores).sort((a, b) => compararValores(isNaN(+a) ? a : +a, isNaN(+b) ? b : +b));
    const actuales = f.criterios[c];
    const cajas = lista.map((v) => h('input', { type: 'checkbox', value: v, checked: !actuales || actuales.includes(v) ? true : null }));
    const todos = h('input', { type: 'checkbox', checked: !actuales ? true : null });
    todos.addEventListener('change', () => cajas.forEach((x) => { x.checked = todos.checked; }));
    hj._menuEn(ev, []);
    const menu = hj._menu;
    menu.classList.add('hoja-filtro');
    menu.innerHTML = '';
    const ordenar = (desc) => { hj._ocultarMenus(); ordenarRegion(hj, f, [{ c, desc }], true); };
    menu.appendChild(h('div', { class: 'menu-item', onmousedown: (e) => { e.preventDefault(); ordenar(false); } }, 'Ordenar de A a Z'));
    menu.appendChild(h('div', { class: 'menu-item', onmousedown: (e) => { e.preventDefault(); ordenar(true); } }, 'Ordenar de Z a A'));
    menu.appendChild(h('div', { class: 'menu-sep' }));
    const cont = h('div', { class: 'lista-valores' }, h('label', null, todos, '(Seleccionar todo)'), lista.map((v, i) => h('label', null, cajas[i], v)));
    menu.appendChild(cont);
    menu.appendChild(h('div', { class: 'pie' },
      h('button', { class: 'btn chico', onmousedown: (e) => { e.preventDefault(); hj._ocultarMenus(); } }, 'Cancelar'),
      h('button', { class: 'btn chico primario', onmousedown: (e) => {
        e.preventDefault();
        const sel = cajas.filter((x) => x.checked).map((x) => x.value);
        hj.guardarDeshacer();
        if (sel.length === lista.length) delete f.criterios[c]; else f.criterios[c] = sel;
        hj._ocultarMenus();
        aplicarFiltro(hj);
        hj.emitir('accion', { tipo: 'filtrar', col: R.colLetra(c), valores: sel });
        hj.emitir('cambio', { tipo: 'filtro' });
      } }, 'Aceptar')));
    menu.querySelectorAll('input').forEach((x) => x.addEventListener('mousedown', (e) => e.stopPropagation()));
    menu.querySelectorAll('label').forEach((x) => x.addEventListener('mousedown', (e) => e.stopPropagation()));
  }
  C.quitarDuplicados = async (hj) => {
    const region = regionActual(hj, hj.sel.ar, hj.sel.ac);
    const encab = h('input', { type: 'checkbox', checked: tieneEncabezados(hj, region) ? true : null });
    const cols = [];
    for (let c = region.c1; c <= region.c2; c++) {
      const v = hj.hf.getCellValue({ sheet: hj.idHoja(), row: region.r1, col: c });
      cols.push(h('label', { class: 'en-linea' }, h('input', { type: 'checkbox', value: c, checked: true }), (v && typeof v === 'string' ? v : 'Columna ' + R.colLetra(c))));
    }
    const cuerpo = h('div', null, h('p', null, 'Para quitar duplicados, elige las columnas que se deben comparar. Rango: ', h('b', null, R.textoRango(region))), h('label', { class: 'en-linea' }, encab, 'Mis datos tienen encabezados'), h('label', null, 'Columnas'), cols);
    const r = await LT.ui.modal({ titulo: 'Quitar duplicados', cuerpo, botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: () => Array.from(cuerpo.querySelectorAll('input[value]')).filter((x) => x.checked).map((x) => +x.value) }] });
    if (!r || !r.length) { hj.enfocar(); return; }
    const hjo = hj.hj;
    const hid = hj.idHoja();
    const r0 = encab.checked ? region.r1 + 1 : region.r1;
    const vistos = new Set();
    const quedan = [];
    for (let rr = r0; rr <= region.r2; rr++) {
      const clave = r.map((c) => { const v = hj.hf.getCellValue({ sheet: hid, row: rr, col: c }); return typeof v === 'string' ? v.toLowerCase() : String(v); }).join('\u0001');
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      quedan.push(rr);
    }
    const quitados = region.r2 - r0 + 1 - quedan.length;
    hj.guardarDeshacer();
    const lista = [];
    const estilos = [];
    quedan.forEach((src, i) => {
      const dst = r0 + i;
      for (let c = region.c1; c <= region.c2; c++) {
        const raw = hjo.celdas.get(k(src, c));
        lista.push({ r: dst, c, raw: raw && raw[0] === '=' ? R.desplazarFormula(raw, dst - src, 0) : raw || null });
        estilos.push([dst, c, hjo.estilos.get(k(src, c))]);
      }
    });
    for (let rr = r0 + quedan.length; rr <= region.r2; rr++) for (let c = region.c1; c <= region.c2; c++) { lista.push({ r: rr, c, raw: null }); estilos.push([rr, c, null]); }
    for (const [rr, c, e] of estilos) { if (e) hjo.estilos.set(k(rr, c), JSON.parse(JSON.stringify(e))); else hjo.estilos.delete(k(rr, c)); }
    hj._ponerVarios(lista);
    hj.pintar();
    await LT.ui.aviso('Quitar duplicados', quitados ? 'Se encontraron y quitaron ' + quitados + ' valores duplicados; quedan ' + quedan.length + ' valores únicos.' : 'No se encontraron valores duplicados.');
    hj.emitir('accion', { tipo: 'quitarDuplicados', quitados });
    hj.emitir('cambio', { tipo: 'duplicados' });
    hj.enfocar();
  };
  C.textoEnColumnas = async (hj) => {
    const rg = hj.rango;
    if (rg.c1 !== rg.c2) { LT.ui.aviso('Texto en columnas', 'Selecciona una sola columna (las celdas que quieres separar).'); return; }
    const delim = seleccionDe([[' ', 'Espacio'], [',', 'Coma'], [';', 'Punto y coma'], ['-', 'Guion'], ['@', 'Arroba'], ['otro', 'Otro…']], ' ');
    const otro = entrada('', 'Carácter');
    const consec = h('input', { type: 'checkbox', checked: true });
    const cuerpo = h('div', null, h('p', null, 'Asistente para convertir texto en columnas: los datos de ', h('b', null, R.textoRango(rg)), ' se separarán hacia la derecha.'), campo('Separadores', delim), campo('Otro separador', otro), h('label', { class: 'en-linea' }, consec, 'Considerar separadores consecutivos como uno solo'));
    const r = await LT.ui.modal({ titulo: 'Texto en columnas', cuerpo, botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Finalizar', primario: true, valor: () => (delim.value === 'otro' ? otro.value : delim.value) }] });
    if (!r) { hj.enfocar(); return; }
    const hjo = hj.hj;
    const partes = [];
    let max = 1;
    for (let rr = rg.r1; rr <= rg.r2; rr++) {
      const raw = hjo.celdas.get(k(rr, rg.c1)) || '';
      let p = raw[0] === '=' ? [raw] : raw.split(r);
      if (consec.checked) p = p.filter((x, i) => x !== '' || i === 0);
      p = p.map((x) => x.trim());
      partes.push(p);
      max = Math.max(max, p.length);
    }
    let ocupado = false;
    for (let rr = rg.r1; rr <= rg.r2; rr++) for (let c = rg.c1 + 1; c < rg.c1 + max; c++) if (hjo.celdas.has(k(rr, c))) ocupado = true;
    if (ocupado) {
      const ok = await LT.ui.modal({ titulo: 'Microsoft Excel', cuerpo: h('p', null, 'Ya hay datos aquí. ¿Desea reemplazarlos?'), botones: [{ texto: 'Cancelar', valor: false }, { texto: 'Aceptar', primario: true, valor: true }] });
      if (!ok) { hj.enfocar(); return; }
    }
    hj.guardarDeshacer();
    const lista = [];
    partes.forEach((p, i) => { for (let j = 0; j < max; j++) lista.push({ r: rg.r1 + i, c: rg.c1 + j, raw: p[j] != null ? p[j] : null }); });
    hj._ponerVarios(lista);
    hj.pintar();
    hj.emitir('accion', { tipo: 'textoEnColumnas', separador: r });
    hj.emitir('cambio', { tipo: 'textoColumnas' });
    hj.enfocar();
  };
  C.rellenoRapido = (hj) => rellenoRapido(hj);
  C.validacion = async (hj) => {
    const actual = hj._validacionDe(hj.sel.ar, hj.sel.ac) || {};
    const tipo = seleccionDe([['', 'Cualquier valor'], ['entero', 'Número entero'], ['decimal', 'Decimal'], ['lista', 'Lista'], ['fecha', 'Fecha'], ['longitud', 'Longitud del texto']], actual.tipo || '');
    const origen = entrada(actual.origen || '', 'Centro,Norte,Sur   o   =$H$2:$H$4');
    const min = entrada(actual.min, 'mínimo'), max = entrada(actual.max, 'máximo');
    const titulo = entrada(actual.tituloError || '', 'Título del mensaje');
    const mensaje = entrada(actual.mensajeError || '', 'Mensaje de error');
    const bloqueLista = h('div', null, campo('Origen (valores separados por coma o un rango)', origen));
    const bloqueNum = h('div', { class: 'fila2' }, h('div', null, campo('Mínimo', min)), h('div', null, campo('Máximo', max)));
    const ver = () => { bloqueLista.style.display = tipo.value === 'lista' ? '' : 'none'; bloqueNum.style.display = ['entero', 'decimal', 'fecha', 'longitud'].includes(tipo.value) ? '' : 'none'; };
    tipo.addEventListener('change', ver);
    ver();
    const cuerpo = h('div', null, h('p', null, 'Se aplicará a ', h('b', null, textoRef(hj)), '.'), campo('Permitir', tipo), bloqueLista, bloqueNum, h('label', null, 'Mensaje de error (opcional)'), titulo, mensaje);
    const r = await LT.ui.modal({ titulo: 'Validación de datos', cuerpo, botones: [{ texto: 'Borrar todos', valor: 'borrar' }, { texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: 'ok' }] });
    if (!r) { hj.enfocar(); return; }
    const rango = textoRef(hj);
    hj.guardarDeshacer();
    const hjo = hj.hj;
    hjo.validaciones = hjo.validaciones.filter((v) => v.rango !== rango);
    if (r === 'ok' && tipo.value) {
      hjo.validaciones.push({ rango, tipo: tipo.value, origen: origen.value.trim(), min: min.value, max: max.value, tituloError: titulo.value, mensajeError: mensaje.value });
    }
    hj.pintar();
    hj.emitir('accion', { tipo: 'validacion', rango, regla: tipo.value });
    hj.emitir('cambio', { tipo: 'validacion' });
    hj.enfocar();
  };

  /* --------------------------------------------- formato condicional */
  C.condicional = (hj, ev) => {
    const regla = (tipo, titulo, pide2) => () => C._dialogoCF(hj, tipo, titulo, pide2);
    const directa = (obj) => () => {
      hj.guardarDeshacer();
      hj.hj.condicionales.push(Object.assign({ rango: textoRef(hj) }, obj));
      hj.pintar();
      hj.emitir('accion', { tipo: 'condicional', regla: obj.tipo, rango: textoRef(hj) });
      hj.emitir('cambio', { tipo: 'condicional' });
    };
    hj._menuEn(ev, [
      { texto: '▸ Resaltar reglas de celdas', desactivado: true, accion: () => {} },
      { texto: '    Es mayor que…', accion: regla('mayor', 'Es mayor que') },
      { texto: '    Es menor que…', accion: regla('menor', 'Es menor que') },
      { texto: '    Entre…', accion: regla('entre', 'Entre', true) },
      { texto: '    Es igual a…', accion: regla('igual', 'Es igual a') },
      { texto: '    Texto que contiene…', accion: regla('texto', 'Texto que contiene') },
      { texto: '    Duplicar valores…', accion: regla('duplicados', 'Duplicar valores') },
      { texto: '▸ Reglas superiores e inferiores', desactivado: true, accion: () => {} },
      { texto: '    10 superiores…', accion: regla('superiores', 'Superiores') },
      { texto: '    10 inferiores…', accion: regla('inferiores', 'Inferiores') },
      { texto: '    Por encima del promedio', accion: directa({ tipo: 'sobrePromedio', formato: { bg: '#ffc7ce', fg: '#9c0006' } }) },
      { texto: '    Por debajo del promedio', accion: directa({ tipo: 'bajoPromedio', formato: { bg: '#ffc7ce', fg: '#9c0006' } }) },
      '-',
      { texto: 'Barras de datos (azul)', accion: directa({ tipo: 'barras', color: 'rgba(99,142,198,.6)' }) },
      { texto: 'Barras de datos (verde)', accion: directa({ tipo: 'barras', color: 'rgba(99,190,123,.6)' }) },
      { texto: 'Escala de color verde-amarillo-rojo', accion: directa({ tipo: 'escala', colores: ['#f8696b', '#ffeb84', '#63be7b'] }) },
      { texto: 'Escala de color rojo-amarillo-verde', accion: directa({ tipo: 'escala', colores: ['#63be7b', '#ffeb84', '#f8696b'] }) },
      { texto: 'Conjunto de iconos: semáforo', accion: directa({ tipo: 'iconos', juego: 'semaforo' }) },
      { texto: 'Conjunto de iconos: flechas', accion: directa({ tipo: 'iconos', juego: 'flechas' }) },
      '-',
      { texto: 'Nueva regla con fórmula…', accion: () => C._dialogoCF(hj, 'formula', 'Utilice una fórmula que determine las celdas para aplicar formato') },
      { texto: 'Borrar reglas de las celdas seleccionadas', accion: () => { hj.guardarDeshacer(); const rg = textoRef(hj); hj.hj.condicionales = hj.hj.condicionales.filter((x) => x.rango !== rg); hj.pintar(); hj.emitir('cambio', { tipo: 'condicional' }); } },
      { texto: 'Borrar reglas de toda la hoja', accion: () => { hj.guardarDeshacer(); hj.hj.condicionales = []; hj.pintar(); hj.emitir('cambio', { tipo: 'condicional' }); } },
      { texto: 'Administrar reglas…', accion: () => C._administrarCF(hj) },
    ]);
  };
  C._dialogoCF = async (hj, tipo, titulo, pide2) => {
    const v1 = entrada('', tipo === 'formula' ? '=Y($I2="Pendiente",$H2<$L$1)' : tipo === 'superiores' || tipo === 'inferiores' ? '10' : 'valor o =referencia');
    const v2 = entrada('', 'valor');
    const fmt = seleccionDe(FORMATOS_CF.map((x, i) => [i, x[0]]), 0);
    const rango = entrada(textoRef(hj));
    const ayuda = tipo === 'formula'
      ? h('p', { style: { fontSize: '.86rem', color: 'var(--tinta-2)' } }, 'La fórmula se escribe para la primera celda del rango (arriba a la izquierda) y debe dar VERDADERO o FALSO. Usa $ para fijar la columna (por ejemplo $I2) si quieres resaltar la fila completa.')
      : h('p', { style: { fontSize: '.86rem', color: 'var(--tinta-2)' } }, 'Puedes escribir un número o una referencia como =$D2 (se ajusta para cada fila).');
    const cuerpo = h('div', null,
      campo('Aplicar a', rango),
      tipo === 'duplicados' ? null : campo(tipo === 'formula' ? 'Dar formato a los valores donde esta fórmula sea verdadera:' : 'Valor', v1),
      pide2 ? campo('y', v2) : null,
      campo('con', fmt), ayuda);
    const r = await LT.ui.modal({ titulo, cuerpo, botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: 'ok' }] });
    if (!r) { hj.enfocar(); return; }
    const obj = { rango: rango.value.trim().replace(/\$/g, ''), tipo, formato: FORMATOS_CF[+fmt.value][1] };
    if (tipo === 'formula') {
      let f = v1.value.trim();
      if (f && f[0] !== '=') f = '=' + f;
      try { if (!hj.hf.validateFormula(LT.motor.aMotor(f))) throw new Error(); } catch (e) { LT.ui.aviso('Fórmula no válida', 'Revisa la fórmula: debe empezar con = y estar completa.'); return; }
      obj.formula = R.normalizarFormula(f);
    } else if (tipo === 'superiores' || tipo === 'inferiores') obj.valor = parseInt(v1.value, 10) || 10;
    else { obj.valor = v1.value.trim(); if (pide2) obj.valor2 = v2.value.trim(); }
    hj.guardarDeshacer();
    hj.hj.condicionales.push(obj);
    hj.pintar();
    hj.emitir('accion', { tipo: 'condicional', regla: tipo, rango: obj.rango });
    hj.emitir('cambio', { tipo: 'condicional' });
    hj.enfocar();
  };
  C._administrarCF = async (hj) => {
    const nombres = { mayor: 'Valor >', menor: 'Valor <', entre: 'Valor entre', igual: 'Valor =', texto: 'Texto contiene', duplicados: 'Duplicados', superiores: 'Superiores', inferiores: 'Inferiores', sobrePromedio: 'Sobre el promedio', bajoPromedio: 'Bajo el promedio', formula: 'Fórmula', barras: 'Barras de datos', escala: 'Escala de color', iconos: 'Iconos' };
    const lista = h('div');
    const dibujar = () => {
      lista.innerHTML = '';
      if (!hj.hj.condicionales.length) lista.appendChild(h('p', null, 'No hay reglas en esta hoja.'));
      hj.hj.condicionales.forEach((x, i) => {
        lista.appendChild(h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--linea)' } },
          h('span', null, h('b', null, nombres[x.tipo] || x.tipo), ' ', x.formula || (x.valor != null ? x.valor : ''), x.valor2 ? ' y ' + x.valor2 : '', h('span', { style: { color: 'var(--tinta-3)' } }, '  ·  Se aplica a ' + x.rango)),
          h('button', { class: 'btn chico fantasma', onclick: () => { hj.guardarDeshacer(); hj.hj.condicionales.splice(i, 1); hj.pintar(); dibujar(); hj.emitir('cambio', { tipo: 'condicional' }); } }, 'Eliminar')));
      });
    };
    dibujar();
    await LT.ui.modal({ titulo: 'Administrador de reglas de formato condicional', clase: 'ancho', cuerpo: lista, botones: [{ texto: 'Cerrar', valor: null, primario: true }] });
    hj.enfocar();
  };

  /* ------------------------------------------------------- fórmulas */
  C.definirNombre = async (hj) => {
    const nombre = entrada('', 'Por ejemplo: Meta');
    const ref = entrada(R.textoRango(hj.rango));
    const r = await LT.ui.modal({ titulo: 'Nombre nuevo', cuerpo: h('div', null, campo('Nombre', nombre), campo('Hace referencia a', ref), h('p', { style: { fontSize: '.86rem', color: 'var(--tinta-2)' } }, 'Atajo: selecciona la celda, escribe el nombre en el cuadro de nombres (a la izquierda de la barra de fórmulas) y pulsa Enter.')), botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: 'ok' }] });
    if (!r) return;
    const n = nombre.value.trim();
    if (!/^[A-Za-z_À-ɏ][A-Za-z0-9_.À-ɏ]*$/.test(n) || /^[A-Za-z]{1,3}\d+$/.test(n)) { LT.ui.aviso('Nombre no válido', 'El nombre debe empezar con letra, sin espacios, y no puede parecer una celda.'); return; }
    const rg = R.parseRango(ref.value.trim().replace(/^=/, '').replace(/\$/g, ''));
    if (!rg) { LT.ui.aviso('Referencia no válida', 'Escribe una referencia como B2 o B2:B10.'); return; }
    hj.definirNombre(n, rg, rg.hoja ? hj.indiceHoja(rg.hoja) : null);
  };
  C.administrarNombres = async (hj) => {
    const lista = h('div');
    const dibujar = () => {
      lista.innerHTML = '';
      const nombres = Object.entries(hj.libro.nombres);
      if (!nombres.length) lista.appendChild(h('p', null, 'Todavía no hay nombres definidos.'));
      for (const [n, ref] of nombres) {
        lista.appendChild(h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--linea)' } },
          h('span', null, h('b', null, n), '  ', h('code', null, ref)),
          h('button', { class: 'btn chico fantasma', onclick: () => { hj.guardarDeshacer(); delete hj.libro.nombres[n]; hj.reconstruirMotor(); hj.pintar(); dibujar(); hj.emitir('cambio', { tipo: 'nombre' }); } }, 'Eliminar')));
      }
    };
    dibujar();
    await LT.ui.modal({ titulo: 'Administrador de nombres', cuerpo: lista, botones: [{ texto: 'Nuevo…', valor: 'nuevo' }, { texto: 'Cerrar', valor: null, primario: true }] }).then((v) => { if (v === 'nuevo') C.definirNombre(hj); });
  };
  C.insertarFuncion = async (hj) => {
    const buscar = entrada('', 'Escribe una descripción o el nombre, por ejemplo: contar');
    const lista = h('select', { size: 10, style: { width: '100%' } });
    const detalle = h('div', { class: 'vista-previa' });
    const llenar = () => {
      const q = buscar.value.trim().toLowerCase();
      lista.innerHTML = '';
      Object.values(LT.FUNCIONES).filter((f) => !q || f.es.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q) || f.en.toLowerCase().includes(q)).forEach((f) => lista.appendChild(h('option', { value: f.es }, f.es)));
      if (lista.options.length) { lista.selectedIndex = 0; mostrar(); }
    };
    const mostrar = () => {
      const f = LT.FUNCIONES[lista.value];
      detalle.innerHTML = '';
      if (f) detalle.append(h('b', null, f.sintaxis), h('div', null, f.desc), h('div', { style: { color: 'var(--tinta-2)', marginTop: '4px' } }, 'Ejemplo: ', h('code', null, f.ejemplo.split(' ')[0]), ' ', f.ejemplo.split(' ').slice(1).join(' ')), h('div', { style: { color: 'var(--tinta-3)', marginTop: '4px' } }, 'En inglés: ' + f.en));
    };
    buscar.addEventListener('input', llenar);
    lista.addEventListener('change', mostrar);
    llenar();
    const r = await LT.ui.modal({ titulo: 'Insertar función', clase: 'ancho', cuerpo: h('div', null, campo('Buscar una función', buscar), h('label', null, 'Seleccionar una función'), lista, detalle), botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: () => lista.value }] });
    if (!r) return;
    if (hj.edicion) {
      const el = hj._superficie();
      const p = el.selectionStart;
      hj.edicion.texto = hj.edicion.texto.slice(0, p) + r + '(' + hj.edicion.texto.slice(p);
      el.value = hj.edicion.texto;
      el.focus();
      el.setSelectionRange(p + r.length + 1, p + r.length + 1);
      hj._editorDesdeTexto(hj.edicion.superficie);
    } else {
      hj.iniciarEdicion('editar', '=' + r + '(');
    }
  };

  /* ------------------------------------------------------- auditoría */
  C.precedentes = (hj) => hj.rastrearPrecedentes();
  C.quitarFlechas = (hj) => hj.quitarFlechas();
  C.evaluarFormula = async (hj) => {
    const raw = hj.hj.celdas.get(k(hj.sel.ar, hj.sel.ac)) || '';
    if (raw[0] !== '=') { LT.ui.toast('Selecciona una celda que contenga una fórmula.', 'aviso'); return; }
    const hid = hj.idHoja();
    const refs = R.referenciasEn(raw);
    const fmtValor = (v) => {
      if (LT.motor.esError(v)) return LT.motor.textoError(v);
      if (v == null || v === '') return '0';
      if (typeof v === 'string') return '"' + v + '"';
      if (typeof v === 'boolean') return v ? 'VERDADERO' : 'FALSO';
      return F.general(v);
    };
    let sustituida = '';
    let ult = 0;
    for (const ref of refs) {
      sustituida += raw.slice(ult, ref.inicio);
      const hIdx = ref.hoja ? hj.indiceHoja(ref.hoja) : hj.libro.activa;
      const sid = hIdx >= 0 ? hj.idHoja(hIdx) : hid;
      if (ref.r1 === ref.r2 && ref.c1 === ref.c2) sustituida += fmtValor(hj.hf.getCellValue({ sheet: sid, row: ref.r1, col: ref.c1 }));
      else {
        const vals = [];
        for (let r = ref.r1; r <= ref.r2 && vals.length < 7; r++) for (let c = ref.c1; c <= ref.c2 && vals.length < 7; c++) vals.push(fmtValor(hj.hf.getCellValue({ sheet: sid, row: r, col: c })));
        const total = (ref.r2 - ref.r1 + 1) * (ref.c2 - ref.c1 + 1);
        sustituida += '{' + vals.slice(0, 6).join(',') + (total > 6 ? ',…' : '') + '}';
      }
      ult = ref.fin;
    }
    sustituida += raw.slice(ult);
    const res = hj.textoCelda(hj.libro.activa, hj.sel.ar, hj.sel.ac);
    const pasos = [
      ['Fórmula en ' + R.dir(hj.sel.ar, hj.sel.ac), raw],
      ['1. Excel reemplaza cada referencia por su valor', sustituida],
      ['2. Resultado', res.texto + (res.error ? '  ← ' + explicarError(res.texto) : '')],
    ];
    const cont = h('div');
    let paso = 0;
    const dibujar = () => {
      cont.innerHTML = '';
      pasos.slice(0, paso + 1).forEach(([t, f]) => cont.appendChild(h('div', { style: { marginBottom: '10px' } }, h('div', { style: { fontSize: '.84rem', color: 'var(--tinta-2)' } }, t), h('div', { class: 'formula-grande', style: { fontSize: '1rem' } }, f))));
    };
    dibujar();
    await LT.ui.modal({
      titulo: 'Evaluar fórmula', clase: 'ancho', cuerpo: cont, enterAcepta: false,
      botones: [{ texto: 'Cerrar', valor: null }, { texto: 'Evaluar', primario: true, valor: 'sig' }],
      alAbrir: (caja, cerrar) => {
        const btn = caja.querySelector('.modal-pie .primario');
        btn.onclick = (e) => { e.stopPropagation(); paso = Math.min(paso + 1, pasos.length - 1); dibujar(); if (paso === pasos.length - 1) { btn.textContent = 'Reiniciar'; btn.onclick = (ev) => { ev.stopPropagation(); paso = 0; dibujar(); btn.textContent = 'Evaluar'; btn.onclick = null; cerrar('reiniciar'); C.evaluarFormula(hj); }; } };
      },
    });
  };
  function explicarError(t) {
    return {
      '#¡DIV/0!': 'se intenta dividir entre cero o entre una celda vacía',
      '#N/A': 'el valor buscado no existe en la lista',
      '#¿NOMBRE?': 'Excel no reconoce un nombre de función o de rango (¿está mal escrito?)',
      '#¡REF!': 'la fórmula apunta a una celda que ya no existe',
      '#¡VALOR!': 'se opera con un tipo de dato incorrecto (por ejemplo, texto en una suma)',
      '#¡NUM!': 'el número no es válido para esta operación',
      '#¡DESBORDAMIENTO!': 'el resultado necesita celdas libres para desbordarse',
    }[t] || '';
  }
  C.comprobarErrores = async (hj) => {
    const lista = [];
    const hIdx = hj.libro.activa;
    for (const [kk] of hj.hj.celdas) {
      const [r, c] = kk.split(',').map(Number);
      const t = hj.textoCelda(hIdx, r, c);
      if (t.error || t.circular) lista.push({ r, c, t: t.circular ? 'Referencia circular' : t.texto });
    }
    lista.sort((a, b) => a.r - b.r || a.c - b.c);
    const cuerpo = h('div', null, lista.length ? lista.map((x) => h('div', { style: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--linea)', gap: '10px' } },
      h('span', null, h('b', null, R.dir(x.r, x.c)), ' ', x.t, h('span', { style: { color: 'var(--tinta-3)', fontSize: '.85rem' } }, ' · ' + (explicarError(x.t) || 'la fórmula se incluye a sí misma'))),
      h('button', { class: 'btn chico', onclick: () => hj.seleccionar({ r1: x.r, c1: x.c, r2: x.r, c2: x.c }) }, 'Ir'))) : h('p', null, 'Se completó la comprobación de errores de toda la hoja: no hay errores.'));
    await LT.ui.modal({ titulo: 'Comprobación de errores', clase: 'ancho', cuerpo, botones: [{ texto: 'Cerrar', valor: null, primario: true }] });
  };

  /* ---------------------------------------------- análisis de hipótesis */
  C.buscarObjetivo = async (hj) => {
    const def = entrada(R.dir(hj.sel.ar, hj.sel.ac));
    const val = entrada('0');
    const cam = entrada('');
    const r = await LT.ui.modal({ titulo: 'Buscar objetivo', cuerpo: h('div', null, campo('Definir la celda:', def), campo('Con el valor:', val), campo('Para cambiar la celda:', cam)), botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: 'ok' }] });
    if (!r) return;
    const pd = R.parseRango(def.value.replace(/\$/g, '')), pc = R.parseRango(cam.value.replace(/\$/g, ''));
    const objetivo = parseFloat(String(val.value).replace(/,/g, ''));
    if (!pd || !pc || !isFinite(objetivo)) { LT.ui.aviso('Buscar objetivo', 'Revisa las referencias y el valor.'); return; }
    const hDef = pd.hoja ? hj.indiceHoja(pd.hoja) : hj.libro.activa;
    const hCam = pc.hoja ? hj.indiceHoja(pc.hoja) : hj.libro.activa;
    if ((hj.libro.hojas[hDef].celdas.get(k(pd.r1, pd.c1)) || '')[0] !== '=') { LT.ui.aviso('Buscar objetivo', 'La celda debe contener una fórmula.'); return; }
    if ((hj.libro.hojas[hCam].celdas.get(k(pc.r1, pc.c1)) || '')[0] === '=') { LT.ui.aviso('Buscar objetivo', 'La celda que se cambia debe contener un valor, no una fórmula.'); return; }
    const res = buscarObjetivo(hj, def.value.replace(/\$/g, ''), objetivo, cam.value.replace(/\$/g, ''));
    if (!res.ok) { LT.ui.aviso('Estado de la búsqueda de objetivo', 'Puede que la búsqueda de objetivo de la celda ' + def.value + ' no haya encontrado una solución.'); return; }
    hj.guardarDeshacer();
    const valor = Math.round(res.x * 1e8) / 1e8;
    hj._ponerRaw(hCam, pc.r1, pc.c1, String(valor));
    hj.pintar();
    const actual = hj.textoCelda(hDef, pd.r1, pd.c1).texto;
    const ok = await LT.ui.modal({ titulo: 'Estado de la búsqueda de objetivo', cuerpo: h('div', null, h('p', null, 'La búsqueda con la celda ' + def.value.toUpperCase() + ' ha encontrado una solución.'), h('p', null, 'Valor del objetivo: ' + objetivo), h('p', null, 'Valor actual: ' + actual), h('p', null, 'La celda ' + cam.value.toUpperCase() + ' cambió a ' + F.general(valor) + '.')), botones: [{ texto: 'Cancelar', valor: false }, { texto: 'Aceptar', primario: true, valor: true }] });
    if (!ok) hj.deshacer();
    else {
      hj.emitir('accion', { tipo: 'buscarObjetivo', definir: def.value, valor: objetivo, cambiar: cam.value, resultado: valor });
      hj.emitir('cambio', { tipo: 'buscarObjetivo' });
    }
  };
  C.escenarios = async (hj) => {
    const lista = h('select', { size: 6, style: { width: '100%' } });
    const info = h('div', { class: 'vista-previa' });
    const dibujar = () => {
      lista.innerHTML = '';
      hj.escenarios.forEach((e, i) => lista.appendChild(h('option', { value: i }, e.nombre)));
      if (!hj.escenarios.length) info.textContent = 'No se ha definido ningún escenario. Elija Agregar para crear uno.';
      else { lista.selectedIndex = Math.max(0, lista.selectedIndex); mostrarInfo(); }
    };
    const mostrarInfo = () => { const e = hj.escenarios[lista.value]; if (e) info.textContent = 'Celdas cambiantes: ' + e.celdas + ' · Valores: ' + e.valores.join(', '); };
    lista.addEventListener('change', mostrarInfo);
    dibujar();
    const accion = await LT.ui.modal({ titulo: 'Administrador de escenarios', cuerpo: h('div', null, h('label', null, 'Escenarios'), lista, info), enterAcepta: false, botones: [{ texto: 'Agregar…', valor: 'agregar' }, { texto: 'Eliminar', valor: 'eliminar' }, { texto: 'Resumen…', valor: 'resumen' }, { texto: 'Mostrar', valor: 'mostrar', primario: true }] });
    const i = +lista.value;
    if (accion === 'agregar') {
      const nombre = entrada('', 'Por ejemplo: Optimista');
      const celdas = entrada(R.textoRango(hj.rango));
      const r = await LT.ui.modal({ titulo: 'Agregar escenario', cuerpo: h('div', null, campo('Nombre del escenario', nombre), campo('Celdas cambiantes', celdas)), botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: 'ok' }] });
      if (!r || !nombre.value.trim()) return C.escenarios(hj);
      const rg = R.parseRango(celdas.value.replace(/\$/g, ''));
      if (!rg) return C.escenarios(hj);
      const lst = R.celdasDe(R.textoRango(rg));
      const campos = lst.map((x) => { const v = hj.hf.getCellValue({ sheet: hj.idHoja(), row: x.r, col: x.c }); return [x.dir, entrada(typeof v === 'number' ? F.general(v) : v)]; });
      const r2 = await LT.ui.modal({ titulo: 'Valores del escenario', cuerpo: h('div', null, h('p', null, 'Introduzca los valores para cada celda cambiante.'), campos.map(([d, inp]) => campo(d, inp))), botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: 'ok' }] });
      if (r2) {
        hj.guardarDeshacer();
        hj.escenarios.push({ nombre: nombre.value.trim(), hoja: hj.hj.nombre, celdas: R.textoRango(rg), valores: campos.map(([, inp]) => inp.value.trim()) });
        hj.emitir('accion', { tipo: 'escenario', nombre: nombre.value.trim() });
        hj.emitir('cambio', { tipo: 'escenarios' });
      }
      return C.escenarios(hj);
    }
    if (accion === 'eliminar' && hj.escenarios[i]) { hj.guardarDeshacer(); hj.escenarios.splice(i, 1); hj.emitir('cambio', { tipo: 'escenarios' }); return C.escenarios(hj); }
    if (accion === 'mostrar' && hj.escenarios[i]) {
      const e = hj.escenarios[i];
      const hIdx = hj.indiceHoja(e.hoja);
      hj.guardarDeshacer();
      R.celdasDe(e.celdas).forEach((x, j) => hj._ponerRaw(hIdx, x.r, x.c, e.valores[j]));
      hj.pintar();
      hj.emitir('accion', { tipo: 'mostrarEscenario', nombre: e.nombre });
      hj.emitir('cambio', { tipo: 'escenarios' });
      LT.ui.toast('Escenario «' + e.nombre + '» aplicado.', 'ok');
      return;
    }
    if (accion === 'resumen' && hj.escenarios.length) {
      const res = entrada(R.dir(hj.sel.ar, hj.sel.ac));
      const r = await LT.ui.modal({ titulo: 'Resumen del escenario', cuerpo: h('div', null, campo('Celdas de resultado', res)), botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: 'ok' }] });
      if (!r) return;
      const hBase = hj.libro.activa;
      const nombreBase = hj.hj.nombre;
      const resultados = R.celdasDe(res.value.replace(/\$/g, ''));
      const cambiantes = R.celdasDe(hj.escenarios[0].celdas);
      const columnas = [['Valores actuales:', null]].concat(hj.escenarios.map((e) => [e.nombre, e]));
      const tabla = [['Resumen del escenario'].concat(columnas.map((c) => c[0]))];
      const leer = (x) => hj.hf.getCellValue({ sheet: hj.idHoja(hBase), row: x.r, col: x.c });
      const sid = hj.idHoja(hBase);
      const originales = cambiantes.map((x) => hj.libro.hojas[hBase].celdas.get(k(x.r, x.c)) || '');
      const valoresPor = columnas.map(([, e]) => {
        if (e) R.celdasDe(e.celdas).forEach((x, j) => hj.hf.setCellContents({ sheet: sid, row: x.r, col: x.c }, [[LT.motor.contenidoMotor(e.valores[j])]]));
        const v = { cambiantes: cambiantes.map(leer), resultados: resultados.map(leer) };
        cambiantes.forEach((x, j) => hj.hf.setCellContents({ sheet: sid, row: x.r, col: x.c }, [[LT.motor.contenidoMotor(originales[j])]]));
        return v;
      });
      tabla.push(['Celdas cambiantes:']);
      cambiantes.forEach((x, j) => tabla.push([nombreBase + '!' + x.dir].concat(valoresPor.map((v) => v.cambiantes[j]))));
      tabla.push(['Celdas de resultado:']);
      resultados.forEach((x, j) => tabla.push([nombreBase + '!' + x.dir].concat(valoresPor.map((v) => v.resultados[j]))));
      let nombre = 'Resumen del escenario', n = 2;
      while (hj.indiceHoja(nombre) >= 0) nombre = 'Resumen del escenario ' + n++;
      hj.insertarHoja(nombre);
      const lista2 = [];
      tabla.forEach((fila, i2) => fila.forEach((v, j) => lista2.push({ r: i2, c: j, raw: v == null ? null : typeof v === 'number' ? String(v) : String(v) })));
      hj._ponerVarios(lista2);
      hj.hj.anchos[0] = 170;
      for (let c = 1; c < columnas.length + 1; c++) hj.hj.anchos[c] = 120;
      hj.aplicarEstilo({ b: true, bg: '#d9e1f2' }, { r1: 0, c1: 0, r2: 0, c2: columnas.length });
      hj.renderHoja();
      hj.emitir('accion', { tipo: 'resumenEscenario' });
    }
  };
  C.tablaDatos = async (hj) => {
    const rg = hj.rango;
    if (rg.r1 === rg.r2 || rg.c1 === rg.c2) { LT.ui.aviso('Tabla de datos', 'Selecciona primero todo el rango de la tabla: la fórmula, los valores de entrada y las celdas para los resultados.'); return; }
    const fila = entrada('', 'vacía si la tabla es de una variable en columna');
    const col = entrada('', 'por ejemplo $B$3');
    const r = await LT.ui.modal({ titulo: 'Tabla de datos', cuerpo: h('div', null, h('p', null, 'Rango: ', h('b', null, R.textoRango(rg))), campo('Celda de entrada (fila):', fila), campo('Celda de entrada (columna):', col), h('p', { style: { fontSize: '.85rem', color: 'var(--tinta-2)' } }, 'En Excel la tabla se rellena con la fórmula matricial {=TABLA(fila; columna)}; aquí se escriben los resultados.')), botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: 'ok' }] });
    if (!r) return;
    const pf = fila.value.trim() ? R.parseRango(fila.value.replace(/\$/g, '')) : null;
    const pcol = col.value.trim() ? R.parseRango(col.value.replace(/\$/g, '')) : null;
    if (!pf && !pcol) { LT.ui.aviso('Tabla de datos', 'Indica al menos una celda de entrada.'); return; }
    const sid = hj.idHoja();
    const hjo = hj.hj;
    const num = (r2, c2) => { const v = hj.hf.getCellValue({ sheet: sid, row: r2, col: c2 }); return v; };
    const fijar = (p, v) => hj.hf.setCellContents({ sheet: sid, row: p.r1, col: p.c1 }, [[v]]);
    const restaurar = (p) => p && hj.hf.setCellContents({ sheet: sid, row: p.r1, col: p.c1 }, [[LT.motor.contenidoMotor(hjo.celdas.get(k(p.r1, p.c1)))]]);
    const lista = [];
    if (pf && pcol) {
      // dos variables: fórmula en la esquina, valores de fila arriba y de columna a la izquierda
      const formula = hjo.celdas.get(k(rg.r1, rg.c1));
      if (!formula || formula[0] !== '=') { LT.ui.aviso('Tabla de datos', 'En una tabla de dos variables la esquina superior izquierda debe tener la fórmula.'); return; }
      for (let rr = rg.r1 + 1; rr <= rg.r2; rr++) for (let cc = rg.c1 + 1; cc <= rg.c2; cc++) {
        fijar(pf, num(rg.r1, cc)); fijar(pcol, num(rr, rg.c1));
        const v = hj.hf.getCellValue({ sheet: sid, row: rg.r1, col: rg.c1 });
        lista.push({ r: rr, c: cc, raw: typeof v === 'number' ? String(Math.round(v * 1e8) / 1e8) : LT.motor.esError(v) ? LT.motor.textoError(v) : String(v) });
      }
    } else {
      const p = pcol || pf;
      if (pcol) {
        // una variable en columna: valores en la primera columna, fórmulas en la primera fila
        for (let cc = rg.c1 + 1; cc <= rg.c2; cc++) {
          for (let rr = rg.r1 + 1; rr <= rg.r2; rr++) {
            fijar(p, num(rr, rg.c1));
            const v = hj.hf.getCellValue({ sheet: sid, row: rg.r1, col: cc });
            lista.push({ r: rr, c: cc, raw: typeof v === 'number' ? String(Math.round(v * 1e8) / 1e8) : String(v) });
          }
        }
      } else {
        for (let rr = rg.r1 + 1; rr <= rg.r2; rr++) {
          for (let cc = rg.c1 + 1; cc <= rg.c2; cc++) {
            fijar(p, num(rg.r1, cc));
            const v = hj.hf.getCellValue({ sheet: sid, row: rr, col: rg.c1 });
            lista.push({ r: rr, c: cc, raw: typeof v === 'number' ? String(Math.round(v * 1e8) / 1e8) : String(v) });
          }
        }
      }
    }
    restaurar(pf); restaurar(pcol);
    hj.guardarDeshacer();
    hj._ponerVarios(lista);
    hjo.tablasDatos.push({ rango: R.textoRango(rg), fila: fila.value.trim(), columna: col.value.trim() });
    hj.pintar();
    hj.emitir('accion', { tipo: 'tablaDatos', rango: R.textoRango(rg) });
    hj.emitir('cambio', { tipo: 'tablaDatos' });
  };

  /* ---------------------------------------------------------- revisar */
  C.comentario = async (hj) => {
    const kk = k(hj.sel.ar, hj.sel.ac);
    const hjo = hj.hj;
    const existente = hjo.comentarios.get(kk);
    const texto = h('textarea', { rows: 3, placeholder: existente ? 'Responder…' : 'Escribe tu comentario. Usa @ para mencionar a alguien.' });
    const hilo = existente ? h('div', null, existente.hilo.map((m) => h('div', { style: { padding: '6px 0', borderBottom: '1px solid var(--linea)' } }, h('b', { style: { color: '#7b3f9e' } }, m.autor), h('div', null, m.texto))), existente.resuelto ? h('p', { style: { color: 'var(--verde)' } }, '✓ Conversación resuelta') : null) : null;
    const botones = [{ texto: 'Cancelar', valor: null }];
    if (existente) {
      botones.unshift({ texto: 'Eliminar conversación', valor: 'eliminar' });
      botones.push({ texto: existente.resuelto ? 'Volver a abrir' : 'Resolver conversación', valor: 'resolver' });
    }
    botones.push({ texto: existente ? 'Responder' : 'Publicar', valor: 'publicar', primario: true });
    const r = await LT.ui.modal({ titulo: (existente ? 'Comentario en ' : 'Nuevo comentario en ') + R.dir(hj.sel.ar, hj.sel.ac), cuerpo: h('div', null, hilo, texto), enterAcepta: false, botones });
    if (!r) return;
    hj.guardarDeshacer();
    if (r === 'eliminar') hjo.comentarios.delete(kk);
    else if (r === 'resolver') existente.resuelto = !existente.resuelto;
    else if (texto.value.trim()) {
      if (existente) { existente.hilo.push({ autor: hj.opts.autor, texto: texto.value.trim() }); existente.resuelto = false; }
      else hjo.comentarios.set(kk, { hilo: [{ autor: hj.opts.autor, texto: texto.value.trim() }], resuelto: false });
    }
    hj.pintar();
    hj.emitir('accion', { tipo: 'comentario', celda: R.dir(hj.sel.ar, hj.sel.ac), operacion: r });
    hj.emitir('cambio', { tipo: 'comentarios' });
  };
  C.nota = async (hj) => {
    const kk = k(hj.sel.ar, hj.sel.ac);
    const texto = h('textarea', { rows: 4 }, hj.hj.notas.get(kk) || '');
    const r = await LT.ui.modal({ titulo: 'Nota en ' + R.dir(hj.sel.ar, hj.sel.ac), cuerpo: h('div', null, h('p', { style: { fontSize: '.86rem', color: 'var(--tinta-2)' } }, 'Las notas son anotaciones simples (sin respuestas). Para conversar con otras personas usa comentarios.'), texto), enterAcepta: false, botones: [{ texto: 'Eliminar nota', valor: 'eliminar' }, { texto: 'Cancelar', valor: null }, { texto: 'Aceptar', valor: 'ok', primario: true }] });
    if (!r) return;
    hj.guardarDeshacer();
    if (r === 'eliminar' || !texto.value.trim()) hj.hj.notas.delete(kk); else hj.hj.notas.set(kk, texto.value.trim());
    hj.pintar();
    hj.emitir('cambio', { tipo: 'notas' });
  };
  C.protegerHoja = async (hj) => {
    const hjo = hj.hj;
    if (hjo.protegida) {
      hj.guardarDeshacer(); hjo.protegida = false; hj.pintar();
      LT.ui.toast('Hoja desprotegida.');
      hj.emitir('accion', { tipo: 'proteger', activo: false }); hj.emitir('cambio', { tipo: 'proteccion' });
      hj._refrescarHerr();
      return;
    }
    const r = await LT.ui.modal({ titulo: 'Proteger hoja', cuerpo: h('div', null, h('p', null, 'Al proteger la hoja, solo se podrán editar las celdas que hayas desbloqueado (Inicio › Formato › Bloquear celda, o Formato de celdas › Proteger).'), h('label', null, 'Contraseña para desproteger la hoja (opcional)'), h('input', { type: 'text', placeholder: 'En el simulador no se guarda' }), h('label', { class: 'en-linea' }, h('input', { type: 'checkbox', checked: true, disabled: true }), 'Seleccionar celdas desbloqueadas')), botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: 'ok' }] });
    if (!r) return;
    hj.guardarDeshacer();
    hjo.protegida = true;
    hj.pintar();
    LT.ui.toast('Hoja protegida.', 'ok');
    hj.emitir('accion', { tipo: 'proteger', activo: true });
    hj.emitir('cambio', { tipo: 'proteccion' });
    hj._refrescarHerr();
  };

  /* ------------------------------------------------------------- vista */
  C.inmovilizar = (hj, ev) => {
    hj._menuEn(ev, [
      { texto: 'Inmovilizar paneles (arriba y a la izquierda de la celda activa)', accion: () => hj.inmovilizar(hj.sel.ar, hj.sel.ac) },
      { texto: 'Inmovilizar fila superior', accion: () => hj.inmovilizar(1, 0) },
      { texto: 'Inmovilizar primera columna', accion: () => hj.inmovilizar(0, 1) },
      { texto: 'Movilizar paneles', accion: () => hj.inmovilizar(0, 0) },
    ]);
  };

  /* ---------------------------------------------------------- insertar */
  C.imagen = async (hj) => {
    const cuerpo = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: '10px' } });
    let elegida = null;
    const r = LT.ui.modal({ titulo: 'Insertar imagen', cuerpo, botones: [{ texto: 'Cancelar', valor: null }] });
    for (const im of LT.GALERIA.imagenes) {
      cuerpo.appendChild(h('button', { class: 'btn', style: { flexDirection: 'column', height: 'auto', padding: '8px' }, onclick: () => { elegida = im; document.querySelector('.modal-fondo .modal-x').click(); } }, h('img', { src: im.src, alt: '', style: { width: '90px', height: '70px', objectFit: 'contain' } }), im.nombre));
    }
    await r;
    if (elegida) hj.agregarObjeto({ tipo: 'imagen', fuente: elegida.src, nombre: elegida.nombre, galeria: elegida.id, w: elegida.ancho, h: elegida.alto, alt: '' });
  };
  C.icono = async (hj) => {
    const cuerpo = h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(84px,1fr))', gap: '8px' } });
    let elegido = null;
    const r = LT.ui.modal({ titulo: 'Insertar iconos', cuerpo, botones: [{ texto: 'Cancelar', valor: null }] });
    for (const ic of LT.GALERIA.iconos) {
      cuerpo.appendChild(h('button', { class: 'btn', style: { flexDirection: 'column', height: 'auto', padding: '8px', fontSize: '.75rem' }, onclick: () => { elegido = ic; document.querySelector('.modal-fondo .modal-x').click(); } }, h('img', { src: ic.src, alt: '', style: { width: '34px', height: '34px' } }), ic.nombre));
    }
    await r;
    if (elegido) hj.agregarObjeto({ tipo: 'icono', fuente: elegido.src, nombre: elegido.nombre, galeria: elegido.id, w: 48, h: 48, alt: '' });
  };
  C.forma = (hj, ev) => {
    hj._menuEn(ev, [
      { texto: 'Rectángulo', accion: () => hj.agregarObjeto({ tipo: 'forma', forma: 'rectangulo', w: 160, h: 50, relleno: '#8a5a3c' }) },
      { texto: 'Rectángulo redondeado', accion: () => hj.agregarObjeto({ tipo: 'forma', forma: 'redondeado', w: 160, h: 50, relleno: '#1e7145' }) },
      { texto: 'Elipse', accion: () => hj.agregarObjeto({ tipo: 'forma', forma: 'elipse', w: 90, h: 60, relleno: '#c9a27e' }) },
      { texto: 'Cinta', accion: () => hj.agregarObjeto({ tipo: 'forma', forma: 'cinta', w: 220, h: 46, relleno: '#5b3a29' }) },
    ]);
  };
  C.cuadroTexto = async (hj) => {
    const o = hj.agregarObjeto({ tipo: 'texto', texto: '', w: 200, h: 44 });
    await C.editarTextoObjeto(hj, o);
  };
  C.editarTextoObjeto = async (hj, o) => {
    const t = h('textarea', { rows: 3 }, o.texto || '');
    const r = await LT.ui.modal({ titulo: 'Texto', cuerpo: t, enterAcepta: false, botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: 'ok' }] });
    if (!r) return;
    o.texto = t.value;
    hj._pintarObjetos();
    hj.emitir('cambio', { tipo: 'objetos' });
  };
  C.textoAlternativo = async (hj, o) => {
    const t = h('textarea', { rows: 3, placeholder: 'Describe la imagen para personas que usan lector de pantalla' }, o.alt || '');
    const r = await LT.ui.modal({ titulo: 'Texto alternativo', cuerpo: h('div', null, h('p', { style: { fontSize: '.86rem', color: 'var(--tinta-2)' } }, '¿Cómo describirías este objeto y su contexto a alguien que no puede verlo? (1 o 2 oraciones)'), t), enterAcepta: false, botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: 'ok' }] });
    if (!r) return;
    o.alt = t.value.trim();
    hj._pintarObjetos();
    hj.emitir('cambio', { tipo: 'objetos' });
  };
  C.rellenoForma = async (hj, o) => {
    const cuerpo = h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } });
    let elegido = null;
    const p = LT.ui.modal({ titulo: 'Relleno de forma', cuerpo, botones: [{ texto: 'Cancelar', valor: null }] });
    for (const c of ['#5b3a29', '#8a5a3c', '#c9a27e', '#1e7145', '#2463a6', '#c0392b', '#f1c40f', '#444444']) cuerpo.appendChild(h('button', { style: { width: '34px', height: '34px', background: c, border: '1px solid #999', borderRadius: '6px', cursor: 'pointer' }, onclick: () => { elegido = c; document.querySelector('.modal-fondo .modal-x').click(); } }));
    await p;
    if (elegido) { o.relleno = elegido; hj._pintarObjetos(); hj.emitir('cambio', { tipo: 'objetos' }); }
  };
  C.asignarMacro = async (hj, o) => {
    const nombres = Object.keys(hj.macros || {});
    if (!nombres.length) { LT.ui.aviso('Asignar macro', 'Todavía no hay macros grabadas en este libro.'); return; }
    const s = seleccionDe(nombres, o.macro || nombres[0]);
    const r = await LT.ui.modal({ titulo: 'Asignar macro', cuerpo: h('div', null, campo('Nombre de la macro', s)), botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: () => s.value }] });
    if (!r) return;
    o.macro = r;
    hj._objSel = null;
    hj._pintarObjetos();
    LT.ui.toast('Macro «' + r + '» asignada. Haz clic en el objeto para ejecutarla.', 'ok');
    hj.emitir('accion', { tipo: 'asignarMacro', macro: r });
    hj.emitir('cambio', { tipo: 'objetos' });
  };
  C.vinculo = async (hj) => {
    const kk = k(hj.sel.ar, hj.sel.ac);
    const est = hj.hj.estilos.get(kk) || {};
    const v = hj.hf.getCellValue({ sheet: hj.idHoja(), row: hj.sel.ar, col: hj.sel.ac });
    const texto = entrada(v == null ? '' : String(v));
    const dir = entrada(est.link || 'https://', 'https://');
    const r = await LT.ui.modal({ titulo: 'Insertar hipervínculo', cuerpo: h('div', null, campo('Texto que se mostrará', texto), campo('Dirección', dir)), botones: [{ texto: 'Quitar vínculo', valor: 'quitar' }, { texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: 'ok' }] });
    if (!r) return;
    hj.guardarDeshacer();
    if (r === 'quitar') hj._estiloModelo(hj.hj, hj.sel.ar, hj.sel.ac, { link: null });
    else {
      if (!/^(https?:\/\/|mailto:)/i.test(dir.value.trim())) { LT.ui.aviso('Dirección no válida', 'Escribe una dirección completa, por ejemplo https://lataza.mx/menu'); return; }
      hj._ponerRaw(hj.libro.activa, hj.sel.ar, hj.sel.ac, texto.value || dir.value);
      hj._estiloModelo(hj.hj, hj.sel.ar, hj.sel.ac, { link: dir.value.trim() });
    }
    hj.pintar();
    hj.emitir('accion', { tipo: 'vinculo', celda: R.dir(hj.sel.ar, hj.sel.ac) });
    hj.emitir('cambio', { tipo: 'vinculo' });
  };

  /* ------------------------------------------------------------ hojas */
  C.renombrarHoja = async (hj, i) => {
    const t = entrada(hj.libro.hojas[i].nombre);
    const r = await LT.ui.modal({ titulo: 'Cambiar nombre de la hoja', cuerpo: campo('Nombre', t), botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: () => t.value }] });
    if (r) hj.renombrarHoja(i, r);
  };
  C.colorPestana = async (hj, i, colores) => {
    const cuerpo = h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' } });
    let elegido;
    const p = LT.ui.modal({ titulo: 'Color de pestaña', cuerpo, botones: [{ texto: 'Cancelar', valor: null }] });
    for (const c of colores) cuerpo.appendChild(h('button', { title: c || 'Sin color', style: { width: '38px', height: '38px', background: c || '#fff', border: '1px solid #999', borderRadius: '6px', cursor: 'pointer' }, onclick: () => { elegido = c; document.querySelector('.modal-fondo .modal-x').click(); } }, c ? '' : '∅'));
    await p;
    if (elegido !== undefined) { hj.colorHoja(i, elegido); hj.emitir('accion', { tipo: 'colorHoja', hoja: hj.libro.hojas[i].nombre, color: elegido }); }
  };
  C.mostrarHoja = async (hj) => {
    const ocultas = hj.libro.hojas.map((x, i) => [i, x]).filter(([, x]) => x.oculta);
    const s = seleccionDe(ocultas.map(([i, x]) => [i, x.nombre]), ocultas[0] && ocultas[0][0]);
    const r = await LT.ui.modal({ titulo: 'Mostrar', cuerpo: campo('Mostrar hoja:', s), botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: () => s.value }] });
    if (r != null) hj.ocultarHoja(+r, false);
  };
  C.insertarHoja = (hj) => hj.insertarHoja();
  C.eliminarHoja = async (hj, i) => {
    const ok = await LT.ui.modal({ titulo: 'Eliminar hoja', cuerpo: h('p', null, 'Se eliminará la hoja «' + hj.libro.hojas[i].nombre + '». Las fórmulas que la usaban mostrarán #¡REF!.'), botones: [{ texto: 'Cancelar', valor: false }, { texto: 'Eliminar', primario: true, valor: true }] });
    if (ok) hj.eliminarHoja(i);
  };
  C.mostrarFormulas = (hj) => { hj.mostrarFormulas = !hj.mostrarFormulas; hj.pintar(); hj._refrescarHerr(); hj.emitir('accion', { tipo: 'mostrarFormulas', activo: hj.mostrarFormulas }); };

  /* ------------------------------------------- formulario de captura */
  C.formulario = async (hj) => {
    const hjo = hj.hj;
    const hIdx = hj.libro.activa;
    const region = regionActual(hj, hj.sel.ar, hj.sel.ac);
    if (region.r1 === region.r2) { LT.ui.aviso('Formulario', 'Selecciona una celda dentro de una lista que tenga encabezados en la primera fila.'); return; }
    const hid = hj.idHoja();
    const cols = [];
    for (let c = region.c1; c <= region.c2; c++) cols.push(c);
    const enc = cols.map((c) => String(hj.hf.getCellValue({ sheet: hid, row: region.r1, col: c }) || R.colLetra(c)));
    let ultima = region.r2;
    let actual = null; // null = registro nuevo
    const esFormula = (c) => String(hjo.celdas.get(k(ultima, c)) || '')[0] === '=';
    const estado = h('div', { style: { fontSize: '.85rem', color: 'var(--tinta-2)', marginBottom: '6px' } });
    const msj = h('div', { class: 'retro' });
    const campos = cols.map((c, i) => {
      const val = hj._validacionDe(ultima, c);
      let ctl;
      if (val && val.tipo === 'lista') { ctl = h('select', null, h('option', { value: '' }, '—'), hj.valoresLista(val).map((v) => h('option', { value: v }, v))); }
      else ctl = h('input', { type: 'text' });
      return { c, ctl, etiqueta: h('label', null, enc[i]) };
    });
    const llenar = () => {
      msj.textContent = '';
      campos.forEach(({ c, ctl }) => {
        if (esFormula(c)) { ctl.disabled = true; ctl.value = actual == null ? '(se calcula con fórmula)' : hj.textoCelda(hIdx, actual, c).texto; return; }
        ctl.disabled = actual != null;
        ctl.value = actual == null ? '' : hj.textoCelda(hIdx, actual, c).texto;
      });
      estado.textContent = actual == null ? 'Registro nuevo (escribe los datos y pulsa «Agregar»)' : 'Registro ' + (actual - region.r1) + ' de ' + (ultima - region.r1);
    };
    const agregar = () => {
      const r = ultima + 1;
      const lista = [];
      for (const { c, ctl } of campos) {
        if (esFormula(c)) { lista.push({ r, c, raw: R.desplazarFormula(hjo.celdas.get(k(ultima, c)), 1, 0) }); continue; }
        const v = ctl.value.trim();
        const val = hj._validacionDe(r, c) || hj._validacionDe(ultima, c);
        if (v && val && !hj._cumpleValidacion(val, v, hIdx)) { msj.innerHTML = ''; msj.appendChild(h('div', { class: 'aviso-caja error' }, '«' + v + '» no es válido para «' + enc[cols.indexOf(c)] + '». ' + (val.mensajeError || 'Revisa la validación de datos de esa columna.'))); return; }
        lista.push({ r, c, raw: v || null });
      }
      if (lista.every((x) => x.raw == null || String(x.raw)[0] === '=')) { msj.textContent = 'Escribe al menos un dato.'; return; }
      hj.guardarDeshacer();
      for (const { c } of campos) { const e = hjo.estilos.get(k(ultima, c)); if (e) hjo.estilos.set(k(r, c), JSON.parse(JSON.stringify(e))); }
      hj._ponerVarios(lista);
      ultima = r;
      hj.pintar();
      hj.emitir('accion', { tipo: 'formulario', fila: r + 1 });
      hj.emitir('cambio', { tipo: 'formulario' });
      actual = null;
      llenar();
      msj.appendChild(h('div', { class: 'aviso-caja ok' }, '✓ Registro agregado en la fila ' + (r + 1) + '.'));
    };
    const cuerpo = h('div', null, estado, h('div', { class: 'fila2' }, campos.map(({ ctl, etiqueta }) => h('div', null, etiqueta, ctl))),
      h('div', { class: 'grupo-btn', style: { marginTop: '12px' } },
        h('button', { class: 'btn chico', onclick: () => { actual = null; llenar(); } }, 'Nuevo'),
        h('button', { class: 'btn chico', onclick: () => { actual = actual == null ? ultima : Math.max(region.r1 + 1, actual - 1); llenar(); } }, 'Buscar anterior'),
        h('button', { class: 'btn chico', onclick: () => { if (actual == null) return; actual = actual + 1 > ultima ? null : actual + 1; llenar(); } }, 'Buscar siguiente'),
        h('button', { class: 'btn chico primario', onclick: () => { if (actual != null) { actual = null; llenar(); return; } agregar(); } }, 'Agregar')),
      msj);
    llenar();
    await LT.ui.modal({ titulo: hjo.nombre, cuerpo, enterAcepta: false, botones: [{ texto: 'Cerrar', valor: null, primario: true }] });
    hj.enfocar();
  };

  /* ============================================================ BARRA */
  const GRUPOS = {
    portapapeles: [
      { ic: 'deshacer', t: 'Deshacer (Ctrl+Z)', c: 'deshacer' },
      { ic: 'rehacer', t: 'Rehacer (Ctrl+Y)', c: 'rehacer' },
      { ic: 'cortar', t: 'Cortar (Ctrl+X)', c: 'cortar' },
      { ic: 'copiar', t: 'Copiar (Ctrl+C)', c: 'copiar' },
      { ic: 'pegar', t: 'Pegar (Ctrl+V)', c: 'pegar' },
      { ic: 'pegar', txt: 'Especial', t: 'Pegado especial (Ctrl+Alt+V)', c: 'pegadoEspecial' },
      { ic: 'brocha', t: 'Copiar formato', c: 'pincel' },
    ],
    fuente: [
      { letra: 'N', t: 'Negrita (Ctrl+N en Excel)', c: 'negrita', estado: 'b' },
      { letra: 'K', t: 'Cursiva (Ctrl+K)', c: 'cursiva', estado: 'i', estilo: 'font-style:italic' },
      { letra: 'S', t: 'Subrayado (Ctrl+S)', c: 'subrayado', estado: 'u', estilo: 'text-decoration:underline' },
      { txt: 'A+', t: 'Aumentar tamaño de fuente', c: 'tamano', args: [1] },
      { txt: 'A−', t: 'Disminuir tamaño de fuente', c: 'tamano', args: [-1] },
      { ic: 'relleno', t: 'Color de relleno', menu: 'relleno' },
      { ic: 'fuente', t: 'Color de fuente', menu: 'colorFuente' },
      { ic: 'bordes', t: 'Bordes', menu: 'bordes' },
    ],
    alineacion: [
      { ic: 'alIzq', t: 'Alinear a la izquierda', c: 'alinear', args: ['left'] },
      { ic: 'alCen', t: 'Centrar', c: 'alinear', args: ['center'] },
      { ic: 'alDer', t: 'Alinear a la derecha', c: 'alinear', args: ['right'] },
      { ic: 'ajustar', t: 'Ajustar texto', c: 'ajustarTexto', estado: 'wrap' },
    ],
    numero: [
      { select: 'formato' },
      { txt: '$', t: 'Formato de número de contabilidad (moneda)', c: 'formato', args: ['$#,##0.00'] },
      { txt: '%', t: 'Estilo porcentual', c: 'formato', args: ['0%'] },
      { txt: '000', t: 'Estilo millares', c: 'formato', args: ['#,##0.00'] },
      { ic: 'decMas', t: 'Aumentar decimales', c: 'decimales', args: [1] },
      { ic: 'decMenos', t: 'Disminuir decimales', c: 'decimales', args: [-1] },
      { txt: 'Más…', t: 'Formato de celdas (Ctrl+1)', c: 'formatoCeldas' },
    ],
    estilos: [
      { ic: 'condicional', txt: 'Formato condicional', t: 'Formato condicional', c: 'condicional', conEvento: true },
      { ic: 'estilos', txt: 'Estilos de celda', t: 'Estilos de celda', menu: 'estilosCelda' },
    ],
    celdas: [
      { ic: 'insertarFila', txt: 'Insertar', t: 'Insertar filas o columnas', menu: 'insertarCeldas' },
      { ic: 'eliminar', txt: 'Eliminar', t: 'Eliminar filas o columnas', menu: 'eliminarCeldas' },
      { ic: 'proteger', txt: 'Bloquear', t: 'Bloquear o desbloquear celdas (tiene efecto al proteger la hoja)', c: 'bloquear', estado: 'bloqueo' },
    ],
    edicion: [
      { ic: 'autosuma', txt: 'Autosuma', t: 'Autosuma (Alt+=)', c: 'autosuma' },
      { txt: '⇩ Rellenar', t: 'Rellenar hacia abajo (Ctrl+J)', c: 'rellenarAbajo' },
      { ic: 'buscar', t: 'Buscar (Ctrl+B)', c: 'buscar' },
      { ic: 'reemplazar', t: 'Reemplazar (Ctrl+L)', c: 'reemplazar' },
    ],
    datos: [
      { ic: 'ordenarAZ', t: 'Ordenar de A a Z', c: 'ordenarAZ' },
      { ic: 'ordenarZA', t: 'Ordenar de Z a A', c: 'ordenarZA' },
      { ic: 'ordenar', txt: 'Ordenar', t: 'Ordenar por varios niveles', c: 'ordenar' },
      { ic: 'filtro', txt: 'Filtro', t: 'Filtro', c: 'filtro', estado: 'filtro' },
      { ic: 'textoColumnas', txt: 'Texto en columnas', t: 'Texto en columnas', c: 'textoEnColumnas' },
      { ic: 'relampago', txt: 'Relleno rápido', t: 'Relleno rápido', c: 'rellenoRapido' },
      { ic: 'duplicados', txt: 'Quitar duplicados', t: 'Quitar duplicados', c: 'quitarDuplicados' },
      { ic: 'validacion', txt: 'Validación', t: 'Validación de datos', c: 'validacion' },
    ],
    formulas: [
      { txt: 'fx', t: 'Insertar función', c: 'insertarFuncion' },
      { ic: 'nombre', txt: 'Asignar nombre', t: 'Asignar nombre a la selección', c: 'definirNombre' },
      { txt: 'Nombres', t: 'Administrador de nombres', c: 'administrarNombres' },
      { ic: 'mostrarFormulas', txt: 'Mostrar fórmulas', t: 'Mostrar fórmulas (Ctrl+`)', c: 'mostrarFormulas', estado: 'formulas' },
    ],
    auditoria: [
      { ic: 'precedentes', txt: 'Rastrear precedentes', t: 'Rastrear precedentes', c: 'precedentes' },
      { ic: 'sinFlechas', txt: 'Quitar flechas', t: 'Quitar flechas', c: 'quitarFlechas' },
      { ic: 'evaluar', txt: 'Evaluar fórmula', t: 'Evaluar fórmula', c: 'evaluarFormula' },
      { ic: 'check', txt: 'Comprobar errores', t: 'Comprobación de errores', c: 'comprobarErrores' },
      { ic: 'mostrarFormulas', txt: 'Mostrar fórmulas', t: 'Mostrar fórmulas (Ctrl+`)', c: 'mostrarFormulas', estado: 'formulas' },
    ],
    analisis: [
      { ic: 'objetivo', txt: 'Buscar objetivo', t: 'Análisis de hipótesis › Buscar objetivo', c: 'buscarObjetivo' },
      { ic: 'escenarios', txt: 'Escenarios', t: 'Análisis de hipótesis › Administrador de escenarios', c: 'escenarios' },
      { ic: 'tablaDatos', txt: 'Tabla de datos', t: 'Análisis de hipótesis › Tabla de datos', c: 'tablaDatos' },
    ],
    revisar: [
      { ic: 'comentario', txt: 'Comentario', t: 'Nuevo comentario / responder', c: 'comentario' },
      { ic: 'nota', txt: 'Nota', t: 'Nueva nota', c: 'nota' },
      { ic: 'proteger', txt: 'Proteger hoja', t: 'Proteger o desproteger la hoja', c: 'protegerHoja', estado: 'protegida' },
    ],
    vista: [
      { ic: 'inmovilizar', txt: 'Inmovilizar', t: 'Inmovilizar paneles', c: 'inmovilizar', conEvento: true },
    ],
    captura: [
      { ic: 'tablaDatos', txt: 'Formulario', t: 'Formulario de datos: captura o consulta registros de la lista', c: 'formulario' },
      { ic: 'validacion', txt: 'Validación', t: 'Validación de datos', c: 'validacion' },
    ],
    insertar: [
      { ic: 'imagen', txt: 'Imágenes', t: 'Insertar imagen', c: 'imagen' },
      { ic: 'forma', txt: 'Formas', t: 'Insertar forma', c: 'forma', conEvento: true },
      { ic: 'icono', txt: 'Iconos', t: 'Insertar icono', c: 'icono' },
      { ic: 'cuadroTexto', txt: 'Cuadro de texto', t: 'Insertar cuadro de texto', c: 'cuadroTexto' },
      { ic: 'vinculo', txt: 'Vínculo', t: 'Insertar hipervínculo en la celda activa', c: 'vinculo' },
    ],
  };
  const MENUS = {
    relleno: (hj) => RELLENOS.map((c) => ({ texto: c ? '■ ' + c : 'Sin relleno', accion: () => C.relleno(hj, c), color: c })),
    colorFuente: (hj) => FUENTES.map((c) => ({ texto: '■ ' + c, accion: () => C.colorFuente(hj, c), color: c })),
    bordes: (hj) => [
      { texto: 'Todos los bordes', accion: () => C.bordes(hj, 'todos') },
      { texto: 'Bordes externos', accion: () => C.bordes(hj, 'contorno') },
      { texto: 'Borde de cuadro grueso', accion: () => C.bordes(hj, 'contornoGrueso') },
      { texto: 'Borde inferior', accion: () => C.bordes(hj, 'inferior') },
      { texto: 'Borde doble inferior', accion: () => C.bordes(hj, 'inferiorDoble') },
      { texto: 'Sin borde', accion: () => C.bordes(hj, 'ninguno') },
    ],
    estilosCelda: (hj) => Object.keys(ESTILOS_CELDA).map((n) => ({ texto: n, accion: () => C.estiloCelda(hj, n) })),
    insertarCeldas: (hj) => [
      { texto: 'Insertar filas de hoja', accion: () => hj.insertarFilas(hj.rango.r1, hj.rango.r2 - hj.rango.r1 + 1) },
      { texto: 'Insertar columnas de hoja', accion: () => hj.insertarColumnas(hj.rango.c1, hj.rango.c2 - hj.rango.c1 + 1) },
      hj.opts.editarHojas ? { texto: 'Insertar hoja', accion: () => hj.insertarHoja() } : null,
    ],
    eliminarCeldas: (hj) => [
      { texto: 'Eliminar filas de hoja', accion: () => hj.eliminarFilas(hj.rango.r1, hj.rango.r2 - hj.rango.r1 + 1) },
      { texto: 'Eliminar columnas de hoja', accion: () => hj.eliminarColumnas(hj.rango.c1, hj.rango.c2 - hj.rango.c1 + 1) },
    ],
  };

  function montar(hj) {
    const herr = hj.opts.herramientas || [];
    hj._botonesEstado = [];
    hj._refrescarHerr = () => refrescar(hj);
    const barra = hj.herr;
    barra.innerHTML = '';
    for (const g of herr) {
      const def = GRUPOS[g];
      if (!def) continue;
      const grupo = h('div', { class: 'herr-grupo', role: 'group', 'aria-label': g });
      for (const b of def) {
        if (b.select === 'formato') {
          const s = h('select', { class: 'herr-sel', title: 'Formato de número', 'aria-label': 'Formato de número' });
          s.appendChild(h('option', { value: '' }, 'Formato…'));
          for (const [n, cod] of Object.entries(F.PRESETS)) s.appendChild(h('option', { value: cod }, n));
          s.addEventListener('change', () => { if (s.value) hj.comando('formato', s.value); s.value = ''; hj.enfocar(); });
          grupo.appendChild(s);
          continue;
        }
        const btn = h('button', { class: 'herr-btn' + (b.txt && b.ic ? ' texto' : ''), type: 'button', title: b.t, 'aria-label': b.t });
        if (b.ic) btn.appendChild(LT.icono(b.ic, 17));
        if (b.letra) btn.appendChild(h('span', { class: 'letra', style: b.estilo || '' }, b.letra));
        if (b.txt) btn.appendChild(document.createTextNode(b.txt));
        btn.addEventListener('mousedown', (e) => e.preventDefault());
        btn.addEventListener('click', (e) => {
          if (hj.opts.soloLectura) return;
          if (hj.edicion && !['insertarFuncion'].includes(b.c)) { if (!hj.confirmarEdicion()) return; }
          if (b.menu) {
            const items = MENUS[b.menu](hj);
            const rect = btn.getBoundingClientRect();
            hj._menuEn({ clientX: rect.left, clientY: rect.bottom + 2 }, items);
            if (b.menu === 'relleno' || b.menu === 'colorFuente') {
              hj._menu.querySelectorAll('.menu-item').forEach((it, i) => { const c = items[i].color; if (c) { it.style.borderLeft = '14px solid ' + c; } });
            }
            return;
          }
          if (b.conEvento) { const rect = btn.getBoundingClientRect(); hj.comando(b.c, { clientX: rect.left, clientY: rect.bottom + 2 }); return; }
          hj.comando(b.c, ...(b.args || []));
          if (!['formatoCeldas', 'buscar', 'reemplazar', 'pegadoEspecial'].includes(b.c)) setTimeout(() => { if (!hj.edicion) hj.enfocar(); }, 0);
        });
        if (b.estado) hj._botonesEstado.push([btn, b.estado]);
        grupo.appendChild(btn);
      }
      barra.appendChild(grupo);
    }
    if (hj.opts.extrasHerr) hj.opts.extrasHerr(barra, hj);
    hj.on('cambio', () => refrescar(hj));
    hj.on('accion', (a) => { if (a.tipo === 'seleccion') refrescar(hj); });
  }
  function refrescar(hj) {
    if (!hj._botonesEstado || !hj.hj) return;
    const est = hj.hj.estilos.get(k(hj.sel.ar, hj.sel.ac)) || {};
    for (const [btn, e] of hj._botonesEstado) {
      let on = false;
      if (e === 'filtro') on = !!hj.hj.filtro;
      else if (e === 'protegida') on = hj.hj.protegida;
      else if (e === 'formulas') on = hj.mostrarFormulas;
      else if (e === 'bloqueo') on = !!est.desbloqueada;
      else on = !!est[e];
      btn.classList.toggle('activo', on);
    }
  }

  /* Botones de filtro sobre los encabezados (se dibujan después de pintar) */
  function trasPintar(hj) {
    if (!hj.lienzo) return;
    hj.lienzo.querySelectorAll('.hoja-btnfiltro').forEach((b) => b.remove());
    const f = hj.hj.filtro;
    if (!f) return;
    for (let c = f.c1; c <= f.c2; c++) {
      const td = hj.tds[f.r1] && hj.tds[f.r1][c];
      if (!td) continue;
      const b = h('button', { class: 'hoja-btnfiltro' + (f.criterios[c] ? ' activo' : ''), title: 'Filtrar u ordenar esta columna', style: { left: td.offsetLeft + td.offsetWidth - 19 + 'px', top: td.offsetTop + 4 + 'px' } }, f.criterios[c] ? '⧩' : '▼');
      b.style.right = 'auto';
      b.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); const r = b.getBoundingClientRect(); abrirMenuFiltro(hj, c, { clientX: r.left, clientY: r.bottom + 2 }); });
      hj.lienzo.appendChild(b);
    }
  }

  LT.HojaHerramientas = { montar, comandos: C, trasPintar, regionActual, ordenarRegion, buscarObjetivo, ESTILOS_CELDA, FORMATOS_CF };
})();
