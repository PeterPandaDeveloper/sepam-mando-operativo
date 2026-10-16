import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmergencyService } from '../../services/emergency.service';
import { 
  MotivoAtencion, 
  MedioTraslado, 
  CondicionAparente, 
  Atencion 
} from '../../models/emergency.model';

@Component({
  selector: 'app-paramedic-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="w-full max-w-xl mx-auto py-2 px-2 sm:px-4">
      
      <!-- Contenedor Nativo Táctico de Brigadista -->
      <div class="w-full bg-[#f5f4ed] border-2 border-[#07483b] rounded-2xl shadow-xl overflow-hidden relative text-[#0d2822] flex flex-col min-h-[750px]">
        
        <!-- Barra de Estado Operativo Táctico -->
        <div class="px-4 py-2 flex items-center justify-between text-xs text-[#405c54] border-b border-[#d2dfd8] bg-[#edece4]">
          <div class="flex items-center gap-1.5 font-mono font-bold text-[#07483b]">
            <span class="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>SEPAM MÓVIL BRIGADISTAS</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold">
              EN VIVO
            </span>
          </div>
        </div>

        <!-- Encabezado de la App del Paramédico (Verde Bosque) -->
        <div class="p-4 bg-[#07483b] text-white flex items-center justify-between shadow-sm">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-full bg-white/20 border border-white/40 flex items-center justify-center text-white font-black text-sm">
              {{ emergency.paramedicoActivo().nombre.charAt(0) }}
            </div>
            <div>
              <h2 class="text-xs font-black uppercase tracking-wider text-white">Atención en Terreno (Campo)</h2>
              <span class="text-[11px] text-emerald-100 block">{{ emergency.paramedicoActivo().nombre }} ({{ emergency.paramedicoActivo().usuario }})</span>
            </div>
          </div>

          <div class="flex items-center gap-1.5 bg-[#05372d] px-2.5 py-1 rounded-full border border-emerald-400/30">
            <span class="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
            <span class="text-[11px] font-mono text-emerald-100 font-bold uppercase">
              {{ emergency.paramedicoActivo().estado }}
            </span>
          </div>
        </div>

        <!-- CUERPO PRINCIPAL DEL MÓVIL (Beige #f5f4ed) -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f5f4ed]">
          
          <!-- Selector Rápido de Paramédico (Sin contraseñas a la vista) -->
          <div class="bg-white border border-[#d2dfd8] rounded-xl p-3 shadow-xs">
            <div class="flex items-center justify-between text-xs mb-1.5">
              <span class="text-[#648279] font-bold">Brigadista Activo en Dispositivo:</span>
              <span class="text-[10px] text-emerald-800 font-mono bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                Sector: {{ emergency.paramedicoActivo().sectorNombre }}
              </span>
            </div>
            
            <select 
              [ngModel]="emergency.paramedicoActivo().id" 
              (ngModelChange)="seleccionarParamedico($event)"
              class="w-full bg-[#f5f4ed] text-[#07483b] border border-[#d2dfd8] rounded-lg p-2 text-xs font-bold focus:outline-none"
            >
              @for (p of emergency.personal(); track p.id) {
                <option [value]="p.id">{{ p.usuario }} - {{ p.nombre }} ({{ p.sectorNombre }})</option>
              }
            </select>
          </div>

          <!-- ESTADO 1: DISPONIBLE -->
          @if (!casoActivo()) {
            
            @if (!modoFormulario()) {
              <div class="py-6 flex flex-col items-center justify-center space-y-4">
                <div class="w-20 h-20 rounded-full bg-[#07483b]/10 border-2 border-[#07483b]/30 flex items-center justify-center">
                  <svg class="w-10 h-10 text-[#07483b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>

                <div class="text-center">
                  <h3 class="text-base font-bold text-[#0d2822]">Paramédico en Posición</h3>
                  <p class="text-xs text-[#648279] mt-1 max-w-[240px]">
                    Sector actual: <strong class="text-[#07483b]">{{ emergency.paramedicoActivo().sectorNombre }}</strong>
                  </p>
                </div>

                <!-- Botón Principal en Verde Bosque -->
                <button 
                  (click)="abrirFormularioNuevo()"
                  class="w-full py-4 px-6 rounded-2xl bg-[#07483b] hover:bg-[#0b5948] active:scale-95 text-white font-black text-sm tracking-wider uppercase shadow-md flex items-center justify-center gap-3 transition-all cursor-pointer"
                >
                  <svg class="w-6 h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                  <span>Iniciar Atención</span>
                </button>
              </div>
            } @else {
              
              <!-- FORMULARIO DE ATENCIÓN DE CAMPO (Fiel a la petición del audio: Cédula, Nombres, Medicamentos) -->
              <div class="space-y-3.5 animate-fadeIn">
                <div class="flex items-center justify-between border-b border-[#d2dfd8] pb-2">
                  <h3 class="text-xs font-bold uppercase tracking-wider text-[#07483b] flex items-center gap-1.5">
                    <span class="w-2 h-2 rounded-full bg-[#07483b]"></span>
                    01. Datos de la Incidencia
                  </h3>
                  <button (click)="modoFormulario.set(false)" class="text-xs text-[#648279] font-semibold">✕ Cancelar</button>
                </div>

                <!-- Motivos Rápidos -->
                <div>
                  <label class="block text-[10px] uppercase font-bold text-[#405c54] mb-1">Motivo Principal:</label>
                  <div class="grid grid-cols-2 gap-1.5">
                    @for (m of motivosDisponibles; track m) {
                      <button 
                        (click)="motivoSeleccionado = m"
                        [class.border-[#07483b]]="motivoSeleccionado === m"
                        [class.bg-[#edf5f2]]="motivoSeleccionado === m"
                        [class.text-[#07483b]]="motivoSeleccionado === m"
                        [class.border-[#d2dfd8]]="motivoSeleccionado !== m"
                        [class.bg-white]="motivoSeleccionado !== m"
                        class="p-2 rounded-lg border text-left text-[11px] font-bold cursor-pointer transition-all shadow-xs"
                      >
                        {{ m }}
                      </button>
                    }
                  </div>
                </div>

                <!-- Ubicación Específica -->
                <div>
                  <label class="block text-[10px] uppercase font-bold text-[#405c54] mb-1">Ubicación en el sector:</label>
                  <input type="text" [(ngModel)]="ubicacionEspecifica" placeholder="Ej. Grada 14, junto a salida 2" class="w-full bg-white border border-[#d2dfd8] rounded-lg p-2 text-xs text-[#0d2822]"/>
                </div>

                <!-- DATOS DEL PACIENTE (Cédula de Ecuador solicitada en audio) -->
                <div class="bg-white p-3 rounded-xl border border-[#d2dfd8] space-y-2">
                  <span class="text-[10px] font-bold text-[#07483b] uppercase block">Ficha Rápida del Paciente (Opcional en Campo):</span>
                  
                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[9px] text-[#648279] uppercase font-bold">Cédula (10 dígitos):</label>
                      <input type="text" [(ngModel)]="cedulaPaciente" maxlength="10" placeholder="1712345678" class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded p-1.5 text-xs font-mono font-bold"/>
                    </div>
                    <div>
                      <label class="block text-[9px] text-[#648279] uppercase font-bold">Edad:</label>
                      <input type="number" [(ngModel)]="edadPaciente" placeholder="Años" class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded p-1.5 text-xs"/>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    <div>
                      <label class="block text-[9px] text-[#648279] uppercase font-bold">Nombres:</label>
                      <input type="text" [(ngModel)]="nombresPaciente" placeholder="Ej. Juan Carlos" class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded p-1.5 text-xs"/>
                    </div>
                    <div>
                      <label class="block text-[9px] text-[#648279] uppercase font-bold">Apellidos:</label>
                      <input type="text" [(ngModel)]="apellidosPaciente" placeholder="Ej. Pérez Gómez" class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded p-1.5 text-xs"/>
                    </div>
                  </div>

                  <div>
                    <label class="block text-[9px] text-[#648279] uppercase font-bold">Medicamentos Administrados In Situ:</label>
                    <input type="text" [(ngModel)]="medicamentosPaciente" placeholder="Ej. Paracetamol 1g, Crioterapia, Suero Oral..." class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded p-1.5 text-xs"/>
                  </div>
                </div>

                <button 
                  (click)="mostrarModalConfirmacion = true"
                  class="w-full py-3.5 rounded-xl bg-[#07483b] hover:bg-[#0b5948] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Confirmar e Iniciar</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                  </svg>
                </button>
              </div>

            }

          } @else {
            
            <!-- ESTADO 2: CASO ACTIVO EN ATENCIÓN -->
            <div class="space-y-4 animate-fadeIn">
              
              <div class="bg-amber-50 border border-amber-300 rounded-xl p-3.5 shadow-sm">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-mono font-bold text-amber-800">{{ casoActivo()!.codigo }}</span>
                  <span class="bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">
                    {{ casoActivo()!.estado }}
                  </span>
                </div>
                <h4 class="text-sm font-extrabold text-[#0d2822] mt-1">{{ casoActivo()!.motivo }}</h4>
                <p class="text-xs text-[#405c54]">Paciente: {{ casoActivo()!.nombresPaciente || 'No especificado' }} {{ casoActivo()!.apellidosPaciente || '' }}</p>
                <p class="text-[11px] text-[#648279]">C.I.: {{ casoActivo()!.cedula || 'Pendiente' }}</p>
              </div>

              <!-- 3 OPCIONES OPERATIVAS SEGÚN EL AUDIO DEL CLIENTE:
                   1) ALTA IN SITU (se atendió ahí mismo)
                   2) TRASLADO A ACV (ACV 1 o ACV 2)
                   3) TRASLADO DIRECTO A AMBULANCIA -->
              @if (casoActivo()!.estado === 'EN_ATENCION') {
                <div class="bg-white border border-[#d2dfd8] rounded-xl p-4 space-y-3 shadow-sm">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-[#0d2822]">
                    Decisión Operativa del Paramédico:
                  </h4>

                  <div class="space-y-2">
                    <!-- Opción 1: Alta In Situ -->
                    <button 
                      (click)="darAltaInSitu()"
                      class="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center justify-between cursor-pointer transition-all"
                    >
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                        <span>1) Alta In Situ (Resuelto en el lugar)</span>
                      </div>
                      <span class="text-[10px] text-emerald-700 font-semibold">Con medicación</span>
                    </button>

                    <!-- Opción 2: Traslado a ACV 1 o ACV 2 -->
                    <button 
                      (click)="mostrarFormularioTrasladoACV = true; mostrarFormularioAmbulancia = false"
                      class="w-full py-2.5 px-3 rounded-xl bg-[#07483b] hover:bg-[#0b5948] text-white text-xs font-bold flex items-center justify-between cursor-pointer transition-all shadow-xs"
                    >
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                        <span>2) Trasladar a Puesto Médico (ACV 1 / 2)</span>
                      </div>
                      <span class="text-[10px] text-emerald-200">Triage</span>
                    </button>

                    <!-- Opción 3: Traslado directo a Ambulancia -->
                    <button 
                      (click)="mostrarFormularioAmbulancia = true; mostrarFormularioTrasladoACV = false"
                      class="w-full py-2.5 px-3 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold flex items-center justify-between cursor-pointer transition-all shadow-xs"
                    >
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l2 4v6a1 1 0 01-1 1h-1a2 2 0 11-4 0H8a2 2 0 11-4 0H3a1 1 0 01-1-1v-6l2-4h4m12 0l-2-4H6L4 7m4 0v4m0 0h4m-4 0H4"/></svg>
                        <span>3) Trasladar directo a Ambulancia</span>
                      </div>
                      <span class="text-[10px] text-cyan-200">Urgente</span>
                    </button>
                  </div>
                </div>
              }

              <!-- SUBFORMULARIO TRASLADO A ACV 1 O ACV 2 -->
              @if (mostrarFormularioTrasladoACV && casoActivo()!.estado === 'EN_ATENCION') {
                <div class="bg-white border-2 border-emerald-600 rounded-xl p-4 space-y-3 shadow-md animate-fadeIn">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-[#07483b]">
                    Seleccionar Destino ACV (1 o 2):
                  </h4>

                  <div>
                    <label class="block text-[10px] font-bold text-[#405c54] mb-1">Puesto de Víctimas de Destino:</label>
                    <select [(ngModel)]="acvSeleccionadoId" class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-lg p-2 text-xs font-bold text-[#07483b]">
                      @for (acv of emergency.acvs(); track acv.id) {
                        <option [value]="acv.id">{{ acv.codigo }} - {{ acv.nombre }} ({{ acv.encargado }})</option>
                      }
                    </select>
                  </div>

                  <div class="grid grid-cols-2 gap-2">
                    @for (medio of mediosTraslado; track medio) {
                      <button 
                        (click)="medioSeleccionado = medio"
                        [class.border-[#07483b]]="medioSeleccionado === medio"
                        [class.bg-[#edf5f2]]="medioSeleccionado === medio"
                        [class.border-[#d2dfd8]]="medioSeleccionado !== medio"
                        class="p-2 rounded-lg border text-xs font-bold"
                      >
                        {{ medio }}
                      </button>
                    }
                  </div>

                  <button 
                    (click)="confirmarTrasladoACV()"
                    class="w-full py-3 rounded-xl bg-[#07483b] text-white font-black text-xs uppercase"
                  >
                    Confirmar Traslado a ACV
                  </button>
                </div>
              }

              <!-- SUBFORMULARIO TRASLADO DIRECTO A AMBULANCIA -->
              @if (mostrarFormularioAmbulancia && casoActivo()!.estado === 'EN_ATENCION') {
                <div class="bg-white border-2 border-cyan-600 rounded-xl p-4 space-y-3 shadow-md animate-fadeIn">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-cyan-900">
                    Derivación Directa a Ambulancia:
                  </h4>

                  <div>
                    <label class="block text-[10px] font-bold text-[#405c54] mb-1">Seleccionar Unidad Móvil:</label>
                    <select [(ngModel)]="ambulanciaSeleccionadaId" class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-lg p-2 text-xs font-bold text-cyan-950">
                      @for (amb of emergency.ambulancias(); track amb.id) {
                        <option [value]="amb.id">{{ amb.codigo }} ({{ amb.placa }}) - {{ amb.paramedicoResponsable }}</option>
                      }
                    </select>
                  </div>

                  <button 
                    (click)="confirmarTrasladoAmbulanciaDirecto()"
                    class="w-full py-3 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white font-black text-xs uppercase"
                  >
                    Despachar hacia Ambulancia
                  </button>
                </div>
              }

              <!-- BOTÓN VOLVER AL PERFIL -->
              <button 
                (click)="casoActivo.set(null); modoFormulario.set(false)"
                class="w-full py-2.5 rounded-lg bg-white border border-[#d2dfd8] hover:bg-[#edece4] text-xs text-[#405c54] font-semibold cursor-pointer"
              >
                ← Volver al estado disponible
              </button>

            </div>

          }

        </div>

        <!-- PIE DE PÁGINA DEL CELULAR -->
        <div class="p-3 bg-[#edece4] border-t border-[#d2dfd8] flex justify-center">
          <div class="w-28 h-1 bg-[#405c54] rounded-full"></div>
        </div>

        <!-- MODAL DE DOBLE CONFIRMACIÓN OPERATIVA -->
        @if (mostrarModalConfirmacion) {
          <div class="absolute inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div class="bg-white border-2 border-[#07483b] rounded-2xl p-5 w-full max-w-xs space-y-4 shadow-2xl">
              <div class="text-center">
                <span class="text-[10px] font-mono uppercase tracking-widest text-[#d97706] block font-bold">
                  Confirmación Operativa
                </span>
                <h3 class="text-sm font-black text-[#0d2822] mt-1">
                  ¿Iniciar la atención ahora?
                </h3>
                <p class="text-[11px] text-[#648279] mt-1">
                  Se transmitirá al Centro de Mando y al ACV.
                </p>
              </div>

              <div class="bg-[#f5f4ed] p-3 rounded-lg border border-[#d2dfd8] text-[11px] space-y-1 font-mono">
                <div>Motivo: <strong class="text-[#0d2822]">{{ motivoSeleccionado }}</strong></div>
                <div>Sector: <strong class="text-[#07483b]">{{ emergency.paramedicoActivo().sectorNombre }}</strong></div>
                <div>Paramédico: <strong>{{ emergency.paramedicoActivo().nombre }}</strong></div>
              </div>

              <div class="grid grid-cols-2 gap-2 pt-2">
                <button (click)="mostrarModalConfirmacion = false" class="py-2 rounded-lg bg-[#edece4] text-xs font-bold text-[#405c54]">Cancelar</button>
                <button (click)="confirmarAtencion()" class="py-2 rounded-lg bg-[#07483b] text-white font-bold text-xs uppercase">✓ Sí, Iniciar</button>
              </div>
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

  mediosTraslado: MedioTraslado[] = ['Marcha asistida', 'Silla de ruedas', 'Camilla', 'Ambulancia'];

  motivoSeleccionado: MotivoAtencion = 'Trauma o caída';
  ubicacionEspecifica = 'Frente a vallas, sector derecho';
  cedulaPaciente = '17';
  nombresPaciente = '';
  apellidosPaciente = '';
  edadPaciente?: number;
  medicamentosPaciente = '';

  acvSeleccionadoId = 'acv-1';
  medioSeleccionado: MedioTraslado = 'Camilla';
  ambulanciaSeleccionadaId = 'amb-1';

  seleccionarParamedico(id: string) {
    const p = this.emergency.personal().find(item => item.id === id);
    if (p) this.emergency.setParamedicoActivo(p);
  }

  abrirFormularioNuevo() {
    this.modoFormulario.set(true);
  }

  confirmarAtencion() {
    this.mostrarModalConfirmacion = false;
    const nueva = this.emergency.iniciarAtencion(
      this.motivoSeleccionado, 
      this.ubicacionEspecifica,
      {
        cedula: this.cedulaPaciente,
        nombres: this.nombresPaciente,
        apellidos: this.apellidosPaciente,
        edad: this.edadPaciente,
        medicamentos: this.medicamentosPaciente
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
  }

  confirmarTrasladoAmbulanciaDirecto() {
    if (!this.casoActivo()) return;
    this.emergency.derivarDirectoAmbulancia(this.casoActivo()!.id, this.ambulanciaSeleccionadaId);
    this.mostrarFormularioAmbulancia = false;
  }
}
