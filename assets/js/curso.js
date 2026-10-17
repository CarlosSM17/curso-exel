/* Catálogo del curso (versión 2): 13 módulos en 3 sesiones de 3 horas. */
(function () {
  'use strict';
  const LT = (window.LT = window.LT || {});

  const NIVELES = [
    { id: 'basico', nombre: 'Básico', sesion: 1, horas: 'Sesión 1 · 3 horas', color: '#1e7145', capa: 'Conocer Excel, capturar, calcular y presentar el reporte semanal.', modulos: [1, 2, 3, 4, 5, 6, 7], integrador: 'Reporte semanal de ventas' },
    { id: 'intermedio', nombre: 'Intermedio', sesion: 2, horas: 'Sesión 2 · 3 horas', color: '#2463a6', capa: 'Limpiar, organizar y dar formato a la base de ventas.', modulos: [8, 9, 10, 11], integrador: 'Base de pedidos confiable' },
    { id: 'avanzado', nombre: 'Avanzado', sesion: 3, horas: 'Sesión 3 · 3 horas', color: '#7b3f9e', capa: 'Analizar el año con tablas dinámicas y automatizar la gestión de pedidos.', modulos: [12, 13], integrador: 'Tablero y gestión automatizada' },
  ];

  // id, título, nivel, sesión, minutos, entorno, reto principal, glifo de insignia, micro-retos
  const MODULOS = [
    [1, 'Inicio: la pantalla de Excel', 'basico', 1, 15, 'Simulador + Excel real', 'Recorrido por la pantalla y tu barra de acceso rápido', '⌂', 3],
    [2, 'Editar un libro de trabajo', 'basico', 1, 20, 'Simulador', 'Pasar a limpio la lista de precios', '✎', 3],
    [3, 'Fórmulas básicas', 'basico', 1, 35, 'Simulador', 'Corte de caja del día', 'Σ', 3],
    [4, 'Formato a hojas de trabajo', 'basico', 1, 25, 'Excel real', 'Reporte semanal presentable', 'A', 3],
    [5, 'Insertar objetos', 'basico', 1, 15, 'Excel real', 'Encabezado del menú con logo y enlace', '◆', 2],
    [6, 'Ver y administrar hojas de cálculo', 'basico', 1, 15, 'Excel real', 'Una hoja por sucursal y una de resumen', '▤', 2],
    [7, 'Gráficos', 'basico', 1, 30, 'Simulador + Excel real', '¿Qué producto vende más y cómo cambia por mes?', '▮', 3],
    [8, 'Fórmulas intermedias', 'intermedio', 2, 50, 'Simulador', 'Comisiones de los vendedores', 'ƒ', 4],
    [9, 'Organizar datos', 'intermedio', 2, 35, 'Simulador + Excel real', 'Limpiar la base de clientes', '⇅', 3],
    [10, 'Tablas', 'intermedio', 2, 35, 'Excel real', 'Tabla de pedidos con totales y filtros visuales', '▦', 2],
    [11, 'Formato intermedio', 'intermedio', 2, 35, 'Excel real', 'Semáforo de inventario', '●', 3],
    [12, 'Tablas dinámicas', 'avanzado', 3, 70, 'Simulador + Excel real', 'Analizar el año: sucursales, trimestres y tablero', '⊞', 4],
    [13, 'Gestionar y automatizar información', 'avanzado', 3, 85, 'Simulador + Excel y Word', 'Registro de pedidos: captura, consulta, macro y cartas', '⚙', 4],
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

  LT.CURSO = { version: 2, NIVELES, MODULOS, SESIONES, modulo, nivel, agenda, insignia, gerente: 'Marta Ríos', cafeteria: 'Cafetería La Taza', formato: '3 sesiones de 3 horas' };
})();
