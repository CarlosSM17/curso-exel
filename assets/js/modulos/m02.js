/* Módulo 2 · Editar un libro de trabajo */
(function () {
  const { D, ENC } = LT.caso;
  const sucio = [
    ['Código', 'Producto', 'Categoría', 'Precio'],
    ['CAF-001', 'Espresso', 'Cafe caliente', 35],
    ['', 'Americano', 'Cafe caliente', 40],
    ['', 'Capuchno', 'Cafe caliente', 52],
    ['', 'Latte', 'Cafe caliente', 5.5],
    ['', 'Café de olla', 'Cafe caliente', 38],
    ['FRI-001', 'Frappé moka', 'Cafe frío', 68],
    ['', 'Cold brew', 'Cafe frío', 58],
    ['', 'Latte helado', 'Cafe frío', 58],
    ['PAN-001', 'Croissant', 'Panadería', 38],
    ['', 'Concha', 'Panadería', 22],
  ];
  const codigos = ['CAF-001', 'CAF-002', 'CAF-003', 'CAF-004', 'CAF-005', 'CAF-006', 'FRI-001', 'FRI-002', 'FRI-003', 'PAN-001', 'PAN-002'];
  const nombres = ['Espresso', 'Americano', 'Capuchino', 'Latte', 'Moka', 'Café de olla', 'Frappé moka', 'Cold brew', 'Latte helado', 'Croissant', 'Concha'];
  const cats = ['Café caliente', 'Café caliente', 'Café caliente', 'Café caliente', 'Café caliente', 'Café caliente', 'Café frío', 'Café frío', 'Café frío', 'Panadería', 'Panadería'];
  const precios = [35, 40, 52, 55, 60, 38, 68, 58, 58, 38, 22];
  const hojaPrecios = () => ({ hojas: [{ nombre: 'Precios', datos: sucio, formatos: { 'D2:D14': '$#,##0.00' }, estilos: { 'A1:D1': ENC }, anchos: { A: 90, B: 150, C: 130, D: 90 }, filas: 18 }], herramientas: ['portapapeles', 'edicion', 'celdas'] });
  const pruebas = (preciosEsp) => [
    { tipo: 'valores', rango: 'B2:B12', esperado: nombres, titulo: 'Productos completos y bien escritos', mensaje: '{celda} muestra {obtenido}, pero debería decir {esperado}. ¿Insertaste la fila del Moka entre el Latte y el Café de olla? ¿Corregiste «Capuchno»?', detener: true },
    { tipo: 'valores', rango: 'A2:A12', esperado: codigos, titulo: 'Todos los productos tienen código', mensaje: '{celda} debería tener {esperado}: arrastra el controlador de relleno desde el primer código de cada familia.' },
    { tipo: 'valores', rango: 'C2:C12', esperado: cats, titulo: 'Categorías con acento', mensaje: '{celda} dice {obtenido}: usa Buscar y reemplazar (Ctrl+L) para cambiar «Cafe» por «Café».' },
    { tipo: 'valores', rango: 'D2:D12', esperado: preciosEsp, titulo: 'Precios correctos', mensaje: '{celda} muestra {obtenido}, pero el precio es {esperado}.' },
  ];

  LT.definirModulo({
    id: 2,
    objetivo: 'Capturar, corregir, copiar y rellenar datos; buscar y reemplazar.',
    situacion: 'Bienvenido(a) al equipo. Antes de imprimir el menú nuevo necesito que <b>pases a limpio la lista de precios</b>: le faltan códigos, hay errores de captura, falta un producto y alguien escribió «Cafe» sin acento en todos lados.',
    explicacion: [
      { html: '<h3>Libro, hoja y celda</h3><p>Un <b>libro</b> es el archivo; tiene <b>hojas</b> (pestañas abajo) y cada hoja es una cuadrícula de <b>celdas</b>. Cada celda se nombra con su columna y su fila: <b>B3</b> es la columna B, fila 3. El <b>cuadro de nombres</b> (arriba a la izquierda) muestra la celda activa y la <b>barra de fórmulas</b> muestra lo que contiene.</p><ul><li><b>Capturar:</b> escribe y pulsa <kbd>Enter</kbd> (baja) o <kbd>Tab</kbd> (derecha).</li><li><b>Corregir:</b> doble clic o <kbd>F2</kbd> para editar sin borrar; <kbd>Supr</kbd> borra el contenido; <kbd>Esc</kbd> cancela.</li><li><b>Copiar y pegar:</b> <kbd>Ctrl+C</kbd> y <kbd>Ctrl+V</kbd>; <b>Pegado especial</b> (<kbd>Ctrl+Alt+V</kbd>) pega solo valores, solo formatos o hace operaciones.</li><li><b>Autorrelleno:</b> arrastra el cuadrito verde de la esquina (controlador de relleno) para copiar o continuar una serie.</li><li><b>Buscar y reemplazar:</b> <kbd>Ctrl+B</kbd> busca y <kbd>Ctrl+L</kbd> reemplaza.</li><li><b>Insertar filas o columnas:</b> clic derecho sobre el número de fila o la letra de columna.</li></ul>' },
      { titulo: 'Zona de práctica libre', instr: 'Escribe, muévete con las flechas, edita con F2, arrastra el controlador de relleno y prueba clic derecho. Aquí nada se califica.', hoja: { altura: 230, hojas: [{ nombre: 'Práctica', datos: [['Día', 'Ventas'], ['Lunes', 3200]], filas: 14, cols: 8 }], herramientas: ['portapapeles', 'edicion', 'celdas'] } },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Así continúa Excel una serie',
      intro: 'Antes de arrastrar, predice qué escribirá Excel. Después compara con lo que hace de verdad.',
      widget: 'autorrelleno', opts: { ejemplos: [['Lunes'], ['CAF-001'], ['ene'], ['5'], ['5', '10'], ['15/10/2025']] },
      pasos: ['Escribe el valor inicial (por ejemplo <b>CAF-001</b>) y selecciónalo.', 'Coloca el puntero en el cuadrito verde de la esquina inferior derecha: cambia a una cruz delgada.', 'Arrastra hacia abajo (o a la derecha) y suelta. Excel continúa la serie: CAF-002, CAF-003…', 'Si solo quieres copiar el mismo valor, usa el botón de opciones de autorrelleno que aparece al soltar (Copiar celdas).'],
      pregunta: { texto: 'Escribes <b>Lun</b> en A1 y arrastras el controlador hasta A4. ¿Qué aparece en A4?', opciones: ['Lun', 'Jue', 'Mar', 'Lun4'], correcta: 1, explicacion: 'Excel reconoce los días abreviados: Lun, Mar, Mié, <b>Jue</b>.' },
    },
    micro: [
      {
        titulo: 'Rellena los días', tipo: 'hoja',
        enunciado: 'En B1 dice «Lunes». Usa el controlador de relleno para completar los días hasta H1 (Domingo).',
        hoja: { hojas: [{ nombre: 'Semana', datos: [['Producto', 'Lunes'], ['Espresso'], ['Latte'], ['Concha']], estilos: { 'A1:H1': ENC }, objetivo: 'C1:H1', cols: 9, filas: 8 }], herramientas: ['portapapeles'] },
        pruebas: [{ tipo: 'valores', rango: 'C1:H1', esperado: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'], mensaje: '{celda} debería decir {esperado}: selecciona B1 y arrastra el cuadrito verde hacia la derecha.' }],
        pista: ['Selecciona B1; en su esquina inferior derecha está el cuadrito verde. Arrástralo hasta H1.'],
      },
      {
        titulo: 'Buscar y reemplazar', tipo: 'hoja',
        enunciado: 'En el menú escribieron «Expreso». Cámbialo por «Espresso» en <b>todas</b> las celdas con un solo comando (Ctrl+L).',
        hoja: { hojas: [{ nombre: 'Menú', datos: [['Bebida', 'Precio'], ['Expreso', 35], ['Expreso doble', 45], ['Americano', 40], ['Expreso cortado', 40], ['Capuchino', 52], ['Latte con expreso extra', 62]], formatos: { 'B2:B7': '$#,##0' }, estilos: { 'A1:B1': ENC }, anchos: { A: 190 }, filas: 10, cols: 5 }], herramientas: ['edicion'] },
        pruebas: [{ tipo: 'fn', fn: (x) => {
          const t = Object.values(x.estado.hojas[0].celdas).join(' | ');
          if (/expreso/i.test(t)) return 'Todavía hay celdas con «Expreso». Abre Buscar y reemplazar y usa «Reemplazar todos».';
          return (t.match(/Espresso/g) || []).length >= 4 ? true : 'Revisa que las cuatro bebidas digan «Espresso».';
        } }],
        pista: ['Pulsa Ctrl+L (o el botón de reemplazar de la barra). En «Buscar» escribe Expreso y en «Reemplazar con» Espresso.'],
      },
      {
        titulo: 'Pegar solo valores', tipo: 'hoja',
        enunciado: 'La columna C calcula el precio con IVA con fórmulas. Copia C2:C6 y pégalos en D2:D6 <b>como valores</b> (Pegado especial › Valores), para que no dependan de las fórmulas.',
        hoja: { hojas: [{ nombre: 'IVA', datos: [['Producto', 'Precio', 'Con IVA', 'Con IVA (valores)'], ...D.productos.slice(0, 5).map((p, i) => [p.nombre, p.precio, '=B' + (i + 2) + '*1.16'])], formatos: { 'B2:D6': '$#,##0.00' }, estilos: { 'A1:D1': ENC }, anchos: { A: 130, D: 130 }, objetivo: 'D2:D6', filas: 9, cols: 6 }], herramientas: ['portapapeles'] },
        pruebas: [
          { tipo: 'valores', rango: 'D2:D6', esperado: D.productos.slice(0, 5).map((p) => Math.round(p.precio * 1.16 * 100) / 100), mensaje: '{celda} muestra {obtenido}; debería tener el precio con IVA {esperado}.' },
          { tipo: 'fn', fn: (x) => { const c = x.celdas('D2:D6').find((y) => String(x.entrada(y.dir)).startsWith('=')); return c ? c.dir + ' tiene una fórmula: usa Pegado especial › Valores.' : true; } },
        ],
        pista: ['Selecciona C2:C6 y copia (Ctrl+C). Selecciona D2 y abre Pegado especial con Ctrl+Alt+V (o el botón «Especial»). Elige «Valores».'],
      },
    ],
    reto: {
      titulo: 'Pasar a limpio la lista de precios', tipo: 'hoja',
      intro: 'La hoja <i>Precios</i> tiene la lista que pasó Marta. Déjala lista para imprimir el menú.',
      base: {
        hoja: hojaPrecios(),
        pruebas: pruebas(precios),
        instrucciones: [
          'Faltan los códigos de casi todos los productos: cada familia (CAF, FRI, PAN) tiene solo el primero.',
          'Falta el <b>Moka</b> (Café caliente, $60) entre el Latte y el Café de olla: debe quedar como CAF-005.',
          '«Capuchno» está mal escrito.',
          'El Latte cuesta $55, no $5.5.',
          'En las categorías, «Cafe» va con acento: «Café».',
        ],
        pistas: ['Hay cinco herramientas en juego: insertar fila, autorrelleno, editar celda, buscar y reemplazar… y atención al orden: inserta la fila del Moka antes de rellenar los códigos.', 'Clic derecho en el número de fila 6 › «Insertar fila arriba». Para los códigos, selecciona el primer código de cada familia y arrastra el cuadrito verde. Ctrl+L abre Buscar y reemplazar.', 'Pasos exactos: inserta la fila 6 y escribe Moka, Cafe caliente, 60; arrastra A2 hasta A7, A8 hasta A10 y A11 hasta A12; corrige B4 y D5; reemplaza «Cafe» por «Café».'],
      },
      niveles: {
        explorador: {
          instrucciones: [
            'Clic derecho en el <b>número de fila 6</b> › «Insertar fila arriba». En la fila nueva escribe <b>Moka</b> (B6), <b>Cafe caliente</b> (C6) y <b>60</b> (D6).',
            'Selecciona <b>A2</b> y arrastra el cuadrito verde hasta <b>A7</b>: aparecen CAF-002 a CAF-006. Haz lo mismo desde <b>A8</b> hasta A10 y desde <b>A11</b> hasta A12.',
            'Haz doble clic en <b>B4</b> y corrige «Capuchino».',
            'En <b>D5</b> escribe 55.',
            'Pulsa <kbd>Ctrl+L</kbd>: busca <b>Cafe</b>, reemplaza con <b>Café</b> y elige «Reemplazar todos».',
          ],
        },
        experto: {
          instrucciones: ['La lista tiene <b>cinco problemas</b> (códigos, un nombre, un precio, acentos y un producto faltante: el Moka, CAF-005, Café caliente, $60). Encuéntralos y corrígelos.', 'Además, sube <b>10 %</b> los precios de Panadería sin escribirlos a mano y sin fórmulas: escribe 1.1 en una celda auxiliar, cópiala y usa <b>Pegado especial › Multiplicar</b> sobre los precios; después borra la celda auxiliar.'],
          pruebas: pruebas(precios.slice(0, 9).concat([41.8, 24.2])).concat([
            { tipo: 'fn', titulo: 'Los precios de Panadería son valores, no fórmulas', fn: (x) => (x.celdas('D11:D12').some((c) => String(x.entrada(c.dir)).startsWith('=')) ? 'Los precios de Panadería deben quedar como valores: usa Pegado especial › Multiplicar.' : true) },
          ]),
          pistas: ['Revisa columna por columna: códigos, nombres, categorías y precios.', 'Pegado especial (Ctrl+Alt+V) tiene la sección «Operación».', 'Escribe 1.1 en F1, cópiala, selecciona D11:D12 y en Pegado especial elige Valores + Multiplicar. Luego borra F1.'],
        },
      },
    },
    lab: {
      archivo: 'lab02-lista-precios.xlsx', titulo: 'Lista de precios de té, postres y alimentos',
      contexto: 'La segunda parte de la lista de precios tiene problemas parecidos. Resuélvela en Excel.',
      pasos: {
        explorador: [
          { texto: 'Inserta una fila antes de «Galleta de avna» (clic derecho en el número de fila 5 › Insertar) y escribe: Brownie, Postre, 40.', ruta: ['Inicio', 'Insertar', 'Insertar filas de hoja'] },
          { texto: 'Rellena los códigos que faltan arrastrando el controlador de relleno desde TE-001, POS-001 y ALI-001.', ruta: ['Inicio', 'Rellenar', 'Hacia abajo'] },
          'Corrige «Galleta de avna» → «Galleta de avena» y el precio del Panini caprese: 85.',
          { texto: 'Reemplaza la categoría «Postre» por «Postres».', ruta: ['Inicio', 'Buscar y seleccionar', 'Reemplazar…'] },
          'Guarda y sube el libro.',
        ],
        analista: ['Inserta el <b>Brownie</b> (Postres, $40) entre el Pay de queso y la Galleta de avena.', 'Completa los códigos que faltan con autorrelleno.', 'Corrige el nombre mal escrito y el precio del Panini caprese ($85).', 'Cambia la categoría «Postre» por «Postres» en toda la lista.', 'Guarda y sube el libro.'],
        experto: ['Corrige los cinco problemas de la lista (incluye el Brownie, POS-002, Postres, $40, que falta antes de la Galleta).', 'Sube 10 % los precios de Alimentos con Pegado especial › Multiplicar (deben quedar como números, sin fórmulas).', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { titulo: 'Lista completa y bien escrita', fn: (L, A) => {
          A.hoja('Precios');
          const esp = [['TE-001', 'Chai latte', 'Té'], ['TE-002', 'Té verde', 'Té'], ['POS-001', 'Pay de queso', 'Postres'], ['POS-002', 'Brownie', 'Postres'], ['POS-003', 'Galleta de avena', 'Postres'], ['ALI-001', 'Sándwich de pavo', 'Alimentos'], ['ALI-002', 'Panini caprese', 'Alimentos']];
          for (let i = 0; i < esp.length; i++) for (let j = 0; j < 3; j++) {
            const d = 'ABC'[j] + (i + 2);
            const v = String(L.valor('Precios', d) == null ? '' : L.valor('Precios', d)).trim();
            if (v.toLowerCase() !== esp[i][j].toLowerCase()) return d + ' dice «' + v + '», pero debería decir «' + esp[i][j] + '».';
          }
          return true;
        } },
        { titulo: 'Precios correctos', fn: (L, A, nivel) => {
          const esp = [54, 38, 55, 40, 25, 78, 85].map((p, i) => (nivel === 'experto' && i >= 5 ? Math.round(p * 1.1 * 100) / 100 : p));
          for (let i = 0; i < esp.length; i++) {
            const v = L.valor('Precios', 'D' + (i + 2));
            if (typeof v !== 'number') return 'D' + (i + 2) + ' no es un número (¿quedó como texto?).';
            if (!A.cerca(v, esp[i])) return 'D' + (i + 2) + ' muestra ' + A.fmtEs(v) + '; el precio es ' + A.fmtEs(esp[i]) + '.';
          }
          return true;
        } },
        { titulo: 'Los precios de Alimentos son valores (Pegado especial)', nivel: 'experto', fn: (L) => (L.tieneFormula('Precios', 'D7') || L.tieneFormula('Precios', 'D8') ? 'D7 y D8 deben ser valores: usa Pegado especial › Multiplicar en lugar de fórmulas.' : true) },
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
