import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EmergencyService } from './emergency.service';

export interface DuckDBResumen {
  triage: {
    total_atenciones: number;
    rojos: number;
    amarillos: number;
    verdes: number;
    negros: number;
    traslados_ambulancia: number;
    altas_en_sitio: number;
    derivados_acv: number;
    edad_promedio: number;
  };
  sectores: Array<{
    sector_nombre: string;
    atenciones: number;
    criticos: number;
  }>;
  curva_horaria: Array<{
    hora: string;
    total: number;
    rojo: number;
    amarillo: number;
    verde: number;
  }>;
  total_logs: number;
}

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private http = inject(HttpClient);
  private emergency = inject(EmergencyService);

  // Determinar URL del backend dinámicamente (en Vercel / Cloud usa proxy relativo '')
  private get baseUrl(): string {
    if (typeof window !== 'undefined' && window.location.port === '4200') {
      return `http://${window.location.hostname}:8000`;
    }
    return '';
  }

  conectado = signal(false);
  cargando = signal(false);
  resumenAnalitico = signal<DuckDBResumen | null>(null);

  constructor() {
    this.verificarConexion();
  }

  verificarConexion() {
    this.http.get<{ status: string; total_atenciones: number }>(`${this.baseUrl}/api/estado`).subscribe({
      next: (res) => {
        if (res.status === 'ONLINE') {
          this.conectado.set(true);
          this.cargarResumenDuckDB();
        }
      },
      error: () => {
        this.conectado.set(false);
      }
    });
  }

  cargarResumenDuckDB() {
    this.cargando.set(true);
    this.http.get<DuckDBResumen>(`${this.baseUrl}/api/analitica/resumen`).subscribe({
      next: (data) => {
        this.resumenAnalitico.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.warn('No se pudo cargar métricas de DuckDB:', err);
        this.cargando.set(false);
      }
    });
  }

  descargarExcel() {
    window.open(`${this.baseUrl}/api/reportes/excel`, '_blank');
  }

  descargarCSV() {
    window.open(`${this.baseUrl}/api/reportes/csv`, '_blank');
  }
}
