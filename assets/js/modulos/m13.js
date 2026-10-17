/* Módulo 13 · Gestionar y automatizar información */
(function () {
  const { D, ENC, fecha, serial } = LT.caso;
  const F = LT.formato;
  const CLI = D.clientesCorp;
  const PROD = D.productos;
  const ped = D.pedidos.slice(0, 10).map((p, i) => ({ folio: 1001 + i, fecha: p.fecha, cliente: p.cliente, producto: p.producto, cantidad: p.cantidad }));
  const NUEVO = { folio: 1011, fecha: '2025-10-20', cliente: 'Agencia Pixel', producto: 'Capuchino', cantidad: 24 };
  const CONSULTA = 'Notaría 14';

  const libroReto = (experto) => ({
    hojas: [
      { nombre: 'Pedidos', datos: [['Folio', 'Fecha', 'Cliente', 'Producto', 'Cantidad', 'Precio', 'Importe'], ...ped.map((p) => [p.folio, fecha(p.fecha), p.cliente, p.producto, p.cantidad])], formatos: { 'F2:G30': '$#,##0.00', 'B2:B30': 'dd/mm/yyyy' }, estilos: { 'A1:G1': ENC }, anchos: { A: 60, B: 90, C: 170, D: 150, E: 74, F: 80, G: 90 }, objetivo: 'F2:G12,A12:E12', inmovilizar: { filas: 1 }, filasExtra: 10 },
      { nombre: 'Catálogo', datos: [['Producto', 'Precio', 'Categoría'], ...PROD.map((p) => [p.nombre, p.precio, p.categoria])], formatos: { 'B2:B21': '$#,##0' }, estilos: { 'A1:C1': ENC }, anchos: { A: 170, C: 120 } },
      { nombre: 'Clientes', datos: [['Cliente', 'Contacto', 'Correo'], ...CLI.map((c) => [c.cliente, c.contacto, c.correo])], estilos: { 'A1:C1': ENC }, anchos: { A: 180, B: 150, C: 190 } },
      { nombre: 'Consulta', celdas: Object.assign({ B1: 'Consulta de clientes', B2: 'Cliente:', C2: CONSULTA, B4: 'Número de pedidos', B5: 'Total comprado' }, experto ? { B7: 'Productos pedidos' } : {}), formatos: { C5: '$#,##0.00' }, estilos: { B1: { b: true, fs: 15 }, C2: { bg: '#fff8d6', b: true }, 'B4:B7': { b: true } }, anchos: { A: 30, B: 160, C: 180 }, objetivo: experto ? 'C4:C5,C7' : 'C4:C5', filas: 16, cols: 5 },
    ],
    pestanas: true, herramientas: ['captura', 'formulas', 'portapapeles'], altura: 400,
  });
  const solucion = {
    'Pedidos!F2:F12': '=BUSCARX(D2,Catálogo!$A$2:$A$21,Catálogo!$B$2:$B$21)', 'Pedidos!G2:G12': '=E2*F2',
    'Pedidos!A12': String(NUEVO.folio), 'Pedidos!B12': fecha(NUEVO.fecha), 'Pedidos!C12': NUEVO.cliente, 'Pedidos!D12': NUEVO.producto, 'Pedidos!E12': String(NUEVO.cantidad),
    'Consulta!C4': '=CONTAR.SI(Pedidos!C2:C50,C2)', 'Consulta!C5': '=SUMAR.SI(Pedidos!C2:C50,C2,Pedidos!G2:G50)',
  };
  const validacion = (x, hoja, celda) => { const h = x.estado.hojas.find((y) => y.nombre === hoja); return h ? h.validaciones.find((v) => LT.refs.celdasDe(v.rango).some((c) => c.dir === celda)) : null; };
  const cubreHasta = (v, fila) => String(v.rango).split(',').some((p) => { const g = LT.refs.parseRango(p); return g && g.r2 + 1 >= fila; });
  const pruebaValidaciones = { tipo: 'fn', titulo: 'Listas desplegables y validación de la cantidad', fn: (x) => {
    const vc = validacion(x, 'Pedidos', 'C2'), vd = validacion(x, 'Pedidos', 'D2'), ve = validacion(x, 'Pedidos', 'E2');
    if (!vc || vc.tipo !== 'lista') return 'Falta la lista desplegable de clientes en Pedidos!C2:C50 (Validación › Lista › Origen =Clientes!$A$2:$A$11).';
    const clientes = x.hoja.valoresLista(vc, 0);
    if (CLI.some((c) => !clientes.includes(c.cliente))) return 'La lista de clientes debe tomar los 10 clientes de la hoja Clientes (=Clientes!$A$2:$A$11).';
    if (!vd || vd.tipo !== 'lista') return 'Falta la lista desplegable de productos en Pedidos!D2:D50 (Origen =Catálogo!$A$2:$A$21).';
    const prods = x.hoja.valoresLista(vd, 0);
    if (PROD.some((p) => !prods.includes(p.nombre))) return 'La lista de productos debe tomar los 20 productos de la hoja Catálogo.';
    if (!ve || ve.tipo !== 'entero' || +ve.min !== 1 || +ve.max !== 200) return 'En Cantidad (E2:E50) permite solo números enteros entre 1 y 200.';
    return [vc, vd, ve].every((v) => cubreHasta(v, 50)) ? true : 'Las validaciones deben cubrir hasta la fila 50, para los pedidos que vienen.';
  } };
  const pruebasBase = [
    pruebaValidaciones,
    { tipo: 'valores', rango: 'Pedidos!A12:E12', esperado: [[NUEVO.folio, serial(NUEVO.fecha), NUEVO.cliente, NUEVO.producto, NUEVO.cantidad]], titulo: 'Pedido nuevo capturado en la fila 12', mensaje: '{celda} muestra {obtenido}; el pedido nuevo es 1011 · 20/10/2025 · Agencia Pixel · Capuchino · 24.' },
    { tipo: 'formula', rango: 'Pedidos!F2:G12', titulo: 'Precio e importe con fórmulas', mensaje: '{celda} tiene un valor escrito: búscalo o calcúlalo con una fórmula.', mensajeVacia: '{celda} está vacía (copia las fórmulas hasta la fila 12).' },
    { tipo: 'usa', rango: 'Pedidos!F2:F12', funciones: ['BUSCARX', 'INDICE', 'BUSCARV'], alguna: true, titulo: 'Precio buscado en el catálogo', mensaje: '{celda} debe buscar el precio en la hoja Catálogo con BUSCARX.' },
    { tipo: 'valores', rango: 'Pedidos!F2:G12', titulo: 'Precios e importes correctos', mensaje: '{celda} muestra {obtenido}, pero debería ser {esperado}.' },
    { tipo: 'usa', rango: 'Consulta!C4', funciones: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'], alguna: true, titulo: 'Número de pedidos con CONTAR.SI', mensaje: 'En Consulta!C4 cuenta los pedidos del cliente con CONTAR.SI.' },
    { tipo: 'usa', rango: 'Consulta!C5', funciones: ['SUMAR.SI', 'SUMAR.SI.CONJUNTO'], alguna: true, titulo: 'Total comprado con SUMAR.SI', mensaje: 'En Consulta!C5 suma los importes del cliente con SUMAR.SI.' },
    { tipo: 'valores', rango: 'Consulta!C4:C5', titulo: 'Consulta correcta', mensaje: '{celda} muestra {obtenido}; para ' + CONSULTA + ' debería ser {esperado}.' },
    { tipo: 'robustez', cambios: [{ 'Consulta!C2': 'Hospital San Rafael' }, { 'Consulta!C2': 'Agencia Pixel', 'Pedidos!E12': 30 }], rango: 'Consulta!C4:C5', titulo: 'La consulta funciona con cualquier cliente', mensaje: 'Al cambiar el cliente de C2, {celda} no se actualiza bien: usa C2 en la fórmula.' },
  ];
  const registrosCarta = D.pedidos.slice(0, 5).map((p, i) => {
    const c = CLI.find((x) => x.cliente === p.cliente);
    const imp = p.cantidad * p.precio;
    return { Folio: 2501 + i, Cliente: p.cliente, Contacto: c.contacto, Producto: p.producto, Cantidad: p.cantidad, Importe: imp, 'Importe_texto': F.formatear(imp, '$#,##0.00').texto, Entrega: fecha(p.compromiso) };
  });
  const HUECOS = [
    { id: 'contacto', etiqueta: 'Contacto', correcto: 'Contacto' },
    { id: 'cliente', etiqueta: 'Empresa', correcto: 'Cliente' },
    { id: 'folio', etiqueta: 'Número de pedido', correcto: 'Folio' },
    { id: 'cantidad', etiqueta: 'Cantidad', correcto: 'Cantidad' },
    { id: 'producto', etiqueta: 'Producto', correcto: 'Producto' },
    { id: 'importe', etiqueta: 'Importe', correcto: 'Importe_texto', aviso: { Importe: 'En la vista previa el importe sale como ' + registrosCarta[0].Importe + ' (sin formato de moneda). Usa el campo «Importe_texto», que ya trae el formato $#,##0.00.' } },
    { id: 'entrega', etiqueta: 'Fecha de entrega', correcto: 'Entrega' },
  ];
  const PLANTILLA = ['Cafetería La Taza · Confirmación de pedido', 'Estimado(a) {contacto}', '{cliente}', 'Le confirmamos el pedido número {folio}: {cantidad} piezas de {producto}, por un importe de {importe}. La entrega está programada para el {entrega}.', '¡Gracias por su preferencia!'];

  LT.definirModulo({
    id: 13,
    objetivo: 'Diseñar una base de datos y sus campos; capturar con formularios, validación y listas desplegables; buscar y consultar información; automatizar tareas con macros (grabadora, botones, seguridad, introducción a VBA) y generar documentos combinando correspondencia entre Excel y Word.',
    situacion: 'Los pedidos de catering se capturan cada quien a su manera y luego nadie encuentra nada. Quiero un <b>registro de pedidos</b> bien diseñado: que se capture con <b>listas</b>, que el precio se <b>busque solo</b>, una <b>consulta por cliente</b>, un <b>botón</b> que limpie la captura y las <b>cartas de confirmación</b> hechas en automático.',
    explicacion: [
      { html: '<h3>Diseñar una base de datos</h3><p>Una base de datos en Excel es una lista donde <b>cada fila es un registro</b> (un pedido) y <b>cada columna es un campo</b> (fecha, cliente, producto…). Reglas de oro:</p><ul><li>Encabezados en una sola fila, únicos y sin celdas combinadas; nada encima de la tabla.</li><li><b>Un dato por celda</b>: «2 Latte, 1 Moka» son dos registros con su cantidad y su producto.</li><li>Sin filas ni columnas vacías y sin subtotales dentro de los datos.</li><li>Cada campo con un solo tipo de dato: fechas reales, números sin unidades, textos escritos siempre igual.</li><li>Un campo clave que identifique cada registro (Folio, ID).</li><li>Lo que se repite va en su propia tabla (catálogo de productos, clientes) y se trae con búsquedas.</li></ul><h3>Identificar los campos: el diccionario de datos</h3><div class="tabla-scroll"><table class="tabla-sitio"><thead><tr><th>Campo</th><th>Tipo</th><th>¿Obligatorio?</th><th>Valores permitidos</th><th>Cómo se llena</th></tr></thead><tbody><tr><td>Folio</td><td>Número entero</td><td>Sí, único</td><td>Consecutivo</td><td>Captura</td></tr><tr><td>Fecha</td><td>Fecha</td><td>Sí</td><td>Fechas del año</td><td>Captura</td></tr><tr><td>Cliente</td><td>Texto</td><td>Sí</td><td>Lista de la hoja Clientes</td><td>Lista desplegable</td></tr><tr><td>Producto</td><td>Texto</td><td>Sí</td><td>Lista del catálogo</td><td>Lista desplegable</td></tr><tr><td>Cantidad</td><td>Número entero</td><td>Sí</td><td>1 a 200</td><td>Validación</td></tr><tr><td>Precio</td><td>Moneda</td><td>—</td><td>Del catálogo</td><td>Fórmula (BUSCARX)</td></tr><tr><td>Importe</td><td>Moneda</td><td>—</td><td>Cantidad × Precio</td><td>Fórmula</td></tr></tbody></table></div>' },
      { widget: 'disenoBD', titulo: '¿Qué está mal en esta base?', opts: { minimo: 5 } },
      { html: '<h3>Capturar sin errores</h3><ul><li><b>Validación de datos</b> (Datos › Validación de datos): limita lo que se acepta: lista, número entero entre dos valores, fecha, longitud de texto; con mensaje de entrada y de error.</li><li><b>Listas desplegables</b>: Permitir «Lista» con un origen de celdas (<code>=Clientes!$A$2:$A$11</code>) o valores separados por coma.</li><li><b>Formulario de datos</b>: el comando «Formulario…» (agrégalo a la barra de acceso rápido, como en el módulo 1) muestra un registro a la vez para capturar, buscar o revisar sin moverse por la hoja.</li><li>Alternativas: una hoja de captura con celdas desbloqueadas y validadas, o Microsoft Forms conectado a Excel.</li></ul><h3>Buscar y consultar</h3><p><code>=BUSCARX(D2, Catálogo!$A$2:$A$21, Catálogo!$B$2:$B$21)</code> trae el precio del producto. Para consultar: <code>=CONTAR.SI(Pedidos!C2:C50, C2)</code> cuenta los pedidos de un cliente y <code>=SUMAR.SI(…)</code> suma lo que compró; <code>=FILTRAR(…)</code> lista sus pedidos.</p>' },
      { widget: 'buscarX', titulo: 'Cómo busca BUSCARX', instr: 'Escribe un producto y mira cómo recorre el catálogo.', opts: { columnas: ['Producto', 'Precio', 'Categoría'], letras: ['A', 'B', 'C'], filas: PROD.slice(0, 10).map((p) => [p.nombre, p.precio, p.categoria]), inicial: 'Latte' } },
      { html: '<h3>Automatizar tareas: macros</h3><ul><li>Una <b>macro</b> es una serie de pasos guardada para repetirla con un clic. La <b>grabadora</b> (Programador › Grabar macro) traduce tus acciones a código VBA.</li><li><b>Referencias relativas</b>: la macro repite los pasos desde la celda activa; absolutas: siempre en las mismas celdas.</li><li><b>Botones</b>: inserta una forma o un botón de formulario y usa «Asignar macro…».</li><li><b>Seguridad</b>: guarda como <b>.xlsm</b>; al abrir un archivo con macros aparece «Habilitar contenido»: hazlo solo si confías en su origen. Los archivos descargados de internet llegan bloqueados (Propiedades del archivo › Desbloquear).</li></ul><h3>Introducción a VBA</h3><p>Lo que graba la grabadora es código <b>VBA</b> (Visual Basic para Aplicaciones). Se ve con <kbd>Alt+F11</kbd>. Una macro es un procedimiento <code>Sub … End Sub</code> que trabaja con <b>objetos</b> (<code>Range</code>, <code>Worksheets</code>), sus <b>propiedades</b> (<code>.Value</code>, <code>.Font.Bold</code>) y sus <b>métodos</b> (<code>.Select</code>, <code>.ClearContents</code>):</p><pre class="mono" style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:10px;overflow:auto">Sub LimpiarCaptura()\n    \' Borra los datos capturados\n    Range("C2:C5").Select\n    Selection.ClearContents\n    Range("C2").Select\nEnd Sub</pre><h3>Generar documentos: combinar correspondencia</h3><p>Con una base bien diseñada, Word genera una carta por registro: <b>Correspondencia › Iniciar combinación de correspondencia › Cartas</b>; <b>Seleccionar destinatarios › Usar una lista existente</b> (el libro y su hoja); <b>Insertar campo combinado</b> en cada lugar; <b>Vista previa de resultados</b>; <b>Finalizar y combinar › Editar documentos individuales</b> (o imprimir o enviar por correo). Consejo: Word no respeta el formato de moneda de Excel; usa una columna de texto con <code>=TEXTO(G2,"$#,##0.00")</code> o el modificador <code>\\# "$#,##0.00"</code> en el campo.</p>' },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Cartas de confirmación desde la base de pedidos',
      pasos: ['Guarda el libro con la base (encabezados en la fila 1) y ciérralo.', { texto: 'En Word: Correspondencia › Iniciar combinación de correspondencia › Cartas.' }, 'Seleccionar destinatarios › Usar una lista existente › elige el libro y la hoja «Pedidos».', 'Coloca el cursor en cada lugar de la carta e inserta el campo combinado (Cliente, Producto, Cantidad…).', 'Vista previa de resultados para revisar algunos registros; después Finalizar y combinar › Editar documentos individuales.'],
      pregunta: { texto: 'En la vista previa, el importe sale como <b>1250.5</b> en lugar de <b>$1,250.50</b>. ¿Qué haces?', opciones: ['Agrego en Excel una columna con =TEXTO(G2,"$#,##0.00") y uso ese campo (o un modificador de formato en el campo)', 'Escribo los importes a mano en cada carta', 'Cambio el formato de la celda en Excel y listo', 'Imprimo y corrijo con pluma'], correcta: 0, explicacion: 'Word lee el valor guardado, no el formato de la celda. Un campo de texto ya formateado (o el modificador <code>\\# "$#,##0.00"</code>) resuelve el problema.', retro: { 2: 'Word ignora el formato de la celda: lee el número guardado.' } },
    },
    micro: [
      { titulo: 'Detecta los problemas de diseño', tipo: 'widget', enunciado: 'Encuentra al menos 6 problemas de diseño en esta base.', crear: (c, listo) => LT.widgets.disenoBD(c, { minimo: 6, alListo: () => listo() }) },
      {
        titulo: 'Lista desplegable y formulario', tipo: 'hoja', enunciado: 'Agrega una <b>lista desplegable</b> en C2:C20 con Centro, Norte y Sur. Después usa el botón <b>Formulario</b> para capturar el registro: Folio 4 · Cliente Gimnasio Fénix · Sucursal Norte · Cantidad 30.',
        hoja: { hojas: [{ nombre: 'Registro', datos: [['Folio', 'Cliente', 'Sucursal', 'Cantidad'], [1, 'Notaría 14', 'Centro', 24], [2, 'Agencia Pixel', 'Sur', 12], [3, 'Coworking Nodo', 'Centro', 36]], estilos: { 'A1:D1': ENC }, anchos: { B: 170 }, filas: 12, cols: 6 }], herramientas: ['captura'] },
        pruebas: [
          { tipo: 'fn', fn: (x) => { const v = validacion(x, 'Registro', 'C2'); if (!v || v.tipo !== 'lista') return 'Falta la lista desplegable en C2:C20 (botón Validación › Lista).'; const l = x.hoja.valoresLista(v, 0).map((s) => s.toLowerCase()).sort().join(); return l === 'centro,norte,sur' && cubreHasta(v, 20) ? true : 'La lista debe cubrir C2:C20 y tener exactamente Centro, Norte y Sur.'; } },
          { tipo: 'valores', rango: 'A5:D5', esperado: [[4, 'Gimnasio Fénix', 'Norte', 30]], mensaje: '{celda} muestra {obtenido}; el registro nuevo es 4 · Gimnasio Fénix · Norte · 30.' },
        ],
        pista: ['Selecciona C2:C20 › Validación › Permitir: Lista › Origen: Centro,Norte,Sur. Luego clic en una celda de la tabla › Formulario › Agregar.'],
      },
      { titulo: 'Combinar correspondencia', tipo: 'widget', enunciado: 'Arma la carta de confirmación: inicia la combinación como Cartas, conecta la lista de pedidos, coloca cada campo en su lugar, revisa la vista previa y finaliza.', crear: (c, listo) => LT.widgets.combinarCorrespondencia(c, { registros: registrosCarta, huecos: HUECOS, plantilla: PLANTILLA, alListo: () => listo() }) },
      {
        titulo: 'Macro con botón', tipo: 'hoja', enunciado: 'Graba una macro llamada <b>LimpiarCaptura</b> que seleccione C2:C5 y borre su contenido (tecla Supr). Inserta un botón y asígnale la macro (clic derecho › Asignar macro…).',
        hoja: { hojas: [{ nombre: 'Captura', datos: [['Captura de pedido'], ['Cliente', '', 'Agencia Pixel'], ['Producto', '', 'Latte'], ['Cantidad', '', 20], ['Fecha', '', '21/10/2025']], inicio: 'A1', estilos: { A1: { b: true, fs: 15 }, 'C2:C5': { bg: '#fff8d6' } }, anchos: { A: 110, B: 20, C: 160 }, filas: 10, cols: 6 }], altura: 240 },
        alCrear: (hoja) => { const p = LT.u.h('div'); hoja.raiz.parentNode.insertBefore(p, hoja.raiz); LT.widgets.grabadora(hoja, p, { textoBoton: 'Limpiar captura', nombreMacro: 'LimpiarCaptura' }); },
        pruebas: [
          { tipo: 'fn', fn: (x) => { const m = Object.values(x.hoja.macros || {}); if (!m.length) return 'Graba la macro con «Grabar macro» y «Detener grabación».'; return m.some((y) => y.pasos.some((p) => p.tipo === 'borrar')) ? true : 'La macro debe borrar el contenido (selecciona C2:C5 y pulsa Supr mientras grabas).'; } },
          { tipo: 'fn', fn: (x) => (x.celdas('C2:C5').every((c) => !x.entrada(c.dir)) ? true : 'C2:C5 debe quedar vacío.') },
          { tipo: 'fn', fn: (x) => ((x.estado.hojas[0].objetos || []).some((o) => o.macro) ? true : 'Inserta un botón y asígnale la macro (clic derecho › Asignar macro…).') },
        ],
        pista: ['Grabar macro › nombre LimpiarCaptura › selecciona C2:C5 › Supr › Detener. Luego «Insertar botón», clic derecho › Asignar macro.'],
      },
    ],
    reto: {
      titulo: 'Registro de pedidos: captura y consulta', tipo: 'hoja',
      intro: 'El libro tiene cuatro hojas: <i>Pedidos</i> (la base), <i>Catálogo</i>, <i>Clientes</i> y <i>Consulta</i>. La macro y las cartas se practican en los micro-retos y en el laboratorio.',
      base: {
        hoja: libroReto(false), solucion, pruebas: pruebasBase,
        instrucciones: ['En <b>Pedidos</b>: lista desplegable de clientes en C2:C50 (origen <code>=Clientes!$A$2:$A$11</code>), de productos en D2:D50 (<code>=Catálogo!$A$2:$A$21</code>) y cantidad entera entre 1 y 200 en E2:E50.', 'Precio (F) con BUSCARX desde el catálogo e Importe (G) = cantidad × precio, hasta la fila 12.', 'Captura en la fila 12 el pedido: 1011 · 20/10/2025 · Agencia Pixel · Capuchino · 24 (puedes usar el botón Formulario).', 'En <b>Consulta</b>: C4 = número de pedidos del cliente de C2 (CONTAR.SI) y C5 = total comprado (SUMAR.SI).'],
        pistas: ['Primero valida la captura, después busca y al final consulta. Selecciona el rango antes de crear cada validación.', 'Validación › Lista › Origen <code>=Clientes!$A$2:$A$11</code>. Precio: <code>=BUSCARX(D2, Catálogo!$A$2:$A$21, Catálogo!$B$2:$B$21)</code>.', 'C4: <code>=CONTAR.SI(Pedidos!C2:C50, C2)</code> · C5: <code>=SUMAR.SI(Pedidos!C2:C50, C2, Pedidos!G2:G50)</code>.'],
      },
      niveles: {
        explorador: {
          plantilla: { celda: 'F2', texto: '=BUSCARX(D2, ___, ___)', copiar: 'F12' },
          instrucciones: ['Selecciona Pedidos!C2:C50 › <b>Validación</b> › Lista › Origen <code>=Clientes!$A$2:$A$11</code>. Repite en D2:D50 con <code>=Catálogo!$A$2:$A$21</code>. En E2:E50: Número entero, mínimo 1, máximo 200.', 'Completa la fórmula del precio: busca en <code>Catálogo!$A$2:$A$21</code> y devuelve <code>Catálogo!$B$2:$B$21</code>. Cópiala hasta F12. En G2 escribe <code>=E2*F2</code> y cópiala hasta G12.', 'Clic en una celda de la tabla › <b>Formulario</b> › escribe el pedido 1011 · 20/10/2025 · Agencia Pixel · Capuchino · 24 › Agregar.', 'En Consulta: C4 <code>=CONTAR.SI(Pedidos!C2:C50,C2)</code> y C5 <code>=SUMAR.SI(Pedidos!C2:C50,C2,Pedidos!G2:G50)</code>.'],
        },
        experto: {
          hoja: libroReto(true),
          solucion: Object.assign({}, solucion, { 'Consulta!C7': '=FILTRAR(Pedidos!D2:D50,Pedidos!C2:C50=C2)' }),
          instrucciones: ['Todo lo del nivel Analista (validaciones, precio, importe, captura y consulta).', 'En Consulta!C2 pon una lista desplegable con los clientes.', 'En Consulta!C7, con FILTRAR, lista los productos que ha pedido el cliente (se desbordará hacia abajo).'],
          pruebasExtra: [
            { tipo: 'fn', titulo: 'Lista de clientes en la consulta', fn: (x) => { const v = validacion(x, 'Consulta', 'C2'); return v && v.tipo === 'lista' && x.hoja.valoresLista(v, 3).includes('Agencia Pixel') ? true : 'Pon en Consulta!C2 una lista desplegable con los clientes.'; } },
            { tipo: 'usa', rango: 'Consulta!C7', funciones: ['FILTRAR'], titulo: 'Productos pedidos con FILTRAR', mensaje: 'Usa FILTRAR en Consulta!C7.' },
            { tipo: 'valores', rango: 'Consulta!C7:C10', titulo: 'Lista de productos del cliente', mensaje: '{celda} muestra {obtenido}; debería ser {esperado}.' },
          ],
        },
      },
    },
    lab: {
      archivo: 'lab13-gestion-pedidos.xlsx', titulo: 'Registro de pedidos y cartas de confirmación', docx: true, acepta: '.xlsx,.xlsm,.docx',
      descargas: [{ ruta: 'laboratorios/lab13-carta.docx', texto: 'Carta (Word)' }],
      contexto: 'Parte 1 en Excel (base, validación, búsqueda y consulta) y parte 2 en Word (combinar correspondencia). Sube el libro y el documento de Word juntos.',
      pasos: {
        explorador: [{ texto: 'En Pedidos: listas desplegables en Cliente (C2:C60) y Producto (D2:D60), y Cantidad entera de 1 a 200 (E2:E60).', ruta: ['Datos', 'Validación de datos'] }, 'Precio con BUSCARX desde Catálogo e Importe = Cantidad × Precio para todos los pedidos.', 'En Consulta: C4 número de pedidos y C5 total comprado del cliente de C2.', 'Guarda y cierra el libro. Abre lab13-carta.docx en Word: Correspondencia › Iniciar combinación › Cartas › Seleccionar destinatarios › Usar una lista existente (este libro, hoja Pedidos).', 'Inserta los campos Cliente, Producto, Cantidad e Importe donde dice [Campo]. Guarda la carta y sube los dos archivos.'],
        analista: ['Excel: validaciones en Pedidos (cliente, producto, cantidad 1–200), precio con BUSCARX, importe y la consulta por cliente (C4, C5).', 'Word: combina la carta con la hoja Pedidos usando al menos los campos Cliente, Producto, Cantidad e Importe. Sube el libro y la carta.'],
        experto: ['Lo del nivel Analista.', 'Graba una macro que limpie Consulta!C2, asígnala a un botón y guarda el libro como .xlsm.', 'En Word, aplica al campo Importe el formato de moneda con el modificador \\# "$#,##0.00" (Alt+F9 muestra los códigos de campo).'],
      },
      notaWeb: 'Combinar correspondencia y las macros requieren Word y Excel de escritorio.',
      pruebas: [
        { titulo: 'Validaciones de captura', fn: (L, A) => {
          const h = A.hoja('Pedidos');
          const v = (col) => h.validaciones.find((x) => A.rangoCubre(x.sqref, col + '2:' + col + '40'));
          const c = v('C'), d = v('D'), e = v('E');
          if (!c || c.tipo !== 'list' || !/clientes|despacho|notar/i.test(c.formula1)) return 'Falta la lista desplegable de clientes en C2:C60.';
          if (!d || d.tipo !== 'list' || !/cat[aá]logo|latte|espresso/i.test(d.formula1)) return 'Falta la lista desplegable de productos en D2:D60.';
          if (!e || e.tipo !== 'whole' || +e.formula1 !== 1 || +e.formula2 !== 200) return 'En E2:E60 permite solo números enteros entre 1 y 200.';
          return true;
        } },
        { titulo: 'Precio e importe con fórmulas', fn: (L, A) => {
          for (let r = 2; r <= 60; r++) {
            const prod = L.valor('Pedidos', 'D' + r);
            if (!prod) break;
            if (!L.usaFuncion('Pedidos', 'F' + r, ['XLOOKUP', 'INDEX', 'VLOOKUP'])) return 'F' + r + ' debe buscar el precio con BUSCARX.';
            const p = PROD.find((x) => x.nombre === prod);
            const cant = A.num(L.valor('Pedidos', 'E' + r));
            if (!p || !A.cerca(A.num(L.valor('Pedidos', 'F' + r)), p.precio)) return 'F' + r + ' debería mostrar el precio de ' + prod + '.';
            if (!L.tieneFormula('Pedidos', 'G' + r) || !A.cerca(A.num(L.valor('Pedidos', 'G' + r)), cant * p.precio)) return 'G' + r + ' debe calcular Cantidad × Precio.';
          }
          return true;
        } },
        { titulo: 'Consulta por cliente', fn: (L, A) => {
          A.hoja('Consulta');
          if (!L.usaFuncion('Consulta', 'C4', ['COUNTIF', 'COUNTIFS']) || !L.usaFuncion('Consulta', 'C5', ['SUMIF', 'SUMIFS'])) return 'Usa CONTAR.SI en C4 y SUMAR.SI en C5.';
          const v = A.conCambios({ 'Consulta!C2': 'Hospital San Rafael' });
          let n = 0, t = 0;
          for (let r = 2; r <= 60; r++) { if (v('Pedidos', 'C' + r) === 'Hospital San Rafael') { n++; t += A.num(v('Pedidos', 'G' + r)) || 0; } }
          const ok = A.cerca(A.num(v('Consulta', 'C4')), n) && A.cerca(A.num(v('Consulta', 'C5')), t);
          v.restaurar();
          return ok ? true : 'Con otro cliente en C2 la consulta no se actualiza bien: usa C2 en las fórmulas.';
        } },
        { titulo: 'Carta combinada en Word', fn: (L) => {
          if (!L.docx) return 'Sube también el documento de Word (.docx) con la combinación de correspondencia.';
          const c = L.docx.campos.map((x) => x.toLowerCase());
          if (c.length) { const faltan = ['cliente', 'producto', 'cantidad', 'importe'].filter((x) => !c.some((y) => y.startsWith(x))); return faltan.length ? 'A la carta le faltan los campos: ' + faltan.join(', ') + '.' : true; }
          const nombres = CLI.map((x) => x.cliente).filter((n) => L.docx.texto.includes(n));
          return nombres.length >= 3 ? true : 'No encontré campos combinados en la carta. Inserta los campos con Correspondencia › Insertar campo combinado.';
        } },
        { titulo: 'Libro con macro y botón', nivel: 'experto', fn: (L) => (!L.habilitadoMacros || !L.tieneVBA ? 'Guarda el libro como .xlsm con la macro.' : L.hojas.some((x) => x.controles.some((c) => c.macro) || x.dibujo.conMacro.length) ? true : 'Asigna la macro a un botón.') },
        { titulo: 'Importe con formato de moneda en la carta', nivel: 'experto', fn: (L) => { if (!L.docx) return 'Sube la carta de Word.'; const i = L.docx.instrucciones.find((x) => /importe/i.test(x.campo)); return i && /\\#/.test(i.resto) ? true : 'Agrega al campo Importe el modificador \\# "$#,##0.00" (Alt+F9 para ver los códigos de campo).'; } },
      ],
    },
    donde: [
      { comando: 'Validación de datos', ruta: ['Datos', 'Validación de datos'] },
      { comando: 'Grabar macro', ruta: ['Programador', 'Grabar macro'], nota: 'También en Vista › Macros › Grabar macro…' },
      { comando: 'Botón (control de formulario)', ruta: ['Programador', 'Insertar', 'Botón (control de formulario)'] },
      { comando: 'Seguridad de macros', ruta: ['Programador', 'Seguridad de macros'] },
      { comando: 'Guardar como .xlsm', ruta: ['Archivo', 'Guardar como', 'Libro de Excel habilitado para macros (*.xlsm)'] },
      { comando: 'Funciones de búsqueda (BUSCARX)', ruta: ['Fórmulas', 'Búsqueda y referencia'] },
    ],
    glosario: ['BUSCARX', 'BUSCARV', 'INDICE', 'COINCIDIR', 'FILTRAR', 'CONTAR.SI', 'SUMAR.SI', 'TEXTO', 'SI.ERROR'],
    atajos: ['<kbd>Alt+F11</kbd> editor de VBA · <kbd>Alt+F8</kbd> lista de macros', 'En Word: <kbd>Alt+F9</kbd> muestra u oculta los códigos de campo', 'Para el Formulario de datos: agrega «Formulario…» a la barra de acceso rápido (Todos los comandos).'],
  });
})();
