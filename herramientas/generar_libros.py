"""Genera los libros de Excel (y la carta de Word) del curso «Excel para Ciencias de la Salud».

  datos/clinica-vida-sana-base.xlsx       libro de datos del caso
  laboratorios/labXX-*.xlsx               13 laboratorios (etapa 4) y lab12-carta.docx
  integradores/int-*.xlsx                 retos integradores
  <privado>/soluciones/laboratorios/      soluciones de los laboratorios   } fuera del sitio:
  <privado>/soluciones/integradores/      soluciones de los integradores   } no se publican

<privado> es la carpeta hermana «curso-excel-salud-privado» (o la variable de entorno
LT_PRIVADO). Después ejecuta herramientas/proteger_docente.py para cifrar las soluciones
dentro del área docente.

Uso:  python herramientas/generar_libros.py
La disposición de las celdas coincide con las pruebas de assets/js/modulos/mXX.js
y assets/js/paginas.js: si cambias una, cambia la otra.
"""
import datetime as dt
import os
import pathlib
import random
import re
import zipfile
from xml.sax.saxutils import escape

from openpyxl import Workbook
from openpyxl.chart import BarChart, LineChart, Reference
from openpyxl.drawing.image import Image
from openpyxl.formatting.rule import CellIsRule, DataBarRule, FormulaRule, IconSetRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.table import Table, TableFormula, TableStyleInfo

import salud_datos as SD

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PRIVADO = pathlib.Path(os.environ.get("LT_PRIVADO") or RAIZ.parent / (RAIZ.name + "-privado"))
D = SD.generar()
SERV = {s["codigo"]: s for s in D["servicios"]}
MESES = D["mesesCortos"]
DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
EST = D["estudios"]

NEGRITA = Font(bold=True)
TITULO = Font(bold=True, size=16, color="0F5E57")
RELLENO_ENC = PatternFill("solid", fgColor="DFF0EF")
RELLENO_ENTRADA = PatternFill("solid", fgColor="FFF8D6")
FINO = Side(style="thin", color="555555")
BORDE = Border(left=FINO, right=FINO, top=FINO, bottom=FINO)
ROJO = PatternFill("solid", fgColor="FFC7CE")
AMARILLO = PatternFill("solid", fgColor="FFEB9C")
MONEDA = "$#,##0.00"
MONEDA0 = "$#,##0"
LOGO = RAIZ / "assets" / "img" / "logo-vida-sana.png"


# ------------------------------------------------------------------ utilidades
def serial(iso):
    y, m, d = map(int, iso.split("-"))
    return (dt.date(y, m, d) - dt.date(1899, 12, 30)).days


def poner_fecha(celda, iso):
    celda.value = serial(iso)
    celda.number_format = "dd/mm/yyyy"


def encabezados(ws, fila, valores, col=1, relleno=True):
    for j, v in enumerate(valores):
        c = ws.cell(row=fila, column=col + j, value=v)
        c.font = NEGRITA
        if relleno:
            c.fill = RELLENO_ENC


def anchos(ws, **kw):
    for col, w in kw.items():
        ws.column_dimensions[col].width = w


def libro(titulo, contexto, pasos, criterios=None):
    wb = Workbook()
    ws = wb.active
    ws.title = "Instrucciones"
    ws["A1"] = titulo
    ws["A1"].font = TITULO
    ws["A3"] = contexto
    ws["A5"] = "Lo que debes hacer"
    ws["A5"].font = NEGRITA
    fila = 6
    for i, p in enumerate(pasos, 1):
        ws.cell(row=fila, column=1, value=f"{i}. {p}")
        fila += 1
    if criterios:
        fila += 1
        ws.cell(row=fila, column=1, value="El verificador revisará").font = NEGRITA
        fila += 1
        for c in criterios:
            ws.cell(row=fila, column=1, value="• " + c)
            fila += 1
    fila += 1
    ws.cell(row=fila, column=1, value="Importante: no cambies los nombres de las hojas ni muevas los datos de lugar. "
            "Al terminar, guarda el libro y súbelo en la página del módulo (etapa 4). Datos ficticios con fines didácticos.").font = Font(italic=True, color="0F5E57")
    ws.column_dimensions["A"].width = 120
    for r in ws.iter_rows(min_row=1, max_row=fila):
        for c in r:
            c.alignment = Alignment(wrap_text=True, vertical="top")
    return wb


def hoja_solucion(wb, lineas):
    ws = wb.create_sheet("Solución")
    ws["A1"] = "Solución paso a paso (para el docente)"
    ws["A1"].font = TITULO
    for i, l in enumerate(lineas, 3):
        ws.cell(row=i, column=1, value=l)
    ws.column_dimensions["A"].width = 120
    return ws


def bordes(ws, rango):
    for fila in ws[rango]:
        for c in fila:
            c.border = BORDE


def guardar(wb, ruta):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    wb.save(ruta)


def lab(nombre, constructor):
    guardar(constructor(False), RAIZ / "laboratorios" / f"{nombre}.xlsx")
    guardar(constructor(True), PRIVADO / "soluciones" / "laboratorios" / f"{nombre}-solucion.xlsx")


def integrador(nombre, constructor):
    guardar(constructor(False), RAIZ / "integradores" / f"{nombre}.xlsx")
    guardar(constructor(True), PRIVADO / "soluciones" / "integradores" / f"{nombre}-solucion.xlsx")


def tabla_excel(ws, nombre, ref, estilo="TableStyleMedium2", totales=None, calculadas=None):
    """Convierte ref en tabla con nombre; totales={índice: 'sum'|etiqueta}; calculadas={índice: fórmula}."""
    t = Table(displayName=nombre, ref=ref, totalsRowCount=1 if totales else None)
    t.tableStyleInfo = TableStyleInfo(name=estilo, showRowStripes=True)
    t._initialise_columns()
    fila_enc = ws[int(re.sub(r"[A-Z]", "", ref.split(":")[0]))]
    for col, cel in zip(t.tableColumns, fila_enc):
        col.name = str(cel.value)
    for i, v in (totales or {}).items():
        if v == "sum":
            t.tableColumns[i].totalsRowFunction = "sum"
        else:
            t.tableColumns[i].totalsRowLabel = v
    for i, f in (calculadas or {}).items():
        t.tableColumns[i].calculatedColumnFormula = TableFormula(attr_text=f)
    ws.add_table(t)
    return t


# ============================================================ hojas comunes
def hoja_servicios(wb):
    ws = wb.create_sheet("Servicios")
    encabezados(ws, 1, ["Código", "Servicio", "Área", "Cuota", "Costo"])
    for i, s in enumerate(D["servicios"], 2):
        for j, k in enumerate(["codigo", "nombre", "area", "cuota", "costo"], 1):
            ws.cell(row=i, column=j, value=s[k])
        ws.cell(row=i, column=4).number_format = MONEDA0
        ws.cell(row=i, column=5).number_format = MONEDA0
    anchos(ws, A=10, B=30, C=15, D=9, E=9)
    return ws


def hoja_atenciones(wb, nombre="Atenciones"):
    ws = wb.create_sheet(nombre)
    encabezados(ws, 1, ["Folio", "Fecha", "Sede", "Código", "Servicio", "Área", "Atenciones", "Cuota", "Ingresos", "Profesional", "Pago"])
    for i, v in enumerate(D["atenciones"], 2):
        ws.cell(row=i, column=1, value=v["folio"])
        poner_fecha(ws.cell(row=i, column=2), v["fecha"])
        for j, k in enumerate(["sede", "codigo", "servicio", "area", "atenciones", "cuota", "ingresos", "profesional", "pago"], 3):
            ws.cell(row=i, column=j, value=v[k])
        ws.cell(row=i, column=8).number_format = MONEDA0
        ws.cell(row=i, column=9).number_format = MONEDA0
    anchos(ws, A=9, B=11, C=9, D=10, E=30, F=15, G=11, H=8, I=10, J=18, K=22)
    ws.freeze_panes = "A2"
    return ws


def hoja_cronicos(wb, nombre="Consultas"):
    ws = wb.create_sheet(nombre)
    encabezados(ws, 1, ["Folio", "Fecha", "Sede", "Programa", "Sexo", "Edad", "Controlado", "Espera (min)"])
    for i, c in enumerate(D["cronicos"], 2):
        ws.cell(row=i, column=1, value=c["folio"])
        poner_fecha(ws.cell(row=i, column=2), c["fecha"])
        for j, k in enumerate(["sede", "programa", "sexo", "edad", "controlado", "espera"], 3):
            ws.cell(row=i, column=j, value=c[k])
    anchos(ws, A=9, B=11, C=9, D=16, E=6, F=6, G=11, H=12)
    ws.freeze_panes = "A2"
    return ws


def escribir_requisiciones(ws, reqs):
    encabezados(ws, 1, ["Folio", "Fecha", "Área", "Sede", "Insumo", "Cantidad", "Precio", "Entrega", "Estado"])
    for i, p in enumerate(reqs, 2):
        ws.cell(row=i, column=1, value=p["folio"])
        poner_fecha(ws.cell(row=i, column=2), p["fecha"])
        ws.cell(row=i, column=3, value=p["area"])
        ws.cell(row=i, column=4, value=p["sede"])
        ws.cell(row=i, column=5, value=p["insumo"])
        ws.cell(row=i, column=6, value=p["cantidad"])
        ws.cell(row=i, column=7, value=p["precio"]).number_format = MONEDA0
        poner_fecha(ws.cell(row=i, column=8), p["entrega"])
        ws.cell(row=i, column=9, value=p["estado"])
    anchos(ws, A=8, B=11, C=17, D=9, E=36, F=10, G=9, H=11, I=11)


def escribir_farmacia(ws, meds):
    encabezados(ws, 1, ["Medicamento", "Unidad", "Existencia", "Mínimo", "Máximo", "Costo unitario", "Proveedor", "Cobertura"], relleno=False)
    for i, x in enumerate(meds, 2):
        for j, k in enumerate(["medicamento", "unidad", "existencia", "minimo", "maximo", "costo", "proveedor"], 1):
            ws.cell(row=i, column=j, value=x[k])
        ws.cell(row=i, column=6).number_format = MONEDA
        ws.cell(row=i, column=8, value=f"=C{i}/D{i}").number_format = "0%"
    anchos(ws, A=36, B=10, C=11, D=9, E=9, F=14, G=30, H=11)


def escribir_padron(ws, filas, sol):
    encabezados(ws, 1, ["Expediente", "Nombre", "Apellido", "Teléfono", "Correo", "Sede", "Registro", "Consultas", "Usuario"])
    for i, c in enumerate(filas, 2):
        n, a = c["nombre"].split()
        ws.cell(row=i, column=1, value=c["id"])
        ws.cell(row=i, column=2, value=n if sol else c["nombre"])
        ws.cell(row=i, column=3, value=a if sol else None)
        ws.cell(row=i, column=4, value=c["telefono"])
        ws.cell(row=i, column=5, value=c["correo"])
        ws.cell(row=i, column=6, value=c["sede"])
        poner_fecha(ws.cell(row=i, column=7), c["registro"])
        ws.cell(row=i, column=8, value=c["consultas"])
        if sol:
            ws.cell(row=i, column=9, value=c["correo"].split("@")[0])
    anchos(ws, A=11, B=14, C=14, D=13, E=32, F=9, G=12, H=10, I=22)


# ============================================================ libro de datos
def libro_base():
    wb = Workbook()
    ws = wb.active
    ws.title = "Léeme"
    ws["A1"] = "Clínica Universitaria Vida Sana · datos del caso"
    ws["A1"].font = TITULO
    filas = [
        "Libro de datos del curso «Excel para Ciencias de la Salud». Datos ficticios con fines didácticos: no los uses para decisiones clínicas.",
        "Servicios: catálogo de 20 servicios con cuota de recuperación y costo.",
        "Atenciones: 720 registros de 2025 (atenciones de un servicio en un día y sede).",
        "Personal: 20 profesionales con sus atenciones de octubre y noviembre.",
        "Pacientes: padrón exportado del sistema de citas (sin depurar).",
        "Requisiciones: 40 requisiciones de insumos con fecha de entrega y estado.",
        "Farmacia: existencias, mínimos y máximos de 15 medicamentos.",
        "Órdenes: 40 órdenes de estudios de laboratorio e imagen.",
        "Crónicos: 378 consultas de seguimiento del programa de diabetes e hipertensión.",
    ]
    for i, t in enumerate(filas, 3):
        ws.cell(row=i, column=1, value=t)
    ws.column_dimensions["A"].width = 110
    hoja_servicios(wb)
    hoja_atenciones(wb)
    wp = wb.create_sheet("Personal")
    encabezados(wp, 1, ["Profesional", "Sede", "Puesto", "Ingreso", "Atenciones octubre", "Atenciones noviembre"])
    for i, e in enumerate(D["personal"], 2):
        wp.cell(row=i, column=1, value=e["nombre"])
        wp.cell(row=i, column=2, value=e["sede"])
        wp.cell(row=i, column=3, value=e["puesto"])
        poner_fecha(wp.cell(row=i, column=4), e["ingreso"])
        wp.cell(row=i, column=5, value=e["atencionesMes"])
        wp.cell(row=i, column=6, value=e["atencionesMesLab"])
    anchos(wp, A=20, B=9, C=22, D=12, E=18, F=20)
    escribir_padron(wb.create_sheet("Pacientes"), D["pacientesSucios"], False)
    escribir_requisiciones(wb.create_sheet("Requisiciones"), D["requisiciones"])
    escribir_farmacia(wb.create_sheet("Farmacia"), D["medicamentos"])
    wo = wb.create_sheet("Órdenes")
    encabezados(wo, 1, ["Folio", "Fecha", "Paciente", "Edad", "Estudio", "Cuota", "Sede", "Cita", "Hora"])
    for i, o in enumerate(D["ordenes"], 2):
        wo.cell(row=i, column=1, value=o["folio"])
        poner_fecha(wo.cell(row=i, column=2), o["fecha"])
        for j, k in enumerate(["paciente", "edad", "estudio", "cuota", "sede"], 3):
            wo.cell(row=i, column=j, value=o[k])
        poner_fecha(wo.cell(row=i, column=8), o["cita"])
        wo.cell(row=i, column=9, value=o["hora"])
    anchos(wo, A=8, B=11, C=20, D=6, E=26, F=9, G=9, H=11, I=8)
    hoja_cronicos(wb, "Crónicos")
    guardar(wb, RAIZ / "datos" / "clinica-vida-sana-base.xlsx")


# ================================================================ laboratorios
def lab_catalogo(sol):
    wb = libro("Laboratorio 1 · Catálogo de imagenología, rehabilitación y vacunación",
               "La segunda parte del catálogo de servicios tiene los mismos problemas que viste en el simulador.",
               ["Inserta la Terapia respiratoria (REH-002, Rehabilitación, $260) entre la Sesión de fisioterapia y la Terapia de lenguaje.",
                "Completa los códigos que faltan con autorrelleno.",
                "Corrige «Terapia de lenguage» y la cuota de la vacuna contra neumococo ($450).",
                "Reemplaza «Rehabilitacion» por «Rehabilitación» en toda la lista.",
                "Nivel Experto: sube 10 % las cuotas de Vacunación con Pegado especial › Multiplicar."],
               ["Códigos, servicios, áreas y cuotas correctos en A2:D8.", "Cuotas como números."])
    ws = wb.create_sheet("Catálogo")
    encabezados(ws, 1, ["Código", "Servicio", "Área", "Cuota"])
    if sol:
        filas = [["IMG-001", "Radiografía de tórax", "Imagenología", 350], ["IMG-002", "Ultrasonido abdominal", "Imagenología", 600],
                 ["REH-001", "Sesión de fisioterapia", "Rehabilitación", 300], ["REH-002", "Terapia respiratoria", "Rehabilitación", 260],
                 ["REH-003", "Terapia de lenguaje", "Rehabilitación", 280], ["VAC-001", "Vacuna contra influenza", "Vacunación", 180],
                 ["VAC-002", "Vacuna contra neumococo", "Vacunación", 450]]
    else:
        filas = [["IMG-001", "Radiografía de tórax", "Imagenología", 350], [None, "Ultrasonido abdominal", "Imagenología", 600],
                 ["REH-001", "Sesión de fisioterapia", "Rehabilitacion", 300], [None, "Terapia de lenguage", "Rehabilitacion", 280],
                 ["VAC-001", "Vacuna contra influenza", "Vacunación", 180], [None, "Vacuna contra neumococo", "Vacunación", 4.5]]
    for i, f in enumerate(filas, 2):
        for j, v in enumerate(f, 1):
            ws.cell(row=i, column=j, value=v)
        ws.cell(row=i, column=4).number_format = MONEDA
    anchos(ws, A=10, B=28, C=16, D=10)
    if sol:
        hoja_solucion(wb, ["Esta solución corresponde al nivel Analista.",
                           "Nivel Experto: escribe 1.1 en una celda libre, cópiala, selecciona D7:D8 y usa Pegado especial › Valores + Multiplicar.",
                           "Resultado Experto: influenza $198.00 y neumococo $495.00 (valores, sin fórmulas); después borra la celda con 1.1."])
    return wb


def lab_somatometria(sol):
    wb = libro("Laboratorio 2 · Somatometría del turno vespertino", "Mismo registro que en el simulador, con los pacientes de otro turno y otro balance hídrico.",
               ["Calcula el IMC de cada paciente en la columna F (peso / talla²).", "Completa I2:I5 con CONTAR, PROMEDIO, MAX y MIN sobre la columna F.",
                "Calcula en I13 el balance hídrico: (ingresos) − (egresos).", "Nivel Experto: en I15 calcula la superficie corporal (Mosteller) del paciente de la fila 2."])
    ws = wb.create_sheet("Turno")
    encabezados(ws, 1, ["Expediente", "Hora", "Paciente", "Peso (kg)", "Talla (m)", "IMC"])
    ws["H1"] = "Resumen del turno"
    ws["H1"].font = Font(bold=True, size=13)
    t = D["turnoLab"]
    for i, p in enumerate(t, 2):
        ws.cell(row=i, column=1, value=p["expediente"])
        ws.cell(row=i, column=2, value=p["hora"])
        ws.cell(row=i, column=3, value=p["paciente"])
        ws.cell(row=i, column=4, value=p["peso"]).number_format = "0.0"
        ws.cell(row=i, column=5, value=p["talla"]).number_format = "0.00"
        ws.cell(row=i, column=6).number_format = "0.0"
    for celda, txt in (("H2", "Pacientes medidos"), ("H3", "IMC promedio"), ("H4", "IMC máximo"), ("H5", "IMC mínimo"),
                       ("H8", "Balance hídrico de " + t[0]["expediente"] + " (mL)"), ("H9", "Ingresos: vía oral"), ("H10", "Ingresos: soluciones IV"),
                       ("H11", "Egresos: diuresis"), ("H12", "Egresos: pérdidas insensibles"), ("H13", "Balance (ingresos − egresos)"), ("H15", "Superficie corporal de " + t[0]["expediente"] + " (m²)")):
        ws[celda] = txt
        ws[celda].font = NEGRITA
    ws["I9"], ws["I10"], ws["I11"], ws["I12"] = 1100, 1000, 1400, 500
    for d in ("I3", "I4", "I5"):
        ws[d].number_format = "0.0"
    anchos(ws, A=11, B=8, C=22, D=10, E=10, F=8, G=3, H=34, I=12)
    if sol:
        n = len(t) + 1
        for i in range(2, n + 1):
            ws.cell(row=i, column=6, value=f"=D{i}/E{i}^2")
        ws["I2"], ws["I3"], ws["I4"], ws["I5"] = f"=COUNT(F2:F{n})", f"=AVERAGE(F2:F{n})", f"=MAX(F2:F{n})", f"=MIN(F2:F{n})"
        ws["I13"] = "=(I9+I10)-(I11+I12)"
        ws["I15"] = "=SQRT(D2*E2*100/3600)"
        ws["I15"].number_format = "0.00"
    return wb


def lab_reporte(sol):
    wb = libro("Laboratorio 3 · Reporte semanal de la sede Norte", "El reporte tiene los números correctos pero no tiene formato.",
               ["Destaca el título (A1): negrita y tamaño 14 o más (o estilo Título).", "Da formato de fecha a B2 y D2.", "Encabezados A4:E4 en negrita, con relleno y centrados.",
                "Cuota e Ingresos (B5:B12, D5:D13) en moneda; Participación (E5:E13) en porcentaje.", "Bordes en A4:E13 y fila de total en negrita.",
                "Nivel Experto: estilos de celda Título (A1) y Total (fila 13); columna A más ancha."])
    ws = wb.create_sheet("Reporte")
    ws["A1"] = "Reporte semanal de atenciones · Sede Norte"
    ws["A2"], ws["B2"], ws["C2"], ws["D2"] = "Del", serial("2025-10-13"), "al", serial("2025-10-19")
    for j, v in enumerate(["Servicio", "Cuota", "Atenciones", "Ingresos", "Participación"], 1):
        ws.cell(row=4, column=j, value=v)
    for i, p in enumerate(D["semanaSede"]["Norte"], 5):
        ws.cell(row=i, column=1, value=p["servicio"])
        ws.cell(row=i, column=2, value=p["cuota"])
        ws.cell(row=i, column=3, value=sum(p["cantidades"]))
        ws.cell(row=i, column=4, value=f"=B{i}*C{i}")
        ws.cell(row=i, column=5, value=f"=D{i}/$D$13")
    ws["A13"], ws["C13"], ws["D13"], ws["E13"] = "Total", "=SUM(C5:C12)", "=SUM(D5:D12)", "=SUM(E5:E12)"
    if sol:
        ws["A1"].style = "Title"
        for d in ("B2", "D2"):
            ws[d].number_format = "dd/mm/yyyy"
        bordes(ws, "A4:E13")
        for c in ws[4]:
            if c.column <= 5:
                c.font, c.fill, c.alignment = NEGRITA, RELLENO_ENC, Alignment(horizontal="center")
        for c in ws[13]:
            if c.column <= 5:
                c.style = "Total"
        for r in range(5, 14):
            ws.cell(row=r, column=2).number_format = MONEDA
            ws.cell(row=r, column=4).number_format = MONEDA
            ws.cell(row=r, column=5).number_format = "0.0%"
        anchos(ws, A=30)
    return wb


def lab_indicaciones(sol):
    wb = libro("Laboratorio 4 · Hoja de indicaciones para estudios", "Descarga también el logo (logo-vida-sana.png) desde la página del módulo.",
               ["Inserta el logo en la parte superior.", "Inserta una forma con el texto «Indicaciones para su estudio».", "Inserta un icono relacionado con la salud.",
                "En A5 inserta un vínculo con el texto «Agendar cita en línea» a https://clinicavidasana.mx/citas.",
                "Nivel Experto: texto alternativo en logo e icono; cuadro de texto con «Toma de muestras de 7:00 a 10:00»."])
    ws = wb.create_sheet("Indicaciones")
    encabezados(ws, 7, ["Estudio", "Preparación", "Cuota"])
    for i, e in enumerate(EST, 8):
        ws.cell(row=i, column=1, value=e["estudio"])
        ws.cell(row=i, column=2, value=e["preparacion"])
        ws.cell(row=i, column=3, value=e["cuota"]).number_format = MONEDA0
    anchos(ws, A=26, B=58, C=10)
    if sol:
        img = Image(str(LOGO))
        img.width = img.height = 90
        ws.add_image(img, "A1")
        ws["A5"] = "Agendar cita en línea"
        ws["A5"].hyperlink = "https://clinicavidasana.mx/citas"
        ws["A5"].style = "Hyperlink"
        hoja_solucion(wb, ["1. Insertar › Imágenes › Este dispositivo › logo-vida-sana.png.", "2. Insertar › Formas › Cinta; escribe «Indicaciones para su estudio».",
                           "3. Insertar › Iconos › busca «laboratorio» o «salud».", "4. A5 › Insertar › Vínculo › texto «Agendar cita en línea», dirección https://clinicavidasana.mx/citas.",
                           "Nota: openpyxl no crea formas ni iconos; esta solución incluye solo el logo y el vínculo."])
    return wb


def semana43(sede):
    rng = random.Random(4300 + len(sede))
    return [{"servicio": p["servicio"], "cantidades": [max(1, round(c * rng.uniform(0.85, 1.15))) for c in p["cantidades"]]} for p in D["semanaSede"][sede]]


def lab_sedes(sol):
    wb = libro("Laboratorio 5 · Organizar el libro de la semana 43", "Hoja1, Hoja2 y Hoja3 son las sedes (el nombre está en A1 de cada una). Hoja4 es el resumen.",
               ["Cambia el nombre de cada hoja de sede según su título en A1.", "Cambia Hoja4 a «Resumen» y colócala antes de las hojas de sede.",
                "Pon color a las pestañas de las sedes.", "En Resumen!B2:B4 trae el total (I11) de cada sede con referencias a las otras hojas; en B5 súmalos.",
                "Nivel Experto: en Centro inmoviliza las filas 1–2 y la columna A."])
    orden = [("Hoja1", "Sur"), ("Hoja2", "Centro"), ("Hoja3", "Norte")]
    hojas = {}
    for nombre, sede in orden:
        ws = wb.create_sheet(sede if sol else nombre)
        hojas[sede] = ws
        ws["A1"] = f"Sede {sede} · Semana 43 (atenciones)"
        ws["A1"].font = Font(bold=True, size=13)
        encabezados(ws, 2, ["Servicio"] + DIAS + ["Total"])
        for i, p in enumerate(semana43(sede), 3):
            ws.cell(row=i, column=1, value=p["servicio"])
            for j, v in enumerate(p["cantidades"], 2):
                ws.cell(row=i, column=j, value=v)
            ws.cell(row=i, column=9, value=f"=SUM(B{i}:H{i})")
        ws.cell(row=11, column=1, value="Total").font = NEGRITA
        for j in range(2, 10):
            L = get_column_letter(j)
            ws.cell(row=11, column=j, value=f"=SUM({L}3:{L}10)").font = NEGRITA
        anchos(ws, A=30)
    ws = wb.create_sheet("Resumen" if sol else "Hoja4")
    encabezados(ws, 1, ["Sede", "Atenciones de la semana"])
    for i, s in enumerate(["Centro", "Norte", "Sur", "Total"], 2):
        ws.cell(row=i, column=1, value=s)
    anchos(ws, A=14, B=24)
    if sol:
        for i, s in enumerate(["Centro", "Norte", "Sur"], 2):
            ws.cell(row=i, column=2, value=f"={s}!I11")
        ws["B5"] = "=SUM(B2:B4)"
        for s, color in (("Centro", "0F766E"), ("Norte", "2463A6"), ("Sur", "7B3F9E")):
            hojas[s].sheet_properties.tabColor = color
        hojas["Centro"].freeze_panes = "B3"
        wb.move_sheet("Resumen", offset=-3)
    return wb


def mensual(clave):
    o = {}
    for v in D["atenciones"]:
        o.setdefault(v[clave], [0] * 12)[int(v["fecha"][5:7]) - 1] += v["atenciones"]
    return o


def lab_graficos(sol):
    wb = libro("Laboratorio 6 · Gráficos para el Comité de Calidad", "Tres hojas: Servicios (atenciones anuales), Meses (atenciones mensuales por área) y Sedes.",
               ["Gráfico de columnas o barras de las atenciones por servicio (Servicios!A1:B21), con título.", "Gráfico de líneas de Vacunación y Rehabilitación por mes (Meses!A1:C13), con título.",
                "Minigráficos de línea en Sedes!N2:N4 (datos B2:M4).", "Nivel Experto: títulos de ejes en ambos gráficos."])
    ws = wb.create_sheet("Servicios")
    encabezados(ws, 1, ["Servicio", "Atenciones 2025"])
    tot = {}
    for v in D["atenciones"]:
        tot[v["servicio"]] = tot.get(v["servicio"], 0) + v["atenciones"]
    for i, s in enumerate(D["servicios"], 2):
        ws.cell(row=i, column=1, value=s["nombre"])
        ws.cell(row=i, column=2, value=tot.get(s["nombre"], 0))
    anchos(ws, A=30, B=16)
    wm = wb.create_sheet("Meses")
    areas = ["Vacunación", "Rehabilitación", "Consulta", "Laboratorio", "Imagenología", "Enfermería"]
    encabezados(wm, 1, ["Mes"] + areas)
    ma = mensual("area")
    for i, m in enumerate(MESES, 2):
        wm.cell(row=i, column=1, value=m)
        for j, a in enumerate(areas, 2):
            wm.cell(row=i, column=j, value=ma[a][i - 2])
    anchos(wm, A=8, B=12, C=15, D=11, E=12, F=14, G=12)
    wsd = wb.create_sheet("Sedes")
    encabezados(wsd, 1, ["Sede"] + MESES + ["Tendencia"])
    ms = mensual("sede")
    for i, s in enumerate(["Centro", "Norte", "Sur"], 2):
        wsd.cell(row=i, column=1, value=s)
        for j in range(12):
            wsd.cell(row=i, column=j + 2, value=ms[s][j])
    anchos(wsd, A=11, N=16)
    if sol:
        b = BarChart()
        b.type = "bar"
        b.title = "Atenciones 2025 por servicio"
        b.x_axis.title, b.y_axis.title = "Servicio", "Atenciones"
        b.add_data(Reference(ws, min_col=2, min_row=1, max_row=21), titles_from_data=True)
        b.set_categories(Reference(ws, min_col=1, min_row=2, max_row=21))
        b.height, b.width = 12, 18
        ws.add_chart(b, "D2")
        lc = LineChart()
        lc.title = "Vacunación y rehabilitación por mes"
        lc.x_axis.title, lc.y_axis.title = "Mes", "Atenciones"
        lc.add_data(Reference(wm, min_col=2, max_col=3, min_row=1, max_row=13), titles_from_data=True)
        lc.set_categories(Reference(wm, min_col=1, min_row=2, max_row=13))
        wm.add_chart(lc, "I2")
        hoja_solucion(wb, ["Minigráficos: selecciona Sedes!N2:N4 › Insertar › Minigráficos › Línea › Rango de datos B2:M4.", "(openpyxl no crea minigráficos: agrégalos en Excel.)"])
    return wb


def lab_glucosa(sol):
    wb = libro("Laboratorio 7 · Clasificación de la glucosa de la segunda jornada", "Mismo cálculo con los pacientes de otra jornada, y un resumen por sede.",
               ["D2:D21: «Alterada» si la glucosa es mayor o igual al umbral de F1; si no, «Normal».", "F4: cuántos pacientes tienen la glucosa alterada (CONTAR.SI).",
                "F8:F10: glucosa promedio de cada sede (PROMEDIO.SI).", "Nivel Experto: nombre «Umbral» para F1 usado en la columna D; G8:G10 pacientes con glucosa alterada por sede (CONTAR.SI.CONJUNTO)."])
    ws = wb.create_sheet("Glucosa")
    encabezados(ws, 1, ["Paciente", "Sede", "Glucosa (mg/dL)", "Clasificación"])
    for i, p in enumerate(D["glucosaLab"], 2):
        ws.cell(row=i, column=1, value=p["paciente"])
        ws.cell(row=i, column=2, value=p["sede"])
        ws.cell(row=i, column=3, value=p["glucosa"])
    for celda, txt in (("E1", "Umbral de glucosa alterada"), ("E4", "Pacientes con glucosa alterada"), ("E7", "Sede"), ("F7", "Glucosa promedio"), ("G7", "Pacientes alterados")):
        ws[celda] = txt
        ws[celda].font = NEGRITA
    ws["F1"] = 100
    for i, s in enumerate(["Centro", "Norte", "Sur"], 8):
        ws.cell(row=i, column=5, value=s)
        ws.cell(row=i, column=6).number_format = "0.0"
    anchos(ws, A=22, B=9, C=16, D=14, E=30, F=17, G=18)
    if sol:
        wb.defined_names["Umbral"] = DefinedName("Umbral", attr_text="Glucosa!$F$1")
        for i in range(2, 22):
            ws.cell(row=i, column=4, value=f'=IF(C{i}>=Umbral,"Alterada","Normal")')
        ws["F4"] = '=COUNTIF(C2:C21,">="&F1)'
        for i in range(8, 11):
            ws.cell(row=i, column=6, value=f"=AVERAGEIF($B$2:$B$21,E{i},$C$2:$C$21)")
            ws.cell(row=i, column=7, value=f'=COUNTIFS($B$2:$B$21,E{i},$C$2:$C$21,">="&$F$1)')
    return wb


def padron_lab():
    rng = random.Random(909)
    usados, out = set(), []
    for i in range(30):
        while True:
            n, a = rng.choice(SD.NOMBRES), rng.choice(SD.APELLIDOS)
            if (n, a) not in usados:
                usados.add((n, a))
                break
        correo = SD._sin_acentos(f"{n.lower()}.{a.lower()}@correo.mx")
        out.append({"id": f"EXP-{3301 + i}", "nombre": f"{n} {a}", "telefono": f"449{rng.randint(1000000, 9999999)}", "correo": correo,
                    "sede": rng.choice(["Norte", "Sur", "Norte", "Sur", "Centro"]), "registro": (dt.date(2024, 3, 1) + dt.timedelta(days=rng.randint(0, 500))).isoformat(),
                    "consultas": rng.randint(1, 18)})
    sucio = list(out)
    for k, idx in enumerate([2, 8, 14, 21]):
        sucio.insert(idx + 5 + k * 2, dict(out[idx]))
    return out, sucio


def lab_padron(sol):
    wb = libro("Laboratorio 8 · Depurar el padrón de Norte y Sur", "Otra exportación del padrón con expedientes repetidos y el nombre completo en una sola columna.",
               ["Quita los registros duplicados.", "Separa el nombre completo: nombre en B y apellido en C (Texto en columnas).", "Ordena por Sede (A→Z) y luego por Apellido (A→Z).",
                "Lista desplegable en Sede (F2:F60) con Centro, Norte y Sur.", "Nivel Experto: columna I «Usuario» con la parte del correo antes de @ (Relleno rápido)."])
    ws = wb.create_sheet("Pacientes")
    limpios, sucios = padron_lab()
    filas = sorted(limpios, key=lambda c: (c["sede"], SD._sin_acentos(c["nombre"].split()[1].lower()))) if sol else sucios
    escribir_padron(ws, filas, sol)
    if sol:
        dv = DataValidation(type="list", formula1='"Centro,Norte,Sur"', allow_blank=True)
        ws.add_data_validation(dv)
        dv.add("F2:F60")
    return wb


def lab_requisiciones(sol):
    wb = libro("Laboratorio 9 · Tabla de requisiciones", "La hoja Requisiciones tiene las 40 requisiciones de insumos (A1:I41).",
               ["Convierte A1:I41 en tabla y nómbrala «Requisiciones».", "Agrega la columna calculada «Importe» = [@Cantidad]*[@Precio].", "Activa la fila de totales con la suma de Importe.",
                "Inserta una segmentación por Sede.", "Nivel Experto: total también en Cantidad, segmentación por Estado y otro estilo de tabla."])
    ws = wb.create_sheet("Requisiciones")
    escribir_requisiciones(ws, D["requisiciones"])
    if sol:
        for c in ws[1]:
            c.fill = PatternFill()
        ws["J1"] = "Importe"
        for i in range(2, 42):
            ws.cell(row=i, column=10, value="=Requisiciones[[#This Row],[Cantidad]]*Requisiciones[[#This Row],[Precio]]").number_format = MONEDA0
        ws["A42"], ws["F42"], ws["J42"] = "Total", "=SUBTOTAL(109,Requisiciones[Cantidad])", "=SUBTOTAL(109,Requisiciones[Importe])"
        tabla_excel(ws, "Requisiciones", "A1:J42", "TableStyleMedium7", {0: "Total", 5: "sum", 9: "sum"}, {9: "Requisiciones[[#This Row],[Cantidad]]*Requisiciones[[#This Row],[Precio]]"})
        anchos(ws, J=12)
        hoja_solucion(wb, ["Segmentación: con una celda de la tabla › Diseño de tabla › Insertar segmentación de datos › Sede (y Estado).", "(openpyxl no crea segmentaciones: agrégalas en Excel.)"])
    return wb


def farmacia_norte():
    rng = random.Random(1111)
    meds = [dict(x) for x in D["medicamentos"]]
    for x in meds:
        x["existencia"] = max(1, round(x["existencia"] * rng.uniform(0.7, 1.3)))
    return meds


def lab_farmacia(sol):
    wb = libro("Laboratorio 10 · Semáforo de la farmacia de Norte", "Mismo inventario con las existencias de la farmacia de Norte.",
               ["C2:C16: relleno rojo cuando la existencia sea menor que el mínimo de su fila (regla «Es menor que» con =$D2).", "H2:H16: conjunto de iconos (semáforo).",
                "F2:F16: barras de datos.", "A1:H1: estilo de celda Encabezado 1.", "Nivel Experto: amarillo entre el mínimo y 1.3 veces el mínimo; cambia el tema del libro."])
    ws = wb.create_sheet("Farmacia")
    escribir_farmacia(ws, farmacia_norte())
    if sol:
        for c in ws[1]:
            c.style = "Headline 1"
        ws.conditional_formatting.add("C2:C16", CellIsRule(operator="lessThan", formula=["$D2"], fill=ROJO, font=Font(color="9C0006")))
        ws.conditional_formatting.add("C2:C16", CellIsRule(operator="between", formula=["$D2", "$D2*1.3"], fill=AMARILLO, font=Font(color="9C5700")))
        ws.conditional_formatting.add("H2:H16", IconSetRule("3TrafficLights1", "percent", [0, 33, 67]))
        ws.conditional_formatting.add("F2:F16", DataBarRule(start_type="min", end_type="max", color="2A8A80"))
        hoja_solucion(wb, ["Tema: Disposición de página › Temas (openpyxl no cambia el tema del libro: hazlo en Excel)."])
    return wb


def lideres():
    t = {}
    for v in D["atenciones"]:
        q = (int(v["fecha"][5:7]) - 1) // 3 + 1
        t.setdefault(q, {}).setdefault(v["sede"], 0)
        t[q][v["sede"]] += v["atenciones"]
    return t, [max(t[q], key=t[q].get) for q in (1, 2, 3, 4)]


def lab_dinamicas(sol):
    wb = libro("Laboratorio 11 · Tablas dinámicas y tablero", "La hoja Atenciones tiene los 720 registros de 2025. La hoja Respuestas es para tus conclusiones.",
               ["Inserta una tabla dinámica: Fecha agrupada por trimestres en filas, Sede en columnas y suma de Atenciones en valores.",
                "En Respuestas escribe la sede con más atenciones en cada trimestre (B2:B5), el mes con más atenciones de Norte (B7) y la sede con más atenciones en el año (B8).",
                "Tablero: otra tabla dinámica por meses, un gráfico dinámico y una segmentación por Sede conectada.",
                "Nivel Experto: valores como % del total en alguna tabla dinámica y una escala de tiempo por Fecha."],
               ["Tabla dinámica por trimestre y sede.", "Respuestas B2:B5, B7 y B8.", "Gráfico dinámico y segmentación conectada."])
    hoja_atenciones(wb)
    ws = wb.create_sheet("Respuestas")
    encabezados(ws, 1, ["Trimestre", "Sede con más atenciones"])
    t, lid = lideres()
    for i in range(4):
        ws.cell(row=i + 2, column=1, value=f"T{i + 1}")
    ws["A7"], ws["A8"] = "Mes con más atenciones de Norte", "Sede con más atenciones en el año"
    ws["A7"].font = ws["A8"].font = NEGRITA
    for d in ("B2", "B3", "B4", "B5", "B7", "B8"):
        ws[d].fill = RELLENO_ENTRADA
    anchos(ws, A=36, B=26)
    if sol:
        for i in range(4):
            ws.cell(row=i + 2, column=2, value=lid[i])
        m = [0] * 12
        anual = {}
        for v in D["atenciones"]:
            anual[v["sede"]] = anual.get(v["sede"], 0) + v["atenciones"]
            if v["sede"] == "Norte":
                m[int(v["fecha"][5:7]) - 1] += v["atenciones"]
        ws["B7"] = D["meses"][m.index(max(m))]
        ws["B8"] = max(anual, key=anual.get)
        s = hoja_solucion(wb, ["1. Clic en Atenciones › Insertar › Tabla dinámica › Nueva hoja.", "2. Fecha a Filas; clic derecho en una fecha › Agrupar › solo Trimestres.",
                               "3. Sede a Columnas; Atenciones a Valores (Suma).", "4. Tablero: Fecha (Meses) en filas, Atenciones en valores; Gráfico dinámico › Líneas; Insertar segmentación › Sede.",
                               "5. Experto: Mostrar valores como › % del total general; Insertar escala de tiempo › Fecha.",
                               "Interpretación: " + ws["B8"].value + " gana el año aunque no encabeza todos los trimestres; revisa el Total general.",
                               "openpyxl no crea tablas dinámicas: estos son los resultados esperados.", "Atenciones por trimestre:"])
        encabezados(s, 12, ["Trimestre", "Centro", "Norte", "Sur"])
        for q in range(1, 5):
            s.cell(row=12 + q, column=1, value=f"T{q}")
            for j, sede in enumerate(["Centro", "Norte", "Sur"], 2):
                s.cell(row=12 + q, column=j, value=t[q][sede])
        s.cell(row=17, column=1, value="Año").font = NEGRITA
        for j, sede in enumerate(["Centro", "Norte", "Sur"], 2):
            s.cell(row=17, column=j, value=anual[sede])
    return wb


# ---------------------------------------------------- gestión de órdenes (módulo 12)
def hoja_catalogo(wb):
    ws = wb.create_sheet("Catálogo")
    encabezados(ws, 1, ["Estudio", "Cuota", "Preparación"])
    for i, e in enumerate(EST, 2):
        ws.cell(row=i, column=1, value=e["estudio"])
        ws.cell(row=i, column=2, value=e["cuota"]).number_format = MONEDA0
        ws.cell(row=i, column=3, value=e["preparacion"])
    anchos(ws, A=26, B=9, C=58)
    return ws


def hoja_pacientes(wb):
    ws = wb.create_sheet("Pacientes")
    encabezados(ws, 1, ["Paciente", "Teléfono", "Correo"])
    for i, p in enumerate(D["pacientesOrden"], 2):
        for j, k in enumerate(["paciente", "telefono", "correo"], 1):
            ws.cell(row=i, column=j, value=p[k])
    anchos(ws, A=22, B=13, C=26)
    return ws


def validaciones_ordenes(ws, hasta):
    dv = DataValidation(type="list", formula1="Pacientes!$A$2:$A$11", allow_blank=True, showErrorMessage=True, errorTitle="Paciente", error="Elige un paciente de la lista.")
    dv.add(f"C2:C{hasta}")
    de = DataValidation(type="list", formula1="'Catálogo'!$A$2:$A$11", allow_blank=True, showErrorMessage=True, errorTitle="Estudio", error="Elige un estudio del catálogo.")
    de.add(f"E2:E{hasta}")
    dd = DataValidation(type="whole", operator="between", formula1="0", formula2="110", allow_blank=True, showErrorMessage=True,
                        showInputMessage=True, promptTitle="Edad", prompt="Entero de 0 a 110", errorTitle="Edad", error="Escribe una edad entera de 0 a 110.")
    dd.add(f"D2:D{hasta}")
    for v in (dv, de, dd):
        ws.add_data_validation(v)


def hoja_ordenes(wb, sol, filas=None, con_cita=True):
    ws = wb.create_sheet("Órdenes")
    enc = ["Folio", "Fecha", "Paciente", "Edad", "Estudio", "Cuota", "Preparación"] + (["Cita", "Hora"] if con_cita else [])
    encabezados(ws, 1, enc)
    ords = filas or D["ordenes"]
    for i, o in enumerate(ords, 2):
        ws.cell(row=i, column=1, value=o["folio"])
        poner_fecha(ws.cell(row=i, column=2), o["fecha"])
        ws.cell(row=i, column=3, value=o["paciente"])
        ws.cell(row=i, column=4, value=o["edad"])
        ws.cell(row=i, column=5, value=o["estudio"])
        ws.cell(row=i, column=6).number_format = MONEDA
        if con_cita:
            poner_fecha(ws.cell(row=i, column=8), o["cita"])
            ws.cell(row=i, column=9, value=o["hora"])
        if sol:
            ws.cell(row=i, column=6, value=f"=_xlfn.XLOOKUP(E{i},Catálogo!$A$2:$A$11,Catálogo!$B$2:$B$11)")
            ws.cell(row=i, column=7, value=f"=_xlfn.XLOOKUP(E{i},Catálogo!$A$2:$A$11,Catálogo!$C$2:$C$11)")
    ws.freeze_panes = "A2"
    anchos(ws, A=8, B=11, C=20, D=6, E=26, F=10, G=52, H=11, I=8)
    if sol:
        validaciones_ordenes(ws, 60)
    return ws


def hoja_consulta(wb, sol, estudio):
    ws = wb.create_sheet("Consulta")
    ws["B1"] = "Consulta por estudio"
    ws["B1"].font = TITULO
    ws["B2"], ws["C2"] = "Estudio:", estudio
    ws["C2"].fill = RELLENO_ENTRADA
    ws["C2"].font = NEGRITA
    ws["B4"], ws["B5"] = "Número de órdenes", "Ingresos por cuotas"
    ws["B4"].font = ws["B5"].font = NEGRITA
    ws["C5"].number_format = MONEDA
    anchos(ws, A=3, B=22, C=28)
    if sol:
        ws["C4"] = "=COUNTIF(Órdenes!E2:E60,C2)"
        ws["C5"] = "=SUMIF(Órdenes!E2:E60,C2,Órdenes!F2:F60)"
    return ws


def lab_ordenes(sol):
    wb = libro("Laboratorio 12 · Registro de órdenes y cartas de indicaciones",
               "Parte 1 en Excel: base de órdenes con captura validada, búsqueda y consulta. Parte 2 en Word: cartas con combinar correspondencia (lab12-carta.docx).",
               ["Órdenes: lista desplegable de pacientes en C2:C60 (origen =Pacientes!$A$2:$A$11) y de estudios en E2:E60 (origen =Catálogo!$A$2:$A$11); en D2:D60 solo enteros de 0 a 110.",
                "Órdenes: Cuota (F) y Preparación (G) con BUSCARX desde el Catálogo, para todas las órdenes.",
                "Consulta: C4 = número de órdenes del estudio de C2 (CONTAR.SI) y C5 = ingresos por cuotas (SUMAR.SI).",
                "Guarda y cierra el libro. En Word abre lab12-carta.docx: Correspondencia › Iniciar combinación › Cartas › Seleccionar destinatarios › Usar una lista existente (este libro, hoja Órdenes).",
                "Inserta los campos combinados donde dice [Paciente], [Estudio], [Folio], [Cita], [Hora], [Preparación] y [Cuota]. Revisa la vista previa y guarda la carta.",
                "Sube el libro y la carta juntos.",
                "Nivel Experto: macro que limpie Consulta!C2 asignada a un botón (guarda como .xlsm) y formato de moneda en el campo Cuota con \\# \"$#,##0.00\"."],
               ["Validaciones de captura.", "Cuota y preparación con fórmulas.", "Consulta que cambia con el estudio de C2.", "Carta con los campos combinados."])
    hoja_ordenes(wb, sol)
    hoja_catalogo(wb)
    hoja_pacientes(wb)
    hoja_consulta(wb, sol, "Perfil de lípidos")
    if sol:
        hoja_solucion(wb, ["Validación: Datos › Validación de datos › Permitir Lista › Origen =Pacientes!$A$2:$A$11 (y =Catálogo!$A$2:$A$11); Número entero entre 0 y 110.",
                           "F2: =BUSCARX(E2,Catálogo!$A$2:$A$11,Catálogo!$B$2:$B$11) · G2: igual con Catálogo!$C$2:$C$11 (copiar hasta la última fila).",
                           "Consulta: C4 =CONTAR.SI(Órdenes!E2:E60,C2) · C5 =SUMAR.SI(Órdenes!E2:E60,C2,Órdenes!F2:F60).",
                           "Experto (macro): Programador › Grabar macro «LimpiarConsulta» › seleccionar Consulta!C2 › Supr › Detener; botón con la macro; guardar como .xlsm.",
                           "Sub LimpiarConsulta()", '    Range("C2").Select', "    Selection.ClearContents", "End Sub",
                           "La carta resuelta (lab12-carta-solucion.docx) muestra los campos combinados y los modificadores de moneda y fecha."])
    return wb


def lab_tablero(sol):
    wb = libro("Laboratorio 13 · Dashboard del programa de enfermedades crónicas",
               "La hoja Consultas tiene las 378 consultas de seguimiento de 2025. Arma el dashboard en la hoja Tablero.",
               ["Convierte Consultas en tabla (Ctrl+T).", "Tablero: C4 = número de consultas; C5 = % de pacientes en control («Sí» entre consultas); C6 = espera promedio. Con fórmulas.",
                "Crea al menos dos tablas dinámicas (por ejemplo, consultas por mes y % de control por sede) y un gráfico dinámico de cada una; muévelos a Tablero.",
                "Inserta una segmentación por Programa y conéctala a las tablas dinámicas (Conexiones de informe).",
                "Respuestas: B2 = % de control en Hipertensión; B3 = sede con menor % de control en Diabetes tipo 2.",
                "Nivel Experto: escala de tiempo por Fecha; formato condicional en C5 contra la meta del 70 %; oculta las líneas de cuadrícula de Tablero."],
               ["Tarjetas C4:C6 con fórmulas.", "Dos tablas y dos gráficos dinámicos.", "Segmentación de Programa conectada a dos o más tablas.", "Respuestas B2 y B3."])
    hoja_cronicos(wb)
    n = len(D["cronicos"]) + 1
    wt = wb.create_sheet("Tablero")
    wt["B1"] = "Programa de enfermedades crónicas · 2025"
    wt["B1"].font = TITULO
    for celda, txt in (("B4", "Consultas"), ("B5", "% de pacientes en control"), ("B6", "Espera promedio (min)"), ("B7", "Meta de control"), ("C7", 0.7)):
        wt[celda] = txt
        if celda.startswith("B"):
            wt[celda].font = NEGRITA
    wt["C7"].number_format = "0%"
    wt["C5"].number_format = "0.0%"
    wt["C6"].number_format = "0.0"
    anchos(wt, A=3, B=28, C=14)
    wr = wb.create_sheet("Respuestas")
    wr["A1"], wr["B1"] = "Pregunta", "Respuesta"
    wr["A1"].font = wr["B1"].font = NEGRITA
    wr["A2"], wr["A3"] = "% de pacientes en control en Hipertensión", "Sede con menor % de control en Diabetes tipo 2"
    wr["B2"].fill = wr["B3"].fill = RELLENO_ENTRADA
    anchos(wr, A=48, B=18)
    if sol:
        wt["C4"] = f"=COUNTA(Consultas!A2:A{n})"
        wt["C5"] = f'=COUNTIF(Consultas!G2:G{n},"Sí")/C4'
        wt["C6"] = f"=AVERAGE(Consultas!H2:H{n})"
        wt.conditional_formatting.add("C5", CellIsRule(operator="lessThan", formula=["$C$7"], fill=ROJO, font=Font(color="9C0006")))
        wt.sheet_view.showGridLines = False
        hta = [c for c in D["cronicos"] if c["programa"] == "Hipertensión"]
        wr["B2"] = round(sum(c["controlado"] == "Sí" for c in hta) / len(hta), 4)
        wr["B2"].number_format = "0.0%"
        pct = {}
        for s in ("Centro", "Norte", "Sur"):
            dm = [c for c in D["cronicos"] if c["programa"] == "Diabetes tipo 2" and c["sede"] == s]
            pct[s] = sum(c["controlado"] == "Sí" for c in dm) / len(dm)
        wr["B3"] = min(pct, key=pct.get)
        hoja_solucion(wb, ["Tablas dinámicas (hoja Cálculos): 1) Fecha (Meses) en filas, Cuenta de Folio en valores; 2) Sede en filas, Promedio de un campo 1/0 o Cuenta de Controlado con filtro.",
                           "Tip para % de control por sede: Controlado en Columnas y Cuenta de Folio con Mostrar valores como › % del total de filas.",
                           "Gráficos dinámicos: líneas para la evolución mensual; columnas para el % por sede. Muévelos a Tablero.",
                           "Segmentación Programa: clic derecho › Conexiones de informe › marca las dos tablas dinámicas. Experto: escala de tiempo por Fecha.",
                           "openpyxl no crea tablas dinámicas, segmentaciones ni escalas de tiempo: esta solución incluye las tarjetas, el semáforo y las respuestas."])
    return wb


# ---------------------------------------------------- documento de Word mínimo
def _p(texto="", negrita=False, tam=None, color=None):
    """Párrafo; en el texto, {Campo} o {Campo|modificador} se convierte en campo combinado."""
    rpr = ""
    if negrita or tam or color:
        rpr = "<w:rPr>" + ("<w:b/>" if negrita else "") + (f'<w:color w:val="{color}"/>' if color else "") + (f'<w:sz w:val="{tam * 2}"/>' if tam else "") + "</w:rPr>"
    runs = []
    for parte in re.split(r"(\{[^}]+\})", texto):
        if not parte:
            continue
        m = re.fullmatch(r"\{([^}|]+)(?:\|([^}]*))?\}", parte)
        if m:
            campo, mod = m.group(1), m.group(2)
            instr = f" MERGEFIELD {campo} " + (mod + " " if mod else "")
            runs.append(f'<w:fldSimple w:instr="{escape(instr, {chr(34): "&quot;"})}"><w:r>{rpr}<w:t>«{escape(campo)}»</w:t></w:r></w:fldSimple>')
        else:
            runs.append(f'<w:r>{rpr}<w:t xml:space="preserve">{escape(parte)}</w:t></w:r>')
    return f"<w:p>{''.join(runs)}</w:p>"


def docx(ruta, parrafos, titulo):
    ns = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'
    documento = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document {ns}><w:body>{"".join(parrafos)}'
                 '<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1418" w:right="1418" w:bottom="1418" w:left="1418" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>'
                 "</w:body></w:document>")
    estilos = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles {ns}><w:docDefaults><w:rPrDefault><w:rPr>'
               '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:lang w:val="es-MX"/></w:rPr></w:rPrDefault>'
               '<w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>'
               '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>')
    ajustes = f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings {ns}><w:defaultTabStop w:val="708"/><w:compat/></w:settings>'
    tipos = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
             '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'
             '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
             '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
             '<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>'
             '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>')
    rels = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
            '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>')
    rels_doc = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
                '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/></Relationships>')
    core = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" '
            'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
            f'<dc:title>{escape(titulo)}</dc:title><dc:creator>Clínica Universitaria Vida Sana</dc:creator></cp:coreProperties>')
    ruta.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(ruta, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", tipos)
        z.writestr("_rels/.rels", rels)
        z.writestr("docProps/core.xml", core)
        z.writestr("word/document.xml", documento)
        z.writestr("word/_rels/document.xml.rels", rels_doc)
        z.writestr("word/styles.xml", estilos)
        z.writestr("word/settings.xml", ajustes)


def carta(sol):
    if sol:
        c = lambda campo, mod=None: "{" + campo + ("|" + mod if mod else "") + "}"
    else:
        c = lambda campo, mod=None: "[" + campo + "]"
    return [
        _p("Clínica Universitaria Vida Sana", negrita=True, tam=20, color="0F5E57"),
        _p("Coordinación de Laboratorio e Imagen · citas@clinicavidasana.example", color="4A5C5A"),
        _p(""),
        _p("Indicaciones para su estudio", negrita=True, tam=14),
        _p("Orden número: " + c("Folio")),
        _p("Paciente: " + c("Paciente")),
        _p(""),
        _p("Estimado(a) paciente:"),
        _p("Su estudio de " + c("Estudio") + " está programado para el " + c("Cita", '\\@ "dd/MM/yyyy"') + " a las " + c("Hora") + "."),
        _p("Preparación: " + c("Preparación")),
        _p("Cuota de recuperación: " + c("Cuota", '\\# "$#,##0.00"') + ". Presente esta carta y una identificación oficial."),
        _p("Si no puede asistir, avísenos con un día de anticipación para reprogramar su cita."),
        _p(""),
        _p("Atentamente,"),
        _p("Coordinación de Laboratorio e Imagen", negrita=True),
    ]


# ================================================================ integradores
def int_basico(sol):
    wb = libro("Reto integrador · Fundamentos · Reporte semanal de atenciones", "Reporte semanal de la sede Sur: cálculos, clasificación, formato, gráfico, logo y resumen.",
               ["J4:J11 atenciones de la semana (suma de Lun a Dom); K4:K11 ingresos (cuota × atenciones); J12 y K12 totales; N4 promedio de ingresos por servicio; N5 ingreso mayor.",
                "L4:L11: «Alta demanda» si las atenciones de la semana son mayores o iguales al umbral de N1; si no, «Normal».",
                "Formato: título destacado, encabezados A3:L3 en negrita con relleno, cuota e ingresos en moneda, bordes en A3:K12.",
                "Gráfico de columnas o barras de las atenciones por servicio, con título.",
                "Inserta el logo de la clínica (logo-vida-sana.png) en la hoja Semana.",
                "Agrega una hoja llamada «Resumen» con los ingresos de la semana en B2 (fórmula que tome Semana!K12).",
                "Escribe el título del documento «Reporte semanal Sur» (Archivo › Información › Propiedades)."])
    ws = wb.create_sheet("Semana")
    ws["A1"] = "Reporte semanal de atenciones · Sede Sur · Semana 42"
    cab = ["Servicio", "Cuota"] + DIAS + ["Atenciones", "Ingresos", "Demanda"]
    for j, v in enumerate(cab, 1):
        ws.cell(row=3, column=j, value=v)
    for i, p in enumerate(D["semanaSede"]["Sur"], 4):
        ws.cell(row=i, column=1, value=p["servicio"])
        ws.cell(row=i, column=2, value=p["cuota"])
        for j, v in enumerate(p["cantidades"], 3):
            ws.cell(row=i, column=j, value=v)
    ws["A12"] = "Total"
    ws["M1"], ws["N1"] = "Umbral de alta demanda", 100
    ws["M4"], ws["M5"] = "Promedio de ingresos por servicio", "Ingreso mayor"
    anchos(ws, A=30, L=14, M=32)
    if sol:
        ws["A1"].font = TITULO
        for i in range(4, 12):
            ws.cell(row=i, column=10, value=f"=SUM(C{i}:I{i})")
            ws.cell(row=i, column=11, value=f"=B{i}*J{i}")
            ws.cell(row=i, column=12, value=f'=IF(J{i}>=$N$1,"Alta demanda","Normal")')
        ws["J12"], ws["K12"] = "=SUM(J4:J11)", "=SUM(K4:K11)"
        ws["N4"], ws["N5"] = "=AVERAGE(K4:K11)", "=MAX(K4:K11)"
        for c in ws[3]:
            if c.column <= 12:
                c.font, c.fill = NEGRITA, RELLENO_ENC
        for r in range(4, 13):
            ws.cell(row=r, column=2).number_format = MONEDA
            ws.cell(row=r, column=11).number_format = MONEDA
        ws["N4"].number_format = ws["N5"].number_format = MONEDA
        bordes(ws, "A3:K12")
        ch = BarChart()
        ch.title = "Atenciones de la semana por servicio"
        ch.add_data(Reference(ws, min_col=10, min_row=3, max_row=11), titles_from_data=True)
        ch.set_categories(Reference(ws, min_col=1, min_row=4, max_row=11))
        ws.add_chart(ch, "A15")
        img = Image(str(LOGO))
        img.width, img.height = 60, 60
        ws.add_image(img, "P1")
        wr = wb.create_sheet("Resumen")
        wr["A2"], wr["B2"] = "Ingresos de la semana", "=Semana!K12"
        wr["B2"].number_format = MONEDA
        anchos(wr, A=24, B=14)
        wb.properties.title = "Reporte semanal Sur"
    return wb


def int_intermedio(sol):
    wb = libro("Reto integrador · Análisis de datos · Base de requisiciones confiable", "Depura la base de requisiciones, conviértela en tabla con totales y resume por área.",
               ["Requisiciones: quita los duplicados.", "Convierte los datos en la tabla «Requisiciones» con la columna calculada Importe y la fila de totales.",
                "Formato condicional para las requisiciones con Estado «Pendiente».", "Lista desplegable en la columna Estado (I2:I41) con Surtida y Pendiente.",
                "Hoja nueva con una tabla dinámica: suma de Importe por Área."])
    ws = wb.create_sheet("Requisiciones")
    reqs = list(D["requisiciones"])
    if not sol:
        for k, idx in enumerate([4, 11, 19, 26, 33]):
            reqs.insert(idx + k, dict(D["requisiciones"][idx]))
    escribir_requisiciones(ws, reqs)
    if sol:
        for c in ws[1]:
            c.fill = PatternFill()
        ws["J1"] = "Importe"
        for i in range(2, 42):
            ws.cell(row=i, column=10, value="=Requisiciones[[#This Row],[Cantidad]]*Requisiciones[[#This Row],[Precio]]").number_format = MONEDA0
        ws["A42"], ws["J42"] = "Total", "=SUBTOTAL(109,Requisiciones[Importe])"
        tabla_excel(ws, "Requisiciones", "A1:J42", "TableStyleMedium2", {0: "Total", 9: "sum"}, {9: "Requisiciones[[#This Row],[Cantidad]]*Requisiciones[[#This Row],[Precio]]"})
        ws.conditional_formatting.add("I2:I41", CellIsRule(operator="equal", formula=['"Pendiente"'], fill=AMARILLO))
        dv = DataValidation(type="list", formula1='"Surtida,Pendiente"', allow_blank=True)
        dv.add("I2:I41")
        ws.add_data_validation(dv)
        hoja_solucion(wb, ["Tabla dinámica: Insertar › Tabla dinámica › Nueva hoja; Área en Filas, Importe en Valores (Suma). openpyxl no la crea: hazla en Excel."])
    return wb


def int_avanzado(sol):
    wb = libro("Reto integrador · Gestión y tableros · Tablero y gestión automatizada",
               "Dashboard del programa de crónicos y un registro de órdenes con captura validada, búsqueda, consulta y una macro. Entrega en .xlsm.",
               ["Tablero: C4 consultas, C5 % de pacientes en control y C6 espera promedio con fórmulas; dos tablas dinámicas y dos gráficos dinámicos; segmentación por Programa conectada a dos o más tablas.",
                "Órdenes: listas desplegables de pacientes (C2:C60) y estudios (E2:E60) y edad entera de 0 a 110 (D2:D60).",
                "Órdenes: Cuota (F) con BUSCARX desde el Catálogo.",
                "Consulta: C4 número de órdenes y C5 ingresos del estudio de C2.",
                "Una macro que limpie Consulta!C2, asignada a un botón. Guarda como .xlsm."])
    hoja_cronicos(wb)
    n = len(D["cronicos"]) + 1
    wt = wb.create_sheet("Tablero")
    wt["B1"] = "Programa de enfermedades crónicas · 2025"
    wt["B1"].font = TITULO
    for celda, txt in (("B4", "Consultas"), ("B5", "% de pacientes en control"), ("B6", "Espera promedio (min)")):
        wt[celda] = txt
        wt[celda].font = NEGRITA
    wt["C5"].number_format = "0.0%"
    anchos(wt, A=3, B=28, C=14)
    hoja_ordenes(wb, sol, D["ordenes"][:30], con_cita=False)
    hoja_catalogo(wb)
    hoja_pacientes(wb)
    hoja_consulta(wb, sol, "Perfil de lípidos")
    if sol:
        wt["C4"] = f"=COUNTA(Consultas!A2:A{n})"
        wt["C5"] = f'=COUNTIF(Consultas!G2:G{n},"Sí")/C4'
        wt["C6"] = f"=AVERAGE(Consultas!H2:H{n})"
        hoja_solucion(wb, ["Tablero: tablas dinámicas (consultas por mes; % de control por sede), gráficos dinámicos y segmentación por Programa con Conexiones de informe.",
                           "Macro: Programador › Grabar macro «LimpiarConsulta» (seleccionar Consulta!C2, Supr); botón con la macro; guardar como .xlsm.",
                           "openpyxl no crea tablas dinámicas ni guarda VBA: esta solución incluye las tarjetas, las validaciones, las fórmulas y la consulta."])
    return wb


def main():
    libro_base()
    for nombre, f in [("lab01-catalogo-servicios", lab_catalogo), ("lab02-somatometria", lab_somatometria), ("lab03-reporte-semanal", lab_reporte),
                      ("lab04-indicaciones", lab_indicaciones), ("lab05-sedes", lab_sedes), ("lab06-graficos", lab_graficos), ("lab07-glucosa", lab_glucosa),
                      ("lab08-padron", lab_padron), ("lab09-requisiciones", lab_requisiciones), ("lab10-farmacia", lab_farmacia),
                      ("lab11-tablas-dinamicas", lab_dinamicas), ("lab12-ordenes", lab_ordenes), ("lab13-tablero", lab_tablero)]:
        lab(nombre, f)
    docx(RAIZ / "laboratorios" / "lab12-carta.docx", carta(False), "Indicaciones para su estudio")
    docx(PRIVADO / "soluciones" / "laboratorios" / "lab12-carta-solucion.docx", carta(True), "Indicaciones para su estudio (solución)")
    integrador("int-basico", int_basico)
    integrador("int-intermedio", int_intermedio)
    integrador("int-avanzado", int_avanzado)
    print("libros generados · soluciones en", PRIVADO / "soluciones")


if __name__ == "__main__":
    main()
