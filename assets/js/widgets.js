/* Widgets de explicación y práctica: muestran lo que Excel hace por dentro. */
(function () {
  'use strict';
  const LT = window.LT;
  const { h, esc } = LT.u;
  const R = LT.refs;
  const F = LT.formato;
  const W = (LT.widgets = LT.widgets || {});
  const COLORES = ['#1f6fd1', '#c0392b', '#7d3c98', '#16a085', '#d35400'];

  /* Mini tabla estática estilo hoja: datos 2D (fila 0 = encabezados de columna A, B…) */
  function miniTabla(datos, opc) {
    opc = opc || {};
    const t = h('table', { class: 'hoja-tabla mini', style: { fontFamily: 'var(--fuente-hoja)', fontSize: '13px', background: '#fff' } });
    const ncols = Math.max(...datos.map((f) => f.length));
    const thead = h('tr', null, h('th', { class: 'esq', style: { width: '34px' } }));
    for (let c = 0; c < ncols; c++) thead.appendChild(h('th', { class: 'enc-col', style: { width: (opc.anchos && opc.anchos[c]) || 86 + 'px' } }, R.colLetra(c)));
    t.appendChild(h('thead', null, thead));
    const tb = h('tbody');
    datos.forEach((fila, r) => {
      const tr = h('tr', null, h('th', { class: 'enc-fila' }, String(r + 1)));
      for (let c = 0; c < ncols; c++) {
        const v = fila[c];
        const td = h('td', { class: typeof v === 'number' ? 'a-right' : 'a-left', dataset: { dir: R.dir(r, c) } }, v == null ? '' : typeof v === 'number' ? F.formatear(v, (opc.formatos && opc.formatos[c]) || 'General').texto : String(v));
        tr.appendChild(td);
      }
      tb.appendChild(tr);
    });
    t.appendChild(tb);
    return h('div', { class: 'hoja', style: { display: 'inline-block', maxWidth: '100%', overflow: 'auto' } }, t);
  }
  W.miniTabla = miniTabla;
  function marcarCeldas(tabla, dirs, color) {
    tabla.querySelectorAll('td').forEach((td) => { if (dirs.includes(td.dataset.dir)) { td.style.boxShadow = 'inset 0 0 0 2px ' + color; td.style.background = color + '22'; } });
  }
  function limpiarMarcas(tabla) { tabla.querySelectorAll('td').forEach((td) => { td.style.boxShadow = ''; td.style.background = ''; }); }

  /* ------------------------------------------------- copiar referencias */
  /* opts: {datos (con encabezados en fila 1), formula:'=C2*F1', celda:'D2', hasta:'D6', valorCorrecto(fila)=> número, nota} */
  W.copiarReferencias = function (cont, opts) {
    cont.innerHTML = '';
    const base = R.parseCelda(opts.celda);
    const fin = R.parseCelda(opts.hasta);
    const refs = [];
    R.recorrerFormula(opts.formula, (t) => { if (t.tipo === 'celda') refs.push(t); });
    const anclajes = refs.map((t) => (t.m[1] ? '$' : '') + 'C' + (t.m[3] ? '$' : '') + 'F');
    const tipos = [['CF', 'A1 (relativa)'], ['$C$F', '$A$1 (absoluta)'], ['C$F', 'A$1 (fila fija)'], ['$CF', '$A1 (columna fija)']];
    const controles = h('div', { class: 'grupo-btn', style: { marginBottom: '10px' } });
    const salida = h('div');
    const tablaCont = h('div');
    const construir = () => {
      let f = '';
      let i = 0;
      R.recorrerFormula(opts.formula, (t) => {
        if (t.tipo === 'celda') {
          const a = anclajes[i++];
          f += (a[0] === '$' ? '$' : '') + t.m[2] + (a.includes('C$') ? '$' : '') + t.m[4];
        } else f += t.txt;
      });
      return f;
    };
    const dibujar = () => {
      controles.innerHTML = '';
      refs.forEach((t, i) => {
        const s = h('select', { class: 'herr-sel', 'aria-label': 'Tipo de referencia de ' + t.m[2] + t.m[4] });
        tipos.forEach(([v, n]) => s.appendChild(h('option', { value: v, selected: anclajes[i] === v ? true : null }, n.replace('A1', t.m[2] + t.m[4]).replace('A$1', t.m[2] + '$' + t.m[4]).replace('$A1', '$' + t.m[2] + t.m[4]).replace('$A$1', '$' + t.m[2] + '$' + t.m[4]))));
        s.addEventListener('change', () => { anclajes[i] = s.value; dibujar(); });
        controles.appendChild(h('label', { style: { display: 'flex', gap: '6px', alignItems: 'center', fontSize: '.88rem' } }, h('span', { style: { color: COLORES[i], fontWeight: 700 } }, t.m[2] + t.m[4] + ':'), s));
      });
      const f = construir();
      const datos = opts.datos.map((fila) => fila.slice());
      const filas = [];
      for (let r = base.r; r <= fin.r; r++) {
        const fr = R.desplazarFormula(f, r - base.r, 0);
        filas.push({ r, f: fr });
        while (datos.length <= r) datos.push([]);
      }
      const hf = LT.motor.crearMotor({ H: Object.fromEntries(datos.flatMap((fila, r) => fila.map((v, c) => [R.dir(r, c), v == null ? '' : String(v)])).filter((x) => x[1] !== '').concat(filas.map((x) => [R.dir(x.r, base.c), x.f]))) });
      const sid = hf.getSheetId('H');
      filas.forEach((x) => {
        const v = hf.getCellValue({ sheet: sid, row: x.r, col: base.c });
        x.v = LT.motor.esError(v) ? LT.motor.textoError(v) : v;
        datos[x.r][base.c] = typeof x.v === 'number' ? Math.round(x.v * 100) / 100 : x.v;
      });
      hf.destroy();
      tablaCont.innerHTML = '';
      const tabla = miniTabla(datos, { formatos: opts.formatos });
      tablaCont.appendChild(tabla);
      salida.innerHTML = '';
      const lista = h('table', { class: 'tabla-sitio', style: { marginTop: '10px', maxWidth: '640px' } }, h('thead', null, h('tr', null, h('th', null, 'Celda'), h('th', null, 'Fórmula al copiar'), h('th', null, 'Resultado'), opts.valorCorrecto ? h('th', null, '¿Correcto?') : null)));
      const tb = h('tbody');
      let todasBien = true;
      filas.forEach((x) => {
        const fcode = h('code', null);
        let i = 0;
        R.recorrerFormula(x.f, (t) => { if (t.tipo === 'celda') { fcode.appendChild(h('span', { style: { color: COLORES[i++ % COLORES.length], fontWeight: 700 } }, t.txt)); } else fcode.appendChild(document.createTextNode(t.txt)); });
        const esperado = opts.valorCorrecto ? opts.valorCorrecto(x.r) : null;
        const bien = esperado == null || (typeof x.v === 'number' && Math.abs(x.v - esperado) < 0.01);
        if (!bien) todasBien = false;
        const tr = h('tr', null, h('td', null, R.dir(x.r, base.c)), h('td', null, fcode), h('td', { style: { textAlign: 'right' } }, typeof x.v === 'number' ? F.formatear(x.v, opts.formatoResultado || 'General').texto : String(x.v)), opts.valorCorrecto ? h('td', null, bien ? '✓' : '✗ debería ser ' + F.formatear(esperado, opts.formatoResultado || 'General').texto) : null);
        tr.addEventListener('mouseenter', () => { limpiarMarcas(tabla); R.referenciasEn(x.f).forEach((ref, k) => { const dirs = []; for (let rr = ref.r1; rr <= ref.r2; rr++) for (let cc = ref.c1; cc <= ref.c2; cc++) dirs.push(R.dir(rr, cc)); marcarCeldas(tabla, dirs, COLORES[k % COLORES.length]); }); });
        tr.addEventListener('mouseleave', () => limpiarMarcas(tabla));
        tb.appendChild(tr);
      });
      lista.appendChild(tb);
      salida.appendChild(lista);
      if (opts.valorCorrecto) salida.appendChild(h('div', { class: 'aviso-caja ' + (todasBien ? 'ok' : 'alerta') }, todasBien ? '✓ Así, todas las copias calculan bien. Observa qué referencias cambiaron y cuáles se quedaron fijas.' : 'Algunas copias apuntan a la celda equivocada. Pasa el cursor sobre cada fila para ver a qué celdas apunta y cambia el tipo de referencia.'));
      if (opts.alCambiar) opts.alCambiar({ formula: f, todasBien });
    };
    cont.append(opts.instruccion === '' ? null : h('p', { class: 'instr' }, opts.instruccion || 'Elige el tipo de cada referencia y observa cómo cambia la fórmula al copiarla hacia abajo.'), controles, h('div', { class: 'cols-2' }, tablaCont), salida);
    dibujar();
  };

  /* -------------------------------------------------- animación BUSCARX */
  W.buscarX = function (cont, opts) {
    cont.innerHTML = '';
    const filas = opts.filas; // [[código, nombre, precio]]
    const entrada = h('input', { type: 'text', value: opts.inicial || filas[3][0], style: { width: '120px', padding: '6px 8px', borderRadius: '7px', border: '1px solid var(--linea-2)', fontFamily: 'var(--mono)' }, 'aria-label': 'Valor buscado' });
    const colRet = h('select', { class: 'herr-sel', 'aria-label': 'Columna que se devuelve' }, opts.columnas.slice(1).map((c, i) => h('option', { value: i + 1 }, c)));
    const siNo = h('input', { type: 'text', value: 'No existe', style: { width: '110px', padding: '6px 8px', borderRadius: '7px', border: '1px solid var(--linea-2)' }, 'aria-label': 'Si no se encuentra' });
    const formula = h('div', { class: 'formula-grande', style: { fontSize: '1rem' } });
    const tabla = h('table', { class: 'tabla-sitio', style: { maxWidth: '560px', fontFamily: 'var(--fuente-hoja)' } });
    const estado = h('div', { class: 'retro', 'aria-live': 'polite' });
    const btn = h('button', { class: 'btn primario chico' }, '▶ Ver cómo busca');
    let timer = null;
    const dibujarTabla = (actual, encontrada, retorno) => {
      tabla.innerHTML = '';
      tabla.appendChild(h('thead', null, h('tr', null, opts.columnas.map((c, j) => h('th', { style: { background: j === 0 ? '#dce9f6' : j === +colRet.value ? '#e2f1e8' : '' } }, c + (j === 0 ? ' (matriz_buscada)' : j === +colRet.value ? ' (matriz_devuelta)' : ''))))));
      const tb = h('tbody');
      filas.forEach((f, i) => {
        const tr = h('tr', { style: { background: i === encontrada ? '#c6efce' : i === actual ? '#fff4c2' : '' } });
        f.forEach((v, j) => tr.appendChild(h('td', { style: { fontWeight: i === encontrada && j === retorno ? 700 : 400, outline: i === encontrada && j === retorno ? '2px solid #1e7145' : '' } }, typeof v === 'number' ? F.formatear(v, '$#,##0').texto : v)));
        tb.appendChild(tr);
      });
      tabla.appendChild(tb);
    };
    const actualizarFormula = () => {
      const col = opts.letras[+colRet.value];
      formula.textContent = '=BUSCARX("' + entrada.value + '", ' + opts.letras[0] + '2:' + opts.letras[0] + (filas.length + 1) + ', ' + col + '2:' + col + (filas.length + 1) + ', "' + siNo.value + '")';
    };
    const correr = () => {
      clearInterval(timer);
      actualizarFormula();
      const buscado = entrada.value.trim().toLowerCase();
      let i = 0;
      estado.textContent = 'Excel compara «' + entrada.value + '» con cada código, de arriba hacia abajo…';
      timer = setInterval(() => {
        if (i >= filas.length) {
          clearInterval(timer);
          dibujarTabla(-1, -1);
          estado.innerHTML = '';
          estado.appendChild(h('div', { class: 'aviso-caja alerta' }, 'No hay coincidencia: BUSCARX devuelve el cuarto argumento, «' + siNo.value + '». Si lo omites, devuelve el error #N/A.'));
          return;
        }
        if (String(filas[i][0]).toLowerCase() === buscado) {
          clearInterval(timer);
          dibujarTabla(i, i, +colRet.value);
          estado.innerHTML = '';
          estado.appendChild(h('div', { class: 'aviso-caja ok' }, '¡Encontrado en la fila ' + (i + 2) + '! BUSCARX devuelve el valor de la misma posición en la matriz devuelta: ', h('b', null, typeof filas[i][+colRet.value] === 'number' ? F.formatear(filas[i][+colRet.value], '$#,##0').texto : filas[i][+colRet.value])));
          return;
        }
        dibujarTabla(i, -1);
        i++;
      }, 420);
    };
    btn.addEventListener('click', correr);
    [entrada, siNo].forEach((x) => x.addEventListener('input', actualizarFormula));
    colRet.addEventListener('change', () => { actualizarFormula(); dibujarTabla(-1, -1); });
    cont.append(
      h('div', { class: 'grupo-btn', style: { marginBottom: '10px' } }, h('label', null, 'Buscar: ', entrada), h('label', null, 'Devolver: ', colRet), h('label', null, 'Si no se encuentra: ', siNo), btn),
      formula, h('div', { style: { overflowX: 'auto', marginTop: '10px' } }, tabla), estado);
    actualizarFormula();
    dibujarTabla(-1, -1);
  };

  /* ------------------------------------------------- rango vs. tabla */
  W.rangoVsTabla = function (cont, opts) {
    cont.innerHTML = '';
    const base = opts.filas.map((f) => f.slice());
    const extras = opts.extras.slice();
    let filas = base.map((f) => f.slice());
    const izq = h('div'), der = h('div');
    const dibujar = () => {
      const totalRango = base.reduce((s, f) => s + f[2] * f[3], 0);
      const totalTabla = filas.reduce((s, f) => s + f[2] * f[3], 0);
      const lado = (titulo, esTabla) => {
        const t = h('table', { class: 'tabla-sitio', style: { fontFamily: 'var(--fuente-hoja)', fontSize: '.86rem' } });
        t.appendChild(h('thead', null, h('tr', { style: esTabla ? { background: '#2463a6', color: '#fff' } : null }, (opts.encabezados || ['Folio', 'Producto', 'Cant.', 'Precio', 'Importe']).map((x) => h('th', { style: esTabla ? { background: '#2463a6', color: '#fff' } : null }, x + (esTabla ? ' ▾' : ''))))));
        const tb = h('tbody');
        filas.forEach((f, i) => {
          const nueva = i >= base.length;
          const importe = esTabla || !nueva ? F.formatear(f[2] * f[3], '$#,##0').texto : '';
          tb.appendChild(h('tr', { style: { background: esTabla ? (i % 2 ? '#dce9f6' : '#fff') : '' } }, f.map((v, j) => h('td', { style: { textAlign: j >= 2 ? 'right' : 'left' } }, j === 3 ? F.formatear(v, '$#,##0').texto : v)), h('td', { style: { textAlign: 'right', background: !esTabla && nueva ? '#fff4c2' : '' } }, importe)));
        });
        tb.appendChild(h('tr', { style: { fontWeight: 700, borderTop: '2px solid #333' } }, h('td', { colspan: 4 }, esTabla ? 'Total (fila de totales)' : 'Total'), h('td', { style: { textAlign: 'right' } }, F.formatear(esTabla ? totalTabla : totalRango, '$#,##0').texto)));
        t.appendChild(tb);
        return h('div', null, h('h3', { style: { fontSize: '1rem' } }, titulo), t, h('code', { style: { display: 'inline-block', marginTop: '6px' } }, esTabla ? '=SUBTOTALES(109,[Importe])  ·  Importe: =[@' + (opts.encabezados ? opts.encabezados[2] : 'Cant.') + ']*[@' + (opts.encabezados ? opts.encabezados[3] : 'Precio') + ']' : '=SUMA(E2:E' + (base.length + 1) + ')  ·  Importe: =C2*D2 (copiada a mano)'));
      };
      izq.innerHTML = ''; der.innerHTML = '';
      izq.appendChild(lado('Rango normal', false));
      der.appendChild(lado('Tabla «' + (opts.nombreTabla || 'Pedidos') + '»', true));
    };
    const agregar = h('button', { class: 'btn primario chico', onclick: () => {
      if (!extras.length) { LT.ui.toast('Ya no hay más registros de ejemplo.'); return; }
      filas.push(extras.shift());
      dibujar();
      nota.innerHTML = '';
      nota.appendChild(h('div', { class: 'aviso-caja alerta' }, 'Observa: en el rango normal la fórmula de Importe no se copió sola y el total sigue sumando ' + 'E2:E' + (base.length + 1) + ' (no incluye la fila nueva). En la tabla, la columna calculada se llenó sola y la fila de totales se ajustó.'));
    } }, opts.textoAgregar || '+ Agregar un registro debajo');
    const reiniciar = h('button', { class: 'btn chico', onclick: () => { filas = base.map((f) => f.slice()); extras.splice(0, extras.length, ...opts.extras); nota.innerHTML = ''; dibujar(); } }, 'Reiniciar');
    const nota = h('div');
    cont.append(h('div', { class: 'grupo-btn', style: { marginBottom: '10px' } }, agregar, reiniciar), h('div', { class: 'lab-grid' }, izq, der), nota);
    dibujar();
  };

  /* ------------------------------------------- patrones de autorrelleno */
  W.autorrelleno = function (cont, opts) {
    cont.innerHTML = '';
    const ejemplos = opts.ejemplos || [['Lunes'], ['CAF-001'], ['ene'], ['5'], ['5', '10'], ['15/10/2026'], ['=B2*2']];
    const tabla = h('table', { class: 'tabla-sitio' }, h('thead', null, h('tr', null, h('th', null, 'Celdas de inicio'), h('th', null, 'Tu predicción para la 4.ª celda nueva'), h('th', null, 'Lo que hace Excel al arrastrar'))));
    const tb = h('tbody');
    let aciertos = 0;
    ejemplos.forEach((ej) => {
      const fuente = ej.map((raw) => ({ raw, est: /\d+\/\d+\/\d+/.test(raw) ? { fmt: 'dd/mm/yyyy' } : null }));
      const serie = [0, 1, 2, 3].map((n) => LT.Hoja.prototype._serie.call(null, fuente, n, 1, 0));
      const inp = h('input', { type: 'text', placeholder: '¿?', style: { width: '120px', padding: '5px 7px', borderRadius: '6px', border: '1px solid var(--linea-2)' } });
      const res = h('td', null);
      const ver = h('button', { class: 'btn chico', onclick: () => {
        res.innerHTML = '';
        res.appendChild(h('span', { class: 'mono' }, serie.join(' → ')));
        const ok = inp.value.trim().toLowerCase() === String(serie[3]).toLowerCase();
        if (ok) aciertos++;
        res.appendChild(h('span', { style: { marginLeft: '8px', fontWeight: 700, color: ok ? 'var(--verde)' : 'var(--rojo)' } }, ok ? '✓' : '✗'));
        ver.disabled = true; inp.disabled = true;
        if (opts.alResponder) opts.alResponder(aciertos, ejemplos.length);
      } }, 'Ver');
      tb.appendChild(h('tr', null, h('td', null, h('code', null, ej.join('  ·  '))), h('td', null, inp, ' ', ver), res));
    });
    tabla.appendChild(tb);
    cont.append(h('div', { class: 'tabla-scroll' }, tabla), h('p', { class: 'instr', style: { marginTop: '8px' } }, 'Regla general: un número solo se copia; dos números marcan el incremento; los textos que terminan en número, las fechas, los días y los meses avanzan; las fórmulas se copian ajustando sus referencias.'));
  };

  /* ---------------------------------------- cómo agrupa una tabla dinámica */
  W.agrupacion = function (cont, opts) {
    cont.innerHTML = '';
    const filas = opts.filas; // [{grupo, etiqueta, valor}]
    const colores = { };
    const lista = h('div', { style: { display: 'grid', gap: '4px', maxWidth: '520px' } });
    let agrupado = false;
    const paleta = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100'];
    Array.from(new Set(filas.map((f) => f.grupo))).forEach((g, i) => { colores[g] = paleta[i % paleta.length]; });
    const dibujar = () => {
      lista.innerHTML = '';
      if (!agrupado) {
        filas.forEach((f) => lista.appendChild(h('div', { style: { display: 'grid', gridTemplateColumns: '110px 1fr 90px', gap: '8px', padding: '4px 8px', borderLeft: '4px solid ' + colores[f.grupo], background: '#fff', border: '1px solid var(--linea)', borderRadius: '6px', fontSize: '.88rem', transition: 'all .3s' } }, h('b', null, f.grupo), h('span', null, f.etiqueta), h('span', { style: { textAlign: 'right' } }, F.formatear(f.valor, '$#,##0').texto))));
      } else {
        const tot = {};
        filas.forEach((f) => { tot[f.grupo] = tot[f.grupo] || { n: 0, s: 0 }; tot[f.grupo].n++; tot[f.grupo].s += f.valor; });
        Object.entries(tot).forEach(([g, t]) => lista.appendChild(h('div', { style: { display: 'grid', gridTemplateColumns: '110px 1fr 90px', gap: '8px', padding: '8px', borderLeft: '6px solid ' + colores[g], background: '#fff', border: '1px solid var(--linea)', borderRadius: '6px', fontWeight: 600 } }, h('span', null, g), h('span', { style: { fontWeight: 400, color: 'var(--tinta-2)' } }, t.n + ' filas sumadas'), h('span', { style: { textAlign: 'right' } }, F.formatear(t.s, '$#,##0').texto))));
        const gran = filas.reduce((a, b) => a + b.valor, 0);
        lista.appendChild(h('div', { style: { display: 'grid', gridTemplateColumns: '110px 1fr 90px', gap: '8px', padding: '8px', borderTop: '2px solid #333', fontWeight: 700 } }, h('span', null, 'Total general'), h('span'), h('span', { style: { textAlign: 'right' } }, F.formatear(gran, '$#,##0').texto)));
      }
    };
    const btn = h('button', { class: 'btn primario chico', onclick: () => { agrupado = !agrupado; btn.textContent = agrupado ? '↺ Ver filas originales' : '▶ Agrupar por ' + opts.campo; dibujar(); } }, '▶ Agrupar por ' + opts.campo);
    cont.append(h('div', { class: 'grupo-btn', style: { marginBottom: '10px' } }, btn), lista);
    dibujar();
  };

  /* ------------------------------------------------- vista de impresión */
  W.impresion = function (cont, opts) {
    cont.innerHTML = '';
    const est = Object.assign({ orientacion: 'vertical', margenes: 'normal', ajuste: 'ninguno', area: 'todo', titulos: false, pie: 'ninguno', cuadricula: false }, opts.estado || {});
    const datos = opts.datos; // {encabezados:[], filas:[[]], anchos:[]}
    const sel = (id, etiqueta, opciones) => {
      const s = h('select', { 'aria-label': etiqueta }, opciones.map(([v, t]) => h('option', { value: v, selected: est[id] === v ? true : null }, t)));
      s.addEventListener('change', () => { est[id] = s.value; dibujar(); if (opts.alAccion) opts.alAccion({ tipo: id, valor: s.value }); });
      return [h('label', null, etiqueta), s];
    };
    const chk = (id, etiqueta) => {
      const c = h('input', { type: 'checkbox', checked: est[id] ? true : null });
      c.addEventListener('change', () => { est[id] = c.checked; dibujar(); });
      return h('label', { style: { display: 'flex', gap: '6px', alignItems: 'center', fontWeight: 400 } }, c, etiqueta);
    };
    const controles = h('div', { class: 'imp-controles widget' },
      h('div', { style: { fontWeight: 700 } }, 'Configurar página'),
      sel('orientacion', 'Orientación', [['vertical', 'Orientación vertical'], ['horizontal', 'Orientación horizontal']]),
      sel('margenes', 'Márgenes', [['normal', 'Normales'], ['estrecho', 'Estrechos'], ['ancho', 'Anchos']]),
      sel('ajuste', 'Escalado', [['ninguno', 'Sin escalado'], ['hoja', 'Ajustar hoja en una página'], ['columnas', 'Ajustar todas las columnas en una página'], ['filas', 'Ajustar todas las filas en una página']]),
      sel('area', 'Área de impresión', opts.areas || [['todo', 'Toda la hoja']]),
      chk('titulos', 'Imprimir títulos: repetir la fila de encabezados en cada página'),
      sel('pie', 'Pie de página', [['ninguno', '(ninguno)'], ['pagina', 'Página 1'], ['paginaDe', 'Página 1 de ?'], ['reporte', 'Reporte anual · Clínica Vida Sana']]),
      chk('cuadricula', 'Imprimir líneas de cuadrícula'));
    const vista = h('div');
    cont.appendChild(h('div', { class: 'impresion' }, controles, vista));
    const calc = () => {
      const papel = est.orientacion === 'vertical' ? [816, 1056] : [1056, 816];
      const m = { normal: [67, 72], estrecho: [24, 72], ancho: [96, 96] }[est.margenes];
      const disp = [papel[0] - 2 * m[0], papel[1] - 2 * m[1] - 30];
      const area = (opts.areaFilas && opts.areaFilas[est.area]) || null;
      const filas = area ? datos.filas.slice(area[0], area[1]) : datos.filas;
      const anchos = datos.anchos;
      const altoFila = 20;
      const totW = anchos.reduce((a, b) => a + b, 0), totH = (filas.length + 1) * altoFila;
      let escala = 1;
      if (est.ajuste === 'hoja') escala = Math.min(1, disp[0] / totW, disp[1] / totH);
      else if (est.ajuste === 'columnas') escala = Math.min(1, disp[0] / totW);
      else if (est.ajuste === 'filas') escala = Math.min(1, disp[1] / totH);
      // grupos de columnas
      const gruposC = [];
      let actual = [], acc = 0;
      anchos.forEach((w, i) => { if (acc + w * escala > disp[0] + 0.5 && actual.length) { gruposC.push(actual); actual = []; acc = 0; } actual.push(i); acc += w * escala; });
      if (actual.length) gruposC.push(actual);
      const filasPorPag = Math.max(1, Math.floor(disp[1] / (altoFila * escala)) - 1);
      const gruposF = [];
      for (let i = 0; i < filas.length; i += est.titulos || i === 0 ? filasPorPag : filasPorPag + 1) gruposF.push([i, Math.min(filas.length, i + (est.titulos || i === 0 ? filasPorPag : filasPorPag + 1))]);
      return { papel, m, escala, gruposC, gruposF, filas, anchos, altoFila };
    };
    const dibujar = () => {
      const c = calc();
      const total = c.gruposC.length * c.gruposF.length;
      vista.innerHTML = '';
      const pags = h('div', { class: 'imp-paginas' });
      const factor = 190 / Math.max(c.papel[0], c.papel[1]);
      let n = 0;
      for (const gf of c.gruposF) for (const gc of c.gruposC) {
        n++;
        if (n > 12) break;
        const p = h('div', { class: 'imp-pagina', style: { width: c.papel[0] * factor + 'px', height: c.papel[1] * factor + 'px' } });
        const contenido = h('div', { class: 'contenido', style: { left: c.m[0] * factor + 'px', top: c.m[1] * factor + 'px', right: c.m[0] * factor + 'px', bottom: c.m[1] * factor + 'px' } });
        const t = h('table', { style: { transform: 'scale(' + (c.escala * factor * 1.0).toFixed(4) + ')', width: gc.reduce((a, i) => a + c.anchos[i], 0) + 'px', fontSize: '12px' } });
        const mostrarEnc = gf[0] === 0 || est.titulos;
        if (mostrarEnc) t.appendChild(h('tr', null, gc.map((i) => h('th', { style: { width: c.anchos[i] + 'px', border: est.cuadricula ? '' : '0', fontSize: '12px', height: c.altoFila + 'px' } }, datos.encabezados[i]))));
        for (let r = gf[0]; r < gf[1]; r++) t.appendChild(h('tr', null, gc.map((i) => h('td', { style: { border: est.cuadricula ? '1px solid #bbb' : '0', fontSize: '12px', height: c.altoFila + 'px', textAlign: typeof c.filas[r][i] === 'number' ? 'right' : 'left' } }, typeof c.filas[r][i] === 'number' ? F.formatear(c.filas[r][i], '#,##0').texto : c.filas[r][i]))));
        contenido.appendChild(t);
        p.appendChild(contenido);
        const pie = est.pie === 'pagina' ? 'Página ' + n : est.pie === 'paginaDe' ? 'Página ' + n + ' de ' + total : est.pie === 'reporte' ? 'Reporte anual · Clínica Vida Sana' : '';
        if (pie) p.appendChild(h('div', { class: 'pie' }, pie));
        pags.appendChild(h('div', null, p, h('div', { class: 'imp-num' }, 'Página ' + n)));
      }
      vista.appendChild(h('div', { class: 'aviso-caja ' + (total === 1 ? 'ok' : 'alerta'), style: { marginTop: 0 } }, total === 1 ? '✓ El reporte cabe en una sola página.' : 'El reporte ocupa ' + total + ' páginas' + (c.gruposC.length > 1 ? ' (las columnas no caben a lo ancho: algunas salen en hojas aparte)' : '') + '.', c.escala < 1 ? h('span', null, '  Escala: ' + Math.round(c.escala * 100) + ' %.') : null));
      vista.appendChild(pags);
      if (opts.alCambiar) opts.alCambiar(Object.assign({}, est, { paginas: total, escala: c.escala, paginasAncho: c.gruposC.length }));
    };
    dibujar();
    return { estado: () => { const c = calc(); return Object.assign({}, est, { paginas: c.gruposC.length * c.gruposF.length, paginasAncho: c.gruposC.length, escala: c.escala }); } };
  };

  /* ------------------------------------------ laboratorio de formatos */
  /* opts: {valores:[{v, etiqueta}], codigo, retos:[{valor, objetivo, texto}], alResolver} */
  W.laboratorioFormatos = function (cont, opts) {
    cont.innerHTML = '';
    const inp = h('input', { class: 'codigo', type: 'text', value: opts.codigo || '#,##0.00', spellcheck: 'false', 'aria-label': 'Código de formato' });
    const tabla = h('table', { class: 'fmt-tabla' });
    const retosBox = h('div');
    const frecuentes = ['General', '0.00', '#,##0', '$#,##0.00', '0%', '0.0%', 'dd/mm/aaaa', 'dddd d" de "mmmm', '"CAF-"000', '0.0 "kg"', '#,##0;[Rojo]-#,##0', '[>=10000]"Meta ✓";"Falta"', '$#,##0,"k"'];
    const chips = h('div', { class: 'grupo-btn', style: { margin: '8px 0' } }, frecuentes.map((c) => h('button', { class: 'btn chico fantasma', style: { fontFamily: 'var(--mono)', border: '1px solid var(--linea)' }, onclick: () => { inp.value = c; dibujar(); } }, c)));
    const dibujar = () => {
      const cod = F.normalizarCodigo(inp.value.trim() || 'General');
      tabla.innerHTML = '';
      tabla.appendChild(h('thead', null, h('tr', null, h('th', null, 'Valor guardado en la celda'), h('th', { style: { textAlign: 'right' } }, 'Lo que se ve'))));
      const tb = h('tbody');
      for (const x of opts.valores) {
        const f = F.formatear(x.v, cod);
        tb.appendChild(h('tr', null, h('td', null, x.etiqueta || String(x.v)), h('td', { class: 'res', style: { color: f.color || '' } }, f.texto)));
      }
      tabla.appendChild(tb);
      if (opts.retos) {
        retosBox.innerHTML = '';
        let resueltos = 0;
        opts.retos.forEach((r) => {
          const ok = r.hecho = r.hecho || F.formatear(r.valor, cod).texto === r.objetivo;
          if (ok) resueltos++;
          retosBox.appendChild(h('div', { class: 'aviso-caja ' + (ok ? 'ok' : 'info'), style: { margin: '6px 0' } }, (ok ? '✓ ' : '○ ') + r.texto + ': que ', h('code', null, String(r.etiqueta || r.valor)), ' se vea como ', h('b', null, r.objetivo)));
        });
        if (opts.alResolver) opts.alResolver(resueltos, opts.retos.length, cod);
      }
    };
    inp.addEventListener('input', dibujar);
    cont.append(h('div', { class: 'fmt-lab' }, h('div', null, h('label', { style: { fontWeight: 600, fontSize: '.88rem' } }, 'Código de formato (Formato de celdas › Personalizada › Tipo)'), inp, chips, retosBox), h('div', null, tabla)));
    dibujar();
  };

  /* --------------------------------------------------------- temas */
  W.temas = function (cont, opts) {
    cont.innerHTML = '';
    const temas = { Office: ['#156082', '#e97132', '#196b24', '#0f9ed5', 'Aptos'], 'Clínica': ['#0f766e', '#99d5cf', '#115e59', '#e3f2f1', 'Georgia'], Bosque: ['#1e7145', '#a9d08e', '#375623', '#e2efda', 'Segoe UI'], Marino: ['#1f3864', '#8eaadb', '#2f5597', '#dae3f3', 'Calibri'], 'Atardecer': ['#7b3f9e', '#f4b183', '#c55a11', '#fbe5d6', 'Trebuchet MS'] };
    let actual = opts.inicial || 'Office';
    const muestra = h('div');
    const botones = h('div', { class: 'grupo-btn', style: { marginBottom: '10px' } });
    const dibujar = () => {
      botones.innerHTML = '';
      Object.entries(temas).forEach(([n, c]) => botones.appendChild(h('button', { class: 'btn chico' + (n === actual ? ' primario' : ''), onclick: () => { actual = n; dibujar(); if (opts.alElegir) opts.alElegir(n); } }, h('span', { style: { display: 'inline-flex', gap: '2px' } }, c.slice(0, 4).map((x) => h('span', { style: { width: '10px', height: '14px', background: x, display: 'inline-block', borderRadius: '2px' } }))), n)));
      const c = temas[actual];
      muestra.innerHTML = '';
      const t = h('table', { class: 'tabla-sitio', style: { fontFamily: c[4] + ', sans-serif', maxWidth: '520px' } });
      t.appendChild(h('thead', null, h('tr', null, (opts.encabezados || ['Sede', 'Atenciones', 'Meta', 'Avance']).map((x) => h('th', { style: { background: c[0], color: '#fff' } }, x)))));
      const tb = h('tbody');
      (opts.filas || [['Centro', 3505, 3400], ['Norte', 3728, 3800], ['Sur', 3358, 3300]]).forEach((f, i) => tb.appendChild(h('tr', { style: { background: i % 2 ? c[3] : '#fff' } }, h('td', null, f[0]), h('td', null, F.formatear(f[1], opts.formato || '#,##0').texto), h('td', null, F.formatear(f[2], opts.formato || '#,##0').texto), h('td', { style: { color: f[1] >= f[2] ? c[2] : c[1], fontWeight: 700 } }, F.formatear(f[1] / f[2], '0%').texto))));
      t.appendChild(tb);
      muestra.append(h('div', { style: { fontFamily: c[4] + ', serif', color: c[0], fontSize: '1.3rem', fontWeight: 700, marginBottom: '6px' } }, opts.titulo || 'Atenciones de 2025 por sede'), t, h('p', { class: 'instr', style: { marginTop: '8px' } }, 'El tema cambia a la vez los colores y las fuentes de todo el libro: estilos de celda, tablas y gráficos. Fuente del tema: ' + c[4] + '.'));
    };
    cont.append(botones, muestra);
    dibujar();
  };

  /* ------------------------------------------------ grabadora de macros */
  function rgb(hex) { const n = parseInt(String(hex).slice(1), 16); return 'RGB(' + ((n >> 16) & 255) + ', ' + ((n >> 8) & 255) + ', ' + (n & 255) + ')'; }
  function aR1C1(formula, r0, c0) {
    let out = '';
    R.recorrerFormula(formula, (t) => {
      if (t.tipo !== 'celda') { out += t.txt; return; }
      const [, c$, col, r$, fila] = t.m;
      const r = parseInt(fila, 10) - 1, c = R.colIndice(col);
      out += 'R' + (r$ ? r + 1 : r - r0 ? '[' + (r - r0) + ']' : '') + 'C' + (c$ ? c + 1 : c - c0 ? '[' + (c - c0) + ']' : '');
    });
    return out;
  }
  W.grabadora = function (hoja, cont, opts) {
    opts = opts || {};
    hoja.macros = hoja.macros || {};
    let grabando = null;
    let relativas = !!opts.relativas;
    const panel = h('div', { class: 'grupo-btn', style: { padding: '8px', background: '#f3f2f1', border: '1px solid #c8c6c4', borderRadius: '10px', marginBottom: '8px' } });
    const codigo = h('pre', { class: 'mono', style: { background: '#1e1e1e', color: '#d4d4d4', padding: '12px', borderRadius: '10px', overflow: 'auto', maxHeight: '260px', fontSize: '12.5px', margin: '8px 0 0', display: 'none' } });
    cont.append(panel, codigo);
    const vba = (m) => {
      const lineas = ['Sub ' + m.nombre + '()', "'", "' " + m.nombre + ' Macro', m.descripcion ? "' " + m.descripcion : null, "'", ''].filter((x) => x != null);
      for (const p of m.pasos) lineas.push('    ' + p.vba);
      lineas.push('End Sub');
      return lineas.join('\n');
    };
    const mostrarCodigo = (m) => {
      codigo.style.display = 'block';
      codigo.innerHTML = '';
      const txt = vba(m);
      codigo.innerHTML = esc(txt).replace(/^(\s*)('.*)$/gm, '$1<span style="color:#6a9955">$2</span>').replace(/\b(Sub|End Sub|With|End With|True|False)\b/g, '<span style="color:#569cd6">$1</span>');
    };
    const estadoAntes = { r: 0, c: 0 };
    const oyente = (a) => {
      if (!grabando) return;
      const m = grabando;
      let vbaL = null;
      switch (a.tipo) {
        case 'seleccion': {
          const rg = R.parseRango(a.rango);
          const act = R.parseCelda(a.activa);
          if (relativas) {
            const dr = act.r - estadoAntes.r, dc = act.c - estadoAntes.c;
            const tam = R.textoRango({ r1: 0, c1: 0, r2: rg.r2 - rg.r1, c2: rg.c2 - rg.c1 });
            vbaL = 'ActiveCell.Offset(' + dr + ', ' + dc + ').Range("' + tam + '").Select';
            m.pasos.push({ tipo: 'sel', dr, dc, alto: rg.r2 - rg.r1, ancho: rg.c2 - rg.c1, vba: vbaL });
          } else {
            vbaL = 'Range("' + a.rango + '").Select';
            m.pasos.push({ tipo: 'selAbs', rango: a.rango, vba: vbaL });
          }
          estadoAntes.r = act.r; estadoAntes.c = act.c;
          break;
        }
        case 'estilo': {
          const p = a.props;
          const lineas = [];
          if ('b' in p) lineas.push('Selection.Font.Bold = ' + (p.b ? 'True' : 'False'));
          if ('i' in p) lineas.push('Selection.Font.Italic = ' + (p.i ? 'True' : 'False'));
          if ('u' in p) lineas.push('Selection.Font.Underline = ' + (p.u ? 'xlUnderlineStyleSingle' : 'xlUnderlineStyleNone'));
          if ('fs' in p) lineas.push('Selection.Font.Size = ' + Math.round((p.fs || 13) * 0.85));
          if ('fg' in p) lineas.push('Selection.Font.Color = ' + rgb(p.fg || '#000000'));
          if ('bg' in p) lineas.push(p.bg ? 'Selection.Interior.Color = ' + rgb(p.bg) : 'Selection.Interior.Pattern = xlNone');
          if ('ha' in p) lineas.push('Selection.HorizontalAlignment = ' + { left: 'xlLeft', center: 'xlCenter', right: 'xlRight' }[p.ha]);
          if ('fmt' in p) lineas.push('Selection.NumberFormat = "' + String(p.fmt || 'General').replace(/"/g, '""') + '"');
          if ('wrap' in p) lineas.push('Selection.WrapText = ' + (p.wrap ? 'True' : 'False'));
          if ('estilo' in p && p.estilo) lineas.unshift('Selection.Style = "' + p.estilo + '"');
          lineas.forEach((l, i) => m.pasos.push({ tipo: 'estilo', props: i === 0 ? p : {}, vba: l }));
          break;
        }
        case 'bordes':
          m.pasos.push({ tipo: 'bordes', bordes: a.bordes, vba: a.bordes === 'contorno' ? 'Selection.BorderAround Weight:=xlThin' : a.bordes === 'inferior' ? 'Selection.Borders(xlEdgeBottom).LineStyle = xlContinuous' : 'Selection.Borders.LineStyle = xlContinuous' });
          break;
        case 'valor': {
          const p = R.parseCelda(a.celda);
          const esF = String(a.raw)[0] === '=';
          m.pasos.push({ tipo: 'valor', raw: a.raw, r: p.r, c: p.c, vba: 'ActiveCell.FormulaR1C1 = "' + (esF ? aR1C1(a.raw, p.r, p.c) : a.raw).replace(/"/g, '""') + '"' });
          break;
        }
        case 'autoajustar':
          m.pasos.push({ tipo: 'autoajustar', col: a.col, vba: 'Columns("' + a.col + ':' + a.col + '").EntireColumn.AutoFit' });
          break;
        case 'ancho':
          m.pasos.push({ tipo: 'ancho', col: a.col, ancho: a.ancho, vba: 'Columns("' + a.col + ':' + a.col + '").ColumnWidth = ' + (a.ancho / 7).toFixed(2) });
          break;
        case 'borrar':
          m.pasos.push({ tipo: 'borrar', vba: 'Selection.ClearContents' });
          break;
        case 'copiar': case 'cortar':
          m.pasos.push({ tipo: a.tipo, vba: a.tipo === 'copiar' ? 'Selection.Copy' : 'Selection.Cut' });
          break;
        case 'pegar': {
          const op = a.opciones || {};
          m.pasos.push({ tipo: 'pegar', opciones: op, vba: op.solo === 'valores' ? 'Selection.PasteSpecial Paste:=xlPasteValues' + (op.transponer ? ', Transpose:=True' : '') : op.solo === 'formatos' ? 'Selection.PasteSpecial Paste:=xlPasteFormats' : 'ActiveSheet.Paste' });
          break;
        }
        case 'insertarFilas':
          m.pasos.push({ tipo: 'insertarFilas', fila: a.fila, n: a.n, vba: 'Rows("' + a.fila + ':' + (a.fila + a.n - 1) + '").Insert Shift:=xlDown' });
          break;
        default: return;
      }
      mostrarCodigo(m);
    };
    hoja.on('accion', oyente);
    const ejecutar = (nombre) => {
      const m = hoja.macros[nombre];
      if (!m) return;
      const prev = grabando; grabando = null;
      let act = { r: hoja.sel.ar, c: hoja.sel.ac };
      for (const p of m.pasos) {
        if (p.tipo === 'sel') { act = { r: act.r + p.dr, c: act.c + p.dc }; hoja.seleccionar({ r1: act.r, c1: act.c, r2: act.r + p.alto, c2: act.c + p.ancho }, { silencioso: true }); }
        else if (p.tipo === 'selAbs') { const rg = R.parseRango(p.rango); act = { r: rg.r1, c: rg.c1 }; hoja.seleccionar(rg, { silencioso: true }); }
        else if (p.tipo === 'estilo' && Object.keys(p.props).length) hoja.aplicarEstilo(p.props);
        else if (p.tipo === 'bordes') hoja.aplicarBordes(p.bordes);
        else if (p.tipo === 'valor') {
          const raw = String(p.raw)[0] === '=' ? R.desplazarFormula(p.raw, hoja.sel.ar - p.r, hoja.sel.ac - p.c) : p.raw;
          hoja.establecer(R.dir(hoja.sel.ar, hoja.sel.ac), raw);
        } else if (p.tipo === 'borrar') hoja.borrarContenido();
        else if (p.tipo === 'copiar' || p.tipo === 'cortar') hoja.copiarInterno(p.tipo === 'cortar');
        else if (p.tipo === 'pegar') hoja.pegar(p.opciones || {});
        else if (p.tipo === 'insertarFilas') hoja.insertarFilas(p.fila - 1, p.n);
        else if (p.tipo === 'autoajustar') hoja.autoajustarColumna(R.colIndice(p.col));
        else if (p.tipo === 'ancho') { hoja.hj.anchos[R.colIndice(p.col)] = p.ancho; hoja.renderHoja(); }
      }
      grabando = prev;
      LT.ui.toast('Se ejecutó la macro «' + nombre + '».', 'ok');
      if (opts.alEjecutar) opts.alEjecutar(nombre, m);
    };
    hoja.on('ejecutarMacro', (nombre) => ejecutar(String(nombre).replace(/^\[0\]!/, '')));
    const dibujar = () => {
      panel.innerHTML = '';
      const btnRel = h('button', { class: 'herr-btn' + (relativas ? ' activo' : ''), title: 'Usar referencias relativas', disabled: grabando ? true : null, onclick: () => { relativas = !relativas; dibujar(); if (opts.alCambiar) opts.alCambiar({ relativas }); } }, LT.icono('precedentes', 16), 'Usar referencias relativas');
      if (!grabando) {
        panel.appendChild(h('button', { class: 'herr-btn', onclick: iniciar }, LT.icono('grabar', 16), 'Grabar macro'));
      } else {
        panel.appendChild(h('span', { class: 'hoja-grabando' }, 'Grabando «' + grabando.nombre + '»…'));
        panel.appendChild(h('button', { class: 'herr-btn', onclick: detener }, LT.icono('detener', 16), 'Detener grabación'));
      }
      panel.appendChild(btnRel);
      panel.appendChild(h('button', { class: 'herr-btn', disabled: grabando || !Object.keys(hoja.macros).length ? true : null, onclick: elegirYEjecutar }, LT.icono('ejecutar', 16), 'Macros (ejecutar)'));
      panel.appendChild(h('button', { class: 'herr-btn', disabled: grabando || !Object.keys(hoja.macros).length ? true : null, onclick: () => { const n = Object.keys(hoja.macros).pop(); mostrarCodigo(hoja.macros[n]); } }, LT.icono('codigo', 16), 'Ver código (VBA)'));
      panel.appendChild(h('button', { class: 'herr-btn', disabled: grabando ? true : null, onclick: () => hoja.agregarObjeto({ tipo: 'forma', forma: 'redondeado', texto: opts.textoBoton || 'Dar formato', w: 130, h: 40, relleno: '#1e7145', x: hoja.area.scrollLeft + 420, y: hoja.area.scrollTop + 12 }) }, LT.icono('forma', 16), 'Insertar botón'));
    };
    const iniciar = async () => {
      const nombre = h('input', { type: 'text', value: opts.nombreMacro || 'FormatoReporte' });
      const desc = h('input', { type: 'text', value: '' , placeholder: 'Qué hace la macro'});
      const r = await LT.ui.modal({ titulo: 'Grabar macro', cuerpo: h('div', null, h('label', null, 'Nombre de la macro'), nombre, h('label', null, 'Guardar macro en'), h('select', { disabled: true }, h('option', null, 'Este libro')), h('label', null, 'Descripción'), desc, h('p', { style: { fontSize: '.85rem', color: 'var(--tinta-2)' } }, relativas ? 'Referencias relativas: activadas. La macro repetirá los pasos a partir de la celda donde esté el cursor.' : 'Referencias absolutas: la macro siempre trabajará sobre las mismas celdas.')), botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: () => nombre.value.trim() }] });
      if (!r) return;
      if (!/^[A-Za-z_À-ɏ][A-Za-z0-9_À-ɏ]*$/.test(r)) { LT.ui.aviso('Nombre de macro no válido', 'El nombre debe empezar con letra y no puede tener espacios ni guiones. Ejemplo: FormatoReporte'); return; }
      grabando = { nombre: r, descripcion: desc.value.trim(), relativas, pasos: [] };
      estadoAntes.r = hoja.sel.ar; estadoAntes.c = hoja.sel.ac;
      hoja.raiz.classList.add('grabando');
      dibujar();
      mostrarCodigo(grabando);
      hoja.enfocar();
      if (opts.alCambiar) opts.alCambiar({ grabando: true });
    };
    const detener = () => {
      hoja.macros[grabando.nombre] = grabando;
      const m = grabando;
      grabando = null;
      hoja.raiz.classList.remove('grabando');
      dibujar();
      mostrarCodigo(m);
      LT.ui.toast('Macro «' + m.nombre + '» guardada con ' + m.pasos.length + ' pasos.', 'ok');
      if (opts.alGrabar) opts.alGrabar(m);
    };
    const elegirYEjecutar = async () => {
      const s = h('select', { size: 5, style: { width: '100%' } }, Object.keys(hoja.macros).map((n, i) => h('option', { value: n, selected: i === 0 ? true : null }, n)));
      const r = await LT.ui.modal({ titulo: 'Macro', cuerpo: h('div', null, h('label', null, 'Nombre de la macro'), s, h('p', { style: { fontSize: '.85rem', color: 'var(--tinta-2)' } }, 'Antes de ejecutar, coloca el cursor donde debe empezar (si grabaste con referencias relativas) y la hoja correcta.')), botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Ejecutar', primario: true, valor: () => s.value }] });
      if (r) ejecutar(r);
    };
    dibujar();
    return { ejecutar, macros: () => hoja.macros, vba, relativas: () => relativas };
  };
})();
