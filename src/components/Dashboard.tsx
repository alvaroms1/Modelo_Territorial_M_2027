import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { NavTab } from './Navigation';
import { LiderDashboard } from './LiderDashboard';
import { AdminDashboard } from './AdminDashboard';
import {
  Users,
  GitFork,
  Vote,
  TrendingUp,
  Activity,
  CheckCircle2,
  FileCheck2,
  AlertCircle,
  GitBranch
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: NavTab) => void;
  onOpenAddContactoModal: () => void;
  onOpenAddActivityModal?: (phase?: 'programar' | 'resultados') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveTab,
  onOpenAddContactoModal,
  onOpenAddActivityModal,
}) => {
  const { currentUser, visibleContactos, visibleUsers, users, pollingStations, actividades } = useApp();

  const stats = useMemo(() => {
    // Only count actual active leaders (excluding the Administrator General)
    const totalLideres = visibleUsers.filter(u => u.estado === 'ACTIVO' && u.rol !== 'ADMIN').length;
    const totalSublideres = visibleUsers.filter(u => u.estado === 'ACTIVO' && u.rol === 'SUBLIDER').length;
    const totalContactos = visibleContactos.filter(c => c.consentimiento_datos).length;
    const totalActividades = actividades.length;
    const puestosCobertura = new Set(visibleContactos.filter(c => c.puesto_id).map(c => c.puesto_id)).size;

    return {
      totalLideres,
      totalSublideres,
      totalContactos,
      totalActividades,
      puestosCobertura
    };
  }, [visibleContactos, visibleUsers, actividades]);

  if (!currentUser) return null;

  if (currentUser.rol === 'LIDER' || currentUser.rol === 'SUBLIDER') {
    return (
      <LiderDashboard
        setActiveTab={setActiveTab}
        onOpenAddContactoModal={onOpenAddContactoModal}
        onOpenAddActivityModal={onOpenAddActivityModal}
      />
    );
  }

  if (currentUser.rol === 'ADMIN' || currentUser.rol === 'LIDER_PRINCIPAL' || currentUser.rol === 'LIDER_PRINCIPAL_INVITADO') {
    return <AdminDashboard />;
  }

  const statCards = [
    {
      title: 'Contactos Verificados',
      value: stats.totalContactos,
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      tab: 'contactos' as NavTab,
      subtitle: 'Con consentimiento de datos'
    },
    {
      title: 'Líderes Activos',
      value: stats.totalLideres,
      icon: GitFork,
      color: 'from-emerald-500 to-teal-600',
      tab: 'leaders' as NavTab,
      subtitle: 'Nivel territorial'
    },
    {
      title: 'Sublíderes Activos',
      value: stats.totalSublideres,
      icon: GitBranch,
      color: 'from-cyan-500 to-blue-600',
      tab: 'leaders' as NavTab,
      subtitle: 'Nivel de base'
    },
    {
      title: 'Actividades Realizadas',
      value: stats.totalActividades,
      icon: Activity,
      color: 'from-amber-500 to-orange-600',
      tab: 'dashboard' as NavTab,
      subtitle: 'Registradas en la app'
    },
    {
      title: 'Puestos con Cobertura',
      value: `${stats.puestosCobertura} / ${pollingStations.length}`,
      icon: Vote,
      color: 'from-purple-500 to-pink-600',
      tab: 'polling-stations' as NavTab,
      subtitle: 'Territorios asignados'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Panel de Control
            <span className="px-2 py-1 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Mendozismo
            </span>
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Resumen de gestión y KPIs del Modelo Territorial
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onOpenAddContactoModal}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" />
            <span>Nuevo Contacto</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              onClick={() => setActiveTab(card.tab)}
              className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/80 rounded-3xl p-5 hover:bg-neutral-800/80 hover:border-neutral-700 transition cursor-pointer group shadow-xl shadow-black/20"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-black text-white tracking-tight">{card.value}</h3>
                <p className="text-sm font-bold text-neutral-300 mt-1">{card.title}</p>
                <p className="text-xs text-neutral-500 mt-1">{card.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-6 border-b border-neutral-800 pb-4">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-neutral-100">Reglas del Modelo</h2>
          </div>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-neutral-200">Consentimiento de Datos Obligatorio</p>
                <p className="text-xs text-neutral-400">Es indispensable aceptar las políticas de tratamiento de datos al registrar contactos.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <GitFork className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-neutral-200">Asignación Máxima de Puestos</p>
                <p className="text-xs text-neutral-400">Un líder principal solo puede tener asignado un máximo de dos (2) puestos de votación.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <FileCheck2 className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-neutral-200">Seguimiento de Actividades</p>
                <p className="text-xs text-neutral-400">Las metas de crecimiento se basan en actividades territoriales y contactos efectivos.</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
