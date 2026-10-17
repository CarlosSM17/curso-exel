/* Módulo 1 · Inicio: la pantalla de Excel, Autorrecuperación y barra de acceso rápido */
(function () {
  const PEDIDOS_QAT = ['Guardar', 'Deshacer', 'Rehacer', 'Vista previa de impresión e Imprimir', 'Orden ascendente'];
  const PARTES_RETO = ['barraTitulo', 'accesoRapido', 'archivo', 'cinta', 'grupo', 'cuadroNombres', 'barraFormulas', 'celdaActiva', 'pestanasHojas', 'barraEstado'];
  const PARTES_MICRO = ['cinta', 'cuadroNombres', 'barraFormulas', 'encabezadoColumna', 'pestanasHojas', 'zoom'];

  function crearReto(cont, nivel) {
    const { h } = LT.u;
    const explorador = nivel === 'explorador', experto = nivel === 'experto';
    const est = { pantalla: null, auto: null, qat: null };
    const pestanas = h('div', { class: 'grupo-btn', style: { marginBottom: '10px' } });
    const paneles = [h('div'), h('div'), h('div')];
    const titulos = ['1. Partes de la pantalla', '2. Autorrecuperación', '3. Barra de acceso rápido'];
    const mostrar = (i) => { paneles.forEach((p, k) => { p.style.display = k === i ? '' : 'none'; }); pestanas.querySelectorAll('button').forEach((b, k) => b.classList.toggle('primario', k === i)); };
    titulos.forEach((t, i) => pestanas.appendChild(h('button', { class: 'btn chico', onclick: () => mostrar(i) }, t)));
    paneles[0].appendChild(h('p', { class: 'instr' }, 'Identifica las ' + PARTES_RETO.length + ' partes que te pide la ventana.' + (explorador ? ' Verás una pista de cada una.' : '')));
    const c0 = h('div'); paneles[0].appendChild(c0);
    paneles[1].appendChild(h('p', { class: 'instr' }, explorador ? 'Haz clic en la categoría «Guardar». Marca «Guardar información de Autorrecuperación cada» con 5 minutos y marca «Conservar la última versión autorrecuperada si cierro sin guardar».' : 'Configura Excel para que guarde la información de Autorrecuperación cada 5 minutos y conserve la última versión si cierras sin guardar.'));
    const c1 = h('div'); paneles[1].appendChild(c1);
    paneles[2].appendChild(h('p', { class: 'instr' }, 'Marta quiere estos botones en la barra de acceso rápido: ' + PEDIDOS_QAT.join(', ') + '.' + (experto ? ' Además agrega «Formulario…» (lo usarás en el módulo 13), pon «Guardar» al principio y muestra la barra debajo de la cinta.' : '') + (explorador ? ' Elige el comando a la izquierda y pulsa «Agregar»; los que no están en «Comandos más utilizados» están en «Todos los comandos».' : '')));
    const c2 = h('div'); paneles[2].appendChild(c2);
    cont.append(pestanas, ...paneles);
    setTimeout(() => {
      const p = LT.widgets.pantallaExcel(c0, { modo: 'quiz', preguntas: PARTES_RETO, conPistas: explorador });
      est.pantallaW = p;
      est.autoW = LT.widgets.autorrecuperacion(c1, {});
      est.qatW = LT.widgets.accesoRapido(c2, {});
      mostrar(0);
    }, 0);
    return {
      verificar: () => {
        const r = [];
        const add = (ok, titulo, mensaje) => r.push({ ok, titulo, mensaje: ok ? titulo : mensaje });
        const p = est.pantallaW.estado(), a = est.autoW.estado(), q = est.qatW.estado();
        add(p.completado, 'Identificaste las partes de la pantalla', 'Termina de identificar las partes de la pantalla (pestaña 1 del reto).');
        add(a.autorrecuperacion && a.minutos === 5, 'Autorrecuperación cada 5 minutos', 'En Opciones › Guardar, activa la Autorrecuperación cada 5 minutos.');
        add(a.conservar, 'Conservar la última versión autorrecuperada', 'Marca «Conservar la última versión autorrecuperada si cierro sin guardar».');
        const faltan = PEDIDOS_QAT.filter((x) => !q.comandos.includes(x));
        add(!faltan.length, 'Barra de acceso rápido con los comandos pedidos', 'Faltan en la barra de acceso rápido: ' + faltan.join(', ') + '.');
        if (experto) {
          add(q.comandos.includes('Formulario…'), 'Comando «Formulario…» agregado', 'Agrega «Formulario…» (está en «Todos los comandos»).');
          add(q.comandos[0] === 'Guardar', '«Guardar» es el primer botón', 'Mueve «Guardar» al principio con ▲.');
          add(q.debajo, 'Barra debajo de la cinta', 'Marca «Mostrar la barra de herramientas de acceso rápido debajo de la cinta de opciones».');
        }
        return { ok: r.every((x) => x.ok), resultados: r };
      },
    };
  }

  LT.definirModulo({
    id: 1,
    objetivo: 'Reconocer las partes de la pantalla de Excel, configurar la Autorrecuperación y personalizar la barra de herramientas de acceso rápido.',
    situacion: 'Bienvenido(a) a La Taza. Antes de tocar los datos quiero que conozcas tu herramienta: <b>dónde está cada cosa</b>, cómo <b>no perder trabajo</b> si se va la luz y cómo tener <b>a la mano los comandos</b> que más usarás.',
    explicacion: [
      { html: '<h3>Las partes de la ventana</h3><p>Excel organiza todo en la misma ventana. Arriba están la <b>barra de título</b> (nombre del libro) y la <b>barra de herramientas de acceso rápido</b>; debajo, la <b>cinta de opciones</b> con sus <b>pestañas</b> (Inicio, Insertar, Fórmulas…) y <b>grupos</b> de comandos. Luego vienen el <b>cuadro de nombres</b> (la celda activa) y la <b>barra de fórmulas</b> (lo que la celda contiene de verdad). Al centro, la cuadrícula: columnas con letras, filas con números y la <b>celda activa</b> con borde verde. Abajo, las <b>pestañas de las hojas</b> y la <b>barra de estado</b> con las vistas y el zoom.</p>' },
      { widget: 'pantallaExcel', titulo: 'Explora la ventana', instr: 'Pasa el cursor (o toca) cada zona para ver su nombre y para qué sirve.', opts: { modo: 'explorar' } },
      { html: '<h3>No perder el trabajo: Autoguardado y Autorrecuperación</h3><ul><li><b>Autoguardado</b> (interruptor arriba a la izquierda): guarda los cambios cada pocos segundos, pero solo si el archivo está en <b>OneDrive o SharePoint</b>.</li><li><b>Autorrecuperación</b>: para archivos en tu equipo. Cada cierto tiempo Excel guarda una copia de recuperación. Se configura en <b>Archivo › Opciones › Guardar</b>: «Guardar información de Autorrecuperación cada <i>n</i> minutos» y «Conservar la última versión autorrecuperada si cierro sin guardar».</li><li>Si Excel se cierra de golpe, al abrirlo de nuevo aparece el panel <b>Recuperación de documentos</b>. Si cerraste sin guardar: <b>Archivo › Información › Administrar libro › Recuperar libros no guardados</b>.</li><li>Ninguno sustituye a guardar: <kbd>Ctrl+G</kbd> (Excel en español) o el botón Guardar.</li></ul><h3>Tus comandos favoritos a un clic</h3><p>La <b>barra de herramientas de acceso rápido</b> está siempre visible. Su flecha ▾ permite marcar comandos comunes; «Más comandos…» abre <b>Archivo › Opciones › Barra de herramientas de acceso rápido</b> para agregar cualquiera. Atajo: clic derecho sobre un botón de la cinta › «Agregar a la barra de herramientas de acceso rápido». Puede mostrarse arriba o debajo de la cinta, y sus botones se activan con <kbd>Alt</kbd> + número.</p>' },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Configurar la Autorrecuperación cada 5 minutos',
      pasos: [{ texto: 'Haz clic en la pestaña Archivo y, abajo a la izquierda, en Opciones.', ruta: ['Archivo', 'Opciones'] }, 'En la ventana Opciones de Excel, elige la categoría «Guardar».', 'Marca «Guardar información de Autorrecuperación cada» y escribe 5 minutos.', 'Marca «Conservar la última versión autorrecuperada si cierro sin guardar» y pulsa Aceptar.'],
      pregunta: { texto: 'Trabajas en un archivo guardado en el <b>escritorio</b> (no en OneDrive) y se va la luz. ¿Qué te ayuda a recuperar el trabajo?', opciones: ['La Autorrecuperación', 'El Autoguardado', 'La barra de acceso rápido', 'El historial del navegador'], correcta: 0, explicacion: 'El Autoguardado solo funciona con archivos en OneDrive o SharePoint. Para archivos en el equipo, la <b>Autorrecuperación</b> guarda copias de recuperación cada pocos minutos.', retro: { 1: 'El Autoguardado solo está activo para archivos guardados en OneDrive o SharePoint.' } },
    },
    micro: [
      { titulo: 'Ubica las partes', tipo: 'widget', enunciado: 'Haz clic en cada parte que se te pide.', crear: (c, listo) => LT.widgets.pantallaExcel(c, { modo: 'quiz', preguntas: PARTES_MICRO, alTerminar: () => listo() }) },
      { titulo: 'Autoguardado o Autorrecuperación', tipo: 'opcion', enunciado: '¿Qué afirmación es correcta?', opciones: ['El Autoguardado guarda continuamente los archivos en OneDrive/SharePoint; la Autorrecuperación guarda copias de recuperación de los archivos locales cada cierto tiempo', 'Son lo mismo con distinto nombre', 'La Autorrecuperación sustituye a guardar el archivo', 'El Autoguardado funciona con cualquier archivo, aunque esté en el escritorio'], correcta: 0, explicacion: 'Son complementarios. Y ninguno sustituye a guardar con Ctrl+G.' },
      { titulo: 'Un botón siempre a la mano', tipo: 'opcion', enunciado: 'Quieres que el botón «Vista previa de impresión» esté siempre visible, sin importar en qué pestaña estés. ¿Qué haces?', opciones: ['Lo agrego a la barra de herramientas de acceso rápido', 'Cambio de pestaña cada vez', 'Lo agrego a la barra de estado', 'Inmovilizo paneles'], correcta: 0, explicacion: 'La barra de herramientas de acceso rápido siempre está visible. Usa su flecha ▾ o clic derecho sobre el botón › «Agregar a la barra de herramientas de acceso rápido».' },
    ],
    reto: {
      titulo: 'Recorrido por la pantalla y tu barra de acceso rápido', tipo: 'widget', crear: crearReto,
      base: {
        instrucciones: ['<b>Pestaña 1:</b> identifica las 10 partes de la ventana que se te piden.', '<b>Pestaña 2:</b> configura la Autorrecuperación cada 5 minutos y que conserve la última versión si cierras sin guardar.', '<b>Pestaña 3:</b> agrega a la barra de acceso rápido los comandos que pide Marta.'],
        pistas: ['Pasa por las tres pestañas del reto: pantalla, Autorrecuperación y barra de acceso rápido.', 'La Autorrecuperación está en la categoría «Guardar» de las Opciones de Excel. Para la barra, los comandos que no ves están en «Todos los comandos».', 'Opciones › Guardar › Autorrecuperación cada 5 minutos + Conservar la última versión. Barra: agrega Vista previa de impresión e Imprimir y Orden ascendente.'],
      },
      niveles: {
        explorador: { instrucciones: ['Pestaña 1: verás una pista de cada parte.', 'Pestaña 2: sigue los pasos que aparecen arriba de la ventana de opciones.', 'Pestaña 3: agrega «Vista previa de impresión e Imprimir» y «Orden ascendente» (Guardar, Deshacer y Rehacer ya están).'] },
        experto: { instrucciones: ['Identifica las 10 partes y configura la Autorrecuperación (5 minutos, conservar la última versión).', 'Barra de acceso rápido con los comandos pedidos y además «Formulario…», con «Guardar» primero y la barra debajo de la cinta.'] },
      },
    },
    lab: {
      archivo: 'lab01-mi-primer-libro.xlsx', titulo: 'Mi primer libro en Excel',
      contexto: 'Abre el libro y recorre la pantalla de Excel haciendo cambios sencillos que el verificador puede revisar.',
      pasos: {
        explorador: [{ texto: 'Doble clic en la pestaña «Hoja1» y cambia su nombre a <b>Mi primera hoja</b>.' }, 'Haz clic en el cuadro de nombres, escribe <b>D10</b> y pulsa Enter; escribe tu nombre.', 'En A1 escribe <b>Mi primer libro en La Taza</b>.', { texto: 'Ajusta el zoom a 120 % (barra de estado o Vista › Zoom).', ruta: ['Vista', 'Zoom'] }, { texto: 'Archivo › Información › Propiedades: escribe el título <b>Mi primer libro</b>.', ruta: ['Archivo', 'Información'] }, 'Configura la Autorrecuperación cada 5 minutos (Archivo › Opciones › Guardar). Guarda el libro y súbelo.'],
        analista: ['Nombre de la hoja: «Mi primera hoja». En A1: «Mi primer libro en La Taza». En D10 (usa el cuadro de nombres): tu nombre.', 'Zoom al 120 % y título del documento «Mi primer libro» (Archivo › Información › Propiedades).', 'Configura la Autorrecuperación cada 5 minutos. Guarda y sube el libro.'],
        experto: ['Lo del nivel Analista.', 'Deja la hoja en la vista «Diseño de página» y agrega «curso» a las palabras clave (Etiquetas) del documento.', 'Agrega «Formulario» a tu barra de acceso rápido. Guarda y sube el libro.'],
      },
      notaWeb: 'En Excel para la web el título se cambia desde Archivo › Información › Propiedades y el zoom está en la barra de estado.',
      pruebas: [
        { titulo: 'Hoja llamada «Mi primera hoja»', fn: (L) => (L.hoja('Mi primera hoja') ? true : 'Cambia el nombre de Hoja1 a «Mi primera hoja» (las hojas actuales son: ' + L.hojas.map((x) => x.nombre).join(', ') + ').') },
        { titulo: 'Texto en A1 y tu nombre en D10', fn: (L) => { const a1 = String(L.valor('Mi primera hoja', 'A1') || ''); if (!/mi primer libro en la taza/i.test(a1)) return 'En A1 escribe «Mi primer libro en La Taza».'; const d10 = L.valor('Mi primera hoja', 'D10'); return typeof d10 === 'string' && d10.trim().length >= 3 ? true : 'Escribe tu nombre en D10 (usa el cuadro de nombres para llegar).'; } },
        { titulo: 'Zoom al 120 %', fn: (L) => { if (!L.hoja('Mi primera hoja')) return 'Primero cambia el nombre de la hoja a «Mi primera hoja».'; const z = L.hoja('Mi primera hoja').zoom; return z === 120 ? true : 'El zoom de la hoja es ' + z + ' %; ajústalo a 120 %.'; } },
        { titulo: 'Título del documento', fn: (L) => (/mi primer libro/i.test(L.propiedades.titulo) ? true : 'Escribe el título «Mi primer libro» en Archivo › Información › Propiedades (ahora: «' + (L.propiedades.titulo || 'vacío') + '»).') },
        { titulo: 'Vista Diseño de página', nivel: 'experto', fn: (L) => (!L.hoja('Mi primera hoja') ? 'Primero cambia el nombre de la hoja a «Mi primera hoja».' : L.hoja('Mi primera hoja').vista === 'pageLayout' ? true : 'Cambia a la vista Diseño de página (Vista › Diseño de página o el botón de la barra de estado).') },
        { titulo: 'Palabra clave «curso»', nivel: 'experto', fn: (L) => (/curso/i.test(L.propiedades.palabrasClave) ? true : 'Agrega «curso» a las etiquetas o palabras clave del documento.') },
      ],
    },
    donde: [
      { comando: 'Opciones (Autorrecuperación)', ruta: ['Archivo', 'Opciones'], nota: 'En Mac: Excel › Preferencias › Guardar.' },
      { comando: 'Recuperar libros no guardados', ruta: ['Archivo', 'Información', 'Administrar libro'], nota: 'Dentro de «Administrar libro» elige «Recuperar libros no guardados».' },
      { comando: 'Zoom', ruta: ['Vista', 'Zoom'] },
      { comando: 'Vista Diseño de página', ruta: ['Vista', 'Diseño de página'] },
    ],
    atajos: ['<kbd>Ctrl+G</kbd> guardar (Excel en español; en inglés es Ctrl+S) · <kbd>F12</kbd> Guardar como', '<kbd>Alt</kbd> muestra las letras de acceso a la cinta; <kbd>Alt</kbd>+número activa un botón de la barra de acceso rápido', '<kbd>Ctrl+F1</kbd> oculta o muestra la cinta de opciones'],
  });
})();
