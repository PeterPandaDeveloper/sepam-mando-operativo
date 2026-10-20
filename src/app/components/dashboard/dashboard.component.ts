import { Component, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmergencyService } from '../../services/emergency.service';
import { CustomizerService, CustomWidget, DynamicKpi } from '../../services/customizer.service';
import { Atencion, Sector, TriageColor } from '../../models/emergency.model';
import { QuickEditModalComponent } from '../quick-edit-modal/quick-edit-modal.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, QuickEditModalComponent],
  template: `
    <div class="space-y-6 transition-colors duration-300">
      
      <!-- ============================================================== -->
      <!-- BARRA INTERACTIVA DE FILTRO CRUZADO (CROSS-FILTERING POWER BI) -->
      <!-- ============================================================== -->
      @if (tieneFiltrosInteractivos()) {
        <div class="bg-amber-400 text-slate-950 px-4 py-3 rounded-xl shadow-lg border-2 border-amber-600 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div class="flex items-center gap-2 flex-wrap text-xs font-black">
            <span class="uppercase tracking-wider flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
              </svg>
              <span>FILTRO ACTIVO EN PANTALLA:</span>
            </span>

            @if (filtroTriagePowerBI()) {
              <span class="px-2.5 py-1 rounded-lg bg-slate-950 text-white font-mono flex items-center gap-1.5 shadow-xs">
                <span>Prioridad: {{ filtroTriagePowerBI() }}</span>
                <button (click)="toggleFiltroTriage(filtroTriagePowerBI()!)" class="text-amber-300 hover:text-red-400 cursor-pointer font-bold">✕</button>
              </span>
            }

            @if (filtroSectorPowerBI()) {
              <span class="px-2.5 py-1 rounded-lg bg-slate-950 text-white font-mono flex items-center gap-1.5 shadow-xs">
                <span>Zona: {{ obtenerNombreSectorFiltro() }}</span>
                <button (click)="toggleFiltroSector(filtroSectorPowerBI()!)" class="text-amber-300 hover:text-red-400 cursor-pointer font-bold">✕</button>
              </span>
            }

            @if (filtroMotivoPowerBI()) {
              <span class="px-2.5 py-1 rounded-lg bg-slate-950 text-white font-mono flex items-center gap-1.5 shadow-xs">
                <span>Causa: {{ filtroMotivoPowerBI() }}</span>
                <button (click)="toggleFiltroMotivo(filtroMotivoPowerBI()!)" class="text-amber-300 hover:text-red-400 cursor-pointer font-bold">✕</button>
              </span>
            }

            <span class="text-[11px] font-bold bg-white/60 px-2 py-0.5 rounded-md">
              Mostrando {{ atencionesFiltradas().length }} de {{ emergency.atenciones().length }} pacientes
            </span>
          </div>

          <button 
            (click)="limpiarFiltrosPowerBI()"
            class="px-3.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-300 text-xs font-black cursor-pointer shadow-sm transition-all flex items-center gap-1.5"
          >
            <span>Quitar Filtros y Ver Todo</span>
          </button>
        </div>
      }

      <!-- ============================================================== -->
      <!-- BANNER PRINCIPAL DEL EVENTO -->
      <!-- ============================================================== -->
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
                  OPERATIVO EN CURSO
                </span>
                <span class="text-xs font-mono opacity-85">
                  NIVEL DE RIESGO: {{ customizer.config().textos.nivelRiesgo | uppercase }}
                </span>
              </div>
              
              <div class="flex items-center gap-3 flex-wrap">
                <h1 class="text-xl md:text-3xl font-black tracking-tight uppercase">
                  {{ customizer.config().textos.nombreEvento }}
                </h1>

                @if (emergency.esSuperUsuario()) {
                  <button 
                    (click)="editarEvento()"
                    class="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5 transition-all hover:scale-105 border border-amber-500"
                    title="Cambiar el nombre del evento, lugar, fecha o aforo"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <span>Cambiar Datos del Evento</span>
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
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <span>Asistentes: {{ customizer.config().textos.aforoTexto }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button 
                (click)="abrirReporte()"
                class="px-4 py-2.5 rounded-xl text-white text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm border border-white/25 hover:scale-105"
                [style.backgroundColor]="customizer.config().tema.colorPrimario"
              >
                <svg class="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <span>{{ emergency.esSuperUsuario() ? 'Descargar Informe y Excel' : 'Ver Informe del Evento' }}</span>
              </button>

              @if (emergency.esSuperUsuario()) {
                <button 
                  (click)="simularAlerta()"
                  class="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-105"
                  title="Hacer sonar alarma de alerta en todos los sectores"
                >
                  <svg class="w-4 h-4 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                  <span>Sirena General</span>
                </button>
              }
            </div>
          </div>
        </div>
      }

      <!-- ============================================================== -->
      <!-- FILA 1: TARJETAS RESUMEN (KPIs DINÁMICOS TIPO LEGO) -->
      <!-- ============================================================== -->
      @if (customizer.config().visibilidad.tarjetasKPI) {
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-black tracking-wider uppercase flex items-center gap-1.5" [style.color]="customizer.config().tema.colorPrimario">
              <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
              <span>Resumen Rápido del Operativo</span>
            </h3>

            @if (emergency.esSuperUsuario()) {
              <button 
                (click)="abrirNuevoKpi()"
                class="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 border border-amber-500 text-xs font-black cursor-pointer shadow-xs flex items-center gap-1.5 transition-all hover:scale-105"
              >
                <span>+ Añadir Contador</span>
              </button>
            }
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            @for (kpi of customizer.config().kpis; track kpi.id) {
              <div 
                class="rounded-xl p-4 shadow-sm border flex flex-col justify-between transition-all group relative overflow-hidden"
                [style.backgroundColor]="customizer.config().tema.colorTarjeta"
                [style.borderColor]="customizer.config().tema.colorBorde"
                [style.color]="customizer.config().tema.colorTexto"
              >
                <div class="flex items-start justify-between gap-1" [style.color]="customizer.config().tema.colorTextoSecundario">
                  <span class="text-xs font-bold tracking-wide uppercase truncate max-w-[140px]" [title]="kpi.titulo">
                    {{ kpi.titulo }}
                  </span>
                  
                  <div class="flex items-center gap-1">
                    <span 
                      class="text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono"
                      [ngClass]="{
                        'bg-emerald-50 text-emerald-800 border-emerald-300': kpi.badgeColor === 'emerald',
                        'bg-amber-50 text-amber-800 border-amber-300': kpi.badgeColor === 'amber',
                        'bg-cyan-50 text-cyan-800 border-cyan-300': kpi.badgeColor === 'cyan',
                        'bg-red-50 text-red-800 border-red-300': kpi.badgeColor === 'red',
                        'bg-purple-50 text-purple-800 border-purple-300': kpi.badgeColor === 'purple'
                      }"
                    >
                      {{ kpi.badgeTexto }}
                    </span>

                    @if (emergency.esSuperUsuario()) {
                      <div class="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button (click)="customizer.moverKpi(kpi.id, 'izq')" class="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] cursor-pointer" title="Mover a la izquierda">◀</button>
                        <button (click)="customizer.moverKpi(kpi.id, 'der')" class="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] cursor-pointer" title="Mover a la derecha">▶</button>
                        <button (click)="editarKpi(kpi)" class="p-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-900 text-[10px] font-bold cursor-pointer" title="Cambiar este contador">✎</button>
                        <button (click)="customizer.eliminarKpi(kpi.id)" class="p-1 rounded bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-bold cursor-pointer" title="Quitar contador">✕</button>
                      </div>
                    }
                  </div>
                </div>

                <div class="mt-3 flex items-baseline justify-between">
                  <span class="text-4xl font-black font-mono" [style.color]="kpi.colorValor || customizer.config().tema.colorPrimario">
                    {{ getKpiValor(kpi) }}
                  </span>
                  <div class="text-right">
                    <span class="text-xs font-bold block" [style.color]="customizer.config().tema.colorPrimario">
                      {{ getKpiSubtitulo1(kpi) }}
                    </span>
                    <span class="text-[11px] opacity-75 block">
                      {{ getKpiSubtitulo2(kpi) }}
                    </span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ============================================================== -->
      <!-- FILA 2: LIENZO ANALÍTICO INTERACTIVO POWER BI (GRÁFICOS SVG) -->
      <!-- ============================================================== -->
      @if (customizer.config().recuadrosPersonalizados.length > 0) {
        <div class="space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 class="text-xs font-black tracking-wider uppercase flex items-center gap-1.5" [style.color]="customizer.config().tema.colorPrimario">
                <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"/>
                </svg>
                <span>Gráficos Interactivos del Evento (Toca cualquier color o barra para filtrar pacientes)</span>
              </h3>
            </div>

            @if (emergency.esSuperUsuario()) {
              <button 
                (click)="abrirNuevoWidget()"
                class="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 border border-amber-500 text-xs font-black cursor-pointer shadow-xs flex items-center gap-1.5 transition-all hover:scale-105"
              >
                <span>+ Añadir Nuevo Gráfico o Nota</span>
              </button>
            }
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            @for (widget of customizer.config().recuadrosPersonalizados; track widget.id) {
              <div 
                class="rounded-xl p-4 shadow-sm border relative overflow-hidden transition-all flex flex-col justify-between"
                [ngClass]="{
                  'lg:col-span-1': !widget.colSpan || widget.colSpan === 1,
                  'lg:col-span-2': widget.colSpan === 2,
                  'lg:col-span-3': widget.colSpan === 3
                }"
                [style.backgroundColor]="customizer.config().tema.colorTarjeta"
                [style.borderColor]="customizer.config().tema.colorBorde"
                [style.color]="customizer.config().tema.colorTexto"
              >
                <!-- Cabecera del Bloque + Botones "Tipo LEGO" para Super Usuario -->
                <div class="flex items-start justify-between gap-2 border-b pb-2.5 mb-3" [style.borderColor]="customizer.config().tema.colorBorde">
                  <div>
                    <h4 class="text-xs font-black uppercase tracking-wider" [style.color]="customizer.config().tema.colorPrimario">
                      {{ widget.titulo }}
                    </h4>
                    <span class="text-[10px] opacity-75 block mt-0.5">
                      {{ widget.subtitulo || widget.contenido || 'Toca un elemento para filtrar en vivo' }}
                    </span>
                  </div>

                  <!-- BARRA LEGO DE EDICIÓN RÁPIDA EN 1 CLIC -->
                  @if (emergency.esSuperUsuario()) {
                    <div class="flex items-center gap-1 flex-shrink-0">
                      <button 
                        (click)="customizer.moverWidget(widget.id, 'arriba')"
                        class="px-1.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                        title="Mover bloque hacia la izquierda / arriba"
                      >◀</button>
                      <button 
                        (click)="customizer.moverWidget(widget.id, 'abajo')"
                        class="px-1.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold cursor-pointer"
                        title="Mover bloque hacia la derecha / abajo"
                      >▶</button>
                      <button 
                        (click)="customizer.rotarTipoVisualWidget(widget.id)"
                        class="px-2 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 text-[10px] font-bold cursor-pointer"
                        title="Cambiar tipo de gráfico en 1 clic (Dona / Barras / Curva / Medidor / Nota)"
                      >
                        Cambiar Gráfico
                      </button>
                      <button 
                        (click)="customizer.rotarTamanoWidget(widget.id)"
                        class="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-mono font-bold cursor-pointer"
                        title="Cambiar tamaño del bloque (1 Columna, 2 Columnas o Pantalla Completa)"
                      >
                        Ancho {{ widget.colSpan || 1 }}/3
                      </button>
                      <button 
                        (click)="editarWidget(widget)"
                        class="p-1 px-1.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-900 border border-amber-500 cursor-pointer font-bold text-[10px]"
                        title="Configurar título y detalles"
                      >✎</button>
                      <button 
                        (click)="customizer.eliminarRecuadroPersonalizado(widget.id)"
                        class="p-1 px-1.5 rounded bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 cursor-pointer font-bold text-[10px]"
                        title="Quitar este gráfico"
                      >✕</button>
                    </div>
                  }
                </div>

                <!-- ==================================================== -->
                <!-- 1. GRÁFICO DE DONA SVG REACTIVO (TRIAGE START) -->
                <!-- ==================================================== -->
                @if (widget.visualType === 'grafico_dona' || !widget.visualType) {
                  <div class="flex flex-col sm:flex-row items-center justify-around gap-4 my-auto py-2">
                    
                    <!-- Anillo SVG Vectorial -->
                    <div class="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
                      <svg class="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="38" fill="transparent" stroke="#e2e8f0" stroke-width="14"></circle>
                        @for (seg of segmentosDonaTriage(); track seg.color) {
                          <circle 
                            cx="50" cy="50" r="38" 
                            fill="transparent"
                            [attr.stroke]="seg.hex"
                            stroke-width="14"
                            [attr.stroke-dasharray]="seg.dashArray"
                            [attr.stroke-dashoffset]="seg.dashOffset"
                            class="cursor-pointer transition-all duration-500 hover:opacity-80"
                            (click)="toggleFiltroTriage(seg.color)"
                          ></circle>
                        }
                      </svg>
                      <div class="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                        <span class="text-2xl font-black font-mono leading-none">{{ emergency.atenciones().length }}</span>
                        <span class="text-[9px] uppercase font-bold opacity-70 mt-0.5">Pacientes</span>
                      </div>
                    </div>

                    <!-- Botones de Leyenda Interactiva (Cross-Filter) -->
                    <div class="grid grid-cols-2 sm:grid-cols-1 gap-1.5 w-full max-w-xs">
                      @for (t of metricasTriage(); track t.color) {
                        <button 
                          (click)="toggleFiltroTriage(t.color)"
                          [class.ring-2]="filtroTriagePowerBI() === t.color"
                          class="px-3 py-1.5 rounded-lg border text-left cursor-pointer transition-all flex items-center justify-between text-xs"
                          [ngClass]="t.clases"
                        >
                          <div class="flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full flex-shrink-0" [style.backgroundColor]="t.hex"></span>
                            <span class="font-black text-[11px]">{{ t.etiqueta }}</span>
                          </div>
                          <span class="font-mono font-black text-xs">{{ t.cantidad }} ({{ t.porcentaje }}%)</span>
                        </button>
                      }
                    </div>
                  </div>
                }

                <!-- ==================================================== -->
                <!-- 2. GRÁFICO DE BARRAS INTERACTIVO POR ZONA -->
                <!-- ==================================================== -->
                @else if (widget.visualType === 'grafico_barras') {
                  <div class="space-y-2.5 my-auto py-1">
                    @for (sec of emergency.sectores(); track sec.id) {
                      <div 
                        (click)="toggleFiltroSector(sec.id)"
                        [class.ring-2]="filtroSectorPowerBI() === sec.id"
                        class="p-2.5 rounded-xl cursor-pointer transition-all hover:scale-[1.01] ring-amber-500 border"
                        [style.backgroundColor]="customizer.config().tema.colorTarjetaSecundaria"
                        [style.borderColor]="customizer.config().tema.colorBorde"
                      >
                        <div class="flex justify-between items-center text-xs font-bold mb-1.5">
                          <span class="truncate">{{ sec.nombre }}</span>
                          <div class="flex items-center gap-2 font-mono">
                            @if (sec.alertasActivas > 0) {
                              <span class="px-1.5 py-0.2 bg-red-600 text-white rounded text-[10px] font-black">
                                {{ sec.alertasActivas }} Crítico
                              </span>
                            }
                            <span class="font-black">{{ sec.totalAtenciones }} pac.</span>
                          </div>
                        </div>
                        <div class="w-full h-3 bg-black/10 rounded-full overflow-hidden">
                          <div 
                            class="h-full rounded-full transition-all duration-500"
                            [style.backgroundColor]="sec.alertasActivas > 0 ? '#dc2626' : customizer.config().tema.colorPrimario"
                            [style.width.%]="calcularPorcentajeBarra(sec.totalAtenciones)"
                          ></div>
                        </div>
                      </div>
                    }
                  </div>
                }

                <!-- ==================================================== -->
                <!-- 3. CURVA HORARIA SVG + TOP DIAGNÓSTICOS CLÍNICOS -->
                <!-- ==================================================== -->
                @else if (widget.visualType === 'curva_tendencia') {
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center my-auto py-1">
                    
                    <!-- Gráfico SVG de Área Horaria -->
                    <div class="p-3 rounded-xl border" [style.backgroundColor]="customizer.config().tema.colorTarjetaSecundaria" [style.borderColor]="customizer.config().tema.colorBorde">
                      <div class="flex items-center justify-between text-[11px] font-bold mb-2">
                        <span>Flujo de Atenciones en el Tiempo</span>
                        <span class="font-mono text-emerald-700 font-black">Pico: {{ emergency.atenciones().length }} casos</span>
                      </div>
                      <svg class="w-full h-28 overflow-visible" viewBox="0 0 240 80">
                        <defs>
                          <linearGradient id="gradCurva" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" [attr.stop-color]="customizer.config().tema.colorPrimario" stop-opacity="0.45"/>
                            <stop offset="100%" [attr.stop-color]="customizer.config().tema.colorPrimario" stop-opacity="0.0"/>
                          </linearGradient>
                        </defs>
                        <!-- Área bajo la curva -->
                        <polygon [attr.points]="puntosPoligonoCurva()" fill="url(#gradCurva)"></polygon>
                        <!-- Línea de tendencia -->
                        <polyline 
                          fill="none" 
                          [attr.stroke]="customizer.config().tema.colorPrimario" 
                          stroke-width="3" 
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          [attr.points]="puntosLineaCurva()"
                        ></polyline>
                      </svg>
                      <div class="flex justify-between text-[10px] font-mono opacity-70 mt-1">
                        <span>16:00</span>
                        <span>17:00</span>
                        <span>18:00</span>
                        <span>19:00</span>
                        <span>Actual</span>
                      </div>
                    </div>

                    <!-- Top Causas Clínicas (Clicables para filtrar) -->
                    <div class="space-y-2">
                      <span class="text-[11px] font-black uppercase block opacity-80">Principales Causas (Toca para filtrar):</span>
                      @for (m of metricasMotivos(); track m.motivo) {
                        <div 
                          (click)="toggleFiltroMotivo(m.motivo)"
                          [class.ring-2]="filtroMotivoPowerBI() === m.motivo"
                          class="p-2 rounded-lg cursor-pointer transition-all hover:opacity-90 ring-amber-500 border"
                          [style.backgroundColor]="customizer.config().tema.colorTarjetaSecundaria"
                          [style.borderColor]="customizer.config().tema.colorBorde"
                        >
                          <div class="flex justify-between text-xs font-bold mb-1">
                            <span>{{ m.motivo }}</span>
                            <span class="font-mono font-black">{{ m.cantidad }} ({{ m.porcentaje }}%)</span>
                          </div>
                          <div class="w-full h-2 bg-black/10 rounded-full overflow-hidden">
                            <div class="h-full bg-amber-500 rounded-full transition-all duration-500" [style.width.%]="m.porcentaje"></div>
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- ==================================================== -->
                <!-- 4. MEDIDOR RADIAL (GAUGE SVG) DE CAMILLAS ACV 1 Y 2 -->
                <!-- ==================================================== -->
                @else if (widget.visualType === 'gauge_radial') {
                  <div class="space-y-3 my-auto py-1">
                    @for (acv of emergency.acvs(); track acv.id) {
                      <div class="p-3 rounded-xl border" [style.borderColor]="customizer.config().tema.colorBorde" [style.backgroundColor]="customizer.config().tema.colorTarjetaSecundaria">
                        <div class="flex justify-between items-center text-xs font-bold mb-1.5">
                          <span>{{ acv.nombre }}</span>
                          <span class="font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-black">
                            {{ contarPacientesEnAcv(acv.id) }} / {{ acv.capacidadCamillas }} camillas
                          </span>
                        </div>
                        <div class="w-full h-3 bg-black/10 rounded-full overflow-hidden">
                          <div 
                            class="h-full rounded-full transition-all duration-500"
                            [ngClass]="contarPacientesEnAcv(acv.id) >= acv.capacidadCamillas ? 'bg-red-600' : 'bg-emerald-600'"
                            [style.width.%]="(contarPacientesEnAcv(acv.id) / acv.capacidadCamillas) * 100"
                          ></div>
                        </div>
                        <div class="flex justify-between text-[10px] opacity-75 mt-1">
                          <span>Médico: {{ acv.encargado }}</span>
                          <span>Ubicación: {{ acv.ubicacion }}</span>
                        </div>
                      </div>
                    }
                  </div>
                }

                <!-- ==================================================== -->
                <!-- 5. NOTA / CONSIGNA OPERATIVA DE TEXTO CLARO -->
                <!-- ==================================================== -->
                @else {
                  <div class="p-3 rounded-xl border my-auto text-xs leading-relaxed whitespace-pre-line font-sans"
                       [style.backgroundColor]="customizer.config().tema.colorTarjetaSecundaria"
                       [style.borderColor]="customizer.config().tema.colorBorde">
                    {{ widget.contenido || 'Escribe aquí instrucciones, teléfonos de respaldo o frecuencias de radio.' }}
                  </div>
                }

              </div>
            }
          </div>
        </div>
      }

      <!-- ============================================================== -->
      <!-- FILA 3: TARJETAS DE ZONAS DEL RECINTO (CLICABLES) -->
      <!-- ============================================================== -->
      @if (customizer.config().visibilidad.sectoresOperativos) {
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xs font-black tracking-wider uppercase flex items-center gap-1.5" [style.color]="customizer.config().tema.colorPrimario">
                <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Zonas del Recinto (Toca cualquier zona para filtrar sus emergencias)</span>
              </h3>
            </div>

            @if (emergency.esSuperUsuario()) {
              <button 
                (click)="abrirNuevoSector()"
                class="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-900 border border-amber-500 text-xs font-black cursor-pointer shadow-xs flex items-center gap-1.5 transition-all hover:scale-105"
              >
                <span>+ Agregar Nueva Zona</span>
              </button>
            }
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            @for (sec of emergency.sectores(); track sec.id) {
              <div 
                (click)="toggleFiltroSector(sec.id)"
                [class.ring-4]="filtroSectorPowerBI() === sec.id"
                class="rounded-xl p-4 shadow-sm border transition-all group relative overflow-hidden cursor-pointer hover:scale-[1.01] ring-amber-400"
                [style.backgroundColor]="customizer.config().tema.colorTarjeta"
                [style.borderColor]="customizer.config().tema.colorBorde"
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

                      @if (emergency.esSuperUsuario()) {
                        <div class="flex items-center gap-1" (click)="$event.stopPropagation()">
                          <button 
                            (click)="editarSector(sec)"
                            class="p-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-900 border border-amber-500 cursor-pointer text-[10px] font-bold"
                            title="Editar Zona"
                          >✎</button>
                          <button 
                            (click)="emergency.eliminarSector(sec.id)"
                            class="p-1 rounded bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 cursor-pointer text-[10px] font-bold"
                            title="Eliminar Zona"
                          >✕</button>
                        </div>
                      }
                    </div>

                    <h4 class="text-sm font-bold mt-2">{{ sec.nombre }}</h4>
                  </div>
                  <div class="w-2.5 h-2.5 rounded-full" [ngClass]="sec.alertasActivas > 0 ? 'bg-red-600 animate-ping' : 'bg-emerald-500'"></div>
                </div>

                <div class="grid grid-cols-3 gap-2 mt-4 pt-3 border-t text-center font-mono" [style.borderColor]="customizer.config().tema.colorBorde">
                  <div>
                    <span class="text-[10px] opacity-75 block">Brigadistas</span>
                    <span class="text-base font-bold" [style.color]="customizer.config().tema.colorPrimario">0{{ sec.personalAsignado.length }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] opacity-75 block">Pacientes</span>
                    <span class="text-base font-bold text-amber-500">0{{ sec.totalAtenciones }}</span>
                  </div>
                  <div>
                    <span class="text-[10px] opacity-75 block">Críticos</span>
                    <span class="text-base font-bold" [ngClass]="sec.alertasActivas > 0 ? 'text-red-600' : 'opacity-40'">
                      0{{ sec.alertasActivas }}
                    </span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ============================================================== -->
      <!-- FILA 4: TABLA NOMINAL DE PACIENTES (RESPONDE AL FILTRO POWER BI) -->
      <!-- ============================================================== -->
      @if (customizer.config().visibilidad.tablaActividad) {
        <div 
          class="rounded-xl shadow-sm border overflow-hidden transition-all"
          [style.backgroundColor]="customizer.config().tema.colorTarjeta"
          [style.borderColor]="customizer.config().tema.colorBorde"
        >
          <div class="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3" [style.borderColor]="customizer.config().tema.colorBorde">
            <div>
              <h3 class="text-sm font-black tracking-wider uppercase" [style.color]="customizer.config().tema.colorTexto">
                Pacientes Registrados ({{ atencionesFiltradas().length }})
              </h3>
              <p class="text-xs opacity-75 font-sans">
                Actualización automática desde celulares de brigadistas, puestos médicos ACV y ambulancias
              </p>
            </div>

            <div class="flex items-center gap-2 text-xs font-bold">
              <span class="opacity-75">Ver estado:</span>
              <select 
                (change)="filtrarEstado($event)"
                class="rounded-lg p-1.5 border text-xs font-bold"
                [style.backgroundColor]="customizer.config().tema.colorTarjetaSecundaria"
                [style.borderColor]="customizer.config().tema.colorBorde"
                [style.color]="customizer.config().tema.colorTexto"
              >
                <option value="TODOS">Todos los Pacientes</option>
                <option value="EN_ATENCION">En Atención en Campo</option>
                <option value="PENDIENTE_TRIAGE">Rumbo o en Triage ACV</option>
                <option value="EN_CONSULTA">En Consulta Médica ACV</option>
                <option value="TRASLADO_HOSPITALARIO">Trasladados a Hospital</option>
                <option value="ALTA_IN_SITU">Altas Médicas</option>
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
                  <th class="py-3 px-4">Ficha</th>
                  <th class="py-3 px-4">Paciente</th>
                  <th class="py-3 px-4">Zona</th>
                  <th class="py-3 px-4">Brigadista / Médico</th>
                  <th class="py-3 px-4">Causa / Prioridad Triage</th>
                  <th class="py-3 px-4 text-right">Hora</th>
                </tr>
              </thead>
              <tbody class="divide-y" [style.borderColor]="customizer.config().tema.colorBorde">
                @for (atencion of atencionesFiltradas(); track atencion.id) {
                  <tr class="hover:opacity-90 transition-opacity">
                    <td class="py-3 px-4 font-bold" [style.color]="customizer.config().tema.colorPrimario">
                      {{ atencion.codigo }}
                    </td>
                    <td class="py-3 px-4 font-sans font-bold" [style.color]="customizer.config().tema.colorTexto">
                      {{ atencion.nombresPaciente || 'Paciente' }} {{ atencion.apellidosPaciente || '' }}
                      <span class="text-[10px] opacity-75 font-mono block">C.I.: {{ atencion.cedula || 'S/N' }} • Edad: {{ atencion.edadPaciente || '--' }} años</span>
                    </td>
                    <td class="py-3 px-4 font-sans">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold border"
                            [style.backgroundColor]="customizer.config().tema.colorTarjetaSecundaria"
                            [style.borderColor]="customizer.config().tema.colorBorde">
                        {{ atencion.sectorNombre }}
                      </span>
                    </td>
                    <td class="py-3 px-4 font-sans opacity-90">
                      {{ atencion.paramedicoNombre }}
                    </td>
                    <td class="py-3 px-4 font-sans">
                      <span [style.color]="customizer.config().tema.colorTexto">{{ atencion.motivo }}</span>
                      @if (atencion.triage) {
                        <span 
                          class="ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-xs"
                          [ngClass]="{
                            'bg-red-600 text-white': atencion.triage === 'ROJO',
                            'bg-amber-500 text-black': atencion.triage === 'AMARILLO',
                            'bg-emerald-600 text-white': atencion.triage === 'VERDE',
                            'bg-slate-800 text-white': atencion.triage === 'NEGRO'
                          }"
                        >
                          {{ atencion.triage }}
                        </span>
                      }
                    </td>
                    <td class="py-3 px-4 text-right font-semibold opacity-75">
                      {{ atencion.horaInicio }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

    </div>

    <app-quick-edit-modal #quickEditor></app-quick-edit-modal>
  `
})
export class DashboardComponent {
  emergency = inject(EmergencyService);
  customizer = inject(CustomizerService);
  filtroEstadoSeleccionado = 'TODOS';

  // Signals de Filtrado Cruzado (Cross-Filtering estilo Power BI)
  filtroTriagePowerBI = signal<TriageColor | null>(null);
  filtroSectorPowerBI = signal<string | null>(null);
  filtroMotivoPowerBI = signal<string | null>(null);

  @ViewChild('quickEditor') quickEditor!: QuickEditModalComponent;

  tieneFiltrosInteractivos = computed(() => 
    Boolean(this.filtroTriagePowerBI() || this.filtroSectorPowerBI() || this.filtroMotivoPowerBI())
  );

  toggleFiltroTriage(color: TriageColor) {
    this.filtroTriagePowerBI.update(actual => actual === color ? null : color);
  }

  toggleFiltroSector(sectorId: string) {
    this.filtroSectorPowerBI.update(actual => actual === sectorId ? null : sectorId);
  }

  toggleFiltroMotivo(motivo: string) {
    this.filtroMotivoPowerBI.update(actual => actual === motivo ? null : motivo);
  }

  limpiarFiltrosPowerBI() {
    this.filtroTriagePowerBI.set(null);
    this.filtroSectorPowerBI.set(null);
    this.filtroMotivoPowerBI.set(null);
  }

  obtenerNombreSectorFiltro(): string {
    const id = this.filtroSectorPowerBI();
    return this.emergency.sectores().find(s => s.id === id)?.codigo || 'Zona';
  }

  // Cálculo de métricas y porcentajes por Triage START
  metricasTriage = computed(() => {
    const total = this.emergency.atenciones().length || 1;
    const contar = (c: TriageColor) => this.emergency.atenciones().filter(a => (a.triage || 'VERDE') === c).length;
    return [
      { color: 'ROJO' as TriageColor, etiqueta: 'ROJO (Inmediato)', hex: '#dc2626', cantidad: contar('ROJO'), porcentaje: Math.round((contar('ROJO') * 100) / total), clases: 'bg-red-50 border-red-300 text-red-950 ring-red-600' },
      { color: 'AMARILLO' as TriageColor, etiqueta: 'AMARILLO (Urgente)', hex: '#f59e0b', cantidad: contar('AMARILLO'), porcentaje: Math.round((contar('AMARILLO') * 100) / total), clases: 'bg-amber-50 border-amber-300 text-amber-950 ring-amber-500' },
      { color: 'VERDE' as TriageColor, etiqueta: 'VERDE (Leve)', hex: '#10b981', cantidad: contar('VERDE'), porcentaje: Math.round((contar('VERDE') * 100) / total), clases: 'bg-emerald-50 border-emerald-300 text-emerald-950 ring-emerald-600' },
      { color: 'NEGRO' as TriageColor, etiqueta: 'NEGRO (Expectante)', hex: '#1e293b', cantidad: contar('NEGRO'), porcentaje: Math.round((contar('NEGRO') * 100) / total), clases: 'bg-slate-100 border-slate-300 text-slate-900 ring-slate-700' }
    ];
  });

  // Cálculo trigonométrico de arcos SVG para el Gráfico de Dona (circunferencia 2*PI*38 ≈ 238.76)
  segmentosDonaTriage = computed(() => {
    const C = 2 * Math.PI * 38;
    const metricas = this.metricasTriage();
    const total = this.emergency.atenciones().length || 1;
    let acumulado = 0;

    return metricas.map(m => {
      const proporcion = m.cantidad / total;
      const longitudArco = proporcion * C;
      const dashArray = `${longitudArco} ${C - longitudArco}`;
      const dashOffset = -acumulado;
      acumulado += longitudArco;
      return {
        color: m.color,
        hex: m.hex,
        dashArray,
        dashOffset
      };
    });
  });

  // Cálculo de coordenadas SVG para la Curva de Tendencia
  puntosLineaCurva = computed(() => {
    const tot = this.emergency.atenciones().length;
    const p1 = Math.max(10, 65 - tot * 2);
    const p2 = Math.max(10, 50 - tot * 3);
    const p3 = Math.max(8, 35 - tot * 4);
    const p4 = Math.max(5, 22 - tot * 3);
    return `0,68 60,${p1} 120,${p2} 180,${p3} 240,${p4}`;
  });

  puntosPoligonoCurva = computed(() => {
    return `0,78 ${this.puntosLineaCurva()} 240,78`;
  });

  metricasMotivos = computed(() => {
    const lista = this.emergency.atenciones();
    const total = lista.length || 1;
    const mapa = new Map<string, number>();
    lista.forEach(a => {
      mapa.set(a.motivo, (mapa.get(a.motivo) || 0) + 1);
    });
    return Array.from(mapa.entries())
      .map(([motivo, cantidad]) => ({
        motivo,
        cantidad,
        porcentaje: Math.round((cantidad * 100) / total)
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 3);
  });

  calcularPorcentajeBarra(valor: number): number {
    const total = this.emergency.atenciones().length || 1;
    return Math.min(100, Math.max(10, Math.round((valor * 100) / total)));
  }

  contarPacientesEnAcv(acvId: string): number {
    return this.emergency.atenciones().filter(a => 
      a.acvDestinoId === acvId && 
      (a.estado === 'EN_CONSULTA' || a.estado === 'EN_SALA_ESPERA' || a.estado === 'PENDIENTE_TRIAGE' || a.estado === 'OBSERVACION')
    ).length;
  }

  filtrarEstado(event: Event) {
    this.filtroEstadoSeleccionado = (event.target as HTMLSelectElement).value;
  }

  atencionesFiltradas(): Atencion[] {
    let lista = this.emergency.atenciones();

    if (this.filtroTriagePowerBI()) {
      lista = lista.filter(a => (a.triage || 'VERDE') === this.filtroTriagePowerBI());
    }
    if (this.filtroSectorPowerBI()) {
      const sec = this.emergency.sectores().find(s => s.id === this.filtroSectorPowerBI());
      lista = lista.filter(a => a.sectorId === this.filtroSectorPowerBI() || (sec && a.sectorNombre.toLowerCase().includes(sec.codigo.toLowerCase())));
    }
    if (this.filtroMotivoPowerBI()) {
      lista = lista.filter(a => a.motivo === this.filtroMotivoPowerBI());
    }

    if (this.filtroEstadoSeleccionado === 'TODOS') return lista;
    if (this.filtroEstadoSeleccionado === 'EN_ATENCION') {
      return lista.filter(a => a.estado === 'EN_ATENCION' || a.estado === 'EN_CONSULTA' || a.estado === 'PENDIENTE_TRIAGE');
    }
    if (this.filtroEstadoSeleccionado === 'ALTA_IN_SITU') {
      return lista.filter(a => a.estado === 'ALTA_IN_SITU' || a.estado === 'ALTA_AMBULANCIA' || a.estado === 'ALTA_ACV');
    }
    return lista.filter(a => a.estado === this.filtroEstadoSeleccionado);
  }

  abrirReporte() {
    window.dispatchEvent(new CustomEvent('abrir-modal-reporte'));
  }

  abrirNuevoKpi() {
    this.quickEditor.abrir({
      tipo: 'nuevo_kpi',
      tituloModal: 'Añadir Nuevo Contador Rápido',
      kpiTitulo: '',
      kpiBadgeTexto: 'EN VIVO',
      kpiBadgeColor: 'emerald',
      kpiTipoValor: 'metrica_atenciones',
      kpiValorManual: '00',
      kpiSubtitulo1: 'Registrados',
      kpiSubtitulo2: 'En seguimiento'
    });
  }

  editarKpi(kpi: DynamicKpi) {
    this.quickEditor.abrir({
      tipo: 'kpi',
      id: kpi.id,
      tituloModal: `Configurar Contador: ${kpi.titulo}`,
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
      const act = this.atencionesFiltradas().length;
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

  abrirNuevoSector() {
    const siguienteLetra = String.fromCharCode(65 + this.emergency.sectores().length);
    this.quickEditor.abrir({
      tipo: 'nuevo_sector',
      tituloModal: 'Agregar Nueva Zona al Evento',
      sectorCodigo: `ZONA ${siguienteLetra}`,
      sectorNombre: `ZONA ${siguienteLetra} - NUEVO SECTOR`,
      sectorCapacidad: 4
    });
  }

  editarSector(sec: Sector) {
    this.quickEditor.abrir({
      tipo: 'sector',
      id: sec.id,
      tituloModal: `Configurar Zona: ${sec.codigo}`,
      sectorCodigo: sec.codigo,
      sectorNombre: sec.nombre,
      sectorCapacidad: sec.capacidadPersonal
    });
  }

  editarEvento() {
    this.quickEditor.abrir({
      tipo: 'evento',
      tituloModal: 'Cambiar Datos del Evento Masivo',
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
      tipo: 'nuevo_widget',
      tituloModal: 'Añadir Nuevo Gráfico o Nota',
      widgetTitulo: 'Gravedad de Pacientes (Triage START)',
      widgetContenido: 'Toca un elemento para filtrar la pantalla',
      widgetVisualType: 'grafico_dona',
      widgetDataSource: 'triage_distribucion',
      widgetColSpan: 1
    });
  }

  editarWidget(w: CustomWidget) {
    this.quickEditor.abrir({
      tipo: 'widget',
      id: w.id,
      tituloModal: `Personalizar Bloque: ${w.titulo}`,
      widgetTitulo: w.titulo,
      widgetContenido: w.contenido,
      widgetIcono: w.icono,
      widgetVisualType: w.visualType || 'grafico_dona',
      widgetDataSource: w.dataSource || 'triage_distribucion',
      widgetColSpan: w.colSpan || 1
    });
  }

  simularAlerta() {
    if (!this.emergency.esSuperUsuario()) return;
    if (confirm('¿Deseas hacer sonar la Sirena de Alerta General en el Puesto de Mando?')) {
      this.emergency.playTacticalAlertTone(950, 0.4);
      this.emergency.mostrarNotificacion('SIRENA GENERAL ACTIVADA: Todas las zonas en alerta.', 'alerta');
    }
  }
}
