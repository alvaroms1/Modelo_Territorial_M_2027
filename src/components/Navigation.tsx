import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Users,
  GitFork,
  Vote,
  LogOut,
  ChevronDown,
  FileSpreadsheet,
  MessageCircle,
  Menu,
  X,
  UserPlus,
  Shield,
  Layers,
  ChevronRight
} from 'lucide-react';

export type NavTab = 'dashboard' | 'contactos' | 'leaders' | 'polling-stations' | 'whatsapp' | 'excel';

interface NavigationProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenAddContactoModal: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddContactoModal,
}) => {
  const { currentUser, logout, visibleContactos } = useApp();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  if (!currentUser) return null;

  const formatRoleName = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrador';
      case 'LIDER_PRINCIPAL': return 'Líder Principal';
      case 'LIDER_PRINCIPAL_INVITADO': return 'Líder Principal Invitado';
      case 'LIDER': return 'Líder';
      case 'SUBLIDER': return 'Sublíder';
      default: return role;
    }
  };

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard, desc: 'Tablero y Analítica' },
    { id: 'contactos' as NavTab, label: 'Contactos', icon: Users, badge: visibleContactos.length, desc: 'Directorio Electoral' },
    { id: 'leaders' as NavTab, label: 'Líderes', icon: GitFork, desc: 'Estructura Territorial' },
    { id: 'polling-stations' as NavTab, label: 'Puestos de Votación', icon: Vote, desc: '108 Puestos Cartagena' },
    { id: 'whatsapp' as NavTab, label: 'Mensajería WhatsApp', icon: MessageCircle, desc: 'Comunicaciones Masivas' },
    { id: 'excel' as NavTab, label: 'Excel & Plantillas', icon: FileSpreadsheet, desc: 'Importar y Exportar' },
  ];

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
    };

    if (showRoleMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRoleMenu]);

  const handleTabClick = (tabId: NavTab) => {
    setActiveTab(tabId);
    setIsMobileDrawerOpen(false);
  };

  return (
    <>
      {/* ─── HEADER PRINCIPAL ─── */}
      <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-3">
          
          {/* Lado Izquierdo: Botón Menú Móvil + Logo */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
              title="Abrir Menú"
            >
              <Menu className="w-5 h-5 text-emerald-400" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-emerald-500/20 overflow-hidden border border-emerald-500/30 shrink-0">
              <img src="/logo_mendozismo.png" alt="Mendozismo" className="w-full h-full object-contain" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm sm:text-base text-neutral-100 tracking-tight">
                  Mendozismo
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden xs:inline-block">
                  2027
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-neutral-400 truncate max-w-[150px] sm:max-w-[240px]">
                Control Territorial
              </p>
            </div>
          </div>

          {/* Lado Derecho: Perfil + Botón Registrar */}
          <div className="flex items-center gap-2">
            {/* User Dropdown */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRoleMenu(!showRoleMenu);
                }}
                className="flex items-center gap-2 p-1 sm:px-3 sm:py-1.5 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800/80 hover:border-neutral-700 transition cursor-pointer"
              >
                <div className="relative">
                  {localStorage.getItem(`avatar_${currentUser.cedula}`) ? (
                    <img 
                      src={localStorage.getItem(`avatar_${currentUser.cedula}`) as string} 
                      alt="Avatar" 
                      className="w-7 h-7 rounded-lg object-cover bg-neutral-800 shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {currentUser.nombre_completo.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-semibold text-neutral-200 leading-tight truncate max-w-[140px]">
                    {currentUser.nombre_completo}
                  </div>
                  <div className="text-[10px] text-neutral-400 flex items-center gap-1">
                    {formatRoleName(currentUser.rol)}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400 hidden xs:block" />
              </button>

              {showRoleMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-2 z-50 flex flex-col gap-1 animate-in fade-in slide-in-from-top-2"
                >
                  <div className="flex items-center gap-3 p-2">
                    <div className="relative group cursor-pointer shrink-0" onClick={() => document.getElementById('avatar-upload')?.click()}>
                      {localStorage.getItem(`avatar_${currentUser.cedula}`) ? (
                        <img 
                          src={localStorage.getItem(`avatar_${currentUser.cedula}`) as string} 
                          alt="Avatar" 
                          className="w-10 h-10 rounded-xl object-cover bg-neutral-800"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm">
                          {currentUser.nombre_completo.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <span className="text-[9px] font-bold text-white text-center leading-tight">Cambiar<br/>Foto</span>
                      </div>
                      <input 
                        type="file" 
                        id="avatar-upload" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const base64 = event.target?.result as string;
                              localStorage.setItem(`avatar_${currentUser.cedula}`, base64);
                              setShowRoleMenu(false);
                              setTimeout(() => setShowRoleMenu(true), 10);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{currentUser.nombre_completo}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{formatRoleName(currentUser.rol)}</p>
                    </div>
                  </div>
                  
                  <div className="border-t border-neutral-800 pt-1 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setShowRoleMenu(false);
                      }}
                      className="w-full text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-xl px-3 py-2 flex items-center gap-2 transition font-medium text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenAddContactoModal}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nuevo</span>
              <span>Contacto</span>
            </button>
          </div>
        </div>

        {/* ─── BARRA DE PESTAÑAS (Móvil con Scroll Táctil + Escritorio) ─── */}
        <div className="border-t border-neutral-800/80 bg-neutral-950/60">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-neutral-800 text-neutral-100 shadow-sm border border-neutral-700'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-indigo-600/30 text-indigo-300' : 'bg-neutral-800 text-neutral-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ─── PANEL LATERAL DESPLEGABLE MÓVIL (DRAWER SIDEBAR) ─── */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Panel Lateral Deslizante */}
          <div className="relative w-4/5 max-w-xs bg-[#111114] border-r border-neutral-800 h-full flex flex-col z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            
            {/* Header del Drawer */}
            <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between bg-neutral-950/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center border border-emerald-500/30 shadow-md shadow-emerald-500/20">
                  <img src="/logo_mendozismo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm tracking-tight leading-tight">Mendozismo</h3>
                  <p className="text-[10px] text-emerald-400 font-semibold">Control Territorial 2027</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Perfil del Usuario Activo */}
            <div className="p-4 bg-neutral-900/40 border-b border-neutral-800/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {currentUser.nombre_completo.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{currentUser.nombre_completo}</p>
                  <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-semibold mt-0.5">
                    {formatRoleName(currentUser.rol)}
                  </span>
                </div>
              </div>
            </div>

            {/* Lista de Navegación de Módulos */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <p className="px-3 py-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Módulos del Sistema
              </p>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl transition cursor-pointer text-left ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-900/50 to-neutral-900 text-white border border-indigo-500/30 shadow-md'
                        : 'text-neutral-300 hover:bg-neutral-900 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        isActive ? 'bg-indigo-600 text-white' : 'bg-neutral-800/80 text-neutral-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight flex items-center gap-2">
                          <span>{item.label}</span>
                          {item.badge !== undefined && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-indigo-500 text-white">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-neutral-400'}`} />
                  </button>
                );
              })}
            </div>

            {/* Botón de Acción Rápida & Cerrar Sesión */}
            <div className="p-3 border-t border-neutral-800 bg-neutral-950/70 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  onOpenAddContactoModal();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Registrar Contacto</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  logout();
                }}
                className="w-full py-2 px-3 rounded-xl border border-neutral-800 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold flex items-center justify-center gap-2 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── BARRA DE NAVEGACIÓN INFERIOR FIJA (BOTTOM NAV BAR PARA CELULARES) ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-800/90 px-2 py-1.5 flex items-center justify-around">
        <button
          type="button"
          onClick={() => handleTabClick('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeTab === 'dashboard' ? 'text-indigo-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Tablero</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('contactos')}
          className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeTab === 'contactos' ? 'text-indigo-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Contactos</span>
          {visibleContactos.length > 0 && (
            <span className="absolute top-0 right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-indigo-600 text-white shadow-sm">
              {visibleContactos.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('leaders')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeTab === 'leaders' ? 'text-indigo-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <GitFork className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Líderes</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabClick('polling-stations')}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            activeTab === 'polling-stations' ? 'text-indigo-400 font-bold' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Vote className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Puestos</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
            isMobileDrawerOpen || activeTab === 'whatsapp' || activeTab === 'excel'
              ? 'text-emerald-400 font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Menu className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px] mt-0.5 text-emerald-400">Más...</span>
        </button>
      </nav>
    </>
  );
};
