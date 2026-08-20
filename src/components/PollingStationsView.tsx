import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Plus, Search, Edit3, MapPin } from 'lucide-react';
import { AddPollingStationModal } from './AddPollingStationModal';
import { EditPollingStationModal } from './EditPollingStationModal';
import { smartSearch } from '../utils/helpers';
import { PollingStation } from '../types';

export const PollingStationsView: React.FC = () => {
  const { pollingStations, currentUser } = useApp();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<PollingStation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedComuna, setSelectedComuna] = useState('');

  // Check if current user has permission to edit polling stations
  const canEdit = currentUser?.rol === 'ADMIN' || currentUser?.rol === 'LIDER_PRINCIPAL';

  const uniqueComunas = useMemo(() => {
    const comunas = new Set(pollingStations.map(p => p.comuna_localidad).filter(Boolean));
    return Array.from(comunas).sort();
  }, [pollingStations]);

  const filteredStations = useMemo(() => {
    return pollingStations.filter(station => {
      const matchesSearch = smartSearch([
        station.nombre_puesto,
        station.codigo_puesto,
        station.barrio_corregimiento,
        station.comuna_localidad,
        station.direccion
      ], searchTerm);
      
      let matchesComuna = true;
      if (selectedComuna === 'NO_ASIGNADO') {
        matchesComuna = !station.comuna_localidad;
      } else if (selectedComuna !== '') {
        matchesComuna = station.comuna_localidad === selectedComuna;
      }
      
      return matchesSearch && matchesComuna;
    });
  }, [pollingStations, searchTerm, selectedComuna]);

  return (
    <div className="bg-neutral-900 rounded-2xl p-6 border border-neutral-800 shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-3">
            Puestos de Votación
            <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full font-bold border border-indigo-500/30">
              {filteredStations.length} puestos
            </span>
          </h2>
          <p className="text-xs text-neutral-400">
            Listado distrital de puestos de votación y asignación territorial
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-500/20 cursor-pointer"
        >
          <Plus size={16} />
          Nuevo Puesto de Votación
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-neutral-500" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#09090b] border border-neutral-800 text-white pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-xs font-medium"
            placeholder="Buscar por nombre del puesto, código o barrio..."
          />
        </div>
        <select 
          value={selectedComuna}
          onChange={(e) => setSelectedComuna(e.target.value)}
          className="bg-[#09090b] border border-neutral-800 text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition min-w-[240px] text-xs font-medium cursor-pointer"
        >
          <option value="">Todas las Zonas / Comunas</option>
          <option value="NO_ASIGNADO">⚠️ Solo No Asignados</option>
          {uniqueComunas.map(comuna => (
            <option key={comuna} value={comuna}>{comuna}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto custom-scrollbar border border-neutral-800/80 rounded-2xl">
        <table className="w-full text-left text-xs text-neutral-400">
          <thead className="text-[11px] uppercase bg-neutral-950 text-neutral-400 font-bold border-b border-neutral-800">
            <tr>
              <th className="px-4 py-3.5">Código</th>
              <th className="px-4 py-3.5">Nombre</th>
              <th className="px-4 py-3.5">Comuna / Localidad</th>
              <th className="px-4 py-3.5">Barrio</th>
              <th className="px-4 py-3.5">Dirección</th>
              {canEdit && <th className="px-4 py-3.5 text-center">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {filteredStations.map((station) => (
              <tr key={station.id} className="hover:bg-neutral-800/40 transition">
                <td className="px-4 py-3 font-mono font-bold text-amber-400">
                  {station.codigo_puesto}
                </td>
                <td className="px-4 py-3 font-semibold text-white">
                  {station.nombre_puesto}
                </td>
                <td className="px-4 py-3">
                  {station.comuna_localidad ? (
                    <span className="text-neutral-300">{station.comuna_localidad}</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-800/90 text-neutral-500 text-[10px] font-medium border border-neutral-700/40">
                      No Asignado
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {station.barrio_corregimiento ? (
                    <span className="text-neutral-300 font-medium">{station.barrio_corregimiento}</span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-semibold border border-amber-500/20">
                      No Asignado
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-400">
                  {station.direccion || '-'}
                </td>
                {canEdit && (
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setEditingStation(station)}
                      className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-lg font-semibold transition text-[11px] inline-flex items-center gap-1.5 cursor-pointer"
                      title="Editar puesto y asignar barrio"
                    >
                      <Edit3 size={12} />
                      <span>Editar</span>
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal para añadir nuevo puesto */}
      <AddPollingStationModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />

      {/* Modal para editar puesto existente (solo ADMIN y LIDER_PRINCIPAL) */}
      {canEdit && (
        <EditPollingStationModal
          station={editingStation}
          isOpen={!!editingStation}
          onClose={() => setEditingStation(null)}
        />
      )}
    </div>
  );
};
