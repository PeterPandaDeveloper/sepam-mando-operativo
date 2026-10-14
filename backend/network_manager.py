import os
import re
import socket
import subprocess
import time
import io
import base64
from typing import Dict, Any, List, Optional
import qrcode

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
    """Obtiene SSID y calidad de señal Wi-Fi usando netsh"""
    info = {
        "conectado": False,
        "ssid": "",
        "senal_porcentaje": 0,
        "velocidad_mbps": 0
    }
    try:
        res = subprocess.run(["netsh", "wlan", "show", "interfaces"], capture_output=True, text=True, timeout=3)
        salida = res.stdout
        
        estado_match = re.search(r"State\s*:\s*(\w+)", salida)
        if estado_match and estado_match.group(1).lower() == "connected":
            info["conectado"] = True
            
        ssid_match = re.search(r"SSID\s*:\s*(.+)", salida)
        if ssid_match:
            info["ssid"] = ssid_match.group(1).strip()
            
        signal_match = re.search(r"Signal\s*:\s*(\d+)%", salida)
        if signal_match:
            info["senal_porcentaje"] = int(signal_match.group(1))
            
        rx_match = re.search(r"Receive rate \(Mbps\)\s*:\s*([\d\.]+)", salida)
        if rx_match:
            info["velocidad_mbps"] = float(rx_match.group(1))
    except Exception as e:
        print(f"Error netsh wlan: {e}")
    return info

def obtener_interfaces_powershell() -> List[Dict[str, Any]]:
    """Obtiene las interfaces de red activas con Get-NetIPAddress de PowerShell"""
    interfaces = []
    try:
        cmd = [
            "powershell",
            "-NoProfile",
            "-Command",
            "Get-NetIPAddress -AddressFamily IPv4 | Select-Object InterfaceAlias, IPAddress, @{Name='AddressState'; Expression={$_.AddressState.ToString()}} | ConvertTo-Json"
        ]
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=5)
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
                
                # Ignorar loopbacks
                if ip == "127.0.0.1":
                    continue
                    
                interfaces.append({
                    "alias": alias,
                    "ip": ip,
                    "estado": state,
                    "es_apipa": ip.startswith("169.254.")
                })
    except Exception as e:
        print(f"Error Get-NetIPAddress: {e}")
    return interfaces

def diagnostico_red_completo() -> Dict[str, Any]:
    """Realiza un diagnóstico integral de red y devuelve estado, URLs y códigos QR"""
    wifi_info = obtener_info_wifi_netsh()
    interfaces = obtener_interfaces_powershell()
    
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
        
        # Detección de Hotspot de Windows (IP por defecto de Windows Mobile Hotspot es 192.168.137.1)
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
    ip_recomendada = "localhost"
    mensaje_modo = ""
    
    if hotspot_activo and ip_hotspot:
        modo_activo = "HOTSPOT_WINDOWS"
        ip_recomendada = ip_hotspot
        mensaje_modo = "Zona con cobertura móvil de Windows activa (Hotspot propio de la laptop)"
    elif cable_ethernet_conectado and ip_ethernet:
        modo_activo = "ROUTER_TPLINK_ETHERNET"
        ip_recomendada = ip_ethernet
        mensaje_modo = "Conectado por cable Ethernet al Router TP-Link (Máximo alcance ~100m)"
    elif ip_wifi:
        modo_activo = "WIFI_LOCAL"
        ip_recomendada = ip_wifi
        mensaje_modo = f"Conectado a red Wi-Fi: {wifi_info['ssid'] or 'Red Local'}"
    elif ip_otras:
        modo_activo = "OTRA_RED"
        ip_recomendada = ip_otras[0]
        mensaje_modo = f"Conectado mediante interfaz local ({ip_recomendada})"
    else:
        modo_activo = "SOLO_LOCAL"
        ip_recomendada = "127.0.0.1"
        mensaje_modo = "Sin conexión de red externa detectada (Operando en modo autónomo)"

    # 4. URLs de Acceso para Brigadistas
    puerto_4200_activo, _ = test_tcp_port("127.0.0.1", 4200, timeout=0.3)
    puerto_frontend = 4200 if puerto_4200_activo else 8000
    url_local_brigadistas = f"http://{ip_recomendada}:{puerto_frontend}"
    url_nube_brigadistas = "http://150.136.238.32/sepam/"
    url_mando_central = f"http://localhost:{puerto_frontend}"
    
    # 5. Generar Códigos QR
    qr_local_b64 = generar_qr_base64(url_local_brigadistas)
    qr_nube_b64 = generar_qr_base64(url_nube_brigadistas)

    # 6. Diagnóstico y Recomendaciones para el Padre
    checklist = []
    
    if hotspot_activo:
        checklist.append({
            "tipo": "exito",
            "titulo": "Zona con Cobertura Móvil Activa",
            "detalle": f"La laptop está emitiendo su propia red Wi-Fi. Los brigadistas deben conectarse al Wi-Fi de esta laptop."
        })
    else:
        checklist.append({
            "tipo": "info",
            "titulo": "Hotspot de Windows No Detectado",
            "detalle": "Si no vas a usar router, puedes activar 'Zona con cobertura' en Windows 11 para emitir Wi-Fi desde la laptop."
        })

    if cable_ethernet_conectado:
        checklist.append({
            "tipo": "exito",
            "titulo": "Router TP-Link Detectado por Ethernet",
            "detalle": f"Cable de red conectado correctamente. IP del enlace: {ip_ethernet}. Cobertura táctica de 100m activa."
        })
    else:
        checklist.append({
            "tipo": "aviso",
            "titulo": "Cable Ethernet Desconectado",
            "detalle": "Si vas a operar con el router TP-Link, conecta el cable amarillo desde la laptop al puerto WAN (azul) del router."
        })

    if internet_ok:
        checklist.append({
            "tipo": "exito",
            "titulo": "Salida a Internet Activa (WhatsApp Operativo)",
            "detalle": f"Latencia: {lat_internet} ms. Los brigadistas mantendrán WhatsApp, llamadas y fotos funcionando sin interrupción."
        })
    else:
        checklist.append({
            "tipo": "aviso",
            "titulo": "Sin Conexión a Internet (Operativo Autónomo)",
            "detalle": "El sistema SEPAM funcionará al 100% en red local, pero los celulares no tendrán WhatsApp hasta tener salida a internet."
        })

    if oracle_ok:
        checklist.append({
            "tipo": "exito",
            "titulo": "Servidor Nube Oracle Conectado",
            "detalle": f"Sincronización en la nube lista en 150.136.238.32 ({lat_oracle} ms)."
        })
    else:
        checklist.append({
            "tipo": "info",
            "titulo": "Servidor Nube Oracle Inaccesible en este momento",
            "detalle": "Normal si no hay internet o si el túnel está cerrado. La base de datos local DuckDB + SQLite registrará todo."
        })

    return {
        "timestamp": time.strftime("%H:%M:%S"),
        "modo_activo": modo_activo,
        "mensaje_modo": mensaje_modo,
        "ip_recomendada": ip_recomendada,
        "url_local_brigadistas": url_local_brigadistas,
        "url_nube_brigadistas": url_nube_brigadistas,
        "url_mando_central": url_mando_central,
        "qr_local_base64": qr_local_b64,
        "qr_nube_base64": qr_nube_b64,
        "wifi": wifi_info,
        "ethernet": {
            "conectado": cable_ethernet_conectado,
            "ip": ip_ethernet
        },
        "hotspot": {
            "activo": hotspot_activo,
            "ip": ip_hotspot
        },
        "internet": {
            "activo": internet_ok,
            "latencia_ms": lat_internet,
            "whatsapp_seguro": internet_ok
        },
        "oracle_cloud": {
            "activo": oracle_ok,
            "latencia_ms": lat_oracle,
            "ip": "150.136.238.32"
        },
        "interfaces_todas": interfaces,
        "checklist": checklist
    }

if __name__ == "__main__":
    diag = diagnostico_red_completo()
    print("Modo activo:", diag["modo_activo"])
    print("URL Local:", diag["url_local_brigadistas"])
    print("QR Local longitud:", len(diag["qr_local_base64"]))
    print("Internet:", diag["internet"])
