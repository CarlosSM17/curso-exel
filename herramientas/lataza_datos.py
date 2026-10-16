"""Datos del caso Cafetería La Taza.

Fuente única de datos del curso. Se generan de forma determinista (semilla fija)
para que el simulador web (assets/js/datos.js) y los libros de laboratorio .xlsx
usen exactamente las mismas cifras.
"""
import datetime as dt
import random

SEMILLA = 2025
ANIO = 2025

SUCURSALES = [
    {"id": "CEN", "nombre": "Centro", "encargado": "Rosa Méndez", "apertura": "2016-03-01"},
    {"id": "NOR", "nombre": "Norte", "encargado": "Luis Ortega", "apertura": "2019-08-15"},
    {"id": "SUR", "nombre": "Sur", "encargado": "Ana Beltrán", "apertura": "2022-02-01"},
]

# codigo, nombre, categoria, precio, costo, popularidad
PRODUCTOS = [
    ("CAF-001", "Espresso", "Café caliente", 35, 8, 0.8),
    ("CAF-002", "Americano", "Café caliente", 40, 9, 1.4),
    ("CAF-003", "Capuchino", "Café caliente", 52, 13, 1.5),
    ("CAF-004", "Latte", "Café caliente", 55, 14, 1.6),
    ("CAF-005", "Moka", "Café caliente", 60, 16, 0.9),
    ("CAF-006", "Café de olla", "Café caliente", 38, 8, 0.8),
    ("FRI-001", "Frappé moka", "Café frío", 68, 18, 1.0),
    ("FRI-002", "Cold brew", "Café frío", 58, 12, 0.7),
    ("FRI-003", "Latte helado", "Café frío", 58, 15, 0.8),
    ("TE-001", "Chai latte", "Té", 54, 14, 0.6),
    ("TE-002", "Té verde", "Té", 38, 7, 0.4),
    ("PAN-001", "Croissant", "Panadería", 38, 12, 1.0),
    ("PAN-002", "Concha", "Panadería", 22, 6, 1.3),
    ("PAN-003", "Muffin de mora", "Panadería", 35, 10, 0.7),
    ("PAN-004", "Bagel con queso crema", "Panadería", 45, 15, 0.5),
    ("POS-001", "Pay de queso", "Postres", 55, 17, 0.6),
    ("POS-002", "Brownie", "Postres", 40, 11, 0.7),
    ("POS-003", "Galleta de avena", "Postres", 25, 6, 0.8),
    ("ALI-001", "Sándwich de pavo", "Alimentos", 78, 30, 0.6),
    ("ALI-002", "Panini caprese", "Alimentos", 85, 32, 0.5),
]

CATEGORIAS = ["Café caliente", "Café frío", "Té", "Panadería", "Postres", "Alimentos"]

EMPLEADOS = [
    # nombre, sucursal, puesto, ingreso
    ("Andrea Solís", "Centro", "Barista", "2019-05-13"),
    ("Bruno Castillo", "Centro", "Barista", "2021-01-18"),
    ("Carla Núñez", "Centro", "Cajera", "2020-09-01"),
    ("Daniel Pineda", "Centro", "Barista", "2023-03-06"),
    ("Elena Robles", "Centro", "Supervisora", "2017-07-10"),
    ("Fernando Ibarra", "Centro", "Barista", "2024-02-12"),
    ("Gabriela Luna", "Centro", "Cajera", "2022-06-20"),
    ("Héctor Vargas", "Norte", "Barista", "2019-10-07"),
    ("Isabel Cruz", "Norte", "Supervisora", "2019-08-15"),
    ("Jorge Medina", "Norte", "Barista", "2021-11-22"),
    ("Karen Salazar", "Norte", "Cajera", "2023-01-09"),
    ("Leonardo Ríos", "Norte", "Barista", "2022-04-04"),
    ("Mariana Paredes", "Norte", "Barista", "2024-08-19"),
    ("Nicolás Herrera", "Sur", "Barista", "2022-02-01"),
    ("Olivia Campos", "Sur", "Supervisora", "2022-02-01"),
    ("Pablo Aguilar", "Sur", "Cajero", "2022-09-12"),
    ("Regina Fuentes", "Sur", "Barista", "2023-05-29"),
    ("Sergio Mendoza", "Sur", "Barista", "2024-01-15"),
    ("Tania Guzmán", "Sur", "Cajera", "2024-10-07"),
    ("Valeria Ochoa", "Sur", "Barista", "2025-01-06"),
]

# Ventas del mes (octubre 2025) por vendedor: incluye casos frontera (exactamente 10,000)
VENTAS_MES = [12850, 9420, 10000, 7350, 15600, 8900, 11240,
              13480, 16250, 9990, 6780, 10420, 8150,
              11870, 14320, 7640, 10000, 9150, 5980, 12300]
# Ventas de noviembre 2025 (para el laboratorio: otros datos, misma estructura)
VENTAS_MES_LAB = [11200, 10050, 8700, 9999, 16800, 12400, 7600,
                  10000, 15100, 8450, 9300, 13750, 10600,
                  7900, 12950, 11100, 6400, 10300, 9800, 14200]

PAGOS = ["Efectivo", "Tarjeta", "Tarjeta", "Transferencia"]

MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
         "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

INSUMOS = [
    # insumo, unidad, existencia, minimo, maximo, costo, proveedor
    ("Café en grano (blend)", "kg", 18, 25, 80, 420, "Finca El Mirador"),
    ("Café en grano (origen)", "kg", 32, 15, 50, 560, "Finca El Mirador"),
    ("Leche entera", "L", 140, 120, 300, 24, "Lácteos del Valle"),
    ("Leche deslactosada", "L", 46, 60, 150, 27, "Lácteos del Valle"),
    ("Bebida de almendra", "L", 30, 20, 60, 58, "Natura Verde"),
    ("Chocolate en polvo", "kg", 9, 8, 25, 190, "Cacao Real"),
    ("Jarabe de vainilla", "botella", 4, 6, 20, 145, "Sabores MX"),
    ("Jarabe de caramelo", "botella", 11, 6, 20, 145, "Sabores MX"),
    ("Té chai (concentrado)", "L", 7, 5, 18, 210, "Té y Más"),
    ("Té verde", "caja", 15, 6, 20, 95, "Té y Más"),
    ("Vasos 12 oz", "pieza", 850, 1000, 4000, 1.8, "EcoEmpaque"),
    ("Vasos 16 oz", "pieza", 2300, 1000, 4000, 2.1, "EcoEmpaque"),
    ("Tapas", "pieza", 2900, 1500, 6000, 0.9, "EcoEmpaque"),
    ("Servilletas", "paquete", 22, 20, 80, 38, "EcoEmpaque"),
    ("Croissant congelado", "pieza", 64, 80, 240, 9.5, "Panificadora Sol"),
]

CLIENTES_CORP = ["Despacho Luna & Asoc.", "Colegio Montebello", "Hospital San Rafael",
                 "Inmobiliaria Cumbres", "Notaría 14", "Universidad del Norte",
                 "Gimnasio Fénix", "Clínica Dental Sonrisa", "Agencia Pixel", "Coworking Nodo"]

NOMBRES = ["Lucía", "Mateo", "Sofía", "Santiago", "Valentina", "Diego", "Camila", "Emiliano",
           "Renata", "Sebastián", "Ximena", "Leonardo", "Fernanda", "Andrés", "Daniela", "Rodrigo",
           "Paula", "Ricardo", "Natalia", "Joaquín", "Mónica", "Arturo", "Paola", "Gustavo",
           "Alejandra", "Raúl", "Verónica", "Óscar", "Itzel", "Manuel", "Brenda"]
APELLIDOS = ["Hernández", "García", "Martínez", "López", "González", "Pérez", "Rodríguez",
             "Sánchez", "Ramírez", "Flores", "Torres", "Vázquez", "Morales", "Reyes", "Jiménez",
             "Domínguez", "Castro", "Ortiz", "Rubio", "Silva", "Navarro", "Romero", "Cortés",
             "Estrada", "Mejía", "Lara", "Cabrera", "Ponce", "Zamora", "Bravo", "Acosta"]

PRESUPUESTO = [
    # concepto, ene..jun
    ("Renta", [28000] * 6),
    ("Sueldos", [96000, 96000, 96000, 98500, 98500, 98500]),
    ("Insumos", [61000, 58500, 63200, 66800, 70400, 72100]),
    ("Luz", [5200, 5000, 5400, 6100, 6900, 7300]),
    ("Agua", [1800, 1750, 1900, 2050, 2200, 2300]),
    ("Internet y teléfono", [1650] * 6),
    ("Publicidad", [4500, 3000, 6000, 3000, 8000, 3000]),
    ("Mantenimiento", [2500, 0, 3800, 0, 2500, 1200]),
]

EQUILIBRIO = {
    "costos_fijos": [("Renta", 28000), ("Sueldos", 96000), ("Servicios", 9500), ("Otros gastos", 6500)],
    "precio_promedio": 52,
    "costo_variable": 14,
    "cafes": 3000,
}


def _fecha_str(d):
    return d.strftime("%Y-%m-%d")


def generar():
    rng = random.Random(SEMILLA)
    productos = [
        {"codigo": c, "nombre": n, "categoria": cat, "precio": p, "costo": co, "pop": pop}
        for c, n, cat, p, co, pop in PRODUCTOS
    ]

    # ---------- Ventas 2025 (registro por día, sucursal y producto) ----------
    # Factores por trimestre y sucursal: la sucursal líder cambia según el trimestre.
    factor_suc = {
        "Centro": [1.25, 1.10, 0.92, 1.20],
        "Norte": [0.95, 1.05, 1.30, 0.98],
        "Sur": [0.80, 0.85, 0.90, 1.02],
    }
    emp_por_suc = {}
    for nombre, suc, puesto, _ in EMPLEADOS:
        emp_por_suc.setdefault(suc, []).append(nombre)

    ventas = []
    pesos = [p["pop"] for p in productos]
    for m in range(1, 13):
        trimestre = (m - 1) // 3
        dias_mes = (dt.date(ANIO + (m == 12), (m % 12) + 1, 1) - dt.date(ANIO, m, 1)).days
        for suc in ("Centro", "Norte", "Sur"):
            for _ in range(20):
                dia = rng.randint(1, dias_mes)
                prod = rng.choices(productos, weights=pesos)[0]
                frio = prod["categoria"] == "Café frío"
                caliente = prod["categoria"] in ("Café caliente", "Té")
                temporada = 1.0
                if frio:
                    temporada = 1.6 if m in (4, 5, 6, 7, 8) else 0.7
                elif caliente:
                    temporada = 1.25 if m in (11, 12, 1, 2) else 0.95
                base = rng.uniform(14, 42)
                cantidad = max(4, round(base * temporada * factor_suc[suc][trimestre]))
                ventas.append({
                    "fecha": _fecha_str(dt.date(ANIO, m, dia)),
                    "sucursal": suc,
                    "codigo": prod["codigo"],
                    "producto": prod["nombre"],
                    "categoria": prod["categoria"],
                    "cantidad": cantidad,
                    "precio": prod["precio"],
                    "vendedor": rng.choice(emp_por_suc[suc]),
                    "pago": rng.choice(PAGOS),
                })
    ventas.sort(key=lambda v: (v["fecha"], v["sucursal"], v["codigo"]))
    for i, v in enumerate(ventas, 1):
        v["folio"] = f"V-{i:04d}"
        v["total"] = v["cantidad"] * v["precio"]

    # ---------- Semana (reporte semanal de la sucursal Centro) ----------
    prod_semana = ["CAF-002", "CAF-003", "CAF-004", "CAF-005", "FRI-001", "PAN-001", "PAN-002", "POS-002"]
    semana = []
    for cod in prod_semana:
        p = next(x for x in productos if x["codigo"] == cod)
        base = 20 + p["pop"] * 22
        cant = [max(5, round(base * f * rng.uniform(0.85, 1.15))) for f in (0.9, 0.85, 0.95, 1.0, 1.15, 1.35, 1.2)]
        semana.append({"codigo": cod, "producto": p["nombre"], "precio": p["precio"], "cantidades": cant})

    # Semana por sucursal (para el módulo de hojas)
    semana_sucursal = {}
    for suc, f in (("Centro", 1.0), ("Norte", 0.92), ("Sur", 0.74)):
        filas = []
        for s in semana:
            filas.append({"producto": s["producto"], "precio": s["precio"],
                          "cantidades": [max(3, round(c * f * rng.uniform(0.9, 1.1))) for c in s["cantidades"]]})
        semana_sucursal[suc] = filas

    # ---------- Corte de caja (un día en Centro) ----------
    corte = []
    horas = ["07:12", "07:35", "07:58", "08:20", "08:41", "09:05", "09:47", "10:15",
             "11:02", "12:30", "13:18", "14:05", "16:40", "18:22"]
    tickets_prod = ["CAF-003", "CAF-002", "PAN-002", "CAF-004", "FRI-001", "PAN-001", "CAF-001",
                    "ALI-001", "CAF-004", "POS-001", "CAF-005", "ALI-002", "FRI-002", "CAF-003"]
    for i, (h, cod) in enumerate(zip(horas, tickets_prod), 1):
        p = next(x for x in productos if x["codigo"] == cod)
        corte.append({"ticket": 1040 + i, "hora": h, "producto": p["nombre"], "cantidad": rng.randint(1, 4),
                      "precio": p["precio"], "pago": rng.choice(["Efectivo", "Tarjeta"])})

    # ---------- Clientes (base con problemas para limpiar) ----------
    clientes = []
    usados = set()
    for i in range(32):
        while True:
            n = rng.choice(NOMBRES)
            a = rng.choice(APELLIDOS)
            if (n, a) not in usados:
                usados.add((n, a))
                break
        suc = rng.choice(["Centro", "Norte", "Sur"])
        correo = f"{n.lower()}.{a.lower()}@correo.mx"
        for x, y in (("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u"), ("ñ", "n")):
            correo = correo.replace(x, y)
        clientes.append({
            "id": f"CL-{101 + i}",
            "nombre": f"{n} {a}",
            "telefono": f"55{rng.randint(10000000, 99999999)}",
            "correo": correo,
            "sucursal": suc,
            "registro": _fecha_str(dt.date(2024, 1, 1) + dt.timedelta(days=rng.randint(0, 600))),
            "puntos": rng.randint(0, 48) * 10,
        })
    # Duplicados (filas repetidas exactas) en posiciones fijas
    duplicados_de = [3, 9, 15, 22, 27]
    clientes_sucios = list(clientes)
    for k, idx in enumerate(duplicados_de):
        clientes_sucios.insert(idx + 6 + k * 2, dict(clientes[idx]))

    # ---------- Pedidos de catering (tabla y formato avanzado) ----------
    pedidos = []
    fecha_corte = dt.date(2025, 11, 15)
    for i in range(40):
        f_ped = dt.date(2025, 10, 1) + dt.timedelta(days=rng.randint(0, 44))
        p = rng.choice(productos)
        cant = rng.choice([12, 15, 20, 24, 30, 36, 40, 50, 60])
        comp = f_ped + dt.timedelta(days=rng.randint(2, 8))
        if comp <= fecha_corte - dt.timedelta(days=3):
            estado = "Entregado" if rng.random() < 0.82 else "Pendiente"
        else:
            estado = "Pendiente"
        pedidos.append({
            "folio": 2501 + i,
            "fecha": _fecha_str(f_ped),
            "cliente": rng.choice(CLIENTES_CORP),
            "sucursal": rng.choice(["Centro", "Norte", "Sur"]),
            "producto": p["nombre"],
            "cantidad": cant,
            "precio": p["precio"],
            "compromiso": _fecha_str(comp),
            "estado": estado,
        })
    pedidos.sort(key=lambda x: x["fecha"])
    for i, p in enumerate(pedidos):
        p["folio"] = 2501 + i

    datos = {
        "anio": ANIO,
        "sucursales": SUCURSALES,
        "productos": [{k: p[k] for k in ("codigo", "nombre", "categoria", "precio", "costo")} for p in productos],
        "categorias": CATEGORIAS,
        "empleados": [
            {"nombre": n, "sucursal": s, "puesto": pu, "ingreso": ing, "ventasMes": vm, "ventasMesLab": vl}
            for (n, s, pu, ing), vm, vl in zip(EMPLEADOS, VENTAS_MES, VENTAS_MES_LAB)
        ],
        "ventas": ventas,
        "semana": semana,
        "semanaSucursal": semana_sucursal,
        "corte": corte,
        "clientes": clientes,
        "clientesSucios": clientes_sucios,
        "pedidos": pedidos,
        "fechaCorte": _fecha_str(fecha_corte),
        "inventario": [
            {"insumo": a, "unidad": b, "existencia": c, "minimo": d, "maximo": e, "costo": f, "proveedor": g}
            for a, b, c, d, e, f, g in INSUMOS
        ],
        "presupuesto": [{"concepto": c, "meses": m} for c, m in PRESUPUESTO],
        "equilibrio": {
            "costosFijos": [{"concepto": c, "monto": m} for c, m in EQUILIBRIO["costos_fijos"]],
            "precio": EQUILIBRIO["precio_promedio"],
            "costoVariable": EQUILIBRIO["costo_variable"],
            "cafes": EQUILIBRIO["cafes"],
        },
        "meses": MESES,
        "mesesCortos": MESES_CORTOS,
        "dias": DIAS,
    }
    return datos


if __name__ == "__main__":
    d = generar()
    print(len(d["ventas"]), "ventas")
    tot = {}
    for v in d["ventas"]:
        q = (int(v["fecha"][5:7]) - 1) // 3 + 1
        tot.setdefault(q, {}).setdefault(v["sucursal"], 0)
        tot[q][v["sucursal"]] += v["total"]
    for q in sorted(tot):
        print("T%d" % q, tot[q], "líder:", max(tot[q], key=tot[q].get))
    prod = {}
    for v in d["ventas"]:
        prod[v["producto"]] = prod.get(v["producto"], 0) + v["total"]
    print(sorted(prod.items(), key=lambda x: -x[1])[:5])
    print(sum(1 for p in d["pedidos"] if p["estado"] == "Pendiente" and p["compromiso"] < d["fechaCorte"]), "atrasados")
    print(len(d["clientesSucios"]), "clientes sucios")
