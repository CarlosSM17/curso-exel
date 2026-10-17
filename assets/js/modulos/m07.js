/* Módulo 7 · Fórmulas intermedias */
(function () {
  const { D, ENC, fecha } = LT.caso;
  const glu = D.glucosa;
  const pers = D.personal;
  const datosGlucosa = [['Paciente', 'Sede', 'Glucosa (mg/dL)', 'Clasificación', 'Umbral de glucosa alterada', 100], ...glu.map((p, i) => [p.paciente, p.sede, p.glucosa, '', i === 2 ? 'Pacientes con glucosa alterada' : '', ''])];
  const hojaGlucosa = (extra) => ({
    nombre: 'Glucosa', datos: datosGlucosa,
    formatos: {},
    estilos: { 'A1:D1': ENC, 'E1:E4': { b: true }, G1: { b: true } }, anchos: { A: 150, B: 70, C: 110, D: 110, E: 220, F: 64, G: 150, H: 60 },
    objetivo: 'D2:D21,F4', inmovilizar: { filas: 1 }, celdas: extra || {},
  });
  const clasif = (g, u) => (g >= u ? 'Alterada' : 'Normal');
  const pruebasBase = (experto) => [
    { tipo: 'formula', rango: 'D2:D21', mensaje: '{celda} tiene un texto escrito; usa una fórmula para que la clasificación cambie si cambia la glucosa o el umbral.', mensajeVacia: '{celda} está vacía: clasifica a cada paciente (copia la fórmula hasta D21).', titulo: 'Las clasificaciones D2:D21 son fórmulas' },
    { tipo: 'valores', rango: 'D2:D21', mensaje: '{celda} muestra {obtenido}, pero se esperaba {esperado}: revisa la comparación (¿>= incluye a quien tiene exactamente el umbral?).', titulo: 'Las clasificaciones son correctas' },
    { tipo: 'formula', rango: 'F4', mensaje: 'F4 tiene un número escrito: cuenta con una fórmula para que cambie si cambian los datos.', mensajeVacia: 'Falta F4: cuenta cuántos pacientes tienen glucosa alterada.', titulo: 'F4 usa una fórmula' },
    { tipo: 'valores', rango: 'F4', mensaje: 'F4 muestra {obtenido}, pero {esperado} pacientes tienen glucosa en o por encima del umbral.', titulo: 'F4 cuenta bien a los pacientes con glucosa alterada' },
    { tipo: 'usa', rango: 'F4', funciones: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'], alguna: true, mensaje: 'Para contar con una condición usa CONTAR.SI en F4.', titulo: 'F4 usa CONTAR.SI' },
    { tipo: 'robustez', cambios: experto ? [{ F1: 110 }, { H1: 130 }] : { F1: 110 }, rango: 'D2:D21,F4', mensaje: experto ? 'Al cambiar los umbrales, {celda} no se actualizó: ¿fijaste F1 y H1 con signos de pesos?' : 'Al cambiar el umbral a 110, {celda} no se actualizó: ¿fijaste F1 con signos de pesos ($F$1)?', titulo: 'Resiste cambios de umbral (referencias absolutas)' },
  ];
  const dosis = [['EXP-7001', 12.5], ['EXP-7002', 18], ['EXP-7003', 22.4], ['EXP-7004', 9.8], ['EXP-7005', 30]];
  const pas = [['EXP-7101', 'Centro', 128], ['EXP-7102', 'Norte', 145], ['EXP-7103', 'Sur', 140], ['EXP-7104', 'Centro', 118], ['EXP-7105', 'Norte', 152]];

  LT.definirModulo({
    id: 7,
    objetivo: 'Usar referencias absolutas, rangos con nombre, SI (incluso anidado), Y, O, CONTAR.SI, SUMAR.SI, PROMEDIO.SI y funciones de texto y fecha con datos clínicos.',
    situacion: 'Para el programa de detección oportuna necesito <b>clasificar la glucosa en ayuno</b> de los pacientes de la jornada y saber <b>cuántos tienen la glucosa alterada</b>. El umbral está en una celda porque el comité podría cambiarlo.',
    explicacion: [
      { html: '<h3>Referencias que se mueven y referencias fijas</h3><p>Cuando copias una fórmula, Excel ajusta sus referencias: <code>=B2*F1</code> copiada una fila abajo se convierte en <code>=B3*F2</code>. Eso sirve para B (cada paciente tiene su peso), pero no para F1, donde está la dosis en mg/kg: es una sola celda. Para fijarla se usan signos de pesos: <code>$F$1</code>. Al escribir la fórmula, pon el cursor en la referencia y pulsa <kbd>F4</kbd>: <code>F1 → $F$1 → F$1 → $F1</code>.</p>' },
      { widget: 'copiarReferencias', titulo: 'Pruébalo: dosis por kilogramo', instr: 'La fórmula de C2 multiplica el peso por la dosis en mg/kg, que está en F1. Cambia el tipo de referencia de F1 y observa qué pasa al copiarla hasta C6. Pasa el cursor sobre cada fila para ver a qué celdas apunta.', opts: { datos: [['Expediente', 'Peso (kg)', 'Dosis (mg)', '', 'mg/kg', 15], ...dosis], formula: '=B2*F1', celda: 'C2', hasta: 'C6', formatos: { 1: '0.0', 5: '0' }, valorCorrecto: (r) => dosis[r - 1][1] * 15, formatoResultado: '0.0', instruccion: '' } },
      { html: '<h3>Decidir con SI, Y, O</h3><ul><li><code>=SI(prueba, valor_si_verdadero, valor_si_falso)</code>: elige entre dos resultados. Ejemplo: <code>=SI(C2&gt;=$F$1, "Alterada", "Normal")</code>.</li><li><b>SI anidado</b> para más de dos categorías, empezando por la más exigente: <code>=SI(C2&gt;=126, "Diabetes", SI(C2&gt;=100, "Prediabetes", "Normal"))</code>.</li><li><code>Y(…)</code> es verdadero si <b>todas</b> las condiciones se cumplen; <code>O(…)</code> si se cumple <b>al menos una</b>: <code>=SI(O(PAS&gt;=140, PAD&gt;=90), "Elevada", "Normal")</code>.</li></ul><h3>Contar, sumar y promediar con condición</h3><ul><li><code>=CONTAR.SI(C2:C21, "&gt;="&amp;F1)</code> cuenta las glucosas mayores o iguales al umbral. El <code>&amp;</code> une el operador con el valor de la celda.</li><li><code>=SUMAR.SI(B2:B21, "Centro", C2:C21)</code> y <code>=PROMEDIO.SI(…)</code> funcionan igual, con un rango de suma o de promedio.</li></ul><h3>Rangos con nombre, texto y fecha</h3><p>Selecciona F1, escribe <b>Umbral</b> en el cuadro de nombres y pulsa Enter: ahora puedes escribir <code>=C2&gt;=Umbral</code>. Para textos: <code>CONCAT</code> une; para fechas: <code>HOY()</code>, <code>AÑO()</code>, <code>MES()</code>; <code>REDONDEAR(número, decimales)</code> redondea (por ejemplo, una dosis a una décima).</p><p class="aviso-caja info">Los umbrales del curso siguen criterios de uso común y sirven para practicar Excel; el diagnóstico clínico requiere confirmación y criterios completos.</p>' },
    ],
    ejemplo: {
      titulo: 'Clasificación del primer paciente',
      hoja: { hojas: [Object.assign(hojaGlucosa(), { objetivo: null, filas: 10 })], altura: 200 },
      celda: 'D2', formula: '=SI(C2>=$F$1, "Alterada", "Normal")',
      pregunta: '¿Qué mostrará D2?', respuesta: clasif(glu[0].glucosa, 100),
      explicacion: [
        'La prueba es <code>C2&gt;=$F$1</code>: ¿' + glu[0].glucosa + ' es mayor o igual que 100? <b>' + (glu[0].glucosa >= 100 ? 'Sí' : 'No') + '</b>.',
        'Como la prueba es ' + (glu[0].glucosa >= 100 ? 'verdadera, SI devuelve el segundo argumento' : 'falsa, SI devuelve el tercer argumento') + ': <b>«' + clasif(glu[0].glucosa, 100) + '»</b>.',
        'Los textos van entre comillas; los signos de pesos en <code>$F$1</code> hacen que, al copiar la fórmula hacia abajo, todas las filas usen el mismo umbral.',
      ],
    },
    micro: [
      {
        titulo: 'Fija la referencia', tipo: 'widget',
        enunciado: 'La dosis de un medicamento se calcula con <code>=B2*F1</code> (peso × mg/kg), pero al copiarla hacia abajo deja de funcionar. Cambia el tipo de referencia de F1 hasta que todas las filas den el resultado correcto.',
        crear: (c, listo) => LT.widgets.copiarReferencias(c, { datos: [['Expediente', 'Peso (kg)', 'Dosis (mg)', '', 'mg/kg', 15], ...dosis], formula: '=B2*F1', celda: 'C2', hasta: 'C6', formatos: { 1: '0.0', 5: '0' }, valorCorrecto: (r) => dosis[r - 1][1] * 15, formatoResultado: '0.0', instruccion: '', alCambiar: (e) => { if (e.todasBien) listo(); } }),
      },
      {
        titulo: 'Rango con nombre', tipo: 'hoja',
        enunciado: 'Selecciona F1, escribe <b>Limite</b> en el cuadro de nombres y pulsa Enter. Después, en D2:D6 escribe una fórmula que muestre «Elevada» si la presión sistólica alcanza el límite y «Normal» si no, <b>usando el nombre Limite</b>.',
        hoja: { hojas: [{ nombre: 'Presión', datos: [['Expediente', 'Sede', 'Sistólica (mmHg)', 'Resultado', 'Límite', 140], ...pas], estilos: { 'A1:D1': ENC, E1: { b: true } }, anchos: { A: 100, C: 120 }, objetivo: 'D2:D6' }], herramientas: ['formulas'] },
        solucion: { 'D2:D6': '=SI(C2>=Limite,"Elevada","Normal")' }, nombresSolucion: { Limite: '=Presión!$F$1' },
        pruebas: [
          { tipo: 'fn', fn: (x) => (x.estado.nombres.Limite && /\$F\$1$/i.test(x.estado.nombres.Limite) ? true : 'Todavía no existe el nombre «Limite» para F1: selecciona F1, escribe Limite en el cuadro de nombres y pulsa Enter.') },
          { tipo: 'formula', rango: 'D2:D6' },
          { tipo: 'contiene', rango: 'D2:D6', texto: 'LIMITE', mensaje: 'En {celda} usa el nombre Limite en lugar de F1.' },
          { tipo: 'valores', rango: 'D2:D6' },
        ],
        pista: ['El cuadro de nombres es la casilla donde normalmente dice «F1».', 'La fórmula de D2 es <code>=SI(C2&gt;=Limite,"Elevada","Normal")</code>; luego cópiala hasta D6.'],
      },
      {
        titulo: 'Contar y sumar con condición', tipo: 'hoja',
        enunciado: 'En F2 calcula el total de atenciones del personal de la sede <b>Centro</b> en octubre y en F3 cuenta cuántos profesionales trabajan en <b>Norte</b>.',
        hoja: { hojas: [{ nombre: 'Personal', datos: [['Profesional', 'Sede', 'Atenciones (oct.)'], ...pers.map((e) => [e.nombre, e.sede, e.atencionesMes])], celdas: { E2: 'Atenciones de Centro', E3: 'Profesionales de Norte' }, estilos: { 'A1:C1': ENC, 'E2:E3': { b: true } }, anchos: { A: 140, C: 130, E: 170 }, objetivo: 'F2:F3' }], herramientas: ['formulas'] },
        solucion: { F2: '=SUMAR.SI(B2:B21,"Centro",C2:C21)', F3: '=CONTAR.SI(B2:B21,"Norte")' },
        pruebas: [
          { tipo: 'usa', rango: 'F2', funciones: ['SUMAR.SI', 'SUMAR.SI.CONJUNTO'], alguna: true, mensaje: 'En F2 usa SUMAR.SI.' },
          { tipo: 'valores', rango: 'F2', mensaje: 'F2 muestra {obtenido}; las atenciones de Centro suman {esperado}. Revisa el orden: SUMAR.SI(rango_criterio, criterio, rango_suma).' },
          { tipo: 'usa', rango: 'F3', funciones: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'], alguna: true, mensaje: 'En F3 usa CONTAR.SI.' },
          { tipo: 'valores', rango: 'F3', mensaje: 'F3 muestra {obtenido}, pero en Norte hay {esperado} profesionales.' },
        ],
        pista: ['<code>=SUMAR.SI(B2:B21,"Centro",C2:C21)</code>', '<code>=CONTAR.SI(B2:B21,"Norte")</code>'],
      },
      {
        titulo: 'Texto y fecha', tipo: 'hoja',
        enunciado: 'En D2:D6 une el nombre y el puesto así: «Andrea Solís - Medicina general» (usa CONCAT). En E2:E6 obtén el año de ingreso con AÑO.',
        hoja: { hojas: [{ nombre: 'Equipo', datos: [['Profesional', 'Puesto', 'Ingreso', 'Etiqueta', 'Año de ingreso'], ...pers.slice(0, 5).map((e) => [e.nombre, e.puesto, fecha(e.ingreso)])], estilos: { 'A1:E1': ENC }, anchos: { A: 140, B: 150, D: 260, E: 110 }, objetivo: 'D2:E6' }], herramientas: ['formulas'] },
        solucion: { 'D2:D6': '=CONCAT(A2," - ",B2)', 'E2:E6': '=AÑO(C2)' },
        pruebas: [{ tipo: 'formula', rango: 'D2:E6' }, { tipo: 'valores', rango: 'D2:D6', mensaje: '{celda} muestra {obtenido}; debería ser {esperado} (¿pusiste el texto " - " entre comillas?).' }, { tipo: 'valores', rango: 'E2:E6' }],
        pista: ['<code>=CONCAT(A2," - ",B2)</code>', '<code>=AÑO(C2)</code>'],
      },
    ],
    reto: {
      titulo: 'Clasificación de la glucosa en ayuno', tipo: 'hoja',
      intro: 'En la hoja <i>Glucosa</i>, la columna A tiene 20 pacientes (filas 2 a 21), B la sede y C la glucosa en ayuno. En F1 está el umbral de glucosa alterada (100 mg/dL).',
      base: {
        hoja: { hojas: [hojaGlucosa()], herramientas: ['portapapeles', 'formulas'] },
        solucion: { 'D2:D21': '=SI(C2>=$F$1, "Alterada", "Normal")', F4: '=CONTAR.SI(C2:C21, ">="&F1)' },
        pruebas: pruebasBase(false),
        instrucciones: ['En <b>D2</b>, clasifica la glucosa: «Alterada» si es mayor o igual al umbral de F1; si no, «Normal». Cópiala hasta <b>D21</b>.', 'En <b>F4</b>, cuenta cuántos pacientes tienen la glucosa alterada.'],
        pistas: ['Necesitas una función que elija entre dos resultados.', 'Su forma es <code>=SI(prueba, valor_si_verdadero, valor_si_falso)</code>; para contar con condición: <code>=CONTAR.SI(rango, criterio)</code>.', 'Al copiar hacia abajo, F1 se vuelve F2, F3…: fíjala con <code>$F$1</code> (tecla F4). En F4: <code>=CONTAR.SI(C2:C21, "&gt;="&amp;F1)</code>.'],
      },
      niveles: {
        explorador: {
          plantilla: { celda: 'D2', texto: '=SI(C2>=___, "Alterada", "Normal")', copiar: 'D21' },
          instrucciones: ['Completa el hueco de la fórmula: el umbral está en <b>F1</b>. Usa <b>$</b> para fijarlo (<code>$F$1</code>).', 'Pulsa «Escribir en D2» y copia D2 hasta D21 arrastrando el controlador de relleno.', 'En <b>F4</b> escribe <code>=CONTAR.SI(C2:C21, "&gt;="&amp;F1)</code>.'],
        },
        experto: {
          hoja: { hojas: [hojaGlucosa({ G1: 'Umbral de diabetes', H1: '126' })], herramientas: ['portapapeles', 'formulas'] },
          solucion: { 'D2:D21': '=SI(C2>=$H$1, "Diabetes", SI(C2>=$F$1, "Prediabetes", "Normal"))', F4: '=CONTAR.SI(C2:C21, ">="&F1)' },
          pruebas: pruebasBase(true),
          instrucciones: ['Clasificación en tres categorías en <b>D2:D21</b>: «Diabetes» desde el umbral de H1 (126 mg/dL), «Prediabetes» desde el umbral de F1 (100 mg/dL) y «Normal» por debajo. Resuélvelo con <b>SI anidados</b> en una sola fórmula.', 'En <b>F4</b>, cuenta cuántos pacientes están en o por encima del umbral de F1.'],
          pistas: ['Evalúa primero la condición más exigente (el umbral de diabetes).', '<code>=SI(prueba1, valor1, SI(prueba2, valor2, valor3))</code>', '<code>=SI(C2&gt;=$H$1, "Diabetes", SI(C2&gt;=$F$1, "Prediabetes", "Normal"))</code>'],
        },
      },
    },
    lab: {
      archivo: 'lab07-glucosa.xlsx', titulo: 'Clasificación de la glucosa de la segunda jornada',
      contexto: 'El mismo cálculo con los pacientes de otra jornada, y un resumen por sede.',
      pasos: {
        explorador: [
          { texto: 'En la hoja <b>Glucosa</b>, escribe en D2 <code>=SI(C2&gt;=$F$1, "Alterada", "Normal")</code> y cópiala hasta D21.' },
          { texto: 'En F4 escribe <code>=CONTAR.SI(C2:C21, "&gt;="&amp;F1)</code>.' },
          { texto: 'En F8, F9 y F10 calcula la glucosa promedio de Centro, Norte y Sur: <code>=PROMEDIO.SI($B$2:$B$21, E8, $C$2:$C$21)</code> y cópiala.', ruta: ['Fórmulas', 'Insertar función'] },
          'Guarda el libro (Ctrl+G) y súbelo aquí.',
        ],
        analista: ['En <b>D2:D21</b>, clasifica la glucosa con el umbral de F1.', 'En <b>F4</b>, cuenta cuántos pacientes tienen la glucosa alterada.', 'En <b>F8:F10</b>, calcula la glucosa promedio por sede con PROMEDIO.SI.', 'Guarda y sube el libro.'],
        experto: ['Resuelve D2:D21, F4 y F8:F10 como en el nivel Analista.', 'Asigna el nombre <b>Umbral</b> a F1 y úsalo en las fórmulas de la columna D.', 'En <b>G8:G10</b>, cuenta por sede los pacientes con glucosa alterada con CONTAR.SI.CONJUNTO.', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { titulo: 'D2:D21 tiene fórmulas', fn: (L, A) => { A.hoja('Glucosa'); const x = A.sinFormula('Glucosa', 'D2:D21'); return x ? x.dir + ' no tiene fórmula: clasifica con SI.' : true; } },
        { titulo: 'Las clasificaciones son correctas', fn: (L, A) => {
          const u = A.num(L.valor('Glucosa', 'F1'));
          for (const x of L.celdasRango('D2:D21')) {
            const g = A.num(L.valor('Glucosa', 'C' + (x.r + 1)));
            const e = g >= u ? 'alterada' : 'normal';
            const v = String(L.valor('Glucosa', x.dir) || '').trim().toLowerCase();
            if (v !== e) return x.dir + ' muestra «' + (v || 'vacío') + '» y debería decir «' + (g >= u ? 'Alterada' : 'Normal') + '».';
          }
          return true;
        } },
        { titulo: 'F4 cuenta con CONTAR.SI', fn: (L, A) => {
          const u = A.num(L.valor('Glucosa', 'F1'));
          const n = L.celdasRango('C2:C21').filter((x) => A.num(L.valor('Glucosa', x.dir)) >= u).length;
          if (!L.usaFuncion('Glucosa', 'F4', ['COUNTIF', 'COUNTIFS'])) return 'F4 debe usar CONTAR.SI.';
          return A.cerca(A.num(L.valor('Glucosa', 'F4')), n) ? true : 'F4 muestra ' + A.fmtEs(L.valor('Glucosa', 'F4')) + ', pero ' + n + ' pacientes tienen glucosa alterada.';
        } },
        { titulo: 'Las fórmulas resisten un cambio de umbral', fn: (L, A) => {
          const v = A.conCambios({ 'Glucosa!F1': 110 });
          let msg = true;
          for (const x of L.celdasRango('D2:D21')) {
            const g = A.num(v('Glucosa', 'C' + (x.r + 1))), e = g >= 110 ? 'alterada' : 'normal';
            if (String(v('Glucosa', x.dir) || '').trim().toLowerCase() !== e) { msg = 'Si el umbral cambia a 110, ' + x.dir + ' no se actualiza bien: ¿fijaste F1 con $?'; break; }
          }
          v.restaurar();
          return msg;
        } },
        { titulo: 'Glucosa promedio por sede (F8:F10)', fn: (L, A) => {
          for (const r of [8, 9, 10]) {
            const sede = L.valor('Glucosa', 'E' + r);
            const vals = L.celdasRango('C2:C21').filter((x) => L.valor('Glucosa', 'B' + (x.r + 1)) === sede).map((x) => A.num(L.valor('Glucosa', x.dir)));
            const esp = vals.reduce((a, b) => a + b, 0) / vals.length;
            if (!L.usaFuncion('Glucosa', 'F' + r, ['AVERAGEIF', 'AVERAGEIFS'])) return 'F' + r + ' debe usar PROMEDIO.SI.';
            if (!A.cerca(A.num(L.valor('Glucosa', 'F' + r)), esp)) return 'F' + r + ' (' + sede + ') muestra ' + A.fmtEs(L.valor('Glucosa', 'F' + r)) + '; debería ser ' + A.fmtEs(esp) + '.';
          }
          return true;
        } },
        { titulo: 'Nombre «Umbral» definido y usado', nivel: 'experto', fn: (L) => {
          const n = L.nombre('Umbral');
          if (!n || !/\$F\$1$/i.test(n.ref)) return 'Asigna el nombre Umbral a la celda F1.';
          return /UMBRAL/i.test(L.formula('Glucosa', 'D2') || '') ? true : 'Usa el nombre Umbral en la fórmula de D2.';
        } },
        { titulo: 'Pacientes con glucosa alterada por sede (G8:G10)', nivel: 'experto', fn: (L, A) => {
          const u = A.num(L.valor('Glucosa', 'F1'));
          for (const r of [8, 9, 10]) {
            const sede = L.valor('Glucosa', 'E' + r);
            const esp = L.celdasRango('C2:C21').filter((x) => L.valor('Glucosa', 'B' + (x.r + 1)) === sede && A.num(L.valor('Glucosa', x.dir)) >= u).length;
            if (!L.usaFuncion('Glucosa', 'G' + r, ['COUNTIFS'])) return 'G' + r + ' debe usar CONTAR.SI.CONJUNTO.';
            if (!A.cerca(A.num(L.valor('Glucosa', 'G' + r)), esp)) return 'G' + r + ' (' + sede + ') debería ser ' + esp + '.';
          }
          return true;
        } },
      ],
    },
    donde: [
      { comando: 'Asignar nombre', ruta: ['Fórmulas', 'Asignar nombre'], nota: 'Atajo: escribe el nombre en el cuadro de nombres y pulsa Enter.' },
      { comando: 'Insertar función', ruta: ['Fórmulas', 'Insertar función'], nota: 'También con el botón fx junto a la barra de fórmulas.' },
      { comando: 'Funciones lógicas (SI, Y, O)', ruta: ['Fórmulas', 'Lógicas'] },
      { comando: 'Administrador de nombres', ruta: ['Fórmulas', 'Administrador de nombres'] },
    ],
    glosario: ['SI', 'Y', 'O', 'CONTAR.SI', 'SUMAR.SI', 'PROMEDIO.SI', 'CONTAR.SI.CONJUNTO', 'HOY', 'AÑO', 'CONCAT', 'REDONDEAR'],
    atajos: ['<kbd>F4</kbd> mientras escribes una referencia: alterna A1 → $A$1 → A$1 → $A1.', 'Escribe el nombre en el cuadro de nombres y pulsa <kbd>Enter</kbd> para crear un rango con nombre.'],
  });
})();
