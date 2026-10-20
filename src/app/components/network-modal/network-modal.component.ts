import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkService } from '../../services/network.service';
import { EmergencyService } from '../../services/emergency.service';

@Component({
  selector: 'app-network-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div class="bg-white border-2 border-[#07483b] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-sans">
        
        <!-- ENCABEZADO -->
        <div class="bg-[#07483b] px-6 py-4 border-b border-[#d2dfd8] flex items-center justify-between text-white">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-amber-300 shadow-inner">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base sm:text-lg font-black tracking-wide uppercase text-white">
                  Red Madre del Puesto de Mando (Hotspot & QR)
                </h2>
                <span class="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950">
                  {{ network.diagnostico()?.modo_activo || 'RED LOCAL ACTIVA' }}
                </span>
              </div>
              <p class="text-xs text-emerald-100">
                Conecta todos los celulares y APKs a la misma red Wi-Fi de esta PC para transmisión instantánea
              </p>
            </div>
          </div>

          <button 
            (click)="cerrar()"
            class="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        <!-- CUERPO DEL MODAL -->
        <div class="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-[#f5f4ed]">
          
          <!-- ESTADO EN VIVO DE LA RED DE LA LAPTOP -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            <!-- Tarjeta 1: Hotspot de Windows -->
            <div class="p-3.5 rounded-xl bg-white border-2 flex items-center gap-3 shadow-xs"
                 [ngClass]="network.diagnostico()?.hotspot_activo ? 'border-emerald-500 bg-emerald-50/40' : 'border-[#d2dfd8]'">
              <div class="w-3 h-3 rounded-full flex-shrink-0"
                   [ngClass]="network.diagnostico()?.hotspot_activo ? 'bg-emerald-600 animate-ping' : 'bg-amber-500'"></div>
              <div>
                <span class="text-[10px] uppercase font-mono text-[#648279] block font-bold">Hotspot Móvil PC</span>
                <span class="text-xs font-black text-[#07483b]">
                  {{ network.diagnostico()?.hotspot_activo ? 'ACTIVO (192.168.137.1)' : 'Usando Wi-Fi / LAN' }}
                </span>
              </div>
            </div>

            <!-- Tarjeta 2: IP Madre del Servidor -->
            <div class="p-3.5 rounded-xl bg-white border border-[#d2dfd8] flex items-center gap-3 shadow-xs">
              <div class="w-3 h-3 rounded-full bg-sky-600 flex-shrink-0"></div>
              <div>
                <span class="text-[10px] uppercase font-mono text-[#648279] block font-bold">IP Madre de esta PC</span>
                <span class="text-xs font-mono font-black text-sky-900">
                  {{ network.diagnostico()?.ip_recomendada || '192.168.137.1' }}:8000
                </span>
              </div>
            </div>

            <!-- Tarjeta 3: Botón de Refrescar Detección -->
            <div class="p-3 rounded-xl bg-white border border-[#d2dfd8] flex items-center justify-between shadow-xs">
              <div>
                <span class="text-[10px] uppercase font-mono text-[#648279] block font-bold">Estado del Hotspot</span>
                <span class="text-xs font-bold text-[#0d2822]">Detecta la IP al instante</span>
              </div>
              <button 
                (click)="network.actualizarDiagnosticoRed()"
                class="px-3 py-1.5 rounded-lg bg-[#07483b] hover:bg-[#0b5948] text-white text-xs font-black cursor-pointer shadow-xs"
              >
                {{ network.cargando() ? '...' : 'Actualizar' }}
              </button>
            </div>
          </div>

          <!-- SELECTOR DE MODO: RED HOTSPOT LOCAL (RECOMENDADO) VS NUBE -->
          <div class="flex items-center justify-center gap-2 bg-[#edece4] p-1.5 rounded-xl border border-[#d2dfd8]">
            <button 
              (click)="network.modoQrSeleccionado.set('local')"
              [class.bg-[#07483b]]="network.modoQrSeleccionado() === 'local'"
              [class.text-white]="network.modoQrSeleccionado() === 'local'"
              class="flex-1 py-2 px-3 rounded-lg text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/>
              </svg>
              <span>1. Red Madre Local / Hotspot PC (Sin gastar datos • Ultra Rápido)</span>
            </button>
            <button 
              (click)="network.modoQrSeleccionado.set('nube')"
              [class.bg-[#07483b]]="network.modoQrSeleccionado() === 'nube'"
              [class.text-white]="network.modoQrSeleccionado() === 'nube'"
              class="flex-1 py-2 px-3 rounded-lg text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"/>
              </svg>
              <span>2. Servidor Nube (Para brigadistas lejanos con 4G/5G)</span>
            </button>
          </div>

          <!-- SECCIÓN CENTRAL DE CÓDIGO QR OFFLINE -->
          <div class="bg-white border border-[#d2dfd8] rounded-2xl p-6 flex flex-col md:flex-row items-center justify-center gap-8 shadow-sm">
            
            <div class="flex flex-col items-center">
              <div class="p-3 bg-white rounded-2xl shadow-md border-4 border-[#07483b] transition-transform hover:scale-105">
                <img 
                  [src]="network.qrOficial()" 
                  alt="Código QR SEPAM"
                  class="w-56 h-56 sm:w-60 sm:h-60 object-contain"
                />
              </div>
              <span class="mt-2.5 text-[11px] font-mono text-[#07483b] uppercase tracking-wider font-black">
                Escanea con la cámara o desde la APK
              </span>
            </div>

            <div class="flex-1 max-w-md space-y-4 text-center md:text-left">
              <div>
                <span class="text-xs uppercase font-mono text-[#07483b] block font-black">
                  Dirección del Servidor en la Red Madre:
                </span>
                
                <div class="mt-1 flex items-center gap-2 p-2.5 rounded-xl bg-[#edece4] border border-[#d2dfd8]">
                  <input 
                    type="text" 
                    readonly 
                    [value]="network.urlOficial()"
                    class="bg-transparent text-[#07483b] font-mono text-xs font-black w-full focus:outline-none"
                  />
                  <button 
                    (click)="copiarUrl()"
                    class="px-3 py-1.5 rounded-lg bg-[#07483b] hover:bg-[#0d2822] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                  >
                    Copiar
                  </button>
                </div>

                @if (network.copiadoMensaje()) {
                  <p class="text-xs text-emerald-700 font-bold mt-1">
                    ✓ {{ network.copiadoMensaje() }}
                  </p>
                }
              </div>

              <!-- PASOS CLAROS PARA CONECTAR TODOS AL HOTSPOT -->
              <div class="p-4 rounded-xl bg-[#f5f4ed] border border-[#d2dfd8] text-xs text-[#0d2822] space-y-2 text-left">
                <div class="font-black text-[#07483b] uppercase text-[11px]">
                  ¿Cómo enlazar todos los móviles a esta PC en 3 pasos?
                </div>
                <ol class="list-decimal list-inside space-y-1.5 text-[#405c54] text-xs font-medium leading-relaxed">
                  <li>Enciende la <strong>"Zona con cobertura móvil" (Hotspot)</strong> en Windows 11 (o conecta el router TP-Link).</li>
                  <li>Haz que todos los brigadistas conecten el Wi-Fi de sus teléfonos a la red de la laptop.</li>
                  <li>Que apunten su cámara a este <strong>Código QR</strong> (o en la APK ingresen la IP <strong>{{ network.diagnostico()?.ip_recomendada || '192.168.137.1' }}</strong>). ¡Listo, todos transmiten en tiempo real!</li>
                </ol>
              </div>
            </div>

          </div>

        </div>

        <!-- PIE -->
        <div class="bg-white px-6 py-3 border-t border-[#d2dfd8] flex items-center justify-between">
          <span class="text-xs text-[#648279] font-mono">
            Modo detectado: <strong>{{ network.diagnostico()?.mensaje_modo || 'Servidor Local Activo' }}</strong>
          </span>
          <button 
            (click)="cerrar()"
            class="px-5 py-2 rounded-xl bg-[#07483b] hover:bg-[#0d2822] text-white font-black text-xs cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  `
})
export class NetworkModalComponent implements OnInit {
  network = inject(NetworkService);
  emergency = inject(EmergencyService);

  ngOnInit() {
    this.network.actualizarDiagnosticoRed();
  }

  copiarUrl() {
    this.network.copiarTexto(this.network.urlOficial(), 'Dirección copiada');
  }

  cerrar() {
    window.dispatchEvent(new CustomEvent('cerrar-modal-red'));
  }
}
