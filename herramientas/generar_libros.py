"""Genera los libros de Excel del curso a partir de los datos del caso.

  datos/la-taza-base.xlsx                 libro de datos del caso
  laboratorios/labXX-*.xlsx               19 laboratorios (etapa 4)
  laboratorios/soluciones/*-solucion.xlsx soluciones
  integradores/int-*.xlsx                 retos integradores y sus soluciones

Uso:  python herramientas/generar_libros.py
La disposición de las celdas coincide con las pruebas de assets/js/modulos/mXX.js
y assets/js/paginas.js: si cambias una, cambia la otra.
"""
import datetime as dt
import pathlib
import random

from openpyxl import Workbook
from openpyxl.chart import BarChart, LineChart, Reference
from openpyxl.comments import Comment
from openpyxl.drawing.image import Image
from openpyxl.formatting.rule import CellIsRule, DataBarRule, FormulaRule, IconSetRule
from openpyxl.styles import Alignment, Border, Font, PatternFill, Protection, Side
from openpyxl.utils import get_column_letter
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.worksheet.formula import DataTableFormula
from openpyxl.worksheet.scenario import InputCells, Scenario, ScenarioList
from openpyxl.worksheet.table import Table, TableColumn, TableFormula, TableStyleInfo

import lataza_datos as LD

RAIZ = pathlib.Path(__file__).resolve().parent.parent
D = LD.generar()
PROD = {p["codigo"]: p for p in D["productos"]}
CATS = D["categorias"]
MESES = D["mesesCortos"]
DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]

NEGRITA = Font(bold=True)
TITULO = Font(bold=True, size=16, color="5B3A29")
RELLENO_ENC = PatternFill("solid", fgColor="F3EBDF")
RELLENO_ENTRADA = PatternFill("solid", fgColor="FFF8D6")
FINO = Side(style="thin", color="555555")
BORDE = Border(left=FINO, right=FINO, top=FINO, bottom=FINO)
ROJO = PatternFill("solid", fgColor="FFC7CE")
AMARILLO = PatternFill("solid", fgColor="FFEB9C")
MONEDA = "$#,##0.00"
MONEDA0 = "$#,##0"


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
            "Al terminar, guarda el libro y súbelo en la página del módulo (etapa 4).").font = Font(italic=True, color="7A4D0E")
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
    guardar(constructor(True), RAIZ / "laboratorios" / "soluciones" / f"{nombre}-solucion.xlsx")


def integrador(nombre, constructor):
    guardar(constructor(False), RAIZ / "integradores" / f"{nombre}.xlsx")
    guardar(constructor(True), RAIZ / "integradores" / "soluciones" / f"{nombre}-solucion.xlsx")


def hoja_ventas(wb, nombre="Ventas"):
    ws = wb.create_sheet(nombre)
    encabezados(ws, 1, ["Folio", "Fecha", "Sucursal", "Código", "Producto", "Categoría", "Cantidad", "Precio", "Total", "Vendedor", "Pago"])
    for i, v in enumerate(D["ventas"], 2):
        ws.cell(row=i, column=1, value=v["folio"])
        poner_fecha(ws.cell(row=i, column=2), v["fecha"])
        for j, k in enumerate(["sucursal", "codigo", "producto", "categoria", "cantidad", "precio", "total", "vendedor", "pago"], 3):
            ws.cell(row=i, column=j, value=v[k])
        ws.cell(row=i, column=8).number_format = MONEDA0
        ws.cell(row=i, column=9).number_format = MONEDA0
    anchos(ws, A=9, B=11, C=10, D=10, E=22, F=15, G=10, H=9, I=10, J=18, K=14)
    ws.freeze_panes = "A2"
    return ws


def hoja_productos(wb):
    ws = wb.create_sheet("Productos")
    encabezados(ws, 1, ["Código", "Producto", "Categoría", "Precio", "Costo"])
    for i, p in enumerate(D["productos"], 2):
        for j, k in enumerate(["codigo", "nombre", "categoria", "precio", "costo"], 1):
            ws.cell(row=i, column=j, value=p[k])
        ws.cell(row=i, column=4).number_format = MONEDA0
        ws.cell(row=i, column=5).number_format = MONEDA0
    anchos(ws, A=10, B=22, C=15, D=9, E=9)
    return ws


# ============================================================ libro de datos
def libro_base():
    wb = Workbook()
    ws = wb.active
    ws.title = "Léeme"
    ws["A1"] = "Cafetería La Taza · datos del caso"
    ws["A1"].font = TITULO
    filas = [
        "Libro de datos del curso «Excel con La Taza». Todos los módulos usan estas mismas tablas.",
        "Productos: catálogo de 20 productos con precio y costo.",
        "Ventas: 720 registros de 2025 (día, sucursal y producto).",
        "Empleados: 20 vendedores con sus ventas de octubre y noviembre.",
        "Clientes: base del programa de lealtad (sin limpiar).",
        "Pedidos: 40 pedidos de catering con fecha de compromiso y estado.",
        "Inventario y Presupuesto: insumos y gastos del semestre.",
    ]
    for i, t in enumerate(filas, 3):
        ws.cell(row=i, column=1, value=t)
    ws.column_dimensions["A"].width = 100
    hoja_productos(wb)
    hoja_ventas(wb)
    ws = wb.create_sheet("Empleados")
    encabezados(ws, 1, ["Nombre", "Sucursal", "Puesto", "Ingreso", "Ventas octubre", "Ventas noviembre"])
    for i, e in enumerate(D["empleados"], 2):
        ws.cell(row=i, column=1, value=e["nombre"])
        ws.cell(row=i, column=2, value=e["sucursal"])
        ws.cell(row=i, column=3, value=e["puesto"])
        poner_fecha(ws.cell(row=i, column=4), e["ingreso"])
        ws.cell(row=i, column=5, value=e["ventasMes"]).number_format = MONEDA0
        ws.cell(row=i, column=6, value=e["ventasMesLab"]).number_format = MONEDA0
    anchos(ws, A=20, B=10, C=12, D=12, E=15, F=17)
    ws = wb.create_sheet("Clientes")
    encabezados(ws, 1, ["ID", "Nombre completo", "Teléfono", "Correo", "Sucursal", "Registro", "Puntos"])
    for i, c in enumerate(D["clientesSucios"], 2):
        for j, k in enumerate(["id", "nombre", "telefono", "correo", "sucursal"], 1):
            ws.cell(row=i, column=j, value=int(c[k]) if k == "telefono" else c[k])
        poner_fecha(ws.cell(row=i, column=6), c["registro"])
        ws.cell(row=i, column=7, value=c["puntos"])
    anchos(ws, A=9, B=22, C=13, D=30, E=10, F=12, G=8)
    escribir_pedidos(wb.create_sheet("Pedidos"), D["pedidos"])
    ws = wb.create_sheet("Inventario")
    escribir_inventario(ws, D["inventario"])
    ws = wb.create_sheet("Presupuesto")
    escribir_presupuesto(ws)
    guardar(wb, RAIZ / "datos" / "la-taza-base.xlsx")


def escribir_pedidos(ws, pedidos, importe=False):
    cols = ["Folio", "Fecha", "Cliente", "Sucursal", "Producto", "Cantidad", "Precio", "Compromiso", "Estado"]
    encabezados(ws, 1, cols)
    for i, p in enumerate(pedidos, 2):
        ws.cell(row=i, column=1, value=p["folio"])
        poner_fecha(ws.cell(row=i, column=2), p["fecha"])
        ws.cell(row=i, column=3, value=p["cliente"])
        ws.cell(row=i, column=4, value=p["sucursal"])
        ws.cell(row=i, column=5, value=p["producto"])
        ws.cell(row=i, column=6, value=p["cantidad"])
        ws.cell(row=i, column=7, value=p["precio"]).number_format = MONEDA0
        poner_fecha(ws.cell(row=i, column=8), p["compromiso"])
        ws.cell(row=i, column=9, value=p["estado"])
    anchos(ws, A=8, B=11, C=24, D=10, E=22, F=10, G=9, H=12, I=11)


def escribir_inventario(ws, inv):
    encabezados(ws, 1, ["Insumo", "Unidad", "Existencia", "Mínimo", "Máximo", "Costo unitario", "Proveedor", "Cobertura"], relleno=False)
    for i, x in enumerate(inv, 2):
        for j, k in enumerate(["insumo", "unidad", "existencia", "minimo", "maximo", "costo", "proveedor"], 1):
            ws.cell(row=i, column=j, value=x[k])
        ws.cell(row=i, column=6).number_format = MONEDA
        ws.cell(row=i, column=8, value=f"=C{i}/D{i}").number_format = "0%"
    anchos(ws, A=24, B=9, C=11, D=9, E=9, F=14, G=18, H=11)


def escribir_presupuesto(ws):
    ws["A1"] = "Presupuesto de gastos · 1.er semestre 2026"
    ws["A1"].font = TITULO
    encabezados(ws, 3, ["Concepto", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Total"])
    for i, p in enumerate(D["presupuesto"], 4):
        ws.cell(row=i, column=1, value=p["concepto"])
        for j, v in enumerate(p["meses"], 2):
            ws.cell(row=i, column=j, value=v).number_format = MONEDA0
        ws.cell(row=i, column=8, value=f"=SUM(B{i}:G{i})").number_format = MONEDA0
    ws.cell(row=12, column=1, value="Total").font = NEGRITA
    for j in range(2, 9):
        L = get_column_letter(j)
        c = ws.cell(row=12, column=j, value=f"=SUM({L}4:{L}11)")
        c.number_format = MONEDA0
        c.font = NEGRITA
    anchos(ws, A=22)


# ================================================================ laboratorios
def lab01(sol):
    wb = libro("Laboratorio 1 · Lista de precios de té, postres y alimentos",
               "La segunda parte de la lista de precios tiene los mismos problemas que viste en el simulador.",
               ["Inserta el Brownie (POS-002, Postres, $40) entre el Pay de queso y la Galleta de avena.",
                "Completa los códigos que faltan con autorrelleno.",
                "Corrige «Galleta de avna» y el precio del Panini caprese ($85).",
                "Reemplaza la categoría «Postre» por «Postres» en toda la lista.",
                "Nivel Experto: sube 10 % los precios de Alimentos con Pegado especial › Multiplicar."],
               ["Códigos, productos, categorías y precios correctos en A2:D8.", "Precios como números."])
    ws = wb.create_sheet("Precios")
    encabezados(ws, 1, ["Código", "Producto", "Categoría", "Precio"])
    if sol:
        filas = [["TE-001", "Chai latte", "Té", 54], ["TE-002", "Té verde", "Té", 38], ["POS-001", "Pay de queso", "Postres", 55],
                 ["POS-002", "Brownie", "Postres", 40], ["POS-003", "Galleta de avena", "Postres", 25], ["ALI-001", "Sándwich de pavo", "Alimentos", 78],
                 ["ALI-002", "Panini caprese", "Alimentos", 85]]
    else:
        filas = [["TE-001", "Chai latte", "Té", 54], [None, "Té verde", "Té", 38], ["POS-001", "Pay de queso", "Postre", 55],
                 [None, "Galleta de avna", "Postre", 25], ["ALI-001", "Sándwich de pavo", "Alimentos", 78], [None, "Panini caprese", "Alimentos", 8.5]]
    for i, f in enumerate(filas, 2):
        for j, v in enumerate(f, 1):
            ws.cell(row=i, column=j, value=v)
        ws.cell(row=i, column=4).number_format = MONEDA
    anchos(ws, A=10, B=22, C=14, D=10)
    return wb


def tickets_norte():
    rng = random.Random(202)
    cods = ["CAF-002", "CAF-004", "PAN-002", "CAF-003", "FRI-002", "PAN-001", "CAF-006", "ALI-002", "FRI-001", "POS-002", "CAF-001", "TE-001", "FRI-003", "CAF-004"]
    horas = ["07:05", "07:31", "07:52", "08:16", "08:58", "09:20", "09:44", "10:30", "11:15", "12:48", "13:36", "15:10", "17:05", "18:40"]
    return [{"ticket": 2101 + i, "hora": h, "producto": PROD[c]["nombre"], "cantidad": rng.randint(1, 4), "precio": PROD[c]["precio"]} for i, (c, h) in enumerate(zip(cods, horas))]


def lab02(sol):
    wb = libro("Laboratorio 2 · Corte de caja de la sucursal Norte", "Mismo corte que en el simulador, con los tickets de otro día.",
               ["Calcula el importe de cada ticket en la columna F (cantidad × precio).", "Completa I2:I6 con SUMA, PROMEDIO, MAX, MIN y CONTAR sobre la columna F.",
                "Calcula en I10 la diferencia de caja: dinero contado − (fondo inicial + total vendido).", "Nivel Experto: en I11 calcula el IVA incluido en las ventas (precios con 16 % de IVA)."])
    ws = wb.create_sheet("Corte")
    encabezados(ws, 1, ["Ticket", "Hora", "Producto", "Cantidad", "Precio", "Importe"])
    ws["H1"] = "Resumen del día"
    ws["H1"].font = Font(bold=True, size=13)
    t = tickets_norte()
    total = 0
    for i, x in enumerate(t, 2):
        ws.cell(row=i, column=1, value=x["ticket"])
        hh, mm = map(int, x["hora"].split(":"))
        c = ws.cell(row=i, column=2, value=dt.time(hh, mm))
        c.number_format = "hh:mm"
        ws.cell(row=i, column=3, value=x["producto"])
        ws.cell(row=i, column=4, value=x["cantidad"])
        ws.cell(row=i, column=5, value=x["precio"]).number_format = MONEDA
        ws.cell(row=i, column=6).number_format = MONEDA
        total += x["cantidad"] * x["precio"]
    etiquetas = {2: "Total vendido", 3: "Ticket promedio", 4: "Venta mayor", 5: "Venta menor", 6: "Número de tickets", 8: "Fondo inicial", 9: "Dinero contado al cierre", 10: "Diferencia de caja", 11: "IVA incluido en las ventas"}
    for r, txt in etiquetas.items():
        ws.cell(row=r, column=8, value=txt).font = NEGRITA
        if r != 6:
            ws.cell(row=r, column=9).number_format = MONEDA
    ws["I8"] = 1500
    ws["I9"] = 1500 + total - 35
    if sol:
        for i in range(2, 16):
            ws.cell(row=i, column=6, value=f"=D{i}*E{i}")
        ws["I2"], ws["I3"], ws["I4"], ws["I5"], ws["I6"] = "=SUM(F2:F15)", "=AVERAGE(F2:F15)", "=MAX(F2:F15)", "=MIN(F2:F15)", "=COUNT(F2:F15)"
        ws["I10"], ws["I11"] = "=I9-(I8+I2)", "=I2-I2/1.16"
    anchos(ws, A=8, B=8, C=22, D=10, E=10, F=12, G=3, H=26, I=13)
    return wb


def lab03(sol):
    wb = libro("Laboratorio 3 · Reporte semanal de la sucursal Norte", "El reporte tiene los números correctos pero no tiene formato.",
               ["Destaca el título (A1): negrita y tamaño 14 o más (o estilo Título).", "Da formato de fecha a B2 y D2.", "Encabezados A4:E4 en negrita, con relleno y centrados.",
                "Precio y Ventas (B5:B12, D5:D13) en moneda; Participación (E5:E13) en porcentaje.", "Bordes en A4:E13 y fila de total en negrita.",
                "Nivel Experto: estilos de celda Título (A1) y Total (fila 13); columna A más ancha."])
    ws = wb.create_sheet("Reporte")
    ws["A1"] = "Reporte semanal de ventas · Sucursal Norte"
    ws["A2"], ws["B2"], ws["C2"], ws["D2"] = "Del", serial("2025-10-13"), "al", serial("2025-10-19")
    for j, v in enumerate(["Producto", "Precio", "Unidades", "Ventas", "Participación"], 1):
        ws.cell(row=4, column=j, value=v)
    filas = D["semanaSucursal"]["Norte"]
    for i, p in enumerate(filas, 5):
        ws.cell(row=i, column=1, value=p["producto"])
        ws.cell(row=i, column=2, value=p["precio"])
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
        anchos(ws, A=22)
    return wb


def lab04(sol):
    wb = libro("Laboratorio 4 · Encabezado del menú", "Descarga también el logo (logo-la-taza.png) desde la página del módulo.",
               ["Inserta el logo en la parte superior.", "Inserta una forma con el texto «Menú de temporada».", "Inserta un icono de café.",
                "En A5 inserta un vínculo con el texto «Ver menú en línea» a https://lataza.mx/menu.", "Nivel Experto: texto alternativo en logo e icono; cuadro de texto con «Abierto de 7:00 a 21:00»."])
    ws = wb.create_sheet("Menú")
    encabezados(ws, 7, ["Bebida", "Categoría", "Precio"])
    beb = [p for p in D["productos"] if p["codigo"][:3] in ("CAF", "FRI") or p["codigo"].startswith("TE")]
    for i, p in enumerate(beb, 8):
        ws.cell(row=i, column=1, value=p["nombre"])
        ws.cell(row=i, column=2, value=p["categoria"])
        ws.cell(row=i, column=3, value=p["precio"]).number_format = MONEDA0
    anchos(ws, A=24, B=16, C=10)
    if sol:
        img = Image(str(RAIZ / "assets" / "img" / "logo-la-taza.png"))
        img.width = img.height = 90
        ws.add_image(img, "A1")
        ws["A5"] = "Ver menú en línea"
        ws["A5"].hyperlink = "https://lataza.mx/menu"
        ws["A5"].style = "Hyperlink"
        hoja_solucion(wb, ["1. Insertar › Imágenes › Este dispositivo › logo-la-taza.png.", "2. Insertar › Formas › Cinta; escribe «Menú de temporada».",
                           "3. Insertar › Iconos › busca «café».", "4. A5 › Insertar › Vínculo › texto «Ver menú en línea», dirección https://lataza.mx/menu.",
                           "Nota: openpyxl no crea formas ni iconos; esta solución incluye solo el logo y el vínculo."])
    return wb


def semana43(suc):
    rng = random.Random(4300 + len(suc))
    return [{"producto": p["producto"], "cantidades": [max(3, round(c * rng.uniform(0.85, 1.15))) for c in p["cantidades"]]} for p in D["semanaSucursal"][suc]]


def lab05(sol):
    wb = libro("Laboratorio 5 · Organizar el libro de la semana 43", "Hoja1, Hoja2 y Hoja3 son las sucursales (el nombre está en A1 de cada una). Hoja4 es el resumen.",
               ["Cambia el nombre de cada hoja de sucursal según su título en A1.", "Cambia Hoja4 a «Resumen» y colócala antes de las hojas de sucursal.",
                "Pon color a las pestañas de las sucursales.", "En Resumen!B2:B4 trae el total (I11) de cada sucursal con referencias a las otras hojas; en B5 súmalos.",
                "Nivel Experto: en Centro inmoviliza las filas 1–2 y la columna A."])
    orden = [("Hoja1", "Sur"), ("Hoja2", "Centro"), ("Hoja3", "Norte")]
    hojas = {}
    for nombre, suc in orden:
        ws = wb.create_sheet(suc if sol else nombre)
        hojas[suc] = ws
        ws["A1"] = f"Sucursal {suc} · Semana 43 (unidades vendidas)"
        ws["A1"].font = Font(bold=True, size=13)
        encabezados(ws, 2, ["Producto"] + DIAS + ["Total"])
        for i, p in enumerate(semana43(suc), 3):
            ws.cell(row=i, column=1, value=p["producto"])
            for j, v in enumerate(p["cantidades"], 2):
                ws.cell(row=i, column=j, value=v)
            ws.cell(row=i, column=9, value=f"=SUM(B{i}:H{i})")
        ws.cell(row=11, column=1, value="Total").font = NEGRITA
        for j in range(2, 10):
            L = get_column_letter(j)
            ws.cell(row=11, column=j, value=f"=SUM({L}3:{L}10)").font = NEGRITA
        anchos(ws, A=22)
    ws = wb.create_sheet("Resumen" if sol else "Hoja4")
    encabezados(ws, 1, ["Sucursal", "Total semana"])
    for i, s in enumerate(["Centro", "Norte", "Sur", "Total"], 2):
        ws.cell(row=i, column=1, value=s)
    anchos(ws, A=14, B=14)
    if sol:
        for i, s in enumerate(["Centro", "Norte", "Sur"], 2):
            ws.cell(row=i, column=2, value=f"={s}!I11")
        ws["B5"] = "=SUM(B2:B4)"
        for s, color in (("Centro", "1E7145"), ("Norte", "2463A6"), ("Sur", "C0392B")):
            hojas[s].sheet_properties.tabColor = color
        hojas["Centro"].freeze_panes = "B3"
        wb.move_sheet("Resumen", offset=-3)
    return wb


def totales_producto():
    t = {}
    for v in D["ventas"]:
        t[v["producto"]] = t.get(v["producto"], 0) + v["total"]
    return t


def mensual(clave, valor_clave=None):
    o = {}
    for v in D["ventas"]:
        k = v[clave]
        o.setdefault(k, [0] * 12)[int(v["fecha"][5:7]) - 1] += v["total"]
    return o


def lab06(sol):
    wb = libro("Laboratorio 6 · Gráficos para la junta", "Tres hojas: Productos (ventas anuales), Meses (ventas mensuales por categoría) y Sucursales.",
               ["Gráfico de columnas o barras de las ventas por producto (Productos!A1:B21), con título.", "Gráfico de líneas de Café caliente y Café frío por mes (Meses!A1:C13), con título.",
                "Minigráficos de línea en Sucursales!N2:N4 (datos B2:M4).", "Nivel Experto: títulos de ejes en ambos gráficos."])
    ws = wb.create_sheet("Productos")
    encabezados(ws, 1, ["Producto", "Ventas 2025"])
    tp = totales_producto()
    for i, p in enumerate(D["productos"], 2):
        ws.cell(row=i, column=1, value=p["nombre"])
        ws.cell(row=i, column=2, value=tp.get(p["nombre"], 0)).number_format = MONEDA0
    anchos(ws, A=24, B=14)
    wm = wb.create_sheet("Meses")
    encabezados(wm, 1, ["Mes"] + CATS)
    mc = mensual("categoria")
    for i, m in enumerate(MESES, 2):
        wm.cell(row=i, column=1, value=m)
        for j, c in enumerate(CATS, 2):
            wm.cell(row=i, column=j, value=mc[c][i - 2]).number_format = MONEDA0
    anchos(wm, A=8, B=14, C=12, D=10, E=12, F=10, G=12)
    wsu = wb.create_sheet("Sucursales")
    encabezados(wsu, 1, ["Sucursal"] + MESES + ["Tendencia"])
    ms = mensual("sucursal")
    for i, s in enumerate(["Centro", "Norte", "Sur"], 2):
        wsu.cell(row=i, column=1, value=s)
        for j in range(12):
            wsu.cell(row=i, column=j + 2, value=ms[s][j]).number_format = MONEDA0
    anchos(wsu, A=11, N=16)
    if sol:
        b = BarChart()
        b.type = "bar"
        b.title = "Ventas 2025 por producto"
        b.x_axis.title, b.y_axis.title = "Producto", "Ventas ($)"
        b.add_data(Reference(ws, min_col=2, min_row=1, max_row=21), titles_from_data=True)
        b.set_categories(Reference(ws, min_col=1, min_row=2, max_row=21))
        b.height, b.width = 12, 18
        ws.add_chart(b, "D2")
        lc = LineChart()
        lc.title = "Café caliente vs. café frío"
        lc.x_axis.title, lc.y_axis.title = "Mes", "Ventas ($)"
        lc.add_data(Reference(wm, min_col=2, max_col=3, min_row=1, max_row=13), titles_from_data=True)
        lc.set_categories(Reference(wm, min_col=1, min_row=2, max_row=13))
        wm.add_chart(lc, "I2")
        hoja_solucion(wb, ["Minigráficos: selecciona Sucursales!N2:N4 › Insertar › Minigráficos › Línea › Rango de datos B2:M4.", "(openpyxl no crea minigráficos: agrégalos en Excel.)"])
    return wb


def lab07(sol):
    wb = libro("Laboratorio 7 · Reporte anual listo para enviar", "Configura la impresión y exporta a PDF. Sube el libro y el PDF juntos.",
               ["Hoja «Reporte anual»: área de impresión A1:N23 (sin las notas internas), orientación horizontal, ajustada a 1 página, número de página en el pie.",
                "Exporta la hoja a PDF (Archivo › Exportar › Crear PDF/XPS).", "Nivel Experto: hoja «Detalle» con columnas a lo ancho de una página, fila 1 repetida y pie «Página X de Y»."])
    ws = wb.create_sheet("Reporte anual")
    ws["A1"] = "Ventas 2025 por producto"
    ws["A1"].font = Font(bold=True, size=14)
    encabezados(ws, 2, ["Producto"] + MESES + ["Total"])
    mp = mensual("producto")
    for i, p in enumerate(D["productos"], 3):
        ws.cell(row=i, column=1, value=p["nombre"])
        for j in range(12):
            ws.cell(row=i, column=j + 2, value=mp.get(p["nombre"], [0] * 12)[j]).number_format = MONEDA0
        ws.cell(row=i, column=14, value=f"=SUM(B{i}:M{i})").number_format = MONEDA0
    ws.cell(row=23, column=1, value="Total").font = NEGRITA
    for j in range(2, 15):
        L = get_column_letter(j)
        ws.cell(row=23, column=j, value=f"=SUM({L}3:{L}22)").number_format = MONEDA0
    ws["A26"] = "Notas internas (no imprimir):"
    ws["A26"].font = NEGRITA
    ws["A27"] = "Revisar con proveedores el costo del Panini caprese."
    ws["A28"] = "Las ventas de diciembre incluyen el evento de fin de año en Centro."
    anchos(ws, A=24, N=12)
    wd = wb.create_sheet("Detalle")
    encabezados(wd, 1, ["Producto · Sucursal"] + MESES + ["Total"])
    det = {}
    for v in D["ventas"]:
        det.setdefault(v["producto"] + " · " + v["sucursal"], [0] * 12)[int(v["fecha"][5:7]) - 1] += v["total"]
    r = 2
    for p in D["productos"]:
        for s in ("Centro", "Norte", "Sur"):
            wd.cell(row=r, column=1, value=p["nombre"] + " · " + s)
            vals = det.get(p["nombre"] + " · " + s, [0] * 12)
            for j in range(12):
                wd.cell(row=r, column=j + 2, value=vals[j]).number_format = MONEDA0
            wd.cell(row=r, column=14, value=f"=SUM(B{r}:M{r})").number_format = MONEDA0
            r += 1
    anchos(wd, A=30)
    if sol:
        ws.print_area = "A1:N23"
        ws.page_setup.orientation = "landscape"
        ws.sheet_properties.pageSetUpPr.fitToPage = True
        ws.page_setup.fitToWidth, ws.page_setup.fitToHeight = 1, 1
        ws.oddFooter.center.text = "Página &P"
        wd.page_setup.orientation = "landscape"
        wd.sheet_properties.pageSetUpPr.fitToPage = True
        wd.page_setup.fitToWidth, wd.page_setup.fitToHeight = 1, 0
        wd.print_title_rows = "1:1"
        wd.oddFooter.center.text = "Página &P de &N"
    return wb


def lab08(sol):
    wb = libro("Laboratorio 8 · Comisiones de noviembre", "Mismo cálculo de comisiones con las ventas de noviembre, y un resumen por sucursal.",
               ["D2:D21: comisión = ventas × tasa (F2) si las ventas alcanzan la meta (F1); si no, 0.", "F4: cuántos vendedores alcanzaron la meta (CONTAR.SI).",
                "F8:F10: comisiones de cada sucursal (SUMAR.SI).", "Nivel Experto: nombre «Meta» para F1 usado en la columna D; G8:G10 promedio de ventas por sucursal (PROMEDIO.SI)."])
    ws = wb.create_sheet("Ventas")
    encabezados(ws, 1, ["Vendedor", "Sucursal", "Ventas del mes", "Comisión"])
    for i, e in enumerate(D["empleados"], 2):
        ws.cell(row=i, column=1, value=e["nombre"])
        ws.cell(row=i, column=2, value=e["sucursal"])
        ws.cell(row=i, column=3, value=e["ventasMesLab"]).number_format = MONEDA0
        ws.cell(row=i, column=4).number_format = MONEDA
    for celda, txt in (("E1", "Meta mensual"), ("E2", "Tasa de comisión"), ("E4", "Alcanzaron la meta"), ("E7", "Sucursal"), ("F7", "Comisiones"), ("G7", "Promedio de ventas")):
        ws[celda] = txt
        ws[celda].font = NEGRITA
    ws["F1"], ws["F2"] = 10000, 0.05
    ws["F1"].number_format, ws["F2"].number_format = MONEDA0, "0%"
    for i, s in enumerate(["Centro", "Norte", "Sur"], 8):
        ws.cell(row=i, column=5, value=s)
        ws.cell(row=i, column=6).number_format = MONEDA
        ws.cell(row=i, column=7).number_format = MONEDA0
    anchos(ws, A=20, B=10, C=15, D=12, E=20, F=13, G=18)
    if sol:
        wb.defined_names["Meta"] = DefinedName("Meta", attr_text="Ventas!$F$1")
        for i in range(2, 22):
            ws.cell(row=i, column=4, value=f"=IF(C{i}>=Meta,C{i}*$F$2,0)")
        ws["F4"] = '=COUNTIF(C2:C21,">="&F1)'
        for i in range(8, 11):
            ws.cell(row=i, column=6, value=f"=SUMIF($B$2:$B$21,E{i},$D$2:$D$21)")
            ws.cell(row=i, column=7, value=f"=AVERAGEIF($B$2:$B$21,E{i},$C$2:$C$21)")
    return wb


def clientes_lab():
    rng = random.Random(909)
    usados, out = set(), []
    for i in range(30):
        while True:
            n, a = rng.choice(LD.NOMBRES), rng.choice(LD.APELLIDOS)
            if (n, a) not in usados:
                usados.add((n, a))
                break
        correo = f"{n.lower()}.{a.lower()}@correo.mx"
        for x, y in (("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u"), ("ñ", "n")):
            correo = correo.replace(x, y)
        out.append({"id": f"CL-{301 + i}", "nombre": f"{n} {a}", "telefono": 5500000000 + rng.randint(10000000, 89999999), "correo": correo,
                    "sucursal": rng.choice(["Centro", "Norte", "Sur"]), "registro": (dt.date(2024, 3, 1) + dt.timedelta(days=rng.randint(0, 500))).isoformat(), "puntos": rng.randint(0, 50) * 10})
    sucio = list(out)
    for k, idx in enumerate([2, 8, 14, 21]):
        sucio.insert(idx + 5 + k * 2, dict(out[idx]))
    return out, sucio


def lab09(sol):
    wb = libro("Laboratorio 9 · Limpiar la base de clientes", "Otra exportación de clientes con registros repetidos y el nombre completo en una sola columna.",
               ["Quita los registros duplicados.", "Separa el nombre completo: nombre en B y apellido en C (Texto en columnas).", "Ordena por Sucursal (A→Z) y luego por Apellido (A→Z).",
                "Lista desplegable en Sucursal (F2:F60) con Centro, Norte y Sur.", "Nivel Experto: columna I «Usuario» con la parte del correo antes de @ (Relleno rápido)."])
    ws = wb.create_sheet("Clientes")
    encabezados(ws, 1, ["ID", "Nombre", "Apellido", "Teléfono", "Correo", "Sucursal", "Registro", "Puntos", "Usuario"])
    limpios, sucios = clientes_lab()
    filas = sucios
    if sol:
        filas = sorted(limpios, key=lambda c: (c["sucursal"], c["nombre"].split()[1].lower()))
    for i, c in enumerate(filas, 2):
        n, a = c["nombre"].split()
        ws.cell(row=i, column=1, value=c["id"])
        ws.cell(row=i, column=2, value=n if sol else c["nombre"])
        ws.cell(row=i, column=3, value=a if sol else None)
        ws.cell(row=i, column=4, value=c["telefono"])
        ws.cell(row=i, column=5, value=c["correo"])
        ws.cell(row=i, column=6, value=c["sucursal"])
        poner_fecha(ws.cell(row=i, column=7), c["registro"])
        ws.cell(row=i, column=8, value=c["puntos"])
        if sol:
            ws.cell(row=i, column=9, value=c["correo"].split("@")[0])
    anchos(ws, A=9, B=20, C=14, D=13, E=30, F=10, G=12, H=8, I=20)
    if sol:
        dv = DataValidation(type="list", formula1='"Centro,Norte,Sur"', allow_blank=True)
        ws.add_data_validation(dv)
        dv.add("F2:F60")
    return wb


def lab10(sol):
    wb = libro("Laboratorio 10 · Tabla de pedidos", "La hoja Pedidos tiene los 40 pedidos de catering (A1:I41).",
               ["Convierte A1:I41 en tabla y nómbrala «Pedidos».", "Agrega la columna calculada «Importe» = [@Cantidad]*[@Precio].", "Activa la fila de totales con la suma de Importe.",
                "Inserta una segmentación por Sucursal.", "Nivel Experto: total también en Cantidad, segmentación por Estado y otro estilo de tabla."])
    ws = wb.create_sheet("Pedidos")
    escribir_pedidos(ws, D["pedidos"])
    if sol:
        for c in ws[1]:
            c.fill = PatternFill()
        ws["J1"] = "Importe"
        for i in range(2, 42):
            ws.cell(row=i, column=10, value="=Pedidos[[#This Row],[Cantidad]]*Pedidos[[#This Row],[Precio]]").number_format = MONEDA0
        ws["A42"] = "Total"
        ws["F42"] = "=SUBTOTAL(109,Pedidos[Cantidad])"
        ws["J42"] = "=SUBTOTAL(109,Pedidos[Importe])"
        t = Table(displayName="Pedidos", ref="A1:J42", totalsRowCount=1)
        t.tableStyleInfo = TableStyleInfo(name="TableStyleMedium7", showRowStripes=True)
        t._initialise_columns()
        for col, cel in zip(t.tableColumns, ws[1]):
            col.name = str(cel.value)
        t.tableColumns[0].totalsRowLabel = "Total"
        t.tableColumns[5].totalsRowFunction = "sum"
        t.tableColumns[9].totalsRowFunction = "sum"
        t.tableColumns[9].calculatedColumnFormula = TableFormula(attr_text="Pedidos[[#This Row],[Cantidad]]*Pedidos[[#This Row],[Precio]]")
        ws.add_table(t)
        anchos(ws, J=12)
        hoja_solucion(wb, ["Segmentación: con una celda de la tabla › Diseño de tabla › Insertar segmentación de datos › Sucursal (y Estado).", "(openpyxl no crea segmentaciones: agrégalas en Excel.)"])
    return wb


def inventario_norte():
    rng = random.Random(1111)
    inv = [dict(x) for x in D["inventario"]]
    for x in inv:
        x["existencia"] = max(1, round(x["existencia"] * rng.uniform(0.7, 1.3)))
    return inv


def lab11(sol):
    wb = libro("Laboratorio 11 · Semáforo del inventario de Norte", "Mismo inventario con las existencias de Norte.",
               ["C2:C16: relleno rojo cuando la existencia sea menor que el mínimo de su fila (regla «Es menor que» con =$D2).", "H2:H16: conjunto de iconos (semáforo).",
                "F2:F16: barras de datos.", "A1:H1: estilo de celda Encabezado 1.", "Nivel Experto: amarillo entre el mínimo y 1.3 veces el mínimo; cambia el tema del libro."])
    ws = wb.create_sheet("Inventario")
    escribir_inventario(ws, inventario_norte())
    if sol:
        for c in ws[1]:
            c.style = "Headline 1"
        ws.conditional_formatting.add("C2:C16", CellIsRule(operator="lessThan", formula=["$D2"], fill=ROJO, font=Font(color="9C0006")))
        ws.conditional_formatting.add("C2:C16", CellIsRule(operator="between", formula=["$D2", "$D2*1.3"], fill=AMARILLO, font=Font(color="9C5700")))
        ws.conditional_formatting.add("H2:H16", IconSetRule("3TrafficLights1", "percent", [0, 33, 67]))
        ws.conditional_formatting.add("F2:F16", DataBarRule(start_type="min", end_type="max", color="638EC6"))
    return wb


def lab12(sol):
    wb = libro("Laboratorio 12 · Revisión del presupuesto en parejas", "Trabajen en parejas con el libro guardado en OneDrive.",
               ["Persona A: sube el libro a OneDrive y compártelo con B (Puede editar).", "Persona B: deja al menos un comentario sobre una cifra; A lo responde y hace el cambio.",
                "Desbloqueen B4:G11 (celdas de captura) y protejan la hoja.", "Revisen el historial de versiones (Archivo › Información).",
                "Descarguen una copia y súbanla.", "Nivel Experto: nota en A11 y protección de la estructura del libro."])
    ws = wb.create_sheet("Presupuesto")
    escribir_presupuesto(ws)
    if sol:
        for fila in ws["B4:G11"]:
            for c in fila:
                c.protection = Protection(locked=False)
        ws.protection.sheet = True
        ws["A11"].comment = Comment("Incluye servicio de cafeteras", "Docente")
        wb.security.lockStructure = True
        hoja_solucion(wb, ["Los comentarios en hilo se crean en Excel (Revisar › Nuevo comentario); openpyxl solo crea notas."])
    return wb


def lideres():
    t = {}
    for v in D["ventas"]:
        q = (int(v["fecha"][5:7]) - 1) // 3 + 1
        t.setdefault(q, {}).setdefault(v["sucursal"], 0)
        t[q][v["sucursal"]] += v["total"]
    return t, [max(t[q], key=t[q].get) for q in (1, 2, 3, 4)]


def lab13(sol):
    wb = libro("Laboratorio 13 · Tabla dinámica en Excel", "La hoja Ventas tiene las 720 ventas de 2025.",
               ["Inserta una tabla dinámica: Fecha agrupada por trimestres en filas, Sucursal en columnas, suma de Total en valores.",
                "En Respuestas!B2:B5 escribe la sucursal que más vendió en cada trimestre.", "Nivel Experto: otra tabla dinámica con Categoría en filas y Total como % del total general."])
    hoja_ventas(wb)
    ws = wb.create_sheet("Respuestas")
    encabezados(ws, 1, ["Trimestre", "Sucursal que más vendió"])
    t, lid = lideres()
    for i in range(4):
        ws.cell(row=i + 2, column=1, value=f"T{i + 1}")
        if sol:
            ws.cell(row=i + 2, column=2, value=lid[i])
    anchos(ws, A=12, B=26)
    if sol:
        s = hoja_solucion(wb, ["1. Clic en Ventas › Insertar › Tabla dinámica › Nueva hoja.", "2. Fecha a Filas; clic derecho en una fecha › Agrupar › Trimestres.",
                               "3. Sucursal a Columnas; Total a Valores (Suma).", "Totales por trimestre (referencia):"])
        encabezados(s, 8, ["Trimestre", "Centro", "Norte", "Sur"])
        for q in range(1, 5):
            s.cell(row=8 + q, column=1, value=f"T{q}")
            for j, su in enumerate(["Centro", "Norte", "Sur"], 2):
                s.cell(row=8 + q, column=j, value=t[q][su]).number_format = MONEDA0
    return wb


def lab14(sol):
    wb = libro("Laboratorio 14 · Tablero de ventas", "Arma el tablero en una hoja nueva llamada «Tablero».",
               ["Tabla dinámica: meses en filas y suma de Total en valores.", "Gráfico dinámico de líneas.", "Segmentación por Sucursal conectada a la tabla dinámica.",
                "Nivel Experto: escala de tiempo por Fecha y segmentación por Categoría."])
    hoja_ventas(wb)
    if sol:
        hoja_solucion(wb, ["1. Insertar › Tabla dinámica (hoja nueva «Tablero»): Fecha (Meses) en filas, Total en valores.", "2. Análisis de tabla dinámica › Gráfico dinámico › Líneas.",
                           "3. Análisis de tabla dinámica › Insertar segmentación de datos › Sucursal.", "4. (Experto) Insertar escala de tiempo › Fecha; segmentación por Categoría.",
                           "openpyxl no crea tablas dinámicas: esta solución describe los pasos."])
    return wb


def lab15(sol):
    wb = libro("Laboratorio 15 · Cazador de errores", "El resumen de la sucursal Norte tiene ocho errores sembrados.",
               ["Usa Comprobación de errores, Rastrear precedentes y Evaluar fórmula.", "Corrige los 8 errores (unidades, referencia eliminada, nombre de función, circular, división entre cero, referencia sin fijar, código buscado y texto sin comillas).",
                "Nivel Experto: usa SI.ERROR solo donde el error es esperado."])
    ws = wb.create_sheet("Resumen")
    ws["A1"] = "Resumen de productos · Norte, octubre"
    ws["A1"].font = Font(bold=True, size=14)
    encabezados(ws, 3, ["Código", "Producto", "Precio", "Costo", "Unidades", "Ventas", "Utilidad", "Margen", "Participación"])
    cods = ["CAF-002", "CAF-003", "CAF-004", "CAF-005", "FRI-001", "PAN-001", "PAN-002", "POS-001"]
    unidades = [190, 160, "1O8", 88, 175, 0, 290, 66]
    for i, c in enumerate(cods):
        r = i + 4
        p = PROD[c]
        vals = [c, p["nombre"], p["precio"], p["costo"], (108 if (sol and i == 2) else unidades[i])]
        for j, v in enumerate(vals, 1):
            ws.cell(row=r, column=j, value=v)
        ws.cell(row=r, column=6, value=f"=C{r}*E{r}")
        ws.cell(row=r, column=7, value=(f"=F{r}-D{r}*E{r}" if (sol or r != 7) else "=F7-#REF!*E7"))
        ws.cell(row=r, column=8, value=("=IFERROR(G9/F9,0)" if (sol and r == 9) else f"=G{r}/F{r}"))
        ws.cell(row=r, column=9, value=(f"=F{r}/$F$12" if sol else f"=F{r}/F{12 + i}"))
        for col in (3, 4, 6, 7):
            ws.cell(row=r, column=col).number_format = MONEDA0
        ws.cell(row=r, column=8).number_format = "0.0%"
        ws.cell(row=r, column=9).number_format = "0.0%"
    ws["A12"] = "Total"
    ws["F12"] = "=SUM(F4:F11)" if sol else "=SUMAR(F4:F11)"
    ws["G12"] = "=SUM(G4:G11)" if sol else "=SUM(G4:G12)"
    ws["H12"] = "=G12/F12"
    ws["F12"].number_format = ws["G12"].number_format = MONEDA0
    ws["H12"].number_format = "0.0%"
    for celda, txt in (("K3", "Código buscado"), ("K4", "Producto"), ("K5", "Precio"), ("K6", "Diagnóstico")):
        ws[celda] = txt
        ws[celda].font = NEGRITA
    ws["L3"] = "CAF-004" if sol else "CAF-04"
    ws["L4"] = "=_xlfn.XLOOKUP(L3,A4:A11,B4:B11)"
    ws["L5"] = "=_xlfn.XLOOKUP(L3,A4:A11,C4:C11)"
    ws["L6"] = '=IF(H12>0.6,"Rentable","Revisar")' if sol else '=IF(H12>0.6,Rentable,"Revisar")'
    anchos(ws, A=10, B=16, F=11, G=11, H=10, I=13, J=3, K=16, L=13)
    return wb


def lab16(sol):
    wb = libro("Laboratorio 16 · Pedidos atrasados", "La fecha de corte está en L1.",
               ["A2:A41: formato personalizado para ver PED-2501.", "F2:F41: formato personalizado para ver «12 pzas».",
                "Regla con fórmula en A2:I41 que pinte la fila completa de los pedidos pendientes con compromiso anterior a L1.", "Nivel Experto: amarillo para los pendientes que vencen en los 3 días siguientes."])
    ws = wb.create_sheet("Pedidos")
    escribir_pedidos(ws, D["pedidos"])
    ws["K1"] = "Fecha de corte"
    ws["K1"].font = NEGRITA
    poner_fecha(ws["L1"], "2025-11-12")
    anchos(ws, K=15, L=12)
    if sol:
        for r in range(2, 42):
            ws.cell(row=r, column=1).number_format = '"PED-"0'
            ws.cell(row=r, column=6).number_format = '0 "pzas"'
        ws.conditional_formatting.add("A2:I41", FormulaRule(formula=['AND($I2="Pendiente",$H2<$L$1)'], fill=ROJO))
        ws.conditional_formatting.add("A2:I41", FormulaRule(formula=['AND($I2="Pendiente",$H2>=$L$1,$H2<=$L$1+3)'], fill=AMARILLO))
    return wb


def lab17(sol):
    wb = libro("Laboratorio 17 · Buscador y resumen", "Hojas: Productos, Ventas, Buscador y Resumen.",
               ["Buscador!C4:C6: producto, categoría y precio del código de C2 con BUSCARX (cuarto argumento «No existe»).", "Buscador!C7: rango de precio con SI.CONJUNTO (Premium ≥60, Clásico ≥40, Básico).",
                "Resumen!B2:G4: ventas por sucursal y categoría con SUMAR.SI.CONJUNTO.", "Nivel Experto: C6 con INDICE+COINCIDIR y C9 con FILTRAR (productos de la misma categoría)."])
    hoja_productos(wb)
    hoja_ventas(wb)
    ws = wb.create_sheet("Buscador")
    ws["B1"] = "Buscador de productos"
    ws["B1"].font = TITULO
    ws["B2"], ws["C2"] = "Código:", "CAF-004"
    ws["C2"].fill = RELLENO_ENTRADA
    for celda, txt in (("B4", "Producto"), ("B5", "Categoría"), ("B6", "Precio"), ("B7", "Rango de precio"), ("B9", "Misma categoría")):
        ws[celda] = txt
        ws[celda].font = NEGRITA
    ws["C6"].number_format = MONEDA0
    anchos(ws, A=3, B=20, C=24)
    wr = wb.create_sheet("Resumen")
    encabezados(wr, 1, ["Sucursal \\ Categoría"] + CATS)
    for i, s in enumerate(["Centro", "Norte", "Sur"], 2):
        wr.cell(row=i, column=1, value=s).font = NEGRITA
        for j in range(2, 8):
            wr.cell(row=i, column=j).number_format = MONEDA0
    anchos(wr, A=22, B=14, C=12, D=10, E=12, F=10, G=12)
    if sol:
        ws["C4"] = '=_xlfn.XLOOKUP(C2,Productos!A2:A21,Productos!B2:B21,"No existe")'
        ws["C5"] = '=_xlfn.XLOOKUP(C2,Productos!A2:A21,Productos!C2:C21,"No existe")'
        ws["C6"] = "=INDEX(Productos!D2:D21,MATCH(C2,Productos!A2:A21,0))"
        ws["C7"] = '=_xlfn.IFS(C6>=60,"Premium",C6>=40,"Clásico",TRUE,"Básico")'
        for i in range(2, 5):
            for j in range(2, 8):
                L = get_column_letter(j)
                wr.cell(row=i, column=j, value=f"=SUMIFS(Ventas!$I:$I,Ventas!$C:$C,$A{i},Ventas!$F:$F,{L}$1)")
        hoja_solucion(wb, ["C9 (Experto): =FILTRAR(Productos!B2:B21, Productos!C2:C21=C5). openpyxl no escribe matrices dinámicas: escríbela en Excel."])
    return wb


def modelo(ws, precio, costo, cafes, fijos, con_tabla=False):
    ws["A1"] = "Punto de equilibrio · Cafetería La Taza"
    ws["A1"].font = TITULO
    filas = {3: ("Precio promedio por café", precio, MONEDA), 4: ("Costo variable por café", costo, MONEDA), 5: ("Cafés vendidos al mes", cafes, "#,##0.00")}
    for r, (t, v, f) in filas.items():
        ws.cell(row=r, column=1, value=t).fill = RELLENO_ENTRADA
        ws.cell(row=r, column=2, value=v).number_format = f
    ws["A7"] = "Costos fijos mensuales"
    ws["A7"].font = NEGRITA
    for i, (c, m) in enumerate(fijos, 8):
        ws.cell(row=i, column=1, value=c)
        ws.cell(row=i, column=2, value=m).number_format = MONEDA0
    ws["A12"], ws["B12"] = "Total costos fijos", "=SUM(B8:B11)"
    ws["A14"], ws["B14"] = "Ingresos", "=B3*B5"
    ws["A15"], ws["B15"] = "Costos variables", "=B4*B5"
    ws["A16"], ws["B16"] = "Utilidad", "=B14-B15-B12"
    for d in ("B12", "B14", "B15", "B16"):
        ws[d].number_format = MONEDA0
    ws["A12"].font = ws["A16"].font = NEGRITA
    ws["D2"] = "Cafés completos"
    ws["D2"].font = NEGRITA
    if con_tabla:
        ws["D13"], ws["E13"] = "Precio", "Utilidad"
        for i, p in enumerate([42, 46, 50, 54, 58], 15):
            ws.cell(row=i, column=4, value=p).number_format = MONEDA0
    anchos(ws, A=28, B=14, C=3, D=16, E=14)


def lab18(sol):
    wb = libro("Laboratorio 18 · Punto de equilibrio de Norte", "El mismo modelo con los costos de la sucursal Norte.",
               ["Buscar objetivo: B16 con valor 0 cambiando B5.", "D3: =REDONDEAR.MAS(B5,0).", "Escenarios sobre B8:B9: «Base» (actuales), «Renta sube» (+5,000 de renta) y «Más personal» (+14,000 de sueldos).",
                "Nivel Experto: tabla de datos en D14:E19 (E14 =B16, celda de entrada de columna B3)."])
    ws = wb.create_sheet("Modelo")
    fijos = [("Renta", 24000), ("Sueldos", 88000), ("Servicios", 8200), ("Otros gastos", 5800)]
    precio, costo = 50, 13
    total_fijos = sum(m for _, m in fijos)
    eq = total_fijos / (precio - costo)
    modelo(ws, precio, costo, round(eq, 6) if sol else 2800, fijos, con_tabla=True)
    if sol:
        ws["D3"] = "=ROUNDUP(B5,0)"
        ws.scenarios = ScenarioList(scenario=[
            Scenario(name="Base", inputCells=[InputCells(r="B8", val="24000"), InputCells(r="B9", val="88000")]),
            Scenario(name="Renta sube", inputCells=[InputCells(r="B8", val="29000"), InputCells(r="B9", val="88000")]),
            Scenario(name="Más personal", inputCells=[InputCells(r="B8", val="24000"), InputCells(r="B9", val="102000")]),
        ])
        ws["E14"] = "=B16"
        ws["E15"] = DataTableFormula(ref="E15:E19", r1="B3")
    return wb


def tabla_semana(ws, suc, fila0=1, col0=1, con_formato=False):
    filas = D["semanaSucursal"][suc] if suc != "Centro" else D["semana"]
    cab = ["Producto", "Precio", "Unidades", "Ventas", "Participación"]
    for j, v in enumerate(cab):
        ws.cell(row=fila0, column=col0 + j, value=v)
    L = lambda k: get_column_letter(col0 + k)
    ini, fin = fila0 + 1, fila0 + len(filas)
    for i, p in enumerate(filas):
        r = fila0 + 1 + i
        ws.cell(row=r, column=col0, value=p["producto"])
        ws.cell(row=r, column=col0 + 1, value=p["precio"])
        ws.cell(row=r, column=col0 + 2, value=sum(p["cantidades"]))
        ws.cell(row=r, column=col0 + 3, value=f"={L(1)}{r}*{L(2)}{r}")
        ws.cell(row=r, column=col0 + 4, value=f"={L(3)}{r}/SUM(${L(3)}${ini}:${L(3)}${fin})")
    if con_formato:
        for j in range(5):
            c = ws.cell(row=fila0, column=col0 + j)
            c.font, c.fill = NEGRITA, RELLENO_ENC
        for r in range(ini, fin + 1):
            ws.cell(row=r, column=col0 + 3).number_format = MONEDA
        bordes(ws, f"{L(0)}{fila0}:{L(4)}{fin}")


def lab19(sol):
    wb = libro("Laboratorio 19 · Macro en Excel de escritorio", "Necesitas Excel para Windows o Mac. Al final guarda como .xlsm.",
               ["Activa la pestaña Programador.", "En «Semana 42», graba la macro FormatoReporte: A1:E1 en negrita y con relleno, D2:D9 en moneda, bordes en A1:E9.",
                "Ejecútala en «Semana 43».", "Inserta un botón y asígnale la macro.", "Guarda como Libro de Excel habilitado para macros (.xlsm).",
                "Nivel Experto: graba con referencias relativas y ejecútala en «Semana 44» (el reporte empieza en B3)."])
    for nombre, suc, f0, c0 in (("Semana 42", "Centro", 1, 1), ("Semana 43", "Norte", 1, 1), ("Semana 44", "Sur", 3, 2)):
        ws = wb.create_sheet(nombre)
        tabla_semana(ws, suc, f0, c0, con_formato=sol)
        anchos(ws, A=22 if c0 == 1 else 4, B=22 if c0 == 2 else 10)
    if sol:
        hoja_solucion(wb, ["Código que genera la grabadora (referencias relativas, desde A1):", "Sub FormatoReporte()", '    ActiveCell.Range("A1:E1").Select',
                           "    Selection.Font.Bold = True", "    Selection.Interior.Color = RGB(243, 235, 223)", '    ActiveCell.Offset(1, 3).Range("A1:A8").Select',
                           '    Selection.NumberFormat = "$#,##0.00"', '    ActiveCell.Offset(-1, -3).Range("A1:E9").Select', "    Selection.Borders.LineStyle = xlContinuous",
                           "End Sub", "", "Guarda como .xlsm e inserta un botón (Programador › Insertar › Botón) con la macro asignada.",
                           "openpyxl no guarda código VBA: este archivo muestra el resultado del formato."])
    return wb


# ================================================================ integradores
def int_basico(sol):
    wb = libro("Reto integrador básico · Reporte semanal de ventas", "Reporte semanal de la sucursal Sur: cálculos, formato, gráfica e impresión.",
               ["J4:J11 unidades de la semana (suma de Lun a Dom); K4:K11 ventas (precio × unidades); J12 y K12 totales; N4 promedio de ventas por producto; N5 venta mayor.",
                "Formato: título destacado, encabezados A3:K3 en negrita con relleno, precio y ventas en moneda, bordes en A3:K12.",
                "Gráfico de columnas o barras de las ventas por producto, con título.", "Impresión horizontal ajustada a una página; exporta a PDF y sube ambos archivos."])
    ws = wb.create_sheet("Semana")
    ws["A1"] = "Reporte semanal · Sucursal Sur · Semana 42"
    cab = ["Producto", "Precio"] + DIAS + ["Unidades", "Ventas"]
    for j, v in enumerate(cab, 1):
        ws.cell(row=3, column=j, value=v)
    for i, p in enumerate(D["semanaSucursal"]["Sur"], 4):
        ws.cell(row=i, column=1, value=p["producto"])
        ws.cell(row=i, column=2, value=p["precio"])
        for j, v in enumerate(p["cantidades"], 3):
            ws.cell(row=i, column=j, value=v)
    ws["A12"] = "Total"
    ws["M4"], ws["M5"] = "Promedio por producto", "Venta mayor"
    anchos(ws, A=22, M=22)
    if sol:
        ws["A1"].font = TITULO
        for i in range(4, 12):
            ws.cell(row=i, column=10, value=f"=SUM(C{i}:I{i})")
            ws.cell(row=i, column=11, value=f"=B{i}*J{i}")
        ws["J12"], ws["K12"] = "=SUM(J4:J11)", "=SUM(K4:K11)"
        ws["N4"], ws["N5"] = "=AVERAGE(K4:K11)", "=MAX(K4:K11)"
        for c in ws[3]:
            if c.column <= 11:
                c.font, c.fill = NEGRITA, RELLENO_ENC
        for r in range(4, 13):
            ws.cell(row=r, column=2).number_format = MONEDA
            ws.cell(row=r, column=11).number_format = MONEDA
        ws["N4"].number_format = ws["N5"].number_format = MONEDA
        bordes(ws, "A3:K12")
        ch = BarChart()
        ch.title = "Ventas de la semana por producto"
        ch.add_data(Reference(ws, min_col=11, min_row=3, max_row=11), titles_from_data=True)
        ch.set_categories(Reference(ws, min_col=1, min_row=4, max_row=11))
        ws.add_chart(ch, "A15")
        ws.page_setup.orientation = "landscape"
        ws.sheet_properties.pageSetUpPr.fitToPage = True
        ws.page_setup.fitToWidth, ws.page_setup.fitToHeight = 1, 1
    return wb


def int_intermedio(sol):
    wb = libro("Reto integrador intermedio · Base de pedidos confiable", "Limpia la base de pedidos y calcula las comisiones del mes.",
               ["Pedidos: quita los duplicados.", "Convierte los pedidos en la tabla «Pedidos» con la columna calculada Importe y la fila de totales.",
                "Formato condicional para los pedidos con Estado «Pendiente».", "Comisiones: D2:D21 (meta F1, tasa F2) y F4 (cuántos alcanzaron la meta).",
                "Protege la hoja Comisiones dejando editables solo F1 y F2."])
    ws = wb.create_sheet("Pedidos")
    ped = list(D["pedidos"])
    if not sol:
        for k, idx in enumerate([4, 11, 19, 26, 33]):
            ped.insert(idx + k, dict(D["pedidos"][idx]))
    escribir_pedidos(ws, ped)
    wc = wb.create_sheet("Comisiones")
    encabezados(wc, 1, ["Vendedor", "Sucursal", "Ventas del mes", "Comisión"])
    rng = random.Random(7070)
    for i, e in enumerate(D["empleados"], 2):
        wc.cell(row=i, column=1, value=e["nombre"])
        wc.cell(row=i, column=2, value=e["sucursal"])
        wc.cell(row=i, column=3, value=round(e["ventasMes"] * rng.uniform(0.9, 1.1))).number_format = MONEDA0
        wc.cell(row=i, column=4).number_format = MONEDA
    for celda, txt in (("E1", "Meta mensual"), ("E2", "Tasa de comisión"), ("E4", "Alcanzaron la meta")):
        wc[celda] = txt
        wc[celda].font = NEGRITA
    wc["F1"], wc["F2"] = 10000, 0.05
    wc["F1"].number_format, wc["F2"].number_format = MONEDA0, "0%"
    anchos(wc, A=20, C=15, E=20)
    if sol:
        for c in ws[1]:
            c.fill = PatternFill()
        ws["J1"] = "Importe"
        for i in range(2, 42):
            ws.cell(row=i, column=10, value="=Pedidos[[#This Row],[Cantidad]]*Pedidos[[#This Row],[Precio]]").number_format = MONEDA0
        ws["A42"], ws["J42"] = "Total", "=SUBTOTAL(109,Pedidos[Importe])"
        t = Table(displayName="Pedidos", ref="A1:J42", totalsRowCount=1)
        t.tableStyleInfo = TableStyleInfo(name="TableStyleMedium2", showRowStripes=True)
        t._initialise_columns()
        for col, cel in zip(t.tableColumns, ws[1]):
            col.name = str(cel.value)
        t.tableColumns[0].totalsRowLabel = "Total"
        t.tableColumns[9].totalsRowFunction = "sum"
        t.tableColumns[9].calculatedColumnFormula = TableFormula(attr_text="Pedidos[[#This Row],[Cantidad]]*Pedidos[[#This Row],[Precio]]")
        ws.add_table(t)
        ws.conditional_formatting.add("I2:I41", CellIsRule(operator="equal", formula=['"Pendiente"'], fill=AMARILLO))
        for i in range(2, 22):
            wc.cell(row=i, column=4, value=f"=IF(C{i}>=$F$1,C{i}*$F$2,0)")
        wc["F4"] = '=COUNTIF(C2:C21,">="&F1)'
        wc["F1"].protection = Protection(locked=False)
        wc["F2"].protection = Protection(locked=False)
        wc.protection.sheet = True
    return wb


def int_avanzado(sol):
    wb = libro("Reto integrador avanzado · Tablero anual automatizado", "Tablero, buscador, escenarios y una macro de formato. Entrega en .xlsm.",
               ["Hoja nueva «Tablero»: tabla dinámica (suma de Total por mes), gráfico dinámico y segmentación por Sucursal.",
                "Buscador!C4:C6: producto, categoría y precio del código de C2 con BUSCARX.", "Modelo: al menos dos escenarios cambiando los cafés vendidos (B5).",
                "Macro que dé formato a la hoja Reporte (encabezados en negrita con relleno y ventas en moneda), asignada a un botón.", "Guarda como .xlsm."])
    hoja_productos(wb)
    hoja_ventas(wb)
    wbus = wb.create_sheet("Buscador")
    wbus["B1"] = "Buscador de productos"
    wbus["B1"].font = TITULO
    wbus["B2"], wbus["C2"] = "Código:", "CAF-004"
    wbus["C2"].fill = RELLENO_ENTRADA
    for celda, txt in (("B4", "Producto"), ("B5", "Categoría"), ("B6", "Precio")):
        wbus[celda] = txt
        wbus[celda].font = NEGRITA
    anchos(wbus, A=3, B=18, C=24)
    wm = wb.create_sheet("Modelo")
    E = D["equilibrio"]
    modelo(wm, E["precio"], E["costoVariable"], E["cafes"], [(c["concepto"], c["monto"]) for c in E["costosFijos"]])
    wr = wb.create_sheet("Reporte")
    tabla_semana(wr, "Centro", 1, 1, con_formato=sol)
    anchos(wr, A=22)
    if sol:
        for d, col in (("C4", "B"), ("C5", "C"), ("C6", "D")):
            wbus[d] = f'=_xlfn.XLOOKUP(C2,Productos!A2:A21,Productos!{col}2:{col}21,"No existe")'
        wm.scenarios = ScenarioList(scenario=[Scenario(name="Base", inputCells=[InputCells(r="B5", val="3000")]), Scenario(name="Optimista", inputCells=[InputCells(r="B5", val="4200")])])
        hoja_solucion(wb, ["Tablero: Insertar › Tabla dinámica (Fecha por meses, Suma de Total), Gráfico dinámico, Segmentación por Sucursal.",
                           "Macro: Programador › Grabar macro (FormatoReporte) sobre Reporte!A1:E9; botón con la macro; guardar como .xlsm.",
                           "openpyxl no crea tablas dinámicas ni guarda VBA: esta solución incluye el buscador, los escenarios y el formato final del reporte."])
    return wb


def main():
    libro_base()
    for nombre, f in [("lab01-lista-precios", lab01), ("lab02-corte-caja", lab02), ("lab03-reporte-semanal", lab03), ("lab04-menu", lab04),
                      ("lab05-sucursales", lab05), ("lab06-graficos", lab06), ("lab07-impresion", lab07), ("lab08-comisiones", lab08),
                      ("lab09-clientes", lab09), ("lab10-pedidos", lab10), ("lab11-inventario", lab11), ("lab12-presupuesto", lab12),
                      ("lab13-ventas-2025", lab13), ("lab14-tablero", lab14), ("lab15-errores", lab15), ("lab16-pedidos", lab16),
                      ("lab17-buscador", lab17), ("lab18-equilibrio", lab18), ("lab19-reporte-macro", lab19)]:
        lab(nombre, f)
    integrador("int-basico", int_basico)
    integrador("int-intermedio", int_intermedio)
    integrador("int-avanzado", int_avanzado)
    print("libros generados")


if __name__ == "__main__":
    main()
