import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  Vote,
  MapPin,
  Calendar,
  Sparkles,
  MessageCircle,
} from 'lucide-react';
import { getAgeBracket, generateWhatsappLink, formatCedula } from '../utils/helpers';
import { Gender, VotingCommitment, Supporter } from '../types';

interface AddSupporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  supporterToEdit?: Supporter | null;
}

export const AddSupporterModal: React.FC<AddSupporterModalProps> = ({
  isOpen,
  onClose,
  supporterToEdit,
}) => {
  const {
    currentUser,
    users,
    pollingStations,
    addSupporter,
    updateSupporter,
    checkCedulaExists,
    allSectors,
    allNeighborhoods,
  } = useApp();

  const [cedula, setCedula] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender>('FEMENINO');
  const [age, setAge] = useState<number>(30);
  const [neighborhood, setNeighborhood] = useState('');
  const [sector, setSector] = useState('');
  const [pollingStationId, setPollingStationId] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [votingCommitment, setVotingCommitment] = useState<VotingCommitment>('CONFIRMADO');
  const [subleaderId, setSubleaderId] = useState('');
  const [notes, setNotes] = useState('');

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [justSavedSupporter, setJustSavedSupporter] = useState<Supporter | null>(null);

  // Load editing data if available
  useEffect(() => {
    if (supporterToEdit) {
      setCedula(supporterToEdit.cedula);
      setFirstName(supporterToEdit.firstName);
      setLastName(supporterToEdit.lastName);
      setPhone(supporterToEdit.phone);
      setEmail(supporterToEdit.email || '');
      setGender(supporterToEdit.gender);
      setAge(supporterToEdit.age);
      setNeighborhood(supporterToEdit.neighborhood);
      setSector(supporterToEdit.sector);
      setPollingStationId(supporterToEdit.pollingStationId);
      setTableNumber(supporterToEdit.tableNumber || '');
      setVotingCommitment(supporterToEdit.votingCommitment);
      setSubleaderId(supporterToEdit.registeredBySubleaderId || '');
      setNotes(supporterToEdit.notes || '');
    } else {
      // Reset defaults
      setCedula('');
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setGender('FEMENINO');
      setAge(28);
      setNeighborhood(allNeighborhoods[0] || 'La Pradera');
      setSector(currentUser?.sector || allSectors[0] || 'Comuna 1 - Norte');
      setPollingStationId(currentUser?.assignedPollingStationId || pollingStations[0]?.id || '');
      setTableNumber('');
      setVotingCommitment('CONFIRMADO');
      setSubleaderId(currentUser?.role === 'SUBLIDER' ? currentUser.id : '');
      setNotes('');
      setDuplicateWarning(null);
      setErrorMsg('');
      setJustSavedSupporter(null);
    }
  }, [supporterToEdit, isOpen, currentUser, pollingStations, allNeighborhoods, allSectors]);

  // Real-time cedula duplicate check
  const handleCedulaChange = (val: string) => {
    setCedula(val);
    const clean = val.replace(/\D/g, '');
    if (clean.length >= 6) {
      const existing = checkCedulaExists(clean);
      if (existing && (!supporterToEdit || existing.id !== supporterToEdit.id)) {
        setDuplicateWarning(
          `¡Atención! Esta cédula ya está registrada a nombre de ${existing.firstName} ${existing.lastName} por ${existing.registeredByLeaderName} ${existing.registeredBySubleaderName ? `(Sublíder: ${existing.registeredBySubleaderName})` : ''}.`
        );
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!cedula.trim() || !firstName.trim() || !lastName.trim() || !phone.trim()) {
      setErrorMsg('Cédula, Nombres, Apellidos y Teléfono WhatsApp son requeridos.');
      return;
    }

    const cleanCedula = cedula.replace(/\D/g, '');
    const station = pollingStations.find(ps => ps.id === pollingStationId);
    const stationName = station ? station.name : 'Puesto General';

    // Determine Leader & Subleader assignment
    let leaderId = currentUser?.id || 'user-admin';
    let leaderName = currentUser?.fullName || 'Administrador';
    let subId: string | undefined = undefined;
    let subName: string | undefined = undefined;

    if (currentUser?.role === 'SUPER_ADMIN') {
      // If a sublíder was selected
      if (subleaderId) {
        const sub = users.find(u => u.id === subleaderId);
        if (sub) {
          subId = sub.id;
          subName = sub.fullName;
          leaderId = sub.parentLeaderId || leaderId;
          const parentLdr = users.find(u => u.id === sub.parentLeaderId);
          if (parentLdr) leaderName = parentLdr.fullName;
        }
      }
    } else if (currentUser?.role === 'LIDER_COORDINADOR') {
      leaderId = currentUser.id;
      leaderName = currentUser.fullName;
      if (subleaderId) {
        const sub = users.find(u => u.id === subleaderId);
        if (sub) {
          subId = sub.id;
          subName = sub.fullName;
        }
      }
    } else if (currentUser?.role === 'SUBLIDER') {
      subId = currentUser.id;
      subName = currentUser.fullName;
      leaderId = currentUser.parentLeaderId || currentUser.id;
      leaderName = currentUser.parentLeaderName || currentUser.fullName;
    }

    if (supporterToEdit) {
      const updated: Supporter = {
        ...supporterToEdit,
        cedula: cleanCedula,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        gender,
        age: Number(age) || 30,
        ageBracket: getAgeBracket(Number(age) || 30),
        neighborhood: neighborhood.trim() || 'Barrio General',
        sector: sector.trim() || 'Sector General',
        pollingStationId: pollingStationId || 'ps-1',
        pollingStationName: stationName,
        tableNumber: tableNumber.trim() || undefined,
        registeredByLeaderId: leaderId,
        registeredByLeaderName: leaderName,
        registeredBySubleaderId: subId,
        registeredBySubleaderName: subName,
        votingCommitment,
        notes: notes.trim() || undefined,
      };
      updateSupporter(updated);
      onClose();
    } else {
      const res = addSupporter({
        cedula: cleanCedula,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        gender,
        age: Number(age) || 30,
        ageBracket: getAgeBracket(Number(age) || 30),
        neighborhood: neighborhood.trim() || 'Barrio General',
        sector: sector.trim() || 'Sector General',
        pollingStationId: pollingStationId || 'ps-1',
        pollingStationName: stationName,
        tableNumber: tableNumber.trim() || undefined,
        registeredByLeaderId: leaderId,
        registeredByLeaderName: leaderName,
        registeredBySubleaderId: subId,
        registeredBySubleaderName: subName,
        votingCommitment,
        contactedViaWhatsapp: false,
        votedStatus: false,
        notes: notes.trim() || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Error al registrar.');
      } else if (res.supporter) {
        setJustSavedSupporter(res.supporter);
      }
    }
  };

  if (!isOpen) return null;

  // Subleaders available to assign
  const availableSubleaders = users.filter(u => {
    if (u.role !== 'SUBLIDER') return false;
    if (currentUser?.role === 'SUPER_ADMIN') return true;
    if (currentUser?.role === 'LIDER_COORDINADOR') return u.parentLeaderId === currentUser.id;
    return false;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div
        className="bg-neutral-900 border border-neutral-800 w-full max-w-2xl rounded-3xl p-5 sm:p-7 shadow-2xl space-y-5 my-8 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-neutral-100">
                {supporterToEdit ? 'Editar Persona de Apoyo' : 'Registrar Persona de Apoyo'}
              </h2>
              <p className="text-xs text-neutral-400">
                Información del votante, puesto de votación y contacto directo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation Toast when adding */}
        {justSavedSupporter ? (
          <div className="space-y-4 py-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-neutral-100">¡Persona de Apoyo Registrada con Éxito!</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                {justSavedSupporter.firstName} {justSavedSupporter.lastName} (C.C. {formatCedula(justSavedSupporter.cedula)}) ha sido vinculado(a) a tu equipo.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between text-neutral-300">
                <span className="text-neutral-500">Puesto de Votación:</span>
                <span className="font-semibold text-neutral-200">{justSavedSupporter.pollingStationName}</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span className="text-neutral-500">Mesa:</span>
                <span className="font-semibold text-neutral-200">{justSavedSupporter.tableNumber || 'Por confirmar'}</span>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span className="text-neutral-500">WhatsApp:</span>
                <span className="font-semibold text-neutral-200">{justSavedSupporter.phone}</span>
              </div>
            </div>

            {/* Direct WhatsApp CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={generateWhatsappLink(
                  justSavedSupporter.phone,
                  `¡Hola ${justSavedSupporter.firstName}! Te confirmamos que has sido registrado(a) exitosamente en nuestro movimiento político. Tu puesto de votación asignado es: ${justSavedSupporter.pollingStationName}${justSavedSupporter.tableNumber ? `, Mesa ${justSavedSupporter.tableNumber}` : ''}. ¡Agradecemos tu valioso apoyo!`
                )}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Confirmación por WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  setJustSavedSupporter(null);
                  setCedula('');
                  setFirstName('');
                  setLastName('');
                  setPhone('');
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition"
              >
                + Registrar Otro Votante
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-neutral-400 hover:text-neutral-200 text-xs font-medium transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {duplicateWarning && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5 animate-pulse">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>{duplicateWarning}</div>
              </div>
            )}

            {/* Row 1: Identification & Names */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Cédula de Ciudadanía *</label>
                <input
                  type="text"
                  required
                  value={cedula}
                  onChange={(e) => handleCedulaChange(e.target.value)}
                  placeholder="Sin puntos ni comas"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 text-xs sm:text-sm text-neutral-100 placeholder-neutral-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Nombres *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ej: Andrés Felipe"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 text-xs sm:text-sm text-neutral-100 placeholder-neutral-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Apellidos *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ej: Restrepo Giraldo"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 text-xs sm:text-sm text-neutral-100 placeholder-neutral-600"
                />
              </div>
            </div>

            {/* Row 2: Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Teléfono Móvil (WhatsApp) *</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="3001234567"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 text-xs sm:text-sm text-neutral-100 placeholder-neutral-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-sky-400" />
                  <span>Correo Electrónico (Opcional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="persona@ejemplo.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 text-xs sm:text-sm text-neutral-100 placeholder-neutral-600"
                />
              </div>
            </div>

            {/* Row 3: Demographics (Gender & Age) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Género</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs sm:text-sm text-neutral-100"
                >
                  <option value="FEMENINO">Femenino (Mujer)</option>
                  <option value="MASCULINO">Masculino (Hombre)</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edad: {age} años</span>
                  </label>
                  <span className="text-[11px] text-indigo-400 font-medium">
                    Rango: {getAgeBracket(age)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="18"
                    max="90"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full accent-indigo-500 h-2 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                  <input
                    type="number"
                    min="18"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded-lg bg-neutral-950 border border-neutral-800 text-center text-xs text-neutral-100"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: Territory (Sector & Barrio) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Sector / Comuna</label>
                <input
                  type="text"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="Ej: Comuna 1 - Norte"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 text-xs sm:text-sm text-neutral-100 placeholder-neutral-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Barrio</label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ej: La Pradera / Santa Mónica"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 text-xs sm:text-sm text-neutral-100 placeholder-neutral-600"
                />
              </div>
            </div>

            {/* Row 5: Polling Station & Table */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                  <Vote className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Puesto de Votación</span>
                </label>
                <select
                  value={pollingStationId}
                  onChange={(e) => setPollingStationId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs sm:text-sm text-neutral-100 truncate"
                >
                  {pollingStations.map(ps => (
                    <option key={ps.id} value={ps.id}>
                      {ps.name} ({ps.zone} - {ps.neighborhood})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Mesa</label>
                <input
                  type="text"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Ej: 04"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 text-xs sm:text-sm text-neutral-100 placeholder-neutral-600"
                />
              </div>
            </div>

            {/* Row 6: Subleader Assignment & Voting Commitment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableSubleaders.length > 0 && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Asignar a Sublíder</label>
                  <select
                    value={subleaderId}
                    onChange={(e) => setSubleaderId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs sm:text-sm text-neutral-100"
                  >
                    <option value="">Directo del Líder (Sin Sublíder)</option>
                    {availableSubleaders.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.fullName} ({sub.sector})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Estado de Compromiso</label>
                <select
                  value={votingCommitment}
                  onChange={(e) => setVotingCommitment(e.target.value as VotingCommitment)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 text-xs sm:text-sm text-neutral-100"
                >
                  <option value="CONFIRMADO">Confirmado (Voto Seguro)</option>
                  <option value="PENDIENTE">Pendiente por Confirmar</option>
                  <option value="POR_CONTACTAR">Por Contactar</option>
                  <option value="DUDOSO">Dudoso / En Seguimiento</option>
                </select>
              </div>
            </div>

            {/* Row 7: Notes */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-neutral-300">Notas / Observaciones</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Requiere transporte el día de votación, apoya con refrigerios, etc."
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 text-xs text-neutral-100 placeholder-neutral-600"
              />
            </div>

            {/* Buttons */}
            <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="modal-submit-supporter"
                disabled={Boolean(duplicateWarning && !supporterToEdit)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-medium text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{supporterToEdit ? 'Guardar Cambios' : 'Guardar y Registrar'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
