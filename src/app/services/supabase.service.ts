import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private client: SupabaseClient | null = null;
  private isConfigured = false;

  private supabaseUrl = '';
  private supabaseAnonKey = '';

  constructor() {
    this.loadCredentials();
  }

  loadCredentials() {
    const savedUrl = localStorage.getItem('sepam_supabase_url');
    const savedKey = localStorage.getItem('sepam_supabase_key');

    if (savedUrl && savedKey) {
      try {
        this.supabaseUrl = savedUrl;
        this.supabaseAnonKey = savedKey;
        this.client = createClient(savedUrl, savedKey);
        this.isConfigured = true;
      } catch (err) {
        console.error('Error al inicializar Supabase:', err);
        this.isConfigured = false;
      }
    }
  }

  saveCredentials(url: string, key: string): boolean {
    try {
      this.supabaseUrl = url.trim();
      this.supabaseAnonKey = key.trim();
      this.client = createClient(this.supabaseUrl, this.supabaseAnonKey);
      localStorage.setItem('sepam_supabase_url', this.supabaseUrl);
      localStorage.setItem('sepam_supabase_key', this.supabaseAnonKey);
      this.isConfigured = true;
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  clearCredentials() {
    localStorage.removeItem('sepam_supabase_url');
    localStorage.removeItem('sepam_supabase_key');
    this.client = null;
    this.isConfigured = false;
  }

  get isConnected(): boolean {
    return this.isConfigured && this.client !== null;
  }

  getClient(): SupabaseClient | null {
    return this.client;
  }

  getCredentials() {
    return {
      url: this.supabaseUrl,
      key: this.supabaseAnonKey
    };
  }

  getSqlSchemaScript(): string {
    return `-- ========================================================
-- SISTEMA DE GESTIÓN MÉDICA Y OPERATIVA SEPAM (ECUADOR)
-- TABLAS Y POLÍTICAS DE TIEMPO REAL PARA SUPABASE
-- ========================================================

-- 1. Tabla de Eventos Masivos
CREATE TABLE IF NOT EXISTS public.eventos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    ciudad TEXT NOT NULL DEFAULT 'Quito',
    lugar TEXT NOT NULL,
    fecha DATE NOT NULL,
    horario TEXT NOT NULL,
    riesgo TEXT NOT NULL DEFAULT 'Alto',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Sectores Operativos
CREATE TABLE IF NOT EXISTS public.sectores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id UUID REFERENCES public.eventos(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    nombre TEXT NOT NULL,
    capacidad_personal INTEGER DEFAULT 2
);

-- 3. Tabla de Personal Operativo (Paramédicos y Médicos)
CREATE TABLE IF NOT EXISTS public.personal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL, -- PARAMEDICO_CAMPO, PARAMEDICO_ACV, MEDICO, COORDINADOR
    sector_id UUID REFERENCES public.sectores(id) ON DELETE SET NULL,
    estado TEXT DEFAULT 'DISPONIBLE', -- DISPONIBLE, EN_ATENCION, EN_TRASLADO
    telefono TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tabla Principal de Atenciones Prehospitalarias
CREATE TABLE IF NOT EXISTS public.atenciones (
    id TEXT PRIMARY KEY, -- ej: AT-004
    evento_id UUID REFERENCES public.eventos(id) ON DELETE CASCADE,
    sector_id UUID REFERENCES public.sectores(id) ON DELETE SET NULL,
    sector_nombre TEXT NOT NULL,
    ubicacion_especifica TEXT,
    paramedico_id UUID REFERENCES public.personal(id) ON DELETE SET NULL,
    paramedico_nombre TEXT NOT NULL,
    motivo TEXT NOT NULL,
    motivo_detalle TEXT,
    estado TEXT NOT NULL DEFAULT 'EN_ATENCION',
    hora_inicio TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Traslado
    medio_traslado TEXT,
    condicion_aparente TEXT,
    observaciones_traslado TEXT,
    hora_inicio_traslado TIMESTAMP WITH TIME ZONE,
    hora_llegada_acv TIMESTAMP WITH TIME ZONE,
    
    -- Triage
    triage TEXT, -- ROJO, AMARILLO, VERDE, NEGRO
    triage_hora TIMESTAMP WITH TIME ZONE,
    triage_evaluador TEXT,
    
    -- Paciente y Consulta Médica
    paciente_nombre TEXT,
    paciente_edad INTEGER,
    paciente_genero TEXT,
    paciente_documento TEXT,
    medico_asignado TEXT,
    signos_vitales JSONB,
    anamnesis TEXT,
    examen_fisico TEXT,
    diagnostico TEXT,
    tratamiento TEXT,
    resolucion TEXT, -- ALTA_ACV, OBSERVACION, TRASLADO_HOSPITAL
    hora_resolucion TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar extensión Realtime en Supabase
ALTER PUBLICATION supabase_realtime ADD TABLE atenciones;
ALTER PUBLICATION supabase_realtime ADD TABLE personal;
ALTER PUBLICATION supabase_realtime ADD TABLE sectores;
`;
  }
}
