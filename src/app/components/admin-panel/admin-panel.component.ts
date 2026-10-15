import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmergencyService } from '../../services/emergency.service';
import { DatabaseService } from '../../services/database.service';
import { NetworkService } from '../../services/network.service';
import { Paramedico, Sector, ACV, Ambulancia, SuperUsuario } from '../../models/emergency.model';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 animate-fadeIn">
      
      <!-- Encabezado del Panel Super Usuario -->
      <div class="bg-white border border-[#d2dfd8] rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="text-[10px] font-mono px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold uppercase">
              Control Maestro • Super Usuario
            </span>
            <span class="text-xs text-[#648279] font-mono">Gestión Total de Parámetros y Recursos</span>
          </div>
          <h2 class="text-xl md:text-2xl font-black text-[#0d2822] flex items-center gap-2">
            <span>⚙️ Panel de Gestión Operativa (CRUD)</span>
          </h2>
          <p class="text-xs text-[#405c54] mt-1">
            Módulo integral para crear, editar, eliminar, exportar e importar datos en Excel y CSV de Ambulancias, Empleados y Puestos ACV.
          </p>
        </div>

        <!-- Selector de Pestañas del Panel de Control -->
        <div class="flex items-center bg-[#edece4] p-1 rounded-xl border border-[#d2dfd8] overflow-x-auto">
          <button 
            (click)="tabActiva = 'paramedicos'"
            [class.bg-[#07483b]]="tabActiva === 'paramedicos'"
            [class.text-white]="tabActiva === 'paramedicos'"
            [class.text-[#405c54]]="tabActiva !== 'paramedicos'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            👥 Empleados / Paramédicos ({{ emergency.personal().length }})
          </button>
          <button 
            (click)="tabActiva = 'ambulancias'"
            [class.bg-[#07483b]]="tabActiva === 'ambulancias'"
            [class.text-white]="tabActiva === 'ambulancias'"
            [class.text-[#405c54]]="tabActiva !== 'ambulancias'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            🚑 Ambulancias ({{ emergency.ambulancias().length }})
          </button>
          <button 
            (click)="tabActiva = 'acvs'"
            [class.bg-[#07483b]]="tabActiva === 'acvs'"
            [class.text-white]="tabActiva === 'acvs'"
            [class.text-[#405c54]]="tabActiva !== 'acvs'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            🏥 Puestos ACV ({{ emergency.acvs().length }})
          </button>
          <button 
            (click)="tabActiva = 'sectores'"
            [class.bg-[#07483b]]="tabActiva === 'sectores'"
            [class.text-white]="tabActiva === 'sectores'"
            [class.text-[#405c54]]="tabActiva !== 'sectores'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            📍 Sectores ({{ emergency.sectores().length }})
          </button>
          <button 
            (click)="tabActiva = 'superusuarios'"
            [class.bg-[#07483b]]="tabActiva === 'superusuarios'"
            [class.text-white]="tabActiva === 'superusuarios'"
            [class.text-[#405c54]]="tabActiva !== 'superusuarios'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            ⭐ Super Usuarios
          </button>
          <button 
            (click)="tabActiva = 'evento'"
            [class.bg-[#07483b]]="tabActiva === 'evento'"
            [class.text-white]="tabActiva === 'evento'"
            [class.text-[#405c54]]="tabActiva !== 'evento'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
          >
            📅 Evento
          </button>
          <button 
            (click)="tabActiva = 'red'"
            [class.bg-[#07483b]]="tabActiva === 'red'"
            [class.text-white]="tabActiva === 'red'"
            [class.text-[#405c54]]="tabActiva !== 'red'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
          >
            <span>📲 Código QR Móvil</span>
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>
          <button 
            (click)="tabActiva = 'poliglota'"
            [class.bg-[#07483b]]="tabActiva === 'poliglota'"
            [class.text-white]="tabActiva === 'poliglota'"
            [class.text-[#405c54]]="tabActiva !== 'poliglota'"
            class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5"
          >
            <span>⚡ Tri-Motor Políglota</span>
            <span class="w-1.5 h-1.5 rounded-full" [ngClass]="db.redisOnline() ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"></span>
          </button>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- PESTAÑA 1: CRUD PARAMÉDICOS / EMPLEADOS -->
      <!-- ======================================================== -->
      @if (tabActiva === 'paramedicos') {
        <div class="bg-white border border-[#d2dfd8] rounded-xl p-5 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#edece4] pb-3">
            <div>
              <h3 class="text-sm font-bold uppercase tracking-wider text-[#07483b]">
                Gestión de Empleados y Paramédicos ({{ emergency.personal().length }})
              </h3>
              <p class="text-xs text-[#648279]">
                Crear, modificar credenciales, asignar sectores y exportar/importar planillas.
              </p>
            </div>
            
            <!-- Barra de Acciones del CRUD -->
            <div class="flex flex-wrap items-center gap-2">
              <button 
                (click)="exportarParamedicosCSV()"
                class="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1"
                title="Descargar lista de empleados en formato CSV"
              >
                <span>📥 CSV</span>
              </button>
              <button 
                (click)="exportarParamedicosExcel()"
                class="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1"
                title="Descargar planilla Excel"
              >
                <span>📊 Excel</span>
              </button>
              <label 
                class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-black cursor-pointer shadow-xs flex items-center gap-1"
                title="Subir archivo CSV con nuevos paramédicos"
              >
                <span>📤 Importar CSV</span>
                <input type="file" accept=".csv" class="hidden" (change)="importarCSV($event, 'paramedicos')" />
              </label>
              <button 
                (click)="abrirModalNuevoParamedico()"
                class="px-3.5 py-1.5 rounded-lg bg-[#07483b] hover:bg-[#0b5948] text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>+ Nuevo Empleado</span>
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-[#edece4] text-[#07483b] uppercase font-bold border-b border-[#d2dfd8]">
                <tr>
                  <th class="py-2.5 px-3">Paramédico / Nombre</th>
                  <th class="py-2.5 px-3">Usuario</th>
                  <th class="py-2.5 px-3">Clave Temporal</th>
                  <th class="py-2.5 px-3">Rol Operativo</th>
                  <th class="py-2.5 px-3">Sector Asignado</th>
                  <th class="py-2.5 px-3">Teléfono</th>
                  <th class="py-2.5 px-3">Estado</th>
                  <th class="py-2.5 px-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#edece4] font-mono">
                @for (p of emergency.personal(); track p.id) {
                  <tr class="hover:bg-[#fbfbfa] transition-colors">
                    <td class="py-2.5 px-3 font-sans font-bold text-[#0d2822]">
                      {{ p.nombre }}
                    </td>
                    <td class="py-2.5 px-3 text-[#07483b] font-bold">
                      {{ p.usuario }}
                    </td>
                    <td class="py-2.5 px-3 text-amber-800 bg-amber-50/80 px-2 rounded">
                      {{ p.passwordTemporal }}
                    </td>
                    <td class="py-2.5 px-3 font-sans text-[#405c54]">
                      {{ p.rol }}
                    </td>
                    <td class="py-2.5 px-3 font-sans font-semibold text-emerald-800">
                      {{ p.sectorNombre }}
                    </td>
                    <td class="py-2.5 px-3 text-slate-500">
                      {{ p.telefono }}
                    </td>
                    <td class="py-2.5 px-3 font-sans">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold"
                            [ngClass]="p.estado === 'DISPONIBLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'">
                        {{ p.estado }}
                      </span>
                    </td>
                    <td class="py-2.5 px-3 text-right font-sans space-x-1 whitespace-nowrap">
                      <button 
                        (click)="editarParamedico(p)"
                        class="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-[11px] font-bold text-amber-900 cursor-pointer inline-flex items-center gap-1"
                        title="Modificar datos del paramédico"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        <span>Editar</span>
                      </button>
                      <button 
                        (click)="eliminarParamedico(p.id)"
                        class="px-2 py-1 rounded bg-red-100 hover:bg-red-200 text-[11px] font-bold text-red-700 cursor-pointer"
                        title="Eliminar paramédico"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- PESTAÑA 2: CRUD AMBULANCIAS -->
      <!-- ======================================================== -->
      @if (tabActiva === 'ambulancias') {
        <div class="bg-white border border-[#d2dfd8] rounded-xl p-5 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#edece4] pb-3">
            <div>
              <h3 class="text-sm font-bold uppercase tracking-wider text-[#07483b]">
                Flota Móvil de Ambulancias ({{ emergency.ambulancias().length }})
              </h3>
              <p class="text-xs text-[#648279]">
                Registro de unidades de soporte vital avanzado/básico, tripulaciones y placas.
              </p>
            </div>

            <!-- Acciones CRUD Ambulancia -->
            <div class="flex flex-wrap items-center gap-2">
              <button 
                (click)="exportarAmbulanciasCSV()"
                class="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1"
              >
                <span>📥 CSV</span>
              </button>
              <button 
                (click)="exportarAmbulanciasExcel()"
                class="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1"
              >
                <span>📊 Excel</span>
              </button>
              <label 
                class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-black cursor-pointer shadow-xs flex items-center gap-1"
              >
                <span>📤 Importar CSV</span>
                <input type="file" accept=".csv" class="hidden" (change)="importarCSV($event, 'ambulancias')" />
              </label>
              <button 
                (click)="abrirModalNuevaAmbulancia()"
                class="px-3.5 py-1.5 rounded-lg bg-[#07483b] hover:bg-[#0b5948] text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>+ Nueva Ambulancia</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (amb of emergency.ambulancias(); track amb.id) {
              <div class="bg-[#f5f4ed] border-2 border-cyan-800/40 rounded-xl p-4 space-y-2 relative shadow-xs">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-mono font-bold text-cyan-900 bg-white px-2 py-0.5 rounded border border-[#d2dfd8]">
                    {{ amb.codigo }} • {{ amb.placa }}
                  </span>
                  <span class="text-[10px] px-2 py-0.5 rounded font-bold uppercase"
                        [ngClass]="amb.estado === 'DISPONIBLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-cyan-100 text-cyan-800'">
                    {{ amb.estado }}
                  </span>
                </div>
                <h4 class="text-xs font-bold text-[#0d2822]">{{ amb.tipo }}</h4>
                <p class="text-xs text-[#07483b] font-bold">🚑 Paramédico: {{ amb.paramedicoResponsable }}</p>
                <p class="text-xs text-[#405c54]">Conductor: {{ amb.conductor || 'Por designar' }}</p>
                <div class="pt-2 flex justify-end gap-1.5 border-t border-[#d2dfd8]">
                  <button 
                    (click)="editarAmbulancia(amb)"
                    class="px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    <span>Editar</span>
                  </button>
                  <button 
                    (click)="eliminarAmbulancia(amb.id)"
                    class="px-2.5 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold cursor-pointer"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- PESTAÑA 3: CRUD MÓDULO DE ATENCIÓN DE VÍCTIMAS (ACV) -->
      <!-- ======================================================== -->
      @if (tabActiva === 'acvs') {
        <div class="bg-white border border-[#d2dfd8] rounded-xl p-5 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#edece4] pb-3">
            <div>
              <h3 class="text-sm font-bold uppercase tracking-wider text-[#07483b]">
                Puestos Médicos Avanzados / Áreas de Concentración de Víctimas (ACV) ({{ emergency.acvs().length }})
              </h3>
              <p class="text-xs text-[#648279]">
                Áreas de estabilización y shock trauma con capacidad de camillas y médicos encargados.
              </p>
            </div>

            <!-- Acciones CRUD ACV -->
            <div class="flex flex-wrap items-center gap-2">
              <button 
                (click)="exportarACVsCSV()"
                class="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1"
              >
                <span>📥 CSV</span>
              </button>
              <button 
                (click)="exportarACVsExcel()"
                class="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1"
              >
                <span>📊 Excel</span>
              </button>
              <label 
                class="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-black text-xs font-black cursor-pointer shadow-xs flex items-center gap-1"
              >
                <span>📤 Importar CSV</span>
                <input type="file" accept=".csv" class="hidden" (change)="importarCSV($event, 'acvs')" />
              </label>
              <button 
                (click)="abrirModalNuevoACV()"
                class="px-3.5 py-1.5 rounded-lg bg-[#07483b] hover:bg-[#0b5948] text-white text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <span>+ Nuevo Puesto ACV</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (acv of emergency.acvs(); track acv.id) {
              <div class="bg-[#f5f4ed] border-2 border-emerald-700/40 rounded-xl p-4 space-y-2 relative shadow-xs">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-mono font-bold text-[#07483b] bg-white px-2 py-0.5 rounded border border-[#d2dfd8]">
                    {{ acv.codigo }}
                  </span>
                  <span class="text-xs text-emerald-800 font-bold bg-emerald-100 px-2 py-0.5 rounded">
                    {{ acv.activo ? 'Operacional' : 'Inactivo' }}
                  </span>
                </div>
                <h4 class="text-sm font-bold text-[#0d2822]">{{ acv.nombre }}</h4>
                <p class="text-xs text-[#405c54]">📍 Ubicación: {{ acv.ubicacion }}</p>
                <p class="text-xs text-[#07483b] font-semibold">👨‍⚕️ Encargado: {{ acv.encargado }}</p>
                <p class="text-xs text-[#648279]">Capacidad: {{ acv.capacidadCamillas }} camillas de observación</p>
                <div class="pt-2 flex justify-end gap-1.5 border-t border-[#d2dfd8]">
                  <button 
                    (click)="editarACV(acv)" 
                    class="px-2.5 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold cursor-pointer inline-flex items-center gap-1"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    <span>Editar</span>
                  </button>
                  <button 
                    (click)="eliminarACV(acv.id)" 
                    class="px-2.5 py-1 rounded bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold cursor-pointer"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- PESTAÑA 4: SECTORES OPERATIVOS -->
      <!-- ======================================================== -->
      @if (tabActiva === 'sectores') {
        <div class="bg-white border border-[#d2dfd8] rounded-xl p-5 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#edece4] pb-3">
            <div>
              <h3 class="text-sm font-bold uppercase tracking-wider text-[#07483b]">
                Sectores Operativos del Recinto
              </h3>
              <p class="text-xs text-[#648279]">Define las zonas del estadio o recinto (Gradas, Escenario, Accesos).</p>
            </div>
            <button 
              (click)="abrirModalNuevoSector()"
              class="px-4 py-2 rounded-lg bg-[#07483b] hover:bg-[#0b5948] text-white text-xs font-bold cursor-pointer"
            >
              + Nuevo Sector
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            @for (sec of emergency.sectores(); track sec.id) {
              <div class="bg-[#f5f4ed] border border-[#d2dfd8] rounded-xl p-4 space-y-2 relative shadow-xs">
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#07483b] font-bold border border-[#d2dfd8]">
                  {{ sec.codigo }}
                </span>
                <h4 class="text-sm font-bold text-[#0d2822] mt-1">{{ sec.nombre }}</h4>
                <p class="text-xs text-[#405c54]">Capacidad recomendada: {{ sec.capacidadPersonal }} paramédicos</p>
                <div class="pt-2 flex justify-end">
                  <button 
                    (click)="eliminarSector(sec.id)"
                    class="text-[11px] text-red-700 hover:text-red-900 font-bold cursor-pointer"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- PESTAÑA 5: SUPER USUARIOS -->
      <!-- ======================================================== -->
      @if (tabActiva === 'superusuarios') {
        <div class="bg-white border border-[#d2dfd8] rounded-xl p-5 shadow-sm space-y-4">
          <div class="border-b border-[#edece4] pb-3">
            <h3 class="text-sm font-bold uppercase tracking-wider text-[#07483b]">
              Los 3 Super Usuarios de Gestión Maestro
            </h3>
            <p class="text-xs text-[#648279]">Cuentas maestras con permisos absolutos de mando y edición en vivo.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            @for (su of emergency.superUsuarios(); track su.id) {
              <div class="bg-[#f5f4ed] border-2 border-[#07483b]/30 rounded-xl p-4 space-y-2 shadow-xs">
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400 text-black font-bold uppercase">
                  {{ su.rol }}
                </span>
                <h4 class="text-sm font-black text-[#0d2822]">{{ su.nombre }}</h4>
                <p class="text-xs font-mono text-[#07483b]">Usuario: {{ su.usuario }}</p>
                <p class="text-xs text-slate-500">Email: {{ su.email }}</p>
                <p class="text-xs text-slate-500">Teléfono: {{ su.telefono }}</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- PESTAÑA 6: CONFIGURACIÓN DEL EVENTO MASIVO -->
      <!-- ======================================================== -->
      @if (tabActiva === 'evento') {
        <div class="bg-white border border-[#d2dfd8] rounded-xl p-5 shadow-sm space-y-4 max-w-2xl">
          <div class="border-b border-[#edece4] pb-3">
            <h3 class="text-sm font-bold uppercase tracking-wider text-[#07483b]">
              Parámetros Generales del Evento Masivo
            </h3>
            <p class="text-xs text-[#648279]">Actualiza los datos del show en vivo para reportes y dashboards.</p>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label class="block font-bold text-[#405c54] mb-1">Nombre Oficial del Evento:</label>
              <input type="text" [(ngModel)]="eventoForm.nombre" class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-lg p-2 text-xs font-bold text-[#0d2822]"/>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-[#405c54] mb-1">Ciudad / Cantón:</label>
                <input type="text" [(ngModel)]="eventoForm.ciudad" class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-lg p-2 text-xs text-[#0d2822]"/>
              </div>
              <div>
                <label class="block font-bold text-[#405c54] mb-1">Lugar / Recinto:</label>
                <input type="text" [(ngModel)]="eventoForm.lugar" class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-lg p-2 text-xs text-[#0d2822]"/>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block font-bold text-[#405c54] mb-1">Fecha:</label>
                <input type="text" [(ngModel)]="eventoForm.fecha" class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-lg p-2 text-xs text-[#0d2822]"/>
              </div>
              <div>
                <label class="block font-bold text-[#405c54] mb-1">Horario:</label>
                <input type="text" [(ngModel)]="eventoForm.horario" class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-lg p-2 text-xs text-[#0d2822]"/>
              </div>
              <div>
                <label class="block font-bold text-[#405c54] mb-1">Aforo Estimado:</label>
                <input type="number" [(ngModel)]="eventoForm.aforoEstimado" class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-lg p-2 text-xs text-[#0d2822]"/>
              </div>
            </div>

            <div class="pt-2">
              <button 
                (click)="guardarCambiosEvento()"
                class="px-5 py-2.5 rounded-lg bg-[#07483b] hover:bg-[#0b5948] text-white text-xs font-black cursor-pointer shadow-sm"
              >
                Guardar Parámetros del Evento
              </button>
            </div>
          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- PESTAÑA 7: CÓDIGO QR Y ACCESO MÓVIL (100% NUBE) -->
      <!-- ======================================================== -->
      @if (tabActiva === 'red') {
        <div class="space-y-4">
          <div class="bg-white border border-[#d2dfd8] rounded-xl p-5 shadow-sm space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#edece4] pb-3">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold uppercase">
                    100% Server-Side • Nube Activa
                  </span>
                  <span class="text-xs text-[#648279] font-mono">Vercel Edge + Oracle Cloud</span>
                </div>
                <h3 class="text-base font-black text-[#07483b] flex items-center gap-2">
                  <span>📲 Acceso Móvil Oficial & Código QR para Paramédicos</span>
                </h3>
                <p class="text-xs text-[#405c54] mt-0.5">
                  El sistema opera 100% en la nube con HTTPS permanente. Cualquier paramédico puede escanear este código con su celular para ingresar al instante.
                </p>
              </div>

              <div class="flex items-center gap-2">
                <button 
                  (click)="abrirModalRed()"
                  class="px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition-all hover:scale-105"
                  title="Abrir ventana grande para mostrar o proyectar"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <span>Pantalla Gigante QR</span>
                </button>
              </div>
            </div>

            <!-- Resumen de Infraestructura en la Nube -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="p-3.5 rounded-xl border bg-emerald-50 border-emerald-300 text-emerald-950">
                <span class="text-[10px] font-mono uppercase font-bold text-emerald-800 block">Servidor Central Nube</span>
                <div class="flex items-center gap-2 mt-1">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <div>
                    <h4 class="text-xs font-black">ONLINE (Oracle Cloud)</h4>
                    <p class="text-[11px] opacity-80">DuckDB 1.5 + SQLite WAL activo</p>
                  </div>
                </div>
              </div>

              <div class="p-3.5 rounded-xl border bg-sky-50 border-sky-300 text-sky-950">
                <span class="text-[10px] font-mono uppercase font-bold text-sky-800 block">Cifrado & Dominio</span>
                <div class="flex items-center gap-2 mt-1">
                  <span class="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                  <div>
                    <h4 class="text-xs font-black">HTTPS Permanente 🔒</h4>
                    <p class="text-[11px] opacity-80">Cero bloqueos en Android y iPhone</p>
                  </div>
                </div>
              </div>

              <div class="p-3.5 rounded-xl border bg-amber-50 border-amber-300 text-amber-950">
                <span class="text-[10px] font-mono uppercase font-bold text-amber-800 block">Red de Campo</span>
                <div class="flex items-center gap-2 mt-1">
                  <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <div>
                    <h4 class="text-xs font-black">Datos 4G / 5G / Wi-Fi</h4>
                    <p class="text-[11px] opacity-80">Sin necesidad de router físico local</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tarjeta Central de Código QR Oficial -->
            <div class="p-5 rounded-xl bg-slate-900 text-white shadow-md">
              <div class="flex flex-col sm:flex-row items-center gap-6">
                <div class="p-2.5 bg-white rounded-2xl shadow-xl border-4 border-amber-400 flex-shrink-0">
                  <img 
                    [src]="network.qrOficial" 
                    alt="Código QR Oficial"
                    class="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                  />
                </div>

                <div class="flex-1 space-y-3 text-xs text-center sm:text-left">
                  <div>
                    <span class="text-amber-300 font-mono uppercase font-bold text-[11px] block">
                      Enlace Web Oficial para Brigadistas:
                    </span>
                    <div class="mt-1 flex items-center gap-2 p-2 rounded-lg bg-black/60 border border-slate-700">
                      <input 
                        type="text" 
                        readonly 
                        [value]="network.urlOficial"
                        class="bg-transparent text-emerald-300 font-mono text-xs font-bold w-full focus:outline-none"
                      />
                      <button 
                        (click)="copiarUrlAdmin(network.urlOficial)"
                        class="px-3 py-1.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-black cursor-pointer text-xs flex-shrink-0 transition-all active:scale-95"
                      >
                        Copiar Enlace
                      </button>
                    </div>

                    @if (network.copiadoMensaje()) {
                      <p class="text-xs text-emerald-400 font-bold mt-1 animate-pulse">
                        ✓ {{ network.copiadoMensaje() }}
                      </p>
                    }
                  </div>

                  <div class="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300 text-[11px] leading-relaxed space-y-1">
                    <p class="font-bold text-white">📱 ¿Cómo se conectan los brigadistas en el evento?</p>
                    <p>1. Abren la cámara de su celular y apuntan directamente a este código QR.</p>
                    <p>2. O puedes copiar el enlace y enviárselo directamente al grupo de WhatsApp del evento.</p>
                    <p>3. La ficha médica se abre al instante con soporte offline y guardado en la nube.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      }

      <!-- ======================================================== -->
      <!-- PESTAÑA 8: PERSISTENCIA POLÍGLOTA TRI-MOTOR (REDIS + DUCKDB + SQLITE) -->
      <!-- ======================================================== -->
      @if (tabActiva === 'poliglota') {
        <div class="space-y-4">
          <div class="bg-white border border-[#d2dfd8] rounded-xl p-5 shadow-sm space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#edece4] pb-3">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-100 text-purple-900 border border-purple-300 font-bold uppercase">
                    Persistencia Políglota Tri-Motor
                  </span>
                  <span class="text-xs text-[#648279] font-mono">SQLite WAL + DuckDB 1.5 + Redis 7 NoSQL</span>
                </div>
                <h3 class="text-base font-black text-[#07483b] flex items-center gap-2">
                  <span>⚡ Motores de Almacenamiento, Analítica y Alertas en Tiempo Real</span>
                </h3>
                <p class="text-xs text-[#405c54] mt-0.5">
                  Arquitectura híbrida optimizada para eventos masivos: transacciones concurrentes seguras, reportes OLAP y alertas críticas instantáneas en memoria.
                </p>
              </div>
              <button 
                (click)="db.probarSimulacroAlerta()"
                class="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap hover:scale-105"
                title="Disparar alarma sonora y alerta visual de simulacro en tiempo real vía Redis"
              >
                <span>🚨 Probar Alarma Sonora (Redis)</span>
              </button>
            </div>

            <!-- Grilla de los 3 Motores -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Motor 1: Redis NoSQL -->
              <div class="p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">⚡</span>
                    <div>
                      <h4 class="text-sm font-bold text-red-900">Redis 7 (NoSQL In-Memory)</h4>
                      <p class="text-[11px] text-red-700">Pub/Sub & Microsecond Cache</p>
                    </div>
                  </div>
                  <span class="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase"
                        [ngClass]="db.redisOnline() ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-red-100 text-red-800 border border-red-300'">
                    {{ db.redisOnline() ? 'ONLINE' : 'OFFLINE' }}
                  </span>
                </div>
                <p class="text-xs text-red-950/80 leading-relaxed">
                  Emite alertas críticas en &lt;1ms cuando un paramédico registra un código <strong>ROJO</strong> o <strong>AMARILLO</strong>, activando la alarma sonora del puesto de mando sin recargar la página.
                </p>
                <div class="text-[11px] font-mono text-red-900/90 bg-white/80 p-2 rounded border border-red-200 space-y-1">
                  <div>Memoria: <strong>{{ db.redisDetalle()?.memoria_usada || '1.45M' }}</strong></div>
                  <div>Canales: <strong>sepam:alertas</strong></div>
                  <div>Versión: <strong>{{ db.redisDetalle()?.version || '7.0' }}</strong></div>
                </div>
              </div>

              <!-- Motor 2: DuckDB 1.5 OLAP -->
              <div class="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">🦆</span>
                    <div>
                      <h4 class="text-sm font-bold text-amber-900">DuckDB 1.5 (OLAP Columnar)</h4>
                      <p class="text-[11px] text-amber-700">Analítica Vectorizada & Excel</p>
                    </div>
                  </div>
                  <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                    ONLINE
                  </span>
                </div>
                <p class="text-xs text-amber-950/80 leading-relaxed">
                  Calcula cubos analíticos, curvas horarias por sector y genera informes ejecutivos profesionales en <strong>Excel (.xlsx)</strong> y <strong>CSV</strong> listos para auditorías institucionales.
                </p>
                <div class="flex gap-2 pt-1">
                  <button (click)="db.descargarExcel()" class="flex-1 py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition-all cursor-pointer">
                    📥 Bajar Excel
                  </button>
                  <button (click)="db.descargarCSV()" class="py-1.5 px-2 bg-slate-700 hover:bg-slate-800 text-white rounded text-xs font-bold transition-all cursor-pointer">
                    CSV
                  </button>
                </div>
              </div>

              <!-- Motor 3: SQLite 3 WAL -->
              <div class="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">💾</span>
                    <div>
                      <h4 class="text-sm font-bold text-emerald-900">SQLite 3 (WAL Mode)</h4>
                      <p class="text-[11px] text-emerald-700">OLTP Transaccional ACID</p>
                    </div>
                  </div>
                  <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                    ONLINE
                  </span>
                </div>
                <p class="text-xs text-emerald-950/80 leading-relaxed">
                  Almacén maestro en disco con <em>Write-Ahead Logging</em>. Garantiza cero colisiones ni bloqueos cuando decenas de paramédicos envían triajes simultáneamente desde sus móviles.
                </p>
                <div class="text-[11px] font-mono text-emerald-900/90 bg-white/80 p-2 rounded border border-emerald-200 space-y-1">
                  <div>Modo: <strong>PRAGMA journal_mode = WAL</strong></div>
                  <div>Sincronía: <strong>NORMAL (Baja I/O)</strong></div>
                  <div>Persistencia: <strong>Inmutable en Disco</strong></div>
                </div>
              </div>
            </div>

            <!-- Registro de Alertas Recientes en Memoria NoSQL -->
            <div class="border border-[#d2dfd8] rounded-xl p-4 bg-[#f8faf9] space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-[#0d2822] flex items-center gap-2">
                <span>🔔 Registro en Memoria NoSQL de Alertas Recientes (Redis List)</span>
                <span class="text-[10px] bg-red-100 text-red-800 font-mono px-2 py-0.5 rounded-full">
                  {{ db.alertasRecientes().length }} en memoria
                </span>
              </h4>

              @if (db.alertasRecientes().length === 0) {
                <p class="text-xs text-[#648279] italic py-3 text-center">
                  No hay alertas críticas recientes registradas en memoria. Usa el botón "Probar Alarma Sonora" para realizar un simulacro.
                </p>
              } @else {
                <div class="space-y-2 max-h-60 overflow-y-auto">
                  @for (alerta of db.alertasRecientes(); track alerta.id) {
                    <div class="p-2.5 rounded-lg border flex items-center justify-between text-xs transition-all"
                         [ngClass]="alerta.triage_color === 'ROJO' ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-300'">
                      <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 rounded text-[10px] font-black text-white"
                              [ngClass]="alerta.triage_color === 'ROJO' ? 'bg-red-600' : 'bg-amber-500'">
                          {{ alerta.triage_color }}
                        </span>
                        <div>
                          <span class="font-bold text-slate-900">{{ alerta.sector_nombre }}</span>
                          <span class="text-slate-600 ml-1.5">• {{ alerta.motivo }}</span>
                          <span class="text-[10px] text-slate-500 ml-1 font-mono">({{ alerta.paciente_nombre }})</span>
                        </div>
                      </div>
                      <span class="text-[10px] font-mono text-slate-500">{{ alerta.hora }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
      }

    </div>

    <!-- MODAL PARA CREAR / EDITAR PARAMÉDICO -->
    @if (mostrarModalParamedico) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white border-2 border-[#07483b] rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl text-[#0d2822]">
          <div class="p-4 bg-[#07483b] text-white flex items-center justify-between">
            <h3 class="text-sm font-black">{{ paramForm.id ? 'Editar Paramédico' : 'Registrar Nuevo Paramédico' }}</h3>
            <button (click)="mostrarModalParamedico = false" class="text-emerald-100 hover:text-white cursor-pointer">✕</button>
          </div>
          <div class="p-5 space-y-3 text-xs bg-[#f5f4ed]">
            <div>
              <label class="block font-bold text-[#405c54] mb-1">Nombre Completo:</label>
              <input type="text" [(ngModel)]="paramForm.nombre" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold"/>
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-bold text-[#405c54] mb-1">Usuario:</label>
                <input type="text" [(ngModel)]="paramForm.usuario" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-mono"/>
              </div>
              <div>
                <label class="block font-bold text-[#405c54] mb-1">Clave Temporal:</label>
                <input type="text" [(ngModel)]="paramForm.passwordTemporal" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-mono"/>
              </div>
            </div>
            <div>
              <label class="block font-bold text-[#405c54] mb-1">Rol Operativo:</label>
              <select [(ngModel)]="paramForm.rol" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold">
                <option value="PARAMEDICO_CAMPO">Paramédico de Campo</option>
                <option value="PARAMEDICO_ACV">Paramédico ACV / Triage</option>
                <option value="PARAMEDICO_AMBULANCIA">Paramédico de Ambulancia</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-[#405c54] mb-1">Sector Asignado:</label>
              <select [(ngModel)]="paramForm.sectorActualId" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold">
                @for (sec of emergency.sectores(); track sec.id) {
                  <option [value]="sec.id">{{ sec.codigo }} - {{ sec.nombre }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block font-bold text-[#405c54] mb-1">Teléfono:</label>
              <input type="text" [(ngModel)]="paramForm.telefono" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-mono"/>
            </div>
          </div>
          <div class="p-3 bg-white border-t border-[#d2dfd8] flex justify-end gap-2">
            <button (click)="mostrarModalParamedico = false" class="px-4 py-2 rounded-lg bg-[#edece4] text-xs font-bold text-[#405c54]">Cancelar</button>
            <button (click)="guardarParamedico()" class="px-4 py-2 rounded-lg bg-[#07483b] text-white text-xs font-bold">Guardar</button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL PARA CREAR / EDITAR AMBULANCIA -->
    @if (mostrarModalAmbulancia) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white border-2 border-[#07483b] rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl text-[#0d2822]">
          <div class="p-4 bg-[#07483b] text-white flex items-center justify-between">
            <h3 class="text-sm font-black">{{ ambForm.id ? 'Editar Ambulancia' : 'Registrar Nueva Ambulancia' }}</h3>
            <button (click)="mostrarModalAmbulancia = false" class="text-emerald-100 hover:text-white cursor-pointer">✕</button>
          </div>
          <div class="p-5 space-y-3 text-xs bg-[#f5f4ed]">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-bold text-[#405c54] mb-1">Código (Ej: ALFA-01):</label>
                <input type="text" [(ngModel)]="ambForm.codigo" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold font-mono"/>
              </div>
              <div>
                <label class="block font-bold text-[#405c54] mb-1">Placa Vehicular:</label>
                <input type="text" [(ngModel)]="ambForm.placa" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold font-mono"/>
              </div>
            </div>
            <div>
              <label class="block font-bold text-[#405c54] mb-1">Tipo de Unidad:</label>
              <select [(ngModel)]="ambForm.tipo" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold">
                <option value="Soporte Vital Avanzado">Soporte Vital Avanzado (Medicalizada)</option>
                <option value="Soporte Vital Básico">Soporte Vital Básico</option>
              </select>
            </div>
            <div>
              <label class="block font-bold text-[#405c54] mb-1">Paramédico Responsable:</label>
              <input type="text" [(ngModel)]="ambForm.paramedicoResponsable" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold"/>
            </div>
            <div>
              <label class="block font-bold text-[#405c54] mb-1">Conductor Asignado:</label>
              <input type="text" [(ngModel)]="ambForm.conductor" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white"/>
            </div>
            <div>
              <label class="block font-bold text-[#405c54] mb-1">Estado Operativo:</label>
              <select [(ngModel)]="ambForm.estado" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold">
                <option value="DISPONIBLE">DISPONIBLE</option>
                <option value="EN_TRASLADO">EN_TRASLADO</option>
                <option value="EN_SITIO">EN_SITIO</option>
                <option value="EN_HOSPITAL">EN_HOSPITAL</option>
              </select>
            </div>
          </div>
          <div class="p-3 bg-white border-t border-[#d2dfd8] flex justify-end gap-2">
            <button (click)="mostrarModalAmbulancia = false" class="px-4 py-2 rounded-lg bg-[#edece4] text-xs font-bold text-[#405c54]">Cancelar</button>
            <button (click)="guardarAmbulancia()" class="px-4 py-2 rounded-lg bg-[#07483b] text-white text-xs font-bold">Guardar</button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL PARA CREAR / EDITAR PUESTO ACV -->
    @if (mostrarModalACV) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div class="bg-white border-2 border-[#07483b] rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl text-[#0d2822]">
          <div class="p-4 bg-[#07483b] text-white flex items-center justify-between">
            <h3 class="text-sm font-black">{{ acvForm.id ? 'Editar Puesto ACV' : 'Registrar Nuevo Puesto ACV' }}</h3>
            <button (click)="mostrarModalACV = false" class="text-emerald-100 hover:text-white cursor-pointer">✕</button>
          </div>
          <div class="p-5 space-y-3 text-xs bg-[#f5f4ed]">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block font-bold text-[#405c54] mb-1">Código (Ej: ACV-1):</label>
                <input type="text" [(ngModel)]="acvForm.codigo" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold font-mono"/>
              </div>
              <div>
                <label class="block font-bold text-[#405c54] mb-1">Capacidad Camillas:</label>
                <input type="number" min="1" max="50" [(ngModel)]="acvForm.capacidadCamillas" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold font-mono"/>
              </div>
            </div>
            <div>
              <label class="block font-bold text-[#405c54] mb-1">Nombre Completo del ACV / PMA:</label>
              <input type="text" [(ngModel)]="acvForm.nombre" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold"/>
            </div>
            <div>
              <label class="block font-bold text-[#405c54] mb-1">Ubicación Física en el Recinto:</label>
              <input type="text" [(ngModel)]="acvForm.ubicacion" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white"/>
            </div>
            <div>
              <label class="block font-bold text-[#405c54] mb-1">Médico / Responsable Encargado:</label>
              <input type="text" [(ngModel)]="acvForm.encargado" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold"/>
            </div>
          </div>
          <div class="p-3 bg-white border-t border-[#d2dfd8] flex justify-end gap-2">
            <button (click)="mostrarModalACV = false" class="px-4 py-2 rounded-lg bg-[#edece4] text-xs font-bold text-[#405c54]">Cancelar</button>
            <button (click)="guardarACV()" class="px-4 py-2 rounded-lg bg-[#07483b] text-white text-xs font-bold">Guardar</button>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminPanelComponent {
  emergency = inject(EmergencyService);
  db = inject(DatabaseService);
  network = inject(NetworkService);

  tabActiva: 'paramedicos' | 'superusuarios' | 'sectores' | 'acvs' | 'ambulancias' | 'evento' | 'red' | 'poliglota' = 'paramedicos';
  pestanaQRAdmin: 'local' | 'nube' = 'local';

  mostrarModalParamedico = false;
  mostrarModalAmbulancia = false;
  mostrarModalACV = false;

  eventoForm = { ...this.emergency.evento() };

  abrirModalRed() {
    window.dispatchEvent(new CustomEvent('abrir-modal-red'));
  }

  copiarUrlAdmin(url: string) {
    this.network.copiarTexto(url, 'Enlace copiado');
  }

  // Formulario Paramédico
  paramForm: {
    id?: string;
    nombre: string;
    usuario: string;
    passwordTemporal: string;
    rol: 'PARAMEDICO_CAMPO' | 'PARAMEDICO_ACV' | 'PARAMEDICO_AMBULANCIA';
    sectorActualId: string;
    telefono: string;
  } = {
    nombre: '',
    usuario: '',
    passwordTemporal: '',
    rol: 'PARAMEDICO_CAMPO',
    sectorActualId: this.emergency.sectores()[0]?.id || 'sec-a',
    telefono: ''
  };

  // Formulario Ambulancia
  ambForm: {
    id?: string;
    codigo: string;
    placa: string;
    tipo: 'Soporte Vital Avanzado' | 'Soporte Vital Básico';
    paramedicoResponsable: string;
    conductor: string;
    estado: 'DISPONIBLE' | 'EN_TRASLADO' | 'EN_SITIO' | 'EN_HOSPITAL';
  } = {
    codigo: '',
    placa: '',
    tipo: 'Soporte Vital Básico',
    paramedicoResponsable: '',
    conductor: '',
    estado: 'DISPONIBLE'
  };

  // Formulario ACV
  acvForm: {
    id?: string;
    codigo: string;
    nombre: string;
    ubicacion: string;
    encargado: string;
    capacidadCamillas: number;
  } = {
    codigo: '',
    nombre: '',
    ubicacion: '',
    encargado: '',
    capacidadCamillas: 6
  };

  // ==========================================
  // MÉTODOS CRUD: PARAMÉDICOS / EMPLEADOS
  // ==========================================
  abrirModalNuevoParamedico() {
    const num = this.emergency.personal().length + 1;
    this.paramForm = {
      nombre: '',
      usuario: `param${num.toString().padStart(2, '0')}`,
      passwordTemporal: `sepam${num.toString().padStart(2, '0')}*`,
      rol: 'PARAMEDICO_CAMPO',
      sectorActualId: this.emergency.sectores()[0]?.id || 'sec-a',
      telefono: '0990000000'
    };
    this.mostrarModalParamedico = true;
  }

  editarParamedico(p: Paramedico) {
    this.paramForm = {
      id: p.id,
      nombre: p.nombre,
      usuario: p.usuario,
      passwordTemporal: p.passwordTemporal,
      rol: p.rol,
      sectorActualId: p.sectorActualId,
      telefono: p.telefono
    };
    this.mostrarModalParamedico = true;
  }

  guardarParamedico() {
    const sec = this.emergency.sectores().find(s => s.id === this.paramForm.sectorActualId);
    if (this.paramForm.id) {
      this.emergency.editarParamedico(this.paramForm.id, {
        nombre: this.paramForm.nombre,
        usuario: this.paramForm.usuario,
        passwordTemporal: this.paramForm.passwordTemporal,
        rol: this.paramForm.rol,
        sectorActualId: this.paramForm.sectorActualId,
        sectorNombre: sec?.nombre || 'General',
        telefono: this.paramForm.telefono
      });
    } else {
      this.emergency.agregarParamedico({
        nombre: this.paramForm.nombre,
        usuario: this.paramForm.usuario,
        passwordTemporal: this.paramForm.passwordTemporal,
        rol: this.paramForm.rol,
        sectorActualId: this.paramForm.sectorActualId,
        sectorNombre: sec?.nombre || 'General',
        estado: 'DISPONIBLE',
        telefono: this.paramForm.telefono,
        activo: true
      });
    }
    this.mostrarModalParamedico = false;
  }

  eliminarParamedico(id: string) {
    if (confirm('¿Seguro que deseas eliminar este paramédico del sistema?')) {
      this.emergency.eliminarParamedico(id);
    }
  }

  // ==========================================
  // MÉTODOS CRUD: AMBULANCIAS
  // ==========================================
  abrirModalNuevaAmbulancia() {
    const num = this.emergency.ambulancias().length + 1;
    this.ambForm = {
      codigo: `ALFA-${num.toString().padStart(2, '0')}`,
      placa: 'PBA-0000',
      tipo: 'Soporte Vital Básico',
      paramedicoResponsable: 'Paramédico Responsable',
      conductor: 'Conductor',
      estado: 'DISPONIBLE'
    };
    this.mostrarModalAmbulancia = true;
  }

  editarAmbulancia(amb: Ambulancia) {
    this.ambForm = {
      id: amb.id,
      codigo: amb.codigo,
      placa: amb.placa,
      tipo: amb.tipo,
      paramedicoResponsable: amb.paramedicoResponsable,
      conductor: amb.conductor || '',
      estado: amb.estado
    };
    this.mostrarModalAmbulancia = true;
  }

  guardarAmbulancia() {
    if (this.ambForm.id) {
      this.emergency.editarAmbulancia(this.ambForm.id, {
        codigo: this.ambForm.codigo,
        placa: this.ambForm.placa,
        tipo: this.ambForm.tipo,
        paramedicoResponsable: this.ambForm.paramedicoResponsable,
        conductor: this.ambForm.conductor,
        estado: this.ambForm.estado
      });
    } else {
      this.emergency.agregarAmbulancia({
        codigo: this.ambForm.codigo,
        placa: this.ambForm.placa,
        tipo: this.ambForm.tipo,
        paramedicoResponsable: this.ambForm.paramedicoResponsable,
        conductor: this.ambForm.conductor,
        estado: this.ambForm.estado,
        activo: true
      });
    }
    this.mostrarModalAmbulancia = false;
  }

  eliminarAmbulancia(id: string) {
    if (confirm('¿Eliminar esta ambulancia del sistema?')) {
      this.emergency.eliminarAmbulancia(id);
    }
  }

  // ==========================================
  // MÉTODOS CRUD: PUESTOS ACV
  // ==========================================
  abrirModalNuevoACV() {
    const num = this.emergency.acvs().length + 1;
    this.acvForm = {
      codigo: `ACV-${num}`,
      nombre: `ACV ${num} - PUESTO MÉDICO`,
      ubicacion: 'Zona Designada',
      encargado: 'Dr. Encargado',
      capacidadCamillas: 6
    };
    this.mostrarModalACV = true;
  }

  editarACV(acv: ACV) {
    this.acvForm = {
      id: acv.id,
      codigo: acv.codigo,
      nombre: acv.nombre,
      ubicacion: acv.ubicacion,
      encargado: acv.encargado,
      capacidadCamillas: acv.capacidadCamillas
    };
    this.mostrarModalACV = true;
  }

  guardarACV() {
    if (this.acvForm.id) {
      this.emergency.editarACV(this.acvForm.id, {
        codigo: this.acvForm.codigo,
        nombre: this.acvForm.nombre,
        ubicacion: this.acvForm.ubicacion,
        encargado: this.acvForm.encargado,
        capacidadCamillas: this.acvForm.capacidadCamillas
      });
    } else {
      this.emergency.agregarACV({
        codigo: this.acvForm.codigo,
        nombre: this.acvForm.nombre,
        ubicacion: this.acvForm.ubicacion,
        encargado: this.acvForm.encargado,
        capacidadCamillas: this.acvForm.capacidadCamillas,
        activo: true
      });
    }
    this.mostrarModalACV = false;
  }

  eliminarACV(id: string) {
    if (confirm('¿Eliminar este puesto ACV?')) {
      this.emergency.eliminarACV(id);
    }
  }

  // ==========================================
  // SECTORES Y EVENTO
  // ==========================================
  abrirModalNuevoSector() {
    const nom = prompt('Nombre del nuevo sector (Ej. ZONA E - PALCOS VIP):');
    if (nom) {
      const cod = prompt('Código corto (Ej. ZONA E):') || 'ZONA E';
      this.emergency.agregarSector({
        codigo: cod,
        nombre: nom,
        capacidadPersonal: 4
      });
    }
  }

  eliminarSector(id: string) {
    if (confirm('¿Eliminar este sector?')) {
      this.emergency.eliminarSector(id);
    }
  }

  guardarCambiosEvento() {
    this.emergency.actualizarEvento(this.eventoForm);
  }

  // ==========================================
  // EXPORTACIÓN A CSV Y EXCEL
  // ==========================================
  private descargarTexto(contenido: string, nombreArchivo: string) {
    const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  exportarParamedicosCSV() {
    const headers = 'ID,Nombre,Usuario,ClaveTemporal,Rol,Sector,Telefono,Estado\n';
    const rows = this.emergency.personal().map(p => 
      `"${p.id}","${p.nombre}","${p.usuario}","${p.passwordTemporal}","${p.rol}","${p.sectorNombre}","${p.telefono}","${p.estado}"`
    ).join('\n');
    this.descargarTexto(headers + rows, `sepam_paramedicos_${Date.now()}.csv`);
  }

  exportarParamedicosExcel() {
    this.exportarParamedicosCSV(); // Archivo compatible nativamente con Excel con UTF-8 BOM
  }

  exportarAmbulanciasCSV() {
    const headers = 'ID,Codigo,Placa,Tipo,Responsable,Conductor,Estado\n';
    const rows = this.emergency.ambulancias().map(a => 
      `"${a.id}","${a.codigo}","${a.placa}","${a.tipo}","${a.paramedicoResponsable}","${a.conductor || ''}","${a.estado}"`
    ).join('\n');
    this.descargarTexto(headers + rows, `sepam_ambulancias_${Date.now()}.csv`);
  }

  exportarAmbulanciasExcel() {
    this.exportarAmbulanciasCSV();
  }

  exportarACVsCSV() {
    const headers = 'ID,Codigo,Nombre,Ubicacion,Encargado,CapacidadCamillas,Activo\n';
    const rows = this.emergency.acvs().map(a => 
      `"${a.id}","${a.codigo}","${a.nombre}","${a.ubicacion}","${a.encargado}","${a.capacidadCamillas}","${a.activo}"`
    ).join('\n');
    this.descargarTexto(headers + rows, `sepam_puestos_acv_${Date.now()}.csv`);
  }

  exportarACVsExcel() {
    this.exportarACVsCSV();
  }

  // ==========================================
  // IMPORTACIÓN EN LOTE DESDE CSV
  // ==========================================
  importarCSV(event: Event, tipo: 'paramedicos' | 'ambulancias' | 'acvs') {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
      if (lines.length <= 1) {
        alert('El archivo CSV está vacío o solo contiene cabeceras.');
        return;
      }

      // Descartar cabecera
      const dataLines = lines.slice(1);

      if (tipo === 'paramedicos') {
        const nuevos: Paramedico[] = [];
        dataLines.forEach((l, idx) => {
          const parts = l.split(',').map(s => s.replace(/^"|"$/g, '').trim());
          if (parts.length >= 2) {
            const num = this.emergency.personal().length + idx + 1;
            nuevos.push({
              id: `param-${num}`,
              nombre: parts[1] || parts[0],
              usuario: parts[2] || `param${num.toString().padStart(2, '0')}`,
              passwordTemporal: parts[3] || `sepam${num.toString().padStart(2, '0')}*`,
              rol: (parts[4] as any) || 'PARAMEDICO_CAMPO',
              sectorActualId: 'sec-a',
              sectorNombre: parts[5] || 'ZONA A - GRADAS',
              telefono: parts[6] || '0990000000',
              estado: 'DISPONIBLE',
              activo: true
            });
          }
        });
        if (nuevos.length > 0) {
          this.emergency.importarParamedicos(nuevos);
        }
      }

      if (tipo === 'ambulancias') {
        const nuevas: Ambulancia[] = [];
        dataLines.forEach((l, idx) => {
          const parts = l.split(',').map(s => s.replace(/^"|"$/g, '').trim());
          if (parts.length >= 2) {
            const num = this.emergency.ambulancias().length + idx + 1;
            nuevas.push({
              id: `amb-${num}`,
              codigo: parts[1] || `ALFA-${num.toString().padStart(2, '0')}`,
              placa: parts[2] || 'PBA-0000',
              tipo: (parts[3] as any) || 'Soporte Vital Básico',
              paramedicoResponsable: parts[4] || 'Paramédico Responsable',
              conductor: parts[5] || 'Conductor',
              estado: 'DISPONIBLE',
              activo: true
            });
          }
        });
        if (nuevas.length > 0) {
          this.emergency.importarAmbulancias(nuevas);
        }
      }

      if (tipo === 'acvs') {
        const nuevosACVs: ACV[] = [];
        dataLines.forEach((l, idx) => {
          const parts = l.split(',').map(s => s.replace(/^"|"$/g, '').trim());
          if (parts.length >= 2) {
            const num = this.emergency.acvs().length + idx + 1;
            nuevosACVs.push({
              id: `acv-${num}`,
              codigo: parts[1] || `ACV-${num}`,
              nombre: parts[2] || `ACV ${num} - PUESTO MÉDICO`,
              ubicacion: parts[3] || 'Zona General',
              encargado: parts[4] || 'Médico Responsable',
              capacidadCamillas: parseInt(parts[5] || '6', 10),
              activo: true
            });
          }
        });
        if (nuevosACVs.length > 0) {
          this.emergency.importarACVs(nuevosACVs);
        }
      }

      // Limpiar input file
      input.value = '';
    };

    reader.readAsText(file, 'utf-8');
  }
}
