import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmergencyService } from '../../services/emergency.service';
import { CustomizerService, DynamicKpi, VisualType, VisualDataSource } from '../../services/customizer.service';

export type EditItemType = 'evento' | 'kpi' | 'nuevo_kpi' | 'sector' | 'nuevo_sector' | 'widget' | 'nuevo_widget' | 'header';

export interface QuickEditData {
  tipo: EditItemType;
  id?: string;
  tituloModal: string;
  nombreEvento?: string;
  ciudadSede?: string;
  lugarRecinto?: string;
  fechaHorario?: string;
  nivelRiesgo?: string;
  aforoTexto?: string;
  sectorCodigo?: string;
  sectorNombre?: string;
  sectorCapacidad?: number;
  kpiTitulo?: string;
  kpiBadgeTexto?: string;
  kpiBadgeColor?: 'emerald' | 'amber' | 'cyan' | 'red' | 'purple';
  kpiTipoValor?: 'metrica_personal' | 'metrica_atenciones' | 'metrica_traslados' | 'metrica_ambulancias' | 'manual';
  kpiValorManual?: string;
  kpiSubtitulo1?: string;
  kpiSubtitulo2?: string;
  kpiColorValor?: string;
  widgetTitulo?: string;
  widgetContenido?: string;
  widgetIcono?: string;
  widgetVisualType?: VisualType;
  widgetDataSource?: VisualDataSource;
  widgetColSpan?: 1 | 2 | 3;
  headerNombre?: string;
  headerSubtitulo?: string;
}

@Component({
  selector: 'app-quick-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (abierto()) {
      <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div class="bg-white border-2 border-[#07483b] rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl text-[#0d2822]">
          
          <div class="p-4 border-b border-[#05372d] bg-[#07483b] text-white flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-slate-900 shadow-xs">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div>
                <h3 class="text-sm font-black tracking-wide">{{ datos.tituloModal }}</h3>
                <p class="text-[11px] text-emerald-200">Edición Visual Rápida • Sin programación</p>
              </div>
            </div>
            <button (click)="cerrar()" class="text-emerald-100 hover:text-white p-1.5 text-lg font-bold cursor-pointer">✕</button>
          </div>

          <div class="p-5 space-y-4 text-xs bg-[#f5f4ed] overflow-y-auto max-h-[75vh]">
            
            <!-- EVENTO -->
            @if (datos.tipo === 'evento') {
              <div class="space-y-3">
                <div>
                  <label class="block font-bold text-[#07483b] mb-1">Nombre del Evento:</label>
                  <input type="text" [(ngModel)]="datos.nombreEvento" class="w-full p-2.5 rounded-lg border border-[#d2dfd8] bg-white font-bold text-[#0d2822]" />
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block font-bold text-[#07483b] mb-1">Ciudad:</label>
                    <input type="text" [(ngModel)]="datos.ciudadSede" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold" />
                  </div>
                  <div>
                    <label class="block font-bold text-[#07483b] mb-1">Lugar o Recinto:</label>
                    <input type="text" [(ngModel)]="datos.lugarRecinto" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold" />
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block font-bold text-[#07483b] mb-1">Fecha y Horario:</label>
                    <input type="text" [(ngModel)]="datos.fechaHorario" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white" />
                  </div>
                  <div>
                    <label class="block font-bold text-[#07483b] mb-1">Nivel de Riesgo:</label>
                    <select [(ngModel)]="datos.nivelRiesgo" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold">
                      <option value="Bajo">Bajo</option>
                      <option value="Medio">Medio</option>
                      <option value="Alto">Alto</option>
                      <option value="Extremo">Extremo</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block font-bold text-[#07483b] mb-1">Cantidad de Asistentes (Aforo):</label>
                  <input type="text" [(ngModel)]="datos.aforoTexto" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-mono" />
                </div>
              </div>
            }

            <!-- KPI -->
            @if (datos.tipo === 'kpi' || datos.tipo === 'nuevo_kpi') {
              <div class="space-y-3">
                <div>
                  <label class="block font-bold text-[#07483b] mb-1">Nombre del Contador:</label>
                  <input type="text" [(ngModel)]="datos.kpiTitulo" class="w-full p-2.5 rounded-lg border border-[#d2dfd8] bg-white font-bold uppercase" />
                </div>
                <div>
                  <label class="block font-bold text-[#07483b] mb-1">¿Qué debe contar automáticamente?:</label>
                  <select [(ngModel)]="datos.kpiTipoValor" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold">
                    <option value="metrica_atenciones">Pacientes Atendidos (Se actualiza con los filtros)</option>
                    <option value="metrica_personal">Personal Operativo en Terreno</option>
                    <option value="metrica_traslados">Pacientes en Camino al Puesto Médico (ACV)</option>
                    <option value="metrica_ambulancias">Ambulancias Activas</option>
                    <option value="manual">Escribir un número fijo manualmente</option>
                  </select>
                </div>
                @if (datos.kpiTipoValor === 'manual') {
                  <div>
                    <label class="block font-bold text-[#07483b] mb-1">Número a mostrar:</label>
                    <input type="text" [(ngModel)]="datos.kpiValorManual" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-mono text-center text-base font-black" />
                  </div>
                }
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block font-bold text-[#07483b] mb-1">Etiqueta Esquina:</label>
                    <input type="text" [(ngModel)]="datos.kpiBadgeTexto" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold uppercase" />
                  </div>
                  <div>
                    <label class="block font-bold text-[#07483b] mb-1">Color de Etiqueta:</label>
                    <select [(ngModel)]="datos.kpiBadgeColor" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold">
                      <option value="emerald">Verde</option>
                      <option value="amber">Amarillo</option>
                      <option value="cyan">Azul Celeste</option>
                      <option value="red">Rojo</option>
                      <option value="purple">Morado</option>
                    </select>
                  </div>
                </div>
              </div>
            }

            <!-- SECTOR -->
            @if (datos.tipo === 'sector' || datos.tipo === 'nuevo_sector') {
              <div class="space-y-3">
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <label class="block font-bold text-[#07483b] mb-1">Código:</label>
                    <input type="text" [(ngModel)]="datos.sectorCodigo" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-mono font-bold uppercase" />
                  </div>
                  <div class="col-span-2">
                    <label class="block font-bold text-[#07483b] mb-1">Meta de Brigadistas:</label>
                    <input type="number" [(ngModel)]="datos.sectorCapacidad" min="1" max="30" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-mono font-bold" />
                  </div>
                </div>
                <div>
                  <label class="block font-bold text-[#07483b] mb-1">Nombre de la Zona:</label>
                  <input type="text" [(ngModel)]="datos.sectorNombre" class="w-full p-2.5 rounded-lg border border-[#d2dfd8] bg-white font-bold" />
                </div>
              </div>
            }

            <!-- CONSTRUCTOR DE BLOQUES LEGO / POWER BI -->
            @if (datos.tipo === 'widget' || datos.tipo === 'nuevo_widget') {
              <div class="space-y-3.5">
                <div>
                  <label class="block font-black text-[#07483b] uppercase mb-1.5">
                    1. Elige qué tipo de gráfico quieres ver:
                  </label>
                  <div class="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      (click)="elegirTipoGrafico('grafico_dona', 'Gravedad de Pacientes (Triage START)')"
                      [class.ring-2]="datos.widgetVisualType === 'grafico_dona'"
                      [class.bg-emerald-50]="datos.widgetVisualType === 'grafico_dona'"
                      class="p-2.5 rounded-xl border border-[#d2dfd8] bg-white ring-[#07483b] text-left cursor-pointer"
                    >
                      <div class="flex items-center gap-1.5 mb-1">
                        <svg class="w-3.5 h-3.5 text-[#07483b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="9" stroke-width="2"/>
                          <path stroke-linecap="round" stroke-width="2" d="M12 3a9 9 0 019 9"/>
                        </svg>
                        <span class="font-black text-xs text-[#07483b]">Gráfico de Anillo (Triage)</span>
                      </div>
                      <span class="text-[10px] text-[#648279]">Proporción Rojo, Amarillo, Verde</span>
                    </button>

                    <button 
                      type="button"
                      (click)="elegirTipoGrafico('grafico_barras', 'Emergencias por Zona del Evento')"
                      [class.ring-2]="datos.widgetVisualType === 'grafico_barras'"
                      [class.bg-emerald-50]="datos.widgetVisualType === 'grafico_barras'"
                      class="p-2.5 rounded-xl border border-[#d2dfd8] bg-white ring-[#07483b] text-left cursor-pointer"
                    >
                      <div class="flex items-center gap-1.5 mb-1">
                        <svg class="w-3.5 h-3.5 text-[#07483b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h14"/>
                        </svg>
                        <span class="font-black text-xs text-[#07483b]">Barras por Zona</span>
                      </div>
                      <span class="text-[10px] text-[#648279]">Compara qué zona tiene más casos</span>
                    </button>

                    <button 
                      type="button"
                      (click)="elegirTipoGrafico('curva_tendencia', 'Evolución Horaria y Causas')"
                      [class.ring-2]="datos.widgetVisualType === 'curva_tendencia'"
                      [class.bg-emerald-50]="datos.widgetVisualType === 'curva_tendencia'"
                      class="p-2.5 rounded-xl border border-[#d2dfd8] bg-white ring-[#07483b] text-left cursor-pointer"
                    >
                      <div class="flex items-center gap-1.5 mb-1">
                        <svg class="w-3.5 h-3.5 text-[#07483b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                        </svg>
                        <span class="font-black text-xs text-[#07483b]">Curva de Tiempo y Causas</span>
                      </div>
                      <span class="text-[10px] text-[#648279]">Flujo por hora y diagnósticos</span>
                    </button>

                    <button 
                      type="button"
                      (click)="elegirTipoGrafico('gauge_radial', 'Ocupación de Camillas (ACV 1 y 2)')"
                      [class.ring-2]="datos.widgetVisualType === 'gauge_radial'"
                      [class.bg-emerald-50]="datos.widgetVisualType === 'gauge_radial'"
                      class="p-2.5 rounded-xl border border-[#d2dfd8] bg-white ring-[#07483b] text-left cursor-pointer"
                    >
                      <div class="flex items-center gap-1.5 mb-1">
                        <svg class="w-3.5 h-3.5 text-[#07483b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                        </svg>
                        <span class="font-black text-xs text-[#07483b]">Ocupación Camillas ACV</span>
                      </div>
                      <span class="text-[10px] text-[#648279]">Capacidad de carpas médicas</span>
                    </button>

                    <button 
                      type="button"
                      (click)="elegirTipoGrafico('texto_markdown', 'Avisos e Instrucciones del Mando')"
                      [class.ring-2]="datos.widgetVisualType === 'texto_markdown'"
                      [class.bg-emerald-50]="datos.widgetVisualType === 'texto_markdown'"
                      class="p-2.5 rounded-xl border border-[#d2dfd8] bg-white ring-[#07483b] text-left cursor-pointer col-span-2"
                    >
                      <div class="flex items-center gap-1.5 mb-1">
                        <svg class="w-3.5 h-3.5 text-[#07483b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        <span class="font-black text-xs text-[#07483b]">Cuadro de Notas / Consignas</span>
                      </div>
                      <span class="text-[10px] text-[#648279]">Texto libre para instrucciones operativas</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block font-black text-[#07483b] uppercase mb-1.5">
                    2. Tamaño del bloque en la pantalla:
                  </label>
                  <div class="grid grid-cols-3 gap-2">
                    <button 
                      type="button"
                      (click)="datos.widgetColSpan = 1"
                      [class.bg-[#07483b]]="datos.widgetColSpan === 1"
                      [class.text-white]="datos.widgetColSpan === 1"
                      [class.bg-white]="datos.widgetColSpan !== 1"
                      class="py-2 px-3 rounded-lg border border-[#d2dfd8] font-bold text-xs cursor-pointer"
                    >
                      1 Columna (1/3)
                    </button>
                    <button 
                      type="button"
                      (click)="datos.widgetColSpan = 2"
                      [class.bg-[#07483b]]="datos.widgetColSpan === 2"
                      [class.text-white]="datos.widgetColSpan === 2"
                      [class.bg-white]="datos.widgetColSpan !== 2"
                      class="py-2 px-3 rounded-lg border border-[#d2dfd8] font-bold text-xs cursor-pointer"
                    >
                      2 Columnas (2/3)
                    </button>
                    <button 
                      type="button"
                      (click)="datos.widgetColSpan = 3"
                      [class.bg-[#07483b]]="datos.widgetColSpan === 3"
                      [class.text-white]="datos.widgetColSpan === 3"
                      [class.bg-white]="datos.widgetColSpan !== 3"
                      class="py-2 px-3 rounded-lg border border-[#d2dfd8] font-bold text-xs cursor-pointer"
                    >
                      Ancho Total (100%)
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block font-bold text-[#07483b] mb-1">Título del Bloque:</label>
                  <input type="text" [(ngModel)]="datos.widgetTitulo" class="w-full p-2.5 rounded-lg border border-[#d2dfd8] bg-white font-bold" />
                </div>

                <div>
                  <label class="block font-bold text-[#07483b] mb-1">Texto o Nota Explicativa:</label>
                  <textarea [(ngModel)]="datos.widgetContenido" rows="3" class="w-full p-2.5 rounded-lg border border-[#d2dfd8] bg-white font-sans"></textarea>
                </div>
              </div>
            }

          </div>

          <div class="p-3.5 bg-white border-t border-[#d2dfd8] flex justify-end gap-2">
            <button type="button" (click)="cerrar()" class="px-4 py-2 rounded-lg bg-[#edece4] hover:bg-slate-200 text-xs font-bold text-[#405c54] cursor-pointer">
              Cancelar
            </button>
            <button type="button" (click)="guardar()" class="px-5 py-2 rounded-lg bg-[#07483b] hover:bg-[#0b5948] text-white text-xs font-black shadow-md cursor-pointer">
              Aplicar en Pantalla
            </button>
          </div>

        </div>
      </div>
    }
  `
})
export class QuickEditModalComponent {
  emergency = inject(EmergencyService);
  customizer = inject(CustomizerService);

  abierto = signal(false);
  datos: QuickEditData = {
    tipo: 'evento',
    tituloModal: 'Editar Elemento'
  };

  abrir(config: QuickEditData) {
    this.datos = { 
      widgetVisualType: 'grafico_dona',
      widgetColSpan: 1,
      ...config 
    };
    this.abierto.set(true);
  }

  cerrar() {
    this.abierto.set(false);
  }

  elegirTipoGrafico(tipo: VisualType, tituloSugerido: string) {
    this.datos.widgetVisualType = tipo;
    if (this.datos.tipo === 'nuevo_widget' || !this.datos.widgetTitulo) {
      this.datos.widgetTitulo = tituloSugerido;
    }
  }

  guardar() {
    if (this.datos.tipo === 'evento') {
      if (this.datos.nombreEvento) this.customizer.actualizarTexto('nombreEvento', this.datos.nombreEvento);
      if (this.datos.ciudadSede) this.customizer.actualizarTexto('ciudadSede', this.datos.ciudadSede);
      if (this.datos.lugarRecinto) this.customizer.actualizarTexto('lugarRecinto', this.datos.lugarRecinto);
      if (this.datos.fechaHorario) this.customizer.actualizarTexto('fechaHorario', this.datos.fechaHorario);
      if (this.datos.nivelRiesgo) this.customizer.actualizarTexto('nivelRiesgo', this.datos.nivelRiesgo);
      if (this.datos.aforoTexto) this.customizer.actualizarTexto('aforoTexto', this.datos.aforoTexto);

      this.emergency.actualizarEvento({
        nombre: this.datos.nombreEvento || this.emergency.evento().nombre,
        ciudad: this.datos.ciudadSede || this.emergency.evento().ciudad,
        lugar: this.datos.lugarRecinto || this.emergency.evento().lugar,
        fecha: this.datos.fechaHorario?.split('•')[0]?.trim() || this.emergency.evento().fecha,
        riesgo: (this.datos.nivelRiesgo as any) || this.emergency.evento().riesgo
      });
    }

    if (this.datos.tipo === 'kpi' && this.datos.id) {
      this.customizer.editarKpi(this.datos.id, {
        titulo: this.datos.kpiTitulo,
        badgeTexto: this.datos.kpiBadgeTexto,
        badgeColor: this.datos.kpiBadgeColor,
        tipoValor: this.datos.kpiTipoValor,
        valorManual: this.datos.kpiValorManual,
        subtitulo1: this.datos.kpiSubtitulo1,
        subtitulo2: this.datos.kpiSubtitulo2
      });
    }

    if (this.datos.tipo === 'nuevo_kpi') {
      this.customizer.agregarKpi({
        titulo: this.datos.kpiTitulo || 'NUEVO CONTADOR',
        badgeTexto: this.datos.kpiBadgeTexto || 'ACTIVO',
        badgeColor: this.datos.kpiBadgeColor || 'emerald',
        tipoValor: this.datos.kpiTipoValor || 'metrica_atenciones',
        valorManual: this.datos.kpiValorManual || '00',
        subtitulo1: this.datos.kpiSubtitulo1 || 'Registrados',
        subtitulo2: this.datos.kpiSubtitulo2 || 'En vivo'
      });
    }

    if (this.datos.tipo === 'sector' && this.datos.id) {
      this.emergency.editarSector(this.datos.id, {
        codigo: this.datos.sectorCodigo,
        nombre: this.datos.sectorNombre,
        capacidadPersonal: this.datos.sectorCapacidad
      });
    }

    if (this.datos.tipo === 'nuevo_sector') {
      this.emergency.agregarSector({
        codigo: this.datos.sectorCodigo || 'ZONA E',
        nombre: this.datos.sectorNombre || 'NUEVA ZONA',
        capacidadPersonal: this.datos.sectorCapacidad || 4
      });
    }

    if (this.datos.tipo === 'widget' && this.datos.id) {
      this.customizer.editarRecuadroPersonalizado(this.datos.id, {
        titulo: this.datos.widgetTitulo,
        contenido: this.datos.widgetContenido,
        visualType: this.datos.widgetVisualType,
        colSpan: this.datos.widgetColSpan
      });
    }

    if (this.datos.tipo === 'nuevo_widget') {
      this.customizer.agregarRecuadroPersonalizado(
        this.datos.widgetTitulo || 'Gráfico del Evento',
        this.datos.widgetContenido || '',
        '',
        this.datos.widgetVisualType || 'grafico_dona',
        'triage_distribucion',
        this.datos.widgetColSpan || 1
      );
    }

    this.cerrar();
  }
}
