"""Escribe assets/js/datos.js con los datos del caso Clínica Universitaria Vida Sana."""
import json
import pathlib

import salud_datos

RAIZ = pathlib.Path(__file__).resolve().parent.parent


def main():
    datos = salud_datos.generar()
    js = ("/* Datos del caso Clínica Universitaria Vida Sana (ficticios). Archivo generado por herramientas/generar_datos_js.py:\n"
          "   no lo edites a mano; cambia herramientas/salud_datos.py y vuelve a generarlo. */\n"
          "window.CASO = " + json.dumps(datos, ensure_ascii=False, separators=(",", ":")) + ";\n")
    destino = RAIZ / "assets" / "js" / "datos.js"
    destino.write_text(js, encoding="utf-8")
    print("datos.js:", len(js) // 1024, "KB")


if __name__ == "__main__":
    main()
