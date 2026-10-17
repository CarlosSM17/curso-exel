/* Widgets de la versión 2: pantalla de Excel, barra de acceso rápido, Autorrecuperación,
   diseño de bases de datos y combinación de correspondencia. */
(function () {
  'use strict';
  const LT = window.LT;
  const { h } = LT.u;
  const W = (LT.widgets = LT.widgets || {});

  /* --------------------------------------------- la pantalla de Excel */
  const PARTES = {
    barraTitulo: ['Barra de título', 'Muestra el nombre del libro y si ya está guardado.'],
    accesoRapido: ['Barra de herramientas de acceso rápido', 'Comandos favoritos siempre visibles (Guardar, Deshacer, Rehacer…). Se personaliza con su flecha.'],
    autoguardado: ['Autoguardado', 'Interruptor que guarda los cambios continuamente cuando el archivo está en OneDrive o SharePoint.'],
    buscar: ['Buscar', 'Escribe lo que quieres hacer («inmovilizar», «gráfico») y Excel te lleva al comando.'],
    archivo: ['Pestaña Archivo', 'Abre la vista Backstage: nuevo, abrir, guardar, imprimir, exportar, información y Opciones (donde se configura la Autorrecuperación).'],
    pestanas: ['Pestañas de la cinta', 'Inicio, Insertar, Fórmulas, Datos, Revisar, Vista…: cada una agrupa comandos de un mismo tipo.'],
    cinta: ['Cinta de opciones', 'Los comandos de Excel organizados en pestañas y grupos.'],
    grupo: ['Grupo de comandos', 'Comandos relacionados (Fuente, Alineación, Número). La flechita de la esquina abre más opciones.'],
    cuadroNombres: ['Cuadro de nombres', 'Muestra la celda activa; sirve para ir a una celda (escribe D10 y Enter) o para nombrar un rango.'],
    insertarFuncion: ['Insertar función (fx)', 'Abre el buscador de funciones con su explicación y argumentos.'],
    barraFormulas: ['Barra de fórmulas', 'Muestra y permite editar el contenido real de la celda activa: la fórmula, no su resultado.'],
    encabezadoColumna: ['Encabezado de columna', 'Las letras A, B, C… Un clic selecciona la columna; arrastrar su borde cambia el ancho.'],
    encabezadoFila: ['Encabezado de fila', 'Los números 1, 2, 3… Un clic selecciona la fila completa.'],
    celdaActiva: ['Celda activa', 'La celda seleccionada, con borde verde. Lo que escribas va ahí.'],
    controlRelleno: ['Controlador de relleno', 'El cuadrito de la esquina de la celda activa: arrástralo para copiar o continuar una serie.'],
    pestanasHojas: ['Pestañas de hojas', 'Cada hoja del libro. El botón + agrega una hoja; doble clic cambia su nombre.'],
    barraEstado: ['Barra de estado', 'Muestra el modo (Listo, Introducir) y la suma, el promedio y el recuento de lo seleccionado.'],
    vistas: ['Vistas del libro', 'Normal, Diseño de página y Vista previa de salto de página.'],
    zoom: ['Zoom', 'Acerca o aleja la hoja sin cambiar los datos ni la impresión.'],
  };
  W.PARTES_EXCEL = PARTES;

  function construirPantalla() {
    const p = (parte, cls, ...hijos) => h('div', { class: cls, dataset: { parte } }, ...hijos);
    const sp = (parte, cls, ...hijos) => h('span', { class: cls, dataset: { parte } }, ...hijos);
    const ico = (n) => h('span', { class: 'px-ico', html: LT.iconoSVG(n, 15) });
    const filas = [['Producto', 'Precio', 'Unidades', 'Ventas'], ['Americano', 40, 230, 9200], ['Capuchino', 52, 245, 12740], ['Latte', 55, 260, 14300], ['Moka', 60, 150, 9000], ['Croissant', 38, 190, 7220]];
    const tabla = h('table', { class: 'px-tabla' });
    const thead = h('tr', null, h('th', { class: 'px-esq' }));
    'ABCDEF'.split('').forEach((l) => thead.appendChild(h('th', { dataset: { parte: 'encabezadoColumna' }, class: l === 'D' ? 'px-sel' : '' }, l)));
    tabla.appendChild(thead);
    for (let r = 0; r < 7; r++) {
      const tr = h('tr', null, h('th', { dataset: { parte: 'encabezadoFila' }, class: r === 3 ? 'px-sel' : '' }, String(r + 1)));
      for (let c = 0; c < 6; c++) {
        const v = filas[r] && filas[r][c];
        const activa = r === 3 && c === 3;
        const td = h('td', activa ? { dataset: { parte: 'celdaActiva' }, class: 'px-activa' } : { class: typeof v === 'number' ? 'n' : '' }, v == null ? '' : typeof v === 'number' ? LT.formato.formatear(v, c === 1 || c === 3 ? '$#,##0' : '#,##0').texto : v);
        if (r === 0) td.style.fontWeight = '700';
        if (activa) td.appendChild(h('span', { class: 'px-asa', dataset: { parte: 'controlRelleno' } }));
        tr.appendChild(td);
      }
      tabla.appendChild(tr);
    }
    return h('div', { class: 'px', role: 'img', 'aria-label': 'Ventana de Excel con sus partes' },
      p('barraTitulo', 'px-titulo',
        p('accesoRapido', 'px-qat', sp('autoguardado', 'px-auto', 'Autoguardado ', h('span', { class: 'px-interruptor' })), ico('hoja'), ico('deshacer'), ico('rehacer'), h('span', { class: 'px-flechita' }, '▾')),
        h('div', { class: 'px-nombre' }, 'Reporte semanal.xlsx · Guardado'),
        p('buscar', 'px-buscar', ico('buscar'), 'Buscar'),
        h('div', { class: 'px-ventana' }, '— ☐ ✕')),
      p('pestanas', 'px-pestanas', sp('archivo', 'px-archivo', 'Archivo'), ...['Inicio', 'Insertar', 'Disposición de página', 'Fórmulas', 'Datos', 'Revisar', 'Vista'].map((t, i) => h('span', { class: i === 0 ? 'on' : '' }, t))),
      p('cinta', 'px-cinta',
        h('div', { class: 'px-grupo' }, h('div', { class: 'px-btns' }, ico('pegar'), ico('cortar'), ico('copiar')), h('div', { class: 'px-gnombre' }, 'Portapapeles')),
        p('grupo', 'px-grupo', h('div', { class: 'px-btns' }, h('b', null, 'N'), h('i', null, 'K'), h('u', null, 'S'), ico('bordes'), ico('relleno')), h('div', { class: 'px-gnombre' }, 'Fuente ⧉')),
        h('div', { class: 'px-grupo' }, h('div', { class: 'px-btns' }, ico('alIzq'), ico('alCen'), ico('alDer'), ico('ajustar')), h('div', { class: 'px-gnombre' }, 'Alineación')),
        h('div', { class: 'px-grupo' }, h('div', { class: 'px-btns' }, h('b', null, '$'), h('b', null, '%'), ico('decMas')), h('div', { class: 'px-gnombre' }, 'Número')),
        h('div', { class: 'px-grupo' }, h('div', { class: 'px-btns' }, ico('condicional'), ico('estilos')), h('div', { class: 'px-gnombre' }, 'Estilos'))),
      h('div', { class: 'px-fx' }, p('cuadroNombres', 'px-cuadro', 'D4'), p('insertarFuncion', 'px-fxbtn', 'fx'), p('barraFormulas', 'px-formula', '=B4*C4')),
      h('div', { class: 'px-cuadricula' }, tabla),
      h('div', { class: 'px-hojas' }, h('span', { class: 'px-flechas' }, '◂ ▸'), sp('pestanasHojas', 'px-hoja on', 'Semana'), h('span', { class: 'px-hoja' }, 'Resumen'), h('span', { class: 'px-hoja' }, '+')),
      p('barraEstado', 'px-estado', h('span', null, 'Listo'), h('span', { class: 'px-calc' }, 'Suma: 14,300'), sp('vistas', 'px-vistas', ico('hoja'), ico('tablaDatos'), ico('ojo')), sp('zoom', 'px-zoom', '−', h('span', { class: 'px-deslizador' }), '+ 100 %')));
  }

  /* opts: {modo:'explorar'|'quiz', preguntas:[parte…], alTerminar(aciertos, total), conPistas} */
  W.pantallaExcel = function (cont, opts) {
    opts = opts || {};
    cont.innerHTML = '';
    const pantalla = construirPantalla();
    const panel = h('div', { class: 'px-panel', 'aria-live': 'polite' });
    const modo = opts.modo || 'explorar';
    const preguntas = opts.preguntas || [];
    let i = 0, aciertos = 0, intentos = 0;
    const encabezado = h('div', { class: 'donde-pregunta' });
    const dibujarPregunta = () => {
      encabezado.innerHTML = '';
      if (modo !== 'quiz') { encabezado.appendChild(h('span', { class: 'q' }, 'Pasa el cursor o haz clic sobre cualquier parte de la ventana.')); return; }
      if (i >= preguntas.length) { encabezado.appendChild(h('span', { class: 'q' }, '¡Listo! Identificaste ' + aciertos + ' de ' + preguntas.length + ' partes al primer intento.')); return; }
      encabezado.append(h('span', { class: 'q' }, 'Haz clic en: «' + PARTES[preguntas[i]][0] + '»'), h('span', { class: 'donde-progreso' }, (i + 1) + ' de ' + preguntas.length));
      if (opts.conPistas) encabezado.appendChild(h('div', { style: { width: '100%', fontSize: '.86rem', color: 'var(--tinta-2)' } }, 'Pista: ' + PARTES[preguntas[i]][1]));
    };
    const marcar = (el, cls) => { el.classList.add(cls); setTimeout(() => el.classList.remove(cls), 900); };
    pantalla.addEventListener('mouseover', (e) => {
      if (modo !== 'explorar') return;
      const el = e.target.closest('[data-parte]');
      pantalla.querySelectorAll('.px-hover').forEach((x) => x.classList.remove('px-hover'));
      if (!el) return;
      el.classList.add('px-hover');
      const [n, d] = PARTES[el.dataset.parte];
      panel.innerHTML = '';
      panel.append(h('b', null, n), h('div', null, d));
    });
    pantalla.addEventListener('click', (e) => {
      const el = e.target.closest('[data-parte]');
      if (!el) return;
      e.preventDefault();
      if (modo === 'explorar') { const [n, d] = PARTES[el.dataset.parte]; panel.innerHTML = ''; panel.append(h('b', null, n), h('div', null, d)); return; }
      if (i >= preguntas.length) return;
      const esperado = preguntas[i];
      // un clic dentro de una parte hija también vale para la parte contenedora
      let ok = false, x = el;
      while (x && pantalla.contains(x)) { if (x.dataset && x.dataset.parte === esperado) { ok = true; break; } x = x.parentElement; }
      panel.innerHTML = '';
      if (ok) {
        marcar(x, 'px-ok');
        if (!intentos) aciertos++;
        panel.append(h('b', null, '✓ ' + PARTES[esperado][0]), h('div', null, PARTES[esperado][1]));
        i++; intentos = 0;
        dibujarPregunta();
        if (i >= preguntas.length && opts.alTerminar) opts.alTerminar(aciertos, preguntas.length);
      } else {
        intentos++;
        marcar(el, 'px-mal');
        panel.append(h('b', null, 'Eso es: ' + PARTES[el.dataset.parte][0]), h('div', null, intentos >= 2 ? 'Pista: ' + PARTES[esperado][1] : 'Vuelve a intentarlo.'));
      }
    });
    cont.append(encabezado, pantalla, panel);
    dibujarPregunta();
    return { estado: () => ({ completado: modo === 'quiz' && i >= preguntas.length, aciertos, total: preguntas.length }) };
  };

  /* ------------------------------ barra de herramientas de acceso rápido */
  const QAT = {
    comunes: [['Autoguardado', 'reloj'], ['Nuevo', 'hoja'], ['Abrir', 'subir'], ['Guardar', 'descargar'], ['Enviar por correo electrónico', 'comentario'], ['Impresión rápida', 'hoja'], ['Vista previa de impresión e Imprimir', 'ojo'], ['Ortografía', 'check'], ['Deshacer', 'deshacer'], ['Rehacer', 'rehacer'], ['Orden ascendente', 'ordenarAZ'], ['Orden descendente', 'ordenarZA'], ['Modo táctil o mouse', 'usuario']],
    mas: [['Autosuma', 'autosuma'], ['Copiar formato', 'brocha'], ['Formato condicional', 'condicional'], ['Formulario…', 'tablaDatos'], ['Filtro', 'filtro'], ['Inmovilizar paneles', 'inmovilizar'], ['Insertar tabla dinámica', 'tablaDatos'], ['Insertar segmentación de datos', 'filtro'], ['Grabar macro', 'grabar'], ['Macros', 'codigo'], ['Pegar valores', 'pegar'], ['Quitar duplicados', 'duplicados'], ['Validación de datos', 'validacion']],
  };
  W.accesoRapido = function (cont, opts) {
    opts = opts || {};
    cont.innerHTML = '';
    const est = { comandos: (opts.inicial || ['Guardar', 'Deshacer', 'Rehacer']).slice(), debajo: false };
    const icono = (n) => ([...QAT.comunes, ...QAT.mas].find((x) => x[0] === n) || [n, 'info'])[1];
    const disponibles = h('select', { size: 12, class: 'qat-lista', 'aria-label': 'Comandos disponibles' });
    const actuales = h('select', { size: 12, class: 'qat-lista', 'aria-label': 'Comandos en la barra de acceso rápido' });
    const fuente = h('select', { class: 'herr-sel', 'aria-label': 'Comandos disponibles en' }, h('option', { value: 'comunes' }, 'Comandos más utilizados'), h('option', { value: 'mas' }, 'Todos los comandos'));
    const debajo = h('input', { type: 'checkbox' });
    const vista = h('div', { class: 'qat-vista' });
    const dibujar = () => {
      disponibles.innerHTML = '';
      QAT[fuente.value].forEach(([n]) => disponibles.appendChild(h('option', { value: n }, n)));
      const sel = actuales.value;
      actuales.innerHTML = '';
      est.comandos.forEach((n) => actuales.appendChild(h('option', { value: n, selected: n === sel ? true : null }, n)));
      vista.innerHTML = '';
      const barra = h('div', { class: 'qat-barra' }, est.comandos.map((n) => h('span', { class: 'qat-ico', title: n, html: LT.iconoSVG(icono(n), 16) })), h('span', { class: 'qat-ico', title: 'Personalizar barra de herramientas de acceso rápido' }, '▾'));
      const titulo = h('div', { class: 'qat-titulo' }, est.debajo ? null : barra, h('span', { class: 'qat-nombre' }, 'Reporte semanal.xlsx – Excel'));
      const cinta = h('div', { class: 'qat-cinta' }, 'Archivo   Inicio   Insertar   Disposición de página   Fórmulas   Datos   Revisar   Vista');
      vista.append(titulo, cinta, est.debajo ? h('div', { class: 'qat-debajo' }, barra) : null);
      if (opts.alCambiar) opts.alCambiar(JSON.parse(JSON.stringify(est)));
    };
    const agregar = () => { const n = disponibles.value; if (n && !est.comandos.includes(n)) { est.comandos.push(n); dibujar(); } };
    const quitar = () => { const n = actuales.value; est.comandos = est.comandos.filter((x) => x !== n); dibujar(); };
    const mover = (d) => { const i = est.comandos.indexOf(actuales.value); const j = i + d; if (i < 0 || j < 0 || j >= est.comandos.length) return; [est.comandos[i], est.comandos[j]] = [est.comandos[j], est.comandos[i]]; dibujar(); };
    fuente.addEventListener('change', dibujar);
    disponibles.addEventListener('dblclick', agregar);
    debajo.addEventListener('change', () => { est.debajo = debajo.checked; dibujar(); });
    cont.append(
      h('div', { class: 'qat-dialogo' },
        h('div', { class: 'qat-dtitulo' }, 'Opciones de Excel › Barra de herramientas de acceso rápido'),
        h('div', { class: 'qat-cuerpo' },
          h('div', null, h('label', null, 'Comandos disponibles en: '), fuente, disponibles),
          h('div', { class: 'qat-botones' }, h('button', { class: 'btn chico', onclick: agregar }, 'Agregar »'), h('button', { class: 'btn chico', onclick: quitar }, '« Quitar'), h('button', { class: 'btn chico', title: 'Subir', 'aria-label': 'Subir', onclick: () => mover(-1) }, '▲'), h('button', { class: 'btn chico', title: 'Bajar', 'aria-label': 'Bajar', onclick: () => mover(1) }, '▼')),
          h('div', null, h('label', null, 'Barra de herramientas de acceso rápido:'), actuales)),
        h('label', { style: { display: 'flex', gap: '6px', alignItems: 'center', fontSize: '.88rem', marginTop: '8px' } }, debajo, 'Mostrar la barra de herramientas de acceso rápido debajo de la cinta de opciones')),
      h('div', { style: { fontWeight: 600, fontSize: '.86rem', margin: '10px 0 4px' } }, 'Así se ve tu Excel:'), vista);
    dibujar();
    return { estado: () => JSON.parse(JSON.stringify(est)) };
  };

  /* ------------------------------------------------- Autorrecuperación */
  W.autorrecuperacion = function (cont, opts) {
    opts = opts || {};
    cont.innerHTML = '';
    const est = Object.assign({ formato: 'xlsx', autoguardarNube: true, autorrecuperacion: true, minutos: 10, conservar: false }, opts.inicial || {});
    const categorias = ['General', 'Fórmulas', 'Datos', 'Revisión', 'Guardar', 'Idioma', 'Accesibilidad', 'Avanzadas', 'Personalizar cinta de opciones', 'Barra de herramientas de acceso rápido', 'Complementos', 'Centro de confianza'];
    let cat = 'General';
    const izq = h('div', { class: 'op-cats' });
    const der = h('div', { class: 'op-contenido' });
    const avisar = () => { if (opts.alCambiar) opts.alCambiar(Object.assign({}, est)); };
    const dibujar = () => {
      izq.innerHTML = '';
      categorias.forEach((c) => izq.appendChild(h('button', { class: c === cat ? 'on' : '', onclick: () => { cat = c; dibujar(); } }, c)));
      der.innerHTML = '';
      if (cat !== 'Guardar') { der.appendChild(h('p', { style: { color: 'var(--tinta-3)' } }, cat === 'General' ? 'Opciones generales para trabajar con Excel. La Autorrecuperación está en otra categoría.' : 'Esta categoría no se usa en este ejercicio.')); return; }
      const chk = (k, txt) => { const c = h('input', { type: 'checkbox', checked: est[k] ? true : null }); c.addEventListener('change', () => { est[k] = c.checked; avisar(); }); return h('label', { class: 'op-fila' }, c, txt); };
      const min = h('input', { type: 'number', min: 1, max: 120, value: est.minutos, style: { width: '64px' } });
      min.addEventListener('input', () => { est.minutos = +min.value; avisar(); });
      const formato = h('select', null, [['xlsx', 'Libro de Excel (*.xlsx)'], ['xlsm', 'Libro de Excel habilitado para macros (*.xlsm)'], ['xls', 'Libro de Excel 97-2003 (*.xls)'], ['csv', 'CSV (delimitado por comas) (*.csv)']].map(([v, t]) => h('option', { value: v, selected: v === est.formato ? true : null }, t)));
      formato.addEventListener('change', () => { est.formato = formato.value; avisar(); });
      const auto = h('input', { type: 'checkbox', checked: est.autorrecuperacion ? true : null });
      auto.addEventListener('change', () => { est.autorrecuperacion = auto.checked; avisar(); });
      der.append(
        h('h4', null, 'Personalice cómo se guardan los libros.'),
        h('div', { class: 'op-seccion' }, 'Guardar libros'),
        h('label', { class: 'op-fila' }, 'Guardar archivos en formato: ', formato),
        chk('autoguardarNube', 'Autoguardar archivos almacenados en la nube de forma predeterminada en Excel'),
        h('label', { class: 'op-fila' }, auto, 'Guardar información de Autorrecuperación cada ', min, ' minutos'),
        h('div', { style: { paddingLeft: '22px' } }, chk('conservar', 'Conservar la última versión autorrecuperada si cierro sin guardar')),
        h('label', { class: 'op-fila' }, 'Ubicación de archivo con Autorrecuperación: ', h('input', { type: 'text', value: 'C:\\Users\\analista\\AppData\\Roaming\\Microsoft\\Excel\\', readonly: true, style: { width: '320px' } })),
        h('p', { style: { fontSize: '.84rem', color: 'var(--tinta-3)' } }, 'Para recuperar: Archivo › Información › Administrar libro › Recuperar libros no guardados.'));
    };
    cont.appendChild(h('div', { class: 'op-dialogo' }, h('div', { class: 'qat-dtitulo' }, 'Opciones de Excel'), h('div', { class: 'op-cuerpo' }, izq, der)));
    dibujar();
    return { estado: () => Object.assign({}, est) };
  };

  /* ------------------------------------------- diseño de bases de datos */
  const PROBLEMAS_BD = {
    titulo: 'Hay un título combinado encima de los datos. La primera fila de una base debe ser la de los encabezados; los títulos van fuera.',
    multiples: 'La columna «Pedido» mezcla cantidad y producto («2 Latte, 1 Moka»). Cada dato va en su propio campo: Cantidad y Producto, un producto por fila.',
    fechas: 'Las fechas están escritas de formas distintas («2-oct», «ayer»). Usa un solo tipo de dato: fechas reales (dd/mm/aaaa).',
    sucursal: 'La sucursal se escribe de varias formas («centro», «CENTRO »). Usa una lista desplegable para capturar siempre igual.',
    filaVacia: 'Hay una fila vacía en medio. Excel la toma como el final de la tabla al ordenar, filtrar o crear tablas dinámicas.',
    subtotal: 'Hay un subtotal dentro de los datos. Los totales se calculan aparte (con tablas dinámicas o fórmulas), no dentro de la base.',
    numeroTexto: 'El importe «264 pesos» es texto: no se puede sumar. Los números van sin unidades; el formato de moneda se aplica después.',
  };
  W.disenoBD = function (cont, opts) {
    opts = opts || {};
    cont.innerHTML = '';
    const minimo = opts.minimo || 6;
    const encontrados = [];
    const filas = [
      [{ v: 'PEDIDOS DE OCTUBRE', p: 'titulo', span: 6, cls: 'bd-titulo' }],
      ['Folio', 'Fecha', 'Cliente', 'Sucursal', 'Pedido', 'Importe'].map((v) => ({ v, enc: true })),
      [{ v: 2501 }, { v: '01/10/2025' }, { v: 'Notaría 14' }, { v: 'Centro' }, { v: '2 Latte, 1 Moka', p: 'multiples' }, { v: 170 }],
      [{ v: 2502 }, { v: '2-oct', p: 'fechas' }, { v: 'Agencia Pixel' }, { v: 'centro', p: 'sucursal' }, { v: '3 Capuchino', p: 'multiples' }, { v: 156 }],
      [{ v: '', p: 'filaVacia' }, { v: '', p: 'filaVacia' }, { v: '', p: 'filaVacia' }, { v: '', p: 'filaVacia' }, { v: '', p: 'filaVacia' }, { v: '', p: 'filaVacia' }],
      [{ v: 2503 }, { v: '03/10/2025' }, { v: 'Coworking Nodo' }, { v: 'CENTRO ', p: 'sucursal' }, { v: '1 Bagel', p: 'multiples' }, { v: 45 }],
      [{ v: '', p: 'subtotal' }, { v: '', p: 'subtotal' }, { v: 'Subtotal Centro', p: 'subtotal' }, { v: '', p: 'subtotal' }, { v: '', p: 'subtotal' }, { v: 371, p: 'subtotal' }],
      [{ v: 2504 }, { v: 'ayer', p: 'fechas' }, { v: 'Colegio Montebello' }, { v: 'Norte' }, { v: '12 Concha', p: 'multiples' }, { v: '264 pesos', p: 'numeroTexto' }],
      [{ v: 2505 }, { v: '05/10/2025' }, { v: 'Notaría 14' }, { v: 'Norte' }, { v: '4 Latte', p: 'multiples' }, { v: 220 }],
    ];
    const t = h('table', { class: 'bd-tabla' });
    t.appendChild(h('tr', null, h('th'), 'ABCDEF'.split('').map((l) => h('th', null, l))));
    const lista = h('ol', { class: 'bd-lista' });
    const retro = h('div', { class: 'retro' });
    filas.forEach((f, r) => {
      const tr = h('tr', null, h('th', null, String(r + 1)));
      f.forEach((c) => {
        const td = h('td', { colspan: c.span || null, class: (c.cls || '') + (c.enc ? ' bd-enc' : '') + (typeof c.v === 'number' ? ' n' : ''), dataset: c.p ? { p: c.p } : {}, tabindex: '0' }, String(c.v));
        td.addEventListener('click', () => {
          retro.innerHTML = '';
          if (!c.p) { retro.appendChild(h('div', { class: 'aviso-caja info' }, c.enc ? 'Los encabezados están bien: uno por columna, sin repetir.' : 'Este dato está bien. Busca otro problema.')); return; }
          if (!encontrados.includes(c.p)) {
            encontrados.push(c.p);
            lista.appendChild(h('li', null, PROBLEMAS_BD[c.p]));
            t.querySelectorAll('[data-p="' + c.p + '"]').forEach((x) => x.classList.add('bd-encontrado'));
          }
          retro.appendChild(h('div', { class: 'aviso-caja ' + (encontrados.length >= minimo ? 'ok' : 'alerta') }, 'Problemas encontrados: ' + encontrados.length + ' de ' + Object.keys(PROBLEMAS_BD).length + (encontrados.length >= minimo ? '. ¡Muy bien! Con esto la base ya se puede corregir.' : '.')));
          if (encontrados.length >= minimo && opts.alListo) opts.alListo(encontrados.length);
        });
        tr.appendChild(td);
      });
      t.appendChild(tr);
    });
    cont.append(h('p', { class: 'instr' }, 'Haz clic en las celdas que tienen un problema de diseño. Encuentra al menos ' + minimo + '.'), h('div', { class: 'tabla-scroll' }, t), retro, h('div', { style: { fontWeight: 600, marginTop: '8px' } }, 'Lo que encontraste:'), lista);
    return { estado: () => ({ encontrados: encontrados.slice() }) };
  };

  /* --------------------------------------- combinar correspondencia */
  W.combinarCorrespondencia = function (cont, opts) {
    opts = opts || {};
    cont.innerHTML = '';
    const registros = opts.registros;
    const CAMPOS = Object.keys(registros[0]);
    const HUECOS = opts.huecos; // [{id, etiqueta, correcto}]
    const est = { tipo: null, destinatarios: false, campos: {}, vista: false, registro: 0, finalizado: null };
    let hueco = HUECOS[0].id;
    const cinta = h('div', { class: 'cc-cinta' });
    const carta = h('div', { class: 'cc-carta' });
    const retro = h('div', { class: 'retro' });
    const lista = h('div', { class: 'cc-lista' });
    const valor = (campo) => { const v = registros[est.registro][campo]; return v == null ? '' : String(v); };
    const menu = (btn, items) => {
      document.querySelectorAll('.cc-menu').forEach((m) => m.remove());
      const m = h('div', { class: 'cc-menu hoja-menu' });
      items.forEach(([t, fn, des]) => m.appendChild(h('div', { class: 'menu-item' + (des ? ' desactivado' : ''), onmousedown: (e) => { e.preventDefault(); if (des) return; m.remove(); fn(); } }, t)));
      const r = btn.getBoundingClientRect(), rc = cont.getBoundingClientRect();
      m.style.position = 'absolute'; m.style.left = r.left - rc.left + 'px'; m.style.top = r.bottom - rc.top + 2 + 'px';
      cont.appendChild(m);
      const cerrar = (ev) => { if (!m.contains(ev.target)) { m.remove(); document.removeEventListener('mousedown', cerrar, true); } };
      setTimeout(() => document.addEventListener('mousedown', cerrar, true), 0);
    };
    const avisar = () => { if (opts.alCambiar) opts.alCambiar(JSON.parse(JSON.stringify(est))); };
    const dibujar = () => {
      cinta.innerHTML = '';
      const b = (txt, ic, fn, des) => { const x = h('button', { class: 'cc-btn', disabled: des ? true : null }, h('span', { html: LT.iconoSVG(ic, 18) }), txt); x.addEventListener('click', () => fn(x)); return x; };
      cinta.append(
        h('div', { class: 'cc-pest' }, 'Archivo   Inicio   Insertar   Diseño   ', h('b', null, 'Correspondencia'), '   Revisar   Vista'),
        h('div', { class: 'cc-botones' },
          b('Iniciar combinación ▾', 'hoja', (x) => menu(x, [['Cartas', () => { est.tipo = 'cartas'; retro.textContent = 'Documento de tipo Cartas.'; dibujar(); avisar(); }], ['Mensajes de correo electrónico', () => { est.tipo = 'correo'; dibujar(); avisar(); }], ['Etiquetas…', () => { est.tipo = 'etiquetas'; dibujar(); avisar(); }]])),
          b('Seleccionar destinatarios ▾', 'usuario', (x) => menu(x, [['Escribir una nueva lista…', () => {}, true], ['Usar una lista existente…', elegirLista]]), !est.tipo),
          b('Insertar campo combinado ▾', 'codigo', (x) => menu(x, CAMPOS.map((c) => [c, () => insertar(c)])), !est.destinatarios),
          b(est.vista ? 'Ver campos' : 'Vista previa de resultados', 'ojo', () => { est.vista = !est.vista; dibujar(); avisar(); }, !est.destinatarios),
          h('span', { class: 'cc-nav' }, h('button', { class: 'btn chico', disabled: !est.vista ? true : null, onclick: () => { est.registro = Math.max(0, est.registro - 1); dibujar(); } }, '◀'), ' ' + (est.registro + 1) + ' de ' + registros.length + ' ', h('button', { class: 'btn chico', disabled: !est.vista ? true : null, onclick: () => { est.registro = Math.min(registros.length - 1, est.registro + 1); dibujar(); } }, '▶')),
          b('Finalizar y combinar ▾', 'check', (x) => menu(x, [['Editar documentos individuales…', () => finalizar('documento')], ['Imprimir documentos…', () => finalizar('imprimir')], ['Enviar mensajes de correo electrónico…', () => finalizar('correo')]]), !est.destinatarios)));
      // carta
      carta.innerHTML = '';
      const pieza = (id) => {
        const asignado = est.campos[id];
        const def = HUECOS.find((x) => x.id === id);
        if (!asignado) return h('button', { class: 'cc-hueco' + (hueco === id ? ' sel' : ''), title: 'Clic para colocar aquí un campo (' + def.etiqueta + ')', onclick: () => { hueco = id; dibujar(); } }, '[' + def.etiqueta + ']');
        if (est.vista) return h('span', { class: 'cc-valor' }, valor(asignado));
        return h('button', { class: 'cc-campo' + (hueco === id ? ' sel' : ''), title: 'Campo combinado; clic para seleccionarlo y cambiarlo', onclick: () => { hueco = id; dibujar(); } }, '«' + asignado + '»');
      };
      for (const linea of opts.plantilla) {
        const p = h('p');
        String(linea).split(/(\{\w+\})/).forEach((parte) => { const m = /^\{(\w+)\}$/.exec(parte); p.appendChild(m ? pieza(m[1]) : document.createTextNode(parte)); });
        carta.appendChild(p);
      }
      lista.innerHTML = '';
      if (est.destinatarios) {
        const t = h('table', { class: 'tabla-sitio', style: { fontSize: '.78rem' } }, h('thead', null, h('tr', null, CAMPOS.map((c) => h('th', null, c)))), h('tbody', null, registros.map((r, i) => h('tr', { style: est.vista && i === est.registro ? { background: '#e2f1e8' } : null }, CAMPOS.map((c) => h('td', null, String(r[c])))))));
        lista.append(h('div', { style: { fontWeight: 600, fontSize: '.84rem' } }, 'Destinatarios: Pedidos La Taza.xlsx › hoja Pedidos'), h('div', { class: 'tabla-scroll' }, t));
      }
    };
    const elegirLista = async () => {
      const hoja = h('select', null, ['Pedidos$', 'Catálogo$', 'Clientes$'].map((x) => h('option', { value: x }, x)));
      const r = await LT.ui.modal({ titulo: 'Seleccionar tabla', cuerpo: h('div', null, h('p', null, 'Archivo: ', h('b', null, 'Pedidos La Taza.xlsx')), h('label', null, 'Hoja'), hoja, h('label', { class: 'en-linea' }, h('input', { type: 'checkbox', checked: true, disabled: true }), 'La primera fila de datos contiene encabezados de columna')), botones: [{ texto: 'Cancelar', valor: null }, { texto: 'Aceptar', primario: true, valor: () => hoja.value }] });
      if (!r) return;
      if (r !== 'Pedidos$') { retro.innerHTML = ''; retro.appendChild(h('div', { class: 'aviso-caja alerta' }, 'Esa hoja no tiene los datos de los pedidos: elige «Pedidos$».')); return; }
      est.destinatarios = true;
      retro.textContent = 'Lista de destinatarios conectada: ' + registros.length + ' pedidos.';
      dibujar(); avisar();
    };
    const insertar = (campo) => {
      est.campos[hueco] = campo;
      const def = HUECOS.find((x) => x.id === hueco);
      retro.innerHTML = '';
      if (def.correcto !== campo) retro.appendChild(h('div', { class: 'aviso-caja alerta' }, def.aviso && def.aviso[campo] ? def.aviso[campo] : 'Revisa: en [' + def.etiqueta + '] va otro campo.'));
      const sig = HUECOS.find((x) => !est.campos[x.id]);
      if (sig) hueco = sig.id;
      dibujar(); avisar();
    };
    const finalizar = (como) => {
      const faltan = HUECOS.filter((x) => est.campos[x.id] !== x.correcto);
      retro.innerHTML = '';
      if (faltan.length) { retro.appendChild(h('div', { class: 'aviso-caja alerta' }, 'Antes de combinar revisa: ' + faltan.map((x) => '[' + x.etiqueta + ']').join(', ') + '.')); return; }
      est.finalizado = como;
      retro.appendChild(h('div', { class: 'aviso-caja ok' }, como === 'documento' ? '✓ Se generó un documento nuevo con ' + registros.length + ' cartas, una por pedido. Puedes revisarlo, guardarlo o imprimirlo.' : como === 'imprimir' ? '✓ Se enviaron ' + registros.length + ' cartas a la impresora.' : '✓ Se enviarían ' + registros.length + ' correos (necesitas una columna con el correo de cada cliente).'));
      dibujar(); avisar();
      if (opts.alListo) opts.alListo(est);
    };
    cont.style.position = 'relative';
    cont.append(h('div', { class: 'cc' }, cinta, h('div', { class: 'cc-cuerpo' }, carta, lista)), retro);
    dibujar();
    return { estado: () => JSON.parse(JSON.stringify(est)) };
  };
})();
