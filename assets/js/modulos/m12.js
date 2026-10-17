/* Módulo 12 · Gestionar y automatizar información */
(function () {
  const { D, ENC, fecha, serial } = LT.caso;
  const F = LT.formato;
  const EST = D.estudios;
  const PAC = D.pacientesOrden;
  const ords = D.ordenes.slice(0, 10).map((o) => ({ folio: o.folio, fecha: o.fecha, paciente: o.paciente, edad: o.edad, estudio: o.estudio }));
  const edadDe = (p) => (D.ordenes.find((o) => o.paciente === p) || { edad: 47 }).edad;
  const NUEVO = { folio: 5011, fecha: '2025-10-20', paciente: 'Camila Flores', edad: edadDe('Camila Flores'), estudio: 'Perfil de lípidos' };
  const frec = {};
  ords.forEach((o) => { frec[o.estudio] = (frec[o.estudio] || 0) + 1; });
  const CONSULTA = Object.entries(frec).sort((a, b) => b[1] - a[1])[0][0];
  const OTRO = EST.map((e) => e.estudio).find((e) => e !== CONSULTA && frec[e]) || EST[0].estudio;

  const libroReto = (experto) => ({
    hojas: [
      { nombre: 'Órdenes', datos: [['Folio', 'Fecha', 'Paciente', 'Edad', 'Estudio', 'Cuota', 'Preparación'], ...ords.map((o) => [o.folio, fecha(o.fecha), o.paciente, o.edad, o.estudio])], formatos: { 'F2:F30': '$#,##0.00', 'B2:B30': 'dd/mm/yyyy' }, estilos: { 'A1:G1': ENC }, anchos: { A: 56, B: 90, C: 150, D: 50, E: 170, F: 80, G: 300 }, objetivo: 'F2:G12,A12:E12', inmovilizar: { filas: 1 }, filasExtra: 10 },
      { nombre: 'Catálogo', datos: [['Estudio', 'Cuota', 'Preparación'], ...EST.map((e) => [e.estudio, e.cuota, e.preparacion])], formatos: { 'B2:B11': '$#,##0' }, estilos: { 'A1:C1': ENC }, anchos: { A: 170, C: 330 } },
      { nombre: 'Pacientes', datos: [['Paciente', 'Teléfono', 'Correo'], ...PAC.map((p) => [p.paciente, p.telefono, p.correo])], estilos: { 'A1:C1': ENC }, anchos: { A: 160, B: 110, C: 200 } },
      { nombre: 'Consulta', celdas: Object.assign({ B1: 'Consulta por estudio', B2: 'Estudio:', C2: CONSULTA, B4: 'Número de órdenes', B5: 'Ingresos por cuotas' }, experto ? { B7: 'Pacientes con este estudio' } : {}), formatos: { C5: '$#,##0.00' }, estilos: { B1: { b: true, fs: 15 }, C2: { bg: '#fff8d6', b: true }, 'B4:B7': { b: true } }, anchos: { A: 30, B: 190, C: 180 }, objetivo: experto ? 'C4:C5,C7' : 'C4:C5', filas: 16, cols: 5 },
    ],
    pestanas: true, herramientas: ['captura', 'formulas', 'portapapeles'], altura: 400,
  });
  const solucion = {
    'Órdenes!F2:F12': '=BUSCARX(E2,Catálogo!$A$2:$A$11,Catálogo!$B$2:$B$11)', 'Órdenes!G2:G12': '=BUSCARX(E2,Catálogo!$A$2:$A$11,Catálogo!$C$2:$C$11)',
    'Órdenes!A12': String(NUEVO.folio), 'Órdenes!B12': fecha(NUEVO.fecha), 'Órdenes!C12': NUEVO.paciente, 'Órdenes!D12': String(NUEVO.edad), 'Órdenes!E12': NUEVO.estudio,
    'Consulta!C4': '=CONTAR.SI(Órdenes!E2:E50,C2)', 'Consulta!C5': '=SUMAR.SI(Órdenes!E2:E50,C2,Órdenes!F2:F50)',
  };
  const validacion = (x, hoja, celda) => { const h = x.estado.hojas.find((y) => y.nombre === hoja); return h ? h.validaciones.find((v) => LT.refs.celdasDe(v.rango).some((c) => c.dir === celda)) : null; };
  const cubreHasta = (v, fila) => String(v.rango).split(',').some((p) => { const g = LT.refs.parseRango(p); return g && g.r2 + 1 >= fila; });
  const pruebaValidaciones = { tipo: 'fn', titulo: 'Listas desplegables y validación de la edad', fn: (x) => {
    const vc = validacion(x, 'Órdenes', 'C2'), ve = validacion(x, 'Órdenes', 'E2'), vd = validacion(x, 'Órdenes', 'D2');
    if (!vc || vc.tipo !== 'lista') return 'Falta la lista desplegable de pacientes en Órdenes!C2:C50 (Validación › Lista › Origen =Pacientes!$A$2:$A$11).';
    const pac = x.hoja.valoresLista(vc, 0);
    if (PAC.some((p) => !pac.includes(p.paciente))) return 'La lista de pacientes debe tomar los 10 pacientes de la hoja Pacientes (=Pacientes!$A$2:$A$11).';
    if (!ve || ve.tipo !== 'lista') return 'Falta la lista desplegable de estudios en Órdenes!E2:E50 (Origen =Catálogo!$A$2:$A$11).';
    const est = x.hoja.valoresLista(ve, 0);
    if (EST.some((e) => !est.includes(e.estudio))) return 'La lista de estudios debe tomar los 10 estudios de la hoja Catálogo.';
    if (!vd || vd.tipo !== 'entero' || +vd.min !== 0 || +vd.max !== 110) return 'En Edad (D2:D50) permite solo números enteros entre 0 y 110.';
    return [vc, ve, vd].every((v) => cubreHasta(v, 50)) ? true : 'Las validaciones deben cubrir hasta la fila 50, para las órdenes que vienen.';
  } };
  const pruebasBase = [
    pruebaValidaciones,
    { tipo: 'valores', rango: 'Órdenes!A12:E12', esperado: [[NUEVO.folio, serial(NUEVO.fecha), NUEVO.paciente, NUEVO.edad, NUEVO.estudio]], titulo: 'Orden nueva capturada en la fila 12', mensaje: '{celda} muestra {obtenido}; la orden nueva es ' + NUEVO.folio + ' · 20/10/2025 · ' + NUEVO.paciente + ' · ' + NUEVO.edad + ' · ' + NUEVO.estudio + '.' },
    { tipo: 'formula', rango: 'Órdenes!F2:G12', titulo: 'Cuota y preparación con fórmulas', mensaje: '{celda} tiene un valor escrito: búscalo en el catálogo con una fórmula.', mensajeVacia: '{celda} está vacía (copia las fórmulas hasta la fila 12).' },
    { tipo: 'usa', rango: 'Órdenes!F2:G12', funciones: ['BUSCARX', 'INDICE', 'BUSCARV'], alguna: true, titulo: 'Datos buscados en el catálogo', mensaje: '{celda} debe buscar en la hoja Catálogo con BUSCARX.' },
    { tipo: 'valores', rango: 'Órdenes!F2:G12', titulo: 'Cuotas y preparaciones correctas', mensaje: '{celda} muestra {obtenido}, pero debería ser {esperado}.' },
    { tipo: 'usa', rango: 'Consulta!C4', funciones: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'], alguna: true, titulo: 'Número de órdenes con CONTAR.SI', mensaje: 'En Consulta!C4 cuenta las órdenes del estudio con CONTAR.SI.' },
    { tipo: 'usa', rango: 'Consulta!C5', funciones: ['SUMAR.SI', 'SUMAR.SI.CONJUNTO'], alguna: true, titulo: 'Ingresos con SUMAR.SI', mensaje: 'En Consulta!C5 suma las cuotas del estudio con SUMAR.SI.' },
    { tipo: 'valores', rango: 'Consulta!C4:C5', titulo: 'Consulta correcta', mensaje: '{celda} muestra {obtenido}; para ' + CONSULTA + ' debería ser {esperado}.' },
    { tipo: 'robustez', cambios: [{ 'Consulta!C2': OTRO }, { 'Consulta!C2': NUEVO.estudio, 'Órdenes!E12': NUEVO.estudio }], rango: 'Consulta!C4:C5', titulo: 'La consulta funciona con cualquier estudio', mensaje: 'Al cambiar el estudio de C2, {celda} no se actualiza bien: usa C2 en la fórmula.' },
  ];
  const registrosCarta = D.ordenes.slice(0, 5).map((o) => {
    const e = EST.find((x) => x.estudio === o.estudio);
    return { Folio: o.folio, Paciente: o.paciente, Estudio: o.estudio, Cita: fecha(o.cita), Hora: o.hora, 'Preparación': e.preparacion, Cuota: o.cuota, Cuota_texto: F.formatear(o.cuota, '$#,##0.00').texto };
  });
  const HUECOS = [
    { id: 'paciente', etiqueta: 'Paciente', correcto: 'Paciente' },
    { id: 'estudio', etiqueta: 'Estudio', correcto: 'Estudio' },
    { id: 'folio', etiqueta: 'Número de orden', correcto: 'Folio' },
    { id: 'cita', etiqueta: 'Fecha de la cita', correcto: 'Cita' },
    { id: 'hora', etiqueta: 'Hora', correcto: 'Hora' },
    { id: 'prep', etiqueta: 'Preparación', correcto: 'Preparación' },
    { id: 'cuota', etiqueta: 'Cuota', correcto: 'Cuota_texto', aviso: { Cuota: 'En la vista previa la cuota sale como ' + registrosCarta[0].Cuota + ' (sin formato de moneda). Usa el campo «Cuota_texto», que ya trae el formato $#,##0.00.' } },
  ];
  const PLANTILLA = ['Clínica Universitaria Vida Sana · Indicaciones para su estudio', 'Estimado(a) {paciente}:', 'Su estudio de {estudio} (orden {folio}) está programado para el {cita} a las {hora}.', 'Preparación: {prep}', 'Cuota de recuperación: {cuota}. Presente esta carta y una identificación oficial.', 'Atentamente, Coordinación de Laboratorio e Imagen'];

  LT.definirModulo({
    id: 12,
    objetivo: 'Diseñar una base de datos e identificar sus campos; capturar con formularios, validación y listas desplegables; buscar y consultar información con fórmulas; automatizar tareas con macros (grabadora, botones, seguridad, introducción a VBA) y generar documentos combinando correspondencia entre Excel y Word.',
    situacion: 'Las órdenes de laboratorio e imagen se capturan cada quien a su manera: nombres distintos para el mismo estudio, edades imposibles y nadie encuentra nada. Quiero un <b>registro de órdenes</b> bien diseñado: captura con <b>listas</b>, la cuota y la <b>preparación se buscan solas</b>, una <b>consulta por estudio</b>, un <b>botón</b> que limpie la captura y las <b>cartas de indicaciones</b> para cada paciente, hechas en automático.',
    explicacion: [
      { html: '<h3>Diseñar una base de datos</h3><p>Una base de datos en Excel es una lista donde <b>cada fila es un registro</b> (una orden, una consulta) y <b>cada columna es un campo</b> (fecha, paciente, estudio…). Reglas de oro:</p><ul><li>Encabezados en una sola fila, únicos y sin celdas combinadas; nada encima de los datos.</li><li><b>Un dato por celda</b>: «TA 130/85, FC 78» son tres campos: sistólica, diastólica y frecuencia cardiaca.</li><li>Sin filas ni columnas vacías y sin subtotales dentro de los datos.</li><li>Cada campo con un solo tipo de dato: fechas reales, números sin unidades (la unidad va en el encabezado: «Peso (kg)»), textos escritos siempre igual.</li><li>Un campo clave que identifique cada registro (Folio, Expediente).</li><li>Lo que se repite va en su propia tabla (catálogo de estudios, pacientes) y se trae con búsquedas.</li></ul><p class="aviso-caja info">Los datos de salud son <b>datos personales sensibles</b>: registra solo lo necesario, protege el archivo y respeta la normativa del expediente clínico y de protección de datos de tu institución.</p><h3>Identificar los campos: el diccionario de datos</h3><div class="tabla-scroll"><table class="tabla-sitio"><thead><tr><th>Campo</th><th>Tipo</th><th>¿Obligatorio?</th><th>Valores permitidos</th><th>Cómo se llena</th></tr></thead><tbody><tr><td>Folio</td><td>Número entero</td><td>Sí, único</td><td>Consecutivo</td><td>Captura</td></tr><tr><td>Fecha</td><td>Fecha</td><td>Sí</td><td>Fechas del año</td><td>Captura</td></tr><tr><td>Paciente</td><td>Texto</td><td>Sí</td><td>Lista de la hoja Pacientes</td><td>Lista desplegable</td></tr><tr><td>Edad</td><td>Número entero</td><td>Sí</td><td>0 a 110</td><td>Validación</td></tr><tr><td>Estudio</td><td>Texto</td><td>Sí</td><td>Lista del catálogo</td><td>Lista desplegable</td></tr><tr><td>Cuota</td><td>Moneda</td><td>—</td><td>Del catálogo</td><td>Fórmula (BUSCARX)</td></tr><tr><td>Preparación</td><td>Texto</td><td>—</td><td>Del catálogo</td><td>Fórmula (BUSCARX)</td></tr></tbody></table></div>' },
      { widget: 'disenoBD', titulo: '¿Qué está mal en este registro de consultas?', opts: { minimo: 5 } },
      { html: '<h3>Capturar sin errores</h3><ul><li><b>Validación de datos</b> (Datos › Validación de datos): limita lo que se acepta: lista, número entero entre dos valores (edad de 0 a 110), decimal (peso), fecha, longitud de texto (teléfono de 10 dígitos); con mensaje de entrada y de error.</li><li><b>Listas desplegables</b>: Permitir «Lista» con un origen de celdas (<code>=Pacientes!$A$2:$A$11</code>) o valores separados por coma.</li><li><b>Formulario de datos</b>: el comando «Formulario…» (agrégalo a la barra de acceso rápido desde «Todos los comandos») muestra un registro a la vez para capturar, buscar o revisar sin moverse por la hoja.</li><li>Alternativas: una hoja de captura con celdas desbloqueadas y validadas, o Microsoft Forms conectado a Excel.</li></ul><h3>Buscar y consultar</h3><p><code>=BUSCARX(E2, Catálogo!$A$2:$A$11, Catálogo!$B$2:$B$11)</code> trae la cuota del estudio; cambiando la última columna trae la preparación. Para consultar: <code>=CONTAR.SI(Órdenes!E2:E50, C2)</code> cuenta las órdenes de un estudio y <code>=SUMAR.SI(…)</code> suma sus cuotas; <code>=FILTRAR(…)</code> lista los pacientes.</p>' },
      { widget: 'buscarX', titulo: 'Cómo busca BUSCARX', instr: 'Escribe un estudio y mira cómo recorre el catálogo.', opts: { columnas: ['Estudio', 'Cuota', 'Preparación'], letras: ['A', 'B', 'C'], filas: EST.map((e) => [e.estudio, e.cuota, e.preparacion]), inicial: 'Perfil de lípidos' } },
      { html: '<h3>Automatizar tareas: macros</h3><ul><li>Una <b>macro</b> es una serie de pasos guardada para repetirla con un clic. La <b>grabadora</b> (Programador › Grabar macro) traduce tus acciones a código VBA.</li><li><b>Referencias relativas</b>: la macro repite los pasos desde la celda activa; absolutas: siempre en las mismas celdas.</li><li><b>Botones</b>: inserta una forma o un botón de formulario y usa «Asignar macro…».</li><li><b>Seguridad</b>: guarda como <b>.xlsm</b>; al abrir un archivo con macros aparece «Habilitar contenido»: hazlo solo si confías en su origen. Los archivos descargados de internet llegan bloqueados (Propiedades del archivo › Desbloquear).</li></ul><h3>Introducción a VBA</h3><p>Lo que graba la grabadora es código <b>VBA</b> (Visual Basic para Aplicaciones). Se ve con <kbd>Alt+F11</kbd>. Una macro es un procedimiento <code>Sub … End Sub</code> que trabaja con <b>objetos</b> (<code>Range</code>, <code>Worksheets</code>), sus <b>propiedades</b> (<code>.Value</code>, <code>.Font.Bold</code>) y sus <b>métodos</b> (<code>.Select</code>, <code>.ClearContents</code>):</p><pre class="mono" style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:10px;overflow:auto">Sub LimpiarCaptura()\n    \' Borra los datos capturados\n    Range("C2:C5").Select\n    Selection.ClearContents\n    Range("C2").Select\nEnd Sub</pre><h3>Generar documentos: combinar correspondencia</h3><p>Con una base bien diseñada, Word genera una carta por registro (indicaciones, recordatorios de cita, constancias): <b>Correspondencia › Iniciar combinación de correspondencia › Cartas</b>; <b>Seleccionar destinatarios › Usar una lista existente</b> (el libro y su hoja); <b>Insertar campo combinado</b> en cada lugar; <b>Vista previa de resultados</b>; <b>Finalizar y combinar › Editar documentos individuales</b> (o imprimir o enviar por correo). Consejo: Word no respeta el formato de moneda ni de fecha de Excel; usa una columna de texto con <code>=TEXTO(F2,"$#,##0.00")</code> o el modificador <code>\\# "$#,##0.00"</code> en el campo.</p>' },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Cartas de indicaciones desde la base de órdenes',
      pasos: ['Guarda el libro con la base (encabezados en la fila 1) y ciérralo.', { texto: 'En Word: Correspondencia › Iniciar combinación de correspondencia › Cartas.' }, 'Seleccionar destinatarios › Usar una lista existente › elige el libro y la hoja «Órdenes».', 'Coloca el cursor en cada lugar de la carta e inserta el campo combinado (Paciente, Estudio, Cita, Preparación…).', 'Vista previa de resultados para revisar algunos registros; después Finalizar y combinar › Editar documentos individuales.'],
      pregunta: { texto: 'En la vista previa, la cuota sale como <b>260</b> en lugar de <b>$260.00</b> y la fecha como <b>10/21/2025</b>. ¿Qué haces?', opciones: ['Agrego en Excel columnas con TEXTO (o uso modificadores de formato en los campos)', 'Escribo las cuotas y fechas a mano en cada carta', 'Cambio el formato de las celdas en Excel y listo', 'Imprimo y corrijo con pluma'], correcta: 0, explicacion: 'Word lee el valor guardado, no el formato de la celda. Un campo de texto ya formateado (=TEXTO(F2,"$#,##0.00")) o los modificadores <code>\\# "$#,##0.00"</code> y <code>\\@ "dd/MM/yyyy"</code> resuelven el problema.', retro: { 2: 'Word ignora el formato de la celda: lee el número guardado.' } },
    },
    micro: [
      { titulo: 'Detecta los problemas de diseño', tipo: 'widget', enunciado: 'Encuentra al menos 6 problemas de diseño en este registro de consultas.', crear: (c, listo) => LT.widgets.disenoBD(c, { minimo: 6, alListo: () => listo() }) },
      {
        titulo: 'Lista desplegable y formulario', tipo: 'hoja', enunciado: 'Agrega una <b>lista desplegable</b> en C2:C20 con Centro, Norte y Sur. Después usa el botón <b>Formulario</b> para capturar el registro: Folio 4 · Paciente Mateo García · Sede Norte · Edad 34.',
        hoja: { hojas: [{ nombre: 'Registro', datos: [['Folio', 'Paciente', 'Sede', 'Edad'], [1, 'Lucía Hernández', 'Centro', 41], [2, 'Sofía Martínez', 'Sur', 63], [3, 'Diego Ramírez', 'Centro', 52]], estilos: { 'A1:D1': ENC }, anchos: { B: 170 }, filas: 12, cols: 6 }], herramientas: ['captura'] },
        pruebas: [
          { tipo: 'fn', fn: (x) => { const v = validacion(x, 'Registro', 'C2'); if (!v || v.tipo !== 'lista') return 'Falta la lista desplegable en C2:C20 (botón Validación › Lista).'; const l = x.hoja.valoresLista(v, 0).map((s) => s.toLowerCase()).sort().join(); return l === 'centro,norte,sur' && cubreHasta(v, 20) ? true : 'La lista debe cubrir C2:C20 y tener exactamente Centro, Norte y Sur.'; } },
          { tipo: 'valores', rango: 'A5:D5', esperado: [[4, 'Mateo García', 'Norte', 34]], mensaje: '{celda} muestra {obtenido}; el registro nuevo es 4 · Mateo García · Norte · 34.' },
        ],
        pista: ['Selecciona C2:C20 › Validación › Permitir: Lista › Origen: Centro,Norte,Sur. Luego clic en una celda de los datos › Formulario › Agregar.'],
      },
      { titulo: 'Combinar correspondencia', tipo: 'widget', enunciado: 'Arma la carta de indicaciones: inicia la combinación como Cartas, conecta la lista de órdenes, coloca cada campo en su lugar, revisa la vista previa y finaliza.', crear: (c, listo) => LT.widgets.combinarCorrespondencia(c, { registros: registrosCarta, huecos: HUECOS, plantilla: PLANTILLA, archivo: 'Órdenes Vida Sana.xlsx', hoja: 'Órdenes', hojas: ['Órdenes$', 'Catálogo$', 'Pacientes$'], unidad: 'órdenes', alListo: () => listo() }) },
      {
        titulo: 'Macro con botón', tipo: 'hoja', enunciado: 'Graba una macro llamada <b>LimpiarCaptura</b> que seleccione C2:C5 y borre su contenido (tecla Supr). Inserta un botón y asígnale la macro (clic derecho › Asignar macro…).',
        hoja: { hojas: [{ nombre: 'Captura', datos: [['Captura de orden'], ['Paciente', '', 'Diego Ramírez'], ['Estudio', '', 'Química sanguínea'], ['Edad', '', 52], ['Fecha', '', '21/10/2025']], inicio: 'A1', estilos: { A1: { b: true, fs: 15 }, 'C2:C5': { bg: '#fff8d6' } }, anchos: { A: 110, B: 20, C: 170 }, filas: 10, cols: 6 }], altura: 240 },
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
      titulo: 'Registro de órdenes: captura y consulta', tipo: 'hoja',
      intro: 'El libro tiene cuatro hojas: <i>Órdenes</i> (la base), <i>Catálogo</i>, <i>Pacientes</i> y <i>Consulta</i>. La macro y las cartas se practican en los micro-retos y en el laboratorio.',
      base: {
        hoja: libroReto(false), solucion, pruebas: pruebasBase,
        instrucciones: ['En <b>Órdenes</b>: lista desplegable de pacientes en C2:C50 (origen <code>=Pacientes!$A$2:$A$11</code>), de estudios en E2:E50 (<code>=Catálogo!$A$2:$A$11</code>) y edad entera entre 0 y 110 en D2:D50.', 'Cuota (F) y Preparación (G) con BUSCARX desde el catálogo, hasta la fila 12.', 'Captura en la fila 12 la orden: ' + NUEVO.folio + ' · 20/10/2025 · ' + NUEVO.paciente + ' · ' + NUEVO.edad + ' · ' + NUEVO.estudio + ' (puedes usar el botón Formulario).', 'En <b>Consulta</b>: C4 = número de órdenes del estudio de C2 (CONTAR.SI) y C5 = ingresos por cuotas (SUMAR.SI).'],
        pistas: ['Primero valida la captura, después busca y al final consulta. Selecciona el rango antes de crear cada validación.', 'Validación › Lista › Origen <code>=Pacientes!$A$2:$A$11</code>. Cuota: <code>=BUSCARX(E2, Catálogo!$A$2:$A$11, Catálogo!$B$2:$B$11)</code>; Preparación: lo mismo con la columna C.', 'C4: <code>=CONTAR.SI(Órdenes!E2:E50, C2)</code> · C5: <code>=SUMAR.SI(Órdenes!E2:E50, C2, Órdenes!F2:F50)</code>.'],
      },
      niveles: {
        explorador: {
          plantilla: { celda: 'F2', texto: '=BUSCARX(E2, ___, ___)', copiar: 'F12' },
          instrucciones: ['Selecciona Órdenes!C2:C50 › <b>Validación</b> › Lista › Origen <code>=Pacientes!$A$2:$A$11</code>. Repite en E2:E50 con <code>=Catálogo!$A$2:$A$11</code>. En D2:D50: Número entero, mínimo 0, máximo 110.', 'Completa la fórmula de la cuota: busca en <code>Catálogo!$A$2:$A$11</code> y devuelve <code>Catálogo!$B$2:$B$11</code>. Cópiala hasta F12. En G2 haz lo mismo devolviendo <code>Catálogo!$C$2:$C$11</code> y cópiala hasta G12.', 'Clic en una celda de los datos › <b>Formulario</b> › escribe la orden ' + NUEVO.folio + ' · 20/10/2025 · ' + NUEVO.paciente + ' · ' + NUEVO.edad + ' · ' + NUEVO.estudio + ' › Agregar.', 'En Consulta: C4 <code>=CONTAR.SI(Órdenes!E2:E50,C2)</code> y C5 <code>=SUMAR.SI(Órdenes!E2:E50,C2,Órdenes!F2:F50)</code>.'],
        },
        experto: {
          hoja: libroReto(true),
          solucion: Object.assign({}, solucion, { 'Consulta!C7': '=FILTRAR(Órdenes!C2:C50,Órdenes!E2:E50=C2)' }),
          instrucciones: ['Todo lo del nivel Analista (validaciones, cuota, preparación, captura y consulta).', 'En Consulta!C2 pon una lista desplegable con los estudios del catálogo.', 'En Consulta!C7, con FILTRAR, lista los pacientes que tienen ese estudio (se desbordará hacia abajo).'],
          pruebasExtra: [
            { tipo: 'fn', titulo: 'Lista de estudios en la consulta', fn: (x) => { const v = validacion(x, 'Consulta', 'C2'); return v && v.tipo === 'lista' && x.hoja.valoresLista(v, 3).includes('Perfil de lípidos') ? true : 'Pon en Consulta!C2 una lista desplegable con los estudios.'; } },
            { tipo: 'usa', rango: 'Consulta!C7', funciones: ['FILTRAR'], titulo: 'Pacientes con FILTRAR', mensaje: 'Usa FILTRAR en Consulta!C7.' },
            { tipo: 'valores', rango: 'Consulta!C7:C10', titulo: 'Lista de pacientes del estudio', mensaje: '{celda} muestra {obtenido}; debería ser {esperado}.' },
          ],
        },
      },
    },
    lab: {
      archivo: 'lab12-ordenes.xlsx', titulo: 'Registro de órdenes y cartas de indicaciones', docx: true, acepta: '.xlsx,.xlsm,.docx',
      descargas: [{ ruta: 'laboratorios/lab12-carta.docx', texto: 'Carta (Word)' }],
      contexto: 'Parte 1 en Excel (base, validación, búsqueda y consulta) y parte 2 en Word (combinar correspondencia). Sube el libro y el documento de Word juntos.',
      pasos: {
        explorador: [{ texto: 'En Órdenes: listas desplegables en Paciente (C2:C60) y Estudio (E2:E60), y Edad entera de 0 a 110 (D2:D60).', ruta: ['Datos', 'Validación de datos'] }, 'Cuota (F) y Preparación (G) con BUSCARX desde Catálogo para todas las órdenes.', 'En Consulta: C4 número de órdenes y C5 ingresos del estudio de C2.', 'Guarda y cierra el libro. Abre lab12-carta.docx en Word: Correspondencia › Iniciar combinación › Cartas › Seleccionar destinatarios › Usar una lista existente (este libro, hoja Órdenes).', 'Inserta los campos Paciente, Estudio, Cita y Preparación donde dice [Campo]. Guarda la carta y sube los dos archivos.'],
        analista: ['Excel: validaciones en Órdenes (paciente, estudio, edad 0–110), cuota y preparación con BUSCARX y la consulta por estudio (C4, C5).', 'Word: combina la carta con la hoja Órdenes usando al menos los campos Paciente, Estudio, Cita y Preparación. Sube el libro y la carta.'],
        experto: ['Lo del nivel Analista.', 'Graba una macro que limpie Consulta!C2, asígnala a un botón y guarda el libro como .xlsm.', 'En Word, aplica al campo Cuota el formato de moneda con el modificador \\# "$#,##0.00" (Alt+F9 muestra los códigos de campo).'],
      },
      notaWeb: 'Combinar correspondencia y las macros requieren Word y Excel de escritorio.',
      pruebas: [
        { titulo: 'Validaciones de captura', fn: (L, A) => {
          const h = A.hoja('Órdenes');
          const v = (col) => h.validaciones.find((x) => A.rangoCubre(x.sqref, col + '2:' + col + '40'));
          const c = v('C'), e = v('E'), d = v('D');
          if (!c || c.tipo !== 'list' || !/pacientes|hern[aá]ndez|garc[ií]a/i.test(c.formula1)) return 'Falta la lista desplegable de pacientes en C2:C60.';
          if (!e || e.tipo !== 'list' || !/cat[aá]logo|biometr/i.test(e.formula1)) return 'Falta la lista desplegable de estudios en E2:E60.';
          if (!d || d.tipo !== 'whole' || +d.formula1 !== 0 || +d.formula2 !== 110) return 'En D2:D60 permite solo números enteros entre 0 y 110.';
          return true;
        } },
        { titulo: 'Cuota y preparación con fórmulas', fn: (L, A) => {
          for (let r = 2; r <= 60; r++) {
            const est = L.valor('Órdenes', 'E' + r);
            if (!est) break;
            const e = EST.find((x) => x.estudio === est);
            if (!L.usaFuncion('Órdenes', 'F' + r, ['XLOOKUP', 'INDEX', 'VLOOKUP'])) return 'F' + r + ' debe buscar la cuota con BUSCARX.';
            if (!e || !A.cerca(A.num(L.valor('Órdenes', 'F' + r)), e.cuota)) return 'F' + r + ' debería mostrar la cuota de ' + est + '.';
            if (!L.usaFuncion('Órdenes', 'G' + r, ['XLOOKUP', 'INDEX', 'VLOOKUP'])) return 'G' + r + ' debe buscar la preparación con BUSCARX.';
            if (String(L.valor('Órdenes', 'G' + r) || '').trim() !== e.preparacion) return 'G' + r + ' debería mostrar la preparación de ' + est + '.';
          }
          return true;
        } },
        { titulo: 'Consulta por estudio', fn: (L, A) => {
          A.hoja('Consulta');
          if (!L.usaFuncion('Consulta', 'C4', ['COUNTIF', 'COUNTIFS']) || !L.usaFuncion('Consulta', 'C5', ['SUMIF', 'SUMIFS'])) return 'Usa CONTAR.SI en C4 y SUMAR.SI en C5.';
          const v = A.conCambios({ 'Consulta!C2': 'Química sanguínea' });
          let n = 0, t = 0;
          for (let r = 2; r <= 60; r++) { if (v('Órdenes', 'E' + r) === 'Química sanguínea') { n++; t += A.num(v('Órdenes', 'F' + r)) || 0; } }
          const ok = A.cerca(A.num(v('Consulta', 'C4')), n) && A.cerca(A.num(v('Consulta', 'C5')), t);
          v.restaurar();
          return ok ? true : 'Con otro estudio en C2 la consulta no se actualiza bien: usa C2 en las fórmulas.';
        } },
        { titulo: 'Carta combinada en Word', fn: (L) => {
          if (!L.docx) return 'Sube también el documento de Word (.docx) con la combinación de correspondencia.';
          const c = L.docx.campos.map((x) => x.toLowerCase());
          if (c.length) { const faltan = ['paciente', 'estudio', 'cita', 'preparaci'].filter((x) => !c.some((y) => y.startsWith(x))); return faltan.length ? 'A la carta le faltan los campos: ' + faltan.join(', ').replace('preparaci', 'preparación') + '.' : true; }
          const nombres = PAC.map((x) => x.paciente).filter((n) => L.docx.texto.includes(n));
          return nombres.length >= 3 ? true : 'No encontré campos combinados en la carta. Inserta los campos con Correspondencia › Insertar campo combinado.';
        } },
        { titulo: 'Libro con macro y botón', nivel: 'experto', fn: (L) => (!L.habilitadoMacros || !L.tieneVBA ? 'Guarda el libro como .xlsm con la macro.' : L.hojas.some((x) => x.controles.some((c) => c.macro) || x.dibujo.conMacro.length) ? true : 'Asigna la macro a un botón.') },
        { titulo: 'Cuota con formato de moneda en la carta', nivel: 'experto', fn: (L) => { if (!L.docx) return 'Sube la carta de Word.'; const i = L.docx.instrucciones.find((x) => /cuota/i.test(x.campo)); return i && /\\#/.test(i.resto) ? true : 'Agrega al campo Cuota el modificador \\# "$#,##0.00" (Alt+F9 para ver los códigos de campo).'; } },
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
