import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccessAuthService } from '../../services/access-auth.service';

@Component({
  selector: 'app-access-guard-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Overlay de Bloqueo Táctico de Pantalla Completa -->
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fade-in select-none">
      
      <!-- Panel Central Blindado -->
      <div class="w-full max-w-lg bg-[#0b241e] border-2 border-amber-500/50 rounded-2xl shadow-2xl shadow-black overflow-hidden flex flex-col text-slate-100">
        
        <!-- Franja Superior de Seguridad -->
        <div class="bg-gradient-to-r from-red-900 via-[#07483b] to-[#05372d] p-3.5 px-6 border-b border-amber-500/40 flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <span class="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
            <span class="text-xs font-black tracking-widest uppercase text-amber-300">
              ACCESO RESTRINGIDO • SEGURIDAD PMU
            </span>
          </div>
          <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-emerald-300 font-bold border border-emerald-400/30">
            PROTECCIÓN TELEGRAM 2H
          </span>
        </div>

        <div class="p-6 md:p-8 flex flex-col items-center text-center">
          
          <!-- Escudo / Icono Principal -->
          <div class="relative mb-5">
            <div class="w-20 h-20 rounded-2xl bg-gradient-to-b from-[#0e3a30] to-[#041a15] border-2 border-amber-400/60 flex items-center justify-center shadow-xl shadow-amber-500/10">
              <span class="text-4xl">🔐</span>
            </div>
            <div class="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-md border-2 border-[#0b241e]">
              2h
            </div>
          </div>

          <!-- Títulos Institucionales -->
          <h2 class="text-xl md:text-2xl font-black tracking-wide text-white mb-1">
            Centro de Mando Operativo
          </h2>
          <p class="text-xs text-amber-300/90 font-medium mb-5 max-w-sm">
            Para manipular la interfaz, recursos y atenciones del Puesto de Mando, ingresa la clave temporal de 2 horas.
          </p>

          <!-- Mensaje de Error (si existe) -->
          @if (auth.errorMensaje()) {
            <div class="w-full mb-4 p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs font-semibold flex items-center gap-2 animate-shake">
              <span class="text-base">⚠️</span>
              <span class="text-left flex-1">{{ auth.errorMensaje() }}</span>
            </div>
          }

          <!-- Formulario de Clave -->
          <div class="w-full space-y-4">
            
            <div class="relative">
              <label class="block text-left text-[11px] font-black uppercase text-emerald-300 mb-1 tracking-wider">
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
                  class="flex-1 px-4 py-3.5 bg-black/60 border-2 border-emerald-500/50 focus:border-amber-400 rounded-xl font-mono text-lg font-black text-center tracking-widest text-amber-300 placeholder:text-slate-600 outline-none transition-all shadow-inner uppercase"
                />

                <button 
                  (click)="pegarDelPortapapeles()"
                  type="button"
                  class="px-3.5 py-3.5 bg-[#0e3a30] hover:bg-[#145244] border border-emerald-400/40 text-emerald-200 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                  title="Pegar clave desde el portapapeles"
                >
                  <span>📋</span>
                  <span class="hidden sm:inline">Pegar</span>
                </button>
              </div>
            </div>

            <!-- Botón Principal de Desbloqueo -->
            <button 
              (click)="desbloquear()"
              [disabled]="auth.cargando() || !claveIngresada.trim()"
              class="w-full py-3.5 px-6 rounded-xl font-black text-sm tracking-wider uppercase transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
              [ngClass]="{
                'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99]': !auth.cargando() && claveIngresada.trim(),
                'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed': auth.cargando() || !claveIngresada.trim()
              }"
            >
              @if (auth.cargando()) {
                <span class="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                <span>Verificando Clave con Redis...</span>
              } @else {
                <span>🛡️ Desbloquear Acceso (2 Horas)</span>
              }
            </button>

          </div>

          <!-- Canales de Obtención de Clave -->
          <div class="w-full mt-6 pt-5 border-t border-emerald-800/40 flex flex-col gap-3">
            
            <div class="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>¿No tienes la clave?</span>
              <span class="text-emerald-400 font-bold">Solicítala al Mando</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              
              <!-- Botón Telegram Oficial -->
              <a 
                href="https://t.me/SEPAMando_Bot"
                target="_blank"
                class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-[#229ED9]/20 hover:bg-[#229ED9]/30 border border-[#229ED9]/50 text-[#71c5ec] text-xs font-bold transition-all"
              >
                <span>✈️</span>
                <span>Pedir Clave en Telegram</span>
              </a>

              <!-- Botón Acceso Director por PIN Maestro -->
              <button 
                (click)="solicitarPinDirector()"
                class="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold cursor-pointer transition-all"
                title="Acceso de contingencia para Directores de Operaciones con PIN"
              >
                <span>🛡️</span>
                <span>Dirección (PIN Maestro)</span>
              </button>

            </div>

            <!-- Ayuda Clave Maestra -->
            <p class="text-[10px] text-slate-400 mt-1 font-mono">
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
    const pin = prompt('🔒 CONTROL DE SEGURIDAD PMU:\nIngresa el PIN de la Dirección de Operaciones:');
    if (pin && pin.trim() === '2026') {
      this.claveIngresada = 'SEPAM-MASTER-2026!$%';
      this.auth.verificarClave(this.claveIngresada);
    } else if (pin !== null) {
      alert('❌ PIN Incorrecto. Solicita tu clave temporal al Bot de Telegram @SEPAMando_Bot.');
    }
  }
}
