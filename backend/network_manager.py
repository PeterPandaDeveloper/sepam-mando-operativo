import os
import re
import socket
import subprocess
import time
import io
import base64
import platform
from typing import Dict, Any, List, Optional
import qrcode

IS_WINDOWS = platform.system() == "Windows"
IS_LINUX = platform.system() == "Linux"

def test_tcp_port(host: str, port: int, timeout: float = 1.5):
    """Prueba rápida de conectividad TCP y medición de latencia"""
    t0 = time.time()
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(timeout)
        s.connect((host, port))
        s.close()
        return True, round((time.time() - t0) * 1000, 1)
    except Exception:
        return False, None

def generar_qr_base64(url: str) -> str:
    """Genera un código QR nítido en formato Base64 Data URI"""
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_M,
            box_size=10,
            border=2,
        )
        qr.add_data(url)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#07483b", back_color="#ffffff")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        b64 = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/png;base64,{b64}"
    except Exception as e:
        print(f"Error generando QR: {e}")
        return ""

def obtener_info_wifi_netsh() -> Dict[str, Any]:
    """Obtiene SSID y calidad de señal Wi-Fi usando netsh (bilingüe Español / Inglés)"""
    info = {
        "conectado": False,
        "ssid": "",
        "senal_porcentaje": 0,
        "velocidad_mbps": 0
    }
    if not IS_WINDOWS:
        return info

    try:
        res = subprocess.run(["netsh", "wlan", "show", "interfaces"], capture_output=True, text=True, timeout=3)
        salida = res.stdout
        
        # Soportar 'State : connected' y 'Estado : conectado'
        estado_match = re.search(r"(?:State|Estado)\s*:\s*([^\r\n]+)", salida, re.IGNORECASE)
        if estado_match:
            val_estado = estado_match.group(1).strip().lower()
            if any(term in val_estado for term in ["connected", "conectado", "asociado"]):
                info["conectado"] = True
            
        ssid_match = re.search(r"SSID\s*:\s*([^\r\n]+)", salida, re.IGNORECASE)
        if ssid_match:
            info["ssid"] = ssid_match.group(1).strip()
            
        # Soportar 'Signal : 98%' y 'Señal : 98%'
        signal_match = re.search(r"(?:Signal|Señal)\s*:\s*(\d+)%", salida, re.IGNORECASE)
        if signal_match:
            info["senal_porcentaje"] = int(signal_match.group(1))
            
        # Soportar 'Receive rate (Mbps)' y 'Velocidad de recepción (Mbps)'
        rx_match = re.search(r"(?:Receive rate|Velocidad de recepción).*:\s*([\d\.]+)", salida, re.IGNORECASE)
        if rx_match:
            info["velocidad_mbps"] = float(rx_match.group(1))
    except Exception as e:
        print(f"Nota: netsh wlan no disponible o en reposo: {e}")
    return info

def obtener_interfaces_sistema() -> List[Dict[str, Any]]:
    """Obtiene interfaces de red con soporte multiplataforma Windows (PowerShell) y Linux (Socket/IP)"""
    interfaces = []

    if IS_WINDOWS:
        try:
            cmd = [
                "powershell",
                "-NoProfile",
                "-Command",
                "Get-NetIPAddress -AddressFamily IPv4 | Select-Object InterfaceAlias, IPAddress, @{Name='AddressState'; Expression={$_.AddressState.ToString()}} | ConvertTo-Json"
            ]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=4)
            import json
            salida = res.stdout.strip()
            if salida:
                datos = json.loads(salida)
                if isinstance(datos, dict):
                    datos = [datos]
                for d in datos:
                    alias = str(d.get("InterfaceAlias", ""))
                    ip = str(d.get("IPAddress", ""))
                    state = str(d.get("AddressState", "")).lower()
                    if ip == "127.0.0.1":
                        continue
                    interfaces.append({
                        "alias": alias,
                        "ip": ip,
                        "estado": state,
                        "es_apipa": ip.startswith("169.254.")
                    })
                return interfaces
        except Exception as e:
            print(f"Error PowerShell fallback: {e}")

    # Fallback universal (Linux / Windows sin PowerShell)
    try:
        hostname = socket.gethostname()
        _, _, ip_list = socket.gethostbyname_ex(hostname)
        for idx, ip in enumerate(ip_list):
            if ip != "127.0.0.1" and not ip.startswith("169.254."):
                interfaces.append({
                    "alias": f"eth{idx}" if IS_LINUX else f"Interfaz {idx+1}",
                    "ip": ip,
                    "estado": "preferred",
                    "es_apipa": False
                })
    except Exception as e:
        print(f"Error socket fallback: {e}")

    return interfaces

def diagnostico_red_completo() -> Dict[str, Any]:
    """Realiza un diagnóstico integral de red y devuelve estado, URLs y códigos QR"""
    wifi_info = obtener_info_wifi_netsh()
    interfaces = obtener_interfaces_sistema()
    
    # 1. Analizar interfaces clave
    ip_hotspot = None
    ip_ethernet = None
    ip_wifi = None
    ip_otras = []
    
    cable_ethernet_conectado = False
    hotspot_activo = False
    
    for iface in interfaces:
        alias = iface["alias"].lower()
        ip = iface["ip"]
        state = str(iface["estado"]).lower()
        es_valida = not iface["es_apipa"] and ("preferred" in state or state == "4")
        
        if ip == "192.168.137.1" or "local area connection" in alias:
            if ip == "192.168.137.1":
                hotspot_activo = True
                ip_hotspot = ip
        elif "ethernet" in alias and "vmware" not in alias and "vpn" not in alias:
            if es_valida:
                cable_ethernet_conectado = True
                ip_ethernet = ip
        elif "wi-fi" in alias or "wifi" in alias or "inalámb" in alias:
            if es_valida:
                ip_wifi = ip
        else:
            if es_valida and not alias.startswith("vmware") and not alias.startswith("radmin") and not alias.startswith("zerotier"):
                ip_otras.append(ip)

    # 2. Pruebas de conectividad externa
    internet_ok, lat_internet = test_tcp_port("8.8.8.8", 53, timeout=1.5)
    if not internet_ok:
        internet_ok, lat_internet = test_tcp_port("1.1.1.1", 53, timeout=1.5)

    oracle_ok, lat_oracle = test_tcp_port("150.136.238.32", 80, timeout=2.0)
    
    # 3. Determinar mejor IP y Modo de Operación
    modo_activo = "OFFLINE"
    ip_recomendada = "150.136.238.32" if IS_LINUX else "localhost"
    mensaje_modo = ""
    
    if IS_LINUX:
        modo_activo = "NUBE_SERVER"
        ip_recomendada = "150.136.238.32"
        mensaje_modo = "Operando en Servidor Cloud Linux (Oracle Cloud)"
    elif hotspot_activo and ip_hotspot:
        modo_activo = "HOTSPOT_WINDOWS"
        ip_recomendada = ip_hotspot
        mensaje_modo = "Zona con cobertura Wi-Fi directa desde la Laptop"
    elif cable_ethernet_conectado and ip_ethernet:
        modo_activo = "ROUTER_TPLINK_ETHERNET"
        ip_recomendada = ip_ethernet
        mensaje_modo = "Conectado a Router dedicado por cable Ethernet"
    elif ip_wifi:
        modo_activo = "WIFI_LOCAL"
        ip_recomendada = ip_wifi
        mensaje_modo = "Conectado a la red Wi-Fi del Estadio / Recinto"
    elif ip_otras:
        modo_activo = "RED_LOCAL_GENERICA"
        ip_recomendada = ip_otras[0]
        mensaje_modo = "Conectado a interfaz de red secundaria"
    else:
        modo_activo = "LOCAL_SOLO_ESTE_EQUIPO"
        ip_recomendada = "localhost"
        mensaje_modo = "Sin red detectada. Operando en modo local"

    # 4. URLs para los brigadistas y QR
    puerto_web = 80 if IS_LINUX else 8000
    url_local = f"http://{ip_recomendada}:{puerto_web}/sepam/" if not IS_LINUX else "http://150.136.238.32/sepam/"
    url_nube = "https://sepam-mando-operativo.vercel.app"
    
    qr_local_b64 = generar_qr_base64(url_local)
    qr_nube_b64 = generar_qr_base64(url_nube)
    
    return {
        "so": platform.system(),
        "modo_activo": modo_activo,
        "mensaje_modo": mensaje_modo,
        "ip_recomendada": ip_recomendada,
        "cable_ethernet_conectado": cable_ethernet_conectado,
        "hotspot_activo": hotspot_activo,
        "wifi": wifi_info,
        "interfaces": interfaces,
        "internet_disponible": internet_ok,
        "latencia_internet_ms": lat_internet,
        "servidor_oracle_online": oracle_ok,
        "latencia_oracle_ms": lat_oracle,
        "url_local_brigadistas": url_local,
        "qr_local_base64": qr_local_b64,
        "url_nube_brigadistas": url_nube,
        "qr_nube_base64": qr_nube_b64
    }
