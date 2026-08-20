import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Contacto } from '../types';
import {
  Search, RefreshCw, Vote, MapPin, Users, Calendar,
  GitFork, GitBranch, CheckSquare, MessageCircle, UserPlus, Edit2, Trash2, Home
} from 'lucide-react';

import { smartSearch } from '../utils/helpers';

interface ContactosListProps {
  onOpenAddModal: () => void;
  onEditContacto: (contacto: Contacto) => void;
}

export const ContactosList: React.FC<ContactosListProps> = ({ onOpenAddModal, onEditContacto }) => {
  const { visibleContactos, pollingStations, users, deleteContacto, currentUser } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [puestoFiltro, setPuestoFiltro] = useState('');
  const [sectorFiltro, setSectorFiltro] = useState('');
  const [generoFiltro, setGeneroFiltro] = useState('');
  const [edadFiltro, setEdadFiltro] = useState('');
  const [liderFiltro, setLiderFiltro] = useState('');
  const [subliderFiltro, setSubliderFiltro] = useState('');
  const [compromisoFiltro, setCompromisoFiltro] = useState('');
  const [barrioFiltro, setBarrioFiltro] = useState('');
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const uniqueSectores = Array.from(new Set(visibleContactos.map(c => c.sector_comuna).filter(Boolean)));
  const uniqueBarrios = Array.from(new Set(visibleContactos.map(c => c.barrio).filter(Boolean)));
  const uniqueGeneros = Array.from(new Set(visibleContactos.map(c => c.genero).filter(Boolean)));
  const uniqueCompromisos = Array.from(new Set(visibleContactos.map(c => c.rol).filter(Boolean)));
  
  // Incluir siempre al usuario actual si es líder, para que pueda filtrar por sí mismo
  const uniqueLideres = users.filter(u => 
    visibleContactos.some(c => c.lider_id === u.id) || 
    (currentUser && u.id === currentUser.id && (u.rol === 'LIDER' || u.rol === 'LIDER_PRINCIPAL' || u.rol === 'LIDER_PRINCIPAL_INVITADO'))
  );
  
  // Sublideres are contactos with rol === 'SUBLIDER'
  const uniqueSublideres = visibleContactos.filter(c => c.rol === 'SUBLIDER').map(c => ({
    id: c.id,
    nombre_completo: `${c.nombres} ${c.apellidos || ''}`.trim()
  }));

  const allListItems: Contacto[] = visibleContactos;

  const handleClearFilters = () => {
    setSearchTerm('');
    setPuestoFiltro('');
    setSectorFiltro('');
    setGeneroFiltro('');
    setEdadFiltro('');
    setLiderFiltro('');
    setSubliderFiltro('');
    setCompromisoFiltro('');
    setBarrioFiltro('');
  };

  const filteredContactos = allListItems.filter(c => {
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

    if (puestoFiltro && c.puesto_id !== puestoFiltro) return false;
    if (sectorFiltro && c.sector_comuna !== sectorFiltro) return false;
    if (generoFiltro && c.genero !== generoFiltro) return false;
    
    if (edadFiltro) {
       if (edadFiltro === '18-25' && (c.edad < 18 || c.edad > 25)) return false;
       if (edadFiltro === '26-35' && (c.edad < 26 || c.edad > 35)) return false;
       if (edadFiltro === '36-50' && (c.edad < 36 || c.edad > 50)) return false;
       if (edadFiltro === '51+' && c.edad <= 50) return false;
    }

    if (liderFiltro && c.lider_id !== liderFiltro) return false;
    if (subliderFiltro && c.sublider_id !== subliderFiltro) return false;
    if (compromisoFiltro && c.rol !== compromisoFiltro) return false;
    if (barrioFiltro && c.barrio !== barrioFiltro) return false;

    return true;
  });

  const activeFiltersCount = [searchTerm, puestoFiltro, sectorFiltro, generoFiltro, edadFiltro, liderFiltro, subliderFiltro, compromisoFiltro, barrioFiltro].filter(Boolean).length;

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

  const handleDelete = async (contacto: any) => {
    const fullName = `${contacto.nombres || ''} ${contacto.apellidos || ''}`.trim() || 'este contacto';
    if (window.confirm(`¿Estás seguro de que deseas eliminar al contacto "${fullName}"? Esta acción no se puede deshacer.`)) {
      if (contacto.isUserMirror) {
        alert('Este es un Líder con cuenta de acceso real. Para gestionar su usuario, hágalo desde el módulo "Líderes".');
      } else {
        await deleteContacto(contacto.id);
      }
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

  const getSubliderName = (id?: string, rol?: string, liderId?: string) => {
    if (rol === 'SUBLIDER') return 'NO APLICA';
    if (!id || id === 'DIRECTO' || id === liderId) return 'Directo del Líder';
    const sub = visibleContactos.find(c => c.id === id) || users.find(u => u.id === id);
    if (sub) {
      return ('nombre_completo' in sub ? sub.nombre_completo : `${sub.nombres} ${sub.apellidos || ''}`).trim();
    }
    return 'NO APLICA';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Directorio de Contactos
            <span className="px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {allListItems.length} Totales
            </span>
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Gestión completa de la base de datos electoral
          </p>
        </div>
        <button onClick={onOpenAddModal} className="bg-indigo-600 hover:bg-indigo-500 transition px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20">
          <UserPlus className="w-4 h-4" />
          Añadir Contacto
        </button>
      </div>

      {/* FILTER BAR SECTION */}
      <div className="bg-[#09090b] border border-neutral-800/80 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar por Cédula, Nombres, Teléfono, Barrio o Puesto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-white text-sm pl-9 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none transition"
            />
          </div>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition text-sm font-bold flex items-center gap-2 whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4" />
            Limpiar Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-neutral-800/80">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Vote className="w-3.5 h-3.5 text-indigo-400" /> Puesto de Votación
            </label>
            <select
              value={puestoFiltro}
              onChange={(e) => setPuestoFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none"
            >
              <option value="">Todos los Puestos</option>
              {pollingStations.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 flex items-center gap-1.5 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-rose-400" /> Sector / Comuna
            </label>
            <select
              value={sectorFiltro}
              onChange={(e) => setSectorFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-rose-500/50 outline-none appearance-none"
            >
              <option value="">Todos los Sectores</option>
              {uniqueSectores.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-emerald-400" /> Género
            </label>
            <select
              value={generoFiltro}
              onChange={(e) => setGeneroFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none"
            >
              <option value="">Todos los Géneros</option>
              {uniqueGeneros.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> Rango de Edades
            </label>
            <select
              value={edadFiltro}
              onChange={(e) => setEdadFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-amber-500/50 outline-none appearance-none"
            >
              <option value="">Todas las Edades</option>
              <option value="18-25">18 a 25 años</option>
              <option value="26-35">26 a 35 años</option>
              <option value="36-50">36 a 50 años</option>
              <option value="51+">Mayores de 50</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 flex items-center gap-1.5 uppercase tracking-wider">
              <GitFork className="w-3.5 h-3.5 text-cyan-400" /> Por Líder
            </label>
            <select
              value={liderFiltro}
              onChange={(e) => setLiderFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-cyan-500/50 outline-none appearance-none"
            >
              <option value="">Todos los Líderes</option>
              {uniqueLideres.map(l => (
                <option key={l.id} value={l.id}>{l.nombre_completo}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 flex items-center gap-1.5 uppercase tracking-wider">
              <GitBranch className="w-3.5 h-3.5 text-blue-400" /> Por Sublíder
            </label>
            <select
              value={subliderFiltro}
              onChange={(e) => setSubliderFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none appearance-none"
            >
              <option value="">Todos los Sublíderes</option>
              {uniqueSublideres.map(s => (
                <option key={s.id} value={s.id}>{s.nombre_completo}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 flex items-center gap-1.5 uppercase tracking-wider">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Rol Asignado
            </label>
            <select
              value={compromisoFiltro}
              onChange={(e) => setCompromisoFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none"
            >
              <option value="">Todos los Estados</option>
              {uniqueCompromisos.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Home className="w-3.5 h-3.5 text-purple-400" /> Barrio
            </label>
            <select
              value={barrioFiltro}
              onChange={(e) => setBarrioFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-purple-500/50 outline-none appearance-none"
            >
              <option value="">Todos los Barrios</option>
              {uniqueBarrios.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-[#09090b] border border-neutral-800/80 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-neutral-800/80 flex items-center gap-3">
          <input 
            type="checkbox" 
            checked={filteredContactos.length > 0 && selectedIds.size === filteredContactos.length}
            onChange={toggleSelectAll}
            className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-neutral-950"
          />
          <span className="text-xs text-neutral-400">Mostrando {filteredContactos.length} personas</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 bg-neutral-950/50 border-b border-neutral-800/80">
              <tr>
                <th className="px-4 py-3 w-10"></th>
                <th className="px-4 py-3">PERSONA / CÉDULA</th>
                <th className="px-4 py-3">CONTACTO / WHATSAPP</th>
                <th className="px-4 py-3">DEMOGRAFÍA</th>
                <th className="px-4 py-3">PUESTO & MESA</th>
                <th className="px-4 py-3">ESTRUCTURA RESPONSABLE</th>
                <th className="px-4 py-3">ROL</th>
                <th className="px-4 py-3 text-center sticky right-0 bg-neutral-950/90 backdrop-blur-md z-10 border-l border-neutral-800/50 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.2)]">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {filteredContactos.map((contacto) => {
                const isSubliderRole = contacto.rol === 'SUBLIDER';
                const subLeaderName = getSubliderName(contacto.sublider_id, contacto.rol, contacto.lider_id);
                return (
                  <tr key={contacto.id} className="hover:bg-neutral-900/40 transition group">
                    <td className="px-4 py-3">
                      <input 
                        type="checkbox"
                        checked={selectedIds.has(contacto.id)}
                        onChange={() => toggleSelect(contacto.id)}
                        className="w-4 h-4 rounded bg-neutral-900 border-neutral-700 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-neutral-950"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-white text-sm">{contacto.nombres} {contacto.apellidos}</div>
                      <div className="text-neutral-500 mt-0.5">C.C. {contacto.cedula}</div>
                    </td>
                    <td className="px-4 py-3">
                      {contacto.telefono ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold mb-0.5">
                          <MessageCircle className="w-3.5 h-3.5" />
                          {contacto.telefono}
                        </div>
                      ) : (
                        <div className="text-neutral-600 mb-0.5">Sin teléfono</div>
                      )}
                      {contacto.correo && <div className="text-neutral-500">{contacto.correo}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-neutral-300 font-medium mb-0.5">{contacto.genero}, {contacto.edad}a</div>
                      <div className="text-neutral-500">{contacto.barrio} {contacto.sector_comuna && `(${contacto.sector_comuna})`}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-neutral-200 font-bold mb-0.5 truncate max-w-[200px]" title={getPuestoName(contacto.puesto_id)}>
                        {getPuestoName(contacto.puesto_id)}
                      </div>
                      <div className="text-indigo-400 font-medium">Mesa: {contacto.mesa || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-neutral-300 mb-0.5">Líder: <span className="font-bold">{getLiderName(contacto.lider_id)}</span></div>
                      {isSubliderRole ? (
                        <div className="text-neutral-500 text-xs font-medium">Sublíder: <span className="text-neutral-400 font-semibold">NO APLICA</span></div>
                      ) : (contacto.sublider_id && contacto.sublider_id !== 'DIRECTO' && contacto.sublider_id !== contacto.lider_id && subLeaderName !== 'NO APLICA' && subLeaderName !== 'Directo del Líder') ? (
                        <div className="text-emerald-400 font-medium">Sublíder: {subLeaderName}</div>
                      ) : (
                        <div className="text-neutral-500 text-xs">Directo del Líder</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                        {contacto.rol || 'Contacto CON Consentimiento'}
                      </span>
                    </td>
                    <td className="px-4 py-3 sticky right-0 bg-[#09090b] border-l border-neutral-800/50 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center justify-center gap-1.5">
                        {contacto.telefono && (
                          <button 
                            title="Chat WhatsApp"
                            onClick={() => window.open(`https://wa.me/57${contacto.telefono.replace(/\D/g, '')}`, '_blank')}
                            className="p-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg border border-emerald-500/20 transition"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          title="Editar"
                          onClick={() => onEditContacto(contacto)} 
                          className="p-1.5 bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 rounded-lg border border-neutral-700 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          title="Eliminar"
                          onClick={() => handleDelete(contacto)}
                          className="p-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg border border-rose-500/20 transition"
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
                    No se encontraron contactos con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
