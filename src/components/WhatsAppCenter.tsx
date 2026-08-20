import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  MessageCircle, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Copy, 
  RefreshCw, 
  MapPin, 
  Users, 
  Crown, 
  UserCheck, 
  Sparkles,
  ShieldCheck,
  Vote,
  Home
} from 'lucide-react';
import { smartSearch } from '../utils/helpers';

interface WhatsAppRecipient {
  id: string;
  nombres: string;
  apellidos?: string;
  cedula?: string;
  telefono?: string;
  correo?: string;
  rol: string;
  barrio?: string;
  sector_comuna?: string;
  puesto_id?: string;
  mesa?: string | number;
  lider_id?: string;
  sublider_id?: string;
  isUserAccount: boolean;
  genero?: string;
  edad?: number;
}

const TEMPLATES = [
  {
    id: 'recordatorio',
    icon: '🗳️',
    title: 'Recordatorio de Puesto & Mesa',
    desc: 'Informa al simpatizante o líder su colegio de votación y número de mesa.',
    text: '¡Hola [NOMBRE]! Te recordamos que tu puesto de votación asignado es: [PUESTO] (Mesa: [MESA]).\nAgradecemos tu valioso apoyo para las próximas elecciones. Saludos de parte de tu líder [LIDER].'
  },
  {
    id: 'confirmacion',
    icon: '👋',
    title: 'Confirmación de Registro',
    desc: 'Mensaje de bienvenida al unirse a la estructura del movimiento.',
    text: '¡Hola [NOMBRE]! Bienvenido(a) al equipo. Confirmamos tu registro en el sector [SECTOR] bajo la coordinación de [LIDER]. ¡Gracias por tu apoyo!'
  },
  {
    id: 'convocatoria',
    icon: '📣',
    title: 'Convocatoria a Reunión Territorial',
    desc: 'Invita a líderes y personas de apoyo a un evento o encuentro de sector.',
    text: '¡Hola [NOMBRE]! Te invitamos a nuestra próxima reunión territorial en el sector [SECTOR]. Tu asistencia es clave para organizar el trabajo con nuestro líder [LIDER].'
  },
  {
    id: 'directiva',
    icon: '⭐',
    title: 'Comunicaciones a la Estructura de Líderes',
    desc: 'Mensaje institucional y directrices para Líderes Principales, Invitados y Líderes.',
    text: 'Estimado(a) Líder [NOMBRE], le recordamos la importancia de continuar la programación de actividades territoriales y afiliación de nuevos contactos en el sector [SECTOR]. ¡Seguimos avanzando con paso firme! - Dirección General Mendozista.'
  },
  {
    id: 'd-day',
    icon: '🎯',
    title: 'Día de Elecciones (D-Day)',
    desc: 'Mensaje de motivación y movilización el día de la jornada electoral.',
    text: '¡Llegó el día [NOMBRE]! Hoy decidimos nuestro futuro. Recuerda votar en [PUESTO], mesa [MESA]. ¡Salgamos a votar temprano! - Equipo Mendozista'
  }
];

const TAGS = ['[NOMBRE]', '[PUESTO]', '[MESA]', '[LIDER]', '[SECTOR]'];

export const WhatsAppCenter: React.FC = () => {
  const { visibleContactos, pollingStations, users, contactos, currentUser } = useApp();
  const [activeTemplate, setActiveTemplate] = useState(TEMPLATES[0].id);
  const [message, setMessage] = useState(TEMPLATES[0].text);
  const [errorMsg, setErrorMsg] = useState('');
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Category Tab
  const [categoryTab, setCategoryTab] = useState<'ALL' | 'LIDERES' | 'CONTACTOS'>('ALL');

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [rolFiltro, setRolFiltro] = useState('');
  const [puestoFiltro, setPuestoFiltro] = useState('');
  const [sectorFiltro, setSectorFiltro] = useState('');
  const [generoFiltro, setGeneroFiltro] = useState('');
  const [edadFiltro, setEdadFiltro] = useState('');
  const [liderFiltro, setLiderFiltro] = useState('');
  const [subliderFiltro, setSubliderFiltro] = useState('');
  const [barrioFiltro, setBarrioFiltro] = useState('');

  // ═════════════════════════════════════════════════════════════
  // 1. CONSTRUCCIÓN DE TODOS LOS DESTINATARIOS (USUARIOS + CONTACTOS)
  // ═════════════════════════════════════════════════════════════
  const allRecipients: WhatsAppRecipient[] = useMemo(() => {
    // 1. Estructura de Usuarios / Líderes
    let accessibleUsers = users;
    if (currentUser?.rol === 'LIDER_PRINCIPAL' || currentUser?.rol === 'LIDER_PRINCIPAL_INVITADO') {
      accessibleUsers = users.filter(u => u.id === currentUser.id || u.lider_principal_id === currentUser.id);
    } else if (currentUser?.rol === 'LIDER' || currentUser?.rol === 'SUBLIDER') {
      accessibleUsers = users.filter(u => u.id === currentUser.id);
    }

    const userList: WhatsAppRecipient[] = accessibleUsers
      .filter(u => u.id !== currentUser?.id || currentUser?.rol === 'ADMIN')
      .map(u => ({
        id: u.id,
        nombres: u.nombre_completo,
        apellidos: '',
        cedula: u.cedula,
        telefono: u.telefono || '',
        correo: u.correo || '',
        rol: u.rol,
        barrio: u.barrio_residencia || '',
        sector_comuna: u.comuna_localidad || '',
        puesto_id: '',
        mesa: 'Directiva',
        isUserAccount: true,
        lider_id: u.lider_principal_id || '',
      }));

    // 2. Directorio de Contactos
    const contactList: WhatsAppRecipient[] = visibleContactos.map(c => ({
      id: c.id,
      nombres: c.nombres,
      apellidos: c.apellidos || '',
      cedula: c.cedula || '',
      telefono: c.telefono || '',
      correo: c.correo || '',
      rol: c.rol || 'CONTACTO',
      barrio: c.barrio || '',
      sector_comuna: c.sector_comuna || '',
      puesto_id: c.puesto_id || '',
      mesa: c.mesa || '',
      lider_id: c.lider_id,
      sublider_id: c.sublider_id,
      isUserAccount: false,
      genero: c.genero,
      edad: c.edad
    }));

    return [...userList, ...contactList];
  }, [users, visibleContactos, currentUser]);

  // Extract unique filter values
  const uniqueSectores = useMemo(() => {
    return Array.from(new Set(allRecipients.map(c => c.sector_comuna).filter(Boolean)));
  }, [allRecipients]);

  const uniqueBarrios = useMemo(() => {
    return Array.from(new Set(allRecipients.map(c => c.barrio).filter(Boolean)));
  }, [allRecipients]);

  const uniqueGeneros = useMemo(() => {
    return Array.from(new Set(allRecipients.map(c => c.genero).filter(Boolean)));
  }, [allRecipients]);

  useEffect(() => {
    const tpl = TEMPLATES.find(t => t.id === activeTemplate);
    if (tpl) {
      setMessage(tpl.text);
      setErrorMsg('');
    }
  }, [activeTemplate]);

  const insertTag = (tag: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newText = message.substring(0, start) + tag + message.substring(end);
    setMessage(newText);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start + tag.length, start + tag.length);
      }
    }, 0);
  };

  const getPuestoName = (id?: string) => {
    if (!id) return 'TU PUESTO DE VOTACIÓN';
    const puesto = pollingStations.find(p => p.id === id);
    return puesto ? puesto.nombre_puesto : 'TU PUESTO DE VOTACIÓN';
  };

  const getLiderName = (liderId?: string, subLiderId?: string) => {
    const relevantId = subLiderId || liderId;
    if (!relevantId) return 'DIRECCIÓN MENDOZISTA';
    const user = users.find(u => u.id === relevantId);
    if (user) return user.nombre_completo;
    const contacto = contactos.find(c => c.id === relevantId);
    if (contacto) return `${contacto.nombres} ${contacto.apellidos || ''}`.trim();
    return 'DIRECCIÓN MENDOZISTA';
  };

  const renderMessageForRecipient = (recipient: WhatsAppRecipient) => {
    let finalMessage = message;
    finalMessage = finalMessage.replace(/\[NOMBRE\]/g, `${recipient.nombres} ${recipient.apellidos || ''}`.trim());
    finalMessage = finalMessage.replace(/\[PUESTO\]/g, getPuestoName(recipient.puesto_id));
    finalMessage = finalMessage.replace(/\[MESA\]/g, recipient.mesa ? recipient.mesa.toString() : 'ASIGNADA');
    finalMessage = finalMessage.replace(/\[LIDER\]/g, getLiderName(recipient.lider_id, recipient.sublider_id));
    finalMessage = finalMessage.replace(/\[SECTOR\]/g, recipient.barrio || recipient.sector_comuna || 'TU SECTOR');
    return finalMessage;
  };

  const handleSendWhatsApp = (recipient: WhatsAppRecipient) => {
    if (!message.trim()) {
      setErrorMsg('El mensaje no puede estar vacío.');
      return;
    }
    
    if (!recipient.telefono || recipient.telefono.length < 7) {
      setErrorMsg(`El usuario ${recipient.nombres} no tiene un teléfono registrado.`);
      return;
    }

    setErrorMsg('');
    let phone = recipient.telefono.replace(/\D/g, '');
    if (phone.length === 10 && phone.startsWith('3')) {
      phone = '57' + phone;
    } else if (phone.length === 10) {
      phone = '57' + phone;
    }
    
    const text = encodeURIComponent(renderMessageForRecipient(recipient));
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const handleCopyMessage = (recipient: WhatsAppRecipient) => {
    const text = renderMessageForRecipient(recipient);
    navigator.clipboard.writeText(text);
    setCopySuccessId(recipient.id);
    setTimeout(() => setCopySuccessId(null), 2000);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setRolFiltro('');
    setPuestoFiltro('');
    setSectorFiltro('');
    setGeneroFiltro('');
    setEdadFiltro('');
    setLiderFiltro('');
    setSubliderFiltro('');
    setBarrioFiltro('');
  };

  // ═════════════════════════════════════════════════════════════
  // 2. FILTRADO DINÁMICO DE DESTINATARIOS
  // ═════════════════════════════════════════════════════════════
  const filteredRecipients = useMemo(() => {
    return allRecipients.filter(c => {
      // Filter by category tab
      if (categoryTab === 'LIDERES' && !c.isUserAccount) return false;
      if (categoryTab === 'CONTACTOS' && c.isUserAccount) return false;

      // Filter by search query
      if (searchTerm) {
        const matchesSearch = smartSearch([
          c.nombres,
          c.apellidos,
          c.cedula,
          c.telefono,
          c.correo,
          c.barrio,
          c.sector_comuna,
          c.rol,
          c.mesa
        ], searchTerm);
        if (!matchesSearch) return false;
      }

      // Filter by Role
      if (rolFiltro && c.rol !== rolFiltro) return false;

      // Location & demographic filters
      if (puestoFiltro && c.puesto_id !== puestoFiltro) return false;
      if (sectorFiltro && c.sector_comuna !== sectorFiltro) return false;
      if (generoFiltro && c.genero !== generoFiltro) return false;
      
      if (edadFiltro && c.edad) {
        if (edadFiltro === '18-25' && (c.edad < 18 || c.edad > 25)) return false;
        if (edadFiltro === '26-35' && (c.edad < 26 || c.edad > 35)) return false;
        if (edadFiltro === '36-50' && (c.edad < 36 || c.edad > 50)) return false;
        if (edadFiltro === '51+' && c.edad <= 50) return false;
      }

      if (liderFiltro && c.lider_id !== liderFiltro) return false;
      if (subliderFiltro && c.sublider_id !== subliderFiltro) return false;
      if (barrioFiltro && c.barrio !== barrioFiltro) return false;

      return true;
    });
  }, [allRecipients, categoryTab, searchTerm, rolFiltro, puestoFiltro, sectorFiltro, generoFiltro, edadFiltro, liderFiltro, subliderFiltro, barrioFiltro]);

  const activeFiltersCount = [searchTerm, rolFiltro, puestoFiltro, sectorFiltro, generoFiltro, edadFiltro, liderFiltro, subliderFiltro, barrioFiltro].filter(Boolean).length;

  const countLideres = allRecipients.filter(r => r.isUserAccount).length;
  const countContactos = allRecipients.filter(r => !r.isUserAccount).length;

  const formatBadgeRole = (rol: string) => {
    switch (rol) {
      case 'ADMIN':
        return { label: 'Administrador General', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'LIDER_PRINCIPAL':
        return { label: 'Líder Principal', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'LIDER_PRINCIPAL_INVITADO':
        return { label: 'Líder Princ. Invitado', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/30' };
      case 'LIDER':
        return { label: 'Líder Territorial', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'SUBLIDER':
        return { label: 'Sublíder', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      default:
        return { label: rol.replace(/_/g, ' '), bg: 'bg-neutral-800 text-neutral-300 border-neutral-700' };
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* ─── HEADER PRINCIPAL ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-emerald-400" />
              Mensajería y Comunicaciones WhatsApp
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {allRecipients.length} Destinatarios Totales
            </span>
          </div>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1">
            Envía comunicados a Líderes Principales, Invitados, Líderes Territoriales y Contactos de apoyo con variables personalizadas
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <p className="text-sm font-bold text-rose-400">{errorMsg}</p>
        </div>
      )}

      {/* ─── PLANTILLAS Y EDITOR ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Templates */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-black text-neutral-400 tracking-widest uppercase">
            Plantillas de Mensajes:
          </h3>
          <div className="space-y-2.5">
            {TEMPLATES.map((tpl) => {
              const isActive = activeTemplate === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setActiveTemplate(tpl.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-neutral-900 border-emerald-500/60 shadow-lg shadow-emerald-950/20' 
                      : 'bg-neutral-900/60 border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{tpl.icon}</span>
                    <h4 className={`text-xs font-bold ${isActive ? 'text-emerald-400' : 'text-neutral-200'}`}>
                      {tpl.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-neutral-400 pl-7 line-clamp-2">
                    {tpl.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Editor */}
        <div className="lg:col-span-8">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col h-full space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-xs sm:text-sm font-bold text-neutral-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Mensaje a Enviar (Personalizable)
              </h2>
              <p className="text-[10px] text-neutral-400 hidden sm:block">
                Variables dinámicas disponibles: <span className="text-emerald-400 font-mono">[NOMBRE]</span>, <span className="text-indigo-400 font-mono">[PUESTO]</span>, <span className="text-amber-400 font-mono">[MESA]</span>
              </p>
            </div>
            
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setErrorMsg('');
              }}
              className="flex-1 w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-sm p-4 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 outline-none transition resize-none font-sans min-h-[160px]"
              placeholder="Escribe tu mensaje aquí..."
            />
            
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-neutral-500 font-medium mr-1">Insertar tag:</span>
              {TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => insertTag(tag)}
                  className="px-2.5 py-1 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-mono transition cursor-pointer shadow-sm"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── PESTAÑAS DE CATEGORÍA DE DESTINATARIOS (TODOS / LÍDERES / CONTACTOS) ─── */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2">
        <button
          onClick={() => setCategoryTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
            categoryTab === 'ALL'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Todos los Destinatarios</span>
          <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px]">
            {allRecipients.length}
          </span>
        </button>

        <button
          onClick={() => setCategoryTab('LIDERES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
            categoryTab === 'LIDERES'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <Crown className="w-4 h-4 text-purple-300" />
          <span>Estructura de Líderes (Principales, Invitados, Líderes)</span>
          <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px]">
            {countLideres}
          </span>
        </button>

        <button
          onClick={() => setCategoryTab('CONTACTOS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
            categoryTab === 'CONTACTOS'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
          }`}
        >
          <UserCheck className="w-4 h-4 text-indigo-300" />
          <span>Directorio de Contactos (Simpatizantes)</span>
          <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px]">
            {countContactos}
          </span>
        </button>
      </div>

      {/* ─── FILTROS AVANZADOS ─── */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar por Cédula, Nombres, Teléfono, Barrio, Rol o Puesto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-white text-sm pl-9 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none transition"
            />
          </div>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition text-xs font-bold flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Limpiar Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-neutral-800">
          
          {/* Filtro por Rol */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Rol / Tipo de Usuario
            </label>
            <select
              value={rolFiltro}
              onChange={(e) => setRolFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none"
            >
              <option value="">Todos los Roles</option>
              <option value="LIDER_PRINCIPAL">⭐ Líder Principal</option>
              <option value="LIDER_PRINCIPAL_INVITADO">⭐ Líder Principal Invitado</option>
              <option value="LIDER">👥 Líder Territorial</option>
              <option value="SUBLIDER">🌱 Sublíder</option>
              <option value="CONTACTO">📋 Contacto / Simpatizante</option>
            </select>
          </div>

          {/* Filtro por Puesto */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Vote className="w-3.5 h-3.5 text-indigo-400" /> Puesto de Votación
            </label>
            <select
              value={puestoFiltro}
              onChange={(e) => setPuestoFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none"
            >
              <option value="">Todos los Puestos</option>
              {pollingStations.map(p => (
                <option key={p.id} value={p.id}>{p.nombre_puesto}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Sector / Comuna */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-rose-400" /> Sector / Comuna
            </label>
            <select
              value={sectorFiltro}
              onChange={(e) => setSectorFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none"
            >
              <option value="">Todos los Sectores</option>
              {uniqueSectores.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Filtro por Barrio */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Home className="w-3.5 h-3.5 text-emerald-400" /> Barrio
            </label>
            <select
              value={barrioFiltro}
              onChange={(e) => setBarrioFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none"
            >
              <option value="">Todos los Barrios</option>
              {uniqueBarrios.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─── LISTA DE DESTINATARIOS FILTRADOS ─── */}
      <div className="space-y-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <h3 className="text-xs font-black text-neutral-400 tracking-widest uppercase flex items-center gap-2">
            <span>Destinatarios Filtrados ({filteredRecipients.length} Personas)</span>
          </h3>
          <p className="text-xs text-neutral-500">
            Haz clic en <strong>Enviar WhatsApp</strong> para abrir el chat con el mensaje preformateado
          </p>
        </div>

        <div className="space-y-3">
          {filteredRecipients.length === 0 ? (
            <div className="bg-neutral-900 border border-neutral-800 p-10 rounded-3xl text-center space-y-2">
              <Users className="w-10 h-10 text-neutral-600 mx-auto" />
              <p className="text-neutral-300 text-sm font-bold">No se encontraron personas con los filtros seleccionados.</p>
              <p className="text-neutral-500 text-xs">Prueba limpiando los filtros o cambiando la pestaña de categoría.</p>
            </div>
          ) : (
            filteredRecipients.map((recipient) => {
              const renderedMessage = renderMessageForRecipient(recipient);
              const badge = formatBadgeRole(recipient.rol);
              return (
                <div 
                  key={`${recipient.isUserAccount ? 'usr' : 'cnt'}_${recipient.id}`} 
                  className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition shadow-md"
                >
                  
                  {/* Left: Contact Info & Badge */}
                  <div className="min-w-[220px] md:w-[280px] shrink-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-white">
                        {recipient.nombres} {recipient.apellidos}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-emerald-400 font-bold">
                        {recipient.telefono || 'Sin teléfono'}
                      </span>
                      {recipient.cedula && (
                        <>
                          <span className="text-neutral-600">•</span>
                          <span className="text-neutral-400 font-mono text-[11px]">CC: {recipient.cedula}</span>
                        </>
                      )}
                    </div>

                    {(recipient.barrio || recipient.puesto_id) && (
                      <p className="text-[11px] text-neutral-400 truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                        <span>{recipient.barrio || 'Cartagena'}</span>
                        {recipient.puesto_id && (
                          <span className="text-neutral-500">· {getPuestoName(recipient.puesto_id)}</span>
                        )}
                      </p>
                    )}
                  </div>

                  {/* Middle: Rendered Message Preview */}
                  <div className="flex-1 px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 min-w-0 w-full md:w-auto">
                    <p className="text-xs text-neutral-300 italic line-clamp-2 leading-relaxed" title={renderedMessage}>
                      "{renderedMessage}"
                    </p>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                    <button
                      onClick={() => handleCopyMessage(recipient)}
                      className="p-2.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition cursor-pointer"
                      title="Copiar texto del mensaje"
                    >
                      {copySuccessId === recipient.id ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => handleSendWhatsApp(recipient)}
                      disabled={!recipient.telefono}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Enviar WhatsApp</span>
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
