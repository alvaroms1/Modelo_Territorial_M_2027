import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Users,
  ShieldCheck,
  Building,
  BarChart3,
  PieChart as PieIcon,
  Layers,
  Search,
  Download,
  Filter,
  Sparkles,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { PollingStation, Contacto, UserAccount } from '../types';
import { smartSearch } from '../utils/helpers';
import * as XLSX from 'xlsx-js-style';

interface PollingStationCoverageDashboardProps {
  pollingStations: PollingStation[];
  contactos: Contacto[];
  users: UserAccount[];
}

export const PollingStationCoverageDashboard: React.FC<PollingStationCoverageDashboardProps> = ({
  pollingStations,
  contactos,
  users
}) => {
  // View mode for the charts: 'columns' | 'donut' | 'ranking'
  const [chartView, setChartView] = useState<'columns' | 'donut' | 'ranking'>('columns');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FUERTE' | 'PROGRESO' | 'DESATENDIDO'>('ALL');
  const [localidadFilter, setLocalidadFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  // Neon color palette for charts
  const neonPalette = [
    '#6366f1', '#ec4899', '#3b82f6', '#10b981', '#f59e0b',
    '#8b5cf6', '#06b6d4', '#f43f5e', '#14b8a6', '#eab308'
  ];

  // 1. Calculate stats per Polling Station
  const stationStats = useMemo(() => {
    return pollingStations.map(station => {
      // Direct contacts at this station
      const stContacts = contactos.filter(c => c.puesto_id === station.id);
      
      // Leaders and Subleaders associated with this station or who registered contacts here
      const leaderIdsAtStation = new Set<string>();
      stContacts.forEach(c => {
        if (c.lider_id) leaderIdsAtStation.add(c.lider_id);
        if (c.sublider_id) leaderIdsAtStation.add(c.sublider_id);
      });

      const associatedUsers = users.filter(u => leaderIdsAtStation.has(u.id));
      const principalLeaders = associatedUsers.filter(u => u.rol === 'LIDER_PRINCIPAL' || u.rol === 'LIDER');
      const subLeaders = associatedUsers.filter(u => u.rol === 'SUBLIDER');

      const totalForce = stContacts.length + associatedUsers.length;

      let status: 'Fuerte' | 'En Progreso' | 'Desatendido' = 'Desatendido';
      if (stContacts.length >= 50 || totalForce >= 55) {
        status = 'Fuerte';
      } else if (stContacts.length > 0 || totalForce > 0) {
        status = 'En Progreso';
      }

      return {
        station,
        contactsCount: stContacts.length,
        principalLeadersCount: principalLeaders.length,
        subLeadersCount: subLeaders.length,
        totalLeadersCount: associatedUsers.length,
        totalForce,
        status
      };
    });
  }, [pollingStations, contactos, users]);

  // 2. High level KPI cards metrics
  const totalStations = stationStats.length;
  const coveredStations = stationStats.filter(s => s.status !== 'Desatendido').length;
  const pctCovered = totalStations > 0 ? (coveredStations / totalStations) * 100 : 0;
  
  const fuertesCount = stationStats.filter(s => s.status === 'Fuerte').length;
  const progresoCount = stationStats.filter(s => s.status === 'En Progreso').length;
  const desatendidosCount = stationStats.filter(s => s.status === 'Desatendido').length;

  const grandTotalContacts = contactos.length;
  const grandTotalLeaders = users.filter(u => u.rol === 'LIDER' || u.rol === 'LIDER_PRINCIPAL').length;
  const grandTotalSubleaders = users.filter(u => u.rol === 'SUBLIDER').length;
  const totalPoliticalForce = grandTotalContacts + grandTotalLeaders + grandTotalSubleaders;

  // 3. Top Most Representative Polling Stations
  const topRepresentativeStations = useMemo(() => {
    return [...stationStats]
      .sort((a, b) => b.totalForce - a.totalForce)
      .slice(0, 8);
  }, [stationStats]);

  // 4. Localities summary
  const localityStats = useMemo(() => {
    const map = new Map<string, { total: number; covered: number; contacts: number; force: number }>();
    stationStats.forEach(s => {
      const loc = s.station.comuna_localidad || 'Sin Asignar';
      const curr = map.get(loc) || { total: 0, covered: 0, contacts: 0, force: 0 };
      curr.total += 1;
      if (s.status !== 'Desatendido') curr.covered += 1;
      curr.contacts += s.contactsCount;
      curr.force += s.totalForce;
      map.set(loc, curr);
    });

    return Array.from(map.entries()).map(([loc, data]) => ({
      localidad: loc,
      ...data,
      pctCovered: data.total > 0 ? (data.covered / data.total) * 100 : 0
    }));
  }, [stationStats]);

  // 5. Filtered Table Rows
  const filteredRows = useMemo(() => {
    return stationStats.filter(item => {
      // Status filter
      if (statusFilter === 'FUERTE' && item.status !== 'Fuerte') return false;
      if (statusFilter === 'PROGRESO' && item.status !== 'En Progreso') return false;
      if (statusFilter === 'DESATENDIDO' && item.status !== 'Desatendido') return false;

      // Localidad filter
      if (localidadFilter !== 'ALL' && item.station.comuna_localidad !== localidadFilter) return false;

      // Smart search
      if (searchTerm) {
        return smartSearch([
          item.station.nombre_puesto,
          item.station.codigo_puesto,
          item.station.barrio_corregimiento,
          item.station.comuna_localidad,
          item.station.direccion,
          item.status
        ], searchTerm);
      }

      return true;
    }).sort((a, b) => b.totalForce - a.totalForce);
  }, [stationStats, statusFilter, localidadFilter, searchTerm]);

  // Excel Export
  const exportToExcel = () => {
    const dataToExport = filteredRows.map(row => ({
      'Código Puesto': row.station.codigo_puesto,
      'Nombre del Puesto': row.station.nombre_puesto,
      'Localidad': row.station.comuna_localidad || 'No Asignado',
      'Barrio': row.station.barrio_corregimiento || 'No Asignado',
      'Dirección': row.station.direccion || 'N/A',
      'Contactos Registrados': row.contactsCount,
      'Líderes Asignados': row.principalLeadersCount,
      'Sublíderes Asignados': row.subLeadersCount,
      'Fuerza Total': row.totalForce,
      'Estado de Cobertura': row.status
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cobertura_Puestos');
    XLSX.writeFile(wb, `Reporte_Cobertura_Puestos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">

      {/* ─── HEADER: TABLERO DE COBERTURA DE PUESTOS ─── */}
      <div className="bg-[#111114] border border-neutral-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-3 rounded-2xl shadow-xl shadow-indigo-500/20 text-white">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-xl font-black text-white tracking-tight">
                  Dashboard de Cobertura de Puestos
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-mono text-[11px] font-bold border border-indigo-500/30">
                  {totalStations} Recintos
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Supervisión de representatividad, fuerza electoral y densidad de líderes y sublíderes por recinto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={exportToExcel}
              className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Cobertura Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── 4 TARJETAS KPI DE FUERZA ELECTORAL & COBERTURA ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Tasa de Cobertura Distrital */}
        <div className="bg-[#111114] border border-neutral-800 hover:border-indigo-500/40 rounded-3xl p-5 transition shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Cobertura Distrital</span>
            <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20 text-indigo-400">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-white">{pctCovered.toFixed(0)}%</h4>
            <span className="text-xs text-emerald-400 font-bold">
              {coveredStations} de {totalStations} puestos
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Recintos con presencia territorial activa
          </p>
          <div className="w-full bg-neutral-900 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-rose-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${pctCovered}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Fuerza Electoral Consolidada */}
        <div className="bg-[#111114] border border-neutral-800 hover:border-pink-500/40 rounded-3xl p-5 transition shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Fuerza Electoral Total</span>
            <div className="bg-pink-500/10 p-2 rounded-xl border border-pink-500/20 text-pink-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-white">{totalPoliticalForce.toLocaleString()}</h4>
            <span className="text-xs text-pink-400 font-bold">Estructura</span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            {grandTotalContacts} Contactos • {grandTotalLeaders + grandTotalSubleaders} Líderes y Sublíderes
          </p>
          <div className="w-full bg-neutral-900 rounded-full h-2 mt-3 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-amber-400 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        {/* KPI 3: Puestos con Cobertura Fuerte */}
        <div className="bg-[#111114] border border-neutral-800 hover:border-emerald-500/40 rounded-3xl p-5 transition shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Puestos Fuertes (≥50)</span>
            <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-emerald-400">{fuertesCount}</h4>
            <span className="text-xs text-neutral-400 font-semibold">
              {totalStations > 0 ? ((fuertesCount / totalStations) * 100).toFixed(0) : 0}% de los puestos
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Alta consolidación y fidelización
          </p>
          <div className="w-full bg-neutral-900 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full shadow-sm shadow-emerald-500"
              style={{ width: `${Math.min(100, (fuertesCount / totalStations) * 100)}%` }}
            />
          </div>
        </div>

        {/* KPI 4: Puestos Desatendidos (Oportunidad) */}
        <div className="bg-[#111114] border border-neutral-800 hover:border-rose-500/40 rounded-3xl p-5 transition shadow-xl relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Puestos por Cubrir</span>
            <div className="bg-rose-500/10 p-2 rounded-xl border border-rose-500/20 text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-rose-400">{desatendidosCount}</h4>
            <span className="text-xs text-neutral-400 font-semibold">
              {progresoCount} en progreso
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Requieren asignación prioritaria de líderes
          </p>
          <div className="w-full bg-neutral-900 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full"
              style={{ width: `${Math.min(100, (desatendidosCount / totalStations) * 100)}%` }}
            />
          </div>
        </div>

      </div>

      {/* ─── SECCIÓN INTERACTIVA: GRÁFICAS DE PUESTOS MÁS REPRESENTATIVOS ─── */}
      <div className="bg-[#111114] border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-6">
        
        {/* Chart Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800/80 pb-4">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Puestos de Votación Más Representativos de Cartagena
            </h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              Volumen total de contactos registrados, líderes principales y sublíderes en cada puesto
            </p>
          </div>

          {/* Interactive Toggle between Columns, Donut, and Ranking */}
          <div className="flex bg-neutral-900 p-1.5 rounded-2xl border border-neutral-800 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setChartView('columns')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                chartView === 'columns'
                  ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Columnas 3D</span>
            </button>
            <button
              type="button"
              onClick={() => setChartView('donut')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                chartView === 'donut'
                  ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Torta / Dona</span>
            </button>
            <button
              type="button"
              onClick={() => setChartView('ranking')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                chartView === 'ranking'
                  ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Ranking Detallado</span>
            </button>
          </div>
        </div>

        {/* ─── VISTA 1: COLUMNAS 3D / BARRAS AGRUPADAS ─── */}
        {chartView === 'columns' && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 gap-3.5">
              {topRepresentativeStations.map((item, idx) => {
                const maxForce = topRepresentativeStations[0]?.totalForce || 1;
                const pctOfMax = (item.totalForce / maxForce) * 100;
                const isSelected = selectedStationId === item.station.id;

                return (
                  <div
                    key={item.station.id}
                    onClick={() => setSelectedStationId(isSelected ? null : item.station.id)}
                    className={`p-4 rounded-2xl transition border cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-800/80 border-indigo-500 shadow-lg shadow-indigo-500/10'
                        : 'bg-neutral-900/70 border-neutral-800 hover:bg-neutral-800/40 hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-600 text-white text-xs font-mono font-black flex items-center justify-center shrink-0 shadow-md">
                          #{idx + 1}
                        </span>
                        <div>
                          <h5 className="font-bold text-white text-xs sm:text-sm">
                            {item.station.nombre_puesto}
                          </h5>
                          <p className="text-[11px] text-neutral-400 font-mono">
                            [{item.station.codigo_puesto}] • {item.station.barrio_corregimiento || 'Barrio No Asignado'} ({item.station.comuna_localidad || 'Localidad No Asignada'})
                          </p>
                        </div>
                      </div>

                      {/* Micro Pill Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 text-[11px] font-bold border border-indigo-500/20">
                          {item.contactsCount} Contactos
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 text-[11px] font-bold border border-emerald-500/20">
                          {item.principalLeadersCount} Líderes
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 text-[11px] font-bold border border-amber-500/20">
                          {item.subLeadersCount} Sublíderes
                        </span>
                        <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 text-xs font-mono font-black border border-pink-500/30">
                          Total: {item.totalForce}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar 3D Segmented */}
                    <div className="w-full bg-neutral-950 rounded-full h-3.5 p-0.5 overflow-hidden flex relative border border-neutral-800">
                      {/* Contacts Segment */}
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-full rounded-l-full transition-all duration-500"
                        style={{ width: `${item.totalForce > 0 ? (item.contactsCount / item.totalForce) * pctOfMax : 0}%` }}
                        title={`${item.contactsCount} Contactos`}
                      />
                      {/* Leaders Segment */}
                      <div
                        className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${item.totalForce > 0 ? (item.principalLeadersCount / item.totalForce) * pctOfMax : 0}%` }}
                        title={`${item.principalLeadersCount} Líderes`}
                      />
                      {/* Subleaders Segment */}
                      <div
                        className="bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-r-full transition-all duration-500"
                        style={{ width: `${item.totalForce > 0 ? (item.subLeadersCount / item.totalForce) * pctOfMax : 0}%` }}
                        title={`${item.subLeadersCount} Sublíderes`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend for Columns */}
            <div className="flex items-center justify-between text-xs text-neutral-400 pt-3 border-t border-neutral-800">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" /> Contactos
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" /> Líderes Principales
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> Sublíderes
                </span>
              </div>
              <span className="text-neutral-500 text-[11px]">Haz clic en cualquier puesto para enfocar</span>
            </div>
          </div>
        )}

        {/* ─── VISTA 2: TORTA / DONA MULTICOLOR DE FUERZA ELECTORAL ─── */}
        {chartView === 'donut' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-4">
            
            {/* SVG Donut Graphic */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-56 h-56 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {(() => {
                    let cumulativePct = 0;
                    const totalTopForce = topRepresentativeStations.reduce((s, p) => s + p.totalForce, 0) || 1;
                    return topRepresentativeStations.map((item, i) => {
                      const pct = (item.totalForce / totalTopForce) * 100;
                      const strokeDash = `${pct} ${100 - pct}`;
                      const strokeOffset = 100 - cumulativePct;
                      cumulativePct += pct;
                      return (
                        <circle
                          key={item.station.id}
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke={neonPalette[i % neonPalette.length]}
                          strokeWidth="16"
                          strokeDasharray={strokeDash}
                          strokeDashoffset={strokeOffset}
                          className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-3xl font-black text-white">{totalPoliticalForce}</span>
                  <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Fuerza Total</span>
                </div>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="lg:col-span-7 space-y-2.5">
              {topRepresentativeStations.map((item, i) => {
                const totalTopForce = topRepresentativeStations.reduce((s, p) => s + p.totalForce, 0) || 1;
                const pct = ((item.totalForce / totalTopForce) * 100).toFixed(1);
                return (
                  <div
                    key={item.station.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800/80 hover:bg-neutral-800/50 transition"
                  >
                    <div className="flex items-center gap-3 truncate pr-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                        style={{ backgroundColor: neonPalette[i % neonPalette.length] }}
                      />
                      <div className="truncate">
                        <h6 className="font-bold text-white text-xs truncate">{item.station.nombre_puesto}</h6>
                        <span className="text-[10px] text-neutral-400">{item.station.barrio_corregimiento || 'Sin Barrio'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono font-bold text-white">{item.totalForce} personas</span>
                      <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-300 font-mono text-[10px] font-bold">
                        {pct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ─── VISTA 3: RANKING DETALLADO EN CUADRÍCULA ─── */}
        {chartView === 'ranking' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {topRepresentativeStations.map((item, idx) => (
              <div
                key={item.station.id}
                className="bg-neutral-900/90 border border-neutral-800 hover:border-amber-500/40 rounded-3xl p-4 flex flex-col justify-between transition shadow-lg relative group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-400 font-mono font-black text-xs border border-amber-500/20">
                      Rango #{idx + 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      item.status === 'Fuerte' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      item.status === 'En Progreso' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                      'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  <h5 className="font-bold text-white text-xs line-clamp-2 mb-1">
                    {item.station.nombre_puesto}
                  </h5>
                  <p className="text-[11px] text-neutral-400 font-mono mb-3">
                    {item.station.codigo_puesto} • {item.station.direccion || 'Sin dirección'}
                  </p>
                </div>

                <div className="pt-3 border-t border-neutral-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-neutral-300">
                    <span>Contactos:</span>
                    <strong className="text-indigo-400 font-mono">{item.contactsCount}</strong>
                  </div>
                  <div className="flex justify-between text-neutral-300">
                    <span>Líderes + Sublíderes:</span>
                    <strong className="text-emerald-400 font-mono">{item.totalLeadersCount}</strong>
                  </div>
                  <div className="flex justify-between text-white font-bold pt-1 border-t border-neutral-800/60">
                    <span>Fuerza Total:</span>
                    <strong className="text-pink-400 font-mono">{item.totalForce}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ─── RESUMEN POR LOCALIDADES DE CARTAGENA ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {localityStats.map((loc) => (
          <div key={loc.localidad} className="bg-[#111114] border border-neutral-800 rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-bold text-white line-clamp-1">{loc.localidad}</h5>
              <span className="text-xs font-mono font-bold text-indigo-400">{loc.covered}/{loc.total} puestos</span>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-2xl font-black text-white">{loc.force}</span>
              <span className="text-xs text-neutral-400">personas en estructura</span>
            </div>
            <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${loc.pctCovered}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-500 mt-2">
              <span>Cobertura: {loc.pctCovered.toFixed(0)}%</span>
              <span>{loc.contacts} Contactos</span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── TABLA COMPLETA DE COBERTURA DE PUESTOS (FILTRABLE Y CON BUSCADOR INTELIGENTE) ─── */}
      <div className="space-y-4">
        
        {/* Search & State Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#111114] p-4 rounded-2xl border border-neutral-800">
          <div className="relative w-full md:max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por puesto, barrio o comuna en tiempo real..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter Buttons */}
            <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-bold transition ${statusFilter === 'ALL' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}
              >
                Todos ({stationStats.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('FUERTE')}
                className={`px-3 py-1 rounded-lg font-bold transition ${statusFilter === 'FUERTE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-neutral-400 hover:text-white'}`}
              >
                Fuertes ({fuertesCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PROGRESO')}
                className={`px-3 py-1 rounded-lg font-bold transition ${statusFilter === 'PROGRESO' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-neutral-400 hover:text-white'}`}
              >
                En Progreso ({progresoCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('DESATENDIDO')}
                className={`px-3 py-1 rounded-lg font-bold transition ${statusFilter === 'DESATENDIDO' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-neutral-400 hover:text-white'}`}
              >
                Desatendidos ({desatendidosCount})
              </button>
            </div>
          </div>
        </div>

        {/* The Master Table */}
        <div className="bg-[#111114] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-950 text-neutral-400 text-xs font-bold uppercase tracking-wider border-b border-neutral-800">
                  <th className="p-4">Código / Nombre del Puesto</th>
                  <th className="p-4">Localidad / Comuna</th>
                  <th className="p-4">Barrio Base</th>
                  <th className="p-4">Dirección</th>
                  <th className="p-4 text-center">Contactos</th>
                  <th className="p-4 text-center">Líderes</th>
                  <th className="p-4 text-center">Sublíderes</th>
                  <th className="p-4 text-center">Fuerza Total</th>
                  <th className="p-4 text-center">Estado de Cobertura</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-xs font-medium text-neutral-300">
                {filteredRows.map(row => (
                  <tr key={row.station.id} className="hover:bg-neutral-800/40 transition">
                    <td className="p-4">
                      <p className="font-bold text-white text-sm">{row.station.nombre_puesto}</p>
                      <p className="text-[10px] text-amber-400 font-mono font-semibold">{row.station.codigo_puesto}</p>
                    </td>
                    <td className="p-4 text-neutral-400">
                      {row.station.comuna_localidad || (
                        <span className="px-2 py-0.5 rounded-md bg-neutral-800 text-neutral-500 text-[10px]">No Asignado</span>
                      )}
                    </td>
                    <td className="p-4 text-neutral-400">
                      {row.station.barrio_corregimiento || (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-semibold border border-amber-500/20">No Asignado</span>
                      )}
                    </td>
                    <td className="p-4 text-neutral-400">{row.station.direccion || 'N/A'}</td>
                    <td className="p-4 text-center font-bold text-indigo-400 text-sm">{row.contactsCount}</td>
                    <td className="p-4 text-center font-semibold text-emerald-400">{row.principalLeadersCount}</td>
                    <td className="p-4 text-center font-semibold text-amber-400">{row.subLeadersCount}</td>
                    <td className="p-4 text-center font-mono font-black text-pink-400 text-sm">{row.totalForce}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        row.status === 'Fuerte' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        row.status === 'En Progreso' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                        'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRows.length === 0 && (
              <div className="p-10 text-center text-neutral-500 text-xs">
                No se encontraron puestos de votación con los filtros aplicados.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
