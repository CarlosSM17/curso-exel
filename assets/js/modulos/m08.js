/* Módulo 8 · Fórmulas intermedias */
(function () {
  const { D, ENC } = LT.caso;
  const emp = D.empleados;
  const datosVentas = [['Vendedor', 'Sucursal', 'Ventas del mes', 'Comisión', 'Meta mensual', 10000], ...emp.map((e, i) => [e.nombre, e.sucursal, e.ventasMes, '', i === 0 ? 'Tasa de comisión' : i === 2 ? 'Alcanzaron la meta' : '', i === 0 ? '5%' : ''])];
  const hojaVentas = (extra) => ({
    nombre: 'Ventas', datos: datosVentas,
    formatos: { 'C2:C21': '$#,##0', 'D2:D21': '$#,##0.00', F1: '$#,##0', F2: '0%', H1: '$#,##0', H2: '0%' },
    estilos: { 'A1:D1': ENC, 'E1:E4': { b: true } }, anchos: { A: 140, B: 82, C: 110, D: 100, E: 150, F: 86, G: 90, H: 80 },
    objetivo: 'D2:D21,F4', inmovilizar: { filas: 1 }, celdas: extra || {},
  });
  const pruebasBase = (conOro) => [
    { tipo: 'formula', rango: 'D2:D21', mensaje: '{celda} tiene un número escrito; usa una fórmula para que se actualice sola.', mensajeVacia: '{celda} está vacía: calcula la comisión de cada vendedor (copia la fórmula hasta D21).', titulo: 'Las comisiones D2:D21 son fórmulas' },
    { tipo: 'valores', rango: 'D2:D21', mensaje: '{celda} muestra {obtenido}, pero se esperaba {esperado}: revisa la comparación (¿>= incluye a quien llega exacto a la meta?).', titulo: 'Las comisiones son correctas' },
    { tipo: 'formula', rango: 'F4', mensaje: 'F4 tiene un número escrito: cuenta con una fórmula para que cambie si cambian las ventas.', mensajeVacia: 'Falta F4: cuenta cuántos vendedores alcanzaron la meta.', titulo: 'F4 usa una fórmula' },
    { tipo: 'valores', rango: 'F4', mensaje: 'F4 muestra {obtenido}, pero {esperado} vendedores alcanzaron la meta.', titulo: 'F4 cuenta bien a quienes alcanzaron la meta' },
    { tipo: 'usa', rango: 'F4', funciones: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'], alguna: true, mensaje: 'Para contar con una condición usa CONTAR.SI en F4.', titulo: 'F4 usa CONTAR.SI' },
    { tipo: 'robustez', cambios: conOro ? [{ F1: 8000, F2: 0.07 }, { H1: 13000, H2: 0.09 }] : { F1: 8000, F2: 0.07 }, rango: 'D2:D21,F4', mensaje: conOro ? 'Al cambiar las metas y las tasas, {celda} no se actualizó: ¿fijaste F1, F2, H1 y H2 con signos de pesos?' : 'Al cambiar la meta a 8,000 y la tasa a 7 %, {celda} no se actualizó: ¿fijaste F2 (y F1) con signos de pesos?', titulo: 'Resiste cambios de meta y tasa (referencias absolutas)' },
  ];

  LT.definirModulo({
    id: 8,
    objetivo: 'Usar referencias absolutas, rangos con nombre, SI, Y, O, CONTAR.SI, SUMAR.SI y funciones de texto y fecha.',
    situacion: 'Necesito saber <b>cuánto pagar de comisión este mes</b> y <b>cuántos vendedores alcanzaron la meta</b>. La meta es de $10,000 y la comisión es del 5 % de las ventas para quien la alcance.',
    explicacion: [
      { html: '<h3>Referencias que se mueven y referencias fijas</h3><p>Cuando copias una fórmula, Excel ajusta sus referencias: <code>=C2*F2</code> copiada una fila abajo se convierte en <code>=C3*F3</code>. Eso es útil para C (cada vendedor tiene sus ventas), pero no para F2: la tasa está en una sola celda. Para fijarla se usan signos de pesos: <code>$F$2</code>. Al escribir la fórmula, pon el cursor en la referencia y pulsa <kbd>F4</kbd>: <code>F2 → $F$2 → F$2 → $F2</code>.</p>' },
      { widget: 'copiarReferencias', titulo: 'Pruébalo: copia la comisión hacia abajo', instr: 'La fórmula de D2 multiplica las ventas por la tasa, que está en F1. Cambia el tipo de referencia de F1 y observa qué pasa al copiarla hasta D6. Pasa el cursor sobre cada fila para ver a qué celdas apunta.', opts: { datos: [['Vendedor', 'Sucursal', 'Ventas', 'Comisión', 'Tasa', 0.05], ...emp.slice(0, 5).map((e) => [e.nombre, e.sucursal, e.ventasMes])], formula: '=C2*F1', celda: 'D2', hasta: 'D6', formatos: { 2: '$#,##0', 5: '0%' }, valorCorrecto: (r) => emp[r - 1].ventasMes * 0.05, formatoResultado: '$#,##0.00', instruccion: '' } },
      { html: '<h3>Decidir con SI, Y, O</h3><ul><li><code>=SI(prueba, valor_si_verdadero, valor_si_falso)</code>: elige entre dos resultados. Ejemplo: <code>=SI(C2&gt;=$F$1, C2*$F$2, 0)</code>.</li><li><code>Y(…)</code> es verdadero si <b>todas</b> las condiciones se cumplen; <code>O(…)</code> si se cumple <b>al menos una</b>: <code>=SI(Y(C2&gt;=10000, B2="Centro"), "Bono", "")</code>.</li></ul><h3>Contar y sumar con condición</h3><ul><li><code>=CONTAR.SI(C2:C21, "&gt;="&amp;F1)</code> cuenta las ventas mayores o iguales a la meta. El <code>&amp;</code> une el operador con el valor de la celda.</li><li><code>=SUMAR.SI(B2:B21, "Centro", D2:D21)</code> suma las comisiones de Centro; <code>PROMEDIO.SI</code> funciona igual.</li></ul><h3>Rangos con nombre, texto y fecha</h3><p>Selecciona F1, escribe <b>Meta</b> en el cuadro de nombres (a la izquierda de la barra de fórmulas) y pulsa Enter: ahora puedes escribir <code>=C2&gt;=Meta</code>. Para textos: <code>CONCAT</code> une textos; para fechas: <code>HOY()</code>, <code>AÑO()</code>, <code>MES()</code>; <code>REDONDEAR(número, decimales)</code> redondea.</p>' },
    ],
    ejemplo: {
      titulo: 'Comisión de Andrea Solís',
      hoja: { hojas: [Object.assign(hojaVentas(), { objetivo: null, filas: 10 })], altura: 200 },
      celda: 'D2', formula: '=SI(C2>=$F$1, C2*$F$2, 0)',
      pregunta: '¿Cuánto mostrará D2?', respuesta: emp[0].ventasMes * 0.05, formato: '$#,##0.00',
      explicacion: [
        'La prueba es <code>C2&gt;=$F$1</code>: ¿' + LT.u.formatoMiles(emp[0].ventasMes) + ' es mayor o igual que 10,000? <b>Sí</b>, es VERDADERO.',
        'Como la prueba es verdadera, SI devuelve el segundo argumento: <code>C2*$F$2</code> = ' + LT.u.formatoMiles(emp[0].ventasMes) + ' × 5 % = <b>$' + LT.u.formatoMiles(emp[0].ventasMes * 0.05, 2) + '</b>.',
        'Si las ventas fueran menores, devolvería el tercer argumento: <b>0</b>.',
        'Los signos de pesos en <code>$F$1</code> y <code>$F$2</code> hacen que, al copiar la fórmula hacia abajo, todas las filas usen la misma meta y la misma tasa.',
      ],
    },
    micro: [
      {
        titulo: 'Fija la referencia', tipo: 'widget',
        enunciado: 'El precio con IVA se calcula con <code>=B2*(1+F1)</code>, pero al copiarlo hacia abajo deja de funcionar. Cambia el tipo de referencia de F1 hasta que todas las filas den el resultado correcto.',
        crear: (c, listo) => LT.widgets.copiarReferencias(c, { datos: [['Producto', 'Precio', 'Con IVA', '', 'IVA', 0.16], ...D.productos.slice(0, 5).map((p) => [p.nombre, p.precio])], formula: '=B2*(1+F1)', celda: 'C2', hasta: 'C6', formatos: { 1: '$#,##0', 5: '0%' }, valorCorrecto: (r) => D.productos[r - 1].precio * 1.16, formatoResultado: '$#,##0.00', instruccion: '', alCambiar: (e) => { if (e.todasBien) listo(); } }),
      },
      {
        titulo: 'Rango con nombre', tipo: 'hoja',
        enunciado: 'Selecciona F1, escribe <b>Meta</b> en el cuadro de nombres y pulsa Enter. Después, en D2:D6 escribe una fórmula que muestre «Sí» si las ventas alcanzan la meta y «No» si no, <b>usando el nombre Meta</b>.',
        hoja: { hojas: [{ nombre: 'Ventas', datos: [['Vendedor', 'Sucursal', 'Ventas', '¿Meta?', 'Meta', 10000], ...emp.slice(5, 10).map((e) => [e.nombre, e.sucursal, e.ventasMes])], formatos: { 'C2:C6': '$#,##0', F1: '$#,##0' }, estilos: { 'A1:D1': ENC, E1: { b: true } }, anchos: { A: 140 }, objetivo: 'D2:D6' }], herramientas: ['formulas'] },
        solucion: { 'D2:D6': '=SI(C2>=Meta,"Sí","No")' }, nombresSolucion: { Meta: '=Ventas!$F$1' },
        pruebas: [
          { tipo: 'fn', fn: (x) => (x.estado.nombres.Meta && /\$F\$1$/i.test(x.estado.nombres.Meta) ? true : 'Todavía no existe el nombre «Meta» para F1: selecciona F1, escribe Meta en el cuadro de nombres y pulsa Enter.') },
          { tipo: 'formula', rango: 'D2:D6' },
          { tipo: 'contiene', rango: 'D2:D6', texto: 'META', mensaje: 'En {celda} usa el nombre Meta en lugar de F1.' },
          { tipo: 'valores', rango: 'D2:D6' },
        ],
        pista: ['El cuadro de nombres es la casilla donde normalmente dice «F1».', 'La fórmula de D2 es <code>=SI(C2&gt;=Meta,"Sí","No")</code>; luego cópiala hasta D6.'],
      },
      {
        titulo: 'Sumar y contar con condición', tipo: 'hoja',
        enunciado: 'En F2 calcula el total de ventas de la sucursal <b>Centro</b> y en F3 cuenta cuántos vendedores trabajan en <b>Norte</b>.',
        hoja: { hojas: [{ nombre: 'Ventas', datos: [['Vendedor', 'Sucursal', 'Ventas'], ...emp.map((e) => [e.nombre, e.sucursal, e.ventasMes])], celdas: { E2: 'Ventas de Centro', E3: 'Vendedores de Norte' }, formatos: { 'C2:C21': '$#,##0', F2: '$#,##0' }, estilos: { 'A1:C1': ENC, 'E2:E3': { b: true } }, anchos: { A: 140, E: 160 }, objetivo: 'F2:F3' }], herramientas: ['formulas'] },
        solucion: { F2: '=SUMAR.SI(B2:B21,"Centro",C2:C21)', F3: '=CONTAR.SI(B2:B21,"Norte")' },
        pruebas: [
          { tipo: 'usa', rango: 'F2', funciones: ['SUMAR.SI', 'SUMAR.SI.CONJUNTO'], alguna: true, mensaje: 'En F2 usa SUMAR.SI.' },
          { tipo: 'valores', rango: 'F2', mensaje: 'F2 muestra {obtenido}; las ventas de Centro suman {esperado}. Revisa el orden: SUMAR.SI(rango_criterio, criterio, rango_suma).' },
          { tipo: 'usa', rango: 'F3', funciones: ['CONTAR.SI', 'CONTAR.SI.CONJUNTO'], alguna: true, mensaje: 'En F3 usa CONTAR.SI.' },
          { tipo: 'valores', rango: 'F3', mensaje: 'F3 muestra {obtenido}, pero en Norte hay {esperado} vendedores.' },
        ],
        pista: ['<code>=SUMAR.SI(B2:B21,"Centro",C2:C21)</code>', '<code>=CONTAR.SI(B2:B21,"Norte")</code>'],
      },
      {
        titulo: 'Texto y fecha', tipo: 'hoja',
        enunciado: 'En D2:D6 une el nombre y la sucursal así: «Andrea Solís - Centro» (usa CONCAT). En E2:E6 obtén el año de ingreso con AÑO.',
        hoja: { hojas: [{ nombre: 'Equipo', datos: [['Vendedor', 'Sucursal', 'Ingreso', 'Etiqueta', 'Año de ingreso'], ...emp.slice(0, 5).map((e) => [e.nombre, e.sucursal, LT.caso.fecha(e.ingreso)])], estilos: { 'A1:E1': ENC }, anchos: { A: 140, D: 190, E: 110 }, objetivo: 'D2:E6' }], herramientas: ['formulas'] },
        solucion: { 'D2:D6': '=CONCAT(A2," - ",B2)', 'E2:E6': '=AÑO(C2)' },
        pruebas: [{ tipo: 'formula', rango: 'D2:E6' }, { tipo: 'valores', rango: 'D2:D6', mensaje: '{celda} muestra {obtenido}; debería ser {esperado} (¿pusiste el texto " - " entre comillas?).' }, { tipo: 'valores', rango: 'E2:E6' }],
        pista: ['<code>=CONCAT(A2," - ",B2)</code>', '<code>=AÑO(C2)</code>'],
      },
    ],
    reto: {
      titulo: 'Comisiones de los vendedores', tipo: 'hoja',
      intro: 'En la hoja <i>Ventas</i>, la columna A tiene 20 vendedores (filas 2 a 21), B la sucursal y C las ventas del mes. En F1 está la meta mensual y en F2 la tasa de comisión.',
      base: {
        hoja: { hojas: [hojaVentas()], herramientas: ['portapapeles', 'formulas'] },
        solucion: { 'D2:D21': '=SI(C2>=$F$1, C2*$F$2, 0)', F4: '=CONTAR.SI(C2:C21, ">="&F1)' },
        pruebas: pruebasBase(false),
        instrucciones: ['En <b>D2</b>, calcula la comisión: si las ventas alcanzan la meta, ventas × tasa; si no, 0. Cópiala hasta <b>D21</b>.', 'En <b>F4</b>, cuenta cuántos vendedores alcanzaron la meta.'],
        pistas: ['Necesitas una función que elija entre dos resultados.', 'Su forma es <code>=SI(prueba, valor_si_verdadero, valor_si_falso)</code>; para contar con condición: <code>=CONTAR.SI(rango, criterio)</code>.', 'Al copiar hacia abajo, F1 se vuelve F2, F3…: fíjala con <code>$F$1</code> (tecla F4). En F4: <code>=CONTAR.SI(C2:C21, "&gt;="&amp;F1)</code>.'],
      },
      niveles: {
        explorador: {
          plantilla: { celda: 'D2', texto: '=SI(C2>=___, C2*___, 0)', copiar: 'D21' },
          instrucciones: ['Completa los huecos de la fórmula: la meta está en <b>F1</b> y la tasa en <b>F2</b>. Usa <b>$</b> para fijarlas (por ejemplo <code>$F$1</code>).', 'Pulsa «Escribir en D2» y copia D2 hasta D21 arrastrando el cuadrito verde (controlador de relleno).', 'En <b>F4</b> escribe <code>=CONTAR.SI(C2:C21, "&gt;="&amp;F1)</code>.'],
        },
        experto: {
          hoja: { hojas: [hojaVentas({ G1: 'Meta oro', H1: '15000', G2: 'Tasa oro', H2: '8%' })], herramientas: ['portapapeles', 'formulas'] },
          solucion: { 'D2:D21': '=SI(C2>=$H$1, C2*$H$2, SI(C2>=$F$1, C2*$F$2, 0))', F4: '=CONTAR.SI(C2:C21, ">="&F1)' },
          pruebas: pruebasBase(true),
          instrucciones: ['Comisión escalonada en <b>D2:D21</b>: 8 % (H2) desde la meta oro de $15,000 (H1); 5 % (F2) desde la meta de F1; 0 si no se alcanza. Resuélvelo con <b>SI anidados</b> en una sola fórmula.', 'En <b>F4</b>, cuenta cuántos vendedores alcanzaron la meta de F1.'],
          pistas: ['Evalúa primero la condición más exigente (la meta oro).', '<code>=SI(prueba1, valor1, SI(prueba2, valor2, 0))</code>', '<code>=SI(C2&gt;=$H$1, C2*$H$2, SI(C2&gt;=$F$1, C2*$F$2, 0))</code>'],
        },
      },
    },
    lab: {
      archivo: 'lab08-comisiones.xlsx', titulo: 'Comisiones de noviembre',
      contexto: 'El mismo cálculo con las ventas de noviembre, y un resumen de comisiones por sucursal.',
      pasos: {
        explorador: [
          { texto: 'En la hoja <b>Ventas</b>, escribe en D2 <code>=SI(C2&gt;=$F$1, C2*$F$2, 0)</code> y cópiala hasta D21.' },
          { texto: 'En F4 escribe <code>=CONTAR.SI(C2:C21, "&gt;="&amp;F1)</code>.' },
          { texto: 'En F8, F9 y F10 suma las comisiones de Centro, Norte y Sur: <code>=SUMAR.SI($B$2:$B$21, E8, $D$2:$D$21)</code> y cópiala.', ruta: ['Fórmulas', 'Insertar función'] },
          'Guarda el libro (Ctrl+G) y súbelo aquí.',
        ],
        analista: ['En <b>D2:D21</b>, calcula la comisión de cada vendedor (meta en F1, tasa en F2).', 'En <b>F4</b>, cuenta cuántos alcanzaron la meta.', 'En <b>F8:F10</b>, suma las comisiones por sucursal con SUMAR.SI.', 'Guarda y sube el libro.'],
        experto: ['Resuelve D2:D21, F4 y F8:F10 como en el nivel Analista.', 'Asigna el nombre <b>Meta</b> a F1 y úsalo en las fórmulas de la columna D.', 'En <b>G8:G10</b>, calcula el promedio de ventas de cada sucursal con PROMEDIO.SI.', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { titulo: 'D2:D21 tiene fórmulas', fn: (L, A) => { A.hoja('Ventas'); const x = A.sinFormula('Ventas', 'D2:D21'); return x ? x.dir + ' no tiene fórmula: calcula la comisión con SI.' : true; } },
        { titulo: 'Las comisiones son correctas', fn: (L, A) => {
          const meta = A.num(L.valor('Ventas', 'F1')), tasa = A.num(L.valor('Ventas', 'F2'));
          const mal = A.valoresMal('Ventas', 'D2:D21', (d, r) => { const v = A.num(L.valor('Ventas', 'C' + (r + 1))); return v >= meta ? v * tasa : 0; });
          return mal ? mal.dir + ' muestra ' + A.fmtEs(mal.v) + ' y debería ser ' + A.fmtEs(mal.e) + '.' : true;
        } },
        { titulo: 'F4 cuenta con CONTAR.SI', fn: (L, A) => {
          const meta = A.num(L.valor('Ventas', 'F1'));
          const n = L.celdasRango('C2:C21').filter((x) => A.num(L.valor('Ventas', x.dir)) >= meta).length;
          if (!L.usaFuncion('Ventas', 'F4', ['COUNTIF', 'COUNTIFS'])) return 'F4 debe usar CONTAR.SI.';
          return A.cerca(A.num(L.valor('Ventas', 'F4')), n) ? true : 'F4 muestra ' + A.fmtEs(L.valor('Ventas', 'F4')) + ', pero ' + n + ' vendedores alcanzaron la meta.';
        } },
        { titulo: 'Las fórmulas resisten cambios de meta y tasa', fn: (L, A) => {
          const v = A.conCambios({ 'Ventas!F1': 8000, 'Ventas!F2': 0.07 });
          let msg = true;
          for (const x of L.celdasRango('D2:D21')) {
            const c = A.num(v('Ventas', 'C' + (x.r + 1))), e = c >= 8000 ? c * 0.07 : 0;
            if (!A.cerca(A.num(v('Ventas', x.dir)), e)) { msg = 'Si la meta cambia a 8,000 y la tasa a 7 %, ' + x.dir + ' no se actualiza bien: ¿fijaste F1 y F2 con $?'; break; }
          }
          v.restaurar();
          return msg;
        } },
        { titulo: 'Comisiones por sucursal (F8:F10)', fn: (L, A) => {
          for (const r of [8, 9, 10]) {
            const suc = L.valor('Ventas', 'E' + r);
            const esp = L.celdasRango('D2:D21').filter((x) => L.valor('Ventas', 'B' + (x.r + 1)) === suc).reduce((s, x) => s + (A.num(L.valor('Ventas', x.dir)) || 0), 0);
            if (!L.usaFuncion('Ventas', 'F' + r, ['SUMIF', 'SUMIFS'])) return 'F' + r + ' debe usar SUMAR.SI.';
            if (!A.cerca(A.num(L.valor('Ventas', 'F' + r)), esp)) return 'F' + r + ' (' + suc + ') muestra ' + A.fmtEs(L.valor('Ventas', 'F' + r)) + '; debería ser ' + A.fmtEs(esp) + '.';
          }
          return true;
        } },
        { titulo: 'Nombre «Meta» definido y usado', nivel: 'experto', fn: (L) => {
          const n = L.nombre('Meta');
          if (!n || !/\$F\$1$/i.test(n.ref)) return 'Asigna el nombre Meta a la celda F1.';
          return /META/i.test(L.formula('Ventas', 'D2') || '') ? true : 'Usa el nombre Meta en la fórmula de D2.';
        } },
        { titulo: 'Promedio de ventas por sucursal (G8:G10)', nivel: 'experto', fn: (L, A) => {
          for (const r of [8, 9, 10]) {
            const suc = L.valor('Ventas', 'E' + r);
            const vals = L.celdasRango('C2:C21').filter((x) => L.valor('Ventas', 'B' + (x.r + 1)) === suc).map((x) => A.num(L.valor('Ventas', x.dir)));
            const esp = vals.reduce((a, b) => a + b, 0) / vals.length;
            if (!L.usaFuncion('Ventas', 'G' + r, ['AVERAGEIF', 'AVERAGEIFS'])) return 'G' + r + ' debe usar PROMEDIO.SI.';
            if (!A.cerca(A.num(L.valor('Ventas', 'G' + r)), esp)) return 'G' + r + ' (' + suc + ') debería ser ' + A.fmtEs(esp) + '.';
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
    glosario: ['SI', 'Y', 'O', 'CONTAR.SI', 'SUMAR.SI', 'PROMEDIO.SI', 'HOY', 'AÑO', 'CONCAT', 'REDONDEAR'],
    atajos: ['<kbd>F4</kbd> mientras escribes una referencia: alterna A1 → $A$1 → A$1 → $A1.', 'Escribe el nombre en el cuadro de nombres y pulsa <kbd>Enter</kbd> para crear un rango con nombre.'],
  });
})();
