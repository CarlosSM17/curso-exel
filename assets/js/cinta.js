/* Cinta de opciones de Excel (Microsoft 365, en español) para la actividad «¿Dónde está?».
   El participante hace clic en la pestaña y el botón donde se encuentra un comando. */
(function () {
  'use strict';
  const LT = window.LT;
  const { h } = LT.u;

  // pestaña -> [[grupo, [comando | [comando, [submenú…]], …]], …]
  const CINTA = {
    'Archivo': [
      ['Archivo', ['Nuevo', 'Abrir', ['Información', ['Proteger libro', 'Historial de versiones', 'Inspeccionar libro']], ['Guardar como', ['Libro de Excel (*.xlsx)', 'Libro de Excel habilitado para macros (*.xlsm)', 'PDF (*.pdf)']], 'Imprimir', 'Compartir', ['Exportar', ['Crear documento PDF/XPS', 'Cambiar el tipo de archivo']], 'Opciones']],
    ],
    'Inicio': [
      ['Portapapeles', [['Pegar', ['Pegar', 'Valores', 'Pegado especial…']], 'Cortar', 'Copiar', 'Copiar formato']],
      ['Fuente', ['Negrita', 'Cursiva', 'Subrayado', 'Bordes', 'Color de relleno', 'Color de fuente', 'Aumentar tamaño de fuente']],
      ['Alineación', ['Alinear a la izquierda', 'Centrar', 'Alinear a la derecha', 'Ajustar texto', 'Combinar y centrar']],
      ['Número', ['Formato de número', 'Formato de número de contabilidad', 'Estilo porcentual', 'Estilo millares', 'Aumentar decimales', 'Disminuir decimales']],
      ['Estilos', [['Formato condicional', ['Resaltar reglas de celdas', 'Reglas superiores e inferiores', 'Barras de datos', 'Escalas de color', 'Conjuntos de iconos', 'Nueva regla…', 'Borrar reglas', 'Administrar reglas…']], 'Dar formato como tabla', 'Estilos de celda']],
      ['Celdas', [['Insertar', ['Insertar celdas…', 'Insertar filas de hoja', 'Insertar columnas de hoja', 'Insertar hoja']], ['Eliminar', ['Eliminar filas de hoja', 'Eliminar columnas de hoja', 'Eliminar hoja']], ['Formato', ['Alto de fila…', 'Autoajustar ancho de columna', 'Ancho de columna…', 'Ocultar y mostrar', 'Cambiar el nombre de la hoja', 'Mover o copiar hoja…', 'Color de pestaña', 'Proteger hoja…', 'Bloquear celda', 'Formato de celdas…']]]],
      ['Edición', [['Autosuma', ['Suma', 'Promedio', 'Contar números', 'Máx.', 'Mín.']], ['Rellenar', ['Hacia abajo', 'Hacia la derecha', 'Series…', 'Relleno rápido']], 'Borrar', ['Ordenar y filtrar', ['Ordenar de A a Z', 'Ordenar de Z a A', 'Orden personalizado…', 'Filtro']], ['Buscar y seleccionar', ['Buscar…', 'Reemplazar…', 'Ir a…', 'Ir a Especial…']]]],
    ],
    'Insertar': [
      ['Tablas', ['Tabla dinámica', 'Tablas dinámicas recomendadas', 'Tabla']],
      ['Ilustraciones', ['Imágenes', 'Formas', 'Iconos', 'Modelos 3D', 'SmartArt']],
      ['Gráficos', ['Gráficos recomendados', 'Insertar gráfico de columnas o de barras', 'Insertar gráfico de líneas o de áreas', 'Insertar gráfico circular o de anillos', 'Gráfico dinámico']],
      ['Minigráficos', ['Línea', 'Columna', 'Ganancia o pérdida']],
      ['Filtros', ['Segmentación de datos', 'Escala de tiempo']],
      ['Vínculos', ['Vínculo']],
      ['Texto', ['Cuadro de texto', 'Encabezado y pie de página', 'WordArt']],
      ['Símbolos', ['Ecuación', 'Símbolo']],
    ],
    'Disposición de página': [
      ['Temas', ['Temas', 'Colores', 'Fuentes']],
      ['Configurar página', ['Márgenes', 'Orientación', 'Tamaño', ['Área de impresión', ['Establecer área de impresión', 'Borrar área de impresión']], 'Saltos', 'Fondo', 'Imprimir títulos']],
      ['Ajustar área de impresión', ['Ancho', 'Alto', 'Escala']],
      ['Opciones de la hoja', ['Líneas de cuadrícula', 'Encabezados']],
    ],
    'Fórmulas': [
      ['Biblioteca de funciones', ['Insertar función', 'Autosuma', 'Usadas recientemente', 'Financieras', 'Lógicas', 'Texto', 'Fecha y hora', 'Búsqueda y referencia', 'Matemáticas y trigonométricas']],
      ['Nombres definidos', ['Administrador de nombres', 'Asignar nombre', 'Utilizar en la fórmula', 'Crear desde la selección']],
      ['Auditoría de fórmulas', ['Rastrear precedentes', 'Rastrear dependientes', 'Quitar flechas', 'Mostrar fórmulas', 'Comprobación de errores', 'Evaluar fórmula', 'Ventana Inspección']],
      ['Cálculo', ['Opciones para el cálculo', 'Calcular ahora']],
    ],
    'Datos': [
      ['Obtener y transformar datos', ['Obtener datos', 'De texto/CSV', 'De la web']],
      ['Consultas y conexiones', ['Actualizar todo']],
      ['Ordenar y filtrar', ['Ordenar de A a Z', 'Ordenar de Z a A', 'Ordenar', 'Filtro', 'Borrar', 'Avanzadas']],
      ['Herramientas de datos', ['Texto en columnas', 'Relleno rápido', 'Quitar duplicados', 'Validación de datos', 'Consolidar']],
      ['Previsión', [['Análisis de hipótesis', ['Administrador de escenarios…', 'Buscar objetivo…', 'Tabla de datos…']], 'Hoja de previsión']],
      ['Esquema', ['Agrupar', 'Desagrupar', 'Subtotal']],
    ],
    'Revisar': [
      ['Revisión', ['Ortografía', 'Sinónimos']],
      ['Accesibilidad', ['Comprobar accesibilidad']],
      ['Comentarios', ['Nuevo comentario', 'Eliminar', 'Comentario anterior', 'Comentario siguiente', 'Mostrar comentarios']],
      ['Notas', [['Notas', ['Nueva nota', 'Editar nota', 'Mostrar todas las notas']]]],
      ['Proteger', ['Proteger hoja', 'Proteger libro', 'Permitir editar rangos']],
    ],
    'Vista': [
      ['Vistas de libro', ['Normal', 'Ver salt. Pág.', 'Diseño de página']],
      ['Mostrar', ['Regla', 'Líneas de cuadrícula', 'Barra de fórmulas', 'Encabezados']],
      ['Zoom', ['Zoom', '100%', 'Ampliar selección']],
      ['Ventana', ['Nueva ventana', 'Organizar todo', ['Inmovilizar', ['Inmovilizar paneles', 'Inmovilizar fila superior', 'Inmovilizar primera columna']], 'Dividir', 'Ocultar', 'Mostrar']],
      ['Macros', [['Macros', ['Ver macros', 'Grabar macro…', 'Usar referencias relativas']]]],
    ],
    'Programador': [
      ['Código', ['Visual Basic', 'Macros', 'Grabar macro', 'Usar referencias relativas', 'Seguridad de macros']],
      ['Complementos', ['Complementos']],
      ['Controles', [['Insertar', ['Botón (control de formulario)', 'Casilla (control de formulario)', 'Cuadro combinado (control de formulario)']], 'Modo Diseño', 'Propiedades', 'Ver código']],
    ],
    'Diseño de tabla': [
      ['Propiedades', ['Nombre de la tabla', 'Cambiar tamaño de la tabla']],
      ['Herramientas', ['Resumir con tabla dinámica', 'Quitar duplicados', 'Convertir en rango', 'Insertar segmentación de datos']],
      ['Opciones de estilo de tabla', ['Fila de encabezado', 'Fila de totales', 'Filas con bandas', 'Botón de filtro']],
      ['Estilos de tabla', ['Estilos rápidos']],
    ],
    'Análisis de tabla dinámica': [
      ['Campo activo', ['Configuración de campo', 'Expandir campo', 'Contraer campo']],
      ['Agrupar', ['Agrupar selección', 'Desagrupar', 'Agrupar campos']],
      ['Filtrar', ['Insertar segmentación de datos', 'Insertar escala de tiempo', 'Conexiones de filtro']],
      ['Datos', ['Actualizar', 'Cambiar origen de datos']],
      ['Herramientas', ['Gráfico dinámico', 'Tablas dinámicas recomendadas']],
      ['Mostrar', ['Lista de campos', 'Botones +/-', 'Encabezados de campo']],
    ],
    'Diseño de gráfico': [
      ['Diseños de gráfico', [['Agregar elemento de gráfico', ['Títulos de ejes', 'Título del gráfico', 'Etiquetas de datos', 'Leyenda', 'Líneas de cuadrícula']], 'Diseño rápido']],
      ['Estilos de diseño', ['Cambiar colores', 'Estilos de diseño']],
      ['Datos', ['Cambiar entre filas y columnas', 'Seleccionar datos']],
      ['Tipo', ['Cambiar tipo de gráfico']],
      ['Ubicación', ['Mover gráfico']],
    ],
  };
  const CONTEXTUALES = ['Diseño de tabla', 'Análisis de tabla dinámica', 'Diseño de gráfico'];
  const ICONOS = {
    'Pegar': 'pegar', 'Cortar': 'cortar', 'Copiar': 'copiar', 'Copiar formato': 'brocha', 'Bordes': 'bordes', 'Color de relleno': 'relleno', 'Color de fuente': 'fuente',
    'Alinear a la izquierda': 'alIzq', 'Centrar': 'alCen', 'Alinear a la derecha': 'alDer', 'Ajustar texto': 'ajustar', 'Combinar y centrar': 'combinar',
    'Aumentar decimales': 'decMas', 'Disminuir decimales': 'decMenos', 'Formato condicional': 'condicional', 'Dar formato como tabla': 'tablaDatos', 'Estilos de celda': 'estilos',
    'Insertar': 'insertarFila', 'Eliminar': 'eliminar', 'Formato': 'estilos', 'Autosuma': 'autosuma', 'Rellenar': 'flecha', 'Ordenar y filtrar': 'ordenar', 'Buscar y seleccionar': 'buscar',
    'Tabla dinámica': 'tablaDatos', 'Tabla': 'tablaDatos', 'Imágenes': 'imagen', 'Formas': 'forma', 'Iconos': 'icono', 'Gráficos recomendados': 'grafico', 'Gráfico dinámico': 'grafico',
    'Insertar gráfico de columnas o de barras': 'grafico', 'Insertar gráfico de líneas o de áreas': 'grafico', 'Insertar gráfico circular o de anillos': 'grafico', 'Línea': 'grafico', 'Columna': 'grafico', 'Ganancia o pérdida': 'grafico',
    'Segmentación de datos': 'filtro', 'Escala de tiempo': 'reloj', 'Vínculo': 'vinculo', 'Cuadro de texto': 'cuadroTexto', 'Área de impresión': 'hoja', 'Imprimir títulos': 'hoja', 'Orientación': 'hoja', 'Márgenes': 'hoja',
    'Insertar función': 'evaluar', 'Administrador de nombres': 'nombre', 'Asignar nombre': 'nombre', 'Rastrear precedentes': 'precedentes', 'Quitar flechas': 'sinFlechas', 'Mostrar fórmulas': 'mostrarFormulas', 'Evaluar fórmula': 'evaluar', 'Comprobación de errores': 'check',
    'Ordenar de A a Z': 'ordenarAZ', 'Ordenar de Z a A': 'ordenarZA', 'Ordenar': 'ordenar', 'Filtro': 'filtro', 'Texto en columnas': 'textoColumnas', 'Relleno rápido': 'relampago', 'Quitar duplicados': 'duplicados', 'Validación de datos': 'validacion',
    'Análisis de hipótesis': 'objetivo', 'Nuevo comentario': 'comentario', 'Notas': 'nota', 'Proteger hoja': 'proteger', 'Proteger libro': 'proteger', 'Inmovilizar': 'inmovilizar', 'Macros': 'codigo', 'Visual Basic': 'codigo',
    'Grabar macro': 'grabar', 'Usar referencias relativas': 'precedentes', 'Seguridad de macros': 'proteger', 'Fila de totales': 'autosuma', 'Insertar segmentación de datos': 'filtro', 'Insertar escala de tiempo': 'reloj', 'Actualizar': 'reiniciar',
    'Agrupar selección': 'tablaDatos', 'Agregar elemento de gráfico': 'grafico', 'Cambiar tipo de gráfico': 'grafico', 'Seleccionar datos': 'tablaDatos', 'Configuración de campo': 'estilos',
  };

  /* preguntas: [{comando, ruta:[pestaña, botón, (submenú)], nota}] */
  function DondeEsta(cont, preguntas, alTerminar) {
    let idx = 0, fallos = 0, ruta = [];
    let pestana = 'Inicio';
    const enunciado = h('div', { class: 'donde-pregunta' });
    const cinta = h('div', { class: 'cinta', style: { position: 'relative' } });
    const retro = h('div', { class: 'retro', 'aria-live': 'polite' });
    cont.innerHTML = '';
    cont.append(enunciado, cinta, retro);

    const actual = () => preguntas[idx];
    function dibujarEnunciado() {
      enunciado.innerHTML = '';
      if (idx >= preguntas.length) {
        enunciado.appendChild(h('span', { class: 'q' }, '¡Listo! Ubicaste todos los comandos.'));
        return;
      }
      enunciado.append(h('span', { class: 'q' }, '¿Dónde está «' + actual().comando + '»?'), h('span', { class: 'donde-progreso' }, (idx + 1) + ' de ' + preguntas.length));
    }
    function dibujarCinta() {
      cinta.innerHTML = '';
      const pest = h('div', { class: 'cinta-pest', role: 'tablist' });
      const visibles = Object.keys(CINTA).filter((p) => !CONTEXTUALES.includes(p) || preguntas.some((q) => q.ruta[0] === p) || p === pestana);
      for (const p of visibles) {
        pest.appendChild(h('button', { class: p === pestana ? 'activa' : '', role: 'tab', 'aria-selected': p === pestana ? 'true' : 'false', title: CONTEXTUALES.includes(p) ? 'Pestaña contextual: aparece al seleccionar el objeto' : p, onclick: () => { pestana = p; ruta = [p]; dibujarCinta(); } }, p));
      }
      const cuerpo = h('div', { class: 'cinta-cuerpo' });
      for (const [grupo, cmds] of CINTA[pestana]) {
        const g = h('div', { class: 'cinta-grupo' });
        const lista = h('div', { class: 'cmds' });
        for (const cmd of cmds) {
          const nombre = Array.isArray(cmd) ? cmd[0] : cmd;
          const sub = Array.isArray(cmd) ? cmd[1] : null;
          const b = h('button', { class: 'cinta-cmd', title: nombre }, h('span', { class: 'ico', html: LT.iconoSVG(ICONOS[nombre] || 'hoja', 20) }), nombre + (sub ? ' ▾' : ''));
          b.addEventListener('click', (e) => elegir(pestana, nombre, sub, b, e));
          lista.appendChild(b);
        }
        g.append(lista, h('div', { class: 'nombre-grupo' }, grupo));
        cuerpo.appendChild(g);
      }
      cinta.append(pest, cuerpo);
    }
    function cerrarSub() { cinta.querySelectorAll('.cinta-sub').forEach((x) => x.remove()); }
    function elegir(p, nombre, sub, boton, e) {
      cerrarSub();
      if (idx >= preguntas.length) return;
      const q = actual();
      if (sub && q.ruta.length > 2) {
        // el comando buscado está dentro de un menú desplegable
        const menu = h('div', { class: 'cinta-sub' });
        const r = boton.getBoundingClientRect(), rc = cinta.getBoundingClientRect();
        menu.style.left = r.left - rc.left + 'px';
        menu.style.top = r.bottom - rc.top + 'px';
        for (const s of sub) menu.appendChild(h('button', { onclick: () => { cerrarSub(); comprobar([p, nombre, s], boton); } }, s));
        cinta.appendChild(menu);
        return;
      }
      comprobar([p, nombre], boton);
    }
    function comprobar(elegida, boton) {
      const q = actual();
      const ok = q.ruta.length === elegida.length && q.ruta.every((x, i) => x === elegida[i]);
      boton.classList.add(ok ? 'correcto' : 'incorrecto');
      setTimeout(() => boton.classList.remove('correcto', 'incorrecto'), 900);
      retro.innerHTML = '';
      if (ok) {
        retro.appendChild(h('div', { class: 'aviso-caja ok' }, '✓ Correcto: ', h('span', { class: 'donde-ruta', html: rutaHTML(q.ruta) }), q.nota ? h('div', { style: { marginTop: '4px', fontSize: '.86rem' } }, q.nota) : null));
        idx++; fallos = 0;
        dibujarEnunciado();
        if (idx >= preguntas.length && alTerminar) alTerminar();
      } else {
        fallos++;
        const pista = fallos >= 2 ? ' Pista: está en la pestaña «' + q.ruta[0] + '»' + (fallos >= 3 ? ', grupo de «' + grupoDe(q.ruta[0], q.ruta[1]) + '».' : '.') : ' Intenta de nuevo.';
        retro.appendChild(h('div', { class: 'aviso-caja alerta' }, 'Ese es «' + elegida[elegida.length - 1] + '» (' + elegida[0] + ').' + pista));
      }
    }
    dibujarEnunciado();
    dibujarCinta();
    return { reiniciar: () => { idx = 0; fallos = 0; dibujarEnunciado(); retro.innerHTML = ''; } };
  }
  function grupoDe(p, cmd) {
    for (const [g, cmds] of CINTA[p] || []) if (cmds.some((c) => (Array.isArray(c) ? c[0] : c) === cmd)) return g;
    return '';
  }
  function rutaHTML(ruta) {
    return ruta.map((x) => '<span>' + LT.u.esc(x) + '</span>').join('<i>›</i>');
  }
  function existeRuta(ruta) {
    const grupos = CINTA[ruta[0]];
    if (!grupos) return false;
    for (const [, cmds] of grupos) for (const c of cmds) {
      const n = Array.isArray(c) ? c[0] : c;
      if (n === ruta[1]) return ruta.length < 3 || (Array.isArray(c) && c[1].includes(ruta[2]));
    }
    return false;
  }

  LT.DondeEsta = DondeEsta;
  LT.cinta = { CINTA, rutaHTML, existeRuta, grupoDe };
})();
