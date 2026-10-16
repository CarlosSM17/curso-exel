/* Páginas generales: inicio, prueba de ubicación, retos integradores, guía docente y glosario. */
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
        h('div', { class: 'chip', style: { background: 'rgba(255,255,255,.12)', color: '#f4e1cc', borderColor: 'rgba(255,255,255,.2)', marginBottom: '12px' } }, '9 horas · 19 módulos · 3 niveles'),
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
        h('span', { class: 'reto' }, 'Reúne los módulos del nivel en un solo libro. Unos 45 minutos, de forma autónoma.'),
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
        h('div', { class: 'tarjeta' }, h('h3', null, 'Lo que necesitas'), h('ul', null, h('li', null, 'Computadora con teclado y ratón, y un navegador actualizado.'), h('li', null, 'Excel de Microsoft 365 para Windows o Mac (recomendado). Excel para la web sirve en casi todos los módulos.'), h('li', null, 'Para el módulo 19 (Macros): Excel de escritorio. Excel para la web y iPad no ejecutan macros VBA.'), h('li', null, 'Para el módulo 12 (Colaborar): una cuenta Microsoft (personal o institucional) con OneDrive.'))),
        h('div', { class: 'tarjeta' }, h('h3', null, 'El caso: Cafetería La Taza'), h('p', null, 'Todos los módulos usan los mismos datos: el catálogo de 20 productos, las ventas de 2025 de las sucursales Centro, Norte y Sur, empleados, clientes, pedidos e inventario.'), h('div', { class: 'grupo-btn' }, h('a', { class: 'btn chico cafe', href: 'datos/la-taza-base.xlsx', download: 'la-taza-base.xlsx' }, LT.icono('descargar', 15), 'Libro de datos del caso'), h('a', { class: 'btn chico', href: 'glosario.html' }, 'Glosario español-inglés'))))));
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
      op('¿Cómo se llama la celda que está en la columna C y la fila 5?', ['5C', 'C5', 'C:5', 'F5C'], 1),
      op('¿Qué resultado da <code>=10-2*3</code>?', ['24', '4', '16', '-4'], 1),
      op('¿Qué función cuenta las celdas que contienen números?', ['SUMA', 'CONTAR', 'CONTARA', 'MAX'], 1),
      fx('En B7 escribe una fórmula que sume las ventas de B2 a B6.', { hojas: [{ nombre: 'Hoja1', datos: [['Día', 'Ventas'], ['Lun', 3200], ['Mar', 2950], ['Mié', 3410], ['Jue', 3600], ['Vie', 4120], ['Total']], objetivo: 'B7', filas: 8, cols: 4 }] }, 'B7', { B7: '=SUMA(B2:B6)' }, ['SUMA']),
      op('Escribes <b>CAF-009</b> en A1 y arrastras el controlador de relleno dos celdas hacia abajo. ¿Qué aparece en A3?', ['CAF-009', 'CAF-010', 'CAF-011', 'CAF-0011'], 2),
      op('Una celda guarda 0.35 y le das formato de porcentaje. ¿Qué se ve?', ['0.35%', '35%', '3.5%', '$0.35'], 1),
      op('¿En qué pestaña está «Inmovilizar paneles»?', ['Inicio', 'Datos', 'Vista', 'Revisar'], 2),
      op('Para mostrar cómo cambian las ventas mes a mes, ¿qué gráfico conviene?', ['Circular', 'Líneas', 'Dispersión', 'Anillos'], 1),
      op('Tu reporte sale en dos hojas al imprimir porque no caben las columnas. ¿Qué haces?', ['Ajustar todas las columnas en una página', 'Inmovilizar paneles', 'Borrar columnas', 'Cambiar el tema'], 0),
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
      op('Quieres preguntarle algo a un compañero dentro del libro y que te responda ahí mismo.', ['Nota', 'Comentario', 'Cuadro de texto', 'Hipervínculo'], 1),
      op('Proteges una hoja sin desbloquear ninguna celda. ¿Qué pasa?', ['Nadie puede capturar en ninguna celda', 'Solo se protegen las fórmulas', 'Solo se protegen las celdas con color', 'No pasa nada'], 0),
    ],
    avanzado: [
      op('En una tabla dinámica, ¿qué área usas para sumar el Total de ventas?', ['Filas', 'Columnas', 'Valores', 'Filtros'], 2),
      op('Pones la Fecha en Filas y quieres ver trimestres. ¿Qué haces?', ['Agrupar por trimestres', 'Ordenar por fecha', 'Cambiar el formato de fecha', 'Usar un filtro'], 0),
      op('<code>=BUSCARX("CAF-01", A2:A21, B2:B21)</code> devuelve #N/A. ¿Qué significa?', ['El valor buscado no existe tal cual', 'Falta un paréntesis', 'Se dividió entre cero', 'La función está mal escrita'], 0),
      op('Un margen da #¡DIV/0! porque un producto no tuvo ventas. ¿Qué es más adecuado?', ['=SI.ERROR(G9/F9,0)', 'Borrar la fórmula', 'Escribir 0 a mano en todas las filas', 'Ocultar la columna'], 0),
      op('¿Qué código de formato muestra 2501 como «PED-2501»?', ['PED-0', '"PED-"0', '[PED]0', '0"PED-"'], 1),
      op('Para pintar toda la fila si la columna I dice «Pendiente», aplicas a A2:I41 la fórmula…', ['=I2="Pendiente"', '=$I2="Pendiente"', '=$I$2="Pendiente"', '=I$2="Pendiente"'], 1),
      op('En <code>=BUSCARX(C2, A2:A21, D2:D21, "No existe")</code>, ¿qué es D2:D21?', ['Donde se busca', 'Lo que se devuelve', 'El valor buscado', 'El mensaje de error'], 1),
      fx('En F2 trae el precio del código de E2 desde la tabla A1:C6 (usa BUSCARX o INDICE+COINCIDIR).', { hojas: [{ nombre: 'Hoja1', datos: [['Código', 'Producto', 'Precio', '', 'Buscar', 'Precio'], ...D.productos.slice(0, 5).map((p) => [p.codigo, p.nombre, p.precio])], celdas: { E2: 'CAF-004' }, objetivo: 'F2', filas: 8, cols: 7 }] }, 'F2', { F2: '=BUSCARX(E2,A2:A6,C2:C6)' }, ['BUSCARX', 'INDICE', 'BUSCARV']),
      op('¿Qué herramienta encuentra cuántos cafés vender para que la utilidad sea 0?', ['Buscar objetivo', 'Tabla dinámica', 'Formato condicional', 'Ordenar'], 0),
      op('¿En qué formato se guarda un libro con macros?', ['.xlsx', '.xlsm', '.csv', '.pdf'], 1),
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
      titulo: 'Reporte semanal de ventas', archivo: 'int-basico.xlsx', acepta: '.xlsx,.pdf', pdf: true,
      situacion: 'Marta necesita el reporte semanal de la sucursal Sur listo para la junta: con los cálculos, presentable, con una gráfica y en PDF de una sola hoja.',
      tareas: ['En la hoja <b>Semana</b>: J4:J11 = unidades de la semana de cada producto (suma de Lun a Dom); K4:K11 = ventas (precio × unidades); J12 y K12 = totales; N4 = promedio de ventas por producto; N5 = venta mayor.', 'Formato: título destacado, encabezados A3:K3 en negrita con relleno, precio y ventas en moneda, bordes en A3:K12.', 'Un gráfico de columnas o barras de las ventas por producto, con título.', 'Impresión: horizontal, ajustada a una página. Exporta la hoja a PDF y sube el libro y el PDF juntos.'],
      pruebas: () => [
        { titulo: 'Unidades y ventas con fórmulas correctas', fn: (L, A) => { A.hoja('Semana'); for (let r = 4; r <= 11; r++) { let u = 0; for (const c of 'CDEFGHI') u += A.num(L.valor('Semana', c + r)) || 0; const p = A.num(L.valor('Semana', 'B' + r)); if (!L.tieneFormula('Semana', 'J' + r) || !A.cerca(A.num(L.valor('Semana', 'J' + r)), u)) return 'J' + r + ' debe sumar las unidades de la semana (' + u + ').'; if (!L.tieneFormula('Semana', 'K' + r) || !A.cerca(A.num(L.valor('Semana', 'K' + r)), u * p)) return 'K' + r + ' debe ser precio × unidades.'; } return true; } },
        { titulo: 'Totales y resumen', fn: (L, A) => { const ks = []; for (let r = 4; r <= 11; r++) ks.push(A.num(L.valor('Semana', 'K' + r))); const tot = ks.reduce((a, b) => a + b, 0); if (!A.cerca(A.num(L.valor('Semana', 'K12')), tot)) return 'K12 debe sumar las ventas.'; if (!A.cerca(A.num(L.valor('Semana', 'N4')), tot / 8)) return 'N4 debe ser el promedio de ventas por producto.'; return A.cerca(A.num(L.valor('Semana', 'N5')), Math.max(...ks)) ? true : 'N5 debe ser la venta mayor.'; } },
        { titulo: 'Formato del reporte', fn: (L, A) => { for (const x of L.celdasRango('A3:K3')) { const e = L.estilo('Semana', x.dir); if (!e.negrita || !e.relleno) return x.dir + ' debe ir en negrita y con relleno.'; } for (const d of ['B4', 'K4', 'K12']) if (!A.formatoMoneda(L.estilo('Semana', d).numFmt)) return d + ' debe tener formato de moneda.'; for (const x of L.celdasRango('A3:K12')) if (!L.estilo('Semana', x.dir).tieneBordes) return x.dir + ' no tiene bordes.'; return true; } },
        { titulo: 'Gráfico de ventas por producto', fn: (L) => { const g = L.graficos.find((x) => x.tipos.some((t) => t === 'columnas' || t === 'barras')); return g ? (g.tieneTitulo ? true : 'El gráfico necesita título.') : 'Falta el gráfico de columnas o barras.'; } },
        { titulo: 'Impresión en una página horizontal', fn: (L) => { const hj = L.hoja('Semana'); return hj.pagina.orientacion === 'landscape' && hj.ajustarAPagina && hj.pagina.ancho === 1 ? true : 'Configura orientación horizontal y ajusta a 1 página de ancho.'; } },
        { titulo: 'PDF de una página', fn: (L) => (!L.pdf ? 'Sube también el PDF.' : L.pdf.valido && L.pdf.paginas === 1 ? true : 'El PDF debe tener una sola página.') },
      ],
    },
    intermedio: {
      titulo: 'Base de pedidos confiable', archivo: 'int-intermedio.xlsx', acepta: '.xlsx',
      situacion: 'La base de pedidos tiene registros repetidos y nadie confía en los totales. Déjala limpia, con totales automáticos, alertas y las comisiones protegidas.',
      tareas: ['Hoja <b>Pedidos</b>: quita los registros duplicados.', 'Convierte los pedidos en una tabla llamada <b>Pedidos</b> con la columna calculada <b>Importe</b> (cantidad × precio) y la fila de totales.', 'Formato condicional: resalta los pedidos con Estado «Pendiente».', 'Hoja <b>Comisiones</b>: D2:D21 con la comisión (meta en F1, tasa en F2) y F4 con cuántos alcanzaron la meta.', 'Protege la hoja Comisiones dejando editables solo F1 y F2.'],
      pruebas: () => [
        { titulo: 'Sin pedidos duplicados', fn: (L, A) => { A.hoja('Pedidos'); const f = []; for (let r = 2; r <= 60; r++) { const v = L.valor('Pedidos', 'A' + r); if (v == null || v === '' || /total/i.test(String(v))) continue; if (f.includes(v)) return 'El folio ' + v + ' está repetido.'; f.push(v); } return f.length === 40 ? true : 'Deben quedar 40 pedidos (hay ' + f.length + ').'; } },
        { titulo: 'Tabla «Pedidos» con Importe y totales', fn: (L) => { const t = L.tablas.find((x) => /^pedidos$/i.test(x.nombre)); if (!t) return 'Convierte los datos en una tabla llamada Pedidos.'; const c = t.columnas.find((x) => /importe/i.test(x.nombre)); if (!c || !/cantidad/i.test(c.formulaCalculada || '') || !/precio/i.test(c.formulaCalculada || '')) return 'Agrega la columna calculada Importe = [@Cantidad]*[@Precio].'; return t.filaTotales ? true : 'Activa la fila de totales.'; } },
        { titulo: 'Pendientes resaltados', fn: (L) => (L.hoja('Pedidos').condicionales.some((x) => (x.formulas || []).concat([x.texto || '']).some((f) => /pendiente/i.test(f))) ? true : 'Agrega un formato condicional para los pedidos «Pendiente».') },
        { titulo: 'Comisiones correctas', fn: (L, A) => { A.hoja('Comisiones'); const meta = A.num(L.valor('Comisiones', 'F1')), tasa = A.num(L.valor('Comisiones', 'F2')); const mal = A.valoresMal('Comisiones', 'D2:D21', (d, r) => { const v = A.num(L.valor('Comisiones', 'C' + (r + 1))); return v >= meta ? v * tasa : 0; }); if (mal) return mal.dir + ' debería ser ' + A.fmtEs(mal.e) + '.'; if (A.sinFormula('Comisiones', 'D2:D21')) return 'Las comisiones deben ser fórmulas.'; const n = L.celdasRango('C2:C21').filter((x) => A.num(L.valor('Comisiones', x.dir)) >= meta).length; return A.cerca(A.num(L.valor('Comisiones', 'F4')), n) && L.usaFuncion('Comisiones', 'F4', ['COUNTIF', 'COUNTIFS']) ? true : 'F4 debe contar con CONTAR.SI cuántos alcanzaron la meta.'; } },
        { titulo: 'Comisiones protegidas (F1 y F2 editables)', fn: (L) => { const hj = L.hoja('Comisiones'); if (!hj.protegida) return 'Protege la hoja Comisiones.'; if (L.estilo('Comisiones', 'F1').bloqueada || L.estilo('Comisiones', 'F2').bloqueada) return 'Desbloquea F1 y F2 antes de proteger.'; return L.estilo('Comisiones', 'D2').bloqueada ? true : 'Las fórmulas de D deben quedar bloqueadas.'; } },
      ],
    },
    avanzado: {
      titulo: 'Tablero anual automatizado', archivo: 'int-avanzado.xlsx', acepta: '.xlsm',
      situacion: 'Para el cierre del año, Marta quiere un libro que analice solo: un tablero con filtros, un buscador de productos, escenarios de costos y un botón que dé formato al reporte.',
      tareas: ['Hoja nueva <b>Tablero</b>: tabla dinámica con la suma de Total por mes, gráfico dinámico y segmentación por Sucursal.', 'Hoja <b>Buscador</b>: C4 (producto), C5 (categoría) y C6 (precio) con BUSCARX a partir del código de C2.', 'Hoja <b>Modelo</b>: al menos dos escenarios (por ejemplo «Base» y «Optimista») cambiando los cafés vendidos (B5).', 'Una macro que dé formato a la hoja <b>Reporte</b> (encabezados en negrita y con relleno, ventas en moneda) asignada a un botón.', 'Guarda como <b>.xlsm</b> y súbelo.'],
      pruebas: () => [
        { titulo: 'Tablero con tabla y gráfico dinámicos', fn: (L) => (!L.dinamicas.length ? 'Falta la tabla dinámica.' : L.graficos.some((g) => g.dinamico) ? true : 'Falta el gráfico dinámico.') },
        { titulo: 'Segmentación por Sucursal', fn: (L) => (L.segmentaciones.some((s) => /sucursal/i.test(s.campo || s.nombre)) ? true : 'Falta la segmentación por Sucursal.') },
        { titulo: 'Buscador con BUSCARX', fn: (L, A) => { A.hoja('Buscador'); for (const d of ['C4', 'C5', 'C6']) if (!L.usaFuncion('Buscador', d, ['XLOOKUP', 'INDEX', 'VLOOKUP'])) return d + ' debe usar BUSCARX.'; const v = A.conCambios({ 'Buscador!C2': 'PAN-002' }); const n = v('Buscador', 'C4'); v.restaurar(); return String(n) === 'Concha' ? true : 'Con el código PAN-002, C4 debería mostrar «Concha».'; } },
        { titulo: 'Escenarios en el modelo', fn: (L) => (L.hoja('Modelo') && L.hoja('Modelo').escenarios.length >= 2 ? true : 'Crea al menos dos escenarios en la hoja Modelo.') },
        { titulo: 'Libro con macro y botón', fn: (L) => (!L.habilitadoMacros || !L.tieneVBA ? 'Guarda como .xlsm con la macro.' : L.hojas.some((x) => x.controles.some((c) => c.macro) || x.dibujo.conMacro.length) ? true : 'Asigna la macro a un botón.') },
        { titulo: 'Reporte con formato', fn: (L, A) => { A.hoja('Reporte'); const e = L.estilo('Reporte', 'A1'); if (!e.negrita || !e.relleno) return 'Ejecuta la macro: los encabezados de Reporte deben quedar en negrita y con relleno.'; return A.formatoMoneda(L.estilo('Reporte', 'D2').numFmt) ? true : 'Las ventas de Reporte deben quedar en moneda.'; } },
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
      h('p', { class: 'intro' }, 'Reúne lo aprendido en los módulos ' + nv.modulos[0] + ' a ' + nv.modulos[nv.modulos.length - 1] + '. Se resuelve de forma autónoma en unos 45 minutos, fuera de las 9 horas del curso.')));
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
      h('div', { class: 'widget' }, h('h3', null, 'Lo que debes entregar'), h('ol', { class: 'pasos-lab' }, I.tareas.map((t) => h('li', { html: t }))), h('a', { class: 'btn cafe', href: 'integradores/' + I.archivo, download: I.archivo }, LT.icono('descargar', 16), 'Descargar ' + I.archivo), I.acepta.includes('xlsm') ? h('p', { style: { fontSize: '.88rem', color: 'var(--tinta-2)', marginTop: '8px' } }, 'Necesitas Excel de escritorio para la macro; guarda como Libro de Excel habilitado para macros (.xlsm).') : null),
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

  /* ========================================================= DOCENTE */
  function docente() {
    const main = h('main', { class: 'contenedor' });
    main.appendChild(h('section', { class: 'seccion' }, h('div', { class: 'etiqueta-etapa' }, 'Guía docente'), h('h1', null, 'Cómo usar la plataforma en clase'),
      h('p', { class: 'intro' }, 'Nueve sesiones de 60 minutos (o tres de 3 horas, una por nivel, con un receso a la mitad). Cada sesión abre y cierra en 5 minutos; en medio, cada módulo recorre Ver → Completar y resolver → Transferir.')));
    // plan de sesiones
    const t = h('table', { class: 'tabla-sitio' }, h('thead', null, h('tr', null, ['Sesión', 'Nivel', 'Módulos', 'Minutos', 'Reto principal', 'Entorno'].map((x) => h('th', null, x)))));
    const tb = h('tbody');
    for (const s of C.SESIONES) for (const id of s.modulos) { const m = C.modulo(id); tb.appendChild(h('tr', null, h('td', null, id === s.modulos[0] ? String(s.n) : ''), h('td', null, C.nivel(m.nivel).nombre), h('td', null, h('a', { href: P.urlModulo(id) }, id + '. ' + m.titulo)), h('td', null, String(m.min)), h('td', null, m.reto), h('td', null, m.entorno))); }
    t.appendChild(tb);
    main.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'Plan de sesiones'), h('div', { class: 'tabla-scroll' }, t),
      h('h3', { style: { marginTop: '20px' } }, 'Secuencia de una sesión de 60 minutos'),
      h('ol', null, h('li', null, h('b', null, 'Arranque (5 min): '), 'reto relámpago en el simulador con una fórmula o un atajo de la sesión anterior (por ejemplo, un micro-reto).'), h('li', null, h('b', null, 'Ciclo por módulo: '), 'Ver (≈ 1/5 del tiempo: proyecta el ejemplo resuelto y el grupo predice), Completar y resolver (≈ 1/2: micro-retos y reto principal, cada quien en su nivel; atiende primero a quien lleva más tiempo atorado), Transferir (el resto: laboratorio en Excel real; lo pendiente queda como trabajo autónomo).'), h('li', null, h('b', null, 'Cierre (5 min): '), 'una persona muestra su solución, el grupo responde «¿Dónde está?» y se registran las insignias.')),
      h('p', null, 'La prueba de ubicación de cada nivel (al inicio) permite que quien ya domina el tema vaya directo a la etapa 4; la misma prueba al final mide el avance del grupo.')));
    // consolidar reportes
    const resultados = h('div');
    const sinInteg = h('input', { type: 'checkbox' });
    let reportes = [];
    const calcular = (d) => {
      const mods = C.MODULOS.map((m) => d.modulos[m.id] || {});
      const retos = mods.filter((m) => m.reto && m.reto.ok && (m.reto.nivel === 'analista' || m.reto.nivel === 'experto')).length;
      const labs = mods.filter((m) => m.lab && m.lab.ok).length;
      const integ = ['basico', 'intermedio', 'avanzado'].map((n) => (d.integradores[n] && d.integradores[n].puntaje) || 0);
      const pctR = retos / 19, pctL = labs / 19, pctI = integ.reduce((a, b) => a + b, 0) / 300;
      const cal = sinInteg.checked ? pctR * 30 + pctL * 70 : pctR * 30 + pctL * 30 + pctI * 40;
      return { retos, labs, integ, cal: Math.round(cal * 10) / 10 };
    };
    const dibujar = () => {
      resultados.innerHTML = '';
      if (!reportes.length) return;
      const tabla = h('table', { class: 'tabla-sitio' });
      tabla.appendChild(h('thead', null, h('tr', null, h('th', null, 'Participante'), h('th', null, 'Grupo'), C.MODULOS.map((m) => h('th', { title: m.titulo }, 'M' + m.id)), h('th', null, 'Retos'), h('th', null, 'Labs'), h('th', null, 'Integradores'), h('th', null, 'Ubicación (pre → post)'), h('th', null, 'Calificación'))));
      const tb2 = h('tbody');
      for (const r of reportes) {
        const d = r.datos;
        const c = calcular(d);
        const ub = ['basico', 'intermedio', 'avanzado'].map((n) => { const u = d.ubicacion[n] || {}; return (u.pre ? u.pre.puntaje : '–') + '→' + (u.post ? u.post.puntaje : '–'); }).join(' · ');
        tb2.appendChild(h('tr', null, h('td', null, (d.participante.nombre || '(sin nombre)') + (r.integro ? '' : ' ⚠')), h('td', null, d.participante.grupo || ''),
          C.MODULOS.map((m) => { const x = d.modulos[m.id] || {}; return h('td', { title: (x.reto && x.reto.ok ? 'Reto: ' + NIVEL_TXT[x.reto.nivel] : 'Reto pendiente') + (x.lab && x.lab.ok ? ' · Lab aprobado' : '') }, (x.reto && x.reto.ok ? x.reto.nivel[0].toUpperCase() : '·') + (x.lab && x.lab.ok ? '★' : '')); }),
          h('td', null, c.retos + '/19'), h('td', null, c.labs + '/19'), h('td', null, c.integ.join(' / ')), h('td', null, ub), h('td', null, h('b', null, String(c.cal)))));
      }
      tabla.appendChild(tb2);
      resultados.append(h('p', { style: { fontSize: '.88rem', color: 'var(--tinta-2)' } }, 'E/A/X = reto superado en nivel Explorador/Analista/Experto; ★ = laboratorio aprobado; ⚠ = el reporte fue editado a mano. La calificación cuenta los retos en nivel Analista o Experto (30 %), los laboratorios (30 %) y los integradores (40 %).'), h('div', { class: 'tabla-scroll' }, tabla),
        h('button', { class: 'btn chico', style: { marginTop: '10px' }, onclick: () => {
          const filas = [['Participante', 'Grupo', ...C.MODULOS.map((m) => 'M' + m.id + ' reto'), ...C.MODULOS.map((m) => 'M' + m.id + ' lab'), 'Retos', 'Labs', 'Int. básico', 'Int. intermedio', 'Int. avanzado', 'Calificación']];
          for (const r of reportes) { const d = r.datos; const c = calcular(d); filas.push([d.participante.nombre, d.participante.grupo, ...C.MODULOS.map((m) => { const x = d.modulos[m.id] || {}; return x.reto && x.reto.ok ? x.reto.nivel : ''; }), ...C.MODULOS.map((m) => { const x = d.modulos[m.id] || {}; return x.lab && x.lab.ok ? 'sí' : ''; }), c.retos, c.labs, ...c.integ, c.cal]); }
          const csv = '﻿' + filas.map((f) => f.map((x) => '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"').join(',')).join('\r\n');
          LT.u.descargar('calificaciones-la-taza.csv', csv, 'text/csv');
        } }, LT.icono('descargar', 15), 'Descargar CSV'));
    };
    sinInteg.addEventListener('change', dibujar);
    const inp = h('input', { type: 'file', accept: '.json', multiple: true, onchange: async (e) => {
      for (const f of e.target.files) { try { reportes.push(LT.progreso.leerReporte(await f.text())); } catch (er) { LT.ui.toast(f.name + ': ' + er.message, 'error'); } }
      dibujar();
    } });
    main.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'Consolidar reportes del grupo'),
      h('p', { class: 'intro' }, 'Cada participante descarga su reporte desde la página de inicio (botón «Reporte para el docente»). Selecciona aquí todos los archivos .json: se procesan en este navegador, sin enviarse a ningún servidor.'),
      h('div', { class: 'grupo-btn' }, inp, h('label', { class: 'en-linea', style: { display: 'flex', gap: '6px', alignItems: 'center' } }, sinInteg, 'Sin retos integradores (su 40 % pasa a los laboratorios)')), resultados));
    // libros
    const libros = h('ul');
    for (const m of C.MODULOS) {
      const def = LT.modulos[m.id];
      if (!def || !def.lab) continue;
      const sol = def.lab.archivo.replace('.xlsx', '-solucion.xlsx');
      libros.appendChild(h('li', null, 'M' + m.id + ': ', h('a', { href: 'laboratorios/' + def.lab.archivo, download: def.lab.archivo }, def.lab.archivo), ' · ', h('a', { href: 'laboratorios/soluciones/' + sol, download: sol }, 'solución')));
    }
    for (const n of ['basico', 'intermedio', 'avanzado']) libros.appendChild(h('li', null, 'Integrador ' + n + ': ', h('a', { href: 'integradores/' + INTEGRADORES[n].archivo }, INTEGRADORES[n].archivo), ' · ', h('a', { href: 'integradores/soluciones/' + INTEGRADORES[n].archivo.replace('.xlsx', '-solucion.xlsx') }, 'solución')));
    main.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'Libros de laboratorio y soluciones'), h('p', { class: 'intro' }, 'Las soluciones de los módulos 13, 14 y 19 (tablas dinámicas, segmentaciones y macros) incluyen los pasos en una hoja «Solución», porque esos objetos se crean dentro de Excel.'), libros, h('p', null, h('a', { class: 'btn chico cafe', href: 'datos/la-taza-base.xlsx' }, LT.icono('descargar', 15), 'Libro de datos del caso'))));
    // soluciones de retos
    const sols = h('div');
    for (const m of C.MODULOS) {
      const def = LT.modulos[m.id];
      if (!def || !def.reto) continue;
      const det = h('details', { class: 'tarjeta', style: { marginBottom: '10px', padding: '12px 16px' } }, h('summary', { style: { cursor: 'pointer', fontWeight: 600 } }, 'Módulo ' + m.id + '. ' + m.titulo + ' — ' + (def.reto.titulo || m.reto)));
      const r = def.reto;
      const base = r.base || {};
      if (base.solucion && Object.keys(base.solucion).length) det.appendChild(h('div', null, h('p', null, h('b', null, 'Solución (nivel Analista):')), h('ul', null, Object.entries(base.solucion).map(([k, v]) => h('li', null, h('code', null, k), ' → ', h('code', null, String(v)))))));
      for (const [n, nv] of Object.entries(r.niveles || {})) if (nv.solucion) det.appendChild(h('div', null, h('p', null, h('b', null, 'Solución (nivel ' + NIVEL_TXT[n] + '):')), h('ul', null, Object.entries(nv.solucion).map(([k, v]) => h('li', null, h('code', null, k), ' → ', h('code', null, String(v)))))));
      if (base.pistas && base.pistas.length) det.appendChild(h('div', null, h('p', null, h('b', null, 'Paso exacto (última pista):')), h('p', { html: base.pistas[base.pistas.length - 1] })));
      if (r.niveles && r.niveles.explorador && r.niveles.explorador.instrucciones) det.appendChild(h('div', null, h('p', null, h('b', null, 'Pasos del nivel Explorador:')), h('ol', null, r.niveles.explorador.instrucciones.map((x) => h('li', { html: x })))));
      sols.appendChild(det);
    }
    main.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'Solución de cada reto principal'), sols));
    // agregar retos
    main.appendChild(h('section', { class: 'seccion' }, h('h2', null, 'Cómo agregar retos nuevos'),
      h('p', null, 'Cada módulo vive en ', h('code', null, 'assets/js/modulos/mXX.js'), ' y se declara con ', h('code', null, 'LT.definirModulo({…})'), '. Un reto en el simulador tiene tres partes:'),
      h('pre', { class: 'mono', style: { background: '#fbfaf8', border: '1px solid var(--linea)', borderRadius: '10px', padding: '12px', overflow: 'auto', fontSize: '.85rem' } }, "base: {\n  hoja: { hojas: [{ nombre: 'Ventas', datos: [[...], ...], formatos: { 'C2:C21': '$#,##0' }, objetivo: 'D2:D21' }],\n          herramientas: ['formulas'] },\n  solucion: { 'D2:D21': '=SI(C2>=$F$1, C2*$F$2, 0)' },   // se copia hacia abajo como en Excel\n  pruebas: [\n    { tipo: 'formula', rango: 'D2:D21' },                  // hay fórmula, no un número\n    { tipo: 'valores', rango: 'D2:D21', mensaje: '{celda} muestra {obtenido}…' },\n    { tipo: 'usa', rango: 'F4', funciones: ['CONTAR.SI'] },\n    { tipo: 'robustez', cambios: { F1: 8000 }, rango: 'D2:D21' },  // recalcula con otros datos\n    { tipo: 'estilo', rango: 'A1', prop: 'b', valor: true },\n    { tipo: 'fn', fn: (x) => true || 'mensaje' },\n  ],\n  instrucciones: ['…'], pistas: ['concepto', 'sintaxis', 'paso exacto'],\n},\nniveles: { explorador: { plantilla: { celda: 'D2', texto: '=SI(C2>=___, …)' } }, experto: { pruebasExtra: [...] } }"),
      h('p', null, 'Los laboratorios declaran ', h('code', null, 'lab.pruebas: [{ titulo, fn(L, A, nivel) }]'), ', donde ', h('code', null, 'L'), ' es el libro leído (celdas, fórmulas en inglés, estilos, tablas, gráficos, tablas dinámicas, impresión) y ', h('code', null, 'A'), ' trae ayudas como ', h('code', null, 'A.sinFormula'), ', ', h('code', null, 'A.valoresMal'), ' y ', h('code', null, 'A.conCambios'), ' (recalcula el libro con otros datos). Los libros se generan con ', h('code', null, 'python herramientas/generar_libros.py'), '.'),
      h('h3', null, 'Cómo revisa un archivo el verificador'), h('p', null, 'Un .xlsx es un paquete comprimido de archivos XML. La página lo descomprime en el navegador (JSZip) y lee celdas, formatos, gráficos, tablas, tablas dinámicas, segmentaciones, configuración de página, comentarios y protección. Las fórmulas se guardan en inglés (SUMA se guarda como SUM y BUSCARX como _xlfn.XLOOKUP), por eso las pruebas usan esos nombres. En un .xlsm, la presencia de vbaProject.bin confirma que el libro guarda macros.')));
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
    main.append(h('section', { class: 'seccion' }, h('div', { class: 'etiqueta-etapa' }, 'Referencia'), h('h1', null, 'Glosario de funciones español-inglés'), h('p', { class: 'intro' }, 'Excel en español usa nombres traducidos (SUMA, SI, BUSCARX), pero el archivo los guarda en inglés (SUM, IF, _xlfn.XLOOKUP). En México el separador de argumentos es la coma; en otras configuraciones regionales es el punto y coma (el simulador acepta ambos).'), buscar),
      h('div', { class: 'tabla-scroll', style: { marginTop: '12px' } }, tabla),
      h('section', { class: 'seccion' }, h('h2', null, 'Atajos de teclado'), h('p', { class: 'intro' }, 'Atajos de Excel para Windows en español. En Mac, Ctrl suele ser ⌘.'), h('div', { class: 'tabla-scroll' }, atajos)));
    P.montar(main);
  }

  LT.paginas = { inicio, ubicacion, integrador, docente, glosario, PRUEBAS, INTEGRADORES };
})();
