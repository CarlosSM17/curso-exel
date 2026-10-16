/* Simulador de tabla dinámica: lista de campos, áreas (Filtros, Columnas, Filas, Valores),
   agrupación de fechas, configuración del campo de valor, segmentaciones y gráfico dinámico. */
(function () {
  'use strict';
  const LT = window.LT;
  const { h } = LT.u;
  const F = LT.formato;
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const FUNCIONES = { suma: 'Suma', cuenta: 'Cuenta', promedio: 'Promedio', max: 'Máx.', min: 'Mín.' };
  const MOSTRAR = { ninguno: 'Sin cálculo', pctTotal: '% del total general', pctColumna: '% del total de columnas', pctFila: '% del total de filas' };
  const AREAS = [['filtros', 'Filtros'], ['columnas', 'Columnas'], ['filas', 'Filas'], ['valores', 'Valores']];

  function claveFecha(iso, nivel) {
    const [y, m] = String(iso).split('-').map(Number);
    if (nivel === 'anios') return { k: String(y), o: y };
    if (nivel === 'trimestres') { const q = Math.floor((m - 1) / 3) + 1; return { k: 'Trim.' + q, o: q }; }
    if (nivel === 'meses') return { k: MESES[m - 1], o: m };
    if (nivel === 'dias') return { k: iso.slice(8, 10) + '-' + MESES[m - 1], o: m * 100 + +iso.slice(8, 10) };
    return { k: iso, o: iso };
  }

  /* opts: {datos:[{}], campos:[{nombre,tipo,formato}], estado, segmentaciones:[campo], grafico:bool, alCambiar} */
  function TablaDinamica(cont, opts) {
    const campos = opts.campos;
    const campo = (n) => campos.find((c) => c.nombre === n);
    let est = normalizar(opts.estado || {});
    const segm = {};
    (opts.segmentaciones || []).forEach((n) => { segm[n] = null; });
    let tipoGrafico = 'columnas';

    function normalizar(e) {
      return {
        filas: (e.filas || []).map((x) => (typeof x === 'string' ? { campo: x } : x)),
        columnas: (e.columnas || []).map((x) => (typeof x === 'string' ? { campo: x } : x)),
        valores: (e.valores || []).map((x) => (typeof x === 'string' ? { campo: x, funcion: 'suma', mostrarComo: 'ninguno' } : Object.assign({ funcion: 'suma', mostrarComo: 'ninguno' }, x))),
        filtros: (e.filtros || []).map((x) => (typeof x === 'string' ? { campo: x, valores: null } : x)),
      };
    }

    cont.innerHTML = '';
    const panel = h('div', { class: 'pd-panel' });
    const salida = h('div');
    cont.appendChild(h('div', { class: 'pd' }, panel, salida));

    /* ---------------------------------------------- panel de campos */
    function enUso(n) { return ['filas', 'columnas', 'valores', 'filtros'].some((a) => est[a].some((x) => x.campo === n)); }
    function quitar(area, i) { est[area].splice(i, 1); render(); }
    function mover(campoN, desdeArea, desdeIdx, haciaArea, haciaIdx) {
      let item;
      if (desdeArea && desdeArea !== 'lista') item = est[desdeArea].splice(desdeIdx, 1)[0];
      const c = campo(campoN);
      if (haciaArea === 'lista') { render(); return; }
      if (haciaArea === 'valores') item = { campo: campoN, funcion: c.tipo === 'numero' ? 'suma' : 'cuenta', mostrarComo: 'ninguno' };
      else if (haciaArea === 'filtros') item = { campo: campoN, valores: null };
      else {
        item = { campo: campoN };
        if (c.tipo === 'fecha') item.agrupar = (desdeArea && desdeArea !== 'lista' && item.agrupar) || ['meses'];
        // un campo de texto no puede estar a la vez en filas y columnas
        for (const a of ['filas', 'columnas']) est[a] = est[a].filter((x) => x.campo !== campoN);
      }
      const destino = est[haciaArea];
      destino.splice(haciaIdx == null ? destino.length : haciaIdx, 0, item);
      if (opts.alAccion) opts.alAccion({ tipo: 'mover', campo: campoN, area: haciaArea });
      render();
    }
    function render() {
      renderPanel();
      renderSalida();
      if (opts.alCambiar) opts.alCambiar(estado(), resultado());
    }
    function renderPanel() {
      panel.innerHTML = '';
      panel.appendChild(h('h4', null, 'Campos de tabla dinámica'));
      panel.appendChild(h('div', { style: { padding: '4px 10px 0', fontSize: '11.5px', color: '#605e5c' } }, 'Selecciona campos o arrástralos a las áreas de abajo.'));
      const lista = h('div', { class: 'pd-campos' });
      for (const c of campos) {
        const cb = h('input', { type: 'checkbox', checked: enUso(c.nombre) ? true : null, 'aria-label': c.nombre });
        cb.addEventListener('change', () => {
          if (cb.checked) mover(c.nombre, null, null, c.tipo === 'numero' ? 'valores' : 'filas');
          else { for (const a of ['filas', 'columnas', 'valores', 'filtros']) est[a] = est[a].filter((x) => x.campo !== c.nombre); render(); }
        });
        const fila = h('label', { class: 'pd-campo', draggable: 'true' }, cb, c.nombre);
        fila.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', JSON.stringify({ campo: c.nombre, area: 'lista' })); });
        lista.appendChild(fila);
      }
      panel.appendChild(lista);
      const areas = h('div', { class: 'pd-areas' });
      for (const [id, nombre] of AREAS) {
        const zona = h('div', { class: 'pd-area', dataset: { area: id } }, h('div', { class: 't' }, (id === 'filtros' ? '▼ ' : id === 'columnas' ? '‖ ' : id === 'filas' ? '≡ ' : 'Σ ') + nombre));
        est[id].forEach((it, i) => {
          const texto = id === 'valores' ? FUNCIONES[it.funcion] + ' de ' + it.campo + (it.mostrarComo !== 'ninguno' ? ' (%)' : '') : it.campo + (it.agrupar ? ' (' + it.agrupar.join(', ') + ')' : '');
          const ficha = h('div', { class: 'pd-ficha', draggable: 'true', title: 'Arrastra para mover; menú para opciones' },
            h('span', null, texto),
            h('button', { title: 'Opciones', 'aria-label': 'Opciones de ' + it.campo, onclick: (e) => menuFicha(e, id, i) }, '▾'));
          ficha.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', JSON.stringify({ campo: it.campo, area: id, idx: i })); });
          zona.appendChild(ficha);
        });
        zona.addEventListener('dragover', (e) => { e.preventDefault(); zona.classList.add('encima'); });
        zona.addEventListener('dragleave', () => zona.classList.remove('encima'));
        zona.addEventListener('drop', (e) => {
          e.preventDefault(); zona.classList.remove('encima');
          try { const d = JSON.parse(e.dataTransfer.getData('text/plain')); mover(d.campo, d.area, d.idx, id); } catch (err) { /* */ }
        });
        areas.appendChild(zona);
      }
      panel.appendChild(areas);
      lista.addEventListener('dragover', (e) => e.preventDefault());
      lista.addEventListener('drop', (e) => { e.preventDefault(); try { const d = JSON.parse(e.dataTransfer.getData('text/plain')); if (d.area !== 'lista') quitar(d.area, d.idx); } catch (err) { /* */ } });
    }
    function menuFicha(e, area, i) {
      const it = est[area][i];
      const c = campo(it.campo);
      const items = [];
      for (const [a, n] of AREAS) if (a !== area) items.push({ texto: 'Mover a ' + n, accion: () => mover(it.campo, area, i, a) });
      if (area === 'valores') items.push({ texto: 'Configuración de campo de valor…', accion: () => configValor(i) });
      if ((area === 'filas' || area === 'columnas') && c.tipo === 'fecha') items.push({ texto: 'Agrupar…', accion: () => agrupar(area, i) });
      if (area === 'filtros') items.push({ texto: 'Elegir elementos…', accion: () => elegirFiltro(i) });
      items.push({ texto: 'Quitar campo', accion: () => quitar(area, i) });
      menu(e, items);
    }
    function menu(e, items) {
      document.querySelectorAll('.hoja-menu.flotante').forEach((m) => m.remove());
      const m = h('div', { class: 'hoja-menu flotante' });
      for (const it of items) m.appendChild(h('div', { class: 'menu-item', onmousedown: (ev) => { ev.preventDefault(); m.remove(); it.accion(); } }, it.texto));
      m.style.left = e.clientX + 'px'; m.style.top = e.clientY + 'px';
      document.body.appendChild(m);
      const r = m.getBoundingClientRect();
      if (r.right > innerWidth) m.style.left = innerWidth - r.width - 6 + 'px';
      if (r.bottom > innerHeight) m.style.top = e.clientY - r.height + 'px';
      const cerrar = (ev) => { if (!m.contains(ev.target)) { m.remove(); document.removeEventListener('mousedown', cerrar, true); } };
      setTimeout(() => document.addEventListener('mousedown', cerrar, true), 0);
    }
    async function configValor(i) {
      const it = est.valores[i];
      const f = h('select', null, Object.entries(FUNCIONES).map(([k, n]) => h('option', { value: k, selected: k === it.funcion ? true : null }, n)));
      const m = h('select', null, Object.entries(MOSTRAR).map(([k, n]) => h('option', { value: k, selected: k === it.mostrarComo ? true : null }, n)));
      const r = await LT.ui.modal({ titulo: 'Configuración de campo de valor', cuerpo: h('div', null, h('p', null, 'Nombre del origen: ', h('b', null, it.campo)), h('label', null, 'Resumir campo de valor por'), f, h('label', null, 'Mostrar valores como'), m), botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: 'ok' }] });
      if (!r) return;
      it.funcion = f.value; it.mostrarComo = m.value;
      if (opts.alAccion) opts.alAccion({ tipo: 'configValor', campo: it.campo, funcion: it.funcion, mostrarComo: it.mostrarComo });
      render();
    }
    async function agrupar(area, i) {
      const it = est[area][i];
      const niveles = [['dias', 'Días'], ['meses', 'Meses'], ['trimestres', 'Trimestres'], ['anios', 'Años']];
      const cajas = niveles.map(([k, n]) => h('label', { class: 'en-linea' }, h('input', { type: 'checkbox', value: k, checked: (it.agrupar || []).includes(k) ? true : null }), n));
      const r = await LT.ui.modal({ titulo: 'Agrupar', cuerpo: h('div', null, h('p', null, 'Por (puedes elegir varios):'), cajas), botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: () => cajas.map((c) => c.querySelector('input')).filter((x) => x.checked).map((x) => x.value) }] });
      if (!r) return;
      const orden = ['anios', 'trimestres', 'meses', 'dias'];
      it.agrupar = r.length ? orden.filter((x) => r.includes(x)) : null;
      if (opts.alAccion) opts.alAccion({ tipo: 'agrupar', campo: it.campo, por: it.agrupar });
      render();
    }
    async function elegirFiltro(i) {
      const it = est.filtros[i];
      const vals = Array.from(new Set(opts.datos.map((d) => String(d[it.campo])))).sort();
      const cajas = vals.map((v) => h('label', { class: 'en-linea' }, h('input', { type: 'checkbox', value: v, checked: !it.valores || it.valores.includes(v) ? true : null }), v));
      const r = await LT.ui.modal({ titulo: 'Filtrar: ' + it.campo, cuerpo: h('div', { style: { maxHeight: '320px', overflow: 'auto' } }, cajas), botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: () => cajas.map((c) => c.querySelector('input')).filter((x) => x.checked).map((x) => x.value) }] });
      if (!r) return;
      it.valores = r.length === vals.length ? null : r;
      render();
    }

    /* -------------------------------------------------------- cálculo */
    function niveles(items) {
      // cada elemento de filas/columnas aporta uno o varios niveles
      const out = [];
      for (const it of items) {
        const c = campo(it.campo);
        if (c.tipo === 'fecha' && it.agrupar && it.agrupar.length) for (const g of it.agrupar) out.push({ campo: it.campo, grupo: g, etiqueta: { anios: 'Años', trimestres: 'Trimestres', meses: 'Meses', dias: 'Días' }[g] });
        else out.push({ campo: it.campo, grupo: null, etiqueta: it.campo });
      }
      return out;
    }
    function claveDe(d, nv) {
      const v = d[nv.campo];
      if (nv.grupo) return claveFecha(v, nv.grupo);
      return { k: v == null || v === '' ? '(en blanco)' : String(v), o: typeof v === 'number' ? v : String(v).toLocaleLowerCase('es') };
    }
    function filtrados() {
      return opts.datos.filter((d) => {
        for (const f of est.filtros) if (f.valores && !f.valores.includes(String(d[f.campo]))) return false;
        for (const [n, vals] of Object.entries(segm)) if (vals && !vals.includes(String(d[n]))) return false;
        return true;
      });
    }
    function agregar(lista, campoN, fn) {
      if (fn === 'cuenta') return lista.length;
      const nums = lista.map((d) => d[campoN]).filter((v) => typeof v === 'number');
      if (fn === 'suma') return nums.reduce((a, b) => a + b, 0);
      if (!nums.length) return null;
      if (fn === 'promedio') return nums.reduce((a, b) => a + b, 0) / nums.length;
      if (fn === 'max') return Math.max(...nums);
      if (fn === 'min') return Math.min(...nums);
      return null;
    }
    function ordenarClaves(mapa) { return Array.from(mapa.values()).sort((a, b) => (a.o < b.o ? -1 : a.o > b.o ? 1 : 0)).map((x) => x.k); }
    /* Resultado: {filas:[[clave nivel1, clave nivel2…]], columnas:[clave], valores:{filaKey:{colKey:{vi: v}}}, ...} */
    function resultado() {
      const datos = filtrados();
      const nf = niveles(est.filas), nc = niveles(est.columnas);
      const vals = est.valores;
      const res = { nivelesFilas: nf.map((x) => x.etiqueta), nivelesColumnas: nc.map((x) => x.etiqueta), valores: vals.map((v) => ({ nombre: FUNCIONES[v.funcion] + ' de ' + v.campo, campo: v.campo, funcion: v.funcion, mostrarComo: v.mostrarComo })), filas: [], columnas: [], celdas: {}, totalFila: {}, totalColumna: {}, total: [] };
      if (!vals.length && !nf.length && !nc.length) return res;
      // claves únicas (ordenadas)
      const clavesF = new Map(), clavesC = new Map();
      for (const d of datos) {
        const kf = nf.map((nv) => claveDe(d, nv));
        const kc = nc.map((nv) => claveDe(d, nv));
        const sf = kf.map((x) => x.k).join(' › '), sc = kc.map((x) => x.k).join(' › ');
        if (!clavesF.has(sf)) clavesF.set(sf, { k: sf, o: kf.map((x) => (typeof x.o === 'number' ? String(x.o).padStart(10, '0') : x.o)).join('\u0001') });
        if (!clavesC.has(sc)) clavesC.set(sc, { k: sc, o: kc.map((x) => (typeof x.o === 'number' ? String(x.o).padStart(10, '0') : x.o)).join('\u0001') });
      }
      res.filas = ordenarClaves(clavesF);
      res.columnas = ordenarClaves(clavesC);
      const grupos = {};
      for (const d of datos) {
        const sf = nf.map((nv) => claveDe(d, nv).k).join(' › '), sc = nc.map((nv) => claveDe(d, nv).k).join(' › ');
        ((grupos[sf] = grupos[sf] || {})[sc] = grupos[sf][sc] || []).push(d);
      }
      const porFila = {}, porCol = {};
      for (const d of datos) {
        const sf = nf.map((nv) => claveDe(d, nv).k).join(' › '), sc = nc.map((nv) => claveDe(d, nv).k).join(' › ');
        (porFila[sf] = porFila[sf] || []).push(d);
        (porCol[sc] = porCol[sc] || []).push(d);
      }
      vals.forEach((v, vi) => {
        const total = agregar(datos, v.campo, v.funcion);
        res.total[vi] = total;
        for (const f of res.filas) {
          res.celdas[f] = res.celdas[f] || {};
          for (const c of res.columnas) {
            const lista = (grupos[f] || {})[c] || [];
            (res.celdas[f][c] = res.celdas[f][c] || [])[vi] = lista.length ? agregar(lista, v.campo, v.funcion) : null;
          }
          (res.totalFila[f] = res.totalFila[f] || [])[vi] = agregar(porFila[f] || [], v.campo, v.funcion);
        }
        for (const c of res.columnas) (res.totalColumna[c] = res.totalColumna[c] || [])[vi] = agregar(porCol[c] || [], v.campo, v.funcion);
        // mostrar valores como porcentaje
        if (v.mostrarComo !== 'ninguno') {
          const div = (x, base) => (x == null || !base ? null : x / base);
          for (const f of res.filas) {
            for (const c of res.columnas) {
              const x = res.celdas[f][c][vi];
              res.celdas[f][c][vi] = v.mostrarComo === 'pctTotal' ? div(x, total) : v.mostrarComo === 'pctColumna' ? div(x, res.totalColumna[c][vi]) : div(x, res.totalFila[f][vi]);
            }
            const tf = res.totalFila[f][vi];
            res.totalFila[f][vi] = v.mostrarComo === 'pctTotal' ? div(tf, total) : v.mostrarComo === 'pctColumna' ? div(tf, total) : 1;
          }
          for (const c of res.columnas) { const tc = res.totalColumna[c][vi]; res.totalColumna[c][vi] = v.mostrarComo === 'pctFila' ? div(tc, total) : v.mostrarComo === 'pctColumna' ? 1 : div(tc, total); }
          res.total[vi] = 1;
        }
      });
      return res;
    }
    function formatoValor(v) {
      if (v.mostrarComo !== 'ninguno') return '0.00%';
      if (v.funcion === 'cuenta') return '#,##0';
      const c = campo(v.campo);
      return (c && c.formato) || '#,##0.00';
    }

    /* -------------------------------------------------------- salida */
    function renderSalida() {
      salida.innerHTML = '';
      // segmentaciones
      if (Object.keys(segm).length) {
        const fila = h('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' } });
        for (const n of Object.keys(segm)) {
          const vals = Array.from(new Set(opts.datos.map((d) => String(d[n])))).sort();
          const caja = h('div', { class: 'segmentacion', role: 'group', 'aria-label': 'Segmentación ' + n },
            h('div', { class: 't' }, n, h('button', { class: 'btn chico fantasma', style: { padding: '0 4px' }, title: 'Borrar filtro', onclick: () => { segm[n] = null; render(); } }, '⨯')));
          for (const v of vals) {
            const on = !segm[n] || segm[n].includes(v);
            caja.appendChild(h('button', { class: 'item' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false', onclick: (e) => {
              const actual = segm[n] || [];
              if (e.ctrlKey || e.metaKey) segm[n] = actual.includes(v) ? actual.filter((x) => x !== v) : actual.concat(v);
              else segm[n] = segm[n] && segm[n].length === 1 && segm[n][0] === v ? null : [v];
              if (segm[n] && !segm[n].length) segm[n] = null;
              if (opts.alAccion) opts.alAccion({ tipo: 'segmentacion', campo: n, valores: segm[n] });
              render();
            } }, v));
          }
          fila.appendChild(caja);
        }
        salida.appendChild(fila);
      }
      const cajaTabla = h('div', { class: 'pd-salida' });
      salida.appendChild(cajaTabla);
      // filtros de informe arriba
      if (est.filtros.length) {
        const fl = h('div', { class: 'pd-filtros' });
        est.filtros.forEach((f, i) => fl.appendChild(h('button', { class: 'btn chico', onclick: () => elegirFiltro(i) }, f.campo + ': ' + (f.valores ? (f.valores.length === 1 ? f.valores[0] : '(varios elementos)') : '(Todas)') + ' ▾')));
        cajaTabla.appendChild(fl);
      }
      const res = resultado();
      if (!est.valores.length && !est.filas.length && !est.columnas.length) {
        cajaTabla.appendChild(h('div', { class: 'pd-vacia' }, 'Para generar un informe, elige campos de la lista de campos de la tabla dinámica.'));
        return;
      }
      const vals = est.valores;
      const t = h('table');
      const thead = h('thead');
      const multiV = vals.length > 1;
      const colsK = res.columnas;
      const conCol = res.nivelesColumnas.length > 0;
      // encabezado
      const tr1 = h('tr');
      tr1.appendChild(h('th', null, res.nivelesFilas.length ? 'Etiquetas de fila' : ''));
      if (conCol) {
        for (const c of colsK) for (const v of (vals.length ? vals : [null])) tr1.appendChild(h('th', null, multiV ? c + ' · ' + FUNCIONES[v.funcion] + ' de ' + v.campo : c));
        for (const v of vals) tr1.appendChild(h('th', null, multiV ? 'Total ' + FUNCIONES[v.funcion] + ' de ' + v.campo : 'Total general'));
      } else for (const v of vals) tr1.appendChild(h('th', null, FUNCIONES[v.funcion] + ' de ' + v.campo));
      if (conCol && vals.length === 1) thead.appendChild(h('tr', null, h('th', null, FUNCIONES[vals[0].funcion] + ' de ' + vals[0].campo), h('th', { colspan: colsK.length + 1 }, 'Etiquetas de columna')));
      thead.appendChild(tr1);
      t.appendChild(thead);
      const tb = h('tbody');
      const celda = (v, vi) => h('td', { class: 'n' }, v == null ? '' : F.formatear(v, formatoValor(vals[vi])).texto);
      const filasK = res.filas.length ? res.filas : [''];
      // filas con subtotales para el primer nivel cuando hay 2 niveles
      const dosNiveles = res.nivelesFilas.length >= 2;
      let previo = null;
      for (const f of filasK) {
        if (dosNiveles) {
          const ext = f.split(' › ')[0];
          if (ext !== previo) {
            previo = ext;
            const sub = filasK.filter((x) => x.split(' › ')[0] === ext);
            const tr = h('tr', { style: { fontWeight: 700 } }, h('th', { style: { fontWeight: 700 } }, ext));
            const sumar = (getter) => vals.map((v, vi) => { const xs = sub.map((x) => getter(x, vi)).filter((y) => typeof y === 'number'); return xs.length ? (v.funcion === 'max' ? Math.max(...xs) : v.funcion === 'min' ? Math.min(...xs) : v.funcion === 'promedio' ? null : xs.reduce((a, b) => a + b, 0)) : null; });
            if (conCol) for (const c of colsK) sumar((x, vi) => res.celdas[x][c][vi]).forEach((y, vi) => tr.appendChild(celda(y, vi)));
            sumar((x, vi) => res.totalFila[x][vi]).forEach((y, vi) => tr.appendChild(celda(y, vi)));
            tb.appendChild(tr);
          }
        }
        const etiqueta = dosNiveles ? f.split(' › ').slice(1).join(' › ') : f;
        const tr = h('tr', null, h('th', { style: dosNiveles ? { paddingLeft: '22px' } : null }, etiqueta || (res.nivelesFilas.length ? '' : 'Total')));
        if (conCol) for (const c of colsK) vals.forEach((v, vi) => tr.appendChild(celda((res.celdas[f] && res.celdas[f][c] || [])[vi], vi)));
        vals.forEach((v, vi) => { const td = celda((res.totalFila[f] || [])[vi], vi); if (conCol) td.classList.add('total-col'); tr.appendChild(td); });
        tb.appendChild(tr);
      }
      if (res.nivelesFilas.length) {
        const tr = h('tr', { class: 'total' }, h('th', null, 'Total general'));
        if (conCol) for (const c of colsK) vals.forEach((v, vi) => tr.appendChild(celda(res.totalColumna[c][vi], vi)));
        vals.forEach((v, vi) => tr.appendChild(celda(res.total[vi], vi)));
        tb.appendChild(tr);
      }
      t.appendChild(tb);
      cajaTabla.appendChild(t);
      // gráfico dinámico
      if (opts.grafico && vals.length) {
        const g = h('div', { class: 'graf-cont', style: { marginTop: '12px' } });
        const tipos = h('div', { class: 'graf-opciones' });
        for (const [id, n] of [['columnas', 'Columnas'], ['barras', 'Barras'], ['lineas', 'Líneas'], ['circular', 'Circular']]) tipos.appendChild(h('button', { class: 'graf-tipo' + (tipoGrafico === id ? ' activo' : ''), onclick: () => { tipoGrafico = id; if (opts.alAccion) opts.alAccion({ tipo: 'tipoGrafico', valor: id }); renderSalida(); } }, n));
        const lienzo = h('div');
        g.append(h('div', { style: { fontWeight: 600, fontSize: '.88rem' } }, 'Gráfico dinámico (conectado a la tabla)'), tipos, lienzo);
        salida.appendChild(g);
        const series = conCol ? colsK.map((c) => ({ nombre: c, valores: res.filas.map((f) => (res.celdas[f][c] || [])[0]) })) : [{ nombre: res.valores[0].nombre, valores: res.filas.map((f) => res.totalFila[f][0]) }];
        LT.graficos.dibujar(lienzo, { tipo: tipoGrafico, categorias: res.filas.map((f) => f || 'Total'), series, titulo: res.valores[0].nombre + (res.nivelesFilas.length ? ' por ' + res.nivelesFilas.join(' y ') : ''), formato: formatoValor(vals[0]), alto: 300 });
      }
    }
    function estado() { return JSON.parse(JSON.stringify(Object.assign({}, est, { segmentaciones: segm, tipoGrafico }))); }
    render();
    return { estado, resultado, establecer: (e) => { est = normalizar(e); render(); } };
  }

  LT.TablaDinamica = TablaDinamica;
  LT.dinamica = { claveFecha, FUNCIONES, MOSTRAR };
})();
