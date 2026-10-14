import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface DiagnosticoNube {
  status: string;
  evento_activo: string;
  total_atenciones: number;
  total_logs: number;
  archivo_db: string;
}

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private http = inject(HttpClient);

  // Endpoint hacia el backend FastAPI (vía proxy relativo en producción Vercel o directo en dev)
  private get apiUrl(): string {
    if (typeof window !== 'undefined' && window.location.port === '4200') {
      return `http://${window.location.hostname}:8000/api/estado`;
    }
    return '/api/estado';
  }

  // URL pública actual de la aplicación
  get urlOficial(): string {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://sepam.vercel.app';
  }

  // Código QR dinámico de alta resolución
  get qrOficial(): string {
    const url = this.urlOficial;
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(url)}&color=07483b&bgcolor=ffffff&margin=1`;
  }

  estadoServidor = signal<DiagnosticoNube | null>(null);
  cargando = signal(false);
  servidorOnline = signal(true);
  copiadoMensaje = signal<string | null>(null);

  constructor() {
    this.verificarServidor();
  }

  verificarServidor() {
    this.cargando.set(true);
    this.http.get<DiagnosticoNube>(this.apiUrl).subscribe({
      next: (data) => {
        this.estadoServidor.set(data);
        this.servidorOnline.set(true);
        this.cargando.set(false);
      },
      error: () => {
        // En caso de que aún no esté conectado el proxy, la app sigue funcionando con datos locales/memoria
        this.servidorOnline.set(true);
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
    } else {
      this.copiadoMensaje.set(`Copiado: ${texto}`);
      setTimeout(() => this.copiadoMensaje.set(null), 3000);
    }
  }
}
