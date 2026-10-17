/* Módulo 2 · Fórmulas básicas */
(function () {
  const { D, ENC } = LT.caso;
  const turno = D.turno;
  const imc = (p) => p.peso / (p.talla * p.talla);
  const filasTurno = turno.map((p) => [p.expediente, p.hora, p.paciente, p.peso, p.talla]);
  const BAL = { oral: 900, iv: 1500, diuresis: 1650, insensibles: 450 };
  const hojaTurno = (extra) => ({
    nombre: 'Turno',
    datos: [['Expediente', 'Hora', 'Paciente', 'Peso (kg)', 'Talla (m)', 'IMC', '', 'Resumen del turno'], ...filasTurno],
    celdas: Object.assign({
      H2: 'Pacientes medidos', H3: 'IMC promedio', H4: 'IMC máximo', H5: 'IMC mínimo',
      H8: 'Balance hídrico de ' + turno[0].expediente + ' (mL)', H9: 'Ingresos: vía oral', I9: String(BAL.oral), H10: 'Ingresos: soluciones IV', I10: String(BAL.iv),
      H11: 'Egresos: diuresis', I11: String(BAL.diuresis), H12: 'Egresos: pérdidas insensibles', I12: String(BAL.insensibles), H13: 'Balance (ingresos − egresos)',
    }, extra || {}),
    formatos: { 'D2:D15': '0.0', 'E2:E15': '0.00', 'F2:F15': '0.0', 'I3:I5': '0.0', 'I9:I13': '#,##0', I15: '0.00' },
    estilos: { 'A1:F1': ENC, H1: { b: true, fs: 15 }, 'H2:H5': { b: true }, H8: { b: true, fs: 13 }, H13: { b: true }, H15: { b: true } },
    anchos: { A: 80, B: 56, C: 150, D: 76, E: 72, F: 64, G: 20, H: 230, I: 90 },
    objetivo: 'F2:F15,I2:I5,I13', inmovilizar: { filas: 1 },
  });
  const solucion = { 'F2:F15': '=D2/E2^2', I2: '=CONTAR(F2:F15)', I3: '=PROMEDIO(F2:F15)', I4: '=MAX(F2:F15)', I5: '=MIN(F2:F15)', I13: '=(I9+I10)-(I11+I12)' };
  const pruebas = [
    { tipo: 'formula', rango: 'F2:F15', titulo: 'IMC con fórmula', mensaje: '{celda} tiene un número escrito: calcula el IMC con una fórmula (peso / talla²).', mensajeVacia: '{celda} está vacía: copia la fórmula del IMC hasta F15.' },
    { tipo: 'valores', rango: 'F2:F15', titulo: 'IMC correcto', mensaje: '{celda} muestra {obtenido}, pero el IMC es {esperado}. Recuerda: =D2/E2^2 o =D2/(E2*E2). Sin paréntesis, =D2/E2*E2 vuelve a dar el peso.' },
    { tipo: 'usa', rango: 'I2', funciones: ['CONTAR', 'CONTARA'], alguna: true, titulo: 'Pacientes medidos con CONTAR', mensaje: 'En I2 usa CONTAR sobre los IMC.' },
    { tipo: 'usa', rango: 'I3', funciones: ['PROMEDIO'], titulo: 'IMC promedio con PROMEDIO', mensaje: 'En I3 usa PROMEDIO.' },
    { tipo: 'usa', rango: 'I4', funciones: ['MAX'], titulo: 'IMC máximo con MAX', mensaje: 'En I4 usa MAX.' },
    { tipo: 'usa', rango: 'I5', funciones: ['MIN'], titulo: 'IMC mínimo con MIN', mensaje: 'En I5 usa MIN.' },
    { tipo: 'valores', rango: 'I2:I5', titulo: 'Resumen correcto', mensaje: '{celda} muestra {obtenido}, pero debería ser {esperado}: revisa el rango (F2:F15).' },
    { tipo: 'formula', rango: 'I13', titulo: 'Balance calculado con fórmula', mensaje: 'I13 debe calcularse con una fórmula.' },
    { tipo: 'valores', rango: 'I13', titulo: 'El balance hídrico es correcto', mensaje: 'I13 muestra {obtenido}, pero el balance es {esperado} mL: (ingresos) − (egresos). ¿Usaste paréntesis?' },
    { tipo: 'robustez', cambios: { D3: 95, E5: 1.62, I12: 600 }, rango: 'F2:F15,I2:I5,I13', titulo: 'Se recalcula si cambian los datos', mensaje: 'Al cambiar un peso, una talla y las pérdidas, {celda} no se actualizó: usa referencias a celdas, no números escritos.' },
  ];

  LT.definirModulo({
    id: 2,
    objetivo: 'Construir fórmulas con operadores (incluida la potencia) y con SUMA, PROMEDIO, MAX, MIN y CONTAR, respetando la prioridad de operaciones.',
    situacion: 'Terminó el turno matutino de somatometría. Necesito el <b>IMC de cada paciente</b>, un <b>resumen</b> (cuántos se midieron, IMC promedio, máximo y mínimo) y el <b>balance hídrico</b> del paciente hospitalizado.',
    explicacion: [
      { html: '<h3>Fórmulas con criterio clínico</h3><p>Una fórmula empieza con <code>=</code> y usa <b>referencias</b> (D2) en lugar de números escritos, para que se recalcule sola si un dato cambia. Las fórmulas clínicas dependen mucho de la <b>prioridad de operaciones</b>:</p><ol><li>Paréntesis</li><li>Potencia <code>^</code></li><li>Multiplicación <code>*</code> y división <code>/</code></li><li>Suma <code>+</code> y resta <code>-</code></li></ol><p><b>IMC</b> = peso (kg) / talla (m)²: <code>=D2/E2^2</code>. Como la potencia va antes que la división, no hacen falta paréntesis; <code>=D2/(E2*E2)</code> también funciona. Pero <code>=D2/E2*E2</code> divide y vuelve a multiplicar: da el peso.</p><p><b>Balance hídrico</b> = ingresos − egresos: <code>=(I9+I10)-(I11+I12)</code>. Sin paréntesis, <code>=I9+I10-I11+I12</code> <b>suma</b> las pérdidas insensibles en lugar de restarlas.</p><h3>Funciones básicas</h3><ul><li><code>=SUMA(rango)</code>, <code>=PROMEDIO(…)</code>, <code>=MAX(…)</code>, <code>=MIN(…)</code> y <code>=CONTAR(…)</code> (cuenta celdas con números).</li><li><b>Autosuma</b> (<kbd>Alt+=</kbd>) propone el rango: revísalo siempre.</li></ul>' },
      { widget: 'copiarReferencias', titulo: 'Cómo se copian las referencias', instr: 'La fórmula del IMC en F2 es <code>=D2/E2^2</code>. Al copiarla hacia abajo, Excel ajusta las filas: en F3 será =D3/E3^2. Pasa el cursor sobre cada fila.', opts: { datos: [['Expediente', 'Hora', 'Paciente', 'Peso (kg)', 'Talla (m)', 'IMC'], ...filasTurno.slice(0, 5)], formula: '=D2/E2^2', celda: 'F2', hasta: 'F6', formatos: { 3: '0.0', 4: '0.00' }, valorCorrecto: (r) => imc(turno[r - 1]), formatoResultado: '0.0', instruccion: '' } },
    ],
    ejemplo: {
      titulo: 'IMC del primer paciente',
      hoja: { hojas: [{ nombre: 'Turno', datos: [['Expediente', 'Paciente', 'Peso (kg)', 'Talla (m)', 'IMC'], ...turno.slice(0, 4).map((p) => [p.expediente, p.paciente, p.peso, p.talla])], formatos: { 'E2:E5': '0.0' }, estilos: { 'A1:E1': ENC }, anchos: { B: 150 }, filas: 7 }] },
      celda: 'E2', formula: '=C2/D2^2',
      respuesta: Math.round(imc(turno[0]) * 10) / 10, formato: '0.0',
      explicacion: ['Primero se calcula la potencia: ' + turno[0].talla + '² = ' + LT.u.formatoMiles(turno[0].talla * turno[0].talla, 4) + '.', 'Después la división: ' + turno[0].peso + ' / ' + LT.u.formatoMiles(turno[0].talla * turno[0].talla, 4) + ' = <b>' + LT.u.formatoMiles(imc(turno[0]), 1) + '</b>.', 'Si cambias el peso o la talla, el IMC se recalcula solo.'],
    },
    micro: [
      { titulo: 'Prioridad de operaciones', tipo: 'opcion', enunciado: '¿Qué resultado muestra <code>=70/1.75^2</code>?', opciones: ['22.9', '1600', '40', '3.06'], correcta: 0, explicacion: 'Primero la potencia (1.75² = 3.0625) y luego la división: 70 / 3.0625 = <b>22.9</b>, el IMC de una persona de 70 kg y 1.75 m.', retro: { 1: '1600 sería (70/1.75)²: eso pasa si la división se hiciera primero.' } },
      {
        titulo: 'IMC de cada paciente', tipo: 'hoja',
        enunciado: 'En E2 calcula el IMC (peso / talla²) y cópialo hasta E8 con el controlador de relleno.',
        hoja: { hojas: [{ nombre: 'Pacientes', datos: [['Expediente', 'Paciente', 'Peso (kg)', 'Talla (m)', 'IMC'], ...turno.slice(0, 7).map((p) => [p.expediente, p.paciente, p.peso, p.talla])], formatos: { 'E2:E8': '0.0' }, estilos: { 'A1:E1': ENC }, anchos: { B: 150 }, objetivo: 'E2:E8', filas: 11, cols: 7 }], herramientas: ['portapapeles'] },
        solucion: { 'E2:E8': '=C2/D2^2' },
        pruebas: [{ tipo: 'formula', rango: 'E2:E8' }, { tipo: 'valores', rango: 'E2:E8', mensaje: '{celda} muestra {obtenido}; el IMC es {esperado}. ¿Elevaste la talla al cuadrado?' }, { tipo: 'robustez', cambios: { C4: 90 }, rango: 'E4', mensaje: 'Si cambia el peso, el IMC no cambia: usa referencias (C2/D2^2), no números.' }],
        pista: ['En E2 escribe <code>=C2/D2^2</code> y pulsa Enter. Luego selecciona E2 y arrastra el cuadrito hasta E8.'],
      },
      {
        titulo: 'Autosuma', tipo: 'hoja',
        enunciado: 'Selecciona C8 y usa <b>Autosuma</b> (botón Σ o <kbd>Alt+=</kbd>) para sumar el volumen de soluciones administradas en el turno.',
        hoja: { hojas: [{ nombre: 'Soluciones', datos: [['Hora', 'Solución', 'Volumen (mL)'], ['07:00', 'Salina 0.9 %', 500], ['09:00', 'Glucosada 5 %', 250], ['11:00', 'Hartmann', 500], ['13:00', 'Salina 0.9 %', 250], ['15:00', 'Glucosada 5 %', 100], ['17:00', 'Salina 0.9 %', 250], ['', 'Total']], formatos: { 'C2:C8': '#,##0' }, estilos: { 'A1:C1': ENC, 'B8:C8': { b: true } }, anchos: { B: 130, C: 110 }, objetivo: 'C8', filas: 10, cols: 5 }], herramientas: ['edicion'] },
        solucion: { C8: '=SUMA(C2:C7)' },
        pruebas: [{ tipo: 'usa', rango: 'C8', funciones: ['SUMA'] }, { tipo: 'valores', rango: 'C8', mensaje: 'C8 muestra {obtenido}; la suma de C2:C7 es {esperado} mL.' }],
        pista: ['Haz clic en C8 y pulsa el botón «Autosuma» (Σ); revisa que proponga C2:C7 y pulsa Enter.'],
      },
    ],
    reto: {
      titulo: 'Somatometría y balance hídrico del turno', tipo: 'hoja',
      intro: 'La hoja <i>Turno</i> tiene los 14 pacientes medidos (filas 2 a 15). A la derecha está el resumen y el balance hídrico de ' + turno[0].expediente + '.',
      base: {
        hoja: { hojas: [hojaTurno()], herramientas: ['portapapeles', 'edicion'] },
        solucion, pruebas,
        instrucciones: ['En <b>F2:F15</b> calcula el IMC de cada paciente: peso / talla².', 'En <b>I2:I5</b> calcula cuántos pacientes se midieron, el IMC promedio, el máximo y el mínimo (CONTAR, PROMEDIO, MAX, MIN).', 'En <b>I13</b> calcula el balance hídrico: (ingresos) − (egresos). Si es positivo, el paciente retuvo líquidos.'],
        pistas: ['Cada resultado debe venir de una fórmula que use celdas, para que se actualice si cambia un dato.', 'IMC: <code>=D2/E2^2</code>. Funciones: <code>=CONTAR(F2:F15)</code>, <code>=PROMEDIO(F2:F15)</code>… En el balance, los paréntesis agrupan ingresos y egresos.', 'I13: <code>=(I9+I10)-(I11+I12)</code> o <code>=SUMA(I9:I10)-SUMA(I11:I12)</code>.'],
      },
      niveles: {
        explorador: {
          plantilla: { celda: 'F2', texto: '=___/___^2', copiar: 'F15' },
          instrucciones: ['Completa la fórmula del IMC con el peso (D2) y la talla (E2), escríbela en F2 y cópiala hasta F15.', 'En I2 a I5 escribe: <code>=CONTAR(F2:F15)</code>, <code>=PROMEDIO(F2:F15)</code>, <code>=MAX(F2:F15)</code>, <code>=MIN(F2:F15)</code>.', 'En I13 escribe <code>=(I9+I10)-(I11+I12)</code>.'],
        },
        experto: {
          hoja: { hojas: [hojaTurno({ H15: 'Superficie corporal de ' + turno[0].expediente + ' (m²)' })], herramientas: ['portapapeles', 'edicion'] },
          solucion: Object.assign({}, solucion, { I15: '=RAIZ(D2*E2*100/3600)' }),
          pruebasExtra: [
            { tipo: 'formula', rango: 'I15', titulo: 'Superficie corporal calculada', mensaje: 'Falta I15: calcula la superficie corporal del primer paciente.' },
            { tipo: 'valores', rango: 'I15', titulo: 'Superficie corporal correcta', mensaje: 'I15 muestra {obtenido}; la superficie corporal (Mosteller) es {esperado} m². La talla va en centímetros: E2*100.' },
            { tipo: 'robustez', cambios: { D2: 64 }, rango: 'I15', titulo: 'La superficie corporal se recalcula', mensaje: 'Si cambia el peso, I15 no se actualiza: usa D2 y E2 en tu fórmula.' },
          ],
          instrucciones: ['Resuelve F2:F15, I2:I5 e I13 como en el nivel Analista.', 'En <b>I15</b> calcula la superficie corporal del paciente de la fila 2 con la fórmula de Mosteller: raíz cuadrada de (talla en cm × peso en kg / 3600).'],
          pistas: ['La talla está en metros: en centímetros es E2*100.', 'La raíz cuadrada se calcula con RAIZ(…) o elevando a 0.5.', '<code>=RAIZ(D2*E2*100/3600)</code> o <code>=(D2*E2*100/3600)^0.5</code>.'],
        },
      },
    },
    lab: {
      archivo: 'lab02-somatometria.xlsx', titulo: 'Somatometría del turno vespertino',
      contexto: 'El libro tiene el registro de otro turno, con la misma estructura y otro balance hídrico.',
      pasos: {
        explorador: [{ texto: 'En F2 escribe <code>=D2/E2^2</code> y cópiala hasta el último paciente.' }, { texto: 'En I2 a I5 usa CONTAR, PROMEDIO, MAX y MIN sobre la columna F.', ruta: ['Inicio', 'Autosuma', 'Promedio'] }, 'En I13 calcula <code>=(I9+I10)-(I11+I12)</code>.', 'Guarda y sube el libro.'],
        analista: ['Calcula el IMC en la columna F.', 'Completa el resumen I2:I5 con funciones.', 'Calcula el balance hídrico en I13.', 'Guarda y sube el libro.'],
        experto: ['Resuelve el turno como en el nivel Analista.', 'En I15 calcula la superficie corporal (Mosteller) del paciente de la fila 2.', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { titulo: 'IMC con fórmula y correcto', fn: (L, A) => {
          A.hoja('Turno');
          let n = 0;
          for (let r = 2; r <= 40; r++) {
            const peso = A.num(L.valor('Turno', 'D' + r)), talla = A.num(L.valor('Turno', 'E' + r));
            if (peso == null || talla == null) break;
            n++;
            if (!L.tieneFormula('Turno', 'F' + r)) return 'F' + r + ' no tiene fórmula.';
            if (!A.cerca(A.num(L.valor('Turno', 'F' + r)), peso / (talla * talla))) return 'F' + r + ' debería ser ' + A.fmtEs(peso / (talla * talla)) + ' (peso / talla²).';
          }
          return n ? true : 'No encontré los pacientes en la hoja Turno.';
        } },
        { titulo: 'Resumen con CONTAR, PROMEDIO, MAX y MIN', fn: (L, A) => {
          const v = [];
          for (let r = 2; r <= 40; r++) { const x = A.num(L.valor('Turno', 'F' + r)); if (x == null) break; v.push(x); }
          const esp = { I2: ['COUNT', v.length], I3: ['AVERAGE', v.reduce((a, b) => a + b, 0) / v.length], I4: ['MAX', Math.max(...v)], I5: ['MIN', Math.min(...v)] };
          const es = { AVERAGE: 'PROMEDIO', MAX: 'MAX', MIN: 'MIN', COUNT: 'CONTAR' };
          for (const [d, [fn, x]] of Object.entries(esp)) {
            if (!L.usaFuncion('Turno', d, fn === 'COUNT' ? ['COUNT', 'COUNTA'] : fn)) return d + ' debe usar ' + es[fn] + '.';
            if (!A.cerca(A.num(L.valor('Turno', d)), x)) return d + ' muestra ' + A.fmtEs(L.valor('Turno', d)) + '; debería ser ' + A.fmtEs(x) + '.';
          }
          return true;
        } },
        { titulo: 'Balance hídrico (I13)', fn: (L, A) => {
          if (!L.tieneFormula('Turno', 'I13')) return 'I13 debe tener una fórmula.';
          const n = (d) => A.num(L.valor('Turno', d));
          const e = n('I9') + n('I10') - (n('I11') + n('I12'));
          return A.cerca(n('I13'), e) ? true : 'I13 muestra ' + A.fmtEs(L.valor('Turno', 'I13')) + '; el balance es ' + A.fmtEs(e) + ' mL. ¿Usaste paréntesis?';
        } },
        { titulo: 'Superficie corporal (I15)', nivel: 'experto', fn: (L, A) => {
          if (!L.tieneFormula('Turno', 'I15')) return 'I15 debe tener una fórmula.';
          const e = Math.sqrt(A.num(L.valor('Turno', 'D2')) * A.num(L.valor('Turno', 'E2')) * 100 / 3600);
          return A.cerca(A.num(L.valor('Turno', 'I15')), e) ? true : 'I15 debería ser ' + A.fmtEs(e) + ' m² (raíz de talla en cm × peso / 3600).';
        } },
      ],
    },
    donde: [
      { comando: 'Autosuma', ruta: ['Inicio', 'Autosuma', 'Suma'], nota: 'Atajo: Alt+=. También está en Fórmulas › Autosuma.' },
      { comando: 'Promedio, Máx., Mín. y Contar números (desde Autosuma)', ruta: ['Inicio', 'Autosuma', 'Promedio'] },
      { comando: 'Insertar función', ruta: ['Fórmulas', 'Insertar función'] },
      { comando: 'Mostrar fórmulas', ruta: ['Fórmulas', 'Mostrar fórmulas'], nota: 'Atajo: Ctrl+`.' },
    ],
    glosario: ['SUMA', 'PROMEDIO', 'MAX', 'MIN', 'CONTAR', 'CONTARA'],
    atajos: ['<kbd>Alt+=</kbd> Autosuma', 'Escribe <kbd>=</kbd> y haz clic en una celda para insertar su referencia (modo Señalar).', 'Doble clic en el controlador de relleno: copia la fórmula hasta el final de los datos.', '<kbd>Ctrl+`</kbd> muestra u oculta las fórmulas.'],
  });
})();
