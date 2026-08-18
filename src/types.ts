export type UserRole = 'SUPER_ADMIN' | 'LIDER_COORDINADOR' | 'SUBLIDER';

export type Gender = 'MASCULINO' | 'FEMENINO' | 'OTRO';

export type AgeBracket = '18-25' | '26-35' | '36-50' | '51-65' | '65+';

export type VotingCommitment = 'CONFIRMADO' | 'PENDIENTE' | 'POR_CONTACTAR' | 'DUDOSO';

export interface PollingStation {
  id: string;
  name: string;
  code: string;
  zone: string; // Comuna / Zona / Municipio
  neighborhood: string; // Barrio
  address: string;
  tablesCount: number; // Número de mesas
  targetVoters: number; // Meta de votantes en este puesto
  coordinatorName?: string;
  coordinatorPhone?: string;
}

export interface UserAccount {
  id: string;
  cedula: string;
  password?: string;
  fullName: string;
  role: UserRole;
  phone: string; // WhatsApp
  email: string;
  sector: string; // Barrio o Comuna
  parentLeaderId?: string; // Si es sublíder, id de su líder principal
  parentLeaderName?: string;
  assignedPollingStationId?: string;
  assignedPollingStationName?: string;
  targetCount: number; // Meta de personas de apoyo a registrar
  avatarColor?: string;
  createdAt: string;
  status: 'ACTIVO' | 'INACTIVO';
}

export interface Supporter {
  id: string;
  cedula: string;
  firstName: string;
  lastName: string;
  phone: string; // WhatsApp
  email?: string;
  gender: Gender;
  age: number;
  ageBracket: AgeBracket;
  neighborhood: string;
  sector: string; // Comuna / Zona
  pollingStationId: string;
  pollingStationName: string;
  tableNumber?: string; // Mesa de votación
  registeredByLeaderId: string;
  registeredByLeaderName: string;
  registeredBySubleaderId?: string;
  registeredBySubleaderName?: string;
  votingCommitment: VotingCommitment;
  contactedViaWhatsapp: boolean;
  votedStatus: boolean; // Para día D
  notes?: string;
  createdAt: string;
}

export interface FilterState {
  searchQuery: string;
  pollingStationId: string;
  sector: string;
  neighborhood: string;
  gender: string;
  ageBracket: string;
  leaderId: string;
  subleaderId: string;
  votingCommitment: string;
}

export interface MovementStats {
  totalSupporters: number;
  totalGoal: number;
  totalLeaders: number;
  totalSubleaders: number;
  totalPollingStations: number;
  byGender: { [key: string]: number };
  byAgeBracket: { [key: string]: number };
  byPollingStation: { [key: string]: number };
  bySector: { [key: string]: number };
  byCommitment: { [key: string]: number };
}
