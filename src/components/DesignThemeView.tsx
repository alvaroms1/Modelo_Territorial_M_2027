import React from 'react';
import { useApp, AppTheme } from '../context/AppContext';
import {
  Palette,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Sun,
  Moon,
  Droplets,
  Layers
} from 'lucide-react';

interface ThemeOption {
  id: AppTheme;
  name: string;
  code: string;
  subtitle: string;
  description: string;
  hex: string;
  cardBg: string;
  textColor: string;
  type: 'dark' | 'light';
  badge: string;
}

export const DesignThemeView: React.FC = () => {
  const { theme, setTheme } = useApp();

  const themes: ThemeOption[] = [
    {
      id: 'dark',
      name: 'Negro Obsidiana',
      code: 'DEFAULT DARK',
      subtitle: 'Fondo Oscuro Original',
      description: 'Elegancia ejecutiva de alto contraste, ideal para ambientes con poca luz y ahorro de batería.',
      hex: '#09090b',
      cardBg: '#141417',
      textColor: '#FFFFFF',
      type: 'dark',
      badge: 'Predeterminado'
    },
    {
      id: 'pantone-9064',
      name: 'Pantone 9064 U',
      code: 'PANTONE® 9064 U',
      subtitle: 'Vainilla Cálido / Crema Marfil',
      description: 'Tono marfil mate suave, descansado para la lectura continua y excelente visibilidad bajo el sol.',
      hex: '#F8F6D7',
      cardBg: '#FFFFFF',
      textColor: '#1c1917',
      type: 'light',
      badge: 'Pantone 9064 U'
    },
    {
      id: 'pantone-200081',
      name: 'Pantone 20-0081 TPM',
      code: 'PANTONE® 20-0081 TPM',
      subtitle: 'Blue or Not / Niebla Mineral',
      description: 'Salvia mineral plata tenue, estética ejecutiva, sobria y de estilo contemporáneo.',
      hex: '#E5E9E4',
      cardBg: '#FFFFFF',
      textColor: '#19211d',
      type: 'light',
      badge: 'Blue or Not'
    },
    {
      id: 'pantone-124611',
      name: 'Pantone 12-4611 TCX',
      code: 'PANTONE® 12-4611 TCX',
      subtitle: 'Saltwater Slide / Azul Caribe',
      description: 'Azul cielo pastel caribeño, fresco, vibrante y con alta luminosidad para trabajo en campo.',
      hex: '#CAE9F1',
      cardBg: '#FFFFFF',
      textColor: '#0e2229',
      type: 'light',
      badge: 'Saltwater Slide'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in pb-10">
      {/* ─── ENCABEZADO ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-950 p-6 rounded-3xl border border-neutral-800 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 via-emerald-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 shrink-0">
            <Palette className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Personalización & Diseño Visual
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                4 Paletas
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Selecciona el color de fondo general de la app según tu preferencia de lectura.
            </p>
          </div>
        </div>

        {theme !== 'dark' && (
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition border border-neutral-700 cursor-pointer self-start sm:self-auto shrink-0 shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restablecer a Negro</span>
          </button>
        )}
      </div>

      {/* ─── GRID DE TEMAS PANTONE ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {themes.map((t) => {
          const isActive = theme === t.id;

          return (
            <div
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`group relative rounded-3xl p-6 transition-all duration-200 cursor-pointer border-2 shadow-lg flex flex-col justify-between overflow-hidden ${
                isActive
                  ? 'border-emerald-500 bg-neutral-900 shadow-emerald-500/10 ring-4 ring-emerald-500/20 scale-[1.01]'
                  : 'border-neutral-800/80 bg-neutral-900 hover:border-neutral-700 hover:shadow-xl'
              }`}
            >
              {/* Indicador de Activo */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-neutral-800 text-neutral-200 border border-neutral-700 shadow-sm">
                    {t.badge}
                  </span>
                  {isActive && (
                    <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg bg-emerald-500 text-white shadow-sm animate-in fade-in">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>ACTIVO</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                  {t.type === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
                </div>
              </div>

              {/* Muestra de Color Pantone Real */}
              <div className="flex items-center gap-4 mb-4">
                <div 
                  className="w-16 h-16 rounded-2xl shadow-inner border-2 border-white/20 shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: t.hex }}
                >
                  <span className="text-[9px] font-black" style={{ color: t.type === 'dark' ? '#FFF' : '#333' }}>
                    {t.hex}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-white group-hover:text-emerald-400 transition">
                    {t.name}
                  </h3>
                  <p className="text-xs font-mono text-neutral-400 mt-0.5">
                    {t.code}
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-400/90 mt-0.5">
                    {t.subtitle}
                  </p>
                </div>
              </div>

              {/* Descripción */}
              <p className="text-xs text-neutral-400 leading-relaxed mb-5">
                {t.description}
              </p>

              {/* Mini Preview de Interfaz */}
              <div 
                className="w-full rounded-2xl p-3.5 border border-black/10 flex items-center justify-between transition"
                style={{ backgroundColor: t.hex, color: t.textColor }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-[10px] font-black">
                    M
                  </div>
                  <span className="text-xs font-bold" style={{ color: t.textColor }}>
                    Vista Previa
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold" style={{ backgroundColor: t.cardBg, color: t.textColor }}>
                    Tarjetas
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-500 text-white">
                    Botones
                  </span>
                </div>
              </div>

              {/* Botón de Aplicar */}
              <div className="mt-4 pt-4 border-t border-neutral-800/80 flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400">
                  {isActive ? 'Tema actualmente aplicado' : 'Haz clic para aplicar este fondo'}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTheme(t.id);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                  }`}
                >
                  {isActive ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Seleccionado</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Aplicar Tema</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── TARJETA INFORMATIVA ─── */}
      <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-start gap-3.5 text-neutral-300 text-xs leading-relaxed">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <h4 className="font-bold text-white mb-0.5">Persistencia de Preferencia</h4>
          <p className="text-neutral-400">
            El tema de color que elijas se guarda automáticamente en la memoria de tu dispositivo. Cada vez que inicies sesión o abras la aplicación desde el celular o la computadora, la app mantendrá tu color de fondo favorito.
          </p>
        </div>
      </div>
    </div>
  );
};
