import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmergencyService } from '../../services/emergency.service';
import { CustomizerService } from '../../services/customizer.service';
import { SupabaseService } from '../../services/supabase.service';
import { NetworkService } from '../../services/network.service';
import { DatabaseService } from '../../services/database.service';
import { AccessAuthService } from '../../services/access-auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Banner de Alerta Crítica en Tiempo Real (Redis NoSQL) -->
    @if (db.alertaActiva()) {
      <div class="bg-red-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold animate-pulse shadow-xl border-b-2 border-red-300 select-none z-50">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-base">🚨</span>
          <span class="bg-white text-red-800 px-2 py-0.5 rounded font-black text-[10px] tracking-wider uppercase">
            ALERTA {{ db.alertaActiva()?.tipo_alerta }} (REDIS)
          </span>
          <span class="bg-black/30 px-2 py-0.5 rounded font-black text-[11px]">
            Triage {{ db.alertaActiva()?.triage_color }}
          </span>
          <span class="font-bold underline text-amber-200">{{ db.alertaActiva()?.sector_nombre }}</span>
          <span class="opacity-95">• Motivo: {{ db.alertaActiva()?.motivo }}</span>
          <span class="opacity-80 font-mono text-[11px]">({{ db.alertaActiva()?.paciente_nombre }} - {{ db.alertaActiva()?.hora }})</span>
        </div>
        <button 
          (click)="db.cerrarAlertaActiva()" 
          class="bg-black/40 hover:bg-black/60 text-white px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-all ml-2 whitespace-nowrap"
          title="Descartar banner de alerta activa"
        >
          Entendido ✕
        </button>
      </div>
    }

    <header 
      class="border-b px-4 py-3 select-none shadow-md transition-all duration-300"
      [style.backgroundColor]="customizer.config().tema.colorHeader"
      [style.borderColor]="customizer.config().tema.colorBorde"
      [style.color]="customizer.config().tema.colorHeaderTexto"
    >
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        <!-- Identidad Institucional SEPAM (Personalizable en vivo) -->
        <div class="flex items-center gap-3 w-full md:w-auto">
          <div class="relative flex-shrink-0">
            <img 
              src="logo-sepam.png" 
              alt="SEPAM Ecuador" 
              class="w-12 h-12 rounded-full border-2 border-[#f59e0b] shadow-md object-contain bg-black"
            />
            <span class="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 rounded-full animate-pulse" [style.borderColor]="customizer.config().tema.colorHeader"></span>
          </div>

          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-sm md:text-base font-bold tracking-wider flex items-center gap-1.5">
                <span class="text-[#fbbf24]">{{ customizer.config().textos.nombreInstitucion.split(' ')[0] || 'SEPAM' }}</span> 
                {{ customizer.config().textos.nombreInstitucion.split(' ').slice(1).join(' ') || 'SISTEMA DE MANDO' }}
              </h1>
              <span class="text-[10px] font-semibold px-2 py-0.5 rounded border border-white/20 uppercase tracking-wider"
                    [style.backgroundColor]="customizer.config().tema.colorPrimario"
                    [style.color]="'#ffffff'">
                {{ customizer.config().textos.subtituloHeader || 'ECUADOR 🇪🇨' }}
              </span>

              <!-- LÁPIZ DE EDICIÓN DEL HEADER (Solo Super Usuarios - SVG nítido) -->
              @if (emergency.esSuperUsuario()) {
                <button 
                  (click)="customizer.abrirSidebar()"
                  class="ml-1 p-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-900 border border-amber-500 cursor-pointer transition-all shadow-xs inline-flex items-center hover:scale-105"
                  title="Editar logotipo, títulos institucionales y colores"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              }
            </div>
            <p class="text-xs opacity-90 flex items-center gap-1">
              <span>{{ customizer.config().textos.nombreEvento || emergency.evento().nombre }}</span>
              <span class="opacity-60">•</span>
              <span class="font-mono text-[#fde68a]">{{ customizer.config().textos.ciudadSede || emergency.evento().ciudad }}</span>
            </p>
          </div>
        </div>

        <!-- Selector de Vistas Operativas (Alto Contraste y 100% Legible) -->
        <div class="flex items-center p-1 rounded-xl bg-black/40 border border-white/20 shadow-inner overflow-x-auto max-w-full gap-1">
          <button 
            (click)="cambiarVista('dashboard')"
            [class.bg-emerald-500]="vistaActual() === 'dashboard'"
            [class.text-white]="vistaActual() === 'dashboard'"
            [class.font-black]="vistaActual() === 'dashboard'"
            [class.shadow-md]="vistaActual() === 'dashboard'"
            [class.border]="vistaActual() === 'dashboard'"
            [class.border-emerald-300/40]="vistaActual() === 'dashboard'"
            [class.text-white/85]="vistaActual() !== 'dashboard'"
            [class.hover:text-white]="vistaActual() !== 'dashboard'"
            [class.hover:bg-white/10]="vistaActual() !== 'dashboard'"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            <span>🖥️ Centro de Mando</span>
            @if (emergency.atencionesActivas() > 0) {
              <span class="bg-amber-400 text-black text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {{ emergency.atencionesActivas() }}
              </span>
            }
          </button>

          <button 
            (click)="cambiarVista('movil')"
            [class.bg-emerald-500]="vistaActual() === 'movil'"
            [class.text-white]="vistaActual() === 'movil'"
            [class.font-black]="vistaActual() === 'movil'"
            [class.shadow-md]="vistaActual() === 'movil'"
            [class.border]="vistaActual() === 'movil'"
            [class.border-emerald-300/40]="vistaActual() === 'movil'"
            [class.text-white/85]="vistaActual() !== 'movil'"
            [class.hover:text-white]="vistaActual() !== 'movil'"
            [class.hover:bg-white/10]="vistaActual() !== 'movil'"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            <span>📱 Móvil (20 Paramédicos)</span>
          </button>

          <button 
            (click)="cambiarVista('acv')"
            [class.bg-emerald-500]="vistaActual() === 'acv'"
            [class.text-white]="vistaActual() === 'acv'"
            [class.font-black]="vistaActual() === 'acv'"
            [class.shadow-md]="vistaActual() === 'acv'"
            [class.border]="vistaActual() === 'acv'"
            [class.border-emerald-300/40]="vistaActual() === 'acv'"
            [class.text-white/85]="vistaActual() !== 'acv'"
            [class.hover:text-white]="vistaActual() !== 'acv'"
            [class.hover:bg-white/10]="vistaActual() !== 'acv'"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            <span>🏥 ACV 1 y 2 (PMA)</span>
            @if (emergency.trasladosActivosACV() > 0) {
              <span class="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold animate-pulse">
                {{ emergency.trasladosActivosACV() }}
              </span>
            }
          </button>

          <button 
            (click)="cambiarVista('ambulancia')"
            [class.bg-emerald-500]="vistaActual() === 'ambulancia'"
            [class.text-white]="vistaActual() === 'ambulancia'"
            [class.font-black]="vistaActual() === 'ambulancia'"
            [class.shadow-md]="vistaActual() === 'ambulancia'"
            [class.border]="vistaActual() === 'ambulancia'"
            [class.border-emerald-300/40]="vistaActual() === 'ambulancia'"
            [class.text-white/85]="vistaActual() !== 'ambulancia'"
            [class.hover:text-white]="vistaActual() !== 'ambulancia'"
            [class.hover:bg-white/10]="vistaActual() !== 'ambulancia'"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            <span>🚑 Ambulancias</span>
            @if (emergency.pacientesEnAmbulancia().length > 0) {
              <span class="bg-cyan-400 text-black text-[10px] px-1.5 py-0.2 rounded-full font-black">
                {{ emergency.pacientesEnAmbulancia().length }}
              </span>
            }
          </button>

          <button 
            (click)="cambiarVista('admin')"
            [class.bg-emerald-500]="vistaActual() === 'admin'"
            [class.text-white]="vistaActual() === 'admin'"
            [class.font-black]="vistaActual() === 'admin'"
            [class.shadow-md]="vistaActual() === 'admin'"
            [class.border]="vistaActual() === 'admin'"
            [class.border-emerald-300/40]="vistaActual() === 'admin'"
            [class.text-white/85]="vistaActual() !== 'admin'"
            [class.hover:text-white]="vistaActual() !== 'admin'"
            [class.hover:bg-white/10]="vistaActual() !== 'admin'"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            <span class="text-amber-300">⚙️</span>
            <span>Panel Super Usuario</span>
          </button>
        </div>

        <!-- Indicador de Sesión Activa (Modo Público / Invitado vs Super Usuarios) -->
        <div class="flex items-center gap-2 text-xs">
          
          <!-- Botón de Reporte Oficial (Generar para Admins / Ver para Invitados) -->
          <button 
            (click)="abrirReporte()"
            class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0b5948] hover:bg-[#0f7660] text-emerald-100 text-xs font-bold border border-emerald-300/40 cursor-pointer shadow-xs transition-colors"
            [title]="emergency.esSuperUsuario() ? 'Generar Reporte Oficial del Evento (Admin)' : 'Ver Reporte de Atenciones (Solo Lectura)'"
          >
            <span>{{ emergency.esSuperUsuario() ? '📋 Generar Reporte' : '👁️ Ver Reporte' }}</span>
          </button>

          <!-- SI ES SUPER USUARIO: Botón de Personalizar GUI + Botón Red & QR + Badge de Super Usuario con Salir -->
          @if (emergency.esSuperUsuario()) {
            <button 
              (click)="abrirModalRed()"
              class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#05372d] hover:bg-[#0b5948] text-white text-xs font-bold border border-emerald-400/50 cursor-pointer shadow-xs transition-all hover:scale-105"
              title="Mostrar Código QR Oficial para Brigadistas"
            >
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span class="font-bold">📲 Código QR Móvil</span>
            </button>

            <button 
              (click)="customizer.toggleSidebar()"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f59e0b] hover:bg-amber-400 text-black text-xs font-black cursor-pointer shadow-sm transition-all"
              title="Abrir Editor GUI flotante en tiempo real"
            >
              <span>🎨</span>
              <span>Personalizar GUI</span>
            </button>

            <div class="bg-[#05372d] border border-amber-400/50 rounded-lg px-2.5 py-1 flex items-center gap-2">
              <span class="text-amber-400 text-xs">⭐</span>
              <div class="text-left font-sans leading-tight">
                <span class="text-[9px] text-amber-300 block uppercase font-black">Super Usuario</span>
                <span class="text-[11px] font-bold text-white truncate max-w-[130px] block">
                  {{ emergency.usuarioSesion().nombre.split(' ')[0] }} {{ emergency.usuarioSesion().nombre.split(' ')[1] || '' }}
                </span>
              </div>
              <button 
                (click)="emergency.cerrarSesionAInvitado()"
                class="text-[10px] text-red-300 hover:text-red-100 underline cursor-pointer ml-1 font-semibold"
                title="Cerrar sesión de Super Usuario y volver a Modo Invitado"
              >
                Salir
              </button>
            </div>
          } @else if (emergency.esInvitado()) {
            <!-- MODO INVITADO / PÚBLICO (Solo Lectura) -->
            <div class="bg-[#05372d] border border-emerald-400/30 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-slate-400"></span>
              <div class="text-left font-sans">
                <span class="text-[9px] text-emerald-300 block uppercase font-bold">Modo Público:</span>
                <span class="text-[11px] font-medium text-emerald-100">Invitado (Solo Lectura)</span>
              </div>
            </div>

            <button 
              (click)="abrirModalLogin()"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer shadow-sm border border-emerald-300/40 transition-all"
              title="Iniciar sesión como Super Usuario (admin1, Pedro Zavala, Sebastian Zavala) o Paramédico"
            >
              <span>🔐</span>
              <span>Ingreso Admin</span>
            </button>
          } @else {
            <!-- SESIÓN PARAMÉDICO -->
            <div class="bg-[#05372d] border border-cyan-400/40 rounded-lg px-2.5 py-1 flex items-center gap-1.5">
              <span class="text-xs">🚑</span>
              <div class="text-left font-sans">
                <span class="text-[9px] text-cyan-200 block uppercase font-bold">Paramédico:</span>
                <span class="text-[11px] font-bold text-white truncate max-w-[120px] block">
                  {{ emergency.usuarioSesion().nombre }}
                </span>
              </div>
              <button 
                (click)="emergency.cerrarSesionAInvitado()"
                class="text-[10px] text-red-300 hover:text-red-100 underline cursor-pointer ml-1 font-semibold"
              >
                Salir
              </button>
            </div>

            <button 
              (click)="abrirModalLogin()"
              class="px-2.5 py-1.5 rounded-lg bg-[#05372d] hover:bg-[#0b5948] text-emerald-200 text-xs font-bold border border-emerald-400/40 cursor-pointer"
            >
              Cambiar
            </button>
          }

          <!-- Indicador de Sesión Temporal de 2 Horas (Protección Telegram) -->
          @if (auth.accesoAutorizado()) {
            <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#05372d] border border-amber-400/50 text-white text-[11px] font-mono shadow-xs"
                 title="Acceso de 2 horas activo. Clave verificada en Redis/Telegram.">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span class="text-amber-400 font-sans text-[10px] font-black uppercase">PMU 2H:</span>
              <span class="font-bold text-amber-200">{{ auth.tiempoRestanteFormateado() }}</span>
              <button 
                (click)="auth.cerrarSesionAcceso()"
                class="ml-1 text-[10px] text-red-300 hover:text-red-100 font-sans cursor-pointer hover:underline"
                title="Bloquear pantalla del Centro de Mando"
              >
                🔒
              </button>
            </div>
          } @else {
            <button 
              (click)="auth.cerrarSesionAcceso()"
              class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-bold shadow-xs cursor-pointer animate-pulse"
              title="Acceso Bloqueado. Clic para ingresar clave."
            >
              <span>🔒</span>
              <span>Bloqueado</span>
            </button>
          }

          <!-- Indicador Tri-Motor Políglota (Redis + DuckDB + SQLite) -->
          <div class="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#05372d] border border-emerald-400/40 text-white text-[10px] font-bold"
               title="Persistencia Políglota: SQLite WAL (Transaccional) + DuckDB 1.5 (Analítico) + Redis 7 (Alertas NoSQL)">
            <span class="w-2 h-2 rounded-full" [ngClass]="db.redisOnline() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"></span>
            <span class="font-mono text-emerald-200">REDIS + DUCKDB + SQLITE</span>
          </div>

          <!-- Conexión Supabase / LAN -->
          <button 
            (click)="abrirModalSupabase()"
            class="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#05372d] border border-emerald-400/40 hover:bg-[#0b5948] text-white transition-colors cursor-pointer"
            title="Sincronización Supabase"
          >
            <span class="w-2 h-2 rounded-full" [ngClass]="supabase.isConnected ? 'bg-emerald-400' : 'bg-emerald-300'"></span>
            <span class="font-mono text-[10px] font-bold">{{ supabase.isConnected ? 'SUPABASE' : 'LAN' }}</span>
          </button>
        </div>

      </div>
    </header>
  `
})
export class HeaderComponent implements OnInit, OnDestroy {
  emergency = inject(EmergencyService);
  customizer = inject(CustomizerService);
  supabase = inject(SupabaseService);
  network = inject(NetworkService);
  db = inject(DatabaseService);
  auth = inject(AccessAuthService);

  vistaActual = signal<'dashboard' | 'movil' | 'acv' | 'ambulancia' | 'admin'>('dashboard');
  horaActual = '';
  private timer: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.actualizarHora();
    this.timer = setInterval(() => this.actualizarHora(), 1000);
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  actualizarHora() {
    const d = new Date();
    this.horaActual = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  cambiarVista(vista: 'dashboard' | 'movil' | 'acv' | 'ambulancia' | 'admin') {
    this.vistaActual.set(vista);
    window.dispatchEvent(new CustomEvent('cambiar-vista', { detail: vista }));
  }

  abrirModalSupabase() {
    window.dispatchEvent(new CustomEvent('abrir-modal-supabase'));
  }

  abrirReporte() {
    window.dispatchEvent(new CustomEvent('abrir-modal-reporte'));
  }

  abrirModalLogin() {
    window.dispatchEvent(new CustomEvent('abrir-modal-login'));
  }

  abrirModalRed() {
    window.dispatchEvent(new CustomEvent('abrir-modal-red'));
  }
}
