/* Catálogo de funciones del curso: nombre en español, nombre con que se guarda en el
   archivo (inglés, con prefijo _xlfn. cuando aplica), sintaxis, descripción y ejemplo. */
(function () {
  'use strict';
  const LT = (window.LT = window.LT || {});

  // [es, archivo, sintaxis, descripción, ejemplo con datos de La Taza, módulo, categoría, ¿disponible en el simulador?]
  const TABLA = [
    ['SUMA', 'SUM', 'SUMA(número1, [número2], …)', 'Suma números o rangos.', '=SUMA(E2:E15) suma los importes del corte de caja.', 2, 'Matemáticas'],
    ['PROMEDIO', 'AVERAGE', 'PROMEDIO(número1, [número2], …)', 'Calcula la media aritmética.', '=PROMEDIO(E2:E15) da el ticket promedio.', 2, 'Estadística'],
    ['MAX', 'MAX', 'MAX(número1, [número2], …)', 'Devuelve el valor más grande.', '=MAX(E2:E15) es la venta mayor del día.', 2, 'Estadística'],
    ['MIN', 'MIN', 'MIN(número1, [número2], …)', 'Devuelve el valor más pequeño.', '=MIN(E2:E15) es la venta menor del día.', 2, 'Estadística'],
    ['CONTAR', 'COUNT', 'CONTAR(valor1, [valor2], …)', 'Cuenta las celdas que contienen números.', '=CONTAR(E2:E15) cuenta los tickets con importe.', 2, 'Estadística'],
    ['CONTARA', 'COUNTA', 'CONTARA(valor1, [valor2], …)', 'Cuenta las celdas que no están vacías.', '=CONTARA(A2:A21) cuenta los vendedores.', 2, 'Estadística'],
    ['CONTAR.BLANCO', 'COUNTBLANK', 'CONTAR.BLANCO(rango)', 'Cuenta las celdas vacías.', '=CONTAR.BLANCO(H2:H41) cuenta pedidos sin fecha de entrega.', 9, 'Estadística'],
    ['SI', 'IF', 'SI(prueba_lógica, [valor_si_verdadero], [valor_si_falso])', 'Elige entre dos resultados según una condición.', '=SI(C2>=$F$1, C2*$F$2, 0) calcula la comisión.', 8, 'Lógicas'],
    ['Y', 'AND', 'Y(valor_lógico1, [valor_lógico2], …)', 'VERDADERO si todas las condiciones se cumplen.', '=Y(C2>=10000, B2="Centro")', 8, 'Lógicas'],
    ['O', 'OR', 'O(valor_lógico1, [valor_lógico2], …)', 'VERDADERO si al menos una condición se cumple.', '=O(B2="Norte", B2="Sur")', 8, 'Lógicas'],
    ['NO', 'NOT', 'NO(valor_lógico)', 'Invierte un valor lógico.', '=NO(I2="Entregado")', 8, 'Lógicas'],
    ['CONTAR.SI', 'COUNTIF', 'CONTAR.SI(rango, criterio)', 'Cuenta las celdas que cumplen un criterio.', '=CONTAR.SI(C2:C21, ">="&F1) cuenta quién alcanzó la meta.', 8, 'Estadística'],
    ['SUMAR.SI', 'SUMIF', 'SUMAR.SI(rango, criterio, [rango_suma])', 'Suma las celdas que cumplen un criterio.', '=SUMAR.SI(B2:B21, "Centro", D2:D21) suma las comisiones de Centro.', 8, 'Matemáticas'],
    ['PROMEDIO.SI', 'AVERAGEIF', 'PROMEDIO.SI(rango, criterio, [rango_promedio])', 'Promedia las celdas que cumplen un criterio.', '=PROMEDIO.SI(B2:B21, "Norte", C2:C21)', 8, 'Estadística'],
    ['HOY', 'TODAY', 'HOY()', 'Devuelve la fecha de hoy (cambia cada día).', '=HOY()-F2 son los días desde el pedido.', 8, 'Fecha y hora'],
    ['AHORA', 'NOW', 'AHORA()', 'Devuelve la fecha y la hora actuales.', '=AHORA()', 8, 'Fecha y hora'],
    ['AÑO', 'YEAR', 'AÑO(fecha)', 'Extrae el año de una fecha.', '=AÑO(B2)', 8, 'Fecha y hora'],
    ['MES', 'MONTH', 'MES(fecha)', 'Extrae el número de mes (1 a 12).', '=MES(B2) para agrupar ventas por mes.', 8, 'Fecha y hora'],
    ['DIA', 'DAY', 'DIA(fecha)', 'Extrae el día del mes.', '=DIA(B2)', 8, 'Fecha y hora'],
    ['FECHA', 'DATE', 'FECHA(año, mes, día)', 'Construye una fecha.', '=FECHA(2025, 12, 31)', 8, 'Fecha y hora'],
    ['DIASEM', 'WEEKDAY', 'DIASEM(fecha, [tipo])', 'Día de la semana como número.', '=DIASEM(B2, 2) da 1 para lunes.', 8, 'Fecha y hora'],
    ['DIAS', '_xlfn.DAYS', 'DIAS(fecha_final, fecha_inicial)', 'Días entre dos fechas.', '=DIAS(H2, B2) días entre pedido y entrega.', 8, 'Fecha y hora'],
    ['CONCAT', '_xlfn.CONCAT', 'CONCAT(texto1, [texto2], …)', 'Une textos.', '=CONCAT(A2, " - ", B2) une vendedor y sucursal.', 8, 'Texto'],
    ['CONCATENAR', 'CONCATENATE', 'CONCATENAR(texto1, [texto2], …)', 'Une textos (versión anterior de CONCAT).', '=CONCATENAR(A2, " ", B2)', 8, 'Texto'],
    ['UNIRCADENAS', '_xlfn.TEXTJOIN', 'UNIRCADENAS(delimitador, ignorar_vacías, texto1, …)', 'Une textos con un separador.', '=UNIRCADENAS(", ", VERDADERO, A2:A5)', 8, 'Texto'],
    ['IZQUIERDA', 'LEFT', 'IZQUIERDA(texto, [núm_caracteres])', 'Extrae caracteres del inicio.', '=IZQUIERDA(A2, 3) da "CAF" del código CAF-001.', 8, 'Texto'],
    ['DERECHA', 'RIGHT', 'DERECHA(texto, [núm_caracteres])', 'Extrae caracteres del final.', '=DERECHA(A2, 3) da "001".', 8, 'Texto'],
    ['EXTRAE', 'MID', 'EXTRAE(texto, posición_inicial, núm_caracteres)', 'Extrae caracteres de en medio.', '=EXTRAE(A2, 5, 3)', 8, 'Texto'],
    ['LARGO', 'LEN', 'LARGO(texto)', 'Cuenta los caracteres de un texto.', '=LARGO(D2) revisa que el teléfono tenga 10 dígitos.', 9, 'Texto'],
    ['MAYUSC', 'UPPER', 'MAYUSC(texto)', 'Convierte a mayúsculas.', '=MAYUSC(B2)', 9, 'Texto'],
    ['MINUSC', 'LOWER', 'MINUSC(texto)', 'Convierte a minúsculas.', '=MINUSC(E2) normaliza correos.', 9, 'Texto'],
    ['NOMPROPIO', 'PROPER', 'NOMPROPIO(texto)', 'Primera letra de cada palabra en mayúscula.', '=NOMPROPIO(B2) convierte "lucía pérez" en "Lucía Pérez".', 9, 'Texto'],
    ['ESPACIOS', 'TRIM', 'ESPACIOS(texto)', 'Quita espacios sobrantes.', '=ESPACIOS(B2)', 9, 'Texto'],
    ['TEXTO', 'TEXT', 'TEXTO(valor, formato)', 'Convierte un número en texto con formato.', '=TEXTO(B2, "mmmm") da el nombre del mes.', 8, 'Texto'],
    ['SUSTITUIR', 'SUBSTITUTE', 'SUSTITUIR(texto, texto_original, texto_nuevo, [núm_instancia])', 'Reemplaza texto dentro de un texto.', '=SUSTITUIR(A2, "-", "")', 9, 'Texto'],
    ['HALLAR', 'SEARCH', 'HALLAR(texto_buscado, dentro_del_texto, [núm_inicial])', 'Posición de un texto (no distingue mayúsculas).', '=HALLAR("@", E2)', 9, 'Texto'],
    ['ENCONTRAR', 'FIND', 'ENCONTRAR(texto_buscado, dentro_del_texto, [núm_inicial])', 'Posición de un texto (distingue mayúsculas).', '=ENCONTRAR(" ", B2)', 9, 'Texto'],
    ['VALOR', 'VALUE', 'VALOR(texto)', 'Convierte un texto que parece número en número.', '=VALOR("1200")', 15, 'Texto'],
    ['REDONDEAR', 'ROUND', 'REDONDEAR(número, núm_decimales)', 'Redondea a cierto número de decimales.', '=REDONDEAR(C2*$F$2, 2)', 8, 'Matemáticas'],
    ['REDONDEAR.MAS', 'ROUNDUP', 'REDONDEAR.MAS(número, núm_decimales)', 'Redondea hacia arriba.', '=REDONDEAR.MAS(B8, 0) cafés necesarios.', 18, 'Matemáticas'],
    ['REDONDEAR.MENOS', 'ROUNDDOWN', 'REDONDEAR.MENOS(número, núm_decimales)', 'Redondea hacia abajo.', '=REDONDEAR.MENOS(B2, 0)', 18, 'Matemáticas'],
    ['ENTERO', 'INT', 'ENTERO(número)', 'Redondea hacia abajo al entero.', '=ENTERO(B2/12)', 8, 'Matemáticas'],
    ['ABS', 'ABS', 'ABS(número)', 'Valor absoluto.', '=ABS(B5-B6) diferencia de caja sin signo.', 2, 'Matemáticas'],
    ['SUMAPRODUCTO', 'SUMPRODUCT', 'SUMAPRODUCTO(matriz1, [matriz2], …)', 'Multiplica y suma matrices.', '=SUMAPRODUCTO(C2:C9, D2:D9) total del inventario.', 17, 'Matemáticas'],
    ['SUBTOTALES', 'SUBTOTAL', 'SUBTOTALES(núm_función, ref1, …)', 'Subtotal que ignora filas filtradas (109 = suma).', '=SUBTOTALES(109, H2:H41)', 10, 'Matemáticas'],
    ['BUSCARX', '_xlfn.XLOOKUP', 'BUSCARX(valor_buscado, matriz_buscada, matriz_devuelta, [si_no_se_encuentra], [modo_coincidencia], [modo_búsqueda])', 'Busca un valor y devuelve el dato correspondiente.', '=BUSCARX(B1, Productos!A2:A21, Productos!B2:B21, "No existe")', 17, 'Búsqueda'],
    ['BUSCARV', 'VLOOKUP', 'BUSCARV(valor_buscado, matriz, indicador_columnas, [rango])', 'Busca en la primera columna y devuelve otra columna.', '=BUSCARV(B1, A2:E21, 2, FALSO)', 17, 'Búsqueda'],
    ['INDICE', 'INDEX', 'INDICE(matriz, núm_fila, [núm_columna])', 'Devuelve el valor de una posición.', '=INDICE(B2:B21, 5)', 17, 'Búsqueda'],
    ['COINCIDIR', 'MATCH', 'COINCIDIR(valor_buscado, matriz_buscada, [tipo_de_coincidencia])', 'Devuelve la posición de un valor.', '=COINCIDIR("CAF-004", A2:A21, 0)', 17, 'Búsqueda'],
    ['SI.CONJUNTO', '_xlfn.IFS', 'SI.CONJUNTO(prueba1, valor1, [prueba2, valor2], …)', 'Evalúa varias condiciones en orden.', '=SI.CONJUNTO(D2>=60,"Premium",D2>=40,"Clásico",VERDADERO,"Básico")', 17, 'Lógicas'],
    ['SUMAR.SI.CONJUNTO', 'SUMIFS', 'SUMAR.SI.CONJUNTO(rango_suma, rango_criterios1, criterio1, …)', 'Suma con varios criterios.', '=SUMAR.SI.CONJUNTO(I:I, C:C, "Norte", F:F, "Café frío")', 17, 'Matemáticas'],
    ['CONTAR.SI.CONJUNTO', 'COUNTIFS', 'CONTAR.SI.CONJUNTO(rango_criterios1, criterio1, …)', 'Cuenta con varios criterios.', '=CONTAR.SI.CONJUNTO(D2:D41, "Centro", I2:I41, "Pendiente")', 17, 'Estadística'],
    ['PROMEDIO.SI.CONJUNTO', 'AVERAGEIFS', 'PROMEDIO.SI.CONJUNTO(rango_promedio, rango_criterios1, criterio1, …)', 'Promedia con varios criterios (solo en Excel real).', '=PROMEDIO.SI.CONJUNTO(G:G, C:C, "Sur", F:F, "Té")', 17, 'Estadística', false],
    ['MAX.SI.CONJUNTO', '_xlfn.MAXIFS', 'MAX.SI.CONJUNTO(rango_max, rango_criterios1, criterio1, …)', 'Máximo con varios criterios.', '=MAX.SI.CONJUNTO(I:I, C:C, "Centro")', 17, 'Estadística'],
    ['MIN.SI.CONJUNTO', '_xlfn.MINIFS', 'MIN.SI.CONJUNTO(rango_min, rango_criterios1, criterio1, …)', 'Mínimo con varios criterios.', '=MIN.SI.CONJUNTO(I:I, C:C, "Sur")', 17, 'Estadística'],
    ['FILTRAR', '_xlfn._xlws.FILTER', 'FILTRAR(matriz, incluir, [si_está_vacío])', 'Devuelve las filas que cumplen una condición (se desborda).', '=FILTRAR(A2:D21, C2:C21="Postres")', 17, 'Búsqueda'],
    ['ORDENAR', '_xlfn._xlws.SORT', 'ORDENAR(matriz, [índice_orden], [orden], [por_columna])', 'Ordena un rango (se desborda).', '=ORDENAR(A2:D21, 4, -1) productos del más caro al más barato.', 17, 'Búsqueda'],
    ['UNICOS', '_xlfn.UNIQUE', 'UNICOS(matriz, [por_columna], [exactamente_una_vez])', 'Lista los valores sin repetir (se desborda).', '=UNICOS(C2:C21) lista las categorías.', 17, 'Búsqueda'],
    ['SECUENCIA', '_xlfn.SEQUENCE', 'SECUENCIA(filas, [columnas], [inicio], [incremento])', 'Genera una lista de números.', '=SECUENCIA(12) números de mes.', 17, 'Matemáticas'],
    ['SI.ERROR', 'IFERROR', 'SI.ERROR(valor, valor_si_error)', 'Muestra otro resultado si hay error.', '=SI.ERROR(D2/C2, 0) evita #¡DIV/0!', 15, 'Lógicas'],
    ['SI.ND', '_xlfn.IFNA', 'SI.ND(valor, valor_si_nd)', 'Muestra otro resultado si hay #N/A.', '=SI.ND(BUSCARV(B1, A:B, 2, FALSO), "Sin código")', 15, 'Lógicas'],
    ['ESERROR', 'ISERROR', 'ESERROR(valor)', 'VERDADERO si el valor es un error.', '=ESERROR(D2)', 15, 'Información'],
    ['ESBLANCO', 'ISBLANK', 'ESBLANCO(valor)', 'VERDADERO si la celda está vacía.', '=ESBLANCO(H2)', 16, 'Información'],
    ['PAGO', 'PMT', 'PAGO(tasa, nper, va, [vf], [tipo])', 'Pago periódico de un préstamo.', '=PAGO(1.2%, 24, -85000) pago mensual de una cafetera.', 18, 'Financieras'],
    ['K.ESIMO.MAYOR', 'LARGE', 'K.ESIMO.MAYOR(matriz, k)', 'El k-ésimo valor más grande.', '=K.ESIMO.MAYOR(C2:C21, 2) segunda venta más alta.', 17, 'Estadística'],
    ['MEDIANA', 'MEDIAN', 'MEDIANA(número1, [número2], …)', 'Valor central de un conjunto.', '=MEDIANA(C2:C21)', 8, 'Estadística'],
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
    ['F4', 'Fijar referencia: A1 → $A$1 → A$1 → $A1', 8],
    ['Ctrl+Flecha', 'Saltar al final de los datos', 1],
    ['Ctrl+Mayús+Flecha', 'Seleccionar hasta el final de los datos', 1],
    ['Ctrl+N', 'Negrita (en Excel en español; en el navegador usa el botón)', 3],
    ['Ctrl+K', 'Cursiva', 3],
    ['Ctrl+S', 'Subrayado', 3],
    ['Ctrl+1', 'Formato de celdas', 3],
    ['Datos › Relleno rápido', 'Completa una columna a partir de uno o dos ejemplos', 9],
    ['Ctrl+`', 'Mostrar fórmulas', 15],
    ['Alt+F11', 'Abrir el editor de Visual Basic (Excel de escritorio)', 19],
    ['Alt+F8', 'Ver macros (Excel de escritorio)', 19],
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
