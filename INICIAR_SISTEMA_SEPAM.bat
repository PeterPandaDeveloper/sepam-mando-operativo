@echo off
title SEPAM - Sistema de Mando y Operacion Prehospitalaria
color 0A
cls

echo ==============================================================================
echo        SEPAM ECUADOR - SISTEMA DE MANDO Y OPERACION PREHOSPITALARIA
echo                  CONTROL OPERATIVO PARA EVENTOS MASIVOS
echo ==============================================================================
echo.
echo [1/3] Verificando entorno de ejecucion...
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python no esta instalado o no esta en el PATH.
    echo Por favor instala Python 3.10 o superior.
    pause
    exit /b
)

echo.
echo [2/3] Iniciando Servidor de Base de Datos y Analitica (DuckDB + SQLite WAL)...
cd /d "%~dp0backend"
start "SEPAM Backend (DuckDB + SQLite WAL + Red)" cmd /k "python main.py"

timeout /t 2 >nul

echo.
echo [3/3] Verificando servidor web...
where npm >nul 2>&1
if %errorlevel% equ 0 (
    echo   -> Node.js detectado. Iniciando servidor Angular en 0.0.0.0...
    cd /d "%~dp0"
    start "SEPAM Frontend (Red Local 0.0.0.0)" cmd /k "npm start -- --host 0.0.0.0 --port 4200"
    set DESTINO_URL=http://localhost:4200
) else (
    echo   -> Modo Ligero Autónomo (Servido directamente por Python en puerto 8000).
    set DESTINO_URL=http://localhost:8000/sepam/
)

echo.
echo ==============================================================================
echo                       SISTEMA INICIADO EXITOSAMENTE
echo ==============================================================================
echo.
echo   * Consola de Mando Central (Esta Laptop):
echo     -> %DESTINO_URL%
echo.
echo   * Paramedicos y Celulares (Conectados al Wi-Fi o Hotspot):
echo     -> NO REQUIEREN ESCRIBIR IP: Pulsa el boton "🛰️ Red & QR" en la web
echo        y muestra el codigo QR para que apunten con su camara.
echo.
echo   * Base de Datos DuckDB + SQLite WAL:
echo     -> http://localhost:8000/api/estado
echo.
echo ==============================================================================
echo   Para cerrar el sistema por completo, cierra las ventanas de comando.
echo ==============================================================================
echo.

timeout /t 4 >nul
start %DESTINO_URL%
