import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

logger = logging.getLogger("sepam.redis")

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    logger.warning("Libreria 'redis' no instalada. Redis estara deshabilitado.")

class RedisService:
    def __init__(self, host: str = "127.0.0.1", port: int = 6379, db: int = 0):
        self.host = host
        self.port = port
        self.db = db
        self.client: Optional[Any] = None
        self._conectar()

    def _conectar(self):
        if not REDIS_AVAILABLE:
            return
        try:
            self.client = redis.Redis(
                host=self.host,
                port=self.port,
                db=self.db,
                decode_responses=True,
                socket_connect_timeout=2.0
            )
            self.client.ping()
            logger.info("Conectado exitosamente a Redis en %s:%s", self.host, self.port)
        except Exception as e:
            logger.warning("No se pudo conectar a Redis (%s). Modo fallback activo.", e)
            self.client = None

    def is_online(self) -> bool:
        if not self.client:
            self._conectar()
        if not self.client:
            return False
        try:
            return bool(self.client.ping())
        except Exception:
            return False

    def get_info(self) -> Dict[str, Any]:
        if not self.is_online():
            return {
                "estado": "OFFLINE",
                "motor": "Redis 7 (In-Memory NoSQL)",
                "host": f"{self.host}:{self.port}",
                "modo": "Fallback transparente a SQLite/DuckDB"
            }
        try:
            info = self.client.info("server")
            mem = self.client.info("memory")
            return {
                "estado": "ONLINE",
                "motor": "Redis 7 (In-Memory NoSQL)",
                "version": info.get("redis_version", "7.x"),
                "uptime_dias": round(info.get("uptime_in_seconds", 0) / 86400, 1),
                "memoria_usada": mem.get("used_memory_human", "N/A"),
                "canales_pubsub": "sepam:alertas",
                "rol": "Alertas Criticas en Tiempo Real + Cache de Metricas"
            }
        except Exception as e:
            return {"estado": "ERROR", "detalle": str(e)}

    def publicar_alerta(self, alerta: Dict[str, Any]) -> bool:
        """
        Publica una alerta en tiempo real en el canal Pub/Sub y la almacena en la lista de recientes.
        """
        if not self.is_online():
            return False
        try:
            payload = json.dumps(alerta)
            # 1. Publicar a suscriptores en vivo
            self.client.publish("sepam:alertas", payload)
            # 2. Guardar en lista de recientes (maximo 50 alertas en memoria)
            self.client.lpush("sepam:alertas:recientes", payload)
            self.client.ltrim("sepam:alertas:recientes", 0, 49)
            return True
        except Exception as e:
            logger.error("Error al publicar alerta en Redis: %s", e)
            return False

    def obtener_alertas_recientes(self, limite: int = 15) -> List[Dict[str, Any]]:
        """
        Obtiene las ultimas alertas almacenadas en la lista NoSQL de Redis.
        """
        if not self.is_online():
            return []
        try:
            elementos = self.client.lrange("sepam:alertas:recientes", 0, limite - 1)
            return [json.loads(x) for x in elementos]
        except Exception as e:
            logger.error("Error al leer alertas recientes de Redis: %s", e)
            return []

    def set_cache_metricas(self, metricas: Dict[str, Any], ttl_segundos: int = 10) -> bool:
        """
        Cachea el resumen de metricas en Redis para aliviar consultas analiticas concurrentes.
        """
        if not self.is_online():
            return False
        try:
            self.client.setex("sepam:cache:resumen_metricas", ttl_segundos, json.dumps(metricas))
            return True
        except Exception as e:
            return False

    def get_cache_metricas(self) -> Optional[Dict[str, Any]]:
        """
        Recupera el resumen de metricas cacheado en Redis si aun no ha expirado.
        """
        if not self.is_online():
            return None
        try:
            val = self.client.get("sepam:cache:resumen_metricas")
            if val:
                return json.loads(val)
            return None
        except Exception as e:
            return None

    def invalidar_cache(self):
        """
        Invalida la cache de metricas cuando entra una nueva atencion.
        """
        if self.is_online():
            try:
                self.client.delete("sepam:cache:resumen_metricas")
            except Exception:
                pass

# Instancia singleton para la aplicacion
redis_service = RedisService()
