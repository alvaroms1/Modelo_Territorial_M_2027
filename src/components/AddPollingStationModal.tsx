import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { X, ExternalLink, ClipboardPaste, MapPin, Map, Building, Search, CheckCircle2, Sparkles, AlertCircle } from 'lucide-react';
import { LOCALIDADES_CARTAGENA, CARTAGENA_POLLING_STATIONS } from '../data/cartagenaData';
import { smartSearch } from '../utils/helpers';

interface AddPollingStationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPollingStationModal: React.FC<AddPollingStationModalProps> = ({ isOpen, onClose }) => {
  const { addPollingStation } = useApp();
  
  // Selection mode: 'list' (official list) vs 'manual' (Registraduría / custom paste)
  const [mode, setMode] = useState<'list' | 'manual'>('list');
  const [selectedSeedStation, setSelectedSeedStation] = useState<string>('');
  const [searchSeedTerm, setSearchSeedTerm] = useState<string>('');

  const [nombrePuesto, setNombrePuesto] = useState('');
  const [comunaLocalidad, setComunaLocalidad] = useState('');
  const [barrioCorregimiento, setBarrioCorregimiento] = useState('');
  const [direccion, setDireccion] = useState('');
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasteHint, setShowPasteHint] = useState(false);
  
  const nombreInputRef = useRef<HTMLInputElement>(null);

  // Generar listado alfabético de todos los barrios
  const allBarrios = useMemo(() => {
    const list: { barrio: string; localidad: string }[] = [];
    LOCALIDADES_CARTAGENA.forEach(loc => {
      loc.barrios.forEach(b => {
        list.push({ barrio: b, localidad: loc.nombre });
      });
    });
    return list.sort((a, b) => a.barrio.localeCompare(b.barrio));
  }, []);

  // Filtered seed stations for autocomplete
  const filteredSeedStations = useMemo(() => {
    if (!searchSeedTerm) return CARTAGENA_POLLING_STATIONS;
    return CARTAGENA_POLLING_STATIONS.filter(s =>
      smartSearch([s.nombre_puesto, s.direccion, s.codigo_puesto, s.barrio_corregimiento], searchSeedTerm)
    );
  }, [searchSeedTerm]);

  const handleSelectSeedStation = (stationId: string) => {
    setSelectedSeedStation(stationId);
    if (!stationId) {
      setNombrePuesto('');
      setDireccion('');
      return;
    }

    const station = CARTAGENA_POLLING_STATIONS.find(s => s.id === stationId);
    if (station) {
      setNombrePuesto(station.nombre_puesto);
      setDireccion(station.direccion);
      if (station.barrio_corregimiento) {
        setBarrioCorregimiento(station.barrio_corregimiento);
        const found = allBarrios.find(b => b.barrio === station.barrio_corregimiento);
        if (found) {
          setComunaLocalidad(found.localidad);
        } else if (station.comuna_localidad) {
          setComunaLocalidad(station.comuna_localidad);
        }
      }
    }
  };

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

  if (!isOpen) return null;

  const handlePasteNombre = async () => {
    if (nombreInputRef.current) {
      nombreInputRef.current.focus();
    }
    setShowPasteHint(false);

    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        setNombrePuesto(text.toUpperCase());
      } else {
        throw new Error("Clipboard API no soportada");
      }
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err);
      setShowPasteHint(true);
      setTimeout(() => setShowPasteHint(false), 5000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!nombrePuesto) {
      setError('Por favor seleccione o ingrese el nombre del puesto de votación.');
      return;
    }

    if (!barrioCorregimiento) {
      setError('Por favor seleccione el barrio correspondiente.');
      return;
    }

    setIsSubmitting(true);
    
    const generatedCodigo = `PST-${Math.floor(100000 + Math.random() * 900000)}`;

    const { success, error: submitError } = await addPollingStation({
      codigo_puesto: generatedCodigo,
      nombre_puesto: nombrePuesto,
      comuna_localidad: comunaLocalidad,
      barrio_corregimiento: barrioCorregimiento,
      direccion: direccion,
      zona_influencia: '',
    });

    setIsSubmitting(false);

    if (success) {
      onClose();
      // Reset form
      setSelectedSeedStation('');
      setSearchSeedTerm('');
      setNombrePuesto('');
      setComunaLocalidad('');
      setBarrioCorregimiento('');
      setDireccion('');
      setMode('list');
    } else {
      setError(submitError || 'Error al guardar el puesto de votación');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#18181b] rounded-3xl w-full max-w-2xl overflow-hidden border border-neutral-800 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-[#09090b] border-b border-neutral-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2.5 rounded-2xl border border-amber-500/20">
              <Building className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Nuevo Puesto de Votación</h2>
              <p className="text-xs text-neutral-400">Cartagena de Indias - Registro y asignación territorial</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition p-2 hover:bg-neutral-800 rounded-xl"
          >
            <X size={22} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-4 bg-[#09090b]/50 border-b border-neutral-800/80 flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode('list');
              setError('');
            }}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              mode === 'list'
                ? 'text-amber-400 border-amber-400'
                : 'text-neutral-500 border-transparent hover:text-neutral-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Seleccionar de Lista Oficial ({CARTAGENA_POLLING_STATIONS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('manual');
              setSelectedSeedStation('');
              setError('');
            }}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              mode === 'manual'
                ? 'text-indigo-400 border-indigo-400'
                : 'text-neutral-500 border-transparent hover:text-neutral-300'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Buscar en Registraduría / Ingreso Manual</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="add-station-form" onSubmit={handleSubmit} className="space-y-5">

            {/* MODE 1: Official List Selector */}
            {mode === 'list' && (
              <div className="bg-neutral-900/90 border border-amber-500/20 rounded-2xl p-4 space-y-3">
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <Building className="w-4 h-4" /> Selecciona el Puesto de Votación Oficial
                </label>
                <p className="text-[11px] text-neutral-400">
                  Elige tu puesto del listado oficial. El nombre y la dirección se cargarán automáticamente.
                </p>

                <select
                  value={selectedSeedStation}
                  onChange={(e) => handleSelectSeedStation(e.target.value)}
                  className="w-full bg-[#09090b] border border-neutral-700 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition text-xs font-medium cursor-pointer"
                >
                  <option value="">-- Haz clic aquí para buscar y seleccionar el puesto --</option>
                  {CARTAGENA_POLLING_STATIONS.map((st) => (
                    <option key={st.id} value={st.id}>
                      [{st.codigo_puesto}] {st.nombre_puesto} — ({st.direccion})
                    </option>
                  ))}
                </select>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('manual');
                      setSelectedSeedStation('');
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold underline flex items-center gap-1"
                  >
                    ¿No encuentras el puesto aquí? Haz clic para buscar en la Registraduría
                  </button>
                </div>
              </div>
            )}

            {/* MODE 2: Registraduría search button and helper */}
            {mode === 'manual' && (
              <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-indigo-300">Búsqueda Externa en la Registraduría</span>
                    <p className="text-[11px] text-neutral-400">
                      Abre el censo oficial, consulta con la cédula y copia el nombre del puesto.
                    </p>
                  </div>
                  <a
                    href="https://consultacenso.registraduria.gov.co"
                    target="_blank"
                    rel="noreferrer"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shrink-0 shadow-lg shadow-indigo-600/20"
                  >
                    <ExternalLink size={14} />
                    <span>1. Ir a la Registraduría</span>
                  </a>
                </div>
              </div>
            )}

            {/* Campo: Nombre del Puesto */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  Nombre del Puesto *
                </label>
                {mode === 'manual' && (
                  <button
                    type="button"
                    onClick={handlePasteNombre}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20 transition cursor-pointer"
                    title="Pegar texto copiado de la Registraduría"
                  >
                    <ClipboardPaste size={12} />
                    <span>Pegar</span>
                  </button>
                )}
              </div>

              <input
                ref={nombreInputRef}
                type="text"
                required
                value={nombrePuesto}
                readOnly={mode === 'list' && !!selectedSeedStation}
                onChange={(e) => setNombrePuesto(e.target.value.toUpperCase())}
                className={`w-full bg-[#09090b] border border-neutral-800 text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition uppercase text-sm ${
                  mode === 'list' && selectedSeedStation ? 'bg-neutral-900/60 text-neutral-300 cursor-not-allowed' : ''
                }`}
                placeholder={mode === 'list' ? 'Selecciona un puesto de la lista superior...' : 'Ej: I.E. SOLEDAD ACOSTA DE SAMPER'}
              />

              {showPasteHint && (
                <div className="mt-2 p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-xs animate-in fade-in flex items-center gap-2">
                  <ClipboardPaste size={14} className="shrink-0 text-indigo-400" />
                  <span>En tu móvil: mantén presionado el cuadro de texto y toca <strong>"Pegar"</strong>.</span>
                </div>
              )}
            </div>

            {/* Campo: Dirección */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Dirección del Puesto
              </label>
              <input
                type="text"
                value={direccion}
                readOnly={mode === 'list' && !!selectedSeedStation}
                onChange={(e) => setDireccion(e.target.value)}
                className={`w-full bg-[#09090b] border border-neutral-800 text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm ${
                  mode === 'list' && selectedSeedStation ? 'bg-neutral-900/60 text-neutral-300 cursor-not-allowed' : ''
                }`}
                placeholder="Ej: Calle 67 # 3-45"
              />
            </div>

            {/* Campo: Barrio y Localidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Barrio del Puesto *
                </label>
                <select
                  required
                  value={barrioCorregimiento}
                  onChange={handleBarrioChange}
                  className="w-full bg-[#09090b] border border-neutral-800 text-white px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition text-sm cursor-pointer"
                >
                  <option value="">Seleccionar Barrio...</option>
                  {allBarrios.map(b => (
                    <option key={b.barrio} value={b.barrio}>
                      {b.barrio}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <Map className="w-3.5 h-3.5 text-neutral-500" /> Localidad (Asignada automáticamente)
                </label>
                <input
                  type="text"
                  readOnly
                  value={comunaLocalidad}
                  className="w-full bg-neutral-900/80 border border-neutral-800 text-neutral-400 px-4 py-2.5 rounded-xl outline-none cursor-not-allowed text-xs font-medium"
                  placeholder="Se relaciona automáticamente con el barrio"
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
            className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="add-station-form"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white px-6 py-2 rounded-xl text-sm font-bold transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 size={16} />
            <span>{isSubmitting ? 'Guardando...' : 'Guardar Puesto'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
