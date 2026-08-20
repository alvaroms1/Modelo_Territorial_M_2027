import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { X, ExternalLink, ClipboardPaste, MapPin, Map, Building, CheckCircle2, AlertCircle } from 'lucide-react';
import { LOCALIDADES_CARTAGENA } from '../data/cartagenaData';

interface AddPollingStationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPollingStationModal: React.FC<AddPollingStationModalProps> = ({ isOpen, onClose }) => {
  const { addPollingStation } = useApp();

  const [nombrePuesto, setNombrePuesto] = useState('');
  const [comunaLocalidad, setComunaLocalidad] = useState('');
  const [barrioCorregimiento, setBarrioCorregimiento] = useState('');
  const [direccion, setDireccion] = useState('');
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasteHint, setShowPasteHint] = useState(false);
  
  const nombreInputRef = useRef<HTMLInputElement>(null);

  // Listado alfabético de todos los barrios de Cartagena
  const allBarrios = useMemo(() => {
    const list: { barrio: string; localidad: string }[] = [];
    LOCALIDADES_CARTAGENA.forEach(loc => {
      loc.barrios.forEach(b => {
        list.push({ barrio: b, localidad: loc.nombre });
      });
    });
    return list.sort((a, b) => a.barrio.localeCompare(b.barrio));
  }, []);

  if (!isOpen) return null;

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
    
    if (!nombrePuesto.trim()) {
      setError('Por favor ingrese el nombre del puesto de votación.');
      return;
    }

    if (!barrioCorregimiento) {
      setError('Por favor seleccione el barrio del puesto.');
      return;
    }

    setIsSubmitting(true);
    
    const generatedCodigo = `PV-${Math.floor(100 + Math.random() * 900)}`;

    const { success, error: submitError } = await addPollingStation({
      codigo_puesto: generatedCodigo,
      nombre_puesto: nombrePuesto.trim().toUpperCase(),
      comuna_localidad: comunaLocalidad,
      barrio_corregimiento: barrioCorregimiento,
      direccion: direccion.trim(),
      zona_influencia: '',
    });

    setIsSubmitting(false);

    if (success) {
      onClose();
      setNombrePuesto('');
      setComunaLocalidad('');
      setBarrioCorregimiento('');
      setDireccion('');
    } else {
      setError(submitError || 'Error al guardar el puesto de votación');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#141417] rounded-3xl w-full max-w-xl overflow-hidden border border-neutral-800 shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in">
        
        {/* Header */}
        <div className="p-6 bg-[#0e0e11] border-b border-neutral-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/10 p-2.5 rounded-2xl border border-amber-500/20">
              <Building className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">Nuevo Puesto de Votación</h2>
              <p className="text-xs text-neutral-400">Consulta Registraduría o Ingreso Manual</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-neutral-500 hover:text-white transition p-2 hover:bg-neutral-800 rounded-xl cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Enlace de Búsqueda Externa en Registraduría */}
          <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-indigo-300">Búsqueda en la Registraduría</span>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Consulta con la cédula el puesto oficial en el censo electoral.
              </p>
            </div>
            <a
              href="https://consultacenso.registraduria.gov.co"
              target="_blank"
              rel="noreferrer"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 shadow-lg shadow-indigo-600/20"
            >
              <ExternalLink size={13} />
              <span>Ir a Registraduría</span>
            </a>
          </div>

          <form id="add-station-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Campo: Nombre del Puesto */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-neutral-200">
                  Nombre del Puesto de Votación <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handlePasteNombre}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20 transition cursor-pointer"
                  title="Pegar texto copiado"
                >
                  <ClipboardPaste size={12} />
                  <span>Pegar</span>
                </button>
              </div>

              <input
                ref={nombreInputRef}
                type="text"
                required
                value={nombrePuesto}
                onChange={(e) => setNombrePuesto(e.target.value.toUpperCase())}
                className="w-full bg-[#0b0b0e] border border-neutral-800 text-white px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition uppercase text-xs font-medium"
                placeholder="Ej: I.E. SOLEDAD ACOSTA DE SAMPER"
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
              <label className="block text-xs font-bold text-neutral-200 mb-1.5">
                Dirección del Puesto
              </label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full bg-[#0b0b0e] border border-neutral-800 text-white px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition text-xs font-medium"
                placeholder="Ej: Calle 30 # 48-152"
              />
            </div>

            {/* Campo: Barrio y Localidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Barrio del Puesto <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={barrioCorregimiento}
                  onChange={handleBarrioChange}
                  className="w-full bg-[#0b0b0e] border border-neutral-800 text-white px-3.5 py-2.5 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition text-xs cursor-pointer"
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
                <label className="block text-xs font-bold text-neutral-400 mb-1.5 flex items-center gap-1.5">
                  <Map className="w-3.5 h-3.5 text-neutral-400" /> Localidad (Asignada automáticamente)
                </label>
                <input
                  type="text"
                  readOnly
                  value={comunaLocalidad}
                  className="w-full bg-neutral-900/60 border border-neutral-800 text-neutral-300 px-3.5 py-2.5 rounded-xl outline-none cursor-not-allowed text-xs font-medium"
                  placeholder="Se relaciona automáticamente con el barrio"
                />
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-5 bg-[#0e0e11] border-t border-neutral-800 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="add-station-form"
            disabled={isSubmitting}
            className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 size={15} />
            <span>{isSubmitting ? 'Guardando...' : 'Guardar Puesto'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
