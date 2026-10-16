import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmergencyService } from '../../services/emergency.service';
import { CustomizerService, DynamicKpi, VisualType, VisualDataSource } from '../../services/customizer.service';
import { Sector } from '../../models/emergency.model';

export type EditItemType = 'evento' | 'kpi' | 'nuevo_kpi' | 'sector' | 'nuevo_sector' | 'widget' | 'header';

export interface QuickEditData {
  tipo: EditItemType;
  id?: string;
  tituloModal: string;
  // Campos para Evento
  nombreEvento?: string;
  ciudadSede?: string;
  lugarRecinto?: string;
  fechaHorario?: string;
  nivelRiesgo?: string;
  aforoTexto?: string;
  // Campos para Sector
  sectorCodigo?: string;
  sectorNombre?: string;
  sectorCapacidad?: number;
  // Campos para KPI
  kpiTitulo?: string;
  kpiBadgeTexto?: string;
  kpiBadgeColor?: 'emerald' | 'amber' | 'cyan' | 'red' | 'purple';
  kpiTipoValor?: 'metrica_personal' | 'metrica_atenciones' | 'metrica_traslados' | 'metrica_ambulancias' | 'manual';
  kpiValorManual?: string;
  kpiSubtitulo1?: string;
  kpiSubtitulo2?: string;
  kpiColorValor?: string;
  // Campos para Widget Visual Builder (Power BI)
  widgetTitulo?: string;
  widgetContenido?: string;
  widgetIcono?: string;
  widgetVisualType?: VisualType;
  widgetDataSource?: VisualDataSource;
  widgetColSpan?: 1 | 2 | 3;
  // Campos para Header
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
          
          <!-- Header del Modal con SVG Nítido -->
          <div class="p-4 border-b border-[#05372d] bg-[#07483b] text-white flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-slate-900 shadow-xs">
                @if (datos.tipo === 'nuevo_kpi' || datos.tipo === 'nuevo_sector') {
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                }
              </div>
              <div>
                <h3 class="text-sm font-black tracking-wide">{{ datos.tituloModal }}</h3>
                <p class="text-[11px] text-emerald-200">Configuración analítica y visual • Modo Super Usuario</p>
              </div>
            </div>
            <button (click)="cerrar()" class="text-emerald-100 hover:text-white p-1.5 text-lg font-bold cursor-pointer" title="Cerrar ventana">✕</button>
          </div>

          <!-- Cuerpo del Formulario de Edición -->
          <div class="p-5 space-y-4 text-xs bg-[#f5f4ed] overflow-y-auto max-h-[75vh]">
            
            <!-- CASO 1: EDITAR EVENTO MASIVO -->
            @if (datos.tipo === 'evento') {
              <div class="space-y-3">
                <div>
                  <label class="block font-bold text-[#07483b] mb-1">Nombre del Evento Masivo:</label>
                  <input type="text" [(ngModel)]="datos.nombreEvento" class="w-full p-2.5 rounded-lg border border-[#d2dfd8] bg-white font-bold text-[#0d2822]" placeholder="Ej: CONCIERTO CHINO Y NACHO" />
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block font-bold text-[#07483b] mb-1">Ciudad Sede:</label>
                    <input type="text" [(ngModel)]="datos.ciudadSede" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold" />
                  </div>
                  <div>
                    <label class="block font-bold text-[#07483b] mb-1">Recinto / Estadio:</label>
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
                  <label class="block font-bold text-[#07483b] mb-1">Aforo Estimado:</label>
                  <input type="text" [(ngModel)]="datos.aforoTexto" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-mono" placeholder="Ej: ~28,000 pers." />
                </div>
              </div>
            }

            <!-- CASO 2: EDITAR O CREAR KPI DINÁMICO -->
            @if (datos.tipo === 'kpi' || datos.tipo === 'nuevo_kpi') {
              <div class="space-y-3">
                <div>
                  <label class="block font-bold text-[#07483b] mb-1">Título del Indicador (KPI):</label>
                  <input type="text" [(ngModel)]="datos.kpiTitulo" class="w-full p-2.5 rounded-lg border border-[#d2dfd8] bg-white font-bold uppercase" placeholder="Ej: PACIENTES ATENDIDOS" />
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block font-bold text-[#07483b] mb-1">Texto del Distintivo (Badge):</label>
                    <input type="text" [(ngModel)]="datos.kpiBadgeTexto" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold uppercase" placeholder="Ej: EN VIVO" />
                  </div>
                  <div>
                    <label class="block font-bold text-[#07483b] mb-1">Color del Distintivo:</label>
                    <select [(ngModel)]="datos.kpiBadgeColor" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold">
                      <option value="emerald">Verde (Operativo)</option>
                      <option value="amber">Ámbar (Alerta)</option>
                      <option value="cyan">Cian (Traslado)</option>
                      <option value="red">Rojo (Crítico)</option>
                      <option value="purple">Púrpura (Especial)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block font-bold text-[#07483b] mb-1">Tipo de Medición / Fuente de Datos:</label>
                  <select [(ngModel)]="datos.kpiTipoValor" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-bold">
                    <option value="metrica_atenciones">Atenciones en Terreno (Automático)</option>
                    <option value="metrica_personal">Personal Total Disponible (Automático)</option>
                    <option value="metrica_traslados">Pacientes Rumbo al ACV (Automático)</option>
                    <option value="metrica_ambulancias">Ambulancias Activas (Automático)</option>
                    <option value="manual">Valor Numérico Fijo / Manual</option>
                  </select>
                </div>

                @if (datos.kpiTipoValor === 'manual') {
                  <div>
                    <label class="block font-bold text-[#07483b] mb-1">Valor Manual:</label>
                    <input type="text" [(ngModel)]="datos.kpiValorManual" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-mono text-center text-base font-black" placeholder="Ej: 00 o 15" />
                  </div>
                }

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block font-bold text-[#07483b] mb-1">Subtítulo Superior:</label>
                    <input type="text" [(ngModel)]="datos.kpiSubtitulo1" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white" placeholder="Ej: Registrados hoy" />
                  </div>
                  <div>
                    <label class="block font-bold text-[#07483b] mb-1">Subtítulo Inferior:</label>
                    <input type="text" [(ngModel)]="datos.kpiSubtitulo2" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white" placeholder="Ej: En observación" />
                  </div>
                </div>
              </div>
            }

            <!-- CASO 3: EDITAR O CREAR SECTOR OPERATIVO -->
            @if (datos.tipo === 'sector' || datos.tipo === 'nuevo_sector') {
              <div class="space-y-3">
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <label class="block font-bold text-[#07483b] mb-1">Código:</label>
                    <input type="text" [(ngModel)]="datos.sectorCodigo" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-mono font-bold uppercase" placeholder="Ej: ZONA E" />
                  </div>
                  <div class="col-span-2">
                    <label class="block font-bold text-[#07483b] mb-1">Capacidad de Personal:</label>
                    <input type="number" [(ngModel)]="datos.sectorCapacidad" min="1" max="20" class="w-full p-2 rounded-lg border border-[#d2dfd8] bg-white font-mono font-bold" />
                  </div>
                </div>

                <div>
                  <label class="block font-bold text-[#07483b] mb-1">Nombre Descriptivo de la Zona:</label>
                  <input type="text" [(ngModel)]="datos.sectorNombre" class="w-full p-2.5 rounded-lg border border-[#d2dfd8] bg-white font-bold" placeholder="Ej: ZONA E - TRIBUNAS ORIENTE" />
                </div>
              </div>
            }

            <!-- CASO 4: EDITAR WIDGET VISUAL BUILDER (Power BI / Grafana) -->
            @if (datos.tipo === 'widget') {
              <div class="space-y-3">
                <div>
                  <label class="block font-bold text-[#07483b] mb-1">Título del Bloque Visual:</label>
                  <input type="text" [(ngModel)]="datos.widgetTitulo" class="w-full p-2.5 rounded-lg border border-[#d2dfd8] bg-white font-bold uppercase" />
                </div>

                <!-- Selector de Visualización Power BI -->
                <div class="grid grid-cols-2 gap-2 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <div>
                    <label class="block font-bold text-amber-900 mb-1">Tipo de Visualización:</label>
                    <select [(ngModel)]="datos.widgetVisualType" class="w-full p-2 rounded-lg border border-amber-300 bg-white font-bold">
                      <option value="grafico_dona">Gráfico de Dona (Triage START)</option>
                      <option value="grafico_barras">Gráfico de Barras (Atenciones por Sector)</option>
                      <option value="curva_tendencia">Curva de Tendencia (Flujo Horario)</option>
                      <option value="gauge_radial">Medidor Radial (Ocupación Camillas)</option>
                      <option value="tarjeta_kpi">Tarjeta KPI Inteligente</option>
                      <option value="texto_markdown">Consigna Operativa / Notas</option>
                    </select>
                  </div>
                  <div>
                    <label class="block font-bold text-amber-900 mb-1">Ancho del Bloque (Grid):</label>
                    <select [(ngModel)]="datos.widgetColSpan" class="w-full p-2 rounded-lg border border-amber-300 bg-white font-bold">
                      <option [ngValue]="1">1 Columna (33% lienzo)</option>
                      <option [ngValue]="2">2 Columnas (66% lienzo)</option>
                      <option [ngValue]="3">Ancho Completo (100% lienzo)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block font-bold text-[#07483b] mb-1">Descripción o Consigna Operativa:</label>
                  <textarea [(ngModel)]="datos.widgetContenido" rows="3" class="w-full p-2.5 rounded-lg border border-[#d2dfd8] bg-white font-sans" placeholder="Texto explicativo o instrucciones tácticas para este bloque"></textarea>
                </div>
              </div>
            }

            <!-- CASO 5: EDITAR HEADER INSTITUCIONAL -->
            @if (datos.tipo === 'header') {
              <div class="space-y-3">
                <div>
                  <label class="block font-bold text-[#07483b] mb-1">Nombre de la Institución:</label>
                  <input type="text" [(ngModel)]="datos.headerNombre" class="w-full p-2.5 rounded-lg border border-[#d2dfd8] bg-white font-bold uppercase" />
                </div>
                <div>
                  <label class="block font-bold text-[#07483b] mb-1">Subtítulo / País / Lema:</label>
                  <input type="text" [(ngModel)]="datos.headerSubtitulo" class="w-full p-2.5 rounded-lg border border-[#d2dfd8] bg-white font-bold" />
                </div>
              </div>
            }

          </div>

          <!-- Footer con Botones -->
          <div class="p-3.5 bg-white border-t border-[#d2dfd8] flex justify-end gap-2">
            <button 
              type="button" 
              (click)="cerrar()" 
              class="px-4 py-2 rounded-lg bg-[#edece4] hover:bg-slate-200 text-xs font-bold text-[#405c54] cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="button" 
              (click)="guardar()" 
              class="px-5 py-2 rounded-lg bg-[#07483b] hover:bg-[#0b5948] text-white text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <svg class="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>Guardar Cambios</span>
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
    this.datos = { ...config };
    this.abierto.set(true);
  }

  cerrar() {
    this.abierto.set(false);
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
        tipo: this.emergency.evento().tipo,
        ciudad: this.datos.ciudadSede || this.emergency.evento().ciudad,
        lugar: this.datos.lugarRecinto || this.emergency.evento().lugar,
        fecha: this.datos.fechaHorario?.split('•')[0]?.trim() || this.emergency.evento().fecha,
        horario: this.datos.fechaHorario?.split('•')[1]?.trim() || this.emergency.evento().horario,
        riesgo: (this.datos.nivelRiesgo as any) || this.emergency.evento().riesgo,
        aforoEstimado: parseInt(this.datos.aforoTexto?.replace(/[^0-9]/g, '') || '28000', 10)
      });

      this.emergency.mostrarNotificacion('Datos del Evento actualizados y sincronizados', 'exito');
    }

    if (this.datos.tipo === 'kpi' && this.datos.id) {
      this.customizer.editarKpi(this.datos.id, {
        titulo: this.datos.kpiTitulo,
        badgeTexto: this.datos.kpiBadgeTexto,
        badgeColor: this.datos.kpiBadgeColor,
        tipoValor: this.datos.kpiTipoValor,
        valorManual: this.datos.kpiValorManual,
        subtitulo1: this.datos.kpiSubtitulo1,
        subtitulo2: this.datos.kpiSubtitulo2,
        colorValor: this.datos.kpiColorValor
      });
      this.emergency.mostrarNotificacion(`Indicador ${this.datos.kpiTitulo} actualizado`, 'exito');
    }

    if (this.datos.tipo === 'nuevo_kpi') {
      this.customizer.agregarKpi({
        titulo: this.datos.kpiTitulo || 'NUEVO INDICADOR',
        badgeTexto: this.datos.kpiBadgeTexto || 'LIVE',
        badgeColor: this.datos.kpiBadgeColor || 'emerald',
        tipoValor: this.datos.kpiTipoValor || 'metrica_atenciones',
        valorManual: this.datos.kpiValorManual || '00',
        subtitulo1: this.datos.kpiSubtitulo1 || 'Registros',
        subtitulo2: this.datos.kpiSubtitulo2 || 'En seguimiento',
        colorValor: '#07483b'
      });
      this.emergency.mostrarNotificacion(`Nuevo KPI creado exitosamente`, 'exito');
    }

    if (this.datos.tipo === 'sector' && this.datos.id) {
      this.emergency.editarSector(this.datos.id, {
        codigo: this.datos.sectorCodigo,
        nombre: this.datos.sectorNombre,
        capacidadPersonal: this.datos.sectorCapacidad
      });
      this.emergency.mostrarNotificacion(`Sector ${this.datos.sectorCodigo} actualizado`, 'exito');
    }

    if (this.datos.tipo === 'nuevo_sector') {
      this.emergency.agregarSector({
        codigo: this.datos.sectorCodigo || `ZONA ${String.fromCharCode(65 + this.emergency.sectores().length)}`,
        nombre: this.datos.sectorNombre || `ZONA ${String.fromCharCode(65 + this.emergency.sectores().length)} - SECTOR NUEVO`,
        capacidadPersonal: this.datos.sectorCapacidad || 4
      });
      this.emergency.mostrarNotificacion(`Nueva sección operativa creada`, 'exito');
    }

    if (this.datos.tipo === 'widget' && this.datos.id) {
      this.customizer.editarRecuadroPersonalizado(this.datos.id, {
        titulo: this.datos.widgetTitulo,
        contenido: this.datos.widgetContenido,
        icono: this.datos.widgetIcono,
        visualType: this.datos.widgetVisualType,
        dataSource: this.datos.widgetDataSource,
        colSpan: this.datos.widgetColSpan
      });
      this.emergency.mostrarNotificacion('Bloque analítico guardado exitosamente', 'exito');
    }

    if (this.datos.tipo === 'header') {
      if (this.datos.headerNombre) this.customizer.actualizarTexto('nombreInstitucion', this.datos.headerNombre);
      if (this.datos.headerSubtitulo) this.customizer.actualizarTexto('subtituloHeader', this.datos.headerSubtitulo);
      this.emergency.mostrarNotificacion('Cabecera institucional actualizada', 'exito');
    }

    this.cerrar();
  }
}
