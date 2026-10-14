import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sepam.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    # Habilitar WAL mode para altisima concurrencia y cero bloqueos
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Tabla de Atenciones de Triage Médico Prehospitalario
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS atenciones (
        id TEXT PRIMARY KEY,
        codigo TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        fecha TEXT NOT NULL,
        sector_id TEXT,
        sector_nombre TEXT,
        paramedico_id TEXT,
        paramedico_nombre TEXT,
        triage_color TEXT NOT NULL, -- ROJO, AMARILLO, VERDE, NEGRO
        paciente_nombre TEXT,
        paciente_edad INTEGER,
        paciente_genero TEXT,
        motivo TEXT,
        derivacion TEXT,            -- ACV, AMBULANCIA, ALTA
        ambulancia_codigo TEXT,
        hospital TEXT,
        detalles_json TEXT          -- Almacén flexible para signos vitales, glasgow, medicamentos, etc.
    );
    """)

    # 2. Tabla de Logs de Auditoría y Trazabilidad (Reporte 2 Técnico)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS logs_auditoria (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        fecha TEXT NOT NULL,
        usuario TEXT NOT NULL,
        nombre_usuario TEXT NOT NULL,
        rol TEXT NOT NULL,
        accion TEXT NOT NULL,       -- INICIO_SESION, NUEVA_ATENCION, TRASLADO_ACV, etc.
        detalles TEXT NOT NULL,
        dispositivo TEXT NOT NULL
    );
    """)

    # 3. Tabla del Evento Masivo Activo
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS evento (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        tipo TEXT NOT NULL,
        ciudad TEXT NOT NULL,
        lugar TEXT NOT NULL,
        fecha TEXT NOT NULL,
        horario TEXT NOT NULL,
        riesgo TEXT NOT NULL,
        aforo_estimado INTEGER NOT NULL
    );
    """)

    # Poblar con datos iniciales si la tabla de eventos está vacía
    cursor.execute("SELECT COUNT(*) FROM evento;")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO evento (id, nombre, tipo, ciudad, lugar, fecha, horario, riesgo, aforo_estimado)
        VALUES (
            'evt-001',
            'CONCIERTO CHINO Y NACHO',
            'Concierto Masivo',
            'QUITO',
            'Estadio Olímpico Atahualpa / Explanada',
            '30 de septiembre de 2026',
            '16:00 - 23:30',
            'Alto',
            28000
        );
        """)

    # Poblar atenciones de muestra si está vacía
    cursor.execute("SELECT COUNT(*) FROM atenciones;")
    if cursor.fetchone()[0] == 0:
        atenciones_iniciales = [
            (
                'at-001', 'AT-001', '16:10:00', '30/09/2026', 'sec-c', 'ZONA C - ESCENARIO Y FOSO',
                'param-3', 'Carlos Mendoza', 'VERDE', 'Juan Carlos Pérez', 22, 'M',
                'Golpe de calor y deshidratación leve', 'ALTA', '', '',
                json.dumps({'fc': 88, 'pa': '120/80', 'sao2': 98, 'glasgow': 15, 'tratamiento': 'Hidratación oral'})
            ),
            (
                'at-002', 'AT-002', '16:25:00', '30/09/2026', 'sec-a', 'ZONA A - GRADAS',
                'param-2', 'Aldahir Lara', 'AMARILLO', 'María Belén Andrade', 28, 'F',
                'Esguince de tobillo derecho por grada resbaladiza', 'ACV', '', '',
                json.dumps({'fc': 94, 'pa': '110/70', 'sao2': 97, 'glasgow': 15, 'inmovilizacion': 'Férula neumática'})
            ),
            (
                'at-003', 'AT-003', '16:45:00', '30/09/2026', 'sec-c', 'ZONA C - ESCENARIO Y FOSO',
                'param-4', 'Diana Morales', 'ROJO', 'Roberto Andrés Silva', 34, 'M',
                'Dificultad respiratoria severa / Asma exacerbada', 'AMBULANCIA', 'ALFA-01', 'Hospital Eugenio Espejo',
                json.dumps({'fc': 125, 'pa': '145/95', 'sao2': 86, 'glasgow': 13, 'oxigeno': 'Mascarilla reservorio 10L', 'medicacion': 'Salbutamol + Hidrocortisona'})
            ),
            (
                'at-004', 'AT-004', '17:05:00', '30/09/2026', 'sec-b', 'ZONA B - PUERTA Y ACCESOS',
                'param-1', 'Zuleyka Lara', 'VERDE', 'Sofía Victoria Mena', 19, 'F',
                'Herida cortante superficial en mano izquierda', 'ALTA', '', '',
                json.dumps({'fc': 76, 'pa': '115/75', 'sao2': 99, 'glasgow': 15, 'curacion': 'Sutura adhesiva + vendaje'})
            ),
            (
                'at-005', 'AT-005', '17:20:00', '30/09/2026', 'sec-a', 'ZONA A - GRADAS',
                'param-5', 'Bryan Cajas', 'AMARILLO', 'Esteban Fernando Gómez', 45, 'M',
                'Crisis hipertensiva reactiva y cefalea pulsátil', 'ACV', '', '',
                json.dumps({'fc': 105, 'pa': '170/105', 'sao2': 96, 'glasgow': 15, 'medicacion': 'Captopril 25mg sublingual'})
            )
        ]
        cursor.executemany("""
        INSERT INTO atenciones (id, codigo, timestamp, fecha, sector_id, sector_nombre, paramedico_id, paramedico_nombre, triage_color, paciente_nombre, paciente_edad, paciente_genero, motivo, derivacion, ambulancia_codigo, hospital, detalles_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, atenciones_iniciales)

    # Poblar logs iniciales si está vacía
    cursor.execute("SELECT COUNT(*) FROM logs_auditoria;")
    if cursor.fetchone()[0] == 0:
        logs_iniciales = [
            ('log-1', '16:00:15', '30/09/2026', 'pedro.zavala', 'Pedro Zavala', 'JEFE_OPERACIONES', 'INICIO_SESION', 'Apertura del Puesto de Mando Unificado (PMU). Puesto activo.', 'PC Mando Central (Host LAN)'),
            ('log-2', '16:05:22', '30/09/2026', 'sebastian.zavala', 'Sebastian Zavala', 'DIRECTOR_MEDICO', 'INICIO_SESION', 'Ingreso al sistema. Supervisión médica activa.', 'PC Mando Central (Host LAN)'),
            ('log-3', '16:10:05', '30/09/2026', 'param03', 'Carlos Mendoza', 'PARAMEDICO_CAMPO', 'NUEVA_ATENCION', 'Atención AT-001 generada en ZONA C (Verde).', 'Móvil Android (TP-Link Wi-Fi)'),
            ('log-4', '16:45:30', '30/09/2026', 'param04', 'Diana Morales', 'PARAMEDICO_AMBULANCIA', 'DERIVACION_HOSPITAL', 'Atención AT-003 derivada a Hospital Eugenio Espejo en ALFA-01.', 'Móvil Ambulancia')
        ]
        cursor.executemany("""
        INSERT INTO logs_auditoria (id, timestamp, fecha, usuario, nombre_usuario, rol, accion, detalles, dispositivo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, logs_iniciales)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print(f"Base de datos SQLite inicializada exitosamente en: {DB_PATH}")
