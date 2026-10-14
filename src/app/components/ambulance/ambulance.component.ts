import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmergencyService } from '../../services/emergency.service';
import { Atencion, Ambulancia } from '../../models/emergency.model';

@Component({
  selector: 'app-ambulance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">

      <!-- Encabezado de la Unidad Móvil de Ambulancia -->
      <div class="bg-white border border-[#d2dfd8] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 text-cyan-900 border border-cyan-300 uppercase font-bold">
              Módulo de Soporte Vital Móvil
            </span>
            <span class="text-xs text-[#648279] font-mono">Unidades Prehospitalarias & Derivación Hospitalaria</span>
          </div>
          <h2 class="text-xl md:text-2xl font-black text-[#0d2822] flex items-center gap-2">
            <span>🚑 Recepción y Traslado en Ambulancia</span>
          </h2>
          <p class="text-xs text-[#405c54] mt-1">
            Recepción de pacientes derivados desde terreno o desde el ACV. Gestión de alta en unidad móvil o derivación a Hospital/Casa de Salud.
          </p>
        </div>

        <!-- Selector de Ambulancia Activa -->
        <div class="flex items-center gap-3">
          <div class="bg-[#f5f4ed] border border-[#d2dfd8] p-2.5 rounded-xl text-xs">
            <label class="block text-[10px] font-bold text-[#648279] uppercase">Ambulancia en Operación:</label>
            <select 
              [ngModel]="ambulanciaActiva().id" 
              (ngModelChange)="cambiarAmbulancia($event)"
              class="bg-white border border-[#d2dfd8] rounded px-2.5 py-1 text-xs font-bold text-[#07483b] focus:outline-none"
            >
              @for (amb of emergency.ambulancias(); track amb.id) {
                <option [value]="amb.id">{{ amb.codigo }} ({{ amb.placa }}) - {{ amb.paramedicoResponsable }}</option>
              }
            </select>
          </div>
        </div>
      </div>

      <!-- SECCIÓN 1: PACIENTES EN CAMINO / PENDIENTES DE RECEPCIÓN EN AMBULANCIA -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div class="bg-white border border-[#d2dfd8] rounded-xl p-4 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-[#edece4] pb-3">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-cyan-600 animate-ping"></span>
              <h3 class="text-xs font-bold uppercase tracking-wider text-[#0d2822]">
                Pacientes Asignados a la Ambulancia
              </h3>
            </div>
            <span class="text-xs text-cyan-800 font-mono font-bold bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
              {{ pacientesParaAmbulancia().length }} en cola
            </span>
          </div>

          @if (pacientesParaAmbulancia().length === 0) {
            <div class="p-8 text-center text-xs text-[#648279]">
              No hay pacientes derivados hacia las ambulancias en este momento.
            </div>
          } @else {
            <div class="space-y-3">
              @for (item of pacientesParaAmbulancia(); track item.id) {
                <div 
                  (click)="seleccionarCaso(item)"
                  [class.border-[#07483b]]="casoSeleccionado?.id === item.id"
                  [class.bg-[#edf5f2]]="casoSeleccionado?.id === item.id"
                  [class.border-[#d2dfd8]]="casoSeleccionado?.id !== item.id"
                  [class.bg-[#fbfbfa]]="casoSeleccionado?.id !== item.id"
                  class="p-3.5 rounded-lg border hover:border-[#07483b] cursor-pointer transition-all space-y-2 shadow-xs"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-mono font-bold text-[#07483b] text-xs">{{ item.codigo }}</span>
                    <span class="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">
                      {{ item.estado }}
                    </span>
                  </div>

                  <div>
                    <h4 class="text-xs font-bold text-[#0d2822]">
                      {{ item.nombresPaciente ? (item.nombresPaciente + ' ' + (item.apellidosPaciente || '')) : 'Paciente No Identificado' }}
                    </h4>
                    <p class="text-[11px] text-[#405c54]">C.I.: {{ item.cedula || 'Sin cédula registrada' }} • Edad: {{ item.edadPaciente || '--' }} años</p>
                    <p class="text-[11px] text-[#648279]">Motivo: {{ item.motivo }} ({{ item.sectorNombre }})</p>
                  </div>

                  @if (item.estado === 'TRASLADO_AMBULANCIA') {
                    <button 
                      (click)="confirmarRecepcionEnAmbulancia(item); $event.stopPropagation()"
                      class="w-full mt-2 py-1.5 rounded bg-cyan-700 hover:bg-cyan-800 text-white text-[11px] font-bold uppercase tracking-wider cursor-pointer shadow-xs transition-all"
                    >
                      ✓ Confirmar Abordaje en Ambulancia
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Columna Central/Derecha: Formulario de Decisión y Derivación Hospitalaria -->
        <div class="lg:col-span-2 bg-white border border-[#d2dfd8] rounded-xl p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-[#edece4] pb-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-[#07483b] flex items-center gap-2">
              <svg class="w-4 h-4 text-[#07483b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <span>Gestión Clínica en Ambulancia & Formulario de Entrega (MSP)</span>
            </h3>
            @if (casoSeleccionado) {
              <span class="text-xs font-mono font-bold text-[#07483b] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300">
                Caso: {{ casoSeleccionado.codigo }}
              </span>
            }
          </div>

          @if (!casoSeleccionado) {
            <div class="py-16 text-center text-xs text-[#648279]">
              Selecciona un paciente de la lista para registrar la resolución médica en ambulancia o su traslado a una casa de salud.
            </div>
          } @else {
            <div class="space-y-4 animate-fadeIn">
              
              <!-- Resumen del Paciente a bordo -->
              <div class="bg-[#f5f4ed] p-3.5 rounded-xl border border-[#d2dfd8] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span class="text-[10px] text-[#648279] uppercase font-bold block">Paciente</span>
                  <span class="font-bold text-[#0d2822]">{{ casoSeleccionado.nombresPaciente }} {{ casoSeleccionado.apellidosPaciente }}</span>
                  <span class="text-[11px] text-[#405c54] block">C.I.: {{ casoSeleccionado.cedula || 'N/A' }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-[#648279] uppercase font-bold block">Motivo / Condición</span>
                  <span class="font-bold text-amber-800">{{ casoSeleccionado.motivo }}</span>
                  <span class="text-[11px] text-[#405c54] block">{{ casoSeleccionado.condicionAparente || 'Estable' }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-[#648279] uppercase font-bold block">Medicamentos Previos</span>
                  <span class="font-semibold text-[#07483b]">{{ casoSeleccionado.medicamentosInSitu || 'Ninguno reportado' }}</span>
                </div>
              </div>

              <!-- OPCIÓN 1: ATENCIÓN AMBULATORIA RESUELTA EN AMBULANCIA -->
              <!-- OPCIÓN 2: TRASLADO A CASA DE SALUD / HOSPITAL (Detallado en audio) -->
              <div class="border-t border-[#edece4] pt-4 space-y-4">
                <h4 class="text-xs font-bold uppercase tracking-wider text-[#0d2822]">
                  Resolución Operativa de la Ambulancia:
                </h4>

                <div class="grid grid-cols-2 gap-3">
                  <button 
                    (click)="tipoResolucion = 'ALTA_AMBULATORIA'"
                    [class.border-[#07483b]]="tipoResolucion === 'ALTA_AMBULATORIA'"
                    [class.bg-[#edf5f2]]="tipoResolucion === 'ALTA_AMBULATORIA'"
                    [class.border-[#d2dfd8]]="tipoResolucion !== 'ALTA_AMBULATORIA'"
                    class="p-3 rounded-xl border text-left cursor-pointer transition-all shadow-xs"
                  >
                    <div class="flex items-center gap-2">
                      <span class="w-3 h-3 rounded-full border border-[#07483b] flex items-center justify-center" [class.bg-[#07483b]]="tipoResolucion === 'ALTA_AMBULATORIA'">
                        @if (tipoResolucion === 'ALTA_AMBULATORIA') { <span class="text-[8px] text-white">✓</span> }
                      </span>
                      <span class="font-black text-xs text-[#07483b]">A) Atención Ambulatoria en Ambulancia</span>
                    </div>
                    <p class="text-[11px] text-[#648279] mt-1 pl-5">
                      Paciente compensado y estabilizado in situ. Se le otorga el alta médica.
                    </p>
                  </button>

                  <button 
                    (click)="tipoResolucion = 'TRASLADO_HOSPITAL'"
                    [class.border-red-600]="tipoResolucion === 'TRASLADO_HOSPITAL'"
                    [class.bg-red-50]="tipoResolucion === 'TRASLADO_HOSPITAL'"
                    [class.border-[#d2dfd8]]="tipoResolucion !== 'TRASLADO_HOSPITAL'"
                    class="p-3 rounded-xl border text-left cursor-pointer transition-all shadow-xs"
                  >
                    <div class="flex items-center gap-2">
                      <span class="w-3 h-3 rounded-full border border-red-600 flex items-center justify-center" [class.bg-red-600]="tipoResolucion === 'TRASLADO_HOSPITAL'">
                        @if (tipoResolucion === 'TRASLADO_HOSPITAL') { <span class="text-[8px] text-white">✓</span> }
                      </span>
                      <span class="font-black text-xs text-red-900">B) Traslado a Casa de Salud / Hospital</span>
                    </div>
                    <p class="text-[11px] text-red-800 mt-1 pl-5">
                      Requiere derivación hospitalaria externa, entrega con hoja de atención y médico receptor.
                    </p>
                  </button>
                </div>

                <!-- CAMPOS REQUERIDOS EN EL AUDIO CUANDO SE TRASLADA A HOSPITAL -->
                @if (tipoResolucion === 'TRASLADO_HOSPITAL') {
                  <div class="bg-red-50/60 border border-red-300 rounded-xl p-4 space-y-3 animate-fadeIn">
                    <h5 class="text-xs font-bold text-red-900 uppercase tracking-wide">
                      Datos Obligatorios de Derivación Hospitalaria:
                    </h5>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      
                      <!-- Casa de Salud / Hospital Destino -->
                      <div>
                        <label class="block text-[10px] text-red-900 uppercase font-bold mb-1">
                          Casa de Salud / Hospital:
                        </label>
                        <select 
                          [(ngModel)]="casaSaludDestino"
                          class="w-full bg-white border border-red-300 rounded-lg p-2 text-xs font-bold text-[#0d2822] focus:outline-none"
                        >
                          <option value="Hospital de Especialidades Eugenio Espejo">Hospital Eugenio Espejo</option>
                          <option value="Hospital Pediátrico Baca Ortiz">Hospital Baca Ortiz</option>
                          <option value="Hospital General San Francisco (IESS)">Hospital San Francisco IESS</option>
                          <option value="Hospital Pablo Arturo Suárez">Hospital Pablo Arturo Suárez</option>
                          <option value="Hospital Enrique Garcés">Hospital Enrique Garcés</option>
                          <option value="Clínica / Centro de Salud Tipo C">Centro de Salud Tipo C</option>
                        </select>
                      </div>

                      <!-- N° de Hoja de Atención Prehospitalaria -->
                      <div>
                        <label class="block text-[10px] text-red-900 uppercase font-bold mb-1">
                          N° Hoja de Atención (MSP Form. 002):
                        </label>
                        <input 
                          type="text" 
                          [(ngModel)]="hojaAtencionNumero"
                          placeholder="Ej. MSP-002-8845" 
                          class="w-full bg-white border border-red-300 rounded-lg p-2 text-xs font-mono font-bold text-[#0d2822] focus:outline-none"
                        />
                      </div>

                      <!-- Médico que Recibe en el Hospital -->
                      <div>
                        <label class="block text-[10px] text-red-900 uppercase font-bold mb-1">
                          Médico que Recibió en Emergencias:
                        </label>
                        <input 
                          type="text" 
                          [(ngModel)]="medicoReceptorHospital"
                          placeholder="Ej. Dr. Xavier Viteri (Emergenciólogo)" 
                          class="w-full bg-white border border-red-300 rounded-lg p-2 text-xs font-bold text-[#0d2822] focus:outline-none"
                        />
                      </div>

                    </div>

                    <div>
                      <label class="block text-[10px] text-red-900 uppercase font-bold mb-1">
                        Observaciones de la Entrega y Estado al Arribo:
                      </label>
                      <input 
                        type="text" 
                        [(ngModel)]="observacionesEntrega"
                        placeholder="Paciente entregado en sala de shock, signos vitales estables, vía permeable..." 
                        class="w-full bg-white border border-red-300 rounded-lg p-2 text-xs text-[#0d2822] focus:outline-none"
                      />
                    </div>
                  </div>
                }

                <div class="pt-2">
                  <button 
                    (click)="finalizarCasoAmbulancia()"
                    class="w-full py-3.5 rounded-xl bg-[#07483b] hover:bg-[#0b5948] text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>✓ Registrar y Concluir Atención en Ambulancia</span>
                  </button>
                </div>

              </div>

            </div>
          }
        </div>

      </div>

    </div>
  `
})
export class AmbulanceComponent {
  emergency = inject(EmergencyService);

  ambulanciaActiva = signal<Ambulancia>(this.emergency.ambulancias()[0]);
  casoSeleccionado: Atencion | null = null;

  tipoResolucion: 'ALTA_AMBULATORIA' | 'TRASLADO_HOSPITAL' = 'TRASLADO_HOSPITAL';
  casaSaludDestino = 'Hospital de Especialidades Eugenio Espejo';
  hojaAtencionNumero = 'MSP-002-8845';
  medicoReceptorHospital = 'Dr. Xavier Viteri (Líder Triaje Emergencias)';
  observacionesEntrega = 'Paciente entregado consciente, vía periférica permeable con analgesia, signos vitales monitoreados.';

  cambiarAmbulancia(id: string) {
    const amb = this.emergency.ambulancias().find(a => a.id === id);
    if (amb) this.ambulanciaActiva.set(amb);
  }

  pacientesParaAmbulancia(): Atencion[] {
    return this.emergency.atenciones().filter(a => 
      a.estado === 'TRASLADO_AMBULANCIA' || a.estado === 'EN_AMBULANCIA'
    );
  }

  seleccionarCaso(item: Atencion) {
    this.casoSeleccionado = item;
  }

  confirmarRecepcionEnAmbulancia(item: Atencion) {
    this.emergency.recibirEnAmbulancia(item.id, this.ambulanciaActiva().id);
    this.seleccionarCaso(item);
  }

  finalizarCasoAmbulancia() {
    if (!this.casoSeleccionado) return;
    this.emergency.finalizarEnAmbulancia(
      this.casoSeleccionado.id,
      this.tipoResolucion,
      this.hojaAtencionNumero,
      this.casaSaludDestino,
      this.medicoReceptorHospital,
      this.observacionesEntrega
    );
    this.casoSeleccionado = null;
  }
}
