import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Users,
  Activity,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  Filter,
  Sparkles,
  MapPin,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Target
} from 'lucide-react';
import { Contacto, Actividad, UserAccount, PollingStation } from '../types';

interface KPIGraphsTabProps {
  contactos: Contacto[];
  actividades: Actividad[];
  users: UserAccount[];
  pollingStations: PollingStation[];
}

export const KPIGraphsTab: React.FC<KPIGraphsTabProps> = ({
  contactos,
  actividades,
  users,
  pollingStations
}) => {
  // Filter States
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'YEAR' | 'MONTH'>('ALL');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  
  // Interactive view switches for specific charts
  const [chartTypePuestos, setChartTypePuestos] = useState<'bar' | 'donut'>('bar');
  const [chartTypeActividades, setChartTypeActividades] = useState<'line' | 'bar'>('line');
  const [chartTypeAsistentes, setChartTypeAsistentes] = useState<'bar' | 'area'>('bar');
  const [chartTypeCumplimiento, setChartTypeCumplimiento] = useState<'line' | 'bar'>('line');

  // Hover state for interactive tooltips
  const [hoveredDataPoint, setHoveredDataPoint] = useState<{ title: string; value: string; extra?: string } | null>(null);

  const monthsNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Available Years in data
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    years.add('2025');
    years.add('2026');
    years.add('2027');
    contactos.forEach(c => {
      if (c.fecha_registro) years.add(new Date(c.fecha_registro).getFullYear().toString());
    });
    actividades.forEach(a => {
      if (a.fecha) years.add(new Date(a.fecha).getFullYear().toString());
    });
    return Array.from(years).sort();
  }, [contactos, actividades]);

  // Helper date checker
  const isDateInFilter = (dateString?: string) => {
    if (!dateString) return timeFilter === 'ALL';
    if (timeFilter === 'ALL') return true;

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return true;

    const y = date.getFullYear().toString();
    const m = date.getMonth().toString();

    if (timeFilter === 'YEAR') {
      return y === selectedYear;
    }
    if (timeFilter === 'MONTH') {
      const yearMatch = selectedYear === 'ALL' || y === selectedYear;
      const monthMatch = selectedMonth === 'ALL' || m === selectedMonth;
      return yearMatch && monthMatch;
    }
    return true;
  };

  // 1. FILTERED DATASETS
  const filteredContactos = useMemo(() => {
    return contactos.filter(c => isDateInFilter(c.fecha_registro || c.created_at));
  }, [contactos, timeFilter, selectedYear, selectedMonth]);

  const filteredActividades = useMemo(() => {
    return actividades.filter(a => isDateInFilter(a.fecha || a.created_at));
  }, [actividades, timeFilter, selectedYear, selectedMonth]);

  // 2. HIGH-LEVEL KPI METRICS
  const totalContactos = filteredContactos.length;
  const contactosActivos = filteredContactos.filter(c => c.estado === 'PARTICIPANTE' || c.estado === 'CONTACTADO').length;
  const contactosNuevos = filteredContactos.filter(c => c.estado === 'NUEVO').length;
  const pctActivos = totalContactos > 0 ? (contactosActivos / totalContactos) * 100 : 0;

  const totalActividades = filteredActividades.length;
  const metaTotalActividades = Math.max(totalActividades, users.length * 2);
  const pctCumplimientoActividades = metaTotalActividades > 0 ? (totalActividades / metaTotalActividades) * 100 : 0;

  const totalMetaAsistentes = filteredActividades.reduce((sum, a) => sum + (Number(a.meta_asistentes) || 0), 0);
  const totalAsistentesReales = filteredActividades.reduce((sum, a) => sum + (Number(a.asistentes_reales) || 0), 0);
  const pctAsistencia = totalMetaAsistentes > 0 ? (totalAsistentesReales / totalMetaAsistentes) * 100 : 0;

  const metaContactosTotal = users.reduce((sum, u) => sum + (Number(u.meta_contactos_mes) || 50), 0);
  const pctCumplimientoContactos = metaContactosTotal > 0 ? (totalContactos / metaContactosTotal) * 100 : 0;

  // 3. CHART 1: TOP COBERTURA DE PUESTOS Y % CONTACTOS ACTIVOS
  const topPuestosData = useMemo(() => {
    const map = new Map<string, { puesto: PollingStation; total: number; activos: number }>();
    
    // Group contacts by station
    filteredContactos.forEach(c => {
      const pId = c.puesto_id || 'SIN_PUESTO';
      const st = pollingStations.find(p => p.id === pId) || {
        id: pId,
        codigo_puesto: 'PV-DESC',
        nombre_puesto: 'Sin Puesto Asignado',
        direccion: 'N/A'
      };

      const current = map.get(pId) || { puesto: st as PollingStation, total: 0, activos: 0 };
      current.total += 1;
      if (c.estado === 'PARTICIPANTE' || c.estado === 'CONTACTADO') {
        current.activos += 1;
      }
      map.set(pId, current);
    });

    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 7)
      .map(item => ({
        ...item,
        pctActivos: item.total > 0 ? (item.activos / item.total) * 100 : 0
      }));
  }, [filteredContactos, pollingStations]);

  // 4. CHART 2 & 5: TENDENCIA TEMPORAL MES A MES (ACTIVIDADES, ASISTENTES, NUEVOS CONTACTOS, CUMPLIMIENTO)
  const monthlyTrendsData = useMemo(() => {
    return monthsNames.map((monthName, idx) => {
      // Filter by month
      const monthActs = filteredActividades.filter(a => {
        const d = new Date(a.fecha || a.created_at || '');
        return !isNaN(d.getTime()) && d.getMonth() === idx;
      });

      const monthContacts = filteredContactos.filter(c => {
        const d = new Date(c.fecha_registro || c.created_at || '');
        return !isNaN(d.getTime()) && d.getMonth() === idx;
      });

      const actsCount = monthActs.length;
      const metaActs = Math.max(1, users.length);
      const pctActs = Math.min(100, (actsCount / metaActs) * 100);

      const metaAsist = monthActs.reduce((sum, a) => sum + (Number(a.meta_asistentes) || 0), 0);
      const realAsist = monthActs.reduce((sum, a) => sum + (Number(a.asistentes_reales) || 0), 0);
      const pctAsist = metaAsist > 0 ? (realAsist / metaAsist) * 100 : 0;

      const newContactsCount = monthContacts.filter(c => c.estado === 'NUEVO').length;
      const totalMonthContacts = monthContacts.length;
      const monthGoal = Math.max(1, metaContactosTotal / 12);
      const pctContactosGoal = Math.min(150, (totalMonthContacts / monthGoal) * 100);

      return {
        month: monthName.slice(0, 3),
        fullMonth: monthName,
        actividades: actsCount,
        pctCumplimientoAct: pctActs,
        metaAsistentes: metaAsist,
        asistentesReales: realAsist,
        pctAsistencia: pctAsist,
        nuevosContactos: newContactsCount,
        totalContactos: totalMonthContacts,
        pctCumplimientoContactos: pctContactosGoal
      };
    });
  }, [filteredActividades, filteredContactos, users.length, metaContactosTotal]);

  // 5. CHART 4: CONTACTOS ACTIVOS VS NUEVOS CONTACTOS (DONUT / TORTA)
  const contactosStatusBreakdown = useMemo(() => {
    const counts = {
      NUEVO: 0,
      CONTACTADO: 0,
      PARTICIPANTE: 0,
      INACTIVO: 0
    };

    filteredContactos.forEach(c => {
      const st = c.estado || 'NUEVO';
      if (counts[st] !== undefined) counts[st] += 1;
      else counts.NUEVO += 1;
    });

    const total = filteredContactos.length || 1;
    return [
      { label: 'Participantes (Comprometidos)', count: counts.PARTICIPANTE, color: '#10b981', pct: (counts.PARTICIPANTE / total) * 100 },
      { label: 'Contactados (En Seguimiento)', count: counts.CONTACTADO, color: '#6366f1', pct: (counts.CONTACTADO / total) * 100 },
      { label: 'Nuevos (Sin Contactar)', count: counts.NUEVO, color: '#f59e0b', pct: (counts.NUEVO / total) * 100 },
      { label: 'Inactivos / Pausados', count: counts.INACTIVO, color: '#f43f5e', pct: (counts.INACTIVO / total) * 100 }
    ];
  }, [filteredContactos]);

  // SVG Line Path Generator
  const generateSplinePath = (data: number[], width: number, height: number, maxVal: number) => {
    if (data.length === 0) return '';
    const stepX = width / (data.length - 1 || 1);
    const safeMax = maxVal > 0 ? maxVal : 1;

    const points = data.map((val, idx) => ({
      x: idx * stepX,
      y: height - (val / safeMax) * (height - 20) - 10
    }));

    return points.reduce((acc, point, i, arr) => {
      if (i === 0) return `M ${point.x},${point.y}`;
      const prev = arr[i - 1];
      const cx1 = prev.x + (point.x - prev.x) / 2;
      const cy1 = prev.y;
      const cx2 = prev.x + (point.x - prev.x) / 2;
      const cy2 = point.y;
      return `${acc} C ${cx1},${cy1} ${cx2},${cy2} ${point.x},${point.y}`;
    }, '');
  };

  const generateAreaPath = (data: number[], width: number, height: number, maxVal: number) => {
    const linePath = generateSplinePath(data, width, height, maxVal);
    if (!linePath) return '';
    const lastX = width;
    return `${linePath} L ${lastX},${height} L 0,${height} Z`;
  };

  // Color Palettes
  const neonPalette = ['#6366f1', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6'];

  return (
    <div className="space-y-6">

      {/* ─── BARRA DE FILTROS TEMPORALES DINÁMICOS ─── */}
      <div className="bg-[#111114] border border-neutral-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-500 to-rose-500 p-2.5 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Filter className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Filtros Temporales Dinámicos
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Actualización en Vivo
                </span>
              </h3>
              <p className="text-xs text-neutral-400">
                Selecciona el rango de fechas para recalcular y transformar todas las gráficas interactivas
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Presets */}
            <div className="flex bg-neutral-900/90 p-1 rounded-2xl border border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setTimeFilter('ALL');
                  setSelectedMonth('ALL');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  timeFilter === 'ALL'
                    ? 'bg-gradient-to-r from-indigo-600 to-rose-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Histórico Total
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimeFilter('YEAR');
                  setSelectedYear('2026');
                  setSelectedMonth('ALL');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  timeFilter === 'YEAR'
                    ? 'bg-gradient-to-r from-indigo-600 to-rose-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Por Año
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimeFilter('MONTH');
                  if (selectedMonth === 'ALL') setSelectedMonth('7'); // Default Agosto
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                  timeFilter === 'MONTH'
                    ? 'bg-gradient-to-r from-indigo-600 to-rose-600 text-white shadow-md'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                Por Mes
              </button>
            </div>

            {/* Year Selector */}
            {timeFilter !== 'ALL' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>Año {year}</option>
                ))}
              </select>
            )}

            {/* Month Selector */}
            {timeFilter === 'MONTH' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-neutral-900 border border-neutral-700 text-amber-400 px-3.5 py-2 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
              >
                <option value="ALL">Todos los Meses</option>
                {monthsNames.map((m, idx) => (
                  <option key={idx} value={idx.toString()}>Mes: {m}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Current Active Filter Indicator */}
        <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-300">Periodo Visualizado:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20">
              {timeFilter === 'ALL' && '🌐 Histórico Completo desde el Inicio'}
              {timeFilter === 'YEAR' && `📅 Todo el Año ${selectedYear}`}
              {timeFilter === 'MONTH' && `🗓️ ${selectedMonth === 'ALL' ? 'Todos los Meses' : monthsNames[Number(selectedMonth)]} de ${selectedYear}`}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-[11px] text-neutral-500">
            <span>Contactos filtrados: <strong className="text-white">{filteredContactos.length}</strong></span>
            <span>Actividades filtradas: <strong className="text-white">{filteredActividades.length}</strong></span>
          </div>
        </div>
      </div>

      {/* ─── 4 TARJETAS KPI RESUMEN SUPERIORES CON SPARKLINES ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Contactos Activos vs Total */}
        <div className="bg-[#111114] border border-neutral-800 hover:border-indigo-500/40 rounded-3xl p-5 transition shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Contactos Totales</span>
            <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20 text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-white">{totalContactos.toLocaleString()}</h4>
            <span className="text-xs text-emerald-400 font-bold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> {pctActivos.toFixed(0)}% Activos
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            {contactosActivos} participantes y contactados
          </p>
          {/* Micro Progress Bar */}
          <div className="w-full bg-neutral-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pctActivos)}%` }} />
          </div>
        </div>

        {/* KPI 2: Actividades Realizadas & % Cumplimiento */}
        <div className="bg-[#111114] border border-neutral-800 hover:border-rose-500/40 rounded-3xl p-5 transition shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Actividades Territoriales</span>
            <div className="bg-rose-500/10 p-2 rounded-xl border border-rose-500/20 text-rose-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-white">{totalActividades}</h4>
            <span className="text-xs text-indigo-400 font-bold flex items-center">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> {pctCumplimientoActividades.toFixed(0)}% Meta
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Meta programada: {metaTotalActividades} actividades
          </p>
          <div className="w-full bg-neutral-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-gradient-to-r from-rose-500 to-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pctCumplimientoActividades)}%` }} />
          </div>
        </div>

        {/* KPI 3: Asistentes Reales vs Meta */}
        <div className="bg-[#111114] border border-neutral-800 hover:border-emerald-500/40 rounded-3xl p-5 transition shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Asistencia a Eventos</span>
            <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-white">{totalAsistentesReales.toLocaleString()}</h4>
            <span className={`text-xs font-bold flex items-center ${pctAsistencia >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
              <ArrowUpRight className="w-3.5 h-3.5" /> {pctAsistencia.toFixed(1)}%
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Meta estimada: {totalMetaAsistentes.toLocaleString()} asistentes
          </p>
          <div className="w-full bg-neutral-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, pctAsistencia)}%` }} />
          </div>
        </div>

        {/* KPI 4: Nuevos Contactos Captados */}
        <div className="bg-[#111114] border border-neutral-800 hover:border-amber-500/40 rounded-3xl p-5 transition shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Nuevos Contactos</span>
            <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h4 className="text-3xl font-black text-white">{contactosNuevos.toLocaleString()}</h4>
            <span className="text-xs text-amber-400 font-bold">
              {totalContactos > 0 ? ((contactosNuevos / totalContactos) * 100).toFixed(0) : 0}% del total
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1">
            Pendientes por seguimiento
          </p>
          <div className="w-full bg-neutral-800 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, totalContactos > 0 ? (contactosNuevos / totalContactos) * 100 : 0)}%` }} />
          </div>
        </div>

      </div>

      {/* ─── FILA 1: GRÁFICAS PRINCIPALES ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* GRÁFICA 1: TOP COBERTURA DE PUESTOS Y % CONTACTOS ACTIVOS */}
        <div className="bg-[#111114] border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500/10 p-2.5 rounded-2xl border border-indigo-500/20">
                  <MapPin className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Top Cobertura de Puestos & % Contactos Activos
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Puestos con mayor densidad de electores registrados y tasa de compromiso
                  </p>
                </div>
              </div>

              {/* View Switch */}
              <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setChartTypePuestos('bar')}
                  className={`p-1.5 rounded-lg transition ${chartTypePuestos === 'bar' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                  title="Vista de Barras"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setChartTypePuestos('donut')}
                  className={`p-1.5 rounded-lg transition ${chartTypePuestos === 'donut' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                  title="Vista de Torta/Dona"
                >
                  <PieIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chart Body */}
            {topPuestosData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-neutral-500 text-xs">
                <MapPin className="w-8 h-8 mb-2 opacity-40" />
                <span>No hay contactos registrados en el periodo seleccionado</span>
              </div>
            ) : chartTypePuestos === 'bar' ? (
              <div className="space-y-3.5 pt-2">
                {topPuestosData.map((item, idx) => {
                  const maxTotal = topPuestosData[0]?.total || 1;
                  const barWidthPct = (item.total / maxTotal) * 100;
                  return (
                    <div
                      key={item.puesto.id}
                      className="group p-2.5 rounded-2xl hover:bg-neutral-800/40 transition border border-transparent hover:border-neutral-800"
                      onMouseEnter={() => setHoveredDataPoint({
                        title: item.puesto.nombre_puesto,
                        value: `${item.total} contactos`,
                        extra: `${item.activos} activos (${item.pctActivos.toFixed(1)}%)`
                      })}
                      onMouseLeave={() => setHoveredDataPoint(null)}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="w-5 h-5 rounded-lg bg-indigo-500/20 text-indigo-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-neutral-200 truncate">{item.puesto.nombre_puesto}</span>
                          <span className="text-[10px] text-neutral-500 font-mono shrink-0">[{item.puesto.codigo_puesto}]</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono font-bold text-indigo-300">{item.total} cont.</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                            {item.pctActivos.toFixed(0)}% Activos
                          </span>
                        </div>
                      </div>

                      {/* Double Glowing Bar: Total vs Activos */}
                      <div className="w-full bg-neutral-900 rounded-full h-3 overflow-hidden flex relative">
                        <div
                          className="bg-indigo-600/40 h-full rounded-full transition-all duration-500"
                          style={{ width: `${barWidthPct}%` }}
                        >
                          <div
                            className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full shadow-lg shadow-emerald-500/30 transition-all duration-700"
                            style={{ width: `${item.pctActivos}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Donut View for Puestos */
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4">
                <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {(() => {
                      let cumulativePct = 0;
                      const totalTop = topPuestosData.reduce((s, p) => s + p.total, 0) || 1;
                      return topPuestosData.map((item, i) => {
                        const pct = (item.total / totalTop) * 100;
                        const strokeDash = `${pct} ${100 - pct}`;
                        const strokeOffset = 100 - cumulativePct;
                        cumulativePct += pct;
                        return (
                          <circle
                            key={item.puesto.id}
                            cx="50"
                            cy="50"
                            r="38"
                            fill="none"
                            stroke={neonPalette[i % neonPalette.length]}
                            strokeWidth="15"
                            strokeDasharray={strokeDash}
                            strokeDashoffset={strokeOffset}
                            className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-xl font-black text-white">{totalContactos}</span>
                    <span className="text-[10px] text-neutral-400 font-semibold uppercase">Total Puestos</span>
                  </div>
                </div>

                <div className="space-y-1.5 flex-1 text-xs">
                  {topPuestosData.map((item, i) => (
                    <div key={item.puesto.id} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: neonPalette[i % neonPalette.length] }} />
                        <span className="text-neutral-300 truncate text-[11px]">{item.puesto.nombre_puesto}</span>
                      </div>
                      <span className="font-mono font-bold text-white shrink-0 text-[11px]">{item.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
            <span>Leyenda: Barra completa = Total contactos • Franja verde = % Activos</span>
            <span className="text-indigo-400 font-bold">{topPuestosData.length} puestos destacados</span>
          </div>
        </div>

        {/* GRÁFICA 2: ACTIVIDADES REALIZADAS VS % CUMPLIMIENTO */}
        <div className="bg-[#111114] border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-rose-500/10 p-2.5 rounded-2xl border border-rose-500/20">
                  <TrendingUp className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Actividades Realizadas vs % Cumplimiento
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Evolución temporal de despliegue territorial frente a las metas programadas
                  </p>
                </div>
              </div>

              {/* View Switch */}
              <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setChartTypeActividades('line')}
                  className={`p-1.5 rounded-lg transition ${chartTypeActividades === 'line' ? 'bg-rose-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                  title="Vista de Curvas"
                >
                  <LineIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setChartTypeActividades('bar')}
                  className={`p-1.5 rounded-lg transition ${chartTypeActividades === 'bar' ? 'bg-rose-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                  title="Vista de Barras"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Interactive Chart Visual */}
            <div className="h-56 relative w-full pt-4">
              {chartTypeActividades === 'line' ? (
                /* Dynamic SVG Spline Curves */
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  <line x1="0" y1="20" x2="500" y2="20" stroke="#262626" strokeDasharray="3 3" />
                  <line x1="0" y1="70" x2="500" y2="70" stroke="#262626" strokeDasharray="3 3" />
                  <line x1="0" y1="120" x2="500" y2="120" stroke="#262626" strokeDasharray="3 3" />

                  {/* Area fill for Cumplimiento */}
                  <path
                    d={generateAreaPath(monthlyTrendsData.map(m => m.pctCumplimientoAct), 500, 160, 100)}
                    fill="url(#roseGradient)"
                  />

                  {/* Spline Curve: Actividades Realizadas (Indigo) */}
                  <path
                    d={generateSplinePath(monthlyTrendsData.map(m => m.actividades), 500, 160, Math.max(10, ...monthlyTrendsData.map(m => m.actividades)))}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Spline Curve: % Cumplimiento (Rose) */}
                  <path
                    d={generateSplinePath(monthlyTrendsData.map(m => m.pctCumplimientoAct), 500, 160, 100)}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Data Points */}
                  {monthlyTrendsData.map((d, i) => {
                    const stepX = 500 / (monthlyTrendsData.length - 1);
                    const cx = i * stepX;
                    const maxActs = Math.max(10, ...monthlyTrendsData.map(m => m.actividades));
                    const cy1 = 160 - (d.actividades / maxActs) * 140 - 10;
                    const cy2 = 160 - (d.pctCumplimientoAct / 100) * 140 - 10;

                    return (
                      <g key={i} className="cursor-pointer group">
                        <circle
                          cx={cx}
                          cy={cy1}
                          r="4"
                          fill="#6366f1"
                          className="hover:r-6 transition-all"
                          onMouseEnter={() => setHoveredDataPoint({
                            title: `${d.fullMonth} - Actividades`,
                            value: `${d.actividades} actividades realizadas`,
                            extra: `Cumplimiento: ${d.pctCumplimientoAct.toFixed(1)}%`
                          })}
                          onMouseLeave={() => setHoveredDataPoint(null)}
                        />
                        <circle
                          cx={cx}
                          cy={cy2}
                          r="4"
                          fill="#f43f5e"
                          className="hover:r-6 transition-all"
                          onMouseEnter={() => setHoveredDataPoint({
                            title: `${d.fullMonth} - % Cumplimiento`,
                            value: `${d.pctCumplimientoAct.toFixed(1)}% de meta alcanzada`,
                            extra: `${d.actividades} actividades`
                          })}
                          onMouseLeave={() => setHoveredDataPoint(null)}
                        />
                      </g>
                    );
                  })}
                </svg>
              ) : (
                /* Bar View */
                <div className="h-full flex items-end justify-between gap-1">
                  {monthlyTrendsData.map((d, i) => {
                    const maxVal = Math.max(10, ...monthlyTrendsData.map(m => m.actividades));
                    const barHeightPct = (d.actividades / maxVal) * 100;
                    return (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                        onMouseEnter={() => setHoveredDataPoint({
                          title: `${d.fullMonth}`,
                          value: `${d.actividades} actividades`,
                          extra: `${d.pctCumplimientoAct.toFixed(0)}% cumplimiento`
                        })}
                        onMouseLeave={() => setHoveredDataPoint(null)}
                      >
                        <div className="w-full bg-neutral-900 rounded-t-lg h-36 flex items-end p-0.5">
                          <div
                            className="w-full bg-gradient-to-t from-rose-600 to-indigo-500 rounded-t-md transition-all duration-500 group-hover:brightness-125"
                            style={{ height: `${Math.max(8, barHeightPct)}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-neutral-400 group-hover:text-white">{d.month}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* X-Axis Month Labels */}
            {chartTypeActividades === 'line' && (
              <div className="flex justify-between text-[9px] font-mono text-neutral-500 px-1 mt-2">
                {monthlyTrendsData.map((m, i) => (
                  <span key={i}>{m.month}</span>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" /> Actividades
              </span>
              <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> % Cumplimiento
              </span>
            </div>
            <span className="text-neutral-400 font-mono font-bold">{totalActividades} acumuladas</span>
          </div>
        </div>

      </div>

      {/* ─── FILA 2: GRÁFICAS ASISTENCIA, CONTACTOS ACTIVOS VS NUEVOS & METAS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* GRÁFICA 3: META DE ASISTENTES VS ASISTENTES REALES */}
        <div className="bg-[#111114] border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-500/10 p-2.5 rounded-2xl border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Meta vs Asistentes Reales
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Aforo real comparado con la expectativa proyectada
                  </p>
                </div>
              </div>

              {/* View Switch */}
              <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setChartTypeAsistentes('bar')}
                  className={`p-1.5 rounded-lg transition ${chartTypeAsistentes === 'bar' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                  title="Barras Comparativas"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setChartTypeAsistentes('area')}
                  className={`p-1.5 rounded-lg transition ${chartTypeAsistentes === 'area' ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                  title="Área / Curvas"
                >
                  <LineIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chart Body */}
            {chartTypeAsistentes === 'bar' ? (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Asistentes Reales</span>
                    <span className="text-2xl font-black text-emerald-400">{totalAsistentesReales.toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-neutral-400 block">Meta Total</span>
                    <span className="text-lg font-bold text-neutral-400">{totalMetaAsistentes.toLocaleString()}</span>
                  </div>
                </div>

                {/* Monthly attendance breakdown */}
                <div className="space-y-2.5">
                  {monthlyTrendsData.filter(m => m.metaAsistentes > 0 || m.asistentesReales > 0).slice(0, 5).map((m, i) => {
                    const pct = m.metaAsistentes > 0 ? (m.asistentesReales / m.metaAsistentes) * 100 : 0;
                    return (
                      <div key={i} className="text-xs space-y-1">
                        <div className="flex justify-between font-semibold">
                          <span className="text-neutral-300">{m.fullMonth}</span>
                          <span className="text-emerald-400 font-mono">{m.asistentesReales} / {m.metaAsistentes} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden flex">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {monthlyTrendsData.every(m => m.metaAsistentes === 0 && m.asistentesReales === 0) && (
                    <div className="text-center py-6 text-neutral-500 text-xs">
                      No hay registros de aforo en este periodo
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Attendance Area Curve */
              <div className="h-48 relative w-full pt-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={generateAreaPath(monthlyTrendsData.map(m => m.asistentesReales), 300, 120, Math.max(50, ...monthlyTrendsData.map(m => m.asistentesReales)))}
                    fill="url(#emeraldGrad)"
                  />
                  <path
                    d={generateSplinePath(monthlyTrendsData.map(m => m.asistentesReales), 300, 120, Math.max(50, ...monthlyTrendsData.map(m => m.asistentesReales)))}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                  />
                </svg>
                <div className="flex justify-between text-[9px] font-mono text-neutral-500 mt-2">
                  {monthlyTrendsData.map((m, i) => <span key={i}>{m.month}</span>)}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
            <span>Tasa Global de Aforo:</span>
            <span className="font-bold text-emerald-400 font-mono">{pctAsistencia.toFixed(1)}%</span>
          </div>
        </div>

        {/* GRÁFICA 4: CONTACTOS ACTIVOS VS NUEVOS CONTACTOS (DONUT / TORTA) */}
        <div className="bg-[#111114] border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-500/10 p-2.5 rounded-2xl border border-amber-500/20">
                <PieIcon className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">
                  Contactos Activos vs Nuevos
                </h4>
                <p className="text-xs text-neutral-400">
                  Distribución según el grado de fidelización y seguimiento
                </p>
              </div>
            </div>

            {/* Donut Graphic */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {(() => {
                    let cumulativePct = 0;
                    return contactosStatusBreakdown.map((item, i) => {
                      const strokeDash = `${item.pct} ${100 - item.pct}`;
                      const strokeOffset = 100 - cumulativePct;
                      cumulativePct += item.pct;
                      return (
                        <circle
                          key={i}
                          cx="50"
                          cy="50"
                          r="38"
                          fill="none"
                          stroke={item.color}
                          strokeWidth="14"
                          strokeDasharray={strokeDash}
                          strokeDashoffset={strokeOffset}
                          className="transition-all duration-500 hover:opacity-80 cursor-pointer"
                        />
                      );
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-2xl font-black text-white">{totalContactos}</span>
                  <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">Contactos</span>
                </div>
              </div>

              {/* Legends with counts & percentages */}
              <div className="w-full space-y-2 mt-4">
                {contactosStatusBreakdown.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-neutral-900/60 p-2 rounded-xl border border-neutral-800/60">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-neutral-300 font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-white">{item.count}</span>
                      <span className="text-neutral-500 text-[10px]">({item.pct.toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
            <span>Fidelización:</span>
            <span className="font-bold text-emerald-400">{pctActivos.toFixed(0)}% comprometidos</span>
          </div>
        </div>

        {/* GRÁFICA 5: NUEVOS CONTACTOS VS % CUMPLIMIENTO DE METAS */}
        <div className="bg-[#111114] border border-neutral-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500/10 p-2.5 rounded-2xl border border-indigo-500/20">
                  <Target className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Nuevos Contactos vs % Metas
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Ritmo de captación mensual vs porcentaje de metas fijadas
                  </p>
                </div>
              </div>

              {/* View Switch */}
              <div className="flex bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                <button
                  type="button"
                  onClick={() => setChartTypeCumplimiento('line')}
                  className={`p-1.5 rounded-lg transition ${chartTypeCumplimiento === 'line' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                  title="Vista de Curvas"
                >
                  <LineIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setChartTypeCumplimiento('bar')}
                  className={`p-1.5 rounded-lg transition ${chartTypeCumplimiento === 'bar' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white'}`}
                  title="Vista de Barras"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Chart Body */}
            <div className="h-48 relative w-full pt-4">
              {chartTypeCumplimiento === 'line' ? (
                <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={generateAreaPath(monthlyTrendsData.map(m => m.pctCumplimientoContactos), 300, 120, 120)}
                    fill="url(#cyanGrad)"
                  />
                  <path
                    d={generateSplinePath(monthlyTrendsData.map(m => m.pctCumplimientoContactos), 300, 120, 120)}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="3"
                  />
                  <path
                    d={generateSplinePath(monthlyTrendsData.map(m => m.nuevosContactos), 300, 120, Math.max(20, ...monthlyTrendsData.map(m => m.nuevosContactos)))}
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                  />
                </svg>
              ) : (
                /* Bar Breakdown */
                <div className="h-full flex items-end justify-between gap-1 pt-2">
                  {monthlyTrendsData.map((d, i) => {
                    const maxVal = Math.max(20, ...monthlyTrendsData.map(m => m.nuevosContactos));
                    const barHeight = (d.nuevosContactos / maxVal) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                        <div className="w-full bg-neutral-900 rounded-t-md h-32 flex items-end p-0.5">
                          <div
                            className="w-full bg-gradient-to-t from-cyan-600 to-indigo-500 rounded-t-sm transition-all duration-500 group-hover:brightness-125"
                            style={{ height: `${Math.max(8, barHeight)}%` }}
                          />
                        </div>
                        <span className="text-[8px] font-mono text-neutral-400">{d.month}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* X-Axis labels */}
            {chartTypeCumplimiento === 'line' && (
              <div className="flex justify-between text-[9px] font-mono text-neutral-500 mt-2">
                {monthlyTrendsData.map((m, i) => <span key={i}>{m.month}</span>)}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-cyan-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> % Meta
              </span>
              <span className="flex items-center gap-1 text-pink-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-pink-500" /> Nuevos
              </span>
            </div>
            <span className="text-neutral-300 font-mono font-bold">{contactosNuevos} nuevos</span>
          </div>
        </div>

      </div>

      {/* ─── INSIGHTS CLAVE & RESUMEN ANALÍTICO INFERIOR ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#111114] border border-neutral-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-start gap-3.5">
          <div className="bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/20 text-indigo-400 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider">Eficiencia de Captación</h5>
            <p className="text-xs text-neutral-400 mt-1">
              El {pctActivos.toFixed(0)}% de los contactos registrados en este periodo ya han sido contactados o son participantes activos en el territorio.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/20 text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider">Cumplimiento de Aforo</h5>
            <p className="text-xs text-neutral-400 mt-1">
              Se han movilizado <strong>{totalAsistentesReales.toLocaleString()} personas</strong> en {totalActividades} eventos comunitarios con una efectividad de {pctAsistencia.toFixed(1)}%.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3.5">
          <div className="bg-rose-500/10 p-3 rounded-2xl border border-rose-500/20 text-rose-400 shrink-0">
            <MapPin className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider">Puestos de Votación Activos</h5>
            <p className="text-xs text-neutral-400 mt-1">
              {topPuestosData.length > 0
                ? `El recinto con mayor afluencia es ${topPuestosData[0]?.puesto.nombre_puesto} con ${topPuestosData[0]?.total} contactos.`
                : 'Aún no hay puestos con contactos asignados en el periodo.'}
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};
