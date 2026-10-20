import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface DiagnosticoRedBackend {
  so: string;
  modo_activo: string;
  mensaje_modo: string;
  ip_recomendada: string;
  cable_ethernet_conectado: boolean;
  hotspot_activo: boolean;
  wifi: {
    conectado: boolean;
    ssid: string;
    senal_porcentaje: number;
    velocidad_mbps: number;
  };
  interfaces: Array<{
    alias: string;
    ip: string;
    estado: string;
    es_apipa: boolean;
  }>;
  internet_disponible: boolean;
  latencia_internet_ms: number | null;
  servidor_oracle_online: boolean;
  latencia_oracle_ms: number | null;
  url_local_brigadistas: string;
  qr_local_base64: string;
  url_nube_brigadistas: string;
  qr_nube_base64: string;
}

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private http = inject(HttpClient);

  private get baseUrl(): string {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const serverParam = params.get('server');
      if (serverParam) {
        localStorage.setItem('sepam_server_host', serverParam.trim());
        return serverParam.trim();
      }
      const savedHost = localStorage.getItem('sepam_server_host');
      if (savedHost) return savedHost;
      if (window.location.protocol === 'capacitor:' || window.location.protocol === 'file:') {
        return 'http://192.168.137.1:8000';
      }
      if (window.location.port === '4200') {
        return `http://${window.location.hostname}:8000`;
      }
    }
    return '';
  }

  diagnostico = signal<DiagnosticoRedBackend | null>(null);
  cargando = signal(false);
  servidorOnline = signal(true);
  copiadoMensaje = signal<string | null>(null);

  // Permite elegir en el modal si mostrar el QR del Hotspot de la Laptop o el de la Nube
  modoQrSeleccionado = signal<'local' | 'nube'>('local');

  // URL real a la que deben conectarse los celulares en la misma red Hotspot / Wi-Fi
  urlOficial = computed(() => {
    const diag = this.diagnostico();
    if (this.modoQrSeleccionado() === 'local') {
      if (diag && diag.url_local_brigadistas) {
        if (typeof window !== 'undefined' && window.location.port === '4200' && diag.ip_recomendada !== 'localhost') {
          return `http://${diag.ip_recomendada}:4200/?modo=apk&server=http://${diag.ip_recomendada}:8000`;
        }
        return `${diag.url_local_brigadistas}?modo=apk&server=http://${diag.ip_recomendada}:8000`;
      }
      // Fallback por defecto para Hotspot de Windows 11 (192.168.137.1)
      return 'http://192.168.137.1:8000/sepam/?modo=apk';
    } else {
      return diag?.url_nube_brigadistas || 'https://sepam-mando-operativo.vercel.app/?modo=apk';
    }
  });

  // Código QR 100% Offline generado por el backend Python
  qrOficial = computed(() => {
    const diag = this.diagnostico();
    if (this.modoQrSeleccionado() === 'local' && diag?.qr_local_base64) {
      return diag.qr_local_base64;
    }
    if (this.modoQrSeleccionado() === 'nube' && diag?.qr_nube_base64) {
      return diag.qr_nube_base64;
    }
    const url = this.urlOficial();
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(url)}&color=07483b&bgcolor=ffffff&margin=1`;
  });

  constructor() {
    this.actualizarDiagnosticoRed();
  }

  actualizarDiagnosticoRed() {
    this.cargando.set(true);
    this.http.get<DiagnosticoRedBackend>(`${this.baseUrl}/api/red/diagnostico`).subscribe({
      next: (data) => {
        this.diagnostico.set(data);
        this.servidorOnline.set(true);
        this.cargando.set(false);
      },
      error: () => {
        this.servidorOnline.set(false);
        this.cargando.set(false);
      }
    });
  }

  copiarTexto(texto: string, etiqueta: string = 'Enlace copiado') {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(texto).then(() => {
        this.copiadoMensaje.set(`${etiqueta} al portapapeles`);
        setTimeout(() => this.copiadoMensaje.set(null), 3000);
      }).catch(() => {
        this.copiadoMensaje.set(`Copiado: ${texto}`);
        setTimeout(() => this.copiadoMensaje.set(null), 3000);
      });
    }
  }
}
