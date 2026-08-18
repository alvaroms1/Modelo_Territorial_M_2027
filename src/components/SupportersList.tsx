import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FilterBar } from './FilterBar';
import {
  Users,
  Search,
  MessageCircle,
  Phone,
  Mail,
  Vote,
  MapPin,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Plus,
  Check,
  UserCheck,
} from 'lucide-react';
import { formatCedula, generateWhatsappLink, getCommitmentBadge } from '../utils/helpers';
import { Supporter } from '../types';

interface SupportersListProps {
  onOpenAddModal: () => void;
  onEditSupporter: (supporter: Supporter) => void;
}

export const SupportersList: React.FC<SupportersListProps> = ({
  onOpenAddModal,
  onEditSupporter,
}) => {
  const {
    visibleSupporters,
    deleteSupporter,
    toggleWhatsappContacted,
    toggleVotedStatus,
    currentUser,
  } = useApp();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === visibleSupporters.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visibleSupporters.map(s => s.id));
    }
  };

  const handleDelete = (id: string) => {
    deleteSupporter(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-20">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-100">
              Personas de Apoyo & Simpatizantes
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {visibleSupporters.length} registros
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Base de datos de votantes organizados por puestos, líderes y sectores
          </p>
        </div>

        <button
          type="button"
          id="btn-add-supporter-from-list"
          onClick={onOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Persona de Apoyo</span>
        </button>
      </div>

      {/* Filter Component */}
      <FilterBar />

      {/* Results Header / Bulk actions */}
      <div className="flex items-center justify-between px-1 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={visibleSupporters.length > 0 && selectedIds.length === visibleSupporters.length}
            onChange={toggleSelectAll}
            className="rounded border-neutral-700 text-indigo-600 focus:ring-indigo-500 bg-neutral-900 w-4 h-4 cursor-pointer"
          />
          <span>
            {selectedIds.length > 0
              ? `${selectedIds.length} seleccionados de ${visibleSupporters.length}`
              : `Mostrando ${visibleSupporters.length} personas`}
          </span>
        </div>
      </div>

      {/* Supporters Content: Responsive Cards (Mobile) & Dense Table (Desktop) */}
      {visibleSupporters.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
          <Users className="w-10 h-10 text-neutral-600 mx-auto" />
          <h3 className="text-sm font-semibold text-neutral-300">
            No se encontraron personas con los filtros seleccionados
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            Prueba ajustando los filtros de búsqueda o registra una nueva persona de apoyo.
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Persona</span>
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card View (< md) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {visibleSupporters.map((supporter) => {
              const commitmentBadge = getCommitmentBadge(supporter.votingCommitment);
              const waMsg = `¡Hola ${supporter.firstName}! Te recordamos tu puesto de votación: ${supporter.pollingStationName}${supporter.tableNumber ? `, Mesa ${supporter.tableNumber}` : ''}. ¡Contamos con tu apoyo en las elecciones!`;
              const waLink = generateWhatsappLink(supporter.phone, waMsg);

              return (
                <div
                  key={supporter.id}
                  className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-3 shadow-sm relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-100 text-sm">
                          {supporter.firstName} {supporter.lastName}
                        </span>
                        <span className="text-[10px] text-neutral-500 px-1.5 py-0.5 rounded bg-neutral-800 font-mono">
                          C.C. {formatCedula(supporter.cedula)}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 mt-0.5">
                        <span>{supporter.gender === 'FEMENINO' ? 'F' : supporter.gender === 'MASCULINO' ? 'M' : 'Otro'}</span>
                        <span>•</span>
                        <span>{supporter.age} años ({supporter.ageBracket})</span>
                        <span>•</span>
                        <span className="text-neutral-300 font-medium">{supporter.neighborhood}</span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${commitmentBadge.bg}`}>
                      {commitmentBadge.label}
                    </span>
                  </div>

                  {/* Polling Station info */}
                  <div className="p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 text-xs space-y-1">
                    <div className="flex items-center justify-between text-neutral-300">
                      <span className="flex items-center gap-1 font-medium text-neutral-200">
                        <Vote className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{supporter.pollingStationName}</span>
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono font-bold text-[10px] shrink-0 border border-indigo-500/20">
                        Mesa: {supporter.tableNumber || 'S/N'}
                      </span>
                    </div>

                    <div className="text-[10px] text-neutral-500 flex items-center justify-between pt-0.5">
                      <span>Líder: <strong className="text-neutral-400">{supporter.registeredByLeaderName}</strong></span>
                      {supporter.registeredBySubleaderName && (
                        <span>Sublíder: <strong className="text-emerald-400">{supporter.registeredBySubleaderName}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-1 gap-2">
                    <div className="flex items-center gap-1.5">
                      {/* WhatsApp Button */}
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => toggleWhatsappContacted(supporter.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${
                          supporter.contactedViaWhatsapp
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{supporter.contactedViaWhatsapp ? 'Enviado' : 'WhatsApp'}</span>
                      </a>

                      {/* Voted toggle button (D-Day) */}
                      <button
                        type="button"
                        onClick={() => toggleVotedStatus(supporter.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1 transition ${
                          supporter.votedStatus
                            ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                            : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
                        }`}
                        title="Marcar si ya votó el día de elecciones"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{supporter.votedStatus ? 'Votó ✓' : '¿Votó?'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditSupporter(supporter)}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                        title="Editar persona"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(supporter.id)}
                        className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 transition"
                        title="Eliminar persona"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Delete confirmation prompt */}
                  {deleteConfirmId === supporter.id && (
                    <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-xs space-y-2 mt-2">
                      <div className="text-rose-200 font-semibold">¿Eliminar este registro permanentemente?</div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDelete(supporter.id)}
                          className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs"
                        >
                          Sí, Eliminar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1 rounded-lg bg-neutral-800 text-neutral-300 text-xs"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 pl-4 pr-2 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === visibleSupporters.length}
                        onChange={toggleSelectAll}
                        className="rounded border-neutral-700 bg-neutral-900 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="py-3.5 px-3">Persona / Cédula</th>
                    <th className="py-3.5 px-3">Contacto / WhatsApp</th>
                    <th className="py-3.5 px-3">Demografía</th>
                    <th className="py-3.5 px-3">Puesto & Mesa</th>
                    <th className="py-3.5 px-3">Estructura Responsable</th>
                    <th className="py-3.5 px-3">Compromiso</th>
                    <th className="py-3.5 pr-4 pl-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 text-neutral-200">
                  {visibleSupporters.map((supporter) => {
                    const commitmentBadge = getCommitmentBadge(supporter.votingCommitment);
                    const waMsg = `¡Hola ${supporter.firstName}! Te recordamos tu puesto de votación: ${supporter.pollingStationName}${supporter.tableNumber ? `, Mesa ${supporter.tableNumber}` : ''}. ¡Contamos con tu apoyo en las elecciones!`;
                    const waLink = generateWhatsappLink(supporter.phone, waMsg);

                    return (
                      <tr key={supporter.id} className="hover:bg-neutral-800/40 transition">
                        <td className="py-3 pl-4 pr-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(supporter.id)}
                            onChange={() => toggleSelect(supporter.id)}
                            className="rounded border-neutral-700 bg-neutral-900 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-neutral-100">
                            {supporter.firstName} {supporter.lastName}
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono">
                            C.C. {formatCedula(supporter.cedula)}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            onClick={() => toggleWhatsappContacted(supporter.id)}
                            className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{supporter.phone}</span>
                          </a>
                          {supporter.email && (
                            <div className="text-[10px] text-neutral-500 truncate max-w-[140px]">
                              {supporter.email}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="text-neutral-300">
                            {supporter.gender === 'FEMENINO' ? 'Femenino' : supporter.gender === 'MASCULINO' ? 'Masculino' : 'Otro'}, {supporter.age}a
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            {supporter.neighborhood} ({supporter.sector})
                          </div>
                        </td>

                        <td className="py-3 px-3 max-w-[200px]">
                          <div className="font-medium text-neutral-200 truncate">
                            {supporter.pollingStationName}
                          </div>
                          <div className="text-[11px] text-indigo-400 font-mono">
                            Mesa: {supporter.tableNumber || 'S/N'}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="text-[11px] text-neutral-300">
                            Líder: <span className="font-medium">{supporter.registeredByLeaderName}</span>
                          </div>
                          {supporter.registeredBySubleaderName && (
                            <div className="text-[10px] text-emerald-400">
                              Sublíder: {supporter.registeredBySubleaderName}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${commitmentBadge.bg}`}>
                            {commitmentBadge.label}
                          </span>
                          {supporter.votedStatus && (
                            <div className="text-[10px] text-indigo-400 font-bold mt-0.5">
                              ✓ Ya Votó
                            </div>
                          )}
                        </td>

                        <td className="py-3 pr-4 pl-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => toggleWhatsappContacted(supporter.id)}
                              className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-800/60 transition"
                              title="Enviar WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>

                            <button
                              type="button"
                              onClick={() => toggleVotedStatus(supporter.id)}
                              className={`p-1.5 rounded-lg border transition ${
                                supporter.votedStatus
                                  ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/50'
                                  : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-neutral-200'
                              }`}
                              title={supporter.votedStatus ? 'Marcar como no votado' : 'Marcar como votado (Día D)'}
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => onEditSupporter(supporter)}
                              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(supporter.id)}
                              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 transition"
                              title="Eliminar"
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
        </>
      )}
    </div>
  );
};
