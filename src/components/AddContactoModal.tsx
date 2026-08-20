import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Contacto } from '../types';
import {
  X,
  UserPlus,
  MapPin,
  CheckCircle2,
  Clock,
  UserCheck,
  Shield,
  Users,
  ChevronDown,
  Info
} from 'lucide-react';
import { LOCALIDADES_CARTAGENA } from '../data/cartagenaData';

interface AddContactoModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactoToEdit?: Contacto | null;
}

export const AddContactoModal: React.FC<AddContactoModalProps> = ({ isOpen, onClose, contactoToEdit }) => {
  const { addContacto, updateContacto, currentUser, pollingStations, users, contactos } = useApp();
  
  // Basic Form States
  const [cedula, setCedula] = useState('');
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [genero, setGenero] = useState('Femenino (Mujer)');
  const [edad, setEdad] = useState(28);
  const [localidad, setLocalidad] = useState('');
  const [barrio, setBarrio] = useState('');
  const [puestoId, setPuestoId] = useState('');
  const [mesa, setMesa] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [consentimiento, setConsentimiento] = useState(true);
  
  // Requirement 1: Tipo de Contacto (C+CI vs S-CI)
  const [tipoContacto, setTipoContacto] = useState<'ACTIVO_CCI' | 'NUEVO_SCI'>('ACTIVO_CCI');

  // Requirement 2: Líder Responsable y Asignación (SELF, AS_SUBLIDER, TO_SUBLIDER)
  const [assignmentMode, setAssignmentMode] = useState<'SELF' | 'AS_SUBLIDER' | 'TO_SUBLIDER'>('SELF');
  const [selectedLiderId, setSelectedLiderId] = useState('');
  const [selectedSubliderId, setSelectedSubliderId] = useState('');

  const [error, setError] = useState('');

  // Synchronize initial state when modal opens or edits
  useEffect(() => {
    if (contactoToEdit) {
      setCedula(contactoToEdit.cedula || '');
      setNombres(contactoToEdit.nombres || '');
      setApellidos(contactoToEdit.apellidos || '');
      setTelefono(contactoToEdit.telefono || '');
      setCorreo(contactoToEdit.correo || '');
      setGenero(contactoToEdit.genero || 'Femenino (Mujer)');
      setEdad(contactoToEdit.edad || 28);
      setLocalidad(contactoToEdit.sector_comuna || '');
      setBarrio(contactoToEdit.barrio || '');
      setPuestoId(contactoToEdit.puesto_id || '');
      setMesa(contactoToEdit.mesa || '');
      setObservaciones(contactoToEdit.observaciones || '');
      setConsentimiento(contactoToEdit.consentimiento_datos);
      setSelectedLiderId(contactoToEdit.lider_id || currentUser?.id || '');

      // Determine Tipo de Contacto
      if (contactoToEdit.estado === 'NUEVO' || !contactoToEdit.consentimiento_datos) {
        setTipoContacto('NUEVO_SCI');
      } else {
        setTipoContacto('ACTIVO_CCI');
      }

      // Determine Assignment Mode
      if (contactoToEdit.rol === 'SUBLIDER') {
        setAssignmentMode('AS_SUBLIDER');
        setSelectedSubliderId('');
      } else if (contactoToEdit.sublider_id && contactoToEdit.sublider_id !== 'DIRECTO') {
        setAssignmentMode('TO_SUBLIDER');
        setSelectedSubliderId(contactoToEdit.sublider_id);
      } else {
        setAssignmentMode('SELF');
        setSelectedSubliderId('');
      }
    } else {
      setCedula('');
      setNombres('');
      setApellidos('');
      setTelefono('');
      setCorreo('');
      setGenero('Femenino (Mujer)');
      setEdad(28);
      setLocalidad('');
      setBarrio('');
      setPuestoId('');
      setMesa('');
      setObservaciones('');
      setConsentimiento(true);
      setTipoContacto('ACTIVO_CCI');
      setAssignmentMode('SELF');
      setSelectedLiderId(currentUser?.id || '');
      setSelectedSubliderId('');
      setError('');
    }
  }, [contactoToEdit, isOpen, currentUser]);

  // Target Leader ID: current user or selected supervisor leader
  const targetLiderId = useMemo(() => {
    if ((currentUser?.rol === 'ADMIN' || currentUser?.rol === 'LIDER_PRINCIPAL') && selectedLiderId) {
      return selectedLiderId;
    }
    return currentUser?.id || '';
  }, [currentUser, selectedLiderId]);

  // Available Subleaders under the active leader (STRICT ISOLATION)
  const availableSublideres = useMemo(() => {
    if (!targetLiderId) return [];

    // 1. Sublíderes registered as contacts: ONLY those belonging to this specific leader
    const fromContactos = contactos
      .filter(c => c.rol === 'SUBLIDER' && c.lider_id === targetLiderId)
      .map(c => ({
        id: c.id,
        nombre_completo: `${c.nombres} ${c.apellidos || ''}`.trim(),
        telefono: c.telefono,
        cedula: c.cedula
      }));

    // 2. Sublíderes registered as user accounts: ONLY those assigned to this specific leader
    const fromUsers = users
      .filter(u => u.rol === 'SUBLIDER' && u.lider_principal_id === targetLiderId)
      .map(u => ({
        id: u.id,
        nombre_completo: u.nombre_completo,
        telefono: u.telefono,
        cedula: u.cedula
      }));

    const map = new Map<string, { id: string; nombre_completo: string; telefono?: string; cedula?: string }>();
    fromUsers.forEach(u => map.set(u.id, u));
    fromContactos.forEach(c => {
      if (!map.has(c.id)) map.set(c.id, c);
    });

    return Array.from(map.values()).sort((a, b) => a.nombre_completo.localeCompare(b.nombre_completo));
  }, [targetLiderId, contactos, users]);

  // Listado alfabético de todos los barrios de Cartagena con su localidad
  const allBarrios = useMemo(() => {
    const list: { barrio: string; localidad: string }[] = [];
    LOCALIDADES_CARTAGENA.forEach(loc => {
      loc.barrios.forEach(b => {
        list.push({ barrio: b, localidad: loc.nombre });
      });
    });
    return list.sort((a, b) => a.barrio.localeCompare(b.barrio));
  }, []);

  // Handlers with strict type validation
  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCedula(e.target.value.replace(/\D/g, ''));
  };

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefono(e.target.value.replace(/\D/g, ''));
  };

  const handleMesaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMesa(e.target.value.replace(/\D/g, '').slice(0, 3));
  };

  const handleNombresChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNombres(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''));
  };

  const handleApellidosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApellidos(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''));
  };

  const handleBarrioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBarrio = e.target.value;
    setBarrio(selectedBarrio);

    // Asignar automáticamente la localidad correspondiente al barrio seleccionado
    const found = allBarrios.find(b => b.barrio === selectedBarrio);
    if (found) {
      setLocalidad(found.localidad);
    } else {
      setLocalidad('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Strict Validations
    if (!cedula.trim()) {
      setError('La Cédula de Ciudadanía es obligatoria (solo números).');
      return;
    }

    if (!nombres.trim()) {
      setError('El campo Nombres es obligatorio (solo letras).');
      return;
    }

    if (!apellidos.trim()) {
      setError('El campo Apellidos es obligatorio (solo letras).');
      return;
    }

    if (!telefono.trim()) {
      setError('El Teléfono Móvil es obligatorio (solo números).');
      return;
    }

    if (assignmentMode === 'TO_SUBLIDER' && !selectedSubliderId) {
      setError('Por favor selecciona el Sublíder del listado al que deseas asignar este contacto.');
      return;
    }

    if (currentUser) {
      const isMirror = (contactoToEdit as any)?.isUserMirror;
      
      // Determine final role and sublider assignment
      let finalRol: string = 'Contacto CON Consentimiento';
      let finalSubliderId: string | null = null;

      if (assignmentMode === 'AS_SUBLIDER') {
        finalRol = 'SUBLIDER';
        finalSubliderId = null;
      } else if (assignmentMode === 'TO_SUBLIDER') {
        finalRol = 'Contacto CON Consentimiento';
        finalSubliderId = selectedSubliderId || null;
      } else {
        // SELF
        finalRol = isMirror ? 'LIDER (Cuenta Real)' : 'Contacto CON Consentimiento';
        finalSubliderId = null;
      }

      // Determine final estado
      const finalEstado = tipoContacto === 'ACTIVO_CCI' ? 'PARTICIPANTE' : 'NUEVO';
      const finalConsentimiento = tipoContacto === 'ACTIVO_CCI' ? true : consentimiento;

      const payload: Omit<Contacto, 'id' | 'created_at'> = {
        lider_id: targetLiderId,
        cedula,
        nombres,
        apellidos,
        telefono,
        correo,
        genero,
        edad,
        sector_comuna: localidad,
        barrio,
        puesto_id: puestoId || (null as any),
        mesa,
        sublider_id: finalSubliderId as any,
        rol: finalRol,
        observaciones,
        consentimiento_datos: finalConsentimiento,
        estado: (contactoToEdit && !isMirror) ? contactoToEdit.estado : finalEstado,
        participo_actividad: contactoToEdit ? contactoToEdit.participo_actividad : (tipoContacto === 'ACTIVO_CCI')
      };

      const res = (contactoToEdit && !isMirror) 
        ? await updateContacto(contactoToEdit.id, payload)
        : await addContacto(payload);
        
      if (res.success) {
        onClose();
      } else {
        setError(res.error || 'Error desconocido al guardar el contacto.');
      }
    }
  };

  if (!isOpen) return null;

  const currentUserName = currentUser?.nombre_completo || 'Usuario Activo';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#141417] w-full max-w-4xl max-h-[94vh] rounded-[28px] border border-neutral-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-neutral-800/80 shrink-0 bg-[#111114]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight">
                {contactoToEdit ? 'Editar Persona de Apoyo' : 'Registrar Persona de Apoyo'}
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Ingreso de datos electorales, validación territorial y asignación de mando
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs font-bold text-rose-400 animate-in fade-in flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              {error}
            </div>
          )}

          <form id="contacto-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* ─── DATOS BÁSICOS: Cédula, Nombres, Apellidos ─── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Cédula de Ciudadanía <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={cedula} 
                  onChange={handleCedulaChange} 
                  placeholder="Solo números" 
                  required 
                  className="w-full bg-[#0b0b0e] border border-neutral-800 text-white px-3.5 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Nombres <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={nombres} 
                  onChange={handleNombresChange} 
                  placeholder="Solo letras" 
                  required 
                  className="w-full bg-[#0b0b0e] border border-neutral-800 text-white px-3.5 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Apellidos <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={apellidos} 
                  onChange={handleApellidosChange} 
                  placeholder="Solo letras" 
                  required 
                  className="w-full bg-[#0b0b0e] border border-neutral-800 text-white px-3.5 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                />
              </div>
            </div>

            {/* ─── CONTACTO & DEMOGRAFÍA: Teléfono, Correo, Género, Edad ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Teléfono Móvil <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="tel" 
                  inputMode="numeric"
                  value={telefono} 
                  onChange={handleTelefonoChange} 
                  placeholder="Ej: 3001234567" 
                  required 
                  className="w-full bg-[#0b0b0e] border border-neutral-800 text-white px-3.5 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Correo Electrónico
                </label>
                <input 
                  type="email" 
                  value={correo} 
                  onChange={e => setCorreo(e.target.value)} 
                  placeholder="correo@ejemplo.com" 
                  className="w-full bg-[#0b0b0e] border border-neutral-800 text-white px-3.5 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Género
                </label>
                <select 
                  value={genero} 
                  onChange={e => setGenero(e.target.value)}
                  className="w-full bg-[#0b0b0e] border border-neutral-800 text-white px-3 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition cursor-pointer"
                >
                  <option value="Femenino (Mujer)">Femenino (Mujer)</option>
                  <option value="Masculino (Hombre)">Masculino (Hombre)</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-neutral-300">
                    Edad: <strong className="text-amber-400">{edad} años</strong>
                  </label>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {edad <= 25 ? '18-25' : edad <= 35 ? '26-35' : edad <= 45 ? '36-45' : edad <= 60 ? '46-60' : '61+'}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="18" 
                  max="99" 
                  value={edad} 
                  onChange={e => setEdad(Number(e.target.value))} 
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 mt-2" 
                />
              </div>
            </div>

            {/* ─── UBICACIÓN: Barrio primero, Localidad asignada automáticamente ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" /> Barrio del Contacto <span className="text-rose-500">*</span>
                </label>
                <select 
                  value={barrio} 
                  onChange={handleBarrioChange}
                  className="w-full bg-[#0b0b0e] border border-neutral-800 text-white px-3.5 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 outline-none transition cursor-pointer"
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
                  <span>🗺️</span> Localidad (Asignada automáticamente)
                </label>
                <input 
                  type="text"
                  readOnly
                  value={localidad || ''}
                  placeholder="Se relaciona automáticamente con el barrio"
                  className="w-full bg-neutral-900/60 border border-neutral-800 text-neutral-300 px-3.5 py-2.5 rounded-xl text-xs outline-none cursor-not-allowed font-medium"
                />
              </div>
            </div>

            {/* ─── PUESTO DE VOTACIÓN Y MESA ─── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-indigo-400 mb-1.5 flex items-center gap-1.5">
                  <span>🗳️</span> Puesto de Votación
                </label>
                <select 
                  value={puestoId} 
                  onChange={e => setPuestoId(e.target.value)}
                  className="w-full bg-[#0b0b0e] border border-neutral-800 text-white px-3.5 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition cursor-pointer"
                >
                  <option value="">Seleccione un puesto de votación...</option>
                  {pollingStations.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.codigo_puesto}] {p.nombre_puesto} {p.barrio_corregimiento ? `— (${p.barrio_corregimiento})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                  Mesa
                </label>
                <input 
                  type="text" 
                  inputMode="numeric"
                  value={mesa} 
                  onChange={handleMesaChange} 
                  placeholder="Ej: 04 (solo números)"
                  className="w-full bg-[#0b0b0e] border border-neutral-800 text-white px-3.5 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition" 
                />
              </div>
            </div>

            {/* ─── REQUERIMIENTO 1: TIPO DE CONTACTO (C+CI vs S-CI) ─── */}
            <div className="bg-[#111114] border border-neutral-800 rounded-2xl p-4.5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Tipo de Contacto & Estado Inicial
                </label>
                <span className="text-[11px] text-neutral-400">
                  Selecciona la clasificación del elector
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Option 1: CONTACTO ACTIVO (C+CI) */}
                <div
                  onClick={() => {
                    setTipoContacto('ACTIVO_CCI');
                    setConsentimiento(true);
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    tipoContacto === 'ACTIVO_CCI'
                      ? 'bg-emerald-950/30 border-emerald-500 shadow-md shadow-emerald-500/10'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                    tipoContacto === 'ACTIVO_CCI' ? 'border-emerald-500 bg-emerald-500' : 'border-neutral-600'
                  }`}>
                    {tipoContacto === 'ACTIVO_CCI' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">CONTACTO ACTIVO</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                        [C+CI]
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Con Consentimiento e Información completa. Elector fidelizado y confirmado.
                    </p>
                  </div>
                </div>

                {/* Option 2: CONTACTO NUEVO (S-CI) */}
                <div
                  onClick={() => {
                    setTipoContacto('NUEVO_SCI');
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    tipoContacto === 'NUEVO_SCI'
                      ? 'bg-amber-950/30 border-amber-500 shadow-md shadow-amber-500/10'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                    tipoContacto === 'NUEVO_SCI' ? 'border-amber-500 bg-amber-500' : 'border-neutral-600'
                  }`}>
                    {tipoContacto === 'NUEVO_SCI' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">CONTACTO NUEVO</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                        [S-CI]
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Sin Confirmar / Nuevo Prospecto. Requiere contacto posterior o validación.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── REQUERIMIENTO 2: RECUADRO [LÍDER RESPONSABLE Y ASIGNACIÓN] ─── */}
            <div className="bg-[#111114] border border-neutral-800 rounded-2xl p-5 space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-neutral-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    Líder Responsable & Asignación
                  </h4>
                </div>
                <span className="text-[11px] text-neutral-400">
                  Líder en sesión activa: <strong className="text-indigo-300">{currentUserName}</strong>
                </span>
              </div>

              {/* Supervisor leader selection for ADMIN / LIDER_PRINCIPAL */}
              {(currentUser?.rol === 'ADMIN' || currentUser?.rol === 'LIDER_PRINCIPAL') && (
                <div className="mb-2">
                  <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                    Supervisor: Reasignar Líder Responsable (Opcional)
                  </label>
                  <select
                    value={selectedLiderId}
                    onChange={e => {
                      setSelectedLiderId(e.target.value);
                      setSelectedSubliderId('');
                    }}
                    className="w-full bg-[#0b0b0e] border border-neutral-800 text-white px-3 py-2 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition cursor-pointer"
                  >
                    <option value={currentUser.id}>✓ ASIGNARME A MÍ MISMO ({currentUser.nombre_completo})</option>
                    {users.filter(u => u.rol === 'LIDER' || u.rol === 'LIDER_PRINCIPAL').map(l => (
                      <option key={l.id} value={l.id}>{l.nombre_completo} ({l.rol.replace(/_/g, ' ')})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 3 Modos de Asignación requeridos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Modo 1: ASIGNARME A MÍ MISMO */}
                <div
                  onClick={() => {
                    setAssignmentMode('SELF');
                    setSelectedSubliderId('');
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    assignmentMode === 'SELF'
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md shadow-indigo-500/10'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      assignmentMode === 'SELF' ? 'border-indigo-500 bg-indigo-500' : 'border-neutral-600'
                    }`}>
                      {assignmentMode === 'SELF' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                    <span className="text-xs font-bold text-white truncate">
                      Asignarme a mí mismo
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Contacto directo de <strong>{currentUserName.split(' ')[0]}</strong> sin intermediación.
                  </p>
                </div>

                {/* Modo 2: ASIGNAR COMO SUBLÍDER */}
                <div
                  onClick={() => {
                    setAssignmentMode('AS_SUBLIDER');
                    setSelectedSubliderId('');
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    assignmentMode === 'AS_SUBLIDER'
                      ? 'bg-pink-950/40 border-pink-500 shadow-md shadow-pink-500/10'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      assignmentMode === 'AS_SUBLIDER' ? 'border-pink-500 bg-pink-500' : 'border-neutral-600'
                    }`}>
                      {assignmentMode === 'AS_SUBLIDER' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                    <span className="text-xs font-bold text-pink-300 truncate">
                      Asignar como SUBLÍDER
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Esta persona será registrada como nuevo <strong>Sublíder</strong> bajo tu mando.
                  </p>
                </div>

                {/* Modo 3: ASIGNAR A UN SUBLÍDER DE MI LISTADO */}
                <div
                  onClick={() => {
                    setAssignmentMode('TO_SUBLIDER');
                  }}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                    assignmentMode === 'TO_SUBLIDER'
                      ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      assignmentMode === 'TO_SUBLIDER' ? 'border-emerald-500 bg-emerald-500' : 'border-neutral-600'
                    }`}>
                      {assignmentMode === 'TO_SUBLIDER' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                    </div>
                    <span className="text-xs font-bold text-emerald-300 truncate">
                      Asignar a un Sublíder
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Vincular este contacto a un Sublíder existente de tu equipo.
                  </p>
                </div>

              </div>

              {/* LISTBOX DESPLEGABLE CUANDO SE ELIGE "ASIGNAR A UN SUBLÍDER" */}
              {assignmentMode === 'TO_SUBLIDER' && (
                <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-bold text-emerald-400 mb-1.5 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Seleccionar Sublíder del Listado ({availableSublideres.length} disponibles)
                  </label>
                  
                  {availableSublideres.length > 0 ? (
                    <select
                      value={selectedSubliderId}
                      onChange={e => setSelectedSubliderId(e.target.value)}
                      required
                      className="w-full bg-[#0b0b0e] border border-emerald-500/40 text-white px-3.5 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none transition cursor-pointer"
                    >
                      <option value="">-- Selecciona el Sublíder responsable --</option>
                      {availableSublideres.map(sl => (
                        <option key={sl.id} value={sl.id}>
                          {sl.nombre_completo} {sl.telefono ? `(Tel: ${sl.telefono})` : ''} {sl.cedula ? `[CC: ${sl.cedula}]` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between gap-3">
                      <span>No tienes sublíderes registrados actualmente bajo tu mando.</span>
                      <button
                        type="button"
                        onClick={() => setAssignmentMode('AS_SUBLIDER')}
                        className="px-3 py-1 bg-amber-500 text-black font-bold rounded-lg text-[11px] hover:bg-amber-400 transition"
                      >
                        Crear como Sublíder
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* ─── NOTAS / OBSERVACIONES ─── */}
            <div>
              <label className="block text-xs font-bold text-neutral-300 mb-1.5">
                Notas / Observaciones
              </label>
              <textarea 
                value={observaciones}
                onChange={e => setObservaciones(e.target.value)}
                rows={2}
                placeholder="Detalles adicionales sobre el contacto o su gestión territorial..."
                className="w-full bg-[#0b0b0e] border border-neutral-800 text-white px-3.5 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none" 
              />
            </div>

            {/* ─── HABEAS DATA / CONSENTIMIENTO ─── */}
            <div className="bg-indigo-500/5 border border-indigo-500/15 rounded-2xl p-4 flex items-start gap-3">
              <input 
                type="checkbox" 
                id="consentimiento" 
                checked={consentimiento} 
                onChange={e => setConsentimiento(e.target.checked)} 
                className="mt-0.5 w-4 h-4 rounded border-neutral-700 text-indigo-600 focus:ring-indigo-500 bg-neutral-900 cursor-pointer"
              />
              <label htmlFor="consentimiento" className="text-xs text-neutral-300 cursor-pointer leading-relaxed">
                <span className="font-bold text-white block mb-0.5">Autorización de Tratamiento de Datos Personales (Habeas Data)</span>
                Confirmo que el ciudadano ha autorizado libre y voluntariamente el registro y uso de su información para actividades y convocatorias de apoyo territorial.
              </label>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-neutral-800/80 shrink-0 bg-[#111114]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-800 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="contacto-form"
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 shadow-lg shadow-indigo-500/20 transition cursor-pointer"
          >
            {contactoToEdit ? 'Actualizar Contacto' : 'Guardar y Registrar'}
          </button>
        </div>

      </div>
    </div>
  );
};
