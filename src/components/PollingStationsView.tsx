import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Vote,
  MapPin,
  Users,
  Plus,
  Search,
  Phone,
  MessageCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  Building2,
  Layers,
} from 'lucide-react';
import { generateWhatsappLink } from '../utils/helpers';
import { PollingStation } from '../types';

export const PollingStationsView: React.FC = () => {
  const {
    pollingStations,
    supporters,
    addPollingStation,
    updatePollingStation,
    deletePollingStation,
    currentUser,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStation, setEditingStation] = useState<PollingStation | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [zone, setZone] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [tablesCount, setTablesCount] = useState(20);
  const [targetVoters, setTargetVoters] = useState(800);
  const [coordinatorName, setCoordinatorName] = useState('');
  const [coordinatorPhone, setCoordinatorPhone] = useState('');

  const distinctZones = Array.from(new Set(pollingStations.map(ps => ps.zone))).sort();

  const filteredStations = pollingStations.filter(ps => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        ps.name.toLowerCase().includes(q) ||
        ps.zone.toLowerCase().includes(q) ||
        ps.neighborhood.toLowerCase().includes(q) ||
        ps.address.toLowerCase().includes(q) ||
        (ps.coordinatorName || '').toLowerCase().includes(q);
      if (!match) return false;
    }
    if (selectedZone && ps.zone !== selectedZone) return false;
    return true;
  });

  const openAddModal = () => {
    setEditingStation(null);
    setName('');
    setCode(`PV-00${pollingStations.length + 1}`);
    setZone(distinctZones[0] || 'Comuna 1 - Norte');
    setNeighborhood('');
    setAddress('');
    setTablesCount(20);
    setTargetVoters(600);
    setCoordinatorName('');
    setCoordinatorPhone('');
    setShowAddModal(true);
  };

  const openEditModal = (station: PollingStation) => {
    setEditingStation(station);
    setName(station.name);
    setCode(station.code);
    setZone(station.zone);
    setNeighborhood(station.neighborhood);
    setAddress(station.address);
    setTablesCount(station.tablesCount);
    setTargetVoters(station.targetVoters);
    setCoordinatorName(station.coordinatorName || '');
    setCoordinatorPhone(station.coordinatorPhone || '');
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !zone.trim()) return;

    if (editingStation) {
      updatePollingStation({
        ...editingStation,
        name: name.trim(),
        code: code.trim(),
        zone: zone.trim(),
        neighborhood: neighborhood.trim() || 'General',
        address: address.trim() || 'Dirección Principal',
        tablesCount: Number(tablesCount) || 1,
        targetVoters: Number(targetVoters) || 100,
        coordinatorName: coordinatorName.trim() || undefined,
        coordinatorPhone: coordinatorPhone.trim() || undefined,
      });
    } else {
      addPollingStation({
        name: name.trim(),
        code: code.trim() || `PV-${Date.now().toString().slice(-4)}`,
        zone: zone.trim(),
        neighborhood: neighborhood.trim() || 'General',
        address: address.trim() || 'Dirección Principal',
        tablesCount: Number(tablesCount) || 1,
        targetVoters: Number(targetVoters) || 100,
        coordinatorName: coordinatorName.trim() || undefined,
        coordinatorPhone: coordinatorPhone.trim() || undefined,
      });
    }
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-100">
              Puestos de Votación & Colegios
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {pollingStations.length} puestos
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Censo electoral, mesas habilitadas y distribución de personas por recinto
          </p>
        </div>

        {currentUser?.role === 'SUPER_ADMIN' && (
          <button
            type="button"
            id="btn-add-polling-station"
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Puesto de Votación</span>
          </button>
        )}
      </div>

      {/* Search & Zone Filter Bar */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre de colegio, barrio, zona o coordinador..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500"
          />
        </div>

        <select
          value={selectedZone}
          onChange={(e) => setSelectedZone(e.target.value)}
          className="px-3.5 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs sm:text-sm text-neutral-200"
        >
          <option value="">Todas las Zonas / Comunas</option>
          {distinctZones.map(z => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
      </div>

      {/* Polling Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStations.map((station) => {
          const stationVoters = supporters.filter(s => s.pollingStationId === station.id);
          const goal = station.targetVoters || 500;
          const pct = Math.min(100, Math.round((stationVoters.length / goal) * 100));

          return (
            <div
              key={station.id}
              className="p-5 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-4 hover:border-neutral-700 transition shadow-sm relative flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-neutral-100 text-sm truncate">{station.name}</h3>
                      <div className="text-[11px] text-neutral-400 truncate">
                        {station.zone} • {station.neighborhood}
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-800 text-neutral-300 shrink-0">
                    {station.code}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 text-xs space-y-2">
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="text-neutral-400">Mesas Electorales:</span>
                    <span className="font-semibold text-neutral-200">{station.tablesCount} mesas</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-300">
                    <span className="text-neutral-400">Dirección:</span>
                    <span className="font-medium text-neutral-200 truncate max-w-[170px]">{station.address}</span>
                  </div>

                  {station.coordinatorName && (
                    <div className="flex items-center justify-between text-neutral-300 pt-1 border-t border-neutral-800/80">
                      <span className="text-neutral-400">Coordinador:</span>
                      <div className="flex items-center gap-1.5 font-medium text-neutral-200">
                        <span>{station.coordinatorName}</span>
                        {station.coordinatorPhone && (
                          <a
                            href={generateWhatsappLink(station.coordinatorPhone, `Hola ${station.coordinatorName}, novedades de ${station.name}.`)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-emerald-400 hover:text-emerald-300"
                            title="WhatsApp al coordinador de puesto"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress bar towards target voters in this station */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400 text-[11px]">Votantes Registrados</span>
                    <span className="font-bold text-indigo-300">{stationVoters.length} / {goal} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-rose-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              {currentUser?.role === 'SUPER_ADMIN' && (
                <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => openEditModal(station)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                    title="Editar Puesto"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePollingStation(station.id)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-900/60 text-neutral-400 hover:text-rose-400"
                    title="Eliminar Puesto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Polling Station */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="bg-neutral-900 border border-neutral-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-base font-bold text-neutral-100">
                {editingStation ? 'Editar Puesto de Votación' : 'Registrar Nuevo Puesto de Votación'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-neutral-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-neutral-300 font-semibold">Nombre de la Institución / Colegio *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Colegio Mayor de Antioquia / Sede Norte"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-neutral-300 font-semibold">Código Puesto</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="PV-009"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-300 font-semibold">Zona / Comuna *</label>
                  <input
                    type="text"
                    required
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    placeholder="Ej: Comuna 1 - Norte"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-neutral-300 font-semibold">Barrio</label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="Ej: La Pradera"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-300 font-semibold">Dirección</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle 45 # 12-30"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-neutral-300 font-semibold">Número de Mesas</label>
                  <input
                    type="number"
                    value={tablesCount}
                    onChange={(e) => setTablesCount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-300 font-semibold">Meta de Votantes Puesto</label>
                  <input
                    type="number"
                    value={targetVoters}
                    onChange={(e) => setTargetVoters(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-neutral-300 font-semibold">Coordinador / Testigo</label>
                  <input
                    type="text"
                    value={coordinatorName}
                    onChange={(e) => setCoordinatorName(e.target.value)}
                    placeholder="Nombre del encargado"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-neutral-300 font-semibold">WhatsApp Coordinador</label>
                  <input
                    type="tel"
                    value={coordinatorPhone}
                    onChange={(e) => setCoordinatorPhone(e.target.value)}
                    placeholder="3001234567"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-100"
                  />
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
                  Guardar Puesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
