import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ParamedicMobileComponent } from './components/paramedic-mobile/paramedic-mobile.component';
import { MedicalAcvComponent } from './components/medical-acv/medical-acv.component';
import { AmbulanceComponent } from './components/ambulance/ambulance.component';
import { AdminPanelComponent } from './components/admin-panel/admin-panel.component';
import { SupabaseModalComponent } from './components/supabase-modal/supabase-modal.component';
import { ReportModalComponent } from './components/report-modal/report-modal.component';
import { CustomizerSidebarComponent } from './components/customizer-sidebar/customizer-sidebar.component';
import { LoginModalComponent } from './components/login-modal/login-modal.component';
import { NetworkModalComponent } from './components/network-modal/network-modal.component';
import { EmergencyService } from './services/emergency.service';
import { CustomizerService } from './services/customizer.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    DashboardComponent,
    ParamedicMobileComponent,
    MedicalAcvComponent,
    AmbulanceComponent,
    AdminPanelComponent,
    SupabaseModalComponent,
    ReportModalComponent,
    CustomizerSidebarComponent,
    LoginModalComponent,
    NetworkModalComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit, OnDestroy {
  emergency = inject(EmergencyService);
  customizer = inject(CustomizerService);

  vistaActiva = signal<'dashboard' | 'movil' | 'acv' | 'ambulancia' | 'admin'>('dashboard');
  mostrarModalSupabase = signal(false);
  mostrarModalReporte = signal(false);
  mostrarModalLogin = signal(false);
  mostrarModalRed = signal(false);

  private listenerCambiarVista = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    this.vistaActiva.set(detail);
  };

  private listenerAbrirSupabase = () => {
    this.mostrarModalSupabase.set(true);
  };

  private listenerCerrarSupabase = () => {
    this.mostrarModalSupabase.set(false);
  };

  private listenerAbrirReporte = () => {
    this.mostrarModalReporte.set(true);
  };

  private listenerCerrarReporte = () => {
    this.mostrarModalReporte.set(false);
  };

  private listenerAbrirLogin = () => {
    this.mostrarModalLogin.set(true);
  };

  private listenerCerrarLogin = () => {
    this.mostrarModalLogin.set(false);
  };

  private listenerAbrirRed = () => {
    this.mostrarModalRed.set(true);
  };

  private listenerCerrarRed = () => {
    this.mostrarModalRed.set(false);
  };

  ngOnInit() {
    window.addEventListener('cambiar-vista', this.listenerCambiarVista);
    window.addEventListener('abrir-modal-supabase', this.listenerAbrirSupabase);
    window.addEventListener('cerrar-modal-supabase', this.listenerCerrarSupabase);
    window.addEventListener('abrir-modal-reporte', this.listenerAbrirReporte);
    window.addEventListener('cerrar-modal-reporte', this.listenerCerrarReporte);
    window.addEventListener('abrir-modal-login', this.listenerAbrirLogin);
    window.addEventListener('cerrar-modal-login', this.listenerCerrarLogin);
    window.addEventListener('abrir-modal-red', this.listenerAbrirRed);
    window.addEventListener('cerrar-modal-red', this.listenerCerrarRed);
  }

  ngOnDestroy() {
    window.removeEventListener('cambiar-vista', this.listenerCambiarVista);
    window.removeEventListener('abrir-modal-supabase', this.listenerAbrirSupabase);
    window.removeEventListener('cerrar-modal-supabase', this.listenerCerrarSupabase);
    window.removeEventListener('abrir-modal-reporte', this.listenerAbrirReporte);
    window.removeEventListener('cerrar-modal-reporte', this.listenerCerrarReporte);
    window.removeEventListener('abrir-modal-login', this.listenerAbrirLogin);
    window.removeEventListener('cerrar-modal-login', this.listenerCerrarLogin);
    window.removeEventListener('abrir-modal-red', this.listenerAbrirRed);
    window.removeEventListener('cerrar-modal-red', this.listenerCerrarRed);
  }
}
