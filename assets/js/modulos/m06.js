/* Módulo 6 · Gráficos */
(function () {
  const { D, totalesPor, mensualPorArea, mensualPorSede } = LT.caso;
  const MESES = D.mesesCortos;
  const porServicio = totalesPor('servicio');
  const servicios = D.servicios.map((s) => s.nombre);
  const porArea = mensualPorArea();
  const porSede = mensualPorSede();
  const porPago = totalesPor('pago');
  const lider = Object.entries(porServicio).sort((a, b) => b[1] - a[1])[0][0];
  const top5 = Object.entries(porServicio).sort((a, b) => b[1] - a[1]).slice(0, 5).map((x) => x[0]);
  const mesVac = MESES[porArea['Vacunación'].indexOf(Math.max(...porArea['Vacunación']))];
  const CONJ = [
    { id: 'sedes', nombre: 'Atenciones mensuales por sede', categorias: MESES, series: Object.entries(porSede).map(([n, v]) => ({ nombre: n, valores: v })), formato: '#,##0' },
    { id: 'servicios', nombre: 'Atenciones anuales por servicio (2025)', categorias: servicios, series: [{ nombre: 'Atenciones 2025', valores: servicios.map((p) => porServicio[p] || 0) }], formato: '#,##0' },
    { id: 'meses', nombre: 'Atenciones mensuales por área', categorias: MESES, series: D.areas.map((a) => ({ nombre: a, valores: porArea[a] })), formato: '#,##0' },
  ];

  function galeria(c) {
    const fila = LT.u.h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' } });
    const casos = [
      ['Comparar categorías → columnas o barras', { tipo: 'columnas', categorias: ['Centro', 'Norte', 'Sur'], series: [{ nombre: 'Atenciones', valores: ['Centro', 'Norte', 'Sur'].map((s) => totalesPor('sede')[s]) }], titulo: 'Atenciones por sede', formato: '#,##0' }],
      ['Cambio en el tiempo → líneas', { tipo: 'lineas', categorias: MESES, series: [{ nombre: 'Vacunación', valores: porArea['Vacunación'] }], titulo: 'Vacunación por mes', formato: '#,##0' }],
      ['Partes de un todo (pocas) → circular', { tipo: 'circular', categorias: Object.keys(porPago), series: [{ nombre: 'Atenciones', valores: Object.values(porPago) }], titulo: 'Atenciones por tipo de pago', formato: '#,##0' }],
    ];
    for (const [t, o] of casos) {
      const g = LT.u.h('div', { class: 'graf-cont' });
      const lienzo = LT.u.h('div');
      g.append(LT.u.h('div', { style: { fontWeight: 600, fontSize: '.88rem', marginBottom: '4px' } }, t), lienzo);
      fila.appendChild(g);
      setTimeout(() => LT.graficos.dibujar(lienzo, Object.assign({ ancho: 420, alto: 260 }, o)), 0);
    }
    c.appendChild(fila);
  }

  function crearReto(cont, nivel) {
    const { h } = LT.u;
    const estado = { g1: null, g2: null, r1: '', r2: '' };
    const experto = nivel === 'experto', explorador = nivel === 'explorador';
    const pestanas = h('div', { class: 'grupo-btn', style: { marginBottom: '10px' } });
    const p1 = h('div'), p2 = h('div');
    const mostrar = (i) => { p1.style.display = i === 1 ? '' : 'none'; p2.style.display = i === 2 ? '' : 'none'; pestanas.querySelectorAll('button').forEach((b, k) => b.classList.toggle('primario', k + 1 === i)); };
    pestanas.append(h('button', { class: 'btn chico primario', onclick: () => mostrar(1) }, 'Gráfico 1: ¿qué servicio se usa más?'), h('button', { class: 'btn chico', onclick: () => mostrar(2) }, 'Gráfico 2: vacunación vs. rehabilitación por mes'));
    const preg1 = h('select', { class: 'herr-sel', onchange: (e) => { estado.r1 = e.target.value; } }, h('option', { value: '' }, 'Elige…'), top5.slice().sort().map((p) => h('option', { value: p }, p)));
    const preg2 = h('select', { class: 'herr-sel', onchange: (e) => { estado.r2 = e.target.value; } }, h('option', { value: '' }, 'Elige…'), MESES.map((m) => h('option', { value: m }, m)));
    const g1 = h('div'), g2 = h('div');
    p1.append(h('p', { class: 'instr' }, explorador ? 'Los datos ya están elegidos. Escoge el tipo de gráfico para comparar servicios y escribe un título.' : 'Elige los datos, el tipo de gráfico y escribe un título.'), g1, h('div', { class: 'aviso-caja info' }, 'Según tu gráfico, ¿qué servicio tuvo más atenciones en 2025? ', preg1));
    p2.append(h('p', { class: 'instr' }, explorador ? 'Elige el conjunto «Atenciones mensuales por área», deja solo Vacunación y Rehabilitación, y escoge el tipo de gráfico para ver el cambio en el tiempo.' : 'Muestra solo Vacunación y Rehabilitación a lo largo del año.'), g2, h('div', { class: 'aviso-caja info' }, 'Según tu gráfico, ¿en qué mes hubo más vacunación? ', preg2));
    cont.append(pestanas, p1, p2);
    setTimeout(() => {
      LT.graficos.Constructor(g1, { conjuntos: CONJ, estadoInicial: explorador ? { conjunto: 'servicios' } : {}, alCambiar: (e) => { estado.g1 = e; } });
      LT.graficos.Constructor(g2, { conjuntos: CONJ, estadoInicial: explorador ? { conjunto: 'meses' } : {}, alCambiar: (e) => { estado.g2 = e; } });
      mostrar(1);
    }, 0);
    return {
      verificar: () => {
        const r = [];
        const a = estado.g1 || {}, b = estado.g2 || {};
        const add = (ok, titulo, mensaje) => r.push({ ok, titulo, mensaje: ok ? titulo : mensaje });
        add(a.conjunto === 'servicios', 'Gráfico 1 usa las atenciones por servicio', 'Gráfico 1: elige los datos «Atenciones anuales por servicio».');
        add(experto ? a.tipo === 'barras' : ['columnas', 'barras'].includes(a.tipo), 'Gráfico 1: tipo adecuado para comparar', experto ? 'Gráfico 1: con 20 nombres largos, las barras horizontales se leen mejor.' : 'Gráfico 1: para comparar servicios usa columnas o barras.');
        add(!!(a.titulo || '').trim(), 'Gráfico 1 tiene título', 'Gráfico 1: escribe un título que diga qué muestra.');
        if (experto) add(!!(a.ejeX || '').trim() && !!(a.ejeY || '').trim() && a.etiquetas, 'Gráfico 1 con títulos de ejes y etiquetas de datos', 'Gráfico 1: agrega títulos a los dos ejes y etiquetas de datos.');
        add(estado.r1 === lider, 'Respuesta 1 correcta', estado.r1 ? 'Revisa tu gráfico: el servicio con más atenciones no es ' + estado.r1 + '. Activa las etiquetas de datos o pasa el cursor sobre las barras.' : 'Responde qué servicio tuvo más atenciones.');
        add(b.conjunto === 'meses', 'Gráfico 2 usa las atenciones mensuales por área', 'Gráfico 2: elige «Atenciones mensuales por área».');
        const s = (b.series || []).slice().sort().join('|');
        add(s === 'Rehabilitación|Vacunación', 'Gráfico 2 compara solo Vacunación y Rehabilitación', 'Gráfico 2: deja marcadas solo las series Vacunación y Rehabilitación.');
        add(b.tipo === 'lineas', 'Gráfico 2: líneas para ver el cambio en el tiempo', 'Gráfico 2: para mostrar cómo cambian por mes, usa líneas.');
        add(!!(b.titulo || '').trim(), 'Gráfico 2 tiene título', 'Gráfico 2: escribe un título.');
        if (experto) add(!!(b.ejeY || '').trim(), 'Gráfico 2 con título del eje vertical', 'Gráfico 2: agrega el título del eje vertical (por ejemplo «Atenciones»).');
        add(estado.r2 === mesVac, 'Respuesta 2 correcta', estado.r2 ? 'Revisa la línea de Vacunación: su punto más alto no está en ' + estado.r2 + '.' : 'Responde en qué mes hubo más vacunación.');
        return { ok: r.every((x) => x.ok), resultados: r };
      },
    };
  }

  LT.definirModulo({
    id: 6,
    objetivo: 'Elegir el tipo de gráfico adecuado para cada pregunta, crearlo y personalizarlo; agregar minigráficos de tendencia.',
    situacion: 'En la reunión del Comité de Calidad quiero responder con imágenes dos preguntas: <b>¿qué servicio de la clínica se usa más?</b> y <b>¿cómo cambian mes a mes la vacunación y la rehabilitación?</b> Necesito saber cuándo reforzar al personal de vacunación.',
    explicacion: [
      { html: '<h3>Primero la pregunta, después el gráfico</h3><ul><li><b>Comparar</b> categorías (servicios, sedes): <b>columnas</b>; si los nombres son largos o son muchos, <b>barras</b> horizontales.</li><li><b>Cambio en el tiempo</b> (meses, semanas): <b>líneas</b>. Es la base de las curvas epidemiológicas y de la estacionalidad (por ejemplo, la influenza).</li><li><b>Partes de un todo</b> con pocas partes (2 a 5): <b>circular</b>. Con muchas partes, mejor barras.</li><li><b>Relación entre dos variables</b> (peso y talla, edad y presión): <b>dispersión</b>.</li></ul><p>Un buen gráfico tiene un <b>título</b> que dice qué muestra (mejor aún, la conclusión), ejes con unidades y, cuando hay varias series, una <b>leyenda</b>. Las <b>etiquetas de datos</b> ayudan cuando el número exacto importa. Cuidado con los ejes que no empiezan en cero: exageran diferencias.</p><p>Los <b>minigráficos</b> (Insertar › Minigráficos) son gráficos dentro de una celda: muestran la tendencia de cada fila de un vistazo.</p>' },
      { titulo: 'Cada pregunta, su gráfico', instr: 'Pasa el cursor sobre las marcas para ver los valores.', widget: galeria },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Crear un gráfico de columnas',
      pasos: ['Selecciona los datos con sus encabezados (por ejemplo, Servicio y Atenciones).', { texto: 'Insertar › Gráficos › Columnas (o «Gráficos recomendados»).', ruta: ['Insertar', 'Insertar gráfico de columnas o de barras'] }, { texto: 'Con el gráfico seleccionado, en Diseño de gráfico › Agregar elemento de gráfico agrega título, títulos de ejes o etiquetas.', ruta: ['Diseño de gráfico', 'Agregar elemento de gráfico'] }, 'Haz clic en el título para cambiar su texto.'],
      pregunta: { texto: 'Quieres mostrar cómo cambiaron los casos de enfermedad respiratoria <b>semana a semana</b> durante 2025. ¿Qué gráfico eliges?', opciones: ['Circular', 'Líneas', 'Barras apiladas', 'Dispersión'], correcta: 1, explicacion: 'Para ver cambios en el tiempo, las <b>líneas</b> muestran la tendencia y los picos de un vistazo.' },
    },
    micro: [
      { titulo: 'Partes de un todo', tipo: 'opcion', enunciado: 'Quieres mostrar qué parte de las atenciones se pagó como <b>Particular, Convenio universitario o Seguro médico</b> (3 categorías).', opciones: ['Circular', 'Líneas', 'Dispersión', 'Área'], correcta: 0, explicacion: 'Con pocas partes de un total, el gráfico <b>circular</b> funciona bien.' },
      { titulo: 'Nombres largos', tipo: 'opcion', enunciado: 'Vas a comparar las atenciones de los 20 servicios; algunos nombres son largos, como «Hemoglobina glucosilada». ¿Qué tipo se lee mejor?', opciones: ['Columnas', 'Barras horizontales', 'Circular', 'Líneas'], correcta: 1, explicacion: 'Las <b>barras horizontales</b> dejan espacio para leer los nombres largos sin girarlos.' },
      {
        titulo: 'Minigráficos de tendencia', tipo: 'widget', enunciado: 'Elige el tipo de minigráfico que muestra mejor la <b>tendencia</b> mensual de atenciones de cada sede.',
        crear: (c, listo) => {
          const { h } = LT.u;
          const tabla = h('table', { class: 'tabla-sitio', style: { maxWidth: '620px' } });
          const retro = h('div');
          const dibujar = (tipo) => {
            tabla.innerHTML = '';
            tabla.appendChild(h('thead', null, h('tr', null, h('th', null, 'Sede'), h('th', null, 'Ene'), h('th', null, '…'), h('th', null, 'Dic'), h('th', null, 'Minigráfico'))));
            const tb = h('tbody');
            for (const [sede, v] of Object.entries(porSede)) {
              const td = h('td');
              if (tipo) td.appendChild(LT.graficos.minigrafico(v, tipo, { ancho: 120, alto: 26 }));
              tb.appendChild(h('tr', null, h('td', null, sede), h('td', null, LT.formato.formatear(v[0], '#,##0').texto), h('td', null, '…'), h('td', null, LT.formato.formatear(v[11], '#,##0').texto), td));
            }
            tabla.appendChild(tb);
          };
          const botones = h('div', { class: 'grupo-btn', style: { margin: '8px 0' } });
          [['linea', 'Línea'], ['columna', 'Columna'], ['ganancia', 'Ganancia o pérdida']].forEach(([t, n]) => botones.appendChild(h('button', { class: 'btn chico', onclick: () => {
            dibujar(t);
            retro.innerHTML = '';
            if (t === 'linea') { retro.appendChild(h('div', { class: 'aviso-caja ok' }, '✓ La línea muestra la tendencia: Norte sube en verano y Sur crece al final del año. El punto naranja marca el mes más alto.')); listo(); }
            else retro.appendChild(h('div', { class: 'aviso-caja alerta' }, t === 'ganancia' ? 'Ganancia o pérdida solo distingue positivos y negativos: aquí todos son positivos.' : 'Las columnas sirven para comparar meses, pero la tendencia se ve mejor con una línea continua.'));
          } }, n)));
          c.append(botones, tabla, retro);
          dibujar(null);
        },
      },
    ],
    reto: { titulo: '¿Qué servicio se usa más y cuándo se vacuna más?', tipo: 'widget', crear: crearReto, base: { instrucciones: ['<b>Gráfico 1:</b> compara las atenciones anuales de los 20 servicios con el tipo de gráfico adecuado y un título. Responde qué servicio tuvo más atenciones.', '<b>Gráfico 2:</b> muestra cómo cambian por mes las atenciones de <b>Vacunación</b> y <b>Rehabilitación</b> (solo esas dos series), con un título. Responde en qué mes hubo más vacunación.'], pistas: ['Primero piensa qué pregunta responde cada gráfico: comparar o ver un cambio en el tiempo.', 'Comparar → columnas o barras; tiempo → líneas. Desmarca las series que no necesitas.', 'Gráfico 1: «Atenciones anuales por servicio» + Barras. Gráfico 2: «Atenciones mensuales por área», solo Vacunación y Rehabilitación, + Líneas.'] },
      niveles: { explorador: { instrucciones: ['Gráfico 1: los datos ya están elegidos; elige <b>Columnas</b> o <b>Barras</b> y escribe un título.', 'Gráfico 2: deja solo Vacunación y Rehabilitación, elige <b>Líneas</b> y escribe un título.', 'Responde las dos preguntas usando tus gráficos (pasa el cursor para ver los valores).'] }, experto: { instrucciones: ['Gráfico 1: barras horizontales con título, títulos de ambos ejes y etiquetas de datos.', 'Gráfico 2: líneas de Vacunación y Rehabilitación con título y título del eje vertical.', 'Responde las dos preguntas.'] } } },
    lab: {
      archivo: 'lab06-graficos.xlsx', titulo: 'Gráficos para el Comité de Calidad',
      contexto: 'El libro tiene tres hojas: Servicios (atenciones anuales), Meses (atenciones mensuales por área) y Sedes (atenciones mensuales).',
      pasos: {
        explorador: [{ texto: 'En Servicios, selecciona A1:B21 e inserta un gráfico de columnas o barras con título.', ruta: ['Insertar', 'Insertar gráfico de columnas o de barras'] }, { texto: 'En Meses, selecciona Mes, Vacunación y Rehabilitación (A1:C13) e inserta un gráfico de líneas con título.', ruta: ['Insertar', 'Insertar gráfico de líneas o de áreas'] }, { texto: 'En Sedes, selecciona N2:N4 e inserta minigráficos de línea con datos B2:M4.', ruta: ['Insertar', 'Línea'] }, 'Guarda y sube el libro.'],
        analista: ['Gráfico de columnas o barras de las atenciones por servicio, con título.', 'Gráfico de líneas de Vacunación y Rehabilitación por mes, con título.', 'Minigráficos de línea en Sedes!N2:N4.', 'Guarda y sube el libro.'],
        experto: ['Los dos gráficos y los minigráficos del nivel Analista.', 'Agrega títulos de ejes a ambos gráficos.', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { titulo: 'Gráfico de columnas o barras con título', fn: (L) => { const g = L.graficos.find((x) => x.tipos.some((t) => t === 'columnas' || t === 'barras')); if (!g) return 'No encontré un gráfico de columnas o barras.'; return g.tieneTitulo ? true : 'El gráfico de columnas o barras no tiene título.'; } },
        { titulo: 'Gráfico de líneas con dos series y título', fn: (L) => { const g = L.graficos.find((x) => x.tipos.includes('lineas')); if (!g) return 'No encontré un gráfico de líneas.'; if (g.series < 2) return 'El gráfico de líneas debe mostrar Vacunación y Rehabilitación (2 series).'; return g.tieneTitulo ? true : 'El gráfico de líneas no tiene título.'; } },
        { titulo: 'Minigráficos en Sedes', fn: (L) => { const h = L.hoja('Sedes'); const n = h ? h.minigraficos.reduce((s, g) => s + g.cantidad, 0) : 0; return n >= 3 ? true : 'Inserta minigráficos para las tres sedes (N2:N4).'; } },
        { titulo: 'Títulos de ejes', nivel: 'experto', fn: (L) => { const sin = L.graficos.filter((g) => !g.tipos.includes('circular')).find((g) => g.ejes.filter((e) => e.conTitulo).length < 2); return sin ? 'Agrega títulos a los dos ejes del gráfico de ' + sin.tipos[0] + '.' : true; } },
      ],
    },
    donde: [
      { comando: 'Gráficos recomendados', ruta: ['Insertar', 'Gráficos recomendados'] },
      { comando: 'Minigráficos de línea', ruta: ['Insertar', 'Línea'], nota: 'Grupo Minigráficos.' },
      { comando: 'Agregar elemento de gráfico (títulos de ejes)', ruta: ['Diseño de gráfico', 'Agregar elemento de gráfico', 'Títulos de ejes'], nota: 'La pestaña Diseño de gráfico aparece al seleccionar un gráfico.' },
      { comando: 'Cambiar tipo de gráfico', ruta: ['Diseño de gráfico', 'Cambiar tipo de gráfico'] },
    ],
    atajos: ['<kbd>Alt+F1</kbd> inserta un gráfico con los datos seleccionados (en Excel).', 'Selecciona columnas no contiguas manteniendo <kbd>Ctrl</kbd>.'],
  });
})();
