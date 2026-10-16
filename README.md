# Excel con La Taza

Curso de Excel de básico a avanzado en 9 horas, con retos interactivos. Es un sitio web estático: no necesita servidor ni base de datos, y todo (el simulador, la revisión de archivos y el progreso) corre en el navegador.

- **19 módulos** en 3 niveles (básico, intermedio, avanzado), una página por módulo.
- Cada módulo tiene cuatro etapas: **Ver** (ejemplo resuelto con predicción), **Completar** (micro-retos), **Resolver** (reto principal en 3 niveles: Explorador, Analista, Experto) y **Transferir** (laboratorio en Excel real que se sube para revisarlo).
- **Simulador de hoja de cálculo** con fórmulas en español (motor HyperFormula): modo Señalar con clic, F4 para fijar referencias, controlador de relleno con series, copiar y pegar con ajuste de referencias, pegado especial, formato, formato condicional, validación, ordenar, filtros, quitar duplicados, texto en columnas, relleno rápido, tablas de datos, buscar objetivo, escenarios, comentarios, protección, varias hojas, objetos y una grabadora de macros que muestra el código VBA.
- **Verificador de fórmulas**: compara con una solución de referencia, revisa que haya fórmulas y no números escritos, las funciones usadas y que el resultado se mantenga al cambiar los datos.
- **Verificador de archivos** (.xlsx, .xlsm y PDF): lee celdas, fórmulas, formatos, tablas, gráficos, minigráficos, tablas dinámicas, segmentaciones, escalas de tiempo, impresión, comentarios, protección, escenarios, botones con macro y el proyecto VBA.
- **Prueba de ubicación** por nivel (al inicio y al final), **3 retos integradores** con rúbrica y constancia imprimible, **insignias**, **reporte de progreso** para el docente, **guía docente** con consolidación de calificaciones (30 % simulador, 30 % laboratorios, 40 % integradores) y **glosario** español-inglés.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub (por ejemplo `curso-excel`). Con la cuenta gratuita, el repositorio debe ser público para usar Pages.
2. Sube **todo el contenido de esta carpeta** a la raíz del repositorio, conservando las subcarpetas. Desde la web: *Add file › Upload files* y arrastra las carpetas y archivos. Con git:
   ```bash
   git init
   git add .
   git commit -m "Curso Excel con La Taza"
   git branch -M main
   git remote add origin https://github.com/USUARIO/curso-excel.git
   git push -u origin main
   ```
3. En el repositorio: *Settings › Pages › Build and deployment › Source: Deploy from a branch*, rama `main`, carpeta `/ (root)`, *Save*.
4. En uno o dos minutos el sitio queda en `https://USUARIO.github.io/curso-excel/`.

El archivo `.nojekyll` evita que GitHub procese el sitio con Jekyll.

## Incrustar en Google Sites

Google Sites no aloja sitios con muchos archivos JavaScript, así que lo recomendable es publicar primero en GitHub Pages y después incrustar las páginas:

1. En Google Sites: *Insertar › Incorporar › Por URL* y pega la dirección de la página (por ejemplo `https://USUARIO.github.io/curso-excel/` o la de un módulo, `.../modulos/m08.html`).
2. Elige *Página completa* y ajusta la altura del cuadro (las páginas de módulo son largas; 1,200 px o más funciona bien).
3. Puedes crear una página de Google Sites por nivel o por sesión e incrustar en cada una sus módulos.

Dentro de un iframe algunos navegadores limitan el almacenamiento del progreso. Por eso, cuando la plataforma está incrustada aparece el botón **«Pestaña nueva»** en la barra superior: conviene que los participantes trabajen en su propia pestaña.

## Usar desde una carpeta compartida (sin internet)

Copia la carpeta completa y abre `index.html` con Chrome o Edge. Todo funciona sin conexión: las bibliotecas están incluidas en `assets/vendor/`. El progreso se guarda en el navegador de cada equipo; para moverlo a otra computadora se usa *Reporte para el docente* y *Cargar avance* en la página de inicio.

## Estructura

```
index.html            inicio: progreso, niveles, módulos, insignias
modulos/m01–m19.html  una página por módulo
ubicacion.html        prueba de ubicación (?nivel=basico|intermedio|avanzado, &momento=post)
integrador.html       retos integradores (?nivel=…), rúbrica y constancia
docente.html          guía docente, soluciones y consolidación de reportes
glosario.html         funciones español-inglés y atajos
assets/css/           estilos
assets/js/            plataforma (simulador, verificadores, widgets, páginas)
assets/js/modulos/    contenido de cada módulo (mXX.js) y utilidades del caso (comun.js)
assets/js/datos.js    datos del caso (generado)
assets/vendor/        HyperFormula 3.4.0 (+ idioma español) y JSZip 3.10.1
laboratorios/         19 libros de laboratorio y sus soluciones
integradores/         3 retos integradores y sus soluciones
datos/                libro de datos del caso
herramientas/         scripts de Python que generan datos, libros y páginas
```

## Modificar el contenido

- **Textos, retos y pruebas de un módulo:** `assets/js/modulos/mXX.js`. La guía docente (`docente.html`) explica el formato de un reto y de sus pruebas.
- **Datos del caso:** `herramientas/lataza_datos.py`, y después regenera:
  ```bash
  pip install openpyxl pillow
  python herramientas/generar_datos_js.py     # assets/js/datos.js
  python herramientas/generar_libros.py       # libros de laboratorio, integradores y datos
  python herramientas/generar_paginas.py      # páginas HTML (si cambias títulos o scripts)
  ```
  La disposición de celdas de los libros coincide con las pruebas de los laboratorios; si cambias una, cambia la otra.

## Requisitos de los participantes

- Computadora con teclado y ratón y un navegador actual (Chrome, Edge, Firefox o Safari).
- Excel de Microsoft 365 para Windows o Mac (recomendado). Excel para la web sirve en casi todos los laboratorios.
- Módulo 19 (Macros): Excel de escritorio; Excel para la web y iPad no ejecutan macros VBA.
- Módulo 12 (Colaborar): cuenta Microsoft con OneDrive. Módulo 18: escenarios y tablas de datos requieren Excel de escritorio.

## Licencias

- El simulador usa **HyperFormula** con su clave de licencia **GPLv3** (`licenseKey: 'gpl-v3'`). Por eso el código de este sitio se distribuye bajo **GPL-3.0** (archivo `LICENSE`). Si la institución adquiere una licencia comercial de HyperFormula, basta con cambiar la clave en `assets/js/hoja.js` y `assets/js/xlsx.js`.
- **JSZip** se distribuye bajo licencia MIT o GPLv3.
- La licencia de los contenidos didácticos (textos, retos y libros) queda a decisión de la institución; una opción común es CC BY-SA 4.0.

## Limitaciones conocidas

- El simulador reproduce lo esencial de Excel, no todo: por ejemplo, no tiene celdas combinadas ni PROMEDIO.SI.CONJUNTO (los retos que lo necesitan se resuelven en Excel real).
- Los libros de solución se generan con openpyxl, que no puede crear formas, iconos, minigráficos, segmentaciones, tablas dinámicas, comentarios en hilo ni código VBA. En esos laboratorios (4, 6, 10, 12, 13, 14, 17 y 19) la solución incluye una hoja «Solución» con los pasos.
- El progreso se guarda en el navegador (localStorage). Si se borran los datos del navegador se pierde; el reporte descargable sirve como respaldo.
- El reporte de progreso lleva una huella para detectar ediciones manuales, pero no es un mecanismo de seguridad.

## Decisiones pendientes (de la propuesta)

Público y edad del grupo, formato (9 sesiones de 1 hora o 3 de 3 horas), versión de Excel y equipos disponibles, tiempo extra para los retos integradores, licencia del motor de fórmulas (GPLv3 o comercial) y valor institucional de las constancias.
