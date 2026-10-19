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
    <!-- Banner de Alerta Crítica en Tiempo Real -->
    @if (db.alertaActiva()) {
      <div class="bg-red-600 text-white px-4 py-2.5 flex items-center justify-between text-xs font-bold animate-pulse shadow-xl border-b-2 border-red-300 select-none z-50">
        <div class="flex items-center gap-2 flex-wrap">
          <svg class="w-4 h-4 text-white animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          <span class="bg-white text-red-800 px-2 py-0.5 rounded font-black text-[10px] tracking-wider uppercase">
            EMERGENCIA {{ db.alertaActiva()?.tipo_alerta }}
          </span>
          <span class="bg-black/30 px-2 py-0.5 rounded font-black text-[11px]">
            Triage {{ db.alertaActiva()?.triage_color }}
          </span>
          <span class="font-bold underline text-amber-200">{{ db.alertaActiva()?.sector_nombre }}</span>
          <span class="opacity-95">• {{ db.alertaActiva()?.motivo }}</span>
          <span class="opacity-80 font-mono text-[11px]">({{ db.alertaActiva()?.paciente_nombre }})</span>
        </div>
        <button 
          (click)="db.cerrarAlertaActiva()" 
          class="bg-black/40 hover:bg-black/60 text-white px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ml-2 whitespace-nowrap flex items-center gap-1"
        >
          <span>Entendido</span>
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
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
        
        <!-- Identidad Institucional SEPAM -->
        <div class="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div class="flex items-center gap-3">
            <div class="relative flex-shrink-0">
              <img 
                src="logo-sepam.png" 
                alt="SEPAM Ecuador" 
                class="w-11 h-11 object-contain drop-shadow-md"
              />
              <span class="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 rounded-full" [style.borderColor]="customizer.config().tema.colorHeader"></span>
            </div>

            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-sm md:text-base font-black tracking-wider">
                  <span class="text-[#fbbf24]">{{ customizer.config().textos.nombreInstitucion.split(' ')[0] || 'SEPAM' }}</span> 
                  {{ customizer.config().textos.nombreInstitucion.split(' ').slice(1).join(' ') || 'MANDO OPERATIVO' }}
                </h1>
              </div>
              <p class="text-xs opacity-90 flex items-center gap-1.5">
                <span>{{ customizer.config().textos.nombreEvento }}</span>
                <span class="opacity-50">•</span>
                <span class="text-emerald-300 font-semibold flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full" [ngClass]="db.conectado() ? 'bg-emerald-400' : 'bg-amber-400'"></span>
                  <span>{{ db.conectado() ? 'Sincronizado en Vivo' : 'Guardado Local Activo' }}</span>
                </span>
              </p>
            </div>
          </div>
        </div>

        <!-- Navegación Principal (Adaptable: Completa en PC de Mando / Simplificada en APK de Brigadistas) -->
        <div class="flex items-center p-1 rounded-xl bg-black/40 border border-white/20 shadow-inner overflow-x-auto max-w-full gap-1">
          
          @if (!auth.esModoApkBrigadista()) {
            <button 
              (click)="cambiarVista('dashboard')"
              [class.bg-emerald-500]="vistaActual() === 'dashboard'"
              [class.text-white]="vistaActual() === 'dashboard'"
              [class.font-black]="vistaActual() === 'dashboard'"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white/85 hover:text-white transition-all cursor-pointer whitespace-nowrap"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
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
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            <span>Brigadista</span>
          </button>

          <button 
            (click)="cambiarVista('acv')"
            [class.bg-emerald-500]="vistaActual() === 'acv'"
            [class.text-white]="vistaActual() === 'acv'"
            [class.font-black]="vistaActual() === 'acv'"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white/85 hover:text-white transition-all cursor-pointer whitespace-nowrap"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            <span>Puestos ACV</span>
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
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l2 4v6a1 1 0 01-1 1h-1a2 2 0 11-4 0H8a2 2 0 11-4 0H3a1 1 0 01-1-1v-6l2-4h4m12 0l-2-4H6L4 7m4 0v4m0 0h4m-4 0H4"/></svg>
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
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <span>Recursos</span>
            </button>
          }
        </div>

        <!-- Controles Rápidos y Reloj de Sesión (Limpio y sin tecnicismos) -->
        @if (!auth.esModoApkBrigadista()) {
          <div class="flex items-center gap-2 text-xs">
            
            <button 
              (click)="abrirModalRed()"
              class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#05372d] hover:bg-[#0b5948] text-white text-xs font-bold border border-emerald-400/50 cursor-pointer shadow-xs transition-all"
              title="Código QR para conectar celulares de brigadistas"
            >
              <svg class="w-3.5 h-3.5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
              <span>QR Brigadistas</span>
            </button>

            <button 
              (click)="customizer.toggleSidebar()"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f59e0b] hover:bg-amber-400 text-black text-xs font-black cursor-pointer shadow-sm transition-all"
              title="Cambiar colores, diseño y gráficos de la pantalla"
            >
              <svg class="w-3.5 h-3.5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4 4 4 0 014-4h2a4 4 0 014 4 4 4 0 01-4 4H7zm0 0a4 4 0 004-4v-2.586a1 1 0 01.293-.707l6-6a1 1 0 011.414 0l2.586 2.586a1 1 0 010 1.414l-6 6a1 1 0 01-.707.293H11"/></svg>
              <span>Diseñar Pantalla</span>
            </button>

            @if (auth.accesoAutorizado()) {
              <div class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/35 border border-amber-400/40 text-white text-[11px] font-mono">
                <span class="text-amber-300 font-bold">{{ auth.tiempoRestanteFormateado() }}</span>
                <button 
                  (click)="auth.cerrarSesionAcceso()"
                  class="ml-1 text-red-300 hover:text-red-100 cursor-pointer flex items-center"
                  title="Bloquear Puesto de Mando"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
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
