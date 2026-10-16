import os
import json
import time
import uuid
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
from redis_service import redis_service
import telegram_service

# Inicializar Base de Datos SQLite al arrancar
init_db()

app = FastAPI(
    title="SEPAM - Backend de Mando Operativo",
    description="Arquitectura Políglota de Campo: SQLite 3 (WAL) + DuckDB 1.5 OLAP + Redis 7 NoSQL In-Memory",
    version="2.0.0"
)

@app.on_event("startup")
def startup_event():
    telegram_service.telegram_bot.iniciar()

# Habilitar CORS total para permitir conexiones desde Vercel HTTPS, red LAN y localhost
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
    triage_color: Optional[str] = "VERDE" # ROJO, AMARILLO, VERDE, NEGRO
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

class ClaveVerificar(BaseModel):
    key: str

class ClaveGenerar(BaseModel):
    solicitado_por: Optional[str] = "Web SuperAdmin"
    duracion_horas: Optional[int] = 2

class TelegramConfig(BaseModel):
    token: str

class ConfigUiUpdate(BaseModel):
    config: Dict[str, Any]
    usuario: Optional[str] = "Super Usuario PMU"

@app.get("/")
def raiz():
    dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dist", "sepam-mando-operativo", "browser")
    if os.path.exists(os.path.join(dist_path, "index.html")):
        return RedirectResponse(url="/sepam/")
    return {
        "sistema": "SEPAM - Mando Operativo",
        "arquitectura": "Persistencia Políglota Tri-Motor",
        "motores": {
            "oltp_transaccional": "SQLite 3 (WAL mode)",
            "olap_analitico": "DuckDB 1.5 (Vectorizado)",
            "nosql_tiempo_real": "Redis 7 (In-Memory Pub/Sub & Cache)"
        },
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

    redis_info = redis_service.get_info()

    return {
        "status": "ONLINE",
        "evento_activo": evento_nombre,
        "total_atenciones": total_atenciones,
        "total_logs": total_logs,
        "archivo_db": DB_PATH,
        "motores": {
            "oltp": "SQLite 3 (WAL)",
            "olap": "DuckDB 1.5",
            "nosql": f"Redis 7 ({redis_info.get('estado', 'OFFLINE')})"
        },
        "redis": redis_info
    }

# --- ENDPOINTS REDIS NOSQL (ALERTAS Y ESTADO) ---

@app.get("/api/redis/estado")
def estado_redis():
    """Retorna telemetria y estado del motor NoSQL Redis"""
    return redis_service.get_info()

@app.get("/api/alertas/recientes")
def alertas_recientes(limite: int = 10):
    """Devuelve las alertas criticas y de ambulancia en memoria desde Redis"""
    return redis_service.obtener_alertas_recientes(limite=limite)

@app.post("/api/alertas/test")
def disparar_alerta_prueba():
    """Dispara una alerta de prueba en el canal de Redis para simulacros"""
    alerta_prueba = {
        "id": f"sim-{uuid.uuid4().hex[:8]}",
        "codigo": "SIM-01",
        "triage_color": "ROJO",
        "sector_nombre": "ZONA C - ESCENARIO Y FOSO",
        "paciente_nombre": "PACIENTE DE SIMULACRO",
        "motivo": "Simulacro de paro / asfixia por aglomeración",
        "derivacion": "AMBULANCIA",
        "hora": "EN VIVO",
        "tipo_alerta": "CRITICA"
    }
    enviado = redis_service.publicar_alerta(alerta_prueba)
    return {"mensaje": "Alerta de prueba emitida en Redis", "exito": enviado, "alerta": alerta_prueba}

# --- ENDPOINTS SEGURIDAD Y CONTROL DE ACCESO (TELEGRAM 2 HORAS) ---

@app.post("/api/auth/verificar-key")
def verificar_key(item: ClaveVerificar):
    """
    Verifica una clave de acceso temporal de 2 horas (Telegram / Master).
    """
    valido, ttl, datos, msj = telegram_service.verificar_clave(item.key)
    if not valido:
        return {
            "valido": False,
            "mensaje": msj,
            "expira_en_segundos": 0
        }
    return {
        "valido": True,
        "mensaje": msj,
        "expira_en_segundos": ttl,
        "expira_at_timestamp": datos.get("expira_at_timestamp") if datos else int((time.time() + ttl) * 1000),
        "hora_expira": datos.get("hora_expira", "2 horas"),
        "clave": item.key.strip(),
        "datos": datos
    }

@app.post("/api/auth/generar-key")
def generar_key(item: Optional[ClaveGenerar] = None):
    """
    Genera una nueva clave de acceso de 2 horas (formato: mayúsculas, números, % $ !)
    """
    solicitado_por = item.solicitado_por if item else "Web SuperAdmin"
    duracion = item.duracion_horas if item else 2
    
    nueva_clave = telegram_service.generar_codigo_seguro()
    info = telegram_service.registrar_clave_en_persistencia(
        clave=nueva_clave,
        generada_por=solicitado_por,
        duracion_horas=duracion
    )
    return {
        "mensaje": "Clave generada exitosamente",
        "clave": nueva_clave,
        "expira_en_segundos": info["duracion_segundos"],
        "expira_at_timestamp": info["expira_at_timestamp"],
        "hora_expira": info["hora_expira"],
        "fecha_expira": info["fecha_expira"],
        "enlace_directo": f"{telegram_service.DASHBOARD_URL}/?key={nueva_clave}"
    }

@app.get("/api/auth/claves-activas")
def listar_claves():
    """
    Retorna la lista de claves activas y tiempo restante.
    """
    return telegram_service.listar_claves_vigentes()

@app.get("/api/auth/telegram-info")
def info_telegram():
    """
    Estado de integración del bot de Telegram.
    """
    bot = telegram_service.telegram_bot
    return {
        "activo": bot.activo,
        "tiene_token": bool(bot.token and not bot.token.endswith("example")),
        "token_preview": f"{bot.token[:8]}..." if bot.token and len(bot.token) > 10 else "No configurado",
        "dashboard_url": telegram_service.DASHBOARD_URL,
        "duracion_default": "2 Horas (7200s)"
    }

@app.post("/api/auth/config-telegram")
def configurar_telegram(item: TelegramConfig):
    """
    Configura o actualiza el token del Bot de Telegram en caliente.
    """
    telegram_service.telegram_bot.configurar_token(item.token)
    return {
        "mensaje": "Token de Telegram configurado exitosamente",
        "activo": telegram_service.telegram_bot.activo
    }

# --- GESTIÓN DE EVENTOS ---

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
    redis_service.invalidar_cache()
    return {"mensaje": "Evento actualizado exitosamente"}

# --- GESTIÓN DE CONFIGURACIÓN VISUAL Y LAYOUT POWER BI ---

@app.get("/api/config-ui")
def obtener_config_ui():
    """Obtiene la configuración visual y layout del Dashboard desde Redis o SQLite"""
    if redis_service.is_online():
        try:
            cached = redis_service.client.get("sepam:config_ui")
            if cached:
                return json.loads(cached)
        except Exception:
            pass

    conn = get_connection()
    c = conn.cursor()
    c.execute("SELECT config_json FROM configuracion_ui WHERE id = 'default' LIMIT 1;")
    row = c.fetchone()
    conn.close()
    if row:
        return json.loads(row[0])
    return None

@app.post("/api/config-ui")
def guardar_config_ui(item: ConfigUiUpdate):
    """Guarda el diseño y layout personalizado del Puesto de Mando para sincronizarlo con todos los monitores"""
    config_str = json.dumps(item.config)
    ahora = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    conn = get_connection()
    c = conn.cursor()
    c.execute("""
        INSERT OR REPLACE INTO configuracion_ui (id, config_json, actualizado_en, actualizado_por)
        VALUES ('default', ?, ?, ?);
    """, (config_str, ahora, item.usuario or "Super Usuario PMU"))
    conn.commit()
    conn.close()

    if redis_service.is_online():
        try:
            redis_service.client.set("sepam:config_ui", config_str)
        except Exception:
            pass

    return {"mensaje": "Diseño del Puesto de Mando sincronizado en servidor", "timestamp": ahora}

# --- GESTIÓN TRANSACCIONAL DE ATENCIONES ---

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
    
    atencion_id = item.id or f"at-{int(time.time() * 1000)}"
    detalles_str = json.dumps(item.detalles or {})

    # 1. Guardar de forma transaccional en SQLite (WAL)
    c.execute("""
        INSERT OR REPLACE INTO atenciones (
            id, codigo, timestamp, fecha, sector_id, sector_nombre,
            paramedico_id, paramedico_nombre, triage_color, paciente_nombre,
            paciente_edad, paciente_genero, motivo, derivacion, ambulancia_codigo,
            hospital, detalles_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        atencion_id, item.codigo, item.timestamp, item.fecha, item.sector_id, item.sector_nombre,
        item.paramedico_id, item.paramedico_nombre, (item.triage_color or "VERDE"), item.paciente_nombre,
        item.paciente_edad, item.paciente_genero, item.motivo, item.derivacion, item.ambulancia_codigo,
        item.hospital, detalles_str
    ))

    # 2. Registrar en bitácora de auditoría
    log_id = f"log-{int(time.time() * 1000)}-{uuid.uuid4().hex[:4]}"
    c.execute("""
        INSERT INTO logs_auditoria (id, timestamp, fecha, usuario, nombre_usuario, rol, accion, detalles, dispositivo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        log_id, item.timestamp, item.fecha, item.paramedico_nombre or "sistema",
        item.paramedico_nombre or "Paramédico", "PARAMEDICO_CAMPO", "NUEVA_ATENCION",
        f"Atención {item.codigo} registrada. Triage: {item.triage_color or 'VERDE'}. Paciente: {item.paciente_nombre}",
        "App Móvil / Web"
    ))

    conn.commit()
    conn.close()

    # 3. Invalidar la caché de métricas en Redis
    redis_service.invalidar_cache()

    # 4. Publicar Alerta NoSQL en tiempo real vía Redis si es ROJO, AMARILLO o Traslado de Ambulancia
    color_seguro = item.triage_color or "VERDE"
    if color_seguro in ["ROJO", "AMARILLO"] or item.derivacion == "AMBULANCIA":
        alerta = {
            "id": atencion_id,
            "codigo": item.codigo,
            "triage_color": color_seguro,
            "sector_nombre": item.sector_nombre or "General",
            "paciente_nombre": item.paciente_nombre or "No identificado",
            "motivo": item.motivo or "Sin motivo",
            "derivacion": item.derivacion or "ALTA",
            "hora": item.timestamp,
            "tipo_alerta": "CRITICA" if color_seguro == "ROJO" else "URGENTE"
        }
        redis_service.publicar_alerta(alerta)

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
    log_id = item.id or f"log-{int(time.time() * 1000)}-{uuid.uuid4().hex[:4]}"
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

# --- ENDPOINTS ANALÍTICOS POTENCIADOS CON DUCKDB Y REDIS CACHE ---

@app.get("/api/analitica/resumen")
def analitica_resumen():
    """Ejecuta consultas columnares con DuckDB aceleradas con caché en memoria Redis"""
    # 1. Intentar responder desde Redis Cache (<1ms)
    cached = redis_service.get_cache_metricas()
    if cached:
        cached["fuente"] = "REDIS_CACHE"
        return cached

    # 2. Si no hay cache, computar con motor analítico columnar DuckDB 1.5
    try:
        resultado = analytics.obtener_resumen_operativo()
        resultado["fuente"] = "DUCKDB_COMPUTED"
        # Guardar en Redis cache por 5 segundos
        redis_service.set_cache_metricas(resultado, ttl_segundos=5)
        return resultado
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

# --- ENDPOINTS DE GESTIÓN DE RED Y QR ---

@app.get("/api/red/diagnostico")
def obtener_diagnostico_red():
    try:
        return network_manager.diagnostico_red_completo()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al diagnosticar red: {str(e)}")

@app.get("/api/red/qr")
def obtener_qr(tipo: str = "local"):
    diag = network_manager.diagnostico_red_completo()
    if tipo == "nube":
        return {"url": diag["url_nube_brigadistas"], "qr_base64": diag["qr_nube_base64"], "tipo": "nube"}
    else:
        return {"url": diag["url_local_brigadistas"], "qr_base64": diag["qr_local_base64"], "tipo": "local"}

# --- SERVIR APLICACIÓN WEB ANGULAR COMPILADA SI EXISTE LOCALMENTE ---
dist_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "dist", "sepam-mando-operativo", "browser")
if os.path.exists(dist_path):
    app.mount("/sepam", StaticFiles(directory=dist_path, html=True), name="sepam")

if __name__ == "__main__":
    print("Iniciando SEPAM Backend: SQLite WAL + DuckDB 1.5 + Redis 7 en puerto 8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
