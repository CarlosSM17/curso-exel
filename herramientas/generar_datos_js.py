"""Escribe assets/js/datos.js con los datos del caso Cafetería La Taza."""
import json
import pathlib

import lataza_datos

RAIZ = pathlib.Path(__file__).resolve().parent.parent


def main():
    datos = lataza_datos.generar()
    js = ("/* Datos del caso Cafetería La Taza. Archivo generado por herramientas/generar_datos_js.py:\n"
          "   no lo edites a mano; cambia herramientas/lataza_datos.py y vuelve a generarlo. */\n"
          "window.LA_TAZA = " + json.dumps(datos, ensure_ascii=False, separators=(",", ":")) + ";\n")
    destino = RAIZ / "assets" / "js" / "datos.js"
    destino.write_text(js, encoding="utf-8")
    print("datos.js:", len(js) // 1024, "KB")


if __name__ == "__main__":
    main()
