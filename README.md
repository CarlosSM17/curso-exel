# Excel con La Taza · versión 2

Curso de Excel de básico a avanzado en **3 sesiones de 3 horas**, con retos interactivos. Es un sitio web estático: no necesita servidor ni base de datos, y todo (el simulador, la revisión de archivos, el progreso y el área docente) corre en el navegador.

> La versión 1 (19 módulos en 9 sesiones de 1 hora) sigue intacta en la carpeta `curso-excel-la-taza`. Esta versión es una copia independiente.

## Qué cambió respecto a la versión 1

- **Temario de 13 módulos en 3 sesiones de 3 horas**, una por nivel, cada una con arranque (5 min), receso (15 min) y cierre (5 min):

  | Sesión | Nivel | Módulos |
  |---|---|---|
  | 1 | Básico | 1 Inicio (pantalla, Autorrecuperación, barra de acceso rápido) · 2 Editar · 3 Fórmulas básicas · 4 Formato · 5 Insertar objetos · 6 Hojas · 7 Gráficos |
  | 2 | Intermedio | 8 Fórmulas intermedias · 9 Organizar datos · 10 Tablas · 11 Formato intermedio |
  | 3 | Avanzado | 12 Tablas dinámicas · 13 Gestionar y automatizar información |

- **Módulo 1 nuevo:** recorrido interactivo por la ventana de Excel, simulador de Opciones › Guardar (Autorrecuperación) y de la personalización de la barra de herramientas de acceso rápido.
- **Módulo 12 nuevo** (une los antiguos 13 y 14): creación, campos de filas, columnas, valores y filtros, agrupación, suma/promedio/conteo/máximo/mínimo, segmentación, gráficos dinámicos e interpretación de resultados.
- **Módulo 13 nuevo:** diseño de bases de datos e identificación de campos, formulario de captura (comando Formulario…), validación y listas desplegables, búsqueda y consulta (BUSCARX, CONTAR.SI, SUMAR.SI, FILTRAR), macros (grabadora, botones, seguridad, introducción a VBA) y **combinar correspondencia entre Excel y Word** (simulador de Word y laboratorio que revisa el .docx).
- **Guía gráfica de funciones** (`funciones.html`): las 31 funciones del curso, cada una con una mini hoja calculada en vivo, argumentos de colores, rangos resaltados y errores frecuentes.
- **Área docente protegida** (`docente/`): plan de sesiones minuto a minuto, **guía teórica de referencia**, soluciones de los retos, libros resueltos, consolidación de reportes y notas técnicas. El contenido está cifrado y solo se abre con la contraseña.
- Pruebas de ubicación e integradores actualizados al nuevo temario; el progreso se guarda con una clave distinta a la de la v1 (`laTaza.progreso.v2`), así que ambas versiones conviven en el mismo navegador.

## Área docente

- Entrada: enlace «Acceso docente» al pie de cualquier página, o directamente `docente/index.html`.
- **Contraseña inicial: `LaTaza-Docente-2026`** (cámbiala antes de publicar, ver abajo).
- El contenido (guía teórica, plan de sesiones y libros de solución) viaja cifrado con AES-GCM de 256 bits; la llave se deriva de la contraseña con PBKDF2-SHA256 (600,000 iteraciones) y se descifra en el navegador con WebCrypto. La sesión se cierra al cerrar la pestaña.
- **Límite:** las soluciones de los retos del simulador forman parte del código público de cada módulo (el verificador las necesita). Quien lea el código fuente podría verlas; por eso la calificación pesa más los laboratorios en Excel real y los integradores.

### Carpeta privada (no se publica)

Las fuentes del área docente viven en la carpeta hermana **`curso-excel-la-taza-v2-privado`**:

```
curso-excel-la-taza-v2-privado/
  docente/guia-teorica.html     guía teórica de referencia (editable)
  docente/plan-sesiones.json    guion minuto a minuto de las 3 sesiones (editable)
  soluciones/laboratorios/      libros resueltos de los 13 laboratorios y la carta de Word resuelta
  soluciones/integradores/      integradores resueltos
```

### Cambiar la contraseña o actualizar el contenido docente

```bash
pip install cryptography openpyxl
python herramientas/generar_libros.py                        # solo si cambiaste los libros
python herramientas/proteger_docente.py --clave "nueva-contraseña-larga"
```

El script vuelve a cifrar todo en `docente/contenido.js` y `docente/archivos/`. Sube esas carpetas actualizadas. Si la carpeta privada está en otro lugar, indica su ruta con la variable de entorno `LT_PRIVADO`.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub (por ejemplo `curso-excel`). Con la cuenta gratuita, el repositorio debe ser público para usar Pages.
2. Sube **todo el contenido de esta carpeta** a la raíz del repositorio, conservando las subcarpetas. **No subas la carpeta privada.** Con git:
   ```bash
   git init
   git add .
   git commit -m "Curso Excel con La Taza v2"
   git branch -M main
   git remote add origin https://github.com/USUARIO/curso-excel.git
   git push -u origin main
   ```
3. En el repositorio: *Settings › Pages › Build and deployment › Source: Deploy from a branch*, rama `main`, carpeta `/ (root)`, *Save*.
4. En uno o dos minutos el sitio queda en `https://USUARIO.github.io/curso-excel/`.

El archivo `.nojekyll` evita que GitHub procese el sitio con Jekyll.

## Incrustar en Google Sites

1. Publica primero en GitHub Pages.
2. En Google Sites: *Insertar › Incorporar › Por URL* y pega la dirección de la página (la de inicio, la de un módulo, `.../modulos/m08.html`, o la guía `.../funciones.html`).
3. Elige *Página completa* y ajusta la altura (1,200 px o más para las páginas de módulo). Una página de Google Sites por sesión funciona bien.

Dentro de un iframe algunos navegadores limitan el almacenamiento; por eso aparece el botón **«Pestaña nueva»** en la barra superior. El área docente conviene abrirla en su propia pestaña.

## Usar desde una carpeta compartida (sin internet)

Copia la carpeta del sitio y abre `index.html` con Chrome o Edge. Todo funciona sin conexión, incluida el área docente (las bibliotecas están en `assets/vendor/` y el contenido cifrado está en archivos .js).

## Estructura

```
index.html              inicio: ruta de 3 sesiones, niveles, módulos, insignias
modulos/m01–m13.html    una página por módulo
funciones.html          guía gráfica de funciones
glosario.html           funciones español-inglés y atajos
ubicacion.html          prueba de ubicación (?nivel=basico|intermedio|avanzado, &momento=post)
integrador.html         retos integradores (?nivel=…), rúbrica y constancia
docente/index.html      área docente (contenido cifrado en docente/contenido.js y docente/archivos/)
assets/js/              plataforma: simulador, verificadores, widgets (widgets2.js: pantalla de Excel,
                        barra de acceso rápido, Autorrecuperación, diseño de bases, combinar correspondencia),
                        guia-funciones.js, docente.js, páginas
assets/js/modulos/      contenido de cada módulo (mXX.js) y utilidades del caso (comun.js)
assets/vendor/          HyperFormula 3.4.0 (+ idioma español) y JSZip 3.10.1
laboratorios/           13 libros de laboratorio y la carta de Word del módulo 13
integradores/           3 retos integradores
datos/                  libro de datos del caso
herramientas/           scripts de Python: datos, libros, páginas y cifrado del área docente
```

## Modificar el contenido

- **Textos, retos y pruebas de un módulo:** `assets/js/modulos/mXX.js` (formato explicado en Área docente › Notas técnicas).
- **Temario y agenda de las sesiones:** `assets/js/curso.js` (los minutos de cada sesión deben sumar 180).
- **Guía gráfica:** `assets/js/guia-funciones.js` (una ficha por función; el resultado se calcula con el mismo motor del simulador).
- **Datos del caso y libros:**
  ```bash
  pip install openpyxl pillow cryptography
  python herramientas/generar_datos_js.py     # assets/js/datos.js
  python herramientas/generar_libros.py       # laboratorios, integradores, datos y soluciones (a la carpeta privada)
  python herramientas/generar_paginas.py      # páginas HTML (si cambias títulos o scripts)
  python herramientas/proteger_docente.py --clave "…"   # vuelve a cifrar el área docente
  ```

## Requisitos de los participantes

- Computadora con teclado y ratón y un navegador actual (Chrome, Edge, Firefox o Safari).
- Excel de Microsoft 365 para Windows o Mac (recomendado). Excel para la web sirve en casi todos los laboratorios.
- Sesión 3 (módulo 13): Excel y Word de escritorio. Excel para la web y iPad no ejecutan macros VBA ni combinan correspondencia con un libro local. Los archivos descargados de internet llegan con las macros bloqueadas: clic derecho › Propiedades › Desbloquear.

## Licencias

- El simulador usa **HyperFormula** con su clave de licencia **GPLv3**; por eso el código del sitio se distribuye bajo **GPL-3.0** (archivo `LICENSE`).
- **JSZip** se distribuye bajo licencia MIT o GPLv3.
- La licencia de los contenidos didácticos queda a decisión de la institución (por ejemplo, CC BY-SA 4.0).

## Limitaciones conocidas

- El simulador reproduce lo esencial de Excel, no todo (no tiene celdas combinadas ni PROMEDIO.SI.CONJUNTO).
- Los libros de solución se generan con openpyxl, que no crea formas, iconos, minigráficos, segmentaciones, tablas dinámicas, temas ni código VBA. En esos laboratorios (5, 7, 10, 11, 12 y 13) la solución incluye una hoja «Solución» con los pasos.
- El progreso se guarda en el navegador (localStorage); el reporte descargable sirve como respaldo.
