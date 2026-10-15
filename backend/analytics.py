import sqlite3
import duckdb
import os
import pandas as pd
from database import DB_PATH

def get_duckdb_connection():
    """
    Crea una sesión DuckDB en memoria conectada directamente al archivo SQLite.
    Permite consultas analíticas columnares a velocidad C.
    Maneja modo offline y fallback transparente si la extensión sqlite no está en caché.
    """
    con = duckdb.connect()
    extension_cargada = False
    
    # 1. Intentar cargar la extensión sqlite directamente (sin descargar)
    try:
        con.execute("LOAD sqlite;")
        extension_cargada = True
    except Exception:
        # 2. Si no está en caché, intentar instalarla
        try:
            con.execute("INSTALL sqlite;")
            con.execute("LOAD sqlite;")
            extension_cargada = True
        except Exception:
            # Modo 100% Offline: Fallback a ingesta en memoria vía sqlite3 nativo de Python
            extension_cargada = False

    if extension_cargada:
        safe_db_path = DB_PATH.replace("\\", "/").replace("'", "''")
        con.execute(f"ATTACH '{safe_db_path}' AS sepam (TYPE SQLITE);")
    else:
        # Fallback offline garantizado: Ingesta desde SQLite a DuckDB en memoria
        try:
            sq_conn = sqlite3.connect(DB_PATH)
            df_atenciones = pd.read_sql("SELECT * FROM atenciones", sq_conn)
            df_logs = pd.read_sql("SELECT * FROM logs_auditoria", sq_conn)
            sq_conn.close()
            con.execute("CREATE SCHEMA IF NOT EXISTS sepam;")
            con.register("df_atenciones_temp", df_atenciones)
            con.register("df_logs_temp", df_logs)
            con.execute("CREATE OR REPLACE VIEW sepam.atenciones AS SELECT * FROM df_atenciones_temp;")
            con.execute("CREATE OR REPLACE VIEW sepam.logs_auditoria AS SELECT * FROM df_logs_temp;")
        except Exception as e:
            print(f"Error en fallback offline DuckDB: {e}")
            
    return con

def obtener_resumen_operativo():
    con = get_duckdb_connection()
    try:
        # 1. Total y distribución por color de triage
        triage_stats = con.execute("""
            SELECT 
                COUNT(*) as total_atenciones,
                COUNT(CASE WHEN triage_color = 'ROJO' THEN 1 END) as rojos,
                COUNT(CASE WHEN triage_color = 'AMARILLO' THEN 1 END) as amarillos,
                COUNT(CASE WHEN triage_color = 'VERDE' THEN 1 END) as verdes,
                COUNT(CASE WHEN triage_color = 'NEGRO' THEN 1 END) as negros,
                COUNT(CASE WHEN derivacion = 'AMBULANCIA' THEN 1 END) as traslados_ambulancia,
                COUNT(CASE WHEN derivacion = 'ALTA' THEN 1 END) as altas_en_sitio,
                COUNT(CASE WHEN derivacion = 'ACV' THEN 1 END) as derivados_acv,
                COALESCE(ROUND(AVG(paciente_edad), 1), 0) as edad_promedio
            FROM sepam.atenciones;
        """).df().to_dict(orient="records")[0]

        # 2. Desglose de atenciones por sector
        sectores = con.execute("""
            SELECT 
                sector_nombre,
                COUNT(*) as atenciones,
                COUNT(CASE WHEN triage_color = 'ROJO' THEN 1 END) as criticos
            FROM sepam.atenciones
            GROUP BY sector_nombre
            ORDER BY atenciones DESC;
        """).df().to_dict(orient="records")

        # 3. Curva horaria (atenciones por bloque de hora)
        curva_horaria = con.execute("""
            SELECT 
                SUBSTR(timestamp, 1, 2) || ':00' as hora,
                COUNT(*) as total,
                COUNT(CASE WHEN triage_color = 'ROJO' THEN 1 END) as rojo,
                COUNT(CASE WHEN triage_color = 'AMARILLO' THEN 1 END) as amarillo,
                COUNT(CASE WHEN triage_color = 'VERDE' THEN 1 END) as verde
            FROM sepam.atenciones
            GROUP BY SUBSTR(timestamp, 1, 2)
            ORDER BY hora ASC;
        """).df().to_dict(orient="records")

        # 4. Total de logs registrados
        total_logs = con.execute("SELECT COUNT(*) FROM sepam.logs_auditoria;").fetchone()[0]

        return {
            "triage": triage_stats,
            "sectores": sectores,
            "curva_horaria": curva_horaria,
            "total_logs": total_logs
        }
    finally:
        con.close()

def generar_reporte_excel(ruta_destino: str):
    """Genera un archivo Excel profesional multi-hoja usando DuckDB y Pandas"""
    con = get_duckdb_connection()
    try:
        df_atenciones = con.execute("""
            SELECT 
                codigo as 'CÓDIGO',
                timestamp as 'HORA',
                fecha as 'FECHA',
                sector_nombre as 'SECTOR',
                paramedico_nombre as 'PARAMÉDICO',
                triage_color as 'TRIAGE',
                paciente_nombre as 'PACIENTE',
                paciente_edad as 'EDAD',
                paciente_genero as 'GÉNERO',
                motivo as 'MOTIVO DE ATENCIÓN',
                derivacion as 'RESOLUCIÓN / DESTINO',
                ambulancia_codigo as 'AMBULANCIA',
                hospital as 'HOSPITAL RECEPTOR',
                detalles_json as 'DETALLES CLÍNICOS'
            FROM sepam.atenciones
            ORDER BY timestamp DESC;
        """).df()

        df_logs = con.execute("""
            SELECT 
                timestamp as 'HORA',
                fecha as 'FECHA',
                usuario as 'USUARIO',
                nombre_usuario as 'NOMBRE',
                rol as 'ROL',
                accion as 'ACCIÓN',
                detalles as 'DETALLE OPERATIVO',
                dispositivo as 'DISPOSITIVO'
            FROM sepam.logs_auditoria
            ORDER BY timestamp DESC;
        """).df()

        df_resumen = con.execute("""
            SELECT 
                triage_color as 'CLASIFICACIÓN TRIAGE',
                COUNT(*) as 'TOTAL PACIENTES',
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sepam.atenciones), 1) || '%' as 'PORCENTAJE'
            FROM sepam.atenciones
            GROUP BY triage_color
            ORDER BY COUNT(*) DESC;
        """).df()

        with pd.ExcelWriter(ruta_destino, engine='openpyxl') as writer:
            df_resumen.to_excel(writer, sheet_name='Resumen General Triage', index=False)
            df_atenciones.to_excel(writer, sheet_name='Atenciones de Campo', index=False)
            df_logs.to_excel(writer, sheet_name='Bitácora de Auditoría', index=False)
            
        return ruta_destino
    finally:
        con.close()

def generar_reporte_csv(ruta_destino: str):
    con = get_duckdb_connection()
    try:
        df = con.execute("SELECT * FROM sepam.atenciones ORDER BY timestamp DESC;").df()
        df.to_csv(ruta_destino, index=False, encoding='utf-8-sig')
        return ruta_destino
    finally:
        con.close()
