/* Módulo 13 · Tablas dinámicas */
(function () {
  const { D, filasDinamica, CAMPOS_DINAMICA, lideresTrimestre, trimestre, totalesPor } = LT.caso;
  const topCat = Object.entries(totalesPor('categoria')).sort((a, b) => b[1] - a[1])[0][0];
  const DATOS = filasDinamica();
  const LIDERES = lideresTrimestre();
  const norteQ = [1, 2, 3, 4].map((q) => D.ventas.filter((v) => v.sucursal === 'Norte' && trimestre(v.fecha) === q).reduce((s, v) => s + v.total, 0));
  const mejorQNorte = 'Trim.' + (norteQ.indexOf(Math.max(...norteQ)) + 1);
  const pivote = (c, estado, extra) => LT.TablaDinamica(c, Object.assign({ datos: DATOS, campos: CAMPOS_DINAMICA, estado }, extra || {}));

  function crearReto(cont, nivel) {
    const { h } = LT.u;
    let est = null;
    const preguntas = {};
    const zona = h('div');
    const caja = h('div', { class: 'aviso-caja info' });
    cont.append(zona, caja);
    if (nivel === 'experto') {
      caja.append('Con los valores como % del total de columnas: ¿en qué trimestre obtuvo Norte el mayor porcentaje de sus ventas del año? ', h('select', { class: 'herr-sel', onchange: (e) => { preguntas.q = e.target.value; } }, h('option', { value: '' }, 'Elige…'), ['Trim.1', 'Trim.2', 'Trim.3', 'Trim.4'].map((t) => h('option', { value: t }, t))));
    } else {
      caja.append(h('div', { style: { marginBottom: '6px' } }, 'Según tu tabla dinámica, ¿qué sucursal vendió más en cada trimestre?'));
      const fila = h('div', { class: 'grupo-btn' });
      for (let q = 1; q <= 4; q++) fila.appendChild(h('label', null, 'T' + q + ': ', h('select', { class: 'herr-sel', onchange: (e) => { preguntas['t' + q] = e.target.value; } }, h('option', { value: '' }, '—'), ['Centro', 'Norte', 'Sur'].map((s) => h('option', { value: s }, s)))));
      caja.appendChild(fila);
    }
    setTimeout(() => pivote(zona, nivel === 'explorador' ? { filas: [{ campo: 'Fecha', agrupar: ['trimestres'] }] } : {}, { alCambiar: (e) => { est = e; } }), 0);
    return {
      verificar: () => {
        const r = [];
        const add = (ok, titulo, mensaje) => r.push({ ok, titulo, mensaje: ok ? titulo : mensaje });
        const e = est || { filas: [], columnas: [], valores: [] };
        const f = e.filas[0];
        add(e.filas.length === 1 && f.campo === 'Fecha' && (f.agrupar || []).includes('trimestres') && !(f.agrupar || []).includes('meses') && !(f.agrupar || []).includes('dias'), 'Filas: la fecha agrupada por trimestres', 'En Filas pon solo el campo Fecha, agrupado por Trimestres (menú ▾ de la ficha › Agrupar…).');
        add(e.columnas.length === 1 && e.columnas[0].campo === 'Sucursal', 'Columnas: Sucursal', 'Pon el campo Sucursal en Columnas.');
        const v = e.valores[0];
        add(e.valores.length === 1 && v.campo === 'Total' && v.funcion === 'suma', 'Valores: Suma de Total', 'En Valores pon «Suma de Total» (no Precio ni Cantidad).');
        if (nivel === 'experto') {
          add(v && v.mostrarComo === 'pctColumna', 'Valores como % del total de columnas', 'Configura el campo de valor: Mostrar valores como › % del total de columnas.');
          add(preguntas.q === mejorQNorte, 'Respuesta correcta', preguntas.q ? 'Revisa la columna Norte: el porcentaje más alto no está en ' + preguntas.q + '.' : 'Responde la pregunta.');
        } else {
          for (let q = 1; q <= 4; q++) add(preguntas['t' + q] === LIDERES[q - 1], 'Trimestre ' + q + ': ' + LIDERES[q - 1], preguntas['t' + q] ? 'Trimestre ' + q + ': revisa la fila Trim.' + q + ', la sucursal con el número más alto no es ' + preguntas['t' + q] + '.' : 'Responde qué sucursal vendió más en el trimestre ' + q + '.');
        }
        return { ok: r.every((x) => x.ok), resultados: r };
      },
    };
  }

  LT.definirModulo({
    id: 13,
    objetivo: 'Resumir cientos de filas por categoría, periodo y sucursal; agrupar fechas y calcular porcentajes.',
    situacion: 'Tengo las ' + D.ventas.length + ' ventas del año en una lista. Quiero saber <b>qué sucursal vende más cada trimestre</b>, sin sumar a mano.',
    explicacion: [
      { html: '<h3>Resumir arrastrando campos</h3><p>Una <b>tabla dinámica</b> (Insertar › Tabla dinámica) resume una lista grande sin escribir fórmulas. Cada columna de la lista es un <b>campo</b>; lo arrastras a un <b>área</b>:</p><ul><li><b>Filas:</b> una fila por cada valor distinto (por ejemplo, cada sucursal).</li><li><b>Columnas:</b> una columna por cada valor distinto.</li><li><b>Valores:</b> lo que se calcula: suma, cuenta, promedio… y puede mostrarse como % del total.</li><li><b>Filtros:</b> limita los datos de todo el informe.</li></ul><p>Las <b>fechas</b> se agrupan en meses, trimestres o años. Si cambian los datos de origen, hay que pulsar <b>Actualizar</b>.</p>' },
      { widget: 'agrupacion', titulo: 'Qué hace por dentro: agrupar y sumar', instr: 'Estas son 12 ventas sueltas. Pulsa el botón y mira cómo la tabla dinámica las agrupa por sucursal y suma sus totales.', opts: { campo: 'sucursal', filas: D.ventas.slice(0, 12).map((v) => ({ grupo: v.sucursal, etiqueta: v.producto + ' · ' + LT.caso.fecha(v.fecha), valor: v.total })) } },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Ventas por sucursal en cuatro pasos',
      widget: (c) => pivote(c, { filas: ['Sucursal'], valores: ['Total'] }),
      pasos: ['Haz clic en una celda de la lista de ventas.', { texto: 'Insertar › Tabla dinámica › Aceptar (en una hoja nueva).', ruta: ['Insertar', 'Tabla dinámica'] }, 'En la lista de campos, arrastra Sucursal a Filas.', 'Arrastra Total a Valores: aparece «Suma de Total» por sucursal (arriba puedes probarlo).'],
      pregunta: { texto: 'En la tabla de arriba, si arrastras <b>Categoría</b> al área de <b>Columnas</b>, ¿cuántas columnas de datos aparecen (sin contar el Total general)?', opciones: ['3', '6', '20', '1'], correcta: 1, explicacion: 'Una columna por cada categoría distinta: hay <b>6</b> categorías (Café caliente, Café frío, Té, Panadería, Postres y Alimentos).' },
    },
    micro: [
      { titulo: 'Contar en lugar de sumar', tipo: 'widget', enunciado: '¿Cuántos <b>registros de venta</b> tuvo cada sucursal? Arma la tabla con Sucursal en Filas y un campo en Valores resumido por <b>Cuenta</b>.',
        crear: (c, listo) => { const info = LT.u.h('div', { class: 'retro' }); const z = LT.u.h('div'); c.append(z, info); pivote(z, {}, { alCambiar: (e) => { const ok = e.filas.length === 1 && e.filas[0].campo === 'Sucursal' && e.valores.length === 1 && e.valores[0].funcion === 'cuenta'; info.innerHTML = ''; if (ok) { info.appendChild(LT.u.h('div', { class: 'aviso-caja ok' }, '✓ Cada sucursal tiene 240 registros: la cuenta no suma importes, cuenta filas.')); listo(); } } }); },
      },
      { titulo: 'Porcentaje del total', tipo: 'widget', enunciado: 'Muestra qué <b>porcentaje de las ventas</b> aporta cada categoría: Categoría en Filas y Total en Valores, mostrado como <b>% del total general</b>.',
        crear: (c, listo) => { const info = LT.u.h('div', { class: 'retro' }); const z = LT.u.h('div'); c.append(z, info); pivote(z, {}, { alCambiar: (e) => { const ok = e.filas.length === 1 && e.filas[0].campo === 'Categoría' && e.valores.length === 1 && e.valores[0].campo === 'Total' && e.valores[0].mostrarComo === 'pctTotal'; info.innerHTML = ''; if (ok) { info.appendChild(LT.u.h('div', { class: 'aviso-caja ok' }, '✓ Los porcentajes suman 100 %. La categoría que más aporta es ' + topCat + '.')); listo(); } } }); },
      },
      { titulo: 'Datos nuevos', tipo: 'opcion', enunciado: 'Agregaste ventas nuevas a la lista de origen, pero la tabla dinámica sigue mostrando los totales anteriores. ¿Qué falta?', opciones: ['Actualizar la tabla dinámica', 'Volver a guardar el archivo', 'Borrar la tabla y hacerla de nuevo', 'Usar SUMA en lugar de la tabla dinámica'], correcta: 0, explicacion: 'Las tablas dinámicas no se recalculan solas: <b>Análisis de tabla dinámica › Actualizar</b> (o clic derecho › Actualizar). Si los datos están en una tabla de Excel, la tabla dinámica incluye también las filas nuevas.' },
    ],
    reto: { titulo: '¿Qué sucursal vende más cada trimestre?', tipo: 'widget', crear: crearReto,
      base: { instrucciones: ['Arma una tabla dinámica con los <b>trimestres</b> en Filas (agrupa la Fecha), las <b>sucursales</b> en Columnas y la <b>suma del Total</b> en Valores.', 'Responde qué sucursal vendió más en cada trimestre.'], pistas: ['Piensa qué va en cada área: lo que quieres comparar en filas y columnas, y lo que quieres sumar en valores.', 'Al poner Fecha en Filas se agrupa por meses: en su menú ▾ elige «Agrupar…» y marca solo Trimestres.', 'Filas: Fecha (Trimestres) · Columnas: Sucursal · Valores: Suma de Total.'] },
      niveles: { explorador: { instrucciones: ['La Fecha ya está en Filas agrupada por trimestres.', 'Arrastra <b>Sucursal</b> al área Columnas.', 'Marca <b>Total</b> (se va a Valores como «Suma de Total»).', 'Lee cada fila y responde.'] }, experto: { instrucciones: ['Arma la tabla del nivel Analista (Fecha por trimestres en Filas, Sucursal en Columnas, Suma de Total en Valores).', 'Muestra los valores como <b>% del total de columnas</b> (cuánto aporta cada trimestre al año de cada sucursal) y responde la pregunta.'] } } },
    lab: {
      archivo: 'lab13-ventas-2025.xlsx', titulo: 'Tabla dinámica en Excel',
      contexto: 'La hoja Ventas tiene las ' + D.ventas.length + ' ventas de 2025. La hoja Respuestas es para tus conclusiones.',
      pasos: {
        explorador: [{ texto: 'Haz clic en la lista › Insertar › Tabla dinámica › Nueva hoja de cálculo.', ruta: ['Insertar', 'Tabla dinámica'] }, 'Arrastra Fecha a Filas; clic derecho en una fecha › Agrupar › solo Trimestres.', 'Sucursal a Columnas y Total a Valores (Suma).', 'En Respuestas, escribe en B2:B5 la sucursal que más vendió en cada trimestre.', 'Guarda y sube el libro.'],
        analista: ['Tabla dinámica: trimestres en filas, sucursales en columnas, suma de Total en valores.', 'Escribe en Respuestas!B2:B5 la sucursal líder de cada trimestre.', 'Guarda y sube el libro.'],
        experto: ['Lo del nivel Analista.', 'Una segunda tabla dinámica con Categoría en filas y Total como % del total general.', 'Guarda y sube el libro.'],
      },
      notaWeb: 'Excel para la web permite crear tablas dinámicas y agrupar fechas.',
      pruebas: [
        { titulo: 'Tabla dinámica por trimestre y sucursal', fn: (L) => {
          const t = L.dinamicas;
          if (!t.length) return 'No encontré ninguna tabla dinámica.';
          const ok = t.find((p) => p.columnas.some((c) => /sucursal/i.test(c.nombre)) && p.valores.some((v) => /total/i.test(v.campo) && v.funcion === 'sum') && (p.filas.some((f) => f.agruparPor === 'quarters' || /trim/i.test(f.nombre)) || p.agrupaciones.some((g) => g.por === 'quarters')));
          return ok ? true : 'La tabla dinámica debe tener los trimestres en filas, Sucursal en columnas y Suma de Total en valores.';
        } },
        { titulo: 'Respuestas correctas', fn: (L, A) => { A.hoja('Respuestas'); for (let q = 1; q <= 4; q++) { const v = String(L.valor('Respuestas', 'B' + (q + 1)) || '').trim(); if (v.toLowerCase() !== LIDERES[q - 1].toLowerCase()) return 'Trimestre ' + q + ': ' + (v ? '«' + v + '» no es la sucursal que más vendió.' : 'falta la respuesta en B' + (q + 1) + '.'); } return true; } },
        { titulo: 'Porcentaje del total por categoría', nivel: 'experto', fn: (L) => (L.dinamicas.some((p) => p.filas.some((f) => /categor/i.test(f.nombre)) && p.valores.some((v) => v.mostrarComo === 'percentOfTotal')) ? true : 'Falta la tabla dinámica de Categoría con los valores como % del total general.') },
      ],
    },
    donde: [
      { comando: 'Tabla dinámica', ruta: ['Insertar', 'Tabla dinámica'] },
      { comando: 'Agrupar selección (fechas)', ruta: ['Análisis de tabla dinámica', 'Agrupar selección'], nota: 'También: clic derecho sobre una fecha › Agrupar.' },
      { comando: 'Actualizar', ruta: ['Análisis de tabla dinámica', 'Actualizar'] },
      { comando: 'Configuración de campo de valor', ruta: ['Análisis de tabla dinámica', 'Configuración de campo'] },
    ],
    atajos: ['Clic derecho sobre un valor › Mostrar valores como › % del total general.', 'Doble clic sobre un número de la tabla dinámica: Excel crea una hoja con las filas que lo forman.'],
  });
})();
