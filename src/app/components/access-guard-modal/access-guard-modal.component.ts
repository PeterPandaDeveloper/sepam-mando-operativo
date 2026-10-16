import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccessAuthService } from '../../services/access-auth.service';

@Component({
  selector: 'app-access-guard-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Overlay de Bloqueo Clínico en Estilo Claro -->
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in select-none">
      
      <!-- Panel Central Estilo Beige Clínico & Verde SEPAM -->
      <div class="w-full max-w-lg bg-[#f5f4ed] border-2 border-[#07483b] rounded-2xl shadow-2xl overflow-hidden flex flex-col text-[#0d2822]">
        
        <!-- Cabecera Institucional Verde Bosque -->
        <div class="bg-[#07483b] p-4 px-6 border-b border-[#05372d] flex items-center justify-between text-white">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-white/15 border border-white/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-sm font-black tracking-wider uppercase text-white">Control de Seguridad PMU</h3>
              <p class="text-[11px] text-emerald-200">SEPAM Mando Operativo • Ecuador</p>
            </div>
          </div>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-black/25 text-amber-300 font-bold border border-white/20">
            PROTECCIÓN 2H
          </span>
        </div>

        <div class="p-6 md:p-8 flex flex-col items-center text-center">
          
          <!-- Escudo / Icono Principal en Verde Bosque -->
          <div class="w-16 h-16 rounded-2xl bg-white border-2 border-[#07483b] flex items-center justify-center shadow-md mb-4">
            <svg class="w-8 h-8 text-[#07483b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>

          <!-- Títulos Institucionales -->
          <h2 class="text-xl md:text-2xl font-black text-[#07483b] mb-1">
            Centro de Mando Operativo
          </h2>
          <p class="text-xs text-[#405c54] font-medium mb-6 max-w-sm">
            Para acceder al panel de recursos y emergencias del Puesto de Mando, ingresa la clave temporal de 2 horas.
          </p>

          <!-- Mensaje de Error (si existe) -->
          @if (auth.errorMensaje()) {
            <div class="w-full mb-4 p-3 rounded-xl bg-red-50 border border-red-300 text-red-800 text-xs font-bold flex items-center gap-2 animate-shake">
              <svg class="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
              <span class="text-left flex-1">{{ auth.errorMensaje() }}</span>
            </div>
          }

          <!-- Formulario de Clave en Tarjeta Blanca Limpia -->
          <div class="w-full bg-white p-5 rounded-xl border border-[#d2dfd8] shadow-xs space-y-4">
            
            <div>
              <label class="block text-left text-[11px] font-black uppercase text-[#07483b] mb-1.5 tracking-wider">
                Clave de Seguridad (Mayúsculas, Números y % $ !)
              </label>
              
              <div class="flex items-center gap-2">
                <input 
                  type="text"
                  [(ngModel)]="claveIngresada"
                  (keyup.enter)="desbloquear()"
                  placeholder="SEPAM-8X$9!%"
                  autofocus
                  autocomplete="off"
                  spellcheck="false"
                  class="flex-1 px-4 py-3 bg-[#f5f4ed] border-2 border-[#d2dfd8] focus:border-[#07483b] rounded-xl font-mono text-base md:text-lg font-black text-center tracking-widest text-[#07483b] placeholder:text-[#648279]/60 outline-none transition-all uppercase"
                />

                <button 
                  (click)="pegarDelPortapapeles()"
                  type="button"
                  class="px-3.5 py-3 bg-[#edece4] hover:bg-[#e2e1d7] border border-[#d2dfd8] text-[#07483b] rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                  title="Pegar clave desde el portapapeles"
                >
                  <svg class="w-4 h-4 text-[#07483b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                  <span class="hidden sm:inline">Pegar</span>
                </button>
              </div>
            </div>

            <!-- Botón Principal de Desbloqueo en Verde Bosque SEPAM -->
            <button 
              (click)="desbloquear()"
              [disabled]="auth.cargando() || !claveIngresada.trim()"
              class="w-full py-3.5 px-6 rounded-xl font-black text-xs tracking-wider uppercase transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 text-white"
              [ngClass]="{
                'bg-[#07483b] hover:bg-[#0b5948] hover:scale-[1.01] active:scale-[0.99]': !auth.cargando() && claveIngresada.trim(),
                'bg-slate-300 text-slate-500 cursor-not-allowed': auth.cargando() || !claveIngresada.trim()
              }"
            >
              @if (auth.cargando()) {
                <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Verificando Clave con el Servidor...</span>
              } @else {
                <svg class="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"/>
                </svg>
                <span>Desbloquear Acceso (2 Horas)</span>
              }
            </button>

          </div>

          <!-- Canales de Obtención de Clave -->
          <div class="w-full mt-5 pt-4 border-t border-[#d2dfd8] flex flex-col gap-2.5">
            
            <div class="flex items-center justify-between text-xs text-[#405c54] font-medium">
              <span>¿No tienes la clave?</span>
              <span class="text-[#07483b] font-bold">Solicítala al Mando</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              
              <!-- Botón Telegram Oficial -->
              <a 
                href="https://t.me/SEPAMando_Bot"
                target="_blank"
                class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#07483b]/10 hover:bg-[#07483b]/20 border border-[#07483b]/30 text-[#07483b] text-xs font-bold transition-all shadow-xs"
              >
                <svg class="w-4 h-4 text-[#07483b]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                </svg>
                <span>Pedir Clave en Telegram</span>
              </a>

              <!-- Botón Acceso Director por PIN Maestro -->
              <button 
                (click)="solicitarPinDirector()"
                class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#edece4] hover:bg-[#e2e1d7] border border-[#d2dfd8] text-[#405c54] text-xs font-bold cursor-pointer transition-all shadow-xs"
                title="Acceso de contingencia para Directores de Operaciones con PIN"
              >
                <svg class="w-4 h-4 text-[#07483b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
                </svg>
                <span>Dirección (PIN Maestro)</span>
              </button>

            </div>

            <!-- Ayuda Clave Maestra -->
            <p class="text-[10px] text-[#648279] mt-1 font-mono">
              * En situaciones sin conexión: La Dirección Médica dispone del PIN de Contingencia.
            </p>

          </div>

        </div>

      </div>

    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.97); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }
    .animate-fade-in { animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
    .animate-shake { animation: shake 0.4s ease-in-out; }
  `]
})
export class AccessGuardModalComponent implements OnInit {
  auth = inject(AccessAuthService);
  claveIngresada = '';

  ngOnInit() {
    if (this.auth.claveActiva()) {
      this.claveIngresada = this.auth.claveActiva()!;
    }
  }

  desbloquear() {
    if (!this.claveIngresada.trim()) return;
    this.auth.verificarClave(this.claveIngresada.trim());
  }

  pegarDelPortapapeles() {
    if (navigator.clipboard && navigator.clipboard.readText) {
      navigator.clipboard.readText().then(text => {
        if (text) {
          this.claveIngresada = text.trim().toUpperCase();
        }
      }).catch(() => {});
    }
  }

  solicitarPinDirector() {
    const pin = prompt('CONTROL DE SEGURIDAD PMU:\nIngresa el PIN de la Dirección de Operaciones:');
    if (pin && pin.trim() === '2026') {
      this.claveIngresada = 'SEPAM-MASTER-2026!$%';
      this.auth.verificarClave(this.claveIngresada);
    } else if (pin !== null) {
      alert('PIN Incorrecto. Solicita tu clave temporal al Bot de Telegram @SEPAMando_Bot.');
    }
  }
}
