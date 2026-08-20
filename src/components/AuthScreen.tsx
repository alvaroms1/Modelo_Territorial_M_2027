import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { login, registerUser } = useApp();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form fields
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [consentimiento, setConsentimiento] = useState(false);
  
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setCedula('');
    setPassword('');
    setShowPassword(false);
    setNombre('');
    setTelefono('');
    setConsentimiento(false);
  };

  const handleCedulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCedula(e.target.value.replace(/\D/g, ''));
  };

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefono(e.target.value.replace(/\D/g, ''));
  };

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNombre(e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    if (!cedula || !password) {
      setError('Por favor ingrese su cédula y contraseña.');
      setIsLoading(false);
      return;
    }

    if (isRegistering) {
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
        telefono,
        consentimiento_datos: consentimiento
      });
      
      if (res.success) {
        // Switch back to Login screen and show pending approval message
        resetForm();
        setIsRegistering(false);
        setSuccessMessage('¡Registro exitoso! Su cuenta está pendiente de aprobación por el Administrador antes de poder ingresar.');
      } else {
        setError(res.error || 'Error al crear la cuenta.');
      }
    } else {
      const res = await login(cedula, password);
      if (!res.success) {
        setError(res.error || 'Credenciales incorrectas o usuario no encontrado.');
      }
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500/30 overflow-y-auto">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 mt-8">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-3xl bg-white p-2 flex items-center justify-center shadow-xl shadow-emerald-500/20 border-2 border-emerald-500/30 overflow-hidden">
            <img src="/logo_mendozismo.png" alt="Mendozismo" className="w-full h-full object-contain" />
          </div>
        </div>
        <h2 className="mt-5 text-center text-3xl font-black text-neutral-100 tracking-tight">
          Modelo Mendozismo
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-neutral-400">
          Sistema Integrado de Control Territorial y Gestión Electoral
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 mb-8">
        <div className="bg-neutral-900/80 backdrop-blur-xl py-8 px-4 shadow-2xl border border-neutral-800 rounded-3xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-neutral-300">
                  Nombre Completo *
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={handleNombreChange}
                    className="appearance-none block w-full px-4 py-3 border border-neutral-700 rounded-xl bg-neutral-950/50 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                    placeholder="Ej. Juan Pérez (solo letras)"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-300">
                Número de Cédula *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={cedula}
                  onChange={handleCedulaChange}
                  className="appearance-none block w-full px-4 py-3 border border-neutral-700 rounded-xl bg-neutral-950/50 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="Ej. 1023456789 (solo números)"
                />
              </div>
            </div>

            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-neutral-300">
                  Teléfono (Opcional)
                </label>
                <div className="mt-1">
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={telefono}
                    onChange={handleTelefonoChange}
                    className="appearance-none block w-full px-4 py-3 border border-neutral-700 rounded-xl bg-neutral-950/50 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                    placeholder="Ej. 3001234567 (solo números)"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-300">
                Contraseña *
              </label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-4 pr-11 py-3 border border-neutral-700 rounded-xl bg-neutral-950/50 text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
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
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {isRegistering && (
              <div className="flex items-start mt-4 bg-neutral-800/50 p-3 rounded-xl border border-neutral-700/50">
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
                <div className="ml-3 text-sm">
                  <label htmlFor="consentimiento" className="font-medium text-neutral-300 cursor-pointer">
                    Habeas Data
                  </label>
                  <p className="text-neutral-500 text-xs mt-1">
                    Acepto la política de tratamiento de datos y doy mi consentimiento.
                  </p>
                </div>
              </div>
            )}

            {/* Success message banner */}
            {successMessage && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-emerald-300 leading-relaxed">
                    {successMessage}
                  </p>
                </div>
              </div>
            )}

            {/* Error message banner */}
            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-rose-400 leading-relaxed">
                    {error}
                  </p>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-neutral-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isRegistering ? 'Creando cuenta...' : 'Ingresando...'}
                  </>
                ) : (
                  isRegistering ? 'Crear Cuenta y Registrarse' : 'Ingresar al Sistema'
                )}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {isRegistering 
                  ? '¿Ya tienes una cuenta? Inicia sesión aquí.' 
                  : '¿No tienes cuenta? Regístrate aquí.'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
