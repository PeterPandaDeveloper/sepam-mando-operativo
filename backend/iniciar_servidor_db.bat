@echo off
title SEPAM - Servidor Local de Base de Datos (SQLite WAL + DuckDB)
color 0A
echo ==============================================================
echo        SEPAM ECUADOR - SISTEMA DE MANDO PREHOSPITALARIO
echo        Servidor de Persistencia (SQLite) y Analitica (DuckDB)
echo ==============================================================
echo.
echo [1/2] Verificando dependencias Python...
python -c "import fastapi, uvicorn, duckdb, sqlite3, pandas, openpyxl; print('Dependencias verificadas: OK')"
if %errorlevel% neq 0 (
    echo [ERROR] Faltan paquetes. Instalando dependencias necesarias...
    pip install fastapi uvicorn duckdb pandas openpyxl
)

echo.
echo [2/2] Iniciando Servidor API en puerto 8000 (0.0.0.0)...
echo Conectado a base de datos local: sepam.db (Modo WAL)
echo Motor analitico activado: DuckDB 1.5
echo.
echo Presione Ctrl + C para detener el servidor.
echo ==============================================================
python main.py
pause
