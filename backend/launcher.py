import os
import sys
import time
import socket
import webbrowser
import subprocess

def test_port(port: int, host: str = "127.0.0.1") -> bool:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.5)
        s.connect((host, port))
        s.close()
        return True
    except Exception:
        return False

def main():
    print("=" * 70)
    print("    SEPAM ECUADOR - SISTEMA DE MANDO Y OPERACION PREHOSPITALARIA")
    print("            AUTO-DETECCION PLUG & PLAY Y SERVIDOR TACTICO")
    print("=" * 70)
    print()

    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(base_dir)

    # 1. Iniciar Backend si no está corriendo
    if not test_port(8000):
        print("[1/2] Iniciando Servidor SEPAM (DuckDB + SQLite WAL + Red)...")
        main_py = os.path.join(base_dir, "main.py")
        subprocess.Popen([sys.executable, main_py], cwd=base_dir, creationflags=subprocess.CREATE_NEW_CONSOLE)
        
        # Esperar a que el puerto 8000 esté listo
        for _ in range(15):
            time.sleep(0.5)
            if test_port(8000):
                print("      -> Servidor Operacional en puerto 8000.")
                break
    else:
        print("[1/2] Servidor SEPAM ya se encuentra activo en puerto 8000.")

    # 2. Determinar URL óptima
    url_destino = "http://localhost:8000/sepam/"
    if test_port(4200):
        url_destino = "http://localhost:4200"

    print(f"[2/2] Abriendo Consola de Mando en el Navegador ({url_destino})...")
    time.sleep(1)
    webbrowser.open(url_destino)

    print()
    print("=" * 70)
    print("  SISTEMA SEPAM ACTIVO Y LISTO PARA OPERAR EN EL ESTADIO")
    print("=" * 70)
    print("  * En la pantalla de la laptop, pulsa el boton '🛰️ Red & QR'")
    print("  * Muestra el Codigo QR a los brigadistas para que entren sin teclear nada.")
    print("  * Para cerrar el sistema, cierra esta ventana.")
    print("=" * 70)
    print()

if __name__ == "__main__":
    main()
