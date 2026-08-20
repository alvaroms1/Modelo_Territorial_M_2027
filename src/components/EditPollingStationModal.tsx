import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { X, Building, MapPin, Map, CheckCircle2, AlertCircle } from 'lucide-react';
import { LOCALIDADES_CARTAGENA } from '../data/cartagenaData';
import { PollingStation } from '../types';

interface EditPollingStationModalProps {
  station: PollingStation | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditPollingStationModal: React.FC<EditPollingStationModalProps> = ({
  station,
  isOpen,
  onClose
}) => {
  const { updatePollingStation } = useApp();

  const [codigoPuesto, setCodigoPuesto] = useState('');
  const [nombrePuesto, setNombrePuesto] = useState('');
  const [comunaLocalidad, setComunaLocalidad] = useState('');
  const [barrioCorregimiento, setBarrioCorregimiento] = useState('');
  const [direccion, setDireccion] = useState('');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Listado alfabético de todos los barrios
  const allBarrios = useMemo(() => {
    const list: { barrio: string; localidad: string }[] = [];
    LOCALIDADES_CARTAGENA.forEach(loc => {
      loc.barrios.forEach(b => {
        list.push({ barrio: b, localidad: loc.nombre });
      });
    });
    return list.sort((a, b) => a.barrio.localeCompare(b.barrio));
  }, []);

  useEffect(() => {
    if (station) {
      setCodigoPuesto(station.codigo_puesto || '');
      setNombrePuesto(station.nombre_puesto || '');
      setDireccion(station.direccion || '');
      setBarrioCorregimiento(station.barrio_corregimiento || '');
      setComunaLocalidad(station.comuna_localidad || '');
      setError('');
    }
  }, [station]);

  if (!isOpen || !station) return null;

  const handleBarrioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBarrio = e.target.value;
    setBarrioCorregimiento(selectedBarrio);
    
    // Auto-completar localidad
    const found = allBarrios.find(b => b.barrio === selectedBarrio);
    if (found) {
      setComunaLocalidad(found.localidad);
    } else {
      setComunaLocalidad('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nombrePuesto) {
      setError('El nombre del puesto es obligatorio.');
      return;
    }

    if (!window.confirm(`¿Deseas guardar los cambios del puesto "${nombrePuesto}"?`)) {
      return;
    }

    setIsSubmitting(true);

    const { success, error: updateError } = await updatePollingStation(station.id, {
      codigo_puesto: codigoPuesto,
      nombre_puesto: nombrePuesto,
      comuna_localidad: comunaLocalidad,
      barrio_corregimiento: barrioCorregimiento,
      direccion: direccion
    });

    setIsSubmitting(false);

    if (success) {
      onClose();
    } else {
      setError(updateError || 'Error al actualizar el puesto de votación');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#18181b] rounded-3xl w-full max-w-xl overflow-hidden border border-neutral-800 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-[#09090b] border-b border-neutral-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2.5 rounded-2xl border border-amber-500/20">
              <Building className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Editar Puesto de Votación</h2>
              <p className="text-xs text-neutral-400">Asignar Barrio, Localidad o modificar datos</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition p-2 hover:bg-neutral-800 rounded-xl cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="edit-station-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Código y Nombre */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Código
                </label>
                <input
                  type="text"
                  value={codigoPuesto}
                  onChange={(e) => setCodigoPuesto(e.target.value.toUpperCase())}
                  className="w-full bg-[#09090b] border border-neutral-800 text-amber-400 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="PV-001"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Nombre del Puesto *
                </label>
                <input
                  type="text"
                  required
                  value={nombrePuesto}
                  onChange={(e) => setNombrePuesto(e.target.value.toUpperCase())}
                  className="w-full bg-[#09090b] border border-neutral-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none uppercase"
                  placeholder="Nombre del puesto"
                />
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full bg-[#09090b] border border-neutral-800 text-white px-4 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Dirección del puesto"
              />
            </div>

            {/* Barrio y Localidad */}
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-amber-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Asignar Barrio *
                </label>
                <select
                  value={barrioCorregimiento}
                  onChange={handleBarrioChange}
                  className="w-full bg-[#09090b] border border-neutral-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition text-xs font-semibold cursor-pointer"
                >
                  <option value="">-- [No Asignado] Seleccionar Barrio --</option>
                  {allBarrios.map(b => (
                    <option key={b.barrio} value={b.barrio}>
                      {b.barrio} ({b.localidad.split(':')[0]})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <Map className="w-3.5 h-3.5 text-neutral-500" /> Localidad Asignada
                </label>
                <input
                  type="text"
                  readOnly
                  value={comunaLocalidad || 'No Asignado'}
                  className="w-full bg-neutral-900/90 border border-neutral-800 text-neutral-300 px-4 py-2.5 rounded-xl outline-none text-xs font-medium cursor-not-allowed"
                />
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 bg-[#09090b] border-t border-neutral-800 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="edit-station-form"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 size={16} />
            <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
