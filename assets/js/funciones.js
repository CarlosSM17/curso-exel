/* Catálogo de funciones del curso: nombre en español, nombre con que se guarda en el
   archivo (inglés, con prefijo _xlfn. cuando aplica), sintaxis, descripción y ejemplo. */
(function () {
  'use strict';
  const LT = (window.LT = window.LT || {});

  // [es, archivo, sintaxis, descripción, ejemplo con datos de la clínica, módulo, categoría, ¿disponible en el simulador?]
  const TABLA = [
    ['SUMA', 'SUM', 'SUMA(número1, [número2], …)', 'Suma números o rangos.', '=SUMA(C2:C7) suma el volumen de soluciones del turno.', 2, 'Matemáticas'],
    ['PROMEDIO', 'AVERAGE', 'PROMEDIO(número1, [número2], …)', 'Calcula la media aritmética.', '=PROMEDIO(F2:F15) da el IMC promedio de los pacientes medidos.', 2, 'Estadística'],
    ['MAX', 'MAX', 'MAX(número1, [número2], …)', 'Devuelve el valor más grande.', '=MAX(F2:F15) es el IMC más alto del turno.', 2, 'Estadística'],
    ['MIN', 'MIN', 'MIN(número1, [número2], …)', 'Devuelve el valor más pequeño.', '=MIN(F2:F15) es el IMC más bajo del turno.', 2, 'Estadística'],
    ['CONTAR', 'COUNT', 'CONTAR(valor1, [valor2], …)', 'Cuenta las celdas que contienen números.', '=CONTAR(F2:F15) cuenta los pacientes con IMC calculado.', 2, 'Estadística'],
    ['CONTARA', 'COUNTA', 'CONTARA(valor1, [valor2], …)', 'Cuenta las celdas que no están vacías.', '=CONTARA(A2:A379) cuenta los folios de consultas registradas.', 2, 'Estadística'],
    ['CONTAR.BLANCO', 'COUNTBLANK', 'CONTAR.BLANCO(rango)', 'Cuenta las celdas vacías.', '=CONTAR.BLANCO(H2:H41) cuenta requisiciones sin fecha de entrega.', 8, 'Estadística'],
    ['SI', 'IF', 'SI(prueba_lógica, [valor_si_verdadero], [valor_si_falso])', 'Elige entre dos resultados según una condición.', '=SI(C2>=$F$1, "Alterada", "Normal") clasifica la glucosa en ayuno.', 7, 'Lógicas'],
    ['Y', 'AND', 'Y(valor_lógico1, [valor_lógico2], …)', 'VERDADERO si todas las condiciones se cumplen.', '=Y(C2>=140, D2>=90) es VERDADERO si ambas presiones están elevadas.', 7, 'Lógicas'],
    ['O', 'OR', 'O(valor_lógico1, [valor_lógico2], …)', 'VERDADERO si al menos una condición se cumple.', '=O(C2>=140, D2>=90) es VERDADERO si alguna presión está elevada.', 7, 'Lógicas'],
    ['NO', 'NOT', 'NO(valor_lógico)', 'Invierte un valor lógico.', '=NO(G2="Sí") es VERDADERO si el paciente no está en control.', 7, 'Lógicas'],
    ['CONTAR.SI', 'COUNTIF', 'CONTAR.SI(rango, criterio)', 'Cuenta las celdas que cumplen un criterio.', '=CONTAR.SI(C2:C21, ">="&F1) cuenta las glucosas alteradas.', 7, 'Estadística'],
    ['SUMAR.SI', 'SUMIF', 'SUMAR.SI(rango, criterio, [rango_suma])', 'Suma las celdas que cumplen un criterio.', '=SUMAR.SI(B2:B21, "Centro", C2:C21) suma las atenciones de Centro.', 7, 'Matemáticas'],
    ['PROMEDIO.SI', 'AVERAGEIF', 'PROMEDIO.SI(rango, criterio, [rango_promedio])', 'Promedia las celdas que cumplen un criterio.', '=PROMEDIO.SI(B2:B21, "Norte", C2:C21) promedia la glucosa de Norte.', 7, 'Estadística'],
    ['HOY', 'TODAY', 'HOY()', 'Devuelve la fecha de hoy (cambia cada día).', '=HOY()-B2 son los días desde la toma de la muestra.', 7, 'Fecha y hora'],
    ['AHORA', 'NOW', 'AHORA()', 'Devuelve la fecha y la hora actuales.', '=AHORA() registra fecha y hora de una toma.', 7, 'Fecha y hora'],
    ['AÑO', 'YEAR', 'AÑO(fecha)', 'Extrae el año de una fecha.', '=AÑO(C2) da el año de ingreso del profesional.', 7, 'Fecha y hora'],
    ['MES', 'MONTH', 'MES(fecha)', 'Extrae el número de mes (1 a 12).', '=MES(B2) da el mes de la consulta (para agrupar).', 7, 'Fecha y hora'],
    ['DIA', 'DAY', 'DIA(fecha)', 'Extrae el día del mes.', '=DIA(B2)', 7, 'Fecha y hora'],
    ['FECHA', 'DATE', 'FECHA(año, mes, día)', 'Construye una fecha.', '=FECHA(2025, 12, 31)', 7, 'Fecha y hora'],
    ['DIASEM', 'WEEKDAY', 'DIASEM(fecha, [tipo])', 'Día de la semana como número.', '=DIASEM(B2, 2) da 1 para lunes: útil para ver la demanda por día.', 7, 'Fecha y hora'],
    ['DIAS', '_xlfn.DAYS', 'DIAS(fecha_final, fecha_inicial)', 'Días entre dos fechas.', '=DIAS(H2, B2) días entre la requisición y la entrega.', 7, 'Fecha y hora'],
    ['CONCAT', '_xlfn.CONCAT', 'CONCAT(texto1, [texto2], …)', 'Une textos.', '=CONCAT(A2, " - ", B2) une profesional y puesto.', 7, 'Texto'],
    ['CONCATENAR', 'CONCATENATE', 'CONCATENAR(texto1, [texto2], …)', 'Une textos (versión anterior de CONCAT).', '=CONCATENAR(A2, " ", B2)', 7, 'Texto'],
    ['UNIRCADENAS', '_xlfn.TEXTJOIN', 'UNIRCADENAS(delimitador, ignorar_vacías, texto1, …)', 'Une textos con un separador.', '=UNIRCADENAS(", ", VERDADERO, A2:A5) une varios diagnósticos.', 7, 'Texto'],
    ['IZQUIERDA', 'LEFT', 'IZQUIERDA(texto, [núm_caracteres])', 'Extrae caracteres del inicio.', '=IZQUIERDA(A2, 3) da "CON" del código CON-001.', 7, 'Texto'],
    ['DERECHA', 'RIGHT', 'DERECHA(texto, [núm_caracteres])', 'Extrae caracteres del final.', '=DERECHA(A2, 3) da "001".', 7, 'Texto'],
    ['EXTRAE', 'MID', 'EXTRAE(texto, posición_inicial, núm_caracteres)', 'Extrae caracteres de en medio.', '=EXTRAE(A2, 5, 4) extrae el número del expediente EXP-1001.', 7, 'Texto'],
    ['LARGO', 'LEN', 'LARGO(texto)', 'Cuenta los caracteres de un texto.', '=LARGO(D2) revisa que el teléfono tenga 10 dígitos.', 8, 'Texto'],
    ['MAYUSC', 'UPPER', 'MAYUSC(texto)', 'Convierte a mayúsculas.', '=MAYUSC(A2) unifica los códigos de servicio.', 8, 'Texto'],
    ['MINUSC', 'LOWER', 'MINUSC(texto)', 'Convierte a minúsculas.', '=MINUSC(E2) normaliza correos de pacientes.', 8, 'Texto'],
    ['NOMPROPIO', 'PROPER', 'NOMPROPIO(texto)', 'Primera letra de cada palabra en mayúscula.', '=NOMPROPIO(B2) convierte "lucía pérez" en "Lucía Pérez".', 8, 'Texto'],
    ['ESPACIOS', 'TRIM', 'ESPACIOS(texto)', 'Quita espacios sobrantes.', '=ESPACIOS(B2) quita espacios sobrantes de un nombre capturado.', 8, 'Texto'],
    ['TEXTO', 'TEXT', 'TEXTO(valor, formato)', 'Convierte un número en texto con formato.', '=TEXTO(F2, "$#,##0.00") da la cuota con formato para una carta.', 12, 'Texto'],
    ['SUSTITUIR', 'SUBSTITUTE', 'SUSTITUIR(texto, texto_original, texto_nuevo, [núm_instancia])', 'Reemplaza texto dentro de un texto.', '=SUSTITUIR(A2, "-", "") quita el guion del código.', 8, 'Texto'],
    ['HALLAR', 'SEARCH', 'HALLAR(texto_buscado, dentro_del_texto, [núm_inicial])', 'Posición de un texto (no distingue mayúsculas).', '=HALLAR("@", E2)', 8, 'Texto'],
    ['ENCONTRAR', 'FIND', 'ENCONTRAR(texto_buscado, dentro_del_texto, [núm_inicial])', 'Posición de un texto (distingue mayúsculas).', '=ENCONTRAR(" ", B2)', 8, 'Texto'],
    ['VALOR', 'VALUE', 'VALOR(texto)', 'Convierte un texto que parece número en número.', '=VALOR("120") convierte un texto en número.', 8, 'Texto'],
    ['REDONDEAR', 'ROUND', 'REDONDEAR(número, núm_decimales)', 'Redondea a cierto número de decimales.', '=REDONDEAR(B2*$F$1, 1) redondea una dosis a una décima.', 7, 'Matemáticas'],
    ['REDONDEAR.MAS', 'ROUNDUP', 'REDONDEAR.MAS(número, núm_decimales)', 'Redondea hacia arriba.', '=REDONDEAR.MAS(B8, 0) cajas necesarias para cubrir el mínimo.', 7, 'Matemáticas'],
    ['REDONDEAR.MENOS', 'ROUNDDOWN', 'REDONDEAR.MENOS(número, núm_decimales)', 'Redondea hacia abajo.', '=REDONDEAR.MENOS(B2, 0)', 7, 'Matemáticas'],
    ['ENTERO', 'INT', 'ENTERO(número)', 'Redondea hacia abajo al entero.', '=ENTERO((HOY()-C2)/365.25) edad en años cumplidos.', 7, 'Matemáticas'],
    ['RAIZ', 'SQRT', 'RAIZ(número)', 'Raíz cuadrada de un número.', '=RAIZ(D2*E2*100/3600) superficie corporal (Mosteller).', 2, 'Matemáticas'],
    ['ABS', 'ABS', 'ABS(número)', 'Valor absoluto.', '=ABS(I13) magnitud del balance hídrico sin signo.', 2, 'Matemáticas'],
    ['SUMAPRODUCTO', 'SUMPRODUCT', 'SUMAPRODUCTO(matriz1, [matriz2], …)', 'Multiplica y suma matrices.', '=SUMAPRODUCTO(C2:C16, F2:F16) valor total del inventario de farmacia.', 10, 'Matemáticas'],
    ['SUBTOTALES', 'SUBTOTAL', 'SUBTOTALES(núm_función, ref1, …)', 'Subtotal que ignora filas filtradas (109 = suma).', '=SUBTOTALES(109, J2:J41) suma solo las requisiciones visibles.', 9, 'Matemáticas'],
    ['BUSCARX', '_xlfn.XLOOKUP', 'BUSCARX(valor_buscado, matriz_buscada, matriz_devuelta, [si_no_se_encuentra], [modo_coincidencia], [modo_búsqueda])', 'Busca un valor y devuelve el dato correspondiente.', '=BUSCARX(E2, Catálogo!A2:A11, Catálogo!B2:B11) trae la cuota del estudio.', 12, 'Búsqueda'],
    ['BUSCARV', 'VLOOKUP', 'BUSCARV(valor_buscado, matriz, indicador_columnas, [rango])', 'Busca en la primera columna y devuelve otra columna.', '=BUSCARV(E2, Catálogo!A2:C11, 3, FALSO) trae la preparación del estudio.', 12, 'Búsqueda'],
    ['INDICE', 'INDEX', 'INDICE(matriz, núm_fila, [núm_columna])', 'Devuelve el valor de una posición.', '=INDICE(C2:C11, 4)', 12, 'Búsqueda'],
    ['COINCIDIR', 'MATCH', 'COINCIDIR(valor_buscado, matriz_buscada, [tipo_de_coincidencia])', 'Devuelve la posición de un valor.', '=COINCIDIR("Perfil de lípidos", A2:A11, 0)', 12, 'Búsqueda'],
    ['SI.CONJUNTO', '_xlfn.IFS', 'SI.CONJUNTO(prueba1, valor1, [prueba2, valor2], …)', 'Evalúa varias condiciones en orden.', '=SI.CONJUNTO(C2>=126,"Diabetes",C2>=100,"Prediabetes",VERDADERO,"Normal")', 7, 'Lógicas'],
    ['SUMAR.SI.CONJUNTO', 'SUMIFS', 'SUMAR.SI.CONJUNTO(rango_suma, rango_criterios1, criterio1, …)', 'Suma con varios criterios.', '=SUMAR.SI.CONJUNTO(H:H, C:C, "Sur", D:D, "Hipertensión") suma minutos de espera.', 13, 'Matemáticas'],
    ['CONTAR.SI.CONJUNTO', 'COUNTIFS', 'CONTAR.SI.CONJUNTO(rango_criterios1, criterio1, …)', 'Cuenta con varios criterios.', '=CONTAR.SI.CONJUNTO(C:C, C2, D:D, C3, G:G, "Sí") pacientes en control.', 13, 'Estadística'],
    ['PROMEDIO.SI.CONJUNTO', 'AVERAGEIFS', 'PROMEDIO.SI.CONJUNTO(rango_promedio, rango_criterios1, criterio1, …)', 'Promedia con varios criterios (solo en Excel real).', '=PROMEDIO.SI.CONJUNTO(H:H, C:C, "Norte", D:D, "Diabetes tipo 2")', 13, 'Estadística', false],
    ['MAX.SI.CONJUNTO', '_xlfn.MAXIFS', 'MAX.SI.CONJUNTO(rango_max, rango_criterios1, criterio1, …)', 'Máximo con varios criterios.', '=MAX.SI.CONJUNTO(C2:C21, B2:B21, "Centro") glucosa más alta de Centro.', 13, 'Estadística'],
    ['MIN.SI.CONJUNTO', '_xlfn.MINIFS', 'MIN.SI.CONJUNTO(rango_min, rango_criterios1, criterio1, …)', 'Mínimo con varios criterios.', '=MIN.SI.CONJUNTO(C2:C21, B2:B21, "Sur")', 13, 'Estadística'],
    ['FILTRAR', '_xlfn._xlws.FILTER', 'FILTRAR(matriz, incluir, [si_está_vacío])', 'Devuelve las filas que cumplen una condición (se desborda).', '=FILTRAR(Órdenes!C2:C50, Órdenes!E2:E50=C2) lista los pacientes de un estudio.', 12, 'Búsqueda'],
    ['ORDENAR', '_xlfn._xlws.SORT', 'ORDENAR(matriz, [índice_orden], [orden], [por_columna])', 'Ordena un rango (se desborda).', '=ORDENAR(A2:C21, 3, -1) pacientes de la glucosa más alta a la más baja.', 12, 'Búsqueda'],
    ['UNICOS', '_xlfn.UNIQUE', 'UNICOS(matriz, [por_columna], [exactamente_una_vez])', 'Lista los valores sin repetir (se desborda).', '=UNICOS(E2:E41) lista los estudios distintos solicitados.', 12, 'Búsqueda'],
    ['SECUENCIA', '_xlfn.SEQUENCE', 'SECUENCIA(filas, [columnas], [inicio], [incremento])', 'Genera una lista de números.', '=SECUENCIA(12) números de mes.', 12, 'Matemáticas'],
    ['SI.ERROR', 'IFERROR', 'SI.ERROR(valor, valor_si_error)', 'Muestra otro resultado si hay error.', '=SI.ERROR(C6/C5, 0) evita #¡DIV/0! en un indicador sin consultas.', 13, 'Lógicas'],
    ['SI.ND', '_xlfn.IFNA', 'SI.ND(valor, valor_si_nd)', 'Muestra otro resultado si hay #N/A.', '=SI.ND(BUSCARV(E2, A:C, 2, FALSO), "Sin estudio")', 12, 'Lógicas'],
    ['ESERROR', 'ISERROR', 'ESERROR(valor)', 'VERDADERO si el valor es un error.', '=ESERROR(D2)', 12, 'Información'],
    ['ESBLANCO', 'ISBLANK', 'ESBLANCO(valor)', 'VERDADERO si la celda está vacía.', '=ESBLANCO(H2) detecta requisiciones sin fecha de entrega.', 10, 'Información'],
    ['PAGO', 'PMT', 'PAGO(tasa, nper, va, [vf], [tipo])', 'Pago periódico de un préstamo.', '=PAGO(1.2%, 24, -85000) pago mensual de un electrocardiógrafo.', 13, 'Financieras'],
    ['K.ESIMO.MAYOR', 'LARGE', 'K.ESIMO.MAYOR(matriz, k)', 'El k-ésimo valor más grande.', '=K.ESIMO.MAYOR(C2:C21, 2) segunda glucosa más alta.', 13, 'Estadística'],
    ['MEDIANA', 'MEDIAN', 'MEDIANA(número1, [número2], …)', 'Valor central de un conjunto.', '=MEDIANA(H2:H379) espera mediana: no la distorsionan los valores extremos.', 7, 'Estadística'],
  ];

  const FUNCIONES = {};
  for (const [es, archivo, sintaxis, desc, ejemplo, modulo, categoria, sim] of TABLA) {
    FUNCIONES[es] = { es, archivo, en: archivo.replace(/^_xlfn\.(_xlws\.)?/, ''), sintaxis, desc, ejemplo, modulo, categoria, simulador: sim !== false };
  }

  /* Atajos: los de Excel en español; algunos el navegador los reserva */
  const ATAJOS = [
    ['Enter / Mayús+Enter', 'Confirmar y bajar / subir', 1],
    ['Tab / Mayús+Tab', 'Confirmar y moverse a la derecha / izquierda', 1],
    ['F2', 'Editar la celda activa', 1],
    ['Esc', 'Cancelar la edición', 1],
    ['Ctrl+C / Ctrl+X / Ctrl+V', 'Copiar / cortar / pegar', 1],
    ['Ctrl+Alt+V', 'Pegado especial', 1],
    ['Ctrl+Z / Ctrl+Y', 'Deshacer / rehacer', 1],
    ['Ctrl+B', 'Buscar', 1],
    ['Ctrl+L', 'Buscar y reemplazar', 1],
    ['Ctrl+J', 'Rellenar hacia abajo (Excel en español; en inglés es Ctrl+D)', 1],
    ['Ctrl+D', 'Rellenar hacia la derecha (Excel en español; en inglés es Ctrl+R)', 1],
    ['Alt+=', 'Autosuma', 2],
    ['F4', 'Fijar referencia: A1 → $A$1 → A$1 → $A1', 7],
    ['Ctrl+Flecha', 'Saltar al final de los datos', 1],
    ['Ctrl+Mayús+Flecha', 'Seleccionar hasta el final de los datos', 1],
    ['Ctrl+N', 'Negrita (en Excel en español; en el navegador usa el botón)', 3],
    ['Ctrl+K', 'Cursiva', 3],
    ['Ctrl+S', 'Subrayado', 3],
    ['Ctrl+1', 'Formato de celdas', 3],
    ['Datos › Relleno rápido', 'Completa una columna a partir de uno o dos ejemplos', 8],
    ['Ctrl+`', 'Mostrar fórmulas', 2],
    ['Alt+F11', 'Abrir el editor de Visual Basic (Excel de escritorio)', 12],
    ['Alt+F8', 'Ver macros (Excel de escritorio)', 12],
  ];

  /* Alias que el simulador traduce para el motor de fórmulas */
  const ALIAS_MOTOR = { CONCAT: 'CONCATENAR', FILTRAR: 'FILTER', DIAS: 'DÍAS', 'SI.ND': 'IFNA' };
  const ALIAS_INVERSO = { FILTER: 'FILTRAR', 'DÍAS': 'DIAS', IFNA: 'SI.ND' };

  LT.FUNCIONES = FUNCIONES;
  LT.ATAJOS = ATAJOS;
  LT.ALIAS_MOTOR = ALIAS_MOTOR;
  LT.ALIAS_INVERSO = ALIAS_INVERSO;
  LT.funcionPorArchivo = (nombre) => {
    const limpio = String(nombre).toUpperCase().replace(/^_XLFN\.(_XLWS\.)?/, '');
    return Object.values(FUNCIONES).find((f) => f.en === limpio) || null;
  };
})();
