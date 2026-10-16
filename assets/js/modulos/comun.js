/* Utilidades compartidas por las definiciones de módulos: datos del caso ya preparados. */
(function () {
  'use strict';
  const LT = window.LT;
  const D = window.LA_TAZA;
  const fecha = (iso) => { const [y, m, d] = iso.split('-'); return d + '/' + m + '/' + y; };
  const serial = (iso) => LT.fechas.deISO(iso);
  const producto = (cod) => D.productos.find((p) => p.codigo === cod);

  function totalesPor(clave, filtro) {
    const o = {};
    for (const v of D.ventas) { if (filtro && !filtro(v)) continue; o[v[clave]] = (o[v[clave]] || 0) + v.total; }
    return o;
  }
  function trimestre(iso) { return Math.floor((+iso.slice(5, 7) - 1) / 3) + 1; }
  function mes(iso) { return +iso.slice(5, 7); }
  /* Sucursal líder por trimestre: [ 'Centro', ... ] */
  function lideresTrimestre(filtro) {
    const out = [];
    for (let q = 1; q <= 4; q++) {
      const t = totalesPor('sucursal', (v) => trimestre(v.fecha) === q && (!filtro || filtro(v)));
      out.push(Object.entries(t).sort((a, b) => b[1] - a[1])[0][0]);
    }
    return out;
  }
  /* Totales mensuales por categoría: {categoria: [12]} */
  function mensualPorCategoria() {
    const o = {};
    for (const c of D.categorias) o[c] = new Array(12).fill(0);
    for (const v of D.ventas) o[v.categoria][mes(v.fecha) - 1] += v.total;
    return o;
  }
  function mensualPorSucursal(filtro) {
    const o = { Centro: new Array(12).fill(0), Norte: new Array(12).fill(0), Sur: new Array(12).fill(0) };
    for (const v of D.ventas) if (!filtro || filtro(v)) o[v.sucursal][mes(v.fecha) - 1] += v.total;
    return o;
  }
  /* Filas de ventas para tablas dinámicas */
  function filasDinamica() {
    return D.ventas.map((v) => ({ Folio: v.folio, Fecha: v.fecha, Sucursal: v.sucursal, 'Código': v.codigo, Producto: v.producto, 'Categoría': v.categoria, Cantidad: v.cantidad, Precio: v.precio, Total: v.total, Vendedor: v.vendedor, Pago: v.pago }));
  }
  const CAMPOS_DINAMICA = [
    { nombre: 'Folio', tipo: 'texto' }, { nombre: 'Fecha', tipo: 'fecha' }, { nombre: 'Sucursal', tipo: 'texto' }, { nombre: 'Código', tipo: 'texto' },
    { nombre: 'Producto', tipo: 'texto' }, { nombre: 'Categoría', tipo: 'texto' }, { nombre: 'Cantidad', tipo: 'numero', formato: '#,##0' },
    { nombre: 'Precio', tipo: 'numero', formato: '$#,##0.00' }, { nombre: 'Total', tipo: 'numero', formato: '$#,##0' }, { nombre: 'Vendedor', tipo: 'texto' }, { nombre: 'Pago', tipo: 'texto' },
  ];

  /* Reporte semanal: [[producto, precio, unidades, …]] */
  function semana(suc) {
    const filas = suc ? D.semanaSucursal[suc] : D.semana;
    return filas.map((p) => ({ producto: p.producto, precio: p.precio, cantidades: p.cantidades, unidades: p.cantidades.reduce((a, b) => a + b, 0) }));
  }

  /* Estilos frecuentes para encabezados en los datos iniciales */
  const ENC = { b: true, bg: '#f3ebdf' };

  /* Funciones auxiliares de comprobación para retos en el simulador */
  const chk = {
    // ¿la celda tiene un relleno rojizo / amarillento / verdoso aplicado por formato condicional?
    rojizo: (fx) => !!(fx && fx.bg && /^#(ff[c-f]|f[89a-f][0-9a-f]{2}[6-9a-c])/i.test(fx.bg)) || !!(fx && fx.bg === '#ffc7ce'),
  };

  LT.caso = { D, fecha, serial, producto, totalesPor, trimestre, mes, lideresTrimestre, mensualPorCategoria, mensualPorSucursal, filasDinamica, CAMPOS_DINAMICA, semana, ENC, chk };
})();
