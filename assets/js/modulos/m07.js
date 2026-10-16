/* Módulo 7 · Imprimir y distribuir */
(function () {
  const { D, mes } = LT.caso;
  const MESES = D.mesesCortos;
  const mensual = {};
  const mensualSuc = {};
  for (const v of D.ventas) {
    (mensual[v.producto] = mensual[v.producto] || new Array(12).fill(0))[mes(v.fecha) - 1] += v.total;
    const k = v.producto + ' · ' + v.sucursal;
    (mensualSuc[k] = mensualSuc[k] || new Array(12).fill(0))[mes(v.fecha) - 1] += v.total;
  }
  const filasRes = D.productos.map((p) => { const m = mensual[p.nombre] || new Array(12).fill(0); return [p.nombre, ...m, m.reduce((a, b) => a + b, 0)]; });
  const filasDet = [];
  for (const p of D.productos) for (const s of ['Centro', 'Norte', 'Sur']) { const m = mensualSuc[p.nombre + ' · ' + s] || new Array(12).fill(0); filasDet.push([p.nombre + ' · ' + s, ...m, m.reduce((a, b) => a + b, 0)]); }
  const DATOS = { encabezados: ['Producto', ...MESES, 'Total'], filas: filasRes.concat(filasDet), anchos: [150, ...new Array(12).fill(64), 80] };

  function crearReto(cont, nivel) {
    let est = null;
    const w = LT.widgets.impresion(cont, { datos: DATOS, areas: [['todo', 'Resumen por producto (A1:N21)'], ['detalle', 'Detalle por sucursal (A23:N83)']], areaFilas: { todo: [0, 20], detalle: [20, 80] }, alCambiar: (e) => { est = e; } });
    return {
      verificar: () => {
        const e = est || w.estado();
        const r = [];
        const add = (ok, titulo, mensaje) => r.push({ ok, titulo, mensaje: ok ? titulo : mensaje });
        if (nivel === 'experto') {
          add(e.area === 'detalle', 'Área de impresión: el detalle por sucursal', 'Elige como área de impresión el «Detalle por sucursal».');
          add(e.orientacion === 'horizontal', 'Orientación horizontal', 'Cambia la orientación a horizontal.');
          add(e.paginasAncho === 1, 'Todas las columnas caben a lo ancho', 'Las columnas no caben a lo ancho: usa «Ajustar todas las columnas en una página».');
          add(e.ajuste !== 'hoja', 'Sin encoger todo a una sola hoja', 'Con 60 filas, «Ajustar hoja en una página» deja la letra ilegible: ajusta solo las columnas.');
          add(!!e.titulos, 'Encabezados repetidos en cada página', 'Activa «Imprimir títulos» para repetir los encabezados en cada página.');
          add(e.pie === 'paginaDe', 'Pie de página «Página X de Y»', 'Elige el pie «Página 1 de ?».');
        } else {
          add(e.area === 'todo', 'Área de impresión: el resumen por producto', 'Elige como área de impresión el «Resumen por producto».');
          add(e.orientacion === 'horizontal', 'Orientación horizontal', 'Marta lo quiere en orientación horizontal.');
          add(e.paginas === 1, 'El reporte cabe en una sola página', 'Todavía ocupa ' + e.paginas + ' páginas: ajusta la escala o los márgenes.');
          add(e.pie === 'pagina' || e.pie === 'paginaDe', 'Pie de página con número de página', 'Agrega un pie de página con el número de página.');
        }
        return { ok: r.every((x) => x.ok), resultados: r };
      },
    };
  }

  LT.definirModulo({
    id: 7,
    objetivo: 'Configurar la página, el área de impresión y los títulos; exportar a PDF.',
    situacion: 'Imprimí el reporte anual y salió en varias hojas, con columnas cortadas. Lo necesito <b>en una sola hoja horizontal, con número de página</b>, y en <b>PDF</b> para mandarlo por correo.',
    explicacion: [
      { html: '<h3>Antes de imprimir, la vista previa</h3><p><b>Archivo › Imprimir</b> muestra cómo saldrá cada página. Si algo no cabe, se ajusta en <b>Disposición de página</b>:</p><ul><li><b>Orientación:</b> vertical u horizontal (más columnas por hoja).</li><li><b>Márgenes:</b> normales, estrechos o anchos.</li><li><b>Escalado:</b> «Ajustar hoja en una página» o «Ajustar todas las columnas en una página».</li><li><b>Área de impresión:</b> imprime solo el rango que eliges.</li><li><b>Imprimir títulos:</b> repite la fila de encabezados en cada página.</li><li><b>Encabezado y pie de página:</b> número de página, fecha, nombre del archivo.</li></ul><p>Para mandar el reporte, expórtalo como <b>PDF</b> (Archivo › Exportar › Crear PDF/XPS, o Guardar como › PDF): se ve igual en cualquier equipo.</p>' },
      { titulo: 'Explora la vista de impresión', instr: 'Cambia las opciones y observa cuántas páginas ocupa el reporte anual.', widget: (c) => LT.widgets.impresion(c, { datos: DATOS, areas: [['todo', 'Resumen por producto (A1:N21)'], ['detalle', 'Detalle por sucursal (A23:N83)']], areaFilas: { todo: [0, 20], detalle: [20, 80] } }) },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Que el reporte quepa en una hoja',
      pasos: [{ texto: 'Disposición de página › Orientación › Horizontal.', ruta: ['Disposición de página', 'Orientación'] }, { texto: 'Archivo › Imprimir › Configuración › «Ajustar hoja en una página» (o Disposición de página › Ancho: 1 página, Alto: 1 página).', ruta: ['Disposición de página', 'Ancho'] }, { texto: 'Insertar › Encabezado y pie de página › Pie de página › «Página 1».', ruta: ['Insertar', 'Encabezado y pie de página'] }, { texto: 'Archivo › Exportar › Crear documento PDF/XPS.', ruta: ['Archivo', 'Exportar', 'Crear documento PDF/XPS'] }],
      pregunta: { texto: 'Tu reporte tiene 14 columnas y 21 filas. Al imprimir, las últimas columnas salen en otra hoja. ¿Qué haces primero?', opciones: ['Cambiar a horizontal y ajustar las columnas en una página', 'Borrar las últimas columnas', 'Reducir el tamaño de la fuente celda por celda', 'Imprimir en dos hojas y pegarlas'], correcta: 0, explicacion: 'La orientación horizontal y el escalado resuelven el problema sin tocar los datos.' },
    },
    micro: [
      { titulo: 'Encabezados en cada página', tipo: 'opcion', enunciado: 'Imprimes una lista de 300 ventas y solo la primera página tiene los encabezados. ¿Qué usas?', opciones: ['Imprimir títulos (filas que se repiten)', 'Inmovilizar paneles', 'Área de impresión', 'Saltos de página'], correcta: 0, explicacion: '<b>Disposición de página › Imprimir títulos</b> › «Repetir filas en extremo superior». Inmovilizar paneles solo afecta la pantalla.', retro: { 1: 'Inmovilizar paneles fija los encabezados en pantalla, pero no al imprimir.' } },
      { titulo: 'Solo una parte de la hoja', tipo: 'opcion', enunciado: 'En la hoja hay notas internas debajo del reporte que no deben salir impresas. ¿Qué configuras?', opciones: ['El área de impresión (solo el reporte)', 'La orientación', 'Los márgenes', 'El ancho de las columnas'], correcta: 0, explicacion: 'Selecciona el reporte › Disposición de página › Área de impresión › Establecer área de impresión.' },
    ],
    reto: { titulo: 'El reporte cabe en una hoja y sale en PDF', tipo: 'widget', crear: crearReto,
      base: { instrucciones: ['Área de impresión: el <b>resumen por producto</b>.', 'Orientación <b>horizontal</b>.', 'Que todo quepa en <b>una sola página</b>.', 'Pie de página con el <b>número de página</b>.'], pistas: ['Revisa cuántas páginas indica la vista previa y por qué: ¿no caben columnas o filas?', 'La orientación horizontal da más ancho; el escalado encoge lo necesario.', 'Horizontal + «Ajustar hoja en una página» (o «Ajustar todas las columnas») + pie «Página 1».'] },
      niveles: { explorador: { instrucciones: ['En «Orientación» elige <b>Orientación horizontal</b>.', 'En «Escalado» elige <b>Ajustar hoja en una página</b>.', 'En «Pie de página» elige <b>Página 1</b>.', 'Comprueba que diga «El reporte cabe en una sola página».'] }, experto: { instrucciones: ['Imprime el <b>detalle por sucursal</b> (60 filas): orientación horizontal, todas las columnas a lo ancho de una página (sin encoger las filas), encabezados repetidos en cada página y pie «Página X de Y».'] } } },
    lab: {
      archivo: 'lab07-impresion.xlsx', titulo: 'Reporte anual listo para enviar', pdf: true, acepta: '.xlsx,.pdf',
      contexto: 'Configura la impresión en Excel y exporta el PDF. Sube <b>los dos archivos</b> (libro y PDF) a la vez.',
      pasos: {
        explorador: [{ texto: 'Selecciona A1:N23 › Área de impresión › Establecer área de impresión.', ruta: ['Disposición de página', 'Área de impresión', 'Establecer área de impresión'] }, { texto: 'Orientación horizontal.', ruta: ['Disposición de página', 'Orientación'] }, { texto: 'Ajustar: Ancho 1 página y Alto 1 página.', ruta: ['Disposición de página', 'Ancho'] }, { texto: 'Pie de página con «Página 1».', ruta: ['Insertar', 'Encabezado y pie de página'] }, { texto: 'Exporta la hoja «Reporte anual» como PDF.', ruta: ['Archivo', 'Exportar', 'Crear documento PDF/XPS'] }, 'Guarda el libro y sube el .xlsx y el .pdf juntos.'],
        analista: ['En la hoja «Reporte anual»: área de impresión A1:N23 (sin las notas internas), horizontal, en una sola página y con número de página en el pie.', 'Exporta esa hoja a PDF.', 'Sube el libro y el PDF juntos.'],
        experto: ['Configura «Reporte anual» como en el nivel Analista y expórtala a PDF.', 'En la hoja «Detalle»: todas las columnas a lo ancho de una página (alto automático), fila 1 repetida en cada página y pie «Página X de Y».', 'Sube el libro y el PDF juntos.'],
      },
      pruebas: [
        { titulo: 'Área de impresión sin las notas internas', fn: (L, A) => { A.hoja('Reporte anual'); const a = L.areaImpresion('Reporte anual'); if (!a) return 'Establece el área de impresión (A1:N23).'; const rg = LT.refs.parseRango(a.replace(/\$/g, '').split(',')[0]); return rg && rg.r1 === 0 && rg.c1 === 0 && rg.c2 >= 13 && rg.r2 >= 22 && rg.r2 <= 23 ? true : 'El área de impresión debe ser A1:N23 (es ' + a + ').'; } },
        { titulo: 'Orientación horizontal', fn: (L) => (L.hoja('Reporte anual').pagina.orientacion === 'landscape' ? true : 'Cambia la orientación a horizontal.') },
        { titulo: 'Ajustado a una página', fn: (L) => { const h = L.hoja('Reporte anual'); return h.ajustarAPagina && h.pagina.ancho === 1 && h.pagina.alto <= 1 ? true : 'Ajusta la hoja a 1 página de ancho por 1 de alto.'; } },
        { titulo: 'Pie de página con número de página', fn: (L) => (/&P/.test(L.hoja('Reporte anual').pie) ? true : 'Agrega un pie de página con el número de página.') },
        { titulo: 'PDF de una sola página', fn: (L, A, nivel) => { if (!L.pdf) return 'Sube también el PDF (selecciona el .xlsx y el .pdf a la vez).'; if (!L.pdf.valido) return 'El archivo PDF no es válido.'; if (nivel === 'experto') return true; return L.pdf.paginas === 1 ? true : 'El PDF tiene ' + (L.pdf.paginas || '?') + ' páginas: exporta solo la hoja «Reporte anual» ya ajustada.'; } },
        { titulo: 'Detalle: columnas a lo ancho de una página', nivel: 'experto', fn: (L) => { const h = L.hoja('Detalle'); return h && h.ajustarAPagina && h.pagina.ancho === 1 && h.pagina.alto === 0 ? true : 'En «Detalle», ajusta Ancho: 1 página y Alto: Automático.'; } },
        { titulo: 'Detalle: títulos y «Página X de Y»', nivel: 'experto', fn: (L) => { const t = L.titulosImpresion('Detalle'); if (!t || !/\$1(:|$)/.test(t)) return 'En «Detalle», repite la fila 1 en cada página (Imprimir títulos).'; return /&P/.test(L.hoja('Detalle').pie) && /&N/.test(L.hoja('Detalle').pie) ? true : 'El pie de «Detalle» debe decir «Página &[Página] de &[Páginas]».'; } },
      ],
    },
    donde: [
      { comando: 'Orientación', ruta: ['Disposición de página', 'Orientación'] },
      { comando: 'Establecer área de impresión', ruta: ['Disposición de página', 'Área de impresión', 'Establecer área de impresión'] },
      { comando: 'Imprimir títulos', ruta: ['Disposición de página', 'Imprimir títulos'] },
      { comando: 'Exportar a PDF', ruta: ['Archivo', 'Exportar', 'Crear documento PDF/XPS'], nota: 'En Mac: Archivo › Guardar como › Formato PDF. En la web: Archivo › Imprimir › Imprimir.' },
    ],
    atajos: ['<kbd>Ctrl+P</kbd> abre la vista previa de impresión.', 'Vista › Ver salt. Pág. muestra dónde corta cada página; puedes arrastrar los saltos.'],
  });
})();
