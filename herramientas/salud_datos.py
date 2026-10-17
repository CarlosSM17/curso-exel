"""Datos del caso Clínica Universitaria Vida Sana (ficticio, con fines didácticos).

Fuente única de datos del curso «Excel para Ciencias de la Salud». Se generan de forma
determinista (semilla fija) para que el simulador web (assets/js/datos.js) y los libros
de laboratorio .xlsx usen exactamente las mismas cifras.

Los valores clínicos (IMC, glucosa, dosis, presión arterial) son inventados y solo sirven
para practicar Excel; no deben usarse para decisiones clínicas.
"""
import datetime as dt
import random

SEMILLA = 2025
ANIO = 2025

SEDES = [
    {"id": "CEN", "nombre": "Centro", "responsable": "Dra. Rosa Méndez", "apertura": "2012-03-01"},
    {"id": "NOR", "nombre": "Norte", "responsable": "Dr. Luis Ortega", "apertura": "2018-08-15"},
    {"id": "SUR", "nombre": "Sur", "responsable": "Dra. Ana Beltrán", "apertura": "2021-02-01"},
]

# codigo, nombre, area, cuota de recuperación, costo, popularidad
SERVICIOS = [
    ("CON-001", "Consulta de medicina general", "Consulta", 120, 70, 1.9),
    ("CON-002", "Consulta de pediatría", "Consulta", 180, 100, 0.9),
    ("CON-003", "Consulta de ginecología", "Consulta", 200, 110, 0.7),
    ("CON-004", "Consulta de nutrición", "Consulta", 150, 80, 0.8),
    ("CON-005", "Consulta de psicología", "Consulta", 220, 120, 0.6),
    ("CON-006", "Consulta de odontología", "Consulta", 160, 90, 0.9),
    ("LAB-001", "Biometría hemática", "Laboratorio", 140, 45, 1.5),
    ("LAB-002", "Química sanguínea", "Laboratorio", 220, 70, 1.3),
    ("LAB-003", "Perfil de lípidos", "Laboratorio", 260, 85, 1.0),
    ("LAB-004", "Hemoglobina glucosilada", "Laboratorio", 280, 95, 0.7),
    ("LAB-005", "Examen general de orina", "Laboratorio", 90, 25, 1.2),
    ("IMG-001", "Radiografía de tórax", "Imagenología", 350, 140, 0.6),
    ("IMG-002", "Ultrasonido abdominal", "Imagenología", 600, 230, 0.5),
    ("IMG-003", "Electrocardiograma", "Imagenología", 250, 80, 0.6),
    ("ENF-001", "Aplicación de inyección", "Enfermería", 50, 15, 1.1),
    ("ENF-002", "Curación de herida", "Enfermería", 120, 40, 0.7),
    ("ENF-003", "Toma de glucosa capilar", "Enfermería", 40, 12, 1.0),
    ("REH-001", "Sesión de fisioterapia", "Rehabilitación", 300, 140, 0.6),
    ("REH-002", "Terapia respiratoria", "Rehabilitación", 260, 110, 0.4),
    ("VAC-001", "Vacuna contra influenza", "Vacunación", 180, 120, 0.8),
]
AREAS = ["Consulta", "Laboratorio", "Imagenología", "Enfermería", "Rehabilitación", "Vacunación"]

PERSONAL = [
    # nombre, sede, puesto, ingreso
    ("Andrea Solís", "Centro", "Medicina general", "2016-05-13"),
    ("Bruno Castillo", "Centro", "Enfermería", "2019-01-18"),
    ("Carla Núñez", "Centro", "Laboratorio clínico", "2018-09-01"),
    ("Daniel Pineda", "Centro", "Medicina general", "2022-03-06"),
    ("Elena Robles", "Centro", "Coordinación médica", "2012-07-10"),
    ("Fernando Ibarra", "Centro", "Fisioterapia", "2023-02-13"),
    ("Gabriela Luna", "Centro", "Nutrición", "2021-06-21"),
    ("Héctor Vargas", "Norte", "Medicina general", "2018-10-08"),
    ("Isabel Cruz", "Norte", "Coordinación médica", "2018-08-15"),
    ("Jorge Medina", "Norte", "Enfermería", "2020-11-23"),
    ("Karen Salazar", "Norte", "Laboratorio clínico", "2022-01-10"),
    ("Leonardo Ríos", "Norte", "Psicología", "2021-04-05"),
    ("Mariana Paredes", "Norte", "Enfermería", "2024-08-19"),
    ("Nicolás Herrera", "Sur", "Medicina general", "2021-02-01"),
    ("Olivia Campos", "Sur", "Coordinación médica", "2021-02-01"),
    ("Pablo Aguilar", "Sur", "Odontología", "2022-09-12"),
    ("Regina Fuentes", "Sur", "Enfermería", "2023-05-29"),
    ("Sergio Mendoza", "Sur", "Medicina general", "2024-01-15"),
    ("Tania Guzmán", "Sur", "Nutrición", "2024-10-07"),
    ("Valeria Ochoa", "Sur", "Enfermería", "2025-01-06"),
]
# Atenciones de octubre y noviembre de 2025 por profesional
ATENCIONES_MES = [342, 410, 296, 275, 120, 188, 214, 318, 135, 392, 301, 166, 355, 290, 128, 205, 377, 262, 183, 349]
ATENCIONES_MES_LAB = [355, 398, 310, 281, 115, 192, 230, 300, 141, 405, 287, 172, 360, 305, 133, 198, 366, 275, 190, 352]

PAGOS = ["Particular", "Convenio universitario", "Convenio universitario", "Seguro médico"]

MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
         "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
MESES_CORTOS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

NOMBRES = ["Lucía", "Mateo", "Sofía", "Santiago", "Valentina", "Diego", "Camila", "Emiliano",
           "Renata", "Sebastián", "Ximena", "Leonardo", "Fernanda", "Andrés", "Daniela", "Rodrigo",
           "Paula", "Ricardo", "Natalia", "Joaquín", "Mónica", "Arturo", "Paola", "Gustavo",
           "Alejandra", "Raúl", "Verónica", "Óscar", "Itzel", "Manuel", "Brenda", "Tomás"]
APELLIDOS = ["Hernández", "García", "Martínez", "López", "González", "Pérez", "Rodríguez",
             "Sánchez", "Ramírez", "Flores", "Torres", "Vázquez", "Morales", "Reyes", "Jiménez",
             "Domínguez", "Castro", "Ortiz", "Rubio", "Silva", "Navarro", "Romero", "Cortés",
             "Estrada", "Mejía", "Lara", "Cabrera", "Ponce", "Zamora", "Bravo", "Acosta"]

# Farmacia: medicamento, unidad, existencia, mínimo, máximo, costo unitario, proveedor
MEDICAMENTOS = [
    ("Paracetamol 500 mg (caja 10 tab.)", "caja", 64, 80, 240, 18.5, "Distribuidora Médica del Bajío"),
    ("Ibuprofeno 400 mg (caja 10 tab.)", "caja", 120, 60, 200, 24.0, "Distribuidora Médica del Bajío"),
    ("Amoxicilina 500 mg (caja 12 cáp.)", "caja", 38, 40, 120, 46.0, "Farmacéutica Vital"),
    ("Metformina 850 mg (caja 30 tab.)", "caja", 150, 100, 300, 39.0, "Farmacéutica Vital"),
    ("Losartán 50 mg (caja 30 tab.)", "caja", 72, 90, 260, 52.0, "Farmacéutica Vital"),
    ("Omeprazol 20 mg (caja 14 cáp.)", "caja", 95, 50, 150, 33.0, "Insumos Salud Total"),
    ("Salbutamol inhalador 100 µg", "pieza", 14, 20, 60, 98.0, "Insumos Salud Total"),
    ("Loratadina 10 mg (caja 10 tab.)", "caja", 48, 30, 100, 21.0, "Distribuidora Médica del Bajío"),
    ("Insulina NPH 100 UI/mL (frasco)", "frasco", 22, 20, 60, 315.0, "Farmacéutica Vital"),
    ("Enalapril 10 mg (caja 30 tab.)", "caja", 41, 35, 120, 28.0, "Insumos Salud Total"),
    ("Sulfato ferroso 200 mg (caja 30 tab.)", "caja", 30, 40, 120, 26.0, "Distribuidora Médica del Bajío"),
    ("Diclofenaco 75 mg (ampolleta)", "ampolleta", 210, 100, 400, 12.5, "Insumos Salud Total"),
    ("Ceftriaxona 1 g (ampolleta)", "ampolleta", 26, 30, 90, 85.0, "Farmacéutica Vital"),
    ("Suero oral (sobre)", "sobre", 380, 200, 600, 6.5, "Distribuidora Médica del Bajío"),
    ("Ácido fólico 5 mg (caja 20 tab.)", "caja", 57, 45, 150, 15.0, "Insumos Salud Total"),
]

# Insumos para requisiciones: insumo, precio por caja/paquete
INSUMOS = [
    ("Guantes de nitrilo (caja 100)", 180), ("Jeringas 5 mL (caja 100)", 210), ("Gasas estériles (paquete 100)", 95),
    ("Cubrebocas tricapa (caja 50)", 85), ("Alcohol etílico 70 % (1 L)", 60), ("Torundas de algodón (bolsa 500)", 70),
    ("Tiras reactivas de glucosa (caja 50)", 420), ("Venda elástica 10 cm (paquete 12)", 150),
    ("Catéter IV 22G (caja 50)", 640), ("Equipo de venoclisis (caja 25)", 380),
    ("Solución salina 0.9 % 500 mL (caja 24)", 520), ("Tubos tapa morada (caja 100)", 290),
]
AREAS_SOLICITANTES = ["Urgencias", "Hospitalización", "Consulta externa", "Laboratorio"]

# Estudios para órdenes (módulo de gestión): estudio, cuota, preparación
ESTUDIOS = [
    ("Biometría hemática", 140, "No requiere ayuno."),
    ("Química sanguínea", 220, "Ayuno de 8 a 12 horas."),
    ("Perfil de lípidos", 260, "Ayuno de 12 horas; cena ligera la noche anterior."),
    ("Hemoglobina glucosilada", 280, "No requiere ayuno."),
    ("Glucosa en ayuno", 70, "Ayuno de 8 horas."),
    ("Examen general de orina", 90, "Primera orina de la mañana en frasco estéril."),
    ("Urocultivo", 250, "Aseo previo y primera orina de la mañana en frasco estéril."),
    ("Radiografía de tórax", 350, "Retirar objetos metálicos del tórax."),
    ("Ultrasonido abdominal", 600, "Ayuno de 6 horas."),
    ("Electrocardiograma", 250, "Evitar cremas o aceites en el tórax."),
]
PACIENTES_ORDEN = ["Lucía Hernández", "Mateo García", "Sofía Martínez", "Santiago López", "Valentina Torres",
                   "Diego Ramírez", "Camila Flores", "Emiliano Reyes", "Renata Jiménez", "Sebastián Castro"]


def _f(d):
    return d.strftime("%Y-%m-%d")


def _sin_acentos(s):
    for x, y in (("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u"), ("ñ", "n"), ("ü", "u")):
        s = s.replace(x, y)
    return s


def generar():
    rng = random.Random(SEMILLA)
    servicios = [{"codigo": c, "nombre": n, "area": a, "cuota": p, "costo": co, "pop": pop} for c, n, a, p, co, pop in SERVICIOS]

    # ---------- Atenciones 2025: un registro = atenciones de un servicio en un día y sede ----------
    # La sede líder cambia por trimestre: Norte abrió un área nueva en el verano y Sur, pediatría en otoño.
    factor_sede = {
        "Centro": [1.25, 1.18, 0.90, 1.00],
        "Norte": [0.96, 0.98, 1.35, 0.95],
        "Sur": [0.80, 0.86, 0.92, 1.24],
    }
    pers_por_sede = {}
    for nombre, sede, puesto, _ in PERSONAL:
        if puesto != "Coordinación médica":
            pers_por_sede.setdefault(sede, []).append(nombre)
    atenciones = []
    pesos = [s["pop"] for s in servicios]
    for m in range(1, 13):
        q = (m - 1) // 3
        dias_mes = (dt.date(ANIO + (m == 12), (m % 12) + 1, 1) - dt.date(ANIO, m, 1)).days
        for sede in ("Centro", "Norte", "Sur"):
            for _ in range(20):
                dia = rng.randint(1, dias_mes)
                s = rng.choices(servicios, weights=pesos)[0]
                temporada = 1.0
                if s["area"] == "Vacunación":
                    temporada = 2.2 if m in (10, 11, 12) else (1.2 if m in (1, 2) else 0.35)
                elif s["codigo"] in ("CON-001", "REH-002"):
                    temporada = 1.3 if m in (11, 12, 1, 2) else 0.9
                elif s["codigo"] == "CON-004":
                    temporada = 1.4 if m in (1, 2, 3) else 0.9
                base = rng.uniform(6, 22)
                cantidad = max(2, round(base * temporada * factor_sede[sede][q]))
                atenciones.append({
                    "fecha": _f(dt.date(ANIO, m, dia)), "sede": sede, "codigo": s["codigo"], "servicio": s["nombre"],
                    "area": s["area"], "atenciones": cantidad, "cuota": s["cuota"],
                    "profesional": rng.choice(pers_por_sede[sede]), "pago": rng.choice(PAGOS),
                    "espera": rng.randint(8, 55),
                })
    atenciones.sort(key=lambda v: (v["fecha"], v["sede"], v["codigo"]))
    for i, v in enumerate(atenciones, 1):
        v["folio"] = f"A-{i:04d}"
        v["ingresos"] = v["atenciones"] * v["cuota"]

    # ---------- Semana (reporte semanal de atenciones) ----------
    serv_semana = ["CON-001", "CON-002", "CON-004", "LAB-001", "LAB-002", "ENF-001", "ENF-003", "REH-001"]
    semana = []
    for cod in serv_semana:
        s = next(x for x in servicios if x["codigo"] == cod)
        base = 8 + s["pop"] * 12
        cant = [max(2, round(base * f * rng.uniform(0.85, 1.15))) for f in (1.2, 1.1, 1.05, 1.0, 1.1, 0.7, 0.35)]
        semana.append({"codigo": cod, "servicio": s["nombre"], "cuota": s["cuota"], "cantidades": cant})
    semana_sede = {}
    for sede, f in (("Centro", 1.0), ("Norte", 0.9), ("Sur", 0.72)):
        semana_sede[sede] = [{"servicio": s["servicio"], "cuota": s["cuota"],
                              "cantidades": [max(1, round(c * f * rng.uniform(0.9, 1.1))) for c in s["cantidades"]]} for s in semana]

    # ---------- Somatometría de un turno (fórmulas básicas) ----------
    def somatometria(n, base_exp, semilla):
        r = random.Random(semilla)
        out, usados = [], set()
        horas = ["07:10", "07:25", "07:40", "07:55", "08:15", "08:30", "08:50", "09:10", "09:30", "09:55",
                 "10:20", "10:45", "11:10", "11:35", "12:00", "12:30", "13:00", "13:20"]
        for i in range(n):
            while True:
                nom = r.choice(NOMBRES) + " " + r.choice(APELLIDOS)
                if nom not in usados:
                    usados.add(nom)
                    break
            talla = round(r.uniform(1.50, 1.84), 2)
            imc = r.choice([r.uniform(19, 24.9), r.uniform(25, 29.9), r.uniform(30, 36)])
            peso = round(imc * talla * talla, 1)
            out.append({"expediente": f"EXP-{base_exp + i}", "hora": horas[i], "paciente": nom,
                        "edad": r.randint(19, 74), "peso": peso, "talla": talla})
        return out
    turno = somatometria(14, 4101, 77)
    turno_lab = somatometria(16, 4201, 78)

    # ---------- Glucosa en ayuno (fórmulas intermedias): incluye casos frontera 100 y 126 ----------
    def glucosas(valores, base_exp, semilla):
        r = random.Random(semilla)
        out, usados = [], set()
        for i, g in enumerate(valores):
            while True:
                nom = r.choice(NOMBRES) + " " + r.choice(APELLIDOS)
                if nom not in usados:
                    usados.add(nom)
                    break
            out.append({"expediente": f"EXP-{base_exp + i}", "paciente": nom, "sede": ["Centro", "Norte", "Sur"][r.randint(0, 2)],
                        "edad": r.randint(24, 78), "glucosa": g})
        return out
    glucosa = glucosas([92, 118, 100, 87, 134, 126, 99, 151, 78, 110, 205, 95, 125, 101, 88, 143, 97, 112, 168, 84], 5101, 81)
    glucosa_lab = glucosas([104, 89, 126, 141, 99, 100, 176, 83, 119, 93, 125, 132, 90, 108, 215, 96, 101, 87, 154, 113], 5201, 82)

    # ---------- Padrón de pacientes con problemas (organizar datos) ----------
    pacientes = []
    usados = set()
    for i in range(32):
        while True:
            n, a = rng.choice(NOMBRES), rng.choice(APELLIDOS)
            if (n, a) not in usados:
                usados.add((n, a))
                break
        correo = _sin_acentos(f"{n.lower()}.{a.lower()}@correo.mx")
        pacientes.append({
            "id": f"EXP-{3101 + i}", "nombre": f"{n} {a}", "telefono": f"449{rng.randint(1000000, 9999999)}",
            "correo": correo, "sede": rng.choice(["Centro", "Norte", "Sur"]),
            "registro": _f(dt.date(2023, 1, 1) + dt.timedelta(days=rng.randint(0, 900))), "consultas": rng.randint(1, 18),
        })
    pacientes_sucios = list(pacientes)
    for k, idx in enumerate([3, 9, 15, 22, 27]):
        pacientes_sucios.insert(idx + 6 + k * 2, dict(pacientes[idx]))

    # ---------- Requisiciones de insumos (tablas e integrador) ----------
    requisiciones = []
    fecha_corte = dt.date(2025, 11, 15)
    for i in range(40):
        f = dt.date(2025, 10, 1) + dt.timedelta(days=rng.randint(0, 44))
        ins, precio = rng.choice(INSUMOS)
        entrega = f + dt.timedelta(days=rng.randint(2, 8))
        if entrega <= fecha_corte - dt.timedelta(days=3):
            estado = "Surtida" if rng.random() < 0.82 else "Pendiente"
        else:
            estado = "Pendiente"
        requisiciones.append({"folio": 0, "fecha": _f(f), "area": rng.choice(AREAS_SOLICITANTES), "sede": rng.choice(["Centro", "Norte", "Sur"]),
                              "insumo": ins, "cantidad": rng.choice([2, 3, 4, 5, 6, 8, 10, 12]), "precio": precio,
                              "entrega": _f(entrega), "estado": estado})
    requisiciones.sort(key=lambda x: x["fecha"])
    for i, x in enumerate(requisiciones):
        x["folio"] = 3001 + i

    # ---------- Órdenes de estudios (gestión de información) ----------
    pacientes_orden = []
    for i, n in enumerate(PACIENTES_ORDEN):
        nom, ape = n.split()
        pacientes_orden.append({"paciente": n, "telefono": f"449{5100000 + 37301 * i}", "correo": _sin_acentos(f"{nom[0].lower()}.{ape.lower()}@correo.mx"),
                                "nacimiento": _f(dt.date(1950 + (i * 7) % 50, 1 + (i * 5) % 12, 3 + (i * 11) % 25))})
    edades = {}
    ordenes = []
    for i in range(40):
        f = dt.date(2025, 10, 1) + dt.timedelta(days=rng.randint(0, 40))
        p = rng.choice(PACIENTES_ORDEN)
        if p not in edades:
            edades[p] = rng.randint(18, 82)
        est = rng.choice(ESTUDIOS)
        ordenes.append({"folio": 0, "fecha": _f(f), "paciente": p, "edad": edades[p], "estudio": est[0], "cuota": est[1],
                        "sede": rng.choice(["Centro", "Norte", "Sur"]), "cita": _f(f + dt.timedelta(days=rng.randint(1, 6))),
                        "hora": rng.choice(["07:00", "07:30", "08:00", "08:30", "09:00", "10:00"])})
    ordenes.sort(key=lambda x: x["fecha"])
    for i, x in enumerate(ordenes):
        x["folio"] = 5001 + i

    # ---------- Programa de enfermedades crónicas (dashboards) ----------
    # Control: diabetes con HbA1c < 7 %; hipertensión con PA < 140/90 mmHg.
    control_base = {("Centro", "Diabetes tipo 2"): 0.66, ("Norte", "Diabetes tipo 2"): 0.58, ("Sur", "Diabetes tipo 2"): 0.49,
                    ("Centro", "Hipertensión"): 0.72, ("Norte", "Hipertensión"): 0.77, ("Sur", "Hipertensión"): 0.61}
    cronicos = []
    for m in range(1, 13):
        dias_mes = (dt.date(ANIO + (m == 12), (m % 12) + 1, 1) - dt.date(ANIO, m, 1)).days
        for sede in ("Centro", "Norte", "Sur"):
            n_consultas = {"Centro": 12, "Norte": 10, "Sur": 8}[sede] + (2 if m in (1, 2, 11) else 0)
            for _ in range(n_consultas):
                prog = "Diabetes tipo 2" if rng.random() < 0.52 else "Hipertensión"
                p_ctrl = min(0.92, control_base[(sede, prog)] + (m - 6) * 0.012)
                ctrl = rng.random() < p_ctrl
                if prog == "Diabetes tipo 2":
                    valor = round(rng.uniform(5.6, 6.9), 1) if ctrl else round(rng.uniform(7.0, 10.8), 1)
                    pas, pad = None, None
                else:
                    valor = None
                    pas = rng.randint(110, 139) if ctrl else rng.randint(140, 178)
                    pad = rng.randint(68, 89) if ctrl else rng.randint(85, 104)
                    if not ctrl and pas < 140:
                        pas = 141
                cronicos.append({"fecha": _f(dt.date(ANIO, m, rng.randint(1, dias_mes))), "sede": sede, "programa": prog,
                                 "sexo": rng.choice(["F", "M"]), "edad": rng.randint(35, 84), "hba1c": valor, "pas": pas, "pad": pad,
                                 "controlado": "Sí" if ctrl else "No", "espera": rng.randint(5, 60) + (8 if sede == "Sur" else 0)})
    cronicos.sort(key=lambda x: (x["fecha"], x["sede"]))
    for i, x in enumerate(cronicos):
        x["folio"] = f"C-{i + 1:04d}"
        x["expediente"] = f"EXP-{6001 + rng.randint(0, 179)}"

    datos = {
        "anio": ANIO,
        "sedes": SEDES,
        "servicios": [{k: s[k] for k in ("codigo", "nombre", "area", "cuota", "costo")} for s in servicios],
        "areas": AREAS,
        "personal": [{"nombre": n, "sede": s, "puesto": pu, "ingreso": ing, "atencionesMes": am, "atencionesMesLab": al}
                     for (n, s, pu, ing), am, al in zip(PERSONAL, ATENCIONES_MES, ATENCIONES_MES_LAB)],
        "atenciones": atenciones,
        "semana": semana,
        "semanaSede": semana_sede,
        "turno": turno,
        "turnoLab": turno_lab,
        "glucosa": glucosa,
        "glucosaLab": glucosa_lab,
        "pacientes": pacientes,
        "pacientesSucios": pacientes_sucios,
        "requisiciones": requisiciones,
        "fechaCorte": _f(fecha_corte),
        "medicamentos": [{"medicamento": a, "unidad": b, "existencia": c, "minimo": d, "maximo": e, "costo": f, "proveedor": g}
                         for a, b, c, d, e, f, g in MEDICAMENTOS],
        "estudios": [{"estudio": e, "cuota": c, "preparacion": p} for e, c, p in ESTUDIOS],
        "pacientesOrden": pacientes_orden,
        "ordenes": ordenes,
        "cronicos": cronicos,
        "meses": MESES,
        "mesesCortos": MESES_CORTOS,
        "dias": DIAS,
    }
    return datos


if __name__ == "__main__":
    d = generar()
    print(len(d["atenciones"]), "registros de atenciones;", sum(a["atenciones"] for a in d["atenciones"]), "atenciones")
    tot = {}
    for v in d["atenciones"]:
        q = (int(v["fecha"][5:7]) - 1) // 3 + 1
        tot.setdefault(q, {}).setdefault(v["sede"], 0)
        tot[q][v["sede"]] += v["atenciones"]
    for q in sorted(tot):
        print("T%d" % q, tot[q], "líder:", max(tot[q], key=tot[q].get))
    serv = {}
    for v in d["atenciones"]:
        serv[v["servicio"]] = serv.get(v["servicio"], 0) + v["atenciones"]
    print(sorted(serv.items(), key=lambda x: -x[1])[:4])
    vac = [0] * 12
    for v in d["atenciones"]:
        if v["area"] == "Vacunación":
            vac[int(v["fecha"][5:7]) - 1] += v["atenciones"]
    print("vacunación por mes", vac)
    c = {}
    for x in d["cronicos"]:
        k = (x["sede"], x["programa"])
        c.setdefault(k, [0, 0])
        c[k][0] += 1
        c[k][1] += x["controlado"] == "Sí"
    for k, (n, s) in sorted(c.items()):
        print(k, n, s, round(s / n * 100, 1), "%")
    print(len(d["cronicos"]), "consultas de crónicos;", sum(1 for r in d["requisiciones"] if r["estado"] == "Pendiente"), "requisiciones pendientes")
