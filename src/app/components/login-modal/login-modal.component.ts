import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmergencyService } from '../../services/emergency.service';

@Component({
  selector: 'app-login-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div class="bg-white border-2 border-[#07483b] rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl text-[#0d2822]">
        
        <!-- Header del Modal -->
        <div class="p-5 border-b border-[#05372d] bg-[#07483b] text-white flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img src="logo-sepam.png" alt="SEPAM" class="w-10 h-10 rounded-full border-2 border-[#f59e0b] bg-black object-contain"/>
            <div>
              <h3 class="text-sm font-black tracking-wide">Acceso al Sistema SEPAM</h3>
              <p class="text-[11px] text-emerald-100">Puesto de Mando y Operación Prehospitalaria</p>
            </div>
          </div>
          <button (click)="cerrar()" class="text-emerald-100 hover:text-white p-1 text-sm cursor-pointer" aria-label="Cerrar">✕</button>
        </div>

        <form (ngSubmit)="intentarLogin()" class="p-6 space-y-4 text-xs bg-[#f5f4ed]">
          
          <!-- Mensaje de error si falla credenciales -->
          @if (mensajeError()) {
            <div class="p-3 rounded-xl bg-red-50 border border-red-300 text-red-700 text-xs font-semibold flex items-center gap-2">
              <span class="text-base">⚠️</span>
              <span>{{ mensajeError() }}</span>
            </div>
          }

          <!-- Campo Usuario -->
          <div class="space-y-1">
            <label class="block text-[11px] font-black uppercase text-[#07483b]">
              Usuario o Correo Institucional:
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">👤</span>
              <input 
                type="text" 
                [(ngModel)]="usuarioInput" 
                name="usuarioInput"
                placeholder="Ej: admin1, pedro.zavala, sebastian.zavala..."
                required
                autocomplete="username"
                class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#d2dfd8] bg-white text-xs font-bold text-[#0d2822] focus:outline-none focus:border-[#07483b] focus:ring-1 focus:ring-[#07483b] shadow-xs"
              />
            </div>
          </div>

          <!-- Campo Contraseña -->
          <div class="space-y-1">
            <label class="block text-[11px] font-black uppercase text-[#07483b]">
              Contraseña:
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">🔑</span>
              <input 
                [type]="mostrarClave() ? 'text' : 'password'" 
                [(ngModel)]="claveInput" 
                name="claveInput"
                placeholder="••••••••••••"
                required
                autocomplete="current-password"
                class="w-full pl-9 pr-10 py-2.5 rounded-xl border border-[#d2dfd8] bg-white text-xs font-bold text-[#0d2822] focus:outline-none focus:border-[#07483b] focus:ring-1 focus:ring-[#07483b] shadow-xs"
              />
              <button 
                type="button" 
                (click)="mostrarClave.set(!mostrarClave())"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                title="Mostrar/Ocultar contraseña"
              >
                {{ mostrarClave() ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <!-- Botón de Inicio de Sesión Normal -->
          <button 
            type="submit"
            class="w-full py-3 px-4 rounded-xl bg-[#07483b] hover:bg-[#0b5948] text-white font-black text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>🔐</span>
            <span>Iniciar Sesión</span>
          </button>

          <!-- Separador -->
          <div class="relative flex py-1 items-center">
            <div class="flex-grow border-t border-[#d2dfd8]"></div>
            <span class="flex-shrink mx-3 text-[10px] uppercase font-bold text-[#648279]">O ingresar como</span>
            <div class="flex-grow border-t border-[#d2dfd8]"></div>
          </div>

          <!-- Acceso Invitado / Público -->
          <button 
            type="button"
            (click)="iniciarComoInvitado()"
            class="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-[#405c54] bg-[#edece4] hover:bg-slate-200 text-[#0d2822] font-bold text-xs flex items-center justify-between cursor-pointer transition-all"
          >
            <div class="flex items-center gap-2">
              <span>👁️</span>
              <span>Modo Invitado / Público (Solo Lectura)</span>
            </div>
            <span class="text-[10px] text-[#648279] bg-white px-2 py-0.5 rounded border border-[#d2dfd8]">Sin edición</span>
          </button>

          <!-- Terminal de Campo para Paramédicos (Opcional Colapsable) -->
          <details class="pt-2 border-t border-[#d2dfd8] text-[11px]">
            <summary class="font-bold text-[#405c54] hover:text-[#07483b] cursor-pointer">
              🚑 ¿Terminal de campo compartida? Seleccionar Paramédico
            </summary>
            <div class="pt-2 space-y-1">
              <select 
                (change)="seleccionarParamedico($event)"
                class="w-full bg-white border border-[#d2dfd8] rounded-lg p-2 text-xs font-bold text-[#07483b]"
              >
                <option value="">-- Seleccionar Paramédico de Turno --</option>
                @for (p of emergency.personal(); track p.id) {
                  <option [value]="p.id">{{ p.usuario }} - {{ p.nombre }} ({{ p.sectorNombre }})</option>
                }
              </select>
            </div>
          </details>

        </form>

        <div class="p-3 bg-white border-t border-[#d2dfd8] flex justify-end">
          <button type="button" (click)="cerrar()" class="px-4 py-1.5 rounded-lg bg-[#edece4] hover:bg-slate-200 text-xs font-bold text-[#405c54] cursor-pointer">
            Cancelar
          </button>
        </div>

      </div>
    </div>
  `
})
export class LoginModalComponent {
  emergency = inject(EmergencyService);

  usuarioInput = '';
  claveInput = '';
  mostrarClave = signal(false);
  mensajeError = signal('');

  cerrar() {
    this.mensajeError.set('');
    window.dispatchEvent(new CustomEvent('cerrar-modal-login'));
  }

  intentarLogin() {
    this.mensajeError.set('');
    const u = this.usuarioInput.trim().toLowerCase();
    const p = this.claveInput.trim();

    if (!u || !p) {
      this.mensajeError.set('Por favor ingrese su usuario y contraseña.');
      return;
    }

    // 1. Verificar Super Usuarios (admin1, pedro.zavala, sebastian.zavala)
    const superUsuario = this.emergency.superUsuarios().find(su => {
      const matchUsuario = su.usuario.toLowerCase() === u || 
                           su.email.toLowerCase() === u ||
                           su.nombre.toLowerCase().includes(u);
      return matchUsuario && su.passwordTemporal === p;
    });

    if (superUsuario) {
      this.emergency.setUsuarioSesion(superUsuario);
      this.emergency.mostrarNotificacion(`Bienvenido, ${superUsuario.nombre}. Panel de mando y edición activados.`, 'exito');
      this.cerrar();
      return;
    }

    // 2. Verificar Paramédicos de campo por usuario y clave
    const param = this.emergency.personal().find(pm => {
      const matchUser = pm.usuario.toLowerCase() === u || pm.nombre.toLowerCase() === u;
      return matchUser && pm.passwordTemporal === p;
    });

    if (param) {
      this.emergency.setUsuarioSesion(param);
      this.emergency.setParamedicoActivo(param);
      this.emergency.mostrarNotificacion(`Bienvenido, ${param.nombre}. Puesto asignado: ${param.sectorNombre}`, 'exito');
      this.cerrar();
      return;
    }

    // Si no coincide
    this.mensajeError.set('Usuario o contraseña incorrectos. Verifique sus credenciales.');
  }

  iniciarComoInvitado() {
    this.emergency.setUsuarioSesion({
      id: 'invitado',
      nombre: 'Invitado (Acceso Público)',
      usuario: 'invitado',
      rol: 'INVITADO'
    });
    this.emergency.mostrarNotificacion('Sesión activa en Modo Invitado (Solo Lectura)', 'info');
    this.cerrar();
  }

  seleccionarParamedico(event: Event) {
    const id = (event.target as HTMLSelectElement).value;
    if (!id) return;
    const p = this.emergency.personal().find(item => item.id === id);
    if (p) {
      this.emergency.setUsuarioSesion(p);
      this.emergency.setParamedicoActivo(p);
      this.cerrar();
    }
  }
}
