import { Component, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmergencyService } from '../../services/emergency.service';
import { CustomizerService, CustomWidget, DynamicKpi } from '../../services/customizer.service';
import { Atencion, Sector } from '../../models/emergency.model';
import { QuickEditModalComponent } from '../quick-edit-modal/quick-edit-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, QuickEditModalComponent],
  template: `
    <div class="space-y-6 transition-colors duration-300">
      
      <!-- Banner Principal del Evento (Personalizable en Tiempo Real) -->
      @if (customizer.config().visibilidad.bannerEvento) {
        <div 
          class="rounded-xl p-5 shadow-sm border relative overflow-hidden transition-all duration-300"
          [style.backgroundColor]="customizer.config().tema.colorHeader"
          [style.borderColor]="customizer.config().tema.colorBorde"
          [style.color]="customizer.config().tema.colorHeaderTexto"
        >
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs font-mono font-bold px-2 py-0.5 rounded bg-black/25 text-amber-300 border border-white/20">
                  OPERATIVO ACTIVO
                </span>
                <span class="text-xs font-mono opacity-80">
                  RIESGO {{ customizer.config().textos.nivelRiesgo | uppercase }}
                </span>
              </div>
              
              <div class="flex items-center gap-3">
                <h1 class="text-xl md:text-3xl font-black tracking-tight uppercase">
                  {{ customizer.config().textos.nombreEvento }}
                </h1>

                <!-- LÁPIZ DE EDICIÓN DEL EVENTO CON SVG NÍTIDO (Solo visible para Super Usuarios) -->
                @if (emergency.esSuperUsuario()) {
                  <button 
                    (click)="editarEvento()"
                    class="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5 transition-all hover:scale-105 border border-amber-500"
                    title="Editar Nombre, Ciudad, Lugar, Horario y Aforo del Evento"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span>Editar Evento</span>
                  </button>
                }
              </div>

              <div class="flex flex-wrap items-center gap-4 text-xs opacity-90 mt-2 font-mono">
                <div class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span>{{ customizer.config().textos.ciudadSede }} — {{ customizer.config().textos.lugarRecinto }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <span>{{ customizer.config().textos.fechaHorario }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <span>Aforo: {{ customizer.config().textos.aforoTexto }}</span>
                </div>
              </div>
            </div>

            <!-- Botones de Acción de Mando -->
            <div class="flex items-center gap-2">
              <button 
                (click)="abrirReporte()"
                class="px-3.5 py-2.5 rounded-lg text-white text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm border border-white/20"
                [style.backgroundColor]="customizer.config().tema.colorPrimario"
                [title]="emergency.esSuperUsuario() ? 'Generar Reporte Oficial del Evento' : 'Ver Reporte de Atenciones (Solo Lectura)'"
              >
                <svg class="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span>{{ emergency.esSuperUsuario() ? 'Generar Reporte' : 'Ver Reporte' }}</span>
              </button>

              @if (emergency.esSuperUsuario()) {
                <button 
                  (click)="simularAlerta()"
                  class="px-3.5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                  title="Emitir Alerta General a todos los sectores"
                >
                  <svg class="w-4 h-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                  <span>Alerta General</span>
                </button>
              }
            </div>
          </div>
        </div>
      }

      <!-- BARRA DE FILTRADO CRUZADO ACTIVO (Cross-Filtering estilo Power BI) -->
      @if (filtroSectorActivo() || filtroTriageActivo()) {
        <div class="p-3 px-4 rounded-xl bg-amber-500/15 border-2 border-amber-500/50 flex flex-wrap items-center justify-between gap-2 shadow-sm animate-fadeIn">
          <div class="flex items-center gap-2 flex-wrap text-xs">
            <span class="font-black text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
              <svg class="w-4 h-4 text-amber-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Filtrado Cruzado Activo (Power BI):</span>
            </span>

            @if (filtroSectorActivo()) {
              <span class="px-2.5 py-1 rounded-full bg-amber-400 text-slate-900 font-bold flex items-center gap-1.5 shadow-xs">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Sector: {{ filtroSectorActivo() }}</span>
                <button (click)="limpiarFiltroSector()" class="hover:text-red-700 font-black cursor-pointer text-sm ml-0.5" title="Quitar filtro de sector">✕</button>
              </span>
            }

            @if (filtroTriageActivo()) {
              <span 
                class="px-2.5 py-1 rounded-full text-white font-bold flex items-center gap-1.5 shadow-xs"
                [ngClass]="{
                  'bg-red-600': filtroTriageActivo() === 'ROJO',
                  'bg-amber-500 text-black': filtroTriageActivo() === 'AMARILLO',
                  'bg-emerald-600': filtroTriageActivo() === 'VERDE',
                  'bg-slate-800': filtroTriageActivo() === 'NEGRO'
                }"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span>Triage: {{ filtroTriageActivo() }}</span>
                <button (click)="limpiarFiltroTriage()" class="hover:opacity-75 font-black cursor-pointer text-sm ml-0.5" title="Quitar filtro de triage">✕</button>
              </span>
            }
          </div>

          <button 
            (click)="limpiarTodosFiltros()"
            class="text-xs font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
          >
            Restablecer Vista Completa
          </button>
        </div>
      }

      <!-- TARJETAS KPI DINÁMICAS (Editables, ampliables y eliminables por el Super Usuario) -->
      @if (customizer.config().visibilidad.tarjetasKPI) {
        <div class="space-y-3">
          
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold tracking-wider uppercase flex items-center gap-1.5" [style.color]="customizer.config().tema.colorPrimario">
              <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Indicadores Clave de Desempeño (KPIs Dinámicos)</span>
            </h3>

            <!-- Botón Agregar Nuevo KPI (Solo Super Usuario) -->
            @if (emergency.esSuperUsuario()) {
              <button 
                (click)="abrirNuevoKpi()"
                class="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 border border-amber-500 text-xs font-black cursor-pointer shadow-xs flex items-center gap-1.5 transition-all hover:scale-105"
                title="Añadir una nueva tarjeta de medición"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Agregar Tarjeta KPI</span>
              </button>
            }
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            @for (kpi of customizer.config().kpis; track kpi.id) {
              <div 
                class="rounded-xl p-4 shadow-sm border transition-all relative overflow-hidden group"
                [style.backgroundColor]="customizer.config().tema.colorTarjeta"
                [style.borderColor]="customizer.config().tema.colorBorde"
                [style.color]="customizer.config().tema.colorTexto"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[11px] font-mono font-bold tracking-wider opacity-75">
                    {{ kpi.titulo }}
                  </span>

                  <div class="flex items-center gap-1.5">
                    <!-- Badge de Estado -->
                    <span 
                      class="text-[10px] font-mono px-1.5 py-0.5 rounded font-black uppercase"
                      [ngClass]="{
                        'bg-emerald-100 text-emerald-800 border border-emerald-300': kpi.badgeColor === 'emerald',
                        'bg-amber-100 text-amber-800 border border-amber-300': kpi.badgeColor === 'amber',
                        'bg-cyan-100 text-cyan-800 border border-cyan-300': kpi.badgeColor === 'cyan',
                        'bg-red-100 text-red-800 border border-red-300': kpi.badgeColor === 'red',
                        'bg-purple-100 text-purple-800 border border-purple-300': kpi.badgeColor === 'purple'
                      }"
                    >
                      {{ kpi.badgeTexto }}
                    </span>

                    <!-- LÁPIZ Y BORRADO DE KPI CON SVG NÍTIDOS (Solo Super Usuario) -->
                    @if (emergency.esSuperUsuario()) {
                      <div class="flex items-center gap-1">
                        <button 
                          (click)="editarKpi(kpi)"
                          class="p-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-900 border border-amber-500 cursor-pointer shadow-xs transition-all hover:scale-110"
                          title="Editar este KPI"
                        >
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button 
                          (click)="customizer.eliminarKpi(kpi.id)"
                          class="p-1 rounded bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 cursor-pointer shadow-xs transition-all hover:scale-110"
                          title="Eliminar este KPI"
                        >
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    }
                  </div>
                </div>

                <div class="flex items-baseline gap-2">
                  <span class="text-3xl font-black font-mono tracking-tight" [style.color]="kpi.colorValor || customizer.config().tema.colorPrimario">
                    {{ getKpiValor(kpi) }}
                  </span>
                  <span class="text-xs opacity-75 font-sans">
                    {{ getKpiSubtitulo1(kpi) }}
                  </span>
                </div>

                <div class="mt-2 text-[11px] opacity-75 font-sans flex items-center justify-between">
                  <span>{{ getKpiSubtitulo2(kpi) }}</span>
                  <span class="w-2 h-2 rounded-full" [ngClass]="kpi.badgeColor === 'red' ? 'bg-red-500' : 'bg-emerald-500'"></span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ESTUDIO ANALÍTICO DE MANDO POWER BI (Gráfica de Triage START, Sectores y Capacidad) -->
      @if (customizer.config().visibilidad.graficaTriage) {
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xs font-bold tracking-wider uppercase flex items-center gap-1.5" [style.color]="customizer.config().tema.colorPrimario">
                <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                <span>Estudio Analítico y Gráficos Interactivos (Power BI / Grafana)</span>
              </h3>
              <p class="text-[11px] opacity-75">Toca cualquier segmento o barra para activar el filtrado cruzado de todo el dashboard</p>
            </div>
            
            <span class="text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
              MOTOR DUCKDB & REDIS ACTIVO
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <!-- PANEL 1: DONA INTERACTIVA DE TRIAGE START -->
            <div 
              class="rounded-xl p-4 shadow-sm border transition-all"
              [style.backgroundColor]="customizer.config().tema.colorTarjeta"
              [style.borderColor]="customizer.config().tema.colorBorde"
            >
              <div class="flex items-center justify-between mb-3">
                <h4 class="text-xs font-bold uppercase tracking-wider text-[#07483b] flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-[#07483b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                  <span>Triage START</span>
                </h4>
                <span class="text-[10px] opacity-75 font-mono">Total: {{ triageStats().total }}</span>
              </div>

              <!-- Gráfico de Dona SVG Reactivo -->
              <div class="flex flex-col items-center justify-center">
                <div class="relative w-36 h-36 flex items-center justify-center">
                  <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <!-- Fondo circular -->
                    <path class="text-slate-100" stroke-width="4.5" stroke="currentColor" fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <!-- Segmento Verde -->
                    <path class="text-emerald-500 cursor-pointer hover:opacity-80 transition-all" stroke-width="4.5"
                          [attr.stroke-dasharray]="triageStats().verde.pct + ', 100'"
                          stroke-dashoffset="0" stroke="currentColor" fill="none"
                          (click)="toggleFiltroTriage('VERDE')"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <!-- Segmento Amarillo -->
                    <path class="text-amber-400 cursor-pointer hover:opacity-80 transition-all" stroke-width="4.5"
                          [attr.stroke-dasharray]="triageStats().amarillo.pct + ', 100'"
                          [attr.stroke-dashoffset]="-triageStats().verde.pct"
                          stroke="currentColor" fill="none"
                          (click)="toggleFiltroTriage('AMARILLO')"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <!-- Segmento Rojo -->
                    <path class="text-red-600 cursor-pointer hover:opacity-80 transition-all" stroke-width="5"
                          [attr.stroke-dasharray]="triageStats().rojo.pct + ', 100'"
                          [attr.stroke-dashoffset]="-(triageStats().verde.pct + triageStats().amarillo.pct)"
                          stroke="currentColor" fill="none"
                          (click)="toggleFiltroTriage('ROJO')"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  
                  <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span class="text-xl font-black font-mono text-[#07483b]">{{ triageStats().total }}</span>
                    <span class="text-[9px] uppercase font-bold text-slate-500">Atenciones</span>
                  </div>
                </div>

                <!-- Leyenda Táctil con Clic para Filtrado Cruzado -->
                <div class="grid grid-cols-2 gap-1.5 w-full mt-3 text-[11px] font-mono">
                  <button 
                    (click)="toggleFiltroTriage('ROJO')"
                    [class.ring-2]="filtroTriageActivo() === 'ROJO'"
                    [class.ring-red-600]="filtroTriageActivo() === 'ROJO'"
                    class="p-1 px-1.5 rounded bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <span class="flex items-center gap-1 font-bold">
                      <span class="w-2 h-2 rounded-full bg-red-600"></span>
                      Rojo
                    </span>
                    <span class="font-black">{{ triageStats().rojo.count }}</span>
                  </button>

                  <button 
                    (click)="toggleFiltroTriage('AMARILLO')"
                    [class.ring-2]="filtroTriageActivo() === 'AMARILLO'"
                    [class.ring-amber-500]="filtroTriageActivo() === 'AMARILLO'"
                    class="p-1 px-1.5 rounded bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <span class="flex items-center gap-1 font-bold">
                      <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                      Amarillo
                    </span>
                    <span class="font-black">{{ triageStats().amarillo.count }}</span>
                  </button>

                  <button 
                    (click)="toggleFiltroTriage('VERDE')"
                    [class.ring-2]="filtroTriageActivo() === 'VERDE'"
                    [class.ring-emerald-500]="filtroTriageActivo() === 'VERDE'"
                    class="p-1 px-1.5 rounded bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <span class="flex items-center gap-1 font-bold">
                      <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Verde
                    </span>
                    <span class="font-black">{{ triageStats().verde.count }}</span>
                  </button>

                  <button 
                    (click)="toggleFiltroTriage('NEGRO')"
                    [class.ring-2]="filtroTriageActivo() === 'NEGRO'"
                    [class.ring-slate-800]="filtroTriageActivo() === 'NEGRO'"
                    class="p-1 px-1.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <span class="flex items-center gap-1 font-bold">
                      <span class="w-2 h-2 rounded-full bg-slate-800"></span>
                      Negro
                    </span>
                    <span class="font-black">{{ triageStats().negro.count }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- PANEL 2: GRÁFICO DE BARRAS POR SECTOR (Con Filtrado Cruzado) -->
            <div 
              class="rounded-xl p-4 shadow-sm border transition-all flex flex-col justify-between"
              [style.backgroundColor]="customizer.config().tema.colorTarjeta"
              [style.borderColor]="customizer.config().tema.colorBorde"
            >
              <div>
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-[#07483b] flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-[#07483b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Atenciones por Sector</span>
                  </h4>
                  <span class="text-[10px] text-amber-600 font-bold">Clic para filtrar</span>
                </div>

                <div class="space-y-2.5">
                  @for (sec of sectoresStats(); track sec.id) {
                    <div 
                      (click)="toggleFiltroSector(sec.nombre)"
                      [class.bg-amber-50]="filtroSectorActivo() === sec.nombre"
                      [class.p-1]="filtroSectorActivo() === sec.nombre"
                      [class.rounded-lg]="filtroSectorActivo() === sec.nombre"
                      [class.border]="filtroSectorActivo() === sec.nombre"
                      [class.border-amber-300]="filtroSectorActivo() === sec.nombre"
                      class="cursor-pointer group transition-all"
                    >
                      <div class="flex items-center justify-between text-[11px] mb-1 font-mono">
                        <span class="font-bold group-hover:text-amber-600 transition-colors">
                          {{ sec.codigo }}
                        </span>
                        <span class="font-bold text-[#07483b]">
                          0{{ sec.totalAtenciones }} atenciones
                        </span>
                      </div>
                      <div class="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div 
                          class="h-full rounded-full transition-all duration-500"
                          [style.width.%]="sec.pctRelativo"
                          [ngClass]="sec.totalAtenciones > 2 ? 'bg-amber-500' : 'bg-emerald-600'"
                        ></div>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <div class="mt-3 pt-2 border-t border-slate-100 text-[10px] opacity-75 font-mono text-center">
                * Las barras se recalculan en tiempo real según los registros
              </div>
            </div>

            <!-- PANEL 3: CURVA HORARIA DE INGRESOS (Tendencia SVG) -->
            <div 
              class="rounded-xl p-4 shadow-sm border transition-all flex flex-col justify-between"
              [style.backgroundColor]="customizer.config().tema.colorTarjeta"
              [style.borderColor]="customizer.config().tema.colorBorde"
            >
              <div>
                <div class="flex items-center justify-between mb-3">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-[#07483b] flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-[#07483b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span>Flujo Horario de Ingresos</span>
                  </h4>
                  <span class="text-[10px] font-mono text-emerald-700 font-bold">16h - 22h</span>
                </div>

                <!-- Gráfica de Columnas y Tendencia Horaria -->
                <div class="h-28 flex items-end justify-between gap-1 pt-4 pb-1">
                  @for (franja of curvaHorariaStats(); track franja.hora) {
                    <div class="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                      <span class="text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity font-bold text-[#07483b]">
                        {{ franja.count }}
                      </span>
                      <div 
                        class="w-full rounded-t-md bg-gradient-to-t from-emerald-700 to-emerald-400 group-hover:from-amber-500 group-hover:to-amber-300 transition-all duration-300"
                        [style.height.%]="franja.pct > 15 ? franja.pct : 15"
                      ></div>
                      <span class="text-[9px] font-mono text-slate-500 font-semibold">{{ franja.label }}</span>
                    </div>
                  }
                </div>
              </div>

              <div class="mt-2 text-[10px] text-center font-mono opacity-75">
                Curva columnar conectada al motor analítico
              </div>
            </div>

            <!-- PANEL 4: MEDIDOR TÁCTICO DE CAMILLAS (Gauge Radial) -->
            <div 
              class="rounded-xl p-4 shadow-sm border transition-all flex flex-col justify-between"
              [style.backgroundColor]="customizer.config().tema.colorTarjeta"
              [style.borderColor]="customizer.config().tema.colorBorde"
            >
              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-xs font-bold uppercase tracking-wider text-[#07483b] flex items-center gap-1.5">
                    <svg class="w-4 h-4 text-[#07483b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Saturación Camillas ACV</span>
                  </h4>
                  <span class="text-[10px] font-mono font-bold" [style.color]="camillasStats().color">
                    {{ camillasStats().pct }}% Ocupado
                  </span>
                </div>

                <!-- Medidor Radial Semicircular SVG -->
                <div class="flex flex-col items-center justify-center my-2">
                  <div class="relative w-36 h-20 overflow-hidden flex items-end justify-center">
                    <svg class="w-36 h-36 transform -rotate-180" viewBox="0 0 36 36">
                      <!-- Fondo medio círculo -->
                      <path class="text-slate-200" stroke-width="4.5" stroke-dasharray="50, 100" stroke="currentColor" fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                      <!-- Valor Medidor -->
                      <path [attr.stroke]="camillasStats().color" stroke-width="4.5"
                            [attr.stroke-dasharray]="(camillasStats().pct / 2) + ', 100'"
                            stroke="currentColor" fill="none" class="transition-all duration-700"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    </svg>
                    <div class="absolute bottom-1 flex flex-col items-center">
                      <span class="text-2xl font-black font-mono text-[#07483b]">
                        0{{ camillasStats().ocupadas }}/0{{ camillasStats().total }}
                      </span>
                      <span class="text-[9px] uppercase font-bold text-slate-500">Camillas en Uso</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="text-[11px] font-mono text-center flex items-center justify-around pt-2 border-t border-slate-100">
                <span class="text-emerald-700 font-bold">ACV 1: 04 camillas</span>
                <span class="text-cyan-700 font-bold">ACV 2: 04 camillas</span>
              </div>
            </div>

          </div>
        </div>
      }

      <!-- LIENZO DE VISUALIZACIONES DINÁMICAS (El Visual Builder estilo Power BI) -->
      @if (customizer.config().recuadrosPersonalizados.length > 0) {
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold tracking-wider uppercase flex items-center gap-1.5" [style.color]="customizer.config().tema.colorPrimario">
              <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              <span>Bloques Analíticos & Visualizaciones Personalizadas</span>
            </h3>

            @if (emergency.esSuperUsuario()) {
              <button 
                (click)="abrirNuevoWidget()"
                class="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 border border-amber-500 text-xs font-black cursor-pointer shadow-xs flex items-center gap-1.5 transition-all hover:scale-105"
                title="Añadir un nuevo bloque visual al lienzo"
              >
                <span>+ Agregar Bloque Visual</span>
              </button>
            }
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (widget of customizer.config().recuadrosPersonalizados; track widget.id) {
              <div 
                [ngClass]="{
                  'col-span-1': !widget.colSpan || widget.colSpan === 1,
                  'md:col-span-2': widget.colSpan === 2,
                  'col-span-full': widget.colSpan === 3
                }"
                class="rounded-xl p-4 shadow-sm border transition-all duration-300 relative group flex flex-col justify-between"
                [style.backgroundColor]="customizer.config().tema.colorTarjeta"
                [style.borderColor]="widget.colorBorde || customizer.config().tema.colorBorde"
              >
                <div>
                  <div class="flex items-start justify-between gap-2 border-b pb-2" [style.borderColor]="customizer.config().tema.colorBorde">
                    <div class="flex items-center gap-2">
                      <div class="w-7 h-7 rounded-lg bg-[#07483b]/10 text-[#07483b] flex items-center justify-center flex-shrink-0">
                        @if (widget.visualType === 'grafico_dona') {
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/></svg>
                        } @else if (widget.visualType === 'grafico_barras') {
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                        } @else if (widget.visualType === 'curva_tendencia') {
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>
                        } @else if (widget.visualType === 'gauge_radial') {
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                        } @else {
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        }
                      </div>
                      <div>
                        <h4 class="text-xs font-bold uppercase tracking-wider" [style.color]="customizer.config().tema.colorPrimario">
                          {{ widget.titulo }}
                        </h4>
                        @if (widget.visualType && widget.visualType !== 'texto_markdown') {
                          <span class="text-[9px] font-mono bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded font-bold uppercase">
                            {{ widget.visualType.replace('_', ' ') }}
                          </span>
                        }
                      </div>
                    </div>

                    <!-- CONTROLES TÁCTICOS POWER BI (Reordenar, Ancho, Editar, Eliminar) -->
                    @if (emergency.esSuperUsuario()) {
                      <div class="flex items-center gap-1">
                        <!-- Mover Arriba / Izquierda -->
                        <button 
                          (click)="customizer.moverWidget(widget.id, 'arriba')"
                          class="p-1 px-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer shadow-xs transition-all flex items-center justify-center"
                          title="Mover hacia arriba / izquierda"
                        >
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"/></svg>
                        </button>
                        <!-- Mover Abajo / Derecha -->
                        <button 
                          (click)="customizer.moverWidget(widget.id, 'abajo')"
                          class="p-1 px-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 cursor-pointer shadow-xs transition-all flex items-center justify-center"
                          title="Mover hacia abajo / derecha"
                        >
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg>
                        </button>
                        <!-- Ciclar Ancho de Columna (1 -> 2 -> 3 -> 1) -->
                        <button 
                          (click)="ciclarColSpan(widget)"
                          class="p-1 px-1.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 cursor-pointer shadow-xs text-[10px] font-mono font-bold flex items-center gap-1"
                          title="Cambiar tamaño de columna (1 col, 2 col, ancho completo)"
                        >
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                          <span>{{ widget.colSpan || 1 }} Col</span>
                        </button>
                        <!-- Editar Widget -->
                        <button 
                          (click)="editarWidget(widget)"
                          class="p-1 px-1.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-900 border border-amber-500 cursor-pointer shadow-xs transition-all hover:scale-105"
                          title="Editar visualización, tipo de gráfico y contenido"
                        >
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <!-- Eliminar Widget -->
                        <button 
                          (click)="customizer.eliminarRecuadroPersonalizado(widget.id)"
                          class="p-1 px-1.5 rounded bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 cursor-pointer shadow-xs transition-all hover:scale-105"
                          title="Eliminar este bloque"
                        >
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    }
                  </div>

                  <!-- CONTENIDO SEGÚN TIPO DE VISUALIZACIÓN POWER BI -->
                  <div class="mt-3">
                    
                    <!-- CASO 1: Dona de Triage -->
                    @if (widget.visualType === 'grafico_dona') {
                      <div class="flex items-center justify-around gap-2 py-2">
                        <div class="text-center font-mono">
                          <span class="text-3xl font-black text-[#07483b]">{{ triageStats().total }}</span>
                          <span class="text-[10px] block opacity-75">Pacientes</span>
                        </div>
                        <div class="space-y-1 text-xs font-mono">
                          <div (click)="toggleFiltroTriage('ROJO')" class="cursor-pointer flex items-center gap-2 hover:font-bold">
                            <span class="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                            <span>Rojo: {{ triageStats().rojo.count }} ({{ triageStats().rojo.pct }}%)</span>
                          </div>
                          <div (click)="toggleFiltroTriage('AMARILLO')" class="cursor-pointer flex items-center gap-2 hover:font-bold">
                            <span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                            <span>Amarillo: {{ triageStats().amarillo.count }} ({{ triageStats().amarillo.pct }}%)</span>
                          </div>
                          <div (click)="toggleFiltroTriage('VERDE')" class="cursor-pointer flex items-center gap-2 hover:font-bold">
                            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            <span>Verde: {{ triageStats().verde.count }} ({{ triageStats().verde.pct }}%)</span>
                          </div>
                        </div>
                      </div>
                    }

                    <!-- CASO 2: Barras por Sector -->
                    @else if (widget.visualType === 'grafico_barras') {
                      <div class="space-y-2 py-1">
                        @for (sec of sectoresStats(); track sec.id) {
                          <div (click)="toggleFiltroSector(sec.nombre)" class="cursor-pointer group text-xs font-mono">
                            <div class="flex items-center justify-between mb-0.5">
                              <span class="font-bold group-hover:text-amber-600">{{ sec.codigo }}</span>
                              <span>0{{ sec.totalAtenciones }}</span>
                            </div>
                            <div class="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div class="h-full rounded-full bg-emerald-600" [style.width.%]="sec.pctRelativo"></div>
                            </div>
                          </div>
                        }
                      </div>
                    }

                    <!-- CASO 3: Curva de Tendencia -->
                    @else if (widget.visualType === 'curva_tendencia') {
                      <div class="h-20 flex items-end justify-between gap-1 pt-2">
                        @for (franja of curvaHorariaStats(); track franja.hora) {
                          <div class="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
                            <div class="w-full rounded-t bg-emerald-500" [style.height.%]="franja.pct > 15 ? franja.pct : 15"></div>
                            <span class="text-[8px] font-mono opacity-75">{{ franja.label }}</span>
                          </div>
                        }
                      </div>
                    }

                    <!-- CASO 4: Gauge de Camillas -->
                    @else if (widget.visualType === 'gauge_radial') {
                      <div class="flex items-center justify-around py-2">
                        <div class="text-center font-mono">
                          <span class="text-2xl font-black text-[#07483b]">0{{ camillasStats().ocupadas }}/08</span>
                          <span class="text-[10px] block opacity-75">Ocupadas</span>
                        </div>
                        <div class="w-28 h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                          <div class="h-full rounded-full transition-all duration-500" [style.width.%]="camillasStats().pct" [style.backgroundColor]="camillasStats().color"></div>
                        </div>
                      </div>
                    }

                    <!-- CASO 5: Consigna Operativa / Texto Markdown -->
                    @else {
                      <div class="text-xs leading-relaxed opacity-90 whitespace-pre-line font-sans" [style.color]="customizer.config().tema.colorTexto">
                        {{ widget.contenido }}
                      </div>
                    }

                  </div>
                </div>

                @if (widget.contenido && widget.visualType !== 'texto_markdown') {
                  <div class="mt-2 pt-2 border-t border-slate-100 text-[10px] opacity-75 font-sans">
                    {{ widget.contenido }}
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Sectores Operativos / Secciones en Terreno (Con Filtrado Cruzado Interactivo) -->
      @if (customizer.config().visibilidad.sectoresOperativos) {
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xs font-bold tracking-wider uppercase flex items-center gap-1.5" [style.color]="customizer.config().tema.colorPrimario">
                <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Sectores Operativos & Despliegue en Terreno</span>
              </h3>
              <p class="text-[11px] opacity-75">Haz clic en cualquier tarjeta de sector para filtrar el Centro de Mando en vivo</p>
            </div>

            <!-- Botón Agregar Nuevo Sector (Solo Super Usuario) -->
            @if (emergency.esSuperUsuario()) {
              <button 
                (click)="abrirNuevoSector()"
                class="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 border border-amber-500 text-xs font-black cursor-pointer shadow-xs flex items-center gap-1.5 transition-all hover:scale-105"
                title="Añadir una nueva zona o sector al evento"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Agregar Sector / Zona</span>
              </button>
            }
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            @for (sec of emergency.sectores(); track sec.id) {
              <div 
                (click)="toggleFiltroSector(sec.nombre)"
                [class.ring-2]="filtroSectorActivo() === sec.nombre"
                [class.ring-amber-400]="filtroSectorActivo() === sec.nombre"
                [class.scale-[1.02]]="filtroSectorActivo() === sec.nombre"
                [class.shadow-md]="filtroSectorActivo() === sec.nombre"
                class="rounded-xl p-4 shadow-sm border transition-all duration-200 group relative overflow-hidden cursor-pointer"
                [style.backgroundColor]="customizer.config().tema.colorTarjeta"
                [style.borderColor]="filtroSectorActivo() === sec.nombre ? '#f59e0b' : customizer.config().tema.colorBorde"
                [style.color]="customizer.config().tema.colorTexto"
              >
                <div class="flex items-start justify-between">
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="text-[10px] font-mono px-2 py-0.5 rounded font-bold border"
                            [style.backgroundColor]="customizer.config().tema.colorTarjetaSecundaria"
                            [style.borderColor]="customizer.config().tema.colorBorde"
                            [style.color]="customizer.config().tema.colorPrimario">
                        {{ sec.codigo }}
                      </span>

                      @if (filtroSectorActivo() === sec.nombre) {
                        <span class="text-[9px] font-bold bg-amber-400 text-slate-900 px-1.5 py-0.2 rounded-full uppercase">
                          Filtrado Activo
                        </span>
                      }

                      <!-- LÁPIZ Y BORRADO DE SECTOR CON SVG NÍTIDOS (Solo Super Usuario) -->
                      @if (emergency.esSuperUsuario()) {
                        <div class="flex items-center gap-1 ml-1" (click)="$event.stopPropagation()">
                          <button 
                            (click)="editarSector(sec)"
                            class="p-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-900 border border-amber-500 cursor-pointer shadow-xs transition-all hover:scale-110"
                            title="Editar código, nombre y capacidad de este sector"
                          >
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button 
                            (click)="emergency.eliminarSector(sec.id)"
                            class="p-1 rounded bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 cursor-pointer shadow-xs transition-all hover:scale-110"
                            title="Eliminar este sector"
                          >
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      }
                    </div>

                    <h4 class="text-sm font-bold mt-2" [style.color]="customizer.config().tema.colorTexto">{{ sec.nombre }}</h4>
                  </div>
                  <div class="w-2.5 h-2.5 rounded-full" [ngClass]="sec.alertasActivas > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'"></div>
                </div>

                <!-- Indicadores del Sector -->
                <div class="grid grid-cols-3 gap-2 mt-4 pt-3 border-t text-center font-mono" [style.borderColor]="customizer.config().tema.colorBorde">
                  <div>
                    <span class="text-[10px] opacity-75 block">Personal</span>
                    <span class="text-base font-bold" [style.color]="customizer.config().tema.colorPrimario">0{{ sec.personalAsignado.length }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] opacity-75 block">Atenciones</span>
                    <span class="text-base font-bold text-amber-500">0{{ sec.totalAtenciones }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] opacity-75 block">Alertas</span>
                    <span class="text-base font-bold" [ngClass]="sec.alertasActivas > 0 ? 'text-red-600' : 'opacity-40'">
                      0{{ sec.alertasActivas }}
                    </span>
                  </div>
                </div>

                <div class="mt-3">
                  <div class="flex items-center justify-between text-[11px] opacity-75 mb-1">
                    <span>Disponibilidad</span>
                    <span class="font-bold" [style.color]="customizer.config().tema.colorPrimario">
                      {{ sec.personalAsignado.length }}/{{ sec.capacidadPersonal }}
                    </span>
                  </div>
                  <!-- Barra de progreso dinámica -->
                  <div class="w-full h-2 rounded-full overflow-hidden" [style.backgroundColor]="customizer.config().tema.colorTarjetaSecundaria">
                    <div 
                      class="h-full rounded-full transition-all"
                      [style.backgroundColor]="customizer.config().tema.colorPrimario"
                      [style.width.%]="(sec.personalAsignado.length / sec.capacidadPersonal) * 100"
                    ></div>
                  </div>
                </div>

              </div>
            }
          </div>
        </div>
      }

      <!-- Tabla de Atenciones Recientes (Conectada a Cross-Filtering) -->
      @if (customizer.config().visibilidad.tablaActividad) {
        <div 
          class="rounded-xl shadow-sm border overflow-hidden transition-all"
          [style.backgroundColor]="customizer.config().tema.colorTarjeta"
          [style.borderColor]="customizer.config().tema.colorBorde"
        >
          <div class="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3" [style.borderColor]="customizer.config().tema.colorBorde">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm font-bold tracking-wider uppercase" [style.color]="customizer.config().tema.colorTexto">
                  Registro de Atenciones en Curso
                </h3>
                <span class="text-xs font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  {{ atencionesFiltradas().length }} visibles
                </span>
              </div>
              <p class="text-xs opacity-75 font-sans">
                Últimas emergencias prehospitalarias notificadas por los brigadistas de campo
              </p>
            </div>

            <!-- Filtros de Estado y Botón Limpiar -->
            <div class="flex items-center gap-2 text-xs font-bold">
              @if (filtroSectorActivo() || filtroTriageActivo()) {
                <button 
                  (click)="limpiarTodosFiltros()"
                  class="px-2.5 py-1 rounded-lg bg-amber-400 text-slate-900 font-bold hover:bg-amber-300 cursor-pointer flex items-center gap-1 shadow-xs"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                  <span>Quitar Filtros</span>
                </button>
              }

              <span class="opacity-75">Estado:</span>
              <select 
                (change)="filtrarEstado($event)"
                class="rounded-lg p-1.5 border text-xs font-bold"
                [style.backgroundColor]="customizer.config().tema.colorTarjetaSecundaria"
                [style.borderColor]="customizer.config().tema.colorBorde"
                [style.color]="customizer.config().tema.colorTexto"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="EN_ATENCION">En Atención / Campo</option>
                <option value="PENDIENTE_TRIAGE">Pendiente Triage</option>
                <option value="EN_CONSULTA">En Consulta ACV / PMA</option>
                <option value="TRASLADO_HOSPITALARIO">Traslado Hospitalario</option>
                <option value="ALTA_IN_SITU">Altas (Terreno / Ambulancia)</option>
              </select>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs font-mono">
              <thead class="uppercase tracking-wider font-bold border-b" 
                     [style.backgroundColor]="customizer.config().tema.colorTarjetaSecundaria"
                     [style.borderColor]="customizer.config().tema.colorBorde"
                     [style.color]="customizer.config().tema.colorTexto">
                <tr>
                  <th class="py-3 px-4">Código</th>
                  <th class="py-3 px-4">Paciente</th>
                  <th class="py-3 px-4">Ubicación / Sector</th>
                  <th class="py-3 px-4">Paramédico</th>
                  <th class="py-3 px-4">Motivo / Triage</th>
                  <th class="py-3 px-4 text-right">Hora</th>
                </tr>
              </thead>
              <tbody class="divide-y" [style.borderColor]="customizer.config().tema.colorBorde">
                @for (atencion of atencionesFiltradas(); track atencion.id) {
                  <tr class="hover:opacity-90 transition-opacity">
                    <!-- Código -->
                    <td class="py-3 px-4 font-bold" [style.color]="customizer.config().tema.colorPrimario">
                      {{ atencion.codigo }}
                    </td>

                    <!-- Paciente -->
                    <td class="py-3 px-4 font-sans font-bold" [style.color]="customizer.config().tema.colorTexto">
                      {{ atencion.nombresPaciente }} {{ atencion.apellidosPaciente }}
                      <span class="text-[10px] opacity-75 font-mono block">Edad: {{ atencion.edadPaciente }} años</span>
                    </td>

                    <!-- Sector -->
                    <td class="py-3 px-4 font-sans">
                      <span 
                        (click)="toggleFiltroSector(atencion.sectorNombre)"
                        class="px-2 py-0.5 rounded text-[10px] font-bold border cursor-pointer hover:border-amber-400"
                        [style.backgroundColor]="customizer.config().tema.colorTarjetaSecundaria"
                        [style.borderColor]="customizer.config().tema.colorBorde"
                        title="Filtrar por este sector"
                      >
                        {{ atencion.sectorNombre }}
                      </span>
                    </td>

                    <!-- Paramédico -->
                    <td class="py-3 px-4 font-sans opacity-90">
                      {{ atencion.paramedicoNombre }}
                    </td>

                    <!-- Motivo / Triage -->
                    <td class="py-3 px-4 font-sans">
                      <span [style.color]="customizer.config().tema.colorTexto">{{ atencion.motivo }}</span>

                      <!-- Badge de Triage si ya fue clasificado -->
                      @if (atencion.triage) {
                        <span 
                          (click)="toggleFiltroTriage(atencion.triage)"
                          class="ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-xs cursor-pointer hover:opacity-85"
                          [ngClass]="{
                            'bg-red-600 text-white': atencion.triage === 'ROJO',
                            'bg-amber-500 text-black': atencion.triage === 'AMARILLO',
                            'bg-emerald-600 text-white': atencion.triage === 'VERDE',
                            'bg-slate-800 text-white': atencion.triage === 'NEGRO'
                          }"
                          title="Filtrar por este color de triage"
                        >
                          {{ atencion.triage }}
                        </span>
                      }
                    </td>

                    <!-- Hora -->
                    <td class="py-3 px-4 text-right font-semibold opacity-75">
                      {{ atencion.horaInicio }}
                    </td>

                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" class="py-8 text-center text-slate-400 font-sans">
                      <p class="text-sm font-bold">No hay atenciones que coincidan con los filtros seleccionados.</p>
                      <button (click)="limpiarTodosFiltros()" class="mt-2 text-xs font-bold text-amber-600 underline cursor-pointer">
                        Restablecer todos los filtros
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

    </div>

    <!-- MODAL DE EDICIÓN RÁPIDA CON LÁPIZ PARA SUPER USUARIOS -->
    <app-quick-edit-modal #quickEditor></app-quick-edit-modal>
  `
})
export class DashboardComponent {
  emergency = inject(EmergencyService);
  customizer = inject(CustomizerService);
  
  filtroEstadoSeleccionado = 'TODOS';
  filtroSectorActivo = signal<string | null>(null);
  filtroTriageActivo = signal<'ROJO' | 'AMARILLO' | 'VERDE' | 'NEGRO' | null>(null);

  @ViewChild('quickEditor') quickEditor!: QuickEditModalComponent;

  // --- FILTRADO CRUZADO POWER BI (Cross-Filtering) ---

  toggleFiltroSector(sectorNombre: string) {
    if (this.filtroSectorActivo() === sectorNombre) {
      this.filtroSectorActivo.set(null);
    } else {
      this.filtroSectorActivo.set(sectorNombre);
    }
  }

  toggleFiltroTriage(triage: 'ROJO' | 'AMARILLO' | 'VERDE' | 'NEGRO') {
    if (this.filtroTriageActivo() === triage) {
      this.filtroTriageActivo.set(null);
    } else {
      this.filtroTriageActivo.set(triage);
    }
  }

  limpiarFiltroSector() {
    this.filtroSectorActivo.set(null);
  }

  limpiarFiltroTriage() {
    this.filtroTriageActivo.set(null);
  }

  limpiarTodosFiltros() {
    this.filtroSectorActivo.set(null);
    this.filtroTriageActivo.set(null);
    this.filtroEstadoSeleccionado = 'TODOS';
  }

  filtrarEstado(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.filtroEstadoSeleccionado = val;
  }

  atencionesFiltradas(): Atencion[] {
    let lista = this.emergency.atenciones();

    // 1. Filtro por Estado
    if (this.filtroEstadoSeleccionado === 'EN_ATENCION') {
      lista = lista.filter(a => a.estado === 'EN_ATENCION' || a.estado === 'EN_CONSULTA' || a.estado === 'PENDIENTE_TRIAGE');
    } else if (this.filtroEstadoSeleccionado === 'ALTA_IN_SITU') {
      lista = lista.filter(a => a.estado === 'ALTA_IN_SITU' || a.estado === 'ALTA_AMBULANCIA' || a.estado === 'ALTA_ACV');
    } else if (this.filtroEstadoSeleccionado !== 'TODOS') {
      lista = lista.filter(a => a.estado === this.filtroEstadoSeleccionado);
    }

    // 2. Filtro Cruzado por Sector
    const sectorFiltro = this.filtroSectorActivo();
    if (sectorFiltro) {
      lista = lista.filter(a => a.sectorNombre === sectorFiltro || a.sectorId === sectorFiltro);
    }

    // 3. Filtro Cruzado por Triage START
    const triageFiltro = this.filtroTriageActivo();
    if (triageFiltro) {
      lista = lista.filter(a => a.triage === triageFiltro);
    }

    return lista;
  }

  // --- CÁLCULOS ANALÍTICOS Y ESTADÍSTICAS PARA GRÁFICOS POWER BI ---

  triageStats = computed(() => {
    const atenciones = this.emergency.atenciones();
    const total = atenciones.length || 1;
    const rojo = atenciones.filter(a => a.triage === 'ROJO').length;
    const amarillo = atenciones.filter(a => a.triage === 'AMARILLO').length;
    const verde = atenciones.filter(a => a.triage === 'VERDE').length;
    const negro = atenciones.filter(a => a.triage === 'NEGRO').length;
    const sinTriage = atenciones.filter(a => !a.triage).length;

    return {
      total: atenciones.length,
      rojo: { count: rojo, pct: Math.round((rojo / total) * 100) },
      amarillo: { count: amarillo, pct: Math.round((amarillo / total) * 100) },
      verde: { count: verde, pct: Math.round((verde / total) * 100) },
      negro: { count: negro, pct: Math.round((negro / total) * 100) },
      sinTriage: { count: sinTriage, pct: Math.round((sinTriage / total) * 100) }
    };
  });

  sectoresStats = computed(() => {
    const sectores = this.emergency.sectores();
    const maxAtenciones = Math.max(...sectores.map(s => s.totalAtenciones), 1);
    return sectores.map(s => ({
      ...s,
      pctRelativo: Math.max(Math.round((s.totalAtenciones / maxAtenciones) * 100), 10)
    }));
  });

  camillasStats = computed(() => {
    const ocupadas = this.emergency.trasladosActivosACV();
    const total = 8; // 4 en ACV 1 y 4 en ACV 2
    const pct = Math.min(Math.round((ocupadas / total) * 100), 100);
    return {
      ocupadas,
      total,
      pct,
      color: pct > 80 ? '#dc2626' : pct > 50 ? '#f59e0b' : '#10b981'
    };
  });

  curvaHorariaStats = computed(() => {
    const atenciones = this.emergency.atenciones();
    const franjas = [
      { hora: '16:00', label: '16h', count: 0 },
      { hora: '17:00', label: '17h', count: 0 },
      { hora: '18:00', label: '18h', count: 0 },
      { hora: '19:00', label: '19h', count: 0 },
      { hora: '20:00', label: '20h', count: 0 },
      { hora: '21:00', label: '21h', count: 0 },
      { hora: '22:00', label: '22h', count: 0 }
    ];

    atenciones.forEach(a => {
      const h = parseInt((a.horaInicio || '16').split(':')[0], 10);
      if (h <= 16) franjas[0].count++;
      else if (h === 17) franjas[1].count++;
      else if (h === 18) franjas[2].count++;
      else if (h === 19) franjas[3].count++;
      else if (h === 20) franjas[4].count++;
      else if (h === 21) franjas[5].count++;
      else franjas[6].count++;
    });

    const maxCount = Math.max(...franjas.map(f => f.count), 1);
    return franjas.map(f => ({
      ...f,
      pct: Math.round((f.count / maxCount) * 100)
    }));
  });

  abrirReporte() {
    window.dispatchEvent(new CustomEvent('abrir-modal-reporte'));
  }

  // --- GESTIÓN DE LAYOUT Y ANCHO DE COLUMNAS (Power BI) ---

  ciclarColSpan(widget: CustomWidget) {
    const actual = widget.colSpan || 1;
    const siguiente: 1 | 2 | 3 = actual === 1 ? 2 : actual === 2 ? 3 : 1;
    this.customizer.cambiarColSpan(widget.id, siguiente);
  }

  // --- MÉTODOS PARA GESTIÓN DINÁMICA DE KPIS ---

  abrirNuevoKpi() {
    this.quickEditor.abrir({
      tipo: 'nuevo_kpi',
      tituloModal: 'Agregar Nuevo Indicador (KPI)',
      kpiTitulo: '',
      kpiBadgeTexto: 'LIVE',
      kpiBadgeColor: 'emerald',
      kpiTipoValor: 'metrica_atenciones',
      kpiValorManual: '00',
      kpiSubtitulo1: 'Registradas',
      kpiSubtitulo2: 'En seguimiento'
    });
  }

  editarKpi(kpi: DynamicKpi) {
    this.quickEditor.abrir({
      tipo: 'kpi',
      id: kpi.id,
      tituloModal: `Editar Indicador: ${kpi.titulo}`,
      kpiTitulo: kpi.titulo,
      kpiBadgeTexto: kpi.badgeTexto,
      kpiBadgeColor: kpi.badgeColor,
      kpiTipoValor: kpi.tipoValor,
      kpiValorManual: kpi.valorManual || '00',
      kpiSubtitulo1: kpi.subtitulo1,
      kpiSubtitulo2: kpi.subtitulo2,
      kpiColorValor: kpi.colorValor
    });
  }

  getKpiValor(kpi: DynamicKpi): string {
    if (kpi.tipoValor === 'metrica_personal') {
      const tot = this.emergency.personalOperativoTotal();
      return tot < 10 ? `0${tot}` : `${tot}`;
    }
    if (kpi.tipoValor === 'metrica_atenciones') {
      const act = this.emergency.atencionesActivas();
      return act < 10 ? `0${act}` : `${act}`;
    }
    if (kpi.tipoValor === 'metrica_traslados') {
      const tra = this.emergency.trasladosActivosACV();
      return tra < 10 ? `0${tra}` : `${tra}`;
    }
    if (kpi.tipoValor === 'metrica_ambulancias') {
      const amb = this.emergency.ambulancias().filter(a => a.activo).length;
      return amb < 10 ? `0${amb}` : `${amb}`;
    }
    return kpi.valorManual || '00';
  }

  getKpiSubtitulo1(kpi: DynamicKpi): string {
    if (kpi.tipoValor === 'metrica_personal') {
      return `${this.emergency.personalDisponible()} disponibles`;
    }
    return kpi.subtitulo1;
  }

  getKpiSubtitulo2(kpi: DynamicKpi): string {
    if (kpi.tipoValor === 'metrica_personal') {
      return `${this.emergency.personalEnAtencion()} en atención`;
    }
    return kpi.subtitulo2;
  }

  // --- MÉTODOS PARA SECTORES ---

  abrirNuevoSector() {
    const siguienteLetra = String.fromCharCode(65 + this.emergency.sectores().length);
    this.quickEditor.abrir({
      tipo: 'nuevo_sector',
      tituloModal: 'Agregar Nueva Sección / Sector Operativo',
      sectorCodigo: `ZONA ${siguienteLetra}`,
      sectorNombre: `ZONA ${siguienteLetra} - NUEVA ZONA`,
      sectorCapacidad: 4
    });
  }

  editarSector(sec: Sector) {
    this.quickEditor.abrir({
      tipo: 'sector',
      id: sec.id,
      tituloModal: `Editar Sector: ${sec.codigo}`,
      sectorCodigo: sec.codigo,
      sectorNombre: sec.nombre,
      sectorCapacidad: sec.capacidadPersonal
    });
  }

  // --- MÉTODOS DE EVENTO Y BLOQUES VISUALES ---

  editarEvento() {
    this.quickEditor.abrir({
      tipo: 'evento',
      tituloModal: 'Editar Datos del Evento Masivo',
      nombreEvento: this.customizer.config().textos.nombreEvento || this.emergency.evento().nombre,
      ciudadSede: this.customizer.config().textos.ciudadSede,
      lugarRecinto: this.customizer.config().textos.lugarRecinto,
      fechaHorario: this.customizer.config().textos.fechaHorario,
      nivelRiesgo: this.customizer.config().textos.nivelRiesgo,
      aforoTexto: this.customizer.config().textos.aforoTexto
    });
  }

  abrirNuevoWidget() {
    this.quickEditor.abrir({
      tipo: 'widget',
      tituloModal: 'Crear Bloque Visual (Power BI)',
      widgetTitulo: 'NUEVO BLOQUE ANALÍTICO',
      widgetContenido: 'Descripción o análisis del bloque',
      widgetIcono: '',
      widgetVisualType: 'grafico_barras',
      widgetDataSource: 'sectores_atenciones',
      widgetColSpan: 1
    });
  }

  editarWidget(w: CustomWidget) {
    this.quickEditor.abrir({
      tipo: 'widget',
      id: w.id,
      tituloModal: `Editar Bloque: ${w.titulo}`,
      widgetTitulo: w.titulo,
      widgetContenido: w.contenido,
      widgetIcono: w.icono,
      widgetVisualType: w.visualType || 'texto_markdown',
      widgetDataSource: w.dataSource || 'manual',
      widgetColSpan: w.colSpan || 1
    });
  }

  simularAlerta() {
    if (!this.emergency.esSuperUsuario()) {
      alert('ACCESO RESTRINGIDO: Solo los Super Usuarios (Puesto de Mando) pueden emitir una Alerta General.');
      return;
    }

    const confirmar = confirm(
      '¿ESTÁS SEGURO QUE DESEAS EMITIR UNA ALERTA GENERAL?\n\n' +
      '• Se activarán tonos de sirena tácticos.\n' +
      '• Se solicitará reporte de estado inmediato a todos los sectores operativos.\n\n' +
      '¿Proceder con la Alerta General?'
    );

    if (confirmar) {
      this.emergency.playTacticalAlertTone(950, 0.4);
      this.emergency.mostrarNotificacion('ALERTA GENERAL EMITIDA: Todos los sectores en máxima alerta.', 'alerta');
    }
  }
}
