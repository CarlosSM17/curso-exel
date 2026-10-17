# Excel · versión 3

Curso de Excel en **3 sesiones de 3 horas** para estudiantes con conocimientos básicos de Excel. Todos los retos usan el caso ficticio de la **Clínica Universitaria Vida Sana** (sedes Centro, Norte y Sur; área de Calidad y Estadística con la Dra. Laura Méndez).

Es un sitio web estático: no necesita servidor ni base de datos. El simulador, la revisión de archivos, el progreso y el área docente corren en el navegador.

## Temario

| Sesión | Nivel | Módulos (minutos) | Integrador |
|---|---|---|---|
| 1 | Fundamentos | 1 Editar un libro de trabajo (15) · 2 Fórmulas básicas (25) · 3 Formato a hojas de trabajo (20) · 4 Insertar objetos (10) · 5 Ver y administrar hojas de cálculo (15) · 6 Gráficos (30) · 7 Fórmulas intermedias (40) | Reporte semanal de atenciones |
| 2 | Análisis de datos | 8 Organizar datos (35) · 9 Tablas (30) · 10 Formato intermedio (30) · 11 Tablas dinámicas (60) | Base de requisiciones confiable |
| 3 | Gestión y tableros | 12 Gestionar y automatizar información (85) · 13 Dashboards (70) | Tablero y gestión automatizada |

Cada sesión tiene un arranque de 5 minutos, un receso de 15 y un cierre de 5. Los integradores se resuelven fuera del aula.

### Ejemplos del caso por módulo

| Módulo | Situación |
|---|---|
| 1 Editar | Catálogo de servicios: insertar, corregir y estandarizar nombres de medicamentos |
| 2 Fórmulas básicas | IMC de un turno, balance hídrico y superficie corporal (Mosteller) |
| 3 Formato | Reporte semanal de atenciones |
| 4 Insertar objetos | Hoja de indicaciones para estudios: logo, forma, icono y enlace a citas |
| 5 Hojas | Libro por sedes con resumen consolidado |
| 6 Gráficos | Atenciones por servicio, por mes (vacunación contra rehabilitación) y por sede |
| 7 Fórmulas intermedias | Clasificación de glucosa en ayuno con SI, umbral absoluto y conteos condicionales |
| 8 Organizar datos | Padrón de pacientes con expedientes duplicados y sedes mal capturadas |
| 9 Tablas | Requisiciones de insumos con segmentaciones |
| 10 Formato intermedio | Semáforo de existencias de la farmacia |
| 11 Tablas dinámicas | Atenciones por sede y trimestre, con interpretación de resultados |
| 12 Gestionar y automatizar | Órdenes de estudios: diseño de la base, validación, BUSCARX, consulta, macro con botón y carta de indicaciones con combinar correspondencia |
| 13 Dashboards | Tablero del programa de diabetes e hipertensión: indicadores de Donabedian, metas, semáforo y segmentaciones conectadas |

## Área docente

- **Entrada:** enlace «Acceso docente» al pie de cualquier página, o directamente `docente/index.html`.
- **Pestañas:**
  - **Plan de sesiones:** guion minuto a minuto.
  - **Guía teórica de referencia:** 13 fichas de módulo, marco pedagógico, datos de salud (calidad y confidencialidad), evaluación, solución de problemas y referencias.
  - **Soluciones de retos.**
  - **Libros de solución:** 17 archivos cifrados.
  - **Reportes del grupo.**
  - **Notas técnicas.**

## Guía gráfica de funciones

`funciones.html` explica las 34 funciones del curso con ejemplos clínicos. Incluye RAIZ, CONTAR.SI.CONJUNTO y SUMAR.SI.CONJUNTO. Cada ficha tiene una mini hoja calculada en vivo, argumentos de colores, rangos resaltados y errores frecuentes.

## Usar sin internet

Copia la carpeta del sitio y abre `index.html` con Chrome o Edge. Todo funciona sin conexión, incluida el área docente.

## Estructura

```
index.html              inicio: ruta de 3 sesiones, niveles, módulos, insignias
modulos/m01–m13.html    una página por módulo
funciones.html          guía gráfica de funciones
glosario.html           funciones español-inglés y atajos
ubicacion.html          prueba de ubicación (?nivel=basico|intermedio|avanzado, &momento=post)
integrador.html         retos integradores (?nivel=…), rúbrica y constancia
docente/index.html      área docente (contenido cifrado en docente/contenido.js y docente/archivos/)
assets/js/              plataforma: simulador, verificadores, widgets (widgets2.js incluye el simulador
                        de dashboards W.tablero), guia-funciones.js, docente.js, páginas
assets/js/modulos/      contenido de cada módulo (mXX.js) y utilidades del caso (comun.js)
assets/js/datos.js      datos ficticios del caso (generados)
assets/vendor/          HyperFormula 3.4.0 (+ idioma español) y JSZip 3.10.1
laboratorios/           13 libros de laboratorio y la carta de Word del módulo 12
integradores/           3 retos integradores
datos/                  clinica-vida-sana-base.xlsx, libro con todos los datos del caso
herramientas/           scripts de Python: datos (salud_datos.py), libros, páginas y cifrado
```

## Modificar el contenido

- **Textos, retos y pruebas de un módulo:** `assets/js/modulos/mXX.js`. El formato se explica en Área docente › Notas técnicas.
- **Temario y agenda:** `assets/js/curso.js`. Los minutos de cada sesión deben sumar 180.
- **Datos del caso y libros:**
  ```bash
  pip install openpyxl pillow cryptography
  python herramientas/generar_datos_js.py     # assets/js/datos.js (semilla fija: siempre los mismos datos)
  python herramientas/generar_libros.py       # laboratorios, integradores, datos y soluciones (a la carpeta privada)
  python herramientas/generar_paginas.py      # páginas HTML (si cambias títulos o scripts)
  python herramientas/proteger_docente.py --clave "…"   # vuelve a cifrar el área docente
  ```

## Requisitos de los participantes

- Computadora con teclado y ratón y un navegador actual (Chrome, Edge, Firefox o Safari).
- Excel de Microsoft 365 para Windows o Mac (recomendado). Excel para la web sirve en casi todos los laboratorios.
- **Sesión 3:** Excel y Word de escritorio. Excel para la web y iPad no ejecutan macros VBA ni combinan correspondencia con un libro local. Los archivos descargados llegan con las macros bloqueadas: clic derecho › Propiedades › Desbloquear.

## Datos y confidencialidad

Todos los pacientes, valores clínicos y cifras del caso son **ficticios** y se generan con una semilla fija. Los umbrales clínicos (glucosa, presión arterial, superficie corporal) siguen criterios de uso común, pero el curso enseña Excel, no clínica. La guía teórica incluye recomendaciones para trabajar con datos de salud reales: minimizar datos, anonimizar y respetar la NOM-004-SSA3-2012 y la normativa de protección de datos personales.

## Limitaciones conocidas

- El simulador reproduce lo esencial de Excel, no todo. Por ejemplo, no tiene celdas combinadas ni PROMEDIO.SI.CONJUNTO.
- Los libros de solución se generan con openpyxl, que no crea formas, iconos, minigráficos, segmentaciones, tablas dinámicas, temas ni código VBA. En los laboratorios afectados (4, 6, 9, 10, 11, 12 y 13, y los integradores intermedio y avanzado), la solución incluye una hoja «Solución» con los pasos.
- La solución del laboratorio 1 está resuelta en nivel Analista.
- El progreso se guarda en el navegador (localStorage, clave `excelSalud.progreso.v1`, distinta de la v1 y la v2). El reporte descargable sirve como respaldo.
