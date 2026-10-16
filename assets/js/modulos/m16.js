/* Módulo 16 · Formato avanzado */
(function () {
  const { D, ENC, fecha, serial } = LT.caso;
  const F = LT.formato;
  const ped = D.pedidos;
  const CORTE = serial(D.fechaCorte);
  const datos = [['Folio', 'Fecha', 'Cliente', 'Sucursal', 'Producto', 'Cantidad', 'Importe', 'Compromiso', 'Estado'], ...ped.map((p) => [p.folio, fecha(p.fecha), p.cliente, p.sucursal, p.producto, p.cantidad, p.cantidad * p.precio, fecha(p.compromiso), p.estado])];
  const hojaPed = () => ({ hojas: [{ nombre: 'Pedidos', datos, celdas: { K1: 'Fecha de corte', L1: fecha(D.fechaCorte) }, formatos: { 'G2:G41': '$#,##0' }, estilos: { 'A1:I1': ENC, K1: { b: true } }, anchos: { A: 70, B: 86, C: 170, D: 70, E: 140, F: 74, G: 80, H: 92, I: 84, J: 20, K: 110, L: 90 }, inmovilizar: { filas: 1 } }], herramientas: ['numero', 'estilos'], altura: 420 });
  const k = (r, c) => r + ',' + c;
  const atrasado = (p, corte) => p.estado === 'Pendiente' && serial(p.compromiso) < corte;
  const porVencer = (p, corte) => p.estado === 'Pendiente' && serial(p.compromiso) >= corte && serial(p.compromiso) <= corte + 3;
  const evaluarCon = (x, corte) => {
    const hf = x.hoja.hf, sid = x.hoja.idHoja(0);
    const prev = hf.getCellSerialized({ sheet: sid, row: 0, col: 11 });
    hf.setCellContents({ sheet: sid, row: 0, col: 11 }, [[corte]]);
    const cf = x.hoja._evaluarCondicionales(x.hoja.libro.hojas[0]);
    hf.setCellContents({ sheet: sid, row: 0, col: 11 }, [[prev]]);
    return cf;
  };
  const revisarFilas = (x, corte, debe, color, texto) => {
    const cf = evaluarCon(x, corte);
    for (let i = 0; i < ped.length; i++) {
      const esperado = debe(ped[i], corte);
      for (let c = 0; c < 9; c++) {
        const fx = cf[k(i + 1, c)];
        const tiene = !!(fx && fx.bg && (!color || fx.bg === color));
        if (esperado && !tiene) return 'La fila ' + (i + 2) + ' (' + texto + ') debería resaltarse completa, pero ' + LT.refs.dir(i + 1, c) + ' no lo está. ¿Aplicaste la regla a A2:I41 y fijaste las columnas ($I2, $H2)?';
        if (!esperado && tiene && (!color || color === fx.bg)) return 'La fila ' + (i + 2) + ' se resalta, pero no cumple la condición. Revisa la fórmula (¿usas $L$1 como fecha de corte?).';
      }
    }
    return true;
  };
  const pruebasBase = [
    { tipo: 'estilo', rango: 'A2:A41', titulo: 'Folios con el prefijo PED-', fn: (v, e, x) => F.formatear(2501, e.fmt).texto === 'PED-2501', mensaje: 'El folio de {celda} debe verse como PED-2501: formato personalizado "PED-"0.' },
    { tipo: 'estilo', rango: 'F2:F41', titulo: 'Cantidades con «pzas»', fn: (v, e) => F.formatear(12, e.fmt).texto === '12 pzas', mensaje: 'La cantidad de {celda} debe verse como «12 pzas»: formato 0 "pzas".' },
    { tipo: 'fn', titulo: 'Fila completa de los pedidos atrasados', fn: (x) => revisarFilas(x, CORTE, atrasado, null, 'pendiente y vencida') },
    { tipo: 'fn', titulo: 'La regla usa la fecha de corte (L1)', fn: (x) => { const r = revisarFilas(x, CORTE + 6, atrasado, null, 'con otra fecha de corte'); return r === true ? true : 'Si cambia la fecha de corte en L1, la regla no se actualiza: usa $L$1 en la fórmula en lugar de escribir la fecha.'; } },
  ];

  LT.definirModulo({
    id: 16,
    objetivo: 'Crear formatos de número personalizados y reglas de formato condicional basadas en fórmulas.',
    situacion: 'Necesito ver los <b>pedidos atrasados</b> de un vistazo: la <b>fila completa en rojo</b> si el pedido sigue pendiente y ya pasó su fecha de compromiso. Y que los folios se vean como <b>PED-2501</b>.',
    explicacion: [
      { html: '<h3>Formatos personalizados</h3><p>En Formato de celdas › <b>Personalizada</b> escribes un código. Los más usados:</p><ul><li><code>0</code> dígito obligatorio, <code>#</code> dígito opcional, <code>,</code> separador de miles, <code>.</code> decimales.</li><li>Texto fijo entre comillas: <code>"PED-"0</code> muestra 2501 como PED-2501 (el valor sigue siendo 2501).</li><li>Hasta cuatro secciones separadas por <code>;</code>: positivos; negativos; cero; texto. <code>#,##0;[Rojo]-#,##0;"—"</code>.</li><li>Fechas: <code>dd/mm/aaaa</code>, <code>mmmm</code> (mes con letra), <code>dddd</code> (día de la semana).</li></ul>' },
      { widget: 'laboratorioFormatos', titulo: 'Laboratorio de códigos de formato', instr: 'Escribe un código y mira el resultado con distintos valores.', opts: { codigo: '"PED-"0', valores: [{ v: 2501 }, { v: 12.5 }, { v: -1500 }, { v: 0 }, { v: CORTE, etiqueta: CORTE + ' (fecha de corte)' }, { v: 'Pendiente', etiqueta: '«Pendiente» (texto)' }] } },
      { html: '<h3>Formato condicional con fórmula</h3><p>«Nueva regla › Utilice una fórmula…» acepta cualquier fórmula que dé VERDADERO o FALSO. Se escribe <b>para la primera fila</b> del rango y Excel la ajusta para las demás. Para pintar la <b>fila completa</b>, aplica la regla a todas las columnas (A2:I41) y fija con <code>$</code> la columna que se revisa: <code>=Y($I2="Pendiente",$H2&lt;$L$1)</code>. Así, cada celda de la fila 7 revisa I7 y H7.</p>' },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Resaltar filas completas con una fórmula',
      pasos: ['Selecciona todo el rango de datos sin encabezados: A2:I41.', { texto: 'Inicio › Formato condicional › Nueva regla › Utilice una fórmula que determine las celdas para aplicar formato.', ruta: ['Inicio', 'Formato condicional', 'Nueva regla…'] }, 'Escribe la fórmula para la fila 2: =Y($I2="Pendiente",$H2<$L$1).', 'Formato… › Relleno rojo claro › Aceptar.'],
      pregunta: { texto: 'Aplicas a A2:I41 la regla <code>=$I2="Pendiente"</code>. ¿Qué celda revisa Excel para decidir si pinta <b>C7</b>?', opciones: ['I7', 'C7', 'I2', 'C2'], correcta: 0, explicacion: 'La columna I está fija ($I) y la fila se ajusta: para C7 la regla se evalúa como =$I7="Pendiente". Por eso toda la fila se pinta igual.' },
    },
    micro: [
      { titulo: 'Códigos con texto', tipo: 'widget', enunciado: 'Escribe <b>un</b> código de formato que cumpla los dos retos a la vez.', crear: (c, listo) => LT.widgets.laboratorioFormatos(c, { codigo: '0', valores: [{ v: 7 }, { v: 2501 }], retos: [{ valor: 7, objetivo: 'CAF-007', texto: 'Código de producto' }, { valor: 2501, objetivo: 'CAF-2501', texto: 'Y con cuatro cifras' }], alResolver: (n, t) => { if (n === t) listo(); } }) },
      { titulo: 'Negativos y miles', tipo: 'widget', enunciado: 'Encuentra un código para cada reto (puedes cambiar el código entre uno y otro: cada reto queda resuelto cuando lo logras).', crear: (c, listo) => LT.widgets.laboratorioFormatos(c, { codigo: '#,##0', valores: [{ v: -1500 }, { v: 1500000 }, { v: 0.256 }], retos: [{ valor: -1500, objetivo: '(1,500)', texto: 'Negativo entre paréntesis' }, { valor: 1500000, objetivo: '$1,500k', texto: 'En miles con k' }, { valor: 0.256, objetivo: '25.6%', texto: 'Porcentaje con un decimal' }], alResolver: (n, t) => { if (n === t) listo(); } }) },
    ],
    reto: {
      titulo: 'Resaltar la fila completa de los pedidos atrasados', tipo: 'hoja', intro: 'La hoja <i>Pedidos</i> tiene 40 pedidos. La fecha de corte está en L1.',
      base: {
        hoja: hojaPed(), pruebas: pruebasBase,
        instrucciones: ['Formato personalizado para que los folios (A2:A41) se vean como <b>PED-2501</b>.', 'Formato personalizado para que las cantidades (F2:F41) se vean como <b>12 pzas</b>.', 'Regla de formato condicional con fórmula que pinte la <b>fila completa</b> (A2:I41) cuando el pedido esté <b>Pendiente</b> y su compromiso (H) sea <b>anterior a la fecha de corte</b> (L1).'],
        pistas: ['Los formatos personalizados están en «Más…» (Formato de celdas) › Personalizada. El texto fijo va entre comillas.', 'La regla: Formato condicional › Nueva regla con fórmula, aplicada a A2:I41. Fija las columnas con $ y la fecha de corte con $L$1.', 'Códigos: "PED-"0 y 0 "pzas". Fórmula: =Y($I2="Pendiente",$H2<$L$1).'],
      },
      niveles: {
        explorador: { instrucciones: ['Selecciona A2:A41 › <b>Más…</b> › en «Tipo» escribe <code>"PED-"0</code>.', 'Selecciona F2:F41 › <b>Más…</b> › <code>0 "pzas"</code>.', 'Selecciona A2:I41 › Formato condicional › <b>Nueva regla con fórmula</b> › <code>=Y($I2="Pendiente",$H2&lt;$L$1)</code> › Relleno rojo claro.'] },
        experto: {
          instrucciones: ['Formatos de folio (PED-2501) y cantidad (12 pzas).', 'Fila completa en rojo para los pedidos pendientes y vencidos (compromiso antes de L1).', 'Fila completa en <b>amarillo</b> para los pendientes que vencen entre la fecha de corte y los 3 días siguientes (incluidos).'],
          pruebasExtra: [{ tipo: 'fn', titulo: 'Pedidos por vencer en amarillo', fn: (x) => revisarFilas(x, CORTE, porVencer, '#ffeb9c', 'por vencer') }],
          pistas: ['Necesitas una segunda regla con fórmula sobre el mismo rango.', 'Combina tres condiciones con Y: estado pendiente, compromiso desde L1 y hasta L1+3.', '=Y($I2="Pendiente",$H2>=$L$1,$H2<=$L$1+3) con «Relleno amarillo con texto amarillo oscuro».'],
        },
      },
    },
    lab: {
      archivo: 'lab16-pedidos.xlsx', titulo: 'Pedidos atrasados en Excel',
      contexto: 'Mismo formato de pedidos con otra fecha de corte (en L1).',
      pasos: {
        explorador: [{ texto: 'A2:A41: formato personalizado "PED-"0.', ruta: ['Inicio', 'Formato', 'Formato de celdas…'] }, 'F2:F41: formato personalizado 0 "pzas".', { texto: 'A2:I41: nueva regla con fórmula =Y($I2="Pendiente",$H2<$L$1), relleno rojo.', ruta: ['Inicio', 'Formato condicional', 'Nueva regla…'] }, 'Guarda y sube el libro.'],
        analista: ['Folios como PED-2501, cantidades como 12 pzas y regla con fórmula que pinte la fila completa de los pedidos pendientes y vencidos (respecto a L1).', 'Guarda y sube el libro.'],
        experto: ['Lo del nivel Analista.', 'Segunda regla: fila en amarillo para los pendientes que vencen en los próximos 3 días.', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { titulo: 'Folios con el prefijo PED-', fn: (L, A) => { A.hoja('Pedidos'); const cod = L.estilo('Pedidos', 'A2').numFmt; return F.formatear(A.num(L.valor('Pedidos', 'A2')), F.normalizarCodigo(cod)).texto === 'PED-' + A.num(L.valor('Pedidos', 'A2')) && L.estilo('Pedidos', 'A41').numFmt === cod ? true : 'Aplica a A2:A41 el formato personalizado "PED-"0.'; } },
        { titulo: 'Cantidades con «pzas»', fn: (L, A) => { const cod = L.estilo('Pedidos', 'F2').numFmt; return F.formatear(12, F.normalizarCodigo(cod)).texto === '12 pzas' ? true : 'Aplica a F2:F41 el formato 0 "pzas".'; } },
        { titulo: 'Regla con fórmula en las filas completas', fn: (L, A) => {
          const h = L.hoja('Pedidos');
          const reglas = h.condicionales.filter((x) => x.tipo === 'expression' && A.rangoCubre(x.sqref, 'A2:I41'));
          if (!reglas.length) return 'Falta una regla «Utilice una fórmula…» aplicada a A2:I41 (todas las columnas).';
          const hf = L._motor(), sid = hf.getSheetId(h.nombre);
          const corte = A.num(L.valor('Pedidos', 'L1'));
          const regla = reglas.find((x) => /pendiente/i.test(x.formulas[0] || ''));
          if (!regla) return 'La fórmula de la regla debe revisar el estado «Pendiente».';
          for (let r = 2; r <= 41; r++) {
            const f = '=' + LT.refs.desplazarFormula(regla.formulas[0], r - 2, 0);
            const v = hf.calculateFormula(f, sid);
            const esp = String(L.valor('Pedidos', 'I' + r)) === 'Pendiente' && A.num(L.valor('Pedidos', 'H' + r)) < corte;
            if (!!v !== esp) return 'En la fila ' + r + ' la regla da ' + (v ? 'VERDADERO' : 'FALSO') + ' y debería dar ' + (esp ? 'VERDADERO' : 'FALSO') + '. Revisa la fórmula (fija $I, $H y $L$1).';
          }
          return /\$L\$1/i.test(regla.formulas[0]) ? true : 'Usa la referencia absoluta $L$1 para la fecha de corte.';
        } },
        { titulo: 'Segunda regla (por vencer)', nivel: 'experto', fn: (L, A) => (L.hoja('Pedidos').condicionales.filter((x) => x.tipo === 'expression' && A.rangoCubre(x.sqref, 'A2:I41')).length >= 2 ? true : 'Agrega la segunda regla con fórmula para los pedidos por vencer.') },
      ],
    },
    donde: [
      { comando: 'Formato de celdas (personalizada)', ruta: ['Inicio', 'Formato', 'Formato de celdas…'], nota: 'Atajo: Ctrl+1 › Número › Personalizada.' },
      { comando: 'Nueva regla de formato condicional', ruta: ['Inicio', 'Formato condicional', 'Nueva regla…'] },
      { comando: 'Administrar reglas', ruta: ['Inicio', 'Formato condicional', 'Administrar reglas…'] },
    ],
    glosario: ['Y', 'O', 'HOY', 'ESBLANCO'],
    atajos: ['<kbd>Ctrl+1</kbd> Formato de celdas.', 'En Excel en español el año se escribe «aaaa» en los códigos de fecha.'],
  });
})();
