import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { MessageCircle, Send, AlertTriangle, CheckCircle2, Search, Copy, RefreshCw, MapPin, Users, GitFork, GitBranch, Calendar, CheckSquare, Home, Vote } from 'lucide-react';
import { Contacto } from '../types';
import { smartSearch } from '../utils/helpers';

const TEMPLATES = [
  {
    id: 'recordatorio',
    icon: '🗳️',
    title: 'Recordatorio de Puesto & Mesa',
    desc: 'Informa al simpatizante su colegio de votación y número de mesa.',
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
    desc: 'Invita a las personas de apoyo a un evento o encuentro de sector.',
    text: '¡Hola [NOMBRE]! Te invitamos a nuestra próxima reunión territorial en el sector [SECTOR]. Tu asistencia es clave para organizar el trabajo con nuestro líder [LIDER].'
  },
  {
    id: 'd-day',
    icon: '🎯',
    title: 'Día de Elecciones (D-Day)',
    desc: 'Mensaje de motivación y movilización el día de la jornada electoral.',
    text: '¡Llegó el día [NOMBRE]! Hoy decidimos nuestro futuro. Recuerda votar en [PUESTO], mesa [MESA]. ¡Salgamos a votar temprano! - Equipo Mendozismo'
  }
];

const TAGS = ['[NOMBRE]', '[PUESTO]', '[MESA]', '[LIDER]', '[SECTOR]'];

export const WhatsAppCenter: React.FC = () => {
  const { visibleContactos, pollingStations, users, contactos, currentUser } = useApp();
  const [activeTemplate, setActiveTemplate] = useState(TEMPLATES[0].id);
  const [message, setMessage] = useState(TEMPLATES[0].text);
  const [errorMsg, setErrorMsg] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [puestoFiltro, setPuestoFiltro] = useState('');
  const [sectorFiltro, setSectorFiltro] = useState('');
  const [generoFiltro, setGeneroFiltro] = useState('');
  const [edadFiltro, setEdadFiltro] = useState('');
  const [liderFiltro, setLiderFiltro] = useState('');
  const [subliderFiltro, setSubliderFiltro] = useState('');
  const [compromisoFiltro, setCompromisoFiltro] = useState('');
  const [barrioFiltro, setBarrioFiltro] = useState('');

  // Extract unique values
  const uniqueSectores = Array.from(new Set(visibleContactos.map(c => c.sector_comuna).filter(Boolean)));
  const uniqueBarrios = Array.from(new Set(visibleContactos.map(c => c.barrio).filter(Boolean)));
  const uniqueGeneros = Array.from(new Set(visibleContactos.map(c => c.genero).filter(Boolean)));
  const uniqueCompromisos = Array.from(new Set(visibleContactos.map(c => c.rol).filter(Boolean)));
  
  // Incluir siempre al usuario actual si es líder, para que pueda filtrar por sí mismo
  const uniqueLideres = users.filter(u => 
    visibleContactos.some(c => c.lider_id === u.id) || 
    (currentUser && u.id === currentUser.id && (u.rol === 'LIDER' || u.rol === 'LIDER_PRINCIPAL' || u.rol === 'LIDER_PRINCIPAL_INVITADO'))
  );
  
  // Sublideres are now contacts with rol === 'SUBLIDER'
  const sublideresIdsSet = new Set(visibleContactos.map(c => c.sublider_id).filter(Boolean));
  const uniqueSublideres = contactos.filter(c => sublideresIdsSet.has(c.id));

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
    return puesto ? puesto.nombre : 'TU PUESTO DE VOTACIÓN';
  };

  const getLiderName = (liderId?: string, subLiderId?: string) => {
    const relevantId = subLiderId || liderId;
    if (!relevantId) return 'TU LÍDER';
    const user = users.find(u => u.id === relevantId);
    if (user) return user.nombre_completo;
    const contacto = contactos.find(c => c.id === relevantId);
    if (contacto) return `${contacto.nombres} ${contacto.apellidos || ''}`.trim();
    return 'TU LÍDER';
  };

  const renderMessageForContact = (contacto: Contacto) => {
    let finalMessage = message;
    finalMessage = finalMessage.replace(/\[NOMBRE\]/g, contacto.nombres || '');
    finalMessage = finalMessage.replace(/\[PUESTO\]/g, getPuestoName(contacto.puesto_id));
    finalMessage = finalMessage.replace(/\[MESA\]/g, contacto.mesa ? contacto.mesa.toString() : 'SIN ASIGNAR');
    finalMessage = finalMessage.replace(/\[LIDER\]/g, getLiderName(contacto.lider_id, contacto.sublider_id));
    finalMessage = finalMessage.replace(/\[SECTOR\]/g, contacto.barrio || 'TU SECTOR');
    return finalMessage;
  };

  const handleSendWhatsApp = (contacto: Contacto) => {
    if (!message.trim()) {
      setErrorMsg('El mensaje no puede estar vacío.');
      return;
    }
    
    if (!contacto.telefono || contacto.telefono.length < 10) {
      setErrorMsg(`El contacto ${contacto.nombres} no tiene un teléfono válido.`);
      return;
    }

    setErrorMsg('');
    let phone = contacto.telefono.replace(/\D/g, '');
    if (phone.length === 10) {
      phone = '57' + phone;
    }
    
    const text = encodeURIComponent(renderMessageForContact(contacto));
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const handleCopyMessage = (contacto: Contacto) => {
    const text = renderMessageForContact(contacto);
    navigator.clipboard.writeText(text);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setPuestoFiltro('');
    setSectorFiltro('');
    setGeneroFiltro('');
    setEdadFiltro('');
    setLiderFiltro('');
    setSubliderFiltro('');
    setCompromisoFiltro('');
    setBarrioFiltro('');
  };

  const filteredContactos = visibleContactos.filter(c => {
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

    if (puestoFiltro && c.puesto_id !== puestoFiltro) return false;
    if (sectorFiltro && c.sector_comuna !== sectorFiltro) return false;
    if (generoFiltro && c.genero !== generoFiltro) return false;
    
    if (edadFiltro) {
       if (edadFiltro === '18-25' && (c.edad < 18 || c.edad > 25)) return false;
       if (edadFiltro === '26-35' && (c.edad < 26 || c.edad > 35)) return false;
       if (edadFiltro === '36-50' && (c.edad < 36 || c.edad > 50)) return false;
       if (edadFiltro === '51+' && c.edad <= 50) return false;
    }

    if (liderFiltro && c.lider_id !== liderFiltro) return false;
    if (subliderFiltro && c.sublider_id !== subliderFiltro) return false;
    if (compromisoFiltro && c.rol !== compromisoFiltro) return false;
    if (barrioFiltro && c.barrio !== barrioFiltro) return false;

    return true;
  });

  const activeFiltersCount = [searchTerm, puestoFiltro, sectorFiltro, generoFiltro, edadFiltro, liderFiltro, subliderFiltro, compromisoFiltro, barrioFiltro].filter(Boolean).length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Centro de Comunicaciones por WhatsApp
            <span className="px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              WhatsApp Directo
            </span>
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Envío de recordatorios de puestos de votación, mesas y convocatorias con variables dinámicas
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400" />
          <p className="text-sm font-bold text-rose-400">{errorMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Templates */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-xs font-black text-neutral-400 tracking-widest uppercase mb-4">Plantillas Prediseñadas:</h3>
          <div className="space-y-3">
            {TEMPLATES.map((tpl) => {
              const isActive = activeTemplate === tpl.id;
              return (
                <button
                  key={tpl.id}
                  onClick={() => setActiveTemplate(tpl.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#09090b] border-emerald-500/50 shadow-lg shadow-emerald-900/10' 
                      : 'bg-neutral-900/50 border-neutral-800 hover:bg-neutral-800/80 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">{tpl.icon}</span>
                    <h4 className={`text-sm font-bold ${isActive ? 'text-emerald-400' : 'text-neutral-200'}`}>
                      {tpl.title}
                    </h4>
                  </div>
                  <p className="text-xs text-neutral-500 pl-8">
                    {tpl.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Editor */}
        <div className="lg:col-span-8">
          <div className="bg-[#09090b] border border-neutral-800/80 rounded-3xl p-6 shadow-xl shadow-black/20 flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-neutral-100">Mensaje a Enviar (Personalizable)</h2>
              <p className="text-[10px] text-neutral-500">Variables disponibles: <span className="text-emerald-400 font-mono">[NOMBRE]</span>, <span className="text-indigo-400 font-mono">[PUESTO]</span>, <span className="text-amber-400 font-mono">[MESA]</span></p>
            </div>
            
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setErrorMsg('');
              }}
              className="flex-1 w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-sm p-5 rounded-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition resize-none font-sans min-h-[200px]"
              placeholder="Escribe tu mensaje aquí..."
            />
            
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-neutral-500 mr-2">Insertar tag:</span>
              {TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => insertTag(tag)}
                  className="px-2 py-1 rounded border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-mono transition"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters Section */}
      <div className="bg-[#09090b] border border-neutral-800/80 rounded-3xl p-6 shadow-xl mt-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar por Cédula, Nombres, Teléfono, Barrio o Puesto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-white text-sm pl-9 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none transition"
            />
          </div>
          <button
            onClick={handleClearFilters}
            className="px-4 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition text-sm font-bold flex items-center gap-2 whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4" />
            Limpiar Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-neutral-800/80">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Vote className="w-3.5 h-3.5 text-indigo-400" /> Puesto de Votación
            </label>
            <select
              value={puestoFiltro}
              onChange={(e) => setPuestoFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none"
            >
              <option value="">Todos los Puestos</option>
              {pollingStations.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 flex items-center gap-1.5 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-rose-400" /> Sector / Comuna
            </label>
            <select
              value={sectorFiltro}
              onChange={(e) => setSectorFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none"
            >
              <option value="">Todos los Sectores</option>
              {uniqueSectores.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-emerald-400" /> Género
            </label>
            <select
              value={generoFiltro}
              onChange={(e) => setGeneroFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none"
            >
              <option value="">Todos los Géneros</option>
              {uniqueGeneros.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> Rango de Edades
            </label>
            <select
              value={edadFiltro}
              onChange={(e) => setEdadFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none"
            >
              <option value="">Todas las Edades</option>
              <option value="18-25">18 a 25 años</option>
              <option value="26-35">26 a 35 años</option>
              <option value="36-50">36 a 50 años</option>
              <option value="51+">Mayores de 50</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 flex items-center gap-1.5 uppercase tracking-wider">
              <GitFork className="w-3.5 h-3.5 text-cyan-400" /> Por Líder
            </label>
            <select
              value={liderFiltro}
              onChange={(e) => setLiderFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none"
            >
              <option value="">Todos los Líderes</option>
              {uniqueLideres.map(l => (
                <option key={l.id} value={l.id}>{l.nombre_completo}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 flex items-center gap-1.5 uppercase tracking-wider">
              <GitBranch className="w-3.5 h-3.5 text-blue-400" /> Por Sublíder
            </label>
            <select
              value={subliderFiltro}
              onChange={(e) => setSubliderFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none"
            >
              <option value="">Todos los Sublíderes</option>
              {uniqueSublideres.map(s => (
                <option key={s.id} value={s.id}>{s.nombre_completo}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 flex items-center gap-1.5 uppercase tracking-wider">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-400" /> Rol Asignado
            </label>
            <select
              value={compromisoFiltro}
              onChange={(e) => setCompromisoFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none"
            >
              <option value="">Todos los Estados</option>
              {uniqueCompromisos.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Home className="w-3.5 h-3.5 text-purple-400" /> Barrio
            </label>
            <select
              value={barrioFiltro}
              onChange={(e) => setBarrioFiltro(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-neutral-300 text-xs p-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none"
            >
              <option value="">Todos los Barrios</option>
              {uniqueBarrios.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Rendered Contacts List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-black text-neutral-400 tracking-widest uppercase">
            Destinatarios Filtrados ({filteredContactos.length} Personas):
          </h3>
          <p className="text-xs text-neutral-500">Haz clic en el botón verde para abrir el chat de WhatsApp con el mensaje listo</p>
        </div>

        <div className="space-y-3">
          {filteredContactos.length === 0 ? (
            <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-3xl text-center">
              <p className="text-neutral-400 text-sm">No hay contactos que coincidan con los filtros seleccionados.</p>
            </div>
          ) : (
            filteredContactos.map((contacto) => {
              const renderedMessage = renderMessageForContact(contacto);
              return (
                <div key={contacto.id} className="bg-[#09090b] border border-neutral-800 p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-neutral-700 transition group">
                  
                  {/* Left: Contact Info */}
                  <div className="min-w-[200px] md:w-[250px] shrink-0">
                    <p className="text-sm font-bold text-neutral-200">
                      {contacto.nombres} {contacto.apellidos} 
                      <span className="text-neutral-500 font-mono text-[10px] ml-2">C.C. {contacto.cedula}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-emerald-400">{contacto.telefono || 'Sin teléfono'}</span>
                      <span className="text-neutral-600">•</span>
                      <span className="text-[10px] text-neutral-400 truncate max-w-[120px]" title={getPuestoName(contacto.puesto_id)}>
                        {getPuestoName(contacto.puesto_id)} (Mesa {contacto.mesa || '-'})
                      </span>
                    </div>
                  </div>

                  {/* Middle: Rendered Message Preview */}
                  <div className="flex-1 px-4 py-2 rounded-xl bg-neutral-950/50 border border-neutral-800/50 min-w-0">
                    <p className="text-xs text-neutral-400 italic line-clamp-2" title={renderedMessage}>
                      "{renderedMessage}"
                    </p>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                    <button
                      onClick={() => handleCopyMessage(contacto)}
                      className="p-2.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
                      title="Copiar mensaje"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSendWhatsApp(contacto)}
                      disabled={!contacto.telefono}
                      className="px-4 py-2.5 rounded-xl bg-emerald-900/40 text-emerald-400 border border-emerald-900/60 hover:bg-emerald-800/60 hover:text-emerald-300 transition disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xs flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Reenviar WhatsApp
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
