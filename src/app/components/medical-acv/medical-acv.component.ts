import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmergencyService } from '../../services/emergency.service';
import { Atencion, TriageColor, SignosVitales, ACV } from '../../models/emergency.model';

@Component({
  selector: 'app-medical-acv',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fadeIn">

      <!-- Encabezado de los Puestos Médicos Avanzados (ACV 1 y 2) -->
      <div class="bg-white border border-[#d2dfd8] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-[#edece4] text-[#07483b] border border-[#d2dfd8] uppercase font-bold">
              Puesto Médico Avanzado (PMA / ACV)
            </span>
            <span class="text-xs text-[#648279] font-mono">Clasificación START & Estabilización de Víctimas</span>
          </div>
          <h2 class="text-xl md:text-2xl font-black text-[#0d2822] flex items-center gap-2">
            <span>🏥 Módulo de Atención de Víctimas (ACV)</span>
          </h2>
          <p class="text-xs text-[#405c54] mt-1">
            Puestos médicos de concentración. Recepción, Triage START, anamnesis con cédula y derivación a ambulancia.
          </p>
        </div>

        <!-- Selector de ACV Activo (ACV 1 vs ACV 2 solicitado en audio) -->
        <div class="flex items-center gap-3">
          <div class="bg-[#f5f4ed] border border-[#d2dfd8] p-2.5 rounded-xl text-xs">
            <label class="block text-[10px] font-bold text-[#648279] uppercase">Seleccionar Puesto ACV:</label>
            <select 
              [ngModel]="acvActivo().id" 
              (ngModelChange)="cambiarAcv($event)"
              class="bg-white border border-[#d2dfd8] rounded px-2.5 py-1 text-xs font-bold text-[#07483b] focus:outline-none"
            >
              @for (acv of emergency.acvs(); track acv.id) {
                <option [value]="acv.id">{{ acv.codigo }}: {{ acv.nombre }} ({{ acv.encargado }})</option>
              }
            </select>
          </div>
        </div>
      </div>

      <!-- SECCIÓN 1: RECEPCIÓN Y CLASIFICACIÓN DE TRIAGE -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Columna Izquierda: Pacientes en camino o pendientes de Triage -->
        <div class="bg-white border border-[#d2dfd8] rounded-xl p-4 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-[#edece4] pb-3">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-cyan-600 animate-ping"></span>
              <h3 class="text-xs font-bold uppercase tracking-wider text-[#0d2822]">
                Llegadas a {{ acvActivo().codigo }}
              </h3>
            </div>
            <span class="text-xs text-cyan-800 font-mono font-bold bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
              {{ pacientesPorTriar().length }} en cola
            </span>
          </div>

          @if (pacientesPorTriar().length === 0) {
            <div class="p-8 text-center text-xs text-[#648279]">
              No hay pacientes pendientes de recepción ni triage en este ACV.
            </div>
          } @else {
            <div class="space-y-3">
              @for (item of pacientesPorTriar(); track item.id) {
                <div 
                  (click)="seleccionarParaTriage(item)"
                  [class.border-[#07483b]]="pacienteSeleccionadoTriage?.id === item.id"
                  [class.bg-[#edf5f2]]="pacienteSeleccionadoTriage?.id === item.id"
                  [class.border-[#d2dfd8]]="pacienteSeleccionadoTriage?.id !== item.id"
                  [class.bg-[#fbfbfa]]="pacienteSeleccionadoTriage?.id !== item.id"
                  class="p-3.5 rounded-lg border hover:border-[#07483b] cursor-pointer transition-all space-y-1.5 shadow-xs"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-mono font-bold text-[#07483b] text-xs">{{ item.codigo }}</span>
                    <span class="text-[10px] bg-cyan-100 text-cyan-900 px-2 py-0.5 rounded font-mono font-semibold">
                      {{ item.estado === 'TRASLADO_AL_ACV' ? 'En traslado' : 'Llegado al ACV' }}
                    </span>
                  </div>
                  <h4 class="text-xs font-bold text-[#0d2822]">
                    {{ item.nombresPaciente ? (item.nombresPaciente + ' ' + (item.apellidosPaciente || '')) : item.motivo }}
                  </h4>
                  <div class="flex items-center justify-between text-[11px] text-[#405c54]">
                    <span>{{ item.sectorNombre }}</span>
                    <span>Cédula: {{ item.cedula || 'S/N' }}</span>
                  </div>

                  @if (item.estado === 'TRASLADO_AL_ACV') {
                    <button 
                      (click)="confirmarLlegadaACV(item); $event.stopPropagation()"
                      class="w-full mt-2 py-1.5 rounded bg-cyan-700 hover:bg-cyan-800 text-white text-[11px] font-bold uppercase tracking-wider cursor-pointer transition-all shadow-xs"
                    >
                      ✓ Confirmar llegada a {{ acvActivo().codigo }}
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Columna Central/Derecha: Formulario Táctil de Triage START -->
        <div class="lg:col-span-2 bg-white border border-[#d2dfd8] rounded-xl p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-[#edece4] pb-3">
            <h3 class="text-xs font-bold uppercase tracking-wider text-[#07483b] flex items-center gap-2">
              <svg class="w-4 h-4 text-[#07483b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
              </svg>
              <span>Clasificación START en {{ acvActivo().nombre }}</span>
            </h3>
            @if (pacienteSeleccionadoTriage) {
              <span class="text-xs font-mono font-bold text-[#07483b] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300">
                Caso: {{ pacienteSeleccionadoTriage.codigo }}
              </span>
            }
          </div>

          @if (!pacienteSeleccionadoTriage) {
            <div class="py-12 text-center text-xs text-[#648279]">
              Selecciona un paciente en la lista de llegadas para clasificar su nivel de triage.
            </div>
          } @else {
            <div class="space-y-4 animate-fadeIn">
              
              <!-- DATOS COMPLETOS DEL PACIENTE (Requeridos en audio: Nombres, Apellidos, Cédula, Medicamentos) -->
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-[#f5f4ed] p-3.5 rounded-xl border border-[#d2dfd8] text-xs">
                <div>
                  <label class="block text-[9px] text-[#648279] uppercase font-bold">N° Cédula Ecuador (10 d.):</label>
                  <input type="text" [(ngModel)]="cedulaPaciente" maxlength="10" placeholder="1712345678" class="w-full bg-white border border-[#d2dfd8] rounded p-1.5 font-mono font-bold text-[#0d2822]"/>
                </div>
                <div>
                  <label class="block text-[9px] text-[#648279] uppercase font-bold">Nombres:</label>
                  <input type="text" [(ngModel)]="nombresPaciente" placeholder="Ej. Pedro" class="w-full bg-white border border-[#d2dfd8] rounded p-1.5 font-bold text-[#0d2822]"/>
                </div>
                <div>
                  <label class="block text-[9px] text-[#648279] uppercase font-bold">Apellidos:</label>
                  <input type="text" [(ngModel)]="apellidosPaciente" placeholder="Ej. Picapiedra" class="w-full bg-white border border-[#d2dfd8] rounded p-1.5 font-bold text-[#0d2822]"/>
                </div>
                <div>
                  <label class="block text-[9px] text-[#648279] uppercase font-bold">Edad / Sexo:</label>
                  <div class="flex gap-1">
                    <input type="number" [(ngModel)]="edadPaciente" placeholder="Edad" class="w-14 bg-white border border-[#d2dfd8] rounded p-1.5"/>
                    <select [(ngModel)]="generoPaciente" class="bg-white border border-[#d2dfd8] rounded p-1.5">
                      <option value="M">M</option>
                      <option value="F">F</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- BOTONES GRANDES DE TRIAGE START -->
              <div>
                <label class="block text-xs font-bold text-[#405c54] mb-2 uppercase">
                  Clasificación de Triage START:
                </label>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  <button 
                    (click)="asignarTriage('ROJO')"
                    class="p-4 rounded-xl bg-red-50 border-2 border-red-500 hover:bg-red-100 text-left cursor-pointer transition-all shadow-xs flex items-start gap-3"
                  >
                    <div class="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">R</div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-black text-red-900">ROJO (Prioridad 1)</span>
                        <span class="text-[10px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded">INMEDIATO</span>
                      </div>
                      <p class="text-[11px] text-red-800 mt-1">Compromiso vital, shock, disnea severa.</p>
                    </div>
                  </button>

                  <button 
                    (click)="asignarTriage('AMARILLO')"
                    class="p-4 rounded-xl bg-amber-50 border-2 border-amber-500 hover:bg-amber-100 text-left cursor-pointer transition-all shadow-xs flex items-start gap-3"
                  >
                    <div class="w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">A</div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-black text-amber-950">AMARILLO (Prioridad 2)</span>
                        <span class="text-[10px] bg-amber-500 text-black font-bold px-1.5 py-0.2 rounded">URGENTE</span>
                      </div>
                      <p class="text-[11px] text-amber-900 mt-1">Dolor severo, fractura cerrada, signos estables.</p>
                    </div>
                  </button>

                  <button 
                    (click)="asignarTriage('VERDE')"
                    class="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-600 hover:bg-emerald-100 text-left cursor-pointer transition-all shadow-xs flex items-start gap-3"
                  >
                    <div class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">V</div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-black text-emerald-950">VERDE (Prioridad 3)</span>
                        <span class="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded">LEVE / MENOR</span>
                      </div>
                      <p class="text-[11px] text-emerald-900 mt-1">Ambulatorio, marcha intacta, contusión menor.</p>
                    </div>
                  </button>

                  <button 
                    (click)="asignarTriage('NEGRO')"
                    class="p-4 rounded-xl bg-slate-100 border-2 border-slate-600 hover:bg-slate-200 text-left cursor-pointer transition-all shadow-xs flex items-start gap-3"
                  >
                    <div class="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">N</div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-sm font-black text-slate-900">NEGRO (Prioridad 4)</span>
                        <span class="text-[10px] bg-slate-800 text-white font-bold px-1.5 py-0.2 rounded">EXPECTANTE</span>
                      </div>
                      <p class="text-[11px] text-slate-700 mt-1">Sin signos vitales, no recuperable.</p>
                    </div>
                  </button>

                </div>
              </div>

            </div>
          }
        </div>

      </div>

      <!-- SECCIÓN 2: SALA DE ESPERA MÉDICA Y CONSULTA CLÍNICA -->
      <div class="bg-white border border-[#d2dfd8] rounded-xl p-5 shadow-sm space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#edece4] pb-3">
          <div>
            <h3 class="text-sm font-bold uppercase tracking-wider text-[#0d2822] flex items-center gap-2">
              <span>Pacientes en Espera y Consulta en {{ acvActivo().codigo }}</span>
            </h3>
            <p class="text-xs text-[#648279]">
              Encargado de este ACV: <strong>{{ acvActivo().encargado }}</strong>
            </p>
          </div>
          <span class="text-xs font-mono text-[#07483b] font-bold bg-[#edece4] px-2.5 py-1 rounded">
            Cola de Atención Prioritaria
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (item of pacientesEnEspera(); track item.id) {
            <div class="bg-[#fbfbfa] border border-[#d2dfd8] rounded-xl p-4 space-y-3 relative overflow-hidden shadow-xs">
              <div 
                class="absolute left-0 top-0 bottom-0 w-2.5"
                [ngClass]="{
                  'bg-red-500': item.triage === 'ROJO',
                  'bg-amber-500': item.triage === 'AMARILLO',
                  'bg-emerald-500': item.triage === 'VERDE',
                  'bg-slate-700': item.triage === 'NEGRO'
                }"
              ></div>

              <div class="pl-2 flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-bold text-sm text-[#07483b]">{{ item.codigo }}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase" [ngClass]="{
                      'bg-red-600 text-white': item.triage === 'ROJO',
                      'bg-amber-500 text-black': item.triage === 'AMARILLO',
                      'bg-emerald-600 text-white': item.triage === 'VERDE',
                      'bg-slate-800 text-white': item.triage === 'NEGRO'
                    }">{{ item.triage }}</span>
                  </div>
                  <h4 class="text-sm font-extrabold text-[#0d2822] mt-1">
                    {{ item.nombresPaciente ? (item.nombresPaciente + ' ' + (item.apellidosPaciente || '')) : 'Paciente No Identificado' }}
                  </h4>
                  <p class="text-xs text-[#405c54]">C.I.: {{ item.cedula || 'Sin cédula' }} • {{ item.motivo }}</p>
                  @if (item.medicamentosInSitu) {
                    <p class="text-[11px] text-[#07483b] font-semibold">Medicación previa: {{ item.medicamentosInSitu }}</p>
                  }
                </div>

                <div class="text-right font-mono text-xs">
                  <span class="text-slate-500 block">{{ item.horaInicio }}</span>
                  <span class="text-[#07483b] font-bold">{{ item.estado }}</span>
                </div>
              </div>

              @if (item.estado === 'EN_SALA_ESPERA') {
                <button 
                  (click)="llamarPaciente(item)"
                  class="w-full py-2.5 rounded-lg bg-[#07483b] hover:bg-[#0b5948] text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <span>Llamar a Consulta en este ACV</span>
                </button>
              }

              @if (item.estado === 'EN_CONSULTA') {
                <button 
                  (click)="abrirConsultaMedica(item)"
                  class="w-full py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <span>Abrir Ficha Clínica del ACV</span>
                </button>
              }
            </div>
          }
        </div>
      </div>

      <!-- MODAL DE CONSULTA CLÍNICA EN EL ACV -->
      @if (pacienteEnConsulta) {
        <div class="bg-white border-2 border-[#07483b] rounded-2xl p-6 shadow-xl space-y-6 animate-fadeIn">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#edece4] pb-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono font-bold text-amber-700">{{ pacienteEnConsulta.codigo }}</span>
                <span class="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300">
                  ATENCIÓN EN {{ acvActivo().codigo }}
                </span>
              </div>
              <h3 class="text-xl font-black text-[#0d2822] mt-1">
                {{ pacienteEnConsulta.nombresPaciente }} {{ pacienteEnConsulta.apellidosPaciente }} (C.I. {{ pacienteEnConsulta.cedula || 'S/N' }})
              </h3>
              <p class="text-xs text-[#405c54]">
                Triage {{ pacienteEnConsulta.triage }} • Origen: {{ pacienteEnConsulta.sectorNombre }}
              </p>
            </div>

            <button 
              (click)="pacienteEnConsulta = null"
              class="px-3 py-1.5 rounded bg-[#edece4] border border-[#d2dfd8] hover:bg-slate-200 text-xs text-[#405c54] font-semibold cursor-pointer"
            >
              ✕ Cerrar Ficha
            </button>
          </div>

          <!-- SIGNOS VITALES -->
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-[#405c54] mb-2">01. Signos Vitales</h4>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
              <div class="bg-[#f5f4ed] p-3 rounded-xl border border-[#d2dfd8] text-center">
                <span class="text-[10px] text-[#648279] block font-bold">FC (lpm)</span>
                <input type="number" [(ngModel)]="signos.fc" class="w-full text-center bg-transparent font-mono font-bold text-[#07483b] text-base focus:outline-none"/>
              </div>
              <div class="bg-[#f5f4ed] p-3 rounded-xl border border-[#d2dfd8] text-center">
                <span class="text-[10px] text-[#648279] block font-bold">PA (mmHg)</span>
                <div class="flex justify-center items-center gap-1 font-mono font-bold text-[#0d2822] text-base">
                  <input type="number" [(ngModel)]="signos.paSistolica" class="w-10 text-center bg-transparent focus:outline-none"/>
                  <span>/</span>
                  <input type="number" [(ngModel)]="signos.paDiastolica" class="w-10 text-center bg-transparent focus:outline-none"/>
                </div>
              </div>
              <div class="bg-[#f5f4ed] p-3 rounded-xl border border-[#d2dfd8] text-center">
                <span class="text-[10px] text-[#648279] block font-bold">SpO2 (%)</span>
                <input type="number" [(ngModel)]="signos.spo2" class="w-full text-center bg-transparent font-mono font-bold text-cyan-800 text-base focus:outline-none"/>
              </div>
              <div class="bg-[#f5f4ed] p-3 rounded-xl border border-[#d2dfd8] text-center">
                <span class="text-[10px] text-[#648279] block font-bold">FR (rpm)</span>
                <input type="number" [(ngModel)]="signos.fr" class="w-full text-center bg-transparent font-mono font-bold text-[#0d2822] text-base focus:outline-none"/>
              </div>
              <div class="bg-[#f5f4ed] p-3 rounded-xl border border-[#d2dfd8] text-center">
                <span class="text-[10px] text-[#648279] block font-bold">Temp (°C)</span>
                <input type="number" [(ngModel)]="signos.temperatura" class="w-full text-center bg-transparent font-mono font-bold text-amber-800 text-base focus:outline-none"/>
              </div>
              <div class="bg-[#f5f4ed] p-3 rounded-xl border border-[#d2dfd8] text-center">
                <span class="text-[10px] text-[#648279] block font-bold">Glasgow</span>
                <input type="number" [(ngModel)]="signos.glasgow" class="w-full text-center bg-transparent font-mono font-bold text-[#07483b] text-base focus:outline-none"/>
              </div>
            </div>
          </div>

          <!-- ANAMNESIS Y PLAN TERAPÉUTICO -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label class="block font-bold text-[#405c54] mb-1">Motivo / Anamnesis / Examen Físico:</label>
              <textarea [(ngModel)]="anamnesis" rows="3" class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-xl p-3 focus:outline-none"></textarea>
            </div>
            <div>
              <label class="block font-bold text-[#405c54] mb-1">Diagnóstico y Medicamentos Administrados:</label>
              <textarea [(ngModel)]="diagnostico" rows="3" class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-xl p-3 focus:outline-none"></textarea>
            </div>
          </div>

          <!-- BOTONES DE RESOLUCIÓN DEL ACV (Observación, Alta o Derivación a Ambulancia) -->
          <div class="border-t border-[#edece4] pt-4">
            <h4 class="text-xs font-bold uppercase tracking-wider text-[#405c54] mb-3">03. Resolución Médica en ACV</h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button 
                (click)="finalizarCaso('OBSERVACION')"
                class="py-3 px-4 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold uppercase cursor-pointer"
              >
                ⏳ Dejar en Observación ACV
              </button>
              <button 
                (click)="finalizarCaso('ALTA_ACV')"
                class="py-3 px-4 rounded-xl bg-[#07483b] hover:bg-[#0b5948] text-white text-xs font-black uppercase cursor-pointer shadow-md"
              >
                ✓ Dar Alta en ACV
              </button>
              <button 
                (click)="finalizarCaso('TRASLADO_AMBULANCIA')"
                class="py-3 px-4 rounded-xl bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold uppercase cursor-pointer shadow-md"
              >
                🚑 Derivar a Ambulancia
              </button>
            </div>
          </div>

        </div>
      }

    </div>
  `
})
export class MedicalAcvComponent {
  emergency = inject(EmergencyService);

  acvActivo = signal<ACV>(this.emergency.acvs()[0]);
  pacienteSeleccionadoTriage: Atencion | null = null;
  pacienteEnConsulta: Atencion | null = null;

  cedulaPaciente = '1723456789';
  nombresPaciente = 'Pedro';
  apellidosPaciente = 'Picapiedra';
  edadPaciente = 34;
  generoPaciente: 'M' | 'F' | 'OTRO' = 'M';

  signos: SignosVitales = {
    fc: 78,
    paSistolica: 120,
    paDiastolica: 80,
    fr: 16,
    spo2: 98,
    temperatura: 36.5,
    glasgow: 15
  };

  anamnesis = 'Paciente presenta contusión en rodilla derecha tras caída en sector vallas. Refiere dolor moderado 5/10. Sin pérdida de consciencia ni trauma craneal.';
  diagnostico = 'Trauma cerrado de rodilla derecha leve. Sin signos de fractura evidente. Se aplica crioterapia local y vendaje compresivo.';

  cambiarAcv(id: string) {
    const a = this.emergency.acvs().find(item => item.id === id);
    if (a) this.acvActivo.set(a);
  }

  pacientesPorTriar(): Atencion[] {
    return this.emergency.atenciones().filter(a => 
      (a.estado === 'TRASLADO_AL_ACV' || a.estado === 'PENDIENTE_TRIAGE') &&
      (!a.acvDestinoId || a.acvDestinoId === this.acvActivo().id)
    );
  }

  pacientesEnEspera(): Atencion[] {
    return this.emergency.atenciones().filter(a => 
      (a.estado === 'EN_SALA_ESPERA' || a.estado === 'EN_CONSULTA') &&
      (!a.acvDestinoId || a.acvDestinoId === this.acvActivo().id)
    );
  }

  seleccionarParaTriage(item: Atencion) {
    this.pacienteSeleccionadoTriage = item;
    if (item.cedula) this.cedulaPaciente = item.cedula;
    if (item.nombresPaciente) this.nombresPaciente = item.nombresPaciente;
    if (item.apellidosPaciente) this.apellidosPaciente = item.apellidosPaciente;
    if (item.edadPaciente) this.edadPaciente = item.edadPaciente;
  }

  confirmarLlegadaACV(item: Atencion) {
    this.emergency.recibirEnACV(item.id, {
      cedula: this.cedulaPaciente,
      nombres: this.nombresPaciente,
      apellidos: this.apellidosPaciente,
      edad: this.edadPaciente
    });
    this.seleccionarParaTriage(item);
  }

  asignarTriage(color: TriageColor) {
    if (!this.pacienteSeleccionadoTriage) return;
    this.emergency.clasificarTriage(this.pacienteSeleccionadoTriage.id, color, this.acvActivo().encargado);
    this.pacienteSeleccionadoTriage = null;
  }

  llamarPaciente(item: Atencion) {
    this.emergency.llamarAConsultaACV(item.id, this.acvActivo().encargado);
    this.pacienteEnConsulta = item;
  }

  abrirConsultaMedica(item: Atencion) {
    this.pacienteEnConsulta = item;
  }

  finalizarCaso(resolucion: 'ALTA_ACV' | 'OBSERVACION' | 'TRASLADO_AMBULANCIA') {
    if (!this.pacienteEnConsulta) return;
    this.emergency.finalizarConsultaACV(
      this.pacienteEnConsulta.id,
      resolucion,
      this.signos,
      this.anamnesis,
      this.diagnostico,
      'Crioterapia + AINEs',
      resolucion === 'TRASLADO_AMBULANCIA' ? 'amb-1' : undefined
    );
    this.pacienteEnConsulta = null;
  }
}
