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
    <div class="space-y-6 animate-fadeIn">

      <!-- Encabezado y Control de Estado de la Ambulancia -->
      <div class="bg-white border border-[#d2dfd8] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] font-mono px-2.5 py-0.5 rounded bg-cyan-100 text-cyan-900 border border-cyan-300 uppercase font-black">
              Unidad de Soporte Vital Móvil
            </span>
            <span class="text-xs font-mono font-bold text-[#07483b]">
              Estado actual: {{ ambulanciaActiva().estado }}
            </span>
          </div>
          <h2 class="text-xl md:text-2xl font-black text-[#0d2822]">
            Control de Ambulancia ({{ ambulanciaActiva().codigo }} • {{ ambulanciaActiva().placa }})
          </h2>
          <p class="text-xs text-[#405c54] mt-1">
            Tripulación: <strong>{{ ambulanciaActiva().paramedicoResponsable }}</strong> • Conductor: <strong>{{ ambulanciaActiva().conductor || 'Asignado' }}</strong>
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- Botones rápidos de estado de la unidad móvil -->
          <div class="bg-[#f5f4ed] border border-[#d2dfd8] p-2 rounded-xl text-xs">
            <label class="block text-[9px] font-black text-[#648279] uppercase mb-1">Unidad Activa:</label>
            <select 
              [ngModel]="ambulanciaActiva().id" 
              (ngModelChange)="cambiarAmbulancia($event)"
              class="bg-white border border-[#d2dfd8] rounded-lg px-2.5 py-1 text-xs font-black text-[#07483b] focus:outline-none"
            >
              @for (amb of emergency.ambulancias(); track amb.id) {
                <option [value]="amb.id">{{ amb.codigo }} ({{ amb.placa }})</option>
              }
            </select>
          </div>

          <div class="bg-[#f5f4ed] border border-[#d2dfd8] p-2 rounded-xl text-xs">
            <label class="block text-[9px] font-black text-[#648279] uppercase mb-1">Cambiar Estado de Unidad:</label>
            <div class="flex gap-1">
              <button (click)="cambiarEstadoUnidad('DISPONIBLE')" [class.bg-emerald-600]="ambulanciaActiva().estado === 'DISPONIBLE'" [class.text-white]="ambulanciaActiva().estado === 'DISPONIBLE'" class="px-2 py-1 rounded bg-white border border-[#d2dfd8] text-[10px] font-bold cursor-pointer">Disponible</button>
              <button (click)="cambiarEstadoUnidad('EN_TRASLADO')" [class.bg-amber-500]="ambulanciaActiva().estado === 'EN_TRASLADO'" [class.text-black]="ambulanciaActiva().estado === 'EN_TRASLADO'" class="px-2 py-1 rounded bg-white border border-[#d2dfd8] text-[10px] font-bold cursor-pointer">En Ruta</button>
              <button (click)="cambiarEstadoUnidad('EN_HOSPITAL')" [class.bg-cyan-700]="ambulanciaActiva().estado === 'EN_HOSPITAL'" [class.text-white]="ambulanciaActiva().estado === 'EN_HOSPITAL'" class="px-2 py-1 rounded bg-white border border-[#d2dfd8] text-[10px] font-bold cursor-pointer">En Hospital</button>
            </div>
          </div>
        </div>
      </div>

      <!-- COLA Y FORMULARIO MSP 002 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div class="bg-white border border-[#d2dfd8] rounded-xl p-4 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-[#edece4] pb-3">
            <h3 class="text-xs font-black uppercase tracking-wider text-[#0d2822]">
              Pacientes Derivados a Ambulancia
            </h3>
            <span class="text-xs text-cyan-900 font-mono font-black bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
              {{ pacientesParaAmbulancia().length }} pendientes
            </span>
          </div>

          @if (pacientesParaAmbulancia().length === 0) {
            <div class="p-8 text-center text-xs text-[#648279]">
              No hay traslados pendientes para las ambulancias.
            </div>
          } @else {
            <div class="space-y-3">
              @for (item of pacientesParaAmbulancia(); track item.id) {
                <div 
                  (click)="seleccionarCaso(item)"
                  [class.border-[#07483b]]="casoSeleccionado?.id === item.id"
                  [class.bg-[#edf5f2]]="casoSeleccionado?.id === item.id"
                  [class.border-[#d2dfd8]]="casoSeleccionado?.id !== item.id"
                  class="p-3.5 rounded-xl border-2 hover:border-[#07483b] cursor-pointer transition-all space-y-2 shadow-xs"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-mono font-black text-[#07483b] text-xs">{{ item.codigo }}</span>
                    <span class="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono font-bold">
                      {{ item.estado === 'TRASLADO_AMBULANCIA' ? 'Esperando Abordaje' : 'A Bordo de Unidad' }}
                    </span>
                  </div>

                  <div>
                    <h4 class="text-xs font-black text-[#0d2822]">
                      {{ item.nombresPaciente ? (item.nombresPaciente + ' ' + (item.apellidosPaciente || '')) : 'Paciente Sin Identificar' }}
                    </h4>
                    <p class="text-[11px] text-[#405c54]">C.I.: {{ item.cedula || 'S/N' }} • {{ item.motivo }}</p>
                  </div>

                  @if (item.estado === 'TRASLADO_AMBULANCIA') {
                    <button 
                      (click)="confirmarRecepcionEnAmbulancia(item); $event.stopPropagation()"
                      class="w-full mt-2 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-black uppercase cursor-pointer shadow-xs"
                    >
                      ✓ Subir Paciente a {{ ambulanciaActiva().codigo }}
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Formulario Oficial de Entrega MSP 002 -->
        <div class="lg:col-span-2 bg-white border border-[#d2dfd8] rounded-xl p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-[#edece4] pb-3">
            <h3 class="text-xs font-black uppercase tracking-wider text-[#07483b]">
              Resolución en Unidad Móvil y Entrega Hospitalaria (MSP Form. 002)
            </h3>
            @if (casoSeleccionado) {
              <span class="text-xs font-mono font-black text-[#07483b] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300">
                Ficha: {{ casoSeleccionado.codigo }}
              </span>
            }
          </div>

          @if (!casoSeleccionado) {
            <div class="py-16 text-center text-xs text-[#648279]">
              Selecciona un paciente de la lista izquierda para registrar su alta en ambulancia o su entrega en el hospital.
            </div>
          } @else {
            <div class="space-y-4 animate-fadeIn">
              
              <div class="bg-[#f5f4ed] p-3.5 rounded-xl border border-[#d2dfd8] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span class="text-[10px] text-[#648279] uppercase font-bold block">Paciente</span>
                  <span class="font-black text-[#0d2822]">{{ casoSeleccionado.nombresPaciente || 'Paciente' }} {{ casoSeleccionado.apellidosPaciente || '' }}</span>
                  <span class="text-[11px] text-[#405c54] block">C.I.: {{ casoSeleccionado.cedula || 'N/A' }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-[#648279] uppercase font-bold block">Diagnóstico / Causa</span>
                  <span class="font-bold text-amber-900">{{ casoSeleccionado.motivo }}</span>
                </div>
                <div>
                  <span class="text-[10px] text-[#648279] uppercase font-bold block">Tratamiento Previo</span>
                  <span class="font-semibold text-[#07483b]">{{ casoSeleccionado.medicamentosInSitu || 'Soporte básico' }}</span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <button 
                  (click)="tipoResolucion = 'ALTA_AMBULATORIA'"
                  [class.border-[#07483b]]="tipoResolucion === 'ALTA_AMBULATORIA'"
                  [class.bg-[#edf5f2]]="tipoResolucion === 'ALTA_AMBULATORIA'"
                  [class.border-[#d2dfd8]]="tipoResolucion !== 'ALTA_AMBULATORIA'"
                  class="p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all"
                >
                  <span class="font-black text-xs text-[#07483b] block">A) Alta Médica en Ambulancia</span>
                  <p class="text-[11px] text-[#648279] mt-1">Se estabilizó dentro de la unidad sin ir al hospital.</p>
                </button>

                <button 
                  (click)="tipoResolucion = 'TRASLADO_HOSPITAL'"
                  [class.border-red-600]="tipoResolucion === 'TRASLADO_HOSPITAL'"
                  [class.bg-red-50]="tipoResolucion === 'TRASLADO_HOSPITAL'"
                  [class.border-[#d2dfd8]]="tipoResolucion !== 'TRASLADO_HOSPITAL'"
                  class="p-3.5 rounded-xl border-2 text-left cursor-pointer transition-all"
                >
                  <span class="font-black text-xs text-red-900 block">B) Traslado a Hospital / Clínica</span>
                  <p class="text-[11px] text-red-800 mt-1">Entrega oficial con Hoja MSP 002 y firma de médico receptor.</p>
                </button>
              </div>

              @if (tipoResolucion === 'TRASLADO_HOSPITAL') {
                <div class="bg-red-50/60 border border-red-300 rounded-xl p-4 space-y-3 animate-fadeIn">
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label class="block text-[10px] text-red-900 uppercase font-black mb-1">Hospital Receptor:</label>
                      <select [(ngModel)]="casaSaludDestino" class="w-full bg-white border border-red-300 rounded-lg p-2 text-xs font-bold text-[#0d2822]">
                        <option value="Hospital de Especialidades Eugenio Espejo">Hospital Eugenio Espejo</option>
                        <option value="Hospital General San Francisco (IESS)">Hospital San Francisco IESS</option>
                        <option value="Hospital Pablo Arturo Suárez">Hospital Pablo Arturo Suárez</option>
                        <option value="Hospital Pediátrico Baca Ortiz">Hospital Baca Ortiz</option>
                        <option value="Hospital Enrique Garcés">Hospital Enrique Garcés</option>
                        <option value="Hospital Teófilo Dávila (Machala)">Hospital Teófilo Dávila</option>
                        <option value="Hospital General Machala (IESS)">Hospital IESS Machala</option>
                        <option value="Clínica Privada / Centro Tipo C">Clínica / Centro de Salud Tipo C</option>
                      </select>
                    </div>

                    <div>
                      <label class="block text-[10px] text-red-900 uppercase font-black mb-1">N° Hoja MSP Form. 002 (Automático):</label>
                      <input type="text" [(ngModel)]="hojaAtencionNumero" class="w-full bg-white border border-red-300 rounded-lg p-2 text-xs font-mono font-black text-[#0d2822]"/>
                    </div>

                    <div>
                      <label class="block text-[10px] text-red-900 uppercase font-black mb-1">Médico que Recibe en Hospital:</label>
                      <input type="text" [(ngModel)]="medicoReceptorHospital" placeholder="Dr. Nombre Apellido" class="w-full bg-white border border-red-300 rounded-lg p-2 text-xs font-bold text-[#0d2822]"/>
                    </div>
                  </div>

                  <div>
                    <label class="block text-[10px] text-red-900 uppercase font-black mb-1">Condición de Entrega en Emergencias:</label>
                    <input type="text" [(ngModel)]="observacionesEntrega" class="w-full bg-white border border-red-300 rounded-lg p-2 text-xs text-[#0d2822]"/>
                  </div>
                </div>
              }

              <button 
                (click)="finalizarCasoAmbulancia()"
                class="w-full py-4 rounded-xl bg-[#07483b] hover:bg-[#0b5948] text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-md"
              >
                ✓ Guardar y Liberar Ambulancia {{ ambulanciaActiva().codigo }}
              </button>

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
  hojaAtencionNumero = 'MSP-002-2026-004';
  medicoReceptorHospital = 'Dr. Xavier Viteri (Emergencias)';
  observacionesEntrega = 'Paciente entregado consciente, vía periférica permeable y signos vitales estables.';

  cambiarAmbulancia(id: string) {
    const amb = this.emergency.ambulancias().find(a => a.id === id);
    if (amb) this.ambulanciaActiva.set(amb);
  }

  cambiarEstadoUnidad(nuevoEstado: 'DISPONIBLE' | 'EN_TRASLADO' | 'EN_SITIO' | 'EN_HOSPITAL') {
    this.emergency.editarAmbulancia(this.ambulanciaActiva().id, { estado: nuevoEstado });
    const actualizada = this.emergency.ambulancias().find(a => a.id === this.ambulanciaActiva().id);
    if (actualizada) this.ambulanciaActiva.set(actualizada);
  }

  pacientesParaAmbulancia(): Atencion[] {
    return this.emergency.atenciones().filter(a => 
      a.estado === 'TRASLADO_AMBULANCIA' || a.estado === 'EN_AMBULANCIA'
    );
  }

  seleccionarCaso(item: Atencion) {
    this.casoSeleccionado = item;
    // Autogenera el número secuencial de Hoja MSP 002 basado en el código de ficha
    const numSecuencia = item.codigo.replace(/[^0-9]/g, '').padStart(4, '0') || '0001';
    this.hojaAtencionNumero = `MSP-002-2026-${numSecuencia}`;
  }

  confirmarRecepcionEnAmbulancia(item: Atencion) {
    this.emergency.recibirEnAmbulancia(item.id, this.ambulanciaActiva().id);
    this.cambiarEstadoUnidad('EN_TRASLADO');
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
    this.cambiarEstadoUnidad('DISPONIBLE');
    this.casoSeleccionado = null;
  }
}
