import React from 'react';
import { useApp } from '../context/AppContext';
import { FilterBar } from './FilterBar';
import {
  Users,
  Target,
  Vote,
  GitFork,
  CheckCircle2,
  TrendingUp,
  Award,
  ChevronRight,
  Sparkles,
  PhoneCall,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { getRoleBadge, formatCedula } from '../utils/helpers';
import { NavTab } from './Navigation';

interface DashboardProps {
  setActiveTab: (tab: NavTab) => void;
  onOpenAddSupporterModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab, onOpenAddSupporterModal }) => {
  const {
    currentUser,
    stats,
    visibleSupporters,
    visibleLeaders,
    visibleSubleaders,
    pollingStations,
    supporters,
    users,
    filters,
    setFilters,
  } = useApp();

  if (!currentUser) return null;

  const roleBadge = getRoleBadge(currentUser.role);
  const percentageOfGoal = stats.totalGoal > 0 ? Math.min(100, Math.round((stats.totalSupporters / stats.totalGoal) * 100)) : 0;

  // Gender calculation
  const totalCount = stats.totalSupporters || 1;
  const femaleCount = stats.byGender['FEMENINO'] || 0;
  const maleCount = stats.byGender['MASCULINO'] || 0;
  const otherCount = stats.byGender['OTRO'] || 0;

  const femalePct = Math.round((femaleCount / totalCount) * 100);
  const malePct = Math.round((maleCount / totalCount) * 100);
  const otherPct = Math.round((otherCount / totalCount) * 100);

  // Age brackets
  const ageBrackets = [
    { key: '18-25', label: '18-25 años (Jóvenes)', color: 'bg-emerald-500', barColor: 'bg-emerald-500/20' },
    { key: '26-35', label: '26-35 años (Jóvenes Adultos)', color: 'bg-sky-500', barColor: 'bg-sky-500/20' },
    { key: '36-50', label: '36-50 años (Adultos)', color: 'bg-indigo-500', barColor: 'bg-indigo-500/20' },
    { key: '51-65', label: '51-65 años (Madurez)', color: 'bg-amber-500', barColor: 'bg-amber-500/20' },
    { key: '65+', label: '65+ años (Adulto Mayor)', color: 'bg-rose-500', barColor: 'bg-rose-500/20' },
  ];

  // Top Polling Stations
  const sortedStations: [string, number][] = Object.entries(stats.byPollingStation)
    .map(([k, v]): [string, number] => [k, Number(v)])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  // Top Sectors
  const sortedSectors: [string, number][] = Object.entries(stats.bySector)
    .map(([k, v]): [string, number] => [k, Number(v)])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Leaders performance ranking
  const leadersPerformance = visibleLeaders.map((leader) => {
    const leaderSubleaders = users.filter(u => u.parentLeaderId === leader.id);
    const subleaderIds = new Set(leaderSubleaders.map(u => u.id));
    const registeredCount = supporters.filter(s =>
      s.registeredByLeaderId === leader.id || (s.registeredBySubleaderId && subleaderIds.has(s.registeredBySubleaderId))
    ).length;
    const goal = leader.targetCount || 500;
    const pct = Math.min(100, Math.round((registeredCount / goal) * 100));
    return {
      leader,
      subleadersCount: leaderSubleaders.length,
      registeredCount,
      goal,
      pct,
    };
  }).sort((a, b) => b.registeredCount - a.registeredCount);

  // Subleaders performance ranking
  const subleadersPerformance = visibleSubleaders.map((subleader) => {
    const registeredCount = supporters.filter(s => s.registeredBySubleaderId === subleader.id).length;
    const goal = subleader.targetCount || 200;
    const pct = Math.min(100, Math.round((registeredCount / goal) * 100));
    return {
      subleader,
      registeredCount,
      goal,
      pct,
    };
  }).sort((a, b) => b.registeredCount - a.registeredCount);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Top Welcome & Role Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}>
                {roleBadge.label}
              </span>
              <span className="text-xs text-neutral-400">
                {currentUser.sector}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-100 tracking-tight">
              Panel de Control de {currentUser.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
              {currentUser.role === 'SUPER_ADMIN'
                ? 'Monitoreo global de toda la red territorial, líderes de zona, puestos de votación y metas de campaña.'
                : currentUser.role === 'LIDER_COORDINADOR'
                ? `Coordinación general de tu sector (${currentUser.sector}) y equipo de sublíderes asignados.`
                : 'Gestión directa de tus personas de apoyo y votantes confirmados para el día de elecciones.'}
            </p>
          </div>

          {/* Quick Register CTA */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              id="dash-btn-add-supporter"
              onClick={onOpenAddSupporterModal}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>+ Registrar Persona de Apoyo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('supporters')}
              className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-medium text-xs sm:text-sm border border-neutral-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Ver Listado ({stats.totalSupporters})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Registrados */}
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Simpatizantes</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-neutral-100">
            {stats.totalSupporters}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
            <span className="text-indigo-400 font-medium">{stats.totalSupporters} registrados</span>
            <span>en tu alcance</span>
          </div>
        </div>

        {/* Card 2: Meta Electoral */}
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Meta Asignada</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-neutral-100">{percentageOfGoal}%</span>
            <span className="text-xs text-neutral-400">de {stats.totalGoal}</span>
          </div>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${percentageOfGoal}%` }}
            ></div>
          </div>
        </div>

        {/* Card 3: Puestos de Votación */}
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Puestos Cubiertos</span>
            <Vote className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-neutral-100">
            {stats.totalPollingStations}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {pollingStations.length} puestos disponibles en la ciudad
          </div>
        </div>

        {/* Card 4: Estructura de Líderes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Red de Trabajo</span>
            <GitFork className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-neutral-100">
            {stats.totalSubleaders}
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {currentUser.role === 'SUPER_ADMIN' ? `${stats.totalLeaders} Líderes y ${stats.totalSubleaders} Sublíderes` : 'Sublíderes en tu equipo'}
          </div>
        </div>
      </div>

      {/* Filter Bar Component */}
      <FilterBar />

      {/* Demographic & Territorial Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Gender Breakdown Card */}
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-200">Distribución por Género</h3>
              <p className="text-[11px] text-neutral-400">Composición demográfica de las personas registradas</p>
            </div>
            <span className="text-xs font-semibold text-neutral-400">{stats.totalSupporters} total</span>
          </div>

          <div className="space-y-3 pt-2">
            {/* Female */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-300 font-medium flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block"></span>
                  Mujeres (Femenino)
                </span>
                <span className="text-neutral-200 font-semibold">{femaleCount} ({femalePct}%)</span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${femalePct}%` }}></div>
              </div>
            </div>

            {/* Male */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-300 font-medium flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block"></span>
                  Hombres (Masculino)
                </span>
                <span className="text-neutral-200 font-semibold">{maleCount} ({malePct}%)</span>
              </div>
              <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${malePct}%` }}></div>
              </div>
            </div>

            {/* Other */}
            {otherCount > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-300 font-medium flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                    Otro / No especificado
                  </span>
                  <span className="text-neutral-200 font-semibold">{otherCount} ({otherPct}%)</span>
                </div>
                <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${otherPct}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Age Brackets Pyramid Card */}
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-200">Segmentación por Intervalos de Edad</h3>
              <p className="text-[11px] text-neutral-400">Concentración por grupos etarios del movimiento</p>
            </div>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>

          <div className="space-y-2.5 pt-1">
            {ageBrackets.map((bracket) => {
              const count = stats.byAgeBracket[bracket.key] || 0;
              const pct = stats.totalSupporters > 0 ? Math.round((count / stats.totalSupporters) * 100) : 0;
              return (
                <div key={bracket.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-300 font-medium">{bracket.label}</span>
                    <span className="text-neutral-200 font-semibold">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div className={`h-full ${bracket.color} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Polling Stations Ranking Card */}
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-200">Puestos de Votación con Mayor Presencia</h3>
              <p className="text-[11px] text-neutral-400">Colegios e instituciones donde votan tus personas de apoyo</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('polling-stations')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {sortedStations.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-500">
                No hay puestos con registros bajo los filtros actuales.
              </div>
            ) : (
              sortedStations.map(([name, count], index) => {
                const stationObj = pollingStations.find(ps => ps.name === name);
                const pct = Math.round((count / stats.totalSupporters) * 100);
                return (
                  <div
                    key={name}
                    className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-neutral-800 text-neutral-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-neutral-200 truncate">{name}</div>
                        <div className="text-[10px] text-neutral-400 truncate">
                          {stationObj ? `${stationObj.zone} • ${stationObj.tablesCount} Mesas` : 'Puesto General'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-indigo-300 text-xs">{count} simpatizantes</div>
                      <div className="text-[10px] text-neutral-500">{pct}% del total</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sectors / Comunas Breakdown Card */}
        <div className="p-5 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-200">Presencia Territorial por Sectores</h3>
              <p className="text-[11px] text-neutral-400">Distribución de votantes por Comuna y Barrio</p>
            </div>
            <Vote className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="space-y-2.5">
            {sortedSectors.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-500">
                No hay sectores con registros bajo los filtros actuales.
              </div>
            ) : (
              sortedSectors.map(([sectorName, count]) => {
                const pct = Math.round((count / stats.totalSupporters) * 100);
                return (
                  <div key={sectorName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-300 font-medium truncate max-w-[200px]">{sectorName}</span>
                      <span className="text-neutral-200 font-semibold">{count} personas ({pct}%)</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Leadership Structure & Goals Progress */}
      {currentUser.role === 'SUPER_ADMIN' && leadersPerformance.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-200">Rendimiento por Líder Coordinador de Zona</h3>
              <p className="text-[11px] text-neutral-400">Avance de metas por cada líder y su equipo de sublíderes</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('leaders')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>Gestionar Estructura</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {leadersPerformance.map(({ leader, subleadersCount, registeredCount, goal, pct }) => (
              <div
                key={leader.id}
                className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 space-y-3 hover:border-neutral-700 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-neutral-200 text-xs">{leader.fullName}</div>
                    <div className="text-[11px] text-neutral-400">{leader.sector}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {subleadersCount} Sublíderes
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 text-[11px]">Progreso Meta</span>
                    <span className="font-bold text-neutral-200">{registeredCount} / {goal} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Tel: {leader.phone}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setFilters(prev => ({ ...prev, leaderId: leader.id }));
                      setActiveTab('supporters');
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Ver Votantes →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subleaders Progress (for Leaders or Super Admin) */}
      {subleadersPerformance.length > 0 && (
        <div className="p-5 sm:p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-200">
                {currentUser.role === 'SUPER_ADMIN' ? 'Sublíderes de Base Destacados' : 'Tu Equipo de Sublíderes'}
              </h3>
              <p className="text-[11px] text-neutral-400">Personas de apoyo registradas por cada sublíder</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('leaders')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {subleadersPerformance.slice(0, 6).map(({ subleader, registeredCount, goal, pct }) => (
              <div
                key={subleader.id}
                className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-neutral-200 text-xs truncate max-w-[170px]">
                    {subleader.fullName}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                    {registeredCount} votos
                  </span>
                </div>

                <div className="text-[10px] text-neutral-400 truncate">
                  {subleader.sector}
                </div>

                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1">
                  <span>Meta: {goal}</span>
                  <span>{pct}% alcanzado</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
