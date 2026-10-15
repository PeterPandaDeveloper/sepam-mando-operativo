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
  fuente?: string;
}

export interface RedisAlerta {
  id: string;
  codigo: string;
  triage_color: string;
  sector_nombre: string;
  paciente_nombre: string;
  motivo: string;
  derivacion: string;
  hora: string;
  tipo_alerta: string;
}

export interface EstadoBackend {
  status: string;
  evento_activo: string;
  total_atenciones: number;
  total_logs: number;
  motores?: {
    oltp: string;
    olap: string;
    nosql: string;
  };
  redis?: {
    estado: string;
    motor: string;
    version?: string;
    memoria_usada?: string;
    canales_pubsub?: string;
    rol?: string;
  };
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
  
  // Estado de persistencia políglota
  motoresInfo = signal<{ oltp: string; olap: string; nosql: string }>({
    oltp: 'SQLite 3 (WAL)',
    olap: 'DuckDB 1.5',
    nosql: 'Redis 7 (Verificando...)'
  });
  redisOnline = signal(false);
  redisDetalle = signal<any>(null);

  // Alertas en tiempo real vía Redis NoSQL
  alertasRecientes = signal<RedisAlerta[]>([]);
  alertaActiva = signal<RedisAlerta | null>(null);
  private lastAlertId: string | null = null;
  private intervaloPolling: any = null;

  constructor() {
    this.verificarConexion();
    this.iniciarMonitorAlertas();
  }

  verificarConexion() {
    this.http.get<EstadoBackend>(`${this.baseUrl}/api/estado`).subscribe({
      next: (res) => {
        if (res.status === 'ONLINE') {
          this.conectado.set(true);
          if (res.motores) {
            this.motoresInfo.set(res.motores);
          }
          if (res.redis) {
            this.redisOnline.set(res.redis.estado === 'ONLINE');
            this.redisDetalle.set(res.redis);
          }
          this.cargarResumenDuckDB();
        }
      },
      error: () => {
        this.conectado.set(false);
        this.redisOnline.set(false);
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

  iniciarMonitorAlertas() {
    if (typeof window === 'undefined') return;
    // Polling ligero cada 4 segundos a la lista en memoria de Redis
    this.intervaloPolling = setInterval(() => {
      this.consultarAlertasRedis();
    }, 4000);
  }

  consultarAlertasRedis() {
    this.http.get<RedisAlerta[]>(`${this.baseUrl}/api/alertas/recientes?limite=10`).subscribe({
      next: (alertas) => {
        this.alertasRecientes.set(alertas);
        if (alertas && alertas.length > 0) {
          const masReciente = alertas[0];
          if (this.lastAlertId !== masReciente.id) {
            this.lastAlertId = masReciente.id;
            this.alertaActiva.set(masReciente);
            this.reproducirChimeAlerta();
          }
        }
      },
      error: () => {
        // Fallback silencioso si no hay conexión
      }
    });
  }

  cerrarAlertaActiva() {
    this.alertaActiva.set(null);
  }

  probarSimulacroAlerta() {
    this.http.post(`${this.baseUrl}/api/alertas/test`, {}).subscribe({
      next: () => {
        this.consultarAlertasRedis();
      }
    });
  }

  reproducirChimeAlerta() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 (tono de alarma médica)
      osc.frequency.exponentialRampToValueAtTime(587.33, audioCtx.currentTime + 0.35); // D5
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      // Ignorar si el navegador bloquea audio sin interacción previa
    }
  }

  descargarExcel() {
    window.open(`${this.baseUrl}/api/reportes/excel`, '_blank');
  }

  descargarCSV() {
    window.open(`${this.baseUrl}/api/reportes/csv`, '_blank');
  }
}
