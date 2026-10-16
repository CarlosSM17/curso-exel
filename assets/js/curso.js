/* Catálogo del curso: niveles, módulos, sesiones e insignias. */
(function () {
  'use strict';
  const LT = (window.LT = window.LT || {});

  const NIVELES = [
    { id: 'basico', nombre: 'Básico', horas: 'Horas 1 a 3', color: '#1e7145', capa: 'Capturar, calcular y presentar el reporte semanal.', modulos: [1, 2, 3, 4, 5, 6, 7], integrador: 'Reporte semanal de ventas' },
    { id: 'intermedio', nombre: 'Intermedio', horas: 'Horas 4 a 6', color: '#2463a6', capa: 'Limpiar, organizar y compartir la base de ventas.', modulos: [8, 9, 10, 11, 12], integrador: 'Base de pedidos confiable' },
    { id: 'avanzado', nombre: 'Avanzado', horas: 'Horas 7 a 9', color: '#7b3f9e', capa: 'Analizar el año, detectar errores y automatizar el reporte.', modulos: [13, 14, 15, 16, 17, 18, 19], integrador: 'Tablero anual automatizado' },
  ];

  // id, título, nivel, sesión, minutos, entorno, reto principal, glifo de insignia, micro-retos
  const MODULOS = [
    [1, 'Editar un libro de trabajo', 'basico', 1, 25, 'Simulador', 'Pasar a limpio la lista de precios', '✎', 3],
    [2, 'Fórmulas básicas', 'basico', 1, 35, 'Simulador', 'Corte de caja del día', 'Σ', 3],
    [3, 'Formato a hojas de trabajo', 'basico', 2, 30, 'Excel real', 'Reporte semanal presentable', 'A', 3],
    [4, 'Insertar objetos', 'basico', 2, 15, 'Excel real', 'Encabezado del menú con logo y enlace', '◆', 2],
    [5, 'Ver y administrar hojas de cálculo', 'basico', 2, 15, 'Excel real', 'Una hoja por sucursal y una de resumen', '▤', 2],
    [6, 'Gráficos', 'basico', 3, 35, 'Simulador + Excel real', '¿Qué producto vende más y cómo cambia por mes?', '▮', 3],
    [7, 'Imprimir y distribuir', 'basico', 3, 25, 'Excel real', 'El reporte cabe en una hoja y sale en PDF', '⎙', 2],
    [8, 'Fórmulas intermedias', 'intermedio', 4, 60, 'Simulador', 'Comisiones de los vendedores', 'ƒ', 4],
    [9, 'Organizar datos', 'intermedio', 5, 30, 'Simulador + Excel real', 'Limpiar la base de clientes', '⇅', 3],
    [10, 'Tablas', 'intermedio', 5, 30, 'Excel real', 'Tabla de pedidos con totales y filtros visuales', '▦', 2],
    [11, 'Formato intermedio', 'intermedio', 6, 35, 'Excel real', 'Semáforo de inventario', '●', 3],
    [12, 'Colaborar con Excel', 'intermedio', 6, 25, 'Excel real', 'Revisión del presupuesto en parejas', '✉', 2],
    [13, 'Tablas dinámicas', 'avanzado', 7, 40, 'Simulador + Excel real', '¿Qué sucursal vende más cada trimestre?', '⊞', 3],
    [14, 'Gráficos dinámicos', 'avanzado', 7, 20, 'Excel real', 'Mini tablero de ventas', '◩', 2],
    [15, 'Errores de fórmula', 'avanzado', 8, 15, 'Simulador', 'Cazador de errores: 8 errores sembrados', '⚠', 2],
    [16, 'Formato avanzado', 'avanzado', 8, 15, 'Excel real', 'Resaltar la fila completa de los pedidos atrasados', '#', 2],
    [17, 'Fórmulas avanzadas', 'avanzado', 8, 30, 'Simulador + Excel real', 'Buscador de productos por código', '⌕', 3],
    [18, 'Analizar datos', 'avanzado', 9, 30, 'Simulador + Excel real', '¿Cuántos cafés hay que vender para no perder?', '◎', 2],
    [19, 'Macros', 'avanzado', 9, 30, 'Excel de escritorio', 'Botón que da formato al reporte semanal', '▶', 2],
  ].map(([id, titulo, nivel, sesion, min, entorno, reto, glifo, micro]) => ({ id, titulo, nivel, sesion, min, entorno, reto, glifo, micro, slug: 'm' + String(id).padStart(2, '0') }));

  const SESIONES = [
    { n: 1, nivel: 'basico', modulos: [1, 2] }, { n: 2, nivel: 'basico', modulos: [3, 4, 5] }, { n: 3, nivel: 'basico', modulos: [6, 7] },
    { n: 4, nivel: 'intermedio', modulos: [8] }, { n: 5, nivel: 'intermedio', modulos: [9, 10] }, { n: 6, nivel: 'intermedio', modulos: [11, 12] },
    { n: 7, nivel: 'avanzado', modulos: [13, 14] }, { n: 8, nivel: 'avanzado', modulos: [15, 16, 17] }, { n: 9, nivel: 'avanzado', modulos: [18, 19] },
  ];

  function modulo(id) { return MODULOS.find((m) => m.id === +id) || null; }
  function nivel(id) { return NIVELES.find((n) => n.id === id) || null; }

  /* Insignia SVG de un módulo */
  function insignia(id, opc) {
    opc = opc || {};
    const m = modulo(id);
    const n = nivel(m.nivel);
    const t = opc.tam || 64;
    const color = n.color;
    const estrella = opc.estrella ? '<path d="M50 4l3.5 7.1 7.8 1.1-5.6 5.5 1.3 7.8L50 21.8l-7 3.7 1.3-7.8-5.6-5.5 7.8-1.1z" fill="#f5c542" stroke="#fff" stroke-width="1.5"/>' : '';
    return '<svg viewBox="0 0 100 100" width="' + t + '" height="' + t + '" role="img" aria-label="Insignia del módulo ' + id + ': ' + m.titulo + '">' +
      '<path d="M50 6 88 28v44L50 94 12 72V28z" fill="' + color + '"/>' +
      '<path d="M50 14 81 32v36L50 86 19 68V32z" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2"/>' +
      '<text x="50" y="56" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="#fff" font-weight="700">' + m.glifo + '</text>' +
      '<text x="50" y="76" text-anchor="middle" font-family="Segoe UI,Arial" font-size="12" fill="rgba(255,255,255,.9)" font-weight="700">M' + id + '</text>' + estrella + '</svg>';
  }

  LT.CURSO = { NIVELES, MODULOS, SESIONES, modulo, nivel, insignia, gerente: 'Marta Ríos', cafeteria: 'Cafetería La Taza' };
})();
