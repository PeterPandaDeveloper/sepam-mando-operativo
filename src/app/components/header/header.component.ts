import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmergencyService } from '../../services/emergency.service';
import { CustomizerService } from '../../services/customizer.service';
import { DatabaseService } from '../../services/database.service';
import { AccessAuthService } from '../../services/access-auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Banner de Alerta Crítica en Tiempo Real (Sin tecnicismos) -->
    @if (db.alertaActiva()) {
      <div class="bg-red-600 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold animate-pulse shadow-xl border-b-2 border-red-300 select-none z-50">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="bg-white text-red-800 px-2 py-0.5 rounded font-black text-[10px] tracking-wider uppercase">
            EMERGENCIA {{ db.alertaActiva()?.tipo_alerta }}
          </span>
          <span class="bg-black/30 px-2 py-0.5 rounded font-black text-[11px]">
            Prioridad {{ db.alertaActiva()?.triage_color }}
          </span>
          <span class="font-bold underline text-amber-200">{{ db.alertaActiva()?.sector_nombre }}</span>
          <span class="opacity-95">• {{ db.alertaActiva()?.motivo }}</span>
          <span class="opacity-80 font-mono text-[11px]">({{ db.alertaActiva()?.paciente_nombre }})</span>
        </div>
        <button 
          (click)="db.cerrarAlertaActiva()" 
          class="bg-black/40 hover:bg-black/60 text-white px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ml-2 whitespace-nowrap"
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
        
        <!-- Identidad y Semáforo Humano de Conexión -->
        <div class="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div class="flex items-center gap-3">
            <div class="relative flex-shrink-0">
              <img 
                src="logo-sepam.png" 
                alt="SEPAM Ecuador" 
                class="w-11 h-11 rounded-full border-2 border-[#f59e0b] shadow-md object-contain bg-black"
              />
              <span 
                class="absolute bottom-0 right-0 w-3.5 h-3.5 border-2 rounded-full" 
                [ngClass]="db.conectado() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"
                [style.borderColor]="customizer.config().tema.colorHeader"
              ></span>
            </div>

            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-sm md:text-base font-black tracking-wider">
                  <span class="text-[#fbbf24]">{{ customizer.config().textos.nombreInstitucion.split(' ')[0] || 'SEPAM' }}</span> 
                  {{ customizer.config().textos.nombreInstitucion.split(' ').slice(1).join(' ') || 'MANDO OPERATIVO' }}
                </h1>
              </div>

              <!-- Semáforo Humano (Cero jerga de bases de datos) -->
              <div class="flex items-center gap-2 text-xs mt-0.5">
                <span class="opacity-90 font-semibold">{{ customizer.config().textos.nombreEvento }}</span>
                <span class="opacity-40">•</span>
                @if (db.conectado()) {
                  <span class="inline-flex items-center gap-1 text-emerald-300 font-bold text-[11px]">
                    <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>Sistema Sincronizado en Vivo</span>
                  </span>
                } @else {
                  <span class="inline-flex items-center gap-1 text-amber-300 font-bold text-[11px]">
                    <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>Guardado Local en Equipo</span>
                  </span>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Selector de Módulos Operativos -->
        <div class="flex items-center p-1 rounded-xl bg-black/40 border border-white/20 shadow-inner overflow-x-auto max-w-full gap-1">
          
          @if (!auth.esModoApkBrigadista()) {
            <button 
              (click)="cambiarVista('dashboard')"
              [class.bg-emerald-500]="vistaActual() === 'dashboard'"
              [class.text-white]="vistaActual() === 'dashboard'"
              [class.font-black]="vistaActual() === 'dashboard'"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white/85 hover:text-white transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Centro de Mando</span>
              @if (emergency.atencionesActivas() > 0) {
                <span class="bg-amber-400 text-black text-[10px] px-1.5 rounded-full font-black">
                  {{ emergency.atencionesActivas() }}
                </span>
              }
            </button>
          }

          <button 
            (click)="cambiarVista('movil')"
            [class.bg-emerald-500]="vistaActual() === 'movil'"
            [class.text-white]="vistaActual() === 'movil'"
            [class.font-black]="vistaActual() === 'movil'"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white/85 hover:text-white transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Brigadista (Campo)</span>
          </button>

          <button 
            (click)="cambiarVista('acv')"
            [class.bg-emerald-500]="vistaActual() === 'acv'"
            [class.text-white]="vistaActual() === 'acv'"
            [class.font-black]="vistaActual() === 'acv'"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white/85 hover:text-white transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Puestos Médicos (ACV)</span>
            @if (emergency.trasladosActivosACV() > 0) {
              <span class="bg-red-500 text-white text-[10px] px-1.5 rounded-full font-bold animate-pulse">
                {{ emergency.trasladosActivosACV() }}
              </span>
            }
          </button>

          <button 
            (click)="cambiarVista('ambulancia')"
            [class.bg-emerald-500]="vistaActual() === 'ambulancia'"
            [class.text-white]="vistaActual() === 'ambulancia'"
            [class.font-black]="vistaActual() === 'ambulancia'"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white/85 hover:text-white transition-all cursor-pointer whitespace-nowrap"
          >
            <span>Ambulancias</span>
            @if (emergency.pacientesEnAmbulancia().length > 0) {
              <span class="bg-cyan-400 text-black text-[10px] px-1.5 rounded-full font-black">
                {{ emergency.pacientesEnAmbulancia().length }}
              </span>
            }
          </button>

          @if (!auth.esModoApkBrigadista() && emergency.esSuperUsuario()) {
            <button 
              (click)="cambiarVista('admin')"
              [class.bg-emerald-500]="vistaActual() === 'admin'"
              [class.text-white]="vistaActual() === 'admin'"
              [class.font-black]="vistaActual() === 'admin'"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white/85 hover:text-white transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Personal y Flota</span>
            </button>
          }
        </div>

        <!-- Botones de Acción Directa -->
        @if (!auth.esModoApkBrigadista()) {
          <div class="flex items-center gap-2 text-xs">
            
            <button 
              (click)="abrirModalRed()"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#05372d] hover:bg-[#0b5948] text-white text-xs font-bold border border-emerald-400/50 cursor-pointer shadow-xs transition-all"
              title="Mostrar Código QR para conectar celulares de brigadistas"
            >
              <span>Conectar Celulares (QR)</span>
            </button>

            @if (emergency.esSuperUsuario()) {
              <button 
                (click)="customizer.toggleSidebar()"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f59e0b] hover:bg-amber-400 text-black text-xs font-black cursor-pointer shadow-sm transition-all"
                title="Cambiar colores y apariencia de la pantalla"
              >
                <span>Personalizar Pantalla</span>
              </button>
            }

            @if (auth.accesoAutorizado()) {
              <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/35 border border-amber-400/40 text-white text-[11px] font-mono"
                   title="Tiempo restante de sesión activa">
                <span class="text-amber-300 font-bold">{{ auth.tiempoRestanteFormateado() }}</span>
                <button 
                  (click)="auth.cerrarSesionAcceso()"
                  class="ml-1 text-red-300 hover:text-red-100 cursor-pointer font-sans font-bold"
                  title="Bloquear pantalla"
                >
                  Salir
                </button>
              </div>
            }
          </div>
        }

      </div>
    </header>
  `
})
export class HeaderComponent implements OnInit, OnDestroy {
  emergency = inject(EmergencyService);
  customizer = inject(CustomizerService);
  db = inject(DatabaseService);
  auth = inject(AccessAuthService);

  vistaActual = signal<'dashboard' | 'movil' | 'acv' | 'ambulancia' | 'admin'>('dashboard');

  ngOnInit() {
    if (this.auth.esModoApkBrigadista()) {
      this.cambiarVista('movil');
    }
  }

  ngOnDestroy() {}

  cambiarVista(vista: 'dashboard' | 'movil' | 'acv' | 'ambulancia' | 'admin') {
    this.vistaActual.set(vista);
    window.dispatchEvent(new CustomEvent('cambiar-vista', { detail: vista }));
  }

  abrirModalRed() {
    window.dispatchEvent(new CustomEvent('abrir-modal-red'));
  }
}
