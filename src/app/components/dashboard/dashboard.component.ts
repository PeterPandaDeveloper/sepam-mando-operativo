import { Component, inject, ViewChild } from '@angular/core';
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
                <span>{{ emergency.esSuperUsuario() ? '📋 Generar Reporte' : '👁️ Ver Reporte' }}</span>
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
                title="Añadir una nueva tarjeta de métrica o KPI personalizado"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                </svg>
                <span>+ Agregar KPI</span>
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
                <!-- Cabecera de la tarjeta: Título, Badge y Botones de Edición -->
                <div class="flex items-start justify-between gap-1" [style.color]="customizer.config().tema.colorTextoSecundario">
                  <span class="text-xs font-bold tracking-wide uppercase truncate max-w-[130px]" [title]="kpi.titulo">
                    {{ kpi.titulo }}
                  </span>
                  
                  <div class="flex items-center gap-1.5">
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

                    <!-- LÁPIZ Y BORRADO DE KPI (Solo Super Usuario con SVG nítidos) -->
                    @if (emergency.esSuperUsuario()) {
                      <div class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button 
                          (click)="editarKpi(kpi)"
                          class="p-1 rounded bg-amber-400 hover:bg-amber-300 text-slate-900 border border-amber-500 cursor-pointer shadow-xs transition-all hover:scale-110"
                          title="Modificar este indicador KPI"
                        >
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button 
                          (click)="customizer.eliminarKpi(kpi.id)"
                          class="p-1 rounded bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 cursor-pointer shadow-xs transition-all hover:scale-110"
                          title="Eliminar este indicador"
                        >
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    }
                  </div>
                </div>

                <!-- Valor Principal y Subtítulos -->
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

      <!-- Recuadros Personalizados (Añadidos en tiempo real por el Super Usuario) -->
      @if (customizer.config().recuadrosPersonalizados.length > 0) {
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold tracking-wider uppercase flex items-center gap-1.5" [style.color]="customizer.config().tema.colorPrimario">
              <span>📌</span>
              <span>Módulos de Información y Consignas Operativas</span>
            </h3>
            @if (emergency.esSuperUsuario()) {
              <span class="text-[10px] text-amber-500 font-bold px-2 py-0.5 rounded border border-amber-300" [style.backgroundColor]="customizer.config().tema.colorTarjetaSecundaria">
                Super Usuario: Edición activa
              </span>
            }
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (widget of customizer.config().recuadrosPersonalizados; track widget.id) {
              <div 
                class="rounded-xl p-4 shadow-sm border relative overflow-hidden transition-all"
                [style.backgroundColor]="customizer.config().tema.colorTarjeta"
                [style.borderColor]="customizer.config().tema.colorBorde"
                [style.color]="customizer.config().tema.colorTexto"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <span class="text-xl p-1.5 rounded-lg" [style.backgroundColor]="customizer.config().tema.colorTarjetaSecundaria">{{ widget.icono }}</span>
                    <h4 class="text-xs font-black uppercase tracking-wider" [style.color]="customizer.config().tema.colorPrimario">{{ widget.titulo }}</h4>
                  </div>
                  @if (emergency.esSuperUsuario()) {
                    <div class="flex items-center gap-1">
                      <button 
                        (click)="editarWidget(widget)"
                        class="p-1 px-1.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-900 border border-amber-500 cursor-pointer shadow-xs transition-all hover:scale-105"
                        title="Editar contenido de este recuadro"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button 
                        (click)="customizer.eliminarRecuadroPersonalizado(widget.id)"
                        class="p-1 px-1.5 rounded bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 cursor-pointer shadow-xs transition-all hover:scale-105"
                        title="Eliminar este recuadro"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  }
                </div>
                <div class="mt-3 text-xs leading-relaxed opacity-90 whitespace-pre-line font-sans" [style.color]="customizer.config().tema.colorTexto">
                  {{ widget.contenido }}
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Sectores Operativos / Secciones en Terreno (Completamente Dinámicos) -->
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
              <p class="text-[11px] opacity-75">Personal y actividad en tiempo real por cada zona del recinto</p>
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
                class="rounded-xl p-4 shadow-sm border transition-all group relative overflow-hidden"
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

                      <!-- LÁPIZ Y BORRADO DE SECTOR CON SVG NÍTIDOS (Sin emojis) -->
                      @if (emergency.esSuperUsuario()) {
                        <div class="flex items-center gap-1">
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

      <!-- Tabla de Atenciones Recientes (Fondo dinámico) -->
      @if (customizer.config().visibilidad.tablaActividad) {
        <div 
          class="rounded-xl shadow-sm border overflow-hidden transition-all"
          [style.backgroundColor]="customizer.config().tema.colorTarjeta"
          [style.borderColor]="customizer.config().tema.colorBorde"
        >
          <div class="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3" [style.borderColor]="customizer.config().tema.colorBorde">
            <div>
              <h3 class="text-sm font-bold tracking-wider uppercase" [style.color]="customizer.config().tema.colorTexto">
                Registro de Atenciones en Curso
              </h3>
              <p class="text-xs opacity-75 font-sans">
                Últimas emergencias prehospitalarias notificadas por los brigadistas de campo
              </p>
            </div>

            <!-- Filtros de Estado -->
            <div class="flex items-center gap-2 text-xs font-bold">
              <span class="opacity-75">Filtrar:</span>
              <select 
                (change)="filtrarEstado($event)"
                class="rounded-lg p-1.5 border text-xs font-bold"
                [style.backgroundColor]="customizer.config().tema.colorTarjetaSecundaria"
                [style.borderColor]="customizer.config().tema.colorBorde"
                [style.color]="customizer.config().tema.colorTexto"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="EN_CONSULTA">En Atención</option>
                <option value="TRASLADO_HOSPITALARIO">Traslado Hospitalario</option>
                <option value="ALTA_IN_SITU">Alta en Terreno</option>
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
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold border"
                            [style.backgroundColor]="customizer.config().tema.colorTarjetaSecundaria"
                            [style.borderColor]="customizer.config().tema.colorBorde">
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

                    <!-- Hora -->
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

    <!-- MODAL DE EDICIÓN RÁPIDA CON LÁPIZ PARA SUPER USUARIOS -->
    <app-quick-edit-modal #quickEditor></app-quick-edit-modal>
  `
})
export class DashboardComponent {
  emergency = inject(EmergencyService);
  customizer = inject(CustomizerService);
  filtroEstadoSeleccionado = 'TODOS';

  @ViewChild('quickEditor') quickEditor!: QuickEditModalComponent;

  filtrarEstado(event: Event) {
    const val = (event.target as HTMLSelectElement).value;
    this.filtroEstadoSeleccionado = val;
  }

  atencionesFiltradas(): Atencion[] {
    const lista = this.emergency.atenciones();
    if (this.filtroEstadoSeleccionado === 'TODOS') return lista;
    return lista.filter(a => a.estado === this.filtroEstadoSeleccionado);
  }

  abrirReporte() {
    window.dispatchEvent(new CustomEvent('abrir-modal-reporte'));
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

  // --- MÉTODOS PARA GESTIÓN DINÁMICA DE SECTORES / SECCIONES ---
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

  // --- MÉTODOS DE EVENTO Y RECUADROS ---
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

  editarWidget(w: CustomWidget) {
    this.quickEditor.abrir({
      tipo: 'widget',
      id: w.id,
      tituloModal: `Editar Recuadro: ${w.titulo}`,
      widgetTitulo: w.titulo,
      widgetContenido: w.contenido,
      widgetIcono: w.icono
    });
  }

  simularAlerta() {
    if (!this.emergency.esSuperUsuario()) {
      alert('🔒 ACCESO RESTRINGIDO: Solo los Super Usuarios (Puesto de Mando) pueden emitir una Alerta General.');
      return;
    }

    const confirmar = confirm(
      '🚨 ¿ESTÁS SEGURO QUE DESEAS EMITIR UNA ALERTA GENERAL?\n\n' +
      '• Se activarán tonos de sirena tácticos.\n' +
      '• Se solicitará reporte de estado inmediato a todos los sectores operativos.\n\n' +
      '¿Proceder con la Alerta General?'
    );

    if (confirmar) {
      this.emergency.playTacticalAlertTone(950, 0.4);
      this.emergency.mostrarNotificacion('🚨 ALERTA GENERAL EMITIDA: Todos los sectores en máxima alerta.', 'alerta');
    }
  }
}
