export type TriageColor = 'ROJO' | 'AMARILLO' | 'VERDE' | 'NEGRO';

export type AtencionEstado = 
  | 'DISPONIBLE'
  | 'EN_ATENCION'
  | 'TRASLADO_AL_ACV'
  | 'PENDIENTE_TRIAGE'
  | 'EN_SALA_ESPERA'
  | 'EN_CONSULTA'
  | 'OBSERVACION'
  | 'TRASLADO_AMBULANCIA'
  | 'EN_AMBULANCIA'
  | 'ALTA_IN_SITU'
  | 'ALTA_ACV'
  | 'ALTA_AMBULANCIA'
  | 'TRASLADO_HOSPITALARIO';

export type MotivoAtencion = 
  | 'Trauma o caída'
  | 'Malestar general'
  | 'Dolor torácico'
  | 'Dificultad respiratoria'
  | 'Síncope o convulsión'
  | 'Intoxicación'
  | 'Lesión leve'
  | 'Crisis de ansiedad'
  | 'Herida cortante'
  | 'Otro motivo';

export type MedioTraslado = 
  | 'Marcha asistida'
  | 'Silla de ruedas'
  | 'Camilla'
  | 'Ambulancia';

export type CondicionAparente = 
  | 'Aparentemente estable'
  | 'Requiere vigilancia continua'
  | 'Compromiso vital / Inestable';

export interface Sector {
  id: string;
  codigo: string;
  nombre: string;
  capacidadPersonal: number;
  personalAsignado: string[];
  totalAtenciones: number;
  alertasActivas: number;
}

export interface ACV {
  id: string;
  codigo: string; // ACV-1, ACV-2
  nombre: string;
  ubicacion: string;
  encargado: string;
  capacidadCamillas: number;
  activo: boolean;
}

export interface Ambulancia {
  id: string;
  codigo: string; // ALFA-01, BRAVO-02
  placa: string;
  tipo: 'Soporte Vital Avanzado' | 'Soporte Vital Básico';
  paramedicoResponsable: string;
  conductor?: string;
  estado: 'DISPONIBLE' | 'EN_TRASLADO' | 'EN_SITIO' | 'EN_HOSPITAL';
  hospitalActual?: string;
  activo: boolean;
}

export interface SuperUsuario {
  id: string;
  nombre: string;
  usuario: string;
  passwordTemporal: string;
  rol: 'SUPER_ADMIN' | 'DIRECTOR_MEDICO' | 'JEFE_OPERACIONES';
  telefono: string;
  email: string;
}

export interface Paramedico {
  id: string;
  nombre: string;
  usuario: string;
  passwordTemporal: string;
  rol: 'PARAMEDICO_CAMPO' | 'PARAMEDICO_ACV' | 'PARAMEDICO_AMBULANCIA';
  sectorActualId: string;
  sectorNombre: string;
  estado: 'DISPONIBLE' | 'EN_ATENCION' | 'EN_TRASLADO' | 'EN_DESCANSO';
  atencionActualId?: string;
  telefono: string;
  activo: boolean;
}

export interface InvitadoUsuario {
  id: string;
  nombre: string;
  usuario: string;
  passwordTemporal?: string;
  rol: 'INVITADO';
  telefono?: string;
  email?: string;
}

export type UsuarioSesion = SuperUsuario | Paramedico | InvitadoUsuario;

export interface SignosVitales {
  fc: number; // lpm
  paSistolica: number; // mmHg
  paDiastolica: number; // mmHg
  fr: number; // rpm
  spo2: number; // %
  temperatura: number; // °C
  glasgow: number; // 3-15
  glucometria?: number; // mg/dL
}

export interface Atencion {
  id: string; // ej. AT-004
  codigo: string;
  eventoId: string;
  sectorId: string;
  sectorNombre: string;
  ubicacionEspecifica: string;
  paramedicoId: string;
  paramedicoNombre: string;
  motivo: MotivoAtencion;
  motivoDetalle?: string;
  estado: AtencionEstado;
  horaInicio: string;

  // Datos Filiares del Paciente (Cédula de Ecuador requerida por el cliente)
  cedula?: string; // 10 dígitos Ecuador
  nombresPaciente?: string;
  apellidosPaciente?: string;
  edadPaciente?: number;
  generoPaciente?: 'M' | 'F' | 'OTRO';

  // Medicación administrada
  medicamentosInSitu?: string;

  // Traslado hacia ACV o Ambulancia
  destinoInicial?: 'ACV' | 'AMBULANCIA' | 'IN_SITU';
  acvDestinoId?: string; // ACV 1 o ACV 2
  acvDestinoNombre?: string;
  medioTraslado?: MedioTraslado;
  condicionAparente?: CondicionAparente;
  observacionesTraslado?: string;
  horaInicioTraslado?: string;
  horaLlegadaACV?: string;

  // Triage ACV
  triage?: TriageColor;
  triageHora?: string;
  triageEvaluador?: string;

  // Consulta en ACV
  medicoAsignado?: string;
  signosVitales?: SignosVitales;
  anamnesis?: string;
  examenFisico?: string;
  diagnostico?: string;
  tratamiento?: string;
  resolucionACV?: 'ALTA_ACV' | 'OBSERVACION' | 'TRASLADO_AMBULANCIA';
  horaResolucionACV?: string;

  // Módulo de Ambulancia y Derivación Hospitalaria
  ambulanciaId?: string;
  ambulanciaCodigo?: string;
  paramedicoAmbulancia?: string;
  horaLlegadaAmbulancia?: string;
  resolucionAmbulancia?: 'ALTA_AMBULATORIA' | 'TRASLADO_HOSPITAL';
  hojaAtencionNumero?: string; // N° de Hoja de Atención Prehospitalaria MSP
  casaSaludDestino?: string; // Hospital de Destino
  medicoReceptorHospital?: string; // Nombre del Médico que recibe en Emergencias
  horaEntregaHospital?: string;
  observacionesAmbulancia?: string;
}

export interface EventoOperativo {
  id: string;
  nombre: string;
  tipo: string;
  ciudad: string;
  lugar: string;
  fecha: string;
  horario: string;
  riesgo: 'Bajo' | 'Medio' | 'Alto' | 'Extremo';
  aforoEstimado: number;
}

export interface LogAuditoria {
  id: string;
  timestamp: string; // ej: 18:24:12
  fecha: string;
  usuario: string; // ej: pedro.zavala, param02
  nombreUsuario: string;
  rol: string;
  accion: 'INICIO_SESION' | 'NUEVA_ATENCION' | 'TRIAGE_ASIGNADO' | 'TRASLADO_ACV' | 'ALTA_MEDICA' | 'DERIVACION_HOSPITAL' | 'ALERTA_EMITIDA' | 'CAMBIO_SECTOR';
  detalles: string;
  dispositivo: string;
}
