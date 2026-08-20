import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { NavTab } from './Navigation';
import { Actividad } from '../types';
import {
  BookOpen,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Info,
  ShieldAlert,
  ListChecks,
  CalendarDays,
  Plus,
  Sparkles,
  Flame,
  ArrowRight,
  Clock3,
  MapPin,
  Users,
  CheckCircle2,
  FileCheck2
} from 'lucide-react';

interface LiderDashboardProps {
  setActiveTab?: (tab: NavTab) => void;
  onOpenAddContactoModal?: () => void;
  onOpenAddActivityModal?: (phase?: 'programar' | 'resultados') => void;
  onEditActivity?: (actividad: Actividad, phase?: 'programar' | 'resultados') => void;
}

export const LiderDashboard: React.FC<LiderDashboardProps> = ({
  setActiveTab,
  onOpenAddContactoModal,
  onOpenAddActivityModal,
  onEditActivity
}) => {
  const [activeTab, setActiveTabLocal] = useState<'tablero' | 'instrucciones'>('tablero');
  const { currentUser, visibleContactos, visibleUsers, users, actividades, pollingStations } = useApp();

  const currentDate = new Date();
  const currentMonthNum = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Actividades del líder actual
  const myActivities = useMemo(() => {
    return actividades.filter(a => a.lider_id === currentUser?.id);
  }, [actividades, currentUser]);

  // Actividades programadas pendientes vs realizadas
  const isRealizedActivity = (act) => {
    return (act.asistentes_reales && act.asistentes_reales > 0) || 
           (act.costo_real && act.costo_real > 0) || 
           (act.nuevos_contactos_generados && act.nuevos_contactos_generados > 0) ||
           Boolean(act.evidencia_enlace);
  };

  const myProgrammedActivities = useMemo(() => {
    return myActivities.filter(a => !isRealizedActivity(a));
  }, [myActivities]);

  const myRealizedActivities = useMemo(() => {
    return myActivities.filter(isRealizedActivity);
  }, [myActivities]);

  // Semáforo Mensual del Líder (Fórmula: =SI(Y(K5>=1;L5>=1);"Verde";SI(O(K5>=0,7;L5>=0,7);"Amarillo";"Rojo")))
  const leaderMonthScorecard = useMemo(() => {
    const monthActs = myRealizedActivities.filter(act => {
      if (!act.fecha) return false;
      const d = new Date(act.fecha);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === currentYear && d.getMonth() === currentMonthNum;
    });

    const monthContactos = visibleContactos.filter(c => {
      if (!c.created_at && !c.fecha_registro) return true;
      const d = new Date(c.created_at || c.fecha_registro || '');
      if (isNaN(d.getTime())) return true;
      return d.getFullYear() === currentYear && d.getMonth() === currentMonthNum;
    });

    const actCount = monthActs.length;
    const contactosCount = monthContactos.length;

    const metaContactos = 20;
    const metaActividades = 4;

    const ratioK = contactosCount / metaContactos;
    const ratioL = actCount / metaActividades;

    let semaforo = 'ROJO';
    let semaforoLabel = 'Rojo (Alerta de Avance)';
    let diagnostico = 'Estás iniciando el mes. Programa tus primeras actividades para alcanzar el semáforo verde.';

    if (ratioK >= 1.0 && ratioL >= 1.0) {
      semaforo = 'VERDE';
      semaforoLabel = 'Verde (Meta Superada)';
      diagnostico = '¡Excelente trabajo! Has superado las metas mensuales de contactos y actividades.';
    } else if (ratioK >= 0.7 || ratioL >= 0.7) {
      semaforo = 'AMARILLO';
      semaforoLabel = 'Amarillo (Buen Ritmo)';
      diagnostico = ratioK >= 0.7
        ? 'Muy buen ritmo de contactos. Te falta realizar más actividades presenciales.'
        : 'Buen número de actividades. Enfócate en captar más simpatizantes y contactos.';
    }

    return {
      actCount,
      contactosCount,
      metaContactos,
      metaActividades,
      ratioK,
      ratioL,
      cumpK: ratioK * 100,
      cumpL: ratioL * 100,
      semaforo,
      semaforoLabel,
      diagnostico
    };
  }, [myRealizedActivities, visibleContactos, currentMonthNum, currentYear]);

  const stats = useMemo(() => {
    // Basic stats
    const lideresActivos = visibleUsers.filter(u => u.estado === 'ACTIVO').length;

    // Sublíderes calculation for current leader (STRICT ISOLATION)
    const userSubliderIds = users
      .filter(u => u.rol === 'SUBLIDER' && (
        (currentUser?.rol === 'ADMIN' || currentUser?.rol === 'LIDER_PRINCIPAL') ? true : u.lider_principal_id === currentUser?.id
      ))
      .map(u => u.id);

    const contactoSubliderIds = visibleContactos
      .filter(c => c.rol === 'SUBLIDER' && (
        (currentUser?.rol === 'ADMIN' || currentUser?.rol === 'LIDER_PRINCIPAL') ? true : c.lider_id === currentUser?.id
      ))
      .map(c => c.id);

    const uniqueSubliderIds = new Set([
      ...userSubliderIds,
      ...contactoSubliderIds
    ]);

    const sublideresActivos = uniqueSubliderIds.size;
    const contactosRegistrados = visibleContactos.length;
    const actividadesRealizadas = myRealizedActivities.length;
    const actividadesProgramadas = myProgrammedActivities.length;
    const puestosConCobertura = new Set(visibleContactos.filter(c => c.puesto_id).map(c => c.puesto_id)).size;

    const contactosConsentimiento = visibleContactos.filter(c => c.consentimiento_datos).length;
    
    // States
    const estados = {
      activo: visibleUsers.filter(u => u.estado === 'ACTIVO').length,
      enFormacion: visibleUsers.filter(u => u.estado === 'EN_FORMACION').length,
      enPausa: visibleUsers.filter(u => u.estado === 'EN_PAUSA').length,
      retirado: visibleUsers.filter(u => u.estado === 'RETIRADO').length,
    };

    const totalLideres = visibleUsers.length || 1; // avoid div by 0

    return {
      lideresActivos,
      sublideresActivos,
      contactosRegistrados,
      actividadesRealizadas,
      actividadesProgramadas,
      puestosConCobertura,
      contactosConsentimiento,
      estados,
      totalLideres
    };
  }, [visibleContactos, visibleUsers, users, currentUser, myRealizedActivities, myProgrammedActivities]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      
      {/* ─── HEADER DEL LÍDER ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Panel del Líder Territorial
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {currentUser?.nombre_completo}
            </span>
          </div>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1">
            Planifica tus actividades comunitarias, registra resultados y haz seguimiento a tus metas mensuales
          </p>
        </div>

        {/* Acciones Rápidas del Líder */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenAddContactoModal && (
            <button
              onClick={onOpenAddContactoModal}
              className="px-3.5 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-neutral-200 hover:text-white flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>+ Nuevo Contacto</span>
            </button>
          )}

          <button
            onClick={() => onOpenAddActivityModal ? onOpenAddActivityModal('programar') : setActiveTab && setActiveTab('activities')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Programar Actividad</span>
          </button>
        </div>
      </div>

      {/* ─── CARD PRINCIPAL: SEMÁFORO MENSUAL DEL LÍDER ─── */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" /> Tu Desempeño Territorial del Mes
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-lg sm:text-xl font-black px-3.5 py-1 rounded-2xl flex items-center gap-2 shadow-md ${
                leaderMonthScorecard.semaforo === 'VERDE'
                  ? 'bg-emerald-500 text-neutral-950'
                  : leaderMonthScorecard.semaforo === 'AMARILLO'
                  ? 'bg-amber-400 text-neutral-950'
                  : 'bg-rose-600 text-white'
              }`}>
                {leaderMonthScorecard.semaforo === 'VERDE' && '🟢 Semáforo Verde'}
                {leaderMonthScorecard.semaforo === 'AMARILLO' && '🟡 Semáforo Amarillo'}
                {leaderMonthScorecard.semaforo === 'ROJO' && '🔴 Semáforo Rojo'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-300">
              {leaderMonthScorecard.diagnostico}
            </p>
          </div>

          {/* Ratios K y L */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full lg:w-auto shrink-0">
            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 min-w-[160px]">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Tus Contactos Activos</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold">Directorio</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-2xl font-black text-white">{stats.contactosRegistrados}</span>
                <span className="text-xs text-neutral-400 font-medium">simpatizantes</span>
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                Personas registradas bajo tu liderazgo
              </span>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-3.5 min-w-[160px]">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase">Jornadas Comunitarias</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-semibold">Territorio</span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-2xl font-black text-emerald-400">{stats.actividadesRealizadas}</span>
                <span className="text-xs text-neutral-400 font-medium">realizadas · {stats.actividadesProgramadas} programadas</span>
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">
                {stats.actividadesProgramadas > 0 ? 'Tienes actividades listas para ejecutar' : 'Programa tu próxima actividad'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── PRÓXIMAS ACTIVIDADES PROGRAMADAS DEL LÍDER ─── */}
      {myProgrammedActivities.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock3 className="w-5 h-5 text-indigo-400" />
              Tus Próximas Actividades Programadas ({myProgrammedActivities.length})
            </h3>
            {setActiveTab && (
              <button
                onClick={() => setActiveTab('activities')}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Todas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {myProgrammedActivities.map(act => (
              <div key={act.id} className="bg-neutral-950 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-4 flex flex-col justify-between gap-3 transition">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                      ⏳ Programada
                    </span>
                    <span className="text-xs font-bold text-white">{act.fecha}</span>
                  </div>
                  <h4 className="font-bold text-sm text-neutral-200 mt-2">
                    {act.tipo_actividad.replace(/_/g, ' ')}
                  </h4>
                  <div className="text-xs text-neutral-400 space-y-1 mt-1">
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-400" />
                      {act.barrio || 'Barrio por definir'}
                    </p>
                    <p className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-indigo-400" />
                      Meta asistentes: <strong className="text-white">{act.meta_asistentes}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (onEditActivity) {
                      onEditActivity(act, 'resultados');
                    } else if (onOpenAddActivityModal) {
                      onOpenAddActivityModal('resultados');
                    } else if (setActiveTab) {
                      setActiveTab('activities');
                    }
                  }}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Registrar Resultados Reales</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── TABS: TABLERO vs INSTRUCCIONES ─── */}
      <div className="flex gap-2 p-1 bg-neutral-900 border border-neutral-800 rounded-xl overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTabLocal('tablero')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'tablero'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Tablero de Control Territorial
        </button>
        <button
          onClick={() => setActiveTabLocal('instrucciones')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'instrucciones'
              ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Instrucciones del Modelo
        </button>
      </div>

      {/* Tab Content: Instrucciones */}
      {activeTab === 'instrucciones' && (
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-neutral-950/50 p-6 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-400" />
                Objetivo del Archivo
              </h2>
              <p className="text-neutral-300 mt-2 leading-relaxed text-sm">
                Organizar a cada líder en máximo dos puestos de votación cercanos a su residencia o a su mayor presencia comunitaria, y hacer seguimiento a crecimiento, actividades y cobertura territorial. El archivo evita registrar intención de voto, datos sensibles o información obtenida sin autorización.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-800/50">
              {/* Flujo Recomendado */}
              <div className="bg-neutral-900 p-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <ListChecks className="w-5 h-5 text-emerald-400" />
                  Flujo Recomendado
                </h3>
                <ul className="space-y-3">
                  {[
                    'Registrar puestos',
                    'Registrar líderes y su zona natural',
                    'Asignar máximo dos puestos por líder',
                    'Registrar contactos con consentimiento',
                    'Programar actividades comunitarias',
                    'Actualizar seguimiento mensual',
                    'Revisar el tablero de control'
                  ].map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-neutral-300">
                      <span className="flex items-center justify-center min-w-[24px] h-6 rounded bg-neutral-800 text-neutral-400 font-bold text-xs border border-neutral-700">
                        {idx + 1}
                      </span>
                      <span className="mt-0.5">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Reglas de Integridad */}
              <div className="bg-neutral-900 p-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  Reglas de Integridad y Cumplimiento
                </h3>
                <ul className="space-y-3">
                  {[
                    'No registrar intención de voto ni preferencias políticas individuales.',
                    'No registrar religión, salud, etnia, orientación sexual u otros datos sensibles.',
                    'Usar únicamente información entregada voluntariamente y con consentimiento.',
                    'No condicionar ayudas, beneficios o servicios a apoyo político.',
                    'No duplicar personas entre líderes; resolver el responsable territorial.',
                    'Concentrar a cada líder en máximo dos puestos.'
                  ].map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-neutral-300">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Tablero */}
      {activeTab === 'tablero' && (
        <div className="space-y-6">
          {/* Top Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Líderes activos</p>
              <p className="text-3xl font-black text-white">{stats.lideresActivos}</p>
            </div>
            <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Sublíderes</p>
              <p className="text-3xl font-black text-white">{stats.sublideresActivos}</p>
            </div>
            <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Contactos registrados</p>
              <p className="text-3xl font-black text-white">{stats.contactosRegistrados}</p>
            </div>
            <div className="bg-purple-600/20 border border-purple-500/30 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Actividades realizadas</p>
              <p className="text-3xl font-black text-white">{stats.actividadesRealizadas}</p>
            </div>
            <div className="bg-cyan-600/20 border border-cyan-500/30 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">Puestos con cobertura</p>
              <p className="text-3xl font-black text-white">{stats.puestosConCobertura}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Indicadores de Calidad */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="bg-blue-600 px-4 py-2">
                <h3 className="text-sm font-bold text-white uppercase">Indicadores de Calidad</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-neutral-950/60 text-neutral-300">
                    <tr>
                      <th className="px-4 py-2 border-b border-neutral-800/50">Indicador</th>
                      <th className="px-4 py-2 border-b border-neutral-800/50 text-center">Resultado</th>
                      <th className="px-4 py-2 border-b border-neutral-800/50 text-center">Meta</th>
                      <th className="px-4 py-2 border-b border-neutral-800/50 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50 text-neutral-300">
                    <tr>
                      <td className="px-4 py-3">Líderes con máximo 2 puestos</td>
                      <td className="px-4 py-3 text-center">{stats.lideresActivos}</td>
                      <td className="px-4 py-3 text-center">{stats.lideresActivos}</td>
                      <td className="px-4 py-3 text-center font-medium text-emerald-400 bg-emerald-500/10">100%</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Contactos con consentimiento</td>
                      <td className="px-4 py-3 text-center">{stats.contactosConsentimiento}</td>
                      <td className="px-4 py-3 text-center">{stats.contactosRegistrados}</td>
                      <td className="px-4 py-3 text-center font-medium text-emerald-400 bg-emerald-500/10">
                        {stats.contactosRegistrados > 0 ? Math.round((stats.contactosConsentimiento / stats.contactosRegistrados) * 100) : 0}%
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Seguimientos al día</td>
                      <td className="px-4 py-3 text-center">{stats.actividadesRealizadas}</td>
                      <td className="px-4 py-3 text-center">{stats.actividadesRealizadas + stats.actividadesProgramadas}</td>
                      <td className="px-4 py-3 text-center font-medium text-emerald-400 bg-emerald-500/10">
                        {stats.actividadesRealizadas + stats.actividadesProgramadas > 0
                          ? Math.round((stats.actividadesRealizadas / (stats.actividadesRealizadas + stats.actividadesProgramadas)) * 100)
                          : 100}%
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Actividades con meta cumplida</td>
                      <td className="px-4 py-3 text-center">{stats.actividadesRealizadas}</td>
                      <td className="px-4 py-3 text-center">{stats.actividadesRealizadas}</td>
                      <td className="px-4 py-3 text-center font-medium text-emerald-400 bg-emerald-500/10">
                        {stats.actividadesRealizadas > 0 ? '100%' : '0%'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alertas Operativas */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="bg-indigo-600 px-4 py-2">
                <h3 className="text-sm font-bold text-white uppercase">Alertas Operativas</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-neutral-950/60 text-neutral-300">
                    <tr>
                      <th className="px-4 py-2 border-b border-neutral-800/50">Alerta</th>
                      <th className="px-4 py-2 border-b border-neutral-800/50 text-center">Cantidad</th>
                      <th className="px-4 py-2 border-b border-neutral-800/50">Criterio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50 text-neutral-300">
                    <tr>
                      <td className="px-4 py-3">Líderes sin asignación</td>
                      <td className="px-4 py-3 text-center font-bold text-rose-400">0</td>
                      <td className="px-4 py-3 text-xs text-neutral-400">Sin puesto principal</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Actividades pendientes por ejecutar</td>
                      <td className="px-4 py-3 text-center font-bold text-amber-400">{stats.actividadesProgramadas}</td>
                      <td className="px-4 py-3 text-xs text-neutral-400">Programadas por cerrar</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Registros sin consentimiento</td>
                      <td className="px-4 py-3 text-center font-bold text-rose-400">{stats.contactosRegistrados - stats.contactosConsentimiento}</td>
                      <td className="px-4 py-3 text-xs text-neutral-400">Debe corregirse</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Puestos sin contactos</td>
                      <td className="px-4 py-3 text-center font-bold text-rose-400">0</td>
                      <td className="px-4 py-3 text-xs text-neutral-400">Cobertura pendiente</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
            <p className="text-xs text-amber-500 italic flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>
                Nota: este tablero está diseñado para organización territorial, participación comunitaria y seguimiento logístico. No debe utilizarse para registrar intención de voto ni perfilar personas con datos sensibles.
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
