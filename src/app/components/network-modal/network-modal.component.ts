import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkService } from '../../services/network.service';
import { EmergencyService } from '../../services/emergency.service';

@Component({
  selector: 'app-network-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div class="bg-slate-900 border-2 border-emerald-500/50 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-white font-sans">
        
        <!-- ENCABEZADO MODAL SERVER-SIDE -->
        <div class="bg-[#07483b] px-6 py-4 border-b border-emerald-600/40 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-400 flex items-center justify-center text-emerald-300 shadow-inner">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base sm:text-lg font-black tracking-wide text-white uppercase">Acceso Móvil & Código QR Oficial</h2>
                <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                  Cloud Server 100% Activo
                </span>
              </div>
              <p class="text-xs text-emerald-200/90">
                Punto de entrada oficial para paramédicos y supervisores en cualquier teléfono o PC
              </p>
            </div>
          </div>

          <button 
            (click)="cerrar()"
            class="w-9 h-9 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
            title="Cerrar ventana"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- CUERPO DEL MODAL -->
        <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          
          <!-- BANNER DE INFRAESTRUCTURA SERVER-SIDE (VERCEL + ORACLE) -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-3 rounded-xl bg-slate-950 border border-emerald-500/40 flex items-center gap-3">
              <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></div>
              <div>
                <span class="text-[10px] uppercase font-mono text-slate-400 block font-bold">Servidor en la Nube</span>
                <span class="text-xs font-bold text-emerald-300">ONLINE (DuckDB + SQLite)</span>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-slate-950 border border-sky-500/40 flex items-center gap-3">
              <div class="w-2.5 h-2.5 rounded-full bg-sky-400 flex-shrink-0"></div>
              <div>
                <span class="text-[10px] uppercase font-mono text-slate-400 block font-bold">Cifrado de Seguridad</span>
                <span class="text-xs font-bold text-sky-300">HTTPS Permanente 🔒</span>
              </div>
            </div>

            <div class="p-3 rounded-xl bg-slate-950 border border-amber-500/40 flex items-center gap-3">
              <div class="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0"></div>
              <div>
                <span class="text-[10px] uppercase font-mono text-slate-400 block font-bold">Acceso Móvil</span>
                <span class="text-xs font-bold text-amber-300">Android / iPhone / PC</span>
              </div>
            </div>
          </div>

          <!-- SECCIÓN CENTRAL DE CÓDIGO QR GIGANTE -->
          <div class="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-center gap-8 shadow-2xl">
            
            <!-- CONTENEDOR DEL QR -->
            <div class="flex flex-col items-center">
              <div class="p-3 bg-white rounded-2xl shadow-2xl border-4 border-amber-400/90 transition-transform hover:scale-105">
                <img 
                  [src]="network.qrOficial" 
                  alt="Código QR Oficial SEPAM"
                  class="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                />
              </div>
              <span class="mt-3 text-[11px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                Apunta con la cámara de tu celular
              </span>
            </div>

            <!-- ENLACE Y GUÍA PASO A PASO -->
            <div class="flex-1 max-w-md space-y-4 text-center md:text-left">
              <div>
                <span class="text-xs uppercase font-mono text-amber-400 block font-bold tracking-wide">
                  Enlace Web Oficial (Copia y Comparte por WhatsApp)
                </span>
                
                <div class="mt-1 flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-700">
                  <input 
                    type="text" 
                    readonly 
                    [value]="network.urlOficial"
                    class="bg-transparent text-emerald-300 font-mono text-xs sm:text-sm font-bold w-full focus:outline-none"
                  />
                  <button 
                    (click)="copiarUrl()"
                    class="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black cursor-pointer transition-all flex items-center gap-1 shadow-sm whitespace-nowrap active:scale-95"
                    title="Copiar enlace"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    <span>Copiar</span>
                  </button>
                </div>

                @if (network.copiadoMensaje()) {
                  <p class="text-xs text-emerald-400 font-bold mt-1.5 animate-pulse">
                    ✓ {{ network.copiadoMensaje() }}
                  </p>
                }
              </div>

              <!-- PASOS SENCILLOS PARA LOS PARAMÉDICOS -->
              <div class="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-2">
                <div class="font-bold text-white flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>¿Cómo ingresa el personal de campo?</span>
                </div>
                <ol class="list-decimal list-inside space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <li>Abren la cámara normal de su celular (no necesitan descargar ninguna app de la tienda).</li>
                  <li>Apuntan al código QR en pantalla o abren el enlace enviado por WhatsApp.</li>
                  <li>Listo: ingresan inmediatamente a la ficha médica de campo para registrar atenciones y clasificar pacientes por colores de triage.</li>
                </ol>
              </div>

              <!-- NOTA DE AUTONOMÍA CLOUD -->
              <div class="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-600/30 flex items-center gap-2.5 text-[11px] text-emerald-200">
                <span class="text-base">☁️</span>
                <span>
                  <strong>100% Nube y Server-Side:</strong> No requiere routers, cables ni computadoras encendidas en el recinto. Cualquier supervisor puede acceder desde su propio celular.
                </span>
              </div>
            </div>

          </div>

        </div>

        <!-- PIE DE ACCIONES -->
        <div class="bg-slate-950 px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>SEPAM Cloud Server</span>
            <span>•</span>
            <span class="text-emerald-400">Vercel Edge + Oracle Backend</span>
          </div>

          <button 
            (click)="cerrar()"
            class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md transition-all hover:scale-105"
          >
            Entendido y Volver
          </button>
        </div>

      </div>
    </div>
  `
})
export class NetworkModalComponent {
  network = inject(NetworkService);
  emergency = inject(EmergencyService);

  copiarUrl() {
    this.network.copiarTexto(this.network.urlOficial, 'Enlace oficial copiado');
  }

  cerrar() {
    window.dispatchEvent(new CustomEvent('cerrar-modal-red'));
  }
}
