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
              <svg class="w-4 h-4 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <span>{{ mensajeError() }}</span>
            </div>
          }

          <!-- Campo Usuario -->
          <div class="space-y-1">
            <label class="block text-[11px] font-black uppercase text-[#07483b]">
              Usuario o Correo Institucional:
            </label>
            <div class="relative">
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </span>
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
              <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
              </span>
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
                @if (mostrarClave()) {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"/></svg>
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                }
              </button>
            </div>
          </div>

          <!-- Botón de Inicio de Sesión Normal -->
          <button 
            type="submit"
            class="w-full py-3 px-4 rounded-xl bg-[#07483b] hover:bg-[#0b5948] text-white font-black text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-2 mt-2"
          >
            <svg class="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
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
              <svg class="w-4 h-4 text-[#07483b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
              <span>Modo Invitado / Público (Solo Lectura)</span>
            </div>
            <span class="text-[10px] text-[#648279] bg-white px-2 py-0.5 rounded border border-[#d2dfd8]">Sin edición</span>
          </button>

          <!-- Terminal de Campo para Paramédicos (Opcional Colapsable) -->
          <details class="pt-2 border-t border-[#d2dfd8] text-[11px]">
            <summary class="font-bold text-[#405c54] hover:text-[#07483b] cursor-pointer">
              ¿Terminal de campo compartida? Seleccionar Paramédico
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
