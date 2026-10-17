/* Utilidades compartidas por las definiciones de módulos: datos del caso Clínica Vida Sana ya preparados. */
(function () {
  'use strict';
  const LT = window.LT;
  const D = window.CASO;
  const fecha = (iso) => { const [y, m, d] = iso.split('-'); return d + '/' + m + '/' + y; };
  const serial = (iso) => LT.fechas.deISO(iso);
  const servicio = (cod) => D.servicios.find((s) => s.codigo === cod);
  const SEDES = ['Centro', 'Norte', 'Sur'];

  /* Suma de un campo de las atenciones agrupada por otra clave: {clave: suma} */
  function totalesPor(clave, filtro, campo) {
    campo = campo || 'atenciones';
    const o = {};
    for (const v of D.atenciones) { if (filtro && !filtro(v)) continue; o[v[clave]] = (o[v[clave]] || 0) + v[campo]; }
    return o;
  }
  function trimestre(iso) { return Math.floor((+iso.slice(5, 7) - 1) / 3) + 1; }
  function mes(iso) { return +iso.slice(5, 7); }
  /* Sede líder (más atenciones) por trimestre: [ 'Centro', ... ] */
  function lideresTrimestre(filtro) {
    const out = [];
    for (let q = 1; q <= 4; q++) {
      const t = totalesPor('sede', (v) => trimestre(v.fecha) === q && (!filtro || filtro(v)));
      out.push(Object.entries(t).sort((a, b) => b[1] - a[1])[0][0]);
    }
    return out;
  }
  /* Atenciones mensuales por área: {area: [12]} */
  function mensualPorArea() {
    const o = {};
    for (const a of D.areas) o[a] = new Array(12).fill(0);
    for (const v of D.atenciones) o[v.area][mes(v.fecha) - 1] += v.atenciones;
    return o;
  }
  function mensualPorSede(filtro) {
    const o = { Centro: new Array(12).fill(0), Norte: new Array(12).fill(0), Sur: new Array(12).fill(0) };
    for (const v of D.atenciones) if (!filtro || filtro(v)) o[v.sede][mes(v.fecha) - 1] += v.atenciones;
    return o;
  }
  /* Filas de atenciones para tablas dinámicas */
  function filasDinamica() {
    return D.atenciones.map((v) => ({ Folio: v.folio, Fecha: v.fecha, Sede: v.sede, 'Código': v.codigo, Servicio: v.servicio, 'Área': v.area, Atenciones: v.atenciones, Cuota: v.cuota, Ingresos: v.ingresos, Profesional: v.profesional, Pago: v.pago }));
  }
  const CAMPOS_DINAMICA = [
    { nombre: 'Folio', tipo: 'texto' }, { nombre: 'Fecha', tipo: 'fecha' }, { nombre: 'Sede', tipo: 'texto' }, { nombre: 'Código', tipo: 'texto' },
    { nombre: 'Servicio', tipo: 'texto' }, { nombre: 'Área', tipo: 'texto' }, { nombre: 'Atenciones', tipo: 'numero', formato: '#,##0' },
    { nombre: 'Cuota', tipo: 'numero', formato: '$#,##0' }, { nombre: 'Ingresos', tipo: 'numero', formato: '$#,##0' }, { nombre: 'Profesional', tipo: 'texto' }, { nombre: 'Pago', tipo: 'texto' },
  ];
  /* Consultas del programa de crónicos para el tablero */
  function filasCronicos() {
    return D.cronicos.map((c) => ({ Folio: c.folio, Fecha: c.fecha, Sede: c.sede, Programa: c.programa, Sexo: c.sexo, Edad: c.edad, Controlado: c.controlado, Espera: c.espera }));
  }

  /* Reporte semanal: [{servicio, cuota, cantidades[7], unidades}] */
  function semana(sede) {
    const filas = sede ? D.semanaSede[sede] : D.semana;
    return filas.map((p) => ({ servicio: p.servicio, cuota: p.cuota, cantidades: p.cantidades, unidades: p.cantidades.reduce((a, b) => a + b, 0) }));
  }

  /* Estilo frecuente para encabezados en los datos iniciales */
  const ENC = { b: true, bg: '#dff0ef' };

  /* Funciones auxiliares de comprobación para retos en el simulador */
  const chk = {
    rojizo: (fx) => !!(fx && fx.bg && /^#(ff[c-f]|f[89a-f][0-9a-f]{2}[6-9a-c])/i.test(fx.bg)) || !!(fx && fx.bg === '#ffc7ce'),
  };

  LT.caso = { D, SEDES, fecha, serial, servicio, totalesPor, trimestre, mes, lideresTrimestre, mensualPorArea, mensualPorSede, filasDinamica, CAMPOS_DINAMICA, filasCronicos, semana, ENC, chk };
})();
