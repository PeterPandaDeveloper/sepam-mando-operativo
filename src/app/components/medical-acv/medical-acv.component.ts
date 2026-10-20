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

      <!-- Encabezado del Puesto Médico Avanzado (ACV 1 y 2) -->
      <div class="bg-white border border-[#d2dfd8] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] font-mono px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase font-black">
              Carpa Médica / PMA Activo
            </span>
            <span class="text-xs text-[#648279] font-mono">Triage START & Estabilización</span>
          </div>
          <h2 class="text-xl md:text-2xl font-black text-[#0d2822]">
            Puesto de Atención de Víctimas ({{ acvActivo().codigo }})
          </h2>
          <p class="text-xs text-[#405c54] mt-1">
            Responsable de Carpa: <strong>{{ acvActivo().encargado }}</strong> • Capacidad: <strong>{{ acvActivo().capacidadCamillas }} camillas</strong>
          </p>
        </div>

        <div class="bg-[#f5f4ed] border border-[#d2dfd8] p-2.5 rounded-xl text-xs">
          <label class="block text-[10px] font-black text-[#07483b] uppercase mb-1">Cambiar de Carpa / Puesto ACV:</label>
          <select 
            [ngModel]="acvActivo().id" 
            (ngModelChange)="cambiarAcv($event)"
            class="bg-white border border-[#d2dfd8] rounded-lg px-3 py-1.5 text-xs font-black text-[#07483b] focus:outline-none"
          >
            @for (acv of emergency.acvs(); track acv.id) {
              <option [value]="acv.id">{{ acv.codigo }}: {{ acv.nombre }}</option>
            }
          </select>
        </div>
      </div>

      <!-- SECCIÓN 1: RECEPCIÓN Y CLASIFICACIÓN TRIAGE START -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div class="bg-white border border-[#d2dfd8] rounded-xl p-4 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-[#edece4] pb-3">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-cyan-600 animate-ping"></span>
              <h3 class="text-xs font-black uppercase tracking-wider text-[#0d2822]">
                Pacientes Llegando a {{ acvActivo().codigo }}
              </h3>
            </div>
            <span class="text-xs text-cyan-900 font-mono font-black bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
              {{ pacientesPorTriar().length }} por clasificar
            </span>
          </div>

          @if (pacientesPorTriar().length === 0) {
            <div class="p-8 text-center text-xs text-[#648279]">
              No hay pacientes en cola de recepción en este momento.
            </div>
          } @else {
            <div class="space-y-3">
              @for (item of pacientesPorTriar(); track item.id) {
                <div 
                  (click)="seleccionarParaTriage(item)"
                  [class.border-[#07483b]]="pacienteSeleccionadoTriage?.id === item.id"
                  [class.bg-[#edf5f2]]="pacienteSeleccionadoTriage?.id === item.id"
                  [class.border-[#d2dfd8]]="pacienteSeleccionadoTriage?.id !== item.id"
                  class="p-3.5 rounded-xl border-2 hover:border-[#07483b] cursor-pointer transition-all space-y-1.5 shadow-xs"
                >
                  <div class="flex items-center justify-between">
                    <span class="font-mono font-black text-[#07483b] text-xs">{{ item.codigo }}</span>
                    <span class="text-[10px] bg-cyan-100 text-cyan-900 px-2 py-0.5 rounded font-mono font-bold">
                      {{ item.estado === 'TRASLADO_AL_ACV' ? 'En camino a carpa' : 'En puerta ACV' }}
                    </span>
                  </div>
                  <h4 class="text-xs font-black text-[#0d2822]">
                    {{ item.nombresPaciente ? (item.nombresPaciente + ' ' + (item.apellidosPaciente || '')) : item.motivo }}
                  </h4>
                  <div class="flex items-center justify-between text-[11px] text-[#405c54]">
                    <span>Origen: {{ item.sectorNombre }}</span>
                    <span>C.I.: {{ item.cedula || 'S/N' }}</span>
                  </div>

                  @if (item.estado === 'TRASLADO_AL_ACV') {
                    <button 
                      (click)="confirmarLlegadaACV(item); $event.stopPropagation()"
                      class="w-full mt-2 py-2 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-black uppercase cursor-pointer transition-all shadow-xs"
                    >
                      ✓ Recibir Paciente en Carpa
                    </button>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Formulario Táctil de Triage START -->
        <div class="lg:col-span-2 bg-white border border-[#d2dfd8] rounded-xl p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-[#edece4] pb-3">
            <h3 class="text-xs font-black uppercase tracking-wider text-[#07483b]">
              Clasificación de Gravedad (Triage START)
            </h3>
            @if (pacienteSeleccionadoTriage) {
              <span class="text-xs font-mono font-black text-[#07483b] bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-300">
                Ficha Activa: {{ pacienteSeleccionadoTriage.codigo }}
              </span>
            }
          </div>

          @if (!pacienteSeleccionadoTriage) {
            <div class="py-12 text-center text-xs text-[#648279]">
              Toca un paciente de la lista izquierda para asignarle su color de prioridad médica.
            </div>
          } @else {
            <div class="space-y-4 animate-fadeIn">
              
              <div class="grid grid-cols-1 sm:grid-cols-4 gap-2.5 bg-[#f5f4ed] p-3.5 rounded-xl border border-[#d2dfd8] text-xs">
                <div>
                  <label class="block text-[9px] text-[#648279] uppercase font-bold">Cédula (10 dígitos):</label>
                  <input type="text" [(ngModel)]="cedulaPaciente" maxlength="10" class="w-full bg-white border border-[#d2dfd8] rounded p-1.5 font-mono font-bold text-[#0d2822]"/>
                </div>
                <div>
                  <label class="block text-[9px] text-[#648279] uppercase font-bold">Nombres:</label>
                  <input type="text" [(ngModel)]="nombresPaciente" class="w-full bg-white border border-[#d2dfd8] rounded p-1.5 font-bold text-[#0d2822]"/>
                </div>
                <div>
                  <label class="block text-[9px] text-[#648279] uppercase font-bold">Apellidos:</label>
                  <input type="text" [(ngModel)]="apellidosPaciente" class="w-full bg-white border border-[#d2dfd8] rounded p-1.5 font-bold text-[#0d2822]"/>
                </div>
                <div>
                  <label class="block text-[9px] text-[#648279] uppercase font-bold">Edad / Sexo:</label>
                  <div class="flex gap-1">
                    <input type="number" [(ngModel)]="edadPaciente" class="w-14 bg-white border border-[#d2dfd8] rounded p-1.5 font-bold"/>
                    <select [(ngModel)]="generoPaciente" class="bg-white border border-[#d2dfd8] rounded p-1.5 font-bold">
                      <option value="M">M</option>
                      <option value="F">F</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-xs font-black text-[#07483b] mb-2 uppercase">
                  Toca un Color para Clasificar al Paciente:
                </label>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button (click)="asignarTriage('ROJO')" class="p-4 rounded-xl bg-red-50 border-2 border-red-600 hover:bg-red-100 text-left cursor-pointer transition-all flex items-start gap-3">
                    <div class="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-xs flex-shrink-0">R</div>
                    <div>
                      <span class="text-sm font-black text-red-900 block">ROJO (Inmediato)</span>
                      <p class="text-[11px] text-red-800 mt-0.5">Riesgo vital, asfixia, hemorragia o inconsciencia.</p>
                    </div>
                  </button>

                  <button (click)="asignarTriage('AMARILLO')" class="p-4 rounded-xl bg-amber-50 border-2 border-amber-500 hover:bg-amber-100 text-left cursor-pointer transition-all flex items-start gap-3">
                    <div class="w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center font-black text-xs flex-shrink-0">A</div>
                    <div>
                      <span class="text-sm font-black text-amber-950 block">AMARILLO (Urgente)</span>
                      <p class="text-[11px] text-amber-900 mt-0.5">Fractura, deshidratación moderada, dolor intenso.</p>
                    </div>
                  </button>

                  <button (click)="asignarTriage('VERDE')" class="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-600 hover:bg-emerald-100 text-left cursor-pointer transition-all flex items-start gap-3">
                    <div class="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs flex-shrink-0">V</div>
                    <div>
                      <span class="text-sm font-black text-emerald-950 block">VERDE (Leve)</span>
                      <p class="text-[11px] text-emerald-900 mt-0.5">Camina por sí mismo, herida superficial, ansiedad leve.</p>
                    </div>
                  </button>

                  <button (click)="asignarTriage('NEGRO')" class="p-4 rounded-xl bg-slate-100 border-2 border-slate-700 hover:bg-slate-200 text-left cursor-pointer transition-all flex items-start gap-3">
                    <div class="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-xs flex-shrink-0">N</div>
                    <div>
                      <span class="text-sm font-black text-slate-900 block">NEGRO (Expectante)</span>
                      <p class="text-[11px] text-slate-700 mt-0.5">Ausencia de signos vitales.</p>
                    </div>
                  </button>
                </div>
              </div>

            </div>
          }
        </div>

      </div>

      <!-- SECCIÓN 2: CAMILLAS Y PACIENTES EN EL PUESTO MÉDICO -->
      <div class="bg-white border border-[#d2dfd8] rounded-xl p-5 shadow-sm space-y-4">
        <div class="flex items-center justify-between border-b border-[#edece4] pb-3">
          <h3 class="text-sm font-black uppercase tracking-wider text-[#0d2822]">
            Pacientes en Camillas / Sala de Espera de {{ acvActivo().codigo }}
          </h3>
          <span class="text-xs font-mono text-[#07483b] font-bold bg-[#edece4] px-2.5 py-1 rounded">
            Ordenados por Gravedad
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (item of pacientesEnEspera(); track item.id) {
            <div class="bg-[#fbfbfa] border border-[#d2dfd8] rounded-xl p-4 space-y-3 relative overflow-hidden shadow-xs">
              <div 
                class="absolute left-0 top-0 bottom-0 w-2.5"
                [ngClass]="{
                  'bg-red-600': item.triage === 'ROJO',
                  'bg-amber-500': item.triage === 'AMARILLO',
                  'bg-emerald-600': item.triage === 'VERDE',
                  'bg-slate-800': item.triage === 'NEGRO'
                }"
              ></div>

              <div class="pl-2 flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="font-mono font-black text-sm text-[#07483b]">{{ item.codigo }}</span>
                    <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase" [ngClass]="{
                      'bg-red-600 text-white': item.triage === 'ROJO',
                      'bg-amber-500 text-black': item.triage === 'AMARILLO',
                      'bg-emerald-600 text-white': item.triage === 'VERDE',
                      'bg-slate-800 text-white': item.triage === 'NEGRO'
                    }">{{ item.triage }}</span>
                  </div>
                  <h4 class="text-sm font-black text-[#0d2822] mt-1">
                    {{ item.nombresPaciente ? (item.nombresPaciente + ' ' + (item.apellidosPaciente || '')) : 'Paciente Sin Identificar' }}
                  </h4>
                  <p class="text-xs text-[#405c54]">C.I.: {{ item.cedula || 'S/N' }} • {{ item.motivo }}</p>
                </div>

                <div class="text-right font-mono text-xs">
                  <span class="text-slate-500 block">{{ item.horaInicio }}</span>
                  <span class="text-[#07483b] font-bold">{{ item.estado }}</span>
                </div>
              </div>

              @if (item.estado === 'EN_SALA_ESPERA') {
                <button 
                  (click)="llamarPaciente(item)"
                  class="w-full py-2.5 rounded-lg bg-[#07483b] hover:bg-[#0b5948] text-white text-xs font-black uppercase cursor-pointer"
                >
                  Pasar a Camilla / Evaluar Signos Vitales
                </button>
              }

              @if (item.estado === 'EN_CONSULTA') {
                <button 
                  (click)="abrirConsultaMedica(item)"
                  class="w-full py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase cursor-pointer"
                >
                  Abrir Evolución Médica y Signos Vitales
                </button>
              }
            </div>
          }
        </div>
      </div>

      <!-- FICHA CLÍNICA CON SEMÁFOROS DE SIGNOS VITALES Y PLANTILLAS DE 1 CLIC -->
      @if (pacienteEnConsulta) {
        <div class="bg-white border-2 border-[#07483b] rounded-2xl p-6 shadow-2xl space-y-6 animate-fadeIn">
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#edece4] pb-4">
            <div>
              <span class="text-xs font-mono font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-300">
                FICHA CLÍNICA EN {{ acvActivo().codigo }} • {{ pacienteEnConsulta.codigo }}
              </span>
              <h3 class="text-xl font-black text-[#0d2822] mt-1">
                {{ pacienteEnConsulta.nombresPaciente || 'Paciente' }} {{ pacienteEnConsulta.apellidosPaciente || '' }} (C.I. {{ pacienteEnConsulta.cedula || 'S/N' }})
              </h3>
            </div>

            <button 
              (click)="pacienteEnConsulta = null"
              class="px-3.5 py-1.5 rounded-lg bg-[#edece4] hover:bg-slate-200 text-xs text-[#0d2822] font-bold cursor-pointer"
            >
              ✕ Cerrar Ventana
            </button>
          </div>

          <!-- 01. SIGNOS VITALES CON ALERTA VISUAL AUTOMÁTICA -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-black uppercase tracking-wider text-[#07483b]">
                01. Monitoreo de Signos Vitales (Alerta automática si están fuera de rango)
              </h4>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
              
              <!-- Frecuencia Cardíaca -->
              <div class="p-3 rounded-xl border-2 text-center transition-all"
                   [ngClass]="(signos.fc > 110 || signos.fc < 55) ? 'bg-red-50 border-red-500 animate-pulse' : 'bg-[#f5f4ed] border-[#d2dfd8]'">
                <span class="text-[10px] font-black block uppercase" [ngClass]="(signos.fc > 110 || signos.fc < 55) ? 'text-red-700' : 'text-[#648279]'">
                  FC (lpm) {{ (signos.fc > 110 || signos.fc < 55) ? '[ALERTA]' : '' }}
                </span>
                <input type="number" [(ngModel)]="signos.fc" class="w-full text-center bg-transparent font-mono font-black text-lg focus:outline-none"/>
              </div>

              <!-- Presión Arterial -->
              <div class="p-3 rounded-xl border-2 text-center transition-all"
                   [ngClass]="(signos.paSistolica >= 140 || signos.paSistolica < 90) ? 'bg-amber-50 border-amber-500' : 'bg-[#f5f4ed] border-[#d2dfd8]'">
                <span class="text-[10px] text-[#648279] block font-black uppercase">PA (mmHg)</span>
                <div class="flex justify-center items-center gap-0.5 font-mono font-black text-base">
                  <input type="number" [(ngModel)]="signos.paSistolica" class="w-11 text-center bg-transparent focus:outline-none"/>
                  <span>/</span>
                  <input type="number" [(ngModel)]="signos.paDiastolica" class="w-11 text-center bg-transparent focus:outline-none"/>
                </div>
              </div>

              <!-- Saturación SpO2 -->
              <div class="p-3 rounded-xl border-2 text-center transition-all"
                   [ngClass]="signos.spo2 < 92 ? 'bg-red-50 border-red-600 animate-pulse' : 'bg-[#f5f4ed] border-[#d2dfd8]'">
                <span class="text-[10px] font-black block uppercase" [ngClass]="signos.spo2 < 92 ? 'text-red-700' : 'text-[#648279]'">
                  SpO2 (%) {{ signos.spo2 < 92 ? '[HIPOXIA]' : '' }}
                </span>
                <input type="number" [(ngModel)]="signos.spo2" class="w-full text-center bg-transparent font-mono font-black text-lg text-cyan-900 focus:outline-none"/>
              </div>

              <!-- Frecuencia Respiratoria -->
              <div class="bg-[#f5f4ed] p-3 rounded-xl border-2 border-[#d2dfd8] text-center">
                <span class="text-[10px] text-[#648279] block font-black uppercase">FR (rpm)</span>
                <input type="number" [(ngModel)]="signos.fr" class="w-full text-center bg-transparent font-mono font-black text-lg focus:outline-none"/>
              </div>

              <!-- Temperatura -->
              <div class="p-3 rounded-xl border-2 text-center transition-all"
                   [ngClass]="signos.temperatura >= 38 ? 'bg-amber-50 border-amber-500' : 'bg-[#f5f4ed] border-[#d2dfd8]'">
                <span class="text-[10px] text-[#648279] block font-black uppercase">Temp (°C)</span>
                <input type="number" step="0.1" [(ngModel)]="signos.temperatura" class="w-full text-center bg-transparent font-mono font-black text-lg focus:outline-none"/>
              </div>

              <!-- Escala de Glasgow -->
              <div class="p-3 rounded-xl border-2 text-center transition-all"
                   [ngClass]="signos.glasgow < 14 ? 'bg-red-50 border-red-600 animate-pulse' : 'bg-[#f5f4ed] border-[#d2dfd8]'">
                <span class="text-[10px] font-black block uppercase" [ngClass]="signos.glasgow < 14 ? 'text-red-700' : 'text-[#648279]'">
                  Glasgow (3-15)
                </span>
                <input type="number" min="3" max="15" [(ngModel)]="signos.glasgow" class="w-full text-center bg-transparent font-mono font-black text-lg focus:outline-none"/>
              </div>
            </div>
          </div>

          <!-- 02. PLANTILLAS CLÍNICAS DE 1 CLIC PARA MÉDICOS -->
          <div class="space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs font-black uppercase text-[#07483b]">
                02. Autocompletar Nota Médica con 1 Clic:
              </span>
              <div class="flex flex-wrap gap-1.5">
                <button type="button" (click)="aplicarPlantillaClinica('deshidratacion')" class="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 text-[11px] font-bold cursor-pointer">
                  + Golpe de Calor / Deshidratación
                </button>
                <button type="button" (click)="aplicarPlantillaClinica('trauma')" class="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 text-[11px] font-bold cursor-pointer">
                  + Trauma / Contusión
                </button>
                <button type="button" (click)="aplicarPlantillaClinica('ansiedad')" class="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 text-[11px] font-bold cursor-pointer">
                  + Crisis de Ansiedad
                </button>
                <button type="button" (click)="aplicarPlantillaClinica('intoxicacion')" class="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 text-[11px] font-bold cursor-pointer">
                  + Intoxicación Alcohólica
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label class="block font-bold text-[#405c54] mb-1">Cuadro Clínico y Examen Físico:</label>
                <textarea [(ngModel)]="anamnesis" rows="3" class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-xl p-3 font-medium focus:outline-none"></textarea>
              </div>
              <div>
                <label class="block font-bold text-[#405c54] mb-1">Diagnóstico y Tratamiento en Carpa:</label>
                <textarea [(ngModel)]="diagnostico" rows="3" class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-xl p-3 font-medium focus:outline-none"></textarea>
              </div>
            </div>
          </div>

          <!-- 03. DECISIÓN MÉDICA FINAL EN CARPA -->
          <div class="border-t border-[#edece4] pt-4">
            <h4 class="text-xs font-black uppercase tracking-wider text-[#405c54] mb-3">03. Destino del Paciente</h4>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button 
                (click)="finalizarCaso('OBSERVACION')"
                class="py-3.5 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-400 text-xs font-black uppercase cursor-pointer"
              >
                Mantener en Camilla (Observación)
              </button>
              <button 
                (click)="finalizarCaso('ALTA_ACV')"
                class="py-3.5 px-4 rounded-xl bg-[#07483b] hover:bg-[#0b5948] text-white text-xs font-black uppercase cursor-pointer shadow-md"
              >
                ✓ Otorgar Alta Médica en ACV
              </button>
              <button 
                (click)="finalizarCaso('TRASLADO_AMBULANCIA')"
                class="py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase cursor-pointer shadow-md"
              >
                Evacuar en Ambulancia a Hospital
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

  cedulaPaciente = '';
  nombresPaciente = '';
  apellidosPaciente = '';
  edadPaciente = 25;
  generoPaciente: 'M' | 'F' | 'OTRO' = 'M';

  signos: SignosVitales = {
    fc: 82,
    paSistolica: 120,
    paDiastolica: 80,
    fr: 16,
    spo2: 98,
    temperatura: 36.6,
    glasgow: 15
  };

  anamnesis = '';
  diagnostico = '';

  cambiarAcv(id: string) {
    const a = this.emergency.acvs().find(item => item.id === id);
    if (a) this.acvActivo.set(a);
  }

  aplicarPlantillaClinica(tipo: 'deshidratacion' | 'trauma' | 'ansiedad' | 'intoxicacion') {
    if (tipo === 'deshidratacion') {
      this.anamnesis = 'Paciente ingresa por mareo y debilidad tras permanecer de pie en aglomeración. Mucosas semihúmedas, consciente y orientado.';
      this.diagnostico = 'Agotamiento por calor y deshidratación leve. Se administra hidratación oral fraccionada y reposo en camilla fresca.';
    } else if (tipo === 'trauma') {
      this.anamnesis = 'Paciente sufre caída accidental en gradas/vallas. Dolor localizado a la palpación, movilidad conservada, sin sangrado activo.';
      this.diagnostico = 'Contusión / Esguince grado I. Se realiza inmovilización blanda, crioterapia local y analgesia oral (Paracetamol 1g).';
    } else if (tipo === 'ansiedad') {
      this.anamnesis = 'Paciente presenta hiperventilación, sensación de falta de aire y temblor fino secundario a aglomeración del evento. Campos pulmonares limpios.';
      this.diagnostico = 'Crisis de ansiedad reactiva. Se realiza contención verbal, ejercicios de respiración guiada y monitoreo de SpO2.';
    } else if (tipo === 'intoxicacion') {
      this.anamnesis = 'Paciente ingresa con aliento etílico, marcha atáxica y somnolencia leve. Vía aérea permeable, respuesta verbal conservada.';
      this.diagnostico = 'Intoxicación etílica aguda moderada. Posición lateral de seguridad, control de signos vitales y vigilancia neurológica.';
    }
  }

  pacientesPorTriar(): Atencion[] {
    return this.emergency.atenciones().filter(a => 
      (a.estado === 'TRASLADO_AL_ACV' || a.estado === 'PENDIENTE_TRIAGE') &&
      (!a.acvDestinoId || a.acvDestinoId === this.acvActivo().id)
    );
  }

  pacientesEnEspera(): Atencion[] {
    const ordenPrioridad: Record<string, number> = { ROJO: 1, AMARILLO: 2, VERDE: 3, NEGRO: 4 };
    return this.emergency.atenciones()
      .filter(a => 
        (a.estado === 'EN_SALA_ESPERA' || a.estado === 'EN_CONSULTA' || a.estado === 'OBSERVACION') &&
        (!a.acvDestinoId || a.acvDestinoId === this.acvActivo().id)
      )
      .sort((a, b) => (ordenPrioridad[a.triage || 'VERDE'] || 9) - (ordenPrioridad[b.triage || 'VERDE'] || 9));
  }

  seleccionarParaTriage(item: Atencion) {
    this.pacienteSeleccionadoTriage = item;
    this.cedulaPaciente = item.cedula || '';
    this.nombresPaciente = item.nombresPaciente || '';
    this.apellidosPaciente = item.apellidosPaciente || '';
    this.edadPaciente = item.edadPaciente || 25;
  }

  confirmarLlegadaACV(item: Atencion) {
    this.emergency.recibirEnACV(item.id, {
      cedula: item.cedula,
      nombres: item.nombresPaciente,
      apellidos: item.apellidosPaciente,
      edad: item.edadPaciente
    });
    this.seleccionarParaTriage(item);
  }

  asignarTriage(color: TriageColor) {
    if (!this.pacienteSeleccionadoTriage) return;
    this.emergency.recibirEnACV(this.pacienteSeleccionadoTriage.id, {
      cedula: this.cedulaPaciente,
      nombres: this.nombresPaciente,
      apellidos: this.apellidosPaciente,
      edad: this.edadPaciente
    });
    this.emergency.clasificarTriage(this.pacienteSeleccionadoTriage.id, color, this.acvActivo().encargado);
    this.pacienteSeleccionadoTriage = null;
  }

  llamarPaciente(item: Atencion) {
    this.emergency.llamarAConsultaACV(item.id, this.acvActivo().encargado);
    this.abrirConsultaMedica(item);
  }

  abrirConsultaMedica(item: Atencion) {
    this.pacienteEnConsulta = item;
    this.anamnesis = item.anamnesis || `Paciente atendido inicialmente por ${item.motivo} en ${item.sectorNombre}.`;
    this.diagnostico = item.diagnostico || `Medicación previa: ${item.medicamentosInSitu || 'Ninguna'}. Estabilización en puesto médico.`;
  }

  finalizarCaso(resolucion: 'ALTA_ACV' | 'OBSERVACION' | 'TRASLADO_AMBULANCIA') {
    if (!this.pacienteEnConsulta) return;
    this.emergency.finalizarConsultaACV(
      this.pacienteEnConsulta.id,
      resolucion,
      this.signos,
      this.anamnesis,
      this.diagnostico,
      this.diagnostico,
      resolucion === 'TRASLADO_AMBULANCIA' ? 'amb-1' : undefined
    );
    this.pacienteEnConsulta = null;
  }
}
