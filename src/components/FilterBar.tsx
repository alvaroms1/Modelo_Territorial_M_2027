import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Filter,
  X,
  Search,
  RotateCcw,
  Vote,
  MapPin,
  Users,
  Calendar,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface FilterBarProps {
  compact?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({ compact = false }) => {
  const {
    filters,
    setFilters,
    resetFilters,
    pollingStations,
    visibleLeaders,
    visibleSubleaders,
    allSectors,
    allNeighborhoods,
    currentUser,
    stats,
  } = useApp();

  const isFiltered = Boolean(
    filters.searchQuery ||
    filters.pollingStationId ||
    filters.sector ||
    filters.neighborhood ||
    filters.gender ||
    filters.ageBracket ||
    filters.leaderId ||
    filters.subleaderId ||
    filters.votingCommitment
  );

  const activeCount = [
    filters.pollingStationId,
    filters.sector,
    filters.neighborhood,
    filters.gender,
    filters.ageBracket,
    filters.leaderId,
    filters.subleaderId,
    filters.votingCommitment,
  ].filter(Boolean).length;

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm backdrop-blur-sm">
      {/* Top Search & Filter Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="Buscar por Cédula, Nombres, Teléfono, Barrio o Puesto..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs sm:text-sm text-neutral-100 placeholder-neutral-500 transition"
          />
          {filters.searchQuery && (
            <button
              type="button"
              onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Clear Filters button */}
        {isFiltered && (
          <button
            type="button"
            onClick={resetFilters}
            className="self-end sm:self-center px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition flex items-center gap-1.5 cursor-pointer shrink-0 border border-neutral-700"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Limpiar Filtros ({activeCount + (filters.searchQuery ? 1 : 0)})</span>
          </button>
        )}
      </div>

      {/* Filter Selects Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-1">
        {/* Puesto de Votación */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
            <Vote className="w-3 h-3 text-indigo-400" />
            <span>Puesto de Votación</span>
          </label>
          <select
            value={filters.pollingStationId}
            onChange={(e) => setFilters(prev => ({ ...prev, pollingStationId: e.target.value }))}
            className="w-full px-2.5 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-200 focus:border-indigo-500 transition truncate"
          >
            <option value="">Todos los Puestos</option>
            {pollingStations.map(ps => (
              <option key={ps.id} value={ps.id}>
                {ps.name} ({ps.zone})
              </option>
            ))}
          </select>
        </div>

        {/* Sector / Comuna */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-rose-400" />
            <span>Sector / Comuna</span>
          </label>
          <select
            value={filters.sector}
            onChange={(e) => setFilters(prev => ({ ...prev, sector: e.target.value }))}
            className="w-full px-2.5 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-200 focus:border-indigo-500 transition truncate"
          >
            <option value="">Todos los Sectores</option>
            {allSectors.map(sec => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>
        </div>

        {/* Género */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
            <Users className="w-3 h-3 text-emerald-400" />
            <span>Género</span>
          </label>
          <select
            value={filters.gender}
            onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
            className="w-full px-2.5 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-200 focus:border-indigo-500 transition truncate"
          >
            <option value="">Todos los Géneros</option>
            <option value="FEMENINO">Femenino (Mujeres)</option>
            <option value="MASCULINO">Masculino (Hombres)</option>
            <option value="OTRO">Otro / No binario</option>
          </select>
        </div>

        {/* Rango de Edades */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-amber-400" />
            <span>Rango de Edades</span>
          </label>
          <select
            value={filters.ageBracket}
            onChange={(e) => setFilters(prev => ({ ...prev, ageBracket: e.target.value }))}
            className="w-full px-2.5 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-200 focus:border-indigo-500 transition truncate"
          >
            <option value="">Todas las Edades</option>
            <option value="18-25">18 a 25 años (Juventudes)</option>
            <option value="26-35">26 a 35 años (Jóvenes Adultos)</option>
            <option value="36-50">36 a 50 años (Adultos)</option>
            <option value="51-65">51 a 65 años (Madurez)</option>
            <option value="65+">Mayores de 65 años (Adulto Mayor)</option>
          </select>
        </div>

        {/* Líder Coordinador (if Super Admin) */}
        {currentUser?.role === 'SUPER_ADMIN' && (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
              <Users className="w-3 h-3 text-indigo-400" />
              <span>Por Líder de Zona</span>
            </label>
            <select
              value={filters.leaderId}
              onChange={(e) => setFilters(prev => ({ ...prev, leaderId: e.target.value, subleaderId: '' }))}
              className="w-full px-2.5 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-200 focus:border-indigo-500 transition truncate"
            >
              <option value="">Todos los Líderes</option>
              {visibleLeaders.map(ldr => (
                <option key={ldr.id} value={ldr.id}>
                  {ldr.fullName} ({ldr.sector})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sublíder */}
        {(currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'LIDER_COORDINADOR') && (
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
              <Users className="w-3 h-3 text-emerald-400" />
              <span>Por Sublíder de Base</span>
            </label>
            <select
              value={filters.subleaderId}
              onChange={(e) => setFilters(prev => ({ ...prev, subleaderId: e.target.value }))}
              className="w-full px-2.5 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-200 focus:border-indigo-500 transition truncate"
            >
              <option value="">Todos los Sublíderes</option>
              {visibleSubleaders.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.fullName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Compromiso de Voto */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Compromiso Voto</span>
          </label>
          <select
            value={filters.votingCommitment}
            onChange={(e) => setFilters(prev => ({ ...prev, votingCommitment: e.target.value }))}
            className="w-full px-2.5 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-200 focus:border-indigo-500 transition truncate"
          >
            <option value="">Todos los Estados</option>
            <option value="CONFIRMADO">Confirmado (Seguro)</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="POR_CONTACTAR">Por Contactar</option>
            <option value="DUDOSO">Dudoso</option>
          </select>
        </div>

        {/* Barrio */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-sky-400" />
            <span>Barrio</span>
          </label>
          <select
            value={filters.neighborhood}
            onChange={(e) => setFilters(prev => ({ ...prev, neighborhood: e.target.value }))}
            className="w-full px-2.5 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs text-neutral-200 focus:border-indigo-500 transition truncate"
          >
            <option value="">Todos los Barrios</option>
            {allNeighborhoods.map(barrio => (
              <option key={barrio} value={barrio}>
                {barrio}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
