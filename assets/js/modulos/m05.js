/* Módulo 5 · Ver y administrar hojas de cálculo */
(function () {
  const { D, ENC, semana, fecha } = LT.caso;
  const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const hojaSede = (sede, nombre) => {
    const filas = semana(sede);
    return {
      nombre,
      datos: [
        ['Sede ' + sede + ' · Semana 42 (atenciones)'],
        ['Servicio', ...DIAS, 'Total'],
        ...filas.map((p, i) => [p.servicio, ...p.cantidades, '=SUMA(B' + (i + 3) + ':H' + (i + 3) + ')']),
        ['Total', ...'BCDEFGHI'.split('').map((c) => '=SUMA(' + c + '3:' + c + '10)')],
      ],
      estilos: { A1: { b: true, fs: 15 }, 'A2:I2': ENC, 'A11:I11': { b: true } }, anchos: { A: 200 }, cols: 10, filas: 14,
    };
  };
  const libroReto = () => ({
    hojas: [hojaSede('Centro', 'Hoja1'), hojaSede('Norte', 'Hoja2'), hojaSede('Sur', 'Hoja3'),
      { nombre: 'Hoja4', datos: [['Sede', 'Atenciones de la semana'], ['Centro'], ['Norte'], ['Sur'], ['Total']], estilos: { 'A1:B1': ENC, 'A5:B5': { b: true } }, anchos: { A: 110, B: 170 }, objetivo: 'B2:B5', filas: 10, cols: 5 }],
    editarHojas: true, pestanas: true, herramientas: ['portapapeles', 'vista'], altura: 360,
  });
  const nombreHoja = (x, n) => x.estado.hojas.find((h) => h.nombre.toLowerCase() === n.toLowerCase());
  const totalSede = (s) => semana(s).reduce((a, p) => a + p.unidades, 0);
  const pruebasBase = [
    { tipo: 'fn', titulo: 'Hojas de sede con su nombre', detener: true, fn: (x) => {
      for (const s of ['Centro', 'Norte', 'Sur']) {
        const h = nombreHoja(x, s);
        if (!h) return 'No hay ninguna hoja llamada «' + s + '». Doble clic en la pestaña para cambiar el nombre (revisa la celda A1 de cada hoja).';
        if (!String(h.celdas.A1 || '').includes(s)) return 'La hoja «' + s + '» tiene los datos de otra sede: revisa el título en A1 antes de cambiar el nombre.';
      }
      return true;
    } },
    { tipo: 'fn', titulo: 'Hoja «Resumen» al inicio', detener: true, fn: (x) => (!nombreHoja(x, 'Resumen') ? 'Cambia el nombre de Hoja4 a «Resumen».' : x.estado.hojas[0].nombre.toLowerCase() !== 'resumen' ? 'Mueve «Resumen» a la primera posición (clic derecho en la pestaña › Mover a la izquierda).' : true) },
    { tipo: 'fn', titulo: 'Pestañas de sede con color', fn: (x) => { const sin = ['Centro', 'Norte', 'Sur'].find((s) => !nombreHoja(x, s).color); return sin ? 'Ponle color a la pestaña «' + sin + '» (clic derecho › Color de pestaña).' : true; } },
    { tipo: 'formula', rango: 'Resumen!B2:B5', titulo: 'Totales con fórmulas', mensaje: '{celda} tiene un número escrito: trae el total con una referencia a la otra hoja.', mensajeVacia: '{celda} está vacía.' },
    { tipo: 'contiene', rango: 'Resumen!B2:B4', texto: '!', titulo: 'Referencias a otras hojas', mensaje: '{celda} debe apuntar a la hoja de la sede, por ejemplo =Centro!I11.' },
    { tipo: 'valores', rango: 'Resumen!B2:B5', titulo: 'Totales correctos', mensaje: '{celda} muestra {obtenido}, pero el total es {esperado}: el total de cada sede está en I11 de su hoja.' },
    { tipo: 'robustez', cambios: { 'Centro!B3': 99, 'Sur!H10': 50 }, rango: 'Resumen!B2:B5', titulo: 'El resumen se actualiza solo', mensaje: 'Si cambia una cifra en otra hoja, {celda} no se actualiza.' },
  ];

  LT.definirModulo({
    id: 5,
    objetivo: 'Crear, renombrar, mover y colorear hojas; inmovilizar paneles y usar datos de otra hoja para consolidar información de varias sedes.',
    situacion: 'Cada sede me manda sus atenciones de la semana en el mismo libro, pero las hojas se llaman Hoja1, Hoja2, Hoja3… <b>Organiza el libro</b>: una hoja por sede con su nombre y una hoja <b>Resumen</b> al inicio con el total de cada una.',
    explicacion: [
      { html: '<h3>Las hojas del libro</h3><ul><li><b>Insertar:</b> botón <b>+</b> junto a las pestañas.</li><li><b>Cambiar nombre:</b> doble clic en la pestaña (máximo 31 caracteres, sin <code>/ \\ ? * [ ] :</code>).</li><li><b>Mover:</b> arrastra la pestaña o usa clic derecho.</li><li><b>Color de pestaña, ocultar y mostrar:</b> clic derecho en la pestaña.</li></ul><h3>Inmovilizar paneles</h3><p>En un registro largo (por ejemplo, cientos de atenciones), <b>Vista › Inmovilizar</b> deja fijos los encabezados mientras te desplazas. «Inmovilizar paneles» fija lo que está arriba y a la izquierda de la celda activa.</p><h3>Datos de otra hoja</h3><p>Para usar una celda de otra hoja se escribe el nombre de la hoja, un signo de admiración y la celda: <code>=Centro!I11</code>. Si el nombre tiene espacios va entre apóstrofos: <code>=\'Semana 42\'!I11</code>. Lo más fácil: escribe <kbd>=</kbd>, haz clic en la pestaña de la otra hoja, haz clic en la celda y pulsa <kbd>Enter</kbd>.</p>' },
    ],
    ejemplo: {
      titulo: 'Traer el total de otra hoja', intro: 'La fórmula de B2 trae un dato de la hoja Centro. Puedes ver esa hoja con su pestaña, abajo. Predice el resultado.',
      hoja: { hojas: [{ nombre: 'Resumen', datos: [['Sede', 'Atenciones de la semana'], ['Centro']], estilos: { 'A1:B1': ENC }, anchos: { B: 170 }, filas: 6, cols: 4 }, hojaSede('Centro', 'Centro')], pestanas: true, altura: 230 },
      celda: 'B2', formula: '=Centro!I11',
      respuesta: totalSede('Centro'),
      explicacion: ['<code>Centro!</code> indica la hoja; <code>I11</code> la celda de esa hoja.', 'En la hoja Centro, I11 es el total de la semana: <b>' + totalSede('Centro') + '</b> atenciones.', 'Si cambia una cifra en Centro, el Resumen se actualiza solo.'],
    },
    micro: [
      {
        titulo: 'Nombre y color de la pestaña', tipo: 'hoja', enunciado: 'Cambia el nombre de «Hoja1» a <b>Centro</b> y ponle color a su pestaña.',
        hoja: { hojas: [hojaSede('Centro', 'Hoja1')], editarHojas: true, pestanas: true, altura: 220 },
        pruebas: [{ tipo: 'fn', fn: (x) => { const h = x.estado.hojas[0]; if (h.nombre !== 'Centro') return 'La hoja todavía se llama «' + h.nombre + '»: haz doble clic en la pestaña.'; return h.color ? true : 'Ahora ponle color: clic derecho en la pestaña › Color de pestaña.'; } }],
        pista: ['Doble clic en la pestaña «Hoja1» (abajo), escribe Centro y pulsa Aceptar. Luego clic derecho › Color de pestaña.'],
      },
      {
        titulo: 'Encabezados siempre visibles', tipo: 'hoja', enunciado: 'Este registro tiene 60 atenciones. Inmoviliza la fila de encabezados para que no desaparezca al bajar.',
        hoja: { hojas: [{ nombre: 'Atenciones', datos: [['Folio', 'Fecha', 'Sede', 'Servicio', 'Atenciones'], ...D.atenciones.slice(0, 60).map((v) => [v.folio, fecha(v.fecha), v.sede, v.servicio, v.atenciones])], estilos: { 'A1:E1': ENC }, anchos: { D: 200 } }], herramientas: ['vista'], altura: 240 },
        pruebas: [{ tipo: 'fn', fn: (x) => (x.estado.hojas[0].inmov.f === 1 ? true : 'Usa Inmovilizar › Inmovilizar fila superior.') }],
        pista: ['Botón «Inmovilizar» de la barra › «Inmovilizar fila superior».'],
      },
    ],
    reto: {
      titulo: 'Una hoja por sede y una de resumen', tipo: 'hoja',
      intro: 'El libro tiene cuatro hojas. Cada una de las tres primeras tiene en A1 el nombre de su sede; Hoja4 es el resumen.',
      base: {
        hoja: libroReto(), pruebas: pruebasBase,
        solucion: { 'Resumen!B2': '=Centro!I11', 'Resumen!B3': '=Norte!I11', 'Resumen!B4': '=Sur!I11', 'Resumen!B5': '=SUMA(B2:B4)' },
        instrucciones: ['Cambia el nombre de Hoja1, Hoja2 y Hoja3 por el de su sede (lee el título en A1 de cada una).', 'Cambia el nombre de Hoja4 a <b>Resumen</b> y muévela al inicio.', 'Pon color a las pestañas de las tres sedes.', 'En Resumen, B2:B4: trae el total de la semana de cada sede (está en <b>I11</b> de su hoja). En B5 súmalos.'],
        pistas: ['Las pestañas se manejan con doble clic (nombre) y clic derecho (mover, color).', 'Una referencia a otra hoja se escribe <code>=Hoja!Celda</code>; también puedes escribir = y hacer clic en la otra pestaña y en la celda.', 'B2: <code>=Centro!I11</code>, B3: <code>=Norte!I11</code>, B4: <code>=Sur!I11</code>, B5: <code>=SUMA(B2:B4)</code>.'],
      },
      niveles: {
        explorador: { instrucciones: ['Doble clic en la pestaña <b>Hoja1</b>, escribe <b>Centro</b>. Repite: Hoja2 → <b>Norte</b>, Hoja3 → <b>Sur</b>, Hoja4 → <b>Resumen</b>.', 'Clic derecho en «Resumen» › Mover a la izquierda (tres veces) hasta que quede primera.', 'Clic derecho en cada sede › Color de pestaña.', 'En Resumen, haz clic en B2, escribe <kbd>=</kbd>, haz clic en la pestaña Centro, haz clic en I11 y pulsa Enter. Repite para Norte (B3) y Sur (B4).', 'En B5 escribe <code>=SUMA(B2:B4)</code>.'] },
        experto: {
          instrucciones: ['Organiza el libro como en el nivel Analista (nombres, Resumen al inicio, colores y totales con referencias).', 'En la hoja <b>Centro</b>, inmoviliza las filas 1–2 y la columna A (celda activa B3 › Inmovilizar paneles).'],
          pruebasExtra: [{ tipo: 'fn', titulo: 'Paneles inmovilizados en Centro', fn: (x) => { const h = nombreHoja(x, 'Centro'); return h && h.inmov.f === 2 && h.inmov.c === 1 ? true : 'En Centro, selecciona B3 y usa Inmovilizar › Inmovilizar paneles.'; } }],
        },
      },
    },
    lab: {
      archivo: 'lab05-sedes.xlsx', titulo: 'Organizar el libro de la semana 43',
      contexto: 'Mismo libro, otra semana: Hoja1 a Hoja3 son las sedes (lee A1) y Hoja4 el resumen.',
      pasos: {
        explorador: [{ texto: 'Cambia el nombre de cada hoja según su sede (doble clic en la pestaña).', ruta: ['Inicio', 'Formato', 'Cambiar el nombre de la hoja'] }, 'Cambia Hoja4 a Resumen y arrástrala al inicio.', { texto: 'Pon color a las pestañas de sede.', ruta: ['Inicio', 'Formato', 'Color de pestaña'] }, 'En Resumen B2:B4 escribe =Centro!I11, =Norte!I11, =Sur!I11 y en B5 =SUMA(B2:B4).', 'Guarda y sube el libro.'],
        analista: ['Nombres de hoja por sede y «Resumen» al inicio.', 'Color en las pestañas de sede.', 'Resumen!B2:B5 con referencias a las otras hojas y su suma.', 'Guarda y sube el libro.'],
        experto: ['Lo del nivel Analista.', 'En Centro, inmoviliza las filas 1–2 y la columna A.', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { titulo: 'Hojas con nombre de sede', fn: (L) => { for (const s of ['Centro', 'Norte', 'Sur', 'Resumen']) if (!L.hoja(s)) return 'No hay una hoja llamada «' + s + '».'; for (const s of ['Centro', 'Norte', 'Sur']) if (!String(L.valor(s, 'A1') || '').includes(s)) return 'La hoja «' + s + '» tiene los datos de otra sede (revisa A1).'; return true; } },
        { titulo: '«Resumen» antes de las sedes', fn: (L) => { const i = (n) => L.hojas.findIndex((x) => x.nombre.toLowerCase() === n); return i('resumen') < Math.min(i('centro'), i('norte'), i('sur')) ? true : 'Mueve la hoja Resumen antes de las hojas de sede.'; } },
        { titulo: 'Pestañas con color', fn: (L) => { const s = ['Centro', 'Norte', 'Sur'].find((x) => !L.hoja(x) || !L.hoja(x).colorPestana); return s ? (L.hoja(s) ? 'La pestaña «' + s + '» no tiene color.' : 'No hay una hoja llamada «' + s + '».') : true; } },
        { titulo: 'Totales con referencias a otras hojas', fn: (L, A) => {
          const sedes = ['Centro', 'Norte', 'Sur'];
          let suma = 0;
          for (let i = 0; i < 3; i++) {
            const d = 'B' + (i + 2);
            const f = L.formula('Resumen', d);
            if (!f || !f.includes('!')) return d + ' debe tener una referencia a la hoja ' + sedes[i] + ' (por ejemplo =' + sedes[i] + '!I11).';
            const esp = A.num(L.valor(sedes[i], 'I11'));
            if (!A.cerca(A.num(L.valor('Resumen', d)), esp)) return d + ' debería mostrar el total de ' + sedes[i] + ': ' + esp + '.';
            suma += esp;
          }
          return L.tieneFormula('Resumen', 'B5') && A.cerca(A.num(L.valor('Resumen', 'B5')), suma) ? true : 'B5 debe sumar B2:B4 con una fórmula.';
        } },
        { titulo: 'Paneles inmovilizados en Centro', nivel: 'experto', fn: (L) => { const h = L.hoja('Centro'); if (!h) return 'No hay una hoja llamada «Centro».'; return h.inmovilizada && h.panel.y >= 2 && h.panel.x >= 1 ? true : 'En Centro, inmoviliza las filas 1–2 y la columna A (celda activa B3).'; } },
      ],
    },
    donde: [
      { comando: 'Inmovilizar paneles', ruta: ['Vista', 'Inmovilizar', 'Inmovilizar paneles'] },
      { comando: 'Inmovilizar fila superior', ruta: ['Vista', 'Inmovilizar', 'Inmovilizar fila superior'] },
      { comando: 'Cambiar el nombre de la hoja', ruta: ['Inicio', 'Formato', 'Cambiar el nombre de la hoja'], nota: 'Lo más rápido: doble clic en la pestaña.' },
      { comando: 'Color de pestaña', ruta: ['Inicio', 'Formato', 'Color de pestaña'], nota: 'También con clic derecho en la pestaña.' },
    ],
    atajos: ['<kbd>Ctrl+AvPág</kbd> / <kbd>Ctrl+RePág</kbd> para pasar a la hoja siguiente o anterior (en Excel).', 'Escribe <kbd>=</kbd> y haz clic en otra pestaña para referirte a otra hoja.'],
  });
})();
