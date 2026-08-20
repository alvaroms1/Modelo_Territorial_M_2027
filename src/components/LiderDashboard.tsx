import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, BarChart3, AlertTriangle, CheckCircle, Info, ShieldAlert, ListChecks } from 'lucide-react';

export const LiderDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'instrucciones' | 'tablero'>('instrucciones');
  const { currentUser, visibleContactos, visibleUsers, users, actividades, pollingStations } = useApp();

  const stats = useMemo(() => {
    // Basic stats
    const lideresActivos = visibleUsers.filter(u => u.estado === 'ACTIVO').length;

    // Sublíderes calculation for current leader (STRICT ISOLATION)
    const userSubliderIds = users
      .filter(u => u.rol === 'SUBLIDER' && (
        (currentUser?.rol === 'ADMIN' || currentUser?.rol === 'LIDER_PRINCIPAL') ? true : u.lider_principal_id === currentUser?.id
      ))
      .map(u => u.id);

    const contactoSubliderIds = visibleContactos
      .filter(c => c.rol === 'SUBLIDER' && (
        (currentUser?.rol === 'ADMIN' || currentUser?.rol === 'LIDER_PRINCIPAL') ? true : c.lider_id === currentUser?.id
      ))
      .map(c => c.id);

    const uniqueSubliderIds = new Set([
      ...userSubliderIds,
      ...contactoSubliderIds
    ]);

    const sublideresActivos = uniqueSubliderIds.size;
    const contactosRegistrados = visibleContactos.length;
    const actividadesRealizadas = actividades.length;
    const puestosConCobertura = new Set(visibleContactos.filter(c => c.puesto_id).map(c => c.puesto_id)).size;

    const contactosConsentimiento = visibleContactos.filter(c => c.consentimiento_datos).length;
    
    // States
    const estados = {
      activo: visibleUsers.filter(u => u.estado === 'ACTIVO').length,
      enFormacion: visibleUsers.filter(u => u.estado === 'EN_FORMACION').length,
      enPausa: visibleUsers.filter(u => u.estado === 'EN_PAUSA').length,
      retirado: visibleUsers.filter(u => u.estado === 'RETIRADO').length,
    };

    const totalLideres = visibleUsers.length || 1; // avoid div by 0

    return {
      lideresActivos,
      sublideresActivos,
      contactosRegistrados,
      actividadesRealizadas,
      puestosConCobertura,
      contactosConsentimiento,
      estados,
      totalLideres
    };
  }, [visibleContactos, visibleUsers, users, currentUser, actividades, pollingStations]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Panel del Líder
            <span className="px-2 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Territorial
            </span>
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Gestión y seguimiento de tu zona de influencia
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-neutral-900 border border-neutral-800 rounded-xl overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('instrucciones')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'instrucciones'
              ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Instrucciones del Modelo
        </button>
        <button
          onClick={() => setActiveTab('tablero')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap transition-all ${
            activeTab === 'tablero'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/20'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Tablero de Control Territorial
        </button>
      </div>

      {/* Tab Content: Instrucciones */}
      {activeTab === 'instrucciones' && (
        <div className="space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-neutral-950/50 p-6 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-indigo-400" />
                Objetivo del Archivo
              </h2>
              <p className="text-neutral-300 mt-2 leading-relaxed text-sm">
                Organizar a cada líder en máximo dos puestos de votación cercanos a su residencia o a su mayor presencia comunitaria, y hacer seguimiento a crecimiento, actividades y cobertura territorial. El archivo evita registrar intención de voto, datos sensibles o información obtenida sin autorización.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-neutral-800/50">
              {/* Flujo Recomendado */}
              <div className="bg-neutral-900 p-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <ListChecks className="w-5 h-5 text-emerald-400" />
                  Flujo Recomendado
                </h3>
                <ul className="space-y-3">
                  {[
                    'Registrar puestos',
                    'Registrar líderes y su zona natural',
                    'Asignar máximo dos puestos por líder',
                    'Registrar contactos con consentimiento',
                    'Programar actividades comunitarias',
                    'Actualizar seguimiento mensual',
                    'Revisar el tablero de control'
                  ].map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-neutral-300">
                      <span className="flex items-center justify-center min-w-[24px] h-6 rounded bg-neutral-800 text-neutral-400 font-bold text-xs border border-neutral-700">
                        {idx + 1}
                      </span>
                      <span className="mt-0.5">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Reglas de Integridad */}
              <div className="bg-neutral-900 p-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  Reglas de Integridad y Cumplimiento
                </h3>
                <ul className="space-y-3">
                  {[
                    'No registrar intención de voto ni preferencias políticas individuales.',
                    'No registrar religión, salud, etnia, orientación sexual u otros datos sensibles.',
                    'Usar únicamente información entregada voluntariamente y con consentimiento.',
                    'No condicionar ayudas, beneficios o servicios a apoyo político.',
                    'No duplicar personas entre líderes; resolver el responsable territorial.',
                    'Concentrar a cada líder en máximo dos puestos.'
                  ].map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-neutral-300">
                      <div className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Tablero */}
      {activeTab === 'tablero' && (
        <div className="space-y-6">
          {/* Top Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Líderes activos</p>
              <p className="text-3xl font-black text-white">{stats.lideresActivos}</p>
            </div>
            <div className="bg-emerald-600/20 border border-emerald-500/30 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Sublíderes</p>
              <p className="text-3xl font-black text-white">{stats.sublideresActivos}</p>
            </div>
            <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Contactos registrados</p>
              <p className="text-3xl font-black text-white">{stats.contactosRegistrados}</p>
            </div>
            <div className="bg-purple-600/20 border border-purple-500/30 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">Actividades realizadas</p>
              <p className="text-3xl font-black text-white">{stats.actividadesRealizadas}</p>
            </div>
            <div className="bg-cyan-600/20 border border-cyan-500/30 rounded-2xl p-4 text-center">
              <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1">Puestos con cobertura</p>
              <p className="text-3xl font-black text-white">{stats.puestosConCobertura}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Indicadores de Calidad */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="bg-blue-600 px-4 py-2">
                <h3 className="text-sm font-bold text-white uppercase">Indicadores de Calidad</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-neutral-950/60 text-neutral-300">
                    <tr>
                      <th className="px-4 py-2 border-b border-neutral-800/50">Indicador</th>
                      <th className="px-4 py-2 border-b border-neutral-800/50 text-center">Resultado</th>
                      <th className="px-4 py-2 border-b border-neutral-800/50 text-center">Meta</th>
                      <th className="px-4 py-2 border-b border-neutral-800/50 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50 text-neutral-300">
                    <tr>
                      <td className="px-4 py-3">Líderes con máximo 2 puestos</td>
                      <td className="px-4 py-3 text-center">{stats.lideresActivos}</td>
                      <td className="px-4 py-3 text-center">{stats.lideresActivos}</td>
                      <td className="px-4 py-3 text-center font-medium text-emerald-400 bg-emerald-500/10">100%</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Contactos con consentimiento</td>
                      <td className="px-4 py-3 text-center">{stats.contactosConsentimiento}</td>
                      <td className="px-4 py-3 text-center">{stats.contactosRegistrados}</td>
                      <td className="px-4 py-3 text-center font-medium text-emerald-400 bg-emerald-500/10">
                        {stats.contactosRegistrados > 0 ? Math.round((stats.contactosConsentimiento / stats.contactosRegistrados) * 100) : 0}%
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Seguimientos al día</td>
                      <td className="px-4 py-3 text-center">0</td>
                      <td className="px-4 py-3 text-center">0</td>
                      <td className="px-4 py-3 text-center font-medium text-emerald-400 bg-emerald-500/10">0%</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Actividades con meta cumplida</td>
                      <td className="px-4 py-3 text-center">{stats.actividadesRealizadas}</td>
                      <td className="px-4 py-3 text-center">{stats.actividadesRealizadas}</td>
                      <td className="px-4 py-3 text-center font-medium text-emerald-400 bg-emerald-500/10">
                        {stats.actividadesRealizadas > 0 ? '100%' : '0%'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alertas Operativas */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="bg-indigo-600 px-4 py-2">
                <h3 className="text-sm font-bold text-white uppercase">Alertas Operativas</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-neutral-950/60 text-neutral-300">
                    <tr>
                      <th className="px-4 py-2 border-b border-neutral-800/50">Alerta</th>
                      <th className="px-4 py-2 border-b border-neutral-800/50 text-center">Cantidad</th>
                      <th className="px-4 py-2 border-b border-neutral-800/50">Criterio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/50 text-neutral-300">
                    <tr>
                      <td className="px-4 py-3">Líderes sin asignación</td>
                      <td className="px-4 py-3 text-center font-bold text-rose-400">0</td>
                      <td className="px-4 py-3 text-xs text-neutral-400">Sin puesto principal</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Contactos vencidos</td>
                      <td className="px-4 py-3 text-center font-bold text-rose-400">0</td>
                      <td className="px-4 py-3 text-xs text-neutral-400">Seguimiento atrasado</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Registros sin consentimiento</td>
                      <td className="px-4 py-3 text-center font-bold text-rose-400">{stats.contactosRegistrados - stats.contactosConsentimiento}</td>
                      <td className="px-4 py-3 text-xs text-neutral-400">Debe corregirse</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Puestos sin contactos</td>
                      <td className="px-4 py-3 text-center font-bold text-rose-400">0</td>
                      <td className="px-4 py-3 text-xs text-neutral-400">Cobertura pendiente</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Estado de líder */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden lg:col-span-1">
              <div className="bg-blue-600 px-4 py-2">
                <h3 className="text-sm font-bold text-white uppercase">Estado de líder</h3>
              </div>
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-950/60 text-neutral-300">
                  <tr>
                    <th className="px-4 py-2 border-b border-neutral-800/50">Estado</th>
                    <th className="px-4 py-2 border-b border-neutral-800/50 text-right">Cantidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50 text-neutral-300">
                  <tr>
                    <td className="px-4 py-3">Activo</td>
                    <td className="px-4 py-3 text-right font-medium">{stats.estados.activo}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">En formación</td>
                    <td className="px-4 py-3 text-right font-medium">{stats.estados.enFormacion}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">En pausa</td>
                    <td className="px-4 py-3 text-right font-medium">{stats.estados.enPausa}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Retirado</td>
                    <td className="px-4 py-3 text-right font-medium">{stats.estados.retirado}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Gráfico Líderes por estado */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 lg:col-span-2 flex flex-col">
              <h3 className="text-center font-bold text-lg text-white mb-6">Líderes por estado</h3>
              <div className="flex-1 flex items-end gap-4 sm:gap-12 justify-center pt-8 pb-4 border-l border-b border-neutral-700 px-4 relative min-h-[200px]">
                {/* Y-axis lines */}
                <div className="absolute inset-0 border-b border-neutral-700 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-1/4 border-b border-dashed border-neutral-800 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-2/4 border-b border-dashed border-neutral-800 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-3/4 border-b border-dashed border-neutral-800 pointer-events-none" />
                <div className="absolute inset-x-0 top-0 border-b border-dashed border-neutral-800 pointer-events-none" />
                
                {/* Bars */}
                <div className="relative flex flex-col items-center w-16 group z-10">
                  <div className="absolute -top-8 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">{stats.estados.activo}</div>
                  <div 
                    className="w-full bg-blue-500 rounded-t-sm transition-all duration-1000"
                    style={{ height: `${(stats.estados.activo / stats.totalLideres) * 100}%`, minHeight: stats.estados.activo > 0 ? '4px' : '0' }}
                  />
                  <span className="absolute -bottom-8 text-xs text-neutral-400 font-medium">Activo</span>
                </div>
                
                <div className="relative flex flex-col items-center w-16 group z-10">
                  <div className="absolute -top-8 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">{stats.estados.enFormacion}</div>
                  <div 
                    className="w-full bg-indigo-500 rounded-t-sm transition-all duration-1000"
                    style={{ height: `${(stats.estados.enFormacion / stats.totalLideres) * 100}%`, minHeight: stats.estados.enFormacion > 0 ? '4px' : '0' }}
                  />
                  <span className="absolute -bottom-8 text-xs text-neutral-400 font-medium">En formación</span>
                </div>
                
                <div className="relative flex flex-col items-center w-16 group z-10">
                  <div className="absolute -top-8 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">{stats.estados.enPausa}</div>
                  <div 
                    className="w-full bg-amber-500 rounded-t-sm transition-all duration-1000"
                    style={{ height: `${(stats.estados.enPausa / stats.totalLideres) * 100}%`, minHeight: stats.estados.enPausa > 0 ? '4px' : '0' }}
                  />
                  <span className="absolute -bottom-8 text-xs text-neutral-400 font-medium whitespace-nowrap">En pausa</span>
                </div>
                
                <div className="relative flex flex-col items-center w-16 group z-10">
                  <div className="absolute -top-8 text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">{stats.estados.retirado}</div>
                  <div 
                    className="w-full bg-rose-500 rounded-t-sm transition-all duration-1000"
                    style={{ height: `${(stats.estados.retirado / stats.totalLideres) * 100}%`, minHeight: stats.estados.retirado > 0 ? '4px' : '0' }}
                  />
                  <span className="absolute -bottom-8 text-xs text-neutral-400 font-medium">Retirado</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
            <p className="text-xs text-amber-500 italic flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>
                Nota: este tablero está diseñado para organización territorial, participación comunitaria y seguimiento logístico. No debe utilizarse para registrar intención de voto ni perfilar personas con datos sensibles.
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
