/* Módulo 4 · Insertar objetos */
(function () {
  const { D, ENC } = LT.caso;
  const URL_CITAS = 'https://clinicavidasana.mx/citas';
  const estudios = D.estudios.map((e) => [e.estudio, e.preparacion, e.cuota]);
  const hojaIndicaciones = () => ({ hojas: [{ nombre: 'Indicaciones', datos: [[], [], [], [], [], [], ['Estudio', 'Preparación', 'Cuota'], ...estudios], formatos: { 'C8:C20': '$#,##0' }, estilos: { 'A7:C7': ENC }, anchos: { A: 170, B: 330, C: 80, D: 90, E: 90 }, filas: 22, cols: 7 }], herramientas: ['insertar', 'portapapeles'], altura: 420 });
  const objetos = (x) => (x.estado.hojas[0].objetos || []);
  const pruebasBase = [
    { tipo: 'fn', titulo: 'Logo de la clínica insertado', fn: (x) => (objetos(x).some((o) => o.tipo === 'imagen' && o.galeria === 'logo') ? true : 'Falta el logo: Insertar › Imágenes › Logo de la Clínica Vida Sana.') },
    { tipo: 'fn', titulo: 'Forma con el texto «Indicaciones para su estudio»', fn: (x) => {
      const f = objetos(x).filter((o) => o.tipo === 'forma');
      if (!f.length) return 'Falta una forma: Insertar › Formas.';
      return f.some((o) => /indicaciones para su estudio/i.test(o.texto || '')) ? true : 'La forma debe decir «Indicaciones para su estudio» (doble clic en la forma para escribir).';
    } },
    { tipo: 'fn', titulo: 'Icono de laboratorio', fn: (x) => (objetos(x).some((o) => o.tipo === 'icono' && o.galeria === 'matraz') ? true : 'Falta el icono de laboratorio (matraz): Insertar › Iconos.') },
    { tipo: 'fn', titulo: 'Vínculo para agendar cita en A5', fn: (x) => {
      const e = x.estilo('A5');
      if (!e.link) return 'A5 todavía no tiene vínculo: selecciona A5 › Insertar › Vínculo.';
      if (e.link.replace(/\/$/, '') !== URL_CITAS) return 'El vínculo de A5 debe ir a ' + URL_CITAS + '.';
      return /agendar cita en l[ií]nea/i.test(String(x.valor('A5') || '')) ? true : 'El texto de A5 debe ser «Agendar cita en línea».';
    } },
  ];

  LT.definirModulo({
    id: 4,
    objetivo: 'Agregar imágenes, formas, iconos, cuadros de texto e hipervínculos, con texto alternativo para que el documento sea accesible.',
    situacion: 'Vamos a enviar a los pacientes la <b>hoja de indicaciones</b> para sus estudios de laboratorio e imagen. Necesito un encabezado con el <b>logo de la clínica</b>, un letrero visible, un icono y un <b>enlace para agendar cita</b>.',
    explicacion: [
      { html: '<h3>Objetos que flotan sobre la hoja</h3><p>Las imágenes, formas, iconos y cuadros de texto no viven dentro de una celda: <b>flotan</b> encima de la cuadrícula. Están en la pestaña <b>Insertar</b>.</p><ul><li><b>Imágenes:</b> el logo institucional o una fotografía (comprímelas si el archivo pesa mucho).</li><li><b>Iconos:</b> dibujos sencillos que se agrandan sin perder calidad.</li><li><b>Formas:</b> rectángulos, flechas o cintas; pueden llevar texto.</li><li><b>Cuadro de texto:</b> texto libre que colocas donde quieras.</li><li><b>Vínculo</b> (hipervínculo): abre una página web, un correo o lleva a otra hoja. En Excel se sigue con <kbd>Ctrl</kbd>+clic.</li></ul><p><b>Texto alternativo:</b> describe la imagen para quien usa lector de pantalla. En materiales para pacientes es un requisito de accesibilidad: clic derecho sobre el objeto › Editar texto alternativo.</p>' },
      { titulo: 'Zona de práctica', instr: 'Inserta objetos y muévelos. Clic derecho sobre un objeto para ver sus opciones; Supr lo elimina.', hoja: { altura: 260, hojas: [{ nombre: 'Práctica', datos: [], filas: 10, cols: 8 }], herramientas: ['insertar'] } },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Insertar el logo con texto alternativo',
      pasos: [{ texto: 'Haz clic cerca de donde quieres el logo.' }, { texto: 'Insertar › Imágenes › Este dispositivo… y elige el archivo del logo.', ruta: ['Insertar', 'Imágenes'] }, 'Arrastra la imagen a su lugar y ajústala desde una esquina (así conserva la proporción).', 'Clic derecho › Editar texto alternativo: «Logo de la Clínica Universitaria Vida Sana».'],
      pregunta: { texto: '¿Para qué sirve el <b>texto alternativo</b> de una imagen?', opciones: ['Describe la imagen para personas que usan lector de pantalla', 'Aparece como título al imprimir', 'Cambia el nombre del archivo de la imagen', 'Reduce el tamaño del archivo'], correcta: 0, explicacion: 'El texto alternativo hace accesible el documento: los lectores de pantalla lo leen en voz alta. En materiales para pacientes es indispensable.' },
    },
    micro: [
      { titulo: '¿Qué objeto usarías?', tipo: 'opcion', enunciado: 'Quieres un letrero con <b>fondo de color y esquinas redondeadas</b> que diga «Ayuno de 8 horas» encima de la tabla.', opciones: ['Una forma (rectángulo redondeado) con texto', 'Una imagen', 'Un comentario', 'Una celda con relleno'], correcta: 0, explicacion: 'Las formas pueden llevar texto, color de relleno y se colocan donde quieras, sin alterar las celdas.' },
      {
        titulo: 'Un vínculo en una celda', tipo: 'hoja', enunciado: 'En B3 crea un vínculo con el texto «Resultados en línea» que vaya a <code>https://clinicavidasana.mx/resultados</code>.',
        hoja: { hojas: [{ nombre: 'Hoja1', datos: [['Clínica Universitaria Vida Sana'], [], ['Consulta sus estudios:']], anchos: { A: 160, B: 170 }, filas: 8, cols: 5, objetivo: 'B3' }], herramientas: ['insertar'] },
        pruebas: [{ tipo: 'fn', fn: (x) => { const e = x.estilo('B3'); if (!e.link) return 'B3 no tiene vínculo: selecciona B3 y usa el botón Vínculo.'; if (e.link.replace(/\/$/, '') !== 'https://clinicavidasana.mx/resultados') return 'La dirección debe ser https://clinicavidasana.mx/resultados'; return /resultados en l[ií]nea/i.test(String(x.valor('B3'))) ? true : 'El texto debe ser «Resultados en línea».'; } }],
        pista: ['Selecciona B3 › botón «Vínculo» de la barra; escribe el texto que se mostrará y la dirección.'],
      },
    ],
    reto: {
      titulo: 'Encabezado de la hoja de indicaciones', tipo: 'hoja',
      intro: 'La hoja <i>Indicaciones</i> tiene libres las filas 1 a 6 para el encabezado.',
      base: {
        hoja: hojaIndicaciones(), pruebas: pruebasBase,
        instrucciones: ['Inserta el <b>logo</b> de la clínica en la parte superior.', 'Inserta una <b>forma</b> con el texto «Indicaciones para su estudio».', 'Inserta un <b>icono</b> de laboratorio (matraz).', 'En <b>A5</b> crea un vínculo con el texto «Agendar cita en línea» a <code>' + URL_CITAS + '</code>.', 'Acomoda los objetos para que no tapen la tabla.'],
        pistas: ['Todo está en la sección «Insertar» de la barra del simulador.', 'Para escribir en una forma, haz doble clic sobre ella. El vínculo se crea con la celda A5 seleccionada.', 'Imágenes › Logo de la Clínica Vida Sana; Formas › Cinta (doble clic para escribir); Iconos › Laboratorio; A5 › Vínculo.'],
      },
      niveles: {
        explorador: { instrucciones: ['Botón <b>Imágenes</b> › «Logo de la Clínica Vida Sana». Arrástralo a la esquina superior izquierda.', 'Botón <b>Formas</b> › «Cinta». Haz doble clic sobre ella y escribe «Indicaciones para su estudio».', 'Botón <b>Iconos</b> › «Laboratorio».', 'Haz clic en <b>A5</b> › botón <b>Vínculo</b>: texto «Agendar cita en línea», dirección <code>' + URL_CITAS + '</code>.'] },
        experto: {
          instrucciones: ['Arma el encabezado: logo, forma «Indicaciones para su estudio», icono de laboratorio y vínculo «Agendar cita en línea» en A5 a ' + URL_CITAS + '.', 'Agrega <b>texto alternativo</b> al logo y al icono.', 'Agrega un <b>cuadro de texto</b> con «Toma de muestras de 7:00 a 10:00».'],
          pruebasExtra: [
            { tipo: 'fn', titulo: 'Texto alternativo en logo e icono', fn: (x) => { const o = objetos(x).filter((y) => y.tipo === 'imagen' || y.tipo === 'icono'); const sin = o.find((y) => !y.alt || y.alt.length < 4); return sin ? 'Agrega texto alternativo a «' + (sin.nombre || sin.tipo) + '» (clic derecho › Editar texto alternativo).' : true; } },
            { tipo: 'fn', titulo: 'Cuadro de texto con el horario', fn: (x) => (objetos(x).some((o) => o.tipo === 'texto' && /7:00/.test(o.texto || '') && /10:00/.test(o.texto || '')) ? true : 'Falta un cuadro de texto con «Toma de muestras de 7:00 a 10:00».') },
          ],
        },
      },
    },
    lab: {
      archivo: 'lab04-indicaciones.xlsx', titulo: 'Hoja de indicaciones en Excel',
      contexto: 'Descarga también el logo en PNG para insertarlo.',
      descargas: [{ ruta: 'assets/img/logo-vida-sana.png', texto: 'Logo (PNG)' }],
      pasos: {
        explorador: [{ texto: 'Inserta el logo (archivo logo-vida-sana.png).', ruta: ['Insertar', 'Imágenes'] }, { texto: 'Inserta una forma y escribe «Indicaciones para su estudio».', ruta: ['Insertar', 'Formas'] }, { texto: 'Inserta un icono relacionado con la salud.', ruta: ['Insertar', 'Iconos'] }, { texto: 'En A5 inserta un vínculo «Agendar cita en línea» a ' + URL_CITAS + '.', ruta: ['Insertar', 'Vínculo'] }, 'Guarda y sube el libro.'],
        analista: ['Arma el encabezado con logo, forma «Indicaciones para su estudio», icono y el vínculo «Agendar cita en línea» (A5 → ' + URL_CITAS + ').', 'Guarda y sube el libro.'],
        experto: ['Encabezado del nivel Analista.', 'Texto alternativo en el logo y en el icono.', 'Cuadro de texto con «Toma de muestras de 7:00 a 10:00».', 'Guarda y sube el libro.'],
      },
      notaWeb: 'En Excel para la web: Insertar › Imagen › Este dispositivo, e Insertar › Formas e Iconos.',
      pruebas: [
        { titulo: 'Logo insertado (imagen)', fn: (L, A) => { const h = A.hoja('Indicaciones'); return h.dibujo.imagenes.length ? true : 'No encontré ninguna imagen: inserta el logo.'; } },
        { titulo: 'Forma con «Indicaciones para su estudio»', fn: (L) => { const d = L.hoja('Indicaciones').dibujo; const f = d.formas.concat(d.cuadrosTexto); return f.some((o) => /indicaciones para su estudio/i.test(o.texto)) ? true : 'Falta una forma con el texto «Indicaciones para su estudio».'; } },
        { titulo: 'Icono insertado', fn: (L) => { const d = L.hoja('Indicaciones').dibujo; return d.iconos.length || d.imagenes.length >= 2 ? true : 'Falta el icono: Insertar › Iconos.'; } },
        { titulo: 'Vínculo para agendar cita', fn: (L) => { const v = L.hoja('Indicaciones').hipervinculos.find((x) => /clinicavidasana\.mx\/citas/i.test(x.destino || '')); return v ? true : 'No encontré un vínculo a ' + URL_CITAS + '.'; } },
        { titulo: 'Texto alternativo', nivel: 'experto', fn: (L) => { const d = L.hoja('Indicaciones').dibujo; const o = d.imagenes.concat(d.iconos); const sin = o.find((x) => !x.alt || x.alt.length < 4); return o.length && !sin ? true : 'Agrega texto alternativo a todas las imágenes e iconos.'; } },
        { titulo: 'Cuadro de texto con el horario', nivel: 'experto', fn: (L) => { const d = L.hoja('Indicaciones').dibujo; return d.cuadrosTexto.concat(d.formas).some((o) => /7:00/.test(o.texto) && /10:00/.test(o.texto)) ? true : 'Falta el cuadro de texto con el horario de toma de muestras.'; } },
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
