import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Users,
  GitFork,
  Vote,
  LogOut,
  ChevronDown,
  RotateCcw,
  FileSpreadsheet,
  MessageCircle
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
  const { currentUser, logout, users, visibleContactos } = useApp();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

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
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'contactos' as NavTab, label: 'Contactos', icon: Users, badge: visibleContactos.length },
    { id: 'leaders' as NavTab, label: 'Líderes', icon: GitFork },
    { id: 'polling-stations' as NavTab, label: 'Puestos de Votación', icon: Vote },
    { id: 'whatsapp' as NavTab, label: 'Mensajería WhatsApp', icon: MessageCircle },
    { id: 'excel' as NavTab, label: 'Excel & Plantillas', icon: FileSpreadsheet },
  ];

  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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

  return (
    <>
      <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-md shadow-emerald-500/20 overflow-hidden border border-emerald-500/30">
              <img src="/logo_mendozismo.png" alt="Mendozismo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-base text-neutral-100 tracking-tight">
                  Mendozismo
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block truncate max-w-[240px]">
                Control Territorial
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRoleMenu(!showRoleMenu);
                }}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800/80 hover:border-neutral-700 transition cursor-pointer"
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
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {showRoleMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-2 z-50 flex flex-col gap-1"
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
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>+</span>
              <span className="hidden sm:inline">Nuevo</span>
              <span>Contacto</span>
            </button>
          </div>
        </div>

        <div className="hidden md:block border-t border-neutral-800/80 bg-neutral-950/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
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
    </>
  );
};
