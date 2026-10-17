/* Catálogo del curso «Excel para Ciencias de la Salud»: 13 módulos en 3 sesiones de 3 horas. */
(function () {
  'use strict';
  const LT = (window.LT = window.LT || {});

  const NIVELES = [
    { id: 'basico', nombre: 'Fundamentos', sesion: 1, horas: 'Sesión 1 · 3 horas', color: '#0f766e', capa: 'Consolidar lo básico: capturar, calcular con criterio clínico, presentar y graficar.', modulos: [1, 2, 3, 4, 5, 6, 7], integrador: 'Reporte semanal de atenciones' },
    { id: 'intermedio', nombre: 'Análisis de datos', sesion: 2, horas: 'Sesión 2 · 3 horas', color: '#2463a6', capa: 'Depurar, organizar y resumir datos de la clínica con tablas y tablas dinámicas.', modulos: [8, 9, 10, 11], integrador: 'Base de requisiciones confiable' },
    { id: 'avanzado', nombre: 'Gestión y tableros', sesion: 3, horas: 'Sesión 3 · 3 horas', color: '#7b3f9e', capa: 'Diseñar bases de datos, automatizar tareas, generar documentos y construir dashboards de indicadores.', modulos: [12, 13], integrador: 'Tablero y gestión automatizada' },
  ];

  // id, título, nivel, sesión, minutos, entorno, reto principal, glifo de insignia, micro-retos
  const MODULOS = [
    [1, 'Editar un libro de trabajo', 'basico', 1, 15, 'Simulador + Excel real', 'Depurar el catálogo de servicios', '✎', 3],
    [2, 'Fórmulas básicas', 'basico', 1, 25, 'Simulador + Excel real', 'Somatometría y balance hídrico del turno', 'Σ', 3],
    [3, 'Formato a hojas de trabajo', 'basico', 1, 20, 'Simulador + Excel real', 'Reporte semanal de atenciones presentable', 'A', 3],
    [4, 'Insertar objetos', 'basico', 1, 10, 'Simulador + Excel real', 'Encabezado de la hoja de indicaciones', '◆', 2],
    [5, 'Ver y administrar hojas de cálculo', 'basico', 1, 15, 'Simulador + Excel real', 'Una hoja por sede y una de resumen', '▤', 2],
    [6, 'Gráficos', 'basico', 1, 30, 'Simulador + Excel real', '¿Qué servicio se usa más y cuándo se vacuna más?', '▮', 3],
    [7, 'Fórmulas intermedias', 'basico', 1, 40, 'Simulador + Excel real', 'Clasificación de la glucosa en ayuno', 'ƒ', 4],
    [8, 'Organizar datos', 'intermedio', 2, 35, 'Simulador + Excel real', 'Depurar el padrón de pacientes', '⇅', 3],
    [9, 'Tablas', 'intermedio', 2, 30, 'Simulador + Excel real', 'Requisiciones de insumos con totales y filtros', '▦', 2],
    [10, 'Formato intermedio', 'intermedio', 2, 30, 'Simulador + Excel real', 'Semáforo de la farmacia', '●', 3],
    [11, 'Tablas dinámicas', 'intermedio', 2, 60, 'Simulador + Excel real', 'Atenciones del año: sedes, trimestres y tablero', '⊞', 4],
    [12, 'Gestionar y automatizar información', 'avanzado', 3, 85, 'Simulador + Excel y Word', 'Órdenes de estudios: captura, consulta, macro y cartas', '⚙', 4],
    [13, 'Dashboards', 'avanzado', 3, 70, 'Simulador + Excel real', 'Tablero del programa de enfermedades crónicas', '◔', 4],
  ].map(([id, titulo, nivel, sesion, min, entorno, reto, glifo, micro]) => ({ id, titulo, nivel, sesion, min, entorno, reto, glifo, micro, slug: 'm' + String(id).padStart(2, '0') }));

  /* Agenda de cada sesión de 180 minutos: números = módulos; [texto, minutos] = bloques fijos */
  const SESIONES = [
    { n: 1, nivel: 'basico', agenda: [['Arranque', 5], 1, 2, 3, 4, ['Receso', 15], 5, 6, 7, ['Cierre', 5]] },
    { n: 2, nivel: 'intermedio', agenda: [['Arranque', 5], 8, 9, ['Receso', 15], 10, 11, ['Cierre', 5]] },
    { n: 3, nivel: 'avanzado', agenda: [['Arranque', 5], 12, ['Receso', 15], 13, ['Cierre', 5]] },
  ].map((s) => Object.assign(s, { modulos: s.agenda.filter((x) => typeof x === 'number') }));

  function modulo(id) { return MODULOS.find((m) => m.id === +id) || null; }
  function nivel(id) { return NIVELES.find((n) => n.id === id) || null; }
  /* Agenda con horas de inicio y fin: [{tipo:'modulo'|'bloque', titulo, min, inicio, fin}] */
  function agenda(n) {
    const s = SESIONES.find((x) => x.n === n);
    let t = 0;
    const hhmm = (m) => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
    return s.agenda.map((x) => {
      const it = typeof x === 'number' ? { tipo: 'modulo', id: x, titulo: 'Módulo ' + x + '. ' + modulo(x).titulo, min: modulo(x).min } : { tipo: 'bloque', titulo: x[0], min: x[1] };
      it.inicio = hhmm(t); t += it.min; it.fin = hhmm(t);
      return it;
    });
  }

  function insignia(id, opc) {
    opc = opc || {};
    const m = modulo(id);
    const n = nivel(m.nivel);
    const t = opc.tam || 64;
    const estrella = opc.estrella ? '<path d="M50 4l3.5 7.1 7.8 1.1-5.6 5.5 1.3 7.8L50 21.8l-7 3.7 1.3-7.8-5.6-5.5 7.8-1.1z" fill="#f5c542" stroke="#fff" stroke-width="1.5"/>' : '';
    return '<svg viewBox="0 0 100 100" width="' + t + '" height="' + t + '" role="img" aria-label="Insignia del módulo ' + id + ': ' + m.titulo + '">' +
      '<path d="M50 6 88 28v44L50 94 12 72V28z" fill="' + n.color + '"/>' +
      '<path d="M50 14 81 32v36L50 86 19 68V32z" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/>' +
      '<text x="50" y="56" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="#fff" font-weight="700">' + m.glifo + '</text>' +
      '<text x="50" y="76" text-anchor="middle" font-family="Segoe UI,Arial" font-size="12" fill="rgba(255,255,255,.9)" font-weight="700">M' + id + '</text>' + estrella + '</svg>';
  }

  LT.CURSO = { version: 3, NIVELES, MODULOS, SESIONES, modulo, nivel, agenda, insignia, marca: 'Excel', coordinadora: 'Dra. Laura Méndez', institucion: 'Clínica Universitaria Vida Sana', formato: '3 sesiones de 3 horas' };
})();
