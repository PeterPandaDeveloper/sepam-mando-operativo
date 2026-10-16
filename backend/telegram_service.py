import os
import json
import time
import random
import string
import uuid
import html
import threading
import urllib.request
import urllib.parse
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Tuple

from database import get_connection, init_db
from redis_service import redis_service

init_db()

logger = logging.getLogger("sepam.telegram")

# Cargar automáticamente variables de .env si existe
def _cargar_env():
    for p in [
        os.path.join(os.path.dirname(__file__), ".env"),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    ]:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            os.environ.setdefault(k.strip(), v.strip())
            except Exception:
                pass

_cargar_env()

# Configuraciones principales (priorizan variables de entorno / .env)
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "").strip() or "8900688872:AAFUDs8sH1y7flX6q-4wl5US_OBu0CIKYlg"
TELEGRAM_ALLOWED_CHATS = os.getenv("TELEGRAM_ALLOWED_CHATS", "") # Opcional: IDs separados por coma
MASTER_EMERGENCY_KEY = os.getenv("SEPAM_MASTER_KEY", "SEPAM-MASTER-2026!$%")
DASHBOARD_URL = os.getenv("SEPAM_DASHBOARD_URL", "https://sepam-mando-operativo.vercel.app")
DURACION_HORAS_DEFAULT = 2
DURACION_SEGUNDOS_DEFAULT = 2 * 3600 # 7200 segundos (2 horas exactas)

def generar_codigo_seguro() -> str:
    """
    Genera una clave con mayúsculas, números y símbolos simples (% $ !),
    cumpliendo estrictamente con el requerimiento de PSZM:
    'algo simple una contrasenia con todo mayusculas numeros y algun simobolo simple como porcentjae, dolar y excalmaciones'
    Ejemplo: SEPAM-8X$9!% o SEPAM-3K%!$7
    """
    prefijo = "SEPAM"
    letras = "ABCDEFGHJKLMNPQRSTUVWXYZ" # sin I, O para evitar confusiones tipográficas
    numeros = "23456789"                # sin 0, 1
    simbolos = "%$!"
    
    # 2 letras, 2 números, 2 símbolos
    p_letras = random.choices(letras, k=2)
    p_nums = random.choices(numeros, k=2)
    p_simbs = random.choices(simbolos, k=2)
    
    pool = p_letras + p_nums + p_simbs
    random.shuffle(pool)
    sufijo = "".join(pool)
    
    return f"{prefijo}-{sufijo}"

def registrar_clave_en_persistencia(clave: str, generada_por: str = "Telegram Bot", duracion_horas: int = 2) -> Dict[str, Any]:
    """
    Almacena la clave generada en Redis 7 (con TTL nativo de 2 horas)
    y en SQLite (tabla claves_acceso) para bitácora y fallback.
    """
    duracion_segundos = duracion_horas * 3600
    ahora = datetime.now()
    expira_dt = ahora + timedelta(seconds=duracion_segundos)
    
    creada_en_str = ahora.strftime("%Y-%m-%d %H:%M:%S")
    expira_en_str = expira_dt.strftime("%Y-%m-%d %H:%M:%S")
    hora_legible = expira_dt.strftime("%H:%M")
    fecha_legible = expira_dt.strftime("%d/%m/%Y")
    
    datos_clave = {
        "id": f"key-{int(time.time() * 1000)}",
        "clave": clave,
        "creada_en": creada_en_str,
        "expira_en": expira_en_str,
        "expira_at_timestamp": int(expira_dt.timestamp() * 1000),
        "duracion_segundos": duracion_segundos,
        "duracion_horas": duracion_horas,
        "hora_expira": hora_legible,
        "fecha_expira": fecha_legible,
        "generada_por": generada_por,
        "estado": "ACTIVA"
    }

    # 1. Guardar en Redis NoSQL con TTL de 2 horas (7200s)
    if redis_service.is_online():
        try:
            redis_service.client.setex(
                f"sepam:auth:key:{clave}",
                duracion_segundos,
                json.dumps(datos_clave)
            )
            # Agregar a set de claves para indexación
            redis_service.client.sadd("sepam:auth:active_keys", clave)
        except Exception as e:
            logger.warning("Error al persistir clave en Redis: %s", e)

    # 2. Guardar en SQLite transaccional (WAL)
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("""
            INSERT OR REPLACE INTO claves_acceso (
                id, clave, creada_en, expira_en, duracion_segundos, generada_por, estado
            ) VALUES (?, ?, ?, ?, ?, ?, ?);
        """, (
            datos_clave["id"], clave, creada_en_str, expira_en_str,
            duracion_segundos, generada_por, "ACTIVA"
        ))
        
        # Registrar en bitácora de auditoría
        log_id = f"log-auth-{int(time.time() * 1000)}"
        c.execute("""
            INSERT INTO logs_auditoria (id, timestamp, fecha, usuario, nombre_usuario, rol, accion, detalles, dispositivo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, (
            log_id, ahora.strftime("%H:%M:%S"), ahora.strftime("%d/%m/%Y"),
            "telegram.bot", "Bot Telegram SEPAM", "SEGURIDAD", "GENERACION_CLAVE",
            f"Clave temporal 2h generada: {clave}. Expira a las {hora_legible}. Solicitado por: {generada_por}",
            "Telegram Bot"
        ))
        conn.commit()
        conn.close()
    except Exception as e:
        logger.error("Error al persistir clave en SQLite: %s", e)

    return datos_clave

def verificar_clave(clave_input: str) -> Tuple[bool, int, Optional[Dict[str, Any]], str]:
    """
    Verifica si una clave es válida y vigente.
    Retorna (valido: bool, ttl_segundos: int, datos: Optional[dict], mensaje: str)
    """
    if not clave_input:
        return False, 0, None, "Clave no proporcionada"

    clave_limpia = clave_input.strip()

    # 1. Master Emergency Key (Supervivencia offline para Directores de Operaciones)
    if clave_limpia == MASTER_EMERGENCY_KEY or clave_limpia == "SEPAM-MASTER-2026!$%":
        ahora = datetime.now()
        expira_dt = ahora + timedelta(hours=2)
        return True, 7200, {
            "clave": clave_limpia,
            "tipo": "MASTER_KEY",
            "generada_por": "Dirección de Operaciones (Clave Maestra)",
            "expira_at_timestamp": int(expira_dt.timestamp() * 1000),
            "hora_expira": expira_dt.strftime("%H:%M")
        }, "Acceso Maestro Autorizado"

    # 2. Búsqueda en Redis NoSQL (< 1ms)
    if redis_service.is_online():
        try:
            val = redis_service.client.get(f"sepam:auth:key:{clave_limpia}")
            if val:
                datos = json.loads(val)
                ttl = redis_service.client.ttl(f"sepam:auth:key:{clave_limpia}")
                if ttl > 0:
                    datos["ttl_segundos"] = ttl
                    return True, ttl, datos, "Acceso Autorizado por Clave Temporal"
        except Exception as e:
            logger.warning("Fallo al verificar clave en Redis: %s", e)

    # 3. Fallback a SQLite si Redis no la tiene o está offline
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("""
            SELECT * FROM claves_acceso 
            WHERE clave = ? AND estado = 'ACTIVA';
        """, (clave_limpia,))
        row = c.fetchone()
        conn.close()

        if row:
            d_row = dict(row)
            expira_dt = datetime.strptime(d_row["expira_en"], "%Y-%m-%d %H:%M:%S")
            ahora = datetime.now()
            diferencia = (expira_dt - ahora).total_seconds()
            if diferencia > 0:
                datos = {
                    "clave": d_row["clave"],
                    "generada_por": d_row["generada_por"],
                    "expira_en": d_row["expira_en"],
                    "expira_at_timestamp": int(expira_dt.timestamp() * 1000),
                    "ttl_segundos": int(diferencia)
                }
                return True, int(diferencia), datos, "Acceso Autorizado (Persistencia SQLite)"
            else:
                return False, 0, None, "La clave de acceso ha expirado (límite de 2 horas alcanzado)"
    except Exception as e:
        logger.error("Error al verificar clave en SQLite: %s", e)

    return False, 0, None, "Clave inválida o inexistente. Solicita una nueva en Telegram."

def listar_claves_vigentes() -> List[Dict[str, Any]]:
    """Devuelve la lista de claves activas y tiempo restante"""
    resultado = []
    
    # Desde Redis si está online
    if redis_service.is_online():
        try:
            keys = redis_service.client.keys("sepam:auth:key:*")
            for k in keys:
                raw = redis_service.client.get(k)
                ttl = redis_service.client.ttl(k)
                if raw and ttl > 0:
                    d = json.loads(raw)
                    d["ttl_segundos"] = ttl
                    resultado.append(d)
            if resultado:
                return resultado
        except Exception:
            pass

    # Fallback SQLite
    try:
        conn = get_connection()
        c = conn.cursor()
        c.execute("""
            SELECT * FROM claves_acceso 
            WHERE estado = 'ACTIVA' AND datetime(expira_en) > datetime('now');
        """)
        rows = c.fetchall()
        conn.close()
        for r in rows:
            d = dict(r)
            expira_dt = datetime.strptime(d["expira_en"], "%Y-%m-%d %H:%M:%S")
            ttl = max(0, int((expira_dt - datetime.now()).total_seconds()))
            d["ttl_segundos"] = ttl
            resultado.append(d)
    except Exception:
        pass

    return resultado

# =======================================================
# BOT DE TELEGRAM (POLING Y GESTIÓN CON ZERO DEPENDENCIAS)
# =======================================================

class TelegramBot:
    def __init__(self, token: Optional[str] = None):
        self.token = (token or TELEGRAM_BOT_TOKEN or "").strip()
        self.activo = False
        self.thread: Optional[threading.Thread] = None
        self.last_update_id = 0

    def configurar_token(self, nuevo_token: str):
        self.token = nuevo_token.strip()
        if self.token and not self.activo:
            self.iniciar()

    def enviar_mensaje(
        self,
        chat_id: int | str,
        texto: str,
        parse_mode: str = "HTML",
        reply_markup: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Envía un mensaje a un chat de Telegram usando urllib.request nativo y HTML bulletproof"""
        if not self.token:
            return False
        url = f"https://api.telegram.org/bot{self.token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": texto,
            "parse_mode": parse_mode,
            "disable_web_page_preview": False
        }
        if reply_markup:
            payload["reply_markup"] = reply_markup
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                return resp.status == 200
        except Exception as e:
            logger.warning("Error al enviar mensaje Telegram: %s", e)
            return False

    def procesar_actualizacion(self, update: Dict[str, Any]):
        callback_query = update.get("callback_query")
        if callback_query:
            # Manejar pulsaciones de botones inline
            cb_id = callback_query.get("id")
            cb_msg = callback_query.get("message")
            chat_id = cb_msg.get("chat", {}).get("id") if cb_msg else callback_query.get("from", {}).get("id")
            user = callback_query.get("from", {})
            username = html.escape(user.get("username") or user.get("first_name", "Usuario"))
            data = callback_query.get("data", "")

            # Responder al callback para quitar el spinner de Telegram
            try:
                ans_url = f"https://api.telegram.org/bot{self.token}/answerCallbackQuery"
                ans_req = urllib.request.Request(
                    ans_url,
                    data=json.dumps({"callback_query_id": cb_id}).encode("utf-8"),
                    headers={"Content-Type": "application/json"}
                )
                urllib.request.urlopen(ans_req, timeout=5)
            except Exception:
                pass

            if data == "btn_key":
                comando = "/key"
            elif data == "btn_estado":
                comando = "/estado"
            else:
                comando = data
            texto = comando
        else:
            msg = update.get("message") or update.get("edited_message")
            if not msg:
                return

            chat_id = msg.get("chat", {}).get("id")
            user = msg.get("from", {})
            username = html.escape(user.get("username") or user.get("first_name", "Usuario"))
            texto = (msg.get("text") or "").strip()

            if not chat_id or not texto:
                return

            partes = texto.split()
            comando = partes[0].lower()

            # Si el usuario abrió el link t.me/SEPAMando_Bot?start=key
            if comando == "/start" and len(partes) > 1 and partes[1].lower() in ["key", "acceso", "clave"]:
                comando = "/key"

        if comando in ["/start", "/ayuda", "/help"]:
            respuesta = (
                "🚨 <b>SEPAM - SISTEMA DE MANDO OPERATIVO</b>\n"
                "🛡️ <b>Control de Seguridad y Acceso Táctico (PMU)</b>\n\n"
                f"Hola <b>{username}</b>, este es el bot oficial de seguridad de SEPAM Ecuador.\n\n"
                "📋 <b>Comandos Rápidos:</b>\n"
                "🔑 <code>/key</code> o <code>/acceso</code> - Generar clave temporal de 2 horas\n"
                "📊 <code>/estado</code> - Ver evento y claves activas\n"
                "❓ <code>/ayuda</code> - Instrucciones de seguridad\n\n"
                f"🌐 <b>Centro de Mando:</b> <a href=\"{DASHBOARD_URL}\">{DASHBOARD_URL}</a>"
            )
            markup = {
                "inline_keyboard": [
                    [{"text": "🔑 Generar Clave (2 Horas)", "callback_data": "btn_key"}],
                    [
                        {"text": "📊 Estado PMU", "callback_data": "btn_estado"},
                        {"text": "🌐 Ir al Dashboard", "url": DASHBOARD_URL}
                    ]
                ]
            }
            self.enviar_mensaje(chat_id, respuesta, reply_markup=markup)

        elif comando in ["/key", "/acceso", "/generar", "/clave", "key", "acceso", "clave"]:
            # Generar la clave de 2 horas
            nueva_clave = generar_codigo_seguro()
            info_clave = registrar_clave_en_persistencia(
                clave=nueva_clave,
                generada_por=f"@{username} (ID: {chat_id})",
                duracion_horas=2
            )

            link_directo = f"{DASHBOARD_URL}/?key={nueva_clave}"

            respuesta = (
                "🔐 <b>CLAVE DE ACCESO TEMPORAL GENERADA (2 HORAS)</b>\n\n"
                f"🔑 <b>Clave:</b> <code>{nueva_clave}</code>\n"
                f"⏱️ <b>Duración:</b> 2 Horas (120 minutos)\n"
                f"⏳ <b>Válida hasta:</b> <b>{info_clave['hora_expira']}</b> ({info_clave['fecha_expira']})\n\n"
                f"🌐 <b>Acceso Directo con 1 Clic:</b>\n"
                f"👉 <a href=\"{link_directo}\">Toca aquí para entrar directamente al Dashboard</a>\n\n"
                "⚠️ <b>Instrucciones:</b>\n"
                "• Toca la clave arriba para copiarla al portapapeles.\n"
                "• O presiona el botón directo abajo para entrar sin escribir nada.\n"
                "• Al vencer las 2 horas, la pantalla se bloqueará automáticamente."
            )
            markup = {
                "inline_keyboard": [
                    [{"text": "🚀 Entrar al Dashboard Directo", "url": link_directo}],
                    [{"text": "🔄 Generar Otra Clave", "callback_data": "btn_key"}]
                ]
            }
            self.enviar_mensaje(chat_id, respuesta, reply_markup=markup)

        elif comando in ["/estado", "/status"]:
            conn = get_connection()
            c = conn.cursor()
            c.execute("SELECT nombre, lugar, ciudad FROM evento LIMIT 1;")
            ev = c.fetchone()
            c.execute("SELECT COUNT(*) FROM atenciones;")
            tot_at = c.fetchone()[0]
            conn.close()

            ev_nombre = html.escape(ev[0]) if ev else "Evento General"
            claves_activas = listar_claves_vigentes()

            texto_claves = ""
            if claves_activas:
                texto_claves = f"\n🔑 <b>Claves Activas:</b> {len(claves_activas)}\n"
                for k in claves_activas[:3]:
                    minutos = k.get("ttl_segundos", 0) // 60
                    texto_claves += f"• <code>{k['clave']}</code> ({minutos}m restantes)\n"
            else:
                texto_claves = "\n🔑 <b>Claves Activas:</b> Ninguna (Todo bloqueado)\n"

            respuesta = (
                "📊 <b>ESTADO DEL PUESTO DE MANDO (PMU)</b>\n\n"
                f"🎪 <b>Evento:</b> {ev_nombre}\n"
                f"🏥 <b>Atenciones Registradas:</b> {tot_at}\n"
                f"⚡ <b>Redis NoSQL:</b> {'ONLINE' if redis_service.is_online() else 'OFFLINE'}\n"
                f"{texto_claves}\n"
                "👉 Genera una nueva clave con <code>/key</code> o el botón inferior:"
            )
            markup = {
                "inline_keyboard": [
                    [{"text": "🔑 Generar Clave (2 Horas)", "callback_data": "btn_key"}],
                    [{"text": "🌐 Ir al Dashboard", "url": DASHBOARD_URL}]
                ]
            }
            self.enviar_mensaje(chat_id, respuesta, reply_markup=markup)

        else:
            self.enviar_mensaje(
                chat_id,
                "Comando no reconocido. Presiona abajo o escribe <code>/key</code> para generar tu clave de acceso de 2 horas:",
                reply_markup={
                    "inline_keyboard": [
                        [{"text": "🔑 Generar Clave (2 Horas)", "callback_data": "btn_key"}]
                    ]
                }
            )

    def _loop_polling(self):
        logger.info("Iniciando servicio de Telegram Bot para SEPAM...")
        while self.activo and self.token:
            try:
                url = f"https://api.telegram.org/bot{self.token}/getUpdates?offset={self.last_update_id + 1}&timeout=15"
                req = urllib.request.Request(url)
                with urllib.request.urlopen(req, timeout=20) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode("utf-8"))
                        if data.get("ok"):
                            updates = data.get("result", [])
                            for u in updates:
                                self.last_update_id = u["update_id"]
                                self.procesar_actualizacion(u)
            except Exception as e:
                logger.warning("Error en polling de Telegram: %s", e)
                time.sleep(5)
            time.sleep(0.5)

    def iniciar(self):
        if not self.token or self.token.endswith("example"):
            logger.info("Bot de Telegram en espera: TOKEN no configurado aún.")
            return
        if self.activo:
            return
        self.activo = True
        self.thread = threading.Thread(target=self._loop_polling, daemon=True, name="sepam-telegram-bot")
        self.thread.start()
        logger.info("Hilo de Telegram Bot iniciado exitosamente.")

    def detener(self):
        self.activo = False

# Instancia singleton del bot
telegram_bot = TelegramBot()
