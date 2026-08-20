import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, UserAccount } from '../types';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  GitFork,
  ChevronRight,
  UserPlus,
  Shield,
  Phone,
  UserCheck,
  Search
} from 'lucide-react';
import { smartSearch } from '../utils/helpers';

export const LeadersManagement: React.FC = () => {
  const { visibleUsers, updateUser, deleteUser, currentUser, visibleContactos, updateContacto, deleteContacto } = useApp();
  const { confirm } = useConfirm();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [leaderSearch, setLeaderSearch] = useState('');
  
  // Pending approvals state: stores selected role & parent leader for each pending user
  const [pendingRoles, setPendingRoles] = useState<{ [userId: string]: { rol: UserRole; lider_principal_id?: string } }>({});

  const isAdmin = currentUser?.rol === 'ADMIN' || currentUser?.rol === 'LIDER_PRINCIPAL';
  const isLiderPrincipal = currentUser?.rol === 'LIDER_PRINCIPAL';
  const isPrincipalInvitado = currentUser?.rol === 'LIDER_PRINCIPAL_INVITADO';

  // Filter pending vs active
  const pendingUsers = isAdmin ? visibleUsers.filter(u => u.estado === 'EN_PAUSA' || u.estado === 'EN_FORMACION') : [];
  
  // Active users excluding admin
  const allActiveNonAdmin = visibleUsers.filter(u => u.estado === 'ACTIVO' && u.rol !== 'ADMIN');
  
  // Leaders who can have sublideres under them (LIDER_PRINCIPAL, LIDER_PRINCIPAL_INVITADO, LIDER)
  const principalLeaders = allActiveNonAdmin.filter(u => u.rol === 'LIDER_PRINCIPAL' || u.rol === 'LIDER_PRINCIPAL_INVITADO' || u.rol === 'LIDER');
  
  // All sublíderes are now fetched from Contactos (rol === 'SUBLIDER')
  const allSublideres = visibleContactos.filter(c => c.rol === 'SUBLIDER').map(c => ({
    id: c.id,
    nombre_completo: `${c.nombres} ${c.apellidos || ''}`.trim(),
    cedula: c.cedula,
    telefono: c.telefono,
    lider_principal_id: c.lider_id, // Map for compatibility with existing UI
    isContacto: true
  }));
  
  // Subleaders not linked to any active leader
  const unassignedSublideres = allSublideres.filter(
    s => !s.lider_principal_id || !principalLeaders.some(p => p.id === s.lider_principal_id)
  );

  const getPendingRoleData = (userId: string) => {
    return pendingRoles[userId] || { rol: 'LIDER', lider_principal_id: '' };
  };

  const handlePendingRoleChange = (userId: string, rol: UserRole) => {
    setPendingRoles(prev => ({
      ...prev,
      [userId]: {
        ...getPendingRoleData(userId),
        rol,
        lider_principal_id: (rol === 'SUBLIDER' || rol === 'LIDER') 
          ? (currentUser?.rol === 'ADMIN' ? (prev[userId]?.lider_principal_id || principalLeaders[0]?.id) : currentUser?.id)
          : undefined
      }
    }));
  };

  const handlePendingParentLeaderChange = (userId: string, lider_principal_id: string) => {
    setPendingRoles(prev => ({
      ...prev,
      [userId]: {
        ...getPendingRoleData(userId),
        lider_principal_id
      }
    }));
  };

  const handleApprove = async (userId: string, userName?: string) => {
    const roleData = getPendingRoleData(userId);
    const isConfirmed = await confirm(`¿Confirmas aprobar el acceso de ${userName || 'este usuario'} con el rol de ${formatRoleName(roleData.rol)}?`);
    if (!isConfirmed) {
      return;
    }
    setProcessingId(userId);
    
    await updateUser(userId, {
      estado: 'ACTIVO',
      rol: roleData.rol,
      lider_principal_id: (roleData.rol === 'SUBLIDER' || roleData.rol === 'LIDER') 
        ? (currentUser?.rol === 'ADMIN' ? roleData.lider_principal_id : currentUser?.id)
        : undefined
    });
    
    setProcessingId(null);
  };

  const handleRoleChangeActive = async (userId: string, newRole: UserRole, userName?: string) => {
    const isConfirmed = await confirm(`¿Confirmas cambiar el rol de ${userName || 'este líder'} a ${formatRoleName(newRole)}?`);
    if (!isConfirmed) {
      return;
    }
    setProcessingId(userId);
    await updateUser(userId, {
      rol: newRole,
      lider_principal_id: (newRole === 'SUBLIDER' || newRole === 'LIDER') 
        ? (currentUser?.rol === 'ADMIN' ? principalLeaders[0]?.id : currentUser?.id) 
        : undefined
    });
    setProcessingId(null);
  };

  const handleParentLeaderChangeActive = async (id: string, parentId: string, isContacto: boolean = false, subName?: string) => {
    const isConfirmed = await confirm(`¿Confirmas reasignar al sublíder ${subName || ''}?`);
    if (!isConfirmed) {
      return;
    }
    setProcessingId(id);
    if (isContacto) {
      await updateContacto(id, {
        lider_id: parentId || undefined
      });
    } else {
      await updateUser(id, {
        lider_principal_id: parentId || undefined
      });
    }
    setProcessingId(null);
  };

  const handleReject = async (id: string, isContacto: boolean = false, name?: string) => {
    const isConfirmed = await confirm(`¿Estás seguro de eliminar a ${name || 'este usuario'}? Esta acción eliminará el registro y no se puede deshacer.`);
    if (isConfirmed) {
      setProcessingId(id);
      if (isContacto) {
        await deleteContacto(id);
      } else {
        await deleteUser(id);
      }
      setProcessingId(null);
    }
  };

  const formatRoleName = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'LIDER_PRINCIPAL': return 'Líder Principal';
      case 'LIDER_PRINCIPAL_INVITADO': return 'Líder Principal Invitado';
      case 'LIDER': return 'Líder';
      case 'SUBLIDER': return 'Sublíder';
      default: return role;
    }
  };

  const getRoleBadgeStyle = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'LIDER_PRINCIPAL': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'LIDER_PRINCIPAL_INVITADO': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'LIDER': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'SUBLIDER': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Pending Approvals Section (ADMIN only) */}
      {isAdmin && pendingUsers.length > 0 && (
        <div className="bg-gradient-to-b from-rose-950/30 to-neutral-900/60 rounded-3xl p-6 border border-rose-500/20 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-rose-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Líderes Pendientes de Aprobación
                  <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white">
                    {pendingUsers.length}
                  </span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Seleccione el rol territorial correspondiente antes de autorizar el acceso
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-300">
              <thead className="text-xs uppercase bg-neutral-950/60 text-neutral-400">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Nombre</th>
                  <th className="px-4 py-3">Cédula</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3 min-w-[240px]">Asignar Rol</th>
                  <th className="px-4 py-3 text-right rounded-r-xl">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-500/10">
                {pendingUsers.map((user) => {
                  const roleData = getPendingRoleData(user.id);
                  const isSubliderOrLider = roleData.rol === 'SUBLIDER' || roleData.rol === 'LIDER';

                  return (
                    <tr key={user.id} className="hover:bg-rose-500/5 transition">
                      <td className="px-4 py-4 font-semibold text-white">
                        {user.nombre_completo}
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-neutral-300">
                        {user.cedula}
                      </td>
                      <td className="px-4 py-4 text-xs text-neutral-400">
                        {user.telefono || 'Sin teléfono'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                            <select
                              value={roleData.rol}
                              onChange={(e) => handlePendingRoleChange(user.id, e.target.value as UserRole)}
                              className="w-full bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs font-semibold px-3 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer"
                            >
                              {currentUser?.rol === 'ADMIN' && (
                                <>
                                  <option value="LIDER_PRINCIPAL">Líder Principal</option>
                                  <option value="ADMIN">Administrador</option>
                                  <option value="SUBLIDER">Sublíder</option>
                                </>
                              )}
                              <option value="LIDER_PRINCIPAL_INVITADO">Líder Principal Invitado</option>
                              <option value="LIDER">Líder</option>
                            </select>

                          {isSubliderOrLider && currentUser?.rol === 'ADMIN' && (
                            <select
                              value={roleData.lider_principal_id || ''}
                              onChange={(e) => handlePendingParentLeaderChange(user.id, e.target.value)}
                              className="w-full bg-neutral-900 border border-indigo-500/40 text-indigo-300 text-xs px-3 py-1.5 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                            >
                              <option value="">-- Vincular a Líder Principal (Opcional) --</option>
                              {principalLeaders.map(lp => (
                                <option key={lp.id} value={lp.id}>
                                  Líder: {lp.nombre_completo} ({lp.cedula})
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        {processingId === user.id ? (
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-rose-400" />
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApprove(user.id, user.nombre_completo)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                              title="Aprobar acceso con rol asignado"
                            >
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                              <span>Aprobar</span>
                            </button>
                            <button
                              onClick={() => handleReject(user.id, false, user.nombre_completo)}
                              className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl transition cursor-pointer"
                              title="Rechazar y eliminar registro"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hierarchical Leaders Structure Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Estructura Territorial de Líderes</h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Relación jerárquica: Líderes territoriales y sus Sublíderes asignados
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar líder o sublíder..."
                value={leaderSearch}
                onChange={e => setLeaderSearch(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <span className="text-xs font-medium text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full whitespace-nowrap">
              Líderes: <strong className="text-indigo-400">{principalLeaders.length}</strong> | Sublíderes: <strong className="text-emerald-400">{allSublideres.length}</strong>
            </span>
          </div>
        </div>

        {principalLeaders.length === 0 && unassignedSublideres.length === 0 ? (
          <div className="bg-neutral-900/80 rounded-3xl p-12 text-center border border-neutral-800">
            <Users className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-neutral-300">No hay líderes activos registrados</h3>
            <p className="text-xs text-neutral-500 mt-1">Los líderes aprobados aparecerán organizados en este panel.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* List of each Leader Card with its assigned Sublideres */}
            {principalLeaders
              .filter(leader => {
                if (!leaderSearch) return true;
                const assignedSubs = allSublideres.filter(s => s.lider_principal_id === leader.id);
                const subNames = assignedSubs.map(s => s.nombre_completo).join(' ');
                return smartSearch([
                  leader.nombre_completo,
                  leader.cedula,
                  leader.telefono,
                  leader.barrio_residencia,
                  leader.comuna_localidad,
                  leader.rol,
                  subNames
                ], leaderSearch);
              })
              .map((leader) => {
              const assignedSublideres = allSublideres.filter(s => s.lider_principal_id === leader.id);
              const canEditThisLeader = isAdmin || (isLiderPrincipal && (leader.rol === 'SUBLIDER' || leader.rol === 'LIDER'));

              return (
                <div key={leader.id} className="bg-neutral-900/80 backdrop-blur-md rounded-3xl border border-neutral-800 overflow-hidden shadow-xl">
                  
                  {/* Leader Header Row */}
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-neutral-950/40 border-b border-neutral-800/80">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-800 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/20 text-sm shrink-0">
                        {leader.nombre_completo.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-white">
                            {leader.nombre_completo}
                          </h3>
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getRoleBadgeStyle(leader.rol)}`}>
                            {formatRoleName(leader.rol)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-neutral-400 mt-1 flex-wrap">
                          <span>Cédula: <strong className="text-neutral-200">{leader.cedula}</strong></span>
                          {leader.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-emerald-400" /> {leader.telefono}
                            </span>
                          )}
                          <span className="text-indigo-400 font-semibold">
                            {assignedSublideres.length} {assignedSublideres.length === 1 ? 'Sublíder asignado' : 'Sublíderes asignados'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Role edit / Actions for Leader */}
                    <div className="flex items-center gap-2.5 self-end md:self-auto">
                      {leader.id === currentUser?.id || leader.cedula === currentUser?.cedula ? (
                        <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          Tu Cuenta Actual
                        </span>
                      ) : (
                        <>
                          {isAdmin && (
                            <select
                              value={leader.rol}
                              disabled={processingId === leader.id}
                              onChange={(e) => handleRoleChangeActive(leader.id, e.target.value as UserRole, leader.nombre_completo)}
                              className="bg-neutral-950 border border-neutral-700 text-neutral-100 text-xs font-semibold px-3 py-1.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none cursor-pointer"
                            >
                              {currentUser?.rol === 'ADMIN' && (
                                <>
                                  <option value="LIDER_PRINCIPAL">Líder Principal</option>
                                  <option value="ADMIN">Administrador</option>
                                  <option value="SUBLIDER">Sublíder</option>
                                </>
                              )}
                              <option value="LIDER_PRINCIPAL_INVITADO">Líder Principal Invitado</option>
                              <option value="LIDER">Líder</option>
                            </select>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => handleReject(leader.id, false, leader.nombre_completo)}
                              disabled={processingId === leader.id}
                              className="text-xs text-rose-400 hover:text-rose-300 font-bold px-3 py-1.5 rounded-xl border border-rose-500/20 hover:bg-rose-500/10 transition cursor-pointer"
                            >
                              {processingId === leader.id ? '...' : 'Eliminar'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Sublíderes Under This Leader */}
                  <div className="p-4 sm:p-5 bg-neutral-900/40">
                    <div className="mb-3 flex items-center justify-between text-xs font-bold text-neutral-400 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <GitFork className="w-3.5 h-3.5 text-emerald-400 rotate-90" />
                        Sublíderes a cargo de {leader.nombre_completo.split(' ')[0]}:
                      </span>
                    </div>

                    {assignedSublideres.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-neutral-950/30 border border-neutral-800/50 text-xs text-neutral-500 flex items-center justify-between">
                        <span>Sin sublíderes asignados a este líder actualmente.</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {assignedSublideres.map((sublider) => {
                          const canEditSublider = isAdmin || isLiderPrincipal;

                          return (
                            <div
                              key={sublider.id}
                              className="p-3.5 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 flex items-start justify-between gap-3 hover:border-neutral-700 transition"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                                  {sublider.nombre_completo.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-xs font-bold text-white">
                                      {sublider.nombre_completo}
                                    </h4>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      Sublíder
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-neutral-400 mt-1">
                                    <span>CC: <strong className="text-neutral-300">{sublider.cedula}</strong></span>
                                    {sublider.telefono && (
                                      <span>Tel: <strong className="text-neutral-300">{sublider.telefono}</strong></span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Actions on Sublider */}
                              {canEditSublider && (
                                <div className="flex flex-col items-end gap-1.5">
                                  <select
                                    value={sublider.lider_principal_id || ''}
                                    onChange={(e) => handleParentLeaderChangeActive(sublider.id, e.target.value, true, sublider.nombre_completo)}
                                    className="bg-neutral-900 border border-neutral-700 text-neutral-300 text-[10px] px-2 py-1 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer max-w-[140px]"
                                    title="Reasignar a otro Líder"
                                  >
                                    {principalLeaders.map(lp => (
                                      <option key={lp.id} value={lp.id}>
                                        {lp.nombre_completo}
                                      </option>
                                    ))}
                                    <option value="">(Desvincular)</option>
                                  </select>

                                  {isAdmin && (
                                    <button
                                      onClick={() => handleReject(sublider.id, true, sublider.nombre_completo)}
                                      className="text-[10px] text-rose-400 hover:text-rose-300 transition cursor-pointer font-bold"
                                    >
                                      Eliminar
                                    </button>
                                  )}
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

            {/* Unassigned Sublideres Section (if any) */}
            {unassignedSublideres.length > 0 && (
              <div className="bg-amber-950/20 rounded-3xl p-5 border border-amber-500/20 shadow-xl">
                <h3 className="text-sm font-bold text-amber-300 mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Sublíderes sin Líder Asignado ({unassignedSublideres.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unassignedSublideres.map((sublider) => (
                    <div key={sublider.id} className="p-3.5 rounded-2xl bg-neutral-950/60 border border-amber-500/20 flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-white">{sublider.nombre_completo}</h4>
                        <p className="text-[11px] text-neutral-400">CC: {sublider.cedula} | Tel: {sublider.telefono || 'N/A'}</p>
                      </div>
                      <select
                        value={sublider.lider_principal_id || ''}
                        onChange={(e) => handleParentLeaderChangeActive(sublider.id, e.target.value, true)}
                        className="bg-neutral-900 border border-amber-500/40 text-amber-300 text-xs px-2.5 py-1.5 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                      >
                        <option value="">-- Asignar Líder --</option>
                        {principalLeaders.map(lp => (
                          <option key={lp.id} value={lp.id}>
                            {lp.nombre_completo}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
