/* Módulo 3 · Fórmulas básicas */
(function () {
  const { D, ENC } = LT.caso;
  const corte = D.corte;
  const total = corte.reduce((s, t) => s + t.cantidad * t.precio, 0);
  const contado = 1500 + total - 20;
  const filasCorte = corte.map((t) => [t.ticket, t.hora, t.producto, t.cantidad, t.precio]);
  const hojaCorte = (extra) => ({
    nombre: 'Corte',
    datos: [['Ticket', 'Hora', 'Producto', 'Cantidad', 'Precio', 'Importe', '', 'Resumen del día'], ...filasCorte],
    celdas: Object.assign({ H2: 'Total vendido', H3: 'Ticket promedio', H4: 'Venta mayor', H5: 'Venta menor', H6: 'Número de tickets', H8: 'Fondo inicial', I8: '1500', H9: 'Dinero contado al cierre', I9: String(contado), H10: 'Diferencia de caja' }, extra || {}),
    formatos: { 'E2:F15': '$#,##0.00', 'I2:I5': '$#,##0.00', 'I8:I11': '$#,##0.00' },
    estilos: { 'A1:F1': ENC, H1: { b: true, fs: 15 }, 'H2:H11': { b: true } },
    anchos: { A: 64, B: 60, C: 150, D: 74, E: 80, F: 92, G: 24, H: 180, I: 110 },
    objetivo: 'F2:F15,I2:I6,I10', inmovilizar: { filas: 1 },
  });
  const solucion = { 'F2:F15': '=D2*E2', I2: '=SUMA(F2:F15)', I3: '=PROMEDIO(F2:F15)', I4: '=MAX(F2:F15)', I5: '=MIN(F2:F15)', I6: '=CONTAR(F2:F15)', I10: '=I9-(I8+I2)' };
  const pruebas = [
    { tipo: 'formula', rango: 'F2:F15', titulo: 'Importes con fórmula', mensaje: '{celda} tiene un número escrito: calcula el importe con =cantidad*precio.', mensajeVacia: '{celda} está vacía: copia la fórmula del importe hasta F15.' },
    { tipo: 'valores', rango: 'F2:F15', titulo: 'Importes correctos', mensaje: '{celda} muestra {obtenido}, pero cantidad × precio da {esperado}.' },
    { tipo: 'usa', rango: 'I2', funciones: ['SUMA'], titulo: 'Total con SUMA', mensaje: 'En I2 usa SUMA para sumar los importes.' },
    { tipo: 'usa', rango: 'I3', funciones: ['PROMEDIO'], titulo: 'Ticket promedio con PROMEDIO', mensaje: 'En I3 usa PROMEDIO.' },
    { tipo: 'usa', rango: 'I4', funciones: ['MAX'], titulo: 'Venta mayor con MAX', mensaje: 'En I4 usa MAX.' },
    { tipo: 'usa', rango: 'I5', funciones: ['MIN'], titulo: 'Venta menor con MIN', mensaje: 'En I5 usa MIN.' },
    { tipo: 'usa', rango: 'I6', funciones: ['CONTAR', 'CONTARA'], alguna: true, titulo: 'Número de tickets con CONTAR', mensaje: 'En I6 usa CONTAR.' },
    { tipo: 'valores', rango: 'I2:I6', titulo: 'Resumen correcto', mensaje: '{celda} muestra {obtenido}, pero debería ser {esperado}: revisa el rango (F2:F15).' },
    { tipo: 'formula', rango: 'I10', titulo: 'Diferencia calculada con fórmula', mensaje: 'I10 debe calcularse con una fórmula.' },
    { tipo: 'valores', rango: 'I10', titulo: 'La diferencia de caja es correcta', mensaje: 'I10 muestra {obtenido}, pero la diferencia es {esperado}: dinero contado − (fondo + ventas). ¿Usaste paréntesis?' },
    { tipo: 'robustez', cambios: { D3: 10, E5: 99, I8: 2000 }, rango: 'F2:F15,I2:I6,I10', titulo: 'Se recalcula si cambian los datos', mensaje: 'Al cambiar una cantidad, un precio y el fondo, {celda} no se actualizó: usa referencias a celdas, no números escritos.' },
  ];

  LT.definirModulo({
    id: 3,
    objetivo: 'Construir fórmulas con operadores y con SUMA, PROMEDIO, MAX, MIN y CONTAR, y copiarlas a otras celdas.',
    situacion: 'Cerramos el día en la sucursal Centro. Necesito el <b>corte de caja</b>: cuánto vendimos, el ticket promedio, la venta mayor y la menor, cuántos tickets hubo y si la caja cuadra.',
    explicacion: [
      { html: '<h3>Las fórmulas empiezan con =</h3><p>Una fórmula calcula a partir de otras celdas: <code>=D2*E2</code> multiplica la cantidad por el precio. Si cambia D2, el resultado se actualiza solo. Por eso conviene usar <b>referencias</b> (D2) y no números escritos (3*52).</p><p><b>Operadores:</b> <code>+</code> suma, <code>-</code> resta, <code>*</code> multiplica, <code>/</code> divide, <code>^</code> potencia. <b>Prioridad:</b> primero paréntesis, luego potencias, luego multiplicación y división, y al final suma y resta. <code>=2+3*4</code> da 14; <code>=(2+3)*4</code> da 20.</p><h3>Funciones básicas</h3><ul><li><code>=SUMA(F2:F15)</code> suma el rango F2 a F15 (los dos puntos significan «hasta»).</li><li><code>=PROMEDIO(…)</code>, <code>=MAX(…)</code>, <code>=MIN(…)</code> y <code>=CONTAR(…)</code> (cuenta las celdas con números).</li><li><b>Autosuma</b> (<kbd>Alt+=</kbd>) escribe la SUMA por ti y propone el rango.</li></ul>' },
      { widget: 'copiarReferencias', titulo: 'Cómo se copian las referencias', instr: 'La fórmula del importe en F2 es <code>=D2*E2</code>. Al copiarla hacia abajo, Excel ajusta las filas: en F3 será =D3*E3. Pasa el cursor sobre cada fila.', opts: { datos: [['Ticket', 'Hora', 'Producto', 'Cantidad', 'Precio', 'Importe'], ...filasCorte.slice(0, 5)], formula: '=D2*E2', celda: 'F2', hasta: 'F6', formatos: { 4: '$#,##0' }, valorCorrecto: (r) => corte[r - 1].cantidad * corte[r - 1].precio, formatoResultado: '$#,##0', instruccion: '' } },
    ],
    ejemplo: {
      titulo: 'Total de los primeros tickets',
      hoja: { hojas: [{ nombre: 'Corte', datos: [['Ticket', 'Producto', 'Cantidad', 'Precio', 'Importe', '', 'Total'], ...corte.slice(0, 4).map((t, i) => [t.ticket, t.producto, t.cantidad, t.precio, '=C' + (i + 2) + '*D' + (i + 2)])], formatos: { 'D2:E5': '$#,##0', G2: '$#,##0' }, estilos: { 'A1:G1': ENC }, anchos: { B: 130 }, filas: 7 }] },
      celda: 'G2', formula: '=SUMA(E2:E5)',
      respuesta: corte.slice(0, 4).reduce((s, t) => s + t.cantidad * t.precio, 0), formato: '$#,##0',
      explicacion: ['<code>E2:E5</code> es el rango de E2 a E5: cuatro celdas.', 'SUMA las suma: ' + corte.slice(0, 4).map((t) => t.cantidad * t.precio).join(' + ') + ' = <b>' + corte.slice(0, 4).reduce((s, t) => s + t.cantidad * t.precio, 0) + '</b>.', 'Si cambias una cantidad, E y el total se recalculan solos.'],
    },
    micro: [
      { titulo: 'Prioridad de operadores', tipo: 'opcion', enunciado: '¿Qué resultado muestra <code>=2+3*4</code>?', opciones: ['20', '14', '24', '9'], correcta: 1, explicacion: 'Primero se multiplica (3×4 = 12) y luego se suma 2: <b>14</b>. Para sumar primero: <code>=(2+3)*4</code>.', retro: { 0: '20 sería el resultado de =(2+3)*4. Sin paréntesis, la multiplicación va primero.' } },
      {
        titulo: 'Importe de cada ticket', tipo: 'hoja',
        enunciado: 'En E2 calcula el importe (cantidad × precio) y cópialo hasta E8 con el controlador de relleno.',
        hoja: { hojas: [{ nombre: 'Tickets', datos: [['Ticket', 'Producto', 'Cantidad', 'Precio', 'Importe'], ...corte.slice(0, 7).map((t) => [t.ticket, t.producto, t.cantidad, t.precio])], formatos: { 'D2:E8': '$#,##0' }, estilos: { 'A1:E1': ENC }, anchos: { B: 130 }, objetivo: 'E2:E8', filas: 11, cols: 7 }], herramientas: ['portapapeles'] },
        solucion: { 'E2:E8': '=C2*D2' },
        pruebas: [{ tipo: 'formula', rango: 'E2:E8' }, { tipo: 'valores', rango: 'E2:E8' }, { tipo: 'robustez', cambios: { C4: 9 }, rango: 'E4', mensaje: 'Si cambia la cantidad, el importe no cambia: usa referencias (C2*D2), no números.' }],
        pista: ['En E2 escribe <code>=C2*D2</code> y pulsa Enter. Luego selecciona E2 y arrastra el cuadrito verde hasta E8.'],
      },
      {
        titulo: 'Autosuma', tipo: 'hoja',
        enunciado: 'Selecciona E9 y usa <b>Autosuma</b> (botón Σ o <kbd>Alt+=</kbd>) para sumar los importes.',
        hoja: { hojas: [{ nombre: 'Tickets', datos: [['Ticket', 'Producto', 'Cantidad', 'Precio', 'Importe'], ...corte.slice(0, 7).map((t, i) => [t.ticket, t.producto, t.cantidad, t.precio, '=C' + (i + 2) + '*D' + (i + 2)]), ['', '', '', 'Total']], formatos: { 'D2:E9': '$#,##0' }, estilos: { 'A1:E1': ENC, 'D9:E9': { b: true } }, anchos: { B: 130 }, objetivo: 'E9', filas: 11, cols: 7 }], herramientas: ['edicion'] },
        solucion: { E9: '=SUMA(E2:E8)' },
        pruebas: [{ tipo: 'usa', rango: 'E9', funciones: ['SUMA'] }, { tipo: 'valores', rango: 'E9', mensaje: 'E9 muestra {obtenido}; la suma de E2:E8 es {esperado}.' }],
        pista: ['Haz clic en E9 y pulsa el botón «Autosuma» (Σ); revisa que proponga E2:E8 y pulsa Enter.'],
      },
    ],
    reto: {
      titulo: 'Corte de caja del día', tipo: 'hoja',
      intro: 'La hoja <i>Corte</i> tiene los 14 tickets del día (filas 2 a 15). A la derecha está el resumen que pidió Marta.',
      base: {
        hoja: { hojas: [hojaCorte()], herramientas: ['portapapeles', 'edicion'] },
        solucion, pruebas,
        instrucciones: ['En <b>F2:F15</b> calcula el importe de cada ticket (cantidad × precio).', 'En <b>I2:I6</b> calcula el total vendido, el ticket promedio, la venta mayor, la venta menor y el número de tickets, con SUMA, PROMEDIO, MAX, MIN y CONTAR.', 'En <b>I10</b> calcula la diferencia de caja: dinero contado − (fondo inicial + total vendido). Si es negativa, falta dinero.'],
        pistas: ['Cada resultado debe venir de una fórmula que use celdas, para que se actualice si cambia un ticket.', 'Importe: <code>=D2*E2</code>. Funciones: <code>=SUMA(F2:F15)</code>, <code>=PROMEDIO(F2:F15)</code>… Para la diferencia, los paréntesis hacen que la suma se calcule primero.', 'I10: <code>=I9-(I8+I2)</code>. Sin paréntesis, <code>=I9-I8+I2</code> restaría el fondo pero sumaría las ventas.'],
      },
      niveles: {
        explorador: {
          plantilla: { celda: 'F2', texto: '=___*___', copiar: 'F15' },
          instrucciones: ['Completa la fórmula del importe con las celdas de cantidad (D2) y precio (E2), escríbela en F2 y cópiala hasta F15.', 'En I2 a I6 escribe: <code>=SUMA(F2:F15)</code>, <code>=PROMEDIO(F2:F15)</code>, <code>=MAX(F2:F15)</code>, <code>=MIN(F2:F15)</code>, <code>=CONTAR(F2:F15)</code>.', 'En I10 escribe <code>=I9-(I8+I2)</code>.'],
        },
        experto: {
          hoja: { hojas: [hojaCorte({ H11: 'IVA incluido en las ventas' })], herramientas: ['portapapeles', 'edicion'] },
          solucion: Object.assign({}, solucion, { I11: '=I2-I2/1.16' }),
          pruebasExtra: [
            { tipo: 'formula', rango: 'I11', titulo: 'IVA incluido calculado', mensaje: 'Falta I11: calcula el IVA incluido en las ventas.' },
            { tipo: 'valores', rango: 'I11', titulo: 'IVA incluido correcto', mensaje: 'I11 muestra {obtenido}; el IVA incluido es {esperado}. Los precios ya traen 16 % de IVA: ventas − ventas/1.16.' },
            { tipo: 'robustez', cambios: { D3: 10 }, rango: 'I11', titulo: 'El IVA se recalcula', mensaje: 'Si cambian las ventas, I11 no se actualiza: usa I2 en tu fórmula.' },
          ],
          instrucciones: ['Resuelve F2:F15, I2:I6 e I10 como en el nivel Analista.', 'En <b>I11</b>, en una sola fórmula, calcula cuánto de lo vendido es IVA. Los precios ya incluyen 16 % de IVA.'],
          pistas: ['Si un precio con IVA es P, el precio sin IVA es P/1.16.', 'IVA = total − total sin IVA.', '<code>=I2-I2/1.16</code> (la división se hace antes que la resta).'],
        },
      },
    },
    lab: {
      archivo: 'lab03-corte-caja.xlsx', titulo: 'Corte de caja de la sucursal Norte',
      contexto: 'El libro tiene el corte de otro día, en la sucursal Norte, con la misma estructura.',
      pasos: {
        explorador: [{ texto: 'En F2 escribe <code>=D2*E2</code> y cópiala hasta la última fila de tickets.' }, { texto: 'En I2 a I6 usa SUMA, PROMEDIO, MAX, MIN y CONTAR sobre la columna F.', ruta: ['Inicio', 'Autosuma', 'Suma'] }, 'En I10 calcula <code>=I9-(I8+I2)</code>.', 'Guarda y sube el libro.'],
        analista: ['Calcula los importes en la columna F.', 'Completa el resumen I2:I6 con funciones.', 'Calcula la diferencia de caja en I10.', 'Guarda y sube el libro.'],
        experto: ['Resuelve el corte como en el nivel Analista.', 'En I11 calcula el IVA incluido en las ventas (precios con 16 % de IVA) en una sola fórmula.', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { titulo: 'Importes con fórmula y correctos', fn: (L, A) => {
          A.hoja('Corte');
          let n = 0;
          for (let r = 2; r <= 40; r++) {
            const cant = A.num(L.valor('Corte', 'D' + r)), precio = A.num(L.valor('Corte', 'E' + r));
            if (cant == null || precio == null) break;
            n++;
            if (!L.tieneFormula('Corte', 'F' + r)) return 'F' + r + ' no tiene fórmula.';
            if (!A.cerca(A.num(L.valor('Corte', 'F' + r)), cant * precio)) return 'F' + r + ' debería ser ' + A.fmtEs(cant * precio) + '.';
          }
          return n ? true : 'No encontré los tickets en la hoja Corte.';
        } },
        { titulo: 'Resumen con SUMA, PROMEDIO, MAX, MIN y CONTAR', fn: (L, A) => {
          const imp = [];
          for (let r = 2; r <= 40; r++) { const v = A.num(L.valor('Corte', 'F' + r)); if (v == null) break; imp.push(v); }
          const esp = { I2: ['SUM', imp.reduce((a, b) => a + b, 0)], I3: ['AVERAGE', imp.reduce((a, b) => a + b, 0) / imp.length], I4: ['MAX', Math.max(...imp)], I5: ['MIN', Math.min(...imp)], I6: ['COUNT', imp.length] };
          const es = { SUM: 'SUMA', AVERAGE: 'PROMEDIO', MAX: 'MAX', MIN: 'MIN', COUNT: 'CONTAR' };
          for (const [d, [fn, v]] of Object.entries(esp)) {
            if (!L.usaFuncion('Corte', d, fn === 'COUNT' ? ['COUNT', 'COUNTA'] : fn)) return d + ' debe usar ' + es[fn] + '.';
            if (!A.cerca(A.num(L.valor('Corte', d)), v)) return d + ' muestra ' + A.fmtEs(L.valor('Corte', d)) + '; debería ser ' + A.fmtEs(v) + '.';
          }
          return true;
        } },
        { titulo: 'Diferencia de caja (I10)', fn: (L, A) => {
          if (!L.tieneFormula('Corte', 'I10')) return 'I10 debe tener una fórmula.';
          const e = A.num(L.valor('Corte', 'I9')) - (A.num(L.valor('Corte', 'I8')) + A.num(L.valor('Corte', 'I2')));
          return A.cerca(A.num(L.valor('Corte', 'I10')), e) ? true : 'I10 muestra ' + A.fmtEs(L.valor('Corte', 'I10')) + '; la diferencia es ' + A.fmtEs(e) + '. ¿Usaste paréntesis?';
        } },
        { titulo: 'IVA incluido (I11)', nivel: 'experto', fn: (L, A) => {
          if (!L.tieneFormula('Corte', 'I11')) return 'I11 debe tener una fórmula.';
          const t = A.num(L.valor('Corte', 'I2'));
          return A.cerca(A.num(L.valor('Corte', 'I11')), t - t / 1.16) ? true : 'I11 debería ser ' + A.fmtEs(t - t / 1.16) + ' (total − total/1.16).';
        } },
      ],
    },
    donde: [
      { comando: 'Autosuma', ruta: ['Inicio', 'Autosuma', 'Suma'], nota: 'Atajo: Alt+=. También está en Fórmulas › Autosuma.' },
      { comando: 'Promedio (desde Autosuma)', ruta: ['Inicio', 'Autosuma', 'Promedio'] },
      { comando: 'Insertar función', ruta: ['Fórmulas', 'Insertar función'] },
    ],
    glosario: ['SUMA', 'PROMEDIO', 'MAX', 'MIN', 'CONTAR', 'CONTARA'],
    atajos: ['<kbd>Alt+=</kbd> Autosuma', 'Escribe <kbd>=</kbd> y haz clic en una celda para insertar su referencia (modo Señalar).', 'Doble clic en el controlador de relleno: copia la fórmula hasta el final de los datos.'],
  });
})();
