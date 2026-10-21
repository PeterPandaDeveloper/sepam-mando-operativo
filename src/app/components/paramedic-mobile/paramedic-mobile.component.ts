import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmergencyService } from '../../services/emergency.service';
import { 
  MotivoAtencion, 
  MedioTraslado, 
  Atencion 
} from '../../models/emergency.model';

@Component({
  selector: 'app-paramedic-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full max-w-xl mx-auto py-2 px-2 sm:px-4">
      
      <!-- Contenedor Táctico de Pantalla Completa para APK / Móvil -->
      <div class="w-full bg-[#f5f4ed] border-2 border-[#07483b] rounded-2xl shadow-xl overflow-hidden relative text-[#0d2822] flex flex-col min-h-[760px]">
        
        <!-- Barra Superior de Estado y Cola Offline -->
        <div class="px-4 py-2.5 flex items-center justify-between text-xs text-[#405c54] border-b border-[#d2dfd8] bg-[#edece4]">
          <div class="flex items-center gap-2 font-mono font-bold text-[#07483b]">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>TERMINAL MÓVIL DE BRIGADISTA</span>
          </div>
          <div class="flex items-center gap-2">
            @if (emergency.pendientesOffline() > 0) {
              <button 
                type="button"
                (click)="emergency.sincronizarColaOffline()"
                class="text-[10px] bg-amber-500 hover:bg-amber-600 text-slate-950 px-2.5 py-1 rounded-full font-mono font-black shadow-xs cursor-pointer transition-all flex items-center gap-1 animate-pulse"
                title="Toca para enviar reportes al Puesto de Mando ahora"
              >
                <svg class="w-3 h-3 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                <span>{{ emergency.pendientesOffline() }} guardados (Forzar Envío)</span>
              </button>
            } @else {
              <span class="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full font-mono font-bold">
                CONECTADO AL PMU
              </span>
            }

            <button 
              type="button"
              (click)="abrirConfiguracionIp()"
              class="p-1 px-2 rounded-lg bg-white/80 hover:bg-white text-[#07483b] border border-[#d2dfd8] text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
              title="Configurar IP manual del Hotspot"
            >
              <svg class="w-3 h-3 text-[#07483b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <span>IP Hotspot</span>
            </button>
          </div>
        </div>

        <!-- Encabezado del Brigadista Activo -->
        <div class="p-4 bg-[#07483b] text-white flex items-center justify-between shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white font-black text-base">
              {{ emergency.paramedicoActivo().nombre.charAt(0) }}
            </div>
            <div>
              <h2 class="text-xs font-black uppercase tracking-wider text-amber-300">Brigadista en Terreno</h2>
              <span class="text-sm font-bold text-white block">{{ emergency.paramedicoActivo().nombre }}</span>
            </div>
          </div>

          <div class="flex items-center gap-1.5 bg-[#05372d] px-3 py-1 rounded-full border border-emerald-400/30">
            <span class="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
            <span class="text-xs font-mono text-emerald-100 font-bold uppercase">
              {{ emergency.paramedicoActivo().estado }}
            </span>
          </div>
        </div>

        <!-- CUERPO OPERATIVO -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f5f4ed]">
          
          <!-- Selector de Brigadista y Cambio Rápido de Ubicación -->
          <div class="bg-white border border-[#d2dfd8] rounded-xl p-3.5 shadow-xs space-y-2.5">
            <div class="flex items-center justify-between text-xs">
              <span class="text-[#648279] font-bold uppercase text-[10px]">1. Tu Identidad en este Teléfono:</span>
              <span class="text-[11px] text-emerald-900 font-mono bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                {{ emergency.paramedicoActivo().sectorNombre }}
              </span>
            </div>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select 
                [ngModel]="emergency.paramedicoActivo().id" 
                (ngModelChange)="seleccionarParamedico($event)"
                class="w-full bg-[#f5f4ed] text-[#07483b] border border-[#d2dfd8] rounded-lg p-2.5 text-xs font-bold focus:outline-none"
              >
                @for (p of emergency.personal(); track p.id) {
                  <option [value]="p.id">{{ p.nombre }} ({{ p.usuario }})</option>
                }
              </select>

              <select 
                [ngModel]="emergency.paramedicoActivo().sectorActualId" 
                (ngModelChange)="cambiarMiZona($event)"
                class="w-full bg-[#edece4] text-[#0d2822] border border-[#d2dfd8] rounded-lg p-2.5 text-xs font-bold focus:outline-none"
                title="Cambiar mi zona actual"
              >
                @for (sec of emergency.sectores(); track sec.id) {
                  <option [value]="sec.id">Ubicado en: {{ sec.codigo }}</option>
                }
              </select>
            </div>
          </div>

          <!-- ESTADO 1: DISPONIBLE PARA NUEVA EMERGENCIA -->
          @if (!casoActivo()) {
            
            @if (!modoFormulario()) {
              <div class="py-8 flex flex-col items-center justify-center space-y-5">
                <div class="w-24 h-24 rounded-full bg-[#07483b]/10 border-2 border-[#07483b]/30 flex items-center justify-center shadow-inner">
                  <svg class="w-12 h-12 text-[#07483b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>

                <div class="text-center">
                  <h3 class="text-lg font-black text-[#0d2822]">Listo para Reportar Emergencia</h3>
                  <p class="text-xs text-[#648279] mt-1">
                    Zona cubierta: <strong class="text-[#07483b]">{{ emergency.paramedicoActivo().sectorNombre }}</strong>
                  </p>
                </div>

                <!-- Botón Gigante para uso con 1 pulgar en el concierto -->
                <button 
                  (click)="abrirFormularioNuevo()"
                  class="w-full py-5 px-6 rounded-2xl bg-[#07483b] hover:bg-[#0b5948] active:scale-95 text-white font-black text-base tracking-wider uppercase shadow-lg flex items-center justify-center gap-3 transition-all cursor-pointer"
                >
                  <svg class="w-7 h-7 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  <span>NUEVA ATENCIÓN MÉDICA</span>
                </button>
              </div>
            } @else {
              
              <!-- FORMULARIO TÁCTIL DE 1 TOQUE (CERO TECLEO INNECESARIO) -->
              <div class="space-y-4 animate-fadeIn">
                <div class="flex items-center justify-between border-b border-[#d2dfd8] pb-2">
                  <h3 class="text-xs font-black uppercase tracking-wider text-[#07483b]">
                    Paso 1: ¿Qué le ocurre al paciente?
                  </h3>
                  <button (click)="modoFormulario.set(false)" class="px-2.5 py-1 rounded bg-slate-200 text-xs text-[#0d2822] font-bold cursor-pointer">
                    ✕ Cancelar
                  </button>
                </div>

                <!-- Botones Grandes de Motivo Clínico -->
                <div class="grid grid-cols-2 gap-2">
                  @for (m of motivosDisponibles; track m) {
                    <button 
                      type="button"
                      (click)="motivoSeleccionado = m"
                      [class.border-[#07483b]]="motivoSeleccionado === m"
                      [class.bg-[#07483b]]="motivoSeleccionado === m"
                      [class.text-white]="motivoSeleccionado === m"
                      [class.border-[#d2dfd8]]="motivoSeleccionado !== m"
                      [class.bg-white]="motivoSeleccionado !== m"
                      class="p-3 rounded-xl border-2 text-left text-xs font-black cursor-pointer transition-all shadow-xs"
                    >
                      {{ m }}
                    </button>
                  }
                </div>

                <!-- Píldoras Rápidas de Ubicación en el Sector (1 Clic) -->
                <div class="bg-white p-3 rounded-xl border border-[#d2dfd8] space-y-2">
                  <label class="block text-[10px] uppercase font-black text-[#07483b]">
                    Paso 2: Punto exacto (Toca una referencia o escribe):
                  </label>
                  <div class="flex flex-wrap gap-1.5">
                    @for (ref of referenciasRapidas; track ref) {
                      <button 
                        type="button"
                        (click)="ubicacionEspecifica = ref"
                        [class.bg-amber-400]="ubicacionEspecifica === ref"
                        [class.bg-[#edece4]]="ubicacionEspecifica !== ref"
                        class="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#0d2822] cursor-pointer transition-all"
                      >
                        {{ ref }}
                      </button>
                    }
                  </div>
                  <input 
                    type="text" 
                    [(ngModel)]="ubicacionEspecifica" 
                    placeholder="Ej. Fila 4, junto a valla derecha" 
                    class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-lg p-2.5 text-xs font-bold text-[#0d2822]"
                  />
                </div>

                <!-- DATOS DEL PACIENTE CON VALIDADOR DE CÉDULA ECUATORIANA -->
                <div class="bg-white p-3.5 rounded-xl border border-[#d2dfd8] space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] font-black text-[#07483b] uppercase">
                      Paso 3: Datos del Paciente (Opcional si es urgente):
                    </span>
                    @if (cedulaPaciente().length === 10) {
                      <span 
                        class="text-[10px] font-mono px-2 py-0.5 rounded font-bold"
                        [ngClass]="cedulaValida() ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'"
                      >
                        {{ cedulaValida() ? '✓ Cédula Ecuador Válida' : '⚠ Verificar dígitos' }}
                      </span>
                    }
                  </div>
                  
                  <div class="grid grid-cols-3 gap-2">
                    <div class="col-span-2">
                      <label class="block text-[10px] text-[#648279] uppercase font-bold mb-0.5">Cédula (10 dígitos):</label>
                      <input 
                        type="tel" 
                        [ngModel]="cedulaPaciente()" 
                        (ngModelChange)="cedulaPaciente.set($event)"
                        maxlength="10" 
                        placeholder="1712345678" 
                        class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-lg p-2 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label class="block text-[10px] text-[#648279] uppercase font-bold mb-0.5">Edad aprox.:</label>
                      <input 
                        type="number" 
                        [(ngModel)]="edadPaciente" 
                        placeholder="Años" 
                        class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-lg p-2 text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[10px] text-[#648279] uppercase font-bold mb-0.5">Nombres:</label>
                      <input type="text" [(ngModel)]="nombresPaciente" placeholder="Nombre" class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-lg p-2 text-xs font-bold"/>
                    </div>
                    <div>
                      <label class="block text-[10px] text-[#648279] uppercase font-bold mb-0.5">Apellidos:</label>
                      <input type="text" [(ngModel)]="apellidosPaciente" placeholder="Apellido" class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-lg p-2 text-xs font-bold"/>
                    </div>
                  </div>

                  <!-- PÍLDORAS DE MEDICACIÓN E INSUMOS DE 1 TOQUE (CERO TECLEO) -->
                  <div>
                    <label class="block text-[10px] text-[#07483b] uppercase font-black mb-1">
                      Primeros Auxilios / Medicación Aplicada (Toca para añadir):
                    </label>
                    <div class="flex flex-wrap gap-1.5 mb-2">
                      @for (med of botiquinRapido; track med) {
                        <button 
                          type="button"
                          (click)="agregarInsumoRapido(med)"
                          class="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 text-[11px] font-bold cursor-pointer active:scale-95 transition-all"
                        >
                          + {{ med }}
                        </button>
                      }
                    </div>
                    <input 
                      type="text" 
                      [(ngModel)]="medicamentosPaciente" 
                      placeholder="Selecciona arriba o escribe el tratamiento..." 
                      class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-lg p-2 text-xs font-semibold"
                    />
                  </div>
                </div>

                <button 
                  (click)="mostrarModalConfirmacion = true"
                  class="w-full py-4 rounded-xl bg-[#07483b] hover:bg-[#0b5948] text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                >
                  <span>REGISTRAR Y NOTIFICAR AL MANDO</span>
                </button>
              </div>

            }

          } @else {
            
            <!-- ESTADO 2: PACIENTE ACTIVO EN MANOS DEL BRIGADISTA -->
            <div class="space-y-4 animate-fadeIn">
              
              <div class="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 shadow-sm">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-mono font-black text-sm text-amber-900">FICHA {{ casoActivo()!.codigo }}</span>
                  <span class="bg-amber-300 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                    {{ casoActivo()!.estado }}
                  </span>
                </div>
                <h4 class="text-base font-black text-[#0d2822] mt-1">{{ casoActivo()!.motivo }}</h4>
                <p class="text-xs font-bold text-[#405c54]">
                  Paciente: {{ casoActivo()!.nombresPaciente || 'Sin nombre' }} {{ casoActivo()!.apellidosPaciente || '' }}
                </p>
                <p class="text-xs text-[#648279] font-mono mt-0.5">
                  C.I.: {{ casoActivo()!.cedula || 'No registrada' }} • Ubicación: {{ casoActivo()!.ubicacionEspecifica }}
                </p>
              </div>

              @if (casoActivo()!.estado === 'EN_ATENCION') {
                <div class="bg-white border border-[#d2dfd8] rounded-xl p-4 space-y-3 shadow-sm">
                  <h4 class="text-xs font-black uppercase tracking-wider text-[#0d2822]">
                    ¿Cuál es la resolución con este paciente?
                  </h4>

                  <div class="space-y-2.5">
                    <button 
                      (click)="darAltaInSitu()"
                      class="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-between cursor-pointer transition-all shadow-sm"
                    >
                      <span>1) ALTA EN EL LUGAR (Ya se estabilizó)</span>
                      <span class="text-[10px] bg-black/20 px-2 py-0.5 rounded">Cerrar Ficha</span>
                    </button>

                    <button 
                      (click)="mostrarFormularioTrasladoACV = true; mostrarFormularioAmbulancia = false"
                      class="w-full py-3.5 px-4 rounded-xl bg-[#07483b] hover:bg-[#0b5948] text-white text-xs font-black flex items-center justify-between cursor-pointer transition-all shadow-sm"
                    >
                      <span>2) LLEVAR A PUESTO MÉDICO (ACV 1 o 2)</span>
                      <span class="text-[10px] bg-white/20 px-2 py-0.5 rounded">Para Triage</span>
                    </button>

                    <button 
                      (click)="mostrarFormularioAmbulancia = true; mostrarFormularioTrasladoACV = false"
                      class="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center justify-between cursor-pointer transition-all shadow-sm"
                    >
                      <span>3) PEDIR AMBULANCIA URGENTE</span>
                      <span class="text-[10px] bg-black/25 px-2 py-0.5 rounded">Evacuación</span>
                    </button>
                  </div>
                </div>
              }

              @if (mostrarFormularioTrasladoACV && casoActivo()!.estado === 'EN_ATENCION') {
                <div class="bg-white border-2 border-[#07483b] rounded-xl p-4 space-y-3 shadow-md animate-fadeIn">
                  <h4 class="text-xs font-black uppercase text-[#07483b]">
                    Elige a qué Puesto Médico (ACV) lo llevas:
                  </h4>

                  <select [(ngModel)]="acvSeleccionadoId" class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-lg p-2.5 text-xs font-bold text-[#07483b]">
                    @for (acv of emergency.acvs(); track acv.id) {
                      <option [value]="acv.id">{{ acv.codigo }} - {{ acv.nombre }}</option>
                    }
                  </select>

                  <div class="grid grid-cols-2 gap-2">
                    @for (medio of mediosTraslado; track medio) {
                      <button 
                        (click)="medioSeleccionado = medio"
                        [class.bg-[#07483b]]="medioSeleccionado === medio"
                        [class.text-white]="medioSeleccionado === medio"
                        [class.bg-[#f5f4ed]]="medioSeleccionado !== medio"
                        class="p-2.5 rounded-lg border border-[#d2dfd8] text-xs font-bold cursor-pointer"
                      >
                        {{ medio }}
                      </button>
                    }
                  </div>

                  <button 
                    (click)="confirmarTrasladoACV()"
                    class="w-full py-3.5 rounded-xl bg-[#07483b] text-white font-black text-xs uppercase cursor-pointer shadow-md"
                  >
                    Confirmar Salida hacia ACV
                  </button>
                </div>
              }

              @if (mostrarFormularioAmbulancia && casoActivo()!.estado === 'EN_ATENCION') {
                <div class="bg-white border-2 border-red-600 rounded-xl p-4 space-y-3 shadow-md animate-fadeIn">
                  <h4 class="text-xs font-black uppercase text-red-900">
                    Seleccionar Ambulancia de Evacuación:
                  </h4>

                  <select [(ngModel)]="ambulanciaSeleccionadaId" class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-lg p-2.5 text-xs font-bold text-red-950">
                    @for (amb of emergency.ambulancias(); track amb.id) {
                      <option [value]="amb.id">{{ amb.codigo }} ({{ amb.placa }}) - {{ amb.tipo }}</option>
                    }
                  </select>

                  <button 
                    (click)="confirmarTrasladoAmbulanciaDirecto()"
                    class="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase cursor-pointer shadow-md"
                  >
                    Enviar Paciente a Ambulancia
                  </button>
                </div>
              }

              <button 
                (click)="casoActivo.set(null); modoFormulario.set(false)"
                class="w-full py-3 rounded-xl bg-white border border-[#d2dfd8] hover:bg-[#edece4] text-xs text-[#0d2822] font-bold cursor-pointer"
              >
                ← Volver y Quedar Disponible
              </button>

            </div>

          }

        </div>

        <!-- MODAL DE CONFIRMACIÓN RÁPIDA -->
        @if (mostrarModalConfirmacion) {
          <div class="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div class="bg-white border-2 border-[#07483b] rounded-2xl p-5 w-full max-w-xs space-y-4 shadow-2xl">
              <div class="text-center">
                <span class="text-[10px] font-mono uppercase tracking-widest text-amber-700 block font-black">
                  Aviso al Puesto de Mando
                </span>
                <h3 class="text-base font-black text-[#0d2822] mt-1">
                  ¿Enviar reporte ahora?
                </h3>
              </div>

              <div class="bg-[#f5f4ed] p-3 rounded-xl border border-[#d2dfd8] text-xs space-y-1">
                <div>Causa: <strong class="text-[#0d2822]">{{ motivoSeleccionado }}</strong></div>
                <div>Zona: <strong class="text-[#07483b]">{{ emergency.paramedicoActivo().sectorNombre }}</strong></div>
                <div>Lugar: <strong>{{ ubicacionEspecifica }}</strong></div>
              </div>

              <div class="grid grid-cols-2 gap-2">
                <button (click)="mostrarModalConfirmacion = false" class="py-2.5 rounded-xl bg-[#edece4] text-xs font-bold text-[#405c54] cursor-pointer">Volver</button>
                <button (click)="confirmarAtencion()" class="py-2.5 rounded-xl bg-[#07483b] text-white font-black text-xs uppercase cursor-pointer">✓ Enviar</button>
              </div>
            </div>
          </div>
        }

        <!-- MODAL CONFIGURAR IP HOTSPOT -->
        @if (mostrarModalIp()) {
          <div class="absolute inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div class="bg-white border-2 border-[#07483b] rounded-2xl p-5 w-full max-w-xs space-y-4 shadow-2xl">
              <div class="text-center">
                <span class="text-[10px] font-mono uppercase tracking-widest text-[#07483b] block font-black">Configuración de Red</span>
                <h3 class="text-base font-black text-[#0d2822] mt-1">IP del Hotspot / Servidor</h3>
                <p class="text-[10px] text-[#405c54] mt-1">Escribe la IP de la laptop que ejecuta el backend SEPAM (ej: http://192.168.137.1:8000)</p>
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-mono font-bold text-[#405c54] uppercase">Dirección del servidor</label>
                <input
                  type="url"
                  [(ngModel)]="ipManualInput"
                  placeholder="http://192.168.137.1:8000"
                  class="w-full px-3 py-2.5 rounded-xl border-2 border-[#d2dfd8] focus:border-[#07483b] outline-none text-sm font-mono text-[#0d2822] bg-[#f5f4ed]"
                />
                @if (ipGuardadaActual) {
                  <p class="text-[10px] text-[#07483b] font-mono">
                    Actual: <strong>{{ ipGuardadaActual }}</strong>
                  </p>
                }
              </div>

              <div class="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  (click)="mostrarModalIp.set(false)"
                  class="py-2.5 rounded-xl bg-[#edece4] text-xs font-bold text-[#405c54] cursor-pointer"
                >Cancelar</button>
                <button
                  type="button"
                  (click)="guardarIpManual()"
                  class="py-2.5 rounded-xl bg-[#07483b] text-white font-black text-xs uppercase cursor-pointer"
                >Guardar IP</button>
              </div>

              <button
                type="button"
                (click)="limpiarIpManual()"
                class="w-full py-2 rounded-xl border border-red-200 text-[10px] text-red-600 font-mono cursor-pointer hover:bg-red-50"
              >Restablecer al Hotspot por defecto (192.168.137.1)</button>
            </div>
          </div>
        }

      </div>

    </div>
  `
})
export class ParamedicMobileComponent {
  emergency = inject(EmergencyService);

  modoFormulario = signal(false);
  casoActivo = signal<Atencion | null>(null);
  mostrarModalConfirmacion = false;
  mostrarFormularioTrasladoACV = false;
  mostrarFormularioAmbulancia = false;

  // -- Configuración IP Manual --
  mostrarModalIp = signal(false);
  ipManualInput = '';
  ipGuardadaActual = localStorage.getItem('sepam_server_host') ?? '';

  abrirConfiguracionIp() {
    this.ipGuardadaActual = localStorage.getItem('sepam_server_host') ?? '';
    this.ipManualInput = this.ipGuardadaActual;
    this.mostrarModalIp.set(true);
  }

  guardarIpManual() {
    const ip = this.ipManualInput.trim();
    if (ip) {
      localStorage.setItem('sepam_server_host', ip);
      this.ipGuardadaActual = ip;
    }
    this.mostrarModalIp.set(false);
  }

  limpiarIpManual() {
    localStorage.removeItem('sepam_server_host');
    this.ipGuardadaActual = '';
    this.ipManualInput = '';
    this.mostrarModalIp.set(false);
  }

  motivosDisponibles: MotivoAtencion[] = [
    'Trauma o caída',
    'Malestar general',
    'Dolor torácico',
    'Dificultad respiratoria',
    'Síncope o convulsión',
    'Intoxicación',
    'Lesión leve',
    'Herida cortante',
    'Crisis de ansiedad',
    'Otro motivo'
  ];

  referenciasRapidas: string[] = [
    'Frente a Tarima / Valla',
    'Grada Central',
    'Puerta de Ingreso',
    'Zona Baños / Hidratación',
    'Cancha General'
  ];

  botiquinRapido: string[] = [
    'Suero Oral',
    'Paracetamol 1g',
    'Hielo / Crioterapia',
    'Vendaje / Curación',
    'Oxígeno 3L',
    'Control de Presión',
    'Reposo Vocal/Físico'
  ];

  mediosTraslado: MedioTraslado[] = ['Marcha asistida', 'Silla de ruedas', 'Camilla', 'Ambulancia'];

  motivoSeleccionado: MotivoAtencion = 'Trauma o caída';
  ubicacionEspecifica = 'Frente a Tarima / Valla';
  cedulaPaciente = signal('');
  nombresPaciente = '';
  apellidosPaciente = '';
  edadPaciente?: number;
  medicamentosPaciente = '';

  acvSeleccionadoId = 'acv-1';
  medioSeleccionado: MedioTraslado = 'Camilla';
  ambulanciaSeleccionadaId = 'amb-1';

  // Algoritmo Oficial Módulo 10 del Registro Civil del Ecuador
  cedulaValida = computed(() => {
    const ced = this.cedulaPaciente().trim();
    if (!/^\d{10}$/.test(ced)) return false;
    const prov = parseInt(ced.substring(0, 2), 10);
    if ((prov < 1 || prov > 24) && prov !== 30) return false;
    const coef = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    for (let i = 0; i < 9; i++) {
      let val = parseInt(ced.charAt(i), 10) * coef[i];
      if (val >= 10) val -= 9;
      suma += val;
    }
    const digitoVerificador = (10 - (suma % 10)) % 10;
    return digitoVerificador === parseInt(ced.charAt(9), 10);
  });

  seleccionarParamedico(id: string) {
    const p = this.emergency.personal().find(item => item.id === id);
    if (p) this.emergency.setParamedicoActivo(p);
  }

  cambiarMiZona(sectorId: string) {
    this.emergency.cambiarSectorParamedico(this.emergency.paramedicoActivo().id, sectorId);
  }

  agregarInsumoRapido(insumo: string) {
    if (!this.medicamentosPaciente) {
      this.medicamentosPaciente = insumo;
    } else if (!this.medicamentosPaciente.includes(insumo)) {
      this.medicamentosPaciente = `${this.medicamentosPaciente} + ${insumo}`;
    }
  }

  abrirFormularioNuevo() {
    this.cedulaPaciente.set('');
    this.nombresPaciente = '';
    this.apellidosPaciente = '';
    this.edadPaciente = undefined;
    this.medicamentosPaciente = '';
    this.modoFormulario.set(true);
  }

  confirmarAtencion() {
    this.mostrarModalConfirmacion = false;
    const nueva = this.emergency.iniciarAtencion(
      this.motivoSeleccionado, 
      this.ubicacionEspecifica,
      {
        cedula: this.cedulaPaciente() || undefined,
        nombres: this.nombresPaciente || undefined,
        apellidos: this.apellidosPaciente || undefined,
        edad: this.edadPaciente,
        medicamentos: this.medicamentosPaciente || undefined
      }
    );
    this.casoActivo.set(nueva);
    this.modoFormulario.set(false);
  }

  darAltaInSitu() {
    if (!this.casoActivo()) return;
    this.emergency.altaInSitu(this.casoActivo()!.id, this.medicamentosPaciente);
    this.casoActivo.set(null);
  }

  confirmarTrasladoACV() {
    if (!this.casoActivo()) return;
    this.emergency.iniciarTrasladoACV(
      this.casoActivo()!.id,
      this.acvSeleccionadoId,
      this.medioSeleccionado,
      'Requiere vigilancia continua',
      'Traslado al puesto médico'
    );
    this.mostrarFormularioTrasladoACV = false;
    this.casoActivo.set(null);
  }

  confirmarTrasladoAmbulanciaDirecto() {
    if (!this.casoActivo()) return;
    this.emergency.derivarDirectoAmbulancia(this.casoActivo()!.id, this.ambulanciaSeleccionadaId);
    this.mostrarFormularioAmbulancia = false;
    this.casoActivo.set(null);
  }
}
