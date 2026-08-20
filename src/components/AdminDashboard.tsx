import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { UserAccount, Contacto, Actividad, PollingStation } from '../types';
import { LOCALIDADES_CARTAGENA } from '../data/cartagenaData';
import { AddActivityModal } from './AddActivityModal';
import { LeaderDetailModal } from './LeaderDetailModal';
import { KPIGraphsTab } from './KPIGraphsTab';
import { PollingStationCoverageDashboard } from './PollingStationCoverageDashboard';
import { smartSearch } from '../utils/helpers';
import * as XLSX from 'xlsx-js-style';
import {
  Users,
  GitFork,
  Vote,
  TrendingUp,
  Activity,
  Calendar,
  FileSpreadsheet,
  MapPin,
  Award,
  PieChart,
  BarChart3,
  ChevronDown,
  Plus,
  Search,
  Filter,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ExternalLink,
  Target,
  DollarSign,
  UserCheck,
  Percent,
  Layers,
  RotateCcw
} from 'lucide-react';

type AdminTab = 'general' | 'graficas_kpi' | 'seguimiento_mensual' | 'seguimiento_actividades' | 'cobertura_puestos';
type ChartView = 'edades' | 'genero' | 'puestos' | 'barrios';
type TopLideresView = 'contactos' | 'sublideres' | 'actividades' | 'asistencia';

export const AdminDashboard: React.FC = () => {
  const { currentUser, users, contactos, actividades, pollingStations } = useApp();

  // Navigation and Views
  const [activeTab, setActiveTab] = useState<AdminTab>('general');
  const [chartView, setChartView] = useState<ChartView>('edades');
  const [topLideresView, setTopLideresView] = useState<TopLideresView>('contactos');

  // Modals state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedActivityForEdit, setSelectedActivityForEdit] = useState<Actividad | null>(null);
  const [selectedLeaderForModal, setSelectedLeaderForModal] = useState<UserAccount | null>(null);

  // Global Dashboard Filters
  const [filterLiderId, setFilterLiderId] = useState<string>('ALL');
  const [filterLocalidad, setFilterLocalidad] = useState<string>('ALL');
  const [filterStationId, setFilterStationId] = useState<string>('ALL');
  const [filterMonth, setFilterMonth] = useState<string>('ALL');

  // Table specific search / filters
  const [tableSearch, setTableSearch] = useState<string>('');
  const [semaforoFilter, setSemaforoFilter] = useState<string>('ALL');

  // 1. Role Scope Base Dataset
  const baseUsers = useMemo(() => {
    if (currentUser?.rol === 'ADMIN') return users.filter(u => u.rol !== 'ADMIN');
    if (currentUser?.rol === 'LIDER_PRINCIPAL') {
      return users.filter(u => u.lider_principal_id === currentUser.id || u.id === currentUser.id);
    }
    if (currentUser?.rol === 'LIDER_PRINCIPAL_INVITADO') {
      return users.filter(u => u.lider_principal_id === currentUser.id || u.id === currentUser.id);
    }
    return users.filter(u => u.id === currentUser?.id);
  }, [users, currentUser]);

  const baseUserIds = useMemo(() => new Set(baseUsers.map(u => u.id)), [baseUsers]);

  const baseContactos = useMemo(() => {
    if (currentUser?.rol === 'ADMIN') return contactos;
    return contactos.filter(c => baseUserIds.has(c.lider_id));
  }, [contactos, baseUserIds, currentUser]);

  const baseActividades = useMemo(() => {
    if (currentUser?.rol === 'ADMIN') return actividades;
    return actividades.filter(a => baseUserIds.has(a.lider_id));
  }, [actividades, baseUserIds, currentUser]);

  // 2. Filtered Dataset (Applying Dashboard Controls)
  const filteredContactos = useMemo(() => {
    return baseContactos.filter(c => {
      if (filterLiderId !== 'ALL' && c.lider_id !== filterLiderId) return false;
      if (filterLocalidad !== 'ALL' && c.sector_comuna !== filterLocalidad) return false;
      if (filterStationId !== 'ALL' && c.puesto_id !== filterStationId) return false;
      if (filterMonth !== 'ALL') {
        const monthNum = parseInt(filterMonth, 10);
        if (c.fecha_registro && new Date(c.fecha_registro).getMonth() !== monthNum) return false;
      }
      return true;
    });
  }, [baseContactos, filterLiderId, filterLocalidad, filterStationId, filterMonth]);

  const filteredActividades = useMemo(() => {
    return baseActividades.filter(a => {
      if (filterLiderId !== 'ALL' && a.lider_id !== filterLiderId) return false;
      if (filterStationId !== 'ALL' && a.puesto_id !== filterStationId) return false;
      if (filterMonth !== 'ALL') {
        const monthNum = parseInt(filterMonth, 10);
        if (a.fecha && new Date(a.fecha).getMonth() !== monthNum) return false;
      }
      return true;
    });
  }, [baseActividades, filterLiderId, filterStationId, filterMonth]);

  const filteredUsers = useMemo(() => {
    if (filterLiderId !== 'ALL') {
      return baseUsers.filter(u => u.id === filterLiderId);
    }
    return baseUsers;
  }, [baseUsers, filterLiderId]);

  // 3. High-level KPI Stats
  const kpis = useMemo(() => {
    const totalLideres = filteredUsers.filter(u => u.rol === 'LIDER' || u.rol === 'LIDER_PRINCIPAL' || u.rol === 'LIDER_PRINCIPAL_INVITADO').length;
    const totalSublideres = filteredUsers.filter(u => u.rol === 'SUBLIDER').length;
    const totalContactos = filteredContactos.length;
    const contactosVerificados = filteredContactos.filter(c => c.consentimiento_datos).length;
    const porcentajeHabeas = totalContactos > 0 ? (contactosVerificados / totalContactos) * 100 : 100;

    const totalActividades = filteredActividades.length;
    const totalAsistentes = filteredActividades.reduce((sum, a) => sum + (a.asistentes_reales || 0), 0);
    const totalNuevosContactosActividades = filteredActividades.reduce((sum, a) => sum + (a.nuevos_contactos_generados || 0), 0);

    const totalPresupuesto = filteredActividades.reduce((sum, a) => sum + (a.costo_presupuestado || 0), 0);
    const totalCostoReal = filteredActividades.reduce((sum, a) => sum + (a.costo_real || 0), 0);

    const puestosCubiertosIds = new Set(filteredContactos.filter(c => c.puesto_id).map(c => c.puesto_id));
    const totalPuestosRegistrados = pollingStations.length || 1;
    const coberturaPuestosPercent = (puestosCubiertosIds.size / totalPuestosRegistrados) * 100;

    const costoPorContacto = totalNuevosContactosActividades > 0
      ? Math.round(totalCostoReal / totalNuevosContactosActividades)
      : 0;

    return {
      totalLideres,
      totalSublideres,
      totalContactos,
      contactosVerificados,
      porcentajeHabeas,
      totalActividades,
      totalAsistentes,
      totalNuevosContactosActividades,
      totalPresupuesto,
      totalCostoReal,
      puestosCubiertosCount: puestosCubiertosIds.size,
      coberturaPuestosPercent,
      costoPorContacto
    };
  }, [filteredUsers, filteredContactos, filteredActividades, pollingStations]);

  // 4. Demographic Data
  const edadesData = useMemo(() => {
    const counts = { '18-25': 0, '26-40': 0, '41-60': 0, '60+': 0, 'No especifica': 0 };
    filteredContactos.forEach(c => {
      if (!c.edad) counts['No especifica']++;
      else if (c.edad >= 18 && c.edad <= 25) counts['18-25']++;
      else if (c.edad >= 26 && c.edad <= 40) counts['26-40']++;
      else if (c.edad >= 41 && c.edad <= 60) counts['41-60']++;
      else counts['60+']++;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [filteredContactos]);

  const generoData = useMemo(() => {
    const counts = { 'Femenino': 0, 'Masculino': 0, 'No Especifica': 0 };
    filteredContactos.forEach(c => {
      const g = (c.genero || '').toUpperCase();
      if (g.startsWith('F') || g === 'FEMENINO' || g === 'MUJER') counts['Femenino']++;
      else if (g.startsWith('M') || g === 'MASCULINO' || g === 'HOMBRE') counts['Masculino']++;
      else counts['No Especifica']++;
    });
    const total = filteredContactos.length || 1;
    return Object.entries(counts).map(([label, value]) => ({
      label,
      value,
      percent: ((value / total) * 100).toFixed(1)
    }));
  }, [filteredContactos]);

  const puestosData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredContactos.forEach(c => {
      if (c.puesto_id) {
        counts[c.puesto_id] = (counts[c.puesto_id] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([id, count]) => {
        const puesto = pollingStations.find(p => p.id === id);
        return { label: puesto?.nombre_puesto || 'Desconocido', value: count, id };
      })
      .sort((a, b) => b.value - a.value).slice(0, 6);
  }, [filteredContactos, pollingStations]);

  const barriosData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredContactos.forEach(c => {
      if (c.barrio) {
        counts[c.barrio] = (counts[c.barrio] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value).slice(0, 6);
  }, [filteredContactos]);

  // 5. Ranking Leader Calculations
  const topLideres = useMemo(() => {
    const lideresMap = new Map<string, {
      user: UserAccount;
      nombre: string;
      contactos: number;
      sub: number;
      act: number;
      asis: number;
    }>();

    filteredUsers.forEach(u => {
      lideresMap.set(u.id, {
        user: u,
        nombre: u.nombre_completo,
        contactos: 0,
        sub: 0,
        act: 0,
        asis: 0
      });
    });

    baseUsers.forEach(u => {
      if (u.rol === 'SUBLIDER' && u.lider_principal_id) {
        const parent = lideresMap.get(u.lider_principal_id);
        if (parent) parent.sub += 1;
      }
    });

    filteredContactos.forEach(c => {
      const l = lideresMap.get(c.lider_id);
      if (l) l.contactos += 1;
    });

    filteredActividades.forEach(a => {
      const l = lideresMap.get(a.lider_id);
      if (l) {
        l.act += 1;
        l.asis += a.asistentes_reales || 0;
      }
    });

    const arr = Array.from(lideresMap.values());
    return arr.sort((a, b) => {
      if (topLideresView === 'contactos') return b.contactos - a.contactos;
      if (topLideresView === 'sublideres') return b.sub - a.sub;
      if (topLideresView === 'actividades') return b.act - a.act;
      return b.asis - a.asis;
    }).slice(0, 10);
  }, [filteredUsers, baseUsers, filteredContactos, filteredActividades, topLideresView]);

  // 6. Seguimiento Mensual Table Data (Template 1)
  const seguimientoMensualRows = useMemo(() => {
    const rows: any[] = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonthStr = currentDate.toLocaleString('es-ES', { month: 'long' }).toUpperCase();

    filteredUsers.forEach(u => {
      if (u.rol === 'SUBLIDER') return; // Only leaders and principal leaders

      const myContacts = filteredContactos.filter(c => c.lider_id === u.id);
      const myActs = filteredActividades.filter(a => a.lider_id === u.id);

      const metaC = u.meta_contactos_mes || 50;
      const metaA = 4; // Default meta: 4 community activities / month

      const nuevosC = myContacts.filter(c => {
        if (!c.fecha_registro) return true;
        const d = new Date(c.fecha_registro);
        return filterMonth === 'ALL' ? true : d.getMonth() === parseInt(filterMonth, 10);
      }).length;

      const activosC = myContacts.filter(c => c.estado !== 'INACTIVO').length;
      const actRealizadas = myActs.length;
      const asistentes = myActs.reduce((acc, a) => acc + (a.asistentes_reales || 0), 0);

      const cumpC = metaC > 0 ? (nuevosC / metaC) * 100 : 0;
      const cumpA = metaA > 0 ? (actRealizadas / metaA) * 100 : 0;

      let semaforo = 'Rojo';
      if (cumpC >= 100 && cumpA >= 100) semaforo = 'Verde';
      else if (cumpC >= 50 || cumpA >= 50) semaforo = 'Amarillo';

      if (semaforoFilter !== 'ALL' && semaforo !== semaforoFilter) return;

      if (tableSearch) {
        const match = smartSearch([
          u.nombre_completo,
          u.cedula,
          u.telefono,
          u.barrio_residencia,
          u.comuna_localidad,
          u.rol,
          u.id
        ], tableSearch);
        if (!match) return;
      }

      rows.push({
        user: u,
        id: u.id,
        anno: currentYear,
        mes: currentMonthStr,
        nombre: u.nombre_completo,
        metaC,
        nuevosC,
        activosC,
        metaA,
        actRealizadas,
        asistentes,
        cumpC,
        cumpA,
        semaforo,
        comentarios: u.observaciones || 'En seguimiento territorial'
      });
    });

    return rows;
  }, [filteredUsers, filteredContactos, filteredActividades, filterMonth, semaforoFilter, tableSearch]);

  // 7. Seguimiento Actividades Table Data (Template 2)
  const actividadesRows = useMemo(() => {
    return filteredActividades.filter(act => {
      if (tableSearch) {
        const leader = users.find(u => u.id === act.lider_id);
        const match = smartSearch([
          act.id,
          act.lider_id,
          leader?.nombre_completo,
          act.barrio,
          act.tipo_actividad,
          act.puesto_id,
          act.observaciones
        ], tableSearch);
        if (!match) return false;
      }
      return true;
    });
  }, [filteredActividades, tableSearch, users]);

  // 8. Cobertura Puestos Table Data
  const coberturaPuestosRows = useMemo(() => {
    return pollingStations.map(p => {
      const pContacts = filteredContactos.filter(c => c.puesto_id === p.id);
      const pLeaders = users.filter(u => pContacts.some(c => c.lider_id === u.id));

      let status = 'Desatendido';
      if (pContacts.length >= 50) status = 'Fuerte';
      else if (pContacts.length > 0) status = 'En Progreso';

      return {
        puesto: p,
        contactsCount: pContacts.length,
        leadersCount: pLeaders.length,
        status
      };
    }).filter(row => {
      if (tableSearch) {
        return smartSearch([
          row.puesto.nombre_puesto,
          row.puesto.codigo_puesto,
          row.puesto.barrio_corregimiento,
          row.puesto.comuna_localidad,
          row.puesto.direccion,
          row.status
        ], tableSearch);
      }
      return true;
    }).sort((a, b) => b.contactsCount - a.contactsCount);
  }, [pollingStations, filteredContactos, users, tableSearch]);

  // Export functions
  const exportSeguimientoMensualExcel = () => {
    const dataToExport = seguimientoMensualRows.map(r => ({
      'Año': r.anno,
      'Mes': r.mes,
      'ID Líder': r.id,
      'Nombre Líder': r.nombre,
      'Meta Contactos': r.metaC,
      'Nuevos Contactos': r.nuevosC,
      'Contactos Activos': r.activosC,
      'Meta Actividades': r.metaA,
      'Actividades Realizadas': r.actRealizadas,
      'Asistentes': r.asistentes,
      '% Cumplimiento Contactos': `${r.cumpC.toFixed(1)}%`,
      '% Cumplimiento Actividades': `${r.cumpA.toFixed(1)}%`,
      'Semáforo': r.semaforo,
      'Comentarios': r.comentarios
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Seguimiento_Mensual');
    XLSX.writeFile(wb, `Seguimiento_Mensual_Lideres_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportActividadesExcel = () => {
    const dataToExport = actividadesRows.map(act => {
      const lider = users.find(u => u.id === act.lider_id);
      const cumpAsist = act.meta_asistentes > 0 ? (act.asistentes_reales / act.meta_asistentes) * 100 : 0;
      return {
        'ID Actividad': act.id,
        'ID Líder': act.lider_id,
        'Nombre Líder': lider?.nombre_completo || 'Desconocido',
        'Fecha': act.fecha,
        'Tipo de Actividad': act.tipo_actividad.replace(/_/g, ' '),
        'Código Puesto': act.puesto_id || 'N/A',
        'Barrio': act.barrio || 'N/A',
        'Meta Asistentes': act.meta_asistentes,
        'Asistentes Reales': act.asistentes_reales,
        'Nuevos Contactos': act.nuevos_contactos_generados,
        'Costo Presupuestado': act.costo_presupuestado,
        'Costo Real': act.costo_real,
        '% Cumplimiento Asistencia': `${cumpAsist.toFixed(1)}%`,
        'Evidencia/Enlace': act.evidencia_enlace || '',
        'Observaciones': act.observaciones || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Actividades_Territoriales');
    XLSX.writeFile(wb, `Plan_Actividades_Territoriales_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const pieColors = ['#6366f1', '#f43f5e', '#0ea5e9', '#10b981', '#f59e0b'];

  const resetAllFilters = () => {
    setFilterLiderId('ALL');
    setFilterLocalidad('ALL');
    setFilterStationId('ALL');
    setFilterMonth('ALL');
    setTableSearch('');
    setSemaforoFilter('ALL');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-28">
      {/* 1. Header & Context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Tablero de Mando Territorial
            </h1>
            <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-600/30 to-rose-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-black uppercase tracking-wider shadow-sm">
              {currentUser?.rol.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            Supervisión integral de estructura política, cobertura electoral y auditoría de actividades.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setSelectedActivityForEdit(null);
              setIsActivityModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Actividad</span>
          </button>
        </div>
      </div>

      {/* 2. Global Interactive Filter Bar */}
      <div className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-indigo-400" /> Filtros Globales de Visualización
          </span>
          {(filterLiderId !== 'ALL' || filterLocalidad !== 'ALL' || filterStationId !== 'ALL' || filterMonth !== 'ALL') && (
            <button
              onClick={resetAllFilters}
              className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold transition"
            >
              <RotateCcw className="w-3 h-3" /> Limpiar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Filter by Leader */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Filtrar por Líder</label>
            <select
              value={filterLiderId}
              onChange={e => setFilterLiderId(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="ALL">Todos los Líderes ({baseUsers.length})</option>
              {baseUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.nombre_completo} ({u.rol.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Localidad */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Localidad de Cartagena</label>
            <select
              value={filterLocalidad}
              onChange={e => setFilterLocalidad(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="ALL">Todas las Localidades</option>
              {LOCALIDADES_CARTAGENA.map(loc => (
                <option key={loc.id} value={loc.nombre}>{loc.nombre}</option>
              ))}
            </select>
          </div>

          {/* Filter by Polling Station */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Puesto de Votación</label>
            <select
              value={filterStationId}
              onChange={e => setFilterStationId(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="ALL">Todos los Puestos ({pollingStations.length})</option>
              {pollingStations.map(p => (
                <option key={p.id} value={p.id}>{p.nombre_puesto}</option>
              ))}
            </select>
          </div>

          {/* Filter by Month */}
          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 mb-1">Periodo / Mes</label>
            <select
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 transition"
            >
              <option value="ALL">Todo el Año (Consolidado)</option>
              <option value="0">Enero</option>
              <option value="1">Febrero</option>
              <option value="2">Marzo</option>
              <option value="3">Abril</option>
              <option value="4">Mayo</option>
              <option value="5">Junio</option>
              <option value="6">Julio</option>
              <option value="7">Agosto</option>
              <option value="8">Septiembre</option>
              <option value="9">Octubre</option>
              <option value="10">Noviembre</option>
              <option value="11">Diciembre</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex flex-wrap bg-neutral-900 p-1.5 rounded-2xl w-full sm:w-fit border border-neutral-800 shadow-lg">
        <button
          onClick={() => { setActiveTab('general'); setTableSearch(''); }}
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'general'
              ? 'bg-gradient-to-r from-indigo-600 to-rose-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <PieChart className="w-4 h-4" /> <span>Visión General & Demografía</span>
        </button>
        <button
          onClick={() => { setActiveTab('graficas_kpi'); setTableSearch(''); }}
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'graficas_kpi'
              ? 'bg-gradient-to-r from-indigo-600 to-rose-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> <span>Gráficas & Analítica KPI</span>
        </button>
        <button
          onClick={() => { setActiveTab('seguimiento_mensual'); setTableSearch(''); }}
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'seguimiento_mensual'
              ? 'bg-gradient-to-r from-indigo-600 to-rose-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <Calendar className="w-4 h-4" /> <span>Seguimiento Mensual</span>
        </button>
        <button
          onClick={() => { setActiveTab('seguimiento_actividades'); setTableSearch(''); }}
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'seguimiento_actividades'
              ? 'bg-gradient-to-r from-indigo-600 to-rose-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <Activity className="w-4 h-4" /> <span>Actividades Territoriales</span>
        </button>
        <button
          onClick={() => { setActiveTab('cobertura_puestos'); setTableSearch(''); }}
          className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'cobertura_puestos'
              ? 'bg-gradient-to-r from-indigo-600 to-rose-600 text-white shadow-md'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
          }`}
        >
          <MapPin className="w-4 h-4" /> <span>Cobertura de Puestos</span>
        </button>
      </div>

      {/* 4. TAB CONTENT: Gráficas & Analítica KPI */}
      {activeTab === 'graficas_kpi' && (
        <KPIGraphsTab
          contactos={baseContactos}
          actividades={baseActividades}
          users={baseUsers}
          pollingStations={pollingStations}
        />
      )}

      {/* 4. TAB CONTENT: Visión General */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Main KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 relative overflow-hidden group shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <GitFork className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {kpis.totalSublideres} sublíderes
                </span>
              </div>
              <h3 className="text-3xl font-black text-white">{kpis.totalLideres}</h3>
              <p className="text-xs font-semibold text-neutral-400 mt-0.5">Líderes Activos</p>
              <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-indigo-500/10 blur-2xl group-hover:bg-indigo-500/20 transition-all" />
            </div>

            {/* Card 2 */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 relative overflow-hidden group shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <Vote className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> {kpis.porcentajeHabeas.toFixed(0)}% Habeas
                </span>
              </div>
              <h3 className="text-3xl font-black text-white">{kpis.totalContactos.toLocaleString()}</h3>
              <p className="text-xs font-semibold text-neutral-400 mt-0.5">Contactos Registrados</p>
              <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-rose-500/10 blur-2xl group-hover:bg-rose-500/20 transition-all" />
            </div>

            {/* Card 3 */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 relative overflow-hidden group shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {kpis.totalAsistentes} asistentes
                </span>
              </div>
              <h3 className="text-3xl font-black text-white">{kpis.totalActividades}</h3>
              <p className="text-xs font-semibold text-neutral-400 mt-0.5">Actividades Realizadas</p>
              <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/20 transition-all" />
            </div>

            {/* Card 4 */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 relative overflow-hidden group shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {kpis.coberturaPuestosPercent.toFixed(1)}% total
                </span>
              </div>
              <h3 className="text-3xl font-black text-white">{kpis.puestosCubiertosCount}</h3>
              <p className="text-xs font-semibold text-neutral-400 mt-0.5">Puestos con Cobertura</p>
              <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-all" />
            </div>
          </div>

          {/* Demographic & Performance Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Interactive Demographics */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col shadow-xl">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-400" /> Demografía Territorial
                </h3>
                <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 overflow-x-auto">
                  <button onClick={() => setChartView('edades')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${chartView === 'edades' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500 hover:text-neutral-300'}`}>Edades</button>
                  <button onClick={() => setChartView('genero')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${chartView === 'genero' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500 hover:text-neutral-300'}`}>Género</button>
                  <button onClick={() => setChartView('puestos')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${chartView === 'puestos' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500 hover:text-neutral-300'}`}>Puestos Top</button>
                  <button onClick={() => setChartView('barrios')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${chartView === 'barrios' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500 hover:text-neutral-300'}`}>Barrios Top</button>
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center min-h-[260px]">
                {chartView === 'edades' && (
                  <div className="flex flex-col sm:flex-row items-center gap-8 w-full justify-center">
                    {(() => {
                      let currentDeg = 0;
                      const total = edadesData.reduce((a, b) => a + b.value, 0) || 1;
                      const gradientStops = edadesData.map((d, i) => {
                        const percent = (d.value / total) * 100;
                        const stop = `${pieColors[i % pieColors.length]} ${currentDeg}% ${currentDeg + percent}%`;
                        currentDeg += percent;
                        return stop;
                      }).join(', ');

                      return (
                        <>
                          <div
                            className="w-44 h-44 rounded-full shadow-2xl border-4 border-neutral-900 relative"
                            style={{ background: edadesData.reduce((a, b) => a + b.value, 0) > 0 ? `conic-gradient(${gradientStops})` : '#262626' }}
                          >
                            <div className="absolute inset-5 rounded-full bg-neutral-900 flex items-center justify-center shadow-inner">
                              <div className="text-center">
                                <p className="text-2xl font-black text-white">{total}</p>
                                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Contactos</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2.5">
                            {edadesData.map((d, i) => (
                              <div key={d.label} className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-md" style={{ backgroundColor: pieColors[i % pieColors.length] }} />
                                <div>
                                  <span className="text-xs font-bold text-neutral-300">{d.label} años</span>
                                  <span className="text-[11px] text-neutral-500 block">{d.value} personas ({((d.value / total) * 100).toFixed(1)}%)</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {chartView === 'genero' && (
                  <div className="w-full space-y-4 px-4">
                    {generoData.map((g, i) => (
                      <div key={g.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-neutral-300">{g.label}</span>
                          <span className="text-indigo-400">{g.value} ({g.percent}%)</span>
                        </div>
                        <div className="w-full h-3 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${g.percent}%`,
                              backgroundColor: pieColors[i % pieColors.length]
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {(chartView === 'puestos' || chartView === 'barrios') && (
                  <div className="w-full flex items-end justify-around h-[220px] pt-4 px-2">
                    {(chartView === 'puestos' ? puestosData : barriosData).map(d => {
                      const max = Math.max(...(chartView === 'puestos' ? puestosData : barriosData).map(x => x.value)) || 1;
                      const height = (d.value / max) * 100;
                      return (
                        <div key={d.label} className="flex flex-col items-center gap-2.5 w-16 group">
                          <div className="w-full relative flex items-end justify-center h-full">
                            <div
                              className="w-12 bg-gradient-to-t from-indigo-900 via-indigo-600 to-indigo-400 rounded-t-xl transition-all duration-500 group-hover:to-rose-500 relative"
                              style={{ height: `${height}%`, minHeight: d.value > 0 ? '12%' : '0' }}
                            >
                              <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-black text-white bg-neutral-800 px-2 py-0.5 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                {d.value} contactos
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-neutral-400 text-center leading-tight h-8 overflow-hidden line-clamp-2" title={d.label}>
                            {d.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Ranking Líderes Interactive */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col shadow-xl">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-rose-400" /> Ranking de Líderes
                </h3>
                <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 overflow-x-auto">
                  <button onClick={() => setTopLideresView('contactos')} className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${topLideresView === 'contactos' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500 hover:text-neutral-300'}`}>Contactos</button>
                  <button onClick={() => setTopLideresView('sublideres')} className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${topLideresView === 'sublideres' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500 hover:text-neutral-300'}`}>Sublíderes</button>
                  <button onClick={() => setTopLideresView('actividades')} className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${topLideresView === 'actividades' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500 hover:text-neutral-300'}`}>Actividades</button>
                  <button onClick={() => setTopLideresView('asistencia')} className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${topLideresView === 'asistencia' ? 'bg-neutral-800 text-white shadow' : 'text-neutral-500 hover:text-neutral-300'}`}>Asistentes</button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-2.5 custom-scrollbar max-h-[300px]">
                {topLideres.map((l, i) => {
                  let metricValue = l.contactos;
                  let metricLabel = 'Contactos';
                  if (topLideresView === 'sublideres') { metricValue = l.sub; metricLabel = 'Sublíderes'; }
                  else if (topLideresView === 'actividades') { metricValue = l.act; metricLabel = 'Actividades'; }
                  else if (topLideresView === 'asistencia') { metricValue = l.asis; metricLabel = 'Asistentes'; }

                  return (
                    <div
                      key={l.user.id}
                      onClick={() => setSelectedLeaderForModal(l.user)}
                      className="flex items-center justify-between p-3 rounded-2xl bg-neutral-950/60 border border-neutral-800/60 hover:border-indigo-500/50 hover:bg-neutral-950 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                          i === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          i === 1 ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30' :
                          i === 2 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/30' :
                          'bg-neutral-800 text-neutral-400'
                        }`}>
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition flex items-center gap-1.5">
                            {l.nombre} <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition text-neutral-500" />
                          </p>
                          <p className="text-[10px] text-neutral-500">
                            {l.user.rol.replace(/_/g, ' ')} • {l.user.barrio_residencia || 'Sin barrio'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-indigo-400">{metricValue}</p>
                        <p className="text-[10px] text-neutral-500 font-medium">{metricLabel}</p>
                      </div>
                    </div>
                  );
                })}
                {topLideres.length === 0 && (
                  <p className="text-center py-12 text-neutral-500 text-sm">No se encontraron líderes con datos.</p>
                )}
              </div>
            </div>
          </div>

          {/* Efficiency and Financial Summary Banner */}
          <div className="bg-gradient-to-r from-neutral-900 via-indigo-950/30 to-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" /> Auditoría de Inversión y Eficiencia Comunitaria
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-neutral-500">Presupuesto Asignado</p>
                <p className="text-xl font-bold text-white">${kpis.totalPresupuesto.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Inversión Real Ejecutada</p>
                <p className="text-xl font-bold text-rose-400">${kpis.totalCostoReal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Costo Promedio / Contacto</p>
                <p className="text-xl font-bold text-emerald-400">
                  {kpis.costoPorContacto > 0 ? `$${kpis.costoPorContacto.toLocaleString()}` : '$0'}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-500">Nuevos Contactos Captados</p>
                <p className="text-xl font-bold text-indigo-400">+{kpis.totalNuevosContactosActividades}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB CONTENT: Seguimiento Mensual por Líder (Excel Template 1) */}
      {activeTab === 'seguimiento_mensual' && (
        <div className="space-y-4">
          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar líder por nombre o cédula..."
                  value={tableSearch}
                  onChange={e => setTableSearch(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
                <button
                  onClick={() => setSemaforoFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${semaforoFilter === 'ALL' ? 'bg-neutral-800 text-white' : 'text-neutral-500'}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setSemaforoFilter('Verde')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${semaforoFilter === 'Verde' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-neutral-500'}`}
                >
                  Verdes
                </button>
                <button
                  onClick={() => setSemaforoFilter('Amarillo')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${semaforoFilter === 'Amarillo' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-neutral-500'}`}
                >
                  Amarillos
                </button>
                <button
                  onClick={() => setSemaforoFilter('Rojo')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${semaforoFilter === 'Rojo' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'text-neutral-500'}`}
                >
                  Rojos
                </button>
              </div>

              <button
                onClick={exportSeguimientoMensualExcel}
                className="px-3.5 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>

          {/* Table Container Styled Exactly Like Excel Template 1 */}
          <div className="bg-[#1e1e1e] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-[#122b5e] p-3.5 border-b border-indigo-900/50 flex items-center justify-between px-6">
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-widest flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-sky-400" /> SEGUIMIENTO MENSUAL POR LÍDER
              </h2>
              <span className="text-xs text-sky-200 font-semibold">{seguimientoMensualRows.length} líderes evaluados</span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="bg-[#297db8] text-white text-[11px] font-bold uppercase whitespace-nowrap">
                    <th className="p-3 border border-[#3b93ce]/30">Año</th>
                    <th className="p-3 border border-[#3b93ce]/30">Mes</th>
                    <th className="p-3 border border-[#3b93ce]/30">ID Líder</th>
                    <th className="p-3 border border-[#3b93ce]/30">Nombre Líder</th>
                    <th className="p-3 border border-[#3b93ce]/30 text-center">Meta Contactos</th>
                    <th className="p-3 border border-[#3b93ce]/30 text-center">Nuevos Contactos</th>
                    <th className="p-3 border border-[#3b93ce]/30 text-center">Contactos Activos</th>
                    <th className="p-3 border border-[#3b93ce]/30 text-center">Meta Activ.</th>
                    <th className="p-3 border border-[#3b93ce]/30 text-center">Activ. Realizadas</th>
                    <th className="p-3 border border-[#3b93ce]/30 text-center">Asistentes</th>
                    <th className="p-3 border border-[#3b93ce]/30 text-center">% Cump. Contactos</th>
                    <th className="p-3 border border-[#3b93ce]/30 text-center">% Cump. Activ.</th>
                    <th className="p-3 border border-[#3b93ce]/30 text-center">Semáforo</th>
                    <th className="p-3 border border-[#3b93ce]/30">Comentarios</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] font-medium">
                  {seguimientoMensualRows.map((row, i) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedLeaderForModal(row.user)}
                      className={`cursor-pointer transition hover:opacity-90 ${
                        i % 2 === 0 ? 'bg-[#c5e6f5] text-[#1e3a5f]' : 'bg-white text-[#1e3a5f]'
                      }`}
                    >
                      <td className="p-2.5 border border-[#85c8ea] text-center font-bold">{row.anno}</td>
                      <td className="p-2.5 border border-[#85c8ea] font-semibold">{row.mes}</td>
                      <td className="p-2.5 border border-[#85c8ea] font-mono text-[10px] text-neutral-500 truncate max-w-[80px]">{row.id}</td>
                      <td className="p-2.5 border border-[#85c8ea] font-bold flex items-center justify-between">
                        <span>{row.nombre}</span>
                        <ExternalLink className="w-3 h-3 text-[#297db8] opacity-50" />
                      </td>
                      <td className="p-2.5 border border-[#85c8ea] text-center font-semibold">{row.metaC}</td>
                      <td className="p-2.5 border border-[#85c8ea] text-center font-bold text-[#122b5e]">{row.nuevosC}</td>
                      <td className="p-2.5 border border-[#85c8ea] text-center">{row.activosC}</td>
                      <td className="p-2.5 border border-[#85c8ea] text-center font-semibold">{row.metaA}</td>
                      <td className="p-2.5 border border-[#85c8ea] text-center font-bold text-[#122b5e]">{row.actRealizadas}</td>
                      <td className="p-2.5 border border-[#85c8ea] text-center font-semibold">{row.asistentes}</td>
                      <td className="p-2.5 border border-[#85c8ea] text-center font-bold">{row.cumpC.toFixed(1)}%</td>
                      <td className="p-2.5 border border-[#85c8ea] text-center font-bold">{row.cumpA.toFixed(1)}%</td>
                      <td className="p-2.5 border border-[#85c8ea] text-center">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase shadow-sm ${
                          row.semaforo === 'Verde' ? 'bg-[#c1e1c1] text-[#2d5a27]' :
                          row.semaforo === 'Amarillo' ? 'bg-[#fdfd96] text-[#8b8000]' :
                          'bg-[#ffb3ba] text-[#900000]'
                        }`}>
                          {row.semaforo}
                        </span>
                      </td>
                      <td className="p-2.5 border border-[#85c8ea] text-xs text-neutral-600 truncate max-w-[150px]">{row.comentarios}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {seguimientoMensualRows.length === 0 && (
                <div className="p-10 text-center text-neutral-400 text-sm bg-neutral-900">
                  No se encontraron líderes que coincidan con la búsqueda o filtro.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB CONTENT: Seguimiento de Actividades (Excel Template 2) */}
      {activeTab === 'seguimiento_actividades' && (
        <div className="space-y-4">
          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-900 p-4 rounded-2xl border border-neutral-800">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar actividad por líder, barrio o tipo..."
                  value={tableSearch}
                  onChange={e => setTableSearch(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setSelectedActivityForEdit(null);
                  setIsActivityModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Actividad</span>
              </button>

              <button
                onClick={exportActividadesExcel}
                className="px-3.5 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>

          {/* Table Container Styled Exactly Like Excel Template 2 */}
          <div className="bg-[#1e1e1e] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-[#122b5e] p-3.5 border-b border-indigo-900/50 flex items-center justify-between px-6">
              <h2 className="text-sm sm:text-base font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-rose-400" /> PLAN Y SEGUIMIENTO DE ACTIVIDADES TERRITORIALES
              </h2>
              <span className="text-xs text-sky-200 font-semibold">{actividadesRows.length} eventos registrados</span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1250px]">
                <thead>
                  <tr className="bg-[#297db8] text-white text-[11px] font-bold uppercase whitespace-nowrap">
                    <th className="p-3 border border-[#3b93ce]/30">ID Actividad</th>
                    <th className="p-3 border border-[#3b93ce]/30">Nombre Líder</th>
                    <th className="p-3 border border-[#3b93ce]/30">Fecha</th>
                    <th className="p-3 border border-[#3b93ce]/30">Tipo de Actividad</th>
                    <th className="p-3 border border-[#3b93ce]/30">Código Puesto</th>
                    <th className="p-3 border border-[#3b93ce]/30">Barrio</th>
                    <th className="p-3 border border-[#3b93ce]/30 text-center">Meta Asistentes</th>
                    <th className="p-3 border border-[#3b93ce]/30 text-center">Asistentes Reales</th>
                    <th className="p-3 border border-[#3b93ce]/30 text-center">Nuevos Contactos</th>
                    <th className="p-3 border border-[#3b93ce]/30 text-right">Costo Presupuestado</th>
                    <th className="p-3 border border-[#3b93ce]/30 text-right">Costo Real</th>
                    <th className="p-3 border border-[#3b93ce]/30 text-center">% Cump. Asistencia</th>
                    <th className="p-3 border border-[#3b93ce]/30">Evidencia / Enlace</th>
                    <th className="p-3 border border-[#3b93ce]/30">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="text-[12px] font-medium">
                  {actividadesRows.map((act, i) => {
                    const lider = users.find(u => u.id === act.lider_id);
                    const cumpAsist = act.meta_asistentes > 0 ? (act.asistentes_reales / act.meta_asistentes) * 100 : 0;
                    return (
                      <tr
                        key={act.id}
                        onClick={() => {
                          setSelectedActivityForEdit(act);
                          setIsActivityModalOpen(true);
                        }}
                        className={`cursor-pointer transition hover:opacity-90 ${
                          i % 2 === 0 ? 'bg-[#c5e6f5] text-[#1e3a5f]' : 'bg-white text-[#1e3a5f]'
                        }`}
                      >
                        <td className="p-2.5 border border-[#85c8ea] font-mono text-[10px] text-neutral-500 truncate max-w-[80px]">{act.id}</td>
                        <td className="p-2.5 border border-[#85c8ea] font-bold">{lider?.nombre_completo || 'Desconocido'}</td>
                        <td className="p-2.5 border border-[#85c8ea] whitespace-nowrap">{new Date(act.fecha).toLocaleDateString()}</td>
                        <td className="p-2.5 border border-[#85c8ea] font-semibold">{act.tipo_actividad.replace(/_/g, ' ')}</td>
                        <td className="p-2.5 border border-[#85c8ea]">{act.puesto_id || 'N/A'}</td>
                        <td className="p-2.5 border border-[#85c8ea]">{act.barrio || 'N/A'}</td>
                        <td className="p-2.5 border border-[#85c8ea] text-center font-semibold">{act.meta_asistentes}</td>
                        <td className="p-2.5 border border-[#85c8ea] text-center font-bold text-[#122b5e]">{act.asistentes_reales}</td>
                        <td className="p-2.5 border border-[#85c8ea] text-center font-bold text-emerald-800">+{act.nuevos_contactos_generados}</td>
                        <td className="p-2.5 border border-[#85c8ea] text-right font-mono">${act.costo_presupuestado.toLocaleString()}</td>
                        <td className="p-2.5 border border-[#85c8ea] text-right font-mono font-bold text-rose-800">${act.costo_real.toLocaleString()}</td>
                        <td className="p-2.5 border border-[#85c8ea] text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            cumpAsist >= 100 ? 'bg-[#c1e1c1] text-[#2d5a27]' :
                            cumpAsist >= 50 ? 'bg-[#fdfd96] text-[#8b8000]' :
                            'bg-[#ffb3ba] text-[#900000]'
                          }`}>
                            {cumpAsist.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-2.5 border border-[#85c8ea]">
                          {act.evidencia_enlace ? (
                            <a
                              href={act.evidencia_enlace}
                              target="_blank"
                              rel="noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-bold text-xs"
                            >
                              <ExternalLink className="w-3 h-3" /> Ver Foto
                            </a>
                          ) : (
                            <span className="text-neutral-400 text-xs">Sin enlace</span>
                          )}
                        </td>
                        <td className="p-2.5 border border-[#85c8ea] text-xs text-neutral-600 truncate max-w-[140px]">
                          {act.observaciones || 'Sin observaciones'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {actividadesRows.length === 0 && (
                <div className="p-10 text-center text-neutral-400 text-sm bg-neutral-900">
                  No hay actividades registradas con los filtros actuales. Haz clic en <strong>+ Registrar Actividad</strong> para agregar una.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB CONTENT: Cobertura de Puestos */}
      {activeTab === 'cobertura_puestos' && (
        <PollingStationCoverageDashboard
          pollingStations={pollingStations}
          contactos={baseContactos}
          users={baseUsers}
        />
      )}

      {/* Modals */}
      <AddActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => {
          setIsActivityModalOpen(false);
          setSelectedActivityForEdit(null);
        }}
        initialActivity={selectedActivityForEdit}
      />

      <LeaderDetailModal
        isOpen={!!selectedLeaderForModal}
        onClose={() => setSelectedLeaderForModal(null)}
        leader={selectedLeaderForModal}
      />
    </div>
  );
};
