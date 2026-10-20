import { Injectable, signal, computed, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { 
  Atencion, 
  Sector, 
  Paramedico, 
  EventoOperativo, 
  TriageColor, 
  MotivoAtencion,
  MedioTraslado,
  CondicionAparente,
  SignosVitales,
  ACV,
  Ambulancia,
  SuperUsuario,
  InvitadoUsuario,
  UsuarioSesion,
  LogAuditoria
} from '../models/emergency.model';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class EmergencyService implements OnDestroy {
  private http = inject(HttpClient);
  private intervaloSync: any = null;
  private syncEnProgreso = false;

  private get baseUrl(): string {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const serverParam = params.get('server');
      if (serverParam) {
        localStorage.setItem('sepam_server_host', serverParam.trim());
        return serverParam.trim();
      }

      const savedHost = localStorage.getItem('sepam_server_host');
      if (savedHost) {
        return savedHost;
      }

      if (window.location.protocol === 'capacitor:' || window.location.protocol === 'file:') {
        return 'http://192.168.137.1:8000';
      }

      if (window.location.port === '4200') {
        return `http://${window.location.hostname}:8000`;
      }
    }
    return '';
  }

  // Bitácora / Log de Auditoría Operativa y Accesos (Reporte 2 Técnico para el Administrador)
  logsAuditoria = signal<LogAuditoria[]>([
    {
      id: 'log-1',
      timestamp: '16:00:15',
      fecha: '30/09/2026',
      usuario: 'pedro.zavala',
      nombreUsuario: 'Pedro Zavala',
      rol: 'JEFE_OPERACIONES',
      accion: 'INICIO_SESION',
      detalles: 'Apertura del Puesto de Mando Unificado (PMU). Puesto activo.',
      dispositivo: 'PC Mando Central (Host LAN)'
    },
    {
      id: 'log-2',
      timestamp: '16:05:22',
      fecha: '30/09/2026',
      usuario: 'sebastian.zavala',
      nombreUsuario: 'Sebastian Zavala',
      rol: 'DIRECTOR_MEDICO',
      accion: 'INICIO_SESION',
      detalles: 'Ingreso al sistema. Supervisión médica activa.',
      dispositivo: 'PC Mando Central (Host LAN)'
    },
    {
      id: 'log-3',
      timestamp: '16:15:40',
      fecha: '30/09/2026',
      usuario: 'param02',
      nombreUsuario: 'Aldahir Lara',
      rol: 'PARAMEDICO_CAMPO',
      accion: 'INICIO_SESION',
      detalles: 'Conexión desde móvil APK. Asignado a ZONA A - GRADAS.',
      dispositivo: 'Móvil Android (TP-Link Wi-Fi)'
    },
    {
      id: 'log-4',
      timestamp: '16:29:10',
      fecha: '30/09/2026',
      usuario: 'param01',
      nombreUsuario: 'Zuleyka Lara',
      rol: 'PARAMEDICO_CAMPO',
      accion: 'NUEVA_ATENCION',
      detalles: 'Registro de atención AT-004. Paciente: Pedro Picapiedra. Motivo: Trauma o caída.',
      dispositivo: 'Móvil Android (TP-Link Wi-Fi)'
    },
    {
      id: 'log-5',
      timestamp: '16:34:02',
      fecha: '30/09/2026',
      usuario: 'param01',
      nombreUsuario: 'Zuleyka Lara',
      rol: 'PARAMEDICO_CAMPO',
      accion: 'TRASLADO_ACV',
      detalles: 'Solicitud de camilla y traslado hacia ACV 1 - TRIBUNA NORTE.',
      dispositivo: 'Móvil Android (TP-Link Wi-Fi)'
    },
    {
      id: 'log-6',
      timestamp: '16:40:15',
      fecha: '30/09/2026',
      usuario: 'param13',
      nombreUsuario: 'Paulina Barreno',
      rol: 'PARAMEDICO_ACV',
      accion: 'TRIAGE_ASIGNADO',
      detalles: 'Recepción en ACV-1. Clasificación Triage: AMARILLO. Signos vitales estables.',
      dispositivo: 'Móvil Android (TP-Link Wi-Fi)'
    },
    {
      id: 'log-7',
      timestamp: '17:15:30',
      fecha: '30/09/2026',
      usuario: 'param03',
      nombreUsuario: 'Carlos Mendoza',
      rol: 'PARAMEDICO_AMBULANCIA',
      accion: 'DERIVACION_HOSPITAL',
      detalles: 'Unidad ALFA-01: Traslado hospitalario a Hospital Eugenio Espejo (Hoja MSP-002: #78291).',
      dispositivo: 'Móvil Ambulancia (TP-Link Wi-Fi)'
    }
  ]);
  
  // 3 Super Usuarios de Gestión Maestro (admin1, Pedro Zavala, Sebastian Zavala)
  superUsuarios = signal<SuperUsuario[]>([
    {
      id: 'su-1',
      nombre: 'admin1 (Administrador General SEPAM)',
      usuario: 'admin1',
      passwordTemporal: 'admin2026*',
      rol: 'SUPER_ADMIN',
      telefono: '0990001122',
      email: 'admin1@sepamecuador.com'
    },
    {
      id: 'su-2',
      nombre: 'Pedro Zavala (Director de Operaciones)',
      usuario: 'pedro.zavala',
      passwordTemporal: 'zavala2026*',
      rol: 'JEFE_OPERACIONES',
      telefono: '0993334455',
      email: 'pedro.zavala@sepamecuador.com'
    },
    {
      id: 'su-3',
      nombre: 'Sebastian Zavala (Director Médico)',
      usuario: 'sebastian.zavala',
      passwordTemporal: 'zavala2026*',
      rol: 'DIRECTOR_MEDICO',
      telefono: '0995556677',
      email: 'sebastian.zavala@sepamecuador.com'
    }
  ]);

  // Sesión actual del sistema (Por defecto: Modo Invitado / Público, sin botones de edición visibles)
  usuarioSesion = signal<UsuarioSesion>({
    id: 'invitado',
    nombre: 'Invitado (Acceso Público)',
    usuario: 'invitado',
    rol: 'INVITADO'
  });

  esSuperUsuario = computed(() => {
    const u = this.usuarioSesion();
    return 'rol' in u && ['SUPER_ADMIN', 'DIRECTOR_MEDICO', 'JEFE_OPERACIONES'].includes(u.rol as string);
  });

  esInvitado = computed(() => {
    const u = this.usuarioSesion();
    return u.rol === 'INVITADO';
  });

  // Evento activo: Concierto de Chino y Nacho
  evento = signal<EventoOperativo>({
    id: 'evt-001',
    nombre: 'CONCIERTO CHINO Y NACHO',
    tipo: 'Concierto Masivo',
    ciudad: 'QUITO',
    lugar: 'Estadio Olímpico Atahualpa / Explanada',
    fecha: '30 de septiembre de 2026',
    horario: '16:00 - 23:30',
    riesgo: 'Alto',
    aforoEstimado: 28000
  });

  // Sectores operativos base
  sectoresBase = signal<Sector[]>([
    {
      id: 'sec-a',
      codigo: 'ZONA A',
      nombre: 'ZONA A - GRADAS',
      capacidadPersonal: 4,
      personalAsignado: ['param-2', 'param-5', 'param-6'],
      totalAtenciones: 0,
      alertasActivas: 0
    },
    {
      id: 'sec-b',
      codigo: 'ZONA B',
      nombre: 'ZONA B - PUERTA Y ACCESOS',
      capacidadPersonal: 4,
      personalAsignado: ['param-1', 'param-7'],
      totalAtenciones: 0,
      alertasActivas: 0
    },
    {
      id: 'sec-c',
      codigo: 'ZONA C',
      nombre: 'ZONA C - ESCENARIO Y FOSO',
      capacidadPersonal: 6,
      personalAsignado: ['param-3', 'param-4', 'param-8'],
      totalAtenciones: 0,
      alertasActivas: 0
    },
    {
      id: 'sec-d',
      codigo: 'ZONA D',
      nombre: 'ZONA D - GENERAL Y CANCHA',
      capacidadPersonal: 6,
      personalAsignado: ['param-9', 'param-10', 'param-11', 'param-12'],
      totalAtenciones: 0,
      alertasActivas: 0
    }
  ]);

  // Áreas de Concentración de Víctimas (Múltiples ACV solicitados en audio)
  acvs = signal<ACV[]>([
    {
      id: 'acv-1',
      codigo: 'ACV-1',
      nombre: 'ACV 1 - TRIBUNA NORTE (PMA Principal)',
      ubicacion: 'Túnel Norte, Puerta 3',
      encargado: 'Dr. Josué Andrés (Médico)',
      capacidadCamillas: 8,
      activo: true
    },
    {
      id: 'acv-2',
      codigo: 'ACV-2',
      nombre: 'ACV 2 - GENERAL SUR (PMA Secundario)',
      ubicacion: 'Explanada Sur, Vía Perimetral',
      encargado: 'Lcdo. Marcos Cevallos (Paramédico Avanzado)',
      capacidadCamillas: 6,
      activo: true
    }
  ]);

  // Ambulancias registradas (Solicitado en audio: ambulancia como entidad clave de derivación)
  ambulancias = signal<Ambulancia[]>([
    {
      id: 'amb-1',
      codigo: 'ALFA-01',
      placa: 'PBA-4501',
      tipo: 'Soporte Vital Avanzado',
      paramedicoResponsable: 'Paramed. Carlos Mendoza',
      conductor: 'Sgto. Byron Toapanta',
      estado: 'DISPONIBLE',
      activo: true
    },
    {
      id: 'amb-2',
      codigo: 'BRAVO-02',
      placa: 'PBA-8922',
      tipo: 'Soporte Vital Básico',
      paramedicoResponsable: 'Paramed. Diana Morales',
      conductor: 'Cabo Luis Villacís',
      estado: 'DISPONIBLE',
      activo: true
    }
  ]);

  // 20 Paramédicos con usuario y contraseña temporal (Requerido en audio)
  personal = signal<Paramedico[]>([
    { id: 'param-1', nombre: 'Zuleyka Lara', usuario: 'param01', passwordTemporal: 'sepam01*', rol: 'PARAMEDICO_CAMPO', sectorActualId: 'sec-b', sectorNombre: 'ZONA B - PUERTA Y ACCESOS', estado: 'DISPONIBLE', telefono: '0991112201', activo: true },
    { id: 'param-2', nombre: 'Aldahir Lara', usuario: 'param02', passwordTemporal: 'sepam02*', rol: 'PARAMEDICO_CAMPO', sectorActualId: 'sec-a', sectorNombre: 'ZONA A - GRADAS', estado: 'DISPONIBLE', telefono: '0991112202', activo: true },
    { id: 'param-3', nombre: 'Carlos Mendoza', usuario: 'param03', passwordTemporal: 'sepam03*', rol: 'PARAMEDICO_AMBULANCIA', sectorActualId: 'sec-c', sectorNombre: 'ZONA C - ESCENARIO', estado: 'DISPONIBLE', telefono: '0991112203', activo: true },
    { id: 'param-4', nombre: 'Diana Morales', usuario: 'param04', passwordTemporal: 'sepam04*', rol: 'PARAMEDICO_AMBULANCIA', sectorActualId: 'sec-c', sectorNombre: 'ZONA C - ESCENARIO', estado: 'DISPONIBLE', telefono: '0991112204', activo: true },
    { id: 'param-5', nombre: 'Bryan Cajas', usuario: 'param05', passwordTemporal: 'sepam05*', rol: 'PARAMEDICO_CAMPO', sectorActualId: 'sec-a', sectorNombre: 'ZONA A - GRADAS', estado: 'DISPONIBLE', telefono: '0991112205', activo: true },
    { id: 'param-6', nombre: 'Estefanía Quishpe', usuario: 'param06', passwordTemporal: 'sepam06*', rol: 'PARAMEDICO_CAMPO', sectorActualId: 'sec-a', sectorNombre: 'ZONA A - GRADAS', estado: 'DISPONIBLE', telefono: '0991112206', activo: true },
    { id: 'param-7', nombre: 'Mateo Guanoluisa', usuario: 'param07', passwordTemporal: 'sepam07*', rol: 'PARAMEDICO_CAMPO', sectorActualId: 'sec-b', sectorNombre: 'ZONA B - PUERTA Y ACCESOS', estado: 'DISPONIBLE', telefono: '0991112207', activo: true },
    { id: 'param-8', nombre: 'Gabriela Tipán', usuario: 'param08', passwordTemporal: 'sepam08*', rol: 'PARAMEDICO_CAMPO', sectorActualId: 'sec-c', sectorNombre: 'ZONA C - ESCENARIO', estado: 'DISPONIBLE', telefono: '0991112208', activo: true },
    { id: 'param-9', nombre: 'Kevin Sornoza', usuario: 'param09', passwordTemporal: 'sepam09*', rol: 'PARAMEDICO_CAMPO', sectorActualId: 'sec-d', sectorNombre: 'ZONA D - GENERAL', estado: 'DISPONIBLE', telefono: '0991112209', activo: true },
    { id: 'param-10', nombre: 'Valeria Chimbo', usuario: 'param10', passwordTemporal: 'sepam10*', rol: 'PARAMEDICO_CAMPO', sectorActualId: 'sec-d', sectorNombre: 'ZONA D - GENERAL', estado: 'DISPONIBLE', telefono: '0991112210', activo: true },
    { id: 'param-11', nombre: 'Javier Paucar', usuario: 'param11', passwordTemporal: 'sepam11*', rol: 'PARAMEDICO_CAMPO', sectorActualId: 'sec-d', sectorNombre: 'ZONA D - GENERAL', estado: 'DISPONIBLE', telefono: '0991112211', activo: true },
    { id: 'param-12', nombre: 'Lorena Moncayo', usuario: 'param12', passwordTemporal: 'sepam12*', rol: 'PARAMEDICO_CAMPO', sectorActualId: 'sec-d', sectorNombre: 'ZONA D - GENERAL', estado: 'DISPONIBLE', telefono: '0991112212', activo: true },
    { id: 'param-13', nombre: 'Paulina Barreno', usuario: 'param13', passwordTemporal: 'sepam13*', rol: 'PARAMEDICO_ACV', sectorActualId: 'sec-c', sectorNombre: 'ACV-1 TRIBUNA NORTE', estado: 'DISPONIBLE', telefono: '0991112213', activo: true },
    { id: 'param-14', nombre: 'David Chiluisa', usuario: 'param14', passwordTemporal: 'sepam14*', rol: 'PARAMEDICO_ACV', sectorActualId: 'sec-c', sectorNombre: 'ACV-2 GENERAL SUR', estado: 'DISPONIBLE', telefono: '0991112214', activo: true },
    { id: 'param-15', nombre: 'Evelyn Sarzosa', usuario: 'param15', passwordTemporal: 'sepam15*', rol: 'PARAMEDICO_CAMPO', sectorActualId: 'sec-a', sectorNombre: 'ZONA A - GRADAS', estado: 'DISPONIBLE', telefono: '0991112215', activo: true },
    { id: 'param-16', nombre: 'Santiago Benalcázar', usuario: 'param16', passwordTemporal: 'sepam16*', rol: 'PARAMEDICO_CAMPO', sectorActualId: 'sec-b', sectorNombre: 'ZONA B - PUERTA', estado: 'DISPONIBLE', telefono: '0991112216', activo: true },
    { id: 'param-17', nombre: 'Camila Villalba', usuario: 'param17', passwordTemporal: 'sepam17*', rol: 'PARAMEDICO_CAMPO', sectorActualId: 'sec-c', sectorNombre: 'ZONA C - ESCENARIO', estado: 'DISPONIBLE', telefono: '0991112217', activo: true },
    { id: 'param-18', nombre: 'Diego Pillajo', usuario: 'param18', passwordTemporal: 'sepam18*', rol: 'PARAMEDICO_CAMPO', sectorActualId: 'sec-d', sectorNombre: 'ZONA D - GENERAL', estado: 'DISPONIBLE', telefono: '0991112218', activo: true },
    { id: 'param-19', nombre: 'Tatiana Galarza', usuario: 'param19', passwordTemporal: 'sepam19*', rol: 'PARAMEDICO_CAMPO', sectorActualId: 'sec-b', sectorNombre: 'ZONA B - PUERTA', estado: 'DISPONIBLE', telefono: '0991112219', activo: true },
    { id: 'param-20', nombre: 'Andrés Alomoto', usuario: 'param20', passwordTemporal: 'sepam20*', rol: 'PARAMEDICO_CAMPO', sectorActualId: 'sec-a', sectorNombre: 'ZONA A - GRADAS', estado: 'DISPONIBLE', telefono: '0991112220', activo: true }
  ]);

  // Paramédico móvil activo en la interfaz de celular
  paramedicoActivo = signal<Paramedico>(this.personal()[0]);

  // Atenciones operativas
  atenciones = signal<Atencion[]>([
    {
      id: 'AT-004',
      codigo: 'AT-004',
      eventoId: 'evt-001',
      sectorId: 'sec-c',
      sectorNombre: 'ZONA C - ESCENARIO',
      ubicacionEspecifica: 'Acceso Norte, junto a valla metálica',
      paramedicoId: 'param-1',
      paramedicoNombre: 'Zuleyka Lara',
      motivo: 'Trauma o caída',
      motivoDetalle: 'Caída de propia altura con contusión en rodilla derecha',
      estado: 'EN_ATENCION',
      horaInicio: '06:29 p. m.',
      cedula: '1723456789',
      nombresPaciente: 'Pedro',
      apellidosPaciente: 'Picapiedra Mármol',
      edadPaciente: 34,
      generoPaciente: 'M',
      medicamentosInSitu: 'Paracetamol 1g VO',
      medioTraslado: 'Camilla',
      condicionAparente: 'Requiere vigilancia continua',
      acvDestinoId: 'acv-1',
      acvDestinoNombre: 'ACV 1 - TRIBUNA NORTE'
    },
    {
      id: 'AT-003',
      codigo: 'AT-003',
      eventoId: 'evt-001',
      sectorId: 'sec-b',
      sectorNombre: 'ZONA B - PUERTA Y ACCESOS',
      ubicacionEspecifica: 'Torniquetes de ingreso 2',
      paramedicoId: 'param-7',
      paramedicoNombre: 'Mateo Guanoluisa',
      motivo: 'Trauma o caída',
      motivoDetalle: 'Aplastamiento leve en aglomeración',
      estado: 'PENDIENTE_TRIAGE',
      horaInicio: '06:15 p. m.',
      cedula: '1719876543',
      nombresPaciente: 'Ana Belén',
      apellidosPaciente: 'Torres Morales',
      edadPaciente: 26,
      generoPaciente: 'F',
      medioTraslado: 'Marcha asistida',
      condicionAparente: 'Aparentemente estable',
      acvDestinoId: 'acv-1',
      acvDestinoNombre: 'ACV 1 - TRIBUNA NORTE'
    },
    {
      id: 'AT-002',
      codigo: 'AT-002',
      eventoId: 'evt-001',
      sectorId: 'sec-a',
      sectorNombre: 'ZONA A - GRADAS',
      ubicacionEspecifica: 'Grada 14 - Bloque Central',
      paramedicoId: 'param-2',
      paramedicoNombre: 'Aldahir Lara',
      motivo: 'Malestar general',
      motivoDetalle: 'Lipotimia por deshidratación y calor',
      estado: 'EN_CONSULTA',
      horaInicio: '04:20 p. m.',
      cedula: '1755443322',
      nombresPaciente: 'Pedro Anuel',
      apellidosPaciente: 'Alejandro Cruz',
      edadPaciente: 22,
      triage: 'AMARILLO',
      triageHora: '04:30 p. m.',
      acvDestinoId: 'acv-2',
      acvDestinoNombre: 'ACV 2 - GENERAL SUR',
      medicoAsignado: 'Dr. Josué Andrés'
    },
    {
      id: 'AT-001',
      codigo: 'AT-001',
      eventoId: 'evt-001',
      sectorId: 'sec-a',
      sectorNombre: 'ZONA A - GRADAS',
      ubicacionEspecifica: 'Explanada lateral A',
      paramedicoId: 'param-2',
      paramedicoNombre: 'Aldahir Lara',
      motivo: 'Dolor torácico',
      motivoDetalle: 'Ansiedad reactiva por volumen musical',
      estado: 'TRASLADO_HOSPITALARIO',
      horaInicio: '03:52 p. m.',
      cedula: '1788776655',
      nombresPaciente: 'María Belén',
      apellidosPaciente: 'Gómez Salcedo',
      edadPaciente: 27,
      triage: 'ROJO',
      ambulanciaId: 'amb-1',
      ambulanciaCodigo: 'ALFA-01',
      paramedicoAmbulancia: 'Paramed. Carlos Mendoza',
      hojaAtencionNumero: 'MSP-002-8841',
      casaSaludDestino: 'Hospital de Especialidades Eugenio Espejo',
      medicoReceptorHospital: 'Dra. Patricia Viteri (Líder Emergencias)',
      horaEntregaHospital: '04:45 p. m.',
      resolucionAmbulancia: 'TRASLADO_HOSPITAL'
    }
  ]);

  notificacionActiva = signal<{ mensaje: string; tipo: 'info' | 'alerta' | 'exito' } | null>(null);
  pendientesOffline = signal<number>(0);

  // Computados
  personalOperativoTotal = computed(() => this.personal().filter(p => p.activo).length);
  personalDisponible = computed(() => this.personal().filter(p => p.activo && p.estado === 'DISPONIBLE').length);
  personalEnAtencion = computed(() => this.personal().filter(p => p.activo && p.estado === 'EN_ATENCION').length);
  
  atencionesActivas = computed(() => 
    this.atenciones().filter(a => a.estado !== 'ALTA_ACV' && a.estado !== 'ALTA_IN_SITU' && a.estado !== 'ALTA_AMBULANCIA' && a.estado !== 'TRASLADO_HOSPITALARIO').length
  );

  trasladosActivosACV = computed(() => 
    this.atenciones().filter(a => a.estado === 'TRASLADO_AL_ACV').length
  );

  trasladosActivos = computed(() => this.trasladosActivosACV());

  pacientesEnAmbulancia = computed(() => 
    this.atenciones().filter(a => a.estado === 'EN_AMBULANCIA' || a.estado === 'TRASLADO_AMBULANCIA')
  );

  // Sectores computados reactivamente en tiempo real según la lista viva de atenciones
  sectores = computed<Sector[]>(() => {
    const atencionesActuales = this.atenciones();
    return this.sectoresBase().map(sec => {
      const atencionesSector = atencionesActuales.filter(a => 
        a.sectorId === sec.id || 
        (a.sectorNombre && a.sectorNombre.toLowerCase().includes(sec.codigo.toLowerCase()))
      );

      const alertasActivas = atencionesSector.filter(a => 
        (a.triage === 'ROJO' || a.triage === 'AMARILLO') && 
        a.estado !== 'ALTA_ACV' && 
        a.estado !== 'ALTA_IN_SITU' && 
        a.estado !== 'ALTA_AMBULANCIA' && 
        a.estado !== 'TRASLADO_HOSPITALARIO'
      ).length;

      return {
        ...sec,
        totalAtenciones: atencionesSector.length,
        alertasActivas
      };
    });
  });

  constructor(private supabase: SupabaseService) {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('sepam_offline_queue') || '[]';
        this.pendientesOffline.set(JSON.parse(raw).length);
      } catch {}

      window.addEventListener('online', () => {
        this.sincronizarColaOffline();
        this.cargarAtencionesDesdeBackend();
      });
    }
    this.iniciarSincronizacionBackend();
  }

  ngOnDestroy() {
    if (this.intervaloSync) {
      clearInterval(this.intervaloSync);
      this.intervaloSync = null;
    }
  }

  // ==========================================
  // SINCRONIZACIÓN PERSISTENCIA POLÍGLOTA
  // ==========================================

  private mapearAtencionABackend(a: Atencion) {
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString();
    const timestamp = a.horaInicio || ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let derivacion = 'ALTA';
    if (a.estado === 'TRASLADO_HOSPITALARIO' || a.estado === 'EN_AMBULANCIA' || a.estado === 'TRASLADO_AMBULANCIA' || a.resolucionAmbulancia === 'TRASLADO_HOSPITAL') {
      derivacion = 'AMBULANCIA';
    } else if (a.acvDestinoId || a.estado === 'TRASLADO_AL_ACV' || a.estado === 'PENDIENTE_TRIAGE' || a.estado === 'EN_CONSULTA' || a.estado === 'EN_SALA_ESPERA') {
      derivacion = 'ACV';
    } else if (a.estado === 'ALTA_IN_SITU' || a.estado === 'ALTA_ACV' || a.estado === 'ALTA_AMBULANCIA') {
      derivacion = 'ALTA';
    }

    return {
      id: a.id,
      codigo: a.codigo || a.id,
      timestamp: timestamp,
      fecha: fecha,
      sector_id: a.sectorId || '',
      sector_nombre: a.sectorNombre || '',
      paramedico_id: a.paramedicoId || '',
      paramedico_nombre: a.paramedicoNombre || '',
      triage_color: a.triage || 'VERDE',
      paciente_nombre: (a.nombresPaciente || a.apellidosPaciente) 
        ? `${a.nombresPaciente || ''} ${a.apellidosPaciente || ''}`.trim() 
        : 'No identificado',
      paciente_edad: a.edadPaciente || 0,
      paciente_genero: a.generoPaciente || 'DESCONOCIDO',
      motivo: a.motivo || 'Sin motivo registrado',
      derivacion: derivacion,
      ambulancia_codigo: a.ambulanciaCodigo || '',
      hospital: a.casaSaludDestino || '',
      detalles: {
        cedula: a.cedula,
        nombresPaciente: a.nombresPaciente,
        apellidosPaciente: a.apellidosPaciente,
        edadPaciente: a.edadPaciente,
        generoPaciente: a.generoPaciente,
        medicamentosInSitu: a.medicamentosInSitu,
        motivoDetalle: a.motivoDetalle,
        ubicacionEspecifica: a.ubicacionEspecifica,
        estado: a.estado,
        acvDestinoId: a.acvDestinoId,
        acvDestinoNombre: a.acvDestinoNombre,
        medioTraslado: a.medioTraslado,
        condicionAparente: a.condicionAparente,
        observacionesTraslado: a.observacionesTraslado,
        triageHora: a.triageHora,
        triageEvaluador: a.triageEvaluador,
        medicoAsignado: a.medicoAsignado,
        signosVitales: a.signosVitales,
        anamnesis: a.anamnesis,
        examenFisico: a.examenFisico,
        diagnostico: a.diagnostico,
        tratamiento: a.tratamiento,
        resolucionACV: a.resolucionACV,
        ambulanciaId: a.ambulanciaId,
        paramedicoAmbulancia: a.paramedicoAmbulancia,
        hojaAtencionNumero: a.hojaAtencionNumero,
        medicoReceptorHospital: a.medicoReceptorHospital,
        observacionesAmbulancia: a.observacionesAmbulancia,
        horaEntregaHospital: a.horaEntregaHospital
      }
    };
  }

  private mapearBackendAAtencion(row: any): Atencion {
    const d = row.detalles || {};
    return {
      id: row.id || row.codigo,
      codigo: row.codigo,
      eventoId: 'evt-001',
      sectorId: row.sector_id || d.sectorId || 'sec-a',
      sectorNombre: row.sector_nombre || d.sectorNombre || 'ZONA GENERAL',
      ubicacionEspecifica: d.ubicacionEspecifica || row.sector_nombre || 'En terreno',
      paramedicoId: row.paramedico_id || d.paramedicoId || 'param-1',
      paramedicoNombre: row.paramedico_nombre || d.paramedicoNombre || 'Paramédico',
      motivo: (row.motivo as MotivoAtencion) || 'Malestar general',
      motivoDetalle: d.motivoDetalle || row.motivo,
      estado: d.estado || (row.derivacion === 'AMBULANCIA' ? 'TRASLADO_HOSPITALARIO' : (row.derivacion === 'ACV' ? 'PENDIENTE_TRIAGE' : 'EN_ATENCION')),
      horaInicio: row.timestamp || '16:00',
      cedula: d.cedula,
      nombresPaciente: d.nombresPaciente || (row.paciente_nombre !== 'No identificado' ? row.paciente_nombre : undefined),
      apellidosPaciente: d.apellidosPaciente,
      edadPaciente: row.paciente_edad || d.edadPaciente,
      generoPaciente: row.paciente_genero || d.generoPaciente || 'M',
      medicamentosInSitu: d.medicamentosInSitu,
      destinoInicial: d.destinoInicial,
      acvDestinoId: d.acvDestinoId,
      acvDestinoNombre: d.acvDestinoNombre,
      medioTraslado: d.medioTraslado,
      condicionAparente: d.condicionAparente,
      observacionesTraslado: d.observacionesTraslado,
      horaInicioTraslado: d.horaInicioTraslado,
      horaLlegadaACV: d.horaLlegadaACV,
      triage: (row.triage_color as TriageColor) || d.triage,
      triageHora: d.triageHora || row.timestamp,
      triageEvaluador: d.triageEvaluador,
      medicoAsignado: d.medicoAsignado,
      signosVitales: d.signosVitales,
      anamnesis: d.anamnesis,
      examenFisico: d.examenFisico,
      diagnostico: d.diagnostico,
      tratamiento: d.tratamiento,
      resolucionACV: d.resolucionACV,
      horaResolucionACV: d.horaResolucionACV,
      ambulanciaId: d.ambulanciaId,
      ambulanciaCodigo: row.ambulancia_codigo || d.ambulanciaCodigo,
      paramedicoAmbulancia: d.paramedicoAmbulancia,
      horaLlegadaAmbulancia: d.horaLlegadaAmbulancia,
      resolucionAmbulancia: d.resolucionAmbulancia,
      hojaAtencionNumero: d.hojaAtencionNumero,
      casaSaludDestino: row.hospital || d.casaSaludDestino,
      medicoReceptorHospital: d.medicoReceptorHospital,
      horaEntregaHospital: d.horaEntregaHospital,
      observacionesAmbulancia: d.observacionesAmbulancia
    };
  }

  guardarAtencionEnBackend(atencion: Atencion) {
    const payload = this.mapearAtencionABackend(atencion);
    this.http.post(`${this.baseUrl}/api/atenciones`, payload).subscribe({
      next: () => {
        this.sincronizarColaOffline();
      },
      error: () => {
        this.encolarAtencionOffline(payload);
      }
    });
  }

  private encolarAtencionOffline(payload: any) {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('sepam_offline_queue') || '[]';
      const cola: any[] = JSON.parse(raw);
      const idx = cola.findIndex(item => item.id === payload.id);
      if (idx >= 0) {
        cola[idx] = payload;
      } else {
        cola.push(payload);
      }
      localStorage.setItem('sepam_offline_queue', JSON.stringify(cola));
      this.pendientesOffline.set(cola.length);
    } catch {}
  }

  sincronizarColaOffline() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('sepam_offline_queue');
      if (!raw) return;
      const cola: any[] = JSON.parse(raw);
      if (cola.length === 0) {
        this.pendientesOffline.set(0);
        return;
      }
      const lote = [...cola];
      localStorage.removeItem('sepam_offline_queue');
      this.pendientesOffline.set(0);

      lote.forEach(item => {
        this.http.post(`${this.baseUrl}/api/atenciones`, item).subscribe({
          error: () => this.encolarAtencionOffline(item)
        });
      });
    } catch {}
  }

  guardarLogEnBackend(log: LogAuditoria) {
    const payload = {
      id: log.id,
      timestamp: log.timestamp,
      fecha: log.fecha,
      usuario: log.usuario,
      nombre_usuario: log.nombreUsuario,
      rol: log.rol,
      accion: log.accion,
      detalles: log.detalles,
      dispositivo: log.dispositivo
    };
    this.http.post(`${this.baseUrl}/api/logs`, payload).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  guardarEventoEnBackend(evt: EventoOperativo) {
    const payload = {
      nombre: evt.nombre,
      tipo: evt.tipo,
      ciudad: evt.ciudad,
      lugar: evt.lugar,
      fecha: evt.fecha,
      horario: evt.horario,
      riesgo: evt.riesgo,
      aforo_estimado: evt.aforoEstimado
    };
    this.http.post(`${this.baseUrl}/api/evento`, payload).subscribe({
      next: () => {},
      error: () => {}
    });
  }

  cargarAtencionesDesdeBackend() {
    if (this.syncEnProgreso) return;
    this.syncEnProgreso = true;
    this.sincronizarColaOffline();

    this.http.get<any[]>(`${this.baseUrl}/api/atenciones`).subscribe({
      next: (rows) => {
        this.syncEnProgreso = false;
        if (rows && rows.length > 0) {
          const atencionesRemotas = rows.map(r => this.mapearBackendAAtencion(r));
          this.atenciones.update(locales => {
            const mapLocales = new Map(locales.map(a => [a.id, a]));
            // Sobrescribir siempre con la versión más reciente del servidor (Triage, ACV, Ambulancia)
            atencionesRemotas.forEach(rem => {
              mapLocales.set(rem.id, rem);
            });
            return Array.from(mapLocales.values());
          });
        }
      },
      error: () => {
        this.syncEnProgreso = false;
      }
    });
  }

  cargarLogsDesdeBackend() {
    this.http.get<any[]>(`${this.baseUrl}/api/logs`).subscribe({
      next: (rows) => {
        if (rows && rows.length > 0) {
          const logsRemotos: LogAuditoria[] = rows.map(r => ({
            id: r.id,
            timestamp: r.timestamp,
            fecha: r.fecha,
            usuario: r.usuario,
            nombreUsuario: r.nombre_usuario || r.usuario,
            rol: r.rol,
            accion: r.accion,
            detalles: r.detalles,
            dispositivo: r.dispositivo || 'Web'
          }));
          this.logsAuditoria.update(locales => {
            const mapLogs = new Map(locales.map(l => [l.id, l]));
            logsRemotos.forEach(rem => mapLogs.set(rem.id, rem));
            return Array.from(mapLogs.values());
          });
        }
      },
      error: () => {}
    });
  }

  iniciarSincronizacionBackend() {
    if (typeof window === 'undefined') return;
    this.cargarAtencionesDesdeBackend();
    this.cargarLogsDesdeBackend();
    if (this.intervaloSync) clearInterval(this.intervaloSync);
    this.intervaloSync = setInterval(() => {
      this.cargarAtencionesDesdeBackend();
    }, 4000);
  }

  playTacticalAlertTone(freq: number = 880, duration: number = 0.15) {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {}
  }

  // ==========================================
  // OPERACIONES DE SUPER USUARIO (CRUD MAESTRO)
  // ==========================================
  
  agregarParamedico(nuevo: Omit<Paramedico, 'id'>) {
    const id = `param-${this.personal().length + 1}`;
    const p: Paramedico = { ...nuevo, id };
    this.personal.update(list => [...list, p]);
    this.mostrarNotificacion(`Paramédico ${p.nombre} creado con usuario ${p.usuario}`, 'exito');
  }

  editarParamedico(id: string, cambios: Partial<Paramedico>) {
    this.personal.update(list => list.map(p => p.id === id ? { ...p, ...cambios } : p));
    this.mostrarNotificacion('Paramédico actualizado correctamente', 'info');
  }

  eliminarParamedico(id: string) {
    this.personal.update(list => list.filter(p => p.id !== id));
    this.mostrarNotificacion('Paramédico eliminado del sistema', 'alerta');
  }

  agregarSector(nuevo: Omit<Sector, 'id' | 'personalAsignado' | 'totalAtenciones' | 'alertasActivas'>) {
    const id = `sec-${Date.now().toString(36)}`;
    const sec: Sector = {
      ...nuevo,
      id,
      personalAsignado: [],
      totalAtenciones: 0,
      alertasActivas: 0
    };
    this.sectoresBase.update(list => [...list, sec]);
    this.mostrarNotificacion(`Sector ${sec.nombre} añadido`, 'exito');
  }

  editarSector(id: string, cambios: Partial<Sector>) {
    this.sectoresBase.update(list => list.map(s => s.id === id ? { ...s, ...cambios } : s));
    this.mostrarNotificacion('Sector operativo modificado exitosamente', 'info');
  }

  eliminarSector(id: string) {
    this.sectoresBase.update(list => list.filter(s => s.id !== id));
    this.mostrarNotificacion('Sector eliminado', 'alerta');
  }

  agregarACV(nuevo: Omit<ACV, 'id'>) {
    const id = `acv-${this.acvs().length + 1}`;
    const item: ACV = { ...nuevo, id };
    this.acvs.update(list => [...list, item]);
    this.mostrarNotificacion(`Área de Víctimas ${item.nombre} creada`, 'exito');
  }

  editarACV(id: string, cambios: Partial<ACV>) {
    this.acvs.update(list => list.map(a => a.id === id ? { ...a, ...cambios } : a));
    this.mostrarNotificacion('Área de Víctimas (ACV) actualizada', 'info');
  }

  eliminarACV(id: string) {
    this.acvs.update(list => list.filter(a => a.id !== id));
    this.mostrarNotificacion('ACV eliminado', 'alerta');
  }

  agregarAmbulancia(nuevo: Omit<Ambulancia, 'id'>) {
    const id = `amb-${this.ambulancias().length + 1}`;
    const item: Ambulancia = { ...nuevo, id };
    this.ambulancias.update(list => [...list, item]);
    this.mostrarNotificacion(`Ambulancia ${item.codigo} registrada`, 'exito');
  }

  editarAmbulancia(id: string, cambios: Partial<Ambulancia>) {
    this.ambulancias.update(list => list.map(amb => amb.id === id ? { ...amb, ...cambios } : amb));
    this.mostrarNotificacion('Unidad de ambulancia actualizada', 'info');
  }

  eliminarAmbulancia(id: string) {
    this.ambulancias.update(list => list.filter(a => a.id !== id));
    this.mostrarNotificacion('Ambulancia eliminada', 'alerta');
  }

  importarParamedicos(lista: Paramedico[]) {
    this.personal.update(prev => [...prev, ...lista]);
    this.mostrarNotificacion(`Se importaron ${lista.length} paramédicos al sistema`, 'exito');
  }

  importarAmbulancias(lista: Ambulancia[]) {
    this.ambulancias.update(prev => [...prev, ...lista]);
    this.mostrarNotificacion(`Se importaron ${lista.length} ambulancias al sistema`, 'exito');
  }

  importarACVs(lista: ACV[]) {
    this.acvs.update(prev => [...prev, ...lista]);
    this.mostrarNotificacion(`Se importaron ${lista.length} áreas ACV al sistema`, 'exito');
  }

  actualizarEvento(datos: Partial<EventoOperativo>) {
    this.evento.update(e => ({ ...e, ...datos }));
    this.guardarEventoEnBackend(this.evento());
    this.mostrarNotificacion('Datos del evento masivo actualizados', 'exito');
  }

  // ==========================================
  // FLUJO DE ATENCIÓN DE CAMPO (PARAMÉDICO)
  // ==========================================

  iniciarAtencion(
    motivo: MotivoAtencion, 
    ubicacion: string,
    datosPaciente?: { cedula?: string; nombres?: string; apellidos?: string; edad?: number; genero?: 'M'|'F'|'OTRO'; medicamentos?: string }
  ): Atencion {
    const param = this.paramedicoActivo();
    const count = this.atenciones().length + 1;
    const nuevoId = `AT-${count.toString().padStart(3, '0')}`;
    const ahora = new Date();
    const horaFormateada = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const nuevaAtencion: Atencion = {
      id: nuevoId,
      codigo: nuevoId,
      eventoId: this.evento().id,
      sectorId: param.sectorActualId,
      sectorNombre: param.sectorNombre,
      ubicacionEspecifica: ubicacion || `Sector asignado ${param.sectorNombre}`,
      paramedicoId: param.id,
      paramedicoNombre: param.nombre,
      motivo: motivo,
      estado: 'EN_ATENCION',
      horaInicio: horaFormateada,
      cedula: datosPaciente?.cedula,
      nombresPaciente: datosPaciente?.nombres,
      apellidosPaciente: datosPaciente?.apellidos,
      edadPaciente: datosPaciente?.edad,
      generoPaciente: datosPaciente?.genero || 'M',
      medicamentosInSitu: datosPaciente?.medicamentos
    };

    this.actualizarEstadoParamedico(param.id, 'EN_ATENCION', nuevoId);
    this.atenciones.update(list => [nuevaAtencion, ...list]);
    this.guardarAtencionEnBackend(nuevaAtencion);
    this.playTacticalAlertTone(800, 0.2);
    this.mostrarNotificacion(`Nueva atención iniciada: ${nuevoId} por ${param.nombre}`, 'alerta');

    return nuevaAtencion;
  }

  altaInSitu(atencionId: string, medicamentos: string) {
    this.atenciones.update(list => list.map(a => {
      if (a.id === atencionId) {
        return {
          ...a,
          estado: 'ALTA_IN_SITU',
          medicamentosInSitu: medicamentos || a.medicamentosInSitu
        };
      }
      return a;
    }));

    const param = this.paramedicoActivo();
    this.actualizarEstadoParamedico(param.id, 'DISPONIBLE');
    const act = this.atenciones().find(a => a.id === atencionId);
    if (act) this.guardarAtencionEnBackend(act);
    this.mostrarNotificacion(`Atención ${atencionId} resuelta in situ. Alta médica otorgada.`, 'exito');
  }

  iniciarTrasladoACV(
    atencionId: string, 
    acvId: string, 
    medio: MedioTraslado, 
    condicion: CondicionAparente, 
    observaciones: string
  ) {
    const acv = this.acvs().find(a => a.id === acvId);
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.atenciones.update(list => list.map(a => {
      if (a.id === atencionId) {
        return {
          ...a,
          estado: 'TRASLADO_AL_ACV',
          acvDestinoId: acvId,
          acvDestinoNombre: acv?.nombre || 'ACV',
          medioTraslado: medio,
          condicionAparente: condicion,
          observacionesTraslado: observaciones,
          horaInicioTraslado: hora
        };
      }
      return a;
    }));

    const param = this.paramedicoActivo();
    this.actualizarEstadoParamedico(param.id, 'EN_TRASLADO', atencionId);
    const act = this.atenciones().find(a => a.id === atencionId);
    if (act) this.guardarAtencionEnBackend(act);
    this.playTacticalAlertTone(650, 0.2);
    this.mostrarNotificacion(`Traslado iniciado para ${atencionId} hacia ${acv?.codigo || 'ACV'}`, 'info');
  }

  // ==========================================
  // FLUJO DE RECEPCIÓN Y CONSULTA EN ACV (1 Y 2)
  // ==========================================

  recibirEnACV(atencionId: string, datos?: { cedula?: string; nombres?: string; apellidos?: string; edad?: number; medicamentos?: string }) {
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.atenciones.update(list => list.map(a => {
      if (a.id === atencionId) {
        return {
          ...a,
          estado: 'PENDIENTE_TRIAGE',
          horaLlegadaACV: hora,
          cedula: datos?.cedula || a.cedula,
          nombresPaciente: datos?.nombres || a.nombresPaciente,
          apellidosPaciente: datos?.apellidos || a.apellidosPaciente,
          edadPaciente: datos?.edad || a.edadPaciente,
          medicamentosInSitu: datos?.medicamentos || a.medicamentosInSitu
        };
      }
      return a;
    }));

    const atencion = this.atenciones().find(a => a.id === atencionId);
    if (atencion) {
      this.actualizarEstadoParamedico(atencion.paramedicoId, 'DISPONIBLE');
      this.guardarAtencionEnBackend(atencion);
    }

    this.playTacticalAlertTone(900, 0.1);
    this.mostrarNotificacion(`Paciente ${atencionId} recibido en ACV. Listo para Triage START.`, 'info');
  }

  clasificarTriage(atencionId: string, color: TriageColor, evaluador: string) {
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.atenciones.update(list => list.map(a => {
      if (a.id === atencionId) {
        return {
          ...a,
          triage: color,
          triageHora: hora,
          triageEvaluador: evaluador,
          estado: 'EN_SALA_ESPERA'
        };
      }
      return a;
    }));

    const act = this.atenciones().find(a => a.id === atencionId);
    if (act) {
      this.guardarAtencionEnBackend(act);
    }

    this.playTacticalAlertTone(color === 'ROJO' ? 1200 : 700, 0.25);
    this.mostrarNotificacion(`Triage ${color} asignado a ${atencionId}`, color === 'ROJO' ? 'alerta' : 'exito');
  }

  llamarAConsultaACV(atencionId: string, medicoNombre: string) {
    this.atenciones.update(list => list.map(a => a.id === atencionId ? { ...a, estado: 'EN_CONSULTA', medicoAsignado: medicoNombre } : a));
    const act = this.atenciones().find(a => a.id === atencionId);
    if (act) this.guardarAtencionEnBackend(act);
    this.mostrarNotificacion(`Paciente ${atencionId} ingresó a consulta con ${medicoNombre}`, 'info');
  }

  finalizarConsultaACV(
    atencionId: string, 
    resolucion: 'ALTA_ACV' | 'OBSERVACION' | 'TRASLADO_AMBULANCIA',
    signos: SignosVitales,
    anamnesis: string,
    diagnostico: string,
    tratamiento: string,
    ambulanciaIdDestino?: string
  ) {
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.atenciones.update(list => list.map(a => {
      if (a.id === atencionId) {
        return {
          ...a,
          resolucionACV: resolucion,
          estado: resolucion === 'OBSERVACION' ? 'OBSERVACION' : (resolucion === 'ALTA_ACV' ? 'ALTA_ACV' : 'TRASLADO_AMBULANCIA'),
          horaResolucionACV: hora,
          signosVitales: signos,
          anamnesis,
          diagnostico,
          tratamiento,
          ambulanciaId: ambulanciaIdDestino
        };
      }
      return a;
    }));

    const act = this.atenciones().find(a => a.id === atencionId);
    if (act) this.guardarAtencionEnBackend(act);
    this.mostrarNotificacion(`Resolución ACV registrada para ${atencionId}`, 'exito');
  }

  // ==========================================
  // FLUJO DE AMBULANCIA Y DERIVACIÓN A HOSPITALES
  // (Petición clave del audio del cliente)
  // ==========================================

  derivarDirectoAmbulancia(atencionId: string, ambulanciaId: string) {
    const amb = this.ambulancias().find(a => a.id === ambulanciaId);
    this.atenciones.update(list => list.map(a => {
      if (a.id === atencionId) {
        return {
          ...a,
          estado: 'TRASLADO_AMBULANCIA',
          ambulanciaId,
          ambulanciaCodigo: amb?.codigo
        };
      }
      return a;
    }));

    const act = this.atenciones().find(a => a.id === atencionId);
    if (act) this.guardarAtencionEnBackend(act);
    this.mostrarNotificacion(`Paciente ${atencionId} derivado hacia ambulancia ${amb?.codigo}`, 'alerta');
  }

  recibirEnAmbulancia(atencionId: string, ambulanciaId: string) {
    const amb = this.ambulancias().find(a => a.id === ambulanciaId);
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.atenciones.update(list => list.map(a => {
      if (a.id === atencionId) {
        return {
          ...a,
          estado: 'EN_AMBULANCIA',
          ambulanciaId,
          ambulanciaCodigo: amb?.codigo,
          paramedicoAmbulancia: amb?.paramedicoResponsable,
          horaLlegadaAmbulancia: hora
        };
      }
      return a;
    }));

    const act = this.atenciones().find(a => a.id === atencionId);
    if (act) this.guardarAtencionEnBackend(act);
    this.mostrarNotificacion(`Paciente ${atencionId} abordó la ambulancia ${amb?.codigo}`, 'info');
  }

  finalizarEnAmbulancia(
    atencionId: string,
    resolucion: 'ALTA_AMBULATORIA' | 'TRASLADO_HOSPITAL',
    hojaAtencion: string,
    casaSalud: string,
    medicoReceptor: string,
    observaciones: string
  ) {
    const ahora = new Date();
    const hora = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    this.atenciones.update(list => list.map(a => {
      if (a.id === atencionId) {
        return {
          ...a,
          estado: resolucion === 'ALTA_AMBULATORIA' ? 'ALTA_AMBULANCIA' : 'TRASLADO_HOSPITALARIO',
          resolucionAmbulancia: resolucion,
          hojaAtencionNumero: hojaAtencion,
          casaSaludDestino: casaSalud,
          medicoReceptorHospital: medicoReceptor,
          horaEntregaHospital: hora,
          observacionesAmbulancia: observaciones
        };
      }
      return a;
    }));

    const act = this.atenciones().find(a => a.id === atencionId);
    if (act) this.guardarAtencionEnBackend(act);
    this.playTacticalAlertTone(500, 0.4);
    const msj = resolucion === 'ALTA_AMBULATORIA'
      ? `Alta ambulatoria emitida en unidad móvil para ${atencionId}`
      : `Traslado hospitalario completado: ${atencionId} entregado en ${casaSalud} a ${medicoReceptor}`;
    this.mostrarNotificacion(msj, 'exito');
  }

  cambiarSectorParamedico(paramedicoId: string, nuevoSectorId: string) {
    const sector = this.sectores().find(s => s.id === nuevoSectorId);
    if (!sector) return;

    this.personal.update(list => list.map(p => p.id === paramedicoId ? { ...p, sectorActualId: nuevoSectorId, sectorNombre: sector.nombre } : p));
    if (this.paramedicoActivo().id === paramedicoId) {
      this.paramedicoActivo.update(p => ({ ...p, sectorActualId: nuevoSectorId, sectorNombre: sector.nombre }));
    }
    this.mostrarNotificacion(`Paramédico reubicado a ${sector.nombre}`, 'info');
  }

  setParamedicoActivo(param: Paramedico) {
    this.paramedicoActivo.set(param);
  }

  registrarLog(accion: LogAuditoria['accion'], detalles: string) {
    const ahora = new Date();
    const timestamp = ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const fecha = ahora.toLocaleDateString();
    const u = this.usuarioSesion();

    const nuevoLog: LogAuditoria = {
      id: `log-${Date.now()}`,
      timestamp,
      fecha,
      usuario: u.usuario,
      nombreUsuario: u.nombre,
      rol: u.rol,
      accion,
      detalles,
      dispositivo: this.esSuperUsuario() ? 'PC Mando Central (Host LAN)' : 'Móvil Paramédico (TP-Link Wi-Fi)'
    };

    this.logsAuditoria.update(logs => [nuevoLog, ...logs]);
    this.guardarLogEnBackend(nuevoLog);
  }

  setUsuarioSesion(usr: UsuarioSesion) {
    this.usuarioSesion.set(usr);
    this.registrarLog('INICIO_SESION', `Sesión activa: ${usr.nombre} (${usr.rol})`);
    this.mostrarNotificacion(`Sesión iniciada como: ${usr.nombre}`, 'info');
  }

  cerrarSesionAInvitado() {
    this.setUsuarioSesion({
      id: 'invitado',
      nombre: 'Invitado (Acceso Público)',
      usuario: 'invitado',
      rol: 'INVITADO'
    });
    this.mostrarNotificacion('Sesión cambiada a Modo Invitado (Solo Lectura)', 'info');
  }

  private actualizarEstadoParamedico(paramId: string, estado: 'DISPONIBLE' | 'EN_ATENCION' | 'EN_TRASLADO' | 'EN_DESCANSO', atencionId?: string) {
    this.personal.update(list => list.map(p => p.id === paramId ? { ...p, estado, atencionActualId: atencionId } : p));
    if (this.paramedicoActivo().id === paramId) {
      this.paramedicoActivo.update(p => ({ ...p, estado, atencionActualId: atencionId }));
    }
  }

  mostrarNotificacion(mensaje: string, tipo: 'info' | 'alerta' | 'exito') {
    this.notificacionActiva.set({ mensaje, tipo });
    setTimeout(() => {
      this.notificacionActiva.set(null);
    }, 4500);
  }
}
