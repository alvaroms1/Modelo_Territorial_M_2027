import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Users,
  GitFork,
  Vote,
  MessageSquare,
  FileSpreadsheet,
  LogOut,
  ChevronDown,
  UserCheck,
  RotateCcw,
  Shield,
  Phone,
  Layers,
  Menu,
  X,
} from 'lucide-react';
import { getRoleBadge, getInitials, formatCedula } from '../utils/helpers';

export type NavTab = 'dashboard' | 'supporters' | 'leaders' | 'polling-stations' | 'whatsapp' | 'excel';

interface NavigationProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenAddSupporterModal: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddSupporterModal,
}) => {
  const { currentUser, logout, switchUser, users, resetToDemoData, visibleSupporters } = useApp();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  if (!currentUser) return null;

  const roleBadge = getRoleBadge(currentUser.role);

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'supporters' as NavTab, label: 'Personas de Apoyo', icon: Users, badge: visibleSupporters.length },
    { id: 'leaders' as NavTab, label: 'Estructura & Líderes', icon: GitFork },
    { id: 'polling-stations' as NavTab, label: 'Puestos de Votación', icon: Vote },
    { id: 'whatsapp' as NavTab, label: 'Mensajería WhatsApp', icon: MessageSquare },
    { id: 'excel' as NavTab, label: 'Excel & Plantillas', icon: FileSpreadsheet },
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center font-black text-white text-lg tracking-tighter shadow-md shadow-indigo-600/20">
              SP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-neutral-100 tracking-tight">
                  SIPOL Electoral
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Campaña 2026
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 hidden sm:block truncate max-w-[240px]">
                {currentUser.sector}
              </p>
            </div>
          </div>

          {/* User Profile & Switcher Button */}
          <div className="flex items-center gap-2 relative">
            <div className="relative">
              <button
                type="button"
                id="btn-role-switcher"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-neutral-800 bg-neutral-900/80 hover:bg-neutral-800/80 hover:border-neutral-700 transition cursor-pointer"
                title="Cambiar de usuario o rol"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {getInitials(currentUser.fullName)}
                </div>

                <div className="text-left hidden md:block">
                  <div className="text-xs font-semibold text-neutral-200 leading-tight truncate max-w-[140px]">
                    {currentUser.fullName}
                  </div>
                  <div className="text-[10px] text-neutral-400 flex items-center gap-1">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${currentUser.role === 'SUPER_ADMIN' ? 'bg-rose-400' : currentUser.role === 'LIDER_COORDINADOR' ? 'bg-indigo-400' : 'bg-emerald-400'}`}></span>
                    {currentUser.role === 'SUPER_ADMIN' ? 'Super Admin' : currentUser.role === 'LIDER_COORDINADOR' ? 'Líder Zona' : 'Sublíder'}
                  </div>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {/* Role switch dropdown modal */}
              {showRoleMenu && (
                <div
                  className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-2 py-1.5 border-b border-neutral-800 mb-2">
                    <div className="text-xs font-bold text-neutral-200">Usuario Activo</div>
                    <div className="text-[11px] text-neutral-400">
                      C.C. {formatCedula(currentUser.cedula)} • {currentUser.phone}
                    </div>
                    <div className="mt-1">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}>
                        {roleBadge.label}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-2 pt-1 pb-1 flex items-center justify-between">
                    <span>Cambiar de Rol (Demo):</span>
                  </div>

                  <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                    {users.map((u) => {
                      const isSelected = u.id === currentUser.id;
                      const badge = getRoleBadge(u.role);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            switchUser(u.id);
                            setShowRoleMenu(false);
                          }}
                          className={`w-full p-2 rounded-xl text-left transition flex items-center justify-between ${
                            isSelected
                              ? 'bg-indigo-600/20 border border-indigo-500/40'
                              : 'hover:bg-neutral-800/80 border border-transparent'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="text-xs font-medium text-neutral-200 truncate">
                              {u.fullName}
                            </div>
                            <div className="text-[10px] text-neutral-400 truncate">
                              {u.role === 'SUPER_ADMIN' ? '👑 Super Admin' : u.role === 'LIDER_COORDINADOR' ? '⭐ Líder Zona' : '🌱 Sublíder'} • {u.sector}
                            </div>
                          </div>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 mt-2 border-t border-neutral-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetToDemoData();
                        setShowRoleMenu(false);
                      }}
                      className="text-[11px] text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition p-1"
                      title="Restablecer datos originales de prueba"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reiniciar Demo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setShowRoleMenu(false);
                      }}
                      className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 transition p-1 font-medium"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action: Register Supporter */}
            <button
              type="button"
              id="btn-quick-add-supporter"
              onClick={onOpenAddSupporterModal}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <span>+</span>
              <span className="hidden sm:inline">Registrar</span>
              <span>Persona</span>
            </button>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="hidden md:block border-t border-neutral-800/80 bg-neutral-950/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
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

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-neutral-950/95 backdrop-blur-lg border-t border-neutral-800 px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition cursor-pointer min-w-[50px] ${
                isActive ? 'text-indigo-400 font-semibold' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400 stroke-[2.3]' : 'text-neutral-400'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[8px] font-bold bg-indigo-600 text-white">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
