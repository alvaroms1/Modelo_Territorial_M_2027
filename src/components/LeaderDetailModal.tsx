import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserAccount, Contacto, Actividad } from '../types';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  GitFork,
  Vote,
  Activity,
  Calendar,
  Award,
  Target,
  Edit2,
  CheckCircle,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  Users
} from 'lucide-react';

interface LeaderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  leader: UserAccount | null;
}

export const LeaderDetailModal: React.FC<LeaderDetailModalProps> = ({
  isOpen,
  onClose,
  leader
}) => {
  const { users, contactos, actividades, updateUser } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'contactos' | 'sublideres' | 'actividades'>('contactos');
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState<number>(leader?.meta_contactos_mes || 50);
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  if (!isOpen || !leader) return null;

  // Derive leader-specific data
  const leaderContacts = contactos.filter(c => c.lider_id === leader.id);
  const leaderSubleaders = users.filter(u => u.lider_principal_id === leader.id);
  const leaderActivities = actividades.filter(a => a.lider_id === leader.id);

  const totalAttendees = leaderActivities.reduce((sum, a) => sum + (a.asistentes_reales || 0), 0);
  const goalAchievement = leader.meta_contactos_mes > 0
    ? Math.min(100, (leaderContacts.length / leader.meta_contactos_mes) * 100)
    : 0;

  const handleSaveGoal = async () => {
    setIsSavingGoal(true);
    try {
      await updateUser(leader.id, { meta_contactos_mes: newGoal });
      setIsEditingGoal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingGoal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-neutral-900 via-indigo-950/40 to-neutral-900 p-6 border-b border-neutral-800 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20 shrink-0">
              {leader.nombre_completo.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {leader.nombre_completo}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[11px] font-bold uppercase tracking-wider border border-indigo-500/30">
                  {leader.rol.replace(/_/g, ' ')}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  leader.estado === 'ACTIVO' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {leader.estado}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-neutral-400 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-neutral-500" /> CC: {leader.cedula}</span>
                {leader.telefono && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-neutral-500" /> {leader.telefono}</span>}
                {leader.barrio_residencia && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-neutral-500" /> {leader.barrio_residencia}</span>}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-neutral-950/70 border border-neutral-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                <span>Contactos Totales</span>
                <Vote className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-black text-white">{leaderContacts.length}</p>
            </div>

            <div className="bg-neutral-950/70 border border-neutral-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                <span>Sublíderes a Cargo</span>
                <GitFork className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-white">{leaderSubleaders.length}</p>
            </div>

            <div className="bg-neutral-950/70 border border-neutral-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                <span>Actividades Realizadas</span>
                <Activity className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-black text-white">{leaderActivities.length}</p>
            </div>

            <div className="bg-neutral-950/70 border border-neutral-800/80 rounded-2xl p-4">
              <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
                <span>Asistentes Totales</span>
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white">{totalAttendees}</p>
            </div>
          </div>

          {/* Goal & Performance Bar */}
          <div className="bg-neutral-950/50 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-400" /> Meta Mensual de Contactos
                </span>
                <span className="text-xs font-black text-indigo-400">
                  {leaderContacts.length} / {leader.meta_contactos_mes || 50} ({goalAchievement.toFixed(1)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-rose-500 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${goalAchievement}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditingGoal ? (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={newGoal}
                    onChange={e => setNewGoal(Number(e.target.value))}
                    className="w-20 bg-neutral-900 border border-neutral-700 rounded-xl px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleSaveGoal}
                    disabled={isSavingGoal}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setIsEditingGoal(false)}
                    className="px-3 py-1.5 rounded-xl border border-neutral-700 text-neutral-400 hover:bg-neutral-800 text-xs transition"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setNewGoal(leader.meta_contactos_mes || 50);
                    setIsEditingGoal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Edit2 className="w-3.5 h-3.5 text-neutral-400" /> Ajustar Meta
                </button>
              )}
            </div>
          </div>

          {/* Sub-tabs Navigation */}
          <div>
            <div className="flex border-b border-neutral-800 gap-6">
              <button
                onClick={() => setActiveSubTab('contactos')}
                className={`pb-3 text-sm font-bold transition-all relative ${
                  activeSubTab === 'contactos' ? 'text-indigo-400' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Contactos Registrados ({leaderContacts.length})
                {activeSubTab === 'contactos' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />}
              </button>
              <button
                onClick={() => setActiveSubTab('sublideres')}
                className={`pb-3 text-sm font-bold transition-all relative ${
                  activeSubTab === 'sublideres' ? 'text-indigo-400' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Sublíderes a Cargo ({leaderSubleaders.length})
                {activeSubTab === 'sublideres' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />}
              </button>
              <button
                onClick={() => setActiveSubTab('actividades')}
                className={`pb-3 text-sm font-bold transition-all relative ${
                  activeSubTab === 'actividades' ? 'text-indigo-400' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Historial de Actividades ({leaderActivities.length})
                {activeSubTab === 'actividades' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />}
              </button>
            </div>

            {/* Tab Contents */}
            <div className="pt-4">
              {activeSubTab === 'contactos' && (
                <div className="space-y-2">
                  {leaderContacts.map(c => (
                    <div key={c.id} className="p-3 bg-neutral-950/40 border border-neutral-800/60 rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-white">{c.nombres} {c.apellidos}</p>
                        <p className="text-xs text-neutral-500 flex items-center gap-3 mt-0.5">
                          <span>CC: {c.cedula || 'N/A'}</span>
                          <span>Tel: {c.telefono || 'N/A'}</span>
                          <span>Barrio: {c.barrio || 'N/A'}</span>
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        c.estado === 'CONTACTADO' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {c.estado}
                      </span>
                    </div>
                  ))}
                  {leaderContacts.length === 0 && (
                    <p className="text-center py-8 text-neutral-500 text-sm">No hay contactos registrados para este líder.</p>
                  )}
                </div>
              )}

              {activeSubTab === 'sublideres' && (
                <div className="space-y-2">
                  {leaderSubleaders.map(sub => {
                    const subContacts = contactos.filter(c => c.lider_id === sub.id);
                    return (
                      <div key={sub.id} className="p-3 bg-neutral-950/40 border border-neutral-800/60 rounded-xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                            {sub.nombre_completo.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{sub.nombre_completo}</p>
                            <p className="text-xs text-neutral-500">{sub.telefono || 'Sin teléfono'} • {sub.barrio_residencia || 'Sin barrio'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-indigo-400">{subContacts.length}</p>
                          <p className="text-[10px] text-neutral-500">Contactos</p>
                        </div>
                      </div>
                    );
                  })}
                  {leaderSubleaders.length === 0 && (
                    <p className="text-center py-8 text-neutral-500 text-sm">Este líder no tiene sublíderes asignados.</p>
                  )}
                </div>
              )}

              {activeSubTab === 'actividades' && (
                <div className="space-y-2">
                  {leaderActivities.map(act => (
                    <div key={act.id} className="p-3 bg-neutral-950/40 border border-neutral-800/60 rounded-xl flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{act.tipo_actividad.replace(/_/g, ' ')}</span>
                          <span className="text-xs text-neutral-500">• {new Date(act.fecha).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">{act.observaciones || 'Sin observaciones'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-white">{act.asistentes_reales} <span className="text-xs text-neutral-500 font-normal">/ {act.meta_asistentes} asist.</span></p>
                        <p className="text-xs text-emerald-400 font-medium">+{act.nuevos_contactos_generados} contactos</p>
                      </div>
                    </div>
                  ))}
                  {leaderActivities.length === 0 && (
                    <p className="text-center py-8 text-neutral-500 text-sm">No hay actividades registradas para este líder.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 flex justify-end bg-neutral-950/40">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
