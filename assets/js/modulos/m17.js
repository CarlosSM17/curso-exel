/* Módulo 17 · Fórmulas avanzadas */
(function () {
  const { D, ENC, fecha } = LT.caso;
  const prods = D.productos;
  const hojaProductos = { nombre: 'Productos', datos: [['Código', 'Producto', 'Categoría', 'Precio', 'Costo'], ...prods.map((p) => [p.codigo, p.nombre, p.categoria, p.precio, p.costo])], formatos: { 'D2:E21': '$#,##0' }, estilos: { 'A1:E1': ENC }, anchos: { B: 160, C: 120 } };
  const hojaBuscador = (conLista) => ({
    nombre: 'Buscador',
    celdas: Object.assign({ B1: 'Buscador de productos', B2: 'Código:', C2: 'CAF-004', B4: 'Producto', B5: 'Categoría', B6: 'Precio', B7: 'Rango de precio' }, conLista ? { B9: 'Misma categoría' } : {}),
    estilos: { B1: { b: true, fs: 15 }, C2: { bg: '#fff8d6', b: true }, 'B4:B9': { b: true } }, formatos: { C6: '$#,##0' }, anchos: { A: 30, B: 150, C: 170 }, objetivo: conLista ? 'C4:C7,C9' : 'C4:C7', filas: 18, cols: 6,
  });
  const libro = (conLista) => ({ hojas: [hojaBuscador(conLista), hojaProductos], pestanas: true, herramientas: ['formulas', 'portapapeles'], altura: 380 });
  const busca = (col) => '=BUSCARX(C2,Productos!A2:A21,Productos!' + col + '2:' + col + '21,"No existe")';
  const solucion = { C4: busca('B'), C5: busca('C'), C6: busca('D'), C7: '=SI.CONJUNTO(C6>=60,"Premium",C6>=40,"Clásico",VERDADERO,"Básico")' };
  const pruebasBase = [
    { tipo: 'formula', rango: 'Buscador!C4:C7', titulo: 'El buscador usa fórmulas', mensaje: '{celda} tiene un valor escrito: debe buscarlo con una fórmula.', mensajeVacia: '{celda} está vacía.' },
    { tipo: 'usa', rango: 'Buscador!C4:C6', funciones: ['BUSCARX', 'INDICE', 'BUSCARV'], alguna: true, titulo: 'Búsqueda con BUSCARX (o INDICE+COINCIDIR)', mensaje: '{celda} debe buscar en la hoja Productos con BUSCARX.' },
    { tipo: 'valores', rango: 'Buscador!C4:C6', titulo: 'Datos del producto correctos', mensaje: '{celda} muestra {obtenido}, pero para CAF-004 debería ser {esperado}.' },
    { tipo: 'usa', rango: 'Buscador!C7', funciones: ['SI.CONJUNTO'], titulo: 'Rango de precio con SI.CONJUNTO', mensaje: 'Clasifica el precio con SI.CONJUNTO en C7.' },
    { tipo: 'valores', rango: 'Buscador!C7', titulo: 'Rango de precio correcto', mensaje: 'C7 muestra {obtenido}; con ese precio debería ser {esperado} (Premium desde 60, Clásico desde 40, Básico el resto).' },
    { tipo: 'robustez', cambios: [{ 'Buscador!C2': 'PAN-002' }, { 'Buscador!C2': 'FRI-001' }, { 'Buscador!C2': 'ALI-002' }], rango: 'Buscador!C4:C7', titulo: 'Funciona con cualquier código', mensaje: 'Al escribir otro código en C2, {celda} no se actualiza bien: muestra {obtenido} y debería mostrar {esperado}.' },
    { tipo: 'robustez', cambios: { 'Buscador!C2': 'ZZZ-999' }, rango: 'Buscador!C4', titulo: 'Avisa cuando el código no existe', mensaje: 'Con un código que no existe, C4 muestra {obtenido}: usa el cuarto argumento de BUSCARX para mostrar «No existe».' },
  ];

  LT.definirModulo({
    id: 17,
    objetivo: 'Usar BUSCARX, INDICE con COINCIDIR, SI.CONJUNTO, SUMAR.SI.CONJUNTO y matrices dinámicas (FILTRAR, ORDENAR, UNICOS).',
    situacion: 'En caja preguntan precios todo el tiempo. Quiero un <b>buscador</b>: escribo el código y aparecen el nombre, la categoría, el precio y su rango de precio.',
    explicacion: [
      { html: '<h3>Buscar un dato en otra tabla</h3><p><code>=BUSCARX(valor_buscado, matriz_buscada, matriz_devuelta, [si_no_se_encuentra])</code> busca el valor en una columna y devuelve lo que está en la misma posición de otra. La alternativa clásica es <code>=INDICE(columna_devuelta, COINCIDIR(valor, columna_buscada, 0))</code>: COINCIDIR da la posición e INDICE toma el valor de esa posición.</p>' },
      { widget: 'buscarX', titulo: 'Cómo busca BUSCARX', instr: 'Escribe un código, elige qué columna devolver y mira cómo recorre la lista.', opts: { columnas: ['Código', 'Producto', 'Categoría', 'Precio'], letras: ['A', 'B', 'C', 'D'], filas: prods.slice(0, 10).map((p) => [p.codigo, p.nombre, p.categoria, p.precio]), inicial: 'CAF-004' } },
      { html: '<h3>Varias condiciones</h3><ul><li><code>=SI.CONJUNTO(prueba1, valor1, prueba2, valor2, …)</code>: la primera prueba verdadera decide; termina con <code>VERDADERO, "otro"</code> para el resto.</li><li><code>=SUMAR.SI.CONJUNTO(rango_suma, rango1, criterio1, rango2, criterio2…)</code> suma con varias condiciones (también CONTAR.SI.CONJUNTO, MAX.SI.CONJUNTO…).</li></ul><h3>Matrices dinámicas</h3><p><code>FILTRAR</code>, <code>ORDENAR</code> y <code>UNICOS</code> devuelven <b>varias celdas</b>: el resultado se «desborda» hacia abajo. Si esas celdas tienen datos, aparece <b>#¡DESBORDAMIENTO!</b>.</p>' },
    ],
    ejemplo: {
      titulo: 'Precio con INDICE y COINCIDIR', hoja: { hojas: [Object.assign({}, hojaProductos, { celdas: { G1: 'Precio de CAF-004' }, anchos: { B: 150, C: 110, G: 140 } })], altura: 230 },
      celda: 'G2', formula: '=INDICE(D2:D21, COINCIDIR("CAF-004", A2:A21, 0))', respuesta: 55, formato: '$#,##0',
      explicacion: ['<code>COINCIDIR("CAF-004", A2:A21, 0)</code> busca el código en A2:A21 y devuelve su <b>posición</b>: es el 4.º de la lista.', '<code>INDICE(D2:D21, 4)</code> toma el 4.º valor de la columna de precios: <b>$55</b> (Latte).', 'El 0 de COINCIDIR pide coincidencia exacta.'],
    },
    micro: [
      { titulo: 'Lista sin repetidos', tipo: 'hoja', enunciado: 'En G2 escribe una fórmula con <b>UNICOS</b> que liste las categorías sin repetir (se desbordará hacia abajo).',
        hoja: { hojas: [Object.assign({}, hojaProductos, { celdas: { G1: 'Categorías' }, estilos: { 'A1:E1': ENC, G1: ENC }, objetivo: 'G2' })], herramientas: ['formulas'], altura: 260 },
        solucion: { G2: '=UNICOS(C2:C21)' },
        pruebas: [{ tipo: 'usa', rango: 'G2', funciones: ['UNICOS'] }, { tipo: 'valores', rango: 'G2:G8', mensaje: '{celda} muestra {obtenido}, pero debería ser {esperado}.' }],
        pista: ['<code>=UNICOS(C2:C21)</code>; el resultado ocupa varias celdas por sí solo.'] },
      { titulo: 'Sumar con dos condiciones', tipo: 'hoja', enunciado: 'En H2 calcula el total vendido de <b>Café frío</b> en la sucursal <b>Norte</b> (primeras 60 ventas).',
        hoja: { hojas: [{ nombre: 'Ventas', datos: [['Fecha', 'Sucursal', 'Producto', 'Categoría', 'Total'], ...D.ventas.slice(300, 360).map((v) => [fecha(v.fecha), v.sucursal, v.producto, v.categoria, v.total])], celdas: { G2: 'Café frío en Norte' }, formatos: { 'E2:E61': '$#,##0', H2: '$#,##0' }, estilos: { 'A1:E1': ENC, G2: { b: true } }, anchos: { C: 140, D: 110, G: 150 }, objetivo: 'H2' }], herramientas: ['formulas'], altura: 260 },
        solucion: { H2: '=SUMAR.SI.CONJUNTO(E2:E61,B2:B61,"Norte",D2:D61,"Café frío")' },
        pruebas: [{ tipo: 'usa', rango: 'H2', funciones: ['SUMAR.SI.CONJUNTO'] }, { tipo: 'valores', rango: 'H2', mensaje: 'H2 muestra {obtenido}; el total es {esperado}. El primer argumento es el rango que se suma.' }],
        pista: ['<code>=SUMAR.SI.CONJUNTO(E2:E61, B2:B61, "Norte", D2:D61, "Café frío")</code>'] },
      { titulo: '#¡DESBORDAMIENTO!', tipo: 'opcion', enunciado: 'Escribes <code>=ORDENAR(A2:D21, 4, -1)</code> en F2 y aparece <b>#¡DESBORDAMIENTO!</b>. ¿Qué pasa?', opciones: ['Hay datos en las celdas donde el resultado necesita desbordarse', 'ORDENAR no acepta el -1', 'Falta un paréntesis', 'El rango es demasiado grande'], correcta: 0, explicacion: 'El resultado necesita 20 filas × 4 columnas libres desde F2. Borra lo que estorba y el resultado aparece.' },
    ],
    reto: {
      titulo: 'Buscador de productos por código', tipo: 'hoja', intro: 'En la hoja <i>Buscador</i>, C2 tiene el código a buscar. El catálogo está en la hoja <i>Productos</i>.',
      base: {
        hoja: libro(false), solucion, pruebas: pruebasBase,
        instrucciones: ['En <b>C4, C5 y C6</b> trae el nombre, la categoría y el precio del producto de C2 (busca en la hoja Productos). Si el código no existe, C4 debe decir «No existe».', 'En <b>C7</b> clasifica el precio con SI.CONJUNTO: <b>Premium</b> desde $60, <b>Clásico</b> desde $40 y <b>Básico</b> el resto.'],
        pistas: ['Necesitas una función de búsqueda que vaya a otra hoja, y otra que elija entre varias opciones según el precio.', '<code>=BUSCARX(C2, Productos!A2:A21, Productos!B2:B21, "No existe")</code> devuelve el nombre; cambia la columna devuelta para las demás.', 'C7: <code>=SI.CONJUNTO(C6&gt;=60,"Premium",C6&gt;=40,"Clásico",VERDADERO,"Básico")</code>'],
      },
      niveles: {
        explorador: { plantilla: { celda: 'C4', texto: '=BUSCARX(C2, ___, ___, "No existe")' }, instrucciones: ['Completa la fórmula de C4: el código se busca en <code>Productos!A2:A21</code> y el nombre está en <code>Productos!B2:B21</code>.', 'Copia la idea para C5 (categoría, columna C) y C6 (precio, columna D).', 'En C7: <code>=SI.CONJUNTO(C6&gt;=60,"Premium",C6&gt;=40,"Clásico",VERDADERO,"Básico")</code>.', 'Prueba escribir otros códigos en C2.'] },
        experto: {
          hoja: libro(true),
          solucion: Object.assign({}, solucion, { C6: '=INDICE(Productos!D2:D21,COINCIDIR(C2,Productos!A2:A21,0))', C9: '=FILTRAR(Productos!B2:B21,Productos!C2:C21=C5)' }),
          instrucciones: ['Arma el buscador del nivel Analista, pero resuelve el <b>precio (C6) con INDICE y COINCIDIR</b>.', 'En <b>C9</b>, con FILTRAR, lista los productos de la misma categoría (se desbordará hacia abajo).'],
          pruebasExtra: [
            { tipo: 'usa', rango: 'Buscador!C6', funciones: ['INDICE', 'COINCIDIR'], titulo: 'Precio con INDICE y COINCIDIR', mensaje: 'Resuelve C6 con INDICE y COINCIDIR.' },
            { tipo: 'usa', rango: 'Buscador!C9', funciones: ['FILTRAR'], titulo: 'Lista con FILTRAR', mensaje: 'Usa FILTRAR en C9.' },
            { tipo: 'valores', rango: 'Buscador!C9:C15', titulo: 'Productos de la misma categoría', mensaje: '{celda} muestra {obtenido}; debería ser {esperado}.' },
            { tipo: 'robustez', cambios: { 'Buscador!C2': 'PAN-002' }, rango: 'Buscador!C9:C15', titulo: 'La lista cambia con el código', mensaje: 'Con otro código, la lista de C9 no cambia bien: compara con la categoría de C5.' },
          ],
        },
      },
    },
    lab: {
      archivo: 'lab17-buscador.xlsx', titulo: 'Buscador y resumen en Excel',
      contexto: 'El libro tiene las hojas Productos, Ventas, Buscador y Resumen.',
      pasos: {
        explorador: [{ texto: 'Buscador!C4:C6 con BUSCARX (cuarto argumento «No existe»).', ruta: ['Fórmulas', 'Búsqueda y referencia'] }, 'Buscador!C7 con SI.CONJUNTO.', { texto: 'En Resumen!B2:G4 suma las ventas por sucursal (fila) y categoría (columna) con SUMAR.SI.CONJUNTO.', ruta: ['Fórmulas', 'Matemáticas y trigonométricas'] }, 'Guarda y sube el libro.'],
        analista: ['Completa el buscador (C4:C7) como en el simulador.', 'En Resumen!B2:G4, total de ventas por sucursal y categoría con SUMAR.SI.CONJUNTO (una fórmula que se pueda copiar a toda la tabla).', 'Guarda y sube el libro.'],
        experto: ['Lo del nivel Analista, con el precio (C6) resuelto con INDICE y COINCIDIR.', 'En Buscador!C9, la lista de productos de la misma categoría con FILTRAR.', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { titulo: 'Buscador con funciones de búsqueda', fn: (L, A) => { A.hoja('Buscador'); for (const d of ['C4', 'C5', 'C6']) if (!L.usaFuncion('Buscador', d, ['XLOOKUP', 'INDEX', 'VLOOKUP'])) return d + ' debe usar BUSCARX (o INDICE+COINCIDIR).'; return L.usaFuncion('Buscador', 'C7', 'IFS') ? true : 'C7 debe usar SI.CONJUNTO.'; } },
        { titulo: 'El buscador funciona con cualquier código', fn: (L, A) => {
          for (const cod of ['PAN-002', 'FRI-001', 'CAF-004']) {
            const v = A.conCambios({ 'Buscador!C2': cod });
            const p = prods.find((x) => x.codigo === cod);
            const rango = p.precio >= 60 ? 'Premium' : p.precio >= 40 ? 'Clásico' : 'Básico';
            const got = [v('Buscador', 'C4'), v('Buscador', 'C5'), v('Buscador', 'C6'), v('Buscador', 'C7')];
            v.restaurar();
            if (String(got[0]) !== p.nombre || String(got[1]) !== p.categoria || A.num(got[2]) !== p.precio || String(got[3]) !== rango) return 'Con el código ' + cod + ' el buscador muestra ' + got.map(String).join(' / ') + '; debería mostrar ' + [p.nombre, p.categoria, p.precio, rango].join(' / ') + '.';
          }
          const v = A.conCambios({ 'Buscador!C2': 'ZZZ-999' });
          const r = v('Buscador', 'C4');
          v.restaurar();
          return /no existe/i.test(String(r)) ? true : 'Con un código inexistente, C4 debe decir «No existe».';
        } },
        { titulo: 'Resumen por sucursal y categoría', fn: (L, A) => {
          A.hoja('Resumen');
          for (let r = 2; r <= 4; r++) for (let c = 1; c <= 6; c++) {
            const d = LT.refs.dir(r - 1, c);
            const suc = L.valor('Resumen', 'A' + r), cat = L.valor('Resumen', LT.refs.dir(0, c));
            let esp = 0;
            for (let i = 2; i <= 800; i++) { const s = L.valor('Ventas', 'C' + i); if (s == null) break; if (s === suc && L.valor('Ventas', 'F' + i) === cat) esp += A.num(L.valor('Ventas', 'I' + i)); }
            if (!L.usaFuncion('Resumen', d, ['SUMIFS'])) return d + ' debe usar SUMAR.SI.CONJUNTO.';
            if (!A.cerca(A.num(L.valor('Resumen', d)), esp)) return d + ' (' + suc + ', ' + cat + ') debería ser ' + A.fmtEs(esp) + '.';
          }
          return true;
        } },
        { titulo: 'Precio con INDICE y COINCIDIR', nivel: 'experto', fn: (L) => (L.usaFuncion('Buscador', 'C6', 'INDEX') && L.usaFuncion('Buscador', 'C6', 'MATCH') ? true : 'Resuelve C6 con INDICE y COINCIDIR.') },
        { titulo: 'Lista con FILTRAR', nivel: 'experto', fn: (L) => (L.usaFuncion('Buscador', 'C9', 'FILTER') ? true : 'Usa FILTRAR en C9.') },
      ],
    },
    donde: [
      { comando: 'Funciones de búsqueda y referencia', ruta: ['Fórmulas', 'Búsqueda y referencia'] },
      { comando: 'Funciones lógicas (SI.CONJUNTO)', ruta: ['Fórmulas', 'Lógicas'] },
      { comando: 'Insertar función', ruta: ['Fórmulas', 'Insertar función'] },
    ],
    glosario: ['BUSCARX', 'INDICE', 'COINCIDIR', 'BUSCARV', 'SI.CONJUNTO', 'SUMAR.SI.CONJUNTO', 'CONTAR.SI.CONJUNTO', 'FILTRAR', 'ORDENAR', 'UNICOS'],
    atajos: ['En Excel 2019 o anterior no existen BUSCARX ni las matrices dinámicas: usa INDICE+COINCIDIR o BUSCARV.', 'Para referirte a todo el resultado desbordado de F2 escribe F2# (por ejemplo =CONTARA(F2#)).'],
  });
})();
