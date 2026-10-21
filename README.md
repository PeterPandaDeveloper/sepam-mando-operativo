# SEPAM — Sistema de Mando Operativo y Triaje Prehospitalario

> Sistema integral de gestion de emergencias medicas, triaje tactico y mando operativo en tiempo real para eventos de concentracion masiva: estadios, conciertos, ferias y recintos cerrados/abiertos.

**URL de produccion:** [https://sepam-mando-operativo.vercel.app](https://sepam-mando-operativo.vercel.app)

---

## Caracteristicas principales

- **Triaje Tactico Rapido (Metodo START):** Registro de pacientes en menos de 15 segundos con clasificacion por codigo de colores — Rojo (Critico), Amarillo (Urgente), Verde (Leve), Negro (Fallecido).
- **Terminal Movil de Brigadista:** App progresiva (PWA / APK) para uso en cancha o graderia sin instalacion. Funciona via QR desde cualquier navegador movil con 4G/5G o Wi-Fi del evento.
- **Modo Offline-First:** Si el brigadista pierde señal, los reportes se almacenan localmente y se sincronizan automaticamente al recuperar conexion. Boton "Forzar Envio" disponible para sincronizacion manual.
- **IDs Anti-colision:** Cada atencion genera un codigo unico (`AT-06-P03-847`) que incluye el numero del brigadista y sufijo de timestamp, evitando colisiones cuando varios brigadistas trabajan sin señal simultaneamente.
- **Dashboard Power BI estilo Mando:** Widgets SVG de dona, barras, tendencia y gauge con cross-filtering. Modo LEGO Builder para Super Usuarios (arrastrar, agregar, quitar widgets).
- **Persistencia Poliglota Tri-Motor:**
  - **SQLite 3 + WAL:** Motor OLTP transaccional. Registra atenciones en microsegundos sin bloqueos de escritura.
  - **DuckDB 1.5:** Motor columnar OLAP en memoria. Genera reportes Excel/CSV con consultas vectorizadas instantaneas.
  - **Redis 7:** Pub/Sub en memoria (<1ms). Alertas criticas en vivo y cache de metricas entre clientes conectados.
- **Configuracion IP Hotspot Manual:** Los brigadistas pueden ingresar la IP de la laptop del mando desde la app, sin necesidad de camara/QR.
- **Validacion Cedula Ecuatoriana:** Modulo 10 en tiempo real en el formulario de atencion.
- **Semaforos de Signos Vitales:** SpO2 < 92%, FC > 110 lpm o Glasgow < 14 activan alertas rojas pulsantes en la vista ACV.
- **Formulario MSP 002 Autogenerado:** Folio secuencial `MSP-002-2026-XXXX` para ambulancias con firma y datos legales.

---

## Arquitectura

```
Brigadistas (movil 4G/QR)           Mando Central (laptop/tablet)
        |                                       |
        v                                       v
+-------------------------------------------------------+
|            Frontend Angular 17+ (SPA)                 |
|            Vercel Edge Network — HTTPS                 |
|   Signals API · Tailwind CSS · Standalone Components   |
+-------------------------------------------------------+
                        |
              /api/* proxy (vercel.json)
                        |
                        v
+-------------------------------------------------------+
|            FastAPI Backend (Python 3.12)               |
|            Laptop del Mando — puerto 8000              |
|            o servidor Oracle Cloud                     |
+------------------+----------------+-------------------+
                   |                |
            SQLite (WAL)     DuckDB (OLAP)    Redis (Pub/Sub)
            atenciones       analytics        alertas en vivo
            persistencia     Excel/CSV        cache metricas
```

### Modo de conexion segun escenario

| Escenario | Como se conectan los brigadistas |
|-----------|----------------------------------|
| Evento con Internet | URL de Vercel via QR — HTTPS directo |
| Hotspot de laptop | `http://192.168.137.1:8000` via QR local |
| IP personalizada | Boton "IP Hotspot" en la app movil |
| Sin señal temporal | Offline queue → auto-sync al reconectar |

---

## Credenciales de acceso

| Rol | Usuario | Contrasena | Permisos |
|-----|---------|------------|----------|
| **Super Usuario (Mando Central)** | `pedro.zavala` | `admin1` | Dashboard completo, reportes Excel, configuracion del evento, QR de acceso, LEGO Builder de widgets |
| **Brigadista de Campo** | *(Sin login)* | *(Acceso por QR directo)* | Terminal movil de triaje, registro de pacientes, traslados |

---

## Estructura del repositorio

```
sepam-mando-operativo/
├── src/
│   └── app/
│       ├── components/
│       │   ├── dashboard/            # Dashboard Power BI con widgets SVG y cross-filtering
│       │   ├── paramedic-mobile/     # Terminal movil brigadista (offline-first, QR, IP manual)
│       │   ├── medical-acv/          # Vista ACV con semaforos de signos vitales
│       │   ├── ambulance/            # Formulario MSP-002 autogenerado
│       │   ├── admin-panel/          # Panel de auditoria y trazabilidad
│       │   ├── network-modal/        # Modal QR, toggle Hotspot/Nube, copia de URL
│       │   ├── quick-edit-modal/     # Editor LEGO de widgets del dashboard
│       │   └── header/               # Barra superior con estado de conexion
│       ├── services/
│       │   ├── emergency.service.ts  # Estado global, offline queue, IDs anti-colision
│       │   ├── database.service.ts   # HTTP dinamico con fallback Hotspot → localhost
│       │   ├── network.service.ts    # URLs, QR, diagnostico de red
│       │   ├── customizer.service.ts # Temas y configuracion de widgets
│       │   └── access-auth.service.ts# RBAC, sesion y roles
│       └── models/
│           └── emergency.model.ts    # Interfaces y tipos (Atencion, Triaje, etc.)
├── backend/
│   ├── main.py                       # Endpoints REST FastAPI
│   ├── database.py                   # SQLite WAL + DuckDB
│   ├── redis_service.py              # Pub/Sub y cache Redis
│   ├── network_manager.py            # Diagnostico de red y generacion de QR
│   ├── analytics.py                  # Reportes y exportacion Excel
│   ├── telegram_service.py           # Alertas criticas via Telegram (opcional)
│   ├── sepam.db                      # Base de datos SQLite (generada automaticamente)
│   ├── requirements.txt              # Dependencias Python
│   └── iniciar_servidor_db.bat       # Script de inicio en Windows
├── capacitor.config.json             # Configuracion para compilar APK con Capacitor
├── INICIAR_SISTEMA_SEPAM.bat         # Levanta frontend + backend + reglas de firewall
├── vercel.json                       # Proxy /api/* → backend y config de deploy
└── README.md
```

---

## Endpoints clave del backend

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| `GET` | `/api/estado` | Estado del sistema, evento activo y totales |
| `GET` | `/api/atenciones` | Listado de pacientes en tiempo real |
| `POST` | `/api/atenciones` | Registrar nueva atencion de triaje |
| `PUT` | `/api/atenciones/{id}` | Actualizar atencion existente |
| `GET` | `/api/analitica/resumen` | Estadisticas DuckDB (por sector, prioridad, tipo) |
| `GET` | `/api/analitica/exportar-excel` | Genera y descarga reporte oficial `.xlsx` |
| `GET` | `/api/red/diagnostico` | IP recomendada, QR local y estado del Hotspot |

---

## Despliegue en produccion

### Frontend — Vercel (automatico)

Cada `git push` a `main` activa un deploy automatico en Vercel.

```bash
git push origin main
# Vercel detecta Angular via vercel.json y despliega en ~60s
```

Para configurar por primera vez:
1. Ir a [vercel.com/new](https://vercel.com/new)
2. Importar `PeterPandaDeveloper/sepam-mando-operativo`
3. Vercel detecta Angular automaticamente → **Deploy**

### Backend — Laptop del mando (evento presencial)

```bash
# Windows — doble clic o ejecutar:
INICIAR_SISTEMA_SEPAM.bat

# Manual:
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
python main.py
# API disponible en http://localhost:8000/docs
```

### Backend — Oracle Cloud (opcional, produccion remota)

```bash
# Ver estado del servicio
sudo systemctl status sepam-api

# Reiniciar tras cambios
sudo systemctl restart sepam-api

# Logs en tiempo real
sudo journalctl -u sepam-api -f
```

---

## Desarrollo local

### Prerrequisitos

- Node.js 20+ y npm
- Python 3.12+
- Redis (opcional para alertas en vivo)

### Iniciar todo

```bash
# Terminal 1 — Frontend
npm install
npm run start
# http://localhost:4200

# Terminal 2 — Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py
# http://localhost:8000/docs
```

### Build de produccion

```bash
npm run build
# Salida en dist/sepam-mando-operativo/
```

### Compilar APK (Capacitor)

```bash
npm run build
npx cap sync android
npx cap open android
# Compilar desde Android Studio → Build → Generate Signed APK
```

---

## Conectarse a la base de datos (DBeaver)

**SQLite — `backend/sepam.db`**

1. `Ctrl+Shift+N` → seleccionar **SQLite**
2. Browse → apuntar a `backend/sepam.db`
3. Test Connection → Finish

Tablas disponibles:
- `atenciones` — todos los pacientes registrados
- `logs_auditoria` — trazabilidad de cada accion del sistema
- `evento` — configuracion del evento activo
- `personal` — brigadistas registrados

---

## Tecnologias utilizadas

| Capa | Tecnologia |
|------|------------|
| Frontend | Angular 17+, TypeScript, Tailwind CSS, Signals API |
| Backend | Python 3.12, FastAPI, Uvicorn |
| BD Operacional | SQLite 3 (modo WAL) |
| BD Analitica | DuckDB 1.5 |
| Cache / Alertas | Redis 7 (Pub/Sub) |
| Deploy Frontend | Vercel (Edge Network, HTTPS) |
| Deploy Backend | Laptop local / Oracle Cloud (Systemd) |
| APK Movil | Capacitor (Android) |
| Reportes | openpyxl, pandas |
| QR Offline | qrcode + Pillow (base64) |

---

## Licencia y creditos

Desarrollado para el equipo de Mando Operativo de Emergencias Prehospitalarias y Cobertura de Eventos Masivos.

Autor: **Pedro Zavala M.** — [PeterPandaDeveloper](https://github.com/PeterPandaDeveloper)
