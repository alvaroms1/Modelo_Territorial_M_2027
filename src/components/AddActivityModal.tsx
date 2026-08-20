import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { LOCALIDADES_CARTAGENA } from '../data/cartagenaData';
import { TipoActividad, Actividad } from '../types';
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
  Sparkles
} from 'lucide-react';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialActivity?: Actividad | null;
}

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  isOpen,
  onClose,
  initialActivity
}) => {
  const { currentUser, users, pollingStations, addActividad, updateActividad } = useApp();

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
    if (currentUser?.rol === 'LIDER_PRINCIPAL') {
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.lider_id) {
      setError('Debes seleccionar el líder responsable de la actividad.');
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
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-neutral-900 via-indigo-950/40 to-neutral-900 p-6 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {initialActivity ? 'Editar Actividad Territorial' : 'Registrar Nueva Actividad'}
              </h2>
              <p className="text-xs text-neutral-400">
                Planificación comunitaria, control de presupuesto y asistencia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Leader & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" /> Líder Responsable *
              </label>
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" /> Fecha de Actividad *
              </label>
              <input
                type="date"
                value={formData.fecha}
                onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition"
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
                <option value="CAPACITACION">Capacitación</option>
                <option value="VISITA_TERRITORIAL">Visita Territorial</option>
                <option value="ACTIVIDAD_CULTURAL">Actividad Cultural</option>
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
                Puesto de Votación
              </label>
              <select
                value={formData.puesto_id}
                onChange={e => setFormData({ ...formData, puesto_id: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="">Opcional / Asociar puesto...</option>
                {pollingStations.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre_puesto}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Metrics (Asistentes & Contactos) */}
          <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-2xl p-4 space-y-4">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Metas de Asistencia e Impacto
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                  Meta Asistentes
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.meta_asistentes}
                  onChange={e => setFormData({ ...formData, meta_asistentes: Number(e.target.value) })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                  Asistentes Reales
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.asistentes_reales}
                  onChange={e => setFormData({ ...formData, asistentes_reales: Number(e.target.value) })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                  Nuevos Contactos
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.nuevos_contactos_generados}
                  onChange={e => setFormData({ ...formData, nuevos_contactos_generados: Number(e.target.value) })}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Financials (Presupuesto vs Real) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Costo Presupuestado ($ COP)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.costo_presupuestado}
                onChange={e => setFormData({ ...formData, costo_presupuestado: Number(e.target.value) })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-rose-400" /> Costo Real Ejecutado ($ COP)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.costo_real}
                onChange={e => setFormData({ ...formData, costo_real: Number(e.target.value) })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-rose-500 transition"
              />
            </div>
          </div>

          {/* Evidence Link & Notes */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Link className="w-3.5 h-3.5 text-indigo-400" /> Enlace de Evidencia / Registro Fotográfico
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/... o enlace de fotos"
                value={formData.evidencia_enlace}
                onChange={e => setFormData({ ...formData, evidencia_enlace: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" /> Observaciones y Conclusiones
              </label>
              <textarea
                rows={2}
                placeholder="Detalles sobre el desarrollo de la actividad, líderes comunitarios presentes, acuerdos..."
                value={formData.observaciones}
                onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 transition resize-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-sm font-medium transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Guardando...' : initialActivity ? 'Actualizar Actividad' : 'Guardar Actividad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
