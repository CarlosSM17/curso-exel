/* Guía gráfica de las funciones que se usan en el curso.
   Cada lámina arma una mini hoja con datos de la clínica, calcula la fórmula con el mismo
   motor del simulador (HyperFormula en español) y la dibuja: argumentos de colores,
   rangos resaltados, celdas que cumplen el criterio, desbordamiento y pasos. */
(function () {
  'use strict';
  const LT = window.LT;
  const { h } = LT.u;
  const R = LT.refs;
  const F = LT.formato;
  const M = LT.motor;
  const COLORES = ['#2f6fdf', '#2e9d5b', '#a23ec2', '#d9822b', '#c53d5b'];
  const AUX = 40; // columna donde se calculan los auxiliares (fuera de la vista)

  const VOLUMEN = [['Hora', 'Solución (mL)'], ['07:00', 500], ['09:00', 250], ['11:00', 500], ['13:00', 250], ['15:00', 100]];
  const IMC5 = [['Paciente', 'IMC'], ['EXP-1001', 24.1], ['EXP-1002', 31.6], ['EXP-1003', 27.4], ['EXP-1004', 22.8], ['EXP-1005', 29.5]];
  const GLU5 = [['Paciente', 'Glucosa (mg/dL)'], ['EXP-1001', 92], ['EXP-1002', 134], ['EXP-1003', 87], ['EXP-1004', 151], ['EXP-1005', 99]];
  const GLU_MIX = [['Paciente', 'Glucosa (mg/dL)'], ['EXP-1001', 92], ['EXP-1002', 'hemolizada'], ['EXP-1003', 134], ['EXP-1004', ''], ['EXP-1005', 87]];
  const SEDES_GLU = [['Paciente', 'Sede', 'Glucosa', '', 'Sede'], ['EXP-1', 'Centro', 92, '', 'Norte'], ['EXP-2', 'Norte', 134], ['EXP-3', 'Norte', 87], ['EXP-4', 'Sur', 151], ['EXP-5', 'Norte', 110], ['EXP-6', 'Centro', 99]];
  const SEDES_AT = [['Folio', 'Sede', 'Atenciones', '', 'Sede'], ['A-0001', 'Centro', 32, '', 'Norte'], ['A-0002', 'Norte', 15], ['A-0003', 'Norte', 41], ['A-0004', 'Sur', 9], ['A-0005', 'Norte', 26], ['A-0006', 'Centro', 18]];
  const CRONICOS6 = [['Sede', 'Programa', 'Controlado', 'Espera (min)', 'Sede', 'Programa'], ['Centro', 'Diabetes', 'Sí', 25, 'Norte', 'Diabetes'], ['Norte', 'Diabetes', 'No', 40], ['Norte', 'Hipertensión', 'Sí', 18], ['Norte', 'Diabetes', 'Sí', 32], ['Sur', 'Diabetes', 'No', 51], ['Norte', 'Diabetes', 'Sí', 22]];
  const PRESION = [['Paciente', 'Sistólica', 'Diastólica', '¿Elevada?'], ['EXP-1', 150, 95], ['EXP-2', 145, 82], ['EXP-3', 128, 92], ['EXP-4', 118, 76]];
  const CATALOGO = [['Estudio', 'Área', 'Cuota', '', 'Buscar'], ['Biometría hemática', 'Laboratorio', 140], ['Química sanguínea', 'Laboratorio', 220], ['Perfil de lípidos', 'Laboratorio', 260], ['Glucosa en ayuno', 'Laboratorio', 70], ['Radiografía de tórax', 'Imagen', 350], ['Electrocardiograma', 'Imagen', 250]];
  const posiciones = (rango) => { const o = {}; R.celdasDe(rango).forEach((x, i) => { o[x.dir] = String(i + 1); }); return o; };

  /* ------------------------------------------------------------ láminas */
  const FICHAS = [
    {
      fn: 'SUMA', datos: VOLUMEN.concat([['Total']]), formatos: { 'B2:B7': '#,##0' }, en: 'B7', formula: '=SUMA(B2:B6)', args: [{ txt: 'B2:B6' }],
      pasos: ['Toma los números de <b>B2:B6</b> (el rango azul).', 'Los suma: 500 + 250 + 500 + 250 + 100 = <b>{res}</b> mL.'],
      errores: ['Un número guardado como texto (alineado a la izquierda, o «500 mL» con la unidad) no se suma.', 'Si el rango no llega a la última fila, el total queda incompleto: revisa el borde de color.'],
      tip: '<kbd>Alt</kbd>+<kbd>=</kbd> escribe la Autosuma por ti.',
    },
    {
      fn: 'PROMEDIO', datos: IMC5.concat([['Promedio']]), formatos: { 'B2:B7': '0.0' }, en: 'B7', formula: '=PROMEDIO(B2:B6)', args: [{ txt: 'B2:B6' }],
      calc: { suma: ['=SUMA(B2:B6)', '0.0'], n: '=CONTAR(B2:B6)' },
      pasos: ['Suma los valores: {suma}.', 'Cuenta cuántos números hay: {n}.', 'Divide: {suma} ÷ {n} = <b>{res}</b>.'],
      errores: ['Las celdas vacías no cuentan, pero los ceros sí: un 0 capturado por error baja el promedio.', 'Con valores extremos, la MEDIANA describe mejor el centro de los datos.'],
    },
    {
      fn: 'MAX', datos: GLU5.concat([['Mayor']]), en: 'B7', formula: '=MAX(B2:B6)', args: [{ txt: 'B2:B6' }],
      calc: { pos: '=COINCIDIR(MAX(B2:B6),B2:B6,0)', pac: '=INDICE(A2:A6,COINCIDIR(MAX(B2:B6),B2:B6,0))' },
      destacar: (c) => ['B' + (c.pos + 1)],
      pasos: ['Recorre B2:B6 y se queda con el valor más grande.', 'Resultado: <b>{res}</b> mg/dL (paciente {pac}).'],
      errores: ['MAX ignora textos y celdas vacías.', 'Para saber <i>quién</i> tiene el máximo, combínalo con BUSCARX o INDICE+COINCIDIR.'],
    },
    {
      fn: 'MIN', datos: GLU5.concat([['Menor']]), en: 'B7', formula: '=MIN(B2:B6)', args: [{ txt: 'B2:B6' }],
      calc: { pos: '=COINCIDIR(MIN(B2:B6),B2:B6,0)', pac: '=INDICE(A2:A6,COINCIDIR(MIN(B2:B6),B2:B6,0))' },
      destacar: (c) => ['B' + (c.pos + 1)],
      pasos: ['Recorre B2:B6 y se queda con el valor más pequeño.', 'Resultado: <b>{res}</b> mg/dL (paciente {pac}).'],
      errores: ['Una celda vacía no cuenta como cero; un 0 escrito sí sería el mínimo (y probablemente un error de captura).'],
    },
    {
      fn: 'CONTAR', datos: GLU_MIX.concat([['Con resultado']]), en: 'B7', formula: '=CONTAR(B2:B6)', args: [{ txt: 'B2:B6' }], anchoCol: { A: 110, B: 120 },
      marcar: { rango: 'B2:B6', f: '=ESNUMERO({c})' },
      pasos: ['Revisa cada celda de B2:B6.', 'Cuenta solo las que tienen <b>números</b> (✓): <b>{res}</b>.'],
      errores: ['CONTAR no cuenta textos («hemolizada»): para contar registros usa CONTARA.'],
    },
    {
      fn: 'CONTARA', datos: GLU_MIX.concat([['Llenas']]), en: 'B7', formula: '=CONTARA(B2:B6)', args: [{ txt: 'B2:B6' }], anchoCol: { A: 110, B: 120 },
      marcar: { rango: 'B2:B6', f: '=NO(ESBLANCO({c}))' },
      pasos: ['Revisa cada celda de B2:B6.', 'Cuenta todas las que <b>no están vacías</b>, con números o con texto (✓): <b>{res}</b>.'],
      errores: ['Una celda con un espacio, o con una fórmula que devuelve "", cuenta como llena.'],
    },
    {
      fn: 'RAIZ', datos: [['Peso (kg)', 'Talla (cm)', 'Superficie (m²)'], [70, 170]], formatos: { C2: '0.00' }, en: 'C2', formula: '=RAIZ(A2*B2/3600)', args: [{ txt: 'A2*B2/3600', ref: 'A2:B2' }], anchoCol: { C: 120 },
      calc: { dentro: ['=A2*B2/3600', '0.000'] },
      pasos: ['Primero calcula lo que está dentro: 70 × 170 / 3600 = {dentro}.', 'Después saca la raíz cuadrada: <b>{res}</b> m² (fórmula de Mosteller para la superficie corporal).'],
      errores: ['La talla va en centímetros: si la tienes en metros, multiplícala por 100.', 'La raíz de un número negativo da #¡NUM!.'],
      tip: 'Elevar a 0.5 es lo mismo: =(A2*B2/3600)^0.5.',
    },
    {
      fn: 'SI', datos: [['Paciente', 'Glucosa', 'Clasificación'], ['EXP-1001', 92], ['EXP-1002', 100], ['EXP-1003', 134], ['EXP-1004', 87]], anchoCol: { C: 110 },
      en: 'C2:C5', formula: '=SI(B2>=100,"Alterada","Normal")', args: [{ txt: 'B2>=100', ref: 'B2' }, { txt: '"Alterada"' }, { txt: '"Normal"' }],
      flujo: { prueba: 'B2>=100', si: '"Alterada"', no: '"Normal"' },
      traza: { etiqueta: 'A', filas: [2, 3, 4, 5], cols: [{ t: '¿B ≥ 100?', f: '=B{r}>=100' }, { t: 'Resultado', f: '=C{r}' }] },
      pasos: ['Evalúa la prueba lógica en cada fila.', 'Si es VERDADERO devuelve el segundo argumento; si es FALSO, el tercero.'],
      errores: ['Los textos van entre comillas: "Alterada".', 'EXP-1002 tiene exactamente 100: con &gt; en lugar de &gt;= se clasificaría como «Normal».', 'Para tres categorías se anidan: =SI(B2&gt;=126,"Diabetes",SI(B2&gt;=100,"Prediabetes","Normal")).'],
    },
    {
      fn: 'Y', datos: PRESION, en: 'D2:D5', formula: '=Y(B2>=140,C2>=90)', args: [{ txt: 'B2>=140', ref: 'B2' }, { txt: 'C2>=90', ref: 'C2' }], anchoCol: { D: 110 },
      traza: { etiqueta: 'A', filas: [2, 3, 4, 5], cols: [{ t: 'Sistólica ≥ 140', f: '=B{r}>=140' }, { t: 'Diastólica ≥ 90', f: '=C{r}>=90' }, { t: 'Y', f: '=D{r}' }] },
      pasos: ['Evalúa cada condición.', 'Devuelve VERDADERO solo si <b>todas</b> se cumplen (las dos presiones elevadas).'],
      errores: ['Y casi siempre va dentro de SI: =SI(Y(B2&gt;=140, C2&gt;=90), "Ambas elevadas", "").'],
    },
    {
      fn: 'O', datos: PRESION, en: 'D2:D5', formula: '=O(B2>=140,C2>=90)', args: [{ txt: 'B2>=140', ref: 'B2' }, { txt: 'C2>=90', ref: 'C2' }], anchoCol: { D: 110 },
      traza: { etiqueta: 'A', filas: [2, 3, 4, 5], cols: [{ t: 'Sistólica ≥ 140', f: '=B{r}>=140' }, { t: 'Diastólica ≥ 90', f: '=C{r}>=90' }, { t: 'O', f: '=D{r}' }] },
      pasos: ['Evalúa cada condición.', 'Devuelve VERDADERO si <b>al menos una</b> se cumple: basta una presión elevada.'],
      errores: ['Para «uno u otro valor» en la misma celda repite la celda: O(B2="Norte", B2="Sur"), no O(B2="Norte","Sur").'],
    },
    {
      fn: 'CONTAR.SI', datos: SEDES_GLU, celdas: { F1: 'Pacientes' }, en: 'F2', formula: '=CONTAR.SI(B2:B7,E2)', args: [{ txt: 'B2:B7' }, { txt: 'E2' }],
      marcar: { rango: 'B2:B7', f: '=CONTAR.SI({c},$E$2)' }, calc: { crit: '=E2' },
      pasos: ['Revisa cada celda del rango B2:B7.', 'Cuenta las que cumplen el criterio «{crit}» (✓): <b>{res}</b>.'],
      errores: ['Para comparar, el criterio va entre comillas y se une con &amp;: CONTAR.SI(C2:C21, "&gt;="&amp;F1).', 'Fija el rango con $ si vas a copiar la fórmula.'],
    },
    {
      fn: 'SUMAR.SI', datos: SEDES_AT, celdas: { F1: 'Atenciones' }, en: 'F2', formula: '=SUMAR.SI(B2:B7,E2,C2:C7)', args: [{ txt: 'B2:B7' }, { txt: 'E2' }, { txt: 'C2:C7' }],
      marcar: { rango: 'B2:B7', f: '=CONTAR.SI({c},$E$2)', tambien: ['C'] }, calc: { crit: '=E2' },
      pasos: ['Busca en B2:B7 las filas que cumplen «{crit}» (✓).', 'Suma los valores de esas mismas filas en C2:C7: <b>{res}</b>.'],
      errores: ['El rango del criterio y el rango de suma deben tener el mismo tamaño y empezar en la misma fila.'],
    },
    {
      fn: 'PROMEDIO.SI', datos: SEDES_GLU, celdas: { F1: 'Promedio' }, formatos: { F2: '0.0' }, en: 'F2', formula: '=PROMEDIO.SI(B2:B7,E2,C2:C7)', args: [{ txt: 'B2:B7' }, { txt: 'E2' }, { txt: 'C2:C7' }],
      marcar: { rango: 'B2:B7', f: '=CONTAR.SI({c},$E$2)', tambien: ['C'] }, calc: { crit: '=E2', n: '=CONTAR.SI(B2:B7,E2)', s: '=SUMAR.SI(B2:B7,E2,C2:C7)' },
      pasos: ['Toma las filas que cumplen «{crit}» (✓): son {n}.', 'Promedia sus valores de C2:C7: {s} ÷ {n} = <b>{res}</b> mg/dL.'],
      errores: ['Si ninguna fila cumple el criterio, el resultado es #¡DIV/0!.'],
    },
    {
      fn: 'CONTAR.SI.CONJUNTO', datos: CRONICOS6, celdas: { G1: 'En control' }, en: 'G2', formula: '=CONTAR.SI.CONJUNTO(A2:A7,E2,B2:B7,F2,C2:C7,"Sí")',
      args: [{ txt: 'A2:A7' }, { txt: 'E2' }, { txt: 'B2:B7' }, { txt: 'F2' }, { txt: 'C2:C7' }, { txt: '"Sí"' }], anchoCol: { B: 100, F: 90, G: 90 },
      marcar: { rango: 'A2:A7', f: '=Y(A{r}=$E$2,B{r}=$F$2,C{r}="Sí")', tambien: ['B', 'C'] },
      pasos: ['Cada criterio va en pareja: rango y criterio.', 'Cuenta las filas que cumplen <b>todos</b> a la vez (✓): sede Norte, programa Diabetes y «Sí» en control: <b>{res}</b>.'],
      errores: ['Todos los rangos deben tener el mismo tamaño.', 'Un indicador como «% en control» divide dos conteos: CONTAR.SI.CONJUNTO(…, "Sí") / CONTAR.SI.CONJUNTO(…).'],
    },
    {
      fn: 'SUMAR.SI.CONJUNTO', datos: CRONICOS6, celdas: { G1: 'Minutos' }, en: 'G2', formula: '=SUMAR.SI.CONJUNTO(D2:D7,A2:A7,E2,B2:B7,F2)',
      args: [{ txt: 'D2:D7' }, { txt: 'A2:A7' }, { txt: 'E2' }, { txt: 'B2:B7' }, { txt: 'F2' }], anchoCol: { B: 100, F: 90, G: 90 },
      marcar: { rango: 'A2:A7', f: '=Y(A{r}=$E$2,B{r}=$F$2)', tambien: ['B', 'D'] },
      pasos: ['El <b>primer</b> argumento es lo que se suma (la espera); después van las parejas rango–criterio.', 'Suma la espera de las filas de Norte y Diabetes (✓): <b>{res}</b> minutos. Entre el número de consultas da la espera promedio.'],
      errores: ['El orden es distinto al de SUMAR.SI: en .CONJUNTO el rango de suma va primero.'],
    },
    {
      fn: 'HOY', datos: [['Muestra', 'Fecha de toma', 'Días transcurridos', '', 'Hoy es'], ['M-101', '02/10/2025'], ['M-102', '15/10/2025']], celdas: { C2: '=HOY()-B2', C3: '=HOY()-B3' }, formatos: { 'C2:C3': '#,##0', E2: 'dd/mm/yyyy' },
      en: 'E2', formula: '=HOY()', args: [], anchoCol: { C: 130 },
      pasos: ['No lleva argumentos, pero sí los paréntesis.', 'Devuelve la fecha de hoy: <b>{res}</b>. Mañana mostrará otra.', 'Restar fechas da días: =HOY()-B2 (columna C), por ejemplo para saber cuántos días lleva una muestra sin procesar.'],
      errores: ['El resultado cambia cada día; para registrar una fecha fija escríbela o usa <kbd>Ctrl</kbd>+<kbd>;</kbd>.'],
    },
    {
      fn: 'AÑO', datos: [['Consulta', 'Fecha', 'Año'], [1, '14/02/2025'], [2, '30/11/2024'], [3, '05/01/2026']], en: 'C2:C4', formula: '=AÑO(B2)', args: [{ txt: 'B2' }],
      calc: { serial: ['=B2', '0'] },
      pasos: ['Para Excel, una fecha es un número: 14/02/2025 es el día {serial}.', 'AÑO extrae el año de esa fecha: <b>{res}</b>.'],
      errores: ['Si la fecha está escrita como texto (alineada a la izquierda), AÑO da #¡VALOR!.'],
    },
    {
      fn: 'MES', datos: [['Consulta', 'Fecha', 'Mes'], [1, '14/02/2025'], [2, '30/11/2024'], [3, '05/01/2026']], en: 'C2:C4', formula: '=MES(B2)', args: [{ txt: 'B2' }],
      pasos: ['Extrae el número de mes (1 a 12) de la fecha.', '14/02/2025 → <b>{res}</b>.'],
      errores: ['MES devuelve un número; para el nombre del mes usa TEXTO(B2, "mmmm").'],
    },
    {
      fn: 'CONCAT', datos: [['Nombre', 'Apellido', 'Expediente', 'Etiqueta'], ['Lucía', 'Pérez', 'EXP-1001'], ['Raúl', 'Gómez', 'EXP-1002']], en: 'D2:D3', formula: '=CONCAT(C2," · ",A2," ",B2)',
      args: [{ txt: 'C2' }, { txt: '" · "' }, { txt: 'A2' }, { txt: '" "' }, { txt: 'B2' }], anchoCol: { D: 190 },
      pasos: ['Une, en orden, cada argumento: textos de celdas y textos fijos entre comillas.', 'Resultado: <b>{res}</b>.'],
      errores: ['Sin el " " entre nombre y apellido quedaría «LucíaPérez».'],
      tip: 'El operador &amp; hace lo mismo: =C2&amp;" · "&amp;A2.',
    },
    {
      fn: 'REDONDEAR', datos: [['Cálculo', 'Valor', 'Redondeado'], ['Dosis (mg)', 187.456], ['IMC', 27.3486], ['Superficie (m²)', 1.8264]], formatos: { 'B2:B4': '#,##0.0000', 'C2:C4': '#,##0.##' },
      en: 'C2:C4', formula: '=REDONDEAR(B2,1)', args: [{ txt: 'B2' }, { txt: '1' }], anchoCol: { A: 120 },
      traza: { etiqueta: 'A', filas: [2, 3, 4], cols: [{ t: 'Con 0', f: '=REDONDEAR(B{r},0)', fmt: '#,##0' }, { t: 'Con 2', f: '=REDONDEAR(B{r},2)', fmt: '#,##0.00' }] },
      pasos: ['El segundo argumento dice cuántos decimales quedan.', 'Con 1, la dosis 187.456 queda en 187.5; con 0, en 187.'],
      errores: ['El formato de celda solo cambia lo que se ve; REDONDEAR cambia el valor guardado.', 'Redondea solo al final del cálculo: redondear pasos intermedios acumula error.'],
    },
    {
      fn: 'ESPACIOS', datos: [['Capturado', 'Limpio'], ['  Lucía   Pérez '], [' Química  sanguínea'], ['Sede Norte  ']], en: 'B2:B4', formula: '=ESPACIOS(A2)', args: [{ txt: 'A2' }], verEspacios: 'A2:B4', anchoCol: { A: 160, B: 150 },
      traza: { etiqueta: 'B', filas: [2, 3, 4], cols: [{ t: 'Largo antes', f: '=LARGO(A{r})' }, { t: 'Largo después', f: '=LARGO(B{r})' }] },
      pasos: ['Quita los espacios del inicio y del final (· = espacio).', 'Deja un solo espacio entre palabras.'],
      errores: ['Un espacio de más hace que «Norte » y «Norte» cuenten como sedes distintas en CONTAR.SI o en una tabla dinámica.'],
    },
    {
      fn: 'NOMPROPIO', datos: [['Capturado', 'Corregido'], ['lucía pérez'], ['RAÚL GÓMEZ'], ['ana de la cruz']], en: 'B2:B4', formula: '=NOMPROPIO(A2)', args: [{ txt: 'A2' }], anchoCol: { A: 130, B: 130 },
      pasos: ['Pone en mayúscula la primera letra de cada palabra y el resto en minúscula.'],
      errores: ['«de la» también queda con mayúscula («Ana De La Cruz»): revisa los nombres compuestos.'],
    },
    {
      fn: 'MAYUSC', datos: [['Capturado', 'Código'], ['con-001'], ['Lab-002'], ['img-003']], en: 'B2:B4', formula: '=MAYUSC(A2)', args: [{ txt: 'A2' }],
      pasos: ['Convierte todas las letras a mayúsculas: útil para códigos de servicio.'],
      errores: ['El resultado es una copia: para reemplazar los datos, copia y pega como valores.'],
    },
    {
      fn: 'MINUSC', datos: [['Capturado', 'Correo'], ['Lucia.Perez@Correo.MX'], ['RAUL@CLINICA.MX']], en: 'B2:B3', formula: '=MINUSC(A2)', args: [{ txt: 'A2' }], anchoCol: { A: 170, B: 160 },
      pasos: ['Convierte todas las letras a minúsculas: útil para correos.'],
      errores: ['Después de limpiar, Quitar duplicados encuentra pacientes repetidos que antes «parecían» distintos.'],
    },
    {
      fn: 'LARGO', datos: [['Teléfono', 'Dígitos'], ['4491234567'], ['449123456'], ['44912345678']], en: 'B2:B4', formula: '=LARGO(A2)', args: [{ txt: 'A2' }], anchoCol: { A: 110 },
      traza: { etiqueta: 'A', filas: [2, 3, 4], cols: [{ t: '¿10 dígitos?', f: '=B{r}=10' }] },
      pasos: ['Cuenta los caracteres del texto, incluidos los espacios.', 'Sirve para revisar capturas: un teléfono debe tener 10 dígitos.'],
      errores: ['LARGO cuenta también los espacios invisibles: combínalo con ESPACIOS.'],
    },
    {
      fn: 'SUSTITUIR', datos: [['Código', 'Sin guion'], ['CON-001'], ['LAB-002'], ['VAC-001']], en: 'B2:B4', formula: '=SUSTITUIR(A2,"-","")', args: [{ txt: 'A2' }, { txt: '"-"' }, { txt: '""' }],
      pasos: ['Busca «-» dentro del texto de A2.', 'Lo reemplaza por el tercer argumento ("" = nada): <b>{res}</b>.'],
      errores: ['Distingue mayúsculas y minúsculas: "con" no reemplaza "CON".'],
    },
    {
      fn: 'SUBTOTALES', datos: [['Servicio', 'Área', 'Atenciones'], ['Medicina general', 'Consulta', 124], ['Biometría hemática', 'Laboratorio', 87], ['Nutrición', 'Consulta', 45], ['Química sanguínea', 'Laboratorio', 66], ['Pediatría', 'Consulta', 58], ['Total visible']],
      en: 'C7', formula: '=SUBTOTALES(109,C2:C6)', args: [{ txt: '109' }, { txt: 'C2:C6' }], ocultas: [3, 5], anchoCol: { A: 140, B: 100 },
      forzar: (v) => ({ C7: [2, 4, 6].reduce((s, r) => s + v('C' + r), 0) }), calc: { suma: '=SUMA(C2:C6)' },
      pasos: ['El filtro dejó solo «Consulta»: las filas 3 y 5 están ocultas.', '109 = suma <b>sin las filas ocultas</b>: <b>{res}</b>.', 'Con SUMA el total incluiría todo: {suma}.'],
      errores: ['Con 9 se ignoran las filas filtradas, pero no las que ocultas a mano; con 109, ninguna de las dos.'],
      tip: 'La fila de totales de una tabla usa SUBTOTALES automáticamente.',
    },
    {
      fn: 'BUSCARX', datos: CATALOGO, celdas: { E2: 'Perfil de lípidos', F1: 'Cuota' }, formatos: { 'C2:C7': '$#,##0', F2: '$#,##0' }, en: 'F2', formula: '=BUSCARX(E2,A2:A7,C2:C7,"No existe")',
      args: [{ txt: 'E2' }, { txt: 'A2:A7' }, { txt: 'C2:C7' }, { txt: '"No existe"' }], insignias: posiciones('A2:A7'), anchoCol: { A: 150, B: 90, E: 120 },
      calc: { fila: '=COINCIDIR(E2,A2:A7,0)', buscado: '=E2' }, destacar: (c) => ['A' + (c.fila + 1), 'C' + (c.fila + 1)],
      pasos: ['Busca «{buscado}» en A2:A7.', 'Lo encuentra en la posición {fila}.', 'Devuelve el dato de esa misma posición en C2:C7: <b>{res}</b>.', 'Si no existiera, mostraría «No existe».'],
      errores: ['Un espacio de más («Perfil de lípidos ») hace que no lo encuentre: limpia con ESPACIOS o usa listas desplegables.', 'La matriz buscada y la devuelta deben tener el mismo número de filas.'],
    },
    {
      fn: 'BUSCARV', datos: CATALOGO, celdas: { E2: 'Perfil de lípidos', F1: 'Cuota' }, formatos: { 'C2:C7': '$#,##0', F2: '$#,##0' }, en: 'F2', formula: '=BUSCARV(E2,A2:C7,3,FALSO)',
      args: [{ txt: 'E2' }, { txt: 'A2:C7' }, { txt: '3' }, { txt: 'FALSO' }], insignias: { A1: '1', B1: '2', C1: '3' }, anchoCol: { A: 150, B: 90, E: 120 },
      calc: { fila: '=COINCIDIR(E2,A2:A7,0)', buscado: '=E2' }, destacar: (c) => ['A' + (c.fila + 1), 'C' + (c.fila + 1)],
      pasos: ['Busca «{buscado}» en la <b>primera columna</b> de A2:C7.', 'Cuenta 3 columnas (A = 1, B = 2, C = 3).', 'Devuelve la cuota: <b>{res}</b>. FALSO pide coincidencia exacta.'],
      errores: ['Si insertas una columna en medio, el 3 deja de apuntar a la cuota (BUSCARX no tiene ese problema).', 'Sin FALSO, BUSCARV hace búsqueda aproximada y puede traer un dato equivocado sin avisar.'],
    },
    {
      fn: 'INDICE', datos: CATALOGO.map((f, i) => (i === 0 ? ['Estudio', 'Área', 'Cuota', '', 'Posición'] : f)), celdas: { E2: '4', F1: 'Cuota' }, formatos: { 'C2:C7': '$#,##0', F2: '$#,##0' },
      en: 'F2', formula: '=INDICE(C2:C7,E2)', args: [{ txt: 'C2:C7' }, { txt: 'E2' }], insignias: posiciones('C2:C7'), anchoCol: { A: 150, B: 90 },
      calc: { pos: '=E2' }, destacar: (c) => ['C' + (c.pos + 1)],
      pasos: ['Cuenta posiciones dentro de C2:C7, empezando en 1.', 'La posición {pos} es <b>{res}</b>.'],
      errores: ['INDICE no busca: necesita la posición. Por eso se combina con COINCIDIR.'],
      tip: '=INDICE(C2:C7, COINCIDIR(E2, A2:A7, 0)) hace lo mismo que BUSCARX.',
    },
    {
      fn: 'COINCIDIR', datos: CATALOGO, celdas: { E2: 'Glucosa en ayuno', F1: 'Posición' }, formatos: { 'C2:C7': '$#,##0' }, en: 'F2', formula: '=COINCIDIR(E2,A2:A7,0)',
      args: [{ txt: 'E2' }, { txt: 'A2:A7' }, { txt: '0' }], insignias: posiciones('A2:A7'), anchoCol: { A: 150, B: 90, E: 120 },
      calc: { buscado: '=E2' }, destacar: (c) => ['A' + (c.res + 1)],
      pasos: ['Busca «{buscado}» en A2:A7.', 'Devuelve su <b>posición</b>, no su valor: <b>{res}</b>.', 'El 0 pide coincidencia exacta.'],
      errores: ['Sin el 0, COINCIDIR hace búsqueda aproximada en una lista que debería estar ordenada.'],
    },
    {
      fn: 'FILTRAR', datos: [['Paciente', 'Programa', 'Glucosa', '', 'Diabetes'], ['Lucía H.', 'Diabetes', 134], ['Mateo G.', 'Hipertensión', 98], ['Sofía M.', 'Diabetes', 151], ['Diego R.', 'Hipertensión', 92], ['Camila F.', 'Diabetes', 126]],
      en: 'E2', formula: '=FILTRAR(A2:A6,B2:B6="Diabetes")', args: [{ txt: 'A2:A6' }, { txt: 'B2:B6="Diabetes"', ref: 'B2:B6' }], derrame: true, anchoCol: { A: 100, B: 110, E: 100 },
      marcar: { rango: 'B2:B6', f: '={c}="Diabetes"', tambien: ['A'] },
      pasos: ['Revisa la condición fila por fila (✓ = VERDADERO).', 'Devuelve las filas de A2:A6 que cumplen y las <b>desborda</b> hacia abajo desde E2 (borde punteado).', 'Si cambian los datos, la lista se actualiza sola.'],
      errores: ['Si algo ocupa las celdas de abajo aparece #¡DESBORDAMIENTO!: deja espacio libre.', 'Si nada cumple: FILTRAR(…, …, "Sin resultados").'],
    },
    {
      fn: 'SI.ERROR', datos: [['Sede', 'En control', 'Consultas', '% de control'], ['Centro', 16, 22], ['Rural', 0, 0], ['Sur', 11, 25]], formatos: { 'D2:D4': '0.0%' },
      en: 'D2:D4', formula: '=SI.ERROR(B2/C2,0)', args: [{ txt: 'B2/C2', ref: 'B2:C2' }, { txt: '0' }], anchoCol: { D: 110 },
      traza: { etiqueta: 'A', filas: [2, 3, 4], cols: [{ t: 'Sin SI.ERROR', f: '=B{r}/C{r}', fmt: '0.0%' }, { t: 'Con SI.ERROR', f: '=D{r}', fmt: '0.0%' }] },
      pasos: ['Calcula el primer argumento (B2/C2).', 'Si da un error, como #¡DIV/0! en una sede sin consultas, muestra el segundo argumento.'],
      errores: ['Mostrar 0 % puede confundirse con «nadie en control»: a veces es mejor mostrar "" o «Sin datos».', 'No escondas errores que avisan de un problema real (por ejemplo, un estudio mal escrito en BUSCARX).'],
    },
    {
      fn: 'TEXTO', datos: [['Fecha de cita', 'Cuota', 'Cuota como texto'], ['20/10/2025', 260], ['02/11/2025', 1250.5]], formatos: { 'B2:B3': 'General' }, anchoCol: { A: 110, C: 140 },
      en: 'C2:C3', formula: '=TEXTO(B2,"$#,##0.00")', args: [{ txt: 'B2' }, { txt: '"$#,##0.00"' }],
      traza: { etiqueta: 'A', filas: [2, 3], cols: [{ t: 'TEXTO(A,"mmmm")', f: '=TEXTO(A{r},"mmmm")' }, { t: 'TEXTO(A,"dddd")', f: '=TEXTO(A{r},"dddd")' }] },
      pasos: ['Aplica el formato del segundo argumento al valor.', 'El resultado es <b>texto</b>: {res}.'],
      errores: ['El resultado ya no se puede sumar.', 'En Excel en español los códigos de fecha usan «aaaa» para el año (en inglés, «yyyy»).'],
      tip: 'Útil para combinar correspondencia: Word recibe la cuota ya con formato ($260.00).',
    },
  ];

  /* ----------------------------------------------------------- cálculo */
  const reTexto = /^=TEXTO\(([A-Z]+\d+)\s*[,;]\s*"([^"]*)"\)$/i;
  function calcular(f) {
    const celdas = {};
    const fmt = {};
    (f.datos || []).forEach((fila, r) => fila.forEach((v, c) => {
      if (v == null || v === '') return;
      const d = R.dir(r, c);
      celdas[d] = typeof v === 'string' && /^\s|\s$/.test(v) ? "'" + v : String(v);
      const info = F.interpretar(String(v));
      if (info.fmt) fmt[d] = info.fmt;
    }));
    Object.assign(celdas, f.celdas || {});
    for (const [rg, cod] of Object.entries(f.formatos || {})) for (const x of R.celdasDe(rg)) fmt[x.dir] = cod;
    const destino = R.parseRango(f.en);
    const formulas = {};
    for (let r = destino.r1; r <= destino.r2; r++) for (let c = destino.c1; c <= destino.c2; c++) {
      const d = R.dir(r, c);
      celdas[d] = formulas[d] = R.desplazarFormula(f.formula, r - destino.r1, c - destino.c1);
    }
    // auxiliares en columnas lejanas
    let n = 0;
    const aux = (formula) => { const d = R.dir(n++, AUX); celdas[d] = formula; formulas[d] = formula; return d; };
    const calc = {};
    for (const [k, v] of Object.entries(f.calc || {})) { const [form, cod] = Array.isArray(v) ? v : [v, null]; calc[k] = { d: aux(form), fmt: cod }; }
    const marcas = {};
    if (f.marcar) for (const x of R.celdasDe(f.marcar.rango)) marcas[x.dir] = aux(f.marcar.f.replace(/\{c\}/g, x.dir).replace(/\{r\}/g, x.r + 1));
    const traza = f.traza ? f.traza.filas.map((r) => f.traza.cols.map((col) => aux(col.f.replace(/\{r\}/g, r)))) : null;
    const hf = M.crearMotor({ Hoja1: celdas }, {});
    const leer = (d) => { const v = M.valorEn(hf, 'Hoja1', d); return v; };
    const valores = {};
    const val = (d) => {
      if (d in valores) return valores[d];
      const fo = formulas[d];
      const m = fo && reTexto.exec(fo);
      if (m) { // TEXTO con los códigos de formato de Excel en español
        const base = val(m[1].toUpperCase());
        const cod = m[2].replace(/a/g, 'y').replace(/A/g, 'Y');
        return (valores[d] = base == null ? '' : F.formatear(base, cod).texto);
      }
      return (valores[d] = leer(d));
    };
    if (f.forzar) Object.assign(valores, f.forzar((d) => val(d)));
    const res = val(R.dir(destino.r1, destino.c1));
    const c = { res };
    for (const [k, x] of Object.entries(calc)) c[k] = val(x.d);
    return { val, fmt, calc, c, marcas: Object.fromEntries(Object.entries(marcas).map(([k, d]) => [k, val(d)])), traza: traza && traza.map((fila) => fila.map(val)), destino, formulas };
  }
  function mostrar(v, cod) {
    if (v == null || v === '') return '';
    if (typeof v === 'object' && v.error) return v.error;
    if (typeof v === 'boolean') return v ? 'VERDADERO' : 'FALSO';
    return F.formatear(v, cod || null).texto;
  }
  const esVerdadero = (v) => v === true || (typeof v === 'number' && v > 0);

  /* ------------------------------------------------------------ dibujo */
  function colorDe(a, i) { return COLORES[(a.p != null ? a.p : i) % COLORES.length]; }
  function refsDe(a) {
    const r = a.ref || a.txt;
    return /^\$?[A-Z]{1,3}\$?\d+(:\$?[A-Z]{1,3}\$?\d+)?$/.test(r) ? r.replace(/\$/g, '') : null;
  }
  function formulaColoreada(f) {
    const cont = h('code', { class: 'gf-formula' });
    let txt = f.formula, cursor = 0;
    const partes = [];
    (f.args || []).forEach((a, i) => {
      const k = txt.indexOf(a.txt, cursor);
      if (k < 0) return;
      partes.push([txt.slice(cursor, k), null]);
      partes.push([a.txt, colorDe(a, i)]);
      cursor = k + a.txt.length;
    });
    partes.push([txt.slice(cursor), null]);
    for (const [t, col] of partes) if (t) cont.appendChild(col ? h('span', { class: 'gf-arg', style: { color: col, borderColor: col } }, t) : document.createTextNode(t));
    return cont;
  }
  function sintaxis(f, info) {
    const s = info ? info.sintaxis : f.fn + '()';
    const i = s.indexOf('(');
    const nombre = s.slice(0, i);
    const params = s.slice(i + 1, s.lastIndexOf(')')).split(/,\s*/).filter(Boolean);
    const usados = new Set((f.args || []).map((a, k) => (a.p != null ? a.p : k)));
    return h('div', { class: 'gf-sintaxis' }, h('b', null, nombre), '(', params.map((p, k) => [k ? h('span', { class: 'gf-coma' }, ', ') : null, h('span', { class: 'gf-param' + (p.startsWith('[') ? ' opcional' : ''), style: usados.has(k) ? { background: COLORES[k % COLORES.length] + '22', borderColor: COLORES[k % COLORES.length], color: COLORES[k % COLORES.length] } : null }, p)]), ')');
  }
  function miniHoja(f, calc) {
    // dimensiones
    let filas = (f.datos || []).length, cols = Math.max(...(f.datos || [[]]).map((x) => x.length));
    const ampliar = (d) => { const p = R.parseCelda(d); if (p) { filas = Math.max(filas, p.r + 1); cols = Math.max(cols, p.c + 1); } };
    Object.keys(f.celdas || {}).forEach(ampliar);
    ampliar(R.dir(calc.destino.r2, calc.destino.c2));
    // desbordamiento
    const derrame = new Set();
    if (f.derrame) {
      for (let r = calc.destino.r1; r < calc.destino.r1 + 12; r++) { const d = R.dir(r, calc.destino.c1); const v = calc.val(d); if (v == null || v === '') break; derrame.add(d); ampliar(d); }
    }
    const resaltes = {};
    (f.args || []).forEach((a, i) => { const r = refsDe(a); if (r) resaltes[i] = { rg: R.parseRango(r), color: colorDe(a, i) }; });
    const destacadas = new Set(f.destacar ? f.destacar(calc.c) : []);
    const ocultas = new Set(f.ocultas || []);
    const marcasFila = {};
    if (f.marcar) for (const [d, v] of Object.entries(calc.marcas)) { const p = R.parseCelda(d); marcasFila[p.r] = esVerdadero(v); }
    const conEspacios = f.verEspacios ? new Set(R.celdasDe(f.verEspacios).map((x) => x.dir)) : new Set();
    const tabla = h('table', { class: 'gf-hoja' });
    const cab = h('tr', null, h('th', { class: 'esq' }));
    for (let c = 0; c < cols; c++) cab.appendChild(h('th', { style: f.anchoCol && f.anchoCol[R.colLetra(c)] ? { minWidth: f.anchoCol[R.colLetra(c)] + 'px' } : null }, R.colLetra(c)));
    tabla.appendChild(h('thead', null, cab));
    const tb = h('tbody');
    for (let r = 0; r < filas; r++) {
      const tr = h('tr', { class: ocultas.has(r + 1) ? 'oculta' : '' }, h('th', null, String(r + 1)));
      for (let c = 0; c < cols; c++) {
        const d = R.dir(r, c);
        let v = calc.val(d);
        let txt = mostrar(v, calc.fmt[d]);
        if (conEspacios.has(d) && typeof v === 'string') txt = v.replace(/ /g, '·');
        const td = h('td', { title: calc.formulas[d] || '' }, txt);
        if (typeof v === 'number') td.classList.add('num');
        if (v && typeof v === 'object' && v.error) td.classList.add('error');
        const enDestino = r >= calc.destino.r1 && r <= calc.destino.r2 && c >= calc.destino.c1 && c <= calc.destino.c2;
        if (enDestino) td.classList.add('resultado');
        if (derrame.has(d)) td.classList.add('derrame');
        if (destacadas.has(d)) td.classList.add('destacada');
        for (const { rg, color } of Object.values(resaltes)) {
          if (r < rg.r1 || r > rg.r2 || c < rg.c1 || c > rg.c2) continue;
          td.style.background = color + '1f';
          if (r === rg.r1) td.style.borderTop = '2px solid ' + color;
          if (r === rg.r2) td.style.borderBottom = '2px solid ' + color;
          if (c === rg.c1) td.style.borderLeft = '2px solid ' + color;
          if (c === rg.c2) td.style.borderRight = '2px solid ' + color;
        }
        if (f.marcar && r in marcasFila) {
          const enMarca = R.celdasDe(f.marcar.rango).some((x) => x.dir === d) || (f.marcar.tambien || []).includes(R.colLetra(c));
          if (enMarca) td.classList.add(marcasFila[r] ? 'cumple' : 'no-cumple');
          if (R.celdasDe(f.marcar.rango).some((x) => x.dir === d)) td.appendChild(h('span', { class: 'gf-marca' }, marcasFila[r] ? '✓' : '✗'));
        }
        const ins = f.insignias && f.insignias[d];
        if (ins) td.appendChild(h('span', { class: 'gf-insignia' }, ins));
        tr.appendChild(td);
      }
      tb.appendChild(tr);
    }
    tabla.appendChild(tb);
    return h('div', { class: 'gf-hoja-cont' }, tabla, ocultas.size ? h('div', { class: 'gf-nota' }, 'Filas en gris: ocultas por el filtro.') : null);
  }
  function plantilla(txt, calc) {
    return txt.replace(/\{(\w+)\}/g, (m, k) => {
      if (k === 'res') return mostrar(calc.c.res, calc.fmt[R.dir(calc.destino.r1, calc.destino.c1)]);
      if (k in calc.calc) return mostrar(calc.c[k], calc.calc[k].fmt);
      return m;
    });
  }
  function flujo(f) {
    return h('div', { class: 'gf-flujo', 'aria-label': 'Diagrama de la función SI' },
      h('div', { class: 'gf-rombo' }, h('span', null, '¿' + f.flujo.prueba + '?')),
      h('div', { class: 'gf-ramas' },
        h('div', { class: 'gf-rama si' }, h('div', { class: 'gf-etq' }, 'VERDADERO'), h('div', { class: 'gf-caja' }, f.flujo.si)),
        h('div', { class: 'gf-rama no' }, h('div', { class: 'gf-etq' }, 'FALSO'), h('div', { class: 'gf-caja' }, f.flujo.no))));
  }
  function traza(f, calc) {
    const t = h('table', { class: 'tabla-sitio gf-traza' });
    t.appendChild(h('thead', null, h('tr', null, h('th', null, 'Fila'), f.traza.cols.map((c) => h('th', null, c.t)))));
    t.appendChild(h('tbody', null, f.traza.filas.map((r, i) => h('tr', null, h('td', null, r + (f.traza.etiqueta ? ' · ' + mostrar(calc.val(f.traza.etiqueta + r), calc.fmt[f.traza.etiqueta + r]).replace(/^\s+|\s+$/g, '') : '')),
      calc.traza[i].map((v, j) => { const col = f.traza.cols[j]; const txt = mostrar(v, col.fmt); return h('td', { class: typeof v === 'boolean' ? (v ? 'gf-v' : 'gf-f') : v && v.error ? 'error' : '' }, typeof v === 'boolean' ? (v ? '✓ ' : '✗ ') + txt : txt); })))));
    return h('div', { class: 'tabla-scroll' }, t);
  }

  function lamina(f) {
    const info = LT.FUNCIONES[f.fn];
    let calc;
    try { calc = calcular(f); } catch (e) { console.error(f.fn, e); return h('article', { class: 'gf-lamina' }, h('h3', null, f.fn), h('p', null, 'No se pudo dibujar el ejemplo.')); }
    const mod = info && LT.CURSO.modulo(info.modulo);
    const id = 'f-' + f.fn.replace(/\./g, '-');
    return h('article', { class: 'gf-lamina', id, 'data-buscar': [f.fn, info && info.en, info && info.desc, info && info.categoria].join(' ').toLowerCase(), 'data-categoria': info ? info.categoria : '' },
      h('header', { class: 'gf-cab' },
        h('h3', null, f.fn),
        h('div', { class: 'gf-chips' }, info ? h('span', { class: 'chip' }, info.categoria) : null, info ? h('span', { class: 'chip excel', title: 'Nombre en inglés, como se guarda en el archivo' }, info.en) : null,
          mod ? h('a', { class: 'chip', href: LT.pagina.urlModulo(mod.id) }, 'Módulo ' + mod.id) : null)),
      h('p', { class: 'gf-idea' }, (info && info.desc) || ''),
      sintaxis(f, info),
      h('div', { class: 'gf-cuerpo' },
        miniHoja(f, calc),
        h('div', { class: 'gf-explica' },
          h('div', { class: 'gf-linea-formula' }, h('span', { class: 'gf-en' }, f.en.split(':')[0] + (f.en.includes(':') ? ' (copiada hasta ' + f.en.split(':')[1] + ')' : '')), formulaColoreada(f)),
          f.flujo ? flujo(f) : null,
          h('ol', { class: 'gf-pasos' }, (f.pasos || []).map((p) => h('li', { html: plantilla(p, calc) }))),
          h('div', { class: 'gf-resultado' }, 'Resultado: ', h('b', null, mostrar(calc.c.res, calc.fmt[R.dir(calc.destino.r1, calc.destino.c1)]))))),
      f.traza ? traza(f, calc) : null,
      h('div', { class: 'gf-pie' },
        f.errores && f.errores.length ? h('div', { class: 'gf-errores' }, h('b', null, '⚠ Cuidado'), h('ul', null, f.errores.map((e) => h('li', { html: e })))) : null,
        f.tip ? h('div', { class: 'gf-tip' }, h('b', null, '💡 Tip '), h('span', { html: f.tip })) : null));
  }

  function anatomia() {
    const partes = [
      ['=', 'Inicio', 'Toda fórmula empieza con el signo igual.', '#0f5e57'],
      ['SI', 'Función', 'El nombre dice qué hace.', '#1e7145'],
      ['(', 'Abre', 'Los argumentos van entre paréntesis.', '#777'],
      ['C2>=100', 'Argumento 1', 'Una condición: referencia, operador y número.', COLORES[0]],
      [',', 'Separador', 'Coma (o punto y coma, según tu configuración).', '#777'],
      ['"Alterada"', 'Argumento 2', 'Un texto, siempre entre comillas.', COLORES[1]],
      [',', 'Separador', '', '#777'],
      ['"Normal"', 'Argumento 3', 'Otro texto.', COLORES[2]],
      [')', 'Cierra', 'Cada paréntesis que abre debe cerrar.', '#777'],
    ];
    return h('div', { class: 'gf-anatomia', role: 'img', 'aria-label': 'Partes de la fórmula =SI(C2>=100, "Alterada", "Normal")' },
      partes.map(([t, n, d, col]) => h('div', { class: 'gf-parte' }, h('code', { style: { color: col, borderColor: col } }, t), h('b', { style: { color: col } }, n), d ? h('span', null, d) : null)));
  }

  function pagina() {
    const main = h('main', { class: 'contenedor guia-funciones' });
    const buscar = h('input', { class: 'buscador', type: 'search', placeholder: 'Buscar función (por ejemplo: buscar, contar, texto)', 'aria-label': 'Buscar función' });
    const cats = Array.from(new Set(FICHAS.map((f) => (LT.FUNCIONES[f.fn] || {}).categoria).filter(Boolean)));
    let cat = '';
    const chipsCat = h('div', { class: 'grupo-btn gf-filtros no-imprimir' });
    const dibujarChips = () => { chipsCat.innerHTML = ''; ['', ...cats].forEach((c) => chipsCat.appendChild(h('button', { class: 'btn chico' + (c === cat ? ' primario' : ''), onclick: () => { cat = c; dibujarChips(); filtrar(); } }, c || 'Todas'))); };
    const laminas = h('div', { class: 'gf-laminas' }, FICHAS.map(lamina));
    const vacio = h('p', { class: 'intro', style: { display: 'none' } }, 'Ninguna función coincide con la búsqueda.');
    const filtrar = () => {
      const q = buscar.value.trim().toLowerCase();
      let n = 0;
      laminas.querySelectorAll('.gf-lamina').forEach((el) => { const ok = (!q || el.dataset.buscar.includes(q)) && (!cat || el.dataset.categoria === cat); el.style.display = ok ? '' : 'none'; if (ok) n++; });
      vacio.style.display = n ? 'none' : '';
    };
    buscar.addEventListener('input', filtrar);
    dibujarChips();
    // índice por categoría
    const indice = h('div', { class: 'gf-indice' }, cats.map((c) => h('div', null, h('b', null, c), h('div', { class: 'gf-indice-fn' }, FICHAS.filter((f) => (LT.FUNCIONES[f.fn] || {}).categoria === c).map((f) => h('a', { href: '#f-' + f.fn.replace(/\./g, '-') }, f.fn))))));
    main.append(
      h('section', { class: 'seccion' }, h('div', { class: 'etiqueta-etapa' }, 'Referencia visual'), h('h1', null, 'Guía gráfica de funciones'),
        h('p', { class: 'intro' }, 'Las ' + FICHAS.length + ' funciones que se usan en el curso, cada una con un ejemplo clínico calculado en vivo. Los colores de la fórmula coinciden con los rangos de la hoja, igual que en Excel cuando editas una fórmula.'),
        h('div', { class: 'grupo-btn no-imprimir' }, h('button', { class: 'btn chico', onclick: () => window.print() }, 'Imprimir o guardar en PDF'), h('a', { class: 'btn chico fantasma', href: 'glosario.html' }, 'Glosario español-inglés'))),
      h('section', { class: 'seccion' }, h('h2', null, 'Anatomía de una fórmula'), anatomia(),
        h('div', { class: 'gf-leyenda' }, h('span', null, h('i', { class: 'gf-l resultado' }), 'Celda con la fórmula'), h('span', null, h('i', { class: 'gf-l cumple' }), 'Cumple el criterio (✓)'), h('span', null, h('i', { class: 'gf-l destacada' }), 'Valor encontrado'), h('span', null, h('i', { class: 'gf-l derrame' }), 'Resultado desbordado'))),
      h('section', { class: 'seccion no-imprimir' }, h('h2', null, 'Índice'), indice),
      h('section', { class: 'seccion' }, h('div', { class: 'gf-barra no-imprimir' }, buscar, chipsCat), vacio, laminas));
    LT.pagina.montar(main);
    if (location.hash) setTimeout(() => { const t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t) t.scrollIntoView(); }, 60);
  }

  LT.guiaFunciones = { FICHAS, pagina, calcular, lamina };
})();
