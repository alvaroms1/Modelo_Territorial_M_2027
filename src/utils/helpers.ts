import { AgeBracket, Gender, Supporter, UserAccount } from '../types';

export function getAgeBracket(age: number): AgeBracket {
  if (age <= 25) return '18-25';
  if (age <= 35) return '26-35';
  if (age <= 50) return '36-50';
  if (age <= 65) return '51-65';
  return '65+';
}

export function formatCedula(cedula: string): string {
  // Format numbers with thousand separators
  const clean = cedula.replace(/\D/g, '');
  if (!clean) return cedula;
  return new Intl.NumberFormat('es-CO').format(Number(clean));
}

export function cleanPhone(phone: string): string {
  return phone.replace(/[^0-9+]/g, '');
}

export function generateWhatsappLink(phone: string, message: string): string {
  let cleaned = cleanPhone(phone);
  // Default to +57 if Colombian 10-digit number without country code
  if (cleaned.length === 10 && cleaned.startsWith('3')) {
    cleaned = '57' + cleaned;
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encoded}`;
}

export function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function getRoleBadge(role: string): { label: string; bg: string; text: string; border: string } {
  switch (role) {
    case 'SUPER_ADMIN':
      return {
        label: 'Director de Movimiento / Super Admin',
        bg: 'bg-rose-950/40',
        text: 'text-rose-400',
        border: 'border-rose-800/60',
      };
    case 'LIDER_COORDINADOR':
      return {
        label: 'Líder Coordinador de Zona',
        bg: 'bg-indigo-950/40',
        text: 'text-indigo-400',
        border: 'border-indigo-800/60',
      };
    case 'SUBLIDER':
      return {
        label: 'Sublíder / Activista de Base',
        bg: 'bg-emerald-950/40',
        text: 'text-emerald-400',
        border: 'border-emerald-800/60',
      };
    default:
      return {
        label: role,
        bg: 'bg-neutral-800',
        text: 'text-neutral-300',
        border: 'border-neutral-700',
      };
  }
}

export function getCommitmentBadge(commitment: string): { label: string; bg: string; text: string; dot: string } {
  switch (commitment) {
    case 'CONFIRMADO':
      return { label: 'Confirmado', bg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400' };
    case 'PENDIENTE':
      return { label: 'Pendiente', bg: 'bg-amber-500/10 text-amber-400 border border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400' };
    case 'POR_CONTACTAR':
      return { label: 'Por Contactar', bg: 'bg-sky-500/10 text-sky-400 border border-sky-500/30', text: 'text-sky-400', dot: 'bg-sky-400' };
    case 'DUDOSO':
      return { label: 'Dudoso', bg: 'bg-rose-500/10 text-rose-400 border border-rose-500/30', text: 'text-rose-400', dot: 'bg-rose-400' };
    default:
      return { label: commitment, bg: 'bg-neutral-800 text-neutral-300 border border-neutral-700', text: 'text-neutral-300', dot: 'bg-neutral-400' };
  }
}
