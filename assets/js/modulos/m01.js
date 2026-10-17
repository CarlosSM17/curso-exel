/* Módulo 1 · Editar un libro de trabajo */
(function () {
  const { ENC } = LT.caso;
  const sucio = [
    ['Código', 'Servicio', 'Área', 'Cuota'],
    ['CON-001', 'Consulta de medicina general', 'Consulta', 120],
    ['', 'Consulta de pediatría', 'Consulta', 180],
    ['', 'Consulta de ginecologa', 'Consulta', 200],
    ['', 'Consulta de nutrición', 'Consulta', 15],
    ['', 'Consulta de odontología', 'Consulta', 160],
    ['LAB-001', 'Biometría hemática', 'Labratorio', 140],
    ['', 'Química sanguínea', 'Labratorio', 220],
    ['', 'Perfil de lípidos', 'Labratorio', 260],
    ['ENF-001', 'Aplicación de inyección', 'Enfermería', 50],
    ['', 'Curación de herida', 'Enfermería', 120],
  ];
  const codigos = ['CON-001', 'CON-002', 'CON-003', 'CON-004', 'CON-005', 'CON-006', 'LAB-001', 'LAB-002', 'LAB-003', 'ENF-001', 'ENF-002'];
  const nombres = ['Consulta de medicina general', 'Consulta de pediatría', 'Consulta de ginecología', 'Consulta de nutrición', 'Consulta de psicología', 'Consulta de odontología', 'Biometría hemática', 'Química sanguínea', 'Perfil de lípidos', 'Aplicación de inyección', 'Curación de herida'];
  const areas = ['Consulta', 'Consulta', 'Consulta', 'Consulta', 'Consulta', 'Consulta', 'Laboratorio', 'Laboratorio', 'Laboratorio', 'Enfermería', 'Enfermería'];
  const cuotas = [120, 180, 200, 150, 220, 160, 140, 220, 260, 50, 120];
  const hojaCatalogo = () => ({ hojas: [{ nombre: 'Catálogo', datos: sucio, formatos: { 'D2:D14': '$#,##0.00' }, estilos: { 'A1:D1': ENC }, anchos: { A: 90, B: 220, C: 110, D: 90 }, filas: 18 }], herramientas: ['portapapeles', 'edicion', 'celdas'] });
  const pruebas = (cuotasEsp) => [
    { tipo: 'valores', rango: 'B2:B12', esperado: nombres, titulo: 'Servicios completos y bien escritos', mensaje: '{celda} muestra {obtenido}, pero debería decir {esperado}. ¿Insertaste la Consulta de psicología entre nutrición y odontología? ¿Corregiste «ginecologa»?', detener: true },
    { tipo: 'valores', rango: 'A2:A12', esperado: codigos, titulo: 'Todos los servicios tienen código', mensaje: '{celda} debería tener {esperado}: arrastra el controlador de relleno desde el primer código de cada área.' },
    { tipo: 'valores', rango: 'C2:C12', esperado: areas, titulo: 'Áreas bien escritas', mensaje: '{celda} dice {obtenido}: usa Buscar y reemplazar (Ctrl+L) para cambiar «Labratorio» por «Laboratorio».' },
    { tipo: 'valores', rango: 'D2:D12', esperado: cuotasEsp, titulo: 'Cuotas correctas', mensaje: '{celda} muestra {obtenido}, pero la cuota es {esperado}.' },
  ];
  const meds = [['Medicamento', 'Presentación'], ['Acetaminofén', 'Tabletas 500 mg'], ['Acetaminofén', 'Solución oral pediátrica'], ['Ibuprofeno', 'Tabletas 400 mg'], ['Acetaminofén con cafeína', 'Tabletas'], ['Amoxicilina', 'Cápsulas 500 mg'], ['Acetaminofén', 'Supositorios 300 mg']];
  const conv = [['Servicio', 'Cuota', 'Convenio (-20 %)', 'Convenio (valores)'], ['Consulta de medicina general', 120, '=B2*0.8'], ['Consulta de nutrición', 150, '=B3*0.8'], ['Biometría hemática', 140, '=B4*0.8'], ['Química sanguínea', 220, '=B5*0.8'], ['Radiografía de tórax', 350, '=B6*0.8']];

  LT.definirModulo({
    id: 1,
    objetivo: 'Capturar, corregir, copiar y rellenar datos con rapidez; buscar y reemplazar; insertar filas y pegar valores.',
    situacion: 'Bienvenido(a) al área de Calidad y Estadística de la clínica. Antes de publicar las cuotas de recuperación necesito que <b>depures el catálogo de servicios</b>: le faltan códigos, hay errores de captura, falta un servicio y alguien escribió «Labratorio» en toda el área.',
    explicacion: [
      { html: '<h3>Repaso rápido: capturar y corregir sin perder tiempo</h3><p>Ya conoces la cuadrícula; aquí lo importante es <b>trabajar rápido y sin errores</b>, porque en salud un dato mal capturado (una cuota, una dosis, un expediente) se arrastra a todos los reportes.</p><ul><li><b>Editar sin borrar:</b> <kbd>F2</kbd> o doble clic; <kbd>Esc</kbd> cancela; <kbd>Supr</kbd> borra solo el contenido.</li><li><b>Autorrelleno:</b> el controlador de relleno (cuadrito de la esquina) continúa series: días, meses y códigos como <code>CON-001 → CON-002</code>. Doble clic en él rellena hasta el final de los datos vecinos.</li><li><b>Insertar o eliminar filas</b> (clic derecho en el número de fila) desplaza los datos; borrar contenido no.</li><li><b>Buscar y reemplazar</b> (<kbd>Ctrl+B</kbd> / <kbd>Ctrl+L</kbd>): con «Coincidir con el contenido de toda la celda» evitas cambiar palabras que solo contienen el texto buscado.</li><li><b>Pegado especial</b> (<kbd>Ctrl+Alt+V</kbd>): pega solo valores, solo formatos o hace operaciones (multiplicar un rango por 1.1 sube 10 %).</li></ul>' },
      { titulo: 'Zona de práctica libre', instr: 'Escribe, edita con F2, arrastra el controlador de relleno y prueba clic derecho. Aquí nada se califica.', hoja: { altura: 230, hojas: [{ nombre: 'Práctica', datos: [['Día', 'Atenciones'], ['Lunes', 42], ['', ''], ['EXP-1001']], filas: 14, cols: 8 }], herramientas: ['portapapeles', 'edicion', 'celdas'] } },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Así continúa Excel una serie',
      intro: 'Antes de arrastrar, predice qué escribirá Excel. Después compara con lo que hace de verdad.',
      widget: 'autorrelleno', opts: { ejemplos: [['Lunes'], ['EXP-1001'], ['ene'], ['Lun'], ['5', '10'], ['15/10/2025']] },
      pasos: ['Escribe el valor inicial (por ejemplo <b>EXP-1001</b>) y selecciónalo.', 'Coloca el puntero en el cuadrito de la esquina inferior derecha: cambia a una cruz delgada.', 'Arrastra hacia abajo y suelta: Excel continúa la serie (EXP-1002, EXP-1003…).', 'Si solo quieres copiar el mismo valor, usa las opciones de autorrelleno que aparecen al soltar (Copiar celdas).'],
      pregunta: { texto: 'Escribes <b>CON-004</b> en A1 y arrastras el controlador hasta A3. ¿Qué aparece en A3?', opciones: ['CON-004', 'CON-006', 'CON-005', 'CON-0041'], correcta: 1, explicacion: 'Excel incrementa el número final del texto: CON-005 en A2 y <b>CON-006</b> en A3.' },
    },
    micro: [
      {
        titulo: 'Rellena los días', tipo: 'hoja',
        enunciado: 'En B1 dice «Lunes». Usa el controlador de relleno para completar los días hasta H1 (Domingo).',
        hoja: { hojas: [{ nombre: 'Agenda', datos: [['Servicio', 'Lunes'], ['Medicina general'], ['Laboratorio'], ['Vacunación']], estilos: { 'A1:H1': ENC }, objetivo: 'C1:H1', cols: 9, filas: 8, anchos: { A: 140 } }], herramientas: ['portapapeles'] },
        pruebas: [{ tipo: 'valores', rango: 'C1:H1', esperado: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'], mensaje: '{celda} debería decir {esperado}: selecciona B1 y arrastra el cuadrito hacia la derecha.' }],
        pista: ['Selecciona B1; en su esquina inferior derecha está el cuadrito. Arrástralo hasta H1.'],
      },
      {
        titulo: 'Buscar y reemplazar', tipo: 'hoja',
        enunciado: 'La clínica decidió usar el nombre <b>Paracetamol</b> en todos sus documentos. Cambia «Acetaminofén» por «Paracetamol» en <b>todas</b> las celdas con un solo comando (Ctrl+L).',
        hoja: { hojas: [{ nombre: 'Medicamentos', datos: meds, estilos: { 'A1:B1': ENC }, anchos: { A: 210, B: 190 }, filas: 10, cols: 4 }], herramientas: ['edicion'] },
        pruebas: [{ tipo: 'fn', fn: (x) => {
          const t = Object.values(x.estado.hojas[0].celdas).join(' | ');
          if (/acetaminof/i.test(t)) return 'Todavía hay celdas con «Acetaminofén». Abre Buscar y reemplazar y usa «Reemplazar todos».';
          return (t.match(/Paracetamol/g) || []).length >= 4 ? true : 'Revisa que los cuatro registros digan «Paracetamol».';
        } }],
        pista: ['Pulsa Ctrl+L (o el botón de reemplazar). En «Buscar» escribe Acetaminofén y en «Reemplazar con» Paracetamol.'],
      },
      {
        titulo: 'Pegar solo valores', tipo: 'hoja',
        enunciado: 'La columna C calcula la cuota con el descuento del convenio universitario (20 %) usando fórmulas. Copia C2:C6 y pégalos en D2:D6 <b>como valores</b> (Pegado especial › Valores), para que no dependan de las fórmulas.',
        hoja: { hojas: [{ nombre: 'Convenio', datos: conv, formatos: { 'B2:D6': '$#,##0.00' }, estilos: { 'A1:D1': ENC }, anchos: { A: 200, C: 120, D: 140 }, objetivo: 'D2:D6', filas: 9, cols: 6 }], herramientas: ['portapapeles'] },
        pruebas: [
          { tipo: 'valores', rango: 'D2:D6', esperado: [96, 120, 112, 176, 280], mensaje: '{celda} muestra {obtenido}; debería tener la cuota con descuento {esperado}.' },
          { tipo: 'fn', fn: (x) => { const c = x.celdas('D2:D6').find((y) => String(x.entrada(y.dir)).startsWith('=')); return c ? c.dir + ' tiene una fórmula: usa Pegado especial › Valores.' : true; } },
        ],
        pista: ['Selecciona C2:C6 y copia (Ctrl+C). Selecciona D2 y abre Pegado especial con Ctrl+Alt+V (o el botón «Especial»). Elige «Valores».'],
      },
    ],
    reto: {
      titulo: 'Depurar el catálogo de servicios', tipo: 'hoja',
      intro: 'La hoja <i>Catálogo</i> tiene la lista que entregó Recursos Financieros. Déjala lista para publicarla.',
      base: {
        hoja: hojaCatalogo(),
        pruebas: pruebas(cuotas),
        instrucciones: [
          'Faltan los códigos de casi todos los servicios: cada área (CON, LAB, ENF) tiene solo el primero.',
          'Falta la <b>Consulta de psicología</b> (Consulta, $220) entre nutrición y odontología: debe quedar como CON-005.',
          '«Consulta de ginecologa» está mal escrito.',
          'La Consulta de nutrición cuesta $150, no $15.',
          'En el área, «Labratorio» debe decir «Laboratorio».',
        ],
        pistas: ['Hay cinco herramientas en juego: insertar fila, autorrelleno, editar celda, buscar y reemplazar… y atención al orden: inserta la fila de psicología antes de rellenar los códigos.', 'Clic derecho en el número de fila 6 › «Insertar fila arriba». Para los códigos, selecciona el primer código de cada área y arrastra el controlador. Ctrl+L abre Buscar y reemplazar.', 'Pasos exactos: inserta la fila 6 y escribe Consulta de psicología, Consulta, 220; arrastra A2 hasta A7, A8 hasta A10 y A11 hasta A12; corrige B4 y D5; reemplaza «Labratorio» por «Laboratorio».'],
      },
      niveles: {
        explorador: {
          instrucciones: [
            'Clic derecho en el <b>número de fila 6</b> › «Insertar fila arriba». En la fila nueva escribe <b>Consulta de psicología</b> (B6), <b>Consulta</b> (C6) y <b>220</b> (D6).',
            'Selecciona <b>A2</b> y arrastra el controlador hasta <b>A7</b>: aparecen CON-002 a CON-006. Haz lo mismo desde <b>A8</b> hasta A10 y desde <b>A11</b> hasta A12.',
            'Haz doble clic en <b>B4</b> y corrige «Consulta de ginecología».',
            'En <b>D5</b> escribe 150.',
            'Pulsa <kbd>Ctrl+L</kbd>: busca <b>Labratorio</b>, reemplaza con <b>Laboratorio</b> y elige «Reemplazar todos».',
          ],
        },
        experto: {
          instrucciones: ['El catálogo tiene <b>cinco problemas</b> (códigos, un nombre, una cuota, un área mal escrita y un servicio faltante: Consulta de psicología, CON-005, Consulta, $220). Encuéntralos y corrígelos.', 'Además, sube <b>10 %</b> las cuotas de Enfermería sin escribirlas a mano y sin fórmulas: escribe 1.1 en una celda auxiliar, cópiala y usa <b>Pegado especial › Multiplicar</b> sobre esas cuotas; después borra la celda auxiliar.'],
          pruebas: pruebas(cuotas.slice(0, 9).concat([55, 132])).concat([
            { tipo: 'fn', titulo: 'Las cuotas de Enfermería son valores, no fórmulas', fn: (x) => (x.celdas('D11:D12').some((c) => String(x.entrada(c.dir)).startsWith('=')) ? 'Las cuotas de Enfermería deben quedar como valores: usa Pegado especial › Multiplicar.' : true) },
          ]),
          pistas: ['Revisa columna por columna: códigos, nombres, áreas y cuotas.', 'Pegado especial (Ctrl+Alt+V) tiene la sección «Operación».', 'Escribe 1.1 en F1, cópiala, selecciona D11:D12 y en Pegado especial elige Valores + Multiplicar. Luego borra F1.'],
        },
      },
    },
    lab: {
      archivo: 'lab01-catalogo-servicios.xlsx', titulo: 'Catálogo de imagenología, rehabilitación y vacunación',
      contexto: 'La segunda parte del catálogo tiene problemas parecidos. Resuélvela en Excel.',
      pasos: {
        explorador: [
          { texto: 'Inserta una fila antes de «Terapia de lenguage» (clic derecho en el número de fila 5 › Insertar) y escribe: Terapia respiratoria, Rehabilitacion, 260.', ruta: ['Inicio', 'Insertar', 'Insertar filas de hoja'] },
          { texto: 'Rellena los códigos que faltan arrastrando el controlador desde IMG-001, REH-001 y VAC-001.', ruta: ['Inicio', 'Rellenar', 'Hacia abajo'] },
          'Corrige «Terapia de lenguage» → «Terapia de lenguaje» y la cuota de la vacuna contra neumococo: 450.',
          { texto: 'Reemplaza el área «Rehabilitacion» por «Rehabilitación».', ruta: ['Inicio', 'Buscar y seleccionar', 'Reemplazar…'] },
          'Guarda y sube el libro.',
        ],
        analista: ['Inserta la <b>Terapia respiratoria</b> (Rehabilitación, $260) entre la Sesión de fisioterapia y la Terapia de lenguaje.', 'Completa los códigos que faltan con autorrelleno.', 'Corrige el nombre mal escrito y la cuota de la vacuna contra neumococo ($450).', 'Cambia «Rehabilitacion» por «Rehabilitación» en toda la lista.', 'Guarda y sube el libro.'],
        experto: ['Corrige los cinco problemas de la lista (incluye la Terapia respiratoria, REH-002, Rehabilitación, $260, que falta antes de la Terapia de lenguaje).', 'Sube 10 % las cuotas de Vacunación con Pegado especial › Multiplicar (deben quedar como números, sin fórmulas).', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { titulo: 'Lista completa y bien escrita', fn: (L, A) => {
          A.hoja('Catálogo');
          const esp = [['IMG-001', 'Radiografía de tórax', 'Imagenología'], ['IMG-002', 'Ultrasonido abdominal', 'Imagenología'], ['REH-001', 'Sesión de fisioterapia', 'Rehabilitación'], ['REH-002', 'Terapia respiratoria', 'Rehabilitación'], ['REH-003', 'Terapia de lenguaje', 'Rehabilitación'], ['VAC-001', 'Vacuna contra influenza', 'Vacunación'], ['VAC-002', 'Vacuna contra neumococo', 'Vacunación']];
          for (let i = 0; i < esp.length; i++) for (let j = 0; j < 3; j++) {
            const d = 'ABC'[j] + (i + 2);
            const v = String(L.valor('Catálogo', d) == null ? '' : L.valor('Catálogo', d)).trim();
            if (v.toLowerCase() !== esp[i][j].toLowerCase()) return d + ' dice «' + v + '», pero debería decir «' + esp[i][j] + '».';
          }
          return true;
        } },
        { titulo: 'Cuotas correctas', fn: (L, A, nivel) => {
          const esp = [350, 600, 300, 260, 280, 180, 450].map((p, i) => (nivel === 'experto' && i >= 5 ? Math.round(p * 1.1 * 100) / 100 : p));
          for (let i = 0; i < esp.length; i++) {
            const v = L.valor('Catálogo', 'D' + (i + 2));
            if (typeof v !== 'number') return 'D' + (i + 2) + ' no es un número (¿quedó como texto?).';
            if (!A.cerca(v, esp[i])) return 'D' + (i + 2) + ' muestra ' + A.fmtEs(v) + '; la cuota es ' + A.fmtEs(esp[i]) + '.';
          }
          return true;
        } },
        { titulo: 'Las cuotas de Vacunación son valores (Pegado especial)', nivel: 'experto', fn: (L) => (L.tieneFormula('Catálogo', 'D7') || L.tieneFormula('Catálogo', 'D8') ? 'D7 y D8 deben ser valores: usa Pegado especial › Multiplicar en lugar de fórmulas.' : true) },
      ],
    },
    donde: [
      { comando: 'Reemplazar', ruta: ['Inicio', 'Buscar y seleccionar', 'Reemplazar…'], nota: 'Atajo: Ctrl+L. En Mac: ⌃H.' },
      { comando: 'Pegado especial', ruta: ['Inicio', 'Pegar', 'Pegado especial…'], nota: 'Atajo: Ctrl+Alt+V.' },
      { comando: 'Insertar filas', ruta: ['Inicio', 'Insertar', 'Insertar filas de hoja'], nota: 'También con clic derecho sobre el número de fila.' },
      { comando: 'Rellenar series', ruta: ['Inicio', 'Rellenar', 'Series…'] },
    ],
    atajos: ['<kbd>F2</kbd> editar la celda · <kbd>Esc</kbd> cancelar · <kbd>Supr</kbd> borrar contenido', '<kbd>Ctrl+C</kbd>, <kbd>Ctrl+X</kbd>, <kbd>Ctrl+V</kbd>, <kbd>Ctrl+Alt+V</kbd> (pegado especial)', '<kbd>Ctrl+Z</kbd> deshacer · <kbd>Ctrl+Y</kbd> rehacer', '<kbd>Ctrl+B</kbd> buscar · <kbd>Ctrl+L</kbd> reemplazar', '<kbd>Ctrl+J</kbd> rellenar hacia abajo (Excel en español)'],
  });
})();
