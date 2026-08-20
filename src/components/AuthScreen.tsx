import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Mail, 
  ArrowLeft, 
  MessageCircle,
  MailCheck,
  Send
} from 'lucide-react';

type AuthMode = 'login' | 'register' | 'recover';

export const AuthScreen: React.FC = () => {
  const { login, registerUser, recoverPassword } = useApp();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  
  // Form fields
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [consentimiento, setConsentimiento] = useState(false);
  
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [recoveredUser, setRecoveredUser] = useState<{ userName?: string; maskedEmail?: string; hasEmail?: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setCedula('');
    setPassword('');
    setShowPassword(false);
    setNombre('');
    setCorreo('');
    setTelefono('');
    setConsentimiento(false);
    setError('');
    setSuccessMessage('');
    setRecoveredUser(null);
  };

  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCedula(e.target.value.replace(/\D/g, ''));
  };

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefono(e.target.value.replace(/\D/g, ''));
  };

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNombre(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').toUpperCase());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setRecoveredUser(null);
    setIsLoading(true);

    try {
      // ══════════════════════════════════════════════
      // MODO 1: RECUPERAR CONTRASEÑA
      // ══════════════════════════════════════════════
      if (authMode === 'recover') {
        if (!cedula && !correo) {
          setError('Por favor ingresa tu número de cédula o correo electrónico registrado.');
          setIsLoading(false);
          return;
        }

        const res = await recoverPassword(cedula, correo);
        if (res.success) {
          setRecoveredUser({
            userName: res.userName,
            maskedEmail: res.maskedEmail,
            hasEmail: res.hasEmail
          });
          if (res.hasEmail) {
            setSuccessMessage(
              `¡Instrucciones enviadas! Hemos enviado las indicaciones de recuperación al correo electrónico registrado: ${res.maskedEmail}. Revisa tu bandeja de entrada o spam.`
            );
          }
        } else {
          setError(res.error || 'No se encontró ningún usuario con los datos ingresados.');
        }
        setIsLoading(false);
        return;
      }

      // ══════════════════════════════════════════════
      // MODO 2: REGISTRO NUEVO
      // ══════════════════════════════════════════════
      if (authMode === 'register') {
        if (!cedula || !password) {
          setError('Por favor ingresa tu cédula y contraseña.');
          setIsLoading(false);
          return;
        }
        if (!nombre.trim()) {
          setError('El nombre completo es obligatorio y solo debe contener letras.');
          setIsLoading(false);
          return;
        }
        if (!consentimiento) {
          setError('Debe aceptar la política de tratamiento de datos (Habeas Data).');
          setIsLoading(false);
          return;
        }
        
        const res = await registerUser({
          cedula,
          password,
          nombre_completo: nombre,
          correo: correo.trim() || undefined,
          telefono,
          consentimiento_datos: consentimiento
        });
        
        if (res.success) {
          resetForm();
          setAuthMode('login');
          setSuccessMessage('¡Registro exitoso! Su cuenta está pendiente de aprobación por el Administrador antes de poder ingresar.');
        } else {
          setError(res.error || 'Error al crear la cuenta.');
        }
        setIsLoading(false);
        return;
      }

      // ══════════════════════════════════════════════
      // MODO 3: INICIO DE SESIÓN
      // ══════════════════════════════════════════════
      if (!cedula || !password) {
        setError('Por favor ingrese su cédula y contraseña.');
        setIsLoading(false);
        return;
      }

      const res = await login(cedula, password);
      if (!res.success) {
        setError(res.error || 'Credenciales incorrectas o usuario no encontrado.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500/30 overflow-y-auto">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mt-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-3xl bg-white p-2 flex items-center justify-center shadow-xl shadow-emerald-500/20 border-2 border-emerald-500/30 overflow-hidden">
            <img src="/logo_mendozismo.png" alt="Mendozismo" className="w-full h-full object-contain" />
          </div>
        </div>
        <h2 className="mt-5 text-center text-2xl sm:text-3xl font-black text-neutral-100 tracking-tight">
          Modelo Territorial Mendozista
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-neutral-400">
          Sistema Integrado de Control Territorial y Gestión Electoral
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4 mb-8">
        <div className="bg-neutral-900/80 backdrop-blur-xl py-8 px-4 shadow-2xl border border-neutral-800 rounded-3xl sm:px-10">
          
          {/* Header Title according to AuthMode */}
          <div className="mb-6 pb-3 border-b border-neutral-800 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                {authMode === 'login' && 'Iniciar Sesión'}
                {authMode === 'register' && 'Crear Nueva Cuenta'}
                {authMode === 'recover' && (
                  <>
                    <KeyRound className="w-5 h-5 text-amber-400" />
                    Recuperar Contraseña
                  </>
                )}
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                {authMode === 'login' && 'Ingresa tus credenciales para acceder al sistema'}
                {authMode === 'register' && 'Regístrate como nuevo líder o persona de apoyo'}
                {authMode === 'recover' && 'Te enviaremos las instrucciones a tu correo registrado'}
              </p>
            </div>

            {authMode !== 'login' && (
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setError('');
                  setSuccessMessage('');
                  setRecoveredUser(null);
                }}
                className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
                title="Volver al inicio de sesión"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            
            {/* ─── CAMPOS DE REGISTRO ─── */}
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Nombre Completo * (en Mayúsculas)
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={handleNombreChange}
                  className="appearance-none block w-full px-4 py-2.5 border border-neutral-700 rounded-xl bg-neutral-950/50 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-semibold"
                  placeholder="EJ. JUAN PÉREZ"
                />
              </div>
            )}

            {/* ─── CÉDULA (Login, Registro y Recuperación) ─── */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">
                Número de Cédula *
              </label>
              <input
                type="text"
                inputMode="numeric"
                required={authMode !== 'recover'}
                value={cedula}
                onChange={handleCedulaChange}
                className="appearance-none block w-full px-4 py-2.5 border border-neutral-700 rounded-xl bg-neutral-950/50 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-mono"
                placeholder="Ej. 1023456789 (solo números)"
              />
            </div>

            {/* ─── CORREO ELECTRÓNICO (Registro y Recuperación) ─── */}
            {(authMode === 'register' || authMode === 'recover') && (
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  Correo Electrónico {authMode === 'recover' ? '(Registrado)' : '(Para recuperación de clave)'}
                </label>
                <input
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="appearance-none block w-full px-4 py-2.5 border border-neutral-700 rounded-xl bg-neutral-950/50 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  placeholder="ejemplo@correo.com"
                />
              </div>
            )}

            {/* ─── TELÉFONO (Solo Registro) ─── */}
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Teléfono / WhatsApp (Opcional)
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={telefono}
                  onChange={handleTelefonoChange}
                  className="appearance-none block w-full px-4 py-2.5 border border-neutral-700 rounded-xl bg-neutral-950/50 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                  placeholder="Ej. 3001234567"
                />
              </div>
            )}

            {/* ─── CONTRASEÑA (Login y Registro) ─── */}
            {authMode !== 'recover' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Contraseña *
                  </label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('recover');
                        setError('');
                        setSuccessMessage('');
                        setRecoveredUser(null);
                      }}
                      className="text-xs font-medium text-amber-400 hover:text-amber-300 transition cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full pl-4 pr-11 py-2.5 border border-neutral-700 rounded-xl bg-neutral-950/50 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-neutral-400 hover:text-neutral-200 transition-colors focus:outline-none cursor-pointer"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ─── HABEAS DATA (Solo Registro) ─── */}
            {authMode === 'register' && (
              <div className="flex items-start mt-3 bg-neutral-950/70 p-3 rounded-xl border border-neutral-800">
                <div className="flex items-center h-5">
                  <input
                    id="consentimiento"
                    name="consentimiento"
                    type="checkbox"
                    checked={consentimiento}
                    onChange={(e) => setConsentimiento(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                  />
                </div>
                <div className="ml-3 text-xs">
                  <label htmlFor="consentimiento" className="font-semibold text-neutral-200 cursor-pointer">
                    Tratamiento de Datos (Habeas Data) *
                  </label>
                  <p className="text-neutral-400 text-[11px] mt-0.5 leading-relaxed">
                    Autorizo el tratamiento de mis datos personales para fines organizativos y de gestión territorial.
                  </p>
                </div>
              </div>
            )}

            {/* ─── SUCCESS MESSAGE BANNER ─── */}
            {successMessage && (
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 animate-in fade-in slide-in-from-top-1 space-y-2">
                <div className="flex items-start gap-2.5">
                  <MailCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-emerald-300 leading-relaxed">
                    {successMessage}
                  </p>
                </div>
              </div>
            )}

            {/* ─── NO EMAIL REGISTERED ADVICE ─── */}
            {recoveredUser && !recoveredUser.hasEmail && (
              <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 animate-in fade-in slide-in-from-top-1 space-y-3">
                <p className="text-xs text-amber-200 leading-relaxed">
                  Hola <strong>{recoveredUser.userName}</strong>, tu cuenta no tiene un correo electrónico registrado en el sistema. Puedes solicitar el restablecimiento inmediato contactando al Administrador:
                </p>
                <a
                  href={`https://wa.me/573007590023?text=${encodeURIComponent(
                    `Hola Administrador, soy ${recoveredUser.userName} con CC ${cedula} y solicito restablecer mi contraseña para la App Modelo Territorial Mendozista.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Solicitar Clave al Administrador vía WhatsApp</span>
                </a>
              </div>
            )}

            {/* ─── ERROR MESSAGE BANNER ─── */}
            {error && (
              <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-3.5 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium text-rose-300 leading-relaxed">
                    {error}
                  </p>
                </div>
              </div>
            )}

            {/* ─── ACTION BUTTON ─── */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-rose-600 hover:from-indigo-500 hover:to-rose-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : authMode === 'recover' ? (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Enlace de Recuperación</span>
                  </>
                ) : authMode === 'register' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Crear Cuenta y Registrarse</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Ingresar al Sistema</span>
                  </>
                )}
              </button>
            </div>
            
            {/* ─── FOOTER SWITCH LINKS ─── */}
            <div className="text-center pt-2 space-y-2">
              {authMode === 'login' && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    resetForm();
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold cursor-pointer block w-full"
                >
                  ¿No tienes cuenta? Regístrate aquí como nuevo líder.
                </button>
              )}

              {authMode === 'register' && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    resetForm();
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold cursor-pointer block w-full"
                >
                  ¿Ya tienes una cuenta? Inicia sesión aquí.
                </button>
              )}

              {authMode === 'recover' && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    resetForm();
                  }}
                  className="text-xs text-neutral-400 hover:text-white transition-colors font-semibold cursor-pointer block w-full"
                >
                  ← Volver al formulario de inicio de sesión
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
