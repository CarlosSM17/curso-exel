/* Módulo 11 · Tablas dinámicas */
(function () {
  const { D, filasDinamica, CAMPOS_DINAMICA, lideresTrimestre, trimestre, totalesPor, mes } = LT.caso;
  const DATOS = filasDinamica();
  const LIDERES = lideresTrimestre();
  const anual = Object.entries(totalesPor('sede')).sort((a, b) => b[1] - a[1]);
  const LIDER_ANUAL = anual[0][0];
  const topArea = Object.entries(totalesPor('area')).sort((a, b) => b[1] - a[1])[0][0];
  const vacSede = Object.entries(totalesPor('sede', (v) => v.area === 'Vacunación')).sort((a, b) => b[1] - a[1])[0][0];
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const mejorMes = (filtro) => { const m = new Array(12).fill(0); D.atenciones.filter(filtro).forEach((v) => { m[mes(v.fecha) - 1] += v.atenciones; }); return MESES[m.indexOf(Math.max(...m))]; };
  const MES_NORTE = mejorMes((v) => v.sede === 'Norte');
  const MES_NORTE_VAC = mejorMes((v) => v.sede === 'Norte' && v.area === 'Vacunación');
  const norteQ = [1, 2, 3, 4].map((q) => D.atenciones.filter((v) => v.sede === 'Norte' && trimestre(v.fecha) === q).reduce((s, v) => s + v.atenciones, 0));
  const MEJOR_Q_NORTE = 'Trim.' + (norteQ.indexOf(Math.max(...norteQ)) + 1);
  const nLider = LIDERES.filter((x) => x === LIDER_ANUAL).length;
  const otroLider = LIDERES.find((x) => x !== LIDER_ANUAL) || anual[1][0];
  const nOtro = LIDERES.filter((x) => x === otroLider).length;
  const INTERPRETACION = [
    nLider === 4 ? LIDER_ANUAL + ' tiene más atenciones en el año y encabeza los cuatro trimestres' : LIDER_ANUAL + ' tiene más atenciones en el año, aunque solo encabeza ' + nLider + (nLider === 1 ? ' trimestre' : ' trimestres'),
    otroLider + ' tiene más atenciones en el año porque encabeza ' + nOtro + (nOtro === 1 ? ' trimestre' : ' trimestres'),
    nLider === 4 ? anual[2][0] + ' tiene más atenciones en el año' : LIDER_ANUAL + ' encabeza todos los trimestres',
    'Las tres sedes atienden casi lo mismo en cada trimestre',
  ];
  const pivote = (c, estado, extra) => LT.TablaDinamica(c, Object.assign({ datos: DATOS, campos: CAMPOS_DINAMICA, estado }, extra || {}));

  function crearReto(cont, nivel) {
    const { h } = LT.u;
    const experto = nivel === 'experto', explorador = nivel === 'explorador';
    let e1 = null, e2 = null, t1 = null, t2 = null;
    const resp = {};
    const sel = (clave, opciones) => h('select', { class: 'herr-sel', onchange: (ev) => { resp[clave] = ev.target.value; } }, h('option', { value: '' }, 'Elige…'), opciones.map((o) => h('option', { value: o }, o)));
    const pestanas = h('div', { class: 'grupo-btn', style: { marginBottom: '10px' } });
    const p1 = h('div'), p2 = h('div');
    const mostrar = (i) => { p1.style.display = i === 1 ? '' : 'none'; p2.style.display = i === 2 ? '' : 'none'; pestanas.querySelectorAll('button').forEach((b, k) => b.classList.toggle('primario', k + 1 === i)); };
    pestanas.append(h('button', { class: 'btn chico', onclick: () => mostrar(1) }, '1. Trimestres por sede'), h('button', { class: 'btn chico', onclick: () => mostrar(2) }, '2. Tablero mensual'));
    const z1 = h('div'), z2 = h('div');
    const preguntas1 = h('div', { class: 'aviso-caja info' });
    if (experto) preguntas1.append('Con los valores como % del total de columnas: ¿en qué trimestre concentró Norte el mayor porcentaje de sus atenciones del año? ', sel('q', ['Trim.1', 'Trim.2', 'Trim.3', 'Trim.4']));
    else {
      preguntas1.appendChild(h('div', { style: { marginBottom: '6px' } }, '¿Qué sede tuvo más atenciones en cada trimestre?'));
      const fila = h('div', { class: 'grupo-btn' });
      for (let q = 1; q <= 4; q++) fila.appendChild(h('label', null, 'T' + q + ': ', sel('t' + q, ['Centro', 'Norte', 'Sur'])));
      preguntas1.appendChild(fila);
    }
    if (!explorador) preguntas1.append(h('div', { style: { marginTop: '10px' } }, 'Interpretación: ¿qué conclusión es correcta? '), sel('interp', INTERPRETACION.slice().sort()));
    p1.append(z1, preguntas1);
    p2.append(z2, h('div', { class: 'aviso-caja info' }, experto ? 'Con las segmentaciones en Norte y Vacunación, ¿en qué mes vacunó más la sede Norte? ' : 'Con la segmentación en Norte, ¿en qué mes tuvo más atenciones la sede Norte? ', sel('mes', MESES)));
    cont.append(pestanas, p1, p2);
    setTimeout(() => {
      t1 = pivote(z1, explorador ? { filas: [{ campo: 'Fecha', agrupar: ['trimestres'] }] } : {}, { alCambiar: (e) => { e1 = e; } });
      t2 = LT.TablaDinamica(z2, { datos: DATOS, campos: CAMPOS_DINAMICA, estado: explorador ? { filas: [{ campo: 'Fecha', agrupar: ['meses'] }], valores: ['Atenciones'] } : {}, segmentaciones: ['Sede', 'Área'], grafico: true, alCambiar: (e) => { e2 = e; } });
      mostrar(1);
    }, 0);
    return {
      verificar: () => {
        const r = [];
        const add = (ok, titulo, mensaje) => r.push({ ok, titulo, mensaje: ok ? titulo : mensaje });
        const a = e1 || { filas: [], columnas: [], valores: [] };
        const f = a.filas[0];
        add(a.filas.length === 1 && f.campo === 'Fecha' && (f.agrupar || []).includes('trimestres') && !(f.agrupar || []).includes('meses'), 'Tabla 1 · Filas: la fecha agrupada por trimestres', 'Tabla 1: en Filas pon solo la Fecha, agrupada por Trimestres (menú ▾ de la ficha › Agrupar…).');
        add(a.columnas.length === 1 && a.columnas[0].campo === 'Sede', 'Tabla 1 · Columnas: Sede', 'Tabla 1: pon Sede en Columnas.');
        const v = a.valores[0];
        add(a.valores.length === 1 && v.campo === 'Atenciones' && v.funcion === 'suma', 'Tabla 1 · Valores: Suma de Atenciones', 'Tabla 1: en Valores pon «Suma de Atenciones» (no la cuenta de registros).');
        if (experto) {
          add(v && v.mostrarComo === 'pctColumna', 'Tabla 1 · % del total de columnas', 'Tabla 1: Configuración de campo de valor › Mostrar valores como › % del total de columnas.');
          add(resp.q === MEJOR_Q_NORTE, 'Respuesta sobre Norte correcta', resp.q ? 'Revisa la columna Norte: el mayor porcentaje no está en ' + resp.q + '.' : 'Responde la pregunta de la tabla 1.');
        } else for (let q = 1; q <= 4; q++) add(resp['t' + q] === LIDERES[q - 1], 'Trimestre ' + q + ': ' + LIDERES[q - 1], resp['t' + q] ? 'Trimestre ' + q + ': la sede con el número más alto de la fila Trim.' + q + ' no es ' + resp['t' + q] + '.' : 'Responde qué sede tuvo más atenciones en el trimestre ' + q + '.');
        if (!explorador) add(resp.interp === INTERPRETACION[0], 'Interpretación correcta', resp.interp ? 'Revisa la interpretación: compara la fila «Total general» con cada trimestre.' : 'Elige la conclusión correcta.');
        const b = e2 || { filas: [], valores: [], segmentaciones: {} };
        const g = b.filas[0];
        add(b.filas.length === 1 && g.campo === 'Fecha' && JSON.stringify(g.agrupar) === '["meses"]' && (!b.columnas || !b.columnas.length), 'Tabla 2 · Meses en filas', 'Tabla 2: pon la Fecha en Filas agrupada solo por Meses, sin campos en Columnas.');
        add(b.valores.length === 1 && b.valores[0].campo === 'Atenciones' && b.valores[0].funcion === 'suma' && b.valores[0].mostrarComo === 'ninguno', 'Tabla 2 · Suma de Atenciones', 'Tabla 2: en Valores pon «Suma de Atenciones».');
        add(b.tipoGrafico === 'lineas' || b.tipoGrafico === 'columnas', 'Gráfico dinámico de líneas o columnas', 'Tabla 2: elige un gráfico dinámico de líneas o columnas.');
        const s = b.segmentaciones || {};
        add(JSON.stringify(s.Sede) === '["Norte"]', 'Segmentación Sede en Norte', 'Tabla 2: en la segmentación Sede deja solo «Norte».');
        if (experto) add(JSON.stringify(s['Área']) === '["Vacunación"]', 'Segmentación Área en Vacunación', 'Tabla 2: en la segmentación Área deja solo «Vacunación».');
        else add(!s['Área'], 'Sin filtro de área', 'Tabla 2: quita el filtro de Área (⨯) para ver todas.');
        const esp = experto ? MES_NORTE_VAC : MES_NORTE;
        add(resp.mes === esp, 'Mes con más atenciones correcto', resp.mes ? 'Mira el punto o la barra más alta del gráfico filtrado: no es ' + resp.mes + '.' : 'Responde la pregunta del tablero.');
        return { ok: r.every((x) => x.ok), resultados: r };
      },
      tablas: () => ({ t1, t2 }),
    };
  }

  LT.definirModulo({
    id: 11,
    objetivo: 'Crear tablas dinámicas con campos de filas, columnas, valores y filtros; agrupar información; resumir con suma, promedio, conteo, máximo y mínimo; filtrar con segmentaciones; crear gráficos dinámicos e interpretar los resultados.',
    situacion: 'Tengo los ' + D.atenciones.length + ' registros de atenciones de 2025. Quiero saber <b>qué sede atiende más cada trimestre</b> y un <b>tablero</b> donde vea las atenciones por mes de cada sede con un clic. Y, sobre todo, que me digas <b>qué significan</b> esos números antes de presentarlos a la dirección.',
    explicacion: [
      { html: '<h3>Crear una tabla dinámica</h3><p>Una <b>tabla dinámica</b> resume una lista grande sin escribir fórmulas. Haz clic dentro de los datos y usa <b>Insertar › Tabla dinámica</b> (mejor en una hoja nueva). Los datos deben tener encabezados en la primera fila, sin filas vacías ni subtotales; si están en una <b>tabla de Excel</b>, la tabla dinámica incluye solas las filas nuevas al actualizar.</p><h3>Las cuatro áreas</h3><ul><li><b>Filas:</b> una fila por cada valor distinto del campo (cada sede, cada servicio).</li><li><b>Columnas:</b> una columna por cada valor distinto.</li><li><b>Valores:</b> lo que se calcula. Por omisión, los números se <b>suman</b> y los textos se <b>cuentan</b>; en «Configuración de campo de valor» se elige <b>Suma, Promedio, Cuenta, Máx. o Mín.</b>, y «Mostrar valores como» % del total.</li><li><b>Filtros:</b> limita todo el informe a un valor (por ejemplo, solo Vacunación).</li></ul><h3>Agrupar información</h3><p>Las fechas se agrupan por <b>meses, trimestres o años</b> (clic derecho en una fecha › Agrupar). Los números se agrupan en rangos (edades de 0 a 17, 18 a 39, 40 a 59, 60 o más: los grupos de edad de un reporte epidemiológico). Si cambian los datos de origen, pulsa <b>Actualizar</b>.</p>' },
      { widget: 'agrupacion', titulo: 'Qué hace por dentro: agrupar y resumir', instr: 'Estos son 12 registros sueltos. Pulsa el botón y mira cómo la tabla dinámica los agrupa por sede y suma sus atenciones.', opts: { campo: 'sede', filas: D.atenciones.slice(0, 12).map((v) => ({ grupo: v.sede, etiqueta: v.servicio + ' · ' + LT.caso.fecha(v.fecha), valor: v.atenciones })) } },
      { html: '<h3>Segmentación de datos y gráficos dinámicos</h3><ul><li>Una <b>segmentación de datos</b> es un panel de botones para filtrar con un clic (Ctrl+clic para varios). Una <b>escala de tiempo</b> filtra fechas con una barra deslizante.</li><li>Un <b>gráfico dinámico</b> está conectado a su tabla dinámica: si cambias campos o filtros, el gráfico cambia. Con <b>Conexiones de informe</b>, una segmentación controla varias tablas: es la base de los dashboards del módulo 13.</li></ul><h3>Interpretar los resultados</h3><ul><li>Empieza por el <b>Total general</b>: da la escala y permite ver qué parte representa cada fila.</li><li>Compara en la misma dirección (fila contra fila, columna contra columna) y busca cambios de líder: ganar más trimestres no es lo mismo que ganar el año.</li><li>No confundas <b>Cuenta</b> (cuántos registros hay) con <b>Suma</b> (cuántas atenciones suman): aquí cada registro agrupa las atenciones de un servicio en un día, así que registros ≠ pacientes.</li><li>Un promedio de registros no es un promedio por paciente: revisa qué representa cada fila de la base.</li><li>Antes de concluir, verifica con una segunda vista (porcentajes, otro filtro) y evita afirmaciones absolutas («siempre», «todas»).</li></ul>' },
      { titulo: 'Explora un tablero', instr: 'Arrastra campos, cambia el resumen (▾ de la ficha de Valores) y usa las segmentaciones.', widget: (c) => pivote(c, { filas: ['Sede'], valores: ['Atenciones'] }, { segmentaciones: ['Área'], grafico: true }) },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Atenciones por sede en cuatro pasos',
      widget: (c) => pivote(c, { filas: ['Sede'], valores: ['Atenciones'] }),
      pasos: ['Haz clic en una celda de la lista de atenciones.', { texto: 'Insertar › Tabla dinámica › Aceptar (en una hoja nueva).', ruta: ['Insertar', 'Tabla dinámica'] }, 'En la lista de campos, arrastra Sede a Filas.', 'Arrastra Atenciones a Valores: aparece «Suma de Atenciones» por sede (arriba puedes probarlo).'],
      pregunta: { texto: 'En la tabla de arriba, si arrastras <b>Área</b> al área de <b>Columnas</b>, ¿cuántas columnas de datos aparecen (sin contar el Total general)?', opciones: ['3', '6', '20', '1'], correcta: 1, explicacion: 'Una columna por cada área distinta: hay <b>6</b> áreas (Consulta, Laboratorio, Imagenología, Enfermería, Rehabilitación y Vacunación).' },
    },
    micro: [
      { titulo: 'Conteo', tipo: 'widget', enunciado: '¿Cuántos <b>registros</b> tiene cada sede? Sede en Filas y un campo en Valores resumido por <b>Cuenta</b>.',
        crear: (c, listo) => { const info = LT.u.h('div', { class: 'retro' }); const z = LT.u.h('div'); c.append(z, info); pivote(z, {}, { alCambiar: (e) => { const ok = e.filas.length === 1 && e.filas[0].campo === 'Sede' && e.valores.length === 1 && e.valores[0].funcion === 'cuenta'; info.innerHTML = ''; if (ok) { info.appendChild(LT.u.h('div', { class: 'aviso-caja ok' }, '✓ Cada sede tiene 240 registros: la cuenta no suma atenciones, cuenta filas.')); listo(); } } }); } },
      { titulo: 'Máximo y promedio', tipo: 'widget', enunciado: '¿Cuál fue el <b>registro con más atenciones</b> de cada sede? Sede en Filas y Atenciones en Valores resumido por <b>Máx.</b> (prueba también Promedio y Mín.).',
        crear: (c, listo) => { const info = LT.u.h('div', { class: 'retro' }); const z = LT.u.h('div'); c.append(z, info); pivote(z, {}, { alCambiar: (e) => { const ok = e.filas.length === 1 && e.filas[0].campo === 'Sede' && e.valores.length === 1 && e.valores[0].campo === 'Atenciones' && e.valores[0].funcion === 'max'; info.innerHTML = ''; if (ok) { info.appendChild(LT.u.h('div', { class: 'aviso-caja ok' }, '✓ Máx. muestra el registro con más atenciones de cada sede; Promedio, las atenciones medias por registro.')); listo(); } } }); } },
      { titulo: 'Filtros', tipo: 'widget', enunciado: 'Pon <b>Área en Filtros</b> y elige solo «Vacunación»; deja Sede en Filas y Suma de Atenciones en Valores. ¿Qué sede vacunó más?',
        crear: (c, listo) => {
          const { h } = LT.u; let est = null; const z = h('div'); const info = h('div', { class: 'retro' });
          const s = h('select', { class: 'herr-sel' }, h('option', { value: '' }, 'Elige…'), ['Centro', 'Norte', 'Sur'].map((x) => h('option', { value: x }, x)));
          const revisar = () => { const f = est && est.filtros.find((x) => x.campo === 'Área'); const ok = est && f && JSON.stringify(f.valores) === '["Vacunación"]' && est.filas.length === 1 && est.filas[0].campo === 'Sede' && est.valores.length === 1 && est.valores[0].campo === 'Atenciones' && s.value === vacSede; info.innerHTML = ''; if (ok) { info.appendChild(h('div', { class: 'aviso-caja ok' }, '✓ ' + vacSede + ' vacunó más. El filtro afecta a todo el informe.')); listo(); } else if (s.value && est && f) info.appendChild(h('div', { class: 'aviso-caja alerta' }, 'Revisa la tabla filtrada: la sede que más vacunó no es ' + s.value + '.')); };
          s.addEventListener('change', revisar);
          c.append(z, h('div', { class: 'aviso-caja info' }, '¿Qué sede vacunó más? ', s), info);
          pivote(z, {}, { alCambiar: (e) => { est = e; revisar(); } });
        } },
      { titulo: 'Datos nuevos', tipo: 'opcion', enunciado: 'Agregaste las atenciones de la última semana a la lista de origen, pero la tabla dinámica sigue mostrando los totales anteriores. ¿Qué falta?', opciones: ['Actualizar la tabla dinámica', 'Volver a guardar el archivo', 'Borrar la tabla y hacerla de nuevo', 'Usar SUMA en lugar de la tabla dinámica'], correcta: 0, explicacion: 'Las tablas dinámicas no se recalculan solas: <b>Análisis de tabla dinámica › Actualizar</b> (o clic derecho › Actualizar). Por cierto, el área con más atenciones del año es ' + topArea + '.' },
    ],
    reto: {
      titulo: 'Atenciones del año: sedes, trimestres y tablero', tipo: 'widget', crear: crearReto,
      base: {
        instrucciones: ['<b>Tabla 1:</b> trimestres en Filas (agrupa la Fecha), sedes en Columnas y suma de Atenciones en Valores. Responde qué sede atendió más cada trimestre y elige la interpretación correcta.', '<b>Tabla 2 (tablero):</b> meses en Filas y suma de Atenciones en Valores, gráfico dinámico de líneas o columnas, y segmentación de Sede en Norte. Responde en qué mes tuvo más atenciones Norte.'],
        pistas: ['Cada pregunta es una combinación de áreas: lo que comparas va en filas o columnas, lo que mides en valores.', 'Al poner Fecha en Filas se agrupa por meses; en su menú ▾ elige «Agrupar…» y marca solo Trimestres (tabla 1). En la tabla 2 deja Meses.', 'Tabla 1: Fecha (Trimestres) · Sede · Suma de Atenciones. Tabla 2: Fecha (Meses) · Suma de Atenciones · Líneas · Segmentación Sede = Norte.'],
      },
      niveles: {
        explorador: { instrucciones: ['Tabla 1: la Fecha ya está agrupada por trimestres; arrastra <b>Sede</b> a Columnas y marca <b>Atenciones</b>. Responde los cuatro trimestres.', 'Tabla 2: los meses y las atenciones ya están; elige <b>Líneas</b> y haz clic en <b>Norte</b> en la segmentación. Responde el mes.'] },
        experto: { instrucciones: ['Tabla 1: como en el nivel Analista, pero muestra los valores como <b>% del total de columnas</b> y responde en qué trimestre concentró Norte el mayor porcentaje de su año. Elige la interpretación correcta.', 'Tabla 2: tablero mensual con dos segmentaciones: Sede = Norte y Área = Vacunación.'] },
      },
    },
    lab: {
      archivo: 'lab11-tablas-dinamicas.xlsx', titulo: 'Tablas dinámicas y tablero en Excel',
      contexto: 'La hoja Atenciones tiene los ' + D.atenciones.length + ' registros de 2025. La hoja Respuestas es para tus conclusiones.',
      pasos: {
        explorador: [{ texto: 'Clic en la lista › Insertar › Tabla dinámica › Nueva hoja.', ruta: ['Insertar', 'Tabla dinámica'] }, 'Fecha a Filas (clic derecho › Agrupar › solo Trimestres), Sede a Columnas y Atenciones a Valores.', 'En Respuestas escribe la sede líder de cada trimestre (B2:B5), el mes con más atenciones de Norte (B7) y la sede líder del año (B8).', { texto: 'Con otra tabla dinámica por meses, inserta un gráfico dinámico y una segmentación por Sede.', ruta: ['Análisis de tabla dinámica', 'Insertar segmentación de datos'] }, 'Guarda y sube el libro.'],
        analista: ['Tabla dinámica: trimestres × sedes con la suma de Atenciones.', 'Respuestas: líderes por trimestre (B2:B5), mes con más atenciones de Norte (B7) y líder del año (B8).', 'Tablero: tabla dinámica por meses, gráfico dinámico y segmentación por Sede conectada.', 'Guarda y sube el libro.'],
        experto: ['Lo del nivel Analista.', 'Muestra en alguna tabla dinámica los valores como porcentaje del total.', 'Agrega una escala de tiempo por Fecha al tablero.', 'Guarda y sube el libro.'],
      },
      notaWeb: 'Excel para la web permite crear tablas dinámicas, agrupar fechas, gráficos dinámicos y segmentaciones.',
      pruebas: [
        { titulo: 'Tabla dinámica por trimestre y sede', fn: (L) => { if (!L.dinamicas.length) return 'No encontré ninguna tabla dinámica.'; return L.dinamicas.find((p) => p.columnas.some((c) => /sede/i.test(c.nombre)) && p.valores.some((v) => /atenciones/i.test(v.campo) && v.funcion === 'sum') && (p.filas.some((f) => f.agruparPor === 'quarters' || /trim/i.test(f.nombre)) || p.agrupaciones.some((g) => g.por === 'quarters'))) ? true : 'La tabla dinámica debe tener los trimestres en filas, Sede en columnas y Suma de Atenciones en valores.'; } },
        { titulo: 'Líderes por trimestre', fn: (L, A) => { A.hoja('Respuestas'); for (let q = 1; q <= 4; q++) { const v = String(L.valor('Respuestas', 'B' + (q + 1)) || '').trim(); if (v.toLowerCase() !== LIDERES[q - 1].toLowerCase()) return 'Trimestre ' + q + ': ' + (v ? '«' + v + '» no es la sede con más atenciones.' : 'falta la respuesta en B' + (q + 1) + '.'); } return true; } },
        { titulo: 'Interpretación: mes de Norte y líder del año', fn: (L) => { const m = String(L.valor('Respuestas', 'B7') || '').trim().toLowerCase(); if (!m.startsWith(MES_NORTE)) return 'B7: el mes con más atenciones de Norte no es «' + (m || 'vacío') + '».'; return String(L.valor('Respuestas', 'B8') || '').trim().toLowerCase() === LIDER_ANUAL.toLowerCase() ? true : 'B8: revisa el Total general para saber qué sede gana el año (no basta con contar trimestres ganados).'; } },
        { titulo: 'Gráfico dinámico', fn: (L) => (L.graficos.some((g) => g.dinamico) ? true : 'Falta un gráfico dinámico (conectado a una tabla dinámica).') },
        { titulo: 'Segmentación por Sede conectada', fn: (L) => { const s = L.segmentaciones.find((x) => /sede/i.test(x.campo || x.nombre)); if (!s) return 'Inserta una segmentación por Sede.'; return s.dinamicas.length ? true : 'La segmentación no está conectada a ninguna tabla dinámica.'; } },
        { titulo: 'Valores como porcentaje', nivel: 'experto', fn: (L) => (L.dinamicas.some((p) => p.valores.some((v) => /percent/i.test(v.mostrarComo || ''))) ? true : 'Muestra en alguna tabla dinámica los valores como porcentaje (Mostrar valores como).') },
        { titulo: 'Escala de tiempo', nivel: 'experto', fn: (L) => (L.escalasTiempo.length ? true : 'Agrega una escala de tiempo por Fecha.') },
      ],
    },
    donde: [
      { comando: 'Tabla dinámica', ruta: ['Insertar', 'Tabla dinámica'] },
      { comando: 'Agrupar selección (fechas)', ruta: ['Análisis de tabla dinámica', 'Agrupar selección'], nota: 'También: clic derecho sobre una fecha › Agrupar.' },
      { comando: 'Configuración de campo de valor (Suma, Promedio, Máx.)', ruta: ['Análisis de tabla dinámica', 'Configuración de campo'] },
      { comando: 'Insertar segmentación de datos', ruta: ['Análisis de tabla dinámica', 'Insertar segmentación de datos'] },
      { comando: 'Gráfico dinámico', ruta: ['Análisis de tabla dinámica', 'Gráfico dinámico'] },
      { comando: 'Actualizar', ruta: ['Análisis de tabla dinámica', 'Actualizar'] },
    ],
    glosario: ['SUMA', 'PROMEDIO', 'CONTAR', 'MAX', 'MIN'],
    atajos: ['Clic derecho sobre un valor › Resumir valores por › Suma, Recuento, Promedio, Máx., Mín.', 'Doble clic sobre un número de la tabla dinámica: Excel crea una hoja con los registros que lo forman.', '<kbd>Ctrl</kbd>+clic en una segmentación para elegir varios elementos.', '<kbd>Alt+F5</kbd> actualiza la tabla dinámica.'],
  });
})();
