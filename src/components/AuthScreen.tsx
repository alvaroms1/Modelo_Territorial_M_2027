import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Shield, UserCheck, KeyRound, Phone, Mail, MapPin, Sparkles, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { formatCedula } from '../utils/helpers';
import { UserRole } from '../types';

export const AuthScreen: React.FC = () => {
  const { login, registerUser, users, pollingStations, switchUser } = useApp();
  const [isRegistering, setIsRegistering] = useState(false);
  const [cedulaInput, setCedulaInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Register state
  const [regFullName, setRegFullName] = useState('');
  const [regCedula, setRegCedula] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('SUBLIDER');
  const [regSector, setRegSector] = useState('');
  const [regParentLeaderId, setRegParentLeaderId] = useState('');
  const [regPollingStationId, setRegPollingStationId] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!cedulaInput.trim()) {
      setErrorMsg('Por favor ingresa tu número de cédula.');
      return;
    }
    const success = login(cedulaInput, passwordInput);
    if (!success) {
      setErrorMsg('No se encontró un usuario activo con esta cédula. Puedes registrarte o probar con los perfiles demo de abajo.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regFullName.trim() || !regCedula.trim() || !regPhone.trim()) {
      setErrorMsg('Nombres, Cédula y Teléfono Móvil (WhatsApp) son obligatorios.');
      return;
    }

    const cleanCedula = regCedula.replace(/\D/g, '');
    const exists = users.find(u => u.cedula.replace(/\D/g, '') === cleanCedula);
    if (exists) {
      setErrorMsg(`La cédula ${regCedula} ya se encuentra registrada en el sistema.`);
      return;
    }

    const parentLeader = users.find(u => u.id === regParentLeaderId);
    const station = pollingStations.find(ps => ps.id === regPollingStationId);

    const newUser = registerUser({
      cedula: cleanCedula,
      fullName: regFullName.trim(),
      role: regRole,
      phone: regPhone.trim(),
      email: regEmail.trim() || `${cleanCedula}@movimiento.org`,
      sector: regSector.trim() || 'Sector General',
      parentLeaderId: regRole === 'SUBLIDER' ? regParentLeaderId : undefined,
      parentLeaderName: regRole === 'SUBLIDER' ? parentLeader?.fullName : undefined,
      assignedPollingStationId: regPollingStationId || undefined,
      assignedPollingStationName: station?.name || undefined,
      targetCount: regRole === 'LIDER_COORDINADOR' ? 500 : 150,
    });

    login(newUser.cedula);
  };

  const mainLeaders = users.filter(u => u.role === 'LIDER_COORDINADOR');

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-center items-center px-4 py-8 relative selection:bg-indigo-500/30">
      {/* Background accents */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-rose-600 shadow-xl shadow-indigo-500/20 text-white font-bold text-2xl tracking-tighter">
            SP
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-100">
            Sipol Electoral
          </h1>
          <p className="text-sm text-neutral-400">
            Sistema de Gestión Territorial & Red de Líderes Políticos
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl">
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isRegistering ? (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Cédula de Ciudadanía
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    value={cedulaInput}
                    onChange={(e) => setCedulaInput(e.target.value)}
                    placeholder="Ej: 10101010 o 70111222"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-neutral-100 placeholder-neutral-600 transition"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Contraseña / PIN
                  </label>
                  <span className="text-[11px] text-neutral-500">Opcional en demo</span>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-neutral-100 placeholder-neutral-600 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-login-submit"
                className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Ingresar al Sistema</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setIsRegistering(true); setErrorMsg(''); }}
                  className="text-xs text-neutral-400 hover:text-indigo-300 transition"
                >
                  ¿Eres un nuevo líder o sublíder? <span className="text-indigo-400 font-medium underline">Regístrate aquí</span>
                </button>
              </div>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <button
                  type="button"
                  onClick={() => { setIsRegistering(false); setErrorMsg(''); }}
                  className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Volver al ingreso
                </button>
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Nuevo Registro</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-medium">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Ej: Laura Camila Restrepo"
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 text-xs text-neutral-100 placeholder-neutral-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 font-medium">Cédula *</label>
                  <input
                    type="text"
                    required
                    value={regCedula}
                    onChange={(e) => setRegCedula(e.target.value)}
                    placeholder="Sin puntos"
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 text-xs text-neutral-100 placeholder-neutral-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 font-medium">WhatsApp Móvil *</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="3001234567"
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 text-xs text-neutral-100 placeholder-neutral-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-medium">Correo Electrónico</label>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="ejemplo@movimiento.org"
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 text-xs text-neutral-100 placeholder-neutral-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-medium">Rol en la Campaña</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 text-xs text-neutral-100"
                >
                  <option value="SUBLIDER">Sublíder / Activista de Base</option>
                  <option value="LIDER_COORDINADOR">Líder Coordinador de Zona</option>
                </select>
              </div>

              {regRole === 'SUBLIDER' && (
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 font-medium">Líder Principal Asignado</label>
                  <select
                    value={regParentLeaderId}
                    onChange={(e) => setRegParentLeaderId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 text-xs text-neutral-100"
                  >
                    <option value="">Seleccione el Líder Principal</option>
                    {mainLeaders.map((ldr) => (
                      <option key={ldr.id} value={ldr.id}>
                        {ldr.fullName} ({ldr.sector})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 font-medium">Sector / Comuna</label>
                  <input
                    type="text"
                    value={regSector}
                    onChange={(e) => setRegSector(e.target.value)}
                    placeholder="Ej: Comuna 1 Norte"
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 text-xs text-neutral-100 placeholder-neutral-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400 font-medium">Puesto de Votación</label>
                  <select
                    value={regPollingStationId}
                    onChange={(e) => setRegPollingStationId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-indigo-500 text-xs text-neutral-100"
                  >
                    <option value="">Seleccionar Puesto</option>
                    {pollingStations.map((ps) => (
                      <option key={ps.id} value={ps.id}>
                        {ps.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                id="btn-register-submit"
                className="w-full mt-3 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Completar Registro & Entrar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Fast 1-Click Demo Profiles */}
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Acceso Rápido de Prueba (1-Clic por Rol):</span>
          </div>

          <div className="grid grid-cols-1 gap-2 text-left">
            {/* Super Admin */}
            <button
              type="button"
              id="demo-login-admin"
              onClick={() => switchUser('user-admin')}
              className="p-2.5 rounded-xl border border-rose-900/40 bg-rose-950/20 hover:bg-rose-900/40 transition flex items-center justify-between text-xs group"
            >
              <div>
                <div className="font-semibold text-rose-300">Rol 1: Director General / Super Admin</div>
                <div className="text-neutral-400 text-[11px]">Dr. Fernando Restrepo (C.C. 10101010) • Ve toda la red</div>
              </div>
              <span className="px-2 py-1 rounded bg-rose-900/60 text-rose-200 text-[10px] font-medium group-hover:bg-rose-800">
                Probar
              </span>
            </button>

            {/* Líder Coordinador */}
            <button
              type="button"
              id="demo-login-leader"
              onClick={() => switchUser('user-leader-1')}
              className="p-2.5 rounded-xl border border-indigo-900/40 bg-indigo-950/20 hover:bg-indigo-900/40 transition flex items-center justify-between text-xs group"
            >
              <div>
                <div className="font-semibold text-indigo-300">Rol 2: Líder Coordinador de Zona</div>
                <div className="text-neutral-400 text-[11px]">Carlos Mendoza (C.C. 70111222) • Comuna 1 Norte</div>
              </div>
              <span className="px-2 py-1 rounded bg-indigo-900/60 text-indigo-200 text-[10px] font-medium group-hover:bg-indigo-800">
                Probar
              </span>
            </button>

            {/* Sublíder */}
            <button
              type="button"
              id="demo-login-subleader"
              onClick={() => switchUser('user-subleader-1')}
              className="p-2.5 rounded-xl border border-emerald-900/40 bg-emerald-950/20 hover:bg-emerald-900/40 transition flex items-center justify-between text-xs group"
            >
              <div>
                <div className="font-semibold text-emerald-300">Rol 3: Sublíder / Activista de Base</div>
                <div className="text-neutral-400 text-[11px]">María F. Gómez (C.C. 10203040) • Registra votantes</div>
              </div>
              <span className="px-2 py-1 rounded bg-emerald-900/60 text-emerald-200 text-[10px] font-medium group-hover:bg-emerald-800">
                Probar
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
