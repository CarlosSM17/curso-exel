/* Módulo 10 · Formato intermedio */
(function () {
  const { D, ENC } = LT.caso;
  const inv = D.medicamentos;
  const glu = D.glucosa;
  const datosInv = [['Medicamento', 'Unidad', 'Existencia', 'Mínimo', 'Máximo', 'Costo unitario', 'Proveedor', 'Cobertura'], ...inv.map((x, i) => [x.medicamento, x.unidad, x.existencia, x.minimo, x.maximo, x.costo, x.proveedor, '=C' + (i + 2) + '/D' + (i + 2)])];
  const hojaInv = () => ({ hojas: [{ nombre: 'Farmacia', datos: datosInv, formatos: { 'F2:F16': '$#,##0.00', 'H2:H16': '0%' }, anchos: { A: 250, B: 76, C: 84, D: 74, E: 74, F: 100, G: 220, H: 90 }, filas: 19 }], herramientas: ['estilos', 'fuente'], altura: 420 });
  const hojaGlu = () => ({ hojas: [{ nombre: 'Glucosa', datos: [['Paciente', 'Sede', 'Glucosa (mg/dL)'], ...glu.map((p) => [p.paciente, p.sede, p.glucosa])], estilos: { 'A1:C1': ENC }, anchos: { A: 160, C: 120 }, filas: 23, cols: 5 }], herramientas: ['estilos'], altura: 320 });
  const k = (r, c) => r + ',' + c;
  const rojo = (fx) => !!fx && (fx.bg === '#ffc7ce' || fx.fg === '#9c0006' || fx.fg === '#c00000');
  const amarillo = (fx) => !!fx && fx.bg === '#ffeb9c';
  const cubre = (rango, ref) => String(rango).split(',').some((p) => { const g = LT.refs.parseRango(p), o = LT.refs.parseRango(ref); return g && g.r1 <= o.r1 && g.c1 <= o.c1 && g.r2 >= o.r2 && g.c2 >= o.c2; });
  const evaluar = (x) => x.hoja._evaluarCondicionales(x.hoja.libro.hojas[0]);
  const pruebaRojo = { tipo: 'fn', titulo: 'Existencias bajo el mínimo en rojo', fn: (x) => {
    const cf = evaluar(x);
    for (let i = 0; i < inv.length; i++) {
      const bajo = x.valor('C' + (i + 2)) < x.valor('D' + (i + 2));
      if (bajo && !rojo(cf[k(i + 1, 2)])) return 'C' + (i + 2) + ' (' + inv[i].medicamento + ') está bajo el mínimo y no se pinta de rojo.';
      if (!bajo && rojo(cf[k(i + 1, 2)])) return 'C' + (i + 2) + ' no está bajo el mínimo, pero se pinta de rojo: compara con el mínimo de su fila (=$D2).';
    }
    const hf = x.hoja.hf, sid = x.hoja.idHoja(0);
    const fila = inv.findIndex((y) => y.existencia >= y.minimo * 1.5);
    const prev = hf.getCellSerialized({ sheet: sid, row: fila + 1, col: 2 });
    hf.setCellContents({ sheet: sid, row: fila + 1, col: 2 }, [[inv[fila].minimo - 1]]);
    const cf2 = evaluar(x);
    hf.setCellContents({ sheet: sid, row: fila + 1, col: 2 }, [[prev]]);
    return rojo(cf2[k(fila + 1, 2)]) ? true : 'Si la existencia de ' + inv[fila].medicamento + ' bajara del mínimo, no se pintaría: la regla debe comparar con la columna Mínimo (=$D2), no con un número fijo.';
  } };
  const tieneRegla = (x, tipo, ref) => x.estado.hojas[0].condicionales.some((r) => r.tipo === tipo && cubre(r.rango, ref));

  LT.definirModulo({
    id: 10,
    objetivo: 'Aplicar formato condicional (reglas, reglas con referencias, barras de datos, escalas de color e iconos), estilos y temas para detectar alertas de un vistazo.',
    situacion: 'Necesito ver de un vistazo qué medicamentos hay que surtir ya: un <b>semáforo en la farmacia</b>. En rojo lo que está por debajo del mínimo; no podemos quedarnos sin insulina ni sin antibióticos.',
    explicacion: [
      { html: '<h3>Formato que depende del valor</h3><p>El <b>formato condicional</b> (Inicio › Formato condicional) cambia el color de una celda según su valor y se actualiza solo cuando el valor cambia. En salud se usa para alertas: valores fuera de rango, existencias críticas, citas vencidas.</p><ul><li><b>Resaltar reglas de celdas:</b> mayor que, menor que, entre, igual a, texto que contiene, duplicados.</li><li><b>Reglas superiores e inferiores:</b> los 10 mayores, por encima del promedio…</li><li><b>Barras de datos:</b> una barra dentro de la celda, proporcional al valor.</li><li><b>Escalas de color:</b> del rojo al verde según el valor.</li><li><b>Conjuntos de iconos:</b> semáforos, flechas, banderas.</li></ul><p>El valor de una regla puede ser una referencia: aplicada a C2:C16, la regla «menor que <code>=$D2</code>» compara cada existencia con el mínimo <b>de su propia fila</b> (la fila se ajusta, la columna D queda fija).</p><h3>Estilos y temas</h3><p>Los <b>estilos de celda</b> son formatos con nombre (Encabezado 1, Bueno, Malo…). El <b>tema</b> (Disposición de página › Temas) cambia a la vez colores y fuentes de todo el libro: útil para respetar la identidad institucional.</p>' },
      { widget: 'temas', titulo: 'Cambia el tema del reporte', instr: 'Elige un tema y observa cómo cambian juntos colores y fuentes.' },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Regla «menor que» comparando con otra columna',
      pasos: ['Selecciona las existencias, C2:C16.', { texto: 'Inicio › Formato condicional › Resaltar reglas de celdas › Es menor que…', ruta: ['Inicio', 'Formato condicional', 'Resaltar reglas de celdas'] }, 'En el cuadro de valor escribe =$D2 (o haz clic en D2 y quita el $ antes del 2).', 'Elige «Relleno rojo claro con texto rojo oscuro».'],
      pregunta: { texto: 'Aplicas a C2:C16 la regla «Es menor que <code>=$D2</code>». ¿Con qué celda compara Excel la celda <b>C5</b>?', opciones: ['Con D5', 'Con D2', 'Con D16', 'Con C2'], correcta: 0, explicacion: 'La fila de la referencia se ajusta para cada celda: C5 se compara con <b>D5</b>. Si escribieras =$D$2, todas se compararían con D2.' },
    },
    micro: [
      { titulo: 'Barras de datos', tipo: 'hoja', enunciado: 'Agrega <b>barras de datos</b> a las existencias (C2:C16).', hoja: hojaInv(), pruebas: [{ tipo: 'fn', fn: (x) => (tieneRegla(x, 'barras', 'C2:C16') ? true : 'Selecciona C2:C16 › Formato condicional › Barras de datos.') }], pista: ['Selecciona C2:C16 y en «Formato condicional» elige «Barras de datos».'] },
      { titulo: 'Glucosa fuera de rango', tipo: 'hoja', enunciado: 'Resalta en rojo las glucosas <b>mayores a 125 mg/dL</b> (C2:C21).', hoja: hojaGlu(),
        pruebas: [{ tipo: 'fn', fn: (x) => { const cf = evaluar(x); for (let i = 0; i < glu.length; i++) { const alta = glu[i].glucosa > 125; const fx = cf[k(i + 1, 2)]; if (alta !== !!(fx && (fx.bg || fx.fg))) return 'C' + (i + 2) + (alta ? ' es mayor a 125 y no está resaltada.' : ' no es mayor a 125 pero está resaltada (¿usaste «mayor o igual»?).'); } return true; } }],
        pista: ['Selecciona C2:C21 › Formato condicional › Es mayor que… › 125.'] },
      { titulo: 'Temas', tipo: 'opcion', enunciado: 'Cambias el <b>tema</b> del libro de «Office» a otro. ¿Qué cambia?', opciones: ['Los colores y las fuentes del tema en todo el libro (estilos, tablas y gráficos)', 'Solo la celda seleccionada', 'Los valores de las celdas', 'El tamaño de las columnas'], correcta: 0, explicacion: 'El tema define la paleta de colores y las fuentes que usan los estilos, las tablas y los gráficos de todo el libro.' },
    ],
    reto: {
      titulo: 'Semáforo de la farmacia', tipo: 'hoja', intro: 'La hoja <i>Farmacia</i> tiene 15 medicamentos. La columna H (Cobertura) es la existencia dividida entre el mínimo.',
      base: {
        hoja: hojaInv(),
        pruebas: [pruebaRojo,
          { tipo: 'fn', titulo: 'Semáforo de iconos en Cobertura', fn: (x) => (tieneRegla(x, 'iconos', 'H2:H16') ? true : 'Agrega un conjunto de iconos (semáforo) a H2:H16.') },
          { tipo: 'fn', titulo: 'Barras de datos en el costo', fn: (x) => (tieneRegla(x, 'barras', 'F2:F16') ? true : 'Agrega barras de datos a F2:F16.') },
          { tipo: 'estilo', rango: 'A1:H1', prop: 'estilo', valor: 'Encabezado 1', titulo: 'Encabezados con el estilo «Encabezado 1»', mensaje: 'Aplica el estilo de celda «Encabezado 1» a {celda} (y a todo A1:H1).' }],
        instrucciones: ['En las existencias (C2:C16), relleno rojo claro cuando la existencia sea <b>menor que el mínimo de su fila</b>.', 'En Cobertura (H2:H16), un <b>conjunto de iconos</b> tipo semáforo.', 'En Costo unitario (F2:F16), <b>barras de datos</b>.', 'Aplica el estilo de celda <b>Encabezado 1</b> a los encabezados A1:H1.'],
        pistas: ['Cada parte es una regla distinta; selecciona el rango antes de crear la regla.', 'Para comparar con el mínimo de cada fila usa la regla «Es menor que» con el valor =$D2.', 'C2:C16 › Es menor que… › =$D2 › Relleno rojo claro con texto rojo oscuro. H2:H16 › Conjunto de iconos: semáforo. F2:F16 › Barras de datos. A1:H1 › Estilos de celda › Encabezado 1.'],
      },
      niveles: {
        explorador: { instrucciones: ['Selecciona C2:C16 › Formato condicional › <b>Es menor que…</b> › valor <code>=$D2</code> › «Relleno rojo claro con texto rojo oscuro».', 'Selecciona H2:H16 › Formato condicional › <b>Conjunto de iconos: semáforo</b>.', 'Selecciona F2:F16 › Formato condicional › <b>Barras de datos</b>.', 'Selecciona A1:H1 › Estilos de celda › <b>Encabezado 1</b>.'] },
        experto: {
          instrucciones: ['Arma el semáforo del nivel Analista (rojo bajo el mínimo, iconos en Cobertura, barras en Costo y Encabezado 1).', 'Además, en las existencias, <b>relleno amarillo</b> cuando estén entre el mínimo y 1.3 veces el mínimo (incluidos): es la zona de reorden.'],
          pruebasExtra: [{ tipo: 'fn', titulo: 'Existencias en zona de reorden en amarillo', fn: (x) => {
            const cf = evaluar(x);
            for (let i = 0; i < inv.length; i++) {
              const c = x.valor('C' + (i + 2)), d = x.valor('D' + (i + 2));
              const alerta = c >= d && c <= 1.3 * d;
              if (alerta && !amarillo(cf[k(i + 1, 2)])) return 'C' + (i + 2) + ' (' + inv[i].medicamento + ') está entre el mínimo y 1.3 veces el mínimo: debería verse en amarillo.';
              if (!alerta && amarillo(cf[k(i + 1, 2)])) return 'C' + (i + 2) + ' se ve en amarillo, pero no está en la zona de reorden.';
            }
            return true;
          } }],
          pistas: ['Necesitas una segunda regla sobre C2:C16.', 'La regla «Entre…» acepta referencias: =$D2 y =$D2*1.3.', 'C2:C16 › Entre… › =$D2 y =$D2*1.3 › Relleno amarillo con texto amarillo oscuro.'],
        },
      },
    },
    lab: {
      archivo: 'lab10-farmacia.xlsx', titulo: 'Semáforo de la farmacia de la sede Norte',
      contexto: 'Mismo formato de inventario con las existencias de la farmacia de Norte.',
      pasos: {
        explorador: [{ texto: 'C2:C16: Es menor que… =$D2, relleno rojo claro.', ruta: ['Inicio', 'Formato condicional', 'Resaltar reglas de celdas'] }, { texto: 'H2:H16: conjunto de iconos (semáforo).', ruta: ['Inicio', 'Formato condicional', 'Conjuntos de iconos'] }, { texto: 'F2:F16: barras de datos.', ruta: ['Inicio', 'Formato condicional', 'Barras de datos'] }, { texto: 'A1:H1: estilo Encabezado 1.', ruta: ['Inicio', 'Estilos de celda'] }, 'Guarda y sube el libro.'],
        analista: ['Semáforo: rojo bajo el mínimo (C2:C16), iconos en Cobertura (H2:H16), barras en Costo (F2:F16) y Encabezado 1 en A1:H1.', 'Guarda y sube el libro.'],
        experto: ['Lo del nivel Analista.', 'Segunda regla: amarillo entre el mínimo y 1.3 veces el mínimo.', 'Cambia el tema del libro.', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { titulo: 'Regla roja que compara con el mínimo', fn: (L, A) => { const h = A.hoja('Farmacia'); const r = h.condicionales.find((x) => A.rangoCubre(x.sqref, 'C2:C16') && ((x.tipo === 'cellIs' && /less/i.test(x.operador || '') && /D/i.test(x.formulas[0] || '')) || (x.tipo === 'expression' && /</.test(x.formulas[0] || '') && /D/i.test(x.formulas[0] || '')))); return r ? true : 'Falta en C2:C16 una regla «menor que» que compare con la columna D (=$D2).'; } },
        { titulo: 'Iconos en Cobertura', fn: (L, A) => (L.hoja('Farmacia').condicionales.some((x) => x.tipo === 'iconSet' && A.rangoCubre(x.sqref, 'H2:H16')) ? true : 'Agrega un conjunto de iconos a H2:H16.') },
        { titulo: 'Barras de datos en Costo', fn: (L, A) => (L.hoja('Farmacia').condicionales.some((x) => x.tipo === 'dataBar' && A.rangoCubre(x.sqref, 'F2:F16')) ? true : 'Agrega barras de datos a F2:F16.') },
        { titulo: 'Encabezados con estilo Encabezado 1', fn: (L) => { for (const x of L.celdasRango('A1:H1')) if (L.estilo('Farmacia', x.dir).estiloIntegrado !== 16) return x.dir + ' no tiene el estilo Encabezado 1.'; return true; } },
        { titulo: 'Segunda regla (amarillo)', nivel: 'experto', fn: (L, A) => (L.hoja('Farmacia').condicionales.filter((x) => A.rangoCubre(x.sqref, 'C2:C16') && x.tipo !== 'dataBar').length >= 2 ? true : 'Agrega la segunda regla en C2:C16 (entre el mínimo y 1.3 veces el mínimo).') },
        { titulo: 'Tema cambiado', nivel: 'experto', fn: (L) => (L.tema && !/^(office theme|tema de office|office)$/i.test(L.tema.nombre || '') ? true : 'Cambia el tema del libro (Disposición de página › Temas).') },
      ],
    },
    donde: [
      { comando: 'Formato condicional › Resaltar reglas', ruta: ['Inicio', 'Formato condicional', 'Resaltar reglas de celdas'] },
      { comando: 'Conjuntos de iconos', ruta: ['Inicio', 'Formato condicional', 'Conjuntos de iconos'] },
      { comando: 'Administrar reglas', ruta: ['Inicio', 'Formato condicional', 'Administrar reglas…'] },
      { comando: 'Temas', ruta: ['Disposición de página', 'Temas'] },
    ],
    atajos: ['Para editar o reordenar reglas: Formato condicional › Administrar reglas.', 'Copiar formato (brocha) también copia las reglas de formato condicional.'],
  });
})();
