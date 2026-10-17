/* Páginas generales: inicio, prueba de ubicación, retos integradores y glosario.
   (La guía docente vive en docente/ y su contenido está cifrado.) */
(function () {
  'use strict';
  const LT = window.LT;
  const { h, esc } = LT.u;
  const C = LT.CURSO;
  const P = LT.pagina;
  const param = (n) => new URLSearchParams(location.search).get(n);
  const NIVEL_TXT = { explorador: 'Explorador', analista: 'Analista', experto: 'Experto' };

  /* ============================================================ INICIO */
  function inicio() {
    const prog = LT.progreso.cargar();
    const main = h('main');
    const total = C.MODULOS.length;
    const estados = C.MODULOS.map((m) => LT.progreso.estadoModulo(m.id));
    const insignias = estados.filter((e) => e.superado).length;
    const avance = Math.round(estados.reduce((s, e) => s + e.avance, 0) / total);
    const siguiente = C.MODULOS.find((m, i) => !estados[i].superado) || C.MODULOS[0];
    const nombre = h('input', { type: 'text', value: prog.participante.nombre || '', placeholder: 'Tu nombre completo', 'aria-label': 'Nombre' });
    const grupo = h('input', { type: 'text', value: prog.participante.grupo || '', placeholder: 'Grupo o área', 'aria-label': 'Grupo' });
    [nombre, grupo].forEach((x) => x.addEventListener('change', () => LT.progreso.participante({ nombre: nombre.value.trim(), grupo: grupo.value.trim() })));
    main.appendChild(h('section', { class: 'portada' }, h('div', { class: 'contenedor portada-grid' },
      h('div', null,
        h('div', { class: 'chip', style: { background: 'rgba(255,255,255,.12)', color: '#f4e1cc', borderColor: 'rgba(255,255,255,.2)', marginBottom: '12px' } }, '3 sesiones de 3 horas · 13 módulos · 3 niveles'),
        h('h1', null, 'Excel de básico a avanzado, resolviendo retos'),
        h('p', { class: 'lead' }, 'Eres el nuevo analista de la Cafetería La Taza: tres sucursales, 20 productos y un año de ventas. Cada módulo te pide una tarea real del negocio; la practicas en el simulador, que revisa tus fórmulas al instante, y la demuestras en Excel.'),
        h('div', { class: 'grupo-btn', style: { marginTop: '18px' } },
          h('a', { class: 'btn primario', href: P.urlModulo(siguiente.id) }, insignias ? 'Continuar: módulo ' + siguiente.id : 'Empezar con el módulo 1', ' →'),
          h('a', { class: 'btn fantasma', style: { color: '#fbefe2' }, href: 'ubicacion.html?nivel=basico' }, 'Prueba de ubicación'))),
      h('div', { class: 'ficha-participante' },
        h('div', { style: { fontWeight: 600, color: '#fff' } }, 'Tu avance'),
        h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '.9rem', margin: '8px 0 6px' } }, h('span', null, insignias + ' de ' + total + ' insignias'), h('span', null, avance + ' %')),
        h('div', { class: 'barra-avance' }, h('span', { style: { width: avance + '%' } })),
        h('label', null, 'Nombre'), nombre, h('label', null, 'Grupo'), grupo,
        h('div', { class: 'grupo-btn', style: { marginTop: '12px' } },
          h('button', { class: 'btn chico', onclick: () => { LT.progreso.participante({ nombre: nombre.value.trim(), grupo: grupo.value.trim() }); if (!nombre.value.trim()) { LT.ui.aviso('Falta tu nombre', 'Escribe tu nombre para que el docente identifique tu reporte.'); return; } LT.u.descargar('reporte-la-taza-' + nombre.value.trim().toLowerCase().replace(/\s+/g, '-') + '.json', LT.progreso.reporte(), 'application/json'); } }, LT.icono('descargar', 15), 'Reporte para el docente'),
          h('label', { class: 'btn chico fantasma', style: { color: '#fbefe2', cursor: 'pointer' } }, 'Cargar avance', h('input', { type: 'file', accept: '.json', class: 'sr', onchange: async (e) => { const f = e.target.files[0]; if (!f) return; try { const r = LT.progreso.importar(await f.text()); LT.ui.toast(r.integro ? 'Avance cargado.' : 'Avance cargado (el archivo fue modificado a mano).', r.integro ? 'ok' : 'aviso'); setTimeout(() => location.reload(), 600); } catch (er) { LT.ui.aviso('No se pudo cargar', er.message); } } }))),
        h('p', { style: { fontSize: '.78rem', color: '#e6cdb2', margin: '10px 0 0' } }, 'Tu avance se guarda en este navegador. Usa el reporte para entregarlo o para pasarlo a otra computadora.'))),
      h('div', { class: 'taza-fondo', html: LT.iconoSVG('taza', 300) })));

    const cont = h('div', { class: 'contenedor', id: 'modulos' });
    // cómo funciona
    cont.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'Cómo funciona cada módulo'),
      h('div', { class: 'grid-modulos', style: { gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' } },
        [['1', 'Ver', 'Un ejemplo resuelto: predices el resultado antes de verlo.'], ['2', 'Completar', 'Micro-retos de una sola función o comando.'], ['3', 'Resolver', 'El reto principal en el simulador, en nivel Explorador, Analista o Experto, con pistas y revisión instantánea.'], ['4', 'Transferir', 'Un laboratorio en Excel real: descargas el libro, lo resuelves y lo subes para revisarlo.']].map(([n, t, d]) => h('div', { class: 'tarjeta' }, h('div', { class: 'etiqueta-etapa' }, 'Etapa ' + n), h('h3', null, t), h('p', { style: { margin: 0, color: 'var(--tinta-2)', fontSize: '.93rem' } }, d))))));
    // ruta: 3 sesiones de 3 horas
    cont.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'La ruta: 3 sesiones de 3 horas'),
      h('p', { class: 'intro' }, 'Cada sesión cubre un nivel e incluye un receso de 15 minutos. El reto integrador de cada nivel se resuelve de forma autónoma después de la sesión.'),
      h('div', { class: 'ruta-sesiones' }, C.SESIONES.map((s) => {
        const nv = C.nivel(s.nivel);
        return h('div', { class: 'sesion-tarjeta', style: { borderTopColor: nv.color } },
          h('div', { class: 'sesion-cab' }, h('span', { class: 'chip ' + nv.id }, 'Sesión ' + s.n), h('b', null, 'Nivel ' + nv.nombre)),
          h('ol', { class: 'agenda' }, C.agenda(s.n).map((it) => h('li', { class: it.tipo }, h('span', { class: 'hora' }, it.inicio), it.tipo === 'modulo' ? h('a', { href: P.urlModulo(it.id) }, it.titulo) : h('span', null, it.titulo), h('span', { class: 'min' }, it.min + ' min')))));
      }))));
    // niveles
    for (const nv of C.NIVELES) {
      const ub = prog.ubicacion[nv.id];
      const bloque = h('section', { class: 'nivel-bloque', id: 'nivel-' + nv.id },
        h('div', { class: 'nivel-cab' },
          h('div', null, h('span', { class: 'chip ' + nv.id }, nv.horas), h('h2', { style: { marginTop: '6px' } }, 'Nivel ' + nv.nombre), h('p', { class: 'desc' }, nv.capa)),
          h('div', { class: 'grupo-btn' },
            h('a', { class: 'btn chico', href: 'ubicacion.html?nivel=' + nv.id }, ub && ub.pre ? 'Prueba de ubicación: ' + ub.pre.puntaje + '/' + ub.pre.total : 'Prueba de ubicación'),
            ub && ub.pre ? h('a', { class: 'btn chico fantasma', href: 'ubicacion.html?nivel=' + nv.id + '&momento=post' }, ub.post ? 'Prueba final: ' + ub.post.puntaje + '/' + ub.post.total : 'Prueba final') : null)));
      const grid = h('div', { class: 'grid-modulos' });
      for (const id of nv.modulos) {
        const m = C.modulo(id);
        const e = LT.progreso.estadoModulo(id);
        grid.appendChild(h('a', { class: 'tarjeta-modulo', href: P.urlModulo(id) },
          h('span', { class: 'insignia-mini', html: C.insignia(id, { tam: 40, estrella: e.estrella }), style: { filter: e.superado ? '' : 'grayscale(1) opacity(.35)' } }),
          h('span', { class: 'num' }, 'Módulo ' + id + ' · Sesión ' + m.sesion),
          h('h3', { style: { paddingRight: '40px' } }, m.titulo),
          h('span', { class: 'reto' }, 'Reto: ' + m.reto),
          h('div', { class: 'barra-avance', title: e.avance + ' % del módulo' }, h('span', { style: { width: e.avance + '%' } })),
          h('div', { class: 'meta' }, h('span', { class: 'chip' }, m.min + ' min'), h('span', { class: 'chip excel' }, m.entorno), e.superado ? h('span', { class: 'chip ok' }, '✓ ' + NIVEL_TXT[e.nivelReto]) : null, e.lab ? h('span', { class: 'chip ok' }, '✓ Lab') : null)));
      }
      const integ = prog.integradores[nv.id];
      grid.appendChild(h('a', { class: 'tarjeta-modulo tarjeta-especial', href: 'integrador.html?nivel=' + nv.id },
        h('span', { class: 'num' }, 'Reto integrador · Nivel ' + nv.nombre),
        h('h3', null, nv.integrador),
        h('span', { class: 'reto' }, 'Reúne los módulos del nivel en un solo libro. Unos 45 minutos, de forma autónoma, después de la sesión ' + nv.sesion + '.'),
        h('div', { class: 'meta' }, integ && integ.aprobado ? h('span', { class: 'chip ok' }, '✓ Constancia') : h('span', { class: 'chip pendiente' }, 'Pendiente'))));
      bloque.appendChild(grid);
      cont.appendChild(bloque);
    }
    // vitrina de insignias
    cont.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'Tus insignias'), h('p', { class: 'intro' }, 'Ganas la insignia al superar el reto principal de un módulo; la estrella, al aprobar también su laboratorio en Excel real.'),
      h('div', { class: 'vitrina' }, C.MODULOS.map((m, i) => h('div', { class: 'insignia' + (estados[i].superado ? '' : ' bloqueada') }, h('span', { html: C.insignia(m.id, { tam: 58, estrella: estados[i].estrella }) }), m.titulo)))));
    // requisitos
    cont.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'Antes de empezar'),
      h('div', { class: 'lab-grid' },
        h('div', { class: 'tarjeta' }, h('h3', null, 'Lo que necesitas'), h('ul', null, h('li', null, 'Computadora con teclado y ratón, y un navegador actualizado.'), h('li', null, 'Excel de Microsoft 365 para Windows o Mac (recomendado). Excel para la web sirve en casi todos los módulos.'), h('li', null, 'Para el módulo 13 (Gestionar y automatizar): Excel y Word de escritorio. Excel para la web y iPad no ejecutan macros VBA ni combinan correspondencia con Excel.'), h('li', null, 'Para repasar la sintaxis de una función, abre la ', h('a', { href: 'funciones.html' }, 'Guía gráfica de funciones'), '.'))),
        h('div', { class: 'tarjeta' }, h('h3', null, 'El caso: Cafetería La Taza'), h('p', null, 'Todos los módulos usan los mismos datos: el catálogo de 20 productos, las ventas de 2025 de las sucursales Centro, Norte y Sur, empleados, clientes, pedidos e inventario.'), h('div', { class: 'grupo-btn' }, h('a', { class: 'btn chico cafe', href: 'datos/la-taza-base.xlsx', download: 'la-taza-base.xlsx' }, LT.icono('descargar', 15), 'Libro de datos del caso'), h('a', { class: 'btn chico', href: 'funciones.html' }, 'Guía gráfica de funciones'), h('a', { class: 'btn chico', href: 'glosario.html' }, 'Glosario español-inglés'))))));
    main.appendChild(cont);
    P.montar(main);
    if (location.hash) setTimeout(() => { const t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }, 50);
  }

  /* ================================================= PRUEBA DE UBICACIÓN */
  const op = (texto, opciones, correcta, explicacion) => ({ tipo: 'opcion', texto, opciones, correcta, explicacion });
  const fx = (texto, hoja, celda, solucion, usa) => ({ tipo: 'formula', texto, hoja, celda, solucion, usa });
  const D = window.LA_TAZA;
  const PRUEBAS = {
    basico: [
      op('¿Qué parte de la ventana muestra el contenido real de la celda activa (por ejemplo, su fórmula)?', ['Barra de fórmulas', 'Cuadro de nombres', 'Barra de estado', 'Cinta de opciones'], 0),
      op('Excel se cerró de repente. ¿Qué función guarda copias periódicas para recuperar tu trabajo?', ['Autorrecuperación', 'Autocorrección', 'Autoajustar', 'Autofiltro'], 0),
      op('¿Cómo se llama la celda que está en la columna C y la fila 5?', ['5C', 'C5', 'C:5', 'F5C'], 1),
      op('¿Qué resultado da <code>=10-2*3</code>?', ['24', '4', '16', '-4'], 1),
      op('¿Qué función cuenta las celdas que contienen números?', ['SUMA', 'CONTAR', 'CONTARA', 'MAX'], 1),
      fx('En B7 escribe una fórmula que sume las ventas de B2 a B6.', { hojas: [{ nombre: 'Hoja1', datos: [['Día', 'Ventas'], ['Lun', 3200], ['Mar', 2950], ['Mié', 3410], ['Jue', 3600], ['Vie', 4120], ['Total']], objetivo: 'B7', filas: 8, cols: 4 }] }, 'B7', { B7: '=SUMA(B2:B6)' }, ['SUMA']),
      op('Escribes <b>CAF-009</b> en A1 y arrastras el controlador de relleno dos celdas hacia abajo. ¿Qué aparece en A3?', ['CAF-009', 'CAF-010', 'CAF-011', 'CAF-0011'], 2),
      op('Una celda guarda 0.35 y le das formato de porcentaje. ¿Qué se ve?', ['0.35%', '35%', '3.5%', '$0.35'], 1),
      op('Para mostrar cómo cambian las ventas mes a mes, ¿qué gráfico conviene?', ['Circular', 'Líneas', 'Dispersión', 'Anillos'], 1),
      op('¿Cómo traes el valor de B5 de la hoja Norte?', ['=Norte.B5', '=Norte!B5', '=B5!Norte', '=[Norte]B5'], 1),
    ],
    intermedio: [
      op('En <code>=C2*$F$1</code>, ¿qué pasa con <code>$F$1</code> al copiar la fórmula hacia abajo?', ['Cambia a F2', 'Se queda fija en F1', 'Cambia a $F$2', 'Marca error'], 1),
      fx('En C2 escribe una fórmula que muestre «Aprobado» si B2 es 70 o más, y «Revisar» si no. Cópiala hasta C5.', { hojas: [{ nombre: 'Hoja1', datos: [['Alumno', 'Puntos', 'Resultado'], ['Ana', 82], ['Beto', 69], ['Caro', 70], ['Dani', 45]], objetivo: 'C2:C5', filas: 7, cols: 4 }] }, 'C2:C5', { 'C2:C5': '=SI(B2>=70,"Aprobado","Revisar")' }, ['SI']),
      op('¿Cuál fórmula cuenta cuántas ventas de B2:B21 son de «Norte»?', ['=CONTAR(B2:B21,"Norte")', '=CONTAR.SI(B2:B21,"Norte")', '=SUMAR.SI(B2:B21,"Norte")', '=SI(B2:B21="Norte")'], 1),
      op('¿Dónde está «Quitar duplicados»?', ['Inicio', 'Datos', 'Insertar', 'Fórmulas'], 1),
      op('La columna A tiene «Lucía Pérez». ¿Qué herramienta separa nombre y apellido en dos columnas?', ['Texto en columnas', 'Combinar y centrar', 'Validación de datos', 'Ordenar'], 0),
      op('En una tabla, ¿qué significa <code>[@Cantidad]</code>?', ['La cantidad de la misma fila', 'La suma de la columna Cantidad', 'La primera cantidad', 'Un nombre definido'], 0),
      op('¿Por qué la fila de totales de una tabla usa SUBTOTALES?', ['Ignora las filas filtradas', 'Es más rápida', 'Redondea', 'Cuenta texto'], 0),
      op('Aplicas a C2:C16 la regla «menor que =$D2». ¿Con qué se compara C9?', ['D2', 'D9', 'C2', 'D16'], 1),
      op('Quieres que en la columna Estado solo se pueda elegir «Pendiente» o «Entregado». ¿Qué usas?', ['Validación de datos › Lista', 'Formato condicional', 'Proteger hoja', 'Texto en columnas'], 0),
      op('Escribes «Lucía» junto a «lucía pérez» y Excel propone completar toda la columna con ese patrón. ¿Cómo se llama?', ['Relleno rápido', 'Autosuma', 'Series', 'Autocompletar fórmula'], 0),
    ],
    avanzado: [
      op('En una tabla dinámica, ¿qué área usas para sumar el Total de ventas?', ['Filas', 'Columnas', 'Valores', 'Filtros'], 2),
      op('Pones la Fecha en Filas y quieres ver trimestres. ¿Qué haces?', ['Agrupar por trimestres', 'Ordenar por fecha', 'Cambiar el formato de fecha', 'Usar un filtro'], 0),
      op('¿Qué herramienta agrega botones para filtrar una tabla dinámica (y su gráfico) con un clic?', ['Segmentación de datos', 'Validación de datos', 'Formato condicional', 'Inmovilizar paneles'], 0),
      op('¿Qué es un gráfico dinámico?', ['Un gráfico conectado a una tabla dinámica que cambia con sus campos y filtros', 'Un gráfico con animación', 'Un minigráfico dentro de una celda', 'Un gráfico que se actualiza solo con internet'], 0),
      op('Quieres ver la venta más alta de cada sucursal en la tabla dinámica. ¿Qué haces?', ['Configuración de campo de valor › Resumir por Máx.', 'Ordenar de mayor a menor', 'Agregar un filtro', 'Agrupar'], 0),
      op('En una base de datos bien diseñada…', ['Cada fila es un registro y cada columna es un campo', 'Cada hoja es un registro', 'Los títulos van en celdas combinadas sobre los datos', 'Se deja una fila vacía entre meses'], 0),
      fx('En F2 trae el precio del código de E2 desde la tabla A1:C6 (usa BUSCARX o INDICE+COINCIDIR).', { hojas: [{ nombre: 'Hoja1', datos: [['Código', 'Producto', 'Precio', '', 'Buscar', 'Precio'], ...D.productos.slice(0, 5).map((p) => [p.codigo, p.nombre, p.precio])], celdas: { E2: 'CAF-004' }, objetivo: 'F2', filas: 8, cols: 7 }] }, 'F2', { F2: '=BUSCARX(E2,A2:A6,C2:C6)' }, ['BUSCARX', 'INDICE', 'BUSCARV']),
      op('¿En qué formato se guarda un libro con macros?', ['.xlsx', '.xlsm', '.csv', '.pdf'], 1),
      op('Abres un libro con macros y aparece la barra «Habilitar contenido». ¿Qué haces?', ['La habilito solo si confío en el origen del archivo', 'Siempre la habilito', 'Guardo como .xlsx para quitarla', 'Cierro Excel sin guardar'], 0),
      op('Al combinar correspondencia, ¿de dónde toma Word los datos de cada carta?', ['De una lista (por ejemplo, una hoja de Excel) donde cada fila es un destinatario', 'Del portapapeles', 'De las propiedades del documento', 'De una imagen de la tabla'], 0),
    ],
  };

  function ubicacion() {
    const nivelId = PRUEBAS[param('nivel')] ? param('nivel') : 'basico';
    const momento = param('momento') === 'post' ? 'post' : 'pre';
    const nv = C.nivel(nivelId);
    const items = PRUEBAS[nivelId];
    const main = h('main', { class: 'contenedor' });
    main.appendChild(h('section', { class: 'seccion' },
      h('div', { class: 'etiqueta-etapa' }, momento === 'pre' ? 'Prueba de ubicación' : 'Prueba final'),
      h('h1', null, 'Nivel ' + nv.nombre),
      h('p', { class: 'intro' }, momento === 'pre' ? 'Diez preguntas sobre los módulos ' + nv.modulos[0] + ' a ' + nv.modulos[nv.modulos.length - 1] + '. Si aciertas 8 o más, puedes ir directo a la etapa 4 (laboratorio en Excel) de cada módulo del nivel. Al terminar el nivel repetirás la misma prueba para medir tu avance.' : 'Las mismas preguntas de la prueba de ubicación, para medir cuánto avanzaste.'),
      h('div', { class: 'grupo-btn' }, C.NIVELES.map((n) => h('a', { class: 'btn chico' + (n.id === nivelId ? ' primario' : ''), href: 'ubicacion.html?nivel=' + n.id + (momento === 'post' ? '&momento=post' : '') }, n.nombre)))));
    const respuestas = {};
    const lista = h('div');
    items.forEach((it, i) => {
      const caja = h('div', { class: 'prueba-item' }, h('div', { class: 'num' }, 'Pregunta ' + (i + 1) + ' de ' + items.length), h('p', { style: { fontWeight: 600 }, html: it.texto }));
      if (it.tipo === 'opcion') {
        const ops = h('div', { class: 'opciones' });
        it.opciones.forEach((o, j) => {
          const b = h('button', { class: 'opcion', type: 'button' }, h('span', { class: 'letra' }, String.fromCharCode(65 + j)), h('span', { html: o }));
          b.addEventListener('click', () => { ops.querySelectorAll('.opcion').forEach((x) => x.classList.remove('elegida')); b.classList.add('elegida'); respuestas[i] = j === it.correcta; });
          ops.appendChild(b);
        });
        caja.appendChild(ops);
      } else {
        const hc = h('div', { id: LT.u.uid('hoja') });
        caja.appendChild(hc);
        setTimeout(() => {
          const hj = new LT.Hoja(hc, Object.assign({ altura: 200 }, it.hoja));
          const revisar = () => {
            const r = LT.verificar(hj, { solucion: it.solucion, pruebas: [{ tipo: 'formula', rango: it.celda }, { tipo: 'usa', rango: it.celda, funciones: it.usa, alguna: true }, { tipo: 'valores', rango: it.celda }] });
            respuestas[i] = r.ok;
          };
          hj.on('cambio', revisar);
          respuestas[i] = false;
        }, 0);
      }
      lista.appendChild(caja);
    });
    main.appendChild(lista);
    const resultado = h('div');
    main.appendChild(h('div', { class: 'grupo-btn', style: { margin: '16px 0 30px' } }, h('button', { class: 'btn primario', onclick: () => {
      const faltan = items.map((_, i) => i).filter((i) => !(i in respuestas));
      if (faltan.length) { LT.ui.aviso('Faltan respuestas', 'Contesta todas las preguntas (faltan: ' + faltan.map((i) => i + 1).join(', ') + ').'); return; }
      const puntaje = Object.values(respuestas).filter(Boolean).length;
      const prog = LT.progreso.cargar();
      prog.ubicacion[nivelId] = prog.ubicacion[nivelId] || {};
      prog.ubicacion[nivelId][momento] = { puntaje, total: items.length, fecha: new Date().toISOString() };
      if (momento === 'pre') prog.ubicacion[nivelId].salto = puntaje >= Math.ceil(items.length * 0.8);
      LT.progreso.guardar();
      resultado.innerHTML = '';
      const salto = momento === 'pre' && prog.ubicacion[nivelId].salto;
      const previo = prog.ubicacion[nivelId].pre;
      resultado.appendChild(h('div', { class: 'tarjeta resultado-prueba' },
        h('div', { class: 'grande' }, puntaje + ' / ' + items.length),
        momento === 'post' && previo ? h('p', null, 'En la prueba de ubicación obtuviste ' + previo.puntaje + ' / ' + previo.total + '. ' + (puntaje > previo.puntaje ? '¡Avanzaste ' + (puntaje - previo.puntaje) + ' aciertos!' : 'Repasa los módulos donde fallaste.')) : null,
        h('p', null, salto ? '¡Excelente! Puedes ir directo a la etapa 4 (laboratorio) de cada módulo de este nivel. Las etapas 1 a 3 siguen disponibles para repasar.' : momento === 'pre' ? 'Recorre los módulos del nivel en orden: cada uno empieza con un ejemplo resuelto.' : ''),
        h('div', { class: 'grupo-btn', style: { justifyContent: 'center' } }, nv.modulos.map((id) => h('a', { class: 'btn chico', href: P.urlModulo(id) + (salto ? '#etapa4' : '') }, 'Módulo ' + id)))));
      resultado.scrollIntoView({ behavior: 'smooth' });
    } }, 'Calificar')));
    main.appendChild(resultado);
    P.montar(main);
  }

  /* ===================================================== INTEGRADORES */
  const RUBRICA = [
    ['Exactitud', ['Resultados incorrectos', 'Correctos con errores aislados', 'Todos correctos', 'Correctos aun si cambian los datos']],
    ['Uso de herramientas', ['Valores escritos a mano', 'Usa algunas herramientas del nivel', 'Usa las que pide el reto', 'Elige la herramienta más eficiente']],
    ['Presentación', ['Difícil de leer', 'Formato inconsistente', 'Claro y consistente', 'Listo para entregar al gerente']],
    ['Explicación', ['No explica su libro', 'Explica con ayuda', 'Explica cómo lo hizo', 'Explica por qué eligió esa solución']],
  ];
  const INTEGRADORES = {
    basico: {
      titulo: 'Reporte semanal de ventas', archivo: 'int-basico.xlsx', acepta: '.xlsx',
      descargas: [{ ruta: 'assets/img/logo-la-taza.png', texto: 'Logo de La Taza (PNG)' }],
      situacion: 'Marta necesita el reporte semanal de la sucursal Sur listo para la junta: con los cálculos, presentable, con una gráfica, el logo y una hoja de resumen.',
      tareas: ['En la hoja <b>Semana</b>: J4:J11 = unidades de la semana de cada producto (suma de Lun a Dom); K4:K11 = ventas (precio × unidades); J12 y K12 = totales; N4 = promedio de ventas por producto; N5 = venta mayor.', 'Formato: título destacado, encabezados A3:K3 en negrita con relleno, precio y ventas en moneda, bordes en A3:K12.', 'Un gráfico de columnas o barras de las ventas por producto, con título.', 'Inserta el logo de La Taza en la hoja Semana.', 'Agrega una hoja llamada <b>Resumen</b> con el total de la semana en B2 (fórmula que tome <code>Semana!K12</code>).', 'Escribe el título del documento «Reporte semanal Sur» (Archivo › Información › Propiedades).'],
      pruebas: () => [
        { titulo: 'Unidades y ventas con fórmulas correctas', fn: (L, A) => { A.hoja('Semana'); for (let r = 4; r <= 11; r++) { let u = 0; for (const c of 'CDEFGHI') u += A.num(L.valor('Semana', c + r)) || 0; const p = A.num(L.valor('Semana', 'B' + r)); if (!L.tieneFormula('Semana', 'J' + r) || !A.cerca(A.num(L.valor('Semana', 'J' + r)), u)) return 'J' + r + ' debe sumar las unidades de la semana (' + u + ').'; if (!L.tieneFormula('Semana', 'K' + r) || !A.cerca(A.num(L.valor('Semana', 'K' + r)), u * p)) return 'K' + r + ' debe ser precio × unidades.'; } return true; } },
        { titulo: 'Totales y resumen', fn: (L, A) => { const ks = []; for (let r = 4; r <= 11; r++) ks.push(A.num(L.valor('Semana', 'K' + r))); const tot = ks.reduce((a, b) => a + b, 0); if (!A.cerca(A.num(L.valor('Semana', 'K12')), tot)) return 'K12 debe sumar las ventas.'; if (!A.cerca(A.num(L.valor('Semana', 'N4')), tot / 8)) return 'N4 debe ser el promedio de ventas por producto.'; return A.cerca(A.num(L.valor('Semana', 'N5')), Math.max(...ks)) ? true : 'N5 debe ser la venta mayor.'; } },
        { titulo: 'Formato del reporte', fn: (L, A) => { for (const x of L.celdasRango('A3:K3')) { const e = L.estilo('Semana', x.dir); if (!e.negrita || !e.relleno) return x.dir + ' debe ir en negrita y con relleno.'; } for (const d of ['B4', 'K4', 'K12']) if (!A.formatoMoneda(L.estilo('Semana', d).numFmt)) return d + ' debe tener formato de moneda.'; for (const x of L.celdasRango('A3:K12')) if (!L.estilo('Semana', x.dir).tieneBordes) return x.dir + ' no tiene bordes.'; return true; } },
        { titulo: 'Gráfico de ventas por producto', fn: (L) => { const g = L.graficos.find((x) => x.tipos.some((t) => t === 'columnas' || t === 'barras')); return g ? (g.tieneTitulo ? true : 'El gráfico necesita título.') : 'Falta el gráfico de columnas o barras.'; } },
        { titulo: 'Logo insertado', fn: (L) => (L.hoja('Semana').dibujo.imagenes.length ? true : 'Inserta el logo de La Taza en la hoja Semana (Insertar › Imágenes).') },
        { titulo: 'Hoja Resumen conectada', fn: (L, A) => { if (!L.hoja('Resumen')) return 'Agrega una hoja llamada «Resumen».'; const c = L.celda('Resumen', 'B2'); if (!c || c.f == null || !/semana/i.test(c.f)) return 'Resumen!B2 debe ser una fórmula que tome Semana!K12.'; return A.cerca(A.num(L.valor('Resumen', 'B2')), A.num(L.valor('Semana', 'K12'))) ? true : 'Resumen!B2 debe mostrar el total de la semana.'; } },
        { titulo: 'Título del documento', fn: (L) => (/reporte semanal/i.test(L.propiedades.titulo) ? true : 'Escribe el título «Reporte semanal Sur» en Archivo › Información › Propiedades.') },
      ],
    },
    intermedio: {
      titulo: 'Base de pedidos confiable', archivo: 'int-intermedio.xlsx', acepta: '.xlsx',
      situacion: 'La base de pedidos tiene registros repetidos y nadie confía en los totales. Déjala limpia, con totales automáticos, alertas, captura controlada y las comisiones del mes.',
      tareas: ['Hoja <b>Pedidos</b>: quita los registros duplicados.', 'Convierte los pedidos en una tabla llamada <b>Pedidos</b> con la columna calculada <b>Importe</b> (cantidad × precio) y la fila de totales.', 'Formato condicional: resalta los pedidos con Estado «Pendiente».', 'Lista desplegable en la columna <b>Estado</b> con «Pendiente» y «Entregado».', 'Hoja <b>Comisiones</b>: D2:D21 con la comisión (meta en F1, tasa en F2) y F4 con cuántos alcanzaron la meta.'],
      pruebas: () => [
        { titulo: 'Sin pedidos duplicados', fn: (L, A) => { A.hoja('Pedidos'); const f = []; for (let r = 2; r <= 60; r++) { const v = L.valor('Pedidos', 'A' + r); if (v == null || v === '' || /total/i.test(String(v))) continue; if (f.includes(v)) return 'El folio ' + v + ' está repetido.'; f.push(v); } return f.length === 40 ? true : 'Deben quedar 40 pedidos (hay ' + f.length + ').'; } },
        { titulo: 'Tabla «Pedidos» con Importe y totales', fn: (L) => { const t = L.tablas.find((x) => /^pedidos$/i.test(x.nombre)); if (!t) return 'Convierte los datos en una tabla llamada Pedidos.'; const c = t.columnas.find((x) => /importe/i.test(x.nombre)); if (!c || !/cantidad/i.test(c.formulaCalculada || '') || !/precio/i.test(c.formulaCalculada || '')) return 'Agrega la columna calculada Importe = [@Cantidad]*[@Precio].'; return t.filaTotales ? true : 'Activa la fila de totales.'; } },
        { titulo: 'Pendientes resaltados', fn: (L) => (L.hoja('Pedidos').condicionales.some((x) => (x.formulas || []).concat([x.texto || '']).some((f) => /pendiente/i.test(f))) ? true : 'Agrega un formato condicional para los pedidos «Pendiente».') },
        { titulo: 'Lista desplegable en Estado', fn: (L, A) => { const v = L.hoja('Pedidos').validaciones.find((x) => x.tipo === 'list' && A.rangoCubre(x.sqref, 'I2:I30')); if (!v) return 'Agrega una lista desplegable (Validación de datos › Lista) en la columna Estado.'; return /pendiente/i.test(v.formula1 || '') || /\$?[A-Z]{1,3}\$?\d/.test(v.formula1 || '') ? true : 'La lista debe ofrecer «Pendiente» y «Entregado».'; } },
        { titulo: 'Comisiones correctas', fn: (L, A) => { A.hoja('Comisiones'); const meta = A.num(L.valor('Comisiones', 'F1')), tasa = A.num(L.valor('Comisiones', 'F2')); const mal = A.valoresMal('Comisiones', 'D2:D21', (d, r) => { const v = A.num(L.valor('Comisiones', 'C' + (r + 1))); return v >= meta ? v * tasa : 0; }); if (mal) return mal.dir + ' debería ser ' + A.fmtEs(mal.e) + '.'; if (A.sinFormula('Comisiones', 'D2:D21')) return 'Las comisiones deben ser fórmulas.'; const n = L.celdasRango('C2:C21').filter((x) => A.num(L.valor('Comisiones', x.dir)) >= meta).length; return A.cerca(A.num(L.valor('Comisiones', 'F4')), n) && L.usaFuncion('Comisiones', 'F4', ['COUNTIF', 'COUNTIFS']) ? true : 'F4 debe contar con CONTAR.SI cuántos alcanzaron la meta.'; } },
      ],
    },
    avanzado: {
      titulo: 'Tablero y gestión automatizada', archivo: 'int-avanzado.xlsx', acepta: '.xlsm',
      situacion: 'Para el cierre del año, Marta quiere un libro que trabaje solo: un tablero de ventas con filtros y un registro de pedidos que se capture sin errores, busque precios, responda consultas y tenga un botón para limpiar la consulta.',
      tareas: ['Hoja nueva <b>Tablero</b>: tabla dinámica con la suma de Total por mes, gráfico dinámico y segmentación por Sucursal.', 'Hoja <b>Pedidos</b>: listas desplegables de clientes (C2:C60) y productos (D2:D60) y cantidad entera de 1 a 200 (E2:E60).', 'Pedidos: Precio (F) con BUSCARX desde el Catálogo e Importe (G) = Cantidad × Precio.', 'Hoja <b>Consulta</b>: C4 = número de pedidos y C5 = total comprado del cliente de C2.', 'Una macro que limpie Consulta!C2, asignada a un botón. Guarda como <b>.xlsm</b> y súbelo.'],
      pruebas: () => [
        { titulo: 'Tablero con tabla y gráfico dinámicos', fn: (L) => (!L.dinamicas.length ? 'Falta la tabla dinámica.' : L.graficos.some((g) => g.dinamico) ? true : 'Falta el gráfico dinámico.') },
        { titulo: 'Segmentación por Sucursal', fn: (L) => (L.segmentaciones.some((s) => /sucursal/i.test(s.campo || s.nombre)) ? true : 'Falta la segmentación por Sucursal.') },
        { titulo: 'Captura validada en Pedidos', fn: (L, A) => { const hj = A.hoja('Pedidos'); const v = (col) => hj.validaciones.find((x) => A.rangoCubre(x.sqref, col + '2:' + col + '31')); const c = v('C'), d = v('D'), e = v('E'); if (!c || c.tipo !== 'list') return 'Falta la lista desplegable de clientes en C2:C60.'; if (!d || d.tipo !== 'list') return 'Falta la lista desplegable de productos en D2:D60.'; return e && e.tipo === 'whole' && +e.formula1 === 1 && +e.formula2 === 200 ? true : 'En E2:E60 permite solo enteros de 1 a 200.'; } },
        { titulo: 'Precio con BUSCARX e importe', fn: (L, A) => { for (let r = 2; r <= 31; r++) { if (!L.usaFuncion('Pedidos', 'F' + r, ['XLOOKUP', 'INDEX', 'VLOOKUP'])) return 'F' + r + ' debe buscar el precio con BUSCARX.'; const cant = A.num(L.valor('Pedidos', 'E' + r)), pre = A.num(L.valor('Pedidos', 'F' + r)); if (!L.tieneFormula('Pedidos', 'G' + r) || !A.cerca(A.num(L.valor('Pedidos', 'G' + r)), cant * pre)) return 'G' + r + ' debe calcular Cantidad × Precio.'; } return true; } },
        { titulo: 'Consulta por cliente', fn: (L, A) => { A.hoja('Consulta'); if (!L.usaFuncion('Consulta', 'C4', ['COUNTIF', 'COUNTIFS']) || !L.usaFuncion('Consulta', 'C5', ['SUMIF', 'SUMIFS'])) return 'Usa CONTAR.SI en C4 y SUMAR.SI en C5.'; const v = A.conCambios({ 'Consulta!C2': 'Agencia Pixel' }); let n = 0, t = 0; for (let r = 2; r <= 60; r++) if (v('Pedidos', 'C' + r) === 'Agencia Pixel') { n++; t += A.num(v('Pedidos', 'G' + r)) || 0; } const ok = A.cerca(A.num(v('Consulta', 'C4')), n) && A.cerca(A.num(v('Consulta', 'C5')), t); v.restaurar(); return ok ? true : 'Con otro cliente en C2 la consulta no se actualiza bien.'; } },
        { titulo: 'Libro con macro y botón', fn: (L) => (!L.habilitadoMacros || !L.tieneVBA ? 'Guarda como .xlsm con la macro.' : L.hojas.some((x) => x.controles.some((c) => c.macro) || x.dibujo.conMacro.length) ? true : 'Asigna la macro a un botón.') },
      ],
    },
  };

  function integrador() {
    const nivelId = INTEGRADORES[param('nivel')] ? param('nivel') : 'basico';
    const nv = C.nivel(nivelId);
    const I = INTEGRADORES[nivelId];
    const prog = LT.progreso.cargar();
    const guardado = prog.integradores[nivelId] || {};
    const main = h('main', { class: 'contenedor' });
    main.appendChild(h('section', { class: 'seccion' },
      h('div', { class: 'etiqueta-etapa' }, 'Reto integrador · Nivel ' + nv.nombre),
      h('h1', null, I.titulo),
      h('div', { class: 'grupo-btn' }, C.NIVELES.map((n) => h('a', { class: 'btn chico' + (n.id === nivelId ? ' primario' : ''), href: 'integrador.html?nivel=' + n.id }, n.nombre))),
      h('div', { class: 'situacion' }, h('div', { class: 'avatar' }, 'M'), h('div', null, h('div', { class: 'de' }, 'Marta Ríos, gerente general de La Taza escribe:'), h('div', { class: 'msj' }, I.situacion))),
      h('p', { class: 'intro' }, 'Reúne lo aprendido en los módulos ' + nv.modulos[0] + ' a ' + nv.modulos[nv.modulos.length - 1] + '. Se resuelve de forma autónoma en unos 45 minutos, después de la sesión ' + nv.sesion + '.')));
    const res = h('div');
    const inp = h('input', { type: 'file', accept: I.acepta, multiple: I.pdf ? true : null, class: 'sr' });
    const zona = h('label', { class: 'zona-subir', tabindex: '0' }, inp, LT.icono('subir', 30), h('div', null, h('b', null, 'Sube tu libro resuelto')), h('p', null, 'Archivo ' + I.acepta.replace(',', ' y ') + (I.pdf ? ' (selecciona ambos a la vez)' : '') + '.'));
    const procesar = async (archivos) => {
      res.innerHTML = '';
      const libro = Array.from(archivos).find((f) => /\.xls[xm]$/i.test(f.name));
      const pdf = Array.from(archivos).find((f) => /\.pdf$/i.test(f.name));
      if (!libro) { res.appendChild(h('div', { class: 'aviso-caja error' }, 'Sube un libro de Excel.')); return; }
      try {
        const L = await LT.xlsx.leer(libro, libro.name);
        L.pdf = pdf ? await LT.xlsx.paginasPDF(pdf) : null;
        const r = LT.xlsx.revisar(L, I.pruebas(), 'analista');
        const ok = r.filter((x) => x.ok).length;
        const pct = Math.round((ok / r.length) * 100);
        const aprobado = pct >= 80;
        LT.progreso.cargar().integradores[nivelId] = Object.assign({}, LT.progreso.cargar().integradores[nivelId], { puntaje: pct, aprobado: aprobado || !!guardado.aprobado, fecha: new Date().toISOString(), archivo: libro.name });
        LT.progreso.guardar();
        res.append(h('p', null, h('b', null, ok + ' de ' + r.length + ' pruebas superadas (' + pct + ' %).')), LT.modulo.resultadosLista(r, true));
        if (aprobado) res.appendChild(h('div', { class: 'exito' }, h('div', { html: LT.iconoSVG('trofeo', 44) }), h('div', null, h('h4', null, '¡Reto integrador aprobado!'), h('p', null, 'Ya puedes imprimir tu constancia de nivel (abajo).'))));
        dibujarConstancia();
      } catch (e) { res.appendChild(h('div', { class: 'aviso-caja error' }, e.message)); }
      inp.value = '';
    };
    inp.addEventListener('change', () => procesar(inp.files));
    zona.addEventListener('dragover', (e) => { e.preventDefault(); zona.classList.add('encima'); });
    zona.addEventListener('dragleave', () => zona.classList.remove('encima'));
    zona.addEventListener('drop', (e) => { e.preventDefault(); zona.classList.remove('encima'); procesar(e.dataTransfer.files); });
    main.appendChild(h('div', { class: 'lab-grid' },
      h('div', { class: 'widget' }, h('h3', null, 'Lo que debes entregar'), h('ol', { class: 'pasos-lab' }, I.tareas.map((t) => h('li', { html: t }))), h('div', { class: 'grupo-btn' }, h('a', { class: 'btn cafe', href: 'integradores/' + I.archivo, download: I.archivo }, LT.icono('descargar', 16), 'Descargar ' + I.archivo), (I.descargas || []).map((d) => h('a', { class: 'btn chico', href: d.ruta, download: d.ruta.split('/').pop() }, LT.icono('descargar', 15), d.texto))), I.acepta.includes('xlsm') ? h('p', { style: { fontSize: '.88rem', color: 'var(--tinta-2)', marginTop: '8px' } }, 'Necesitas Excel de escritorio para la macro; guarda como Libro de Excel habilitado para macros (.xlsm).') : null),
      h('div', { class: 'widget' }, h('h3', null, 'Verificador'), zona, res)));
    // rúbrica de autoevaluación
    const sel = Object.assign({}, guardado.rubrica || {});
    const tabla = h('table', { class: 'tabla-sitio rubrica' });
    const dibujarRubrica = () => {
      tabla.innerHTML = '';
      tabla.appendChild(h('thead', null, h('tr', null, h('th', null, 'Criterio'), ['Inicial (1)', 'En desarrollo (2)', 'Logrado (3)', 'Destacado (4)'].map((x) => h('th', null, x)))));
      const tb = h('tbody');
      RUBRICA.forEach(([crit, niveles]) => tb.appendChild(h('tr', null, h('th', null, crit), niveles.map((t, j) => h('td', { class: 'clic' + (sel[crit] === j + 1 ? ' sel' : ''), tabindex: '0', onclick: () => { sel[crit] = j + 1; const p = LT.progreso.cargar(); p.integradores[nivelId] = Object.assign({}, p.integradores[nivelId], { rubrica: Object.assign({}, sel) }); LT.progreso.guardar(); dibujarRubrica(); } }, t)))));
      tabla.appendChild(tb);
    };
    dibujarRubrica();
    main.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'Rúbrica'), h('p', { class: 'intro' }, 'Autoevalúate haciendo clic en el nivel que alcanzaste en cada criterio. El docente revisa la rúbrica junto con tu archivo.'), h('div', { class: 'tabla-scroll' }, tabla)));
    const constCont = h('section', { class: 'seccion' });
    main.appendChild(constCont);
    const dibujarConstancia = () => {
      constCont.innerHTML = '';
      const info = LT.progreso.cargar().integradores[nivelId] || {};
      if (!info.aprobado) { constCont.append(h('h2', null, 'Constancia'), h('p', { class: 'intro' }, 'La constancia de nivel se habilita al aprobar el reto integrador (80 % de las pruebas o más).')); return; }
      const nombre = LT.progreso.participante().nombre || '(escribe tu nombre en la página de inicio)';
      constCont.append(h('div', { class: 'grupo-btn no-imprimir' }, h('h2', { style: { margin: 0 } }, 'Constancia'), h('button', { class: 'btn primario chico', onclick: () => window.print() }, 'Imprimir o guardar en PDF')),
        h('div', { class: 'constancia' }, h('div', { html: LT.GALERIA.logoSVG, style: { width: '90px', margin: '0 auto' } }), h('p', null, 'Excel con La Taza otorga la presente'), h('h1', null, 'Constancia de Analista ' + nv.nombre), h('p', null, 'a'), h('div', { class: 'nombre' }, nombre), h('p', null, 'por aprobar el reto integrador «' + I.titulo + '» del nivel ' + nv.nombre.toLowerCase() + ' (' + nv.horas.toLowerCase() + ' del curso Excel de básico a avanzado).'), h('p', { style: { color: 'var(--tinta-3)', fontSize: '.9rem' } }, new Date(info.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) + ' · Puntaje del verificador: ' + info.puntaje + ' %')));
    };
    dibujarConstancia();
    P.montar(main);
  }

  /* ========================================================= GLOSARIO */
  function glosario() {
    const main = h('main', { class: 'contenedor' });
    const buscar = h('input', { class: 'buscador', type: 'search', placeholder: 'Buscar en español o inglés (por ejemplo: buscar, IF, contar)', 'aria-label': 'Buscar función' });
    const tabla = h('table', { class: 'tabla-sitio' });
    const dibujar = () => {
      const q = buscar.value.trim().toLowerCase();
      tabla.innerHTML = '';
      tabla.appendChild(h('thead', null, h('tr', null, ['Función (español)', 'En inglés / en el archivo', 'Sintaxis', 'Qué hace', 'Ejemplo de La Taza', 'Módulo'].map((x) => h('th', null, x)))));
      const tb = h('tbody');
      Object.values(LT.FUNCIONES).filter((f) => !q || [f.es, f.en, f.desc, f.categoria].some((x) => x.toLowerCase().includes(q))).sort((a, b) => a.es.localeCompare(b.es, 'es')).forEach((f) => {
        tb.appendChild(h('tr', null, h('td', null, h('b', null, f.es), f.simulador ? null : h('div', { style: { fontSize: '.78rem', color: 'var(--ambar)' } }, 'Solo en Excel')), h('td', null, h('code', null, f.en), f.archivo !== f.en ? h('div', { style: { fontSize: '.78rem', color: 'var(--tinta-3)' } }, f.archivo) : null), h('td', null, h('code', { style: { whiteSpace: 'normal' } }, f.sintaxis)), h('td', null, f.desc), h('td', null, f.ejemplo), h('td', null, h('a', { href: P.urlModulo(f.modulo) }, 'M' + f.modulo))));
      });
      tabla.appendChild(tb);
    };
    buscar.addEventListener('input', dibujar);
    dibujar();
    const atajos = h('table', { class: 'tabla-sitio' }, h('thead', null, h('tr', null, h('th', null, 'Atajo'), h('th', null, 'Qué hace'), h('th', null, 'Módulo'))), h('tbody', null, LT.ATAJOS.map(([a, d, m]) => h('tr', null, h('td', null, h('kbd', null, a)), h('td', null, d), h('td', null, h('a', { href: P.urlModulo(m) }, 'M' + m))))));
    main.append(h('section', { class: 'seccion' }, h('div', { class: 'etiqueta-etapa' }, 'Referencia'), h('h1', null, 'Glosario de funciones español-inglés'), h('p', { class: 'intro' }, 'Excel en español usa nombres traducidos (SUMA, SI, BUSCARX), pero el archivo los guarda en inglés (SUM, IF, _xlfn.XLOOKUP). En México el separador de argumentos es la coma; en otras configuraciones regionales es el punto y coma (el simulador acepta ambos). Para ver cómo trabaja cada función con un ejemplo dibujado, abre la ', h('a', { href: 'funciones.html' }, 'Guía gráfica de funciones'), '.'), buscar),
      h('div', { class: 'tabla-scroll', style: { marginTop: '12px' } }, tabla),
      h('section', { class: 'seccion' }, h('h2', null, 'Atajos de teclado'), h('p', { class: 'intro' }, 'Atajos de Excel para Windows en español. En Mac, Ctrl suele ser ⌘.'), h('div', { class: 'tabla-scroll' }, atajos)));
    P.montar(main);
  }

  LT.paginas = { inicio, ubicacion, integrador, glosario, PRUEBAS, INTEGRADORES, RUBRICA, NIVEL_TXT };
})();
