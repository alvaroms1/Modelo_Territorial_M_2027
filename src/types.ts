export type UserRole = 'ADMIN' | 'LIDER_PRINCIPAL' | 'LIDER_PRINCIPAL_INVITADO' | 'LIDER' | 'SUBLIDER';

export type EstadoLider = 'ACTIVO' | 'EN_FORMACION' | 'EN_PAUSA' | 'RETIRADO';

export type NivelActividad = 'ALTO' | 'MEDIO' | 'BAJO' | 'SIN_ACTIVIDAD';

export type TipoActividad = 'REUNION_COMUNITARIA' | 'JORNADA_SOCIAL' | 'CAPACITACION' | 'VISITA_TERRITORIAL' | 'ACTIVIDAD_CULTURAL';

export type EstadoContacto = 'NUEVO' | 'CONTACTADO' | 'PARTICIPANTE' | 'INACTIVO';

export type MesesAnno = 'ENERO' | 'FEBRERO' | 'MARZO' | 'ABRIL' | 'MAYO' | 'JUNIO' | 'JULIO' | 'AGOSTO' | 'SEPTIEMBRE' | 'OCTUBRE' | 'NOVIEMBRE' | 'DICIEMBRE';

export interface PollingStation {
  id: string;
  codigo_puesto: string;
  nombre_puesto: string;
  comuna_localidad?: string;
  barrio_corregimiento?: string;
  direccion?: string;
  zona_influencia?: string;
  created_at?: string;
}

export interface UserAccount {
  id: string;
  cedula: string;
  password?: string;
  nombre_completo: string;
  rol: UserRole;
  telefono?: string;
  correo?: string;
  barrio_residencia?: string;
  comuna_localidad?: string;
  zona_mayor_influencia?: string;
  anios_trabajo_comunitario: number;
  estado: EstadoLider;
  nivel_actividad: NivelActividad;
  meta_contactos_mes: number;
  observaciones?: string;
  consentimiento_datos: boolean;
  lider_principal_id?: string;
  created_at?: string;
}

export interface AsignacionPuesto {
  id: string;
  lider_id: string;
  puesto_principal_id?: string;
  puesto_secundario_id?: string;
  barrio_base?: string;
  distancia_km?: number;
  razon_asignacion?: string;
  created_at?: string;
}

export interface Contacto {
  id: string;
  lider_id: string;
  cedula?: string;
  nombres: string;
  apellidos?: string;
  telefono?: string;
  correo?: string;
  genero?: string;
  edad?: number;
  sector_comuna?: string;
  barrio?: string;
  puesto_id?: string;
  mesa?: string;
  sublider_id?: string;
  rol?: string;
  fecha_registro?: string;
  estado: EstadoContacto;
  participo_actividad: boolean;
  ultimo_contacto?: string;
  proximo_seguimiento?: string;
  consentimiento_datos: boolean;
  observaciones?: string;
  created_at?: string;
}

export interface Actividad {
  id: string;
  lider_id: string;
  fecha: string;
  tipo_actividad: TipoActividad;
  puesto_id?: string;
  barrio?: string;
  meta_asistentes: number;
  asistentes_reales: number;
  nuevos_contactos_generados: number;
  costo_presupuestado: number;
  costo_real: number;
  evidencia_enlace?: string;
  observaciones?: string;
  created_at?: string;
}

export interface SeguimientoMensual {
  id: string;
  anno: number;
  mes: MesesAnno;
  lider_id: string;
  meta_contactos: number;
  nuevos_contactos: number;
  meta_actividades: number;
  actividades_realizadas: number;
  asistentes_totales: number;
  created_at?: string;
}

export interface FilterState {
  searchQuery: string;
  puesto_id: string;
  comuna_localidad: string;
  barrio: string;
  estado: string;
  lider_id: string;
}
