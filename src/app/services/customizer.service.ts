import { Injectable, signal, effect } from '@angular/core';

export interface ThemeConfig {
  nombrePreset: string;
  colorHeader: string;
  colorHeaderTexto: string;
  colorFondo: string;
  colorTarjeta: string;
  colorTarjetaSecundaria: string;
  colorBorde: string;
  colorPrimario: string; // Botones y acentos principales
  colorPrimarioHover: string;
  colorTexto: string;
  colorTextoSecundario: string;
}

export interface CustomWidget {
  id: string;
  titulo: string;
  contenido: string;
  colorBorde: string;
  icono: string;
}

export interface DynamicKpi {
  id: string;
  titulo: string;
  badgeTexto: string;
  badgeColor: 'emerald' | 'amber' | 'cyan' | 'red' | 'purple';
  tipoValor: 'metrica_personal' | 'metrica_atenciones' | 'metrica_traslados' | 'metrica_ambulancias' | 'manual';
  valorManual?: string;
  subtitulo1: string;
  subtitulo2: string;
  colorValor?: string;
}

export interface AppConfig {
  tema: ThemeConfig;
  textos: {
    nombreInstitucion: string;
    subtituloHeader: string;
    nombreEvento: string;
    ciudadSede: string;
    lugarRecinto: string;
    fechaHorario: string;
    nivelRiesgo: string;
    aforoTexto: string;
  };
  visibilidad: {
    bannerEvento: boolean;
    tarjetasKPI: boolean;
    sectoresOperativos: boolean;
    tablaActividad: boolean;
    graficaTriage: boolean;
  };
  kpis: DynamicKpi[];
  recuadrosPersonalizados: CustomWidget[];
}

@Injectable({
  providedIn: 'root'
})
export class CustomizerService {
  
  // 7 Presets profesionales preconfigurados
  presets: Record<string, ThemeConfig> = {
    'beige-verde': {
      nombrePreset: 'Clínico Beige & Verde (Oficial SEPAM)',
      colorHeader: '#07483b',
      colorHeaderTexto: '#ffffff',
      colorFondo: '#f5f4ed',
      colorTarjeta: '#ffffff',
      colorTarjetaSecundaria: '#edece4',
      colorBorde: '#d2dfd8',
      colorPrimario: '#07483b',
      colorPrimarioHover: '#0b5948',
      colorTexto: '#0d2822',
      colorTextoSecundario: '#405c54'
    },
    'tactico-dark': {
      nombrePreset: 'Táctico Militar / Concierto Dark (Modo Noche)',
      colorHeader: '#0b241e',
      colorHeaderTexto: '#f4f3ea',
      colorFondo: '#061814',
      colorTarjeta: '#0f2e27',
      colorTarjetaSecundaria: '#164036',
      colorBorde: '#1d5447',
      colorPrimario: '#10b981',
      colorPrimarioHover: '#059669',
      colorTexto: '#f4f3ea',
      colorTextoSecundario: '#94b8a8'
    },
    'hospital-azul': {
      nombrePreset: 'Hospitalario Azul & Blanco (MSP/911)',
      colorHeader: '#0f3c6e',
      colorHeaderTexto: '#ffffff',
      colorFondo: '#f0f4f8',
      colorTarjeta: '#ffffff',
      colorTarjetaSecundaria: '#e2e8f0',
      colorBorde: '#cbd5e1',
      colorPrimario: '#0284c7',
      colorPrimarioHover: '#0369a1',
      colorTexto: '#0f172a',
      colorTextoSecundario: '#475569'
    },
    'alto-contraste': {
      nombrePreset: 'Alto Contraste Hazard (Amarillo & Negro)',
      colorHeader: '#09090b',
      colorHeaderTexto: '#facc15',
      colorFondo: '#18181b',
      colorTarjeta: '#27272a',
      colorTarjetaSecundaria: '#3f3f46',
      colorBorde: '#facc15',
      colorPrimario: '#eab308',
      colorPrimarioHover: '#ca8a04',
      colorTexto: '#fafafa',
      colorTextoSecundario: '#d4d4d8'
    },
    'viper-neon': {
      nombrePreset: 'Cyberpunk Concierto (Neon & Magenta)',
      colorHeader: '#1e112a',
      colorHeaderTexto: '#38bdf8',
      colorFondo: '#0d0714',
      colorTarjeta: '#180e22',
      colorTarjetaSecundaria: '#271738',
      colorBorde: '#86198f',
      colorPrimario: '#d946ef',
      colorPrimarioHover: '#c026d3',
      colorTexto: '#fdf4ff',
      colorTextoSecundario: '#e879f9'
    },
    'rojo-cruzroja': {
      nombrePreset: 'Cruz Roja & Paramédicos 131',
      colorHeader: '#991b1b',
      colorHeaderTexto: '#ffffff',
      colorFondo: '#fef2f2',
      colorTarjeta: '#ffffff',
      colorTarjetaSecundaria: '#fee2e2',
      colorBorde: '#fca5a5',
      colorPrimario: '#dc2626',
      colorPrimarioHover: '#b91c1c',
      colorTexto: '#450a0a',
      colorTextoSecundario: '#7f1d1d'
    },
    'slate-titanium': {
      nombrePreset: 'Titanio Slate & Minimalista Operativo',
      colorHeader: '#1e293b',
      colorHeaderTexto: '#ffffff',
      colorFondo: '#f8fafc',
      colorTarjeta: '#ffffff',
      colorTarjetaSecundaria: '#f1f5f9',
      colorBorde: '#e2e8f0',
      colorPrimario: '#334155',
      colorPrimarioHover: '#1e293b',
      colorTexto: '#0f172a',
      colorTextoSecundario: '#64748b'
    }
  };

  // KPIs iniciales por defecto (editables, ampliables y eliminables)
  kpisPorDefecto: DynamicKpi[] = [
    {
      id: 'kpi-personal',
      titulo: 'PERSONAL OPERATIVO',
      badgeTexto: 'LIVE',
      badgeColor: 'emerald',
      tipoValor: 'metrica_personal',
      subtitulo1: 'disponibles',
      subtitulo2: 'en atención',
      colorValor: '#07483b'
    },
    {
      id: 'kpi-atenciones',
      titulo: 'ATENCIONES ACTIVAS',
      badgeTexto: 'EN TERRENO',
      badgeColor: 'amber',
      tipoValor: 'metrica_atenciones',
      subtitulo1: 'Registradas en vivo',
      subtitulo2: 'Atendidas en campo',
      colorValor: '#f59e0b'
    },
    {
      id: 'kpi-traslados',
      titulo: 'TRASLADOS AL ACV',
      badgeTexto: 'RUMBO ACV',
      badgeColor: 'cyan',
      tipoValor: 'metrica_traslados',
      subtitulo1: 'Camilla / Ambulancia',
      subtitulo2: 'Derivados a PMA',
      colorValor: '#06b6d4'
    },
    {
      id: 'kpi-apoyos',
      titulo: 'APOYOS SOLICITADOS',
      badgeTexto: 'RADIAL',
      badgeColor: 'purple',
      tipoValor: 'manual',
      valorManual: '00',
      subtitulo1: 'Sin novedades',
      subtitulo2: '0 Solicitudes',
      colorValor: '#8b5cf6'
    }
  ];

  config = signal<AppConfig>({
    tema: { ...this.presets['beige-verde'] },
    textos: {
      nombreInstitucion: 'SEPAM SISTEMA DE MANDO',
      subtituloHeader: 'ECUADOR 🇪🇨',
      nombreEvento: 'CONCIERTO CHINO Y NACHO',
      ciudadSede: 'QUITO',
      lugarRecinto: 'Estadio Olímpico Atahualpa',
      fechaHorario: '30 de septiembre de 2026 • 16:00 - 23:30',
      nivelRiesgo: 'Alto',
      aforoTexto: '~28,000 pers.'
    },
    visibilidad: {
      bannerEvento: true,
      tarjetasKPI: true,
      sectoresOperativos: true,
      tablaActividad: true,
      graficaTriage: true
    },
    kpis: [
      {
        id: 'kpi-personal',
        titulo: 'PERSONAL OPERATIVO',
        badgeTexto: 'LIVE',
        badgeColor: 'emerald',
        tipoValor: 'metrica_personal',
        subtitulo1: 'disponibles',
        subtitulo2: 'en atención',
        colorValor: '#07483b'
      },
      {
        id: 'kpi-atenciones',
        titulo: 'ATENCIONES ACTIVAS',
        badgeTexto: 'EN TERRENO',
        badgeColor: 'amber',
        tipoValor: 'metrica_atenciones',
        subtitulo1: 'Registradas en vivo',
        subtitulo2: 'Atendidas en campo',
        colorValor: '#f59e0b'
      },
      {
        id: 'kpi-traslados',
        titulo: 'TRASLADOS AL ACV',
        badgeTexto: 'RUMBO ACV',
        badgeColor: 'cyan',
        tipoValor: 'metrica_traslados',
        subtitulo1: 'Camilla / Ambulancia',
        subtitulo2: 'Derivados a PMA',
        colorValor: '#06b6d4'
      },
      {
        id: 'kpi-apoyos',
        titulo: 'APOYOS SOLICITADOS',
        badgeTexto: 'RADIAL',
        badgeColor: 'purple',
        tipoValor: 'manual',
        valorManual: '00',
        subtitulo1: 'Sin novedades',
        subtitulo2: '0 Solicitudes',
        colorValor: '#8b5cf6'
      }
    ],
    recuadrosPersonalizados: []
  });

  // Estado del menú flotante izquierdo
  sidebarAbierto = signal(false);

  constructor() {
    this.cargarConfiguracionGuardada();

    // Efecto reactivo para aplicar variables CSS en tiempo real al DOM (:root y body)
    effect(() => {
      this.aplicarVariablesCSS(this.config().tema);
    });
  }

  toggleSidebar() {
    this.sidebarAbierto.update(v => !v);
  }

  abrirSidebar() {
    this.sidebarAbierto.set(true);
  }

  cerrarSidebar() {
    this.sidebarAbierto.set(false);
  }

  aplicarPreset(nombreClave: string) {
    const preset = this.presets[nombreClave];
    if (preset) {
      this.config.update(c => ({
        ...c,
        tema: { ...preset }
      }));
      this.guardarEnLocalStorage();
    }
  }

  actualizarColor(propiedad: keyof ThemeConfig, valorHex: string) {
    this.config.update(c => ({
      ...c,
      tema: {
        ...c.tema,
        [propiedad]: valorHex
      }
    }));
    this.guardarEnLocalStorage();
  }

  actualizarTexto(campo: keyof AppConfig['textos'], nuevoValor: string) {
    this.config.update(c => ({
      ...c,
      textos: {
        ...c.textos,
        [campo]: nuevoValor
      }
    }));
    this.guardarEnLocalStorage();
  }

  toggleVisibilidad(seccion: keyof AppConfig['visibilidad']) {
    this.config.update(c => ({
      ...c,
      visibilidad: {
        ...c.visibilidad,
        [seccion]: !c.visibilidad[seccion]
      }
    }));
    this.guardarEnLocalStorage();
  }

  agregarRecuadroPersonalizado(titulo: string, contenido: string, icono: string = '📌') {
    const nuevo: CustomWidget = {
      id: `w-${Date.now().toString(36)}`,
      titulo,
      contenido,
      colorBorde: this.config().tema.colorPrimario,
      icono
    };
    this.config.update(c => ({
      ...c,
      recuadrosPersonalizados: [...c.recuadrosPersonalizados, nuevo]
    }));
    this.guardarEnLocalStorage();
  }

  eliminarRecuadroPersonalizado(id: string) {
    this.config.update(c => ({
      ...c,
      recuadrosPersonalizados: c.recuadrosPersonalizados.filter(w => w.id !== id)
    }));
    this.guardarEnLocalStorage();
  }

  // Métodos dinámicos para Gestión de KPIs (Agregar, Editar, Eliminar)
  agregarKpi(kpi: Omit<DynamicKpi, 'id'>) {
    const id = `kpi-${Date.now().toString(36)}`;
    const nuevo: DynamicKpi = { ...kpi, id };
    this.config.update(c => ({
      ...c,
      kpis: [...(c.kpis || []), nuevo]
    }));
    this.guardarEnLocalStorage();
  }

  editarKpi(id: string, cambios: Partial<DynamicKpi>) {
    this.config.update(c => ({
      ...c,
      kpis: (c.kpis || []).map(k => k.id === id ? { ...k, ...cambios } : k)
    }));
    this.guardarEnLocalStorage();
  }

  eliminarKpi(id: string) {
    this.config.update(c => ({
      ...c,
      kpis: (c.kpis || []).filter(k => k.id !== id)
    }));
    this.guardarEnLocalStorage();
  }

  guardarEnLocalStorage() {
    try {
      localStorage.setItem('sepam_app_custom_config', JSON.stringify(this.config()));
    } catch (e) {
      console.error('Error al guardar configuración:', e);
    }
  }

  restaurarPorDefecto() {
    this.config.set({
      tema: { ...this.presets['beige-verde'] },
      textos: {
        nombreInstitucion: 'SEPAM SISTEMA DE MANDO',
        subtituloHeader: 'ECUADOR 🇪🇨',
        nombreEvento: 'CONCIERTO CHINO Y NACHO',
        ciudadSede: 'QUITO',
        lugarRecinto: 'Estadio Olímpico Atahualpa',
        fechaHorario: '30 de septiembre de 2026 • 16:00 - 23:30',
        nivelRiesgo: 'Alto',
        aforoTexto: '~28,000 pers.'
      },
      visibilidad: {
        bannerEvento: true,
        tarjetasKPI: true,
        sectoresOperativos: true,
        tablaActividad: true,
        graficaTriage: true
      },
      kpis: [...this.kpisPorDefecto],
      recuadrosPersonalizados: []
    });
    localStorage.removeItem('sepam_app_custom_config');
  }

  private cargarConfiguracionGuardada() {
    try {
      const guardada = localStorage.getItem('sepam_app_custom_config');
      if (guardada) {
        const parsed = JSON.parse(guardada);
        if (parsed.recuadrosPersonalizados) {
          parsed.recuadrosPersonalizados = parsed.recuadrosPersonalizados.filter(
            (w: CustomWidget) => w.id !== 'widget-1'
          );
        }
        if (!parsed.kpis || parsed.kpis.length === 0) {
          parsed.kpis = [...this.kpisPorDefecto];
        }
        this.config.set(parsed);
      }
    } catch {
      // Usar valores por defecto
    }
  }

  private aplicarVariablesCSS(tema: ThemeConfig) {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--bg-main', tema.colorFondo);
      root.style.setProperty('--bg-card', tema.colorTarjeta);
      root.style.setProperty('--bg-card-secondary', tema.colorTarjetaSecundaria || '#edece4');
      root.style.setProperty('--border-color', tema.colorBorde);
      root.style.setProperty('--brand-dark-green', tema.colorHeader);
      root.style.setProperty('--brand-forest', tema.colorPrimario);
      root.style.setProperty('--color-header-text', tema.colorHeaderTexto || '#ffffff');
      root.style.setProperty('--text-primary', tema.colorTexto);
      root.style.setProperty('--text-secondary', tema.colorTextoSecundario);

      // Aplicar al body directamente para que el 100% de la ventana responda
      document.body.style.backgroundColor = tema.colorFondo;
      document.body.style.color = tema.colorTexto;
    }
  }
}
