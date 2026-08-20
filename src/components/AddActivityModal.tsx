import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useConfirm } from '../context/ConfirmContext';
import { LOCALIDADES_CARTAGENA } from '../data/cartagenaData';
import { TipoActividad, Actividad } from '../types';
import { formatColombianCurrency } from '../utils/helpers';
import {
  X,
  Calendar,
  Users,
  MapPin,
  DollarSign,
  Link,
  FileText,
  Activity,
  CheckCircle2,
  Sparkles,
  Clock,
  Camera,
  ShieldCheck,
  Award,
  TrendingUp,
  AlertCircle,
  Lock
} from 'lucide-react';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialActivity?: Actividad | null;
  defaultPhase?: 'programar' | 'resultados';
}

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  isOpen,
  onClose,
  initialActivity,
  defaultPhase = 'programar'
}) => {
  const { currentUser, users, pollingStations, addActividad, updateActividad } = useApp();
  const { confirm } = useConfirm();

  const isSupervisor = currentUser?.rol === 'ADMIN' || currentUser?.rol === 'LIDER_PRINCIPAL' || currentUser?.rol === 'LIDER_PRINCIPAL_INVITADO';
  const isLider = currentUser?.rol === 'LIDER' || currentUser?.rol === 'SUBLIDER';
  const isCreatingNew = !initialActivity;

  const [activePhase, setActivePhase] = useState<'programar' | 'resultados'>(
    isCreatingNew ? 'programar' : (defaultPhase || 'resultados')
  );

  const allBarrios = useMemo(() => {
    const list: string[] = [];
    LOCALIDADES_CARTAGENA.forEach(loc => {
      loc.barrios.forEach(b => list.push(b));
    });
    return list.sort((a, b) => a.localeCompare(b));
  }, []);

  const activeLeaders = useMemo(() => {
    if (currentUser?.rol === 'ADMIN') {
      return users.filter(u => u.rol !== 'ADMIN');
    }
    if (currentUser?.rol === 'LIDER_PRINCIPAL' || currentUser?.rol === 'LIDER_PRINCIPAL_INVITADO') {
      return users.filter(u => u.id === currentUser.id || u.lider_principal_id === currentUser.id);
    }
    return users.filter(u => u.id === currentUser?.id);
  }, [users, currentUser]);

  const [formData, setFormData] = useState({
    lider_id: initialActivity?.lider_id || currentUser?.id || '',
    tipo_actividad: (initialActivity?.tipo_actividad || 'REUNION_COMUNITARIA') as TipoActividad,
    fecha: initialActivity?.fecha || new Date().toISOString().split('T')[0],
    puesto_id: initialActivity?.puesto_id || '',
    barrio: initialActivity?.barrio || '',
    meta_asistentes: initialActivity?.meta_asistentes || 20,
    asistentes_reales: initialActivity?.asistentes_reales || 0,
    nuevos_contactos_generados: initialActivity?.nuevos_contactos_generados || 0,
    costo_presupuestado: initialActivity?.costo_presupuestado || 0,
    costo_real: initialActivity?.costo_real || 0,
    evidencia_enlace: initialActivity?.evidencia_enlace || '',
    observaciones: initialActivity?.observaciones || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        lider_id: initialActivity?.lider_id || currentUser?.id || '',
        tipo_actividad: (initialActivity?.tipo_actividad || 'REUNION_COMUNITARIA') as TipoActividad,
        fecha: initialActivity?.fecha || new Date().toISOString().split('T')[0],
        puesto_id: initialActivity?.puesto_id || '',
        barrio: initialActivity?.barrio || '',
        meta_asistentes: initialActivity?.meta_asistentes || 20,
        asistentes_reales: initialActivity?.asistentes_reales || 0,
        nuevos_contactos_generados: initialActivity?.nuevos_contactos_generados || 0,
        costo_presupuestado: initialActivity?.costo_presupuestado || 0,
        costo_real: initialActivity?.costo_real || 0,
        evidencia_enlace: initialActivity?.evidencia_enlace || '',
        observaciones: initialActivity?.observaciones || ''
      });
      // If creating new, always force 'programar' phase
      if (!initialActivity) {
        setActivePhase('programar');
      } else {
        setActivePhase(defaultPhase || 'resultados');
      }
      setError(null);
    }
  }, [isOpen, initialActivity, currentUser, defaultPhase]);

  const leaderInfo = useMemo(() => {
    const u = users.find(user => user.id === formData.lider_id);
    if (u) return u;
    return currentUser;
  }, [users, formData.lider_id, currentUser]);

  const puestoName = useMemo(() => {
    if (!formData.puesto_id) return 'Sin puesto asignado';
    const p = pollingStations.find(st => st.id === formData.puesto_id);
    return p ? p.nombre_puesto : 'Puesto asociado';
  }, [pollingStations, formData.puesto_id]);

  const formatTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'REUNION_COMUNITARIA': return 'Reunión Comunitaria';
      case 'JORNADA_SOCIAL': return 'Jornada Social';
      case 'CAPACITACION': return 'Capacitación Formativa';
      case 'VISITA_TERRITORIAL': return 'Visita Casa a Casa';
      case 'ACTIVIDAD_CULTURAL': return 'Actividad Cultural / Deportiva';
      default: return tipo.replace(/_/g, ' ');
    }
  };

  if (!isOpen) return null;

  // Live attendance calculation
  const liveCumplimientoAsistencia = formData.meta_asistentes > 0 
    ? (formData.asistentes_reales / formData.meta_asistentes) * 100 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lider_id) {
      setError('Debes seleccionar el líder responsable de la actividad.');
      return;
    }

    const actionText = initialActivity
      ? activePhase === 'resultados'
        ? '¿Confirmas guardar los resultados reales de esta actividad comunitaria?'
        : '¿Deseas guardar los cambios en la programación de esta actividad?'
      : '¿Confirmas programar esta nueva actividad comunitaria con su presupuesto estimado?';

    const isConfirmed = await confirm(actionText);
    if (!isConfirmed) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (initialActivity?.id) {
        const res = await updateActividad(initialActivity.id, formData);
        if (!res.success) throw new Error(res.error || 'Error al actualizar actividad');
      } else {
        const res = await addActividad(formData);
        if (!res.success) throw new Error(res.error || 'Error al crear actividad');
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-6">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-neutral-900 via-indigo-950/40 to-neutral-900 p-5 sm:p-6 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {isCreatingNew
                  ? 'Programar Nueva Actividad'
                  : activePhase === 'resultados'
                  ? 'Registrar Resultados de la Actividad'
                  : 'Editar Programación de Actividad'}
              </h2>
              <p className="text-xs text-neutral-400">
                {isCreatingNew
                  ? 'Paso 1: Planifica la fecha, lugar, meta de asistentes y presupuesto estimado'
                  : isSupervisor
                  ? 'Supervisión, auditoría de gasto real y validación de metas'
                  : 'Reporta los asistentes que llegaron, contactos captados, valor real y fotos'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Phase Selector Tabs (Fase 1: Programar vs Fase 2: Resultados) */}
        {!isCreatingNew && (
          <div className="px-6 pt-4 pb-2 bg-neutral-950/50 border-b border-neutral-800/80 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActivePhase('programar')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activePhase === 'programar'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
              }`}
            >
              <Calendar className="w-4 h-4 text-indigo-300" />
              <span>1. Programación & Presupuesto</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePhase('resultados')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                activePhase === 'resultados'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>2. Resultados Reales & Gasto Real</span>
              {formData.asistentes_reales > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              FASE 1: PROGRAMACIÓN & PRESUPUESTO PREVIO
             ════════════════════════════════════════════════════════ */}
          {activePhase === 'programar' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Planificación Previa:</strong> Ingresa la fecha, lugar, meta estimada de asistentes y el <strong>presupuesto estimado</strong> de recursos solicitado para realizar la actividad.
                  {isCreatingNew && (
                    <span className="block text-[11px] text-neutral-400 mt-1">
                      * Una vez realizada la actividad en territorio, podrás registrar los asistentes reales, contactos obtenidos y costos definitivos.
                    </span>
                  )}
                </span>
              </div>

              {/* Leader & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" /> Líder Responsable *
                  </label>
                  {isLider && activeLeaders.length === 1 ? (
                    <div className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {activeLeaders[0]?.nombre_completo} ({currentUser?.rol.replace(/_/g, ' ')})
                    </div>
                  ) : (
                    <select
                      value={formData.lider_id}
                      onChange={e => setFormData({ ...formData, lider_id: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition"
                      required
                    >
                      <option value="">Seleccionar Líder...</option>
                      {activeLeaders.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.nombre_completo} ({u.rol.replace(/_/g, ' ')})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Fecha Programada *
                  </label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Activity Type & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Tipo de Actividad *
                  </label>
                  <select
                    value={formData.tipo_actividad}
                    onChange={e => setFormData({ ...formData, tipo_actividad: e.target.value as TipoActividad })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition"
                    required
                  >
                    <option value="REUNION_COMUNITARIA">Reunión Comunitaria</option>
                    <option value="JORNADA_SOCIAL">Jornada Social</option>
                    <option value="CAPACITACION">Capacitación Formativa</option>
                    <option value="VISITA_TERRITORIAL">Visita Casa a Casa</option>
                    <option value="ACTIVIDAD_CULTURAL">Actividad Cultural / Deportiva</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Barrio
                  </label>
                  <select
                    value={formData.barrio}
                    onChange={e => setFormData({ ...formData, barrio: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="">Seleccionar Barrio...</option>
                    {allBarrios.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Puesto de Votación (Opcional)
                  </label>
                  <select
                    value={formData.puesto_id}
                    onChange={e => setFormData({ ...formData, puesto_id: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="">Asociar puesto electoral...</option>
                    {pollingStations.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre_puesto}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Target Attendees & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5">
                  <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-400" /> Meta de Asistentes a Convocar / Llevar *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.meta_asistentes === 0 ? '' : formData.meta_asistentes}
                    onFocus={e => e.target.select()}
                    onChange={e => {
                      const v = e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0;
                      setFormData({ ...formData, meta_asistentes: v });
                    }}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-indigo-500"
                    placeholder="Ej. 20"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">Número de personas / simpatizantes que llevarás o convocarás a esta actividad (Ej. 20)</p>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5">
                  <label className="block text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Costo Presupuestado ($ COP)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatColombianCurrency(formData.costo_presupuestado)}
                    onFocus={e => e.target.select()}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '');
                      const num = raw ? parseInt(raw, 10) : 0;
                      setFormData({ ...formData, costo_presupuestado: num });
                    }}
                    className="w-full bg-neutral-900 border border-emerald-500/40 rounded-xl px-3.5 py-2 text-sm text-emerald-300 font-bold focus:outline-none focus:border-emerald-500"
                    placeholder="$0"
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">Gasto estimado (sonido, refrigerios, transporte, etc.)</p>
                </div>
              </div>

              {/* Initial Objectives */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" /> Objetivo o Descripción de la Convocatoria
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Presentación de propuestas del candidato, conformación de comité barrial, taller comunitario..."
                  value={formData.observaciones}
                  onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition resize-none"
                />
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              FASE 2: RESULTADOS REALES, GASTO REAL Y EVIDENCIAS
             ════════════════════════════════════════════════════════ */}
          {activePhase === 'resultados' && !isCreatingNew && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* ─── 🆔 FICHA DE IDENTIFICACIÓN DE LA ACTIVIDAD EN EDICIÓN ─── */}
              <div className="bg-gradient-to-r from-neutral-950 via-indigo-950/40 to-neutral-950 border border-indigo-500/40 rounded-2xl p-4 shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-mono font-black text-xs border border-indigo-500/30">
                      ID: {initialActivity?.id ? initialActivity.id.slice(0, 8).toUpperCase() : 'ACT-PROG'}
                    </span>
                    <h3 className="text-sm font-black text-white">
                      {formatTipoLabel(formData.tipo_actividad)}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    Fecha: {formData.fecha}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-semibold">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Líder Responsable:</span>
                    </div>
                    <p className="font-bold text-white truncate">
                      {leaderInfo?.nombre_completo || 'Líder Asignado'} 
                      <span className="text-neutral-400 font-medium text-[11px]"> ({leaderInfo?.rol?.replace(/_/g, ' ') || 'LÍDER'})</span>
                    </p>
                  </div>

                  <div className="bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-neutral-400 text-[11px] font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />
                      <span>Zona / Puesto Territorial:</span>
                    </div>
                    <p className="font-bold text-white truncate" title={`${formData.barrio || 'Barrio no especificado'} · ${puestoName}`}>
                      {formData.barrio || 'Barrio por definir'} · <span className="text-neutral-300 font-normal">{puestoName}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="bg-neutral-900/90 rounded-xl p-2.5 border border-neutral-800 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400 font-medium">Meta Asistentes:</span>
                    <strong className="text-white text-xs">{formData.meta_asistentes} proyectados</strong>
                  </div>
                  <div className="bg-neutral-900/90 rounded-xl p-2.5 border border-neutral-800 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-400 font-medium">Presupuesto:</span>
                    <strong className="text-emerald-400 text-xs">{formatColombianCurrency(formData.costo_presupuestado) || '$0'} COP</strong>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Paso 2 (Resultados Reales):</strong> Diligencia los <strong>asistentes reales</strong> que asistieron, <strong>contactos nuevos</strong> captados, el <strong>costo real gastado</strong> y el enlace a las <strong>evidencias</strong>.
                </span>
              </div>

              {/* Live Attendance & Contacts Metrics */}
              <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Resultados de Convocatoria e Impacto
                  </h4>
                  {liveCumplimientoAsistencia > 0 && (
                    <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${
                      liveCumplimientoAsistencia >= 100
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : liveCumplimientoAsistencia >= 70
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      Cumplimiento: {liveCumplimientoAsistencia.toFixed(0)}%
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Asistentes Reales Convocados *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.asistentes_reales === 0 ? '' : formData.asistentes_reales}
                      onFocus={e => e.target.select()}
                      onChange={e => {
                        const v = e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0;
                        setFormData({ ...formData, asistentes_reales: v });
                      }}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-emerald-500"
                      placeholder="0"
                    />
                    <p className="text-[10px] text-neutral-500 mt-1">Meta programada: {formData.meta_asistentes} asistentes</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Nuevos Contactos Obtenidos *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.nuevos_contactos_generados === 0 ? '' : formData.nuevos_contactos_generados}
                      onFocus={e => e.target.select()}
                      onChange={e => {
                        const v = e.target.value === '' ? 0 : parseInt(e.target.value, 10) || 0;
                        setFormData({ ...formData, nuevos_contactos_generados: v });
                      }}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-indigo-300 font-bold focus:outline-none focus:border-indigo-500"
                      placeholder="0"
                    />
                    <p className="text-[10px] text-neutral-500 mt-1">Personas que firmaron y se sumaron al movimiento</p>
                  </div>
                </div>
              </div>

              {/* Costo Real Gastado (Editable by leader & supervisors) */}
              <div className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-rose-400 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-rose-400" />
                    {isSupervisor ? 'Auditoría de Costo Real Gastado ($ COP)' : 'Valor / Costo Real Gastado ($ COP)'}
                  </label>
                  {isSupervisor && (
                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Validación Supervisor
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatColombianCurrency(formData.costo_real)}
                  onFocus={e => e.target.select()}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    const num = raw ? parseInt(raw, 10) : 0;
                    setFormData({ ...formData, costo_real: num });
                  }}
                  className="w-full bg-neutral-900 border border-rose-500/40 rounded-xl px-3.5 py-2.5 text-base text-rose-300 font-black focus:outline-none focus:border-rose-500"
                  placeholder="$0"
                />
                <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                  <span>Presupuesto programado: <strong className="text-white">{formatColombianCurrency(formData.costo_presupuestado) || '$0'}</strong></span>
                  <span>Diferencia: <strong className={formData.costo_real <= formData.costo_presupuestado ? 'text-emerald-400' : 'text-rose-400'}>
                    {formData.costo_real <= formData.costo_presupuestado ? '+ ' : '- '}
                    {formatColombianCurrency(Math.abs(formData.costo_presupuestado - formData.costo_real)) || '$0'}
                  </strong></span>
                </div>
              </div>

              {/* Evidence Link & Final Notes */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-indigo-400" /> Enlace de Evidencias / Fotos de la Actividad
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... o enlace de fotos/redes"
                    value={formData.evidencia_enlace}
                    onChange={e => setFormData({ ...formData, evidencia_enlace: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" /> Observaciones Finales, Conclusiones y Acuerdos
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Detalles sobre el resultado de la actividad, líderes comunitarios asistentes, compromisos pactados..."
                    value={formData.observaciones}
                    onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 sm:px-5 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-xs sm:text-sm font-medium transition cursor-pointer"
            >
              Cancelar
            </button>

            <div className="flex items-center gap-2">
              {isCreatingNew ? (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Guardando...' : 'Guardar Actividad Programada'}
                </button>
              ) : activePhase === 'programar' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setActivePhase('resultados')}
                    className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition cursor-pointer"
                  >
                    Pasar a Resultados →
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isSubmitting ? 'Guardando...' : 'Actualizar Programación'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setActivePhase('programar')}
                    className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition cursor-pointer"
                  >
                    ← Volver a Datos
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isSubmitting ? 'Guardando...' : 'Guardar Resultados Reales'}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
