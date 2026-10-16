"""Genera las páginas HTML del sitio (todas comparten la misma lista de scripts).

Uso:  python herramientas/generar_paginas.py
"""
import pathlib

RAIZ = pathlib.Path(__file__).resolve().parent.parent

MODULOS = [
    "Editar un libro de trabajo", "Fórmulas básicas", "Formato a hojas de trabajo", "Insertar objetos",
    "Ver y administrar hojas de cálculo", "Gráficos", "Imprimir y distribuir", "Fórmulas intermedias",
    "Organizar datos", "Tablas", "Formato intermedio", "Colaborar con Excel", "Tablas dinámicas",
    "Gráficos dinámicos", "Errores de fórmula", "Formato avanzado", "Fórmulas avanzadas", "Analizar datos", "Macros",
]

SCRIPTS = [
    "vendor/hyperformula.full.min.js", "vendor/hyperformula-esES.js", "vendor/jszip.min.js",
    "js/nucleo.js", "js/formato.js", "js/funciones.js", "js/iconos.js", "js/curso.js", "js/datos.js",
    "js/hoja.js", "js/hoja-herramientas.js", "js/verificador.js", "js/xlsx.js", "js/galeria.js",
    "js/cinta.js", "js/graficos.js", "js/dinamica.js", "js/widgets.js", "js/pagina.js", "js/modulo.js",
    "js/modulos/comun.js",
]

PLANTILLA = """<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titulo}</title>
<meta name="description" content="{descripcion}">
<link rel="icon" href="{raiz}/assets/img/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="{raiz}/assets/css/estilos.css">
</head>
<body data-raiz="{raiz}"{extra_body}>
<div id="app"><noscript><p style="padding:20px">Esta plataforma necesita JavaScript activado.</p></noscript></div>
{scripts}
<script>{arranque}</script>
</body>
</html>
"""


def scripts(raiz, extra=()):
    lista = list(SCRIPTS) + list(extra)
    return "\n".join(f'<script src="{raiz}/assets/{s}"></script>' for s in lista)


def escribir(ruta, **kw):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    ruta.write_text(PLANTILLA.format(**kw), encoding="utf-8")


def main():
    for i, titulo in enumerate(MODULOS, 1):
        slug = f"m{i:02d}"
        escribir(RAIZ / "modulos" / f"{slug}.html", raiz="..", extra_body=f' data-modulo="{i}"',
                 titulo=f"Módulo {i} · {titulo} · Excel con La Taza",
                 descripcion=f"Módulo {i} del curso Excel con La Taza: {titulo}. Retos interactivos y laboratorio en Excel real.",
                 scripts=scripts("..", [f"js/modulos/{slug}.js"]), arranque=f"LT.paginaModulo({i});")
    paginas = {
        "index.html": ("Excel con La Taza · Curso de Excel de básico a avanzado", "Curso de Excel de básico a avanzado en 9 horas con retos interactivos y el caso de la Cafetería La Taza.", "LT.paginas.inicio();"),
        "ubicacion.html": ("Prueba de ubicación · Excel con La Taza", "Prueba de ubicación por nivel del curso Excel con La Taza.", "LT.paginas.ubicacion();"),
        "integrador.html": ("Reto integrador · Excel con La Taza", "Retos integradores por nivel del curso Excel con La Taza.", "LT.paginas.integrador();"),
        "docente.html": ("Guía docente · Excel con La Taza", "Guía docente, soluciones y consolidación de reportes del curso Excel con La Taza.", "LT.paginas.docente();"),
        "glosario.html": ("Glosario de funciones · Excel con La Taza", "Glosario de funciones de Excel en español e inglés y atajos de teclado.", "LT.paginas.glosario();"),
    }
    extra = ["js/paginas.js"] + [f"js/modulos/m{i:02d}.js" for i in range(1, 20)]
    for archivo, (titulo, desc, arranque) in paginas.items():
        escribir(RAIZ / archivo, raiz=".", extra_body="", titulo=titulo, descripcion=desc,
                 scripts=scripts(".", extra), arranque=arranque)
    print("páginas generadas:", len(MODULOS) + len(paginas))


if __name__ == "__main__":
    main()
