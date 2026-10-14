import duckdb
import os
import pandas as pd
from database import DB_PATH

def get_duckdb_connection():
    """
    Crea una sesión DuckDB en memoria conectada directamente al archivo SQLite.
    Permite consultas analíticas columnares a velocidad C.
    """
    con = duckdb.connect()
    con.execute("INSTALL sqlite;")
    con.execute("LOAD sqlite;")
    # Escapar ruta para Windows
    safe_db_path = DB_PATH.replace("\\", "/")
    con.execute(f"ATTACH '{safe_db_path}' AS sepam (TYPE SQLITE);")
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

        # 4. Total de logs y accesos
        total_logs = con.execute("SELECT COUNT(*) FROM sepam.logs_auditoria;").fetchone()[0]

        return {
            "triage": triage_stats,
            "sectores": sectores,
            "curva_horaria": curva_horaria,
            "total_logs": total_logs
        }
    finally:
        con.close()

def generar_reporte_excel(output_path: str):
    """
    Genera un archivo Excel profesional con 3 pestañas usando DuckDB y Pandas:
    1. KPIs y Estadísticas de Concierto
    2. Detalle Clínico de Atenciones
    3. Bitácora de Auditoría y Trazabilidad (Reporte 2)
    """
    con = get_duckdb_connection()
    try:
        # Pestaña 1: Resumen
        df_evento = con.execute("SELECT * FROM sepam.evento;").df()
        
        # Pestaña 2: Atenciones completas
        df_atenciones = con.execute("""
            SELECT 
                codigo as 'Código',
                fecha as 'Fecha',
                timestamp as 'Hora',
                triage_color as 'Triage',
                paciente_nombre as 'Paciente',
                paciente_edad as 'Edad',
                paciente_genero as 'Género',
                motivo as 'Motivo / Diagnóstico',
                sector_nombre as 'Ubicación / Sector',
                paramedico_nombre as 'Paramédico Responsable',
                derivacion as 'Destino',
                ambulancia_codigo as 'Ambulancia',
                hospital as 'Hospital Receptor',
                detalles_json as 'Signos Vitales y Tratamiento'
            FROM sepam.atenciones
            ORDER BY timestamp DESC;
        """).df()

        # Pestaña 3: Logs de Auditoría
        df_logs = con.execute("""
            SELECT 
                timestamp as 'Hora',
                fecha as 'Fecha',
                usuario as 'Usuario',
                nombre_usuario as 'Nombre',
                rol as 'Rol Operativo',
                accion as 'Acción',
                detalles as 'Detalles del Evento',
                dispositivo as 'Dispositivo / Red'
            FROM sepam.logs_auditoria
            ORDER BY timestamp DESC;
        """).df()

        # Escribir a Excel
        with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
            df_evento.to_excel(writer, sheet_name="Resumen_Evento", index=False)
            df_atenciones.to_excel(writer, sheet_name="Atenciones_Clinicas", index=False)
            df_logs.to_excel(writer, sheet_name="Bitacora_Auditoria", index=False)

        return output_path
    finally:
        con.close()

def generar_reporte_csv(output_path: str):
    con = get_duckdb_connection()
    try:
        df = con.execute("SELECT * FROM sepam.atenciones ORDER BY timestamp DESC;").df()
        df.to_csv(output_path, index=False, encoding="utf-8-sig")
        return output_path
    finally:
        con.close()
