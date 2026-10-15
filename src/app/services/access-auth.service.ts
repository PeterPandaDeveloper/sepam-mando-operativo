import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface RespuestaVerificacion {
  valido: boolean;
  mensaje: string;
  expira_en_segundos: number;
  expira_at_timestamp?: number;
  hora_expira?: string;
  clave?: string;
  datos?: any;
}

export interface RespuestaGeneracion {
  mensaje: string;
  clave: string;
  expira_en_segundos: number;
  expira_at_timestamp: number;
  hora_expira: string;
  fecha_expira: string;
  enlace_directo: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccessAuthService implements OnDestroy {
  private http = inject(HttpClient);

  // URL dinámica del backend (en Vercel usa proxy /api, en local usa localhost:8000)
  private get baseUrl(): string {
    if (typeof window !== 'undefined' && window.location.port === '4200') {
      return `http://${window.location.hostname}:8000`;
    }
    return '';
  }

  // Estado reactivo del Gatekeeper de 2 Horas
  accesoAutorizado = signal<boolean>(false);
  claveActiva = signal<string | null>(null);
  expiraAtTimestamp = signal<number | null>(null);
  segundosRestantes = signal<number>(0);
  cargando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  // Tiempo restante legible para badges y reloj táctico (ej. "01:58:32")
  tiempoRestanteFormateado = computed(() => {
    const totalSegundos = this.segundosRestantes();
    if (totalSegundos <= 0) return '00:00:00';
    const h = Math.floor(totalSegundos / 3600);
    const m = Math.floor((totalSegundos % 3600) / 60);
    const s = totalSegundos % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  });

  private intervalTimer: any = null;

  constructor() {
    this.inicializarAutenticacion();
  }

  ngOnDestroy() {
    this.detenerTimer();
  }

  private inicializarAutenticacion() {
    if (typeof window === 'undefined') return;

    // 1. Revisar si viene una clave en la URL: ?key=SEPAM-... o ?clave=...
    const urlParams = new URLSearchParams(window.location.search);
    const keyParam = urlParams.get('key') || urlParams.get('clave');

    if (keyParam) {
      // Limpiar el parámetro de la URL para que no quede expuesto en el historial
      try {
        const urlSinKey = window.location.pathname;
        window.history.replaceState({}, document.title, urlSinKey);
      } catch {}

      this.verificarClave(keyParam.trim());
      return;
    }

    // 2. Si no viene en URL, revisar sesión persistida en localStorage
    const savedKey = localStorage.getItem('sepam_pmu_access_key');
    const savedExpira = localStorage.getItem('sepam_pmu_access_expira_at');

    if (savedKey && savedExpira) {
      const expiraMs = parseInt(savedExpira, 10);
      const ahora = Date.now();
      const restantes = Math.floor((expiraMs - ahora) / 1000);

      if (restantes > 0) {
        // Clave aún viva en caché local: verificar con backend en background
        this.claveActiva.set(savedKey);
        this.expiraAtTimestamp.set(expiraMs);
        this.segundosRestantes.set(restantes);
        this.accesoAutorizado.set(true);
        this.iniciarTimer();

        // Verificación rápida en backend silenciosa
        this.http.post<RespuestaVerificacion>(`${this.baseUrl}/api/auth/verificar-key`, { key: savedKey }).subscribe({
          next: (res) => {
            if (res.valido) {
              this.segundosRestantes.set(res.expira_en_segundos);
              if (res.expira_at_timestamp) {
                this.expiraAtTimestamp.set(res.expira_at_timestamp);
                localStorage.setItem('sepam_pmu_access_expira_at', res.expira_at_timestamp.toString());
              }
            } else {
              this.cerrarSesionAcceso('Tu clave ha sido revocada o expiró en el servidor.');
            }
          },
          error: () => {
            // Mantener sesión offline si el servidor no responde momentáneamente
          }
        });
      } else {
        this.cerrarSesionAcceso();
      }
    }
  }

  verificarClave(clave: string, onSuccess?: () => void) {
    if (!clave || !clave.trim()) {
      this.errorMensaje.set('Por favor ingresa la clave de acceso de 2 horas provista por Telegram.');
      return;
    }

    this.cargando.set(true);
    this.errorMensaje.set(null);

    const claveNormalizada = clave.trim();

    this.http.post<RespuestaVerificacion>(`${this.baseUrl}/api/auth/verificar-key`, { key: claveNormalizada }).subscribe({
      next: (res) => {
        this.cargando.set(false);
        if (res.valido) {
          const expiraMs = res.expira_at_timestamp || (Date.now() + (res.expira_en_segundos * 1000));
          this.claveActiva.set(claveNormalizada);
          this.expiraAtTimestamp.set(expiraMs);
          this.segundosRestantes.set(res.expira_en_segundos);
          this.accesoAutorizado.set(true);
          this.errorMensaje.set(null);

          // Guardar en almacenamiento local
          if (typeof window !== 'undefined') {
            localStorage.setItem('sepam_pmu_access_key', claveNormalizada);
            localStorage.setItem('sepam_pmu_access_expira_at', expiraMs.toString());
          }

          this.iniciarTimer();
          this.reproducirAudioDesbloqueo();

          if (onSuccess) onSuccess();
        } else {
          this.errorMensaje.set(res.mensaje || 'Clave de acceso incorrecta o expirada.');
          this.reproducirAudioError();
        }
      },
      error: (err) => {
        this.cargando.set(false);
        // Fallback para Clave Maestra en caso de corte total de internet
        if (claveNormalizada === 'SEPAM-MASTER-2026!$%' || claveNormalizada === 'MASTER2026') {
          const dosHorasMs = Date.now() + (7200 * 1000);
          this.claveActiva.set(claveNormalizada);
          this.expiraAtTimestamp.set(dosHorasMs);
          this.segundosRestantes.set(7200);
          this.accesoAutorizado.set(true);
          this.iniciarTimer();
          if (typeof window !== 'undefined') {
            localStorage.setItem('sepam_pmu_access_key', claveNormalizada);
            localStorage.setItem('sepam_pmu_access_expira_at', dosHorasMs.toString());
          }
          if (onSuccess) onSuccess();
          return;
        }

        this.errorMensaje.set('No se pudo validar con el servidor. Verifica tu conexión o intenta de nuevo.');
        this.reproducirAudioError();
      }
    });
  }

  generarClaveEmergencia(solicitadoPor: string = 'SuperAdmin PMU') {
    return this.http.post<RespuestaGeneracion>(`${this.baseUrl}/api/auth/generar-key`, {
      solicitado_por: solicitadoPor,
      duracion_horas: 2
    });
  }

  cerrarSesionAcceso(motivo?: string) {
    this.detenerTimer();
    this.accesoAutorizado.set(false);
    this.claveActiva.set(null);
    this.expiraAtTimestamp.set(null);
    this.segundosRestantes.set(0);

    if (typeof window !== 'undefined') {
      localStorage.removeItem('sepam_pmu_access_key');
      localStorage.removeItem('sepam_pmu_access_expira_at');
    }

    if (motivo) {
      this.errorMensaje.set(motivo);
    }
  }

  private iniciarTimer() {
    this.detenerTimer();
    this.intervalTimer = setInterval(() => {
      const exp = this.expiraAtTimestamp();
      if (!exp) return;
      const restantes = Math.floor((exp - Date.now()) / 1000);

      if (restantes <= 0) {
        this.cerrarSesionAcceso('Tu sesión de 2 horas ha expirado. Por favor genera una nueva clave en Telegram.');
        this.reproducirAudioError();
      } else {
        this.segundosRestantes.set(restantes);
      }
    }, 1000);
  }

  private detenerTimer() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
  }

  private reproducirAudioDesbloqueo() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  }

  private reproducirAudioError() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(150, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }
}
