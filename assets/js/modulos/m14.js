/* Módulo 14 · Gráficos dinámicos */
(function () {
  const { D, filasDinamica, CAMPOS_DINAMICA, mes } = LT.caso;
  const DATOS = filasDinamica();
  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const mejorMes = (filtro) => { const m = new Array(12).fill(0); D.ventas.filter(filtro).forEach((v) => { m[mes(v.fecha) - 1] += v.total; }); return MESES[m.indexOf(Math.max(...m))]; };
  const mesNorte = mejorMes((v) => v.sucursal === 'Norte');
  const mesNorteFrio = mejorMes((v) => v.sucursal === 'Norte' && v.categoria === 'Café frío');

  function crearReto(cont, nivel) {
    const { h } = LT.u;
    let est = null;
    let resp = '';
    const zona = h('div');
    const experto = nivel === 'experto';
    cont.append(zona, h('div', { class: 'aviso-caja info' }, experto ? 'Con las dos segmentaciones (Norte y Café frío), ¿en qué mes vendió más Norte de café frío? ' : 'Con la segmentación en Norte, ¿en qué mes vendió más la sucursal Norte? ', h('select', { class: 'herr-sel', onchange: (e) => { resp = e.target.value; } }, h('option', { value: '' }, 'Elige…'), MESES.map((m) => h('option', { value: m }, m)))));
    setTimeout(() => LT.TablaDinamica(zona, { datos: DATOS, campos: CAMPOS_DINAMICA, estado: nivel === 'explorador' ? { filas: [{ campo: 'Fecha', agrupar: ['meses'] }], valores: ['Total'] } : {}, segmentaciones: ['Sucursal', 'Categoría'], grafico: true, alCambiar: (e) => { est = e; } }), 0);
    return {
      verificar: () => {
        const r = [];
        const add = (ok, titulo, mensaje) => r.push({ ok, titulo, mensaje: ok ? titulo : mensaje });
        const e = est || { filas: [], valores: [], segmentaciones: {} };
        const f = e.filas[0];
        add(e.filas.length === 1 && f.campo === 'Fecha' && JSON.stringify(f.agrupar) === '["meses"]', 'Filas: meses', 'Pon la Fecha en Filas agrupada solo por Meses.');
        add(e.valores.length === 1 && e.valores[0].campo === 'Total' && e.valores[0].funcion === 'suma' && e.valores[0].mostrarComo === 'ninguno', 'Valores: Suma de Total', 'En Valores pon «Suma de Total».');
        add(!e.columnas || !e.columnas.length, 'Sin campos en Columnas', 'Para un tablero por mes, deja vacía el área de Columnas (la sucursal se filtra con la segmentación).');
        add(e.tipoGrafico === 'lineas' || e.tipoGrafico === 'columnas', 'Gráfico dinámico de líneas o columnas', 'Elige un gráfico de líneas o columnas para ver los meses.');
        const s = e.segmentaciones || {};
        add(JSON.stringify(s.Sucursal) === '["Norte"]', 'Segmentación Sucursal en Norte', 'En la segmentación Sucursal deja seleccionado solo «Norte».');
        if (experto) add(JSON.stringify(s['Categoría']) === '["Café frío"]', 'Segmentación Categoría en Café frío', 'En la segmentación Categoría deja seleccionado solo «Café frío».');
        else add(!s['Categoría'], 'Sin filtro de categoría', 'Quita el filtro de la segmentación Categoría (⨯) para ver todas las categorías.');
        const esp = experto ? mesNorteFrio : mesNorte;
        add(resp === esp, 'Respuesta correcta', resp ? 'Mira el punto o la barra más alta del gráfico filtrado: no es ' + resp + '.' : 'Responde la pregunta.');
        return { ok: r.every((x) => x.ok), resultados: r };
      },
    };
  }

  LT.definirModulo({
    id: 14,
    objetivo: 'Crear gráficos conectados a tablas dinámicas y armar un tablero con segmentaciones.',
    situacion: 'Quiero un <b>mini tablero</b>: un gráfico de ventas por mes que pueda filtrar por sucursal con un clic.',
    explicacion: [
      { html: '<h3>Gráfico + tabla dinámica + botones</h3><ul><li>Un <b>gráfico dinámico</b> (Análisis de tabla dinámica › Gráfico dinámico) está conectado a su tabla dinámica: si cambias los campos o los filtros, el gráfico cambia.</li><li>Una <b>segmentación de datos</b> es un panel de botones para filtrar con un clic (Ctrl+clic para elegir varios).</li><li>Una <b>escala de tiempo</b> filtra por periodos de fecha con una barra deslizante.</li><li>Con <b>Conexiones de filtro</b> una misma segmentación controla varias tablas dinámicas: así se arma un tablero.</li></ul>' },
      { titulo: 'Explora un tablero', instr: 'Haz clic en los botones de las segmentaciones y mira cómo cambian juntos la tabla y el gráfico.', widget: (c) => LT.TablaDinamica(c, { datos: DATOS, campos: CAMPOS_DINAMICA, estado: { filas: ['Sucursal'], valores: ['Total'] }, segmentaciones: ['Categoría'], grafico: true }) },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Del informe al tablero',
      pasos: [{ texto: 'Con una celda de la tabla dinámica seleccionada: Análisis de tabla dinámica › Gráfico dinámico › Líneas.', ruta: ['Análisis de tabla dinámica', 'Gráfico dinámico'] }, { texto: 'Análisis de tabla dinámica › Insertar segmentación de datos › Sucursal.', ruta: ['Análisis de tabla dinámica', 'Insertar segmentación de datos'] }, { texto: 'Insertar escala de tiempo › Fecha (opcional).', ruta: ['Análisis de tabla dinámica', 'Insertar escala de tiempo'] }, 'Acomoda el gráfico y los filtros en una hoja «Tablero».'],
      pregunta: { texto: 'En la segmentación Sucursal haces clic en «Norte». ¿Qué cambia?', opciones: ['La tabla dinámica y el gráfico conectados muestran solo Norte', 'Solo cambia el color del botón', 'Se borran las ventas de las otras sucursales', 'Se crea una hoja nueva con Norte'], correcta: 0, explicacion: 'La segmentación filtra la tabla dinámica, y el gráfico dinámico la sigue. Los datos de origen no se borran.' },
    },
    micro: [
      { titulo: 'Filtrar por fechas', tipo: 'opcion', enunciado: '¿Qué control filtra una tabla dinámica por <b>rango de fechas</b> con una barra deslizante?', opciones: ['Escala de tiempo', 'Segmentación de datos', 'Validación de datos', 'Minigráfico'], correcta: 0, explicacion: 'La <b>escala de tiempo</b> permite elegir meses, trimestres o años arrastrando.' },
      { titulo: 'Un filtro para dos informes', tipo: 'opcion', enunciado: 'Tienes dos tablas dinámicas del mismo origen y quieres que <b>una sola segmentación</b> filtre ambas.', opciones: ['Conexiones de filtro (conexiones de informe) de la segmentación', 'Copiar la segmentación', 'Proteger la hoja', 'Agrupar las tablas dinámicas'], correcta: 0, explicacion: 'Con la segmentación seleccionada: <b>Segmentación › Conexiones de informe</b> (o Análisis de tabla dinámica › Conexiones de filtro) y marcas las tablas que debe controlar.' },
    ],
    reto: { titulo: 'Mini tablero de ventas', tipo: 'widget', crear: crearReto,
      base: { instrucciones: ['Arma la tabla dinámica: <b>meses</b> en Filas (Fecha agrupada por Meses) y <b>Suma de Total</b> en Valores.', 'Elige un gráfico dinámico de <b>líneas</b> (o columnas).', 'Con la segmentación <b>Sucursal</b>, deja solo Norte y responde.'], pistas: ['El gráfico se arma solo a partir de la tabla dinámica.', 'Fecha en Filas queda agrupada por meses; Total en Valores. La segmentación filtra con un clic.', 'Filas: Fecha (meses) · Valores: Suma de Total · Gráfico: Líneas · Segmentación Sucursal: Norte.'] },
      niveles: { explorador: { instrucciones: ['La tabla ya tiene los meses y la suma del total.', 'Elige el gráfico de <b>Líneas</b>.', 'En la segmentación Sucursal haz clic en <b>Norte</b>.', 'Responde mirando el punto más alto.'] }, experto: { instrucciones: ['Arma el tablero del nivel Analista (meses, suma de Total, gráfico de líneas o columnas).', 'Combina dos segmentaciones: Sucursal = Norte y Categoría = Café frío, y responde.'] } } },
    lab: {
      archivo: 'lab14-tablero.xlsx', titulo: 'Tablero de ventas en Excel',
      contexto: 'La hoja Ventas tiene las ventas de 2025. Arma el tablero en una hoja nueva llamada «Tablero».',
      pasos: {
        explorador: [{ texto: 'Inserta una tabla dinámica (meses en filas, Suma de Total en valores).', ruta: ['Insertar', 'Tabla dinámica'] }, { texto: 'Inserta un gráfico dinámico de líneas.', ruta: ['Análisis de tabla dinámica', 'Gráfico dinámico'] }, { texto: 'Inserta una segmentación por Sucursal.', ruta: ['Análisis de tabla dinámica', 'Insertar segmentación de datos'] }, 'Guarda y sube el libro.'],
        analista: ['Tabla dinámica por mes, gráfico dinámico y segmentación por Sucursal conectada.', 'Guarda y sube el libro.'],
        experto: ['Lo del nivel Analista.', 'Agrega una escala de tiempo por Fecha y una segunda segmentación por Categoría.', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { titulo: 'Tabla dinámica con la suma de Total', fn: (L) => (L.dinamicas.some((p) => p.valores.some((v) => /total/i.test(v.campo))) ? true : 'Falta una tabla dinámica con la suma de Total.') },
        { titulo: 'Gráfico dinámico', fn: (L) => (L.graficos.some((g) => g.dinamico) ? true : 'Falta un gráfico dinámico (conectado a la tabla dinámica).') },
        { titulo: 'Segmentación por Sucursal conectada', fn: (L) => { const s = L.segmentaciones.find((x) => /sucursal/i.test(x.campo || x.nombre)); if (!s) return 'Inserta una segmentación por Sucursal.'; return s.dinamicas.length ? true : 'La segmentación no está conectada a ninguna tabla dinámica.'; } },
        { titulo: 'Escala de tiempo por Fecha', nivel: 'experto', fn: (L) => (L.escalasTiempo.length ? true : 'Agrega una escala de tiempo (Insertar escala de tiempo › Fecha).') },
        { titulo: 'Segmentación por Categoría', nivel: 'experto', fn: (L) => (L.segmentaciones.some((x) => /categor/i.test(x.campo || x.nombre)) ? true : 'Agrega una segmentación por Categoría.') },
      ],
    },
    donde: [
      { comando: 'Gráfico dinámico', ruta: ['Análisis de tabla dinámica', 'Gráfico dinámico'], nota: 'También en Insertar › Gráfico dinámico.' },
      { comando: 'Insertar segmentación de datos', ruta: ['Análisis de tabla dinámica', 'Insertar segmentación de datos'] },
      { comando: 'Insertar escala de tiempo', ruta: ['Análisis de tabla dinámica', 'Insertar escala de tiempo'] },
      { comando: 'Conexiones de filtro', ruta: ['Análisis de tabla dinámica', 'Conexiones de filtro'] },
    ],
    atajos: ['<kbd>Ctrl</kbd>+clic en una segmentación para elegir varios elementos.', 'Alt+F5 actualiza la tabla dinámica seleccionada (en Excel).'],
  });
})();
