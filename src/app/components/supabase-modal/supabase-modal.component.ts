import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-supabase-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div class="bg-white border-2 border-[#07483b] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl text-[#0d2822]">
        
        <!-- Header del Modal -->
        <div class="p-5 border-b border-[#05372d] flex items-center justify-between bg-[#07483b] text-white">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/20 border border-white/40 flex items-center justify-center text-amber-300 font-bold text-lg">
              ⚡
            </div>
            <div>
              <h3 class="text-base font-extrabold tracking-wide">Configuración Supabase Realtime</h3>
              <p class="text-xs text-emerald-100">Conexión a base de datos PostgreSQL en la nube (Capa Gratuita)</p>
            </div>
          </div>
          <button 
            (click)="cerrar()"
            class="text-emerald-100 hover:text-white text-lg cursor-pointer p-1"
          >
            ✕
          </button>
        </div>

        <!-- Contenido con scroll (Fondo Beige Clínico #f5f4ed) -->
        <div class="p-5 overflow-y-auto space-y-5 flex-1 text-xs bg-[#f5f4ed]">
          
          <!-- Estado Actual -->
          <div class="p-3.5 rounded-xl border flex items-center justify-between" [ngClass]="supabase.isConnected ? 'bg-emerald-50 border-emerald-500' : 'bg-amber-50 border-amber-400'">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full" [ngClass]="supabase.isConnected ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'"></span>
              <span class="font-bold text-xs" [ngClass]="supabase.isConnected ? 'text-emerald-950' : 'text-amber-950'">
                {{ supabase.isConnected ? 'CONECTADO A TU PROYECTO SUPABASE' : 'MODO RED LOCAL (LAN) / SIMULACIÓN REACTIVA' }}
              </span>
            </div>
            @if (supabase.isConnected) {
              <button 
                (click)="desconectar()"
                class="px-2.5 py-1 rounded bg-red-100 text-red-800 border border-red-300 hover:bg-red-200 cursor-pointer font-bold"
              >
                Desconectar
              </button>
            }
          </div>

          <!-- Formulario de Credenciales -->
          <div class="space-y-3 bg-white p-4 rounded-xl border border-[#d2dfd8] shadow-xs">
            <h4 class="font-bold text-[#07483b] uppercase tracking-wider text-[11px]">
              Ingresar Credenciales de tu Proyecto Supabase
            </h4>
            
            <div>
              <label class="block text-[#405c54] mb-1 font-semibold">Project URL (Supabase):</label>
              <input 
                type="text" 
                [(ngModel)]="supabaseUrl" 
                placeholder="https://tu-proyecto.supabase.co" 
                class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-lg p-2.5 text-xs text-[#0d2822] font-mono focus:border-[#07483b] focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-[#405c54] mb-1 font-semibold">Anon Public API Key:</label>
              <input 
                type="password" 
                [(ngModel)]="supabaseKey" 
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
                class="w-full bg-[#f5f4ed] border border-[#d2dfd8] rounded-lg p-2.5 text-xs text-[#0d2822] font-mono focus:border-[#07483b] focus:outline-none"
              />
            </div>

            <div class="pt-2 flex gap-2">
              <button 
                (click)="guardarCredenciales()"
                class="px-4 py-2 rounded-lg bg-[#07483b] hover:bg-[#0b5948] text-white font-extrabold uppercase tracking-wider cursor-pointer shadow-xs transition-all"
              >
                Guardar y Conectar
              </button>
            </div>
          </div>

          <!-- Script SQL Listo para Copiar -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <h4 class="font-bold text-[#0d2822] flex items-center gap-1.5">
                <span>Script SQL de Tablas y Realtime (Copiar en Supabase SQL Editor)</span>
              </h4>
              <button 
                (click)="copiarSql()"
                class="px-2.5 py-1 rounded bg-[#07483b] text-white hover:bg-[#0b5948] font-bold cursor-pointer text-[11px] flex items-center gap-1 shadow-xs"
              >
                @if (copiado()) {
                  <span>✓ ¡Copiado!</span>
                } @else {
                  <span>📋 Copiar SQL</span>
                }
              </button>
            </div>

            <pre class="bg-white border border-[#d2dfd8] rounded-xl p-3 text-[10px] font-mono text-[#405c54] max-h-48 overflow-y-auto leading-relaxed select-all shadow-xs">{{ sqlScript }}</pre>
          </div>

        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-[#d2dfd8] bg-white flex justify-end">
          <button 
            (click)="cerrar()"
            class="px-4 py-2 rounded-lg bg-[#edece4] border border-[#d2dfd8] hover:bg-slate-200 text-xs font-bold text-[#0d2822] cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  `
})
export class SupabaseModalComponent {
  supabase = inject(SupabaseService);

  supabaseUrl = '';
  supabaseKey = '';
  sqlScript = '';
  copiado = signal(false);

  constructor() {
    const creds = this.supabase.getCredentials();
    this.supabaseUrl = creds.url;
    this.supabaseKey = creds.key;
    this.sqlScript = this.supabase.getSqlSchemaScript();
  }

  cerrar() {
    window.dispatchEvent(new CustomEvent('cerrar-modal-supabase'));
  }

  guardarCredenciales() {
    if (!this.supabaseUrl || !this.supabaseKey) {
      alert('Por favor ingresa la URL y la Anon Key de Supabase.');
      return;
    }
    const ok = this.supabase.saveCredentials(this.supabaseUrl, this.supabaseKey);
    if (ok) {
      alert('✓ Credenciales guardadas correctamente. Sincronización en tiempo real habilitada.');
      this.cerrar();
    } else {
      alert('Error al validar las credenciales.');
    }
  }

  desconectar() {
    this.supabase.clearCredentials();
    this.supabaseUrl = '';
    this.supabaseKey = '';
    alert('Desconectado de Supabase. El sistema continúa operando en modo local (LAN).');
  }

  copiarSql() {
    navigator.clipboard.writeText(this.sqlScript);
    this.copiado.set(true);
    setTimeout(() => this.copiado.set(false), 2500);
  }
}
