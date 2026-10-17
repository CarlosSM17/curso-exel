/* Módulo 5 · Insertar objetos */
(function () {
  const { D, ENC } = LT.caso;
  const URL_MENU = 'https://lataza.mx/menu';
  const menu = D.productos.filter((p) => /^(CAF|FRI|TE)/.test(p.codigo)).map((p) => [p.nombre, p.categoria, p.precio]);
  const hojaMenu = () => ({ hojas: [{ nombre: 'Menú', datos: [[], [], [], [], [], [], ['Bebida', 'Categoría', 'Precio'], ...menu], formatos: { 'C8:C20': '$#,##0' }, estilos: { 'A7:C7': ENC }, anchos: { A: 170, B: 130, C: 80, D: 90, E: 90, F: 90 }, filas: 22, cols: 8 }], herramientas: ['insertar', 'portapapeles'], altura: 420 });
  const objetos = (x) => (x.estado.hojas[0].objetos || []);
  const pruebasBase = [
    { tipo: 'fn', titulo: 'Logo de La Taza insertado', fn: (x) => (objetos(x).some((o) => o.tipo === 'imagen' && o.galeria === 'logo') ? true : 'Falta el logo: Insertar › Imágenes › Logo de La Taza.') },
    { tipo: 'fn', titulo: 'Forma con el texto «Menú de temporada»', fn: (x) => {
      const f = objetos(x).filter((o) => o.tipo === 'forma');
      if (!f.length) return 'Falta una forma: Insertar › Formas.';
      return f.some((o) => /men[uú] de temporada/i.test(o.texto || '')) ? true : 'La forma debe decir «Menú de temporada» (doble clic en la forma para escribir).';
    } },
    { tipo: 'fn', titulo: 'Icono de taza de café', fn: (x) => (objetos(x).some((o) => o.tipo === 'icono' && o.galeria === 'taza') ? true : 'Falta el icono de la taza de café: Insertar › Iconos.') },
    { tipo: 'fn', titulo: 'Vínculo al menú en línea en A5', fn: (x) => {
      const e = x.estilo('A5');
      if (!e.link) return 'A5 todavía no tiene vínculo: selecciona A5 › Insertar › Vínculo.';
      if (e.link.replace(/\/$/, '') !== URL_MENU) return 'El vínculo de A5 debe ir a ' + URL_MENU + '.';
      return /ver men[uú] en l[ií]nea/i.test(String(x.valor('A5') || '')) ? true : 'El texto de A5 debe ser «Ver menú en línea».';
    } },
  ];

  LT.definirModulo({
    id: 5,
    objetivo: 'Agregar imágenes, formas, iconos, cuadros de texto e hipervínculos.',
    situacion: 'Vamos a mandar el menú por correo a las empresas clientes. Necesito un <b>encabezado con nuestro logo</b>, un letrero llamativo y un <b>enlace al menú en línea</b>.',
    explicacion: [
      { html: '<h3>Objetos que flotan sobre la hoja</h3><p>Las imágenes, formas, iconos y cuadros de texto no viven dentro de una celda: <b>flotan</b> encima de la cuadrícula y se pueden mover y cambiar de tamaño con el ratón. Están en la pestaña <b>Insertar</b>.</p><ul><li><b>Imágenes:</b> fotos o el logo, desde tu equipo.</li><li><b>Iconos:</b> dibujos sencillos que se pueden agrandar sin perder calidad.</li><li><b>Formas:</b> rectángulos, flechas o cintas; pueden llevar texto.</li><li><b>Cuadro de texto:</b> texto libre que puedes colocar donde quieras.</li><li><b>Vínculo</b> (hipervínculo): se pone en una celda y abre una página web o lleva a otra hoja. Para seguirlo dentro de Excel: <kbd>Ctrl</kbd>+clic.</li></ul><p><b>Texto alternativo:</b> describe la imagen para quien usa lector de pantalla. Clic derecho sobre el objeto › Editar texto alternativo.</p>' },
      { titulo: 'Zona de práctica', instr: 'Inserta objetos y muévelos. Clic derecho sobre un objeto para ver sus opciones; Supr lo elimina.', hoja: { altura: 260, hojas: [{ nombre: 'Práctica', datos: [], filas: 10, cols: 8 }], herramientas: ['insertar'] } },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Insertar el logo con texto alternativo',
      pasos: [{ texto: 'Haz clic cerca de donde quieres el logo.' }, { texto: 'Insertar › Imágenes › Este dispositivo… y elige el archivo del logo.', ruta: ['Insertar', 'Imágenes'] }, 'Arrastra la imagen a su lugar y ajústala desde una esquina (así conserva la proporción).', 'Clic derecho › Editar texto alternativo: «Logo de Cafetería La Taza».'],
      pregunta: { texto: '¿Para qué sirve el <b>texto alternativo</b> de una imagen?', opciones: ['Describe la imagen para personas que usan lector de pantalla', 'Aparece como título al imprimir', 'Cambia el nombre del archivo de la imagen', 'Reduce el tamaño del archivo'], correcta: 0, explicacion: 'El texto alternativo hace accesible el documento: los lectores de pantalla lo leen en voz alta.' },
    },
    micro: [
      { titulo: '¿Qué objeto usarías?', tipo: 'opcion', enunciado: 'Quieres un letrero con <b>fondo de color y esquinas redondeadas</b> que diga «¡Nuevo!» encima de la tabla.', opciones: ['Una forma (rectángulo redondeado) con texto', 'Una imagen', 'Un comentario', 'Una celda con relleno'], correcta: 0, explicacion: 'Las formas pueden llevar texto, color de relleno y se colocan donde quieras.' },
      {
        titulo: 'Un vínculo en una celda', tipo: 'hoja', enunciado: 'En B3 crea un vínculo con el texto «Pedidos en línea» que vaya a <code>https://lataza.mx/pedidos</code>.',
        hoja: { hojas: [{ nombre: 'Hoja1', datos: [['Cafetería La Taza'], [], ['Haz tu pedido:']], anchos: { A: 130, B: 160 }, filas: 8, cols: 5, objetivo: 'B3' }], herramientas: ['insertar'] },
        pruebas: [{ tipo: 'fn', fn: (x) => { const e = x.estilo('B3'); if (!e.link) return 'B3 no tiene vínculo: selecciona B3 y usa el botón Vínculo.'; if (e.link.replace(/\/$/, '') !== 'https://lataza.mx/pedidos') return 'La dirección debe ser https://lataza.mx/pedidos'; return /pedidos en l[ií]nea/i.test(String(x.valor('B3'))) ? true : 'El texto debe ser «Pedidos en línea».'; } }],
        pista: ['Selecciona B3 › botón «Vínculo» de la barra; escribe el texto que se mostrará y la dirección.'],
      },
    ],
    reto: {
      titulo: 'Encabezado del menú con logo y enlace', tipo: 'hoja',
      intro: 'La hoja <i>Menú</i> tiene libres las filas 1 a 6 para el encabezado.',
      base: {
        hoja: hojaMenu(), pruebas: pruebasBase,
        instrucciones: ['Inserta el <b>logo</b> de La Taza en la parte superior.', 'Inserta una <b>forma</b> con el texto «Menú de temporada».', 'Inserta un <b>icono</b> de taza de café.', 'En <b>A5</b> crea un vínculo con el texto «Ver menú en línea» a <code>' + URL_MENU + '</code>.', 'Acomoda los objetos para que no tapen la tabla.'],
        pistas: ['Todo está en la sección «Insertar» de la barra del simulador.', 'Para escribir en una forma, haz doble clic sobre ella. El vínculo se crea con la celda A5 seleccionada.', 'Imágenes › Logo de La Taza; Formas › Cinta (doble clic para escribir); Iconos › Taza de café; A5 › Vínculo.'],
      },
      niveles: {
        explorador: { instrucciones: ['Botón <b>Imágenes</b> › «Logo de La Taza». Arrástralo a la esquina superior izquierda.', 'Botón <b>Formas</b> › «Cinta». Haz doble clic sobre ella y escribe «Menú de temporada».', 'Botón <b>Iconos</b> › «Taza de café».', 'Haz clic en <b>A5</b> › botón <b>Vínculo</b>: texto «Ver menú en línea», dirección <code>' + URL_MENU + '</code>.'] },
        experto: {
          instrucciones: ['Arma el encabezado: logo, forma «Menú de temporada», icono de taza de café y vínculo «Ver menú en línea» en A5 a ' + URL_MENU + '.', 'Agrega <b>texto alternativo</b> al logo y al icono.', 'Agrega un <b>cuadro de texto</b> con el horario «Abierto de 7:00 a 21:00».'],
          pruebasExtra: [
            { tipo: 'fn', titulo: 'Texto alternativo en logo e icono', fn: (x) => { const o = objetos(x).filter((y) => y.tipo === 'imagen' || y.tipo === 'icono'); const sin = o.find((y) => !y.alt || y.alt.length < 4); return sin ? 'Agrega texto alternativo a «' + (sin.nombre || sin.tipo) + '» (clic derecho › Editar texto alternativo).' : true; } },
            { tipo: 'fn', titulo: 'Cuadro de texto con el horario', fn: (x) => (objetos(x).some((o) => o.tipo === 'texto' && /7:00/.test(o.texto || '') && /21:00/.test(o.texto || '')) ? true : 'Falta un cuadro de texto con «Abierto de 7:00 a 21:00».') },
          ],
        },
      },
    },
    lab: {
      archivo: 'lab05-menu.xlsx', titulo: 'Encabezado del menú en Excel',
      contexto: 'Descarga también el logo en PNG para insertarlo.',
      descargas: [{ ruta: 'assets/img/logo-la-taza.png', texto: 'Logo (PNG)' }],
      pasos: {
        explorador: [{ texto: 'Inserta el logo (archivo logo-la-taza.png).', ruta: ['Insertar', 'Imágenes'] }, { texto: 'Inserta una forma y escribe «Menú de temporada».', ruta: ['Insertar', 'Formas'] }, { texto: 'Inserta un icono de café.', ruta: ['Insertar', 'Iconos'] }, { texto: 'En A5 inserta un vínculo «Ver menú en línea» a ' + URL_MENU + '.', ruta: ['Insertar', 'Vínculo'] }, 'Guarda y sube el libro.'],
        analista: ['Arma el encabezado con logo, forma «Menú de temporada», icono y el vínculo «Ver menú en línea» (A5 → ' + URL_MENU + ').', 'Guarda y sube el libro.'],
        experto: ['Encabezado del nivel Analista.', 'Texto alternativo en el logo y en el icono.', 'Cuadro de texto con el horario «Abierto de 7:00 a 21:00».', 'Guarda y sube el libro.'],
      },
      notaWeb: 'En Excel para la web: Insertar › Imagen › Este dispositivo, e Insertar › Formas e Iconos.',
      pruebas: [
        { titulo: 'Logo insertado (imagen)', fn: (L, A) => { const h = A.hoja('Menú'); return h.dibujo.imagenes.length ? true : 'No encontré ninguna imagen: inserta el logo.'; } },
        { titulo: 'Forma con «Menú de temporada»', fn: (L) => { const d = L.hoja('Menú').dibujo; const f = d.formas.concat(d.cuadrosTexto); return f.some((o) => /men[uú] de temporada/i.test(o.texto)) ? true : 'Falta una forma con el texto «Menú de temporada».'; } },
        { titulo: 'Icono insertado', fn: (L) => { const d = L.hoja('Menú').dibujo; return d.iconos.length || d.imagenes.length >= 2 ? true : 'Falta el icono: Insertar › Iconos.'; } },
        { titulo: 'Vínculo al menú en línea', fn: (L) => { const v = L.hoja('Menú').hipervinculos.find((x) => /lataza\.mx\/menu/i.test(x.destino || '')); return v ? true : 'No encontré un vínculo a ' + URL_MENU + '.'; } },
        { titulo: 'Texto alternativo', nivel: 'experto', fn: (L) => { const d = L.hoja('Menú').dibujo; const o = d.imagenes.concat(d.iconos); const sin = o.find((x) => !x.alt || x.alt.length < 4); return o.length && !sin ? true : 'Agrega texto alternativo a todas las imágenes e iconos.'; } },
        { titulo: 'Cuadro de texto con el horario', nivel: 'experto', fn: (L) => { const d = L.hoja('Menú').dibujo; return d.cuadrosTexto.concat(d.formas).some((o) => /7:00/.test(o.texto) && /21:00/.test(o.texto)) ? true : 'Falta el cuadro de texto con el horario.'; } },
      ],
    },
    donde: [
      { comando: 'Imágenes', ruta: ['Insertar', 'Imágenes'] },
      { comando: 'Iconos', ruta: ['Insertar', 'Iconos'], nota: 'En Mac y en la web también está en Insertar.' },
      { comando: 'Cuadro de texto', ruta: ['Insertar', 'Cuadro de texto'] },
      { comando: 'Vínculo', ruta: ['Insertar', 'Vínculo'], nota: 'Atajo: Ctrl+Alt+K.' },
    ],
    atajos: ['<kbd>Ctrl</kbd>+clic sobre una celda con vínculo para abrirlo.', 'Arrastra una esquina del objeto con <kbd>Mayús</kbd> para conservar la proporción.'],
  });
})();
