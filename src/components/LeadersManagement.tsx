import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GitFork,
  UserPlus,
  Shield,
  Phone,
  Mail,
  MapPin,
  Vote,
  Target,
  ChevronRight,
  MessageCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { getRoleBadge, formatCedula, generateWhatsappLink, getInitials } from '../utils/helpers';
import { UserAccount, UserRole } from '../types';

export const LeadersManagement: React.FC = () => {
  const {
    users,
    supporters,
    currentUser,
    registerUser,
    updateUser,
    deleteUser,
    pollingStations,
  } = useApp();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCedula, setFormCedula] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('SUBLIDER');
  const [formSector, setFormSector] = useState('');
  const [formParentLeaderId, setFormParentLeaderId] = useState('');
  const [formStationId, setFormStationId] = useState('');
  const [formTarget, setFormTarget] = useState(200);
  const [formError, setFormError] = useState('');

  const openAddModal = (roleToPreselect: UserRole = 'SUBLIDER', parentId: string = '') => {
    setEditingUser(null);
    setFormName('');
    setFormCedula('');
    setFormPhone('');
    setFormEmail('');
    setFormRole(currentUser?.role === 'LIDER_COORDINADOR' ? 'SUBLIDER' : roleToPreselect);
    setFormSector(currentUser?.sector || '');
    setFormParentLeaderId(parentId || (currentUser?.role === 'LIDER_COORDINADOR' ? currentUser.id : ''));
    setFormStationId(currentUser?.assignedPollingStationId || pollingStations[0]?.id || '');
    setFormTarget(roleToPreselect === 'LIDER_COORDINADOR' ? 800 : 250);
    setFormError('');
    setShowAddModal(true);
  };

  const openEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormName(user.fullName);
    setFormCedula(user.cedula);
    setFormPhone(user.phone);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormSector(user.sector);
    setFormParentLeaderId(user.parentLeaderId || '');
    setFormStationId(user.assignedPollingStationId || '');
    setFormTarget(user.targetCount || 200);
    setFormError('');
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim() || !formCedula.trim() || !formPhone.trim()) {
      setFormError('Nombre, Cédula y Teléfono Móvil (WhatsApp) son obligatorios.');
      return;
    }

    const cleanCedula = formCedula.replace(/\D/g, '');
    const parentLeader = users.find(u => u.id === formParentLeaderId);
    const station = pollingStations.find(ps => ps.id === formStationId);

    if (editingUser) {
      updateUser({
        ...editingUser,
        cedula: cleanCedula,
        fullName: formName.trim(),
        role: formRole,
        phone: formPhone.trim(),
        email: formEmail.trim() || `${cleanCedula}@movimiento.org`,
        sector: formSector.trim() || 'Sector General',
        parentLeaderId: formRole === 'SUBLIDER' ? formParentLeaderId : undefined,
        parentLeaderName: formRole === 'SUBLIDER' ? parentLeader?.fullName : undefined,
        assignedPollingStationId: formStationId || undefined,
        assignedPollingStationName: station?.name || undefined,
        targetCount: Number(formTarget) || 200,
      });
      setShowAddModal(false);
    } else {
      // Check if cedula exists
      const exists = users.find(u => u.cedula.replace(/\D/g, '') === cleanCedula);
      if (exists) {
        setFormError(`La cédula ${formCedula} ya pertenece a ${exists.fullName}.`);
        return;
      }

      registerUser({
        cedula: cleanCedula,
        fullName: formName.trim(),
        role: formRole,
        phone: formPhone.trim(),
        email: formEmail.trim() || `${cleanCedula}@movimiento.org`,
        sector: formSector.trim() || 'Sector General',
        parentLeaderId: formRole === 'SUBLIDER' ? formParentLeaderId : undefined,
        parentLeaderName: formRole === 'SUBLIDER' ? parentLeader?.fullName : undefined,
        assignedPollingStationId: formStationId || undefined,
        assignedPollingStationName: station?.name || undefined,
        targetCount: Number(formTarget) || 200,
      });
      setShowAddModal(false);
    }
  };

  const mainLeaders = users.filter(u => u.role === 'LIDER_COORDINADOR');
  const superAdmins = users.filter(u => u.role === 'SUPER_ADMIN');

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-100">
              Estructura Territorial & Red de Líderes
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {users.length} miembros activos
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Jerarquía piramidal de mando: Super Admin → Líderes de Zona → Sublíderes de Base
          </p>
        </div>

        {/* Action button */}
        {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'LIDER_COORDINADOR') && (
          <div className="flex items-center gap-2">
            {currentUser.role === 'SUPER_ADMIN' && (
              <button
                type="button"
                onClick={() => openAddModal('LIDER_COORDINADOR')}
                className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>+ Nuevo Líder de Zona</span>
              </button>
            )}

            <button
              type="button"
              id="btn-add-subleader"
              onClick={() => openAddModal('SUBLIDER')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>+ Nuevo Sublíder</span>
            </button>
          </div>
        )}
      </div>

      {/* Role Hierarchy Explanation Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs">
        <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/30 space-y-1">
          <div className="font-bold text-rose-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Rol 1: Super Admin / Director
          </div>
          <p className="text-neutral-400 text-[11px]">
            Visión total de la campaña, exporta e importa bases de datos completas, administra todos los líderes y puestos.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/30 space-y-1">
          <div className="font-bold text-indigo-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            Rol 2: Líder Coordinador
          </div>
          <p className="text-neutral-400 text-[11px]">
            Coordina una Comuna o Sector completo. Dirige a sus sublíderes y monitorea los puestos de votación de su área.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/30 space-y-1">
          <div className="font-bold text-emerald-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Rol 3: Sublíder de Base
          </div>
          <p className="text-neutral-400 text-[11px]">
            Trabajo territorial puerta a puerta. Registra directamente a sus simpatizantes y confirma mesas electorales.
          </p>
        </div>
      </div>

      {/* Hierarchy Cards: Super Admin -> Leaders -> Subleaders */}
      <div className="space-y-6">
        {/* Super Admins Section */}
        {superAdmins.map((admin) => (
          <div
            key={admin.id}
            className="p-5 rounded-3xl bg-neutral-900/90 border border-rose-900/40 shadow-sm space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 flex items-center justify-center text-white font-bold text-base shadow-md shadow-rose-600/30">
                  {getInitials(admin.fullName)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-neutral-100">{admin.fullName}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Super Admin
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-3 mt-0.5">
                    <span>C.C. {formatCedula(admin.cedula)}</span>
                    <span>•</span>
                    <a
                      href={generateWhatsappLink(admin.phone, 'Hola Director, reporte del estado de la campaña.')}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{admin.phone}</span>
                    </a>
                    <span>•</span>
                    <span>{admin.email}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-neutral-400">Meta Global Movimiento</div>
                <div className="text-lg font-bold text-neutral-100">
                  {supporters.length} / {admin.targetCount || 5000} Votos
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Líderes Coordinadores & their Sublíderes */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-neutral-300 uppercase tracking-wider px-1 flex items-center gap-2">
            <GitFork className="w-4 h-4 text-indigo-400" />
            <span>Líderes de Zona y sus Redes de Sublíderes</span>
          </h2>

          <div className="space-y-4">
            {mainLeaders.map((leader) => {
              const subleaders = users.filter(u => u.parentLeaderId === leader.id);
              const subleaderIds = new Set(subleaders.map(u => u.id));
              const leaderVoters = supporters.filter(s =>
                s.registeredByLeaderId === leader.id || (s.registeredBySubleaderId && subleaderIds.has(s.registeredBySubleaderId))
              );
              const directVoters = supporters.filter(s => s.registeredByLeaderId === leader.id && !s.registeredBySubleaderId);
              const goal = leader.targetCount || 800;
              const pct = Math.min(100, Math.round((leaderVoters.length / goal) * 100));

              return (
                <div
                  key={leader.id}
                  className="bg-neutral-900/90 border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-sm"
                >
                  {/* Leader Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-neutral-800/80">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-600/30 shrink-0">
                        {getInitials(leader.fullName)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-neutral-100">
                            {leader.fullName}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                            Líder de Zona
                          </span>
                        </div>
                        <div className="text-xs text-neutral-400 flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="text-neutral-300 font-medium">{leader.sector}</span>
                          <span>•</span>
                          <span>C.C. {formatCedula(leader.cedula)}</span>
                          <span>•</span>
                          <a
                            href={generateWhatsappLink(leader.phone, `Hola ${leader.fullName}, ¿cómo va la coordinación en ${leader.sector}?`)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>{leader.phone}</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end lg:self-auto">
                      <div className="text-right">
                        <div className="text-xs font-bold text-neutral-200">
                          {leaderVoters.length} / {goal} Votantes ({pct}%)
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {subleaders.length} Sublíderes • {directVoters.length} Directos
                        </div>
                      </div>

                      {currentUser?.role === 'SUPER_ADMIN' && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditModal(leader)}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                            title="Editar Líder"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteUser(leader.id)}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-900/60 text-neutral-400 hover:text-rose-400"
                            title="Eliminar Líder"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subleaders Grid belonging to this leader */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                      <span className="font-semibold uppercase tracking-wider text-[11px]">
                        Sublíderes Asignados ({subleaders.length}):
                      </span>

                      {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.id === leader.id) && (
                        <button
                          type="button"
                          onClick={() => openAddModal('SUBLIDER', leader.id)}
                          className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 text-[11px]"
                        >
                          <span>+ Agregar Sublíder a {leader.fullName.split(' ')[0]}</span>
                        </button>
                      )}
                    </div>

                    {subleaders.length === 0 ? (
                      <div className="p-4 text-center rounded-2xl bg-neutral-950/60 border border-neutral-800/80 text-xs text-neutral-500">
                        Este líder no tiene sublíderes asignados aún.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {subleaders.map((sub) => {
                          const subVoters = supporters.filter(s => s.registeredBySubleaderId === sub.id);
                          const subGoal = sub.targetCount || 200;
                          const subPct = Math.min(100, Math.round((subVoters.length / subGoal) * 100));

                          return (
                            <div
                              key={sub.id}
                              className="p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 space-y-2.5 hover:border-neutral-700 transition"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="font-semibold text-neutral-100 text-xs truncate">
                                    {sub.fullName}
                                  </div>
                                  <div className="text-[11px] text-neutral-400 truncate">
                                    {sub.sector}
                                  </div>
                                </div>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                                  {subVoters.length} votos
                                </span>
                              </div>

                              <div className="text-[11px] text-neutral-400 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span>C.C. {formatCedula(sub.cedula)}</span>
                                  <a
                                    href={generateWhatsappLink(sub.phone, `Hola ${sub.fullName}, ¿cómo avanza el registro de personas en ${sub.sector}?`)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                                  >
                                    <MessageCircle className="w-3 h-3" />
                                    <span>{sub.phone}</span>
                                  </a>
                                </div>

                                {sub.assignedPollingStationName && (
                                  <div className="text-[10px] text-neutral-500 truncate flex items-center gap-1">
                                    <Vote className="w-3 h-3 text-indigo-400 shrink-0" />
                                    <span className="truncate">{sub.assignedPollingStationName}</span>
                                  </div>
                                )}
                              </div>

                              {/* Goal Progress */}
                              <div className="space-y-1 pt-1">
                                <div className="flex justify-between text-[10px] text-neutral-400">
                                  <span>Meta: {subGoal}</span>
                                  <span>{subPct}%</span>
                                </div>
                                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${subPct}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Edit / Delete actions */}
                              {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.id === leader.id) && (
                                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditModal(sub)}
                                    className="text-[10px] text-neutral-400 hover:text-neutral-200 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteUser(sub.id)}
                                    className="text-[10px] text-rose-400 hover:text-rose-300 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-neutral-900 border border-neutral-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-base font-bold text-neutral-100">
                {editingUser ? 'Editar Miembro de Estructura' : 'Registrar Nuevo Líder o Sublíder'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-300 font-semibold">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Claudia Marcela Gómez"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-neutral-300 font-semibold">Cédula *</label>
                  <input
                    type="text"
                    required
                    value={formCedula}
                    onChange={(e) => setFormCedula(e.target.value)}
                    placeholder="Sin puntos"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-300 font-semibold">WhatsApp Móvil *</label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="3001234567"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-neutral-300 font-semibold">Rol Asignado</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as UserRole)}
                    disabled={currentUser?.role === 'LIDER_COORDINADOR'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100"
                  >
                    <option value="SUBLIDER">Sublíder de Base</option>
                    <option value="LIDER_COORDINADOR">Líder de Zona / Comuna</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-300 font-semibold">Meta de Votos</label>
                  <input
                    type="number"
                    value={formTarget}
                    onChange={(e) => setFormTarget(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100"
                  />
                </div>
              </div>

              {formRole === 'SUBLIDER' && (
                <div className="space-y-1">
                  <label className="text-neutral-300 font-semibold">Líder Principal Asignado</label>
                  <select
                    value={formParentLeaderId}
                    onChange={(e) => setFormParentLeaderId(e.target.value)}
                    disabled={currentUser?.role === 'LIDER_COORDINADOR'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100"
                  >
                    <option value="">Seleccione el Líder</option>
                    {mainLeaders.map((ldr) => (
                      <option key={ldr.id} value={ldr.id}>
                        {ldr.fullName} ({ldr.sector})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-neutral-300 font-semibold">Sector / Comuna</label>
                  <input
                    type="text"
                    value={formSector}
                    onChange={(e) => setFormSector(e.target.value)}
                    placeholder="Ej: Comuna 1 Norte"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-300 font-semibold">Puesto de Votación</label>
                  <select
                    value={formStationId}
                    onChange={(e) => setFormStationId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100"
                  >
                    <option value="">Seleccionar Puesto</option>
                    {pollingStations.map((ps) => (
                      <option key={ps.id} value={ps.id}>
                        {ps.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
