/* Módulo 8 · Organizar datos */
(function () {
  const { D, ENC, fecha } = LT.caso;
  const cmp = (a, b) => String(a).localeCompare(String(b), 'es', { sensitivity: 'base' });
  const filaPaciente = (c) => [c.id, c.nombre, '', c.telefono, c.correo, c.sede, fecha(c.registro), c.consultas];
  const hojaPadron = (conUsuario) => ({
    hojas: [{ nombre: 'Pacientes', datos: [['Expediente', 'Nombre', 'Apellido', 'Teléfono', 'Correo', 'Sede', 'Registro', 'Consultas'].concat(conUsuario ? ['Usuario'] : []), ...D.pacientesSucios.map(filaPaciente)], estilos: { 'A1:I1': ENC }, anchos: { A: 84, B: 150, C: 110, D: 100, E: 230, F: 80, G: 90, H: 76, I: 140 }, inmovilizar: { filas: 1 }, filasExtra: 3 }],
    herramientas: ['portapapeles', 'datos'], altura: 440,
  });
  const leerFilas = (x, conUsuario) => {
    const h = x.estado.hojas[0];
    const out = [];
    for (let r = 2; r <= 60; r++) {
      const id = h.celdas['A' + r];
      if (!id) continue;
      out.push({ r, id, nombre: x.valor('B' + r), apellido: x.valor('C' + r), correo: x.valor('E' + r), sede: x.valor('F' + r), usuario: conUsuario ? x.valor('I' + r) : null });
    }
    return out;
  };
  const unicos = Array.from(new Map(D.pacientesSucios.map((c) => [c.id, c])).values());
  const pers = D.personal;
  const pruebasBase = [
    { tipo: 'fn', titulo: 'Sin registros duplicados', fn: (x) => {
      const f = leerFilas(x);
      const ids = f.map((y) => y.id);
      const rep = ids.find((id, i) => ids.indexOf(id) !== i);
      if (rep) return 'El expediente ' + rep + ' aparece más de una vez: usa Quitar duplicados.';
      if (f.length < unicos.length) return 'Faltan pacientes: hay ' + f.length + ' y deberían quedar ' + unicos.length + '. ¿Borraste filas de más? Usa Restablecer y Quitar duplicados.';
      return true;
    } },
    { tipo: 'fn', titulo: 'Nombre y apellido separados', fn: (x) => {
      for (const y of leerFilas(x)) {
        const orig = unicos.find((c) => c.id === y.id);
        const [n, a] = orig.nombre.split(' ');
        if (String(y.nombre).trim() !== n || String(y.apellido || '').trim() !== a) return 'En la fila ' + y.r + ' el nombre y el apellido no están separados (' + y.nombre + ' | ' + (y.apellido || 'vacío') + '): usa Texto en columnas con separador Espacio.';
      }
      return true;
    } },
    { tipo: 'fn', titulo: 'Ordenado por sede y luego por apellido', fn: (x) => {
      const f = leerFilas(x);
      for (let i = 1; i < f.length; i++) {
        const a = f[i - 1], b = f[i];
        const c1 = cmp(a.sede, b.sede);
        if (c1 > 0 || (c1 === 0 && cmp(a.apellido, b.apellido) > 0)) return 'Las filas ' + a.r + ' y ' + b.r + ' no están en orden: ordena por Sede (A→Z) y después por Apellido (A→Z).';
      }
      return true;
    } },
    { tipo: 'fn', titulo: 'Lista desplegable en Sede', fn: (x) => {
      const v = x.estado.hojas[0].validaciones.find((y) => y.tipo === 'lista' && LT.refs.celdasDe(y.rango).some((c) => c.dir === 'F2'));
      if (!v) return 'Agrega una validación de lista en la columna Sede (F2:F40).';
      const vals = x.hoja.valoresLista(v, 0).map((s) => s.toLowerCase());
      if (!['centro', 'norte', 'sur'].every((s) => vals.includes(s)) || vals.length !== 3) return 'La lista debe tener exactamente Centro, Norte y Sur.';
      const rg = LT.refs.parseRango(v.rango.split(',')[0]);
      return rg.r2 >= 32 ? true : 'La validación debe cubrir toda la columna de datos (hasta F40).';
    } },
  ];

  LT.definirModulo({
    id: 8,
    objetivo: 'Ordenar, filtrar, quitar duplicados, separar texto en columnas, usar relleno rápido y validar la captura con listas desplegables.',
    situacion: 'El padrón de pacientes que exportó el sistema de citas está hecho un desastre: <b>hay expedientes repetidos</b>, el nombre completo está en una sola columna y la sede se escribe de varias formas. <b>Depúralo</b>: un padrón con duplicados infla los indicadores y puede mezclar la información de dos personas.',
    explicacion: [
      { html: '<h3>Herramientas de la pestaña Datos</h3><ul><li><b>Ordenar:</b> A→Z o Z→A por una columna; con <b>Ordenar</b> puedes usar varios niveles (por sede y, dentro de cada una, por apellido). Basta con seleccionar una celda dentro de los datos: Excel ordena las filas completas.</li><li><b>Filtro:</b> agrega flechas a los encabezados para mostrar solo algunas filas (las demás se ocultan, no se borran).</li><li><b>Quitar duplicados:</b> elimina las filas repetidas según las columnas que elijas (por ejemplo, el expediente). Trabaja sobre una copia: no se puede revisar qué se borró.</li><li><b>Texto en columnas:</b> separa un texto usando un separador (espacio, coma, guion…).</li><li><b>Relleno rápido</b> (<kbd>Ctrl+E</kbd>): escribes uno o dos ejemplos y Excel completa el resto siguiendo el patrón.</li><li><b>Validación de datos:</b> limita lo que se puede capturar; con «Lista» aparece una flecha para elegir.</li></ul><p>Funciones de limpieza útiles: <code>ESPACIOS</code> (quita espacios sobrantes), <code>NOMPROPIO</code>, <code>MAYUSC</code>, <code>MINUSC</code>, <code>LARGO</code> (por ejemplo, para revisar que un teléfono tenga 10 dígitos) y <code>SUSTITUIR</code>.</p>' },
      { titulo: 'Zona de práctica', instr: 'Prueba ordenar, filtrar (botón Filtro y luego las flechas de los encabezados) y relleno rápido con estos datos.', hoja: { altura: 280, hojas: [{ nombre: 'Práctica', datos: [['Nombre completo', 'Sede', 'Consultas', 'Nombre'], ...D.pacientes.slice(0, 10).map((c) => [c.nombre, c.sede, c.consultas])], estilos: { 'A1:D1': ENC }, anchos: { A: 170 } }], herramientas: ['datos'] } },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Ordenar por dos niveles',
      pasos: ['Haz clic en cualquier celda de los datos (no selecciones una sola columna).', { texto: 'Datos › Ordenar.', ruta: ['Datos', 'Ordenar'] }, 'Nivel 1: Sede, de A a Z. «Agregar nivel». Nivel 2: Apellido, de A a Z.', 'Aceptar: dentro de cada sede, los pacientes quedan por apellido.'],
      pregunta: { texto: 'Seleccionas <b>solo</b> la columna Apellido y la ordenas de A a Z sin ampliar la selección. ¿Qué pasa?', opciones: ['Los apellidos se separan de sus nombres, teléfonos y expedientes: los datos quedan revueltos', 'Excel ordena todo correctamente', 'No pasa nada', 'Se borran los duplicados'], correcta: 0, explicacion: 'Si ordenas una sola columna, las demás no se mueven y cada apellido queda en la fila de otra persona: en un padrón clínico eso es un error grave. Selecciona una celda dentro de los datos.' },
    },
    micro: [
      {
        titulo: 'Ordenar de mayor a menor', tipo: 'hoja', enunciado: 'Ordena al personal por <b>Atenciones</b>, de mayor a menor.',
        hoja: { hojas: [{ nombre: 'Personal', datos: [['Profesional', 'Sede', 'Atenciones'], ...pers.slice(0, 10).map((e) => [e.nombre, e.sede, e.atencionesMes])], estilos: { 'A1:C1': ENC }, anchos: { A: 150 }, filas: 14, cols: 5 }], herramientas: ['datos'] },
        pruebas: [{ tipo: 'valores', rango: 'A2:C11', esperado: pers.slice(0, 10).map((e) => [e.nombre, e.sede, e.atencionesMes]).sort((a, b) => b[2] - a[2]), mensaje: '{celda} debería ser {esperado}: haz clic en una celda de Atenciones y usa «Ordenar de Z a A».' }],
        pista: ['Haz clic en C2 (dentro de Atenciones) y usa el botón Z→A.'],
      },
      {
        titulo: 'Filtrar una sede', tipo: 'hoja', enunciado: 'Activa el filtro y muestra solo al personal de <b>Norte</b>.',
        hoja: { hojas: [{ nombre: 'Personal', datos: [['Profesional', 'Sede', 'Atenciones'], ...pers.map((e) => [e.nombre, e.sede, e.atencionesMes])], estilos: { 'A1:C1': ENC }, anchos: { A: 150 }, cols: 5 }], herramientas: ['datos'] },
        pruebas: [{ tipo: 'fn', fn: (x) => {
          const h = x.estado.hojas[0];
          if (!h.filtro) return 'Primero activa el Filtro (botón Filtro con una celda de los datos seleccionada).';
          const ocultas = new Set(h.filasOcultas);
          for (let r = 2; r <= 21; r++) { const esNorte = h.celdas['B' + r] === 'Norte'; if (esNorte === ocultas.has(r - 1)) return 'Deben verse solo las filas de Norte: usa la flecha del encabezado Sede.'; }
          return true;
        } }],
        pista: ['Botón «Filtro»; luego la flecha ▼ de «Sede», deja marcado solo «Norte» y Aceptar.'],
      },
      {
        titulo: 'Relleno rápido', tipo: 'hoja', enunciado: 'En B2 escribe el primer nombre de la persona de A2 (por ejemplo «' + D.pacientes[0].nombre.split(' ')[0] + '»). Luego selecciona B3 y usa <b>Relleno rápido</b> para completar la columna.',
        hoja: { hojas: [{ nombre: 'Hoja1', datos: [['Nombre completo', 'Nombre'], ...D.pacientes.slice(0, 8).map((c) => [c.nombre])], estilos: { 'A1:B1': ENC }, anchos: { A: 180, B: 120 }, objetivo: 'B2:B9', filas: 12, cols: 4 }], herramientas: ['datos'] },
        pruebas: [{ tipo: 'valores', rango: 'B2:B9', esperado: D.pacientes.slice(0, 8).map((c) => c.nombre.split(' ')[0]), mensaje: '{celda} debería decir {esperado}.' }],
        pista: ['Escribe el ejemplo en B2, pulsa Enter y luego el botón «Relleno rápido» (rayo).'],
      },
    ],
    reto: {
      titulo: 'Depurar el padrón de pacientes', tipo: 'hoja',
      intro: 'La hoja <i>Pacientes</i> tiene ' + D.pacientesSucios.length + ' registros. En la columna B está el nombre completo; la columna C (Apellido) está vacía.',
      base: {
        hoja: hojaPadron(false), pruebas: pruebasBase,
        instrucciones: ['Quita los registros duplicados (filas repetidas).', 'Separa el nombre completo: el nombre queda en B y el apellido en C.', 'Ordena por <b>Sede</b> (A→Z) y, dentro de cada sede, por <b>Apellido</b> (A→Z).', 'En la columna Sede (F2:F40) agrega una <b>lista desplegable</b> con Centro, Norte y Sur.'],
        pistas: ['Todas las herramientas están en la sección Datos de la barra. Haz primero lo que cambia la cantidad de filas (duplicados).', 'Texto en columnas: selecciona B2:B' + (D.pacientesSucios.length + 1) + ' y usa el separador «Espacio». Validación: selecciona F2:F40 › Permitir: Lista › Origen: Centro,Norte,Sur.', 'Orden: Quitar duplicados → Texto en columnas → Ordenar con dos niveles (Sede, Apellido) → Validación.'],
      },
      niveles: {
        explorador: { instrucciones: ['Haz clic en una celda de los datos › <b>Quitar duplicados</b> › Aceptar.', 'Selecciona B2:B' + (D.pacientesSucios.length + 1) + ' › <b>Texto en columnas</b> › separador «Espacio» › Finalizar.', 'Clic en una celda de los datos › <b>Ordenar</b>: nivel 1 «Sede», «Agregar nivel», nivel 2 «Apellido».', 'Selecciona F2:F40 › <b>Validación</b> › Permitir: Lista › Origen: <code>Centro,Norte,Sur</code>.'] },
        experto: {
          hoja: hojaPadron(true),
          instrucciones: ['Depura el padrón como en el nivel Analista (duplicados, nombre/apellido, orden, lista desplegable).', 'En la columna I (Usuario) obtén la parte del correo antes de la arroba con <b>Relleno rápido</b> (escribe uno o dos ejemplos).'],
          pruebasExtra: [{ tipo: 'fn', titulo: 'Usuario extraído del correo', fn: (x) => { for (const y of leerFilas(x, true)) if (String(y.usuario || '') !== String(y.correo).split('@')[0]) return 'En I' + y.r + ' debería decir «' + String(y.correo).split('@')[0] + '»: escribe un ejemplo y usa Relleno rápido.'; return true; } }],
        },
      },
    },
    lab: {
      archivo: 'lab08-padron.xlsx', titulo: 'Depurar el padrón de Norte y Sur',
      contexto: 'Otra exportación del padrón, con los mismos problemas.',
      pasos: {
        explorador: [{ texto: 'Quita los duplicados.', ruta: ['Datos', 'Quitar duplicados'] }, { texto: 'Separa el nombre completo en Nombre y Apellido.', ruta: ['Datos', 'Texto en columnas'] }, { texto: 'Ordena por Sede y luego por Apellido.', ruta: ['Datos', 'Ordenar'] }, { texto: 'Lista desplegable en Sede (F2:F60) con Centro, Norte y Sur.', ruta: ['Datos', 'Validación de datos'] }, 'Guarda y sube el libro.'],
        analista: ['Sin duplicados, nombre y apellido separados (B y C), ordenado por Sede y Apellido, y lista desplegable en Sede (F2:F60).', 'Guarda y sube el libro.'],
        experto: ['Lo del nivel Analista.', 'Columna I «Usuario» con la parte del correo antes de @ (Relleno rápido).', 'Guarda y sube el libro.'],
      },
      pruebas: [
        { titulo: 'Sin duplicados', fn: (L, A) => { A.hoja('Pacientes'); const ids = []; for (let r = 2; r <= 80; r++) { const v = L.valor('Pacientes', 'A' + r); if (v == null || v === '') continue; if (ids.includes(v)) return 'El expediente ' + v + ' aparece repetido.'; ids.push(v); } return ids.length >= 20 ? true : 'Quedaron muy pocos pacientes: revisa que solo quitaste los duplicados.'; } },
        { titulo: 'Nombre y apellido separados', fn: (L) => { for (let r = 2; r <= 80; r++) { if (!L.valor('Pacientes', 'A' + r)) continue; const n = String(L.valor('Pacientes', 'B' + r) || ''), a = String(L.valor('Pacientes', 'C' + r) || ''); if (!a || /\s/.test(n.trim())) return 'En la fila ' + r + ' el nombre y el apellido no están separados.'; } return true; } },
        { titulo: 'Ordenado por sede y apellido', fn: (L) => { let prev = null; for (let r = 2; r <= 80; r++) { if (!L.valor('Pacientes', 'A' + r)) continue; const cur = { r, s: String(L.valor('Pacientes', 'F' + r)), a: String(L.valor('Pacientes', 'C' + r)) }; if (prev) { const c1 = cmp(prev.s, cur.s); if (c1 > 0 || (c1 === 0 && cmp(prev.a, cur.a) > 0)) return 'Las filas ' + prev.r + ' y ' + r + ' no están en orden.'; } prev = cur; } return true; } },
        { titulo: 'Lista desplegable en Sede', fn: (L, A) => { const v = L.hoja('Pacientes').validaciones.find((x) => x.tipo === 'list' && A.rangoCubre(x.sqref, 'F2:F30')); if (!v) return 'Agrega una validación de lista que cubra F2:F60.'; return /centro/i.test(v.formula1) && /norte/i.test(v.formula1) && /sur/i.test(v.formula1) || /!?\$?[A-Z]+\$?\d+:\$?[A-Z]+\$?\d+/.test(v.formula1) ? true : 'La lista debe tener Centro, Norte y Sur.'; } },
        { titulo: 'Usuario del correo', nivel: 'experto', fn: (L) => { for (let r = 2; r <= 80; r++) { if (!L.valor('Pacientes', 'A' + r)) continue; const e = String(L.valor('Pacientes', 'E' + r)).split('@')[0]; if (String(L.valor('Pacientes', 'I' + r) || '') !== e) return 'I' + r + ' debería decir «' + e + '».'; } return true; } },
      ],
    },
    donde: [
      { comando: 'Ordenar (varios niveles)', ruta: ['Datos', 'Ordenar'] },
      { comando: 'Quitar duplicados', ruta: ['Datos', 'Quitar duplicados'] },
      { comando: 'Texto en columnas', ruta: ['Datos', 'Texto en columnas'] },
      { comando: 'Relleno rápido', ruta: ['Datos', 'Relleno rápido'] },
      { comando: 'Validación de datos', ruta: ['Datos', 'Validación de datos'] },
    ],
    glosario: ['ESPACIOS', 'NOMPROPIO', 'MAYUSC', 'MINUSC', 'LARGO', 'SUSTITUIR'],
    atajos: ['Selecciona una celda dentro de los datos antes de ordenar o filtrar: Excel detecta el rango completo.', '<kbd>Ctrl+Mayús+L</kbd> activa o desactiva el filtro (en Excel).', '<kbd>Ctrl+E</kbd> Relleno rápido.'],
  });
})();
