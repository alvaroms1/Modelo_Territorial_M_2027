import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useConfirm } from '../context/ConfirmContext';
import { Actividad, TipoActividad, UserAccount, MesesAnno } from '../types';
import { LOCALIDADES_CARTAGENA } from '../data/cartagenaData';
import { smartSearch } from '../utils/helpers';
import * as XLSX from 'xlsx-js-style';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  Download,
  Users,
  MapPin,
  DollarSign,
  ExternalLink,
  Edit2,
  Trash2,
  TrendingUp,
  Award,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  BarChart3,
  Calendar,
  Shield,
  Activity,
  Flame,
  ArrowUpDown
} from 'lucide-react';

interface ActivitiesViewProps {
  onOpenAddActivityModal: () => void;
  onEditActivity: (actividad: Actividad) => void;
}

type ActivitySubTab = 'plan' | 'semaforo' | 'analisis';

const MESES_LISTA: { id: MesesAnno; label: string; num: number }[] = [
  { id: 'ENERO', label: 'Enero', num: 0 },
  { id: 'FEBRERO', label: 'Febrero', num: 1 },
  { id: 'MARZO', label: 'Marzo', num: 2 },
  { id: 'ABRIL', label: 'Abril', num: 3 },
  { id: 'MAYO', label: 'Mayo', num: 4 },
  { id: 'JUNIO', label: 'Junio', num: 5 },
  { id: 'JULIO', label: 'Julio', num: 6 },
  { id: 'AGOSTO', label: 'Agosto', num: 7 },
  { id: 'SEPTIEMBRE', label: 'Septiembre', num: 8 },
  { id: 'OCTUBRE', label: 'Octubre', num: 9 },
  { id: 'NOVIEMBRE', label: 'Noviembre', num: 10 },
  { id: 'DICIEMBRE', label: 'Diciembre', num: 11 }
];

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({
  onOpenAddActivityModal,
  onEditActivity
}) => {
  const { currentUser, users, contactos, visibleContactos, actividades, pollingStations, deleteActividad } = useApp();
  const { confirm } = useConfirm();

  const currentDate = new Date();
  const currentMonthObj = MESES_LISTA[currentDate.getMonth()] || MESES_LISTA[0];

  const [activeSubTab, setActiveSubTab] = useState<ActivitySubTab>('plan');
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('TODOS');
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>('ALL');
  const [selectedTipo, setSelectedTipo] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [semaforoFilter, setSemaforoFilter] = useState<'ALL' | 'VERDE' | 'AMARILLO' | 'ROJO'>('ALL');
  const [selectedActivityDetail, setSelectedActivityDetail] = useState<Actividad | null>(null);

  // Targets per leader (standard targets for calculation)
  const [targetContactosPerMonth, setTargetContactosPerMonth] = useState<number>(20);
  const [targetActividadesPerMonth, setTargetActividadesPerMonth] = useState<number>(4);

  const isSupervisor = currentUser?.rol === 'ADMIN' || currentUser?.rol === 'LIDER_PRINCIPAL' || currentUser?.rol === 'LIDER_PRINCIPAL_INVITADO';

  // Base list of users based on current user scope
  const accessibleUsers = useMemo(() => {
    if (currentUser?.rol === 'ADMIN') {
      return users.filter(u => u.rol !== 'ADMIN');
    }
    if (currentUser?.rol === 'LIDER_PRINCIPAL' || currentUser?.rol === 'LIDER_PRINCIPAL_INVITADO') {
      return users.filter(u => u.id === currentUser.id || u.lider_principal_id === currentUser.id);
    }
    return users.filter(u => u.id === currentUser?.id);
  }, [users, currentUser]);

  const accessibleUserIds = useMemo(() => new Set(accessibleUsers.map(u => u.id)), [accessibleUsers]);

  // Base list of activities filtered by user scope
  const baseActividades = useMemo(() => {
    if (currentUser?.rol === 'ADMIN') return actividades;
    return actividades.filter(a => accessibleUserIds.has(a.lider_id));
  }, [actividades, accessibleUserIds, currentUser]);

  // Filtered activities based on filters
  const filteredActividades = useMemo(() => {
    return baseActividades.filter(act => {
      // Filter by Leader
      if (selectedLeaderId !== 'ALL' && act.lider_id !== selectedLeaderId) {
        return false;
      }

      // Filter by Year & Month
      if (act.fecha) {
        const actDate = new Date(act.fecha);
        if (!isNaN(actDate.getTime())) {
          if (actDate.getFullYear() !== selectedYear) {
            return false;
          }
          if (selectedMonth !== 'TODOS') {
            const mIndex = MESES_LISTA.findIndex(m => m.id === selectedMonth);
            if (mIndex !== -1 && actDate.getMonth() !== mIndex) {
              return false;
            }
          }
        }
      }

      // Filter by Activity Type
      if (selectedTipo !== 'ALL' && act.tipo_actividad !== selectedTipo) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const leader = users.find(u => u.id === act.lider_id);
        const leaderName = leader?.nombre_completo || '';
        const station = pollingStations.find(p => p.id === act.puesto_id);
        const stationName = station?.nombre_puesto || '';
        return smartSearch([
          act.id,
          leaderName,
          leader?.cedula || '',
          act.tipo_actividad,
          act.barrio || '',
          stationName,
          act.observaciones || ''
        ], searchQuery);
      }

      return true;
    });
  }, [baseActividades, selectedLeaderId, selectedYear, selectedMonth, selectedTipo, searchQuery, users, pollingStations]);

  // Helper functions
  const getLeaderInfo = (liderId: string) => {
    const user = users.find(u => u.id === liderId);
    if (user) return user;
    const cUser = contactos.find(c => c.id === liderId);
    if (cUser) {
      return {
        id: cUser.id,
        nombre_completo: `${cUser.nombres} ${cUser.apellidos || ''}`.trim(),
        rol: cUser.rol || 'LIDER',
        cedula: cUser.cedula,
        telefono: cUser.telefono
      };
    }
    return {
      id: liderId,
      nombre_completo: 'Líder Desconocido',
      rol: 'LIDER',
      cedula: 'N/A',
      telefono: 'N/A'
    };
  };

  const getPuestoName = (puestoId) => {
    if (!puestoId) return 'No asociado';
    const station = pollingStations.find(p => p.id === puestoId);
    return station?.nombre_puesto || puestoId;
  };

  const formatTipoLabel = (tipo) => {
    switch (tipo) {
      case 'REUNION_COMUNITARIA': return 'Reunión Comunitaria';
      case 'JORNADA_SOCIAL': return 'Jornada Social';
      case 'CAPACITACION': return 'Capacitación';
      case 'VISITA_TERRITORIAL': return 'Visita Territorial';
      case 'ACTIVIDAD_CULTURAL': return 'Actividad Cultural';
      default: return tipo.replace(/_/g, ' ');
    }
  };

  const formatCurrency = (val) => {
    if (val === undefined || val === null || isNaN(val)) return '$0';
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm('¿Estás seguro de eliminar este registro de actividad comunitaria? Esta acción no se puede deshacer.');
    if (isConfirmed) {
      const res = await deleteActividad(id);
      if (!res.success) {
        alert(res.error || 'Error al eliminar actividad');
      }
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 🚦 SEMÁFORO AND MONTHLY SCORECARD CALCULATION (SHEET 2 LOGIC)
  // ─────────────────────────────────────────────────────────────
  // Formula: =SI(Y(K5>=1;L5>=1);"Verde";SI(O(K5>=0,7;L5>=0,7);"Amarillo";"Rojo"))
  const monthlyLeaderScorecards = useMemo(() => {
    const monthNum = selectedMonth === 'TODOS' ? currentDate.getMonth() : (MESES_LISTA.find(m => m.id === selectedMonth)?.num ?? currentDate.getMonth());
    const monthLabel = selectedMonth === 'TODOS' ? currentMonthObj.label : (MESES_LISTA.find(m => m.id === selectedMonth)?.label || 'Mes Actual');

    return accessibleUsers.map(leader => {
      // 1. Actividades realizadas por este líder en el año y mes
      const leaderActivities = baseActividades.filter(act => {
        if (act.lider_id !== leader.id) return false;
        if (!act.fecha) return false;
        const d = new Date(act.fecha);
        if (isNaN(d.getTime())) return false;
        return d.getFullYear() === selectedYear && d.getMonth() === monthNum;
      });

      const actRealizadas = leaderActivities.length;
      const totalAsistentes = leaderActivities.reduce((sum, a) => sum + (a.asistentes_reales || 0), 0);
      const contactosDesdeActividades = leaderActivities.reduce((sum, a) => sum + (a.nuevos_contactos_generados || 0), 0);

      // 2. Contactos registrados en este mes por este líder
      const monthContactos = contactos.filter(c => {
        const isHis = c.lider_id === leader.id || c.sublider_id === leader.id;
        if (!isHis) return false;
        if (!c.created_at && !c.fecha_registro) return true;
        const d = new Date(c.created_at || c.fecha_registro || '');
        if (isNaN(d.getTime())) return true;
        return d.getFullYear() === selectedYear && d.getMonth() === monthNum;
      });

      const nuevosContactos = Math.max(monthContactos.length, contactosDesdeActividades);
      const contactosActivos = contactos.filter(c => (c.lider_id === leader.id || c.sublider_id === leader.id) && c.estado !== 'INACTIVO').length;

      // 3. Metas y Ratios de Cumplimiento (Columnas K y L)
      const metaC = targetContactosPerMonth || 20;
      const metaA = targetActividadesPerMonth || 4;

      const ratioK = metaC > 0 ? (nuevosContactos / metaC) : 0;
      const ratioL = metaA > 0 ? (actRealizadas / metaA) : 0;

      const cumpContactosPct = ratioK * 100;
      const cumpActividadesPct = ratioL * 100;

      // 4. Semáforo Formula: =SI(Y(K5>=1;L5>=1);"Verde";SI(O(K5>=0,7;L5>=0,7);"Amarillo";"Rojo"))
      let semaforo = 'ROJO';
      let semaforoLabel = 'Rojo (Alerta)';
      let diagnostico = 'Requiere reactivación urgente y acompañamiento en territorio.';

      if (ratioK >= 1.0 && ratioL >= 1.0) {
        semaforo = 'VERDE';
        semaforoLabel = 'Verde (Sobresaliente)';
        diagnostico = '¡Excelente rendimiento! Metas de contactos y actividades superadas.';
      } else if (ratioK >= 0.7 || ratioL >= 0.7) {
        semaforo = 'AMARILLO';
        semaforoLabel = 'Amarillo (En Progreso)';
        diagnostico = ratioK >= 0.7 && ratioL < 0.7
          ? 'Buen ritmo de contactos, pero se deben intensificar las actividades presenciales.'
          : 'Buen número de actividades realizadas, pero se debe potenciar la captura de nuevos contactos.';
      }

      return {
        anno: selectedYear,
        mesLabel: monthLabel,
        liderId: leader.id,
        liderCedula: leader.cedula,
        nombreLider: leader.nombre_completo,
        rol: leader.rol,
        metaContactos: metaC,
        nuevosContactos,
        contactosActivos,
        metaActividades: metaA,
        actividadesRealizadas: actRealizadas,
        asistentesTotales: totalAsistentes,
        ratioK,
        ratioL,
        cumpContactosPct,
        cumpActividadesPct,
        semaforo,
        semaforoLabel,
        diagnostico,
        activitiesList: leaderActivities
      };
    });
  }, [accessibleUsers, baseActividades, contactos, selectedMonth, selectedYear, targetContactosPerMonth, targetActividadesPerMonth, currentDate, currentMonthObj]);

  // Filter scorecards by semáforo filter and search
  const filteredScorecards = useMemo(() => {
    return monthlyLeaderScorecards.filter(row => {
      if (semaforoFilter !== 'ALL' && row.semaforo !== semaforoFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        return smartSearch([
          row.nombreLider,
          row.liderCedula,
          row.rol,
          row.semaforoLabel,
          row.diagnostico
        ], searchQuery);
      }
      return true;
    });
  }, [monthlyLeaderScorecards, semaforoFilter, searchQuery]);

  // Global KPIs summary
  const summaryKPIs = useMemo(() => {
    const totalActs = filteredActividades.length;
    const totalAsistentes = filteredActividades.reduce((s, a) => s + (a.asistentes_reales || 0), 0);
    const totalMetaAsistentes = filteredActividades.reduce((s, a) => s + (a.meta_asistentes || 0), 0);
    const totalNuevosContactos = filteredActividades.reduce((s, a) => s + (a.nuevos_contactos_generados || 0), 0);
    const totalPresupuesto = filteredActividades.reduce((s, a) => s + (a.costo_presupuestado || 0), 0);
    const totalCostoReal = filteredActividades.reduce((s, a) => s + (a.costo_real || 0), 0);

    const cumpAsistenciaPromedio = totalMetaAsistentes > 0 ? (totalAsistentes / totalMetaAsistentes) * 100 : 0;
    const avgAsistentesPorAct = totalActs > 0 ? Math.round(totalAsistentes / totalActs) : 0;

    // Semáforo distribution
    const countVerde = monthlyLeaderScorecards.filter(s => s.semaforo === 'VERDE').length;
    const countAmarillo = monthlyLeaderScorecards.filter(s => s.semaforo === 'AMARILLO').length;
    const countRojo = monthlyLeaderScorecards.filter(s => s.semaforo === 'ROJO').length;

    return {
      totalActs,
      totalAsistentes,
      totalNuevosContactos,
      totalPresupuesto,
      totalCostoReal,
      cumpAsistenciaPromedio,
      avgAsistentesPorAct,
      countVerde,
      countAmarillo,
      countRojo,
      totalLeaders: monthlyLeaderScorecards.length
    };
  }, [filteredActividades, monthlyLeaderScorecards]);

  // ─────────────────────────────────────────────────────────────
  // 📥 EXCEL EXPORTS (SHEET 1 & SHEET 2)
  // ─────────────────────────────────────────────────────────────

  // Export Sheet 1: PLAN Y SEGUIMIENTO DE ACTIVIDADES TERRITORIALES
  const exportPlanActividadesExcel = () => {
    const rows = filteredActividades.map(act => {
      const leader = getLeaderInfo(act.lider_id);
      const station = pollingStations.find(p => p.id === act.puesto_id);
      const cumpAsistencia = act.meta_asistentes > 0 ? ((act.asistentes_reales / act.meta_asistentes) * 100).toFixed(1) + '%' : '0.0%';

      return {
        'ID actividad': act.id.slice(0, 8).toUpperCase(),
        'ID lider': leader.cedula,
        'Nombre lider': leader.nombre_completo,
        'Fecha': act.fecha,
        'Tipo de actividad': formatTipoLabel(act.tipo_actividad),
        'Código puesto': station?.codigo_puesto || 'N/A',
        'Puesto de votación': station?.nombre_puesto || 'N/A',
        'Barrio': act.barrio || 'N/A',
        'Meta asistentes': act.meta_asistentes || 0,
        'Asistentes reales': act.asistentes_reales || 0,
        'Nuevos contactos': act.nuevos_contactos_generados || 0,
        'Costo presupuestado': act.costo_presupuestado || 0,
        'Costo real': act.costo_real || 0,
        'Cumplimiento asistencia': cumpAsistencia,
        'Evidencia/Enlace': act.evidencia_enlace || 'Sin enlace',
        'Observaciones': act.observaciones || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + '1';
      if (!ws[address]) ws[address] = { t: 's', v: '' };
      ws[address].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1F4E79' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    ws['!cols'] = [
      { wch: 12 }, { wch: 14 }, { wch: 28 }, { wch: 12 },
      { wch: 22 }, { wch: 14 }, { wch: 26 }, { wch: 20 },
      { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 18 },
      { wch: 18 }, { wch: 22 }, { wch: 30 }, { wch: 35 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Actividades_Territoriales');
    XLSX.writeFile(wb, `Plan_Actividades_Territoriales_${selectedYear}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export Sheet 2: SEGUIMIENTO MENSUAL POR LÍDER
  const exportSeguimientoMensualExcel = () => {
    const rows = monthlyLeaderScorecards.map(row => ({
      'Año': row.anno,
      'Mes': row.mesLabel,
      'ID lider': row.liderCedula,
      'Nombre lider': row.nombreLider,
      'Rol': row.rol.replace(/_/g, ' '),
      'Meta contactos': row.metaContactos,
      'Nuevos contactos': row.nuevosContactos,
      'Contactos activos': row.contactosActivos,
      'Meta actividades': row.metaActividades,
      'Actividades realizadas': row.actividadesRealizadas,
      'Asistentes': row.asistentesTotales,
      'Cumplimiento contactos (K)': `${row.cumpContactosPct.toFixed(1)}%`,
      'Cumplimiento actividades (L)': `${row.cumpActividadesPct.toFixed(1)}%`,
      'Semáforo': row.semaforo,
      'Diagnóstico / Comentarios': row.diagnostico
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = XLSX.utils.encode_col(C) + '1';
      if (!ws[address]) ws[address] = { t: 's', v: '' };
      ws[address].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1F4E79' } },
        alignment: { horizontal: 'center', vertical: 'center' }
      };
    }

    for (let R = 1; R <= rows.length; ++R) {
      const semCell = ws[XLSX.utils.encode_cell({ r: R, c: 13 })];
      if (semCell) {
        const val = semCell.v;
        let colorHex = 'FFFFFF';
        let bgHex = 'E0E0E0';
        if (val === 'VERDE') { bgHex = 'C6EFCE'; colorHex = '006100'; }
        else if (val === 'AMARILLO') { bgHex = 'FFEB9C'; colorHex = '9C6500'; }
        else if (val === 'ROJO') { bgHex = 'FFC7CE'; colorHex = '9C0006'; }

        semCell.s = {
          font: { bold: true, color: { rgb: colorHex } },
          fill: { fgColor: { rgb: bgHex } },
          alignment: { horizontal: 'center' }
        };
      }
    }

    ws['!cols'] = [
      { wch: 8 }, { wch: 12 }, { wch: 14 }, { wch: 28 }, { wch: 18 },
      { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 20 },
      { wch: 14 }, { wch: 24 }, { wch: 24 }, { wch: 14 }, { wch: 45 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Seguimiento_Mensual');
    XLSX.writeFile(wb, `Seguimiento_Mensual_Lideres_${selectedYear}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      
      {/* ─── 1. HEADER PRINCIPAL DEL MÓDULO ─── */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-md shadow-indigo-500/10 shrink-0">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Gestión de Actividades Comunitarias
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {summaryKPIs.totalActs} Registradas
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Planificación territorial, registro de eventos comunitarios y semáforo de desempeño por líder
              </p>
            </div>
          </div>

          {/* Botones de Acción Rápida */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exportPlanActividadesExcel}
              className="px-3 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Descargar Plan de Actividades en Excel (Plantilla 1)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Plan (.xlsx)</span>
            </button>

            <button
              onClick={exportSeguimientoMensualExcel}
              className="px-3 py-2 rounded-xl bg-neutral-950 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              title="Descargar Seguimiento Mensual con Semáforo (Plantilla 2)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
              <span>Semáforo (.xlsx)</span>
            </button>

            <button
              onClick={onOpenAddActivityModal}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Actividad</span>
            </button>
          </div>
        </div>

        {/* ─── 2. SUB-PESTAÑAS DEL MÓDULO ─── */}
        <div className="mt-6 pt-5 border-t border-neutral-800 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveSubTab('plan')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeSubTab === 'plan'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800 hover:bg-neutral-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Plan de Actividades</span>
              <span className="ml-1 text-[11px] px-1.5 py-0.2 bg-black/20 rounded-md font-mono">
                {filteredActividades.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('semaforo')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeSubTab === 'semaforo'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800 hover:bg-neutral-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Semáforo y Seguimiento Mensual</span>
              <span className="ml-1 text-[11px] px-1.5 py-0.2 bg-black/20 rounded-md font-mono">
                {monthlyLeaderScorecards.length}
              </span>
            </button>

            <button
              onClick={() => setActiveSubTab('analisis')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shrink-0 ${
                activeSubTab === 'analisis'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800 hover:bg-neutral-800'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-rose-400" />
              <span>Métricas de Rendimiento</span>
            </button>
          </div>

          {/* Configuración de Metas Rápidas */}
          {isSupervisor && activeSubTab === 'semaforo' && (
            <div className="flex items-center gap-2 text-xs text-neutral-400 bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-xl">
              <span className="font-semibold text-neutral-300">Metas Mensuales:</span>
              <span>Contactos:</span>
              <input
                type="number"
                min="1"
                value={targetContactosPerMonth}
                onChange={e => setTargetContactosPerMonth(Number(e.target.value) || 1)}
                className="w-12 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-center text-white font-bold"
              />
              <span>Actividades:</span>
              <input
                type="number"
                min="1"
                value={targetActividadesPerMonth}
                onChange={e => setTargetActividadesPerMonth(Number(e.target.value) || 1)}
                className="w-12 bg-neutral-900 border border-neutral-700 rounded px-1.5 py-0.5 text-center text-white font-bold"
              />
            </div>
          )}
        </div>
      </div>

      {/* ─── 3. RESUMEN DE INDICADORES KPI GLOBALES ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Actividades Realizadas</span>
            <Activity className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2">{summaryKPIs.totalActs}</p>
          <p className="text-[11px] text-neutral-500 mt-0.5 font-medium">Eventos comunitarios</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Asistentes Convocados</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2">{summaryKPIs.totalAsistentes}</p>
          <p className="text-[11px] text-emerald-400 mt-0.5 font-medium">Promedio: {summaryKPIs.avgAsistentesPorAct} / actividad</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Nuevos Contactos</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2">{summaryKPIs.totalNuevosContactos}</p>
          <p className="text-[11px] text-neutral-500 mt-0.5 font-medium">Captados en territorio</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Cumplimiento Asistencia</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2">
            {summaryKPIs.cumpAsistenciaPromedio.toFixed(0)}%
          </p>
          <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden mt-1.5">
            <div
              className={`h-full rounded-full transition-all ${
                summaryKPIs.cumpAsistenciaPromedio >= 100
                  ? 'bg-emerald-500'
                  : summaryKPIs.cumpAsistenciaPromedio >= 70
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(summaryKPIs.cumpAsistenciaPromedio, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 col-span-2 lg:col-span-1 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-400 text-xs">
            <span>Estado del Semáforo</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
              🟢 {summaryKPIs.countVerde}
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
              🟡 {summaryKPIs.countAmarillo}
            </span>
            <span className="flex items-center gap-1 text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg">
              🔴 {summaryKPIs.countRojo}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-1 font-medium">{summaryKPIs.totalLeaders} Líderes monitoreados</p>
        </div>
      </div>

      {/* ─── 4. BARRA DE FILTROS GLOBALES ─── */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Selector de Año */}
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
          >
            <option value={2025}>Año 2025</option>
            <option value={2026}>Año 2026</option>
            <option value={2027}>Año 2027</option>
          </select>

          {/* Selector de Mes */}
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-semibold"
          >
            <option value="TODOS">Todos los Meses</option>
            {MESES_LISTA.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>

          {/* Selector de Líder (si es supervisor) */}
          {isSupervisor && (
            <select
              value={selectedLeaderId}
              onChange={e => setSelectedLeaderId(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500 max-w-[200px]"
            >
              <option value="ALL">Todos los Líderes</option>
              {accessibleUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.nombre_completo} ({u.rol.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          )}

          {/* Selector de Tipo de Actividad (solo para sub-pestaña de Plan) */}
          {activeSubTab === 'plan' && (
            <select
              value={selectedTipo}
              onChange={e => setSelectedTipo(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Todos los Tipos</option>
              <option value="REUNION_COMUNITARIA">Reunión Comunitaria</option>
              <option value="JORNADA_SOCIAL">Jornada Social</option>
              <option value="CAPACITACION">Capacitación</option>
              <option value="VISITA_TERRITORIAL">Visita Territorial</option>
              <option value="ACTIVIDAD_CULTURAL">Actividad Cultural</option>
            </select>
          )}

          {/* Filtro Semáforo (para sub-pestaña de Semáforo) */}
          {activeSubTab === 'semaforo' && (
            <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 p-1 rounded-xl">
              <button
                onClick={() => setSemaforoFilter('ALL')}
                className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition ${
                  semaforoFilter === 'ALL' ? 'bg-neutral-800 text-white' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSemaforoFilter('VERDE')}
                className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                  semaforoFilter === 'VERDE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-emerald-500 hover:text-emerald-400'
                }`}
              >
                🟢 Verde
              </button>
              <button
                onClick={() => setSemaforoFilter('AMARILLO')}
                className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                  semaforoFilter === 'AMARILLO' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-amber-500 hover:text-amber-400'
                }`}
              >
                🟡 Amarillo
              </button>
              <button
                onClick={() => setSemaforoFilter('ROJO')}
                className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                  semaforoFilter === 'ROJO' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-rose-500 hover:text-rose-400'
                }`}
              >
                🔴 Rojo
              </button>
            </div>
          )}
        </div>

        {/* Buscador Rápido */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por líder, barrio, puesto..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* ─── 5. CONTENIDO SEGÚN LA SUB-PESTAÑA SELECCIONADA ─── */}

      {/* ══════════════════════════════════════════════════════════════
          PESTAÑA 1: PLAN Y SEGUIMIENTO DE ACTIVIDADES TERRITORIALES
         ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'plan' && (
        <div className="space-y-4">
          {filteredActividades.length === 0 ? (
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-3xl p-12 text-center">
              <CalendarDays className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-neutral-300">No se encontraron actividades registradas</h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                No hay actividades comunitarias que coincidan con los filtros seleccionados. Comienza registrando una nueva actividad.
              </p>
              <button
                onClick={onOpenAddActivityModal}
                className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold inline-flex items-center gap-2 transition shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                Registrar Primera Actividad
              </button>
            </div>
          ) : (
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4">Fecha & Tipo</th>
                      <th className="py-3.5 px-4">Líder Responsable</th>
                      <th className="py-3.5 px-4">Puesto / Barrio</th>
                      <th className="py-3.5 px-4 text-center">Asistentes (Real / Meta)</th>
                      <th className="py-3.5 px-4 text-center">% Cumplimiento</th>
                      <th className="py-3.5 px-4 text-center">Nuevos Contactos</th>
                      <th className="py-3.5 px-4 text-right">Presupuesto vs Real</th>
                      <th className="py-3.5 px-4 text-center">Evidencia</th>
                      <th className="py-3.5 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {filteredActividades.map((act) => {
                      const leader = getLeaderInfo(act.lider_id);
                      const station = pollingStations.find(p => p.id === act.puesto_id);
                      const cumpPct = act.meta_asistentes > 0 ? (act.asistentes_reales / act.meta_asistentes) * 100 : 0;

                      return (
                        <tr key={act.id} className="hover:bg-neutral-800/40 transition">
                          {/* Fecha & Tipo */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-bold text-white flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                {act.fecha || 'Sin fecha'}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md mt-1 w-fit border border-indigo-500/20">
                                {formatTipoLabel(act.tipo_actividad)}
                              </span>
                            </div>
                          </td>

                          {/* Líder */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-300 shrink-0">
                                {leader.nombre_completo.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-neutral-200">{leader.nombre_completo}</p>
                                <p className="text-[10px] text-neutral-500">CC: {leader.cedula}</p>
                              </div>
                            </div>
                          </td>

                          {/* Puesto & Barrio */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col max-w-[180px]">
                              <span className="font-semibold text-neutral-300 truncate" title={station?.nombre_puesto || 'Puesto no asignado'}>
                                {station?.nombre_puesto || 'Puesto no asignado'}
                              </span>
                              <span className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                                {act.barrio || 'Barrio no especificado'}
                              </span>
                            </div>
                          </td>

                          {/* Asistentes (Real / Meta) */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="font-black text-white text-sm">
                              {act.asistentes_reales || 0}{' '}
                              <span className="text-xs font-normal text-neutral-500">/ {act.meta_asistentes || 0}</span>
                            </div>
                          </td>

                          {/* % Cumplimiento */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="inline-flex flex-col items-center">
                              <span
                                className={`text-xs font-black px-2 py-0.5 rounded-md border ${
                                  cumpPct >= 100
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                    : cumpPct >= 70
                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                                }`}
                              >
                                {cumpPct.toFixed(0)}%
                              </span>
                              <div className="w-16 bg-neutral-800 h-1 rounded-full overflow-hidden mt-1">
                                <div
                                  className={`h-full rounded-full ${
                                    cumpPct >= 100 ? 'bg-emerald-500' : cumpPct >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(cumpPct, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Nuevos Contactos */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg text-xs">
                              <Sparkles className="w-3 h-3" />
                              +{act.nuevos_contactos_generados || 0}
                            </span>
                          </td>

                          {/* Presupuesto vs Real */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex flex-col items-end">
                              <span className="font-semibold text-neutral-300">
                                {formatCurrency(act.costo_real)}
                              </span>
                              <span className="text-[10px] text-neutral-500">
                                Meta: {formatCurrency(act.costo_presupuestado)}
                              </span>
                            </div>
                          </td>

                          {/* Evidencia */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {act.evidencia_enlace ? (
                              <a
                                href={act.evidencia_enlace}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-indigo-400 hover:text-indigo-300 inline-flex items-center transition"
                                title="Abrir enlace de evidencia o fotografías"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <span className="text-neutral-600 text-[10px] italic">Sin foto</span>
                            )}
                          </td>

                          {/* Acciones */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setSelectedActivityDetail(act)}
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
                                title="Ver observaciones y detalle"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onEditActivity(act)}
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
                                title="Editar actividad"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(act.id)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                                title="Eliminar actividad"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          PESTAÑA 2: SEGUIMIENTO MENSUAL POR LÍDER Y SEMÁFORO (SHEET 2)
         ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'semaforo' && (
        <div className="space-y-4">
          {/* Explicación del Semáforo */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Lógica del Semáforo de Desempeño Territorial</h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Fórmula Excel aplicada: <code className="bg-neutral-950 px-1.5 py-0.5 rounded text-amber-300 font-mono text-[10px]">=SI(Y(K5&gt;=1;L5&gt;=1);"Verde";SI(O(K5&gt;=0.7;L5&gt;=0.7);"Amarillo";"Rojo"))</code>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-semibold flex-wrap">
              <span className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg">
                🟢 <strong>Verde:</strong> Ambos &gt;= 100%
              </span>
              <span className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg">
                🟡 <strong>Amarillo:</strong> Alguno &gt;= 70%
              </span>
              <span className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 px-2.5 py-1 rounded-lg">
                🔴 <strong>Rojo:</strong> Menor al 70%
              </span>
            </div>
          </div>

          {/* Tabla de Seguimiento Mensual */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Líder</th>
                    <th className="py-3.5 px-4 text-center">Meta Contactos</th>
                    <th className="py-3.5 px-4 text-center">Nuevos Contactos</th>
                    <th className="py-3.5 px-4 text-center">Contactos Activos</th>
                    <th className="py-3.5 px-4 text-center">Meta Actividades</th>
                    <th className="py-3.5 px-4 text-center">Actividades Realizadas</th>
                    <th className="py-3.5 px-4 text-center">Asistentes</th>
                    <th className="py-3.5 px-4 text-center">Cumpl. Contactos (K)</th>
                    <th className="py-3.5 px-4 text-center">Cumpl. Actividades (L)</th>
                    <th className="py-3.5 px-4 text-center">Semáforo</th>
                    <th className="py-3.5 px-4">Diagnóstico / Comentarios</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredScorecards.map((row) => (
                    <tr key={row.liderId} className="hover:bg-neutral-800/40 transition">
                      {/* Nombre y Rol */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center text-xs font-black text-white shrink-0">
                            {row.nombreLider.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white">{row.nombreLider}</p>
                            <span className="text-[10px] text-neutral-400 font-medium">
                              CC: {row.liderCedula} · {row.rol.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Meta Contactos */}
                      <td className="py-3.5 px-4 text-center font-semibold text-neutral-400">
                        {row.metaContactos}
                      </td>

                      {/* Nuevos Contactos */}
                      <td className="py-3.5 px-4 text-center font-bold text-white">
                        <span className="px-2 py-0.5 rounded-lg bg-neutral-800">
                          {row.nuevosContactos}
                        </span>
                      </td>

                      {/* Contactos Activos */}
                      <td className="py-3.5 px-4 text-center font-bold text-indigo-300">
                        {row.contactosActivos}
                      </td>

                      {/* Meta Actividades */}
                      <td className="py-3.5 px-4 text-center font-semibold text-neutral-400">
                        {row.metaActividades}
                      </td>

                      {/* Actividades Realizadas */}
                      <td className="py-3.5 px-4 text-center font-bold text-white">
                        <span className="px-2 py-0.5 rounded-lg bg-neutral-800">
                          {row.actividadesRealizadas}
                        </span>
                      </td>

                      {/* Asistentes Totales */}
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-400">
                        {row.asistentesTotales}
                      </td>

                      {/* Cumplimiento Contactos (K) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`font-black px-2 py-1 rounded-lg text-xs ${
                            row.ratioK >= 1
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : row.ratioK >= 0.7
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {row.cumpContactosPct.toFixed(1)}%
                        </span>
                      </td>

                      {/* Cumplimiento Actividades (L) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`font-black px-2 py-1 rounded-lg text-xs ${
                            row.ratioL >= 1
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : row.ratioL >= 0.7
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {row.cumpActividadesPct.toFixed(1)}%
                        </span>
                      </td>

                      {/* Semáforo */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-sm ${
                            row.semaforo === 'VERDE'
                              ? 'bg-emerald-500 text-neutral-950'
                              : row.semaforo === 'AMARILLO'
                              ? 'bg-amber-400 text-neutral-950'
                              : 'bg-rose-600 text-white'
                          }`}
                        >
                          {row.semaforo === 'VERDE' && '🟢 Verde'}
                          {row.semaforo === 'AMARILLO' && '🟡 Amarillo'}
                          {row.semaforo === 'ROJO' && '🔴 Rojo'}
                        </span>
                      </td>

                      {/* Diagnóstico */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-[11px] text-neutral-300 font-medium leading-relaxed">
                          {row.diagnostico}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          PESTAÑA 3: MÉTRICAS Y ANÁLISIS DE RENDIMIENTO TERRITORIAL
         ══════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'analisis' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribución por Tipo de Actividad */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Distribución por Tipo de Actividad
            </h3>
            <div className="space-y-3">
              {[
                { tipo: 'REUNION_COMUNITARIA', label: 'Reunión Comunitaria', color: 'bg-indigo-500' },
                { tipo: 'JORNADA_SOCIAL', label: 'Jornada Social', color: 'bg-emerald-500' },
                { tipo: 'CAPACITACION', label: 'Capacitación Formativa', color: 'bg-purple-500' },
                { tipo: 'VISITA_TERRITORIAL', label: 'Visita Territorial (Casa a Casa)', color: 'bg-amber-500' },
                { tipo: 'ACTIVIDAD_CULTURAL', label: 'Actividad Cultural / Deportiva', color: 'bg-rose-500' }
              ].map(item => {
                const count = filteredActividades.filter(a => a.tipo_actividad === item.tipo).length;
                const pct = summaryKPIs.totalActs > 0 ? (count / summaryKPIs.totalActs) * 100 : 0;
                return (
                  <div key={item.tipo} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-300">{item.label}</span>
                      <span className="font-bold text-white">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-neutral-800">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Líderes en Actividades Comunitarias */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Líderes con Mayor Convocatoria y Actividades
            </h3>
            <div className="space-y-3">
              {[...monthlyLeaderScorecards]
                .sort((a, b) => b.asistentesTotales - a.asistentesTotales)
                .slice(0, 5)
                .map((row, idx) => (
                  <div key={row.liderId} className="bg-neutral-950/70 border border-neutral-800 rounded-2xl p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center font-black text-xs text-white">
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">{row.nombreLider}</p>
                        <p className="text-[10px] text-neutral-400">{row.actividadesRealizadas} actividades realizadas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-emerald-400">{row.asistentesTotales} Asistentes</p>
                      <span className="text-[10px] font-bold text-neutral-400">+{row.nuevosContactos} contactos</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. MODAL DE DETALLES DE ACTIVIDAD ─── */}
      {selectedActivityDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Detalles de la Actividad</h3>
              </div>
              <button
                onClick={() => setSelectedActivityDetail(null)}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Tipo:</span>
                  <span className="font-bold text-white">{formatTipoLabel(selectedActivityDetail.tipo_actividad)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Fecha:</span>
                  <span className="font-bold text-white">{selectedActivityDetail.fecha}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Barrio:</span>
                  <span className="font-bold text-white">{selectedActivityDetail.barrio || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Puesto de Votación:</span>
                  <span className="font-bold text-white">{getPuestoName(selectedActivityDetail.puesto_id)}</span>
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Meta Asistentes:</span>
                  <span className="font-bold text-white">{selectedActivityDetail.meta_asistentes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Asistentes Reales:</span>
                  <span className="font-bold text-emerald-400">{selectedActivityDetail.asistentes_reales}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Nuevos Contactos:</span>
                  <span className="font-bold text-indigo-400">+{selectedActivityDetail.nuevos_contactos_generados}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Presupuesto / Real:</span>
                  <span className="font-bold text-white">{formatCurrency(selectedActivityDetail.costo_real)} / {formatCurrency(selectedActivityDetail.costo_presupuestado)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-neutral-400 mb-1">Observaciones y Acuerdos:</label>
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-neutral-200 min-h-[60px] whitespace-pre-wrap">
                  {selectedActivityDetail.observaciones || 'Sin observaciones registradas.'}
                </div>
              </div>

              {selectedActivityDetail.evidencia_enlace && (
                <div>
                  <label className="block font-semibold text-neutral-400 mb-1">Enlace de Evidencias:</label>
                  <a
                    href={selectedActivityDetail.evidencia_enlace}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:underline flex items-center gap-1.5 break-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    {selectedActivityDetail.evidencia_enlace}
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  const act = selectedActivityDetail;
                  setSelectedActivityDetail(null);
                  onEditActivity(act);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Editar Actividad
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
