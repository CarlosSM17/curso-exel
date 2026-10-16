/* Módulo 12 · Colaborar con Excel */
(function () {
  const { D, ENC } = LT.caso;
  const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  const pres = D.presupuesto;
  const BRUNO = 'Bruno Castillo (Norte)';
  const datos = [['Presupuesto de gastos · 1.er semestre 2026'], [], ['Concepto', ...MESES, 'Total'], ...pres.map((p, i) => [p.concepto, ...p.meses, '=SUMA(B' + (i + 4) + ':G' + (i + 4) + ')']), ['Total', ...'BCDEFGH'.split('').map((c) => '=SUMA(' + c + '4:' + c + '11)')]];
  const filaPub = 4 + pres.findIndex((p) => p.concepto === 'Publicidad');
  const filaIns = 4 + pres.findIndex((p) => p.concepto === 'Insumos');
  const C_PUB = 'C' + filaPub, G_INS = 'G' + filaIns;
  const hojaPres = (notas) => ({
    hojas: [{
      nombre: 'Presupuesto', datos, formatos: { 'B4:H12': '$#,##0' }, estilos: { A1: { b: true, fs: 15 }, 'A3:H3': ENC, 'A12:H12': { b: true } }, anchos: { A: 160 },
      comentarios: {
        [C_PUB]: { hilo: [{ autor: BRUNO, texto: '¿Por qué Publicidad baja a $3,000 en febrero? Creo que debe ser $4,500, como en enero.' }], resuelto: false },
        [G_INS]: { hilo: [{ autor: BRUNO, texto: 'Insumos de junio: confirmé con el proveedor que son $70,400, no $72,100.' }], resuelto: false },
        H12: { hilo: [{ autor: BRUNO, texto: '¿El total del semestre ya incluye mantenimiento?' }], resuelto: false },
      },
      notas: notas || {}, filas: 15,
    }],
    herramientas: ['revisar', 'celdas', 'portapapeles'], autor: 'Tú', altura: 400,
  });
  const hilo = (x, d) => (x.estado.hojas[0].comentarios || {})[d];
  const pruebasBase = [
    { tipo: 'fn', titulo: 'Respondiste los tres comentarios', fn: (x) => { for (const d of [C_PUB, G_INS, 'H12']) { const c = hilo(x, d); if (!c) return 'El comentario de ' + d + ' desapareció: no lo elimines, respóndelo.'; if (!c.hilo.some((m) => m.autor === 'Tú')) return 'Falta tu respuesta al comentario de ' + d + ' (selecciona la celda › Comentario › Responder).'; } return true; } },
    { tipo: 'valores', rango: C_PUB + ',' + G_INS, esperado: [4500, 70400], titulo: 'Corregiste los dos valores', mensaje: '{celda} muestra {obtenido}; según Bruno debería ser {esperado}.' },
    { tipo: 'fn', titulo: 'Resolviste los dos comentarios atendidos', fn: (x) => { for (const d of [C_PUB, G_INS]) if (!hilo(x, d) || !hilo(x, d).resuelto) return 'Marca como resuelto el comentario de ' + d + ' (ya hiciste el cambio).'; return true; } },
    { tipo: 'fn', titulo: 'Celdas de captura desbloqueadas', fn: (x) => { const e = x.estado.hojas[0].estilos; for (const c of x.celdas('B4:G11')) if (!(e[c.dir] && e[c.dir].desbloqueada)) return c.dir + ' sigue bloqueada: selecciona B4:G11 y desbloquéala (botón Bloquear o Formato de celdas › Bloqueada).'; for (const c of x.celdas('H4:H12,B12:G12')) if (e[c.dir] && e[c.dir].desbloqueada) return c.dir + ' tiene una fórmula: debe quedar bloqueada.'; return true; } },
    { tipo: 'fn', titulo: 'Hoja protegida', fn: (x) => (x.estado.hojas[0].protegida ? true : 'Protege la hoja (Revisar › Proteger hoja).') },
  ];

  LT.definirModulo({
    id: 12,
    objetivo: 'Compartir en OneDrive, comentar, consultar el historial de versiones y proteger hojas.',
    situacion: 'Bruno (de la sucursal Norte) y tú van a revisar juntos el presupuesto del semestre. Él ya dejó comentarios. <b>Contéstale, corrige lo necesario y protege las fórmulas</b> para que nadie las borre por accidente.',
    explicacion: [
      { html: '<h3>Trabajar en equipo sobre el mismo libro</h3><ul><li><b>Compartir:</b> guarda el libro en OneDrive (o SharePoint) y usa el botón <b>Compartir</b>: eliges si la otra persona puede editar o solo ver. Varias personas pueden editar al mismo tiempo (<b>coautoría</b>).</li><li><b>Comentarios</b> (Revisar › Nuevo comentario): conversaciones con respuestas, @menciones y la opción <b>Resolver</b> cuando el asunto queda atendido.</li><li><b>Notas</b> (Revisar › Notas): anotaciones simples, sin respuestas.</li><li><b>Historial de versiones</b> (Archivo › Información): ve o restaura una versión anterior si algo se borró.</li><li><b>Proteger hoja</b> (Revisar › Proteger hoja): impide cambiar las celdas bloqueadas. Todas las celdas están bloqueadas por omisión, así que <b>primero desbloquea las celdas de captura</b> (Formato de celdas › Proteger › quita «Bloqueada») y después protege.</li><li><b>Proteger libro:</b> impide agregar, borrar o renombrar hojas.</li></ul>' },
      { titulo: 'Prueba la protección', instr: 'B2 está desbloqueada y C2 no. La hoja está protegida: intenta escribir en las dos.', hoja: { altura: 170, hojas: [{ nombre: 'Prueba', datos: [['Concepto', 'Monto', 'Con IVA'], ['Renta', 28000, '=B2*1.16']], formatos: { 'B2:C2': '$#,##0' }, estilos: { 'A1:C1': ENC, B2: { desbloqueada: true, bg: '#fff8d6' } }, protegida: true, filas: 5, cols: 5 }], herramientas: ['revisar'] } },
    ],
    ejemplo: {
      tipo: 'pasos', titulo: 'Proteger fórmulas dejando celdas editables',
      pasos: ['Selecciona las celdas donde sí se va a capturar (por ejemplo B4:G11).', { texto: 'Formato de celdas (Ctrl+1) › Proteger › quita la marca de «Bloqueada».', ruta: ['Inicio', 'Formato', 'Formato de celdas…'] }, { texto: 'Revisar › Proteger hoja › (opcional) contraseña › Aceptar.', ruta: ['Revisar', 'Proteger hoja'] }],
      pregunta: { texto: 'Proteges la hoja <b>sin desbloquear</b> ninguna celda. ¿Qué pasa cuando alguien quiere capturar un dato?', opciones: ['Excel no lo deja: todas las celdas están bloqueadas por omisión', 'Puede capturar en las celdas vacías', 'Solo se protegen las fórmulas', 'No pasa nada hasta guardar'], correcta: 0, explicacion: 'Todas las celdas nacen bloqueadas; la protección se activa al proteger la hoja. Por eso se desbloquean primero las de captura.' },
    },
    micro: [
      { titulo: 'Comentario o nota', tipo: 'opcion', enunciado: 'Quieres hacerle una pregunta a Bruno sobre una cifra y que él te responda en la misma conversación.', opciones: ['Comentario', 'Nota', 'Cuadro de texto', 'Validación de datos'], correcta: 0, explicacion: 'Los <b>comentarios</b> son conversaciones con respuestas y se pueden resolver; las notas son anotaciones sin respuesta.' },
      { titulo: 'Recuperar una versión', tipo: 'opcion', enunciado: 'Alguien borró ayer una fórmula del presupuesto compartido en OneDrive. ¿Cómo recuperas cómo estaba?', opciones: ['Archivo › Información › Historial de versiones', 'Ctrl+Z', 'Revisar › Proteger libro', 'Datos › Actualizar todo'], correcta: 0, explicacion: 'El <b>historial de versiones</b> guarda versiones anteriores del archivo en OneDrive; puedes verlas o restaurarlas. Ctrl+Z solo deshace tus cambios de esta sesión.' },
    ],
    reto: {
      titulo: 'Revisión del presupuesto en parejas', tipo: 'hoja', intro: 'Las celdas con un triángulo morado tienen comentarios de Bruno. Pasa el cursor para leerlos.',
      base: {
        hoja: hojaPres(), pruebas: pruebasBase,
        instrucciones: ['Lee y <b>responde</b> los tres comentarios de Bruno.', 'Haz los dos cambios que pide (Publicidad de febrero e Insumos de junio) y <b>resuelve</b> esos dos comentarios.', '<b>Desbloquea</b> las celdas de captura B4:G11 (las fórmulas de la columna H y la fila 12 quedan bloqueadas).', '<b>Protege</b> la hoja.'],
        pistas: ['Selecciona la celda con comentario y usa el botón Comentario: ahí puedes responder y resolver.', 'Para desbloquear: selecciona B4:G11 y pulsa «Bloquear» (o Ctrl+1 › quita «Bloqueada»). Después, «Proteger hoja».', C_PUB + ' → 4500; ' + G_INS + ' → 70400; responde H12 (por ejemplo «Sí, está en la fila 11»).'],
      },
      niveles: {
        explorador: { instrucciones: ['Selecciona ' + C_PUB + ' › botón <b>Comentario</b> › escribe una respuesta › Responder. Haz lo mismo en ' + G_INS + ' y en H12.', 'Escribe 4500 en ' + C_PUB + ' y 70400 en ' + G_INS + '. Luego abre esos dos comentarios y pulsa <b>Resolver conversación</b>.', 'Selecciona B4:G11 y pulsa el botón <b>Bloquear</b> (queda desbloqueado).', 'Pulsa <b>Proteger hoja</b> › Aceptar.'] },
        experto: {
          instrucciones: ['Atiende la revisión como en el nivel Analista (respuestas, correcciones, resolver, desbloquear y proteger).', 'Agrega una <b>nota</b> en A11 (Mantenimiento): «Incluye servicio de cafeteras».'],
          pruebasExtra: [{ tipo: 'fn', titulo: 'Nota en Mantenimiento', fn: (x) => (/cafetera/i.test((x.estado.hojas[0].notas || {}).A11 || '') ? true : 'Agrega en A11 una nota que diga «Incluye servicio de cafeteras».') }],
        },
      },
    },
    lab: {
      archivo: 'lab12-presupuesto.xlsx', titulo: 'Revisión en parejas en OneDrive',
      contexto: 'Trabajen en parejas. Una persona sube el libro a OneDrive y lo comparte con la otra con permiso de edición.',
      pasos: {
        explorador: [{ texto: 'Persona A: sube el libro a OneDrive y compártelo con B (Puede editar).', ruta: ['Archivo', 'Compartir'] }, { texto: 'Persona B: abre el libro y deja al menos un comentario en una cifra.', ruta: ['Revisar', 'Nuevo comentario'] }, 'Persona A: responde el comentario y haz el cambio acordado.', { texto: 'Desbloquea B4:G11 y protege la hoja.', ruta: ['Revisar', 'Proteger hoja'] }, { texto: 'Revisen juntos el historial de versiones.', ruta: ['Archivo', 'Información', 'Historial de versiones'] }, 'Descarguen una copia (Archivo › Guardar como › Descargar una copia) y súbanla aquí.'],
        analista: ['Compartan el libro en OneDrive, conversen con comentarios (al menos un comentario con respuesta), atiendan el cambio, desbloqueen B4:G11 y protejan la hoja.', 'Descarguen una copia y súbanla.'],
        experto: ['Lo del nivel Analista.', 'Agreguen una nota en A11 y protejan también la estructura del libro (Revisar › Proteger libro).', 'Descarguen una copia y súbanla.'],
      },
      pruebas: [
        { titulo: 'Comentario con respuesta', fn: (L, A) => { const h = A.hoja('Presupuesto'); const raices = h.comentarios.filter((c) => !c.padre); const conResp = raices.find((c) => h.comentarios.some((r) => r.padre === c.id)); if (!raices.length) return 'No encontré comentarios: agrega uno con Revisar › Nuevo comentario.'; if (!conResp) return 'Hay comentarios, pero ninguno tiene respuesta.'; const autores = new Set(h.comentarios.map((c) => c.autor)); return autores.size >= 2 ? true : { ok: true, mensaje: 'Comentario con respuesta (nota: todos los mensajes son de la misma cuenta; en parejas deberían verse dos autores).' }; } },
        { titulo: 'Celdas de captura desbloqueadas', fn: (L) => { for (const x of L.celdasRango('B4:G11')) if (L.estilo('Presupuesto', x.dir).bloqueada) return x.dir + ' sigue bloqueada.'; for (const x of L.celdasRango('H4:H12')) if (!L.estilo('Presupuesto', x.dir).bloqueada) return x.dir + ' tiene fórmula y debería quedar bloqueada.'; return true; } },
        { titulo: 'Hoja protegida', fn: (L) => (L.hoja('Presupuesto').protegida ? true : 'Protege la hoja Presupuesto.') },
        { titulo: 'Nota en A11', nivel: 'experto', fn: (L) => (L.hoja('Presupuesto').notas.some((n) => n.ref === 'A11') ? true : 'Agrega una nota en A11.') },
        { titulo: 'Estructura del libro protegida', nivel: 'experto', fn: (L) => (L.proteccionLibro ? true : 'Protege la estructura del libro (Revisar › Proteger libro).') },
      ],
    },
    donde: [
      { comando: 'Nuevo comentario', ruta: ['Revisar', 'Nuevo comentario'] },
      { comando: 'Nueva nota', ruta: ['Revisar', 'Notas', 'Nueva nota'] },
      { comando: 'Proteger hoja', ruta: ['Revisar', 'Proteger hoja'] },
      { comando: 'Historial de versiones', ruta: ['Archivo', 'Información', 'Historial de versiones'], nota: 'Solo para archivos guardados en OneDrive o SharePoint.' },
    ],
    atajos: ['<kbd>Ctrl+Alt+M</kbd> nuevo comentario (Excel para Windows).', '<kbd>Mayús+F2</kbd> nueva nota.'],
  });
})();
