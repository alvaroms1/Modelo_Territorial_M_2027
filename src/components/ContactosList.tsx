import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { useConfirm } from '../context/ConfirmContext';
import { Contacto, UserAccount, UserRole, EstadoLider, NivelActividad } from '../types';
import {
  Search, RefreshCw, Vote, MapPin, Users, Calendar,
  MessageCircle, UserPlus, Edit2, Trash2, Home, Crown, UserCheck, ShieldCheck,
  Check, Lock, Sparkles, X, ShieldAlert
} from 'lucide-react';
import { smartSearch } from '../utils/helpers';
import { LOCALIDADES_CARTAGENA } from '../data/cartagenaData';

interface ContactosListProps {
  onOpenAddModal: () => void;
  onEditContacto: (contacto: Contacto) => void;
}

export const ContactosList: React.FC<ContactosListProps> = ({ onOpenAddModal, onEditContacto }) => {
  const { visibleContactos, pollingStations, users, deleteContacto, deleteUser, updateUser, updateLeaderGoals, currentUser } = useApp();
  const { confirm } = useConfirm();

  const isAdmin = currentUser?.rol === 'ADMIN';

  // Category Tab
  const [categoryTab, setCategoryTab] = useState<'ALL' | 'LIDERES' | 'CONTACTOS'>('ALL');

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [rolFiltro, setRolFiltro] = useState('');
  const [puestoFiltro, setPuestoFiltro] = useState('');
  const [sectorFiltro, setSectorFiltro] = useState('');
  const [generoFiltro, setGeneroFiltro] = useState('');
  const [edadFiltro, setEdadFiltro] = useState('');
  const [liderFiltro, setLiderFiltro] = useState('');
  const [subliderFiltro, setSubliderFiltro] = useState('');
  const [barrioFiltro, setBarrioFiltro] = useState('');
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // State for Admin Leader Edit Modal
  const [editingLeaderUser, setEditingLeaderUser] = useState<UserAccount | null>(null);
  const [editForm, setEditForm] = useState<{
    nombre_completo: string;
    telefono: string;
    correo: string;
    barrio_residencia: string;
    comuna_localidad: string;
    zona_mayor_influencia: string;
    rol: UserRole;
    lider_principal_id?: string;
    estado: EstadoLider;
    nivel_actividad: NivelActividad;
    meta_contactos_mes: number;
    meta_actividades_mes: number;
    new_password?: string;
  }>({
    nombre_completo: '',
    telefono: '',
    correo: '',
    barrio_residencia: '',
    comuna_localidad: '',
    zona_mayor_influencia: '',
    rol: 'LIDER',
    estado: 'ACTIVO',
    nivel_actividad: 'ALTO',
    meta_contactos_mes: 20,
    meta_actividades_mes: 4,
    new_password: ''
  });
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // ═════════════════════════════════════════════════════════════
  // 1. CONSTRUCCIÓN DE TODOS LOS REGISTROS (LÍDERES + CONTACTOS)
  // ═════════════════════════════════════════════════════════════
  const allListItems = useMemo(() => {
    if (!isAdmin) {
      return visibleContactos;
    }

    // Map users to directory items for unified admin management
    const usersAsItems: (Contacto & { isUserAccount?: boolean; originalUser?: UserAccount })[] = users.map(u => ({
      id: u.id,
      nombres: u.nombre_completo,
      apellidos: '',
      cedula: u.cedula,
      telefono: u.telefono || '',
      correo: u.correo || '',
      barrio: u.barrio_residencia || '',
      sector_comuna: u.comuna_localidad || '',
      puesto_id: (u as any).puesto_id || '',
      mesa: 'Directiva',
      lider_id: u.lider_principal_id || '',
      sublider_id: '',
      rol: u.rol as any,
      estado: u.estado as any,
      consentimiento_datos: u.consentimiento_datos,
      isUserAccount: true,
      originalUser: u,
      created_at: u.created_at
    }));

    return [...usersAsItems, ...visibleContactos];
  }, [users, visibleContactos, isAdmin]);

  const uniqueSectores = useMemo(() => {
    return Array.from(new Set(allListItems.map(c => c.sector_comuna).filter(Boolean)));
  }, [allListItems]);

  const uniqueBarrios = useMemo(() => {
    return Array.from(new Set(allListItems.map(c => c.barrio).filter(Boolean)));
  }, [allListItems]);

  const uniqueGeneros = useMemo(() => {
    return Array.from(new Set(allListItems.map(c => c.genero).filter(Boolean)));
  }, [allListItems]);
  
  const uniqueLideres = useMemo(() => {
    return users.filter(u => 
      u.rol === 'LIDER_PRINCIPAL' || u.rol === 'LIDER_PRINCIPAL_INVITADO' || u.rol === 'LIDER'
    );
  }, [users]);
  
  const uniqueSublideres = useMemo(() => {
    return users.filter(u => u.rol === 'SUBLIDER').map(u => ({
      id: u.id,
      nombre_completo: u.nombre_completo
    }));
  }, [users]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setRolFiltro('');
    setPuestoFiltro('');
    setSectorFiltro('');
    setGeneroFiltro('');
    setEdadFiltro('');
    setLiderFiltro('');
    setSubliderFiltro('');
    setBarrioFiltro('');
  };

  const filteredContactos = useMemo(() => {
    return allListItems.filter(c => {
      // Filter by Category Tab
      if (categoryTab === 'LIDERES' && !(c as any).isUserAccount) return false;
      if (categoryTab === 'CONTACTOS' && (c as any).isUserAccount) return false;

      // Search Query
      if (searchTerm) {
        const matchesSearch = smartSearch([
          c.nombres,
          c.apellidos,
          c.cedula,
          c.telefono,
          c.correo,
          c.barrio,
          c.sector_comuna,
          c.rol,
          c.mesa
        ], searchTerm);
        if (!matchesSearch) return false;
      }

      // Filter by Role
      if (rolFiltro && c.rol !== rolFiltro) return false;

      // Filter by Polling Station
      if (puestoFiltro && c.puesto_id !== puestoFiltro) return false;
      if (sectorFiltro && c.sector_comuna !== sectorFiltro) return false;
      if (generoFiltro && c.genero !== generoFiltro) return false;
      
      if (edadFiltro && c.edad) {
        if (edadFiltro === '18-25' && (c.edad < 18 || c.edad > 25)) return false;
        if (edadFiltro === '26-35' && (c.edad < 26 || c.edad > 35)) return false;
        if (edadFiltro === '36-50' && (c.edad < 36 || c.edad > 50)) return false;
        if (edadFiltro === '51+' && c.edad <= 50) return false;
      }

      if (liderFiltro && c.lider_id !== liderFiltro) return false;
      if (subliderFiltro && c.sublider_id !== subliderFiltro) return false;
      if (barrioFiltro && c.barrio !== barrioFiltro) return false;

      return true;
    });
  }, [allListItems, categoryTab, searchTerm, rolFiltro, puestoFiltro, sectorFiltro, generoFiltro, edadFiltro, liderFiltro, subliderFiltro, barrioFiltro]);

  const activeFiltersCount = [searchTerm, rolFiltro, puestoFiltro, sectorFiltro, generoFiltro, edadFiltro, liderFiltro, subliderFiltro, barrioFiltro].filter(Boolean).length;

  const countLideres = allListItems.filter(r => (r as any).isUserAccount).length;
  const countContactos = allListItems.filter(r => !(r as any).isUserAccount).length;

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredContactos.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredContactos.map(c => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // ═════════════════════════════════════════════════════════════
  // 2. EDICIÓN EXCLUSIVA PARA ADMIN (LÍDERES/SUPERVISORES)
  // ═════════════════════════════════════════════════════════════
  const handleOpenEditUser = (user: UserAccount) => {
    if (!isAdmin) {
      alert('Solo el Administrador General puede editar usuarios y líderes del sistema.');
      return;
    }
    setEditingLeaderUser(user);
    setEditForm({
      nombre_completo: user.nombre_completo || '',
      telefono: user.telefono || '',
      correo: user.correo || '',
      barrio_residencia: user.barrio_residencia || '',
      comuna_localidad: user.comuna_localidad || '',
      zona_mayor_influencia: user.zona_mayor_influencia || '',
      rol: user.rol,
      lider_principal_id: user.lider_principal_id || '',
      estado: user.estado || 'ACTIVO',
      nivel_actividad: user.nivel_actividad || 'ALTO',
      meta_contactos_mes: user.meta_contactos_mes > 0 ? user.meta_contactos_mes : 20,
      meta_actividades_mes: (user as any).meta_actividades_mes > 0 ? (user as any).meta_actividades_mes : 4,
      new_password: ''
    });
    setSaveSuccessMsg('');
  };

  const handleSaveLeaderUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLeaderUser || !isAdmin) return;

    setIsSavingUser(true);
    try {
      const updates: Partial<UserAccount> = {
        nombre_completo: editForm.nombre_completo.toUpperCase(),
        telefono: editForm.telefono || undefined,
        correo: editForm.correo || undefined,
        barrio_residencia: editForm.barrio_residencia || undefined,
        comuna_localidad: editForm.comuna_localidad || undefined,
        zona_mayor_influencia: editForm.zona_mayor_influencia || undefined,
        rol: editForm.rol,
        lider_principal_id: (editForm.rol === 'LIDER' || editForm.rol === 'SUBLIDER') ? (editForm.lider_principal_id || undefined) : undefined,
        estado: editForm.estado,
        nivel_actividad: editForm.nivel_actividad,
        meta_contactos_mes: editForm.meta_contactos_mes
      };

      if (editForm.new_password && editForm.new_password.trim()) {
        updates.password = editForm.new_password.trim();
      }

      const res = await updateUser(editingLeaderUser.id, updates);
      if (res.success) {
        await updateLeaderGoals(editingLeaderUser.id, editForm.meta_contactos_mes, editForm.meta_actividades_mes);
        setSaveSuccessMsg('¡Usuario líder actualizado con éxito!');
        setTimeout(() => {
          setEditingLeaderUser(null);
          setSaveSuccessMsg('');
        }, 1000);
      } else {
        alert(res.error || 'Error al guardar los cambios del usuario');
      }
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleDelete = async (contacto: any) => {
    const fullName = `${contacto.nombres || ''} ${contacto.apellidos || ''}`.trim() || 'este registro';
    
    if (contacto.isUserAccount) {
      if (!isAdmin) {
        alert('Solo el Administrador General puede eliminar cuentas de líderes y supervisores.');
        return;
      }
      const isConfirmed = await confirm(`¿Estás seguro de que deseas eliminar permanentemente la cuenta del líder "${fullName}"? Esta acción removerá su acceso al sistema.`);
      if (isConfirmed) {
        await deleteUser(contacto.id);
      }
      return;
    }

    const isConfirmed = await confirm(`¿Estás seguro de que deseas eliminar al contacto "${fullName}"? Esta acción no se puede deshacer.`);
    if (isConfirmed) {
      await deleteContacto(contacto.id);
    }
  };

  const getPuestoName = (id?: string) => {
    if (!id) return 'No asignado';
    const station = pollingStations.find(p => p.id === id);
    return station?.nombre_puesto || (station as any)?.nombre || 'Desconocido';
  };

  const getLiderName = (id?: string) => {
    if (!id) return 'N/A';
    return users.find(u => u.id === id)?.nombre_completo || 'Desconocido';
  };

  const formatBadgeRole = (rol: string) => {
    switch (rol) {
      case 'ADMIN':
        return { label: 'Administrador General', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'LIDER_PRINCIPAL':
        return { label: 'Líder Principal', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'LIDER_PRINCIPAL_INVITADO':
        return { label: 'Líder Princ. Invitado', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
      case 'LIDER':
        return { label: 'Líder Territorial', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'SUBLIDER':
        return { label: 'Sublíder', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      default:
        return { label: rol.replace(/_/g, ' '), bg: 'bg-neutral-800 text-neutral-300 border-neutral-700' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ─── HEADER SECTION ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-400" />
              Directorio General de Contactos y Líderes
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {allListItems.length} Registros Totales
            </span>
          </div>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1">
            {isAdmin 
              ? 'Gestión integral de Líderes Supervisores, Líderes Territoriales y Simpatizantes' 
              : 'Directorio de personas y simpatizantes asignados a tu estructura'}
          </p>
        </div>

        <button 
          onClick={onOpenAddModal} 
          className="bg-gradient-to-r from-indigo-600 to-rose-600 hover:opacity-90 transition px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Añadir Contacto</span>
        </button>
      </div>

      {/* ─── PESTAÑAS DE CATEGORÍA (TODOS / LÍDERES / SIMPATIZANTES) ─── */}
      {isAdmin && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <button
            onClick={() => setCategoryTab('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              categoryTab === 'ALL'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Todos los Registros</span>
            <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px]">
              {allListItems.length}
            </span>
          </button>

          <button
            onClick={() => setCategoryTab('LIDERES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              categoryTab === 'LIDERES'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <Crown className="w-4 h-4 text-purple-300" />
            <span>Estructura de Líderes y Supervisores</span>
            <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px]">
              {countLideres}
            </span>
          </button>

          <button
            onClick={() => setCategoryTab('CONTACTOS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              categoryTab === 'CONTACTOS'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-300" />
            <span>Directorio de Simpatizantes</span>
            <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px]">
              {countContactos}
            </span>
          </button>
        </div>
      )}

      {/* ─── FILTER BAR SECTION ─── */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar por Cédula, Nombres, Teléfono, Barrio o Puesto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-white text-sm pl-9 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none transition"
            />
          </div>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition text-xs font-bold flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Limpiar Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-neutral-800">
          
          {/* Filtro de Rol */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Rol Asignado
            </label>
            <select
              value={rolFiltro}
              onChange={(e) => setRolFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none"
            >
              <option value="">Todos los Roles y Estados</option>
              {isAdmin && (
                <>
                  <option value="LIDER_PRINCIPAL">⭐ Líder Principal</option>
                  <option value="LIDER_PRINCIPAL_INVITADO">⭐ Líder Principal Invitado</option>
                  <option value="LIDER">👥 Líder Territorial</option>
                  <option value="SUBLIDER">🌱 Sublíder</option>
                </>
              )}
              <option value="CONTACTO">📋 Contacto / Simpatizante</option>
            </select>
          </div>

          {/* Filtro Puesto */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Vote className="w-3.5 h-3.5 text-indigo-400" /> Puesto de Votación
            </label>
            <select
              value={puestoFiltro}
              onChange={(e) => setPuestoFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none"
            >
              <option value="">Todos los Puestos</option>
              {pollingStations.map(p => (
                <option key={p.id} value={p.id}>{p.nombre_puesto || (p as any).nombre}</option>
              ))}
            </select>
          </div>

          {/* Filtro Sector */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-rose-400" /> Sector / Comuna
            </label>
            <select
              value={sectorFiltro}
              onChange={(e) => setSectorFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-rose-500/50 outline-none"
            >
              <option value="">Todos los Sectores</option>
              {uniqueSectores.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Filtro Barrio */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Home className="w-3.5 h-3.5 text-emerald-400" /> Barrio
            </label>
            <select
              value={barrioFiltro}
              onChange={(e) => setBarrioFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none"
            >
              <option value="">Todos los Barrios</option>
              {uniqueBarrios.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── TABLE SECTION ─── */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              checked={filteredContactos.length > 0 && selectedIds.size === filteredContactos.length}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded bg-neutral-950 border-neutral-700 text-indigo-500 focus:ring-indigo-500/30"
            />
            <span className="text-xs text-neutral-400">
              Mostrando <strong>{filteredContactos.length}</strong> registros
            </span>
          </div>
          {isAdmin && (
            <span className="text-[11px] text-amber-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Acceso de Administrador: Edición total habilitada
            </span>
          )}
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 bg-neutral-950 border-b border-neutral-800">
              <tr>
                <th className="px-4 py-3.5 w-10"></th>
                <th className="px-4 py-3.5">PERSONA / CÉDULA</th>
                <th className="px-4 py-3.5">CONTACTO / WHATSAPP</th>
                <th className="px-4 py-3.5">DEMOGRAFÍA / UBICACIÓN</th>
                <th className="px-4 py-3.5">PUESTO & MESA</th>
                <th className="px-4 py-3.5">ESTRUCTURA RESPONSABLE</th>
                <th className="px-4 py-3.5">ROL ASIGNADO</th>
                <th className="px-4 py-3.5 text-center sticky right-0 bg-neutral-950 border-l border-neutral-800 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.5)]">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredContactos.map((item) => {
                const isUser = Boolean((item as any).isUserAccount);
                const badge = formatBadgeRole(item.rol);
                const originalUser = (item as any).originalUser as UserAccount | undefined;

                return (
                  <tr key={`${isUser ? 'usr' : 'cnt'}_${item.id}`} className="hover:bg-neutral-800/40 transition group">
                    <td className="px-4 py-3.5">
                      <input 
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="w-4 h-4 rounded bg-neutral-950 border-neutral-700 text-indigo-500 focus:ring-indigo-500/30"
                      />
                    </td>

                    {/* Persona / Cédula */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-white text-sm">
                          {item.nombres} {item.apellidos}
                        </div>
                        {isUser && (
                          <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-black">
                            USUARIO APP
                          </span>
                        )}
                      </div>
                      <div className="text-neutral-400 mt-0.5 font-mono text-[11px]">
                        CC: {item.cedula}
                      </div>
                    </td>

                    {/* Contacto / WhatsApp */}
                    <td className="px-4 py-3.5">
                      {item.telefono ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-0.5 font-mono text-xs">
                          <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                          {item.telefono}
                        </div>
                      ) : (
                        <div className="text-neutral-600 mb-0.5 text-xs">Sin teléfono</div>
                      )}
                      {item.correo && <div className="text-neutral-400 text-[11px]">{item.correo}</div>}
                    </td>

                    {/* Demografía / Ubicación */}
                    <td className="px-4 py-3.5">
                      <div className="text-neutral-200 font-medium mb-0.5">
                        {item.genero ? `${item.genero}, ${item.edad || '-'}a` : (item.barrio || 'Cartagena')}
                      </div>
                      <div className="text-neutral-400 text-[11px]">
                        {item.barrio} {item.sector_comuna && `(${item.sector_comuna})`}
                      </div>
                    </td>

                    {/* Puesto & Mesa */}
                    <td className="px-4 py-3.5">
                      <div className="text-neutral-200 font-bold mb-0.5 truncate max-w-[200px]" title={getPuestoName(item.puesto_id)}>
                        {isUser ? 'Coordinación Territorial' : getPuestoName(item.puesto_id)}
                      </div>
                      <div className="text-indigo-400 font-medium text-[11px]">
                        {isUser ? 'Comité Directivo' : `Mesa: ${item.mesa || 'N/A'}`}
                      </div>
                    </td>

                    {/* Estructura Responsable */}
                    <td className="px-4 py-3.5">
                      {isUser ? (
                        <div className="text-neutral-300 text-xs">
                          {item.rol === 'LIDER_PRINCIPAL' ? 'Coordinación Central' : `Supervisado por: ${getLiderName(item.lider_id)}`}
                        </div>
                      ) : (
                        <div className="text-neutral-300 mb-0.5 text-xs">
                          Líder: <span className="font-bold text-white">{getLiderName(item.lider_id)}</span>
                        </div>
                      )}
                    </td>

                    {/* Rol Asignado */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3.5 sticky right-0 bg-neutral-950 border-l border-neutral-800 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center justify-center gap-1.5">
                        {item.telefono && (
                          <button 
                            title="Chat WhatsApp"
                            onClick={() => window.open(`https://wa.me/57${item.telefono.replace(/\D/g, '')}`, '_blank')}
                            className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/20 transition cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {/* Botón Editar */}
                        <button 
                          title={isUser ? (isAdmin ? "Editar Líder / Supervisor" : "Solo Admin puede editar") : "Editar Contacto"}
                          onClick={() => {
                            if (isUser && originalUser) {
                              handleOpenEditUser(originalUser);
                            } else {
                              onEditContacto(item);
                            }
                          }} 
                          className="p-2 bg-neutral-800 text-neutral-300 hover:text-amber-400 hover:bg-neutral-700 rounded-xl border border-neutral-700 transition cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Botón Eliminar */}
                        <button 
                          title="Eliminar"
                          onClick={() => handleDelete(item)}
                          className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl border border-rose-500/20 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredContactos.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-neutral-500">
                    No se encontraron registros con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MODAL DE EDICIÓN DE LÍDER / SUPERVISOR (EXCLUSIVO ADMIN)
         ══════════════════════════════════════════════════════════════ */}
      {editingLeaderUser && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-950/50 via-neutral-900 to-neutral-900 p-5 border-b border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Editar Cuenta de Líder / Supervisor
                  </h3>
                  <p className="text-xs text-neutral-400">
                    CC: {editingLeaderUser.cedula} · Rol actual: {editingLeaderUser.rol.replace(/_/g, ' ')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingLeaderUser(null)}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveLeaderUser} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              
              {saveSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Nombre Completo */}
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-bold text-neutral-300">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.nombre_completo}
                    onChange={e => setEditForm({ ...editForm, nombre_completo: e.target.value.toUpperCase() })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Rol */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-purple-300">
                    Rol en la Estructura *
                  </label>
                  <select
                    value={editForm.rol}
                    onChange={e => setEditForm({ ...editForm, rol: e.target.value as UserRole })}
                    className="w-full bg-neutral-950 border border-purple-500/40 rounded-xl px-3.5 py-2 text-xs text-white font-bold focus:outline-none focus:border-purple-500"
                  >
                    <option value="LIDER_PRINCIPAL">⭐ Líder Principal</option>
                    <option value="LIDER_PRINCIPAL_INVITADO">⭐ Líder Principal Invitado</option>
                    <option value="LIDER">👥 Líder Territorial</option>
                    <option value="SUBLIDER">🌱 Sublíder</option>
                  </select>
                </div>

                {/* Estado */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-300">
                    Estado de la Cuenta *
                  </label>
                  <select
                    value={editForm.estado}
                    onChange={e => setEditForm({ ...editForm, estado: e.target.value as EstadoLider })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white font-bold focus:outline-none focus:border-purple-500"
                  >
                    <option value="ACTIVO">🟢 ACTIVO (Acceso Total)</option>
                    <option value="EN_FORMACION">🟡 EN FORMACIÓN</option>
                    <option value="EN_PAUSA">🟠 EN PAUSA</option>
                    <option value="RETIRADO">🔴 RETIRADO (Sin Acceso)</option>
                  </select>
                </div>

                {/* Teléfono */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-300">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={editForm.telefono}
                    onChange={e => setEditForm({ ...editForm, telefono: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    placeholder="3001234567"
                  />
                </div>

                {/* Correo Electrónico */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-300">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    value={editForm.correo}
                    onChange={e => setEditForm({ ...editForm, correo: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    placeholder="correo@ejemplo.com"
                  />
                </div>

                {/* Barrio */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-300">
                    Barrio de Residencia
                  </label>
                  <input
                    type="text"
                    value={editForm.barrio_residencia}
                    onChange={e => setEditForm({ ...editForm, barrio_residencia: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                    placeholder="Ej. Boston, Manga"
                  />
                </div>

                {/* Comuna / Localidad */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-300">
                    Localidad / Sector
                  </label>
                  <select
                    value={editForm.comuna_localidad}
                    onChange={e => setEditForm({ ...editForm, comuna_localidad: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Seleccionar Localidad</option>
                    {LOCALIDADES_CARTAGENA.map(loc => (
                      <option key={loc.id} value={loc.nombre}>{loc.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Meta Contactos */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-indigo-300">
                    Meta de Nuevos Contactos (Mes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.meta_contactos_mes === 0 ? '' : editForm.meta_contactos_mes}
                    onFocus={e => e.target.select()}
                    onChange={e => setEditForm({ ...editForm, meta_contactos_mes: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-neutral-950 border border-indigo-500/40 rounded-xl px-3.5 py-2 text-xs text-indigo-200 font-bold focus:outline-none focus:border-indigo-500"
                    placeholder="20"
                  />
                </div>

                {/* Meta Actividades */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-emerald-300">
                    Meta de Actividades (Mes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.meta_actividades_mes === 0 ? '' : editForm.meta_actividades_mes}
                    onFocus={e => e.target.select()}
                    onChange={e => setEditForm({ ...editForm, meta_actividades_mes: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-neutral-950 border border-emerald-500/40 rounded-xl px-3.5 py-2 text-xs text-emerald-200 font-bold focus:outline-none focus:border-emerald-500"
                    placeholder="4"
                  />
                </div>

                {/* Restablecer Contraseña (Admin) */}
                <div className="sm:col-span-2 space-y-1 bg-neutral-950 p-3 rounded-2xl border border-neutral-800">
                  <label className="block text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Restablecer Contraseña (Opcional)
                  </label>
                  <input
                    type="text"
                    value={editForm.new_password}
                    onChange={e => setEditForm({ ...editForm, new_password: e.target.value })}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="Dejar en blanco para conservar la contraseña actual"
                  />
                  <p className="text-[10px] text-neutral-500">
                    Si el líder olvidó su clave, ingresa aquí una nueva para que pueda iniciar sesión.
                  </p>
                </div>

              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setEditingLeaderUser(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-700 text-neutral-300 hover:bg-neutral-800 text-xs font-medium transition cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSavingUser || !editForm.nombre_completo.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-xs sm:text-sm font-bold shadow-lg shadow-purple-600/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {isSavingUser ? 'Guardando...' : '✓ Guardar Cambios de Líder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

