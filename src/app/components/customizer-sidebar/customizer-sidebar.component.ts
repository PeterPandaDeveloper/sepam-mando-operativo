import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomizerService, ThemeConfig } from '../../services/customizer.service';
import { EmergencyService } from '../../services/emergency.service';

@Component({
  selector: 'app-customizer-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- BOTÓN FLOTANTE LATERAL IZQUIERDO (TIPO WORDPRESS / ELEMENTOR) -->
    <!-- Visible únicamente si el usuario es uno de los 3 Super Usuarios -->
    @if (emergency.esSuperUsuario()) {
      <button 
        (click)="customizer.toggleSidebar()"
        class="fixed left-0 top-1/3 z-50 bg-[#07483b] hover:bg-[#0b5948] text-white py-3 px-2 rounded-r-xl shadow-2xl border-y-2 border-r-2 border-[#f59e0b] cursor-pointer flex flex-col items-center gap-1.5 transition-all transform hover:translate-x-1"
        title="Abrir Menú de Personalización GUI en Tiempo Real"
      >
        <svg class="w-4 h-4 text-amber-300 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <span class="text-[10px] font-black uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 text-amber-300">
          Personalizar GUI
        </span>
      </button>
    }

    <!-- MENÚ LATERAL DESPLEGABLE (OFF-CANVAS CUSTOMIZER) -->
    @if (customizer.sidebarAbierto() && emergency.esSuperUsuario()) {
      <div class="fixed inset-0 z-50 flex pointer-events-none">
        
        <!-- Backdrop translúcido -->
        <div 
          (click)="customizer.cerrarSidebar()" 
          class="fixed inset-0 bg-black/40 backdrop-blur-xs pointer-events-auto transition-opacity"
        ></div>

        <!-- Panel Lateral Flotante a la Izquierda -->
        <div class="relative w-80 sm:w-96 bg-white h-full shadow-2xl border-r-2 border-[#07483b] flex flex-col pointer-events-auto z-10 text-[#0d2822] animate-slideInLeft">
          
          <!-- Encabezado del Customizer -->
          <div class="p-4 bg-[#07483b] text-white flex items-center justify-between border-b border-[#05372d]">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4 4 4 0 014-4h2a4 4 0 014 4 4 4 0 01-4 4H7zm0 0a4 4 0 004-4v-2.586a1 1 0 01.293-.707l6-6a1 1 0 011.414 0l2.586 2.586a1 1 0 010 1.414l-6 6a1 1 0 01-.707.293H11"/>
              </svg>
              <div>
                <h3 class="text-xs font-black uppercase tracking-wider text-amber-300">Editor GUI en Tiempo Real</h3>
                <span class="text-[10px] text-emerald-200 block">Modo Super Usuario (WordPress GUI)</span>
              </div>
            </div>
            <button 
              (click)="customizer.cerrarSidebar()"
              class="text-emerald-100 hover:text-white p-1 text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Selector de Pestañas del Editor -->
          <div class="flex items-center bg-[#edece4] p-1 border-b border-[#d2dfd8] text-xs font-bold overflow-x-auto">
            <button 
              (click)="tab = 'estilos'"
              [class.bg-[#07483b]]="tab === 'estilos'"
              [class.text-white]="tab === 'estilos'"
              [class.text-[#405c54]]="tab !== 'estilos'"
              class="px-2.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4 4 4 0 014-4h2a4 4 0 014 4 4 4 0 01-4 4H7zm0 0a4 4 0 004-4v-2.586a1 1 0 01.293-.707l6-6a1 1 0 011.414 0l2.586 2.586a1 1 0 010 1.414l-6 6a1 1 0 01-.707.293H11"/></svg>
              <span>Presets y Colores</span>
            </button>
            <button 
              (click)="tab = 'textos'"
              [class.bg-[#07483b]]="tab === 'textos'"
              [class.text-white]="tab === 'textos'"
              [class.text-[#405c54]]="tab !== 'textos'"
              class="px-2.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-all inline-flex items-center gap-1"
            >
              <svg class="w-3.5 h-3.5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              <span>Textos</span>
            </button>
            <button 
              (click)="tab = 'recuadros'"
              [class.bg-[#07483b]]="tab === 'recuadros'"
              [class.text-white]="tab === 'recuadros'"
              [class.text-[#405c54]]="tab !== 'recuadros'"
              class="px-2.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
              <span>Recuadros</span>
            </button>
          </div>

          <!-- CONTENIDO SCROLLABLE DEL EDITOR -->
          <div class="flex-1 overflow-y-auto p-4 space-y-5 text-xs bg-[#f5f4ed]">
            
            <!-- PESTAÑA 1: PRESETS Y COLORES EN VIVO -->
            @if (tab === 'estilos') {
              <div class="space-y-4">
                
                <div>
                  <label class="block text-[11px] font-bold text-[#07483b] uppercase mb-2">
                    1. Presets de Diseño Listos:
                  </label>
                  <div class="grid grid-cols-2 gap-2">
                    <button 
                      (click)="customizer.aplicarPreset('beige-verde')"
                      [class.ring-2]="customizer.config().tema.nombrePreset.includes('Beige')"
                      class="p-2 rounded-xl border border-[#d2dfd8] bg-[#f5f4ed] ring-emerald-600 hover:border-[#07483b] text-left cursor-pointer transition-all shadow-xs"
                    >
                      <div class="w-full h-3 rounded bg-[#07483b] mb-1"></div>
                      <span class="font-bold text-[10px] text-[#07483b] block">Beige & Verde</span>
                      <span class="text-[9px] text-[#648279]">Clínico Oficial</span>
                    </button>

                    <button 
                      (click)="customizer.aplicarPreset('tactico-dark')"
                      [class.ring-2]="customizer.config().tema.nombrePreset.includes('Dark')"
                      class="p-2 rounded-xl border border-slate-700 bg-[#061814] ring-emerald-400 text-white hover:border-emerald-400 text-left cursor-pointer transition-all shadow-xs"
                    >
                      <div class="w-full h-3 rounded bg-emerald-500 mb-1"></div>
                      <span class="font-bold text-[10px] text-emerald-400 block">Táctico Dark</span>
                      <span class="text-[9px] text-slate-400">Modo Noche</span>
                    </button>

                    <button 
                      (click)="customizer.aplicarPreset('hospital-azul')"
                      [class.ring-2]="customizer.config().tema.nombrePreset.includes('Azul')"
                      class="p-2 rounded-xl border border-blue-200 bg-[#f0f4f8] ring-blue-600 hover:border-blue-600 text-left cursor-pointer transition-all shadow-xs"
                    >
                      <div class="w-full h-3 rounded bg-[#0f3c6e] mb-1"></div>
                      <span class="font-bold text-[10px] text-blue-900 block">Azul Hospital</span>
                      <span class="text-[9px] text-blue-700">Norma 911</span>
                    </button>

                    <button 
                      (click)="customizer.aplicarPreset('alto-contraste')"
                      [class.ring-2]="customizer.config().tema.nombrePreset.includes('Hazard')"
                      class="p-2 rounded-xl border border-yellow-500 bg-[#18181b] ring-yellow-400 text-white hover:border-yellow-400 text-left cursor-pointer transition-all shadow-xs"
                    >
                      <div class="w-full h-3 rounded bg-yellow-400 mb-1"></div>
                      <span class="font-bold text-[10px] text-yellow-400 block">Alto Contraste</span>
                      <span class="text-[9px] text-yellow-200">Amarillo Hazard</span>
                    </button>

                    <button 
                      (click)="customizer.aplicarPreset('viper-neon')"
                      [class.ring-2]="customizer.config().tema.nombrePreset.includes('Cyberpunk')"
                      class="p-2 rounded-xl border border-fuchsia-600 bg-[#0d0714] ring-fuchsia-500 text-white hover:border-fuchsia-400 text-left cursor-pointer transition-all shadow-xs"
                    >
                      <div class="w-full h-3 rounded bg-fuchsia-500 mb-1"></div>
                      <span class="font-bold text-[10px] text-fuchsia-400 block">Cyberpunk Neon</span>
                      <span class="text-[9px] text-fuchsia-200">Concierto Show</span>
                    </button>

                    <button 
                      (click)="customizer.aplicarPreset('rojo-cruzroja')"
                      [class.ring-2]="customizer.config().tema.nombrePreset.includes('Cruz Roja')"
                      class="p-2 rounded-xl border border-red-300 bg-[#fef2f2] ring-red-600 hover:border-red-600 text-left cursor-pointer transition-all shadow-xs"
                    >
                      <div class="w-full h-3 rounded bg-red-600 mb-1"></div>
                      <span class="font-bold text-[10px] text-red-900 block">Cruz Roja</span>
                      <span class="text-[9px] text-red-700">Emergencia 131</span>
                    </button>

                    <button 
                      (click)="customizer.aplicarPreset('slate-titanium')"
                      [class.ring-2]="customizer.config().tema.nombrePreset.includes('Titanio')"
                      class="p-2 rounded-xl border border-slate-300 bg-[#f8fafc] ring-slate-700 hover:border-slate-600 text-left cursor-pointer transition-all shadow-xs col-span-2"
                    >
                      <div class="w-full h-3 rounded bg-slate-700 mb-1"></div>
                      <span class="font-bold text-[10px] text-slate-900 block">Titanio Slate Moderno</span>
                      <span class="text-[9px] text-slate-500">Estilo Operativo Corporativo</span>
                    </button>
                  </div>
                </div>

                <!-- PALETA DE COLORES EN VIVO (COLOR PICKERS) -->
                <div class="bg-white p-3.5 rounded-xl border border-[#d2dfd8] space-y-3 shadow-xs">
                  <label class="block text-[11px] font-bold text-[#07483b] uppercase">
                    2. Ajustar Colores Manualmente:
                  </label>

                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-[#405c54] font-medium">Color de Cabecera:</span>
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-[10px] text-slate-500">{{ customizer.config().tema.colorHeader }}</span>
                        <input 
                          type="color" 
                          [ngModel]="customizer.config().tema.colorHeader"
                          (ngModelChange)="customizer.actualizarColor('colorHeader', $event)"
                          class="w-7 h-7 rounded border border-[#d2dfd8] cursor-pointer"
                        />
                      </div>
                    </div>

                    <div class="flex items-center justify-between">
                      <span class="text-[#405c54] font-medium">Fondo de la Página:</span>
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-[10px] text-slate-500">{{ customizer.config().tema.colorFondo }}</span>
                        <input 
                          type="color" 
                          [ngModel]="customizer.config().tema.colorFondo"
                          (ngModelChange)="customizer.actualizarColor('colorFondo', $event)"
                          class="w-7 h-7 rounded border border-[#d2dfd8] cursor-pointer"
                        />
                      </div>
                    </div>

                    <div class="flex items-center justify-between">
                      <span class="text-[#405c54] font-medium">Fondo de Tarjetas:</span>
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-[10px] text-slate-500">{{ customizer.config().tema.colorTarjeta }}</span>
                        <input 
                          type="color" 
                          [ngModel]="customizer.config().tema.colorTarjeta"
                          (ngModelChange)="customizer.actualizarColor('colorTarjeta', $event)"
                          class="w-7 h-7 rounded border border-[#d2dfd8] cursor-pointer"
                        />
                      </div>
                    </div>

                    <div class="flex items-center justify-between">
                      <span class="text-[#405c54] font-medium">Color de Acento / Botones:</span>
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-[10px] text-slate-500">{{ customizer.config().tema.colorPrimario }}</span>
                        <input 
                          type="color" 
                          [ngModel]="customizer.config().tema.colorPrimario"
                          (ngModelChange)="customizer.actualizarColor('colorPrimario', $event)"
                          class="w-7 h-7 rounded border border-[#d2dfd8] cursor-pointer"
                        />
                      </div>
                    </div>

                    <div class="flex items-center justify-between">
                      <span class="text-[#405c54] font-medium">Color de Texto Principal:</span>
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-[10px] text-slate-500">{{ customizer.config().tema.colorTexto }}</span>
                        <input 
                          type="color" 
                          [ngModel]="customizer.config().tema.colorTexto"
                          (ngModelChange)="customizer.actualizarColor('colorTexto', $event)"
                          class="w-7 h-7 rounded border border-[#d2dfd8] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            }

            <!-- PESTAÑA 2: EDICIÓN DE TEXTOS EN VIVO -->
            @if (tab === 'textos') {
              <div class="bg-white p-3.5 rounded-xl border border-[#d2dfd8] space-y-3 shadow-xs">
                <label class="block text-[11px] font-bold text-[#07483b] uppercase">
                  Modificar Textos Globales en Pantalla:
                </label>

                <div>
                  <label class="block text-[10px] text-[#648279] uppercase font-bold mb-1">Nombre Institución (Header):</label>
                  <input 
                    type="text" 
                    [ngModel]="customizer.config().textos.nombreInstitucion"
                    (ngModelChange)="customizer.actualizarTexto('nombreInstitucion', $event)"
                    class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded p-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label class="block text-[10px] text-[#648279] uppercase font-bold mb-1">Nombre del Evento (Placeholder):</label>
                  <input 
                    type="text" 
                    [ngModel]="customizer.config().textos.nombreEvento"
                    (ngModelChange)="customizer.actualizarTexto('nombreEvento', $event); emergency.actualizarEvento({ nombre: $event })"
                    class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded p-2 text-xs font-bold text-[#07483b]"
                  />
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-[10px] text-[#648279] uppercase font-bold mb-1">Ciudad:</label>
                    <input 
                      type="text" 
                      [ngModel]="customizer.config().textos.ciudadSede"
                      (ngModelChange)="customizer.actualizarTexto('ciudadSede', $event); emergency.actualizarEvento({ ciudad: $event })"
                      class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded p-1.5 text-xs"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] text-[#648279] uppercase font-bold mb-1">Riesgo:</label>
                    <input 
                      type="text" 
                      [ngModel]="customizer.config().textos.nivelRiesgo"
                      (ngModelChange)="customizer.actualizarTexto('nivelRiesgo', $event)"
                      class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded p-1.5 text-xs font-bold text-red-700"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-[10px] text-[#648279] uppercase font-bold mb-1">Recinto / Estadio:</label>
                  <input 
                    type="text" 
                    [ngModel]="customizer.config().textos.lugarRecinto"
                    (ngModelChange)="customizer.actualizarTexto('lugarRecinto', $event); emergency.actualizarEvento({ lugar: $event })"
                    class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded p-1.5 text-xs"
                  />
                </div>

                <div>
                  <label class="block text-[10px] text-[#648279] uppercase font-bold mb-1">Fecha y Horario:</label>
                  <input 
                    type="text" 
                    [ngModel]="customizer.config().textos.fechaHorario"
                    (ngModelChange)="customizer.actualizarTexto('fechaHorario', $event)"
                    class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded p-1.5 text-xs"
                  />
                </div>
              </div>
            }

            <!-- PESTAÑA 3: GESTIÓN DE RECUADROS Y WIDGETS -->
            @if (tab === 'recuadros') {
              <div class="space-y-4">
                
                <!-- Interruptores de Visibilidad de Bloques -->
                <div class="bg-white p-3.5 rounded-xl border border-[#d2dfd8] space-y-2.5 shadow-xs">
                  <label class="block text-[11px] font-bold text-[#07483b] uppercase mb-1">
                    Mostrar u Ocultar Secciones:
                  </label>

                  <div class="flex items-center justify-between py-1">
                    <span class="text-xs text-[#0d2822] font-medium">Banner del Evento</span>
                    <input 
                      type="checkbox" 
                      [checked]="customizer.config().visibilidad.bannerEvento"
                      (change)="customizer.toggleVisibilidad('bannerEvento')"
                      class="w-4 h-4 accent-[#07483b] cursor-pointer"
                    />
                  </div>

                  <div class="flex items-center justify-between py-1">
                    <span class="text-xs text-[#0d2822] font-medium">4 Tarjetas de KPIs</span>
                    <input 
                      type="checkbox" 
                      [checked]="customizer.config().visibilidad.tarjetasKPI"
                      (change)="customizer.toggleVisibilidad('tarjetasKPI')"
                      class="w-4 h-4 accent-[#07483b] cursor-pointer"
                    />
                  </div>

                  <div class="flex items-center justify-between py-1">
                    <span class="text-xs text-[#0d2822] font-medium">Sectores Operativos</span>
                    <input 
                      type="checkbox" 
                      [checked]="customizer.config().visibilidad.sectoresOperativos"
                      (change)="customizer.toggleVisibilidad('sectoresOperativos')"
                      class="w-4 h-4 accent-[#07483b] cursor-pointer"
                    />
                  </div>

                  <div class="flex items-center justify-between py-1">
                    <span class="text-xs text-[#0d2822] font-medium">Tabla de Actividad</span>
                    <input 
                      type="checkbox" 
                      [checked]="customizer.config().visibilidad.tablaActividad"
                      (change)="customizer.toggleVisibilidad('tablaActividad')"
                      class="w-4 h-4 accent-[#07483b] cursor-pointer"
                    />
                  </div>
                </div>

                <!-- Formulario para Agregar Nuevo Recuadro Personalizado -->
                <div class="bg-white p-3.5 rounded-xl border border-[#d2dfd8] space-y-2.5 shadow-xs">
                  <label class="block text-[11px] font-bold text-[#07483b] uppercase">
                    + Agregar Nuevo Recuadro / Bloque:
                  </label>

                  <div>
                    <label class="block text-[9px] text-[#648279] uppercase font-bold mb-1">Título del Recuadro:</label>
                    <input 
                      type="text" 
                      [(ngModel)]="nuevoTituloRecuadro"
                      placeholder="Ej. Teléfonos de Emergencia / Respaldo" 
                      class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded p-1.5 text-xs"
                    />
                  </div>

                  <div>
                    <label class="block text-[9px] text-[#648279] uppercase font-bold mb-1">Contenido Informativo:</label>
                    <textarea 
                      [(ngModel)]="nuevoContenidoRecuadro"
                      rows="2"
                      placeholder="Ej. Base Central: 02-2999-999 • Cruz Roja: 131 • Bomberos: 102..." 
                      class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded p-1.5 text-xs"
                    ></textarea>
                  </div>

                  <button 
                    (click)="crearRecuadro()"
                    class="w-full py-2 rounded-lg bg-[#07483b] hover:bg-[#0b5948] text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    + Insertar Recuadro en el Dashboard
                  </button>
                </div>

                <!-- Lista de Recuadros Existentes -->
                @if (customizer.config().recuadrosPersonalizados.length > 0) {
                  <div class="space-y-2">
                    <label class="block text-[10px] text-[#648279] uppercase font-bold">Recuadros Activos:</label>
                    @for (w of customizer.config().recuadrosPersonalizados; track w.id) {
                      <div class="bg-white p-2.5 rounded-lg border border-[#d2dfd8] flex items-start justify-between gap-2 shadow-xs">
                        <div>
                          <span class="font-bold text-[#0d2822] text-xs block">{{ w.titulo }}</span>
                          <span class="text-[10px] text-[#648279] block truncate max-w-[200px]">{{ w.contenido }}</span>
                        </div>
                        <button 
                          (click)="customizer.eliminarRecuadroPersonalizado(w.id)"
                          class="text-red-600 hover:text-red-800 text-xs font-bold cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    }
                  </div>
                }

              </div>
            }

          </div>

          <!-- Footer del Customizer con Botón Guardar / Reset -->
          <div class="p-3 border-t border-[#d2dfd8] bg-white flex items-center justify-between gap-2">
            <button 
              (click)="customizer.restaurarPorDefecto()"
              class="px-2.5 py-1.5 rounded-lg bg-[#edece4] hover:bg-slate-200 text-[#405c54] font-bold text-[11px] cursor-pointer"
            >
              Restaurar
            </button>
            <button 
              (click)="guardarYNotificar()"
              class="px-4 py-1.5 rounded-lg bg-[#07483b] hover:bg-[#0b5948] text-white font-black text-xs uppercase tracking-wider cursor-pointer shadow-sm"
            >
              Guardar Cambios
            </button>
          </div>

        </div>

      </div>
    }
  `
})
export class CustomizerSidebarComponent {
  customizer = inject(CustomizerService);
  emergency = inject(EmergencyService);

  tab: 'estilos' | 'textos' | 'recuadros' = 'estilos';

  nuevoTituloRecuadro = '';
  nuevoContenidoRecuadro = '';

  crearRecuadro() {
    if (!this.nuevoTituloRecuadro.trim()) return;
    this.customizer.agregarRecuadroPersonalizado(
      this.nuevoTituloRecuadro,
      this.nuevoContenidoRecuadro || 'Información operativa adicional.',
      ''
    );
    this.nuevoTituloRecuadro = '';
    this.nuevoContenidoRecuadro = '';
  }

  guardarYNotificar() {
    this.customizer.guardarEnLocalStorage();
    this.emergency.mostrarNotificacion('✓ Cambios visuales guardados con éxito', 'exito');
    this.customizer.cerrarSidebar();
  }
}
