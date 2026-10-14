import os
import json
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

from database import get_connection, init_db, DB_PATH
import analytics
import network_manager

# Inicializar Base de Datos SQLite al arrancar
init_db()

app = FastAPI(
    title="SEPAM - Backend de Mando Operativo",
    description="API REST Ligera de Campo con persistencia SQLite (WAL) y analítica columnar con DuckDB",
    version="1.0.0"
)

# Habilitar CORS total para permitir conexiones desde localhost, red LAN y Oracle Cloud
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Modelos Pydantic para validación
class EventoUpdate(BaseModel):
    nombre: str
    tipo: str
    ciudad: str
    lugar: str
    fecha: str
    horario: str
    riesgo: str
    aforo_estimado: int

class AtencionCreate(BaseModel):
    id: Optional[str] = None
    codigo: str
    timestamp: str
    fecha: str
    sector_id: Optional[str] = ""
    sector_nombre: Optional[str] = ""
    paramedico_id: Optional[str] = ""
    paramedico_nombre: Optional[str] = ""
    triage_color: str # ROJO, AMARILLO, VERDE, NEGRO
    paciente_nombre: Optional[str] = "No identificado"
    paciente_edad: Optional[int] = 0
    paciente_genero: Optional[str] = "DESCONOCIDO"
    motivo: Optional[str] = "Sin motivo registrado"
    derivacion: Optional[str] = "ALTA"
    ambulancia_codigo: Optional[str] = ""
    hospital: Optional[str] = ""
    detalles: Optional[Dict[str, Any]] = None

class LogCreate(BaseModel):
    id: Optional[str] = None
    timestamp: str
    fecha: str
    usuario: str
    nombre_usuario: str
    rol: str
    accion: str
    detalles: str
    dispositivo: Optional[str] = "Web"

@app.get("/")
def raiz():
    dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dist", "sepam-mando-operativo", "browser")
    if os.path.exists(os.path.join(dist_path, "index.html")):
        return RedirectResponse(url="/sepam/")
    return {
        "sistema": "SEPAM - Mando Operativo",
        "motor_transaccional": "SQLite 3 (WAL mode)",
        "motor_analitico": "DuckDB 1.5",
        "estado": "OPERACIONAL"
    }

@app.get("/api/estado")
def estado():
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM atenciones;")
    total_atenciones = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM logs_auditoria;")
    total_logs = c.fetchone()[0]
    c.execute("SELECT nombre FROM evento LIMIT 1;")
    evento_row = c.fetchone()
    evento_nombre = evento_row[0] if evento_row else "Sin evento"
    conn.close()

    return {
        "status": "ONLINE",
        "evento_activo": evento_nombre,
        "total_atenciones": total_atenciones,
        "total_logs": total_logs,
        "archivo_db": DB_PATH
    }

@app.get("/api/evento")
def obtener_evento():
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM evento LIMIT 1;")
    row = c.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="No hay evento configurado")
    return dict(row)

@app.post("/api/evento")
def actualizar_evento(data: EventoUpdate):
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
        UPDATE evento SET 
            nombre = ?, tipo = ?, ciudad = ?, lugar = ?, 
            fecha = ?, horario = ?, riesgo = ?, aforo_estimado = ?
        WHERE id = 'evt-001';
    """, (data.nombre, data.tipo, data.ciudad, data.lugar, data.fecha, data.horario, data.riesgo, data.aforo_estimado))
    conn.commit()
    conn.close()
    return {"mensaje": "Evento actualizado exitosamente"}

@app.get("/api/atenciones")
def listar_atenciones():
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM atenciones ORDER BY timestamp DESC;")
    rows = c.fetchall()
    conn.close()

    resultado = []
    for r in rows:
        d = dict(r)
        if d.get("detalles_json"):
            try:
                d["detalles"] = json.loads(d["detalles_json"])
            except Exception:
                d["detalles"] = {}
        resultado.append(d)
    return resultado

@app.post("/api/atenciones")
def guardar_atencion(item: AtencionCreate):
    conn = get_connection()
    c = conn.cursor()
    
    atencion_id = item.id or f"at-{int(os.times().elapsed * 1000)}"
    detalles_str = json.dumps(item.detalles or {})

    c.execute("""
        INSERT OR REPLACE INTO atenciones (
            id, codigo, timestamp, fecha, sector_id, sector_nombre,
            paramedico_id, paramedico_nombre, triage_color, paciente_nombre,
            paciente_edad, paciente_genero, motivo, derivacion, ambulancia_codigo,
            hospital, detalles_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        atencion_id, item.codigo, item.timestamp, item.fecha, item.sector_id, item.sector_nombre,
        item.paramedico_id, item.paramedico_nombre, item.triage_color, item.paciente_nombre,
        item.paciente_edad, item.paciente_genero, item.motivo, item.derivacion, item.ambulancia_codigo,
        item.hospital, detalles_str
    ))

    # Registrar automáticamente en bitácora de auditoría
    log_id = f"log-{int(os.times().elapsed * 1000)}"
    c.execute("""
        INSERT INTO logs_auditoria (id, timestamp, fecha, usuario, nombre_usuario, rol, accion, detalles, dispositivo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        log_id, item.timestamp, item.fecha, item.paramedico_nombre or "sistema",
        item.paramedico_nombre or "Paramédico", "PARAMEDICO_CAMPO", "NUEVA_ATENCION",
        f"Atención {item.codigo} registrada. Triage: {item.triage_color}. Paciente: {item.paciente_nombre}",
        "App Móvil / Web"
    ))

    conn.commit()
    conn.close()
    return {"mensaje": "Atención guardada exitosamente", "id": atencion_id}

@app.get("/api/logs")
def listar_logs():
    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT * FROM logs_auditoria ORDER BY timestamp DESC;")
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/logs")
def registrar_log(item: LogCreate):
    conn = get_connection()
    c = conn.cursor()
    log_id = item.id or f"log-{int(os.times().elapsed * 1000)}"
    c.execute("""
        INSERT INTO logs_auditoria (id, timestamp, fecha, usuario, nombre_usuario, rol, accion, detalles, dispositivo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        log_id, item.timestamp, item.fecha, item.usuario, item.nombre_usuario,
        item.rol, item.accion, item.detalles, item.dispositivo or "Web"
    ))
    conn.commit()
    conn.close()
    return {"mensaje": "Log registrado exitosamente", "id": log_id}

# --- ENDPOINTS ANALÍTICOS POTENCIADOS CON DUCKDB ---

@app.get("/api/analitica/resumen")
def analitica_resumen():
    """Ejecuta consultas columnares con DuckDB sobre sepam.db"""
    try:
        return analytics.obtener_resumen_operativo()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en motor DuckDB: {str(e)}")

@app.get("/api/analitica/curva-horaria")
def analitica_curva():
    try:
        res = analytics.obtener_resumen_operativo()
        return res.get("curva_horaria", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analitica/sectores-calor")
def analitica_sectores():
    try:
        res = analytics.obtener_resumen_operativo()
        return res.get("sectores", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analitica/triage-distribucion")
def analitica_triage():
    try:
        res = analytics.obtener_resumen_operativo()
        return res.get("triage", {})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reportes/excel")
def descargar_reporte_excel():
    """Genera al vuelo un archivo Excel profesional con DuckDB y lo descarga"""
    temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "exports")
    os.makedirs(temp_dir, exist_ok=True)
    archivo = os.path.join(temp_dir, "Reporte_Oficial_SEPAM_Concierto.xlsx")
    analytics.generar_reporte_excel(archivo)
    return FileResponse(
        path=archivo,
        filename="Reporte_Oficial_SEPAM_Concierto.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )

@app.get("/api/reportes/csv")
def descargar_reporte_csv():
    temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "exports")
    os.makedirs(temp_dir, exist_ok=True)
    archivo = os.path.join(temp_dir, "Atenciones_Triage_SEPAM.csv")
    analytics.generar_reporte_csv(archivo)
    return FileResponse(
        path=archivo,
        filename="Atenciones_Triage_SEPAM.csv",
        media_type="text/csv"
    )

# --- ENDPOINTS DE GESTIÓN DE RED Y QR PLUG & PLAY ---

@app.get("/api/red/diagnostico")
def obtener_diagnostico_red():
    """Analiza automáticamente el estado de red, Hotspot, Ethernet, Wi-Fi y genera QRs"""
    try:
        return network_manager.diagnostico_red_completo()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al diagnosticar red: {str(e)}")

@app.get("/api/red/qr")
def obtener_qr(tipo: str = "local"):
    """Devuelve código QR en Base64 para acceso rápido móvil"""
    diag = network_manager.diagnostico_red_completo()
    if tipo == "nube":
        return {"url": diag["url_nube_brigadistas"], "qr_base64": diag["qr_nube_base64"], "tipo": "nube"}
    else:
        return {"url": diag["url_local_brigadistas"], "qr_base64": diag["qr_local_base64"], "tipo": "local"}

# --- SERVIR APLICACIÓN WEB ANGULAR COMPILADA ---
dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dist", "sepam-mando-operativo", "browser")
if os.path.exists(dist_path):
    app.mount("/sepam", StaticFiles(directory=dist_path, html=True), name="sepam")

if __name__ == "__main__":
    print("Iniciando SEPAM Backend con SQLite WAL + DuckDB + Network Manager en puerto 8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
