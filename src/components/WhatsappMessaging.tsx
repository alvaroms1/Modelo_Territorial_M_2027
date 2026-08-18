import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  MessageSquare,
  Send,
  Sparkles,
  Users,
  CheckCircle2,
  Copy,
  Check,
  Phone,
  Vote,
  Filter,
} from 'lucide-react';
import { generateWhatsappLink, formatCedula } from '../utils/helpers';
import { FilterBar } from './FilterBar';

export const WhatsappMessaging: React.FC = () => {
  const { visibleSupporters, toggleWhatsappContacted, currentUser } = useApp();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [selectedTemplate, setSelectedTemplate] = useState<'welcome' | 'polling' | 'meeting' | 'dday'>('polling');
  const [customMessage, setCustomMessage] = useState(
    '¡Hola [NOMBRE]! Te recordamos que tu puesto de votación asignado es: [PUESTO] (Mesa: [MESA]). Agradecemos tu valioso apoyo para las próximas elecciones. Saludos de parte de tu líder [LIDER].'
  );

  const templates = [
    {
      id: 'polling' as const,
      title: '🗳️ Recordatorio de Puesto & Mesa',
      desc: 'Informa al simpatizante su colegio de votación y número de mesa.',
      text: '¡Hola [NOMBRE]! Te recordamos que tu puesto de votación asignado es: [PUESTO] (Mesa: [MESA]). Agradecemos tu valioso apoyo para las próximas elecciones. Saludos de parte de tu líder [LIDER].',
    },
    {
      id: 'welcome' as const,
      title: '👋 Confirmación de Registro',
      desc: 'Mensaje de bienvenida al unirse a la estructura del movimiento.',
      text: '¡Hola [NOMBRE]! Te confirmamos que has sido registrado(a) exitosamente en nuestro movimiento político por tu líder [LIDER]. Tu puesto asignado es [PUESTO]. ¡Juntos lograremos la victoria!',
    },
    {
      id: 'meeting' as const,
      title: '📢 Convocatoria a Reunión Territorial',
      desc: 'Invita a las personas de apoyo a un evento o encuentro de sector.',
      text: 'Estimado(a) [NOMBRE], te invitamos a una reunión especial de nuestro movimiento este fin de semana en el sector [SECTOR]. Tu presencia y liderazgo son fundamentales. ¡Te esperamos!',
    },
    {
      id: 'dday' as const,
      title: '🎯 Día de Elecciones (D-Day)',
      desc: 'Mensaje de motivación y movilización el día de la jornada electoral.',
      text: '¡Hoy es el gran día, [NOMBRE]! Recuerda que las urnas abren hasta las 4:00 PM. Tu lugar de votación es [PUESTO], Mesa [MESA]. Por favor avísanos apenas ejerzas tu derecho al voto. ¡Vamos a ganar!',
    },
  ];

  const handleSelectTemplate = (tpl: typeof templates[0]) => {
    setSelectedTemplate(tpl.id);
    setCustomMessage(tpl.text);
  };

  const buildPersonalizedMessage = (supporter: typeof visibleSupporters[0]) => {
    return customMessage
      .replace(/\[NOMBRE\]/g, supporter.firstName)
      .replace(/\[CEDULA\]/g, formatCedula(supporter.cedula))
      .replace(/\[PUESTO\]/g, supporter.pollingStationName)
      .replace(/\[MESA\]/g, supporter.tableNumber || 'Por confirmar')
      .replace(/\[LIDER\]/g, supporter.registeredByLeaderName || currentUser?.fullName || 'Equipo Central')
      .replace(/\[SECTOR\]/g, supporter.sector || 'tu sector');
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-100">
              Centro de Comunicaciones por WhatsApp
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              WhatsApp Directo
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Envío de recordatorios de puestos de votación, mesas y convocatorias con variables dinámicas
          </p>
        </div>
      </div>

      {/* Template Chooser & Message Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Templates List */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider px-1">
            Plantillas Prediseñadas:
          </label>
          <div className="space-y-2">
            {templates.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tpl)}
                className={`w-full p-3.5 rounded-2xl text-left transition border ${
                  selectedTemplate === tpl.id
                    ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                    : 'bg-neutral-900/80 border-neutral-800 text-neutral-300 hover:bg-neutral-800/80'
                }`}
              >
                <div className="font-bold text-xs">{tpl.title}</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">{tpl.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Message Editor & Variables */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-neutral-900/90 border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-200">
              Mensaje a Enviar (Personalizable)
            </label>
            <div className="text-[11px] text-neutral-400">
              Variables disponibles: <code className="text-emerald-400 font-mono">[NOMBRE]</code>, <code className="text-indigo-400 font-mono">[PUESTO]</code>, <code className="text-amber-400 font-mono">[MESA]</code>
            </div>
          </div>

          <textarea
            rows={4}
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            className="w-full p-3.5 rounded-2xl bg-neutral-950/80 border border-neutral-800 text-xs sm:text-sm text-neutral-100 focus:border-emerald-500 transition leading-relaxed"
            placeholder="Escribe el texto de tu mensaje..."
          />

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-neutral-500 mr-1">Insertar tag:</span>
            {['[NOMBRE]', '[PUESTO]', '[MESA]', '[LIDER]', '[SECTOR]'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setCustomMessage(prev => `${prev} ${tag}`)}
                className="px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-[10px] border border-neutral-700"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recipient Filter */}
      <FilterBar compact />

      {/* Recipients List with 1-Click WhatsApp Trigger */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
          <span className="font-semibold uppercase tracking-wider text-[11px]">
            Destinatarios Filtrados ({visibleSupporters.length} personas):
          </span>
          <span>Haz clic en el botón verde para abrir el chat de WhatsApp con el mensaje listo</span>
        </div>

        <div className="space-y-2.5">
          {visibleSupporters.map((supporter, idx) => {
            const personalized = buildPersonalizedMessage(supporter);
            const waLink = generateWhatsappLink(supporter.phone, personalized);

            return (
              <div
                key={supporter.id}
                className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Person Info */}
                <div className="space-y-1 min-w-0 md:max-w-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-neutral-100 text-xs">
                      {supporter.firstName} {supporter.lastName}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      C.C. {formatCedula(supporter.cedula)}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 flex flex-wrap items-center gap-2">
                    <span className="text-emerald-400 font-medium">{supporter.phone}</span>
                    <span>•</span>
                    <span className="text-indigo-300">{supporter.pollingStationName} (Mesa {supporter.tableNumber || 'S/N'})</span>
                  </div>
                </div>

                {/* Message Preview */}
                <div className="flex-1 p-2.5 rounded-xl bg-neutral-950/70 border border-neutral-800/80 text-[11px] text-neutral-300 italic min-w-0">
                  "{personalized}"
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(personalized, idx)}
                    className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition text-xs flex items-center gap-1"
                    title="Copiar texto del mensaje"
                  >
                    {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => toggleWhatsappContacted(supporter.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm ${
                      supporter.contactedViaWhatsapp
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{supporter.contactedViaWhatsapp ? 'Reenviar WhatsApp' : 'Enviar por WhatsApp'}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
