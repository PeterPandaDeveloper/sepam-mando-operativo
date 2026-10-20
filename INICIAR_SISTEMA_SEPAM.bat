@echo off
title SEPAM - Puesto de Mando Unificado (Hotspot LAN + Servidor)
color 0A
cls

echo ==============================================================================
echo        SEPAM ECUADOR - SISTEMA DE MANDO Y OPERACION PREHOSPITALARIA
echo             RED MADRE HOTSPOT MOVIL + SERVIDOR EN TIEMPO REAL
echo ==============================================================================
echo.

echo [1/4] Habilitando paso de mensajes en Firewall para celulares del Hotspot...
netsh advfirewall firewall show rule name="SEPAM_HOTSPOT_8000" >nul 2>&1
if %errorlevel% neq 0 (
    netsh advfirewall firewall add rule name="SEPAM_HOTSPOT_8000" dir=in action=allow protocol=TCP localport=8000 >nul 2>&1
    netsh advfirewall firewall add rule name="SEPAM_HOTSPOT_4200" dir=in action=allow protocol=TCP localport=4200 >nul 2>&1
    echo   -> Reglas de red local para celulares (Puertos 8000 y 4200) listas.
) else (
    echo   -> Permisos de red Hotspot verificados: OK.
)

echo.
echo [2/4] Verificando entorno Python...
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python no esta instalado o no esta en el PATH.
    pause
    exit /b
)

echo.
echo [3/4] Iniciando Servidor Central SEPAM (0.0.0.0:8000)...
cd /d "%~dp0backend"
start "SEPAM Backend (Hotspot LAN + SQLite WAL + DuckDB)" cmd /k "python main.py"

timeout /t 2 >nul

echo.
echo [4/4] Iniciando Consola Web del Puesto de Mando...
where npm >nul 2>&1
if %errorlevel% equ 0 (
    cd /d "%~dp0"
    start "SEPAM Frontend (Abierto a Red Hotspot 0.0.0.0)" cmd /k "npm start -- --host 0.0.0.0 --port 4200"
    set DESTINO_URL=http://localhost:4200
) else (
    set DESTINO_URL=http://localhost:8000/sepam/
)

echo.
echo ==============================================================================
echo             SISTEMA ACTIVO Y LISTO PARA CONECTAR CELULARES
echo ==============================================================================
echo   1. Enciende la "Zona con cobertura movil" (Hotspot) en Windows 11.
echo   2. Conecta los celulares al Wi-Fi que emite esta laptop.
echo   3. En la pantalla que se abrira, toca "Conectar Celulares (QR)".
echo ==============================================================================
echo.

timeout /t 4 >nul
start %DESTINO_URL%
