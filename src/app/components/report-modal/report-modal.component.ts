import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmergencyService } from '../../services/emergency.service';
import { DatabaseService } from '../../services/database.service';
import { Atencion } from '../../models/emergency.model';

export interface FirmaReporte {
  id: string;
  nombre: string;
  cargo: string;
  institucion: string;
}

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5 animate-fadeIn print:p-0 print:bg-white print:static">
      
      <!-- Contenedor Principal del Informe Clínico Oficial -->
      <div class="bg-white border-2 border-[#07483b] rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl text-[#0d2822] print:border-none print:shadow-none print:max-h-none print:w-full">
        
        <!-- Header del Modal (Oculto al imprimir si se desea) -->
        <div class="p-4 border-b border-[#05372d] flex items-center justify-between bg-[#07483b] text-white print:bg-white print:text-black print:border-b-2 print:border-black">
          <div class="flex items-center gap-3">
            <img src="logo-sepam.png" alt="SEPAM" class="w-10 h-10 rounded-full border-2 border-[#f59e0b] bg-black object-contain"/>
            <div>
              <h3 class="text-sm sm:text-base font-black tracking-wide print:text-lg">
                INFORME CONSOLIDADO DE ATENCIÓN PREHOSPITALARIA
              </h3>
              <p class="text-xs text-emerald-100 print:text-slate-600 font-mono">
                SEPAM ECUADOR • OPERATIVO: {{ emergency.evento().nombre }}
              </p>
            </div>
          </div>

          <!-- Botones de Acción (Descarga, Imprimir, Cerrar) - Solo Admins Generan Reportes -->
          <div class="flex items-center gap-2 print:hidden">
            @if (emergency.esSuperUsuario()) {
              <button 
                (click)="copiarResumen()"
                class="px-3 py-1.5 rounded-lg bg-[#05372d] hover:bg-[#0b5948] text-white text-xs font-bold border border-emerald-400/40 cursor-pointer flex items-center gap-1 shadow-xs"
                title="Copiar texto para WhatsApp / COE / Intendencia"
              >
                @if (copiado()) {
                  <span class="text-emerald-300">✓ ¡Copiado!</span>
                } @else {
                  <span>📋 Copiar Resumen</span>
                }
              </button>

              <button 
                (click)="db.descargarExcel()"
                class="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1 shadow-xs border border-teal-400/40"
                title="Descargar Libro Oficial Excel multi-hoja procesado por DuckDB"
              >
                <span>📊 Descargar Excel (DuckDB)</span>
              </button>

              <button 
                (click)="descargarCSV()"
                class="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer flex items-center gap-1 shadow-xs"
                title="Descargar datos en formato CSV"
              >
                <span>📥 Descargar CSV</span>
              </button>

              <button 
                (click)="imprimirReporte()"
                class="px-3.5 py-1.5 rounded-lg bg-[#f59e0b] hover:bg-amber-600 text-black text-xs font-black cursor-pointer flex items-center gap-1 shadow-xs"
                title="Generar e imprimir versión oficial PDF"
              >
                <span>🖨️ Generar PDF / Imprimir</span>
              </button>
            } @else {
              <!-- Badge informativo para usuarios no administradores (Solo Lectura) -->
              <div class="bg-[#05372d] border border-amber-400/40 px-3 py-1 rounded-lg flex items-center gap-1.5">
                <span class="text-amber-400 text-xs">👁️</span>
                <span class="text-[11px] font-bold text-amber-200">Solo Lectura (Generación oficial reservada a Admins)</span>
              </div>
            }

            <button 
              (click)="cerrar()"
              class="text-emerald-200 hover:text-white text-lg cursor-pointer px-2"
              title="Cerrar ventana"
            >
              ✕
            </button>
          </div>
        </div>

        <!-- Selector de Tipo de Reporte (1: Médico MSP vs 2: Log de Auditoría Técnica) -->
        <div class="bg-[#edece4] p-2 border-b border-[#d2dfd8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold print:hidden">
          <div class="flex items-center gap-2">
            <button 
              (click)="tipoReporte.set('medico')"
              [class.bg-[#07483b]]="tipoReporte() === 'medico'"
              [class.text-white]="tipoReporte() === 'medico'"
              [class.text-[#405c54]]="tipoReporte() !== 'medico'"
              class="px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
            >
              <span>📄 1. Informe Médico Operativo (MSP / COE)</span>
            </button>
            @if (emergency.esSuperUsuario()) {
              <button 
                (click)="tipoReporte.set('log')"
                [class.bg-[#07483b]]="tipoReporte() === 'log'"
                [class.text-white]="tipoReporte() === 'log'"
                [class.text-[#405c54]]="tipoReporte() !== 'log'"
                class="px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
              >
                <span>🛡️ 2. Log de Auditoría & Trazabilidad (Admin)</span>
                <span class="bg-amber-400 text-black text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {{ emergency.logsAuditoria().length }}
                </span>
              </button>
              <button 
                (click)="tipoReporte.set('duckdb'); db.cargarResumenDuckDB()"
                [class.bg-[#07483b]]="tipoReporte() === 'duckdb'"
                [class.text-white]="tipoReporte() === 'duckdb'"
                [class.text-[#405c54]]="tipoReporte() !== 'duckdb'"
                class="px-3 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
              >
                <span>🦆 3. Analítica DuckDB + SQLite WAL</span>
                <span class="bg-teal-400 text-black text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {{ db.conectado() ? 'ONLINE' : 'LOCAL' }}
                </span>
              </button>
            }
          </div>
          <span class="text-[11px] text-[#648279]">
            {{ tipoReporte() === 'medico' ? 'Documento Oficial Clínico' : tipoReporte() === 'log' ? 'Trazabilidad: Accesos y auditoría' : 'Consultas analíticas columnares en tiempo real' }}
          </span>
        </div>

        <!-- CUERPO DEL REPORTE CON SCROLLABLE (Fondo Beige Clínico #f5f4ed) -->
        <div class="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs bg-[#f5f4ed] print:bg-white print:p-2">
          
          @if (tipoReporte() === 'medico') {
          <!-- Metadatos Oficiales del Evento -->
          <div class="bg-white p-4 rounded-xl border border-[#d2dfd8] grid grid-cols-2 sm:grid-cols-4 gap-3 shadow-xs print:border-black print:rounded-none">
            <div>
              <span class="text-[10px] text-[#648279] uppercase font-bold block">Evento Masivo:</span>
              <span class="text-xs font-black text-[#07483b]">{{ emergency.evento().nombre }}</span>
            </div>
            <div>
              <span class="text-[10px] text-[#648279] uppercase font-bold block">Sede y Lugar:</span>
              <span class="text-xs font-bold text-[#0d2822]">{{ emergency.evento().ciudad }} — {{ emergency.evento().lugar }}</span>
            </div>
            <div>
              <span class="text-[10px] text-[#648279] uppercase font-bold block">Fecha y Horario:</span>
              <span class="text-xs font-bold text-[#0d2822]">{{ emergency.evento().fecha }} ({{ emergency.evento().horario }})</span>
            </div>
            <div>
              <span class="text-[10px] text-[#648279] uppercase font-bold block">Responsables de Mando:</span>
              <span class="text-xs font-bold text-[#07483b]">Pedro Zavala / Sebastian Zavala / admin1</span>
            </div>
          </div>

          <!-- RESUMEN EJECUTIVO (KPIs CONSOLIDADOS) -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="bg-white border border-[#d2dfd8] rounded-xl p-3 text-center shadow-xs">
              <span class="text-[10px] text-[#648279] uppercase font-bold block">Total Atenciones</span>
              <span class="text-2xl font-black text-[#07483b] font-mono">{{ totalAtenciones() }}</span>
              <span class="text-[10px] text-[#405c54] block">100% registradas</span>
            </div>
            <div class="bg-white border border-[#d2dfd8] rounded-xl p-3 text-center shadow-xs">
              <span class="text-[10px] text-[#648279] uppercase font-bold block">Resueltas In Situ</span>
              <span class="text-2xl font-black text-emerald-700 font-mono">{{ totalInSitu() }}</span>
              <span class="text-[10px] text-emerald-800 block">Alta médica en campo</span>
            </div>
            <div class="bg-white border border-[#d2dfd8] rounded-xl p-3 text-center shadow-xs">
              <span class="text-[10px] text-[#648279] uppercase font-bold block">Atendidas en ACV (1 & 2)</span>
              <span class="text-2xl font-black text-amber-700 font-mono">{{ totalACV() }}</span>
              <span class="text-[10px] text-amber-800 block">Triage y observación</span>
            </div>
            <div class="bg-white border border-[#d2dfd8] rounded-xl p-3 text-center shadow-xs">
              <span class="text-[10px] text-[#648279] uppercase font-bold block">Traslados Hospitalarios</span>
              <span class="text-2xl font-black text-red-700 font-mono">{{ totalHospital() }}</span>
              <span class="text-[10px] text-red-800 block">Ambulancias con hoja MSP</span>
            </div>
          </div>

          <!-- DESGLOSE TRIAGE START (CÓDIGO DE COLORES) -->
          <div class="bg-white p-4 rounded-xl border border-[#d2dfd8] shadow-xs space-y-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-[#07483b]">
              Distribución de Casos por Triage START:
            </h4>
            <div class="grid grid-cols-4 gap-2 text-center font-mono">
              <div class="bg-red-50 border border-red-300 p-2 rounded-lg">
                <span class="text-[10px] font-bold text-red-900 block">🔴 ROJO (Inmediato)</span>
                <span class="text-lg font-black text-red-700">{{ contarTriage('ROJO') }}</span>
              </div>
              <div class="bg-amber-50 border border-amber-300 p-2 rounded-lg">
                <span class="text-[10px] font-bold text-amber-900 block">🟡 AMARILLO (Urgente)</span>
                <span class="text-lg font-black text-amber-700">{{ contarTriage('AMARILLO') }}</span>
              </div>
              <div class="bg-emerald-50 border border-emerald-300 p-2 rounded-lg">
                <span class="text-[10px] font-bold text-emerald-900 block">🟢 VERDE (Leve)</span>
                <span class="text-lg font-black text-emerald-700">{{ contarTriage('VERDE') }}</span>
              </div>
              <div class="bg-slate-100 border border-slate-300 p-2 rounded-lg">
                <span class="text-[10px] font-bold text-slate-800 block">⚫ NEGRO (Fallecido)</span>
                <span class="text-lg font-black text-slate-800">{{ contarTriage('NEGRO') }}</span>
              </div>
            </div>
          </div>

          <!-- TABLA DETALLADA DE PACIENTES ATENDIDOS (Fiel a la cédula, medicación y hospital) -->
          <div class="bg-white rounded-xl border border-[#d2dfd8] overflow-hidden shadow-xs">
            <div class="p-3 bg-[#edece4] border-b border-[#d2dfd8] flex items-center justify-between">
              <h4 class="text-xs font-bold uppercase tracking-wider text-[#07483b]">
                Registro Nominal Consolidado de Pacientes
              </h4>
              <span class="text-[11px] font-mono text-[#648279]">Total: {{ emergency.atenciones().length }} registros</span>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-[#f5f4ed] text-[#07483b] uppercase font-bold border-b border-[#d2dfd8]">
                  <tr>
                    <th class="py-2.5 px-3">Código</th>
                    <th class="py-2.5 px-3">Cédula Ecu.</th>
                    <th class="py-2.5 px-3">Paciente / Edad</th>
                    <th class="py-2.5 px-3">Sector</th>
                    <th class="py-2.5 px-3">Motivo / Diagnóstico</th>
                    <th class="py-2.5 px-3">Triage</th>
                    <th class="py-2.5 px-3">Medicación In Situ</th>
                    <th class="py-2.5 px-3">Destino / Resolución</th>
                    <th class="py-2.5 px-3">Hospital / N° Hoja MSP</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#edece4] font-mono text-[11px]">
                  @for (at of emergency.atenciones(); track at.id) {
                    <tr class="hover:bg-[#fbfbfa]">
                      <td class="py-2 px-3 font-bold text-[#07483b]">{{ at.codigo }}</td>
                      <td class="py-2 px-3 text-[#0d2822] font-bold">{{ at.cedula || 'N/A' }}</td>
                      <td class="py-2 px-3 font-sans">
                        <span class="font-bold text-[#0d2822] block">{{ at.nombresPaciente || 'No identificado' }} {{ at.apellidosPaciente || '' }}</span>
                        <span class="text-[10px] text-slate-500">{{ at.edadPaciente ? at.edadPaciente + ' años' : '--' }}</span>
                      </td>
                      <td class="py-2 px-3 font-sans text-[#405c54]">{{ at.sectorNombre }}</td>
                      <td class="py-2 px-3 font-sans">
                        <span class="font-semibold text-[#0d2822] block">{{ at.motivo }}</span>
                        <span class="text-[10px] text-slate-500 block truncate max-w-[120px]">{{ at.motivoDetalle }}</span>
                      </td>
                      <td class="py-2 px-3">
                        @if (at.triage) {
                          <span 
                            class="px-1.5 py-0.2 rounded text-[9px] font-black uppercase"
                            [ngClass]="{
                              'bg-red-600 text-white': at.triage === 'ROJO',
                              'bg-amber-500 text-black': at.triage === 'AMARILLO',
                              'bg-emerald-600 text-white': at.triage === 'VERDE',
                              'bg-slate-800 text-white': at.triage === 'NEGRO'
                            }"
                          >
                            {{ at.triage }}
                          </span>
                        } @else {
                          <span class="text-slate-400">--</span>
                        }
                      </td>
                      <td class="py-2 px-3 font-sans text-[#07483b] font-medium">
                        {{ at.medicamentosInSitu || 'Ninguno' }}
                      </td>
                      <td class="py-2 px-3 font-sans">
                        <span class="font-bold text-xs" [ngClass]="{
                          'text-emerald-700': at.estado.includes('ALTA'),
                          'text-red-700': at.estado.includes('HOSPITAL') || at.estado.includes('AMBULANCIA'),
                          'text-amber-700': at.estado.includes('ATENCION') || at.estado.includes('ACV')
                        }">
                          {{ at.estado }}
                        </span>
                      </td>
                      <td class="py-2 px-3 font-sans">
                        @if (at.casaSaludDestino) {
                          <span class="font-bold text-[#0d2822] block text-[10px]">{{ at.casaSaludDestino }}</span>
                          <span class="text-[9px] text-[#648279] font-mono block">Hoja: {{ at.hojaAtencionNumero }}</span>
                          <span class="text-[9px] text-slate-500 block">Médico: {{ at.medicoReceptorHospital }}</span>
                        } @else {
                          <span class="text-slate-400">Atendido in situ / ACV</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>

          <!-- BLOQUE DE FIRMAS OFICIALES DE RESPONSABILIDAD (Personalizable para Admins) -->
          <div class="pt-6 border-t border-[#d2dfd8] space-y-3 print:pt-12 print:border-t-2 print:border-black">
            
            <div class="flex items-center justify-between print:hidden">
              <span class="text-[11px] font-bold text-[#405c54] uppercase tracking-wider flex items-center gap-1.5">
                <span>✍️</span> Pie de Firmas de Responsabilidad Legal (Editable por Administrador):
              </span>
              @if (emergency.esSuperUsuario()) {
                <button 
                  (click)="agregarFirma()"
                  class="px-2.5 py-1 rounded-md bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-black cursor-pointer shadow-xs flex items-center gap-1 transition-all"
                  title="Añadir una nueva firma al informe"
                >
                  <span>+ Agregar Firma</span>
                </button>
              }
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-center text-xs">
              @for (firma of firmas(); track firma.id) {
                <div class="border-t-2 border-[#07483b] pt-2 relative group print:border-black">
                  
                  <!-- Botón Eliminar Firma (Solo para Admins, oculto en impresión) -->
                  @if (emergency.esSuperUsuario()) {
                    <button 
                      (click)="eliminarFirma(firma.id)"
                      class="absolute -top-3 right-0 bg-red-100 hover:bg-red-200 text-red-700 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center cursor-pointer opacity-80 group-hover:opacity-100 transition-opacity print:hidden shadow-xs"
                      title="Eliminar esta firma"
                    >
                      ✕
                    </button>
                  }

                  <!-- Campos Editables con doble clic para borrar por defecto -->
                  @if (emergency.esSuperUsuario()) {
                    <input 
                      type="text" 
                      [(ngModel)]="firma.nombre"
                      (dblclick)="firma.nombre = ''"
                      placeholder="XXXXXX (Doble clic para borrar)"
                      class="w-full text-center font-black text-[#0d2822] bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-[#07483b] rounded py-0.5 text-xs transition-all outline-none print:border-none print:p-0 print:text-black"
                      title="Doble clic para borrar texto"
                    />
                    <input 
                      type="text" 
                      [(ngModel)]="firma.cargo"
                      (dblclick)="firma.cargo = ''"
                      placeholder="Lorem Ipsum (Doble clic para borrar)"
                      class="w-full text-center text-[10px] text-[#648279] bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-[#07483b] rounded py-0.5 transition-all outline-none print:border-none print:p-0 print:text-slate-700"
                      title="Doble clic para borrar texto"
                    />
                    <input 
                      type="text" 
                      [(ngModel)]="firma.institucion"
                      (dblclick)="firma.institucion = ''"
                      placeholder="XXXXXX (Doble clic para borrar)"
                      class="w-full text-center text-[9px] font-mono text-slate-400 bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-[#07483b] rounded py-0.5 transition-all outline-none print:border-none print:p-0 print:text-slate-600"
                      title="Doble clic para borrar texto"
                    />
                  } @else {
                    <span class="font-black text-[#0d2822] block">{{ firma.nombre }}</span>
                    <span class="text-[10px] text-[#648279] block">{{ firma.cargo }}</span>
                    <span class="text-[9px] font-mono text-slate-400 block">{{ firma.institucion }}</span>
                  }
                </div>
              }
            </div>

          </div>
          } @else if (tipoReporte() === 'log') {
            <!-- ======================================================== -->
            <!-- REPORTE 2: LOG DE AUDITORÍA Y TRAZABILIDAD TÉCNICA -->
            <!-- ======================================================== -->
            <div class="space-y-4">
              
              <!-- Tarjeta de Control del Log -->
              <div class="bg-white p-4 rounded-xl border border-[#d2dfd8] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold uppercase">
                    Auditoría Interna • Puesto de Mando (LAN)
                  </span>
                  <h4 class="text-sm font-black text-[#0d2822] mt-1">Bitácora Táctica de Accesos y Eventos en Red</h4>
                  <p class="text-xs text-[#405c54]">Registra con precisión de segundos cada inicio de sesión, dispositivo y acción médica.</p>
                </div>
                <div class="text-right font-mono">
                  <span class="text-xs text-[#648279] block">Total Eventos Registrados:</span>
                  <span class="text-xl font-black text-[#07483b]">{{ emergency.logsAuditoria().length }}</span>
                </div>
              </div>

              <!-- Tabla de Logs de Auditoría -->
              <div class="bg-white border border-[#d2dfd8] rounded-xl overflow-hidden shadow-xs">
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs">
                    <thead class="bg-[#edece4] text-[#07483b] uppercase tracking-wider font-bold border-b border-[#d2dfd8]">
                      <tr>
                        <th class="py-3 px-3">Hora / Fecha</th>
                        <th class="py-3 px-3">Usuario</th>
                        <th class="py-3 px-3">Rol</th>
                        <th class="py-3 px-3">Acción Registrada</th>
                        <th class="py-3 px-3">Detalle Clínico / Operativo</th>
                        <th class="py-3 px-3 text-right">Dispositivo / Origen</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-[#edece4] font-mono">
                      @for (log of emergency.logsAuditoria(); track log.id) {
                        <tr class="hover:bg-[#fbfbfa]">
                          <td class="py-2.5 px-3 font-bold text-[#07483b]">
                            {{ log.timestamp }}
                            <span class="text-[10px] text-slate-400 block">{{ log.fecha }}</span>
                          </td>
                          <td class="py-2.5 px-3 font-sans">
                            <span class="font-bold text-[#0d2822] block">{{ log.nombreUsuario }}</span>
                            <span class="text-[10px] text-slate-500 font-mono">{{ log.usuario }}</span>
                          </td>
                          <td class="py-2.5 px-3 font-sans">
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                              {{ log.rol }}
                            </span>
                          </td>
                          <td class="py-2.5 px-3 font-sans">
                            <span class="font-bold text-xs" [ngClass]="{
                              'text-emerald-700': log.accion === 'INICIO_SESION' || log.accion === 'ALTA_MEDICA',
                              'text-amber-700': log.accion === 'NUEVA_ATENCION' || log.accion === 'TRASLADO_ACV',
                              'text-purple-700': log.accion === 'TRIAGE_ASIGNADO',
                              'text-red-700': log.accion === 'ALERTA_EMITIDA' || log.accion === 'DERIVACION_HOSPITAL'
                            }">
                              {{ log.accion }}
                            </span>
                          </td>
                          <td class="py-2.5 px-3 font-sans text-[#405c54] max-w-xs truncate">
                            {{ log.detalles }}
                          </td>
                          <td class="py-2.5 px-3 text-right text-[11px] font-sans text-slate-600">
                            {{ log.dispositivo }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          } @else if (tipoReporte() === 'duckdb') {
            <div class="space-y-4">
              <!-- Banner Tecnológico DuckDB + SQLite -->
              <div class="bg-white p-4 rounded-xl border-2 border-teal-600 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-teal-900 text-white flex items-center justify-center text-2xl shadow-inner font-mono">
                    🦆
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <h4 class="text-sm font-black text-[#07483b]">Motor Analítico DuckDB 1.5 + SQLite WAL</h4>
                      <span class="text-[10px] px-2 py-0.5 rounded font-black uppercase"
                            [ngClass]="db.conectado() ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'">
                        {{ db.conectado() ? '● SERVIDOR EN VIVO (8000)' : '○ MODO STANDBY LOCAL' }}
                      </span>
                    </div>
                    <p class="text-[11px] text-[#405c54]">
                      Consultas OLAP columnares en milisegundos directamente sobre el archivo <code>sepam.db</code>.
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button 
                    (click)="db.cargarResumenDuckDB()" 
                    class="px-3 py-1.5 rounded-lg bg-[#edece4] hover:bg-slate-200 text-xs font-bold text-[#07483b] border border-[#d2dfd8] cursor-pointer flex items-center gap-1"
                  >
                    <span>🔄 Recalcular</span>
                  </button>
                  <button 
                    (click)="db.descargarExcel()" 
                    class="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-black cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <span>📊 Exportar Excel (.xlsx)</span>
                  </button>
                </div>
              </div>

              <!-- Estadísticas Analíticas DuckDB -->
              @if (db.resumenAnalitico(); as res) {
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div class="bg-white p-3 rounded-xl border border-[#d2dfd8] shadow-xs text-center">
                    <span class="text-[10px] text-[#648279] uppercase font-bold block">Atenciones Analizadas</span>
                    <span class="text-2xl font-black text-teal-800 font-mono">{{ res.triage.total_atenciones }}</span>
                    <span class="text-[10px] text-teal-900 block font-semibold">100% procesadas</span>
                  </div>
                  <div class="bg-white p-3 rounded-xl border border-[#d2dfd8] shadow-xs text-center">
                    <span class="text-[10px] text-[#648279] uppercase font-bold block">Edad Promedio Pacientes</span>
                    <span class="text-2xl font-black text-[#07483b] font-mono">{{ res.triage.edad_promedio }} <span class="text-xs">años</span></span>
                    <span class="text-[10px] text-[#648279] block">Cálculo columnar</span>
                  </div>
                  <div class="bg-white p-3 rounded-xl border border-[#d2dfd8] shadow-xs text-center">
                    <span class="text-[10px] text-[#648279] uppercase font-bold block">Traslados Hospitalarios</span>
                    <span class="text-2xl font-black text-red-700 font-mono">{{ res.triage.traslados_ambulancia }}</span>
                    <span class="text-[10px] text-red-800 block">Ambulancias ALFA</span>
                  </div>
                  <div class="bg-white p-3 rounded-xl border border-[#d2dfd8] shadow-xs text-center">
                    <span class="text-[10px] text-[#648279] uppercase font-bold block">Eventos en Bitácora</span>
                    <span class="text-2xl font-black text-amber-700 font-mono">{{ res.total_logs }}</span>
                    <span class="text-[10px] text-amber-800 block">Trazabilidad total</span>
                  </div>
                </div>

                <!-- Desglose por Sector y Curva Horaria -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Sectores con DuckDB -->
                  <div class="bg-white p-4 rounded-xl border border-[#d2dfd8] shadow-xs">
                    <h5 class="text-xs font-black text-[#07483b] uppercase mb-3 flex items-center gap-1.5">
                      <span>📍</span> Distribución por Sectores (Zonas de Calor)
                    </h5>
                    <div class="space-y-2">
                      @for (sec of res.sectores; track sec.sector_nombre) {
                        <div class="p-2.5 rounded-lg bg-[#f5f4ed] border border-[#d2dfd8] flex items-center justify-between text-xs">
                          <div>
                            <span class="font-bold text-[#0d2822] block">{{ sec.sector_nombre }}</span>
                            <span class="text-[10px] text-[#648279]">
                              {{ sec.criticos > 0 ? '⚠️ ' + sec.criticos + ' pacientes críticos (Rojo)' : '✓ Sin emergencias rojas' }}
                            </span>
                          </div>
                          <span class="text-xs font-black px-2 py-0.5 rounded bg-teal-100 text-teal-900 border border-teal-300 font-mono">
                            {{ sec.atenciones }} atenciones
                          </span>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Curva Horaria -->
                  <div class="bg-white p-4 rounded-xl border border-[#d2dfd8] shadow-xs">
                    <h5 class="text-xs font-black text-[#07483b] uppercase mb-3 flex items-center gap-1.5">
                      <span>⏱️</span> Curva de Carga Horaria (Histograma)
                    </h5>
                    <div class="space-y-2">
                      @for (c of res.curva_horaria; track c.hora) {
                        <div class="p-2.5 rounded-lg bg-[#f5f4ed] border border-[#d2dfd8] flex items-center justify-between text-xs">
                          <span class="font-mono font-bold text-[#07483b]">{{ c.hora }} - {{ c.hora.replace(':00', ':59') }}</span>
                          <div class="flex items-center gap-2">
                            @if (c.rojo > 0) { <span class="text-[10px] text-red-700 font-bold">🔴 {{ c.rojo }}</span> }
                            @if (c.amarillo > 0) { <span class="text-[10px] text-amber-700 font-bold">🟡 {{ c.amarillo }}</span> }
                            @if (c.verde > 0) { <span class="text-[10px] text-emerald-700 font-bold">🟢 {{ c.verde }}</span> }
                            <span class="font-black text-xs bg-slate-200 px-2 py-0.5 rounded font-mono">{{ c.total }}</span>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              } @else {
                <div class="bg-white p-8 rounded-xl border border-[#d2dfd8] text-center space-y-2">
                  <span class="text-3xl">🦆</span>
                  <p class="text-xs font-bold text-[#07483b]">Cargando métricas columnares desde DuckDB...</p>
                  <p class="text-[11px] text-[#648279]">Asegúrate de que el servidor local de base de datos esté iniciado en el puerto 8000.</p>
                </div>
              }
            </div>
          }

        </div>

        <!-- Footer del Modal -->
        <div class="p-3.5 border-t border-[#d2dfd8] bg-white flex justify-end print:hidden">
          <button 
            (click)="cerrar()"
            class="px-5 py-2 rounded-lg bg-[#edece4] border border-[#d2dfd8] hover:bg-slate-200 text-xs font-bold text-[#0d2822] cursor-pointer"
          >
            Cerrar Informe
          </button>
        </div>

      </div>
    </div>
  `
})
export class ReportModalComponent {
  emergency = inject(EmergencyService);
  db = inject(DatabaseService);
  tipoReporte = signal<'medico' | 'log' | 'duckdb'>('medico');
  copiado = signal(false);

  // Lista personalizable de firmas de responsabilidad legal en el pie del reporte
  // Por requerimiento: por defecto con XXXXXX y Lorem Ipsum; con doble clic para borrar y botones para agregar/eliminar
  firmas = signal<FirmaReporte[]>([
    {
      id: 'f-1',
      nombre: 'XXXXXX',
      cargo: 'Lorem Ipsum',
      institucion: 'XXXXXX'
    },
    {
      id: 'f-2',
      nombre: 'XXXXXX',
      cargo: 'Lorem Ipsum',
      institucion: 'XXXXXX'
    },
    {
      id: 'f-3',
      nombre: 'XXXXXX',
      cargo: 'Lorem Ipsum',
      institucion: 'XXXXXX'
    }
  ]);

  agregarFirma() {
    this.firmas.update(list => [
      ...list,
      {
        id: `f-${Date.now()}`,
        nombre: 'XXXXXX',
        cargo: 'Lorem Ipsum',
        institucion: 'XXXXXX'
      }
    ]);
    this.emergency.mostrarNotificacion('Nueva firma añadida al pie del informe', 'info');
  }

  eliminarFirma(id: string) {
    this.firmas.update(list => list.filter(f => f.id !== id));
    this.emergency.mostrarNotificacion('Firma eliminada del informe', 'info');
  }

  totalAtenciones = () => this.emergency.atenciones().length;
  totalInSitu = () => this.emergency.atenciones().filter(a => a.estado === 'ALTA_IN_SITU').length;
  totalACV = () => this.emergency.atenciones().filter(a => a.estado === 'ALTA_ACV' || a.estado === 'EN_CONSULTA' || a.estado === 'OBSERVACION').length;
  totalHospital = () => this.emergency.atenciones().filter(a => a.estado === 'TRASLADO_HOSPITALARIO').length;

  contarTriage(color: string): number {
    return this.emergency.atenciones().filter(a => a.triage === color).length;
  }

  cerrar() {
    window.dispatchEvent(new CustomEvent('cerrar-modal-reporte'));
  }

  imprimirReporte() {
    window.print();
  }

  descargarCSV() {
    if (this.tipoReporte() === 'log') {
      const logs = this.emergency.logsAuditoria();
      const headers = 'Timestamp,Fecha,Usuario,Nombre,Rol,Accion,Detalles,Dispositivo\n';
      const rows = logs.map(l => 
        `"${l.timestamp}","${l.fecha}","${l.usuario}","${l.nombreUsuario}","${l.rol}","${l.accion}","${l.detalles}","${l.dispositivo}"`
      ).join('\n');

      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sepam_log_auditoria_sistema_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const atenciones = this.emergency.atenciones();
    const headers = 'Codigo,Cedula,Nombres,Apellidos,Edad,Sector,Motivo,Triage,Medicamentos,Estado,HospitalDestino,HojaAtencionMSP,MedicoReceptor\n';
    
    const rows = atenciones.map(a => 
      `"${a.codigo}","${a.cedula || ''}","${a.nombresPaciente || ''}","${a.apellidosPaciente || ''}","${a.edadPaciente || ''}","${a.sectorNombre}","${a.motivo}","${a.triage || ''}","${a.medicamentosInSitu || ''}","${a.estado}","${a.casaSaludDestino || ''}","${a.hojaAtencionNumero || ''}","${a.medicoReceptorHospital || ''}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_prehospitalario_chino_y_nacho_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  copiarResumen() {
    const e = this.emergency.evento();
    const texto = `🚨 *REPORTE OFICIAL PREHOSPITALARIO - SEPAM ECUADOR*
📅 Evento: ${e.nombre} (${e.ciudad} - ${e.fecha})
👥 Administradores: Pedro Zavala / Sebastian Zavala / admin1

📊 *MÉTRICAS OPERATIVAS:*
• Total Atenciones: ${this.totalAtenciones()}
• Resueltas In Situ (Campo): ${this.totalInSitu()}
• Atendidas en ACV (PMA 1 y 2): ${this.totalACV()}
• Traslados a Hospitales (Ambulancias): ${this.totalHospital()}

🩺 *TRIAGE START:*
🔴 Rojo: ${this.contarTriage('ROJO')}
🟡 Amarillo: ${this.contarTriage('AMARILLO')}
🟢 Verde: ${this.contarTriage('VERDE')}
⚫ Negro: ${this.contarTriage('NEGRO')}

Informe consolidado cerrado satisfactoriamente.`;

    navigator.clipboard.writeText(texto);
    this.copiado.set(true);
    setTimeout(() => this.copiado.set(false), 2500);
  }
}
