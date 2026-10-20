import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EmergencyService } from './emergency.service';

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
  private emergency = inject(EmergencyService);

  // Soporta Web, LAN y futura APK (apuntando al servidor central si corre en móvil empaquetado)
  private get baseUrl(): string {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const serverParam = params.get('server');
      if (serverParam) {
        localStorage.setItem('sepam_server_host', serverParam.trim());
        return serverParam.trim();
      }

      const savedHost = localStorage.getItem('sepam_server_host');
      if (savedHost) {
        return savedHost;
      }

      if (window.location.protocol === 'capacitor:' || window.location.protocol === 'file:') {
        return 'http://192.168.137.1:8000';
      }

      if (window.location.port === '4200') {
        return `http://${window.location.hostname}:8000`;
      }
    }
    return '';
  }

  accesoAutorizado = signal<boolean>(false);
  claveActiva = signal<string | null>(null);
  expiraAtTimestamp = signal<number | null>(null);
  segundosRestantes = signal<number>(0);
  cargando = signal<boolean>(false);
  errorMensaje = signal<string | null>(null);

  // Detecta si se está ejecutando como App Móvil / APK de Brigadista
  esModoApkBrigadista = signal<boolean>(false);

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

  private activarSuperUsuarioAutomatico() {
    // Al desbloquear con clave de Telegram (2h) o Clave Maestra, otorga control total sin segundo login
    const adminPrincipal = this.emergency.superUsuarios()[0];
    if (adminPrincipal) {
      this.emergency.setUsuarioSesion(adminPrincipal);
    }
  }

  private inicializarAutenticacion() {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    
    // Si entra desde el QR o APK (?modo=apk), habilitar interfaz limpia de brigadista
    if (urlParams.get('modo') === 'apk' || window.location.protocol === 'capacitor:') {
      this.esModoApkBrigadista.set(true);
      this.accesoAutorizado.set(true);
      return;
    }

    const keyParam = urlParams.get('key') || urlParams.get('clave');
    if (keyParam) {
      try {
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch {}
      this.verificarClave(keyParam.trim());
      return;
    }

    const savedKey = localStorage.getItem('sepam_pmu_access_key');
    const savedExpira = localStorage.getItem('sepam_pmu_access_expira_at');

    if (savedKey && savedExpira) {
      const expiraMs = parseInt(savedExpira, 10);
      const restantes = Math.floor((expiraMs - Date.now()) / 1000);

      if (restantes > 0) {
        this.claveActiva.set(savedKey);
        this.expiraAtTimestamp.set(expiraMs);
        this.segundosRestantes.set(restantes);
        this.accesoAutorizado.set(true);
        this.activarSuperUsuarioAutomatico();
        this.iniciarTimer();

        this.http.post<RespuestaVerificacion>(`${this.baseUrl}/api/auth/verificar-key`, { key: savedKey }).subscribe({
          next: (res) => {
            if (res.valido) {
              this.segundosRestantes.set(res.expira_en_segundos);
              if (res.expira_at_timestamp) {
                this.expiraAtTimestamp.set(res.expira_at_timestamp);
                localStorage.setItem('sepam_pmu_access_expira_at', res.expira_at_timestamp.toString());
              }
            } else {
              this.cerrarSesionAcceso('Tu sesión de 2 horas ha expirado.');
            }
          },
          error: () => {}
        });
      } else {
        this.cerrarSesionAcceso();
      }
    }
  }

  verificarClave(clave: string, onSuccess?: () => void) {
    if (!clave || !clave.trim()) {
      this.errorMensaje.set('Ingresa la clave de 2 horas enviada por el Bot de Telegram.');
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
          this.activarSuperUsuarioAutomatico();
          this.errorMensaje.set(null);

          if (typeof window !== 'undefined') {
            localStorage.setItem('sepam_pmu_access_key', claveNormalizada);
            localStorage.setItem('sepam_pmu_access_expira_at', expiraMs.toString());
          }

          this.iniciarTimer();
          if (onSuccess) onSuccess();
        } else {
          this.errorMensaje.set(res.mensaje || 'Clave incorrecta o vencida.');
        }
      },
      error: () => {
        this.cargando.set(false);
        this.errorMensaje.set('Sin conexión con el servidor de validación. Verifica la red del Puesto de Mando.');
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
    this.emergency.cerrarSesionAInvitado();

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
        this.cerrarSesionAcceso('Tiempo de sesión agotado (2 horas). Solicita una nueva clave en Telegram.');
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
}
