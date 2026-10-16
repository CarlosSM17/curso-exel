/* Verificador de retos del simulador.
   Compara el trabajo del participante con una solución de referencia calculada
   sobre los mismos datos, revisa que haya fórmulas y no números escritos,
   qué funciones se usaron y si el resultado se mantiene al cambiar los datos. */
(function () {
  'use strict';
  const LT = window.LT;
  const R = LT.refs;
  const F = LT.formato;
  const M = LT.motor;

  function separarHoja(ref, hojaPorDefecto) {
    const s = String(ref);
    const i = s.lastIndexOf('!');
    if (i < 0) return { hoja: hojaPorDefecto, rango: s };
    return { hoja: s.slice(0, i).replace(/^'(.*)'$/, '$1'), rango: s.slice(i + 1) };
  }
  /* Expande "Hoja!D2:D5,F4" en celdas [{hoja, r, c, dir}] */
  function celdas(lista, hojaDef) {
    const out = [];
    for (const parte of String(lista).split(',')) {
      const { hoja, rango } = separarHoja(parte.trim(), hojaDef);
      for (const x of R.celdasDe(rango)) out.push({ hoja, r: x.r, c: x.c, dir: x.dir });
    }
    return out;
  }
  /* Estado exportado -> {Hoja: {A1: raw}} */
  function contenidos(estado) {
    const o = {};
    for (const hj of estado.hojas) o[hj.nombre] = Object.assign({}, hj.celdas);
    return o;
  }
  function aplicarSolucion(cont, solucion, hojaDef) {
    for (const [clave, valor] of Object.entries(solucion || {})) {
      const { hoja, rango } = separarHoja(clave, hojaDef);
      const rg = R.parseRango(rango);
      if (!cont[hoja]) cont[hoja] = {};
      for (let r = rg.r1; r <= rg.r2; r++) for (let c = rg.c1; c <= rg.c2; c++) {
        let v;
        if (Array.isArray(valor)) v = valor[r - rg.r1] && valor[r - rg.r1][c - rg.c1];
        else if (typeof valor === 'string' && valor[0] === '=') v = R.desplazarFormula(valor, r - rg.r1, c - rg.c1);
        else v = valor;
        if (v == null || v === '') delete cont[hoja][R.dir(r, c)]; else cont[hoja][R.dir(r, c)] = String(v);
      }
    }
    return cont;
  }
  function aplicarCambios(cont, cambios, hojaDef) {
    for (const [ref, v] of Object.entries(cambios || {})) {
      const { hoja, rango } = separarHoja(ref, hojaDef);
      if (!cont[hoja]) cont[hoja] = {};
      cont[hoja][R.parseRango(rango) ? R.dir(R.parseRango(rango).r1, R.parseRango(rango).c1) : rango] = String(v);
    }
    return cont;
  }
  function leer(hf, hoja, r, c) {
    const id = hf.getSheetId(hoja);
    if (id === undefined) return null;
    const v = hf.getCellValue({ sheet: id, row: r, col: c });
    if (M.esError(v)) return { error: M.textoError(v) };
    return v;
  }
  function iguales(a, b, tol) {
    if (b && typeof b === 'object' && 'error' in b) return a && typeof a === 'object' && a.error === b.error;
    if (a && typeof a === 'object' && 'error' in a) return false;
    if (typeof b === 'number') {
      if (typeof a !== 'number') return false;
      return Math.abs(a - b) <= (tol != null ? tol : 0.005) + 1e-9 * Math.abs(b);
    }
    if (typeof b === 'boolean') return a === b;
    if (b == null || b === '') return a == null || a === '';
    return String(a == null ? '' : a).trim().toLowerCase() === String(b).trim().toLowerCase();
  }
  function mostrar(v) {
    if (v == null || v === '') return '(vacía)';
    if (typeof v === 'object' && 'error' in v) return v.error;
    if (typeof v === 'number') return F.formatear(v, Math.abs(v) >= 1000 ? '#,##0.##' : 'General').texto.replace(/\.$/, '');
    if (typeof v === 'boolean') return v ? 'VERDADERO' : 'FALSO';
    return '«' + v + '»';
  }
  function plantilla(msj, datos) {
    return String(msj || '').replace(/\{(\w+)\}/g, (m, k) => (datos[k] != null ? datos[k] : m));
  }
  /* Nombres de función que aparecen en una fórmula */
  function funcionesEn(f) {
    const out = new Set();
    const toks = [];
    R.recorrerFormula(String(f || ''), (t) => toks.push(t));
    toks.forEach((t, i) => { if (t.tipo === 'id' && toks[i + 1] && toks[i + 1].txt === '(') out.add(t.txt.toUpperCase()); });
    return out;
  }

  /* hoja: instancia LT.Hoja; spec: {solucion, pruebas} */
  function verificar(hoja, spec) {
    const estado = hoja.exportar();
    const hojaDef = (typeof spec.hoja === 'string' && spec.hoja) || hoja.hj.nombre;
    const resultados = [];
    const marcas = [];
    let hfUsuario = null, hfSolucion = null;
    const motorUsuario = () => hfUsuario || (hfUsuario = M.crearMotor(contenidos(estado), estado.nombres));
    const motorSolucion = () => hfSolucion || (hfSolucion = M.crearMotor(aplicarSolucion(contenidos(estado), spec.solucion, hojaDef), Object.assign({}, estado.nombres, spec.nombresSolucion || {})));
    const crudo = (x) => { const hj = estado.hojas.find((h) => h.nombre === x.hoja); return hj ? hj.celdas[x.dir] || '' : ''; };
    const ctx = {
      hoja, estado,
      valor: (ref) => { const x = celdas(ref, hojaDef)[0]; return leer(motorUsuario(), x.hoja, x.r, x.c); },
      entrada: (ref) => crudo(celdas(ref, hojaDef)[0]),
      estilo: (ref) => { const x = celdas(ref, hojaDef)[0]; const hj = estado.hojas.find((h) => h.nombre === x.hoja); return (hj && hj.estilos[x.dir]) || {}; },
      esperado: (ref) => { const x = celdas(ref, hojaDef)[0]; return leer(motorSolucion(), x.hoja, x.r, x.c); },
      celdas: (ref) => celdas(ref, hojaDef),
      funciones: funcionesEn,
      mostrar,
    };
    for (const p of spec.pruebas || []) {
      let ok = true, mensaje = '', fallas = [];
      try {
        switch (p.tipo) {
          case 'valores': {
            const lista = celdas(p.rango, hojaDef);
            let esperado = p.esperado;
            if (typeof esperado === 'function') esperado = esperado(ctx);
            lista.forEach((x, i) => {
              const obt = leer(motorUsuario(), x.hoja, x.r, x.c);
              let esp;
              if (esperado !== undefined) {
                const rg = R.parseRango(separarHoja(String(p.rango).split(',')[0], hojaDef).rango);
                esp = Array.isArray(esperado) ? (Array.isArray(esperado[0]) ? (esperado[x.r - rg.r1] || [])[x.c - rg.c1] : esperado[i]) : esperado;
                if (typeof esp === 'string' && esp !== '' && !isNaN(+esp.replace(/,/g, '')) && typeof obt === 'number') esp = +esp.replace(/,/g, '');
              } else esp = leer(motorSolucion(), x.hoja, x.r, x.c);
              if (!iguales(obt, esp, p.tolerancia)) fallas.push({ x, obt, esp });
            });
            if (fallas.length) {
              ok = false;
              const f0 = fallas[0];
              mensaje = plantilla(p.mensaje || '{celda} muestra {obtenido}, pero se esperaba {esperado}.', { celda: f0.x.dir, obtenido: mostrar(f0.obt), esperado: mostrar(f0.esp), n: fallas.length });
            }
            break;
          }
          case 'formula': {
            for (const x of celdas(p.rango, hojaDef)) {
              const raw = crudo(x);
              if (!raw || raw[0] !== '=') fallas.push({ x, raw });
            }
            if (fallas.length) {
              ok = false;
              const f0 = fallas[0];
              mensaje = plantilla(f0.raw ? (p.mensaje || '{celda} tiene un valor escrito; usa una fórmula para que se actualice sola.') : (p.mensajeVacia || p.mensaje || '{celda} está vacía: escribe una fórmula.'), { celda: f0.x.dir, n: fallas.length });
            }
            break;
          }
          case 'usa': case 'noUsa': {
            const req = (p.funciones || []).map((x) => x.toUpperCase());
            for (const x of celdas(p.rango, hojaDef)) {
              const fs = funcionesEn(crudo(x));
              const cumple = p.tipo === 'usa' ? (p.alguna ? req.some((f) => fs.has(f)) : req.every((f) => fs.has(f))) : !req.some((f) => fs.has(f));
              if (!cumple) fallas.push({ x });
            }
            if (fallas.length) { ok = false; mensaje = plantilla(p.mensaje || (p.tipo === 'usa' ? 'En {celda} usa la función ' + req.join(' o ') + '.' : 'En {celda} no uses ' + req.join(', ') + '.'), { celda: fallas[0].x.dir, n: fallas.length }); }
            break;
          }
          case 'contiene': {
            // la fórmula debe contener cierto texto (por ejemplo "$F$1")
            for (const x of celdas(p.rango, hojaDef)) {
              const raw = crudo(x).toUpperCase().replace(/\s+/g, '');
              const lista = [].concat(p.texto).map((t) => String(t).toUpperCase().replace(/\s+/g, ''));
              if (!(p.alguna ? lista.some((t) => raw.includes(t)) : lista.every((t) => raw.includes(t)))) fallas.push({ x });
            }
            if (fallas.length) { ok = false; mensaje = plantilla(p.mensaje, { celda: fallas[0].x.dir, n: fallas.length }); }
            break;
          }
          case 'robustez': {
            const conjuntos = Array.isArray(p.cambios) ? p.cambios : [p.cambios];
            for (const cambios of conjuntos) {
              const hu = M.crearMotor(aplicarCambios(contenidos(estado), cambios, hojaDef), estado.nombres);
              const hs = M.crearMotor(aplicarCambios(aplicarSolucion(contenidos(estado), spec.solucion, hojaDef), cambios, hojaDef), Object.assign({}, estado.nombres, spec.nombresSolucion || {}));
              for (const x of celdas(p.rango, hojaDef)) {
                const obt = leer(hu, x.hoja, x.r, x.c), esp = leer(hs, x.hoja, x.r, x.c);
                if (!iguales(obt, esp, p.tolerancia)) { fallas.push({ x, obt, esp }); }
              }
              hu.destroy(); hs.destroy();
              if (fallas.length) break;
            }
            if (fallas.length) { ok = false; const f0 = fallas[0]; mensaje = plantilla(p.mensaje || 'Al cambiar los datos, {celda} no se actualizó correctamente.', { celda: f0.x.dir, obtenido: mostrar(f0.obt), esperado: mostrar(f0.esp), n: fallas.length }); }
            break;
          }
          case 'estilo': {
            for (const x of celdas(p.rango, hojaDef)) {
              const hj = estado.hojas.find((h) => h.nombre === x.hoja);
              const est = (hj && hj.estilos[x.dir]) || {};
              const v = est[p.prop];
              let cumple;
              if (p.fn) cumple = p.fn(v, est, x);
              else if (p.patron) cumple = v != null && new RegExp(p.patron).test(String(v));
              else if ('valor' in p) cumple = JSON.stringify(v) === JSON.stringify(p.valor);
              else cumple = !!v;
              if (!cumple) fallas.push({ x });
            }
            if (fallas.length) { ok = false; mensaje = plantilla(p.mensaje, { celda: fallas[0].x.dir, n: fallas.length }); }
            break;
          }
          case 'fn': {
            const r = p.fn(ctx);
            if (r === true || r == null) ok = true;
            else if (r === false) { ok = false; mensaje = p.mensaje; }
            else if (typeof r === 'string') { ok = false; mensaje = r; }
            else { ok = !!r.ok; mensaje = r.mensaje || p.mensaje; if (r.celdas) fallas = r.celdas.map((d) => ({ x: celdas(d, hojaDef)[0] })); }
            break;
          }
        }
      } catch (e) {
        console.error(e);
        ok = false;
        mensaje = 'No se pudo revisar esta parte: ' + e.message;
      }
      resultados.push({ ok, mensaje: ok ? (p.exito || p.titulo || '') : mensaje, titulo: p.titulo, celdas: fallas.map((f) => f.x && f.x.dir).filter(Boolean) });
      if (!ok) fallas.forEach((f) => f.x && marcas.push(f.x.hoja + '!' + f.x.dir));
      if (!ok && p.detener) break;
    }
    if (hfUsuario) hfUsuario.destroy();
    if (hfSolucion) hfSolucion.destroy();
    return { ok: resultados.every((r) => r.ok), resultados, marcas };
  }

  /* Valores de una solución (para mostrarlos en la guía docente) */
  function valoresSolucion(estadoInicial, solucion, hojaDef, rango) {
    const hf = M.crearMotor(aplicarSolucion(contenidos(estadoInicial), solucion, hojaDef), estadoInicial.nombres);
    const out = celdas(rango, hojaDef).map((x) => ({ dir: x.dir, v: leer(hf, x.hoja, x.r, x.c) }));
    hf.destroy();
    return out;
  }

  LT.verificar = verificar;
  LT.verificador = { verificar, celdas, funcionesEn, iguales, mostrar, valoresSolucion, aplicarSolucion, contenidos };
})();
