/* Módulo 13 · Dashboards */
(function () {
  const { D, ENC, fecha, filasCronicos } = LT.caso;
  const F = LT.formato;
  const CRON = filasCronicos();
  const pct = (filas) => filas.filter((f) => f.Controlado === 'Sí').length / filas.length;
  const INDICADORES = [
    { id: 'consultas', nombre: 'Consultas', calc: (f) => f.length, formato: '#,##0' },
    { id: 'control', nombre: '% de pacientes en control', calc: pct, formato: '0.0%', mejor: 'alto' },
    { id: 'espera', nombre: 'Espera promedio (min)', calc: (f) => f.reduce((s, x) => s + x.Espera, 0) / f.length, formato: '0.0', mejor: 'bajo' },
    { id: 'edad', nombre: 'Edad promedio', calc: (f) => f.reduce((s, x) => s + x.Edad, 0) / f.length, formato: '0.0' },
  ];
  const GRAFICOS = [
    { id: 'consultasMes', nombre: 'Consultas por mes', categoria: 'Mes', medida: 'consultas' },
    { id: 'controlSede', nombre: '% de control por sede', categoria: 'Sede', medida: 'control' },
    { id: 'consultasPrograma', nombre: 'Consultas por programa', categoria: 'Programa', medida: 'consultas' },
    { id: 'esperaSede', nombre: 'Espera promedio por sede', categoria: 'Sede', medida: 'espera' },
  ];
  const SEGM = ['Programa', 'Sede', 'Trimestre'];
  const r1 = (x) => Math.round(x * 1000) / 10;
  const PCT_HTA = r1(pct(CRON.filter((f) => f.Programa === 'Hipertensión')));
  const PCT_DM_SUR = r1(pct(CRON.filter((f) => f.Programa === 'Diabetes tipo 2' && f.Sede === 'Sur')));

  // ---------- hoja de indicadores con fórmulas (primer cuatrimestre)
  const sub = D.cronicos.filter((c) => +c.fecha.slice(5, 7) <= 4);
  const N = sub.length;
  const filaFin = N + 1;
  const datosConsultas = [['Folio', 'Fecha', 'Sede', 'Programa', 'Sexo', 'Edad', 'Controlado', 'Espera (min)'], ...sub.map((c) => [c.folio, fecha(c.fecha), c.sede, c.programa, c.sexo, c.edad, c.controlado, c.espera])];
  const hojaTablero = (experto) => ({
    nombre: 'Tablero',
    celdas: { B1: 'Tablero del programa de enfermedades crónicas', B2: 'Sede:', C2: 'Centro', B3: 'Programa:', C3: 'Diabetes tipo 2', B5: 'Consultas', B6: 'Pacientes en control', B7: '% de control', B8: 'Meta de control', C8: '0.7', B9: 'Semáforo', B10: 'Espera promedio (min)' },
    formatos: { C7: '0.0%', C8: '0%', C10: '0.0' },
    estilos: { B1: { b: true, fs: 15, fg: '#0f766e' }, 'C2:C3': { bg: '#fff8d6', b: true }, 'B5:B10': { b: true } },
    anchos: { A: 24, B: 200, C: 170 }, objetivo: 'C5:C7,C9:C10', filas: 14, cols: 5,
  });
  const libroReto = (experto) => ({
    hojas: [hojaTablero(experto), { nombre: 'Consultas', datos: datosConsultas, estilos: { 'A1:H1': ENC }, anchos: { A: 70, B: 86, C: 70, D: 130, E: 50, F: 50, G: 90, H: 90 }, inmovilizar: { filas: 1 } }],
    pestanas: true, herramientas: ['formulas', 'estilos', 'captura'], altura: 360,
  });
  const R = (col) => 'Consultas!$' + col + '$2:$' + col + '$' + filaFin;
  const solucion = {
    'Tablero!C5': '=CONTAR.SI.CONJUNTO(' + R('C') + ',C2,' + R('D') + ',C3)',
    'Tablero!C6': '=CONTAR.SI.CONJUNTO(' + R('C') + ',C2,' + R('D') + ',C3,' + R('G') + ',"Sí")',
    'Tablero!C7': '=C6/C5',
    'Tablero!C9': '=SI(C7>=C8,"En meta","Debajo de la meta")',
    'Tablero!C10': '=SUMAR.SI.CONJUNTO(' + R('H') + ',' + R('C') + ',C2,' + R('D') + ',C3)/C5',
  };
  const k = (r, c) => r + ',' + c;
  const rojo = (fx) => !!fx && (fx.bg === '#ffc7ce' || fx.fg === '#9c0006' || fx.fg === '#c00000');
  const pruebaSemaforo = { tipo: 'fn', titulo: 'Formato condicional: % de control en rojo si está debajo de la meta', fn: (x) => {
    const hj = x.hoja.libro.hojas[0];
    if (!hj.condicionales.some((r) => LT.refs.celdasDe(r.rango).some((c) => c.dir === 'C7'))) return 'Agrega a C7 una regla de formato condicional: «Es menor que» =$C$8 con relleno rojo claro.';
    const hf = x.hoja.hf, sid = x.hoja.idHoja(0);
    const prev = hf.getCellSerialized({ sheet: sid, row: 1, col: 2 });
    const pintado = (sede) => { hf.setCellContents({ sheet: sid, row: 1, col: 2 }, [[sede]]); return rojo(x.hoja._evaluarCondicionales(hj)[k(6, 2)]); };
    const conSur = pintado('Sur'), conCentro = pintado('Centro');
    hf.setCellContents({ sheet: sid, row: 1, col: 2 }, [[prev]]);
    if (!conSur) return 'Con la sede Sur (por debajo de la meta), C7 debería verse en rojo: la regla debe comparar con la meta de C8.';
    return conCentro ? 'Con la sede Centro (en meta), C7 no debería verse en rojo: compara con C8, no con un número fijo.' : true;
  } };
  const pruebasHoja = (experto) => [
    { tipo: 'formula', rango: 'Tablero!C5:C7', titulo: 'Indicadores con fórmulas', mensaje: '{celda} tiene un número escrito: calcula el indicador con una fórmula.', mensajeVacia: '{celda} está vacía.' },
    { tipo: 'usa', rango: 'Tablero!C5:C6', funciones: ['CONTAR.SI.CONJUNTO'], titulo: 'Conteos con CONTAR.SI.CONJUNTO', mensaje: '{celda} debe contar con CONTAR.SI.CONJUNTO usando la sede (C2) y el programa (C3).' },
    { tipo: 'valores', rango: 'Tablero!C5:C7', titulo: 'Consultas, pacientes en control y % correctos', mensaje: '{celda} muestra {obtenido}, pero debería ser {esperado}.' },
    { tipo: 'valores', rango: 'Tablero!C9', titulo: 'Semáforo correcto', mensaje: 'C9 muestra {obtenido}; debería decir {esperado} (compara C7 con la meta de C8).' },
    { tipo: 'valores', rango: 'Tablero!C10', titulo: 'Espera promedio correcta', mensaje: 'C10 muestra {obtenido}; la espera promedio es {esperado} min (suma de esperas ÷ consultas, con los mismos criterios).' },
    pruebaSemaforo,
    { tipo: 'robustez', cambios: [{ 'Tablero!C2': 'Sur' }, { 'Tablero!C2': 'Norte', 'Tablero!C3': 'Hipertensión' }, { 'Tablero!C8': 0.8 }], rango: 'Tablero!C5:C7,Tablero!C9:C10', titulo: 'El tablero responde a la sede, el programa y la meta', mensaje: 'Al cambiar la sede, el programa o la meta, {celda} no se actualiza: usa C2, C3 y C8 en las fórmulas.' },
  ].concat(experto ? [
    { tipo: 'fn', titulo: 'Selectores con lista desplegable', fn: (x) => { const hj = x.estado.hojas[0]; const v = (d) => hj.validaciones.find((y) => y.tipo === 'lista' && LT.refs.celdasDe(y.rango).some((c) => c.dir === d)); const a = v('C2'), b = v('C3'); if (!a || !x.hoja.valoresLista(a, 0).includes('Sur')) return 'Pon en C2 una lista desplegable con Centro, Norte y Sur.'; return b && x.hoja.valoresLista(b, 0).includes('Hipertensión') ? true : 'Pon en C3 una lista desplegable con Diabetes tipo 2 e Hipertensión.'; } },
    { tipo: 'usa', rango: 'Tablero!C7', funciones: ['SI.ERROR'], titulo: '% de control protegido con SI.ERROR', mensaje: 'En C7 usa SI.ERROR para que no aparezca #¡DIV/0! si una combinación no tiene consultas.' },
  ] : []);

  // ---------- reto: dos pestañas (indicadores con fórmulas + diseño del tablero)
  function crearReto(cont, nivel) {
    const { h } = LT.u;
    const experto = nivel === 'experto', explorador = nivel === 'explorador';
    let hoja = null, tab = null, est = null;
    const pestanas = h('div', { class: 'grupo-btn', style: { marginBottom: '10px' } });
    const p1 = h('div'), p2 = h('div');
    const mostrar = (i) => { p1.style.display = i === 1 ? '' : 'none'; p2.style.display = i === 2 ? '' : 'none'; pestanas.querySelectorAll('button').forEach((b, j) => b.classList.toggle('primario', j + 1 === i)); };
    pestanas.append(h('button', { class: 'btn chico', onclick: () => mostrar(1) }, '1. Indicadores con fórmulas'), h('button', { class: 'btn chico', onclick: () => mostrar(2) }, '2. Diseño del tablero'));
    const hc = h('div');
    const resp = h('input', { type: 'text', placeholder: '0.0 %', style: { width: '110px', padding: '6px 8px', borderRadius: '7px', border: '1px solid var(--linea-2)' }, 'aria-label': 'Respuesta' });
    const zt = h('div');
    p1.append(h('p', { class: 'instr' }, 'Hoja Tablero: indicadores del primer cuatrimestre que cambian según la sede (C2) y el programa (C3). Los datos están en la hoja Consultas (filas 2 a ' + filaFin + ').'), hc);
    p2.append(h('p', { class: 'instr' }, explorador ? 'Marca las tarjetas y los gráficos que se piden, escribe la meta y conecta la segmentación con todos los elementos.' : 'Diseña el tablero con los datos de todo 2025.'), zt, h('div', { class: 'aviso-caja info' }, experto ? 'Con Programa = Diabetes tipo 2 y Sede = Sur, ¿cuál es el % de pacientes en control? ' : 'Con la segmentación Programa en Hipertensión, ¿cuál es el % de pacientes en control? ', resp));
    cont.append(pestanas, p1, p2);
    setTimeout(() => {
      hoja = new LT.Hoja(hc, libroReto(experto));
      tab = LT.widgets.tablero(zt, { datos: CRON, indicadores: INDICADORES, graficos: GRAFICOS, segmentaciones: SEGM, inicial: explorador ? { tarjetas: { consultas: { meta: '' }, control: { meta: '' }, espera: { meta: '' } } } : {}, alCambiar: (e) => { est = e; } });
      est = tab.estado();
      mostrar(1);
    }, 0);
    return {
      verificar: () => {
        const r = [];
        const add = (ok, titulo, mensaje) => r.push({ ok, titulo, mensaje: ok ? titulo : mensaje });
        const spec = { solucion: experto ? Object.assign({}, solucion, { 'Tablero!C7': '=SI.ERROR(C6/C5,0)' }) : solucion, pruebas: pruebasHoja(experto) };
        const v = LT.verificar(hoja, spec);
        v.resultados.forEach((x) => r.push({ ok: x.ok, titulo: 'Hoja · ' + (x.titulo || ''), mensaje: x.ok ? 'Hoja · ' + (x.titulo || '') : 'Hoja · ' + x.mensaje }));
        const e = est || { tarjetas: {}, visuales: {}, segm: [], conexiones: {} };
        add(!!(e.titulo || '').trim(), 'Tablero con título', 'Tablero: escribe un título que diga qué muestra (programa, periodo).');
        const faltan = ['consultas', 'control', 'espera'].filter((id) => !e.tarjetas[id]);
        add(!faltan.length, 'Tarjetas de Consultas, % en control y Espera', 'Tablero: agrega las tarjetas ' + faltan.map((id) => '«' + INDICADORES.find((x) => x.id === id).nombre + '»').join(', ') + '.');
        const metaCtrl = e.tarjetas.control ? parseFloat(String(e.tarjetas.control.meta).replace(/[%\s]/g, '')) : NaN;
        add(metaCtrl === 70 || metaCtrl === 0.7, 'Meta de control del 70 %', 'Tablero: escribe la meta de la tarjeta «% de pacientes en control»: 70 %.');
        if (experto) { const m = e.tarjetas.espera ? parseFloat(String(e.tarjetas.espera.meta)) : NaN; add(m === 30, 'Meta de espera de 30 minutos', 'Tablero: escribe 30 como meta de la espera promedio (mejor si es bajo).'); }
        add(e.visuales.consultasMes && e.visuales.consultasMes.tipo === 'lineas', 'Consultas por mes en líneas', 'Tablero: agrega «Consultas por mes» como gráfico de líneas (es un cambio en el tiempo).');
        add(e.visuales.controlSede && ['columnas', 'barras'].includes(e.visuales.controlSede.tipo), '% de control por sede en columnas o barras', 'Tablero: agrega «% de control por sede» como columnas o barras (comparación entre categorías).');
        const els = Object.keys(e.tarjetas).map((id) => 'k:' + id).concat(Object.keys(e.visuales).map((id) => 'g:' + id));
        const cp = (e.conexiones && e.conexiones.Programa) || [];
        add(e.segm.includes('Programa') && els.every((x) => cp.includes(x)), 'Segmentación Programa conectada a todo el tablero', e.segm.includes('Programa') ? 'Conexiones de informe: conecta la segmentación Programa a todas las tarjetas y gráficos.' : 'Tablero: inserta una segmentación por Programa.');
        if (experto) {
          const cs = (e.conexiones && e.conexiones.Sede) || [];
          const deben = els.filter((x) => x !== 'g:controlSede');
          add(e.segm.includes('Sede') && deben.every((x) => cs.includes(x)) && !cs.includes('g:controlSede'), 'Segmentación Sede bien conectada', 'Conexiones de informe: conecta la segmentación Sede a las tarjetas y a los demás gráficos, pero no al gráfico «% de control por sede» (se quedaría con una sola barra).');
        }
        const n = parseFloat(String(resp.value).replace(/[%\s]/g, ''));
        const esp = experto ? PCT_DM_SUR : PCT_HTA;
        add(isFinite(n) && Math.abs((n <= 1 ? n * 100 : n) - esp) < 0.6, 'Respuesta correcta', resp.value ? 'Revisa la tarjeta «% de pacientes en control» con el filtro aplicado (¿está conectada a la segmentación?).' : 'Responde la pregunta usando el tablero filtrado.');
        return { ok: r.every((x) => x.ok), resultados: r };
      },
      partes: () => ({ hoja, tab }),
    };
  }

  function demo(c) {
    LT.widgets.tablero(c, { datos: CRON, indicadores: INDICADORES, graficos: GRAFICOS, segmentaciones: SEGM, inicial: { titulo: 'Programa de enfermedades crónicas · 2025', tarjetas: { consultas: { meta: '' }, control: { meta: '70%' }, espera: { meta: '30' } }, visuales: { consultasMes: { tipo: 'lineas' }, controlSede: { tipo: 'columnas' } }, segm: ['Programa'], conexiones: { Programa: ['k:consultas', 'k:control', 'k:espera', 'g:consultasMes', 'g:controlSede'] } } });
  }

  LT.definirModulo({
    id: 13,
    objetivo: 'Diseñar y construir un dashboard de indicadores de salud: elegir indicadores con metas, calcularlos con fórmulas, combinarlos con tablas y gráficos dinámicos, conectar segmentaciones y presentarlo para que se lea en segundos.',
    situacion: 'La dirección quiere un <b>tablero del programa de enfermedades crónicas</b> (diabetes e hipertensión): cuántas consultas damos, qué <b>porcentaje de pacientes está en control</b> contra la meta del 70 %, cuánto esperan y cómo cambia por mes y por sede. Debe poder filtrarse por programa y leerse de un vistazo en la junta.',
    explicacion: [
      { html: '<h3>¿Qué es un dashboard?</h3><p>Un <b>dashboard</b> (tablero de control) reúne en una sola pantalla los <b>indicadores clave</b> para tomar decisiones. No es un reporte con todos los datos: es una respuesta rápida a pocas preguntas. Se construye en capas: <b>datos</b> (una tabla bien diseñada) → <b>cálculos</b> (fórmulas y tablas dinámicas, a menudo en una hoja auxiliar) → <b>presentación</b> (tarjetas, gráficos y segmentaciones en la hoja Tablero).</p><h3>Indicadores de salud</h3><p>Un indicador tiene nombre, fórmula (numerador / denominador), periodo, fuente y <b>meta</b>. El modelo de Donabedian los clasifica en:</p><ul><li><b>Estructura:</b> recursos disponibles (consultorios, personal por 1,000 habitantes, existencias de insulina).</li><li><b>Proceso:</b> lo que se hace (% de diabéticos con HbA1c medida en el año, tiempo de espera).</li><li><b>Resultado:</b> el efecto en la salud (% de pacientes con HbA1c &lt; 7 %, % con presión arterial &lt; 140/90).</li></ul><h3>Principios de diseño</h3><ul><li><b>Pocas cosas, bien elegidas:</b> de 3 a 6 indicadores; lo más importante arriba a la izquierda.</li><li><b>Contexto:</b> cada cifra con su meta, periodo y unidad; un semáforo solo tiene sentido con una meta.</li><li><b>El gráfico correcto:</b> líneas para el tiempo, columnas o barras para comparar, nada de 3D ni de circulares con muchas partes.</li><li><b>Colores con significado:</b> rojo y verde solo para fuera y dentro de meta; considera el daltonismo (agrega ✓ y ✗, no solo color).</li><li><b>Filtros coherentes:</b> las segmentaciones deben filtrar todo lo que se ve, salvo cuando no tenga sentido (una segmentación de sede no debe filtrar el gráfico «por sede»).</li><li><b>Limpieza:</b> oculta las líneas de cuadrícula, alinea los elementos y protege la hoja si otros la usarán.</li></ul>' },
      { titulo: 'Así funciona un tablero', instr: 'Este tablero ya está armado. Usa la segmentación de Programa (Ctrl+clic para varios) y observa cómo cambian las tarjetas y los gráficos conectados. Prueba también desconectar un elemento en «Conexiones de informe».', widget: demo },
      { html: '<h3>Construirlo en Excel</h3><ol><li>Convierte los datos en <b>tabla</b> (Ctrl+T): el tablero crecerá con los registros nuevos.</li><li>Crea las <b>tablas dinámicas</b> que necesitas (por mes, por sede) en una hoja auxiliar (Cálculos).</li><li>Inserta un <b>gráfico dinámico</b> por cada pregunta y muévelo a la hoja Tablero (Diseño de gráfico dinámico › Mover gráfico).</li><li>Inserta las <b>segmentaciones</b> y la <b>escala de tiempo</b>; conéctalas a todas las tablas dinámicas con clic derecho › <b>Conexiones de informe</b> (o Conexiones de filtro).</li><li>Calcula las <b>tarjetas KPI</b> con fórmulas: <code>CONTAR.SI.CONJUNTO</code>, <code>SUMAR.SI.CONJUNTO</code>, <code>PROMEDIO.SI.CONJUNTO</code>, o con <code>IMPORTARDATOSDINAMICOS</code> para tomarlas de una tabla dinámica filtrada. Protege las divisiones con <code>SI.ERROR</code>.</li><li>Agrega el <b>semáforo</b> con formato condicional contra la meta.</li><li>Pulido: oculta la cuadrícula (Vista › Líneas de cuadrícula), quita los botones de campo de los gráficos y alinea con Formato › Alinear.</li></ol><p>Ejemplo de tarjeta: <code>=CONTAR.SI.CONJUNTO(Consultas[Sede], C2, Consultas[Programa], C3, Consultas[Controlado], "Sí") / CONTAR.SI.CONJUNTO(Consultas[Sede], C2, Consultas[Programa], C3)</code>.</p>' },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Conectar una segmentación a varias tablas dinámicas',
      pasos: ['Crea dos tablas dinámicas a partir de la misma tabla de datos (por ejemplo, consultas por mes y % de control por sede).', { texto: 'Selecciona una de ellas › Análisis de tabla dinámica › Insertar segmentación de datos › Programa.', ruta: ['Análisis de tabla dinámica', 'Insertar segmentación de datos'] }, { texto: 'Clic derecho en la segmentación › Conexiones de informe (Conexiones de filtro) y marca las dos tablas dinámicas.', ruta: ['Segmentación', 'Conexiones de informe'] }, 'Haz clic en «Hipertensión»: las dos tablas, sus gráficos y las tarjetas que dependan de ellas se filtran a la vez.'],
      pregunta: { texto: 'Insertaste una segmentación desde la tabla dinámica de consultas por mes. Al filtrar, el gráfico de % por sede <b>no cambia</b>. ¿Por qué?', opciones: ['La segmentación solo está conectada a la tabla dinámica desde la que se insertó; falta agregar la otra en Conexiones de informe', 'Los gráficos de columnas no se pueden filtrar', 'Hay que actualizar el libro cada vez', 'La segmentación solo funciona con fechas'], correcta: 0, explicacion: 'Una segmentación nace conectada solo a su tabla dinámica de origen. Para que controle todo el tablero hay que conectarla a las demás en <b>Conexiones de informe</b> (todas deben venir de la misma fuente de datos).' },
    },
    micro: [
      { titulo: 'Tipos de indicador', tipo: 'opcion', enunciado: 'El indicador «<b>% de pacientes con diabetes con HbA1c menor a 7 %</b>» es, según Donabedian, un indicador de…', opciones: ['Resultado', 'Estructura', 'Proceso', 'Demanda'], correcta: 0, explicacion: 'Mide el efecto en la salud del paciente (control glucémico): es un indicador de <b>resultado</b>. «% de diabéticos con HbA1c medida en el año» sería de proceso.' },
      { titulo: 'El gráfico para cada pregunta', tipo: 'opcion', enunciado: 'En el tablero quieres mostrar si el <b>% de control</b> mejoró <b>mes a mes</b> respecto a la meta del 70 %.', opciones: ['Líneas con una línea de referencia en 70 %', 'Circular por mes', 'Barras apiladas en 3D', 'Una tabla con todos los registros'], correcta: 0, explicacion: 'Para ver la evolución en el tiempo se usan <b>líneas</b>; la línea de meta da el contexto para juzgar si se cumple.' },
      {
        titulo: 'Tarjeta con CONTAR.SI.CONJUNTO', tipo: 'hoja',
        enunciado: 'En E2 cuenta las consultas de <b>Hipertensión</b> en la sede <b>Norte</b> y en E3 cuántas de ellas tienen al paciente <b>en control</b> («Sí»). Usa CONTAR.SI.CONJUNTO.',
        hoja: { hojas: [{ nombre: 'Consultas', datos: [['Sede', 'Programa', 'Controlado'], ...sub.slice(0, 30).map((c) => [c.sede, c.programa, c.controlado])], celdas: { D2: 'Consultas HTA Norte', D3: 'En control' }, estilos: { 'A1:C1': ENC, 'D2:D3': { b: true } }, anchos: { B: 130, D: 160 }, objetivo: 'E2:E3', cols: 7 }], herramientas: ['formulas'] },
        solucion: { E2: '=CONTAR.SI.CONJUNTO(A2:A31,"Norte",B2:B31,"Hipertensión")', E3: '=CONTAR.SI.CONJUNTO(A2:A31,"Norte",B2:B31,"Hipertensión",C2:C31,"Sí")' },
        pruebas: [{ tipo: 'usa', rango: 'E2:E3', funciones: ['CONTAR.SI.CONJUNTO'], mensaje: 'En {celda} usa CONTAR.SI.CONJUNTO.' }, { tipo: 'valores', rango: 'E2:E3', mensaje: '{celda} muestra {obtenido}; debería ser {esperado}. Cada criterio va en pareja: rango, criterio.' }],
        pista: ['<code>=CONTAR.SI.CONJUNTO(A2:A31,"Norte",B2:B31,"Hipertensión")</code>; en E3 agrega un tercer par: <code>C2:C31,"Sí"</code>.'],
      },
      {
        titulo: 'Conexiones de informe', tipo: 'widget', enunciado: 'El tablero tiene una segmentación de <b>Sede</b> que no filtra nada. Conéctala a las tres tarjetas y al gráfico de consultas por mes, pero <b>no</b> al gráfico «% de control por sede».',
        crear: (c, listo) => {
          const { h } = LT.u;
          const info = h('div', { class: 'retro' });
          const z = h('div');
          c.append(z, info);
          LT.widgets.tablero(z, { datos: CRON, indicadores: INDICADORES, graficos: GRAFICOS, segmentaciones: SEGM, inicial: { titulo: 'Programa de enfermedades crónicas', tarjetas: { consultas: { meta: '' }, control: { meta: '70%' }, espera: { meta: '30' } }, visuales: { consultasMes: { tipo: 'lineas' }, controlSede: { tipo: 'columnas' } }, segm: ['Sede'], conexiones: { Sede: [] } }, alCambiar: (e) => {
            const cs = e.conexiones.Sede || [];
            const ok = ['k:consultas', 'k:control', 'k:espera', 'g:consultasMes'].every((x) => cs.includes(x)) && !cs.includes('g:controlSede');
            info.innerHTML = '';
            if (ok) { info.appendChild(h('div', { class: 'aviso-caja ok' }, '✓ Ahora la sede filtra las tarjetas y la evolución mensual; el gráfico por sede sigue comparando las tres sedes.')); listo(); }
            else if (cs.includes('g:controlSede')) info.appendChild(h('div', { class: 'aviso-caja alerta' }, 'Si filtras «% de control por sede» con la sede, el gráfico se queda con una sola barra y ya no compara: desconéctalo.'));
          } });
        },
      },
    ],
    reto: {
      titulo: 'Tablero del programa de enfermedades crónicas', tipo: 'widget', crear: crearReto,
      base: {
        instrucciones: ['<b>Pestaña 1 (hoja Tablero):</b> C5 = consultas de la sede de C2 y el programa de C3; C6 = cuántas tienen al paciente en control; C7 = % de control (C6/C5); C9 = «En meta» si C7 ≥ C8 y si no «Debajo de la meta»; C10 = espera promedio. Agrega a C7 un formato condicional rojo cuando esté debajo de la meta (=$C$8).', '<b>Pestaña 2 (diseño):</b> título; tarjetas de Consultas, % de pacientes en control (meta 70 %) y Espera promedio; gráfico «Consultas por mes» en líneas y «% de control por sede» en columnas o barras; segmentación Programa conectada a todo. Responde la pregunta.'],
        pistas: ['Las tarjetas son conteos con dos criterios (sede y programa) y un tercero para «en control».', 'C5: <code>=CONTAR.SI.CONJUNTO(Consultas!$C$2:$C$' + filaFin + ', C2, Consultas!$D$2:$D$' + filaFin + ', C3)</code>. C10: SUMAR.SI.CONJUNTO de la espera entre C5. Formato condicional: Es menor que… =$C$8.', 'C6 agrega el par <code>Consultas!$G$2:$G$' + filaFin + ', "Sí"</code>; C7 <code>=C6/C5</code>; C9 <code>=SI(C7&gt;=C8, "En meta", "Debajo de la meta")</code>. En el diseño, marca la segmentación Programa y todas sus conexiones.'],
      },
      niveles: {
        explorador: { instrucciones: ['Pestaña 1: C5 <code>=CONTAR.SI.CONJUNTO(Consultas!$C$2:$C$' + filaFin + ',C2,Consultas!$D$2:$D$' + filaFin + ',C3)</code>; C6 igual con <code>,Consultas!$G$2:$G$' + filaFin + ',"Sí"</code> al final; C7 <code>=C6/C5</code>; C9 <code>=SI(C7&gt;=C8,"En meta","Debajo de la meta")</code>; C10 <code>=SUMAR.SI.CONJUNTO(Consultas!$H$2:$H$' + filaFin + ',Consultas!$C$2:$C$' + filaFin + ',C2,Consultas!$D$2:$D$' + filaFin + ',C3)/C5</code>. Selecciona C7 › Formato condicional › Es menor que… › =$C$8.', 'Pestaña 2: las tres tarjetas ya están; escribe 70% como meta de control, agrega los dos gráficos con su tipo, la segmentación Programa y marca todas sus conexiones. Filtra Hipertensión y responde.'] },
        experto: { instrucciones: ['Pestaña 1: lo del nivel Analista, con listas desplegables en C2 (sedes) y C3 (programas), y SI.ERROR en C7 para evitar #¡DIV/0!.', 'Pestaña 2: lo del nivel Analista, con meta de 30 minutos en la espera y una segunda segmentación por Sede conectada a todo excepto al gráfico «% de control por sede». Responde con Programa = Diabetes tipo 2 y Sede = Sur.'] },
      },
    },
    lab: {
      archivo: 'lab13-tablero.xlsx', titulo: 'Dashboard del programa de crónicos en Excel',
      contexto: 'La hoja Consultas tiene las ' + D.cronicos.length + ' consultas de seguimiento de 2025. La hoja Tablero es para tu dashboard y Respuestas para tus conclusiones.',
      pasos: {
        explorador: [{ texto: 'Convierte Consultas en tabla (Ctrl+T).', ruta: ['Insertar', 'Tabla'] }, 'En Tablero: C4 = número de consultas (CONTARA de los folios), C5 = % de control (CONTAR.SI de «Sí» entre el número de consultas) y C6 = espera promedio (PROMEDIO).', { texto: 'Crea dos tablas dinámicas (consultas por mes; % de control por sede) y un gráfico dinámico de cada una; muévelos a Tablero.', ruta: ['Insertar', 'Tabla dinámica'] }, { texto: 'Inserta una segmentación por Programa y conéctala a las dos tablas dinámicas.', ruta: ['Análisis de tabla dinámica', 'Insertar segmentación de datos'] }, 'En Respuestas: B2 = % de control de Hipertensión y B3 = sede con menor % de control en Diabetes tipo 2. Guarda y sube el libro.'],
        analista: ['Tablero: tarjetas C4 (consultas), C5 (% de control) y C6 (espera promedio) con fórmulas.', 'Al menos dos tablas dinámicas y dos gráficos dinámicos.', 'Segmentación por Programa conectada a dos o más tablas dinámicas.', 'Respuestas B2 (% de control en Hipertensión) y B3 (sede con menor control en Diabetes tipo 2). Guarda y sube el libro.'],
        experto: ['Lo del nivel Analista.', 'Escala de tiempo por Fecha conectada al tablero.', 'Formato condicional en C5 contra la meta del 70 %.', 'Oculta las líneas de cuadrícula de la hoja Tablero. Guarda y sube el libro.'],
      },
      notaWeb: 'Excel para la web crea tablas dinámicas, gráficos dinámicos y segmentaciones; las conexiones de informe y la escala de tiempo pueden requerir Excel de escritorio.',
      pruebas: [
        { titulo: 'Tarjetas con fórmulas', fn: (L, A) => {
          A.hoja('Tablero');
          const filas = [];
          for (let r = 2; r <= 600; r++) { const f = L.valor('Consultas', 'A' + r); if (f == null || f === '') break; filas.push(r); }
          const n = filas.length;
          const sies = filas.filter((r) => String(L.valor('Consultas', 'G' + r)) === 'Sí').length;
          const espera = filas.reduce((s, r) => s + (A.num(L.valor('Consultas', 'H' + r)) || 0), 0) / n;
          for (const d of ['C4', 'C5', 'C6']) if (!L.tieneFormula('Tablero', d)) return 'Tablero!' + d + ' debe calcularse con una fórmula.';
          if (!A.cerca(A.num(L.valor('Tablero', 'C4')), n)) return 'C4 debería mostrar ' + n + ' consultas.';
          const c5 = A.num(L.valor('Tablero', 'C5'));
          if (!(A.cerca(c5, sies / n) || A.cerca(c5, sies / n * 100))) return 'C5 debería ser el % de control: ' + A.fmtEs(Math.round(sies / n * 1000) / 10) + ' %.';
          return A.cerca(A.num(L.valor('Tablero', 'C6')), espera) ? true : 'C6 debería ser la espera promedio: ' + A.fmtEs(Math.round(espera * 10) / 10) + ' min.';
        } },
        { titulo: 'Dos tablas dinámicas y dos gráficos dinámicos', fn: (L) => (L.dinamicas.length < 2 ? 'Crea al menos dos tablas dinámicas (hay ' + L.dinamicas.length + ').' : L.graficos.filter((g) => g.dinamico).length >= 2 ? true : 'Crea al menos dos gráficos dinámicos.') },
        { titulo: 'Segmentación de Programa conectada a varias tablas', fn: (L) => { const s = L.segmentaciones.find((x) => /programa/i.test(x.campo || x.nombre)); if (!s) return 'Inserta una segmentación por Programa.'; return s.dinamicas.length >= 2 ? true : 'Conecta la segmentación a dos o más tablas dinámicas (clic derecho › Conexiones de informe).'; } },
        { titulo: 'Respuestas del tablero', fn: (L) => {
          if (!L.hoja('Respuestas')) return 'No encontré la hoja Respuestas.';
          const b2 = L.valor('Respuestas', 'B2');
          const n = typeof b2 === 'number' ? (b2 <= 1 ? b2 * 100 : b2) : parseFloat(String(b2 || '').replace(/[%\s]/g, ''));
          if (!isFinite(n) || Math.abs(n - PCT_HTA) > 0.6) return 'B2: el % de control en Hipertensión no es «' + (b2 == null ? 'vacío' : b2) + '». Filtra el tablero por Programa.';
          const sedes = { Centro: 0, Norte: 0, Sur: 0 };
          const menor = Object.keys(sedes).map((s) => [s, pct(CRON.filter((f) => f.Programa === 'Diabetes tipo 2' && f.Sede === s))]).sort((a, b) => a[1] - b[1])[0][0];
          return String(L.valor('Respuestas', 'B3') || '').trim().toLowerCase() === menor.toLowerCase() ? true : 'B3: revisa el gráfico de % de control por sede con el filtro en Diabetes tipo 2.';
        } },
        { titulo: 'Escala de tiempo', nivel: 'experto', fn: (L) => (L.escalasTiempo.length ? true : 'Agrega una escala de tiempo por Fecha.') },
        { titulo: 'Semáforo en el % de control', nivel: 'experto', fn: (L, A) => (L.hoja('Tablero').condicionales.some((x) => A.rangoCubre(x.sqref, 'C5')) ? true : 'Agrega a Tablero!C5 un formato condicional contra la meta del 70 %.') },
        { titulo: 'Tablero sin líneas de cuadrícula', nivel: 'experto', fn: (L) => (L.hoja('Tablero').sinCuadricula ? true : 'Oculta las líneas de cuadrícula de la hoja Tablero (Vista › Líneas de cuadrícula).') },
      ],
    },
    donde: [
      { comando: 'Conexiones de informe (segmentación)', ruta: ['Segmentación', 'Conexiones de informe'], nota: 'También con clic derecho sobre la segmentación. En versiones recientes se llama Conexiones de filtro.' },
      { comando: 'Escala de tiempo', ruta: ['Análisis de tabla dinámica', 'Insertar escala de tiempo'] },
      { comando: 'Gráfico dinámico', ruta: ['Análisis de tabla dinámica', 'Gráfico dinámico'] },
      { comando: 'Mover gráfico a la hoja Tablero', ruta: ['Diseño de gráfico dinámico', 'Mover gráfico'] },
      { comando: 'Ocultar líneas de cuadrícula', ruta: ['Vista', 'Líneas de cuadrícula'] },
      { comando: 'Ocultar botones de campo del gráfico', ruta: ['Análisis de gráfico dinámico', 'Botones de campo'] },
    ],
    glosario: ['CONTAR.SI.CONJUNTO', 'SUMAR.SI.CONJUNTO', 'SI', 'SI.ERROR', 'CONTARA', 'PROMEDIO'],
    atajos: ['<kbd>Alt+F5</kbd> actualiza la tabla dinámica seleccionada; <kbd>Ctrl+Alt+F5</kbd> actualiza todo el libro.', 'Con <kbd>Alt</kbd> presionado al mover un gráfico, se ajusta a la cuadrícula: el tablero queda alineado.', 'Formato › Alinear › Alinear a la izquierda / Distribuir horizontalmente para ordenar tarjetas y gráficos.'],
  });
})();
